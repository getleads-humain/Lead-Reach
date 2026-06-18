/**
 * lead.next-action — Domain-specific AI route
 *
 * Recommend the single highest-leverage next action for a lead.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/leads/ai-next-action
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiRecommendNextAction } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiRecommendNextAction(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'lead.next-action' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'lead.next-action',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[lead.next-action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
