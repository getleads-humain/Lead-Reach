---
title: Customer KPIs
category: kpi
kpi_type: customer
grade: B
last_reviewed: 2026-07-10
tags: [kpi, customer, benchmark, metrics]
---

# Customer KPIs

Comprehensive KPI reference for the LeadReach platform covering customer-related performance metrics.
These benchmarks enable agents to assess prospect performance, identify improvement opportunities, and deliver data-driven recommendations.

Customer KPIs measure the health, satisfaction, and growth trajectory of existing customer relationships. Unlike acquisition-focused metrics, customer KPIs track what happens after the sale — whether customers are realizing value, staying engaged, expanding their usage, and remaining loyal. These metrics are essential because acquiring a new customer costs 5-7x more than retaining an existing one, and a 5% improvement in retention can increase profitability by 25-95% (Bain & Company). For LeadReach, customer KPIs are particularly important because they inform the expansion revenue engine and provide early warning signals that trigger proactive intervention by AI agents.

The customer KPI framework for LeadReach is organized around four interconnected measurement domains: **Health & Satisfaction** (health scores, NPS, CSAT, CES), **Retention & Churn** (churn rate, retention rate, logo vs. revenue churn), **Expansion & Growth** (expansion rate, NRR, cross-sell/upsell metrics), and **Advocacy** (referral rate, advocacy rate, case study participation). Each domain contains multiple KPIs with benchmarks, diagnostic frameworks, health score methodologies, early warning systems, and agent measurement points.

## Customer Health Score

Customer health scores aggregate multiple signals into a single metric predicting account retention and expansion likelihood. Typical components: product adoption (30-40% weight), support ticket trends (15-20%), NPS/CSAT scores (15-20%), engagement frequency (10-15%), and payment/contract signals (10-15%). Scoring models range from simple red/yellow/green classifications to weighted numeric scores (0-100). Healthy accounts score 70+ (strong retention, expansion candidates), at-risk accounts score 40-69 (require proactive intervention), and critical accounts score below 40 (immediate escalation). The predictive power of health scores depends on data freshness — real-time adoption signals outperform quarterly NPS surveys for churn prediction. Organizations that operationalize health scores into automated playbooks (trigger outreach at score <60) achieve 15-25% lower churn rates.

### Health Score Component Framework

| Component | Weight | Data Source | Scoring Criteria | Update Frequency |
|-----------|--------|------------|-----------------|-----------------|
| Product adoption depth | 30-40% | Product analytics (Pendo, Amplitude) | Feature breadth, usage frequency, DAU/MAU | Daily |
| Support ticket trajectory | 15-20% | Help desk (Zendesk, Intercom) | Ticket volume trend, severity, resolution time | Daily |
| NPS/CSAT scores | 15-20% | Survey platform (Delighted, Satismeter) | Latest score, trend direction | Quarterly (survey) |
| Engagement frequency | 10-15% | CRM + email analytics | QBR attendance, CSM interaction frequency, login cadence | Weekly |
| Contract/payment signals | 5-10% | Billing system (Stripe, Zuora) | Payment timeliness, contract term, renewal timeline | Monthly |
| Stakeholder coverage | 5-10% | CRM contacts data | Number of engaged contacts, executive relationship | Weekly |
| Training/enablement | 3-5% | LMS platform | Training completion rate, certification status | Monthly |

### Advanced Health Score Methodology

The most predictive health score models go beyond simple weighted averages by incorporating:

1. **Trend vectors:** Not just current score but direction and velocity of change (improving, stable, declining, rapidly declining)
2. **Relative benchmarks:** Score relative to segment peers rather than absolute thresholds
3. **Predictive overlays:** ML-driven probability scores based on historical patterns
4. **Interaction effects:** Certain signal combinations (declining usage + champion departure) are multiplicative, not additive

| Methodology Type | Accuracy (churn prediction) | Implementation Complexity | Data Requirements |
|-----------------|---------------------------|-------------------------|-------------------|
| Simple threshold (R/Y/G) | 55-65% | Low | Basic adoption + engagement |
| Weighted score (0-100) | 65-75% | Medium | All components above |
| Trend-adjusted score | 70-80% | Medium-High | All + historical trending |
| ML-driven predictive model | 80-90% | High | All + outcome training data |

### Health Score Tier System

| Tier | Score Range | Account Status | Retention Probability | Recommended Action | Automated Trigger |
|------|-----------|---------------|----------------------|-------------------|------------------|
| Champion | 85-100 | Highly engaged, expanding | 95-99% | Seek referrals, case studies, expansion | Expansion opp auto-created |
| Healthy | 70-84 | Engaged, stable | 85-95% | Regular QBRs, identify expansion | Standard nurture cadence |
| Monitor | 55-69 | Early risk signals | 65-85% | Proactive CSM outreach, usage review, training | CSM alert + outreach task |
| At-Risk | 40-54 | Multiple risk signals | 40-65% | Executive intervention, recovery plan | Manager alert + save campaign |
| Critical | 0-39 | Imminent churn risk | 10-40% | Immediate escalation, save campaign | VP alert + exec-to-exec |

### Health Score by Customer Segment

| Segment | Average Health Score | Key Risk Factors | Typical Intervention | Health Score Sensitivity |
|---------|---------------------|-----------------|---------------------|-------------------------|
| Enterprise | 72-82 | Complex implementation, stakeholder changes | Dedicated CSM, executive sponsor program | Low (changes slowly) |
| Mid-Market | 65-78 | Limited adoption depth, resource constraints | Automated health triggers, scalable CS programs | Medium |
| SMB | 55-72 | High sensitivity to value perception, limited engagement | Self-serve health monitoring, automated outreach | High (changes quickly) |
| Product-Led | 60-75 | Usage drops, feature limitation | In-app engagement, usage-based triggers | Very High |

### Leading Indicators of Health Score Decline

| Indicator | Detection Window | Correlation with Churn | Data Source | Agent Detection |
|-----------|-----------------|----------------------|------------|----------------|
| DAU/MAU ratio drops below 40% | 60-90 days pre-churn | r = 0.72 | Product analytics | Automated daily |
| Key user login frequency drops 50%+ | 45-60 days pre-churn | r = 0.68 | Product analytics | Automated daily |
| Support ticket spike (>3x average) | 30-45 days pre-churn | r = 0.55 | Help desk | Automated real-time |
| Support ticket drop to zero (disengagement) | 60-90 days pre-churn | r = 0.62 | Help desk | Automated weekly |
| Champion or exec sponsor departure | 30-60 days pre-churn | r = 0.65 | LinkedIn, CRM | Scout monitoring |
| Contract term shortening at renewal | 90-120 days pre-churn | r = 0.58 | Billing system | Automated at renewal |
| Training session no-shows | 45-60 days pre-churn | r = 0.40 | LMS | Automated |
| QBR cancellation or postponement | 30-45 days pre-churn | r = 0.52 | CRM | Flow tracking |
| Feature usage concentration narrows | 45-75 days pre-churn | r = 0.58 | Product analytics | Automated weekly |
| Admin user inactivity | 30-45 days pre-churn | r = 0.50 | Product analytics | Automated daily |

### Health Score Early Warning System

LeadReach agents implement a tiered early warning system based on health score trajectory:

| Warning Level | Trigger | Response Time | Action | Owner |
|--------------|--------|--------------|--------|-------|
| Level 1 (Watch) | Health score drops 5+ points or single component enters "yellow" | Within 24 hours | CSM notification, review account signals | CSM |
| Level 2 (Alert) | Health score drops 10+ points or enters "Monitor" tier | Within 4 hours | CSM outreach, usage review, training offer | CSM + Manager |
| Level 3 (Critical) | Health score enters "At-Risk" tier or multiple components red | Within 1 hour | Executive engagement, save plan activation | Manager + VP |
| Level 4 (Emergency) | Health score enters "Critical" tier | Immediate | VP/C-level engagement, recovery plan | VP CS + CEO (for large accounts) |

### Data Sources

- Primary: Product analytics platform for adoption data; CRM for engagement data
- Supporting: Help desk for support metrics; survey platform for NPS/CSAT
- Enrichment: Billing system for contract signals; LinkedIn for stakeholder changes
- LeadReach Agent: Real-time health score calculation with automated risk detection and intervention triggers

### Diagnostic Framework: When Aggregate Health Scores Decline

When average health score across the install base drops by 5+ points:

1. **Component decomposition** — Which health score components are driving the decline?
2. **Segment analysis** — Is the decline concentrated in specific segments or widespread?
3. **Cohort analysis** — Are newer cohorts showing lower health than established cohorts?
4. **Product correlation** — Does the decline correlate with a product release or incident?
5. **Seasonal adjustment** — Is this a normal seasonal pattern (e.g., summer usage dip)?

### LeadReach Agent Health Score Capabilities

| Agent | Health Score Impact | Measurement |
|-------|-------------------|-------------|
| Judge (Real-time risk detection) | Earlier intervention | Days of advance warning before health score threshold breach |
| Flow (Automated outreach triggers) | Proactive engagement | Outreach triggered within hours of risk signal |
| Scout (Stakeholder monitoring) | Champion loss prevention | Departure detection and replacement identification |
| Judge (Usage pattern analysis) | Adoption optimization | Feature adoption recommendations based on healthy account patterns |
| Judge (Expansion signal detection) | Growth acceleration | Expansion pipeline generated from health score signals |
| Flow (Renewal orchestration) | On-time renewal | Early renewal capture rate, renewal velocity improvement |

## Churn Rate Analysis

Churn rate measures the percentage of customers or revenue lost over a period. Logo churn (customer count) and revenue churn (ARR lost) should both be tracked. B2B SaaS benchmarks: annual logo churn 5-15%, annual revenue churn 3-10% (lower due to expansion offset). Net churn (accounting for expansion) should be negative for healthy SaaS businesses — meaning expansion revenue exceeds lost revenue. Churn should be analyzed by cohort (when did they join?), segment (SMB vs. enterprise), product line, and reason category (product gap, competitor, budget, business closure). The most actionable churn analysis identifies leading indicators 60-90 days before cancellation: declining login frequency, support ticket spikes, stakeholder departures, and contract term reductions.

### Formula and Calculation Methodology

Logo Churn Rate = (Customers Lost in Period / Customers at Start of Period) × 100

Gross Revenue Churn Rate = (MRR Lost + MRR Contracted) / MRR at Start of Period × 100

Net Revenue Churn Rate = (MRR Lost + MRR Contracted - MRR Expanded) / MRR at Start of Period × 100

Annual Churn Rate = 1 - (1 - Monthly Churn Rate)^12

Monthly Churn Rate = 1 - (1 - Annual Churn Rate)^(1/12)

**Important calculation notes:**
- Track both logo and revenue churn — they tell different stories
- Gross churn measures actual loss; net churn accounts for expansion
- Use cohort-based churn for more accurate analysis (avoid mixing vintages)
- Distinguish between voluntary churn (customer chooses to leave) and involuntary churn (payment failure)
- Always specify the time period (monthly, quarterly, annual)

### Churn Rate Benchmarks by Segment

| Segment | Annual Logo Churn | Annual Gross Revenue Churn | Annual Net Revenue Churn | Monthly Churn (approx.) |
|---------|------------------|---------------------------|-------------------------|------------------------|
| Enterprise | 3-7% | 2-5% | -5% to +5% | 0.3-0.6% |
| Mid-Market | 5-12% | 4-8% | -3% to +10% | 0.4-1.0% |
| SMB | 15-30% | 10-20% | +2% to +15% | 1.2-2.5% |
| Product-Led | 20-40% | 15-30% | -10% to +10% | 1.5-3.5% |

### Churn by Company Maturity Stage

| Company Stage | Expected Logo Churn | Expected Revenue Churn | Context |
|--------------|-------------------|----------------------|---------|
| Seed/Early (finding PMF) | 15-30% | 10-25% | Product still evolving, some misfit customers |
| Growth (scaling) | 10-20% | 7-15% | Improving product, better targeting |
| Scale (optimizing) | 5-12% | 4-8% | Strong PMF, efficient CS |
| Mature (market leader) | 3-8% | 2-5% | Sticky product, proactive CS |

### Churn Reason Distribution and Actionability

| Churn Reason | % of Total Churn | Predictability | Prevention Strategy | LeadReach Agent Role |
|-------------|-----------------|---------------|--------------------|---------------------|
| Low product adoption / no value | 25-35% | High (detectable early) | Onboarding optimization, adoption campaigns | Usage monitoring, training triggers |
| Budget cuts / economic pressure | 15-25% | Medium (some warning) | Value demonstration, flexible pricing | ROI reporting, executive engagement |
| Competitor switch | 15-25% | Medium (competitive signals) | Competitive enablement, product roadmap | Competitive intelligence, retention offers |
| Business closure / merger | 10-15% | Low (often sudden) | M&A monitoring, migration support | Acquisition detection, account mapping |
| Champion departure | 8-15% | Medium (LinkedIn signals) | Multi-threading, executive relationships | Departure alerts, new contact identification |
| Poor support experience | 5-10% | High (ticket signals) | Support escalation, service recovery | Ticket monitoring, escalation triggers |
| Product gap / missing feature | 10-20% | High (request patterns) | Product feedback, workaround enablement | Feature request tracking, alternative solutions |

### Churn Prediction Model

LeadReach agents use a multi-signal churn prediction model:

| Signal Category | Signals Tracked | Weight | Detection Window | Agent |
|----------------|----------------|--------|-----------------|-------|
| Usage decline | Login frequency, feature usage, DAU/MAU | 35% | 60-90 days | Judge |
| Engagement drop | CSM meeting cancellations, QBR skips, training no-shows | 20% | 45-60 days | Flow |
| Support signals | Ticket spikes, ticket droughts, escalations, NPS detractor | 15% | 30-45 days | Judge |
| People signals | Champion departure, org changes, new decision-maker | 15% | 30-60 days | Scout |
| Contract signals | Term shortening, payment delays, renewal resistance | 10% | 60-120 days | Judge |
| Competitive signals | Competitor evaluation detected, pricing comparison requests | 5% | 30-60 days | Scout |

**Churn Prediction Score = Weighted sum of normalized signal scores (0-100)**

| Prediction Score | Churn Probability | Recommended Action |
|-----------------|------------------|-------------------|
| 80-100 | 60-90% | Immediate executive intervention, save campaign |
| 60-79 | 30-60% | Proactive CSM outreach, recovery plan |
| 40-59 | 15-30% | Monitor closely, preventive engagement |
| 20-39 | 5-15% | Standard CS engagement, reinforce value |
| 0-19 | <5% | Normal account management |

### Cohort-Based Churn Analysis

Cohort analysis provides the most accurate view of churn patterns by tracking groups of customers who joined in the same period:

| Cohort Age | Enterprise Retention | Mid-Market Retention | SMB Retention | PLG Retention |
|-----------|---------------------|---------------------|---------------|---------------|
| Month 1 | 97-99% | 93-97% | 85-92% | 80-88% |
| Month 3 | 95-98% | 88-94% | 75-85% | 65-78% |
| Month 6 | 93-97% | 83-90% | 65-78% | 50-65% |
| Month 12 | 90-95% | 78-88% | 55-70% | 35-50% |
| Month 24 | 87-93% | 73-85% | 45-62% | 25-40% |

### Involuntary vs. Voluntary Churn

| Churn Type | % of Total | Detection | Prevention | Typical Rate |
|-----------|-----------|-----------|------------|-------------|
| Voluntary (customer choice) | 60-80% | Leading indicators | Proactive CS, value reinforcement | 3-8% annual |
| Involuntary (payment failure) | 20-40% | Payment decline | Dunning campaigns, payment retry | 1-4% annual |

Involuntary churn is the lowest-hanging fruit — implementing smart dunning campaigns (retry logic, card updater, multiple payment methods) can recover 30-50% of involuntary churn.

### Data Sources

- Primary: Billing system for churn events; CRM for account status tracking
- Supporting: Product analytics for usage signals; help desk for support signals
- Enrichment: LinkedIn for people signals; competitive intelligence for competitive signals
- LeadReach Agent: Multi-signal churn prediction with automated intervention workflows

### Diagnostic Framework: When Churn Rate Increases

When monthly churn rate increases by 50%+ above baseline for 2+ consecutive months:

1. **Segment decomposition** — Which segment(s) are driving the increase?
2. **Cohort analysis** — Are newer cohorts churning faster (onboarding problem) or is it across all cohorts (product/market problem)?
3. **Reason coding** — Has the distribution of churn reasons shifted?
4. **Product correlation** — Does the increase correlate with a release, incident, or pricing change?
5. **Competitive analysis** — Is a specific competitor gaining share in your churned accounts?

| Churn Pattern | Diagnosis | Action |
|--------------|-----------|--------|
| Early churn (month 1-3) | Onboarding or expectation-setting problem | Improve onboarding, tighten sales qualification |
| Mid-life churn (month 4-12) | Value realization or adoption problem | Adoption campaigns, CSM outreach, training |
| Late churn (month 12+) | Competitive or relationship problem | Executive engagement, competitive reinforcement |
| Concentrated in one segment | Segment-specific issue | Deep-dive analysis, segment-specific intervention |
| Across all segments | Systemic issue (product, market, pricing) | Strategic assessment, product roadmap review |
| Involuntary churn spike | Payment/billing issue | Dunning optimization, payment method diversification |

## Net Promoter Score (NPS)

NPS measures customer loyalty through a single question: 'How likely are you to recommend [product] to a colleague?' on a 0-10 scale. Promoters (9-10) minus detractors (0-6) equals the NPS score. B2B SaaS NPS benchmarks: average 30-40, good 40-60, excellent 60+. NPS should be tracked by segment (enterprise typically scores 10-15 points higher than SMB), by product area, and over time. The real value of NPS lies not in the score itself but in the follow-up: asking 'why' and routing responses to the appropriate team. Promoters become referral sources and case study candidates, while detractors receive immediate outreach from customer success. Transactional NPS (after specific interactions) provides more actionable feedback than relationship NPS (annual surveys). Organizations that close the loop on every detractor within 48 hours see 20-30% improvement in NPS over 6 months.

### Formula and Calculation Methodology

NPS = % Promoters (9-10) - % Detractors (0-6)

Passives (7-8) are included in the response count but do not affect the NPS calculation.

**Important calculation notes:**
- Minimum sample size of 30+ responses for statistical significance at the segment level
- Track response rate — low response rates (<20%) may introduce bias
- Compare absolute scores only within similar survey methodologies
- NPS ranges from -100 (all detractors) to +100 (all promoters)
- Score movement of 5+ points is typically considered meaningful

### NPS Benchmarks by Segment and Industry

| Segment | Average NPS | Good NPS | Excellent NPS | Key Drivers |
|---------|-----------|---------|--------------|-------------|
| Enterprise SaaS | 35-45 | 50-65 | 65+ | Relationship depth, value delivery |
| Mid-Market SaaS | 30-40 | 45-60 | 60+ | Product reliability, support quality |
| SMB SaaS | 25-35 | 40-55 | 55+ | Ease of use, value for money |
| PLG/Freemium | 20-30 | 35-50 | 50+ | Product experience, self-serve quality |

### NPS by SaaS Vertical

| Vertical | Median NPS | Top Quartile NPS | Primary Loyalty Driver |
|----------|-----------|-----------------|----------------------|
| Security/Compliance | 40-50 | 60+ | Trust, reliability, regulatory value |
| Infrastructure/DevTools | 35-45 | 55+ | Developer experience, uptime, documentation |
| Data/Analytics | 30-40 | 50+ | Insight quality, data accuracy, speed |
| Horizontal SaaS | 25-35 | 45+ | Workflow efficiency, integration breadth |
| Vertical SaaS | 35-50 | 55+ | Industry specificity, domain expertise |
| AI/ML Platform | 20-35 | 45+ | Accuracy, transparency, ease of deployment |

### NPS Response Distribution Patterns

| Pattern | Distribution | Interpretation | Action |
|---------|-------------|---------------|--------|
| Healthy | Strong promoter skew, few detractors | High loyalty and advocacy | Leverage for referrals and expansion |
| Bimodal | Cluster of promoters AND detractors | Segmented experience quality | Investigate detractor segment, fix root cause |
| Neutral cluster | Most responses 7-8 | Indifferent, no strong feelings | Create "wow" moments, build emotional connection |
| Detractor-heavy | More 0-6 than 9-10 | Systemic satisfaction problem | Immediate intervention, root cause analysis |
| Declining trend | Score dropping 5+ points per period | Worsening experience | Emergency review, likely product or support issue |

### NPS Survey Types and Timing

| Survey Type | Timing | Question | Response Rate | Actionability |
|------------|--------|----------|--------------|---------------|
| Relationship NPS | Quarterly or annually | Likelihood to recommend overall | 15-30% | Strategic direction |
| Transactional NPS | After key interactions (support ticket, onboarding, QBR) | Likelihood to recommend based on experience | 30-50% | Immediate improvement |
| Product NPS | After feature adoption or release | Likelihood to recommend the product | 20-35% | Product roadmap input |
| Milestone NPS | At renewal, 90 days post-onboarding | Likelihood to recommend at key moment | 40-60% | Retention and expansion signals |

### Closing the Loop on NPS

| Response Type | Target Response Time | Action | Measurement |
|--------------|---------------------|--------|-------------|
| Detractor (0-6) | Within 24-48 hours | Personal outreach from CSM or manager, root cause investigation | Recovery rate, score improvement on follow-up |
| Passive (7-8) | Within 1 week | Thank and request specific improvement suggestions | Conversion to promoter rate |
| Promoter (9-10) | Within 1 week | Thank, request review/referral/case study participation | Referral conversion, review submission rate |

### NPS-to-Revenue Correlation

| NPS Range | Revenue Retention | Expansion Rate | Referral Rate | Churn Risk |
|-----------|------------------|---------------|--------------|-----------|
| 60+ (Excellent) | 92-98% | 30-50% | 20-35% | Very Low |
| 40-59 (Good) | 85-95% | 20-35% | 10-20% | Low |
| 20-39 (Average) | 75-88% | 10-20% | 5-10% | Medium |
| 0-19 (Below average) | 60-80% | 5-12% | 2-5% | High |
| Below 0 (Negative) | 40-65% | 0-5% | <2% | Very High |

### Data Sources

- Primary: Survey platform (Delighted, Satismeter, Qualtrics) for NPS data
- Supporting: CRM for segment attribution and follow-up tracking
- Enrichment: Product analytics for correlating NPS with usage patterns
- LeadReach Agent: NPS data integration with health scoring, automated follow-up workflows

### LeadReach Agent NPS Capabilities

| Agent | NPS Impact | Measurement |
|-------|-----------|-------------|
| Flow (Automated detractor alert routing) | Faster response to unhappy customers | Time from survey to outreach, recovery rate |
| Judge (Promoter engagement suggestions) | More referrals and advocacy | Referral rate from promoters, case study participation |
| Judge (NPS-to-usage correlation) | Identifies what drives scores | Feature adoption patterns of promoters vs. detractors |
| Judge (Predictive NPS modeling) | Anticipates score changes | Prediction accuracy, pre-emptive intervention success |
| Scout (Referral identification from promoters) | More referral pipeline | Referral pipeline from NPS-informed targeting |

## Customer Satisfaction (CSAT) and Customer Effort Score (CES)

CSAT measures satisfaction with specific interactions, while CES measures how much effort a customer had to exert to accomplish their goal. Both complement NPS by providing more granular, transactional feedback that identifies specific improvement opportunities.

### CSAT Formula and Benchmarks

CSAT = (Satisfied Responses / Total Responses) × 100

| Interaction Type | CSAT Benchmark | Good | Excellent | Survey Trigger |
|-----------------|---------------|------|-----------|---------------|
| Support ticket resolution | 75-85% | 85-90% | 90%+ | After ticket close |
| Onboarding experience | 70-80% | 80-90% | 90%+ | After onboarding completion |
| Product experience | 65-80% | 80-85% | 85%+ | Quarterly in-app survey |
| CSM interaction | 80-90% | 90-95% | 95%+ | After QBR or check-in |
| Renewal process | 75-85% | 85-90% | 90%+ | After renewal completion |

### CES Formula and Benchmarks

CES = Average score on 1-7 scale (1 = very difficult, 7 = very easy)

Lower effort correlates with higher loyalty — CES is often a better predictor of retention than CSAT for transactional interactions.

| Interaction Type | CES Benchmark (1-7) | Good | Excellent |
|-----------------|-------------------|------|-----------|
| Getting support | 4.5-5.5 | 5.5-6.0 | 6.0+ |
| Onboarding/setup | 3.5-4.5 | 4.5-5.5 | 5.5+ |
| Finding information | 4.0-5.0 | 5.0-5.5 | 5.5+ |
| Resolving an issue | 4.0-5.0 | 5.0-5.5 | 5.5+ |
| Upgrading/expanding | 3.5-4.5 | 4.5-5.5 | 5.5+ |

### NPS vs. CSAT vs. CES Comparison

| Metric | Best For | Survey Frequency | Actionability | Predictive Power (Churn) |
|--------|----------|-----------------|--------------|-------------------------|
| NPS | Overall loyalty, strategic direction | Quarterly/Annual | Medium | High (r = 0.55) |
| CSAT | Specific interaction quality | After each interaction | High | Medium (r = 0.40) |
| CES | Process friction, effort reduction | After key processes | Very High | High (r = 0.60) |

### LeadReach Agent CSAT/CES Capabilities

| Agent | CSAT/CES Impact | Measurement |
|-------|----------------|-------------|
| Flow (Friction reduction) | Lower CES through automation | CES improvement on agent-assisted processes |
| Judge (Issue detection before survey) | Higher CSAT through proactive resolution | Pre-emptive resolution rate |
| Flow (Self-serve optimization) | Lower effort, higher satisfaction | Self-serve completion rate, CES on self-serve |

## Customer Retention Rate

Retention rate is the inverse of churn rate and provides a positive framing that aligns with growth-oriented thinking. While churn focuses on what's lost, retention focuses on what's kept — making it a more constructive metric for customer success teams.

### Formula and Calculation Methodology

Logo Retention Rate = (Customers at End - New Customers) / Customers at Start × 100

GRR = (Starting MRR - Contraction MRR - Churned MRR) / Starting MRR × 100

NRR = (Starting MRR + Expansion MRR - Contraction MRR - Churned MRR) / Starting MRR × 100

### Retention Rate Benchmarks

| Metric | Enterprise | Mid-Market | SMB | PLG |
|--------|-----------|------------|-----|-----|
| Logo retention (annual) | 93-97% | 88-95% | 70-85% | 60-80% |
| Gross revenue retention | 95-98% | 85-96% | 80-90% | 70-85% |
| Net revenue retention | 115-140% | 105-125% | 90-110% | 110-130% |

### Retention by Cohort Vintage

The retention curve typically follows a characteristic "smile" pattern — higher churn early (onboarding friction), stabilizing in the middle, and slight improvement for very long-tenure customers:

| Cohort Age | Enterprise GRR | Mid-Market GRR | SMB GRR |
|-----------|---------------|---------------|---------|
| Year 1 | 93-97% | 85-92% | 70-82% |
| Year 2 | 95-98% | 88-95% | 75-88% |
| Year 3 | 96-99% | 90-96% | 78-90% |
| Year 4+ | 97-99% | 92-97% | 80-92% |

### Retention Improvement Strategies

| Strategy | Retention Impact | Implementation Effort | Cost | ROI |
|----------|-----------------|----------------------|------|-----|
| Onboarding optimization | +5-10% Year 1 retention | Medium | Medium | Very High |
| Proactive health monitoring | +3-8% overall retention | Medium | Low (agent-driven) | Very High |
| Executive sponsor program | +5-15% enterprise retention | High | Medium | High |
| Customer advisory board | +3-5% retention for participants | Medium | Low | High |
| Training/enablement investment | +5-10% adoption-related retention | Medium | Medium | High |
| Product usage analytics + triggers | +8-15% early retention | Medium | Low (agent-driven) | Very High |

### LeadReach Agent Retention Capabilities

| Agent | Retention Mechanism | Measurement |
|-------|-------------------|-------------|
| Judge (Health score monitoring) | Early risk detection | Days of advance warning, intervention success rate |
| Flow (Automated engagement triggers) | Proactive outreach | Engagement rate on triggered outreach |
| Scout (Stakeholder monitoring) | Multi-threading maintenance | Contact coverage per account, champion replacement rate |
| Flow (Renewal orchestration) | On-time renewals | Renewal rate, early renewal capture rate |
| Judge (Usage pattern analysis) | Adoption optimization | Feature adoption rate, DAU/MAU improvement |

## Expansion Rate and Cross-Sell/Upsell Metrics

Expansion rate measures the percentage of existing customers who increase their spend over a period. This is a critical metric because expansion revenue has the highest margin (no CAC) and strongest correlation with long-term retention. Companies with expansion rates above 20% annually are growing their existing base faster than most companies grow through new business.

### Formula and Calculation Methodology

Expansion Rate = (Expansion MRR in Period / Starting MRR) × 100

Cross-Sell Rate = (Customers Purchasing Additional Products / Total Customers) × 100

Upsell Rate = (Customers Upgrading Tier / Total Customers on Lower Tier) × 100

Net Expansion MRR per Account = (Expansion MRR - Contraction MRR) / Total Accounts

### Expansion Rate Benchmarks

| Segment | Monthly Expansion Rate | Annual Expansion Rate | Primary Expansion Mechanism |
|---------|----------------------|----------------------|---------------------------|
| Enterprise | 2-5% | 25-60% | Seat expansion, module add-on, custom services |
| Mid-Market | 1.5-3.5% | 18-42% | Seat expansion, tier upgrade |
| SMB | 0.5-2% | 6-24% | Self-serve upgrade, usage expansion |
| PLG | 2-5% | 25-60% | Usage-based expansion, feature unlock |

### Expansion Opportunity Identification Framework

| Expansion Signal | Detection Method | Expansion Type | Typical Value | Agent Detection |
|-----------------|-----------------|---------------|--------------|----------------|
| License utilization >85% | Product analytics | Seat expansion | $5K-50K | Judge (automated) |
| Feature requests for premium features | Support/feedback | Tier upgrade | $3K-25K | Judge (automated) |
| New department/team adoption | Product analytics | Cross-sell | $10K-100K | Judge (automated) |
| Usage volume approaching threshold | Product analytics | Usage expansion | $2K-20K | Judge (automated) |
| Integration with complementary products | Integration data | Bundle/cross-sell | $5K-30K | Scout (automated) |
| Positive NPS + high health score | Survey + health | Strategic expansion | $20K-200K | Judge (automated) |
| Contract renewal approaching | Billing system | Renewal + expansion | $5K-100K | Flow (automated) |

### Expansion Motion Efficiency

| Expansion Motion | Typical Win Rate | Sales Cycle | Cost per Expansion $ | Rep Involvement |
|-----------------|-----------------|------------|---------------------|-----------------|
| Self-serve upgrade | 40-60% | <1 day | <$0.02 | None (product-led) |
| CSM-identified expansion | 35-55% | 15-45 days | $0.05-0.15 | Light (CSM) |
| AE-driven upsell | 25-40% | 30-90 days | $0.10-0.25 | Moderate (AE) |
| Executive-led strategic expansion | 20-35% | 60-180 days | $0.15-0.40 | Heavy (AE + exec) |
| Agent-identified + automated | 30-50% | 7-30 days | $0.02-0.08 | Light (agent + CSM) |

### Data Sources

- Primary: Billing system for expansion MRR; product analytics for usage signals
- Supporting: CRM for expansion pipeline and outcome tracking
- LeadReach Agent: Expansion signal detection and pipeline creation

### LeadReach Agent Expansion Capabilities

| Agent | Expansion Impact | Measurement |
|-------|-----------------|-------------|
| Judge (Expansion signal detection) | More expansion opportunities identified | Expansion pipeline created per month |
| Flow (Automated expansion outreach) | Faster expansion cycles | Expansion MRR velocity improvement |
| Judge (Usage pattern analysis) | Identifies highest-value expansion paths | Expansion ACV on agent-identified vs. manual |
| Scout (New stakeholder identification) | Cross-sell to new departments | Cross-sell pipeline per account |
| Flow (Renewal + expansion bundling) | Expansion at renewal | Expansion attached to renewal rate |

## Customer Advocacy and Referral Metrics

Advocacy metrics measure the degree to which customers actively promote your product to others. Advocacy is the ultimate indicator of customer success — customers only refer products they genuinely value. Referral pipeline is also the most efficient source of new business, with higher win rates and lower CAC than any other channel.

### Advocacy Metrics Framework

| Metric | Formula | Benchmark | Top Performer | Strategic Value |
|--------|---------|-----------|---------------|----------------|
| Referral rate | % of customers making referrals | 5-15% | 15-25% | Direct pipeline generation |
| Referral pipeline % | Pipeline from referrals / Total pipeline | 5-15% | 15-25% | Highest-quality pipeline source |
| Case study participation rate | % of customers participating in case studies | 3-8% | 8-15% | Social proof, sales enablement |
| Review submission rate | % of customers leaving public reviews | 2-5% | 5-10% | Brand reputation, SEO |
| Community participation rate | % of customers active in community | 10-20% | 20-35% | Retention, product feedback |
| Advocacy score | Composite of referral + review + case study | 0-100 | 70+ | Comprehensive advocacy measure |

### Referral Program Benchmarks

| Referral Program Type | Participation Rate | Conversion Rate | Average Referral ACV | Cost per Referral $ |
|----------------------|-------------------|----------------|---------------------|-------------------|
| Informal (word of mouth) | 5-10% | 30-50% | 1.0-1.2x average | $0 (organic) |
| Structured referral program | 15-30% | 20-40% | 0.8-1.1x average | $0.03-0.10 |
| Partner/channel referral | 10-20% | 25-45% | 1.0-1.2x average | $0.05-0.15 (margin share) |
| Agent-activated referral | 20-35% | 25-45% | 0.9-1.2x average | $0.02-0.08 |

### LeadReach Agent Advocacy Capabilities

| Agent | Advocacy Impact | Measurement |
|-------|----------------|-------------|
| Judge (Promoter identification from NPS/health) | Targeted referral requests | Referral rate from agent-identified promoters |
| Flow (Referral request automation) | Timely referral outreach | Referral request sent rate, referral conversion |
| Scout (Advocacy opportunity detection) | Case study and review participation | Advocacy action completion rate |
| Flow (Community engagement triggers) | Higher community participation | Community activity from triggered accounts |

## Time to Value (TTV)

Time to value measures how long it takes a new customer to realize the first meaningful benefit from the product. This metric is critical because TTV directly correlates with long-term retention — customers who experience value within the first 14 days have 2-3x higher 12-month retention rates. B2B SaaS TTV benchmarks: self-serve products 1-7 days, mid-market with implementation 14-45 days, enterprise with custom integration 30-90 days. Strategies to reduce TTV include: pre-built integrations, templated configurations, guided onboarding workflows, and dedicated implementation support for enterprise accounts.

### Formula and Calculation Methodology

TTV = Date of First Value Realization - Date of Contract Signature (or onboarding start)

First Value Realization is defined by product-specific milestones:

| Product Type | First Value Milestone | Measurement Method |
|-------------|----------------------|-------------------|
| Data platform | First data enrichment or insight delivered | Product analytics event |
| Automation tool | First automated workflow executed successfully | Automation completion trigger |
| Analytics product | First report or dashboard created and viewed | Dashboard creation event |
| Communication tool | First message sent and replied to | Messaging event |
| CRM/sales tool | First deal or contact managed through platform | CRM object creation |
| LeadReach | First AI-qualified lead delivered to CRM | Lead delivery event |

### TTV Benchmarks by Segment

| Segment | TTV Target | Actual (Typical) | Key Milestones |
|---------|-----------|-----------------|---------------|
| Self-serve / PLG | 1-7 days | 3-14 days | Sign-up, first action, "aha moment" |
| SMB (sales-assisted) | 7-21 days | 14-30 days | Onboarding complete, first workflow live |
| Mid-Market | 14-45 days | 21-60 days | Integration complete, team trained, first results |
| Enterprise | 30-90 days | 45-120 days | Pilot success, integration, training, rollout |
| Strategic / Custom | 60-180 days | 90-240 days | Full deployment, custom integration, org-wide adoption |

### TTV vs. Retention Correlation

| TTV Range | 12-Month Retention Rate | Expansion Rate | Churn Risk |
|-----------|------------------------|---------------|-----------|
| <7 days | 90-95% | 35-50% | Very Low |
| 7-14 days | 85-92% | 25-40% | Low |
| 14-30 days | 78-88% | 20-30% | Medium |
| 30-60 days | 65-80% | 15-25% | High |
| 60-90 days | 55-72% | 10-18% | Very High |
| >90 days | 40-60% | 5-12% | Critical |

### TTV Reduction Strategies

| Strategy | Typical TTV Reduction | Implementation Effort | ROI |
|----------|----------------------|----------------------|-----|
| Pre-built integrations (native) | 7-14 days | High | Very High |
| Templated configurations | 5-10 days | Medium | High |
| Guided onboarding wizard | 3-7 days | Medium | Very High |
| Dedicated onboarding CSM | 7-21 days | Medium (cost) | High |
| Quick-start packages | 5-14 days | Low-Medium | High |
| Self-serve setup (no implementation) | 10-20 days | High (product investment) | Very High |
| Parallel workstreams (training while configuring) | 7-14 days | Low | High |
| LeadReach agent-guided onboarding | 10-25 days | Low | Very High |

### Data Sources

- Primary: Product analytics for milestone tracking; implementation platform for project tracking
- Supporting: CRM for onboarding start date; CS platform for value realization confirmation
- LeadReach Agent: TTV milestone tracking with automated onboarding acceleration triggers

### Diagnostic Framework: When TTV Is Too Long

When median TTV exceeds benchmarks by 30%+:

1. **Onboarding path analysis** — Which onboarding paths have the longest TTV?
2. **Milestone breakdown** — Where in the onboarding journey are customers getting stuck?
3. **Resource bottleneck** — Are implementation resources over-subscribed?
4. **Complexity audit** — Is the product too complex for the customer segment?
5. **Self-serve readiness** — Could parts of the onboarding be automated?

### LeadReach Agent TTV Capabilities

| Agent | TTV Impact | Measurement |
|-------|-----------|-------------|
| Flow (Onboarding milestone monitoring) | Identifies stalls early | Days saved per onboarding milestone |
| Flow (Automated guidance and nudges) | Accelerates self-serve progress | Completion rate improvement, time per step |
| Judge (Resource scheduling optimization) | Faster access to implementation support | Implementation start-to-finish time |
| Judge (Success pattern matching) | Recommends fastest path based on similar customers | TTV reduction for agent-guided vs. standard onboarding |
| Judge (Risk-based escalation) | Flags at-risk onboarding for intervention | Recovery rate for stalled onboarding |

## Customer Lifetime Value (CLV/LTV)

Customer Lifetime Value represents the total revenue a business can expect from a customer relationship over its entire duration. LTV is foundational for unit economics — it determines how much you can afford to spend acquiring customers (CAC) and still maintain profitable growth.

### Formula and Calculation Methodology

Simple LTV = ARPU × Gross Margin % / Monthly Churn Rate

Cohort-based LTV = Sum of (Monthly Revenue × Retention Rate^Month) for all months

Predicted LTV = ARPU × Gross Margin × (1 / (1 - Retention Rate + Expansion Rate))

**Important calculation notes:**
- Simple LTV assumes constant churn rate and no expansion
- Cohort-based LTV is more accurate for businesses with changing retention curves
- Predicted LTV accounts for expansion revenue and is the most comprehensive
- Discount future cash flows for businesses with long customer lifespans

### LTV Benchmarks by Segment

| Segment | Average LTV | LTV:CAC Target | Key LTV Drivers |
|---------|-----------|----------------|-----------------|
| Enterprise | $500K-5M+ | 5:1+ | Long tenure (7-10+ years), high expansion |
| Mid-Market | $100K-500K | 4:1+ | Moderate tenure (4-7 years), consistent expansion |
| SMB | $20K-100K | 3:1+ | Shorter tenure (2-4 years), some expansion |
| Product-Led | $5K-50K | 3:1+ | Variable tenure, usage-driven expansion |

### LTV Extension Strategies

| Strategy | LTV Impact | Implementation Effort | Success Metric |
|----------|-----------|----------------------|---------------|
| Reduce churn (5% improvement) | 25-95% LTV increase | Medium | Retention rate improvement |
| Increase expansion rate | 15-40% LTV increase | Medium | NRR improvement |
| Move upmarket (higher ACV) | 50-200% LTV increase | High | ACV trend upward |
| Add product lines | 20-50% LTV increase | High | Cross-sell adoption rate |
| Improve onboarding (faster TTV) | 10-30% LTV increase | Medium | Retention of fast-TTV cohort |

### LTV Sensitivity to Retention

The LTV formula is most sensitive to churn rate, making retention the highest-leverage LTV improvement strategy:

| Change | LTV Impact (baseline: $100 ARPU, 80% GM, 5% monthly churn) |
|--------|-----------------------------------------------------------|
| Churn ↓ 1% (5%→4%) | +25% LTV |
| ARPU ↑ 10% | +10% LTV |
| Gross Margin ↑ 5% (80%→85%) | +6% LTV |
| Expansion ↑ 2% monthly | +15% LTV |

## Customer Segmentation Framework for KPIs

Different customer segments require different KPI thresholds and intervention strategies. A one-size-fits-all approach to customer KPIs leads to misallocated resources and missed opportunities.

### Segment-Specific KPI Weightings

| KPI | Enterprise Weight | Mid-Market Weight | SMB Weight | PLG Weight |
|-----|------------------|------------------|-----------|-----------|
| Health score | 35% | 30% | 20% | 15% |
| NPS | 20% | 20% | 15% | 10% |
| Churn rate | 15% | 20% | 30% | 30% |
| Expansion rate | 20% | 20% | 15% | 20% |
| TTV | 5% | 5% | 15% | 20% |
| Advocacy rate | 5% | 5% | 5% | 5% |

### Segment Prioritization for Agent Intervention

| Segment | Revenue Concentration | Churn $ Impact | Agent Priority | Agent Configuration |
|---------|---------------------|---------------|---------------|-------------------|
| Enterprise | 40-60% of ARR | Very High ($100K-500K+ per churn) | Highest | Dedicated agent monitoring, real-time alerts |
| Mid-Market | 25-35% of ARR | High ($25K-100K per churn) | High | Automated health triggers, scaled CS |
| SMB | 10-25% of ARR | Medium ($5K-25K per churn) | Medium | Automated outreach, self-serve optimization |
| PLG | 5-15% of ARR | Low ($1K-10K per churn) | Low | Usage-based triggers, in-app engagement |

## Implementation Guide for LeadReach Agents

### Daily Customer KPI Agent Routines

1. **Health score updates:** Recalculate health scores for all accounts based on latest signals
2. **Churn risk monitoring:** Flag accounts with elevated churn prediction scores
3. **NPS response routing:** Route new NPS responses to appropriate teams with context
4. **TTV milestone tracking:** Monitor onboarding progress against benchmarks
5. **Expansion signal detection:** Identify accounts showing expansion-ready signals
6. **Advocacy opportunity scanning:** Flag promoter accounts for referral/case study outreach

### Weekly Customer KPI Agent Reports

1. **Health score distribution:** Account count by health tier with week-over-week movement
2. **Churn risk dashboard:** Accounts in at-risk and critical tiers with key risk factors
3. **NPS trend report:** Score movement by segment with detractor root cause analysis
4. **TTV analysis:** Onboarding progress by cohort, accounts exceeding TTV benchmarks
5. **Expansion pipeline update:** Expansion opportunities identified and in-progress
6. **Advocacy action report:** Referral requests, case study outreach, review campaigns

### Monthly Customer KPI Deep Dives

1. **Churn cohort analysis:** Retention curves by vintage, segment, and onboarding path
2. **Health score calibration:** Are health scores accurately predicting outcomes?
3. **LTV analysis by segment:** Customer lifetime value trends and extension opportunities
4. **NPS action item tracking:** Progress on closing the loop with detractors and leveraging promoters
5. **TTV optimization review:** Which onboarding improvements had the most impact?
6. **Expansion rate analysis:** Expansion by segment, product, and motion with trend
7. **CSAT/CES review:** Interaction quality metrics with improvement recommendations
8. **Advocacy ROI analysis:** Revenue from referrals, value of case studies and reviews

### Quarterly Customer KPI Strategic Reviews

1. **Customer segmentation audit:** Are segment definitions and KPI thresholds still accurate?
2. **Health score model review:** Should weights or components be adjusted?
3. **Churn prediction model calibration:** Is the multi-signal model predicting accurately?
4. **Expansion strategy review:** Which expansion motions are working best?
5. **Customer journey mapping:** Where are the friction points in the customer lifecycle?
6. **Voice of customer synthesis:** Aggregate themes from NPS, CSAT, CES, and feedback
7. **Agent ROI assessment:** Measured impact of LeadReach agents on customer KPIs

## Visualization Recommendations

| KPI | Recommended Visualization | Key Insights |
|-----|--------------------------|-------------|
| Health score | Stacked bar by tier over time | Distribution shifts and intervention impact |
| Churn rate | Cohort retention curve (line chart) | Retention trajectory by cohort |
| Churn prediction | Scatter plot (risk score vs. account value) | Priority accounts for intervention |
| NPS | Histogram with promoter/passive/detractor zones | Score distribution and movement |
| CSAT | Bar chart by interaction type | Where satisfaction is highest/lowest |
| CES | Bar chart by process with benchmark line | High-effort processes needing improvement |
| Retention rate | Area chart (GRR + NRR) over time | Retention floor and expansion trajectory |
| Expansion rate | Waterfall (starting MRR → expansion → ending MRR) | Expansion composition and trend |
| TTV | Funnel chart (onboarding milestones) | Where customers get stuck |
| LTV | Waterfall chart (components of LTV) | Value decomposition and expansion contribution |
| Advocacy | Bubble chart (advocacy score vs. account value vs. referral pipeline) | Most valuable advocates |
| Health score trajectory | Sparklines by account | Individual account direction and velocity |
| Customer segmentation | Treemap (segment × health tier) | Distribution of health by segment |
