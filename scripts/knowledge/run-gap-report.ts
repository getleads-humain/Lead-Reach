#!/usr/bin/env tsx
// ============================================================
// Echo Knowledge Gap Report — CLI Runner
// ============================================================
// Generates the monthly Knowledge Base Gap Report.
//
// Usage:
//   npx tsx scripts/knowledge/run-gap-report.ts            # current month
//   npx tsx scripts/knowledge/run-gap-report.ts --print    # print to stdout
//
// The report is saved to knowledge/gap-reports/YYYY-MM-gap-report.md
// ============================================================

import { generateGapReport } from '../../src/lib/knowledge/gap-report';

function divider(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log('  ' + title);
  console.log('═'.repeat(70));
}

// Parse args
const args = process.argv.slice(2);
let printOnly = false;

for (const arg of args) {
  if (arg === '--print' || arg === '-p') {
    printOnly = true;
  }
}

divider('Echo Knowledge Gap Report Generator');

// Generate the report
divider('Generating Gap Report');
const report = generateGapReport();

console.log(`\nReport generated: ${report.reportPath}`);
console.log(`Report month: ${report.reportMonth}`);
console.log(`Total docs: ${report.stats.totalDocs}`);
console.log(`Total chunks: ${report.stats.totalChunks}`);
console.log(`\nCoverage Gaps:`);
console.log(`  - Missing industries: ${report.coverageGaps.industriesMissing.length}`);
console.log(`  - Missing regions: ${report.coverageGaps.regionsMissing.length}`);
console.log(`  - Missing playbooks: ${report.coverageGaps.playbooksMissing.length}`);
console.log(`  - Missing domains: ${report.coverageGaps.domainsMissing.length}`);
console.log(`  - Missing agents: ${report.coverageGaps.agentsMissing.length}`);
console.log(`  - Missing methodologies: ${report.coverageGaps.methodologiesMissing.length}`);
console.log(`  - Missing integrations: ${report.coverageGaps.integrationsMissing.length}`);
console.log(`  - Missing case studies: ${report.coverageGaps.caseStudiesMissing.length}`);
console.log(`  - Missing product docs: ${report.coverageGaps.productMissing.length}`);
console.log(`  - Missing compliance: ${report.coverageGaps.complianceMissing.length}`);
console.log(`  - Missing templates: ${report.coverageGaps.templatesMissing.length}`);
console.log(`  - Missing datasets: ${report.coverageGaps.datasetsMissing.length}`);
console.log(`  - Missing KPIs: ${report.coverageGaps.kpisMissing.length}`);
console.log(`  - Missing competitive intel: ${report.coverageGaps.competitiveIntelMissing.length}`);
console.log(`  - Missing technologies: ${report.coverageGaps.technologiesMissing.length}`);
console.log(`  - Missing buyer intel: ${report.coverageGaps.buyerIntelMissing.length}`);
console.log(`  - Missing vertical playbooks: ${report.coverageGaps.verticalPlaybooksMissing.length}`);
console.log(`  - Missing sales ops: ${report.coverageGaps.salesOpsMissing.length}`);
console.log(`\nQuality Gaps: ${report.qualityGaps.length}`);
console.log(`Freshness Gaps: ${report.freshnessGaps.length}`);

console.log('\nRecommendations:');
console.log(`  New docs to author: ${report.recommendations.newDocsToAuthor.length}`);
for (const rec of report.recommendations.newDocsToAuthor.slice(0, 10)) {
  console.log(`    • ${rec}`);
}
console.log(`  Existing docs to refresh: ${report.recommendations.existingDocsToRefresh.length}`);
for (const rec of report.recommendations.existingDocsToRefresh.slice(0, 5)) {
  console.log(`    • ${rec}`);
}

if (printOnly) {
  divider('FULL REPORT');
  console.log(report.markdown);
}

console.log('\n✓ Done.');
process.exit(0);
