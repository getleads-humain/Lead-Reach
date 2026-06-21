// ============================================================
// Echo Agent — Knowledge Base Gap Report Generator
// ============================================================
// Implements the "Knowledge Base Gap Analysis" output type
// documented in knowledge/agents/echo.md §9.
//
// Echo runs this monthly to surface:
//   1. Low-relevance retrievals (topScore < 30%)
//   2. Zero-result retrievals
//   3. Outdated knowledge files (>6 months since `updated`)
//   4. Missing industries (queries mention an industry not in KB)
//   5. Missing regions (queries mention a region not in KB)
//   6. Top-10 most-retrieved files (candidates for refresh)
//   7. Recommendations (which docs to author, which to update)
//
// Output: Markdown report saved to /knowledge/_reports/gap-report-YYYY-MM.md
// Also returns the report content for API/UI consumption.
// ============================================================

import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { getAnalyticsSummary, flushSync, type AnalyticsSummary } from './analytics';
import { listAllKnowledge, getKnowledgeStats, type KnowledgeDocument } from './loader';

// ============================================================
// Types
// ============================================================

export interface GapReportInput {
  /** Year-month bucket, e.g. "2026-06". Defaults to current month. */
  month?: string;
  /** Override the analytics summary (e.g., from a test). */
  analyticsOverride?: AnalyticsSummary;
  /** Override the knowledge documents list. */
  documentsOverride?: KnowledgeDocument[];
}

export interface GapReportResult {
  /** Year-month bucket */
  month: string;
  /** ISO timestamp of generation */
  generatedAt: string;
  /** Markdown report content */
  markdown: string;
  /** File path where the report was saved */
  savedTo: string;
  /** Structured findings (for programmatic consumption) */
  findings: {
    outdatedDocs: Array<{ slug: string; title: string; updated: string; daysSinceUpdate: number }>;
    missingIndustries: AnalyticsSummary['missingIndustries'];
    missingRegions: AnalyticsSummary['missingRegions'];
    topLowRelevanceQueries: AnalyticsSummary['topLowRelevanceQueries'];
    topZeroResultQueries: AnalyticsSummary['topZeroResultQueries'];
    topRetrievedDocs: AnalyticsSummary['topRetrievedDocs'];
    recommendations: string[];
  };
}

// ============================================================
// Constants
// ============================================================

const REPORTS_DIR = resolve(process.cwd(), 'knowledge', '_reports');
const OUTDATED_THRESHOLD_DAYS = 180; // 6 months
const COVERAGE_INDEX_PATH = resolve(process.cwd(), 'knowledge', '_reports', 'coverage-index.json');

// Industries / regions we expect to have in the KB (for gap detection).
// Updated as the KB grows.
const EXPECTED_INDUSTRIES = [
  'saas', 'ecommerce-retail', 'manufacturing', 'agriculture-food-trade',
  'real-estate-construction', 'financial-services', 'healthcare-life-sciences',
  'logistics-supply-chain', 'education', 'energy-utilities',
  'legal-services', 'media-entertainment', 'hospitality-travel',
];

const EXPECTED_REGIONS = [
  'united-states', 'united-kingdom', 'european-union', 'vietnam',
  'india', 'china', 'latin-america', 'mena', 'anz',
];

// ============================================================
// Public API
// ============================================================

/**
 * Generate a Knowledge Base Gap Report.
 *
 * This is the function Echo invokes monthly (per knowledge/agents/echo.md §9).
 * It reads retrieval analytics from .knowledge-analytics/, scans the KB
 * for outdated files, detects missing industries/regions, and emits a
 * structured Markdown report with concrete recommendations.
 */
export function generateGapReport(input: GapReportInput = {}): GapReportResult {
  const month = input.month || new Date().toISOString().slice(0, 7);
  const generatedAt = new Date().toISOString();

  // Make sure in-memory analytics buffer is flushed before reading
  flushSync();

  const analytics = input.analyticsOverride || getAnalyticsSummary({ monthsBack: 6 });
  const documents = input.documentsOverride || listAllKnowledge();
  const stats = getKnowledgeStats();

  // ── Finding 1: Outdated docs (>6 months since `updated`) ─────────
  const now = Date.now();
  const outdatedDocs = documents
    .map((d) => {
      const updatedTime = new Date(d.updated).getTime();
      const daysSinceUpdate = Math.floor((now - updatedTime) / (24 * 60 * 60 * 1000));
      return { slug: d.slug, title: d.title, updated: d.updated, daysSinceUpdate, category: d.category, relativePath: d.relativePath };
    })
    .filter((d) => d.daysSinceUpdate > OUTDATED_THRESHOLD_DAYS)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  // ── Finding 2: Missing industries ────────────────────────────────
  // An industry is "missing" if (a) it's in our EXPECTED list but has no
  // doc, OR (b) queries mention it AND retrievals are low-quality.
  const coveredIndustrySlugs = new Set(
    documents
      .filter((d) => d.category === 'industries')
      .map((d) => d.slug.replace(/^industry-/, ''))
  );
  const expectedMissing = EXPECTED_INDUSTRIES.filter((ind) => !coveredIndustrySlugs.has(ind));
  const analyticsMissing = analytics.missingIndustries.filter(
    (m) => !coveredIndustrySlugs.has(m.industry) && m.queryCount >= 2
  );
  const missingIndustries = [
    ...expectedMissing.map((ind) => ({ industry: ind, queryCount: 0, sampleQueries: [] as string[] })),
    ...analyticsMissing,
  ].sort((a, b) => b.queryCount - a.queryCount);

  // ── Finding 3: Missing regions ───────────────────────────────────
  const coveredRegionSlugs = new Set(
    documents
      .filter((d) => d.category === 'regions')
      .map((d) => d.slug.replace(/^region-/, ''))
  );
  const expectedMissingRegions = EXPECTED_REGIONS.filter((r) => !coveredRegionSlugs.has(r));
  const analyticsMissingRegions = analytics.missingRegions.filter(
    (m) => !coveredRegionSlugs.has(m.region) && m.queryCount >= 2
  );
  const missingRegions = [
    ...expectedMissingRegions.map((r) => ({ region: r, queryCount: 0, sampleQueries: [] as string[] })),
    ...analyticsMissingRegions,
  ].sort((a, b) => b.queryCount - a.queryCount);

  // ── Finding 4 & 5 & 6: From analytics ────────────────────────────
  const topLowRelevanceQueries = analytics.topLowRelevanceQueries;
  const topZeroResultQueries = analytics.topZeroResultQueries;
  const topRetrievedDocs = analytics.topRetrievedDocs;

  // ── Finding 7: Recommendations ───────────────────────────────────
  const recommendations: string[] = [];

  if (outdatedDocs.length > 0) {
    recommendations.push(
      `**Refresh ${outdatedDocs.length} outdated document(s)** — the following have not been updated in >6 months and may contain stale information. Prioritize the top 3: ${outdatedDocs.slice(0, 3).map((d) => `\`${d.slug}\``).join(', ')}.`
    );
  }

  if (missingIndustries.length > 0) {
    recommendations.push(
      `**Author ${missingIndustries.length} missing industry playbook(s)** — high-demand gaps detected: ${missingIndustries.slice(0, 5).map((m) => `\`${m.industry}\` (${m.queryCount} low-quality queries)`).join(', ')}. Use the template in \`knowledge/industries/saas.md\` as the structural reference.`
    );
  }

  if (missingRegions.length > 0) {
    recommendations.push(
      `**Author ${missingRegions.length} missing region guide(s)** — queries mention regions without dedicated coverage: ${missingRegions.slice(0, 5).map((m) => `\`${m.region}\` (${m.queryCount} queries)`).join(', ')}. Use \`knowledge/regions/united-states.md\` as the template.`
    );
  }

  if (topLowRelevanceQueries.length > 0 && topLowRelevanceQueries[0].count >= 3) {
    recommendations.push(
      `**Investigate top low-relevance query pattern**: \`${topLowRelevanceQueries[0].query}\` returned avg ${topLowRelevanceQueries[0].meanTopScore.toFixed(2)} topScore across ${topLowRelevanceQueries[0].count} retrievals. Either (a) author a new doc covering this topic, (b) add tags/keywords to existing docs so they match, or (c) enable semantic retrieval for higher recall.`
    );
  }

  if (topZeroResultQueries.length > 0 && topZeroResultQueries[0].count >= 3) {
    recommendations.push(
      `**Investigate top zero-result query**: \`${topZeroResultQueries[0].query}\` returned 0 results ${topZeroResultQueries[0].count} times. This is a hard gap — no existing doc matches even weakly. Author a new doc tagged for the relevant agent + industry + intent.`
    );
  }

  if (topRetrievedDocs.length > 0 && topRetrievedDocs[0].count >= 10) {
    recommendations.push(
      `**Refresh top-retrieved doc**: \`${topRetrievedDocs[0].slug}\` was retrieved ${topRetrievedDocs[0].count} times in the last 6 months. Verify its content is still accurate and consider expanding it with more examples.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      '**No major gaps detected.** Knowledge base is well-coverage. Consider periodic refresh of high-priority docs (priority > 85) to keep examples current with industry changes.'
    );
  }

  // ── Build Markdown report ────────────────────────────────────────
  const markdown = buildMarkdownReport({
    month,
    generatedAt,
    stats,
    analytics,
    outdatedDocs,
    missingIndustries,
    missingRegions,
    topLowRelevanceQueries,
    topZeroResultQueries,
    topRetrievedDocs,
    recommendations,
    documents,
  });

  // ── Save report to disk ──────────────────────────────────────────
  if (!existsSync(REPORTS_DIR)) {
    mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const reportPath = join(REPORTS_DIR, `gap-report-${month}.md`);
  writeFileSync(reportPath, markdown, 'utf8');

  // Also update the coverage index (machine-readable)
  writeCoverageIndex({
    month,
    generatedAt,
    totalDocs: documents.length,
    coveredIndustries: Array.from(coveredIndustrySlugs),
    missingIndustries: missingIndustries.map((m) => m.industry),
    coveredRegions: Array.from(coveredRegionSlugs),
    missingRegions: missingRegions.map((m) => m.region),
    outdatedCount: outdatedDocs.length,
  });

  return {
    month,
    generatedAt,
    markdown,
    savedTo: reportPath,
    findings: {
      outdatedDocs: outdatedDocs.map((d) => ({ slug: d.slug, title: d.title, updated: d.updated, daysSinceUpdate: d.daysSinceUpdate })),
      missingIndustries,
      missingRegions,
      topLowRelevanceQueries,
      topZeroResultQueries,
      topRetrievedDocs,
      recommendations,
    },
  };
}

/**
 * Get the most recent gap report (or null if none exists).
 */
export function getLatestGapReport(): { month: string; markdown: string; path: string; generatedAt: string } | null {
  if (!existsSync(REPORTS_DIR)) return null;
  const files = readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith('gap-report-') && f.endsWith('.md'))
    .sort()
    .reverse();
  if (files.length === 0) return null;
  const latest = files[0];
  const path = join(REPORTS_DIR, latest);
  const markdown = readFileSync(path, 'utf8');
  const month = latest.replace('gap-report-', '').replace('.md', '');
  // Try to parse generatedAt from the first few lines
  const match = markdown.match(/\*\*Generated at:\*\* ([^\n]+)/);
  const generatedAt = match ? match[1].trim() : new Date().toISOString();
  return { month, markdown, path, generatedAt };
}

/**
 * List all available gap reports (newest first).
 */
export function listGapReports(): Array<{ month: string; path: string; sizeBytes: number }> {
  if (!existsSync(REPORTS_DIR)) return [];
  return readdirSync(REPORTS_DIR)
    .filter((f) => f.startsWith('gap-report-') && f.endsWith('.md'))
    .sort()
    .reverse()
    .map((f) => {
      const path = join(REPORTS_DIR, f);
      const month = f.replace('gap-report-', '').replace('.md', '');
      const stats = require('fs').statSync(path);
      return { month, path, sizeBytes: stats.size };
    });
}

// ============================================================
// Markdown Report Builder
// ============================================================

interface ReportData {
  month: string;
  generatedAt: string;
  stats: ReturnType<typeof getKnowledgeStats>;
  analytics: AnalyticsSummary;
  outdatedDocs: Array<{ slug: string; title: string; updated: string; daysSinceUpdate: number; category: string; relativePath: string }>;
  missingIndustries: AnalyticsSummary['missingIndustries'];
  missingRegions: AnalyticsSummary['missingRegions'];
  topLowRelevanceQueries: AnalyticsSummary['topLowRelevanceQueries'];
  topZeroResultQueries: AnalyticsSummary['topZeroResultQueries'];
  topRetrievedDocs: AnalyticsSummary['topRetrievedDocs'];
  recommendations: string[];
  documents: KnowledgeDocument[];
}

function buildMarkdownReport(data: ReportData): string {
  const lines: string[] = [];

  lines.push(`# Knowledge Base Gap Report — ${data.month}`);
  lines.push('');
  lines.push(`> **Generated at:** ${data.generatedAt}  `);
  lines.push(`> **Generated by:** Echo agent (LeadReach continuous-improvement loop)  `);
  lines.push(`> **Coverage window:** Last 6 months of retrieval analytics  `);
  lines.push(`> **Knowledge base size:** ${data.stats.totalDocuments} documents, ${(data.stats.totalWords / 1000).toFixed(1)}K words, ${(data.stats.totalTokens / 1000).toFixed(1)}K tokens`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ── Executive Summary ────────────────────────────────────────────
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`This report analyzes retrieval analytics from ${data.analytics.earliestTs || 'N/A'} to ${data.analytics.latestTs || 'N/A'}, covering ${data.analytics.monthsCovered.length} month(s) and ${data.analytics.totalRetrievals} total retrieval(s). The knowledge base currently contains ${data.stats.totalDocuments} documents across ${Object.keys(data.stats.byCategory).length} categories.`);
  lines.push('');

  const criticalGaps =
    data.outdatedDocs.length +
    data.missingIndustries.filter((m) => m.queryCount > 0).length +
    data.missingRegions.filter((m) => m.queryCount > 0).length;

  if (criticalGaps === 0 && data.analytics.lowRelevanceCount === 0 && data.analytics.zeroResultCount === 0) {
    lines.push('**Status: HEALTHY** — No critical gaps detected. Knowledge base coverage is strong and retrieval quality is high.');
  } else {
    lines.push(`**Status: ACTION NEEDED** — ${criticalGaps} coverage gap(s) and ${data.analytics.lowRelevanceCount} low-relevance retrieval(s) detected. See recommendations below.`);
  }
  lines.push('');

  // ── Section 1: Retrieval Health ──────────────────────────────────
  lines.push('## 1. Retrieval Health');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|---|---|');
  lines.push(`| Total retrievals (6mo) | ${data.analytics.totalRetrievals} |`);
  lines.push(`| Distinct queries | ${data.analytics.distinctQueries} |`);
  lines.push(`| Zero-result retrievals | ${data.analytics.zeroResultCount} (${pct(data.analytics.zeroResultCount, data.analytics.totalRetrievals)}) |`);
  lines.push(`| Low-relevance retrievals (topScore < 30%) | ${data.analytics.lowRelevanceCount} (${pct(data.analytics.lowRelevanceCount, data.analytics.totalRetrievals)}) |`);
  lines.push(`| Months covered | ${data.analytics.monthsCovered.join(', ') || 'N/A'} |`);
  lines.push('');

  // ── Section 2: Top Low-Relevance Queries ─────────────────────────
  lines.push('## 2. Top Low-Relevance Queries');
  lines.push('');
  lines.push("These queries retrieved documents but with low confidence (topScore < 30%). They indicate either (a) the user is asking about a topic we partially cover, or (b) the existing doc's tags/keywords don't match how users phrase the query.");
  lines.push('');
  if (data.topLowRelevanceQueries.length === 0) {
    lines.push('_No low-relevance queries detected in the coverage window._');
  } else {
    lines.push('| Query | Count | Mean Top Score | Action |');
    lines.push('|---|---:|---:|---|');
    for (const q of data.topLowRelevanceQueries.slice(0, 10)) {
      const action = q.meanTopScore < 0.15 ? 'Author new doc' : 'Add keywords to existing doc';
      lines.push(`| \`${escapeMd(q.query)}\` | ${q.count} | ${(q.meanTopScore * 100).toFixed(0)}% | ${action} |`);
    }
  }
  lines.push('');

  // ── Section 3: Top Zero-Result Queries ───────────────────────────
  lines.push('## 3. Top Zero-Result Queries');
  lines.push('');
  lines.push('These queries returned NO documents at all. They represent the hardest gaps — no existing doc matches even weakly. Each one is a candidate for a new knowledge document.');
  lines.push('');
  if (data.topZeroResultQueries.length === 0) {
    lines.push('_No zero-result queries detected in the coverage window._');
  } else {
    lines.push('| Query | Count |');
    lines.push('|---|---:|');
    for (const q of data.topZeroResultQueries.slice(0, 10)) {
      lines.push(`| \`${escapeMd(q.query)}\` | ${q.count} |`);
    }
  }
  lines.push('');

  // ── Section 4: Outdated Documents ────────────────────────────────
  lines.push('## 4. Outdated Documents');
  lines.push('');
  lines.push(`Documents not updated in >${OUTDATED_THRESHOLD_DAYS} days. Industry playbooks and regional guides drift quickly — refresh these to keep examples and regulatory references current.`);
  lines.push('');
  if (data.outdatedDocs.length === 0) {
    lines.push('_No outdated documents. All knowledge files have been updated within the last 6 months._');
  } else {
    lines.push('| Slug | Title | Last Updated | Days Since | Category |');
    lines.push('|---|---|---|---:|---|');
    for (const d of data.outdatedDocs.slice(0, 20)) {
      lines.push(`| \`${d.slug}\` | ${escapeMd(d.title)} | ${d.updated} | ${d.daysSinceUpdate} | ${d.category} |`);
    }
    if (data.outdatedDocs.length > 20) {
      lines.push(`| ... | _${data.outdatedDocs.length - 20} more_ | | | |`);
    }
  }
  lines.push('');

  // ── Section 5: Missing Industries ────────────────────────────────
  lines.push('## 5. Missing Industry Coverage');
  lines.push('');
  lines.push('Industries that appear in user queries but have no dedicated playbook in the knowledge base, OR are expected but missing. Author new playbooks using `knowledge/industries/saas.md` as the template.');
  lines.push('');
  if (data.missingIndustries.length === 0) {
    lines.push('_No missing industries detected. All expected industries are covered._');
  } else {
    lines.push('| Industry | Low-Quality Query Count | Sample Queries |');
    lines.push('|---|---:|---|');
    for (const m of data.missingIndustries.slice(0, 15)) {
      const samples = m.sampleQueries.length > 0 ? m.sampleQueries.map((q) => `\`${escapeMd(q)}\``).join(' · ') : '_N/A (expected but not yet queried)_';
      lines.push(`| \`${m.industry}\` | ${m.queryCount} | ${samples} |`);
    }
  }
  lines.push('');

  // ── Section 6: Missing Regions ───────────────────────────────────
  lines.push('## 6. Missing Regional Coverage');
  lines.push('');
  lines.push('Regions mentioned in queries but without dedicated guides, OR expected but missing. Author new region guides using `knowledge/regions/united-states.md` as the template.');
  lines.push('');
  if (data.missingRegions.length === 0) {
    lines.push('_No missing regions detected. All expected regions are covered._');
  } else {
    lines.push('| Region | Low-Quality Query Count | Sample Queries |');
    lines.push('|---|---:|---|');
    for (const m of data.missingRegions.slice(0, 15)) {
      const samples = m.sampleQueries.length > 0 ? m.sampleQueries.map((q) => `\`${escapeMd(q)}\``).join(' · ') : '_N/A (expected but not yet queried)_';
      lines.push(`| \`${m.region}\` | ${m.queryCount} | ${samples} |`);
    }
  }
  lines.push('');

  // ── Section 7: Top Retrieved Documents ───────────────────────────
  lines.push('## 7. Top 10 Most-Retrieved Documents');
  lines.push('');
  lines.push('These documents are the workhorses of the knowledge base. Verify their content is still accurate, expand them with more examples, and consider linking them to related docs.');
  lines.push('');
  if (data.topRetrievedDocs.length === 0) {
    lines.push('_No retrieval data available yet._');
  } else {
    lines.push('| Rank | Slug | Retrieval Count |');
    lines.push('|---:|---|---:|');
    data.topRetrievedDocs.forEach((d, i) => {
      lines.push(`| ${i + 1} | \`${d.slug}\` | ${d.count} |`);
    });
  }
  lines.push('');

  // ── Section 8: Recommendations ───────────────────────────────────
  lines.push('## 8. Recommendations');
  lines.push('');
  lines.push('Concrete next steps for the Knowledge Engineering team, prioritized by impact:');
  lines.push('');
  for (let i = 0; i < data.recommendations.length; i++) {
    lines.push(`${i + 1}. ${data.recommendations[i]}`);
  }
  lines.push('');

  // ── Footer ───────────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push('_This report was generated automatically by the Echo agent\'s monthly continuous-improvement loop. To regenerate, run `npx tsx scripts/knowledge/run-gap-report.ts` or POST to `/api/knowledge/gap-report`._');
  lines.push('');

  return lines.join('\n');
}

// ============================================================
// Coverage Index (machine-readable companion file)
// ============================================================

interface CoverageIndex {
  month: string;
  generatedAt: string;
  totalDocs: number;
  coveredIndustries: string[];
  missingIndustries: string[];
  coveredRegions: string[];
  missingRegions: string[];
  outdatedCount: number;
}

function writeCoverageIndex(idx: CoverageIndex): void {
  try {
    if (!existsSync(REPORTS_DIR)) {
      mkdirSync(REPORTS_DIR, { recursive: true });
    }
    writeFileSync(COVERAGE_INDEX_PATH, JSON.stringify(idx, null, 2), 'utf8');
  } catch (err) {
    console.warn('[knowledge/gap-report] Failed to write coverage index:', err);
  }
}

export function getCoverageIndex(): CoverageIndex | null {
  if (!existsSync(COVERAGE_INDEX_PATH)) return null;
  try {
    return JSON.parse(readFileSync(COVERAGE_INDEX_PATH, 'utf8')) as CoverageIndex;
  } catch {
    return null;
  }
}

// ============================================================
// Helpers
// ============================================================

function pct(num: number, denom: number): string {
  if (denom === 0) return '0%';
  return `${((num / denom) * 100).toFixed(1)}%`;
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ').replace(/`/g, '\\`');
}
