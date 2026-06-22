/**
 * GET /api/admin/agents/evals
 * ===========================
 * Runs the agentic eval suite and returns the report.
 *
 * Query params:
 *   - category: filter by category (intent_classification | sop_selection | output_quality | safety)
 *   - dryRun: "1" to skip real LLM calls (default "1" for safety)
 *   - maxFixtures: limit the number of fixtures (default: unlimited)
 */

import { NextRequest, NextResponse } from 'next/server';
import { runEvalSuite } from '@/lib/agentic-system';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') as 'intent_classification' | 'sop_selection' | 'output_quality' | 'safety' | null;
    const dryRun = searchParams.get('dryRun') !== '0'; // default to dry-run for safety
    const maxFixtures = searchParams.get('maxFixtures')
      ? parseInt(searchParams.get('maxFixtures')!, 10)
      : undefined;

    const report = await runEvalSuite({
      category: category ?? undefined,
      dryRun,
      maxFixtures,
    });

    return NextResponse.json(report);
  } catch (err) {
    console.error('[AdminAPI] evals failed:', err);
    return NextResponse.json(
      { error: 'Eval suite failed', details: String(err) },
      { status: 500 },
    );
  }
}
