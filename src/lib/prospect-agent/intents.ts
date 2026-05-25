// ============================================================
// Prospect Discovery Agent — Intent Classification Engine
// ============================================================

import { callLLMForJSON } from '@/lib/llm';
import type { AgentPersona, UserIntent, ConversationContext, AgentThinking } from './types';
import { getIntentClassificationPrompt } from './prompts';

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
}

/**
 * Classify the user's message intent using the LLM.
 * Falls back to rule-based classification if LLM fails.
 */
export async function classifyIntent(
  userMessage: string,
  context?: ConversationContext,
): Promise<IntentClassification> {
  // Try LLM-based classification first
  try {
    const result = await callLLMForJSON<IntentClassification>(
      getIntentClassificationPrompt(userMessage, context),
      `User message to classify: "${userMessage}"`,
      { retriesPerModel: 1 }, // Fast classification — don't waste time on retries
    );

    if (result && result.intent && result.persona) {
      return result;
    }
  } catch (error) {
    console.warn('[IntentClassifier] LLM classification failed, falling back to rules:', error);
  }

  // Fallback: Rule-based classification
  return ruleBasedClassification(userMessage, context);
}

/**
 * Rule-based intent classification as a fallback when LLM is unavailable.
 */
function ruleBasedClassification(
  userMessage: string,
  context?: ConversationContext,
): IntentClassification {
  const msg = userMessage.trim().toLowerCase();

  // URL detection
  const urlPattern = /^https?:\/\/[^\s]+/i;
  if (urlPattern.test(userMessage.trim())) {
    return {
      intent: 'research_url',
      persona: 'scout',
      confidence: 0.95,
      reasoning: 'Message starts with a URL',
      extractedEntities: { companyName: null, personName: null, url: userMessage.trim(), industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Add to pipeline keywords
  const addKeywords = ['add to lead', 'add to pipeline', 'convert to lead', 'save this', 'add this prospect'];
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
  const icpKeywords = ['build icp', 'ideal customer', 'target profile', 'define my icp', 'create icp', 'icp for', 'customer profile'];
  if (icpKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'build_icp',
      persona: 'architect',
      confidence: 0.9,
      reasoning: 'User wants to build or define an ICP',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Scoring keywords
  const scoreKeywords = ['score this', 'qualify', 'is this a good lead', 'rate this', 'how good is', 'evaluate this'];
  if (scoreKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'score_lead',
      persona: 'judge',
      confidence: 0.85,
      reasoning: 'User wants to score/qualify a lead',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Outreach keywords
  const outreachKeywords = ['write an email', 'compose outreach', 'draft message', 'linkedin message', 'cold email', 'write to', 'reach out to', 'compose'];
  if (outreachKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'compose_outreach',
      persona: 'scribe',
      confidence: 0.9,
      reasoning: 'User wants to compose outreach',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Market analysis keywords
  const marketKeywords = ['market analysis', 'market size', 'industry trend', 'competitive landscape', 'market research', 'trends in', 'landscape of'];
  if (marketKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'analyze_market',
      persona: 'analyst',
      confidence: 0.85,
      reasoning: 'User wants market/industry analysis',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Competitor analysis keywords
  const competitorKeywords = ['competitor', 'competition', 'alternative to', 'compare', 'versus', ' vs ', 'similar to'];
  if (competitorKeywords.some(k => msg.includes(k))) {
    return {
      intent: 'analyze_competitors',
      persona: 'analyst',
      confidence: 0.85,
      reasoning: 'User wants competitive analysis',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Refine search keywords
  const refineKeywords = ['more like this', 'similar companies', 'find more', 'other companies like', 'show me similar'];
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

  // Person name detection (2-4 capitalized words, no numbers)
  const personPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/;
  if (personPattern.test(userMessage.trim())) {
    return {
      intent: 'research_person',
      persona: 'hound',
      confidence: 0.8,
      reasoning: 'Message matches a person name pattern',
      extractedEntities: { companyName: null, personName: userMessage.trim(), url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Company research detection — anything that looks like a company name or search query
  const companyKeywords = ['company', 'corp', 'inc', 'ltd', 'gmbh', 'sa', 'llc', 'find', 'search', 'research', 'look up', 'tell me about', 'info on', 'discover'];
  if (companyKeywords.some(k => msg.includes(k)) || userMessage.trim().length > 3) {
    // If context has recent prospects and the user is asking a follow-up, it might be refine_search
    if (context?.recentProspects && context.recentProspects.length > 0) {
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

    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.75,
      reasoning: 'Message appears to be a company search query',
      extractedEntities: { companyName: userMessage.trim(), personName: null, url: null, industry: null, location: null },
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

  return {
    persona: classification.persona,
    intent: classification.intent,
    reasoning: classification.reasoning,
    plan: planMap[classification.intent] || ['Processing your request'],
    clarifyingQuestion: classification.clarifyingQuestion || undefined,
    confidence: classification.confidence,
  };
}
