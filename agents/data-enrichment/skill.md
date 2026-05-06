# Data Enrichment Agent — Skills

## Core Skills

### Website Contact Extraction
- **Trigger**: Lead has a website URL but missing contact details
- **Input**: Company website URL
- **Output**: Extracted emails, phone numbers, addresses, contact page URLs
- **Agent-Reach Command**: `curl -s "https://r.jina.ai/URL"` → LLM parses contact info
- **Method**: Jina Reader fetches full page content, LLM extracts structured contact data
- **Sub-pages**: Automatically navigates to /contact, /about, /team pages

### LinkedIn Company Enrichment
- **Trigger**: Need company size, industry, and key personnel data
- **Input**: Company name or LinkedIn URL
- **Output**: Employee count, industry, key personnel names/titles, headquarters
- **Agent-Reach Command**: `mcporter call 'linkedin.get_person_profile(linkedin_url: "URL")'`
- **Fallback**: `curl -s "https://r.jina.ai/https://linkedin.com/company/SLUG"`

### Email Pattern Discovery
- **Trigger**: Have contact names but no email addresses
- **Input**: Company domain, contact first name, contact last name
- **Output**: Likely email addresses with confidence scores
- **Method**: Detect pattern from known emails (e.g., firstname.lastname@), generate candidates
- **Validation**: Basic SMTP check (RCPT TO) without sending email

### Firmographic Data Enrichment
- **Trigger**: Lead missing company size, revenue, or industry codes
- **Input**: Company name, website
- **Output**: Employee count range, revenue estimate, SIC/NAICS codes, founding year
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "COMPANY_NAME revenue employees", numResults: 5)'`
- **Method**: Search for company profile data, cross-reference with website about page

### Technology Stack Detection
- **Trigger**: Need to understand prospect's tech environment for outreach personalization
- **Input**: Company website URL
- **Output**: Detected technologies (CMS, hosting, analytics, frameworks)
- **Agent-Reach Command**: `curl -s "https://r.jina.ai/URL"` → Analyze HTML source for tech signatures
- **Method**: Parse page source for common tech indicators (meta tags, scripts, headers)

### Social Profile Discovery
- **Trigger**: Missing social media links for company or key contacts
- **Input**: Company name, key contact names
- **Output**: LinkedIn URLs, Twitter handles, other social profiles
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "site:linkedin.com/company COMPANY_NAME", numResults: 3)'`
- **Agent-Reach Command (Twitter)**: `bird search "COMPANY_NAME" -n 5`

### Data Cross-Verification
- **Trigger**: Enrichment data from multiple sources needs validation
- **Input**: Lead record with data from 2+ sources
- **Output**: Verified record with confidence scores and conflict flags
- **Method**: Compare field values across sources, majority-wins for factual data, flag conflicts

## Tool Access (Agent-Reach Channels)
- **web**: Primary content extraction from company websites
- **linkedin**: Professional data and company profiles
- **exa_search**: Finding company data across the web
- **twitter**: Social profile linking
- **github**: Tech stack detection for developer-focused companies

## Execution Engine Integration

**Runtime Handler**: `executeDataEnrichment()` in `src/lib/agent-executor.ts`

This agent is executed at runtime by the Agent Execution Engine. When a task is dispatched to this agent:

1. The engine calls the agent's handler function
2. The handler invokes Agent-Reach tool bridge functions (from `src/lib/agent-reach-bridge.ts`)
3. Raw data from Agent-Reach channels is fed to the LLM (z-ai-web-dev-sdk) for structured extraction
4. Results are stored in the database (leads, outreach, task output)

**Agent-Reach Bridge Functions Used**:
- `webRead()` — Full content extraction from company websites for contact info and tech stack detection
- `enrichCompanyData()` — Firmographic data enrichment including revenue, employee count, and industry codes
- `exaSearch()` — Finding company profile data, email patterns, and financial information across the web
- `linkedInSearchPeople()` — Professional data, key personnel, and company profile enrichment

**API Dispatch**:
```
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "data-enrichment",
  "taskType": "enrich",
  "input": { "query": "...", "industry": "...", "location": "..." }
}
```

**Or via AI Chat**:
```
POST /api/ai
{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to this agent → Agent-Reach fetches & enriches company data → Enriched records stored
