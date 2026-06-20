#!/usr/bin/env bash
# Patch classifyIntent in intents.ts to add rule-based pre-classification + LLM timeout
set -euo pipefail
FILE="/home/z/my-project/src/lib/prospect-agent/intents.ts"
python3 <<'PYEOF'
import re
fp = "/home/z/my-project/src/lib/prospect-agent/intents.ts"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

# Find the existing classifyIntent function and replace it with the new one.
# Match from the JSDoc "/**\n * Classify the user's message intent using the LLM." up to the closing "}" of classifyIntent
# Use a non-greedy regex anchored on the start of the function

start_marker = "/**\n * Classify the user's message intent using the LLM."
start_idx = content.find(start_marker)
assert start_idx >= 0, "Start marker not found"

# Find the end of the function — it's the line that closes the function (a "}" at column 0 right before the next "/**" for ruleBasedClassification)
end_marker = "\n/**\n * Rule-based intent classification as a fallback"
end_idx = content.find(end_marker, start_idx)
assert end_idx >= 0, "End marker not found"

new_block = '''/**
 * Classify the user's message intent.
 *
 * STRATEGY (rate-limit-resilient, deterministic-first):
 * ----------------------------------------------------
 *  1. PARSE: Run the deterministic query-parser. If it returns
 *     strong structured signals (>=2 fields), use its classification
 *     directly and SKIP the LLM call entirely.
 *
 *  2. RULE-BASED PRE-CLASSIFY: Run the rule-based classifier. If it
 *     returns confidence >= 0.80, USE IT - the LLM almost never
 *     improves on a confident rule-based result for simple queries
 *     like "Research Stripe", "Find Patrick Collison", "Build an ICP".
 *     This eliminates the #1 cause of pipeline stalls: when Z.AI is
 *     rate-limited, the LLM call hangs 60s waiting for cooldown.
 *
 *  3. LLM (TIME-BOXED): If rule-based returned confidence < 0.80,
 *     consult the LLM with a STRICT 15-second timeout. If the LLM
 *     does not respond in 15s (typically because Z.AI is in
 *     rate-limit cooldown), fall back to the rule-based result
 *     immediately - do NOT block the pipeline for 60s+.
 *
 * This three-tier strategy ensures intent classification NEVER takes
 * more than ~16 seconds, even when Z.AI is completely unreachable.
 */
export async function classifyIntent(
  userMessage: string,
  context?: ConversationContext,
): Promise<IntentClassification> {
  // --- Tier 1: Deterministic parse for rich/structured queries ---
  const parsed = parseQuery(userMessage);

  const PARSER_CONFIDENCE_THRESHOLD = 0.78;
  const PARSER_MIN_SIGNALS = 2;

  if (
    parsed.confidence >= PARSER_CONFIDENCE_THRESHOLD &&
    parsed.signalsProvided >= PARSER_MIN_SIGNALS &&
    (parsed.guessedIntent === 'research_person' ||
     parsed.guessedIntent === 'research_company' ||
     parsed.guessedIntent === 'research_url')
  ) {
    const personaForIntent: Record<string, AgentPersona> = {
      research_person: 'hound',
      research_company: 'scout',
      research_url: 'scout',
    };

    const location = [parsed.city, parsed.stateProvince, parsed.country]
      .filter(Boolean)
      .join(', ') || null;

    return {
      intent: parsed.guessedIntent,
      persona: personaForIntent[parsed.guessedIntent],
      confidence: parsed.confidence,
      reasoning: `Pre-classified by query parser: ${parsed.reasoning} (${parsed.signalsProvided} structured fields extracted)`,
      extractedEntities: {
        companyName: parsed.companyName,
        personName: parsed.personName,
        url: parsed.url,
        industry: parsed.industry,
        location,
      },
      clarifyingQuestion: null,
      prepopulatedProspect: parsed.prepopulatedProspect as Record<string, unknown>,
      signalsProvided: parsed.signalsProvided,
    };
  }

  // --- Tier 2: Rule-based pre-classification (no LLM call) ---
  // The rule-based classifier handles ALL of these cases confidently:
  //   - "Research Stripe"            -> research_company (0.75)
  //   - "Find Patrick Collison"      -> research_person  (0.80)
  //   - "Build an ICP for SaaS"      -> build_icp        (0.90)
  //   - "Write an email to Stripe"   -> research_company (0.85, secondary: compose_outreach)
  //   - "Is Stripe a good lead?"     -> research_company (0.85, secondary: score_lead)
  //   - "Score this"                 -> score_lead       (0.95)
  //   - "Analyze the SaaS market"    -> analyze_market   (0.85)
  //
  // When rule-based confidence is >= 0.80, skip the LLM entirely -
  // it almost never improves on a confident rule-based result, and
  // calling it wastes a rate-limit slot AND adds 3-15s of latency.
  const ruleBased = ruleBasedClassification(userMessage, context);

  const RULE_BASED_CONFIDENT_THRESHOLD = 0.80;
  const useRuleBasedDirectly =
    ruleBased.confidence >= RULE_BASED_CONFIDENT_THRESHOLD ||
    ruleBased.intent === 'clarify' ||        // Clarifications don't need LLM
    ruleBased.intent === 'converse' ||       // Pure conversation doesn't need LLM
    ruleBased.intent === 'add_to_pipeline';  // Pure pipeline action doesn't need LLM

  // Merge parser fields into rule-based result for downstream use
  const location = [parsed.city, parsed.stateProvince, parsed.country]
    .filter(Boolean)
    .join(', ') || null;
  const mergedRuleBased: IntentClassification = {
    ...ruleBased,
    extractedEntities: {
      ...ruleBased.extractedEntities,
      personName: ruleBased.extractedEntities.personName || parsed.personName,
      companyName: ruleBased.extractedEntities.companyName || parsed.companyName,
      url: ruleBased.extractedEntities.url || parsed.url,
      industry: ruleBased.extractedEntities.industry || parsed.industry,
      location: ruleBased.extractedEntities.location || location,
    },
    prepopulatedProspect: parsed.prepopulatedProspect as Record<string, unknown> | undefined,
    signalsProvided: parsed.signalsProvided,
  };

  if (useRuleBasedDirectly) {
    if (ruleBased.confidence >= RULE_BASED_CONFIDENT_THRESHOLD) {
      console.log(`[IntentClassifier] Rule-based confident (${Math.round(ruleBased.confidence * 100)}%) - skipping LLM: intent=${ruleBased.intent}`);
    }
    return mergedRuleBased;
  }

  // --- Tier 3: LLM classification (time-boxed to 15 seconds) ---
  // Only consult the LLM when rule-based confidence is < 0.80 - i.e.,
  // genuinely ambiguous queries. Use a hard 15s timeout so we never
  // block the pipeline when Z.AI is rate-limited.
  const LLM_TIMEOUT_MS = 15_000;

  try {
    const llmPromise = callLLMForJSON<IntentClassification>(
      getIntentClassificationPrompt(userMessage, context),
      `User message to classify: "${userMessage}"`,
      {
        retriesPerModel: 1,
        // Quick thinking budget - intent classification doesn't need deep reasoning
        thinkingBudget: 'quick',
        maxTokens: 1024,
      },
    );

    // Race against timeout - if LLM doesn't respond in time, fall back to rule-based.
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => {
        console.warn(`[IntentClassifier] LLM classification timed out after ${LLM_TIMEOUT_MS}ms - using rule-based fallback (intent=${ruleBased.intent})`);
        resolve(null);
      }, LLM_TIMEOUT_MS);
    });

    const result = await Promise.race([llmPromise, timeoutPromise]);

    if (result && result.intent && result.persona) {
      const validIntents: UserIntent[] = [
        'research_company', 'research_person', 'research_url',
        'analyze_market', 'analyze_competitors', 'build_icp',
        'score_lead', 'compose_outreach', 'refine_search',
        'add_to_pipeline', 'clarify', 'converse',
      ];
      if (validIntents.includes(result.intent)) {
        return {
          ...result,
          extractedEntities: {
            companyName: result.extractedEntities?.companyName || parsed.companyName,
            personName: result.extractedEntities?.personName || parsed.personName,
            url: result.extractedEntities?.url || parsed.url,
            industry: result.extractedEntities?.industry || parsed.industry,
            location: result.extractedEntities?.location || location,
          },
          prepopulatedProspect: parsed.prepopulatedProspect as Record<string, unknown> | undefined,
          signalsProvided: parsed.signalsProvided,
        };
      }
    }
  } catch (error) {
    console.warn('[IntentClassifier] LLM classification failed, falling back to rules:', error);
  }

  // Fall back to rule-based result (already merged with parser data above)
  return mergedRuleBased;
}
'''

new_content = content[:start_idx] + new_block + content[end_idx:]
with open(fp, "w", encoding="utf-8") as f:
    f.write(new_content)
print("PATCHED OK")
PYEOF
