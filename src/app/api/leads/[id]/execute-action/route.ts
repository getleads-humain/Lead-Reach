import { db } from '@/lib/db';
import { callLLM } from '@/lib/llm';
import { NextRequest, NextResponse } from 'next/server';

// Action types that map to specific AI execution strategies
type ActionType =
  | 'identify_contact'
  | 'leverage_intent'
  | 'improve_reachability'
  | 'research_company'
  | 'compose_outreach'
  | 'competitive_analysis'
  | 'custom';

interface ActionExecutionRequest {
  actionType: ActionType;
  actionTitle: string;
  actionDescription: string;
  leadData: {
    companyName: string;
    industry: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    employeeCount: string | null;
    revenueEstimate: string | null;
    leadScore: number;
    firmographicScore: number;
    intentScore: number;
    reachabilityScore: number;
    strategicScore: number;
    dataCompleteness: number;
    keyContactName: string | null;
    keyContactTitle: string | null;
    keyContactEmail: string | null;
    ceoName: string | null;
    ceoEmail: string | null;
    linkedinUrl: string | null;
    techStack: string | null;
    stage: string;
    leadTier: string;
    industryConnections?: string;
    notes?: string | null;
  };
  /** For multi-stage actions: which sub-step to execute (1-based) */
  stage?: number;
  /** Results from previous stages (for context) */
  previousResults?: string[];
}

// ============================================================
// Action-specific system prompts and user prompt builders
// ============================================================

function getActionSystemPrompt(actionType: ActionType): string {
  const base = 'You are a B2B sales intelligence expert working for LeadReach, a B2B lead generation platform. Provide specific, actionable, and realistic results. Always include concrete details (names, titles, approaches, channels). Be thorough but concise.';

  switch (actionType) {
    case 'identify_contact':
      return `${base} Your specialty is identifying key decision-makers and contacts within target companies. When analyzing a lead, you should:
1. Identify the most likely decision-maker roles based on the company's industry, size, and the product/service being sold
2. Suggest specific people or roles to target
3. Provide strategies for reaching them (warm intros, events they attend, communities they're part of)
4. Recommend contact verification approaches
Format your response with clear sections: Target Roles, Specific Recommendations, Outreach Strategy, Contact Verification Steps.`;

    case 'leverage_intent':
      return `${base} Your specialty is leveraging buying intent signals to create personalized outreach strategies. When analyzing intent data:
1. Analyze what the intent signals tell you about the prospect's pain points and priorities
2. Suggest specific content, case studies, or market research to share
3. Create a value proposition tailored to their intent profile
4. Recommend timing and approach for outreach based on intent strength
Format your response with clear sections: Intent Analysis, Recommended Content, Personalized Value Proposition, Outreach Timing & Approach.`;

    case 'improve_reachability':
      return `${base} Your specialty is finding and optimizing outreach channels for hard-to-reach prospects. When improving reachability:
1. Identify all possible direct and indirect channels to reach the target
2. Map out potential warm introduction paths through mutual connections
3. Suggest industry events, conferences, and communities where you might connect
4. Recommend social selling approaches and engagement strategies
Format your response with clear sections: Channel Analysis, Warm Introduction Paths, Event & Community Opportunities, Social Selling Strategy.`;

    case 'research_company':
      return `${base} Your specialty is deep company research and analysis. When researching a target company:
1. Analyze their business model, revenue streams, and growth trajectory
2. Identify recent news, funding, product launches, or strategic moves
3. Map their technology landscape and potential pain points
4. Assess strategic fit and potential value as a customer
Format your response with clear sections: Company Overview, Recent Developments, Technology Landscape, Strategic Fit Assessment, Key Pain Points.`;

    case 'compose_outreach':
      return `${base} Your specialty is crafting personalized B2B outreach messages. When composing outreach:
1. Create a compelling subject line that speaks to their specific situation
2. Write a personalized email body that references their context
3. Include a clear call-to-action appropriate for the relationship stage
4. Suggest follow-up sequence if no response
Format your response with clear sections: Subject Line, Email Body, Call-to-Action, Follow-up Sequence (3 emails).`;

    case 'competitive_analysis':
      return `${base} Your specialty is competitive intelligence for B2B sales. When analyzing competition:
1. Identify likely competitors the prospect is considering or using
2. Analyze competitive advantages and disadvantages
3. Suggest positioning strategies and talking points
4. Provide objection handling approaches
Format your response with clear sections: Competitive Landscape, Key Differentiators, Positioning Strategy, Objection Handling.`;

    default:
      return `${base} Analyze the situation and provide detailed, actionable recommendations with specific next steps.`;
  }
}

function buildActionUserPrompt(req: ActionExecutionRequest): string {
  const { actionType, actionTitle, actionDescription, leadData, stage, previousResults } = req;

  const leadContext = `
Company: ${leadData.companyName}
Industry: ${leadData.industry || 'Unknown'}
Location: ${[leadData.city, leadData.country].filter(Boolean).join(', ') || 'Unknown'}
Website: ${leadData.website || 'Unknown'}
Employees: ${leadData.employeeCount || 'Unknown'}
Revenue: ${leadData.revenueEstimate || 'Unknown'}
Stage: ${leadData.stage}
Tier: ${leadData.leadTier}
Score: ${leadData.leadScore}/100
  - Firmographic: ${leadData.firmographicScore}/100
  - Intent: ${leadData.intentScore}/100
  - Reachability: ${leadData.reachabilityScore}/100
  - Strategic: ${leadData.strategicScore}/100
  - Data Quality: ${leadData.dataCompleteness}/100
Key Contact: ${leadData.keyContactName || 'Not identified'}${leadData.keyContactTitle ? ` (${leadData.keyContactTitle})` : ''}
Key Contact Email: ${leadData.keyContactEmail || 'Not available'}
CEO: ${leadData.ceoName || 'Not identified'}${leadData.ceoEmail ? ` (${leadData.ceoEmail})` : ''}
LinkedIn: ${leadData.linkedinUrl || 'Not available'}
Tech Stack: ${leadData.techStack || 'Unknown'}
${leadData.notes ? `Notes: ${leadData.notes}` : ''}`;

  const previousContext = previousResults && previousResults.length > 0
    ? `\n\nPrevious action results (use this context to build upon):\n${previousResults.map((r, i) => `Stage ${i + 1} Results:\n${r}`).join('\n\n')}`
    : '';

  const stageInstruction = stage && stage > 1
    ? `\n\nThis is stage ${stage} of this action. Build upon the previous results and go deeper. Provide the next level of actionable detail.`
    : '';

  return `Execute the following action for this B2B lead:

ACTION: ${actionTitle}
DESCRIPTION: ${actionDescription}
ACTION TYPE: ${actionType}

LEAD PROFILE:
${leadContext}
${previousContext}
${stageInstruction}

Provide detailed, specific, and actionable results for this action. Include concrete details where possible. Format with clear section headers using markdown.`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify lead exists
    const lead = await db.lead.findUnique({
      where: { id },
      include: { campaign: { select: { name: true } } },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const body: ActionExecutionRequest = await request.json();
    const { actionType, actionTitle, actionDescription, stage = 1, previousResults = [] } = body;

    if (!actionType || !actionTitle) {
      return NextResponse.json(
        { error: 'actionType and actionTitle are required' },
        { status: 400 }
      );
    }

    // Build the prompt
    const leadData = body.leadData || {
      companyName: lead.companyName,
      industry: lead.industry,
      city: lead.city,
      country: lead.country,
      website: lead.website,
      employeeCount: lead.employeeCount,
      revenueEstimate: lead.revenueEstimate,
      leadScore: lead.leadScore,
      firmographicScore: lead.firmographicScore,
      intentScore: lead.intentScore,
      reachabilityScore: lead.reachabilityScore,
      strategicScore: lead.strategicScore,
      dataCompleteness: lead.dataCompleteness,
      keyContactName: lead.keyContactName,
      keyContactTitle: lead.keyContactTitle,
      keyContactEmail: lead.keyContactEmail,
      ceoName: lead.ceoName,
      ceoEmail: lead.ceoEmail,
      linkedinUrl: lead.linkedinUrl,
      techStack: lead.techStack,
      stage: lead.stage,
      leadTier: lead.leadTier,
      notes: lead.notes,
    };

    const systemPrompt = getActionSystemPrompt(actionType as ActionType);
    const userPrompt = buildActionUserPrompt({
      actionType: actionType as ActionType,
      actionTitle,
      actionDescription,
      leadData,
      stage,
      previousResults,
    });

    // Call LLM
    const result = await callLLM({
      systemPrompt,
      userMessage: userPrompt,
      temperature: 0.5,
      maxTokens: 4096,
      thinkingBudget: 'deep',
    });

    if (!result) {
      return NextResponse.json(
        { error: 'AI failed to generate action results' },
        { status: 500 }
      );
    }

    // If this is a contact identification action and we found new contacts,
    // optionally update the lead notes with action results
    if (stage === 1 && actionType === 'identify_contact') {
      const notesUpdate = `[AI Action - ${actionTitle}]: ${result.slice(0, 500)}`;
      const currentNotes = lead.notes || '';
      await db.lead.update({
        where: { id },
        data: {
          notes: currentNotes
            ? `${currentNotes}\n\n${notesUpdate}`
            : notesUpdate,
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      actionType,
      actionTitle,
      stage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[execute-action] Error:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
}
