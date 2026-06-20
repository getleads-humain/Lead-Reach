/**
 * analytics.forecast — Domain-specific AI route
 *
 * Generate calibrated revenue forecasts with assumptions.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/analytics/ai-forecast
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiForecastRevenue } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiForecastRevenue(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'analytics.forecast' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'analytics.forecast',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[analytics.forecast] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
