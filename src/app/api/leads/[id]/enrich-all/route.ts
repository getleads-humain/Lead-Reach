/**
 * /api/leads/[id]/enrich-all
 *
 * Unified enrichment endpoint powered by the Orchestrator.
 * Runs all 9 AI capabilities in optimal order using the
 * multi-agent workforce pattern from Relevance AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline, processBANT, processWebEnrich, processAIScoring, processNextAction, processConversionPrediction, processDealSize, processBehavioralProfile, processAlerts, processCompanyResearch, type EnrichmentCapability, type EnrichmentStepResult } from '@/lib/enrichment';

export const maxDuration = 180;
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({})) as {
      capabilities?: EnrichmentCapability[];
      capability?: EnrichmentCapability;
    };

    // If a single capability is requested, run just that one
    if (body.capability) {
      const capability = body.capability as EnrichmentCapability;

      let stepResult: EnrichmentStepResult;
      switch (capability) {
        case 'bant': stepResult = await processBANT(leadId); break;
        case 'web_enrich': stepResult = await processWebEnrich(leadId); break;
        case 'ai_score': stepResult = await processAIScoring(leadId); break;
        case 'next_action': stepResult = await processNextAction(leadId); break;
        case 'predict_conversion': stepResult = await processConversionPrediction(leadId); break;
        case 'predict_deal': stepResult = await processDealSize(leadId); break;
        case 'behavioral_profile': stepResult = await processBehavioralProfile(leadId); break;
        case 'generate_alerts': stepResult = await processAlerts(leadId); break;
        case 'research_company': stepResult = await processCompanyResearch(leadId); break;
        default:
          return NextResponse.json({ error: `Unknown capability: ${capability}` }, { status: 400 });
      }

      return NextResponse.json({
        success: stepResult.status === 'completed' || stepResult.status === 'cached',
        step: stepResult,
        leadId,
      });
    }

    // Run full pipeline
    const result = await runFullPipeline(leadId, body.capabilities);

    return NextResponse.json({
      success: result.overallStatus !== 'failed',
      ...result,
    });
  } catch (error) {
    console.error('[enrich-all] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Enrichment pipeline failed' },
      { status: 500 }
    );
  }
}
