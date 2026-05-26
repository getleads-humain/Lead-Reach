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
  secondaryIntent?: UserIntent | null;
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
      // Validate the intent is a valid value
      const validIntents: UserIntent[] = [
        'research_company', 'research_person', 'research_url',
        'analyze_market', 'analyze_competitors', 'build_icp',
        'score_lead', 'compose_outreach', 'refine_search',
        'add_to_pipeline', 'clarify', 'converse',
      ];
      if (validIntents.includes(result.intent)) {
        return result;
      }
    }
  } catch (error) {
    console.warn('[IntentClassifier] LLM classification failed, falling back to rules:', error);
  }

  // Fallback: Rule-based classification
  return ruleBasedClassification(userMessage, context);
}

/**
 * Rule-based intent classification as a fallback when LLM is unavailable.
 * Enhanced with multi-intent detection, context awareness, and smarter patterns.
 */
function ruleBasedClassification(
  userMessage: string,
  context?: ConversationContext,
): IntentClassification {
  const msg = userMessage.trim().toLowerCase();
  const originalMsg = userMessage.trim();

  // ============================================================
  // Multi-intent detection: queries that imply chaining actions
  // ============================================================

  // "Research X and write them" / "Tell me about X and email them"
  const researchAndOutreach = msg.match(/(?:research|tell me about|look up|find info on|analyze)\s+(.+?)(?:\s+and\s+(?:write|email|compose|reach out|send|draft))/i);
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
  const researchAndScore = msg.match(/(?:research|tell me about|look up|find info on)\s+(.+?)(?:\s+and\s+(?:score|evaluate|qualify|rate))/i);
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

  // Person name detection (2-4 capitalized words, no numbers)
  const personPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/;
  if (personPattern.test(originalMsg)) {
    return {
      intent: 'research_person',
      persona: 'hound',
      confidence: 0.8,
      reasoning: 'Message matches a person name pattern',
      extractedEntities: { companyName: null, personName: originalMsg, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Company research detection
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

    // Extract company name from the message
    const companyName = extractCompanyName(originalMsg);

    return {
      intent: 'research_company',
      persona: 'scout',
      confidence: 0.75,
      reasoning: 'Message appears to be a company search query',
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
 */
function extractEntities(message: string): IntentClassification['extractedEntities'] {
  const entities: IntentClassification['extractedEntities'] = {
    companyName: null,
    personName: null,
    url: null,
    industry: null,
    location: null,
  };

  // URL extraction
  const urlMatch = message.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) entities.url = urlMatch[0];

  // Industry extraction
  const industryPatterns = [
    /(?:in the|in|for the)\s+(\w+(?:\s+\w+)?)\s+(?:industry|market|sector|space)/i,
    /(\w+(?:\s+\w+)?)\s+(?:industry|market|sector|space)/i,
  ];
  for (const pattern of industryPatterns) {
    const match = message.match(pattern);
    if (match) { entities.industry = match[1].trim(); break; }
  }

  // Location extraction
  const locationPatterns = [
    /(?:in|from|near|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];
  for (const pattern of locationPatterns) {
    const match = message.match(pattern);
    if (match) { entities.location = match[1].trim(); break; }
  }

  return entities;
}

/**
 * Extract a company name from a user message by stripping common prefixes.
 */
function extractCompanyName(message: string): string {
  let cleaned = message
    .replace(/^(?:tell me about|research|look up|find info on|find|search for|info on|about|what is|who is|discover|analyze)\s+/i, '')
    .replace(/\s*please\s*$/i, '')
    .trim();

  // If the result is too long, it's probably not just a company name
  if (cleaned.split(/\s+/).length > 6) {
    cleaned = message.trim(); // Use the original
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
