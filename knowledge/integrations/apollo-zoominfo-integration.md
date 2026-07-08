---
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
