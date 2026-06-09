// ============================================================
// Prospect Discovery Agent — Main Agent Loop
// ============================================================

import type {
  AgentPersona,
  UserIntent,
  AgentMessage,
  AgentThinking,
  AgentAction,
  ConversationContext,
  ProspectResult,
  ICPResult,
  SuggestedAction,
  InsightItem,
  NavigationSuggestion,
  MarketResult,
  OutreachResult,
  ScoreResult,
  ViewType,
} from './types';
import { classifyIntent, intentToThinking, type IntentClassification } from './intents';
import {
  executeCompanyResearch,
  executePersonResearch,
  executeUrlResearch,
  executeMarketAnalysis,
  executeCompetitiveAnalysis,
  executeICPBuilding,
  executeLeadScoring,
  executeOutreachComposition,
  generateConversationResponse,
  type ProgressCallback,
} from './actions';
import { PERSONA_META } from './types';

/**
 * Process a user message through the agent pipeline.
 * This is the main entry point for the agent chat API.
 *
 * Flow:
 * 1. Classify intent (LLM + rule-based fallback)
 * 2. Generate thinking/plan for UI display
 * 3. Execute the appropriate action pipeline
 * 4. If multi-intent detected, execute secondary action
 * 5. Generate a conversational response with proactive suggestions
 * 6. Return the complete agent message with suggested actions
 */
export async function processAgentMessage(
  userMessage: string,
  context?: ConversationContext,
  forceIntent?: UserIntent,
  onProgress?: ProgressCallback,
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
}> {
  const startTime = Date.now();

  try {
    return await processAgentMessageInner(userMessage, context, forceIntent, startTime, onProgress);
  } catch (error) {
    // Top-level safety net: never let an unhandled error escape.
    // This ensures the chat route always gets a valid result to return.
    console.error('[AgentLoop] FATAL: Unhandled error in processAgentMessage:', error);

    const fallbackContext: ConversationContext = context || {
      recentProspects: [],
      activeICP: null,
      lastIntent: null,
      lastPersona: null,
      userPreferences: {},
    };

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const isGatewayError = errorMsg.includes('502') || errorMsg.includes('Bad Gateway')
      || errorMsg.includes('HTML instead') || errorMsg.includes('gateway error');

    return {
      message: {
        id: `agent-fallback-${Date.now()}`,
        role: 'assistant',
        content: isGatewayError
          ? "I'm having trouble connecting to the AI service right now. The servers may be temporarily overloaded. Please try again in a few seconds — your message will be processed freshly."
          : `I encountered an unexpected error while processing your request. Please try again or rephrase your question.\n\nError: ${errorMsg.slice(0, 150)}`,
        timestamp: new Date(),
        persona: 'navigator',
        thinking: {
          persona: 'navigator',
          intent: 'converse',
          reasoning: `Fallback handler: ${errorMsg.slice(0, 100)}`,
          plan: ['Error recovery'],
          confidence: 0.1,
        },
        actions: [{ type: 'converse', label: 'Error', status: 'failed', message: errorMsg.slice(0, 100) }],
      },
      updatedContext: fallbackContext,
      suggestedActions: [
        { label: 'Try Again', prompt: userMessage, icon: 'RefreshCw' },
        { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
      ],
    };
  }
}

/**
 * Quick rule-based intent classifier for OBVIOUS patterns.
 * Returns null if the pattern isn't obvious (fall through to LLM).
 * This saves 5-15 seconds per request by skipping the LLM classification.
 */
function ruleBasedClassifyIfObvious(
  userMessage: string,
  context?: ConversationContext,
): IntentClassification | null {
  const msg = userMessage.trim().toLowerCase();
  const original = userMessage.trim();

  // URL → research_url
  if (/^https?:\/\/[^\s]+/i.test(original)) {
    return {
      intent: 'research_url',
      persona: 'scout',
      confidence: 0.95,
      reasoning: 'Message starts with a URL',
      extractedEntities: { companyName: null, personName: null, url: original, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // "Research X" / "Tell me about X" / "Analyze X" — most common pattern
  const researchPrefix = msg.match(/^(?:research|tell me about|look up|find info on|analyze|please research|company:)\s+(.+)/i);
  if (researchPrefix) {
    const entity = researchPrefix[1].trim();
    // Check if entity looks like a company name first
    const companyIndicators = /(?:capital|ventures|partners|group|inc|llc|corp|ltd|gmbh|firm|fund|bank|holdings|associates|consulting|labs|studio|agency|horowitz|sachs|stanley|co\.|&\s)/i;
    if (companyIndicators.test(entity)) {
      const cleanEntity = entity.replace(/["']/g, '').trim();
      return {
        intent: 'research_company',
        persona: 'scout',
        confidence: 0.92,
        reasoning: 'Entity contains company name indicators',
        extractedEntities: { companyName: cleanEntity, personName: null, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
    // Multi-word after prefix: check if person
    const personWithPrefix = entity.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)$/);
    if (personWithPrefix && personWithPrefix[1].split(/\s+/).length >= 2) {
      return {
        intent: 'research_person',
        persona: 'hound',
        confidence: 0.8,
        reasoning: 'Multi-word name after research prefix',
        extractedEntities: { companyName: null, personName: personWithPrefix[1], url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
    // Default: company research
    const cleanEntity = entity.replace(/["']/g, '').trim();
    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.9,
      reasoning: 'Research prefix with entity name',
      extractedEntities: { companyName: cleanEntity, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // "Build an ICP" / "Create an ICP"
  if (/^(?:build|create|define|make)\s+(?:an?\s*)?icp/i.test(msg)) {
    return {
      intent: 'build_icp',
      persona: 'architect',
      confidence: 0.9,
      reasoning: 'ICP building request',
      extractedEntities: extractEntities(original),
      clarifyingQuestion: null,
    };
  }

  // "Write an email" / "Compose outreach"
  if (/^(?:write|compose|draft|send|email|reach out|craft)\s+(?:an?\s*)?(?:email|message|outreach)/i.test(msg)) {
    return {
      intent: 'compose_outreach',
      persona: 'scribe',
      confidence: 0.9,
      reasoning: 'Outreach composition request',
      extractedEntities: extractEntities(original),
      clarifyingQuestion: null,
    };
  }

  // Simple company name (single word or short phrase, no question marks)
  if (/^[A-Z][a-zA-Z0-9&\s]{1,40}$/.test(original) && !original.includes('?')) {
    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.75,
      reasoning: 'Looks like a company name',
      extractedEntities: { companyName: original.trim(), personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Not obvious enough — let the LLM classify
  return null;
}

/**
 * Quick entity extraction for rule-based classification.
 */
function extractEntities(message: string): IntentClassification['extractedEntities'] {
  const entities: IntentClassification['extractedEntities'] = {
    companyName: null, personName: null, url: null, industry: null, location: null,
  };
  const urlMatch = message.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) entities.url = urlMatch[0];
  return entities;
}

/**
 * Inner implementation of processAgentMessage — all logic lives here
 * so the outer wrapper can catch any unhandled errors.
 */
async function processAgentMessageInner(
  userMessage: string,
  context: ConversationContext | undefined,
  forceIntent: UserIntent | undefined,
  startTime: number,
  onProgress?: ProgressCallback,
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
}> {

  // Step 1: Classify intent
  let classification: IntentClassification;
  if (forceIntent) {
    // Use forced intent with rule-based persona selection
    const personas: Record<UserIntent, AgentPersona> = {
      research_company: 'scout',
      research_person: 'hound',
      research_url: 'scout',
      analyze_market: 'analyst',
      analyze_competitors: 'analyst',
      build_icp: 'architect',
      score_lead: 'judge',
      compose_outreach: 'scribe',
      refine_search: 'scout',
      add_to_pipeline: 'navigator',
      clarify: 'navigator',
      converse: 'navigator',
    };
    classification = {
      intent: forceIntent,
      persona: personas[forceIntent],
      confidence: 1.0,
      reasoning: 'Intent was explicitly specified',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  } else {
    // Try rule-based classification FIRST for obvious patterns (instant, no LLM needed)
    // This saves 5-15 seconds on every request that matches clear patterns
    const ruleBased = ruleBasedClassifyIfObvious(userMessage, context);
    if (ruleBased) {
      classification = ruleBased;
    } else {
      classification = await classifyIntent(userMessage, context);
    }
  }

  const thinking: AgentThinking = intentToThinking(classification);

  // Emit thinking event if progress callback is provided
  onProgress?.('thinking', thinking);

  // Step 2: Execute actions based on intent
  let actions: AgentAction[] = [];
  let prospectData: ProspectResult | undefined;
  let icpData: ICPResult | undefined;
  let outreachData: unknown;
  let marketData: unknown;
  let scoreData: unknown;
  let responseContent = '';
  let updatedContext: ConversationContext = context || {
    recentProspects: [],
    activeICP: null,
    lastIntent: null,
    lastPersona: null,
    userPreferences: {},
  };

  switch (classification.intent) {
    case 'research_company': {
      const companyName = classification.extractedEntities.companyName || userMessage.trim();
      const result = await executeCompanyResearch(companyName, onProgress);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = buildResearchSummary(result.prospect);
        try {
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );
        } catch {
          // LLM unavailable — use fallback template-based response
        }
        if (!responseContent && prospectData) {
          responseContent = buildFallbackResponse(prospectData, classification.intent);
        }
      }

      // Multi-intent: Auto-execute secondary action if implied
      if (classification.secondaryIntent === 'score_lead' && prospectData) {
        const scoreResult = await executeLeadScoring(prospectData, updatedContext.activeICP);
        actions = [...actions, ...scoreResult.steps];
        if (scoreResult.score) {
          scoreData = scoreResult.score;
          // Append scoring results to the response
          const scoreSummary = `\n\n**Lead Score: ${scoreResult.score.overallScore}/100 (${scoreResult.score.tier})**\n${scoreResult.score.recommendation}`;
          responseContent += scoreSummary;
        }
      } else if (classification.secondaryIntent === 'compose_outreach' && prospectData) {
        const channel = userMessage.toLowerCase().includes('linkedin') ? 'linkedin' : 'email';
        const outreachResult = await executeOutreachComposition(prospectData, channel);
        actions = [...actions, ...outreachResult.steps];
        if (outreachResult.outreach) {
          outreachData = outreachResult.outreach;
        }
      }
      break;
    }

    case 'research_person': {
      const personName = classification.extractedEntities.personName || userMessage.trim();
      const result = await executePersonResearch(personName, onProgress);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = buildPersonSummary(result.prospect);
        try {
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );
        } catch {
          // LLM unavailable — use fallback template-based response
        }
        if (!responseContent && prospectData) {
          responseContent = buildFallbackResponse(prospectData, classification.intent);
        }
      }

      // Multi-intent: Auto-compose outreach if implied
      if (classification.secondaryIntent === 'compose_outreach' && prospectData) {
        const outreachResult = await executeOutreachComposition(prospectData, 'email');
        actions = [...actions, ...outreachResult.steps];
        if (outreachResult.outreach) {
          outreachData = outreachResult.outreach;
        }
      }
      break;
    }

    case 'research_url': {
      const url = classification.extractedEntities.url || userMessage.trim();
      const result = await executeUrlResearch(url, onProgress);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = buildResearchSummary(result.prospect);
        try {
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );
        } catch {
          // LLM unavailable — use fallback template-based response
        }
        if (!responseContent && prospectData) {
          responseContent = buildFallbackResponse(prospectData, classification.intent);
        }
      }
      break;
    }

    case 'analyze_market': {
      const result = await executeMarketAnalysis(userMessage);
      actions = result.steps;
      if (result.market) {
        marketData = result.market;
        const actionSummary = JSON.stringify({
          summary: result.market.summary,
          findings: result.market.keyFindings,
          competitors: result.market.competitors.map(c => c.name),
          trends: result.market.trends,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'analyze_competitors': {
      const result = await executeCompetitiveAnalysis(userMessage);
      actions = result.steps;
      if (result.market) {
        marketData = result.market;
        const actionSummary = JSON.stringify({
          summary: result.market.summary,
          competitors: result.market.competitors,
          trends: result.market.trends,
          opportunities: result.market.opportunities,
        });
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      }
      break;
    }

    case 'build_icp': {
      const result = await executeICPBuilding(userMessage, updatedContext.activeICP);
      actions = result.steps;
      if (result.icp) {
        icpData = result.icp;
        updatedContext.activeICP = result.icp;
        responseContent = result.response;
      }
      break;
    }

    case 'score_lead': {
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        const result = await executeLeadScoring(recentProspect, updatedContext.activeICP);
        actions = result.steps;
        if (result.score) {
          scoreData = result.score;
          const actionSummary = JSON.stringify(result.score);
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );

          // Proactive: If score is strong, suggest outreach
          if (result.score.overallScore >= 65 && result.score.tier !== 'poor' && result.score.tier !== 'weak') {
            const prospectName = recentProspect.companyName || recentProspect.personName;
            responseContent += `\n\nThis lead scores well! Would you like me to compose a personalized outreach message to ${prospectName}?`;
          }
        }
      } else {
        responseContent = "I don't have a prospect to score yet. Please research a company or person first, and then I can score them against your ICP.\n\nYou can also ask me to research a specific company like: \"Research Stripe\" or \"Tell me about Acme Corp\".";
      }
      break;
    }

    case 'compose_outreach': {
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        // Determine channel from message
        const channel = userMessage.toLowerCase().includes('linkedin') ? 'linkedin' : 'email';
        const result = await executeOutreachComposition(recentProspect, channel);
        actions = result.steps;
        if (result.outreach) {
          outreachData = result.outreach;
          const actionSummary = JSON.stringify(result.outreach);
          responseContent = await generateConversationResponse(
            classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
          );

          // Proactive: Suggest adding to pipeline after outreach
          if (!recentProspect.companyName) {
            responseContent += '\n\nWant me to add this prospect to your lead pipeline?';
          }
        }
      } else {
        // No recent prospect — try to extract a target from the message
        const target = userMessage.replace(/^(?:write|compose|draft|send|email|reach out|craft)\s*(?:an?\s*)?(?:email|message|outreach|connection)?\s*(?:to\s*)?/i, '').trim();
        if (target.length > 2) {
          responseContent = `I don't have information about "${target}" yet. Let me research them first so I can write a truly personalized message.\n\nWould you like me to research ${target}? Just say "Research ${target}" and I'll find their details, then compose a personalized outreach message.`;
        } else {
          responseContent = "I don't have a prospect to write outreach for yet. Please research a company or person first, and then I can compose a personalized message.\n\nFor example: \"Research Stripe\" followed by \"Write an email to Stripe\".";
        }
      }
      break;
    }

    case 'refine_search': {
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      const refQuery = recentProspect
        ? `companies similar to ${recentProspect.companyName || recentProspect.personCompany} in ${recentProspect.industry || 'the same industry'}`
        : userMessage;
      const result = await executeCompanyResearch(refQuery);
      actions = result.steps;
      if (result.prospect) {
        prospectData = result.prospect;
        updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
        const actionSummary = buildResearchSummary(result.prospect);
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } else {
        responseContent = "I couldn't find similar companies right now. Try being more specific — for example, \"Find SaaS companies in healthcare\" or \"Show me fintech startups in London\".";
      }
      break;
    }

    case 'add_to_pipeline': {
      // This is handled client-side, but we acknowledge it intelligently
      const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
      if (recentProspect) {
        const name = recentProspect.companyName || recentProspect.personName;
        responseContent = `Click the "Add to Leads" button below to add ${name || 'this prospect'} to your lead pipeline. I'll make sure all the data is properly saved.`;
      } else {
        responseContent = "I'll add this prospect to your lead pipeline. Click the 'Add to Leads' button below to confirm.";
      }
      break;
    }

    case 'clarify': {
      responseContent = classification.clarifyingQuestion || "I'd love to help! Could you tell me more specifically what you're looking for?";
      break;
    }

    case 'converse':
    default: {
      // General conversation — use LLM to respond intelligently
      try {
        const contextHint = buildContextHint(updatedContext);
        const response = await generateConversationResponse(
          'navigator', classification.intent, userMessage,
          contextHint || 'No specific actions taken — this is a conversational response.',
          updatedContext,
        );
        responseContent = response;
      } catch {
        responseContent = "I'm here to help with B2B lead generation! You can ask me to:\n\n• **Research a company** — \"Tell me about Stripe\"\n• **Find a person** — \"Find Patrick Collison\"\n• **Analyze a market** — \"SaaS market trends in 2026\"\n• **Build an ICP** — \"Build an ICP for B2B SaaS\"\n• **Score a lead** — \"Is Stripe a good lead for us?\"\n• **Compose outreach** — \"Write an email to Stripe\"\n• **Analyze competitors** — \"HubSpot vs Salesforce\"\n\nWhat would you like to do?";
      }
      break;
    }
  }

  // If we still have no response content after all actions, generate a fallback
  // from whatever action data we collected. This ensures users always get a
  // meaningful response even when the LLM is completely unavailable.
  if (!responseContent && (prospectData || icpData || marketData || scoreData || outreachData)) {
    const { generateStructuredFallback } = await import('@/lib/llm');
    responseContent = generateStructuredFallback({
      persona: classification.persona,
      intent: classification.intent,
      userMessage,
      actionSummary: prospectData ? buildResearchSummary(prospectData) :
                     icpData ? JSON.stringify(icpData) :
                     marketData ? JSON.stringify(marketData) :
                     scoreData ? JSON.stringify(scoreData) :
                     outreachData ? JSON.stringify(outreachData) : '{}',
      context: buildContextHint(updatedContext),
    });
  }

  // Auto-curate ICP from prospect data if no active ICP exists
  if (prospectData && !updatedContext.activeICP && (classification.intent === 'research_company' || classification.intent === 'research_url')) {
    try {
      const autoICP = await autoCurateICPFromProspect(prospectData, userMessage);
      if (autoICP) {
        icpData = autoICP;
        updatedContext.activeICP = autoICP;
        // Add an action step for ICP auto-curation
        actions.push({
          type: 'build_icp',
          label: 'Auto-Curated ICP',
          status: 'completed',
          message: `Automatically built ICP from ${prospectData.companyName || 'research results'}`,
        });
      }
    } catch (e) {
      console.warn('[AgentLoop] Auto-ICP curation failed:', e);
    }
  }
  // If we already have an activeICP from a previous step, also include it in icpData
  if (!icpData && updatedContext.activeICP && (classification.intent === 'research_company' || classification.intent === 'research_url' || classification.intent === 'research_person')) {
    icpData = updatedContext.activeICP;
  }

  // Generate actionable insights from collected data
  const insights = generateInsights(classification.intent, prospectData, icpData, scoreData as ScoreResult | undefined, marketData as MarketResult | undefined, outreachData as OutreachResult | undefined, updatedContext);

  // Emit insights via progress callback
  if (onProgress && insights.length > 0) {
    for (const insight of insights) {
      onProgress('insight', { insight });
    }
  }

  // Generate navigation suggestions based on what was produced
  const navigation = generateNavigationSuggestions(classification.intent, prospectData, icpData, scoreData as ScoreResult | undefined, outreachData as OutreachResult | undefined, marketData as MarketResult | undefined);

  // Step 3: Update context with learned preferences
  updatedContext.lastIntent = classification.intent;
  updatedContext.lastPersona = classification.persona;

  // Extract preferences from entities
  if (classification.extractedEntities.industry) {
    updatedContext.userPreferences.industries = [
      ...(updatedContext.userPreferences.industries || []),
      classification.extractedEntities.industry,
    ].slice(-5);
  }
  if (classification.extractedEntities.location) {
    updatedContext.userPreferences.locations = [
      ...(updatedContext.userPreferences.locations || []),
      classification.extractedEntities.location,
    ].slice(-5);
  }

  // Learn company size preferences from prospect data
  if (prospectData?.employeeCount) {
    const size = categorizeCompanySize(prospectData.employeeCount);
    if (size) {
      updatedContext.userPreferences.companySizes = [
        ...(updatedContext.userPreferences.companySizes || []),
        size,
      ].slice(-5);
    }
  }

  // Step 4: Build the agent message
  const agentMessage: AgentMessage = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    persona: classification.persona,
    thinking,
    actions,
    prospectData,
    icpData,
    outreachData: outreachData as OutreachResult | undefined,
    marketData: marketData as MarketResult | undefined,
    scoreData: scoreData as ScoreResult | undefined,
    insights: insights.length > 0 ? insights : undefined,
    navigation: navigation.length > 0 ? navigation : undefined,
  };

  // Step 5: Generate suggested actions (proactive)
  const suggestedActions = generateSuggestedActions(classification.intent, prospectData, updatedContext);

  console.log(`[AgentLoop] Processed "${userMessage.slice(0, 50)}" → intent=${classification.intent}, persona=${classification.persona}, confidence=${classification.confidence}, secondary=${classification.secondaryIntent || 'none'}, took=${Date.now() - startTime}ms`);

  return {
    message: agentMessage,
    updatedContext,
    suggestedActions,
  };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Build a fallback response from prospect data when LLM is unavailable.
 * This generates a structured, readable response without calling the LLM.
 */
function buildFallbackResponse(prospect: ProspectResult, intent: UserIntent): string {
  const parts: string[] = [];

  if (prospect.companyName) {
    parts.push(`**${prospect.companyName}**`);
  }
  if (prospect.description) {
    parts.push(prospect.description);
  }
  if (prospect.industry) {
    parts.push(`**Industry:** ${prospect.industry}`);
  }
  if (prospect.employeeCount) {
    parts.push(`**Employees:** ${prospect.employeeCount}`);
  }
  if (prospect.revenueEstimate) {
    parts.push(`**Revenue:** ${prospect.revenueEstimate}`);
  }
  if (prospect.ceoName) {
    parts.push(`**CEO:** ${prospect.ceoName}`);
  }
  if (prospect.city || prospect.country) {
    parts.push(`**Location:** ${[prospect.city, prospect.country].filter(Boolean).join(', ')}`);
  }
  if (prospect.website) {
    parts.push(`**Website:** ${prospect.website}`);
  }
  if (prospect.generalEmail) {
    parts.push(`**Email:** ${prospect.generalEmail}`);
  }
  if (prospect.linkedinUrl) {
    parts.push(`**LinkedIn:** ${prospect.linkedinUrl}`);
  }

  if (prospect.techStack?.length) {
    parts.push(`**Tech Stack:** ${prospect.techStack.join(', ')}`);
  }
  if (prospect.recentNews?.length) {
    parts.push(`**Recent News:**\n${prospect.recentNews.slice(0, 3).map(n => `- ${n}`).join('\n')}`);
  }

  // Domain-specific data
  if (prospect.detectedDomain && prospect.detectedDomain !== 'general') {
    parts.push(`\n**Domain:** ${prospect.domainLabel || prospect.detectedDomain} — 4-Phase Pipeline Active`);
  }

  parts.push(`\n*Data completeness: ${prospect.dataCompleteness}%*`);

  if (prospect.dataCompleteness < 50) {
    parts.push('The research found limited data. Try providing a website URL for deeper analysis.');
  } else {
    parts.push('Would you like me to score this lead, compose outreach, or find similar companies?');
  }

  return parts.join('\n\n');
}

/**
 * Build a structured research summary for the conversational response.
 */
function buildResearchSummary(prospect: ProspectResult): string {
  return JSON.stringify({
    company: prospect.companyName,
    person: prospect.personName,
    industry: prospect.industry,
    employees: prospect.employeeCount,
    revenue: prospect.revenueEstimate,
    ceo: prospect.ceoName,
    keyContact: prospect.keyContactName,
    email: prospect.keyContactEmail || prospect.generalEmail,
    linkedin: prospect.linkedinUrl,
    website: prospect.website,
    techStack: prospect.techStack?.slice(0, 5),
    recentNews: prospect.recentNews?.slice(0, 2),
    completeness: prospect.dataCompleteness,
    buyingSignals: extractBuyingSignals(prospect),
  });
}

/**
 * Build a structured person summary for the conversational response.
 */
function buildPersonSummary(prospect: ProspectResult): string {
  return JSON.stringify({
    person: prospect.personName,
    title: prospect.personTitle,
    company: prospect.personCompany || prospect.companyName,
    email: prospect.personEmail,
    linkedin: prospect.personLinkedin,
    bio: prospect.personBio?.slice(0, 200),
    completeness: prospect.dataCompleteness,
  });
}

/**
 * Build a context hint for the conversational response.
 */
function buildContextHint(context: ConversationContext): string {
  const parts: string[] = [];
  if (context.recentProspects.length > 0) {
    parts.push(`Recently discussed: ${context.recentProspects.map(p => p.companyName || p.personName).filter(Boolean).join(', ')}`);
  }
  if (context.activeICP) {
    parts.push(`Active ICP: ${context.activeICP.name}`);
  }
  if (context.userPreferences.industries?.length) {
    parts.push(`User interests: ${context.userPreferences.industries.join(', ')}`);
  }
  return parts.join('; ');
}

/**
 * Extract buying signals from prospect data.
 */
function extractBuyingSignals(prospect: ProspectResult): string[] {
  const signals: string[] = [];
  if (prospect.recentNews?.some(n => /hiring|expanding|growth|funding|raised/i.test(n))) {
    signals.push('Growth activity detected in recent news');
  }
  if (prospect.fundingInfo && /raised|funding|series/i.test(prospect.fundingInfo)) {
    signals.push(`Recent funding: ${prospect.fundingInfo}`);
  }
  if (prospect.techStack?.length) {
    signals.push(`Active tech adoption (${prospect.techStack.slice(0, 3).join(', ')})`);
  }
  return signals;
}

/**
 * Categorize company size from employee count (string or number from LLM).
 */
function categorizeCompanySize(employeeCount: string | number | null | undefined): string | null {
  if (employeeCount === null || employeeCount === undefined) return null;
  // LLM may return a number instead of a string
  const str = String(employeeCount);
  const match = str.match(/(\d+)/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (n < 10) return 'Micro (1-9)';
  if (n < 50) return 'Small (10-49)';
  if (n < 200) return 'Mid-Market (50-199)';
  if (n < 1000) return 'Mid-Enterprise (200-999)';
  return 'Enterprise (1000+)';
}

/**
 * Generate suggested follow-up actions based on the current intent and results.
 * Enhanced with context-aware, proactive suggestions.
 */
function generateSuggestedActions(
  intent: UserIntent,
  prospect?: ProspectResult,
  context?: ConversationContext,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const hasICP = !!context?.activeICP;
  const hasRecentProspects = (context?.recentProspects.length || 0) > 0;
  const prospectName = prospect?.companyName || prospect?.personName;

  switch (intent) {
    case 'research_company':
    case 'research_person':
    case 'research_url':
      if (prospect) {
        // Primary suggestions based on data completeness
        if (hasICP) {
          actions.push({ label: 'Score Against ICP', prompt: `Score ${prospectName} against my ICP`, icon: 'Star' });
        } else {
          actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
        }
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        if (prospect.industry) {
          actions.push({ label: 'Find Similar', prompt: `Find similar companies in ${prospect.industry}`, icon: 'Search' });
        } else {
          actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
        }
      }
      break;

    case 'analyze_market':
    case 'analyze_competitors':
      actions.push({ label: 'Research Top Company', prompt: 'Research the top company from this analysis', icon: 'Building2' });
      if (!hasICP) {
        actions.push({ label: 'Build an ICP', prompt: 'Build an ICP for this market', icon: 'Target' });
      }
      if (hasICP) {
        actions.push({ label: 'Score a Lead', prompt: 'Score my most recent prospect against my ICP', icon: 'Star' });
      }
      break;

    case 'build_icp':
      if (hasRecentProspects) {
        actions.push({ label: 'Score Recent Lead', prompt: 'Score my most recent prospect against this ICP', icon: 'Star' });
      }
      actions.push({ label: 'Find Matches', prompt: 'Find companies matching my ICP', icon: 'Search' });
      actions.push({ label: 'Research a Company', prompt: 'Research a specific company', icon: 'Building2' });
      break;

    case 'score_lead':
      if (prospect) {
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
      }
      actions.push({ label: 'Find Better Leads', prompt: 'Find companies that better match my ICP', icon: 'Search' });
      break;

    case 'compose_outreach':
      if (prospect) {
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
      }
      break;

    default:
      actions.push({ label: 'Research a Company', prompt: 'I want to research a company', icon: 'Building2' });
      if (!hasICP) {
        actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
      } else {
        actions.push({ label: 'Score a Lead', prompt: 'Score my most recent prospect', icon: 'Star' });
      }
      break;
  }

  return actions.slice(0, 4); // Max 4 suggestions
}

// ============================================================
// Auto-ICP Curation & Insight Generation
// ============================================================

/**
 * Auto-curate an ICP from prospect research data.
 * Extracts ICP signals from the discovered company information.
 */
async function autoCurateICPFromProspect(prospect: ProspectResult, userQuery: string): Promise<ICPResult | null> {
  const { callLLMForJSON } = await import('@/lib/llm').then(m => ({ callLLMForJSON: m.callLLMForJSON }));

  const prompt = `Based on this company research data, create an Ideal Customer Profile (ICP) that would help the user find SIMILAR companies. The ICP should capture the key characteristics of this company type.

COMPANY DATA:
- Name: ${prospect.companyName}
- Industry: ${prospect.industry}
- Sub-Industry: ${prospect.subIndustry}
- Description: ${prospect.description}
- Employee Count: ${prospect.employeeCount}
- Revenue: ${prospect.revenueEstimate}
- Location: ${prospect.city}, ${prospect.stateProvince}, ${prospect.country}
- Tech Stack: ${prospect.techStack?.join(', ')}
- Products/Services: ${prospect.productsServices?.join(', ')}
- Funding: ${prospect.fundingInfo}

USER'S ORIGINAL QUERY: "${userQuery}"

Create an ICP that targets companies SIMILAR to this one. Respond with JSON:
{
  "name": "<ICP name based on the company type, e.g. 'Mid-Market HealthTech SaaS'>",
  "description": "<1-2 sentence description of the ideal customer type>",
  "firmographic": {
    "industries": ["<primary industry>", "<related industries>"],
    "companySizes": ["<size range based on employee count>"],
    "locations": ["<geographic regions based on company location>"],
    "revenueRange": "<estimated revenue range>"
  },
  "technographic": {
    "requiredTech": ["<core technologies this type of company uses>"],
    "preferredTech": ["<nice-to-have technologies>"]
  },
  "psychographic": {
    "values": ["<what this type of company values>"],
    "challenges": ["<common challenges for this type of company>"],
    "goals": ["<typical goals and objectives>"]
  },
  "behavioral": {
    "buyingSignals": ["<signals that indicate a similar company is ready to buy>"],
    "engagementPatterns": ["<how these companies typically engage with vendors>"]
  },
  "economic": {
    "budgetRange": "<typical budget range>",
    "decisionTimeline": "<typical purchasing timeline>"
  },
  "criteria": "{}"
}`;

  try {
    const result = await callLLMForJSON<ICPResult>(prompt);
    return result;
  } catch {
    // Fallback: build a simple ICP from the raw data
    return buildFallbackICP(prospect);
  }
}

/**
 * Build a fallback ICP from raw prospect data when LLM is unavailable.
 */
function buildFallbackICP(prospect: ProspectResult): ICPResult {
  const industry = prospect.industry || 'General Business';
  const employeeRange = categorizeCompanySize(prospect.employeeCount) || 'Mid-Market (50-199)';
  const location = [prospect.country, prospect.city].filter(Boolean).join(', ') || 'North America';

  // Derive challenges from prospect data instead of hardcoding
  const challenges: string[] = [];
  if (prospect.employeeCount) {
    const size = categorizeCompanySize(prospect.employeeCount);
    if (size?.includes('Small') || size?.includes('Micro')) challenges.push('Resource constraints');
    if (size?.includes('Mid') || size?.includes('Enterprise')) challenges.push('Scaling operations');
  }
  if (prospect.industry?.toLowerCase().includes('tech') || prospect.industry?.toLowerCase().includes('software')) challenges.push('Talent acquisition');
  if (!challenges.length) challenges.push('Growth management', 'Operational efficiency');

  // Derive goals from prospect data
  const goals: string[] = [];
  if (prospect.fundingInfo) goals.push('Post-funding growth execution');
  if (prospect.recentNews?.some(n => /expand|growth|launch/i.test(n))) goals.push('Market expansion');
  if (!goals.length) goals.push('Revenue growth', 'Customer acquisition');

  // Derive buying signals from prospect data
  const signals = extractBuyingSignals(prospect);
  if (!signals.length) signals.push('Active technology adoption', 'Team growth signals');

  // Derive engagement patterns from available data
  const engagementPatterns: string[] = [];
  if (prospect.linkedinUrl) engagementPatterns.push('LinkedIn activity');
  if (prospect.twitterHandle) engagementPatterns.push('Social media engagement');
  if (!engagementPatterns.length) engagementPatterns.push('Website visits', 'Content downloads');

  // Derive budget from revenue estimate
  let budgetRange = '$10K-$100K';
  if (prospect.revenueEstimate) {
    const revStr = String(prospect.revenueEstimate);
    const revMatch = revStr.match(/[\d,.]+/);
    if (revMatch) {
      const rev = parseFloat(revMatch[0].replace(/,/g, ''));
      if (rev >= 100) budgetRange = '$100K-$500K';
      if (rev >= 500) budgetRange = '$500K-$2M';
      if (rev >= 1000) budgetRange = '$2M+';
    }
  }

  return {
    name: `${industry} — Auto-Curated ICP`,
    description: `Automatically generated ICP based on research of ${prospect.companyName || 'the target company'}. This profile captures the key characteristics to find similar companies.`,
    firmographic: {
      industries: [industry, ...(prospect.subIndustry ? [prospect.subIndustry] : [])],
      companySizes: [employeeRange],
      locations: [location],
      revenueRange: prospect.revenueEstimate || '$1M-$50M',
    },
    technographic: {
      requiredTech: prospect.techStack?.slice(0, 3) || [],
      preferredTech: prospect.techStack?.slice(3, 6) || [],
    },
    psychographic: {
      values: ['Innovation', 'Growth', 'Efficiency'],
      challenges,
      goals,
    },
    behavioral: {
      buyingSignals: signals,
      engagementPatterns,
    },
    economic: {
      budgetRange,
      decisionTimeline: '30-90 days',
    },
    criteria: JSON.stringify({ source: 'auto-curated', company: prospect.companyName }),
  };
}

/**
 * Generate actionable insights from the collected data.
 * These are analytical observations with explicit implications.
 */
function generateInsights(
  intent: UserIntent,
  prospect?: ProspectResult,
  icp?: ICPResult,
  score?: ScoreResult,
  _market?: MarketResult,
  outreach?: OutreachResult,
  _context?: ConversationContext,
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (prospect) {
    // Buying signal insights
    const buyingSignals = extractBuyingSignals(prospect);
    buyingSignals.forEach((signal, i) => {
      insights.push({
        id: `insight-buying-${i}`,
        type: 'opportunity',
        icon: 'TrendingUp',
        title: 'Buying Signal Detected',
        description: signal,
        confidence: 0.8,
        relatedDimension: 'behavioral',
      });
    });

    // Tech stack alignment
    if (icp?.technographic.requiredTech?.length && prospect.techStack?.length) {
      const matching = icp.technographic.requiredTech.filter(t =>
        prospect.techStack!.some(pt => pt.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(pt.toLowerCase()))
      );
      if (matching.length > 0) {
        insights.push({
          id: 'insight-tech-alignment',
          type: 'alignment',
          icon: 'Zap',
          title: 'Tech Stack Alignment',
          description: `${matching.length} of your ICP's required technologies (${matching.join(', ')}) are present in their stack. This indicates strong technographic fit.`,
          confidence: 0.85,
          relatedDimension: 'technographic',
        });
      }
    }

    // Size/revenue fit
    if (icp?.firmographic.companySizes?.length && prospect.employeeCount) {
      const sizeCategory = categorizeCompanySize(prospect.employeeCount);
      const matches = sizeCategory && icp.firmographic.companySizes.some(s =>
        s.toLowerCase().includes(sizeCategory.split(' ')[0].toLowerCase())
      );
      if (matches) {
        insights.push({
          id: 'insight-size-fit',
          type: 'alignment',
          icon: 'Users',
          title: 'Company Size Match',
          description: `At ${prospect.employeeCount} employees (${sizeCategory}), they match your ICP's target company size range.`,
          confidence: 0.75,
          relatedDimension: 'firmographic',
        });
      }
    }

    // Industry alignment
    if (icp?.firmographic.industries?.length && prospect.industry) {
      const industryMatch = icp.firmographic.industries.some(i =>
        prospect.industry!.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(prospect.industry!.toLowerCase())
      );
      if (industryMatch) {
        insights.push({
          id: 'insight-industry-alignment',
          type: 'alignment',
          icon: 'Building2',
          title: 'Industry Match',
          description: `${prospect.industry} aligns with your ICP's target industries (${icp.firmographic.industries.slice(0, 3).join(', ')}).`,
          confidence: 0.9,
          relatedDimension: 'firmographic',
        });
      }
    }

    // Key contact available
    if (prospect.keyContactEmail || prospect.ceoEmail) {
      insights.push({
        id: 'insight-contact',
        type: 'opportunity',
        icon: 'Mail',
        title: 'Direct Contact Available',
        description: `Key contact${prospect.keyContactName ? ` (${prospect.keyContactName})` : ''} found with email. You can compose personalized outreach directly.`,
        confidence: 0.95,
      });
    }

    // Data completeness — only warn if very sparse
    if (prospect.dataCompleteness < 25) {
      insights.push({
        id: 'insight-data-gap',
        type: 'gap',
        icon: 'AlertCircle',
        title: 'Limited Data Available',
        description: `${prospect.dataCompleteness}% data completeness. Consider providing a company website URL or more specific name for deeper research.`,
        confidence: 0.7,
      });
    } else if (prospect.dataCompleteness < 50) {
      insights.push({
        id: 'insight-data-partial',
        type: 'gap',
        icon: 'Info',
        title: 'Partial Data Available',
        description: `${prospect.dataCompleteness}% data completeness. Key profile data found — try "Score this lead" or "Compose outreach" to take the next step.`,
        confidence: 0.6,
        relatedDimension: 'firmographic',
      });
    }
  }

  if (score) {
    if (score.overallScore >= 75) {
      insights.push({
        id: 'insight-high-score',
        type: 'opportunity',
        icon: 'Star',
        title: 'High-Fit Lead',
        description: `Scored ${score.overallScore}/100 (${score.tier}). This is a strong match — prioritize for immediate outreach.`,
        confidence: 0.9,
      });
    } else if (score.overallScore < 40) {
      insights.push({
        id: 'insight-low-score',
        type: 'risk',
        icon: 'AlertCircle',
        title: 'Low-Fit Lead',
        description: `Scored only ${score.overallScore}/100 (${score.tier}). Consider deprioritizing or nurturing rather than active outreach.`,
        confidence: 0.85,
      });
    }
  }

  if (outreach) {
    insights.push({
      id: 'insight-outreach-ready',
      type: 'action',
      icon: 'Send',
      title: 'Outreach Ready',
      description: `Your ${outreach.channel} message is ready with ${outreach.personalizationHooks?.length || 0} personalization hooks. Review and send when ready.`,
      confidence: 0.95,
    });
  }

  return insights.slice(0, 6); // Max 6 insights
}

/**
 * Generate navigation suggestions that guide users to relevant tabs.
 */
function generateNavigationSuggestions(
  _intent: UserIntent,
  prospect?: ProspectResult,
  icp?: ICPResult,
  score?: ScoreResult,
  outreach?: OutreachResult,
  market?: MarketResult,
): NavigationSuggestion[] {
  const nav: NavigationSuggestion[] = [];

  if (icp) {
    nav.push({
      targetView: 'icp',
      label: 'View in ICP Builder',
      icon: 'Target',
      reason: 'Your auto-curated ICP is ready — refine it in the ICP Builder',
      prefillData: { icp },
    });
  }

  if (prospect) {
    nav.push({
      targetView: 'leads',
      label: 'View in Leads',
      icon: 'Users',
      reason: 'Add this prospect to your lead pipeline and track their progress',
    });
  }

  if (score && score.overallScore >= 65) {
    nav.push({
      targetView: 'outreach',
      label: 'Go to Outreach',
      icon: 'Mail',
      reason: `This lead scores ${score.overallScore}/100 — start personalized outreach`,
    });
  }

  if (outreach) {
    nav.push({
      targetView: 'outreach',
      label: 'View in Outreach',
      icon: 'Mail',
      reason: 'Your outreach message is ready — manage it in the Outreach tab',
    });
  }

  if (market) {
    nav.push({
      targetView: 'reports',
      label: 'View in Reports',
      icon: 'BarChart3',
      reason: 'Market analysis data is available for detailed reporting',
    });
  }

  return nav.slice(0, 3); // Max 3 navigation suggestions
}
