---
title: "Atlas — Orchestrator Agent Tools"
category: tool
agent: atlas
role: orchestrator
tags: [atlas, orchestrator, planning, icp]
last_reviewed: "2026-06-22"
grade: "A"
---

# Atlas — Orchestrator Agent Tools

## 1. Role

Atlas is the orchestrator of the 8-agent pipeline. It receives the operator's intent (a campaign brief or ICP definition), decomposes it into a plan, and dispatches tasks to downstream agents. Atlas does not execute research itself — it plans and coordinates.

## 2. Cognitive Posture

- **Strategic**: Atlas sees the whole field before moving pieces.
- **Decompositional**: Every plan is broken into atomic, verifiable tasks.
- **Accountable**: Atlas owns the plan; if a downstream agent fails, Atlas retries with a different approach.

## 3. Tools

### Tool: decompose_intent

**Purpose**: Convert a natural-language campaign brief into a structured plan.

**Input**:
- `brief` (string): Natural-language description of the campaign goal.
- `constraints` (object): Optional constraints (deadline, budget, region).

**Output**:
```yaml
plan:
  - id: "task_1"
    agent: "scout"
    action: "discover_prospects"
    input: { icp: <icp_definition>, region: "US", population: 1000 }
    deadline: "7 days"
  - id: "task_2"
    agent: "forge"
    action: "enrich_leads"
    input: { leads: <from_task_1> }
    depends_on: ["task_1"]
    deadline: "3 days"
  ...
```

### Tool: validate_icp

**Purpose**: Validate an ICP definition for sufficiency.

**Input**: ICP definition (YAML).

**Output**:
- `valid` (boolean)
- `population_estimate` (number)
- `errors` (array of strings)

### Tool: dispatch_task

**Purpose**: Send a task to a downstream agent.

**Input**: Task object (agent, action, input, deadline).

**Output**: Task ID + acknowledgment.

### Tool: monitor_progress

**Purpose**: Poll the status of all dispatched tasks.

**Input**: Plan ID.

**Output**: Status of each task (pending, in_progress, complete, failed, blocked).

### Tool: replan_on_failure

**Purpose**: When a downstream task fails, generate an alternative plan.

**Input**: Failed task + error context.

**Output**: Revised plan.

## 4. Decision Logic

- **Population too small** → Ask operator to broaden ICP.
- **Downstream agent timeout** → Retry with simplified task; if still failing, escalate to operator.
- **Contradictory constraints** → Ask operator to resolve.

## 5. Handoffs

- **To Scout**: ICP definition + target population + region.
- **From Scout**: List of accounts + contacts + signal scores.
- **To Forge**: List of accounts requiring enrichment.
- **From Forge**: Enriched account + contact records.
- **To Sage**: Specific research questions per account.
- **From Sage**: Research findings per account.
- **To Judge**: Enriched accounts ready for qualification.
- **From Judge**: Qualified leads with scores.
- **To Bard**: Qualified leads ready for outreach.
- **From Bard**: Outreach sequences per lead.
- **To Flow**: Outreach sequences for pipeline management.
- **From Flow**: Pipeline status, deal updates.
- **To Echo**: Pipeline outcomes for reporting.
- **From Echo**: Reports, gap analyses.

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Plan decomposition accuracy | >90% (validated by downstream success) |
| Task dispatch latency | <2s |
| Plan completion rate | >95% |
| Replan rate (tasks requiring replan) | <10% |

## 7. Error Handling & Edge Cases

### 7.1 Plan Decomposition Failures

| Failure Mode | Symptom | Recovery |
|-------------|---------|----------|
| Ambiguous brief | `decompose_intent` returns <3 tasks for a complex goal | Prompt operator: "Your brief is too vague. Please specify: target industry, region, and at least one qualifying signal." |
| Contradictory constraints | Region=EU + CAN-SPAM tone=US_direct | Flag contradiction; ask operator to pick one. Do not silently choose. |
| Impossible deadline | 10,000 accounts in 2 days | Return `population_estimate` vs `feasible_population`; suggest extended deadline. |
| Missing ICP fields | No industry or headcount specified | `validate_icp` returns `valid: false` with specific missing fields listed in `errors[]`. |

### 7.2 Downstream Agent Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Scout returns 0 results | `discover_prospects` yields empty array | Relax ICP constraints (broaden industry, increase headcount range), retry once. If still 0, escalate to operator. |
| Forge enrichment timeout | `enrich_account` exceeds 5 min per account | Skip enrichment for that account; flag as Tier C data quality. Proceed with partial data. |
| Judge confidence <30 | `qualify_lead` returns low confidence | Route to Sage for deeper research before final scoring. |
| Bard compliance failure | `compliance_check` returns `compliant: false` | Do not dispatch. Return to Bard with specific compliance issues to fix. |
| Flow detects circular dependency | Task A depends on B, B depends on A | Break cycle by removing the weaker dependency. Log warning. |

### 7.3 Rate Limit Handling

- When any downstream agent reports HTTP 429, Atlas implements exponential backoff: 5s → 15s → 45s → 135s → escalate.
- If 3 consecutive retries fail, mark task as `failed` and invoke `replan_on_failure`.
- Atlas tracks per-agent rate limit counters; if an agent's budget is >80% consumed, Atlas queues remaining tasks rather than dispatching immediately.

### 7.4 Conflicting Signals

When downstream agents return contradictory data (e.g., Scout says "Series A" but Forge finds "Series C"), Atlas:
1. Logs the conflict with both sources.
2. Prefers the more recent source.
3. If recency is equal, prefers Forge (enrichment overrides discovery).
4. Surfaces the conflict in the plan metadata for operator review.

## 8. Integration Patterns

### 8.1 Sequential Pipeline (Default)

```
Atlas → Scout → Forge → Judge → Bard → Flow → Echo
                 ↓
                Sage (on-demand deep research)
```

Each stage waits for the prior stage to complete before starting. This is the default for new campaigns.

### 8.2 Parallel Enrichment Pattern

When population >500 accounts, Atlas dispatches Forge enrichment in parallel batches:

```yaml
- id: "forge_batch_1"
  agent: "forge"
  action: "enrich_account"
  input: { accounts: <first_200_from_scout> }
  parallel_group: "enrichment"
- id: "forge_batch_2"
  agent: "forge"
  action: "enrich_account"
  input: { accounts: <next_200_from_scout> }
  parallel_group: "enrichment"
```

Batch size: 200 accounts. Max parallelism: 5 batches.

### 8.3 Interrupt-Driven Research

When Judge returns confidence <40 on a lead, Atlas interrupts the pipeline to dispatch Sage:

```
Judge → (low confidence) → Atlas → Sage → Judge (re-score with new data)
```

This loop runs a maximum of 2 times before proceeding with best-available scoring.

### 8.4 Feedback Loop Pattern

Echo's gap reports feed back into Atlas to trigger new campaigns:

```
Echo (gap report: "no docs for healthcare") → Atlas → validate_icp(healthcare) → Scout → ...
```

### 8.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| decompose_intent | dispatch_task | Plan object with task list | YAML/JSON |
| validate_icp | decompose_intent | Validated ICP + population estimate | Object |
| dispatch_task | monitor_progress | Task ID | String |
| monitor_progress | replan_on_failure | Failed task + error context | Object |
| replan_on_failure | dispatch_task | Revised plan tasks | Array |

## 9. Quality Assurance Rules

### 9.1 Plan Validation Rules

- Every plan must have ≥3 tasks (discover, enrich, qualify at minimum).
- Every task must have a deadline ≤30 days from plan creation.
- Every task must have exactly one `agent` and one `action`.
- Dependencies must form a DAG (no cycles).
- If `depends_on` references a task that doesn't exist in the plan, validation fails.

### 9.2 ICP Validation Thresholds

| ICP Field | Required? | Validation Rule |
|-----------|-----------|-----------------|
| industry | Yes | Must match a known NAICS or GICS category |
| headcount_range | Yes | Min < Max; both positive integers |
| region | Yes | Must match ISO 3166-1 alpha-2 or known region group |
| technographics | No | If present, must reference known tech categories |
| revenue_range | No | If present, min < max; both in USD |
| funding_stage | No | Must be one of: pre-seed, seed, series_a, series_b, series_c+, public, unknown |

### 9.3 Confidence Thresholds for Plan Decisions

| Decision | Confidence Threshold | Action if Below |
|----------|---------------------|-----------------|
| Auto-dispatch to Scout | ≥70% | Proceed |
| Auto-dispatch to Forge | ≥60% | Proceed with caution flag |
| Auto-dispatch to Bard | ≥50% | Require human approval |
| Plan archival | ≥90% confidence plan is complete | Archive; else keep open |

### 9.4 Escalation Rules

- **Auto-escalate**: Any task that fails 3 times → human operator notification.
- **Auto-escalate**: Plan completion <50% with 3 days to deadline → human operator notification.
- **Auto-escalate**: Total cost estimate exceeds budget by >20% → human operator approval required.

## 10. Performance Optimization

### 10.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| ICP validation result | 24 hours | On ICP edit |
| Population estimate | 12 hours | On region/industry change |
| Plan template (by industry) | 7 days | On manual refresh |
| Agent health status | 60 seconds | On health check failure |

### 10.2 Parallel Execution Opportunities

- **Scout channels**: `search_linkedin`, `search_apollo`, `search_exa`, `search_gmaps`, `search_web` can all run in parallel.
- **Forge enrichment**: Batch accounts into groups of 200; run up to 5 batches in parallel.
- **Judge scoring**: Score leads in parallel batches of 100.
- **Bard composition**: Compose outreach in parallel per lead (no inter-lead dependency).

### 10.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| decompose_intent | 30s | Return partial plan; flag incomplete |
| validate_icp | 10s | Return `valid: false` with timeout error |
| dispatch_task | 5s | Retry once; then mark task as `pending` |
| monitor_progress | 15s per agent | Skip unresponsive agent; log warning |
| replan_on_failure | 30s | If timeout, escalate to human operator |

### 10.4 Plan Compression

For plans with >20 tasks, Atlas compresses by:
1. Merging sequential tasks targeting the same agent into a single batched task.
2. Collapsing parallel tasks into a single parallel group task.
3. Removing no-op tasks (tasks whose output is never consumed).

## 11. Anti-Patterns

### 11.1 Do Not: Plan Without Validation

Never dispatch a plan where `validate_icp` returned `valid: false`. Unvalidated ICPs lead to Scout discovering irrelevant accounts, wasting enrichment budget.

### 11.2 Do Not: Micro-Plan

Creating a task for every single account (e.g., 1,000 tasks for 1,000 accounts) overwhelms the dispatch queue. Batch accounts into groups of 200 per task.

### 11.3 Do Not: Ignore Dependencies

Dispatching Forge before Scout completes leads to enrichment on an empty list. Always respect `depends_on` chains.

### 11.4 Do Not: Replan Indefinitely

If `replan_on_failure` has been invoked 3 times for the same campaign, stop and escalate to the human operator. The root cause is likely systemic, not transient.

### 11.5 Do Not: Use Atlas for Research

Atlas plans and coordinates; it does not research. If you need to answer a question about a company, route to Sage. Using Atlas's `dispatch_task` to self-research creates circular dependencies.

### 11.6 Do Not: Hard-Code Agent Endpoints

Atlas discovers agent endpoints via the service registry at runtime. Hard-coded endpoints break when agents are redeployed or scaled horizontally.

## 12. Output Schema Deep Dive

### 12.1 decompose_intent Output

```yaml
plan:
  id: "plan_abc123"
  created_at: "2026-06-22T14:30:00Z"
  status: "draft"           # draft | active | completed | failed | archived
  operator: "user@example.com"
  brief: "Find Series B SaaS companies in US hiring SDRs"
  constraints:
    deadline: "2026-07-20"
    budget: 500              # USD in enrichment credits
    region: "US"
  tasks:
    - id: "task_1"
      agent: "scout"
      action: "discover_prospects"
      input:
        icp: { industry: "SaaS", funding_stage: "series_b", headcount_range: [50, 500] }
        region: "US"
        population_target: 1000
      depends_on: []
      deadline: "7 days"
      status: "pending"      # pending | in_progress | complete | failed | blocked
      retries: 0
      estimated_cost: 50     # credits
    - id: "task_2"
      agent: "forge"
      action: "enrich_account"
      input: { accounts: "<from_task_1>" }
      depends_on: ["task_1"]
      deadline: "5 days"
      status: "blocked"
      retries: 0
      estimated_cost: 200
  total_estimated_cost: 450
  total_tasks: 6
  critical_path: ["task_1", "task_2", "task_3", "task_5"]
```

**Field Specifications**:

| Field | Type | Range/Values | Notes |
|-------|------|-------------|-------|
| plan.id | string | `plan_[a-z0-9]{6}` | Unique; immutable once created |
| plan.status | enum | draft, active, completed, failed, archived | Draft → Active on first dispatch |
| tasks[].id | string | `task_[0-9]+` | Sequential within plan |
| tasks[].retries | integer | 0–3 | Max 3; then escalate |
| tasks[].estimated_cost | integer | 0–10,000 | In enrichment credits |

### 12.2 validate_icp Output

```yaml
valid: true
population_estimate: 2840
confidence: 78
errors: []
warnings:
  - "headcount_range upper bound (5000) is very broad; consider narrowing for better signal"
suggestions:
  - "Adding 'hiring SDRs' as a behavioral signal may reduce population by ~60% but increase quality"
icp_hash: "sha256:a1b2c3d4"   # For cache key
```

**Field Specifications**:

| Field | Type | Range/Values | Notes |
|-------|------|-------------|-------|
| valid | boolean | true, false | False if any required field missing or invalid |
| population_estimate | integer | 0–10,000,000 | Based on historical discovery yield for similar ICPs |
| confidence | integer | 0–100 | How confident in the population estimate |
| errors | array<string> | — | Blocking issues; must resolve before proceeding |
| warnings | array<string> | — | Non-blocking; operator should review |
| suggestions | array<string> | — | Optional optimizations |

### 12.3 monitor_progress Output

```yaml
plan_id: "plan_abc123"
overall_status: "in_progress"   # not_started | in_progress | completed | failed
progress_pct: 45
tasks:
  - id: "task_1"
    status: "complete"
    started_at: "2026-06-22T14:31:00Z"
    completed_at: "2026-06-22T18:45:00Z"
    result_summary: "1,247 accounts discovered"
  - id: "task_2"
    status: "in_progress"
    started_at: "2026-06-22T18:46:00Z"
    completed_at: null
    progress_pct: 30
    result_summary: "374 / 1,247 accounts enriched"
  - id: "task_3"
    status: "blocked"
    blocking_on: "task_2"
    result_summary: null
blocked_tasks: ["task_3"]
failed_tasks: []
estimated_completion: "2026-06-25T12:00:00Z"
```

### 12.4 replan_on_failure Output

```yaml
original_plan_id: "plan_abc123"
replan_reason: "task_2 failed: Forge enrichment timeout on 40% of accounts"
revised_plan:
  id: "plan_abc123_v2"
  changes:
    - action: "replace_task"
      old_task: "task_2"
      new_task:
        id: "task_2b"
        agent: "forge"
        action: "enrich_account"
        input: { accounts: "<from_task_1>", skip_technographics: true }
        depends_on: ["task_1"]
        deadline: "5 days"
    - action: "add_task"
      new_task:
        id: "task_2c"
        agent: "sage"
        action: "research_question"
        input: { question: "What CRM does {company} use?", accounts: "<failed_accounts>" }
        depends_on: ["task_2b"]
        deadline: "2 days"
  approval_required: true     # True when plan cost increases by >10%
  estimated_cost_delta: +80
```
