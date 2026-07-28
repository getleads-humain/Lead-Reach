/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * We use it to:
 * 1. Set up global error handlers to prevent unhandled errors from crashing the server
 * 2. Auto-start the crawl4ai HTTP service
 *
 * Edge Runtime compatible: all Node.js-specific code is inside the
 * NEXT_RUNTIME === 'nodejs' guard so static analysis doesn't flag it.
 */

export async function register() {
  // Only run on server side (Node.js runtime, not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  // ── Global error handlers ──────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    console.error('[LeadReach] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('[LeadReach] Uncaught Exception:', error.message, error.stack);
    if (error.message?.includes('ENOMEM') || error.message?.includes('heap out of memory')) {
      console.error('[LeadReach] Catastrophic memory error — exiting for restart');
      process.exit(1);
    }
  });

  console.log('[Instrumentation] Server-side instrumentation active — long-running API routes supported');

  // ── Auto-start crawl4ai ────────────────────────────────────
  setTimeout(async () => {
    try {
      const { existsSync } = await import('fs');
      const { spawn } = await import('child_process');
      const script = '/home/z/my-project/lib/crawl4ai-service/start-service.sh';
      const serviceUrl = process.env.CRAWL4AI_SERVICE_URL || 'http://127.0.0.1:8765';

      if (!existsSync(script)) {
        console.warn('[Instrumentation] crawl4ai startup script not found — skipping');
        return;
      }

      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 2000);
        try {
          const r = await fetch(`${serviceUrl}/health`, { signal: ctrl.signal });
          if (r.ok) {
            console.log('[Instrumentation] crawl4ai service already running');
            return;
          }
        } finally {
          clearTimeout(t);
        }
      } catch {
        // not running — proceed to start
      }

      console.log('[Instrumentation] Starting crawl4ai HTTP service on 127.0.0.1:8765...');
      const child = spawn('bash', [script, '--bg'], { detached: true, stdio: 'ignore' });
      child.unref();
      console.log('[Instrumentation] crawl4ai service start requested (detached, non-blocking)');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Instrumentation] crawl4ai service failed to start (non-fatal): ${msg.slice(0, 200)}`);
    }
  }, 2000);
}
