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
