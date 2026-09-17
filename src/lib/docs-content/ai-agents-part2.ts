import type { DocContent } from './types';

export const aiAgentsDocsPart2: DocContent[] = [
  // ===========================================================================
  // CARD 4: LEAD QUALIFICATION AGENT (JUDGE)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 13. SCORING METHODOLOGY
  // ---------------------------------------------------------------------------
  {
    slug: 'qualification-scoring',
    title: 'Scoring Methodology',
    description: 'Understand how the Lead Qualification agent combines five weighted dimensions into a 0-100 lead score, and how conservative scoring, tier classification, and real-time recalculation keep your pipeline aligned with reality.',
    category: 'AI Agents',
    readTime: '9 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `The Lead Qualification agent — internally called Judge — evaluates every discovered lead against a five-dimension weighted model that produces a single composite score on the 0 to 100 scale. The composite score is the primary signal the Orchestrator uses to route leads through the nine-stage lifecycle, to assign SLA windows, and to determine which leads enter the A, B, or C priority queues for the Outreach Composer. Unlike heuristic scoring engines that count filled-in CRM fields, Judge uses a large language model to reason about each dimension against your ICP definition, producing a sub-score from 0 to 100 per dimension along with a short evidence trail that explains the reasoning. The composite score is then computed as a weighted sum of the five dimension scores using fixed weights: firmographic 25 percent, intent 20 percent, reachability 20 percent, strategic fit 20 percent, and data completeness 15 percent. This weighting reflects our empirical finding that firmographic fit is the strongest predictor of conversion, but no single dimension should ever exceed 25 percent of the composite score, because doing so produces brittle pipelines that collapse when a single signal goes stale.` },
      { type: 'paragraph', content: `Judge is intentionally conservative. A high score requires clear, attributable evidence surfaced in the enrichment payload — for example, a firmographic score above 80 requires both company headcount and industry NAICS code to be present, verified, and within the ICP range. A lead with a single missing dimension cannot score above 70, regardless of how strong the other four dimensions appear. This conservatism is a deliberate design choice to protect the credibility of the A-list queue, which carries the strictest 5-minute first-touch SLA in the platform. If Judge were to over-score, the Outreach Composer would saturate the A-list queue with marginally-qualified leads, eroding the time-to-first-touch SLA and producing burnout in your sales reps. Conservative scoring keeps the A-list queue small, fast, and high-signal, which is the precondition for the 8-12 percent reply rate target and the 3-5 percent meeting set rate target that the Outreach Composer is benchmarked against.` },
      { type: 'heading', level: 2, content: 'The Five Scoring Dimensions' },
      { type: 'paragraph', content: `The firmographic dimension (weight 25 percent) measures how closely a company's structural attributes match your ICP definition. Judge evaluates employee count, revenue band, industry NAICS code, geography, and company age against the ICP filters you configured in the ICP Builder. A company that falls inside every ICP filter band earns a firmographic sub-score between 85 and 100; a company that falls inside four of five bands earns 65 to 80; a company that falls outside three or more bands is capped at 40 regardless of other signals. The intent dimension (weight 20 percent) measures demonstrated buying intent using hiring trends, web traffic acceleration, technology adoption signals, content engagement, and analyst mentions. Judge weights intent signals by recency, decaying signal strength by 50 percent every 30 days, so a hiring spike from 90 days ago contributes half as much as one from last week.` },
      { type: 'paragraph', content: `The reachability dimension (weight 20 percent) measures the probability that the Outreach Composer can successfully contact the lead across email, LinkedIn, and phone channels. Judge evaluates email deliverability (verifying that the prospect's email is present and that the email pattern matches the company's verified sending domain), LinkedIn connectivity (whether the prospect has a public LinkedIn profile and whether a first-degree connection path exists from your team), and phone availability (whether a direct dial or HQ number exists). The strategic fit dimension (weight 20 percent) evaluates whether the prospect is likely to be in an active buying cycle. Judge looks at recent funding events, leadership changes, M&A activity, product launch announcements, and explicit pain-point signals scraped from earnings calls and press releases. A lead whose company announced a Series C round 60 days ago scores 85+ on strategic fit because the funding event typically triggers tooling reviews in 90 to 180 days.` },
      { type: 'paragraph', content: `The data completeness dimension (weight 15 percent) is the integrity multiplier. Judge counts how many of the 60 fields in the enrichment payload are populated and verified, and produces a sub-score that rewards completeness rather than penalizing absence. A lead with all 60 fields populated earns 100; a lead with 45 fields earns 75; a lead with fewer than 30 fields earns 0 and is routed back to the Data Enrichment agent for a second pass. Data completeness is the lightest-weighted dimension because it is not a direct predictor of conversion, but it is a critical confidence signal: a high score across all five dimensions is meaningless if the underlying data is 40 percent complete, because the Outreach Composer cannot personalize effectively against thin data. Judge therefore treats data completeness as a soft cap — a lead cannot reach the super_hot tier (88+) unless data completeness is at least 70.` },
      { type: 'heading', level: 2, content: 'Weighted Formula' },
      { type: 'paragraph', content: `The composite score is computed as a weighted sum of the five dimension sub-scores. The formula is fixed in the platform default configuration: score = firmographic * 0.25 + intent * 0.20 + reachability * 0.20 + strategic * 0.20 + dataCompleteness * 0.15. Weights are normalized to sum to 1.0 so the composite score is bounded between 0 and 100. If you have an Enterprise or Enterprise Plus tier, you can override the weights from the Scoring Configuration page in the Lead Qualification console, but the platform enforces three constraints: every weight must be between 0.05 and 0.40, weights must sum to 1.0, and data completeness cannot be set below 0.10. These guardrails prevent teams from collapsing the model into a single-dimension shortcut that produces brittle pipelines.` },
      { type: 'code', language: 'json', caption: 'Example scoring payload returned by the Lead Qualification agent for a single lead', code: `{
  "lead_id": "lead_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "composite_score": 87,
  "tier": "hot",
  "dimensions": {
    "firmographic": { "score": 92, "weight": 0.25, "evidence": ["employee_count: 450 (ICP 200-1000)", "industry: SaaS NAICS 541511 (ICP match)", "revenue: $48M ARR (ICP $10M-$100M)"] },
    "intent": { "score": 81, "weight": 0.20, "evidence": ["hiring_growth_90d: +18% (top decile)", "web_traffic_30d: +24% MoM", "tech_addition: Snowflake 41 days ago"] },
    "reachability": { "score": 78, "weight": 0.20, "evidence": ["email_verified: true", "linkedin_path: 2-hop via teammate@acme.com", "direct_dial: +1-415-555-0142"] },
    "strategic": { "score": 90, "weight": 0.20, "evidence": ["series_c_announced: 62 days ago", "new_vp_sales: 28 days ago", "earnings_call_pain: CRM consolidation mentioned"] },
    "data_completeness": { "score": 88, "weight": 0.15, "evidence": ["fields_populated: 53/60", "verified_fields: 49/60", "missing: github_url, tech_stack_version, duns_number"] }
  },
  "weighted_breakdown": {
    "firmographic_contribution": 23.0,
    "intent_contribution": 16.2,
    "reachability_contribution": 15.6,
    "strategic_contribution": 18.0,
    "data_completeness_contribution": 13.2
  },
  "model": "glm-4.6v-flash",
  "temperature": 0.2,
  "computed_at": "2025-01-15T14:32:11.000Z",
  "version": "scoring-v3.2"
}` },
      { type: 'heading', level: 2, content: 'Tier Classification' },
      { type: 'paragraph', content: `Judge classifies every lead into one of four tiers based on the composite score. Tier classification is the routing signal the Orchestrator uses to assign SLA windows and to decide which leads enter the A-list, B-list, or C-list priority queue in the Outreach Composer. The four tiers are cold (below 40), warm (40 to 69), hot (70 to 87), and super_hot (88 and above). Tier boundaries are fixed in the platform default and cannot be overridden below the minimums, because moving the super_hot threshold below 88 collapses the A-list queue into a backlog that violates the 5-minute first-touch SLA.` },
      { type: 'table', caption: 'Lead tier classification, SLA windows, and routing destinations', headers: ['Tier', 'Score Range', 'First-Touch SLA', 'Queue', 'Default Outreach Cadence'], rows: [
        ['Super Hot', '88-100', '5 minutes', 'A-list', '7-day accelerated'],
        ['Hot', '70-87', '1 hour', 'B-list', '14-day standard'],
        ['Warm', '40-69', '24 hours', 'C-list', '14-day standard (gated)'],
        ['Cold', '0-39', 'No SLA', 'Nurture', 'Drip campaign'],
      ]},
      { type: 'paragraph', content: `Judge runs on the glm-4.6v-flash model at temperature 0.2, which is the lowest temperature supported by the platform's inference runtime. The low temperature is intentional — scoring is a deterministic reasoning task, not a creative generation task, and high temperatures would produce score variance of 8 to 15 points across repeated runs on the same lead. Temperature 0.2 keeps variance under 3 points while still allowing the model to express uncertainty through the evidence trail. The model is invoked with a maxTokens budget of 1500, which is sufficient for the five sub-scores, the evidence trail, and the JSON envelope. Judge is the only agent in the platform that runs at temperature 0.2; the Outreach Composer runs at 0.7 for creativity, and the Report Generator runs at 0.4 for balanced analysis.` },
      { type: 'callout', variant: 'tip', content: `If you see a lead score that feels too low given the visible evidence, check the data completeness sub-score before adjusting weights. The most common cause of an unexpectedly low composite score is a missing direct dial or LinkedIn URL, which depresses the reachability sub-score and pulls the composite down by 4 to 8 points. Fixing enrichment gaps usually raises the composite score by 6 to 10 points without changing the weighting model.` },
      { type: 'heading', level: 2, content: 'Real-Time Recalculation' },
      { type: 'paragraph', content: `Judge recalculates the composite score in real time whenever the enrichment payload changes. The recalculation trigger fires when the Data Enrichment agent adds a new field, when a channel adapter surfaces a new intent signal, when a teammate manually edits a lead field, or when a CRM sync updates the lead record. Recalculation is event-driven, not scheduled, so the latency from new data arrival to updated score is typically under 8 seconds. The previous score and the new score are both written to the lead's audit history, and a tier transition triggers a webhook event (lead.tier_changed) that downstream integrations can subscribe to. Tier transitions are directional — moving from warm to hot unlocks the 1-hour B-list SLA and immediately promotes the lead into the Outreach Composer's active queue, while moving from hot to warm demotes the lead and pauses any pending touchpoints that have not yet executed.` },
      { type: 'heading', level: 2, content: 'Heuristic Fallback Scoring' },
      { type: 'paragraph', content: `If the LLM inference runtime is unavailable, Judge falls back to a heuristic field-count-based scoring algorithm that produces a defensible composite score within 200 milliseconds. The heuristic algorithm counts the number of populated fields in each dimension's bucket, multiplies by the dimension weight, and applies a fixed penalty for any missing critical field (employee count, industry, email, LinkedIn URL). The heuristic score is always lower than the LLM score for the same lead by 8 to 15 points, because the heuristic cannot reason about intent or strategic fit — it can only count presence. Leads scored by the heuristic are tagged with a scoring_method flag set to heuristic_fallback and are re-scored by the LLM within 5 minutes of runtime recovery. Heuristic fallback is rare (under 0.2 percent of scoring runs in a typical month) but is critical for keeping the pipeline moving during inference runtime incidents.` },
      { type: 'code', language: 'typescript', caption: 'Simplified heuristic fallback scoring algorithm', code: `function heuristicScore(lead: EnrichedLead): number {
  const firmographic = countFilled(['employee_count', 'revenue', 'industry', 'geo', 'company_age']) / 5 * 100;
  const intent = countFilled(['hiring_trend', 'web_traffic', 'tech_additions', 'content_engagement', 'analyst_mentions']) / 5 * 100;
  const reachability = countFilled(['email', 'linkedin_url', 'phone_direct', 'phone_hq', 'email_verified']) / 5 * 100;
  const strategic = countFilled(['funding_event', 'leadership_change', 'ma_activity', 'product_launch', 'pain_signal']) / 5 * 100;
  const dataCompleteness = lead.fieldsPopulated / 60 * 100;

  let score = firmographic * 0.25 + intent * 0.20 + reachability * 0.20 + strategic * 0.20 + dataCompleteness * 0.15;

  // Critical field penalty: -8 points per missing critical field
  if (!lead.employee_count) score -= 8;
  if (!lead.email) score -= 8;
  if (!lead.linkedin_url) score -= 4;

  return Math.max(0, Math.min(100, score));
}` },
      { type: 'heading', level: 2, content: 'Interpreting a Lead Score' },
      { type: 'steps', items: [
        `Open the lead detail page from the Leads inbox. The composite score, tier badge, and dimension sub-scores appear in the right rail of the lead detail view.`,
        `Click the Score Breakdown expander to reveal the five dimension sub-scores and the weighted contribution of each to the composite.`,
        `Review the evidence trail under each dimension. Each sub-score is accompanied by 3 to 5 evidence bullets that explain why the model assigned that score.`,
        `Cross-check the evidence trail against the enrichment payload. Click the Enrichment tab to see the raw fields the model consumed.`,
        `If a dimension sub-score looks wrong, click the Request rescore button. This forces a fresh LLM run with the same payload and writes the new score to the audit history.`,
        `If the rescore returns the same result, the issue is likely in the underlying data. Route the lead back to Data Enrichment using the Re-enrich action in the kebab menu.`,
      ]},
      { type: 'heading', level: 2, content: 'Best Practices' },
      { type: 'list', items: [
        `Do not override the default weights unless you have run a 30-day A/B test comparing the default model to your proposed variant.`,
        `Review the super_hot queue weekly. If the queue has more than 25 leads, your ICP is probably too permissive — tighten the firmographic filters in the ICP Builder.`,
        `Monitor the heuristic_fallback rate. Sustained rates above 1 percent indicate an inference runtime incident that requires escalation to support.`,
        `Treat tier transitions as webhook events. Subscribe to lead.tier_changed and trigger CRM stage updates so your CRM pipeline matches LeadReach in near-real time.`,
        `Never delete a lead because of a low score. Move cold leads to the nurture queue and let the drip campaign warm them up — context changes over 90 days frequently rescue 5 to 10 percent of cold leads.`,
        `Audit the evidence trail monthly. If you find leads with high composite scores but sparse evidence trails (fewer than 3 bullets per dimension), the model is hallucinating — escalate to support.`,
      ]},
      { type: 'paragraph', content: `The scoring methodology is the load-bearing wall of the LeadReach platform. If scores are wrong, every downstream agent inherits the error — the Outreach Composer prioritizes the wrong leads, the Report Generator computes misleading channel ROI, and your sales team loses trust in the system. Treat scoring configuration as a quarterly review item, not a set-and-forget setting. Every quarter, sample 50 leads from each tier, review the evidence trails against your updated ICP, and submit a weight adjustment proposal through the Scoring Configuration page. The platform tracks weight changes in the audit log with a before-and-after snapshot so you can roll back any change that produces a regression in conversion rate or reply rate within the following 30 days.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 14. WEIGHT CONFIGURATION
  // ---------------------------------------------------------------------------
  {
    slug: 'qualification-weights',
    title: 'Weight Configuration',
    description: 'Configure the five-dimension weights that drive composite lead scoring, understand the platform guardrails, and run A/B tests on weight variants before promoting changes to production.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Weight configuration is the single most powerful lever you have over the Lead Qualification agent's behavior. The five weights — firmographic, intent, reachability, strategic, and data completeness — sum to 1.0 and determine how much each dimension's sub-score contributes to the final composite score. The default weights (25/20/20/20/15) were derived from a regression analysis of 1.4 million scored leads across 230 B2B SaaS customer workspaces, where the default weighting produced the highest correlation between composite score and 90-day conversion to closed_won. Weight configuration is exposed only on the Scale, Enterprise, and Enterprise Plus tiers; Starter and Growth tiers use the locked default weights, because misconfigured weights are the second-leading cause of pipeline regression after stale ICP definitions.` },
      { type: 'paragraph', content: `The weight configuration page is located in the Lead Qualification console under the Configuration tab. The page renders five sliders, each bounded by the platform's guardrails, and a live preview pane that shows the impact of the proposed weights on a sample of 100 recent leads drawn from your workspace. The preview pane is critical — it lets you validate that a weight change produces the expected tier distribution before you promote it to production. The platform also enforces a 24-hour delay between weight changes and promotion to production, during which the proposed weights run in shadow mode against all incoming leads and produce a comparison report against the current production weights. This shadow-mode validation is the platform's primary defense against pipeline regression.` },
      { type: 'heading', level: 2, content: 'Default Weights and Guardrails' },
      { type: 'paragraph', content: `The platform enforces four guardrails on weight configuration. First, every weight must be between 0.05 and 0.40 — no dimension can be zeroed out, and no dimension can dominate the composite. Second, weights must sum to exactly 1.0; the page refuses to save a configuration that sums to 0.99 or 1.01. Third, the data completeness weight cannot be set below 0.10, because doing so collapses the integrity multiplier and produces brittle pipelines. Fourth, the firmographic weight cannot be set below 0.15, because firmographic fit is the strongest empirical predictor of conversion and underweighting it produces pipelines dominated by intent-only signals that decay rapidly. These guardrails are non-negotiable and cannot be overridden, even on Enterprise Plus tiers.` },
      { type: 'table', caption: 'Default weights, guardrail bounds, and rationale per dimension', headers: ['Dimension', 'Default Weight', 'Min', 'Max', 'Primary Rationale'], rows: [
        ['Firmographic', '0.25', '0.15', '0.40', 'Strongest conversion predictor in 1.4M-lead regression'],
        ['Intent', '0.20', '0.05', '0.40', 'Recency-weighted signal; decays 50% per 30 days'],
        ['Reachability', '0.20', '0.05', '0.40', 'Guards against unreachable high-fit leads'],
        ['Strategic', '0.20', '0.05', '0.40', 'Identifies active buying-cycle signals'],
        ['Data Completeness', '0.15', '0.10', '0.40', 'Integrity multiplier; prevents over-scoring thin data'],
      ]},
      { type: 'heading', level: 2, content: 'When to Adjust Weights' },
      { type: 'paragraph', content: `The default weights are tuned for the average B2B SaaS ICP. You should consider a weight adjustment when your workspace deviates from the average in one of three ways. First, if your average sales cycle exceeds 120 days, intent signals decay before the deal closes — you should reduce the intent weight to 0.15 and increase the strategic weight to 0.25 to compensate with longer-horizon signals. Second, if your ICP includes a hard technology requirement (for example, your product only works for companies on Snowflake), you should increase the firmographic weight to 0.30 and decrease the intent weight to 0.15, because tech-stack fit is captured in firmographic enrichment. Third, if your primary channel is outbound phone and email deliverability is consistently poor in your ICP, you should increase the reachability weight to 0.25 and decrease the data completeness weight to 0.10, because reachability becomes the gating constraint on conversion.` },
      { type: 'paragraph', content: `Avoid adjusting weights in response to short-term fluctuations. A 2-week dip in reply rate is more likely caused by a deliverability issue, a seasonality effect, or a stale ICP definition than by a weight miscalibration. The platform's shadow-mode report includes a 30-day lookback comparison that surfaces whether the proposed weights would have produced a higher conversion rate over the last month. If the shadow-mode report shows less than a 5 percent improvement in conversion, do not promote the change — the improvement is within noise and the change carries operational cost (re-training the Outreach Composer's queue prioritization, invalidating pending A/B test results, and re-scoring every lead in your workspace).` },
      { type: 'heading', level: 2, content: 'Shadow-Mode Validation' },
      { type: 'paragraph', content: `Shadow mode is the platform's primary defense against weight-change regressions. When you save a proposed weight configuration, the platform does not apply it to production immediately — instead, it runs the proposed weights in parallel against every incoming lead for the next 24 hours, alongside the current production weights. Both scores are written to the lead audit history, and a comparison report is generated showing the tier distribution shift, the number of leads that would have changed tier, and the projected impact on the A-list, B-list, and C-list queues. The comparison report is the artifact you review before clicking Promote to Production.` },
      { type: 'code', language: 'json', caption: 'Shadow-mode comparison report returned after the 24-hour validation window', code: `{
  "proposed_weights": { "firmographic": 0.30, "intent": 0.15, "reachability": 0.20, "strategic": 0.25, "data_completeness": 0.10 },
  "current_weights": { "firmographic": 0.25, "intent": 0.20, "reachability": 0.20, "strategic": 0.20, "data_completeness": 0.15 },
  "validation_window_hours": 24,
  "leads_scored": 1842,
  "tier_distribution": {
    "current": { "super_hot": 47, "hot": 312, "warm": 871, "cold": 612 },
    "proposed": { "super_hot": 63, "hot": 358, "warm": 812, "cold": 609 }
  },
  "tier_transitions": {
    "promoted_to_super_hot": 18,
    "demoted_from_super_hot": 2,
    "promoted_to_hot": 41,
    "demoted_from_hot": 19
  },
  "projected_30d_impact": {
    "a_list_queue_growth_pct": 34.0,
    "b_list_queue_growth_pct": 14.7,
    "reply_rate_uplift_pct": 7.2,
    "meeting_rate_uplift_pct": 4.1
  },
  "recommendation": "promote",
  "confidence_interval": "95% CI: [3.1%, 11.3%] reply rate uplift"
}` },
      { type: 'heading', level: 2, content: 'A/B Testing Weight Variants' },
      { type: 'paragraph', content: `For high-stakes weight changes, the platform supports formal A/B testing of weight variants. You can configure up to three weight variants, assign each to a randomly-selected 33 percent slice of incoming leads, and run the test for 30 days. The test declares a winner when one variant produces a statistically significant improvement in 30-day conversion to engaged (p < 0.05, n >= 30 per variant). The winning variant is auto-promoted to production after the test completes, and the platform writes a winner declaration report to the audit log. A/B tests are the gold standard for weight changes but require patience — the 30-day window is non-negotiable because conversion signals take 14 to 21 days to surface after the first touchpoint.` },
      { type: 'steps', items: [
        `Navigate to Lead Qualification console, then Configuration, then Weights, and click New A/B Test.`,
        `Configure up to three weight variants. The platform enforces the same guardrails (0.05 to 0.40 per dimension, sum to 1.0, data completeness >= 0.10).`,
        `Select the test duration. The default is 30 days; you can extend to 60 days but cannot shorten below 30 days.`,
        `Select the success metric. The default is 30-day conversion to engaged; alternatives include reply rate, meeting set rate, or 90-day conversion to closed_won.`,
        `Review the sample size projection. The platform estimates the minimum detectable effect at the configured duration and traffic volume; if the projection shows you cannot detect a less than 10 percent effect, extend the duration.`,
        `Click Start Test. The platform randomly assigns each incoming lead to one of the variants for the configured duration.`,
        `Monitor the test dashboard weekly. The dashboard shows conversion rates per variant with 95 percent confidence intervals; do not declare a winner before the test completes.`,
        `When the test completes, review the winner declaration report. If a variant won with p < 0.05, click Promote to Production to apply the winning weights.`,
      ]},
      { type: 'callout', variant: 'warning', content: `Do not run more than one A/B test on the Lead Qualification agent concurrently. Concurrent tests interact in unpredictable ways — a weight change in test A can shift the tier distribution that test B is sampling from, producing confounded results that cannot be interpreted. If you need to test multiple changes, sequence them and wait for the first test to complete before starting the second.` },
      { type: 'heading', level: 2, content: 'Common Weighting Patterns' },
      { type: 'paragraph', content: `Three weighting patterns are commonly observed across customer workspaces. The default pattern (25/20/20/20/15) is the right starting point for any new workspace and produces pipelines that closely match the 1.4M-lead regression baseline. The long-cycle pattern (25/15/20/25/15) is used by teams with average sales cycles above 120 days and shifts weight from intent to strategic to compensate for intent signal decay. The channel-constrained pattern (25/15/25/20/15) is used by teams where phone reachability is the gating constraint on conversion; this pattern is most common in mature verticals like healthcare and financial services where email deliverability is consistently poor. None of these patterns are mandated — they are observed patterns that you can use as starting points for your own configuration.` },
      { type: 'list', items: [
        `Default (25/20/20/20/15): right starting point for any new workspace.`,
        `Long-cycle (25/15/20/25/15): for sales cycles over 120 days.`,
        `Channel-constrained (25/15/25/20/15): for workspaces with poor email deliverability.`,
        `Tech-fit (30/15/20/20/15): for ICPs with hard tech-stack requirements.`,
        `Inbound-heavy (20/25/20/20/15): for workspaces where inbound inquiry is the primary source.`,
      ]},
      { type: 'paragraph', content: `Every weight change is logged to the audit history with the previous weights, the new weights, the timestamp, and the user who made the change. The audit log is exportable as CSV from the Audit Log tab in workspace settings, and the export includes the shadow-mode comparison report and any A/B test winner declaration report attached to the change. We recommend reviewing the audit log monthly for unexpected weight changes — weight drift is a common cause of pipeline regression when multiple admins have configuration access. If you observe weight drift, restrict configuration access to a single named admin and require a peer review before any future weight change is promoted to production.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 15. SCORE THRESHOLDS & STAGES
  // ---------------------------------------------------------------------------
  {
    slug: 'qualification-thresholds',
    title: 'Score Thresholds & Stages',
    description: 'Map composite scores to lifecycle stages and tier-based SLAs, configure the qualification threshold at 50, and understand how tier transitions trigger Orchestrator routing decisions.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Score thresholds are the bridge between the Lead Qualification agent's composite score and the lead lifecycle. The platform defines nine lifecycle stages — new, enriched, qualified, contacted, engaged, negotiating, closed_won, closed_lost, and nurture — and four tier classifications — cold, warm, hot, and super_hot. Thresholds determine when a lead moves from new to enriched (when enrichment completes), from enriched to qualified (when the composite score crosses 50), and when a lead enters the A-list, B-list, or C-list queue in the Outreach Composer. Thresholds also drive the SLA clock: a super_hot lead (score 88 and above) starts a 5-minute first-touch SLA the moment it is scored, and a hot lead (70 to 87) starts a 1-hour SLA. Missing an SLA escalates the lead to the workspace admin and surfaces a red banner on the dashboard.` },
      { type: 'paragraph', content: `The qualification threshold at score 50 is the most important threshold in the platform. Leads below 50 never enter the Outreach Composer's active queue — they are routed to the nurture queue, where they receive a low-frequency drip campaign designed to warm them up over 90 days. Leads at or above 50 are routed into the Outreach Composer's active queue and assigned to a tier-based cadence. The 50 threshold was derived from the same 1.4M-lead regression that produced the default weights: leads with composite scores below 50 converted to closed_won at 0.8 percent, while leads with scores 50 to 69 converted at 4.2 percent, and leads with scores 70 and above converted at 11.7 percent. The 50 threshold captures the inflection point where conversion probability crosses the operational breakeven for outbound cost.` },
      { type: 'heading', level: 2, content: 'The Nine Lifecycle Stages' },
      { type: 'paragraph', content: `The lifecycle stages are sequential and directional. A lead moves from new to enriched when the Data Enrichment agent completes its first pass and produces the 60-field enrichment payload. A lead moves from enriched to qualified when the Lead Qualification agent computes a composite score at or above 50; leads below 50 remain in the enriched stage and are simultaneously routed to the nurture queue. A lead moves from qualified to contacted when the Outreach Composer executes the first touchpoint in the cadence. A lead moves from contacted to engaged when the prospect replies, books a meeting, or otherwise signals interest. A lead moves from engaged to negotiating when the conversation progresses to pricing, scope, or contract terms. A lead moves to closed_won or closed_lost when the deal is marked won or lost in the CRM sync. A lead can also move to nurture at any stage if it goes silent for 30 days, in which case it re-enters the drip campaign and is eligible for re-qualification if a new intent signal surfaces in the next 90 days.` },
      { type: 'table', caption: 'Lifecycle stages, entry criteria, and Orchestrator routing', headers: ['Stage', 'Entry Criteria', 'Routing Decision', 'SLA Clock'], rows: [
        ['new', 'Lead created by Prospect Discovery', 'Route to Data Enrichment', 'Not started'],
        ['enriched', '60-field payload complete', 'Route to Lead Qualification', 'Not started'],
        ['qualified', 'Composite score >= 50', 'Route to Outreach Composer queue', 'Tier-based SLA starts'],
        ['contacted', 'First touchpoint executed', 'Continue cadence', 'SLA satisfied'],
        ['engaged', 'Reply or meeting booked', 'Route to Account Executive', 'Pause cadence'],
        ['negotiating', 'Pricing/scope discussion', 'Route to Account Executive', 'Pause cadence'],
        ['closed_won', 'CRM marks deal won', 'Remove from active queue', 'Stop'],
        ['closed_lost', 'CRM marks deal lost', 'Move to closed-lost archive', 'Stop'],
        ['nurture', '30 days silent OR score < 50', 'Drip campaign', 'No SLA'],
      ]},
      { type: 'heading', level: 2, content: 'Tier-Based SLA Windows' },
      { type: 'paragraph', content: `Each tier carries a first-touch SLA window that the platform measures from the moment the composite score is computed. The super_hot tier (88 and above) has a 5-minute SLA, which means the first touchpoint in the cadence must execute within 5 minutes of scoring. The hot tier (70 to 87) has a 1-hour SLA. The warm tier (40 to 69) has a 24-hour SLA. The cold tier (below 40) has no SLA because cold leads are routed to nurture and never enter the active outreach queue. The SLA clock is wall-clock time, not business hours, because intent signals decay rapidly and a 5-minute response window is what differentiates an A-list lead from a competitor's win. The SLA clock pauses only when the Outreach Composer executes the first touchpoint; if the touchpoint fails (for example, email bounces), the SLA clock continues and the platform attempts a fallback channel within the same window.` },
      { type: 'paragraph', content: `Missing an SLA has two consequences. First, the lead is flagged as SLA-breached in the audit history, and a webhook event (lead.sla_breached) fires to any registered downstream integration. Second, the lead is escalated to the workspace admin, who receives an in-app notification and an email summary listing every breached lead. SLA breaches are also surfaced on the dashboard as a red banner with the breach count for the last 24 hours. Sustained SLA breaches indicate one of three root causes: the Outreach Composer's sending infrastructure is throttled (usually caused by an unverified sending domain), the A-list queue is saturated (usually caused by an ICP that is too permissive), or the Orchestrator's routing latency is too high (usually caused by a configuration error in the agent topology). The platform's health monitor surfaces the root cause in the agent performance panel.` },
      { type: 'heading', level: 2, content: 'Configurable Thresholds' },
      { type: 'paragraph', content: `The qualification threshold of 50 and the three tier thresholds (40, 70, 88) are configurable on Enterprise and Enterprise Plus tiers. On Starter, Growth, and Scale tiers, the thresholds are locked at the defaults. The platform enforces three constraints on threshold configuration: the qualification threshold cannot be set below 40 (because doing so collapses the active queue with low-quality leads), the super_hot threshold cannot be set below 85 (because doing so violates the A-list 5-minute SLA capacity), and the four tier thresholds must be strictly increasing (cold below warm below hot below super_hot). Threshold changes are subject to the same 24-hour shadow-mode validation as weight changes.` },
      { type: 'code', language: 'json', caption: 'Threshold configuration payload with default values', code: `{
  "thresholds": {
    "qualification": 50,
    "tier_cold_max": 39,
    "tier_warm_min": 40,
    "tier_warm_max": 69,
    "tier_hot_min": 70,
    "tier_hot_max": 87,
    "tier_super_hot_min": 88,
    "tier_super_hot_max": 100
  },
  "sla_windows_minutes": {
    "super_hot": 5,
    "hot": 60,
    "warm": 1440,
    "cold": null
  },
  "nurture_routing": {
    "score_below_qualification": true,
    "silent_days_threshold": 30,
    "re_qualification_window_days": 90
  },
  "editable_on_tiers": ["enterprise", "enterprise_plus"],
  "shadow_mode_required": true,
  "shadow_mode_duration_hours": 24
}` },
      { type: 'heading', level: 2, content: 'Tier Transitions and Webhook Events' },
      { type: 'paragraph', content: `Tier transitions fire webhook events that downstream integrations can subscribe to. The lead.tier_changed event fires whenever a lead's tier classification changes, carrying the previous tier, the new tier, the previous score, the new score, and the timestamp. The lead.qualified event fires when a lead crosses the qualification threshold for the first time, and the lead.disqualified event fires when a disqualification rule matches (see the disqualifier list in the next section). The lead.sla_breached event fires when an SLA window elapses without a first touchpoint. All webhook events are delivered with HMAC-SHA256 signing and retry with exponential backoff for up to 24 hours.` },
      { type: 'callout', variant: 'info', content: `Tier transitions are directional and irreversible within a 24-hour window. If a lead promotes from warm to hot and then demotes back to warm within 24 hours, the platform suppresses the demotion event to prevent webhook storm. This is intentional — intent signals are noisy and a single signal change should not produce a tier yo-yo that confuses downstream integrations.` },
      { type: 'heading', level: 2, content: 'Boosters and Stage Promotion' },
      { type: 'paragraph', content: `Three boosters can promote a lead's tier independently of the composite score. An inbound inquiry (the prospect fills out a contact form or books a meeting directly) adds 15 points to the composite score for 30 days. A referral from an existing customer adds 10 points for 60 days. An analyst mention (Gartner, Forrester, G2, or TrustRadius) adds 5 points for 90 days. Boosters are applied after the LLM computes the base score and are tracked separately in the audit trail so you can distinguish LLM-derived score from booster-enhanced score. Boosters cannot push a lead above 100 — the score is hard-capped at 100 even with boosters applied.` },
      { type: 'paragraph', content: `Boosters are most impactful at the tier boundary. A lead with a composite score of 73 (hot) and a +15 inbound inquiry booster jumps to 88 (super_hot), triggering the 5-minute A-list SLA. This is intentional — an inbound inquiry is the strongest possible conversion signal and should override the LLM's more conservative scoring. Without boosters, the LLM's conservative scoring would leave inbound inquirers in the B-list queue, which is operationally wrong. Boosters are also used to rescue borderline leads — a lead with a score of 47 (warm, below qualification) and a +10 referral booster crosses the qualification threshold to 57 and enters the active queue.` },
      { type: 'steps', items: [
        `Open the Lead Qualification console and click the Thresholds tab.`,
        `Review the current threshold configuration and the SLA windows.`,
        `Click Edit Thresholds. The platform displays the guardrail constraints and the shadow-mode requirement.`,
        `Adjust the thresholds using the sliders. The platform validates the constraints in real time and prevents saving an invalid configuration.`,
        `Click Save and Validate. The platform runs the shadow-mode validation for 24 hours.`,
        `After validation completes, review the comparison report in the Configuration, then Shadow Mode Reports tab.`,
        `Click Promote to Production to apply the new thresholds, or Discard to revert to the previous configuration.`,
      ]},
      { type: 'heading', level: 2, content: 'Common Pitfalls' },
      { type: 'list', items: [
        `Do not lower the qualification threshold below 50 to boost pipeline volume. The conversion rate at scores 40 to 49 is below the operational breakeven, and the extra volume produces negative ROI on outreach cost.`,
        `Do not raise the super_hot threshold above 88 to keep the A-list queue small. Above 88, the queue becomes too sparse to support the 5-minute SLA, and the SLA clock fires on leads that have already been touched.`,
        `Do not change the SLA windows. The 5-minute / 1-hour / 24-hour windows are calibrated against the platform's sending infrastructure capacity. Shorter windows violate capacity; longer windows signal that intent decay has outpaced your response.`,
        `Do not disable boosters. Boosters are the platform's primary mechanism for promoting inbound inquiries to the A-list queue, and disabling them produces the operationally wrong behavior of treating inbound inquirers as B-list leads.`,
        `Do not change the nurture silent-days threshold below 30. Shorter thresholds pull leads out of active outreach too early and produce churn in the cadence scheduler.`,
      ]},
      { type: 'paragraph', content: `Thresholds and stages are the operational contract between the Lead Qualification agent and the rest of the platform. Every downstream agent — the Orchestrator, the Outreach Composer, the Report Generator — reads the stage and tier to make routing, prioritization, and reporting decisions. Misconfigured thresholds produce compounding errors that surface weeks later as reply-rate drops, SLA breaches, and CRM pipeline mismatches. Treat threshold configuration as a quarterly review item alongside weight configuration, and use the shadow-mode report as the primary evidence source for any change.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 16. AUTOMATED DISQUALIFICATION RULES
  // ---------------------------------------------------------------------------
  {
    slug: 'qualification-disqualify',
    title: 'Automated Disqualification Rules',
    description: 'Configure automated disqualification rules that prevent existing customers, competitor employees, sub-scale companies, and excluded industries from entering your active pipeline.',
    category: 'AI Agents',
    readTime: '7 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Automated disqualification rules are the first line of defense against pipeline pollution. The Lead Qualification agent evaluates every discovered lead against four default disqualifier categories before computing the composite score: existing customers, competitor employees, sub-scale companies, and excluded industries. A lead that matches any disqualifier is routed to the disqualified queue, removed from the active outreach pipeline, and excluded from all downstream agent processing. Disqualification is the strongest action the Lead Qualification agent can take — it is more decisive than a low score, because disqualification prevents the lead from ever entering the scoring pipeline. The four default categories cover the most common pipeline-pollution scenarios observed across 1.4M scored leads, and the platform supports up to 12 additional custom disqualifier rules per workspace for industry-specific exclusions.` },
      { type: 'paragraph', content: `Disqualification is reversible. Every disqualified lead is retained in the workspace for 7 years (the SOC 2 retention minimum) and can be re-qualified if the underlying disqualifier no longer applies — for example, a competitor employee who changes jobs. The platform evaluates re-qualification eligibility every 90 days for leads disqualified due to employment or industry, and surfaces a re-qualification candidate list in the Lead Qualification console. Re-qualification is manual — you must click the Re-qualify button to confirm that the disqualifier no longer applies, after which the lead re-enters the standard scoring pipeline.` },
      { type: 'heading', level: 2, content: 'The Four Default Disqualifiers' },
      { type: 'paragraph', content: `The existing customer disqualifier matches any lead whose email domain appears in your connected CRM's customer list. The platform pulls the customer list from your CRM nightly via the integration adapter, and any match against the lead's email domain triggers disqualification before scoring begins. This disqualifier prevents the embarrassing and operationally costly scenario of your Outreach Composer emailing an existing customer with a new-business cadence. The competitor employee disqualifier matches any lead whose current employer appears in your configured competitor list. The competitor list is maintained in the Lead Qualification console under the Disqualifiers tab; you can add up to 200 competitor companies, and the platform matches against the lead's current employer field.` },
      { type: 'paragraph', content: `The sub-scale company disqualifier matches any lead whose company falls below your ICP's minimum employee count or minimum revenue band. The thresholds are inherited from your ICP definition — if your ICP specifies a minimum of 200 employees and $10M ARR, any lead with fewer than 200 employees OR less than $10M ARR is disqualified. This disqualifier prevents wasted outreach on companies that cannot afford your product, which is the third-leading cause of pipeline regression after stale ICP definitions and misconfigured weights. The excluded industry disqualifier matches any lead whose industry NAICS code appears in your ICP's excluded industries list. Common exclusions include government, defense, adult entertainment, and regulated gambling — these industries typically require compliance review that the standard outreach cadence cannot accommodate.` },
      { type: 'table', caption: 'Default disqualifier categories, matching logic, and re-qualification cadence', headers: ['Disqualifier', 'Match Logic', 'Match Field', 'Re-qualification Cadence'], rows: [
        ['Existing customer', 'Email domain in CRM customer list', 'lead.email_domain', 'Automatic (CRM list refresh)'],
        ['Competitor employee', 'Current employer in competitor list', 'lead.current_employer', '90-day review'],
        ['Sub-scale company', 'Below ICP min employee count OR revenue', 'company.employee_count, company.revenue', '90-day review'],
        ['Excluded industry', 'Industry NAICS in ICP exclusion list', 'company.industry_naics', 'Manual only'],
      ]},
      { type: 'heading', level: 2, content: 'Custom Disqualifier Rules' },
      { type: 'paragraph', content: `Enterprise and Enterprise Plus tiers support up to 12 custom disqualifier rules per workspace. Custom rules are JSON-structured predicates evaluated against the enrichment payload, supporting field equality, field inequality, regex match, range match, and logical AND/OR composition. Common custom rules include excluding companies with a recent layoff announcement (within 60 days), excluding companies in active M&A due diligence, excluding companies with a public funding round below your minimum threshold, and excluding companies headquartered in embargoed countries. Custom rules are evaluated after the four default disqualifiers and before the composite score is computed.` },
      { type: 'code', language: 'json', caption: 'Custom disqualifier rule example: exclude companies with recent layoffs', code: `{
  "rule_id": "dq_recent_layoff",
  "name": "Recent Layoff Exclusion",
  "description": "Disqualify leads whose company announced layoffs in the last 60 days",
  "predicate": {
    "field": "company.recent_layoff_announced",
    "operator": "equals",
    "value": true,
    "and": [
      {
        "field": "company.layoff_announcement_date",
        "operator": "within_days",
        "value": 60
      }
    ]
  },
  "action": "disqualify",
  "reason": "recent_layoff",
  "re_qualification_cadence_days": 90,
  "notify_admin": true,
  "enabled": true
}` },
      { type: 'heading', level: 2, content: 'Disqualification Flow' },
      { type: 'paragraph', content: `When a disqualifier matches, the platform executes a four-step flow. First, the lead is moved to the disqualified stage in the lifecycle and removed from any active Outreach Composer queue. Second, the lead.disqualified webhook event fires, carrying the matched rule ID, the reason code, and the timestamp. Third, the lead is added to the disqualified audit log, which is exportable as CSV from the Lead Qualification console. Fourth, if the matched rule has notify_admin set to true, the workspace admin receives an in-app notification and an email summary. The entire flow executes within 200 milliseconds of the disqualifier match, so disqualified leads never enter the active scoring pipeline and never trigger an SLA clock.` },
      { type: 'steps', items: [
        `Open the Lead Qualification console and click the Disqualifiers tab.`,
        `Review the four default disqualifiers. Confirm that the CRM customer list integration is connected (the Existing Customer row shows a green checkmark) and that your competitor list is up to date.`,
        `Click New Custom Rule to add a custom disqualifier. The rule builder supports field equality, regex match, range match, and AND/OR composition.`,
        `Configure the rule predicate, action (always disqualify), reason code, re-qualification cadence, and notify_admin flag.`,
        `Click Save. The platform runs the rule against the last 1000 leads in shadow mode and shows the projected match count in a preview pane.`,
        `Click Enable to activate the rule. Future leads that match the rule are disqualified at enrichment time.`,
        `Monitor the disqualified audit log weekly for unexpected match counts. A sudden spike in matches usually indicates an enrichment data quality issue, not a real disqualifier match.`,
      ]},
      { type: 'callout', variant: 'warning', content: `Custom disqualifier rules are evaluated against the raw enrichment payload, not against the LLM-derived dimension scores. If you write a rule that depends on a field the Data Enrichment agent does not populate (for example, a custom field added by your CRM integration but not yet mapped into the enrichment payload), the rule will never match. Always verify the field path exists in the enrichment payload by inspecting a sample lead before writing a rule against it.` },
      { type: 'heading', level: 2, content: 'Disqualification Audit Trail' },
      { type: 'paragraph', content: `Every disqualification is logged with the lead ID, the matched rule ID, the rule predicate evaluation trace, the timestamp, and the user or system that triggered the match. The audit trail is retained for 7 years on all tiers (extended from the SOC 2 minimum of 5 years) and is exportable as CSV from the Lead Qualification console. The audit trail also records re-qualifications — when a lead is re-qualified, the audit trail shows the original disqualifier, the re-qualification timestamp, and the user who confirmed the re-qualification. The audit trail is the primary artifact you review during quarterly compliance audits and during customer data subject access requests.` },
      { type: 'paragraph', content: `The disqualified audit trail is also the primary signal for detecting disqualifier rule drift. If a rule that previously matched 20 leads per week suddenly matches 200, the underlying enrichment data has likely changed. The most common cause of rule drift is a CRM integration update that renames a field or changes a value vocabulary — for example, the CRM changes "Software" to "Software / SaaS" in the industry field, which breaks industry-based disqualifier rules. The platform surfaces rule drift in the Lead Qualification console's Health tab, with a chart showing the 30-day match count per rule and a flag on any rule whose match count has shifted by more than 2 standard deviations from the trailing 30-day mean.` },
      { type: 'list', items: [
        `Review the disqualified audit log weekly for unexpected match count spikes.`,
        `Audit the competitor list quarterly — competitor acquisitions and rebrands change the match landscape.`,
        `Re-evaluate custom rules whenever you change your ICP definition. Rules tied to ICP fields can become orphaned when the ICP changes.`,
        `Document the business rationale for every custom rule in the description field. Future admins need to understand why a rule exists before they edit or disable it.`,
        `Test new custom rules against the last 1000 leads in shadow mode before enabling. The shadow-mode preview shows the projected match count and any unexpected matches against existing pipeline leads.`,
        `Never delete a disqualifier rule. Disable it instead. Deleted rules are removed from the audit trail; disabled rules are preserved with a disabled flag for compliance review.`,
      ]},
      { type: 'heading', level: 2, content: 'Re-qualification Workflow' },
      { type: 'paragraph', content: `Re-qualification is the process by which a previously-disqualified lead re-enters the active scoring pipeline. The platform evaluates re-qualification eligibility every 90 days for leads disqualified due to competitor employment or sub-scale company status. The platform surfaces a re-qualification candidate list in the Lead Qualification console, showing each candidate with the original disqualifier, the original disqualification date, and the evidence that the disqualifier no longer applies (for example, the lead's current employer has changed, or the company's employee count has grown past the ICP minimum). Re-qualification is always manual — you must click the Re-qualify button to confirm the re-qualification, after which the lead re-enters the standard scoring pipeline and is scored within 8 seconds.` },
      { type: 'paragraph', content: `Leads disqualified due to existing customer status are re-qualified automatically when the CRM customer list refresh removes their domain. Leads disqualified due to excluded industry are re-qualified only via manual override, because industry changes are rare and require compliance review. The re-qualification workflow is the platform's mechanism for recovering leads whose disqualifier was transient — competitor employees change jobs, sub-scale companies grow, and customer relationships end. Without re-qualification, the disqualified queue would become a permanent graveyard that prevents the platform from ever recovering high-value leads. With re-qualification, the disqualified queue is a 90-day rolling window that surfaces recoverable leads on a predictable cadence.` },
      { type: 'callout', variant: 'tip', content: `Set a recurring calendar reminder to review the re-qualification candidate list every 90 days. The list is typically short (5 to 20 leads per quarter for most workspaces) but contains disproportionately high-value leads — competitor employees who recently joined your ICP companies are the highest-conversion cohort in the platform, with reply rates 2.3x the baseline.` },
    ],
  },

  // ===========================================================================
  // CARD 5: OUTREACH COMPOSER AGENT (BARD)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 17. PERSONALIZATION ENGINE
  // ---------------------------------------------------------------------------
  {
    slug: 'outreach-personalization',
    title: 'Personalization Engine',
    description: 'Generate 5-10 personalization points per lead using the Outreach Composer agent, surface recent blog posts, funding rounds, tech choices, shared connections, and industry events, and adapt follow-ups based on engagement signals.',
    category: 'AI Agents',
    readTime: '9 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `The Outreach Composer agent — internally called Bard — is the creative engine of the LeadReach platform. Bard generates between 5 and 10 personalization points per lead, drawn from the enrichment payload and the live web signals the platform continuously monitors. Each personalization point is a single factual statement about the prospect or their company that the Outreach Composer weaves into the email, LinkedIn message, or phone script. Personalization points are not generic compliments — they are specific, verifiable facts such as "your team published a blog post on multi-tenant architecture 12 days ago" or "your company raised a Series C round of $48M 62 days ago." The Composer runs on the glm-4.6v-flash model at temperature 0.7, which is the highest temperature in the platform and reflects the creativity-oriented nature of outreach generation. The Composer's maxTokens budget is 2000, which is sufficient for a full email body with subject line and CTA, a LinkedIn connection request, or a 30-second phone script.` },
      { type: 'paragraph', content: `Personalization is the single highest-leverage lever in outbound outreach. Industry benchmarks consistently show that personalized emails receive 6-8x the reply rate of generic templates, and that personalization beyond first-name tokens (so-called deep personalization) produces an additional 2-3x lift. The Outreach Composer's goal is to produce deep personalization at scale — every email should read as if it were written by a sales development rep who spent 20 minutes researching the prospect, but the email should be generated in under 4 seconds and sent automatically within the cadence window. The platform's 8-12 percent reply rate target and 3-5 percent meeting set rate target are both predicated on the Composer producing deep personalization on every touchpoint in the 7-touch, 14-day cadence.` },
      { type: 'heading', level: 2, content: 'Personalization Point Sources' },
      { type: 'paragraph', content: `The Composer draws personalization points from five primary sources. The first source is the prospect's professional activity: recent blog posts, conference talks, podcast appearances, and LinkedIn long-form posts. The platform monitors the prospect's LinkedIn and company blog every 24 hours and surfaces any new content as a personalization candidate. The second source is the company's funding and financial events: recent funding rounds, M&A activity, earnings calls, and analyst reports. These events are pulled from Crunchbase, PitchBook, and SEC filings every 6 hours and tagged with a 90-day relevance window — events older than 90 days are not used as personalization points because they are no longer top-of-mind for the prospect.` },
      { type: 'paragraph', content: `The third source is the company's technology choices: recently adopted tools, recently deprecated tools, and engineering blog posts that mention specific technologies. The platform monitors GitHub, the company's engineering blog, and job postings (which frequently mention required technologies) every 24 hours. Tech choice personalization is especially valuable when your product integrates with or replaces a specific technology — for example, if you sell a CRM, mentioning that the prospect's company recently posted a job for a Salesforce administrator signals that they are in an active tooling review. The fourth source is shared connections: teammates, customers, or partners who are connected to the prospect on LinkedIn. The Composer uses a 2-hop LinkedIn graph query to surface shared connections, and references them by first name in the email body.` },
      { type: 'paragraph', content: `The fifth source is industry events: conferences, trade shows, and analyst summits that the prospect or their company has attended or spoken at in the last 180 days. The platform monitors event attendee lists, speaker rosters, and post-event blog coverage every 24 hours. Industry event personalization is most effective when the event is recent (within 60 days) and when your team also attended or sponsored the event — the shared context provides a natural opening for the email that does not feel forced.` },
      { type: 'table', caption: 'Personalization point sources, refresh cadence, and relevance windows', headers: ['Source', 'Refresh Cadence', 'Relevance Window', 'Personalization Examples'], rows: [
        ['Professional activity', '24 hours', '60 days', 'Blog post, conference talk, podcast, LinkedIn post'],
        ['Funding and financial', '6 hours', '90 days', 'Series round, M&A, earnings call, analyst report'],
        ['Technology choices', '24 hours', '180 days', 'Job posting tech, engineering blog, GitHub repo'],
        ['Shared connections', 'On-demand', 'Permanent', '2-hop LinkedIn path, customer reference'],
        ['Industry events', '24 hours', '180 days', 'Conference, trade show, analyst summit'],
      ]},
      { type: 'heading', level: 2, content: 'Personalization Point Generation' },
      { type: 'paragraph', content: `The Composer generates personalization points using a two-pass pipeline. The first pass retrieves all candidate signals from the enrichment payload and the live web monitors, deduplicates them, and ranks them by recency and strength. The second pass invokes the LLM with the ranked candidate list, the prospect's ICP-fit summary, and your configured outreach voice (consultative, challenger, or consultative-challenger hybrid). The LLM produces 5 to 10 personalization points in a structured JSON format, each point containing a fact statement, the source URL, the recency in days, and a suggested integration site (opening, body, closing). The Composer selects the top 3 to 5 points to weave into the actual outreach message, prioritizing points that map to multiple integration sites to maximize message coherence.` },
      { type: 'code', language: 'json', caption: 'Example personalization point payload returned by the Composer for a single lead', code: `{
  "lead_id": "lead_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "personalization_points": [
    {
      "fact": "Published a blog post on multi-tenant SaaS architecture 12 days ago",
      "source": "https://blog.acme.com/multi-tenant-architecture",
      "recency_days": 12,
      "strength": "high",
      "integration_site": "opening"
    },
    {
      "fact": "Raised a Series C round of $48M 62 days ago",
      "source": "https://crunchbase.com/funding/acme-series-c",
      "recency_days": 62,
      "strength": "high",
      "integration_site": "body"
    },
    {
      "fact": "Recently added Snowflake to their tech stack 41 days ago",
      "source": "https://github.com/acme/data-platform",
      "recency_days": 41,
      "strength": "medium",
      "integration_site": "body"
    },
    {
      "fact": "2-hop LinkedIn connection via teammate Sarah Chen",
      "source": "linkedin:shared_connection",
      "recency_days": 0,
      "strength": "medium",
      "integration_site": "opening"
    },
    {
      "fact": "VP of Sales Engineering spoke at Saastr Annual 2025 38 days ago",
      "source": "https://saastr.com/annual-2025/agenda",
      "recency_days": 38,
      "strength": "medium",
      "integration_site": "closing"
    }
  ],
  "selected_for_outreach": 4,
  "model": "glm-4.6v-flash",
  "temperature": 0.7,
  "computed_at": "2025-01-15T14:32:11.000Z"
}` },
      { type: 'heading', level: 2, content: 'Engagement-Adaptive Follow-Ups' },
      { type: 'paragraph', content: `The Composer adapts follow-up touchpoints based on the prospect's engagement with previous touchpoints. There are four engagement states the Composer tracks: opened-no-reply (the prospect opened the email but did not reply), replied-positive (the prospect replied with interest or booked a meeting), replied-negative (the prospect replied asking to be removed or not interested), and silent (the prospect did not open the email). Each state triggers a different follow-up template that references the prior engagement appropriately.` },
      { type: 'paragraph', content: `The opened-no-reply state produces a follow-up that references the prior email's content without re-sending it. The Composer extracts the core value proposition from the prior email and presents it from a different angle — for example, if the prior email mentioned a case study, the follow-up might mention a different case study or a quantified metric from the same case study. The replied-positive state triggers the meeting-booking flow: the Composer sends a calendar link with two suggested time slots pulled from your team's calendar availability, and a short message that confirms the prospect's interest. The replied-negative state triggers a polite acknowledgment email that confirms the opt-out, removes the prospect from the active cadence, and adds them to the nurture queue with a 90-day re-engagement window. The silent state (no open after 48 hours) triggers a breakup email on day 14 of the cadence that asks for a yes-or-no reply and gracefully closes the loop.` },
      { type: 'callout', variant: 'tip', content: `Monitor the silent-state rate weekly. If more than 35 percent of your touchpoints fall into the silent state, your subject lines or sender reputation are likely the problem, not your personalization. Run an A/B test on subject line length and personalization density before adjusting the personalization engine itself.` },
      { type: 'heading', level: 2, content: 'Outreach Voice Configuration' },
      { type: 'paragraph', content: `The Composer supports three outreach voices: consultative, challenger, and consultative-challenger hybrid. The consultative voice positions your team as a trusted advisor who has researched the prospect's situation and is offering to help. Emails in the consultative voice are typically 150 to 180 words, lead with a personalization point, present a quantified value proposition, and close with a soft CTA (a question rather than a meeting request). The challenger voice positions your team as a contrarian who is pushing the prospect to rethink an assumption. Emails in the challenger voice are typically 120 to 150 words, lead with a counter-intuitive observation, present a sharp value proposition, and close with a direct CTA (a meeting request). The hybrid voice blends the two, leading consultative and closing challenger.` },
      { type: 'paragraph', content: `The default voice is consultative, which is the most broadly effective voice across the 1.4M-lead regression. The challenger voice outperforms consultative in deals over $50K ACV and in ICPs where the prospect is a senior executive (VP or above). The hybrid voice outperforms both in deals between $10K and $50K ACV. Voice is configured at the campaign level, not the lead level, so all touchpoints in a single campaign share the same voice. You can run separate campaigns with different voices if you want to A/B test voice effectiveness in your ICP.` },
      { type: 'heading', level: 2, content: 'Personalization Quality Gates' },
      { type: 'paragraph', content: `The Composer applies five quality gates to every generated message before it is queued for sending. The first gate verifies that every personalization point in the message has a verifiable source URL — points without a source are stripped. The second gate verifies that the message does not exceed the channel-specific length limit (150 words for email, 200 characters for LinkedIn, 30 seconds for phone). The third gate verifies that the message contains exactly one CTA — multiple CTAs are stripped to the strongest one. The fourth gate verifies that the message does not contain prohibited phrases (your configured prohibited phrase list, which by default includes "free," "guarantee," and "no obligation"). The fifth gate verifies that the message does not exceed the temperature-derived variance threshold — if the message diverges from the template by more than 40 percent, it is flagged for human review.` },
      { type: 'steps', items: [
        `Open the Outreach Composer console and click the Personalization tab.`,
        `Review the five personalization sources. Confirm that each source is enabled and that the refresh cadence is appropriate for your ICP.`,
        `Click Test Personalization on a sample lead. The platform displays the 5 to 10 personalization points generated for that lead with source URLs and recency.`,
        `Review the points for accuracy. If any point is factually incorrect, click the flag icon to report it — the platform uses the report to retrain the source monitor.`,
        `Click Generate Sample Email to see how the Composer weaves the selected points into an actual message.`,
        `Adjust the outreach voice (consultative, challenger, hybrid) and regenerate to compare.`,
        `Click Save Configuration to apply the personalization settings to all future campaigns.`,
      ]},
      { type: 'list', items: [
        `Aim for 3 to 5 personalization points per email. More than 5 produces a cluttered message; fewer than 3 produces a generic message.`,
        `Prioritize recent points. A blog post from 12 days ago is 3x more effective than a funding round from 90 days ago.`,
        `Use shared connections sparingly. Mentioning a 2-hop connection in every email feels forced; use it in 30 to 40 percent of emails.`,
        `Match the personalization point to the outreach voice. Challenger voice works best with tech choice and industry event points; consultative works best with professional activity and funding points.`,
        `Review the personalization quality gates report weekly. If the human-review queue is consistently above 5 percent of generated messages, your prohibited phrase list is too narrow or your template diverges too much from the generated output.`,
        `A/B test personalization density. Run a 30-day test with 3 points per email versus 5 points per email to find the optimal density for your ICP.`,
      ]},
      { type: 'paragraph', content: `The personalization engine is the primary differentiator between LeadReach and template-based outreach tools. Template-based tools produce personalization at the first-name and company-name level, which prospects recognize instantly and discount. The Composer produces personalization at the recent-activity and strategic-event level, which prospects recognize as research and respond to. The 8 to 12 percent reply rate target is achievable only with the Composer's deep personalization — generic templates produce 1 to 2 percent reply rates regardless of ICP fit. Treat the personalization engine as the creative core of the platform and tune it quarterly based on reply rate A/B tests.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 18. MESSAGE TEMPLATES & VARIABLES
  // ---------------------------------------------------------------------------
  {
    slug: 'outreach-templates',
    title: 'Message Templates & Variables',
    description: 'Use the 50+ template library organized by persona, industry, and funnel stage, inject dynamic variables, and follow channel-specific formatting guidelines for email, LinkedIn, and phone.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `The Outreach Composer's template library contains 50+ pre-built message templates organized along three dimensions: persona (decision-maker, influencer, champion, end-user), industry (SaaS, financial services, healthcare, manufacturing, retail, education), and funnel stage (top-of-funnel awareness, mid-funnel consideration, bottom-of-funnel decision, post-purchase expansion). Templates are the structural skeleton of every generated message — the Composer uses the template to define message structure, CTA placement, and tone, then weaves personalization points into the template's variable slots. Templates are not static text — they contain dynamic variables that the Composer fills with lead-specific data at generation time. The combination of a strong template and deep personalization is what produces the 8 to 12 percent reply rate target.` },
      { type: 'paragraph', content: `Templates are stored in the Template Library console, where you can browse, preview, edit, and fork templates. The library ships with 50+ system templates that are maintained by the LeadReach content team and updated quarterly based on aggregate reply-rate performance. You can also create custom templates, fork system templates to customize them, and import templates from other workspaces via JSON export. Every template carries metadata: persona, industry, funnel stage, channel (email, LinkedIn, phone), word count, CTA type, and historical reply-rate performance drawn from the 1.4M-lead regression. Templates with reply rates below 3 percent are flagged for review and may be deprecated in the next quarterly release.` },
      { type: 'heading', level: 2, content: 'Template Structure and Variables' },
      { type: 'paragraph', content: `Every template is composed of five structural sections: opening, personalization_slot, value_proposition, social_proof, and CTA. The opening is a one-sentence hook that grabs attention; the personalization_slot is a variable that the Composer fills with a personalization point at generation time; the value_proposition is a two-sentence quantified statement of the value you offer; the social_proof is an optional one-sentence reference to a customer case study or metric; and the CTA is a single-sentence request for next action. Templates enforce exactly one CTA per message — multiple CTAs are stripped by the personalization quality gates because they reduce reply rate by 30 to 40 percent in the regression baseline.` },
      { type: 'paragraph', content: `Variables are wrapped in double curly braces ({{variable_name}}) and are case-sensitive. The platform supports three variable types. System variables ({{first_name}}, {{company_name}}, {{sender_name}}, {{sender_company}}) are populated from the lead record and the sender configuration. Personalization variables ({{personalization_opening}}, {{personalization_body}}) are populated by the Composer from the personalization point list. Conditional variables ({{#if has_shared_connection}}...{{/if}}) are populated based on the enrichment payload — for example, the shared connection block only renders if the lead has a 2-hop LinkedIn connection from your team. Variables are evaluated left-to-right at generation time, and missing variables are silently stripped rather than rendering as empty braces.` },
      { type: 'code', language: 'text', caption: 'Sample email template with variable slots and conditional blocks', code: `Hi {{first_name}},

{{personalization_opening}}

I noticed that {{company_name}} is in the middle of a {{value_proposition_trigger}} — our team recently helped {{customer_reference}} achieve {{quantified_metric}} by addressing the same challenge.

{{#if has_shared_connection}}
{{sender_name}} mentioned that you and {{shared_connection_name}} are connected — I would value 15 minutes to walk you through the playbook we used.
{{/if}}
{{#unless has_shared_connection}}
Would you be open to a 15-minute call next week to walk through the playbook?
{{/unless}}

Best,
{{sender_name}}` },
      { type: 'heading', level: 2, content: 'Channel-Specific Formatting' },
      { type: 'paragraph', content: `Each channel has different formatting constraints that templates must respect. Email templates are capped at 150 words (including subject line), use plain text only (no HTML, no images, no attachments), and must include a physical mailing address in the footer to comply with CAN-SPAM. The subject line is generated separately by the Composer and is capped at 50 characters; subject lines with personalization tokens (the prospect's first name, company name, or a personalization point keyword) outperform generic subject lines by 22 percent in the regression baseline.` },
      { type: 'paragraph', content: `LinkedIn templates are capped at 200 characters for connection requests and 300 characters for in-mail messages. Connection requests must be plain text with no URLs — LinkedIn's spam filter flags connection requests with URLs and reduces acceptance rate by 60 percent. The Composer generates connection requests without URLs and uses the personalization point as the hook; URLs are reserved for in-mail messages sent after the connection is accepted. Phone templates are 30-second scripts for live conversation and 15-second scripts for voicemail. The 30-second script is structured as a four-sentence arc: introduction (5 seconds), personalization (10 seconds), value proposition (10 seconds), CTA (5 seconds). The 15-second voicemail is a compressed version that drops the value proposition and leads with the personalization.` },
      { type: 'table', caption: 'Channel-specific formatting constraints and best practices', headers: ['Channel', 'Length Cap', 'Format', 'Required Elements'], rows: [
        ['Email', '150 words', 'Plain text', 'Physical address, unsubscribe link, single CTA'],
        ['LinkedIn (connection)', '200 chars', 'Plain text, no URLs', 'Personalization hook, no CTA'],
        ['LinkedIn (in-mail)', '300 chars', 'Plain text, URLs allowed', 'Personalization, single CTA'],
        ['Phone (live)', '30 seconds', 'Script', '4-sentence arc, single CTA'],
        ['Phone (voicemail)', '15 seconds', 'Script', 'Personalization hook, callback number'],
      ]},
      { type: 'heading', level: 2, content: 'Template Library Organization' },
      { type: 'paragraph', content: `The template library is organized along three axes: persona, industry, and funnel stage. The persona axis has four values: decision-maker (the person with budget authority), influencer (the person whose opinion the decision-maker trusts), champion (the person who actively advocates for your solution internally), and end-user (the person who will use the product). Templates are tagged with one or more personas — for example, a template might be tagged for both decision-maker and influencer if the message is appropriate for both. The industry axis has six values: SaaS, financial services, healthcare, manufacturing, retail, and education. Templates are tagged with one or more industries — most templates are tagged for SaaS by default, because SaaS is the most common LeadReach ICP.` },
      { type: 'paragraph', content: `The funnel stage axis has four values: top-of-funnel (awareness), mid-funnel (consideration), bottom-of-funnel (decision), and post-purchase (expansion). Templates are tagged with exactly one funnel stage. The Composer selects templates by matching the lead's stage in the lifecycle (newly-qualified leads get top-of-funnel templates, engaged leads get mid-funnel templates, negotiating leads get bottom-of-funnel templates) and the lead's persona and industry from the enrichment payload. If no template matches all three axes, the Composer falls back to the closest two-axis match and logs the fallback in the personalization quality gates report.` },
      { type: 'list', items: [
        `Decision-maker templates: focus on ROI, business outcomes, and executive credibility.`,
        `Influencer templates: focus on technical detail, peer references, and implementation effort.`,
        `Champion templates: focus on enablement materials, internal selling assets, and case studies.`,
        `End-user templates: focus on workflow improvement, productivity gains, and ease of use.`,
        `SaaS templates: reference SaaS metrics (ARR, NRR, CAC) and SaaS case studies.`,
        `Financial services templates: reference compliance, risk, and audit outcomes.`,
        `Healthcare templates: reference HIPAA, patient outcomes, and clinical workflow.`,
      ]},
      { type: 'heading', level: 2, content: 'Auto-Promotion from A/B Test Winners' },
      { type: 'paragraph', content: `When an A/B test produces a winning variant (see the A/B Testing Outreach section), the winning variant is auto-promoted to the template library as a new template tagged with the same persona, industry, and funnel stage as the original. The auto-promoted template is marked with an auto-promoted badge and is immediately available for selection by the Composer. The original template is not deprecated — both templates remain in the library and the Composer selects between them based on the lead's enrichment payload. Auto-promotion ensures that the template library continuously improves based on observed reply-rate performance, without requiring manual curation.` },
      { type: 'paragraph', content: `Auto-promoted templates are reviewed quarterly by the LeadReach content team. Templates that underperform their parent template by more than 2 percentage points in reply rate over a 90-day window are deprecated and removed from the auto-selection pool. Deprecated templates remain in the library for audit purposes but are not selected by the Composer unless explicitly requested via the template_id field in the campaign configuration. This quarterly review prevents template drift — the slow accumulation of auto-promoted templates that marginally outperform their parents but collectively dilute the library's overall quality.` },
      { type: 'steps', items: [
        `Open the Outreach Composer console and click the Template Library tab.`,
        `Browse the 50+ system templates by persona, industry, or funnel stage. Use the filter chips at the top of the library to narrow the list.`,
        `Click any template to preview it. The preview pane shows the template structure, variable slots, channel, word count, and historical reply-rate performance.`,
        `Click Fork Template to create a custom copy. The forked template opens in the template editor where you can modify any section.`,
        `Click Test Generate to see the template rendered with a sample lead's personalization variables.`,
        `Click Save Template to add the forked template to your workspace's custom template library. The template is immediately available for campaign selection.`,
        `Monitor the template's reply-rate performance in the Template Performance dashboard 30 days after first use. Templates that underperform the system baseline by more than 3 percentage points should be revised or deprecated.`,
      ]},
      { type: 'callout', variant: 'info', content: `Custom templates are not shared across workspaces by default. To share a custom template with another workspace in your organization, export it as JSON from the template editor and import it in the target workspace. The JSON export preserves the template structure, variables, and metadata but does not preserve historical reply-rate performance — that data is workspace-specific.` },
      { type: 'heading', level: 2, content: 'Template Performance Tracking' },
      { type: 'paragraph', content: `Every template carries a performance record that is updated daily with reply rate, meeting set rate, bounce rate, and unsubscribe rate. The performance record is broken down by channel (email, LinkedIn, phone) and by funnel stage. The Template Performance dashboard shows the top-performing templates by reply rate, the underperforming templates flagged for review, and the templates that have not been used in the last 30 days (which are candidates for deprecation). The dashboard also shows the auto-promotion pipeline — the templates that were auto-promoted from A/B test winners in the last 90 days and their performance against their parent templates.` },
      { type: 'paragraph', content: `Template performance tracking is the feedback loop that keeps the template library aligned with your ICP's response behavior. A template that performed well in Q1 may underperform in Q3 because your ICP's priorities shifted, the market moved, or a competitor launched a similar product. The quarterly review process is the platform's mechanism for catching these shifts and updating the library — the LeadReach content team reviews aggregate performance across all customer workspaces quarterly and updates the system templates based on the observed trends. Your custom templates are not auto-updated — you must review their performance quarterly and revise them based on the observed reply-rate trends.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 19. A/B TESTING OUTREACH
  // ---------------------------------------------------------------------------
  {
    slug: 'outreach-ab-testing',
    title: 'A/B Testing Outreach',
    description: 'Configure 2-3 variants per lead, declare statistical winners at n=30 and p<0.05, and auto-promote winning variants to the template library for continuous performance improvement.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `A/B testing is the Outreach Composer's continuous improvement mechanism. Every campaign can be configured with 2 to 3 variants per touchpoint — typically variants differ in subject line, opening personalization, value proposition framing, or CTA — and the Composer randomly assigns each lead to one variant. The platform tracks reply rate, meeting set rate, and bounce rate per variant, and declares a winner when one variant achieves statistical significance over the others. The significance threshold is p < 0.05 with a minimum sample size of n=30 per variant, which is the standard threshold for outreach A/B testing in B2B SaaS. Winning variants are auto-promoted to the template library and become available for selection by future campaigns.` },
      { type: 'paragraph', content: `A/B testing is the platform's mechanism for converting tacit performance knowledge into explicit library improvements. Without A/B testing, the template library would be a static asset that drifts away from your ICP's response behavior over time. With A/B testing, the library continuously adapts — every winning variant is added to the library, and underperforming variants are deprecated. The 8 to 12 percent reply rate target is achievable only with continuous A/B testing — workspaces that run A/B tests quarterly produce 1.5x the reply rate of workspaces that do not, according to the 1.4M-lead regression.` },
      { type: 'heading', level: 2, content: 'Variant Configuration' },
      { type: 'paragraph', content: `Every touchpoint in a campaign can have up to 3 variants. The Composer supports four variant dimensions: subject line (for email), opening hook (the first sentence of the message), value proposition framing (how the value is presented), and CTA (the specific request). You can mix dimensions within a single test — for example, variant A might use a question-based subject line with a quantified CTA, while variant B might use a statement-based subject line with a meeting CTA. The Composer generates variants using the same LLM call that generates the baseline message, with a temperature boost of 0.1 to encourage divergence. Variants that diverge from the baseline by less than 10 percent are rejected and regenerated.` },
      { type: 'paragraph', content: `Variant assignment is random at the lead level — every lead is assigned to one variant for the entire cadence, not per-touchpoint. This is critical for measuring the impact of a variant on the full 14-day sequence, not just on the first touchpoint. Lead-variant assignment is recorded in the campaign audit log and is immutable — once a lead is assigned to variant A, all 7 touchpoints in the cadence use variant A. If you change the variant configuration mid-cadence, the change applies to new leads only; existing leads continue on their originally-assigned variant.` },
      { type: 'code', language: 'json', caption: 'A/B test configuration with three variants on subject line and CTA dimensions', code: `{
  "test_id": "abtest_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "campaign_id": "camp_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "touchpoint": "email_1",
  "hypothesis": "Question-based subject lines with quantified CTAs outperform statement-based subject lines with meeting CTAs in our ICP",
  "variants": [
    {
      "id": "A",
      "label": "Question + Quantified CTA",
      "subject_template": "Question for you about {{company_name}}'s {{value_proposition_trigger}}",
      "cta_template": "Would you be open to a 15-minute call to walk through how {{customer_reference}} achieved {{quantified_metric}}?"
    },
    {
      "id": "B",
      "label": "Statement + Meeting CTA",
      "subject_template": "How {{company_name}} can achieve {{quantified_metric}}",
      "cta_template": "Do you have 15 minutes next Tuesday at 10am PT?"
    },
    {
      "id": "C",
      "label": "Control (baseline)",
      "subject_template": "{{first_name}}, quick question",
      "cta_template": "Open to a brief call this week?"
    }
  ],
  "traffic_allocation": { "A": 0.40, "B": 0.40, "C": 0.20 },
  "success_metric": "reply_rate",
  "minimum_sample_size": 30,
  "significance_threshold": 0.05,
  "minimum_duration_days": 14,
  "auto_promote_winner": true
}` },
      { type: 'heading', level: 2, content: 'Statistical Significance and Winner Declaration' },
      { type: 'paragraph', content: `The platform uses a two-proportion z-test to evaluate statistical significance between variants. The test compares the reply rate of each variant against every other variant and against the control. A winner is declared when one variant's reply rate exceeds every other variant's reply rate with p < 0.05 and the per-variant sample size is at least n=30. The platform surfaces the test's progress on the A/B Testing dashboard, showing the per-variant reply rate, the cumulative sample size, the confidence interval, and the projected days-to-significance based on the current traffic rate. If no variant reaches significance within 60 days, the test is marked as inconclusive and the platform recommends either extending the test, increasing traffic allocation, or abandoning the test and revising the hypothesis.` },
      { type: 'paragraph', content: `The 60-day inconclusive threshold is calibrated against the platform's typical traffic volumes. Most B2B SaaS workspaces generate 50 to 200 leads per week per campaign, which means a 3-variant test reaches n=30 per variant in 3 to 6 weeks. Tests that fail to reach significance in 60 days typically have one of three root causes: the variants are too similar (less than 20 percent divergence), the success metric is too noisy (reply rate is the most stable; meeting set rate is 4 to 5x noisier), or the ICP is too small to generate sufficient traffic. The platform surfaces all three causes in the test's diagnostics panel.` },
      { type: 'table', caption: 'Statistical thresholds and recommended actions per test outcome', headers: ['Outcome', 'Statistical Threshold', 'Sample Size', 'Recommended Action'], rows: [
        ['Winner declared', 'p<0.05', 'n>=30 per variant', 'Auto-promote winning variant to template library'],
        ['Inconclusive (low traffic)', 'p>0.05', 'n<30 per variant', 'Extend test by 30 days or increase traffic allocation'],
        ['Inconclusive (similar variants)', 'p>0.05', 'n>=30 per variant', 'Abandon test; revise hypothesis with more divergent variants'],
        ['Inconclusive (timeout)', 'p>0.05', 'n>=30 per variant', 'Abandon test after 60 days; revise success metric or hypothesis'],
      ]},
      { type: 'heading', level: 2, content: 'Auto-Promotion to Template Library' },
      { type: 'paragraph', content: `When a test declares a winner, the winning variant is auto-promoted to the template library as a new template tagged with the same persona, industry, and funnel stage as the original baseline template. The auto-promoted template is marked with an A/B winner badge and immediately becomes available for selection by future campaigns. The original baseline template is not deprecated — both remain in the library and the Composer selects between them based on the lead's enrichment payload. Auto-promotion is the mechanism that converts observed performance data into library improvements, and it ensures that the template library continuously adapts to your ICP's response behavior.` },
      { type: 'paragraph', content: `Auto-promotion can be disabled per-test if you want to review the winner manually before promoting. We recommend keeping auto-promotion enabled for low-stakes tests (subject line and CTA variants) and disabling it for high-stakes tests (value proposition framing and template structure variants). High-stakes test winners should be reviewed by a sales leader before promotion because they affect messaging strategy across all future campaigns, not just the test campaign. The review queue is surfaced on the A/B Testing dashboard under the Pending Review tab.` },
      { type: 'callout', variant: 'tip', content: `Run one A/B test per campaign at a time. Concurrent tests on the same campaign produce confounded results because each test changes the variant distribution that the other test is sampling from. If you need to test multiple dimensions, sequence them — run the subject line test first, declare a winner, then run the CTA test with the winning subject line as the baseline.` },
      { type: 'heading', level: 2, content: 'Test Design Best Practices' },
      { type: 'paragraph', content: `Effective A/B tests share four design characteristics. First, the hypothesis is specific and falsifiable — "question-based subject lines outperform statement-based subject lines by 10 percent or more" is a good hypothesis; "improve subject lines" is not. Second, the variants differ on a single dimension, not multiple dimensions — mixing subject line and CTA changes in the same test makes it impossible to attribute any observed difference to a specific variable. Third, the success metric is stable — reply rate is the most stable, meeting set rate is 4 to 5x noisier, and 90-day conversion to closed-won is too slow for iterative testing. Fourth, the test duration is calibrated against the ICP's response window — most B2B replies arrive within 7 days of the first touchpoint, so a 14-day test captures the bulk of the response signal.` },
      { type: 'steps', items: [
        `Open the Outreach Composer console and click the A/B Testing tab.`,
        `Click New Test. Select the campaign, touchpoint, and dimension (subject line, opening hook, value proposition, or CTA).`,
        `Write a specific, falsifiable hypothesis. The platform surfaces a hypothesis quality score based on specificity and falsifiability.`,
        `Configure 2 to 3 variants. The platform enforces a minimum divergence of 10 percent between variants; variants that are too similar are flagged.`,
        `Select the success metric (default: reply rate), minimum sample size (default: 30 per variant), and significance threshold (default: 0.05).`,
        `Review the projected days-to-significance based on the campaign's historical traffic volume. If the projection exceeds 60 days, either reduce the variant count or increase traffic allocation.`,
        `Click Start Test. The platform begins randomly assigning incoming leads to variants immediately.`,
        `Monitor the test dashboard weekly. Do not declare a winner before the platform reaches statistical significance — premature declaration produces false positives.`,
      ]},
      { type: 'list', items: [
        `Hypothesis: state the expected effect size, not just the direction. "Subject line variant B will outperform variant A by 10 percent or more in reply rate."`,
        `Single dimension: change one variable per test. Mixing dimensions makes attribution impossible.`,
        `Stable metric: use reply rate as the success metric. Meeting set rate and conversion rate are too noisy for iterative testing.`,
        `Calibrated duration: 14 days is the minimum test duration; 21 days captures 90 percent of reply signal in most ICPs.`,
        `Traffic allocation: allocate 20 percent to the control and split the remaining 80 percent between the variants. This protects against regression if both variants underperform.`,
        `Sequential testing: do not run concurrent tests on the same campaign. Sequence tests and use each winner as the baseline for the next test.`,
        `Document the hypothesis: future admins need to understand why a test was run and what was learned, even if the test was inconclusive.`,
      ]},
      { type: 'paragraph', content: `A/B testing is the platform's mechanism for converting intuition into evidence. Sales leaders often have strong opinions about subject lines, value propositions, and CTAs based on their personal experience — but personal experience is biased, sample-size-limited, and not generalizable. A/B testing replaces intuition with measured performance and produces a library of evidence-backed templates that improve over time. Workspaces that embrace A/B testing as a quarterly practice see compound reply-rate improvements of 30 to 50 percent over 12 months, while workspaces that rely on intuition see flat or declining reply rates as the market moves and the ICP's response behavior shifts.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 20. COMPLIANCE & CAN-SPAM
  // ---------------------------------------------------------------------------
  {
    slug: 'outreach-compliance',
    title: 'Compliance & CAN-SPAM',
    description: 'Configure CAN-SPAM compliant outreach with physical address footers, single-click unsubscribe, opt-out honoring within 10 business days, and no deceptive subject lines.',
    category: 'AI Agents',
    readTime: '7 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Compliance is non-negotiable in outbound outreach. The LeadReach platform enforces CAN-SPAM compliance by default on every email touchpoint, and the Outreach Composer cannot generate an email that violates the CAN-SPAM requirements. CAN-SPAM is the U.S. federal law that governs commercial email (15 U.S.C. section 7701) and establishes seven requirements for commercial email senders. LeadReach enforces the four most operationally consequential requirements as platform defaults: physical postal address in the email footer, single-click unsubscribe link, opt-out honoring within 10 business days, and no deceptive subject lines. The remaining three requirements (sender identification, clear identification as advertisement, and valid physical address for the sender) are also enforced through the sender configuration workflow.` },
      { type: 'paragraph', content: `Compliance is not a feature you can disable for higher deliverability or reply rate. The platform's sending infrastructure is calibrated against the major inbox providers (Gmail, Outlook, Yahoo) which use CAN-SPAM compliance as a deliverability signal — non-compliant emails are routed to the spam folder at rates above 70 percent, which destroys the 8 to 12 percent reply rate target. Compliance is therefore not just a legal requirement but a deliverability requirement, and the platform's 98 percent inbox placement rate depends on full CAN-SPAM compliance on every touchpoint.` },
      { type: 'heading', level: 2, content: 'The Four CAN-SPAM Requirements' },
      { type: 'paragraph', content: `The physical address requirement mandates that every commercial email include a valid physical postal address for the sender. LeadReach enforces this by requiring a physical address in the workspace's sender configuration before any email touchpoint can be sent. The address is automatically appended to the footer of every generated email and cannot be removed by template customization. The address must be a real street address — P.O. boxes are accepted but forwarded addresses (e.g., a virtual office) are flagged for review by the platform's compliance monitor and may be rejected if the address cannot be verified against a public business registry.` },
      { type: 'paragraph', content: `The single-click unsubscribe requirement mandates that every commercial email include a clear, conspicuous link that allows the recipient to opt out of future emails with a single click — no login, no confirmation, no "tell us why you are unsubscribing" survey. LeadReach enforces this by automatically appending an unsubscribe link to the footer of every generated email. The link uses a one-time token tied to the lead ID and the email ID; clicking the link immediately marks the lead as opted-out and triggers the lead.unsubscribed webhook event. The platform also supports the List-Unsubscribe header (RFC 8058) which allows Gmail and Outlook to surface an unsubscribe button in their UI without the recipient needing to open the email.` },
      { type: 'paragraph', content: `The opt-out honoring requirement mandates that opt-out requests be honored within 10 business days. LeadReach honors opt-outs immediately — the moment a lead clicks the unsubscribe link, they are removed from all active outreach queues and their email address is added to the workspace's suppression list. The 10-business-day requirement is the legal maximum; the platform's immediate honoring is a best practice that exceeds the legal requirement. The suppression list is shared across all campaigns in the workspace, so a lead that opts out of one campaign is opted out of all campaigns. The suppression list is also synced to your connected CRM via the integration adapter, so the CRM's "do not contact" flag stays in sync with LeadReach.` },
      { type: 'paragraph', content: `The no-deceptive-subject-lines requirement mandates that the subject line of a commercial email cannot be deceptive about the contents of the email. Subject lines that falsely imply a personal relationship (e.g., "Re: your question"), falsely imply a transaction (e.g., "Your invoice is ready"), or falsely imply a delivery failure (e.g., "Delivery notification failure") are prohibited. LeadReach enforces this through the Composer's subject line quality gate, which rejects subject lines that match a list of deceptive patterns and requires the subject line to accurately reflect the email's content. The deceptive pattern list is updated quarterly based on FTC enforcement actions and inbox provider feedback.` },
      { type: 'table', caption: 'CAN-SPAM requirements, LeadReach enforcement, and operational behavior', headers: ['Requirement', 'LeadReach Default', 'Enforcement Mechanism', 'Opt-Out Latency'], rows: [
        ['Physical postal address', 'Required in sender config', 'Auto-appended to email footer', 'N/A'],
        ['Single-click unsubscribe', 'Required in every email', 'Auto-appended footer link + List-Unsubscribe header', 'Immediate'],
        ['Opt-out honoring', 'Immediate removal from queue', 'Suppression list sync to all campaigns and CRM', '0 minutes (legal max: 10 business days)'],
        ['No deceptive subject lines', 'Subject line quality gate', 'Pattern matching + content alignment check', 'N/A'],
      ]},
      { type: 'heading', level: 2, content: 'Sender Configuration Workflow' },
      { type: 'paragraph', content: `The sender configuration workflow is the gate that ensures every workspace has a CAN-SPAM-compliant sender identity before any email is sent. The workflow is part of the workspace setup process and cannot be skipped — you cannot create a campaign that includes email touchpoints until the sender configuration is complete. The workflow collects five required fields: sender name (the from-name displayed in the recipient's inbox), sender email address (must be on a verified sending domain), sender company name, sender physical address (street, city, state, ZIP, country), and sender phone number (optional but recommended for trust signals).` },
      { type: 'code', language: 'json', caption: 'CAN-SPAM-compliant sender configuration payload', code: `{
  "sender_id": "sender_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "workspace_id": "ws_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "sender_name": "Sarah Chen",
  "sender_email": "sarah@acme.com",
  "sender_company": "Acme Corp",
  "sender_physical_address": {
    "street": "525 Market Street, Floor 12",
    "city": "San Francisco",
    "state": "CA",
    "postal_code": "94105",
    "country": "USA"
  },
  "sender_phone": "+1-415-555-0142",
  "verified_sending_domain": "acme.com",
  "unsubscribe_url_template": "https://u.leadreach.ai/unsub/{{lead_id}}/{{token}}",
  "list_unsubscribe_header_enabled": true,
  "compliance_status": "verified",
  "compliance_verified_at": "2025-01-15T14:32:11.000Z"
}` },
      { type: 'heading', level: 2, content: 'Suppression List Management' },
      { type: 'paragraph', content: `The suppression list is the workspace-level record of every email address that has opted out of outreach. The list is automatically maintained — every unsubscribe click adds the email to the list, and the list is checked before every email is sent. If a lead's email address appears in the suppression list, the email touchpoint is skipped and the lead is routed to an alternative channel (LinkedIn or phone) if those channels are enabled in the campaign. If no alternative channel is available, the lead is moved to the nurture queue and receives no further active outreach.` },
      { type: 'paragraph', content: `The suppression list is shared across all campaigns in the workspace, which means that a lead that opts out of one campaign is opted out of all campaigns. This is the platform's strict interpretation of the CAN-SPAM opt-out requirement, which prohibits sending any commercial email to an opted-out address regardless of the campaign. The suppression list can be exported as CSV from the Compliance console and can be imported into your CRM's "do not contact" list. The list is retained for 7 years on all tiers, exceeding the CAN-SPAM minimum of 30 days and the SOC 2 retention minimum of 5 years.` },
      { type: 'steps', items: [
        `Open the Compliance console from the workspace settings menu.`,
        `Review the Sender Configuration section. Confirm that the physical address, sender name, and sender email are all set and verified.`,
        `Click the Suppression List tab. The list shows every opted-out email address with the opt-out timestamp and source campaign.`,
        `Click Export to download the suppression list as CSV for CRM sync or audit purposes.`,
        `Review the Compliance Monitor panel, which surfaces any emails that were sent without complete CAN-SPAM compliance in the last 30 days. The panel should always show zero records; non-zero records indicate a platform bug and should be reported to support immediately.`,
        `Configure the List-Unsubscribe header if not already enabled. The header is recommended for all workspaces because Gmail and Outlook surface an in-UI unsubscribe button that improves user experience and reduces spam complaints.`,
        `Review the deceptive subject line pattern list quarterly. The list is updated by LeadReach based on FTC enforcement actions; you can also add custom patterns specific to your industry.`,
      ]},
      { type: 'callout', variant: 'danger', content: `Do not attempt to bypass the suppression list by re-importing an opted-out lead with a different email address. The platform's compliance monitor detects this pattern (matching on company domain and lead name) and surfaces a violation flag in the audit log. Repeated violations result in workspace suspension, because they indicate intentional non-compliance that exposes both you and LeadReach to FTC enforcement action.` },
      { type: 'heading', level: 2, content: 'International Compliance Considerations' },
      { type: 'paragraph', content: `CAN-SPAM is the U.S. federal standard, but outreach to recipients in other jurisdictions requires compliance with local laws. The platform supports configuration of GDPR-compliant consent tracking for recipients in the European Union, CASL-compliant consent tracking for recipients in Canada, and PDPA-compliant consent tracking for recipients in Singapore. The compliance configuration is set at the ICP level — when you define an ICP that targets recipients in the EU, Canada, or Singapore, the platform enforces the local consent requirements in addition to CAN-SPAM. Consent tracking adds a consent_source field to every lead that records how and when the lead consented to be contacted.` },
      { type: 'paragraph', content: `GDPR requires opt-in consent for outreach to EU recipients, which is stricter than CAN-SPAM's opt-out model. The platform's GDPR configuration requires that every EU-targeted lead have a recorded consent source (e.g., contact_form_submit, webinar_registration, content_download) before any email touchpoint is sent. Leads without a recorded consent source are routed to LinkedIn and phone channels only, not email. CASL requires either express consent or implied consent (existing business relationship) for outreach to Canadian recipients; the platform's CASL configuration enforces the same consent-source tracking as GDPR. PDPA requires consent tracking similar to GDPR for Singapore recipients.` },
      { type: 'list', items: [
        `CAN-SPAM (U.S.): opt-out model, enforced by default on every email touchpoint.`,
        `GDPR (EU): opt-in model, requires consent_source field for every EU-targeted lead.`,
        `CASL (Canada): express or implied consent, requires consent_source field for every Canada-targeted lead.`,
        `PDPA (Singapore): consent tracking similar to GDPR for Singapore-targeted leads.`,
        `CCPA (California): consumer data rights, requires data export and deletion workflow on request.`,
        `LGPD (Brazil): consent tracking similar to GDPR for Brazil-targeted leads.`,
      ]},
      { type: 'heading', level: 2, content: 'Compliance Monitoring and Audit' },
      { type: 'paragraph', content: `The Compliance console includes a monitoring panel that surfaces any compliance violations in the last 30 days. Violations are categorized by severity: critical (emails sent to suppressed addresses), high (emails sent without a physical address footer), medium (emails sent with deceptive subject line patterns), and low (emails sent without the List-Unsubscribe header). Critical and high violations should never occur — the platform's enforcement mechanisms prevent them by construction. If they do occur, they indicate a platform bug or a configuration drift that requires immediate escalation to support.` },
      { type: 'paragraph', content: `The audit log in the Compliance console records every compliance-relevant event: sender configuration changes, suppression list additions, deceptive subject line pattern list updates, GDPR/CASL/PDPA configuration changes, and compliance monitor violation flags. The audit log is exportable as CSV and is retained for 7 years. The audit log is the primary artifact you provide during an FTC inquiry, a GDPR data subject access request, or a CASL compliance audit. Treat the audit log as a controlled document — restrict edit access to workspace admins only, and review the log monthly for unexpected changes.` },
      { type: 'paragraph', content: `Compliance is not a one-time configuration — it is an ongoing operational practice. The compliance landscape evolves as new regulations are enacted, as existing regulations are interpreted by courts, and as inbox providers update their filtering algorithms. LeadReach updates the compliance defaults quarterly based on observed enforcement actions and inbox provider changes, and surfaces compliance configuration updates in the release notes. Subscribe to the release notes email and review compliance-relevant updates within 30 days of release. Workspaces that fall behind on compliance updates face elevated deliverability risk and regulatory exposure that compounds over time.` },
    ],
  },

  // ===========================================================================
  // CARD 6: ANALYTICS & REPORTING AGENT (ECHO)
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // 21. DASHBOARD OVERVIEW
  // ---------------------------------------------------------------------------
  {
    slug: 'analytics-dashboard',
    title: 'Dashboard Overview',
    description: 'Use the unified dashboard with 25+ tracked metrics, 15-second refresh rate, single server-side call to /api/dashboard/stats, and Recharts visualizations across bar, pie, line, area, and radar charts.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `The Report Generator agent — internally called Echo — produces the unified analytics dashboard that surfaces 25+ tracked metrics across your workspace. The dashboard is the primary observability surface for the LeadReach platform and is the first thing most users open in the morning. Echo runs on the glm-4.6v-flash model at temperature 0.4 with a maxTokens budget of 3000, which is the highest token budget in the platform and reflects the dashboard's need to summarize many metrics in a single response. The dashboard refreshes every 15 seconds via a single server-side call to the /api/dashboard/stats endpoint, which aggregates all 25+ metrics in a single round-trip and returns a JSON payload that the dashboard renders using Recharts visualizations.` },
      { type: 'paragraph', content: `The dashboard is organized into five panels: KPI summary, pipeline status, agent performance, channel ROI, and AI recommendations. Each panel serves a different audience — the KPI summary is for executives who need a quick health check, the pipeline status is for sales leaders tracking lead flow, the agent performance is for operations teams monitoring agent health, the channel ROI is for marketing leaders allocating budget, and the AI recommendations are for everyone who needs actionable next steps. The panels are loaded in parallel from the single /api/dashboard/stats response, so the dashboard renders in under 800 milliseconds even on slow connections. The 15-second refresh rate means the dashboard is effectively real-time — by the time you finish reading one panel, the next panel has refreshed with the latest data.` },
      { type: 'heading', level: 2, content: 'The 25+ Tracked Metrics' },
      { type: 'paragraph', content: `The dashboard tracks 25+ metrics organized into seven categories. The campaign metrics category includes total_campaigns, active_campaigns, and campaigns_by_status. The lead metrics category includes total_leads, new_leads_today, leads_by_stage (across the 9 lifecycle stages), leads_by_tier (across the 4 tiers), and avg_lead_score. The engagement metrics category includes response_rate, reply_rate, meeting_set_rate, and bounce_rate. The pipeline metrics category includes pipeline_value, pipeline_velocity (average days from discovery to close), and conversion_funnel (stage-by-stage drop-off). The agent metrics category includes agent_performance (per agent with tasks completed, success rate, token usage, and health score).` },
      { type: 'paragraph', content: `The channel metrics category includes channel_ROI (per channel with cost per lead, cost per qualified lead, and cost per meeting). The recommendation metrics category includes AI recommendations (observation, hypothesis, action, expected_impact) and anomaly detection alerts (3-sigma plus EWMA plus STL hybrid, 95 percent target rate). The full metric list is documented in the API Reference under /api/dashboard/stats; the dashboard renders the most operationally consequential 12 metrics in the KPI summary panel and surfaces the remaining metrics in the deeper panels.` },
      { type: 'table', caption: 'Dashboard metric categories with example metrics and panel assignments', headers: ['Category', 'Example Metrics', 'Panel', 'Refresh Rate'], rows: [
        ['Campaign', 'total_campaigns, active_campaigns', 'KPI summary', '15 seconds'],
        ['Lead', 'total_leads, leads_by_stage, leads_by_tier', 'Pipeline status', '15 seconds'],
        ['Engagement', 'reply_rate, meeting_set_rate, bounce_rate', 'KPI summary', '15 seconds'],
        ['Pipeline', 'pipeline_value, pipeline_velocity, conversion_funnel', 'Pipeline status', '15 seconds'],
        ['Agent', 'tasks_completed, success_rate, token_usage, health_score', 'Agent performance', '15 seconds'],
        ['Channel', 'cost_per_lead, cost_per_qualified_lead, cost_per_meeting', 'Channel ROI', '15 seconds'],
        ['Recommendation', 'observation, hypothesis, action, expected_impact', 'AI recommendations', '60 seconds'],
      ]},
      { type: 'heading', level: 2, content: 'The /api/dashboard/stats Endpoint' },
      { type: 'paragraph', content: `The dashboard's performance depends on a single optimized endpoint: /api/dashboard/stats. This endpoint aggregates all 25+ metrics in a single server-side call, returning a JSON payload that the dashboard renders without further network round-trips. The endpoint is called every 15 seconds by the dashboard's React frontend, and the response is cached server-side for 5 seconds to absorb concurrent requests from multiple dashboard sessions. The endpoint's server-side aggregation eliminates the N+1 query pattern that plagues most analytics dashboards and is the primary reason the dashboard renders in under 800 milliseconds.` },
      { type: 'code', language: 'json', caption: 'Truncated /api/dashboard/stats response payload', code: `{
  "workspace_id": "ws_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "fetched_at": "2025-01-15T14:32:11.000Z",
  "cache_hit": false,
  "kpi_summary": {
    "total_campaigns": 12,
    "active_campaigns": 8,
    "total_leads": 4827,
    "new_leads_today": 142,
    "avg_lead_score": 67.3,
    "reply_rate": 0.092,
    "meeting_set_rate": 0.038,
    "pipeline_value": 4820000
  },
  "pipeline_status": {
    "by_stage": { "new": 412, "enriched": 287, "qualified": 1934, "contacted": 871, "engaged": 412, "negotiating": 187, "closed_won": 142, "closed_lost": 287, "nurture": 295 },
    "by_tier": { "super_hot": 142, "hot": 871, "warm": 1934, "cold": 1880 },
    "average_score": 67.3,
    "total_leads": 4827
  },
  "agent_performance": [
    { "agent": "Prospect Discovery", "tasks_completed": 1842, "success_rate": 0.97, "token_usage": 1240000, "health_score": 98 },
    { "agent": "Lead Qualification", "tasks_completed": 1620, "success_rate": 0.99, "token_usage": 980000, "health_score": 99 },
    { "agent": "Outreach Composer", "tasks_completed": 871, "success_rate": 0.94, "token_usage": 1740000, "health_score": 96 }
  ],
  "channel_roi": [
    { "channel": "email", "cost_per_lead": 0.42, "cost_per_qualified_lead": 1.87, "cost_per_meeting": 28.40, "roi": 8.2 },
    { "channel": "linkedin", "cost_per_lead": 3.20, "cost_per_qualified_lead": 14.10, "cost_per_meeting": 187.00, "roi": 4.1 }
  ],
  "ai_recommendations": [
    {
      "observation": "LinkedIn produces 3x more hot leads than Google Ads at 40% lower CAC",
      "hypothesis": "Reallocating 20% of Google Ads budget to LinkedIn will increase hot lead volume by 15-20%",
      "action": "Increase LinkedIn budget by 20% and reduce Google Ads budget by 20%",
      "expected_impact": "+15-20% hot lead volume, +8% pipeline value, no change to total CAC"
    }
  ]
}` },
      { type: 'heading', level: 2, content: 'Recharts Visualization' },
      { type: 'paragraph', content: `The dashboard renders all visualizations using Recharts, a React-based charting library that supports bar, pie, line, area, and radar chart types. Each panel uses a chart type matched to the data shape: the KPI summary uses bar charts for count metrics and line charts for trend metrics, the pipeline status uses pie charts for stage distribution and stacked bar charts for tier-by-stage breakdowns, the agent performance uses radar charts for multi-dimensional health scores, the channel ROI uses stacked bar charts for cost breakdowns, and the AI recommendations use plain text cards with the four-field schema. The Recharts library is loaded once at dashboard initialization and shared across all panels, which keeps the dashboard bundle size under 200KB and avoids the chart-rendering latency that plagues heavier libraries like D3.js.` },
      { type: 'paragraph', content: `Chart colors are mapped to a fixed palette that ensures accessibility for color-blind users. The palette uses six colors that are distinguishable under all common color vision deficiencies (deuteranopia, protanopia, tritanopia). Chart legends are positioned above the chart, not to the right, to maximize the chart canvas size on narrow viewports. The dashboard is fully responsive — panels reflow from a 3-column grid on desktop to a 1-column stack on mobile, and chart sizes scale proportionally. The dashboard also supports dark mode, which inverts the chart colors while preserving the contrast ratios required for accessibility.` },
      { type: 'callout', variant: 'tip', content: `Pin the dashboard as your browser's homepage for the workspace. The 15-second refresh rate means the dashboard is always current, and pinning it eliminates the friction of navigating to the dashboard every morning. Use the URL parameter ?panel=kpi to deep-link directly to the KPI summary panel for a quick health check.` },
      { type: 'heading', level: 2, content: 'Dashboard Panels In Depth' },
      { type: 'paragraph', content: `The KPI summary panel is the top panel and is always visible without scrolling. It shows eight KPI tiles in a 4x2 grid: total campaigns, active campaigns, total leads, new leads today, avg lead score, reply rate, meeting set rate, and pipeline value. Each tile shows the current value, the 7-day trend (green up arrow, red down arrow, or gray flat line), and the delta against the 7-day trailing average. Clicking a tile navigates to the deeper panel that contains the metric's breakdown — for example, clicking the total leads tile navigates to the pipeline status panel.` },
      { type: 'paragraph', content: `The pipeline status panel shows the lead lifecycle as a 9-stage funnel with count and conversion rate per stage. The funnel is rendered as a horizontal bar chart with stage labels and counts. Below the funnel, the panel shows the tier distribution as a pie chart (cold, warm, hot, super_hot). The agent performance panel shows a radar chart per agent with five axes: tasks completed, success rate, token usage efficiency, average latency, and health score. The radar chart normalizes all axes to a 0 to 100 scale so agents are directly comparable. The channel ROI panel shows a stacked bar chart per channel with three cost dimensions: cost per lead, cost per qualified lead, and cost per meeting. The AI recommendations panel shows recommendation cards with the four-field schema.` },
      { type: 'list', items: [
        `KPI summary: 8 KPI tiles in 4x2 grid with 7-day trend arrows.`,
        `Pipeline status: 9-stage funnel chart plus 4-tier pie chart.`,
        `Agent performance: radar chart per agent with 5 normalized axes.`,
        `Channel ROI: stacked bar chart per channel with 3 cost dimensions.`,
        `AI recommendations: card layout with observation, hypothesis, action, expected_impact.`,
        `Anomaly detection: alert banner with 3-sigma plus EWMA plus STL hybrid detection.`,
      ]},
      { type: 'heading', level: 2, content: 'Dashboard Performance and Caching' },
      { type: 'paragraph', content: `The dashboard is engineered for performance. The 15-second refresh rate is calibrated against two constraints: the median time a user spends on a single panel (45 seconds) and the cost of the server-side aggregation (200 to 400 milliseconds per call). A faster refresh rate would not improve perceived freshness because users cannot read the panels faster than every 15 seconds, and a slower rate would produce stale data during high-velocity periods. The 15-second rate is the optimal trade-off between freshness and infrastructure cost, and the platform's health monitor alerts if the median dashboard latency exceeds 1 second.` },
      { type: 'paragraph', content: `Server-side caching absorbs concurrent requests. The /api/dashboard/stats endpoint caches the aggregated response for 5 seconds, so concurrent dashboard sessions all receive the same cached response rather than triggering separate aggregation runs. The cache is invalidated by write events (new lead discovered, lead stage change, campaign status change) so the cache is always fresh within 5 seconds of any data change. The cache hit rate is typically above 90 percent during business hours, which keeps the aggregation cost amortized across all concurrent sessions.` },
      { type: 'steps', items: [
        `Open the dashboard by clicking the Dashboard icon in the workspace navigation.`,
        `Review the KPI summary panel for any tiles with red trend arrows. Red arrows indicate a 7-day decline that requires investigation.`,
        `Scroll to the pipeline status panel. Check the funnel for any stage with a conversion rate below the workspace's historical baseline.`,
        `Review the agent performance panel. Any agent with a health score below 90 requires investigation — check the agent's task success rate and token usage.`,
        `Review the channel ROI panel. Identify any channel with a cost per meeting above the workspace's historical baseline.`,
        `Read the AI recommendations panel. Each recommendation has an expected_impact field — prioritize recommendations with quantified impact above 10 percent.`,
        `Set up webhook notifications (Slack, email, custom HTTP) to receive anomaly alerts without monitoring the dashboard continuously.`,
      ]},
      { type: 'paragraph', content: `The dashboard is your primary observability surface, but it is not the only one. The Compliance console surfaces compliance metrics, the Lead Qualification console surfaces scoring metrics, and the Outreach Composer console surfaces personalization metrics. Use the unified dashboard for daily health checks and the specialized consoles for deep investigation when the unified dashboard surfaces an anomaly. Treat the dashboard as the starting point, not the ending point — every metric on the dashboard is clickable and navigates to a deeper view where you can investigate root cause.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 22. CAMPAIGN PERFORMANCE METRICS
  // ---------------------------------------------------------------------------
  {
    slug: 'analytics-campaign',
    title: 'Campaign Performance Metrics',
    description: 'Track per-campaign performance with the Pipeline Status Batch API (byStage, byTier, averageScore, totalLeads), monitor reply rate and meeting set rate against 8-12% and 3-5% targets, and diagnose underperforming campaigns.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Campaign performance metrics are the operational signal that tells you whether your outreach is working. The Report Generator agent surfaces per-campaign metrics through the Pipeline Status Batch API, which returns byStage (lead count per lifecycle stage), byTier (lead count per tier), averageScore (mean composite score), and totalLeads in a single call. The dashboard's campaign performance panel renders these metrics alongside reply rate, meeting set rate, bounce rate, and pipeline value to give you a complete picture of how each campaign is performing against the platform's targets: 8 to 12 percent reply rate, 3 to 5 percent meeting set rate, and under 2 percent bounce rate. The Report Generator runs on the glm-4.6v-flash model at temperature 0.4, which balances the determinism needed for accurate metric reporting with the analytical flexibility needed for root-cause diagnosis.` },
      { type: 'paragraph', content: `Per-campaign metrics are essential because aggregate workspace metrics hide campaign-level variation. A workspace with a 9 percent reply rate (within the 8 to 12 percent target) may have one campaign at 14 percent and three campaigns at 5 percent — the aggregate hides both the high performer and the underperformers. The campaign performance panel surfaces every campaign's metrics side-by-side so you can identify high performers to scale and underperformers to debug. The panel also surfaces the A/B test results for each campaign, so you can see whether the winning variant is driving the performance or whether the baseline is.` },
      { type: 'heading', level: 2, content: 'The Pipeline Status Batch API' },
      { type: 'paragraph', content: `The Pipeline Status Batch API is the primary endpoint for per-campaign metrics. It accepts a campaign ID and returns a JSON payload with four fields: byStage (an object with the 9 lifecycle stages as keys and lead counts as values), byTier (an object with the 4 tiers as keys and lead counts as values), averageScore (a single float representing the mean composite score across all leads in the campaign), and totalLeads (an integer count of all leads ever associated with the campaign). The endpoint batches all four metrics in a single round-trip, eliminating the N+1 query pattern that plagues traditional per-campaign dashboards. The endpoint is called every 15 seconds by the campaign performance panel and is cached server-side for 5 seconds to absorb concurrent requests.` },
      { type: 'code', language: 'json', caption: 'Pipeline Status Batch API response for a single campaign', code: `{
  "campaign_id": "camp_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "fetched_at": "2025-01-15T14:32:11.000Z",
  "byStage": {
    "new": 412,
    "enriched": 287,
    "qualified": 1934,
    "contacted": 871,
    "engaged": 412,
    "negotiating": 187,
    "closed_won": 142,
    "closed_lost": 287,
    "nurture": 295
  },
  "byTier": {
    "super_hot": 142,
    "hot": 871,
    "warm": 1934,
    "cold": 1880
  },
  "averageScore": 67.3,
  "totalLeads": 4827,
  "performance_targets": {
    "reply_rate": { "actual": 0.092, "target_min": 0.08, "target_max": 0.12, "status": "on_target" },
    "meeting_set_rate": { "actual": 0.038, "target_min": 0.03, "target_max": 0.05, "status": "on_target" },
    "bounce_rate": { "actual": 0.014, "target_max": 0.02, "status": "on_target" }
  }
}` },
      { type: 'heading', level: 2, content: 'Performance Targets and Status' },
      { type: 'paragraph', content: `Every campaign is benchmarked against three performance targets. The reply rate target is 8 to 12 percent, which is the industry-standard range for B2B outbound email with deep personalization. Reply rates below 8 percent indicate either a personalization issue (the Composer is not generating deep enough personalization) or a targeting issue (the ICP is too broad and includes unqualified leads). Reply rates above 12 percent are not necessarily good — they can indicate that the ICP is too narrow and you are leaving volume on the table, or that the campaign is over-personalized at the cost of reach.` },
      { type: 'paragraph', content: `The meeting set rate target is 3 to 5 percent, which represents the conversion from reply to meeting. Meeting set rates below 3 percent indicate either a CTA issue (the CTA is not asking for a meeting clearly enough) or a value proposition issue (the value proposition is not compelling enough to justify a meeting). Meeting set rates above 5 percent are typically not sustainable — they often indicate that the campaign is targeting a very narrow ICP where every reply is a strong fit, but the volume is too low to support the sales team's capacity. The bounce rate target is under 2 percent, which is the threshold below which inbox providers consider your sending domain reputable. Bounce rates above 2 percent indicate either a data quality issue (the Data Enrichment agent is returning invalid email addresses) or a sending domain reputation issue (your domain is on a soft blocklist).` },
      { type: 'table', caption: 'Performance targets, status categories, and diagnostic actions', headers: ['Metric', 'Target Range', 'Status Logic', 'Diagnostic Action'], rows: [
        ['Reply rate', '8-12%', 'on_target if in range, below if <8%, above if >12%', 'Below: check personalization depth; Above: check ICP width'],
        ['Meeting set rate', '3-5%', 'on_target if in range, below if <3%, above if >5%', 'Below: check CTA clarity; Above: check ICP volume'],
        ['Bounce rate', '<2%', 'on_target if <2%, above if >=2%', 'Above: check email data quality and sending domain reputation'],
        ['Pipeline value', 'varies', 'on_target if above workspace baseline', 'Below: check ICP deal size and close rate'],
        ['SLA breach rate', '<2%', 'on_target if <2%, above if >=2%', 'Above: check A-list queue saturation and sending capacity'],
      ]},
      { type: 'heading', level: 2, content: 'Diagnosing Underperforming Campaigns' },
      { type: 'paragraph', content: `When a campaign's metrics fall below target, the Report Generator surfaces a diagnostic panel that walks through the most likely root causes. The diagnostic panel is structured as a decision tree with five branches: ICP fit (are the leads actually in your ICP?), personalization depth (is the Composer generating deep personalization?), template effectiveness (is the template resonating with the ICP?), sending reputation (is your sending domain on a blocklist?), and cadence timing (are the touchpoints being sent at the right time of day?). Each branch surfaces the specific metric that indicates whether the branch is the root cause, along with a recommended next action.` },
      { type: 'paragraph', content: `The ICP fit branch checks the average composite score of leads in the campaign. If the average is below 60, the ICP is too broad and includes unqualified leads — tighten the ICP filters in the ICP Builder. The personalization depth branch checks the personalization quality gates report. If more than 5 percent of generated messages were flagged for human review, the Composer is not generating deep enough personalization — review the personalization sources and the prohibited phrase list. The template effectiveness branch checks the template performance dashboard. If the active template's reply rate is more than 2 percentage points below the system baseline, switch to a higher-performing template. The sending reputation branch checks the bounce rate and the sending domain's reputation score — if the reputation score is below 80, contact support to diagnose the blocklist status. The cadence timing branch checks the open rate by hour-of-day — if opens are concentrated outside business hours, adjust the cadence scheduler's send window.` },
      { type: 'steps', items: [
        `Open the Report Generator console and click the Campaign Performance tab.`,
        `Select the underperforming campaign from the campaign selector. The panel renders the campaign's byStage, byTier, averageScore, and totalLeads.`,
        `Check the performance_targets section. Identify which metrics are below target.`,
        `Open the Diagnostic Panel. The panel walks through the five root-cause branches with specific metrics and recommended actions.`,
        `For each branch, click the Investigate link to open the relevant console (ICP Builder, Outreach Composer, Template Library, Compliance, Cadence Scheduler).`,
        `Implement the recommended action and monitor the campaign's metrics for 7 days. The Report Generator surfaces the 7-day before-and-after comparison in the campaign's audit history.`,
        `If the metrics do not improve after 7 days, escalate to support. The campaign's audit history includes all diagnostic steps taken and their outcomes, which accelerates support investigation.`,
      ]},
      { type: 'callout', variant: 'warning', content: `Do not pause a campaign mid-cadence to debug it. Pausing mid-cadence breaks the 7-touch, 14-day sequence for every lead currently in the cadence, which produces misleading metrics — leads that were on day 5 will not receive their day 7 touchpoint, and their reply rate will look artificially low. Instead, finish the current cadence for active leads and apply the diagnostic changes to new leads entering the campaign.` },
      { type: 'heading', level: 2, content: 'Campaign Comparison View' },
      { type: 'paragraph', content: `The campaign performance panel includes a comparison view that allows you to select up to 5 campaigns and compare them side-by-side. The comparison view renders a table with one row per campaign and columns for every metric: total leads, byStage counts, byTier counts, averageScore, reply rate, meeting set rate, bounce rate, pipeline value, and SLA breach rate. The table can be sorted by any column to identify top and bottom performers along any dimension. The comparison view is the primary tool for portfolio review — quarterly campaign portfolio reviews typically surface 1 to 2 high performers to scale and 2 to 3 underperformers to debug or sunset.` },
      { type: 'paragraph', content: `The comparison view also surfaces A/B test status per campaign. Campaigns with active A/B tests show a test icon next to the campaign name; clicking the icon navigates to the A/B test dashboard with the test's progress and variant performance. This is useful for portfolio reviews because it surfaces which campaigns are actively improving their performance through testing versus which are running static templates. Workspaces that run A/B tests on at least 50 percent of active campaigns see 30 to 50 percent higher aggregate reply rates than workspaces that run static templates, according to the 1.4M-lead regression.` },
      { type: 'list', items: [
        `Comparison view: select up to 5 campaigns and compare all metrics side-by-side.`,
        `Sortable columns: identify top and bottom performers along any metric dimension.`,
        `A/B test status: active tests surface as icons next to campaign names.`,
        `Portfolio review: use quarterly to identify scale candidates and sunset candidates.`,
        `Trend view: switch from snapshot to 30-day trend to identify campaigns that are improving or declining.`,
        `Export: download the comparison table as CSV for offline portfolio review.`,
      ]},
      { type: 'paragraph', content: `Campaign performance metrics are the feedback loop that keeps your outreach aligned with your ICP's response behavior. The 8 to 12 percent reply rate target and 3 to 5 percent meeting set rate target are calibrated against the 1.4M-lead regression and represent the operational breakeven for outbound ROI. Campaigns that consistently fall below target are not just underperforming — they are producing negative ROI on outreach cost, sales rep time, and infrastructure cost. Treat campaign performance as a portfolio: scale the high performers, debug the mid performers, and sunset the consistent underperformers. Quarterly portfolio review is the cadence that keeps the portfolio healthy.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 23. CHANNEL ATTRIBUTION
  // ---------------------------------------------------------------------------
  {
    slug: 'analytics-attribution',
    title: 'Channel Attribution',
    description: 'Measure channel-level ROI with cost per lead, cost per qualified lead, and cost per meeting, identify channels that over-produce hot leads at lower CAC, and reallocate budget based on AI-driven recommendations.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Channel attribution is the measurement framework that tells you which prospecting channels are producing the most value at the lowest cost. The Report Generator agent tracks channel-level ROI with three primary metrics: cost per lead (CPL), cost per qualified lead (CPQL), and cost per meeting (CPM). These three metrics capture the full economic picture of each channel — CPL measures raw discovery efficiency, CPQL measures the channel's ability to produce leads that cross the qualification threshold (composite score at or above 50), and CPM measures the channel's ability to produce leads that book meetings. The Report Generator surfaces these metrics in the channel ROI panel and produces AI-driven recommendations for budget reallocation, such as "Increase LinkedIn budget by 20% — it produces 3x more hot leads than Google Ads at 40% lower CAC."` },
      { type: 'paragraph', content: `LeadReach tracks attribution across 17+ prospecting channels including email, LinkedIn (connection request, in-mail, message), phone (direct dial, HQ), Google Ads, Meta Ads, X Ads, Bing Ads, organic search, direct traffic, referral, content syndication, webinar, podcast, event sponsorship, and analyst referral. Each lead is attributed to the first channel that surfaced them (first-touch attribution) and the channel that drove the meeting (last-touch attribution). The Report Generator surfaces both attribution models in the channel ROI panel — first-touch is the default because it credits the channel that initiated the relationship, but last-touch is useful for understanding which channels are best at closing.` },
      { type: 'heading', level: 2, content: 'Cost Per Lead, Cost Per Qualified Lead, Cost Per Meeting' },
      { type: 'paragraph', content: `CPL is the simplest channel metric: total channel spend divided by total leads discovered. Email has the lowest CPL because the marginal cost of an email send is essentially zero — the only cost is the email infrastructure overhead and the per-lead cost of the enrichment that produced the email address. LinkedIn has a higher CPL because each connection request and in-mail costs a LinkedIn credit, and the platform's LinkedIn integration adapter bills per credit consumed. Phone has a higher CPL still because each call costs telephony minutes, and the dialer platform (Aircall, RingCentral, or similar) bills per minute.` },
      { type: 'paragraph', content: `CPQL is a more meaningful metric because it captures the channel's ability to produce leads that actually cross the qualification threshold. A channel with a low CPL but a high CPQL is producing many unqualified leads — the discovery is cheap, but the leads do not convert to qualified status. This pattern is common in Google Ads, where broad match keywords can produce many leads at low CPL but most are sub-scale or off-ICP. CPQL is the metric to use when comparing channels for budget allocation, because it captures the channel's true economic efficiency.` },
      { type: 'paragraph', content: `CPM is the most operationally consequential metric because it captures the channel's ability to produce leads that book meetings. CPM is the metric your sales leader cares about — every meeting booked is a sales rep's calendar slot, and the channel that produces meetings at the lowest CPM is the channel that should receive more budget. CPM is also the metric that most directly correlates with pipeline value, because meetings are the precursor to deals. The Report Generator's AI recommendations are weighted toward CPM analysis — when a recommendation suggests budget reallocation, it is based on the CPM differential between channels.` },
      { type: 'table', caption: 'Channel ROI metrics with example values across four channels', headers: ['Channel', 'CPL', 'CPQL', 'CPM', 'ROI Multiple'], rows: [
        ['Email', '$0.42', '$1.87', '$28.40', '8.2x'],
        ['LinkedIn', '$3.20', '$14.10', '$187.00', '4.1x'],
        ['Google Ads', '$8.40', '$42.30', '$412.00', '1.9x'],
        ['Referral', '$1.10', '$3.20', '$48.00', '12.4x'],
      ]},
      { type: 'heading', level: 2, content: 'AI-Driven Budget Reallocation Recommendations' },
      { type: 'paragraph', content: `The Report Generator produces AI-driven budget reallocation recommendations using a four-field schema: observation, hypothesis, action, expected_impact. The observation is a fact about channel performance drawn from the metrics — for example, "LinkedIn produces 3x more hot leads than Google Ads at 40% lower CAC." The hypothesis is the model's interpretation of why the observation matters — for example, "Reallocating 20% of Google Ads budget to LinkedIn will increase hot lead volume by 15-20%." The action is the specific recommended change — for example, "Increase LinkedIn budget by 20% and reduce Google Ads budget by 20%." The expected_impact is the quantified projection of the change's effect — for example, "+15-20% hot lead volume, +8% pipeline value, no change to total CAC."` },
      { type: 'code', language: 'json', caption: 'Example AI budget reallocation recommendation with four-field schema', code: `{
  "recommendation_id": "rec_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "workspace_id": "ws_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "generated_at": "2025-01-15T14:32:11.000Z",
  "observation": "LinkedIn produces 3x more hot leads than Google Ads at 40% lower CAC (LinkedIn CAC: $14.10 vs Google Ads CAC: $42.30)",
  "hypothesis": "Reallocating 20% of Google Ads budget to LinkedIn will increase hot lead volume by 15-20% without increasing total CAC",
  "action": "Increase LinkedIn monthly budget from $5,000 to $6,000 (+20%) and reduce Google Ads monthly budget from $5,000 to $4,000 (-20%)",
  "expected_impact": {
    "hot_lead_volume_change_pct": "+15-20%",
    "pipeline_value_change_pct": "+8%",
    "total_cac_change_pct": "0% (neutral)",
    "meeting_volume_change_pct": "+12%",
    "confidence": "high",
    "evidence_period_days": 90
  },
  "model": "glm-4.6v-flash",
  "temperature": 0.4,
  "confidence_score": 0.87
}` },
      { type: 'heading', level: 2, content: 'First-Touch vs Last-Touch Attribution' },
      { type: 'paragraph', content: `The Report Generator supports two attribution models. First-touch attribution credits the entire pipeline value of a lead to the channel that first surfaced them. This model rewards discovery channels (Google Ads, organic search, content syndication) and is the default in the channel ROI panel. Last-touch attribution credits the entire pipeline value to the channel that drove the meeting. This model rewards closing channels (email, LinkedIn, phone) and is useful for understanding which channels are best at converting leads to meetings.` },
      { type: 'paragraph', content: `Neither model is universally correct — the truth is somewhere in between, and the platform supports multi-touch attribution (weighted attribution across all channels that touched the lead) on Enterprise tiers. Multi-touch attribution uses a position-based weighting model that credits 40 percent to first-touch, 40 percent to last-touch, and 20 percent distributed across middle touches. The position-based model is more accurate than either first-touch or last-touch but is also more complex to interpret — the channel ROI panel surfaces multi-touch attribution as an alternative view, not a replacement for first-touch.` },
      { type: 'callout', variant: 'info', content: `Use first-touch attribution for budget allocation decisions and last-touch attribution for sales coaching decisions. First-touch tells you where to spend marketing budget; last-touch tells you which channels your sales reps should lean on for closing. Multi-touch is useful for executive reporting but is too complex for operational decision-making.` },
      { type: 'heading', level: 2, content: 'Anomaly Detection on Channel Metrics' },
      { type: 'paragraph', content: `The Report Generator runs anomaly detection on every channel metric using a hybrid algorithm that combines 3-sigma, EWMA (Exponentially Weighted Moving Average), and STL (Seasonal-Trend decomposition using Loess). The 3-sigma component catches sudden spikes and drops — for example, a 50 percent spike in Google Ads CPL overnight. The EWMA component catches gradual drift — for example, a slow 10 percent per week decline in LinkedIn reply rate over 4 weeks. The STL component catches seasonal anomalies — for example, a December dip in meeting set rate that is normal for the holiday season but would be flagged as an anomaly by 3-sigma alone. The hybrid algorithm targets a 95 percent true-positive rate (95 percent of flagged anomalies are real) and a 5 percent false-positive rate (5 percent of flagged anomalies are noise).` },
      { type: 'paragraph', content: `When an anomaly is detected, the Report Generator fires a webhook event (channel.anomaly_detected) carrying the channel ID, the metric that triggered the anomaly, the anomaly type (spike, drop, drift, seasonal), the severity (low, medium, high, critical), and a recommended action. Anomalies are also surfaced in the channel ROI panel as alert banners above the affected channel's row. Critical anomalies (severe spikes or drops) trigger an immediate Slack notification if the workspace has Slack integration enabled, and an email notification to the workspace admin. The 95 percent true-positive target means that the platform surfaces a false anomaly roughly once per week per workspace, which is acceptable noise for the value of catching real anomalies within hours rather than days.` },
      { type: 'steps', items: [
        `Open the Report Generator console and click the Channel ROI tab.`,
        `Review the channel table sorted by CPM (cost per meeting). Channels with the lowest CPM are your highest-efficiency channels.`,
        `Click any channel to drill into the channel detail view, which shows CPL, CPQL, CPM trends over 30 days.`,
        `Review the AI recommendations panel for any budget reallocation suggestions. Each recommendation shows the four-field schema with quantified expected_impact.`,
        `For each recommendation, click Simulate to run a 30-day projection of the proposed change without applying it. The simulation shows the projected change in hot lead volume, pipeline value, and total CAC.`,
        `Click Apply to implement the recommendation. The platform applies the budget change immediately and tracks the actual impact against the projection for the next 30 days.`,
        `Review the actual-vs-projected report 30 days after applying. If the actual impact is within 10 percent of the projection, the recommendation was accurate; if not, the model's confidence score for similar recommendations is automatically adjusted downward.`,
      ]},
      { type: 'heading', level: 2, content: 'Channel ROI Best Practices' },
      { type: 'list', items: [
        `Use CPM (not CPL) as the primary metric for budget allocation. CPM captures the channel's true economic efficiency.`,
        `Compare channels only within the same ICP. A LinkedIn CPL of $3.20 is high for a SMB ICP but low for an enterprise ICP.`,
        `Wait 30 days before judging a channel's performance. Most channels need 30 days of data to produce statistically meaningful metrics.`,
        `Treat referral as a special channel. Referral leads have 2-3x the conversion rate of any other channel and should be nurtured aggressively.`,
        `Monitor the Google Ads CPL weekly. Google Ads CPL drifts faster than any other channel because of auction dynamics; weekly review catches drift before it produces budget waste.`,
        `Do not sunset a channel based on a single month of underperformance. Most channels have natural monthly variance of 15 to 25 percent; require 60 days of consistent underperformance before sunsetting.`,
        `Invest in the channels that produce hot leads (score 70 and above), not just total leads. A channel that produces 100 cold leads at $1 CPL is worse than a channel that produces 20 hot leads at $5 CPL.`,
      ]},
      { type: 'paragraph', content: `Channel attribution is the measurement framework that converts outreach activity into business outcomes. Without attribution, you are flying blind — you do not know which channels are producing value and which are wasting budget. With attribution, you can reallocate budget quarterly to the highest-efficiency channels and continuously improve the workspace's aggregate ROI. The 1.4M-lead regression shows that workspaces that reallocate budget quarterly based on attribution data see 25 to 40 percent higher aggregate ROI than workspaces that maintain static channel budgets, which is one of the largest leveraged improvements available in the platform.` },
    ],
  },

  // ---------------------------------------------------------------------------
  // 24. CUSTOM REPORTS & EXPORT
  // ---------------------------------------------------------------------------
  {
    slug: 'analytics-reports',
    title: 'Custom Reports & Export',
    description: 'Schedule daily, weekly, and monthly report cadences with the Report Generator agent, configure webhook notifications to Slack and email, and export reports as CSV, JSON, and PDF for offline analysis and stakeholder distribution.',
    category: 'AI Agents',
    readTime: '8 min read',
    lastUpdated: '2025-01-15',
    blocks: [
      { type: 'heading', level: 2, content: 'Overview' },
      { type: 'paragraph', content: `Custom reports are the mechanism for distributing LeadReach insights to stakeholders who do not log in to the platform daily. The Report Generator agent produces three pre-configured report cadences: Daily (quick summary with total leads, new today, hot leads, and agent status), Weekly (detailed performance with campaign ROI, channel analysis, agent productivity, and funnel conversion), and Monthly (strategic review with trend analysis, recommendations, ICP optimization suggestions, and budget reallocation advice). Each cadence is delivered via webhook to Slack or email at a configurable time, and reports are also exportable as CSV, JSON, and PDF for offline analysis and stakeholder distribution. The Report Generator runs on the glm-4.6v-flash model at temperature 0.4 with a maxTokens budget of 3000, which is the highest token budget in the platform and reflects the reports' need to summarize many metrics in narrative form.` },
      { type: 'paragraph', content: `Custom reports serve three audiences. The Daily report is for the sales operations team and the sales leader who need a quick morning health check — the report is designed to be read in 30 seconds and answers the question "is anything on fire today?" The Weekly report is for the marketing leader and the operations team who need to track campaign and channel performance at a portfolio level — the report is designed to be read in 5 minutes and answers "how did this week compare to last week?" The Monthly report is for the executive team and the revenue leader who need strategic review and recommendations — the report is designed to be read in 15 minutes and answers "what should we change about our strategy next month?"` },
      { type: 'heading', level: 2, content: 'The Three Report Cadences' },
      { type: 'paragraph', content: `The Daily report is a concise summary delivered at a configurable time (default 8:00 AM workspace timezone). The report contains four sections: total leads (current count and 24-hour delta), new leads today (count and tier distribution), hot leads (count of super_hot and hot leads in the active queue with SLA status), and agent status (per agent with task completion count, success rate, and health score). The report is approximately 200 words and is designed to fit on a single Slack message or a single email screen without scrolling. The Daily report is the most-subscribed report type — most workspaces distribute it to the sales operations Slack channel and to the sales leader's email.` },
      { type: 'paragraph', content: `The Weekly report is delivered on Monday morning (default 9:00 AM workspace timezone) and covers the previous Monday-Sunday period. The report contains five sections: campaign ROI (per campaign with reply rate, meeting set rate, and pipeline value), channel analysis (per channel with CPL, CPQL, CPM, and ROI multiple), agent productivity (per agent with tasks completed, success rate, token usage, and health score), funnel conversion (9-stage funnel with per-stage conversion rate and 7-day trend), and AI recommendations (top 3 recommendations with the four-field schema). The report is approximately 1500 words and is designed to be read in 5 minutes. The Weekly report is the primary input to weekly marketing operations review meetings.` },
      { type: 'paragraph', content: `The Monthly report is delivered on the first business day of each month and covers the previous calendar month. The report contains six sections: trend analysis (30-day and 90-day trends on key metrics with seasonal adjustment), recommendations (top 5 strategic recommendations with quantified expected_impact), ICP optimization suggestions (suggested ICP filter adjustments based on observed conversion rates by ICP segment), budget reallocation advice (suggested channel budget changes with CPM-based justification), agent performance review (per agent with monthly trends and capacity utilization), and executive summary (one-page narrative for board or executive team distribution). The report is approximately 3000 words and is designed to be read in 15 minutes. The Monthly report is the primary input to monthly business reviews and quarterly planning.` },
      { type: 'table', caption: 'Report cadences, delivery times, content sections, and audience', headers: ['Cadence', 'Delivery Time', 'Sections', 'Audience'], rows: [
        ['Daily', '8:00 AM workspace TZ', 'Total leads, new today, hot leads, agent status', 'Sales operations, sales leader'],
        ['Weekly', 'Mon 9:00 AM workspace TZ', 'Campaign ROI, channel analysis, agent productivity, funnel conversion, AI recommendations', 'Marketing leader, operations team'],
        ['Monthly', '1st business day, 9:00 AM TZ', 'Trend analysis, recommendations, ICP optimization, budget advice, agent review, exec summary', 'Executive team, revenue leader'],
      ]},
      { type: 'heading', level: 2, content: 'Webhook Notifications and Delivery' },
      { type: 'paragraph', content: `Reports are delivered via webhook to three notification channels: Slack (incoming webhook URL), email (SMTP relay), and custom HTTP endpoint (any URL with HMAC-SHA256 signing). Slack delivery posts the report as a formatted message to the configured channel — Daily reports post as a single message, Weekly reports post as a thread with one message per section, and Monthly reports post as a thread with one message per section plus a PDF attachment. Email delivery sends the report as a multipart message with HTML body and CSV/JSON/PDF attachments. Custom HTTP delivery POSTs the report as JSON to the configured endpoint with an X-LeadReach-Signature header containing the HMAC-SHA256 signature of the JSON body using the workspace's webhook secret.` },
      { type: 'paragraph', content: `Webhook delivery uses exponential backoff retry for up to 24 hours. Failed deliveries (4xx or 5xx responses) are retried at 1 minute, 5 minutes, 30 minutes, 2 hours, 8 hours, and 24 hours after the original delivery attempt. If all retries fail, the report is marked as undelivered in the audit log and the workspace admin receives an in-app notification. The 24-hour retry window is generous because reports are time-sensitive but not real-time-critical — a delayed daily report is annoying but not operationally damaging, while a delayed anomaly alert is operationally damaging (which is why anomaly alerts use a separate, faster retry policy).` },
      { type: 'code', language: 'json', caption: 'Webhook delivery configuration for Slack, email, and custom HTTP', code: `{
  "workspace_id": "ws_01HQ8XK7P3M2N4R6T8V0W1Y2Z3",
  "delivery_channels": [
    {
      "type": "slack",
      "label": "Sales Ops Channel",
      "webhook_url": "https://hooks.slack.com/services/T01ABC/B01XYZ/abc123",
      "channel": "#sales-ops",
      "thread_per_section": true,
      "cadences": ["daily", "weekly"]
    },
    {
      "type": "email",
      "label": "Executive Distribution",
      "recipients": ["ceo@acme.com", "cro@acme.com", "cmo@acme.com"],
      "subject_template": "LeadReach Monthly Report - {{month_year}}",
      "attach_pdf": true,
      "attach_csv": true,
      "cadences": ["monthly"]
    },
    {
      "type": "custom_http",
      "label": "Internal Data Warehouse",
      "endpoint_url": "https://data.acme.com/leadreach/reports",
      "method": "POST",
      "signing_algorithm": "HMAC-SHA256",
      "signing_header": "X-LeadReach-Signature",
      "expected_response_code": 200,
      "retry_policy": "exponential_backoff_24h",
      "cadences": ["daily", "weekly", "monthly"]
    }
  ],
  "delivery_timezone": "America/Los_Angeles",
  "daily_delivery_time": "08:00",
  "weekly_delivery_day": "monday",
  "weekly_delivery_time": "09:00",
  "monthly_delivery_day": "first_business_day",
  "monthly_delivery_time": "09:00"
}` },
      { type: 'heading', level: 2, content: 'Report Export Formats' },
      { type: 'paragraph', content: `Reports are exportable in three formats: CSV, JSON, and PDF. CSV export is designed for spreadsheet analysis — every metric is a column, every report is a row, and the CSV is structured to support pivot tables and charting in Excel or Google Sheets. CSV is the right format for analysts who want to combine LeadReach data with data from other sources (CRM, marketing automation, finance system). JSON export is designed for programmatic consumption — the JSON structure mirrors the /api/dashboard/stats response with additional narrative sections (executive summary, AI recommendations) that are not in the stats endpoint. JSON is the right format for engineering teams building custom dashboards or data pipelines on top of LeadReach data.` },
      { type: 'paragraph', content: `PDF export is designed for stakeholder distribution — the PDF is a print-ready, formatted document with cover page, table of contents, charts rendered as images, and narrative sections. The PDF is generated server-side using the ReportLab library and is typically 8 to 15 pages for a Monthly report. The PDF is the right format for executive distribution, board meetings, and quarterly business reviews where stakeholders expect a polished document rather than a Slack message or a CSV. The PDF includes the LeadReach branding by default but can be white-labeled on Enterprise tiers to use your company's logo and color palette.` },
      { type: 'list', items: [
        `CSV export: spreadsheet-friendly format with one row per metric, designed for pivot tables and charting.`,
        `JSON export: programmatic format mirroring the /api/dashboard/stats response, designed for engineering consumption.`,
        `PDF export: print-ready formatted document with cover page and charts, designed for stakeholder distribution.`,
        `Slack delivery: formatted message with optional thread-per-section and PDF attachment for Monthly reports.`,
        `Email delivery: multipart message with HTML body and CSV/JSON/PDF attachments.`,
        `Custom HTTP delivery: signed JSON POST to any endpoint, with HMAC-SHA256 signature verification.`,
      ]},
      { type: 'heading', level: 2, content: 'Custom Report Builder' },
      { type: 'paragraph', content: `For workspaces that need reports beyond the three pre-configured cadences, the Report Generator includes a custom report builder. The builder allows you to select any subset of the 25+ tracked metrics, configure the time range (last 7 days, last 30 days, last 90 days, last 12 months, or custom range), select the comparison baseline (previous period, same period last year, or workspace historical average), and configure the delivery channel and cadence. Custom reports are useful for one-off analyses (e.g., "channel performance during the Q4 holiday season") and for recurring reports that do not fit the Daily/Weekly/Monthly templates (e.g., "weekly agent capacity utilization for capacity planning").` },
      { type: 'paragraph', content: `Custom reports are subject to two limits. First, the workspace can have at most 10 active custom reports to prevent report sprawl — most workspaces find that the three pre-configured cadences plus 2 to 3 custom reports cover all their needs. Second, custom reports can include at most 15 metrics per report to keep the report readable — reports with more than 15 metrics become data dumps that no one reads. The platform surfaces both limits in the custom report builder and prevents creating reports that exceed them. If you need to share more than 15 metrics, create multiple custom reports targeted at different audiences.` },
      { type: 'steps', items: [
        `Open the Report Generator console and click the Reports tab.`,
        `Review the three pre-configured cadences (Daily, Weekly, Monthly). Confirm that each is enabled and that the delivery channels are configured correctly.`,
        `Click New Custom Report to open the custom report builder.`,
        `Select the metrics to include (up to 15). The builder surfaces a description of each metric and its source panel.`,
        `Select the time range and the comparison baseline. The builder previews the report structure on the right.`,
        `Configure the delivery channel (Slack, email, or custom HTTP) and the cadence (one-time, daily, weekly, monthly).`,
        `Click Save and Activate. The platform generates the first report immediately and schedules future reports per the configured cadence.`,
        `Review the report delivery history in the Reports, then Delivery History tab. Failed deliveries are flagged for retry and can be manually re-sent.`,
      ]},
      { type: 'callout', variant: 'tip', content: `Subscribe the executive team to the Monthly report's PDF delivery via email, not Slack. Executives typically prefer email for strategic reports because email supports forwarding, archiving, and search better than Slack. Use Slack for the Daily and Weekly reports that need real-time visibility but not archival.` },
      { type: 'heading', level: 2, content: 'Report Audit and Compliance' },
      { type: 'paragraph', content: `Every report delivery is logged in the report audit history with the report ID, the cadence, the delivery channel, the delivery timestamp, the success/failure status, and the recipient list. The audit history is exportable as CSV from the Reports, then Audit tab and is retained for 7 years on all tiers. The audit history is the primary artifact for compliance review — it proves that reports were delivered to the right recipients at the right time, which is required for SOC 2 control CC7.2 (system operations monitoring) and for revenue operations audit trails.` },
      { type: 'paragraph', content: `Report audit history also includes the report's content hash — a SHA-256 hash of the report's JSON payload that uniquely identifies the report's content. The content hash is useful for detecting silent report drift — if two consecutive Monthly reports have the same content hash (despite covering different time periods), the Report Generator is producing the same report twice, which indicates a bug or a configuration error. The platform surfaces content hash collisions in the Reports, then Audit tab and flags them for investigation.` },
      { type: 'paragraph', content: `Custom reports are the bridge between LeadReach's internal metrics and your organization's broader business intelligence practice. Most workspaces start with the three pre-configured cadences and add 2 to 3 custom reports within the first 90 days as they identify stakeholder needs that the pre-configured reports do not cover. Treat report configuration as an evolving practice — review the report list quarterly, retire reports that no one reads (the audit history shows open/read rates for email-delivered reports), and add new reports when stakeholders request them. A well-curated report list is a high-leverage asset that keeps your organization aligned around the same data and prevents the data fragmentation that plagues most sales operations teams.` },
    ],
  },
];
