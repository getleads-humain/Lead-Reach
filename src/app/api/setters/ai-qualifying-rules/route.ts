/**
 * setter.qualifying-rules — Domain-specific AI route
 *
 * Design BANT qualification frameworks for any product.
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST //api/setters/ai-qualifying-rules
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: { action: string, result: <action-specific type>, modelUsed: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { aiGenerateQualifyingRules } from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await aiGenerateQualifyingRules(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: 'setter.qualifying-rules' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: 'setter.qualifying-rules',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[setter.qualifying-rules] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
