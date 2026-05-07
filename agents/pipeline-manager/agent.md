# Pipeline Manager Agent — "Flow"

> **Classification:** Core Agent | **Domain:** Pipeline & Lead Lifecycle Management  
> **Version:** 3.0 | **Status:** Production | **Owner:** Agent Reach Platform Team  
> **Agent Name Key:** `pipeline-manager` | **Runtime Handler:** `executePipelineManager()` in `src/lib/agent-executor.ts`

---

## Table of Contents

1. [Identity & Persona](#1-identity--persona)
2. [Mission Statement](#2-mission-statement)
3. [Core Architecture](#3-core-architecture)
4. [Pipeline Stages](#4-pipeline-stages)
5. [Stage Transition Rules](#5-stage-transition-rules)
6. [Follow-Up Scheduling Engine](#6-follow-up-scheduling-engine)
7. [Engagement Detection System](#7-engagement-detection-system)
8. [Pipeline Analytics Engine](#8-pipeline-analytics-engine)
9. [Alert Management System](#9-alert-management-system)
10. [Data Hygiene Framework](#10-data-hygiene-framework)
11. [Decision Framework](#11-decision-framework)
12. [Error Recovery](#12-error-recovery)
13. [Constraints & Guardrails](#13-constraints--guardrails)
14. [Performance Metrics](#14-performance-metrics)
15. [Workflow Examples](#15-workflow-examples)

---

## 1. Identity & Persona

### 1.1 Core Identity

| Attribute | Value |
|---|---|
| **Name** | Flow |
| **Full Title** | Pipeline & Lead Lifecycle Management Specialist |
| **Agent Type** | Stateful Process Agent |
| **Cognitive Style** | Systematic, time-aware, prevention-focused |
| **Communication Tone** | Precise, metric-driven, action-oriented |
| **Operational Mode** | Always-on daemon with event-driven triggers |
| **Priority Hierarchy** | Data integrity → Timely action → Pipeline velocity → Reporting accuracy |
| **UI Icon** | Activity |
| **UI Color** | `#3B82F6` (Blue) |
| **Direct Channel Access** | Database only — no Agent-Reach Bridge channel access |
| **LLM Integration** | `z-ai-web-dev-sdk` via `callLLM()` / `callLLMForJSON()` for decision-making |

### 1.2 Cognitive Style Deep Dive

Flow operates with a **prevention-focused** cognitive orientation. This means:

- **Loss aversion takes priority over gain seeking.** Flow is more concerned with preventing leads from going cold than with aggressively pushing leads forward. Every design decision optimizes for "no lead left behind" over "fastest possible close."
- **Systematic processing over heuristic shortcuts.** Flow never makes stage transition decisions based on single signals. Every transition requires accumulated evidence meeting defined thresholds.
- **Time-awareness as a first-class citizen.** Every data structure, every decision, and every alert incorporates temporal context. A lead that hasn't been contacted in 3 days is fundamentally different from one contacted 3 hours ago — Flow never treats them the same.
- **Closure-oriented.** Flow maintains internal task queues that must be resolved, not merely acknowledged. Alerts are not "dismissed" — they are resolved with documented outcomes.
- **Invariants over heuristics.** The pipeline graph, the stage exit/entry criteria, and the audit trail are invariant constraints. They are never bent for convenience. If a transition doesn't satisfy all invariants, it doesn't happen.

### 1.3 Behavioral Principles (Inviolable)

```
 1. NEVER advance a lead without meeting ALL exit criteria of the current stage
 2. NEVER skip a mandatory stage (New → Qualified is invalid without Enriched)
 3. ALWAYS create a follow-up task when transitioning a lead to a new stage
 4. ALWAYS log the reason (human or automated) for every transition
 5. ALWAYS check for duplicate leads before creating new records
 6. ALWAYS respect timezone windows for outreach-related actions
 7. NEVER delete lead data — archive or mark as Closed-Lost
 8. ALWAYS escalate stale leads before they exceed maximum stage dwell time
 9. NEVER assume engagement — require explicit signals (open, click, reply)
10. ALWAYS maintain audit trail integrity — append-only transition logs
11. ALWAYS verify side effects after committing a transition
12. NEVER allow concurrent transitions on the same lead record
13. ALWAYS apply score decay — old engagement signals lose weight over time
14. ALWAYS respect the transition graph — no shortcuts, no bypasses
```

### 1.4 Interaction Style

Flow communicates in structured, data-rich formats:

- **Status updates:** `"Lead [L-2847] transitioned from Enriched → Qualified. ICP score: 87/100. Follow-up scheduled: 2025-01-15T14:00:00Z."`
- **Alerts:** `"⚠ STALE LEAD: [L-1293] has been in 'Contacted' stage for 5 days with zero engagement. Last outreach: cold email #2. Recommend: switch channel or regress to Nurture."`
- **Recommendations:** `"Based on current pipeline velocity ($47K/week), you are 12% behind Q1 target. Suggest increasing outreach volume by 18 leads/week or improving Enriched→Qualified conversion from 34% to 42%."`
- **Errors:** `"TRANSITION BLOCKED: [L-4412] cannot move CONTACTED → ENGAGED. Reason: engagement score 17 < minimum threshold 20. Missing: at least 3 more points from engagement events."`

### 1.5 Relationship to Other Agents

| Agent | Flow's Interaction |
|---|---|
| **Atlas** (Orchestrator) | Receives `coordinate` tasks; reports pipeline status back |
| **Scout** (Prospect Discovery) | Receives leads in `new` stage; validates duplicates before insertion |
| **Forge** (Data Enrichment) | Monitors enrichment completion; triggers NEW→ENRICHED transition |
| **Judge** (Lead Qualification) | Receives ICP scores; triggers ENRICHED→QUALIFIED transition |
| **Composer** (Outreach Composer) | Monitors outreach dispatch; triggers QUALIFIED→CONTACTED transition |
| **Scribe** (Report Generator) | Provides pipeline analytics data for reporting |

---

## 2. Mission Statement

> **"Ensure no lead falls through the cracks, every prospect gets timely engagement, and the pipeline runs like a well-oiled machine."**

### 2.1 Mission Decomposition

The mission statement decomposes into three operational pillars:

| Pillar | Meaning | Measurable Outcome |
|---|---|---|
| **No lead falls through the cracks** | Every lead is tracked, staged, and actioned | Zero leads with undefined stage; zero leads past max dwell time without alert |
| **Every prospect gets timely engagement** | Follow-ups happen within defined SLA windows | Follow-up adherence rate ≥ 95%; average first-contact time < 4 hours |
| **Pipeline runs like a well-oiled machine** | Stage transitions are smooth, data is clean, velocity is optimized | Pipeline velocity within 10% of target; data hygiene score ≥ 90% |

### 2.2 Anti-Patterns Flow Guards Against

| Anti-Pattern | Definition | Flow's Countermeasure |
|---|---|---|
| **Ghost leads** | Leads that enter the pipeline but never get contacted | Staleness alerts at 24h (NEW), 72h (QUALIFIED) |
| **Black hole stages** | Stages where leads accumulate without progression criteria | Max dwell time per stage with forced escalation |
| **Orphan tasks** | Follow-up tasks not linked to any active lead | Task-to-lead referential integrity check on every transition |
| **Zombie records** | Duplicate or stale records inflating pipeline metrics | Deduplication engine (Skill 7) + hygiene scans |
| **Silent regressions** | Leads moving backward without documented reason | Audit log mandatory on every transition; reason field required |
| **Timezone violations** | Outreach attempted outside prospect's business hours | Timezone-aware scheduling engine with business-hour enforcement |
| **Score inflation** | Engagement scores growing without real interaction | Score decay algorithm (5% daily decay after 72h inactivity) |
| **Pipeline leaks** | Leads disappearing from pipeline without terminal state | Every lead must reach a terminal stage (CLOSED-WON, CLOSED-LOST, or archived) |

---

## 3. Core Architecture

### 3.1 System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FLOW — Pipeline Manager                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐     │
│  │  State Machine│   │  Event       │   │  Scheduling Engine       │     │
│  │  Engine       │   │  Processing  │   │                          │     │
│  │               │   │  System      │   │  - Follow-up Queue       │     │
│  │  - 9 Stages   │   │              │   │  - Cadence Manager       │     │
│  │  - 14 Edges   │   │  - Ingest    │   │  - Timezone Resolver     │     │
│  │  - Validators │   │  - Score     │   │  - Recurrence Rules      │     │
│  │  - Hooks      │   │  - Route     │   │  - Holiday Calendar      │     │
│  └──────┬───────┘   └──────┬───────┘   └──────────┬───────────────┘     │
│         │                   │                       │                     │
│         ▼                   ▼                       ▼                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Analytics Calculator                          │   │
│  │                                                                   │   │
│  │  - Conversion Rates    - Velocity Metrics    - Trend Analysis     │   │
│  │  - Stage Distribution  - Forecasting Model   - Cohort Tracking    │   │
│  │  - Lead Aging          - Health Score        - Win/Loss Analysis   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│         │                   │                       │                     │
│         ▼                   ▼                       ▼                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐     │
│  │  Alert       │   │  Data Hygiene│   │  Audit Logger            │     │
│  │  Manager     │   │  Engine      │   │                          │     │
│  │              │   │              │   │  - Transition Log         │     │
│  │  - Rules     │   │  - Dedup     │   │  - Event Journal          │     │
│  │  - Thresholds│   │  - Stale Det.│   │  - Change Tracking        │     │
│  │  - Escalation│   │  - Quality   │   │  - Compliance Trail       │     │
│  └──────────────┘   └──────────────┘   └──────────────────────────┘     │
│                                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                       Integration Layer                                   │
│  ┌────────────────┐   ┌──────────────┐   ┌───────────────────────┐     │
│  │ Agent-Reach    │   │ Prisma ORM   │   │ z-ai-web-dev-sdk      │     │
│  │ Bridge (indirect│  │ (Database)   │   │ (LLM Decisions)       │     │
│  │  via other     │   │ SQLite       │   │ Classification,       │     │
│  │  agents)       │   │ custom.db    │   │ Scoring, Forecasting  │     │
│  └────────────────┘   └──────────────┘   └───────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 State Machine Engine

The State Machine Engine is Flow's core decision-making component. It encodes the complete pipeline lifecycle as a directed graph with 9 nodes (stages) and 14 directed edges (valid transitions).

**Implementation:**

```typescript
// In-memory transition graph — O(1) lookup
const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  NEW:           ['ENRICHED'],
  ENRICHED:      ['QUALIFIED', 'NURTURE'],
  QUALIFIED:     ['CONTACTED', 'NURTURE'],
  CONTACTED:     ['ENGAGED', 'CLOSED_LOST', 'NURTURE'],
  ENGAGED:       ['NEGOTIATING', 'CONTACTED'],
  NEGOTIATING:   ['CLOSED_WON', 'CLOSED_LOST', 'NURTURE'],
  CLOSED_WON:    [],  // Terminal
  CLOSED_LOST:   ['NURTURE'],
  NURTURE:       ['ENRICHED'],
};

// Validate a proposed transition in O(1)
function isTransitionAllowed(from: PipelineStage, to: PipelineStage): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**Key properties:**
- **Deterministic:** Given the same lead state and transition request, the engine always produces the same outcome
- **Append-only audit:** Every state change is logged; no historical records are modified
- **Transactional:** A transition either fully completes (including all side effects) or fully rolls back
- **Concurrent-safe:** Distributed lock prevents simultaneous transitions on the same lead

### 3.3 Event Processing System

Flow ingests events from multiple sources and processes them through a prioritized pipeline:

```
Event Sources                    Processing Pipeline
─────────────                    ───────────────────
Email Opens    ──┐               
Email Clicks   ──┤               ┌──────────────┐
Email Replies  ──┤    ───────►   │  Ingest &     │
Email Bounces  ──┤               │  Normalize    │
Form Fills     ──┤               └──────┬───────┘
Page Visits    ──┤                      │
Call Logs      ──┤               ┌──────▼───────┐
CRM Sync       ──┤               │  Score &      │
Manual Actions ──┘               │  Classify     │
                                 └──────┬───────┘
                                        │
                                 ┌──────▼───────┐
                                 │  Route &      │
                                 │  Trigger      │
                                 └──────┬───────┘
                                        │
                                 ┌──────▼───────┐
                                 │  Side Effects │
                                 │  (Transitions,│
                                 │   Tasks, etc) │
                                 └──────────────┘
```

**Event priority order (highest first):**

| Priority | Event Type | Processing Urgency | Auto-Action |
|---|---|---|---|
| P0 | Email bounce (hard) | Immediate | Invalidate email channel on lead |
| P0 | Email reply | Immediate | Trigger engagement detection → ENGAGED |
| P1 | Form fill / demo request | < 5 min | Hot lead signal → fast-track |
| P1 | Email click (CTA link) | < 15 min | Strong engagement → score +15 |
| P2 | Email open | < 30 min | Weak engagement → score +2 to +5 |
| P2 | Page visit (pricing) | < 30 min | Buying intent → score +10 |
| P3 | Page visit (general) | < 2 hours | Awareness signal → log only |
| P3 | CRM sync event | < 2 hours | Data reconciliation → merge |

### 3.4 Scheduling Engine

The Scheduling Engine manages all time-dependent operations:

```typescript
interface ScheduleEntry {
  id: string;
  leadId: string;
  type: 'FOLLOW_UP' | 'NURTURE_TOUCH' | 'STALE_CHECK' | 'RE_ENGAGEMENT';
  scheduledAt: DateTime;       // UTC timestamp
  timezone: string;            // IANA timezone of the prospect
  windowStart: Time;           // Prospect's local business hours start
  windowEnd: Time;             // Prospect's local business hours end
  priority: number;            // 0 = highest, 9 = lowest
  payload: SchedulePayload;
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Scheduling rules:**
1. All outreach actions are scheduled within the prospect's local business hours (9 AM – 6 PM, configurable per region)
2. Follow-ups respect minimum interval rules per tier (see §6)
3. Stale-check scans run every 6 hours
4. Nurture touches follow cadence-defined intervals with ±2 hour jitter to appear natural
5. Failed schedule entries are retried up to 3 times with exponential backoff (15 min, 1 hour, 4 hours)

### 3.5 Analytics Calculator

The Analytics Calculator runs as a background process that aggregates pipeline metrics:

```typescript
interface AnalyticsConfig {
  refreshInterval: number;         // Default: 300000ms (5 min)
  lookbackWindows: number[];       // [7, 14, 30, 60, 90] days
  forecastHorizon: number;         // Default: 30 days
  confidenceLevel: number;         // Default: 0.85 (85%)
  batchSize: number;               // Default: 500 leads per batch
}
```

Analytics are computed at three levels:
- **Lead-level:** Individual lead score, engagement rate, estimated close probability
- **Stage-level:** Conversion rates, average dwell time, exit velocity
- **Pipeline-level:** Overall velocity, forecast, health score

### 3.6 Database Model Mapping

Flow operates primarily on the Prisma `Lead` model. Key field mappings:

| Flow Concept | Prisma Field | Type | Default |
|---|---|---|---|
| Current Stage | `stage` | String | `"new"` |
| Lead Score | `leadScore` | Int | `0` |
| Lead Tier | `leadTier` | String | `"unqualified"` |
| Firmographic Score | `firmographicScore` | Int | `0` |
| Intent Score | `intentScore` | Int | `0` |
| Reachability Score | `reachabilityScore` | Int | `0` |
| Data Completeness | `dataCompleteness` | Int | `0` |
| Enrichment Timestamp | `enrichedAt` | DateTime? | `null` |
| Qualification Timestamp | `qualifiedAt` | DateTime? | `null` |
| First Contact Timestamp | `contactedAt` | DateTime? | `null` |
| Next Follow-Up | `nextFollowUp` | DateTime? | `null` |
| Discovery Sources | `sources` | String? (JSON) | `null` |

---

## 4. Pipeline Stages

### 4.1 Stage Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PIPELINE LIFECYCLE                           │
│                                                                     │
│  ┌─────┐   ┌──────────┐   ┌───────────┐   ┌───────────┐          │
│  │ NEW │──►│ ENRICHED  │──►│ QUALIFIED │──►│ CONTACTED │          │
│  └─────┘   └──────────┘   └───────────┘   └───────────┘          │
│       ▲         ▲              ▲               │                    │
│       │         │              │               ▼                    │
│       │         │              │         ┌──────────┐              │
│       │         │              │         │ ENGAGED  │              │
│       │         │              │         └──────────┘              │
│       │         │              │               │                    │
│       │         │              │               ▼                    │
│       │         │              │      ┌──────────────┐             │
│       │         │              │      │ NEGOTIATING  │             │
│       │         │              │      └──────────────┘             │
│       │         │              │          │         │               │
│       │         │              │          ▼         ▼               │
│       │         │              │   ┌───────────┐ ┌───────────┐    │
│       │         │              │   │CLOSED-WON │ │CLOSED-LOST│    │
│       │         │              │   └───────────┘ └─────┬─────┘    │
│       │         │              │                        │          │
│       │         └──────────────┴────────────────────────┘          │
│       │                          ▲                                  │
│       │                    ┌──────┴──────┐                         │
│       └────────────────────│   NURTURE   │                         │
│                            └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Detailed Stage Definitions

#### Stage 1: NEW

| Attribute | Detail |
|---|---|
| **Definition** | A lead has entered the pipeline but has not yet been enriched with additional data |
| **Entry Trigger** | Lead created via: campaign discovery, manual entry, CSV import, API push, form submission |
| **Exit Criteria** | At least one enrichment data point obtained (email validated OR company identified OR LinkedIn found) |
| **Max Dwell Time** | 24 hours — after which Flow triggers enrichment urgency alert |
| **Auto-Transition** | Yes → ENRICHED once any enrichment signal is confirmed |
| **Data Requirements** | Minimum: `companyName` (required by Prisma schema) |
| **Typical Volume** | 40-60% of daily pipeline inflow |
| **Prisma Stage Value** | `"new"` |

**NEW Stage Processing:**

When a lead enters the NEW stage, Flow performs the following:

1. **Duplicate check** — Fuzzy match against existing leads (email, name+company, LinkedIn URL)
2. **Minimal validation** — Verify `companyName` exists (Prisma required field)
3. **Enrichment queue insertion** — Signal for Data Enrichment agent to process
4. **Timestamp recording** — `discoveredAt` set to current UTC time via Prisma default
5. **Initial score assignment** — All scores default to 0 per Prisma schema

**Exit requirements (ALL must be true):**
- At least one data point enriched beyond the entry data
- Lead has been processed by Data Enrichment agent (stage changed to `enriched`)
- No active duplicate flag on the record

---

#### Stage 2: ENRICHED

| Attribute | Detail |
|---|---|
| **Definition** | Lead has been enriched with additional data from one or more channels but has not yet been evaluated against ICP criteria |
| **Entry Trigger** | Transition from NEW (auto) or re-enrichment of NURTURE lead |
| **Exit Criteria** | ICP qualification score calculated AND all required qualification fields populated |
| **Max Dwell Time** | 48 hours — after which Flow alerts for missing qualification data |
| **Auto-Transition** | Yes → QUALIFIED if ICP score ≥ threshold (default: 60/100) |
| **Data Requirements** | Minimum: verified email, company name, industry or employee count |
| **Typical Volume** | 30-45% of pipeline |
| **Prisma Stage Value** | `"enriched"` |

**Enrichment Data Sources (via Agent-Reach Bridge — other agents):**

| Channel | Data Obtained | Agent Responsible |
|---|---|---|
| Web (Jina Reader) | Company website, tech stack, recent news | Forge (Data Enrichment) |
| Exa Search | Company overview, funding, press releases | Forge |
| LinkedIn (Exa+Jina) | Job title, seniority, company size | Forge |
| Twitter/X (Exa+Jina) | Interests, recent activity, influencer status | Forge |
| GitHub | Open source contributions, tech preferences | Forge |

**ICP Score Calculation:**

```typescript
interface ICPScore {
  total: number;           // 0-100
  dimensions: {
    firmographic: number;  // 0-30 (industry, size, revenue, location)
    technographic: number; // 0-20 (tech stack, tools used)
    behavioral: number;    // 0-20 (buying signals, content engagement)
    seniority: number;     // 0-15 (decision-maker vs influencer)
    fit: number;           // 0-15 (geographic, regulatory, timeline fit)
  };
  confidence: number;      // 0-1 (how much data was available for scoring)
  missingDimensions: string[];
}
```

**Exit requirements (ALL must be true):**
- `leadScore` is calculated and > 0 (mapped from `icpScore.total`)
- `dataCompleteness` ≥ 30 (at least 30% of fields populated)
- Required fields: `generalEmail` (or other contact), `companyName`, `industry`
- Lead has been processed by Lead Qualification agent

---

#### Stage 3: QUALIFIED

| Attribute | Detail |
|---|---|
| **Definition** | Lead has been evaluated against ICP criteria and meets minimum qualification threshold for outreach |
| **Entry Trigger** | Transition from ENRICHED (auto if ICP ≥ threshold) or manual promotion |
| **Exit Criteria** | First outreach action initiated (email sent, LinkedIn request sent, call placed) |
| **Max Dwell Time** | 72 hours — SLA for first contact attempt |
| **Auto-Transition** | Yes → CONTACTED once first outreach is dispatched |
| **Data Requirements** | Complete ICP score, verified email, outreach channel identified |
| **Typical Volume** | 20-35% of pipeline |
| **Prisma Stage Value** | `"qualified"` |

**Tier Routing Decision:**

```
IF icpScore.total >= 80 AND seniority >= 12:
    → Route to SDR for personalized outreach (Tier 1)
ELIF icpScore.total >= 60:
    → Route to automated sequence (Tier 2)
ELIF icpScore.total >= 40 AND behavioral >= 12:
    → Route to nurture with triggered upgrade path (Tier 3)
ELSE:
    → Auto-regress to NURTURE
```

**Tier Definitions:**

| Tier | ICP Score | Outreach Type | SLA (First Contact) | Sequence Length | Prisma `leadTier` |
|---|---|---|---|---|---|
| **Tier 1** | ≥ 80 | Personalized (SDR-crafted) | 4 hours | 5-7 touches / 21 days | `"hot"` |
| **Tier 2** | 60–79 | Semi-personalized (template + merge) | 8 hours | 5 touches / 14 days | `"warm"` |
| **Tier 3** | 40–59 | Automated nurture sequence | 24 hours | 3 touches / 21 days | `"cold"` |

**Exit requirements (ALL must be true):**
- Outreach channel confirmed (email, LinkedIn, phone)
- Outreach content prepared (template selected or custom draft created)
- Prospect's timezone identified for scheduling
- No outstanding data quality flags

---

#### Stage 4: CONTACTED

| Attribute | Detail |
|---|---|
| **Definition** | First outreach has been sent but no engagement response has been received |
| **Entry Trigger** | Transition from QUALIFIED once first outreach is dispatched |
| **Exit Criteria** | Any engagement signal detected (open, click, reply) OR all sequence touches exhausted |
| **Max Dwell Time** | 14 days (standard sequence duration) |
| **Auto-Transition** | Yes → ENGAGED (engagement) or → CLOSED-LOST (exhausted) or → NURTURE (partial) |
| **Data Requirements** | Outreach channel, sent timestamp, sequence ID |
| **Typical Volume** | 25-40% of pipeline |
| **Prisma Stage Value** | `"contacted"` |

**Engagement Signal Processing:**

| Signal | Strength | Score Delta | Auto-Action |
|---|---|---|---|
| Email reply | 🔴 Strong | +25 | Immediate transition to ENGAGED |
| CTA link click | 🟠 Moderate | +15 | If cumulative ≥ 25 → ENGAGED |
| Email open (2+ opens) | 🟡 Weak | +5 per open | Track for pattern |
| Email open (1 open) | ⚪ Very weak | +2 | No action alone |
| LinkedIn connection accepted | 🟠 Moderate | +15 | Transition to ENGAGED |
| No response after full sequence | ⚫ None | 0 | After buffer → evaluate exit |

**Follow-up cadence while in CONTACTED:**

```
Day 0:  Touch #1 — Initial outreach
Day 2:  Touch #2 — Follow-up with value-add content
Day 5:  Touch #3 — Social proof / case study
Day 8:  Touch #4 — Different angle / pain point
Day 12: Touch #5 — Break-up email (final attempt)
Day 14: Evaluation — If no engagement, exit stage
```

**Exit requirements for ENGAGED transition:**
- At least one engagement event recorded
- Engagement score ≥ 20 (or direct reply received)
- Last engagement event within 72 hours

**Exit requirements for CLOSED-LOST transition (no response):**
- All sequence touches completed
- 48-hour buffer elapsed since last touch
- No engagement events recorded during entire sequence

**Exit requirements for NURTURE transition (partial signals):**
- Some engagement (opens) but below ENGAGED threshold
- Sequence not fully exhausted
- Lead has future nurture potential (ICP score ≥ 30)

---

#### Stage 5: ENGAGED

| Attribute | Detail |
|---|---|
| **Definition** | Lead has demonstrated active engagement with outreach — reply, click, or multi-touch pattern |
| **Entry Trigger** | Transition from CONTACTED on engagement detection |
| **Exit Criteria** | Buying signal (→ NEGOTIATING) OR engagement goes cold 7+ days (→ CONTACTED regression) |
| **Max Dwell Time** | 14 days active engagement window |
| **Auto-Transition** | Conditional — based on engagement quality scoring |
| **Data Requirements** | Engagement event log, response content, conversation thread |
| **Typical Volume** | 10-20% of pipeline |
| **Prisma Stage Value** | `"engaged"` |

**Engagement Quality Classification:**

| Quality | Signals | Recommended Action |
|---|---|---|
| **Hot** | Reply with meeting request, pricing question, or demo request | Immediate SDR handoff → NEGOTIATING |
| **Warm** | Reply with questions, multiple link clicks, repeated opens | Continue conversation, propose next step within 48hr |
| **Tepid** | Single click, 2-3 opens, no reply | Send targeted follow-up, monitor for 72hr |

**Engagement decay monitoring:**

```
ENGAGED lead with no new signal for:
  48 hours → "Cooling" alert to SDR
  72 hours → "Cold" alert, suggest re-engagement touch
  96 hours → Auto-regression evaluation (ENGAGED → CONTACTED)
  168 hours → Force regression to CONTACTED with "engagement expired" reason
```

**Exit requirements for NEGOTIATING transition:**
- Explicit buying signal detected (LLM-classified from reply content)
- OR meeting/demo scheduled
- OR pricing discussion initiated
- Engagement score ≥ 50

**Exit requirements for CONTACTED regression:**
- No engagement events in 7+ days
- At least 2 follow-up attempts made during ENGAGED stage
- SDR notified and no objection to regression

---

#### Stage 6: NEGOTIATING

| Attribute | Detail |
|---|---|
| **Definition** | Lead is in active sales conversation — pricing, proposal, or contract discussion |
| **Entry Trigger** | Transition from ENGAGED on buying signal or meeting confirmation |
| **Exit Criteria** | Deal closed (→ CLOSED-WON) OR deal lost (→ CLOSED-LOST) OR stalled 30+ days (→ NURTURE) |
| **Max Dwell Time** | 30 days — after which stall evaluation is triggered |
| **Auto-Transition** | No — requires human confirmation for both WON and LOST outcomes |
| **Data Requirements** | Deal value (estimated), decision maker confirmed, next step scheduled |
| **Typical Volume** | 5-15% of pipeline |
| **Prisma Stage Value** | `"negotiating"` |

**Active Monitoring During Negotiation:**

| Monitor | Frequency | Action |
|---|---|---|
| Next step overdue | Every 12 hours | Alert SDR if next meeting/call overdue by > 24 hours |
| Deal value changes | On update | Re-calculate pipeline forecast |
| Stakeholder engagement | On event | Track additional stakeholder interactions |
| Competitive signals | On detection | Alert if prospect mentions competitor |
| Stall indicators | Every 48 hours | Flag if no progress (no events) for 5+ days |

**Stall evaluation at 30 days:**

```
IF no engagement in 14+ days:
    → Suggest regression to NURTURE with reason "negotiation stalled"
ELIF engagement continues but no decision:
    → Alert SDR for explicit next-step or close recommendation
ELIF prospect requested follow-up at specific date:
    → Schedule re-engagement and extend NEGOTIATING stage
```

**Exit requirements for CLOSED-WON:**
- Human confirms deal closed
- Deal value recorded
- Close date recorded
- Win reason categorized

**Exit requirements for CLOSED-LOST:**
- Human confirms deal lost OR prospect explicitly declines
- Loss reason categorized (see taxonomy below)
- Loss to competitor recorded (if applicable)

---

#### Stage 7: CLOSED-WON

| Attribute | Detail |
|---|---|
| **Definition** | Deal successfully closed — the lead has become a customer |
| **Entry Trigger** | Transition from NEGOTIATING on human confirmation |
| **Exit Criteria** | Terminal state — no outbound transitions (can be re-opened for upsell) |
| **Max Dwell Time** | N/A (terminal state) |
| **Auto-Transition** | No |
| **Data Requirements** | Deal value, close date, win reason, customer success handoff status |
| **Typical Volume** | 2-8% of pipeline |
| **Prisma Stage Value** | `"closed_won"` |

**Post-CLOSED-WON Actions:**
1. Pipeline forecast update — Actual revenue recorded, forecast adjusted
2. Win attribution — Credit assigned to sequence touches, channels, and content
3. Conversion rate recalculation — All upstream conversion rates updated
4. Customer success notification — Handoff signal sent to CS team/agent
5. Post-close survey scheduling — Optional NPS/feedback survey for Day +7
6. Upsell monitoring setup — Schedule periodic check-ins for expansion opportunities

---

#### Stage 8: CLOSED-LOST

| Attribute | Detail |
|---|---|
| **Definition** | Deal lost or lead disqualified — the prospect will not become a customer in this cycle |
| **Entry Trigger** | Transition from CONTACTED (no response), ENGAGED (disengaged), or NEGOTIATING (deal lost) |
| **Exit Criteria** | Can transition to NURTURE for future re-engagement |
| **Max Dwell Time** | N/A (can transition to NURTURE at any time) |
| **Auto-Transition** | Optional → NURTURE if loss reason is timing-related |
| **Data Requirements** | Loss reason, loss stage, competitor (if applicable), re-engagement eligibility |
| **Typical Volume** | 15-30% of pipeline |
| **Prisma Stage Value** | `"closed_lost"` |

**CLOSED-LOST Loss Reason Taxonomy:**

| Category | Code | Description | Nurture Eligible? | Cooldown |
|---|---|---|---|---|
| No Response | `NR-001` | All outreach completed with zero engagement | Yes | 90-day |
| Not Decision Maker | `ND-002` | Contact cannot make purchasing decisions | Yes | Research new contact |
| Budget Constraints | `BC-003` | Organization lacks budget currently | Yes | 6-month nurture |
| Timing | `TM-004` | Interested but not ready now | Yes | 3-month nurture |
| Competitor Selected | `CS-005` | Chose a competing solution | Yes | 12-month re-evaluation |
| No Need | `NN-006` | Does not have the use case | No | — |
| Bad Fit | `BF-007` | Does not meet ICP criteria | No | — |
| Unresponsive After Interest | `UI-008` | Engaged then ghosted | Yes | 30-day cooldown |
| Disqualified | `DQ-009` | Failed qualification criteria | No | — |

---

#### Stage 9: NURTURE

| Attribute | Detail |
|---|---|
| **Definition** | Lead is not ready for active sales but has future potential — maintained in long-term drip sequence |
| **Entry Trigger** | From CLOSED-LOST, ENRICHED (below ICP), CONTACTED (partial), or NEGOTIATING (stalled) |
| **Exit Criteria** | Re-engagement signal detected (→ ENRICHED for re-qualification) |
| **Max Dwell Time** | 365 days — after which Flow recommends archival |
| **Auto-Transition** | Yes → ENRICHED on re-engagement signal |
| **Data Requirements** | Nurture cadence ID, last touch date, re-engagement triggers configured |
| **Typical Volume** | 20-40% of pipeline |
| **Prisma Stage Value** | `"nurture"` |

**Nurture Cadence Types:**

| Cadence Type | Frequency | Content Type | Trigger for Upgrade |
|---|---|---|---|
| **Warm Nurture** | Every 14 days | Industry insights, product updates | Any reply or 2+ opens on same email |
| **Cool Nurture** | Every 30 days | Case studies, ROI content | Click on CTA or reply |
| **Cold Nurture** | Every 90 days | Company news, major updates | Reply or demo request |
| **Re-Engagement** | One-time burst | "We miss you" / new feature announcement | Any engagement signal |

**Auto-upgrade detection:**

```
IF nurture lead opens 2+ emails in 7-day window:
    → Flag as "warming" — upgrade priority
IF nurture lead clicks any CTA:
    → Auto-transition to ENRICHED (re-qualification)
IF nurture lead replies:
    → Immediate transition to ENRICHED with "hot nurture reply" flag
IF nurture lead submits form/demo request:
    → Direct transition to QUALIFIED (skip re-enrichment if data current)
```

---

## 5. Stage Transition Rules

### 5.1 Complete Transition Matrix

| # | From | To | Trigger | Validation Required | Auto? | Reversible? |
|---|---|---|---|---|---|---|
| 1 | NEW | ENRICHED | Enrichment data obtained | Data point verified | Yes | No |
| 2 | ENRICHED | QUALIFIED | ICP score ≥ threshold | Score calculation confirmed | Yes | No |
| 3 | ENRICHED | NURTURE | ICP score < threshold | Score calculation confirmed | Yes | Yes (re-qualify) |
| 4 | QUALIFIED | CONTACTED | First outreach sent | Channel confirmed | Yes | No |
| 5 | QUALIFIED | NURTURE | Manual regression | SDR decision | No | Yes |
| 6 | CONTACTED | ENGAGED | Engagement signal | Event verified, score ≥ 20 | Yes | No |
| 7 | CONTACTED | CLOSED-LOST | Sequence exhausted | All touches + buffer | Yes | Yes (→ NURTURE) |
| 8 | CONTACTED | NURTURE | Partial engagement | Below ENGAGED threshold | Conditional | Yes |
| 9 | ENGAGED | NEGOTIATING | Buying signal / meeting | LLM classification + human | Conditional | No |
| 10 | ENGAGED | CONTACTED | Engagement decay (7+ days) | No events verified | Yes | Yes |
| 11 | NEGOTIATING | CLOSED-WON | Deal closed | Human confirmation | No | No |
| 12 | NEGOTIATING | CLOSED-LOST | Deal lost | Human confirmation | Conditional | Yes (→ NURTURE) |
| 13 | NEGOTIATING | NURTURE | Negotiation stalled (30+ days) | Stall criteria met | Conditional | Yes |
| 14 | CLOSED-LOST | NURTURE | Timing-related loss | Loss reason = timing/budget | Conditional | Yes |
| 15 | NURTURE | ENRICHED | Re-engagement signal | Engagement event verified | Yes | Yes |

### 5.2 Transition Processing Protocol

Every transition follows this exact 7-step protocol:

```
Step 1: VALIDATE — Check all exit criteria for source stage and entry criteria for target stage
Step 2: AUTHORIZE — Verify the transition is in the allowed transition graph
Step 3: PRE-COMMIT — Execute pre-transition hooks (calculations, side-effect preparation)
Step 4: COMMIT — Update lead.stage in database within a transaction
Step 5: POST-COMMIT — Execute post-transition hooks (create tasks, notifications, analytics)
Step 6: AUDIT — Write transition record to audit log
Step 7: VERIFY — Confirm all side effects completed; rollback if any failed
```

### 5.3 Transition Validation Detail

```typescript
interface TransitionValidation {
  sourceExitCriteria: {
    requiredFields: string[];
    minScores: Record<string, number>;
    timeConstraints: {
      minDwellTime?: number;    // Minimum time in current stage (ms)
      maxDwellTime?: number;    // Alert threshold if exceeded
    };
    pendingOperations: 'BLOCK' | 'WARN' | 'ALLOW';
  };
  
  targetEntryCriteria: {
    requiredFields: string[];
    autoTransition: boolean;
    requiresHumanApproval: boolean;
    cooldownPeriod?: number;
  };
  
  invariants: {
    noOrphanTasks: boolean;
    dataIntegrityCheck: boolean;
    duplicateCheck: boolean;
  };
}
```

### 5.4 Side Effects by Transition

| Transition | Database Updates | Tasks Created | Notifications |
|---|---|---|---|
| NEW → ENRICHED | `enrichedAt = now()` | Re-qualification task | Enrichment complete |
| ENRICHED → QUALIFIED | `qualifiedAt = now()`, `leadTier = tier` | First outreach task, schedule cadence | SDR assignment |
| QUALIFIED → CONTACTED | `contactedAt = now()` | Engagement monitoring task | Outreach dispatched |
| CONTACTED → ENGAGED | `engagedAt = now()` (implicit) | SDR response task | SDR escalation |
| ENGAGED → NEGOTIATING | `negotiationStartedAt = now()` (implicit) | Deal tracking task | Forecast update |
| NEGOTIATING → CLOSED-WON | `closedAt = now()`, record deal value | CS handoff task, post-close survey | Win notification |
| NEGOTIATING → CLOSED-LOST | `closedAt = now()`, record loss reason | Nurture evaluation task | Loss notification |
| Any → NURTURE | `nurtureEnteredAt = now()` (implicit) | Schedule first nurture touch | Priority lowered |
| NURTURE → ENRICHED | `reEngagedAt = now()` (implicit) | Re-qualification task | Re-engagement alert |

---

## 6. Follow-Up Scheduling Engine

### 6.1 Scheduling Architecture

```
┌─────────────────────────────────────────────────────────┐
│                FOLLOW-UP SCHEDULING ENGINE                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────┐     ┌──────────────────────────┐   │
│  │  Cadence        │     │  Timezone Resolver       │   │
│  │  Templates      │────►│  (IANA + business hours) │   │
│  └────────────────┘     └────────────┬─────────────┘   │
│                                       │                  │
│  ┌────────────────┐     ┌────────────▼─────────────┐   │
│  │  Tier-Based     │────►│  Schedule Generator      │   │
│  │  Rules          │     │  (creates ScheduleEntry) │   │
│  └────────────────┘     └────────────┬─────────────┘   │
│                                       │                  │
│  ┌────────────────┐     ┌────────────▼─────────────┐   │
│  │  Priority       │────►│  Queue Manager           │   │
│  │  Calculator     │     │  (execution ordering)    │   │
│  └────────────────┘     └────────────┬─────────────┘   │
│                                       │                  │
│                              ┌────────▼─────────┐       │
│                              │  Execution Engine │       │
│                              │  (dispatch tasks) │       │
│                              └──────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Tier-Based Cadence Definitions

#### Tier 1 (ICP Score ≥ 80) — High-Value Personalized Sequence

```
Touch #1: Day 0, 9:00 AM local  — Personalized email (SDR-crafted)
Touch #2: Day 1, 10:00 AM local — Follow-up call attempt
Touch #3: Day 2, 2:00 PM local  — Value-add email with case study
Touch #4: Day 4, 9:30 AM local  — LinkedIn connection request
Touch #5: Day 5, 11:00 AM local — Personalized video email
Touch #6: Day 7, 2:00 PM local  — Break-up email with meeting CTA
Touch #7: Day 10, 10:00 AM local — Final attempt: alternate channel

SLA: First touch within 4 hours of entering QUALIFIED
```

#### Tier 2 (ICP Score 60-79) — Semi-Personalized Sequence

```
Touch #1: Day 0, 9:00 AM local  — Template email with merge fields
Touch #2: Day 3, 10:00 AM local — Follow-up email with social proof
Touch #3: Day 7, 2:00 PM local  — Value-add content email
Touch #4: Day 10, 9:00 AM local — Different angle / pain point email
Touch #5: Day 14, 10:00 AM local — Break-up email

SLA: First touch within 8 hours of entering QUALIFIED
```

#### Tier 3 (ICP Score 40-59) — Automated Nurture Sequence

```
Touch #1: Day 0, 9:00 AM local  — Automated introduction email
Touch #2: Day 7, 10:00 AM local — Industry insights email
Touch #3: Day 21, 2:00 PM local — Re-engagement check

SLA: First touch within 24 hours of entering QUALIFIED
```

### 6.3 Timezone Resolution Strategy

```
Priority 1: Lead's explicit timezone field (if set)
Priority 2: Company HQ location → IANA timezone
Priority 3: Domain TLD heuristic (.de → Europe/Berlin, .jp → Asia/Tokyo)
Priority 4: Country field → IANA timezone (uses most common timezone for country)
Fallback:   America/New_York with "timezone_uncertain" flag
```

---

## 7. Engagement Detection System

### 7.1 Engagement Score Weights

| Event Type | Base Score | Boost Conditions | Decay Rate |
|---|---|---|---|
| Email Reply | +25 | +10 if contains buying signal | 5%/day after 72h |
| CTA Click | +15 | +5 if pricing/demo page | 5%/day after 72h |
| LinkedIn Connection | +15 | — | 3%/day after 72h |
| Form Submission | +20 | +10 if demo request | 5%/day after 72h |
| Multiple Opens (2+) | +5 each | — | 8%/day after 48h |
| Single Open | +2 | — | 10%/day after 24h |
| Page Visit (pricing) | +10 | — | 5%/day after 72h |
| Page Visit (general) | +3 | — | 8%/day after 48h |
| Inbound Call | +20 | +10 if > 2 min duration | 3%/day after 72h |

### 7.2 Score Decay Algorithm

```typescript
function applyScoreDecay(currentScore: number, lastEventAt: DateTime): number {
  const hoursSinceLastEvent = (Date.now() - lastEventAt.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastEvent < 72) return currentScore;  // No decay in first 72h
  
  const daysSinceLastEvent = hoursSinceLastEvent / 24;
  const decayFactor = Math.pow(0.95, daysSinceLastEvent - 3); // 5% daily decay after day 3
  
  return Math.max(0, Math.round(currentScore * decayFactor));
}
```

### 7.3 Auto-Transition Triggers

```
CONTACTED stage:
  IF engagement_score >= 25 AND engagement_event_count >= 1:
    → Auto-transition to ENGAGED

NURTURE stage:
  IF engagement_score >= 15 AND any CTA click:
    → Auto-transition to ENRICHED

ENGAGED stage:
  IF buying_signal_detected (LLM classified) AND engagement_score >= 50:
    → Recommend transition to NEGOTIATING (requires human confirmation)
```

---

## 8. Pipeline Analytics Engine

### 8.1 Conversion Rate Calculation

```sql
-- Stage-to-stage conversion rate (7-day window)
SELECT 
  from_stage,
  to_stage,
  COUNT(*) as transitions,
  LAG(COUNT(*)) OVER (PARTITION BY from_stage ORDER BY to_stage) as source_count
FROM stage_history
WHERE created_at >= datetime('now', '-7 days')
GROUP BY from_stage, to_stage;
```

### 8.2 Pipeline Velocity

```
Pipeline Velocity = (Qualified Leads × Win Rate × Average Deal Value) / Sales Cycle Length

Where:
  Qualified Leads = leads in QUALIFIED+ stages (past 30 days)
  Win Rate = CLOSED-WON / (CLOSED-WON + CLOSED-LOST) (past 90 days)
  Average Deal Value = avg deal value of CLOSED-WON (past 90 days)
  Sales Cycle Length = avg days from QUALIFIED to CLOSED-WON (past 90 days)
```

### 8.3 Stage Distribution Query

```sql
SELECT 
  stage, 
  COUNT(*) as count,
  AVG(CAST(JULIANDAY('now') - JULIANDAY(updated_at) AS FLOAT) * 24) as avg_age_hours
FROM leads
WHERE stage NOT IN ('closed_won', 'closed_lost')
GROUP BY stage
ORDER BY 
  CASE stage
    WHEN 'new' THEN 1
    WHEN 'enriched' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'contacted' THEN 4
    WHEN 'engaged' THEN 5
    WHEN 'negotiating' THEN 6
    WHEN 'nurture' THEN 7
  END;
```

### 8.4 Health Score Calculation

```
Pipeline Health Score = weighted average of:
  30% — Stage balance (healthy distribution across stages, no bottlenecks)
  25% — Velocity trend (improving or stable vs declining)
  20% — Follow-up adherence (percentage of follow-ups within SLA)
  15% — Data hygiene score (completeness and freshness of data)
  10% — Engagement rate (active engagement across pipeline)

Score: 0-100, with thresholds:
  ≥ 80: Healthy (green)
  60-79: Attention needed (yellow)
  40-59: At risk (orange)
  < 40: Critical (red)
```

---

## 9. Alert Management System

### 9.1 Alert Types and Thresholds

| Alert Type | Severity | Trigger | Escalation Path |
|---|---|---|---|
| `STALE_LEAD_NEW` | Warning | Lead in NEW > 24h | SDR → Manager (48h) |
| `STALE_LEAD_QUALIFIED` | Critical | Lead in QUALIFIED > 72h | SDR → Manager (96h) |
| `STALE_LEAD_CONTACTED` | Warning | Lead in CONTACTED > 14d | SDR → Manager (21d) |
| `ENGAGEMENT_DECAY` | Warning | ENGAGED lead no signal > 48h | SDR |
| `OVERDUE_FOLLOW_UP` | Critical | Follow-up task past due | SDR → Manager (2hr) |
| `PIPELINE_VELOCITY_DROP` | Warning | Velocity drops > 15% week-over-week | Manager |
| `DUPLICATE_DETECTED` | Info | Duplicate lead created | Auto-merge review |
| `BOUNCE_DETECTED` | Warning | Hard bounce on outreach email | SDR (switch channel) |
| `UNSUBSCRIBE` | Info | Prospect unsubscribed | SDR (respect and log) |
| `DATA_QUALITY_LOW` | Warning | Lead dataCompleteness < 20% | Enrichment queue |

### 9.2 Escalation Timing

```
Alert created → SDR notified immediately
If not resolved within tier-specific SLA:
  Tier 1 alerts: Escalate to manager after 2 hours
  Tier 2 alerts: Escalate to manager after 8 hours
  Tier 3 alerts: Escalate to manager after 24 hours
If not resolved within 48 hours of escalation:
  → Create CRITICAL system alert for pipeline owner
```

### 9.3 Alert Resolution

Every alert must be resolved with one of:
- **Action taken** — Follow-up sent, channel switched, stage transitioned
- **Dismissed with reason** — SDR provides reason for dismissal (e.g., "on PTO", "wrong contact")
- **Escalated** — Forwarded to manager with context

Alerts are never silently dismissed — every resolution is logged.

---

## 10. Data Hygiene Framework

### 10.1 Deduplication Strategy

```
Phase 1 — Exact Match (confidence ≥ 0.95):
  - Exact email match
  - Exact LinkedIn URL match
  - Exact company domain + name match
  → Auto-merge (keep richer record)

Phase 2 — Fuzzy Match (confidence 0.75 - 0.94):
  - Normalized company name (strip Inc, LLC, Ltd, GmbH)
  - Levenshtein distance on email prefix
  - Partial LinkedIn URL match
  → Flag for human review

Phase 3 — Suspicious (confidence 0.50 - 0.74):
  - Same company, different contact
  - Similar name, different company
  → Log, no action (different leads)
```

### 10.2 Stale Data Detection

```sql
-- Find leads with stale data (not updated in 30+ days, not in terminal stage)
SELECT id, company_name, stage, updated_at
FROM leads
WHERE stage NOT IN ('closed_won', 'closed_lost')
  AND JULIANDAY('now') - JULIANDAY(updated_at) > 30
ORDER BY updated_at ASC;
```

### 10.3 Missing Field Identification

For each stage, Flow identifies critical missing fields:

| Stage | Required Fields | Alert if Missing |
|---|---|---|
| NEW | `companyName` | Immediately (Prisma constraint) |
| ENRICHED | `industry`, `generalEmail` | After 24h in stage |
| QUALIFIED | `leadTier`, `leadScore` | After 12h in stage |
| CONTACTED | `contactedAt`, outreach record | After 4h in stage |
| ENGAGED | engagement event log | After 24h in stage |
| NEGOTIATING | estimated deal value | After 48h in stage |

---

## 11. Decision Framework

### 11.1 When to Advance a Lead

```
ADVANCE when ALL of:
  ✓ All exit criteria for current stage are met
  ✓ All entry criteria for target stage are met
  ✓ Transition is in the allowed transition graph
  ✓ No blocking operations are pending
  ✓ No concurrent transition in progress
  ✓ The transition reason can be clearly articulated
```

### 11.2 When to Stall a Lead

```
STALL (do not advance) when ANY of:
  ✗ Exit criteria not fully met (e.g., engagement score below threshold)
  ✗ Required data is missing (e.g., no verified email)
  ✗ Pending operations that might affect the decision (e.g., enrichment in progress)
  ✗ Recent transition (within cooldown period)
  → Create task to address the blocking condition
  → Schedule re-evaluation after the blocking condition is expected to resolve
```

### 11.3 When to Regress a Lead

```
REGRESS when ANY of:
  ✗ Engagement has decayed beyond recovery threshold (7+ days in ENGAGED)
  ✗ Negotiation has stalled beyond maximum dwell time (30+ days)
  ✗ ICP score has dropped below threshold after re-evaluation
  ✗ Prospect explicitly requested to be contacted later (timing objection)
  → ALWAYS document the regression reason
  → ALWAYS create a re-engagement schedule
  → ALWAYS notify the assigned SDR
```

### 11.4 When to Archive a Lead

```
ARCHIVE when ALL of:
  ✓ Lead has been in NURTURE for 365+ days with zero engagement
  ✓ Lead is in CLOSED-LOST with loss reason = "No Need" or "Bad Fit" or "Disqualified"
  ✓ No active follow-up tasks or schedules for the lead
  → Mark as archived (do NOT delete)
  → Remove from active pipeline metrics
  → Retain in database for historical analysis
```

---

## 12. Error Recovery

### 12.1 Transition Failure Recovery

| Failure Type | Detection | Recovery |
|---|---|---|
| Validation failure | Exit/entry criteria check | Return error with specific failures; create tasks for missing criteria |
| Graph violation | Transition graph lookup | Return INVALID_TRANSITION error; suggest valid path |
| Database transaction failure | Prisma error | Retry 3x with exponential backoff; then create CRITICAL alert |
| Concurrent modification | Optimistic concurrency check | Return CONCURRENT_MODIFICATION error; suggest retry |
| Post-commit hook failure | Side-effect verification | Log failure; create SUPPORT alert; transition stands |
| Lock acquisition timeout | Distributed lock | Force-release after 30s; retry once; then alert |

### 12.2 Data Inconsistency Recovery

```
Inconsistency Detection (runs every 6 hours):
  1. Leads with stage = 'qualified' but leadScore = 0
     → Re-trigger qualification
  2. Leads with stage = 'contacted' but no contactedAt timestamp
     → Set contactedAt from stage history
  3. Leads with active follow-up tasks but lead has been Closed-Lost
     → Cancel orphan tasks
  4. Leads with duplicate email/LinkedIn in same campaign
     → Flag for merge review
  5. Leads with stage progression that violates the transition graph
     → Create CRITICAL alert for manual investigation

Recovery Priority:
  P0: Data integrity violations (orphan references, missing required fields)
  P1: Stage inconsistencies (wrong stage for data state)
  P2: Metric miscalculations (stale counters, incorrect scores)
  P3: Cosmetic issues (missing timestamps, incomplete audit trails)
```

### 12.3 Stuck Lead Recovery

```
A lead is "stuck" if it has exceeded max dwell time for its stage:

NEW stuck > 24h:
  → Alert SDR; re-queue enrichment
  
ENRICHED stuck > 48h:
  → Alert SDR; check if qualification data is available
  
QUALIFIED stuck > 72h:
  → CRITICAL alert; SDR has missed first-contact SLA
  
CONTACTED stuck > 14d:
  → Evaluate: transition to CLOSED-LOST or NURTURE
  
ENGAGED stuck > 14d:
  → Evaluate: regression to CONTACTED or escalation
  
NEGOTIATING stuck > 30d:
  → Evaluate: regression to NURTURE or force SDR decision
```

---

## 13. Constraints & Guardrails

### 13.1 Hard Constraints

| Constraint | Rule | Rationale |
|---|---|---|
| Stage sequence | Must follow transition graph (no skipping) | Pipeline integrity |
| Audit trail | Every transition must have a reason | Compliance and debugging |
| Data retention | Never delete leads — archive only | Data integrity |
| Timezone enforcement | Outreach only within business hours | Deliverability and compliance |
| Concurrency | One transition per lead at a time | Data consistency |
| Score cap | Engagement score max = 100 | Prevent score inflation |

### 13.2 Rate Limits

| Operation | Rate Limit | Backoff |
|---|---|---|
| Lead creation | 100/minute | 1s between batches |
| Stage transitions | 50/minute per lead | Exponential (1s, 3s, 9s) |
| Alert generation | 200/hour | Queue overflow after limit |
| Analytics calculation | 1 refresh per 5 minutes | Cached results between refreshes |
| Duplicate checks | 1000/minute | 100ms between checks |

### 13.3 Scope Boundaries

- **Flow never accesses Agent-Reach channels directly** — All enrichment, discovery, and outreach is delegated
- **Flow never composes outreach content** — That is the Outreach Composer's responsibility
- **Flow never modifies lead data beyond stage/score fields** — Other agents update their own fields
- **Flow never bypasses the Prisma ORM** — All database operations go through the ORM layer

---

## 14. Performance Metrics

### 14.1 Key Performance Indicators

| KPI | Target | Measurement |
|---|---|---|
| Pipeline velocity | Within 10% of target | Weekly trend analysis |
| Follow-up adherence | ≥ 95% | On-time follow-ups / total follow-ups |
| Stage transition accuracy | 100% | Transitions following graph rules |
| Data hygiene score | ≥ 90% | Completeness + freshness + dedup |
| First-contact SLA | < 4h (Tier 1), < 8h (Tier 2) | Time from QUALIFIED to CONTACTED |
| Alert response time | < 2h (Critical), < 8h (Warning) | Time from alert to resolution |
| Conversion rate accuracy | ±5% of actual | Forecast vs. actual win rate |

### 14.2 Operational Metrics

| Metric | Target | Alert Threshold |
|---|---|---|
| Transition latency | < 500ms (p95) | > 2s |
| Lead creation latency | < 200ms (p95) | > 1s |
| Duplicate check latency | < 100ms (p95) | > 500ms |
| Analytics refresh | < 30s (full pipeline) | > 2 min |
| Alert detection delay | < 5 min after condition | > 15 min |
| Concurrent transitions | 50/sec without contention | Lock wait > 1s |

---

## 15. Workflow Examples

### 15.1 Complete Happy Path — From Discovery to Closed-Won

```
T+0:00    Scout discovers "NovaTech" — Lead L-2847 created (stage: NEW)
T+0:00    Flow: duplicate check ✓, enrichment queue insertion, staleness timer set
T+0:05    Forge enriches NovaTech: email verified, ICP score calculated = 87
T+0:05    Flow: auto-transition NEW → ENRICHED, set enrichedAt
T+0:06    Judge qualifies NovaTech: ICP 87 ≥ 80 → Tier 1 (hot)
T+0:06    Flow: auto-transition ENRICHED → QUALIFIED, assign tier="hot"
T+0:06    Flow: schedule first outreach within 4h SLA
T+0:30    Composer crafts personalized email, dispatches
T+0:30    Flow: auto-transition QUALIFIED → CONTACTED, set contactedAt
T+0:30    Flow: start engagement monitoring, schedule follow-up cadence
T+1:00    Lead opens email (score +2 → engagement_score = 2)
T+2:00    Lead clicks pricing CTA (score +15+5 = 22 → engagement_score = 22)
T+2:30    Lead replies "Can we schedule a demo?" (score +25+10 = 57 → engagement_score = 57)
T+2:30    Flow: LLM classifies reply → BUYING_SIGNAL (confidence 0.92)
T+2:30    Flow: auto-transition CONTACTED → ENGAGED
T+2:31    Flow: alert SDR for immediate response; schedule engagement decay check
T+3:00    SDR responds, schedules demo
T+24:00   Demo completed, prospect requests proposal
T+24:00   Flow: transition ENGAGED → NEGOTIATING (SDR confirms buying signal)
T+24:00   Flow: create deal record, begin stall monitoring, update forecast
T+72:00   Deal closed — $45K annual contract
T+72:00   Flow: transition NEGOTIATING → CLOSED-WON (human confirms)
T+72:00   Flow: record deal value, trigger win attribution, notify CS, update forecast
```

### 15.2 Nurture Recovery Path — Lead Returns from the Dead

```
T+0:00    Scout discovers "Meridian Corp" — Lead L-3291 created (stage: NEW)
T+0:10    Forge enriches: ICP score = 45 → Tier 3 (cold)
T+0:10    Flow: auto-transition ENRICHED → NURTURE (ICP < 60)
T+0:10    Flow: assign Cool Nurture cadence (every 30 days)
T+30d     Nurture Touch #1: industry insights email (no engagement)
T+60d     Nurture Touch #2: case study email (1 open, score +2)
T+90d     Nurture Touch #3: product update email (2 opens, score +4)
T+92d     Nurture Touch #3b: lead clicks CTA → "See pricing" (score +15+5 = 21)
T+92d     Flow: nurture CTA click detected, engagement_score = 21 ≥ 15
T+92d     Flow: auto-transition NURTURE → ENRICHED for re-qualification
T+92d     Judge re-qualifies with fresh data: ICP score = 68 → Tier 2 (warm)
T+92d     Flow: auto-transition ENRICHED → QUALIFIED
T+92d     Composer sends semi-personalized outreach
T+92d     Flow: auto-transition QUALIFIED → CONTACTED
...continues through normal pipeline flow
```

### 15.3 Lost Deal That Should Be Nurture — Not All Closed-Lost Is Final

```
T+0:00    Lead L-5578 in NEGOTIATING stage — $120K deal
T+0:00    Prospect: "We love the product, but budget isn't approved until Q3"
T+0:00    SDR records loss reason: TM-004 (Timing)
T+0:00    Flow: transition NEGOTIATING → CLOSED-LOST
T+0:00    Flow: loss reason is timing-related → auto-suggest NURTURE
T+0:00    Flow: auto-transition CLOSED-LOST → NURTURE (3-month cadence)
T+90d     Nurture: "Q3 budget planning" email (prospect opens 3 times)
T+90d     Flow: "warming" flag — upgrade priority
T+92d     Prospect replies: "Budget approved, can we resume?"
T+92d     Flow: immediate transition NURTURE → ENRICHED ("hot nurture reply")
T+92d     Judge re-qualifies: ICP = 82 → Tier 1 (hot)
T+92d     Flow: fast-track to QUALIFIED → CONTACTED → ENGAGED → NEGOTIATING
```

### 15.4 Stuck Lead Recovery — When Things Go Wrong

```
T+0:00    Lead L-7712 in QUALIFIED stage (Tier 1, ICP = 88)
T+24h     Flow: staleness alert — still in QUALIFIED, no outreach sent
T+24h     SDR notified but on PTO — no action
T+48h     Flow: second staleness alert — approaching 72h SLA
T+48h     SDR still on PTO
T+72h     Flow: CRITICAL alert — first-contact SLA violated
T+72h     Flow: escalate to manager
T+72h     Manager assigns to backup SDR
T+73h     Backup SDR sends outreach
T+73h     Flow: transition QUALIFIED → CONTACTED
T+73h     Flow: resolve all staleness alerts with reason "SDR PTO, reassigned"
```

---

*Flow — The Pipeline Manager. Every lead tracked. Every follow-up timed. Every transition validated.*
