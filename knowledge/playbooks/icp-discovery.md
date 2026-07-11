---
title: "ICP Discovery — Playbook"
category: playbook
playbook: icp-discovery
tags: [icp, ideal-customer-profile, segmentation, fit-scoring]
last_reviewed: "2026-07-08"
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

### 1.1 ICP vs. Buyer Persona vs. Target Market

These three concepts are frequently confused. Clarifying the distinction is essential because each serves a different purpose in the LeadReach pipeline:

| Concept | Scope | Example | LeadReach Agent |
|---------|-------|---------|-----------------|
| **Target Market** | The broadest category of potential buyers | "B2B SaaS companies" | Atlas (strategy level) |
| **ICP** | The specific type of account most likely to buy | "US B2B SaaS, 50-500 FTE, Salesforce, Series B+, hiring SDRs" | Atlas + Judge (scoring) |
| **Buyer Persona** | The individual decision-maker at an ICP account | "VP Sales, 5+ years tenure, former AE, reports to CRO" | Bard (messaging) |

The ICP determines **which accounts** to target. The buyer persona determines **who** at those accounts to contact and **what** to say. The target market determines the **overall business strategy**. LeadReach agents must not conflate these — messaging to a persona is useless if the account doesn't match the ICP, and finding ICP-matched accounts is useless if you don't know which persona to contact.

### 1.2 The ICP Maturity Model

Organizations evolve through four levels of ICP maturity:

| Level | Name | Description | Typical Population Estimate | Conversion Rate |
|-------|------|-------------|----------------------------|-----------------|
| 1 | Vague | "SaaS companies" or "mid-market" | 50,000+ | 0.5–1% |
| 2 | Segmented | "B2B SaaS, 50-500 FTE, US" | 5,000–10,000 | 2–4% |
| 3 | Multi-dimensional | Adds technographics, behavioral signals, exclusions | 500–2,000 | 5–10% |
| 4 | Dynamic | ICP auto-refines based on win/loss data; multi-ICP for different segments | Varies by segment | 10–20% |

Most companies operate at Level 2. LeadReach targets Level 3–4 as the default operating mode. The gap between Level 2 and Level 3 is where the biggest conversion improvement lives — adding technographics and behavioral signals typically improves conversion rates by 3–5x.

## 2. The 5-Dimension Framework

A complete ICP specifies all five dimensions:

### Dimension 1: Firmographics (Required)

Objective, measurable company attributes.

| Attribute | Example | Source | Priority |
|-----------|---------|--------|----------|
| Industry (NAICS / SIC) | 541511 (Custom Computer Programming Services) | LinkedIn, ZoomInfo | Required |
| Headcount | 50–500 | LinkedIn | Required |
| Revenue | $5M–$100M ARR | ZoomInfo, Owler (estimate) | Required |
| Geography | US, UK, DACH | LinkedIn | Required |
| Funding stage | Series B+ | Crunchbase, PitchBook | High |
| Years in business | 3+ | LinkedIn, Crunchbase | Medium |
| Ownership structure | Founder-led, PE-backed, public | Crunchbase, SEC | Medium |
| Growth rate | >15% YoY headcount growth | LinkedIn (comparing snapshots) | Medium |
| Business model | Subscription, marketplace, usage-based | Company website, SEC | Medium |
| Customer type | B2B, B2C, B2B2C | Company website | Low |

#### Firmographic Scoring Matrix

For each firmographic attribute, assign points based on how closely the account matches:

| Match Level | Definition | Points Awarded | Example |
|------------|-----------|----------------|---------|
| Hard match | Exact match to ICP criterion | 100% of max points | ICP requires "US" → account is US-based |
| Soft match | Within acceptable range | 60% of max points | ICP requires "50-500 FTE" → account has 45 FTE |
| Adjacent | Related but not matching | 30% of max points | ICP requires "B2B SaaS" → account is B2B IT Services |
| No match | Does not match | 0% of max points | ICP requires "US" → account is in Japan |
| Anti-match | Actively disqualifying | -50% of max points | ICP excludes "government" → account is a gov agency |
| Unknown | Data not available | Redistribute weight | No revenue data found |

### Dimension 2: Technographics (Required for SaaS)

The technology stack installed at the account.

| Attribute | Example | Source | Priority |
|-----------|---------|--------|----------|
| CRM | Salesforce, HubSpot | BuiltWith, HG Insights | Required for SaaS |
| Sales engagement | Outreach, Salesloft, Lemlist | BuiltWith | High |
| Marketing automation | Marketo, Pardot, HubSpot | BuiltWith | High |
| Data warehouse | Snowflake, BigQuery, Redshift | HG Insights | Medium |
| Observability | Datadog, New Relic, Splunk | HG Insights | Medium |
| Cloud provider | AWS, GCP, Azure | HG Insights | Medium |
| Programming language | Python, Node.js, Java | GitHub, job postings | Low |
| Integration platform | Zapier, Workato, MuleSoft | BuiltWith | Low |

#### Technographic Signal Strength by Product Type

The value of technographic data depends on what you sell:

| Your Product Type | Technographic Importance | Key Signals | Why |
|-------------------|------------------------|-------------|-----|
| CRM adjacent / integrations | ★★★★★ | CRM type + version | Must integrate with their CRM |
| Sales engagement competitor | ★★★★★ | Current engagement tool + contract timing | Direct displacement play |
| Data / analytics | ★★★★☆ | Data warehouse, BI tools | Must connect to data sources |
| DevTools | ★★★★☆ | Language, framework, CI/CD | Must fit their stack |
| Marketing automation | ★★★☆☆ | MAP, email tool, CMS | Integration surface |
| Generic business tool | ★★☆☆☆ | Less relevant | Works regardless of stack |

### Dimension 3: Behavioral Signals (Required for Outbound)

Recent, observable events that indicate buying readiness.

| Signal | Example | Source | Signal Strength |
|-------|---------|--------|-----------------|
| Funding | Series B closed in last 90 days | Crunchbase, PitchBook | ★★★★★ |
| Hiring | Hiring SDR/BDR/AE roles in last 30 days | LinkedIn, careers page | ★★★★☆ |
| Leadership change | New CRO / VP Sales in last 60 days | LinkedIn | ★★★★★ |
| Product launch | New product launched in last 30 days | Press, Product Hunt | ★★★☆☆ |
| M&A | Acquired or acquiring in last 90 days | Press, SEC filings | ★★★★☆ |
| Earnings call | Mentioned "pipeline" or "sales efficiency" | Earnings transcripts | ★★★☆☆ |
| Expansion | Geographic expansion announced | Press | ★★★★☆ |
| Negative news | Recent outage, breach, regulatory action | News, G2 reviews | ★★★☆☆ |
| Job postings | "Manual processes" in job description | Greenhouse, Lever | ★★★☆☆ |
| Patent filing | Filed patent in relevant domain | USPTO, Google Patents | ★★☆☆☆ |
| Conference speaking | Keynote at industry event | Event websites | ★★★☆☆ |
| Content publishing | Published thought-leadership content | Company blog, Medium | ★★☆☆☆ |

#### Behavioral Signal Scoring Weights

| Signal Category | Weight | Decay Function | Rationale |
|----------------|--------|---------------|-----------|
| Funding (last 90 days) | 25 | 10% per 30 days | Cash to spend; GTM mandates |
| Leadership change (last 60 days) | 20 | 15% per 30 days | New leaders bring new budgets and priorities |
| Hiring surge (last 30 days) | 20 | 20% per 30 days | Growth mode; need tooling to support new hires |
| Product launch (last 30 days) | 10 | 20% per 30 days | New GTM motions need new tooling |
| M&A (last 90 days) | 10 | 5% per 30 days | Integration needs; long cycle |
| Expansion (last 60 days) | 10 | 10% per 30 days | New markets need new capabilities |
| Negative news (last 14 days) | 5 | 50% per 14 days | Displacement opportunity; short window |

### Dimension 4: Trigger Events (Optional, Improves Priority)

Time-bound events that create urgency.

| Trigger | Window | Urgency Level | Notes |
|---------|--------|--------------|-------|
| Recent funding | 90 days | High | Highest-signal trigger; creates immediate budget |
| New CRO / VP Sales | 60 days | High | Often brings new tooling budget; "first 90 days" window |
| Recent product launch | 30 days | Medium | Often needs outreach tooling for launch |
| New fiscal year | 30 days | Medium | Budget refresh; new annual priorities |
| Recent M&A | 90 days | Medium | Integration tooling demand; complex buying |
| Recent compliance event | 30 days | Medium | Compliance tooling demand; regulatory urgency |
| Competitor contract expiry | 60 days | High | Displacement window; check renewal dates |
| Board mandate | 30 days | High | Executive-driven urgency; fast track possible |

#### Trigger Stacking

When multiple triggers fire on the same account, the effect is **multiplicative**, not additive:

- 1 trigger: Standard sequence priority
- 2 triggers: 1.5× priority boost; fast-track to AE
- 3+ triggers: 2.5× priority boost; direct executive outreach

Example: An account that just raised Series B AND hired a new CRO AND is hiring 5 SDRs is the hottest possible lead — all three triggers point to immediate need and available budget.

### Dimension 5: Exclusions (Required)

Accounts to exclude even if they match other dimensions.

| Exclusion | Rationale | Cooldown Period |
|-----------|-----------|-----------------|
| Existing customers | No outbound to existing customers (use CSM) | While active customer |
| Recent cancellations | Brand damage risk; need time | 12-month cooldown |
| Recent lost deals | Memory of competitive loss | 6-month cooldown |
| Direct competitors | Do not outbound to competitors | Permanent |
| Subsidiaries of competitors | Same risk | Permanent |
| Government accounts (unless targeting gov) | Long cycles, requires GSA schedule | Permanent (unless gov-focused) |
| Accounts below minimum ACV | Below LTV:CAC ratio | Permanent |
| Accounts in blocked regions | Sanctioned countries; legal risk | Permanent |
| Accounts in active litigation | Legal risk | While litigation active |
| Accounts with recent privacy complaints | Compliance risk | 12-month cooldown |
| Non-profit / educational (unless targeting) | Low ACV; different buying process | Permanent (unless segment) |

#### Exclusion Logic Implementation

Atlas agent applies exclusions in this order:

1. **Hard exclusions** (permanent): Competitors, sanctioned regions, litigation. These override all other scores — the account is removed from the TAM entirely.
2. **Time-based exclusions** (cooldown): Recent cancellations, lost deals. These expire after the cooldown period; the account re-enters the TAM automatically.
3. **Conditional exclusions** (threshold-based): Below minimum ACV, government accounts. These apply only if the condition holds; if the account's estimated ACV rises above threshold, the exclusion lifts.

## 3. ICP Definition Template

Atlas uses the following template when an operator defines an ICP:

```yaml
icp:
  name: "SaaS B2B Series B+ — US"
  version: "2.0"
  firmographics:
    industry: ["541511", "541512", "518210"]  # NAICS codes
    headcount_min: 50
    headcount_max: 500
    revenue_min_mrr: 500000  # $5M ARR
    revenue_max_mrr: 10000000  # $100M ARR
    funding_stages: ["series_b", "series_c", "series_d", "growth"]
    geography: ["US"]
    years_in_business_min: 3
    business_model: ["subscription", "usage_based"]
    growth_rate_min_yoy: 0.15  # 15% YoY
    ownership: ["founder_led", "vc_backed", "pe_backed"]
  technographics:
    crm: ["salesforce", "hubspot"]
    sales_engagement: ["outreach", "salesloft", "lemlist", "reply"]
    exclude_crm: ["pipedrive", "attio"]  # too small for our ACV
    marketing_automation: ["marketo", "pardot", "hubspot"]
    cloud: ["aws", "gcp", "azure"]
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
    - type: "product_launch"
      window_days: 30
      weight: 0.4
    - type: "expansion"
      window_days: 60
      weight: 0.5
  trigger_events:
    - type: "recent_funding"
      window_days: 90
    - type: "new_cro"
      window_days: 60
    - type: "competitor_contract_expiry"
      window_days: 60
  exclusions:
    hard:
      - "competitors"
      - "sanctioned_regions"
    time_based:
      - type: "recent_cancellations"
        cooldown_months: 12
      - type: "recent_lost_deals"
        cooldown_months: 6
    conditional:
      - type: "below_minimum_acv"
        threshold: 36000  # $3K/mo
      - type: "government_accounts"
        unless: "gov_segment_enabled"
  buyer_personas:
    - name: "VP Sales"
      title_patterns: ["vp sales", "vp of sales", "head of sales"]
      seniority: "vp"
      min_tenure_months: 3
      messaging_angle: "pipeline_coverage_and_sdr_efficiency"
    - name: "Sales Ops Director"
      title_patterns: ["director sales ops", "director revenue ops", "head of sales ops"]
      seniority: "director"
      min_tenure_months: 6
      messaging_angle: "workflow_automation_and_data_quality"
    - name: "CRO"
      title_patterns: ["cro", "chief revenue officer"]
      seniority: "c-suite"
      min_tenure_months: 0  # New CROs are high-signal
      messaging_angle: "first_90_days_pipeline_and_team_productivity"
  minimum_population: 1000
  expected_acv_min: 36000  # $3k/mo
  expected_sales_cycle_days: 60
```

### Vertical-Specific ICP Templates

#### FinTech ICP Template

```yaml
icp:
  name: "FinTech B2B — US/UK"
  version: "1.0"
  firmographics:
    industry: ["522320", "523999", "522130"]  # NAICS for financial services
    headcount_min: 100
    headcount_max: 2000
    geography: ["US", "GB"]
    funding_stages: ["series_b", "series_c", "series_d", "growth", "public"]
    regulatory_status: ["registered", "licensed"]  # Must be regulated
  technographics:
    crm: ["salesforce"]  # Salesforce dominant in FinTech
    compliance: ["complyadvantage", "chainalysis"]  # Indicates compliance maturity
    exclude: ["legacy_on_prem_only"]  # Can't integrate with pure on-prem
  behavioral_signals:
    - type: "funding"
      window_days: 90
      weight: 1.0
    - type: "regulatory_approval"
      window_days: 180
      weight: 0.6
    - type: "hiring"
      roles: ["compliance_officer", "sales_manager"]
      window_days: 60
      weight: 0.7
  exclusions:
    - "existing_customers"
    - "competitors"
    - "crypto_only"  # Excludes pure crypto; different regulatory regime
  buyer_personas:
    - name: "Head of Sales"
      title_patterns: ["head of sales", "vp sales", "commercial_director"]
      messaging_angle: "compliant_outbound_at_scale"
```

#### HealthTech ICP Template

```yaml
icp:
  name: "HealthTech B2B — US"
  version: "1.0"
  firmographics:
    industry: ["621111", "622110", "541715"]  # NAICS for health services
    headcount_min: 50
    headcount_max: 500
    geography: ["US"]
    hipaa_covered: true  # Must be HIPAA-covered entity or BAA-capable
  technographics:
    crm: ["salesforce_health_cloud", "hubspot"]
    ehr: ["epic", "cerner", "athenahealth"]
    exclude: ["no_baa_capability"]
  behavioral_signals:
    - type: "funding"
      window_days: 90
      weight: 1.0
    - type: "regulatory"
      window_days: 180
      weight: 0.8  # HIPAA audit/compliance event
    - type: "hiring"
      roles: ["sales_rep", "account_manager", "practice_development"]
      window_days: 60
      weight: 0.7
  exclusions:
    - "existing_customers"
    - "competitors"
    - "non_hipaa_compliant"
  buyer_personas:
    - name: "VP Growth"
      title_patterns: ["vp growth", "vp commercial", "vp business_development"]
      messaging_angle: "hipaa_compliant_lead_generation"
```

## 4. ICP Validation

Once an ICP is defined, Atlas validates it before handing off to Scout:

### 4.1 Validation Checklist

1. **Population check**: Scout runs a count query against the ICP. If population < 1,000, return error and ask operator to broaden.
2. **Sample audit**: Pull 20 random accounts from the population. Manual review by operator — confirm fit. If >20% don't fit, tighten ICP.
3. **Win-rate backtest**: Pull last 100 closed-won deals. What % match the ICP? If <70%, the ICP is wrong (too narrow or mis-specified).
4. **Loss-rate backtest**: Pull last 100 closed-lost deals. What % match the ICP? If >30%, the ICP is too broad.
5. **Dimension coverage check**: Every dimension has at least one criterion. If a dimension is empty, it's not an ICP — it's a partial profile.
6. **Exclusion test**: Run the exclusion list against the current customer base. If any current customers are excluded, the ICP is wrong.
7. **Falsifiability test**: For each criterion, can you answer "yes/no" for a random account using only external data? If not, reformulate the criterion.

### 4.2 Population Estimation Methods

| Method | Accuracy | Speed | Cost | Best For |
|--------|----------|-------|------|----------|
| LinkedIn Sales Nav query | ±30% | Minutes | Low | Quick population estimate |
| Apollo/ZoomInfo count | ±20% | Minutes | Medium | Refined estimate with technographics |
| Scout enumeration | ±5% | Hours | High | Precise count for quota planning |
| Manual audit (sample) | Ground truth | Days | Very high | Validation of automated methods |

### 4.3 Win-Rate Backtest Deep Dive

The win-rate backtest is the most important validation step. Here's how to execute it:

**Step 1**: Export last 100 closed-won deals from CRM.
**Step 2**: For each deal, score against the ICP using the Judge agent.
**Step 3**: Calculate the distribution of grades:

| Grade Distribution | Diagnosis | Action |
|-------------------|-----------|--------|
| >70% A-grade | ICP is well-calibrated | Proceed |
| 40-70% A-grade | ICP is slightly mis-specified | Review B-grade winners; add their characteristics |
| <40% A-grade | ICP is seriously wrong | Rebuild from winner analysis |
| >30% D-grade | ICP is too restrictive | Remove overly narrow criteria |

**Step 4**: Repeat with last 100 closed-lost deals:

| Grade Distribution | Diagnosis | Action |
|-------------------|-----------|--------|
| <20% A-grade | ICP exclusion is working | Proceed |
| 20-30% A-grade | Some A-grades still losing; competitive/execution issue | Review loss reasons; fix sales process |
| >30% A-grade | ICP is too broad; A-grades should not be losing at this rate | Tighten ICP criteria |

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
  priority: "standard"
  enrichment_level: "standard"  # light, standard, deep
  output_format: "structured_list"
  minimum_fields_per_account: 7  # company name, domain, industry, headcount, geography, ICP score, source
```

Scout then runs discovery across channels, returning a ranked list of accounts with contact info and signal scores.

### Scout Channel Strategy by ICP Type

| ICP Type | Primary Channel | Secondary Channels | Rationale |
|----------|----------------|-------------------|-----------|
| B2B SaaS (tech-forward) | LinkedIn + Apollo | Exa, PublicWWW | High LinkedIn coverage; tech detectable |
| FinTech / RegTech | LinkedIn + Crunchbase | SEC EDGAR, FCA register | Regulatory data adds precision |
| HealthTech | LinkedIn + Apollo | NPPES, CMS registry | Healthcare-specific databases needed |
| Manufacturing | Google Maps + LinkedIn | Thomas Net, industry directories | Physical presence matters; LinkedIn coverage lower |
| Professional Services | LinkedIn + Google Maps | Industry directories, bar associations | Professional credentials verifiable |
| Ecommerce / DTC | BuiltWith + LinkedIn | Shopify store directory, Amazon seller list | Tech stack is primary differentiator |

## 6. Common ICP Definition Mistakes

1. **"VP of Sales at SaaS companies"** — Not an ICP. Missing firmographics (headcount, revenue), missing technographics, missing signals, missing exclusions.
2. **"Mid-market companies"** — Vague. Define "mid-market" with revenue and headcount ranges.
3. **"Companies that need LeadReach"** — Circular. Define what makes a company need LeadReach (headcount, hiring SDRs, recent funding, using Outreach/Salesloft).
4. **No exclusions** — Without exclusions, Scout will surface customers, competitors, and recent losses.
5. **Population too small** — ICP of "SaaS B2B Series B+ in Wyoming" might match 5 accounts. Either broaden geography or accept the small population.
6. **No technographics** — For SaaS, technographics are critical. If the account doesn't use Salesforce or HubSpot, LeadReach can't integrate.
7. **Subjective criteria** — "Companies that value innovation" is not falsifiable. Replace with "companies that published a tech blog post in last 90 days".
8. **Single-dimension ICP** — Only firmographics, no behavioral signals. Produces a large but un-prioritized TAM.
9. **Aspirational ICP** — "Fortune 500 companies" — few in number, long cycles, low conversion. Build ICP from your actual best customers.
10. **Static ICP** — Created once and never revisited. Markets shift; the ICP must evolve.

### Mistake Diagnosis Decision Tree

```
ICP producing low-quality leads?
├── Too many leads (>10K population)?
│   ├── Missing technographics? → Add tech criteria
│   ├── Missing behavioral signals? → Add signal criteria
│   └── Industry too broad? → Narrow to 2-3 specific verticals
├── Too few leads (<500 population)?
│   ├── Geography too narrow? → Expand region
│   ├── Headcount range too tight? → Widen range
│   ├── Industry too specific? → Add adjacent verticals
│   └── Technographics too restrictive? → Remove non-essential tech requirements
├── Leads convert poorly (<2% meeting rate)?
│   ├── ICP not backtested? → Run win-rate backtest
│   ├── Behavioral signals missing? → Add trigger events
│   ├── Buyer personas undefined? → Define personas per ICP
│   └── Exclusions too weak? → Add competitor/existing customer exclusions
└── Leads look right but wrong contacts?
    ├── Buyer personas missing? → Define title patterns
    ├── No seniority specification? → Add seniority levels
    └── No tenure filter? → Add minimum tenure to exclude new hires still onboarding
```

## 7. ICP Iteration

ICPs should be reviewed on three cadences:

### 7.1 Quarterly Review

Every quarter, Atlas agent runs an automated ICP health check:

1. **Win rate by ICP grade**: Has the A-grade win rate changed? If it dropped below 40%, the ICP needs tightening.
2. **Population change**: Has the ICP-matched population shifted? If it dropped by >30%, market conditions changed.
3. **New patterns in winners**: Are there characteristics common in recent wins that aren't in the ICP? (e.g., "EMEA expansion" keeps appearing in win notes)
4. **Stale criteria**: Are there criteria that haven't differentiated winners from losers in 2+ quarters? Remove them.

### 7.2 Annual Review

A deeper review conducted by the operator:

1. **ICP still relevant?** Has the product, market, or competitive landscape shifted enough to require a new ICP?
2. **New ICP segments?** Have new customer segments emerged that warrant a separate ICP?
3. **Pricing/ACV changes?** If pricing has changed, the minimum ACV exclusion threshold needs updating.
4. **Geographic expansion?** If the company is expanding to new regions, new ICPs may be needed.

### 7.3 Trigger-Based Review

Major market events may require immediate ICP adjustment:

| Event | ICP Impact | Action |
|-------|-----------|--------|
| Tech layoffs (macro) | Headcount ranges may shift downward | Lower headcount min; add "post-layoff" trigger |
| Funding winter | Fewer funded companies; longer sales cycles | Broaden funding stage criteria; extend cycle expectations |
| New competitor enters | Market education increasing (positive) | Adjust messaging; add competitive displacement trigger |
| Regulatory change | New compliance requirements | Add regulatory trigger; adjust exclusions |
| Product launch (yours) | New use cases = new ICP segments | Create new ICP for new use case |
| M&A (yours) | Expanded customer base | Backtest combined customer base; merge ICPs |

## 8. Multi-ICP Strategy

For companies with multiple products or segments, maintain multiple ICPs:

### 8.1 ICP Segmentation Matrix

| ICP Segment | Product/Solution | ACV Range | Sales Cycle | Rep Type |
|-------------|-----------------|-----------|-------------|----------|
| Enterprise SaaS | Full platform | $100K+ | 90-180 days | Enterprise AE |
| Mid-market SaaS | Core platform | $30-100K | 30-90 days | Mid-market AE |
| SMB SaaS | Self-serve + CSM | $5-30K | 7-30 days | SDR + CSM |
| FinTech vertical | Compliant outreach | $50-150K | 60-120 days | Vertical AE |
| HealthTech vertical | HIPAA-compliant | $50-150K | 60-120 days | Vertical AE |

### 8.2 ICP Priority Scoring

When multiple ICPs could match an account, Atlas applies priority scoring:

1. **Match strength**: Which ICP does the account match most closely? (highest composite score)
2. **ACV potential**: Which ICP segment offers the highest ACV for this account?
3. **Pipeline capacity**: Which rep team has capacity to work this lead?
4. **Historical performance**: Which ICP segment has the highest win rate for similar accounts?

The winning ICP determines the routing, messaging, and rep assignment.

## 9. Atlas Agent ICP Discovery Workflow

When Atlas receives an ICP discovery request:

1. **Parse the request** — Extract explicit criteria (stated by operator) and implicit criteria (inferred from product, market, existing customers).
2. **Backtest against existing customers** — Pull top 20 customers by LTV; identify common characteristics; propose as starting ICP criteria.
3. **Check population** — Run a Scout count query; if population < 1,000, suggest broadening criteria.
4. **Draft ICP** — Fill the ICP template with discovered criteria; flag gaps for operator input.
5. **Validate** — Run the 7-step validation checklist (Section 4).
6. **Iterate with operator** — Present ICP draft + validation results; collect feedback; refine.
7. **Finalize and version** — Lock the ICP; assign version number; notify downstream agents.
8. **Hand off to Scout** — Generate the handoff document (Section 5).

### Atlas ICP Discovery Prompt Template

```
I need to build an ICP for [product/service].

Known information:
- Product: [description]
- Target market: [broad description]
- Best existing customers: [list 5-10 names]
- Average deal size: [$X]
- Sales cycle: [X days]
- Integration requirements: [list]

Please help me:
1. Identify the firmographic, technographic, and behavioral dimensions
2. Estimate the TAM population
3. Define exclusion criteria
4. Draft buyer personas
5. Validate against my existing customer base
```

## 10. ICP Data Source Comparison

### Firmographic Data Sources

| Source | Coverage | Accuracy | Cost | Best For |
|--------|----------|----------|------|----------|
| LinkedIn Company Pages | Global, 60M+ companies | Medium (self-reported) | Low (with Sales Nav) | Headcount, industry, geography |
| ZoomInfo | US/UK focused, 100M+ contacts | Medium-High (mixed sources) | High ($15-30K/year) | Revenue estimates, org charts |
| Apollo | Global, 250M+ contacts | Medium (crowdsourced + verified) | Medium ($1-5K/year) | Contact data, basic firmographics |
| Crunchbase | Global, 2M+ companies | High for funded companies | Medium ($5-10K/year) | Funding data, investor information |
| SEC EDGAR | US public companies only | Highest (government filing) | Free | Revenue, executives, risk factors |
| OpenCorporates | Global, 200M+ companies | High for legal data | Low (API available) | Legal existence, subsidiaries |

### Technographic Data Sources

| Source | Coverage | Accuracy | Cost | Detection Method |
|--------|----------|----------|------|-----------------|
| PublicWWW | 250M+ websites | High for web-facing tech | Low ($99/mo) | HTML/JS fingerprint matching |
| BuiltWith | 60M+ websites | High for web tech | High ($500+/mo) | URL-based tech detection |
| HG Insights | 30M+ companies | High for infrastructure | Very high ($20K+/yr) | Install base intelligence |
| DNS records | All domains | High for infrastructure | Free | MX, SPF, TXT record analysis |
| Job postings | Companies hiring | Medium (indicates intent) | Low (scraping) | Skill/tool requirements in JDs |

### Behavioral Signal Sources

| Source | Signal Type | Speed | Cost | Reliability |
|--------|-----------|-------|------|------------|
| Crunchbase alerts | Funding, M&A | Hours | Medium | High |
| LinkedIn alerts | Job changes, hiring | Hours | Low | High |
| Google Alerts | News, press | Hours | Free | Medium |
| G2/Capterra reviews | Competitive displacement | Days | Low | Medium |
| Earnings call transcripts | Strategic signals | Days | Medium | High |
| Job board scraping | Hiring patterns | Days | Low | Medium |

## 11. Authoring Notes / Gaps

- ~~Need a **vertical-specific ICP templates** library (SaaS, FinTech, HealthTech, Ecommerce, Manufacturing).~~ → Added in Section 3
- ~~Need a **technographic data source** comparison (BuiltWith vs HG Insights vs ActiveDemand).~~ → Added in Section 10
- ~~Need a **signal source** comparison (Crunchbase vs PitchBook vs LinkedIn).~~ → Added in Section 10
- Need a **win-rate backtest** automation script.
- Need a **ICP versioning** strategy (how to evolve ICPs without breaking Scout).
- Need a **buyer persona deep-dive** playbook (title taxonomies by vertical, messaging angles, engagement patterns).
- Need a **competitor-ICP overlay** (which competitors' customers match our ICP; displacement targeting).
- Need an **ICP-to-territory mapping** guide (how to carve territories from ICP segments).
