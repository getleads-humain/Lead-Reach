---
title: "ICP Discovery — Playbook"
category: playbook
playbook: icp-discovery
tags: [icp, ideal-customer-profile, segmentation, fit-scoring]
last_reviewed: "2026-06-22"
grade: "A"
author: "LeadReach Knowledge Team"
---

# ICP Discovery — Playbook

This playbook is the canonical reference for the Atlas agent's ICP-discovery and decomposition skills. It covers the definition of an Ideal Customer Profile, the 5-dimension framework for ICP discovery, segment scoring, and hand-off to Scout for prospect discovery.

## 1. What is an ICP?

An Ideal Customer Profile (ICP) is a **quantitative, falsifiable definition of the accounts most likely to become high-LTV customers**. It is not a persona, not a target market, not a "vibe". A well-defined ICP allows Scout to find 1,000+ matching accounts in a target region; a poorly-defined ICP returns 50 unrelated accounts.

A real ICP has three properties:

1. **Quantitative**: Every dimension is measurable (headcount, ARR, NAICS code, technology installed, hiring velocity).
2. **Falsifiable**: For any given account, you can answer "yes" or "no" to whether it matches — no subjective judgment.
3. **Sufficient population**: At least 1,000 accounts in the target region match the ICP. If fewer, the ICP is too narrow.

## 2. The 5-Dimension Framework

A complete ICP specifies all five dimensions:

### Dimension 1: Firmographics (Required)

Objective, measurable company attributes.

| Attribute | Example | Source |
|-----------|---------|--------|
| Industry (NAICS / SIC) | 541511 (Custom Computer Programming Services) | LinkedIn, ZoomInfo |
| Headcount | 50–500 | LinkedIn |
| Revenue | $5M–$100M ARR | ZoomInfo, Owler (estimate) |
| Geography | US, UK, DACH | LinkedIn |
| Funding stage | Series B+ | Crunchbase, PitchBook |
| Years in business | 3+ | LinkedIn, Crunchbase |

### Dimension 2: Technographics (Required for SaaS)

The technology stack installed at the account.

| Attribute | Example | Source |
|-----------|---------|--------|
| CRM | Salesforce, HubSpot | BuiltWith, HG Insights |
| Sales engagement | Outreach, Salesloft, Lemlist | BuiltWith |
| Marketing automation | Marketo, Pardot, HubSpot | BuiltWith |
| Data warehouse | Snowflake, BigQuery, Redshift | HG Insights |
| Observability | Datadog, New Relic, Splunk | HG Insights |
| Cloud provider | AWS, GCP, Azure | HG Insights |

### Dimension 3: Behavioral Signals (Required for Outbound)

Recent, observable events that indicate buying readiness.

| Signal | Example | Source |
|-------|---------|--------|
| Funding | Series B closed in last 90 days | Crunchbase, PitchBook |
| Hiring | Hiring SDR/BDR/AE roles in last 30 days | LinkedIn, careers page |
| Leadership change | New CRO / VP Sales in last 60 days | LinkedIn |
| Product launch | New product launched in last 30 days | Press, Product Hunt |
| M&A | Acquired or acquiring in last 90 days | Press, SEC filings |
| Earnings call | Mentioned "pipeline" or "sales efficiency" | Earnings transcripts |
| Expansion | Geographic expansion announced | Press |
| Negative news | Recent outage, breach, regulatory action | News, G2 reviews |

### Dimension 4: Trigger Events (Optional, Improves Priority)

Time-bound events that create urgency.

| Trigger | Window | Notes |
|---------|--------|-------|
| Recent funding | 90 days | Highest-signal trigger |
| New CRO / VP Sales | 60 days | Often brings new tooling budget |
| Recent product launch | 30 days | Often needs outreach tooling for launch |
| New fiscal year | 30 days | Budget refresh |
| Recent M&A | 90 days | Integration tooling demand |
| Recent compliance event | 30 days | Compliance tooling demand |

### Dimension 5: Exclusions (Required)

Accounts to exclude even if they match other dimensions.

| Exclusion | Rationale |
|-----------|-----------|
| Existing customers | No outbound to existing customers (use CSM) |
| Recent cancellations | 12-month cooldown |
| Recent lost deals | 6-month cooldown |
| Direct competitors | Do not outbound to competitors |
| Subsidiaries of competitors | Same |
| Government accounts (unless targeting gov) | Long cycles, requires GSA schedule |
| Accounts below minimum ACV | Below LTV:CAC ratio |
| Accounts in blocked regions | Sanctioned countries |

## 3. ICP Definition Template

Atlas uses the following template when an operator defines an ICP:

```yaml
icp:
  name: "SaaS B2B Series B+ — US"
  version: "1.0"
  firmographics:
    industry: ["541511", "541512", "518210"]  # NAICS codes
    headcount_min: 50
    headcount_max: 500
    revenue_min_mrr: 500000  # $5M ARR
    revenue_max_mrr: 10000000  # $100M ARR
    funding_stages: ["series_b", "series_c", "series_d", "growth"]
    geography: ["US"]
    years_in_business_min: 3
  technographics:
    crm: ["salesforce", "hubspot"]
    sales_engagement: ["outreach", "salesloft", "lemlist", "reply"]
    exclude_crm: ["pipedrive", "attio"]  # too small for our ACV
  behavioral_signals:
    - type: "funding"
      window_days: 90
      weight: 1.0
    - type: "hiring"
      roles: ["sdR", "bdr", "ae", "account_executive"]
      window_days: 30
      weight: 0.8
    - type: "leadership_change"
      titles: ["cro", "vp_sales", "vp_revenue"]
      window_days: 60
      weight: 0.7
  trigger_events:
    - type: "recent_funding"
      window_days: 90
    - type: "new_cro"
      window_days: 60
  exclusions:
    - "existing_customers"
    - "recent_cancellations_12m"
    - "recent_lost_deals_6m"
    - "competitors"
    - "government_accounts"
  minimum_population: 1000
  expected_acv_min: 36000  # $3k/mo
  expected_sales_cycle_days: 60
```

## 4. ICP Validation

Once an ICP is defined, Atlas validates it before handing off to Scout:

1. **Population check**: Scout runs a count query against the ICP. If population < 1,000, return error and ask operator to broaden.
2. **Sample audit**: Pull 20 random accounts from the population. Manual review by operator — confirm fit. If >20% don't fit, tighten ICP.
3. **Win-rate backtest**: Pull last 100 closed-won deals. What % match the ICP? If <70%, the ICP is wrong (too narrow or mis-specified).
4. **Loss-rate backtest**: Pull last 100 closed-lost deals. What % match the ICP? If >30%, the ICP is too broad.

## 5. ICP-to-Scout Handoff

Once validated, Atlas hands off to Scout:

```yaml
handoff:
  to_agent: "scout"
  icp: <icp_definition>
  seed_list: <optional_seed_list>
  target_population: 1000
  region: "US"
  channels: ["linkedin", "apollo", "exa", "gmaps"]
  deadline: "7 days"
```

Scout then runs discovery across channels, returning a ranked list of accounts with contact info and signal scores.

## 6. Common ICP Definition Mistakes

1. **"VP of Sales at SaaS companies"** — Not an ICP. Missing firmographics (headcount, revenue), missing technographics, missing signals, missing exclusions.
2. **"Mid-market companies"** — Vague. Define "mid-market" with revenue and headcount ranges.
3. **"Companies that need LeadReach"** — Circular. Define what makes a company need LeadReach (headcount, hiring SDRs, recent funding, using Outreach/Salesloft).
4. **No exclusions** — Without exclusions, Scout will surface customers, competitors, and recent losses.
5. **Population too small** — ICP of "SaaS B2B Series B+ in Wyoming" might match 5 accounts. Either broaden geography or accept the small population.
6. **No technographics** — For SaaS, technographics are critical. If the account doesn't use Salesforce or HubSpot, LeadReach can't integrate.
7. **Subjective criteria** — "Companies that value innovation" is not falsifiable. Replace with "companies that published a tech blog post in last 90 days".

## 7. ICP Iteration

ICPs should be reviewed quarterly:

1. **Quarterly review**: Did win rate improve? Did cycle time decrease? Did ACV increase?
2. **Annual review**: Is the ICP still relevant? Has the market shifted?
3. **Trigger-based review**: Major market event (e.g., tech layoffs, funding winter) may require ICP adjustment.

## 8. Authoring Notes / Gaps

- Need a **vertical-specific ICP templates** library (SaaS, FinTech, HealthTech, Ecommerce, Manufacturing).
- Need a **technographic data source** comparison (BuiltWith vs HG Insights vs ActiveDemand).
- Need a **signal source** comparison (Crunchbase vs PitchBook vs LinkedIn).
- Need a **win-rate backtest** automation script.
- Need a **ICP versioning** strategy (how to evolve ICPs without breaking Scout).

These will be addressed in future monthly gap reports.
