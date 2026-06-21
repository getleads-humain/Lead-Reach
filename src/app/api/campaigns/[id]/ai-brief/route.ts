/**
 * /api/campaigns/[id]/ai-brief
 *
 * Generates an AI-powered campaign brief for a given campaign ID.
 * Loads the campaign + its leads + outreach history, hands the data
 * to glm-4.6v-flash / glm-4.7-flash, and returns a structured brief
 * the user can act on:
 *
 *   - Target segment analysis
 *   - Recommended outreach angles
 *   - Top leads to prioritize
 *   - Risk factors / gaps in the data
 *   - Suggested next steps
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
    }

    // Optional user-supplied instruction (e.g. "focus on enterprise leads")
    const body = await request.json().catch(() => ({} as Record<string, unknown>));
    const userInstruction = (body?.userInstruction as string) || '';

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const leads = await db.lead.findMany({
      where: { campaignId },
      take: 100,
      orderBy: { leadScore: 'desc' },
      select: {
        id: true,
        companyName: true,
        industry: true,
        leadTier: true,
        leadScore: true,
        stage: true,
        keyContactName: true,
        keyContactTitle: true,
        city: true,
        country: true,
        employeeCount: true,
        revenueEstimate: true,
        website: true,
        notes: true,
      },
    });

    const outreach = await db.outreach.findMany({
      where: { lead: { campaignId } },
      take: 100,
      orderBy: { createdAt: 'desc' },
      select: { id: true, channel: true, type: true, status: true, subject: true, createdAt: true },
    });

    // Build the campaign snapshot
    const snapshot = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        targetIndustry: campaign.targetIndustry,
        targetLocation: campaign.targetLocation,
        targetCompanySize: campaign.targetCompanySize,
        targetCriteria: campaign.targetCriteria,
        createdAt: campaign.createdAt,
      },
      leads: {
        total: leads.length,
        byTier: {
          hot: leads.filter(l => l.leadTier === 'hot').length,
          warm: leads.filter(l => l.leadTier === 'warm').length,
          cold: leads.filter(l => l.leadTier === 'cold').length,
          unassigned: leads.filter(l => !l.leadTier).length,
        },
        byStage: {
          new: leads.filter(l => l.stage === 'new').length,
          enriched: leads.filter(l => l.stage === 'enriched').length,
          qualified: leads.filter(l => l.stage === 'qualified').length,
          contacted: leads.filter(l => l.stage === 'contacted' || l.stage === 'engaged').length,
          negotiated: leads.filter(l => l.stage === 'negotiating').length,
        },
        topLeads: leads.slice(0, 10).map(l => ({
          company: l.companyName,
          contact: l.keyContactName,
          title: l.keyContactTitle,
          tier: l.leadTier,
          score: l.leadScore,
          industry: l.industry,
          location: [l.city, l.country].filter(Boolean).join(', '),
          website: l.website,
        })),
      },
      outreach: {
        total: outreach.length,
        byStatus: {
          draft: outreach.filter(o => o.status === 'draft').length,
          sent: outreach.filter(o => o.status === 'sent').length,
          delivered: outreach.filter(o => o.status === 'delivered').length,
          opened: outreach.filter(o => o.status === 'opened').length,
          replied: outreach.filter(o => o.status === 'replied').length,
        },
        byChannel: {
          email: outreach.filter(o => o.channel === 'email').length,
          linkedin: outreach.filter(o => o.channel === 'linkedin').length,
          phone: outreach.filter(o => o.channel === 'phone').length,
        },
      },
    };

    const systemPrompt = `You are a senior B2B campaign strategist for a lead generation platform. Given a campaign snapshot (campaign + leads + outreach history), produce a structured campaign brief as JSON with this EXACT shape:

{
  "targetSegmentAnalysis": "2-4 sentence description of the campaign's actual reach based on the lead data",
  "recommendedOutreachAngles": [
    {
      "angle": "Short title for the angle",
      "rationale": "1-2 sentence rationale referencing specific data points",
      "priority": "high" | "medium" | "low"
    }
  ],
  "topLeadsToPrioritize": [
    {
      "company": "Company name",
      "reason": "Why this lead should be prioritized now (1 sentence with specific data)",
      "recommendedAction": "Concrete next action (e.g. 'Send LinkedIn connection request to <contact>')"
    }
  ],
  "riskFactors": [
    "Risk 1 with specific data reference",
    "Risk 2 ..."
  ],
  "suggestedNextSteps": [
    "Step 1 with concrete action",
    "Step 2 ...",
    "Step 3 ..."
  ],
  "projectedOutcome": "1-2 sentence prediction of likely outcome if recommendations are followed"
}

Rules:
- Reference specific numbers from the data (counts, tiers, channels, industries).
- Make every recommendation concrete and actionable — no generic advice.
- Always respond in English.
- Return ONLY valid JSON.`;

    const userMessage = `CAMPAIGN SNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}\n\n${userInstruction ? `USER INSTRUCTION: ${userInstruction}\n\n` : ''}Generate the campaign brief.`;

    const brief = await callLLMForJSON<Record<string, unknown>>(
      systemPrompt,
      userMessage,
      { temperature: 0.4, maxTokens: 5000, model: MODEL_PRIMARY, thinkingBudget: 'standard' }
    );

    if (!brief) {
      return NextResponse.json({
        brief: getDefaultBrief(snapshot),
      });
    }

    return NextResponse.json({ brief });
  } catch (error) {
    console.error('[campaigns/ai-brief] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate AI campaign brief', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getDefaultBrief(snapshot: { campaign: { name: string; targetIndustry: string | null }; leads: { total: number; byTier: { hot: number } } }) {
  return {
    targetSegmentAnalysis: `Campaign "${snapshot.campaign.name}" targeting ${snapshot.campaign.targetIndustry || 'general industries'} has ${snapshot.leads.total} leads with ${snapshot.leads.byTier.hot} hot leads.`,
    recommendedOutreachAngles: [
      { angle: 'Direct personalized email', rationale: 'Hot leads deserve a tailored email referencing their industry context.', priority: 'high' },
      { angle: 'LinkedIn follow-up', rationale: 'Multi-channel touchpoints increase response rates.', priority: 'medium' },
    ],
    topLeadsToPrioritize: [],
    riskFactors: ['AI brief generation failed — using fallback. Verify pipeline health manually.'],
    suggestedNextSteps: [
      'Review hot leads and craft personalized outreach',
      'Enrich cold leads with firmographic data',
      'Schedule follow-up cadence for warm leads',
    ],
    projectedOutcome: 'Brief generation failed — manual analysis required.',
  };
}
