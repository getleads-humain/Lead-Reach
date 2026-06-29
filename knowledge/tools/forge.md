---
title: "Forge — Data Enrichment Agent Tools"
category: tool
agent: forge
role: data-enrichment
tags: [forge, enrichment, verification, data-quality]
last_reviewed: "2026-06-22"
grade: "A"
---

# Forge — Data Enrichment Agent Tools

## 1. Role

Forge takes raw prospect records from Scout and enriches them with verified data: contact emails, phone numbers, technographics, recent company news, social profiles. Forge's defining principle is **verification** — every data point is sourced and tagged with confidence.

## 2. Cognitive Posture

- **Verification-first**: Every claim must have a source URL and a confidence score.
- **Multi-source**: Cross-reference each data point across 2+ sources when possible.
- **Anti-hallucination**: Forge never invents data; "unknown" is a valid output.

## 3. Tools

### Tool: enrich_account

**Purpose**: Enrich a single account with verified data points.

**Input**: Account object (name, domain, linkedin_url).

**Output**: Enriched account with:
- `technographics` (CRM, sales engagement, etc.)
- `firmographics` (headcount, revenue estimate, funding)
- `recent_news` (array of news items with URLs + dates)
- `social_profiles` (LinkedIn, Twitter, etc.)

### Tool: enrich_contact

**Purpose**: Find and verify contact info for a person at an account.

**Input**: Person object (name, title, company).

**Output**: Contact with:
- `email` (with confidence score + source)
- `phone` (with confidence score + source)
- `linkedin_url`
- `social_profiles`

### Tool: verify_email

**Purpose**: Verify an email address is deliverable.

**Input**: Email address.

**Output**: 
- `valid` (boolean)
- `confidence` (0–100)
- `reason` (e.g., "smtp_ok", "mailbox_full", "does_not_exist")

### Tool: verify_phone

**Purpose**: Verify a phone number is valid and connected.

**Input**: Phone number (E.164 format).

**Output**:
- `valid` (boolean)
- `carrier` (string)
- `line_type` (mobile, landline, voip)

### Tool: discover_technographics

**Purpose**: Discover technology stack installed at an account.

**Input**: Company domain.

**Output**: Array of technologies with:
- `name` (e.g., "Salesforce")
- `category` (e.g., "CRM")
- `source` (e.g., "BuiltWith", "HG Insights")
- `confidence` (0–100)

### Tool: find_recent_news

**Purpose**: Find recent news about an account.

**Input**: Company name + date range.

**Output**: Array of news items with:
- `headline`, `url`, `date`, `source`
- `category` (funding, hiring, product, M&A, leadership, earnings)
- `signal_score` (0–100)

### Tool: cross_reference

**Purpose**: Cross-reference a data point across multiple sources.

**Input**: Data point (e.g., headcount = 250).

**Output**: 
- `confirmed` (boolean)
- `sources` (array)
- `discrepancies` (array, if any)

## 4. Data Quality Tiers

Forge tags every data point with a quality tier:

| Tier | Definition | Use |
|------|------------|-----|
| A | Verified by 2+ sources within 30 days | Safe to use in outreach |
| B | Verified by 1 source within 90 days | Use with caution; verify before sending |
| C | Inferred from indirect signals | Use only for research, not outreach |
| D | Stale (>180 days) or unverified | Do not use; re-enrich |

## 5. Performance Metrics

| Metric | Target |
|--------|--------|
| Email verification accuracy | >95% (validated against bounce rate) |
| Phone verification accuracy | >90% |
| Technographic accuracy | >85% |
| News freshness (≤30 days) | >80% |
| Data quality tier distribution | >70% Tier A+B |

## 6. Handoffs

- **From Atlas**: List of accounts + contacts to enrich.
- **To Sage**: Specific research questions per account (for deep research).
- **To Judge**: Enriched accounts ready for qualification.

## 7. Error Handling & Edge Cases

### 7.1 Email Verification Failures

| Failure Mode | SMTP Response | `reason` Code | Action |
|-------------|---------------|---------------|--------|
| Mailbox does not exist | 550 5.1.1 | `does_not_exist` | Mark `valid: false`; do not send |
| Mailbox full | 552 5.2.2 | `mailbox_full` | Mark `valid: true` with warning; may bounce |
| Catch-all domain | 250 (accepts all) | `catch_all` | Cannot verify individual mailbox; set `confidence: 50` |
| Greylisting | 451 4.3.2 | `greylisted` | Retry after 5 min; if still greylisted, set `confidence: 60` |
| SMTP timeout | No response | `smtp_timeout` | Set `confidence: 40`; flag for manual verification |
| Disposable email | 250 | `disposable_domain` | Mark `valid: false`; these addresses are temporary |
| Role-based email | 250 | `role_based` | Mark `valid: true` but `confidence: 65`; role emails (info@, sales@) have lower engagement |

### 7.2 Phone Verification Edge Cases

| Edge Case | Detection | Action |
|-----------|-----------|--------|
| VoIP number | `line_type: voip` | Mark `valid: true` but note VoIP; may be temporary |
| Landline (no SMS) | `line_type: landline` | Valid but cannot receive SMS; note in output |
| Number ported recently | Carrier mismatch with area code | Still valid; note carrier change |
| Toll-free number | `line_type: toll_free` | Not a direct line; `confidence: 30` |
| Invalid E.164 format | Validation error | Return `valid: false`; request correct format |

### 7.3 Technographic Discovery Failures

| Failure | Detection | Action |
|---------|-----------|--------|
| No tech stack found | Empty array from all sources | Return `technographics: []`; do not invent |
| Conflicting tech signals | BuiltWith says "HubSpot", HG Insights says "Marketo" | Include both with source tags; flag discrepancy |
| Stale technographic data | Source data >180 days | Downgrade to Tier D; recommend re-enrichment |
| CDN/infrastructure false positives | "Cloudflare" detected as "technology" | Filter known infrastructure from application tech |

### 7.4 Cross-Reference Conflicts

When multiple sources disagree:

| Scenario | Resolution Rule |
|----------|----------------|
| Headcount: Source A says 250, Source B says 300 | Use most recent source; note range |
| Revenue: $10M vs $15M | Use lower bound; flag for Sage deep research |
| Industry: "SaaS" vs "FinTech" | Include both; company may be SaaS sub-vertical of FinTech |
| Location: "Austin" vs "Remote-first" | Keep HQ location; add `remote_first: true` flag |

### 7.5 Rate Limit Handling

- Email verification (SMTP): Max 100 verifications per domain per hour. Exceeding risks blacklisting.
- Phone verification API: Track per-provider rate limits; implement token-bucket throttling.
- BuiltWith / HG Insights: Max 1,000 queries per day. Queue excess requests for next-day batch.
- News API: Max 500 queries per hour. Batch account lookups into single queries where possible.

### 7.6 Data Not Found Scenarios

| Data Point | Not Found Action |
|------------|-----------------|
| Email for contact | Return `email: null`, `confidence: 0`; try email pattern inference from domain (Tier C) |
| Phone for contact | Return `phone: null`; not all roles have public phone numbers |
| Technographics | Return empty array; some companies have no detectable web technologies |
| News items | Return empty array; not all companies have recent news coverage |
| Funding data | Return `funding_stage: "unknown"`; do not assume bootstrapped |

## 8. Integration Patterns

### 8.1 Batch Enrichment Pipeline

```
Atlas → Forge.enrich_account (batch of 200)
              ├── discover_technographics (parallel per account)
              ├── find_recent_news (parallel per account)
              └── cross_reference (sequential, after initial data)
        Forge.enrich_contact (for each contact in batch)
              ├── verify_email (parallel per contact)
              └── verify_phone (parallel per contact)
        → Return enriched batch to Atlas
```

### 8.2 Incremental Enrichment

When an account is partially enriched (Tier C or D data), Forge performs incremental enrichment:

1. Check last enrichment timestamp.
2. If >30 days, re-enrich from scratch.
3. If <30 days, only enrich missing fields.
4. Always re-verify email before outreach (Bard triggers this).

### 8.3 Sage Escalation Pattern

```
Forge.cross_reference → (discrepancy found)
  → Forge flags data point as "needs_deep_research"
  → Atlas routes to Sage.research_question
  → Sage returns verified answer
  → Forge updates data point with Sage source
```

### 8.4 Pre-Outreach Verification

Before Bard composes outreach, Forge performs a last-mile verification:

```
Bard → Forge.verify_email (email for lead) → (valid: true) → Bard proceeds
                                       → (valid: false) → Bard skips; Flag to Flow
```

### 8.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| enrich_account | discover_technographics | Domain string | String |
| enrich_account | find_recent_news | Company name + date range | Object |
| enrich_account | cross_reference | Data points with sources | Array |
| enrich_contact | verify_email | Email address | String |
| enrich_contact | verify_phone | Phone number (E.164) | String |
| cross_reference | Sage (via Atlas) | Unresolved discrepancies | Object |

## 9. Quality Assurance Rules

### 9.1 Minimum Enrichment Completeness

An account is considered "enriched" (ready for Judge) when it has:
- Firmographics: headcount + industry + location (all three required)
- At least 1 contact with a verified email (confidence ≥70)
- At least 1 signal (from news or technographics)

Accounts missing these minimums are flagged as `enrichment_incomplete` and returned to Atlas for potential Sage research.

### 9.2 Confidence Thresholds for Outreach

| Data Point | Confidence Threshold | Below Threshold Action |
|------------|---------------------|----------------------|
| Email for outreach | ≥85 | Do not include in Bard dispatch; flag for manual review |
| Phone for outreach | ≥80 | Do not include in call script; flag for manual review |
| Technographic claim in email | ≥90 | Do not reference in personalized outreach |
| News item as trigger | ≥75 | Verify date and headline before using as trigger |
| Revenue estimate | ≥70 | Use range ($10M–$15M), not point estimate |

### 9.3 Validation Rules

- Email must pass RFC 5322 format validation before SMTP verification.
- Phone must be E.164 format (+1XXXXXXXXXX) before carrier lookup.
- Headcount must be a positive integer <1,000,000.
- Revenue must be a positive number in USD.
- News date must not be in the future.
- Technology name must match known catalog (BuiltWith, HG Insights, or manual entry).

### 9.4 Quality Gate Before Handoff

Before returning enriched accounts to Judge, Forge runs a quality gate:
1. **Completeness check**: ≥80% of required fields populated.
2. **Tier check**: ≥60% of data points are Tier A or B.
3. **Recency check**: No critical data point older than 90 days without a Tier D flag.

If any check fails, the account is flagged but still forwarded (Judge may downgrade).

## 10. Performance Optimization

### 10.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Email verification result | 7 days | On bounce detection |
| Phone verification result | 14 days | On call failure feedback |
| Technographics per domain | 30 days | On manual refresh request |
| News per company | 4 hours | On next enrichment request |
| Cross-reference results | 24 hours | On source data change |
| SMTP connection pool | Keep-alive 30s | On idle timeout |

### 10.2 Parallel Execution

- `discover_technographics` + `find_recent_news` run in parallel per account.
- `verify_email` runs in parallel for up to 50 contacts simultaneously.
- `verify_phone` runs in parallel for up to 20 contacts simultaneously (carrier API limit).
- `cross_reference` runs sequentially per data point (needs prior enrichment results).

### 10.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| enrich_account (full) | 5 min per account | Return partial enrichment; flag incomplete fields |
| verify_email (SMTP) | 10s per address | Return `confidence: 40`, `reason: smtp_timeout` |
| verify_phone | 8s per number | Return `valid: unknown` |
| discover_technographics | 30s per domain | Return partial tech stack |
| find_recent_news | 20s per company | Return empty news array |
| cross_reference | 15s per data point | Return best available source |

### 10.4 Batch Optimization

- Group email verifications by domain to reuse SMTP connections.
- Pre-warm SMTP connection pool for common email providers (Gmail, Outlook, custom domains).
- Batch technographic lookups: 1 API call for 50 domains vs 50 individual calls.

## 11. Anti-Patterns

### 11.1 Do Not: Invent Data Points

If headcount is unknown, return `null` — never estimate based on industry averages. "Unknown" is a valid and preferred output.

### 11.2 Do Not: Use Tier D Data in Outreach

Data older than 180 days or unverified must not be used as the basis for outreach personalization. Stale data leads to incorrect claims (e.g., "Congratulations on your Series A!" when they raised Series C two years ago).

### 11.3 Do Not: Verify Emails at Scale Without Throttling

Sending 1,000 SMTP verification requests to a single domain in 1 minute will get the sending IP blacklisted. Always respect per-domain rate limits (100/hour max).

### 11.4 Do Not: Trust a Single Source for Critical Data

If headcount comes from only LinkedIn (which may be outdated), cross-reference with Apollo or the company's careers page. A single source is Tier B at best.

### 11.5 Do Not: Skip Cross-Reference for High-Value Accounts

For accounts where the deal value could exceed $50K, always run `cross_reference` on firmographics before passing to Judge. The cost of a wrong outreach is higher than the enrichment cost.

### 11.6 Do Not: Re-Enrich From Scratch Unnecessarily

If an account was enriched 5 days ago and only the email needs re-verification, don't re-run the full `enrich_account`. Use incremental enrichment to save credits and time.

## 12. Output Schema Deep Dive

### 12.1 enrich_account Output

```yaml
account_id: "acc_abc123"
company_name: "Acme Corp"
domain: "acme.com"
linkedin_url: "https://linkedin.com/company/acme-corp"
enrichment_timestamp: "2026-06-22T16:00:00Z"
enrichment_version: 3

firmographics:
  headcount: 250
  headcount_range: "201-500"
  headcount_source: "linkedin"
  headcount_tier: "A"
  revenue_estimate: 25000000
  revenue_range: "$20M-$30M"
  revenue_source: "apollo"
  revenue_tier: "B"
  industry: "SaaS"
  sub_industry: "Sales Intelligence"
  industry_source: "linkedin"
  industry_tier: "A"
  location: "San Francisco, CA"
  founded_year: 2019
  funding_stage: "series_b"
  funding_last_date: "2026-05-15"
  funding_last_amount: 45000000
  funding_total: 72000000

technographics:
  - name: "Salesforce"
    category: "CRM"
    source: "BuiltWith"
    confidence: 92
    tier: "A"
    first_detected: "2025-09-15"
    last_verified: "2026-06-10"
  - name: "HubSpot"
    category: "Marketing Automation"
    source: "HG Insights"
    confidence: 78
    tier: "B"
    first_detected: "2026-01-20"
    last_verified: "2026-05-30"

recent_news:
  - headline: "Acme Corp Raises $45M Series B"
    url: "https://techcrunch.com/2026/05/15/acme-series-b"
    date: "2026-05-15"
    source: "TechCrunch"
    category: "funding"
    signal_score: 90
    tier: "A"
  - headline: "Acme Corp Hires New CRO"
    url: "https://acme.com/blog/new-cro"
    date: "2026-06-01"
    source: "Company Blog"
    category: "leadership"
    signal_score: 75
    tier: "B"

social_profiles:
  - platform: "linkedin"
    url: "https://linkedin.com/company/acme-corp"
    followers: 12400
  - platform: "twitter"
    url: "https://twitter.com/acmecorp"
    followers: 5200

data_quality_summary:
  total_data_points: 14
  tier_a_count: 8
  tier_b_count: 4
  tier_c_count: 1
  tier_d_count: 1
  overall_tier: "A"
  completeness_pct: 87
```

### 12.2 enrich_contact Output

```yaml
contact_id: "con_xyz789"
person:
  name: "Jane Smith"
  title: "VP of Sales"
  company: "Acme Corp"
  linkedin_url: "https://linkedin.com/in/jane-smith"

email:
  address: "jane@acme.com"
  valid: true
  confidence: 92
  reason: "smtp_ok"
  source: "apollo"
  tier: "A"
  verified_at: "2026-06-22T16:05:00Z"
  is_role_based: false
  is_disposable: false
  is_catch_all_domain: false

phone:
  number: "+14155551234"
  valid: true
  carrier: "AT&T"
  line_type: "mobile"
  confidence: 85
  source: "apollo"
  tier: "B"
  verified_at: "2026-06-22T16:05:30Z"

social_profiles:
  - platform: "linkedin"
    url: "https://linkedin.com/in/jane-smith"
    connections: 500

enrichment_completeness: 90
```

### 12.3 verify_email Output

```yaml
email: "jane@acme.com"
valid: true
confidence: 92
reason: "smtp_ok"
details:
  mx_records_found: true
  mx_host: "aspmx.l.google.com"
  smtp_response: "250 2.1.5 OK"
  catch_all_detected: false
  disposable_domain: false
  role_based: false
  first_seen: "2025-03-15"
verification_timestamp: "2026-06-22T16:05:00Z"
```

**Reason Code Reference**:

| Reason Code | Meaning | Confidence Range | Safe for Outreach? |
|-------------|---------|-----------------|-------------------|
| `smtp_ok` | SMTP verified mailbox exists | 85–100 | Yes |
| `catch_all` | Domain accepts all addresses | 40–60 | Risky; verify manually |
| `mailbox_full` | Mailbox exists but over quota | 70–85 | Yes, but may bounce |
| `does_not_exist` | SMTP 550; mailbox not found | 95–100 (in invalid) | No |
| `disposable_domain` | Temporary email service | 90–100 (in invalid) | No |
| `smtp_timeout` | Could not reach SMTP server | 30–50 | No; retry later |
| `greylisted` | Temporary rejection; retry later | 50–70 | Retry in 5 min |
| `syntax_invalid` | Fails RFC 5322 validation | 100 (in invalid) | No |
| `role_based` | Generic role email (sales@, info@) | 65–80 | Yes, but lower engagement |
