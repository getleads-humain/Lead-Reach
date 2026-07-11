---
title: Firmographic Data Standards
category: dataset
dataset_type: firmographic
grade: B
last_reviewed: 2026-07-10
tags: [dataset, firmographic, data-standards, taxonomy]
---

# Firmographic Data Standards

Firmographic data standards define the structured attributes used to classify and segment business organizations for LeadReach agent workflows. This document provides the complete taxonomy, field definitions, classification hierarchies, data source mappings, quality benchmarks, enrichment workflows, and integration patterns for all firmographic data consumed and produced by LeadReach agents.

## 1. Core Firmographic Dimensions

### 1.1 Company Size Classification

Company size is the primary segmentation dimension used across all LeadReach agent workflows. It drives ICP scoring, outreach sequencing, pricing models, and pipeline routing.

**Employee Count Ranges:**

| Range Code | Label | Employee Range | Typical Revenue | Sales Motion | LeadReach Tier |
|-----------|-------|----------------|-----------------|--------------|----------------|
| XS | Micro | 1-10 | <$1M | Self-serve only | Exclude (non-ICP) |
| S | Small | 11-50 | $1-10M | SDR → self-serve | Tier 3 |
| M | Medium | 51-200 | $10-50M | SDR → AE | Tier 2 |
| L | Large | 201-500 | $50-100M | AE-led | Tier 2 |
| XL | Enterprise | 501-1000 | $100-500M | AE-led + SE | Tier 1 |
| XXL | Major Enterprise | 1001-5000 | $500M-1B | Enterprise AE team | Tier 1 |
| XXXL | Global Enterprise | 5001-10000 | $1B-10B | Strategic accounts | Tier 0 |
| MEGA | Mega Corp | 10000+ | $10B+ | Named accounts | Tier 0 |

**Revenue Ranges:**

| Range Code | Label | Revenue Range | Typical ACV Expectation | Budget Authority |
|-----------|-------|---------------|------------------------|-----------------|
| R1 | Pre-revenue | <$1M | $1-5K | Founder/CEO |
| R2 | Emerging | $1-10M | $5-15K | VP/Director |
| R3 | Growth | $10-50M | $15-50K | VP/C-Level |
| R4 | Established | $50-100M | $30-80K | C-Level |
| R5 | Mid-Enterprise | $100-500M | $50-150K | C-Level + Board |
| R6 | Large Enterprise | $500M-1B | $100-300K | C-Level + Board |
| R7 | Major Enterprise | $1B-10B | $150-500K | Committee |
| R8 | Global Enterprise | $10B+ | $300K-1M+ | Committee + Board |

### 1.2 Industry Classification

LeadReach supports three industry classification systems, with automatic cross-mapping:

**Primary: LeadReach Industry Taxonomy (LIT v3)**

| LIT Code | Industry Group | Sub-Industries | Example Companies |
|----------|---------------|----------------|-------------------|
| TECH-01 | B2B SaaS | CRM, HR Tech, MarTech, DevTools, Security | Salesforce, HubSpot, Datadog |
| TECH-02 | B2C SaaS | Consumer Apps, Social, Entertainment | Spotify, Netflix, Canva |
| TECH-03 | FinTech | Payments, Banking, Insurance, Lending | Stripe, Plaid, Robinhood |
| TECH-04 | HealthTech | Clinical, Health IT, Wellness, Pharma IT | Epic, Veeva, Teladoc |
| TECH-05 | EdTech | Learning, Assessment, Credentialing | Coursera, Canvas, Duolingo |
| TECH-06 | CleanTech | Energy, Sustainability, Carbon | Tesla Energy, Sunrun |
| MFG-01 | Discrete Mfg | Automotive, Aerospace, Electronics, Machinery | Tesla, Boeing, Intel |
| MFG-02 | Process Mfg | Chemicals, Food & Beverage, Pharma Manufacturing | Dow, Nestle, Pfizer |
| FIN-01 | Banking | Commercial, Retail, Investment | JPMorgan, BofA, Goldman |
| FIN-02 | Insurance | P&C, Life, Reinsurance | State Farm, MetLife |
| FIN-03 | Capital Markets | Asset Mgmt, Hedge Funds, Private Equity | BlackRock, Citadel |
| HC-01 | Hospitals | Academic, Community, Specialty | Mayo Clinic, HCA |
| HC-02 | Pharma | Biotech, Generics, CRO | Pfizer, Moderna, IQVIA |
| HC-03 | Health Insurance | Payers, MCOs | UnitedHealth, Anthem |
| RET-01 | Retail | E-commerce, Big Box, Specialty | Amazon, Walmart, Target |
| RET-02 | Hospitality | Hotels, Restaurants, Travel | Marriott, McDonald's |
| PROF-01 | Consulting | Strategy, IT, Management | McKinsey, Accenture, Deloitte |
| PROF-02 | Legal | Law Firms, Legal Tech | Latham & Watkins, Clio |
| PROF-03 | Accounting | CPA Firms, Audit | PwC, KPMG, EY |
| GOV-01 | Federal | Defense, Civilian, Intelligence | US Government agencies |
| GOV-02 | State/Local | State, County, Municipal | State agencies, City gov |
| EDU-01 | Higher Ed | Universities, Colleges, Community Colleges | State universities, MIT |
| EDU-02 | K-12 | School Districts, Charter Networks | NYC DOE, KIPP |
| TEL-01 | Telecom | Wireless, Wireline, Cable | AT&T, Verizon, Comcast |
| TEL-02 | Media | Broadcasting, Publishing, Streaming | Disney, NYT, Netflix |
| ENE-01 | Oil & Gas | Upstream, Midstream, Downstream | ExxonMobil, Chevron |
| ENE-02 | Utilities | Electric, Gas, Water | Duke Energy, ConEd |
| TRN-01 | Logistics | Freight, Shipping, Supply Chain | FedEx, Maersk, XPO |
| TRN-02 | Automotive OEM | Vehicle Manufacturers | GM, Ford, Toyota |

**Secondary: NAICS 2022 Mapping**

| NAICS Range | Sector | LIT Mapping | Notes |
|-------------|--------|-------------|-------|
| 11 | Agriculture | Not classified | Low B2B tech adoption |
| 21 | Mining | ENE-01 | Energy vertical |
| 22 | Utilities | ENE-02 | Utilities vertical |
| 23 | Construction | MFG-01 (partial) | Growing tech adoption |
| 31-33 | Manufacturing | MFG-01, MFG-02 | Split by discrete/process |
| 42 | Wholesale Trade | RET-01 | Distribution segment |
| 44-45 | Retail Trade | RET-01 | Retail vertical |
| 48-49 | Transportation | TRN-01, TRN-02 | Split by logistics/auto |
| 51 | Information | TEL-01, TEL-02, TECH-01 | Split by segment |
| 52 | Finance & Insurance | FIN-01, FIN-02, FIN-03, TECH-03 | Split by sub-sector |
| 53 | Real Estate | PROF-01 | Professional services |
| 54 | Professional Services | PROF-01, PROF-02, PROF-03 | Split by discipline |
| 55 | Management of Companies | PROF-01 | Holding companies |
| 56 | Admin & Support | PROF-01 | Business services |
| 61 | Educational Services | EDU-01, EDU-02, TECH-05 | Split by level |
| 62 | Health Care | HC-01, HC-02, HC-03, TECH-04 | Split by sub-sector |
| 71 | Arts & Entertainment | TEL-02 | Media vertical |
| 72 | Accommodation & Food | RET-02 | Hospitality vertical |
| 81 | Other Services | PROF-01 | Miscellaneous professional |
| 92 | Public Administration | GOV-01, GOV-02 | Government vertical |

**Tertiary: SIC Code Mapping**

LeadReach maintains a mapping table for the 1,000+ SIC divisions to LIT codes. This mapping is used primarily for legacy data sources and older enrichment providers. The full mapping is available in the LeadReach data dictionary at `data_dictionary/sic_to_lit_mapping.csv`.

### 1.3 Geographic Classification

**Headquarters Country (ISO 3166-1 alpha-2):**

| Region | Priority Markets | Secondary Markets | Tertiary Markets |
|--------|-----------------|-------------------|------------------|
| North America | US, CA | MX | — |
| Europe | UK, DE, FR | NL, SE, IE, ES, IT | CH, BE, AT, DK, NO |
| Asia-Pacific | SG, AU, JP | IN, KR, HK | NZ, TH, MY, ID, PH |
| Middle East | AE, SA | IL, QA, BH, KW | — |
| Latin America | BR | AR, CL, CO, MX | — |
| Africa | ZA | NG, KE, EG | — |

**Operating Footprint Classification:**

| Code | Label | Definition | Example |
|------|-------|-----------|---------|
| GEO-LOCAL | Local | Operations in single metro area | Local restaurant chain |
| GEO-REGIONAL | Regional | Operations in single state/province | Regional bank |
| GEO-NATIONAL | National | Operations across single country | National retailer |
| GEO-MULTI | Multi-Country | Operations in 2-5 countries | Nordic SaaS company |
| GEO-CONTINENTAL | Continental | Operations across one continent | Pan-European logistics |
| GEO-GLOBAL | Global | Operations in 6+ countries | Multinational corporation |

**Regional Presence Structure:**

```json
{
  "headquarters": {
    "country": "US",
    "state": "CA",
    "metro": "San Francisco Bay Area",
    "city": "San Francisco"
  },
  "operating_countries": ["US", "UK", "DE", "SG", "AU"],
  "regional_hubs": [
    {"region": "NA", "country": "US", "city": "New York"},
    {"region": "EMEA", "country": "UK", "city": "London"},
    {"region": "APAC", "country": "SG", "city": "Singapore"}
  ],
  "employee_distribution": {
    "NA": 0.60,
    "EMEA": 0.25,
    "APAC": 0.15
  }
}
```

### 1.4 Organizational Structure

**Ownership Type:**

| Code | Label | Definition | Data Implications |
|------|-------|-----------|-------------------|
| PUB | Publicly Traded | Listed on stock exchange | Rich financial data available (10-K, proxy) |
| PRI | Private (VC-backed) | Venture/private equity funded | Funding data from Crunchbase/PitchBook |
| PRI-B | Private (Bootstrapped) | No external funding | Limited financial data; use estimates |
| PRI-PE | Private (PE-owned) | Acquired by PE firm | May have operational changes post-acquisition |
| NPO | Non-Profit | 501(c)(3) or equivalent | Different budget cycles and approval processes |
| GOV | Government | Federal, state, or local | Procurement regulations apply |
| SOE | State-Owned Enterprise | Government-controlled | Political considerations in sales |
| COOP | Cooperative | Member-owned | Committee-based decisions |

**Corporate Hierarchy:**

| Code | Label | Definition | Parent/Child Impact |
|------|-------|-----------|-------------------|
| HQ | Global Headquarters | Ultimate parent entity | Controls budget for all subsidiaries |
| REG-HQ | Regional Headquarters | Regional decision authority | May have independent IT budget |
| DIV | Division | Operating division of parent | May share or have separate IT |
| SUB | Subsidiary | Wholly-owned subsidiary | Often independent purchasing |
| JV | Joint Venture | Shared ownership | Complex approval processes |
| FRAN | Franchise | Franchised operation | Independent purchasing, brand alignment |
| BRAN | Brand | Brand within portfolio | May share parent IT infrastructure |

**Location Count Ranges:**

| Code | Label | Range | Implication |
|------|-------|-------|------------|
| LOC-1 | Single Location | 1 | Centralized IT, simpler procurement |
| LOC-2-5 | Small Multi-Site | 2-5 | May need multi-site deployment strategy |
| LOC-6-20 | Mid Multi-Site | 6-20 | Definitely multi-site strategy required |
| LOC-21-50 | Large Multi-Site | 21-50 | Complex deployment, phased rollout |
| LOC-51-100 | Very Large Multi-Site | 51-100 | Enterprise deployment methodology |
| LOC-100+ | Massive Multi-Site | 100+ | Multi-year deployment, dedicated CSM |

## 2. Advanced Firmographic Attributes

### 2.1 Technology Stack (Technographic Data)

**Technology Category Taxonomy:**

| Category | Sub-Categories | Key Technologies | Displacement Signals |
|----------|---------------|------------------|---------------------|
| CRM | Salesforce, HubSpot, Dynamics, Pipedrive | Primary sales tool → ICP alignment | Switching CRM = high pain, high opportunity |
| Marketing Automation | Marketo, HubSpot, Pardot, ActiveCampaign | Marketing maturity indicator | Multi-tool = integration pain opportunity |
| ERP | SAP, Oracle, NetSuite, Dynamics 365 | Business system backbone | ERP migration = IT budget available |
| Cloud Infrastructure | AWS, Azure, GCP, Multi-cloud | Cloud maturity indicator | Multi-cloud = complexity opportunity |
| Security | CrowdStrike, SentinelOne, Palo Alto, Zscaler | Security investment level | Security stack gaps = risk opportunity |
| Data & Analytics | Snowflake, Databricks, BigQuery, Redshift | Data maturity indicator | Data platform = analytics buying propensity |
| Communication | Slack, Teams, Zoom, Webex | Collaboration tool preference | Indicates communication culture |
| DevTools | GitHub, GitLab, Jira, Jenkins | Developer tooling maturity | Dev tools = technical buying culture |
| HR & People | Workday, BambooHR, Gusto, Rippling | HR technology maturity | HR system = employee-centric org |
| ITSM | ServiceNow, Jira Service Mgmt, Zendesk | IT operations maturity | ITSM = structured IT organization |

**Technology Detection Methods:**

| Method | Accuracy | Coverage | Cost | LeadReach Usage |
|--------|----------|----------|------|----------------|
| BuiltWith API | 85% | 30M+ domains | $0.01/domain | Primary technographic source |
| Wappalyzer | 80% | Browser extension data | Free (limited) / $0.005/domain | Supplementary |
| DNS/HTTP header analysis | 70% | All internet-facing domains | Low | Automated scanning |
| Job posting analysis | 75% | Companies with active hiring | Medium | Cross-reference + trigger detection |
| LinkedIn company pages | 60% | Companies with active pages | Included in Sales Nav | Supplementary |
| Customer reference (self-reported) | 95% | Limited | Free | Gold standard when available |

### 2.2 Growth Indicators

**Hiring Velocity:**

| Metric | Definition | Source | Calculation | Signal Strength |
|--------|-----------|--------|-------------|----------------|
| job_postings_30d | Job postings in last 30 days | Indeed, LinkedIn | Count | Medium |
| hiring_velocity | % change in job postings vs. prior 30 days | Derived | (current - prior) / prior × 100 | High (if > 20%) |
| role_mix | Distribution of roles (eng, sales, marketing, ops) | Job posting parsing | Category percentages | High (eng hiring = tech investment) |
| key_role_hires | Hires for VP+ or "Head of" positions | LinkedIn | Count of new exec hires | Very High (new leader = new initiatives) |

**Funding History:**

| Field | Type | Source | Example | Signal |
|-------|------|--------|---------|--------|
| last_funding_date | Date | Crunchbase | 2026-03-15 | Recent = growth mode |
| last_funding_amount | Currency | Crunchbase | $30,000,000 | Large = budget available |
| last_funding_stage | Enum | Crunchbase | Series B | Stage = maturity indicator |
| total_funding | Currency | Crunchbase | $65,000,000 | Cumulative investment |
| lead_investors | Array | Crunchbase | ["Sequoia", "a16z"] | Investor quality signal |
| funding_velocity | Enum | Derived | "raising every 18 months" | Growth trajectory |

**Revenue Trajectory (Estimated):**

| Code | Label | Estimated Growth | Typical Signals | Outreach Implication |
|------|-------|-----------------|-----------------|---------------------|
| TRAJ-HYPER | Hypergrowth | 100%+ YoY | Multiple funding rounds, 50%+ hiring growth | Fast-moving, premium pricing |
| TRAJ-HIGH | High Growth | 50-100% YoY | Recent funding, 20-50% hiring growth | Growth-oriented messaging |
| TRAJ-MOD | Moderate Growth | 20-50% YoY | Steady hiring, positive revenue indicators | Efficiency + growth messaging |
| TRAJ-STABLE | Stable | 5-20% YoY | Low turnover, stable headcount | ROI and cost-saving messaging |
| TRAJ-DECL | Declining | <5% or negative | Layoffs, funding struggles | Avoid (high churn risk) |

### 2.3 Buying Propensity Models

**Predictive Score Components:**

| Component | Weight | Data Source | Score Range | Description |
|-----------|--------|------------|-------------|-------------|
| ICP Fit | 30% | Firmographic | 0-100 | How well company matches ideal customer profile |
| Intent Signals | 25% | Intent providers | 0-100 | Active research/purchase behavior |
| Technographic Fit | 15% | BuiltWith, etc. | 0-100 | Technology stack compatibility |
| Growth Score | 15% | Crunchbase, LinkedIn | 0-100 | Growth indicators and trajectory |
| Engagement Score | 10% | First-party | 0-100 | Previous engagement with LeadReach customer |
| Timing Score | 5% | Calendar, events | 0-100 | Budget cycle, renewal timing alignment |

**Buying Propensity Tiers:**

| Tier | Score Range | Label | Action | Expected Conversion |
|------|-----------|-------|--------|-------------------|
| A+ | 90-100 | Immediate Buyer | Direct AE outreach, 4-hour SLA | 25-35% |
| A | 80-89 | Active Buyer | SDR → AE, 24-hour SLA | 15-25% |
| B | 60-79 | Emerging Buyer | SDR outreach, 48-hour SLA | 8-15% |
| C | 40-59 | Future Buyer | Automated nurture, monthly touch | 3-8% |
| D | 20-39 | Unlikely Buyer | Long-term nurture, quarterly touch | 1-3% |
| F | 0-19 | Non-Buyer | Exclude from active outreach | <1% |

## 3. Data Schema

### 3.1 Company Record Schema

```json
{
  "company_id": "string (UUID)",
  "company_name": "string (required)",
  "domain": "string (required, validated)",
  "legal_name": "string (optional)",
  "description": "string (optional, max 500 chars)",
  
  "firmographic": {
    "employee_count": "integer (required)",
    "employee_range": "enum: XS|S|M|L|XL|XXL|XXXL|MEGA",
    "revenue": "integer (optional, USD)",
    "revenue_range": "enum: R1-R8",
    "industry_lit": "string (LIT v3 code)",
    "industry_naics": "string (6-digit NAICS)",
    "industry_sic": "string (4-digit SIC)",
    "industry_vertical": "string (custom vertical label)",
    
    "ownership_type": "enum: PUB|PRI|PRI-B|PRI-PE|NPO|GOV|SOE|COOP",
    "corporate_hierarchy": "enum: HQ|REG-HQ|DIV|SUB|JV|FRAN|BRAN",
    "parent_company_id": "string (UUID, nullable)",
    "subsidiary_ids": "array[string (UUID)]",
    "location_count": "integer",
    "location_range": "enum: LOC-1|LOC-2-5|LOC-6-20|LOC-21-50|LOC-51-100|LOC-100+",
    
    "headquarters": {
      "country": "string (ISO 3166-1 alpha-2)",
      "state": "string (ISO 3166-2)",
      "metro": "string",
      "city": "string",
      "timezone": "string (IANA)"
    },
    "operating_countries": "array[string (ISO 3166-1)]",
    "regional_hubs": "array[{region, country, city}]",
    "geo_footprint": "enum: GEO-LOCAL|GEO-REGIONAL|GEO-NATIONAL|GEO-MULTI|GEO-CONTINENTAL|GEO-GLOBAL"
  },
  
  "technographic": {
    "crm": "array[string]",
    "marketing_automation": "array[string]",
    "erp": "array[string]",
    "cloud_provider": "array[enum: AWS|Azure|GCP|Other]",
    "security_stack": "array[string]",
    "data_platform": "array[string]",
    "communication": "array[string]",
    "dev_tools": "array[string]",
    "hr_system": "array[string]",
    "itsm": "array[string]",
    "last_detected": "datetime"
  },
  
  "growth": {
    "job_postings_30d": "integer",
    "hiring_velocity": "float (%)",
    "role_mix": "object {eng, sales, marketing, ops, other}",
    "key_role_hires_90d": "array[{title, start_date}]",
    "last_funding_date": "date",
    "last_funding_amount": "integer (USD)",
    "last_funding_stage": "string",
    "total_funding": "integer (USD)",
    "revenue_trajectory": "enum: TRAJ-HYPER|TRAJ-HIGH|TRAJ-MOD|TRAJ-STABLE|TRAJ-DECL"
  },
  
  "scores": {
    "icp_fit": "integer (0-100)",
    "intent_score": "integer (0-100)",
    "technographic_fit": "integer (0-100)",
    "growth_score": "integer (0-100)",
    "engagement_score": "integer (0-100)",
    "timing_score": "integer (0-100)",
    "buying_propensity": "integer (0-100, weighted composite)",
    "buying_tier": "enum: A+|A|B|C|D|F"
  },
  
  "metadata": {
    "created_at": "datetime",
    "updated_at": "datetime",
    "last_enriched_at": "datetime",
    "data_sources": "array[string]",
    "quality_score": "integer (0-100)",
    "completeness_pct": "float (0-100)"
  }
}
```

### 3.2 Contact Record Schema

```json
{
  "contact_id": "string (UUID)",
  "company_id": "string (UUID, foreign key)",
  "first_name": "string",
  "last_name": "string (required)",
  "email": "string (required, validated)",
  "email_status": "enum: valid|risky|invalid|unknown",
  "title": "string",
  "seniority": "enum: C-Suite|VP|Director|Manager|Individual Contributor",
  "department": "string",
  "function": "enum: Executive|Sales|Marketing|Engineering|Finance|Operations|IT|HR|Legal|Product",
  "phone": "string (optional, E.164 format)",
  "phone_status": "enum: valid|risky|invalid|unknown",
  "linkedin_url": "string (URL, optional)",
  
  "role_in_buying_committee": "enum: Decision-Maker|Champion|Influencer|Gatekeeper|Blocker|Unknown",
  "persona_match": "string (persona identifier from ICP)",
  
  "engagement": {
    "last_email_open": "datetime",
    "last_email_click": "datetime",
    "last_email_reply": "datetime",
    "last_linkedin_interaction": "datetime",
    "last_phone_call": "datetime",
    "total_touches": "integer",
    "engagement_score": "integer (0-100)"
  },
  
  "metadata": {
    "created_at": "datetime",
    "updated_at": "datetime",
    "last_enriched_at": "datetime",
    "data_sources": "array[string]",
    "quality_score": "integer (0-100)"
  }
}
```

## 4. Data Source Mapping

### 4.1 Primary Data Sources

| Source | Data Provided | Coverage | Accuracy | Refresh | Cost | LeadReach Integration |
|--------|-------------|----------|----------|---------|------|----------------------|
| Clearbit | Company + contact firmographics | 20M+ companies | 85% | Real-time | $0.05/record | Forge primary enrichment |
| ZoomInfo | Company + contact + intent | 15M+ companies | 88% | Monthly | $0.08/record | Scout + Forge supplementary |
| Apollo.io | Contact data + email | 15M+ contacts | 80% | Weekly | $0.02/record | Scout contact discovery |
| LinkedIn Sales Nav | Org structure + role changes | 900M+ profiles | 90% | Daily | Subscription | Scout + Sage research |
| Crunchbase | Funding + company data | 3M+ companies | 92% | Daily | Subscription | Scout trigger detection |
| BuiltWith | Technographic data | 30M+ domains | 85% | Weekly | $0.01/domain | Forge technographic |
| PitchBook | PE/VC + financial data | 3M+ companies | 90% | Daily | Enterprise | Sage deep research |

### 4.2 Supplementary Data Sources

| Source | Data Provided | Coverage | Accuracy | Refresh | Cost | LeadReach Integration |
|--------|-------------|----------|----------|---------|------|----------------------|
| Hunter.io | Email finder + verification | 10M+ domains | 75% | On-demand | $0.01/email | Forge email verification |
| Lusha | Contact data + phone | 10M+ contacts | 78% | Monthly | $0.05/credit | Forge phone enrichment |
| Bombora | Intent data | 4M+ companies | 80% | Weekly | Enterprise | Scout intent signals |
| 6sense | Account-level intent | 5M+ accounts | 82% | Daily | Enterprise | Scout intent overlay |
| HG Insights | Technology install data | 15M+ sites | 85% | Quarterly | Enterprise | Forge technographic |
| D&B/Hoovers | Company financials + credit | 30M+ companies | 87% | Monthly | Enterprise | Forge financial enrichment |
| NPPES (healthcare) | Provider organizational data | 1M+ providers | 95% | Daily | Free | Scout healthcare-specific |
| IPEDS (education) | Institutional data | 6,000+ institutions | 98% | Annual | Free | Scout education-specific |
| SEC EDGAR | Public company filings | All US public | 100% | Daily | Free | Sage public company research |
| Census.gov | Business dynamics data | All US businesses | 95% | Annual | Free | Atlas market sizing |

### 4.3 Data Source Priority Matrix

When multiple sources provide the same field, LeadReach applies a priority-based merge:

| Field | Primary Source | Secondary Source | Tertiary Source | Resolution Rule |
|-------|---------------|-----------------|-----------------|----------------|
| company_name | Clearbit | ZoomInfo | Apollo | Most recent update wins |
| employee_count | Clearbit | ZoomInfo | LinkedIn | Highest value wins (underreporting common) |
| revenue | D&B | ZoomInfo | Public filings | Public filings override all |
| industry | Clearbit | ZoomInfo | NAICS mapping | LIT mapping applied after merge |
| tech_stack | BuiltWith | HG Insights | Job postings | Union (merge all detected) |
| contact_email | Apollo | Hunter | ZoomInfo | Highest confidence score wins |
| contact_title | LinkedIn | ZoomInfo | Apollo | LinkedIn overrides all |
| funding_data | Crunchbase | PitchBook | Press releases | Most recent verified source |

## 5. Data Quality Standards

### 5.1 Quality Benchmarks

| Attribute Category | Completeness Target | Accuracy Target | Freshness Target | Verification Method |
|-------------------|--------------------|-----------------|------------------|-------------------- |
| Core (name, domain, size, industry) | 95%+ | 90%+ | Refreshed within 90 days | Automated cross-source validation |
| Extended (revenue, location, ownership) | 80%+ | 85%+ | Refreshed within 180 days | Quarterly audit sampling |
| Technographic | 60%+ | 80%+ | Refreshed within 30 days | BuiltWith weekly scan |
| Growth indicators | 70%+ | 75%+ | Refreshed within 7 days | Continuous monitoring |
| Contact data | 85%+ | 80%+ (email valid) | Refreshed within 30 days | Email verification service |
| Scores | 90%+ | Validated quarterly | Real-time computation | Backtesting against conversion data |

### 5.2 Quality Scoring

Each record receives a composite quality score (0-100) based on:

```
Quality_Score = (completeness × 0.30) + (accuracy × 0.30) + (freshness × 0.20) + (source_reliability × 0.20)
```

| Quality Tier | Score Range | Action |
|-------------|-----------|--------|
| Gold | 90-100 | Safe for automated outreach |
| Silver | 75-89 | Safe for outreach with spot-check |
| Bronze | 60-74 | Require manual review before outreach |
| At-Risk | 40-59 | Queue for enrichment before use |
| Unusable | 0-39 | Exclude from active workflows |

### 5.3 Data Quality Monitoring

| Check | Frequency | Threshold | Alert Condition | Auto-Remediation |
|-------|-----------|-----------|-----------------|-----------------|
| Email bounce rate | Per campaign | <5% | >5% bounce rate triggers source review | Auto-suppress bouncing emails |
| Employee count variance | Weekly | <30% diff between sources | >30% variance triggers manual check | Use highest reliable source |
| Domain validity | Monthly | <2% invalid | >2% triggers re-verification | Auto-remove invalid domains |
| Industry classification conflict | Weekly | <10% conflict | >10% triggers taxonomy review | Default to most recent source |
| Score drift | Monthly | <5 points drift | >5 points triggers model revalidation | Auto-recalibrate scoring model |

## 6. Enrichment Workflows

### 6.1 New Record Enrichment Pipeline

```
[Raw Company/Contact Input]
         ↓
[Domain Extraction + Validation]
         ↓
[Clearbit Enrichment] → [Company firmographics]
         ↓
[Apollo.io Lookup] → [Contact data]
         ↓
[BuiltWith Scan] → [Technographic data]
         ↓
[Crunchbase Lookup] → [Funding data]
         ↓
[LinkedIn Cross-Reference] → [Org structure + title verification]
         ↓
[ICP Scoring (Atlas)] → [ICP fit + tier assignment]
         ↓
[Buying Propensity Scoring (Judge)] → [Composite score + tier]
         ↓
[Quality Scoring] → [Gold/Silver/Bronze/At-Risk classification]
         ↓
[CRM Sync] → [Available for agent workflows]
```

### 6.2 Incremental Enrichment Triggers

| Trigger | Data Updated | Workflow | SLA |
|---------|-------------|----------|-----|
| New free user signup | Company firmographics + ICP score | Full enrichment pipeline | 4 hours |
| PQL threshold crossed | Buying propensity score | Score recalculation + alert | 1 hour |
| Trigger event detected | Growth indicators + timing score | Targeted enrichment update | 2 hours |
| Scheduled refresh | All attributes | Full enrichment pipeline | Quarterly |
| Quality score drop | Specific failing attributes | Targeted re-enrichment | 24 hours |
| CRM manual update | Overridden fields | Re-verification + cascade | 48 hours |

### 6.3 Enrichment Priority Queue

Records are enriched in priority order:

1. **P0 - Critical**: Hot PQL accounts, active deals, accounts in outreach sequences
2. **P1 - High**: Warm PQL accounts, Tier 1 ICP accounts, recent trigger events
3. **P2 - Medium**: Tier 2 ICP accounts, scheduled quarterly refreshes
4. **P3 - Low**: Tier 3 ICP accounts, long-term nurture accounts
5. **P4 - Deferred**: Non-ICP accounts, excluded segments

## 7. Integration Patterns

### 7.1 LeadReach Agent Data Consumption

| Agent | Primary Data Consumed | Query Pattern | Data Volume | Latency Requirement |
|-------|----------------------|---------------|-------------|-------------------|
| Atlas | Company firmographics, ICP scores, market data | Batch analysis | Full dataset | <5 min for ICP scoring |
| Scout | Company + contact data, intent signals, triggers | Streaming + query | Event-driven | <1 min for trigger detection |
| Sage | Full company profile, technographic, growth, competitive | On-demand query | Per-account | <30 sec for research gen |
| Judge | ICP scores, buying propensity, PQL scores | Streaming + query | Per-lead | <10 sec for qualification |
| Bard | Company profile, contact data, technographic, usage data | On-demand query | Per-outreach | <5 sec for personalization |
| Flow | Pipeline stage data, engagement signals, scores | Streaming | Event-driven | <1 sec for routing |
| Forge | Raw company/contact data, source APIs | Batch + streaming | Full dataset | <4 hours for enrichment |
| Echo | Aggregate metrics, conversion data, pipeline data | Batch analytics | Full dataset | <15 min for reports |

### 7.2 API Integration Endpoints

| Endpoint | Method | Purpose | Rate Limit | Data Returned |
|----------|--------|---------|-----------|---------------|
| `/v2/companies/{id}` | GET | Retrieve company record | 1000/hr | Full company + scores |
| `/v2/companies/search` | POST | Search companies by criteria | 500/hr | Company list + highlights |
| `/v2/contacts/{id}` | GET | Retrieve contact record | 1000/hr | Full contact + engagement |
| `/v2/contacts/search` | POST | Search contacts by criteria | 500/hr | Contact list + match scores |
| `/v2/enrichment/company` | POST | Enrich company by domain | 200/hr | Enriched company record |
| `/v2/enrichment/contact` | POST | Enrich contact by email | 200/hr | Enriched contact record |
| `/v2/scores/{company_id}` | GET | Get propensity scores | 1000/hr | All scores + tier |
| `/v2/intent/{company_id}` | GET | Get intent signals | 500/hr | Active intent signals |
| `/v2/webhooks/events` | POST | Register for data events | 100/hr | Webhook confirmation |

### 7.3 CRM Sync Patterns

| Sync Type | Direction | Frequency | Conflict Resolution | Fields Synced |
|-----------|-----------|-----------|-------------------|---------------|
| Company Create | LeadReach → CRM | Real-time | CRM wins on conflict | All core firmographic |
| Company Update | Bidirectional | Every 4 hours | Most recent wins | Core + extended |
| Contact Create | LeadReach → CRM | Real-time | CRM wins on conflict | All contact fields |
| Contact Update | Bidirectional | Every 4 hours | CRM wins on contact, LR wins on engagement | Contact + engagement |
| Score Update | LeadReach → CRM | Real-time | LeadReach authoritative | All scores + tiers |
| Activity Log | LeadReach → CRM | Real-time | Append only | All agent activities |

## 8. Update Cadence

| Data Category | Refresh Frequency | Method | SLA | Quality Impact |
|--------------|-------------------|--------|-----|---------------|
| Intent signals | Real-time | Streaming ingestion | <5 min | High timeliness |
| Trigger events | Real-time | Webhook + polling | <15 min | High timeliness |
| Contact data | Daily | Batch enrichment | 24 hours | Medium freshness |
| Company firmographics | Weekly | Incremental refresh | 7 days | Standard freshness |
| Technographic data | Weekly | BuiltWith scan cycle | 7 days | Acceptable lag |
| Growth indicators | Weekly | Source API polling | 7 days | Acceptable lag |
| ICP scores | On-demand | Recomputed on data change | <5 min | Always current |
| Buying propensity | Daily | Model recomputation | 24 hours | Daily refresh |
| Quality benchmarks | Monthly | Full audit + backtesting | 30 days | Quarterly deep audit |
| Market sizing | Quarterly | External data refresh | 90 days | Annual strategic review |
| Taxonomy updates | Semi-annually | LeadReach data team review | As needed | Version-controlled |
