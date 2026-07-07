---
title: "API Reference — LeadReach REST API v1 Specification"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - api
  - rest
  - reference
  - authentication
  - pagination
  - rate-limits
  - openapi
  - sdk
  - integration
---

# API Reference — LeadReach REST API v1

## Overview

The LeadReach REST API v1 provides programmatic access to every resource in the LeadReach B2B lead intelligence platform. From managing leads and campaigns to configuring integrations and retrieving analytics, the API enables developers to build custom applications, automate workflows, and extend LeadReach's capabilities beyond the web UI. The API follows RESTful conventions, uses JSON for request and response payloads, and implements industry-standard patterns for authentication, pagination, error handling, and rate limiting.

This reference document covers the core API concepts, authentication mechanisms, common request/response patterns, and detailed specifications for the most critical endpoints. It is designed for developers integrating LeadReach into custom CRMs, data pipelines, internal tools, and third-party automation platforms. For provider-specific integration details (Salesforce, Outreach, Calendly, etc.), refer to the dedicated integration guides.

The API is versioned using URL path versioning (`/v1/`). Breaking changes will result in a new major version (`/v2/`) with a minimum 12-month deprecation period for the previous version. Non-breaking changes (new fields, new endpoints, new optional parameters) may be introduced at any time. Clients should tolerate unknown fields in responses (forward-compatible parsing). The current API version is `2026-07-01`, referenced via the `LeadReach-Version` header.

## Architecture & Data Flow

### API Gateway Architecture

```
┌───────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Client App    │────▶│  API Gateway     │────▶│  Service Mesh    │
│  (SDK/curl/UI) │     │  (Auth, Rate     │     │  (Lead, Campaign,│
│                │     │   Limit, Route)  │     │   Integration...)│
└───────────────┘     └──────────────────┘     └──────────────────┘
       │                      │                         │
       │                      ▼                         ▼
       │              ┌──────────────────┐     ┌──────────────────┐
       │              │  Auth Service    │     │  Agent Core      │
       │              │  (OAuth 2.0 +   │     │  (Atlas, Scout,  │
       │              │   API Keys)      │     │   Sage, Forge...) │
       │              └──────────────────┘     └──────────────────┘
       │                                               │
       ▼                                               ▼
┌───────────────┐                             ┌──────────────────┐
│  Developer    │                             │  Event Bus       │
│  Dashboard    │                             │  (Webhook Trigger│
│  (API Keys,   │                             │   + Agent Signal)│
│   Logs, Usage)│                             └──────────────────┘
└───────────────┘
```

### Base URLs

| Environment | Base URL                                      |
|-------------|-----------------------------------------------|
| Production  | `https://api.leadreach.io/v1`                 |
| Staging     | `https://api.staging.leadreach.io/v1`         |
| Development | `https://api.dev.leadreach.io/v1`             |

### Common Headers

| Header                | Required | Description                                              |
|-----------------------|----------|----------------------------------------------------------|
| `Authorization`      | Yes      | `Bearer {api_key}` or `Bearer {oauth_access_token}`     |
| `Content-Type`       | Yes*     | `application/json` for request bodies                    |
| `LeadReach-Version`  | No       | API version date (default: current). E.g., `2026-07-01`  |
| `Idempotency-Key`    | No       | Client-generated key for idempotent write operations     |
| `X-Request-ID`       | No       | Client-generated request ID for tracing (auto-generated if omitted) |

*Required for `POST`, `PUT`, and `PATCH` requests.

## Configuration Guide

### Creating API Credentials

1. **Navigate to Settings → API → API Keys**
2. **Click "Generate New Key"**
3. **Configure the key**:

```json
{
  "name": "Production Data Pipeline",
  "description": "Used by internal ETL pipeline to sync lead data to data warehouse",
  "scopes": [
    "leads:read",
    "leads:write",
    "campaigns:read",
    "analytics:read",
    "integrations:read"
  ],
  "expires_at": "2027-07-03T00:00:00Z",
  "ip_allowlist": [
    "10.0.0.0/8",
    "203.0.113.0/24"
  ],
  "rate_limit_override": {
    "requests_per_minute": 300,
    "requests_per_hour": 10000
  }
}
```

4. **Store the key securely** — it is displayed only once at creation.

### Available Scopes

| Scope                  | Description                                      |
|------------------------|--------------------------------------------------|
| `leads:read`           | Read lead records and scores                     |
| `leads:write`          | Create and update leads                          |
| `leads:delete`         | Delete leads (use with caution)                  |
| `campaigns:read`       | Read campaign configurations and status          |
| `campaigns:write`      | Create and modify campaigns                      |
| `sequences:read`       | Read email sequence configurations               |
| `sequences:write`      | Modify sequences and enrollment                  |
| `analytics:read`       | Read engagement and pipeline analytics           |
| `integrations:read`    | Read integration configurations and health       |
| `integrations:write`   | Create and modify integrations                   |
| `webhooks:read`        | Read webhook subscriptions and delivery logs     |
| `webhooks:write`       | Create and modify webhook subscriptions          |
| `enrichment:read`      | Read enrichment data                             |
| `enrichment:write`     | Trigger enrichment operations                    |
| `admin`                | Full administrative access (all scopes)          |

### SDK Installation

LeadReach provides official SDKs for Python, Node.js, and Go:

```bash
# Python
pip install leadreach-sdk

# Node.js
npm install @leadreach/sdk

# Go
go get github.com/leadreach/sdk-go
```

**Python SDK Quick Start:**

```python
from leadreach import LeadReachClient

client = LeadReachClient(api_key="lr_live_abc123...")

# List leads
leads = client.leads.list(
    filters={"fit_grade": "A", "intent_score_min": 70},
    page_size=50
)

# Enrich a lead
enrichment = client.enrichment.enrich(
    lead_id="lead_abc123",
    providers=["zoominfo", "clearbit"],
    data_types=["firmographic", "technographic"]
)

# Create a webhook subscription
subscription = client.webhooks.create(
    name="Slack - Hot Leads",
    endpoint_url="https://hooks.slack.com/services/...",
    event_types=["lead.score_changed"],
    filters={"intent_score_min": 80}
)
```

## API Endpoints & Payloads

### Leads

#### List Leads

```
GET /v1/leads
```

**Query Parameters:**

| Parameter            | Type    | Description                                   |
|----------------------|---------|-----------------------------------------------|
| `page_size`          | integer | Results per page (1-100, default: 25)         |
| `cursor`             | string  | Pagination cursor from previous response      |
| `fit_grade`          | string  | Filter by fit grade (A, B, C, D)              |
| `intent_score_min`   | integer | Minimum intent score (0-100)                  |
| `intent_score_max`   | integer | Maximum intent score (0-100)                  |
| `status`             | string  | Lead status (new, contacted, qualified, etc.) |
| `campaign_id`        | string  | Filter by campaign ID                          |
| `created_after`      | string  | ISO 8601 datetime                              |
| `created_before`     | string  | ISO 8601 datetime                              |
| `sort_by`            | string  | Sort field (created_at, intent_score, updated_at) |
| `sort_order`         | string  | Sort direction (asc, desc)                     |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "lead_abc123",
      "email": "j.doe@targetcompany.com",
      "first_name": "John",
      "last_name": "Doe",
      "title": "VP of Sales",
      "company": "Target Company Inc.",
      "company_domain": "targetcompany.com",
      "phone": "+1-555-0123",
      "status": "qualified",
      "fit_grade": "A",
      "fit_score": 92,
      "intent_score": 87,
      "composite_score": 89,
      "source": "zoominfo_search",
      "campaign_ids": ["camp_a1b2c3"],
      "owner_id": "user_sarah_j",
      "enrichment_status": "complete",
      "last_engaged_at": "2026-07-03T14:35:00Z",
      "tags": ["saas", "enterprise", "crm-buyer"],
      "custom_fields": {
        "territory": "WEST",
        "annual_revenue": 45000000
      },
      "created_at": "2026-06-15T10:00:00Z",
      "updated_at": "2026-07-03T15:10:00Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6ImxlYWRfZGVmNDU2IiwidXBkYXRlZF9hdCI6IjIwMjYtMDctMDNUMTU6MTA6MDAifQ==",
    "has_more": true,
    "total_count": 1543
  }
}
```

#### Create Lead

```
POST /v1/leads
```

**Request:**

```json
{
  "email": "j.doe@targetcompany.com",
  "first_name": "John",
  "last_name": "Doe",
  "title": "VP of Sales",
  "company": "Target Company Inc.",
  "company_domain": "targetcompany.com",
  "phone": "+1-555-0123",
  "source": "web_form",
  "tags": ["saas", "enterprise"],
  "custom_fields": {
    "territory": "WEST"
  },
  "auto_enrich": true,
  "auto_score": true,
  "campaign_ids": ["camp_a1b2c3"]
}
```

**Response (201 Created):**

```json
{
  "id": "lead_abc123",
  "email": "j.doe@targetcompany.com",
  "status": "new",
  "fit_grade": null,
  "fit_score": null,
  "intent_score": null,
  "composite_score": null,
  "enrichment_status": "pending",
  "scoring_status": "pending",
  "created_at": "2026-07-03T16:00:00Z",
  "updated_at": "2026-07-03T16:00:00Z",
  "_links": {
    "self": "/v1/leads/lead_abc123",
    "enrich": "/v1/integrations/data/enrich",
    "campaigns": "/v1/leads/lead_abc123/campaigns"
  }
}
```

#### Get Lead

```
GET /v1/leads/{lead_id}
```

**Response (200 OK):**

```json
{
  "id": "lead_abc123",
  "email": "j.doe@targetcompany.com",
  "first_name": "John",
  "last_name": "Doe",
  "title": "VP of Sales",
  "seniority": "vp",
  "department": "sales",
  "company": "Target Company Inc.",
  "company_domain": "targetcompany.com",
  "industry": "Software",
  "sub_industry": "SaaS",
  "employees": 850,
  "revenue": 45000000,
  "phone": "+1-555-0123",
  "linkedin_url": "https://linkedin.com/in/johndoetarget",
  "location": "San Francisco, CA",
  "status": "qualified",
  "fit_grade": "A",
  "fit_score": 92,
  "intent_score": 87,
  "composite_score": 89,
  "technologies": ["Salesforce", "HubSpot", "AWS"],
  "intent_signals": [
    { "category": "CRM Software", "intensity": 85, "trending": "up" }
  ],
  "source": "web_form",
  "campaign_ids": ["camp_a1b2c3"],
  "owner_id": "user_sarah_j",
  "enrichment_status": "complete",
  "engagement_summary": {
    "emails_sent": 3,
    "emails_opened": 2,
    "emails_clicked": 1,
    "emails_replied": 0,
    "meetings_booked": 1,
    "last_engaged_at": "2026-07-03T14:35:00Z"
  },
  "tags": ["saas", "enterprise", "crm-buyer"],
  "custom_fields": {
    "territory": "WEST",
    "annual_revenue": 45000000
  },
  "created_at": "2026-06-15T10:00:00Z",
  "updated_at": "2026-07-03T15:10:00Z"
}
```

#### Update Lead

```
PATCH /v1/leads/{lead_id}
```

**Request:**

```json
{
  "status": "contacted",
  "tags": ["saas", "enterprise", "crm-buyer", "high-priority"],
  "custom_fields": {
    "territory": "WEST",
    "next_follow_up": "2026-07-05T10:00:00Z"
  }
}
```

**Response (200 OK):** Returns the full updated lead object.

#### Delete Lead

```
DELETE /v1/leads/{lead_id}
```

**Response (204 No Content):** Empty body on success.

### Campaigns

#### List Campaigns

```
GET /v1/campaigns?page_size=25&status=active
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "camp_a1b2c3",
      "name": "Q3 SaaS Enterprise Outreach",
      "status": "active",
      "type": "outbound",
      "target_persona": "VP of Sales",
      "lead_count": 4521,
      "sequence_id": "seq_outreach_12345",
      "created_at": "2026-06-01T09:00:00Z",
      "updated_at": "2026-07-03T14:00:00Z"
    }
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

#### Create Campaign

```
POST /v1/campaigns
```

**Request:**

```json
{
  "name": "Q4 Fintech CRO Campaign",
  "type": "outbound",
  "target_persona": "CRO",
  "icp_criteria": {
    "industries": ["Financial Services", "FinTech"],
    "employee_range": {"min": 200, "max": 5000},
    "geographies": ["US", "GB"],
    "technologies": ["Salesforce", "HubSpot"]
  },
  "sequence_config": {
    "provider": "outreach",
    "sequence_name": "Q4 FinTech CRO Sequence",
    "steps": 5,
    "total_duration_days": 14
  },
  "sender_mailboxes": ["mbx_sarah_johnson", "mbx_mike_chen"],
  "daily_send_limit_per_mailbox": 150,
  "auto_enrich_leads": true,
  "auto_score_leads": true
}
```

**Response (201 Created):**

```json
{
  "id": "camp_d4e5f6",
  "name": "Q4 Fintech CRO Campaign",
  "status": "draft",
  "type": "outbound",
  "lead_count": 0,
  "created_at": "2026-07-03T16:30:00Z"
}
```

### Analytics

#### Get Pipeline Analytics

```
GET /v1/analytics/pipeline?start_date=2026-06-01&end_date=2026-07-03&group_by=week
```

**Response (200 OK):**

```json
{
  "period": { "start": "2026-06-01", "end": "2026-07-03" },
  "summary": {
    "total_leads": 12543,
    "new_leads": 3210,
    "qualified_leads": 1876,
    "meetings_booked": 342,
    "pipeline_value": 45200000,
    "avg_lead_to_meeting_days": 8.3,
    "avg_meeting_to_close_days": 34.2
  },
  "by_period": [
    {
      "period_start": "2026-06-02",
      "new_leads": 812,
      "qualified_leads": 456,
      "meetings_booked": 87,
      "pipeline_value": 11400000
    },
    {
      "period_start": "2026-06-09",
      "new_leads": 798,
      "qualified_leads": 478,
      "meetings_booked": 91,
      "pipeline_value": 12100000
    }
  ],
  "by_source": [
    { "source": "zoominfo_search", "count": 4100, "qualified_pct": 38 },
    { "source": "web_form", "count": 2800, "qualified_pct": 52 },
    { "source": "apollo_search", "count": 3500, "qualified_pct": 35 },
    { "source": "referral", "count": 1200, "qualified_pct": 61 }
  ]
}
```

#### Get Agent Performance

```
GET /v1/analytics/agents?period=30d
```

**Response (200 OK):**

```json
{
  "period": "30d",
  "agents": [
    {
      "agent_id": "sage",
      "name": "Sage",
      "metrics": {
        "leads_scored": 8432,
        "avg_scoring_latency_ms": 120,
        "score_adjustments_made": 3421,
        "high_confidence_pct": 78
      }
    },
    {
      "agent_id": "forge",
      "name": "Forge",
      "metrics": {
        "emails_sent": 12340,
        "sequences_managed": 15,
        "avg_step_interval_hours": 22
      }
    },
    {
      "agent_id": "scout",
      "name": "Scout",
      "metrics": {
        "prospects_discovered": 5621,
        "duplicate_filtered": 1340,
        "icp_match_pct": 64
      }
    }
  ]
}
```

### Bulk Operations

#### Bulk Lead Import

```
POST /v1/leads/bulk
```

**Request:**

```json
{
  "operation": "upsert",
  "dedup_key": "email",
  "on_conflict": "merge",
  "auto_enrich": false,
  "auto_score": true,
  "leads": [
    {
      "email": "person1@company1.com",
      "first_name": "Alice",
      "last_name": "Williams",
      "company": "Company One"
    },
    {
      "email": "person2@company2.com",
      "first_name": "Bob",
      "last_name": "Brown",
      "company": "Company Two"
    }
  ]
}
```

**Response (202 Accepted):**

```json
{
  "bulk_job_id": "bulk_g7h8i9j0",
  "status": "processing",
  "total_records": 2,
  "status_url": "/v1/leads/bulk/bulk_g7h8i9j0"
}
```

## Authentication & Security

### API Key Authentication

Primary authentication method for server-to-server integrations:

```
Authorization: Bearer lr_live_abc123def456...
```

API keys are prefixed with `lr_live_` (production) or `lr_test_` (staging). Keys are scoped to specific permissions and can be restricted by IP range.

### OAuth 2.0 Authentication

For user-facing applications, LeadReach supports OAuth 2.0 Authorization Code flow:

1. **Register your application** at Settings → API → OAuth Applications
2. **Redirect user** to `https://auth.leadreach.io/oauth/authorize?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&scope={scopes}&state={state}`
3. **Exchange authorization code** for tokens: `POST https://auth.leadreach.io/oauth/token`
4. **Access tokens** expire after 1 hour. **Refresh tokens** are long-lived.

### Security Best Practices

- **Never expose API keys in client-side code** (JavaScript, mobile apps). Use server-side proxies.
- **Rotate keys regularly** — set `expires_at` to a maximum of 1 year. Rotate every 90 days for production keys.
- **Use the minimum required scopes** — avoid `admin` scope for application-specific keys.
- **Enable IP allowlisting** for production API keys to restrict access to known IP ranges.
- **Verify webhook signatures** before processing payloads (see [Webhook Integration](./webhook-automation-integration.md)).

## Error Handling & Retry Logic

### Standard Error Response

All errors follow a consistent schema:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request body contains invalid fields",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "not-an-email"
      }
    ],
    "request_id": "req_k1l2m3n4o5",
    "documentation_url": "https://docs.leadreach.io/api/errors/VALIDATION_ERROR"
  }
}
```

### Error Codes by HTTP Status

| HTTP Status | Error Code                    | Description                                |
|-------------|-------------------------------|--------------------------------------------|
| 400         | `VALIDATION_ERROR`            | Request body or parameters invalid         |
| 400         | `INVALID_CURSOR`              | Pagination cursor is malformed or expired  |
| 401         | `AUTHENTICATION_FAILED`       | Invalid or missing credentials             |
| 401         | `TOKEN_EXPIRED`               | OAuth token has expired                    |
| 403         | `PERMISSION_DENIED`           | Insufficient scope for the requested action|
| 404         | `NOT_FOUND`                   | Resource does not exist                    |
| 409         | `CONFLICT`                    | Duplicate resource or version conflict     |
| 422         | `UNPROCESSABLE_ENTITY`        | Semantic validation failed                 |
| 429         | `RATE_LIMITED`                | Request rate exceeds allowed limits        |
| 500         | `INTERNAL_ERROR`              | Unexpected server error                    |
| 503         | `SERVICE_UNAVAILABLE`         | Temporary service degradation              |

### Rate Limiting

LeadReach enforces rate limits per API key:

| Tier      | Requests/Minute | Requests/Hour | Burst Capacity |
|-----------|:--------------:|:------------:|:--------------:|
| Standard  | 100            | 5,000        | 20             |
| Pro       | 300            | 15,000       | 50             |
| Enterprise| 1,000          | 50,000       | 100            |

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1625328600
Retry-After: 45          (only present when rate limited)
```

When rate limited (HTTP 429), clients should implement exponential backoff:

```
Base delay: Use Retry-After header value (seconds)
If no Retry-After: Base delay = 1 second
Multiplier: 2
Max delay: 60 seconds
Max retries: 5
```

### Idempotency

All `POST` endpoints support idempotency via the `Idempotency-Key` header:

```
POST /v1/leads
Idempotency-Key: lead_import_20260703_jdoe_001
```

- Idempotency keys are stored for 48 hours.
- Duplicate requests with the same key return the original response (including the original status code).
- Keys must be unique per API key; different API keys can use the same key without conflict.

## Pagination

### Cursor-Based Pagination

All list endpoints use cursor-based pagination:

```
GET /v1/leads?page_size=25&cursor=eyJpZCI6ImxlYWRfZGVmNDU2In0=
```

- `page_size`: Number of results per page (1-100, default: 25)
- `cursor`: Opaque string from the previous response's `pagination.next_cursor`
- Cursors are stable for 24 hours; after that, a new cursor must be obtained by making a fresh request without a cursor

**Paginated Response:**

```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6ImxlYWRfZ2hpNzg5In0=",
    "has_more": true,
    "total_count": 1543
  }
}
```

When `has_more` is `false`, `next_cursor` will be `null`.

### Iteration Pattern

```python
cursor = None
all_leads = []

while True:
    response = client.leads.list(page_size=100, cursor=cursor)
    all_leads.extend(response.data)
    
    if not response.pagination.has_more:
        break
    cursor = response.pagination.next_cursor
```

## LeadReach Agent Integration

All eight LeadReach agents interact with the API, either as producers (writing data) or consumers (reading data):

| Agent   | API Role                                                                                               |
|---------|--------------------------------------------------------------------------------------------------------|
| **Atlas** | Reads account data and writes account-level intelligence. Consumes `GET /v1/leads` for account aggregation. Publishes account scores via internal events (exposed as `fit_grade`, `intent_score` fields). |
| **Scout** | Writes new leads via `POST /v1/leads` (auto_discover mode). Reads campaign ICP criteria via `GET /v1/campaigns/{id}`. Triggers bulk imports via `POST /v1/leads/bulk`. |
| **Forge** | Reads campaign and sequence configurations. Writes engagement data. Manages sequence enrollment through the email integration API. |
| **Sage** | Reads lead data for scoring. Writes `fit_score`, `intent_score`, `composite_score` fields. Triggers enrichment via `POST /v1/integrations/data/enrich`. |
| **Judge** | Reads pipeline analytics via `GET /v1/analytics/pipeline`. Writes deal quality assessments as custom fields on leads and opportunities. |
| **Bard** | Reads lead context for personalization. Writes generated email content to template storage. No direct lead writes. |
| **Flow** | Reads and writes workflow configurations. Executes multi-step API calls as workflow actions. Monitors workflow execution status. |
| **Echo** | Reads and writes activity/engagement records. Synchronizes data between CRM and LeadReach via the integration API. Publishes engagement events. |

## Monitoring & Observability

### API Health

```
GET /v1/health
```

```json
{
  "status": "healthy",
  "version": "2026-07-01",
  "uptime_seconds": 864000,
  "dependencies": {
    "database": "healthy",
    "event_bus": "healthy",
    "agent_core": "healthy"
  }
}
```

### Key Metrics

| Metric                          | Type    | Alert Threshold                   |
|---------------------------------|---------|-----------------------------------|
| `api.request.latency.p50`       | Gauge   | > 200ms                           |
| `api.request.latency.p99`       | Gauge   | > 2000ms                          |
| `api.error.rate.5xx`            | Gauge   | > 1% over 5 minutes               |
| `api.rate_limit.rejected`       | Counter | > 100/hour                        |
| `api.request.throughput`        | Gauge   | Monitor for capacity planning     |

### Request Tracing

Every API response includes an `X-Request-ID` header. Use this ID to trace the request through LeadReach's logging system:

```
X-Request-ID: req_k1l2m3n4o5
```

Access request logs at **Settings → API → Request Logs**, or via the CLI:

```bash
leadreach api logs --request-id req_k1l2m3n4o5
```

## Troubleshooting

**Issue: Receiving 401 `AUTHENTICATION_FAILED`**

*Cause*: Invalid API key, expired OAuth token, or missing `Authorization` header. *Resolution*: Verify the API key is correct and has not been revoked. For OAuth, refresh the access token. Ensure the `Authorization: Bearer {token}` header is included.

**Issue: Receiving 429 `RATE_LIMITED`**

*Cause*: Request rate exceeds the API key's tier limits. *Resolution*: Implement exponential backoff using the `Retry-After` header. Batch operations where possible. Upgrade API tier if sustained throughput is needed.

**Issue: Cursor pagination returning duplicate records**

*Cause*: Records were created or updated between paginated requests, shifting the cursor position. *Resolution*: Use `sort_by=created_at&sort_order=asc` for consistent pagination. Process duplicates client-side using `id` field deduplication.

**Issue: `Idempotency-Key` returning stale response**

*Cause*: Reusing an idempotency key from a previous request that is still within the 48-hour retention window. *Resolution*: Always generate a new, unique idempotency key for each logical operation. Use a UUID v4 or a deterministic key that includes a timestamp or sequence number.

**Issue: Bulk import job stuck in "processing"**

*Cause*: Large bulk jobs may take several minutes. Rarely, a job may stall due to downstream service issues. *Resolution*: Poll the status endpoint (`GET /v1/leads/bulk/{job_id}`) at 10-second intervals. If the job remains in "processing" for more than 30 minutes, contact support with the `bulk_job_id`.

## Cross-References

- [CRM Integration Guide](./crm-integration-guide.md) — CRM-specific API endpoints and patterns
- [Email Provider Integration](./email-provider-integration.md) — Email sending and engagement APIs
- [Calendar & Booking Integration](./calendar-booking-integration.md) — Booking link and routing APIs
- [Data Provider Integration](./data-provider-integration.md) — Enrichment and search APIs
- [Webhook & Automation Integration](./webhook-automation-integration.md) — Webhook subscription and event delivery APIs
- [API Changelog](../developer/api-changelog.md) — Version history and deprecation notices
- [SDK Documentation](../developer/sdk-documentation.md) — Official SDK usage guides
- [OAuth Application Setup](../security/oauth-application-setup.md) — Registering and configuring OAuth applications
