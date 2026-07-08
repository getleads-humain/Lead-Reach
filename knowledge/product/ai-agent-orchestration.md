---
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
