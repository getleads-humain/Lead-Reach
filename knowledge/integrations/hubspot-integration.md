---
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
