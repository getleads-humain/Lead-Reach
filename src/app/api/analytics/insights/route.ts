/**
 * /api/analytics/insights
 *
 * Generates AI-powered insights from the user's pipeline analytics data.
 * The endpoint:
 *   1. Aggregates lead, campaign, setter, outreach, and booking data from the DB
 *   2. Hands the aggregated snapshot to glm-4.6v-flash (primary) / glm-4.7-flash (fallback)
 *   3. Returns structured insights: trends, opportunities, risks, recommendations
 *
 * Output shape:
 *   {
 *     insights: Array<{
 *       type: 'opportunity' | 'risk' | 'trend' | 'recommendation',
 *       title: string,
 *       description: string,
 *       impact: 'high' | 'medium' | 'low',
 *       actionRequired: boolean
 *     }>,
 *     executiveSummary: string
 *   }
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Aggregate pipeline data in parallel
    const [
      leads,
      campaigns,
      setters,
      conversations,
      outreach,
      abTests,
      followUps,
    ] = await Promise.all([
      db.lead.findMany({ select: { id: true, stage: true, leadTier: true, leadScore: true, industry: true, createdAt: true, campaignId: true } }),
      db.campaign.findMany({ select: { id: true, name: true, status: true, targetIndustry: true, createdAt: true } }),
      db.aISetter.findMany(),
      db.setterConversation.findMany({ take: 100, orderBy: { updatedAt: 'desc' } }),
      db.outreach.findMany({ take: 100, orderBy: { createdAt: 'desc' }, select: { id: true, status: true, channel: true, type: true, createdAt: true } }),
      db.aBTest.findMany(),
      db.followUpSequence.findMany(),
    ]);

    // Compute summary metrics
    const totalLeads = leads.length;
    const hotLeads = leads.filter(l => l.leadTier === 'hot').length;
    const warmLeads = leads.filter(l => l.leadTier === 'warm').length;
    const coldLeads = leads.filter(l => l.leadTier === 'cold').length;
    const qualified = leads.filter(l => l.stage === 'qualified' || l.stage === 'enriched').length;
    const contacted = leads.filter(l => l.stage === 'contacted' || l.stage === 'engaged').length;
    const avgScore = leads.length > 0 ? Math.round(leads.reduce((a, l) => a + (l.leadScore || 0), 0) / leads.length) : 0;

    const channelBreakdown = ['sms', 'whatsapp', 'instagram', 'messenger', 'email'].map(ch => {
      const chConvs = conversations.filter(c => c.leadChannel === ch);
      return {
        channel: ch,
        total: chConvs.length,
        qualified: chConvs.filter(c => c.status === 'qualified' || c.status === 'booked').length,
        booked: chConvs.filter(c => c.bookedAppointment).length,
        avgScore: chConvs.length > 0 ? Math.round(chConvs.reduce((a, c) => a + c.qualificationScore, 0) / chConvs.length) : 0,
      };
    });

    const outreachStatusBreakdown = {
      draft: outreach.filter(o => o.status === 'draft').length,
      sent: outreach.filter(o => o.status === 'sent').length,
      delivered: outreach.filter(o => o.status === 'delivered').length,
      opened: outreach.filter(o => o.status === 'opened').length,
      replied: outreach.filter(o => o.status === 'replied').length,
      bounced: outreach.filter(o => o.status === 'bounced').length,
    };

    const industryBreakdown: Record<string, number> = {};
    for (const l of leads) {
      const ind = l.industry || 'Unknown';
      industryBreakdown[ind] = (industryBreakdown[ind] || 0) + 1;
    }

    const topIndustries = Object.entries(industryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([industry, count]) => ({ industry, count }));

    const snapshot = {
      summary: {
        totalLeads,
        hotLeads,
        warmLeads,
        coldLeads,
        qualified,
        contacted,
        avgScore,
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalConversations: conversations.length,
        totalBookings: conversations.filter(c => c.bookedAppointment).length,
        totalOutreach: outreach.length,
      },
      channelBreakdown,
      outreachStatusBreakdown,
      topIndustries,
      setters: setters.map(s => ({
        name: s.name,
        conversations: s.conversationsHandled,
        qualified: s.leadsQualified,
        booked: s.leadsBooked,
        conversionRate: s.conversionRate,
        avgResponseTime: s.avgResponseTime,
      })),
      abTestsCount: abTests.length,
      followUpsCount: followUps.length,
    };

    // Ask the LLM for insights + executive summary
    const systemPrompt = `You are a senior sales analytics expert. Given a JSON snapshot of a B2B lead-generation pipeline, return ONLY valid JSON with the following exact structure:
{
  "insights": [
    {
      "type": "opportunity" | "risk" | "trend" | "recommendation",
      "title": "Short headline (max 10 words)",
      "description": "1-3 sentence explanation with specific numbers from the data",
      "impact": "high" | "medium" | "low",
      "actionRequired": true | false
    }
  ],
  "executiveSummary": "A 2-3 sentence executive summary of pipeline health"
}

Rules:
- Generate 4-7 insights covering a mix of opportunities, risks, trends, and recommendations.
- Always reference specific numbers (counts, percentages, channel names) from the data.
- Be concise but specific — no generic platitudes.
- If data is empty or sparse, note that as a risk and recommend initial action.
- Always respond in English.`;

    const userMessage = `PIPELINE SNAPSHOT:\n${JSON.stringify(snapshot, null, 2)}\n\nGenerate insights and an executive summary now.`;

    const result = await callLLMForJSON<{
      insights?: Array<{
        type: string;
        title: string;
        description: string;
        impact: string;
        actionRequired: boolean;
      }>;
      executiveSummary?: string;
    }>(systemPrompt, userMessage, {
      temperature: 0.3,
      maxTokens: 3500,
      model: MODEL_PRIMARY,
      thinkingBudget: 'standard',
    });

    // Fallback if LLM fails
    if (!result || !result.insights || !Array.isArray(result.insights)) {
      return NextResponse.json({
        insights: getDefaultInsights(snapshot),
        executiveSummary: getDefaultSummary(snapshot),
      });
    }

    // Normalize insight types and impact values
    const validTypes = new Set(['opportunity', 'risk', 'trend', 'recommendation']);
    const validImpacts = new Set(['high', 'medium', 'low']);
    const normalizedInsights = result.insights.map(i => ({
      type: validTypes.has(i.type) ? (i.type as 'opportunity' | 'risk' | 'trend' | 'recommendation') : 'recommendation',
      title: i.title || 'Insight',
      description: i.description || '',
      impact: validImpacts.has(i.impact) ? (i.impact as 'high' | 'medium' | 'low') : 'medium',
      actionRequired: typeof i.actionRequired === 'boolean' ? i.actionRequired : false,
    }));

    return NextResponse.json({
      insights: normalizedInsights,
      executiveSummary: result.executiveSummary || getDefaultSummary(snapshot),
    });
  } catch (error) {
    console.error('[analytics/insights] Error:', error);
    return NextResponse.json(
      {
        insights: [{
          type: 'risk' as const,
          title: 'Analytics pipeline unavailable',
          description: 'Could not generate AI insights — the analytics engine encountered an error. Pipeline data may be incomplete.',
          impact: 'medium' as const,
          actionRequired: false,
        }],
        executiveSummary: 'Analytics insights are temporarily unavailable. Please retry in a moment.',
      },
      { status: 200 }
    );
  }
}

function getDefaultSummary(snapshot: { summary: { totalLeads: number; hotLeads: number; qualified: number; totalCampaigns: number } }): string {
  const s = snapshot.summary;
  if (s.totalLeads === 0) {
    return 'No leads in the pipeline yet. Start by creating a campaign and running the discovery agent.';
  }
  return `Pipeline contains ${s.totalLeads} leads across ${s.totalCampaigns} campaigns, with ${s.hotLeads} hot leads and ${s.qualified} qualified. Focus on converting hot leads into outreach.`;
}

function getDefaultInsights(snapshot: { summary: { totalLeads: number; hotLeads: number; warmLeads: number; coldLeads: number; qualified: number; totalCampaigns: number; totalBookings: number } }) {
  const s = snapshot.summary;
  const insights: Array<{ type: 'opportunity' | 'risk' | 'trend' | 'recommendation'; title: string; description: string; impact: 'high' | 'medium' | 'low'; actionRequired: boolean }> = [];

  if (s.totalLeads === 0) {
    insights.push({
      type: 'risk',
      title: 'Empty pipeline',
      description: 'No leads found. Launch a discovery campaign to populate the pipeline.',
      impact: 'high',
      actionRequired: true,
    });
  } else {
    if (s.hotLeads > 0) {
      insights.push({
        type: 'opportunity',
        title: `${s.hotLeads} hot leads ready for outreach`,
        description: `${s.hotLeads} hot leads are waiting — prioritize personalized outreach to maximize conversion.`,
        impact: 'high',
        actionRequired: true,
      });
    }
    if (s.totalBookings > 0) {
      insights.push({
        type: 'trend',
        title: `${s.totalBookings} meetings booked`,
        description: `Bookings are flowing. Continue the cadence that produced ${s.totalBookings} meetings.`,
        impact: 'medium',
        actionRequired: false,
      });
    }
    if (s.warmLeads > s.hotLeads * 2) {
      insights.push({
        type: 'recommendation',
        title: 'Nurture warm leads',
        description: `Warm leads (${s.warmLeads}) outnumber hot leads (${s.hotLeads}). Consider a nurture sequence to convert warm → hot.`,
        impact: 'medium',
        actionRequired: true,
      });
    }
  }

  return insights;
}
