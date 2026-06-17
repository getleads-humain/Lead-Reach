import { NextResponse } from 'next/server';

/**
 * GET /api/health
 *
 * Alias for /health — the standard API-path health check convention.
 * Same ultra-lightweight behavior: no DB, no LLM, no external calls.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? Math.round(process.uptime()) : null,
    },
    { status: 200 }
  );
}
