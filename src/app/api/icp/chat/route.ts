// ============================================================
// ICP Builder — Dedicated Chat Endpoint
// ============================================================
//
// WHY THIS EXISTS:
// The general /api/prospect-discovery/chat endpoint routes ICP
// messages through a 3-step pipeline (intent classification →
// ICP extraction → conversational response) that takes 45+ seconds,
// exceeding the reverse proxy timeout and causing 502 errors.
//
// This dedicated endpoint skips intent classification entirely
// (we KNOW the intent is "build_icp") and combines ICP extraction
// + conversational response into a single LLM call, reducing
// latency from 45+ seconds to 10-20 seconds.
//
// WORKFLOW:
// 1. Receive user message + current ICP state
// 2. Single LLM call: extract criteria + generate response
// 3. Merge extracted criteria into ICP
// 4. Return ICP data + conversational message
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { callLLMForJSON, callLLM } from '@/lib/llm';
import type { ICPResult } from '@/lib/prospect-agent/types';

export const maxDuration = 60;

// ============================================================
// ICP Builder System Prompt — Single optimized call
// ============================================================

function getICPBuilderPrompt(
  userMessage: string,
  existingICP: ICPResult | null,
  conversationHistory: Array<{ role: string; content: string }>,
): string {
  const icpStateStr = existingICP
    ? JSON.stringify(existingICP, null, 2)
    : 'No ICP defined yet — starting from scratch.';

  const historyStr = conversationHistory.length > 0
    ? `\nCONVERSATION HISTORY (for context):\n${conversationHistory.slice(-6).map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n')}\n`
    : '';

  return `You are ARCHITECT — the ICP Builder specialist for LeadReach AI. You help users define their Ideal Customer Profile through an interactive, intelligent conversation.

YOUR PERSONALITY: Strategic, systematic, collaborative. You build frameworks that work.
YOUR EXPERTISE: Creating and refining Ideal Customer Profiles from business context.

YOUR APPROACH:
1. Extract ALL ICP criteria from the user's message — don't miss implied criteria
2. If their input is rich enough, fill in multiple dimensions at once (be efficient, don't ask unnecessary questions)
3. Make smart inferences — if they say "healthcare SaaS", infer HIPAA compliance needs, regulated industry challenges, etc.
4. Ask the NEXT most important question to fill the biggest gap
5. Guide toward a complete ICP across all 6 dimensions

CURRENT ICP STATE:
${icpStateStr}
${historyStr}
USER SAID: "${userMessage}"

Based on the user's input, extract ICP criteria AND generate a conversational response in a SINGLE response.

IMPORTANT RULES:
- Extract AS MANY criteria as possible from the user's message, including implied ones
- If the user says "B2B SaaS in healthcare", extract: industries=[Healthcare, SaaS, B2B], companySizes=["50-500"], challenges=["HIPAA compliance", "Data security"], requiredTech=["Cloud infrastructure", "EHR integration"], buyingSignals=["Regulatory changes", "Funding rounds"]
- Don't ask about criteria the user already provided or that can be inferred
- Always suggest the next dimension to define
- If the ICP seems complete enough (has entries in 4+ dimensions), suggest saving it

Respond with JSON:
{
  "acknowledgment": "<specific acknowledgment of what you understood, be detailed>",
  "extractedCriteria": {
    "name": "<ICP name if provided or inferred, or null>",
    "industries": ["<industry1>", ...],
    "companySizes": ["<size1>", ...],
    "locations": ["<location1>", ...],
    "revenueRange": "<range or null>",
    "requiredTech": ["<tech1>", ...],
    "preferredTech": ["<tech1>", ...],
    "values": ["<value1>", ...],
    "challenges": ["<challenge1>", ...],
    "goals": ["<goal1>", ...],
    "buyingSignals": ["<signal1>", ...],
    "engagementPatterns": ["<pattern1>", ...],
    "budgetRange": "<range or null>",
    "decisionTimeline": "<timeline or null>"
  },
  "response": "<your conversational response — be specific, reference what you extracted, ask the next most important question>",
  "isComplete": false,
  "completenessScore": <0-100 estimate of how complete the ICP is>,
  "nextDimension": "<which dimension to focus on next: firmographic|technographic|psychographic|behavioral|economic|review>",
  "suggestedActions": ["<action1>", "<action2>"]
}`;
}

// ============================================================
// Merge extracted criteria into ICP
// ============================================================

function mergeCriteriaIntoICP(existing: ICPResult | null, extracted: Record<string, unknown>): ICPResult {
  const icp: ICPResult = existing || {
    name: 'Custom ICP',
    description: '',
    firmographic: { industries: [], companySizes: [], locations: [], revenueRange: '' },
    technographic: { requiredTech: [], preferredTech: [] },
    psychographic: { values: [], challenges: [], goals: [] },
    behavioral: { buyingSignals: [], engagementPatterns: [] },
    economic: { budgetRange: '', decisionTimeline: '' },
    criteria: '',
  };

  // Name
  if (typeof extracted.name === 'string' && extracted.name.trim()) {
    icp.name = extracted.name.trim();
  }

  // Firmographic
  if (Array.isArray(extracted.industries)) {
    icp.firmographic.industries = [...new Set([...icp.firmographic.industries, ...extracted.industries.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.companySizes)) {
    icp.firmographic.companySizes = [...new Set([...icp.firmographic.companySizes, ...extracted.companySizes.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.locations)) {
    icp.firmographic.locations = [...new Set([...icp.firmographic.locations, ...extracted.locations.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (typeof extracted.revenueRange === 'string' && extracted.revenueRange.trim()) {
    icp.firmographic.revenueRange = extracted.revenueRange;
  }

  // Technographic
  if (Array.isArray(extracted.requiredTech)) {
    icp.technographic.requiredTech = [...new Set([...icp.technographic.requiredTech, ...extracted.requiredTech.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.preferredTech)) {
    icp.technographic.preferredTech = [...new Set([...icp.technographic.preferredTech, ...extracted.preferredTech.filter((s: unknown) => typeof s === 'string') as string[]])];
  }

  // Psychographic
  if (Array.isArray(extracted.values)) {
    icp.psychographic.values = [...new Set([...icp.psychographic.values, ...extracted.values.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.challenges)) {
    icp.psychographic.challenges = [...new Set([...icp.psychographic.challenges, ...extracted.challenges.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.goals)) {
    icp.psychographic.goals = [...new Set([...icp.psychographic.goals, ...extracted.goals.filter((s: unknown) => typeof s === 'string') as string[]])];
  }

  // Behavioral
  if (Array.isArray(extracted.buyingSignals)) {
    icp.behavioral.buyingSignals = [...new Set([...icp.behavioral.buyingSignals, ...extracted.buyingSignals.filter((s: unknown) => typeof s === 'string') as string[]])];
  }
  if (Array.isArray(extracted.engagementPatterns)) {
    icp.behavioral.engagementPatterns = [...new Set([...icp.behavioral.engagementPatterns, ...extracted.engagementPatterns.filter((s: unknown) => typeof s === 'string') as string[]])];
  }

  // Economic
  if (typeof extracted.budgetRange === 'string' && extracted.budgetRange.trim()) {
    icp.economic.budgetRange = extracted.budgetRange;
  }
  if (typeof extracted.decisionTimeline === 'string' && extracted.decisionTimeline.trim()) {
    icp.economic.decisionTimeline = extracted.decisionTimeline;
  }

  // Update description based on ICP content
  if (!icp.description && icp.firmographic.industries.length > 0) {
    const parts: string[] = [];
    if (icp.firmographic.industries.length > 0) parts.push(`Targeting ${icp.firmographic.industries.join(', ')}`);
    if (icp.firmographic.companySizes.length > 0) parts.push(`${icp.firmographic.companySizes.join(', ')} companies`);
    if (icp.firmographic.locations.length > 0) parts.push(`in ${icp.firmographic.locations.join(', ')}`);
    icp.description = parts.join(' ');
  }

  // Store raw criteria
  icp.criteria = JSON.stringify(extracted);

  return icp;
}

// ============================================================
// Calculate ICP completeness
// ============================================================

function calculateCompleteness(icp: ICPResult): number {
  let filled = 0;
  const total = 12; // Total fields we check

  if (icp.firmographic.industries.length > 0) filled++;
  if (icp.firmographic.companySizes.length > 0) filled++;
  if (icp.firmographic.locations.length > 0) filled++;
  if (icp.firmographic.revenueRange) filled++;
  if (icp.technographic.requiredTech.length > 0) filled++;
  if (icp.technographic.preferredTech.length > 0) filled++;
  if (icp.psychographic.challenges.length > 0) filled++;
  if (icp.psychographic.goals.length > 0) filled++;
  if (icp.behavioral.buyingSignals.length > 0) filled++;
  if (icp.behavioral.engagementPatterns.length > 0) filled++;
  if (icp.economic.budgetRange) filled++;
  if (icp.economic.decisionTimeline) filled++;

  return Math.round((filled / total) * 100);
}

// ============================================================
// POST handler
// ============================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { message, conversationHistory, currentICP, action } = body as {
      message: string;
      conversationHistory?: Array<{ role: string; content: string }>;
      currentICP?: ICPResult | null;
      action?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ============================================================
    // Special actions that don't need LLM
    // ============================================================

    if (action === 'generate_suggestions') {
      // Generate industry-specific ICP suggestions without LLM
      return handleGenerateSuggestions(message, currentICP || null);
    }

    if (action === 'quick_build') {
      // Quick-build from a single description — uses LLM but returns just the ICP
      return handleQuickBuild(message, currentICP || null);
    }

    // ============================================================
    // Main chat flow: Single optimized LLM call
    // ============================================================

    const history = conversationHistory || [];

    // Make ONE LLM call that does extraction + response
    const result = await callLLMForJSON<{
      acknowledgment: string;
      extractedCriteria: Record<string, unknown>;
      response: string;
      isComplete: boolean;
      completenessScore: number;
      nextDimension: string;
      suggestedActions: string[];
    }>(
      getICPBuilderPrompt(message.trim(), currentICP || null, history),
      message.trim(),
      {
        temperature: 0.3,
        maxTokens: 4096,
        retriesPerModel: 1,
        useFallback: true,
      },
    );

    const elapsed = Date.now() - startTime;
    console.log(`[ICPChat] Processed "${message.trim().slice(0, 50)}" in ${elapsed}ms`);

    if (!result) {
      // LLM failed — generate a helpful fallback response
      return NextResponse.json({
        success: true,
        message: {
          id: `icp-fallback-${Date.now()}`,
          role: 'assistant' as const,
          content: "I'm having difficulty processing your ICP criteria right now. Could you try again? For best results, describe your ideal customer including their industry, company size, and what challenges they face.\n\nExample: \"Build an ICP for B2B SaaS companies in healthcare with 50-500 employees\"",
          timestamp: new Date().toISOString(),
          persona: 'architect',
        },
        icpData: currentICP || null,
        completeness: currentICP ? calculateCompleteness(currentICP) : 0,
      });
    }

    // Merge extracted criteria into ICP
    const updatedICP = mergeCriteriaIntoICP(currentICP || null, result.extractedCriteria || {});
    const completeness = calculateCompleteness(updatedICP);

    // Update description
    if (result.acknowledgment && !updatedICP.description) {
      updatedICP.description = result.acknowledgment.slice(0, 200);
    }

    return NextResponse.json({
      success: true,
      message: {
        id: `icp-${Date.now()}`,
        role: 'assistant' as const,
        content: result.response,
        timestamp: new Date().toISOString(),
        persona: 'architect',
      },
      icpData: updatedICP,
      completeness,
      isComplete: result.isComplete || completeness >= 70,
      nextDimension: result.nextDimension || 'firmographic',
      suggestedActions: result.suggestedActions || [],
    });

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[ICPChat] Error after ${elapsed}ms:`, error);

    const msg = error instanceof Error ? error.message : 'Unknown error';

    // Always return 200 with a helpful message (never 502/503)
    return NextResponse.json({
      success: true,
      message: {
        id: `icp-error-${Date.now()}`,
        role: 'assistant' as const,
        content: `I encountered an issue processing your request (${msg.slice(0, 80)}). Please try again — sometimes a simpler description works better.\n\nTip: Try describing your ideal customer in one sentence, like "B2B SaaS companies in healthcare with 50-500 employees"`,
        timestamp: new Date().toISOString(),
        persona: 'architect',
      },
      icpData: null,
      completeness: 0,
    });
  }
}

// ============================================================
// Quick Build — Generate a complete ICP from a single description
// ============================================================

async function handleQuickBuild(description: string, existingICP: ICPResult | null) {
  const result = await callLLMForJSON<ICPResult>(
    `You are an ICP builder. Generate a complete Ideal Customer Profile based on this description.

DESCRIPTION: "${description}"
${existingICP ? `EXISTING ICP TO MERGE WITH: ${JSON.stringify(existingICP)}` : ''}

Generate a comprehensive ICP with as many criteria as possible across all dimensions.
Make smart inferences based on the industry and description provided.

Return JSON:
{
  "name": "<descriptive ICP name>",
  "description": "<2-3 sentence summary>",
  "firmographic": {
    "industries": ["<industry1>", ...],
    "companySizes": ["<size range>", ...],
    "locations": ["<location>", ...],
    "revenueRange": "<range>"
  },
  "technographic": {
    "requiredTech": ["<tech1>", ...],
    "preferredTech": ["<tech1>", ...]
  },
  "psychographic": {
    "values": ["<value1>", ...],
    "challenges": ["<challenge1>", ...],
    "goals": ["<goal1>", ...]
  },
  "behavioral": {
    "buyingSignals": ["<signal1>", ...],
    "engagementPatterns": ["<pattern1>", ...]
  },
  "economic": {
    "budgetRange": "<range>",
    "decisionTimeline": "<timeline>"
  },
  "criteria": ""
}`,
    `Generate ICP for: ${description}`,
    { temperature: 0.4, maxTokens: 4096 },
  );

  if (!result) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate ICP',
      icpData: existingICP,
    });
  }

  const completeness = calculateCompleteness(result);
  result.criteria = JSON.stringify(result);

  return NextResponse.json({
    success: true,
    icpData: result,
    completeness,
    isComplete: completeness >= 50,
    message: {
      id: `icp-quick-${Date.now()}`,
      role: 'assistant' as const,
      content: `I've generated an ICP profile based on your description. Review the criteria across all dimensions and let me know if you'd like to refine anything.\n\n**${result.name}** — ${result.description || ''}\n\nThe profile is ${completeness}% complete. ${completeness < 60 ? 'You can add more detail by describing specific challenges, buying signals, or budget ranges.' : 'The profile covers all major dimensions well.'}`,
      timestamp: new Date().toISOString(),
      persona: 'architect',
    },
  });
}

// ============================================================
// Generate Suggestions — Non-LLM quick suggestions
// ============================================================

function handleGenerateSuggestions(industry: string, currentICP: ICPResult | null) {
  // Provide industry-specific suggestions based on common patterns
  const suggestions: Record<string, Record<string, string[]>> = {
    saas: {
      companySizes: ['11-50', '51-200', '201-500'],
      challenges: ['Customer acquisition cost', 'Churn reduction', 'Scaling support', 'Product-market fit'],
      buyingSignals: ['Series A/B funding', 'Growing engineering team', 'Expanding to new markets', 'Hiring for specific roles'],
      goals: ['Reduce churn', 'Increase MRR', 'Scale operations', 'Improve onboarding'],
      requiredTech: ['Cloud infrastructure', 'SaaS analytics', 'CRM', 'Customer success platform'],
    },
    healthcare: {
      companySizes: ['51-200', '201-500', '501-1000'],
      challenges: ['HIPAA compliance', 'Data security', 'Patient engagement', 'Regulatory changes'],
      buyingSignals: ['New compliance hires', 'EHR migration', 'Telehealth expansion', 'Funding rounds'],
      goals: ['Patient outcomes improvement', 'Operational efficiency', 'Regulatory compliance', 'Digital transformation'],
      requiredTech: ['EHR/EMR systems', 'HIPAA-compliant infrastructure', 'Telehealth platform', 'Data analytics'],
    },
    fintech: {
      companySizes: ['11-50', '51-200', '201-500'],
      challenges: ['Regulatory compliance', 'Data security', 'Scaling infrastructure', 'Customer trust'],
      buyingSignals: ['Regulatory license obtained', 'Series B+ funding', 'International expansion', 'Banking partnerships'],
      goals: ['Regulatory compliance', 'User growth', 'Transaction volume', 'Risk management'],
      requiredTech: ['Payment processing', 'KYC/AML tools', 'Cloud infrastructure', 'Security platform'],
    },
    ecommerce: {
      companySizes: ['11-50', '51-200', '201-1000'],
      challenges: ['Cart abandonment', 'Supply chain optimization', 'Customer retention', 'Omnichannel experience'],
      buyingSignals: ['Platform migration', 'Marketplace expansion', 'Fulfillment center opening', 'Series C+ funding'],
      goals: ['Increase conversion rate', 'Reduce CAC', 'Improve LTV', 'Expand product lines'],
      requiredTech: ['E-commerce platform', 'Payment gateway', 'Inventory management', 'Analytics platform'],
    },
    manufacturing: {
      companySizes: ['51-200', '201-500', '501-5000'],
      challenges: ['Supply chain visibility', 'Quality control', 'Workforce training', 'Digital transformation'],
      buyingSignals: ['ERP modernization', 'IoT adoption', 'New facility construction', 'Sustainability initiatives'],
      goals: ['Operational efficiency', 'Quality improvement', 'Cost reduction', 'Sustainability'],
      requiredTech: ['ERP system', 'MES', 'IoT platform', 'Quality management system'],
    },
  };

  // Find matching suggestions
  const lowerIndustry = industry.toLowerCase();
  let matched: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(suggestions)) {
    if (lowerIndustry.includes(key)) {
      matched = value;
      break;
    }
  }

  // Default suggestions if no match
  if (Object.keys(matched).length === 0) {
    matched = {
      companySizes: ['11-50', '51-200', '201-500'],
      challenges: ['Scaling operations', 'Digital transformation', 'Customer acquisition', 'Talent retention'],
      buyingSignals: ['Recent funding', 'Key leadership hires', 'Technology adoption', 'Market expansion'],
      goals: ['Revenue growth', 'Operational efficiency', 'Market expansion', 'Customer satisfaction'],
      requiredTech: ['Cloud infrastructure', 'CRM', 'Analytics platform', 'Collaboration tools'],
    };
  }

  return NextResponse.json({
    success: true,
    suggestions: matched,
    industry,
  });
}
