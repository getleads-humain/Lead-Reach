# Pipeline Manager Skills — "Flow"

> **Classification:** Core Agent Skills | **Agent:** Flow (Pipeline Manager)  
> **Version:** 3.0 | **Status:** Production | **Skill Count:** 10  
> **Runtime Handler:** `executePipelineManager()` in `src/lib/agent-executor.ts`

---

## Table of Contents

1. [Lead Status Management](#1-lead-status-management)
2. [Stage Transition Processing](#2-stage-transition-processing)
3. [Follow-Up Scheduling](#3-follow-up-scheduling)
4. [Engagement Signal Detection](#4-engagement-signal-detection)
5. [Pipeline Analytics Calculation](#5-pipeline-analytics-calculation)
6. [Alert & Escalation Management](#6-alert--escalation-management)
7. [Data Hygiene & Deduplication](#7-data-hygiene--deduplication)
8. [Pipeline Forecasting](#8-pipeline-forecasting)
9. [Automated Nurture Sequences](#9-automated-nurture-sequences)
10. [Execution Engine Integration](#10-execution-engine-integration)

---

## Skill Specification Format

Each skill is documented with the following structure:

| Section | Description |
|---|---|
| **Trigger** | What events or conditions activate this skill |
| **Input Schema** | TypeScript interface defining all input parameters |
| **Output Schema** | TypeScript interface defining all output fields |
| **Method** | Step-by-step algorithmic description of execution |
| **Database Queries** | Prisma queries used (with SQL equivalents where relevant) |
| **Fallback Strategies** | What happens when the primary path fails |
| **Error Handling** | Specific error types and recovery procedures |
| **Example Scenarios** | Realistic worked examples with data |
| **Performance Targets** | Quantified SLAs and benchmarks |

---

## 1. Lead Status Management

### Overview

The Lead Status Management skill is Flow's foundational capability — it governs the complete lifecycle of every lead record in the pipeline, from creation through terminal state. This skill is the gatekeeper for all state mutations and ensures that every lead has a well-defined, valid status at all times.

### Trigger

| Trigger Type | Condition | Priority |
|---|---|---|
| **Lead Creation** | New lead enters the system (API, CSV, form, discovery) | P1 |
| **Manual Status Change** | SDR or manager requests a stage change | P1 |
| **Auto-Transition Signal** | Criteria met for automatic stage advancement | P2 |
| **Scheduled Evaluation** | Periodic scan for leads meeting transition criteria | P3 |
| **Regression Trigger** | Staleness, disengagement, or data invalidation | P2 |

### Input Schema

```typescript
interface LeadStatusInput {
  // For lead creation
  create?: {
    source: 'API' | 'CSV_IMPORT' | 'FORM_SUBMISSION' | 'AGENT_DISCOVERY' | 'MANUAL';
    sourceId?: string;           // Campaign ID, form ID, etc.
    data: {
      companyName: string;       // Required by Prisma schema
      website?: string;
      industry?: string;
      city?: string;
      country?: string;
      generalEmail?: string;
      phoneMain?: string;
      linkedinUrl?: string;
      notes?: string;
      tags?: string[];
    };
    skipDuplicateCheck?: boolean; // Only for system-level imports
    forceStage?: PipelineStage;   // Override default NEW stage (admin only)
  };

  // For status change
  transition?: {
    leadId: string;
    targetStage: PipelineStage;
    reason: string;
    triggeredBy: 'AUTO' | 'MANUAL' | 'SDR' | 'SYSTEM';
    triggeredById?: string;       // User ID if manual
    metadata?: Record<string, unknown>;
    skipValidation?: boolean;     // Admin override — DANGEROUS
  };

  // For bulk operations
  bulk?: {
    leadIds: string[];
    operation: 'TRANSITION' | 'ARCHIVE' | 'REASSIGN';
    targetStage?: PipelineStage;
    reason: string;
    triggeredBy: 'MANUAL' | 'SYSTEM';
  };
}

type PipelineStage = 'new' | 'enriched' | 'qualified' | 'contacted' | 'engaged' | 'negotiating' | 'closed_won' | 'closed_lost' | 'nurture';
```

### Output Schema

```typescript
interface LeadStatusOutput {
  success: boolean;
  leadId: string;
  previousStage: PipelineStage | null;  // null for new leads
  currentStage: PipelineStage;
  transitionId?: string;                // StageHistory record ID
  sideEffects: {
    tasksCreated: number;
    alertsCreated: number;
    schedulesCreated: number;
    notificationsSent: number;
    analyticsUpdated: boolean;
  };
  warnings: Array<{
    code: string;
    message: string;
  }>;
  errors: Array<{
    code: string;
    message: string;
    field?: string;
  }>;
  timestamp: DateTime;
}
```

### Method

**For Lead Creation:**

```
Step 1: VALIDATE INPUT
  ├── Verify companyName is provided (Prisma required field)
  ├── Sanitize all string inputs (trim, normalize unicode, strip HTML)
  ├── Validate email format if provided (RFC 5322 compliant regex)
  ├── Validate LinkedIn URL format if provided
  └── Reject if no valid companyName → return error

Step 2: DUPLICATE CHECK
  ├── Execute fuzzy duplicate detection (see Skill 7)
  ├── If exact duplicate found (confidence ≥ 0.95):
  │   ├── Log duplicate creation attempt
  │   ├── Return existing lead ID with DUPLICATE_FOUND warning
  │   └── Do NOT create new record
  ├── If potential duplicate found (0.75 ≤ confidence < 0.95):
  │   ├── Create lead record with DUPLICATE_FLAG in notes
  │   ├── Generate MERGE_RECOMMENDED alert
  │   └── Continue with creation (human review pending)
  └── If no duplicate found (confidence < 0.75):
      └── Continue with creation

Step 3: CREATE LEAD RECORD (Prisma)
  ├── Generate unique ID (cuid via Prisma default)
  ├── Set initial stage to 'new' (or forceStage if admin override)
  ├── Set timestamps: createdAt, updatedAt, discoveredAt (Prisma defaults)
  ├── Initialize scores to 0 (Prisma defaults)
  ├── Set leadTier to 'unqualified' (Prisma default)
  ├── Resolve timezone from location data (if available)
  └── Insert into database via prisma.lead.create()

Step 4: POST-CREATION HOOKS
  ├── Queue enrichment job (signal to Data Enrichment agent)
  ├── Create initial follow-up task (enrichment urgency, T+24h)
  ├── Update real-time pipeline counters
  └── Emit LEAD_CREATED event

Step 5: RETURN RESULT
  └── Return LeadStatusOutput with leadId, stage='new', side effects summary
```

**For Status Transition:**

```
Step 1: VALIDATE TRANSITION REQUEST
  ├── Verify lead exists in database (prisma.lead.findUnique)
  ├── Verify current stage matches expected (optimistic concurrency)
  ├── Check transition is in ALLOWED_TRANSITIONS graph
  ├── If skipValidation is false (default):
  │   ├── Validate all exit criteria for current stage (see agent.md §4)
  │   ├── Validate all entry criteria for target stage
  │   └── Check for blocking conditions (pending operations, data quality)
  └── If any validation fails → return error with specific failure reasons

Step 2: PRE-COMMIT PROCESSING
  ├── Calculate any score updates needed before transition
  ├── Prepare side-effect data (tasks, schedules, notifications)
  └── Acquire distributed lock on lead record (prevent concurrent transitions)

Step 3: EXECUTE TRANSITION (within Prisma $transaction)
  ├── Update lead.stage to targetStage
  ├── Update relevant timestamp field (enrichedAt, qualifiedAt, contactedAt)
  ├── Update leadTier if applicable
  └── ALL within a single $transaction call

Step 4: POST-COMMIT HOOKS (outside transaction, idempotent)
  ├── Create follow-up task for new stage (see Skill 3)
  ├── Create schedule entries for new stage cadence
  ├── Send notifications based on transition type
  ├── Update analytics counters
  ├── Evaluate and create alerts if thresholds triggered
  └── Release distributed lock on lead record

Step 5: VERIFY SIDE EFFECTS
  ├── Confirm all tasks were created
  ├── Confirm all schedule entries exist
  ├── If any side effect failed → log error, create SUPPORT alert
  └── Do NOT roll back the transition (it's committed)

Step 6: RETURN RESULT
  └── Return LeadStatusOutput with full side-effect accounting
```

### Database Queries

```typescript
// Lead Creation
const lead = await prisma.lead.create({
  data: {
    campaignId: input.create.sourceId || (await getDefaultCampaignId()),
    companyName: input.create.data.companyName,
    website: input.create.data.website || null,
    industry: input.create.data.industry || null,
    city: input.create.data.city || null,
    country: input.create.data.country || null,
    generalEmail: input.create.data.generalEmail || null,
    phoneMain: input.create.data.phoneMain || null,
    linkedinUrl: input.create.data.linkedinUrl || null,
    notes: input.create.data.notes || null,
    sources: JSON.stringify([input.create.source]),
    stage: input.create.forceStage || 'new',
  },
});

// Stage Transition (within transaction)
const result = await prisma.$transaction(async (tx) => {
  const current = await tx.lead.findUnique({ where: { id: leadId } });
  if (current.stage !== expectedCurrentStage) {
    throw new ConcurrencyError('Lead stage changed during transition');
  }
  
  const updated = await tx.lead.update({
    where: { id: leadId },
    data: {
      stage: targetStage,
      updatedAt: new Date(),
      ...stageTimestampField(targetStage),
    },
  });
  
  return { updated };
});

// SQL equivalent of stage distribution query
// SELECT stage, COUNT(*) as count,
//        AVG(CAST(JULIANDAY('now') - JULIANDAY(updated_at) AS FLOAT) * 24) as avg_age_hours
// FROM leads
// WHERE stage NOT IN ('closed_won', 'closed_lost')
// GROUP BY stage
// ORDER BY stage;
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Database unavailable | Queue transition in local buffer; retry every 30s for 5 min; then create CRITICAL alert |
| Duplicate check timeout | Proceed with creation but flag for post-hoc duplicate review |
| Distributed lock acquisition failure | Retry with exponential backoff (1s, 3s, 9s); after 3 failures, create alert |
| Post-commit hook failure | Log failed hooks; create SUPPORT alert; transition still stands |
| Validation timeout | Use cached validation results if < 5 min old; otherwise fail and alert |

### Error Handling

```typescript
enum LeadStatusError {
  LEAD_NOT_FOUND = 'LEAD_NOT_FOUND',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  EXIT_CRITERIA_NOT_MET = 'EXIT_CRITERIA_NOT_MET',
  ENTRY_CRITERIA_NOT_MET = 'ENTRY_CRITERIA_NOT_MET',
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  DUPLICATE_DETECTED = 'DUPLICATE_DETECTED',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DATABASE_ERROR = 'DATABASE_ERROR',
  VALIDATION_TIMEOUT = 'VALIDATION_TIMEOUT',
  BLOCKING_OPERATION_PENDING = 'BLOCKING_OPERATION_PENDING',
}
```

### Example Scenarios

**Scenario 1: New lead from campaign discovery**

```json
// Input
{
  "create": {
    "source": "AGENT_DISCOVERY",
    "sourceId": "camp-2025-q1-saas",
    "data": {
      "companyName": "NovaTech",
      "website": "https://novatech.io",
      "industry": "SaaS",
      "generalEmail": "info@novatech.io",
      "city": "San Francisco",
      "country": "USA"
    }
  }
}

// Output
{
  "success": true,
  "leadId": "clx8k2m3g0001qu0a1b2c3d4",
  "previousStage": null,
  "currentStage": "new",
  "sideEffects": {
    "tasksCreated": 1,
    "alertsCreated": 0,
    "schedulesCreated": 1,
    "notificationsSent": 0,
    "analyticsUpdated": true
  },
  "warnings": [],
  "errors": [],
  "timestamp": "2025-03-04T10:15:00Z"
}
```

**Scenario 2: Invalid transition attempt (skipping stages)**

```json
// Input
{
  "transition": {
    "leadId": "clx8k2m3g0001qu0a1b2c3d4",
    "targetStage": "negotiating",
    "reason": "SDR wants to fast-track",
    "triggeredBy": "MANUAL"
  }
}
// Current stage: new

// Output
{
  "success": false,
  "leadId": "clx8k2m3g0001qu0a1b2c3d4",
  "previousStage": "new",
  "currentStage": "new",
  "errors": [{
    "code": "INVALID_TRANSITION",
    "message": "Transition new→negotiating is not in the allowed transition graph. Valid targets from new: [enriched]"
  }],
  "sideEffects": { "tasksCreated": 0, "alertsCreated": 1, "schedulesCreated": 0, "notificationsSent": 1, "analyticsUpdated": false },
  "warnings": [],
  "timestamp": "2025-03-04T10:20:00Z"
}
```

### Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| Lead creation latency | < 200ms (p95) | End-to-end including duplicate check |
| Transition latency | < 500ms (p95) | Including validation + commit + hooks |
| Duplicate check latency | < 100ms (p95) | Fuzzy match against 10K leads |
| Throughput | 100 leads/sec creation | Batch ingestion scenario |
| Concurrent transitions | 50/sec | Without lock contention |

---

## 2. Stage Transition Processing

### Overview

Stage Transition Processing is the validation-and-execution engine that ensures every pipeline movement is legal, justified, and fully audited. It is the rigor layer that prevents pipeline corruption.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Explicit transition request** | From Lead Status Management skill (Skill 1) |
| **Auto-transition evaluation** | From scheduled or event-driven evaluations |
| **Bulk transition** | Admin-initiated batch stage changes |

### Input Schema

```typescript
interface StageTransitionInput {
  leadId: string;
  fromStage: PipelineStage;        // Expected current stage (optimistic concurrency)
  toStage: PipelineStage;
  reason: string;                  // MANDATORY — every transition must have a reason
  triggeredBy: 'AUTO' | 'MANUAL' | 'SDR' | 'SYSTEM';
  triggeredById?: string;
  metadata?: {
    icpScore?: number;
    engagementScore?: number;
    eventId?: string;
    sequenceId?: string;
    touchIndex?: number;
    [key: string]: unknown;
  };
  skipValidation?: boolean;         // Admin override
  idempotencyKey?: string;          // Prevents duplicate processing
}
```

### Output Schema

```typescript
interface StageTransitionOutput {
  success: boolean;
  transitionId: string;
  leadId: string;
  fromStage: PipelineStage;
  toStage: PipelineStage;
  validatedAt: DateTime;
  committedAt: DateTime;
  sideEffects: {
    tasksCreated: TaskSummary[];
    schedulesCreated: ScheduleSummary[];
    alertsCreated: AlertSummary[];
    notificationsSent: string[];
    countersUpdated: string[];
  };
  auditRecord: {
    id: string;
    reason: string;
    triggeredBy: string;
    triggeredById?: string;
    metadata: Record<string, unknown>;
  };
  validationDetails: {
    exitCriteriaChecked: string[];
    exitCriteriaPassed: string[];
    exitCriteriaFailed: string[];
    entryCriteriaChecked: string[];
    entryCriteriaPassed: string[];
    entryCriteriaFailed: string[];
    invariantsChecked: string[];
    invariantsPassed: string[];
    invariantsFailed: string[];
  };
}
```

### Method

```
Step 1: IDEMPOTENCY CHECK
  ├── If idempotencyKey provided:
  │   ├── Check cache for existing result with this key
  │   ├── If found → return cached result (no re-processing)
  │   └── If not found → continue and store result on completion
  └── If no key → continue (non-idempotent request)

Step 2: GRAPH VALIDATION
  ├── Look up ALLOWED_TRANSITIONS[fromStage]
  ├── If toStage NOT in the allowed list → REJECT
  ├── Log rejected transition attempt in audit trail
  └── Return INVALID_TRANSITION error with valid targets

Step 3: EXIT CRITERIA VALIDATION
  ├── Load stage definition for fromStage
  ├── For each exit criterion:
  │   ├── Evaluate the criterion against current lead data
  │   ├── Record PASS/FAIL with evidence
  │   └── If FAIL and not skipValidation → REJECT with details
  └── Compile validation report

Step 4: ENTRY CRITERIA VALIDATION
  ├── Load stage definition for toStage
  ├── For each entry criterion:
  │   ├── Evaluate the criterion against current lead data
  │   ├── Record PASS/FAIL with evidence
  │   └── If FAIL and not skipValidation → REJECT with details
  └── Compile validation report

Step 5: INVARIANT CHECKS
  ├── No orphan tasks for this lead
  ├── No active duplicate flag
  ├── Data integrity: required foreign keys exist
  ├── No concurrent transition in progress (lock check)
  └── If any invariant fails → REJECT with specific invariant

Step 6: PRE-TRANSITION HOOKS
  ├── Execute registered pre-hooks for this transition type
  ├── Pre-hooks can: enrich data, modify metadata, ABORT, add side effects
  └── If any pre-hook aborts → REJECT with hook's reason

Step 7: COMMIT TRANSITION (Prisma $transaction)
  ├── BEGIN TRANSACTION
  ├── UPDATE lead SET stage = toStage, timestamps...
  ├── COMMIT
  └── If transaction fails → ROLLBACK, create CRITICAL alert

Step 8: POST-TRANSITION HOOKS (async, non-blocking, idempotent)
  ├── Create follow-up task for new stage (Skill 3)
  ├── Create schedule entries for new stage cadence
  ├── Send transition notification to assigned SDR
  ├── Update real-time pipeline counters
  ├── Evaluate alert conditions (Skill 6)
  ├── Update analytics (Skill 5)
  └── All hooks are idempotent — safe to retry

Step 9: SIDE-EFFECT VERIFICATION
  ├── Confirm all tasks were created in DB
  ├── Confirm all schedule entries exist
  ├── For any failure → create SUPPORT alert with details
  └── The transition itself is NOT rolled back

Step 10: STORE IDEMPOTENCY RESULT
  └── If idempotencyKey was provided, store result (TTL: 24h)

Step 11: RETURN RESULT
  └── Return StageTransitionOutput with full validation and side-effect details
```

### Database Queries

```typescript
// Transition within transaction
const transitionResult = await prisma.$transaction(async (tx) => {
  // Optimistic concurrency check
  const current = await tx.lead.findUnique({ where: { id: input.leadId } });
  if (current.stage !== input.fromStage) {
    throw new ConcurrencyError('Stage mismatch');
  }
  
  const updated = await tx.lead.update({
    where: { id: input.leadId },
    data: {
      stage: input.toStage,
      updatedAt: new Date(),
      ...getTimestampUpdate(input.toStage),
      ...getScoreUpdate(input.toStage, input.metadata),
    },
  });
  
  return { updated };
}, {
  maxWait: 5000,
  timeout: 10000,
});
```

### Fallback Strategies

| Failure Point | Fallback |
|---|---|
| Graph validation fails | No fallback — hard constraint. Return error. |
| Exit criteria not met | Create tasks for missing criteria; suggest retry timeline |
| Entry criteria not met | Suggest data enrichment or alternative stage path |
| Database transaction fails | Retry 3x with exponential backoff; then alert |
| Post-commit hook fails | Transition stands; create SUPPORT alert for failed hook |
| Distributed lock timeout | If lock held > 30s, force-release and retry once |

### Error Handling

```typescript
enum TransitionErrorCode {
  GRAPH_VIOLATION = 'GRAPH_VIOLATION',
  EXIT_CRITERIA_FAILED = 'EXIT_CRITERIA_FAILED',
  ENTRY_CRITERIA_FAILED = 'ENTRY_CRITERIA_FAILED',
  INVARIANT_VIOLATION = 'INVARIANT_VIOLATION',
  PRE_HOOK_ABORT = 'PRE_HOOK_ABORT',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  DATABASE_FAILURE = 'DATABASE_FAILURE',
  LOCK_TIMEOUT = 'LOCK_TIMEOUT',
}
```

### Example Scenarios

**Scenario: Valid CONTACTED → ENGAGED transition**

```json
{
  "leadId": "clx8k2m3g0001",
  "fromStage": "contacted",
  "toStage": "engaged",
  "reason": "Lead replied to Touch #3 with questions about pricing",
  "triggeredBy": "AUTO",
  "metadata": {
    "engagementScore": 40,
    "eventId": "evt-reply-7890",
    "touchIndex": 3
  }
}

// Validation Details
{
  "exitCriteriaPassed": ["engagement_signal_detected", "engagement_score_above_threshold"],
  "exitCriteriaFailed": [],
  "entryCriteriaPassed": ["engagement_event_exists", "engagement_score_gte_20"],
  "entryCriteriaFailed": []
}

// Side Effects
{
  "tasksCreated": [{"type": "SDR_RESPONSE", "priority": "HIGH"}],
  "schedulesCreated": [{"type": "ENGAGEMENT_DECAY_CHECK", "scheduledAt": "2025-03-11T14:47:00Z"}],
  "notificationsSent": ["sdr-42@company.com"]
}
```

### Performance Targets

| Metric | Target |
|---|---|
| Validation latency | < 50ms (p95) |
| Full transition (including hooks) | < 500ms (p95) |
| Transaction timeout | 10s max |
| Lock acquisition | < 1s (p99) |
| Audit record creation | < 20ms |

---

## 3. Follow-Up Scheduling

### Overview

The Follow-Up Scheduling skill manages all time-dependent outreach activities, ensuring every lead receives timely, appropriate follow-ups based on their stage, tier, and engagement history. This is Flow's operational heartbeat.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Stage transition** | New stage requires follow-up cadence |
| **Sequence progression** | Next touch in cadence is due |
| **Engagement event** | Reply or click triggers immediate follow-up |
| **Overdue detection** | Scheduled follow-up not executed within SLA |
| **SDR request** | Manual follow-up scheduling |

### Input Schema

```typescript
interface FollowUpInput {
  leadId: string;
  type: 'CADENCE_TOUCH' | 'MANUAL_FOLLOW_UP' | 'RE_ENGAGEMENT' | 'NURTURE_TOUCH' | 'STALE_CHECK';
  cadence?: {
    tier: 1 | 2 | 3;
    touchIndex: number;
    totalTouches: number;
    channel: 'EMAIL' | 'LINKEDIN' | 'PHONE' | 'MULTI_CHANNEL';
  };
  manual?: {
    requestedBy: string;
    description: string;
    dueBy: DateTime;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  };
  scheduling?: {
    respectBusinessHours: boolean;     // Default: true
    timezone?: string;                 // Override lead's timezone
    preferredWindow?: { start: Time; end: Time };
    avoidHolidays: boolean;            // Default: true
    jitterMinutes?: number;            // Random delay to appear natural (0-120)
  };
}
```

### Output Schema

```typescript
interface FollowUpOutput {
  scheduleEntryId: string;
  leadId: string;
  type: string;
  scheduledAt: DateTime;               // UTC
  localScheduledAt: DateTime;          // Prospect's local time
  timezone: string;
  withinBusinessHours: boolean;
  priority: number;
  task?: {
    id: string;
    type: string;
    assignee: string;
    description: string;
  };
  cadence?: {
    tier: number;
    touchIndex: number;
    remainingTouches: number;
    nextTouchDate: DateTime | null;
  };
  warnings: string[];
}
```

### Method

```
Step 1: RESOLVE SCHEDULING PARAMETERS
  ├── Load lead's timezone (from company HQ, domain TLD, or default)
  ├── Resolve business hours for prospect's timezone (9 AM – 6 PM default)
  ├── Load tier-based cadence template
  ├── Calculate touch index and content type
  └── Apply jitter if configured (±jitterMinutes random offset)

Step 2: CALCULATE SCHEDULE TIME
  ├── Determine target date based on type:
  │   ├── CADENCE_TOUCH: Current date + cadence interval
  │   ├── MANUAL_FOLLOW_UP: Requested due date
  │   ├── RE_ENGAGEMENT: Current date + 24 hours
  │   ├── NURTURE_TOUCH: Current date + cadence interval (14/30/90 days)
  │   └── STALE_CHECK: Current date + 6 hours
  ├── Adjust to business hours:
  │   ├── If target time < business_start → set to business_start
  │   ├── If target time > business_end → set to next business day start
  │   ├── If target day is weekend → move to Monday
  │   └── If target day is holiday → move to next business day
  └── Apply jitter: Add random offset within ±jitterMinutes

Step 3: CHECK FOR CONFLICTS
  ├── Is there already a scheduled touch for this lead on the same day?
  │   ├── YES → Reschedule to next available day (max 2 touches/day)
  │   └── NO → Continue
  ├── Is there a more urgent touch that should go first?
  │   ├── YES → Reprioritize
  │   └── NO → Continue
  └── Is the lead in a stage where this touch type is appropriate?
      ├── NO → Cancel or modify
      └── YES → Continue

Step 4: CREATE SCHEDULE ENTRY + TASK
  ├── Generate schedule entry with calculated time and priority
  ├── Insert into database
  ├── Create associated Task record (assign to SDR or automation)
  └── Update lead's nextFollowUp field

Step 5: QUEUE FOR EXECUTION
  ├── Add to priority queue (sorted by scheduled time + priority)
  └── Register callback for when the scheduled time arrives

Step 6: RETURN RESULT
  └── Return FollowUpOutput with full scheduling details
```

### Database Queries

```typescript
// Update lead's next follow-up date
await prisma.lead.update({
  where: { id: input.leadId },
  data: { nextFollowUp: calculatedTime },
});

// Check for existing touches on same day
const existingTouches = await prisma.lead.count({
  where: {
    id: input.leadId,
    // Note: In full implementation, this would query a ScheduleEntry table
  },
});
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Timezone resolution fails | Default to America/New_York; flag as "timezone_uncertain" |
| Holiday calendar API unavailable | Proceed; flag for post-hoc holiday check |
| Schedule conflict with existing touch | Defer to next available business day |
| Database write fails | Retry 3x; then queue locally and create SUPPORT alert |

### Error Handling

```typescript
class ScheduleConflictError extends Error {
  constructor(public conflictingEntryId: string, public rescheduledTo: DateTime) {
    super('Schedule conflict detected, touch rescheduled');
  }
}

class TimezoneResolutionError extends Error {
  constructor(public leadId: string, public fallbackTimezone: string) {
    super('Could not resolve timezone, using fallback');
  }
}

class CadenceExhaustedError extends Error {
  constructor(public leadId: string, public completedTouches: number) {
    super('All cadence touches have been completed');
  }
}
```

### Example Scenarios

**Scenario: Tier 2 cadence touch scheduling**

```
Lead: Sarah Chen
Stage: contacted
Tier: 2
Timezone: America/Los_Angeles (UTC-8)
Current time: 2025-03-04T16:00:00Z (8:00 AM PT)

Scheduling Touch #2 (Day 3 of cadence):
1. Target date: 2025-03-07T18:00:00Z (Day 3, 10:00 AM PT)
2. Business hours check: 10:00 AM PT ✓ (within 9 AM - 6 PM)
3. Day of week: Friday ✓
4. No holiday conflict
5. No existing touch on same day
6. Jitter: +23 minutes → 10:23 AM PT
7. Priority: 4 (Tier 2, within SLA)
8. Schedule entry created: {scheduledAt: "2025-03-07T18:23:00Z"}
9. Task created: {type: "FOLLOW_UP_EMAIL", dueAt: "2025-03-07T18:23:00Z"}
```

### Performance Targets

| Metric | Target |
|---|---|
| Schedule calculation latency | < 50ms |
| Schedule creation (DB write) | < 100ms |
| Conflict check latency | < 30ms |
| Overdue detection latency | < 5 min after SLA breach |

---

## 4. Engagement Signal Detection

### Overview

The Engagement Signal Detection skill is Flow's real-time sensory system. It processes incoming signals from all outreach channels, classifies them by strength, updates engagement scores, and triggers appropriate pipeline actions.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Webhook event** | Email service sends open/click/reply/bounce webhook |
| **Agent-Reach Bridge event** | LinkedIn connection accepted, social interaction |
| **Web analytics event** | Page visit tracked via analytics integration |
| **Form submission** | Demo request, contact form, content download |
| **CRM sync** | Engagement event imported from CRM |

### Input Schema

```typescript
interface EngagementSignalInput {
  leadId?: string;                   // May need to be resolved from email
  identifier?: {                     // Alternative to leadId
    email?: string;
    linkedinUrl?: string;
    companyName?: string;
  };
  event: {
    source: 'EMAIL' | 'LINKEDIN' | 'WEB' | 'PHONE' | 'FORM' | 'CRM' | 'MANUAL';
    type: 'OPEN' | 'CLICK' | 'REPLY' | 'BOUNCE' | 'UNSUBSCRIBE' | 'VISIT' | 'SUBMIT' | 'CALL' | 'CONNECTION' | 'COMPLAINT';
    timestamp: DateTime;
    metadata: {
      campaignId?: string;
      sequenceId?: string;
      touchIndex?: number;
      url?: string;
      subject?: string;
      bodySnippet?: string;         // First 500 chars of reply (for LLM classification)
      pagePath?: string;
      formName?: string;
      duration?: number;
      userAgent?: string;
      ipAddress?: string;
    };
    raw: unknown;
  };
}
```

### Output Schema

```typescript
interface EngagementSignalOutput {
  processed: boolean;
  leadId: string;
  eventId: string;
  classification: {
    strength: 'NONE' | 'WEAK' | 'MODERATE' | 'STRONG';
    category: 'ENGAGEMENT' | 'DISENGAGEMENT' | 'NEUTRAL' | 'NEGATIVE';
    buyingSignal: boolean;           // LLM-classified from reply content
    buyingSignalConfidence?: number; // 0-1
  };
  scoreUpdate: {
    previous: number;
    delta: number;
    current: number;
    decayApplied: number;
  };
  trendUpdate: {
    previousTrend: 'RISING' | 'STABLE' | 'DECLINING';
    currentTrend: 'RISING' | 'STABLE' | 'DECLINING';
  };
  triggeredActions: Array<{
    type: 'TRANSITION' | 'ALERT' | 'TASK' | 'NOTIFICATION';
    target?: string;
    reason: string;
  }>;
  duplicateDetected: boolean;
}
```

### Method

```
Step 1: EVENT INGESTION & NORMALIZATION
  ├── Parse raw event payload into normalized schema
  ├── Resolve leadId from identifier if not provided
  │   ├── Search by email: prisma.lead.findFirst({ where: { generalEmail } })
  │   ├── Search by LinkedIn: prisma.lead.findFirst({ where: { linkedinUrl } })
  │   └── Search by company: prisma.lead.findFirst({ where: { companyName } })
  ├── If leadId cannot be resolved → create UNMATCHED_EVENT alert → RETURN
  └── Validate timestamp is within acceptable range (not future, not > 30 days old)

Step 2: DEDUPLICATION
  ├── Generate event fingerprint: hash(leadId + source + type + timestamp + url)
  ├── Check cache for fingerprint (TTL: 24h)
  ├── If found → mark as duplicate, return early
  └── If not found → store fingerprint, continue

Step 3: CLASSIFICATION
  ├── Determine engagement strength:
  │   ├── REPLY → STRONG
  │   ├── CLICK → MODERATE (STRONG if pricing/demo URL)
  │   ├── OPEN (2+) → WEAK
  │   ├── OPEN (1) → VERY_WEAK
  │   ├── BOUNCE → NONE (DISENGAGEMENT)
  │   └── UNSUBSCRIBE → NONE (NEGATIVE)
  ├── If type is REPLY or SUBMIT:
  │   ├── Send bodySnippet to LLM for buying signal classification
  │   ├── LLM prompt: "Classify as BUYING_SIGNAL, INTEREST_SIGNAL, 
  │   │   OBJECTION_SIGNAL, or NEUTRAL_SIGNAL. Provide confidence 0-1."
  │   └── Record classification result
  └── If type is CLICK:
      ├── Check if URL matches pricing/demo/schedule patterns
      └── Boost strength if high-intent URL

Step 4: SCORE CALCULATION
  ├── Calculate base score delta from weights table
  ├── Apply recency decay to existing score
  ├── Apply new score delta
  ├── Calculate trend (compare last 7 days vs previous 7 days)
  └── Cap total score at 100

Step 5: PERSIST EVENT
  ├── Update lead scores in database
  └── Update lead metadata

Step 6: ACTION ROUTING
  ├── Evaluate action rules based on current lead stage and score:
  │   ├── contacted + score ≥ 25 → TRANSITION to engaged
  │   ├── nurture + score ≥ 15 → TRANSITION to enriched
  │   ├── engaged + buying_signal → ALERT for NEGOTIATING
  │   ├── BOUNCE → INVALIDATE channel, alert SDR
  │   └── COMPLAINT → UNSUBSCRIBE, create negative alert
  └── Return triggered actions
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Lead resolution fails | Create UNMATCHED_EVENT alert with raw event data |
| LLM classification fails | Default to NEUTRAL_SIGNAL with confidence 0 |
| Score calculation error | Preserve previous score, log error |
| Duplicate detection timeout | Process event (allow potential duplicate) |

### Error Handling

```typescript
enum EngagementError {
  LEAD_NOT_RESOLVED = 'LEAD_NOT_RESOLVED',
  DUPLICATE_EVENT = 'DUPLICATE_EVENT',
  LLM_CLASSIFICATION_FAILED = 'LLM_CLASSIFICATION_FAILED',
  SCORE_CALCULATION_ERROR = 'SCORE_CALCULATION_ERROR',
  INVALID_EVENT_TYPE = 'INVALID_EVENT_TYPE',
}
```

### Example Scenarios

**Scenario: Email reply with buying signal**

```
Input event: REPLY from "sarah@acmecorp.com"
Body snippet: "Thanks for reaching out. We're actively looking for a solution like this. Can we set up a demo next week?"

Classification: STRONG, ENGAGEMENT, BUYING_SIGNAL (confidence: 0.94)
Score update: +25 (reply) + 10 (buying signal) = +35
Previous score: 15 → Current score: 50
Trend: STABLE → RISING

Triggered actions:
1. TRANSITION: contacted → engaged (score ≥ 25)
2. TASK: SDR to respond within 1 hour
3. NOTIFICATION: Email SDR about hot lead
```

### Performance Targets

| Metric | Target |
|---|---|
| Event processing latency | < 200ms (p95) |
| LLM classification latency | < 3s |
| Lead resolution latency | < 50ms |
| Deduplication check | < 10ms |
| Action routing latency | < 30ms |

---

## 5. Pipeline Analytics Calculation

### Overview

The Pipeline Analytics Calculation skill computes aggregate metrics across the entire pipeline, providing the data foundation for forecasting, health scoring, and decision-making.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Scheduled refresh** | Every 5 minutes (configurable) |
| **Post-transition** | After any stage transition |
| **On-demand** | User requests dashboard data |
| **Threshold breach** | Alert condition detected |

### Input Schema

```typescript
interface AnalyticsInput {
  type: 'FULL_REFRESH' | 'STAGE_UPDATE' | 'VELOCITY_CHECK' | 'HEALTH_SCORE';
  campaignId?: string;              // Optional: limit to specific campaign
  lookbackDays?: number;            // Default: 30
  stages?: PipelineStage[];         // Optional: limit to specific stages
}
```

### Output Schema

```typescript
interface AnalyticsOutput {
  calculatedAt: DateTime;
  pipelineOverview: {
    totalActiveLeads: number;
    stageDistribution: Record<PipelineStage, number>;
    averageAgeHours: Record<PipelineStage, number>;
  };
  conversionMetrics: {
    newToEnriched: number;           // Percentage
    enrichedToQualified: number;
    qualifiedToContacted: number;
    contactedToEngaged: number;
    engagedToNegotiating: number;
    negotiatingToClosedWon: number;
    overallWinRate: number;
  };
  velocityMetrics: {
    pipelineVelocity: number;        // $/week
    averageSalesCycleDays: number;
    timeInStage: Record<PipelineStage, number>; // Average days
  };
  healthScore: number;              // 0-100
  trends: {
    velocityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    conversionTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    engagementTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  };
}
```

### Method

```
Step 1: GATHER RAW DATA
  ├── Query all active leads (non-terminal stages)
  ├── Query stage transitions within lookback window
  ├── Query closed deals (WON + LOST) within lookback window
  └── Query follow-up adherence data

Step 2: COMPUTE STAGE DISTRIBUTION
  ├── Count leads per stage
  ├── Calculate average age per stage (hours since entered)
  └── Identify bottleneck stages (> 2x average dwell time)

Step 3: COMPUTE CONVERSION RATES
  ├── For each transition pair:
  │   ├── Count transitions from A to B in window
  │   ├── Count total leads that entered A in window
  │   └── Rate = transitions / total entries
  └── Calculate overall win rate

Step 4: COMPUTE VELOCITY METRICS
  ├── Pipeline velocity = (qualified × winRate × avgDealValue) / avgCycleDays
  ├── Average sales cycle = avg days from qualified to closed_won
  └── Time in stage = avg days per stage for leads that progressed

Step 5: COMPUTE HEALTH SCORE
  ├── Stage balance (30%): Even distribution across stages
  ├── Velocity trend (25%): Improving or stable
  ├── Follow-up adherence (20%): % on-time
  ├── Data hygiene (15%): Completeness score
  └── Engagement rate (10%): Active engagement ratio

Step 6: COMPUTE TRENDS
  ├── Compare current 7-day metrics to previous 7-day metrics
  ├── Determine trend direction for each metric
  └── Flag significant changes (> 15% swing)

Step 7: RETURN RESULTS
  └── Return AnalyticsOutput with all computed metrics
```

### Database Queries

```typescript
// Stage distribution
const stageDistribution = await prisma.lead.groupBy({
  by: ['stage'],
  where: {
    stage: { notIn: ['closed_won', 'closed_lost'] },
    ...(campaignId ? { campaignId } : {}),
  },
  _count: { id: true },
  _avg: { leadScore: true },
});

// Conversion metrics (SQL equivalent)
// SELECT 
//   from_stage, to_stage, COUNT(*) as count
// FROM stage_history
// WHERE created_at >= datetime('now', '-30 days')
// GROUP BY from_stage, to_stage

// Lead aging (SQL equivalent)
// SELECT 
//   stage, 
//   AVG(CAST(JULIANDAY('now') - JULIANDAY(updated_at) AS FLOAT) * 24) as avg_age_hours
// FROM leads
// WHERE stage NOT IN ('closed_won', 'closed_lost')
// GROUP BY stage
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Database query timeout | Return cached analytics (if < 5 min old) |
| Insufficient data (< 10 leads) | Mark metrics as "low confidence" |
| Calculation error | Return partial results with error annotation |

### Performance Targets

| Metric | Target |
|---|---|
| Full refresh latency | < 30s (10K leads) |
| Incremental update latency | < 5s |
| Health score accuracy | ±5% of manual calculation |
| Trend detection delay | < 2 hours from actual change |

---

## 6. Alert & Escalation Management

### Overview

The Alert & Escalation Management skill monitors pipeline conditions, generates alerts when thresholds are breached, and manages the escalation path to ensure timely resolution.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Threshold breach** | A monitored metric exceeds its threshold |
| **Time-based** | Dwell time exceeds maximum for a stage |
| **Event-driven** | Bounce, unsubscribe, or other negative event |
| **Periodic scan** | Scheduled scan for stale or problematic leads |

### Input Schema

```typescript
interface AlertInput {
  type: 'STALE_LEAD' | 'ENGAGEMENT_DECAY' | 'OVERDUE_FOLLOW_UP' | 
        'PIPELINE_VELOCITY_DROP' | 'DUPLICATE_DETECTED' | 'BOUNCE_DETECTED' |
        'UNSUBSCRIBE' | 'DATA_QUALITY_LOW' | 'CUSTOM';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  leadId?: string;
  campaignId?: string;
  details: Record<string, unknown>;
  recommendedAction?: string;
}
```

### Output Schema

```typescript
interface AlertOutput {
  alertId: string;
  type: string;
  severity: string;
  leadId?: string;
  message: string;
  recommendedAction: string;
  escalationPath: string[];
  createdAt: DateTime;
  expiresAt: DateTime;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED' | 'EXPIRED';
}
```

### Method

```
Step 1: EVALUATE ALERT CONDITION
  ├── Check if the condition matches any registered alert rule
  ├── Determine severity based on rule configuration
  └── If no matching rule → log and discard (unknown alert type)

Step 2: DEDUPLICATE ALERTS
  ├── Check for existing active alert with same type + leadId
  ├── If found and < 1 hour old → update existing alert (don't create duplicate)
  └── If found and > 1 hour old → escalate existing alert

Step 3: CREATE ALERT
  ├── Generate alert with full context
  ├── Set expiration time (INFO: 7d, WARNING: 14d, CRITICAL: 30d)
  ├── Determine escalation path based on lead tier
  └── Set initial status to ACTIVE

Step 4: NOTIFY
  ├── Send notification to first person in escalation path
  ├── Route to appropriate channel (email, Slack, in-app)
  └── Log notification dispatch

Step 5: SCHEDULE ESCALATION CHECK
  ├── If not acknowledged within tier-specific SLA:
  │   ├── Tier 1: 2 hours
  │   ├── Tier 2: 8 hours
  │   └── Tier 3: 24 hours
  └── Escalate to next person in path

Step 6: RETURN RESULT
  └── Return AlertOutput with full details
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Notification delivery fails | Retry via alternate channel |
| Escalation target unavailable | Skip to next person in escalation path |
| Alert creation fails | Log to system error stream for manual review |

### Error Handling

```typescript
enum AlertError {
  RULE_NOT_FOUND = 'RULE_NOT_FOUND',
  NOTIFICATION_FAILED = 'NOTIFICATION_FAILED',
  ESCALATION_TIMEOUT = 'ESCALATION_TIMEOUT',
  ALERT_CREATION_FAILED = 'ALERT_CREATION_FAILED',
}
```

### Example Scenarios

**Scenario: Stale lead in QUALIFIED stage**

```
Lead L-4412 has been in QUALIFIED for 76 hours (max: 72h)
Alert type: STALE_LEAD_QUALIFIED
Severity: CRITICAL
Message: "Lead L-4412 has exceeded the 72h SLA in QUALIFIED stage. No outreach has been sent."
Recommended action: "Assign to available SDR immediately or regress to NURTURE."
Escalation path: [assigned SDR → SDR Manager → Pipeline Owner]
```

### Performance Targets

| Metric | Target |
|---|---|
| Alert detection latency | < 5 min after condition |
| Notification dispatch | < 30s after alert creation |
| Deduplication check | < 20ms |
| Escalation timing accuracy | ±15 min of configured SLA |

---

## 7. Data Hygiene & Deduplication

### Overview

The Data Hygiene & Deduplication skill maintains pipeline data quality by detecting and resolving duplicates, identifying stale data, and flagging missing critical fields.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Lead creation** | Check for duplicates before creating |
| **Scheduled scan** | Nightly full-pipeline hygiene scan |
| **Post-enrichment** | Verify data quality after enrichment |
| **Manual trigger** | SDR requests merge or hygiene check |

### Input Schema

```typescript
interface HygieneInput {
  type: 'DEDUP_CHECK' | 'FULL_SCAN' | 'MERGE' | 'STALE_CHECK' | 'QUALITY_CHECK';
  leadId?: string;                  // For single-lead checks
  leadIds?: string[];               // For batch checks
  mergeConfig?: {
    survivorId: string;             // Lead to keep
    duplicateIds: string[];         // Leads to merge and delete
    fieldResolution: 'SURVIVOR_WINS' | 'MOST_COMPLETE' | 'NEWEST';
  };
  thresholds?: {
    staleDays?: number;             // Default: 30
    qualityMinScore?: number;       // Default: 20
  };
}
```

### Output Schema

```typescript
interface HygieneOutput {
  type: string;
  leadsScanned: number;
  duplicatesFound: number;
  staleLeadsFound: number;
  lowQualityLeads: number;
  actions: Array<{
    action: 'MERGE_RECOMMENDED' | 'REFRESH_NEEDED' | 'FLAG_LOW_QUALITY';
    leadIds: string[];
    confidence: number;
    reason: string;
  }>;
  mergeResult?: {
    survivorId: string;
    mergedIds: string[];
    fieldsUpdated: string[];
    tasksMigrated: number;
  };
}
```

### Method

**For Dedup Check:**

```
Step 1: EXACT MATCH CHECK
  ├── Check email: prisma.lead.findFirst({ where: { generalEmail: input.email } })
  ├── Check LinkedIn: prisma.lead.findFirst({ where: { linkedinUrl: input.linkedinUrl } })
  └── If exact match found → return DUPLICATE_DETECTED (confidence: 0.95+)

Step 2: FUZZY MATCH CHECK
  ├── Normalize company name (lowercase, strip suffixes)
  ├── Levenshtein distance on normalized name + domain
  ├── If similarity ≥ 0.85 → return POTENTIAL_DUPLICATE (confidence: 0.75-0.94)
  └── If similarity < 0.85 → return NO_DUPLICATE

Step 3: RECOMMEND ACTION
  ├── Exact match → Recommend auto-merge (keep richer record)
  ├── Fuzzy match → Recommend human review
  └── No match → No action needed
```

**For Full Scan:**

```
Step 1: LOAD ALL ACTIVE LEADS
  ├── Query leads in non-terminal stages
  └── Group by campaign for efficient processing

Step 2: DEDUP PASS
  ├── For each lead pair in same campaign:
  │   ├── Compare email, LinkedIn, normalized company name
  │   └── Flag potential duplicates
  └── Generate merge recommendations

Step 3: STALE DATA PASS
  ├── For each lead not updated in threshold days:
  │   ├── Check if enrichment data is stale
  │   └── Flag for refresh
  └── Generate refresh recommendations

Step 4: QUALITY PASS
  ├── For each lead, compute dataCompleteness score:
  │   ├── Has website: +15
  │   ├── Has industry: +10
  │   ├── Has city + country: +15
  │   ├── Has email: +20
  │   ├── Has phone: +15
  │   ├── Has LinkedIn: +10
  │   └── Has key contact: +15
  ├── Flag leads below threshold (default: 20)
  └── Generate quality alerts

Step 5: RETURN SUMMARY
  └── Return HygieneOutput with all findings and recommendations
```

### Database Queries

```typescript
// Find potential duplicates by email
const existingLead = await prisma.lead.findFirst({
  where: {
    generalEmail: input.data.generalEmail,
    id: { not: input.leadId },  // Exclude self
  },
});

// Find stale leads
const staleLeads = await prisma.lead.findMany({
  where: {
    stage: { notIn: ['closed_won', 'closed_lost'] },
    updatedAt: { lt: new Date(Date.now() - staleThresholdMs) },
  },
  take: 100,
});

// Merge operation (within transaction)
const mergeResult = await prisma.$transaction(async (tx) => {
  // Update survivor with richer data from duplicates
  const survivor = await tx.lead.update({
    where: { id: mergeConfig.survivorId },
    data: mergedFieldData,
  });
  
  // Migrate outreach records
  await tx.outreach.updateMany({
    where: { leadId: { in: mergeConfig.duplicateIds } },
    data: { leadId: mergeConfig.survivorId },
  });
  
  // Delete duplicates
  await tx.lead.deleteMany({
    where: { id: { in: mergeConfig.duplicateIds } },
  });
  
  return survivor;
});
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Fuzzy match algorithm timeout | Fall back to exact match only |
| Merge transaction fails | Roll back, create alert for manual merge |
| Stale data refresh unavailable | Flag lead, continue scan |

### Example Scenarios

**Scenario: Duplicate detected during lead creation**

```
New lead: "NovaTech Inc." / info@novatech.io
Existing lead: "NovaTech" / info@novatech.io (L-2847)

Exact match: email = info@novatech.io → confidence: 0.98
Recommendation: AUTO_MERGE
Survivor: L-2847 (has more data: industry, employee count)
Fields from new lead: phone number (not in existing)

Merge result:
- L-2847 updated with phone from new lead
- New lead creation cancelled
- Output: DUPLICATE_DETECTED, merged into L-2847
```

### Performance Targets

| Metric | Target |
|---|---|
| Exact match check | < 20ms |
| Fuzzy match (single lead vs 10K) | < 100ms |
| Full scan (10K leads) | < 5 min |
| Merge operation | < 500ms |

---

## 8. Pipeline Forecasting

### Overview

The Pipeline Forecasting skill predicts future pipeline outcomes based on historical conversion rates, current pipeline composition, and deal velocity trends.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Scheduled** | Weekly forecast refresh |
| **Post-deal** | After CLOSED-WON or CLOSED-LOST |
| **On-demand** | User requests forecast |
| **Threshold breach** | Velocity drops significantly |

### Input Schema

```typescript
interface ForecastInput {
  type: 'REVENUE_FORECAST' | 'CONVERSION_FORECAST' | 'CAPACITY_FORECAST';
  horizon: number;                  // Days to forecast (default: 30)
  confidenceLevel: number;          // 0-1 (default: 0.85)
  campaignId?: string;              // Optional: specific campaign
  includeNurture?: boolean;         // Include nurture pipeline (default: false)
}
```

### Output Schema

```typescript
interface ForecastOutput {
  generatedAt: DateTime;
  horizon: number;
  confidenceLevel: number;
  revenueForecast: {
    optimistic: number;             // 85th percentile
    expected: number;               // 50th percentile (median)
    pessimistic: number;            // 15th percentile
  };
  conversionForecast: {
    leadsNeeded: number;            // To hit revenue target
    expectedCloses: number;         // Based on current pipeline
    expectedCloseTimeline: string;  // Average weeks to close
  };
  pipelineCoverage: number;         // Ratio of pipeline to target (ideal: 3-4x)
  riskFactors: Array<{
    factor: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    probability: number;
  }>;
}
```

### Method

```
Step 1: GATHER HISTORICAL DATA
  ├── Query CLOSED-WON deals in last 90 days
  ├── Calculate historical win rate by tier
  ├── Calculate average deal value by tier
  └── Calculate average sales cycle by tier

Step 2: ASSESS CURRENT PIPELINE
  ├── Count leads in each stage
  ├── Calculate weighted pipeline value:
  │   ├── NEGOTIATING: 75% probability × estimated deal value
  │   ├── ENGAGED: 40% probability
  │   ├── CONTACTED: 15% probability
  │   ├── QUALIFIED: 8% probability
  │   └── ENRICHED/NEW: 3% probability
  └── Apply confidence adjustments

Step 3: CALCULATE FORECAST
  ├── Revenue forecast = sum of (weighted pipeline values)
  ├── Generate optimistic/expected/pessimistic scenarios
  ├── Calculate pipeline coverage ratio
  └── Identify risk factors (low coverage, declining velocity, etc.)

Step 4: GENERATE RECOMMENDATIONS
  ├── If pipeline coverage < 3x → recommend increasing top-of-funnel
  ├── If velocity declining → recommend improving mid-funnel conversion
  └── If close rate dropping → recommend SDR coaching or ICP refinement

Step 5: RETURN RESULTS
  └── Return ForecastOutput with full analysis
```

### Database Queries

```typescript
// Historical win rate
const closedDeals = await prisma.lead.findMany({
  where: {
    stage: { in: ['closed_won', 'closed_lost'] },
    contactedAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
  },
});

const winRate = closedDeals.filter(l => l.stage === 'closed_won').length / closedDeals.length;

// Current pipeline composition
const pipelineLeads = await prisma.lead.findMany({
  where: {
    stage: { notIn: ['closed_won', 'closed_lost'] },
  },
  select: { id: true, stage: true, leadScore: true, leadTier: true },
});
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Insufficient historical data (< 10 deals) | Use industry benchmarks as proxy |
| Large pipeline changes mid-period | Add uncertainty buffer to forecast |
| Missing deal values | Use average deal value from available data |

### Example Scenarios

**Scenario: 30-day revenue forecast**

```
Current pipeline:
  NEGOTIATING: 5 leads × $50K avg × 75% = $187,500
  ENGAGED: 12 leads × $45K avg × 40% = $216,000
  CONTACTED: 35 leads × $40K avg × 15% = $210,000
  QUALIFIED: 20 leads × $40K avg × 8%  = $64,000
  ENRICHED/NEW: 50 leads × $35K avg × 3% = $52,500

Expected revenue (30d): $730,000
Optimistic (85th %):   $920,000
Pessimistic (15th %):  $540,000

Pipeline coverage: 3.2x (healthy)
Risk factors:
  - Contacted→Engaged conversion below average (LOW impact, 60% probability)
```

### Performance Targets

| Metric | Target |
|---|---|
| Forecast calculation latency | < 10s |
| Forecast accuracy (30-day) | ±20% of actual |
| Pipeline coverage accuracy | ±5% |

---

## 9. Automated Nurture Sequences

### Overview

The Automated Nurture Sequences skill manages long-term drip campaigns for leads that aren't ready for active sales engagement. It handles cadence scheduling, content selection, re-engagement detection, and auto-upgrade triggers.

### Trigger

| Trigger Type | Condition |
|---|---|
| **Stage entry** | Lead enters NURTURE stage |
| **Cadence timer** | Next nurture touch is due |
| **Engagement event** | Nurture lead shows engagement signal |
| **Cooldown expiry** | Closed-Lost lead's cooldown period expires |

### Input Schema

```typescript
interface NurtureInput {
  leadId: string;
  action: 'START' | 'NEXT_TOUCH' | 'UPGRADE_CHECK' | 'COOLDOWN_EXPIRED';
  cadenceType?: 'WARM' | 'COOL' | 'COLD' | 'RE_ENGAGEMENT';
  sourceStage?: PipelineStage;     // Stage that sent lead to nurture
  lossReason?: string;             // If from CLOSED-LOST
  engagementSignal?: {
    type: 'OPEN' | 'CLICK' | 'REPLY';
    timestamp: DateTime;
  };
}
```

### Output Schema

```typescript
interface NurtureOutput {
  leadId: string;
  action: string;
  cadence: {
    type: string;
    frequency: string;           // e.g., "every 14 days"
    nextTouchDate: DateTime;
    remainingTouches: number;
  };
  upgradeEligible: boolean;
  upgradeReason?: string;
  scheduledTask?: {
    id: string;
    type: string;
    dueAt: DateTime;
  };
}
```

### Method

```
Step 1: DETERMINE NURTURE CADENCE
  ├── If from CLOSED-LOST with timing reason → Warm Nurture (14-day)
  ├── If from CLOSED-LOST with budget reason → Cool Nurture (30-day)
  ├── If from CLOSED-LOST with competitor → Cold Nurture (90-day)
  ├── If from ENRICHED (below ICP) → Cool Nurture (30-day)
  ├── If from CONTACTED (partial engagement) → Warm Nurture (14-day)
  └── If from NEGOTIATING (stalled) → Cool Nurture (30-day)

Step 2: SCHEDULE FIRST TOUCH
  ├── Apply any cooldown period from loss reason
  ├── Schedule within business hours
  ├── Create task for SDR or automation
  └── Set next follow-up date on lead

Step 3: MONITOR FOR UPGRADE SIGNALS
  ├── 2+ opens in 7-day window → "warming" flag
  ├── CTA click → auto-upgrade to ENRICHED
  ├── Reply → immediate upgrade to ENRICHED with "hot nurture" flag
  └── Form/demo submission → direct upgrade to QUALIFIED

Step 4: HANDLE SEQUENCE PROGRESSION
  ├── When touch is executed, schedule next touch per cadence
  ├── If all touches exhausted with no engagement:
  │   ├── Move to next lower cadence (Warm → Cool → Cold)
  │   └── If already on Cold and exhausted → recommend archival after 365 days
  └── Track touch completion in lead notes

Step 5: RETURN RESULT
  └── Return NurtureOutput with cadence details and next touch
```

### Database Queries

```typescript
// Update lead on nurture entry
await prisma.lead.update({
  where: { id: input.leadId },
  data: {
    stage: 'nurture',
    nextFollowUp: firstTouchDate,
    notes: `Entered nurture: ${input.cadenceType} cadence from ${input.sourceStage}`,
  },
});

// Find nurture leads ready for next touch
const nurtureLeads = await prisma.lead.findMany({
  where: {
    stage: 'nurture',
    nextFollowUp: { lte: new Date() },
  },
  take: 50,
});
```

### Fallback Strategies

| Failure | Fallback |
|---|---|
| Cadence type cannot be determined | Default to Cool Nurture |
| Next touch scheduling fails | Retry in 1 hour |
| Upgrade trigger fails | Create alert for manual review |

### Example Scenarios

**Scenario: Closed-Lost lead entering nurture**

```
Lead L-5578: Lost deal ($120K), reason: TM-004 (Timing)
Action: START
Cadence: Warm Nurture (every 14 days)
Cooldown: 90 days before first touch (prospect said "not until Q3")

Scheduled first touch: 2025-06-15 (after Q3 budget cycle)
Content type: "Q3 budget planning resources"
Next touch: 2025-06-29
Remaining touches: 6 (over 12 weeks)

Upgrade trigger: If prospect opens 2+ emails or clicks any CTA
```

### Performance Targets

| Metric | Target |
|---|---|
| Nurture entry processing | < 200ms |
| Upgrade detection latency | < 5 min after engagement signal |
| Cadence scheduling accuracy | ±2 hours of target time |
| Nurture-to-pipeline re-entry rate | ≥ 8% over 12 months |

---

## 10. Execution Engine Integration

### Runtime Handler

**Function:** `executePipelineManager(ctx: AgentExecutionContext): Promise<AgentExecutionResult>`

**File:** `src/lib/agent-executor.ts`

### Execution Flow

```
1. Receive AgentExecutionContext
   ├─ taskId: string
   ├─ agentName: "pipeline-manager"
   ├─ taskType: "coordinate"
   ├─ campaignId: string | null
   ├─ input: Record<string, unknown>
   └─ priority: number

2. Parse operation from input
   ├─ operation: "status_change" | "analytics" | "hygiene" | "schedule" | "alert_check"
   └─ Extract operation-specific parameters

3. Update task progress to 20% (running)

4. Execute the requested operation
   ├─ status_change → Skill 1 (Lead Status Management)
   ├─ analytics → Skill 5 (Pipeline Analytics)
   ├─ hygiene → Skill 7 (Data Hygiene)
   ├─ schedule → Skill 3 (Follow-Up Scheduling)
   └─ alert_check → Skill 6 (Alert Management)

5. Update task progress to 80% (running)

6. Process results and update database
   └─ Update lead records, create tasks, generate alerts as needed

7. Update task progress to 100% (completed)

8. Return AgentExecutionResult
   └─ { success: true, output: { operation, result }, channelActivity: [] }
```

### Error Flow

```
Any step throws error:
  ├─ msg = error.message
  ├─ await updateTaskProgress(ctx.taskId, 0, 'failed')
  └─ return { success: false, output: { error: msg }, channelActivity: [], error: msg }
```

### API Dispatch

**Direct dispatch:**
```http
POST /api/agents/execute
Content-Type: application/json

{
  "mode": "dispatch",
  "agentName": "pipeline-manager",
  "taskType": "coordinate",
  "input": {
    "operation": "status_change",
    "leadId": "clx8k2m3g0001",
    "targetStage": "qualified",
    "reason": "ICP score meets threshold",
    "triggeredBy": "AUTO"
  },
  "priority": 5
}
```

**Via Orchestrator (automatic):**
The orchestrator includes pipeline-manager as a `coordinate` step in campaign execution plans, typically after enrichment and qualification.

### Agent-Reach Bridge Functions Used

**None.** Flow does not directly call any Agent-Reach bridge functions. It operates exclusively on the database layer, reading and updating lead records via Prisma.

### Database Models Used

| Model | Operations | Key Fields |
|---|---|---|
| `Lead` | READ, UPDATE | `stage`, `leadScore`, `leadTier`, `enrichedAt`, `qualifiedAt`, `contactedAt`, `nextFollowUp`, `notes` |
| `Campaign` | READ, UPDATE | `leadsFound`, `leadsQualified`, `leadsContacted`, `leadsResponded` |
| `Outreach` | READ | `status`, `sentAt`, `openedAt`, `repliedAt` |
| `AgentTask` | CREATE, READ, UPDATE | Task management for pipeline operations |

### Key Dependencies

```typescript
import { db } from './db';
import { callLLM, callLLMForJSON } from './agent-executor';
import { updateTaskProgress } from './agent-executor';
import type { AgentName } from './types';
```

### LLM Configuration

| Parameter | Value | Use Case |
|---|---|---|
| `temperature` | 0.2 | Classification, scoring — low randomness |
| `max_tokens` | 2000 | Structured responses only |
| `retries` | 1 (callLLM), 2 (callLLMForJSON) | Balance reliability vs. latency |

### LLM Prompts Used

**Buying Signal Classification:**
```
You are a sales intelligence classifier. Analyze this prospect response and classify it:

Response: "{bodySnippet}"

Classify as one of:
- BUYING_SIGNAL: Explicit request for pricing, demo, meeting, or proposal
- INTEREST_SIGNAL: Questions about features, use cases, or implementation
- OBJECTION_SIGNAL: Concerns about price, fit, or timing
- NEUTRAL_SIGNAL: Acknowledgment, out-of-office, or non-substantive reply

Return JSON: { "classification": "...", "confidence": 0.0-1.0, "reasoning": "..." }
```

**ICP Score Calculation:**
```
You are an ICP scoring engine. Score this lead against the ideal customer profile.

Lead data: {companyName, industry, employeeCount, revenueEstimate, city, country, techStack}

Score each dimension (0-max):
- firmographic (0-30): industry fit, company size, revenue
- technographic (0-20): tech stack alignment
- behavioral (0-20): buying signals, engagement
- seniority (0-15): decision-maker level
- fit (0-15): geographic, regulatory, timeline

Return JSON: { "total": 0-100, "dimensions": {...}, "confidence": 0-1, "missingDimensions": [...] }
```

### Performance Targets

| Metric | Target |
|---|---|
| Total pipeline manager execution time | < 30s |
| Status change operation | < 1s |
| Analytics calculation | < 10s |
| Full hygiene scan | < 5 min |
| LLM classification | < 3s per lead |

---

*Flow — Every skill a precision instrument. Every execution a validated transition. Every pipeline a well-oiled machine.*
