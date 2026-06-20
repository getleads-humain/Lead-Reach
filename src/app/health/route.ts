/**
 * /health — Ultra-light health check endpoint.
 * Returns 200 OK without touching the database or auth.
 * Used by the platform / load balancer to verify the server is alive.
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
