/**
 * Objection Handler
 * 
 * Handles sales objections using LLM with 15 objection categories
 * and 3 response frameworks.
 * 
 * Uses centralized callLLMForJSON for rate limiting, retries, and model fallback.
 */

import { callLLMForJSON } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

export type ObjectionCategory =
  | 'price'
  | 'timing'
  | 'competitor'
  | 'authority'
  | 'need'
  | 'trust'
  | 'complexity'
  | 'priority'
  | 'budget'
  | 'team'
  | 'process'
  | 'fit'
  | 'risk'
  | 'contract'
  | 'no_response';

export type ResponseFramework = 'feel-felt-realized' | 'acknowledge-bridge-confirm' | 'listen-acknowledge-explore-respond';

export interface ObjectionContext {
  leadName?: string;
  companyName?: string;
  industry?: string;
  product?: string;
  objectionCategory: ObjectionCategory;
  responseFramework: ResponseFramework;
  additionalContext?: string;
}

export interface ObjectionResponse {
  category: ObjectionCategory;
  framework: ResponseFramework;
  objection: string;
  response: string;
  keyPoints: string[];
  followUpQuestions: string[];
  confidence: number;
}

// ============================================================
// Objection Category Descriptions
// ============================================================

const OBJECTION_DESCRIPTIONS: Record<ObjectionCategory, string> = {
  price: 'The prospect thinks the price is too high or not justified',
  timing: 'The prospect says it\'s not the right time to buy',
  competitor: 'The prospect is already using or considering a competitor',
  authority: 'The prospect doesn\'t have decision-making power',
  need: 'The prospect doesn\'t see the need for the solution',
  trust: 'The prospect doesn\'t trust the company or product',
  complexity: 'The prospect thinks the solution is too complex to implement',
  priority: 'The prospect has other priorities right now',
  budget: 'The prospect doesn\'t have budget allocated',
  team: 'The prospect\'s team isn\'t ready or aligned',
  process: 'The prospect has a lengthy procurement process',
  fit: 'The prospect doesn\'t think the solution fits their needs',
  risk: 'The prospect is concerned about risk or compliance',
  contract: 'The prospect has concerns about contract terms',
  no_response: 'The prospect has gone silent / not responding',
};

// ============================================================
// Response Framework Templates
// ============================================================

const FRAMEWORK_TEMPLATES: Record<ResponseFramework, string> = {
  'feel-felt-realized': `Feel-Felt-Realized Framework:
1. FEEL: "I understand how you feel..." — Acknowledge their emotion/concern genuinely
2. FELT: "Other clients felt the same way..." — Normalize the concern with social proof
3. REALIZED: "What they realized was..." — Show the positive outcome of working through the concern`,

  'acknowledge-bridge-confirm': `Acknowledge-Bridge-Confirm Framework:
1. ACKNOWLEDGE: Validate their concern directly — "That's a fair point..." or "I hear you..."
2. BRIDGE: Connect their concern to a relevant benefit or perspective — "At the same time..." or "What's interesting is..."
3. CONFIRM: Ask a confirming question — "Does that make sense?" or "Would that work for you?"`,

  'listen-acknowledge-explore-respond': `Listen-Acknowledge-Explore-Respond Framework:
1. LISTEN: Reflect back what you heard — "So what you're saying is..."
2. ACKNOWLEDGE: Show understanding — "I can see why that would be a concern"
3. EXPLORE: Dig deeper with questions — "Help me understand..." or "What specifically..."
4. RESPOND: Provide a tailored response addressing their specific concern`,
};

// ============================================================
// Main Handler
// ============================================================

/**
 * Generate a response to a sales objection using LLM
 */
export async function handleObjection(
  objection: string,
  context: ObjectionContext
): Promise<ObjectionResponse> {
  const categoryDesc = OBJECTION_DESCRIPTIONS[context.objectionCategory];
  const frameworkTemplate = FRAMEWORK_TEMPLATES[context.responseFramework];

  const systemPrompt = `You are an expert B2B sales coach. Generate a response to a sales objection.

Rules:
- Be empathetic, never dismissive
- Use specific, concrete language
- Include social proof where possible
- End with a question that advances the conversation
- Return ONLY valid JSON`;

  const userMessage = `OBJECTION: "${objection}"
CATEGORY: ${context.objectionCategory} — ${categoryDesc}

PROSPECT CONTEXT:
- Name: ${context.leadName || 'Unknown'}
- Company: ${context.companyName || 'Unknown'}
- Industry: ${context.industry || 'Unknown'}
- Product: ${context.product || 'Our B2B solution'}
${context.additionalContext ? `- Additional Context: ${context.additionalContext}` : ''}

RESPONSE FRAMEWORK: ${frameworkTemplate}

Generate a response as JSON:
{
  "response": "The full response following the framework, tailored to this specific objection",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "followUpQuestions": ["Question 1", "Question 2"],
  "confidence": 0.85
}`;

  try {
    const parsed = await callLLMForJSON<Record<string, unknown>>(systemPrompt, userMessage, {
      temperature: 0.3,
      retriesPerModel: 2,
      useFallback: true,
    });

    return {
      category: context.objectionCategory,
      framework: context.responseFramework,
      objection,
      response: (parsed?.response as string) || getDefaultResponse(context),
      keyPoints: parsed && Array.isArray(parsed.keyPoints) ? (parsed.keyPoints as string[]) : getDefaultKeyPoints(context.objectionCategory),
      followUpQuestions: parsed && Array.isArray(parsed.followUpQuestions) ? (parsed.followUpQuestions as string[]) : ['Can you tell me more about that?'],
      confidence: parsed && typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
    };
  } catch (error) {
    console.warn('[ObjectionHandler] LLM failed, using defaults:', error);
    return {
      category: context.objectionCategory,
      framework: context.responseFramework,
      objection,
      response: getDefaultResponse(context),
      keyPoints: getDefaultKeyPoints(context.objectionCategory),
      followUpQuestions: ['Can you help me understand more about your concern?', 'What would need to change for this to make sense?'],
      confidence: 0.5,
    };
  }
}

// ============================================================
// Fallbacks
// ============================================================

function getDefaultResponse(context: ObjectionContext): string {
  const name = context.leadName || 'there';
  const company = context.companyName || 'your company';

  switch (context.responseFramework) {
    case 'feel-felt-realized':
      return `I completely understand how you feel about that, ${name}. Many of our clients at similar companies felt the same way initially. What they realized after working with us was that the value far outweighed their initial concern. Would you be open to hearing how?`;
    case 'acknowledge-bridge-confirm':
      return `That's a fair point, ${name}. At the same time, companies like ${company} have found that addressing this area actually accelerates their other priorities. Would it make sense to explore how that might work for you?`;
    case 'listen-acknowledge-explore-respond':
      return `So what I'm hearing is that you have a concern about ${context.objectionCategory}. I can see why that would be important. Help me understand — what's the biggest factor behind that concern? Based on what you share, I can give you a more specific response.`;
  }
}

function getDefaultKeyPoints(category: ObjectionCategory): string[] {
  const defaults: Record<ObjectionCategory, string[]> = {
    price: ['Focus on ROI and total cost of ownership', 'Compare to cost of inaction', 'Offer flexible pricing options'],
    timing: ['Connect to a trigger event or deadline', 'Highlight cost of delay', 'Offer a low-commitment start'],
    competitor: ['Acknowledge their current solution', 'Highlight unique differentiators', 'Offer a side-by-side comparison'],
    authority: ['Ask who else is involved in the decision', 'Provide materials for internal champion', 'Offer to present to the full buying committee'],
    need: ['Share relevant case studies', 'Ask discovery questions about current challenges', 'Quantify the cost of the status quo'],
    trust: ['Share customer testimonials and references', 'Offer a pilot or trial', 'Provide third-party validation'],
    complexity: ['Simplify the onboarding process', 'Share implementation timeline', 'Offer dedicated support'],
    priority: ['Connect to their stated goals', 'Show quick-win potential', 'Demonstrate low time investment'],
    budget: ['Discuss ROI timeline', 'Suggest phased approach', 'Explore different budget cycles'],
    team: ['Offer training and change management', 'Share adoption success stories', 'Propose a pilot with one team'],
    process: ['Understand their procurement steps', 'Provide required documentation early', 'Offer to meet with procurement'],
    fit: ['Understand specific requirements', 'Share relevant use cases', 'Offer a custom demo'],
    risk: ['Address compliance and security', 'Share SLA guarantees', 'Discuss risk mitigation strategies'],
    contract: ['Highlight flexibility in terms', 'Discuss mutual commitments', 'Offer legal review process'],
    no_response: ['Try a different channel', 'Add new value in each follow-up', 'Reference a trigger event'],
  };
  return defaults[category] || ['Understand the concern', 'Provide relevant proof', 'Ask a follow-up question'];
}
