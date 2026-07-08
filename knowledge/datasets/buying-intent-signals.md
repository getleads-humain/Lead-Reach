---
title: "Buying Intent Signals"
category: dataset
grade: A
last_reviewed: 2026-07-08
tags: [intent, buying-signals, dark-funnel, bombora, zoominfo-intent]
---

# Buying Intent Signals for B2B Lead Generation

## Overview

Buying intent signals are behavioral indicators that a prospect is actively researching, evaluating, or preparing to purchase a product or service. In B2B, the buying journey is increasingly digital and anonymous — 70-80% of the research happens before a prospect ever contacts sales. Intent signals allow LeadReach to detect this "dark funnel" activity, prioritize outreach to the hottest accounts, and time engagement for maximum impact.

This document provides a comprehensive taxonomy of first-party, second-party, and third-party intent signals, scoring frameworks, decay models, and vendor comparisons for LeadReach's intent-powered lead generation pipeline.

---

## 1. First-Party Intent Signals

### 1.1 Definition and Scope

First-party intent signals are behaviors captured directly on properties you own or control. These are the highest-quality signals because they reflect direct engagement with your brand, products, or content.

### 1.2 Signal Types and Scoring

| Signal Type | Description | Intent Strength | Score (0-100) | Decay Half-Life |
|---|---|---|---|---|
| **Pricing page visit** | Prospect visits pricing/pricing-faq page | Very High | 90 | 7 days |
| **Demo request** | Prospect submits demo meeting request | Very High | 95 | 14 days |
| **Free trial signup** | Prospect creates trial account | Very High | 92 | 21 days |
| **Contact sales form** | Prospect fills out contact sales form | Very High | 88 | 10 days |
| **Product page deep dive** | 3+ product page visits in session | High | 75 | 10 days |
| **Feature comparison page** | Visits feature comparison pages | High | 80 | 7 days |
| **Case study download** | Downloads case study or whitepaper | Medium-High | 65 | 14 days |
| **ROI calculator usage** | Engages with ROI/TCO calculator | High | 78 | 14 days |
| **Webinar registration** | Registers for upcoming webinar | Medium-High | 60 | 14 days |
| **Webinar attendance** | Attends live webinar (50%+ duration) | High | 72 | 21 days |
| **Newsletter signup** | Subscribes to product newsletter | Low-Medium | 35 | 30 days |
| **Blog content engagement** | Reads 2+ blog posts in single session | Medium | 45 | 14 days |
| **Documentation visit** | Visits API docs or technical documentation | Medium-High | 55 | 10 days |
| **Integration page visit** | Views integration/partner pages | High | 70 | 7 days |
| **Security/compliance page** | Visits security, compliance, or trust center | High | 75 | 7 days |
| **Career page visit** | Visits company careers page | Low | 20 | 30 days |
| **Repeated visits** | 3+ visits in 7 days from same account | High | 80 | 7 days |
| **Seniority-weighted visit** | Visit from C-suite or VP-level contact | Very High | 85 | 7 days |

### 1.3 First-Party Signal Collection Architecture

```yaml
first_party_collection:
  web_analytics:
    tool: "Google Analytics 4 + Segment + LeadReach pixel"
    events_tracked:
      - page_view: All pages with product relevance scoring
      - form_submission: Demo, trial, contact, newsletter forms
      - file_download: Whitepapers, case studies, eBooks
      - video_engagement: Play, 25%, 50%, 75%, 100% completion
      - calculator_interaction: Input changes, results generation
      - scroll_depth: 25%, 50%, 75%, 100% thresholds
    
  account_identification:
    - ip_to_company: Resolve visitor IP to company (Clearbit, Demandbase, 6sense)
    - email_cookie_match: Match anonymous sessions to known contacts
    - login_identification: Identify known users via authentication
    - utm_tracking: Campaign attribution for all traffic sources
  
  behavioral_scoring:
    - real_time_scoring: Calculate intent score on every event
    - account_rollup: Aggregate individual scores to account level
    - time_decay: Apply exponential decay based on signal age
    - frequency_bonus: Increase score for repeated signals within window
    - seniority_weight: Multiply score by contact seniority factor
```

### 1.4 Page Intent Classification

| Page Category | Intent Level | Score Multiplier | Key URL Patterns |
|---|---|---|---|
| Pricing | Buying | 3.0x | `/pricing`, `/plans`, `/cost`, `/quote` |
| Product Demo | Buying | 2.8x | `/demo`, `/schedule-demo`, `/book-demo` |
| Features (advanced) | Evaluating | 2.0x | `/features/enterprise`, `/compare` |
| Integrations | Evaluating | 1.8x | `/integrations`, `/marketplace`, `/partners` |
| Security/Compliance | Evaluating | 1.8x | `/security`, `/compliance`, `/trust-center`, `/soc2` |
| Case Studies | Researching | 1.5x | `/customers`, `/case-studies`, `/success-stories` |
| ROI Calculator | Evaluating | 2.2x | `/roi-calculator`, `/tco`, `/savings-calculator` |
| Technical Docs | Implementing | 1.5x | `/docs`, `/api`, `/developer`, `/implementation` |
| Blog/Content | Awareness | 1.0x | `/blog`, `/resources`, `/knowledge-base` |
| About/Company | Awareness | 0.5x | `/about`, `/team`, `/careers` |

---

## 2. Second-Party Intent Signals

### 2.1 Definition and Scope

Second-party intent signals are behaviors captured on properties owned by partners, publishers, or platforms where you have a data-sharing relationship. These signals indicate category-level interest but not necessarily brand-specific intent.

### 2.2 Publisher Network Signals

| Source | Signal Type | Coverage | Intent Quality | Cost Model |
|---|---|---|---|---|
| **B2B Publisher Networks** | Content consumption on industry publications | High (IDG, TechTarget, Informa) | Medium-High | CPM or subscription |
| **Review Platforms** | Profile views, comparisons, reviews on G2, Capterra | Medium-High | High | Freemium + premium |
| **Comparison Sites** | Product comparisons on Software Advice, SelectHub | Medium | Very High | Pay-per-lead or subscription |
| **Event Platforms** | Event registration, attendance on Bizzabo, Cvent | Medium | Medium-High | Partnership or data fee |
| **Community Platforms** | Discussions on Stack Overflow, Reddit, Discord | Low-Medium | Medium | Free (public) or API fee |

### 2.3 Review Site Intent Signals

| Platform | Available Signals | Detection Method | Intent Correlation |
|---|---|---|---|
| **G2** | Profile views, comparison views, review reads, grid position | G2 APIs + tracking pixels | 0.72 correlation with purchase within 90 days |
| **Capterra** | Category browsing, comparison tool usage, review reads | Capterra APIs + partnership | 0.65 correlation |
| **Software Advice** | Phone consultation requests, comparison reports | Partnership data | 0.80 correlation (high intent) |
| **TrustRadius** | Profile views, comparison usage, review engagement | API + partnership | 0.60 correlation |
| **PeerSpot (IT Central Station)** | Review reads, comparison, queries | Partnership | 0.55 correlation |
| **Clutch** | Service provider searches, agency comparisons | Partnership | 0.50 correlation (services intent) |

### 2.4 Second-Party Signal Integration

```yaml
second_party_integration:
  g2:
    data_feed: "Daily G2 profile view and comparison data via API"
    account_matching: "Domain-based matching to LeadReach accounts"
    scoring: "Profile view = 45 pts, Comparison = 65 pts, Review submit = 55 pts"
    
  techtarget:
    data_feed: "Weekly content consumption reports by topic area"
    account_matching: "Cookie match + IP resolution"
    scoring: "Topic engagement = 40 pts, Whitepaper download = 55 pts"
    
  software_advice:
    data_feed: "Real-time consultation request notifications"
    account_matching: "Phone/email matching via partnership"
    scoring: "Consultation request = 80 pts"
    
  publisher_networks:
    data_feed: "Weekly aggregated content consumption by company"
    account_matching: "IP-based + cookie matching"
    scoring: "Category page visit = 30 pts, Whitepaper = 50 pts"
```

---

## 3. Third-Party Intent Signals

### 3.1 Definition and Scope

Third-party intent signals are collected by independent data providers who monitor behavioral data across thousands of websites and publications. These providers use co-op models, publisher networks, and web crawling to detect when companies are researching specific topics.

### 3.2 Major Third-Party Intent Data Providers

#### Bombora

| Attribute | Details |
|---|---|
| **Data Source** | 15,000+ B2B publisher sites in co-op network |
| **Coverage** | ~15M domains tracked |
| **Granularity** | Topic-level (14,000+ topics), Surge scoring |
| **Update Frequency** | Weekly surge reports, daily data access |
| **Surge Detection** | Compares current topic consumption to company baseline; flags when 2+ standard deviations above baseline |
| **Account Resolution** | IP-to-business mapping with 85%+ accuracy |
| **Integration** | API, Salesforce app, Marketo/HubSpot native integrations |
| **Strengths** | Broad coverage, established methodology, strong publisher co-op |
| **Weaknesses** | Topic-level only (no keyword granularity), weekly latency, higher false positives for broad topics |
| **Pricing** | $30K-80K/year depending on topic volume and accounts |

#### ZoomInfo Intent

| Attribute | Details |
|---|---|
| **Data Source** | 15,000+ publisher sites + ZoomInfo's own web crawling |
| **Coverage** | ~14M domains tracked |
| **Granularity** | Keyword-level (100,000+ keywords), topic-level |
| **Update Frequency** | Daily intent signals |
| **Intent Detection** | Proprietary scoring based on content consumption patterns |
| **Account Resolution** | IP + cookie + email matching with 90%+ accuracy |
| **Integration** | Native Salesforce integration, API, Copilot platform |
| **Strengths** | Keyword granularity, daily updates, integrated with contact data |
| **Weaknesses** | Requires ZoomInfo platform subscription, accuracy varies by industry |
| **Pricing** | Bundled with ZoomInfo platform ($25K-100K+/year) |

#### 6sense

| Attribute | Details |
|---|---|
| **Data Source** | 12,000+ B2B sites + bidstream data + first-party analytics |
| **Coverage** | ~12M domains tracked |
| **Granularity** | Keyword + topic + AI-predicted buying stage |
| **Update Frequency** | Real-time (via platform); daily data access |
| **Buying Stage Prediction** | AI model predicts: Research → Active Evaluation → Purchase |
| **Account Resolution** | Multi-signal matching (IP + cookie + device graph) with 92%+ accuracy |
| **Integration** | Salesforce, Marketo, HubSpot native; API; ABM platform |
| **Strengths** | Buying stage prediction, multi-signal fusion, ABM platform |
| **Weaknesses** | Higher cost, requires platform adoption, black-box AI |
| **Pricing** | $50K-200K+/year depending on tier and accounts |

#### G2 Buyer Intent

| Attribute | Details |
|---|---|
| **Data Source** | G2.com profile views, comparisons, reviews |
| **Coverage** | 3M+ monthly G2 visitors |
| **Granularity** | Product-level (specific products, not just categories) |
| **Update Frequency** | Real-time (profile views), weekly (reports) |
| **Intent Detection** | Direct product-level interest (viewing your product or competitor) |
| **Account Resolution** | Email + cookie matching |
| **Integration** | Salesforce, HubSpot, Marketo native; webhook; API |
| **Strengths** | Product-level specificity (not just topic), competitive intent, verified buyer reviews |
| **Weaknesses** | Limited to G2 ecosystem, requires product listing on G2 |
| **Pricing** | Freemium (basic) to $25K-50K/year (full intent) |

#### BuiltWith

| Attribute | Details |
|---|---|
| **Data Source** | Web technology detection across 60M+ websites |
| **Coverage** | Technology install base tracking |
| **Granularity** | Technology-level (specific products installed on websites) |
| **Update Frequency** | Daily crawling; weekly reports |
| **Intent Detection** | Technology additions and removals signal buying/churn |
| **Account Resolution** | Domain-based matching |
| **Integration** | API, CSV export, Salesforce integration |
| **Strengths** | Technology-specific (not topic-based), detects install changes, competitor tracking |
| **Weaknesses** | Limited to web-detectable technologies, no content consumption data |
| **Pricing** | $295-995/month depending on plan |

### 3.3 Third-Party Intent Signal Types

| Signal Type | Provider(s) | Description | Intent Strength |
|---|---|---|---|
| **Topic Surge** | Bombora, ZoomInfo | Company consuming significantly more content on a topic vs. baseline | High |
| **Keyword Intent** | ZoomInfo, 6sense | Company researching specific keywords | Very High |
| **Product Profile View** | G2, Capterra | Company viewing specific product profiles | Very High |
| **Technology Add** | BuiltWith, ZoomInfo | Company added new technology to their website | High |
| **Technology Remove** | BuiltWith | Company removed technology from website | Very High (displacement) |
| **Competitive Comparison** | G2, 6sense | Company comparing your product vs. competitor | Very High |
| **Buying Stage Prediction** | 6sense | AI predicts account in active buying cycle | High |
| **Review Activity** | G2, PeerSpot | Company writing or reading reviews in category | Medium-High |
| **Content Download** | Bombora, TechTarget | Company downloading content on topic | Medium-High |
| **RFP Activity** | Dealroom, 6sense | Company issued RFP in category (inferred) | Very High |

---

## 4. Intent Signal Scoring and Prioritization

### 4.1 Composite Intent Scoring Model

LeadReach fuses signals from multiple sources into a single Account Intent Score (AIS):

```yaml
account_intent_score:
  formula: |
    AIS = Σ(source_score × source_weight × recency_factor × frequency_factor × seniority_factor)
  
  source_weights:
    first_party: 0.40  # Highest weight — direct brand engagement
    second_party: 0.25  # Medium — category/competitor interest
    third_party: 0.35  # Significant — broad research activity
  
  recency_factor:
    today: 1.0
    yesterday: 0.9
    2-3_days_ago: 0.8
    4-7_days_ago: 0.6
    8-14_days_ago: 0.4
    15-30_days_ago: 0.2
    31+_days_ago: 0.1
  
  frequency_factor:
    single_signal: 1.0
    2_signals_in_7_days: 1.3
    3_signals_in_7_days: 1.6
    4+_signals_in_7_days: 2.0
    multi_source: 1.5  # Bonus for signals from multiple sources
  
  seniority_factor:
    c_suite: 1.8  # CEO, CTO, CFO, CIO, CMO
    vp_level: 1.5  # VP, SVP, EVP
    director: 1.2  # Director, Head of
    manager: 1.0   # Manager, Lead
    individual_contributor: 0.8  # IC, Analyst, Coordinator
    unknown: 1.0   # Default for anonymous signals
  
  normalization:
    raw_to_100: "Scale raw scores to 0-100 range"
    account_percentile: "Rank all accounts; express as percentile"
    category_adjustment: "Adjust thresholds by industry/category"
```

### 4.2 Intent Priority Tiers

| Tier | AIS Range | Action | SLA | Assigned To |
|---|---|---|---|---|
| **Priority 1 — Hot** | 80-100 | Immediate personalized outreach (within 1 hour) | <1 hour response | Senior AE |
| **Priority 2 — Warm** | 60-79 | Personalized outreach within 24 hours | <24 hours response | AE or SDR |
| **Priority 3 — Nurture** | 40-59 | Add to targeted nurture sequence | <48 hours enrollment | SDR or automated |
| **Priority 4 — Monitor** | 20-39 | Add to general awareness campaigns | Weekly review | Marketing automation |
| **Priority 5 — Park** | 0-19 | No active outreach; track for changes | Monthly review | Passive monitoring |

### 4.3 Multi-Source Correlation

The most valuable intent insights come from correlating signals across multiple sources:

| Correlation Pattern | Significance | Expected Conversion Rate | LeadReach Alert |
|---|---|---|---|
| 1st party pricing + 3rd party topic surge | Very high buying intent | 25-35% | `critical_intent_correlation` |
| 2nd party G2 comparison + 1st party demo request | Active evaluation | 40-55% | `active_evaluation` |
| 3rd party surge + job posting + funding news | Research with budget | 20-30% | `funded_buying_signal` |
| 1st party repeated visits + seniority-weighted | Committee member researching | 15-25% | `committee_research` |
| Technology remove (BuiltWith) + competitor surge | Competitive displacement | 18-28% | `displacement_opportunity` |
| Multiple 3rd party signals, no 1st party | Dark funnel research | 8-15% | `dark_funnel_detected` |
| G2 profile view + negative competitor review | Switching intent | 22-32% | `switching_signal` |

---

## 5. Intent-to-Purchase Timeline Mapping

### 5.1 B2B Buying Journey Stages

| Stage | Duration (Typical) | Intent Signals Present | LeadReach Action |
|---|---|---|---|
| **Unaware** | N/A | None | Brand awareness campaigns |
| **Problem Aware** | 1-3 months | Category-level content consumption, job postings | Educational content, thought leadership |
| **Solution Aware** | 1-2 months | Product category searches, vendor list building | Competitive positioning, differentiation content |
| **Active Evaluation** | 1-2 months | Product comparisons, demo requests, pricing page visits | Sales engagement, demo, POC |
| **Decision** | 2-4 weeks | Contract negotiation, legal review, security assessment | Close support, references, executive engagement |
| **Purchase** | 1-2 weeks | Contract signing, procurement process | Closing assistance |

### 5.2 Intent Signal Timeline by Buying Stage

```yaml
intent_timeline:
  unaware:
    signals: []
    probability_of_purchase_90_days: 2-5%
    
  problem_aware:
    signals:
      - topic_content_consumption: "Reading about [problem] on publisher sites"
      - job_posting: "Hiring for role that owns [problem]"
      - conference_attendance: "Attending events related to [problem]"
      - forum_discussions: "Asking questions on Stack Overflow, Reddit about [problem]"
    probability_of_purchase_90_days: 5-15%
    
  solution_aware:
    signals:
      - category_browsing: "Viewing G2/Capterra category pages"
      - vendor_website_visits: "Visiting 3+ vendor websites"
      - case_study_consumption: "Downloading case studies, whitepapers"
      - peer_discussions: "Discussing solutions in communities, Slack groups"
      - roi_research: "Searching for ROI data, benchmarks"
    probability_of_purchase_90_days: 15-30%
    
  active_evaluation:
    signals:
      - product_comparison: "Using G2 comparison tool, creating shortlists"
      - demo_requests: "Requesting demos from 2-3 vendors"
      - pricing_page_visits: "Visiting pricing pages across vendors"
      - trial_signups: "Starting free trials"
      - reference_requests: "Asking for customer references"
      - security_review: "Visiting trust centers, security documentation"
    probability_of_purchase_90_days: 30-55%
    
  decision:
    signals:
      - contract_review: "Legal/procurement engagement detected"
      - executive_engagement: "C-suite involvement in meetings"
      - implementation_planning: "Asking about implementation timeline, requirements"
      - stakeholder_alignment: "Multiple stakeholders engaging across sessions"
      - competitive_final: "Narrowing to 1-2 vendors"
    probability_of_purchase_90_days: 55-85%
```

---

## 6. Dark Funnel Signals

### 6.1 Definition

The "dark funnel" refers to buying research that happens outside of trackable digital touchpoints. An estimated 68% of B2B buying research happens in the dark funnel, making it critical for LeadReach to detect and interpret these signals.

### 6.2 Dark Funnel Signal Types

| Signal | Detection Method | Reliability | Intent Strength |
|---|---|---|---|
| **Peer conversations** | Community monitoring (Slack, Discord, Reddit) | Medium | Medium-High |
| **Executive networking** | Event attendance, board advisory roles | Low-Medium | High |
| **Analyst briefings** | Gartner/Forrester inquiry tracking | Medium | Very High |
| **Private Slack channels** | Community mention tracking | Low | Medium |
| **WhatsApp/Signal groups** | Not directly detectable | Very Low | High (if known) |
| **Podcast consumption** | Podcast platform analytics (limited) | Low | Low-Medium |
| **Word of mouth** | Not directly detectable | Very Low | Very High (if known) |
| **Consultant recommendations** | Partner/channel intelligence | Medium | Very High |
| **Board/investor directives** | Public board minutes, investor memos | Low-Medium | Very High |
| **Direct competitor evaluations** | Competitive intelligence, win/loss analysis | Medium | High |

### 6.3 Dark Funnel Detection Strategies

```yaml
dark_funnel_strategies:
  community_intelligence:
    - monitor_slack_communities: Track 200+ B2B Slack communities for product mentions
    - reddit_monitoring: Track r/SaaS, r/sysadmin, r/devops, etc.
    - stack_overflow: Monitor technology-specific questions and answers
    - hacker_news: Track YC community discussions
    - discord_servers: Monitor 50+ B2B Discord servers
  
  event_intelligence:
    - conference_attendee_lists: Obtain attendee lists for key industry events
    - speaker_tracking: Track when target accounts speak at events
    - webinar_cross_pollination: Detect when prospects attend competitor webinars
    - meetup_monitoring: Track local meetup attendance
  
  partner_intelligence:
    - channel_partner_reports: Monthly reports from implementation partners
    - consultant_network: Intelligence sharing with consulting firms
    - investor_network: Portfolio company updates from VC firms
    - analyst_relations: Gartner/Forrester inquiry and briefing tracking
  
  competitive_intelligence:
    - win_loss_analysis: Systematic analysis of won/lost deals
    - competitor_changelog: Track competitor product/price changes
    - review_site_monitoring: Real-time monitoring of competitor reviews
    - job_posting_analysis: Detect competitor hiring for replacement roles
  
  inferred_intent:
    - hiring_pattern_analysis: Hiring specific roles implies technology investments
    - funding_correlation: Recent funding + category hiring = buying intent
    - technology_migration_signals: Stack changes imply evaluation
    - executive_changes: New CIO/CTO often triggers vendor review
```

---

## 7. Competitive Intent Signals

### 7.1 Types of Competitive Intent

| Competitive Signal | What It Means | How to Detect | LeadReach Action |
|---|---|---|---|
| **Competitor product page visit** | Prospect researching competitor | 3rd party intent + 1st party analytics | Differentiation outreach |
| **Competitor G2 profile view** | Prospect comparing solutions | G2 Intent data | Competitive comparison content |
| **Competitor demo/trial** | Prospect evaluating competitor | Review sites, community mentions | Urgency outreach — offer comparison |
| **Competitor pricing research** | Prospect in decision phase | Intent data, pricing page visits | Value/TCO positioning |
| **Negative competitor review** | Prospect dissatisfied with competitor | G2/TrustRadius monitoring | Switching campaign |
| **Competitor contract renewal** | Prospect locked in or evaluating renewal | Renewal date estimation from install date | Time outreach to pre-renewal |
| **Competitor churn signal** | Prospect left competitor | BuiltWith removal, community discussion | Win-back/displacement campaign |
| **Multi-competitor evaluation** | Prospect comparing 3+ vendors | Multiple intent signals across vendors | Position as leader; accelerate evaluation |

### 7.2 Competitive Displacement Playbook

```yaml
competitive_displacement:
  trigger: competitor_detected_in_prospect_stack OR competitor_intent_signal
  
  phase_1_research:
    - identify_incumbent: Detect specific competitor product and version
    - estimate_contract: Estimate contract size and renewal date
    - find_pain_points: Identify common complaints for this competitor
    - identify_internal_champion: Find contacts who may be dissatisfied
  
  phase_2_engagement:
    - planting_seeds: Share content highlighting competitor limitations (subtly)
    - differentiation: Emphasize unique capabilities not available from competitor
    - roi_comparison: Offer TCO calculator showing cost advantage
    - customer_stories: Share case studies of customers who switched
  
  phase_3_conversion:
    - trial_offer: Offer free trial or POC alongside current solution
    - migration_support: Offer migration tools and services at no cost
    - executive_engagement: Connect prospect with exec who made similar switch
    - contract_buyout: Consider contract buyout for large deals
```

---

## 8. Intent Signal Decay Rates

### 8.1 Why Intent Decays

Buying intent is time-sensitive. A prospect researching a CRM today may have completed their evaluation — or purchased — within 30-90 days. The value of an intent signal decreases over time as the prospect either purchases, abandons the evaluation, or the organizational context changes.

### 8.2 Decay Models by Signal Type

| Signal Category | Decay Model | Half-Life | Practical Implication |
|---|---|---|---|
| Demo request | Exponential | 14 days | Contact within 24 hours; re-engage at 7 and 14 days |
| Pricing page visit | Exponential | 7 days | Contact within 4 hours; re-engage at 3 and 7 days |
| Trial signup | Linear + plateau | 21 days to 50%, then stabilizes | Onboard immediately; nurture through trial period |
| Content download | Exponential | 14 days | Follow up within 48 hours; nurture for 30 days |
| Topic surge (Bombora) | Step function | Weekly reset | Act during surge week; next week may be too late |
| G2 profile view | Exponential | 7 days | Follow up within 48 hours |
| Job posting | Linear | 30 days | Signal valid while posting is active |
| Technology install (BuiltWith) | Step + slow decay | 90 days | Signal indicates stable adoption, not immediate buying |
| Funding event | Step function | 90 days | Budget available; priority window for 90 days |
| Executive change | Step function | 180 days | New leader evaluation window ~6 months |

### 8.3 Decay Implementation in LeadReach

```yaml
decay_implementation:
  model: exponential_decay
  formula: "signal_value = initial_score × e^(-λ × days_since_signal)"
  
  lambda_values:
    demo_request: 0.0495  # Half-life: 14 days
    pricing_visit: 0.0990  # Half-life: 7 days
    trial_signup: 0.0330  # Half-life: 21 days
    content_download: 0.0495  # Half-life: 14 days
    topic_surge: 0.0990  # Half-life: 7 days (weekly cycle)
    g2_view: 0.0990  # Half-life: 7 days
    job_posting: 0.0231  # Half-life: 30 days
    tech_install: 0.0077  # Half-life: 90 days
    funding_event: 0.0077  # Half-life: 90 days
    exec_change: 0.0039  # Half-life: 180 days
  
  composite_decay:
    method: "Latest signal resets decay clock for same type; different types decay independently"
    account_score: "Sum of all active (non-decayed) signal scores"
    minimum_score: "Signals below 5% of initial value are pruned"
  
  re_engagement_triggers:
    - score_decay_to_50: "Trigger nurture email when signal decays to 50%"
    - score_decay_to_25: "Trigger re-engagement campaign at 25%"
    - score_decay_to_10: "Add to monitoring queue at 10%"
    - new_signal_on_decayed: "Boost score if new signal detected on decaying account"
```

---

## 9. Multi-Signal Correlation Frameworks

### 9.1 Correlation Methodology

Multi-signal correlation identifies accounts showing buying intent across multiple channels, significantly increasing purchase probability:

| Signal Combination | Lift vs. Single Signal | False Positive Rate | Recommended Action |
|---|---|---|---|
| 1st party + 3rd party | 3.2x | 8% | Prioritize for immediate outreach |
| 2nd party + 3rd party | 2.5x | 12% | Add to warm outreach queue |
| Multiple 3rd party | 2.0x | 15% | Add to targeted nurture |
| 1st party only | 1.5x | 5% | Standard follow-up cadence |
| 3rd party only | 1.0x | 25% | Validate before outreach |
| Intent + technographic | 3.8x | 6% | Highest priority — immediate personalized outreach |
| Intent + trigger event | 4.5x | 4% | Top priority — executive-level outreach |
| Intent + firmographic ICP match | 3.5x | 7% | High priority — ICP-aligned outreach |

### 9.2 Correlation Engine Architecture

```yaml
correlation_engine:
  input_signals:
    - first_party: Web analytics, form submissions, product engagement
    - second_party: G2, publisher networks, review sites
    - third_party: Bombora, ZoomInfo, 6sense, BuiltWith
    - technographic: Technology stack data, hiring signals
    - firmographic: Company size, industry, revenue, location
    - trigger_events: Funding, executive changes, M&A, compliance deadlines
  
  correlation_rules:
    - temporal_correlation: "Signals within 7-day window are correlated"
    - account_rollup: "All signals roll up to account level"
    - contact_attribution: "Known contacts associated with signals"
    - buying_committee: "Multiple contacts from same account = committee signal"
  
  output:
    - account_intent_score: Composite 0-100 score
    - buying_stage_prediction: Research/Evaluation/Decision
    - recommended_action: Specific outreach recommendation
    - confidence_level: Low/Medium/High/Very High
    - signal_breakdown: Detailed signal inventory per account
```

---

## 10. Intent Data Vendor Comparison

### 10.1 Comprehensive Vendor Comparison

| Criteria | Bombora | ZoomInfo Intent | 6sense | G2 Buyer Intent | BuiltWith | Demandbase |
|---|---|---|---|---|---|---|
| **Data Freshness** | Weekly | Daily | Real-time | Real-time | Daily | Real-time |
| **Topic Granularity** | 14K+ topics | 100K+ keywords | Keyword + topic | Product-level | Technology-level | Keyword + topic |
| **Account Coverage** | ~15M | ~14M | ~12M | ~3M/mo visitors | ~60M sites | ~10M |
| **Match Accuracy** | 85% | 90% | 92% | 80% | 95% (domain) | 88% |
| **Buying Stage Prediction** | No | Partial | Yes (AI) | No | No | Yes (AI) |
| **Competitive Intent** | Partial | Yes | Yes | Yes | Yes | Partial |
| **Salesforce Integration** | Yes | Native | Native | Yes | Yes | Native |
| **Marketo/HubSpot Integration** | Yes | Yes | Yes | Yes | Limited | Yes |
| **API Access** | Yes | Yes | Yes | Yes | Yes | Yes |
| **ABM Platform** | No | Partial (Copilot) | Yes | No | No | Yes |
| **Dark Funnel Coverage** | Medium | Medium | High | Low | Low | High |
| **International Coverage** | Good (US/UK focus) | US-centric | Good | Global | Global | US/EMEA |
| **Entry Price** | ~$30K/yr | Bundled (~$25K+) | ~$50K/yr | Freemium ($0-50K/yr) | $295/mo | ~$40K/yr |
| **Best For** | Broad topic intent | Sales team integration | AI-driven ABM | Product-level intent | Technology tracking | Account-based advertising |

### 10.2 Vendor Selection Decision Framework

```yaml
vendor_selection:
  scenario_1_sales_team_needs:
    need: "Sales reps need intent signals in their daily workflow"
    recommended: "ZoomInfo Intent (native CRM integration)"
    alternative: "6sense (if ABM platform needed too)"
  
  scenario_2_marketing_abm:
    need: "Marketing running ABM campaigns with intent targeting"
    recommended: "6sense or Demandbase (full ABM platform)"
    alternative: "Bombora + separate ABM platform"
  
  scenario_3_product_marketing:
    need: "Product marketing tracking competitive dynamics"
    recommended: "G2 Buyer Intent + BuiltWith"
    alternative: "ZoomInfo Intent (keyword-level competitive)"
  
  scenario_4_cost_conscious:
    need: "Maximum intent coverage at lowest cost"
    recommended: "BuiltWith ($295/mo) + G2 Free tier"
    alternative: "Bombora topic-only package"
  
  scenario_5_comprehensive:
    need: "Best-in-class multi-source intent fusion"
    recommended: "6sense (primary) + G2 (product-level) + BuiltWith (tech)"
    alternative: "Bombora + ZoomInfo + G2 triple-source"
  
  scenario_6_international:
    need: "Strong intent coverage outside US"
    recommended: "6sense (best international) + G2 (global product-level)"
    alternative: "Bombora (UK/EU coverage)"
```

---

## 11. LeadReach Intent Pipeline Implementation

### 11.1 End-to-End Intent Workflow

```yaml
intent_pipeline:
  data_collection:
    - first_party_pixel: LeadReach JS pixel on all owned properties
    - third_party_feeds: Bombora weekly + ZoomInfo daily + G2 real-time
    - second_party_integrations: G2 + TechTarget + Software Advice
    - technographic_scan: BuiltWith daily + job posting daily
  
  signal_processing:
    - normalize: Standardize signal formats across sources
    - deduplicate: Remove duplicate signals across providers
    - score: Apply composite scoring model
    - decay: Apply time-decay to all signals
    - correlate: Multi-signal correlation analysis
  
  account_enrichment:
    - intent_to_account: Resolve anonymous signals to accounts
    - contact_identification: Identify likely contacts at intent accounts
    - buying_stage: Predict buying stage from signal pattern
    - committee_mapping: Map likely buying committee members
  
  action_routing:
    - hot_accounts: Route to senior AE for immediate outreach
    - warm_accounts: Route to SDR for personalized outreach
    - nurture_accounts: Enroll in targeted nurture sequence
    - monitor_accounts: Add to passive monitoring list
  
  measurement:
    - intent_to_pipeline: Track intent accounts entering pipeline
    - intent_to_close: Track intent accounts closing
    - signal_accuracy: Measure false positive/negative rates
    - vendor_roas: Calculate ROI by intent data vendor
    - decay_calibration: Calibrate decay rates based on actual outcomes
```

### 11.2 Intent Signal Storage Schema

```yaml
intent_signal_schema:
  account_id: "LeadReach account identifier"
  signal_source: "first_party | second_party | third_party"
  signal_provider: "web_analytics | g2 | bombora | zoominfo | 6sense | builtwith"
  signal_type: "pricing_visit | demo_request | topic_surge | tech_add | etc."
  signal_value: "Normalized 0-100 score"
  raw_signal_data: "Provider-specific raw data (JSON)"
  detected_at: "Timestamp of signal detection (UTC)"
  expires_at: "Timestamp when signal expires (based on decay)"
  contact_id: "Known contact (if identifiable, null if anonymous)"
  contact_seniority: "C-suite | VP | Director | Manager | IC | unknown"
  buying_stage: "unaware | problem_aware | solution_aware | evaluating | decision"
  correlation_group: "ID linking correlated signals together"
  action_taken: "outreach_sent | nurture_enrolled | monitoring | none"
  outcome: "meeting_booked | opportunity_created | closed_won | closed_lost | no_action"
```

---

## Changelog

| Date | Change | Author |
|---|---|---|
| 2026-07-08 | Initial comprehensive document creation | Data Team |
| 2026-06-15 | Updated vendor comparison with 2026 pricing | Procurement |
| 2026-05-20 | Added dark funnel detection strategies | Intelligence Team |
| 2026-04-10 | Calibrated decay rates based on 12-month outcome data | Data Science |
| 2026-03-01 | Released multi-signal correlation framework v2 | ML Engineering |

---

*This document is maintained by the LeadReach Data Science and Intelligence teams. Intent signal effectiveness is measured quarterly and models are recalibrated based on actual pipeline outcomes.*
