/**
 * setter.coach — Domain-specific AI route
 *
 * AI analysis of call transcripts: strengths, improvements, objection handling.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/setters/ai-coach
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiCoachSetter } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiCoachSetter(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'setter.coach' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'setter.coach',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[setter.coach] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
