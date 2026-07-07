---
title: "Email Provider Integration — Outreach, Salesloft, Gmail & SMTP Configuration"
category: integration
grade: A
last_reviewed: "2026-07-03"
tags:
  - email
  - outreach
  - salesloft
  - gmail
  - smtp
  - deliverability
  - forge
  - echo
  - bard
  - integration
  - oauth2
---

# Email Provider Integration

## Overview

LeadReach's email provider integration powers the outbound communication engine at the heart of B2B lead engagement. Whether you use Outreach for sales sequencing, Salesloft for cadence management, or native Gmail via OAuth, LeadReach orchestrates email delivery, tracks engagement signals (opens, clicks, replies), and feeds those signals back into the agent scoring loop. This integration is what transforms static lead lists into living, responsive conversations.

The email integration layer abstracts away provider-specific APIs behind a unified interface, enabling LeadReach agents—particularly Forge and Bard—to compose, send, and track emails without coupling to any single provider. You can switch from Outreach to Salesloft (or use both simultaneously for different teams) without reconfiguring campaigns or retraining agents. The architecture also supports fallback routing: if your primary provider's API returns a transient error, LeadReach automatically retries through a secondary provider or falls back to direct SMTP delivery.

Deliverability is a first-class concern. The integration includes built-in domain authentication (SPF, DKIM, DMARC) validation, sender reputation monitoring, and intelligent throttling that respects per-provider rate limits and per-mailbox daily send caps. These safeguards ensure your outreach lands in the primary inbox—not the spam folder—preserving both sender reputation and pipeline velocity.

## Architecture & Data Flow

### Email Delivery Pipeline

```
┌─────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────────┐
│  Bard Agent  │────▶│  Template      │────▶│  Send        │────▶│  Email        │
│  (Compose)   │     │  Renderer      │     │  Orchestrator │     │  Provider API │
└─────────────┘     └────────────────┘     └──────────────┘     └───────────────┘
                                                    │                     │
                                                    ▼                     ▼
┌─────────────┐     ┌────────────────┐     ┌──────────────┐     ┌───────────────┐
│  Forge Agent │────▶│  Sequence      │────▶│  Throttle &  │────▶│  Tracking     │
│  (Cadence)   │     │  Scheduler     │     │  Rate Limiter │     │  Pixel/Links  │
└─────────────┘     └────────────────┘     └──────────────┘     └───────────────┘
                                                                            │
                                                                            ▼
                                                                  ┌───────────────┐
                                                                  │  Echo Agent   │
                                                                  │  (Engagement) │
                                                                  └───────────────┘
```

### Provider Abstraction Layer

Each email provider implements the `EmailProviderAdapter` interface:

| Method                  | Description                                          |
|-------------------------|------------------------------------------------------|
| `send(message)`         | Send a single email message                          |
| `send_batch(messages)`  | Send multiple messages (provider-specific batching)  |
| `get_send_status(id)`   | Retrieve delivery status for a sent message          |
| `list_sequences()`      | List available sequences/cadences                    |
| `add_to_sequence(id)`   | Add a contact to a sequence/cadence                  |
| `remove_from_sequence()`| Remove a contact from a sequence                     |
| `get_analytics(id)`     | Retrieve engagement analytics for a message/sequence |
| `validate_connection()` | Verify credentials and connectivity                  |

### Engagement Tracking

LeadReach tracks three tiers of engagement signals:

1. **Send-level**: Delivered, Bounced (soft/hard), Deferred
2. **Open-level**: Opened (with timestamp, IP, device), Open count, Last open time
3. **Interaction-level**: Clicked (URL + timestamp), Replied (thread ID + sentiment), Unsubscribed, Marked as Spam

All signals are ingested via webhook callbacks (for Outreach/Salesloft) or Gmail API push notifications (for Gmail), normalized to a common schema, and published to the LeadReach event bus.

## Configuration Guide

### Outreach Integration

1. **Create an Outreach API Application** at Outreach → Settings → Integrations → API Applications.
   - Request scopes: `sequences.read`, `sequences.write`, `mailings.send`, `prospects.read`, `prospects.write`, `analytics.read`
   - Redirect URI: `https://api.leadreach.io/v1/oauth/callback/outreach`

2. **Configure OAuth 2.0** in LeadReach:
   - Navigate to **Settings → Integrations → Email → Add Provider**
   - Select **Outreach**
   - Enter Client ID and Client Secret
   - Click **Authorize** to complete the OAuth flow

3. **Configure sender mailboxes**:
   ```json
   {
     "provider": "outreach",
     "mailboxes": [
       {
         "email": "sarah.johnson@acmecorp.com",
         "display_name": "Sarah Johnson",
         "daily_send_limit": 200,
         "min_interval_seconds": 45,
         "warmup_enabled": true,
         "warmup_daily_cap": 50
       },
       {
         "email": "mike.chen@acmecorp.com",
         "display_name": "Mike Chen",
         "daily_send_limit": 150,
         "min_interval_seconds": 60,
         "warmup_enabled": false
       }
     ]
   }
   ```

4. **Map sequences**: Link Outreach sequences to LeadReach campaign templates under **Settings → Integrations → Email → Sequence Mapping**.

### Salesloft Integration

1. **Create a Salesloft API Key** at Salesloft → Settings → API → New API Key with scopes: `cadences:read`, `cadences:write`, `people:read`, `people:write`, `emails:send`, `analytics:read`.

2. **Configure in LeadReach**:
   - Navigate to **Settings → Integrations → Email → Add Provider → Salesloft**
   - Paste API key and select your Salesloft instance region (`us` or `eu`)
   - Click **Validate**

3. **Configure cadence mapping**:
   ```json
   {
     "provider": "salesloft",
     "cadence_mappings": [
       {
         "leadreach_campaign_id": "camp_a1b2c3",
         "salesloft_cadence_id": "cad_987654",
         "default_step": 1,
         "auto_remove_on_reply": true,
         "failure_action": "pause_cadence"
       }
     ]
   }
   ```

### Gmail Integration (Direct)

1. **Enable Gmail API** in Google Cloud Console.
2. **Create OAuth 2.0 credentials** with redirect URI `https://api.leadreach.io/v1/oauth/callback/gmail`.
3. **Scopes required**: `https://www.googleapis.com/auth/gmail.send`, `https://www.googleapis.com/auth/gmail.readonly`, `https://www.googleapis.com/auth/gmail.modify`
4. **Configure in LeadReach** under **Settings → Integrations → Email → Gmail**.
5. **Set per-mailbox sending limits** (Gmail has a hard limit of 500/day for consumer, 2000/day for Workspace).

### Domain Authentication Setup

Before sending, verify your domain's email authentication:

```bash
# Validate SPF
leadreach integrations email validate-spf --domain acmecorp.com

# Validate DKIM
leadreach integrations email validate-dkim --domain acmecorp.com --selector leadreach

# Validate DMARC
leadreach integrations email validate-dmarc --domain acmecorp.com

# Full deliverability audit
leadreach integrations email deliverability-audit --domain acmecorp.com
```

Expected DNS records:

| Record  | Name                        | Value                                                    |
|---------|-----------------------------|----------------------------------------------------------|
| SPF     | `acmecorp.com`              | `v=spf1 include:outreach.io include:leadreach.io ~all`   |
| DKIM    | `leadreach._domainkey.acmecorp.com` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3...`       |
| DMARC   | `_dmarc.acmecorp.com`       | `v=DMARC1; p=none; rua=mailto:dmarc@acmecorp.com`       |

## API Endpoints & Payloads

### Send Email

```
POST /v1/integrations/email/send
```

**Request:**

```json
{
  "idempotency_key": "email_20260703_sarah_jd_001",
  "provider": "outreach",
  "mailbox_id": "mbx_sarah_johnson",
  "recipient": {
    "email": "j.doe@targetcompany.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Target Company"
  },
  "content": {
    "subject": "{{first_name}}, quick question about {{company}}'s Q3 pipeline",
    "body_html": "<p>Hi {{first_name}},</p><p>I noticed {{company}} is expanding into...</p>",
    "body_text": "Hi {{first_name}},\n\nI noticed {{company}} is expanding into...",
    "template_id": "tpl_intro_v3"
  },
  "tracking": {
    "open_tracking": true,
    "click_tracking": true,
    "tracking_domain": "e.acmecorp.com"
  },
  "schedule": {
    "send_at": "2026-07-03T14:30:00Z",
    "timezone": "America/New_York"
  },
  "metadata": {
    "campaign_id": "camp_a1b2c3",
    "agent_id": "forge",
    "sequence_step": 2
  }
}
```

**Response (202 Accepted):**

```json
{
  "message_id": "msg_9f4e2b1a7c3d",
  "idempotency_key": "email_20260703_sarah_jd_001",
  "provider_message_id": "outreach_msg_876543",
  "status": "scheduled",
  "scheduled_at": "2026-07-03T14:30:00Z",
  "tracking": {
    "open_tracking_pixel": "https://e.acmecorp.io/t/o/msg_9f4e2b1a7c3d",
    "click_tracking_prefix": "https://e.acmecorp.io/t/c/msg_9f4e2b1a7c3d/"
  }
}
```

### Add to Sequence

```
POST /v1/integrations/email/sequences/{sequence_id}/add
```

**Request:**

```json
{
  "provider": "outreach",
  "prospects": [
    {
      "email": "j.doe@targetcompany.com",
      "first_name": "John",
      "last_name": "Doe",
      "company": "Target Company",
      "title": "VP of Sales",
      "custom_fields": {
        "territory": "WEST",
        "lead_score": 87
      }
    }
  ],
  "start_at_step": 1,
  "sender_mailbox_id": "mbx_sarah_johnson",
  "idempotency_key": "seq_add_20260703_001"
}
```

**Response (202 Accepted):**

```json
{
  "batch_id": "batch_a3b4c5d6",
  "sequence_id": "seq_outreach_12345",
  "added_count": 1,
  "skipped_count": 0,
  "skipped_reasons": []
}
```

### Get Engagement Analytics

```
GET /v1/integrations/email/analytics?campaign_id=camp_a1b2c3&start_date=2026-06-01&end_date=2026-07-03
```

**Response (200 OK):**

```json
{
  "campaign_id": "camp_a1b2c3",
  "period": { "start": "2026-06-01", "end": "2026-07-03" },
  "summary": {
    "sent": 4521,
    "delivered": 4398,
    "bounced": 123,
    "opened": 1876,
    "open_rate": 0.426,
    "clicked": 312,
    "click_rate": 0.071,
    "replied": 198,
    "reply_rate": 0.045,
    "unsubscribed": 14,
    "marked_spam": 3
  },
  "by_mailbox": [
    {
      "mailbox": "sarah.johnson@acmecorp.com",
      "sent": 2310,
      "open_rate": 0.451,
      "reply_rate": 0.052
    },
    {
      "mailbox": "mike.chen@acmecorp.com",
      "sent": 2088,
      "open_rate": 0.398,
      "reply_rate": 0.037
    }
  ],
  "by_day": [
    { "date": "2026-07-01", "sent": 210, "opened": 89, "replied": 11 },
    { "date": "2026-07-02", "sent": 195, "opened": 83, "replied": 9 },
    { "date": "2026-07-03", "sent": 180, "opened": 72, "replied": 8 }
  ]
}
```

### Webhook: Engagement Event

Outreach/Salesloft send engagement webhooks to LeadReach's receiver endpoint:

```
POST /v1/integrations/email/webhooks/{provider}
```

**Outreach Open Event Payload:**

```json
{
  "event": "email.opened",
  "timestamp": "2026-07-03T15:22:11Z",
  "data": {
    "message_id": "outreach_msg_876543",
    "prospect_email": "j.doe@targetcompany.com",
    "mailbox_email": "sarah.johnson@acmecorp.com",
    "sequence_id": "seq_12345",
    "sequence_step": 2,
    "ip_address": "203.0.113.42",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "open_count": 3,
    "first_opened_at": "2026-07-03T14:35:00Z"
  },
  "signature": "sha256=abc123def456..."
}
```

## Authentication & Security

### OAuth 2.0 (Outreach, Gmail)

LeadReach follows the OAuth 2.0 Authorization Code flow for Outreach and Gmail:

- **Token encryption**: All tokens encrypted at rest with AES-256-GCM via AWS KMS.
- **Refresh rotation**: Outreach refresh tokens are long-lived; LeadReach refreshes access tokens automatically 10 minutes before expiry. Gmail tokens use Google's offline access model.
- **Scope minimization**: Only the minimum required scopes are requested during authorization. Additional scopes require re-authorization.

### API Key (Salesloft)

Salesloft uses static API keys. Keys are stored encrypted and rotated every 90 days via automated key rotation. Old keys are revoked only after the new key is confirmed active.

### Sender Identity Verification

LeadReach enforces sender identity verification to prevent spoofing:

- Each mailbox must be verified via a confirmation email before it can be used for sending.
- Custom tracking domains must have DKIM records properly configured before activation.
- LeadReach rejects sends from mailboxes that fail DMARC alignment checks.

### Content Security

- All email templates are scanned for malicious content (script injection, phishing patterns) before rendering.
- URLs in emails are validated against a domain blocklist (known malware/phishing domains).
- Unsubscribe links are mandatory in all outbound emails. LeadReach auto-appends `List-Unsubscribe` headers per CAN-SPAM and GDPR requirements.

## Error Handling & Retry Logic

### Email-Specific Error Codes

| Error Code                | Description                                       | Retryable | Action                        |
|---------------------------|---------------------------------------------------|-----------|-------------------------------|
| `MAILBOX_LIMIT_REACHED`   | Daily send cap for mailbox exceeded               | Yes       | Queue until next day reset    |
| `PROVIDER_RATE_LIMITED`   | Provider API rate limit hit                       | Yes       | Exponential backoff           |
| `RECIPIENT_BOUNCED`       | Hard bounce (invalid email)                       | No        | Mark lead as unreachable      |
| `RECIPIENT_DEFERRED`      | Soft bounce (temporary)                           | Yes       | Retry after 4 hours           |
| `CONTENT_REJECTED`        | Provider rejected content (spam flag)             | No        | Alert + manual review         |
| `AUTH_EXPIRED`            | OAuth token expired                               | Yes       | Auto-refresh token            |
| `SEQUENCE_FULL`           | Sequence/cadence at maximum capacity              | Yes       | Queue + alert admin           |
| `DUPLICATE_PROSPECT`      | Prospect already in sequence                      | No        | Skip (idempotent)             |
| `TEMPLATE_RENDER_ERROR`   | Variable interpolation failed                     | No        | Alert + fallback to plain text|

### Retry Strategy for Email Sends

```
Retry policy: Exponential backoff with jitter
Base delay: 30 seconds
Multiplier: 2
Max delay: 4 hours
Max retries: 8
Jitter: ±15%
Cooldown between retries to same recipient: 4 hours minimum
```

### Dead Letter Queue

Permanently failed sends are moved to the DLQ after exhausting retries. DLQ records include:

```json
{
  "dlq_id": "dlq_e5f6a7b8c9",
  "original_message_id": "msg_9f4e2b1a7c3d",
  "error_code": "RECIPIENT_BOUNCED",
  "error_message": "550 5.1.1 User unknown",
  "recipient": "j.doe@targetcompany.com",
  "provider": "outreach",
  "failed_at": "2026-07-03T14:32:00Z",
  "retry_count": 8,
  "last_retry_at": "2026-07-04T06:15:00Z"
}
```

## LeadReach Agent Integration

| Agent   | Email Integration Usage                                                                              |
|---------|------------------------------------------------------------------------------------------------------|
| **Forge** | Primary consumer: manages sequence enrollment, controls send cadences, handles A/B test routing across mailboxes. Reads engagement data to trigger next-step actions (e.g., if opened 3x but no reply, add to "hot lead" cadence). |
| **Bard** | Template engine: generates subject lines, body copy, and personalization variables. Submits templates for rendering and preview. A/B tests subject line variants. |
| **Echo** | Engagement tracker: ingests all open/click/reply webhooks, normalizes events, publishes to the event bus. Correlates multi-touch engagement to build per-lead engagement timelines. Updates lead scores in real-time based on engagement velocity. |
| **Sage** | Uses engagement signals as scoring inputs: reply rate by domain, open rate by persona, click-through rate by content type. Adjusts lead fit and intent scores dynamically. |
| **Atlas** | Account-level aggregation: rolls up email engagement to the account level, identifying "hot accounts" where multiple contacts are engaging. Triggers account-based plays. |
| **Flow** | Automation triggers: "If reply received → create CRM task → notify account owner → pause sequence." Handles conditional branching based on email engagement events. |

Agents **Scout** and **Judge** do not directly interact with the email integration layer.

## Monitoring & Observability

### Key Metrics

| Metric                                  | Type    | Alert Threshold                     |
|-----------------------------------------|---------|--------------------------------------|
| `email.send.throughput`                 | Gauge   | < 50 sends/min (degraded)            |
| `email.bounce.rate`                     | Gauge   | > 5% over 1-hour window              |
| `email.delivery.latency.p99`            | Gauge   | > 10 seconds                         |
| `email.open_rate.rolling_7d`            | Gauge   | < 15% (deliverability issue)          |
| `email.reply_rate.rolling_7d`           | Gauge   | < 2% (content quality issue)         |
| `email.spam_complaint.rate`             | Gauge   | > 0.1% (critical — sender at risk)   |
| `email.provider.api_errors`             | Counter | > 10 in 5 minutes                    |
| `email.dlq.size`                        | Gauge   | > 50 records                         |
| `email.mailbox.quota_utilization`       | Gauge   | > 85% daily send limit               |

### Health Check Endpoint

```
GET /v1/integrations/email/health
```

```json
{
  "overall_status": "healthy",
  "providers": {
    "outreach": {
      "status": "healthy",
      "auth_expires_at": "2026-07-04T14:00:00Z",
      "api_latency_ms": 230,
      "daily_quota_used_pct": 42
    },
    "gmail": {
      "status": "healthy",
      "auth_expires_at": "2026-07-04T14:00:00Z",
      "api_latency_ms": 180,
      "daily_quota_used_pct": 28
    }
  },
  "deliverability": {
    "spf_valid": true,
    "dkim_valid": true,
    "dmarc_valid": true,
    "sender_score": 95
  }
}
```

### Alerting

| Alert                                | Severity | Channel              |
|--------------------------------------|----------|----------------------|
| Spam complaint rate > 0.1%           | Critical | PagerDuty + Slack    |
| Bounce rate > 10%                    | Critical | PagerDuty + Slack    |
| Provider API errors > 10/5min        | Warning  | Slack                |
| Mailbox quota > 90%                  | Warning  | Slack                |
| Open rate < 10% over 7 days          | Info     | Email digest         |

## Troubleshooting

**Issue: Emails landing in spam folder**

*Diagnosis*: Run `leadreach integrations email deliverability-audit --domain acmecorp.com`. Check SPF, DKIM, DMARC alignment. Review sender score at `https://senderscore.org`. *Resolution*: Fix DNS records, warm up new mailboxes (start at 20 emails/day, increase by 10% daily), avoid URL shorteners, minimize HTML complexity.

**Issue: Outreach sequences not enrolling prospects**

*Diagnosis*: Check sequence capacity in Outreach UI. Verify the mapped sequence ID matches an active sequence. *Resolution*: Ensure sequence is in "Active" state in Outreach. Verify the LeadReach mailbox user has sequence edit permissions. Check for `DUPLICATE_PROSPECT` errors in the integration log.

**Issue: Gmail API returning `429 Rate Limit`**

*Diagnosis*: Gmail enforces 250 emails/day for push notification watchers and per-second quotas. *Resolution*: Reduce concurrent send threads. Enable batch sending mode (batches of 50). Implement per-mailbox queuing with 1-second minimum intervals.

**Issue: Engagement webhooks not received**

*Diagnosis*: Verify webhook URL is accessible (`curl -X POST https://api.leadreach.io/v1/integrations/email/webhooks/outreach`). Check webhook signature validation. *Resolution*: Re-register the webhook in Outreach/Salesloft settings. Ensure LeadReach's IP allowlist includes the provider's webhook source IPs.

**Issue: Template variable interpolation fails**

*Diagnosis*: Check the template for undefined variables (e.g., `{{company}}` when the lead has no company). *Resolution*: Use default values: `{{company | default: "your company"}}`. Verify lead data completeness before sequence enrollment.

## Cross-References

- [CRM Integration Guide](./crm-integration-guide.md) — Sync email engagement data to CRM activity timelines
- [Calendar & Booking Integration](./calendar-booking-integration.md) — Insert booking links into email sequences
- [Webhook & Automation Integration](./webhook-automation-integration.md) — Build custom workflows triggered by email engagement
- [API Reference](./api-reference.md) — Full REST API specification for email endpoints
- [Deliverability Best Practices](../email-deliverability/deliverability-best-practices.md) — SPF/DKIM/DMARC configuration and sender reputation management
- [Template Design Guide](../content-generation/template-design-guide.md) — Email template syntax, personalization variables, and A/B testing
