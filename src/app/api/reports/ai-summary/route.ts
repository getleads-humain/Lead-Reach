/**
 * report.summary — Domain-specific AI route
 *
 * Turn raw report data into executive-ready narrative + insights.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/reports/ai-summary
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiGenerateReportSummary } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiGenerateReportSummary(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'report.summary' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'report.summary',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[report.summary] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
