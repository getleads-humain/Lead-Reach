// ============================================================
// Knowledge Gap Report API Endpoint
// ============================================================
// GET /api/knowledge/gap-report
//   Returns the latest cached gap report (or generates one if none
//   exists or if the latest is older than 24 hours).
//
// GET /api/knowledge/gap-report?action=latest
//   Returns the latest cached report without regeneration.
//
// GET /api/knowledge/gap-report?action=list
//   Lists all available gap reports.
//
// POST /api/knowledge/gap-report
//   Forces regeneration of the gap report.
//
// Body: { "month"?: "YYYY-MM" }  (optional — defaults to current month)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateGapReport, getLatestGapReport, listGapReports } from '@/lib/knowledge/gap-report';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ============================================================
// GET handler
// ============================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'latest-or-generate';

  try {
    if (action === 'list') {
      const reports = listGapReports();
      return NextResponse.json({
        ok: true,
        count: reports.length,
        reports: reports.map((r) => ({
          month: r.month,
          path: r.path,
          sizeBytes: r.sizeBytes,
        })),
      });
    }

    if (action === 'latest') {
      const latest = getLatestGapReport();
      if (!latest) {
        return NextResponse.json({
          ok: false,
          error: 'No gap report exists yet. POST to generate one.',
        }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        month: latest.month,
        generatedAt: latest.generatedAt,
        markdown: latest.markdown,
        path: latest.path,
      });
    }

    // Default: latest-or-generate
    // Return the latest report if it exists AND was generated within 24h.
    // Otherwise, generate a fresh one.
    const latest = getLatestGapReport();
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const latestIsFresh = latest && new Date(latest.generatedAt).getTime() > oneDayAgo;

    if (latestIsFresh) {
      return NextResponse.json({
        ok: true,
        month: latest!.month,
        generatedAt: latest!.generatedAt,
        markdown: latest!.markdown,
        path: latest!.path,
        cached: true,
      });
    }

    // Generate fresh
    const report = generateGapReport();
    return NextResponse.json({
      ok: true,
      month: report.month,
      generatedAt: report.generatedAt,
      markdown: report.markdown,
      path: report.savedTo,
      cached: false,
      findings: report.findings,
    });
  } catch (err) {
    console.error('[api/knowledge/gap-report] GET error:', err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

// ============================================================
// POST handler — force regeneration
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const report = generateGapReport({ month: body.month });
    return NextResponse.json({
      ok: true,
      month: report.month,
      generatedAt: report.generatedAt,
      markdown: report.markdown,
      path: report.savedTo,
      findings: report.findings,
    });
  } catch (err) {
    console.error('[api/knowledge/gap-report] POST error:', err);
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}
