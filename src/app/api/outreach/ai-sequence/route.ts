/**
 * outreach.sequence — Domain-specific AI route
 *
 * Multi-touch outreach cadences personalized per lead.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/outreach/ai-sequence
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiGenerateOutreachSequence } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiGenerateOutreachSequence(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'outreach.sequence' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'outreach.sequence',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[outreach.sequence] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
