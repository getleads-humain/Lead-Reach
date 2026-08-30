// ============================================================
// Dashboard Stats — Single Source of Truth
// ============================================================
// Returns ALL dashboard metrics in one server-side aggregated call.
// Eliminates client-side orchestration of 3 endpoints and the
// >1000-lead truncation bug.
//
// Returns:
//   - totalCampaigns, activeCampaigns, completedCampaigns
//   - totalLeads, newLeadsToday, newLeadsThisWeek
//   - leadsByStage (new/enriched/qualified/contacted/engaged/closed_won)
//   - leadsByTier (super_hot/hot/warm/cold/unqualified)
//   - averageLeadScore
//   - pipelineValue (sum of deals or estimated)
//   - responseRate (contacted leads that responded)
//   - activeAgents (real count from workforce + agent tasks)
//   - campaignBreakdown (per-campaign: name, lead count, tier breakdown)
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // ── Campaign stats ──
    const campaigns = await db.campaign.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        leadsFound: true,
        leadsQualified: true,
        leadsContacted: true,
        createdAt: true,
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'active' || c.status === 'running').length;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length;
    const newCampaignsThisWeek = campaigns.filter(c => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(c.createdAt) > weekAgo;
    }).length;

    // ── Lead stats (DB-accurate, no truncation) ──
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalLeads,
      newLeadsToday,
      newLeadsThisWeek,
      leadsByStageRaw,
      leadsByTierRaw,
      avgScoreResult,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { discoveredAt: { gte: todayStart } } }),
      db.lead.count({ where: { discoveredAt: { gte: weekAgo } } }),
      db.lead.groupBy({ by: ['stage'], _count: true }),
      db.lead.groupBy({ by: ['leadTier'], _count: true }),
      db.lead.aggregate({ _avg: { leadScore: true } }),
    ]);

    // Convert groupBy results to objects
    const leadsByStage: Record<string, number> = {};
    for (const g of leadsByStageRaw) {
      leadsByStage[g.stage] = g._count;
    }

    const leadsByTier: Record<string, number> = {
      super_hot: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      unqualified: 0,
    };
    for (const g of leadsByTierRaw) {
      if (leadsByTier.hasOwnProperty(g.leadTier)) {
        leadsByTier[g.leadTier] = g._count;
      } else {
        leadsByTier[g.leadTier] = g._count; // catch any custom tiers
      }
    }

    const averageLeadScore = Math.round(avgScoreResult._avg.leadScore || 0);

    // ── Pipeline metrics ──
    const qualifiedLeads = leadsByStage['qualified'] || 0;
    const contactedLeads = leadsByStage['contacted'] || 0;
    const engagedLeads = leadsByStage['engaged'] || 0;
    const closedWon = leadsByStage['closed_won'] || 0;
    const enrichedLeads = (leadsByStage['enriched'] || 0) + qualifiedLeads + contactedLeads + engagedLeads + closedWon;

    // Response rate = leads that were contacted AND engaged/closed
    const responseRate = contactedLeads > 0
      ? Math.round(((engagedLeads + closedWon) / contactedLeads) * 100)
      : 0;

    // Pipeline value (estimated from qualified leads — would need real deal data)
    const avgDealSize = 5000; // placeholder — could be from settings
    const pipelineValue = qualifiedLeads * avgDealSize;

    // ── Agent stats ──
    const [workforceAgents, agentTasks] = await Promise.all([
      db.workforceAgent.count({ where: { status: { in: ['active', 'busy'] } } }),
      db.agentTask.count(),
    ]);

    const activeAgents = workforceAgents;
    const totalAgentTasks = agentTasks;

    // ── Campaign breakdown (per-campaign: lead count + tier breakdown) ──
    const campaignBreakdown = await Promise.all(
      campaigns.slice(0, 20).map(async (c) => {
        const tierCounts = await db.lead.groupBy({
          by: ['leadTier'],
          where: { campaignId: c.id },
          _count: true,
        });

        const tiers: Record<string, number> = { super_hot: 0, hot: 0, warm: 0, cold: 0 };
        for (const t of tierCounts) {
          tiers[t.leadTier] = t._count;
        }

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          totalLeads: c._count.leads,
          hotLeads: tiers['hot'] + (tiers['super_hot'] || 0),
          warmLeads: tiers['warm'] || 0,
          coldLeads: tiers['cold'] || 0,
        };
      })
    );

    return NextResponse.json({
      // Campaign metrics
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      newCampaignsThisWeek,

      // Lead metrics
      totalLeads,
      newLeadsToday,
      newLeadsThisWeek,
      qualifiedLeads,
      enrichedLeads,
      contactedLeads,
      engagedLeads,
      closedWon,
      averageLeadScore,
      pipelineValue,
      responseRate,

      // Stage distribution
      leadsByStage,

      // Tier distribution
      leadsByTier,

      // Agent metrics
      activeAgents,
      totalAgentTasks,

      // Per-campaign breakdown
      campaignBreakdown,

      // Timestamp
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Dashboard Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
