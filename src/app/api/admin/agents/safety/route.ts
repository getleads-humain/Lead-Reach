/**
 * GET /api/admin/agents/safety
 * ============================
 * Runs the safety eval suite and returns the report.
 * Also validates the SOP constraints are well-formed.
 */

import { NextResponse } from 'next/server';
import { runSafetyEvals, validateConstraints } from '@/lib/agentic-system';

export async function GET() {
  try {
    const [report, constraintCheck] = await Promise.all([
      runSafetyEvals(),
      Promise.resolve(validateConstraints()),
    ]);

    return NextResponse.json({
      report,
      constraints: constraintCheck,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AdminAPI] safety failed:', err);
    return NextResponse.json(
      { error: 'Safety evals failed', details: String(err) },
      { status: 500 },
    );
  }
}
