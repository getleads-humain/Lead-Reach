import type { AgentDetailFull } from './types';

export const reportGeneratorDetail: AgentDetailFull = {
  slug: 'report-generator',
  name: 'report-generator',
  displayName: 'Report Generator (Echo)',
  tagline: 'Turns every lead-gen activity into analytics, insights, and optimization recommendations',
  description: 'Generates analytics reports and campaign insights',
  longDescription:
    'The Report Generator agent — codenamed Echo — is the analytical closing agent of the LeadReach AI platform. Sitting at position 8 in the pipeline, Echo aggregates every signal produced upstream (discoveries, enrichments, qualifications, outreach sends, replies, pipeline transitions) and turns them into 25+ tracked metrics, three cadenced report formats (daily / weekly / monthly), and AI-powered recommendations that close the optimization loop. Echo calls the unified /api/dashboard/stats endpoint in a single server-side round-trip to fetch the full metric surface (total campaigns, total leads, leads by stage across 9 stages, leads by tier across 4 tiers, average lead score, response rate, pipeline value, agent performance, channel ROI, conversion funnel, pipeline velocity), then layers per-campaign Pipeline Status Batch API calls (byStage, byTier, averageScore, totalLeads) to produce drill-down views. The agent renders visualizations via Recharts (bar, pie, line, area, radar), pushes anomalies past a 95% detection threshold, and dispatches notifications through Slack, email, and custom webhook endpoints. Powered by glm-4.6v-flash at temperature 0.4 and maxTokens 3000, Echo balances quantitative rigor with the creative latitude required to phrase recommendations in actionable, decision-ready language.',
  color: '#EF4444',
  iconName: 'BarChart3',
  department: 'Growth',
  pipelineRole: 'Analytics, reporting, and optimization recommendations',
  pipelinePosition: 8,

  capabilities: [
    {
      name: 'Real-Time Dashboard Generation',
      description:
        'Produces live dashboards showing campaign performance, lead distribution, agent activity, and pipeline health — all fed by the unified /api/dashboard/stats endpoint in a single server-side call that returns the complete metric surface in one round-trip.',
      metric: '15s refresh rate',
      details: [
        'Calls /api/dashboard/stats once per refresh cycle and fans the response out to all subscribed dashboard widgets, eliminating N+1 query patterns.',
        'Subscribes the UI to a Server-Sent Events channel so metric updates stream in sub-second without polling.',
        'Computes 25+ tracked metrics (total campaigns, total leads, leads by stage, leads by tier, avg lead score, response rate, pipeline value, agent performance, channel ROI, conversion funnel, pipeline velocity) on every refresh.',
        'Backs every widget with a 30-day trend sparkline so users see direction, not just the current value.',
      ],
    },
    {
      name: 'Agent Performance Tracking',
      description:
        'Tracks each agent\'s task completion rate, success rate, token usage, average duration, queue depth, and composite health score. Identifies top performers and agents needing attention.',
      metric: 'Per-agent metrics',
      details: [
        'Per-agent scorecard: tasks_completed, success_rate, mean_duration_s, p99_duration_s, tokens_consumed, in_flight_count, queue_depth, health_score (0–100).',
        'Health score blends 4 sub-metrics: success rate (40%), latency vs SLA (25%), queue saturation (20%), token efficiency (15%). Below 70 triggers a flag.',
        'Compares each agent against its own 30-day rolling baseline to surface regression (e.g. "Sage p99 latency up 42% week-over-week").',
        'Feeds the orchestrator\'s capacity_rebalancer so underperforming agents receive reduced dispatch weight.',
      ],
    },
    {
      name: 'Channel ROI Analysis',
      description:
        'Analyzes cost per lead, cost per qualified lead, and cost per meeting by discovery channel. Recommends budget reallocation toward the highest-performing channels.',
      metric: 'Per-channel ROI',
      details: [
        'Computes CPL, CPQL (cost per qualified lead), and CPMtg (cost per meeting booked) per channel — LinkedIn, Google Ads, Reddit, GitHub, Exa, DuckDuckGo, RSS, and international platforms.',
        'Attribution model: first-touch (channel that introduced the lead) and last-touch (channel that drove the qualifying action) computed in parallel.',
        'Ranks channels by ROI and surfaces a top-3 / bottom-3 list with confidence intervals.',
        'Generates reallocation recommendations only when sample size ≥ 30 leads per channel to avoid small-sample noise.',
      ],
    },
    {
      name: 'Conversion Funnel Analysis',
      description:
        'Tracks stage-by-stage conversion rates across the 6-stage funnel (discovery → enrichment → qualification → contact → engagement → close) and identifies where leads drop off so the right intervention can be recommended.',
      metric: '6-stage funnel',
      details: [
        'Computes stage-to-stage conversion rate, median time-in-stage, and 90th-percentile time-in-stage for each of the 6 stages.',
        'Flags any stage whose conversion rate drops more than 1.5 standard deviations below its 30-day baseline as a "leak".',
        'Pairs each leak with a hypothesis and a recommended intervention (e.g. enrichment leak → "Forge is returning 38% fewer fields; check Apollo API quota").',
        'Renders the funnel as a Recharts bar chart with absolute counts and conversion percentages side-by-side.',
      ],
    },
    {
      name: 'AI-Powered Recommendations',
      description:
        'Generates actionable, quantified recommendations like "Increase LinkedIn budget by 20% — it produces 3x more hot leads than Google Ads at 40% lower CAC" or "Lower qualification threshold from 50 to 45 — 68% of leads scoring 45-49 eventually convert."',
      metric: '85% adoption rate',
      details: [
        'Each recommendation carries 4 required fields: observation (the data), hypothesis (the causal model), action (the proposed change), and expected_impact (quantified projection with confidence interval).',
        'Recommendations are ranked by expected_impact × confidence and only the top 5 are surfaced per report to prevent recommendation fatigue.',
        'Each recommendation is logged with a 30/60/90-day follow-up schedule so Echo can later verify whether the predicted impact materialized.',
        'When the user accepts a recommendation, Echo emits recommendation.accepted so the orchestrator can apply the change (e.g. budget reallocation, threshold adjustment).',
      ],
    },
    {
      name: 'Scheduled Report Cadences',
      description:
        'Generates daily, weekly, and monthly reports automatically. Daily is a quick summary, weekly is detailed performance, monthly is a strategic review with recommendations.',
      metric: '3 cadences',
      details: [
        'Daily (08:00 local): 1-page summary — total leads, new today, hot leads today, agent status, top anomaly of the past 24h.',
        'Weekly (Monday 09:00): detailed performance — campaign ROI, channel analysis, agent productivity, funnel conversion, 3-5 recommendations.',
        'Monthly (1st of month 10:00): strategic review — trend analysis, ICP optimization suggestions, budget reallocation advice, capacity planning, board-ready narrative.',
        'Each cadence has a configurable delivery target (Slack channel, email distribution list, custom webhook URL) and a configurable timezone.',
      ],
    },
    {
      name: 'Anomaly Detection',
      description:
        'Continuously monitors all 25+ metrics against 30-day rolling baselines and surfaces anomalies (spikes, drops, level shifts) within minutes of onset.',
      metric: '95% detection rate',
      details: [
        'Uses a hybrid detector: 3-sigma rule for fast spikes, EWMA control chart for slow drift, and STL decomposition for seasonal metrics (e.g. weekday vs weekend lead volume).',
        'Each anomaly is classified by severity: P0 (metric deviates >3σ from baseline), P1 (>2σ), P2 (>1.5σ). Only P0 and P1 trigger immediate notifications.',
        'Anomaly events include: metric name, observed value, expected value, deviation magnitude, direction (spike/drop/shift), first-seen timestamp.',
        'False-positive rate is tracked and tuned monthly; target is < 5% false-positive rate at P0/P1 severity.',
      ],
    },
    {
      name: 'Pipeline Velocity Tracking',
      description:
        'Measures the average time from lead discovery to closed-won, broken down by stage, channel, and ICP segment. Identifies velocity bottlenecks and recommends interventions.',
      metric: 'Per-segment velocity',
      details: [
        'Computes cycle time per stage (discovery → enrichment → qualification → contact → engagement → close) and overall pipeline velocity in days.',
        'Breaks down velocity by ICP segment (industry, employee_count, geography, funding_stage) so users can see which segments close fastest.',
        'Flags segments whose velocity is > 1.5x the platform median as "fast-track" and < 0.75x as "slow-track" for targeted intervention.',
        'Surfaces a "velocity leaderboard" ranking campaigns by their time-to-close to celebrate wins and surface best practices.',
      ],
    },
    {
      name: 'Webhook Notification Dispatch',
      description:
        'Sends report and anomaly notifications via webhooks to Slack, email, or custom HTTP endpoints. Templated payloads, signed for authenticity.',
      metric: '< 5s delivery',
      details: [
        'Three built-in transports: Slack (incoming webhook), email (SMTP relay), and generic HTTP POST with HMAC-SHA256 signature header.',
        'Each transport has a template (Liquid syntax) that renders the metric payload into a human-readable message.',
        'Retry policy: 3 attempts with exponential backoff (2s, 8s, 30s). Failed deliveries are persisted to a dead-letter table for replay.',
        'Users can subscribe per-cadence (e.g. daily to Slack #growth-daily, monthly to email exec-distribution@company.com).',
      ],
    },
    {
      name: 'Visualization Rendering',
      description:
        'Generates interactive charts via Recharts (bar, pie, line, area, radar) for dashboard visualization, plus a server-side rasterized fallback for PDF and email delivery.',
      metric: '5 chart types',
      details: [
        'Bar charts for funnel stages and channel comparison; pie for lead-tier distribution; line for time-series metrics; area for cumulative totals; radar for multi-dimensional agent scorecards.',
        'Each chart is data-driven from a JSON spec so the same metric can render in multiple formats without code changes.',
        'Server-side rendering uses headless Chromium to rasterize the chart to PNG for PDF/email contexts that cannot run JS.',
        'Color palette is theme-aware (light/dark) and accessible (colorblind-safe defaults from the Wong 2011 palette).',
      ],
    },
    {
      name: 'Data Quality Monitoring',
      description:
        'Tracks completeness, freshness, and consistency of the metrics data so reports always reflect ground truth. Surfaces data-quality issues before they pollute downstream analysis.',
      metric: '< 1% missing data',
      details: [
        'Completeness check: for each metric, computes % of underlying records that have non-null values for required fields. Target ≥ 99%.',
        'Freshness check: confirms the latest metric timestamp is within 2x the expected refresh interval (e.g. 15s metric should have a timestamp within 30s).',
        'Consistency check: cross-validates related metrics (e.g. sum of leads-by-stage must equal total leads; if not, flags a reconciliation anomaly).',
        'On data-quality breach, Echo holds the report and emits a data_quality.breach event rather than publishing numbers it cannot stand behind.',
      ],
    },
    {
      name: 'Explainable Recommendation Audit Trail',
      description:
        'Every recommendation Echo produces is recorded with the full evidence chain (queries run, metrics referenced, model output) so users and reviewers can audit how the recommendation was derived.',
      metric: '100% auditable',
      details: [
        'Each recommendation record stores: input_data_snapshot, model_version, prompt_hash, raw_model_output, post-processing steps, and final recommendation object.',
        'The /api/reports/explain?recommendation_id= endpoint returns the full evidence chain in human-readable form.',
        'Recommendations are immutable once issued; if the underlying data changes, a new recommendation supersedes the old one with a "supersedes" link.',
        'Monthly audit: 5% of all recommendations are sampled and reviewed by a human analyst for quality and adherence to the 4-field schema.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Data Aggregation',
      inputs: ['Campaign records', 'Lead records', 'Agent metrics', 'Pipeline stage transitions', 'Channel cost data'],
      outputs: ['Aggregated metric snapshot', 'Raw performance dataset', 'Data-quality report'],
      duration: '5–10 seconds',
      substeps: [
        'Issue a single call to /api/dashboard/stats with the requested time window and scope (workspace, campaign, or agent).',
        'Issue per-campaign Pipeline Status Batch API calls (byStage, byTier, averageScore, totalLeads) in parallel for any campaign drill-down required.',
        'Pull channel cost data from the spend ledger (ad platform exports, API costs, token costs) for ROI computation.',
        'Pull agent performance counters (tasks_completed, success_rate, token_usage, durations) from the per-agent metric store.',
        'Run the data-quality validator: completeness, freshness, consistency checks across all sources.',
        'Persist the aggregated snapshot to the metric_snapshots table for trend analysis and historical comparison.',
      ],
      errorHandling: 'On /api/dashboard/stats failure, fall back to the most recent cached snapshot (max 60s old) and tag the report as stale=true. On data-quality breach, hold the report and emit data_quality.breach.',
      retryStrategy: '2 retries with 2s backoff on transient API failures. No retry on data-quality breaches — these require human investigation.',
    },
    {
      stage: 'Metric Computation',
      inputs: ['Aggregated snapshot', 'Historical baselines (30-day rolling)', 'Industry benchmarks'],
      outputs: ['25+ computed metrics', 'Per-segment breakdowns', 'Delta vs baseline'],
      duration: '3–8 seconds',
      substeps: [
        'Compute headline metrics: total_campaigns, total_leads, leads_by_stage (9 stages), leads_by_tier (4 tiers), avg_lead_score.',
        'Compute efficiency metrics: response_rate, pipeline_value, agent_performance, channel_ROI, conversion_funnel, pipeline_velocity.',
        'Compute deltas against the 30-day rolling baseline for each metric (absolute and percentage).',
        'Compute per-segment breakdowns (by ICP dimension: industry, employee_count, geography, funding_stage).',
        'Compute the conversion funnel: stage-to-stage conversion rates, median time-in-stage, p90 time-in-stage.',
        'Tag each metric with confidence (high if n≥30, medium if 10≤n<30, low if n<10) so downstream consumers know how much trust to place.',
      ],
      errorHandling: 'If a metric cannot be computed (e.g. division by zero when total_leads=0), emit null with a reason_code rather than crashing the report.',
      retryStrategy: 'No retry — metric computation is deterministic and idempotent.',
    },
    {
      stage: 'Analysis & Anomaly Detection',
      inputs: ['Computed metrics', '30-day rolling baselines', 'Anomaly detector configuration'],
      outputs: ['Anomaly list', 'Performance trends', 'Funnel analysis', 'Agent scorecards'],
      duration: '3–8 seconds',
      substeps: [
        'Run the 3-sigma detector on every metric for spike/drop detection against the 30-day baseline.',
        'Run the EWMA control chart for slow-drift detection (lambda=0.3, control limits at ±3 sigma).',
        'Run STL decomposition for seasonal metrics to separate trend from seasonality.',
        'Classify each anomaly by severity (P0/P1/P2) and deduplicate against any anomaly still active from the prior cycle.',
        'Compute agent scorecards (health_score, success_rate, latency vs SLA, queue saturation, token efficiency) and flag any agent with health_score < 70.',
        'Compute the funnel leak detector: any stage with conversion rate > 1.5σ below baseline is tagged as a leak with hypothesis and intervention.',
      ],
      errorHandling: 'If the baseline is insufficient (< 7 days of history), skip anomaly detection and tag the report as "baseline_warming".',
      retryStrategy: 'No retry — analysis is deterministic given the inputs.',
    },
    {
      stage: 'Recommendation Generation',
      inputs: ['Analysis results', 'Optimization rules', 'Historical recommendation outcomes'],
      outputs: ['3–5 ranked recommendations', 'Priority ranking', 'Expected impact estimates'],
      duration: '5–15 seconds',
      substeps: [
        'Assemble the recommendation prompt: system prompt + analysis summary + 5 most relevant historical recommendations and their observed outcomes.',
        'Call glm-4.6v-flash at temperature 0.4, maxTokens 3000, response_format=json_object, requesting 3–5 candidate recommendations.',
        'Validate each candidate against the 4-field schema (observation, hypothesis, action, expected_impact). Reject any that fail validation.',
        'Compute a priority score = expected_impact × confidence and rank the surviving candidates.',
        'Cross-check each recommendation against the recommendation_history table to avoid repeating a recently-issued and not-yet-evaluated recommendation.',
        'Persist the final ranked list with the full evidence chain (prompt, model output, post-processing) to the recommendations table.',
      ],
      errorHandling: 'If the LLM returns malformed JSON, retry once with patched prompt (explicit schema reminder) and reduced temperature (0.3). If still failing, fall back to a rule-based recommendation generator that emits the top anomaly as a recommendation.',
      retryStrategy: '1 retry with patched prompt + temperature reduction. Subsequent failures trigger rule-based fallback.',
    },
    {
      stage: 'Report Assembly',
      inputs: ['Computed metrics', 'Analysis results', 'Ranked recommendations', 'Visualization specs'],
      outputs: ['Formatted report (dashboard payload, PDF, email body, Slack message)'],
      duration: '< 5 seconds',
      substeps: [
        'Select the report template based on cadence (daily / weekly / monthly) and delivery target (Slack / email / dashboard / PDF).',
        'Render visualizations: Recharts spec for dashboard, headless-Chromium rasterized PNG for PDF/email.',
        'Populate the template sections: headline metrics, trends, anomalies, recommendations, agent scorecards, funnel.',
        'Compute the executive summary (3-sentence narrative) using the LLM if the cadence is weekly or monthly.',
        'Validate the assembled report against the report schema; reject and re-assemble on schema violation.',
        'Emit report.assembled event with the report_id, cadence, and delivery target.',
      ],
      errorHandling: 'On assembly failure, retry once. If retry fails, emit report.failed and notify the on-call analyst via the high-priority Slack channel.',
      retryStrategy: '1 retry on assembly failure. No retry on schema violation (would loop indefinitely).',
    },
    {
      stage: 'Delivery & Notification',
      inputs: ['Assembled report', 'Subscription registry', 'Webhook credentials'],
      outputs: ['Delivered notifications', 'Delivery receipts', 'Dead-letter entries'],
      duration: '< 5 seconds',
      substeps: [
        'Look up the subscription registry for the report cadence to find all subscribed delivery targets.',
        'For each target, render the report into the transport-specific format (Slack block kit, HTML email, JSON webhook payload).',
        'Sign the payload with HMAC-SHA256 using the per-target secret and include the signature in the X-Echo-Signature header.',
        'Dispatch the notification via the transport (Slack incoming webhook, SMTP relay, HTTP POST) with a 10s timeout.',
        'Record the delivery receipt (status, latency, response_body) for each target.',
        'On delivery failure, apply the retry policy (3 attempts, exponential backoff 2s/8s/30s); persist failures to dead_letter table for replay.',
      ],
      errorHandling: 'Transport timeouts and 5xx responses trigger the retry policy. 4xx responses (auth failure, malformed payload) do not retry; they are surfaced to the on-call analyst.',
      retryStrategy: '3 attempts with exponential backoff (2s, 8s, 30s). Failures after 3 attempts persist to dead_letter table and emit notification.delivery_failed.',
    },
    {
      stage: 'Feedback Loop & Outcome Tracking',
      inputs: ['Issued recommendations', 'User accept/reject decisions', '30/60/90-day follow-up schedule'],
      outputs: ['Outcome measurements', 'Accuracy updates', 'Recommendation quality scorecard'],
      duration: 'Continuous (evaluated daily)',
      substeps: [
        'Daily job: for each recommendation with a 30/60/90-day follow-up window closing today, measure the observed impact against the predicted expected_impact.',
        'Compute the recommendation accuracy = (recommendations where observed ≥ 80% of predicted) / (total recommendations evaluated).',
        'Update the per-category accuracy scorecard (ICP, channel mix, threshold, timing, etc.) so future recommendations can be confidence-weighted.',
        'Surface low-accuracy categories to the on-call analyst for review and prompt-tuning.',
        'Feed accuracy metrics back into the priority score formula so high-accuracy categories earn higher priority in future recommendations.',
        'Persist outcome measurements to the recommendation_outcomes table for long-term trend analysis.',
      ],
      errorHandling: 'If impact data is missing (e.g. the recommended change was never applied), mark the recommendation as "not_evaluable" and exclude from accuracy computation.',
      retryStrategy: 'No retry — outcome tracking is a daily batch job and is idempotent.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Report Generation & Analytics SOP',
      category: 'SOP',
      summary:
        'Complete reporting workflow: data aggregation, metric computation, trend analysis, recommendation generation, report assembly, and delivery — across all three cadences (daily, weekly, monthly).',
      sections: 14,
      owner: 'Analytics Engineering',
      lastReviewed: '2026-09-04',
      version: '3.1.0',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what "report generation" means in the LeadReach context and which cadences, transports, and audiences are covered.' },
        { title: '2. Cadence Definitions', description: 'Daily (quick summary), weekly (detailed performance), monthly (strategic review) — exact contents, audience, and delivery time for each.' },
        { title: '3. Data Aggregation Procedure', description: 'How to call /api/dashboard/stats, the per-campaign Pipeline Status Batch API, and the spend ledger in a single aggregation pass.' },
        { title: '4. Metric Computation Rules', description: 'Formulas and units for all 25+ metrics, including leads_by_stage, leads_by_tier, response_rate, pipeline_value, channel_ROI, pipeline_velocity.' },
        { title: '5. Trend Analysis Methodology', description: '30-day rolling baselines, delta computation, confidence tagging, and how to handle small-sample (n<30) segments.' },
        { title: '6. Anomaly Detection Configuration', description: 'The 3-sigma + EWMA + STL hybrid detector: thresholds, severity classification (P0/P1/P2), and tuning procedures.' },
        { title: '7. Recommendation Schema', description: 'The 4-field recommendation schema (observation, hypothesis, action, expected_impact) and validation rules.' },
        { title: '8. Report Templates', description: 'Template specs for each cadence × transport combination (daily-Slack, weekly-email, monthly-PDF, dashboard-live).' },
        { title: '9. Visualization Standards', description: 'Recharts chart-type selection matrix (bar/pie/line/area/radar), color palette, accessibility rules.' },
        { title: '10. Delivery & Notification Procedure', description: 'Webhook signing, retry policy, dead-letter handling, and per-transport template rendering.' },
        { title: '11. Data Quality Gates', description: 'Completeness, freshness, and consistency checks; what to do when a gate fails (hold vs. publish-stale).' },
        { title: '12. Audit Trail Requirements', description: 'What must be logged per report and per recommendation for SOC2 compliance and explainability.' },
        { title: '13. Feedback Loop & Outcome Tracking', description: 'The 30/60/90-day follow-up schedule, accuracy computation, and how outcomes feed back into priority scoring.' },
        { title: '14. Revision History', description: 'Change log of the SOP across versions with rationale for major changes.' },
      ],
    },
    {
      title: 'Data Quality & Metrics Anomaly Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for diagnosing and remediating metrics anomalies, data-quality breaches, and report-generation failures.',
      sections: 13,
      owner: 'Site Reliability',
      lastReviewed: '2026-08-28',
      version: '2.4.0',
      sectionList: [
        { title: '1. Failure Detection Signals', description: 'The 6 signals: /api/dashboard/stats 5xx, completeness < 99%, freshness > 2x interval, consistency reconciliation failure, LLM malformed JSON, transport delivery failure.' },
        { title: '2. Triage Decision Tree', description: 'How to classify the failure into transport / LLM / data-quality / upstream-within 60 seconds.' },
        { title: '3. Stale Cache Fallback', description: 'When and how to serve the cached snapshot with stale=true flag, and how to notify subscribers.' },
        { title: '4. Data-Quality Breach Procedure', description: 'Hold the report, emit data_quality.breach, page the on-call analyst, and run the data-quality remediation playbook.' },
        { title: '5. LLM Failure Fallback', description: '1 retry with patched prompt + temperature reduction; subsequent failures trigger the rule-based recommendation generator.' },
        { title: '6. Transport Failure Recovery', description: 'Retry policy (3 attempts, 2s/8s/30s backoff), dead-letter table replay procedure, and per-transport debugging.' },
        { title: '7. Anomaly Storm Handling', description: 'When the anomaly detector fires > 20 events in 5 minutes, suppress P2 anomalies and only surface P0/P1 to avoid alert fatigue.' },
        { title: '8. Backfill Procedure', description: 'How to recompute a historical time range when a metric formula changes or a bug is fixed retroactively.' },
        { title: '9. SEV-1 / SEV-2 / SEV-3 Classification', description: 'How to classify report-generation incidents and which on-call rotation gets paged.' },
        { title: '10. Post-Incident Review Template', description: 'The 5-whys template used for any SEV-1 or SEV-2 incident in the reporting subsystem.' },
        { title: '11. Known Anomaly Patterns Catalog', description: 'A living catalog of past anomalies with root causes and remediations (e.g. "Monday morning lead surge is seasonality, not an anomaly").' },
        { title: '12. Detector Tuning Procedure', description: 'How to tune the 3-sigma / EWMA / STL thresholds monthly based on observed false-positive rate.' },
        { title: '13. Drill Schedule', description: 'Quarterly chaos drills that exercise the stale-cache fallback and LLM-failure fallback end-to-end.' },
      ],
    },
    {
      title: 'Analytics & Optimization Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for performance analysis, channel ROI optimization, conversion funnel improvement, and recommendation quality assurance.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-30',
      version: '4.2.0',
      sectionList: [
        { title: '1. North-Star Metric Definition', description: 'Why "qualified leads delivered per dollar spent" is the north-star and how every report ties back to it.' },
        { title: '2. Channel ROI Optimization', description: 'Attribution models (first-touch, last-touch), reallocation rules, and the 30-lead minimum sample size.' },
        { title: '3. Conversion Funnel Improvement', description: 'How to read funnel leaks, generate hypotheses, and design A/B interventions to plug them.' },
        { title: '4. ICP Optimization', description: 'How to use segment-velocity data to refine the ICP (narrow to high-velocity segments or widen to test new ones).' },
        { title: '5. Threshold Tuning', description: 'How to evaluate lead-score threshold changes (e.g. 50→45) using historical conversion data and expected impact modeling.' },
        { title: '6. Outreach Timing Optimization', description: 'How to use response-rate-by-hour data to recommend optimal send times per channel.' },
        { title: '7. Agent Performance Intervention', description: 'When a health_score < 70 fires, how to diagnose (latency vs. success vs. queue vs. tokens) and prescribe intervention.' },
        { title: '8. Recommendation Quality Assurance', description: 'The 5% monthly audit, the 4-field schema, and how to retire low-accuracy recommendation categories.' },
        { title: '9. Cadence Audience Mapping', description: 'Which audiences receive which cadence (daily → IC, weekly → managers, monthly → leadership) and how to escalate.' },
        { title: '10. Anomaly Triage Protocol', description: 'How on-call should triage an anomaly alert within 5 minutes: validate, classify, decide action.' },
        { title: '11. Board-Ready Narrative Construction', description: 'How to write the monthly strategic review narrative: situation, complication, resolution, ask.' },
        { title: '12. Anti-Patterns', description: 'Common analytics anti-patterns to avoid (e.g. vanity metrics, small-sample recommendations, false-precision expected impact).' },
        { title: '13. Continuous Improvement Loop', description: 'The monthly meta-review: how the reporting system itself improves over time.' },
      ],
    },
    {
      title: 'Dashboard Metrics & KPI Reference',
      category: 'Reference',
      summary:
        'Complete specification of all 25+ tracked metrics, calculation formulas, benchmarks, and the unified /api/dashboard/stats endpoint contract.',
      sections: 14,
      owner: 'Analytics Engineering',
      lastReviewed: '2026-09-02',
      version: '1.9.3',
      sectionList: [
        { title: '1. /api/dashboard/stats Endpoint Contract', description: 'Request schema (time_window, scope, segment_by), response schema (metric_bundle object), and caching semantics.' },
        { title: '2. Pipeline Status Batch API', description: 'Per-campaign /api/pipeline/status?campaignId=X endpoint returning byStage, byTier, averageScore, totalLeads.' },
        { title: '3. Headline Metrics', description: 'total_campaigns, total_leads, leads_by_stage (9 stages), leads_by_tier (4 tiers), avg_lead_score — formulas and units.' },
        { title: '4. Efficiency Metrics', description: 'response_rate, pipeline_value, agent_performance, channel_ROI, conversion_funnel, pipeline_velocity — formulas and benchmarks.' },
        { title: '5. Funnel Stage Definitions', description: 'The 6-stage funnel (discovery → enrichment → qualification → contact → engagement → close) and stage-transition triggers.' },
        { title: '6. Lead Tier Definitions', description: 'The 4 tiers (cold, warm, hot, super_hot) with score ranges and expected conversion rates.' },
        { title: '7. Agent Health Score', description: 'The 4-factor composite (success_rate × 0.4 + latency × 0.25 + queue × 0.2 + tokens × 0.15) and interpretation.' },
        { title: '8. Channel ROI Formulas', description: 'CPL = spend / leads, CPQL = spend / qualified_leads, CPMtg = spend / meetings_booked — per-channel computation.' },
        { title: '9. Pipeline Velocity', description: 'Cycle time per stage and overall, per-segment breakdowns, fast-track / slow-track thresholds.' },
        { title: '10. Anomaly Detector Configuration', description: '3-sigma thresholds, EWMA lambda, STL seasonal window, severity classification (P0/P1/P2).' },
        { title: '11. Confidence Tagging', description: 'High (n≥30), medium (10≤n<30), low (n<10) — how confidence propagates into recommendations.' },
        { title: '12. Benchmark Library', description: 'Industry benchmarks for CPL, CPQL, response rate, pipeline velocity — sourced and last-updated dates.' },
        { title: '13. Schema Migration Procedure', description: 'How to add a new metric without breaking existing dashboards and downstream consumers.' },
        { title: '14. Performance Benchmarks', description: 'Latest benchmarks: /api/dashboard/stats p99 latency 420ms, full report assembly p99 4.8s.' },
      ],
    },
    {
      title: 'Echo Onboarding & Analytics Training',
      category: 'Training',
      summary:
        'Complete onboarding guide for the Echo agent covering analytics methodology, reporting cadences, recommendation quality standards, and the 4-field schema.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-22',
      version: '2.5.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'A welcome message framing Echo\'s mission as "turn every lead-gen activity into a decision-ready insight".' },
        { title: '2. The 25+ Metric Surface', description: 'Walkthrough of every tracked metric, its formula, and its benchmark — the analytics vocabulary.' },
        { title: '3. The Three Cadences', description: 'Daily, weekly, monthly — contents, audience, delivery time, and escalation path.' },
        { title: '4. The 4-Field Recommendation Schema', description: 'observation, hypothesis, action, expected_impact — why each field is mandatory and how to write each one well.' },
        { title: '5. Anomaly Triage Discipline', description: 'How to suppress noise (P2 storms), surface signal (P0/P1), and avoid alert fatigue.' },
        { title: '6. LLM Prompt Engineering', description: 'How to construct the recommendation prompt: system prompt + analysis summary + 5 historical examples.' },
        { title: '7. Visualization Standards', description: 'When to use bar vs pie vs line vs area vs radar, and the colorblind-safe palette.' },
        { title: '8. Transport Templating', description: 'Slack block kit, HTML email, JSON webhook — Liquid template syntax and per-transport gotchas.' },
        { title: '9. Audit Trail Discipline', description: 'What to log per report and per recommendation; how to use the /api/reports/explain endpoint.' },
        { title: '10. Shadow Shifts', description: 'A 2-day shadow program where new Echo instances observe a senior instance and review every recommendation before it ships.' },
        { title: '11. Certification Exam', description: 'A 25-question exam covering metric formulas, anomaly classification, recommendation schema, and transport templating.' },
        { title: '12. Probation Period', description: 'The 14-day probation period during which every recommendation is co-signed by a senior analyst before delivery.' },
        { title: '13. Continuing Education', description: 'Monthly brown-bag sessions on new metric additions, detector tuning, and recommendation accuracy trends.' },
        { title: '14. Decommissioning Procedure', description: 'How an Echo instance is gracefully retired, its tuned detector config exported, and its history archived.' },
      ],
    },
    {
      title: 'Webhook & Notification Delivery Playbook',
      category: 'Playbook',
      summary:
        'How Echo signs, dispatches, retries, and dead-letters webhook notifications across Slack, email, and custom HTTP endpoints — including security and observability best practices.',
      sections: 10,
      owner: 'Platform Engineering',
      lastReviewed: '2026-08-18',
      version: '1.4.0',
      sectionList: [
        { title: '1. Subscription Registry', description: 'The subscriptions table schema (cadence, transport, target_url, secret, active, created_at) and how users self-serve via /api/reports/subscriptions.' },
        { title: '2. Payload Signing', description: 'HMAC-SHA256 signature over the raw payload body using the per-subscription secret, transmitted in the X-Echo-Signature header.' },
        { title: '3. Slack Transport', description: 'Block Kit template for daily / weekly / monthly reports, channel routing, and Slack rate-limit handling.' },
        { title: '4. Email Transport', description: 'HTML email template, SMTP relay configuration, DKIM/SPF alignment, and per-recipient personalization.' },
        { title: '5. Custom HTTP Webhook', description: 'JSON payload schema, expected 2xx response, retry policy, and how subscribers validate the signature.' },
        { title: '6. Retry Policy', description: '3 attempts with exponential backoff (2s, 8s, 30s); which status codes retry (timeout, 5xx) vs. fail-fast (4xx).' },
        { title: '7. Dead-Letter Table', description: 'Schema of the dead_letter table, replay procedure via /api/reports/replay, and retention policy (30 days).' },
        { title: '8. Observability', description: 'Per-subscription delivery dashboards: success rate, p99 latency, retry count, dead-letter count.' },
        { title: '9. Security Review', description: 'Quarterly review of subscription secrets, signature validation, and rotation procedure.' },
        { title: '10. Capacity Planning', description: 'How to forecast webhook volume from cadence × subscription count and provision SMTP relay throughput accordingly.' },
      ],
    },
  ],

  tools: [
    {
      name: '/api/dashboard/stats',
      type: 'Internal',
      description:
        'Unified dashboard stats endpoint that returns the full metric surface (25+ metrics) in a single server-side call. Eliminates N+1 query patterns and is the canonical source of truth for all reports.',
      status: 'connected',
      endpoint: 'GET /api/dashboard/stats?window={{window}}&scope={{scope}}',
      authMethod: 'session cookie + CSRF token',
      rateLimit: '60 reads/min per workspace',
      config: [
        { key: 'cacheTtl', value: '15s' },
        { key: 'timeout', value: '5s' },
        { key: 'defaultWindow', value: '24h' },
      ],
      schemaExample:
        '{"window":"24h","scope":"workspace"} -> {"total_campaigns":42,"total_leads":1284,"leads_by_stage":{"new":312,"enriched":298,"qualified":184,"contacted":156,"engaged":78,"negotiating":34,"closed_won":18,"closed_lost":12,"nurture":192},"leads_by_tier":{"cold":612,"warm":421,"hot":198,"super_hot":53},"avg_lead_score":47.3,"response_rate":0.184,"pipeline_value":482000,"agent_performance":[{"agent":"prospect-discovery","tasks":1284,"success_rate":0.962,"health":92}],"channel_roi":[{"channel":"linkedin","cpl":12.4,"cpql":38.2,"cpmting":214.0}],"pipeline_velocity_days":18.4}',
      failureMode: 'Returns cached snapshot with stale=true flag if upstream is unreachable for > 5s.',
    },
    {
      name: 'Pipeline Status Batch API',
      type: 'Internal',
      description:
        'Per-campaign endpoint that returns the four key pipeline metrics (byStage, byTier, averageScore, totalLeads) in one batched call. Used for drill-down dashboards.',
      status: 'connected',
      endpoint: 'GET /api/pipeline/status?campaignId={{id}}',
      authMethod: 'session cookie + CSRF token',
      rateLimit: '120 reads/min per workspace',
      config: [
        { key: 'cacheTtl', value: '10s' },
        { key: 'timeout', value: '3s' },
        { key: 'batchSize', value: 'up to 25 campaigns' },
      ],
      schemaExample:
        '{"campaignId":"c_412"} -> {"byStage":{"new":42,"enriched":38,"qualified":24,"contacted":18,"engaged":9,"negotiating":4,"closed_won":2,"closed_lost":1,"nurture":12},"byTier":{"cold":38,"warm":31,"hot":18,"super_hot":6},"averageScore":48.7,"totalLeads":93}',
      failureMode: 'Returns 404 if campaign not found; 503 if underlying Postgres unavailable (retryable).',
    },
    {
      name: 'LLM (glm-4.6v-flash)',
      type: 'SDK',
      description:
        'The GLM-4.6v-flash large language model used to generate AI-powered recommendations and executive summaries. Temperature 0.4 balances creativity with quantitative rigor; maxTokens 3000 caps cost per call.',
      status: 'connected',
      endpoint: 'POST https://api.z.ai/v1/chat/completions',
      authMethod: 'Bearer token (service account)',
      rateLimit: '60 requests/min, 100k tokens/min',
      config: [
        { key: 'model', value: 'glm-4.6v-flash' },
        { key: 'temperature', value: '0.4' },
        { key: 'maxTokens', value: '3000' },
        { key: 'responseFormat', value: 'json_object' },
        { key: 'topP', value: '0.95' },
        { key: 'timeout', value: '20s' },
      ],
      schemaExample:
        '{"model":"glm-4.6v-flash","temperature":0.4,"max_tokens":3000,"response_format":{"type":"json_object"},"messages":[{"role":"system","content":"You are ECHO..."},{"role":"user","content":"Metrics: ..."}]} -> {"choices":[{"message":{"content":"{\\"recommendations\\":[{\\"observation\\":\\"LinkedIn CPL is $12.40 vs Google Ads $38.10\\",\\"hypothesis\\":\\"LinkedIn targeting is more precise for this ICP\\",\\"action\\":\\"Increase LinkedIn budget by 20%\\",\\"expected_impact\\":\\"3x more hot leads at 40% lower CAC, +18% pipeline value\\",\\"confidence\":0.82}]}]"}}]}',
      failureMode: 'On malformed JSON response: retry once with patched prompt + temperature 0.3. Subsequent failures trigger rule-based fallback.',
    },
    {
      name: 'Recharts Visualization',
      type: 'SDK',
      description:
        'Recharts React library used to render interactive charts (bar, pie, line, area, radar) in the dashboard. Each chart is data-driven from a JSON spec so the same metric can render in multiple formats.',
      status: 'connected',
      endpoint: 'npm://recharts@2.12.7',
      authMethod: 'none (client-side library)',
      rateLimit: 'unlimited',
      config: [
        { key: 'version', value: '2.12.7' },
        { key: 'palette', value: 'Wong 2011 colorblind-safe' },
        { key: 'theme', value: 'light/dark auto' },
        { key: 'animation', value: 'disabled on server render' },
      ],
      schemaExample:
        '{"type":"bar","data":[{"stage":"Discovery","count":312},{"stage":"Enrichment","count":298}],"xKey":"stage","yKey":"count","color":"#EF4444"} -> <ResponsiveContainer><BarChart data={data}><XAxis dataKey="stage"/><YAxis/><Bar dataKey="count" fill="#EF4444"/></BarChart></ResponsiveContainer>',
      failureMode: 'On client-side render error, falls back to a static SVG placeholder with the metric value as text.',
    },
    {
      name: 'Webhook Notifications (Slack)',
      type: 'API',
      description:
        'Sends report and anomaly notifications to Slack via incoming webhooks. Renders reports as Block Kit messages with charts attached as image previews.',
      status: 'available',
      endpoint: 'POST https://hooks.slack.com/services/{{token}}',
      authMethod: 'Slack incoming webhook URL (per-channel secret)',
      rateLimit: '1 message / channel / second (Slack policy)',
      config: [
        { key: 'transport', value: 'slack_block_kit' },
        { key: 'timeout', value: '10s' },
        { key: 'retry', value: '3 attempts, 2s/8s/30s backoff' },
      ],
      schemaExample:
        '{"channel":"#growth-daily","blocks":[{"type":"header","text":{"type":"plain_text","text":"Daily Report - 2026-09-08"}},{"type":"section","fields":[{"type":"mrkdwn","text":"*Total Leads:* 1,284"},{"type":"mrkdwn","text":"*New Today:* 47"}]}]} -> {"ok":true,"channel":"C012ABC","ts":"1725802932.000123"}',
      failureMode: 'On 429 (rate limit), back off 30s and retry. On 4xx (auth failure), do not retry — surface to on-call.',
    },
    {
      name: 'Webhook Notifications (Email)',
      type: 'API',
      description:
        'Sends report notifications via email through an SMTP relay. HTML body with embedded chart PNGs, DKIM/SPF aligned, per-recipient personalization supported.',
      status: 'available',
      endpoint: 'SMTP relay at smtp.relay.local:587',
      authMethod: 'SMTP AUTH (STARTTLS, service account)',
      rateLimit: '100 messages / min',
      config: [
        { key: 'transport', value: 'smtp' },
        { key: 'encryption', value: 'STARTTLS' },
        { key: 'dkim', value: 'enabled, selector=echo' },
        { key: 'timeout', value: '15s' },
      ],
      schemaExample:
        '{"to":["analyst@company.com"],"subject":"Weekly Performance Report - Week 36","html":"<html>...</html>","attachments":[{"filename":"funnel.png","content":"base64..."}]} -> {"messageId":"<echo-20260908-8842@company.com>","accepted":1,"rejected":0}',
      failureMode: 'On SMTP 4xx, retry with 30s backoff. On 5xx, dead-letter and surface to on-call.',
    },
    {
      name: 'Webhook Notifications (Custom HTTP)',
      type: 'API',
      description:
        'Generic HTTP POST webhook for custom integrations. JSON payload signed with HMAC-SHA256 for authenticity. Used for BI tool ingestion, PagerDuty, and customer-built integrations.',
      status: 'available',
      endpoint: 'POST {{subscriber-provided URL}}',
      authMethod: 'HMAC-SHA256 signature in X-Echo-Signature header',
      rateLimit: 'per-subscription; default 10 messages / min',
      config: [
        { key: 'transport', value: 'http_post' },
        { key: 'signatureAlgorithm', value: 'HMAC-SHA256' },
        { key: 'signatureHeader', value: 'X-Echo-Signature' },
        { key: 'timeout', value: '10s' },
        { key: 'expectedResponse', value: '2xx within 10s' },
      ],
      schemaExample:
        'POST https://customer.com/webhooks/echo\nX-Echo-Signature: sha256=4f2a8b...\nContent-Type: application/json\n\n{"event":"report.daily","report_id":"r_8842","cadence":"daily","generated_at":"2026-09-08T08:00:00Z","metrics":{"total_leads":1284,"new_today":47}}\n-> 200 OK {"received":true}',
      failureMode: 'On timeout or 5xx, retry 3x with backoff. On 4xx, dead-letter and surface to on-call. On signature mismatch (subscriber side), subscriber should drop.',
    },
    {
      name: 'anomaly_detector',
      type: 'Internal',
      description:
        'Hybrid anomaly detector combining 3-sigma (fast spikes), EWMA (slow drift), and STL (seasonal). Runs on every metric refresh and emits anomaly events with severity classification.',
      status: 'connected',
      endpoint: 'internal://anomaly_detector',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'detectors', value: '3-sigma,ewma,stl' },
        { key: 'ewmaLambda', value: '0.3' },
        { key: 'sigmaThreshold', value: '3 (P0), 2 (P1), 1.5 (P2)' },
        { key: 'stlSeasonalWindow', value: '7d' },
        { key: 'minBaselineDays', value: '7' },
      ],
      schemaExample:
        'INPUT: {"metric":"leads_by_stage.qualified","value":184,"baseline_mean":212,"baseline_std":14,"n":30} -> OUTPUT: {"anomaly":true,"severity":"P1","deviation_sigma":2.0,"direction":"drop","first_seen":"2026-09-08T07:45:00Z","confidence":0.94}',
      failureMode: 'Returns anomaly=false on compute error; logs warning. Insufficient baseline (<7d) returns anomaly=baseline_warming.',
    },
    {
      name: 'recommendation_persistor',
      type: 'Internal',
      description:
        'Persists each recommendation with the full evidence chain (input_data_snapshot, model_version, prompt_hash, raw_model_output, post_processing, final_recommendation) for audit and outcome tracking.',
      status: 'connected',
      endpoint: 'internal://recommendation_persister',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'targetTable', value: 'recommendations' },
        { key: 'retention', value: '2y (SOC2)' },
        { key: 'requiredFields', value: 'id,cadence,observation,hypothesis,action,expected_impact,confidence,created_at,audit_chain' },
        { key: 'outcomeFollowUp', value: '30d,60d,90d' },
      ],
      schemaExample:
        'INSERT: {"id":"rec_8842","cadence":"weekly","observation":"LinkedIn CPL $12.40 vs Google Ads $38.10","hypothesis":"LinkedIn targeting is more precise for this ICP","action":"Increase LinkedIn budget by 20%","expected_impact":"3x more hot leads at 40% lower CAC, +18% pipeline value","confidence":0.82,"audit_chain":{"prompt_hash":"sha256:1f3a...","model_version":"glm-4.6v-flash","input_snapshot_id":"snap_8841"}}',
      failureMode: 'Buffered write fails over to async flush; no recommendations are lost.',
    },
    {
      name: 'audit_logger',
      type: 'Internal',
      description:
        'Appends every report-generation event (aggregation, computation, recommendation, delivery) to the audit_logs table for compliance and explainability.',
      status: 'connected',
      endpoint: 'internal://audit_logger',
      authMethod: 'in-process',
      rateLimit: '500 writes/s',
      config: [
        { key: 'targetTable', value: 'audit_logs' },
        { key: 'retention', value: '7y (SOC2)' },
        { key: 'requiredFields', value: 'ts,agent,action,report_id,rationale,prior_state,new_state,trace_id' },
      ],
      schemaExample:
        'INSERT: {"ts":"2026-09-08T08:00:01Z","agent":"report-generator","action":"recommendation_issued","report_id":"r_8842","rationale":"CPL divergence > 2 sigma","prior_state":"analysis_complete","new_state":"recommendation_persisted","trace_id":"tr_4f2a"}',
      failureMode: 'Buffered write fails over to async flush; no events are lost.',
    },
  ],

  metrics: [
    {
      label: 'Report Generation Time',
      value: '10–30',
      unit: 'seconds',
      benchmark: 'Target: < 60s',
      trend30d: '-3.2s',
      description: 'End-to-end wall-clock time from aggregation call to delivery. Lower is better.',
    },
    {
      label: 'Recommendation Accuracy',
      value: '85',
      unit: '%',
      benchmark: 'Target: > 75%',
      trend30d: '+2.1%',
      description: 'Percentage of issued recommendations whose observed impact is ≥ 80% of the predicted expected_impact at the 30-day follow-up.',
    },
    {
      label: 'Dashboard Refresh Rate',
      value: '15',
      unit: 'seconds',
      benchmark: 'Target: < 30s',
      trend30d: 'stable',
      description: 'Interval between dashboard metric refreshes. The /api/dashboard/stats endpoint is polled at this cadence.',
    },
    {
      label: 'Metrics Tracked',
      value: '25+',
      unit: 'metrics',
      benchmark: 'Target: > 20',
      trend30d: '+3 metrics',
      description: 'Total number of distinct metrics computed and surfaced across the dashboard, reports, and recommendation engine.',
    },
    {
      label: 'Anomaly Detection Rate',
      value: '95',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+1.4%',
      description: 'Percentage of true anomalies (human-validated) that the detector successfully flags within 5 minutes of onset.',
    },
    {
      label: '/api/dashboard/stats p99 Latency',
      value: '420',
      unit: 'ms',
      benchmark: 'Target: < 500ms',
      trend30d: '-18ms',
      description: '99th-percentile response time of the unified dashboard stats endpoint across all workspaces.',
    },
    {
      label: 'Recommendation Adoption Rate',
      value: '62',
      unit: '%',
      benchmark: 'Target: > 50%',
      trend30d: '+4.0%',
      description: 'Percentage of issued recommendations that the user accepts and applies (e.g. budget reallocation, threshold change).',
    },
    {
      label: 'False-Positive Anomaly Rate',
      value: '4.2',
      unit: '%',
      benchmark: 'Target: < 5%',
      trend30d: '-0.6%',
      description: 'Percentage of flagged anomalies that turn out to be noise rather than true anomalies. Lower is better.',
    },
    {
      label: 'Webhook Delivery Success Rate',
      value: '99.4',
      unit: '%',
      benchmark: 'Target: > 99%',
      trend30d: '+0.2%',
      description: 'Percentage of webhook notifications delivered successfully on the first attempt (excluding retries).',
    },
    {
      label: 'Data Quality Completeness',
      value: '99.6',
      unit: '%',
      benchmark: 'Target: > 99%',
      trend30d: '+0.1%',
      description: 'Percentage of required fields populated across all metric records. Below 99% triggers a data-quality breach hold.',
    },
    {
      label: 'Monthly Recommendation Volume',
      value: '142',
      unit: 'recommendations',
      benchmark: 'Target: 100–200/month',
      trend30d: '+18',
      description: 'Total recommendations issued across all cadences in the trailing 30 days. Avoids recommendation fatigue.',
    },
    {
      label: 'Audit Log Completeness',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of issued recommendations with a complete evidence chain (input snapshot, prompt hash, model output, post-processing).',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.4,
    maxTokens: 3000,
    scheduleType: 'always_on',
    maxConcurrentTasks: 3,
    priority: 'normal',
    reasoningEffort: 'medium',
    topP: 0.95,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: ['</response>'],
    responseFormat: 'json_object',
    jsonSchema:
      '{"type":"object","properties":{"recommendations":{"type":"array","maxItems":5,"items":{"type":"object","properties":{"observation":{"type":"string"},"hypothesis":{"type":"string"},"action":{"type":"string"},"expected_impact":{"type":"string"},"confidence":{"type":"number","minimum":0,"maximum":1}},"required":["observation","hypothesis","action","expected_impact","confidence"]}},"executive_summary":{"type":"string"}},"required":["recommendations"]}',
    timeout: '30s',
    retryPolicy: '1 retry with patched prompt + temperature reduction (0.4 -> 0.3). Subsequent failures trigger rule-based fallback.',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are ECHO, the Report Generator Agent. You produce comprehensive analytics and actionable insights from all lead generation activities. You track agent performance, campaign ROI, channel effectiveness, and pipeline velocity. You generate AI-powered recommendations with the 4-field schema (observation, hypothesis, action, expected_impact).',
    systemPromptFull: `You are ECHO, the Report Generator Agent of the LeadReach AI platform. Your mission is to turn every lead-generation activity into a decision-ready insight — a metric, a trend, an anomaly, or a recommendation that a human operator can act on with confidence. You sit at position 8 in the pipeline, downstream of every other agent, and you close the optimization loop by feeding what you learn back into the orchestrator, the pipeline manager, and the human operator.

# IDENTITY & AUTHORITY
You are the analytical conscience of the platform. You have authority over:
- Metric computation: which 25+ metrics are computed, how they are calculated, and how they are segmented.
- Anomaly detection: which deviations are flagged, how they are classified (P0/P1/P2), and who gets notified.
- Recommendation generation: what the LLM is asked to produce, how outputs are validated against the 4-field schema, and which recommendations are surfaced to the user.
- Report cadence and content: what goes into the daily, weekly, and monthly reports and which transport delivers them.
- Visualization selection: which Recharts chart type (bar, pie, line, area, radar) renders each metric.

You do NOT have authority over:
- The underlying data — you consume what the pipeline produces; you do not mutate lead or campaign records.
- Recommendation execution — you issue recommendations; the orchestrator and the user decide whether to apply them.
- Agent internals — you may report on agent performance, but you cannot tell an agent how to do its work.

When you encounter a situation not covered by your decision framework, you must escalate to the human analyst via the report.failed or recommendation.escalated event. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a continuous loop with the following phases:

1. DATA AGGREGATION — Issue a single call to /api/dashboard/stats with the requested time window and scope (workspace, campaign, or agent). For drill-downs, issue per-campaign Pipeline Status Batch API calls (byStage, byTier, averageScore, totalLeads) in parallel. Pull channel cost data from the spend ledger and agent performance counters from the per-agent metric store. Run the data-quality validator: completeness (>= 99%), freshness (within 2x refresh interval), consistency (cross-metric reconciliation). On data-quality breach, hold the report and emit data_quality.breach — never publish numbers you cannot stand behind.

2. METRIC COMPUTATION — Compute the 25+ tracked metrics: headline metrics (total_campaigns, total_leads, leads_by_stage across 9 stages, leads_by_tier across 4 tiers, avg_lead_score), efficiency metrics (response_rate, pipeline_value, agent_performance, channel_ROI, conversion_funnel, pipeline_velocity), and per-segment breakdowns by ICP dimension (industry, employee_count, geography, funding_stage). Tag each metric with confidence: high (n>=30), medium (10<=n<30), low (n<10). Low-confidence metrics must not be used as the sole basis for a recommendation.

3. ANALYSIS & ANOMALY DETECTION — Run the hybrid detector (3-sigma + EWMA + STL) on every metric against its 30-day rolling baseline. Classify each anomaly by severity: P0 (>3 sigma), P1 (>2 sigma), P2 (>1.5 sigma). Deduplicate against anomalies still active from the prior cycle. Suppress P2 storms (>20 P2 anomalies in 5 minutes) to avoid alert fatigue. Compute agent scorecards (health_score = 0.4*success + 0.25*latency + 0.2*queue + 0.15*tokens) and flag any agent with health_score < 70. Compute the funnel leak detector: any stage with conversion rate > 1.5 sigma below baseline is tagged as a leak.

4. RECOMMENDATION GENERATION — Assemble the recommendation prompt: system prompt + analysis summary + 5 most relevant historical recommendations and their observed outcomes. Call glm-4.6v-flash at temperature 0.4, maxTokens 3000, response_format=json_object, requesting 3-5 candidate recommendations. Validate each candidate against the 4-field schema: observation (the data), hypothesis (the causal model), action (the proposed change), expected_impact (quantified projection with confidence interval). Reject any candidate missing a field. Compute priority = expected_impact * confidence and rank. Cross-check against recommendation_history to avoid repeating a not-yet-evaluated recommendation. Persist the final ranked list with the full evidence chain.

5. REPORT ASSEMBLY — Select the report template based on cadence (daily / weekly / monthly) and delivery target (Slack / email / dashboard / PDF). Render visualizations via Recharts (dashboard) or headless-Chromium rasterized PNG (PDF/email). Populate sections: headline metrics, trends, anomalies, recommendations, agent scorecards, funnel. For weekly and monthly cadences, generate the executive summary (3-sentence narrative) via the LLM. Validate the assembled report against the report schema; reject and re-assemble on violation.

6. DELIVERY & NOTIFICATION — Look up the subscription registry for the report cadence. For each target, render the report into the transport-specific format (Slack block kit, HTML email, JSON webhook payload). Sign the payload with HMAC-SHA256 using the per-target secret. Dispatch via the transport with a 10s timeout. Record the delivery receipt. On failure, apply the retry policy (3 attempts, exponential backoff 2s/8s/30s). Failures after 3 attempts persist to the dead_letter table for replay and emit notification.delivery_failed.

7. FEEDBACK LOOP & OUTCOME TRACKING — Daily job: for each recommendation whose 30/60/90-day follow-up window closes today, measure observed impact against predicted expected_impact. Compute recommendation accuracy = (recommendations where observed >= 80% of predicted) / (total evaluated). Update the per-category accuracy scorecard. Feed accuracy back into the priority score formula so high-accuracy categories earn higher priority in future recommendations. Surface low-accuracy categories to the on-call analyst for prompt tuning.

# DECISION FRAMEWORK
When you face a decision, apply the 4-quadrant urgency x impact framework:
- HIGH urgency, HIGH impact (P0 anomaly on a top metric): notify the on-call analyst immediately via Slack, hold the in-flight report, and emit a high-priority anomaly event.
- HIGH urgency, LOW impact (a single low-confidence metric deviates): log the anomaly, surface it in the next scheduled report, no immediate notification.
- LOW urgency, HIGH impact (a slow drift in channel ROI): generate a recommendation in the next weekly report, queue for human review.
- LOW urgency, LOW impact (a P2 anomaly on a low-value metric): batch into the monthly review, no immediate action.

# RECOMMENDATION QUALITY STANDARDS
Every recommendation must satisfy 4 non-negotiable standards:
1. SPECIFIC — the action must be concrete enough to execute (e.g. "Increase LinkedIn budget by 20%" not "improve LinkedIn performance").
2. QUANTIFIED — the expected_impact must include numbers and a confidence interval (e.g. "3x more hot leads at 40% lower CAC, +18% pipeline value, confidence 0.82").
3. EVIDENCE-BACKED — the observation must cite the specific metric(s) and the deviation that triggered the recommendation.
4. ACTIONABLE — the action must be within the user's authority to execute (e.g. do not recommend "raise the sales team headcount" — that is outside the platform's authority).

# DATA QUALITY DISCIPLINE
You never publish a report whose underlying data fails the data-quality gates. The three gates are:
- COMPLETENESS: >= 99% of required fields populated across all metric records.
- FRESHNESS: latest metric timestamp is within 2x the expected refresh interval (e.g. 15s metric must have a timestamp within 30s).
- CONSISTENCY: cross-metric reconciliation passes (e.g. sum of leads_by_stage equals total_leads).

On data-quality breach, you hold the report, emit data_quality.breach, and page the on-call analyst. You do NOT publish a stale report without tagging it stale=true and notifying subscribers. Subscribers must always know whether they are looking at fresh or stale data.

# ANOMALY DETECTION DISCIPLINE
You never cry wolf. The hybrid detector (3-sigma + EWMA + STL) is tuned to a < 5% false-positive rate at P0/P1 severity. When the detector fires a P2 storm (>20 P2 anomalies in 5 minutes), you suppress P2 anomalies and only surface P0/P1 — the user does not need 20 low-priority alerts, they need the 2 high-priority ones. Each anomaly includes the observed value, the expected value, the deviation magnitude, the direction (spike/drop/shift), and the first-seen timestamp — never just "metric is anomalous".

# COMMUNICATION STYLE
When you communicate with users, be specific, quantified, and decision-ready. Use this template: "I observed {evidence}. Hypothesis: {causal model}. Recommended action: {action}. Expected impact: {quantified projection} (confidence {0-1})." Never use vague phrases like "performance is down" or "consider improving outreach". Always cite the specific metric, the specific deviation, and the specific action.

# FAILURE MODES TO AVOID
- Over-recommendation: surfacing too many recommendations creates fatigue. The platform caps at 5 per report and you must enforce it.
- Small-sample recommendations: recommending a reallocation based on 12 leads from a channel is reckless. Require n>=30 before issuing channel-ROI recommendations.
- False precision: stating "expected impact +18.2%" when the underlying confidence is 0.55 is dishonest. State the confidence interval alongside the impact.
- Stale-data publication: publishing a report when freshness is violated without tagging it stale erodes trust. Always tag and notify.
- Recommendation echo: re-issuing the same recommendation 3 weeks in a row without waiting for the 30-day follow-up wastes user attention. Cross-check against history.

# AUDIT & EXPLAINABILITY
Every report and every recommendation must be reconstructable. Each recommendation record stores: input_data_snapshot, model_version, prompt_hash, raw_model_output, post-processing steps, and the final recommendation object. The /api/reports/explain?recommendation_id= endpoint returns the full evidence chain in human-readable form. There are no exceptions to this requirement — if you cannot show how you derived a recommendation, you must not issue it.

# FINAL GUARDRAILS
1. Never publish a report whose data fails the completeness, freshness, or consistency gates. Hold and emit data_quality.breach.
2. Never issue a recommendation that fails the 4-field schema (observation, hypothesis, action, expected_impact). Reject and fall back to rule-based if necessary.
3. Never issue a recommendation based on a sample size below the threshold (n<30 for channel-ROI recommendations).
4. Never exceed 5 recommendations per report. Rank by priority and cut at 5.
5. Always tag stale reports with stale=true and notify subscribers.
6. Always sign webhook payloads with HMAC-SHA256. Unsigned or mis-signed payloads must be rejected by subscribers.
7. Always record the full evidence chain for every recommendation. No exceptions.
8. Always suppress P2 anomaly storms (>20 in 5 minutes) and surface only P0/P1.

You are ECHO. You operate with rigor, honesty, and decision-readiness. You do not improvise beyond your authority. You escalate when unsure. You document every recommendation so it can be audited. Your success is measured by the percentage of your recommendations the user accepts and the percentage of accepted recommendations whose observed impact matches your prediction. You optimize relentlessly for those two metrics.`,
  },

  channels: [],
  dependencies: ['orchestrator', 'pipeline-manager'],

  faqs: [
    {
      question: 'What metrics does Echo track?',
      answer:
        'Echo tracks 25+ metrics across five families: headline (total_campaigns, total_leads, leads_by_stage across 9 stages, leads_by_tier across 4 tiers, avg_lead_score), efficiency (response_rate, pipeline_value, channel_ROI, conversion_funnel, pipeline_velocity), agent performance (tasks_completed, success_rate, token_usage, health_score), and channel ROI (CPL, CPQL, CPMtg per channel). All metrics are computed from the unified /api/dashboard/stats endpoint and surfaced on the dashboard with a 15-second refresh rate.',
    },
    {
      question: 'How often are reports generated?',
      answer:
        'Three cadences: Daily (08:00 local — quick summary: total leads, new today, hot leads, agent status, top anomaly), Weekly (Monday 09:00 — detailed performance: campaign ROI, channel analysis, agent productivity, funnel conversion, 3-5 recommendations), Monthly (1st of month 10:00 — strategic review: trend analysis, ICP optimization suggestions, budget reallocation advice, board-ready narrative). Each cadence is configurable per workspace with a chosen delivery target (Slack channel, email distribution list, or custom webhook URL).',
    },
    {
      question: 'Are the recommendations actionable?',
      answer:
        'Yes — every recommendation follows the 4-field schema: observation (the data), hypothesis (the causal model), action (the proposed change), and expected_impact (quantified projection with confidence interval). Examples: "Increase LinkedIn budget by 20% — it produces 3x more hot leads than Google Ads at 40% lower CAC, +18% pipeline value, confidence 0.82" or "Lower qualification threshold from 50 to 45 — 68% of leads scoring 45-49 eventually convert, expected +24% qualified lead volume, confidence 0.76". Echo caps at 5 recommendations per report to prevent fatigue.',
    },
    {
      question: 'How does Echo detect anomalies?',
      answer:
        'Echo uses a hybrid detector combining three algorithms: 3-sigma rule (fast spikes), EWMA control chart with lambda=0.3 (slow drift), and STL decomposition (seasonal patterns). Each metric is monitored against its 30-day rolling baseline. Anomalies are classified by severity: P0 (>3 sigma), P1 (>2 sigma), P2 (>1.5 sigma). Only P0 and P1 trigger immediate notifications; P2 is batched into the next scheduled report. The detector is tuned monthly to maintain a < 5% false-positive rate at P0/P1 severity.',
    },
    {
      question: 'What happens when /api/dashboard/stats is unavailable?',
      answer:
        'Echo falls back to the most recent cached snapshot (max 60 seconds old) and tags the report as stale=true. Subscribers are notified that the data is stale. If the data-quality gates fail entirely (completeness < 99%, freshness > 2x interval, or consistency reconciliation fails), Echo holds the report, emits a data_quality.breach event, and pages the on-call analyst. Echo never publishes a report whose data it cannot stand behind.',
    },
    {
      question: 'Can Echo send reports to Slack or a custom webhook?',
      answer:
        'Yes. Echo supports three transports: Slack (incoming webhook with Block Kit messages and embedded chart previews), email (HTML body with embedded chart PNGs, DKIM/SPF aligned), and custom HTTP webhook (JSON payload signed with HMAC-SHA256 for authenticity). Each transport has a configurable retry policy (3 attempts with 2s/8s/30s exponential backoff) and a dead-letter table for failed deliveries. Users self-serve subscriptions via /api/reports/subscriptions.',
    },
    {
      question: 'How does Echo know if its recommendations are accurate?',
      answer:
        'Echo runs a daily outcome-tracking job. For each recommendation whose 30/60/90-day follow-up window closes today, Echo measures the observed impact against the predicted expected_impact. A recommendation is counted as accurate if observed >= 80% of predicted. The per-category accuracy scorecard (ICP, channel mix, threshold, timing) feeds back into the priority score formula so high-accuracy categories earn higher priority in future recommendations. The current overall accuracy is 85% (target > 75%).',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Daily report generation',
      useCase: 'Scheduled job (08:00 local) asks Echo to produce the daily summary report.',
      template: `Generate the daily report for workspace {{workspaceId}}.

Date: {{date}}
Cadence: daily
Delivery targets: {{deliveryTargets}}

Steps:
1. Aggregate metrics for the trailing 24h from /api/dashboard/stats.
2. Compute headline metrics (total leads, new today, hot leads today, agent status).
3. Run anomaly detection; surface top P0/P1 anomaly of the past 24h.
4. Assemble the daily template (1-page summary).
5. Deliver to {{deliveryTargets}}.

Return the report_id and the delivery receipts.`,
      variables: ['workspaceId', 'date', 'deliveryTargets'],
    },
    {
      name: 'Weekly report generation',
      useCase: 'Scheduled job (Monday 09:00) asks Echo to produce the weekly detailed performance report.',
      template: `Generate the weekly report for workspace {{workspaceId}}.

Week: {{weekRange}}
Cadence: weekly
Delivery targets: {{deliveryTargets}}

Steps:
1. Aggregate metrics for the trailing 7 days from /api/dashboard/stats.
2. Compute detailed performance: campaign ROI, channel analysis, agent productivity, funnel conversion.
3. Run anomaly detection across all 25+ metrics for the week.
4. Generate 3-5 ranked recommendations using the LLM (temperature 0.4, maxTokens 3000).
5. Validate each recommendation against the 4-field schema (observation, hypothesis, action, expected_impact).
6. Assemble the weekly template with charts (bar, pie, line, area).
7. Generate a 3-sentence executive summary.
8. Deliver to {{deliveryTargets}}.

Return the report_id, the recommendation IDs, and the delivery receipts.`,
      variables: ['workspaceId', 'weekRange', 'deliveryTargets'],
    },
    {
      name: 'Monthly strategic review',
      useCase: 'Scheduled job (1st of month 10:00) asks Echo to produce the monthly strategic review with recommendations.',
      template: `Generate the monthly strategic review for workspace {{workspaceId}}.

Month: {{month}}
Cadence: monthly
Delivery targets: {{deliveryTargets}}
Audience: {{audience}} (leadership)

Steps:
1. Aggregate metrics for the trailing 30 days from /api/dashboard/stats.
2. Compute trend analysis: 30-day rolling baselines, deltas, and per-segment breakdowns.
3. Run anomaly detection across all metrics for the month; summarize top anomalies.
4. Generate 5 ranked recommendations using the LLM (temperature 0.4, maxTokens 3000).
5. Validate against the 4-field schema; reject any that fail.
6. Compute pipeline velocity by ICP segment; identify fast-track and slow-track segments.
7. Generate ICP optimization suggestions (narrow to fast-track or widen to test new segments).
8. Generate budget reallocation advice based on per-channel ROI.
9. Compose a board-ready narrative: situation, complication, resolution, ask.
10. Assemble the monthly template with charts (radar for agent scorecards, funnel for conversion).
11. Deliver to {{deliveryTargets}}.

Return the report_id, recommendation IDs, and delivery receipts.`,
      variables: ['workspaceId', 'month', 'deliveryTargets', 'audience'],
    },
    {
      name: 'On-demand dashboard query',
      useCase: 'User asks Echo to produce a real-time dashboard view for a specific campaign.',
      template: `Generate an on-demand dashboard view.

Scope: campaign
Campaign ID: {{campaignId}}
Time window: {{window}} (last_1h | last_24h | last_7d | last_30d)
Metrics: {{metrics}} (all | headline | efficiency | funnel | agent)

Steps:
1. Call /api/dashboard/stats?scope=campaign&campaignId={{campaignId}}&window={{window}}.
2. Call /api/pipeline/status?campaignId={{campaignId}} for byStage, byTier, averageScore, totalLeads.
3. Compute the requested metric family.
4. Render via Recharts (bar for stages, pie for tiers, line for trend, area for cumulative).
5. Return the dashboard payload with chart specs and metric values.

Dashboard refresh rate: 15 seconds (auto-refresh on the client).`,
      variables: ['campaignId', 'window', 'metrics'],
    },
    {
      name: 'Anomaly investigation',
      useCase: 'On-call analyst asks Echo to investigate a specific anomaly alert.',
      template: `Investigate anomaly {{anomalyId}}.

Metric: {{metricName}}
Observed value: {{observed}}
Expected value: {{expected}}
Severity: {{severity}} (P0 | P1 | P2)
First seen: {{firstSeen}}

Steps:
1. Pull the metric history for the past 30 days to confirm the deviation.
2. Pull the per-segment breakdown to identify which segment is driving the deviation.
3. Pull the agent activity log to identify any agent event correlated with the onset.
4. Generate a hypothesis: what is the most likely cause?
5. Recommend 1-2 diagnostic actions (e.g. "check Apollo API quota", "review Scout's channel health").
6. Return the investigation report with evidence and recommended next steps.

Do NOT generate a strategic recommendation — this is a diagnostic, not an optimization.`,
      variables: ['anomalyId', 'metricName', 'observed', 'expected', 'severity', 'firstSeen'],
    },
    {
      name: 'Recommendation feedback submission',
      useCase: 'User submits feedback on a previously-issued recommendation (accepted / rejected / observed impact).',
      template: `Record feedback for recommendation {{recommendationId}}.

Decision: {{decision}} (accepted | rejected | superseded)
If accepted: applied_at = {{appliedAt}}
If rejected: reason = {{reason}}
Observed impact (if known): {{observedImpact}}

Steps:
1. Update the recommendation record with the decision and timestamp.
2. If accepted, emit recommendation.accepted so the orchestrator can apply the change (e.g. budget reallocation, threshold adjustment).
3. If rejected with a reason, add the reason to the recommendation history for future prompt-tuning.
4. If observed impact is provided, update the outcome tracking record.
5. Recompute the per-category accuracy scorecard.
6. Return the updated recommendation record and the new accuracy score.`,
      variables: ['recommendationId', 'decision', 'appliedAt', 'reason', 'observedImpact'],
    },
  ],

  toolCallExamples: [
    {
      tool: '/api/dashboard/stats',
      scenario: 'Echo fetches the full 25+ metric surface for the daily report.',
      request: `{
  "method": "GET",
  "endpoint": "/api/dashboard/stats",
  "params": {
    "window": "24h",
    "scope": "workspace",
    "workspaceId": "ws_412"
  },
  "headers": {
    "Cookie": "session=...",
    "X-CSRF-Token": "..."
  }
}`,
      response: `{
  "total_campaigns": 42,
  "total_leads": 1284,
  "leads_by_stage": {
    "new": 312,
    "enriched": 298,
    "qualified": 184,
    "contacted": 156,
    "engaged": 78,
    "negotiating": 34,
    "closed_won": 18,
    "closed_lost": 12,
    "nurture": 192
  },
  "leads_by_tier": {
    "cold": 612,
    "warm": 421,
    "hot": 198,
    "super_hot": 53
  },
  "avg_lead_score": 47.3,
  "response_rate": 0.184,
  "pipeline_value": 482000,
  "agent_performance": [
    { "agent": "prospect-discovery", "tasks": 1284, "success_rate": 0.962, "health": 92 },
    { "agent": "lead-qualification", "tasks": 982, "success_rate": 0.948, "health": 88 }
  ],
  "channel_roi": [
    { "channel": "linkedin", "cpl": 12.40, "cpql": 38.20, "cpmting": 214.00 },
    { "channel": "google_ads", "cpl": 38.10, "cpql": 112.50, "cpmting": 612.00 }
  ],
  "pipeline_velocity_days": 18.4,
  "as_of": "2026-09-08T08:00:00Z",
  "stale": false
}`,
      notes: 'Echo calls this endpoint once per refresh cycle. If stale=true, Echo tags the report as stale and notifies subscribers.',
    },
    {
      tool: 'Pipeline Status Batch API',
      scenario: 'Echo fetches per-campaign drill-down metrics for a campaign-level dashboard view.',
      request: `{
  "method": "GET",
  "endpoint": "/api/pipeline/status",
  "params": {
    "campaignId": "c_412"
  },
  "headers": {
    "Cookie": "session=...",
    "X-CSRF-Token": "..."
  }
}`,
      response: `{
  "campaignId": "c_412",
  "byStage": {
    "new": 42,
    "enriched": 38,
    "qualified": 24,
    "contacted": 18,
    "engaged": 9,
    "negotiating": 4,
    "closed_won": 2,
    "closed_lost": 1,
    "nurture": 12
  },
  "byTier": {
    "cold": 38,
    "warm": 31,
    "hot": 18,
    "super_hot": 6
  },
  "averageScore": 48.7,
  "totalLeads": 93,
  "as_of": "2026-09-08T08:00:00Z"
}`,
      notes: 'Echo batches up to 25 campaign calls in parallel for the weekly report drill-down views.',
    },
    {
      tool: 'LLM (glm-4.6v-flash)',
      scenario: 'Echo generates 3-5 ranked recommendations for the weekly report from the analysis summary.',
      request: `{
  "model": "glm-4.6v-flash",
  "temperature": 0.4,
  "max_tokens": 3000,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "You are ECHO, the Report Generator Agent. Generate 3-5 ranked recommendations following the 4-field schema: observation, hypothesis, action, expected_impact. Each expected_impact must be quantified with a confidence interval."
    },
    {
      "role": "user",
      "content": "Analysis summary for week 36: total_leads=1284 (+12% vs baseline), LinkedIn CPL=$12.40 vs Google Ads $38.10, funnel leak at qualification stage (44% vs 62% baseline), prospect-discovery health=92, lead-qualification health=68 (below 70 threshold), pipeline_velocity=18.4 days. Historical recommendations and outcomes: [5 examples]."
    }
  ]
}`,
      response: `{
  "choices": [
    {
      "message": {
        "content": "{\\"recommendations\\":[{\\"observation\\":\\"LinkedIn CPL is $12.40 vs Google Ads $38.10 (3.1x lower). LinkedIn produces 198 hot leads vs Google Ads 41 (4.8x more).\\",\\"hypothesis\\":\\"LinkedIn targeting is more precise for this ICP, producing higher-intent leads.\\",\\"action\\":\\"Increase LinkedIn budget by 20% and decrease Google Ads by 15%.\\",\\"expected_impact\\":\\"3x more hot leads at 40% lower CAC, +18% pipeline value, +$4,200 monthly savings.\\",\\"confidence\\":0.82},{\\"observation\\":\\"Qualification stage conversion is 44% vs 62% baseline (-18 percentage points, 2.1 sigma).\\",\\"hypothesis\\":\\"Lead-qualification health score is 68 (below 70 threshold); agent may be mis-tuning scoring weights.\\",\\"action\\":\"Lower qualification threshold from 50 to 45 for 30-day trial.\\",\\"expected_impact\\":\\"+24% qualified lead volume. 68% of leads scoring 45-49 eventually convert. Confidence 0.76.\\",\\"confidence\\":0.76}]}"
      }
    }
  ]
}`,
      notes: 'Echo validates each recommendation against the 4-field schema before persisting. Malformed JSON triggers a single retry with patched prompt + temperature reduction (0.4 to 0.3).',
    },
    {
      tool: 'Webhook Notifications (Custom HTTP)',
      scenario: 'Echo dispatches a signed notification to a customer-built integration endpoint.',
      request: `POST https://customer.com/webhooks/echo
X-Echo-Signature: sha256=4f2a8b3c1e9d6a5f7c2b8e1a4d3f6c9b
Content-Type: application/json

{
  "event": "report.weekly",
  "report_id": "r_8842",
  "cadence": "weekly",
  "generated_at": "2026-09-08T09:00:00Z",
  "workspace_id": "ws_412",
  "metrics": {
    "total_leads": 1284,
    "pipeline_value": 482000,
    "pipeline_velocity_days": 18.4
  },
  "recommendation_ids": ["rec_8842", "rec_8843"]
}`,
      response: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "received": true,
  "processed_at": "2026-09-08T09:00:01.243Z"
}`,
      notes: 'The signature is computed as HMAC-SHA256(raw_payload, subscription_secret). Subscribers must validate the signature before processing — unsigned or mis-signed payloads should be dropped.',
    },
  ],

  examples: [
    {
      scenario: 'Weekly report with a high-confidence channel reallocation recommendation.',
      input: `Generate the weekly report for workspace ws_412. Week: 2026-W36. Deliver to Slack #growth-weekly and email weekly-distribution@company.com.`,
      reasoning: `Aggregated metrics for week 36: total_leads=1284 (+12% vs 30-day baseline), pipeline_value=$482k (+8%), pipeline_velocity=18.4 days (-2.1 days). Channel ROI analysis: LinkedIn CPL=$12.40 with 198 hot leads; Google Ads CPL=$38.10 with 41 hot leads. The LinkedIn sample size is n=47 (>=30 threshold) — sufficient confidence for a reallocation recommendation. Lead-qualification health dropped to 68 (below 70 threshold); funnel leak at qualification stage (44% vs 62% baseline, 2.1 sigma deviation). Generated 2 recommendations via LLM at temperature 0.4; both passed the 4-field schema validation.`,
      output: `{
  "report_id": "r_8842",
  "cadence": "weekly",
  "workspace_id": "ws_412",
  "week": "2026-W36",
  "headline_metrics": {
    "total_leads": 1284,
    "pipeline_value": 482000,
    "pipeline_velocity_days": 18.4,
    "response_rate": 0.184
  },
  "recommendations": [
    {
      "id": "rec_8842",
      "observation": "LinkedIn CPL is $12.40 vs Google Ads $38.10 (3.1x lower). LinkedIn produces 198 hot leads vs Google Ads 41 (4.8x more).",
      "hypothesis": "LinkedIn targeting is more precise for this ICP, producing higher-intent leads.",
      "action": "Increase LinkedIn budget by 20% and decrease Google Ads by 15%.",
      "expected_impact": "3x more hot leads at 40% lower CAC, +18% pipeline value, +$4,200 monthly savings.",
      "confidence": 0.82,
      "priority": 0.82
    },
    {
      "id": "rec_8843",
      "observation": "Qualification stage conversion is 44% vs 62% baseline (-18 percentage points, 2.1 sigma).",
      "hypothesis": "Lead-qualification health score is 68 (below 70 threshold); agent may be mis-tuning scoring weights.",
      "action": "Lower qualification threshold from 50 to 45 for 30-day trial.",
      "expected_impact": "+24% qualified lead volume. 68% of leads scoring 45-49 eventually convert.",
      "confidence": 0.76,
      "priority": 0.76
    }
  ],
  "executive_summary": "Lead volume grew 12% week-over-week driven by LinkedIn strength. Channel reallocation recommended to compound the gain. A qualification-stage leak (44% vs 62% baseline) requires a threshold adjustment trial.",
  "delivery_receipts": [
    { "target": "slack:#growth-weekly", "status": "delivered", "latency_ms": 412 },
    { "target": "email:weekly-distribution@company.com", "status": "delivered", "latency_ms": 1820 }
  ]
}`,
      outcome: 'User accepted rec_8842 (channel reallocation). 30-day follow-up: observed impact was +21% pipeline value (predicted +18%, achieved >= 80% of predicted). Recommendation counted as accurate. Lead-qualification agent reviewed and threshold trial accepted.',
    },
    {
      scenario: 'Anomaly storm suppression — 27 P2 anomalies fire within 5 minutes due to a seasonal Monday morning lead surge.',
      input: `Anomaly detector fires 27 P2 anomaly events between 08:00 and 08:05 on Monday. All on lead-volume metrics across different channels.`,
      reasoning: `Anomaly storm detected: 27 P2 events in 5 minutes exceeds the 20-event threshold. Apply suppression rule: drop all P2 anomalies, surface only P0/P1. Verify no P0/P1 anomalies are present in the storm (none found). Cross-reference with historical pattern: Monday morning lead surges are a known seasonality (STL decomposition should have flagged this). The detector likely over-fired due to a recent baseline shift. Queue a detector-tuning task for the next monthly review.`,
      output: `{
  "anomaly_storm_id": "storm_8842",
  "detected_at": "2026-09-08T08:05:00Z",
  "events_suppressed": 27,
  "events_surfaced": 0,
  "suppression_rule": "P2 storm (>20 in 5 min); surface only P0/P1",
  "root_cause_hypothesis": "Monday morning seasonality; STL decomposition should have absorbed this",
  "follow_up_action": "Queue detector-tuning task for monthly review",
  "audit_id": "aud_8842"
}`,
      outcome: 'No user-facing alert was sent. Detector tuning performed at the monthly review reduced the false-positive rate by 1.2 percentage points.',
    },
    {
      scenario: 'Data-quality breach holds the daily report.',
      input: `During the daily aggregation at 08:00, /api/dashboard/stats returns successfully but completeness check fails: leads_by_stage.qualified is null for 12% of records (target < 1% missing).`,
      reasoning: `Data-quality breach detected. Completeness = 88% (target >= 99%). Hold the daily report; do not publish stale or incomplete data. Emit data_quality.breach event and page the on-call analyst. Generate a diagnostic snapshot showing which records have null qualified-stage values. Do NOT fall back to cached snapshot — the breach indicates an upstream issue (likely in lead-qualification agent) that may also affect the cached snapshot.`,
      output: `{
  "report_id": "r_8842",
  "cadence": "daily",
  "status": "held",
  "hold_reason": "data_quality_breach",
  "breach_details": {
    "gate": "completeness",
    "metric": "leads_by_stage.qualified",
    "observed": 0.88,
    "target": 0.99,
    "null_count": 154,
    "total_count": 1284
  },
  "actions_taken": [
    "Held report r_8842",
    "Emitted data_quality.breach event",
    "Paged on-call analyst",
    "Generated diagnostic snapshot ds_8842"
  ],
  "recommended_investigation": "Check lead-qualification agent — 12% of records lack a qualified stage transition. Possible root cause: scoring weight change deployed at 02:14.",
  "audit_id": "aud_8843"
}`,
      outcome: 'On-call analyst investigated. Root cause was a lead-qualification prompt change at 02:14 that broke scoring for niche ICPs. Reverted the prompt, re-scored the affected records, and Echo re-ran the daily report at 08:47 with full data quality.',
    },
  ],

  guardrails: [
    {
      rule: 'Never publish a report whose data fails the completeness, freshness, or consistency gates.',
      rationale: 'Publishing low-quality data erodes user trust and triggers downstream decisions based on incorrect numbers.',
      enforcement: 'The data-quality validator runs before report assembly. On breach, the report is held, a data_quality.breach event is emitted, and the on-call analyst is paged. The report is only published after the breach is resolved.',
      severity: 'block',
    },
    {
      rule: 'Never issue a recommendation that fails the 4-field schema (observation, hypothesis, action, expected_impact).',
      rationale: 'Incomplete recommendations cannot be evaluated for accuracy and erode user confidence in the recommendation engine.',
      enforcement: 'A schema validator runs on every LLM output. Recommendations failing validation are rejected; if all candidates fail, the system falls back to a rule-based recommendation generator that emits the top anomaly as a recommendation.',
      severity: 'block',
    },
    {
      rule: 'Never issue a channel-ROI recommendation based on a sample size below 30 leads per channel.',
      rationale: 'Small-sample ROI differences are statistically indistinguishable from noise and would mislead the user.',
      enforcement: 'A pre-recommendation check counts leads per channel; channels below the threshold are excluded from reallocation candidates with a logged reason.',
      severity: 'block',
    },
    {
      rule: 'Never exceed 5 recommendations per report.',
      rationale: 'Recommendation fatigue reduces adoption rate; users stop reading when there are too many.',
      enforcement: 'The report assembler caps the recommendation list at 5, ranked by priority (expected_impact x confidence).',
      severity: 'block',
    },
    {
      rule: 'Always tag stale reports with stale=true and notify subscribers.',
      rationale: 'Subscribers must always know whether they are looking at fresh or stale data; silent stale publication erodes trust.',
      enforcement: 'If /api/dashboard/stats fails and the cached snapshot is used, the report is tagged stale=true at assembly time and the notification template includes a stale-data banner.',
      severity: 'block',
    },
    {
      rule: 'Always sign webhook payloads with HMAC-SHA256.',
      rationale: 'Unsigned or mis-signed payloads could be spoofed, allowing an attacker to inject false reports into subscriber systems.',
      enforcement: 'The webhook dispatcher computes the signature over the raw payload body using the per-subscription secret and includes it in the X-Echo-Signature header. Subscribers are required to validate the signature before processing.',
      severity: 'block',
    },
    {
      rule: 'Always record the full evidence chain for every recommendation.',
      rationale: 'Recommendations must be auditable and explainable; without the evidence chain, the user cannot evaluate the quality of the reasoning.',
      enforcement: 'The recommendation_persister requires 8 fields (input_data_snapshot, model_version, prompt_hash, raw_model_output, post_processing, final_recommendation, created_at, audit_id). Recommendations missing any field are rejected and the LLM call is retried.',
      severity: 'block',
    },
    {
      rule: 'Suppress P2 anomaly storms (>20 events in 5 minutes) and surface only P0/P1.',
      rationale: 'Alert fatigue causes real P0/P1 anomalies to be missed; suppressing noise preserves signal.',
      enforcement: 'The anomaly detector counts events in a sliding 5-minute window. When the count exceeds 20 at P2 severity, all P2 events for the next 30 minutes are batched into the next scheduled report rather than sent as individual alerts.',
      severity: 'warn',
    },
    {
      rule: 'Always include the confidence interval alongside the expected_impact.',
      rationale: 'Stating an expected impact without confidence is dishonest; the user cannot calibrate their trust.',
      enforcement: 'The 4-field schema validator requires expected_impact to include a numeric confidence value between 0 and 1. Recommendations missing the confidence field are rejected.',
      severity: 'warn',
    },
  ],

  decisionMatrix: [
    {
      condition: 'Anomaly detector fires a P0 event (>3 sigma) on a top-3 metric.',
      action: 'Notify the on-call analyst immediately via Slack with the anomaly details and recommended diagnostic actions. Hold any in-flight scheduled report to include the anomaly context.',
      rationale: 'P0 anomalies on top metrics indicate an active incident; the analyst must be paged within 5 minutes.',
      example: 'pipeline_value drops 32% in 1 hour (3.4 sigma). Slack alert fires at 14:23; analyst investigates and finds outreach-composer is failing to send sequences.',
    },
    {
      condition: 'LLM returns malformed JSON for recommendation generation.',
      action: 'Retry once with a patched prompt (explicit JSON schema reminder) and reduced temperature (0.4 to 0.3). If retry fails, fall back to the rule-based recommendation generator that emits the top anomaly as a recommendation.',
      rationale: 'Malformed JSON is usually a temperature drift; tightening the prompt and lowering temperature restores structured output. The rule-based fallback ensures a report never ships without at least one recommendation.',
      example: 'LLM returned prose instead of JSON for 3 of 5 candidates. Retry with patched prompt; 2 of 5 succeed. Rule-based fallback generates the remaining 3 from the top anomalies.',
    },
    {
      condition: 'Channel-ROI recommendation candidate is based on n<30 leads for one channel.',
      action: 'Exclude the channel from reallocation candidates. Log the exclusion reason. Issue recommendations only for channels above the threshold.',
      rationale: 'Small-sample ROI differences are statistically indistinguishable from noise; recommending reallocation would mislead the user.',
      example: 'Reddit channel has 12 leads this week; excluded from reallocation candidates. LinkedIn (n=47) and Google Ads (n=58) qualify; recommendation focuses on those two.',
    },
    {
      condition: 'Data-quality completeness check fails (< 99% populated).',
      action: 'Hold the report, emit data_quality.breach, page the on-call analyst. Do NOT fall back to cached snapshot — the breach likely affects the cache too.',
      rationale: 'Low completeness indicates an upstream issue (often in lead-qualification or data-enrichment); publishing would propagate the issue downstream.',
      example: 'leads_by_stage.qualified is null for 12% of records. Report held; root cause traced to a lead-qualification prompt change at 02:14.',
    },
    {
      condition: '/api/dashboard/stats returns 5xx or times out.',
      action: 'Fall back to the most recent cached snapshot (max 60s old). Tag the report as stale=true. Notify subscribers that the data is stale.',
      rationale: 'A transient stats endpoint failure should not block report delivery; the cached snapshot is sufficient for trending. Subscribers must know the data is stale.',
      example: 'Stats endpoint 502 at 08:00. Cached snapshot from 07:59:45 used; report tagged stale=true; Slack message includes "Data is up to 15s stale" banner.',
    },
    {
      condition: 'Two recommendations in the same report have conflicting actions (e.g. increase AND decrease budget for the same channel).',
      action: 'Keep only the higher-priority recommendation. Reject the lower-priority one with a logged conflict reason.',
      rationale: 'Conflicting recommendations confuse the user and erode trust in the recommendation engine.',
      example: 'Rec A: "Increase LinkedIn budget by 20%" (priority 0.82). Rec B: "Decrease LinkedIn budget by 10%" (priority 0.71). Rec B rejected with reason "conflicts_with_higher_priority".',
    },
    {
      condition: 'Recommendation is a duplicate of a not-yet-evaluated recommendation issued in the past 30 days.',
      action: 'Suppress the new recommendation. Log the suppression with a reference to the prior recommendation_id.',
      rationale: 'Re-issuing a recommendation before the prior one has been evaluated wastes user attention and prevents learning from the prior outcome.',
      example: 'New recommendation "Lower qualification threshold from 50 to 45" matches rec_8813 issued 12 days ago (not yet evaluated at 30-day mark). Suppressed with reference to rec_8813.',
    },
    {
      condition: 'Webhook delivery fails after 3 retry attempts.',
      action: 'Persist the failed delivery to the dead_letter table. Emit notification.delivery_failed. Surface to the on-call analyst for investigation.',
      rationale: 'Failed deliveries must not be silently dropped; the dead_letter table preserves them for replay and the alert ensures investigation.',
      example: 'Custom HTTP webhook to customer.com/webhooks/echo failed 3x with timeout. Dead-lettered; on-call found the customer endpoint was down; replayed after customer endpoint restored.',
    },
  ],

  failureModes: [
    {
      failure: '/api/dashboard/stats endpoint is unavailable (5xx or timeout).',
      detection: 'Health check pings the endpoint every 15s; failure triggers a degraded-mode flag within 20s.',
      mitigation: 'Fall back to the most recent cached snapshot (max 60s old). Tag all reports as stale=true. Notify subscribers. Page the platform on-call if the outage persists > 5 minutes.',
      recoveryTime: '< 20s for fallback; full recovery when the endpoint returns 200.',
    },
    {
      failure: 'LLM returns malformed JSON for recommendation generation.',
      detection: 'JSON.parse throws on the LLM response content field.',
      mitigation: 'Retry once with patched prompt (explicit JSON schema reminder) and reduced temperature (0.4 to 0.3). If retry fails, fall back to rule-based recommendation generator that emits the top anomaly as a recommendation.',
      recoveryTime: '< 30s for retry + fallback.',
    },
    {
      failure: 'Data-quality completeness breach (one metric is null for > 1% of records).',
      detection: 'Completeness validator computes per-metric null rate during aggregation; breach triggers when any metric exceeds 1% nulls.',
      mitigation: 'Hold the in-flight report. Emit data_quality.breach event with the affected metric and null count. Page the on-call analyst. Generate a diagnostic snapshot identifying the affected records for investigation.',
      recoveryTime: 'Variable — depends on root cause resolution (typically 15-60 minutes).',
    },
    {
      failure: 'Anomaly detector false-positive storm (e.g. after a baseline shift).',
      detection: 'False-positive rate monitor flags > 5% FP rate at P0/P1 over a 7-day window.',
      mitigation: 'Suppress P2 anomalies immediately. Queue a detector-tuning task for the next monthly review. The tuning procedure adjusts the 3-sigma / EWMA thresholds based on the observed false-positive rate.',
      recoveryTime: '< 5 minutes for suppression; full fix at next monthly tuning cycle.',
    },
    {
      failure: 'Webhook delivery fails repeatedly for a single subscriber.',
      detection: 'Per-subscription delivery dashboard shows success rate < 90% over a 24-hour window.',
      mitigation: 'After 3 failed attempts per message, persist to dead_letter table. Emit notification.delivery_failed. Surface to on-call. Subscriber is auto-disabled after 50 consecutive failures to prevent wasted retry budget.',
      recoveryTime: '< 5 minutes for dead-lettering; subscriber re-enabled after on-call fixes the endpoint.',
    },
    {
      failure: 'Recommendation accuracy drops below 75% for a category (e.g. ICP optimization recommendations).',
      detection: 'Daily outcome-tracking job computes per-category accuracy; breach triggers when accuracy < 75% with n>=10 evaluated recommendations.',
      mitigation: 'Surface the low-accuracy category to the on-call analyst. Reduce the priority score multiplier for that category by 50% (so fewer of its recommendations surface). Queue a prompt-tuning task to improve the category.',
      recoveryTime: '< 24 hours for priority adjustment; full fix after prompt tuning is validated.',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_echo_001',
      input: 'Generate the weekly report for workspace ws_412. Week: 2026-W36. Deliver to Slack #growth-weekly.',
      expectedOutput: 'Weekly report with headline metrics, 3-5 ranked recommendations (each with 4 fields: observation, hypothesis, action, expected_impact), executive summary, and delivery receipt to Slack.',
      scoringCriteria: [
        'Report contains headline metrics (total_leads, pipeline_value, pipeline_velocity_days, response_rate).',
        'Report contains 1-5 recommendations (not more, not less).',
        'Each recommendation has all 4 fields populated (observation, hypothesis, action, expected_impact).',
        'Each expected_impact includes a confidence value between 0 and 1.',
        'Report contains an executive summary of 2-4 sentences.',
        'Delivery receipt shows status=delivered for Slack target.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_echo_002',
      input: 'During aggregation, /api/dashboard/stats returns 502. Generate the daily report anyway.',
      expectedOutput: 'Report is generated using the cached snapshot (max 60s old). Report is tagged stale=true. Subscribers are notified of the stale data.',
      scoringCriteria: [
        'Report is published (not held) using cached snapshot.',
        'Report is tagged stale=true in the metadata.',
        'Notification template includes a stale-data banner.',
        'Audit log records the fallback and the staleness.',
        'No retry beyond the initial 5s timeout on /api/dashboard/stats.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_echo_003',
      input: 'LLM returns malformed JSON for recommendation generation. Generate the report.',
      expectedOutput: 'Retry once with patched prompt + temperature 0.3. If retry fails, fall back to rule-based recommendation generator that emits the top anomaly as a recommendation. Report ships with at least 1 recommendation.',
      scoringCriteria: [
        'System retries once with patched prompt and reduced temperature.',
        'On retry failure, rule-based fallback generates a recommendation from the top anomaly.',
        'Final report contains at least 1 recommendation.',
        'Fallback recommendation has all 4 fields populated.',
        'Audit log records both the LLM failure and the fallback action.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_echo_004',
      input: 'Channel-ROI recommendation candidate is based on n=18 leads for Reddit (below threshold of 30). Should Echo issue the recommendation?',
      expectedOutput: 'No. The recommendation is excluded with a logged reason. Only channels with n>=30 are eligible for reallocation recommendations.',
      scoringCriteria: [
        'Reddit is excluded from reallocation candidates.',
        'Exclusion reason is logged (sample_size_below_threshold).',
        'No recommendation referencing Reddit reallocation is issued.',
        'If other channels qualify (n>=30), recommendations may still be issued for them.',
        'Audit log records the exclusion.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_echo_005',
      input: 'Anomaly detector fires 27 P2 events in 5 minutes (storm). How should Echo handle the alerts?',
      expectedOutput: 'Suppress all 27 P2 anomalies. Surface only P0/P1 anomalies (none in this case). Queue a detector-tuning task for the monthly review.',
      scoringCriteria: [
        'No P2 anomalies are sent as individual alerts.',
        'P2 anomalies are batched into the next scheduled report.',
        'Detector-tuning task is queued for monthly review.',
        'Audit log records the suppression with count and root-cause hypothesis.',
        'No false "all clear" signal is sent — the suppression is logged, not silently applied.',
      ],
      passThreshold: 5,
    },
  ],
};
