---
title: "Data Provider Integration — ZoomInfo, Apollo, Clearbit & Enrichment Sources"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - data-provider
  - zoominfo
  - apollo
  - clearbit
  - enrichment
  - intent-data
  - technographics
  - scout
  - sage
  - atlas
  - integration
  - oauth2
---

# Data Provider Integration

## Overview

LeadReach's data provider integration connects your platform to the B2B intelligence ecosystem—ZoomInfo, Apollo, Clearbit, and other enrichment sources—that fuel lead discovery, firmographic enrichment, intent signal detection, and technographic profiling. These integrations transform raw contact data into actionable intelligence, enabling LeadReach agents to identify high-fit prospects, enrich incomplete records, detect buying signals, and prioritize accounts with the highest propensity to purchase.

The integration operates in two primary modes: **pull-based enrichment** (LeadReach queries provider APIs on demand to enrich a lead or account) and **push-based monitoring** (provider APIs stream intent signals, job changes, and firmographic updates to LeadReach via webhooks or scheduled polling). The pull mode is used by the Sage agent for real-time enrichment during lead processing, while the push mode powers Scout's prospect discovery and Atlas's account monitoring capabilities. Together, they ensure LeadReach never operates on stale or incomplete data.

Cost management is a critical design consideration. Data provider APIs are metered—ZoomInfo charges per credit, Apollo per export, and Clearbit per API call. LeadReach implements intelligent caching, request deduplication, and tiered enrichment strategies to maximize data coverage while minimizing API spend. For example, a lead's firmographic data is cached for 30 days, while intent signals are fetched in real-time (and cached for only 24 hours). Administrators can configure enrichment policies per data type, per provider, and per lead segment to balance freshness against cost.

## Architecture & Data Flow

### Enrichment Pipeline

```
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Lead Ingestion   │────▶│  Enrichment      │────▶│  Data Provider    │
│  (CRM, Upload,    │     │  Router          │     │  APIs             │
│   Web Form)       │     │  (Priority &     │     │  (ZoomInfo,       │
│                   │     │   Dedup)         │     │   Apollo, Clearbit│
└───────────────────┘     └──────────────────┘     └───────────────────┘
         │                         │                         │
         │                         ▼                         ▼
         │               ┌──────────────────┐     ┌───────────────────┐
         │               │  Cache Layer     │     │  Response         │
         │               │  (Redis + TTL)   │     │  Normalizer       │
         │               └──────────────────┘     └───────────────────┘
         │                         │                         │
         ▼                         ▼                         ▼
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Sage Agent       │     │  Merge &         │     │  Event Bus        │
│  (Scoring Update) │     │  Conflict Resolve│     │  (Agent Signals)  │
└───────────────────┘     └──────────────────┘     └───────────────────┘
```

### Enrichment Data Types by Provider

| Data Type           | ZoomInfo | Apollo | Clearbit | LeadReach Cache TTL |
|---------------------|:--------:|:------:|:--------:|:-------------------:|
| Contact (email, phone) | ✓    | ✓      | ✓        | 30 days             |
| Firmographic        | ✓        | ✓      | ✓        | 30 days             |
| Technographic       | ✓        | ✓      | ✓        | 14 days             |
| Intent Signals      | ✓        | ✗      | ✗        | 24 hours            |
| Job Change Alerts   | ✓        | ✓      | ✗        | 6 hours             |
| Company News        | ✗        | ✗      | ✓        | 12 hours            |
| Social Profiles     | ✗        | ✓      | ✓        | 30 days             |
| Revenue & Funding   | ✓        | ✓      | ✓        | 14 days             |
| Hierarchy & Org Chart | ✓      | ✓      | ✗        | 30 days             |

### Enrichment Priority Routing

When multiple providers offer the same data type, LeadReach routes requests based on a configurable priority order:

```json
{
  "enrichment_priority": {
    "contact": ["zoominfo", "apollo", "clearbit"],
    "firmographic": ["zoominfo", "clearbit", "apollo"],
    "technographic": ["clearbit", "zoominfo", "apollo"],
    "intent": ["zoominfo"],
    "job_change": ["zoominfo", "apollo"]
  },
  "fallback_policy": "next_provider",
  "max_providers_per_request": 2,
  "stop_on_first_match": true
}
```

## Configuration Guide

### ZoomInfo Integration

1. **Obtain API Credentials**: Contact your ZoomInfo account manager for API access. You'll receive a `client_id` and `client_secret` for the OAuth 2.0 Client Credentials flow, plus a credit allocation.

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Data Providers → Add Provider → ZoomInfo**
   - Enter `client_id`, `client_secret`, and your API base URL (typically `https://api.zoominfo.com`)
   - Click **Validate** to verify credentials and check remaining credits

3. **Configure enrichment policy**:
   ```json
   {
     "provider": "zoominfo",
     "enabled_data_types": ["contact", "firmographic", "technographic", "intent", "job_change"],
     "credit_budget": {
       "monthly_limit": 50000,
       "alert_threshold_pct": 80,
       "hard_stop_pct": 95
     },
     "enrich_on": {
       "lead_create": true,
       "lead_update": false,
       "manual_trigger": true,
       "scheduled": {
         "cron": "0 6 * * MON",
         "scope": "leads_modified_last_7_days"
       }
     },
     "intent_settings": {
       "categories": ["CRM Software", "Marketing Automation", "Data Analytics"],
       "lookback_days": 30,
       "min_intensity": 70
     }
   }
   ```

### Apollo Integration

1. **Generate API Key**: Log in to Apollo → Settings → API Keys → Generate New Key.
   - Note: Apollo's API uses bearer token authentication (no OAuth flow).

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Data Providers → Add Provider → Apollo**
   - Paste API key and select your Apollo organization
   - Click **Validate**

3. **Configure search and enrichment**:
   ```json
   {
     "provider": "apollo",
     "enabled_data_types": ["contact", "firmographic", "technographic", "social_profiles"],
     "search_defaults": {
       "person_titles": ["VP of Sales", "Head of Revenue", "CRO", "Director of Sales"],
       "organization_num_employees_ranges": [{"min": 50, "max": 500}, {"min": 500, "max": 5000}],
       "organization_locations": ["US", "CA", "GB"]
     },
     "rate_limit": {
       "requests_per_minute": 100,
       "requests_per_hour": 3000
     }
   }
   ```

### Clearbit Integration

1. **Get API Key**: Clearbit Dashboard → API Keys → Create Key.
   - Scopes: `enrichment:read`, `discovery:read`, `prospector:read`

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Data Providers → Add Provider → Clearbit**
   - Paste API key and click **Validate**

3. **Configure enrichment and monitoring**:
   ```json
   {
     "provider": "clearbit",
     "enabled_data_types": ["firmographic", "technographic", "company_news", "social_profiles", "revenue_funding"],
     "reveal_settings": {
       "enabled": true,
       "ip_to_company": true,
       "anonymous_visitors": true
     },
     "monitoring": {
       "company_watchlist": true,
       "watchlist_sync_cron": "0 8 * * MON-FRI",
       "events": ["funding_round", "leadership_change", "technology_change"]
     }
   }
   ```

## API Endpoints & Payloads

### Enrich a Lead

```
POST /v1/integrations/data/enrich
```

**Request:**

```json
{
  "lead_id": "lead_abc123",
  "providers": ["zoominfo", "clearbit"],
  "data_types": ["contact", "firmographic", "technographic"],
  "input": {
    "email": "j.doe@targetcompany.com",
    "company_domain": "targetcompany.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "options": {
    "refresh_cache": false,
    "stop_on_first_match": true,
    "save_to_lead": true,
    "idempotency_key": "enrich_lead_abc123_20260703"
  }
}
```

**Response (200 OK):**

```json
{
  "enrichment_id": "enr_q5r6s7t8",
  "lead_id": "lead_abc123",
  "status": "completed",
  "providers_queried": ["zoominfo", "clearbit"],
  "providers_matched": ["zoominfo", "clearbit"],
  "enriched_fields": {
    "email": "j.doe@targetcompany.com",
    "phone": "+1-555-0123",
    "title": "VP of Sales",
    "seniority": "vp",
    "department": "sales",
    "company_name": "Target Company Inc.",
    "company_domain": "targetcompany.com",
    "industry": "Software",
    "sub_industry": "SaaS",
    "employees": 850,
    "revenue": 45000000,
    "funding_stage": "Series C",
    "funding_total": 85000000,
    "technologies": ["Salesforce", "HubSpot", "AWS", "Snowflake", "Looker"],
    "location": "San Francisco, CA",
    "linkedin_url": "https://linkedin.com/in/johndoetarget",
    "intent_signals": [
      {
        "category": "CRM Software",
        "intensity": 85,
        "source": "zoominfo",
        "detected_at": "2026-06-28T00:00:00Z"
      }
    ]
  },
  "credits_used": {
    "zoominfo": 2,
    "clearbit": 1
  },
  "cached_fields_pct": 65,
  "completed_at": "2026-07-03T15:10:00Z"
}
```

### Search Prospects (Apollo)

```
POST /v1/integrations/data/search
```

**Request:**

```json
{
  "provider": "apollo",
  "search_type": "people",
  "criteria": {
    "person_titles": ["VP of Sales", "CRO"],
    "organization_num_employees_ranges": [{"min": 200, "max": 5000}],
    "organization_industries": ["Software", "Information Technology"],
    "organization_locations": ["US"],
    "q_keywords": "revenue operations"
  },
  "pagination": {
    "page": 1,
    "per_page": 25
  },
  "output_options": {
    "include_organization": true,
    "include_technologies": true,
    "exclude_existing_leads": true
  }
}
```

**Response (200 OK):**

```json
{
  "search_id": "srch_u9v0w1x2",
  "provider": "apollo",
  "results": [
    {
      "apollo_person_id": "pers_12345678",
      "first_name": "Sarah",
      "last_name": "Miller",
      "email": "s.miller@techcorp.com",
      "title": "VP of Sales",
      "company": "TechCorp",
      "employees": 1200,
      "industry": "Software",
      "technologies": ["Salesforce", "Outreach", "Gong"],
      "linkedin_url": "https://linkedin.com/in/sarahmiller",
      "relevance_score": 0.94
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 25,
    "total_results": 347,
    "total_pages": 14
  },
  "credits_used": 25
}
```

### Get Intent Signals (ZoomInfo)

```
GET /v1/integrations/data/intent?company_domain=targetcompany.com&categories=CRM+Software,Marketing+Automation&lookback_days=30
```

**Response (200 OK):**

```json
{
  "company_domain": "targetcompany.com",
  "company_name": "Target Company Inc.",
  "intent_signals": [
    {
      "category": "CRM Software",
      "intensity": 85,
      "percentile": 92,
      "trending": "up",
      "trend_change_pct": 15,
      "source": "zoominfo",
      "lookback_days": 30,
      "first_detected": "2026-05-15",
      "peak_intensity": 91,
      "peak_date": "2026-06-20"
    },
    {
      "category": "Marketing Automation",
      "intensity": 62,
      "percentile": 71,
      "trending": "stable",
      "trend_change_pct": 2,
      "source": "zoominfo",
      "lookback_days": 30,
      "first_detected": "2026-04-01",
      "peak_intensity": 68,
      "peak_date": "2026-05-12"
    }
  ],
  "related_companies": [
    { "domain": "competitor1.com", "shared_categories": 2 },
    { "domain": "competitor2.com", "shared_categories": 1 }
  ],
  "fetched_at": "2026-07-03T15:15:00Z",
  "cache_ttl_seconds": 86400
}
```

### Batch Enrich

```
POST /v1/integrations/data/enrich/batch
```

**Request:**

```json
{
  "batch_id": "batch_y3z4a5b6",
  "providers": ["zoominfo", "clearbit"],
  "data_types": ["firmographic", "technographic"],
  "leads": [
    { "lead_id": "lead_abc123", "email": "j.doe@targetcompany.com", "company_domain": "targetcompany.com" },
    { "lead_id": "lead_def456", "email": "a.smith@anotherco.io", "company_domain": "anotherco.io" },
    { "lead_id": "lead_ghi789", "email": "r.jones@bigcorp.com", "company_domain": "bigcorp.com" }
  ],
  "options": {
    "concurrency": 5,
    "stop_on_provider_error": false,
    "save_to_leads": true
  }
}
```

**Response (202 Accepted):**

```json
{
  "batch_id": "batch_y3z4a5b6",
  "status": "processing",
  "total_leads": 3,
  "estimated_duration_seconds": 15,
  "status_url": "/v1/integrations/data/enrich/batch/batch_y3z4a5b6"
}
```

### Check Batch Status

```
GET /v1/integrations/data/enrich/batch/{batch_id}
```

**Response (200 OK):**

```json
{
  "batch_id": "batch_y3z4a5b6",
  "status": "completed",
  "total_leads": 3,
  "enriched": 3,
  "partial": 0,
  "failed": 0,
  "credits_used": {
    "zoominfo": 6,
    "clearbit": 3
  },
  "started_at": "2026-07-03T15:20:00Z",
  "completed_at": "2026-07-03T15:20:12Z",
  "results_url": "/v1/integrations/data/enrich/batch/batch_y3z4a5b6/results"
}
```

## Authentication & Security

### ZoomInfo OAuth 2.0 (Client Credentials)

ZoomInfo uses the OAuth 2.0 Client Credentials grant for server-to-server communication:

```
POST https://api.zoominfo.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id={client_id}&client_secret={client_secret}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

LeadReach caches the access token and refreshes it 5 minutes before expiry. Tokens are encrypted at rest.

### Apollo & Clearbit Bearer Tokens

Both Apollo and Clearbit use static API keys passed as `Bearer` tokens in the `Authorization` header. Keys are:
- Encrypted at rest with AES-256-GCM
- Rotated every 90 days via automated rotation
- Never logged in application logs or exposed in API responses

### Data Privacy & Compliance

- **GDPR**: Data providers must be configured to exclude EU residents from enrichment unless explicit consent is documented. LeadReach applies geo-fencing rules before making enrichment requests.
- **CCPA**: California residents can opt out of data enrichment. LeadReach maintains an internal suppression list checked before every enrichment request.
- **Data Residency**: Enrichment data for EU leads is stored in EU-region infrastructure. Cross-region transfers use approved data processing agreements with each provider.
- **PII Minimization**: LeadReach only requests and stores the minimum PII fields required for sales operations. Excess fields from provider responses are discarded at the normalization layer.

## Error Handling & Retry Logic

### Error Codes

| Error Code                   | HTTP Status | Description                                      | Retryable |
|------------------------------|-------------|--------------------------------------------------|-----------|
| `PROVIDER_AUTH_FAILED`       | 401         | Invalid credentials or expired token              | Yes (auto)|
| `CREDIT_EXCEEDED`            | 402         | Provider credit allocation exhausted              | No        |
| `RATE_LIMITED`               | 429         | Provider API rate limit hit                       | Yes       |
| `NO_MATCH_FOUND`             | 404         | Provider has no data for the queried entity       | No        |
| `PARTIAL_ENRICHMENT`         | 207         | Some data types returned, others unavailable      | No        |
| `PROVIDER_TIMEOUT`           | 504         | Provider API did not respond within timeout       | Yes       |
| `INVALID_QUERY`              | 400         | Malformed search or enrichment request            | No        |
| `BUDGET_HARD_STOP`           | 429         | Monthly credit budget hard stop reached           | No        |
| `CONFLICT`                   | 409         | Concurrent enrichment for same lead               | Yes       |

### Retry Strategy

```
For retryable errors (RATE_LIMITED, PROVIDER_TIMEOUT, CONFLICT):
  Base delay: 2 seconds
  Multiplier: 2
  Max delay: 60 seconds
  Max retries: 5
  Jitter: ±25%

For credit-related errors (CREDIT_EXCEEDED):
  No retry — alert immediately
  Log credit exhaustion event
  Switch to next provider in priority list (if configured)

For budget hard stops (BUDGET_HARD_STOP):
  No retry — halt all enrichment for this provider
  Alert admin via PagerDuty
  Resume on 1st of next month or manual override
```

### Cache-Aside Pattern

Before making a provider API call, LeadReach checks the cache:

1. Generate cache key: `enrich:{provider}:{data_type}:{identifier_hash}`
2. If cache hit and not expired → return cached data (0 credits used)
3. If cache miss or expired → call provider API → store response with TTL → return data

Cache invalidation triggers:
- Manual refresh via API (`refresh_cache: true`)
- TTL expiration
- Webhook notification from provider (data updated)

## LeadReach Agent Integration

| Agent   | Data Provider Usage                                                                                    |
|---------|--------------------------------------------------------------------------------------------------------|
| **Scout** | Prospect discovery: queries Apollo and ZoomInfo search APIs to find net-new contacts matching ICP criteria. Filters results against existing CRM data to avoid duplicates. Exports prospect lists to LeadReach campaigns. |
| **Sage** | Lead enrichment & scoring: pulls firmographic, technographic, and intent data to compute composite lead scores. Enrichment happens at lead creation, before sequence enrollment, and on scheduled refreshes. Writes enrichment summary fields (`lr_fit_grade`, `lr_intent_score`, `lr_tech_stack`) back to CRM. |
| **Atlas** | Account intelligence: aggregates enrichment data across all contacts at an account. Monitors intent signal trends, detects technology changes (e.g., competitor CRM detected), and surfaces account-level buying signals. Triggers account-based plays when intent intensity exceeds thresholds. |
| **Forge** | Uses technographic data to personalize outreach content (e.g., "I see you're using Salesforce — here's how we integrate..."). References firmographic data for territory and industry-specific messaging. |
| **Flow** | Triggers enrichment on workflow events: "If lead status changes to MQL → enrich with ZoomInfo → if intent score > 70 → assign to SDR." Manages scheduled enrichment refreshes. |
| **Echo** | Syncs enrichment data to CRM custom fields and activity logs. Handles merge conflicts when multiple providers return conflicting data for the same field. |

Agents **Bard** and **Judge** do not directly interact with data provider APIs.

## Monitoring & Observability

### Key Metrics

| Metric                                  | Type    | Alert Threshold                        |
|-----------------------------------------|---------|----------------------------------------|
| `data.enrichment.success_rate`          | Gauge   | < 85% over 1-hour window               |
| `data.enrichment.latency.p99`           | Gauge   | > 5 seconds                            |
| `data.provider.api_errors`              | Counter | > 20 in 15 minutes                     |
| `data.credits.used_daily`               | Gauge   | > daily budget × 0.8                   |
| `data.credits.used_monthly`             | Gauge   | > monthly budget × 0.8                 |
| `data.cache.hit_rate`                   | Gauge   | < 50% (check TTL or key design)        |
| `data.search.results_per_query`         | Gauge   | < 5 (check criteria)                   |
| `data.enrichment.field_fill_rate`       | Gauge   | < 60% (provider data quality issue)    |

### Credit Burn Rate Dashboard

The **Data Provider Credits** dashboard tracks:
- Credits consumed per provider per day/week/month
- Projected monthly credit usage vs. budget
- Credit cost per enriched lead
- Enrichment success rate by provider and data type
- Cache hit rate by data type

### Health Check

```
GET /v1/integrations/data/health
```

```json
{
  "overall_status": "healthy",
  "providers": {
    "zoominfo": {
      "status": "healthy",
      "credits_remaining": 38500,
      "credits_total": 50000,
      "credits_used_pct": 23,
      "api_latency_ms": 420,
      "monthly_reset_date": "2026-08-01"
    },
    "apollo": {
      "status": "healthy",
      "rate_limit_remaining_pct": 78,
      "api_latency_ms": 310
    },
    "clearbit": {
      "status": "healthy",
      "api_latency_ms": 280
    }
  }
}
```

## Troubleshooting

**Issue: Enrichment returning empty results**

*Cause*: The queried entity doesn't exist in the provider's database, or the input data (email, domain) is incorrect. *Resolution*: Verify the input data. Try an alternate identifier (e.g., use LinkedIn URL instead of email). Check if the provider has coverage in the target geography. Switch to a secondary provider.

**Issue: ZoomInfo credits exhausted mid-month**

*Cause*: Unusually high enrichment volume or misconfigured batch jobs consuming excessive credits. *Resolution*: Review credit usage breakdown by data type in the dashboard. Enable `stop_on_first_match` to avoid querying multiple providers for the same data. Increase cache TTLs for stable data (firmographics from 30 to 60 days). Request a credit top-up from ZoomInfo.

**Issue: Apollo search returning irrelevant results**

*Cause*: Search criteria too broad or conflicting filters. *Resolution*: Narrow title keywords, reduce employee range, add industry filters. Use `q_keywords` for context-specific search. Review the `relevance_score` in results and set a minimum threshold.

**Issue: Clearbit webhook events not arriving**

*Cause*: Webhook not properly registered or Clearbit monitoring not enabled for the domain. *Resolution*: Verify webhook registration in Clearbit dashboard. Check that the domain is in the Clearbit watchlist. Test webhook delivery via `POST /v1/integrations/data/providers/clearbit/test-webhook`.

**Issue: Conflicting data between providers**

*Cause*: Different providers have different data collection methodologies and freshness. *Resolution*: Configure conflict resolution per field in the enrichment policy:

```json
{
  "conflict_resolution": {
    "employee_count": "max",        // Use the highest value
    "revenue": "zoominfo",          // Trust ZoomInfo for financial data
    "technologies": "union",        // Combine from all providers
    "industry": "clearbit"          // Trust Clearbit for classification
  }
}
```

## Cross-References

- [CRM Integration Guide](./crm-integration-guide.md) — Write enrichment data to CRM fields
- [Email Provider Integration](./email-provider-integration.md) — Use enriched data for email personalization
- [Webhook & Automation Integration](./webhook-automation-integration.md) — Trigger workflows on enrichment events
- [API Reference](./api-reference.md) — Full REST API specification for data provider endpoints
- [ICP Definition Guide](../data-governance/icp-definition-guide.md) — Define ICP criteria for prospect search
- [Lead Scoring Methodology](../intelligence/lead-scoring-methodology.md) — How enrichment data feeds scoring models
- [Data Privacy & Compliance](../security/data-privacy-compliance.md) — GDPR, CCPA, and data handling requirements
