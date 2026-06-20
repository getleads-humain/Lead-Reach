/**
 * messaging.summarize — Domain-specific AI route
 *
 * Auto-summarize long conversations into key points + action items.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/messaging/ai-summarize
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiSummarizeConversation } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiSummarizeConversation(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'messaging.summarize' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'messaging.summarize',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[messaging.summarize] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
