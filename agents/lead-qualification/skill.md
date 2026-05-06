# Lead Qualification Agent — Skills

## Core Skills

### ICP Scoring
- **Trigger**: Enriched lead ready for qualification
- **Input**: Lead record, campaign ICP definition (industry, size, location, revenue range)
- **Output**: Composite score (0-100) with factor breakdown
- **Method**: Multi-factor weighted scoring with configurable weights
- **Factors**: Firmographic fit (30%), Intent signals (25%), Reachability (20%), Strategic value (15%), Data completeness (10%)

### Firmographic Fit Evaluation
- **Trigger**: Part of ICP scoring pipeline
- **Input**: Lead firmographics vs. target criteria
- **Output**: Firmographic fit score (0-100) with mismatch details
- **Method**: Exact match for industry, range match for size/revenue, geographic proximity for location
- **Agent-Reach Command**: Uses enriched data already collected; no additional API calls needed

### Intent Signal Detection
- **Trigger**: Need to identify buying signals for a lead
- **Input**: Company name, website
- **Output**: List of detected intent signals with recency and strength
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "COMPANY_NAME hiring expanding new office funding 2025", numResults: 5)'`
- **Signals**: Job postings, office expansion, new product launches, funding rounds, technology adoption

### Reachability Assessment
- **Trigger**: Lead has contact data but need to assess deliverability
- **Input**: Lead contact information (emails, phones, social profiles)
- **Output**: Reachability score (0-100) with channel-specific ratings
- **Method**: Email format validation, phone format check, social profile verification
- **Agent-Reach Command (LinkedIn)**: `mcporter call 'linkedin.get_person_profile(linkedin_url: "URL")'`

### Strategic Value Rating
- **Trigger**: Need to assess long-term account value
- **Input**: Company data, industry, size, partnerships
- **Output**: Strategic value score (0-100) with reasoning
- **Method**: Deal size estimation based on industry benchmarks + company size
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "INDUSTRY average deal size contract value", numResults: 5)'`

### Lead Tiering & Classification
- **Trigger**: Composite score calculated
- **Input**: Lead scores across all factors
- **Output**: Tier classification (Hot/Warm/Cold) with recommended action
- **Method**: Threshold-based classification with configurable boundaries
- **Hot (80-100)**: Immediate outreach recommended
- **Warm (50-79)**: Nurture sequence recommended
- **Cold (0-49)**: Archive or deprioritize

### Lead Disqualification
- **Trigger**: Lead fails minimum qualification criteria
- **Input**: Lead record, disqualification rules
- **Output**: Disqualification status with reason
- **Method**: Rule-based filtering (wrong industry, too small, out of geography, competitor)
- **Constraint**: Always provides disqualification reason for audit trail

## Tool Access (Agent-Reach Channels)
- **exa_search**: Intent signal detection via news and job posting search
- **web**: Company website analysis for growth signals
- **linkedin**: Company size verification, hiring signals

## Execution Engine Integration

**Runtime Handler**: `executeLeadQualification()` in `src/lib/agent-executor.ts`

This agent is executed at runtime by the Agent Execution Engine. When a task is dispatched to this agent:

1. The engine calls the agent's handler function
2. The handler invokes Agent-Reach tool bridge functions (from `src/lib/agent-reach-bridge.ts`)
3. Raw data from Agent-Reach channels is fed to the LLM (z-ai-web-dev-sdk) for structured extraction
4. Results are stored in the database (leads, outreach, task output)

**Agent-Reach Bridge Functions Used**:
- `exaSearch()` — Intent signal detection via news and job posting search

**API Dispatch**:
```
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "lead-qualification",
  "taskType": "qualify",
  "input": { "query": "...", "industry": "...", "location": "..." }
}
```

**Or via AI Chat**:
```
POST /api/ai
{ "message": "Find accounting firms in Dubai" }
```
→ AI parses intent → Dispatches to this agent → Agent-Reach searches for intent signals → Qualified leads stored
