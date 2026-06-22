/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * We use it to:
 * 1. Increase the Node.js HTTP server timeout for long-running API routes
 * 2. Set up global error handlers to prevent unhandled errors from crashing the server
 * 3. Auto-start the crawl4ai HTTP service (unclecode/crawl4ai 0.9.0) so the
 *    platform has access to deep web crawling + LLM-ready extraction from boot.
 *    The service is vendored at lib/crawl4ai-source/ and exposed via
 *    lib/crawl4ai-service/server.py on http://127.0.0.1:8765.
 *    If it fails to start (e.g., missing Python deps), the platform still
 *    works — crawl4ai calls will fail gracefully and fall back to webRead.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const CRAWL4AI_STARTUP_SCRIPT = '/home/z/my-project/lib/crawl4ai-service/start-service.sh';
const CRAWL4AI_SERVICE_URL = process.env.CRAWL4AI_SERVICE_URL || 'http://127.0.0.1:8765';

async function startCrawl4AIService() {
  try {
    if (!existsSync(CRAWL4AI_STARTUP_SCRIPT)) {
      console.warn('[Instrumentation] crawl4ai startup script not found — skipping');
      return;
    }
    // Health-check first — don't double-start
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      try {
        const r = await fetch(`${CRAWL4AI_SERVICE_URL}/health`, { signal: ctrl.signal });
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
    await execAsync(`bash ${CRAWL4AI_STARTUP_SCRIPT} --bg`, { timeout: 15000 });
    console.log('[Instrumentation] crawl4ai service start requested (check lib/crawl4ai-service/server.log)');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn(`[Instrumentation] crawl4ai service failed to start (non-fatal): ${msg.slice(0, 200)}`);
  }
}

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Global error handlers — prevent unhandled errors from crashing the server
    process.on('unhandledRejection', (reason) => {
      console.error('[LeadReach] Unhandled Promise Rejection:', reason);
      // Do NOT exit the process — log and continue
    });

    process.on('uncaughtException', (error) => {
      console.error('[LeadReach] Uncaught Exception:', error.message, error.stack);
      // Do NOT exit the process — log and continue
      // Only exit for truly catastrophic errors (like OOM)
      if (error.message?.includes('ENOMEM') || error.message?.includes('heap out of memory')) {
        console.error('[LeadReach] Catastrophic memory error — exiting for restart');
        process.exit(1);
      }
    });

    // Log that the instrumentation is active
    console.log('[Instrumentation] Server-side instrumentation active — long-running API routes supported');

    // Auto-start crawl4ai service (fire-and-forget; non-fatal if it fails)
    // Small delay so the Next.js server boots first
    setTimeout(() => {
      startCrawl4AIService().catch((err) => {
        console.warn(`[Instrumentation] crawl4ai start threw: ${err instanceof Error ? err.message : err}`);
      });
    }, 2000);
  }
}
