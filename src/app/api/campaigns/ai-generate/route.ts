/**
 * campaign.generate — Domain-specific AI route
 *
 * Design full multi-touch campaigns with sequence, messaging, and KPIs.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/campaigns/ai-generate
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiGenerateCampaign } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiGenerateCampaign(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'campaign.generate' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'campaign.generate',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[campaign.generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
