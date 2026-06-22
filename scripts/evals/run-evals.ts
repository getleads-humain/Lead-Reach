#!/usr/bin/env bun
/**
 * Run the agentic eval suite (dry-run mode) and write the report to disk.
 * Used by .github/workflows/agentic-evals.yml.
 *
 * Exits non-zero if any fixture fails.
 */

import { runEvalSuite } from '../../src/lib/agentic-system';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORT_DIR = join(process.cwd(), 'scripts', 'evals');
const REPORT_PATH = join(REPORT_DIR, 'latest-report.json');

async function main() {
  console.log('[run-evals] Starting agentic eval suite (dry-run mode)...');
  const startTime = Date.now();

  const report = await runEvalSuite({ dryRun: true });

  console.log('\n[run-evals] === Eval Suite Report ===');
  console.log(`Total: ${report.totalFixtures}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Pass rate: ${(report.passRate * 100).toFixed(1)}%`);
  console.log(`Duration: ${report.totalDurationMs}ms`);
  console.log('\n[run-evals] By category:');
  for (const [cat, data] of Object.entries(report.byCategory)) {
    console.log(`  ${cat}: ${data.passed}/${data.total} (${(data.passRate * 100).toFixed(0)}%)`);
  }

  // Persist report
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n[run-evals] Report written to ${REPORT_PATH}`);

  if (report.failed > 0) {
    console.error(`\n[run-evals] FAILED: ${report.failed} fixture(s) failed`);
    for (const r of report.results.filter(r => !r.passed)) {
      console.error(`  - ${r.fixtureId}: ${r.reasons.join('; ')}`);
    }
    process.exit(1);
  }

  console.log('\n[run-evals] All fixtures passed!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[run-evals] Fatal error:', err);
  process.exit(2);
});
