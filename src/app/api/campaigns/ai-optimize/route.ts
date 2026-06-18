/**
 * campaign.optimize — Domain-specific AI route
 *
 * Diagnose performance issues and recommend concrete fixes.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/campaigns/ai-optimize
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiOptimizeCampaign } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiOptimizeCampaign(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'campaign.optimize' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'campaign.optimize',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[campaign.optimize] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
