---
title: "Playbook: Research a Specific Company (Deep Profile)"
slug: playbook-research-specific-company
category: playbooks
tags: [playbook, company-research, deep-profile, intelligence]
agents: [atlas, scout, forge, sage, judge, bard, echo]
intent_types: [research_company]
priority: 88
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "End-to-end playbook for researching a single company in depth — financials, executives, tech stack, trigger events, and outreach recommendations."
---

# Playbook: Research a Specific Company (Deep Profile)

## 1. When to Use This Playbook

Use this when the user provides a specific company name (or website/LinkedIn URL) and wants a comprehensive deep-dive:
- "Research Stripe Inc."
- "Tell me about Acme Corp at acme.com"
- "Analyze linkedin.com/company/notion"

This is a **deep profile** playbook — the goal is comprehensive coverage of ONE company, not breadth across many.

## 2. Query Decomposition (Atlas)

Atlas identifies:
- **Company identifier**: Name, website domain, or LinkedIn URL
- **Intent**: research_company (deep profile)
- **Depth**: Full pipeline (6 agents)
- **Knowledge context**: Industry + region (if inferable from company info)

## 3. Identity Resolution (Scout — First Pass)

Before enrichment, resolve the company's identity:

### If Website Domain Provided
1. Fetch the website homepage via Jina Reader
2. Extract `<title>`, meta description, footer info (often has legal name)
3. Look for LinkedIn link in footer
4. Look for CRUNCHBASE / Twitter / Facebook links

### If LinkedIn URL Provided
1. Fetch LinkedIn company page
2. Extract company name, industry, size, HQ, founded year, description
3. Note: LinkedIn may rate-limit; use sparingly

### If Only Name Provided
1. Search Exa: `[company name] official website`
2. Search LinkedIn: `[company name]` filtered by industry
3. If multiple matches, present candidates to user for disambiguation

### Identity Verification
- Cross-reference at least 2 sources to confirm same company
- Capture: legal name, DBA name (if different), website domain, LinkedIn URL
- Note: Many companies have similar names; verify by industry + geography + size

## 4. Firmographic Enrichment (Forge)

### Industry & Sub-Industry
**Sources** (in priority order):
1. **OpenCorporates** — SIC code from registry
2. **LinkedIn** — Industry classification
3. **Company website** — Keyword analysis of "About" page
4. **NAICS lookup** — Cross-reference SIC to NAICS

**Output**: Primary industry (e.g., "SaaS"), sub-industry (e.g., "DevTools"), NAICS code, SIC code.

### Employee Count
**Sources**:
1. **LinkedIn** — Current employee count (most accurate for >50 FTE)
2. **Company website** — "About" page may list headcount or range
3. **OpenCorporates** — Some jurisdictions require disclosure
4. **Glassdoor** — Employee-submitted data

**Output**: Numerical count + as_of date + confidence.

### Revenue
**Sources**:
1. **SEC EDGAR** (US public) — Authoritative
2. **OpenCorporates** (some jurisdictions) — Filed financials
3. **Crunchbase** (startups) — Estimated
4. **Estimate from employee count** — Industry multiplier ($150K-$300K/FTE for SaaS; $200K-$500K for finance)

**Output**: Revenue in USD + estimated flag + confidence interval.

### Funding & Ownership
**Sources**:
1. **Crunchbase** — Funding rounds, investors
2. **Press releases** — Funding announcements
3. **SEC EDGAR Form D** — Private securities offerings
4. **OpenCorporates** — Ownership structure

**Output**: Funding stage (Bootstrapped/Seed/Series A-E/Public/PE), total raised, last round date, lead investors.

### Headquarters Location
**Sources**:
1. **Company website** — "Contact" or "About" page
2. **OpenCorporates** — Registered address
3. **LinkedIn** — HQ city
4. **Google Maps** — Geocoded location

**Output**: Country, state, city, address, lat/lng. Note if registered address differs from operational HQ.

### Founded Year
**Sources**:
1. **OpenCorporates** — Incorporation date
2. **LinkedIn** — Founded year
3. **Company website** — "Our Story" page
4. **Crunchbase** — Founded year

**Output**: Year + source.

## 5. Technographic Enrichment (Forge)

### Tech Stack Detection
Use **PublicWWW** to scan the company's website for technology fingerprints:

```typescript
// Detect Shopify
const shopifyResults = await publicWwwSearch({
  query: 'cdn.shopify.com',
  filter: `domain:${companyDomain}`,
  limit: 1
});

// Detect Salesforce
const salesforceResults = await publicWwwSearch({
  query: 'salesforce.com OR force.com',
  filter: `domain:${companyDomain}`,
  limit: 1
});
```

**Common detections**:
- **CMS**: WordPress, Webflow, Sanity, Contentful
- **E-commerce**: Shopify, BigCommerce, Magento, WooCommerce
- **CRM**: Salesforce, HubSpot, Pipedrive
- **Marketing**: Marketo, Mailchimp, Customer.io, Klaviyo
- **Analytics**: Google Analytics, Mixpanel, Amplitude, Segment
- **Cloud**: AWS (CloudFront headers), GCP, Azure, Vercel, Cloudflare
- **Framework**: React, Vue, Next.js, Angular

### DNS Records
- **MX records** reveal email provider (Google Workspace, Microsoft 365, custom)
- **TXT records** may reveal verification services (SPF, DKIM, domain verification for various tools)
- **NS records** reveal DNS provider

### Job Postings Analysis
If company is hiring, job descriptions reveal tech stack:
- "Experience with Salesforce" → Salesforce CRM
- "Python, Django" → Python/Django backend
- "React, TypeScript" → React frontend

## 6. Executive Discovery (Forge)

### Identify Top 5-7 Executives
**Sources**:
1. **Company website** — "Team" or "Leadership" page (most authoritative)
2. **LinkedIn** — Search "[company name] CEO" / "CRO" / "CTO" / "CFO" / "CMO" / "CHRO"
3. **SEC EDGAR DEF 14A** (public companies) — Top 5 officers + board
4. **Press releases** — Recent executive hires

**For each executive**:
- Name
- Title (current)
- LinkedIn URL
- Start date (in current role)
- Previous companies (LinkedIn "Experience")
- Public footprint (Twitter, GitHub, personal website, conference talks)

### CEO Profile (Always Include)
- Name, title, tenure
- LinkedIn URL
- Background (previous companies, education)
- Public statements (recent interviews, talks)
- Compensation (if public — DEF 14A)

## 7. Trigger Event Detection (Sage)

Scan for events in the last 90 days:

### News Mentions
```typescript
const newsResults = await newsSearchIntent(company.name);
const triggers = newsResults
  .filter(article => article.publish_date > ninetyDaysAgo)
  .map(article => classifyAsTrigger(article));
```

### SEC Filings (if public)
```typescript
const cik = await edgarGetCikByTicker(company.ticker);
const filings = await edgarGetFilings(cik);
const materialEvents = filings.filter(f => f.type === '8-K');
const quarterlyResults = filings.filter(f => f.type === '10-Q');
```

### LinkedIn Activity
- New executive hires (CEO/CRO/CTO/CFO changes)
- Headcount growth patterns (rapid hiring = growth; layoffs = distress)
- Job postings (reveal priorities)

### Trigger Classification
Each trigger event gets:
- Type (funding, executive hire, product launch, M&A, layoff, earnings, etc.)
- Date
- Description
- Outreach window (when to reach out — see `trigger-events-detection-timing.md`)
- Suggested angle (how to use in outreach)
- Source URL

## 8. Competitive Landscape (Sage)

Identify 3-5 direct competitors:

### Method 1: Direct Search
```
[company name] competitors
[company name] alternatives
[company name] vs
```

### Method 2: Customer Overlap
Filter companies by same industry + same size + same geography.

### Method 3: Tech Stack Overlap
PublicWWW reverse search: find other sites using same unique tech combination.

### For Each Competitor
- Name, website, LinkedIn URL
- Why they're a competitor (1 sentence)
- Relative size (smaller/similar/larger)
- Recent news (1 sentence)
- Differentiation (how prospect differs)

## 9. Market Position Analysis (Sage)

Apply SWOT or Porter's Five Forces:

### SWOT
- **Strengths**: What they're known for (from reviews, awards)
- **Weaknesses**: What reviewers complain about (G2, TrustRadius)
- **Opportunities**: Market trends, unmet needs
- **Threats**: Competition, regulation, technology shifts

### Position
- Leader, Challenger, Follower, Nicher
- Why? (1-2 sentence rationale)

## 10. Qualification (Judge)

### Determine Deal Size Estimate
Based on:
- Company revenue (typically 1-3% of revenue for SaaS spend)
- Company size ($500-$2000/employee/year for SaaS)
- Industry (financial services and healthcare spend more)
- Existing tech stack (premium tools suggest budget for premium tools)

### Select Framework
- < $5K ACV → CHAMPION
- $5K-$50K ACV → BANT
- $50K-$250K → BANT + CHAMPION
- $250K-$1M → MEDDIC
- > $1M → MEDDPICC

### Score Each Criterion
With evidence from Forge + Sage:
- Budget (from revenue, funding, recent investments)
- Authority (from identified executives)
- Need (from trigger events, pain signals)
- Timeline (from trigger events, budget cycle)

### Output
- Framework used
- Total score (0-100)
- Grade (A/B/C/D)
- Recommendation (contact_immediately/contact_this_week/nurture/disqualify)
- Risks and opportunities

## 11. Outreach Recommendation (Bard)

Based on Judge's recommendation + Sage's analysis:

### Select Angle
- If recent trigger event: Lead with trigger
- If pain signal detected: Lead with pain
- If market opportunity: Lead with opportunity
- If no clear angle: Lead with peer reference

### Compose Initial Email
Using the 5-component structure:
1. Subject line (5-7 words, lower case, curiosity trigger)
2. Hook (1-2 sentences, references trigger or pain)
3. Value prop (2-3 sentences, specific to their situation)
4. Proof (1 sentence, specific metric from similar company)
5. CTA (1 sentence, specific time, low-friction)
6. Sign-off (1 line, name + 1 credibility marker)

### Compose Sequence
6-touch sequence (email, LinkedIn, phone as appropriate):
- Day 0: Initial email
- Day 2: Bump email (new angle)
- Day 4: LinkedIn connection
- Day 7: Trigger-event email
- Day 11: Case study email
- Day 15: Breakup email

## 12. Output to User

The campaign detail page shows:

### Company Snapshot Card
- Logo, name, website
- Industry, size, revenue, founded year
- Funding stage, total raised
- HQ location (with map)
- Last enriched date

### Executives Section
- Top 5-7 executives with photos, titles, LinkedIn links
- Click on executive for deeper profile

### Tech Stack Section
- Detected technologies by category (CMS, CRM, Analytics, etc.)
- Source: PublicWWW scan date

### Financials Section (if public)
- Revenue trend (last 3 years from SEC filings)
- Stock price + market cap (from yfinance)
- Key ratios (P/E, gross margin, growth rate)

### Trigger Events Section
- Last 90 days of triggers
- Each with: type, date, description, source URL, suggested angle

### Competitive Landscape Section
- 3-5 competitors with comparison table
- Positioning map (2x2 matrix)

### SWOT Analysis Section
- Strengths, Weaknesses, Opportunities, Threats
- Each with 2-3 specific items

### Qualification Scorecard Section
- Framework used (BANT/MEDDIC)
- Per-criterion scores with evidence
- Total score + grade
- Recommendation + risks + opportunities

### Outreach Recommendations Section
- Primary angle (1-2 sentences)
- Suggested subject line
- Suggested email body (editable)
- 6-touch sequence (one-click deploy)
- Best outreach window (date range)

### Sources Section
- All URLs consulted
- Trust tier for each
- Retrieval timestamps

## 13. Common Pitfalls

### Pitfall 1: Subsidiary vs. Parent Confusion
- Always resolve to the operating entity
- Note parent ownership separately
- Use financials of the operating entity, not the holding company

### Pitfall 2: Stale Data
- LinkedIn data from 2 years ago presented as current
- Always store `as_of` date
- Re-fetch for high-value prospects

### Pitfall 3: Wrong Company
- Multiple companies with same name
- Verify by industry + size + geography, not just name
- When ambiguous, ask user to confirm

### Pitfall 4: Hallucinated Executives
- LLM invents plausible-sounding names
- Every executive must trace to a verifiable URL (LinkedIn, company website, press release)

### Pitfall 5: Tech Stack Misinterpretation
- PublicWWW detects a snippet → assume entire tech stack
- Some snippets are false positives (analytics tracker doesn't mean deep integration)
- Cross-reference with job postings for backend tech

## 14. Expected Duration

End-to-end: 2-5 minutes per company

- Identity resolution: 10-20 seconds
- Firmographic enrichment: 30-60 seconds (parallel)
- Technographic enrichment: 30-60 seconds (PublicWWW is slow)
- Executive discovery: 30-60 seconds (LinkedIn + company website)
- Trigger event detection: 30-60 seconds (news + SEC)
- Competitive landscape: 30-60 seconds
- Qualification: 10-20 seconds (mostly LLM)
- Outreach composition: 20-40 seconds (LLM)
- Total: ~3-5 minutes

## 15. Success Metrics

- **Completeness**: >70% of expected fields populated
- **Verification**: >80% of fields with verifiable source
- **Trigger detection**: At least 1 trigger in last 90 days (for active companies)
- **Executive identification**: Top 3 executives identified with LinkedIn URLs
- **Tech stack**: At least 5 technologies detected
- **Outreach quality**: 3+ personalization variables referenced
- **Time**: <5 minutes end-to-end
