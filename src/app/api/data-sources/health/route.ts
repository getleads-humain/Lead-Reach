// ============================================================
// /api/data-sources/health — Unified Health Check
// ============================================================
// Returns the status of all 7 data source channels in parallel.
// Useful for ops dashboards and for the UI to show which sources
// are currently available.
// ============================================================

import { NextResponse } from 'next/server';
import { checkAllDataSources } from '@/lib/prospect-agent/data-sources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const summary = await checkAllDataSources();
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Health check failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
