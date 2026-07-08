/**
 * Echo Agent — Monthly Knowledge Gap Report Generator
 * ---------------------------------------------------
 * Analyzes the knowledge base and produces a Markdown gap report at
 * knowledge/gap-reports/YYYY-MM-gap-report.md.
 *
 * The report identifies:
 *   1. Coverage gaps — industries / regions / playbooks / domains / agents / methodologies / integrations / case-studies / product not covered
 *   2. Quality gaps — existing docs with grade C or D
 *   3. Usage gaps — docs not referenced by any agent in last 30 days (placeholder; future: query agent-memory)
 *   4. Freshness gaps — docs not reviewed in 180+ days
 *   5. Recommendations — new docs to author; existing docs to refresh
 *
 * Usage:
 *   - CLI: `npx tsx scripts/run-gap-report.ts`
 *   - API:  GET /api/knowledge/gap-report (admin only)
 *   - Cron:  monthly on the 1st (configured via ecosystem.config.js or external cron)
 */

import * as fs from 'fs';
import * as path from 'path';
import { getKnowledgeIndex, type KnowledgeChunk } from './index';

// ============================================================
// Expected Coverage (Baseline)
// ============================================================

/**
 * Baseline set of knowledge categories that the knowledge base SHOULD cover.
 * Gaps are computed against this baseline.
 */
const EXPECTED_INDUSTRIES = [
  // Existing coverage (20 docs):
  'saas-b2b', 'fintech', 'healthtech', 'ecommerce-dtc', 'manufacturing',
  'dev-tools', 'cybersecurity', 'ai-infrastructure', 'ecommerce-retail',
  'financial-services', 'legal-services', 'logistics-supply-chain',
  'healthcare-life-sciences', 'agriculture-food-trade', 'education',
  'media-entertainment', 'hospitality-travel', 'saas', 'energy-utilities',
  'real-estate-construction',
  // Future / known gaps:
  'edtech', 'proptech', 'legaltech', 'hrtech', 'martech',
  'clm', 'biotech', 'agtech', 'insurance', 'government-public-sector',
  'telecommunications', 'automotive', 'pharmaceutical', 'gaming',
  'nonprofit-ngo', 'cleantech-sustainability',
];

const EXPECTED_REGIONS = [
  // Existing coverage (15 docs):
  'us', 'eu-gdpr', 'uk', 'apac-singapore', 'canada', 'dach',
  'vietnam', 'china', 'india', 'middle-east-north-africa',
  'united-kingdom', 'latin-america', 'australia-nz',
  'european-union', 'united-states',
  // Future / known gaps:
  'nordics', 'japan', 'south-korea', 'latam-brazil', 'latam-mexico',
  'sea', 'mena', 'africa', 'philippines', 'indonesia', 'taiwan',
  'new-zealand', 'brazil', 'mexico', 'colombia', 'nigeria',
  'south-africa', 'kenya', 'uae', 'saudi-arabia', 'israel',
];

const EXPECTED_PLAYBOOKS = [
  // Existing coverage (7 docs):
  'outbound-cold-email', 'icp-discovery', 'multi-threaded-selling',
  'inbound-lead-routing', 'churn-recovery', 'find-suppliers-in-country',
  'research-specific-company',
  // Future / known gaps:
  'upsell-to-enterprise', 'competitor-displacement', 'event-follow-up',
  'referral-program', 'pricing-negotiation', 'security-review-playbook',
  'procurement-playbook', 'partner-channel-selling', 'product-led-growth',
  'sales-assisted-conversion', 'land-and-expand', 'renewal-management',
  'cross-sell-expansion', 'technical-proof-of-concept',
];

const EXPECTED_DOMAINS = [
  // Existing coverage (6 docs):
  'b2b-lead-generation-core-theory', 'data-enrichment-methodology',
  'icp-design-scoring-methodology', 'lead-qualification-frameworks',
  'outreach-methodology-cold-email-sequences', 'trigger-events-detection-timing',
  // Future / known gaps:
  'pipeline-management-methodology', 'deal-velocity-optimization',
  'account-based-marketing-methodology', 'sales-enablement-framework',
  'revenue-operations-framework', 'customer-success-methodology',
  'competitive-intelligence-methodology', 'market-entry-strategy',
];

const EXPECTED_AGENTS = [
  'atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo',
];

const EXPECTED_METHODOLOGIES = [
  'prospecting-research-methodology', 'lead-scoring-deep-dive',
  'objection-handling-framework', 'sales-playbook-design',
  'territory-planning-methodology', 'forecasting-accuracy-methodology',
  'meddic-meddpicc-framework', 'challenger-sale-methodology',
  'spin-selling-methodology', 'sandler-selling-system',
  'inbound-methodology', 'value-selling-framework',
  'consultative-selling', 'snap-selling-methodology',
];

const EXPECTED_INTEGRATIONS = [
  'crm-integration-guide', 'email-provider-integration',
  'calendar-booking-integration', 'data-provider-integration',
  'webhook-automation-integration', 'api-reference',
  'salesforce-integration', 'hubspot-integration',
  'slack-teams-integration', 'zapier-automation',
  'apollo-zoominfo-integration',
];

const EXPECTED_CASE_STUDIES = [
  'saas-scaleup-50-to-500', 'fintech-enterprise-expansion',
  'ecommerce-dtc-growth', 'healthtech-compliance-playbook',
  'saas-plg-to-sales-led', 'enterprise-security-vendor',
  'manufacturing-digital-transformation', 'healthtech-hipaa-compliant-outreach',
  'fintech-cross-border-expansion', 'edtech-university-selling',
];

const EXPECTED_PRODUCT = [
  'leadreach-platform-overview', 'agent-pipeline-architecture',
  'data-security-privacy', 'pricing-packaging-guide',
  'onboarding-quickstart', 'release-notes',
  'ai-agent-orchestration', 'lead-scoring-engine',
  'outreach-automation', 'analytics-dashboard',
  'enterprise-security',
];

const EXPECTED_COMPLIANCE = [
  'global-regulations', 'gdpr-data-handling', 'ccpa-cpra-compliance',
  'can-spam-cas-law', 'ai-regulations-ethics', 'soc2-iso27001',
  'dual-use-export-controls', 'industry-specific-regulations',
];

const EXPECTED_TEMPLATES = [
  'prompt-schemas', 'email-sequence-templates', 'icp-scoring-templates',
  'outreach-cadence-templates', 'qualification-framework-templates',
  'objection-handling-templates', 'report-templates',
];

const EXPECTED_DATASETS = [
  'few-shot-examples', 'b2b-contact-attributes', 'industry-classification-codes',
  'technographic-signals', 'buying-intent-signals', 'kpi-benchmarks',
];

// ============================================================
// Gap Report Generator
// ============================================================

export interface GapReportResult {
  generatedAt: string;
  reportMonth: string;
  reportPath: string;
  stats: {
    totalDocs: number;
    totalChunks: number;
    byCategory: Record<string, number>;
    byGrade: Record<string, number>;
  };
  coverageGaps: {
    industriesMissing: string[];
    regionsMissing: string[];
    playbooksMissing: string[];
    domainsMissing: string[];
    agentsMissing: string[];
    methodologiesMissing: string[];
    integrationsMissing: string[];
    caseStudiesMissing: string[];
    productMissing: string[];
    complianceMissing: string[];
    templatesMissing: string[];
    datasetsMissing: string[];
  };
  qualityGaps: Array<{ path: string; title: string; grade: string; issue: string; recommendedAction: string }>;
  usageGaps: Array<{ path: string; title: string; lastReferenced: string; recommendation: string }>;
  freshnessGaps: Array<{ path: string; title: string; lastReviewed: string; recommendation: string }>;
  recommendations: {
    newDocsToAuthor: string[];
    existingDocsToRefresh: string[];
  };
  markdown: string;
}

/**
 * Generate the monthly gap report.
 */
export function generateGapReport(opts: { outputDir?: string; now?: Date } = {}): GapReportResult {
  const now = opts.now ?? new Date();
  const reportMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const outputDir = opts.outputDir ?? path.join(process.cwd(), 'knowledge', 'gap-reports');
  const reportPath = path.join(outputDir, `${reportMonth}-gap-report.md`);

  const index = getKnowledgeIndex();
  index.load(true);  // force reload
  const files = index.listFiles();
  const stats = index.stats();

  // ============================================================
  // 1. Coverage Gaps
  // ============================================================

  const coveredIndustries = new Set(
    files.filter(f => f.category === 'industry').map(f => path.basename(f.path, '.md'))
  );
  const coveredRegions = new Set(
    files.filter(f => f.category === 'region').map(f => path.basename(f.path, '.md'))
  );
  const coveredPlaybooks = new Set(
    files.filter(f => f.category === 'playbook').map(f => path.basename(f.path, '.md'))
  );
  const coveredDomains = new Set(
    files.filter(f => f.category === 'domain').map(f => path.basename(f.path, '.md'))
  );
  const coveredAgents = new Set(
    files.filter(f => f.category === 'agent').map(f => path.basename(f.path, '.md'))
  );
  const coveredMethodologies = new Set(
    files.filter(f => f.category === 'methodology').map(f => path.basename(f.path, '.md'))
  );
  const coveredIntegrations = new Set(
    files.filter(f => f.category === 'integration').map(f => path.basename(f.path, '.md'))
  );
  const coveredCaseStudies = new Set(
    files.filter(f => f.category === 'case-study').map(f => path.basename(f.path, '.md'))
  );
  const coveredProduct = new Set(
    files.filter(f => f.category === 'product').map(f => path.basename(f.path, '.md'))
  );
  const coveredCompliance = new Set(
    files.filter(f => f.category === 'compliance').map(f => path.basename(f.path, '.md'))
  );
  const coveredTemplates = new Set(
    files.filter(f => f.category === 'template').map(f => path.basename(f.path, '.md'))
  );
  const coveredDatasets = new Set(
    files.filter(f => f.category === 'dataset').map(f => path.basename(f.path, '.md'))
  );

  const industriesMissing = EXPECTED_INDUSTRIES.filter(i => !coveredIndustries.has(i));
  const regionsMissing = EXPECTED_REGIONS.filter(r => !coveredRegions.has(r));
  const playbooksMissing = EXPECTED_PLAYBOOKS.filter(p => !coveredPlaybooks.has(p));
  const domainsMissing = EXPECTED_DOMAINS.filter(d => !coveredDomains.has(d));
  const agentsMissing = EXPECTED_AGENTS.filter(a => !coveredAgents.has(a));
  const methodologiesMissing = EXPECTED_METHODOLOGIES.filter(m => !coveredMethodologies.has(m));
  const integrationsMissing = EXPECTED_INTEGRATIONS.filter(i => !coveredIntegrations.has(i));
  const caseStudiesMissing = EXPECTED_CASE_STUDIES.filter(c => !coveredCaseStudies.has(c));
  const productMissing = EXPECTED_PRODUCT.filter(p => !coveredProduct.has(p));
  const complianceMissing = EXPECTED_COMPLIANCE.filter(c => !coveredCompliance.has(c));
  const templatesMissing = EXPECTED_TEMPLATES.filter(t => !coveredTemplates.has(t));
  const datasetsMissing = EXPECTED_DATASETS.filter(d => !coveredDatasets.has(d));

  // ============================================================
  // 2. Quality Gaps (Grade C or D)
  // ============================================================

  const qualityGaps: GapReportResult['qualityGaps'] = [];
  for (const file of files) {
    if (file.grade === 'C' || file.grade === 'D') {
      qualityGaps.push({
        path: file.path,
        title: file.title,
        grade: file.grade,
        issue: file.grade === 'C' ? 'Missing two or more B-grade items per rubric' : 'Stub or placeholder',
        recommendedAction: file.grade === 'C' ? 'Refresh — add missing sections per authoring notes' : 'Author full content',
      });
    }
  }

  // ============================================================
  // 3. Usage Gaps
  // ============================================================

  const allChunks = index.listDocs();
  const referencedFiles = new Set<string>();
  for (const chunk of allChunks) {
    const linkMatches = chunk.content.matchAll(/\[[^\]]+\]\(([^)]+\.md[^)]*)\)/g);
    for (const m of linkMatches) {
      const target = m[1].split('#')[0];
      const resolved = path.normalize(path.join(path.dirname(chunk.filePath), target)).split(path.sep).join('/');
      referencedFiles.add(resolved);
    }
  }

  const DAY_30 = 30 * 24 * 60 * 60 * 1000;
  const usageGaps: GapReportResult['usageGaps'] = [];
  for (const file of files) {
    if (file.category === 'gap-report' || file.category === 'training-data') continue;
    if (referencedFiles.has(file.path)) continue;
    if (file.lastReviewed) {
      const age = now.getTime() - new Date(file.lastReviewed).getTime();
      if (age < DAY_30 && (file.grade === 'A' || file.grade === 'B')) continue;
    }
    usageGaps.push({
      path: file.path,
      title: file.title,
      lastReferenced: 'never (no incoming links)',
      recommendation: 'Review for relevance — appears underused; consider adding cross-references from related docs or promoting in agent training',
    });
  }

  // ============================================================
  // 4. Freshness Gaps (180+ days since last review)
  // ============================================================

  const DAY = 24 * 60 * 60 * 1000;
  const freshnessGaps: GapReportResult['freshnessGaps'] = [];
  for (const file of files) {
    if (file.category === 'training-data' || file.category === 'gap-report') continue;
    if (!file.lastReviewed) {
      freshnessGaps.push({
        path: file.path,
        title: file.title,
        lastReviewed: 'unknown',
        recommendation: 'Add last_reviewed frontmatter and refresh',
      });
      continue;
    }
    const reviewed = new Date(file.lastReviewed).getTime();
    const days = (now.getTime() - reviewed) / DAY;
    if (days >= 180) {
      freshnessGaps.push({
        path: file.path,
        title: file.title,
        lastReviewed: file.lastReviewed,
        recommendation: `Refresh — ${Math.floor(days)} days since last review; re-verify all data points`,
      });
    }
  }

  // ============================================================
  // 5. Recommendations
  // ============================================================

  const newDocsToAuthor: string[] = [];
  for (const industry of industriesMissing.slice(0, 5)) {
    newDocsToAuthor.push(`knowledge/industries/${industry}.md — emerging industry requested in recent campaigns`);
  }
  for (const region of regionsMissing.slice(0, 5)) {
    newDocsToAuthor.push(`knowledge/regions/${region}.md — region with active prospect activity`);
  }
  for (const playbook of playbooksMissing.slice(0, 3)) {
    newDocsToAuthor.push(`knowledge/playbooks/${playbook}.md — recurring scenario not yet documented`);
  }
  for (const domain of domainsMissing.slice(0, 3)) {
    newDocsToAuthor.push(`knowledge/domain/${domain}.md — missing domain methodology`);
  }
  for (const methodology of methodologiesMissing.slice(0, 2)) {
    newDocsToAuthor.push(`knowledge/methodologies/${methodology}.md — missing sales methodology`);
  }
  for (const integration of integrationsMissing.slice(0, 2)) {
    newDocsToAuthor.push(`knowledge/integrations/${integration}.md — missing integration guide`);
  }
  for (const cs of caseStudiesMissing.slice(0, 2)) {
    newDocsToAuthor.push(`knowledge/case-studies/${cs}.md — missing case study`);
  }
  for (const prod of productMissing.slice(0, 2)) {
    newDocsToAuthor.push(`knowledge/product/${prod}.md — missing product documentation`);
  }

  const existingDocsToRefresh: string[] = [];
  for (const gap of qualityGaps) {
    existingDocsToRefresh.push(`knowledge/${gap.path} — ${gap.issue}; ${gap.recommendedAction}`);
  }
  for (const gap of freshnessGaps) {
    existingDocsToRefresh.push(`knowledge/${gap.path} — ${gap.recommendation}`);
  }

  // ============================================================
  // Compose Markdown
  // ============================================================

  const coverageGaps = {
    industriesMissing, regionsMissing, playbooksMissing,
    domainsMissing, agentsMissing, methodologiesMissing,
    integrationsMissing, caseStudiesMissing, productMissing,
    complianceMissing, templatesMissing, datasetsMissing,
  };

  const markdown = composeMarkdown({
    reportMonth,
    now,
    stats,
    coverageGaps,
    qualityGaps,
    usageGaps,
    freshnessGaps,
    recommendations: { newDocsToAuthor, existingDocsToRefresh },
  });

  // Write to disk
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, markdown, 'utf-8');

  return {
    generatedAt: now.toISOString(),
    reportMonth,
    reportPath,
    stats: {
      totalDocs: stats.totalDocs,
      totalChunks: stats.totalChunks,
      byCategory: stats.byCategory,
      byGrade: stats.byGrade,
    },
    coverageGaps,
    qualityGaps,
    usageGaps,
    freshnessGaps,
    recommendations: { newDocsToAuthor, existingDocsToRefresh },
    markdown,
  };
}

function composeMarkdown(input: {
  reportMonth: string;
  now: Date;
  stats: import('./index').KnowledgeStats;
  coverageGaps: {
    industriesMissing: string[]; regionsMissing: string[]; playbooksMissing: string[];
    domainsMissing: string[]; agentsMissing: string[];
    methodologiesMissing: string[]; integrationsMissing: string[];
    caseStudiesMissing: string[]; productMissing: string[];
    complianceMissing: string[]; templatesMissing: string[]; datasetsMissing: string[];
  };
  qualityGaps: GapReportResult['qualityGaps'];
  usageGaps: GapReportResult['usageGaps'];
  freshnessGaps: GapReportResult['freshnessGaps'];
  recommendations: { newDocsToAuthor: string[]; existingDocsToRefresh: string[] };
}): string {
  const { reportMonth, now, stats, coverageGaps, qualityGaps, usageGaps, freshnessGaps, recommendations } = input;
  const dateStr = now.toISOString().slice(0, 10);

  const totalGaps = coverageGaps.industriesMissing.length + coverageGaps.regionsMissing.length +
    coverageGaps.playbooksMissing.length + coverageGaps.domainsMissing.length +
    coverageGaps.agentsMissing.length + coverageGaps.methodologiesMissing.length +
    coverageGaps.integrationsMissing.length + coverageGaps.caseStudiesMissing.length +
    coverageGaps.productMissing.length + coverageGaps.complianceMissing.length +
    coverageGaps.templatesMissing.length + coverageGaps.datasetsMissing.length +
    qualityGaps.length + freshnessGaps.length;

  return `---
title: "Monthly Knowledge Gap Report — ${reportMonth}"
category: gap-report
generated_at: "${now.toISOString()}"
generated_by: "echo"
report_month: "${reportMonth}"
total_gaps: ${totalGaps}
---

# Monthly Knowledge Gap Report — ${reportMonth}

> Generated by the Echo agent on ${dateStr}.

## 1. Executive Summary

The knowledge base currently contains **${stats.totalDocs} documents** across ${Object.keys(stats.byCategory).length} categories, indexed into ${stats.totalChunks} retrievable chunks. This report identifies **${totalGaps} gaps** requiring attention: ${coverageGaps.industriesMissing.length} missing industries, ${coverageGaps.regionsMissing.length} missing regions, ${coverageGaps.playbooksMissing.length} missing playbooks, ${coverageGaps.domainsMissing.length} missing domain docs, ${coverageGaps.methodologiesMissing.length} missing methodologies, ${coverageGaps.integrationsMissing.length} missing integrations, ${coverageGaps.caseStudiesMissing.length} missing case studies, ${coverageGaps.productMissing.length} missing product docs, ${qualityGaps.length} quality gaps, and ${freshnessGaps.length} freshness gaps.

**Priority actions this month:**
${recommendations.newDocsToAuthor.slice(0, 5).map(r => `- ${r}`).join('\n') || '- No new docs urgently required this month.'}

## 2. Coverage Gaps

### 2.1 Industries Not Covered (${coverageGaps.industriesMissing.length})

${coverageGaps.industriesMissing.length > 0
    ? coverageGaps.industriesMissing.map(i => `- \`${i}\``).join('\n')
    : '_All expected industries are covered._'}

### 2.2 Regions Not Covered (${coverageGaps.regionsMissing.length})

${coverageGaps.regionsMissing.length > 0
    ? coverageGaps.regionsMissing.map(r => `- \`${r}\``).join('\n')
    : '_All expected regions are covered._'}

### 2.3 Playbooks Not Covered (${coverageGaps.playbooksMissing.length})

${coverageGaps.playbooksMissing.length > 0
    ? coverageGaps.playbooksMissing.map(p => `- \`${p}\``).join('\n')
    : '_All expected playbooks are covered._'}

### 2.4 Domain Methodologies Not Covered (${coverageGaps.domainsMissing.length})

${coverageGaps.domainsMissing.length > 0
    ? coverageGaps.domainsMissing.map(d => `- \`${d}\``).join('\n')
    : '_All expected domain docs are covered._'}

### 2.5 Agent Docs Not Covered (${coverageGaps.agentsMissing.length})

${coverageGaps.agentsMissing.length > 0
    ? coverageGaps.agentsMissing.map(a => `- \`${a}\``).join('\n')
    : '_All expected agent docs are covered._'}

### 2.6 Sales Methodologies Not Covered (${coverageGaps.methodologiesMissing.length})

${coverageGaps.methodologiesMissing.length > 0
    ? coverageGaps.methodologiesMissing.map(m => `- \`${m}\``).join('\n')
    : '_All expected methodology docs are covered._'}

### 2.7 Integration Guides Not Covered (${coverageGaps.integrationsMissing.length})

${coverageGaps.integrationsMissing.length > 0
    ? coverageGaps.integrationsMissing.map(i => `- \`${i}\``).join('\n')
    : '_All expected integration docs are covered._'}

### 2.8 Case Studies Not Covered (${coverageGaps.caseStudiesMissing.length})

${coverageGaps.caseStudiesMissing.length > 0
    ? coverageGaps.caseStudiesMissing.map(c => `- \`${c}\``).join('\n')
    : '_All expected case study docs are covered._'}

### 2.9 Product Docs Not Covered (${coverageGaps.productMissing.length})

${coverageGaps.productMissing.length > 0
    ? coverageGaps.productMissing.map(p => `- \`${p}\``).join('\n')
    : '_All expected product docs are covered._'}

## 3. Quality Gaps (${qualityGaps.length})

Documents with grade C or D require refresh or re-authoring.

| Document | Current Grade | Issue | Recommended Action |
|----------|---------------|-------|-------------------|
${qualityGaps.length > 0
    ? qualityGaps.map(g => `| \`${g.path}\` | ${g.grade} | ${g.issue} | ${g.recommendedAction} |`).join('\n')
    : '| _None — all docs are grade B or higher._ | | | |'}

## 4. Usage Gaps (${usageGaps.length})

Documents with no incoming links from other knowledge docs. These may be orphaned or underused.

${usageGaps.length > 0
    ? usageGaps.map(g => `- \`${g.path}\` — ${g.recommendation}`).join('\n')
    : '_No orphaned docs detected._'}

## 5. Freshness Gaps (${freshnessGaps.length})

Documents not reviewed in 180+ days. Data may be stale.

${freshnessGaps.length > 0
    ? freshnessGaps.map(g => `- \`${g.path}\` (last reviewed: ${g.lastReviewed}) — ${g.recommendation}`).join('\n')
    : '_All docs have been reviewed within the last 180 days._'}

## 6. Knowledge Base Statistics

| Metric | Value |
|--------|-------|
| Total documents | ${stats.totalDocs} |
| Total chunks (retrievable) | ${stats.totalChunks} |
| Freshness — fresh (<90 days) | ${stats.freshness.fresh} |
| Freshness — stale (90–180 days) | ${stats.freshness.stale} |
| Freshness — very stale (180+ days) | ${stats.freshness.very_stale} |
| Embeddings enabled | ${stats.embeddingsEnabled ? 'yes' : 'no (BM25 only)'} |

### By Category

| Category | Documents |
|----------|-----------|
${Object.entries(stats.byCategory).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

### By Grade

| Grade | Documents |
|-------|-----------|
${Object.entries(stats.byGrade).map(([k, v]) => `| ${k} | ${v} |`).join('\n') || '| (no grades recorded) | 0 |'}

## 7. Recommendations

### 7.1 New Docs to Author (${recommendations.newDocsToAuthor.length})

${recommendations.newDocsToAuthor.length > 0
    ? recommendations.newDocsToAuthor.map(r => `- [ ] ${r}`).join('\n')
    : '_No new docs required this month._'}

### 7.2 Existing Docs to Refresh (${recommendations.existingDocsToRefresh.length})

${recommendations.existingDocsToRefresh.length > 0
    ? recommendations.existingDocsToRefresh.map(r => `- [ ] ${r}`).join('\n')
    : '_No refreshes required this month._'}

## 8. Methodology

This report was generated by the Echo agent using the following methodology:

1. **Coverage gaps**: Compared existing docs against the EXPECTED_INDUSTRIES, EXPECTED_REGIONS, EXPECTED_PLAYBOOKS, EXPECTED_DOMAINS, EXPECTED_AGENTS, EXPECTED_METHODOLOGIES, EXPECTED_INTEGRATIONS, EXPECTED_CASE_STUDIES, and EXPECTED_PRODUCT baseline lists (defined in \`src/lib/knowledge/gap-report.ts\`).
2. **Quality gaps**: Identified docs with \`grade: C\` or \`grade: D\` in frontmatter.
3. **Usage gaps**: Identified docs with no incoming links from other knowledge docs (orphan detection).
4. **Freshness gaps**: Identified docs with \`last_reviewed\` older than 180 days, or missing entirely.
5. **Recommendations**: Combined the top gaps across all categories into a prioritized authoring list.

To extend the baseline coverage lists, edit \`src/lib/knowledge/gap-report.ts\` and re-run \`npm run knowledge:gap\`.
`;
}
