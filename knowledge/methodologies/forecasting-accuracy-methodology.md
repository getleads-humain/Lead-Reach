---
title: "Forecasting Accuracy Methodology — Predictable Revenue Prediction for B2B Pipelines"
category: methodology
grade: A
last_reviewed: "2026-07-03"
tags: [forecasting, pipeline, revenue-prediction, accuracy, commit-analysis, weighted-pipeline, MEDDIC, deal-inspection, CRM]
---

# Forecasting Accuracy Methodology — Predictable Revenue Prediction for B2B Pipelines

## Executive Summary

Revenue forecasting is the most consequential operational discipline in B2B sales. An inaccurate forecast doesn't just produce a wrong number — it cascades into misallocated headcount, missed board commitments, delayed product investments, and eroded organizational trust. Yet most B2B organizations accept forecasting inaccuracy as inevitable, with the average company missing quarterly forecasts by 20-30%, and some missing by 50% or more.

The LeadReach Forecasting Accuracy Methodology replaces hope-based forecasting — "I feel good about this deal" — with a **multi-method, evidence-weighted, continuously calibrated** prediction system. By combining three complementary forecasting methods (weighted pipeline, inspection-based, and algorithmic), applying deal-level risk scoring, and enforcing rigorous commit hygiene, this methodology delivers forecast accuracy within **±10% of actual results at the quarterly horizon** — a level of precision that transforms forecasting from a reporting exercise into a strategic decision-making tool.

The methodology is designed to work at every level: individual rep forecasts, team-level rollups, and company-wide predictions. It integrates deeply with the LeadReach 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo), where each agent contributes specific data signals that improve forecast fidelity. Judge's qualification scoring quantifies deal probability. Sage's research provides competitive intelligence that derisks assumptions. Forge's enrichment ensures account data is current. And Flow's pipeline tracking provides the real-time stage progression data that is the foundation of any forecast.

## Core Methodology

### The TRIPLE Framework: Three Methods, One Accurate Forecast

TRIPLE stands for **Track, Rank, Inspect, Predict, Level**. The framework mandates that no single forecast method is trusted in isolation. Instead, three independent methods produce three separate predictions, which are then reconciled into a consensus forecast with explicit confidence intervals.

---

#### Phase 1: Track — Establish the Pipeline Data Foundation

Accurate forecasting begins with accurate pipeline data. The most sophisticated algorithm will produce garbage if the underlying CRM data is stale, incomplete, or manipulated.

**Step 1.1: Define Mandatory Pipeline Fields**

Every opportunity in the pipeline must have these fields populated before it can be included in any forecast:

| Field | Definition | Source | Required for Forecast |
|---|---|---|---|
| **Amount** | Total contract value (ARR for subscriptions, TCV for one-time) | Rep input (validated by Forge) | Yes |
| **Close Date** | Expected signature date | Rep input (validated by Flow) | Yes |
| **Stage** | Current pipeline stage (1-7 per LeadReach funnel) | Flow (automated) | Yes |
| **Probability** | Likelihood of closing (0-100%) | Judge scoring or rep override | Yes |
| **Next Step** | Specific, time-bound next action | Rep input | Yes |
| **Decision Maker** | Name and title of economic buyer | Forge enrichment | Yes |
| **Competitive Status** | Known competitors in the deal | Sage analysis | Recommended |
| **MEDDIC Score** | Qualification depth (see below) | Judge scoring | Yes for Commit |
| **Last Activity Date** | Date of last meaningful interaction | Flow tracking | Yes |
| **Created Date** | When the opportunity entered the pipeline | CRM auto | Yes |

**Step 1.2: Enforce Data Hygiene Rules**

| Rule | Description | Enforcement |
|---|---|---|
| **No zombie deals** | Opportunities with no activity in 30+ days are auto-flagged | Flow sends weekly alert; Judge scores as "stale" |
| **No stage-skipping** | Opportunities must progress through stages sequentially | Flow blocks invalid transitions |
| **No close-date sliding** | Close dates pushed back 3+ times trigger mandatory inspection | Judge flags for manager review |
| **No zero-amount deals** | Every opportunity must have an amount > $0 | CRM validation rule |
| **No orphan deals** | Every opportunity must have a named decision-maker | Forge enforces before stage 3 |

**Step 1.3: Stage-to-Probability Mapping**

Base probabilities are derived from historical conversion rates, not gut feel. Update these tables quarterly based on actual cohort data.

| Stage | Definition | Base Probability | Historical Close Rate |
|---|---|---|---|
| 1. Identified | Matches ICP, not yet contacted | 5% | 3-8% |
| 2. Contacted | First outreach sent, no reply | 10% | 5-12% |
| 3. Engaged | Prospect has replied | 20% | 12-25% |
| 4. Qualified | BANT/MEDDIC confirmed | 40% | 25-45% |
| 5. Opportunity | Mutual action plan agreed, active deal | 60% | 45-65% |
| 6. Negotiation | Terms under discussion | 80% | 65-85% |
| 7. Closed Won | Contract signed | 100% | 100% |

These base probabilities are then adjusted by the **Deal Risk Multiplier** (Phase 2) to produce the final forecast probability.

---

#### Phase 2: Rank — Apply Deal-Level Risk Scoring

Not all deals in the same stage carry the same risk. The Deal Risk Score (DRS) adjusts base probabilities based on seven risk factors.

**Deal Risk Score Formula:**

`Adjusted Probability = Base Probability × (1 - Risk_Deduction)`

Where `Risk_Deduction = Σ (Risk_Factor_Weight × Risk_Level)`, capped at 0.75 (no deal's adjusted probability can drop below 25% of its base).

**Risk Factor Matrix:**

| Risk Factor | Weight | Low Risk (0) | Medium Risk (0.5) | High Risk (1.0) |
|---|---|---|---|---|
| **Champion Access** | 20% | Direct access to economic buyer | Access to influencer, not buyer | No identified champion |
| **Competitive Threat** | 15% | No known competitors | Competitor present, we're preferred | Competitor is incumbent or preferred |
| **Timeline Risk** | 15% | Close date confirmed by buyer | Close date is rep estimate | Close date has been pushed 2+ times |
| **Budget Certainty** | 15% | Budget allocated and approved | Budget indicated but not approved | Budget unknown or not yet requested |
| **Engagement Recency** | 15% | Activity within last 7 days | Activity within last 14 days | Activity within last 30+ days |
| **Decision Process Clarity** | 10% | Full decision process mapped | Partial decision process known | Decision process unclear |
| **Multi-Thread Depth** | 10% | Engaged with 3+ stakeholders | Engaged with 2 stakeholders | Single-threaded (1 contact) |

**Example Calculation:**

A Stage 5 (Opportunity) deal with base probability 60%:
- Champion Access: Medium (0.5) → 0.20 × 0.5 = 0.10
- Competitive Threat: High (1.0) → 0.15 × 1.0 = 0.15
- Timeline Risk: Low (0) → 0.15 × 0 = 0.00
- Budget Certainty: Medium (0.5) → 0.15 × 0.5 = 0.075
- Engagement Recency: Low (0) → 0.15 × 0 = 0.00
- Decision Process: Low (0) → 0.10 × 0 = 0.00
- Multi-Thread: Medium (0.5) → 0.10 × 0.5 = 0.05

`Risk_Deduction = 0.10 + 0.15 + 0.00 + 0.075 + 0.00 + 0.00 + 0.05 = 0.375`
`Adjusted Probability = 60% × (1 - 0.375) = 37.5%`

This deal would contribute 37.5% × Amount to the weighted pipeline forecast, not the naïve 60%.

---

#### Phase 3: Inspect — Commit and Upside Classification

Forecast accuracy depends on correctly separating **Commit** (will close this period), **Best Case** (could close), and **Pipeline** (unlikely this period). The inspection process applies rigorous criteria to each category.

**Classification Criteria:**

| Category | Definition | Required Evidence | Probability Range |
|---|---|---|---|
| **Closed** | Contract signed | Signed agreement in CRM | 100% |
| **Commit** | Will close this period | MEDDIC ≥ 80%, verbal confirmation from buyer, legal review complete or in progress, close date within period | 80-99% |
| **Best Case** | Could close this period if things go well | MEDDIC ≥ 60%, positive signals from champion, close date within period or +1 week | 50-79% |
| **Pipeline** | Active but unlikely this period | MEDDIC < 60% or close date beyond period | 5-49% |
| **Omitted** | Not included in forecast | Stale, disqualified, or < 5% probability | < 5% |

**MEDDIC Commit Thresholds:**

MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion) is scored on a 0-100 scale by Judge:

| MEDDIC Component | Weight | Score Range | Commit Threshold |
|---|---|---|---|
| **Metrics** — Quantified business impact agreed | 20% | 0-20 | ≥ 15 |
| **Economic Buyer** — Access confirmed, engagement verified | 20% | 0-20 | ≥ 16 |
| **Decision Criteria** — Clear and aligned with our strengths | 15% | 0-15 | ≥ 12 |
| **Decision Process** — Steps, timeline, and approvers mapped | 15% | 0-15 | ≥ 10 |
| **Identify Pain** — Critical business pain confirmed | 15% | 0-15 | ≥ 10 |
| **Champion** — Internal advocate with power and motivation | 15% | 0-15 | ≥ 12 |
| **Total** | 100% | 0-100 | ≥ 80 (Commit), ≥ 60 (Best Case) |

**Inspection Cadence:**

| Level | Frequency | Participants | Focus |
|---|---|---|---|
| **Deal-level inspection** | Weekly | Rep + Manager | Verify MEDDIC scores, update risk factors, confirm next steps |
| **Team-level inspection** | Bi-weekly | Manager + Director | Review commit/best case mix, identify at-risk deals, validate close dates |
| **Org-level inspection** | Monthly | Director + VP + RevOps | Reconcile three forecast methods, set consensus forecast, calibrate confidence intervals |

---

#### Phase 4: Predict — Three-Method Reconciliation

Three independent forecast methods produce three numbers. The reconciliation process combines them into a consensus forecast with explicit confidence intervals.

**Method 1: Weighted Pipeline Forecast**

`WPF = Σ (Adjusted_Probability_i × Amount_i)` for all opportunities in the period

This is the most mechanical method. It trusts the pipeline data and risk-adjusted probabilities. Strengths: objective, consistent, auditable. Weaknesses: assumes the pipeline is complete and probabilities are accurate; doesn't account for deals that aren't in CRM yet.

**Method 2: Inspection-Based Forecast**

`IBF = Commit_Total + (Best_Case_Total × 0.50) + (Pipeline_Total × 0.10)`

This method relies on human judgment after rigorous inspection. Strengths: incorporates qualitative signals not in CRM. Weaknesses: subject to optimism bias and sandbagging.

**Method 3: Algorithmic / Historical Forecast**

`AHF = (Current_Quarter_Pipeline_Coverage × Historical_Conversion_Rate) + (Avg_New_Deals_Per_Quarter × Avg_Deal_Size × Historical_Win_Rate)`

This method extrapolates from historical patterns. Strengths: unbiased by individual deal emotions. Weaknesses: assumes the future resembles the past; poor at detecting inflection points.

**Reconciliation Process:**

| Scenario | Method 1 (WPF) | Method 2 (IBF) | Method 3 (AHF) | Consensus Action |
|---|---|---|---|---|
| **All three agree (±10%)** | $1.2M | $1.15M | $1.18M | Average: $1.18M ± 5% |
| **Two agree, one outlier** | $1.2M | $1.15M | $800K | Investigate Method 3; if no data issue, use average of two close methods |
| **All three diverge** | $1.2M | $800K | $950K | Deep inspection required; each method owner presents evidence; leadership decides |

**Confidence Intervals:**

| Forecast Component | Confidence Level | Range |
|---|---|---|
| Commit only | 90% | ± 5% |
| Commit + Best Case | 70% | ± 15% |
| Full pipeline weighted | 50% | ± 25% |
| Out-quarter pipeline | 30% | ± 40% |

**Consensus Forecast Format:**

```
Q3 2026 Consensus Forecast:
  Commit:        $840K  (90% confidence: $798K - $882K)
  Best Case:     $1.12M (70% confidence: $952K - $1.29M)
  Weighted Pipe: $1.38M (50% confidence: $1.04M - $1.73M)
  
  Recommended board forecast: $1.1M ± 15%
  Method: WPF + IBF reconciliation, AHF as sanity check
  Key risks: [Deal X competitive threat, Deal Y budget uncertainty]
  Key upside: [Deal Z verbal commitment pending legal review]
```

---

#### Phase 5: Level — Continuous Calibration and Learning

Forecast accuracy must be measured, tracked, and continuously improved. The Level phase closes the loop.

**Step 5.1: Accuracy Measurement**

Forecast accuracy is measured at multiple levels:

| Level | Metric | Formula | Target |
|---|---|---|---|
| **Deal-level** | Probability Calibration | `(Actual close rate / Predicted probability) × 100` | 85-115% |
| **Rep-level** | Forecast Accuracy | `1 - |Forecast - Actual| / Actual` | ≥ 80% |
| **Team-level** | Forecast Accuracy | Same formula | ≥ 85% |
| **Org-level** | Forecast Accuracy | Same formula | ≥ 90% |

**Step 5.2: Systematic Bias Detection**

| Bias Type | Pattern | Root Cause | Correction |
|---|---|---|---|
| **Optimism bias** | Consistently over-forecasting | Reps inflate to appease management | Apply historical haircut (e.g., multiply by 0.85) |
| **Sandbagging** | Consistently under-forecasting | Reps lowball to beat targets | Add pipeline not yet committed; inspect "hidden" deals |
| **Recency bias** | Overweighting recent wins/losses | One big deal closing colors judgment | Use algorithmic forecast as anchor |
| **Anchoring** | Sticking to initial forecast despite new data | Sunk cost in the original number | Require evidence-based forecast changes only |
| **Clumping** | All deals pushed to quarter-end | Lack of deal-level scrutiny | Enforce close-date discipline; weekly inspections |

**Step 5.3: Retrospective Analysis**

At the end of each quarter, conduct a structured retrospective:

1. **Forecast vs. Actual** by category (Commit, Best Case, Pipeline)
2. **Deal-level post-mortem** on every deal that missed (was it in Commit? Why did it slip?)
3. **Probability calibration check** — Did deals rated 60% actually close 60% of the time?
4. **Method comparison** — Which of the three methods was most accurate this quarter?
5. **Adjustment log** — What manual overrides were applied? Were they directionally correct?
6. **Pipeline quality assessment** — Was the pipeline sufficient in volume and quality?

## Implementation Guide

### For LeadReach Agents — Step-by-Step

**Step 1: Atlas — Forecast Initialization**
- Receive forecast request (e.g., "Generate Q3 forecast for US Enterprise team")
- Classify as forecast operation; identify scope (team, region, period)
- Coordinate with Forge for data refresh, Judge for deal scoring, Sage for competitive intel
- Select pipeline: Atlas → Forge → Judge → Sage → Flow → Echo

**Step 2: Forge — Data Enrichment & Validation**
- Refresh enrichment on all open opportunities (company data, contact data, technographics)
- Validate mandatory pipeline fields; flag missing data
- Compute or update ARR potential estimates
- Identify stale deals (no activity in 30+ days) for Flow to flag
- Return validated, enriched pipeline dataset

**Step 3: Judge — Deal Scoring & Risk Assessment**
- Score each deal's MEDDIC components (Metrics, EB, DC, DP, Pain, Champion)
- Calculate the Deal Risk Score for every Stage 4+ opportunity
- Produce adjusted probabilities incorporating risk deductions
- Classify each deal as Commit, Best Case, Pipeline, or Omitted
- Return scored and classified pipeline

**Step 4: Sage — Competitive & Market Intelligence**
- Analyze competitive threats for high-value deals (Stage 5+)
- Identify market-level risks (budget freezes, regulatory changes, M&A activity)
- Provide strategic context for deals at risk (e.g., "Incumbent contract expires Q4 — delay likely")
- Flag external factors that may affect close timing
- Return intelligence-enriched deal assessments

**Step 5: Flow — Pipeline Tracking & Method Computation**
- Calculate Method 1 (Weighted Pipeline Forecast) using Judge's adjusted probabilities
- Calculate Method 3 (Algorithmic / Historical Forecast) using historical conversion data
- Track stage progression velocity to identify deals likely to close vs. slip
- Compute pipeline coverage ratio and new deal creation rate
- Return quantitative forecast outputs

**Step 6: Atlas — Reconciliation & Consensus**
- Combine Flow's Method 1 & 3 outputs with inspection-based Method 2 (from deal reviews)
- Apply reconciliation rules (all agree, two agree, all diverge)
- Calculate confidence intervals for each forecast level
- Identify key risks and upside scenarios
- Produce the consensus forecast document

**Step 7: Echo — Reporting & Archival**
- Generate the consensus forecast in standard format
- Produce forecast accuracy dashboards (current vs. historical)
- Archive forecast for quarterly retrospective comparison
- Track forecast accuracy over time and compute trend metrics

## Scoring Frameworks & Criteria

### Forecast Accuracy Score (FAS)

The FAS is the primary metric for evaluating forecast quality. It combines directional accuracy with magnitude accuracy.

**Formula**: `FAS = (Direction_Accuracy × 0.30) + (Magnitude_Accuracy × 0.50) + (Calibration_Accuracy × 0.20)`

| Component | Description | Calculation | Benchmark |
|---|---|---|---|
| **Direction Accuracy** | Was the forecast directionally correct (over vs. under)? | 100% if direction correct, 0% if wrong | ≥ 90% |
| **Magnitude Accuracy** | How close was the forecast to actual? | `1 - |Forecast - Actual| / Actual` | ≥ 85% |
| **Calibration Accuracy** | Did predicted probabilities match actual outcomes? | `1 - Avg(|Predicted_Prob - Actual_Close_Rate|)` | ≥ 80% |
| **FAS (composite)** | Weighted sum | 0-100% | ≥ 82% |

### Pipeline Health Scorecard

| Metric | Red | Yellow | Green |
|---|---|---|---|
| Pipeline Coverage Ratio | < 2.0x | 2.0-3.0x | > 3.0x |
| Average Deal Age (Stage 5+) | > 120 days | 80-120 days | < 80 days |
| Stage Progression Rate | < 10%/week | 10-20%/week | > 20%/week |
| Stale Deal Rate | > 20% | 10-20% | < 10% |
| Commit Accuracy (trailing 4Q) | < 70% | 70-85% | > 85% |
| Close Date Slippage Rate | > 40% | 20-40% | < 20% |

### Deal Velocity Benchmarks

| Segment | Avg. Days: Stage 1→4 | Avg. Days: Stage 4→7 | Total Cycle |
|---|---|---|---|
| Enterprise ($100K+ ARR) | 45-60 | 60-90 | 105-150 |
| Mid-Market ($25-100K ARR) | 25-40 | 35-55 | 60-95 |
| SMB (< $25K ARR) | 10-20 | 15-30 | 25-50 |

Deals exceeding these benchmarks by 50%+ should be flagged as at-risk regardless of other scoring.

## LeadReach Agent Integration

### Atlas (Strategic Orchestrator)
- Initiates forecast workflows based on cadence or ad-hoc request
- Reconciles the three forecast methods into consensus
- Identifies when forecasts diverge and triggers deep inspection
- Communicates forecast results with appropriate confidence intervals
- Adjusts forecast parameters based on retrospective learning

### Scout (Discovery Specialist)
- Identifies new prospects that may enter the pipeline during the forecast period
- Discovers trigger events that could accelerate or delay deals (funding, M&A, leadership changes)
- Provides TAM-level data for algorithmic forecast calibration
- Monitors competitor movements that affect deal outcomes

### Forge (Enrichment Engine)
- Ensures all pipeline opportunities have complete, current data
- Validates company information (revenue, size, ownership) that affects deal sizing
- Refreshes decision-maker data (are they still at the company? still in role?)
- Detects data staleness and triggers refresh cycles
- Provides the data foundation that makes weighted pipeline forecasting reliable

### Sage (Research Analyst)
- Analyzes competitive dynamics for high-value deals
- Provides market intelligence that affects deal timing (budget cycles, regulatory changes)
- Identifies macro risks that could shift entire pipeline segments
- Offers strategic context for individual deal risk assessment
- Challenges or confirms rep-reported deal status with external evidence

### Judge (Qualification Gatekeeper)
- Scores every deal on the MEDDIC framework with objective, evidence-based criteria
- Calculates Deal Risk Scores using the 7-factor risk matrix
- Produces adjusted probabilities that feed the weighted pipeline forecast
- Classifies deals as Commit, Best Case, Pipeline, or Omitted
- Detects systematic bias (optimism, sandbagging) and recommends corrections

### Bard (Outreach Composer)
- Crafts messaging for stalled deals that need re-engagement
- Creates champion enablement content (ROI calculators, business cases) to strengthen Commit deals
- Generates competitive displacement messaging for deals with incumbent threats
- Supports multi-threading by creating stakeholder-specific content

### Flow (Pipeline Orchestrator)
- Tracks real-time stage progression for all pipeline opportunities
- Enforces pipeline hygiene rules (no zombies, no stage-skipping, no close-date sliding)
- Computes Method 1 (Weighted Pipeline) and Method 3 (Algorithmic) forecasts
- Monitors pipeline coverage ratios and alerts when below threshold
- Provides deal velocity data for cycle-time benchmarks

### Echo (Reporting & Analytics)
- Generates the consensus forecast document in standard format
- Produces forecast accuracy tracking dashboards
- Archives historical forecasts for retrospective comparison
- Calculates FAS and bias metrics for continuous calibration
- Creates executive-level forecast summaries with confidence intervals

## Best Practices & Anti-Patterns

### Best Practices

1. **Use three methods, not one** — No single forecast method is reliable alone. Weighted pipeline is objective but assumes data quality. Inspection is informed but subjective. Algorithmic is unbiased but ignores current context. Triangulation reduces error.
2. **Enforce MEDDIC rigor for Commit** — If a deal doesn't meet MEDDIC ≥ 80%, it's not Commit. Period. The temptation to "stretch" Commit is the #1 cause of forecast misses.
3. **Calibrate probabilities quarterly** — Base probabilities should be derived from actual historical close rates, not industry benchmarks. Your company's 40% stage might be another company's 25%.
4. **Distinguish forecast from target** — A forecast is a prediction of what will happen. A target is what you want to happen. Confusing the two produces optimistic forecasts that erode credibility.
5. **Measure and publish accuracy** — Track forecast accuracy at every level and publish it transparently. What gets measured improves; what gets hidden festers.
6. **Run weekly deal inspections** — Forecasts drift without regular inspection. Weekly 30-minute reviews of every Commit and Best Case deal catch slippage early.
7. **Account for pipeline creation, not just pipeline conversion** — Your forecast must include an estimate of deals that don't exist yet but will be created and closed this period. The algorithmic method handles this; the pipeline method does not.
8. **Use confidence intervals** — A single-point forecast ("$1.2M") implies false precision. A range ("$1.0M - $1.4M at 70% confidence") is more honest and more useful for decision-making.
9. **Separate commit from upside** — Leadership needs to know the floor (Commit) and the ceiling (Weighted Pipeline). Blurring them into one number removes decision-relevant information.
10. **Learn from misses, not just hits** — Post-mortem every missed Commit deal. Was the MEDDIC score inflated? Was a risk factor ignored? Systematic learning prevents repeated mistakes.

### Anti-Patterns

1. **❌ The "haircut" shortcut** — Applying a flat percentage haircut to the rep forecast ("take 20% off") is not forecasting; it's guessing. It doesn't identify which specific deals are at risk.
2. **❌ Over-reliance on rep sentiment** — "I feel really good about this deal" is not data. Feelings are systematically biased by optimism, sunk cost, and peer pressure. Always require evidence.
3. **❌ Ignoring pipeline creation** — Forecasting only the existing pipeline assumes no new deals will close. For most B2B companies, 20-40% of quarterly revenue comes from deals that weren't in the pipeline at quarter start.
4. **❌ The "hockey stick" close pattern** — If 60%+ of deals are forecast to close in the last 2 weeks of the quarter, the forecast is almost certainly wrong. Healthy pipelines close deals evenly.
5. **❌ Sandbagging as strategy** — Under-forecasting to "beat the number" destroys organizational trust and leads to under-investment. The short-term glory isn't worth the long-term damage.
6. **❌ Recency-weighted adjustments** — Changing the entire forecast because one big deal slipped last quarter is overcorrection. One data point is not a trend.
7. **❌ Forecasts without confidence intervals** — A forecast of "$1.2M" with no range implies certainty that doesn't exist. Always communicate the range.
8. **❌ Annual-only calibration** — If you only check forecast accuracy once a year, you can't course-correct. Quarterly calibration is the minimum; monthly is better.
9. **❌ Ignoring stale deals** — Deals with no activity in 30+ days are not in the forecast — they're in the graveyard. Including them inflates the pipeline and distorts the weighted forecast.
10. **❌ Single-method dependency** — Relying exclusively on weighted pipeline, or exclusively on inspection, creates systematic blind spots. Always triangulate.

## Metrics & KPIs

### Primary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Forecast Accuracy Score (FAS)** | Composite accuracy metric | ≥ 82% | Weighted formula (see above) |
| **Commit Accuracy** | % of committed deals that actually close | ≥ 85% | Deals closed / Deals committed |
| **Magnitude Accuracy** | Closeness of forecast to actual | ≥ 85% | `1 - |Forecast - Actual| / Actual` |
| **Pipeline Coverage Ratio** | Total weighted pipeline / Quota | 3-4x | Weighted pipeline / Quota target |
| **Close Rate by Stage** | Actual conversion rate at each stage | Within ±5% of base probability | Closes / Opportunities at stage |

### Secondary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Forecast Bias** | Systematic over/under prediction | ± 5% | Avg(Forecast - Actual) / Avg(Actual) |
| **Stale Deal Rate** | % of deals with no activity in 30+ days | < 10% | Stale deals / Total active deals |
| **Close Date Slippage** | % of deals with pushed close dates | < 25% | Slipped deals / Total deals |
| **New Deal Contribution** | % of revenue from deals created same quarter | 20-35% | New deal revenue / Total revenue |
| **Method Divergence** | Spread between 3 forecast methods | < 20% | (Max - Min) / Mean × 100 |
| **Pipeline Creation Rate** | New qualified opportunities per week | 8-15 | New Stage 4+ opportunities / Weeks |

### Quarterly Review Benchmarks

| KPI | Below Standard | Standard | Excellent |
|---|---|---|---|
| FAS | < 65% | 82-90% | > 93% |
| Commit Accuracy | < 65% | 80-90% | > 95% |
| Magnitude Accuracy | < 70% | 85-92% | > 95% |
| Pipeline Coverage | < 2.0x | 3.0-4.0x | > 5.0x |
| Forecast Bias | > ±15% | ±5-10% | < ±3% |
| Stale Deal Rate | > 20% | 8-15% | < 5% |

### Case Scenario: SaaS Company Q3 Forecast

**Context**: A B2B DevTools SaaS company forecasting $2.1M quota for Q3.

**Method 1 — Weighted Pipeline**: 42 open opportunities totaling $6.8M in value. After Judge's risk-adjusted probabilities, weighted total = $2.04M.

**Method 2 — Inspection-Based**: 8 Commit deals ($890K), 6 Best Case deals ($520K × 0.50 = $260K), 28 Pipeline deals ($5.39M × 0.10 = $539K). Total = $1.69M.

**Method 3 — Algorithmic**: Q2 actual = $1.85M. Q3 pipeline coverage = 3.2x. Historical conversion from this coverage = 31%. Pipeline × Conversion = $2.11M. Plus new deal contribution estimate: 12 new deals × $25K avg × 25% win rate = $75K. Total = $2.18M.

**Reconciliation**: Methods 1 ($2.04M) and 3 ($2.18M) agree within 7%. Method 2 ($1.69M) is the outlier, reflecting management's cautious inspection. Investigation reveals 2 Commit deals have slipped close dates — reclassify to Best Case. Adjusted Method 2: $1.52M.

**Consensus**: Weight Methods 1 and 3 equally, use Method 2 as floor. Forecast = $2.1M ± 12%. Board communication: "We expect $2.1M with 70% confidence range of $1.85M - $2.35M."

**Actual Q3 Result**: $2.04M. Forecast accuracy: 97.1%. The methodology worked because the weighted and algorithmic methods caught the optimism in the inspection method, and the reconciliation process produced a realistic consensus.

## Cross-References

- [Lead Qualification Frameworks](../domain/lead-qualification-frameworks.md) — MEDDIC, BANT, and other qualification frameworks used by Judge
- [ICP Design & Scoring Methodology](../domain/icp-design-scoring-methodology.md) — ICP scoring that informs deal qualification and probability
- [Data Enrichment Methodology](../domain/data-enrichment-methodology.md) — Forge's enrichment process ensuring pipeline data accuracy
- [Trigger Events Detection & Timing](../domain/trigger-events-detection-timing.md) — External signals that affect deal timing and forecast risk
- [Territory Planning Methodology](./territory-planning-methodology.md) — Territory design that affects quota allocation and pipeline coverage
- [Prospecting & Research Methodology](./prospecting-research-methodology.md) — Pipeline creation methods that feed forecast calculations
- [B2B Lead Generation Core Theory](../domain/b2b-lead-generation-core-theory.md) — The 7-stage funnel and stage-based conversion rates
- [Judge Agent Training](../agents/judge.md) — Deal scoring and risk assessment procedures
- [Flow Agent Training](../agents/flow.md) — Pipeline tracking and stage progression monitoring
- [Sage Agent Training](../agents/sage.md) — Competitive and market intelligence analysis
- [Atlas Agent Training](../agents/atlas.md) — Reconciliation and consensus forecast workflows
