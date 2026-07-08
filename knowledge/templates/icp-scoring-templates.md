---
title: "ICP Scoring Templates — Master Reference"
slug: templates-icp-scoring
category: template
grade: A
last_reviewed: 2026-07-08
tags: [icp, scoring, firmographic, technographic, intent-signals, engagement, bant, lead-scoring, industry-templates]
agents: [scout, sage, judge, atlas]
intent_types: [build_icp, score_lead, research_company]
priority: 95
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "Production-grade ICP scoring rubric templates covering firmographic, technographic, intent signal, and engagement scoring — including BANT overlay, negative scoring, threshold definitions, and industry-specific ICP templates for SaaS, fintech, and healthtech."
---

# ICP Scoring Templates — Master Reference

## 1. Overview

This file defines the canonical ICP (Ideal Customer Profile) scoring system used across the LeadReach platform. Every lead that enters the pipeline is scored against these rubrics by Sage (lead scorer) using data enriched by Scout (researcher). The scoring output drives routing, prioritization, and outreach personalization.

**Scoring Architecture:**

| Component | Score Range | Weight | Data Source |
|-----------|------------|--------|-------------|
| Firmographic Fit | 0–40 | 40% | Scout company enrichment |
| Technographic Fit | 0–20 | 20% | Scout technographic scan |
| Intent Signals | 0–20 | 20% | Scout intent monitoring |
| Engagement Level | 0–15 | 15% | Echo + Flow interaction data |
| Negative Adjustments | −20–0 | −20% cap | Judge compliance + data quality |
| **Total** | **0–100** | — | — |

**Score Thresholds:**

| Tier | Score Range | Action | SLA |
|------|------------|--------|-----|
| A+ (Hot) | 85–100 | Immediate outreach, priority routing | < 5 min |
| A (Warm) | 70–84 | Fast-track outreach, same-day | < 2 hrs |
| B (Qualified) | 50–69 | Standard queue, within 48 hrs | < 48 hrs |
| C (Nurture) | 30–49 | Automated nurture sequence | Weekly |
| D (Disqualify) | 0–29 | Archive, suppress outreach | None |

## 2. Firmographic Scoring Criteria

### 2.1 Firmographic Scoring Rubric

Firmographic scoring evaluates how well a company's structural attributes match the ICP. The maximum firmographic score is 40 points.

| Attribute | Criteria | Points | Notes |
|-----------|----------|--------|-------|
| **Industry** | Primary ICP industry | 10 | Must match one of defined ICP industries |
| | Adjacent industry | 5 | Industry with similar buying patterns |
| | Outside ICP | 0 | Disqualifier for some campaigns |
| **Employee Count** | ICP sweet spot (e.g., 50–500) | 8 | Highest conversion rates historically |
| | Near-sweet spot (20–49 or 501–1000) | 5 | Still viable but lower conversion |
| | Outside range (< 20 or > 1000) | 2 | Requires justification |
| **Annual Revenue** | ICP sweet spot (e.g., $5M–$100M) | 8 | Budget probability highest |
| | Near-sweet spot ($1M–$5M or $100M–$500M) | 4 | Budget may be constrained |
| | Outside range (< $1M or > $500M) | 1 | Budget or complexity mismatch |
| **Geography** | Primary market (e.g., US, UK, CA) | 5 | Language + regulatory alignment |
| | Secondary market (EU, ANZ) | 3 | May need localization |
| | Tertiary market | 1 | Higher friction |
| **Growth Trajectory** | High growth (> 50% YoY) | 5 | Strong indicator of need + budget |
| | Moderate growth (20–50% YoY) | 3 | Stable but expanding |
| | Flat or declining | 0 | Risk of budget freeze |
| **Company Stage** | Growth stage (Series B/C) | 4 | Ideal buying stage |
| | Scale stage (Series D+/PE-backed) | 3 | Budget available, longer cycles |
| | Early stage (Seed/Pre-seed) | 2 | Budget constrained |
| | Enterprise (Public/Late-stage) | 2 | Complex procurement |

### 2.2 Firmographic Score Calculation

```json
{
  "firmographic_score": {
    "max_points": 40,
    "attributes": {
      "industry": {
        "value": "{{account.industry}}",
        "icp_match": "primary|adjacent|outside",
        "points": "10|5|0",
        "weight": 1.0
      },
      "employee_count": {
        "value": "{{account.employee_count}}",
        "icp_range": "sweet_spot|near|outside",
        "points": "8|5|2",
        "weight": 1.0
      },
      "annual_revenue": {
        "value": "{{account.annual_revenue}}",
        "icp_range": "sweet_spot|near|outside",
        "points": "8|4|1",
        "weight": 1.0
      },
      "geography": {
        "value": "{{account.hq_country}}",
        "icp_match": "primary|secondary|tertiary",
        "points": "5|3|1",
        "weight": 1.0
      },
      "growth_trajectory": {
        "value": "{{account.yoy_growth_rate}}",
        "icp_match": "high|moderate|flat",
        "points": "5|3|0",
        "weight": 1.0
      },
      "company_stage": {
        "value": "{{account.funding_stage}}",
        "icp_match": "growth|scale|early|enterprise",
        "points": "4|3|2|2",
        "weight": 1.0
      }
    }
  }
}
```

## 3. Technographic Scoring Criteria

### 3.1 Technographic Scoring Rubric

Technographic scoring evaluates the prospect's technology stack alignment — both presence of ICP-indicative technologies and absence of competitor/incompatible tools. Maximum score: 20 points.

| Signal Type | Criteria | Points | Rationale |
|-------------|----------|--------|-----------|
| **ICP Tech Present** | Core ICP technology detected (e.g., Salesforce, HubSpot) | 8 | Indicates budget for sales tools + integration potential |
| | Supporting ICP technology (e.g., Gong, Outreach) | 4 | Sales tech maturity signal |
| | Single ICP technology | 3 | Some alignment |
| **Competitor Tech Absent** | No direct competitor product detected | 5 | Displacement not needed = easier sale |
| | Competitor product detected but contract expiring | 3 | Replacement opportunity |
| | Competitor product detected, mid-contract | 0 | Harder displacement |
| **Tech Stack Sophistication** | 5+ sales/marketing tools detected | 4 | Tech-forward culture, budget for tools |
| | 2–4 sales/marketing tools | 2 | Some adoption |
| | 0–1 sales/marketing tools | 0 | May not value technology solutions |
| **Integration Compatibility** | Native integration available with detected stack | 3 | Reduces implementation friction |
| | Custom integration required | 1 | Implementation cost may be objection |

### 3.2 Technographic Signal Mapping

```yaml
technographic_signals:
  icp_core_technologies:
    - name: "Salesforce"
      category: "CRM"
      points: 8
      indicates: "enterprise_crm_budget"
    - name: "HubSpot"
      category: "CRM"
      points: 6
      indicates: "mid_market_crm_budget"
    - name: "Outreach"
      category: "sales_engagement"
      points: 4
      indicates: "outbound_maturity"
    - name: "Gong"
      category: "conversation_intelligence"
      points: 4
      indicates: "sales_ops_sophistication"
    - name: "6sense"
      category: "intent_data"
      points: 4
      indicates: "demand_generation_maturity"
    - name: "ZoomInfo"
      category: "data_provider"
      points: 3
      indicates: "prospecting_infrastructure"

  competitor_products:
    - name: "CompetitorA"
      category: "ai_outbound"
      points_if_present: 0
      points_if_absent: 5
      displacement_difficulty: "high"
    - name: "CompetitorB"
      category: "sales_ai"
      points_if_present: 0
      points_if_absent: 4
      displacement_difficulty: "medium"
    - name: "CompetitorC"
      category: "lead_gen"
      points_if_present: 0
      points_if_absent: 3
      displacement_difficulty: "low"

  stack_sophistication:
    high: { tool_count: "5+", points: 4 }
    medium: { tool_count: "2-4", points: 2 }
    low: { tool_count: "0-1", points: 0 }
```

## 4. Intent Signal Scoring

### 4.1 Intent Signal Categories

Intent signals indicate active interest or need. They are the strongest predictors of purchase readiness. Maximum score: 20 points.

| Signal Category | Specific Signal | Points | Time Decay | Data Source |
|----------------|-----------------|--------|------------|-------------|
| **Research Intent** | Visited pricing page | 6 | −50% after 14 days | Web tracker / 6sense |
| | Visited product comparison page | 4 | −50% after 14 days | Web tracker |
| | Downloaded whitepaper/ebook | 3 | −50% after 30 days | Content platform |
| | Attended webinar | 3 | −50% after 30 days | Event platform |
| **Search Intent** | High-intent keyword search detected | 5 | −50% after 7 days | Bombora / Intent provider |
| | Medium-intent keyword search | 3 | −50% after 14 days | Bombora / Intent provider |
| | Branded keyword search (your brand) | 8 | −30% after 30 days | Search data |
| **Social Intent** | Followed company LinkedIn page | 2 | −50% after 60 days | LinkedIn |
| | Engaged with content (like/comment) | 2 | −50% after 30 days | LinkedIn |
| | Shared or reposted content | 3 | −50% after 30 days | LinkedIn |
| **Hiring Intent** | Posted job for relevant role (e.g., SDR Manager) | 5 | −50% after 60 days | Job boards |
| | Multiple relevant hires in 90 days | 4 | −50% after 90 days | Job boards |
| **Purchase Intent** | Requested demo on your site | 10 | −30% after 7 days | CRM |
| | Contacted sales directly | 8 | −30% after 14 days | CRM |
| | Issued RFP/RFI | 7 | −30% after 30 days | Public records |

### 4.2 Intent Score Time Decay Formula

```
effective_intent_score = base_score × (0.5 ^ (days_since_signal / decay_half_life))
```

Where:
- `base_score` = the points assigned to the signal
- `days_since_signal` = days elapsed since the signal was detected
- `decay_half_life` = the number of days after which the signal loses half its value

**Example:** A pricing page visit (6 points) detected 7 days ago with a 14-day half-life:
```
effective_score = 6 × (0.5 ^ (7/14)) = 6 × 0.707 = 4.24 points
```

### 4.3 Intent Signal Aggregation Rules

```yaml
intent_aggregation:
  max_total_intent_score: 20
  deduplication:
    rule: "same_signal_type_same_day"
    action: "keep_highest_score"
  multiple_signals:
    rule: "sum_all_qualifying_signals"
    cap: 20
  cross_signal_boost:
    condition: "research_intent + hiring_intent detected within 30 days"
    multiplier: 1.25
    cap: 20
```

## 5. Engagement Scoring Matrices

### 5.1 Engagement Scoring Rubric

Engagement scoring measures the depth and recency of a prospect's interaction with LeadReach outreach. Maximum score: 15 points.

| Engagement Type | Action | Points | Multiplier | Decay |
|----------------|--------|--------|------------|-------|
| **Email** | Opened email | 1 | ×1.0 | −50% / 14 days |
| | Clicked link in email | 2 | ×1.0 | −50% / 14 days |
| | Replied to email | 5 | ×1.5 if positive | −30% / 30 days |
| | Replied with meeting acceptance | 8 | ×2.0 | −30% / 14 days |
| **LinkedIn** | Accepted connection request | 2 | ×1.0 | −50% / 30 days |
| | Responded to LinkedIn message | 3 | ×1.5 if positive | −50% / 30 days |
| | Engaged with InMail | 2 | ×1.0 | −50% / 14 days |
| **Phone** | Answered call | 3 | ×1.0 | −50% / 7 days |
| | Had meaningful conversation | 5 | ×1.5 if positive | −50% / 14 days |
| | Voicemail left + callback received | 4 | ×1.0 | −50% / 14 days |
| **Content** | Downloaded gated content | 2 | ×1.0 | −50% / 30 days |
| | Attended live event/webinar | 3 | ×1.0 | −50% / 30 days |
| | Shared content socially | 2 | ×1.5 | −50% / 60 days |
| **Website** | Visited website (from outreach) | 1 | ×1.0 | −50% / 7 days |
| | Visited pricing/demo page | 3 | ×1.0 | −50% / 14 days |
| | Submitted form | 5 | ×2.0 | −50% / 30 days |

### 5.2 Engagement Velocity Score

Beyond individual engagement events, engagement velocity measures the *rate* of engagement over time — a high-velocity engager is more likely to convert.

```
engagement_velocity = (engagement_points_last_7_days / 7) × velocity_multiplier
```

| Velocity (points/week) | Classification | Velocity Multiplier |
|------------------------|---------------|-------------------|
| > 5 | High velocity | 1.5× |
| 2–5 | Medium velocity | 1.0× |
| 0.5–2 | Low velocity | 0.75× |
| < 0.5 | Dormant | 0.5× |

### 5.3 Engagement Recency Weighting

```json
{
  "recency_weights": {
    "last_24_hours": 1.5,
    "last_7_days": 1.2,
    "last_14_days": 1.0,
    "last_30_days": 0.8,
    "last_60_days": 0.6,
    "last_90_days": 0.4,
    "older_than_90_days": 0.2
  }
}
```

## 6. Budget / Authority / Need / Timeline Scoring

### 6.1 BANT Scoring Overlay

BANT adds a qualification dimension on top of ICP scoring. While ICP scoring determines *fit*, BANT scoring determines *readiness*. Both are needed for prioritization.

| BANT Dimension | Evidence | Points | Inference |
|---------------|----------|--------|-----------|
| **Budget** | Publicly known budget allocation | 10 | Direct evidence |
| | Funding round within 12 months | 8 | Budget likely available |
| | Company in ICP revenue sweet spot | 6 | Budget probable |
| | No budget signals | 0 | Unknown |
| | Budget constraint explicitly stated | −5 | Negative signal |
| **Authority** | Direct decision-maker title detected | 10 | Direct authority |
| | Influencer/Champion title detected | 6 | Indirect authority |
| | User/IC title detected | 3 | No buying authority |
| | Unknown title | 0 | Research needed |
| **Need** | Pain point explicitly stated (in content, job postings) | 10 | Direct need |
| | Pain point inferred from ICP + role | 7 | Strong inference |
| | Pain point inferred from industry only | 4 | Weak inference |
| | No need signals | 0 | No evidence |
| | Satisfied with current solution (stated) | −5 | Negative signal |
| **Timeline** | Active buying process detected | 10 | Immediate |
| | Trigger event within 90 days | 7 | Near-term |
| | Strategic initiative announced | 5 | Medium-term |
| | No timeline signals | 0 | Unknown |
| | Explicitly stated "not now" | −5 | Delayed |

### 6.2 BANT-Adjusted Priority Matrix

| BANT Score | ICP Score (A+) | ICP Score (A) | ICP Score (B) | ICP Score (C) |
|-----------|----------------|---------------|---------------|---------------|
| 30–40 | **P1 — Immediate** | **P1 — Immediate** | **P2 — Priority** | P3 — Nurture |
| 20–29 | **P1 — Immediate** | **P2 — Priority** | P3 — Nurture | P4 — Watch |
| 10–19 | **P2 — Priority** | P3 — Nurture | P3 — Nurture | P4 — Watch |
| 0–9 | P3 — Nurture | P4 — Watch | P4 — Watch | P5 — Archive |

### 6.3 BANT Signal Auto-Detection Rules

```yaml
bant_auto_detection:
  budget:
    - signal: "funding_round"
      source: "crunchbase"
      points: 8
      recency: "12_months"
    - signal: "revenue_in_icp_range"
      source: "zoominfo"
      points: 6
    - signal: "budget_concern_in_content"
      source: "scout_analysis"
      points: -5
  
  authority:
    - signal: "title_match_decision_maker"
      source: "linkedin"
      points: 10
      titles: ["CRO", "VP Sales", "VP Revenue", "Head of Growth", "CFO"]
    - signal: "title_match_influencer"
      source: "linkedin"
      points: 6
      titles: ["Director of Sales", "Director of Revenue Ops", "Sales Ops Manager"]
    - signal: "title_match_user"
      source: "linkedin"
      points: 3
      titles: ["SDR", "AE", "Account Executive", "Sales Development Rep"]
  
  need:
    - signal: "pain_point_in_job_description"
      source: "job_boards"
      points: 10
      keywords: ["outbound automation", "pipeline quality", "lead scoring", "sales AI"]
    - signal: "competitor_dissatisfaction_signal"
      source: "review_sites"
      points: 8
    - signal: "icp_role_pain_inference"
      source: "sage_inference"
      points: 7
  
  timeline:
    - signal: "rfp_published"
      source: "public_records"
      points: 10
    - signal: "trigger_event_90_days"
      source: "scout_triggers"
      points: 7
    - signal: "strategic_initiative_announced"
      source: "press_releases"
      points: 5
    - signal: "not_right_time_stated"
      source: "call_notes"
      points: -5
```

## 7. Negative Scoring Criteria

### 7.1 Negative Score Triggers

Negative scores reduce a lead's total score when disqualifying signals are detected. Maximum negative adjustment: −20 points.

| Negative Signal | Points | Category | Source |
|----------------|--------|----------|--------|
| **Fit Disqualifiers** | | | |
| Industry on blocklist | −10 | Hard disqualifier | Campaign config |
| Company on do-not-contact list | −20 | Hard disqualifier | Compliance DB |
| Employee count outside viable range | −5 | Soft disqualifier | Enrichment |
| Revenue below minimum threshold | −5 | Soft disqualifier | Enrichment |
| **Behavioral Disqualifiers** | | | |
| Unsubscribed from all communications | −20 | Hard disqualifier | Email platform |
| Marked previous email as spam | −15 | Hard disqualifier | Email platform |
| Multiple bounces on email | −10 | Data quality | Email platform |
| No engagement in 180+ days | −5 | Engagement decay | CRM |
| **Competitive Disqualifiers** | | | |
| Current customer of competitor (new contract) | −8 | Competitive | Technographic |
| Employee of competitor company | −20 | Hard disqualifier | LinkedIn |
| **Data Quality Penalties** | | | |
| Missing critical firmographic data | −3 | Data quality | Enrichment |
| Inconsistent data across sources | −2 | Data quality | Cross-reference |
| Suspected generic email (info@, sales@) | −5 | Contact quality | Email parser |

### 7.2 Negative Score Application Rules

```yaml
negative_scoring_rules:
  hard_disqualifiers:
    threshold: -15
    action: "remove_from_active_campaigns"
    notification: "alert_to_campaign_manager"
  
  soft_disqualifiers:
    threshold: -5_to_-14
    action: "reduce_priority"
    effect: "lower_queue_position"
  
  data_quality_penalties:
    threshold: -1_to_-4
    action: "flag_for_enrichment"
    effect: "trigger_scout_research"
  
  cumulative_cap: -20
  
  recovery:
    rule: "if_negative_signal_resolved"
    action: "restore_original_points"
    examples:
      - "bouncing email updated to valid address"
      - "missing firmographic data enriched"
      - "unsubscribed contact re-opted-in"
```

## 8. Scoring Threshold Definitions

### 8.1 Primary Thresholds

| Tier | Score | Classification | Routing | SLA | Expected Close Rate |
|------|-------|---------------|---------|-----|-------------------|
| A+ | 85–100 | Hot Lead | Direct to AE, skip SDR | < 5 min response | 25–35% |
| A | 70–84 | Warm Lead | Priority SDR queue | < 2 hrs response | 15–25% |
| B | 50–69 | Qualified Lead | Standard SDR queue | < 24 hrs response | 8–15% |
| C | 30–49 | Nurture Lead | Automated nurture | Weekly touchpoint | 3–8% |
| D | 0–29 | Disqualified | Archive / suppress | None | < 3% |

### 8.2 Dynamic Threshold Adjustment

Thresholds should be adjusted quarterly based on pipeline performance data:

```yaml
threshold_adjustment:
  frequency: "quarterly"
  inputs:
    - "overall_pipeline_conversion_rate"
    - "lead_volume_by_tier"
    - "average_deal_size_by_tier"
    - "sales_cycle_length_by_tier"
  
  rules:
    - condition: "pipeline_conversion_rate < 10%"
      action: "raise_A_threshold_by_5"
      rationale: "Too many leads classified as A, diluting focus"
    
    - condition: "pipeline_conversion_rate > 30%"
      action: "lower_A_threshold_by_5"
      rationale: "Can handle more priority leads"
    
    - condition: "lead_volume_in_tier_B > 500/month"
      action: "tighten_B_criteria"
      rationale: "Queue overflow, need more selectivity"
    
    - condition: "nurture_conversion_rate > 8%"
      action: "lower_C_threshold_by_5"
      rationale: "Nurture leads converting well, promote more"
```

### 8.3 Score Freshness Rules

| Data Type | Refresh Frequency | Score Re-evaluation |
|-----------|-------------------|-------------------|
| Firmographic data | Quarterly | On refresh |
| Technographic data | Monthly | On refresh |
| Intent signals | Daily | On detection + decay |
| Engagement data | Real-time | On each interaction |
| BANT signals | On detection | On detection |
| Negative signals | On detection | Immediate |

## 9. Industry-Specific ICP Templates

### 9.1 SaaS ICP Template

```yaml
icp_template:
  name: "SaaS Growth Stage"
  version: 2
  last_updated: "2026-07-08"
  
  firmographic_criteria:
    industry:
      primary: ["SaaS", "Cloud Software", "B2B Software"]
      adjacent: ["IT Services", "Digital Media", "MarTech"]
      points: { primary: 10, adjacent: 5, outside: 0 }
    
    employee_count:
      sweet_spot: "50-500"
      near: "20-49 or 501-1000"
      outside: "<20 or >1000"
      points: { sweet_spot: 8, near: 5, outside: 2 }
    
    revenue:
      sweet_spot: "$5M-$100M ARR"
      near: "$1M-$5M or $100M-$500M"
      outside: "<$1M or >$500M"
      points: { sweet_spot: 8, near: 4, outside: 1 }
    
    geography:
      primary: ["US", "UK", "Canada", "Australia"]
      secondary: ["Germany", "France", "Netherlands", "Nordics"]
      points: { primary: 5, secondary: 3, tertiary: 1 }
    
    growth:
      high_growth: ">50% YoY"
      moderate: "20-50% YoY"
      flat: "<20% YoY"
      points: { high_growth: 5, moderate: 3, flat: 0 }
    
    funding_stage:
      ideal: ["Series B", "Series C"]
      acceptable: ["Series A", "Series D+", "PE-backed"]
      less_ideal: ["Seed", "Bootstrapped", "Public"]
      points: { ideal: 4, acceptable: 3, less_ideal: 2 }
  
  technographic_criteria:
    core_technologies: ["Salesforce", "HubSpot"]
    supporting_technologies: ["Outreach", "Salesloft", "Gong", "Chorus"]
    data_providers: ["ZoomInfo", "Apollo", "Lusha"]
    competitor_products: ["CompetitorA", "CompetitorB"]
    integration_partners: ["Segment", "Zapier"]
  
  intent_signals:
    high_intent: ["pricing_page_visit", "demo_request", "branded_search"]
    medium_intent: ["comparison_page_visit", "webinar_attendance", "content_download"]
    low_intent: ["blog_visit", "social_follow", "newsletter_signup"]
  
  key_personas:
    primary:
      titles: ["CRO", "VP Sales", "VP Revenue", "Head of Growth"]
      focus: "pipeline generation, forecast accuracy, rep productivity"
    secondary:
      titles: ["Director of Sales Ops", "Director of RevOps", "Sales Ops Manager"]
      focus: "process automation, data quality, tool integration"
    tertiary:
      titles: ["SDR Manager", "SDR Team Lead"]
      focus: "outbound efficiency, personalization at scale"
  
  pain_points:
    - "Scaling outbound without losing personalization"
    - "Pipeline data quality degrading as team grows"
    - "SDR ramp time too long"
    - "Forecast accuracy below 70%"
    - "Tech stack fragmentation across sales tools"
  
  negative_signals:
    - "Sub-$1M ARR (likely no budget)"
    - "Enterprise-only sales motion (wrong ICP for our product)"
    - "Recently signed competitor deal (< 6 months)"
    - "No sales team (founder-led sales)"
```

### 9.2 Fintech ICP Template

```yaml
icp_template:
  name: "Fintech Scaling Stage"
  version: 2
  last_updated: "2026-07-08"
  
  firmographic_criteria:
    industry:
      primary: ["Fintech", "Banking Technology", "Payments", "Lending", "Insurtech", "WealthTech"]
      adjacent: ["RegTech", "Crypto/Web3", "Financial Services"]
      points: { primary: 10, adjacent: 5, outside: 0 }
    
    employee_count:
      sweet_spot: "100-1000"
      near: "50-99 or 1001-5000"
      points: { sweet_spot: 8, near: 5, outside: 2 }
    
    revenue:
      sweet_spot: "$10M-$250M"
      near: "$5M-$10M or $250M-$1B"
      points: { sweet_spot: 8, near: 4, outside: 1 }
    
    geography:
      primary: ["US", "UK", "Singapore"]
      secondary: ["EU", "Australia", "Canada"]
      points: { primary: 5, secondary: 3, tertiary: 1 }
    
    regulatory_status:
      licensed: 5
      license_pending: 3
      unlicensed: 0
  
  technographic_criteria:
    core_technologies: ["Salesforce Financial Services Cloud", "HubSpot"]
    compliance_tools: ["OneTrust", "TrustArc", "Vera"]
    data_infrastructure: ["Snowflake", "Databricks", "Plaid"]
    competitor_products: ["CompetitorF1", "CompetitorF2"]
  
  key_personas:
    primary:
      titles: ["CRO", "VP Sales", "Head of Partnerships", "COO"]
      focus: "compliant pipeline growth, partner channel, regulatory-ready outreach"
    secondary:
      titles: ["VP Compliance", "Head of Risk", "Compliance Officer"]
      focus: "audit-ready processes, consent management"
    tertiary:
      titles: ["VP Product", "CTO"]
      focus: "API integrations, data security, SOC 2 compliance"
  
  pain_points:
    - "Compliance constraints slowing outbound velocity"
    - "Multi-stakeholder buying committees"
    - "Long sales cycles with regulatory approval steps"
    - "Partner channel management complexity"
    - "Data residency and consent requirements across jurisdictions"
  
  negative_signals:
    - "Pre-revenue fintech (budget risk)"
    - "Consumer-only fintech (B2C model doesn't fit)"
    - "Regulatory action or sanctions (reputational risk)"
    - "Recently failed audit (too early for our solution)"
```

### 9.3 Healthtech ICP Template

```yaml
icp_template:
  name: "Healthtech Provider-Facing"
  version: 2
  last_updated: "2026-07-08"
  
  firmographic_criteria:
    industry:
      primary: ["Healthtech", "Digital Health", "Health IT", "MedTech", "EHR/EMR"]
      adjacent: ["Telehealth", "Healthcare Analytics", "Life Sciences"]
      points: { primary: 10, adjacent: 5, outside: 0 }
    
    employee_count:
      sweet_spot: "50-500"
      near: "20-49 or 501-2000"
      points: { sweet_spot: 8, near: 5, outside: 2 }
    
    revenue:
      sweet_spot: "$5M-$100M"
      near: "$2M-$5M or $100M-$500M"
      points: { sweet_spot: 8, near: 4, outside: 1 }
    
    geography:
      primary: ["US"]
      secondary: ["UK", "Canada", "Australia"]
      points: { primary: 5, secondary: 3, tertiary: 1 }
    
    compliance_status:
      hipaa_compliant: 5
      soc2_type2: 3
      fda_cleared: 4
      none_detected: 0
  
  technographic_criteria:
    core_technologies: ["Salesforce Health Cloud", "HubSpot"]
    ehr_integrations: ["Epic", "Cerner", "Athenahealth"]
    compliance_tools: ["Veeva", "ComplianceQuest"]
    data_infrastructure: ["Redshift", "Snowflake"]
    competitor_products: ["CompetitorH1", "CompetitorH2"]
  
  key_personas:
    primary:
      titles: ["CRO", "VP Sales", "VP Commercial", "Chief Growth Officer"]
      focus: "provider adoption, clinical workflow integration, committee-based sales"
    secondary:
      titles: ["VP Product", "Head of Clinical", "CMIO"]
      focus: "clinical validation, EHR integration, workflow design"
    tertiary:
      titles: ["VP Marketing", "Head of Demand Gen"]
      focus: "provider education, clinical evidence marketing"
  
  pain_points:
    - "Provider adoption slower than projected"
    - "Hospital buying committee complexity (6-12 month cycles)"
    - "Clinical workflow integration friction"
    - "EHR compatibility requirements"
    - "Regulatory compliance overhead on sales process"
    - "Measuring ROI for clinical customers"
  
  negative_signals:
    - "Pre-clinical stage (too early)"
    - "Direct-to-consumer only (B2C model)"
    - "No HIPAA compliance plan (blocking issue)"
    - "Under FDA review (uncertain timeline)"
```

## 10. Scoring Output JSON Schema

The final scoring output produced by Sage for each lead:

```json
{
  "lead_id": "string",
  "company_id": "string",
  "contact_id": "string",
  "score": {
    "total": "number (0-100)",
    "tier": "A+|A|B|C|D",
    "priority": "P1|P2|P3|P4|P5",
    "components": {
      "firmographic": {
        "score": "number (0-40)",
        "details": {
          "industry": { "value": "string", "match": "primary|adjacent|outside", "points": "number" },
          "employee_count": { "value": "number", "match": "sweet_spot|near|outside", "points": "number" },
          "revenue": { "value": "number", "match": "sweet_spot|near|outside", "points": "number" },
          "geography": { "value": "string", "match": "primary|secondary|tertiary", "points": "number" },
          "growth": { "value": "string", "match": "high|moderate|flat", "points": "number" },
          "stage": { "value": "string", "match": "growth|scale|early|enterprise", "points": "number" }
        }
      },
      "technographic": {
        "score": "number (0-20)",
        "details": {
          "icp_tech_present": { "technologies": ["string"], "points": "number" },
          "competitor_tech_absent": { "competitors": ["string"], "points": "number" },
          "stack_sophistication": { "tool_count": "number", "points": "number" },
          "integration_compatibility": { "compatible": "boolean", "points": "number" }
        }
      },
      "intent": {
        "score": "number (0-20)",
        "signals": [
          {
            "type": "string",
            "source": "string",
            "base_points": "number",
            "effective_points": "number",
            "detected_date": "date",
            "decay_applied": "number"
          }
        ]
      },
      "engagement": {
        "score": "number (0-15)",
        "velocity": "number",
        "velocity_classification": "high|medium|low|dormant",
        "recent_interactions": [
          {
            "channel": "email|linkedin|phone|content|website",
            "action": "string",
            "date": "date",
            "points": "number"
          }
        ]
      },
      "negative": {
        "adjustment": "number (-20 to 0)",
        "signals": [
          {
            "type": "string",
            "points": "number",
            "source": "string"
          }
        ]
      }
    },
    "bant_overlay": {
      "budget": { "score": "number (0-10)", "evidence": "string" },
      "authority": { "score": "number (0-10)", "evidence": "string" },
      "need": { "score": "number (0-10)", "evidence": "string" },
      "timeline": { "score": "number (0-10)", "evidence": "string" },
      "total_bant": "number (0-40)"
    }
  },
  "routing": {
    "action": "immediate_outreach|fast_track|standard_queue|nurture|archive",
    "assigned_to": "string",
    "sla": "string",
    "icp_template_used": "string"
  },
  "metadata": {
    "scored_at": "datetime",
    "scorer_version": "string",
    "data_freshness": {
      "firmographic": "date",
      "technographic": "date",
      "intent": "date",
      "engagement": "date"
    }
  }
}
```

## 11. Scoring Rules Engine Configuration

```yaml
scoring_engine:
  version: "2.0"
  execution_mode: "real_time"
  
  pre_scoring:
    - step: "enrichment_check"
      rule: "ensure_all_firmographic_fields_populated"
      fallback: "trigger_scout_enrichment"
    
    - step: "deduplication"
      rule: "check_for_existing_lead_record"
      action: "merge_if_duplicate_found"
    
    - step: "suppression_check"
      rule: "check_against_do_not_contact_list"
      action: "skip_scoring_if_suppressed"
  
  scoring_pipeline:
    - step: 1
      name: "firmographic_scoring"
      input: "enriched_company_data"
      output: "firmographic_score (0-40)"
    
    - step: 2
      name: "technographic_scoring"
      input: "technographic_scan_results"
      output: "technographic_score (0-20)"
    
    - step: 3
      name: "intent_scoring"
      input: "intent_signal_data"
      output: "intent_score (0-20)"
      processing: "apply_time_decay_to_each_signal"
    
    - step: 4
      name: "engagement_scoring"
      input: "interaction_history"
      output: "engagement_score (0-15)"
      processing: "apply_velocity_calculation"
    
    - step: 5
      name: "negative_adjustment"
      input: "negative_signal_data"
      output: "negative_adjustment (-20 to 0)"
      processing: "apply_cumulative_cap"
    
    - step: 6
      name: "total_calculation"
      formula: "firmographic + technographic + intent + engagement + negative"
      output: "total_score (0-100)"
    
    - step: 7
      name: "tier_assignment"
      formula: "map_total_to_tier_threshold"
      output: "tier (A+|A|B|C|D)"
    
    - step: 8
      name: "bant_overlay"
      input: "bant_signals"
      output: "bant_score (0-40)"
      processing: "combine_with_icp_score_for_priority"
  
  post_scoring:
    - step: "routing_decision"
      rule: "map_tier_and_priority_to_action"
    
    - step: "sla_assignment"
      rule: "assign_response_sla_based_on_tier"
    
    - step: "notification"
      rule: "notify_assigned_rep_if_tier_A_or_A+"
```

## 12. Quick-Reference: Scoring Decision Tree

```
INCOMING LEAD
  │
  ├─ Suppression Check
  │   ├─ On DNC list → ARCHIVE (skip scoring)
  │   ├─ Competitor employee → ARCHIVE (skip scoring)
  │   └─ Passes → Continue
  │
  ├─ Firmographic Scoring (0-40)
  │   ├─ Industry match → 0-10
  │   ├─ Employee count → 0-8
  │   ├─ Revenue range → 0-8
  │   ├─ Geography → 0-5
  │   ├─ Growth → 0-5
  │   └─ Stage → 0-4
  │
  ├─ Technographic Scoring (0-20)
  │   ├─ ICP tech present → 0-8
  │   ├─ Competitor absent → 0-5
  │   ├─ Stack sophistication → 0-4
  │   └─ Integration compat → 0-3
  │
  ├─ Intent Scoring (0-20) [with time decay]
  │   ├─ Research intent → 0-6
  │   ├─ Search intent → 0-8
  │   ├─ Social intent → 0-3
  │   ├─ Hiring intent → 0-5
  │   └─ Purchase intent → 0-10
  │
  ├─ Engagement Scoring (0-15) [with velocity]
  │   ├─ Email engagement → 0-8
  │   ├─ LinkedIn engagement → 0-3
  │   ├─ Phone engagement → 0-5
  │   └─ Content/Web engagement → 0-5
  │
  ├─ Negative Adjustment (-20 to 0)
  │
  ├─ TOTAL SCORE (0-100)
  │   ├─ 85-100 → A+ (Hot) → Immediate outreach
  │   ├─ 70-84  → A (Warm) → Fast-track
  │   ├─ 50-69  → B (Qualified) → Standard queue
  │   ├─ 30-49  → C (Nurture) → Automated nurture
  │   └─ 0-29   → D (Disqualify) → Archive
  │
  └─ BANT Overlay for A/A+ leads → Refine priority within tier
```

---

*This ICP scoring system is maintained by LeadReach Knowledge Engineering. Scoring weights and thresholds should be recalibrated quarterly based on actual conversion data. For modifications, submit a PR with the `icp-scoring` label. Last validated against production pipeline data on 2026-07-01.*
