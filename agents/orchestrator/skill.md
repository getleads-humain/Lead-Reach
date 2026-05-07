# Orchestrator Agent — Skills Reference

> *Atlas doesn't search the web. Atlas orchestrates the agents that search the web. These are the cognitive skills that make that possible.*

---

## Table of Contents

1. [Campaign Brief Parsing](#1-campaign-brief-parsing)
2. [Execution Graph Generation](#2-execution-graph-generation)
3. [Agent Delegation Engine](#3-agent-delegation-engine)
4. [Progress Monitoring System](#4-progress-monitoring-system)
5. [Result Synthesis Pipeline](#5-result-synthesis-pipeline)
6. [Adaptive Strategy Engine](#6-adaptive-strategy-engine)
7. [Quality Validation Framework](#7-quality-validation-framework)
8. [Escalation & Clarification](#8-escalation--clarification)
9. [Campaign State Management](#9-campaign-state-management)
10. [Execution Engine Integration](#10-execution-engine-integration)

---

## 1. Campaign Brief Parsing

### Trigger
A user submits a natural language campaign brief through the AI chat interface (`POST /api/ai`) or the dispatch API (`POST /api/agents/execute` with `mode: "dispatch"`).

### Input Schema

```typescript
interface CampaignBrief {
  // Any combination of these fields may be present:
  query?: string;        // Free-text search query
  industry?: string;     // Target industry (e.g., "Accounting", "Fintech")
  location?: string;     // Target location (e.g., "Dubai, UAE", "Singapore")
  companySize?: string;  // Target company size range (e.g., "51-200")
  technology?: string;   // Target tech stack (e.g., "Salesforce")
  role?: string;         // Target role/title (e.g., "CTO", "VP Engineering")
  description?: string;  // Free-text description of what the user wants
  message?: string;      // Natural language message from AI chat
}
```

### Output Schema

```typescript
interface ParsedCampaign {
  campaignName: string;       // Auto-generated campaign title
  targetIndustry: string;     // Extracted industry
  targetLocation: string;     // Extracted location
  targetCompanySize?: string; // Extracted size range
  targetTechnology?: string;  // Extracted tech stack
  targetRole?: string;        // Extracted role/title
  rawBrief: string;           // Original user input
}
```

### Method

1. **Receive raw input** — The brief arrives as a JSON object with varying field names. Atlas normalizes by checking `query`, `description`, and `message` fields for the primary search intent.

2. **LLM extraction** — The entire input is serialized to JSON and passed to `callLLMForJSON()` with the `planningPrompt` system message. The LLM simultaneously parses the brief AND generates the full execution plan, combining entity extraction and planning into a single LLM call for efficiency.

3. **Entity extraction** — The LLM identifies:
   - **Industry**: Direct match from a list of 30 standard industries, or LLM classification (e.g., "marketing agencies" → "Marketing")
   - **Location**: Geographic entity recognition with city/country parsing (e.g., "Dubai" → city="Dubai", country="UAE")
   - **Company size**: Range extraction from natural language (e.g., "mid-sized" → "51-200")
   - **Technology**: Technology product detection (e.g., "that use Salesforce" → technology="Salesforce")
   - **Role**: Professional title normalization (e.g., "CTOs" → role="CTO")

4. **Campaign naming** — Atlas auto-generates a campaign name using the pattern: `"{Industry} — {Location}"` (e.g., "Accounting — Dubai, UAE")

5. **Validation** — If the LLM returns empty `campaignName` or empty `steps`, the default value is used: `{ campaignName: 'New Campaign', targetIndustry: '', targetLocation: '', steps: [] }`

### LLM Prompts Used

**System Prompt (planningPrompt):**
```
You are the Orchestrator Agent ("Atlas") for a lead generation platform
powered by Agent-Reach. Your job is to create a detailed execution plan
for the following request, breaking it into sub-tasks for specialized agents.

Available agents and their Agent-Reach-powered capabilities:
- prospect-discovery: Exa Search, Web (Jina Reader), LinkedIn, GitHub, Twitter, Reddit, RSS
- data-enrichment: Web (Jina Reader), LinkedIn, Exa Search, Twitter, GitHub
- web-research: Web (Jina Reader), Exa Search, LinkedIn, Twitter, YouTube, Reddit, RSS
- lead-qualification: Web (Jina Reader), LinkedIn, Exa Search
- outreach-composer: LinkedIn, Web (Jina Reader), Exa Search
- pipeline-manager: Database only (no direct channel access)
- report-generator: Database only (no direct channel access)

Create a JSON execution plan with this structure:
{
  "campaignName": "string",
  "targetIndustry": "string",
  "targetLocation": "string",
  "steps": [
    {
      "agent": "agent-name",
      "taskType": "search|enrich|qualify|outreach|report|coordinate",
      "description": "What this agent should do",
      "input": { key: value },
      "input": { key: value },
      "dependsOn": null | "step-index"
    }
  ]
}
```

**User Message:**
The entire `input` object is serialized as JSON and sent as the user message.

### Agent-Reach Channels Referenced
None directly — Atlas does not access any Agent-Reach channels. All channel access is delegated to specialized agents.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| LLM returns empty plan | Use default plan: `{ campaignName: 'New Campaign', steps: [] }` |
| LLM returns invalid JSON | `callLLMForJSON` retries up to 2 times with stricter prompt, then uses default |
| No industry detected | Set `targetIndustry` to empty string; Scout will do broad search |
| No location detected | Set `targetLocation` to empty string; Scout will search globally |

### Error Handling

- `callLLM()` retries once on timeout or empty response
- `callLLMForJSON()` retries up to 2 times with progressively stricter JSON-only prompts
- If all retries fail, the default value is returned and the task completes with a minimal plan
- The orchestrator task is marked `failed` only if the LLM call throws after all retries

### Performance Targets

| Metric | Target |
|--------|--------|
| Brief parsing latency | < 5 seconds |
| Entity extraction accuracy | ≥ 85% |
| Plan generation latency | < 10 seconds |

---

## 2. Execution Graph Generation

### Trigger
After the campaign brief is parsed, Atlas generates the dependency-aware task graph from the `steps[]` array in the LLM-generated plan.

### Input Schema

```typescript
interface PlanStep {
  agent: string;          // Agent name key (e.g., "prospect-discovery")
  taskType: string;       // search | enrich | qualify | outreach | report | coordinate
  description: string;    // What this agent should do
  input: Record<string, unknown>;  // Task-specific input
  dependsOn: number | null;  // Index of dependency step, or null for first step
}

interface ExecutionPlan {
  campaignName: string;
  targetIndustry: string;
  targetLocation: string;
  steps: PlanStep[];
}
```

### Output Schema

```typescript
interface ExecutionGraph {
  campaignId: string;
  tasks: Array<{
    id: string;           // CUID of the created AgentTask
    agent: string;        // Agent name
    taskType: string;     // Task type
    priority: number;     // Computed priority (10 - stepIndex)
  }>;
  totalSubTasks: number;
}
```

### Method

1. **Campaign creation** — If `ctx.campaignId` is null and `plan.campaignName` is non-empty, Atlas creates a new Campaign record:
   ```typescript
   const campaign = await db.campaign.create({
     data: {
       name: plan.campaignName,
       targetIndustry: plan.targetIndustry,
       targetLocation: plan.targetLocation,
       status: 'active',
     },
   });
   campaignId = campaign.id;
   ```

2. **Task creation loop** — For each step in `plan.steps`, Atlas creates an `AgentTask` record:
   ```typescript
   for (let i = 0; i < plan.steps.length; i++) {
     const step = plan.steps[i];
     const task = await db.agentTask.create({
       data: {
         campaignId,
         agentName: step.agent,
         taskType: step.taskType,
         status: 'pending',
         priority: Math.max(1, 10 - i),
         input: JSON.stringify({
           ...step.input,
           description: step.description,
           parentTaskId: ctx.taskId,
           ...(campaignId ? { campaignId } : {}),
         }),
       },
     });
   }
   ```

3. **Dependency encoding** — Dependencies are encoded in the `dependsOn` field of the plan. The execution engine respects these by processing tasks in priority order. Since earlier steps get higher priority, the natural execution order matches the dependency graph.

4. **Parallel path detection** — Steps with `dependsOn: null` or the same `dependsOn` value can run in parallel. Atlas identifies these but does not enforce parallel execution — the Agent Execution Engine handles concurrent task processing.

5. **Priority assignment** — Each step gets priority `Math.max(1, 10 - i)`:
   - Step 0: priority 10 (discovery — always first)
   - Step 1: priority 9 (enrichment — after discovery)
   - Step 2: priority 8 (qualification — after enrichment)
   - Step 3: priority 7 (outreach — after qualification)
   - Step 4: priority 6 (reporting — last)

### LLM Prompts Used
No additional LLM calls — the execution graph is generated programmatically from the plan returned by Skill 1.

### Agent-Reach Channels Referenced
None directly.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Plan has 0 steps | Complete task with empty output, log warning |
| Agent name is invalid | Task creation will still succeed; execution engine validates agent names |
| Campaign creation fails | Use existing campaignId from context |

### Error Handling

- If `db.campaign.create()` fails, the error propagates and the orchestrator task is marked `failed`
- If `db.agentTask.create()` fails for a specific step, the error is caught and the orchestrator task fails
- All database operations are non-transactional (individual creates), so partial creation is possible

### Performance Targets

| Metric | Target |
|--------|--------|
| Graph generation latency | < 2 seconds |
| Task creation throughput | < 100ms per task |
| Plan to execution lag | < 3 seconds total |

---

## 3. Agent Delegation Engine

### Trigger
After the execution graph is created and `AgentTask` records exist in the database with `status: 'pending'`.

### Input Schema

```typescript
interface DelegationInput {
  taskId: string;         // The AgentTask to delegate
  agentName: string;      // Target agent
  taskType: string;       // Task type
  input: Record<string, unknown>;  // Parsed from AgentTask.input JSON
  priority: number;       // Task priority
  campaignId: string | null;
}
```

### Output Schema

```typescript
interface DelegationResult {
  success: boolean;
  output: Record<string, unknown>;  // Agent's execution result
  channelActivity: ChannelActivityRecord[];
  error?: string;
}
```

### Method

1. **Task pickup** — The Agent Execution Engine polls for `pending` tasks ordered by priority (descending) and dispatches each to the appropriate handler:
   ```typescript
   // In agent-executor.ts
   export async function executeTask(taskId: string): Promise<AgentExecutionResult> {
     const task = await db.agentTask.findUnique({ where: { id: taskId } });
     if (!task || task.status !== 'pending') return;
     
     const ctx: AgentExecutionContext = {
       taskId: task.id,
       agentName: task.agentName as AgentName,
       taskType: task.taskType,
       campaignId: task.campaignId,
       input: JSON.parse(task.input || '{}'),
       priority: task.priority,
     };
     
     // Dispatch to the correct handler
     switch (ctx.agentName) {
       case 'orchestrator': return executeOrchestrator(ctx);
       case 'prospect-discovery': return executeProspectDiscovery(ctx);
       case 'data-enrichment': return executeDataEnrichment(ctx);
       case 'web-research': return executeWebResearch(ctx);
       case 'lead-qualification': return executeLeadQualification(ctx);
       case 'outreach-composer': return executeOutreachComposer(ctx);
       case 'pipeline-manager': return executePipelineManager(ctx);
       case 'report-generator': return executeReportGenerator(ctx);
     }
   }
   ```

2. **Agent-to-handler mapping** — Each `agentName` maps to a specific handler function that uses the appropriate Agent-Reach channels and LLM prompts:

   | Agent Name | Handler Function | Agent-Reach Channels |
   |-----------|-----------------|---------------------|
   | `prospect-discovery` | `executeProspectDiscovery()` | Exa, Reddit, LinkedIn, Twitter |
   | `data-enrichment` | `executeDataEnrichment()` | Web, Exa, LinkedIn, Twitter |
   | `web-research` | `executeWebResearch()` | Exa, Reddit, YouTube, Twitter, LinkedIn, Web |
   | `lead-qualification` | `executeLeadQualification()` | Exa |
   | `outreach-composer` | `executeOutreachComposer()` | LinkedIn, Web, Exa |
   | `pipeline-manager` | `executePipelineManager()` | Database only |
   | `report-generator` | `executeReportGenerator()` | Database only |

3. **Context injection** — Each handler receives the full `AgentExecutionContext`, including:
   - `taskId` — For progress updates
   - `campaignId` — For filtering leads and updating campaign counters
   - `input` — The parsed task input including description, query, industry, location
   - `priority` — For internal scheduling

4. **Progress reporting** — Each handler calls `updateTaskProgress()` at key milestones to report progress (0-100%).

### LLM Prompts Used
Each agent handler has its own LLM prompts. Atlas does not add any delegation-specific prompts.

### Agent-Reach Channels Referenced
None directly by Atlas. Each delegated agent accesses its own channels.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Agent handler throws | Task is marked `failed`, error is logged, pipeline continues |
| Agent returns empty results | Adaptive strategy may trigger supplementary tasks |
| Agent times out (> 5 min) | Task progress stalls; future implementation may add timeout detection |

### Error Handling

- Each handler is wrapped in a try/catch that marks the task as `failed` on any unhandled error
- Partial results are preserved — if a handler processes 15/20 leads before failing, those 15 are saved
- The orchestrator task is independent from sub-task failures — it completes successfully as long as the plan is created and dispatched

### Performance Targets

| Metric | Target |
|--------|--------|
| Task dispatch latency | < 500ms |
| Handler execution time | Varies by agent (30s - 10min) |
| Delegation accuracy | 100% (correct agent for each task) |

---

## 4. Progress Monitoring System

### Trigger
Continuous — Atlas monitors all tasks belonging to a campaign throughout the campaign lifecycle.

### Input Schema

```typescript
interface MonitoringInput {
  campaignId: string;
  taskIds: string[];    // IDs of all tasks in the campaign
}
```

### Output Schema

```typescript
interface CampaignProgress {
  campaignId: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  overallProgress: number;  // 0-100
  stageBreakdown: {
    discovery: TaskStatus;
    enrichment: TaskStatus;
    qualification: TaskStatus;
    outreach: TaskStatus;
    reporting: TaskStatus;
  };
  bottlenecks: string[];  // Task IDs that are stalled
}
```

### Method

1. **Task status tracking** — Atlas reads all `AgentTask` records for the campaign and computes aggregate progress:
   ```
   overallProgress = (completedTasks / totalTasks) * 100
   ```

2. **Milestone detection** — Atlas identifies pipeline milestones based on task completion:
   - **Discovery complete**: prospect-discovery task has `status: 'completed'`
   - **Enrichment complete**: data-enrichment task has `status: 'completed'`
   - **Qualification complete**: lead-qualification task has `status: 'completed'`
   - **Outreach complete**: outreach-composer task has `status: 'completed'`
   - **Report complete**: report-generator task has `status: 'completed'`

3. **Bottleneck identification** — Atlas detects stalled tasks:
   ```
   A task is "stalled" if:
     - status === 'running'
     - AND (now - updatedAt) > 5 minutes
     - AND progress has not changed in the last 3 minutes
   ```

4. **Campaign counter updates** — As agents complete work, they update campaign counters directly:
   - `Campaign.leadsFound` — incremented by Scout
   - `Campaign.leadsQualified` — updated by Forge
   - `Campaign.leadsContacted` — updated by Outreach Composer

5. **Real-time UI updates** — The UI polls `GET /api/agents/execute?taskId=...` for task progress, and reads campaign data from the campaigns API.

### LLM Prompts Used
None — progress monitoring is purely computational.

### Agent-Reach Channels Referenced
None.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Task stalled > 5 min | Log warning, consider retry or reassignment |
| Task failed > 2 in campaign | Trigger adaptive strategy assessment |
| All tasks pending | Check if execution engine is running |

### Error Handling

- Database read errors are caught and logged; monitoring continues on next poll cycle
- No monitoring data is cached — always reads fresh from the database

### Performance Targets

| Metric | Target |
|--------|--------|
| Monitoring query latency | < 200ms |
| Bottleneck detection delay | < 30 seconds |
| UI update frequency | Every 2-5 seconds (client-side polling) |

---

## 5. Result Synthesis Pipeline

### Trigger
When all tasks in a campaign have completed (or the user requests intermediate results).

### Input Schema

```typescript
interface SynthesisInput {
  campaignId: string;
  taskResults: Array<{
    taskId: string;
    agentName: string;
    output: Record<string, unknown>;
    channelActivity: ChannelActivityRecord[];
  }>;
}
```

### Output Schema

```typescript
interface CampaignSummary {
  campaignId: string;
  campaignName: string;
  targetIndustry: string;
  targetLocation: string;
  leadsFound: number;
  leadsEnriched: number;
  leadsQualified: number;
  leadsContacted: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  channelsUsed: string[];
  channelSuccessRate: Record<string, number>;
  errors: string[];
  adaptiveActionsTaken: string[];
  duration: string;  // ISO duration
}
```

### Method

1. **Aggregate task outputs** — Read all `AgentTask.output` JSON for the campaign and merge into a single summary object.

2. **Deduplicate leads** — Query all `Lead` records for the campaign and check for duplicates:
   - Normalize company names: lowercase, strip punctuation, remove common suffixes (Inc, LLC, Ltd, GmbH)
   - Match on normalized name + domain (from website URL)
   - Merge duplicate records, keeping the record with more populated fields

3. **Compute channel success rates** — From `ChannelActivityRecord[]` across all tasks:
   ```
   channelSuccessRate[channel] = successful_calls[channel] / total_calls[channel]
   ```

4. **Compute lead tier distribution** — Query lead count grouped by `leadTier`:
   ```sql
   SELECT leadTier, COUNT(*) FROM Lead WHERE campaignId = ? GROUP BY leadTier
   ```

5. **Format campaign summary** — Assemble all computed data into the `CampaignSummary` output schema.

6. **Delegate to Report Generator** — The final formatted summary is passed to the report-generator agent to produce user-facing output.

### LLM Prompts Used
None — synthesis is purely computational and database-driven.

### Agent-Reach Channels Referenced
None directly.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Duplicate leads can't be merged | Keep both, flag as "possible duplicate" |
| Missing tier distribution | Report "N/A" for that metric |
| No task outputs available | Return empty summary with error explanation |

### Error Handling

- Database query errors are caught; partial results are returned with error annotations
- Missing data is reported as null rather than causing a crash

### Performance Targets

| Metric | Target |
|--------|--------|
| Synthesis latency | < 3 seconds |
| Deduplication accuracy | ≥ 95% |
| Summary completeness | ≥ 90% of fields populated |

---

## 6. Adaptive Strategy Engine

### Trigger
Intermediate campaign results deviate from expected targets, or an agent reports a failure condition.

### Input Schema

```typescript
interface AdaptiveInput {
  campaignId: string;
  currentResults: {
    leadsFound: number;
    leadsEnriched: number;
    leadsQualified: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
  };
  expectedTargets: {
    minLeads: number;      // Default: 20
    minEnrichRate: number; // Default: 0.4 (40%)
    minHotRate: number;    // Default: 0.05 (5%)
  };
  channelStatus: Record<string, 'ok' | 'warn' | 'off'>;
  failedTasks: string[];
}
```

### Output Schema

```typescript
interface AdaptiveAction {
  type: 'broaden' | 'narrow' | 'add_channel' | 'retry' | 'skip_stage' | 'escalate';
  description: string;
  newTask?: {
    agentName: string;
    taskType: string;
    input: Record<string, unknown>;
    priority: number;
  };
  modifiedParameters?: Record<string, unknown>;
}
```

### Method

1. **Threshold evaluation** — Compare current results against expected targets:

   ```
   IF leadsFound < minLeads:
     → TRIGGER: Broaden search strategy
   
   IF leadsEnriched / leadsFound < minEnrichRate:
     → TRIGGER: Add more enrichment channels or retry failed enrichments
   
   IF hotLeads / leadsQualified < minHotRate:
     → TRIGGER: Refine ICP criteria or re-qualify with adjusted thresholds
   
   IF failedTasks.length >= 2:
     → TRIGGER: Investigate and retry or reassign
   
   IF channels with 'off' status > 50%:
     → TRIGGER: Reroute to available channels or use LLM fallback
   ```

2. **Broaden search strategy** — Generate supplementary discovery tasks with:
   - Expanded industry terms: "Accounting" → "Accounting OR Audit OR Tax Advisory"
   - Expanded geography: "Dubai" → "Dubai OR Abu Dhabi OR UAE"
   - Additional channels: Add GitHub for tech, add Reddit for niche discussions
   - Relaxed company size: "51-200" → "11-500"

3. **Narrow search strategy** — If too many results (>100 leads), add more specific filters:
   - Add technology stack requirement
   - Narrow company size range
   - Add revenue estimate filter

4. **Re-qualify with adjusted ICP** — Re-dispatch qualification task with modified criteria:
   - Lower minimum lead score for Warm tier (from 50 to 35)
   - Accept smaller company sizes as valid ICP matches
   - Boost reachability score for companies with LinkedIn presence

5. **Escalate to user** — If all adaptive actions are unlikely to help:
   ```json
   {
     "type": "escalate",
     "description": "Campaign produced only 3 leads for 'Quantum Computing in Lagos'. This market may be too niche for automated discovery. Suggest: manual research or broader market definition.",
     "suggestions": [
       "Broaden to 'Technology companies in Nigeria'",
       "Accept current 3 leads and proceed",
       "Cancel campaign"
     ]
   }
   ```

### LLM Prompts Used

For generating broadened search terms:
```
Given the search query "{originalQuery}" which returned only {resultCount} results,
generate 3 alternative search queries that would return more results for the same
target market. Use synonyms, broader categories, and related terms.
Return as JSON array of strings.
```

### Agent-Reach Channels Referenced
None directly — adaptive actions create new tasks that use channels.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| LLM fails to generate broadened queries | Use hardcoded expansion rules (append OR synonyms) |
| Supplementary discovery also returns few results | Escalate to user |
| Re-qualification doesn't improve tier distribution | Accept current distribution and proceed |

### Error Handling

- Adaptive actions are best-effort — failure to generate better queries doesn't fail the campaign
- All adaptive actions are logged for audit trail
- Maximum 3 adaptive actions per campaign before mandatory escalation

### Performance Targets

| Metric | Target |
|--------|--------|
| Adaptive decision latency | < 5 seconds |
| Recovery success rate | ≥ 70% |
| Maximum adaptive iterations | 3 per campaign |

---

## 7. Quality Validation Framework

### Trigger
Before delivering final campaign results to the user or before passing data to the next pipeline stage.

### Input Schema

```typescript
interface ValidationInput {
  leads: Array<{
    id: string;
    companyName: string;
    website: string | null;
    industry: string | null;
    city: string | null;
    country: string | null;
    generalEmail: string | null;
    phoneMain: string | null;
    linkedinUrl: string | null;
    leadScore: number;
    leadTier: string;
  }>;
}
```

### Output Schema

```typescript
interface ValidationResult {
  totalLeads: number;
  validLeads: number;
  flaggedLeads: number;
  rejectedLeads: number;
  averageDataCompleteness: number;
  validationDetails: Array<{
    leadId: string;
    companyName: string;
    status: 'valid' | 'flagged' | 'rejected';
    issues: string[];
    dataCompleteness: number;
  }>;
}
```

### Method

1. **Company name validation** — Reject leads with:
   - Empty or null `companyName`
   - `companyName` length < 3 characters
   - `companyName` matching common noise patterns: "Home", "Click here", "404", "Not Found", "Loading..."

2. **Website URL validation** — Flag leads with:
   - Malformed URLs (don't match `https?://[a-z0-9.-]+`)
   - URLs pointing to social media pages (facebook.com, twitter.com) instead of company websites
   - Null website (not rejected, but flagged for low data completeness)

3. **Contact channel validation** — Ensure at least one contact channel exists:
   - Valid email format (contains @ and domain)
   - Phone number present
   - LinkedIn URL present
   - If none exist, flag as low reachability

4. **Data completeness scoring** — Compute for each lead:
   ```
   dataCompleteness = (
     (hasWebsite ? 15 : 0) +
     (hasIndustry ? 10 : 0) +
     (hasCityAndCountry ? 15 : 0) +
     (hasEmail ? 20 : 0) +
     (hasPhone ? 15 : 0) +
     (hasLinkedIn ? 10 : 0) +
     (hasKeyContact ? 15 : 0)
   )
   ```

5. **Tier validation** — Verify lead tier is consistent with score:
   - Hot leads should have `leadScore >= 80`
   - Warm leads should have `leadScore >= 50`
   - Cold leads should have `leadScore < 50`

6. **Aggregate reporting** — Compute campaign-level statistics:
   - Average data completeness across all leads
   - Percentage of leads with valid contact info
   - Source diversity (how many different channels contributed data)

### LLM Prompts Used
None — validation is rule-based, not LLM-powered.

### Agent-Reach Channels Referenced
None.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Lead has no score | Assign to "unqualified" tier |
| Email format is ambiguous | Flag for human review, don't reject |
| All leads rejected | Return empty list with detailed rejection reasons |

### Error Handling

- Validation never throws — it flags issues rather than crashing
- Individual lead validation failures don't affect other leads
- If the entire validation process fails, return the original data unvalidated with a warning

### Performance Targets

| Metric | Target |
|--------|--------|
| Validation latency | < 1 second per 100 leads |
| False positive rejection rate | < 2% |
| False negative (bad data accepted) rate | < 5% |

---

## 8. Escalation & Clarification

### Trigger
When Atlas encounters ambiguous input, consistently poor results, or resource concerns that require human judgment.

### Input Schema

```typescript
interface EscalationInput {
  campaignId: string;
  reason: string;
  currentResults: Record<string, unknown>;
  suggestions: string[];
}
```

### Output Schema

```typescript
interface EscalationMessage {
  type: 'clarification' | 'approval' | 'warning';
  campaignId: string;
  title: string;
  message: string;
  suggestions: string[];
  options: Array<{
    label: string;
    action: string;  // Description of what will happen if selected
  }>;
}
```

### Method

1. **Detect escalation conditions** — Atlas triggers escalation when:
   - Campaign brief is too vague (no industry or location extracted)
   - Discovery returns < 5 leads after all channels and adaptive actions
   - All Agent-Reach channels are failing (> 80% failure rate)
   - Campaign would require > 50 API calls
   - User's request is outside B2B lead generation scope

2. **Generate clarification message** — Atlas constructs a user-friendly message explaining the issue and offering options:
   ```json
   {
     "type": "clarification",
     "title": "Need more details for your campaign",
     "message": "I'd like to find leads for you, but I need a bit more information. What industry and location are you targeting?",
     "suggestions": [
       "Try: 'Find marketing agencies in London'",
       "Try: 'Discover SaaS companies in San Francisco with 50-200 employees'"
     ],
     "options": [
       { "label": "Specify industry", "action": "Provide the industry you're targeting" },
       { "label": "Specify location", "action": "Provide the geographic area you're targeting" }
     ]
   }
   ```

3. **Approval requests** — For resource-intensive operations:
   ```json
   {
     "type": "approval",
     "title": "Confirm broad search",
     "message": "Your search for 'technology companies' is very broad and may return 500+ results. This will use significant API credits.",
     "options": [
       { "label": "Proceed with broad search", "action": "Run full discovery across all channels" },
       { "label": "Narrow to specific sub-industry", "action": "Add technology sub-category filter" }
     ]
   }
   ```

4. **Warning messages** — For degraded operations:
   ```json
   {
     "type": "warning",
     "title": "Some channels unavailable",
     "message": "LinkedIn and Twitter channels are currently experiencing issues. Results will be based on web search and Reddit only.",
     "options": [
       { "label": "Proceed with available channels", "action": "Continue campaign with reduced coverage" },
       { "label": "Wait for channels to recover", "action": "Pause campaign and retry in 15 minutes" }
     ]
   }
   ```

### LLM Prompts Used

For generating helpful suggestions when the brief is ambiguous:
```
The user's request "{userMessage}" is too vague for lead generation.
Generate 3 specific example queries they could use instead, targeting
different industries and locations. Return as JSON array of strings.
```

### Agent-Reach Channels Referenced
None.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| LLM fails to generate suggestions | Use hardcoded example queries |
| User doesn't respond to escalation | Campaign remains in "pending" state indefinitely |

### Error Handling

- Escalation is always non-blocking — it creates a message for the UI but doesn't fail the task
- If the user selects an option, the AI chat handler processes it as a new campaign brief

### Performance Targets

| Metric | Target |
|--------|--------|
| Escalation generation latency | < 3 seconds |
| Suggestion relevance | ≥ 80% user selection rate |

---

## 9. Campaign State Management

### Trigger
Continuous — Atlas maintains state throughout the entire campaign lifecycle.

### Input Schema
All campaign and task data in the Prisma database.

### Output Schema
State is maintained in the database; no separate output.

### Method

1. **Campaign lifecycle states**:
   ```
   active    → Campaign is running, tasks are being executed
   paused    → User paused the campaign, no new tasks dispatched
   completed → All tasks finished, report generated
   archived  → User archived the campaign, no longer active
   ```

2. **Task lifecycle states**:
   ```
   pending   → Task created, waiting for execution
   running   → Agent handler is executing
   completed → Agent finished successfully
   failed    → Agent encountered an error
   cancelled → Task was cancelled (user or system)
   ```

3. **Lead stage progression**:
   ```
   new → enriched → qualified → contacted → engaged → negotiating → closed_won / closed_lost
                                                                                    ↑
                                                                              nurture ←────┘
   ```

4. **State transitions** — Atlas tracks these state transitions:
   - Campaign `active` → `completed` when all tasks reach terminal state
   - Task `pending` → `running` when execution engine picks it up
   - Task `running` → `completed` when handler returns success
   - Task `running` → `failed` when handler throws or returns error
   - Lead `new` → `enriched` when data-enrichment agent processes it
   - Lead `enriched` → `qualified` when lead-qualification agent scores it

5. **Counter maintenance** — Atlas ensures campaign counters are kept in sync:
   - `leadsFound` — Incremented by Scout when creating lead records
   - `leadsQualified` — Updated by Forge when enrichment completes
   - `leadsContacted` — Updated by Outreach Composer when messages are sent

6. **Audit trail** — Every state change is recorded via:
   - `AgentTask.updatedAt` — Timestamp of last state change
   - `AgentTask.startedAt` / `completedAt` — Timing data
   - `Lead.discoveredAt` / `enrichedAt` / `qualifiedAt` / `contactedAt` — Stage progression timestamps

### LLM Prompts Used
None — state management is purely database operations.

### Agent-Reach Channels Referenced
None.

### Fallback Strategies

| Failure Mode | Fallback |
|-------------|----------|
| Database write fails | Log error, retry once, skip if still failing |
| Counter out of sync | Recompute from actual lead counts on next read |
| Task stuck in `running` | No automatic resolution (future: timeout detection) |

### Error Handling

- All database operations are wrapped in try/catch
- Failed counter updates are logged but don't fail the overall task
- State transitions are idempotent — re-running a task doesn't create duplicate leads

### Performance Targets

| Metric | Target |
|--------|--------|
| State transition latency | < 100ms |
| Counter accuracy | ≥ 99% |
| Audit trail completeness | 100% of state changes recorded |

---

## 10. Execution Engine Integration

### Runtime Handler

**Function**: `executeOrchestrator(ctx: AgentExecutionContext): Promise<AgentExecutionResult>`

**File**: `src/lib/agent-executor.ts`

**Location in code**: Lines 296-404

### Execution Flow

```
1. Receive AgentExecutionContext
   ├─ taskId: string
   ├─ agentName: "orchestrator"
   ├─ taskType: "campaign-plan"
   ├─ campaignId: string | null
   ├─ input: Record<string, unknown>
   └─ priority: number

2. Update task progress to 20% (running)
   └─ await updateTaskProgress(ctx.taskId, 20, 'running')

3. Call LLM with planningPrompt
   └─ plan = await callLLMForJSON(planningPrompt, JSON.stringify(input), defaultValue)

4. Update task progress to 60% (running)
   └─ await updateTaskProgress(ctx.taskId, 60, 'running')

5. Create Campaign record (if no campaignId)
   └─ campaign = await db.campaign.create({ data: { name, targetIndustry, targetLocation, status: 'active' } })

6. Create AgentTask records for each step
   └─ for each step: await db.agentTask.create({ data: { campaignId, agentName, taskType, status: 'pending', priority, input } })

7. Update task progress to 100% (completed)
   └─ await updateTaskProgress(ctx.taskId, 100, 'completed', { plan, campaignId, createdTasks, totalSubTasks })

8. Return AgentExecutionResult
   └─ { success: true, output: { plan, campaignId, createdTasks }, channelActivity: [] }
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
  "agentName": "orchestrator",
  "taskType": "campaign-plan",
  "input": {
    "query": "Find accounting firms in Dubai",
    "industry": "Accounting",
    "location": "Dubai, UAE"
  },
  "campaignId": null,
  "priority": 10
}
```

**Via AI Chat:**
```http
POST /api/ai
Content-Type: application/json

{ "message": "Find accounting firms in Dubai" }
```

The AI chat handler parses the intent, identifies this as a lead generation request, and dispatches to the orchestrator with the appropriate input.

**Response:**
```json
{
  "success": true,
  "output": {
    "plan": {
      "campaignName": "Accounting Firms — Dubai, UAE",
      "targetIndustry": "Accounting",
      "targetLocation": "Dubai, UAE",
      "steps": [...]
    },
    "campaignId": "clx...",
    "createdTasks": [
      { "id": "clx1...", "agent": "prospect-discovery", "taskType": "search" },
      { "id": "clx2...", "agent": "data-enrichment", "taskType": "enrich" },
      { "id": "clx3...", "agent": "lead-qualification", "taskType": "qualify" },
      { "id": "clx4...", "agent": "outreach-composer", "taskType": "outreach" },
      { "id": "clx5...", "agent": "report-generator", "taskType": "report" }
    ]
  },
  "channelActivity": []
}
```

### Agent-Reach Bridge Functions Used

**None.** Atlas does not directly call any Agent-Reach bridge functions. All channel access is delegated to specialized agents.

### Database Models Used

| Model | Operations |
|-------|-----------|
| `Campaign` | CREATE (new campaign), UPDATE (counter increments) |
| `AgentTask` | CREATE (sub-tasks), READ (progress monitoring), UPDATE (status/progress) |
| `Lead` | READ (for validation/synthesis, written by other agents) |

### Key Dependencies

```typescript
import { db } from './db';
import { callLLM, callLLMForJSON } from './agent-executor';  // LLM utilities
import { updateTaskProgress } from './agent-executor';        // Progress tracking
import type { AgentName } from './types';                     // Type definitions
```

### LLM Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `temperature` | 0.3 | Low randomness for structured plan generation |
| `max_tokens` | 4000 | Sufficient for detailed execution plans |
| `retries` | 1 (callLLM), 2 (callLLMForJSON) | Balance reliability vs. latency |

### Performance Targets

| Metric | Target |
|--------|--------|
| Total orchestrator execution time | < 15 seconds |
| LLM plan generation | < 10 seconds |
| Database task creation | < 5 seconds (for 5 tasks) |
| End-to-end campaign launch | < 20 seconds from brief to first sub-task dispatched |
