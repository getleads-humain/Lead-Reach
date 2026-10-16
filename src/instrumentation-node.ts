/**
 * LeadReach — Node.js-only instrumentation
 * ==========================================
 * Imported exclusively from `src/instrumentation.ts` inside the
 * `process.env.NEXT_RUNTIME === 'nodejs'` guard. Because the import is
 * guarded, Next.js/webpack tree-shakes this module out of the Edge
 * runtime bundle — so Node built-ins and globals are safe here.
 */

export async function registerNode(): Promise<void> {
  // ── Global error handlers ──────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    console.error('[LeadReach] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('[LeadReach] Uncaught Exception:', error.message, error.stack);
    if (error.message?.includes('ENOMEM') || error.message?.includes('heap out of memory')) {
      console.error('[LeadReach] Catastrophic memory error — exiting for restart');
      process.exit(1);
    }
  });

  console.log('[Instrumentation] Server-side instrumentation active — long-running API routes supported');

  // ── Start 24/7 Workforce Activity Generator ──────────────────
  // Generates real inter-agent chat messages and work log entries
  // every 2-5 minutes, 24/7/365, so the AI Workforce is always alive.
  setTimeout(async () => {
    try {
      const { startWorkforceActivity247 } = await import('@/lib/workforce/activity-247');
      startWorkforceActivity247();
    } catch (error) {
      console.warn('[Instrumentation] Failed to start 24/7 workforce activity generator (non-fatal):', error);
    }
  }, 10000); // Wait 10s for DB to be ready

  // ── Auto-start crawl4ai ────────────────────────────────────
  setTimeout(async () => {
    try {
      // eval-indirect require keeps node built-ins invisible to the
      // bundler (no "Module not found" warnings, no Edge runtime errors).
      const nodeRequire = eval('require') as NodeRequire;
      const { existsSync } = nodeRequire('fs');
      const { spawn } = nodeRequire('child_process');
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
