#!/usr/bin/env npx tsx
/**
 * run-gap-report.ts
 * =================
 * CLI entry point for generating the monthly Echo knowledge gap report.
 *
 * Usage:
 *   npx tsx scripts/run-gap-report.ts
 *
 * Output:
 *   - Writes Markdown report to knowledge/gap-reports/YYYY-MM-gap-report.md
 *   - Prints summary to stdout
 */

import { generateGapReport } from '../src/lib/knowledge/gap-report';

console.log('[Echo] Generating monthly knowledge gap report...\n');

try {
  const result = generateGapReport();

  console.log('============================================================');
  console.log(`  ECHO MONTHLY KNOWLEDGE GAP REPORT — ${result.reportMonth}`);
  console.log('============================================================\n');

  console.log(`Generated at: ${result.generatedAt}`);
  console.log(`Report path:  ${result.reportPath}\n`);

  console.log('— Stats —');
  console.log(`  Total docs:    ${result.stats.totalDocs}`);
  console.log(`  Total chunks:  ${result.stats.totalChunks}`);
  console.log(`  Categories:    ${Object.entries(result.stats.byCategory).map(([k, v]) => `${k}=${v}`).join(', ')}`);
  console.log(`  Grades:        ${Object.entries(result.stats.byGrade).map(([k, v]) => `${k}=${v}`).join(', ') || '(none)'}\n`);

  console.log('— Coverage Gaps —');
  console.log(`  Industries missing (${result.coverageGaps.industriesMissing.length}): ${result.coverageGaps.industriesMissing.join(', ') || '(none)'}`);
  console.log(`  Regions missing    (${result.coverageGaps.regionsMissing.length}): ${result.coverageGaps.regionsMissing.join(', ') || '(none)'}`);
  console.log(`  Playbooks missing  (${result.coverageGaps.playbooksMissing.length}): ${result.coverageGaps.playbooksMissing.join(', ') || '(none)'}\n`);

  console.log('— Quality Gaps —');
  if (result.qualityGaps.length === 0) {
    console.log('  (none — all docs are grade B or higher)');
  } else {
    for (const g of result.qualityGaps) {
      console.log(`  [${g.grade}] ${g.path} — ${g.issue}`);
    }
  }
  console.log('');

  console.log('— Usage Gaps —');
  if (result.usageGaps.length === 0) {
    console.log('  (none — all docs have incoming links)');
  } else {
    for (const g of result.usageGaps) {
      console.log(`  ${g.path} — ${g.recommendation}`);
    }
  }
  console.log('');

  console.log('— Freshness Gaps —');
  if (result.freshnessGaps.length === 0) {
    console.log('  (none — all docs reviewed within 180 days)');
  } else {
    for (const g of result.freshnessGaps) {
      console.log(`  ${g.path} (last reviewed: ${g.lastReviewed}) — ${g.recommendation}`);
    }
  }
  console.log('');

  console.log('— Recommendations —');
  console.log('  New docs to author:');
  if (result.recommendations.newDocsToAuthor.length === 0) {
    console.log('    (none)');
  } else {
    for (const r of result.recommendations.newDocsToAuthor) {
      console.log(`    - ${r}`);
    }
  }
  console.log('  Existing docs to refresh:');
  if (result.recommendations.existingDocsToRefresh.length === 0) {
    console.log('    (none)');
  } else {
    for (const r of result.recommendations.existingDocsToRefresh) {
      console.log(`    - ${r}`);
    }
  }
  console.log('');

  console.log('============================================================');
  console.log(`  ✓ Report written to: ${result.reportPath}`);
  console.log('============================================================\n');

  process.exit(0);
} catch (err) {
  console.error('[Echo] FAILED to generate gap report:', err);
  process.exit(1);
}
