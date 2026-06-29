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

## 8. Error Handling & Edge Cases

### 8.1 Stage Transition Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| Skip stage (e.g., jumped from Contacted → Meeting Held) | Stage transition validation fails | Allow the jump but flag for AE review; some deals move fast |
| Regression (e.g., from Opportunity → Replied) | Deal moves backward | Allow; note as "regression"; trigger re-qualification by Judge |
| Duplicate deal for same account | Same account + same product | Merge deals; keep the one with more activity |
| Deal stuck at same stage | `detect_stalled_deal` triggers | Suggest re-engagement; escalate if 3+ re-engagements fail |
| Invalid stage value | Stage not in 1–9 range | Reject update; return error with valid stage list |

### 8.2 Stakeholder Map Edge Cases

| Edge Case | Detection | Action |
|-----------|-----------|--------|
| No stakeholders identified | Empty stakeholder array after build | Flag as critical gap; cannot proceed to proposal |
| Stakeholder left company | LinkedIn shows former employee | Remove from active map; archive engagement history |
| Same person in multiple roles | "VP Sales + Interim CRO" | List both roles; primary = current title |
| Unknown decision-maker | No economic buyer identified | Flag as highest-risk gap; route to human AE |
| Champion becomes detractor | Sentiment shift: positive → negative | Alert AE immediately; suggest executive intervention |

### 8.3 Mutual Action Plan Edge Cases

| Edge Case | Action |
|-----------|--------|
| Prospect refuses MAP | Don't force it; track informally with internal next steps |
| MAP milestones missed | Flag as at-risk; suggest re-alignment meeting |
| MAP shared with competitor | Risk; assume information is public; adjust strategy |
| Prospect adds new decision criteria | Update MAP; re-evaluate deal probability |
| Legal review takes >60 days | Common in enterprise; extend timeline but flag to AE |

### 8.4 Forecasting Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| No historical data for this ICP | Model returns wide confidence interval | Use industry benchmarks; flag as low-confidence forecast |
| Deal value keeps changing | Value changed 3+ times in 30 days | Use latest value; flag as "volatile deal" |
| Stage progression contradicts forecast | Deal at stage 2 but forecast says 80% close | Override forecast; use stage-based probability |
| Multiple AEs disagree on forecast | Conflicting manual and auto forecasts | Use auto forecast as baseline; note AE disagreement |

### 8.5 Rate Limit Handling

- CRM API (Salesforce/HubSpot): Max 100 writes/minute. Batch deal updates.
- Email tracking: Max 1000 events/minute. Queue excess for batch processing.
- Calendar API: Max 50 events/minute for meeting booking.

### 8.6 Data Conflicts Between Systems

| Conflict | Source A | Source B | Resolution |
|----------|----------|----------|------------|
| Deal stage | CRM: Stage 6 | Email: No reply in 30 days | Trust CRM as source of truth; flag email data as stale |
| Deal value | CRM: $50K | AE input: $75K | Use AE input (human override); log discrepancy |
| Contact role | CRM: "Champion" | LinkedIn: "Former Employee" | Trust LinkedIn; update CRM |

## 9. Integration Patterns

### 9.1 Full Pipeline Lifecycle

```
Judge → (Tier A lead) → Flow.track_deal (stage 1)
  → Bard.compose_email → Flow.update (outreach sent)
  → Lead replies → Flow.update (stage 2)
  → Meeting booked → Flow.update (stage 3)
  → Meeting held → Flow.update (stage 4)
  → Judge.re-qualify → Flow.update (stage 5)
  → Opportunity created → Flow.build_stakeholder_map
  → Flow.build_mutual_action_plan
  → Proposal → Flow.update (stage 7)
  → Negotiation → Flow.update (stage 8)
  → Closed-Won/Lost → Flow.update (stage 9/9b)
  → Echo.generate_pipeline_report
```

### 9.2 Multi-Thread Orchestration

```
Flow.orchestrate_multithread → {
  Stakeholder 1 (VP Sales): Email Day 1, LinkedIn Day 3, Email Day 7
  Stakeholder 2 (CTO): Email Day 3, LinkedIn Day 5, Email Day 10
  Stakeholder 3 (CFO): Email Day 7 (peer reference for CFOs)
  Stakeholder 4 (Champion): Warm intro request Day 5
}
```

### 9.3 Stalled Deal Recovery

```
Flow.detect_stalled_deal → (deal stuck 18 days at stage 5)
  → Suggest: re-engagement email to champion
  → Bard.compose_email (re-engagement)
  → If no reply in 7 days: suggest multi-thread expansion
  → Flow.orchestrate_multithread (add new stakeholder)
  → If still no reply in 14 days: suggest breakup email
  → Bard.compose_email (breakup)
  → If no reply: archive deal; update forecast
```

### 9.4 Forecast-to-Report Pipeline

```
Flow.forecast_deal → (probability: 35%)
  → Flow.track_deal (with forecast metadata)
  → Monthly: Flow aggregates all forecasts → Echo.generate_pipeline_report
  → Echo compares forecast vs actual → calibration feedback → Flow updates model
```

### 9.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| track_deal | detect_stalled_deal | Deal stage history | Object |
| track_deal | forecast_deal | Stage + value + timeline | Object |
| build_stakeholder_map | orchestrate_multithread | Stakeholder list | Array<Object> |
| orchestrate_multithread | Bard | Per-stakeholder outreach requests | Array<Object> |
| forecast_deal | Echo | Deal probabilities + risks | Object |
| route_to_human | CRM / Notification | Escalation context | Object |

## 10. Quality Assurance Rules

### 10.1 Deal Tracking Validation

- Every deal must have a non-empty `lead_id` and `account_name`.
- Stage must be an integer 1–9 or 9b.
- Value must be a positive number in USD.
- Expected close date must be in the future (for active deals).
- Every stage transition must include a timestamp and source (auto or manual).

### 10.2 Stakeholder Map Quality

| Metric | Minimum | Action if Below |
|--------|---------|-----------------|
| Stakeholders identified (enterprise) | 4 | Flag as "under-threaded"; suggest expansion |
| Stakeholders identified (mid-market) | 2 | Acceptable minimum |
| Economic buyer identified | Required for stages 5+ | Cannot advance to stage 7 without it |
| Champion identified | Required for stages 6+ | Flag as high-risk; route to human AE |
| Engagement level per stakeholder | ≥1 touch per stakeholder | Stale stakeholders should be re-engaged |

### 10.3 Forecast Accuracy Standards

| Metric | Target | Calibration Action |
|--------|--------|--------------------|
| Forecast vs actual (quarterly) | Within ±15% | If >15% off, retrain model with latest data |
| Stage-based probability accuracy | Within ±10pp per stage | Adjust stage probabilities |
| Forecast bias (consistently high/low) | <5% bias | If consistently optimistic, add risk discount |

### 10.4 MAP Quality Checks

- Every MAP must have ≥3 milestones.
- Every milestone must have a date, owner, and deliverable.
- No two milestones may have the same date and owner.
- At least 1 milestone must be owned by the prospect (mutual accountability).

### 10.5 Escalation Rules

| Trigger | Auto-Escalate? | Recipient |
|---------|---------------|-----------|
| Deal stalled >30 days | Yes | Human AE + Sales Manager |
| Deal value >$200K with no champion | Yes | Human AE |
| Forecast drops by >30pp in 7 days | Yes | Human AE |
| Competitor mention in prospect reply | No | Alert AE; do not auto-escalate |
| Legal/procurement blocker | Yes | Human AE + Legal team |

## 11. Performance Optimization

### 11.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Deal status (by deal ID) | 5 minutes | On any deal update |
| Pipeline summary (by campaign) | 15 minutes | On any deal stage change |
| Stakeholder map (by account) | 24 hours | On new stakeholder data |
| Forecast model weights | 7 days | On monthly calibration |
| Stalled deal detection results | 1 hour | On new activity recorded |
| MAP template (by industry) | 30 days | On performance review |

### 11.2 Parallel Execution

- `detect_stalled_deal` can run in parallel for multiple pipelines.
- `forecast_deal` can run in parallel for multiple deals.
- `build_stakeholder_map` for different accounts runs in parallel.
- `track_deal` updates are serialized per deal (no race conditions on stage).

### 11.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| track_deal | 5s | Queue update for retry |
| build_stakeholder_map | 30s | Return partial map with known stakeholders |
| build_mutual_action_plan | 15s | Return template MAP; flag for customization |
| detect_stalled_deal | 60s per pipeline | Return partial results |
| orchestrate_multithread | 20s | Return basic sequence; flag for Bard customization |
| forecast_deal | 10s | Return stage-based probability (no model) |
| route_to_human | 5s | Retry once; if still fails, log to dead letter queue |

### 11.4 Batch Processing

- Deal stage updates are batched: collect updates for 30 seconds, then write to CRM in one batch.
- Stalled deal detection runs as a nightly batch (not real-time).
- Forecast updates run weekly for all active deals.

## 12. Anti-Patterns

### 12.1 Do Not: Track Deals Without Stakeholders

A deal without a stakeholder map is blind. Always run `build_stakeholder_map` before advancing past stage 4. A single-threaded deal at stage 6+ is at extreme risk.

### 12.2 Do Not: Ignore Stalled Deals

Stalled deals don't self-heal. `detect_stalled_deal` must trigger action within 24 hours. Ignoring stalled deals is the primary cause of pipeline rot.

### 12.3 Do Not: Forecast Without Data

If a deal has no stakeholder engagement data, no MAP, and no stage progression, any forecast is a guess. Return `probability: null` rather than a fabricated number.

### 12.4 Do Not: Auto-Advance Stages Based on Time Alone

A deal being at stage 3 for 14 days does not mean it should advance to stage 4. Stage advancement requires actual events (meeting held, proposal sent, etc.), not time elapsed.

### 12.5 Do Not: Create a MAP and Forget It

A MAP that isn't reviewed weekly is dead. Flow should surface MAP milestones in every deal review and flag missed milestones immediately.

### 12.6 Do Not: Override Human AEs Without Justification

Flow manages the pipeline but doesn't own the relationship. If an AE manually overrides a stage or forecast, respect the override and log the reason. Never auto-revert a human decision.

## 13. Output Schema Deep Dive

### 13.1 track_deal Output

```yaml
deal_id: "deal_abc123"
account_name: "Acme Corp"
lead_id: "lead_abc123"
campaign_id: "camp_xyz789"

current_stage: 5
stage_name: "Qualified"
stage_entered_at: "2026-06-22T18:00:00Z"
stage_history:
  - stage: 1
    name: "Contacted"
    entered_at: "2026-05-15T10:00:00Z"
    exited_at: "2026-05-20T14:30:00Z"
    duration_days: 5
    trigger: "email_sent"
  - stage: 2
    name: "Replied"
    entered_at: "2026-05-20T14:30:00Z"
    exited_at: "2026-05-28T09:00:00Z"
    duration_days: 8
    trigger: "reply_received"
  - stage: 3
    name: "Meeting Booked"
    entered_at: "2026-05-28T09:00:00Z"
    exited_at: "2026-06-05T11:00:00Z"
    duration_days: 8
    trigger: "meeting_scheduled"
  - stage: 4
    name: "Meeting Held"
    entered_at: "2026-06-05T11:00:00Z"
    exited_at: "2026-06-22T18:00:00Z"
    duration_days: 17
    trigger: "meeting_completed"
  - stage: 5
    name: "Qualified"
    entered_at: "2026-06-22T18:00:00Z"
    exited_at: null
    duration_days: 0
    trigger: "judge_score_72"

deal_value: 75000
value_currency: "USD"
expected_close_date: "2026-09-30"
owner: "agent"                    # agent | human_ae_id
probability: 45
forecast_category: "pipeline"     # pipeline | best_case | commit | closed

next_actions:
  - action: "build_stakeholder_map"
    priority: "high"
    due: "2026-06-24"
  - action: "identify_economic_buyer"
    priority: "high"
    due: "2026-06-27"
  - action: "schedule_follow_up"
    priority: "medium"
    due: "2026-06-25"

last_activity:
  type: "meeting_held"
  date: "2026-06-22T11:00:00Z"
  summary: "Discovery call with VP Sales. Confirmed pain around SDR productivity."

is_stalled: false
days_in_current_stage: 0
```

### 13.2 build_stakeholder_map Output

```yaml
account_name: "Acme Corp"
deal_id: "deal_abc123"
map_created_at: "2026-06-22T19:00:00Z"

stakeholders:
  - name: "Jane Smith"
    title: "VP of Sales"
    role: "champion"              # champion | economic_buyer | influencer | blocker | end_user | unknown
    engagement: "warm"            # cold | warm | hot | unknown
    sentiment: "positive"         # positive | neutral | negative | unknown
    last_touch: "2026-06-22"
    touch_count: 3
    relationship_strength: 70     # 0-100
  - name: "Bob Johnson"
    title: "CTO"
    role: "influencer"
    engagement: "cold"
    sentiment: "unknown"
    last_touch: null
    touch_count: 0
    relationship_strength: 0
  - name: "Sarah Lee"
    title: "CFO"
    role: "economic_buyer"
    engagement: "cold"
    sentiment: "unknown"
    last_touch: null
    touch_count: 0
    relationship_strength: 0
  - name: "Mike Chen"
    title: "SDR Manager"
    role: "end_user"
    engagement: "warm"
    sentiment: "positive"
    last_touch: "2026-06-20"
    touch_count: 2
    relationship_strength: 55

engagement_gaps:
  - role: "economic_buyer"
    status: "not_engaged"
    criticality: "high"
    suggested_action: "Request warm intro from champion or send CFO-specific value email"
  - role: "influencer"
    status: "not_engaged"
    criticality: "medium"
    suggested_action: "Send CTO-specific content (integration architecture doc)"

thread_health: "at_risk"         # strong | moderate | at_risk | critical
thread_count: 2                  # Engaged stakeholders
recommended_thread_count: 4
```

### 13.3 build_mutual_action_plan Output

```yaml
map_id: "map_abc123"
deal_id: "deal_abc123"
account_name: "Acme Corp"
created_at: "2026-06-22T19:30:00Z"
status: "active"                  # draft | active | completed | abandoned

milestones:
  - id: "ms_1"
    description: "Complete technical evaluation"
    owner: "prospect"             # prospect | seller | joint
    owner_name: "Bob Johnson (CTO)"
    due_date: "2026-07-15"
    deliverable: "Technical requirements document"
    status: "not_started"         # not_started | in_progress | completed | missed
  - id: "ms_2"
    description: "Deliver ROI analysis"
    owner: "seller"
    owner_name: "LeadReach AE"
    due_date: "2026-07-22"
    deliverable: "ROI calculator with Acme's numbers"
    status: "not_started"
  - id: "ms_3"
    description: "CFO budget approval meeting"
    owner: "prospect"
    owner_name: "Sarah Lee (CFO)"
    due_date: "2026-08-01"
    deliverable: "Budget allocation confirmation"
    status: "not_started"
  - id: "ms_4"
    description: "Legal / security review"
    owner: "joint"
    owner_name: "Acme Legal + LeadReach Legal"
    due_date: "2026-08-15"
    deliverable: "Signed security questionnaire + DPA"
    status: "not_started"
  - id: "ms_5"
    description: "Contract signature"
    owner: "joint"
    owner_name: "Sarah Lee (CFO) + LeadReach AE"
    due_date: "2026-09-01"
    deliverable: "Signed MSA + PO"
    status: "not_started"

decision_criteria:
  - criterion: "Salesforce integration depth"
    our_position: "strong"        # strong | neutral | weak | unknown
  - criterion: "SDR onboarding time reduction"
    our_position: "strong"
  - criterion: "Price per seat"
    our_position: "neutral"
  - criterion: "Security compliance (SOC 2)"
    our_position: "strong"

success_criteria:
  - "Reduce SDR ramp time by 30%"
  - "Increase per-rep pipeline generation by 25%"
  - "ROI positive within 6 months"

shared_with_prospect: false       # Whether MAP has been shared
prospect_access_url: null
```

### 13.4 forecast_deal Output

```yaml
deal_id: "deal_abc123"
account_name: "Acme Corp"
current_stage: 5
deal_value: 75000

probability: 45
probability_method: "model"       # model | stage_based | manual
probability_confidence_interval: [35, 55]

expected_close_date: "2026-09-15"
expected_close_date_range: ["2026-08-15", "2026-10-30"]

risks:
  - risk: "Economic buyer not engaged"
    severity: "high"              # high | medium | low
    mitigation: "Request CFO meeting via champion intro"
  - risk: "Only 2 stakeholders engaged (target: 4+)"
    severity: "medium"
    mitigation: "Expand multi-thread outreach to CTO and CFO"
  - risk: "No competitor intel — may be evaluating alternatives"
    severity: "medium"
    mitigation: "Ask champion about evaluation process"

positive_indicators:
  - "Champion identified and engaged (VP Sales, warm)"
  - "Strong behavioral signals (funding, hiring)"
  - "Clear pain point confirmed in discovery call"

next_actions:
  - action: "Engage economic buyer (CFO)"
    due: "2026-06-27"
    assigned_to: "human_ae"
  - action: "Send ROI analysis to champion"
    due: "2026-06-25"
    assigned_to: "agent"
  - action: "Request competitive intel from Sage"
    due: "2026-06-24"
    assigned_to: "agent"

forecast_category: "pipeline"
weighted_value: 33750             # deal_value * probability
```
