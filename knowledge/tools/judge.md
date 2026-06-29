---
title: "Judge — Lead Qualification Agent Tools"
category: tool
agent: judge
role: lead-qualification
tags: [judge, qualification, scoring, bant, meddic]
last_reviewed: "2026-06-22"
grade: "A"
---

# Judge — Lead Qualification Agent Tools

## 1. Role

Judge takes enriched leads from Forge and research from Sage, and applies a quantitative qualification framework. Judge's defining principle is **evidence-based scoring** — every score is computed from observable data, not guessed.

## 2. Cognitive Posture

- **Evaluative**: Every score is computed, not guessed.
- **Evidence-based**: Qualification is grounded in observable signals.
- **Fair-but-decisive**: Same rubric applied uniformly; ambiguity surfaced, not hidden.

## 3. Tools

### Tool: qualify_lead

**Purpose**: Apply the 5-factor scoring model to a lead.

**Input**: Enriched lead (from Forge) + research findings (from Sage).

**Output**:
- `composite_score` (0–100)
- `tier` (A, B, C, D)
- `factor_scores`: {
    `firmographic_fit`: 0–100,
    `technographic_fit`: 0–100,
    `behavioral_signals`: 0–100,
    `intent_signals`: 0–100,
    `partnership_fit`: 0–100
  }
- `confidence` (0–100)
- `reasoning` (string): Explanation of the score.
- `next_actions` (array): Recommended next steps.

### Tool: score_bant

**Purpose**: Score a lead on BANT (Budget, Authority, Need, Timeline).

**Input**: Lead + research findings.

**Output**: BANT scores (each 0–100) + composite + reasoning.

### Tool: score_meddic

**Purpose**: Score a lead on MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion).

**Input**: Lead + research findings.

**Output**: MEDDIC scores (each 0–100) + composite + reasoning.

### Tool: detect_intent

**Purpose**: Detect buying intent signals from web research.

**Input**: Account name.

**Output**: Array of intent signals with:
- `signal_type` (e.g., "hiring_sdr", "funding_announcement", "new_cro")
- `signal_strength` (0–100)
- `source_url`, `date`

### Tool: classify_tier

**Purpose**: Classify a lead into tier A/B/C/D based on composite score.

**Input**: Composite score + confidence.

**Output**:
- `tier` (A: 80+, B: 65–79, C: 50–64, D: <50)
- `recommended_action`:
  - A: Immediate outreach to Bard
  - B: Outreach within 7 days
  - C: Nurture; re-evaluate quarterly
  - D: Discard

### Tool: surface_ambiguity

**Purpose**: When qualification is uncertain, surface the ambiguity for human review.

**Input**: Lead + score + confidence.

**Output**:
- `ambiguous` (boolean)
- `questions_for_human` (array)

## 4. Scoring Formula

```
composite_score = (
  firmographic_fit * 0.20 +
  technographic_fit * 0.15 +
  behavioral_signals * 0.30 +
  intent_signals * 0.25 +
  partnership_fit * 0.10
)

# Confidence reduces with missing data
confidence = 100 - (missing_factors * 15)
```

## 5. Tier Definitions

| Tier | Score | Action | Expected Conversion |
|------|-------|--------|---------------------|
| A | 80+ | Immediate outreach | 25–35% |
| B | 65–79 | Outreach within 7 days | 12–20% |
| C | 50–64 | Nurture; re-evaluate quarterly | 3–8% |
| D | <50 | Discard | <2% |

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Score calibration (predicted vs actual conversion) | Within ±5pp |
| Tier A conversion rate | >25% |
| Tier D conversion rate | <2% |
| Confidence calibration | Within ±10pp |
| Ambiguity surfacing rate | 5–15% (too low = overconfident; too high = underconfident) |

## 7. Handoffs

- **From Atlas**: Enriched leads ready for qualification.
- **From Forge**: Enriched lead records.
- **From Sage**: Research findings for intent detection.
- **To Bard**: Tier A + B leads ready for outreach.
- **To Flow**: All qualified leads for pipeline tracking.

## 8. Error Handling & Edge Cases

### 8.1 Missing Data Scenarios

| Missing Data | Impact on Scoring | Confidence Penalty | Action |
|-------------|-------------------|-------------------|--------|
| No technographics | `technographic_fit` defaults to 50 (neutral) | -15 | Proceed; flag for Sage research |
| No behavioral signals | `behavioral_signals` defaults to 30 (below average) | -15 | Lower score; flag for nurture |
| No intent signals | `intent_signals` defaults to 20 (low) | -15 | Significant score reduction |
| No firmographic data | Cannot score reliably | -30 | Return `confidence: <30`; request Forge re-enrichment |
| No contact info | Does not affect score directly | 0 | Score the account; note "no contact" in next_actions |
| Conflicting firmographics | Two different headcount figures | -10 | Use most recent; flag ambiguity |

### 8.2 Boundary Cases

| Case | Rule | Example |
|------|------|---------|
| Score exactly on tier boundary (65, 80) | Round up to the higher tier | Score of 65 → Tier B (not C) |
| All factor scores are 0 | Composite = 0; Tier D; flag as "unscorable" | Lead with zero data |
| Composite >100 after calculation | Cap at 100 | Weighted sum produces 102 → 100 |
| Confidence <0 after penalties | Cap at 0 | 5 missing factors: 100 - 75 = 25 |
| Only 1 factor has data | Confidence = 100 - (4 * 15) = 40 | Very sparse lead |

### 8.3 BANT Edge Cases

| Factor | Edge Case | Scoring Rule |
|--------|-----------|-------------|
| Budget | No budget data available | Score = 40 (neutral assumption); confidence -20 |
| Budget | Company is bootstrapped | Score = 60; they have budget but may be conservative |
| Authority | Contact is individual contributor | Authority score = 20; recommend finding economic buyer |
| Authority | Contact is C-suite | Authority score = 90 |
| Need | Product solves a problem they don't have | Need score = 10; likely Tier D |
| Need | No evidence of need but no evidence against | Need score = 40 (neutral); flag for discovery call |
| Timeline | No stated timeline | Timeline score = 30; assume no urgency |
| Timeline | Funding announced <30 days ago | Timeline score = 80; urgency implied |

### 8.4 MEDDIC Edge Cases

| Element | Edge Case | Scoring Rule |
|---------|-----------|-------------|
| Metrics | No quantifiable business impact identified | Metrics = 20; cannot assess ROI |
| Economic Buyer | Unknown who holds budget | Economic_Buyer = 20; critical gap to resolve |
| Decision Criteria | No info on vendor evaluation process | Decision_Criteria = 30; need discovery |
| Decision Process | Unknown procurement steps | Decision_Process = 30; could be lengthy |
| Identify Pain | No pain surfaced in research | Identify_Pain = 15; no compelling event |
| Champion | No internal advocate identified | Champion = 10; high risk of stall |

### 8.5 Conflicting Signals

| Conflict | Example | Resolution |
|----------|---------|------------|
| High firmographic fit, low intent | Perfect ICP match but no buying signals | Score is moderate; intent_signals pulls down composite. Flag as "good fit, dormant" |
| Low firmographic fit, high intent | Outside ICP but actively buying | Score is moderate; behavioral_signals lifts composite. Flag as "poor fit, high intent — consider expansion" |
| Recent funding + recent layoffs | Growth signal + contraction signal | Weight funding higher (within 90 days); note layoffs as risk factor in reasoning |
| New CRO hired + executive churn | Positive + negative leadership signals | Net score depends on role: CRO = positive; CTO churn = neutral; CFO churn = negative |

### 8.6 Rate Limit Handling

- Judge is primarily a compute-bound agent (no external API calls for scoring).
- `detect_intent` calls Sage's search APIs; rate limited by Sage's quota.
- Batch scoring: max 500 leads per batch. Queue excess leads.

## 9. Integration Patterns

### 9.1 Standard Qualification Pipeline

```
Forge → Judge.qualify_lead → (tier A/B) → Bard.compose_email
                           → (tier C)   → Nurture queue
                           → (tier D)   → Discard
                           → (confidence <40) → Sage.research_question → Judge.re-score
```

### 9.2 Dual-Framework Scoring

For enterprise deals (deal value >$100K), Judge runs both BANT and MEDDIC:

```yaml
scoring_approach: "dual_framework"
frameworks: ["composite_5_factor", "bant", "meddic"]
tier_decision: "lowest_common_tier"
  # If composite says A but MEDDIC says B, use B (conservative for enterprise)
```

### 9.3 Intent-Triggered Re-Qualification

```
Sage.detect_intent → (new signal: funding announced) → Judge.re-qualify_lead
  → Lead upgrades from Tier C to Tier B → Bard composes outreach
```

### 9.4 Feedback Loop from Flow

```
Flow.track_deal → (deal progressed to Meeting Held) → Judge.update_score
  → Actual progression data increases confidence
Flow.track_deal → (deal stalled at stage 2 for 30 days) → Judge.downgrade_score
  → Stall decreases behavioral_signal score
```

### 9.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| qualify_lead | classify_tier | Composite score + confidence | Object |
| score_bant | classify_tier | BANT composite | Object |
| score_meddic | classify_tier | MEDDIC composite | Object |
| detect_intent | qualify_lead | Intent signal array | Array<Object> |
| classify_tier | Bard / Flow / Nurture | Tier + recommended action | Object |
| surface_ambiguity | Human operator | Ambiguous leads + questions | Object |

## 10. Quality Assurance Rules

### 10.1 Scoring Validation Rules

- Every factor score must be an integer between 0 and 100.
- Composite score must equal the weighted sum (validate after calculation).
- Tier classification must match score thresholds (A: ≥80, B: 65–79, C: 50–64, D: <50).
- Confidence must account for all missing factors in the formula.

### 10.2 Reasoning Quality Standards

Every `qualify_lead` output must include `reasoning` that:
1. Explains the top 3 factors driving the score.
2. Notes any missing data and its impact.
3. Flags conflicting signals.
4. Provides a specific, actionable `next_actions` list.

**Bad reasoning**: "This lead scored 72 because it matches some criteria."
**Good reasoning**: "Scored 72 (Tier B): Strong behavioral signals (85) from SDR hiring + Series B funding. Firmographic fit is moderate (65) due to headcount being below ICP minimum. Intent signals partially missing (-15 confidence) as no web research was available for buying intent. Recommend: outreach within 7 days referencing Series B funding; verify headcount with Sage."

### 10.3 Confidence Thresholds for Actions

| Confidence | Allowed Actions |
|-----------|----------------|
| ≥70 | Auto-dispatch to Bard for outreach |
| 50–69 | Auto-dispatch with caution flag; Bard must verify claims before sending |
| 30–49 | Route to Sage for additional research; do NOT dispatch to Bard |
| <30 | Flag for human review; scoring is unreliable |

### 10.4 Calibration Audits

- Monthly: Compare predicted Tier A/B conversion rates against actual close rates.
- If Tier A conversion <20%: Model is over-scoring → adjust weights or thresholds.
- If Tier C conversion >10%: Model is under-scoring → check for missed signals.
- If ambiguity rate <5%: Model is overconfident → increase penalty for missing data.
- If ambiguity rate >15%: Model is underconfident → reduce penalty for missing data.

### 10.5 Anti-Bias Rules

- Do not use company name, country of origin, or founder demographics as scoring factors.
- Industry scoring is based on product-fit, not industry prestige.
- Revenue estimates from Forge may be biased toward US companies; apply a +10% confidence buffer for non-US leads where revenue data is sparse.

## 11. Performance Optimization

### 11.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Factor score for a lead | 24 hours | On new enrichment data from Forge |
| Intent signals for an account | 6 hours | On new Sage research findings |
| Tier classification | 24 hours | On score change |
| BANT/MEDDIC scores | 7 days | On new research or deal progression |
| Scoring model weights | 30 days | On calibration audit |

### 11.2 Parallel Execution

- Score multiple leads in parallel (no inter-lead dependencies).
- `detect_intent` can run in parallel with `qualify_lead` for the same account.
- `score_bant` and `score_meddic` can run in parallel for the same lead.

### 11.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| qualify_lead | 10s per lead | Return partial score with missing factors flagged |
| score_bant | 5s per lead | Return best-available BANT scores |
| score_meddic | 8s per lead | Return best-available MEDDIC scores |
| detect_intent | 30s per account | Return empty intent array; confidence penalty |
| classify_tier | 1s | Instant; no timeout expected |
| Batch scoring (500 leads) | 15 min | Return completed scores; flag incomplete |

### 11.4 Incremental Scoring

When new data arrives (e.g., Forge finds a new technographic), Judge performs incremental scoring:
1. Recompute only the affected factor score.
2. Recalculate composite from updated factor scores.
3. Re-classify tier only if composite changed by ≥5 points.
4. Avoid full re-scoring when partial update suffices.

## 12. Anti-Patterns

### 12.1 Do Not: Override Scores Based on Gut Feeling

Judge scores are computed from data. If a human AE believes a Tier C lead should be Tier A, they must provide evidence (new data points) that Judge can incorporate. Do not allow manual score overrides without data.

### 12.2 Do Not: Score Before Enrichment

Running `qualify_lead` on raw Scout data (pre-Forge) wastes the scoring model. Enrichment data significantly affects factor scores. Always wait for Forge enrichment.

### 12.3 Do Not: Use a Single Framework for Enterprise Deals

For deal values >$100K, BANT alone is insufficient. Use MEDDIC or the 5-factor composite. BANT is suitable for SMB / mid-market.

### 12.4 Do Not: Ignore Low Confidence

A Tier A lead with 35% confidence is NOT a reliable Tier A. Always pair tier with confidence. Low-confidence high-tier leads should be researched further before outreach.

### 12.5 Do Not: Score Stale Data

If enrichment data is >90 days old, do not score until Forge re-enriches. Stale data produces unreliable scores that degrade calibration.

### 12.6 Do Not: Treat All Industries Equally

SaaS companies with 50 employees are very different from manufacturing companies with 50 employees. Industry-specific scoring adjustments are built into the model; do not disable them.

## 13. Output Schema Deep Dive

### 13.1 qualify_lead Output

```yaml
lead_id: "lead_abc123"
account_name: "Acme Corp"
scoring_timestamp: "2026-06-22T17:00:00Z"
scoring_model_version: "3.2.1"

composite_score: 78
tier: "B"
confidence: 72

factor_scores:
  firmographic_fit:
    score: 65
    weight: 0.20
    weighted_contribution: 13.0
    evidence:
      - "Headcount 250 (ICP: 100–500): match"
      - "Industry SaaS (ICP: SaaS): match"
      - "Revenue $25M (ICP: $10M–$100M): match"
    gaps:
      - "Headcount at lower end of ICP range; may lack scale"
  technographic_fit:
    score: 80
    weight: 0.15
    weighted_contribution: 12.0
    evidence:
      - "Uses Salesforce CRM: strong integration fit"
      - "Uses HubSpot Marketing: complementary"
    gaps: []
  behavioral_signals:
    score: 85
    weight: 0.30
    weighted_contribution: 25.5
    evidence:
      - "3 SDR roles posted in last 30 days"
      - "Series B funding raised 37 days ago"
      - "New CRO hired 21 days ago"
    gaps: []
  intent_signals:
    score: 70
    weight: 0.25
    weighted_contribution: 17.5
    evidence:
      - "Visited LeadReach pricing page (2 visits)"
      - "Downloaded ROI calculator"
    gaps:
      - "No RFP or vendor evaluation activity detected"
  partnership_fit:
    score: 60
    weight: 0.10
    weighted_contribution: 6.0
    evidence:
      - "2 existing customers in similar industry"
    gaps:
      - "No direct partnership or integration references"

reasoning: "Tier B (78): Strong behavioral signals (85) from recent SDR hiring, Series B funding, and new CRO. Technographic fit is high (80) with Salesforce + HubSpot stack. Firmographic fit is moderate (65) — headcount at lower end. Intent signals are present but lack RFP activity. Partnership fit is neutral (60). Missing: vendor evaluation signals. Recommend: outreach referencing Series B + new CRO; verify headcount with Sage."

confidence_breakdown:
  base_confidence: 100
  missing_factors_penalty: -20  # No vendor eval data
  stale_data_penalty: -5        # Some data 60+ days old
  conflicting_signals_penalty: -3  # Funding + minor layoff signal
  final_confidence: 72

next_actions:
  - action: "dispatch_to_bard"
    priority: "high"
    note: "Tier B lead; outreach within 7 days"
  - action: "sage_research"
    priority: "medium"
    question: "Is Acme Corp evaluating any sales intelligence vendors?"
  - action: "forge_re_enrich"
    priority: "low"
    note: "Verify headcount — current data is 45 days old"
```

### 13.2 score_bant Output

```yaml
lead_id: "lead_abc123"
framework: "BANT"
bant_scores:
  budget:
    score: 65
    evidence: "Series B funding ($45M) indicates available budget"
    gap: "No confirmed budget for sales intelligence specifically"
  authority:
    score: 70
    evidence: "Contact is VP of Sales; likely decision-maker for sales tools"
    gap: "Economic buyer (CFO/CEO) not yet identified"
  need:
    score: 80
    evidence: "Hiring 3 SDRs indicates scaling sales team; needs tooling"
    gap: "No explicit pain point stated in research"
  timeline:
    score: 75
    evidence: "Recent funding + SDR hiring suggests urgency (next 90 days)"
    gap: "No specific deadline or procurement timeline"

bant_composite: 72.5
bant_tier: "B"
reasoning: "Strong Need and Timeline signals. Budget is implied from funding but not confirmed for this category. Authority is present at VP level but economic buyer is unknown."
```

### 13.3 score_meddic Output

```yaml
lead_id: "lead_abc123"
framework: "MEDDIC"
meddic_scores:
  metrics:
    score: 40
    evidence: "No quantifiable business metrics identified"
    gap: "No evidence they measure sales efficiency KPIs"
  economic_buyer:
    score: 30
    evidence: "CFO identified but not engaged"
    gap: "No relationship with budget holder"
  decision_criteria:
    score: 50
    evidence: "Using Salesforce suggests CRM integration is a criterion"
    gap: "No explicit vendor evaluation criteria known"
  decision_process:
    score: 35
    evidence: "Unknown procurement process"
    gap: "Could be 30-day or 6-month sales cycle"
  identify_pain:
    score: 70
    evidence: "Scaling SDR team rapidly; likely facing productivity challenges"
    gap: "Pain is inferred, not confirmed by prospect"
  champion:
    score: 25
    evidence: "No internal advocate identified yet"
    gap: "Need to find and develop a champion"

meddic_composite: 41.7
meddic_tier: "C"
reasoning: "MEDDIC score (42) is lower than composite (78) because MEDDIC focuses on deal progression readiness. While Acme has pain (70) and implied criteria (50), critical gaps in economic buyer (30), decision process (35), and champion (25) make this a high-risk enterprise deal without further discovery."
recommended_next_steps:
  - "Identify and engage the economic buyer (CFO)"
  - "Map the procurement decision process"
  - "Find or develop an internal champion"
  - "Quantify the business impact (Metrics)"
```

### 13.4 surface_ambiguity Output

```yaml
lead_id: "lead_abc123"
ambiguous: true
ambiguity_score: 68  # 0-100; >50 triggers ambiguity flag
questions_for_human:
  - question: "Acme Corp shows both growth (Series B, SDR hiring) and contraction signals (layoffs in engineering). Which signal is stronger?"
    impact: "Determines whether to score behavioral_signals at 85 (growth-dominant) or 55 (mixed signals)"
  - question: "The contact (VP Sales) appears to have been in role for only 3 months. Is this a new hire or a recent promotion?"
    impact: "If new hire, authority score should be lower; if promoted, authority is reliable."
  - question: "Acme uses both Salesforce and HubSpot. Is HubSpot being replaced by Salesforce, or do they coexist?"
    impact: "Technographic fit changes: if replacing HubSpot, they may be open to adding more tools; if coexisting, they may be consolidating."
recommended_action: "Hold in Tier B; do not dispatch to Bard until ambiguity is resolved via Sage research or human input."
```
