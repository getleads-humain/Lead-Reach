---
title: "Webhook & Automation Integration — Event-Driven Workflows and Custom Integrations"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - webhooks
  - automation
  - zapier
  - make
  - event-driven
  - flow
  - echo
  - forge
  - integration
  - hmac
  - retry
  - circuit-breaker
---

# Webhook & Automation Integration

## Overview

LeadReach's webhook and automation integration layer provides the connective tissue between the LeadReach platform and the broader ecosystem of business tools, custom applications, and workflow automation platforms. Whether you need to notify a Slack channel when a high-intent lead is identified, push deal data to a custom data warehouse, or trigger a multi-step Zapier workflow when a prospect books a meeting, the webhook system delivers real-time, reliable event delivery with the guarantees that production B2B workflows demand.

The integration operates on a publish-subscribe model. LeadReach publishes events to a central event bus, and webhook subscriptions define which events are delivered to which endpoints, with what transformation, and under what retry/failure policies. This decoupled architecture means you can add, modify, or remove webhook consumers without impacting the core agent pipeline—ensuring that your custom automations never become a bottleneck for lead processing.

Beyond simple HTTP webhooks, LeadReach integrates natively with automation platforms like Zapier and Make (formerly Integromat), providing pre-built triggers and actions that eliminate the need for custom code. For advanced use cases, LeadReach's Flow agent exposes a visual workflow builder that combines webhook triggers, conditional logic, data transformation, and multi-step actions—all without leaving the LeadReach UI. This guide covers webhook configuration, event schemas, automation platform setup, security, and operational best practices for building robust, event-driven integrations.

## Architecture & Data Flow

### Event Delivery Pipeline

```
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  LeadReach Agents │────▶│  Event Bus       │────▶│  Subscription     │
│  (Atlas, Scout,   │     │  (Kafka-backed)  │     │  Matcher          │
│   Forge, Sage...) │     │                  │     │                   │
└───────────────────┘     └──────────────────┘     └───────────────────┘
                                                            │
                              ┌─────────────────────────────┤
                              │                             │
                              ▼                             ▼
                    ┌──────────────────┐         ┌───────────────────┐
                    │  Webhook         │         │  Automation       │
                    │  Dispatcher      │         │  Platform Adapter │
                    │  (HTTP POST)     │         │  (Zapier/Make)    │
                    └──────────────────┘         └───────────────────┘
                              │                             │
                              ▼                             ▼
                    ┌──────────────────┐         ┌───────────────────┐
                    │  External        │         │  Zapier/Make      │
                    │  Endpoint        │         │  Workflows        │
                    └──────────────────┘         └───────────────────┘
                              │                             │
                              ▼                             ▼
                    ┌──────────────────┐         ┌───────────────────┐
                    │  Delivery Log    │         │  Flow Agent       │
                    │  & Retry Queue   │         │  (Internal Wf)    │
                    └──────────────────┘         └───────────────────┘
```

### Event Categories

LeadReach publishes events across six categories, each with a structured schema:

| Category              | Event Examples                                           | Volume (typical) |
|-----------------------|----------------------------------------------------------|------------------|
| `lead`                | `lead.created`, `lead.updated`, `lead.score_changed`     | High (10K+/day)  |
| `engagement`          | `email.opened`, `email.clicked`, `email.replied`         | Very High        |
| `booking`             | `booking.created`, `booking.canceled`, `booking.no_show` | Medium           |
| `enrichment`          | `enrichment.completed`, `intent_signal.detected`         | Medium           |
| `workflow`            | `workflow.triggered`, `workflow.completed`, `workflow.failed` | Low         |
| `system`              | `sync.completed`, `connection.health_changed`            | Low              |

### Subscription Model

Each webhook subscription defines:
- **Event filter**: Which events to subscribe to (by category, type, or specific criteria)
- **Endpoint URL**: Where to deliver the event payload
- **Transformation**: Optional payload transformation (field filtering, renaming, templating)
- **Delivery policy**: Retry strategy, timeout, and failure handling
- **Security**: HMAC signing, IP allowlisting, mutual TLS

## Configuration Guide

### Creating a Webhook Subscription

1. **Navigate to Settings → Integrations → Webhooks → Add Subscription**
2. **Configure the subscription**:

```json
{
  "name": "Slack Notification - High Intent Leads",
  "description": "Notify sales-team Slack channel when lead intent score exceeds 80",
  "endpoint": {
    "url": "https://hooks.slack.com/services/T0ABC1234/B0XYZ5678/abcdefg123456",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "timeout_seconds": 10
  },
  "events": {
    "categories": ["lead"],
    "types": ["lead.score_changed"],
    "filters": [
      {
        "field": "intent_score",
        "operator": "greater_than",
        "value": 80
      },
      {
        "field": "score_direction",
        "operator": "equals",
        "value": "increased"
      }
    ]
  },
  "transformation": {
    "type": "template",
    "template": {
      "text": "🔥 High-Intent Lead: {{lead.first_name}} {{lead.last_name}} at {{lead.company}} (Intent: {{lead.intent_score}}, Fit: {{lead.fit_grade}})",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*High-Intent Lead Detected*\n*Name:* {{lead.first_name}} {{lead.last_name}}\n*Company:* {{lead.company}}\n*Intent Score:* {{lead.intent_score}}\n*Fit Grade:* {{lead.fit_grade}}"
          }
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": { "type": "plain_text", "text": "View in LeadReach" },
              "url": "https://app.leadreach.io/leads/{{lead.id}}"
            }
          ]
        }
      ]
    }
  },
  "delivery_policy": {
    "retry_strategy": "exponential_backoff",
    "max_retries": 5,
    "base_delay_seconds": 10,
    "max_delay_seconds": 3600,
    "on_permanent_failure": "dead_letter_queue",
    "rate_limit": {
      "max_deliveries_per_second": 10
    }
  },
  "security": {
    "hmac_algorithm": "SHA256",
    "include_signature_header": true,
    "ip_allowlist": []
  },
  "active": true
}
```

### Zapier Integration

1. **In Zapier**, create a new Zap and select **LeadReach** as the trigger app.
2. **Choose a trigger event**: e.g., "New High-Intent Lead," "Lead Score Changed," "Meeting Booked."
3. **Connect your LeadReach account**: Enter your API key (generated at **Settings → API Keys**).
4. **Configure trigger filters** (optional): Zapier's built-in filter step can further refine events.
5. **Set up action steps**: e.g., Create Salesforce Task, Send Slack Message, Add to Google Sheet.

LeadReach's Zapier integration supports these triggers:

| Trigger Name                  | Event Type                   | Description                                    |
|-------------------------------|------------------------------|------------------------------------------------|
| New Lead Created              | `lead.created`               | A new lead enters LeadReach                    |
| Lead Score Changed            | `lead.score_changed`         | Lead score updated by Sage agent               |
| High-Intent Lead Detected     | `lead.score_changed` (filtered) | Lead intent score exceeds threshold        |
| Meeting Booked                | `booking.created`            | A prospect books a meeting                     |
| Meeting Canceled              | `booking.canceled`           | A prospect cancels a meeting                   |
| Email Reply Received          | `email.replied`              | A prospect replies to an email                 |
| Enrichment Completed          | `enrichment.completed`       | Lead enrichment data returned                  |
| Workflow Completed            | `workflow.completed`         | A Flow agent workflow finishes execution       |

### Make (Integromat) Integration

1. **In Make**, create a new scenario and add a LeadReach module as the first step.
2. **Select a trigger**: Choose from "Watch Events" (webhook-based) or "Search Leads" (polling).
3. **Authenticate**: Enter LeadReach API key and webhook URL (Make generates this automatically).
4. **Map fields**: Use Make's visual mapper to connect LeadReach event fields to downstream modules.
5. **Configure error handling**: Make's built-in error router can handle webhook delivery failures.

### Flow Agent Workflow Builder

For internal automations, use the Flow agent's visual workflow builder at **Automations → Workflows → New Workflow**:

```
Trigger: lead.score_changed (intent_score > 80)
  │
  ├─ Step 1: Enrich lead with ZoomInfo (if not already enriched)
  │    └─ Condition: enrichment_status != "complete"
  │
  ├─ Step 2: Update CRM lead score
  │    └─ Action: CRM Update (Salesforce Lead.LeadReach_Score__c)
  │
  ├─ Step 3: Assign to SDR
  │    └─ Action: CRM Update (Lead.OwnerId = round_robin("SDR_Pool"))
  │
  ├─ Step 4: Send Slack notification
  │    └─ Action: Webhook POST to Slack
  │
  └─ Step 5: Add to high-priority sequence
       └─ Action: Outreach add_to_sequence ("Hot Lead Fast Track")
```

## API Endpoints & Payloads

### Create Webhook Subscription

```
POST /v1/integrations/webhooks/subscriptions
```

**Request:**

```json
{
  "name": "Data Warehouse - Lead Events",
  "endpoint": {
    "url": "https://api.mywarehouse.com/v1/ingest/leadreach",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer whs_abc123xyz",
      "X-Ingest-Source": "leadreach"
    },
    "timeout_seconds": 30
  },
  "events": {
    "categories": ["lead", "engagement", "booking"],
    "types": ["lead.created", "lead.score_changed", "email.replied", "booking.created"],
    "filters": []
  },
  "delivery_policy": {
    "retry_strategy": "exponential_backoff",
    "max_retries": 8,
    "base_delay_seconds": 30,
    "max_delay_seconds": 7200
  },
  "security": {
    "hmac_algorithm": "SHA256"
  }
}
```

**Response (201 Created):**

```json
{
  "subscription_id": "sub_c7d8e9f0",
  "name": "Data Warehouse - Lead Events",
  "status": "active",
  "signing_key": "whsk_a1b2c3d4e5f6g7h8i9j0",
  "created_at": "2026-07-03T16:00:00Z",
  "stats": {
    "delivered": 0,
    "failed": 0,
    "pending": 0
  }
}
```

> ⚠️ The `signing_key` is only returned once at creation time. Store it securely; it cannot be retrieved later.

### List Subscriptions

```
GET /v1/integrations/webhooks/subscriptions?page_size=50&status=active
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "subscription_id": "sub_c7d8e9f0",
      "name": "Data Warehouse - Lead Events",
      "status": "active",
      "events": ["lead.created", "lead.score_changed", "email.replied", "booking.created"],
      "endpoint_url": "https://api.mywarehouse.com/v1/ingest/leadreach",
      "last_delivery_at": "2026-07-03T15:58:00Z",
      "last_delivery_status": "success",
      "total_delivered": 12453,
      "total_failed": 23,
      "created_at": "2026-07-03T16:00:00Z"
    }
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

### Test Webhook Subscription

```
POST /v1/integrations/webhooks/subscriptions/{subscription_id}/test
```

**Request:**

```json
{
  "event_type": "lead.score_changed",
  "sample_payload": {
    "lead_id": "lead_test_001",
    "first_name": "Test",
    "last_name": "User",
    "company": "Test Company",
    "intent_score": 85,
    "fit_grade": "A"
  }
}
```

**Response (200 OK):**

```json
{
  "test_id": "test_k1l2m3n4",
  "delivered": true,
  "response_status": 200,
  "response_time_ms": 145,
  "response_body_snippet": "{\"status\":\"received\",\"event_id\":\"evt_abc123\"}"
}
```

### Get Delivery Log

```
GET /v1/integrations/webhooks/subscriptions/{subscription_id}/deliveries?page_size=25&status=failed
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "delivery_id": "del_o5p6q7r8",
      "subscription_id": "sub_c7d8e9f0",
      "event_id": "evt_s9t0u1v2",
      "event_type": "lead.score_changed",
      "status": "failed",
      "attempts": [
        {
          "attempt_number": 1,
          "timestamp": "2026-07-03T15:30:00Z",
          "response_status": 500,
          "error_message": "Internal Server Error"
        },
        {
          "attempt_number": 2,
          "timestamp": "2026-07-03T15:30:30Z",
          "response_status": 500,
          "error_message": "Internal Server Error"
        },
        {
          "attempt_number": 3,
          "timestamp": "2026-07-03T15:31:30Z",
          "response_status": null,
          "error_message": "Connection timed out after 30s"
        }
      ],
      "next_retry_at": "2026-07-03T15:33:30Z",
      "payload_size_bytes": 2048
    }
  ],
  "pagination": {
    "next_cursor": null,
    "has_more": false
  }
}
```

### Webhook Event Payload Schema

All webhook deliveries follow a consistent envelope:

```json
{
  "event_id": "evt_w3x4y5z6",
  "event_type": "lead.score_changed",
  "event_category": "lead",
  "timestamp": "2026-07-03T15:45:00Z",
  "subscription_id": "sub_c7d8e9f0",
  "delivery_attempt": 1,
  "data": {
    "lead_id": "lead_abc123",
    "lead": {
      "first_name": "John",
      "last_name": "Doe",
      "email": "j.doe@targetcompany.com",
      "company": "Target Company",
      "intent_score": 87,
      "fit_grade": "A",
      "previous_intent_score": 65,
      "score_direction": "increased",
      "score_delta": 22
    },
    "trigger": {
      "agent": "sage",
      "reason": "intent_signal_detected",
      "details": "ZoomInfo intent: CRM Software intensity 85 → 87"
    }
  },
  "metadata": {
    "environment": "production",
    "api_version": "2026-07-01",
    "idempotency_key": "evt_w3x4y5z6"
  }
}
```

## Authentication & Security

### HMAC Signature Verification

Every webhook delivery includes an HMAC signature in the `X-LeadReach-Signature` header:

```
X-LeadReach-Signature: t=1625328300,v1=abc123def456...
```

Verification algorithm:

```python
import hmac
import hashlib

def verify_webhook(payload_body, signature_header, signing_key):
    """Verify LeadReach webhook HMAC signature."""
    elements = signature_header.split(',')
    timestamp = None
    signature = None

    for element in elements:
        key, value = element.split('=')
        if key == 't':
            timestamp = value
        elif key == 'v1':
            signature = value

    if not timestamp or not signature:
        return False

    # Sign the timestamp + payload
    signed_payload = f"{timestamp}.{payload_body}"
    expected_signature = hmac.new(
        signing_key.encode('utf-8'),
        signed_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # Compare signatures (constant-time comparison)
    return hmac.compare_digest(expected_signature, signature)
```

### IP Allowlisting

LeadReach webhook source IPs (for customers who need to allowlist inbound traffic):

- `34.120.0.0/14`
- `35.244.0.0/14`
- `2600:1901:0:ba00::/56`

IP ranges may change; subscribe to `system.ip_range_changed` events for notifications.

### Mutual TLS (Enterprise)

Enterprise customers can configure mutual TLS (mTLS) for webhook endpoints:

1. Upload your CA certificate to **Settings → Integrations → Webhooks → mTLS**
2. LeadReach presents a client certificate during the TLS handshake
3. Your server validates the certificate before accepting the webhook

### Payload Encryption

For sensitive data, enable payload encryption:

```json
{
  "security": {
    "payload_encryption": {
      "enabled": true,
      "algorithm": "AES-256-GCM",
      "key_rotation_days": 90
    }
  }
}
```

Encrypted payloads are delivered with an `X-LeadReach-Encrypted: true` header. The decryption key is provided out-of-band during setup and must be stored securely by the consumer.

## Error Handling & Retry Logic

### Delivery Failure Classification

| Failure Type            | HTTP Status | Action                                           |
|-------------------------|-------------|--------------------------------------------------|
| Endpoint unreachable    | N/A (DNS/TCP) | Retry with exponential backoff                 |
| Server error            | 500, 502, 503 | Retry with exponential backoff                 |
| Rate limited            | 429         | Respect `Retry-After` header; then retry          |
| Client error            | 400, 401, 403 | No retry; move to DLQ immediately              |
| Timeout                 | N/A         | Retry with exponential backoff                    |
| Payload too large       | 413         | No retry; alert admin                             |
| Redirect                | 301, 302    | Follow redirect (max 3); then DLQ                 |

### Retry Schedule

```
Default retry strategy: Exponential backoff with jitter
Base delay: 30 seconds
Multiplier: 2
Max delay: 2 hours
Max retries: 8
Jitter: ±20%

Attempt 1: Immediate (on event)
Attempt 2: ~30 seconds
Attempt 3: ~60 seconds
Attempt 4: ~2 minutes
Attempt 5: ~4 minutes
Attempt 6: ~8 minutes
Attempt 7: ~16 minutes
Attempt 8: ~32 minutes

After 8 failed attempts: Move to dead letter queue
```

### Dead Letter Queue

Failed deliveries are moved to the DLQ with full context:

```
GET /v1/integrations/webhooks/dlq?subscription_id=sub_c7d8e9f0&page_size=50
```

DLQ entries can be:
- **Replayed**: Re-attempt delivery to the original endpoint
- **Forwarded**: Send to an alternate endpoint
- **Discarded**: Permanently remove from the queue

### Circuit Breaker

Per-subscription circuit breaker prevents flooding a failing endpoint:

- **Closed**: Normal delivery.
- **Open**: When delivery failure rate exceeds 60% over 5-minute window (min 10 attempts), circuit opens. Events are buffered (up to 10,000) for 30 minutes.
- **Half-Open**: After 30 minutes, one probe delivery is attempted. If successful, buffered events are replayed. If failed, circuit reopens.

## LeadReach Agent Integration

| Agent   | Webhook & Automation Usage                                                                             |
|---------|--------------------------------------------------------------------------------------------------------|
| **Flow** | Primary agent: builds, manages, and executes internal workflows triggered by webhook events. The Flow workflow engine is itself a webhook consumer that processes events and orchestrates multi-step automations (CRM updates, email sends, Slack notifications). |
| **Echo** | Event synchronization: consumes webhook events from external systems (e.g., CRM webhooks) and translates them into LeadReach internal events. Ensures bidirectional consistency. |
| **Forge** | Campaign orchestration: subscribes to engagement webhooks (email.opened, email.replied) to trigger next-step actions in sequences. For example, a reply event pauses the sequence and creates a CRM task. |
| **Sage** | Score updates: publishes `lead.score_changed` events when scoring models update. Subscribes to `enrichment.completed` events to re-evaluate scores with new data. |
| **Atlas** | Account-level automation: subscribes to intent signal webhooks and triggers account-based plays when multiple contacts at an account show concurrent buying signals. |

Agents **Scout**, **Bard**, and **Judge** interact indirectly (Scout's prospect discoveries trigger `lead.created` events; Bard's content is delivered through Forge-managed sequences; Judge evaluates deal quality based on events published by other agents).

## Monitoring & Observability

### Key Metrics

| Metric                                    | Type    | Alert Threshold                        |
|-------------------------------------------|---------|----------------------------------------|
| `webhook.delivery.success_rate`           | Gauge   | < 95% over 15 minutes                  |
| `webhook.delivery.latency.p99`            | Gauge   | > 5 seconds                            |
| `webhook.dlq.size`                        | Gauge   | > 100 entries                          |
| `webhook.circuit_breaker.open_count`      | Counter | > 0 (immediate alert)                  |
| `webhook.subscription.lag_seconds`        | Gauge   | > 300 seconds (5 min)                  |
| `webhook.retry.active_count`              | Gauge   | > 500 (check endpoint health)          |
| `webhook.event.throughput`                | Gauge   | Track for capacity planning            |

### Delivery Dashboard

The **Webhook Delivery Health** dashboard shows:
- Delivery success rate by subscription (line chart)
- Event throughput by category (stacked area)
- DLQ depth and oldest entry age
- Circuit breaker state timeline
- Endpoint latency heat map (by subscription)
- Retry rate trending

### Alerting

| Alert                                | Severity | Channel              |
|--------------------------------------|----------|----------------------|
| Circuit breaker opened               | Critical | PagerDuty + Slack    |
| DLQ size > 100                       | Warning  | Slack                |
| Delivery success rate < 90%          | Warning  | Slack                |
| Subscription lag > 10 minutes        | Warning  | Slack                |
| Endpoint timeout rate > 20%          | Info     | Email digest         |

## Troubleshooting

**Issue: Webhooks not being received at endpoint**

*Diagnosis*: Check the delivery log at **Settings → Integrations → Webhooks → [Subscription] → Deliveries**. Look for connection errors, DNS failures, or TLS errors. *Resolution*: Verify the endpoint URL is correct and publicly accessible. Test with `curl -X POST {endpoint_url}`. Check firewall rules and IP allowlist. Ensure TLS certificate is valid.

**Issue: Receiving duplicate webhook deliveries**

*Cause*: Your endpoint returned a non-2xx status code, triggering retries, but the first delivery was actually processed. *Resolution*: Implement idempotency on your endpoint using the `event_id` field. Process each `event_id` exactly once:

```python
processed_events = set()

def handle_webhook(event):
    event_id = event["event_id"]
    if event_id in processed_events:
        return {"status": "ok", "message": "duplicate_ignored"}
    # Process event
    processed_events.add(event_id)
    return {"status": "ok"}
```

**Issue: HMAC signature verification fails**

*Cause*: Payload body was modified (e.g., by a proxy or middleware), or the signing key is incorrect. *Resolution*: Use the raw request body for signature computation—do not parse and re-serialize JSON. Verify the signing key matches the one returned at subscription creation. Check for whitespace or encoding changes introduced by middleware.

**Issue: Zapier trigger not firing**

*Cause*: LeadReach webhook subscription for Zapier was disconnected or the Zap is paused. *Resolution*: In Zapier, check that the Zap is turned on. In LeadReach, verify the Zapier subscription is active (`status: "active"`). Re-authenticate the LeadReach connection in Zapier if the API key has expired.

**Issue: High webhook delivery latency**

*Cause*: Endpoint is slow to respond, or the event volume exceeds the subscription's rate limit. *Resolution*: Check endpoint response time in the delivery log. If consistently slow, increase the `timeout_seconds` setting. If your endpoint can't keep up with volume, implement a queue on your end and return 200 immediately. LeadReach will deliver up to the configured `max_deliveries_per_second`.

## Cross-References

- [CRM Integration Guide](./crm-integration-guide.md) — CRM webhooks for real-time sync triggers
- [Email Provider Integration](./email-provider-integration.md) — Email engagement webhooks
- [Calendar & Booking Integration](./calendar-booking-integration.md) — Booking event webhooks
- [Data Provider Integration](./data-provider-integration.md) — Enrichment completion webhooks
- [API Reference](./api-reference.md) — Full REST API specification for webhook endpoints
- [Flow Agent Workflow Guide](../agents/flow-workflow-guide.md) — Building internal automations with the Flow agent
- [Security Best Practices](../security/webhook-security-best-practices.md) — HMAC verification, mTLS, and payload encryption
