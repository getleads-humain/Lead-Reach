#!/usr/bin/env bun
/**
 * Run the safety eval suite and write the report to disk.
 * Used by .github/workflows/agentic-safety.yml.
 *
 * Exits non-zero if any safety test fails OR if the SOP constraints
 * are not well-formed.
 */

import { runSafetyEvals, validateConstraints } from '../../src/lib/agentic-system';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const REPORT_DIR = join(process.cwd(), 'scripts', 'evals');
const REPORT_PATH = join(REPORT_DIR, 'latest-safety-report.json');

async function main() {
  console.log('[run-safety] Starting safety eval suite...');
  const [report, constraints] = await Promise.all([
    runSafetyEvals(),
    Promise.resolve(validateConstraints()),
  ]);

  console.log('\n[run-safety] === Safety Eval Report ===');
  console.log(`Total tests: ${report.totalTests}`);
  console.log(`Passed: ${report.passed}`);
  console.log(`Failed: ${report.failed}`);
  console.log(`Pass rate: ${(report.passRate * 100).toFixed(1)}%`);
  console.log(`Duration: ${report.durationMs}ms`);

  console.log('\n[run-safety] By category:');
  const byCat: Record<string, { total: number; passed: number }> = {};
  for (const r of report.results) {
    if (!byCat[r.category]) byCat[r.category] = { total: 0, passed: 0 };
    byCat[r.category].total++;
    if (r.passed) byCat[r.category].passed++;
  }
  for (const [cat, data] of Object.entries(byCat)) {
    console.log(`  ${cat}: ${data.passed}/${data.total}`);
  }

  console.log('\n[run-safety] Constraint validation:');
  if (constraints.passed) {
    console.log('  PASS — all constraints well-formed');
  } else {
    console.log('  FAIL — issues:');
    for (const issue of constraints.issues) {
      console.log(`    - ${issue}`);
    }
  }

  // Persist report
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(
    REPORT_PATH,
    JSON.stringify({ report, constraints, runAt: new Date().toISOString() }, null, 2),
  );
  console.log(`\n[run-safety] Report written to ${REPORT_PATH}`);

  if (report.failed > 0) {
    console.error(`\n[run-safety] FAILED: ${report.failed} test(s) failed`);
    for (const r of report.results.filter(r => !r.passed)) {
      console.error(`  - ${r.testCaseId} (${r.category}): ${r.reason}`);
    }
  }

  if (!constraints.passed) {
    console.error('\n[run-safety] FAILED: SOP constraints are not well-formed');
  }

  if (report.failed > 0 || !constraints.passed) {
    process.exit(1);
  }

  console.log('\n[run-safety] All safety tests passed and constraints are valid!');
  process.exit(0);
}

main().catch((err) => {
  console.error('[run-safety] Fatal error:', err);
  process.exit(2);
});
