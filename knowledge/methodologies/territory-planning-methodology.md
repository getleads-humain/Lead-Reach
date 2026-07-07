---
title: "Territory Planning Methodology — Data-Driven Sales Territory Design & Optimization"
category: methodology
grade: A
last_reviewed: "2026-07-03"
tags: [territory-planning, sales-territory, segmentation, account-mapping, TAM, quota-allocation, balance, optimization]
---

# Territory Planning Methodology — Data-Driven Sales Territory Design & Optimization

## Executive Summary

Territory planning is the architectural foundation of every scalable B2B sales organization. When done poorly, it creates coverage gaps where high-value accounts go untouched, overlap zones where multiple reps compete for the same deal, and imbalance where one territory carries 3x the quota of another. When done well, it ensures every dollar of addressable market has a clear owner, every rep has a fair shot at quota attainment, and every account receives consistent, knowledgeable engagement.

The LeadReach Territory Planning Methodology replaces the traditional "draw lines on a map" approach with a **quantitative, account-weighted, continuously optimized** framework. Instead of dividing geography equally — which ignores the reality that Manhattan contains 500x more B2B buyers than rural Wyoming — we divide by **account potential**, measured as a composite of estimated ARR, ICP fit, and accessibility. Territories are balanced not by headcount or square mileage but by **weighted pipeline opportunity**, ensuring each rep has an equitable path to quota.

This methodology covers the full lifecycle: initial territory design from TAM analysis, account assignment using weighted scoring, quota allocation based on territory potential, ongoing rebalancing triggered by market shifts, and integration with the LeadReach 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo). The result is a territory plan that is defensible, measurable, and dynamically responsive to market change — not a static spreadsheet that becomes obsolete within 60 days.

## Core Methodology

### The SHAPER Framework: Six Steps to Optimal Territory Design

SHAPER stands for **Segment, Heft, Assign, Partition, Equalize, Rebalance**. Each step produces a concrete, auditable output that feeds the next.

---

#### Step 1: Segment — Define Account Categories

Before assigning accounts, categorize every account in the TAM by type, size, and strategic importance. The segmentation model determines how territories are structured.

**The Three-Tier Account Segmentation Model:**

| Tier | Name | Criteria | Engagement Model | Territory Impact |
|---|---|---|---|---|
| **Tier 1 — Named** | Strategic / Enterprise | ARR potential ≥ $100K, ICP score ≥ 80 | 1:1 dedicated rep, custom sequences | Removed from geographic territories |
| **Tier 2 — Target** | Mid-Market / Growth | ARR potential $25K-$100K, ICP score ≥ 60 | 1:Few pooled model, semi-custom outreach | Assigned to geographic/vertical territories |
| **Tier 3 **|**Volume** | SMB / Long-Tail | ARR potential < $25K, ICP score ≥ 40 | 1:Many automated sequences, self-serve | SDR pooled, no territory assignment |

**Segmentation Dimensions:**

1. **Geographic** — Country, state/region, city/metro. Required for regulatory compliance (GDPR, data residency), language, and in-person meeting logistics.
2. **Vertical / Industry** — NAICS or custom vertical taxonomy. Critical for solution-fit and credibility (a rep selling to healthcare needs domain expertise).
3. **Size / Revenue Band** — ARR potential brackets. Drives engagement model and rep skill requirements.
4. **Product Line** — If the company sells multiple products, assign territories by product line where domain expertise matters.
5. **Customer vs. Prospect** — Existing customers (upsell/cross-sell) are typically assigned to the owning rep; net-new prospects follow territory rules.

**Segmentation Decision Tree:**

```
Is ARR potential ≥ $100K?
├── YES → Named Account (Tier 1)
│   └── Assign to dedicated Account Executive
│       ├── Is there a vertical specialist available?
│       │   ├── YES → Assign to vertical specialist
│       │   └── NO → Assign to geographic AE
│       └── Document assignment rationale
└── NO → Is ARR potential ≥ $25K?
    ├── YES → Target Account (Tier 2)
    │   └── Assign to geographic/vertical territory
    │       ├── Is vertical expertise critical?
    │       │   ├── YES → Assign to vertical territory
    │       │   └── NO → Assign to geographic territory
    │       └── Apply weighted balancing
    └── NO → Volume Account (Tier 3)
        └── Assign to SDR pool / automated sequences
```

---

#### Step 2: Heft — Calculate Account Weight

Every account must be assigned a **weight** representing its total potential value to the organization. This weight drives all downstream balancing decisions.

**Account Weight Formula:**

`Account Weight = (ARR_Potential × 0.40) + (ICP_Score_Normalized × 0.25) + (Accessibility_Score × 0.15) + (Expansion_Potential × 0.10) + (Strategic_Value × 0.10)`

| Factor | Weight | Source | Scoring |
|---|---|---|---|
| **ARR Potential** | 40% | Forge enrichment (revenue estimate, deal size modeling) | Actual or estimated annual contract value |
| **ICP Score (normalized)** | 25% | Judge scoring (5-dimension ICP rubric) | ICP score 0-100, normalized to 0-1 |
| **Accessibility Score** | 15% | Forge enrichment (contact availability, LinkedIn presence) | 0-1 scale based on decision-maker reachability |
| **Expansion Potential** | 10% | Sage analysis (product fit, cross-sell indicators) | 0-1 scale based on multi-product opportunity |
| **Strategic Value** | 10% | Manual override (reference-ability, brand value, partnership potential) | 0-1 scale based on strategic importance |

**Weight Normalization:**

Raw account weights must be normalized to a common scale for comparison. Apply min-max normalization:

`Normalized Weight = (Raw Weight - Min Weight) / (Max Weight - Min Weight) × 100`

After normalization, all accounts fall on a 0-100 scale where:
- 90-100: Anchor accounts (must be protected in rebalancing)
- 70-89: Core accounts (drive quota attainment)
- 40-69: Growth accounts (upside potential)
- 0-39: Long-tail accounts (fill pipeline volume)

---

#### Step 3: Assign — Match Accounts to Territory Structures

With accounts segmented and weighted, define the territory structure that will contain them.

**Territory Structure Models:**

| Model | Best For | Pros | Cons |
|---|---|---|---|
| **Geographic** | Companies with local presence requirements | Simple, intuitive, travel-efficient | Ignores vertical expertise; unbalanced by geography |
| **Vertical / Industry** | Deep domain solutions | Rep expertise, credible conversations | Ignores geography; requires national travel |
| **Hybrid Geo-Vertical** | Mid-size companies with vertical needs | Balances local presence with expertise | More complex to design and manage |
| **Account-Based** | Enterprise-focused (high ACV, low volume) | Maximum account focus | Requires large AE team; expensive |
| **Pod / Squad** | Fast-growing startups | Cross-functional alignment | Can fragment account ownership |

**Assignment Algorithm (Weighted Balancing):**

The goal is to create territories where the **sum of account weights is approximately equal** across all territories of the same type.

```
For each territory T:
  Target_Weight = (Total_Weight_of_All_Accounts) / (Number_of_Territories)
  Acceptable_Range = Target_Weight ± 10%

Assignment Rules:
1. Sort accounts by weight (descending)
2. For each account, assign to the territory with the lowest current total weight
3. After initial assignment, check balance:
   - If any territory exceeds Target_Weight + 10%, trigger rebalancing
   - If any territory falls below Target_Weight - 10%, trigger rebalancing
4. Rebalancing: Swap the lowest-weight account from the heaviest territory
   with the highest-weight account from the lightest territory
5. Repeat until all territories are within ±10% of Target_Weight
```

**Constraint Enforcement During Assignment:**

- **Geographic constraints**: Accounts must be in the territory's assigned region
- **Vertical constraints**: Accounts must match the territory's assigned vertical(s)
- **Existing relationships**: If a rep already owns an account, it stays unless there's a compelling reason to reassign
- **Competitive overlay**: Accounts with existing partner relationships may need special handling
- **Regulatory constraints**: Accounts in regulated industries (healthcare, finance) require certified reps

---

#### Step 4: Partition — Draw Territory Boundaries

With accounts assigned, formalize the territory boundaries in a way that is transparent, defensible, and easily communicated.

**Territory Documentation Requirements:**

Each territory must be documented with:

| Element | Description | Example |
|---|---|---|
| **Territory ID** | Unique identifier | "NA-EAST-FIN-03" |
| **Owner** | Assigned sales rep | "Jane Smith, Senior AE" |
| **Geography** | States/countries/regions | "NY, NJ, CT, MA" |
| **Vertical** | Primary industry focus | "Financial Services" |
| **Account Count** | Total accounts assigned | 47 |
| **Weighted Value** | Sum of account weights | 3,847 (normalized) |
| **Target Quota** | Annual revenue target | $1.2M ARR |
| **Named Accounts** | Tier 1 accounts (listed) | 5 accounts, $400K potential |
| **Target Accounts** | Tier 2 accounts (count) | 42 accounts, $800K potential |
| **Exclusions** | Accounts not in territory | Partner-managed, existing customers of X |

**Territory Map Visualization:**

Produce a visual territory map (using the LeadReach dashboard or external tools like Maptitude, Salesforce Maps, or Spreadsheets with mapping plugins) that shows:
- Geographic boundaries with color-coding by owner
- Account density heat map
- Weighted value distribution
- Coverage gaps (accounts with no territory assignment)

---

#### Step 5: Equalize — Balance and Fine-Tune

Initial assignment is never perfect. The equalization phase addresses imbalances through systematic adjustments.

**Balance Audit Checklist:**

| Dimension | Measure | Acceptable Variance | Action if Exceeded |
|---|---|---|---|
| **Weighted Value** | Sum of account weights per territory | ± 10% of mean | Swap accounts between territories |
| **Account Count** | Number of accounts per territory | ± 15% of mean | Adjust assignment algorithm weights |
| **Quota Attainability** | Historical close rate × weighted pipeline | ± 10% of mean | Adjust quota targets or account assignments |
| **Travel Burden** | Geographic spread of accounts | ± 20% of mean | Redraw geographic boundaries |
| **Vertical Mix** | Distribution of industry verticals | ± 15% of mean | Reassign vertical-specific accounts |
| **Pipeline Maturity** | Ratio of early-stage to late-stage pipeline | ± 15% of mean | Stagger account handoffs over time |

**Common Equalization Scenarios:**

1. **Urban concentration**: Metro areas have 10x the account density of rural areas. Solution: Carve metro areas as standalone territories and combine rural areas into larger geographic territories.
2. **Vertical pockets**: Healthcare is concentrated in Boston/NYC, Tech in SF/Seattle. Solution: Overlay vertical specialists onto geographic territories for high-density vertical pockets.
3. **Seasonal variance**: Some territories have cyclical buying patterns. Solution: Adjust quarterly quota distribution, not annual targets.
4. **New rep ramp**: A new rep cannot handle the same territory weight as a tenured rep. Solution: Apply a "ramp multiplier" — Year 1 reps carry 60% weight, Year 2 carry 80%, Year 3+ carry 100%.

---

#### Step 6: Rebalance — Continuous Optimization

Territory plans are not set-and-forget. They must be continuously monitored and periodically rebalanced.

**Rebalance Triggers:**

| Trigger | Threshold | Frequency |
|---|---|---|
| **Rep departure** | Immediate | As needed |
| **Rep addition** | Immediate (redistribute) | As needed |
| **Major account win/loss** | ≥ 20% territory value shift | As needed |
| **Market expansion** | New ICP segment identified | Quarterly review |
| **Quota attainment imbalance** | Variance > 20% across team for 2+ months | Monthly review |
| **Account data refresh** | Enrichment updates change account weights significantly | Quarterly |
| **Product launch** | New product creates new territory type | As needed |
| **Regulatory change** | New compliance requirements affect account ownership | As needed |

**Rebalance Rules:**

1. **Stability principle**: Don't move accounts unless the benefit outweighs the disruption cost. Every account move costs approximately 30 days of pipeline velocity as the new rep ramps.
2. **Customer continuity**: Existing customer accounts should not move reps unless the customer requests it or the rep is departing.
3. **Grace period**: After a rebalance, freeze territory changes for 60 days to allow pipeline to stabilize.
4. **Compensation protection**: If a rep loses accounts due to rebalancing, protect their variable comp for 90 days based on the moved accounts' pipeline.
5. **Change documentation**: Every rebalance must document what changed, why, and the expected impact on quota attainment.

## Implementation Guide

### For LeadReach Agents — Step-by-Step

**Step 1: Atlas — Territory Planning Initiation**
- Receive intent: "Design territories for 5 AEs covering US Financial Services"
- Classify as territory planning operation
- Decompose into: TAM definition, segmentation model, rep roster, constraint set
- Coordinate with Scout for TAM discovery and Forge for enrichment

**Step 2: Scout — TAM Discovery**
- Search for all companies matching the ICP within the specified geography
- Use multi-channel discovery (LinkedIn, Crunchbase, industry directories)
- Apply geographic and vertical filters
- Return raw account list with source citations

**Step 3: Forge — Account Enrichment**
- Enrich each account with firmographics, technographics, and people data
- Compute ARR potential estimates based on company size, vertical, and product fit
- Assess accessibility scores for decision-maker reachability
- Return enriched account profiles with all weight factors populated

**Step 4: Sage — Strategic Analysis**
- Analyze vertical concentrations and geographic clusters
- Identify anchor accounts that should be named (Tier 1)
- Assess competitive landscape per geography
- Recommend territory structure model (geographic, vertical, or hybrid)
- Return territory design recommendation with rationale

**Step 5: Judge — Weight Validation & Balance Scoring**
- Validate account weights against the 5-factor formula
- Run the assignment algorithm and check balance constraints
- Score territory balance on a 0-100 scale
- Flag any territory exceeding ±10% variance from target weight
- Return balanced territory assignments with audit trail

**Step 6: Flow — Territory Activation**
- Load territory assignments into CRM (Salesforce, HubSpot)
- Configure routing rules so inbound leads flow to correct territory owners
- Set up monitoring dashboards for territory health metrics
- Establish rebalance trigger alerts

**Step 7: Echo — Territory Reporting**
- Generate territory plan documentation (all 10 required elements per territory)
- Produce visual territory maps and account density charts
- Create balance audit report with variance analysis
- Archive plan for quarterly rebalance review

## Scoring Frameworks & Criteria

### Territory Health Score (THS)

The THS measures the overall quality and balance of a territory plan. A healthy territory plan enables consistent quota attainment across the team.

**Formula**: `THS = (Balance Score × 0.30) + (Coverage Score × 0.25) + (Potential Score × 0.25) + (Stability Score × 0.20)`

| Component | Calculation | Weight | Benchmark |
|---|---|---|---|
| **Balance Score** | `100 - (max_variance_pct × 2)` | 30% | ≥ 80 |
| **Coverage Score** | `% of TAM assigned to a territory` | 25% | ≥ 90 |
| **Potential Score** | `avg_quotable_pipeline / quota_target × 100` | 25% | ≥ 120 |
| **Stability Score** | `% of accounts with no assignment change in 90 days` | 20% | ≥ 85 |
| **THS (composite)** | Weighted sum | 100% | ≥ 75 |

### Territory Balance Variance Matrix

| Metric | Green (≤) | Yellow (≤) | Red (>) |
|---|---|---|---|
| Weighted value variance | 8% | 15% | 15% |
| Account count variance | 12% | 20% | 20% |
| Quota attainability variance | 10% | 18% | 18% |
| Geographic spread variance | 15% | 25% | 25% |

### Account Weight Distribution Targets

A well-designed territory plan should produce this distribution of account weights:

| Weight Band | % of Total Accounts | % of Total Weight | Territory Role |
|---|---|---|---|
| Anchor (90-100) | 5-10% | 25-35% | Quota backbone |
| Core (70-89) | 15-25% | 30-40% | Predictable revenue |
| Growth (40-69) | 30-40% | 20-30% | Pipeline upside |
| Long-tail (0-39) | 25-40% | 5-15% | Volume and discovery |

If the distribution is heavily skewed toward long-tail accounts, the territory lacks sufficient pipeline potential. If skewed toward anchor accounts, the territory is high-risk (loss of one account devastates the rep's year).

## LeadReach Agent Integration

### Atlas (Strategic Orchestrator)
- Decomposes territory planning requests into structured workflows
- Determines the appropriate segmentation model based on business context
- Coordinates multi-agent pipeline for TAM discovery through territory activation
- Manages rebalance trigger detection and escalation

### Scout (Discovery Specialist)
- Discovers all accounts matching the ICP within specified geography and vertical
- Identifies new market segments that should be included in territory expansion
- Monitors for new companies entering the TAM (trigger-event based)
- Provides geographic clustering data for territory boundary design

### Forge (Enrichment Engine)
- Enriches every account in the TAM with weight-factor data
- Computes ARR potential estimates and accessibility scores
- Maintains account data freshness for accurate weighting
- Detects weight changes that trigger rebalancing

### Sage (Research Analyst)
- Analyzes vertical concentrations and geographic market dynamics
- Recommends optimal territory structure model (geo, vertical, hybrid)
- Identifies strategic accounts requiring named-account treatment
- Provides competitive landscape analysis per territory

### Judge (Qualification Gatekeeper)
- Validates account weights and scores against the 5-factor formula
- Runs the balancing algorithm and checks variance constraints
- Scores overall territory health (THS)
- Audits rebalance proposals for compliance with stability principles

### Bard (Outreach Composer)
- Adapts outreach messaging to territory-specific context (vertical, geography)
- Creates territory-specific value propositions referencing local market conditions
- Generates personalized sequences for named accounts within territories

### Flow (Pipeline Orchestrator)
- Activates territory assignments in CRM with routing rules
- Ensures inbound leads auto-route to the correct territory owner
- Tracks territory-level pipeline metrics and stage progression
- Monitors for rebalance triggers and escalates to Atlas

### Echo (Reporting & Analytics)
- Generates territory health dashboards and balance reports
- Tracks quota attainment variance across territories
- Produces quarterly rebalance review documentation
- Archives historical territory plans for trend analysis

## Best Practices & Anti-Patterns

### Best Practices

1. **Weight by potential, not by count** — A territory with 200 SMB accounts is not equal to a territory with 20 enterprise accounts. Always balance by weighted value.
2. **Carve named accounts first** — Tier 1 accounts should be assigned individually before filling geographic territories with remaining accounts.
3. **Respect the ramp** — New reps should receive territories with lower weighted value (60-80% of tenured rep targets) for the first 12 months.
4. **Document the "why"** — Every territory boundary and account assignment should have a written rationale. When a rep questions their territory, the answer should be data-driven, not political.
5. **Rebalance quarterly, not monthly** — Frequent rebalancing destroys pipeline stability. Quarterly cycles with exception-based mid-quarter adjustments strike the right balance.
6. **Protect customer continuity** — Existing customer relationships should persist across rebalances unless the customer requests a change or the rep departs.
7. **Use hybrid models for scale** — Pure geographic territories break down above 10 reps. Pure vertical territories break down when reps must travel nationally. Hybrid geo-vertical models scale to 50+ reps.
8. **Build in buffer** — Each territory should have 120-150% of quota in weighted pipeline potential. Not every account will close; build in realistic conversion rates.
9. **Align territories with marketing** — Marketing campaigns (events, content, ads) should map to territory structure so that inbound leads flow to the correct owner automatically.
10. **Measure what matters** — Track territory health continuously, not just at design time. Set up dashboards that flag when any territory drifts out of balance.

### Anti-Patterns

1. **❌ Equal geography, unequal opportunity** — Dividing a country into equal-area territories ignores market density. Rural territories end up with 5 accounts; urban territories with 500.
2. **❌ Tenure-based territory assignment** — Giving the best territories to the most senior reps creates a death spiral: junior reps fail, quit, and the company can't develop new talent.
3. **❌ Annual-only rebalancing** — Markets change faster than annually. Companies get acquired, go bankrupt, or shift strategy. Quarterly rebalancing with exception triggers is the minimum.
4. **❌ Ignoring account weight changes** — An account's weight changes as it grows, hires, adopts new technology, or loses budget. Static weights produce stale territory plans within 90 days.
5. **❌ Over-indexing on current revenue** — Designing territories based only on existing customer revenue ignores greenfield opportunity. Always include prospect potential in the weight formula.
6. **❌ Territory hoarding** — Reps who protect large, under-worked territories waste account potential. Implement activity minimums: if a rep hasn't contacted a Tier 2 account in 90 days, it should be reassigned.
7. **❌ One-size-fits-all quotas** — Quotas should reflect territory potential. A territory with 80% of the team's weighted value should carry a proportionally higher quota, not the same flat number.
8. **❌ Skipping the balance audit** — After initial design, always run the THS scoring and variance analysis. Intuition about balance is notoriously unreliable.
9. **❌ No change management process** — Ad-hoc territory changes destroy trust. Every change should go through a documented process with approval, communication, and compensation protection.
10. **❌ Forgetting the long tail** — It's tempting to focus only on anchor accounts. But long-tail accounts are where tomorrow's enterprise customers come from. Ensure every territory has a healthy mix.

## Metrics & KPIs

### Primary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Territory Health Score (THS)** | Composite balance metric | ≥ 75 | Weighted formula (see above) |
| **Weighted Value Variance** | Max deviation from mean territory weight | ≤ 10% | `(max_weight - mean) / mean × 100` |
| **TAM Coverage Rate** | % of ICP-fit accounts assigned to a territory | ≥ 90% | Assigned accounts / Total ICP-fit accounts |
| **Quota Attainment Spread** | Standard deviation of quota attainment across reps | ≤ 15% | Std dev of individual quota attainment % |
| **Orphan Account Rate** | % of ICP-fit accounts with no territory owner | ≤ 5% | Unassigned accounts / Total ICP-fit accounts |

### Secondary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Territory Stability Index** | % of accounts unchanged in 90 days | ≥ 85% | Unchanged accounts / Total accounts |
| **Ramp Rep Quota %** | Year-1 rep quota vs. tenured rep quota | 60-80% | Ramp quota / Full quota |
| **Pipeline Coverage Ratio** | Weighted pipeline / Quota target per territory | 3-4x | Pipeline value / Quota |
| **Inbound Routing Accuracy** | % of inbound leads routed to correct territory | ≥ 95% | Correctly routed / Total inbound |
| **Account Activity Rate** | % of Tier 2 accounts contacted within 90 days | ≥ 80% | Contacted / Total Tier 2 |

### Quarterly Review Benchmarks

| KPI | Below Standard | Standard | Excellent |
|---|---|---|---|
| THS | < 60 | 75-85 | > 90 |
| Weighted Value Variance | > 20% | 8-15% | < 5% |
| TAM Coverage Rate | < 75% | 85-95% | > 97% |
| Quota Attainment Spread | > 25% | 10-18% | < 8% |
| Orphan Account Rate | > 10% | 3-7% | < 2% |
| Pipeline Coverage Ratio | < 2x | 3-4x | > 5x |

### Case Scenario: US FinTech Territory Design

**Context**: A B2B payments platform expanding from 3 to 8 AEs in the US.

**Step 1 — Segment**: 2,400 ICP-fit accounts identified. 18 qualify as Named (Tier 1, ARR ≥ $100K). 420 are Target (Tier 2). Remaining 1,962 are Volume (Tier 3).

**Step 2 — Heft**: Account weights calculated. Top 18 accounts (Named) range from 72-98 normalized weight. Target accounts range from 25-71. Volume accounts range from 3-24.

**Step 3 — Assign**: Named accounts assigned to 3 senior AEs (6 each). Remaining 5 AEs receive geographic territories for Target + Volume accounts. Hybrid geo-vertical model chosen: geographic territories with FinTech overlay.

**Step 4 — Partition**: 5 geographic territories created: Northeast, Southeast, Midwest, Mountain West, West Coast. Each territory documented with 10 required elements.

**Step 5 — Equalize**: Initial assignment showed West Coast at 142% of target weight (high FinTech density) and Midwest at 68%. Rebalanced by: (a) splitting West Coast into 2 territories, (b) merging Mountain West into Midwest, creating 6 territories instead of 5.

**Step 6 — Rebalance**: Set quarterly review. Trigger alerts configured for: any account weight changing > 20%, any rep departure, and any territory's pipeline coverage ratio dropping below 2.5x.

**Result**: THS score of 82. Weighted value variance of 7.3%. TAM coverage of 94%. Quota attainment spread of 11%.

## Cross-References

- [ICP Design & Scoring Methodology](../domain/icp-design-scoring-methodology.md) — ICP scoring used for account weight calculation and segmentation
- [Data Enrichment Methodology](../domain/data-enrichment-methodology.md) — Forge's enrichment process for populating account weight factors
- [Lead Qualification Frameworks](../domain/lead-qualification-frameworks.md) — BANT/MEDDIC frameworks for validating account potential estimates
- [Prospecting & Research Methodology](./prospecting-research-methodology.md) — TAM discovery and account identification methods
- [Forecasting Accuracy Methodology](./forecasting-accuracy-methodology.md) — Pipeline forecasting for quota-setting and territory potential estimation
- [B2B Lead Generation Core Theory](../domain/b2b-lead-generation-core-theory.md) — The 7-stage funnel and conversion benchmarks
- [Atlas Agent Training](../agents/atlas.md) — Orchestrator decision framework for territory planning workflows
- [Scout Agent Training](../agents/scout.md) — Discovery procedures for TAM identification
- [Forge Agent Training](../agents/forge.md) — Enrichment procedures for account weight data
- [Flow Agent Training](../agents/flow.md) — CRM integration and routing rule configuration
- [Data Sources Catalog](../tools/data-sources-catalog.md) — Available data sources for TAM discovery
