/**
 * lead.score — Domain-specific AI route
 *
 * Score a lead 0-100 with tier, reasoning, signals, and next best action.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/leads/ai-score
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiScoreLead } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiScoreLead(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'lead.score' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'lead.score',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[lead.score] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
