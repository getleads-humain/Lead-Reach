/**
 * GET /api/admin/agents/runs
 * ==========================
 * Returns recent agentic pipeline runs from the telemetry ring buffer.
 *
 * Query params:
 *   - limit: number of runs to return (default 50, max 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentRuns, getRunStats } from '@/lib/agentic-system';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit') ?? '50';
    const limit = Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 100);

    const runs = getRecentRuns(limit);
    const stats = getRunStats();

    return NextResponse.json({
      runs,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AdminAPI] runs failed:', err);
    return NextResponse.json(
      { error: 'Failed to load runs', details: String(err) },
      { status: 500 },
    );
  }
}
