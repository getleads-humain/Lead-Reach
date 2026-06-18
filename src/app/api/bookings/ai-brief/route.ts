/**
 * booking.brief — Domain-specific AI route
 *
 * Generate 2-minute prep briefs for any meeting type.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/bookings/ai-brief
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiGenerateMeetingBrief } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiGenerateMeetingBrief(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'booking.brief' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'booking.brief',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[booking.brief] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
