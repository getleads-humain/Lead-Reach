---
title: Intent Signal Taxonomy
category: dataset
dataset_type: intent-signals
grade: B
last_reviewed: 2026-07-10
tags: [dataset, intent-signals, data-standards, taxonomy]
---

# Intent Signal Taxonomy

The intent signal taxonomy classifies the various indicators that a prospect is actively researching or considering a purchase. This document provides the complete classification hierarchy, field definitions, signal scoring methodology, data source mappings, buying journey stage mapping, quality benchmarks, and LeadReach agent consumption patterns for all intent signals.

## 1. Signal Source Classification

### 1.1 First-Party Intent Signals

First-party intent signals are generated from direct engagement with a LeadReach customer's digital properties. These are the highest-confidence signals because they indicate direct interest in the customer's specific solution.

| Signal Type | Signal Code | Description | Typical Volume | Confidence Level |
|------------|------------|-------------|----------------|-----------------|
| Website Visit | FP-WEB-01 | Visit to customer website from corporate IP | High | Medium |
| Pricing Page View | FP-WEB-02 | Visit to pricing or plans page | Low | Very High |
| Product Demo Request | FP-WEB-03 | Submitted demo request form | Very Low | Very High |
| Free Trial Signup | FP-WEB-04 | Created free trial or freemium account | Low | Very High |
| Content Download | FP-WEB-05 | Downloaded whitepaper, ebook, or guide | Medium | Medium-High |
| Webinar Registration | FP-WEB-06 | Registered for webinar or event | Medium | Medium-High |
| Webinar Attendance | FP-WEB-07 | Attended webinar (not just registered) | Low-Medium | High |
| Case Study View | FP-WEB-08 | Viewed customer case study page | Low-Medium | High |
| ROI Calculator Use | FP-WEB-09 | Used interactive ROI calculator | Low | Very High |
| API Documentation View | FP-WEB-10 | Viewed API docs or developer resources | Low-Medium | High (technical buyer) |
| Security Documentation View | FP-WEB-11 | Viewed SOC 2, compliance, or security page | Low | Very High (enterprise) |
| Contact Sales Click | FP-WEB-12 | Clicked "Contact Sales" but didn't submit | Low | High |
| Blog Subscriptions | FP-WEB-13 | Subscribed to blog or newsletter | Medium | Low-Medium |
| Comparison Page View | FP-WEB-14 | Viewed competitor comparison page | Low | Very High |
| Integration Page View | FP-WEB-15 | Viewed integration or marketplace page | Low-Medium | High (evaluation stage) |

**First-Party Signal Scoring:**

| Signal | Base Score | Recency Multiplier | Specificity Bonus |
|--------|-----------|-------------------|------------------|
| Pricing page view | 85 | ×1.0 (7d), ×0.7 (30d), ×0.4 (90d) | +10 if from enterprise IP |
| Demo request | 95 | ×1.0 (7d), ×0.8 (30d), ×0.5 (90d) | +5 if matching ICP |
| Free trial signup | 90 | ×1.0 (7d), ×0.9 (30d), ×0.7 (90d) | +10 if team signup |
| Content download | 55 | ×1.0 (7d), ×0.6 (30d), ×0.3 (90d) | +10 if bottom-funnel content |
| Webinar attendance | 70 | ×1.0 (7d), ×0.7 (30d), ×0.4 (90d) | +5 if stayed >30 min |
| Website visit (generic) | 25 | ×1.0 (7d), ×0.5 (30d), ×0.2 (90d) | +5 if multiple pages |
| ROI calculator | 80 | ×1.0 (7d), ×0.8 (30d), ×0.5 (90d) | +15 if completed all fields |
| Security docs | 75 | ×1.0 (7d), ×0.8 (30d), ×0.5 (90d) | +10 if from IT/security role |
| API docs | 65 | ×1.0 (7d), ×0.7 (30d), ×0.4 (90d) | +10 if from developer role |

### 1.2 Second-Party Intent Signals

Second-party intent signals come from partner networks and co-operative data sharing arrangements. These indicate research behavior across a category, not necessarily about a specific vendor.

| Signal Type | Signal Code | Description | Provider | Confidence Level |
|------------|------------|-------------|----------|-----------------|
| Category Research Surge | SP-CAT-01 | Increased research activity in product category | Bombora | Medium-High |
| Topic Consumption | SP-CAT-02 | Consuming content on specific topics | Bombora | Medium |
| Competitor Research | SP-COMP-01 | Researching competitor products | 6sense, Bombora | High |
| Review Site Activity | SP-REV-01 | Reading/comparing reviews on G2, Capterra | G2, TrustRadius | High |
| Community Discussion | SP-COMM-01 | Active in relevant online communities | Reddit, StackShare | Medium |
| Event Attendance | SP-EVT-01 | Attended industry event or conference | Event partners | Medium |
| Publication Engagement | SP-PUB-01 | Engaging with industry publications | Publisher networks | Low-Medium |

**Second-Party Signal Scoring:**

| Signal | Base Score | Recency Multiplier | Specificity Bonus |
|--------|-----------|-------------------|------------------|
| Category surge (3+ topics) | 60 | ×1.0 (7d), ×0.6 (30d), ×0.3 (90d) | +10 if surge >3x baseline |
| Competitor research | 70 | ×1.0 (7d), ×0.7 (30d), ×0.4 (90d) | +15 if researching 2+ competitors |
| Review site activity | 65 | ×1.0 (7d), ×0.6 (30d), ×0.3 (90d) | +10 if wrote a review |
| Event attendance | 45 | ×1.0 (7d), ×0.5 (30d), ×0.2 (90d) | +5 if booth visit confirmed |
| Community discussion | 40 | ×1.0 (7d), ×0.5 (30d), ×0.2 (90d) | +5 if asking purchase questions |
| Publication engagement | 35 | ×1.0 (7d), ×0.4 (30d), ×0.1 (90d) | +5 if multiple articles |

### 1.3 Third-Party Intent Signals

Third-party intent signals are observable market events that indicate a company may be in a buying cycle. These are lower specificity but high value when corroborated with other signals.

| Signal Type | Signal Code | Description | Source | Confidence Level |
|------------|------------|-------------|--------|-----------------|
| Funding Round | TP-FUND-01 | Announced new funding round | Crunchbase, PitchBook | Medium-High |
| M&A Activity | TP-MA-01 | Acquired or being acquired | Press releases, SEC filings | Medium |
| Executive Hire | TP-EXEC-01 | New C-level or VP hire | LinkedIn, press releases | Medium-High |
| Job Postings | TP-JOB-01 | Relevant job postings (e.g., "CRM manager") | Indeed, LinkedIn, Glassdoor | Medium |
| Product Launch | TP-PROD-01 | New product or major feature launch | Press releases, product blogs | Low-Medium |
| Office Expansion | TP-OFC-01 | New office or facility opening | Press, LinkedIn, permit filings | Medium |
| Contract Renewal | TP-CONT-01 | Incumbent vendor contract renewal date | Procurement databases, estimates | Medium-High |
| Regulatory Change | TP-REG-01 | New regulation affecting technology needs | Legal databases, government | Medium |
| Budget Approval | TP-BUD-01 | Public budget approval for technology spend | Government: public records; Private: estimated | Medium |
| Partnership Announcement | TP-PART-01 | Strategic partnership with tech company | Press releases | Low-Medium |
| Award/Recognition | TP-AWARD-01 | Industry award or ranking change | Award organizations | Low |
| Conference Speaking | TP-SPK-01 | Executive speaking at industry conference | Conference agendas | Low-Medium |

**Third-Party Signal Scoring:**

| Signal | Base Score | Recency Multiplier | Specificity Bonus |
|--------|-----------|-------------------|------------------|
| Funding round (Series B+) | 65 | ×1.0 (30d), ×0.7 (90d), ×0.4 (180d) | +10 if >$20M raised |
| New CTO/VP hire | 60 | ×1.0 (30d), ×0.6 (90d), ×0.3 (180d) | +10 if ICP-matching role |
| Relevant job postings | 50 | ×1.0 (7d), ×0.5 (30d), ×0.2 (90d) | +10 if 3+ relevant postings |
| Contract renewal (incumbent) | 55 | ×1.0 (90d before), ×0.7 (180d before) | +10 if negative sentiment detected |
| M&A activity | 55 | ×1.0 (30d), ×0.5 (90d), ×0.2 (180d) | +10 if integration challenges reported |
| Office expansion | 40 | ×1.0 (30d), ×0.5 (90d), ×0.2 (180d) | +5 if new geography |
| Product launch | 35 | ×1.0 (7d), ×0.3 (30d), ×0.1 (90d) | +5 if complementary to customer |
| Regulatory change | 45 | ×1.0 (effective date - 180d), ×0.5 (post-effective) | +10 if compliance deadline |

## 2. Signal Strength Scoring

### 2.1 Composite Signal Strength Model

Each account accumulates intent signals over time. The composite signal strength is calculated as:

```
Account_Intent_Score = Σ (signal_base_score × recency_multiplier × specificity_bonus) / signal_count_normalizer
```

With the following adjustments:
- **Corroboration bonus**: If 3+ signals from different categories within 30 days, apply ×1.3 multiplier
- **Recency decay**: All signals decay over time following the recency multipliers above
- **Duplicate suppression**: Same signal type from same source within 7 days counts only once
- **Source confidence weighting**: First-party ×1.0, Second-party ×0.8, Third-party ×0.6

### 2.2 Signal Strength Scale

| Score Range | Label | Description | Recommended Action |
|------------|-------|-------------|-------------------|
| 90-100 | Critical Intent | Multiple high-confidence signals, active buying behavior | Immediate AE outreach, 4-hour SLA |
| 80-89 | Strong Intent | Multiple signals from different categories, likely in evaluation | AE outreach within 24 hours |
| 70-79 | Moderate Intent | Several signals suggesting active research | SDR outreach within 48 hours |
| 60-69 | Emerging Intent | Initial signals, early research phase | SDR outreach within 1 week |
| 50-59 | Low Intent | Scattered signals, unclear timing | Automated nurture sequence |
| 40-49 | Minimal Intent | Weak signals, possible but not probable | Long-term nurture, monitor for escalation |
| 0-39 | No Intent | No detectable buying signals | Exclude from active outreach |

### 2.3 Recency Scoring Framework

| Time Window | Score Range | Multiplier | Rationale |
|------------|-----------|-----------|-----------|
| 0-7 days | 80-100 | ×1.0 | Signal is fresh, buying window is open |
| 8-30 days | 50-79 | ×0.5-0.8 | Signal is recent, window may still be open |
| 31-90 days | 20-49 | ×0.2-0.4 | Signal is aging, window may be closing |
| 91+ days | 0-19 | ×0.0-0.1 | Signal is stale, likely no longer relevant |

### 2.4 Specificity Scoring

| Specificity Level | Score Range | Description | Examples |
|------------------|-----------|-------------|---------|
| Category-Specific | 80-100 | Researching the exact product category | Viewing pricing pages, requesting demos |
| Category-Adjacent | 50-79 | Researching related categories | Reading industry reports, attending webinars |
| General Business | 20-49 | General business research | Hiring, funding, office expansion |
| Tangential | 0-19 | Loosely related signals | Following industry news, social media engagement |

### 2.5 Corroboration Scoring

| Corroboration Level | Multiplier | Description | Example |
|--------------------|-----------|-------------|---------|
| Single Signal | ×1.0 | Only one signal detected | One website visit |
| Same-Category Corroboration | ×1.2 | Multiple signals of same type | 3 website visits in 7 days |
| Cross-Category Corroboration | ×1.5 | Signals from different categories | Website visit + competitor research + job posting |
| Multi-Source Corroboration | ×1.8 | Signals from different source types (1st + 2nd + 3rd party) | Pricing page view + category surge + funding round |
| Full Corroboration | ×2.0 | High-confidence signals across all three source types | Demo request + review site activity + new CTO hire |

## 3. Buying Journey Stage Mapping

### 3.1 Stage Definitions

| Stage | Code | Description | Typical Duration | Key Signals | LeadReach Agent Action |
|-------|------|-------------|-----------------|-------------|----------------------|
| Unaware | JOURNEY-0 | Not aware of problem or solution | Indefinite | No signals | No outreach (monitor only) |
| Problem Aware | JOURNEY-1 | Aware of problem but not researching solutions | 1-3 months | General business content, industry research | Educational nurture (Atlas + Bard) |
| Solution Aware | JOURNEY-2 | Researching solution categories | 1-2 months | Category research, content downloads, webinar attendance | Category education + soft introduction (Bard) |
| Active Evaluation | JOURNEY-3 | Actively evaluating specific vendors | 1-3 months | Competitor comparison, pricing page, demo requests, review sites | Active outreach + competitive differentiation (Bard + Sage) |
| Decision Imminent | JOURNEY-4 | Ready to make a purchase decision | 2-6 weeks | Security review, procurement activity, contract terms review | Urgent outreach + executive engagement (AE + Bard) |
| Purchasing | JOURNEY-5 | In procurement/contract process | 2-8 weeks | Legal review, security questionnaire, vendor references | Deal support + reference coordination (Flow + AE) |
| Post-Purchase | JOURNEY-6 | Has purchased, in implementation/expansion | Ongoing | Onboarding activity, feature adoption, expansion signals | Customer success handoff (Flow) |

### 3.2 Signal-to-Stage Mapping Matrix

| Signal | JOURNEY-0 | JOURNEY-1 | JOURNEY-2 | JOURNEY-3 | JOURNEY-4 | JOURNEY-5 |
|--------|-----------|-----------|-----------|-----------|-----------|-----------|
| FP-WEB-01 (Website visit) | | ✦ | ✦✦ | ✦✦✦ | ✦✦ | ✦ |
| FP-WEB-02 (Pricing page) | | | | ✦✦✦ | ✦✦✦ | ✦✦ |
| FP-WEB-03 (Demo request) | | | | ✦✦✦ | ✦✦✦ | ✦✦ |
| FP-WEB-05 (Content download) | | ✦ | ✦✦✦ | ✦✦ | ✦ | |
| FP-WEB-06 (Webinar reg) | | ✦ | ✦✦ | ✦✦ | ✦ | |
| FP-WEB-09 (ROI calculator) | | | ✦ | ✦✦✦ | ✦✦✦ | ✦✦ |
| FP-WEB-11 (Security docs) | | | | ✦ | ✦✦✦ | ✦✦✦ |
| FP-WEB-14 (Comparison page) | | | | ✦✦✦ | ✦✦ | ✦ |
| SP-CAT-01 (Category surge) | | ✦ | ✦✦✦ | ✦✦ | ✦ | |
| SP-COMP-01 (Competitor research) | | | ✦ | ✦✦✦ | ✦✦ | ✦ |
| SP-REV-01 (Review activity) | | | ✦ | ✦✦✦ | ✦✦ | ✦ |
| TP-FUND-01 (Funding) | ✦ | ✦✦ | ✦ | | | |
| TP-EXEC-01 (New exec) | ✦ | ✦ | ✦✦ | ✦ | | |
| TP-JOB-01 (Job postings) | | ✦ | ✦✦ | ✦ | | |
| TP-CONT-01 (Renewal) | | | | ✦✦ | ✦✦✦ | |

*(✦ = weak indicator, ✦✦ = moderate indicator, ✦✦✦ = strong indicator for that stage)*

### 3.3 Journey Stage Transition Rules

| Transition | Required Signals | Confidence Threshold | Auto-Advance? | Alert Trigger |
|-----------|-----------------|---------------------|---------------|---------------|
| 0 → 1 | Any 2+ TP signals | 60% | Yes | Scout: new account of interest |
| 1 → 2 | SP-CAT-01 + FP-WEB-05 or FP-WEB-06 | 70% | Yes | Bard: move to education sequence |
| 2 → 3 | FP-WEB-02, FP-WEB-14, or SP-COMP-01 + SP-REV-01 | 75% | Yes, with notification | AE alert: account entering evaluation |
| 3 → 4 | FP-WEB-03, FP-WEB-11, or FP-WEB-09 | 80% | Yes, with AE notification | AE alert: urgent outreach needed |
| 4 → 5 | Any procurement-related signal | 85% | Manual confirmation | Deal support coordination |
| 5 → 6 | Contract signature (CRM event) | 100% | CRM-triggered | CS handoff automation |

## 4. Data Schema

### 4.1 Intent Signal Record Schema

```json
{
  "signal_id": "string (UUID)",
  "account_id": "string (UUID, foreign key to company)",
  "signal_type": "string (signal code, e.g., FP-WEB-02)",
  "signal_category": "enum: first-party|second-party|third-party",
  "signal_source": "string (provider name)",
  "signal_name": "string (human-readable name)",
  "signal_description": "string (detailed description)",
  
  "detected_at": "datetime (when signal was detected)",
  "event_at": "datetime (when the actual event occurred, if different)",
  "expires_at": "datetime (when signal should be considered stale)",
  
  "strength": {
    "base_score": "integer (0-100)",
    "recency_multiplier": "float (0.0-1.0)",
    "specificity_bonus": "integer (0-15)",
    "corroboration_multiplier": "float (1.0-2.0)",
    "source_confidence_weight": "float (0.6-1.0)",
    "composite_score": "integer (0-100, calculated)"
  },
  
  "journey_mapping": {
    "current_stage": "enum: JOURNEY-0 through JOURNEY-6",
    "stage_confidence": "float (0.0-1.0)",
    "stage_transition": "enum: advancing|stable|regressing|unknown",
    "recommended_action": "string (agent + action description)"
  },
  
  "context": {
    "topics": "array[string] (e.g., ['CRM', 'sales-automation'])",
    "competitors_mentioned": "array[string]",
    "content_title": "string (if content-related signal)",
    "content_type": "enum: blog|whitepaper|webinar|video|case-study|comparison|pricing|docs",
    "page_url": "string (if web-related signal)",
    "referrer_source": "string (if available)",
    "geo_location": "string (city/country, if available)",
    "device_type": "enum: desktop|mobile|tablet",
    "session_duration_seconds": "integer"
  },
  
  "metadata": {
    "ingested_at": "datetime",
    "processing_latency_ms": "integer",
    "data_quality_score": "integer (0-100)",
    "is_duplicate": "boolean",
    "duplicate_of": "string (signal_id, if duplicate)"
  }
}
```

### 4.2 Account Intent Summary Schema

```json
{
  "account_id": "string (UUID)",
  "composite_intent_score": "integer (0-100)",
  "intent_tier": "enum: critical|strong|moderate|emerging|low|minimal|none",
  "journey_stage": "enum: JOURNEY-0 through JOURNEY-6",
  "journey_stage_confidence": "float (0.0-1.0)",
  
  "signal_counts": {
    "total_signals_7d": "integer",
    "total_signals_30d": "integer",
    "total_signals_90d": "integer",
    "first_party_signals": "integer",
    "second_party_signals": "integer",
    "third_party_signals": "integer"
  },
  
  "top_signals": [
    {
      "signal_type": "string",
      "composite_score": "integer",
      "detected_at": "datetime"
    }
  ],
  
  "topic_affinity": {
    "primary_topics": "array[{topic, score}]",
    "emerging_topics": "array[{topic, trend_direction}]",
    "declining_topics": "array[{topic}]"
  },
  
  "competitive_activity": {
    "competitors_researched": "array[{competitor, intensity, recency}]",
    "comparison_activity": "enum: none|low|moderate|high",
    "review_site_presence": "enum: none|reading|comparing|reviewing"
  },
  
  "recommended_actions": [
    {
      "agent": "string (agent name)",
      "action": "string (action description)",
      "priority": "enum: P0|P1|P2|P3",
      "sla": "string (time window)"
    }
  ],
  
  "metadata": {
    "last_calculated_at": "datetime",
    "calculation_latency_ms": "integer",
    "data_freshness": "enum: real-time|hourly|daily|stale"
  }
}
```

## 5. Data Source Mapping

### 5.1 Intent Data Providers

| Provider | Signal Types | Coverage | Accuracy | Latency | Cost Model | LeadReach Integration |
|----------|-------------|----------|----------|---------|-----------|----------------------|
| Bombora | SP-CAT-01, SP-CAT-02, SP-COMP-01 | 4M+ accounts | 78% | Weekly | Annual license | Scout second-party source |
| 6sense | SP-CAT-01, SP-COMP-01, TP-* signals | 5M+ accounts | 82% | Daily | Annual license | Scout + Judge intent overlay |
| Intentify | SP-CAT-01, SP-PUB-01 | 3M+ accounts | 72% | Weekly | Per-account | Scout supplementary |
| G2 | SP-REV-01, SP-COMP-01 | 60K+ products | 90% | Real-time | API access | Scout review monitoring |
| TrustRadius | SP-REV-01 | 25K+ products | 88% | Real-time | API access | Scout review monitoring |
| Crunchbase | TP-FUND-01, TP-MA-01 | 3M+ companies | 92% | Daily | Subscription | Scout trigger detection |
| LinkedIn | TP-EXEC-01, TP-JOB-01 | 900M+ profiles | 85% | Daily | Subscription | Scout + Sage research |
| Indeed | TP-JOB-01 | All active job postings | 80% | Daily | Scrape/API | Scout job monitoring |
| Google Analytics | FP-WEB-01 through FP-WEB-15 | Customer website only | 95% | Real-time | Free | First-party signal ingestion |
| HubSpot | FP-WEB-* + email engagement | Customer contacts only | 95% | Real-time | Included | First-party signal ingestion |
| Segment | FP-WEB-* + product usage | Customer product only | 98% | Real-time | Subscription | First-party + PQL ingestion |

### 5.2 Signal Ingestion Pipeline

```
[First-Party Sources]                    [Second-Party Sources]                 [Third-Party Sources]
Google Analytics ──┐                     Bombora API ──────┐                    Crunchbase webhook ──┐
HubSpot ───────────┤                     6sense API ───────┤                    LinkedIn polling ─────┤
Segment ───────────┤                     G2 API ───────────┤                    Indeed scraping ──────┤
Marketo ───────────┤                     TrustRadius API ──┤                    SEC EDGAR ─────────────┤
Pardot ────────────┘                     Intentify API ────┘                    Press monitoring ──────┘
         ↓                                       ↓                                      ↓
[FP Signal Normalizer]              [SP Signal Normalizer]              [TP Signal Normalizer]
         ↓                                       ↓                                      ↓
         └────────────────┬──────────────────────┴──────────────────────┬─────────────┘
                          ↓                                                    ↓
              [Deduplication + Merge Engine]                        [Entity Resolution]
                          ↓                                                    ↓
              [Signal Strength Calculator] ──────────────────────────────────┘
                          ↓
              [Journey Stage Classifier]
                          ↓
              [Action Recommendation Engine]
                          ↓
              [Account Intent Summary + Alerts]
                          ↓
          ┌───────────────┼───────────────┐
          ↓               ↓               ↓
    [Scout/Alerts]   [Bard/Sequences]  [Judge/Scoring]
```

### 5.3 Entity Resolution

Intent signals from different sources often use different identifiers (domain, company name, DUNS number, etc.). LeadReach's entity resolution system maps signals to the correct account:

| Source Identifier | Resolution Method | Confidence | Fallback |
|------------------|-------------------|-----------|----------|
| Domain (e.g., acme.com) | Direct match to company record | 95% | Subdomain → parent domain |
| Company name | Fuzzy match (Jaro-Winkler) | 80% | Manual review queue |
| DUNS number | Direct match | 99% | N/A |
| LinkedIn company URL | Direct match | 95% | Company name fuzzy match |
| IP address range | GeoIP → company mapping | 70% | ISP filtering required |
| Email domain | Direct match | 90% | Free email domains excluded |

## 6. Quality Benchmarks

### 6.1 Signal Quality Standards

| Signal Category | Precision Target | Recall Target | False Positive Rate | Latency SLA |
|----------------|-----------------|--------------|-------------------|-------------|
| First-party | 95%+ | 98%+ | <5% | <5 minutes |
| Second-party | 80%+ | 85%+ | <15% | <24 hours |
| Third-party | 85%+ | 75%+ | <10% | <4 hours |

### 6.2 Signal Quality Monitoring

| Check | Frequency | Metric | Alert Threshold | Remediation |
|-------|-----------|--------|----------------|-------------|
| Signal volume anomaly | Daily | ±50% vs. 7-day average | Investigate source | Auto-pause suspicious source |
| Precision audit | Monthly | Verified conversions / total signals | <70% precision | Recalibrate scoring model |
| Recency distribution | Weekly | % of signals within recency windows | >50% stale signals | Trigger enrichment refresh |
| Duplicate rate | Daily | Duplicate signals / total signals | >10% duplicates | Improve deduplication logic |
| Entity resolution accuracy | Monthly | Correctly mapped / total signals | <85% accuracy | Update resolution rules |
| Journey stage accuracy | Quarterly | Stage at conversion vs. predicted stage | <60% accuracy | Retrain stage classifier |

### 6.3 Backtesting Methodology

Quarterly backtesting evaluates signal quality against actual conversion outcomes:

1. **Cohort Selection**: All accounts with intent signals in the prior quarter
2. **Score Comparison**: Intent score at time of first signal vs. eventual conversion outcome
3. **Lift Analysis**: Conversion rate of high-intent accounts vs. low-intent accounts
4. **Stage Accuracy**: Predicted journey stage vs. actual stage at time of sales engagement
5. **Model Calibration**: Adjust scoring weights based on observed conversion patterns

| Metric | Q1 2026 Benchmark | Target | Status |
|--------|-------------------|--------|--------|
| Intent score → conversion correlation | 0.68 | >0.60 | ✅ Exceeding |
| Critical intent conversion rate | 22% | >15% | ✅ Exceeding |
| Stage prediction accuracy | 72% | >65% | ✅ Exceeding |
| False positive rate (strong+ intent) | 12% | <15% | ✅ Meeting |
| Time-to-detection (trigger events) | 3.2 hours | <4 hours | ✅ Meeting |

## 7. LeadReach Agent Consumption Patterns

### 7.1 Agent-Specific Intent Usage

| Agent | Intent Data Consumed | Query Pattern | Decision Impact | Latency Requirement |
|-------|---------------------|---------------|----------------|-------------------|
| Scout | All signal types, trigger events | Streaming ingestion + account lookup | Account prioritization, signal detection | <1 min for trigger alerts |
| Atlas | Account intent summaries, journey stages | Batch analysis | ICP refinement, segment scoring | <5 min for model updates |
| Sage | Intent context, competitive activity | On-demand per account | Research prioritization, competitive intel | <30 sec for research gen |
| Judge | Composite intent scores, journey stages | Per-lead evaluation | Qualification decisions, routing | <10 sec for qualification |
| Bard | Signal context, journey stage, topics | Per-outreach generation | Message personalization, timing optimization | <5 sec for personalization |
| Flow | Journey stage transitions, signal changes | Streaming | Pipeline progression, deal alerts | <1 sec for stage transitions |
| Forge | Intent signal metadata | Batch + on-demand | Enrichment priority, data gap identification | <4 hours for batch |
| Echo | Aggregate intent metrics, conversion data | Batch analytics | Forecasting, ROI measurement | <15 min for reports |

### 7.2 Intent-Driven Workflow Triggers

| Trigger Condition | Agent Action | SLA | Escalation Path |
|-------------------|-------------|-----|-----------------|
| Intent score crosses 80 | Scout → AE alert + Bard auto-sequence | 1 hour | If no AE response in 4 hours → Sales Manager |
| Journey stage advances to JOURNEY-3 | Bard → competitive differentiation sequence | 4 hours | If no response in 24 hours → re-queue |
| Critical first-party signal (demo request) | Scout → AE immediate assignment | 15 minutes | If no AE response in 1 hour → VP Sales |
| Multiple competitor research signals | Sage → competitive battlecard delivery | 4 hours | Flagged for competitive strategy review |
| Journey stage regression detected | Flow → deal-at-risk alert | 2 hours | AE + Sales Manager notified |
| New CTO/VP hire at ICP account | Scout → Bard "new leader" sequence | 24 hours | Prioritized in next outreach batch |
| Contract renewal signal at competitor | Bard → displacement sequence | 48 hours | Added to competitive displacement playbook |

### 7.3 Intent-Informed Personalization

Bard uses intent signal data to personalize outreach content:

| Intent Signal | Personalization Element | Example |
|--------------|----------------------|---------|
| Pricing page viewed | Reference pricing/tier structure | "I noticed you were exploring our pricing—here's a comparison of our Enterprise plan vs. your current setup" |
| Competitor comparison viewed | Competitive differentiation | "I saw you're comparing solutions—here's how we differ from [Competitor] on the criteria that matter most" |
| Security documentation viewed | Compliance-first messaging | "Since your team is evaluating security posture, here's our SOC 2 Type II and compliance documentation" |
| ROI calculator used | Quantified value proposition | "Based on the metrics you entered in our ROI calculator, here's your projected savings with LeadReach" |
| Category research surge | Category education | "I noticed your team is researching [category] solutions—here's our latest industry benchmark report" |
| New CTO hired | New leader introduction | "Congratulations on your new role—many new CTOs in your position have found our platform helpful for [use case]" |
| Funding round | Growth-oriented messaging | "Congratulations on your Series B—here's how [Customer] scaled their [function] with our platform post-funding" |
| Job postings for relevant role | Role-specific outreach | "I noticed you're hiring for [Role]—our platform helps teams like this be [X]% more productive" |

## 8. Update Cadence

| Data Category | Refresh Frequency | Method | SLA | Quality Impact |
|--------------|-------------------|--------|-----|---------------|
| First-party signals | Real-time | Event streaming | <5 minutes | Highest timeliness |
| Second-party signals | Daily-Weekly | API batch + streaming | <24 hours | Category-level timeliness |
| Third-party trigger events | Real-time-Daily | Webhooks + polling | <4 hours | Event-dependent timeliness |
| Intent scores | On-demand | Recomputed on signal change | <5 minutes | Always current |
| Journey stage classification | On-demand | Recomputed on score change | <5 minutes | Always current |
| Topic affinity | Daily | Batch NLP processing | 24 hours | Acceptable lag |
| Competitive activity | Daily | API aggregation | 24 hours | Acceptable lag |
| Action recommendations | Real-time | Rule engine + ML | <1 minute | Real-time routing |
| Quality benchmarks | Monthly | Full audit + backtesting | 30 days | Quarterly deep audit |
| Scoring model calibration | Quarterly | ML retraining on conversion data | 90 days | Seasonal adjustment |
| Taxonomy updates | Semi-annually | LeadReach data team review | As needed | Version-controlled |
