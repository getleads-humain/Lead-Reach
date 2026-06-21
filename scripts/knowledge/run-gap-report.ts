#!/usr/bin/env tsx
// ============================================================
// Echo Knowledge Gap Report — CLI Runner
// ============================================================
// Generates the monthly Knowledge Base Gap Report.
//
// Usage:
//   npx tsx scripts/knowledge/run-gap-report.ts            # current month
//   npx tsx scripts/knowledge/run-gap-report.ts 2026-05    # specific month
//   npx tsx scripts/knowledge/run-gap-report.ts --print    # print to stdout
//
// The report is saved to knowledge/_reports/gap-report-YYYY-MM.md
// ============================================================

import { generateGapReport } from '../../src/lib/knowledge/gap-report';
import { getAnalyticsSummary } from '../../src/lib/knowledge/analytics';
import { listAllKnowledge, getKnowledgeStats } from '../../src/lib/knowledge/loader';

function divider(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('  ' + title);
  console.log('═'.repeat(70));
}

// Parse args
const args = process.argv.slice(2);
let month: string | undefined;
let printOnly = false;

for (const arg of args) {
  if (arg === '--print' || arg === '-p') {
    printOnly = true;
  } else if (/^\d{4}-\d{2}$/.test(arg)) {
    month = arg;
  }
}

divider('Echo Knowledge Gap Report Generator');

// Step 1: Print current state
const stats = getKnowledgeStats();
const docs = listAllKnowledge();
console.log(`Knowledge base: ${stats.totalDocuments} docs, ${(stats.totalWords / 1000).toFixed(1)}K words, ${(stats.totalTokens / 1000).toFixed(1)}K tokens`);
console.log(`By category: ${Object.entries(stats.byCategory).map(([k, v]) => `${k}=${v}`).join(', ')}`);

// Step 2: Print analytics summary
divider('Analytics Summary (last 6 months)');
const analytics = getAnalyticsSummary({ monthsBack: 6 });
console.log(`Total retrievals: ${analytics.totalRetrievals}`);
console.log(`Distinct queries: ${analytics.distinctQueries}`);
console.log(`Zero-result retrievals: ${analytics.zeroResultCount}`);
console.log(`Low-relevance retrievals (topScore<30%): ${analytics.lowRelevanceCount}`);
console.log(`Months covered: ${analytics.monthsCovered.join(', ') || 'none'}`);

if (analytics.topLowRelevanceQueries.length > 0) {
  console.log('\nTop 5 low-relevance queries:');
  for (const q of analytics.topLowRelevanceQueries.slice(0, 5)) {
    console.log(`  [${q.count}x, score=${(q.meanTopScore * 100).toFixed(0)}%] ${q.query}`);
  }
}

if (analytics.topZeroResultQueries.length > 0) {
  console.log('\nTop 5 zero-result queries:');
  for (const q of analytics.topZeroResultQueries.slice(0, 5)) {
    console.log(`  [${q.count}x] ${q.query}`);
  }
}

if (analytics.topRetrievedDocs.length > 0) {
  console.log('\nTop 5 most-retrieved docs:');
  for (const d of analytics.topRetrievedDocs.slice(0, 5)) {
    console.log(`  [${d.count}x] ${d.slug}`);
  }
}

// Step 3: Generate the report
divider(`Generating Gap Report${month ? ` for ${month}` : ''}`);
const report = generateGapReport({ month });

console.log(`\nReport generated: ${report.savedTo}`);
console.log(`Findings:`);
console.log(`  - Outdated docs (>6mo): ${report.findings.outdatedDocs.length}`);
console.log(`  - Missing industries: ${report.findings.missingIndustries.length}`);
console.log(`  - Missing regions: ${report.findings.missingRegions.length}`);
console.log(`  - Top low-relevance queries: ${report.findings.topLowRelevanceQueries.length}`);
console.log(`  - Top zero-result queries: ${report.findings.topZeroResultQueries.length}`);

console.log('\nRecommendations:');
for (const rec of report.findings.recommendations) {
  console.log(`  • ${rec}`);
}

if (printOnly) {
  divider('FULL REPORT');
  console.log(report.markdown);
}

console.log('\n✓ Done.');
process.exit(0);
