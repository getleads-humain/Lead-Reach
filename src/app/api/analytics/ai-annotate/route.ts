/**
 * analytics.annotate — Domain-specific AI route
 *
 * Translate raw metrics into business-readable insights + anomalies.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/analytics/ai-annotate
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiAnnotateAnalytics } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiAnnotateAnalytics(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'analytics.annotate' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'analytics.annotate',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[analytics.annotate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
