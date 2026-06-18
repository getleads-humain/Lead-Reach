/**
 * messaging.suggest-reply — Domain-specific AI route
 *
 * Real-time reply suggestions for live conversations.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/messaging/ai-suggest-reply
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiSuggestReply } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiSuggestReply(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'messaging.suggest-reply' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'messaging.suggest-reply',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[messaging.suggest-reply] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
