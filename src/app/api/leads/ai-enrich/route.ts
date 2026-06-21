/**
 * lead.enrich — Domain-specific AI route
 *
 * Infer BANT attributes (Budget, Authority, Need, Timeline) from context.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/leads/ai-enrich
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiEnrichLead } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiEnrichLead(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'lead.enrich' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'lead.enrich',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[lead.enrich] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
