---
title: "Data Enrichment — Methodology, Source Hierarchy, Verification"
slug: data-enrichment-methodology
category: domain
tags: [enrichment, data-quality, verification, sources, forge]
agents: [forge, judge, sage]
intent_types: [research_company, research_person, enrich_lead]
priority: 88
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "How Forge enriches a bare company name into a 50-field profile. Source hierarchy, verification rules, conflict resolution, and completeness scoring."
---

# Data Enrichment — Methodology, Source Hierarchy, Verification

## 1. The Enrichment Funnel

Every prospect enters LeadReach as a **seed** — typically just a name (company or person) and maybe a website. Forge's job is to expand that seed into a **complete profile** by progressively pulling data from multiple sources and reconciling conflicts.

The enrichment funnel has 5 stages:

1. **Identity Resolution** — Confirm the prospect exists, is unique, and is correctly identified
2. **Firmographic Enrichment** — Industry, size, revenue, location, age, ownership
3. **Technographic Enrichment** — Technology stack, infrastructure, integrations
4. **People Enrichment** — Decision-makers, roles, tenure, contact info
5. **Behavioral Enrichment** — Recent news, trigger events, hiring patterns, content signals

Each stage produces a **structured record** that the Judge agent can verify and the Sage agent can analyze.

## 2. Source Hierarchy — Trust Ranking

Not all sources are equal. LeadReach ranks sources by **authority** and **recency**. When sources conflict, higher-trust sources win.

### Tier 1 — Authoritative Primary (Trust: 95-100)
- **Government registries** — SEC EDGAR (US public companies), OpenCorporates (global registry), Companies House (UK), ACRA (Singapore)
- **Self-published filings** — Annual reports, 10-Ks, S-1 filings
- **The company's own website** — For self-description (about page, leadership team)
- **DNS records / SSL certificates** — For domain ownership verification

### Tier 2 — Professional Networks (Trust: 80-90)
- **LinkedIn** (company + personal) — For roles, tenure, company size, headcount
- **GitHub** (for engineering-led companies) — For tech stack hints, public repos, contributor count
- **Crunchbase / PitchBook** — For funding rounds, investors, valuations
- **Industry-specific directories** — BuiltWith (tech stack), Clutch (agencies), G2 (software reviews)

### Tier 3 — News & Media (Trust: 70-85)
- **Tier-1 news outlets** — TechCrunch, WSJ, FT, Bloomberg, Reuters
- **Industry publications** — Industry-specific journals, newsletters
- **Press releases** (via PRNewswire, Business Wire) — For announcements
- **Conference agendas** — For executive visibility and speaking topics

### Tier 4 — Aggregators & Scrapers (Trust: 50-70)
- **Google Maps** — For physical locations and reviews
- **OpenStreetMap / Overpass** — For place data, alternative to Google Maps
- **PublicWWW** — For technology fingerprints (HTML, JS, CSS)
- **Job boards** (Greenhouse, Lever, LinkedIn Jobs) — For hiring signals
- **Glassdoor** — For employee count, satisfaction, salary ranges

### Tier 5 — Inferred & Estimated (Trust: 30-50)
- **Headcount-to-revenue estimation** — $150K-$300K revenue per FTE by vertical
- **Tech stack inference** — Job postings mentioning tools → tech stack
- **Geographic inference** — IP geolocation, office photos
- **Industry inference** — Domain name, keywords, content analysis

### Tier 6 — Unverified (Trust: 10-30)
- **User-submitted data** — Marketing forms, surveys
- **Scraped personal data** — Should be treated as suspect
- **Cached/archived data** — May be stale

## 3. Conflict Resolution Rules

When sources disagree, Forge applies these rules in order:

1. **Higher tier wins** — Tier 1 beats Tier 2, etc.
2. **More recent wins** — A 2026 source beats a 2024 source
3. **More specific wins** — "320 employees on LinkedIn" beats "50-500 employees on website"
4. **Multiple sources corroborating wins** — 3 sources saying "Series A" beats 1 source saying "Series B"
5. **Official over unofficial** — Company press release beats third-party report

When conflicts cannot be resolved, Forge stores both values with sources and flags the field as `disputed`. The Judge agent down-weights disputed fields by 50% in scoring.

## 4. Field-by-Field Enrichment Strategy

### Company Name
- **Source**: User input
- **Verification**: OpenCorporates exact match, LinkedIn company URL, DNS lookup
- **Common error**: Subsidiary vs. parent company. Always resolve to the **operating entity**, not the holding company.

### Industry / Vertical
- **Sources**: OpenCorporates SIC code, LinkedIn industry, company website keywords
- **Verification**: Cross-reference at least 2 sources; default to OpenCorporates SIC if available
- **Common error**: Over-broad categorization ("technology"). Always drill to 4-digit SIC or custom taxonomy.

### Employee Count
- **Sources**: LinkedIn employee count (current), OpenCorporates, company website "About" page, Glassdoor
- **Verification**: LinkedIn count is most reliable for companies >50 FTE; below 50, the count may be incomplete
- **Common error**: LinkedIn counts include contractors and may miss employees not on LinkedIn. Use ±20% confidence interval.

### Revenue
- **Sources**:
  - Public companies: SEC EDGAR 10-K (authoritative)
  - Private US: Inc. 5000, Cruchbase estimates
  - Private global: OpenCorporates filings (revenue disclosed in some jurisdictions), estimated from headcount × vertical multiplier
- **Verification**: If multiple sources within 30% of each other, take the median. If wider divergence, mark as `estimated` with confidence interval.
- **Common error**: Reporting ARR (annual recurring revenue) as total revenue. SaaS companies often report ARR — make sure to label correctly.

### Funding Stage
- **Sources**: Crunchbase, PitchBook, press releases
- **Verification**: Cross-reference 2+ sources. Press release from the company itself is most authoritative.
- **Common error**: Confusing "valuation" with "funding raised". A $1B valuation doesn't mean $1B raised — find the actual round size.

### Website / Domain
- **Sources**: User input, LinkedIn company page, OpenCorporates
- **Verification**: DNS resolution, HTTP HEAD request, SSL certificate valid
- **Common error**: Marketing site vs. app site. `acme.com` is the marketing site; `app.acme.com` is the application. Note both.

### LinkedIn URL
- **Sources**: LinkedIn search by company name
- **Verification**: Match by industry + size + location; ambiguous matches should be flagged
- **Common error**: LinkedIn page for a similarly-named company. Always verify by employee count and industry.

### Executive Team
- **Sources**: Company website "Team" or "About" page, LinkedIn search for current employees with C-suite titles, SEC filings (for public companies — top 5 officers listed)
- **Verification**: Cross-reference company website and LinkedIn. Note tenure (LinkedIn shows start date).
- **Common error**: Listing departed executives. Always check LinkedIn for "current" status, not just title.

### Email Patterns
- **Sources**: EmailHunter, NeverBounce, Lusha, manual discovery (look at press releases, blog bylines)
- **Verification**: SMTP verify (if possible), pattern match against known employees
- **Common patterns**:
  - `{first}@company.com` — Common in tech startups
  - `{first}.{last}@company.com` — Common in larger companies
  - `{first_initial}{last}@company.com` — Common in consulting, law
  - `{first_initial}@company.com` — Common in small teams
- **Common error**: Assuming the pattern is uniform. Always verify the specific email before relying on it.

### Phone Numbers
- **Sources**: Company website contact page, Google Maps, OpenCorporates (registered phone)
- **Verification**: Phone format validation, call to verify if critical
- **Common error**: Listing a main switchboard number as a direct line. Direct lines require human verification.

### Physical Address
- **Sources**: Company website, Google Maps, OpenCorporates registered address
- **Verification**: Geocode the address via Nominatim; check the location exists
- **Common error**: Registered address (often a lawyer's office) vs. operational HQ. Note both.

### Tech Stack
- **Sources**: PublicWWW (HTML/JS fingerprints), BuiltWith, Wappalyzer, DNS records, job postings
- **Verification**: Cross-reference 2+ sources. PublicWWW is highly reliable for frontend tech; BuiltWith for backend.
- **Common detections**:
  - **CMS**: WordPress, Webflow, Sanity, Contentful
  - **Analytics**: Google Analytics, Mixpanel, Amplitude, Heap
  - **CRM**: Salesforce (detectable via specific JS), HubSpot (HubSpot tracker)
  - **Marketing automation**: Marketo, Pardot, Customer.io
  - **Hosting**: AWS (CloudFront headers), GCP, Azure, Vercel (specific HTTP headers), Cloudflare
  - **Framework**: React (React DevTools detectable), Vue, Next.js (`__NEXT_DATA__`), Angular

## 5. People Enrichment — Specifics

When enriching a person (vs. a company), Forge follows a different process:

1. **Identity resolution**: Match name + company + role. Multiple "John Smith"s at "Acme" require disambiguation via LinkedIn URL or email.
2. **Role verification**: Current title, start date, reporting line (if available)
3. **Background**: Previous companies, education, certifications (LinkedIn)
4. **Public footprint**: Personal website, blog, GitHub, Twitter/X, conference talks, podcast appearances
5. **Contact discovery**: Email (via pattern + verification), LinkedIn DM, sometimes phone (publicly listed)

**Critical**: People enrichment has stricter compliance requirements. GDPR Article 9 prohibits processing of "special category data" — health, religion, political opinions, etc. Stick to **professional information**: role, company, career history, public professional content.

## 6. Completeness Scoring

After enrichment, Forge computes a **completeness score** — the % of expected fields that are populated and verified.

```typescript
function computeCompleteness(profile: CompanyProfile): number {
  const required = [
    'name', 'website', 'linkedin_url', 'industry', 'employee_count',
    'revenue', 'funding_stage', 'headquarters_country', 'headquarters_city',
    'founded_year', 'description', 'logo_url',
  ];
  const optional = [
    'twitter_url', 'facebook_url', 'crunchbase_url', 'stock_ticker',
    'naics_code', 'sic_code', 'parent_company', 'subsidiaries',
  ];
  const peopleRequired = ['ceo_name', 'ceo_linkedin_url'];
  
  const requiredScore = required.filter(f => profile[f]).length / required.length;
  const optionalScore = optional.filter(f => profile[f]).length / optional.length * 0.5;
  const peopleScore = peopleRequired.filter(f => profile[f]).length / peopleRequired.length;
  
  return Math.round((requiredScore * 0.5 + optionalScore * 0.2 + peopleScore * 0.3) * 100);
}
```

**Bands**:
- 85-100%: Fully enriched — ready for outreach
- 60-84%: Substantially enriched — outreach possible, some fields to verify
- 30-59%: Partially enriched — needs more research before outreach
- 0-29%: Skeleton — do not use for outreach

## 7. Verification Layer

The Judge agent doesn't take Forge's output at face value. Every field is verified:

- **Existence check**: Does the value exist? (no nulls, no empty strings, no "N/A")
- **Format check**: Email is RFC 5322 compliant; URL is RFC 3986 compliant; phone is E.164 compliant
- **Plausibility check**: Employee count > 0; revenue > 0; founded year > 1800 and ≤ current year
- **Source check**: At least one source cited per field; source URL stored
- **Recency check**: If the source is >2 years old, mark as `stale`
- **Cross-reference check**: Where multiple sources exist, do they agree within tolerance?

Fields that fail verification are marked `unverified` and excluded from downstream scoring.

## 8. Incremental Enrichment

Enrichment is **not one-shot**. As new data sources come online or prospects progress through the funnel, Forge should re-enrich:

- **Daily re-enrichment** for prospects in active sequences (check for trigger events)
- **Weekly re-enrichment** for top-1000 prospects in the database (refresh stale fields)
- **On-demand re-enrichment** when a prospect opens an email (get latest context for follow-up)
- **Quarterly re-enrichment** for all prospects (catch industry changes)

The Echo agent triggers re-enrichment based on:
- Time since last enrichment
- New data source availability
- Prospect stage changes
- Trigger event detection

## 9. Output Schema — The Enriched Profile

Forge outputs a structured profile that downstream agents consume:

```typescript
interface EnrichedCompanyProfile {
  // Identity
  id: string;
  name: string;
  aliases: string[];
  website: string;
  linkedin_url: string;
  
  // Firmographics
  industry: { value: string; source: string; verified: boolean };
  sub_industry: { value: string; source: string; verified: boolean };
  employee_count: { value: number; source: string; verified: boolean; as_of: string };
  revenue_usd: { value: number; source: string; verified: boolean; as_of: string };
  funding_stage: { value: string; source: string; verified: boolean; as_of: string };
  total_funding_usd: { value: number; source: string; verified: boolean };
  founded_year: { value: number; source: string; verified: boolean };
  headquarters: {
    country: string; state?: string; city: string; address?: string;
    lat?: number; lng?: number; source: string; verified: boolean;
  };
  
  // Ownership
  ownership_type: 'private' | 'public' | 'subsidiary' | 'nonprofit' | 'government';
  parent_company?: { name: string; source: string };
  stock_ticker?: { value: string; exchange: string; source: string };
  
  // Technographics
  tech_stack: Array<{ category: string; product: string; source: string; detected_at: string }>;
  
  // People
  executives: Array<{
    name: string;
    title: string;
    linkedin_url: string;
    email?: string;
    start_date: string;
    source: string;
  }>;
  
  // Behavioral
  recent_news: Array<{
    title: string;
    url: string;
    date: string;
    source: string;
    summary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  trigger_events: Array<{
    type: string;  // 'funding', 'hire', 'launch', 'expansion', etc.
    date: string;
    description: string;
    source: string;
  }>;
  
  // Metadata
  completeness_score: number;  // 0-100
  last_enriched_at: string;
  enrichment_sources: string[];
  disputed_fields: string[];  // fields with conflicting sources
  stale_fields: string[];  // fields with old sources
}
```

## 10. Common Enrichment Failures

### Failure 1: Hallucinated Data
LLMs sometimes invent plausible-sounding but fictional data ("CEO: Sarah Chen" when no such person exists). Counter: every field must cite a source URL that resolves.

### Failure 2: Stale Data
LinkedIn data from 2023 is presented as current. Counter: Always store `as_of` date; re-fetch for high-value prospects.

### Failure 3: Subsidiary Confusion
The subsidiary's data is mixed with the parent's. Counter: Always resolve to the operating entity; note parent ownership separately.

### Failure 4: Email Pattern Assumption
"Found 3 emails at acme.com → must use {first}@acme.com pattern." Counter: Verify each email individually via SMTP check.

### Failure 5: Over-Enrichment
Spending 5 minutes enriching a $5K/year prospect. Counter: Scale enrichment effort to prospect value. Tier 1 prospects (ICP A) get full enrichment; Tier 4 prospects (ICP D) get name + website only.
