/**
 * Pipeline Health — Lead pipeline effectiveness metrics
 * ==============================================================================
 * GET /api/leads/pipeline-health
 *
 * Returns comprehensive pipeline health metrics:
 * - Tier distribution across all leads
 * - Average score by tier
 * - Enrichment completion rates
 * - Pipeline velocity (stage progression)
 * - Tier upgrade success rate
 * - Super hot conversion rate
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const leads = await db.lead.findMany({
      select: {
        id: true,
        leadScore: true,
        leadTier: true,
        stage: true,
        dataCompleteness: true,
        enrichedAt: true,
        qualifiedAt: true,
        contactedAt: true,
        discoveredAt: true,
        firmographicScore: true,
        intentScore: true,
        reachabilityScore: true,
        strategicScore: true,
      },
    });

    const totalLeads = leads.length;

    // Tier distribution
    const tierDistribution: Record<string, number> = {
      super_hot: 0,
      hot: 0,
      warm: 0,
      cold: 0,
      unqualified: 0,
    };
    leads.forEach(l => {
      const tier = l.leadTier || 'unqualified';
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
    });

    // Average score by tier
    const tierScores: Record<string, { avg: number; min: number; max: number }> = {};
    const tierGroups: Record<string, number[]> = {};
    leads.forEach(l => {
      const tier = l.leadTier || 'unqualified';
      if (!tierGroups[tier]) tierGroups[tier] = [];
      tierGroups[tier].push(l.leadScore || 0);
    });
    for (const [tier, scores] of Object.entries(tierGroups)) {
      tierScores[tier] = {
        avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        min: Math.min(...scores),
        max: Math.max(...scores),
      };
    }

    // Enrichment completion
    const enrichedCount = leads.filter(l => l.enrichedAt).length;
    const qualifiedCount = leads.filter(l => l.qualifiedAt).length;
    const contactedCount = leads.filter(l => l.contactedAt).length;

    // Stage distribution
    const stageDistribution: Record<string, number> = {};
    leads.forEach(l => {
      const stage = l.stage || 'new';
      stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
    });

    // Average dimension scores
    const dimensionAverages = {
      firmographic: 0,
      intent: 0,
      reachability: 0,
      strategic: 0,
      dataCompleteness: 0,
    };
    if (totalLeads > 0) {
      dimensionAverages.firmographic = Math.round(
        leads.reduce((sum, l) => sum + (l.firmographicScore || 0), 0) / totalLeads
      );
      dimensionAverages.intent = Math.round(
        leads.reduce((sum, l) => sum + (l.intentScore || 0), 0) / totalLeads
      );
      dimensionAverages.reachability = Math.round(
        leads.reduce((sum, l) => sum + (l.reachabilityScore || 0), 0) / totalLeads
      );
      dimensionAverages.strategic = Math.round(
        leads.reduce((sum, l) => sum + (l.strategicScore || 0), 0) / totalLeads
      );
      dimensionAverages.dataCompleteness = Math.round(
        leads.reduce((sum, l) => sum + (l.dataCompleteness || 0), 0) / totalLeads
      );
    }

    // Super hot conversion rate
    const superHotCount = tierDistribution.super_hot || 0;
    const superHotRate = totalLeads > 0 ? Math.round((superHotCount / totalLeads) * 100) : 0;

    // Pipeline velocity (enriched → qualified → contacted progression)
    const pipelineVelocity = {
      discoveryToEnriched: enrichedCount > 0 && totalLeads > 0
        ? Math.round((enrichedCount / totalLeads) * 100) : 0,
      enrichedToQualified: enrichedCount > 0
        ? Math.round((qualifiedCount / enrichedCount) * 100) : 0,
      qualifiedToContacted: qualifiedCount > 0
        ? Math.round((contactedCount / qualifiedCount) * 100) : 0,
    };

    // Average data completeness
    const avgDataCompleteness = totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.dataCompleteness || 0), 0) / totalLeads)
      : 0;

    // Pipeline efficiency score (composite)
    const pipelineEfficiency = Math.round(
      (pipelineVelocity.discoveryToEnriched * 0.3 +
       pipelineVelocity.enrichedToQualified * 0.3 +
       pipelineVelocity.qualifiedToContacted * 0.2 +
       superHotRate * 0.2)
    );

    return NextResponse.json({
      totalLeads,
      tierDistribution,
      tierScores,
      stageDistribution,
      dimensionAverages,
      enrichment: {
        enriched: enrichedCount,
        enrichedRate: totalLeads > 0 ? Math.round((enrichedCount / totalLeads) * 100) : 0,
        qualified: qualifiedCount,
        qualifiedRate: totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) : 0,
        contacted: contactedCount,
        contactedRate: totalLeads > 0 ? Math.round((contactedCount / totalLeads) * 100) : 0,
      },
      pipelineVelocity,
      superHot: {
        count: superHotCount,
        rate: superHotRate,
        targetRate: 100,
      },
      avgDataCompleteness,
      pipelineEfficiency,
    });
  } catch (error) {
    console.error('[pipeline-health] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compute pipeline health' },
      { status: 500 }
    );
  }
}
