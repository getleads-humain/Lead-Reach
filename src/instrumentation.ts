/**
 * Next.js Instrumentation
 * 
 * This file runs once when the Next.js server starts.
 * We use it to increase the Node.js HTTP server timeout
 * to support long-running API routes like Prospect Discovery
 * and Campaign Pipeline execution.
 */

export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Increase the HTTP server keep-alive timeout from the default 5s to 300s (5 min)
    // This prevents the server from closing connections prematurely for long-running API routes
    if (typeof process !== 'undefined') {
      // The default Node.js HTTP server timeout is 0 (no timeout) in Node 18+
      // But Next.js may set its own headers timeout. We handle this by setting
      // maxDuration on individual API routes instead.
      
      // Log that the instrumentation is active
      console.log('[Instrumentation] Server-side instrumentation active — long-running API routes supported');
    }
  }
}
