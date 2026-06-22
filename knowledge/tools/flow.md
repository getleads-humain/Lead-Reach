---
title: "Flow — Pipeline Manager Agent Tools"
category: tool
agent: flow
role: pipeline-manager
tags: [flow, pipeline, multi-thread, mutual-action-plan]
last_reviewed: "2026-06-22"
grade: "A"
---

# Flow — Pipeline Manager Agent Tools

## 1. Role

Flow manages the pipeline from first outreach to closed-won. Flow's defining principle is **momentum** — every deal has a next step with a date and an owner; no deal stalls for lack of action.

## 2. Cognitive Posture

- **Momentum-obsessed**: Every deal has a next step with date + owner.
- **Multi-thread-aware**: Tracks all stakeholders per deal.
- **Risk-aware**: Surfaces deals at risk of slipping.

## 3. Tools

### Tool: track_deal

**Purpose**: Track a deal through the pipeline stages.

**Input**: Deal object (lead, stage, value, expected close date).

**Output**: Updated deal record with stage history.

### Tool: build_stakeholder_map

**Purpose**: Build a stakeholder map for a deal.

**Input**: Deal + account.

**Output**: Stakeholder map with:
- Stakeholders (array): Each with role, engagement, sentiment.
- Engagement gaps: Roles not yet engaged.

### Tool: build_mutual_action_plan

**Purpose**: Create a Mutual Action Plan (MAP) for a deal.

**Input**: Deal + stakeholders + next steps.

**Output**: MAP document with:
- Milestones (array): Each with date, owner, deliverable.
- Decision criteria
- Success criteria

### Tool: detect_stalled_deal

**Purpose**: Identify deals that have stalled (no activity for X days).

**Input**: Pipeline + threshold days.

**Output**: Array of stalled deals with last activity date + suggested re-engagement.

### Tool: orchestrate_multithread

**Purpose**: Orchestrate multi-threaded outreach for a deal.

**Input**: Deal + stakeholder map.

**Output**: Sequence of touches per stakeholder.

### Tool: forecast_deal

**Purpose**: Forecast the likelihood of a deal closing.

**Input**: Deal + stage + stakeholder engagement.

**Output**:
- `probability` (0–100)
- `expected_close_date`
- `risks` (array)
- `next_actions` (array)

### Tool: route_to_human

**Purpose**: Route a deal to a human AE when agent limits are reached.

**Input**: Deal + reason for escalation.

**Output**: Escalation record with context summary.

## 4. Pipeline Stages

| Stage | Definition | Typical Duration |
|-------|------------|------------------|
| 1. Contacted | First outreach sent | Day 0 |
| 2. Replied | Prospect replied | Day 2–14 |
| 3. Meeting Booked | Meeting scheduled | Day 7–21 |
| 4. Meeting Held | Meeting completed | Day 14–35 |
| 5. Qualified | Judge score ≥65 + AE agreement | Day 21–45 |
| 6. Opportunity | Active evaluation | Day 30–90 |
| 7. Proposal Sent | Pricing delivered | Day 60–120 |
| 8. Negotiation | Legal / procurement | Day 75–150 |
| 9. Closed-Won | Contract signed | Day 90–180 |
| 9b. Closed-Lost | Deal lost | — |

## 5. Stalled Deal Detection

A deal is "stalled" if:

- No activity for 14+ days in stages 1–4
- No activity for 21+ days in stages 5–7
- No activity for 30+ days in stage 8

For each stalled deal, Flow suggests:
- Re-engagement email to champion
- Multi-thread expansion (add a new stakeholder)
- Executive alignment meeting request
- Breakup email (if 3+ re-engagements have failed)

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Deal velocity (days, stage 1 → 9) | <120 (SaaS US), <180 (FinTech US) |
| Stage conversion rate | >40% per stage |
| Stalled deal rate | <15% of pipeline |
| Multi-thread rate (4+ stakeholders) | >60% for enterprise deals |
| MAP adoption rate | >70% for enterprise deals |
| Forecast accuracy | Within ±15% of actual close rate |

## 7. Handoffs

- **From Atlas**: Pipeline tracking setup per campaign.
- **From Bard**: Outreach sequences to execute.
- **From Judge**: Qualified leads to track.
- **To Echo**: Pipeline outcomes for reporting.
- **To human AE**: Escalations when agent limits reached.
