/**
 * pipeline.analyze — Domain-specific AI route
 *
 * Deal health scoring + win probability + coaching tips.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/pipeline/ai-analyze
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAnalyzeDeal } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiAnalyzeDeal(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'pipeline.analyze' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'pipeline.analyze',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[pipeline.analyze] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
