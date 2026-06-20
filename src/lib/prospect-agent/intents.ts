// ============================================================
// Prospect Discovery Agent — Intent Classification Engine
// ============================================================

import { callLLMForJSON } from '@/lib/llm';
import type { AgentPersona, UserIntent, ConversationContext, AgentThinking } from './types';
import { getIntentClassificationPrompt } from './prompts';
import { parseQuery } from './query-parser';

/**
 * Result of intent classification.
 */
export interface IntentClassification {
  intent: UserIntent;
  persona: AgentPersona;
  confidence: number;
  reasoning: string;
  extractedEntities: {
    companyName: string | null;
    personName: string | null;
    url: string | null;
    industry: string | null;
    location: string | null;
  };
  clarifyingQuestion: string | null;
  secondaryIntent?: UserIntent | null;
  /**
   * Pre-populated prospect data extracted directly from the user's query.
   * The downstream agents should MERGE this into the empty prospect they
   * create, so the user immediately sees all the data they provided
   * rendered in the workspace — even if every external search fails.
   */
  prepopulatedProspect?: Record<string, unknown>;
  /** How many structured signals the user provided in the query. */
  signalsProvided?: number;
}

/**
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

/**
 * Rule-based intent classification as a fallback when LLM is unavailable.
 * Enhanced with multi-intent detection, context awareness, and smarter patterns.
 *
 * SECURITY: Input is truncated to MAX_INPUT_LENGTH before regex processing
 * to prevent polynomial-time ReDoS on uncontrolled user input (CodeQL fix).
 * All regex patterns are designed to be linear-time by avoiding:
 * - Nested quantifiers like (a+)+ or (a*)*
 * - Overlapping alternations like (a|a)b
 * - Unbounded backreference patterns
 */
const MAX_INPUT_LENGTH = 500;

function ruleBasedClassification(
  userMessage: string,
  context?: ConversationContext,
): IntentClassification {
  // Truncate input to prevent ReDoS on polynomial regex patterns
  const safeMsg = userMessage.length > MAX_INPUT_LENGTH 
    ? userMessage.slice(0, MAX_INPUT_LENGTH) 
    : userMessage;
  const msg = safeMsg.trim().toLowerCase();
  const originalMsg = safeMsg.trim();

  // ============================================================
  // Multi-intent detection: queries that imply chaining actions
  // ============================================================

  // "Research X and write them" / "Tell me about X and email them"
  // Use {1,80} instead of .+? to prevent polynomial backtracking (CodeQL fix)
  // Limit to 80 chars which is more than enough for a company/person name
  const researchAndOutreach = msg.match(/(?:research|tell me about|look up|find info on|analyze)\s+([\w\s]{1,80}?)(?:\s+and\s+(?:write|email|compose|reach out|send|draft))/i);
  if (researchAndOutreach) {
    const entity = researchAndOutreach[1].trim();
    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.9,
      reasoning: 'User wants to research and then compose outreach',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
      secondaryIntent: 'compose_outreach',
    };
  }

  // "Research X and score it" / "Tell me about X, is it a good lead?"
  const researchAndScore = msg.match(/(?:research|tell me about|look up|find info on)\s+([\w\s]{1,80}?)(?:\s+and\s+(?:score|evaluate|qualify|rate))/i);
  if (researchAndScore) {
    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.9,
      reasoning: 'User wants to research and then score the lead',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
      secondaryIntent: 'score_lead',
    };
  }

  // "Is X a good lead?" (implies research + score)
  if (/is\s+.+\s+a good lead/i.test(msg) || /should (?:we|I) target/i.test(msg)) {
    const companyName = originalMsg.replace(/^is\s+/i, '').replace(/\s+a good lead.*$/i, '').trim();
    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.85,
      reasoning: 'User asking if something is a good lead implies research + scoring',
      extractedEntities: { ...extractEntities(originalMsg), companyName },
      clarifyingQuestion: null,
      secondaryIntent: 'score_lead',
    };
  }

  // ============================================================
  // Context-aware follow-up detection
  // ============================================================

  const hasRecentProspects = context?.recentProspects && context.recentProspects.length > 0;

  // "Score it" / "Score this" / "Evaluate" — refers to recent prospect
  if (hasRecentProspects && /^(?:score|evaluate|qualify|rate|assess)\s*(?:it|this|them|that)?$/i.test(msg)) {
    return {
      intent: 'score_lead',
      persona: 'judge',
      confidence: 0.95,
      reasoning: 'User wants to score the most recently discussed prospect',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // "Write to them" / "Compose outreach" / "Email them" — refers to recent prospect
  if (hasRecentProspects && /^(?:write|compose|email|reach out|send|draft)\s*(?:to\s+)?(?:it|this|them|that|him|her)?$/i.test(msg)) {
    return {
      intent: 'compose_outreach',
      persona: 'scribe',
      confidence: 0.95,
      reasoning: 'User wants to compose outreach for the most recently discussed prospect',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // "Add to leads" / "Convert" / "Save this" — pipeline action
  if (hasRecentProspects && /^(?:add|convert|save)\s*(?:it|this|them|that)?$/i.test(msg)) {
    return {
      intent: 'add_to_pipeline',
      persona: 'navigator',
      confidence: 0.95,
      reasoning: 'User wants to add the most recently discussed prospect to leads',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // "Find more" / "Similar" / "Others like this" — refine search
  if (hasRecentProspects && /^(?:more|similar|find more|find similar|others like this|show me more|any others)$/i.test(msg)) {
    return {
      intent: 'refine_search',
      persona: 'scout',
      confidence: 0.95,
      reasoning: 'User wants to find prospects similar to the recently discussed one',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // ============================================================
  // Single-intent classification
  // ============================================================

  // URL detection
  const urlPattern = /^https?:\/\/[^\s]+/i;
  if (urlPattern.test(originalMsg)) {
    return {
      intent: 'research_url',
      persona: 'scout',
      confidence: 0.95,
      reasoning: 'Message starts with a URL',
      extractedEntities: { companyName: null, personName: null, url: originalMsg, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Add to pipeline keywords
  const addKeywords = ['add to lead', 'add to pipeline', 'convert to lead', 'save this lead', 'add this prospect', 'add to my leads'];
  if (addKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'add_to_pipeline',
      persona: 'navigator',
      confidence: 0.9,
      reasoning: 'User wants to add a prospect to leads',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // ICP building keywords
  const icpKeywords = ['build icp', 'ideal customer', 'target profile', 'define my icp', 'create icp', 'icp for', 'customer profile', 'target customer', 'buyer persona', 'who should i target', 'who is my ideal'];
  if (icpKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'build_icp',
      persona: 'architect',
      confidence: 0.9,
      reasoning: 'User wants to build or define an ICP',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
    };
  }

  // Scoring keywords — enhanced with more patterns
  const scoreKeywords = ['score this', 'score it', 'qualify this', 'qualify it', 'is this a good lead', 'rate this', 'how good is', 'evaluate this', 'evaluate it', 'should i pursue', 'worth pursuing', 'how likely', 'is this worth', 'assess this lead'];
  if (scoreKeywords.some(k => msg.includes(k))) {
    // If there are recent prospects, score against those
    if (hasRecentProspects) {
      return {
        intent: 'score_lead',
        persona: 'judge',
        confidence: 0.9,
        reasoning: 'User wants to score/qualify a lead',
        extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
    // No recent prospects — need to research first
    const entity = originalMsg.replace(/^(?:is|score|qualify|rate|evaluate|how good is|assess)\s+/i, '').replace(/\s*(?:a good lead|worth pursuing|this lead|it|this)$/i, '').trim();
    if (entity.length > 2) {
      return {
        intent: 'research_company',
        persona: 'scout',
        confidence: 0.85,
        reasoning: 'User wants to score a lead, but no recent prospect — need to research first',
        extractedEntities: { companyName: entity, personName: null, url: null, industry: null, location: null },
        clarifyingQuestion: null,
        secondaryIntent: 'score_lead',
      };
    }
    return {
      intent: 'score_lead',
      persona: 'judge',
      confidence: 0.7,
      reasoning: 'User wants to score a lead',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: 'I can score a lead for you, but I need to know which company or person to evaluate. Could you provide a name?',
    };
  }

  // Outreach keywords — enhanced patterns
  const outreachKeywords = ['write an email', 'compose outreach', 'draft message', 'linkedin message', 'cold email', 'write to', 'reach out to', 'compose', 'send a message', 'write them', 'email them', 'draft an email', 'compose email', 'write a message', 'craft a message', 'craft an email'];
  if (outreachKeywords.some(k => msg.includes(k))) {
    // Check if there are recent prospects to write to
    if (hasRecentProspects) {
      return {
        intent: 'compose_outreach',
        persona: 'scribe',
        confidence: 0.9,
        reasoning: 'User wants to compose outreach',
        extractedEntities: extractEntities(originalMsg),
        clarifyingQuestion: null,
      };
    }
    // Extract who they want to write to
    const target = originalMsg.replace(/^(?:write|compose|draft|reach out|send|email|craft)\s*(?:an?\s*)?(?:email|message|outreach|connection)?\s*(?:to\s*)?/i, '').trim();
    if (target.length > 2) {
      return {
        intent: 'research_company',
        persona: 'scout',
        confidence: 0.85,
        reasoning: 'User wants to compose outreach but need to research the target first',
        extractedEntities: { companyName: target, personName: null, url: null, industry: null, location: null },
        clarifyingQuestion: null,
        secondaryIntent: 'compose_outreach',
      };
    }
    return {
      intent: 'compose_outreach',
      persona: 'scribe',
      confidence: 0.9,
      reasoning: 'User wants to compose outreach',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
    };
  }

  // Market analysis keywords
  const marketKeywords = ['market analysis', 'market size', 'industry trend', 'competitive landscape', 'market research', 'trends in', 'landscape of', 'market overview', 'industry overview', 'industry analysis', 'tam', 'sam', 'som', 'total addressable'];
  if (marketKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'analyze_market',
      persona: 'analyst',
      confidence: 0.85,
      reasoning: 'User wants market/industry analysis',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
    };
  }

  // Competitor analysis keywords
  const competitorKeywords = ['competitor', 'competition', 'alternative to', 'compare', 'versus', ' vs ', 'similar to', 'competitors of', 'who competes with', 'who are the competitors'];
  if (competitorKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'analyze_competitors',
      persona: 'analyst',
      confidence: 0.85,
      reasoning: 'User wants competitive analysis',
      extractedEntities: extractEntities(originalMsg),
      clarifyingQuestion: null,
    };
  }

  // Refine search keywords
  const refineKeywords = ['more like this', 'similar companies', 'find more', 'other companies like', 'show me similar', 'find similar', 'more like that', 'anything similar'];
  if (refineKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'refine_search',
      persona: 'scout',
      confidence: 0.85,
      reasoning: 'User wants to find similar prospects',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // ─── Conversation / help / greetings ───────────────────────────
  // Catch common conversational queries ("what can you do?", "help",
  // "hi", "hello", "thanks") BEFORE the catch-all company fallback
  // (which matches anything longer than 3 chars).
  const converseKeywords = [
    'what can you do', 'what do you do', 'how do you work', 'help me',
    'help', 'hi', 'hello', 'hey', 'greetings', 'thanks', 'thank you',
    'who are you', 'what are you', 'introduce yourself', 'capabilities',
    'features', 'what is leadreach', 'about you',
  ];
  if (converseKeywords.some(k => msg === k || msg.startsWith(k + ' ') || msg.startsWith(k + '?') || msg.startsWith(k + '!') || msg.startsWith(k + '.'))) {
    return {
      intent: 'converse',
      persona: 'navigator',
      confidence: 0.9,
      reasoning: 'User is asking a conversational/help question',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // --- Prefix-stripping for "research/find/tell me about X" queries ---
  // Before we try to match the message against a person-name pattern, strip
  // any leading "research", "find", "look up", "tell me about", "info on",
  // "discover", "about", "what is", "who is" prefix. This prevents queries
  // like "Research Stripe" or "Tell me about Notion" from being misread as
  // a person name (where "Research" looks like a first name).
  //
  // The remaining text is then classified by length:
  //   - 1 word        -> company (e.g., "Stripe", "Notion")
  //   - 2 words       -> ambiguous - could be "Patrick Collison" (person) OR
  //                     "Apple Inc" (company). Use a heuristic: if the second
  //                     word is a known company suffix (Inc, Corp, Ltd, GmbH,
  //                     LLC, SA), it is a company. Otherwise, person.
  //   - 3-4 words     -> person (full names are typically 2-4 words)
  //   - 5+ words      -> company (long names like "Bank of America")
  const RESEARCH_PREFIX_RE = /^(?:research|find|look up|tell me about|info on|discover|about|what is|who is|search for|search)\s+(.+)$/i;
  const prefixMatch = originalMsg.match(RESEARCH_PREFIX_RE);
  const strippedMsg = prefixMatch ? prefixMatch[1].trim() : originalMsg;

  // Company suffixes - if the LAST word matches one of these, it is a company.
  const COMPANY_SUFFIX_RE = /\b(?:inc|corp|corporation|ltd|limited|gmbh|sa|llc|co|company|ag|plc|pty|pvt|bv|nv|oy|ab|as|sarl)\.?(?:\s|$)/i;
  const hasCompanySuffix = COMPANY_SUFFIX_RE.test(strippedMsg);

  // Word count of the stripped message
  const strippedWordCount = strippedMsg.split(/\s+/).filter(Boolean).length;

  // Person name detection (2-4 capitalized words, no numbers)
  // Must be at least 2 words to avoid matching single-word company names like "Stripe", "Notion", etc.
  const personPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/;
  // Use originalMsg (case preserved) for the prefix regex - the lowercase `msg`
  // version was broken because [A-Z] never matches lowercase letters.
  //
  // We use explicit character classes [Rr]esearch etc. instead of the `i`
  // flag because the `i` flag would also make the captured name group
  // case-insensitive, which would let "find patrick collison" match (and
  // capture "patrick collison" with lowercase letters, which isn't a
  // properly-formatted person name).
  //
  // The captured name group still requires proper case (Capitalized first
  // letter), so "Find patrick collison" will NOT match (lowercase name),
  // but "Find Patrick Collison" WILL match.
  const personWithPrefix = originalMsg.match(/^(?:[Rr]esearch|[Ff]ind|[Ll]ook up|[Tt]ell me about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);

  if (personWithPrefix && personWithPrefix[1] && !hasCompanySuffix) {
    // Multi-word name after a research prefix - likely a person
    const name = personWithPrefix[1];
    const wordCount = name.split(/\s+/).length;
    if (wordCount >= 2) {
      return {
        intent: 'research_person',
        persona: 'hound',
        confidence: 0.85,
        reasoning: 'Multi-word name after research prefix suggests person search',
        extractedEntities: { companyName: null, personName: name, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
  } else if (!prefixMatch && personPattern.test(originalMsg) && !hasCompanySuffix && strippedWordCount >= 2 && strippedWordCount <= 4) {
    // Only treat as person name if there was NO research prefix.
    // (Without this guard, "Research Stripe" would be misread as a person
    // named "Research Stripe".)
    return {
      intent: 'research_person',
      persona: 'hound',
      confidence: 0.80,
      reasoning: 'Message matches a person name pattern (multi-word, no research prefix)',
      extractedEntities: { companyName: null, personName: originalMsg, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Company research detection - handles "Research Stripe", "Find Notion",
  // "Tell me about Apple Inc", etc.
  // If we got here via a research prefix, the stripped text is the company name.
  const companyKeywords = ['company', 'corp', 'inc', 'ltd', 'gmbh', 'sa', 'llc', 'find', 'search', 'research', 'look up', 'tell me about', 'info on', 'discover', 'about', 'what is', 'who is'];
  if (companyKeywords.some(k => msg.includes(k)) || originalMsg.length > 3) {
    // Check for follow-up patterns with context
    if (hasRecentProspects) {
      const followUpPatterns = ['what about', 'and', 'also', 'another', 'next', 'more'];
      if (followUpPatterns.some(p => msg.startsWith(p))) {
        return {
          intent: 'refine_search',
          persona: 'scout',
          confidence: 0.7,
          reasoning: 'Follow-up query after previous research',
          extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
          clarifyingQuestion: null,
        };
      }
    }

    // Extract company name from the message.
    // If there was a research prefix, prefer the stripped text as the company name
    // (so "Research Stripe" → companyName="Stripe", not "Research Stripe").
    const companyName = prefixMatch ? strippedMsg : extractCompanyName(originalMsg);

    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.80,
      reasoning: prefixMatch
        ? `Company research query (prefix "${prefixMatch[0].split(/\s+/)[0]}" stripped → "${companyName}")`
        : 'Message appears to be a company search query',
      extractedEntities: { companyName, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Vague or unclear
  return {
    intent: 'clarify',
    persona: 'navigator',
    confidence: 0.5,
    reasoning: 'Could not determine clear intent from the message',
    extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
    clarifyingQuestion: "I'd love to help! Could you tell me more specifically what you're looking for? For example:\n• Research a specific company\n• Find information about a person\n• Analyze a market or industry\n• Build an Ideal Customer Profile\n• Compose an outreach message",
  };
}

/**
 * Extract entities from a user message using simple patterns.
 * Input is truncated to prevent ReDoS.
 */
function extractEntities(message: string): IntentClassification['extractedEntities'] {
  // Truncate to prevent ReDoS on uncontrolled input
  const safeMessage = message.length > MAX_INPUT_LENGTH ? message.slice(0, MAX_INPUT_LENGTH) : message;
  const entities: IntentClassification['extractedEntities'] = {
    companyName: null,
    personName: null,
    url: null,
    industry: null,
    location: null,
  };

  // URL extraction
  const urlMatch = safeMessage.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) entities.url = urlMatch[0];

  // Industry extraction
  const industryPatterns = [
    /(?:in the|in|for the)\s+(\w+(?:\s+\w+)?)\s+(?:industry|market|sector|space)/i,
    /(\w+(?:\s+\w+)?)\s+(?:industry|market|sector|space)/i,
  ];
  for (const pattern of industryPatterns) {
    const match = safeMessage.match(pattern);
    if (match) { entities.industry = match[1].trim(); break; }
  }

  // Location extraction
  const locationPatterns = [
    /(?:in|from|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];
  for (const pattern of locationPatterns) {
    const match = safeMessage.match(pattern);
    if (match) { entities.location = match[1].trim(); break; }
  }

  return entities;
}

/**
 * Extract a company name from a user message by stripping common prefixes.
 * Input is truncated to prevent ReDoS.
 */
function extractCompanyName(message: string): string {
  // Truncate to prevent ReDoS on polynomial regex
  const safeMessage = message.length > MAX_INPUT_LENGTH ? message.slice(0, MAX_INPUT_LENGTH) : message;
  let cleaned = safeMessage
    .replace(/^(?:tell me about|research|look up|find info on|find|search for|info on|about|what is|who is|discover|analyze)\s+/i, '')
    .replace(/\s*please\s*$/i, '')
    .trim();

  // If the result is too long, it's probably not just a company name
  if (cleaned.split(/\s+/).length > 6) {
    cleaned = safeMessage.trim(); // Use the truncated original
  }

  return cleaned;
}

/**
 * Convert a classified intent into an AgentThinking object for UI display.
 */
export function intentToThinking(classification: IntentClassification): AgentThinking {
  const planMap: Record<UserIntent, string[]> = {
    research_company: [
      'Searching the web for company information',
      'Checking LinkedIn for company profile',
      'Researching key contacts and decision makers',
      'Finding recent news and activity',
      'Compiling comprehensive company profile',
    ],
    research_person: [
      'Searching the web for professional information',
      'Checking LinkedIn for profile data',
      'Researching associated company',
      'Checking Twitter/X for social presence',
      'Compiling comprehensive person profile',
    ],
    research_url: [
      'Reading and analyzing the webpage',
      'Extracting business intelligence with AI',
      'Deep researching the identified company',
      'Compiling comprehensive profile from URL',
    ],
    analyze_market: [
      'Searching for market and industry data',
      'Analyzing competitive landscape',
      'Identifying key trends and opportunities',
      'Compiling market analysis report',
    ],
    analyze_competitors: [
      'Identifying main competitors',
      'Researching each competitor in depth',
      'Analyzing strengths and weaknesses',
      'Compiling competitive comparison',
    ],
    build_icp: [
      'Understanding your business and target market',
      'Defining firmographic criteria',
      'Identifying technographic requirements',
      'Assessing behavioral and economic factors',
      'Finalizing ICP with recommendations',
    ],
    score_lead: [
      'Evaluating firmographic fit',
      'Checking technographic alignment',
      'Assessing behavioral signals',
      'Analyzing economic viability',
      'Calculating overall lead score',
    ],
    compose_outreach: [
      'Researching the target company and contact',
      'Identifying personalization hooks',
      'Crafting personalized message',
      'Optimizing call-to-action',
    ],
    refine_search: [
      'Analyzing previous research results',
      'Identifying similar companies/contacts',
      'Searching for matching prospects',
      'Compiling refined results',
    ],
    add_to_pipeline: [
      'Validating prospect data',
      'Creating lead record in database',
      'Updating campaign metrics',
    ],
    clarify: [
      'Analyzing your request',
      'Preparing clarifying questions',
    ],
    converse: [
      'Processing your message',
      'Generating helpful response',
    ],
  };

  // If there's a secondary intent, add it to the plan
  const plan = [...(planMap[classification.intent] || ['Processing your request'])];
  if (classification.secondaryIntent) {
    plan.push(`Then: ${planMap[classification.secondaryIntent]?.[0] || 'Executing follow-up action'}`);
  }

  return {
    persona: classification.persona,
    intent: classification.intent,
    reasoning: classification.reasoning,
    plan,
    clarifyingQuestion: classification.clarifyingQuestion || undefined,
    confidence: classification.confidence,
  };
}
