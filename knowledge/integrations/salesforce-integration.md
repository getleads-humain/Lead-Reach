---
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
