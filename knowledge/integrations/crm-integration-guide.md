---
title: "CRM Integration Guide — Salesforce, HubSpot & Custom CRM Connections"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - crm
  - salesforce
  - hubspot
  - integration
  - oauth2
  - sync
  - bidirectional
  - atlas
  - sage
  - echo
---

# CRM Integration Guide

## Overview

LeadReach's CRM integration layer is the central nervous system of your B2B lead intelligence pipeline. It enables seamless, bidirectional synchronization of leads, contacts, accounts, opportunities, and activity data between LeadReach and your existing CRM systems—whether that's Salesforce, HubSpot, or a custom CRM accessed via REST API. By maintaining a single source of truth across platforms, your sales team never operates on stale data, and the LeadReach agent ecosystem always has the freshest context for scoring, enrichment, and outreach decisions.

This guide covers the architecture of CRM integrations within LeadReach, step-by-step configuration for the most common CRM providers, detailed API endpoint specifications with sample payloads, authentication flows, error handling strategies, and operational best practices. Whether you're connecting a production Salesforce org with 500 custom fields or onboarding a startup running HubSpot Starter, this document provides the implementation blueprint.

A well-configured CRM integration unlocks the full power of LeadReach's eight-agent architecture. Atlas uses CRM data to prioritize accounts; Sage enriches records with intelligence signals; Echo keeps activity timelines synchronized; and Flow automates handoffs between marketing and sales. Without a robust CRM connection, agents operate on partial data—reducing lead scores by up to 40% and delaying outreach cadences by hours. This guide ensures you extract maximum value from every sync cycle.

## Architecture & Data Flow

### High-Level Integration Topology

```
┌──────────────────┐     ┌──────────────────────┐     ┌──────────────────┐
│   LeadReach      │────▶│  Integration Engine   │◀────│   CRM Provider   │
│   Agent Core     │     │  (Sync Orchestrator)  │     │  (SFDC / HubSpot)│
└──────────────────┘     └──────────────────────┘     └──────────────────┘
         │                        │                           │
         │                        ▼                           │
         │              ┌──────────────────┐                  │
         │              │  Field Mapper    │                  │
         │              │  & Transformer   │                  │
         │              └──────────────────┘                  │
         │                        │                           │
         ▼                        ▼                           ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Event Bus       │     │  Conflict Store  │     │  Webhook         │
│  (Agent Signals) │     │  (Dedup & Merge) │     │  Receiver        │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Sync Modes

LeadReach supports three sync modes, selectable per CRM connection:

1. **Full Sync** — Initial load of all records matching configured filters. Runs once during onboarding. Paginated via cursor-based iteration with configurable batch size (default: 500 records per page).

2. **Incremental Sync** — Delta sync using `LastModifiedDate` (Salesforce) or `lastmodifieddate` / `hs_lastmodifieddate` (HubSpot). Runs on a configurable interval (minimum: 5 minutes; default: 15 minutes). Each cycle queries records modified since the previous watermark.

3. **Real-Time Sync** — Event-driven updates via CRM platform events (Salesforce PushTopics / Platform Events, HubSpot Webhooks). Sub-second latency for critical field changes. Requires webhook endpoint registration and event subscription configuration.

### Data Flow Direction

| Object          | LeadReach → CRM | CRM → LeadReach | Conflict Resolution      |
|-----------------|:---------------:|:---------------:|--------------------------|
| Lead            | ✓               | ✓               | Last-write-wins (configurable) |
| Contact         | ✓               | ✓               | CRM authoritative         |
| Account         | ✓               | ✓               | CRM authoritative         |
| Opportunity     | ✓               | ✓               | CRM authoritative         |
| Activity/Task   | ✓               | ✓               | LeadReach authoritative   |
| Custom Objects  | ✓               | ✓               | Configurable per field    |

## Configuration Guide

### Step 1: Create a CRM Connection

Navigate to **Settings → Integrations → CRM** and click **Add Connection**. Select your CRM provider and provide the required credentials.

#### Salesforce Configuration

1. **Create a Connected App** in Salesforce Setup → App Manager → New Connected App.
   - Callback URL: `https://api.leadreach.io/v1/oauth/callback/salesforce`
   - OAuth Scopes: `api`, `refresh_token,offline_access`, `read`, `write`
   - Enable "Refresh Token Policy: Refresh token is valid until revoked"

2. **Note the Consumer Key and Consumer Secret** from the Connected App details.

3. **Assign the LeadReach Permission Set** (or create a custom profile) with the following object permissions:
   - Read/Create/Edit on: Lead, Contact, Account, Opportunity, Task, Event
   - Read on: User, RecordType, CustomObject__c (per mapping)

4. **In LeadReach**, enter your Salesforce instance URL (e.g., `https://myorg.my.salesforce.com`), Consumer Key, and Consumer Secret. Click **Authorize** to launch the OAuth 2.0 flow.

5. **Configure field mappings** (see Step 2).

#### HubSpot Configuration

1. **Create a Private App** in HubSpot → Settings → Integrations → Private Apps.
   - Required scopes: `crm.objects.contacts.read/write`, `crm.objects.companies.read/write`, `crm.objects.deals.read/write`, `crm.objects.leads.read/write`
   - No redirect URI required for Private App (uses bearer tokens)

2. **Copy the Access Token** from the Private App details.

3. **In LeadReach**, select HubSpot, paste the Access Token, and click **Validate Connection**.

4. **Configure field mappings** (see Step 2).

### Step 2: Field Mapping

Field mappings define the translation between LeadReach's canonical data model and your CRM's schema. Each mapping specifies a source field, target field, transformation rule, and conflict policy.

```json
{
  "mappings": [
    {
      "source_object": "lead",
      "source_field": "email",
      "target_object": "Lead",
      "target_field": "Email",
      "transform": "lowercase",
      "conflict_policy": "crm_wins",
      "required": true
    },
    {
      "source_object": "lead",
      "source_field": "lr_lead_score",
      "target_object": "Lead",
      "target_field": "LeadReach_Score__c",
      "transform": "round",
      "conflict_policy": "leadreach_wins",
      "required": false
    },
    {
      "source_object": "lead",
      "source_field": "company_name",
      "target_object": "Account",
      "target_field": "Name",
      "transform": "trim",
      "conflict_policy": "crm_wins",
      "required": true
    }
  ]
}
```

### Step 3: Sync Schedule & Filters

Configure sync parameters under **Settings → Integrations → CRM → [Connection Name] → Sync Config**:

| Parameter              | Default     | Minimum    | Maximum     |
|------------------------|-------------|------------|-------------|
| Incremental Interval   | 15 min      | 5 min      | 60 min      |
| Full Sync Batch Size   | 500         | 100        | 2000        |
| Webhook Retry TTL      | 24 hours    | 1 hour     | 72 hours    |
| Stale Record Threshold | 30 days     | 7 days     | 90 days     |

Apply filters to limit which records sync (e.g., only leads with `Status = 'Open'` or accounts in specific territories):

```json
{
  "filters": {
    "lead": {
      "conditions": [
        { "field": "Status", "operator": "equals", "value": "Open" },
        { "field": "Country", "operator": "in", "values": ["US", "CA", "GB"] }
      ],
      "logic": "AND"
    },
    "account": {
      "conditions": [
        { "field": "AnnualRevenue", "operator": "greater_than", "value": 1000000 }
      ]
    }
  }
}
```

## API Endpoints & Payloads

### Create CRM Connection

```
POST /v1/integrations/crm/connections
```

**Request:**

```json
{
  "provider": "salesforce",
  "display_name": "Production Salesforce",
  "credentials": {
    "instance_url": "https://myorg.my.salesforce.com",
    "client_id": "3MVG9...abbreviated",
    "client_secret": "A1B2C3...abbreviated"
  },
  "sync_config": {
    "mode": "incremental",
    "interval_minutes": 15,
    "batch_size": 500,
    "enabled_objects": ["lead", "contact", "account", "opportunity"]
  },
  "field_mappings": []
}
```

**Response (201 Created):**

```json
{
  "id": "conn_8f2a1b9c4d7e",
  "provider": "salesforce",
  "display_name": "Production Salesforce",
  "status": "pending_authorization",
  "authorization_url": "https://myorg.my.salesforce.com/services/oauth2/authorize?response_type=code&client_id=3MVG9...&redirect_uri=https://api.leadreach.io/v1/oauth/callback/salesforce&state=conn_8f2a1b9c4d7e",
  "created_at": "2026-07-03T14:22:00Z",
  "updated_at": "2026-07-03T14:22:00Z"
}
```

### Trigger Manual Sync

```
POST /v1/integrations/crm/connections/{connection_id}/sync
```

**Request:**

```json
{
  "sync_type": "full",
  "objects": ["lead", "contact"],
  "idempotency_key": "sync-full-2026q3-001"
}
```

**Response (202 Accepted):**

```json
{
  "sync_job_id": "job_7c3d9e1a5f2b",
  "connection_id": "conn_8f2a1b9c4d7e",
  "sync_type": "full",
  "status": "queued",
  "estimated_duration_minutes": 12,
  "created_at": "2026-07-03T14:30:00Z"
}
```

### Get Sync Job Status

```
GET /v1/integrations/crm/sync-jobs/{job_id}
```

**Response (200 OK):**

```json
{
  "job_id": "job_7c3d9e1a5f2b",
  "connection_id": "conn_8f2a1b9c4d7e",
  "sync_type": "full",
  "status": "completed",
  "progress": {
    "total_records": 14523,
    "processed_records": 14523,
    "created": 1203,
    "updated": 8410,
    "skipped": 4890,
    "errors": 20
  },
  "started_at": "2026-07-03T14:30:15Z",
  "completed_at": "2026-07-03T14:42:33Z",
  "error_summary": [
    { "code": "VALIDATION_ERROR", "count": 14, "sample_message": "Email field is required" },
    { "code": "RATE_LIMITED", "count": 6, "sample_message": "Request limit exceeded" }
  ]
}
```

### List Connections

```
GET /v1/integrations/crm/connections?page_size=25&cursor=eyJpZCI6ImNvbm5fYWJjMTIzIn0=
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": "conn_8f2a1b9c4d7e",
      "provider": "salesforce",
      "display_name": "Production Salesforce",
      "status": "active",
      "last_sync_at": "2026-07-03T14:42:33Z",
      "health": "healthy"
    }
  ],
  "pagination": {
    "next_cursor": "eyJpZCI6ImNvbm5fZGVmNDU2In0=",
    "has_more": true
  }
}
```

## Authentication & Security

### OAuth 2.0 Authorization Code Flow (Salesforce)

LeadReach uses the standard OAuth 2.0 Authorization Code with PKCE for Salesforce connections:

1. LeadReach generates a `code_verifier` and `code_challenge` (S256).
2. User is redirected to Salesforce's authorization URL with the `code_challenge`.
3. User authenticates and grants access; Salesforce redirects to LeadReach callback with `code`.
4. LeadReach exchanges `code` + `code_verifier` for `access_token` and `refresh_token`.
5. Tokens are encrypted at rest using AES-256-GCM with a key managed by AWS KMS.
6. Refresh tokens are rotated every 90 days; access tokens are refreshed automatically 5 minutes before expiry.

### Bearer Token (HubSpot Private Apps)

HubSpot Private App tokens are stored encrypted at rest. Tokens have a configurable expiration (default: 1 year). LeadReach monitors token expiration and sends alerts 30 days, 14 days, and 3 days before expiry.

### Security Best Practices

- **Principle of Least Privilege**: Only request CRM scopes required for your configured sync objects. Review and revoke unused permissions quarterly.
- **IP Allowlisting**: Restrict Salesforce Connected App to LeadReach's static IP ranges: `34.120.0.0/14`, `35.244.0.0/14`.
- **Audit Logging**: Every CRM API call is logged with timestamp, user context, operation type, and affected record IDs. Logs retained for 90 days.
- **Data Encryption**: All data in transit uses TLS 1.3. Data at rest is encrypted using AES-256. PII fields (email, phone) use field-level encryption with separate key material.
- **Token Storage**: OAuth tokens never appear in UI responses. Admins can revoke access at any time from the CRM connection settings page.

## Error Handling & Retry Logic

### Error Classification

| Error Code              | HTTP Status | Description                              | Retryable |
|-------------------------|-------------|------------------------------------------|-----------|
| `VALIDATION_ERROR`      | 400         | Field validation failed on CRM side      | No        |
| `AUTH_EXPIRED`          | 401         | OAuth token expired or revoked           | Yes (auto)|
| `PERMISSION_DENIED`     | 403         | Insufficient CRM object permissions      | No        |
| `NOT_FOUND`             | 404         | CRM record deleted or不存在              | No        |
| `RATE_LIMITED`          | 429         | CRM API rate limit exceeded              | Yes       |
| `SERVER_ERROR`          | 500         | CRM provider internal error              | Yes       |
| `SERVICE_UNAVAILABLE`   | 503         | CRM provider temporarily unavailable     | Yes       |
| `CONFLICT`              | 409         | Concurrent modification conflict         | Yes       |
| `PAYLOAD_TOO_LARGE`     | 413         | Batch exceeds CRM limits                 | Yes (split)|

### Retry Strategy

LeadReach implements exponential backoff with jitter for retryable errors:

```
Base delay: 1 second
Multiplier: 2
Max delay: 60 seconds
Max retries: 5
Jitter: ±20% of calculated delay
```

Retry schedule example:
- Attempt 1: Immediate
- Attempt 2: ~1s delay
- Attempt 3: ~2s delay
- Attempt 4: ~4s delay
- Attempt 5: ~8s delay

After 5 retries, the record is moved to the dead-letter queue (DLQ) and an alert is triggered.

### Circuit Breaker

Per-connection circuit breaker monitors CRM API error rates:

- **Closed** (normal): Requests flow through normally.
- **Open** (tripped): When error rate exceeds 50% over a 60-second window (minimum 10 requests), the circuit opens. All requests fail fast for 30 seconds.
- **Half-Open**: After 30 seconds, one probe request is sent. If successful, the circuit closes. If it fails, the circuit reopens for another 30 seconds.

Circuit breaker events are emitted to the event bus and trigger alerts to the on-call team.

## LeadReach Agent Integration

The LeadReach agent ecosystem leverages CRM data extensively across six of the eight agents:

| Agent   | CRM Usage                                                                                      |
|---------|------------------------------------------------------------------------------------------------|
| **Atlas** | Account-level intelligence: reads Account and Opportunity data to build territory maps, identify whitespace accounts, and prioritize account-based strategies. Writes account enrichment signals back to CRM custom fields. |
| **Scout** | Prospect discovery: reads CRM existing contacts to exclude already-engaged prospects from new campaigns. References CRM lead status to avoid re-engaging disqualified leads. |
| **Forge** | Campaign execution: reads CRM activity history (Task, Event) to understand prior touchpoints before generating new outreach. Writes new engagement activities back to CRM timeline. |
| **Sage** | Lead intelligence: reads all CRM data to compute composite lead scores. Writes `lr_lead_score`, `lr_fit_grade`, and `lr_intent_signal` back to CRM fields for sales rep visibility. |
| **Echo** | Activity synchronization: bidirectional sync engine that keeps CRM activities and LeadReach events aligned. Handles deduplication of overlapping activity records. |
| **Flow** | Workflow automation: triggers CRM actions (create task, update stage, assign owner) based on LeadReach workflow conditions. Creates Opportunity updates when leads progress through pipeline stages. |

Agents **Judge** and **Bard** do not directly interact with CRM integrations. Judge evaluates deal quality using internal scoring models, and Bard generates content templates independent of CRM state.

## Monitoring & Observability

### Health Checks

Each CRM connection exposes a health endpoint:

```
GET /v1/integrations/crm/connections/{connection_id}/health
```

```json
{
  "connection_id": "conn_8f2a1b9c4d7e",
  "status": "healthy",
  "checks": {
    "authentication": { "status": "pass", "token_expires_at": "2026-08-01T00:00:00Z" },
    "connectivity": { "status": "pass", "latency_ms": 145 },
    "api_limits": { "status": "pass", "remaining_pct": 72 },
    "last_sync": { "status": "pass", "completed_at": "2026-07-03T14:42:33Z" }
  }
}
```

### Key Metrics

| Metric                                  | Type    | Alert Threshold                    |
|-----------------------------------------|---------|-------------------------------------|
| `crm.sync.records.per_second`           | Gauge   | < 10 records/sec (degraded)         |
| `crm.sync.error_rate`                   | Counter | > 5% over 15-minute window          |
| `crm.api.latency.p99`                   | Gauge   | > 2000ms                            |
| `crm.auth.token_refresh_failures`       | Counter | > 0 (immediate alert)               |
| `crm.circuit_breaker.state`             | State   | open (immediate alert)              |
| `crm.dlq.size`                          | Gauge   | > 100 records                       |
| `crm.sync.lag_seconds`                  | Gauge   | > 900 seconds (15 min) for incremental |

### Dashboards

Pre-built Grafana dashboards are available at **Monitoring → Dashboards → CRM Integration Health**. Key panels include:
- Sync throughput over time (per connection, per object)
- Error rate by error code (stacked area chart)
- API quota consumption vs. limits
- Dead-letter queue depth and age
- Circuit breaker state timeline

### Alerting Rules

Alerts are routed through LeadReach's notification system to Slack, PagerDuty, or email:

| Alert                           | Severity | Notification Channel       |
|---------------------------------|----------|----------------------------|
| Auth token refresh failure      | Critical | PagerDuty + Slack          |
| Circuit breaker open            | Critical | PagerDuty + Slack          |
| Sync lag > 30 minutes          | Warning  | Slack                      |
| DLQ size > 100                  | Warning  | Slack                      |
| API quota < 20%                 | Info     | Email                      |

## Troubleshooting

### Common Issues

**Issue: OAuth token refresh fails with `invalid_grant`**

*Cause*: The refresh token was revoked in the CRM (e.g., user changed password, admin revoked app). *Resolution*: Re-authorize the connection from Settings → Integrations → CRM → [Connection] → Re-Authorize.

**Issue: Sync consistently skips records**

*Cause*: Field mapping has a `required: true` field that is null on some CRM records. *Resolution*: Either make the field optional in the mapping or populate default values using a transform:

```json
{
  "transform": "coalesce",
  "transform_params": { "default": "unknown@company.com" }
}
```

**Issue: Duplicate records created after full sync**

*Cause*: Dedup key not configured or mismatched. LeadReach defaults to deduplicating on `email` for leads/contacts and `crm_id` for accounts. *Resolution*: Verify dedup configuration under **Settings → Integrations → CRM → [Connection] → Dedup Rules**. Add secondary dedup keys (e.g., `email` + `company_website`).

**Issue: Salesforce API limits exceeded**

*Cause*: Concurrent sync jobs or high-frequency incremental syncs consuming too many API calls. *Resolution*: (1) Reduce sync frequency to 30-minute intervals. (2) Reduce batch size to 200. (3) Enable Salesforce API usage monitoring and configure LeadReach to throttle when `remaining_pct < 30%`.

**Issue: HubSpot webhook deliveries failing**

*Cause*: LeadReach webhook endpoint returning 5xx errors or timing out. *Resolution*: Check the webhook receiver health at `GET /v1/integrations/crm/connections/{id}/webhook-health`. If the endpoint is overwhelmed, increase the `webhook_concurrency_limit` in connection settings.

### Diagnostic Commands

```bash
# Check connection health
leadreach integrations crm health --connection conn_8f2a1b9c4d7e

# View recent sync errors
leadreach integrations crm errors --connection conn_8f2a1b9c4d7e --last 1h

# Replay dead-letter queue records
leadreach integrations crm dlq replay --connection conn_8f2a1b9c4d7e --all

# Force token refresh
leadreach integrations crm refresh-token --connection conn_8f2a1b9c4d7e
```

## Cross-References

- [Email Provider Integration](./email-provider-integration.md) — Coordinate CRM contact sync with email outreach
- [Calendar & Booking Integration](./calendar-booking-integration.md) — Log meetings back to CRM activity timelines
- [Data Provider Integration](./data-provider-integration.md) — Enrich CRM records with third-party intelligence
- [Webhook & Automation Integration](./webhook-automation-integration.md) — Trigger CRM updates from custom automations
- [API Reference](./api-reference.md) — Full REST API specification for CRM endpoints
- [Authentication Overview](../security/authentication-overview.md) — OAuth 2.0 flows and token lifecycle
- [Data Mapping Best Practices](../data-governance/field-mapping-best-practices.md) — Advanced mapping patterns and transforms
