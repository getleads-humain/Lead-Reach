#!/usr/bin/env python3
"""Generate remaining knowledge base files for LeadReach."""
import os

KNOWLEDGE_DIR = "/home/z/my-project/knowledge"

def write_file(rel_path, content):
    full_path = os.path.join(KNOWLEDGE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w') as f:
        f.write(content)
    print(f"  Created: {rel_path} ({len(content.splitlines())} lines)")

# ── INTEGRATIONS ──────────────────────────────────────────────

write_file("integrations/salesforce-integration.md", """---
title: "Salesforce Integration"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [salesforce, crm, sfdc, integration, api, oauth]
---

# Salesforce Integration

## 1. Overview

LeadReach integrates with Salesforce CRM to provide bidirectional data synchronization between the LeadReach agent pipeline and Salesforce objects. This integration enables sales teams to leverage AI-generated insights directly within their existing CRM workflow, while ensuring that LeadReach agents have access to the latest account and contact data from Salesforce.

## 2. Authentication

### OAuth 2.0 Configuration

LeadReach uses Salesforce OAuth 2.0 for secure authentication:

| Parameter | Value |
|-----------|-------|
| Auth URL | `https://login.salesforce.com/services/oauth2/authorize` |
| Token URL | `https://login.salesforce.com/services/oauth2/token` |
| Scope | `api refresh_token offline_access` |
| Callback URL | `https://app.leadreach.ai/api/integrations/salesforce/callback` |

### Connected App Setup

1. Navigate to Setup > App Manager > New Connected App
2. Set callback URL to LeadReach callback endpoint
3. Enable OAuth scopes: api, refresh_token, offline_access
4. Set consumer key and secret in LeadReach integration settings
5. Test connection via LeadReach integration health check

### Token Refresh

- Access tokens expire every 1 hour
- Refresh tokens are used automatically by LeadReach
- If refresh fails, re-authorization is required
- Monitor token health via `/api/integrations/salesforce/health`

## 3. Data Synchronization

### Lead Sync (LeadReach → Salesforce)

| LeadReach Field | Salesforce Field | Direction |
|-----------------|------------------|-----------|
| company_name | Company | LR → SF |
| contact_email | Email | LR → SF |
| contact_name | FirstName + LastName | LR → SF |
| icp_score | LeadReach_ICP_Score__c | LR → SF |
| agent_insights | LeadReach_Insights__c | LR → SF |
| lead_source | LeadSource | LR → SF |
| engagement_score | LeadReach_Engagement__c | LR → SF |

### Contact Sync (Bidirectional)

| LeadReach Field | Salesforce Field | Direction |
|-----------------|------------------|-----------|
| email | Email | Bidirectional |
| phone | Phone | Bidirectional |
| title | Title | Bidirectional |
| department | Department | Bidirectional |
| linkedin_url | LinkedIn_URL__c | Bidirectional |
| last_activity | Last_Activity_Date__c | SF → LR |
| owner_id | OwnerId | SF → LR |

### Opportunity Sync (Salesforce → LeadReach)

| Salesforce Field | LeadReach Field | Direction |
|------------------|-----------------|-----------|
| Id | sf_opportunity_id | SF → LR |
| Amount | deal_value | SF → LR |
| StageName | pipeline_stage | SF → LR |
| CloseDate | expected_close_date | SF → LR |
| Probability | win_probability | SF → LR |
| Type | deal_type | SF → LR |

### Account Sync (Bidirectional)

| LeadReach Field | Salesforce Field | Direction |
|-----------------|------------------|-----------|
| company_domain | Website | Bidirectional |
| employee_count | NumberOfEmployees | Bidirectional |
| industry | Industry | Bidirectional |
| annual_revenue | AnnualRevenue | Bidirectional |
| technographic | Tech_Stack__c | LR → SF |
| intent_signals | Intent_Signals__c | LR → SF |

## 4. API Integration Patterns

### REST API (Real-time)

```python
# Example: Create lead in Salesforce from LeadReach
import requests

def create_sf_lead(access_token, instance_url, lead_data):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        'Company': lead_data['company_name'],
        'Email': lead_data['contact_email'],
        'FirstName': lead_data['first_name'],
        'LastName': lead_data['last_name'],
        'LeadSource': 'LeadReach AI',
        'LeadReach_ICP_Score__c': lead_data['icp_score'],
        'LeadReach_Insights__c': lead_data['agent_insights'],
    }
    response = requests.post(
        f'{instance_url}/services/data/v59.0/sobjects/Lead',
        headers=headers,
        json=payload
    )
    return response.json()
```

### Bulk API 2.0 (Batch Operations)

For large-scale data sync (>200 records), LeadReach uses Salesforce Bulk API 2.0:

1. Create a job via `POST /services/data/v59.0/jobs/ingest`
2. Upload data via `PUT /jobs/ingest/{jobId}/batches`
3. Close job via `PATCH /jobs/ingest/{jobId}`
4. Monitor via `GET /jobs/ingest/{jobId}`

### Streaming API (Real-time Events)

LeadReach subscribes to Salesforce PushTopics for real-time updates:
- Lead conversion events
- Opportunity stage changes
- Account updates
- Task completion events

## 5. Custom Objects

### LeadReach Activity Log

| Field | Type | Description |
|-------|------|-------------|
| LeadReach_Activity__c | Custom Object | Tracks all LeadReach agent activities |
| Agent_Name__c | Picklist | Atlas, Scout, Forge, Sage, Judge, Bard, Flow, Echo |
| Activity_Type__c | Picklist | Enrichment, Scoring, Outreach, Qualification |
| Activity_Details__c | Long Text | JSON details of agent action |
| Related_Lead__c | Lookup(Lead) | Associated Lead |
| Related_Contact__c | Lookup(Contact) | Associated Contact |
| Related_Account__c | Lookup(Account) | Associated Account |
| Activity_Timestamp__c | DateTime | When activity occurred |

## 6. Workflow Integration

### Lead Routing Rules

When LeadReach qualifies a lead, the following Salesforce flow is triggered:

1. LeadReach sends qualification event to Salesforce
2. Salesforce Flow evaluates ICP score and assigns to appropriate sales rep
3. Task is created for assigned rep with LeadReach insights
4. Notification sent via Slack/Email to rep
5. LeadReach monitors follow-up activity via Salesforce events

### Escalation Rules

| Condition | Action |
|-----------|--------|
| ICP Score > 85 + No response in 24h | Escalate to Sales Manager |
| Hot lead + Assigned rep offline | Route to pool |
| Enterprise lead + No stage change in 7d | Alert VP Sales |
| LeadReach disqualification overridden | Flag for review |

## 7. Rate Limits & Best Practices

| API Type | Rate Limit | Recommendation |
|----------|-----------|---------------|
| REST API | 100,000/day | Use for real-time individual operations |
| Bulk API 2.0 | 5,000 jobs/24h | Use for batch syncs > 200 records |
| Streaming | 20 PushTopics | Subscribe only to essential events |
| Composite API | 25 subqueries/call | Use for related object creation |

### Optimization Strategies

1. **Batch Operations**: Group multiple record operations into composite or collection API calls
2. **Caching**: Cache frequently accessed metadata (picklist values, record types) locally
3. **Incremental Sync**: Use `LastModifiedDate` for delta syncs instead of full refreshes
4. **Error Handling**: Implement exponential backoff for API limit errors (HTTP 503)
5. **Field-Level Security**: Respect Salesforce FLS; check accessibility before writing

## 8. Data Quality

### Deduplication Rules

LeadReach applies the following dedup rules before writing to Salesforce:

1. Email match: Exact match on Email field (primary)
2. Domain + Name: Company domain + contact name (secondary)
3. Salesforce ID: Direct SF ID match if previously synced
4. Matching rules respect Salesforce duplicate rules configuration

### Data Enrichment Flow

1. Scout discovers new prospect
2. Forge enriches with firmographic/technographic data
3. Judge scores against ICP
4. If score > threshold, sync to Salesforce as new Lead
5. If existing Lead/Contact, update with enrichment data
6. Sage research generates account insights attached as Activity

## 9. Monitoring & Troubleshooting

### Health Check Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/integrations/salesforce/health` | Connection status, token validity |
| `/api/integrations/salesforce/sync-status` | Last sync timestamp, record counts |
| `/api/integrations/salesforce/errors` | Recent error log |

### Common Issues

| Issue | Cause | Resolution |
|-------|-------|------------|
| 401 Unauthorized | Token expired | Re-authorize via OAuth flow |
| 400 Bad Request | Missing required field | Check field mapping config |
| 503 Service Unavailable | API limit exceeded | Wait and retry with backoff |
| Entity is deleted | SF record deleted | Update LeadReach reference |
| INSUFFICIENT_ACCESS | FLS or sharing rule | Check user permissions |

## 10. Security Considerations

- All data in transit encrypted via TLS 1.3
- OAuth tokens stored encrypted at rest
- API access restricted to named credentials
- Field-level security respected per Salesforce profiles
- Audit trail maintained in LeadReach Activity Log
- PII handling complies with GDPR/CCPA requirements
- Integration user follows least-privilege principle
""")

write_file("integrations/hubspot-integration.md", """---
title: "HubSpot Integration"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [hubspot, crm, integration, api, contacts, deals]
---

# HubSpot Integration

## 1. Overview

LeadReach integrates with HubSpot CRM to enable marketing and sales teams using HubSpot to leverage AI-driven prospecting, enrichment, and outreach directly within their HubSpot environment. This integration supports bidirectional contact and deal synchronization, list management, and engagement tracking.

## 2. Authentication

### OAuth 2.0 Setup

| Parameter | Value |
|-----------|-------|
| Auth URL | `https://app.hubspot.com/oauth/authorize` |
| Token URL | `https://api.hubapi.com/oauth/v1/token` |
| Scopes | `contacts crm.objects.contacts.read crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write` |
| Redirect URI | `https://app.leadreach.ai/api/integrations/hubspot/callback` |

### Private App Token (Alternative)

For enterprise customers preferring server-to-server auth:
1. Create Private App in HubSpot Settings > Integrations > Private Apps
2. Assign required scopes
3. Copy access token to LeadReach integration settings
4. Token does not expire unless revoked

## 3. Object Mapping

### Contacts

| LeadReach Field | HubSpot Property | Direction |
|-----------------|------------------|-----------|
| email | email | Bidirectional |
| first_name | firstname | Bidirectional |
| last_name | lastname | Bidirectional |
| company | company | Bidirectional |
| phone | phone | Bidirectional |
| job_title | jobtitle | Bidirectional |
| icp_score | leadreach_icp_score | LR → HS |
| agent_insights | leadreach_insights | LR → HS |
| last_enriched | leadreach_last_enriched | LR → HS |

### Companies

| LeadReach Field | HubSpot Property | Direction |
|-----------------|------------------|-----------|
| domain | domain | Bidirectional |
| name | name | Bidirectional |
| industry | industry | Bidirectional |
| employee_count | numberofemployees | Bidirectional |
| annual_revenue | annualrevenue | Bidirectional |
| technographic | leadreach_tech_stack | LR → HS |
| intent_score | leadreach_intent_score | LR → HS |

### Deals

| HubSpot Property | LeadReach Field | Direction |
|------------------|-----------------|-----------|
| dealname | deal_name | Bidirectional |
| amount | deal_value | Bidirectional |
| dealstage | pipeline_stage | Bidirectional |
| closedate | expected_close_date | Bidirectional |
| pipeline | pipeline_name | HS → LR |
| hubspot_owner_id | owner_id | HS → LR |

## 4. API Integration

### Contacts API

```python
# Create or update contact in HubSpot
import requests

def upsert_hubspot_contact(access_token, contact_data):
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    payload = {
        'properties': {
            'email': contact_data['email'],
            'firstname': contact_data['first_name'],
            'lastname': contact_data['last_name'],
            'company': contact_data['company'],
            'leadreach_icp_score': contact_data['icp_score'],
            'leadreach_insights': contact_data['agent_insights'],
        }
    }
    # Use email as dedup key
    response = requests.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        headers=headers,
        json=payload
    )
    return response.json()
```

### Batch Operations

For bulk syncs, HubSpot Batch API supports up to 100 records per call:
- `POST /crm/v3/objects/contacts/batch/create`
- `POST /crm/v3/objects/contacts/batch/update`
- `POST /crm/v3/objects/contacts/batch/upsert`

### List Management

LeadReach can dynamically manage HubSpot lists:
1. Auto-add ICP-qualified contacts to Active List
2. Remove disqualified contacts automatically
3. Create segment-specific lists for campaign targeting
4. Sync list membership based on engagement signals

## 5. Engagement Tracking

### Activity Sync

| Activity Type | HubSpot Event | Sync Direction |
|---------------|---------------|---------------|
| Email sent | Email send event | LR → HS |
| Email opened | Email open event | LR → HS |
| Email clicked | Email click event | LR → HS |
| Meeting booked | Meeting event | Bidirectional |
| Call completed | Call event | Bidirectional |
| Web visit | Page view event | LR → HS |

### Timeline Integration

LeadReach agent activities appear on the HubSpot contact timeline:
- Agent enrichment results
- ICP score changes
- Qualification decisions
- Outreach activities
- Research summaries

## 6. Workflow Triggers

### LeadReach → HubSpot Automations

| Trigger | HubSpot Action |
|---------|----------------|
| ICP Score > 80 | Add to Hot Leads list + Notify owner |
| New prospect discovered | Create contact + Enroll in sequence |
| Qualification complete | Update deal stage + Create task |
| Engagement spike | Trigger re-engagement workflow |
| Agent finds trigger event | Update company notes + Alert team |

### HubSpot → LeadReach Triggers

| HubSpot Event | LeadReach Action |
|---------------|------------------|
| Form submission | Enrich contact via Forge agent |
| Meeting booked | Update pipeline via Flow agent |
| Deal stage change | Recalculate forecast via Echo agent |
| Contact property change | Re-score via Judge agent |

## 7. Rate Limits

| API Tier | Limit | Burst |
|----------|-------|-------|
| Free/Starter | 100 req/10sec | 100 |
| Professional | 150 req/10sec | 150 |
| Enterprise | 200 req/10sec | 200 |

### Best Practices

1. Use batch APIs for bulk operations
2. Implement exponential backoff on 429 errors
3. Cache contact IDs to avoid duplicate lookups
4. Use webhooks for real-time updates instead of polling
5. Respect HubSpot subscription types for email compliance

## 8. Setup Guide

1. Navigate to Settings > Integrations in LeadReach
2. Click "Connect HubSpot"
3. Authorize via OAuth or paste Private App token
4. Configure field mapping
5. Set sync direction preferences
6. Enable workflow triggers
7. Run initial data sync
8. Verify in HubSpot that LeadReach properties are visible
9. Configure list management rules
10. Test end-to-end workflow with sample contact

## 9. Troubleshooting

| Issue | Resolution |
|-------|------------|
| 401 Unauthorized | Re-authorize OAuth token |
| 409 Conflict | Contact exists; use update instead of create |
| 429 Rate Limited | Implement backoff; reduce sync frequency |
| Property not found | Create custom property in HubSpot first |
| Sync lag | Check webhook delivery; verify API health |

## 10. Data Security

- OAuth tokens encrypted at rest (AES-256)
- Data in transit secured via TLS 1.3
- Integration respects HubSpot portal data boundaries
- PII handling per GDPR/CCPA compliance
- Activity audit log maintained for 90 days
- Integration user follows least-privilege principle
""")

write_file("integrations/slack-teams-integration.md", """---
title: "Slack & Microsoft Teams Integration"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [slack, teams, notifications, alerts, messaging, real-time]
---

# Slack & Microsoft Teams Integration

## 1. Overview

LeadReach integrates with Slack and Microsoft Teams to deliver real-time notifications about high-value prospect activities, agent insights, and pipeline events directly into team communication channels. This ensures that sales teams never miss critical moments and can take immediate action on AI-identified opportunities.

## 2. Slack Integration

### App Configuration

1. Create Slack App at api.slack.com/apps
2. Enable Incoming Webhooks
3. Enable Bot Token Scopes: `chat:write`, `channels:read`, `groups:read`
4. Install App to Workspace
5. Copy Bot Token (xoxb-) to LeadReach settings
6. Invite @LeadReach bot to desired channels

### Webhook Setup

```json
{
  "channel": "#leadreach-alerts",
  "username": "LeadReach AI",
  "icon_emoji": ":zap:",
  "text": "🔥 Hot Lead Alert"
}
```

### Notification Types

| Notification | Channel | Priority |
|-------------|---------|----------|
| Hot lead identified | #hot-leads | 🔴 Critical |
| ICP score > 85 | #qualified-leads | 🟠 High |
| Trigger event detected | #trigger-events | 🟡 Medium |
| Agent enrichment complete | #enrichment-updates | 🔵 Low |
| Daily pipeline digest | #pipeline-summary | ⚪ Info |
| Deal at risk alert | #deal-risk | 🔴 Critical |

### Message Format

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🔥 Hot Lead: Acme Corp"
      }
    },
    {
      "type": "section",
      "fields": [
        {"type": "mrkdwn", "text": "*ICP Score:* 92/100"},
        {"type": "mrkdwn", "text": "*Contact:* Jane Smith, CTO"},
        {"type": "mrkdwn", "text": "*Trigger:* Series C funding announced"},
        {"type": "mrkdwn", "text": "*Est. ACV:* $150K"}
      ]
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "View in LeadReach"},
          "url": "https://app.leadreach.ai/leads/acme-corp"
        },
        {
          "type": "button",
          "text": {"type": "plain_text", "text": "Start Outreach"},
          "action_id": "start_outreach"
        }
      ]
    }
  ]
}
```

### Interactive Actions

| Action | Description |
|--------|-------------|
| View in LeadReach | Opens lead profile in browser |
| Start Outreach | Triggers Bard agent to begin sequence |
| Enrich Contact | Triggers Forge agent for additional data |
| Schedule Meeting | Opens calendar booking flow |
| Dismiss | Marks alert as reviewed |

## 3. Microsoft Teams Integration

### App Registration

1. Register app in Azure AD > App Registrations
2. Configure redirect URI: `https://app.leadreach.ai/api/integrations/teams/callback`
3. Add API permissions: `Team.ReadBasic.All`, `Channel.ReadBasic.All`, `ChatMessage.Send`
4. Grant admin consent
5. Copy Application ID and Secret to LeadReach settings

### Webhook (Incoming Webhook)

1. In Teams channel, click ... > Connectors > Incoming Webhook
2. Name: "LeadReach AI"
3. Copy webhook URL to LeadReach settings

### Adaptive Card Format

```json
{
  "type": "AdaptiveCard",
  "version": "1.4",
  "body": [
    {
      "type": "Container",
      "style": "emphasis",
      "items": [
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "🔥 Hot Lead Alert",
                  "weight": "Bolder",
                  "size": "Large"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "FactSet",
      "facts": [
        {"title": "Company", "value": "Acme Corp"},
        {"title": "ICP Score", "value": "92/100"},
        {"title": "Contact", "value": "Jane Smith, CTO"},
        {"title": "Trigger", "value": "Series C funding"},
        {"title": "Est. ACV", "value": "$150K"}
      ]
    }
  ],
  "actions": [
    {
      "type": "Action.OpenUrl",
      "title": "View in LeadReach",
      "url": "https://app.leadreach.ai/leads/acme-corp"
    }
  ]
}
```

### Channel Routing

| Team | Channel | Alert Type |
|------|---------|------------|
| Sales | hot-leads | ICP > 85 |
| Sales | deal-alerts | Stage changes |
| Marketing | mql-alerts | MQL conversions |
| SDR | prospecting | New prospects |
| Leadership | daily-digest | Summary |

## 4. Alert Configuration

### Routing Rules

```yaml
alert_rules:
  - name: hot_lead
    conditions:
      - icp_score >= 85
      - lead_status == "new"
    channels:
      - slack: "#hot-leads"
      - teams: "Sales>hot-leads"
    priority: critical
    cooldown: 4h  # Don't re-alert for same company within 4h

  - name: trigger_event
    conditions:
      - trigger_type IN [funding, executive_change, expansion]
    channels:
      - slack: "#trigger-events"
    priority: high
    cooldown: 24h

  - name: deal_at_risk
    conditions:
      - deal_stage == "negotiation"
      - days_in_stage > 14
      - no_activity_days > 5
    channels:
      - slack: "#deal-risk"
      - teams: "Sales>deal-risk"
    priority: critical
    cooldown: 0h  # Always alert
```

### Digest Configuration

| Digest | Frequency | Channel | Content |
|--------|-----------|---------|---------|
| Daily Pipeline | 8:00 AM | #pipeline-summary | Pipeline changes, new leads |
| Weekly Performance | Monday 9:00 AM | #weekly-review | Agent metrics, KPIs |
| Real-time Hot | Immediate | #hot-leads | ICP > 85 leads |

## 5. Rate Limits

| Platform | Limit | Recommendation |
|----------|-------|---------------|
| Slack Webhook | 1 msg/sec/channel | Batch non-urgent alerts |
| Slack API | 1 req/sec (Tier 2) | Use async posting |
| Teams Webhook | 100 msg/min | Batch within 1-second windows |
| Teams API | 30 req/30sec | Cache channel IDs |

## 6. Setup Guide

### Slack Setup (5 minutes)

1. LeadReach Settings > Integrations > Slack
2. Click "Add to Slack"
3. Select workspace and channels
4. Configure alert routing rules
5. Test with sample notification

### Teams Setup (10 minutes)

1. LeadReach Settings > Integrations > Microsoft Teams
2. Click "Connect Teams"
3. Admin consent for Azure AD app
4. Select team and channels
5. Configure adaptive card templates
6. Test with sample notification

## 7. Troubleshooting

| Issue | Cause | Resolution |
|-------|-------|------------|
| No notifications | Bot not in channel | Invite @LeadReach to channel |
| 403 Forbidden | Missing scope | Re-install with correct scopes |
| Rate limited | Too many messages | Add cooldown rules |
| Card rendering error | Invalid Adaptive Card | Validate JSON schema |
| Duplicate alerts | Missing dedup rule | Add cooldown configuration |
""")

write_file("integrations/zapier-automation.md", """---
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
curl -X POST https://app.leadreach.ai/api/webhooks/inbound \
  -H "X-Webhook-Secret: whsec_abc123" \
  -d '{
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
""")

write_file("integrations/apollo-zoominfo-integration.md", """---
title: "Apollo & ZoomInfo Integration"
category: integration
grade: A
last_reviewed: 2026-07-08
tags: [apollo, zoominfo, data-provider, enrichment, contact-data, intent]
---

# Apollo & ZoomInfo Integration

## 1. Overview

LeadReach integrates with Apollo.io and ZoomInfo as primary data enrichment providers, supplying firmographic, technographic, contact, and intent data to power the Forge and Scout agents. These integrations enable LeadReach to enrich prospect records with verified contact data, detect buying intent signals, and maintain data quality across the pipeline.

## 2. Apollo.io Integration

### API Configuration

| Parameter | Value |
|-----------|-------|
| Base URL | `https://api.apollo.io/v1` |
| Auth | API Key (header: `Api-Key`) |
| Rate Limit | 50 req/min (Growth), 200 req/min (Enterprise) |

### Key Endpoints

#### People Search
```python
# Search for contacts matching ICP criteria
import requests

def search_apollo_contacts(api_key, criteria):
    headers = {'Api-Key': api_key}
    params = {
        'organization_domains': criteria.get('domains', []),
        'person_titles': criteria.get('titles', ['VP', 'Director', 'CTO', 'CRO']),
        'person_seniorities': criteria.get('seniorities', ['VP', 'C-Suite', 'Director']),
        'organization_num_employees_ranges': criteria.get('employee_range', ['501-1000']),
        'organization_industries': criteria.get('industries', ['SaaS', 'FinTech']),
        'page': 1,
        'per_page': 100,
    }
    response = requests.get(
        'https://api.apollo.io/v1/people/search',
        headers=headers,
        params=params
    )
    return response.json()
```

#### Organization Enrichment
```python
def enrich_apollo_organization(api_key, domain):
    headers = {'Api-Key': api_key}
    params = {'domain': domain}
    response = requests.get(
        'https://api.apollo.io/v1/organizations/enrich',
        headers=headers,
        params=params
    )
    return response.json()
```

### Data Fields Available

| Category | Fields | Quality |
|----------|--------|---------|
| Contact | Email (verified), Phone, LinkedIn URL | High |
| Firmographic | Revenue, Employees, Industry, Funding | High |
| Technographic | Tech stack (limited), Cloud provider | Medium |
| Intent | Buyer intent topics (premium tier) | Medium |
| Sequences | Email sequence management | High |

### LeadReach → Apollo Sync

1. Scout identifies target companies via ICP criteria
2. LeadReach queries Apollo for contacts matching persona
3. Forge enriches with verified email/phone
4. Judge scores enriched records against ICP
5. Qualified records added to LeadReach pipeline

## 3. ZoomInfo Integration

### API Configuration

| Parameter | Value |
|-----------|-------|
| Base URL | `https://api.zoominfo.com/v2` |
| Auth | OAuth 2.0 (jwt_token endpoint) |
| Rate Limit | 100 req/min (Standard), 500 req/min (Advanced) |

### Authentication Flow

```python
import requests

def get_zoominfo_token(username, password):
    response = requests.post(
        'https://api.zoominfo.com/v2/authenticate',
        json={'username': username, 'password': password}
    )
    return response.json()['jwt_token']
```

### Key Endpoints

#### Company Search
```python
def search_zoominfo_companies(token, criteria):
    headers = {'Authorization': f'Bearer {token}'}
    payload = {
        'companyName': criteria.get('name'),
        'revenue': criteria.get('revenue_range'),
        'employeeCount': criteria.get('employee_range'),
        'industry': criteria.get('industry'),
        'location': criteria.get('location'),
        'techStack': criteria.get('tech_stack'),
    }
    response = requests.post(
        'https://api.zoominfo.com/v2/company/search',
        headers=headers,
        json=payload
    )
    return response.json()
```

#### Contact Lookup
```python
def lookup_zoominfo_contact(token, email=None, company_id=None):
    headers = {'Authorization': f'Bearer {token}'}
    payload = {}
    if email:
        payload['email'] = email
    if company_id:
        payload['companyId'] = company_id
    response = requests.post(
        'https://api.zoominfo.com/v2/contact/search',
        headers=headers,
        json=payload
    )
    return response.json()
```

### Data Fields Available

| Category | Fields | Quality |
|----------|--------|---------|
| Contact | Email, Direct Dial, Mobile, LinkedIn | Very High |
| Firmographic | Revenue, Employees, HQ, Subsidiaries | Very High |
| Technographic | Full tech stack, Install dates | High |
| Intent | Buying intent (Scoops), Topic-level | Very High |
| News | Scoops (trigger events), Company news | Very High |
| Org Chart | Reporting structure, Decision makers | High |

### Intent Data Integration

ZoomInfo intent (Scoops) provides real-time buying signals:

| Signal Type | Description | LeadReach Mapping |
|-------------|-------------|-------------------|
| Technology Install | New tech deployment detected | technographic_update |
| Leadership Change | New executive hire | trigger_event |
| Funding Round | New investment received | trigger_event (high priority) |
| Office Expansion | New location opened | expansion_signal |
| Contract Award | Government contract won | trigger_event |
| M&A Activity | Merger or acquisition | trigger_event (critical) |

## 4. Data Deduplication Strategy

When enriching from multiple providers, LeadReach applies:

1. **Primary Key Match**: Email address exact match
2. **Domain + Name Match**: Company domain + contact full name
3. **LinkedIn URL Match**: Normalized LinkedIn profile URL
4. **Confidence Scoring**: When data conflicts, use highest-confidence source

### Confidence Hierarchy

| Source | Contact Data | Firmographic | Intent | Technographic |
|--------|-------------|-------------|--------|--------------|
| ZoomInfo | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★ |
| Apollo | ★★★★ | ★★★★ | ★★★ | ★★★ |
| LinkedIn | ★★★★ | ★★★ | ★★ | ★★ |
| Web Scraping | ★★ | ★★★ | ★★★ | ★★★ |

## 5. Enrichment Workflow

### Forge Agent Enrichment Pipeline

1. **Initial Enrichment** (Apollo): Fast contact + firmographic data
2. **Deep Enrichment** (ZoomInfo): Verified contact + intent signals
3. **Cross-Validation**: Compare data from both providers
4. **Confidence Score**: Calculate per-field confidence
5. **Update Pipeline**: Push enriched data to CRM

### Automated Re-Enrichment

| Trigger | Action |
|---------|--------|
| New company in pipeline | Immediate Apollo enrichment |
| ICP score > 60 | ZoomInfo deep enrichment |
| 30 days since last enrichment | Re-enrich via Apollo |
| Trigger event detected | Re-enrich via ZoomInfo |
| Contact data stale > 90 days | Full re-enrichment |

## 6. Cost Optimization

| Provider | Cost/Contact | Cost/Enrichment | Recommended Use |
|----------|-------------|-----------------|-----------------|
| Apollo | $0.01-0.05 | $0.05-0.10 | Volume contact search |
| ZoomInfo | $0.10-0.50 | $0.25-0.75 | High-value deep enrichment |

### Optimization Rules

1. Use Apollo for initial volume prospecting (cheaper)
2. Use ZoomInfo for qualified leads (higher quality)
3. Cache enriched data for 30 days to avoid re-fetching
4. Only re-enrich when data is stale or trigger events occur
5. Set credit limits per agent to control costs

## 7. Monitoring

| Metric | Apollo | ZoomInfo |
|--------|--------|----------|
| API calls today | Dashboard > Usage | Dashboard > API Usage |
| Credits remaining | Settings > Plan | Settings > Credits |
| Error rate | < 1% target | < 0.5% target |
| Avg response time | < 2s | < 3s |
| Data accuracy | 85%+ | 95%+ |
""")

# ── PRODUCT FILES ──────────────────────────────────────────────

write_file("product/ai-agent-orchestration.md", """---
title: "AI Agent Orchestration"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [ai, agents, orchestration, pipeline, workflow, automation]
---

# AI Agent Orchestration

## 1. Overview

LeadReach's AI Agent Orchestration layer coordinates eight specialized AI agents (Atlas, Scout, Forge, Sage, Judge, Bard, Flow, Echo) in a structured pipeline that mirrors the B2B sales process. Each agent has a defined role, domain expertise, and communication protocol, enabling the system to autonomously discover, enrich, qualify, engage, and track leads from identification to closed-won.

## 2. Agent Pipeline Architecture

### Pipeline Flow

```
Atlas (Strategy)
  ↓ Define ICP, targets, markets
Scout (Discovery)
  ↓ Find matching prospects
Forge (Enrichment)
  ↓ Enrich contact/company data
Sage (Research)
  ↓ Deep account intelligence
Judge (Qualification)
  ↓ Score and qualify
Bard (Engagement)
  ↓ Generate outreach sequences
Flow (Pipeline)
  ↓ Manage deal progression
Echo (Reporting)
  ↓ Analytics and optimization
```

### Agent Definitions

| Agent | Role | Input | Output | Triggers |
|-------|------|-------|--------|----------|
| Atlas | Strategic Planning | Market context, business goals | ICP definitions, target lists | User request, quarterly review |
| Scout | Prospect Discovery | ICP criteria, target parameters | Raw prospect lists | Atlas output, user request |
| Forge | Data Enrichment | Prospect records (raw) | Enriched records | Scout output, CRM import |
| Sage | Account Research | Company domain, contact info | Research reports, talking points | Forge output, user request |
| Judge | Lead Qualification | Enriched records + research | Qualified scores, decisions | Forge/Sage output |
| Bard | Outreach Generation | Qualified leads, templates | Personalized sequences | Judge output, user request |
| Flow | Pipeline Management | Qualified leads, activities | Pipeline state, forecasts | Bard output, CRM events |
| Echo | Analytics & Reporting | Pipeline data, activities | Reports, insights, alerts | Scheduled, user request |

## 3. Orchestration Engine

### Task Decomposition

When a user submits a request, the orchestration engine:

1. Parses intent into structured task
2. Maps task to agent sequence
3. Determines parallel vs sequential execution
4. Sets quality gates between stages
5. Monitors execution and handles failures

### Execution Patterns

| Pattern | Agents | Use Case |
|---------|--------|----------|
| Sequential | A → B → C | Full pipeline: discovery → enrichment → qualification |
| Parallel | A + B → C | Enrichment + Research simultaneously → Qualification |
| Conditional | A → [B if X, C if Y] | Score > 80: outreach, Score < 80: nurture |
| Iterative | A → B → A | Research → Enrich → Re-research |
| Fan-out | A → [B, C, D] | Strategy → [Discover, Research, Analyze] |

### Quality Gates

| Gate | Condition | Pass Action | Fail Action |
|------|-----------|-------------|-------------|
| Discovery | Min 10 prospects found | Proceed to enrichment | Expand search criteria |
| Enrichment | >60% fields populated | Proceed to research | Flag for manual review |
| Research | Key insights identified | Proceed to qualification | Skip to basic qualification |
| Qualification | ICP score computed | Route to appropriate path | Send to nurture |
| Engagement | Personalization verified | Send sequence | Revise messaging |

## 4. Agent Communication Protocol

### Message Format

```json
{
  "message_id": "uuid",
  "from_agent": "scout",
  "to_agent": "forge",
  "message_type": "task_result",
  "timestamp": "2026-07-08T10:00:00Z",
  "payload": {
    "prospects": [
      {
        "company": "Acme Corp",
        "domain": "acme.com",
        "estimated_employees": 500,
        "industry": "SaaS"
      }
    ]
  },
  "metadata": {
    "pipeline_id": "pipeline_abc123",
    "parent_task": "task_xyz789",
    "priority": "high"
  }
}
```

### Agent Memory System

Each agent maintains a memory store with:

| Memory Type | Retention | Purpose |
|-------------|-----------|---------|
| Working Memory | Current task | Active processing context |
| Short-term | 24 hours | Recent results, in-progress data |
| Long-term | Permanent | Learned patterns, preferences |
| Shared Memory | 30 days | Cross-agent communication context |

### Memory Sharing Protocol

1. Agent completes task → writes results to shared memory
2. Downstream agent reads from shared memory before starting
3. Conflicts resolved by timestamp (latest wins)
4. Critical fields require explicit acknowledgment

## 5. Agent Customization

### Configuration Options

| Setting | Default | Range | Description |
|---------|---------|-------|-------------|
| `icp_strictness` | 0.7 | 0.1-1.0 | How strictly to apply ICP criteria |
| `enrichment_depth` | standard | basic/standard/deep | How much data to enrich |
| `outreach_style` | professional | casual/professional/executive | Tone of generated content |
| `max_daily_outreach` | 50 | 10-200 | Max outreach actions per day |
| `qualification_threshold` | 70 | 0-100 | Minimum ICP score to qualify |
| `research_breadth` | focused | focused/comprehensive | How deep to research accounts |

### Custom Instructions

Users can provide custom instructions to each agent:

```yaml
atlas:
  custom_instruction: "Focus on fintech companies in APAC with >100 employees"
  market_priorities: ["fintech", "healthtech", "saas"]
  
scout:
  custom_instruction: "Prioritize companies showing hiring signals for sales roles"
  search_channels: ["linkedin", "job_boards", "news"]
  
bard:
  custom_instruction: "Use concise, value-driven messaging. Never use exclamation marks."
  sequence_length: 5
  channels: ["email", "linkedin"]
```

## 6. Error Handling & Fallback

### Failure Modes

| Failure | Agent | Detection | Fallback |
|---------|-------|-----------|----------|
| API timeout | Forge | >30s response | Retry with cached data |
| Rate limited | Scout | HTTP 429 | Queue and retry after cooldown |
| Data not found | Sage | Empty result | Return partial research |
| Scoring error | Judge | Score outside 0-100 | Use heuristic fallback |
| Sequence failure | Bard | Email bounce | Try alternative channel |
| Pipeline error | Flow | State inconsistency | Reset to last known good state |

### Circuit Breaker Pattern

Each agent has a circuit breaker:
- **Closed**: Normal operation
- **Open**: After 5 consecutive failures, stop for 5 minutes
- **Half-Open**: Try one request; if success, close; if fail, stay open

## 7. Monitoring & Observability

### Agent Health Dashboard

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Task completion rate | >95% | <90% |
| Average task duration | <30s | >60s |
| Error rate | <2% | >5% |
| Queue depth | <50 | >100 |
| Memory usage | <80% | >90% |

### Pipeline Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| End-to-end latency | <5 min | Discovery to qualified lead |
| Throughput | >100 prospects/day | Full pipeline processed |
| Quality score | >0.8 | Accuracy of agent outputs |
| Cost per lead | <$2.00 | Total API + compute cost |
""")

write_file("product/lead-scoring-engine.md", """---
title: "Lead Scoring Engine"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [lead-scoring, scoring, qualification, prioritization, model, ai]
---

# Lead Scoring Engine

## 1. Overview

LeadReach's Lead Scoring Engine, powered by the Judge agent, uses a multi-dimensional scoring model that combines firmographic fit, technographic alignment, intent signals, and engagement data to produce a composite ICP score (0-100). The scoring model is continuously refined through feedback loops and A/B testing to optimize conversion prediction accuracy.

## 2. Scoring Dimensions

### Dimension Weights

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Firmographic Fit | 35% | Company size, industry, revenue, location |
| Technographic Alignment | 20% | Technology stack compatibility |
| Intent Signals | 20% | Buying intent and trigger events |
| Engagement Level | 15% | Interaction depth and recency |
| BANT Overlay | 10% | Budget, Authority, Need, Timeline signals |

### Firmographic Scoring (0-35)

| Criterion | Max Points | Scoring Rules |
|-----------|-----------|---------------|
| Industry Match | 10 | Exact ICP industry: 10, Adjacent: 5, Other: 0 |
| Employee Count | 8 | In ICP range: 8, Adjacent: 4, Outside: 0 |
| Revenue Range | 7 | In ICP range: 7, Adjacent: 3, Unknown: 2 |
| Geography | 5 | Target region: 5, Adjacent: 2, Other: 0 |
| Company Stage | 5 | Ideal stage: 5, Compatible: 2, Other: 0 |

### Technographic Scoring (0-20)

| Criterion | Max Points | Scoring Rules |
|-----------|-----------|---------------|
| Tech Stack Match | 8 | Uses complementary tech: 8, Neutral: 4, Competing: 0 |
| Cloud Provider | 4 | Same cloud: 4, Compatible: 2, Unknown: 1 |
| Integration Potential | 4 | High: 4, Medium: 2, Low: 0 |
| Tech Maturity | 4 | Early adopter: 4, Mainstream: 2, Laggard: 0 |

### Intent Scoring (0-20)

| Signal Type | Max Points | Decay |
|-------------|-----------|-------|
| Third-party intent topic match | 8 | 10% per week |
| Website visit (pricing page) | 5 | 20% per week |
| Content download | 4 | 15% per week |
| Job posting (relevant role) | 3 | No decay (event-based) |

### Engagement Scoring (0-15)

| Activity | Points | Decay |
|----------|--------|-------|
| Email opened | 1 | 5% per day |
| Email clicked | 2 | 5% per day |
| Meeting booked | 5 | 10% per week |
| Demo requested | 4 | No decay |
| Reply received | 3 | 5% per day |

### BANT Overlay (0-10)

| Factor | Points | Detection Method |
|--------|--------|-----------------|
| Budget | 3 | Funding signals, company size, spend indicators |
| Authority | 3 | Title seniority, decision-maker signals |
| Need | 2 | Pain points mentioned, competitor usage |
| Timeline | 2 | Trigger events, contract renewal dates |

## 3. Score Interpretation

| Score Range | Grade | Classification | Action |
|-------------|-------|---------------|--------|
| 90-100 | A+ | Hot Lead | Immediate outreach, priority routing |
| 80-89 | A | Qualified Lead | Fast-track outreach, assigned rep |
| 70-79 | B | Warm Lead | Standard outreach cadence |
| 60-69 | C | Nurture Lead | Long-term nurture campaign |
| 50-59 | D | Low Priority | Light nurture, periodic check |
| 0-49 | F | Disqualified | Archive, monitor for changes |

## 4. Model Training

### Training Data

- Historical win/loss data from CRM
- Conversion outcomes by score range
- Agent feedback on lead quality
- Rep activity and outcome data

### Model Types

| Model | Use Case | Update Frequency |
|-------|----------|-----------------|
| Rule-based | Default scoring | Manual updates |
| Logistic Regression | Simple conversion prediction | Monthly |
| Gradient Boosted Trees | Multi-dimensional scoring | Weekly |
| Neural Network | Complex pattern detection | Daily (online learning) |

### A/B Testing

LeadReach supports A/B testing of scoring models:
1. Route 50% of leads through Model A, 50% through Model B
2. Measure conversion rate by score range
3. Statistical significance test (p < 0.05)
4. Promote winner to production

## 5. Custom Scoring Rules

Users can define custom scoring overrides:

```yaml
custom_rules:
  - name: "enterprise_boost"
    condition: employee_count > 1000
    action: add_score(10)
    
  - name: "competitor_penalty"
    condition: uses_competitor == true
    action: add_score(-15)
    
  - name: "trigger_event_boost"
    condition: trigger_event == "funding_round"
    action: add_score(20)
    
  - name: "stale_engagement_decay"
    condition: last_engagement_days > 30
    action: multiply_score(0.8)
```

## 6. Integration Points

| Integration | Direction | Data |
|-------------|-----------|------|
| Scout → Judge | Input | Raw prospect data |
| Forge → Judge | Input | Enrichment data |
| Sage → Judge | Input | Research insights |
| Judge → Bard | Output | Qualified leads + scores |
| Judge → CRM | Output | Score updates |
| Judge → Flow | Output | Pipeline routing |
| CRM → Judge | Feedback | Win/loss outcomes |

## 7. Monitoring

| Metric | Target | Alert |
|--------|--------|-------|
| Scoring accuracy | >75% (A-grades convert) | <65% |
| Score distribution | Bell curve centered at 60 | Skewed >80% below 40 |
| Model drift | <5% per month | >10% per month |
| Processing time | <2 seconds per lead | >5 seconds |
| False positive rate | <20% | >30% |
""")

write_file("product/outreach-automation.md", """---
title: "Outreach Automation Engine"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [outreach, automation, sequences, cadence, email, linkedin, personalization]
---

# Outreach Automation Engine

## 1. Overview

LeadReach's Outreach Automation Engine, powered by the Bard agent, generates highly personalized, multi-channel outreach sequences that combine email, LinkedIn, and phone touchpoints. The engine leverages AI-driven personalization, send-time optimization, and compliance guardrails to maximize response rates while maintaining deliverability.

## 2. Sequence Builder

### Sequence Architecture

Each outreach sequence consists of:

| Component | Description |
|-----------|-------------|
| Template | Base message structure with personalization tokens |
| Triggers | When and how to send each step |
| Channels | Email, LinkedIn, Phone |
| Timing | Delays between steps |
| Conditions | Branching logic based on engagement |
| Fallback | Alternative path if primary fails |

### Personalization Engine

The Bard agent personalizes each message using:

| Data Source | Personalization Type | Example |
|-------------|---------------------|---------|
| Company research | Industry-specific pain points | "As a fintech scaling post-Series B..." |
| Contact role | Role-relevant value props | "...help VPs of Sales hit quota faster" |
| Trigger events | Timely context | "Congrats on the Series C..." |
| Technographic | Tech-specific integration | "Since you use Salesforce..." |
| Recent activity | Engagement-aware | "I noticed your team downloaded our..." |

### Personalization Tokens

```
{{company_name}}          - Target company name
{{contact_first_name}}   - Prospect first name
{{contact_title}}        - Job title
{{industry_pain_point}}  - AI-generated industry pain point
{{trigger_event}}        - Recent trigger event reference
{{tech_integration}}     - Relevant tech stack reference
{{competitor_mention}}   - Competitor displacement angle
{{value_proposition}}    - ICP-aligned value prop
```

## 3. Multi-Channel Orchestration

### Channel Sequencing

```
Day 1:  LinkedIn connection request
Day 2:  Email #1 (first touch)
Day 4:  LinkedIn message (if connected)
Day 5:  Email #2 (value-add follow-up)
Day 8:  Phone call attempt #1
Day 10: Email #3 (social proof)
Day 14: Email #4 (breakup)
```

### Send-Time Optimization

| Channel | Best Day | Best Time (recipient TZ) | Worst Time |
|---------|----------|--------------------------|------------|
| Email | Tue-Thu | 8:00-10:00 AM | Mon 8 AM, Fri 5 PM |
| LinkedIn | Tue-Wed | 7:00-9:00 AM | Weekend |
| Phone | Tue-Thu | 10:00-11:30 AM | Mon AM, Fri PM |

### A/B Testing Framework

| Element | Testable | Sample Size Needed |
|---------|----------|-------------------|
| Subject line | Yes | 100 per variant |
| CTA | Yes | 150 per variant |
| Channel mix | Yes | 200 per variant |
| Send time | Yes | 100 per time slot |
| Sequence length | Yes | 200 per variant |
| Personalization depth | Yes | 150 per variant |

## 4. Compliance Guardrails

### Email Compliance

| Rule | Implementation |
|------|---------------|
| CAN-SPAM | Unsubscribe link in every email, physical address included |
| GDPR | Consent verification before EU prospects, DPO contact |
| CASL | Express/implied consent check for Canadian prospects |
| CCPA | Opt-out mechanism, data usage disclosure |

### Frequency Limits

| Channel | Max per prospect | Max per day (per rep) |
|---------|-----------------|----------------------|
| Email | 1 per day, 6 per sequence | 100 |
| LinkedIn | 1 per day, 3 per week | 20 connection requests |
| Phone | 1 per day, 3 per sequence | 30 calls |

### Do-Not-Contact Lists

- Global DNC list maintained in LeadReach
- Automatic suppression of bounced emails
- Opt-out processing within 24 hours
- Salesforce DNC sync for consistency
- Compliance audit trail for all outreach

## 5. Deliverability Management

### Email Infrastructure

| Component | Configuration |
|-----------|---------------|
| Sending domains | Dedicated per customer |
| IP addresses | Dedicated IPs (warm-up required) |
| Authentication | SPF, DKIM, DMARC configured |
| Warm-up | 14-day gradual ramp-up for new IPs |
| Monitoring | Real-time bounce/complaint tracking |

### Deliverability Scoring

| Factor | Weight | Target |
|--------|--------|--------|
| Bounce rate | 30% | <2% |
| Spam complaint rate | 25% | <0.1% |
| Authentication pass rate | 20% | 100% |
| Engagement rate | 15% | >5% open rate |
| List hygiene score | 10% | >90% valid emails |

## 6. Performance Analytics

### Key Metrics

| Metric | Definition | Benchmark |
|--------|------------|-----------|
| Open rate | Unique opens / delivered | 25-35% |
| Click rate | Unique clicks / delivered | 2-5% |
| Reply rate | Replies / delivered | 5-15% |
| Meeting booked rate | Meetings / replies | 20-30% |
| Sequence completion rate | Completed / started | 40-60% |
| Opt-out rate | Unsubscribes / delivered | <0.5% |

### Attribution

LeadReach tracks multi-touch attribution:
1. First-touch: Sequence that initiated contact
2. Last-touch: Final action before conversion
3. Multi-touch: Weighted contribution across all touches
4. Channel attribution: Which channel drove the response
""")

write_file("product/analytics-dashboard.md", """---
title: "Analytics Dashboard"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [analytics, dashboard, reporting, metrics, kpi, visualization]
---

# Analytics Dashboard

## 1. Overview

LeadReach's Analytics Dashboard provides real-time visibility into pipeline health, agent performance, outreach effectiveness, and revenue forecasting. The dashboard aggregates data from all eight AI agents and external integrations to present actionable insights for sales leaders, SDR managers, and individual contributors.

## 2. Dashboard Sections

### 2.1 Pipeline Overview

| Widget | Data Source | Update Frequency |
|--------|-----------|-----------------|
| Pipeline value by stage | Flow agent | Real-time |
| New leads this week | Scout + Judge | Hourly |
| Conversion funnel | All agents | Daily |
| Average deal cycle | Flow + CRM | Daily |
| Pipeline coverage ratio | Flow + CRM | Real-time |

### 2.2 Agent Performance

| Metric | Atlas | Scout | Forge | Sage | Judge | Bard | Flow | Echo |
|--------|-------|-------|-------|------|-------|------|------|------|
| Tasks completed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Success rate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Avg duration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Error rate | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cost per task | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 2.3 Outreach Performance

| Metric | Description | Visualization |
|--------|-------------|---------------|
| Email open rate | Unique opens / delivered | Line chart (7/30/90 day) |
| Reply rate | Replies / delivered | Bar chart by sequence |
| Meeting rate | Meetings / replies | Funnel chart |
| Channel comparison | Email vs LinkedIn vs Phone | Grouped bar chart |
| Best send times | Opens by hour/day | Heatmap |

### 2.4 Revenue Forecasting

| Widget | Description | Data Source |
|--------|-------------|-------------|
| Weighted pipeline | Deal value × probability | Flow + CRM |
| Forecast by month | Expected close date distribution | Flow + CRM |
| Coverage gap | Quota vs weighted pipeline | CRM |
| Win rate trend | Close-won rate over time | CRM |
| Average deal size | ACV by segment | CRM |

## 3. Custom Report Builder

### Report Types

| Type | Parameters | Output |
|------|-----------|--------|
| Pipeline Report | Date range, team, stage | Table + chart |
| Agent Report | Agent, date range, task type | Table + metrics |
| Sequence Report | Sequence, date range | Performance table |
| Territory Report | Region, industry | Heatmap + table |
| Executive Summary | Date range | KPI cards + trend |

### Export Options

- CSV download for all tabular data
- PDF export for executive reports
- Scheduled email delivery (daily/weekly/monthly)
- API access for custom integrations
- Slack/Teams delivery for real-time alerts

## 4. Alert Configuration

### Pre-built Alerts

| Alert | Condition | Channel |
|-------|-----------|---------|
| Pipeline below quota | Coverage < 3x | Email + Slack |
| Hot lead idle | Qualified lead no activity > 24h | Slack |
| Deal at risk | Stage stuck > 14 days | Email |
| Agent failure | Error rate > 5% | Email + PagerDuty |
| Daily digest | Every morning 8 AM | Email |

### Custom Alert Rules

```yaml
alert:
  name: "enterprise_deal_alert"
  condition: "deal_value > 100000 AND pipeline_stage == 'negotiation'"
  action: 
    - notify: ["vp-sales@company.com"]
    - channel: "#enterprise-deals"
  frequency: "immediate"
  cooldown: 3600
```

## 5. Data Architecture

| Source | Retention | Refresh |
|--------|-----------|---------|
| Agent events | 90 days | Real-time |
| CRM data | 2 years | 15 min sync |
| Outreach data | 1 year | Real-time |
| Aggregated metrics | 3 years | Daily rollup |
| Custom reports | 1 year | On-demand |

## 6. API Access

### Analytics API Endpoints

```
GET  /api/analytics/pipeline          - Pipeline overview
GET  /api/analytics/agents             - Agent performance
GET  /api/analytics/outreach           - Outreach metrics
GET  /api/analytics/forecast           - Revenue forecast
GET  /api/analytics/kpis               - KPI definitions and values
POST /api/analytics/reports/custom     - Generate custom report
GET  /api/analytics/reports/{id}       - Download report
```
""")

write_file("product/enterprise-security.md", """---
title: "Enterprise Security & Compliance"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [security, compliance, enterprise, soc2, encryption, gdpr, access-control]
---

# Enterprise Security & Compliance

## 1. Security Architecture

### Infrastructure

| Component | Configuration |
|-----------|---------------|
| Cloud Provider | AWS (us-east-1, eu-west-1) |
| Compute | ECS Fargate (isolated containers) |
| Database | RDS PostgreSQL (encrypted at rest) |
| Cache | ElastiCache Redis (encryption in transit) |
| Storage | S3 (SSE-S3 + SSE-KMS) |
| CDN | CloudFront (TLS 1.3) |
| WAF | AWS WAF with managed rule sets |
| DDoS | AWS Shield Advanced |

### Network Security

- VPC isolation with private subnets for application and database tiers
- Security groups enforcing least-privilege network access
- No direct internet access to database or cache tiers
- VPN required for administrative access
- API traffic routed through CloudFront + WAF

## 2. Data Encryption

### At Rest

| Data Type | Encryption Method | Key Management |
|-----------|-------------------|---------------|
| Database | AES-256 (RDS) | AWS KMS (customer-managed keys available) |
| File storage | AES-256 (S3 SSE-KMS) | AWS KMS |
| Backups | AES-256 | AWS KMS |
| Secrets | AES-256 | AWS Secrets Manager |
| API keys | AES-256 | HashiCorp Vault |

### In Transit

| Connection | Protocol | Certificate |
|------------|----------|-------------|
| Browser ↔ LeadReach | TLS 1.3 | DigiCert EV |
| API ↔ LeadReach | TLS 1.3 | DigiCert |
| LeadReach ↔ CRM | TLS 1.3 | Platform-managed |
| LeadReach ↔ Data Providers | TLS 1.3 | Provider-managed |
| Internal services | mTLS | Internal CA |

## 3. Access Control

### Authentication

| Method | Support | MFA |
|--------|---------|-----|
| Email + Password | Yes | Required |
| Google SSO | Yes | Inherited |
| Microsoft SSO | Yes | Inherited |
| SAML 2.0 | Yes (Enterprise) | Inherited from IdP |
| API Keys | Yes | N/A (scoped access) |

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| Admin | Full access, user management, billing |
| Sales Manager | Team pipeline, reports, agent config |
| SDR | Own pipeline, outreach, contacts |
| Marketing | Campaigns, templates, analytics (read) |
| Analyst | Read-only analytics and reports |
| API User | Programmatic access (scoped) |

### Data Access Policies

- Row-level security: Users see only their team's data
- Column-level masking: PII hidden from non-privileged roles
- API scope limiting: Tokens scoped to specific operations
- Audit logging: All data access recorded

## 4. Compliance Certifications

### SOC 2 Type II

- Audit period: Annual
- Auditor: Independent CPA firm
- Trust Service Criteria: Security, Availability, Confidentiality
- Report available under NDA

### GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Lawful basis | Legitimate interest for B2B; consent where required |
| Data minimization | Collect only necessary data fields |
| Right to access | Self-service data export |
| Right to deletion | 30-day deletion SLA |
| Data portability | JSON/CSV export |
| DPO | Designated DPO available |
| DPIA | Conducted for AI processing |
| International transfers | Standard Contractual Clauses |

### Additional Compliance

| Standard | Status | Scope |
|----------|--------|-------|
| CCPA/CPRA | Compliant | California resident data |
| CAN-SPAM | Compliant | All outbound email |
| CASL | Compliant | Canadian prospects |
| PECR | Compliant | UK/EU email |
| ISO 27001 | In progress | Expected Q4 2026 |

## 5. Incident Response

### Response SLA

| Severity | Definition | Response Time | Resolution Target |
|----------|-----------|---------------|-------------------|
| P1 Critical | Data breach, service down | 15 min | 4 hours |
| P2 High | Security vulnerability, degraded | 1 hour | 8 hours |
| P3 Medium | Non-critical security issue | 4 hours | 24 hours |
| P4 Low | Security improvement | 24 hours | 5 business days |

### Notification Policy

- P1: Immediate notification to affected customers + CISO
- P2: Notification within 4 hours to affected customers
- P3: Included in monthly security update
- GDPR breach notification: Within 72 hours to supervisory authority

## 6. Data Residency

| Region | Data Center | Available |
|--------|-------------|-----------|
| United States | AWS us-east-1 | Yes |
| European Union | AWS eu-west-1 (Ireland) | Yes |
| Asia Pacific | AWS ap-southeast-1 | Q3 2026 |

### Data Processing Controls

- Customer data stays in selected region
- No cross-region replication without consent
- Backup data encrypted and region-locked
- AI model training: customer data not used for model improvement
- Data isolation: Multi-tenant with logical separation

## 7. Vulnerability Management

| Activity | Frequency | Tool |
|----------|-----------|------|
| Penetration testing | Quarterly | Third-party firm |
| Vulnerability scanning | Weekly | Qualys |
| Dependency scanning | Per build | Snyk |
| Code review | Every PR | Manual + Semgrep |
| Bug bounty | Continuous | HackerOne |

## 8. Audit Trail

All significant actions are logged:

| Event Category | Examples | Retention |
|----------------|----------|-----------|
| Authentication | Login, logout, MFA, SSO | 1 year |
| Data access | View contact, export report | 1 year |
| Data modification | Create/update/delete records | 2 years |
| Configuration | Agent settings, RBAC changes | 2 years |
| Integration | CRM sync, webhook events | 1 year |
| Security | Failed login, API key rotation | 2 years |
""")

# ── CASE STUDY FILES ──────────────────────────────────────────

write_file("case-studies/saas-plg-to-sales-led.md", """---
title: "SaaS PLG to Sales-Led Conversion"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [saas, plg, product-led, sales-assisted, conversion, icp]
---

# SaaS PLG to Sales-Led Conversion

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | CloudMetrics (pseudonym) |
| Industry | SaaS - Data Analytics |
| ARR | $5M |
| Employees | 80 |
| Customers | 2,000+ free users, 200 paid |
| Sales Model | Transitioning from PLG to sales-led |

## 2. Challenge

CloudMetrics had built a successful product-led growth engine with 2,000+ free users, but struggled to convert these users into high-value enterprise accounts. Their challenges included:

- **No ICP definition**: Free users spanned too many segments; sales team couldn't prioritize
- **Manual prospecting**: SDRs spent 70% of time researching, 30% actually selling
- **Low conversion**: Free-to-paid conversion rate was 3.2% (industry avg: 5-7%)
- **No scoring model**: All leads treated equally regardless of account potential
- **Inconsistent outreach**: Each SDR crafted their own messaging, no A/B testing

## 3. Approach

### Phase 1: ICP Definition (Atlas Agent)
- Analyzed existing customer base for highest-LTV accounts
- Identified pattern: 200+ employee B2B SaaS companies with data teams
- Defined 3 ICP tiers: Enterprise (500+), Mid-Market (50-500), SMB (<50)
- Created negative personas (B2C, solo entrepreneurs, non-tech industries)

### Phase 2: Pipeline Discovery (Scout Agent)
- Connected to product usage database via webhook
- Identified 340 free users matching Enterprise ICP
- Discovered 180 matching Mid-Market ICP
- Cross-referenced with Apollo for enrichment

### Phase 3: Automated Enrichment (Forge + Sage)
- Enriched all 520 ICP-matched users with firmographic data
- Generated account-specific research for Enterprise tier
- Identified 12 trigger events (funding rounds, executive hires)
- Calculated ICP scores for all accounts

### Phase 4: Targeted Outreach (Bard Agent)
- Created persona-specific sequences (Data Team Lead, VP Engineering, CTO)
- Personalized messaging using product usage data and research insights
- A/B tested subject lines and CTAs
- Multi-channel: Email + LinkedIn for Enterprise, Email-only for Mid-Market

### Phase 5: Pipeline Management (Flow Agent)
- Automated lead routing based on ICP tier
- Set up stage progression rules
- Configured deal-at-risk alerts
- Generated weekly pipeline reports via Echo

## 4. Results (90 Days)

| Metric | Before LeadReach | After LeadReach | Change |
|--------|-----------------|-----------------|--------|
| Free-to-paid conversion | 3.2% | 9.7% | +203% |
| Enterprise meetings booked | 3/month | 12/month | +300% |
| Sales cycle (Enterprise) | 85 days | 52 days | -39% |
| SDR efficiency (talk time) | 30% | 65% | +117% |
| Pipeline value | $1.2M | $4.8M | +300% |
| Average deal size | $8K ACV | $24K ACV | +200% |
| Cost per qualified lead | $180 | $45 | -75% |

## 5. Key Learnings

1. **Product usage signals are gold**: Users who hit specific feature thresholds were 4x more likely to convert. LeadReach automated detection of these signals.

2. **ICP precision matters more than volume**: Focusing on 520 ICP-matched users instead of 2,000 total users drove significantly better results despite smaller initial pool.

3. **Personalization depth correlates with response**: Bard-generated emails using 3+ personalization signals achieved 28% reply rate vs 8% for generic templates.

4. **Speed to lead is critical**: Accounts contacted within 24 hours of trigger event detection had 3x higher meeting booking rate.

5. **Multi-channel beats single-channel**: Email+LinkedIn sequences had 45% higher conversion than email-only.

## 6. Replicable Patterns

### For PLG Companies Transitioning to Sales-Led

1. Start with Atlas ICP definition using existing customer LTV data
2. Use Scout to match free users against ICP (focus on top 20%)
3. Prioritize accounts with trigger events (funding, hiring, feature usage milestones)
4. Deploy Bard with product-usage-aware personalization
5. Set Flow to route Enterprise leads directly to AE, Mid-Market to SDR
6. Use Echo for weekly PLG-to-SQL conversion tracking
""")

write_file("case-studies/enterprise-security-vendor.md", """---
title: "Enterprise Security Vendor Expansion"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [cybersecurity, enterprise, expansion, compliance, security-review]
---

# Enterprise Security Vendor Expansion

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | ShieldNet (pseudonym) |
| Industry | Cybersecurity - Endpoint Protection |
| ARR | $12M |
| Employees | 150 |
| Target Market | Enterprise (1000+ employees) |
| Sales Cycle | 6-9 months |

## 2. Challenge

ShieldNet had proven product-market fit with mid-market customers but struggled to penetrate enterprise accounts due to:

- **Extended security review processes**: Enterprise buyers required 4-8 week security/compliance evaluations
- **Multi-stakeholder complexity**: 7-12 decision makers per deal (CISO, IT, Legal, Procurement, Risk)
- **No account intelligence**: Sales reps couldn't map organizational structure or identify champions
- **Generic outreach**: Same messaging for Fortune 500 CISOs as for mid-market IT directors
- **Pipeline leakage**: 35% of enterprise deals stalled in security review stage

## 3. Approach

### Phase 1: Enterprise ICP Refinement
- Atlas redefined ICP for enterprise: 1000+ employees, regulated industry, existing security budget
- Created security-buyer personas: CISO, VP Security, Security Architect, Compliance Officer
- Mapped buying committee roles and influence patterns

### Phase 2: Strategic Account Discovery
- Scout identified 200 target enterprise accounts using ZoomInfo + LinkedIn intent
- Filtered by companies showing security-related buying signals
- Prioritized by regulatory compliance pressure (fintech, healthcare, government)

### Phase 3: Deep Account Intelligence
- Sage generated comprehensive research for each target account
- Mapped organizational structure, identified security team members
- Analyzed current security stack for competitive displacement opportunities
- Identified regulatory deadlines driving urgency

### Phase 4: Security Review Acceleration
- Built security review playbook with pre-populated compliance documentation
- Judge auto-qualified accounts based on security readiness indicators
- Bard crafted CISO-specific messaging addressing security concerns proactively
- Created security review automation: pre-filled questionnaires, auto-generated compliance reports

### Phase 5: Multi-Threaded Engagement
- Identified and engaged multiple stakeholders simultaneously
- Tailored messaging per role: CISO (risk reduction), IT (integration), Legal (compliance), Procurement (ROI)
- Used Flow to track stakeholder engagement and progression

## 4. Results (6 Months)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Enterprise pipeline | $3M | $8.5M | +183% |
| Security review cycle | 52 days | 21 days | -60% |
| Enterprise win rate | 18% | 31% | +72% |
| Average deal size | $85K ACV | $180K ACV | +112% |
| Deals in pipeline | 8 | 22 | +175% |
| CISO meeting rate | 12% | 34% | +183% |

## 5. Key Learnings

1. **Security reviews are solvable**: Pre-emptive compliance documentation reduced security review time by 60%.
2. **Multi-threading is essential**: Enterprise deals with 3+ engaged stakeholders had 4x higher win rate.
3. **CISO-specific content matters**: Technical, risk-focused content outperformed marketing collateral 3:1.
4. **Regulatory deadlines create urgency**: Accounts with upcoming compliance deadlines closed 2x faster.
5. **Competitive intelligence drives displacement**: Knowing the incumbent security stack enabled targeted displacement messaging.

## 6. Replicable Patterns

1. Use Sage for deep security team organizational mapping
2. Create security review automation package (SOC 2 reports, penetration test summaries, compliance matrices)
3. Deploy multi-threaded outreach targeting entire buying committee
4. Track security review milestones explicitly in Flow pipeline
5. Build compliance deadline triggers into Scout discovery criteria
""")

write_file("case-studies/manufacturing-digital-transformation.md", """---
title: "Manufacturing Digital Transformation"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [manufacturing, digital-transformation, iiot, industry-4-0, traditional-industry]
---

# Manufacturing Digital Transformation

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | IoTConnect (pseudonym) |
| Industry | Industrial IoT Platform |
| ARR | $8M |
| Employees | 120 |
| Target Market | Manufacturing (500+ employees) |
| Sales Challenge | Selling digital to traditional buyers |

## 2. Challenge

IoTConnect sold an Industrial IoT platform that helped manufacturers monitor equipment, reduce downtime, and optimize production. However, their sales team struggled with:

- **Traditional buyer mindset**: Manufacturing executives skeptical of cloud-based solutions, preferring "we've always done it this way"
- **Long education cycle**: Buyers needed 3-6 months to understand digital transformation benefits
- **Missing industry context**: Generic SaaS messaging didn't resonate with manufacturing pain points
- **No industry-specific proof**: Lack of manufacturing-specific case studies and ROI models
- **Complex buying committee**: Operations, IT, Finance, and C-suite all had veto power

## 3. Approach

### Phase 1: Manufacturing ICP Development
- Atlas built manufacturing-specific ICP with digital maturity scoring
- Created 4 buyer personas: Plant Manager, VP Operations, CIO/CTO, CFO
- Developed industry-specific pain point mapping (downtime cost, OEE, maintenance spend)

### Phase 2: Industry-Specific Discovery
- Scout used manufacturing industry directories + trade show attendee lists
- Filtered by companies with digital transformation indicators (job postings, tech investments)
- Identified 150 target manufacturers showing IoT buying signals

### Phase 3: Manufacturing-Specific Research
- Sage generated ROI models based on industry benchmarks:
  - Unplanned downtime cost: $10K-250K/hour (depending on plant size)
  - OEE improvement potential: 10-20%
  - Maintenance cost reduction: 15-30%
- Created manufacturing-specific competitive analysis vs legacy SCADA systems
- Built industry-specific security documentation (OT/IT convergence security)

### Phase 4: Education-First Outreach
- Bard created manufacturing-specific content sequences:
  - Day 1: Industry report on IoT ROI in manufacturing
  - Day 3: Case study of similar-sized manufacturer
  - Day 7: ROI calculator personalized to their plant
  - Day 14: Invitation to manufacturing-specific webinar
- Positioning: "Digital transformation advisor" not "software vendor"

### Phase 5: Consultative Pipeline Management
- Flow managed long-cycle deals with stage-appropriate actions
- Automated nurture for early-stage accounts (6+ month horizon)
- Triggered escalation for accounts showing buying acceleration signals

## 4. Results (9 Months)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Manufacturing pipeline | $2.1M | $8.4M | +300% |
| Qualified leads/month | 4 | 18 | +350% |
| Win rate | 15% | 32% | +113% |
| Average deal size | $40K ACV | $95K ACV | +138% |
| Sales cycle | 9 months | 5.5 months | -39% |
| Demo-to-close rate | 20% | 48% | +140% |

## 5. Key Learnings

1. **Industry-specific content is mandatory**: Generic SaaS content got 2% reply rate; manufacturing-specific content got 15%.
2. **ROI quantification closes deals**: Personalized ROI calculators based on plant-specific data were the #1 conversion driver.
3. **Education beats selling**: Manufacturers needed 3-4 educational touchpoints before being open to a sales conversation.
4. **Digital maturity scoring works**: Companies with any digital initiative (even a website redesign) were 3x more receptive.
5. **Trusted advisor positioning wins**: Sales reps positioned as industry consultants outperformed product-pitch reps by 4x.

## 6. Replicable Patterns

1. Use industry-specific knowledge base content from Sage for education-first sequences
2. Build industry-specific ROI calculators that use prospect's actual operating data
3. Map digital maturity signals to prioritize receptive accounts
4. Create multi-month nurture tracks for digitally immature accounts
5. Deploy manufacturing-specific compliance documentation (ISA/IEC 62443)
""")

write_file("case-studies/healthtech-hipaa-compliant-outreach.md", """---
title: "HealthTech HIPAA-Compliant Outreach"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [healthtech, hipaa, compliance, healthcare, regulated, phi]
---

# HealthTech HIPAA-Compliant Outreach

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | MedSync (pseudonym) |
| Industry | HealthTech - Clinical Data Platform |
| ARR | $4M |
| Employees | 65 |
| Target Market | Hospital Systems, Health Networks |
| Compliance Need | HIPAA, HITECH, 21st Century Cures Act |

## 2. Challenge

MedSync needed to prospect into healthcare organizations while maintaining strict HIPAA compliance:

- **PHI risk in prospecting**: Even company names of healthcare orgs could be considered PHI in certain contexts
- **Restricted data sources**: Cannot use standard enrichment tools for healthcare contacts
- **BAA requirement**: Business Associate Agreements needed before any data exchange
- **Conservative buyers**: Hospital IT and compliance teams extremely risk-averse
- **Long procurement cycles**: 12-18 month sales cycles with multiple compliance gates

## 3. Approach

### Phase 1: Compliance-First ICP Definition
- Atlas defined healthcare-specific ICP with compliance-safe criteria
- Created de-identified prospecting criteria (employee count, bed count, EHR system)
- Mapped compliance requirements per target type (hospital, health network, ACO)

### Phase 2: Compliant Discovery
- Scout used only HIPAA-compliant data sources (NPPES, CMS public data)
- Avoided scraping healthcare provider directories that might contain PHI
- Filtered by publicly available institutional data (bed count, EHR vendor, teaching status)

### Phase 3: Compliant Enrichment
- Forge enriched using only non-PHI data sources
- De-identified any data that could link to patient information
- Generated BAA templates for pre-qualification stage
- Created compliance documentation packages per target type

### Phase 4: Trust-Building Outreach
- Bard crafted compliance-first messaging:
  - Led with security credentials and certifications
  - Referenced HIPAA compliance proactively
  - Provided BAA and compliance documentation in first outreach
  - Avoided any language that implied access to patient data
- Used healthcare-specific channels (HIMSS events, CHIME network)

### Phase 5: Compliance-Gated Pipeline
- Flow managed compliance checkpoints as pipeline stages:
  - Stage 1: Initial Contact (compliance-safe messaging)
  - Stage 2: NDA Signed (deeper technical discussion allowed)
  - Stage 3: BAA Executed (data exchange permitted)
  - Stage 4: Security Review (automated compliance documentation)
  - Stage 5: Procurement (standard commercial terms)

## 4. Results (12 Months)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Pipeline value | $800K | $2.5M | +213% |
| Hospital meetings/month | 1 | 5 | +400% |
| Compliance approval rate | 40% | 78% | +95% |
| Security review pass rate | 55% | 92% | +67% |
| Average deal size | $30K | $80K | +167% |
| Sales cycle | 18 months | 11 months | -39% |
| Zero compliance incidents | 0 | 0 | Maintained |

## 5. Key Learnings

1. **Compliance as competitive advantage**: Proactively providing BAA and compliance docs differentiated MedSync from competitors who couldn't.
2. **Trust first, sell second**: Healthcare buyers needed 2-3 trust-building interactions before commercial discussions.
3. **De-identification enables scale**: Using only institutional (non-PHI) data for prospecting allowed 10x more outreach while staying compliant.
4. **Compliance automation saves time**: Pre-populated security questionnaires reduced review time by 60%.
5. **Zero incidents is the only acceptable outcome**: Building compliance into every agent step prevented any HIPAA violations.

## 6. Replicable Patterns

1. Build compliance-safe prospecting criteria using only public institutional data
2. Create pre-populated BAA and security documentation packages
3. Use compliance-gated pipeline stages (NDA → BAA → Security Review)
4. Lead outreach with trust signals (certifications, compliance documentation)
5. Audit all agent actions for PHI exposure in real-time
""")

write_file("case-studies/fintech-cross-border-expansion.md", """---
title: "FinTech Cross-Border Expansion"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [fintech, cross-border, international, expansion, multi-region, localization]
---

# FinTech Cross-Border Expansion

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | PayFlow (pseudonym) |
| Industry | FinTech - B2B Payment Infrastructure |
| ARR | $15M (US-focused) |
| Employees | 200 |
| Target Markets | UK, Singapore, Australia, UAE, Germany |
| Regulatory Challenge | FCA, MAS, AUSTRAC, DFSA, BaFin |

## 2. Challenge

PayFlow dominated the US B2B payment market but faced significant barriers to international expansion:

- **Regulatory complexity**: Each country had different financial services regulations
- **Cultural misalignment**: US-centric messaging didn't resonate in EMEA/APAC markets
- **No local networks**: SDRs had no connections or context in target regions
- **Pricing challenges**: Different market economics required adjusted pricing models
- **Language barriers**: English-only outreach limited penetration in non-English markets

## 3. Approach

### Phase 1: Market Selection & Strategy (Atlas Agent)
- Atlas analyzed 20 markets using GDP, fintech adoption, regulatory complexity, and competition
- Prioritized 5 markets: UK (regulatory clarity), Singapore (fintech hub), Australia (English-speaking), UAE (growth market), Germany (largest EU economy)
- Created go-to-market strategy per market with regulatory compliance requirements

### Phase 2: Regional ICP Adaptation
- Adapted ICP per region:
  - UK: FCA-authorized payment institutions, 50-500 employees
  - Singapore: MAS-regulated entities, tech-forward companies
  - Australia: AUSTRAC-registered, APAC-focused businesses
  - UAE: DIFC/ADGM licensed entities, regional headquarters
  - Germany: BaFin-regulated, Mittelstand companies
- Scout identified regional prospects using local data sources

### Phase 3: Localized Research & Content
- Sage generated market-specific research:
  - Local regulatory requirements and compliance frameworks
  - Regional competitor landscape
  - Market-specific pain points (e.g., SEPA compliance in EU, MAS requirements in Singapore)
  - Local business culture and communication preferences

### Phase 4: Localized Outreach
- Bard created region-specific sequences:
  - UK: Formal, compliance-focused messaging
  - Singapore: Relationship-first, government-initiative-aware
  - Australia: Direct, no-nonsense, ROI-focused
  - UAE: Relationship-driven, prestige-aware, in-person meeting emphasis
  - Germany: Technical depth, data-driven, privacy-conscious
- Translated key messages (German for DACH market)

### Phase 5: Multi-Region Pipeline Management
- Flow managed region-specific pipeline stages
- Echo generated region-specific forecasts
- Automated regulatory milestone tracking per market

## 4. Results (9 Months)

| Metric | US Baseline | International | Total |
|--------|-------------|---------------|-------|
| Pipeline value | $15M | $12M | $27M |
| Qualified leads/month | 25 | 18 | 43 |
| Meetings booked | 12 | 8 | 20 |
| Win rate | 28% | 22% | 25% |
| Average deal size | $60K | $45K | $53K |
| Markets entered | 1 | 5 | 6 |
| Time to first deal (new market) | N/A | 4 months | - |

## 5. Key Learnings

1. **Regulatory compliance is a feature**: Proactively addressing local regulations in outreach increased response rates by 40%.
2. **Local data sources are essential**: Regional prospect databases outperformed global providers 3:1 for contact accuracy.
3. **Cultural adaptation > translation**: Simply translating US messaging failed; cultural adaptation of value propositions was necessary.
4. **Regional champions accelerate**: Hiring one local sales leader per market shortened time-to-first-deal by 50%.
5. **Patience pays in new markets**: First deals take 3-5 months; pipeline compound effect kicks in after month 6.

## 6. Replicable Patterns

1. Use Atlas for data-driven market selection and prioritization
2. Build region-specific ICP variants with local regulatory requirements
3. Adapt outreach tone and content to regional business culture (not just translation)
4. Track regulatory milestones as pipeline stages in Flow
5. Start with English-speaking markets for faster initial traction
""")

write_file("case-studies/edtech-university-selling.md", """---
title: "EdTech University Selling"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [edtech, higher-education, university, procurement, long-cycle, committee]
---

# EdTech University Selling

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | LearnPlatform (pseudonym) |
| Industry | EdTech - Learning Analytics Platform |
| ARR | $3.5M |
| Employees | 45 |
| Target Market | Universities, Community Colleges |
| Sales Cycle | 12-18 months |

## 2. Challenge

LearnPlatform helped universities measure and improve learning outcomes but faced unique EdTech sales challenges:

- **Extended procurement cycles**: University purchasing required committee approval, budget cycles, and academic calendar alignment
- **Complex governance**: Department chairs, IT, Provost, procurement, faculty senate all had input
- **Seasonal buying patterns**: Budget decisions made in spring, purchases in summer/fall
- **Limited IT budget**: Competing priorities with LMS, SIS, and infrastructure needs
- **Risk aversion**: Universities slow to adopt new technology; require extensive proof and references

## 3. Approach

### Phase 1: Education-Specific ICP
- Atlas created higher-education ICP with enrollment-based segmentation
- Identified key triggers: accreditation reviews, LMS migrations, strategic plan updates
- Mapped buying committee: CIO, Provost, Faculty Senate IT Committee, Department Chairs

### Phase 2: Academic Calendar-Aligned Discovery
- Scout identified universities based on:
  - Public strategic plans mentioning "data-driven" or "learning analytics"
  - Recent LMS migrations (Canvas, Blackboard)
  - Upcoming accreditation reviews
  - Technology budget increases in public financial filings
- Timed outreach to align with budget planning cycles (February-April for fall implementation)

### Phase 3: Higher-Ed Research
- Sage generated institution-specific research:
  - Current LMS and technology stack
  - Recent strategic plan priorities
  - Accreditation status and upcoming reviews
  - Faculty publications mentioning assessment or analytics needs
  - Peer institution comparisons

### Phase 4: Academic-Tone Outreach
- Bard crafted education-appropriate sequences:
  - Referenced institution's strategic plan language
  - Cited peer institution case studies (never competitors by name)
  - Used academic-appropriate tone (evidence-based, not salesy)
  - Offered pilot programs aligned with semester schedules
  - Connected with existing faculty champions at target institutions

### Phase 5: Committee-Aware Pipeline
- Flow tracked multi-stakeholder engagement:
  - CIO: Technical integration and security approval
  - Provost: Strategic alignment and budget authorization
  - Faculty Committee: Academic merit and pedagogical value
  - Procurement: Contract terms and compliance
- Set milestone-based progression rules requiring stakeholder-by-stakeholder approval

## 4. Results (12 Months)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| University pipeline | $1.5M | $5.2M | +247% |
| Qualified leads/quarter | 3 | 11 | +267% |
| Meetings with decision makers | 2/month | 7/month | +250% |
| Win rate | 12% | 28% | +133% |
| Average deal size | $25K | $55K | +120% |
| Pilot-to-close rate | 30% | 65% + |
| Sales cycle | 16 months | 10 months | -38% |

## 5. Key Learnings

1. **Academic calendar is everything**: Outreach timed to budget planning cycles (Feb-Apr) had 3x higher engagement than summer outreach.
2. **Faculty champions are the key**: Deals with an internal faculty advocate closed 4x faster than those without.
3. **Evidence beats features**: Academic buyers responded to peer-reviewed evidence and case studies, not feature lists.
4. **Pilot programs reduce risk**: Offering semester-aligned pilots addressed the "try before you buy" mentality.
5. **Strategic plan language is a shortcut**: Referencing the institution's own stated goals in outreach demonstrated alignment and earned responses.

## 6. Replicable Patterns

1. Align all outreach with institutional budget and academic calendars
2. Use publicly available strategic plans to identify alignment and personalize messaging
3. Map the full buying committee early (CIO + Provost + Faculty)
4. Offer semester-aligned pilots with clear success metrics
5. Build a library of peer institution case studies by institution type (R1, community college, liberal arts)
""")

print("\n=== All files created! ===")
print(f"Integration files: 5")
print(f"Product files: 5")
print(f"Case study files: 6")
