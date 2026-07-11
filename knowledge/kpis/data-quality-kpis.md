---
title: Data Quality KPIs
category: kpi
kpi_type: data-quality
grade: B
last_reviewed: 2026-07-10
tags: [kpi, data-quality, benchmark, metrics]
---

# Data Quality KPIs

Comprehensive KPI reference for the LeadReach platform covering data-quality-related performance metrics.
These benchmarks enable agents to assess prospect performance, identify improvement opportunities, and deliver data-driven recommendations.

Data quality KPIs measure the accuracy, completeness, freshness, and usability of the data that powers every aspect of the sales and marketing process. Poor data quality is the silent killer of go-to-market effectiveness — it causes misrouted leads, failed outreach, inaccurate forecasts, and wasted rep time. Research from Gartner estimates that poor data quality costs organizations an average of $12.9 million annually. For LeadReach, data quality is foundational because AI agents can only be as good as the data they operate on. These KPIs ensure that the data feeding LeadReach agents meets the quality standards necessary for reliable prospecting, scoring, and outreach.

## Data Completeness Score

Data completeness measures the percentage of required fields populated across CRM records. The formula: (Fields Populated / Total Required Fields) x 100. Benchmark: enterprise CRM completeness should exceed 85%, while mid-market should target 75%+. The most critical fields for B2B sales data completeness include: contact email (98%+ target), contact title/role (90%+), company industry (95%+), company revenue/size (80%+), and decision-maker identification (70%+). Data completeness directly impacts lead scoring accuracy, routing efficiency, and personalization capability. Organizations that implement real-time data validation and enrichment at point-of-entry achieve 90%+ completeness rates, compared to 55-65% for organizations relying on periodic data hygiene campaigns.

### Formula and Calculation Methodology

Data Completeness Score = (Fields Populated / Total Required Fields) × 100

Record-Level Completeness = (Populated Fields for Specific Record / Required Fields for Record Type) × 100

Database-Level Completeness = (Total Populated Fields Across All Records / Total Required Fields × Number of Records) × 100

Weighted Completeness = Σ(Field Weight × Field Population Status) / Σ(Field Weights) × 100

**Why weighted completeness matters:** Not all fields are equally important. A missing email address is far more impactful than a missing fax number. Weighted completeness scores prioritize business-critical fields.

### Field Priority and Completeness Targets

| Field Category | Example Fields | Priority Weight | Completeness Target | Business Impact if Missing |
|---------------|---------------|----------------|--------------------|---------------------------|
| Contact identity | Email, phone, full name | 30% | 95-99% | Cannot contact, cannot route |
| Contact role | Title, department, seniority | 20% | 85-95% | Cannot personalize, wrong messaging |
| Company firmographics | Industry, revenue, employee count | 15% | 85-95% | Cannot segment, cannot score |
| Company technographics | Tech stack, current vendor | 10% | 60-80% | Cannot identify displacement opps |
| Decision-making | Decision maker identified, buying committee | 10% | 65-80% | Cannot multi-thread, single-thread risk |
| Engagement history | Last activity, last touch, engagement score | 10% | 75-90% | Cannot prioritize, cannot time outreach |
| Opportunity data | Close date, amount, stage, next steps | 5% | 90-98% | Cannot forecast, cannot manage pipeline |

### Completeness by CRM Object

| Object Type | Critical Fields | Target Completeness | Common Gaps | Root Cause |
|------------|----------------|-------------------|-------------|-----------|
| Lead | Email, phone, company, title, source | 85-95% | Phone number, company size | Form design, manual entry skip |
| Contact | Email, title, phone, account link | 90-98% | Direct dial, department | Incomplete enrichment |
| Account | Industry, revenue, employees, territory | 85-95% | Technographics, hierarchy | Missing enrichment, no auto-link |
| Opportunity | Amount, close date, stage, next step | 90-98% | Close date, next step date | Rep data entry discipline |
| Activity | Type, date, outcome, linked records | 85-95% | Outcome, linked opportunity | Auto-log without categorization |

### Completeness Impact on Business Outcomes

| Completeness Level | Lead Scoring Accuracy | Routing Accuracy | Personalization Quality | Forecast Accuracy |
|-------------------|----------------------|-----------------|------------------------|-------------------|
| >90% | 85-95% accurate | 92-98% accurate | High (rich context) | 85-95% |
| 75-90% | 70-85% accurate | 80-92% accurate | Medium (some gaps) | 70-85% |
| 60-75% | 55-70% accurate | 65-80% accurate | Low (frequent generic) | 55-70% |
| <60% | 40-55% accurate | 45-65% accurate | Very Low (mostly generic) | 40-55% |

### Data Sources

- Primary: CRM data quality reports and field-level audit tools
- Supporting: Data enrichment platform for completeness benchmarking
- Enrichment: Data quality monitoring tools (RingLead, Insycle) for ongoing measurement
- LeadReach Agent: Real-time completeness scoring with automated enrichment for missing critical fields

### Diagnostic Framework: When Data Completeness Declines

When overall database completeness drops below 80% or a critical field category drops below its target:

1. **Field-level analysis** — Which specific fields are driving the completeness decline?
2. **Entry point audit** — Are new records entering with lower completeness than existing records?
3. **Data decay** — Are existing records becoming incomplete due to data decay (job changes, company changes)?
4. **Process gaps** — Are there missing validation rules or required field enforcement?
5. **Rep behavior** — Are reps skipping data entry for non-required fields?

| Completeness Pattern | Diagnosis | Action |
|---------------------|-----------|--------|
| New records have low completeness | Form/process issue at entry point | Update form requirements, add validation rules |
| Existing records declining | Data decay (job changes, etc.) | Implement ongoing enrichment, trigger-based updates |
| Specific fields consistently empty | Not required, not visible, not valued | Make critical fields required, add to key views |
| Uneven by rep/team | Process compliance issue | Training, CRM customization, gamification |

### LeadReach Agent Completeness Improvement

| Agent Function | Completeness Impact | Measurement |
|---------------|-------------------|-------------|
| Auto-enrichment at point of entry | Higher initial completeness | Completeness of new records with vs. without agent |
| Trigger-based data refresh | Slower data decay | Completeness retention over time with vs. without agent |
| Missing field identification | Proactive gap-filling | Fields enriched per record, completeness score improvement |
| CRM data validation | Fewer data quality issues | Validation error rate, correction rate |

## Data Accuracy Rate

Data accuracy measures the percentage of CRM data that is factually correct and current. Industry research estimates that B2B data decays at 2-3% per month for contact-level data (job changes, email changes) and 1-2% per month for company-level data (acquisitions, relocations, funding changes). This means a database that is 100% accurate today will be approximately 70% accurate after 12 months without maintenance. Key accuracy metrics include: email deliverability rate (target 95%+), phone connectivity rate (target 80%+), title accuracy (target 85%+), and company attribute accuracy (target 90%+). Organizations that implement continuous data verification — validating email deliverability at point of use, verifying company data on opportunity creation, and flagging potential job changes via LinkedIn integration — maintain accuracy rates 15-20% higher than those relying on annual batch updates.

### Formula and Calculation Methodology

Data Accuracy Rate = (Verified Correct Records / Total Verified Records) × 100

Email Accuracy = (Deliverable Emails / Total Emails Sent) × 100

Phone Accuracy = (Connected Calls / Total Call Attempts) × 100

Title Accuracy = (Current Titles / Verified Titles) × 100

Company Accuracy = (Current Company Attributes / Verified Company Data) × 100

**Verification methods:**
- Email: SMTP verification, bounce rate tracking, deliverability testing
- Phone: Call connection rate, DNC list cross-reference
- Title/role: LinkedIn profile cross-reference, self-reported data
- Company: Financial database verification, website verification, news cross-reference

### Data Decay Rates by Field Type

| Data Type | Monthly Decay Rate | Annual Decay Rate | Primary Decay Cause | Verification Frequency |
|----------|-------------------|-------------------|---------------------|----------------------|
| Contact email | 2-3% | 25-35% | Job change, email format change | Every use / quarterly batch |
| Contact phone | 2-4% | 25-40% | Job change, number change | Quarterly / before call campaign |
| Contact title | 3-5% | 30-50% | Promotion, role change, departure | Quarterly / LinkedIn monitoring |
| Company revenue | 1-2% | 12-25% | Financial changes, growth/decline | Semi-annually |
| Company employees | 1-2% | 12-25% | Hiring, layoffs, M&A | Quarterly |
| Company ownership | 0.5-1% | 6-12% | Acquisition, merger, IPO | Monthly trigger monitoring |
| Technology stack | 2-3% | 25-35% | Vendor switches, new deployments | Quarterly technographic refresh |

### Accuracy Benchmarks by Data Provider

| Data Type | Single-Source Provider | Multi-Source Aggregator | LeadReach Multi-Verified | Human-Verified |
|----------|----------------------|------------------------|-------------------------|---------------|
| Email (US) | 80-88% | 85-92% | 92-97% | 95-99% |
| Email (International) | 60-75% | 70-85% | 85-93% | 92-97% |
| Direct dial phone (US) | 60-80% | 70-85% | 82-90% | 88-95% |
| Direct dial (International) | 40-65% | 50-70% | 70-82% | 80-90% |
| Title/role | 70-85% | 75-88% | 85-92% | 90-95% |
| Company firmographics | 80-90% | 85-93% | 90-96% | 93-98% |

### Accuracy Impact on Sales Outcomes

| Accuracy Level | Email Bounce Rate | Call Connect Rate | Meeting Set Rate | Pipeline Quality |
|---------------|------------------|-------------------|-----------------|-----------------|
| >95% | <2% | 12-18% | 3-6% | High (minimal wasted effort) |
| 85-95% | 2-5% | 8-12% | 2-4% | Good (some wasted effort) |
| 75-85% | 5-10% | 5-8% | 1-3% | Moderate (significant waste) |
| <75% | >10% | <5% | <1% | Poor (majority of effort wasted) |

### Data Sources

- Primary: Email verification services (ZeroBounce, NeverBounce) for email accuracy
- Supporting: Phone verification services; LinkedIn for title/role verification
- Enrichment: Financial databases for company data verification
- LeadReach Agent: Multi-source verification at point of use, continuous accuracy monitoring

### Diagnostic Framework: When Data Accuracy Declines

When accuracy rates drop below benchmarks by 5+ percentage points:

1. **Source analysis** — Which data sources are producing inaccurate records?
2. **Decay acceleration** — Has data decay accelerated due to market conditions (high turnover)?
3. **Verification gaps** — When was the last comprehensive verification cycle?
4. **Entry validation** — Are new records being validated at the point of entry?
5. **Enrichment provider audit** — Is the enrichment provider's data quality declining?

| Accuracy Pattern | Diagnosis | Action |
|-----------------|-----------|--------|
| High email bounce rate | Email data decay or source issue | Email verification campaign, source audit |
| Low call connect rate | Phone data quality issue | Phone verification, DNC compliance check |
| Wrong titles/roles | Stale contact data | LinkedIn cross-reference, job change monitoring |
| Wrong company data | Company changes not tracked | Company monitoring triggers, financial data refresh |

### LeadReach Agent Accuracy Improvement

| Agent Function | Accuracy Impact | Measurement |
|---------------|----------------|-------------|
| Multi-source verification | Higher accuracy than single source | Accuracy rate comparison vs. single-source data |
| Real-time verification at point of use | Prevents outreach to bad data | Bounce rate on agent-verified vs. unverified data |
| Job change detection | Faster contact data updates | Days from job change to data update |
| Company event monitoring | Faster company data updates | Accuracy retention rate with vs. without monitoring |
| Bounce and failure tracking | Continuous accuracy feedback loop | Accuracy trend improvement over time |

## CRM Adoption Rate

CRM adoption measures the degree to which sales teams consistently and comprehensively use the CRM system. Key adoption metrics include: daily active users (target 85%+ of sales team), activity logging completeness (target 90%+ of activities logged), opportunity update frequency (target: opportunities updated at least weekly), and data entry timeliness (target: activities logged within 24 hours). Low CRM adoption creates a vicious cycle: incomplete data reduces the value of CRM reports and insights, which further reduces the motivation to use the system. High adoption is achieved through: making CRM the single source of truth for pipeline management, simplifying data entry (automation, mobile access, voice-to-text), providing training and coaching, and making CRM data actionable through dashboards and alerts that reps find genuinely useful.

### Formula and Calculation Methodology

CRM Daily Active User Rate = (Daily Active Users / Total Licensed Users) × 100

Activity Logging Rate = (Activities Logged in CRM / Total Actual Activities) × 100

Opportunity Update Frequency = Average days between opportunity updates

Data Entry Timeliness = % of activities logged within 24 hours of occurrence

CRM Data Quality Index = Composite of completeness, accuracy, and timeliness scores

### CRM Adoption Benchmarks

| Adoption Metric | Benchmark | Top Performer | Impact of Low Adoption |
|----------------|-----------|---------------|----------------------|
| Daily active user rate | 70-85% | 85-95% | Incomplete pipeline view, forecast inaccuracy |
| Activity logging completeness | 60-80% | 85-95% | Missing activity data, poor coaching data |
| Opportunity update frequency | Every 7-14 days | Every 3-5 days | Stale pipeline, missed risk signals |
| Data entry timeliness (<24 hrs) | 50-70% | 75-90% | Inaccurate real-time reporting |
| Required field completion | 75-85% | 90-98% | Data quality degradation |
| Mobile CRM usage | 30-45% | 50-70% | Post-meeting data entry gaps |
| Custom object usage | 40-60% | 70-90% | Incomplete business context |

### CRM Adoption by Role

| Role | Daily Login Rate | Activity Logging Rate | Opportunity Update Rate | Common Adoption Barriers |
|------|-----------------|----------------------|------------------------|-------------------------|
| SDR/BDR | 80-90% | 70-85% | N/A (no owned opps) | High activity volume, manual logging |
| Account Executive | 70-85% | 55-70% | 60-80% | Time pressure, see CRM as admin burden |
| Enterprise AE | 65-80% | 50-65% | 55-75% | Complex deals, less transactional logging |
| Sales Manager | 85-95% | 60-75% | N/A (reviews, doesn't own) | Dashboard dependency, coaching time |
| Sales Ops | 90-98% | 80-90% | N/A | Power user, system administrator |

### CRM Adoption Improvement Strategies

| Strategy | Adoption Impact | Implementation Effort | Time to Impact |
|----------|----------------|----------------------|----------------|
| Activity auto-logging | 20-35% improvement in logging rate | Medium | 1-3 months |
| Mobile CRM optimization | 15-25% improvement in timeliness | Medium | 2-4 months |
| Mandatory fields enforcement | 10-20% improvement in completeness | Low | Immediate |
| Gamification and leaderboards | 10-15% improvement in engagement | Low-Medium | 1-2 months |
| Manager inspection cadence | 15-25% improvement in update frequency | Low | 2-4 weeks |
| CRM-to-rep value (actionable insights) | 20-30% improvement in voluntary usage | High | 3-6 months |
| LeadReach agent auto-population | 30-50% improvement in completeness | Medium | 1-3 months |

### Data Sources

- Primary: CRM usage analytics (Salesforce Lightning Usage App, HubSpot Usage Reports)
- Supporting: Sales engagement platform for activity volume cross-reference
- Enrichment: Adoption tracking tools (WalkMe, Pendo) for feature-level usage
- LeadReach Agent: CRM adoption monitoring with automated data entry assistance

### Diagnostic Framework: When CRM Adoption Is Low

When adoption metrics fall below benchmarks across the team:

1. **Value perception** — Do reps see CRM as helpful or as administrative overhead?
2. **Usability audit** — Is the CRM configuration overly complex or poorly designed for rep workflows?
3. **Training gaps** — Do reps know how to use CRM effectively and efficiently?
4. **Management enforcement** — Are managers inspecting CRM data quality and holding reps accountable?
5. **Automation opportunity** — What manual data entry can be automated?

| Adoption Pattern | Diagnosis | Action |
|-----------------|-----------|--------|
| Low login rate | Value perception problem | Make CRM essential with actionable alerts and insights |
| Low activity logging | Manual burden problem | Auto-logging, activity capture tools, LeadReach integration |
| Infrequent opportunity updates | Discipline or complexity problem | Required updates, simplified update process |
| Poor data quality | Training or validation problem | Required field enforcement, real-time validation, training |

### LeadReach Agent CRM Adoption Enhancement

| Agent Function | Adoption Impact | Measurement |
|---------------|----------------|-------------|
| Auto-populate CRM fields | Reduces manual data entry | Fields auto-populated per record, rep time saved |
| Activity auto-logging | Eliminates logging burden | % of activities auto-logged, logging rate improvement |
| Smart alerts and insights | Makes CRM more valuable to reps | Alert click-through rate, insight utilization |
| Data validation at entry | Improves data quality | Validation error reduction, completeness improvement |

## Data Duplication and Hygiene

Duplicate records and poor data hygiene create significant operational problems: wasted outreach (contacting the same person multiple times), inaccurate reporting (inflated counts), and poor user experience (conflicting information).

### Duplication KPIs

| Metric | Formula | Benchmark | Target |
|--------|---------|-----------|--------|
| Duplicate rate | (Duplicate Records / Total Records) × 100 | 5-15% | <3% |
| Merge resolution time | Average days from duplicate detection to merge | 7-30 days | <3 days |
| False positive rate | % of detected duplicates that aren't true duplicates | 15-30% | <10% |
| Auto-merge confidence | % of duplicates auto-merged without human review | 30-50% | 60-80% |

### Data Hygiene Schedule

| Hygiene Activity | Frequency | Scope | Automation Level | LeadReach Agent Role |
|-----------------|-----------|-------|-----------------|---------------------|
| Email verification | Continuous (at point of use) + quarterly batch | All contact emails | Fully automated | Real-time verification during prospecting |
| Phone verification | Quarterly | All phone numbers | Semi-automated | Batch verification + pre-call verification |
| Duplicate detection and merge | Daily scan | All records | Automated detection, manual merge | Auto-merge for high-confidence duplicates |
| Stale record identification | Weekly | Records with no activity >90 days | Fully automated | Flag for archive, re-engage, or enrich |
| Company data refresh | Monthly trigger + quarterly batch | All accounts | Semi-automated | Trigger-based refresh on company events |
| Job change monitoring | Weekly | All key contacts | Automated detection | LinkedIn monitoring + auto-enrichment |
| Compliance screening | Monthly | All records | Semi-automated | DNC, opt-out, GDPR compliance check |

## Data Governance and Compliance

Data governance ensures that data management practices comply with regulations (GDPR, CCPA, CAN-SPAM) and organizational policies.

### Compliance KPIs

| Metric | Target | Measurement Frequency | Risk if Non-Compliant |
|--------|--------|----------------------|----------------------|
| Opt-out honor rate | 100% | Real-time monitoring | Legal liability, reputation damage |
| DNC compliance rate | 100% | Pre-call verification | Regulatory fines |
| GDPR consent documentation | 95%+ documented | Monthly audit | Significant fines (up to 4% revenue) |
| Data retention compliance | 100% per policy | Quarterly audit | Legal liability, storage costs |
| Right-to-deletion response rate | 100% within 30 days | Per request tracking | Regulatory fines |
| Data processing agreement coverage | 100% of vendors | Annual review | Contractual liability |

### LeadReach Agent Compliance Capabilities

| Agent Function | Compliance Impact | Measurement |
|---------------|------------------|-------------|
| Real-time opt-out checking | Prevents outreach to opted-out contacts | Opt-out violation rate (target: 0) |
| DNC pre-call screening | Prevents calls to DNC numbers | DNC violation rate (target: 0) |
| Consent tracking | Maintains consent documentation | Consent documentation coverage |
| Automated data retention | Enforces data retention policies | Policy compliance rate |
| Right-to-deletion automation | Faster response to deletion requests | Deletion request response time |

## Implementation Guide for LeadReach Agents

### Daily Data Quality Agent Routines

1. **Data completeness scoring:** Calculate completeness scores for records accessed or created today
2. **Accuracy verification:** Verify email deliverability and phone connectivity for records used in outreach
3. **Duplicate detection:** Scan for and flag potential duplicate records
4. **Compliance checking:** Verify opt-out status and DNC compliance before any outreach

### Weekly Data Quality Agent Reports

1. **Completeness trend report:** Database completeness by object type with week-over-week movement
2. **Accuracy metrics update:** Email bounce rate, call connect rate, title accuracy trends
3. **CRM adoption scorecard:** Daily active user rate, activity logging rate, update frequency
4. **Duplicate detection summary:** New duplicates detected, merges completed, false positive rate
5. **Compliance status dashboard:** Opt-out processing, DNC compliance, consent documentation

### Monthly Data Quality Deep Dives

1. **Data decay analysis:** Accuracy degradation by data type and time since last verification
2. **Source quality audit:** Accuracy and completeness by data source (manual entry, enrichment, imports)
3. **CRM adoption correlation:** Relationship between adoption metrics and business outcomes
4. **Data governance review:** Compliance metrics, policy adherence, risk assessment
5. **ROI of data quality investment:** Impact of data quality improvements on sales outcomes

## Complete Data Quality KPI Inventory

| # | KPI | Formula | Benchmark | Top Performer | Diagnostic Threshold |
|---|-----|---------|-----------|---------------|---------------------|
| 1 | Data Completeness | Fields Populated / Total Required × 100 | 75-85% | 90-98% | <70% = significant gaps |
| 2 | Data Accuracy | Verified Correct / Total Verified × 100 | 80-90% | 92-97% | <75% = unreliable data |
| 3 | Data Freshness | % of records verified within SLA period | 60-75% | 80-95% | <50% = stale data risk |
| 4 | Deduplication Rate | Duplicate Records / Total Records × 100 | 5-15% (dupes exist) | <3% | >15% = hygiene problem |
| 5 | Standardization Rate | Records matching format standards / Total × 100 | 70-85% | 90-98% | <65% = inconsistency problem |
| 6 | Enrichment Coverage | Records enriched with 3rd party data / Total × 100 | 40-60% | 70-90% | <30% = shallow data |
| 7 | Email Bounce Rate | Bounced Emails / Emails Sent × 100 | 2-5% | <2% | >5% = email quality crisis |
| 8 | Email Deliverability | Inbox Placed / Sent × 100 | 80-90% | >90% | <75% = sender reputation risk |
| 9 | Field Completion Rate | Required fields populated / Required fields × 100 per record | 80-90% | 92-98% | <75% = entry process gaps |
| 10 | Record Health Score | Composite of completeness + accuracy + freshness per record | 70-85 | 85-95 | <65 = unhealthy record |
| 11 | Phone Connectivity | Connected calls / Total attempts × 100 | 7-12% | 12-18% | <5% = phone data quality issue |
| 12 | Job Change Detection Rate | Job changes detected within 30 days / Total job changes | 30-50% | 60-80% | <25% = stale contact data |

## Data Quality Framework

The Data Quality Framework provides a structured approach to measuring, managing, and improving data quality across all CRM objects and data sources. It defines six dimensions of data quality, each with specific metrics, ownership, and remediation processes.

### Six Dimensions of Data Quality

| Dimension | Definition | Key Metrics | Weight in Overall Score | Primary Owner | LeadReach Agent Role |
|-----------|-----------|------------|------------------------|--------------|---------------------|
| Completeness | All required fields are populated | Field completion rate, object-level completeness | 25% | RevOps / Data Team | Scout auto-enriches missing fields |
| Accuracy | Data is factually correct and current | Verification rate, email deliverability, phone connectivity | 25% | RevOps / Enrichment Provider | Scout multi-source verification |
| Freshness | Data is recent and within verification SLA | Last verified date, data age distribution | 20% | RevOps / CS | Scout trigger-based data refresh |
| Consistency | Data follows standard formats and no conflicts | Standardization rate, deduplication rate | 15% | RevOps / Data Team | Scout auto-standardization |
| Uniqueness | No duplicate or redundant records | Duplicate rate, merge resolution time | 10% | RevOps / Data Team | Scout auto-dedup detection |
| Validity | Data conforms to defined business rules | Validation error rate, format compliance | 5% | RevOps / Engineering | Scout real-time validation |

### Data Quality Score Calculation

Overall Data Quality Score = (Completeness × 0.25) + (Accuracy × 0.25) + (Freshness × 0.20) + (Consistency × 0.15) + (Uniqueness × 0.10) + (Validity × 0.05)

| Score Range | Grade | Description | Business Impact | Recommended Action |
|------------|-------|------------|----------------|-------------------|
| 90-100 | A (Excellent) | High-quality, reliable data | Optimal sales/marketing operations | Maintain with ongoing monitoring |
| 80-89 | B (Good) | Minor gaps, mostly reliable | Minor inefficiencies, some misrouted leads | Target specific weak dimensions |
| 70-79 | C (Fair) | Noticeable gaps, partially reliable | Moderate waste, reduced personalization | Systematic improvement program |
| 60-69 | D (Poor) | Significant issues, limited reliability | Major waste, poor forecasting, low trust | Urgent remediation program |
| <60 | F (Critical) | Unreliable data, widespread issues | Severe business impact, decisions based on bad data | Emergency data quality intervention |

## CRM Hygiene Scorecards

CRM hygiene scorecards provide a structured, regular assessment of data quality at the object, team, and organizational level. They create accountability and visibility into data quality trends.

### Weekly CRM Hygiene Scorecard Template

| Metric | Target | Current | Trend (↑↓→) | Owner | Status |
|--------|--------|---------|-------------|-------|--------|
| Overall completeness | 85%+ | — | — | RevOps | 🟢🟡🔴 |
| Email accuracy (bounce rate) | <3% | — | — | RevOps | 🟢🟡🔴 |
| Phone accuracy (connect rate) | 7%+ | — | — | RevOps | 🟢🟡🔴 |
| Duplicate rate | <5% | — | — | RevOps | 🟢🟡🔴 |
| Stale record count (>90 days no activity) | <15% | — | — | CS/Ops | 🟢🟡🔴 |
| Opportunity close date validity | 80%+ valid | — | — | Sales Mgmt | 🟢🟡🔴 |
| Required field completion (opportunities) | 95%+ | — | — | Sales Mgmt | 🟢🟡🔴 |
| CRM daily active user rate | 85%+ | — | — | Sales Mgmt | 🟢🟡🔴 |

### Monthly CRM Hygiene Scorecard by Team

| Team | Completeness | Accuracy | Freshness | Dedupe | Overall Score | Grade | Top Issue |
|------|-------------|---------|----------|--------|--------------|-------|-----------|
| SDR Team | — | — | — | — | — | — | — |
| Mid-Market AE | — | — | — | — | — | — | — |
| Enterprise AE | — | — | — | — | — | — | — |
| CS / AM | — | — | — | — | — | — | — |
| Marketing | — | — | — | — | — | — | — |
| **Organization** | — | — | — | — | — | — | — |

### Quarterly Data Quality Trend Report

| Dimension | Q1 Score | Q2 Score | Q3 Score | Q4 Score | Trend | Target | Gap to Target |
|-----------|---------|---------|---------|---------|-------|--------|--------------|
| Completeness | — | — | — | — | — | 90% | — |
| Accuracy | — | — | — | — | — | 92% | — |
| Freshness | — | — | — | — | — | 85% | — |
| Consistency | — | — | — | — | — | 90% | — |
| Uniqueness | — | — | — | — | — | 97% | — |
| Validity | — | — | — | — | — | 95% | — |
| **Overall** | — | — | — | — | — | **90** | — |

## Data Remediation Workflows

When data quality issues are identified, structured remediation workflows ensure they are addressed systematically and within defined SLAs. The following workflows cover the most common remediation scenarios.

### Remediation Workflow: Incomplete Records

| Step | Action | Owner | SLA | Automation Level | LeadReach Scout Role |
|------|--------|-------|-----|-----------------|---------------------|
| 1. Detection | Flag records with completeness below 70% | Scout / RevOps | Real-time | Fully automated | Scout continuous monitoring |
| 2. Auto-enrichment | Attempt to fill missing fields from enrichment sources | Scout | Within 1 hour | Fully automated | Scout auto-enrichment from data providers |
| 3. Manual review | Review records that couldn't be auto-enriched | RevOps / Rep | Within 24 hours | Semi-automated | Scout creates review queue with priority ranking |
| 4. Rep assignment | Assign records requiring rep input (relationship data) | Manager | Within 48 hours | Manual | Scout identifies rep-assigned fields |
| 5. Validation | Verify enrichment and manual updates are correct | RevOps | Within 72 hours | Semi-automated | Scout spot-checks auto-enriched data |
| 6. Monitoring | Track completeness score improvement | RevOps | Ongoing | Automated | Scout continuous score tracking |

### Remediation Workflow: Inaccurate Records

| Step | Action | Owner | SLA | Automation Level | LeadReach Scout Role |
|------|--------|-------|-----|-----------------|---------------------|
| 1. Detection | Bounce, failed call, or verification failure flags inaccuracy | System / Scout | Real-time | Fully automated | Scout monitors all signal sources |
| 2. Verification | Verify inaccuracy through multiple sources | Scout | Within 1 hour | Fully automated | Scout multi-source verification |
| 3. Correction | Update record with verified correct data | Scout / RevOps | Within 4 hours | Mostly automated | Scout auto-corrects from verified sources |
| 4. Fallback | If no verified correction, flag for manual research | RevOps | Within 24 hours | Semi-automated | Scout creates research queue |
| 5. Archive | If record cannot be verified after 7 days, move to archive | RevOps | 7 days | Automated | Scout auto-archives unverified records |
| 6. Pattern analysis | Identify sources producing inaccurate data | RevOps | Monthly | Semi-automated | Scout source quality analytics |

### Remediation Workflow: Duplicate Records

| Step | Action | Owner | SLA | Automation Level | LeadReach Scout / Judge Role |
|------|--------|-------|-----|-----------------|---------------------------|
| 1. Detection | Identify potential duplicates via matching algorithm | Scout | Real-time | Fully automated | Scout fuzzy matching + ML scoring |
| 2. Confidence scoring | Score duplicate confidence (high/medium/low) | Scout | Real-time | Fully automated | Judge confidence scoring model |
| 3. Auto-merge | Auto-merge high-confidence duplicates (score >95%) | Scout | Within 1 hour | Fully automated | Judge-supervised auto-merge |
| 4. Manual review | Queue medium-confidence duplicates for review | RevOps | Within 48 hours | Semi-automated | Scout presents side-by-side comparison |
| 5. Merge execution | Execute manual merge with field selection | RevOps | Within 72 hours | Manual (assisted) | Scout suggests which fields to keep |
| 6. False positive tracking | Track false positive rate and adjust matching | RevOps | Monthly | Semi-automated | Judge model refinement from feedback |
| 7. Prevention | Implement real-time duplicate prevention at point of entry | Engineering | Ongoing | Automated | Scout pre-entry duplicate checking |

### Data Quality SLAs by Object Type

| Object | Completeness SLA | Accuracy SLA | Freshness SLA | Dedupe SLA | Review Frequency |
|--------|-----------------|-------------|--------------|-----------|-----------------|
| Lead | 85%+ within 24 hrs of creation | 90%+ email accuracy | Verified within 30 days | <3% duplicate rate | Weekly |
| Contact | 90%+ within 48 hrs of creation | 92%+ email accuracy | Verified within 60 days | <2% duplicate rate | Weekly |
| Account | 85%+ within 72 hrs of creation | 90%+ firmographic accuracy | Refreshed within 90 days | <2% duplicate rate | Monthly |
| Opportunity | 95%+ within 24 hrs of creation | 95%+ data accuracy | Updated within 7 days | <1% duplicate rate | Weekly |
| Activity | 90%+ auto-logged | N/A | Real-time logging | <5% duplicate activities | Daily |

## LeadReach Scout Data Quality Measurement Points

Scout serves as the primary agent for data quality monitoring, verification, and remediation across the LeadReach platform.

| Scout Measurement Point | What It Tracks | How It's Measured | Optimization Action |
|------------------------|---------------|-------------------|-------------------|
| Real-time completeness scoring | Field-level completeness on every record access | Scout completeness engine | Auto-enrich missing fields before rep sees record |
| Multi-source verification | Accuracy verification from 3+ data providers | Scout verification pipeline | Use highest-confidence source, flag conflicts |
| Freshness monitoring | Time since last verification per record | Scout freshness tracker | Trigger re-verification at SLA thresholds |
| Duplicate detection | Real-time duplicate scoring at point of entry | Scout matching engine | Prevent duplicates before they enter CRM |
| Standardization enforcement | Format compliance for all data fields | Scout validation engine | Auto-standardize non-compliant data |
| Bounce and failure tracking | Email bounce and call failure events | Scout signal pipeline | Auto-update records on failure, prevent reuse |
| Record health scoring | Composite health score per record | Scout scoring model | Prioritize remediation by health score |
| Source quality analytics | Accuracy and completeness by data source | Scout source analytics | Deprioritize low-quality sources, invest in high-quality |

## LeadReach Judge Data Quality Measurement Points

Judge provides data quality assessment at the analytical and strategic level, identifying patterns, predicting quality degradation, and recommending systemic improvements.

| Judge Measurement Point | What It Tracks | How It's Measured | Optimization Action |
|------------------------|---------------|-------------------|-------------------|
| Data quality trend analysis | Score trends over time by dimension and object | Judge trend analytics | Identify degrading dimensions, intervene proactively |
| Predictive quality degradation | Forecast which records/segments will degrade | Judge ML model | Pre-emptively refresh data before degradation impacts operations |
| Source ROI analysis | Data quality ROI per enrichment source | Judge cost-benefit analytics | Optimize enrichment spending toward highest-ROI sources |
| Impact correlation | Data quality vs. business outcome correlation | Judge correlation engine | Quantify data quality business impact for investment justification |
| Anomaly detection | Unusual patterns in data quality metrics | Judge anomaly detection | Identify and investigate quality anomalies quickly |
| Quality-to-revenue attribution | Revenue impact of data quality improvements | Judge attribution model | Demonstrate data quality ROI to leadership |

## Data Quality Business Impact Quantification

| Data Quality Issue | Annual Cost Estimate (per 100K records) | Calculation Method | Prevention Cost | ROI of Prevention |
|-------------------|----------------------------------------|-------------------|----------------|-------------------|
| Wasted outreach (bad email/phone) | $50-150K | Failed outreach × cost per touch | $10-30K (verification) | 3-8x |
| Misrouted leads | $30-80K | Misrouted leads × missed conversion value | $5-15K (routing rules) | 3-6x |
| Inaccurate forecasting | $100-500K+ | Forecast miss × operational cost | $20-50K (data quality program) | 3-10x |
| Duplicate records | $15-40K | Duplicate handling time × labor cost | $5-15K (dedupe tool) | 2-4x |
| Lost rep productivity | $75-200K | Hours wasted on bad data × rep cost | $15-40K (auto-enrichment) | 3-6x |
| Compliance risk | $50K-2M+ (potential) | Regulatory fine exposure | $10-30K (compliance automation) | 5-50x+ |
| **Total estimated annual cost of poor data quality** | **$320K-3M+** | **Sum of all issues** | **$65-180K** | **3-12x** |

## Visualization Recommendations

| KPI | Recommended Visualization | Key Insights |
|-----|--------------------------|-------------|
| Data completeness | Stacked bar by field category with target line | Field-level gaps and improvement areas |
| Data accuracy | Line chart by data type over time | Accuracy decay and refresh effectiveness |
| CRM adoption | Heatmap (metric × team/rep) | Adoption patterns and problem areas |
| Duplication rate | Trend line with merge volume overlay | Duplicate creation vs. resolution rate |
| Data decay | Scatter plot (record age vs. accuracy) | Decay rate by record vintage |
| Compliance | Gauge chart per regulation with target | Compliance status at a glance |
| Data quality framework | Radar chart (6 dimensions) | Quality balance across dimensions |
| Record health distribution | Histogram with grade zones | How many records at each quality level |
| Source quality comparison | Grouped bar (source × accuracy × completeness) | Which sources produce best data |
| Remediation pipeline | Funnel chart (detected → enriched → verified → closed) | Remediation throughput and bottlenecks |
| Business impact | Waterfall chart (cost of each quality issue) | Where poor data quality costs most |
