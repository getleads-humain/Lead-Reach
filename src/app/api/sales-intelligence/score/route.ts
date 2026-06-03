import { NextRequest, NextResponse } from 'next/server';
import { scoreLead, leadToScoringInput } from '@/lib/sales-intelligence';
import { db } from '@/lib/db';

/**
 * POST /api/sales-intelligence/score
 *
 * Score a lead using BANT + MEDDIC methodology.
 * Can accept either:
 * 1. Raw scoring signals: { company, budgetSignals, authoritySignals, needSignals, timelineSignals }
 * 2. A lead ID: { leadId } — auto-derives signals from the lead's enriched data
 *
 * Returns full scoring result with grade, confidence, recommended action, and prospect score.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let scoringInput;

    if (body.leadId) {
      // Score from an existing lead
      const lead = await db.lead.findUnique({ where: { id: body.leadId } });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      scoringInput = leadToScoringInput(lead);
    } else if (body.company) {
      // Score from raw signals
      scoringInput = {
        company: body.company,
        budgetSignals: body.budgetSignals || {},
        authoritySignals: body.authoritySignals || {},
        needSignals: body.needSignals || {},
        timelineSignals: body.timelineSignals || {},
      };
    } else {
      return NextResponse.json(
        { error: 'Provide either leadId or company name with scoring signals' },
        { status: 400 }
      );
    }

    const result = scoreLead(scoringInput);

    // If scoring from a leadId, optionally update the lead's score in the DB
    if (body.leadId && body.updateLead !== false) {
      await db.lead.update({
        where: { id: body.leadId },
        data: {
          leadScore: result.prospectScore,
          firmographicScore: result.bantBreakdown.budget.score * 4, // Scale to 0-100
          intentScore: result.bantBreakdown.need.score * 4,
          reachabilityScore: result.bantBreakdown.authority.score * 4,
          strategicScore: result.bantBreakdown.timeline.score * 4,
          leadTier: result.leadGrade === 'A+' || result.leadGrade === 'A' ? 'hot' :
            result.leadGrade === 'B' ? 'warm' :
            result.leadGrade === 'C' ? 'cold' : 'unqualified',
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Sales Intel Score] Error:', error);
    return NextResponse.json(
      { error: 'Scoring failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sales-intelligence/score?campaignId=xxx
 *
 * Score all leads in a campaign (or all leads) and return a summary.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;

    const leads = await db.lead.findMany({
      where,
      take: limit,
      select: {
        id: true,
        companyName: true,
        leadScore: true,
        leadTier: true,
        dataCompleteness: true,
        stage: true,
        industry: true,
        employeeCount: true,
        revenueEstimate: true,
        ceoName: true,
        keyContactName: true,
        techStack: true,
        intentKeywords: true,
        newsMentions: true,
        description: true,
      },
    });

    const scoredLeads = leads.map(lead => {
      const input = leadToScoringInput(lead as any);
      return scoreLead(input);
    });

    // Sort by prospect score descending
    scoredLeads.sort((a, b) => b.prospectScore - a.prospectScore);

    // Grade distribution
    const gradeDistribution: Record<string, number> = {};
    for (const lead of scoredLeads) {
      gradeDistribution[lead.leadGrade] = (gradeDistribution[lead.leadGrade] || 0) + 1;
    }

    return NextResponse.json({
      totalScored: scoredLeads.length,
      gradeDistribution,
      averageScore: scoredLeads.length > 0
        ? Math.round(scoredLeads.reduce((sum, l) => sum + l.prospectScore, 0) / scoredLeads.length)
        : 0,
      topProspects: scoredLeads.slice(0, 10),
      allScores: scoredLeads,
    });
  } catch (error) {
    console.error('[Sales Intel Score] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to score leads' },
      { status: 500 }
    );
  }
}
