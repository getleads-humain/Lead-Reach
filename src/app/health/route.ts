import { NextResponse } from 'next/server';

/**
 * GET /health
 *
 * Ultra-lightweight health check endpoint for platform-level probes
 * (Alibaba Cloud Function Compute, Kubernetes, load balancers, etc.).
 *
 * This route MUST stay fast and dependency-free — it does NOT touch the
 * database, the LLM, or any external service. It exists solely to let
 * the hosting platform know the Next.js process is alive and serving
 * HTTP traffic. Heavy checks belong in /api/prospect-discovery/health.
 *
 * Public route: registered in supabase-middleware.ts publicRoutes.
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
