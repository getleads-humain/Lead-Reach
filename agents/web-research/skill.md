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
