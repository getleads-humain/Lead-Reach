#!/usr/bin/env -S npx tsx
/**
 * Run a smoke check (3 fixtures, dry-run) and write the result to disk.
 * Used by .github/workflows/agentic-evals.yml as a fast sanity check.
 *
 * Exits non-zero if the smoke check fails.
 */

import { smokeCheck } from '../../src/lib/agentic-system';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORT_DIR = join(process.cwd(), 'scripts', 'evals');
const SMOKE_PATH = join(REPORT_DIR, 'latest-smoke.txt');

async function main() {
  console.log('[smoke-check] Running smoke check (3 fixtures, dry-run)...');
  const ok = await smokeCheck();
  const msg = ok
    ? `[smoke-check] PASS — all 3 fixtures passed at ${new Date().toISOString()}`
    : `[smoke-check] FAIL — at least one fixture failed at ${new Date().toISOString()}`;

  console.log(msg);

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(SMOKE_PATH, msg + '\n');

  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error('[smoke-check] Fatal error:', err);
  process.exit(2);
});
