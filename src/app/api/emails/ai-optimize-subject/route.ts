/**
 * email.optimize-subject — Domain-specific AI route
 *
 * Optimize subject lines for higher open rates.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/emails/ai-optimize-subject
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiOptimizeSubjectLine } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiOptimizeSubjectLine(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'email.optimize-subject' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'email.optimize-subject',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[email.optimize-subject] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
