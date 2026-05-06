# Prospect Discovery Agent — Skills

## Core Skills

### Multi-Channel Web Search
- **Trigger**: Campaign requires prospect discovery
- **Input**: Search query, target geography, industry, company size filters
- **Output**: Raw prospect list with source attribution
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "accounting firms Dubai", numResults: 20)'`
- **Fallback**: `curl -s "https://r.jina.ai/https://www.google.com/search?q=accounting+firms+Dubai"`

### LinkedIn Company Discovery
- **Trigger**: Campaign targets specific professional demographics
- **Input**: Industry, location, company size range
- **Output**: LinkedIn company profiles with basic firmographics
- **Agent-Reach Command**: `mcporter call 'linkedin.search_people(keyword: "accounting Dubai", limit: 20)'`
- **Fallback**: `curl -s "https://r.jina.ai/https://linkedin.com/companies/accounting-dubai"`

### Business Directory Extraction
- **Trigger**: Need structured listings from known directories
- **Input**: Directory URL or directory type (Yellow Pages, Yelp, Google Business)
- **Output**: Structured company entries (name, address, phone, website)
- **Agent-Reach Command**: `curl -s "https://r.jina.ai/DIRECTORY_URL"` → Parse with LLM
- **Method**: Jina Reader fetches page content, LLM extracts structured data

### Social Media Prospecting
- **Trigger**: Need social proof, engagement data, or niche influencers
- **Input**: Platform, search terms, engagement thresholds
- **Output**: Social profiles with engagement metrics and company associations
- **Agent-Reach Command (Twitter)**: `bird search "accounting firm Dubai" -n 20`
- **Agent-Reach Command (Reddit)**: `curl -s "https://www.reddit.com/search.json?q=accounting+Dubai&limit=10"`

### Google Maps Business Discovery
- **Trigger**: Need physical location data for local businesses
- **Input**: Business type, city/region
- **Output**: Business names, addresses, ratings, phone numbers
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "site:google.com/maps accounting firms Dubai", numResults: 10)'`
- **Method**: Search for Google Maps listings, then extract data via Jina Reader

### Result Deduplication
- **Trigger**: After multi-channel search completes
- **Input**: Raw results from all channels
- **Output**: Deduplicated prospect list with merged data and source tracking
- **Method**: Fuzzy matching on company name + domain + phone; merge records with confidence scoring

### Search Strategy Optimization
- **Trigger**: Initial search yields < 50% of target prospect count
- **Input**: Current results, target count, campaign criteria
- **Output**: Revised search queries, expanded geography, alternative channels
- **Method**: LLM-generated query variations, incremental search expansion

## Tool Access (Agent-Reach Channels)
- **exa_search**: Primary web search engine
- **web**: Jina Reader for any URL content extraction
- **linkedin**: Professional and company search
- **github**: Tech company discovery
- **twitter**: Social prospecting and sentiment
- **reddit**: Community intelligence
- **rss**: Industry news and updates

## Execution Engine Integration

**Runtime Handler**: `executeProspectDiscovery()` in `src/lib/agent-executor.ts`

This agent is executed at runtime by the Agent Execution Engine. When a task is dispatched to this agent:

1. The engine calls the agent's handler function
2. The handler invokes Agent-Reach tool bridge functions (from `src/lib/agent-reach-bridge.ts`)
3. Raw data from Agent-Reach channels is fed to the LLM (z-ai-web-dev-sdk) for structured extraction
4. Results are stored in the database (leads, outreach, task output)

**Agent-Reach Bridge Functions Used**:
- `exaSearch()` — Primary web search for prospect discovery across industries and geographies
- `redditSearch()` — Community intelligence and niche prospect identification
- `linkedInSearchPeople()` — Professional and company profile search
- `twitterSearch()` — Social prospecting and sentiment analysis
- `discoverBusinesses()` — Business directory extraction and Google Maps discovery

**API Dispatch**:
```
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "prospect-discovery",
  "taskType": "search",
  "input": { "query": "...", "industry": "...", "location": "..." }
}
```

**Or via AI Chat**:
```
POST /api/ai
{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to this agent → Agent-Reach executes multi-channel search → Results stored as leads
