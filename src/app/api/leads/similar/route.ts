/**
 * /api/leads/similar
 *
 * Find similar leads using vector embeddings.
 * Inspired by Relevance AI's vectorhub.
 */

import { NextRequest, NextResponse } from 'next/server';
import { findSimilarLeads, buildICPFromTopLeads } from '@/lib/enrichment/vector-search';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const action = searchParams.get('action');

    if (action === 'icp') {
      const campaignId = searchParams.get('campaignId') || undefined;
      const icp = await buildICPFromTopLeads(campaignId);
      return NextResponse.json({ icp });
    }

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const similarLeads = await findSimilarLeads(leadId, limit);
    return NextResponse.json({ similarLeads });
  } catch (error) {
    console.error('[similar] Error:', error);
    return NextResponse.json(
      { error: 'Failed to find similar leads' },
      { status: 500 }
    );
  }
}
