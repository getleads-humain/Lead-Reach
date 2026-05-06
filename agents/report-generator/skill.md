# Echo — Report Generator Skills

> *"Every skill in Echo's arsenal transforms raw data into a deliverable someone can act on. No half-measures, no unvalidated numbers, no orphan charts."*

---

## Table of Contents

1. [Prospect Spreadsheet Generation](#1-prospect-spreadsheet-generation)
2. [Campaign Performance Report](#2-campaign-performance-report)
3. [Pipeline Health Dashboard Data](#3-pipeline-health-dashboard-data)
4. [Custom Data Export](#4-custom-data-export)
5. [CRM-Compatible Export](#5-crm-compatible-export)
6. [Scheduled Report Delivery](#6-scheduled-report-delivery)
7. [Data Formatting & Validation](#7-data-formatting--validation)
8. [Chart Generation](#8-chart-generation)
9. [LLM-Based Report Narrative](#9-llm-based-report-narrative)
10. [Execution Engine Integration](#10-execution-engine-integration)

---

## 1. Prospect Spreadsheet Generation

### Overview

The primary deliverable skill. Generates comprehensive XLSX or CSV spreadsheets containing all prospect data, KPIs, and metadata. This is the most frequently requested report type and must handle datasets from 50 to 50,000 leads efficiently.

### Trigger

| Condition | Description |
|---|---|
| User requests lead export | "Export all leads", "Download the prospect list" |
| Manual API dispatch | `POST /api/agents/execute` with `taskType: "report"` and report type |
| Scheduled report trigger | Cron-based weekly prospect list generation |
| Pipeline auto-trigger | Orchestrator creates a report task after outreach completion |
| CRM import preparation | User needs a spreadsheet to import into their CRM |

### Input Schema

```typescript
interface ProspectSpreadsheetInput {
  // Required
  reportType: 'PROSPECT_LIST';
  
  // Filters
  campaignId?: string;
  stages?: PipelineStage[];            // Filter by pipeline stages
  tiers?: string[];                    // Filter by lead tiers (hot, warm, cold)
  industries?: string[];               // Filter by industry
  dateRange?: {
    field: 'createdAt' | 'updatedAt' | 'discoveredAt' | 'enrichedAt';
    start: DateTime;
    end: DateTime;
  };
  icpScoreRange?: [number, number];   // Filter by ICP score range
  search?: string;                     // Text search across name, company, email
  
  // Format options
  format: 'XLSX' | 'CSV';
  includePII: boolean;                 // Whether to include PII fields
  piiHandling?: 'INCLUDE' | 'MASK' | 'EXCLUDE';
  
  // Column options
  columns?: string[];                  // Specific columns to include (default: all 34)
  sortBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;                      // Max rows (default: 10000)
  
  // Metadata
  requestedBy?: string;
  title?: string;                      // Custom report title
}
```

### Output Schema

```typescript
interface ProspectSpreadsheetOutput {
  // File information
  fileName: string;
  fileSize: number;                    // Bytes
  format: 'XLSX' | 'CSV';
  mimeType: string;
  buffer: Buffer;                      // File content
  
  // Report metadata
  metadata: {
    generatedAt: DateTime;
    generatedBy: 'Echo';
    templateVersion: string;
    dataAsOf: DateTime;
    reportTitle: string;
  };
  
  // Data summary
  summary: {
    totalRows: number;
    excludedRows: number;
    exclusionReasons: Array<{ reason: string; count: number }>;
    filtersApplied: Record<string, unknown>;
    columnsIncluded: string[];
  };
  
  // Data statistics
  statistics: {
    byStage: Record<string, number>;
    byTier: Record<string, number>;
    averageICPScore: number;
    averageEngagementScore: number;
    topIndustry: string;
    dateRange: { earliest: DateTime; latest: DateTime };
  };
}
```

### Method

```
Step 1:  Validate input parameters
         → Check required fields present
         → Validate campaignId exists (if provided)
         → Validate date ranges are logical (start < end)
         → Validate score ranges are within 0-100
         → Default missing optional parameters

Step 2:  Build Prisma query
         → Apply all filters to WHERE clause
         → Determine required includes (outreach, etc.)
         → Set ORDER BY (default: leadScore DESC)
         → Set TAKE limit

Step 3:  Execute database query
         → Run query with timeout protection (30s)
         → If timeout, retry with half the limit
         → If still timeout, return error with partial data

Step 4:  Validate and clean data
         → Apply VALIDATION_RULES to each row
         → Skip rows failing NOT_NULL rules (companyName, id)
         → Mark null values per NULL_HANDLING rules
         → Count exclusions by reason

Step 5:  Apply type coercion
         → Convert DateTime fields to display format
         → Convert numeric fields with proper formatting
         → Derive calculated fields (seniority, location, timezone, days_in_stage)
         → Apply PII handling rules (mask, exclude, or include)

Step 6:  Generate file
         → If XLSX: Use exceljs with full styling (see Format Conversion System)
         → If CSV: Use streaming CSV writer with proper escaping
         → Add title row, metadata row, header row, data rows, summary rows

Step 7:  Generate quality report
         → Calculate statistics (by stage, by tier, averages)
         → Verify row count matches expectations
         → Check for data anomalies (all scores 0, all same stage, etc.)

Step 8:  Return result
         → Package file buffer with metadata
         → Log generation metrics (time, rows, file size)
```

### Database Queries

```typescript
// Primary data query
const leads = await db.lead.findMany({
  where: {
    ...(campaignId ? { campaignId } : {}),
    ...(stages?.length ? { stage: { in: stages } } : {}),
    ...(tiers?.length ? { leadTier: { in: tiers } } : {}),
    ...(industries?.length ? { industry: { in: industries } } : {}),
    ...(icpScoreRange ? { leadScore: { gte: icpScoreRange[0], lte: icpScoreRange[1] } } : {}),
    ...(dateRange ? { [dateRange.field]: { gte: dateRange.start, lte: dateRange.end } } : {}),
    ...(search ? {
      OR: [
        { companyName: { contains: search } },
        { keyContactName: { contains: search } },
        { generalEmail: { contains: search } },
      ],
    } : {}),
  },
  include: {
    outreach: {
      orderBy: { createdAt: 'desc' },
      take: 1,
    },
  },
  orderBy: sortBy ? { [sortBy.field]: sortBy.direction.toLowerCase() } : { leadScore: 'desc' },
  take: limit || 10000,
});

// Campaign context (for metadata)
const campaign = campaignId
  ? await db.campaign.findUnique({ where: { id: campaignId } })
  : null;

// Statistics queries (parallel with main query)
const [stageCounts, tierCounts, avgScore] = await Promise.all([
  db.lead.groupBy({ by: ['stage'], where, _count: { stage: true } }),
  db.lead.groupBy({ by: ['leadTier'], where, _count: { leadTier: true } }),
  db.lead.aggregate({ where, _avg: { leadScore: true } }),
]);
```

### LLM Prompt

LLM is not used for data generation in Prospect Spreadsheets — all data comes directly from the database with deterministic transformations. LLM is only used for:

1. **Seniority classification** (if `keyContactTitle` is present):
```typescript
const seniorityPrompt = `Classify the following job title into a seniority level.
Title: "${title}"
Return ONLY one of: C-Suite, VP, Director, Manager, IC, Unknown`;
```

2. **Timezone derivation** (if city/country is present):
```typescript
// Uses a static lookup table, not LLM, for determinism
const TIMEZONE_MAP: Record<string, string> = {
  'United States': 'America/New_York',
  'United Kingdom': 'Europe/London',
  'United Arab Emirates': 'Asia/Dubai',
  // ... 50+ country mappings
};
```

### Format Specifications

**XLSX:**
- Sheet name: "Prospects" (or custom title)
- Title row: Merged cells A1:AH1, bold 14pt white on navy
- Metadata row: Merged cells A2:AH2, italic 9pt gray
- Header row: Bold 11pt white on navy, centered, wrapped
- Data rows: 10pt Calibri, alternating row colors
- Frozen panes: Row 4, Column C
- Auto-filter: All columns
- Conditional formatting: ICP score columns (green-yellow-red)
- Print: Landscape A4, repeating rows 1-3

**CSV:**
- UTF-8 with BOM
- Header row: Unquoted column names
- Data rows: Proper escaping per RFC 4180
- Null markers: "Not Available", "—", "N/A" per field type
- No styling (pure data exchange format)

### Error Handling

```typescript
try {
  // Main generation flow
  const data = await queryDatabase(filters);
  const validated = validateData(data);
  const formatted = formatData(validated);
  const file = await generateFile(formatted, format);
  return { success: true, output: file };
} catch (error) {
  if (error instanceof DatabaseTimeoutError) {
    // Retry with smaller limit
    const halfLimit = Math.floor((filters.limit || 10000) / 2);
    return generateWithLimit(filters, halfLimit);
  }
  if (error instanceof NoDataFoundError) {
    return {
      success: false,
      error: 'ECHO_001',
      message: 'No leads match your filter criteria. Try broadening your filters.',
    };
  }
  if (error instanceof FileGenerationError) {
    return {
      success: false,
      error: 'ECHO_009',
      message: 'Report generation failed during file creation. Please try again.',
    };
  }
  throw error;
}
```

### Example Output

```
File: Prospect_List_Q1-SaaS-2025_20250304.xlsx
Size: 2.1 MB
Rows: 342 leads (5 excluded)
Columns: 34 (A through AH)
Statistics:
  By Stage: NEW(0), ENRICHED(0), QUALIFIED(89), CONTACTED(112), ENGAGED(98), NEGOTIATING(43)
  By Tier: Hot(52), Warm(180), Cold(110)
  Avg ICP Score: 67.3
  Top Industry: Technology (42%)
Data as of: 2025-03-04T10:00:00Z
```

### Performance Targets

| Metric | Target |
|---|---|
| Generation time (< 1000 rows) | < 3 seconds |
| Generation time (1000-5000 rows) | < 8 seconds |
| Generation time (5000-10000 rows) | < 15 seconds |
| Cell accuracy | 99.99% |
| Null handling accuracy | 100% |
| File size per 1000 rows (XLSX) | ~500 KB |
| File size per 1000 rows (CSV) | ~150 KB |

---

## 2. Campaign Performance Report

### Overview

Generates a rich, narrative-driven PDF report on a specific campaign's performance. This is the most complex report type, combining aggregated metrics, multiple chart types, LLM-generated narrative, and actionable recommendations. Designed for sharing with leadership and stakeholders.

### Trigger

| Condition | Description |
|---|---|
| User requests campaign summary | "How did the Q1 SaaS campaign perform?" |
| Campaign completion trigger | Campaign status changes to "completed" |
| Scheduled report | Weekly/monthly campaign performance review |
| Executive briefing request | "I need a report for the board meeting" |

### Input Schema

```typescript
interface CampaignReportInput {
  reportType: 'CAMPAIGN_SUMMARY';
  campaignId: string;                  // Required — which campaign to report on
  dateRange?: {                        // Optional — override campaign date range
    start: DateTime;
    end: DateTime;
  };
  includeRecommendations: boolean;     // Whether to include LLM recommendations (default: true)
  includeCharts: boolean;              // Whether to generate charts (default: true)
  comparisonCampaignId?: string;       // Optional — compare with another campaign
  orientation?: 'portrait' | 'landscape'; // Page orientation (default: portrait)
}
```

### Output Schema

```typescript
interface CampaignReportOutput {
  fileName: string;
  fileSize: number;
  format: 'PDF';
  pageCount: number;
  chartCount: number;
  
  metadata: {
    generatedAt: DateTime;
    generatedBy: 'Echo';
    templateVersion: string;
    campaignName: string;
    campaignDuration: string;
    dataAsOf: DateTime;
  };
  
  content: {
    keyMetrics: CampaignKeyMetrics;
    stageDistribution: StageDistributionData;
    channelPerformance: ChannelPerformanceData;
    engagementAnalysis: EngagementAnalysisData;
    recommendations: LLMRecommendation[];
  };
}

interface CampaignKeyMetrics {
  totalLeads: number;
  enrichedLeads: number;
  qualifiedLeads: number;
  contactedLeads: number;
  engagedLeads: number;
  negotiatingLeads: number;
  closedWonLeads: number;
  enrichmentRate: number;
  qualificationRate: number;
  engagementRate: number;
  meetingRate: number;
  closeRate: number;
  pipelineValue: number;
  costPerLead: number | null;
  costPerQualifiedLead: number | null;
  avgTimeToContact: number | null;     // Days
  avgTimeToEngage: number | null;      // Days
  hotLeadCount: number;
  warmLeadCount: number;
  coldLeadCount: number;
}
```

### Method

```
Step 1:  Validate campaign exists
         → db.campaign.findUnique({ where: { id: campaignId } })
         → If not found, return error ECHO_007
         → Load campaign name, targetCriteria, date range

Step 2:  Aggregate campaign metrics
         → Query all leads for this campaign with counts by stage
         → Query all outreach for this campaign with status counts
         → Calculate conversion rates between stages
         → Calculate pipeline value (sum of deal values for NEGOTIATING+)

Step 3:  Generate charts (4-6 charts)
         → Pipeline Funnel chart (lead counts by stage)
         → Channel Performance bar chart (leads by discovery channel)
         → Stage Distribution pie/donut chart
         → Engagement Trend line chart (daily engagement over time)
         → Optional: Comparison chart (if comparisonCampaignId provided)

Step 4:  Generate LLM narrative (3 components)
         → Executive Summary (2-3 paragraphs)
         → Key Findings (5-8 bullet points)
         → Recommendations (5-8 items with priority and action)

Step 5:  Render HTML template
         → Load active Campaign Summary template
         → Populate template sections with data, charts, and narrative
         → Apply CSS styling for PDF rendering
         → Insert SVG charts as inline elements

Step 6:  Convert HTML to PDF
         → Launch Puppeteer headless browser
         → Set page content with rendered HTML
         → Apply page breaks, headers, footers
         → Generate PDF buffer

Step 7:  Post-generation validation
         → Verify PDF is valid (non-empty buffer)
         → Verify page count is within expected range (5-25 pages)
         → Verify all charts rendered (check for broken image placeholders)

Step 8:  Return result
         → Package PDF buffer with metadata
         → Log generation metrics
```

### Database Queries

```typescript
// Campaign details
const campaign = await db.campaign.findUnique({
  where: { id: campaignId },
});

// All leads with stage counts
const leads = await db.lead.findMany({
  where: { campaignId },
  include: {
    outreach: { orderBy: { createdAt: 'desc' } },
  },
});

// Stage distribution
const stageDistribution = await db.lead.groupBy({
  by: ['stage'],
  where: { campaignId },
  _count: { stage: true },
  _avg: { leadScore: true },
});

// Tier distribution
const tierDistribution = await db.lead.groupBy({
  by: ['leadTier'],
  where: { campaignId },
  _count: { leadTier: true },
});

// Outreach metrics
const outreachStats = await db.outreach.groupBy({
  by: ['status'],
  where: { lead: { campaignId } },
  _count: { status: true },
});

// Channel performance (from lead sources JSON field)
// Note: sources is a JSON string, so we process this in application code
const channelData = leads.reduce((acc, lead) => {
  const sources = JSON.parse(lead.sources || '[]');
  sources.forEach((source: string) => {
    acc[source] = (acc[source] || 0) + 1;
  });
  return acc;
}, {} as Record<string, number>);

// Daily engagement trend (last 30 days)
const dailyEngagement = await db.outreach.groupBy({
  by: ['channel'],
  where: {
    lead: { campaignId },
    sentAt: { gte: subDays(new Date(), 30) },
  },
  _count: { id: true },
});
```

### LLM Prompt

```typescript
const campaignSummaryPrompt = `You are an executive report writer for a B2B lead generation platform.
Write a professional, data-driven campaign performance summary.

Campaign: ${campaign.name}
Industry: ${campaign.targetIndustry || 'Not specified'}
Location: ${campaign.targetLocation || 'Not specified'}
Duration: ${formatDate(campaign.createdAt)} to present

Key Metrics:
- Total Leads: ${metrics.totalLeads}
- Enriched: ${metrics.enrichedLeads} (${metrics.enrichmentRate}%)
- Qualified: ${metrics.qualifiedLeads} (${metrics.qualificationRate}%)
- Contacted: ${metrics.contactedLeads} (${metrics.contactRate}%)
- Engaged: ${metrics.engagedLeads} (${metrics.engagementRate}%)
- Negotiating: ${metrics.negotiatingLeads}
- Closed-Won: ${metrics.closedWonLeads}
- Pipeline Value: ${formatCurrency(metrics.pipelineValue)}
- Hot Leads: ${metrics.hotLeadCount}
- Warm Leads: ${metrics.warmLeadCount}
- Cold Leads: ${metrics.coldLeadCount}

Outreach Stats:
- Emails Sent: ${outreach.emailsSent}
- Delivery Rate: ${outreach.deliveryRate}%
- Open Rate: ${outreach.openRate}%
- Reply Rate: ${outreach.replyRate}%

Stage Distribution:
${stageDistribution.map(s => `- ${s.stage}: ${s.count} leads`).join('\n')}

Write THREE sections:

1. EXECUTIVE SUMMARY (2-3 paragraphs)
   - Overall campaign assessment
   - Key performance highlights
   - Notable trends or anomalies

2. KEY FINDINGS (5-8 bullet points)
   - Data-supported observations
   - Conversion rate analysis
   - Channel effectiveness insights
   - Lead quality assessment

3. RECOMMENDATIONS (5-8 items, each with priority: HIGH/MEDIUM/LOW)
   - Specific, actionable suggestions
   - Based on the data, not generic advice
   - Include expected impact of each recommendation

Format each section clearly with headers. Be specific with numbers. Do not use
vague language like "good performance" — use actual rates and comparisons.`;

const narrativeResult = await callLLM(campaignSummaryPrompt, '');
```

### Format Specifications

**PDF structure (8-20 pages):**

| Page(s) | Content | Orientation |
|---|---|---|
| 1 | Title, key metrics grid, executive summary | Portrait |
| 2 | Pipeline funnel chart, conversion rates table | Portrait |
| 3 | Channel performance charts (bar + pie) | Landscape |
| 4 | Engagement trend chart, top engaged leads | Portrait |
| 5-6 | Detailed metrics tables | Landscape |
| 7 | Key findings and recommendations | Portrait |
| Appendix | Methodology, data notes, PII handling | Portrait |

**PDF styling:**
- Primary font: Inter or Calibri
- Heading size: 18pt bold (primary), 14pt bold (secondary), 12pt bold (tertiary)
- Body size: 10pt regular
- Table text: 9pt
- Colors: Primary navy (#1B3A5C), accent violet (#8B5CF6)
- Page margins: 20mm top/bottom, 15mm left/right
- Page numbers: Bottom center
- Header: Report title, left-aligned, 8pt gray
- Footer: Generation date + page number, 8pt gray

### Error Handling

| Error | Detection | Recovery |
|---|---|---|
| Campaign not found | `campaign === null` | Return error ECHO_007 with campaign ID |
| No leads in campaign | `leads.length === 0` | Generate minimal report with "No leads found" message |
| Chart rendering failure | SVG generation throws | Skip chart, add placeholder text, log warning |
| LLM narrative failure | `callLLM()` throws | Use boilerplate narrative: "Campaign generated [X] leads with [Y]% qualification rate." |
| PDF rendering failure | Puppeteer throws | Retry once; if still fails, return XLSX fallback |
| Buffer too large | File size > 50 MB | Compress images, reduce chart DPI, or split into multiple reports |

### Example Output

```
File: Campaign_Summary_Q1-SaaS-2025_20250304.pdf
Size: 3.4 MB
Pages: 8
Charts: 4 (Funnel, Bar, Pie, Line)
Generation time: 18.7s
  - Data aggregation: 12.3s
  - Chart rendering: 4.1s
  - LLM narrative: 1.8s
  - PDF conversion: 0.5s

Executive Summary excerpt:
"The Q1 SaaS 2025 campaign has generated 847 leads across 3 primary channels,
with an overall qualification rate of 43.2%. The pipeline currently holds
$4.38M in weighted value, with 52 leads classified as Hot tier..."
```

### Performance Targets

| Metric | Target |
|---|---|
| Total generation time | < 25 seconds |
| Data aggregation time | < 15 seconds |
| Chart rendering time (per chart) | < 2 seconds |
| LLM narrative time | < 5 seconds |
| PDF conversion time | < 3 seconds |
| PDF file size (typical) | 2-5 MB |
| Page count (typical) | 8-15 pages |

---

## 3. Pipeline Health Dashboard Data

### Overview

Generates real-time or snapshot pipeline health data for the dashboard frontend. This skill focuses on fast aggregation queries that feed the dashboard widgets. It is the most latency-sensitive report type — dashboard data must be generated in under 5 seconds.

### Trigger

| Condition | Description |
|---|---|
| Dashboard page load | User navigates to pipeline dashboard |
| Dashboard auto-refresh | Frontend polls every 5 minutes |
| API request | `GET /api/reports/pipeline-health` |
| Daily snapshot | Scheduled daily snapshot for trend tracking |

### Input Schema

```typescript
interface PipelineHealthInput {
  reportType: 'PIPELINE_HEALTH';
  campaignId?: string;                 // Optional — scope to single campaign
  includeForecasts: boolean;           // Include pipeline forecasts (default: true)
  includeAlerts: boolean;              // Include active alerts (default: true)
  includeStaleLeads: boolean;          // Include stale lead list (default: true)
  snapshot: boolean;                   // If true, save snapshot for trend comparison
}
```

### Output Schema

```typescript
interface PipelineHealthOutput {
  generatedAt: DateTime;
  snapshot: {
    totalActiveLeads: number;
    totalPipelineValue: number;
    weightedPipelineValue: number;
    averageICPScore: number;
    averageEngagementScore: number;
    activeAlerts: { critical: number; warning: number; info: number };
  };
  stageDistribution: Array<{
    stage: PipelineStage;
    count: number;
    percentage: number;
    value: number;
    averageAgeHours: number;
    maxAgeHours: number;
    staleCount: number;
  }>;
  conversionRates: Array<{
    from: PipelineStage;
    to: PipelineStage;
    rate: number;
    trend: 'UP' | 'DOWN' | 'FLAT';
    trendMagnitude: number;
    historicalAvg: number;
  }>;
  velocity: {
    current: { leadsPerWeek: number; revenuePerWeek: number };
    target: { leadsPerWeek: number; revenuePerWeek: number };
    trend: Array<{ week: string; leads: number; revenue: number }>;
  };
  forecast: {
    monthToDate: { actual: number; target: number; percentToTarget: number };
    monthEnd: { projected: number; target: number; probability: number };
  };
  alerts: Array<{
    id: string;
    type: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    leadId?: string;
    detectedAt: DateTime;
    actionRequired: string;
  }>;
  staleLeads?: Array<{
    leadId: string;
    companyName: string;
    stage: PipelineStage;
    daysInStage: number;
    icpScore: number;
    tier: string;
    assignedSDR?: string;
  }>;
}
```

### Method

```
Step 1:  Execute parallel aggregation queries
         → Stage distribution (COUNT by stage)
         → Tier distribution (COUNT by tier)
         → Average scores (AVG leadScore, AVG engagement)
         → Stale lead detection (leads past max dwell time per stage)

Step 2:  Calculate conversion rates
         → Stage-to-stage conversion from stage distribution counts
         → Compare with historical averages (stored from previous snapshots)
         → Determine trend (UP/DOWN/FLAT) based on 4-week comparison

Step 3:  Calculate pipeline velocity
         → Leads entering pipeline per week (last 8 weeks)
         → Revenue entering pipeline per week (last 8 weeks)
         → Compare current vs. target velocity

Step 4:  Generate forecasts (if includeForecasts = true)
         → Month-to-date: actual vs. target pipeline value
         → Month-end: linear projection based on velocity
         → Probability: based on historical close rates × pipeline composition

Step 5:  Detect alerts (if includeAlerts = true)
         → Stale leads (CRITICAL: >14 days in QUALIFIED, >7 days in ENGAGED)
         → Pipeline bottlenecks (WARNING: conversion rate < 50% at any stage)
         → Velocity drops (WARNING: velocity down > 20% vs. last week)
         → New high-value leads (INFO: new leads with ICP > 80)

Step 6:  Save snapshot (if snapshot = true)
         → Store current metrics for historical comparison
         → Used for trend calculations in future queries

Step 7:  Return JSON response
         → Full PipelineHealthOutput object
         → Target: < 5 seconds total
```

### Database Queries

```typescript
// Parallel aggregation queries for maximum speed
const [
  stageCounts,
  tierCounts,
  avgScores,
  outreachActivity,
  weeklyVelocity,
] = await Promise.all([
  // Stage distribution
  db.lead.groupBy({
    by: ['stage'],
    where: { ...(campaignId ? { campaignId } : {}), stage: { notIn: ['closed_won', 'closed_lost'] } },
    _count: { stage: true },
    _avg: { leadScore: true },
  }),

  // Tier distribution
  db.lead.groupBy({
    by: ['leadTier'],
    where: { ...(campaignId ? { campaignId } : {}) },
    _count: { leadTier: true },
  }),

  // Average scores
  db.lead.aggregate({
    where: { ...(campaignId ? { campaignId } : {}), stage: { notIn: ['closed_won', 'closed_lost'] } },
    _avg: { leadScore: true },
    _count: { id: true },
  }),

  // Outreach activity (last 30 days)
  db.outreach.groupBy({
    by: ['status'],
    where: {
      lead: { ...(campaignId ? { campaignId } : {}) },
      sentAt: { gte: subDays(new Date(), 30) },
    },
    _count: { status: true },
  }),

  // Weekly velocity (leads created per week, last 8 weeks)
  db.$queryRaw`
    SELECT 
      strftime('%Y-%W', createdAt) as week,
      COUNT(*) as leads,
      0 as revenue
    FROM Lead
    WHERE createdAt >= datetime('now', '-56 days')
    ${campaignId ? `AND campaignId = ${campaignId}` : ''}
    GROUP BY week
    ORDER BY week ASC
  `,
]);

// Stale lead detection
const staleLeads = await db.lead.findMany({
  where: {
    ...(campaignId ? { campaignId } : {}),
    stage: { in: ['qualified', 'contacted', 'engaged'] },
    updatedAt: { lt: subDays(new Date(), 14) },
  },
  select: {
    id: true,
    companyName: true,
    stage: true,
    leadScore: true,
    leadTier: true,
    updatedAt: true,
  },
  take: 20,
});
```

### LLM Prompt

LLM is **not used** for Pipeline Health data — all metrics are computed deterministically from database queries. This ensures:
1. Sub-5-second response times
2. Reproducible results
3. No LLM hallucination in metrics

LLM is optionally used for **alert context messages**:

```typescript
const alertContextPrompt = `Given these pipeline alerts, write a brief (1-sentence) action recommendation for each:

Alerts:
${alerts.map(a => `- [${a.severity}] ${a.message}`).join('\n')}

For each alert, provide a specific action the user should take.
Return JSON array: [{ "alertIndex": 0, "actionRequired": "..." }]`;
```

### Format Specifications

**JSON API response:**
- Content-Type: `application/json`
- Cache-Control: `max-age=300` (5 minutes for live dashboard)
- Response time: < 5 seconds
- Payload size: typically 5-50 KB

**PDF snapshot** (optional):
- Generated from same data as JSON
- Used for historical archiving or email delivery
- 2-3 pages, primarily tables and metrics grids

### Error Handling

```typescript
// If aggregation queries timeout, return partial data
try {
  const fullData = await executeAllQueries();
  return fullData;
} catch (error) {
  if (error instanceof DatabaseTimeoutError) {
    // Return whatever we got from completed queries
    return {
      ...partialData,
      _meta: { partial: true, message: 'Some metrics unavailable due to query timeout' },
    };
  }
  throw error;
}
```

### Example Output

```json
{
  "generatedAt": "2025-03-04T10:00:00Z",
  "snapshot": {
    "totalActiveLeads": 1247,
    "totalPipelineValue": 4380000,
    "weightedPipelineValue": 1752000,
    "averageICPScore": 64.2,
    "activeAlerts": { "critical": 2, "warning": 3, "info": 5 }
  },
  "stageDistribution": [
    { "stage": "new", "count": 342, "percentage": 27.4, "value": 0, "averageAgeHours": 18.5, "staleCount": 0 },
    { "stage": "enriched", "count": 289, "percentage": 23.2, "value": 0, "averageAgeHours": 36.2, "staleCount": 12 },
    { "stage": "qualified", "count": 231, "percentage": 18.5, "value": 0, "averageAgeHours": 72.4, "staleCount": 23 }
  ],
  "velocity": {
    "current": { "leadsPerWeek": 47, "revenuePerWeek": 285000 },
    "target": { "leadsPerWeek": 50, "revenuePerWeek": 300000 }
  }
}
```

### Performance Targets

| Metric | Target |
|---|---|
| Total response time | < 5 seconds |
| Database query time | < 3 seconds |
| Calculation time | < 1 second |
| Alert detection time | < 500ms |
| JSON payload size | < 100 KB |

---

## 4. Custom Data Export

### Overview

Enables flexible data export with user-defined field selection, filters, and format choice. This skill dynamically builds Prisma queries based on the user's configuration and supports all four output formats.

### Trigger

| Condition | Description |
|---|---|
| User requests specific fields | "Export just company name, email, and ICP score" |
| Ad-hoc analysis request | "I need a list of all warm leads from last month" |
| Integration export | "Export data for our data warehouse" |
| API-driven export | External system requests data via API |

### Input Schema

```typescript
interface CustomExportInput {
  reportType: 'CUSTOM_EXPORT';
  
  // Field selection
  fields: string[];                    // Which columns to include (from 34 available)
  
  // Filters
  filters: {
    campaignId?: string;
    stages?: PipelineStage[];
    tiers?: string[];
    industries?: string[];
    dateRange?: { field: string; start: DateTime; end: DateTime };
    icpScoreRange?: [number, number];
    engagementScoreRange?: [number, number];
    search?: string;
  };
  
  // Format
  format: 'XLSX' | 'CSV' | 'JSON' | 'PDF';
  
  // Options
  includeHeaders: boolean;             // Include column headers (default: true)
  includeMetadata: boolean;            // Include generation metadata (default: true)
  piiHandling: 'INCLUDE' | 'MASK' | 'EXCLUDE'; // PII handling policy
  sortBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;                      // Max rows (default: 10000, max: 100000)
  deduplication: boolean;              // Remove duplicate companies (default: true)
}
```

### Output Schema

```typescript
interface CustomExportOutput {
  fileName: string;
  fileSize: number;
  format: 'XLSX' | 'CSV' | 'JSON' | 'PDF';
  buffer: Buffer;
  
  metadata: {
    generatedAt: DateTime;
    generatedBy: 'Echo';
    fieldsRequested: string[];
    fieldsDelivered: string[];
    filtersApplied: Record<string, unknown>;
  };
  
  summary: {
    totalRows: number;
    excludedRows: number;
    duplicatesRemoved: number;
    piiFieldsMasked: string[];
  };
}
```

### Method

```
Step 1:  Validate field selection
         → Check all requested fields exist in column schema
         → Remove any fields that violate PII policy
         → If fields array is empty, use default set (exclude PII)

Step 2:  Build dynamic Prisma query
         → Map requested fields to database columns (select clause)
         → Apply all filters to where clause
         → Apply sort order
         → Apply row limit

Step 3:  Execute query with deduplication
         → If deduplication enabled, add companyName to GROUP BY
         → Keep the highest-scored lead per company

Step 4:  Apply PII handling
         → INCLUDE: Return PII fields as-is
         → MASK: Apply masking rules (j***@company.com, +1-***-***-0123)
         → EXCLUDE: Remove PII columns from output entirely

Step 5:  Generate output in requested format
         → XLSX: Full styling as per Prospect List
         → CSV: Stream-based with proper escaping
         → JSON: Schema-validated with metadata envelope
         → PDF: Simple tabular layout (no charts in custom export)

Step 6:  Return result with metadata
```

### Database Queries

```typescript
// Dynamic select based on requested fields
function buildSelectFromFields(fields: string[]): Record<string, boolean> {
  const FIELD_TO_COLUMN: Record<string, string> = {
    'leadId': 'id',
    'companyName': 'companyName',
    'keyContactName': 'keyContactName',
    'keyContactEmail': 'keyContactEmail',
    'keyContactTitle': 'keyContactTitle',
    'generalEmail': 'generalEmail',
    'industry': 'industry',
    'stage': 'stage',
    'leadScore': 'leadScore',
    'leadTier': 'leadTier',
    'city': 'city',
    'country': 'country',
    'website': 'website',
    'linkedinUrl': 'linkedinUrl',
    'phoneMain': 'phoneMain',
    'employeeCount': 'employeeCount',
    'revenueEstimate': 'revenueEstimate',
    'createdAt': 'createdAt',
    'updatedAt': 'updatedAt',
  };
  
  const select: Record<string, boolean> = { id: true }; // Always include ID
  for (const field of fields) {
    const column = FIELD_TO_COLUMN[field];
    if (column) select[column] = true;
  }
  return select;
}

// Execute with dynamic select and filters
const leads = await db.lead.findMany({
  where: buildWhereClause(filters),
  select: buildSelectFromFields(fields),
  orderBy: sortBy ? { [sortBy.field]: sortBy.direction.toLowerCase() } : { leadScore: 'desc' },
  take: limit || 10000,
});
```

### LLM Prompt

LLM is not used for Custom Data Export — this is a purely deterministic data transformation skill. The user specifies exactly what they want, and Echo delivers it precisely.

### Error Handling

| Error | Recovery |
|---|---|
| Invalid field name in `fields` | Remove invalid field, include warning in output metadata |
| All fields are PII and PII handling is EXCLUDE | Return error: "All requested fields contain PII and PII policy is EXCLUDE. Add non-PII fields or change PII policy." |
| Limit exceeds maximum (100,000) | Cap at 100,000 with warning |
| No results match filters | Generate empty file with headers + metadata noting 0 results |

### Performance Targets

| Metric | Target |
|---|---|
| Query + transform time (< 1000 rows) | < 2 seconds |
| Query + transform time (1000-10000 rows) | < 8 seconds |
| Query + transform time (> 10000 rows) | < 30 seconds |
| Field validation time | < 100ms |
| Format conversion overhead | < 20% of total time |

---

## 5. CRM-Compatible Export

### Overview

Generates CSV files with pre-built field mappings for popular CRMs (Salesforce, HubSpot, Pipedrive, Zoho). Handles field name translation, data type conversion, required field validation, and CRM-specific formatting rules.

### Trigger

| Condition | Description |
|---|---|
| User mentions CRM name | "Export for Salesforce" / "HubSpot import" |
| CRM integration request | API request with CRM target specified |
| Scheduled CRM sync | Nightly export to CRM |

### Input Schema

```typescript
interface CRMExportInput {
  reportType: 'CRM_EXPORT';
  targetCRM: 'salesforce' | 'hubspot' | 'pipedrive' | 'zoho' | 'custom';
  
  // Filters (same as Custom Export)
  filters: {
    campaignId?: string;
    stages?: PipelineStage[];
    tiers?: string[];
  };
  
  // CRM options
  customMapping?: CustomCRMMapping;    // For custom CRM
  includeCustomFields: boolean;        // Include Agent Reach custom fields (default: true)
  requiredFieldsOnly: boolean;         // Only CRM-required fields (default: false)
  deduplication: boolean;              // Remove duplicates (default: true)
  
  // PII
  piiHandling: 'INCLUDE' | 'MASK';    // CRM exports cannot EXCLUDE PII (that's the point)
}
```

### Output Schema

```typescript
interface CRMExportOutput {
  fileName: string;
  fileSize: number;
  format: 'CSV';                      // CRM exports are always CSV
  buffer: Buffer;
  
  metadata: {
    generatedAt: DateTime;
    targetCRM: string;
    mappingVersion: string;
    fieldCount: number;
    requiredFieldsStatus: Array<{
      field: string;
      populated: boolean;
      missingCount: number;
    }>;
  };
  
  summary: {
    totalRows: number;
    rowsWithAllRequiredFields: number;
    rowsWithMissingFields: number;
    missingFieldDetails: Record<string, number>;
    duplicatesRemoved: number;
  };
}
```

### Method

```
Step 1:  Load CRM field mapping template
         → Select mapping based on targetCRM
         → If custom, validate and load CustomCRMMapping
         → Verify mapping version is current

Step 2:  Build query with CRM-mapped fields
         → Determine which Agent Reach fields are needed based on mapping
         → Apply filters
         → Execute query

Step 3:  Apply field transformations
         → For each lead, apply CRM-specific transformations:
           - Split full name into first/last name
           - Convert employee count range to numeric midpoint
           - Map tier enum to CRM-specific picklist values
           - Format email arrays for Pipedrive [{value, primary}]
           - Add default values for required but empty fields

Step 4:  Validate CRM requirements
         → Check all required fields are populated
         → For missing required fields:
           - If default exists, apply it
           - If no default, flag the row with a warning
         → Count rows with missing required fields

Step 5:  Generate CSV with CRM headers
         → Use CRM-specific column names from mapping
         → Apply CRM-specific CSV formatting (e.g., Salesforce requires UTF-8 BOM)
         → No styling (CSV format)

Step 6:  Return with validation report
         → Include list of required fields and their population status
         → Flag rows that may fail CRM import
         → Suggest fixes for common issues
```

### Database Queries

Same as Custom Data Export, but with fields determined by the CRM mapping template rather than user selection.

### LLM Prompt

LLM is not used for CRM exports — field mappings are deterministic and pre-built. The transformations are rule-based, not language-model-based, to ensure import reliability.

### Field Mapping Examples

**Salesforce Lead Import CSV Header:**
```
Company,FirstName,LastName,Email,Title,Phone,Industry,NumberOfEmployees,Website,City,State,Country,Rating,Lead_Score__c,LinkedIn_URL__c,Description
```

**HubSpot Contact Import CSV Header:**
```
firstname,lastname,email,jobtitle,phone,company,industry,numberofemployees,website,city,state,country,lifecycle_stage,hs_lead_score
```

### Error Handling

| Error | Recovery |
|---|---|
| Unknown CRM name | Return error with list of supported CRMs |
| Custom mapping has invalid field references | Return error with list of invalid field names |
| > 50% rows missing required fields | Warn user: "Many records may fail import. Consider enriching leads first." |
| Duplicate company names | Keep highest-scored lead, log count of duplicates removed |

### Performance Targets

| Metric | Target |
|---|---|
| Field mapping load time | < 50ms |
| Transformation time per row | < 1ms |
| Total generation time (< 5000 rows) | < 5 seconds |
| CRM import success rate (estimated) | ≥ 95% for rows with all required fields |

---

## 6. Scheduled Report Delivery

### Overview

Manages cron-based report generation and delivery. Supports daily, weekly, monthly, and quarterly schedules with multiple delivery channels (email, Slack, dashboard, file download).

### Trigger

| Condition | Description |
|---|---|
| Cron schedule matches | Time-based trigger fires |
| Manual schedule creation | User creates a new schedule |
| Schedule modification | User updates an existing schedule |

### Input Schema

```typescript
interface ScheduledReportInput {
  scheduleId: string;
  reportType: ReportType;
  templateId: string;
  
  // Schedule
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  time: string;                        // HH:MM UTC
  timezone: string;                    // IANA timezone for display
  
  // Report configuration
  filters: ReportFilters;
  
  // Delivery
  deliveryChannels: Array<{
    type: 'email' | 'slack' | 'dashboard' | 'file_download';
    recipients: string[];
    format: 'XLSX' | 'CSV' | 'PDF' | 'JSON';
  }>;
}
```

### Output Schema

```typescript
interface ScheduledReportOutput {
  scheduleId: string;
  executedAt: DateTime;
  nextExecutionAt: DateTime;
  
  results: Array<{
    channel: string;
    success: boolean;
    fileName: string;
    fileSize: number;
    deliveredTo: string[];
    error?: string;
  }>;
  
  reportMetrics: {
    generationTime: number;            // Seconds
    dataRows: number;
    fileSize: number;
  };
}
```

### Method

```
Step 1:  Load schedule configuration
         → db.reportSchedule.findUnique({ where: { id: scheduleId } })
         → Verify schedule is active
         → Check if already executed this period (prevent duplicates)

Step 2:  Execute report generation
         → Call appropriate report skill based on reportType
         → Pass filters from schedule configuration
         → Use template from schedule

Step 3:  Deliver to each channel
         → Email: Attach report to email, send to recipients
         → Slack: Upload file to Slack channel
         → Dashboard: Store result for dashboard API to serve
         → File download: Generate signed download URL

Step 4:  Log execution
         → Record execution time, file size, delivery status
         → Update schedule's lastRunAt and nextRunAt
         → Store execution record for audit trail

Step 5:  Handle failures
         → If generation fails: Log error, notify schedule owner
         → If delivery fails: Retry once, then log and continue to next channel
         → Never block other channels if one fails
```

### LLM Prompt

LLM is not used for schedule management — scheduling and delivery are purely operational tasks. LLM is used within the generated report's narrative (see Skill 9).

### Error Handling

| Error | Recovery |
|---|---|
| Schedule not found | Log error, skip execution |
| Report generation fails | Log error, send notification email to schedule owner |
| Email delivery fails | Retry once; if still fails, log and continue |
| Slack delivery fails | Retry once; if still fails, log and continue |
| All delivery channels fail | Mark schedule as "delivery_failed", alert admin |
| Duplicate execution detected | Skip execution, log warning |

### Performance Targets

| Metric | Target |
|---|---|
| Schedule load time | < 100ms |
| Report generation time | Per report type targets |
| Delivery time per channel | < 5 seconds |
| End-to-end scheduled execution | < 60 seconds |
| Delivery success rate | ≥ 98% |

---

## 7. Data Formatting & Validation

### Overview

The foundational skill that runs before all report generation. Ensures data is clean, properly typed, consistently formatted, and free of common data quality issues. Every other skill depends on this one for data integrity.

### Trigger

| Condition | Description |
|---|---|
| Before any report generation | Always runs as first step in the pipeline |
| Data quality audit | User requests data validation check |
| Pre-import validation | Before CRM export, validate data quality |

### Input Schema

```typescript
interface DataValidationInput {
  rawData: Lead[];                     // Raw database results
  reportType: ReportType;              // Which report is being generated
  piiPolicy: 'INCLUDE' | 'MASK' | 'EXCLUDE';
  locale: string;                      // For date/number formatting (default: 'en-US')
  strictMode: boolean;                 // If true, skip rows with any validation failure
}
```

### Output Schema

```typescript
interface DataValidationOutput {
  validatedData: Lead[];               // Cleaned, formatted data
  excludedRows: Array<{
    index: number;
    leadId: string;
    reason: string;
    rule: string;
  }>;
  warnings: Array<{
    index: number;
    leadId: string;
    field: string;
    issue: string;
    resolution: string;
  }>;
  statistics: {
    inputRows: number;
    outputRows: number;
    excludedRows: number;
    warningsCount: number;
    nullFieldCounts: Record<string, number>;
    typeCoercionCounts: Record<string, number>;
  };
}
```

### Method

```
Step 1:  Type coercion
         → Convert Prisma types to report display types
         → DateTime → formatted string ("YYYY-MM-DD HH:MM")
         → Float → currency string ("$48,000")
         → Float → percentage string ("85.0%")
         → Int → formatted number ("1,234")
         → Boolean → display string ("✓" / "✗")
         → Enum → display name ("closed_won" → "Closed-Won")
         → null → null marker per field rules

Step 2:  Format standardization
         → Email: lowercase, trim whitespace
         → URL: ensure protocol prefix (https://)
         → Phone: standardize format (+1-XXX-XXX-XXXX)
         → Company name: trim, title case
         → Industry: standardize capitalization
         → Location: "City, State, Country" format

Step 3:  Null handling
         → Check each field against null marker rules
         → Apply field-specific null markers:
           - Email: "Not Available"
           - Phone: "—"
           - Revenue: "N/A"
           - Score: 0 (numeric default)
           - Date: "—"

Step 4:  Range validation
         → ICP scores: 0-100
         → Engagement scores: 0-100
         → Deal values: 0-100,000,000
         → Employee counts: valid range strings
         → Dates: not in future, not before 2000-01-01

Step 5:  Duplicate detection
         → Check for duplicate companyName + website combinations
         → Flag duplicates (don't auto-remove unless deduplication enabled)
         → Report duplicate count

Step 6:  PII handling
         → If INCLUDE: Pass through PII fields unchanged
         → If MASK: Apply masking rules per PII category
         → If EXCLUDE: Remove PII fields from output

Step 7:  Return validated data with quality report
```

### Validation Rules Detail

```typescript
const VALIDATION_RULES: ValidationRule[] = [
  // Required fields
  { field: 'id', rule: 'NOT_NULL', onFail: 'SKIP_ROW' },
  { field: 'companyName', rule: 'NOT_NULL', onFail: 'SKIP_ROW' },
  { field: 'createdAt', rule: 'NOT_NULL', onFail: 'SKIP_ROW' },
  { field: 'stage', rule: 'NOT_NULL', onFail: 'SKIP_ROW' },
  
  // Type checks
  { field: 'stage', rule: 'TYPE_CHECK', params: { type: 'PipelineStage' }, onFail: 'SKIP_ROW' },
  { field: 'leadTier', rule: 'TYPE_CHECK', params: { type: 'LeadTier' }, onFail: 'DEFAULT_VALUE', defaultValue: 'unqualified' },
  
  // Range checks
  { field: 'leadScore', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  { field: 'firmographicScore', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  { field: 'intentScore', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  { field: 'reachabilityScore', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  { field: 'strategicScore', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  { field: 'dataCompleteness', rule: 'RANGE_CHECK', params: { min: 0, max: 100 }, onFail: 'DEFAULT_VALUE', defaultValue: 0 },
  
  // Format checks
  { field: 'generalEmail', rule: 'REGEX_MATCH', params: { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ }, onFail: 'MARK_NULL' },
  { field: 'keyContactEmail', rule: 'REGEX_MATCH', params: { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ }, onFail: 'MARK_NULL' },
  { field: 'website', rule: 'REGEX_MATCH', params: { pattern: /^https?:\/\/.+/ }, onFail: 'LOG_WARNING' },
];
```

### PII Masking Rules

```typescript
function maskPII(value: string, fieldType: string): string {
  switch (fieldType) {
    case 'email':
      const [local, domain] = value.split('@');
      return `${local[0]}***@${domain}`;
    
    case 'phone':
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 10) {
        return `+${digits[0]}-***-***-${digits.slice(-4)}`;
      }
      return '***-***-' + digits.slice(-4);
    
    case 'name':
      const parts = value.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}. ${parts[parts.length - 1]}`;
      }
      return `${parts[0][0]}.`;
    
    case 'url':
      return '[Redacted]';
    
    default:
      return '[Redacted]';
  }
}
```

### Error Handling

| Error | Recovery |
|---|---|
| All rows fail validation | Return empty dataset with detailed exclusion report |
| Type coercion produces NaN | Replace with 0 and add warning |
| Date in the future | Replace with current date and add warning |
| Invalid email format | Mark as null ("Not Available") |
| Duplicate detection fails | Skip deduplication, log warning |

### Performance Targets

| Metric | Target |
|---|---|
| Validation time per row | < 1ms |
| Total validation time (1000 rows) | < 500ms |
| Total validation time (10000 rows) | < 3 seconds |
| Type coercion accuracy | 100% |
| Null handling accuracy | 100% |

---

## 8. Chart Generation

### Overview

Generates professional charts for PDF reports and dashboard data. Supports bar charts, pie/donut charts, funnel charts, line/trend charts, and heatmaps. All charts are generated as SVG for PDF embedding and 300 DPI PNG for XLSX embedding.

### Trigger

| Condition | Description |
|---|---|
| Campaign Summary report generation | Requires 4-6 charts |
| Pipeline Health PDF snapshot | Requires 2-3 charts |
| User requests specific visualization | "Show me a chart of leads by stage" |

### Input Schema

```typescript
interface ChartGenerationInput {
  charts: Array<{
    type: 'bar' | 'pie' | 'funnel' | 'line' | 'heatmap';
    title: string;
    data: ChartData;
    config: ChartConfig;
    outputFormat: 'svg' | 'png' | 'both';
  }>;
}

interface ChartData {
  labels: string[];
  values: number[];
  secondaryValues?: number[];          // For dual-axis charts
  categories?: string[];               // For grouped bar charts
}

interface ChartConfig {
  dimensions: { width: number; height: number };
  colors?: string[];
  showLegend: boolean;
  showDataLabels: boolean;
  showGridLines: boolean;
  axisLabels?: { x?: string; y?: string };
  smoothing?: boolean;                 // For line charts
  innerRadius?: number;                // For donut charts (0-0.5)
  centerLabel?: string;                // For donut charts
}
```

### Output Schema

```typescript
interface ChartGenerationOutput {
  charts: Array<{
    type: string;
    title: string;
    svg?: string;                       // SVG string for PDF
    pngBase64?: string;                 // Base64 PNG for XLSX
    dimensions: { width: number; height: number };
    fileSize: { svg: number; png: number };
  }>;
  generationTime: number;              // Total milliseconds
}
```

### Method

```
Step 1:  Prepare chart data
         → Validate data arrays are non-empty
         → Sort data as appropriate for chart type
         → Calculate totals, percentages, rates
         → Format labels for display

Step 2:  Build ECharts configuration
         → Map chart type to ECharts option structure
         → Apply color scheme (colorblind-friendly blue-orange palette)
         → Set dimensions, margins, padding
         → Configure axes, legends, tooltips, data labels
         → Add title with proper font size and positioning

Step 3:  Render chart
         → If SVG output: Render via ECharts SVG renderer
         → If PNG output: Render via ECharts Canvas renderer at 300 DPI
         → If both: Render SVG first, then PNG from same config

Step 4:  Post-process
         → SVG: Optimize (remove metadata, minify)
         → PNG: Compress with PNGQuant for smaller file size
         → Verify chart renders correctly (non-empty output)

Step 5:  Return chart assets
```

### Chart Configuration Templates

#### Funnel Chart (Pipeline)

```typescript
function buildFunnelConfig(data: StageDistribution[]): EChartsOption {
  return {
    title: { text: 'Pipeline Funnel', left: 'center', textStyle: { fontSize: 14, fontWeight: 'bold' } },
    series: [{
      type: 'funnel',
      data: data.map(s => ({ name: s.stage, value: s.count })),
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside', formatter: '{b}: {c}' },
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
    }],
    color: ['#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1565C0', '#0D47A1'],
  };
}
```

#### Bar Chart (Channel Performance)

```typescript
function buildBarConfig(data: ChannelMetrics[]): EChartsOption {
  return {
    title: { text: 'Leads by Channel', left: 'center', textStyle: { fontSize: 14, fontWeight: 'bold' } },
    tooltip: { trigger: 'axis' },
    legend: { top: 30, data: ['Discovered', 'Engaged', 'Meetings'] },
    xAxis: { type: 'category', data: data.map(d => d.channel) },
    yAxis: { type: 'value', name: 'Count' },
    series: [
      { name: 'Discovered', type: 'bar', data: data.map(d => d.discovered), color: '#42A5F5' },
      { name: 'Engaged', type: 'bar', data: data.map(d => d.engaged), color: '#66BB6A' },
      { name: 'Meetings', type: 'bar', data: data.map(d => d.meetings), color: '#FFA726' },
    ],
    grid: { left: 60, right: 20, top: 60, bottom: 40 },
  };
}
```

### Error Handling

| Error | Recovery |
|---|---|
| ECharts rendering fails | Return placeholder SVG with "Chart unavailable" text |
| Data arrays empty | Return placeholder SVG with "No data available" text |
| SVG too large (> 1 MB) | Simplify chart (remove data labels, reduce points) |
| PNG rendering fails | Use SVG only, skip PNG for XLSX |

### Performance Targets

| Metric | Target |
|---|---|
| Chart generation time (per chart) | < 2 seconds |
| SVG file size (typical) | < 100 KB |
| PNG file size at 300 DPI (typical) | < 500 KB |
| Chart rendering success rate | ≥ 99% |
| Colorblind accessibility | All charts pass deuteranopia/protanopia simulation |

---

## 9. LLM-Based Report Narrative

### Overview

Uses the LLM (z-ai-web-dev-sdk) to generate executive summaries, key findings, and actionable recommendations for PDF reports. The LLM is used as a narrative layer on top of deterministic data — it never generates numbers, only interprets them.

### Trigger

| Condition | Description |
|---|---|
| Campaign Summary PDF generation | Needs executive summary, findings, recommendations |
| Outreach Report PDF generation | Needs performance analysis and improvement suggestions |
| User requests AI insights | "What should I focus on this week?" |
| Scheduled report with narrative | Weekly/monthly reports include LLM narrative |

### Input Schema

```typescript
interface NarrativeGenerationInput {
  reportType: 'CAMPAIGN_SUMMARY' | 'OUTREACH_REPORT';
  metrics: CampaignKeyMetrics | OutreachKeyMetrics;
  stageDistribution: StageDistributionData;
  channelPerformance?: ChannelPerformanceData;
  engagementData?: EngagementAnalysisData;
  previousPeriodComparison?: ComparisonData;  // For trend analysis
  narrativeTone: 'executive' | 'analytical' | 'actionable';
  maxLength: number;                   // Maximum words per section
}
```

### Output Schema

```typescript
interface NarrativeGenerationOutput {
  executiveSummary: string;            // 2-3 paragraphs
  keyFindings: Array<{
    finding: string;                   // The observation
    supportingData: string;            // Which metric supports this
    significance: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    recommendation: string;            // What to do
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    expectedImpact: string;            // What will happen if acted upon
    supportingData: string;            // Which metric supports this
  }>;
  generatedAt: DateTime;
  tokenUsage: { prompt: number; completion: number };
}
```

### Method

```
Step 1:  Prepare data summary for LLM
         → Convert all metrics to human-readable format
         → Calculate period-over-period changes
         → Identify top 3 positive and top 3 negative trends
         → Structure data for clear LLM consumption

Step 2:  Build LLM prompt
         → Use report-type-specific prompt template
         → Include all relevant metrics in structured format
         → Specify output format (JSON with defined schema)
         → Set tone and length constraints

Step 3:  Call LLM via z-ai-web-dev-sdk
         → callLLMForJSON() with structured prompt
         → Temperature: 0.3 (low creativity, high accuracy)
         → Max tokens: 2000 (sufficient for all sections)
         → Retry up to 2 times on failure

Step 4:  Validate LLM output
         → Verify all required sections present
         → Verify recommendations are specific, not generic
         → Check that no fabricated numbers appear in narrative
         → Verify JSON structure matches output schema

Step 5:  Apply safety filters
         → Remove any PII that LLM may have included
         → Remove any competitor names mentioned
         → Ensure recommendations are professional and appropriate

Step 6:  Return structured narrative
```

### LLM Prompt

```typescript
const campaignNarrativePrompt = `You are an executive report writer for a B2B lead generation platform called Agent Reach.
You write professional, data-driven campaign performance summaries.

CRITICAL RULES:
1. NEVER fabricate numbers — only use the metrics provided below
2. NEVER use vague language like "good performance" — use actual rates
3. NEVER mention competitor names or specific sales targets
4. ALWAYS be specific with recommendations — not generic advice
5. ALWAYS tie recommendations to specific data points

Campaign Data:
- Name: ${campaign.name}
- Total Leads: ${metrics.totalLeads}
- Enrichment Rate: ${metrics.enrichmentRate}%
- Qualification Rate: ${metrics.qualificationRate}%
- Engagement Rate: ${metrics.engagementRate}%
- Close Rate: ${metrics.closeRate}%
- Pipeline Value: $${metrics.pipelineValue.toLocaleString()}
- Hot Leads: ${metrics.hotLeadCount} | Warm: ${metrics.warmLeadCount} | Cold: ${metrics.coldLeadCount}

Stage Distribution:
${stageDistribution.map(s => `- ${s.stage}: ${s.count} (${s.percentage}%)`).join('\n')}

Outreach Stats:
- Emails Sent: ${outreach.emailsSent}
- Delivery Rate: ${outreach.deliveryRate}%
- Open Rate: ${outreach.openRate}%
- Reply Rate: ${outreach.replyRate}%

${previousPeriodComparison ? `Period-over-Period Changes:
- Leads: ${comparison.leadsChange > 0 ? '+' : ''}${comparison.leadsChange}%
- Qualification Rate: ${comparison.qualRateChange > 0 ? '+' : ''}${comparison.qualRateChange}%
- Engagement Rate: ${comparison.engRateChange > 0 ? '+' : ''}${comparison.engRateChange}%` : ''}

Return a JSON object with exactly this structure:
{
  "executiveSummary": "2-3 paragraph summary of campaign performance",
  "keyFindings": [
    {
      "finding": "Specific observation about the data",
      "supportingData": "Which metric supports this finding",
      "significance": "high" | "medium" | "low"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Specific action to take",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "expectedImpact": "What will happen if this is acted upon",
      "supportingData": "Which metric supports this recommendation"
    }
  ]
}

Write 5-8 key findings and 5-8 recommendations. Be specific and data-driven.`;
```

### Output Validation

```typescript
function validateNarrativeOutput(output: NarrativeGenerationOutput): boolean {
  // Check required sections exist
  if (!output.executiveSummary || output.executiveSummary.length < 100) return false;
  if (!output.keyFindings || output.keyFindings.length < 3) return false;
  if (!output.recommendations || output.recommendations.length < 3) return false;
  
  // Check no fabricated numbers
  const numberPattern = /\d+\.?\d*%/;
  const narrativeText = JSON.stringify(output);
  // Validate any percentage in narrative matches a metric we provided
  // (simplified check — production would be more thorough)
  
  // Check recommendations are specific enough
  const genericPhrases = ['improve performance', 'increase engagement', 'optimize process'];
  for (const rec of output.recommendations) {
    if (genericPhrases.some(p => rec.recommendation.toLowerCase().includes(p))) {
      console.warn('[Echo] Generic recommendation detected:', rec.recommendation);
    }
  }
  
  return true;
}
```

### Error Handling

| Error | Recovery |
|---|---|
| LLM timeout | Use boilerplate narrative with raw metrics |
| LLM returns invalid JSON | Retry with forced-JSON prompt (2 attempts) |
| LLM returns fabricated numbers | Strip all numbers from narrative, use only text |
| Narrative too short | Regenerate with explicit length requirement |
| Narrative too long | Truncate to maxLength, preserving structure |

**Fallback boilerplate narrative:**
```typescript
const BOILERPLATE_SUMMARY = `The ${campaign.name} campaign has generated ${metrics.totalLeads} leads with a qualification rate of ${metrics.qualificationRate}%. The current pipeline holds ${metrics.hotLeadCount} hot leads and ${metrics.warmLeadCount} warm leads, representing a total pipeline value of $${metrics.pipelineValue.toLocaleString()}. Engagement rate stands at ${metrics.engagementRate}%, with ${metrics.closedWonLeads} leads closed-won to date.`;
```

### Example Output

```json
{
  "executiveSummary": "The Q1 SaaS 2025 campaign has demonstrated strong lead generation with 847 total leads, achieving a 43.2% qualification rate. The pipeline currently holds $4.38M in weighted value, with the enrichment-to-qualification conversion (79.9%) outperforming the platform average. However, the contacted-to-engaged conversion (75.3%) suggests room for improvement in outreach messaging. The 52 hot-tier leads represent immediate revenue potential that should be prioritized for accelerated follow-up.",
  "keyFindings": [
    {
      "finding": "Enrichment-to-qualification conversion of 79.9% exceeds the 65% platform benchmark",
      "supportingData": "Qualification rate: 79.9% (28 qualified out of 84 enriched)",
      "significance": "high"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Prioritize the 52 hot-tier leads for same-day follow-up to prevent pipeline stall",
      "priority": "HIGH",
      "expectedImpact": "Estimated 15-20% improvement in engaged-to-negotiating conversion",
      "supportingData": "52 hot leads currently in pipeline, avg days in stage: 3.2"
    }
  ]
}
```

### Performance Targets

| Metric | Target |
|---|---|
| LLM call time | < 5 seconds |
| Token usage (prompt) | < 1500 tokens |
| Token usage (completion) | < 1000 tokens |
| Narrative quality (user rating) | ≥ 4/5 |
| Fabricated number rate | 0% |
| Fallback rate | < 5% |

---

## 10. Execution Engine Integration

### Overview

Documents how Echo integrates with the Agent Execution Engine — the runtime system that dispatches tasks to agents, manages progress tracking, and handles results.

### Trigger

| Condition | Description |
|---|---|
| API dispatch | `POST /api/agents/execute` with `agentName: "report-generator"` |
| Orchestrator delegation | Atlas creates a report task as part of a multi-agent workflow |
| AI chat intent | User message parsed as report request via `/api/ai` |
| Scheduled trigger | Cron-based execution from schedule configuration |

### Input Schema

```typescript
// From agent-executor.ts
interface AgentExecutionContext {
  taskId: string;
  agentName: 'report-generator';
  taskType: 'report';
  campaignId: string | null;
  input: Record<string, unknown>;
  priority: number;                    // 1-10, 10 highest
}
```

### Output Schema

```typescript
// From agent-executor.ts
interface AgentExecutionResult {
  success: boolean;
  output: {
    reportType: ReportType;
    fileName: string;
    fileSize: number;
    format: string;
    pageCount?: number;                // PDF only
    chartCount?: number;               // PDF only
    rowCount?: number;                 // XLSX/CSV only
    generationTimeMs: number;
    dataAsOf: DateTime;
  };
  channelActivity: ChannelActivityRecord[];  // Empty for Echo (no Agent-Reach calls)
  error?: string;
}
```

### Method

```typescript
async function executeReportGenerator(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input, campaignId } = ctx;
  const startTime = Date.now();
  
  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');
    
    // Step 1: Determine report type from input
    const reportType = (input.reportType as ReportType) || 
      await determineReportType(input); // LLM-based intent parsing if not explicit
    
    // Step 2: Build report configuration from input
    const config = buildReportConfig(reportType, input, campaignId);
    
    await updateTaskProgress(ctx.taskId, 20, 'running');
    
    // Step 3: Execute the appropriate report skill
    let result: ReportOutput;
    switch (reportType) {
      case 'PROSPECT_LIST':
        result = await generateProspectSpreadsheet(config);
        break;
      case 'CAMPAIGN_SUMMARY':
        result = await generateCampaignSummary(config);
        break;
      case 'PIPELINE_HEALTH':
        result = await generatePipelineHealth(config);
        break;
      case 'LEAD_SCORE':
        result = await generateLeadScoreReport(config);
        break;
      case 'OUTREACH_REPORT':
        result = await generateOutreachReport(config);
        break;
      case 'CUSTOM_EXPORT':
        result = await generateCustomExport(config);
        break;
      case 'CRM_EXPORT':
        result = await generateCRMExport(config);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
    
    await updateTaskProgress(ctx.taskId, 90, 'running');
    
    // Step 4: Store result
    // Report files are stored in the file system and referenced by filename
    const generationTime = Date.now() - startTime;
    
    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      reportType,
      fileName: result.fileName,
      fileSize: result.fileSize,
      format: result.format,
      generationTimeMs: generationTime,
    });
    
    return {
      success: true,
      output: {
        reportType,
        fileName: result.fileName,
        fileSize: result.fileSize,
        format: result.format,
        pageCount: result.pageCount,
        chartCount: result.chartCount,
        rowCount: result.rowCount,
        generationTimeMs: generationTime,
        dataAsOf: new Date().toISOString(),
      },
      channelActivity, // Always empty — Echo has no Agent-Reach Bridge calls
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}
```

### API Dispatch

**Direct API call:**

```bash
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "report-generator",
  "taskType": "report",
  "campaignId": "clx_abc123",
  "input": {
    "reportType": "CAMPAIGN_SUMMARY",
    "campaignId": "clx_abc123",
    "format": "PDF"
  }
}
```

**Via AI Chat:**

```bash
POST /api/ai
{ "message": "Generate a campaign report for Q1 SaaS 2025" }
```

The AI system parses the intent → determines report type → dispatches to Echo → Echo generates report → Report is stored and download link is returned.

### Agent-Reach Bridge Functions Used

**None.** Echo operates exclusively on database operations and LLM analysis. It does not search the web, read websites, or access any Agent-Reach channels.

| Function | Used By Echo? | Reason |
|---|---|---|
| `exaSearch()` | No | Echo uses pre-collected data, not live search |
| `webRead()` | No | No need to read web pages for report generation |
| `linkedInGetProfile()` | No | LinkedIn data is already in the database |
| `linkedInSearchPeople()` | No | No search needed for report generation |
| `linkedInSearchCompanies()` | No | No search needed for report generation |
| `twitterSearch()` | No | No search needed for report generation |
| `githubSearchRepos()` | No | No search needed for report generation |
| `redditSearch()` | No | No search needed for report generation |
| `youtubeSearch()` | No | No search needed for report generation |
| `rssRead()` | No | No search needed for report generation |
| `discoverBusinesses()` | No | No discovery needed for report generation |
| `enrichCompanyData()` | No | Enrichment already performed by Data Enrichment agent |

### Database Operations

Echo heavily uses the Prisma database for all data queries:

| Operation | Usage | Frequency |
|---|---|---|
| `db.lead.findMany()` | Query leads for reports | Every report |
| `db.lead.count()` | Count leads by stage/tier | Dashboard, summaries |
| `db.lead.groupBy()` | Aggregate by stage, tier, industry | Dashboard, summaries |
| `db.lead.aggregate()` | Average scores, sum values | Dashboard, summaries |
| `db.campaign.findUnique()` | Load campaign details | Campaign reports |
| `db.outreach.findMany()` | Query outreach history | Outreach reports |
| `db.outreach.groupBy()` | Aggregate outreach by status | Outreach reports |
| `db.agentTask.update()` | Update task progress | Every execution |

### LLM Usage

| Report Type | LLM Used? | Purpose |
|---|---|---|
| Prospect List | Minimal | Seniority classification from job title |
| Campaign Summary | Yes | Executive summary, key findings, recommendations |
| Pipeline Health | Optional | Alert context messages |
| Lead Score | No | Purely deterministic |
| Outreach Report | Yes | Performance analysis, improvement suggestions |
| Custom Export | No | Purely deterministic |
| CRM Export | No | Purely deterministic |

### Progress Tracking

Echo updates task progress at key milestones:

| Progress | Status | Milestone |
|---|---|---|
| 10% | running | Report type determined, config built |
| 20% | running | Database query started |
| 50% | running | Data aggregation complete |
| 70% | running | Charts generated (if applicable) |
| 80% | running | LLM narrative generated (if applicable) |
| 90% | running | File generated |
| 100% | completed | Report stored and ready for download |
| 0% | failed | Error occurred |

### Error Recovery

```typescript
// From agent-executor.ts — Echo-specific error handling
async function executeReportGenerator(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  try {
    // ... main flow
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    
    // Classify error for user-friendly message
    if (msg.includes('timeout')) {
      return {
        success: false,
        output: { error: 'ECHO_002', message: 'Report generation timed out. Try a smaller date range.' },
        channelActivity: [],
        error: msg,
      };
    }
    if (msg.includes('No leads')) {
      return {
        success: false,
        output: { error: 'ECHO_001', message: 'No leads match your filter criteria.' },
        channelActivity: [],
        error: msg,
      };
    }
    
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity: [], error: msg };
  }
}
```

### Performance Targets

| Metric | Target |
|---|---|
| End-to-end execution time (Prospect List) | < 15 seconds |
| End-to-end execution time (Campaign Summary) | < 25 seconds |
| End-to-end execution time (Pipeline Health) | < 5 seconds |
| Task progress update frequency | Every 10-20% progress |
| Error rate | < 1% |
| LLM call success rate | ≥ 95% |
