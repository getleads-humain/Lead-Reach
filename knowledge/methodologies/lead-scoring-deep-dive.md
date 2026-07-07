---
title: "Lead Scoring Deep Dive — Predictive, Behavioral, and Fit-Based Models for B2B Intelligence"
category: methodology
grade: A
last_reviewed: "2026-07-03"
tags: [lead-scoring, predictive-scoring, behavioral-scoring, fit-intent, icp, qualification, mql, sql, decay-models, scoring-algorithms]
---

# Lead Scoring Deep Dive — Predictive, Behavioral, and Fit-Based Models for B2B Intelligence

## Executive Summary

Lead scoring is the algorithmic backbone of every high-performance B2B pipeline. Without a rigorous scoring model, sales teams waste 67% of their time on leads that never convert (HubSpot State of Marketing, 2025). Yet most organizations implement scoring as a static point system — awarding 10 points for job title, 5 points for website visit — that degrades within weeks as market conditions shift.

This methodology provides a production-grade framework for building, tuning, and operating multi-signal lead scoring systems within the LeadReach platform. It covers three complementary scoring paradigms: **fit scoring** (who the company is), **intent scoring** (what the company is doing), and **predictive scoring** (what the company will likely do next). Each paradigm contributes to a composite score that the Judge agent computes for every prospect in the pipeline.

The LeadReach 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo) generates the raw signals; this document defines how those signals are transformed into actionable scores that drive routing, sequencing, and resource allocation decisions. When implemented correctly, a well-tuned scoring model improves sales-qualified lead (SQL) conversion rates by 30-50% and reduces average sales cycle length by 15-25%.

## Core Methodology

### The Three-Signal Scoring Architecture

LeadReach uses a three-signal architecture that separates lead quality into orthogonal dimensions. Each dimension is scored independently on a 0-100 scale, then combined with configurable weights into a composite score.

#### Signal 1: Fit Score (Who They Are)

Fit scoring measures how closely a prospect matches your Ideal Customer Profile. It is the most stable signal — company attributes change slowly (months to quarters). Fit scoring answers: *Is this the type of company that has historically bought from us?*

**Fit Score Components:**

| Component | Weight | Data Sources | Update Frequency |
|-----------|--------|--------------|------------------|
| Firmographic match | 35% | LinkedIn, Crunchbase, SEC EDGAR | Quarterly |
| Technographic alignment | 25% | BuiltWith, PublicWWW, DNS records | Monthly |
| Industry vertical fit | 20% | NAICS/SIC codes, website analysis | Quarterly |
| Company stage & size | 15% | Funding data, headcount trends | Monthly |
| Geographic alignment | 5% | HQ location, operating regions | Quarterly |

**Fit Score Formula:**

```
fit_score = (firmographic_match × 0.35) +
            (technographic_alignment × 0.25) +
            (industry_vertical_fit × 0.20) +
            (company_stage_size × 0.15) +
            (geographic_alignment × 0.05)
```

Each component is scored 0-100 based on how well the prospect matches the ICP criteria defined in the Atlas-generated ICP document. The scoring applies the hard/soft/no-match rules from `icp-design-scoring-methodology.md`: hard match = 100% of points, soft match = 60%, no match = 0%, negative match = -50%.

#### Signal 2: Intent Score (What They're Doing)

Intent scoring measures observable behaviors that indicate a prospect is actively researching, evaluating, or preparing to buy. Intent signals are volatile — they change daily or weekly. Intent scoring answers: *Is this company showing buying signals right now?*

**Intent Score Components:**

| Component | Weight | Data Sources | Signal Half-Life |
|-----------|--------|--------------|------------------|
| First-party engagement | 30% | Website visits, content downloads, email opens | 7 days |
| Third-party intent data | 25% | Bombora, ZoomInfo intent, G2 comparisons | 14 days |
| Hiring signals | 20% | Job board scraping, LinkedIn hiring alerts | 30 days |
| Trigger events | 15% | Funding announcements, M&A, leadership changes | 14 days |
| Content consumption patterns | 10% | Blog reads, webinar attendance, social engagement | 7 days |

**Intent Score Formula:**

```
intent_score = (first_party_engagement × 0.30) +
               (third_party_intent × 0.25) +
               (hiring_signals × 0.20) +
               (trigger_events × 0.15) +
               (content_consumption × 0.10)
```

**Critical Implementation Detail: Intent Decay**

All intent signals decay over time. A website visit from yesterday is worth far more than one from 90 days ago. LeadReach uses an exponential decay model:

```
decayed_signal_value = original_value × e^(-λ × days_elapsed)
```

Where λ (lambda) is the decay constant determined by signal half-life:
- `λ = ln(2) / half_life_days`
- For a 7-day half-life: `λ ≈ 0.099`
- For a 14-day half-life: `λ ≈ 0.050`
- For a 30-day half-life: `λ ≈ 0.023`

This means a website visit (7-day half-life) loses 50% of its value every week, while a trigger event (14-day half-life) retains 50% of its value for two weeks.

#### Signal 3: Predictive Score (What They'll Likely Do)

Predictive scoring uses machine learning models trained on historical win/loss data to estimate the probability that a prospect will convert. It captures non-obvious correlations that rule-based models miss.

**Predictive Model Architecture:**

1. **Feature Engineering**: Transform raw prospect data into 150+ features across firmographics, technographics, behavioral patterns, engagement timing, and market context.
2. **Model Training**: Gradient-boosted decision tree ensemble (XGBoost or LightGBM) trained on 12+ months of closed-won/closed-lost data. Minimum training set: 500 deals with at least 100 wins.
3. **Model Validation**: 5-fold stratified cross-validation. Acceptance criteria: AUC-ROC ≥ 0.78, precision at top decile ≥ 40%.
4. **Model Retraining**: Monthly retraining with a 12-month rolling window. Automatic retraining triggers if prediction accuracy drifts below AUC 0.72.

**Predictive Score Output:**

The model outputs a probability (0-1) that is scaled to 0-100:
```
predictive_score = model_probability × 100
```

**When Predictive Models Are Not Available:**

For new customers without sufficient historical data (fewer than 500 closed deals), LeadReach falls back to a heuristic scoring model:
```
heuristic_predictive = (fit_score × 0.45) + (intent_score × 0.35) + (industry_benchmark × 0.20)
```

Where `industry_benchmark` is the average conversion rate for the prospect's industry segment, sourced from aggregated LeadReach data.

### Composite Score Calculation

The three signals combine into a composite lead score:

```
composite_score = (fit_score × fit_weight) +
                  (intent_score × intent_weight) +
                  (predictive_score × predictive_weight)
```

**Default Weights by Deal Complexity:**

| Deal Type | ACV Range | Fit Weight | Intent Weight | Predictive Weight |
|-----------|-----------|------------|---------------|-------------------|
| Self-serve / PLG | <$5K | 0.20 | 0.40 | 0.40 |
| SMB transactional | $5K-$50K | 0.30 | 0.35 | 0.35 |
| Mid-market | $50K-$250K | 0.40 | 0.30 | 0.30 |
| Enterprise | $250K+ | 0.50 | 0.25 | 0.25 |

The rationale: enterprise deals depend more on fit (the company must be the right type), while PLG deals depend more on intent (what matters is that they're actively using the product). Predictive weight decreases for enterprise because the sample size of enterprise deals is smaller and each deal is more unique.

### Score-to-Grade Mapping

| Composite Score | Grade | Label | Routing |
|-----------------|-------|-------|---------|
| 80-100 | A | Hot Lead | Immediate SDR outreach (SLA: <1 hour) |
| 65-79 | B | Warm Lead | SDR outreach within 24 hours |
| 50-64 | C | Nurture Lead | Marketing automation, quarterly SDR check-in |
| 35-49 | D | Low Priority | Marketing nurture only |
| 0-34 | F | Disqualified | Suppress from active outreach |

### Threshold Calibration

Grade thresholds are not static. LeadReach recalibrates thresholds monthly based on actual conversion data:

1. **If Grade A conversion rate < 25%**: Tighten the A threshold (raise by 2-5 points)
2. **If Grade B conversion rate > 30%**: Lower the A threshold (more leads reach SDRs)
3. **If Grade D leads convert at > 10%**: Lower the D threshold (too aggressive on disqualification)
4. **If overall pipeline value is below quota**: Lower the B threshold (widen the active funnel)

Threshold changes must be approved by the sales operations lead and documented in the scoring configuration.

## Implementation Guide

### Step 1: Define Your ICP Foundation

Before any scoring can begin, Atlas must generate a well-defined ICP. Refer to `/knowledge/domain/icp-design-scoring-methodology.md` for the complete ICP design process. The ICP provides the fit scoring criteria.

**Action**: Atlas generates the ICP → Judge validates the ICP against historical win data → ICP is versioned and stored.

### Step 2: Configure Signal Weights

Work with the sales operations team to set initial signal weights based on deal type. Use the default weights above as starting points, then adjust based on observed performance after 30 days.

**Action**: Configure `scoring_config.json` in the LeadReach settings with the agreed weights and thresholds.

### Step 3: Connect Data Sources for Intent Signals

The Forge agent must be configured to pull intent signals from the following sources:
- **First-party**: Website analytics (Google Analytics, Segment), email engagement (SMTP webhooks), CRM activity logs
- **Third-party**: Bombora intent data API, ZoomInfo intent signals, G2 comparison pages
- **Public signals**: LinkedIn hiring alerts, Crunchbase funding updates, SEC filing monitors

**Action**: Configure data source connectors in the Forge agent settings. Validate data freshness (max 24-hour latency for first-party, 72-hour for third-party).

### Step 4: Train the Predictive Model (If Applicable)

If you have 500+ closed deals with known outcomes:
1. Export deal data from CRM (company attributes, engagement history, outcome, ACV, cycle length)
2. Engineer features using the standard feature pipeline
3. Train the gradient-boosted model with 5-fold cross-validation
4. Validate AUC-ROC ≥ 0.78 on held-out test set
5. Deploy model to the Judge agent's scoring engine

**Action**: Sage prepares the training dataset → Judge trains and validates the model → Echo monitors model performance in production.

### Step 5: Score and Route

Once configured, the Judge agent scores every prospect that enters the pipeline:
1. Scout discovers the prospect and passes raw data to Forge
2. Forge enriches the prospect profile with firmographic, technographic, and intent data
3. Judge computes fit, intent, and predictive scores, then the composite score
4. Judge assigns a grade and routes accordingly (A → SDR immediate, B → SDR queue, C → nurture, D/F → suppress)
5. Bard receives the scored prospect and crafts outreach calibrated to the grade

### Step 6: Monitor and Iterate

The Echo agent runs a weekly scoring audit:
1. Score distribution analysis — are grades following the expected distribution? (Roughly: 10% A, 20% B, 40% C, 20% D, 10% F)
2. Conversion rate by grade — are A leads actually converting at higher rates?
3. Model drift detection — is the predictive model's accuracy degrading?
4. Signal correlation analysis — which signals are most predictive of conversion this month?

## Scoring Frameworks & Criteria

### Fit Scoring Criteria — Detailed Breakdown

| Criterion | Scoring Rule | Points | Example |
|-----------|-------------|--------|---------|
| Industry match | Exact match to ICP vertical | 0-100 | "SaaS" = 100, "Technology" = 60, "Retail" = 0 |
| Employee count | Within ICP range | 0-100 | ICP: 50-500; prospect has 200 = 100; prospect has 20 = 30 |
| Revenue range | Within ICP range | 0-100 | ICP: $5M-$100M; prospect at $30M = 100 |
| Tech stack overlap | % of preferred tech present | 0-100 | ICP wants Salesforce + HubSpot; prospect has both = 100 |
| Funding stage | Match to ICP stage | 0-100 | ICP: Series A-C; prospect at Series B = 100 |
| Geography | Within ICP regions | 0-100 | ICP: US, UK, DE; prospect in US = 100 |
| Growth rate | Above ICP threshold | 0-100 | ICP: >15% YoY headcount growth; prospect at 25% = 100 |

### Intent Scoring Criteria — Detailed Breakdown

| Signal | Scoring Rule | Max Points | Decay |
|--------|-------------|------------|-------|
| Website visit (pricing page) | 1 visit = 15 pts, 2+ = 25 pts | 25 | 7-day half-life |
| Website visit (other pages) | 1 visit = 5 pts, 3+ = 15 pts | 15 | 7-day half-life |
| Content download | 1 download = 10 pts | 10 | 14-day half-life |
| Email open | 1 open = 3 pts, 3+ = 8 pts | 8 | 3-day half-life |
| Email reply | 1 reply = 20 pts | 20 | 14-day half-life |
| Webinar attendance | 1 attendance = 15 pts | 15 | 30-day half-life |
| Third-party intent spike | Above category threshold = 20 pts | 20 | 14-day half-life |
| Active hiring for relevant role | 1 relevant role = 10 pts, 3+ = 20 pts | 20 | 30-day half-life |
| Funding announcement | Recent round = 15 pts | 15 | 14-day half-life |
| Executive change | New C-suite = 10 pts | 10 | 30-day half-life |
| Competitor evaluation | Visible on G2/comparison site = 10 pts | 10 | 14-day half-life |

**Intent score is capped at 100.** If raw points exceed 100, normalize: `intent_score = (raw_points / max_possible_points) × 100`.

### Negative Scoring (Demerit Signals)

Certain signals should reduce the composite score:

| Demerit Signal | Point Reduction | Rationale |
|----------------|-----------------|-----------|
| Competitor customer (confirmed) | -15 | Harder to displace incumbent |
| Recent layoff (>10% headcount) | -20 | Budget contraction likely |
| Legal/regulatory issues active | -10 | Organizational distraction |
| Unsubscribed from emails | -25 | Explicit opt-out; respect signal |
| Previous disqualification | -30 | Already evaluated and rejected |
| Student / academic email domain | -20 | Not a business buyer |
| Free email domain (gmail, hotmail) | -10 | Likely personal, not corporate |
| Company in bankruptcy/receivership | -50 | No budget available |

## LeadReach Agent Integration

### Atlas (Strategic Orchestrator)

Atlas initiates the scoring pipeline by classifying the user's intent and determining whether scoring is needed. When the intent is `score_lead`, Atlas:
1. Loads the relevant ICP configuration
2. Passes the ICP criteria and weight configuration to Judge
3. Ensures Scout and Forge have completed their discovery and enrichment before invoking Judge

### Scout (Discovery)

Scout surfaces the raw signals that feed intent scoring. Specifically:
- Detects hiring signals from job boards and LinkedIn
- Finds trigger events (funding, M&A, executive changes)
- Discovers competitor evaluation signals on review platforms

### Forge (Enrichment)

Forge enriches prospect profiles with the data needed for fit scoring:
- Resolves firmographic data (industry, size, revenue, geography)
- Detects technographic signals (tech stack, tools, integrations)
- Verifies contact information and authority levels
- Applies data quality scores to each enriched field

### Sage (Research)

Sage provides deep intelligence that feeds predictive scoring:
- Analyzes strategic context (regulatory pressure, market trends)
- Researches competitive landscape for the prospect
- Identifies historical patterns from similar accounts
- Provides industry-specific benchmarks for conversion rates

### Judge (Qualification & Scoring)

Judge is the primary consumer of this methodology. Judge:
1. Receives enriched profiles from Forge and intelligence from Sage
2. Computes the three sub-scores (fit, intent, predictive) using the formulas defined here
3. Applies the composite score formula with the configured weights
4. Assigns a grade (A/B/C/D/F) based on threshold configuration
5. Applies negative scoring demerits
6. Outputs the structured scorecard with evidence for every scored criterion

### Bard (Outreach Composition)

Bard calibrates outreach intensity based on the lead grade:
- **Grade A**: Direct, assertive outreach. Reference specific pain points. Request a meeting immediately.
- **Grade B**: Value-driven outreach. Share relevant case study. Offer a 15-minute discovery call.
- **Grade C**: Educational outreach. Share relevant content. Soft CTA (download, webinar, follow).
- **Grade D**: Minimal outreach. Add to drip campaign. Re-score in 60 days.

### Flow (Pipeline & Sequencing)

Flow uses scores to determine:
- Sequence enrollment rules (A leads → "High Priority" 5-touch sequence; B leads → "Standard" 8-touch sequence)
- Cadence intensity (A leads: touch every 2 days; B leads: every 4 days; C leads: every 14 days)
- Auto-escalation rules (if a C lead's score rises above 65, promote to B and escalate to SDR)
- Suppression rules (D/F leads suppressed from all active sequences)

### Echo (Analytics & Reporting)

Echo monitors scoring system health:
- Tracks score distribution over time
- Measures conversion rates by grade and identifies drift
- Reports on model accuracy and recommends retraining
- Generates the weekly scoring audit report
- Correlates scoring changes with pipeline outcomes

## Best Practices & Anti-Patterns

### Best Practices

1. **Score with evidence, never assumptions.** Every point awarded must trace to an observable data point. If you cannot cite the source, the score is unreliable.

2. **Treat unknown data as unknown, not zero.** Missing firmographic data should reduce confidence, not the score. Redistribute weight from unknown fields to known fields within the same dimension.

3. **Apply decay rigorously.** A prospect who visited your pricing page 90 days ago is not the same as one who visited yesterday. Decay ensures your score reflects current reality.

4. **Recalibrate thresholds monthly.** Market conditions change. A 70-point threshold for Grade A might be right in Q1 but too loose in Q3. Let the data drive the thresholds.

5. **Separate fit from intent explicitly.** A company with perfect fit but zero intent is a long-term nurture target, not an immediate sales opportunity. A company with high intent but poor fit is a seductive time-waster. The two-dimensional view prevents both errors.

6. **Test scoring models on holdout data.** Before deploying a new scoring configuration, validate it against the last 90 days of historical data. Would the new model have correctly predicted outcomes?

7. **Audit scoring distribution weekly.** A healthy distribution has roughly 10% A, 20% B, 40% C, 20% D, 10% F. If 60% of leads are Grade A, your thresholds are too loose. If 0% are Grade A, they're too tight.

8. **Use negative scoring proactively.** Don't just score who to pursue — score who to avoid. Demerit signals save enormous amounts of sales time.

### Anti-Patterns

1. **The Vanity Score Inflation.** Giving every lead a score of 80+ to make the pipeline look healthy. This destroys the entire purpose of scoring — differentiation. If everyone is hot, no one is.

2. **The Set-and-Forget Model.** Building a scoring model once and never revisiting it. Markets shift, competitors emerge, buyer behavior evolves. Scoring models must be living systems.

3. **The Single-Dimension Trap.** Using only fit scoring (ignoring intent) or only intent scoring (ignoring fit). A prospect with perfect fit but no intent is not a sales opportunity — it's a future opportunity. A prospect with high intent but terrible fit is a waste of sales time.

4. **The Over-Engineered Model.** Creating 47 scoring criteria with complex interdependencies. The model becomes impossible to explain, debug, or maintain. Keep it to 5-8 criteria per dimension.

5. **The Threshold Anchoring.** Refusing to adjust thresholds because "70 has always been our A threshold." Thresholds should serve the business, not tradition.

6. **Ignoring the Time Dimension.** Treating all signals as equally fresh. A job posting from 18 months ago has no bearing on current intent. Apply decay or remove stale signals entirely.

7. **Scoring Without Feedback Loops.** Running scoring without ever measuring whether Grade A leads actually convert at higher rates. Without feedback, scoring becomes superstition.

## Metrics & KPIs

### Primary Scoring KPIs

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Grade A → SQL conversion rate | ≥ 30% | SQLs / Grade A leads | Weekly |
| Grade B → SQL conversion rate | ≥ 15% | SQLs / Grade B leads | Weekly |
| Grade A → Closed-Won rate | ≥ 12% | Wins / Grade A leads | Monthly |
| Score-to-conversion correlation (r²) | ≥ 0.65 | Pearson correlation of score vs. outcome | Monthly |
| Predictive model AUC-ROC | ≥ 0.78 | 5-fold cross-validation | Monthly |
| Scoring coverage | ≥ 95% | % of leads with complete 3-signal scores | Weekly |

### Secondary Scoring KPIs

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Score distribution: % Grade A | 8-15% | A leads / total leads | Weekly |
| Score distribution: % Grade F | 5-15% | F leads / total leads | Weekly |
| False positive rate (Grade A that don't convert) | ≤ 70% | 1 - (A→Won / A leads) | Monthly |
| False negative rate (Grade C/D that convert) | ≤ 10% | (C/D→Won) / total won | Monthly |
| Average time from score to first contact | <2 hours (A), <24 hours (B) | Timestamp analysis | Weekly |
| Model retraining cadence | Monthly | Calendar | Monthly |
| Intent signal freshness | <7 days median | Signal age distribution | Weekly |

### Business Impact KPIs

| Metric | Expected Improvement | Baseline |
|--------|---------------------|----------|
| SQL conversion rate | +30-50% | Pre-scoring baseline |
| Average sales cycle length | -15-25% | Pre-scoring baseline |
| SDR productivity (meetings per day) | +25-40% | Pre-scoring baseline |
| Pipeline accuracy (forecast vs. actual) | ±10% | ±25-35% |
| Cost per SQL | -20-35% | Pre-scoring baseline |

### Scoring Audit Checklist (Weekly)

1. Score distribution within expected ranges?
2. Grade A conversion rate above target?
3. Predictive model AUC above threshold?
4. Any new signals that should be added or removed?
5. Any stale signals that need decay parameter updates?
6. Threshold adjustments needed based on conversion data?
7. Negative scoring rules still appropriate?
8. Data source freshness within SLA?
9. Any scoring anomalies (spikes, drops) that need investigation?
10. Feedback from SDR team on lead quality?

## Cross-References

- **[ICP Design & Scoring Methodology](/knowledge/domain/icp-design-scoring-methodology.md)** — The ICP that defines fit scoring criteria
- **[Lead Qualification Frameworks](/knowledge/domain/lead-qualification-frameworks.md)** — BANT, MEDDIC, and other frameworks that Judge uses alongside scoring
- **[Data Enrichment Methodology](/knowledge/domain/data-enrichment-methodology.md)** — How Forge enriches the data that feeds scoring
- **[Trigger Events Detection & Timing](/knowledge/domain/trigger-events-detection-timing.md)** — The trigger event taxonomy used in intent scoring
- **[Outreach Methodology — Cold Email Sequences](/knowledge/domain/outreach-methodology-cold-email-sequences.md)** — How Bard calibrates outreach to lead grade
- **[Judge Agent Training Manual](/knowledge/agents/judge.md)** — The agent that computes and applies scores
- **[Echo Agent Training Manual](/knowledge/agents/echo.md)** — The agent that monitors scoring system health
- **[Sales Playbook Design](/knowledge/methodologies/sales-playbook-design.md)** — How scoring integrates into the broader sales playbook
