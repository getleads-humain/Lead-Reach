/**
 * Next.js Instrumentation
 *
 * This file runs once when the Next.js server starts.
 *
 * All Node.js-specific code lives in `./instrumentation-node.ts`, which is
 * dynamically imported inside the `NEXT_RUNTIME === 'nodejs'` guard. This is
 * the pattern recommended by Next.js: the guarded dynamic import lets the
 * bundler tree-shake the Node-only module out of the Edge runtime bundle,
 * eliminating "Module not found: Can't resolve 'fs'" build warnings and
 * "Ecmascript file had an error" runtime noise.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerNode } = await import('./instrumentation-node');
    await registerNode();
  }
}
