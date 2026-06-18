/**
 * abm.score — Domain-specific AI route
 *
 * Account-level fit + intent scoring for ABM targeting.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/abm/ai-score
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiScoreAccount } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiScoreAccount(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'abm.score' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'abm.score',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[abm.score] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
