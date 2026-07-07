---
title: "Calendar & Booking Integration — Calendly, Chili Piper & Meeting Scheduling"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - calendar
  - calendly
  - chili-piper
  - booking
  - scheduling
  - meetings
  - forge
  - flow
  - echo
  - integration
  - oauth2
  - webhook
---

# Calendar & Booking Integration

## Overview

LeadReach's calendar and booking integration connects your meeting scheduling infrastructure directly into the lead intelligence pipeline, ensuring that every booked meeting is automatically enriched, logged, and routed to the right sales representative. By integrating with platforms like Calendly and Chili Piper, LeadReach eliminates the manual handoff between marketing engagement and sales conversations—turning a prospect's "book a demo" click into a fully contextualized, CRM-logged meeting within seconds.

The integration serves two complementary purposes. First, it enables LeadReach agents to programmatically generate and insert personalized booking links into email sequences, landing pages, and chat interactions. Second, it captures booking events (created, rescheduled, canceled, completed) via webhooks and feeds them back into the LeadReach event bus, where agents use them to update lead scores, trigger follow-up workflows, and measure pipeline velocity. This closed-loop design means that a meeting is never just a meeting—it's a measurable conversion event that directly influences downstream pipeline metrics.

Chili Piper integration adds an additional capability: intelligent routing. When a high-intent lead requests a meeting, Chili Piper's router can instantly match the prospect to the right rep based on territory, company size, or custom assignment rules—and LeadReach's Atlas agent can influence that routing by feeding account intelligence signals (ICP fit score, intent data, engagement velocity) into Chili Piper's routing logic. The result is that your highest-value prospects always reach your best-equipped reps, with zero manual triage.

## Architecture & Data Flow

### Booking Event Pipeline

```
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  Email / Landing  │────▶│  Booking Link    │────▶│  Calendar Provider│
│  Page (Forge/Bard)│     │  Generator       │     │  (Calendly/CP)    │
└───────────────────┘     └──────────────────┘     └───────────────────┘
                                                            │
                                                            ▼
┌───────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│  CRM Activity Log │◀────│  LeadReach       │◀────│  Webhook          │
│  (Echo sync)      │     │  Event Bus       │     │  Receiver         │
└───────────────────┘     └──────────────────┘     └───────────────────┘
         │                         │
         ▼                         ▼
┌───────────────────┐     ┌──────────────────┐
│  Flow Workflows   │     │  Agent Score     │
│  (Auto-follow-up) │     │  Updates (Sage)  │
└───────────────────┘     └──────────────────┘
```

### Routing Flow (Chili Piper)

```
Prospect clicks booking link
        │
        ▼
Chili Piper Router receives request
        │
        ▼
Router queries LeadReach routing hints API
   → GET /v1/integrations/calendar/routing-hints?email=j.doe@target.com
   → Returns: { icp_fit: "A", intent_score: 87, territory: "WEST" }
        │
        ▼
Router assigns to matching rep (round-robin, weighted, or custom rules)
        │
        ▼
Booking confirmed → Webhook → LeadReach Event Bus
        │
        ▼
Flow triggers: CRM task, Slack notification, sequence pause
```

### Supported Providers

| Provider        | Booking Links | Webhook Events | Routing | Round-Robin | Custom Forms |
|-----------------|:------------:|:--------------:|:-------:|:-----------:|:------------:|
| Calendly        | ✓            | ✓              | ✗       | ✓ (basic)   | ✓            |
| Chili Piper     | ✓            | ✓              | ✓       | ✓           | ✓            |
| HubSpot Meetings| ✓            | ✓              | ✓       | ✓           | ✓            |
| Custom (iCal)   | ✓            | ✗              | ✗       | ✗           | ✗            |

## Configuration Guide

### Calendly Integration Setup

1. **Create a Calendly API Token** at Calendly → Integrations & Apps → API & Webhooks → Generate Personal Access Token, or register an OAuth application at Calendly Developer Portal for team-wide access.

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Calendar → Add Provider → Calendly**
   - Choose authentication method:
     - **Personal Access Token**: Paste token directly (best for single-user setups)
     - **OAuth 2.0**: Click Authorize to go through Calendly's OAuth flow (best for team/organization setups)
   - Required OAuth scopes: `read`, `write`

3. **Subscribe to webhook events** in Calendly:
   ```json
   {
     "webhook_url": "https://api.leadreach.io/v1/integrations/calendar/webhooks/calendly",
     "events": [
       "invitee.created",
       "invitee.canceled",
       "routing_form_submission.created"
     ],
     "organization": "https://api.calendly.com/organizations/a1b2c3d4",
     "user": "https://api.calendly.com/users/e5f6g7h8",
     "scope": "organization"
   }
   ```

4. **Map event types to LeadReach contexts**:
   ```json
   {
     "event_type_mappings": [
       {
         "calendly_event_type_uuid": "et_abc123",
         "event_type_name": "30-min Discovery Call",
         "leadreach_context": "discovery",
         "assign_to_campaign": "camp_discovery_v2",
         "auto_create_crm_task": true,
         "task_type": "Call",
         "task_priority": "High"
       },
       {
         "calendly_event_type_uuid": "et_def456",
         "event_type_name": "15-min Quick Connect",
         "leadreach_context": "follow_up",
         "assign_to_campaign": null,
         "auto_create_crm_task": true,
         "task_type": "Meeting",
         "task_priority": "Normal"
       }
     ]
   }
   ```

### Chili Piper Integration Setup

1. **Create an API Key** in Chili Piper → Workspace Settings → API Keys → Generate Key.
   - Required permissions: `read:routes`, `write:bookings`, `read:bookings`, `webhooks`

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Calendar → Add Provider → Chili Piper**
   - Enter Workspace ID and API Key
   - Select the router to associate with LeadReach (e.g., "Inbound Demo Requests")

3. **Enable routing hints** (optional but recommended):
   ```json
   {
     "routing_hints_enabled": true,
     "hint_fields": [
       { "field": "icp_fit_grade", "weight": 0.4 },
       { "field": "intent_score", "weight": 0.3 },
       { "field": "engagement_velocity", "weight": 0.2 },
       { "field": "account_revenue", "weight": 0.1 }
     ],
     "priority_threshold": {
       "hot": { "min_score": 80 },
       "warm": { "min_score": 50 },
       "cold": { "min_score": 0 }
     }
   }
   ```

4. **Configure webhook in Chili Piper**:
   - Navigate to Workspace Settings → Webhooks → Add Endpoint
   - URL: `https://api.leadreach.io/v1/integrations/calendar/webhooks/chilipiper`
   - Events: `booking.created`, `booking.rescheduled`, `booking.canceled`, `booking.completed`, `booking.no_show`

### HubSpot Meetings Integration

HubSpot Meetings integration is automatically available when the HubSpot CRM connection is configured (see [CRM Integration Guide](./crm-integration-guide.md)). No additional credentials are needed. LeadReach reads meeting links and booking events via the HubSpot CRM API.

1. **Enable in LeadReach**: Navigate to **Settings → Integrations → Calendar → HubSpot Meetings → Enable**.
2. **Map meeting types** to LeadReach contexts as with Calendly.
3. **Webhook events** are received via the existing HubSpot CRM webhook subscription.

## API Endpoints & Payloads

### Generate Booking Link

```
POST /v1/integrations/calendar/booking-links
```

**Request:**

```json
{
  "provider": "calendly",
  "event_type_id": "et_abc123",
  "prefill": {
    "name": "John Doe",
    "email": "j.doe@targetcompany.com",
    "custom_questions": [
      { "question": "What's your biggest challenge?", "answer": "Scaling outbound" },
      { "question": "Team size?", "answer": "15-20" }
    ]
  },
  "utm_parameters": {
    "utm_source": "leadreach",
    "utm_medium": "email",
    "utm_campaign": "camp_discovery_v2",
    "utm_content": "step_3_cta"
  },
  "expire_after": "2026-07-10T23:59:59Z",
  "max_uses": 1
}
```

**Response (201 Created):**

```json
{
  "booking_link_id": "bl_x1y2z3a4",
  "booking_url": "https://calendly.com/acme-sales/discovery?name=John+Doe&email=j.doe%40targetcompany.com&a1=Scaling+outbound&a2=15-20",
  "short_url": "https://book.leadreach.io/b/x1y2z3a4",
  "event_type": "30-min Discovery Call",
  "expires_at": "2026-07-10T23:59:59Z",
  "max_uses": 1,
  "uses_remaining": 1
}
```

### Get Routing Hints (Chili Piper)

```
GET /v1/integrations/calendar/routing-hints?email=j.doe@targetcompany.com
```

**Response (200 OK):**

```json
{
  "email": "j.doe@targetcompany.com",
  "hints": {
    "icp_fit_grade": "A",
    "intent_score": 87,
    "engagement_velocity": "high",
    "account_revenue": 25000000,
    "territory": "WEST",
    "priority": "hot",
    "preferred_rep_id": null,
    "do_not_route_to": ["rep_0023", "rep_0045"],
    "custom_attributes": {
      "industry": "SaaS",
      "employee_range": "200-500"
    }
  },
  "computed_at": "2026-07-03T15:00:00Z",
  "ttl_seconds": 300
}
```

### List Upcoming Bookings

```
GET /v1/integrations/calendar/bookings?status=upcoming&page_size=20&cursor=eyJkYXRlIjoiMjAyNi0wNy0wNCJ9
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "booking_id": "bk_m5n6o7p8",
      "provider": "calendly",
      "provider_booking_id": "inv_987654321",
      "event_type": "30-min Discovery Call",
      "prospect": {
        "email": "j.doe@targetcompany.com",
        "name": "John Doe",
        "company": "Target Company"
      },
      "assigned_rep": {
        "email": "sarah.johnson@acmecorp.com",
        "name": "Sarah Johnson"
      },
      "scheduled_at": "2026-07-05T10:00:00Z",
      "duration_minutes": 30,
      "status": "upcoming",
      "location": "Zoom - https://zoom.us/j/123456789",
      "leadreach_context": "discovery",
      "campaign_id": "camp_discovery_v2",
      "created_at": "2026-07-03T14:45:00Z"
    }
  ],
  "pagination": {
    "next_cursor": "eyJkYXRlIjoiMjAyNi0wNy0wNiJ9",
    "has_more": true
  }
}
```

### Webhook: Booking Created Event

```
POST /v1/integrations/calendar/webhooks/calendly
```

**Calendly `invitee.created` Payload (normalized):**

```json
{
  "event": "booking.created",
  "provider": "calendly",
  "timestamp": "2026-07-03T14:45:00Z",
  "data": {
    "booking_id": "bk_m5n6o7p8",
    "provider_booking_id": "inv_987654321",
    "event_type": "30-min Discovery Call",
    "prospect": {
      "email": "j.doe@targetcompany.com",
      "name": "John Doe"
    },
    "assigned_rep": {
      "email": "sarah.johnson@acmecorp.com",
      "name": "Sarah Johnson"
    },
    "scheduled_at": "2026-07-05T10:00:00Z",
    "duration_minutes": 30,
    "location": "Zoom - https://zoom.us/j/123456789",
    "utm_parameters": {
      "utm_source": "leadreach",
      "utm_medium": "email",
      "utm_campaign": "camp_discovery_v2"
    },
    "cancel_url": "https://calendly.com/cancellations/inv_987654321",
    "reschedule_url": "https://calendly.com/reschedulings/inv_987654321"
  },
  "signature": "sha256=fedcba987654..."
}
```

### Cancel Booking

```
POST /v1/integrations/calendar/bookings/{booking_id}/cancel
```

**Request:**

```json
{
  "reason": "prospect_requested",
  "send_notification": true,
  "notification_message": "Hi John, your meeting has been canceled as requested. Feel free to reschedule at your convenience.",
  "trigger_workflow": true,
  "workflow_id": "wf_reengage_after_cancel"
}
```

**Response (200 OK):**

```json
{
  "booking_id": "bk_m5n6o7p8",
  "status": "canceled",
  "canceled_at": "2026-07-04T09:00:00Z",
  "canceled_by": "system",
  "workflow_triggered": true,
  "workflow_execution_id": "wfe_q1r2s3t4"
}
```

## Authentication & Security

### Calendly OAuth 2.0

Calendly uses OAuth 2.0 with the Authorization Code flow:

1. LeadReach redirects user to `https://auth.calendly.com/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, and `state`.
2. User authenticates and authorizes; Calendly redirects to LeadReach callback with `code`.
3. LeadReach exchanges `code` for `access_token` and `refresh_token` via `POST https://auth.calendly.com/oauth/token`.
4. Access tokens expire after 2 hours. Refresh tokens have no expiration but can be revoked.

**Token security**: All tokens encrypted at rest (AES-256-GCM, AWS KMS). Access tokens never logged or exposed in UI. Token refresh attempts are audited.

### Chili Piper API Key

Chili Piper uses workspace-scoped API keys with HMAC-SHA256 request signing:

```
Signature = HMAC-SHA256(api_key, request_body + timestamp)
Header: X-CP-Signature: <signature>
Header: X-CP-Timestamp: <unix_timestamp>
```

Keys are rotated every 90 days. Old keys are deprecated (still accepted for 7 days after rotation) before being revoked.

### Webhook Signature Verification

All incoming webhook events are verified using HMAC-SHA256 signatures:

1. LeadReach computes `HMAC-SHA256(webhook_secret, raw_request_body)`.
2. Compare against the `Calendly-Webhook-Signature` or `X-CP-Signature` header.
3. Reject requests with invalid or missing signatures (return `401 Unauthorized`).
4. Include `X-LeadReach-Delivery-Id` header in responses for deduplication.

### Data Privacy

- Prospect PII (name, email, phone) in booking events is encrypted at rest with field-level encryption.
- Booking data retention follows configurable policies (default: 2 years, minimum: 90 days).
- Right-to-deletion requests are processed within 72 hours, cascading deletes to CRM logs and analytics aggregates.

## Error Handling & Retry Logic

### Error Codes

| Error Code                | HTTP Status | Description                                     | Retryable |
|---------------------------|-------------|-------------------------------------------------|-----------|
| `INVALID_EVENT_TYPE`      | 400         | Event type UUID not found or inactive           | No        |
| `BOOKING_SLOT_UNAVAILABLE`| 409         | Requested time slot already booked               | Yes       |
| `RATE_LIMITED`            | 429         | Provider API rate limit exceeded                 | Yes       |
| `AUTH_EXPIRED`            | 401         | OAuth token expired or API key invalid           | Yes (auto)|
| `PROVIDER_UNAVAILABLE`    | 503         | Provider API down                                | Yes       |
| `WEBHOOK_DELIVERY_FAILED` | 502         | LeadReach webhook endpoint unreachable           | Yes       |
| `DUPLICATE_BOOKING`       | 409         | Same prospect already booked for this event type | No        |
| `ROUTING_NO_REP_AVAILABLE`| 422         | Chili Piper found no eligible rep                | Yes       |

### Retry Strategy

```
For booking creation failures:
  Base delay: 5 seconds
  Multiplier: 2
  Max delay: 5 minutes
  Max retries: 5
  Jitter: ±20%

For webhook delivery failures (provider → LeadReach):
  Provider handles retries: Calendly retries for 24 hours (exponential backoff)
  Chili Piper retries for 48 hours
  After max retries: Alert on-call team
```

### Idempotency

All booking-related write endpoints require an `idempotency_key` header. LeadReach stores idempotency keys for 48 hours. Duplicate requests with the same key return the original response without creating duplicate bookings.

## LeadReach Agent Integration

| Agent   | Calendar Integration Usage                                                                              |
|---------|--------------------------------------------------------------------------------------------------------|
| **Forge** | Inserts personalized booking links into email sequences at optimal steps (typically step 2-3 after initial value email). Selects booking event type based on lead segment and campaign strategy. |
| **Flow** | Manages booking-triggered workflows: "If booking created → pause email sequence → send confirmation email → create CRM task → notify rep via Slack." Handles reschedule and cancellation automations. |
| **Echo** | Synchronizes booking events to CRM activity timelines. Deduplicates booking records when the same event arrives from multiple sources (e.g., Calendly webhook + CRM sync). |
| **Sage** | Treats booking events as high-intent signals. Increases lead intent score by 15-25 points on booking creation. Adjusts score on cancellation (−10 points) or no-show (−15 points). |
| **Atlas** | Aggregates booking data at account level: identifies accounts with multiple contacts booking meetings. Feeds routing hints to Chili Piper for priority assignment. |
| **Bard** | Generates contextual booking confirmation and reminder emails. Personalizes pre-meeting content based on prospect profile and meeting type. |

Agents **Scout** and **Judge** do not directly interact with the calendar integration.

## Monitoring & Observability

### Key Metrics

| Metric                                    | Type    | Alert Threshold                      |
|-------------------------------------------|---------|--------------------------------------|
| `calendar.booking.creation_rate`          | Gauge   | < 5/day (check funnel)              |
| `calendar.booking.cancellation_rate`      | Gauge   | > 20% over 7-day window             |
| `calendar.booking.no_show_rate`           | Gauge   | > 15% over 7-day window             |
| `calendar.webhook.delivery_latency.p99`  | Gauge   | > 5 seconds                          |
| `calendar.routing.hint_latency.p99`       | Gauge   | > 500ms                              |
| `calendar.provider.api_errors`            | Counter | > 10 in 15 minutes                   |
| `calendar.link_generation.latency.p99`    | Gauge   | > 2 seconds                          |

### Health Check

```
GET /v1/integrations/calendar/health
```

```json
{
  "overall_status": "healthy",
  "providers": {
    "calendly": {
      "status": "healthy",
      "auth_expires_at": "2026-07-04T16:00:00Z",
      "webhook_active": true,
      "api_latency_ms": 310
    },
    "chili_piper": {
      "status": "healthy",
      "api_key_expires_at": "2026-10-01T00:00:00Z",
      "webhook_active": true,
      "api_latency_ms": 185
    }
  }
}
```

### Dashboard

The **Calendar Integration Health** dashboard (Monitoring → Dashboards) shows:
- Bookings created/canceled/rescheduled over time (per provider)
- Booking conversion rate by campaign and event type
- Routing hint latency and error rate
- Webhook delivery success rate and lag
- No-show rate by rep and event type

## Troubleshooting

**Issue: Booking links return 404 or "Event type not found"**

*Cause*: The Calendly event type UUID is incorrect or the event type was deactivated. *Resolution*: Re-map event types in **Settings → Integrations → Calendar → Event Type Mapping**. Verify UUIDs via `GET /v1/integrations/calendar/providers/calendly/event-types`.

**Issue: Chili Piper routing assigns wrong rep**

*Cause*: Routing hints are stale (TTL expired) or the routing rules in Chili Piper conflict with LeadReach hints. *Resolution*: Check routing hint freshness via the `computed_at` timestamp. Verify Chili Piper router rules match the hint field names. Ensure the `priority_threshold` configuration aligns with Chili Piper's queue assignments.

**Issue: Webhook events arriving out of order**

*Cause*: Calendly and Chili Piper don't guarantee webhook ordering. A `booking.canceled` event may arrive before `booking.created` if the booking was created and canceled rapidly. *Resolution*: LeadReach handles this via event time reconciliation—events are processed based on their `timestamp` field, not arrival order. If a `canceled` event arrives before the `created` event, it's queued and processed after the `created` event arrives (max wait: 5 minutes, then alert).

**Issue: Double booking on the same slot**

*Cause*: Race condition between two prospects booking the same slot simultaneously. *Resolution*: LeadReach uses optimistic concurrency control with Calendly's native slot locking. If a conflict occurs, the second booking attempt receives `BOOKING_SLOT_UNAVAILABLE` and LeadReach automatically offers the next available slot.

**Issue: Booking confirmation emails not sending**

*Cause*: Flow workflow misconfigured or email provider connection down. *Resolution*: Check workflow execution logs at **Settings → Workflows → Executions**. Verify email provider health. Ensure the confirmation email template is active and the sender mailbox has remaining daily quota.

## Cross-References

- [CRM Integration Guide](./crm-integration-guide.md) — Log meetings and booking activities to CRM
- [Email Provider Integration](./email-provider-integration.md) — Insert booking links in email sequences
- [Webhook & Automation Integration](./webhook-automation-integration.md) — Build custom booking-triggered workflows
- [API Reference](./api-reference.md) — Full REST API specification for calendar endpoints
- [Routing & Assignment Best Practices](../sales-ops/routing-assignment-best-practices.md) — Chili Piper routing rule design
- [No-Show Reduction Playbook](../sales-ops/noshow-reduction-playbook.md) — Pre-meeting engagement strategies
