# LeadReach Agentic Standard Operating Procedure (SOP)

> Version: 1.0.0 · Published: 2026-06-23
> The single source of truth for how the LeadReach agentic pipeline
> converts user-provided information into actionable, factual, real
> insights through a proper methodology that adapts to each unique
> user query.

## Purpose

The LeadReach Agentic SOP defines the methodology the platform's 8 AI
agents follow to process a user query. It is **methodology, not code** —
the agents are the actors; the SOP is the script.

The SOP exists to ensure that:

1. Every user query is processed by the right combination of agents
2. The pipeline produces factual, source-attributed insights — never fabricated data
3. The pipeline adapts to the shape of each query (research, scoring, outreach, etc.)
4. Safety and constraint boundaries are respected on every run
5. The methodology is auditable — every run can be traced back to the SOP variant that governed it

## The 8 Agents

| # | Agent | Role | Phase Timeout |
|---|-------|------|---------------|
| 1 | **Atlas** | Orchestrator — decomposes the query, classifies intent, plans the pipeline | 15s |
| 2 | **Scout** | Discovery — finds candidates across 17 web channels | 30s |
| 3 | **Forge** | Enrichment — deep-crawls each candidate website for structured data | 60s |
| 4 | **Sage** | Research — market & competitive analysis, trigger events | 45s |
| 5 | **Judge** | Qualification — lead scoring against ICP, tier assignment | 20s |
| 6 | **Bard** | Outreach — personalized first-touch message composition | 25s |
| 7 | **Flow** | Pipeline — lead stage transitions, follow-up scheduling | 10s |
| 8 | **Echo** | Reports — summary generation, actionable insights, KPI updates | 15s |

Each agent has well-defined inputs, outputs, success criteria, and
fallback behavior. See `src/lib/agentic-system/sop/sop-spec.ts` for
the full machine-readable spec.

## The 6 SOP Variants

Not every query needs all 8 agents. Atlas picks the right SOP variant
based on the classified intent:

### 1. Discovery SOP
**Intents:** `research_company`, `research_url`, `refine_search`
**Phases:** Atlas → Scout → Forge → Judge → Flow → Echo
**Est. Duration:** ~90s

The most common SOP. Used when the user wants to find new companies
matching their ICP. Scout runs multi-channel search, Forge enriches the
top candidates, Judge scores them, Flow persists the lead rows, Echo
summarizes.

### 2. Deep Enrichment SOP
**Intents:** `research_person`
**Phases:** Atlas → Scout → Forge → Sage → Judge → Flow → Echo
**Est. Duration:** ~120s

Used for person-level contact research. Adds Sage to find trigger events
that might explain why this person is the right contact (recent funding
round, product launch, hiring announcement).

### 3. Qualification SOP
**Intents:** `score_lead`, `build_icp`
**Phases:** Atlas → Judge → Flow → Echo
**Est. Duration:** ~30s

Used when the user already has a lead and wants to score it against
their ICP. Skips discovery and enrichment — assumes the prospect data is
already available.

### 4. Outreach SOP
**Intents:** `compose_outreach`, `add_to_pipeline`
**Phases:** Atlas → Bard → Flow → Echo
**Est. Duration:** ~30s

Used when the user wants to compose an outreach message for an existing
lead. Bard composes the message, Flow schedules the follow-up sequence,
Echo surfaces the message to the user.

### 5. Market Analysis SOP
**Intents:** `analyze_market`, `analyze_competitors`
**Phases:** Atlas → Sage → Echo
**Est. Duration:** ~60s

Used when the user wants market context, not specific leads. Sage
analyzes the market, identifies trigger events, and Echo surfaces the
insights.

### 6. Conversation SOP (Fast Path)
**Intents:** `clarify`, `converse`
**Phases:** Atlas → Echo
**Est. Duration:** ~8s

Used for clarification questions and general conversation. Skips the
entire pipeline — Atlas classifies the intent as conversational and Echo
returns a helpful response.

## Methodology Principles

### 1. Factual, Source-Attributed Insights
Every claim in the output must have a source URL. If the pipeline cannot
find a source for a fact, the field is `null` — never fabricated.

**Enforced by:** Forge's success criteria — "Every claimed fact has at
least one source URL".

### 2. Adapt to the Query
The pipeline does not blindly run all 8 agents for every query. Atlas
classifies the intent and picks the SOP variant that best matches. A
simple "Hello" does not trigger a 90-second discovery pipeline.

**Enforced by:** Atlas's success criteria — "Selected SOP variant
contains at least atlas + echo".

### 3. Graceful Degradation
If an agent fails, the pipeline continues with what it has. Forge's
website crawl failing does not block the entire run — Forge falls back
to Exa + Jina Reader + web search snippets.

**Enforced by:** Every agent's `fallbackBehavior` field.

### 4. Never Block on a Single Point of Failure
The pipeline uses `Promise.allSettled` for parallel channel searches.
If one channel fails, the others still return results.

**Enforced by:** Scout's implementation in `prospect-agent/orchestrator.ts`.

### 5. Respect the User's Time
Every pipeline run has a hard 5-minute timeout (matching the SSE
endpoint's `maxDuration`). Individual phases have shorter timeouts
(15-60s). If a phase exceeds its timeout, the pipeline moves on with
what it has.

**Enforced by:** `SOP_CONSTRAINTS.totalTimeoutMs` and
`SOP_PHASES[].timeoutMs`.

### 6. Respect the User's Budget
The pipeline caps:
- Tokens per run: 50,000
- Leads per run: 5
- HTTP requests per lead: 8

These caps prevent runaway enrichment from burning API quota.

**Enforced by:** The harness (`harness.ts`) which bumps counters as
agents do work and aborts the run if any cap is exceeded.

### 7. Safety First
Every run passes through input guardrails (SSRF, prompt-injection, PII,
length) BEFORE the orchestrator runs, and output guardrails (PII
redaction, profanity filter) AFTER. Safety violations are logged and
surfaced in the admin UI.

**Enforced by:** The workflow engine (`workflow-engine.ts`) which calls
`applyInputGuardrails` and `applyOutputGuardrails` around the
orchestrator call.

### 8. Auditable
Every run is traced with a unique `traceId`. The trace records:
- The SOP variant selected
- The phases that ran
- The duration of each phase
- The safety violations (if any)
- The final pipeline state

Traces are stored in the in-process ring buffer (last 100 runs) and the
`AgentLog` database table.

**Enforced by:** The telemetry module (`telemetry/trace.ts`).

## Constraints

The SOP defines hard constraints that every run must satisfy. See
`AGENTIC_SYSTEM.md` for the full table.

## Failure Modes & Recovery

| Failure | Detection | Recovery |
|---------|-----------|----------|
| All search channels fail | Scout returns empty list | Echo surfaces "refine your query" suggestion |
| Website crawl fails | Forge catches the error | Falls back to Exa + Jina + search snippets |
| LLM call times out | Phase timeout fires | Phase skips, pipeline continues |
| Total timeout fires | Harness aborts | Partial results returned, error logged |
| Safety guardrail fails | Workflow engine catches | Run blocked, friendly error returned |
| Database write fails | Telemetry catches | Telemetry skipped, pipeline continues |
| Scheduler unavailable | Flow catches | Stage transition persisted, follow-up skipped |

## Evaluation

The SOP is evaluated by the eval suite (`evals/eval-datasets.ts`) which
contains 13 fixtures covering intent classification, SOP selection, and
output quality. The suite runs in dry-run mode in CI (no LLM calls) and
can be run against the live LLM from the admin UI.

The safety suite (`safety/safety-evals.ts`) contains 14 test cases
covering prompt injection, PII leakage, SSRF, length cap, and
profanity. All 14 pass in CI.

## Change Management

The SOP version is tracked in `sop-spec.ts`:

```typescript
export const SOP_VERSION = '1.0.0' as const;
export const SOP_PUBLISHED_AT = '2026-06-23' as const;
```

Any change to the SOP requires:
1. Bumping the version (semantic versioning)
2. Updating the `PUBLISHED_AT` date
3. Adding fixtures to `eval-datasets.ts` if a new variant is added
4. Running `bun run agentic:evals` and `bun run agentic:safety` to verify
5. Updating this document

The admin UI shows the current SOP version on the dashboard header.

## See Also

- [Agentic System Architecture](./AGENTIC_SYSTEM.md) — full technical reference
- [CodeQL config](../../.github/codeql/codeql-config.yml) — SSRF sanitizer
- [Agent docs](../../knowledge/agents/) — per-agent markdown specs
- [Tool docs](../../knowledge/tools/) — per-tool markdown specs
- [Playbooks](../../knowledge/playbooks/) — domain-specific playbooks
