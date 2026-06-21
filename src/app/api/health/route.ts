/**
 * /api/health — Alias of /health for API-style health checks.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const startedAt = Date.now();

export async function GET() {
  return Response.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
  }, { status: 200 });
}
