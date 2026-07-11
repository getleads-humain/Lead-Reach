---
title: Sales Analytics & Dashboards
category: sales-ops
grade: B
last_reviewed: 2026-07-10
tags: [sales-ops, operations, enablement, process]
---

# Sales Analytics & Dashboards

Sales analytics and dashboards transform raw pipeline and activity data into visual insights that drive decision-making at every level of the organization. Effective dashboard design follows the principle: right data, right person, right time, right action. Dashboard tiers include: executive dashboards ( ARR/MRR trends, NRR, CAC payback, forecast vs. actual — updated weekly), management dashboards (pipeline coverage, rep performance, stage conversion — updated daily), and rep dashboards (personal pipeline, activity metrics, quota progress — real-time). The most common dashboard mistakes include: metric overload (too many KPIs dilute focus), vanity metrics (activity without outcome correlation), and lack of actionability (data without clear next steps). Each dashboard metric should answer: what does this measure, what is the benchmark, what action should I take if it's off-track, and who is responsible. Key dashboard design principles include: progressive disclosure (summary first, drill-down on demand), exception-based highlighting (draw attention to metrics outside normal ranges), and comparison context (vs. target, vs. prior period, vs. benchmark). LeadReach agents contribute analytics data by: logging their activity and pipeline impact, tracking agent-specific performance metrics, and surfacing insights from their knowledge base queries and prospect interactions.

## Dashboard Architecture Principles

### The Five Principles of Effective Dashboard Design

Building dashboards that actually drive decisions — rather than just displaying data — requires disciplined adherence to architectural principles that prioritize clarity, actionability, and relevance over comprehensiveness and aesthetic complexity.

**Principle 1: Role-Based Relevance**. Every dashboard should be designed for a specific role with specific decisions to make. A CRO dashboard that shows 30 metrics is less useful than one that shows 7 metrics that directly answer the question "Are we on track?" The role-based principle ensures that each viewer sees exactly what they need — nothing more, nothing less. This prevents the common anti-pattern of the "universal dashboard" that tries to serve everyone and ends up serving no one well.

**Principle 2: Progressive Disclosure**. Information should be layered: the highest-level summary is visible first, with the ability to drill into progressively more detail on demand. The CRO sees ARR trend and forecast accuracy at a glance; clicking on ARR trend reveals the waterfall; clicking on a waterfall component reveals the underlying deals. This layering prevents information overload while ensuring that detailed data is available when needed for diagnosis.

**Principle 3: Exception-Based Highlighting**. Dashboards should draw attention to metrics that are outside normal ranges — behind target, below benchmark, or deviating from trend. The human eye is drawn to color and contrast, not to tables of numbers. Effective highlighting uses a consistent visual language: green (on/above target), yellow (watch — approaching threshold), red (action required — below threshold). The key discipline is limiting red to truly actionable items; if everything is red, nothing is red.

**Principle 4: Comparison Context**. No metric has meaning in isolation. Every number should be presented in context: vs. target (are we on plan?), vs. prior period (are we improving?), vs. benchmark (are we competitive?). A $5M pipeline number means very different things if the target is $4M (ahead) vs. $8M (behind), if last quarter's pipeline was $3M (growing) vs. $7M (shrinking), or if the industry benchmark for comparable companies is $6M (below average).

**Principle 5: Actionability**. Every metric on a dashboard should have a defined action framework: what to do if it's on track, what to do if it's approaching a threshold, and what to do if it's breached a threshold. If no clear action exists for a metric's off-track state, the metric doesn't belong on the dashboard. This principle eliminates "interesting but not actionable" metrics that consume attention without driving decisions.

### Data Flow Architecture

The analytics data flow architecture determines how data moves from source systems to dashboard surfaces and ensures that dashboards are both timely and reliable:

```
Source Systems → Data Ingestion → Data Warehouse → Transformation → Semantic Layer → BI/Dashboard → End User
(CRM, MAP,     (Fivetran,       (Snowflake,     (dbt models,     (Looker/       (Looker,      (CRO, VP,
 CS, Product,    Segment,         BigQuery)       business logic,  LookML,        Tableau,      Manager,
 Finance)        Airbyte)                         data quality)    metric defs)   Mode)         IC)
```

Each layer serves a specific purpose and has clear ownership:

| Layer | Purpose | Owner | Key Design Decisions |
|---|---|---|---|
| Source Systems | Capture operational data | Functional teams | Data entry standards, field definitions |
| Data Ingestion | Extract and load raw data | RevOps Engineering | Incremental vs. full load, sync frequency |
| Data Warehouse | Store and organize data | RevOps Engineering | Schema design, partitioning, clustering |
| Transformation | Apply business logic and create analytics-ready datasets | RevOps Analytics | Metric definitions, join logic, data quality checks |
| Semantic Layer | Define consistent metric calculations | RevOps Analytics | Dimensional model, measure definitions, access controls |
| BI/Dashboard | Visualize and deliver insights | RevOps Analytics + Stakeholders | Chart types, filters, drill paths, alerting |
| End User | Consume insights and take action | Revenue teams | Dashboard adoption, interpretation, action taking |

### Real-Time vs. Batch Processing

Not all dashboards require the same data freshness. Matching processing mode to business need prevents both under-investment (stale data where real-time is needed) and over-investment (real-time infrastructure where daily is sufficient):

| Dashboard Type | Data Freshness | Processing Mode | Rationale |
|---|---|---|---|
| Rep activity dashboard | Real-time (minutes) | Streaming / CRM native | Reps need immediate visibility into their own progress and next actions |
| Pipeline health dashboard | Near-real-time (1-4 hours) | Micro-batch | Managers need current pipeline state for coaching and deal strategy |
| Forecast dashboard | Daily | Batch (overnight) | Forecasts change meaningfully on a daily cadence, not hourly |
| Executive dashboard | Weekly | Batch (weekend) | Executive decisions operate on weekly/monthly cadences |
| Cohort analysis | Monthly | Batch (month-end) | Trend analysis requires complete period data to be meaningful |
| Board reporting | Quarterly | Batch (quarter-end) | Board materials require fully reconciled, audited data |

The cost and complexity of real-time processing is 3-5x higher than batch processing. Only invest in real-time infrastructure for dashboards where the action triggered by the data is time-sensitive enough to justify the cost. For most sales analytics, daily batch processing strikes the right balance between freshness and cost.

## KPI Hierarchies by Role

### CRO / CEO Dashboard (Board-Level View)

The CRO dashboard answers one question: "Are we growing efficiently and predictably?" It contains 5-7 metrics, each with target, trend, and alert thresholds:

| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| ARR Trend | Line chart (monthly, trailing 12 months) | Vs. plan, vs. prior year | Any month >10% below plan |
| Net Revenue Retention | Single value + trend sparkline | Vs. 110% benchmark | Below 100% (net churn territory) |
| CAC Payback Period | Single value + trend bar | Vs. 12-18 month target | >24 months |
| Pipeline Coverage | Gauge chart (current vs. target) | By quarter | Below 2.5x at Q-start |
| Forecast Accuracy | Bar chart (forecast vs. actual by quarter) | Rolling 4 quarters | Miss >10% in any quarter |
| Rule of 40 | Scatter plot (growth rate vs. margin) | Vs. 40% threshold | Below 20% |
| Revenue Waterfall | Waterfall chart (quarterly) | Current quarter components | Pipeline creation below consumption |

**Executive Summary Design**: The CRO dashboard should open with an "executive summary" panel that provides a one-sentence assessment of revenue health: "Q3 is on track with 98% forecast confidence, but Q4 pipeline coverage is 2.1x — below the 2.5x target. Action: accelerate pipeline generation in mid-market segment." This summary is generated by LeadReach Echo based on real-time analysis of all underlying metrics.

### VP Sales Dashboard (Functional View)

The VP Sales dashboard answers: "Is my team performing at the level required to hit the CRO's targets?" It contains 10-15 metrics organized into three sections:

**Pipeline Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Pipeline by Stage | Funnel chart (value + count) | Vs. prior quarter | Any stage <60% of prior Q value |
| Pipeline Creation | Bar chart (weekly, trailing 13 weeks) | Vs. weekly creation target | 3+ consecutive weeks below target |
| Pipeline Velocity | Single value + trend | Vs. benchmark | 15%+ below benchmark |
| Pipeline Coverage by Rep | Heatmap (rep × quarter) | Vs. 3x target | Any rep below 2x for current quarter |

**Performance Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Win Rate by Segment | Grouped bar chart (segment × quarter) | Vs. benchmark | Any segment <15% win rate |
| Average Deal Size | Box plot (distribution by segment) | Vs. target | Median below target by >20% |
| Sales Cycle Length | Histogram (days to close) | Vs. benchmark | P75 >2x benchmark |
| Rep Quota Attainment | Dot plot (each rep vs. quota) | Vs. 100% target | <50% of reps above 80% |

**Activity Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Activity Volume by Rep | Stacked bar (calls, emails, meetings) | Vs. activity model | Any rep <50% of model |
| Stage Progression Rate | Line chart (weekly deals advancing) | Vs. prior quarter | Declining trend 3+ weeks |
| Forecast vs. Actual (Rolling) | Dual-axis line chart | By quarter | Gap >15% in either direction |

### Sales Manager Dashboard (Team View)

The sales manager dashboard bridges strategy and execution, answering: "Which deals and reps need my attention this week?" It contains 12-15 metrics with strong emphasis on exception-based alerting:

**Deal Review Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| At-Risk Deals | Table (deal name, stage, risk factors, days in stage) | Vs. stage benchmarks | Any deal >1.5x median stage duration |
| Stalled Deals | Table (deals with no activity >7 days) | None — zero tolerance | Any deal with no next step within 7 days |
| Close Date Changes | Table (deals with pushed close dates) | Count vs. prior week | >3 pushes per rep in a week |
| Large Deal Tracker | Card layout (top 5 deals by value) | Stage, next step, risk | Any deal >$100K with no activity in 7 days |

**Rep Management Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Rep Pipeline Health | Stacked bar (per rep: commit, best-case, pipeline) | Vs. quota | Commit <60% of quota |
| Rep Activity Compliance | Scorecard (calls, emails, meetings vs. model) | Vs. activity model | Any metric <60% for 2+ weeks |
| Rep Forecast Accuracy | Bar chart (predicted vs. actual, last 3 months) | ±10% target | Rep consistently over/under by >20% |
| Coaching Opportunities | List (deals where manager involvement could help) | Based on deal risk + rep capacity | New opportunities surfaced daily |

**Team Pipeline Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Weekly Pipeline Movement | Sankey diagram (stage flow) | Vs. prior week | Net backward movement |
| Pipeline by Source | Pie chart (inbound, outbound, partner, LeadReach Flow) | Vs. source targets | Any source below 50% of target |
| Conversion Rate Funnel | Funnel (stage-to-stage rates) | Vs. benchmarks | Any rate 15%+ below benchmark |

### AE / Rep Dashboard (Individual View)

The AE dashboard answers: "What should I do today to hit my number?" It is the most real-time, action-oriented dashboard and is often embedded directly in the CRM interface:

**My Pipeline Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Quota Progress | Gauge (closed + commit vs. quota) | Vs. quota + time elapsed | Behind pace by >15% |
| Pipeline by Stage | Horizontal bar (my pipeline) | Vs. coverage target | Coverage below 3x |
| Next Steps Due Today | Checklist (deal + next step + due date) | None — action list | Any overdue next steps |
| Deals Needing Update | List (deals with stale close dates or no recent activity) | None — action list | Any deal with activity gap >5 days |

**My Activity Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Activity This Week | Stacked bar (calls, emails, meetings, proposals) | Vs. weekly model | Below 70% of model by mid-week |
| Response Rates | Line chart (email open, reply, meeting booked rates) | Trailing 4 weeks | Reply rate <3% |
| Meeting Pipeline | List (upcoming meetings with prep links) | Next 7 days | No meetings scheduled in next 3 days |

**My Forecast Section**:
| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Commit Deals | Card (total value + deal count) | Self-identified commit | — |
| Best-Case Deals | Card (total value + deal count) | Self-identified upside | — |
| Pipeline Deals | Card (total value + deal count) | Everything else | — |
| Weighted Forecast | Single value (weighted pipeline) | Vs. quota | Weighted forecast <80% of quota |

### SDR / BDR Dashboard (Activity View)

The SDR dashboard is the most real-time and activity-intensive, reflecting the SDR's metrics-driven workflow:

| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Daily Activity Progress | Gauge (calls, emails, social touches vs. daily target) | Vs. daily model | Below 50% by 2PM |
| Response Rate (Rolling 7-Day) | Line chart | Vs. 5-15% benchmark | Below 3% |
| Meetings Set This Week | Card + list | Vs. weekly target | Below pace by mid-week |
| Lead Queue Depth | Single value + list | Uncontacted leads | Queue >SLA age |
| LeadReach Flow-Assisted Pipeline | Card (meetings from Flow-sourced leads) | Vs. target | — |
| Sequence Performance | Table (sequence name, sent, replied, met) | By sequence | Any sequence <2% reply rate |

### CSM Dashboard (Customer Health View)

The CSM dashboard answers: "Which accounts need my attention, and where are expansion opportunities?"

| Metric | Visualization | Context | Alert Rule |
|---|---|---|---|
| Portfolio Health Score | Stacked bar (green/amber/red account count) | Target: 70%+ green | Any strategic account turning red |
| At-Risk Accounts | Table (account, health score, risk factors, last contact) | Vs. intervention threshold | Health score <40 |
| Renewal Calendar | Timeline (upcoming renewals by month) | 120-day advance warning | Renewal within 90 days with health <70 |
| Expansion Pipeline | Card (value + count) | Vs. expansion target | No expansion pipeline for >30 days |
| Adoption Metrics | Heatmap (feature usage by account) | Vs. onboarding milestones | Key feature adoption <50% |
| QBR Status | Checklist (completed/past due by account) | Quarterly cadence | Strategic account QBR overdue |

## 15+ Dashboard Templates with Metric Definitions and Thresholds

### Template 1: Executive Revenue Summary

**Purpose**: One-page board-ready view of revenue health
**Audience**: CRO, CEO, Board of Directors
**Refresh**: Weekly (weekend batch)
**Layout**: Single page, 4 quadrants

| Quadrant | Content | Metrics |
|---|---|---|
| Top-Left: ARR Performance | ARR trend line + current value | ARR, ARR growth %, ARR vs. plan |
| Top-Right: Pipeline Health | Pipeline coverage gauge + creation trend | Pipeline coverage ratio, creation rate, consumption rate |
| Bottom-Left: Unit Economics | CAC, LTV, payback period | CAC payback, LTV:CAC, gross margin |
| Bottom-Right: Forecast | Forecast vs. actual by quarter | Commit, best-case, pipeline, accuracy % |

**Thresholds**:
- ARR growth: Green ≥25%, Yellow 15-25%, Red <15%
- Pipeline coverage: Green ≥3x, Yellow 2-3x, Red <2x
- CAC payback: Green ≤12mo, Yellow 12-18mo, Red >18mo
- Forecast accuracy: Green ±5%, Yellow 5-10%, Red >10%

### Template 2: Pipeline Health Dashboard

**Purpose**: Comprehensive pipeline analysis for operational decision-making
**Audience**: VP Sales, Sales Managers, RevOps
**Refresh**: Daily (overnight batch)

**Key Metrics**:

| Metric | Calculation | Target | Red Threshold |
|---|---|---|---|
| Total Open Pipeline | Sum of all open opportunity ARR | 3-4x next quarter quota | <2.5x |
| Pipeline by Stage | Sum of ARR per stage | Balanced distribution (no stage >40%) | Any stage >50% |
| Pipeline Aging | Days in current stage by deal | <1.5x median per stage | >2x median |
| Pipeline Creation Rate | New pipeline ARR added per week | Per creation model | 3+ weeks below model |
| Pipeline Conversion Rate | % of pipeline that converts to closed-won per quarter | 25-35% (enterprise) | <20% |
| Pipeline Velocity | (Deals × Win Rate × Avg Deal) / Cycle Length | Trending up | Declining 2+ quarters |
| Pipeline Source Mix | % pipeline from each source | Per channel targets | Single source >60% |

**Drill-Down Paths**: Each metric drills to: by segment, by rep, by region, by source, by product line.

### Template 3: Forecast Accuracy Board

**Purpose**: Track and improve forecast accuracy over time
**Audience**: CRO, VP Sales, RevOps, Finance
**Refresh**: Weekly

**Key Metrics**:

| Metric | Calculation | Target | Red Threshold |
|---|---|---|---|
| Weekly Forecast Accuracy | (Actual - Forecast) / Actual | ±5% | >10% miss |
| Rep Forecast Calibration | Individual rep accuracy over rolling 3 quarters | ±10% per rep | >20% consistent miss |
| Commit Accuracy | % of commit deals that actually close | ≥85% | <70% |
| Best-Case Accuracy | % of best-case that closes within quarter | ≥40% | <25% |
| Forecast Category Distribution | Split of commit/best-case/pipeline | Healthy mix | >80% in pipeline category |
| Close Date Adherence | % of deals closing within ±1 week of forecast date | ≥70% | <50% |

### Template 4: Rep Performance Scorecard

**Purpose**: Compare and coach individual rep performance
**Audience**: Sales Managers, VP Sales
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Benchmark | Alert |
|---|---|---|---|
| Quota Attainment | Closed ARR / Quota | 100% | <65% at mid-quarter |
| Pipeline Coverage | Weighted pipeline / Remaining quota | 3x+ | <2x |
| Win Rate | Closed-Won / Total Closed | 25-35% | <18% |
| Average Deal Size | Mean Closed-Won ARR | Segment benchmark | <70% of benchmark |
| Sales Cycle | Median days from creation to close | Segment benchmark | >1.5x benchmark |
| Activity Volume | Calls + emails + meetings per week | Activity model | <60% of model |
| CRM Compliance | % of required fields populated | 90%+ | <75% |
| Forecast Accuracy | Rep's forecast vs. actual | ±10% | >20% miss direction |

### Template 5: Activity Metrics Dashboard

**Purpose**: Monitor leading indicators of pipeline and revenue
**Audience**: Sales Managers, SDR Managers, RevOps
**Refresh**: Real-time (CRM native)

**Key Metrics**:

| Metric | Calculation | Daily Target (AE) | Daily Target (SDR) |
|---|---|---|---|
| Calls Made | Outbound calls logged | 8-12 | 40-60 |
| Emails Sent | Outbound emails logged | 15-25 | 50-80 |
| Meetings Held | Completed meetings | 2-4 | 4-8 |
| Proposals Sent | Proposals/quotes generated | 0.5-1 | — |
| Discovery Calls | First meetings with new prospects | 1-2 | 3-6 |
| Next Steps Created | Deals with next step activity | 5+ | — |

### Template 6: Cohort Analysis Dashboard

**Purpose**: Understand how different customer cohorts perform over time
**Audience**: CRO, VP CS, RevOps, Finance
**Refresh**: Monthly

**Cohort Dimensions**:
- Vintage cohort (closed-won month/quarter)
- Segment cohort (enterprise, mid-market, SMB)
- Source cohort (inbound, outbound, partner, PLG, LeadReach Flow)
- Geography cohort (region/country)
- Product cohort (product line/edition)

**Key Metrics by Cohort**:

| Metric | Calculation | Purpose |
|---|---|---|
| Retention Curve | % of original ARR retained at month N | Compare cohort quality over time |
| Expansion Curve | Cumulative expansion ARR by month N | Identify high-expansion cohorts |
| NRR at Month 12 | Net revenue retention at 12 months | Compare long-term value by cohort |
| Time to First Value | Days from closed-won to first adoption milestone | Identify onboarding effectiveness |
| Gross Churn Rate | % of original ARR lost by month N | Compare retention by acquisition source |

### Template 7: Deal Velocity Dashboard

**Purpose**: Identify bottlenecks and acceleration opportunities in the sales cycle
**Audience**: VP Sales, Sales Managers, RevOps
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Benchmark | Alert |
|---|---|---|---|
| Average Days per Stage | Median days in each pipeline stage | Per stage benchmark | >1.5x benchmark |
| Stage Conversion Rate | % of deals advancing from each stage | Per stage benchmark | 15%+ below benchmark |
| Velocity Index | (Win Rate × Deal Size) / Cycle Length | Trending up | Declining 2+ months |
| Fast-Path Analysis | Characteristics of deals closing in <50% of avg cycle | Identify patterns | — |
| Slow-Path Analysis | Characteristics of deals exceeding 1.5x avg cycle | Identify drag factors | — |

### Template 8: Source Attribution Dashboard

**Purpose**: Measure ROI of pipeline generation channels
**Audience**: CMO, VP Sales, RevOps, Demand Gen
**Refresh**: Weekly

**Key Metrics**:

| Metric | Calculation | Purpose |
|---|---|---|
| Pipeline by Source | ARR of open opportunities by lead source | Channel contribution |
| Closed-Won by Source | ARR of won deals by lead source | Channel ROI |
| Cost per Pipeline Dollar | Channel spend / Pipeline generated | Efficiency comparison |
| Source Conversion Rate | % of sourced leads converting to pipeline | Quality comparison |
| LeadReach Flow Contribution | Pipeline + closed-won from Flow-sourced leads | Agent ROI |
| Source Velocity | Average cycle length by source | Speed-to-revenue comparison |

### Template 9: Customer Health Dashboard

**Purpose**: Proactive monitoring of account health for retention and expansion
**Audience**: VP CS, CSMs, RevOps
**Refresh**: Daily

**Health Score Components**:

| Component | Weight | Data Sources | Score Logic |
|---|---|---|---|
| Product Usage | 30% | Product analytics (Pendo, Amplitude) | Active users / licensed users, feature adoption depth |
| Support Health | 20% | Help desk (Zendesk, Intercom) | Ticket volume trend, CSAT, escalation rate |
| Engagement | 20% | CRM + email + community | Meeting cadence, QBR completion, NPS, community participation |
| Relationship | 15% | CRM + LinkedIn | Number of contacts, exec sponsor engagement, multi-threading |
| Commercial | 15% | CRM + billing | Contract terms, payment history, expansion history, upcoming renewal |

**Health Score Thresholds**: Green (70-100), Yellow (40-69), Red (0-39)

### Template 10: Win/Loss Analysis Dashboard

**Purpose**: Understand why deals are won and lost to improve sales effectiveness
**Audience**: VP Sales, Sales Enablement, Product Marketing, RevOps
**Refresh**: Weekly

**Key Metrics**:

| Metric | Calculation | Purpose |
|---|---|---|
| Win Rate by Competitor | % deals won vs. specific competitors | Competitive positioning |
| Win Rate by Deal Size | Win rate segmented by deal size | Optimal deal sizing |
| Loss Reason Distribution | % of losses by reason (price, features, timing, no decision, competitor) | Improvement areas |
| Win Drivers | Most common factors in won deals | Reinforce winning behaviors |
| Close Plan Completion | % of close plan milestones completed in won vs. lost deals | Process compliance impact |

### Template 11: Territory & Quota Dashboard

**Purpose**: Monitor quota attainment and territory balance
**Audience**: VP Sales, Sales Managers, RevOps
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Purpose |
|---|---|---|
| Quota Attainment by Rep | Closed / Quota per rep | Individual performance |
| Territory Coverage | Pipeline / Quota per territory | Territory balance |
| Quota Distribution | Std dev of quota attainment across reps | Fairness of quota allocation |
| Territory Whitespace | TAM - Booked ARR per territory | Growth opportunity |
| Ramp Rep Performance | Attainment by months-in-role | Onboarding effectiveness |

### Template 12: SDR/BDR Performance Dashboard

**Purpose**: Monitor and optimize outbound development team performance
**Audience**: SDR Manager, VP Sales, RevOps
**Refresh**: Real-time

**Key Metrics**:

| Metric | Calculation | Target | Alert |
|---|---|---|---|
| Daily Activity Volume | Calls + emails + social touches | 80-100/day | <50/day |
| Response Rate | Replies / Outbound touches | 5-15% | <3% |
| Meeting Set Rate | Meetings / Conversations | 25-35% | <20% |
| SQL Conversion | SQLs / Meetings | 40-60% | <30% |
| Pipeline Sourced | ARR from SDR-sourced opportunities | Per target | <50% of target |
| Lead Response Time | Minutes from lead assignment to first touch | <5 minutes | >30 minutes |
| LeadReach Flow-Assisted Meetings | Meetings where Flow provided account intel | Per target | — |

### Template 13: Compensation & Earnings Dashboard

**Purpose**: Transparency into comp calculations and earnings trajectory
**Audience**: AEs, Sales Managers, RevOps, Finance
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Purpose |
|---|---|---|
| YTD Earnings | Base + commission earned to date | Rep visibility |
| Commission Run Rate | Projected annual earnings based on current pace | Motivation |
| Accelerator Status | Current position vs. accelerator thresholds | Incentive alignment |
| Deal Credit | Credited ARR per deal (splits, overlays) | Fairness |
| Clawback Exposure | Churned deals that may trigger clawback | Risk awareness |

### Template 14: Pipeline Waterfall Dashboard

**Purpose**: Understand the mechanics of pipeline movement period-over-period
**Audience**: CRO, VP Sales, RevOps
**Refresh**: Weekly

**Waterfall Components**:

| Component | Calculation | Visual |
|---|---|---|
| Opening Pipeline | Total open pipeline at start of period | Starting bar |
| New Pipeline Added | Value of newly created opportunities | Upward waterfall segment |
| Pulled In | Value of deals with close dates moved into current period | Upward waterfall segment |
| Pushed Out | Value of deals with close dates moved to future periods | Downward waterfall segment |
| Closed-Won | Value of deals won in the period | Downward waterfall segment |
| Closed-Lost | Value of deals lost in the period | Downward waterfall segment |
| Closing Pipeline | Total open pipeline at end of period | Ending bar |

### Template 15: Product-Led Growth (PLG) Dashboard

**Purpose**: Track free-to-paid conversion and product-led revenue motions
**Audience**: VP Growth, VP Sales, RevOps, Product
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Target | Alert |
|---|---|---|---|
| Free Trial Signups | New signups per week | Per growth model | 20%+ below model |
| Activation Rate | % of signups reaching "aha moment" | 30-50% | <20% |
| Free-to-Paid Conversion | % of trials converting to paid | 2-8% (self-serve), 15-25% (sales-assisted) | Below benchmarks |
| Time to Convert | Days from signup to paid | 14-30 days | >45 days |
| Expansion from PLG | Upsell ARR from PLG-originated accounts | Trending up | — |

### Template 16: RevOps Operational Health Dashboard

**Purpose**: Monitor the health and performance of RevOps processes and systems
**Audience**: RevOps Team, CRO
**Refresh**: Daily

**Key Metrics**:

| Metric | Calculation | Target | Alert |
|---|---|---|---|
| CRM Data Quality Score | % of required fields populated on key objects | ≥90% | <80% |
| SLA Compliance | % of SLAs met (lead response, handoff, deal desk) | ≥95% | <85% |
| Integration Health | Sync success rate across all integrations | ≥99% | <95% |
| Dashboard Adoption | Weekly active users per dashboard | 80%+ of target audience | <50% |
| Automation Uptime | % of automated workflows running successfully | ≥99% | <95% |
| Lead Routing Accuracy | % of leads routed to correct rep on first attempt | ≥95% | <85% |
| LeadReach Agent Performance | Flow meetings set, Echo insights generated, Judge accuracy | Per agent KPIs | Below KPI thresholds |

## Data Source Mapping

### Source System to Dashboard Metric Mapping

Every dashboard metric should be traceable to its source system(s), ensuring data lineage is documented and auditable:

| Dashboard Metric | Primary Source | Secondary Source | Transformation Logic | Refresh Frequency |
|---|---|---|---|---|
| ARR | CRM (Opportunity) | Billing (Stripe/NetSuite) | CRM for bookings, billing for recognized revenue; reconcile monthly | Daily (CRM), Monthly (billing) |
| Pipeline Value | CRM (Opportunity) | — | Sum of open opportunity ARR by stage | Daily |
| Win Rate | CRM (Opportunity) | — | Closed-Won / (Closed-Won + Closed-Lost) | Daily |
| CAC | CRM + Marketing Automation | Finance (spend data) | Total marketing + sales spend / new customers acquired | Monthly |
| NRR | CRM + Billing | — | (Beginning ARR + Expansion - Contraction - Churn) / Beginning ARR | Monthly |
| Health Score | Product Analytics + CRM + Support | CS Platform | Weighted composite of 5 components (see Template 9) | Daily |
| Activity Volume | CRM (Activity) + Sales Engagement | Conversation Intelligence | Deduplicated across sources | Real-time |
| Forecast | CRM (Opportunity) + Rep Input | LeadReach Judge | Rep categorization + AI validation | Weekly |
| Lead Response Time | CRM (Task/Activity) | Sales Engagement | Timestamp difference: assignment → first touch | Real-time |
| LeadReach Flow Pipeline | CRM (Opportunity) | LeadReach Agent Logs | Opportunities where Flow was source or influencer | Daily |

### Data Quality Monitoring by Source

Each data source requires quality monitoring to ensure dashboard reliability:

| Source | Quality Dimensions Monitored | Key Quality Checks | Escalation |
|---|---|---|---|
| CRM | Completeness, accuracy, timeliness | Required field completion, stage validation, close date realism | RevOps admin + manager escalation |
| Marketing Automation | Completeness, consistency | Lead score accuracy, campaign attribution, form data completeness | Marketing ops review |
| CS Platform | Consistency, timeliness | Health score recalculation, play completion, survey response rates | CS ops review |
| Product Analytics | Accuracy, completeness | Event tracking coverage, user identification accuracy | Product analytics team |
| Financial Systems | Accuracy, timeliness | Revenue recognition rules, invoice reconciliation | Finance review |
| LeadReach Agent Logs | Completeness, accuracy | Activity logging completeness, attribution accuracy, API sync status | RevOps automated + manual review |

## Alerting Rules & Escalation Framework

### Alert Design Principles

Effective alerting follows the Goldilocks principle: too few alerts and critical issues go unnoticed; too many alerts and people develop "alert fatigue" and ignore everything. The alert framework is structured in three tiers:

**Tier 1 — Critical Alerts (Immediate Action)**:
- Delivery method: SMS + Slack (direct message) + email
- Response SLA: Acknowledgment within 30 minutes, action within 2 hours
- Examples: ARR forecast miss >15%, strategic account health turning red, CRM integration failure affecting forecast data, lead SLA breach on named accounts

**Tier 2 — Warning Alerts (Same-Day Action)**:
- Delivery method: Slack channel post + email digest
- Response SLA: Review within 4 hours, action within 24 hours
- Examples: Pipeline coverage dropping below 2.5x, rep activity below 50% of model, close date pushes exceeding threshold, data quality score below 80%

**Tier 3 — Informational Alerts (Weekly Review)**:
- Delivery method: Weekly digest email + dashboard annotation
- Response SLA: Review during weekly cadence
- Examples: Trend changes (pipeline creation rate declining 3+ weeks), benchmark deviations (win rate 10% below benchmark), cohort anomalies (recent vintage underperforming)

### Alert Rule Catalog

| Alert Name | Condition | Tier | Owner | Action |
|---|---|---|---|---|
| ARR Forecast Miss | Projected ARR >10% below quarterly plan | Critical | CRO | Emergency pipeline review, deal acceleration initiatives |
| Strategic Account Risk | Health score drops to red for strategic account | Critical | VP CS | Immediate CSM escalation, exec sponsor engagement |
| Pipeline Coverage Drop | Coverage ratio <2x for current quarter | Critical | VP Sales | Accelerate pipeline generation, activate nurture campaigns |
| Lead SLA Breach | MQL uncontacted >SLA window | Warning | SDR Manager | Reassign lead, coach SDR on response time |
| Stale Pipeline | Deals >2x median stage duration with no activity | Warning | Sales Manager | Review deal viability, push or close |
| Data Quality Decline | CRM required field completion <80% | Warning | RevOps | Targeted data quality sprint, manager communication |
| Rep Activity Below Model | Any rep <50% of activity model for 2+ weeks | Warning | Sales Manager | 1:1 coaching, activity plan |
| Win Rate Trend Down | Win rate declining 3+ consecutive months | Informational | VP Sales | Competitive analysis, deal review deep-dive |
| Cohort Underperformance | Recent vintage NRR >10% below prior vintage | Informational | VP CS | Onboarding analysis, ICP review |
| Agent Performance | LeadReach agent metrics below KPI thresholds | Warning | RevOps | Agent configuration review, data input quality check |

## Visualization Best Practices

### Chart Type Selection Guide

Selecting the right visualization is critical for effective communication. The wrong chart type can obscure insights or, worse, mislead:

| Question Type | Best Chart Type | When to Use | Avoid When |
|---|---|---|---|
| How much? | Bar chart | Comparing discrete categories (revenue by segment) | Too many categories (>10) |
| How has it changed? | Line chart | Showing trends over time (ARR over 12 months) | Too few data points (<5) |
| What's the composition? | Stacked bar or waterfall | Showing parts of a whole (pipeline waterfall) | Need to compare component sizes precisely |
| How does it distribute? | Histogram or box plot | Showing value distribution (deal size distribution) | Categorical data |
| How do two variables relate? | Scatter plot | Showing correlation (activity vs. pipeline) | Too few data points or no expected relationship |
| What's the flow? | Funnel or Sankey | Showing stage progression (pipeline funnel) | Non-sequential data |
| Are we on track? | Gauge or bullet chart | Comparing actual to target (quota attainment) | No clear target exists |
| Where should I focus? | Heatmap | Highlighting patterns across two dimensions (rep × metric) | Continuous data without natural categories |
| What's the exception? | Table with conditional formatting | Detailed data with highlighting (deal list with risk flags) | Summary-level analysis |

### Color System & Accessibility

A consistent color system reduces cognitive load and ensures accessibility:

| Purpose | Color | Hex Code | Usage |
|---|---|---|---|
| Positive / On Track | Green | #2ECC71 | Metrics above target, healthy status |
| Warning / Watch | Yellow/Amber | #F39C12 | Metrics approaching threshold |
| Negative / Action Required | Red | #E74C3C | Metrics below threshold, at-risk |
| Neutral / Baseline | Gray | #95A5A6 | Prior period, benchmark, context |
| Primary Data | Blue | #3498DB | Current period, primary metric |
| Secondary Data | Light Blue | #85C1E9 | Comparison, secondary series |

**Accessibility Requirements**: All dashboards must pass WCAG 2.1 AA contrast requirements. Never rely solely on color to convey meaning — always include labels, icons, or patterns as secondary indicators. This ensures dashboards are usable by the ~8% of men and ~0.5% of women who have some form of color vision deficiency.

## Implementation Guide

### Step-by-Step Dashboard Implementation

**Step 1 — Requirements Gathering (1-2 weeks)**:
For each dashboard, interview the target audience to understand:
- What decisions do you make on a daily/weekly/monthly basis?
- What data do you currently use to make those decisions? Where do you get it?
- What data do you wish you had but don't currently?
- What actions would you take if you had better visibility?
- What dashboards/reports do you currently use? What works and what doesn't?

**Step 2 — Metric Definition (1 week)**:
For each identified metric, document:
- Business definition (plain language)
- Calculation logic (SQL formula or business rules)
- Data sources (primary and secondary)
- Refresh frequency
- Target value and alert thresholds
- Responsible owner

**Step 3 — Data Readiness Assessment (1 week)**:
For each metric, verify:
- Data exists in source systems
- Data quality is sufficient (completeness, accuracy, timeliness)
- Transformation logic is understood and documented
- Any data gaps or quality issues are identified and remediation plans created

**Step 4 — Prototype & Iterate (2-3 weeks)**:
- Build initial dashboard with core metrics
- Share with 2-3 power users for feedback
- Iterate on layout, chart types, filters, and drill-downs
- Validate data accuracy against known results
- Refine alerting thresholds based on real data distributions

**Step 5 — Launch & Adoption (2 weeks)**:
- Conduct training sessions for each user group
- Embed dashboards in existing workflows (CRM, Slack, email digests)
- Set up automated distribution (weekly email, daily Slack summary)
- Track adoption metrics (weekly active users, time spent, drill-down frequency)
- Designate "dashboard champions" in each team

**Step 6 — Ongoing Optimization (Continuous)**:
- Review dashboard usage quarterly
- Remove unused metrics and add requested ones
- Update thresholds based on changing benchmarks
- Retire dashboards that are no longer relevant
- Continuously improve data quality feeding the dashboards

### Tool Comparison for Sales Analytics

| Tool | Strengths | Weaknesses | Best For | Price Range |
|---|---|---|---|---|
| Looker | Semantic layer, governance, embedding, data modeling | Steeper learning curve, requires LookML expertise | Organizations with strong data teams and governance needs | $60-125/user/month |
| Tableau | Visual flexibility, ad-hoc analysis, community | Performance at scale, less governed semantic layer | Organizations prioritizing visual exploration | $70-115/user/month |
| Mode | SQL-native, Python integration, fast iteration | Less polished visual defaults, smaller community | Data-savvy teams that want SQL-first analytics | $20-80/user/month |
| Salesforce Reports | Zero additional cost, CRM-native, real-time | Limited visual types, can't combine external data | Quick CRM-only dashboards and reports | Included with CRM |
| Power BI | Cost-effective, Microsoft ecosystem integration | Governance challenges, less mature for SaaS metrics | Microsoft-centric organizations with budget constraints | $10-20/user/month |
| Clari | Revenue-specific, AI-powered, forecast-focused | Narrow focus, less flexible for general analytics | Organizations prioritizing forecast and pipeline intelligence | $50-100/user/month |

## LeadReach Echo Analytics Integration

### How Echo Enhances Sales Analytics

LeadReach Echo serves as the intelligence layer that transforms dashboards from passive data displays into active decision-support systems. Echo integration operates at three levels:

**Level 1 — Automated Insight Generation**:
Echo continuously analyzes the data flowing through the analytics infrastructure and automatically generates plain-language insights that are surfaced directly in dashboards and Slack channels. Examples:

- "Pipeline creation has declined 22% over the past 3 weeks, driven primarily by a 40% drop in outbound-sourced pipeline from the EMEA team. This trend, if continued, will result in a 15% pipeline shortfall for Q4."
- "Win rates for deals involving the competitor AcmeCorp have improved from 18% to 28% over the past 2 quarters, correlating with the new competitive battlecard deployment in March."
- "Deals where LeadReach Flow provided pre-call intelligence close 35% faster and at 20% higher rates than deals without Flow data."

These insights are generated using pattern recognition algorithms that identify statistically significant trends, correlations, and anomalies in the data — surfacing findings that would require hours of manual analysis to discover.

**Level 2 — Natural Language Query Interface**:
Echo enables any dashboard user to ask questions about their data in plain language and receive immediate, accurate answers with supporting visualizations. This democratizes analytics access beyond the RevOps team:

- Rep: "How does my pipeline compare to where top performers were at this point in the quarter?"
- Manager: "Which of my reps has the biggest gap between commit forecast and Judge's prediction?"
- VP: "What's the correlation between demo-to-proposal time and win rate across segments?"

Echo translates these queries into the appropriate data warehouse queries, applies the correct business logic from the semantic layer, and returns results with context and recommended actions.

**Level 3 — Predictive & Prescriptive Analytics**:
Echo's most advanced integration layer provides forward-looking analytics that move dashboards from "what happened" to "what will happen and what should we do about it":

- **Deal Risk Prediction**: Echo identifies deals at risk of slipping or losing before they show traditional warning signs, based on patterns in activity, engagement, and deal characteristics
- **Pipeline Forecasting**: Echo generates independent AI-based forecasts that serve as a "second opinion" alongside human forecasts, calibrated by Judge
- **Next Best Action**: Echo recommends specific actions for each deal based on what has historically worked for similar deals — e.g., "Deals like this one close 40% more often when an executive sponsor meeting occurs before the proposal stage"
- **Expansion Signal Detection**: Echo identifies accounts showing early signs of expansion potential based on product usage patterns, support ticket themes, and engagement changes

### Echo Dashboard Embedding

Echo insights are embedded directly into existing dashboards rather than requiring a separate interface. This follows the principle: "Bring insights to where decisions are made, don't make decision-makers go find insights."

**Embedding Patterns**:

| Pattern | Implementation | Example |
|---|---|---|
| Insight Card | Small card on dashboard surface with key finding + link to detail | "⚠️ Pipeline creation is 22% below trend — click for analysis" |
| Annotated Metric | Echo annotation on an existing metric with context | ARR trend line with Echo annotation: "Growth deceleration aligns with seasonal pattern; no action required" |
| Recommended Action | Action suggestion with one-click execution | "3 deals have no next step scheduled — click to assign next steps" |
| Comparison Overlay | Echo-generated benchmark overlay on existing chart | Rep performance chart with Echo overlay showing "top performer comparison" |
| Alert Integration | Echo-triggered alerts in Slack/email with dashboard deep-link | "Forecast accuracy has dropped below 85% — [View Forecast Dashboard]" |

## Agent Operations Integration

LeadReach agents support sales analytics & dashboards by:
- Providing real-time data inputs for planning and analytics
- Automating process compliance and data governance tasks
- Generating insights that improve forecasting accuracy
- Reducing manual operational overhead through intelligent automation

### Agent-Specific Analytics

Each LeadReach agent generates its own performance data that feeds into dedicated analytics views:

**Flow Analytics**:
- Accounts identified per ICP criteria
- Outreach sequences executed and response rates
- Meetings generated and pipeline influenced
- Flow-sourced pipeline conversion rates vs. other sources
- Cost per Flow-sourced meeting vs. human SDR benchmark

**Echo Analytics**:
- Insights generated per day/week/month
- Insight accuracy (validated by outcome data)
- User engagement with insights (click-through, action taken)
- Natural language query volume and satisfaction
- Predictive model accuracy (deal risk, expansion signal, forecast)

**Judge Analytics**:
- Forecast accuracy vs. human forecast
- Deal risk assessment accuracy (validated by outcomes)
- Close date confidence score calibration
- Win probability model accuracy by segment
- Judge-human forecast disagreement resolution rate
