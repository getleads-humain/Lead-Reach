# LeadReach Agentic System

> Single source of truth for the LeadReach agentic pipeline architecture.
> Version: 1.0.0 · Published: 2026-06-23

## Overview

The LeadReach Agentic System is the unified layer that orchestrates the
platform's 8 AI agents (Atlas → Scout → Forge → Sage → Judge → Bard →
Flow → Echo) according to a Standard Operating Procedure (SOP) that
adapts to each user query.

It consists of **ten modules** that live in `src/lib/agentic-system/`:

| Module | Path | Purpose |
|--------|------|---------|
| SOP | `sop/sop-spec.ts` | The methodology — single source of truth |
| Workflow Engine | `workflow/workflow-engine.ts` | Wraps the existing orchestrator with safety + telemetry |
| Context Window | `context/context-window.ts` | Token budget management |
| Memory | `memory/memory-store.ts` | Unified recall/remember across scopes |
| Tools | `tools/tool-registry.ts` | Unified tool invocation API |
| MoE Router | `moe/moe-router.ts` | Mixture-of-Experts routing |
| Harness | `harness/harness.ts` | Constraint enforcement |
| Safety | `safety/safety-evals.ts` + `safety/output-validator.ts` | Input/output guardrails + test suite |
| Evals | `evals/eval-runner.ts` + `evals/eval-datasets.ts` + `evals/eval-metrics.ts` | Fixture-based eval framework |
| Telemetry | `telemetry/trace.ts` | Run tracing + admin UI live view |

## Design Principles

1. **Additive, not replacement.** Every existing module (`vellum-core`,
   `agent-infrastructure`, `prospect-agent`) keeps working unchanged.
   The agentic-system module is a unified facade on top.

2. **SOP is methodology, not code.** The SOP spec is a data structure
   (`SOPManifest`) that every other module reads from. Changing the SOP
   does not require touching the workflow engine.

3. **Safety is non-negotiable.** Every pipeline run passes through input
   guardrails (SSRF, prompt-injection, PII, length cap) BEFORE the
   orchestrator runs, and output guardrails (PII redaction, profanity
   filter, competitor block) AFTER.

4. **Evals in CI are dry-run.** The CI workflow runs the eval suite in
   dry-run mode (no real LLM calls, no API quota burned). The admin UI
   can run evals against the real LLM for full end-to-end validation.

5. **Telemetry is best-effort.** If the telemetry persistence fails
   (e.g. DB write error), the pipeline continues. Telemetry is for
   observability, not for correctness.

## Quick Start

### Run a pipeline

```typescript
import { runAgenticWorkflow } from '@/lib/agentic-system';

const result = await runAgenticWorkflow({
  message: 'Find B2B SaaS companies in San Francisco',
  campaignId: 'cmp_abc123',
});

console.log(result.sopVariant);        // 'discovery'
console.log(result.selectedPhases);    // ['atlas', 'scout', 'forge', ...]
console.log(result.safetyPassed);      // true
console.log(result.durationMs);        // 85000
```

### Run the eval suite

```bash
# Dry-run (CI-safe — no LLM calls)
bun run agentic:evals

# Real run (uses the live LLM — run from admin UI for full validation)
# Set DRY_RUN=0 in the admin UI's "Run Evals" button
```

### Run safety checks

```bash
bun run agentic:safety
```

### View the admin dashboard

Navigate to `/admin/agents` to see:
- SOP manifest (agents, variants, phases, constraints)
- MoE experts
- Registered tools
- Recent pipeline runs (live, refreshed every 10s)
- Aggregate stats (success rate, avg duration, safety pass rate)
- Run safety + eval suites on demand

## Architecture Diagram

```
User Query
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Harness (harness.ts)                                   │
│  ─────────────────────────────────────────────────────  │
│  1. Pre-flight checks (SSRF, length)                    │
│  2. Total timeout enforcement                           │
│  3. Counter initialization (tokens, leads, HTTP)        │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Workflow Engine (workflow-engine.ts)                   │
│  ─────────────────────────────────────────────────────  │
│  1. Apply input guardrails                              │
│  2. Select SOP variant (or use forced intent)           │
│  3. Call processWithOrchestrator (8-agent pipeline)     │
│  4. Apply output guardrails                             │
│  5. Record telemetry                                    │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  8-Agent Orchestrator (prospect-agent/orchestrator.ts)  │
│  ─────────────────────────────────────────────────────  │
│  Atlas → Scout → Forge → Sage → Judge → Bard → Flow →   │
│  Echo (per SOP variant — see sop-spec.ts)               │
└─────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│  Telemetry (telemetry/trace.ts)                         │
│  ─────────────────────────────────────────────────────  │
│  - Ring buffer (in-process, 100 runs)                   │
│  - AgentLog table (persistent)                          │
│  - Admin UI live view                                   │
└─────────────────────────────────────────────────────────┘
```

## CI/CD Integration

Three GitHub Actions workflows gate the agentic system:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `.github/workflows/ci.yml` | Every push/PR | Lint + typecheck + build |
| `.github/workflows/agentic-evals.yml` | PRs touching `src/lib/agentic-system/**` | Run eval suite (dry-run) |
| `.github/workflows/agentic-safety.yml` | PRs touching `src/lib/agentic-system/**` | Run safety eval suite |
| `.github/workflows/codeql-analysis.yml` | Every push/PR + weekly | CodeQL security scan (existing) |

The eval + safety workflows upload their reports as artifacts (retained
14-30 days) so you can download them from the Actions tab.

## SOP Variants

The SOP defines **6 variants** — one per intent family. Atlas picks the
right variant based on the classified intent:

| Variant | Intents | Phases | Est. Duration |
|---------|---------|--------|---------------|
| `discovery` | research_company, research_url, refine_search | Atlas → Scout → Forge → Judge → Flow → Echo | ~90s |
| `enrichment` | research_person | Atlas → Scout → Forge → Sage → Judge → Flow → Echo | ~120s |
| `qualification` | score_lead, build_icp | Atlas → Judge → Flow → Echo | ~30s |
| `outreach` | compose_outreach, add_to_pipeline | Atlas → Bard → Flow → Echo | ~30s |
| `analysis` | analyze_market, analyze_competitors | Atlas → Sage → Echo | ~60s |
| `conversation` | clarify, converse | Atlas → Echo | ~8s |

## Constraints

Every pipeline run is bounded by these constraints (defined in
`sop-spec.ts`):

| Constraint | Default | Rationale |
|------------|---------|-----------|
| Total timeout | 300s | Matches SSE endpoint's maxDuration |
| Per-phase timeout | 60s | Long enough for Forge's deep crawl |
| Max tokens/run | 50,000 | Conservative budget for GLM-4.7-flash |
| Max leads/run | 5 | Prevents runaway enrichment |
| Max HTTP/lead | 8 | Caps Forge's crawl depth |
| Forbidden URLs | localhost, 192.168.x, 169.254.x, etc. | SSRF defense |
| Allowed schemes | http, https | Block file:// and others |

## MoE (Mixture of Experts)

LeadReach uses **expert pipelines** (not neural MoE) — each expert
corresponds to a SOP variant. The MoE router (`moe-router.ts`) selects
the best expert for a given intent.

| Expert | SOP Variant | Quality | Cost | Latency |
|--------|-------------|---------|------|---------|
| discovery_expert | discovery | 85% | 4/10 | ~90s |
| enrichment_expert | enrichment | 80% | 6/10 | ~120s |
| qualification_expert | qualification | 90% | 2/10 | ~30s |
| outreach_expert | outreach | 88% | 3/10 | ~30s |
| analysis_expert | analysis | 82% | 5/10 | ~60s |
| conversation_expert | conversation | 95% | 1/10 | ~8s |

The router currently uses intent-based hard routing (one expert per
intent). Future enhancement: when LeadReach has multiple LLM backends,
the router can become a true soft MoE that fans out to multiple experts
and picks the best result.

## Memory Model

The unified memory store (`memory-store.ts`) provides a single API for
all agents to remember things across pipeline runs:

```typescript
import { remember, recall, forget } from '@/lib/agentic-system';

// Store a fact
await remember('campaign:abc123', 'top_lead', { company: 'Stripe', score: 92 });

// Recall it later
const top = await recall<{ company: string; score: number }>('campaign:abc123', 'top_lead');

// Forget it when the campaign is deleted
await forget('campaign:abc123', 'top_lead');
```

Scopes are hierarchical: `campaign:<id>` / `lead:<id>` / `agent:<name>` /
`global`.

Backends:
- **In-process LRU cache** (500 entries) — hot path, sub-millisecond
- **Prisma `VellumMemoryNode` table** — durable, persisted across restarts

## Tool Registry

Every tool the agentic system can invoke is registered with a
consistent schema:

```typescript
import { invokeTool, listTools } from '@/lib/agentic-system';

// List all registered tools
const tools = listTools();

// Invoke a tool by name
const result = await invokeTool('exa_search', { query: 'B2B SaaS', maxResults: 25 });
```

Currently registered tools (see `tool-registry.ts` for the full list):
- `duckduckgo_search` — zero-config web search
- `exa_search` — higher-quality web search (requires `EXA_API_KEY`)
- `crawl4ai_read` — single-URL crawl via the Python crawl4ai service
- `linkedin_search_companies` — LinkedIn company search
- `persist_lead` — create/update a Lead row
- `generate_summary` — natural-language summary for Echo

## Safety Framework

Two layers of guardrails wrap every pipeline run:

### Input Guardrails (run before the orchestrator)
- **SSRF protection** — blocks localhost, internal IPs, cloud metadata
- **Prompt-injection detection** — common attack patterns
- **PII redaction** — emails, phone numbers, SSNs, credit cards
- **Length cap** — rejects messages > 10,000 characters

### Output Guardrails (run before the response is sent)
- **PII redaction** in summaries
- **Profanity filter** (basic)
- **Competitor mention block** (configurable)
- **Hallucination detection** (planned — compare claims against source URLs)

The safety eval suite (`safety-evals.ts`) has 14 test cases across 5
categories (prompt injection, PII leakage, SSRF, length cap, profanity).
All 14 pass in CI.

## Evaluation Framework

The eval framework (`evals/`) has 13 fixtures across 3 categories:

| Category | Fixtures | What it tests |
|----------|----------|---------------|
| intent_classification | 8 | Atlas correctly classifies the user intent |
| sop_selection | 3 | The right SOP variant runs for each intent |
| output_quality | 2 | Output contains expected strings, no forbidden strings |

In dry-run mode (CI), fixtures are simulated — the framework verifies
the harness is wired correctly. In real-run mode (admin UI), fixtures
exercise the live LLM.

## Telemetry

Every pipeline run is traced and recorded:

- **Ring buffer** (in-process, 100 most recent runs) — for the admin
  UI's live view
- **AgentLog table** (persistent) — for long-term analysis
- **Run stats** (success rate, avg duration, safety pass rate, by-variant
  breakdown) — surfaced in the admin UI

Trace events are also forwarded to the workflow engine's `onTrace`
callback for live SSE streaming to the client.

## Public API

The full public API is exported from `src/lib/agentic-system/index.ts`.
Key functions:

```typescript
// SOP
getSopManifest()
pickSopVariant(intent)
selectPhasesForIntent(intent)

// Workflow
runAgenticWorkflow(input, opts?)

// Context
getActiveContextWindow()
estimateTokens(text)

// Memory
remember(scope, key, value, opts?)
recall<T>(scope, key)
forget(scope, key)
search(scope, query)

// Tools
invokeTool(name, input)
listTools()

// MoE
routeQuery(intent)
listExperts()

// Harness
runInHarness(input, opts?)
preflightChecks(input)

// Safety
runSafetyEvals()
applyInputGuardrails(message)
applyOutputGuardrails(output)
validateConstraints()

// Evals
runEvalSuite(opts?)
smokeCheck()

// Telemetry
getRecentRuns(limit?)
getRunStats()
```

## File Map

```
src/lib/agentic-system/
├── index.ts                          # Public API barrel
├── sop/
│   └── sop-spec.ts                   # SOP definitions (agents, variants, phases, constraints)
├── workflow/
│   └── workflow-engine.ts            # Wraps processWithOrchestrator with safety + telemetry
├── context/
│   └── context-window.ts             # Token budget manager (LRU + compaction)
├── memory/
│   └── memory-store.ts               # Unified remember/recall across scopes
├── tools/
│   └── tool-registry.ts              # Tool registration + invocation
├── moe/
│   └── moe-router.ts                 # Mixture-of-Experts routing
├── harness/
│   └── harness.ts                    # Constraint enforcement
├── safety/
│   ├── output-validator.ts           # Input/output guardrails
│   └── safety-evals.ts               # 14-test safety suite
├── evals/
│   ├── eval-datasets.ts              # 13 eval fixtures
│   ├── eval-metrics.ts               # Per-fixture + suite report metrics
│   └── eval-runner.ts                # Dry-run + real-run runner
└── telemetry/
    └── trace.ts                      # Run tracing + ring buffer + DB persistence

src/app/admin/agents/page.tsx        # Admin dashboard (live view)
src/app/api/admin/agents/
├── overview/route.ts                 # GET — SOP manifest + experts + tools + recent runs + stats
├── evals/route.ts                    # GET — run eval suite (dry-run by default)
├── safety/route.ts                   # GET — run safety eval suite
└── runs/route.ts                     # GET — recent pipeline runs + stats

scripts/evals/
├── run-evals.ts                      # CI entrypoint for eval suite
├── run-safety.ts                     # CI entrypoint for safety suite
└── smoke-check.ts                    # CI fast sanity check (3 fixtures)

.github/workflows/
├── ci.yml                            # Main CI (lint + typecheck + build)
├── agentic-evals.yml                 # Eval suite on PRs touching agentic-system/
├── agentic-safety.yml                # Safety suite on PRs touching agentic-system/
└── codeql-analysis.yml               # (existing) CodeQL security scan
```

## Adding a New Tool

1. Open `src/lib/agentic-system/tools/tool-registry.ts`
2. Add a new `registerTool(...)` call inside `ensureToolsRegistered()`
3. Specify the schema (name, description, category, cost, external,
   requiredEnv)
4. Implement the `invoke` function — it should return
   `ToolInvocationResult`
5. The tool is now available via `invokeTool(name, input)` and shown in
   the admin UI

## Adding a New SOP Variant

1. Open `src/lib/agentic-system/sop/sop-spec.ts`
2. Add a new entry to `SOP_VARIANTS`
3. Add the corresponding phase specs to `SOP_PHASES` if new agents are
   involved
4. Update `pickSopVariant()` and `selectPhasesForIntent()` if needed
5. Add fixtures to `evals/eval-datasets.ts` to cover the new variant
6. The admin UI automatically picks up the new variant on next load

## Adding a New Safety Test

1. Open `src/lib/agentic-system/safety/safety-evals.ts`
2. Add a new entry to `SAFETY_TEST_CASES`
3. Pick the right category (`prompt_injection`, `pii_leakage`, `ssrf`,
   `hallucination`, `length_cap`, `profanity`)
4. Set `shouldBlock: true` if the guardrail should block the input, or
   `false` if it should let it through
5. Run `bun run agentic:safety` to verify

## Related Documentation

- [SOP](./SOP.md) — the full Standard Operating Procedure
- [CodeQL config](../../.github/codeql/codeql-config.yml) — SSRF
  sanitizer registration
- [Agent Reach Toolkit](../../agent-reach-toolkit/) — the 17-channel
  web research toolkit
- [Vellum Core](../../src/lib/vellum-core/) — the existing agent loop,
  channels, memory, and MCP integration
- [Prospect Agent](../../src/lib/prospect-agent/) — the existing 8-agent
  orchestrator
