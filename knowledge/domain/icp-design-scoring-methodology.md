---
title: "Ideal Customer Profile (ICP) — Design & Scoring Methodology"
slug: icp-design-scoring-methodology
category: domain
tags: [icp, ideal-customer-profile, scoring, qualification, firmographics, technographics]
agents: [atlas, judge, sage, forge]
intent_types: [build_icp, score_lead, research_company]
priority: 92
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "How to construct a falsifiable ICP, score prospects against it, and avoid the common pitfalls that turn ICPs into useless aspirational documents."
---

# Ideal Customer Profile (ICP) — Design & Scoring Methodology

## 1. What an ICP Actually Is

An Ideal Customer Profile is a **multi-dimensional, falsifiable description** of the organizations that derive the most value from your solution, expressed in terms that are **externally observable** and **machine-verifiable**. An ICP is NOT a marketing persona, NOT a wishlist, and NOT "companies that need our product." It is a **scoring rubric** — every criterion must be answerable with a number, a category, or a boolean from external data.

A bad ICP says: "Fast-growing SaaS companies in North America."
A good ICP says: "US or Canadian B2B SaaS companies, 50-500 FTE, using Salesforce Sales Cloud and HubSpot, hiring for SDR roles in the last 60 days, with Series A or later funding, in the DevTools, FinTech, or MarTech verticals, headcount growth >15% YoY, headquartered in PST/EST/MST/CST timezones."

The bad ICP cannot be scored — "fast-growing" is subjective, "North America" is too broad. The good ICP can be scored against any prospect's public footprint: extract employee count from LinkedIn, detect Salesforce/HubSpot via PublicWWW, check hiring via Greenhouse/Lever job boards, query Crunchbase for funding rounds.

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

### Dimension 3: Behavioral Signals (Weight: 25%)
Observable actions the company is taking RIGHT NOW. These are the highest-signal indicators because they reveal current priorities.
- **Hiring patterns** — What roles are they hiring for? (Sales reps = growth mode; Security engineers = compliance push; Data scientists = AI initiative)
- **Content publishing** — Blog posts, whitepapers, conference talks reveal strategic priorities
- **Press releases** — Product launches, partnerships, expansions
- **Funding announcements** — When was the last round? Use of proceeds?
- **Executive changes** — New C-suite hires bring new priorities and budgets
- **Technology adoption** — Recently added Salesforce? Just raised a Series B?
- **Website changes** — Major redesigns, new sections, removed pages

### Dimension 4: Contextual Fit (Weight: 20%)
Industry-specific and situational signals that make your solution particularly relevant.
- **Regulatory pressure** — GDPR fines, SOC 2 requirements, HIPAA audits
- **Competitive displacement** — Known incumbent is failing, contract expiring
- **Trigger events** — Funding, M&A, leadership change, expansion
- **Industry trends** — Tailwinds that create urgency
- **Geographic expansion** — Entering new markets creates new needs
- **Pain signals** — Job postings mentioning "audit failure", Glassdoor reviews mentioning "manual processes"

### Dimension 5: Accessibility (Weight: 10%)
How reachable the decision-maker is. Often overlooked but critical.
- **LinkedIn presence** — Is the target active on LinkedIn? Posts regularly?
- **Email pattern discoverable** — `{first}@{company}.com` vs `{first.last}@{company}.com`
- **Conference participation** — Speaks at industry events (reachable via event staff)
- **Content engagement** — Comments on industry blogs, podcast appearances
- **Network proximity** — Mutual connections with the seller
- **Direct contact availability** — Phone number on website, listed email

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

### ICP Grade Bands
- **A (80-100)**: Highly qualified. Sales should contact within 24 hours.
- **B (60-79)**: Qualified. Sales should contact within 1 week.
- **C (40-59)**: Marginal. Marketing should nurture; sales can contact opportunistically.
- **D (0-39)**: Disqualified. Do not contact. Add to suppression list.

## 4. Common ICP Design Failures

### Failure 1: The "Aspirational ICP"
"We want to work with Fortune 500 companies."
Why it fails: Fortune 500 is 500 companies. Even at 100% conversion, that's a small business. And Fortune 500s have 18-month sales cycles.
Fix: Build the ICP from your **best 10 existing customers**. What do they have in common? That common pattern is your ICP.

### Failure 2: The "Everyone ICP"
"Any company that uses email."
Why it fails: Cannot be scored; produces no prioritization.
Fix: Pick 3-5 firmographic criteria that exclude 90% of the market.

### Failure 3: The "Unobservable ICP"
"Companies that value innovation."
Why it fails: Cannot be detected from external signals.
Fix: Translate "values innovation" into observable proxies — e.g., "adopts new technology within 12 months of release" (detectable via tech stack analysis).

### Failure 4: The "Static ICP"
An ICP created 18 months ago and never revisited.
Why it fails: Markets shift; the ICP becomes stale.
Fix: Re-score your top 20 customers quarterly; if the ICP drifts, update the criteria.

### Failure 5: The "Single-Persona ICP"
ICP describes the company but not the buyer.
Why it fails: Companies don't buy; people buy. An ICP without a buyer persona produces accounts with no reachable decision-maker.
Fix: For every ICP criterion, also specify the **buyer persona** (role, title, tenure, background) that maps to it.

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

## 6. The ICP-Prospect Match Output

When Judge scores a prospect against an ICP, the output must include:

```typescript
{
  prospect_id: string;
  icp_id: string;
  total_score: number;  // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
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
  next_best_action: string;
  scored_at: string;
}
```

The `evidence` array is **mandatory** — without sources, the score is unfalsifiable and therefore useless. The Judge agent must include at least one evidence entry per dimension scored >0.

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
