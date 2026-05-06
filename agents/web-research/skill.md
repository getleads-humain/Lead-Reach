# Web Research Agent — Skills

## Core Skills

### Company Deep-Dive Research
- **Trigger**: User requests detailed analysis of a specific company
- **Input**: Company name, website URL (if known)
- **Output**: Comprehensive company brief with history, services, clients, competitors, recent news
- **Agent-Reach Command**: `curl -s "https://r.jina.ai/COMPANY_URL"` → Full site content extraction
- **Follow-up**: LinkedIn profile, news search, financial data

### Market & Industry Research
- **Trigger**: Need to understand the market landscape before prospecting
- **Input**: Industry, geography, market segment
- **Output**: Market size, key players, trends, growth rate, regulatory landscape
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "INDUSTRY market size trends GEOGRAPHY 2024 2025", numResults: 10)'`
- **Method**: Search for industry reports, then extract data via web reader

### Competitive Landscape Analysis
- **Trigger**: Need to understand competitive dynamics for a target market
- **Input**: Company name or industry segment
- **Output**: Top competitors, market share estimates, positioning map, SWOT analysis
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "COMPANY competitors alternatives", numResults: 10)'`
- **Follow-up**: Individual competitor website analysis

### News & Press Release Monitoring
- **Trigger**: Need recent developments about target companies
- **Input**: Company name, time range
- **Output**: Recent news articles, press releases, funding announcements
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "COMPANY_NAME news 2025", numResults: 10)'`
- **Agent-Reach Command (Twitter)**: `bird search "COMPANY_NAME" -n 10`

### Full Website Content Analysis
- **Trigger**: Need complete understanding of a company's offerings and positioning
- **Input**: Company website URL
- **Output**: Structured analysis of services, pricing, team, clients, case studies
- **Agent-Reach Command**: `curl -s "https://r.jina.ai/URL"` → LLM-based content analysis
- **Method**: Read homepage, /services, /about, /pricing, /clients, /case-studies pages

### Regulatory & Compliance Research
- **Trigger**: Need to understand legal/regulatory requirements in target market
- **Input**: Industry, geography
- **Output**: Relevant regulations, licensing requirements, compliance standards
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "INDUSTRY regulations requirements GEOGRAPHY", numResults: 10)'`
- **Follow-up**: Read government website content via Jina Reader

### Research Synthesis & Briefing
- **Trigger**: Research data collected, need to produce deliverable
- **Input**: Raw research data from multiple sources
- **Output**: Structured intelligence brief with executive summary, key findings, and citations
- **Method**: LLM-powered synthesis with source attribution and confidence levels

## Tool Access (Agent-Reach Channels)
- **web**: Deep content extraction from any website
- **exa_search**: Industry reports, market research, news search
- **linkedin**: Company and professional profiles
- **twitter**: Real-time news and company updates
- **reddit**: Community discussions and market sentiment
- **rss**: Industry publications and news feeds
- **youtube**: Industry conference talks, company presentations

## Execution Engine Integration

**Runtime Handler**: `executeWebResearch()` in `src/lib/agent-executor.ts`

This agent is executed at runtime by the Agent Execution Engine. When a task is dispatched to this agent:

1. The engine calls the agent's handler function
2. The handler invokes Agent-Reach tool bridge functions (from `src/lib/agent-reach-bridge.ts`)
3. Raw data from Agent-Reach channels is fed to the LLM (z-ai-web-dev-sdk) for structured extraction
4. Results are stored in the database (leads, outreach, task output)

**Agent-Reach Bridge Functions Used**:
- `exaSearch()` — Industry reports, market research, news search, and competitive analysis
- `redditSearch()` — Community discussions and market sentiment analysis
- `youtubeSearch()` — Industry conference talks, company presentations, and video content research
- `twitterSearch()` — Real-time news, company updates, and trending topics
- `webRead()` — Deep content extraction from any website for company deep-dives and regulatory research

**API Dispatch**:
```
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "web-research",
  "taskType": "research",
  "input": { "query": "...", "industry": "...", "location": "..." }
}
```

**Or via AI Chat**:
```
POST /api/ai
{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to this agent → Agent-Reach executes multi-source research → Intelligence brief stored
