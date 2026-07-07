---
title: "Agent Pipeline Architecture — The 8-Agent LeadReach Intelligence System"
category: product
grade: A
last_reviewed: "2026-07-03"
tags: [agents, pipeline, architecture, atlas, scout, forge, sage, judge, bard, flow, echo, data-flow, scalability]
---

# Agent Pipeline Architecture — The 8-Agent LeadReach Intelligence System

## Executive Summary

The LeadReach agent pipeline is an 8-stage autonomous system that orchestrates the complete B2B outbound lifecycle—from initial query decomposition through prospect discovery, data enrichment, intelligence synthesis, lead qualification, outreach composition, pipeline execution, and performance reporting. Each agent is a specialized microservice with defined responsibilities, input/output schemas, and communication protocols. The pipeline processes queries through Atlas (orchestrator), Scout (discovery), Forge (enrichment), Sage (intelligence), Judge (qualification), Bard (outreach), Flow (execution), and Echo (reporting), with adaptive routing that selects the minimum sufficient pipeline for each query.

This architecture replaces the traditional manual workflow of switching between 5-7 disconnected tools with a single, intelligent system that maintains context across every stage. The pipeline supports both sequential and parallel execution, handles failure gracefully with fallback strategies, and scales to process thousands of concurrent prospect research and outreach workflows. This document provides the definitive technical reference for the pipeline's architecture, data flow, inter-agent communication, and operational characteristics.

## Pipeline Overview

### The 8 Agents

| # | Agent | Role | Primary Input | Primary Output |
|---|-------|------|---------------|----------------|
| 1 | **Atlas** | Strategic Orchestrator | User query + conversation history | Intent classification, entity extraction, pipeline selection, context packets |
| 2 | **Scout** | Discovery Specialist | Search targets + constraints | Structured search results with quality scores and source citations |
| 3 | **Forge** | Data Enrichment | Prospect seeds from Scout | 50+ field enriched profiles with verification status |
| 4 | **Sage** | Intelligence Analyst | Enriched profiles + knowledge | Contextual insights, industry patterns, strategic recommendations |
| 5 | **Judge** | Qualification Engine | Profile + ICP criteria + Sage insights | ICP scores (0-100), letter grades (A-D), qualification rationale |
| 6 | **Bard** | Outreach Composer | Qualified prospects + personalization variables | Multi-touch sequences, response templates, A/B test variants |
| 7 | **Flow** | Pipeline Orchestrator | Sequences from Bard | Scheduled sends, reply tracking, CRM sync, stage transitions |
| 8 | **Echo** | Reporting Analyst | Pipeline execution data | Performance reports, funnel analytics, optimization recommendations |

### Data Flow

The pipeline follows a directed acyclic graph (DAG) with both sequential and parallel paths:

```
User Query
    │
    ▼
┌─────────┐
│  ATLAS  │ ← Intent Classification + Entity Extraction + Pipeline Selection
└────┬────┘
     │
     ├──────────────────────────────────────────────┐
     │                                              │
     ▼                                              ▼
┌─────────┐                                   ┌─────────┐
│  SCOUT  │ ← Multi-channel parallel search    │  SAGE   │ ← Knowledge synthesis
└────┬────┘                                   └────┬────┘
     │                                              │
     ▼                                              │
┌─────────┐                                         │
│  FORGE  │ ← Multi-source data fusion              │
└────┬────┘                                         │
     │                                              │
     └──────────────┬───────────────────────────────┘
                    │
                    ▼
              ┌─────────┐
              │  JUDGE  │ ← ICP scoring + qualification
              └────┬────┘
                   │
                   ├──────────────────────────────────┐
                   │                                  │
                   ▼                                  ▼
             ┌─────────┐                        ┌─────────┐
             │   BARD  │ ← Sequence composition  │  ECHO   │ ← Early reporting
             └────┬────┘                        └─────────┘
                  │
                  ▼
             ┌─────────┐
             │  FLOW   │ ← Execution + CRM sync
             └────┬────┘
                  │
                  ▼
             ┌─────────┐
             │  ECHO   │ ← Final reporting + analytics
             └─────────┘
```

### Pipeline Variants

Atlas selects the appropriate pipeline variant based on intent classification, reducing latency and cost for simpler queries:

| Variant | Agents | Time Budget | Use Case |
|---------|--------|-------------|----------|
| **Quick Scan** | Atlas → Scout → Echo | 30-60s | Single fact lookup ("What's Acme's revenue?") |
| **Standard Company Profile** | Atlas → Scout → Forge → Sage → Judge → Echo | 2-4 min | Research a specific company |
| **Person Profile** | Atlas → Scout → Forge → Echo | 2-3 min | Research a specific person |
| **ICP Building** | Atlas → Sage → Judge | 1-2 min | Build or refine an Ideal Customer Profile |
| **Outreach Composition** | Atlas → Bard → Echo | 1-2 min | Compose outreach messages for known prospects |
| **Full Discovery Pipeline** | Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo | 5-10 min | End-to-end prospect discovery + outreach |

## Agent Deep Dive

### 1. Atlas — Strategic Orchestrator

**Responsibility**: Decompose user queries, classify intent, extract entities, select pipeline variant, and provide rich context to downstream agents.

**Intent Classification Taxonomy**:

| Intent | Pipeline |
|--------|----------|
| `research_company` | Atlas → Scout → Forge → Sage → Judge → Echo |
| `research_person` | Atlas → Scout → Forge → Echo |
| `research_url` | Atlas → Scout (web) → Forge → Sage → Echo |
| `build_icp` | Atlas → Sage → Judge |
| `score_lead` | Atlas → Judge → Echo |
| `compose_outreach` | Atlas → Bard → Echo |
| `build_sequence` | Atlas → Bard → Flow |
| `refine_search` | Atlas → (relevant agent) |
| `converse` | Atlas (only) |
| `discover_places` | Atlas → Scout (places) → Forge → Judge |

**Context Packet Schema**: Every downstream agent receives a structured context packet containing intent, entities, constraints, original query, conversation history, retrieved knowledge, and prior pipeline results. This ensures no information is lost between stages.

**Adaptive Behavior**: Atlas monitors pipeline execution and adapts mid-pipeline—broadening Scout queries when results are sparse, escalating to alternative channels, and timing out stuck agents with partial results.

### 2. Scout — Discovery Specialist

**Responsibility**: Find companies, people, and places across all available channels with maximum coverage and deduplication.

**Channel Inventory (17+)**:

| Channel | Type | Best For | Rate Limit |
|---------|------|----------|------------|
| Exa Search | Web | General company/person search | ~100 req/hr |
| Jina Reader | Content Extraction | Reading specific URLs | Moderate |
| LinkedIn | Professional | Company info, executives | 25-50 req/day |
| GitHub | Developer | DevTools companies, engineering culture | 60-5000 req/hr |
| Twitter/X | Social | Real-time signals, trigger events | Variable |
| Reddit | Community | Technical industries, opinions | Limited |
| RSS Feeds | Content | Blog/news monitoring | N/A |
| Google Maps | Geographic | Physical businesses, local services | Per API key |
| OpenStreetMap/Overpass | Geographic | Free global location search | 2 req/sec |
| SEC EDGAR | Financial | US public company filings | 10 req/sec |
| OpenCorporates | Registry | Company registration, legal structure | Varies |
| PublicWWW | Technology | Technology detection on websites | Limited free |
| yfinance | Financial | Stock data for public companies | Moderate |
| News Worker | News | Recent news extraction, sentiment | Moderate |
| Geocoder (Nominatim) | Geographic | Address geocoding | 1 req/sec |
| Crunchbase | Database | Funding, company profiles | API required |
| Google Search | Web | General discovery | Moderate |

**Search Strategy Engine**: Scout applies four strategies based on query type:
1. **Company Discovery**: Broad search → verification → enrichment sources → executive discovery
2. **Person Discovery**: Disambiguation → verification → context gathering
3. **Geographic Discovery**: Directory search → geographic search → news → customs data → LinkedIn
4. **Industry Discovery**: Industry databases → tech stack reverse search → job postings → news

**Quality Scoring**: Every result is scored on relevance (0-1), completeness (0-1), freshness (0-1), and source trust (0-1) with a weighted combination: `(relevance × 0.4) + (completeness × 0.3) + (freshness × 0.15) + (source_trust × 0.15)`.

**Deduplication**: Company deduplication uses domain matching (strongest), LinkedIn URL matching, name+geography matching, and fuzzy name+industry matching. Person deduplication uses LinkedIn URL (strongest), email, name+company, and name+role+company.

### 3. Forge — Data Enrichment Specialist

**Responsibility**: Transform bare prospect seeds into complete profiles through multi-source data fusion with source verification.

**Enrichment Stages**:
1. **Identity Resolution**: Confirm uniqueness, verify existence via 2+ sources, establish canonical identifiers
2. **Firmographic Enrichment**: Industry, employee count, revenue, founded year, headquarters, ownership, funding
3. **Technographic Enrichment**: CMS, CRM, marketing automation, analytics, cloud infrastructure, frontend/backend stack
4. **People Enrichment**: C-suite and VP-level executives with LinkedIn URLs and verified emails
5. **Behavioral Enrichment**: Recent news (90 days), trigger events, hiring patterns, content publishing

**Source Hierarchy**:
- Tier 1 (95-100): Government registries, SEC filings, company website
- Tier 2 (80-90): LinkedIn, Crunchbase, industry directories
- Tier 3 (70-85): News outlets, press releases
- Tier 4 (50-70): Aggregators, B2B marketplaces, Google Maps
- Tier 5 (30-50): Inferred, estimated
- Tier 6 (10-30): Unverified, user-submitted

**Conflict Resolution**: When sources disagree, Forge applies hierarchical rules: higher tier wins, more recent wins (within same tier), more specific wins, and corroboration beats single sources. Unresolvable conflicts are marked as `disputed` for Judge to down-weight.

**Verification Layer**: Every enriched field undergoes existence checks, format validation (RFC 5322 for email, RFC 3986 for URLs, E.164 for phones), plausibility checks, cross-reference verification, and recency assessment.

### 4. Sage — Intelligence Analyst

**Responsibility**: Contextualize enriched data with industry-specific knowledge, regional patterns, and strategic recommendations.

**Core Capabilities**:
- **Industry Pattern Matching**: Identifies which industry patterns apply to a prospect based on firmographic and technographic signals
- **Regional Compliance Checking**: Surfaces region-specific regulatory requirements (GDPR for EU, PIPL for China, LGPD for Brazil)
- **Trigger Event Prioritization**: Ranks trigger events by impact on purchase likelihood
- **Competitive Landscape Analysis**: Identifies likely incumbent vendors and displacement opportunities
- **Buying Signal Synthesis**: Combines behavioral signals with technographic data to assess purchase intent

**Knowledge Retrieval**: Sage queries the LeadReach knowledge base before analysis, retrieving industry-specific data sources, regional compliance requirements, common tech stack patterns, and field priorities for the prospect's vertical.

### 5. Judge — Qualification Engine

**Responsibility**: Score prospects against ICP criteria and apply qualification frameworks (BANT, MEDDIC, or custom).

**Scoring Dimensions**:
- **Firmographic Fit** (0-100): How well the company matches ICP criteria
- **Technographic Fit** (0-100): Technology stack alignment with your solution
- **Intent Score** (0-100): Behavioral signals suggesting purchase readiness
- **Trigger Score** (0-100): Time-sensitive opportunity strength
- **Engagement Score** (0-100): Previous interaction quality and recency

**Composite ICP Score**: Weighted combination configurable per campaign. Default weights: Firmographic (30%), Technographic (20%), Intent (25%), Trigger (15%), Engagement (10%).

**Letter Grade Thresholds**:
| Grade | Score Range | Action |
|-------|-------------|--------|
| A | 80-100 | Immediate outreach, highest priority |
| B | 60-79 | Outreach with standard sequence |
| C | 40-59 | Nurture track, low-priority outreach |
| D | 0-39 | Disqualified, do not contact |

**Qualification Frameworks**: Judge supports BANT (Budget, Authority, Need, Timeline), MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion), and custom frameworks defined per campaign.

### 6. Bard — Outreach Composer

**Responsibility**: Compose personalized, multi-touch outreach sequences that earn replies while maintaining full compliance.

**5-Variable Personalization System**: Each email incorporates at least 3 of 5 personalization dimensions extracted from Forge's enriched profiles:
1. Company-specific trigger (funding, product launch, expansion)
2. Role-specific challenge (what this title at this company cares about)
3. Industry-specific pattern (current trends in their vertical)
4. Technology-specific insight (tech stack priorities)
5. Personal detail (recent LinkedIn post, conference talk)

**Default 6-Touch Sequence**: Day 0 (initial email), Day 2 (follow-up with new value angle), Day 4 (LinkedIn connection), Day 7 (trigger-event email), Day 11 (case study email), Day 15 (breakup email).

**Compliance Enforcement**: Every composed sequence includes physical address, unsubscribe link, accurate From headers, non-deceptive subject lines, and documented legitimate interest basis for EU prospects.

### 7. Flow — Pipeline Orchestrator

**Responsibility**: Execute outreach sequences, track replies, manage prospect stages, sync with CRM systems, and enforce compliance.

**7-Stage Funnel**: Identified → Contacted → Engaged → Qualified → Opportunity → Customer → Evangelist, with strict forward-only transitions and explicit override requirements for stage skips.

**Multi-Mailbox Management**: Per-mailbox limits (30-50 emails/day), domain rotation, mailbox warming protocols (5 emails/day, +5/week for 4 weeks), and real-time health monitoring (bounce rate, complaint rate, open rate trends).

**Suppression List**: Automatically maintained with unsubscriptions (CAN-SPAM/GDPR), hard bounces, spam complainers, existing customers, competitors, and recently contacted prospects (90-day cooldown).

**CRM Integration**: Bidirectional sync with Salesforce, HubSpot, and Pipedrive with standard field mapping and custom field support.

### 8. Echo — Reporting Analyst

**Responsibility**: Aggregate pipeline metrics, generate performance reports, and provide optimization recommendations.

**Report Types**: Discovery summaries, enrichment quality metrics, ICP scoring distributions, outreach performance (open/reply/meeting rates), pipeline conversion funnels, source attribution, sales cycle analysis, and CAC calculations.

**Optimization Recommendations**: Echo analyzes pipeline data to suggest ICP refinements, sequence adjustments, channel mix optimization, and timing improvements.

## Inter-Agent Communication

### Communication Protocol

Agents communicate via structured `AgentCommMessage` objects:

```typescript
interface AgentCommMessage {
  from: AgentName;           // 'atlas' | 'scout' | 'forge' | ...
  to: AgentName;             // target agent
  type: 'task' | 'result' | 'clarification' | 'error' | 'progress';
  content: Record<string, any>;  // structured payload
  metadata: {
    task_id: string;         // unique task identifier
    timestamp: string;       // ISO 8601
    parent_task_id?: string; // for sub-tasks
    pipeline_id: string;     // pipeline execution identifier
    tenant_id: string;       // multi-tenancy isolation
    retry_count?: number;    // for retry tracking
  };
}
```

### Communication Patterns

**Sequential**: Atlas → Scout → Forge → Sage → Judge (each stage depends on the previous)

**Parallel**: Scout searches multiple channels simultaneously; Sage synthesizes knowledge while Forge enriches

**Feedback Loops**: Atlas can re-invoke Scout with broader queries if results are sparse; Judge can request re-enrichment from Forge for low-confidence fields

**Error Propagation**: If any agent encounters an error, it sends an `error` type message upstream. Atlas decides whether to retry, use an alternative agent, or return partial results.

### Context Propagation

Each agent receives the full context from upstream agents, including:
- Original user query and conversation history
- Intent classification and entity extraction results
- All prior agent outputs (condensed via memory compaction for long pipelines)
- Retrieved knowledge base documents relevant to the query
- Error and warning messages from prior stages

## Fallback Strategies

### Agent-Level Fallbacks

| Agent | Primary | Fallback | Trigger |
|-------|---------|----------|---------|
| Scout | Exa Search | Jina Reader + Direct Fetch | Rate limit hit |
| Scout | LinkedIn | Web search for LinkedIn content | Rate limit hit |
| Scout | Google Maps | OpenStreetMap Overpass | Quota exhausted |
| Forge | PublicWWW | BuiltWith + Job posting inference | Free tier limit |
| All | GLM-4.7-Flash | GLM-4.6V-Flash | Rate limit or timeout |
| Flow | Primary ESP | Secondary ESP | Delivery failure |

### Pipeline-Level Fallbacks

**Sparse Results (<5 results when ≥20 expected)**:
1. Re-invoke Scout with broader queries (alternate spellings, broader geography)
2. Try alternative channels (different data sources)
3. If still sparse, inform user and suggest query refinements

**Agent Timeout (>2x expected time)**:
1. Stream progress updates to user
2. If single agent stuck, timeout after 60s and continue with partial results
3. Inform user of partial results and offer re-run with adjusted parameters

**Rate Limit Cascade (all channels rate-limited)**:
1. Reduce parallelism (sequential instead of parallel)
2. Switch to alternate data sources with separate rate budgets
3. Cache results aggressively to avoid re-fetching
4. Return partial results with explanation

**LLM Rate Limit (429 errors)**:
1. Switch to fallback model (GLM-4.6V-Flash if GLM-4.7-Flash is rate-limited)
2. Use cached results if available
3. Reduce parallelism
4. Inform user of slower response time

## Scalability Architecture

### Horizontal Scaling

- **Agent Execution**: Each agent runs as a stateless serverless function, scaled automatically by the platform (Vercel)
- **Database**: Supabase PostgreSQL with connection pooling and read replicas for query-heavy operations
- **Search**: Channel-specific rate limits are managed per-tenant with token bucket algorithms
- **Outreach**: Multi-mailbox architecture allows linear scaling of send volume by adding mailboxes

### Vertical Scaling

- **Knowledge Retrieval**: Precomputed embeddings for the knowledge base reduce real-time computation
- **Cache Layer**: Redis-backed caching with 24-hour TTL for search results and enriched profiles
- **Memory Compaction**: Long pipeline runs use memory compaction to reduce context window consumption, summarizing prior agent outputs into compact representations

### Performance Targets

| Metric | Target | Scaling Limit |
|--------|--------|---------------|
| Concurrent pipelines | 500 per tenant | 5,000 per cluster |
| Search queries/sec | 100/sec per tenant | 10,000/sec cluster |
| Enrichment throughput | 1,000 profiles/min | 50,000 profiles/min |
| Outbound emails/day | 10,000 per tenant | 1M per cluster |
| CRM sync operations | 1,000/min per tenant | 100,000/min |
| Report generation | <30s for any report | N/A |

## Technical Implementation Details

### Session Management

Each pipeline execution creates a session with a unique `pipeline_id`. Session state is persisted in Supabase with the following structure:
- `pipeline_id`: Unique identifier
- `tenant_id`: Multi-tenancy isolation
- `user_id`: Initiating user
- `status`: `running` | `completed` | `failed` | `partial`
- `agents_completed`: Array of completed agent names
- `current_agent`: Currently executing agent
- `results`: JSONB field containing all agent outputs
- `error_log`: Array of error messages
- `created_at` / `updated_at`: Timestamps

### Cron-Based Orchestration

The Flow agent and monitoring pipelines run on a cron schedule:
- **Every 5 minutes**: Check for sequence touches due in next 5 minutes
- **Every 15 minutes**: Poll IMAP for new email replies
- **Hourly**: Sync suppression lists, mailbox health checks
- **Daily**: Generate send reports, escalate stuck prospects
- **Weekly**: A/B test analysis, sequence performance review

### Memory Management

Agent conversations and pipeline state can grow large over extended interactions. The memory compaction system (`memory/compaction.ts`) summarizes conversation history when it exceeds the context window threshold:
- Retain: Last 5 messages in full, key decisions, entity extractions, and error history
- Compress: Earlier messages into a 200-word summary
- Prune: Duplicate or redundant messages

### Safety & Output Validation

Every agent output passes through the safety system (`safety/output-validator.ts`) before being surfaced to users or passed to downstream agents:
- **PII Detection**: Prevents accidental exposure of personal data in reports
- **Hallucination Detection**: Cross-references factual claims against source URLs
- **Compliance Checks**: Ensures outreach content includes required CAN-SPAM/GDPR elements
- **Content Policy**: Blocks harmful, deceptive, or inappropriate content

## LeadReach Agent Integration Summary

Every document in the LeadReach knowledge base should reference how it relates to the 8-agent pipeline:

- **Atlas**: Uses knowledge for intent classification, entity extraction, and pipeline selection. Retrieves relevant industry/region/domain documents before invoking downstream agents.
- **Scout**: Uses knowledge for channel selection, search strategy formulation, and regional source identification. Industry-specific knowledge tells Scout which directories and databases to prioritize.
- **Forge**: Uses knowledge for enrichment strategy, source hierarchy, and field-specific data retrieval. Industry knowledge specifies which fields are highest priority (e.g., EHR system for healthcare, funding stage for SaaS).
- **Sage**: Uses knowledge for contextual analysis, industry pattern matching, and compliance checking. Regional knowledge informs regulatory requirements and business norms.
- **Judge**: Uses knowledge for ICP criteria weighting, qualification framework application, and scoring model calibration. Industry knowledge informs which signals are most predictive of purchase intent.
- **Bard**: Uses knowledge for personalization depth, industry vocabulary, and channel selection. Regional knowledge guides tone, formality, and preferred communication channels.
- **Flow**: Uses knowledge for scheduling optimization, regional holiday awareness, and compliance enforcement. Industry knowledge informs timing (e.g., avoid Q4 for retail, April for accounting firms).
- **Echo**: Uses knowledge for report context, metric interpretation, and optimization recommendations. Industry benchmarks inform whether performance is above or below expectations.

## Best Practices

1. **Trust Atlas's pipeline selection**: Don't force the full 8-agent pipeline for simple queries. The Quick Scan variant exists for a reason—lower latency, lower cost, same quality for single-fact lookups.

2. **Monitor Scout's channel utilization**: If Scout consistently fails on specific channels, check rate limit configurations and consider alternative channels for those data types.

3. **Review Forge's disputed fields weekly**: Disputed fields indicate source conflicts. If a specific field (e.g., employee count) is frequently disputed, consider adding a higher-trust data source.

4. **Calibrate Judge's scoring quarterly**: ICP scoring models drift as market conditions change. Review A-grade prospect conversion rates and adjust weights accordingly.

5. **A/B test Bard's sequences continuously**: Even small improvements in reply rate compound across thousands of sends. Test subject lines, hooks, and CTAs systematically.

6. **Monitor Flow's suppression list growth**: A rapidly growing suppression list may indicate deliverability problems or overly aggressive outreach. Review unsubscribe reasons monthly.

7. **Act on Echo's recommendations**: Echo generates optimization suggestions based on pipeline data. Implement the top 3 recommendations each month to continuously improve performance.

8. **Use knowledge retrieval for every pipeline**: Each agent automatically retrieves relevant knowledge, but the quality of retrieval depends on knowledge base coverage. Audit your vertical's knowledge documents quarterly.

## Cross-References

- [LeadReach Platform Overview](./leadreach-platform-overview.md) — Platform overview, capabilities, and competitive positioning
- [Data Security & Privacy](./data-security-privacy.md) — Security architecture, encryption, and compliance
- [Onboarding Quickstart](./onboarding-quickstart.md) — Deploying your first agent pipeline
- [Release Notes](./release-notes.md) — Agent pipeline version history and updates
- [Atlas Training Manual](../agents/atlas.md) — Complete Atlas operational documentation
- [Scout Training Manual](../agents/scout.md) — Complete Scout operational documentation
- [Forge Training Manual](../agents/forge.md) — Complete Forge operational documentation
- [Bard Training Manual](../agents/bard.md) — Complete Bard operational documentation
- [Flow Training Manual](../agents/flow.md) — Complete Flow operational documentation
- [Domain: Data Enrichment Methodology](../domain/data-enrichment-methodology.md) — Detailed enrichment strategies
- [Domain: ICP Design & Scoring](../domain/icp-design-scoring-methodology.md) — ICP construction methodology
- [Domain: Outreach Methodology](../domain/outreach-methodology-cold-email-sequences.md) — Cold email and sequence design
