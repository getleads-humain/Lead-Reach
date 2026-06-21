// ============================================================
// Knowledge Analytics API Endpoint
// ============================================================
// GET /api/knowledge/analytics
//   Returns the raw analytics summary (top queries, low-relevance
//   queries, zero-result queries, top-retrieved docs, missing
//   industries/regions).
//
// Query params:
//   ?monthsBack=6   — number of months to include (default 6, max 24)
//
// Used by the /knowledge admin UI to render the analytics dashboard.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, isAnalyticsActive, getAnalyticsDir } from '@/lib/knowledge/analytics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const monthsBack = Math.min(parseInt(searchParams.get('monthsBack') || '6', 10), 24);

    if (!isAnalyticsActive()) {
      return NextResponse.json({
        ok: true,
        active: false,
        message: 'Analytics tracking is not active yet. Retrieval calls will start being tracked once the knowledge base is queried.',
        analyticsDir: getAnalyticsDir(),
        summary: null,
      });
    }

    const summary = getAnalyticsSummary({ monthsBack });
    return NextResponse.json({
      ok: true,
      active: true,
      monthsBack,
      analyticsDir: getAnalyticsDir(),
      summary,
    });
  } catch (err) {
    console.error('[api/knowledge/analytics] error:', err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
