---
title: "Ideal Customer Profile (ICP) — Design & Scoring Methodology"
slug: icp-design-scoring-methodology
category: domain
tags: [icp, ideal-customer-profile, scoring, qualification, firmographics, technographics]
agents: [atlas, judge, sage, forge]
intent_types: [build_icp, score_lead, research_company]
priority: 92
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "How to construct a falsifiable ICP, score prospects against it, and avoid the common pitfalls that turn ICPs into useless aspirational documents."
---

# Ideal Customer Profile (ICP) — Design & Scoring Methodology

## 1. What an ICP Actually Is

An Ideal Customer Profile is a **multi-dimensional, falsifiable description** of the organizations that derive the most value from your solution, expressed in terms that are **externally observable** and **machine-verifiable**. An ICP is NOT a marketing persona, NOT a wishlist, and NOT "companies that need our product." It is a **scoring rubric** — every criterion must be answerable with a number, a category, or a boolean from external data.

A bad ICP says: "Fast-growing SaaS companies in North America."
A good ICP says: "US or Canadian B2B SaaS companies, 50-500 FTE, using Salesforce Sales Cloud and HubSpot, hiring for SDR roles in the last 60 days, with Series A or later funding, in the DevTools, FinTech, or MarTech verticals, headcount growth >15% YoY, headquartered in PST/EST/MST/CST timezones."

The bad ICP cannot be scored — "fast-growing" is subjective, "North America" is too broad. The good ICP can be scored against any prospect's public footprint: extract employee count from LinkedIn, detect Salesforce/HubSpot via PublicWWW, check hiring via Greenhouse/Lever job boards, query Crunchbase for funding rounds.

### 1.1 The ICP as a Prediction Engine

An ICP is not merely a description — it is a **prediction engine**. Each criterion in the ICP encodes a hypothesis: "Companies with [characteristic] are more likely to become high-LTV customers." The ICP is only as good as its predictions. If ICP-grade leads convert at the same rate as non-ICP leads, the ICP has no predictive value.

This predictive framing has two implications:

1. **Every criterion must correlate with outcomes.** If "uses Slack" appears in your ICP but doesn't correlate with win rate, it's noise — remove it. The Echo agent runs quarterly correlation analysis to identify criteria that have lost predictive value.

2. **The ICP must be backtestable.** You must be able to apply the ICP to historical deals and verify that ICP-matching deals actually convert at higher rates. Without backtesting, the ICP is an article of faith, not a data-driven tool.

### 1.2 The Falsifiability Standard

Every ICP criterion must pass the falsifiability test:

| Criterion Type | Example | Falsifiable? | How to Verify |
|---------------|---------|-------------|---------------|
| Quantitative | "50-500 FTE" | ✅ Yes | LinkedIn company page |
| Categorical | "B2B SaaS vertical" | ✅ Yes | Industry classification (NAICS) |
| Boolean | "Uses Salesforce" | ✅ Yes | PublicWWW / BuiltWith detection |
| Behavioral | "Hiring SDRs in last 60 days" | ✅ Yes | LinkedIn Jobs / careers page |
| Subjective | "Values innovation" | ❌ No | Cannot verify externally |
| Aspirational | "Fast-growing" | ❌ No (without definition) | Define as "headcount growth >20% YoY" |
| Internal | "Has budget" | ❌ Partially | Inferred from funding/size; not directly observable |

If a criterion fails the falsifiability test, it must be reformulated or removed. An unfalsifiable ICP is an untestable ICP, and an untestable ICP is useless.

## 2. The Five ICP Dimensions

LeadReach scores prospects across five orthogonal dimensions. Each dimension contributes a weighted score; the total determines the ICP grade.

### Dimension 1: Firmographics (Weight: 25%)
The structural attributes of the company itself.
- **Industry / Vertical** — SIC, NAICS, or custom taxonomy. Should be 2-3 specific verticals, not "technology."
- **Employee count** — Range (e.g., 50-500). Headcount correlates with budget and complexity.
- **Revenue range** — From public filings (SEC, OpenCorporates) or estimated from headcount (≈$150K-$300K revenue per FTE depending on vertical).
- **Geography** — Headquarters country/state/city; primary operating regions. Critical for regulatory and language fit.
- **Company age** — Year founded. <2 years = unstable; >20 years = legacy; 3-10 years = sweet spot for most B2B SaaS.
- **Funding stage** — Bootstrapped, Seed, Series A-E, Public, PE-backed. Determines budget cycle and risk tolerance.
- **Ownership structure** — Founder-led, PE-backed, public, subsidiary. Drives decision speed and risk appetite.

#### Firmographic Scoring Deep Dive

Firmographics are the foundation of ICP scoring. Here's how to build a robust firmographic rubric:

| Criterion | Max Points | Hard Match | Soft Match | Adjacent | No Match | Anti-Match |
|-----------|-----------|------------|-----------|----------|----------|-----------|
| Industry | 10 | 10 (exact NAICS) | 6 (parent NAICS) | 3 (related sector) | 0 | -5 (excluded) |
| Employee count | 8 | 8 (in range) | 5 (within 20% of range) | 2 (within 50%) | 0 | -4 (below min or above max) |
| Revenue | 7 | 7 (in range) | 4 (estimated in range) | 2 (estimated adjacent) | 0 (unknown) | -3 (known below min) |
| Geography | 5 | 5 (target region) | 3 (adjacent region) | 1 (same continent) | 0 (different continent) | -2 (excluded region) |
| Funding stage | 5 | 5 (target stage) | 3 (adjacent stage) | 1 (any funding) | 0 (unknown) | -2 (excluded stage) |

**Revenue estimation methods** (when not available from public filings):
- Headcount × $150K-$300K per FTE (varies by vertical)
- SaaS rule of thumb: $100K-$200K ARR per employee for mid-market
- PublicWWW detected tech stack + company size → peer benchmark
- Job posting volume and seniority → growth stage inference

### Dimension 2: Technographics (Weight: 20%)
The actual software and infrastructure the company uses. Strongest predictor of fit for integrations and adjacent products.
- **CRM** — Salesforce, HubSpot, Pipedrive, Microsoft Dynamics, none
- **Marketing stack** — Marketo, Pardot, HubSpot, Mailchimp, Customer.io
- **Analytics** — Google Analytics, Mixpanel, Amplitude, Heap, Segment
- **Cloud infrastructure** — AWS, GCP, Azure, on-prem
- **Programming languages / frameworks** — detectable from job postings, GitHub orgs, PublicWWW
- **Hiring signals** — open roles indicate current gaps and priorities
- **Integrations** — Zapier, Workato, native integrations
Detection sources: PublicWWW (HTML/JS fingerprints), BuiltWith (paid), DNS records, job postings.

#### Technographic Detection Methods

| Technology | Detection Method | Accuracy | Source |
|-----------|-----------------|----------|--------|
| Salesforce | `sf_client_id` in login page HTML | 95% | PublicWWW |
| HubSpot | `hs-analytics` JS snippet | 90% | PublicWWW |
| Google Analytics | `gtag` or `ga()` JS | 95% | PublicWWW |
| AWS | DNS records pointing to AWS IPs | 80% | DNS lookup |
| Shopify | `Shopify.theme` in page source | 95% | PublicWWW |
| WordPress | `<meta name="generator">` tag | 90% | PublicWWW |
| Marketo | `mkto` forms or munchkin JS | 85% | PublicWWW |
| Segment | `analytics.js` + Segment write key | 90% | PublicWWW |
| Slack | Email domain @slack.com or Slack URL patterns | 70% | Various |
| Zoom | `zoom.us` in website links | 80% | PublicWWW |

**Important**: Absence of detection is NOT proof of absence. A company may use Salesforce but not expose it on their public website. Technographic scoring should account for detection limitations:
- Detected → hard match (full points)
- Not detected → unknown (redistribute weight, don't score as 0)
- Competitor detected → anti-match (negative points)

### Dimension 3: Behavioral Signals (Weight: 25%)
Observable actions the company is taking RIGHT NOW. These are the highest-signal indicators because they reveal current priorities.
- **Hiring patterns** — What roles are they hiring for? (Sales reps = growth mode; Security engineers = compliance push; Data scientists = AI initiative)
- **Content publishing** — Blog posts, whitepapers, conference talks reveal strategic priorities
- **Press releases** — Product launches, partnerships, expansions
- **Funding announcements** — When was the last round? Use of proceeds?
- **Executive changes** — New C-suite hires bring new priorities and budgets
- **Technology adoption** — Recently added Salesforce? Just raised a Series B?
- **Website changes** — Major redesigns, new sections, removed pages

#### Behavioral Signal Scoring Matrix

| Signal | Signal Strength | Points | Decay Rate | Detection Source |
|--------|----------------|--------|-----------|-----------------|
| Funding round (last 90 days) | ★★★★★ | 25 | 10% per 30 days | Crunchbase, PitchBook |
| New CRO/VP Sales (last 60 days) | ★★★★★ | 20 | 15% per 30 days | LinkedIn |
| SDR/AE hiring surge (last 30 days) | ★★★★☆ | 18 | 20% per 30 days | LinkedIn Jobs |
| M&A activity (last 90 days) | ★★★★☆ | 15 | 5% per 30 days | News, SEC |
| Geographic expansion (last 60 days) | ★★★★☆ | 12 | 10% per 30 days | Press |
| Product launch (last 30 days) | ★★★☆☆ | 10 | 20% per 30 days | Press, Product Hunt |
| Compliance event (last 30 days) | ★★★★☆ | 12 | 15% per 30 days | News |
| Competitor outage (last 14 days) | ★★★☆☆ | 8 | 50% per 14 days | News, G2 |
| New fiscal year (next 30 days) | ★★★☆☆ | 8 | None | Industry calendar |
| Website redesign (last 60 days) | ★★☆☆☆ | 5 | 10% per 30 days | Wayback Machine |
| Conference speaking (upcoming) | ★★★☆☆ | 7 | None | Event websites |

### Dimension 4: Contextual Fit (Weight: 20%)
Industry-specific and situational signals that make your solution particularly relevant.
- **Regulatory pressure** — GDPR fines, SOC 2 requirements, HIPAA audits
- **Competitive displacement** — Known incumbent is failing, contract expiring
- **Trigger events** — Funding, M&A, leadership change, expansion
- **Industry trends** — Tailwinds that create urgency
- **Geographic expansion** — Entering new markets creates new needs
- **Pain signals** — Job postings mentioning "audit failure", Glassdoor reviews mentioning "manual processes"

#### Contextual Fit Scoring Framework

| Context Type | Points | How to Detect | Example |
|-------------|--------|--------------|---------|
| Regulatory pressure | 15 | News search for [industry] + "regulation" or "compliance" | FinTech company mentioned in regulatory filing |
| Competitive displacement | 20 | G2 negative reviews of competitor; contract expiry intel | Target uses Competitor X with 2.1★ G2 rating |
| Industry tailwind | 10 | Industry report showing growth in target vertical | "DevTools market growing 25% YoY" |
| Pain signal | 12 | Job postings with pain-indicating language | Hiring "Sales Ops Manager — must fix broken pipeline" |
| Expansion signal | 8 | Press release about new market entry | "Opening EMEA office in Q3" |
| Budget cycle alignment | 5 | Industry budget calendar | "Enterprise FY starts January" |

### Dimension 5: Accessibility (Weight: 10%)
How reachable the decision-maker is. Often overlooked but critical.
- **LinkedIn presence** — Is the target active on LinkedIn? Posts regularly?
- **Email pattern discoverable** — `{first}@{company}.com` vs `{first.last}@{company}.com`
- **Conference participation** — Speaks at industry events (reachable via event staff)
- **Content engagement** — Comments on industry blogs, podcast appearances
- **Network proximity** — Mutual connections with the seller
- **Direct contact availability** — Phone number on website, listed email

#### Email Pattern Discovery

| Pattern | Format | Discoverability | Success Rate |
|---------|--------|----------------|-------------|
| First name | `john@company.com` | Very easy | 40% deliverable |
| First.Last | `john.smith@company.com` | Easy | 55% deliverable |
| First initial + Last | `jsmith@company.com` | Easy | 50% deliverable |
| First + Last initial | `johns@company.com` | Medium | 45% deliverable |
| First.Last with number | `john.smith2@company.com` | Hard | 30% deliverable |
| Custom format | various | Very hard | 15-25% deliverable |

Forge agent uses a combination of email pattern detection + SMTP verification to maximize email discoverability. For accounts where the email pattern is unknown, Forge tests the top 3 patterns and verifies via SMTP handshake (without sending an email).

## 3. Scoring Rubric — How to Compute an ICP Score

Each dimension produces a 0-100 score. The total ICP score is the weighted average. The LeadReach `scoreLeadAgainstICP()` function implements this:

```
total_score = (firmographics × 0.25) +
              (technographics × 0.20) +
              (behavioral × 0.25) +
              (contextual × 0.20) +
              (accessibility × 0.10)
```

Within each dimension, each criterion contributes a sub-score:
- **Hard match** (matches exactly): full points
- **Soft match** (in range, partial): 60% of points
- **No match**: 0 points
- **Negative match** (anti-criterion — e.g., competitor customer): -50% of points

For example, if firmographics has 4 criteria worth 25 points each:
- Industry = "SaaS" (hard match for SaaS target): 25 points
- Employees = 150 (in 50-500 range): 25 points
- Revenue = unknown: 0 points (do NOT interpolate — mark as "unknown" and reduce weight)
- Geography = "Germany" (target was US-only): 0 points
- Firmographics sub-score: 50/100

**Critical rule**: Missing data is NOT zero. If a field is unknown, **redistribute its weight** across the other fields in the same dimension. Otherwise prospects with incomplete data are penalized twice — once for the missing data, and once in the total score.

### 3.1 Weight Redistribution Algorithm

```python
def score_dimension(criteria, matches):
    total_weight = sum(c.weight for c in criteria)
    known_weight = sum(c.weight for c in criteria if matches[c.id] != 'unknown')
    
    if known_weight == 0:
        return 0  # All data unknown; dimension unscored
    
    # Redistribute unknown weights to known criteria
    redistribution_factor = total_weight / known_weight
    
    score = 0
    for criterion in criteria:
        if matches[criterion.id] == 'unknown':
            continue  # Skip unknown; weight redistributed
        
        match_score = calculate_match_score(criterion, matches[criterion.id])
        adjusted_weight = criterion.weight * redistribution_factor
        score += match_score * (adjusted_weight / total_weight)
    
    return score * 100  # Normalize to 0-100
```

### 3.2 Score Confidence Level

Every ICP score should include a confidence level indicating how much data supported the score:

| Confidence | Definition | Minimum Data Coverage | Score Interpretation |
|-----------|-----------|----------------------|---------------------|
| High | Score well-supported by data | >80% of criteria have known values | Score is reliable; use for routing |
| Medium | Score partially supported | 50-80% of criteria have known values | Score is directional; enrich before routing |
| Low | Score based on minimal data | <50% of criteria have known values | Score is unreliable; return to Forge for enrichment |

A high-confidence B-grade lead is more actionable than a low-confidence A-grade lead. Judge agent includes confidence in every scoring output.

### ICP Grade Bands
- **A (80-100)**: Highly qualified. Sales should contact within 24 hours.
- **B (60-79)**: Qualified. Sales should contact within 1 week.
- **C (40-59)**: Marginal. Marketing should nurture; sales can contact opportunistically.
- **D (0-39)**: Disqualified. Do not contact. Add to suppression list.

#### Grade Band Action Matrix

| Grade | Confidence | Recommended Action | SLA | Agent Routing |
|-------|-----------|-------------------|-----|---------------|
| A | High | Contact immediately | 5 min | P0 → AE direct |
| A | Medium | Enrich first, then contact | 1 hour | P0 → AE (with enrichment note) |
| A | Low | Enrich before contacting | 4 hours | P1 → SDR (enrichment queue) |
| B | High | Contact this week | 24 hours | P1 → SDR pool |
| B | Medium | Enrich + contact this week | 48 hours | P1 → SDR pool |
| B | Low | Enrich; don't contact until B+ | 1 week | P2 → nurture + enrichment |
| C | High | Nurture; sales can contact opportunistically | 1 week | P2 → nurture |
| C | Medium/ Low | Nurture only | No SLA | P2/P3 → nurture |
| D | Any | Disqualify | No SLA | P3 → suppression list |

## 4. Common ICP Design Failures

### Failure 1: The "Aspirational ICP"
"We want to work with Fortune 500 companies."
Why it fails: Fortune 500 is 500 companies. Even at 100% conversion, that's a small business. And Fortune 500s have 18-month sales cycles.
Fix: Build the ICP from your **best 10 existing customers**. What do they have in common? That common pattern is your ICP.

#### How to Build an ICP from Your Best Customers

1. **Select your top 20 customers by LTV** (not just revenue — include expansion, retention, and referral value).
2. **For each customer, catalog their characteristics** across all 5 dimensions.
3. **Identify the intersection** — what do 70%+ of your best customers share?
4. **Test each shared characteristic for predictive value** — do customers with this characteristic convert at higher rates than those without?
5. **Keep only characteristics with predictive value** — the rest is coincidence, not signal.

Example output:
```
Top 20 Customer Analysis:
- Industry: 14/20 (70%) are B2B SaaS → Keep
- Employee count: 16/20 (80%) are 50-500 FTE → Keep
- CRM: 18/20 (90%) use Salesforce or HubSpot → Keep
- Funding: 12/20 (60%) are Series B+ → Keep (lower threshold)
- Geography: 15/20 (75%) are US-based → Keep
- Ownership: 8/20 (40%) are founder-led → Not predictive enough; remove
- Cloud: 10/20 (50%) use AWS → Not predictive enough; remove

Resulting ICP: B2B SaaS, 50-500 FTE, Salesforce/HubSpot, Series A+, US-based
```

### Failure 2: The "Everyone ICP"
"Any company that uses email."
Why it fails: Cannot be scored; produces no prioritization.
Fix: Pick 3-5 firmographic criteria that exclude 90% of the market.

#### The Exclusion Test

A well-defined ICP should exclude at least 90% of all companies. Test this by running your ICP criteria against a broad database:

| ICP Precision Level | % of Companies Matching | Result |
|---------------------|------------------------|--------|
| >50% match | Too broad | Add more criteria or narrow ranges |
| 10-50% match | Still too broad | Add technographic or behavioral criteria |
| 1-10% match | About right | Validate with backtesting |
| <1% match | Too narrow | Broaden geography or industry |

### Failure 3: The "Unobservable ICP"
"Companies that value innovation."
Why it fails: Cannot be detected from external signals.
Fix: Translate "values innovation" into observable proxies — e.g., "adopts new technology within 12 months of release" (detectable via tech stack analysis), "has a dedicated R&D team of 10+ engineers" (detectable via job postings), "has filed patents in the last 3 years" (detectable via USPTO).

#### Observable Proxy Translation Table

| Subjective Criterion | Observable Proxy | Detection Method |
|---------------------|-----------------|-----------------|
| "Values innovation" | Adopted 2+ new tools in last 12 months | PublicWWW temporal analysis |
| "Fast-growing" | Headcount growth >20% YoY | LinkedIn historical snapshots |
| "Sales-driven culture" | Hiring 5+ SDR/AE roles in last 60 days | LinkedIn Jobs |
| "Enterprise-grade" | Uses SOC 2 compliant vendors | Vendor compliance page references |
| "Data-driven" | Uses 3+ analytics tools | PublicWWW + BuiltWith |
| "Customer-centric" | Has "Customer Success" in org chart | LinkedIn team page |
| "Scaling rapidly" | Open offices in 2+ new locations in 12 months | Press + Google Maps |

### Failure 4: The "Static ICP"
An ICP created 18 months ago and never revisited.
Why it fails: Markets shift; the ICP becomes stale.
Fix: Re-score your top 20 customers quarterly; if the ICP drifts, update the criteria.

### Failure 5: The "Single-Persona ICP"
ICP describes the company but not the buyer.
Why it fails: Companies don't buy; people buy. An ICP without a buyer persona produces accounts with no reachable decision-maker.
Fix: For every ICP criterion, also specify the **buyer persona** (role, title, tenure, background) that maps to it.

### Failure 6: The "Overweighted ICP"
One dimension dominates the score (e.g., firmographics at 60% weight).
Why it fails: The ICP becomes one-dimensional; other important signals are drowned out.
Fix: Ensure no single dimension exceeds 30% weight. Behavioral signals should always be ≥20% because they indicate timing, which is the hardest dimension to get right.

### Failure 7: The "Correlation-Free ICP"
Criteria were chosen based on assumptions, not data.
Why it fails: The ICP reflects what you *think* matters, not what *actually* matters.
Fix: Run a correlation analysis between each criterion and win rate. Remove criteria with <10% correlation.

## 5. Output Schema — What an ICP Document Must Contain

When the Atlas or Judge agent produces an ICP, it must contain:

```typescript
{
  id: string;
  name: string;  // Human-readable name, e.g. "US Mid-Market SaaS — DevTools"
  description: string;  // 2-3 sentence narrative
  dimensions: {
    firmographics: {
      industries: string[];
      employee_count: { min: number; max: number };
      revenue_range: { min: number; max: number };  // in USD
      geographies: string[];  // ISO country codes
      funding_stages: string[];
      company_age_years: { min: number; max: number };
    };
    technographics: {
      required: string[];  // MUST have these
      preferred: string[];  // Bonus points
      excluded: string[];  // Anti-criteria
    };
    behavioral: {
      hiring_signals: string[];
      content_signals: string[];
      trigger_events: string[];
    };
    contextual: {
      regulatory_pressures: string[];
      competitive_situations: string[];
      industry_trends: string[];
    };
    accessibility: {
      buyer_personas: Array<{
        title_patterns: string[];
        seniority: 'c-suite' | 'vp' | 'director' | 'manager';
        required_tenure_months: number;
      }>;
      channel_preferences: string[];
    };
  };
  weights: {
    firmographics: number;  // 0-1, sums to 1 across all dimensions
    technographics: number;
    behavioral: number;
    contextual: number;
    accessibility: number;
  };
  grade_thresholds: {
    a_min: number;  // default 80
    b_min: number;  // default 60
    c_min: number;  // default 40
  };
  created_at: string;
  updated_at: string;
  version: number;
}
```

### 5.1 ICP Versioning

ICPs must be versioned to track evolution:

| Version Change | Trigger | Backward Compatibility | Action |
|---------------|---------|----------------------|--------|
| Minor (1.0 → 1.1) | Added preferred technographics; adjusted thresholds | Existing scored leads remain valid | Re-score at next pipeline run |
| Major (1.0 → 2.0) | Changed required firmographics; new dimensions | Existing scored leads need re-scoring | Re-score entire active pipeline |

Version history is maintained for audit purposes and to measure the impact of ICP changes on lead quality.

## 6. The ICP-Prospect Match Output

When Judge scores a prospect against an ICP, the output must include:

```typescript
{
  prospect_id: string;
  icp_id: string;
  icp_version: number;
  total_score: number;  // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
  confidence: 'high' | 'medium' | 'low';
  dimension_scores: {
    firmographics: { score: number; matched: string[]; missed: string[]; unknown: string[] };
    technographics: { score: number; matched: string[]; missed: string[]; unknown: string[] };
    behavioral: { score: number; matched: string[]; missed: string[]; unknown: string[] };
    contextual: { score: number; matched: string[]; missed: string[]; unknown: string[] };
    accessibility: { score: number; matched: string[]; missed: string[]; unknown: string[] };
  };
  recommendation: 'contact_immediately' | 'contact_this_week' | 'nurture' | 'disqualify';
  rationale: string;  // 2-3 sentences explaining the score
  evidence: Array<{ claim: string; source: string; url?: string }>;
  trigger_events: Array<{ type: string; date: string; freshness: 'fresh' | 'recent' | 'stale' }>;
  buyer_personas: Array<{
    name: string;
    title: string;
    match_quality: 'exact' | 'partial' | 'none';
  }>;
  next_best_action: string;
  scored_at: string;
}
```

The `evidence` array is **mandatory** — without sources, the score is unfalsifiable and therefore useless. The Judge agent must include at least one evidence entry per dimension scored >0.

### 6.1 Score Explanation Example

```
ICP SCORE: 82/100 — Grade A — Confidence: High
────────────────────────────────────────────────
FIRMGRAPHICS (23/25):
  ✅ Industry: B2B SaaS (NAICS 541511) — exact match
  ✅ Employees: 180 — in range (50-500)
  ✅ Geography: US (California) — target region
  ⚠️ Revenue: $35M ARR estimated — in range, but estimated (not verified)
  Source: LinkedIn (employees), Crunchbase (funding), PublicWWW (tech)

TECHNOGRAPHICS (18/20):
  ✅ CRM: Salesforce detected (PublicWWW, sf_client_id)
  ✅ Sales engagement: Outreach detected
  ✅ Cloud: AWS (DNS records)
  ❌ Data warehouse: Not detected (unknown, not scored as miss)

BEHAVIORAL (22/25):
  ✅ Funding: Series B, $30M, 45 days ago — fresh trigger
  ✅ Hiring: 3 SDR roles posted in last 30 days
  ⚠️ Leadership: VP Sales tenure 4 months (new hire trigger)

CONTEXTUAL (16/20):
  ✅ Competitive: Current vendor (Competitor X) has 2.3★ G2 rating
  ✅ Pain signal: Job posting mentions "manual prospect research"
  ❌ Regulatory: No compliance signals detected

ACCESSIBILITY (8/10):
  ✅ Buyer persona: VP Sales — exact match
  ✅ Email pattern: {first}@{company}.com — discoverable
  ❌ LinkedIn activity: Prospect not active on LinkedIn

TRIGGER EVENTS:
  1. Series B funding — 45 days ago (FRESH)
  2. New VP Sales — 4 months ago (RECENT)
  3. SDR hiring surge — ongoing (FRESH)

RECOMMENDATION: Contact immediately
RATIONALE: Strong ICP fit across firmographics and technographics. Fresh funding + new VP Sales + SDR hiring create a three-trigger stack indicating immediate need and available budget.
NEXT ACTION: Bard agent to compose funding-trigger email with VP Sales new-hire angle + peer reference from same vertical.
```

## 7. ICP Refinement Loop

ICPs are not set-and-forget. The Echo agent runs a monthly ICP refinement loop:

1. Pull all won deals from the last 90 days
2. Re-score them against the current ICP
3. If win rate for grade-A prospects <60%, the ICP is too loose — tighten criteria
4. If win rate for grade-C prospects >30%, the ICP is too tight — relax criteria
5. If certain criteria never correlate with wins (e.g., "uses Slack"), remove them
6. If certain criteria always correlate with wins but aren't in the ICP (e.g., "hiring in EMEA"), add them
7. Version-bump the ICP and notify stakeholders

This loop ensures the ICP evolves with the market and the product. Without it, ICPs become fossilized and lead quality drifts.

### 7.1 Criterion Correlation Analysis

Echo agent runs monthly correlation analysis on each ICP criterion:

| Criterion | Win Rate WITH Criterion | Win Rate WITHOUT Criterion | Correlation | Action |
|-----------|------------------------|---------------------------|-------------|--------|
| Industry = B2B SaaS | 28% | 12% | Strong (2.3x) | Keep |
| Employees 50-500 | 25% | 18% | Moderate (1.4x) | Keep |
| CRM = Salesforce/HubSpot | 30% | 15% | Strong (2.0x) | Keep |
| Cloud = AWS | 22% | 23% | None (1.0x) | Remove |
| Funding = Series B+ | 32% | 14% | Strong (2.3x) | Keep |
| Uses Slack | 24% | 25% | Negative (0.96x) | Remove |

Criteria with <1.2x correlation should be flagged for removal. Criteria with >1.5x correlation should be emphasized (higher weight).

### 7.2 ICP Decay Detection

| Decay Signal | Threshold | Diagnosis | Action |
|-------------|-----------|-----------|--------|
| A-grade win rate dropping | <50% for 2 consecutive quarters | ICP too loose | Tighten criteria |
| TAM population shrinking | >30% decline in 6 months | Market shift | Broaden criteria |
| New winning pattern emerging | New criterion in >40% of wins | ICP missing a signal | Add criterion |
| Old criterion losing correlation | <1.2x correlation for 2 quarters | Criterion is stale | Remove criterion |
| Score distribution shifting | >60% of leads scoring A or D | Bimodal; thresholds wrong | Recalibrate thresholds |

### 7.3 ICP Refinement Workflow

```
Monthly ICP Refinement (Echo agent):
1. Pull won/lost data from CRM (last 90 days)
2. Re-score all deals against current ICP
3. Run correlation analysis on each criterion
4. Identify decay signals
5. Generate ICP Refinement Report:
   - Criteria to add (new winning patterns)
   - Criteria to remove (zero correlation)
   - Criteria to adjust (threshold changes)
   - Weight changes (correlation-based rebalancing)
6. Present report to operator for approval
7. Implement approved changes
8. Version-bump ICP
9. Re-score active pipeline against new ICP version
10. Notify downstream agents (Scout, Judge, Bard)
```

## 8. Multi-ICP Strategy

### 8.1 When to Maintain Multiple ICPs

Multiple ICPs are warranted when:
- Your product serves distinct verticals with different buying patterns
- Different ACV tiers require different qualification criteria
- Geographic markets have fundamentally different characteristics
- You have multiple products with different value propositions

### 8.2 ICP Conflict Resolution

When a prospect matches multiple ICPs, Atlas resolves using this priority:

1. **Highest score wins**: The ICP that produces the highest composite score determines routing.
2. **ACV potential**: If scores are tied (within 5 points), prefer the ICP with higher ACV potential.
3. **Rep capacity**: If ACV is similar, prefer the ICP whose assigned team has more capacity.
4. **Historical win rate**: If capacity is similar, prefer the ICP with the highest historical win rate for this account type.

### 8.3 ICP Segmentation Matrix

| ICP Segment | Product | ACV | Sales Motion | Cycle | Rep Type |
|-------------|---------|-----|-------------|-------|----------|
| Enterprise SaaS | Full platform | $100K+ | Consultative | 90-180d | Enterprise AE |
| Mid-market SaaS | Core platform | $30-100K | Solution selling | 30-90d | Mid-market AE |
| SMB SaaS | Self-serve + CSM | $5-30K | Product-led + CSM | 7-30d | SDR + CSM |
| FinTech vertical | Compliant outreach | $50-150K | Vertical specialist | 60-120d | Vertical AE |
| HealthTech vertical | HIPAA-compliant | $50-150K | Vertical specialist | 60-120d | Vertical AE |

## 9. Judge Agent Scoring Workflow

When Judge scores a prospect against an ICP:

1. **Receive prospect data** from Forge (enriched company + contact data)
2. **Load active ICP** (highest-priority ICP for this segment)
3. **Score each dimension** against ICP criteria
4. **Apply weight redistribution** for unknown fields
5. **Calculate composite score** using dimension weights
6. **Determine grade** (A/B/C/D) using grade thresholds
7. **Calculate confidence** based on data coverage
8. **Detect trigger events** and apply freshness scoring
9. **Match buyer personas** against contact data
10. **Generate rationale** explaining the score in natural language
11. **Compile evidence** with sources for each scored dimension
12. **Determine recommendation** and next best action
13. **Output** the complete ICP-Prospect Match object

### Judge Agent Configuration

```yaml
judge_config:
  scoring_mode: "weighted_average"  # or "minimum_threshold" or "decision_tree"
  weight_redistribution: true  # Redistribute unknown field weights
  confidence_threshold: "medium"  # Minimum confidence for routing decisions
  trigger_freshness_scoring: true  # Apply decay to trigger event scores
  evidence_required: true  # Mandatory source citations
  auto_disqualify_below: 30  # Auto-DQ leads scoring below 30
  auto_promote_above: 90  # Auto-promote leads scoring above 90
  multi_icp_resolution: "highest_score"  # How to resolve multiple ICP matches
```

### Judge Scoring Modes

| Mode | Description | When to Use | Pros | Cons |
|------|-----------|-------------|------|------|
| Weighted average | Standard dimension weighting | Default | Balanced; accounts for all dimensions | Can be inflated by one strong dimension |
| Minimum threshold | Must meet minimum in each dimension | Quality-obsessed accounts | Ensures balanced fit; no weak dimensions | May disqualify accounts strong in 4/5 dims |
| Decision tree | Sequential yes/no decisions | Simple qualification | Easy to understand; deterministic | Misses nuance; binary outcomes |
| Tiered | Different criteria for different tiers | Multi-product/multi-ACV | Flexible; context-aware | More complex to configure |
