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

## 8. Error Handling & Edge Cases

### 8.1 Report Generation Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| No pipeline data for date range | Empty result set from Flow | Return report with "No data for this period"; do not fabricate metrics |
| CRM API timeout | HTTP timeout on data fetch | Retry once; use cached data from last successful pull; note data freshness |
| Conflicting metrics across sources | Flow says 42 SQLs, CRM says 38 | Reconcile via `reconcile_data`; report both values with source attribution |
| Report generation exceeds 5 min | Timeout | Return partial report; flag incomplete sections |
| Export format failure | PDF/Excel generation error | Fall back to Markdown output; retry export once |

### 8.2 Knowledge Gap Report Edge Cases

| Edge Case | Detection | Action |
|-----------|-----------|--------|
| Knowledge base directory empty | No files found in `knowledge/` | Flag as critical gap; recommend seed content creation |
| MANIFEST.json missing | File not found | Scan directory structure; generate MANIFEST from existing files |
| Grade inflation (all docs are grade A) | No C/D grades found | Likely self-grading issue; flag for external audit |
| Orphaned docs (not in MANIFEST) | Files exist but not in manifest | Add to manifest; grade and categorize |
| Duplicate content across docs | Semantic similarity >80% | Recommend merging; flag in quality gaps |
| Circular references | Doc A references Doc B references Doc A | Not a blocker; note in quality gaps |

### 8.3 Anomaly Detection Edge Cases

| Edge Case | Example | Action |
|-----------|---------|--------|
| Legitimate spike (not anomaly) | Reply rate doubled after campaign optimization | Cross-reference with campaign changes; if explainable, not anomalous |
| Gradual decline (not sudden) | Reply rate dropped 2% per week over 8 weeks | Detect as trend, not anomaly; flag in trends section |
| Single data point makes it look anomalous | One day with 0 replies due to holiday | Filter holidays; use rolling 7-day average for anomaly detection |
| Not enough data for statistical significance | Campaign with <50 emails sent | Cannot reliably detect anomalies; note "insufficient data" |
| Anomaly in a new channel | First LinkedIn campaign shows 0% reply rate | May be normal for new channel; compare against benchmarks, not historical |

### 8.4 Data Reconciliation Edge Cases

| Conflict | Resolution Rule |
|----------|----------------|
| Flow: deal closed-won; CRM: deal still in negotiation | Trust CRM as source of truth; flag for AE to update CRM |
| Forge: 250 headcount; Sage research: 300 headcount | Report range "250–300"; note source discrepancy |
| Judge: Tier A; actual conversion: 5% | Flag for calibration audit; model may be over-scoring |
| Bard: 50% open rate; email platform: 35% | Trust email platform (direct measurement); investigate tracking pixel issues |

### 8.5 Rate Limit Handling

- CRM API: Max 1000 reads/hour. Batch report data fetches.
- Email platform API: Max 500 events/minute. Use webhooks where possible.
- File system: No rate limit for knowledge base scanning; but limit to 1 scan per hour.
- Export API: Max 10 exports per hour per user.

### 8.6 Report Delivery Failures

| Failure | Recovery |
|---------|----------|
| Email delivery failure | Retry once; if still fails, store report for manual download |
| Slack notification failure | Fall back to email; log notification failure |
| Dashboard update failure | Retry with exponential backoff; report remains available via API |

## 9. Integration Patterns

### 9.1 Monthly Reporting Pipeline

```
(Cron: 1st of month, 2am UTC)
  → Echo.generate_knowledge_gap_report
  → Echo.generate_pipeline_report (previous month)
  → Echo.identify_anomalies (last 90 days)
  → Combine into monthly digest
  → Deliver to operator via email + dashboard
  → Surface in /knowledge admin UI
```

### 9.2 Campaign Performance Feedback Loop

```
Echo.generate_campaign_report → (ICP "FinTech EU" underperforming)
  → Echo identifies: FinTech EU reply rate 1.2% (benchmark: 3%)
  → Cross-references knowledge base: knowledge/industries/fintech.md is grade C
  → Recommends: "Refresh fintech.md with EU-specific regulations and tone guidance"
  → Atlas picks up recommendation → triggers doc refresh
```

### 9.3 Anomaly-Triggered Actions

```
Echo.identify_anomalies → (reply rate dropped 60% in last 7 days)
  → Root cause analysis: Bard changed email template 8 days ago
  → Echo recommends: "Revert to previous email template; A/B test new template"
  → Notification to operator + Bard team
```

### 9.4 Executive Briefing for AE Prep

```
AE requests briefing for Acme Corp
  → Echo.generate_executive_briefing
    → Pulls from Forge (firmographics, technographics)
    → Pulls from Sage (research findings)
    → Pulls from Flow (deal stage, stakeholder map)
    → Synthesizes into 1-page briefing
  → Delivered to AE 1 hour before meeting
```

### 9.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| generate_pipeline_report | Operator / Dashboard | Full report | Markdown + JSON |
| generate_campaign_report | Atlas | Campaign performance insights | Object |
| generate_knowledge_gap_report | Atlas / Operator | Gap analysis + recommendations | Markdown |
| generate_executive_briefing | Human AE | 1-page account briefing | Markdown + PDF |
| reconcile_data | All reports | Reconciled metrics | Object |
| identify_anomalies | Operator / Atlas | Anomaly alerts | Array<Object> |

## 10. Quality Assurance Rules

### 10.1 Report Accuracy Standards

| Metric | Standard | Verification Method |
|--------|----------|-------------------|
| Funnel counts | Exact match with CRM data | Cross-reference with CRM export |
| Conversion rates | Calculated from verified counts | Recalculate from raw data; compare |
| Cycle times | Within ±1 day of actual | Spot-check 10 deals against CRM |
| Revenue figures | Exact match with Finance | Monthly reconciliation with billing system |
| Anomaly detection | Precision >70% | Human review of flagged anomalies |

### 10.2 Knowledge Gap Report Quality

| Metric | Standard | Action if Below |
|--------|----------|-----------------|
| Coverage gap detection | >80% of actual gaps found | Expand scan scope; add new directories |
| Recommendation relevance | >60% acted upon by operators | Improve recommendation specificity |
| False positive rate | <20% of recommended gaps are not actual gaps | Tighten gap detection thresholds |

### 10.3 Executive Briefing Quality

- Must be ≤1 page (when printed).
- Must include at least 3 actionable insights.
- Must cite data sources for every claim.
- Must be deliverable within 30 minutes of request.
- AE satisfaction survey sent after each briefing; target >4/5.

### 10.4 Anomaly Detection Thresholds

| Metric | Normal Range | Anomaly Threshold | Severity |
|--------|-------------|-------------------|----------|
| Reply rate | Campaign-specific | >2σ from 30-day rolling average | High if >3σ, Medium if 2–3σ |
| Open rate | Campaign-specific | >2σ from 30-day rolling average | Medium |
| Bounce rate | <5% | >10% sudden spike | Critical |
| Unsubscribe rate | <0.5% | >2% in single day | Critical |
| Pipeline value | Steady growth | >20% drop in 7 days | High |
| Stage conversion rate | Per-stage benchmark | >15pp drop from benchmark | High |

### 10.5 Validation Rules

- Every number in a report must trace to a source query.
- No number may be manually entered; all values are computed.
- Rounding: Use 1 decimal place for percentages, 0 for counts.
- Date ranges must be inclusive on both ends.
- Filters must be documented in report metadata.

## 11. Performance Optimization

### 11.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Pipeline metrics (by date range) | 1 hour | On any deal stage change |
| Campaign metrics (by campaign ID) | 30 minutes | On campaign event |
| Knowledge base scan results | 24 hours | On file add/update/delete |
| Anomaly detection baseline | 7 days | On new data ingestion |
| Executive briefing data | 4 hours | On new research or deal update |
| Reconciliation results | 24 hours | On source data change |

### 11.2 Parallel Execution

- `reconcile_data` runs in parallel for each metric being reconciled.
- `identify_anomalies` runs in parallel for each metric being checked.
- `generate_pipeline_report` and `generate_knowledge_gap_report` can run in parallel for monthly digest.
- Within a report, data queries for different stages/channels run in parallel.

### 11.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| generate_pipeline_report | 5 min | Return partial report with available data |
| generate_campaign_report | 3 min | Return partial report |
| generate_knowledge_gap_report | 10 min | Return partial gap analysis |
| generate_executive_briefing | 2 min | Return brief summary with key data points |
| reconcile_data | 30s per metric | Return best-available value; flag as unreconciled |
| identify_anomalies | 2 min | Return anomalies found so far |

### 11.4 Pre-Computed Aggregates

Echo maintains pre-computed daily aggregates for common metrics:
- Daily funnel counts (sent, replied, booked, etc.)
- Daily conversion rates per stage
- Daily revenue metrics
- Rolling 7-day and 30-day averages

These aggregates are updated every hour, making report generation near-instant for standard date ranges.

### 11.5 Incremental Report Updates

For frequently accessed reports (e.g., live dashboard), Echo updates incrementally:
- New data is appended to the report rather than regenerating from scratch.
- Cached sections are reused unless their input data has changed.
- This reduces report generation time from minutes to seconds.

## 12. Anti-Patterns

### 12.1 Do Not: Present Data Without Context

"Reply rate: 2.5%" means nothing without benchmarks. Always compare against: campaign average, industry benchmark, and historical trend. Context transforms data into insight.

### 12.2 Do Not: Cherry-Pick Positive Metrics

If open rate is 55% but reply rate is 1%, report both. Highlighting only the positive metric is misleading and erodes trust. Always show the full funnel.

### 12.3 Do Not: Generate Reports Nobody Reads

Before creating a new report type, verify there's a consumer. Unused reports waste compute and storage. Track report access; archive reports not opened in 90 days.

### 12.4 Do Not: Use Stale Data for Live Reports

If the last CRM sync was 48 hours ago, the pipeline report is not "live." Always show data freshness timestamp. Stale data presented as current is worse than no data.

### 12.5 Do Not: Automate Gap Report Actions Without Human Approval

Echo recommends; humans decide. Do not auto-delete docs, auto-create docs, or auto-archive content based on gap reports. Surface recommendations for human approval.

### 12.6 Do Not: Ignore Anomalies Because They're Inconvenient

A sudden drop in performance is a signal, not noise. Even if it reflects poorly on a recent change, anomalies must be surfaced. Suppressing anomalies destroys trust in the reporting system.

## 13. Output Schema Deep Dive

### 13.1 generate_pipeline_report Output

```yaml
report_id: "rpt_202606_pipeline"
report_type: "pipeline_performance"
date_range:
  start: "2026-05-01"
  end: "2026-05-31"
generated_at: "2026-06-01T02:15:00Z"
data_freshness: "2026-06-01T01:45:00Z"

funnel_metrics:
  contacted: 4520
  replied: 412
  meeting_booked: 185
  meeting_held: 142
  qualified: 89
  opportunity: 52
  proposal_sent: 31
  negotiation: 18
  closed_won: 12
  closed_lost: 24

conversion_rates:
  contacted_to_replied: 9.1%
  replied_to_booked: 44.9%
  booked_to_held: 76.8%
  held_to_qualified: 62.7%
  qualified_to_opportunity: 58.4%
  opportunity_to_proposal: 59.6%
  proposal_to_negotiation: 58.1%
  negotiation_to_closed_won: 66.7%
  overall_contacted_to_closed_won: 0.27%

cycle_times:
  contacted_to_replied: 6.2_days
  replied_to_booked: 8.1_days
  booked_to_held: 7.3_days
  held_to_qualified: 12.5_days
  qualified_to_opportunity: 18.2_days
  opportunity_to_proposal: 22.4_days
  proposal_to_negotiation: 14.1_days
  negotiation_to_closed_won: 21.8_days
  total_contacted_to_closed_won: 110.6_days

top_performers:
  - segment: "SaaS US, Tier A leads"
    conversion: 2.8%
    cycle_time: 85_days
  - segment: "FinTech EU, Tier A leads"
    conversion: 1.4%
    cycle_time: 142_days

laggards:
  - segment: "Healthcare US, Tier B leads"
    conversion: 0.4%
    cycle_time: 168_days
    issue: "Long procurement cycles; recommend multi-threading"

anomalies:
  - metric: "reply_rate"
    period: "2026-05-15 to 2026-05-22"
    observed: 3.2%
    expected: 8.5%
    deviation: -5.3pp
    severity: "high"
    likely_cause: "New email template deployed 2026-05-14; lower personalization"
    recommended_action: "Revert to previous template; A/B test new version"

trends:
  - "Reply rate declining 0.3pp/week over last 8 weeks"
  - "Meeting-booked rate improving 1.2pp/week (new LinkedIn strategy)"
  - "Average deal size increasing ($52K → $68K over quarter)"

revenue_metrics:
  pipeline_value: 3_850_000
  weighted_pipeline: 1_245_000
  closed_won_value: 780_000
  average_deal_size: 65000
  target attainment: 78%

source_attribution:
  - source: "CRM (Salesforce)"
    records: 4520
    last_sync: "2026-06-01T01:45:00Z"
  - source: "Email platform (SendGrid)"
    records: 4520
    last_sync: "2026-06-01T00:30:00Z"
  reconciliation_status: "reconciled"    # reconciled | partial | unreconciled
```

### 13.2 generate_campaign_report Output

```yaml
report_id: "rpt_202606_camp_fintech_eu"
report_type: "campaign_performance"
campaign_id: "camp_xyz789"
campaign_name: "FinTech EU Series B Outreach"
date_range:
  start: "2026-05-01"
  end: "2026-05-31"

campaign_metrics:
  leads_targeted: 850
  emails_sent: 2400
  emails_opened: 960
  email_open_rate: 40.0%
  replies: 28
  reply_rate: 1.2%
  meetings_booked: 8
  meeting_rate: 0.9%
  closed_won: 1
  close_rate: 0.12%
  total_revenue: 45000

icp_performance:
  - icp_segment: "FinTech, Series B, 100-500 employees"
    leads: 320
    reply_rate: 1.5%
    meeting_rate: 1.1%
    performance: "at_benchmark"
  - icp_segment: "FinTech, Series B, 50-100 employees"
    leads: 280
    reply_rate: 0.8%
    meeting_rate: 0.5%
    performance: "below_benchmark"
    issue: "Smaller companies have less budget; consider adjusting ICP"
  - icp_segment: "FinTech, Series A, 100-500 employees"
    leads: 250
    reply_rate: 1.3%
    meeting_rate: 1.0%
    performance: "at_benchmark"

channel_performance:
  - channel: "email"
    sent: 2400
    reply_rate: 1.2%
  - channel: "linkedin"
    sent: 650
    reply_rate: 2.8%
  - channel: "phone"
    attempts: 180
    connect_rate: 11%
    meeting_rate: 0.6%

recommendations:
  - "FinTech EU reply rate (1.2%) is below benchmark (3.0%). Review tone profile for EU formality."
  - "LinkedIn outperforms email 2.3x. Increase LinkedIn touchpoints in sequence."
  - "Smaller FinTech (<100 employees) underperforms. Consider narrowing ICP to 100+ employees."
  - "knowledge/industries/fintech.md is grade C. Refresh with EU-specific insights."
```

### 13.3 generate_knowledge_gap_report Output

```yaml
report_id: "gap_202606"
report_type: "knowledge_gap"
scan_date: "2026-06-01T02:00:00Z"
kb_path: "knowledge/"
total_docs: 48
manifest_entries: 52
orphaned_docs: 4

coverage_gaps:
  industries_missing:
    - name: "Insurance"
      campaign_references: 3
      urgency: "high"
    - name: "Government / Public Sector"
      campaign_references: 1
      urgency: "medium"
  regions_missing:
    - name: "Southeast Asia (ASEAN)"
      campaign_references: 2
      urgency: "medium"
    - name: "Nordics"
      campaign_references: 1
      urgency: "low"
  playbooks_missing:
    - name: "Account-Based Marketing (ABM) Playbook"
      campaign_references: 4
      urgency: "high"
    - name: "Partner Channel Outreach"
      campaign_references: 2
      urgency: "medium"

quality_gaps:
  - doc: "knowledge/industries/fintech.md"
    current_grade: "C"
    issue: "No EU-specific regulations; no top accounts list"
    recommended_action: "Refresh with EU regulatory section + add 20 seed accounts"
    estimated_effort: "4 hours"
  - doc: "knowledge/regions/eu-gdpr.md"
    current_grade: "D"
    issue: "Last reviewed 240 days ago; GDPR guidance outdated"
    recommended_action: "Full refresh with latest GDPR enforcement guidance"
    estimated_effort: "6 hours"

usage_gaps:
  - doc: "knowledge/industries/agriculture-food-trade.md"
    last_referenced: "2025-12-15"
    days_since_reference: 168
    recommendation: "Review for relevance; refresh or archive"
  - doc: "knowledge/playbooks/churn-recovery.md"
    last_referenced: "2026-02-20"
    days_since_reference: 101
    recommendation: "Low usage; consider merging with retention playbook"

freshness_gaps:
  - doc: "knowledge/regions/eu-gdpr.md"
    last_reviewed: "2025-10-03"
    days_since_review: 241
    recommendation: "Immediate refresh required"
  - doc: "knowledge/tools/atlas.md"
    last_reviewed: "2026-06-22"
    days_since_review: 0
    recommendation: "Current"

recommendations:
  new_docs:
    - title: "Insurance Industry Guide"
      rationale: "3 campaigns targeting insurance in last 90 days; no industry doc"
      estimated_effort: "8 hours"
      priority: "high"
    - title: "ABM Playbook"
      rationale: "4 campaigns would benefit from ABM guidance"
      estimated_effort: "6 hours"
      priority: "high"
    - title: "ASEAN Region Guide"
      rationale: "2 campaigns targeting ASEAN; no region doc"
      estimated_effort: "6 hours"
      priority: "medium"
  docs_to_refresh:
    - title: "knowledge/industries/fintech.md"
      what_to_update: "Add EU regulations, update top accounts"
      estimated_effort: "4 hours"
      priority: "high"
    - title: "knowledge/regions/eu-gdpr.md"
      what_to_update: "Full refresh with latest enforcement guidance"
      estimated_effort: "6 hours"
      priority: "high"

action_items:
  - "[ ] Author Insurance Industry Guide (8h, high priority)"
  - "[ ] Author ABM Playbook (6h, high priority)"
  - "[ ] Refresh fintech.md with EU content (4h, high priority)"
  - "[ ] Refresh eu-gdpr.md (6h, high priority)"
  - "[ ] Author ASEAN Region Guide (6h, medium priority)"
  - "[ ] Review agriculture-food-trade.md for relevance"
  - "[ ] Merge churn-recovery.md with retention playbook"
```

### 13.4 identify_anomalies Output

```yaml
scan_id: "anomaly_20260601"
scan_period:
  start: "2026-05-01"
  end: "2026-05-31"
baseline_period:
  start: "2026-02-01"
  end: "2026-04-30"

anomalies:
  - metric: "reply_rate"
    period: "2026-05-15 to 2026-05-22"
    observed_value: 3.2%
    expected_value: 8.5%
    deviation: -5.3pp
    deviation_sigma: 2.8
    severity: "high"
    direction: "negative"
    likely_cause: "New Bard email template v3.2 deployed 2026-05-14"
    recommended_action: "Revert to v3.1; A/B test v3.2 with 10% of volume"
    affected_campaigns: ["camp_xyz789", "camp_abc456"]
    status: "open"
  - metric: "bounce_rate"
    period: "2026-05-28"
    observed_value: 12.3%
    expected_value: 3.8%
    deviation: +8.5pp
    deviation_sigma: 4.2
    severity: "critical"
    direction: "negative"
    likely_cause: "Batch of 200 Forge-verified emails with catch-all domains; verification confidence was 50-60"
    recommended_action: "Re-verify all emails with confidence <70 before sending; update Forge verification threshold"
    affected_campaigns: ["camp_def789"]
    status: "open"
  - metric: "meeting_booked_rate"
    period: "2026-05-20 to 2026-05-31"
    observed_value: 11.2%
    expected_value: 8.0%
    deviation: +3.2pp
    deviation_sigma: 2.1
    severity: "medium"
    direction: "positive"
    likely_cause: "New LinkedIn DM strategy implemented 2026-05-18"
    recommended_action: "Analyze what's working; scale to other campaigns"
    affected_campaigns: ["camp_ghi012"]
    status: "open"

total_anomalies: 3
critical: 1
high: 1
medium: 1
low: 0
positive: 1
negative: 2
```
