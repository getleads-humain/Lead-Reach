/**
 * icp.refine — Domain-specific AI route
 *
 * Use customer data to refine your ideal customer profile.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/icp/ai-refine
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiRefineICP } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiRefineICP(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'icp.refine' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'icp.refine',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[icp.refine] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
