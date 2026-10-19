import { NextRequest, NextResponse } from 'next/server';
import { runOpsCycle, getOpsStatus, getJobRegistry, startOpsLoop } from '@/lib/workforce/ops';

export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * GET /api/workforce/ops — Live ops status:
 * recent real work logs, open/resolved incidents, job registry,
 * goals progress, jobs completed in the last 24h.
 */
export async function GET() {
  try {
    const status = await getOpsStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('[Workforce Ops API] GET error:', error);
    return NextResponse.json({ error: 'Failed to load ops status' }, { status: 500 });
  }
}

/**
 * POST /api/workforce/ops
 * Body: { action: 'tick' } — run ONE real ops cycle now
 *   (user goals first, then the next round-robin job).
 * Body: { action: 'ensure_loop' } — make sure the 24/7 scheduler is running.
 * GET-like: { action: 'status' } — same as GET.
 *
 * External 24/7 heartbeats (uptime monitors, cron services) can safely
 * call POST { action: 'tick' } — the engine is concurrency-guarded.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action ?? 'tick';

    if (action === 'status') {
      const status = await getOpsStatus();
      return NextResponse.json(status);
    }

    if (action === 'ensure_loop') {
      startOpsLoop(4 * 60 * 1000);
      return NextResponse.json({ ensured: true, jobs: getJobRegistry() });
    }

    if (action === 'tick') {
      const result = await runOpsCycle();
      return NextResponse.json(result, { status: result.ran ? 200 : 202 });
    }

    return NextResponse.json(
      { error: 'Unknown action. Use: tick | status | ensure_loop' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Workforce Ops API] POST error:', error);
    const message = error instanceof Error ? error.message : 'Ops cycle failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
