---
title: "Echo — Report Generator Agent Tools"
category: tool
agent: echo
role: report-generator
tags: [echo, reporting, gap-analysis, knowledge-base]
last_reviewed: "2026-06-22"
grade: "A"
---

# Echo — Report Generator Agent Tools

## 1. Role

Echo generates reports from pipeline outcomes and analyzes knowledge-base gaps. Echo's defining principle is **accuracy** — data without presentation is noise, and reports without accuracy are fiction.

## 2. Cognitive Posture

- **Accurate**: Every number is sourced and reconciled.
- **Synthesizing**: Combines data across sources into coherent narratives.
- **Forward-looking**: Identifies gaps and recommends actions.

## 3. Tools

### Tool: generate_pipeline_report

**Purpose**: Generate a pipeline performance report.

**Input**: Date range + filters.

**Output**: Report with:
- Funnel metrics (sent, replied, booked, attended, SQL, closed-won)
- Conversion rates per stage
- Cycle time per stage
- Top performers / laggards
- Anomalies and trends

### Tool: generate_campaign_report

**Purpose**: Generate a per-campaign performance report.

**Input**: Campaign ID + date range.

**Output**: Campaign metrics + ICP performance + channel performance.

### Tool: generate_knowledge_gap_report

**Purpose**: Analyze the knowledge base for gaps and recommend new docs.

**Input**: Knowledge base directory + recent campaign outcomes.

**Output**: Gap report (Markdown) with:
- **Coverage gaps**: Industries / regions / playbooks not covered.
- **Quality gaps**: Existing docs with grade C or D.
- **Usage gaps**: Docs not referenced by any agent in last 30 days.
- **Freshness gaps**: Docs not reviewed in 180+ days.
- **Recommendations**: New docs to author; existing docs to refresh.

### Tool: generate_executive_briefing

**Purpose**: Generate an executive briefing for an account.

**Input**: Account + recent research findings.

**Output**: 1-page briefing with:
- Company overview
- Recent triggers
- Stakeholder map
- Recommended talk track
- Risk factors

### Tool: reconcile_data

**Purpose**: Reconcile data discrepancies across sources.

**Input**: Data point + multiple sources.

**Output**: Reconciled value + source ranking + discrepancy notes.

### Tool: identify_anomalies

**Purpose**: Identify anomalies in pipeline data (e.g., sudden drop in reply rate).

**Input**: Time series data.

**Output**: Anomalies with severity + likely cause + recommended action.

## 4. Monthly Knowledge Gap Report

Echo runs a monthly knowledge gap report on the first of each month. The report:

1. **Scans** `knowledge/` directory tree.
2. **Reads** `MANIFEST.json` for expected docs.
3. **Cross-references** recent campaign outcomes (which industries/regions underperformed).
4. **Identifies gaps** (see Tool: generate_knowledge_gap_report above).
5. **Recommends** new docs to author.
6. **Outputs** a Markdown report to `knowledge/gap-reports/YYYY-MM-gap-report.md`.
7. **Surfaces** the report in the `/knowledge` admin UI.

## 5. Gap Report Structure

```markdown
---
title: "Monthly Knowledge Gap Report — YYYY-MM"
category: gap-report
generated_at: "YYYY-MM-DD"
generated_by: "echo"
---

# Monthly Knowledge Gap Report — YYYY-MM

## 1. Executive Summary

[1-paragraph summary of KB health + most urgent gaps]

## 2. Coverage Gaps

### 2.1 Industries Not Covered
- [List of industries mentioned in recent campaigns but missing from knowledge/industries/]

### 2.2 Regions Not Covered
- [List of regions mentioned in recent campaigns but missing from knowledge/regions/]

### 2.3 Playbooks Not Covered
- [List of recurring scenarios not covered in knowledge/playbooks/]

## 3. Quality Gaps

| Doc | Current Grade | Issue | Recommended Action |
|-----|---------------|-------|-------------------|
| ... | C | Missing top accounts list | Refresh with seed list |

## 4. Usage Gaps

| Doc | Last Referenced | Recommendation |
|-----|-----------------|----------------|
| ... | 90+ days ago | Review for relevance; refresh or archive |

## 5. Freshness Gaps

| Doc | Last Reviewed | Recommendation |
|-----|----------------|----------------|
| ... | 180+ days | Refresh; re-verify all data points |

## 6. Recommendations

### 6.1 New Docs to Author
1. [Doc name + rationale + estimated effort]

### 6.2 Existing Docs to Refresh
1. [Doc name + what to update]

## 7. Action Items

- [ ] Author [doc 1]
- [ ] Refresh [doc 2]
- [ ] Archive [doc 3]
```

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Report accuracy (data reconciliation) | >99% |
| Gap report coverage (gaps identified vs actual) | >80% |
| Gap report action rate (% of recommendations acted on) | >40% |
| Executive briefing quality (AE satisfaction) | >4/5 |
| Anomaly detection precision | >70% |

## 7. Handoffs

- **From Atlas**: Pipeline data for reporting.
- **From Flow**: Deal outcomes + stage history.
- **To operator**: Gap reports + executive briefings.
- **To Atlas**: Recommended new docs to author (which may trigger agent work).
