// ============================================================
// Batch Smart Auto-Fill — Fill ALL empty fields for ALL leads
// ============================================================
// Endpoint: POST /api/leads/batch-smart-autofill
//
// Body:
//   campaignId?: string  — fill all leads in a campaign
//   leadIds?: string[]   — fill specific leads (max 50)
//   upgradeTier?: boolean — auto-upgrade tiers (default true)
//
// Processes leads sequentially with a 1-second cooldown between
// each lead to avoid rate-limiting.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const maxDuration = 300;

interface BatchRequest {
  campaignId?: string;
  leadIds?: string[];
  upgradeTier?: boolean;
}

interface BatchResult {
  leadId: string;
  companyName: string;
  success: boolean;
  fieldsFilled: number;
  oldTier: string;
  newTier: string;
  oldScore: number;
  newScore: number;
  dataCompleteness: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  const body: BatchRequest = await request.json().catch(() => ({}));
  const { campaignId, leadIds, upgradeTier = true } = body;

  if (!campaignId && !leadIds) {
    return NextResponse.json(
      { error: 'Provide campaignId or leadIds' },
      { status: 400 },
    );
  }

  // ── Load leads to process ──
  let leads: Array<{ id: string; companyName: string; leadTier: string; leadScore: number; dataCompleteness: number }>;
  if (leadIds && Array.isArray(leadIds)) {
    leads = await db.lead.findMany({
      where: { id: { in: leadIds.slice(0, 50) } },
      select: { id: true, companyName: true, leadTier: true, leadScore: true, dataCompleteness: true },
    });
  } else if (campaignId) {
    // Prioritize leads with the lowest completeness (most empty fields)
    leads = await db.lead.findMany({
      where: { campaignId },
      orderBy: [{ dataCompleteness: 'asc' }, { leadScore: 'asc' }],
      take: 50,
      select: { id: true, companyName: true, leadTier: true, leadScore: true, dataCompleteness: true },
    });
  } else {
    leads = [];
  }

  if (leads.length === 0) {
    return NextResponse.json({
      success: true,
      results: [],
      totalProcessed: 0,
      totalFieldsFilled: 0,
      message: 'No leads to process',
    });
  }

  const results: BatchResult[] = [];
  let totalFieldsFilled = 0;

  // ── Process each lead sequentially ──
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    console.log(`[batch-smart-autofill] Processing ${i + 1}/${leads.length}: ${lead.companyName} (completeness: ${lead.dataCompleteness}%)`);

    try {
      // Call the smart-autofill endpoint internally
      const autofillResponse = await fetch(
        `http://localhost:${process.env.PORT || 3000}/api/leads/${lead.id}/smart-autofill`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'all', upgradeTier }),
        },
      );

      if (autofillResponse.ok) {
        const data = await autofillResponse.json();
        results.push({
          leadId: lead.id,
          companyName: lead.companyName,
          success: true,
          fieldsFilled: data.totalFieldsFilled || 0,
          oldTier: lead.leadTier,
          newTier: data.newTier || lead.leadTier,
          oldScore: lead.leadScore,
          newScore: data.newScore || lead.leadScore,
          dataCompleteness: data.dataCompleteness || lead.dataCompleteness,
        });
        totalFieldsFilled += data.totalFieldsFilled || 0;
      } else {
        const errData = await autofillResponse.json().catch(() => ({}));
        results.push({
          leadId: lead.id,
          companyName: lead.companyName,
          success: false,
          fieldsFilled: 0,
          oldTier: lead.leadTier,
          newTier: lead.leadTier,
          oldScore: lead.leadScore,
          newScore: lead.leadScore,
          dataCompleteness: lead.dataCompleteness,
          error: errData.error || `HTTP ${autofillResponse.status}`,
        });
      }
    } catch (err) {
      results.push({
        leadId: lead.id,
        companyName: lead.companyName,
        success: false,
        fieldsFilled: 0,
        oldTier: lead.leadTier,
        newTier: lead.leadTier,
        oldScore: lead.leadScore,
        newScore: lead.leadScore,
        dataCompleteness: lead.dataCompleteness,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }

    // 1-second cooldown between leads to avoid rate limits
    if (i < leads.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  const successCount = results.filter(r => r.success).length;
  const tierUpgrades = results.filter(r => r.success && r.newTier !== r.oldTier);
  const tierUpgradeCount = tierUpgrades.length;

  return NextResponse.json({
    success: true,
    results,
    totalProcessed: results.length,
    successCount,
    failedCount: results.length - successCount,
    totalFieldsFilled,
    tierUpgrades: tierUpgradeCount,
    tierUpgradeDetails: tierUpgrades.map(r => ({
      leadId: r.leadId,
      companyName: r.companyName,
      oldTier: r.oldTier,
      newTier: r.newTier,
      scoreDelta: r.newScore - r.oldScore,
    })),
    message: `Processed ${successCount}/${results.length} leads successfully. Filled ${totalFieldsFilled} fields. ${tierUpgradeCount} leads upgraded to a higher tier.`,
  });
}
