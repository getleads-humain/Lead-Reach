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
