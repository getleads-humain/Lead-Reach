---
title: "Dataset — B2B Contact Attributes for Enrichment"
slug: dataset-b2b-contact-attributes
category: dataset
grade: A
last_reviewed: 2026-07-08
tags: [b2b, contact-attributes, firmographic, technographic, intent-signals, psychographic, enrichment, data-quality, lead-scoring]
agents: [atlas, scout, forge, sage, judge, bard]
priority: 95
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "Comprehensive taxonomy of B2B contact and account attributes for lead enrichment, scoring, and segmentation. Covers firmographic, technographic, intent, psychographic, and contact-level dimensions with data sources, quality scoring, and freshness guidelines."
---

# Dataset — B2B Contact Attributes for Enrichment

## 1. Purpose

This document defines the canonical attribute taxonomy used by LeadReach agents for contact and account enrichment. Every attribute includes its data type, acceptable values, primary and secondary data sources, quality scoring rules, and freshness requirements. Agents should reference this file when:

- Enriching a company or contact record
- Validating incoming data against the schema
- Computing lead scores or ICP match percentages
- Determining which attributes are stale and need refresh
- Building segmentation queries or audience lists

## 2. Attribute Categories Overview

| Category | Attribute Count | Primary Use | Enrichment Priority |
|---|---|---|---|
| Firmographic | 18 | ICP matching, TAM sizing | Critical |
| Technographic | 14 | ICP matching, integration selling | High |
| Intent Signals | 12 | Prioritization, timing | Critical |
| Psychographic | 8 | Messaging, channel selection | Medium |
| Contact-Level | 16 | Persona mapping, routing | Critical |
| Geographic | 10 | Territory assignment, compliance | High |
| Social/Presence | 8 | Channel strategy, verification | Medium |

**Total canonical attributes: 86**

## 3. Firmographic Attributes

Firmographic attributes describe the organizational characteristics of a company. These are the primary dimensions for ICP matching and TAM calculation.

### 3.1 Core Firmographic Attributes

| Attribute | Data Type | Example Values | Required | Enrichment Priority |
|---|---|---|---|---|
| `company_name` | string | "Stripe, Inc." | Yes | P0 |
| `company_name_legal` | string | "Stripe, Inc." | No | P2 |
| `website_domain` | string | "stripe.com" | Yes | P0 |
| `employee_count` | integer | 8000 | Yes | P0 |
| `employee_count_range` | enum | "1000-5000" | Yes | P0 |
| `revenue_usd` | integer | 14000000000 | Yes | P0 |
| `revenue_range_usd` | enum | "$1B-$5B" | Yes | P0 |
| `industry` | string | "Financial Services" | Yes | P0 |
| `sub_industry` | string | "Payments" | No | P1 |
| `founded_year` | integer | 2010 | No | P2 |
| `ownership_type` | enum | "private", "public", "nonprofit", "government" | Yes | P0 |
| `headquarters_country` | string (ISO 3166-1 alpha-2) | "US" | Yes | P0 |
| `headquarters_state` | string (ISO 3166-2) | "US-CA" | Yes | P1 |
| `headquarters_city` | string | "South San Francisco" | No | P1 |

### 3.2 Funding and Growth Attributes

| Attribute | Data Type | Example Values | Required | Enrichment Priority |
|---|---|---|---|---|
| `funding_stage` | enum | "Pre-seed", "Seed", "Series A" through "Series H", "Late Stage", "IPO" | No | P1 |
| `total_funding_usd` | integer | 2200000000 | No | P1 |
| `last_funding_date` | date | "2023-03-01" | No | P1 |
| `last_funding_round_usd` | integer | 650000000 | No | P1 |
| `last_funding_investors` | string[] | ["Sequoia", "Andreessen Horowitz"] | No | P2 |
| `growth_rate_yoy_pct` | float | 45.2 | No | P1 |
| `employee_growth_12m_pct` | float | 32.0 | No | P1 |
| `revenue_growth_yoy_pct` | float | 55.0 | No | P2 |

### 3.3 Industry Code Attributes

| Attribute | Data Type | Example | Source Priority |
|---|---|---|---|
| `sic_code` | string (4-digit) | "7389" | Primary |
| `sic_description` | string | "Business Services, NEC" | Derived |
| `naics_code` | string (6-digit) | "519290" | Primary |
| `naics_description` | string | "Web Search Portals & All Other Info Services" | Derived |
| `gics_sector` | string | "Information Technology" | Secondary |
| `gics_industry_group` | string | "Software & Services" | Secondary |
| `gics_industry` | string | "IT Consulting & Other Services" | Secondary |
| `leadreach_industry_tag` | string | "fintech-payments" | LeadReach Custom |

### 3.4 Firmographic Data Sources

```json
{
  "firmographic_sources": {
    "primary": [
      {
        "source": "LinkedIn Company Pages",
        "attributes": ["company_name", "employee_count", "industry", "founded_year", "headquarters"],
        "freshness": "7 days",
        "coverage_pct": 85,
        "accuracy_pct": 88,
        "cost_per_lookup": 0.03,
        "api_rate_limit": "500 req/min"
      },
      {
        "source": "Crunchbase",
        "attributes": ["funding_stage", "total_funding_usd", "last_funding_date", "last_funding_investors"],
        "freshness": "24 hours",
        "coverage_pct": 72,
        "accuracy_pct": 92,
        "cost_per_lookup": 0.05,
        "api_rate_limit": "200 req/min"
      },
      {
        "source": "OpenCorporates",
        "attributes": ["company_name_legal", "founded_year", "headquarters"],
        "freshness": "30 days",
        "coverage_pct": 65,
        "accuracy_pct": 95,
        "cost_per_lookup": 0.00,
        "api_rate_limit": "1000 req/min"
      }
    ],
    "secondary": [
      {
        "source": "ZoomInfo",
        "attributes": ["revenue_usd", "employee_count", "sic_code", "naics_code"],
        "freshness": "30 days",
        "coverage_pct": 70,
        "accuracy_pct": 80,
        "cost_per_lookup": 0.12
      },
      {
        "source": "Apollo.io",
        "attributes": ["employee_count", "revenue_usd", "industry"],
        "freshness": "14 days",
        "coverage_pct": 60,
        "accuracy_pct": 75,
        "cost_per_lookup": 0.04
      },
      {
        "source": "SEC EDGAR (public companies only)",
        "attributes": ["revenue_usd", "employee_count", "founded_year"],
        "freshness": "90 days (quarterly filings)",
        "coverage_pct": 15,
        "accuracy_pct": 99,
        "cost_per_lookup": 0.00
      }
    ]
  }
}
```

### 3.5 Employee Count Range Taxonomy

| Range Code | Min | Max | Label | Typical ACV Range |
|---|---|---|---|---|
| `micro` | 1 | 9 | Micro Business | $1K-$10K |
| `small` | 10 | 49 | Small Business | $5K-$25K |
| `sme` | 50 | 199 | SME | $15K-$75K |
| `mid_market` | 200 | 999 | Mid-Market | $30K-$150K |
| `mid_enterprise` | 1000 | 4999 | Mid-Enterprise | $75K-$500K |
| `large_enterprise` | 5000 | 9999 | Large Enterprise | $150K-$1M+ |
| `global_enterprise` | 10000 | null | Global Enterprise | $500K-$5M+ |

### 3.6 Revenue Range Taxonomy

| Range Code | Min (USD) | Max (USD) | Label |
|---|---|---|---|
| `pre_revenue` | 0 | 0 | Pre-Revenue |
| `micro_revenue` | 1 | 999999 | Under $1M |
| `small_revenue` | 1000000 | 9999999 | $1M-$10M |
| `mid_revenue` | 10000000 | 49999999 | $10M-$50M |
| `large_revenue` | 50000000 | 249999999 | $50M-$250M |
| `xl_revenue` | 250000000 | 999999999 | $250M-$1B |
| `xxl_revenue` | 1000000000 | null | $1B+ |

## 4. Technographic Attributes

Technographic attributes describe the technology infrastructure and tools used by a company. These are critical for integration-based selling and competitive displacement strategies.

### 4.1 Technology Stack Detection Attributes

| Attribute | Data Type | Example Values | Detection Method |
|---|---|---|---|
| `tech_stack` | object[] | See schema below | Multi-source |
| `cloud_provider` | enum[] | ["aws", "gcp", "azure", "digitalocean"] | DNS/SSL analysis |
| `hosting_type` | enum | "cloud", "on_premise", "hybrid" | DNS analysis |
| `cms_platform` | string | "WordPress", "Webflow", "Contentful" | HTTP headers, JS |
| `analytics_tools` | string[] | ["Google Analytics", "Segment", "Mixpanel"] | JS detection |
| `crm_system` | string | "Salesforce", "HubSpot", "Pipedrive" | Job postings, JS |
| `marketing_automation` | string | "Marketo", "HubSpot", "Pardot" | Email headers, JS |
| `sales_engagement` | string | "Outreach", "Salesloft", "Lemlist" | Job postings |
| `dev_framework` | string[] | ["React", "Next.js", "Django"] | JS detection, headers |
| `payment_processor` | string | "Stripe", "Adyen", "Braintree" | JS, checkout pages |
| `customer_support` | string | "Zendesk", "Intercom", "Freshdesk" | JS, subdomain |
| `erp_system` | string | "SAP", "NetSuite", "Oracle" | Job postings |
| `communication_tools` | string[] | ["Slack", "Teams", "Zoom"] | Job postings, DNS |
| `security_tools` | string[] | ["Okta", "Auth0", "Cloudflare"] | DNS, JS, headers |

### 4.2 Tech Stack Object Schema

Each technology entry in the `tech_stack` array follows this schema:

```json
{
  "category": "Analytics",
  "product": "Segment",
  "vendor": "Twilio Segment",
  "version": null,
  "source": "PublicWWW",
  "detection_method": "javascript_snippet",
  "detected_at": "2026-07-01",
  "confidence": 0.95,
  "is_competitor_to": [],
  "is_complementary_to": ["Mixpanel", "Amplitude"],
  "replacement_opportunity": false,
  "icp_signal_strength": 0.8
}
```

### 4.3 Technographic Data Sources

```json
{
  "technographic_sources": {
    "passive_detection": [
      {
        "method": "JavaScript Snippet Analysis",
        "tools": ["PublicWWW", "Wappalyzer", "BuiltWith"],
        "coverage_pct": 70,
        "accuracy_pct": 90,
        "freshness": "Real-time (on crawl)",
        "limitations": "Only detects client-side tech; cannot detect backend infrastructure"
      },
      {
        "method": "DNS Record Analysis",
        "tools": ["SecurityTrails", "ViewDNS"],
        "coverage_pct": 85,
        "accuracy_pct": 80,
        "freshness": "1-7 days",
        "limitations": "Indirect inference; CNAME records suggest cloud provider but not definitive"
      },
      {
        "method": "HTTP Header Analysis",
        "tools": ["Custom crawler", "HTTPArchive"],
        "coverage_pct": 60,
        "accuracy_pct": 85,
        "freshness": "Real-time (on request)",
        "limitations": "Headers can be removed or spoofed; only works for web-facing infrastructure"
      },
      {
        "method": "SSL Certificate Analysis",
        "tools": ["Censys", "Certificate Transparency logs"],
        "coverage_pct": 75,
        "accuracy_pct": 75,
        "freshness": "1-30 days",
        "limitations": "Indirect inference only; SSL issuer can suggest hosting provider"
      }
    ],
    "active_intelligence": [
      {
        "method": "Job Posting Analysis",
        "tools": ["LinkedIn Jobs", "Indeed", "Greenhouse", "Lever"],
        "coverage_pct": 45,
        "accuracy_pct": 85,
        "freshness": "7-30 days",
        "limitations": "Only captures tech that companies are hiring for; lag indicator"
      },
      {
        "method": "Review Platform Scraping",
        "tools": ["G2", "Capterra", "TrustRadius"],
        "coverage_pct": 25,
        "accuracy_pct": 80,
        "freshness": "30-90 days",
        "limitations": "Only captures tech that users review; bias toward popular tools"
      }
    ]
  }
}
```

### 4.4 SaaS Category Taxonomy for Technographic Profiling

| Category | Sub-Categories | Key Products | ICP Signal |
|---|---|---|---|
| CRM | SFDC, HubSpot, Pipedrive, Zoho | Salesforce, HubSpot CRM | High (enterprise = SFDC, SMB = HubSpot) |
| Marketing Automation | MAP, Email, ABM | Marketo, HubSpot, Pardot, Demandbase | High (MAP maturity = buying readiness) |
| Sales Engagement | Sequences, Dialers | Outreach, Salesloft, Gong, Chorus | Critical (direct adjacency for LeadReach) |
| Analytics | Web, Product, BI | GA, Segment, Mixpanel, Tableau, Looker | Medium (data maturity signal) |
| Cloud Infrastructure | IaaS, PaaS, Container | AWS, GCP, Azure, Vercel, Railway | Medium (cloud-native = modern buyer) |
| Dev Tools | CI/CD, Monitoring, Version Control | GitHub, GitLab, Datadog, PagerDuty | Medium (developer-first GTM signal) |
| Customer Support | Helpdesk, Chat, Knowledge Base | Zendesk, Intercom, Freshdesk, Notion | Medium (support complexity signal) |
| HR/People | ATS, HCM, Payroll | Greenhouse, Lever, Rippling, Deel | Medium (hiring velocity signal) |
| Security | Identity, Access, Compliance | Okta, Auth0, CrowdStrike, SentinelOne | Low (compliance signal) |
| Finance | ERP, Accounting, Billing | NetSuite, QuickBooks, Stripe, Chargebee | Medium (finance maturity signal) |

## 5. Intent Signal Attributes

Intent signals indicate a company's or contact's active interest in a product category. These are the most time-sensitive attributes and directly influence outreach prioritization.

### 5.1 Intent Signal Types

| Signal Type | Source Tier | Time Sensitivity | Signal Strength | Description |
|---|---|---|---|---|
| Web visit (pricing page) | 1st party | High (hours) | Very Strong | Direct interest in cost/commitment |
| Web visit (product page) | 1st party | High (hours) | Strong | Active product evaluation |
| Web visit (competitor page) | 1st party | Medium (days) | Strong | Comparison shopping |
| Content download | 1st party | Medium (days) | Medium | Top/mid-funnel interest |
| Demo request | 1st party | Critical (hours) | Very Strong | Bottom-funnel buying signal |
| Free trial signup | 1st party | Critical (minutes) | Very Strong | Active evaluation |
| Job posting (relevant role) | 1st party/3rd party | Medium (weeks) | Medium | Headcount signal |
| Patent filing | 3rd party | Low (months) | Low | Innovation direction |
| Review site activity | 2nd party | Medium (days) | Strong | Active comparison |
| Publisher content consumption | 3rd party | Medium (days) | Medium | Topic interest |
| Social engagement | 1st party/2nd party | Medium (days) | Low-Medium | Brand/category interest |
| Event attendance | 2nd party | Low (weeks) | Medium | Category interest |

### 5.2 Intent Signal Schema

```json
{
  "intent_signals": [
    {
      "signal_id": "int_001",
      "signal_type": "web_visit",
      "source_tier": "first_party",
      "category": "pricing_page",
      "url_visited": "https://leadreach.ai/pricing",
      "visitor_identity": {
        "company": "Acme Corp",
        "contact": null,
        "ip_range": "203.0.113.0/24",
        "identification_method": "reverse_ip_lookup"
      },
      "detected_at": "2026-07-08T14:30:00Z",
      "signal_strength": 0.92,
      "decay_rate": 0.15,
      "half_life_days": 4.6,
      "current_strength": 0.88,
      "correlated_signals": ["int_002", "int_003"],
      "correlation_score": 0.78,
      "suggested_action": "Contact within 4 hours; high-intent pricing page visit"
    }
  ]
}
```

### 5.3 Intent Signal Decay Rates

Intent signals degrade over time. The following table defines the half-life and complete decay timelines for each signal type:

| Signal Type | Half-Life | Complete Decay | Decay Formula | Priority Threshold |
|---|---|---|---|---|
| Pricing page visit | 4.6 days | 30 days | `strength = initial * 0.85^(days)` | ≥ 0.5 |
| Demo request | 2.1 days | 14 days | `strength = initial * 0.72^(days)` | ≥ 0.3 |
| Product page visit | 7 days | 45 days | `strength = initial * 0.91^(days)` | ≥ 0.4 |
| Content download | 14 days | 90 days | `strength = initial * 0.95^(days)` | ≥ 0.3 |
| Job posting | 21 days | 120 days | `strength = initial * 0.97^(days)` | ≥ 0.3 |
| Review site activity | 10 days | 60 days | `strength = initial * 0.93^(days)` | ≥ 0.4 |
| Social engagement | 7 days | 45 days | `strength = initial * 0.91^(days)` | ≥ 0.3 |
| Event attendance | 30 days | 180 days | `strength = initial * 0.98^(days)` | ≥ 0.3 |
| Patent filing | 90 days | 365 days | `strength = initial * 0.99^(days)` | ≥ 0.2 |

### 5.4 Multi-Signal Correlation Framework

When multiple intent signals are detected for the same account within a rolling window, their combined strength is calculated using a weighted correlation model:

```
combined_strength = 1 - Π(1 - wᵢ × sᵢ)
```

Where:
- `wᵢ` = weight for signal type i (see table below)
- `sᵢ` = current (decay-adjusted) strength of signal i

| Signal Type | Weight (wᵢ) | Rationale |
|---|---|---|
| Demo request | 0.95 | Highest buying intent |
| Pricing page visit | 0.90 | Strong commercial intent |
| Free trial signup | 0.95 | Active evaluation |
| Product page visit | 0.70 | Active research |
| Content download | 0.50 | Educational interest |
| Job posting (relevant) | 0.55 | Headcount signal |
| Review site activity | 0.65 | Comparison shopping |
| Social engagement | 0.35 | Low-commitment interest |

**Example calculation:**
- Pricing page visit (s=0.88, w=0.90) + Content download (s=0.65, w=0.50)
- `combined = 1 - (1 - 0.90×0.88) × (1 - 0.50×0.65)`
- `combined = 1 - (1 - 0.792) × (1 - 0.325)`
- `combined = 1 - 0.208 × 0.675`
- `combined = 1 - 0.1404`
- `combined = 0.86` (Very Strong)

### 5.5 Intent-to-Purchase Timeline

| Combined Strength | Estimated Purchase Timeline | Recommended Action | Outreach Cadence |
|---|---|---|---|
| 0.90+ | 0-30 days | Immediate outreach, AE engagement | Same day, then daily x3 |
| 0.75-0.89 | 30-60 days | Priority outreach, SDR + AE | Within 24h, then 2x/week |
| 0.60-0.74 | 60-90 days | Standard outreach, SDR | Within 48h, then weekly |
| 0.45-0.59 | 90-180 days | Nurture sequence, content | Weekly, automated |
| 0.30-0.44 | 180-365 days | Long-term nurture | Bi-weekly, automated |
| < 0.30 | 365+ days | Monitor only | Monthly check |

## 6. Psychographic Attributes

Psychographic attributes describe the buying behavior and decision-making characteristics of contacts. These inform messaging strategy, channel selection, and sales approach.

### 6.1 Buying Persona Mapping

| Persona | Characteristics | Preferred Content | Outreach Style | Typical Title |
|---|---|---|---|---|
| `executive_visionary` | Strategy-focused, ROI-driven, brief | Executive summaries, ROI calculators | Direct, concise, peer-referenced | C-suite, VP |
| `technical_evaluator` | Detail-oriented, skeptical, data-driven | Technical docs, API references, benchmarks | Educational, evidence-heavy | Director, Architect, Lead Eng |
| `champion_influencer` | Politically savvy, seeks allies, pragmatic | Case studies, peer reviews, battlecards | Collaborative, enablement-focused | Senior Manager, Team Lead |
| `economic_buyer` | Budget-conscious, risk-averse, process-driven | Pricing guides, TCO analysis, contracts | Transparent, no-surprise, structured | CFO, VP Finance, Procurement |
| `end_user_advocate` | Feature-focused, productivity-driven | Product demos, tutorials, free trial | Hands-on, experiential | Individual Contributor |
| `blocker_skeptic` | Status quo defender, change-resistant | Security docs, migration guides, testimonials | Patient, social-proof heavy | IT Admin, Compliance Officer |
| `gatekeeper` | Process-focused, access controller | Brief value prop, clear next steps | Respectful of time, professional | EA, Coordinator |
| `external_consultant` | Advisory role, unbiased preference | Comparative analysis, market research | Data-rich, no-fluff | Consultant, Advisor |

### 6.2 Decision-Making Style Classification

```json
{
  "decision_making_styles": {
    "analytical": {
      "description": "Data-driven, requires extensive evidence, slow decision cycle",
      "indicators": [
        "Requests detailed technical documentation",
        "Asks for benchmark data and case studies",
        "Long evaluation cycles (>60 days)",
        "Involves multiple stakeholders in review"
      ],
      "outreach_strategy": "Provide data-rich content; avoid pressure tactics; share benchmarks and ROI calculations",
      "expected_cycle_multiplier": 1.5
    },
    "directive": {
      "description": "Top-down decision maker, fast cycle, intuition-informed",
      "indicators": [
        "Single decision-maker or small committee",
        "Makes decisions in <30 days",
        "Values peer references over data",
        "Direct communication style"
      ],
      "outreach_strategy": "Be concise; lead with outcomes; provide social proof; propose specific next steps",
      "expected_cycle_multiplier": 0.7
    },
    "collaborative": {
      "description": "Consensus-builder, values team input, moderate cycle",
      "indicators": [
        "Involves cross-functional team in evaluation",
        "Seeks buy-in before decisions",
        "Moderate evaluation cycles (30-60 days)",
        "Values team enablement content"
      ],
      "outreach_strategy": "Multi-thread the account; provide shareable content; enable the champion; address all stakeholders",
      "expected_cycle_multiplier": 1.0
    },
    "cautious": {
      "description": "Risk-averse, requires social proof, slow cycle",
      "indicators": [
        "Extensive reference checks",
        "Requires pilot/POC before commitment",
        "Concerned about switching costs",
        "Prefers established vendors"
      ],
      "outreach_strategy": "Emphasize track record and customer count; offer pilot programs; address migration concerns explicitly",
      "expected_cycle_multiplier": 1.3
    }
  }
}
```

### 6.3 Psychographic Data Sources

| Source | Detectable Attributes | Coverage | Accuracy | Notes |
|---|---|---|---|---|
| DISC/Personality assessment integrations | Decision style, communication preference | 5% | 80% | Only for opted-in contacts |
| LinkedIn activity analysis | Content preferences, engagement patterns | 40% | 65% | Inferential; requires NLP analysis |
| Email interaction patterns | Response time, detail level, question types | 60% | 70% | First-party data from outreach |
| Meeting behavior | Attendance, participation, follow-up patterns | 50% | 75% | Requires CRM + calendar integration |
| Content consumption patterns | Topic interest, funnel stage, format preference | 45% | 72% | Requires marketing automation data |
| Job title + tenure inference | Persona classification, authority level | 70% | 68% | Rule-based from contact attributes |

## 7. Contact-Level Attributes

Contact-level attributes describe the individual person within a target account. These determine persona classification, routing priority, and personalization depth.

### 7.1 Core Contact Attributes

| Attribute | Data Type | Example | Required | Priority |
|---|---|---|---|---|
| `first_name` | string | "Sarah" | Yes | P0 |
| `last_name` | string | "Chen" | Yes | P0 |
| `email` | string | "sarah@acme.com" | Yes | P0 |
| `email_status` | enum | "valid", "invalid", "risky", "unknown" | Yes | P0 |
| `title` | string | "VP of Sales" | Yes | P0 |
| `seniority_level` | enum | See 7.2 | Yes | P0 |
| `department` | enum | See 7.3 | Yes | P1 |
| `reporting_to` | string | "Chief Revenue Officer" | No | P2 |
| `direct_reports_count` | integer | 8 | No | P2 |
| `linkedin_url` | string | "https://linkedin.com/in/sarahchen" | No | P1 |
| `phone` | string | "+1-555-123-4567" | No | P1 |
| `phone_status` | enum | "valid", "invalid", " DNC", "unknown" | No | P1 |
| `location_city` | string | "San Francisco" | No | P2 |
| `location_country` | string | "US" | No | P2 |
| `time_zone` | string | "America/Los_Angeles" | No | P2 |
| `tenure_at_company_months` | integer | 36 | No | P2 |
| `tenure_in_role_months` | integer | 24 | No | P2 |
| `previous_companies` | string[] | ["Stripe", "Google"] | No | P2 |
| `education` | object[] | [{"school": "Stanford", "degree": "MBA"}] | No | P3 |

### 7.2 Seniority Level Mapping

| Level | Code | Typical Titles | Decision Authority | Estimated Budget Authority |
|---|---|---|---|---|
| C-Suite / Executive | `c_suite` | CEO, CTO, CFO, CRO, CMO | Final authority on strategic purchases | $500K+ |
| Senior VP | `svp` | SVP Sales, SVP Engineering | Co-authority on large deals | $250K-$500K |
| VP | `vp` | VP Sales, VP Engineering, VP Marketing | Authority on departmental purchases | $50K-$250K |
| Director | `director` | Director of Sales, Director of Product | Recommender, limited authority | $25K-$75K |
| Senior Manager | `sr_manager` | Senior Sales Manager, Sr. Product Manager | Influencer, small budget | $10K-$25K |
| Manager | `manager` | Sales Manager, Marketing Manager | Influencer, no direct budget | $5K-$10K |
| Team Lead | `team_lead` | Team Lead, Staff Engineer | Technical influencer | $0-$5K |
| Senior Individual Contributor | `sr_ic` | Senior SDR, Senior Engineer | User/evaluator | $0 |
| Individual Contributor | `ic` | SDR, Engineer, Analyst | End user | $0 |

### 7.3 Department Mapping

| Department | Code | Typical Sub-Departments | Relevant For |
|---|---|---|---|
| Revenue / Sales | `revenue` | Sales, SDR, Account Management, Sales Ops | LeadReach primary target |
| Marketing | `marketing` | Demand Gen, Content, Product Marketing, ABM | Secondary target, champion route |
| Engineering | `engineering` | Frontend, Backend, DevOps, Platform, QA | Technical evaluator |
| Product | `product` | Product Management, Product Design | Champion/influencer |
| Finance | `finance` | Accounting, FP&A, Treasury, Procurement | Economic buyer |
| IT / Technology | `it` | IT Ops, Security, Data, Infrastructure | Gatekeeper/blocker risk |
| Operations | `operations` | Revenue Ops, BizOps, Customer Success | Enabler/champion |
| HR / People | `people` | Recruiting, L&D, People Ops | Adjacent (hiring signal) |
| Legal / Compliance | `legal` | Legal, Compliance, Privacy | Gatekeeper/risk |
| Executive | `executive` | CEO Office, Board, Strategy | Final decision maker |

### 7.4 Title-to-Seniority Normalization Rules

AI agents must normalize free-text job titles into canonical seniority levels and departments. Use the following pattern matching:

```python
# Title normalization rules for LeadReach agents
TITLE_PATTERNS = {
    "c_suite": [
        r"\bC[A-Z]O\b",           # CEO, CTO, CFO, CRO, CMO, CIO, CISO
        r"\bChief\b.*\bOfficer\b", # Chief Executive Officer
        r"\bFounder\b",
        r"\bCo-founder\b",
        r"\bPresident\b",
        r"\bManaging Director\b",
    ],
    "svp": [
        r"\bSVP\b",
        r"\bSenior Vice President\b",
        r"\bEVP\b",
        r"\bExecutive Vice President\b",
    ],
    "vp": [
        r"\bVP\b",
        r"\bVice President\b",
        r"\bHead of\b",
        r"\bVice\b.*\bPresident\b",
    ],
    "director": [
        r"\bDirector\b",
        r"\bDir\b",
    ],
    "sr_manager": [
        r"\bSenior Manager\b",
        r"\bSr\.?\s*Manager\b",
        r"\bLead\b.*\bManager\b",
    ],
    "manager": [
        r"\bManager\b",
        r"\bMgr\b",
    ],
    "team_lead": [
        r"\bTeam Lead\b",
        r"\bStaff\b",
        r"\bPrincipal\b",
        r"\bLead\b(?!.*Manager)",
    ],
    "sr_ic": [
        r"\bSenior\b",
        r"\bSr\.?\b",
    ],
    "ic": [
        r"\bAnalyst\b",
        r"\bSpecialist\b",
        r"\bCoordinator\b",
        r"\bAssociate\b",
        r"\bEngineer\b(?!.*Senior)",
        r"\bSDR\b",
        r"\bBDR\b",
        r"\bAE\b",
    ],
}

DEPARTMENT_PATTERNS = {
    "revenue": [r"\bSales\b", r"\bRevenue\b", r"\bSDR\b", r"\bBDR\b", r"\bAccount\b", r"\bAE\b", r"\bCRO\b"],
    "marketing": [r"\bMarketing\b", r"\bDemand\b", r"\bGrowth\b", r"\bContent\b", r"\bABM\b", r"\bCMO\b", r"\bBrand\b"],
    "engineering": [r"\bEngineering\b", r"\bDev\b", r"\bCTO\b", r"\bSoftware\b", r"\bFrontend\b", r"\bBackend\b", r"\bDevOps\b", r"\bPlatform\b"],
    "product": [r"\bProduct\b", r"\bCPO\b", r"\bDesign\b"],
    "finance": [r"\bFinance\b", r"\bCFO\b", r"\bAccounting\b", r"\bFP&A\b", r"\bProcurement\b", r"\bTreasury\b"],
    "it": [r"\bIT\b", r"\bCIO\b", r"\bCISO\b", r"\bSecurity\b", r"\bInfrastructure\b", r"\bData\b"],
    "operations": [r"\bOperations\b", r"\bOps\b", r"\bBizOps\b", r"\bRevOps\b", r"\bCustomer Success\b"],
    "people": [r"\bHR\b", r"\bPeople\b", r"\bTalent\b", r"\bRecruiting\b", r"\bCHRO\b", r"\bL&D\b"],
    "legal": [r"\bLegal\b", r"\bCompliance\b", r"\bPrivacy\b", r"\bCLO\b", r"\bGeneral Counsel\b"],
    "executive": [r"\bCEO\b", r"\bCOO\b", r"\bPresident\b", r"\bChief of Staff\b", r"\bStrategy\b"],
}
```

### 7.5 Reporting Structure Inference

When `reporting_to` is not explicitly available, infer from:

1. **LinkedIn "Reports To" field** — Direct data, 40% coverage for senior contacts
2. **Org chart inference from titles** — If VP Sales exists at a 200-person company, likely reports to CRO or CEO
3. **Department head inference** — The most senior person in a department code is the likely reporting terminus
4. **Company size heuristics**:

| Company Size | Typical Layers | VP Reports To | Director Reports To |
|---|---|---|---|
| < 50 | 2-3 | CEO/Founder | VP or CEO |
| 50-200 | 3-4 | CRO/COO/CEO | VP |
| 200-1000 | 4-5 | C-Suite | SVP/VP |
| 1000-5000 | 5-6 | C-Suite | SVP/VP |
| 5000+ | 6+ | C-Suite | SVP/VP → EVP |

## 8. Data Quality Scoring

Every enriched record receives a composite data quality score. This score determines how much trust agents should place in the data and whether additional enrichment is needed.

### 8.1 Quality Score Components

| Component | Weight | Scoring Criteria | Max Score |
|---|---|---|---|
| Completeness | 35% | Percentage of required attributes populated | 35 |
| Accuracy | 25% | Cross-source agreement rate for key fields | 25 |
| Freshness | 20% | Weighted age of attributes vs. freshness guidelines | 20 |
| Source Reliability | 10% | Average reliability of contributing sources | 10 |
| Verification | 10% | Percentage of fields with verified status | 10 |

### 8.2 Completeness Scoring

```python
def calculate_completeness(record: dict) -> float:
    """Calculate record completeness score (0-100)."""
    required_fields = [
        "company_name", "website_domain", "employee_count",
        "revenue_usd", "industry", "ownership_type",
        "headquarters_country"
    ]
    high_value_fields = [
        "funding_stage", "tech_stack", "crm_system",
        "marketing_automation", "sales_engagement"
    ]
    
    required_filled = sum(1 for f in required_fields if record.get(f) is not None)
    required_score = (required_filled / len(required_fields)) * 70
    
    hv_filled = sum(1 for f in high_value_fields if record.get(f) is not None)
    hv_score = (hv_filled / len(high_value_fields)) * 30
    
    return round(required_score + hv_score, 1)
```

### 8.3 Freshness Guidelines by Attribute Category

| Category | Max Acceptable Age | Stale Threshold | Critical Refresh | Auto-Refresh Priority |
|---|---|---|---|---|
| Company name, website | 365 days | 180 days | Never (stable) | Low |
| Employee count | 90 days | 60 days | 30 days | Medium |
| Revenue | 365 days | 180 days | 90 days | Medium |
| Funding stage | 30 days | 14 days | 7 days | Critical |
| Tech stack | 30 days | 14 days | 7 days | High |
| Intent signals | 7 days | 3 days | 1 day | Critical |
| Contact title | 90 days | 60 days | 30 days | Medium |
| Contact email | 30 days | 14 days | 7 days | High |
| Seniority/department | 90 days | 60 days | 30 days | Medium |
| Psychographic | 180 days | 90 days | 60 days | Low |

### 8.4 Quality Score Action Matrix

| Score Range | Grade | Action | Enrichment Budget |
|---|---|---|---|
| 90-100 | A+ | Use for high-priority outreach | Maintenance only |
| 80-89 | A | Use for standard outreach | Selective refresh |
| 70-79 | B+ | Usable; flag for enrichment | Moderate enrichment |
| 60-69 | B | Usable with caution; prioritize enrichment | Significant enrichment |
| 50-59 | C | Limited use; must enrich before outreach | Aggressive enrichment |
| 40-49 | D | Not recommended for outreach | Full enrichment required |
| < 40 | F | Data unreliable; do not use | Re-enrich from scratch |

## 9. Attribute Enrichment Workflow

### 9.1 Enrichment Priority Order

When enriching a record from scratch, follow this priority order:

```
Phase 1 (Identity & Firmographic — P0):
  company_name → website_domain → employee_count → revenue_usd →
  industry → ownership_type → headquarters → funding_stage

Phase 2 (Contact-Level — P0-P1):
  first_name → last_name → email → title → seniority_level →
  department → linkedin_url → phone

Phase 3 (Technographic — P1):
  cloud_provider → crm_system → marketing_automation →
  sales_engagement → analytics_tools → tech_stack

Phase 4 (Intent — Critical):
  intent_signals → trigger_events → dark_funnel_signals

Phase 5 (Psychographic — P2):
  decision_making_style → buying_persona → content_preferences
```

### 9.2 Enrichment Source Selection Logic

```python
def select_source(attribute: str, record: dict, budget: float) -> str:
    """Select the best source for a given attribute based on cost, coverage, and freshness."""
    source_rankings = {
        "company_name": ["opencorporates", "linkedin", "zoominfo"],
        "employee_count": ["linkedin", "zoominfo", "apollo"],
        "revenue_usd": ["sec_edgar", "zoominfo", "crunchbase", "apollo"],
        "funding_stage": ["crunchbase", "pitchbook", "linkedin"],
        "tech_stack": ["publicwww", "wappalyzer", "builtwith"],
        "crm_system": ["job_postings", "publicwww", "g2"],
        "email": ["apollo", "zoominfo", "hunter", "snov"],
        "intent_signals": ["bombora", "zoominfo_intent", "6sense", "first_party"],
    }
    
    # Prefer free sources when budget is constrained
    free_sources = ["opencorporates", "sec_edgar", "publicwww"]
    
    ranked = source_rankings.get(attribute, [])
    if budget < 0.05 and any(s in free_sources for s in ranked):
        return next(s for s in ranked if s in free_sources)
    
    return ranked[0] if ranked else "unknown"
```

## 10. Compliance and Data Governance

### 10.1 Data Processing Categories

| Attribute Category | GDPR Basis | CCPA Applicability | Retention Period | Right to Erasure |
|---|---|---|---|---|
| Firmographic (company) | Legitimate Interest | Low (business data) | 36 months | N/A (corporate data) |
| Technographic | Legitimate Interest | Low (inferred data) | 12 months | N/A (inferred) |
| Intent signals | Legitimate Interest | Medium (behavioral) | 6 months | Yes |
| Contact-level (business) | Legitimate Interest | Medium (PII) | 24 months | Yes |
| Contact-level (personal) | Consent or Legitimate Interest | High (PII) | 12 months | Yes |
| Psychographic | Consent required | High (profiling) | 6 months | Yes |

### 10.2 Data Minimization Rules

- Only collect attributes necessary for the declared processing purpose
- Do not enrich personal attributes (home address, personal phone, personal email) unless explicitly required
- Intent signal data must be aggregated at account level where possible; contact-level intent requires consent
- Psychographic profiling must be disclosed to data subjects under GDPR Art. 22
- All enrichment activities must be logged with source, timestamp, and purpose

## 11. Schema Validation Example

Agents should validate enriched records against this schema before storage:

```json
{
  "$schema": "https://leadreach.ai/schemas/contact-enrichment-v2.json",
  "type": "object",
  "required": ["company_name", "website_domain", "employee_count", "industry", "ownership_type"],
  "properties": {
    "company_name": {"type": "string", "minLength": 2, "maxLength": 200},
    "website_domain": {"type": "string", "format": "hostname"},
    "employee_count": {"type": "integer", "minimum": 1},
    "employee_count_range": {"type": "string", "enum": ["micro", "small", "sme", "mid_market", "mid_enterprise", "large_enterprise", "global_enterprise"]},
    "revenue_usd": {"type": "integer", "minimum": 0},
    "revenue_range_usd": {"type": "string", "enum": ["pre_revenue", "micro_revenue", "small_revenue", "mid_revenue", "large_revenue", "xl_revenue", "xxl_revenue"]},
    "industry": {"type": "string", "minLength": 2},
    "funding_stage": {"type": "string", "enum": ["Pre-seed", "Seed", "Series A", "Series B", "Series C", "Series D", "Series E", "Series F", "Series G", "Series H", "Late Stage", "IPO"]},
    "ownership_type": {"type": "string", "enum": ["private", "public", "nonprofit", "government", "subsidiary"]},
    "tech_stack": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["category", "product", "source", "detected_at", "confidence"],
        "properties": {
          "category": {"type": "string"},
          "product": {"type": "string"},
          "source": {"type": "string"},
          "detected_at": {"type": "string", "format": "date"},
          "confidence": {"type": "number", "minimum": 0, "maximum": 1}
        }
      }
    }
  }
}
```

## 12. Change Log

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-07-08 | 2.0 | Full rewrite with expanded technographic, psychographic, and intent sections | LeadReach Knowledge Engineering |
| 2026-06-15 | 1.1 | Added intent signal decay rates and correlation framework | LeadReach Knowledge Engineering |
| 2026-05-01 | 1.0 | Initial version | LeadReach Knowledge Engineering |
