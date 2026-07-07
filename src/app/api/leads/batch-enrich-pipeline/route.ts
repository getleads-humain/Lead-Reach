/**
 * /api/leads/batch-enrich-pipeline
 *
 * Batch enrichment endpoint inspired by Relevance AI's ai-transform.
 * Enriches multiple leads through the orchestrator pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import { batchEnrichLeads } from '@/lib/enrichment/vector-search';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      leadIds?: string[];
      campaignId?: string;
      capabilities?: string[];
    };

    if (!body.leadIds || body.leadIds.length === 0) {
      return NextResponse.json({ error: 'leadIds array is required' }, { status: 400 });
    }

    if (body.leadIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 leads per batch' }, { status: 400 });
    }

    const result = await batchEnrichLeads(
      body.leadIds,
      body.capabilities,
    );

    return NextResponse.json({
      success: true,
      completed: result.completed,
      failed: result.failed,
      total: body.leadIds.length,
      results: result.results,
    });
  } catch (error) {
    console.error('[batch-enrich-pipeline] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch enrichment failed' },
      { status: 500 }
    );
  }
}
