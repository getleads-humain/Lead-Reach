---
title: "Zapier & Make Automation"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [zapier, make, integromat, automation, workflows, no-code]
---

# Zapier & Make Automation

## 1. Overview

LeadReach provides native integration with Zapier and Make (formerly Integromat) to enable no-code workflow automation. Users can create custom automations that connect LeadReach with 5,000+ apps without writing code, enabling powerful workflows like lead routing, CRM sync, Slack notifications, and spreadsheet logging.

## 2. Zapier Integration

### LeadReach Zapier App

LeadReach is available as a public Zapier app with the following triggers and actions:

#### Triggers (LeadReach → Zapier)

| Trigger | Description | Sample Data |
|---------|-------------|-------------|
| New Qualified Lead | When ICP score exceeds threshold | Company, contact, score, insights |
| New Prospect Discovered | When Scout finds a new prospect | Company, signals, source |
| Lead Score Updated | When ICP score changes | Previous score, new score, delta |
| Trigger Event Detected | When a buying signal is found | Event type, company, date |
| Outreach Sequence Sent | When Bard sends a sequence | Sequence ID, channels, contacts |
| Deal Stage Changed | When pipeline stage updates | Previous stage, new stage, deal |

#### Actions (Zapier → LeadReach)

| Action | Description | Required Fields |
|--------|-------------|-----------------|
| Enrich Contact | Trigger Forge enrichment | Email or domain |
| Score Lead | Trigger Judge scoring | Company, contact data |
| Create Prospect | Add to LeadReach pipeline | Company, contact info |
| Start Outreach | Launch Bard sequence | Contact, sequence template |
| Search Knowledge | Query knowledge base | Query string, category |

#### Searches

| Search | Description | Returns |
|--------|-------------|---------|
| Find Company | Look up company in LeadReach | Company profile, score |
| Find Contact | Look up contact | Contact details, engagement |
| Get ICP Score | Retrieve current score | Score, breakdown, grade |

### Popular Zap Templates

#### 1. LeadReach → Salesforce (New Qualified Lead)
```
Trigger: New Qualified Lead (ICP > 80)
→ Action: Create/Update Lead in Salesforce
→ Action: Send Slack Notification
```

#### 2. LeadReach → Google Sheets (Pipeline Tracker)
```
Trigger: New Prospect Discovered
→ Action: Add Row in Google Sheets
  Columns: Company, Contact, ICP Score, Date, Source
```

#### 3. LeadReach → HubSpot (Enrichment Sync)
```
Trigger: Lead Score Updated
→ Filter: Only if score increased by >10
→ Action: Update Contact in HubSpot
→ Action: Add to HubSpot List
```

#### 4. Typeform → LeadReach (Inbound Form Capture)
```
Trigger: New Typeform Entry
→ Action: Create Prospect in LeadReach
→ Action: Enrich Contact
→ Action: Score Lead
→ Filter: If ICP > 70
→ Action: Send Slack Alert
```

#### 5. LeadReach → Mailchimp (Nurture Unqualified)
```
Trigger: New Qualified Lead (ICP < 50)
→ Action: Add to Mailchimp List (Nurture)
→ Trigger: Score Updated > 70
→ Action: Remove from Mailchimp List
→ Action: Add to Salesforce
```

### Zap Configuration Best Practices

1. **Use Filters**: Always add filter steps to prevent unnecessary API calls
2. **Add Delay Steps**: For sequences requiring timing (e.g., follow-up after 24h)
3. **Error Handling**: Set up fallback paths for API failures
4. **Rate Limits**: Stay within LeadReach API limits (100 req/min)
5. **Data Validation**: Use Formatter steps to clean/validate data before sending

## 3. Make (Integromat) Integration

### LeadReach Make Module

LeadReach provides custom Make modules with the following capabilities:

#### Watch Modules (Triggers)

| Module | Polling Interval | Webhook Available |
|--------|-----------------|-------------------|
| Watch Qualified Leads | 15 min | Yes |
| Watch New Prospects | 15 min | Yes |
| Watch Score Changes | 15 min | Yes |
| Watch Trigger Events | 15 min | Yes |

#### Action Modules

| Module | Description |
|--------|-------------|
| Enrich Contact | Trigger Forge enrichment |
| Score Lead | Trigger Judge scoring |
| Create Prospect | Add to pipeline |
| Start Outreach | Launch sequence |
| Search Knowledge | Query knowledge base |
| Get Agent Status | Check agent health |

#### Make Scenario Templates

##### Multi-Channel Lead Routing
```yaml
scenario:
  trigger: Watch Qualified Leads (webhook)
  router:
    - path: enterprise
      filter: employee_count > 500 AND icp_score > 80
      actions:
        - Create Salesforce Lead
        - Send Slack Alert (#enterprise-leads)
        - Start Outreach (executive-sequence)
    - path: mid-market
      filter: employee_count 50-500 AND icp_score > 70
      actions:
        - Create HubSpot Contact
        - Send Slack Alert (#mid-market-leads)
        - Start Outreach (standard-sequence)
    - path: nurture
      filter: icp_score < 70
      actions:
        - Add to Mailchimp List
        - Log to Google Sheets
```

##### Daily Pipeline Report
```yaml
scenario:
  trigger: Schedule (daily 8:00 AM)
  actions:
    - Get Pipeline Summary (LeadReach)
    - Aggregate by stage
    - Create Slack message (rich format)
    - Send to #pipeline-daily
```

## 4. Webhook Configuration

### Outbound Webhooks (LeadReach → External)

```json
{
  "url": "https://hooks.zapier.com/hooks/catch/12345/abcdef/",
  "events": ["lead.qualified", "trigger.detected"],
  "payload_template": {
    "event": "{{event_type}}",
    "company": "{{company_name}}",
    "contact": "{{contact_email}}",
    "icp_score": "{{icp_score}}",
    "timestamp": "{{timestamp}}"
  },
  "retry_policy": {
    "max_retries": 3,
    "backoff": "exponential"
  }
}
```

### Inbound Webhooks (External → LeadReach)

```bash
curl -X POST https://app.leadreach.ai/api/webhooks/inbound   -H "X-Webhook-Secret: whsec_abc123"   -d '{
    "source": "zapier",
    "event": "form_submission",
    "data": {
      "email": "prospect@company.com",
      "company": "Acme Corp",
      "source": "website_contact_form"
    }
  }'
```

## 5. Rate Limits & Error Handling

| Platform | Free Tier | Paid Tier |
|----------|-----------|-----------|
| Zapier | 100 tasks/mo | Unlimited |
| Make | 1,000 ops/mo | 10,000+ ops/mo |
| LeadReach API | 100 req/min | 500 req/min |

### Error Handling Pattern

```yaml
error_handling:
  - condition: api_timeout
    action: retry_with_backoff
    max_retries: 3
  - condition: rate_limited (429)
    action: wait_60_seconds_then_retry
  - condition: validation_error (400)
    action: log_error_and_skip
    notification: email
  - condition: server_error (5xx)
    action: retry_3_times_then_alert
```

## 6. Setup Guide

### Zapier Setup
1. Go to zapier.com and log in
2. Click "Create Zap"
3. Select LeadReach as trigger app
4. Connect LeadReach account (API key)
5. Select trigger event
6. Configure action app and action
7. Test and activate

### Make Setup
1. Go to make.com and log in
2. Click "Create Scenario"
3. Add LeadReach module as first step
4. Connect via API key
5. Configure watch/action parameters
6. Add additional modules
7. Set schedule and activate
