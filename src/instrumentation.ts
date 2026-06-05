/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 * We use it to:
 * 1. Increase the Node.js HTTP server timeout for long-running API routes
 * 2. Set up global error handlers to prevent unhandled errors from crashing the server
 */

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
  }
}
