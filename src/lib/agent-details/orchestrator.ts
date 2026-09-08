import type { AgentDetailFull } from './types';

export const orchestratorDetail: AgentDetailFull = {
  slug: 'orchestrator',
  name: 'orchestrator',
  displayName: 'Orchestrator (Atlas)',
  tagline: 'The strategic brain that coordinates all 8 AI agents',
  description: 'Coordinates all agents and manages workflow execution',
  longDescription:
    'The Orchestrator — codenamed Atlas — is the central intelligence of the LeadReach AI platform. It sits at the apex of the 8-agent pipeline and is responsible for receiving user intent (ICP definitions, campaign queries, prospect research requests), decomposing them into actionable task plans, delegating tasks to specialized agents, monitoring execution in real time, handling errors and retries, and ensuring seamless collaboration across the entire lead generation lifecycle. Atlas uses a state machine to track each task through its lifecycle (pending → assigned → running → completed/failed), with built-in priority queuing, capacity management (ensuring no agent is overloaded), and intelligent retry logic that adjusts strategy based on failure patterns.',
  color: '#8B5CF6',
  iconName: 'Brain',
  department: 'Executive',
  pipelineRole: 'Strategic coordination and task delegation',
  pipelinePosition: 1,

  capabilities: [
    {
      name: 'Intent Analysis & Plan Synthesis',
      description:
        'Parses natural-language user queries to determine the required pipeline type (discovery, enrichment, research, outreach) and creates an execution plan with task dependencies expressed as a DAG.',
      metric: '< 2s analysis time',
      details: [
        'Classifies the request into one of 6 pipeline archetypes (full-cycle, discovery-only, enrichment-only, research-only, outreach-only, audit-only).',
        'Resolves entity references (e.g. "the same ICP as last week") against the conversation memory and prior campaign IDs.',
        'Builds a directed acyclic graph of tasks with explicit dependency edges (e.g. enrichment cannot start until discovery completes).',
        'Estimates total wall-clock time and token cost upfront and surfaces both to the user for sign-off when the estimate exceeds the campaign budget.',
      ],
    },
    {
      name: 'Task Delegation & Dispatch',
      description:
        'Assigns tasks to the appropriate specialized agent based on task type, agent capacity, and priority. Maintains a per-agent priority queue with strict ACK semantics.',
      metric: 'O(1) dispatch latency',
      details: [
        'Routes by task_type → agent_capability mapping table (e.g. search → prospect-discovery, score → lead-qualification).',
        'Checks each candidate agent\'s maxConcurrentTasks setting and current in-flight count before assignment.',
        'Issues a dispatch envelope {task_id, priority, deadline, parent_task_id, trace_id} via the internal message bus.',
        'Requires an ACK within 500 ms; if no ACK, the dispatcher falls over to the next-best agent or queues the task.',
      ],
    },
    {
      name: 'Real-Time Progress Monitoring',
      description:
        'Tracks real-time progress of all in-flight tasks. Streams live updates to the Agentic Pipeline Workspace via Server-Sent Events.',
      metric: 'Real-time SSE updates',
      details: [
        'Maintains an in-memory task graph (DAG) with current state per node: pending, assigned, running, completed, failed, cancelled.',
        'Emits structured SSE events: task.started, task.progress, task.completed, task.failed, task.escalated.',
        'Aggregates per-campaign progress (X of Y tasks complete, ETA, current bottleneck) every 5 seconds.',
        'Subscribes the UI to a per-campaign SSE channel for sub-second visual updates.',
      ],
    },
    {
      name: 'Error Recovery & Retry Strategy',
      description:
        'When a task fails, Atlas evaluates the failure type (transient vs permanent) and decides whether to retry, reroute to a backup agent, or escalate to the user.',
      metric: '3-tier retry strategy',
      details: [
        'Tier 1 — transient (network blip, 429 rate limit): exponential backoff with jitter, max 3 retries, base 1.5s.',
        'Tier 2 — partial (LLM returned malformed JSON, enrichment found 12 of 25 fields): retry with patched prompt + temperature reduction.',
        'Tier 3 — permanent (ICP unmatched, agent capability gap): mark task failed, emit task.escalated, surface to user with recommended next action.',
        'Records every retry attempt in the audit log with failure category, retry count, and final disposition.',
      ],
    },
    {
      name: 'Workflow Optimization',
      description:
        'Analyzes pipeline execution patterns to identify bottlenecks, optimize task ordering, and recommend ICP or channel adjustments based on historical performance.',
      metric: 'Continuous learning',
      details: [
        'Runs a nightly batch job that computes per-stage mean duration and identifies slow outliers.',
        'Suggests ICP relaxations (e.g. "loosen employee_count range from 50-200 to 25-300 to widen top-of-funnel by 38%").',
        'Identifies channel under-performance and proposes reallocation (e.g. drop Reddit, redirect capacity to LinkedIn).',
        'Updates a learned policy table consulted at dispatch time to bias toward higher-yield agent orderings.',
      ],
    },
    {
      name: 'Capacity Management',
      description:
        'Monitors each agent\'s task queue depth and maxConcurrentTasks setting. Prevents overload by queueing tasks when an agent is at capacity.',
      metric: 'Zero overflow events',
      details: [
        'Tracks each agent\'s in-flight count and queue depth in a per-agent state object.',
        'If in-flight ≥ maxConcurrentTasks, new tasks are queued with FIFO + priority ordering (priority tasks jump the queue).',
        'Emits a capacity.warning event when an agent\'s queue depth exceeds 80% of its soft cap (10 tasks).',
        'Auto-scales horizontal replicas of stateless agents (e.g. prospect-discovery) when sustained queue depth > 5 for > 60s.',
      ],
    },
    {
      name: 'Cross-Department Event Routing',
      description:
        'Routes strategic events across department partitions (Executive, Growth, Technology, Operations) so that downstream departments react to upstream changes in real time.',
      metric: 'Cross-dept event bus',
      details: [
        'Subscribes to a partitioned event bus with 4 partitions (exec, growth, tech, ops).',
        'Translates growth signals (e.g. "MQL velocity up 22%") into exec directives (e.g. "raise prospect-discovery concurrency to 8").',
        'Bridges tech signals (e.g. "GLM API p99 latency 8.2s") into growth throttling directives.',
        'Maintains an event ring buffer (40,000 capacity) for replayable debugging.',
      ],
    },
    {
      name: 'Risk Estimation & Directive Vetting',
      description:
        'Estimates the risk of directives before issuing them — probability of failure, blast radius, downstream impact — and surfaces high-risk directives for human review.',
      metric: 'Pre-flight risk scoring',
      details: [
        'Computes a risk score per directive using 6 factors: scope, reversibility, dependency count, blast radius, historical failure rate, time pressure.',
        'Any directive with risk_score > 0.7 is held for human approval (policy: "ask before act").',
        'Any directive with risk_score 0.4–0.7 is logged with rationale; execution proceeds with elevated monitoring.',
        'Publishes a daily risk register to the Executive workspace.',
      ],
    },
    {
      name: 'Checkpointing & Resume',
      description:
        'Snapshots the pipeline state every 30 seconds so that any crash can be resumed from the last consistent checkpoint without re-running completed tasks.',
      metric: '30s checkpoint interval',
      details: [
        'Persists the task DAG, in-flight task states, and per-agent queues to a Postgres table every 30s.',
        'On cold start, loads the latest checkpoint and resumes any task marked "running" by re-issuing it (idempotent).',
        'Provides a /api/orchestrator/replay endpoint to step through historical pipeline runs for debugging.',
      ],
    },
    {
      name: 'Audit Logging & Explainability',
      description:
        'Records every dispatch, retry, escalation, and directive with full rationale so that any pipeline outcome can be reconstructed and explained.',
      metric: '100% auditable',
      details: [
        'Each log entry: timestamp, agent, task_id, action, rationale, prior_state, new_state, trace_id.',
        'Logs are queryable in the /admin/agents console and exportable as JSON for compliance review.',
        'Provides an "explain this outcome" endpoint that reconstructs the decision chain for any lead or campaign.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Intent Parsing',
      inputs: ['User query (natural language)', 'ICP definition', 'Campaign settings', 'Conversation history'],
      outputs: ['Execution plan (DAG)', 'Task list', 'Agent assignments', 'Estimated cost & ETA'],
      duration: '1–3 seconds',
      substeps: [
        'Tokenize and classify the user query against 6 pipeline archetypes.',
        'Resolve entity references (campaign IDs, prior ICP definitions) from conversation memory.',
        'Build the task DAG with explicit dependency edges.',
        'Estimate per-task token cost and sum into a campaign-level budget estimate.',
        'If estimate exceeds the configured budget threshold, return a confirmation prompt to the user.',
        'On confirmation (or auto-approve for low-cost plans), commit the DAG to the task store.',
      ],
      errorHandling: 'On parse failure, fall back to a heuristic classifier; if that also fails, surface a clarification question to the user.',
      retryStrategy: 'No retry — parse is deterministic and idempotent.',
    },
    {
      stage: 'Task Dispatch',
      inputs: ['Execution plan DAG', 'Agent availability', 'Priority weights'],
      outputs: ['Dispatched tasks with ACKs', 'Queued tasks', 'Failed dispatches'],
      duration: '< 1 second per task',
      substeps: [
        'Walk the DAG in topological order; for each ready task, find a capable agent.',
        'Check the agent\'s current in-flight count vs maxConcurrentTasks.',
        'If capacity available: issue dispatch envelope via message bus and wait for ACK (500ms).',
        'If capacity exhausted: enqueue task with priority into the agent\'s queue.',
        'If no capable agent available: mark task as "blocked: no agent" and emit task.escalated.',
      ],
      errorHandling: 'ACK timeout triggers fallback to next-best agent or queue.',
      retryStrategy: 'Up to 2 dispatch attempts with 200ms backoff before escalation.',
    },
    {
      stage: 'Progress Monitoring',
      inputs: ['Task status updates', 'Agent events', 'Capacity metrics'],
      outputs: ['SSE events to UI', 'Progress percentages', 'ETA updates', 'Bottleneck alerts'],
      duration: 'Continuous (every 5s aggregate, sub-second SSE)',
      substeps: [
        'Subscribe to task.* events from all agents.',
        'Update the in-memory task DAG with new states.',
        'Every 5 seconds, compute per-campaign aggregate progress and ETA.',
        'Stream SSE events to all subscribed UI clients on the campaign channel.',
        'Detect stalls (no progress for > 2x expected duration) and emit task.stalled.',
      ],
      errorHandling: 'Lost SSE connection: client auto-reconnects with Last-Event-ID header for replay.',
      retryStrategy: 'SSE auto-reconnect with exponential backoff capped at 30s.',
    },
    {
      stage: 'Completion Handling',
      inputs: ['Task outputs', 'Error reports', 'Partial success signals'],
      outputs: ['Aggregated results', 'Pipeline summary', 'Next-stage triggers'],
      duration: '< 5 seconds',
      substeps: [
        'Collect task output payload from the completing agent.',
        'Validate output against the task\'s expected schema; reject and retry on schema violation.',
        'Push output to the next task(s) in the DAG that depend on this one.',
        'When all tasks in the DAG are complete (or terminated), emit pipeline.completed.',
        'Generate a pipeline summary: tasks completed, failed, retried; total tokens; total wall-clock; cost.',
      ],
      errorHandling: 'Partial outputs accepted if the task is marked "best-effort"; full outputs required for "strict" tasks.',
      retryStrategy: 'Schema validation failures trigger up to 2 retries with patched prompt.',
    },
    {
      stage: 'Error Recovery',
      inputs: ['Failure event', 'Task metadata', 'Failure category', 'Retry history'],
      outputs: ['Retry decision', 'Reroute decision', 'Escalation to user'],
      duration: '< 1 second decision, then variable retry duration',
      substeps: [
        'Classify the failure: transient, partial, permanent.',
        'For transient: schedule exponential-backoff retry with jitter.',
        'For partial: retry with patched prompt + temperature reduction.',
        'For permanent: mark task failed, emit task.escalated, surface to user.',
        'Update the task DAG with the failure and recovery state.',
      ],
      errorHandling: 'If retry budget exhausted (3 attempts), auto-escalate to permanent failure.',
      retryStrategy: '3-tier: transient (3x backoff), partial (2x patched), permanent (escalate).',
    },
    {
      stage: 'Checkpoint & Persist',
      inputs: ['Current task DAG state', 'Per-agent queues', 'In-flight task states'],
      outputs: ['Checkpoint record in Postgres', 'Audit log entries'],
      duration: '< 200 ms',
      substeps: [
        'Snapshot the task DAG, queues, and in-flight states to a JSON blob.',
        'Write the blob to the orchestrator_checkpoints table with a monotonic sequence number.',
        'Append all audit log entries accumulated since the last checkpoint to the audit_logs table.',
        'Notify the standby orchestrator replica that a new checkpoint is available.',
      ],
      errorHandling: 'Checkpoint write failure triggers an alert; pipeline continues but recovery may lose up to 30s of work.',
      retryStrategy: 'No retry — checkpoint failures are surfaced as SEV-2 alerts.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Orchestration SOP: Task Lifecycle Management',
      category: 'SOP',
      summary:
        'Defines the complete task lifecycle from creation to completion, including priority queue management, capacity checks, and ACK tracking.',
      sections: 14,
      owner: 'Platform Engineering',
      lastReviewed: '2026-08-12',
      version: '3.4.1',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what "task lifecycle" means in the LeadReach orchestrator context and which agents are bound by it.' },
        { title: '2. Task States', description: 'The 7 canonical task states: pending, assigned, running, completed, failed, cancelled, escalated.' },
        { title: '3. State Transition Rules', description: 'Which transitions are legal and which require human approval (e.g. failed → running requires a retry budget).' },
        { title: '4. Priority Queue Discipline', description: 'How priority is computed (campaign_priority × task_urgency × lead_value) and how it interacts with FIFO ordering.' },
        { title: '5. Capacity Checking', description: 'How in-flight counts are tracked per agent and how maxConcurrentTasks is enforced.' },
        { title: '6. ACK Protocol', description: 'The 500 ms ACK window, what happens on timeout, and how standby agents are notified.' },
        { title: '7. DAG Construction', description: 'How execution plans are converted to DAGs, including parallel-where-possible and serial-only-when-required.' },
        { title: '8. Dispatch Envelope', description: 'The exact JSON schema of a dispatch envelope (task_id, priority, deadline, parent_task_id, trace_id).' },
        { title: '9. Checkpoint Cadence', description: 'The 30-second checkpoint cadence and how to force a checkpoint before maintenance windows.' },
        { title: '10. Replay Procedure', description: 'How to use the /api/orchestrator/replay endpoint for post-incident debugging.' },
        { title: '11. Cancellation Handling', description: 'How cancellation requests propagate through the DAG and how partial cleanup is performed.' },
        { title: '12. Audit Logging Requirements', description: 'Which events must be logged and the minimum field set for each log entry.' },
        { title: '13. Compliance Hooks', description: 'How the SOP integrates with SOC2 audit requirements and GDPR right-to-erasure requests.' },
        { title: '14. Revision History', description: 'Change log of the SOP across versions, including rationale for major changes.' },
      ],
    },
    {
      title: 'Agent Failure & Reroute Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for handling agent failures, including backup agent selection, task rerouting, and recovery attempts.',
      sections: 12,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-01',
      version: '2.1.0',
      sectionList: [
        { title: '1. Failure Detection Signals', description: 'The 5 signals: heartbeat loss, ACK timeout, repeated transient failures, schema violations, slow tasks (>3x p99).' },
        { title: '2. Triage Decision Tree', description: 'How to classify the failure into transient / partial / permanent within 30 seconds.' },
        { title: '3. Backup Agent Selection', description: 'How to identify the next-best agent for a given task_type using the capability matrix.' },
        { title: '4. Reroute Procedure', description: 'Step-by-step reroute: cancel in-flight, re-issue to backup, notify downstream dependents.' },
        { title: '5. Retry Budget Enforcement', description: 'How to enforce the per-task retry budget (3 transient, 2 partial, 0 permanent).' },
        { title: '6. User Escalation Criteria', description: 'When to surface the failure to the user vs. handle silently.' },
        { title: '7. Comms Templates', description: 'Pre-written user-facing comms for common failure scenarios.' },
        { title: '8. SEV-1 / SEV-2 / SEV-3 Classification', description: 'How to classify incidents and which on-call rotation gets paged.' },
        { title: '9. Post-Incident Review Template', description: 'The 5-whys template used for any SEV-1 or SEV-2 incident.' },
        { title: '10. Recovery Validation', description: 'How to confirm the system has returned to steady-state after a failure.' },
        { title: '11. Known Failure Patterns Catalog', description: 'A living catalog of past failures with their root causes and remediations.' },
        { title: '12. Drill Schedule', description: 'Quarterly chaos engineering drills that exercise this runbook end-to-end.' },
      ],
    },
    {
      title: 'Multi-Agent Coordination Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for coordinating work across multiple agents, including routing patterns, conflict resolution, and dependency management.',
      sections: 13,
      owner: 'Agent Architecture',
      lastReviewed: '2026-08-22',
      version: '4.0.0',
      sectionList: [
        { title: '1. Coordination Patterns Catalog', description: 'The 7 coordination patterns: pipeline, fan-out, fan-in, scatter-gather, broker, mediator, peer-to-peer.' },
        { title: '2. When to Use Each Pattern', description: 'Decision matrix mapping use cases to patterns (e.g. enrichment = fan-out, scoring = pipeline).' },
        { title: '3. Conflict Resolution', description: 'How to resolve conflicts when two agents produce contradictory outputs (e.g. two different revenue estimates).' },
        { title: '4. Dependency Declaration Syntax', description: 'How agents declare their input requirements and output contracts.' },
        { title: '5. Deadlock Prevention', description: 'How the orchestrator detects and breaks dependency cycles in the DAG.' },
        { title: '6. Backpressure & Flow Control', description: 'How to slow upstream agents when downstream agents are saturated.' },
        { title: '7. Cancellation Propagation', description: 'How cancellation requests flow through the DAG, including partial cancellation.' },
        { title: '8. Idempotency Requirements', description: 'Why every task must be idempotent and how the orchestrator enforces it.' },
        { title: '9. Ordering Guarantees', description: 'Which ordering guarantees the orchestrator provides (per-task) vs. does not (cross-task).' },
        { title: '10. Observability Hooks', description: 'The 6 mandatory observability hooks every agent must implement.' },
        { title: '11. Versioning & Compatibility', description: 'How to roll out a new agent version without breaking the pipeline.' },
        { title: '12. Capacity Planning', description: 'How to project capacity needs based on forecasted campaign volume.' },
        { title: '13. Anti-Patterns', description: 'Common coordination anti-patterns to avoid (e.g. synchronous chains, hidden coupling).' },
      ],
    },
    {
      title: 'Event Ring & Task Graph Reference',
      category: 'Reference',
      summary:
        'Canonical specification for the event ring (40,000-capacity circular buffer) and task graph (DAG) data structures.',
      sections: 14,
      owner: 'Platform Engineering',
      lastReviewed: '2026-08-30',
      version: '1.7.2',
      sectionList: [
        { title: '1. Event Ring Buffer Layout', description: 'Memory layout of the 40,000-entry circular buffer, including head/tail pointer semantics.' },
        { title: '2. Event Schema', description: 'The canonical event schema: id, type, source, target, payload, timestamp, trace_id.' },
        { title: '3. Backpressure Behavior', description: 'What happens when the ring is full: drop oldest, drop newest, or block publisher.' },
        { title: '4. Replay Semantics', description: 'How to replay events from a given offset, including idempotency considerations.' },
        { title: '5. Task Graph Storage', description: 'How the DAG is persisted in Postgres (nodes table, edges table, state column).' },
        { title: '6. DAG Mutation API', description: 'The internal API for adding/removing nodes and edges, including validation rules.' },
        { title: '7. Topological Sort Algorithm', description: 'The Kahn algorithm used to walk the DAG, with O(V+E) complexity.' },
        { title: '8. Cycle Detection', description: 'How the orchestrator detects cycles at insertion time and rejects them.' },
        { title: '9. Checkpoint Serialization', description: 'How the DAG is serialized to JSON for checkpointing, including version compatibility.' },
        { title: '10. Concurrent Access Rules', description: 'Which operations require locks and which are lock-free.' },
        { title: '11. Retention Policy', description: 'How long completed DAGs are retained (90 days) before archival.' },
        { title: '12. Query API', description: 'The /api/orchestrator/dag endpoint and its filter parameters.' },
        { title: '13. Schema Migration Procedure', description: 'How to evolve the DAG schema without downtime.' },
        { title: '14. Performance Benchmarks', description: 'Latest benchmarks: 50k nodes / 200k edges loaded in 1.2s.' },
      ],
    },
    {
      title: 'Orchestrator Onboarding & Training',
      category: 'Training',
      summary:
        'Complete onboarding guide for the Orchestrator agent, covering authority boundaries, decision framework, and operating cadence.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-15',
      version: '2.3.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'A welcome message framing the orchestrator\'s mission as "maximize qualified leads delivered per dollar spent".' },
        { title: '2. Authority Boundaries', description: 'What the orchestrator can decide alone vs. what requires human approval.' },
        { title: '3. Decision Framework', description: 'The 4-quadrant decision framework: urgency × impact.' },
        { title: '4. Operating Cadence', description: 'Daily, hourly, per-task cadence of orchestrator activities.' },
        { title: '5. Communication Style', description: 'How the orchestrator writes user-facing messages: terse, evidence-backed, action-oriented.' },
        { title: '6. Failure Mode Walkthroughs', description: 'Step-by-step walkthroughs of 5 representative failure scenarios.' },
        { title: '7. Escalation Ladder', description: 'When to escalate to a human operator and how to package the context.' },
        { title: '8. Tooling Familiarization', description: 'Hands-on exercises with the dispatcher, queue, checkpoint, and audit subsystems.' },
        { title: '9. Shadow Shifts', description: 'A 2-day shadow program where new orchestrator instances observe a senior instance.' },
        { title: '10. Certification Exam', description: 'A 25-question exam covering DAG construction, retry strategy, and escalation criteria.' },
        { title: '11. Probation Period', description: 'The 14-day probation period during which all decisions are co-signed by a senior orchestrator.' },
        { title: '12. Continuing Education', description: 'Monthly brown-bag sessions on new failure patterns and policy updates.' },
        { title: '13. Performance Review', description: 'Quarterly performance review covering 12 KPIs.' },
        { title: '14. Decommissioning Procedure', description: 'How an orchestrator instance is gracefully retired and its state migrated.' },
      ],
    },
    {
      title: 'Strategic Directives Playbook (PROMETHEUS Integration)',
      category: 'Playbook',
      summary:
        'How Atlas receives, validates, and executes strategic directives from the PROMETHEUS executive agent — including override semantics and conflict resolution.',
      sections: 8,
      owner: 'Executive Office',
      lastReviewed: '2026-08-25',
      version: '1.2.0',
      sectionList: [
        { title: '1. Directive Ingestion', description: 'How directives arrive via the exec event partition and are validated against the directive schema.' },
        { title: '2. Risk Scoring', description: 'The 6-factor risk model used to score directives before execution.' },
        { title: '3. Override Semantics', description: 'When a directive can override an in-flight task and when it must wait.' },
        { title: '4. Conflict Resolution', description: 'How simultaneous conflicting directives are resolved (latest-wins vs. priority-wins).' },
        { title: '5. Audit Trail', description: 'The mandatory audit fields captured for every directive execution.' },
        { title: '6. Rollback Procedure', description: 'How to roll back a directive that has been executed but is later deemed incorrect.' },
        { title: '7. Human Approval Workflow', description: 'The 4-eyes approval workflow for high-risk directives.' },
        { title: '8. Directive Catalog', description: 'A catalog of all known directive types with examples and expected outcomes.' },
      ],
    },
  ],

  tools: [
    {
      name: 'mcp://sys-finance-ledger',
      type: 'MCP Server',
      description:
        'Reads financial state (cash position, burn rate, runway) for strategic decisions. Used to gate spend-heavy campaigns when runway drops below 9 months.',
      status: 'connected',
      endpoint: 'mcp://sys-finance-ledger',
      authMethod: 'mTLS service account',
      rateLimit: '60 reads/min',
      config: [
        { key: 'cacheTtl', value: '60s' },
        { key: 'timeout', value: '5s' },
        { key: 'retryBudget', value: '2' },
      ],
      schemaExample:
        '{"method":"get_cash_position"} → {"cash":1240000,"burn_rate":92000,"runway_months":13.5,"as_of":"2026-09-08"}',
      failureMode: 'Returns stale cache if upstream ledger is unreachable for > 5s.',
    },
    {
      name: 'mcp://sys-growth-velocity',
      type: 'MCP Server',
      description:
        'Reads growth metrics (pipeline value, lead velocity, conversion rates). Powers the workflow optimization capability.',
      status: 'connected',
      endpoint: 'mcp://sys-growth-velocity',
      authMethod: 'mTLS service account',
      rateLimit: '120 reads/min',
      config: [
        { key: 'cacheTtl', value: '30s' },
        { key: 'timeout', value: '3s' },
      ],
      schemaExample:
        '{"method":"get_velocity","window":"7d"} → {"leads_per_day":42,"velocity_trend":"+18%","hot_lead_share":0.22}',
      failureMode: 'Falls back to last good value with a stale=true flag.',
    },
    {
      name: 'mcp://sys-tech-telemetry',
      type: 'MCP Server',
      description:
        'Reads technology health (service status, error rates, latency p50/p95/p99). Triggers cross-dept throttling when tech signals degrade.',
      status: 'connected',
      endpoint: 'mcp://sys-tech-telemetry',
      authMethod: 'mTLS service account',
      rateLimit: '300 reads/min',
      config: [
        { key: 'cacheTtl', value: '15s' },
        { key: 'timeout', value: '2s' },
      ],
      schemaExample:
        '{"method":"get_health","service":"prospect-discovery"} → {"status":"healthy","p99_latency_ms":1820,"error_rate":0.012}',
      failureMode: 'Returns degraded status if no metrics in last 60s.',
    },
    {
      name: 'priority_rebalancer',
      type: 'Internal',
      description:
        'Dynamically adjusts priority weights across agents based on strategic directives. Recomputes weights every 30s.',
      status: 'connected',
      endpoint: 'internal://priority_rebalancer',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'recompute_interval', value: '30s' },
        { key: 'min_weight', value: '0.1' },
        { key: 'max_weight', value: '2.0' },
      ],
      schemaExample:
        'INPUT: {"directive":"prioritize_enterprise"} → OUTPUT: {"weights":{"prospect-discovery":1.4,"lead-qualification":1.6,"outreach-composer":1.2}}',
      failureMode: 'Falls back to uniform weights on compute error.',
    },
    {
      name: 'cross_dept_router',
      type: 'Internal',
      description:
        'Routes events across department partitions (Executive, Growth, Technology, Operations). Provides partition isolation with cross-partition bridge semantics.',
      status: 'connected',
      endpoint: 'internal://cross_dept_router',
      authMethod: 'in-process',
      rateLimit: '10000 events/s',
      config: [
        { key: 'partitions', value: '4' },
        { key: 'buffer_capacity', value: '40000' },
        { key: 'overflow_policy', value: 'drop_oldest' },
      ],
      schemaExample:
        'INPUT: {"event":"growth.mql_surge","payload":{"delta":0.22}} → FORWARDS TO: exec.partition, ops.partition',
      failureMode: 'Logs and drops event if buffer is full; SEV-2 alert triggered.',
    },
    {
      name: 'risk_calculator',
      type: 'Internal',
      description:
        'Estimates the risk of directives (probability of failure, blast radius, downstream impact) using a 6-factor model.',
      status: 'connected',
      endpoint: 'internal://risk_calculator',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'factors', value: 'scope,reversibility,dependency_count,blast_radius,historical_failure_rate,time_pressure' },
        { key: 'high_risk_threshold', value: '0.7' },
        { key: 'medium_risk_threshold', value: '0.4' },
      ],
      schemaExample:
        'INPUT: {"directive":"pause_outreach","scope":"campaign","reversibility":0.9} → OUTPUT: {"risk_score":0.32,"classification":"medium","recommended_action":"proceed_with_monitoring"}',
      failureMode: 'Returns risk_score=0.5 (medium) on compute error; logs warning.',
    },
    {
      name: 'checkpoint_persister',
      type: 'Internal',
      description:
        'Snapshots the orchestrator state to Postgres every 30 seconds. Critical for crash recovery and replay.',
      status: 'connected',
      endpoint: 'internal://checkpoint_persister',
      authMethod: 'in-process',
      rateLimit: '1 write / 30s',
      config: [
        { key: 'interval', value: '30s' },
        { key: 'target_table', value: 'orchestrator_checkpoints' },
        { key: 'retention', value: '90d' },
      ],
      schemaExample:
        'WRITES: {"seq":48213,"dag":{"nodes":[...],"edges":[...]},"in_flight":{"prospect-discovery":[...]},"ts":"2026-09-08T14:23:00Z"}',
      failureMode: 'Logs SEV-2 alert; orchestrator continues but recovery may lose up to 30s of work.',
    },
    {
      name: 'audit_logger',
      type: 'Internal',
      description:
        'Appends every dispatch, retry, escalation, and directive to the audit_logs table for compliance and explainability.',
      status: 'connected',
      endpoint: 'internal://audit_logger',
      authMethod: 'in-process',
      rateLimit: '500 writes/s',
      config: [
        { key: 'target_table', value: 'audit_logs' },
        { key: 'retention', value: '7y (SOC2)' },
        { key: 'required_fields', value: 'ts,agent,task_id,action,rationale,prior_state,new_state,trace_id' },
      ],
      schemaExample:
        'INSERT: {"ts":"2026-09-08T14:23:01Z","agent":"orchestrator","task_id":"t_8842","action":"dispatch","rationale":"capacity_available","prior_state":"pending","new_state":"assigned","trace_id":"tr_4f2a"}',
      failureMode: 'Buffered write fails over to async flush; no events are lost.',
    },
  ],

  metrics: [
    {
      label: 'Task Dispatch Latency',
      value: '< 1',
      unit: 'second',
      benchmark: 'Target: < 5s',
      trend30d: 'stable',
      description: 'Time from task ready to dispatch ACK received. Lower is better.',
    },
    {
      label: 'ACK Tracking Rate',
      value: '99.2',
      unit: '%',
      benchmark: 'Target: > 99%',
      trend30d: '+0.3%',
      description: 'Percentage of dispatched tasks that receive an ACK within the 500ms window.',
    },
    {
      label: 'Error Recovery Rate',
      value: '94',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+1.2%',
      description: 'Percentage of failed tasks successfully recovered via the 3-tier retry strategy.',
    },
    {
      label: 'Concurrent Tasks Managed',
      value: '50',
      unit: 'tasks',
      benchmark: 'Max: 100',
      trend30d: '+8 tasks',
      description: 'Average number of in-flight tasks under management at any given moment.',
    },
    {
      label: 'Pipeline Throughput',
      value: '8.5',
      unit: 'tasks/min',
      benchmark: 'Baseline: 5/min',
      trend30d: '+0.7/min',
      description: 'Average tasks completed per minute across all agents.',
    },
    {
      label: 'Checkpoint Success Rate',
      value: '99.98',
      unit: '%',
      benchmark: 'Target: > 99.9%',
      trend30d: 'stable',
      description: 'Percentage of 30-second checkpoints that complete without error.',
    },
    {
      label: 'Directive Risk Score (avg)',
      value: '0.31',
      unit: 'score',
      benchmark: 'Threshold: 0.4 medium, 0.7 high',
      trend30d: '-0.02',
      description: 'Average risk score of all directives issued in the last 30 days.',
    },
    {
      label: 'Audit Log Completeness',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of dispatched tasks with a complete audit trail (all 8 required fields populated).',
    },
    {
      label: 'Crash Recovery Time',
      value: '4.2',
      unit: 'seconds',
      benchmark: 'Target: < 10s',
      trend30d: '-0.8s',
      description: 'Time from orchestrator cold start to fully resumed state from latest checkpoint.',
    },
    {
      label: 'Cross-Dept Event Bus Throughput',
      value: '3,200',
      unit: 'events/s',
      benchmark: 'Max: 10,000/s',
      trend30d: '+400/s',
      description: 'Sustained event throughput across the 4-partition cross-dept event bus.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.3,
    maxTokens: 8192,
    scheduleType: 'always_on',
    maxConcurrentTasks: 10,
    priority: 'critical',
    reasoningEffort: 'high',
    topP: 0.95,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: ['</response>'],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"plan":{"type":"object","properties":{"tasks":{"type":"array","items":{"type":"object","properties":{"id":{"type":"string"},"agent":{"type":"string"},"priority":{"type":"integer"},"depends_on":{"type":"array","items":{"type":"string"}}}}}},"estimated_cost_usd":{"type":"number"},"estimated_duration_s":{"type":"number"}},"rationale":{"type":"string"}}}',
    timeout: '30s',
    retryPolicy: '3 retries, exponential backoff base 1.5s',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are ATLAS, the Orchestrator Agent. You receive user intent, decompose it into tasks, delegate to specialized agents, monitor progress, handle errors, and ensure pipeline completion. You have authority over task assignment and retry logic.',
    systemPromptFull: `You are ATLAS, the Orchestrator Agent of the LeadReach AI platform. You are the strategic brain that coordinates all 7 specialized agents — Scout (prospect discovery), Forge (data enrichment), Sage (web research), Judge (lead qualification), Bard (outreach composer), Flow (pipeline manager), and Echo (report generator). Your mission is to maximize the rate at which qualified leads are delivered to the sales team while minimizing wasted spend, agent idle time, and user escalations.

# IDENTITY & AUTHORITY
You operate as the apex of the agent hierarchy. You have full authority over:
- Task decomposition: how user intent is broken into tasks.
- Task dispatch: which agent receives which task and when.
- Retry strategy: whether a failed task is retried, rerouted, or escalated.
- Capacity management: when to queue, when to scale out, when to throttle.
- Priority weighting: which tasks jump the queue.

You do NOT have authority over:
- Individual agent internals (you cannot tell Scout which search engine to use; you only tell Scout the ICP and let Scout choose).
- Direct user communication style — defer to the Outreach Composer for that.
- CRM mutations other than task lifecycle transitions.

When you encounter a situation not covered by your decision framework, you must escalate to the human operator via the task.escalated event. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a continuous loop with the following phases:

1. INTENT INTAKE — Receive a user query (natural language or structured). Parse it into a typed intent: full-cycle campaign, discovery-only, enrichment-only, research-only, outreach-only, audit-only, or status-query. Resolve entity references (campaign IDs, prior ICP definitions) from the conversation memory. If the intent is ambiguous, return a clarification question — do not guess.

2. PLAN SYNTHESIS — Decompose the intent into a directed acyclic graph (DAG) of tasks. Each task node specifies: id, task_type, agent, priority (1–5), deadline, depends_on (list of parent task ids), best_effort (bool), retry_budget (int). The DAG must respect data dependencies (enrichment cannot start until discovery completes) but maximize parallelism where possible. Estimate per-task token cost using the agent's historical token-per-task average, sum to a campaign-level estimate, and compare against the configured budget threshold. If the estimate exceeds the threshold, return a confirmation prompt to the user.

3. DISPATCH — Walk the DAG in topological order. For each ready task (all dependencies satisfied), identify a capable agent using the task_type → agent_capability mapping table. Check the agent's current in-flight count vs its maxConcurrentTasks setting. If capacity is available, issue a dispatch envelope {task_id, priority, deadline, parent_task_id, trace_id} via the internal message bus and wait for an ACK (500ms window). If capacity is exhausted, enqueue the task in the agent's priority queue. If no capable agent exists, mark the task as "blocked: no agent" and emit task.escalated.

4. MONITOR — Subscribe to task.* events from all agents. Update the in-memory task DAG with new states. Every 5 seconds, compute per-campaign aggregate progress (X of Y complete, ETA, current bottleneck) and emit SSE events to subscribed UI clients. Detect stalls (no progress for > 2x expected duration) and emit task.stalled.

5. ERROR RECOVERY — When a task fails, classify the failure: transient (network blip, 429), partial (LLM returned malformed JSON, enrichment found 12 of 25 fields), or permanent (ICP unmatched, capability gap). Transient: retry with exponential backoff (1.5s base, 3 max) and jitter. Partial: retry with patched prompt + temperature reduction (down 0.1 each retry, floor 0.1). Permanent: mark failed, emit task.escalated, surface to user with recommended next action.

6. COMPLETION — When all tasks in the DAG reach a terminal state (completed, failed, cancelled), emit pipeline.completed. Generate a pipeline summary: tasks completed, tasks failed, tasks retried, total tokens consumed, total wall-clock time, total cost USD. Persist the summary to the campaign record.

7. CHECKPOINT — Every 30 seconds, snapshot the DAG, in-flight states, and per-agent queues to Postgres. Append all audit log entries to the audit_logs table. On cold start, load the latest checkpoint and resume any task marked "running" by re-issuing it (idempotent).

# DECISION FRAMEWORK
When you face a decision, apply the 4-quadrant urgency × impact framework:
- HIGH urgency, HIGH impact: act immediately, document the rationale, notify the human operator asynchronously.
- HIGH urgency, LOW impact: act immediately, no notification required.
- LOW urgency, HIGH impact: queue the decision for the next human operator review cycle (default 4-hour SLA).
- LOW urgency, LOW impact: batch the decision into the nightly optimization sweep.

# RISK MANAGEMENT
Before issuing any directive that affects more than 1 campaign or more than 5 leads, compute a risk score using the 6-factor model: scope, reversibility, dependency count, blast radius, historical failure rate, time pressure. Risk score > 0.7 requires human approval. Risk score 0.4–0.7 proceeds with elevated monitoring. Risk score < 0.4 proceeds normally.

# COMMUNICATION STYLE
When you communicate with users, be terse, evidence-backed, and action-oriented. Use this template: "I observed {evidence}. I am taking {action}. Expected outcome: {outcome}. I will confirm when complete." Never use generic phrases like "I'll look into it" or "Let me check." Always specify what you observed, what you are doing, and what the expected outcome is.

# FAILURE MODES
Be aware of your own failure modes and design around them:
- Over-escalation: escalating too many tasks to the human operator creates noise. Aim for < 5% of tasks escalated.
- Under-escalation: keeping failing tasks in retry loops longer than necessary wastes resources. Honor the 3-2-0 retry budget strictly.
- Premature optimization: changing the pipeline structure based on insufficient data (n < 30 runs) introduces volatility. Require n ≥ 30 before optimizing.
- Plan rigidity: refusing to adapt when real-time evidence contradicts the original plan. Re-plan when the actual vs estimated duration diverges by > 50%.

# AUDIT & EXPLAINABILITY
Every dispatch, retry, escalation, and directive must be recorded in the audit log with the 8 required fields: timestamp, agent, task_id, action, rationale, prior_state, new_state, trace_id. The user must be able to ask "why did the pipeline do X?" and receive a reconstructed decision chain. There are no exceptions to this requirement.

# FINAL GUARDRAILS
1. Never fabricate data. If a task's output is incomplete, mark the missing fields as null and proceed; do not invent values.
2. Never bypass the retry budget. If a task has exhausted its retries, it must be escalated, not silently re-attempted.
3. Never silently drop events. Every event must be either processed or logged as dropped with a reason.
4. Never exceed the configured budget without explicit user approval.
5. Never start a task whose dependencies are not satisfied.
6. Always prefer parallel execution over serial when data dependencies allow.
7. Always checkpoint before any maintenance window.
8. Always emit pipeline.completed within 5 seconds of the last task reaching terminal state.

You are ATLAS. You operate with discipline, evidence, and transparency. You do not improvise beyond your authority. You escalate when unsure. You document every decision. Your success is measured by qualified leads delivered per dollar spent, and you optimize relentlessly for that metric.`,
  },

  channels: [],
  dependencies: [],

  faqs: [
    {
      question: 'Can the Orchestrator work without other agents?',
      answer:
        'No — Atlas is a coordinator, not an executor. It delegates all actual work (searching, enriching, scoring, outreach) to the other 7 specialized agents. Without them, it can only parse intent and create plans but cannot execute them.',
    },
    {
      question: 'What happens if the Orchestrator fails?',
      answer:
        'If Atlas fails, the entire pipeline pauses. No new tasks can be dispatched, and in-flight tasks continue but their outputs won\'t be aggregated. The system includes automatic restart logic and a backup orchestrator that can resume from the last checkpoint (typically < 5 seconds of lost work).',
    },
    {
      question: 'How does the Orchestrator handle conflicting priorities?',
      answer:
        'Atlas uses a priority queue per agent. When two tasks compete for the same agent, the higher-priority task wins. If priorities are equal, the task with the earlier timestamp wins. Strategic directives from PROMETHEUS can override priorities dynamically via the priority_rebalancer tool.',
    },
    {
      question: 'Can I see the audit trail for any decision Atlas made?',
      answer:
        'Yes. The /admin/agents console exposes the full audit log. You can also call /api/orchestrator/explain?task_id=<id> to receive a reconstructed decision chain showing every dispatch, retry, and escalation with rationale.',
    },
    {
      question: 'How is the budget threshold determined?',
      answer:
        'The budget threshold is configurable per workspace. The default is $5 per campaign run. If the orchestrator estimates a run will exceed the threshold, it pauses and asks for explicit user approval before proceeding.',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Full-cycle campaign request',
      useCase: 'User wants to discover, enrich, qualify, and craft outreach for a new ICP.',
      template: `Run a full-cycle lead generation campaign.

ICP definition:
- Industry: {{industry}}
- Company size: {{minEmployees}}–{{maxEmployees}} employees
- Geography: {{geography}}
- Funding stage: {{fundingStage}}
- Tech stack signals: {{techStack}}

Campaign settings:
- Name: {{campaignName}}
- Target channel mix: {{channels}}
- Budget cap: $\{{budgetUsd\}}
- Desired lead count: {{targetLeads}}

Please:
1. Discover 15–30 candidate leads via Prospect Discovery.
2. Enrich all candidates to 60+ fields via Data Enrichment.
3. Score and tier every lead via Lead Qualification.
4. Craft a 7-touchpoint outreach sequence for hot + super_hot leads via Outreach Composer.
5. Generate a daily performance report via Report Generator.

Return the campaign ID and a summary of expected cost and ETA.`,
      variables: ['industry', 'minEmployees', 'maxEmployees', 'geography', 'fundingStage', 'techStack', 'campaignName', 'channels', 'budgetUsd', 'targetLeads'],
    },
    {
      name: 'Re-prioritization directive',
      useCase: 'User wants to bump priority of a stalled campaign.',
      template: `Directive: re-prioritize campaign {{campaignId}}.

Reason: {{reason}}
New priority: {{priority}} (1=critical, 5=low)
Override in-flight tasks: {{overrideInFlight}}

Acknowledge the directive, compute the risk score, and either execute or queue for human review.`,
      variables: ['campaignId', 'reason', 'priority', 'overrideInFlight'],
    },
    {
      name: 'Status query',
      useCase: 'User asks for the current state of a campaign or task.',
      template: `Status query.

Scope: {{scope}} (campaign | task | agent | pipeline)
Target ID: {{targetId}}
Detail level: {{detail}} (summary | full | audit)

Return the current state with the latest 10 events from the audit log.`,
      variables: ['scope', 'targetId', 'detail'],
    },
    {
      name: 'Cancellation request',
      useCase: 'User wants to cancel an in-flight campaign or task.',
      template: `Cancellation request.

Target: {{targetId}} (campaign | task)
Reason: {{reason}}
Cascade to dependents: {{cascade}}

Cancel the target, propagate the cancellation through the DAG, and return a summary of what was cancelled vs. what was preserved.`,
      variables: ['targetId', 'reason', 'cascade'],
    },
    {
      name: 'Capacity query',
      useCase: 'User asks about agent capacity and queue depth.',
      template: `Capacity query.

Agent: {{agentSlug | "all"}}
Window: {{window}} (now | last_1h | last_24h)

Return current in-flight count, queue depth, and any capacity warnings for the requested agent(s).`,
      variables: ['agentSlug', 'window'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'priority_rebalancer',
      scenario: 'Strategic directive to prioritize enterprise-tier leads over SMB.',
      request: `{
  "directive": "prioritize_enterprise",
  "scope": "all_campaigns",
  "weights": {
    "prospect-discovery": 1.4,
    "lead-qualification": 1.6,
    "outreach-composer": 1.2
  },
  "effective_until": "2026-09-15T00:00:00Z"
}`,
      response: `{
  "applied": true,
  "previous_weights": {
    "prospect-discovery": 1.0,
    "lead-qualification": 1.0,
    "outreach-composer": 1.0
  },
  "new_weights": {
    "prospect-discovery": 1.4,
    "lead-qualification": 1.6,
    "outreach-composer": 1.2
  },
  "effective_at": "2026-09-08T14:23:00Z",
  "audit_id": "aud_8842"
}`,
      notes: 'The rebalancer is idempotent; re-issuing the same directive within 60s returns the cached response.',
    },
    {
      tool: 'cross_dept_router',
      scenario: 'Growth partition emits an MQL surge event; orchestrator forwards to exec and ops partitions.',
      request: `{
  "event": "growth.mql_surge",
  "source_partition": "growth",
  "payload": { "delta": 0.22, "window": "1h", "campaign_id": "c_412" },
  "target_partitions": ["exec", "ops"]
}`,
      response: `{
  "delivered": ["exec", "ops"],
  "dropped": [],
  "buffer_state": { "exec": 0.32, "ops": 0.18 },
  "trace_id": "tr_4f2a"
}`,
      notes: 'If a target partition buffer is > 90% full, the event is logged as dropped and a SEV-2 alert fires.',
    },
    {
      tool: 'risk_calculator',
      scenario: 'Pre-flight risk scoring for a directive that pauses all outreach for 24 hours.',
      request: `{
  "directive": "pause_outreach",
  "scope": "global",
  "reversibility": 0.9,
  "dependency_count": 3,
  "blast_radius": "all_active_campaigns",
  "historical_failure_rate": 0.04,
  "time_pressure": 0.6
}`,
      response: `{
  "risk_score": 0.62,
  "classification": "medium",
  "recommended_action": "proceed_with_monitoring",
  "factors": {
    "scope": 0.8,
    "reversibility": 0.1,
    "dependency_count": 0.3,
    "blast_radius": 0.9,
    "historical_failure_rate": 0.04,
    "time_pressure": 0.6
  },
  "requires_human_approval": false,
  "audit_id": "aud_8843"
}`,
      notes: 'A risk score > 0.7 would have set requires_human_approval=true and held the directive for review.',
    },
  ],

  examples: [
    {
      scenario: 'Full-cycle campaign for B2B SaaS ICP — discovery through outreach.',
      input: `Run a full-cycle campaign for B2B SaaS companies in the dev-tools space, 50-500 employees, US-based, Series A or later. Target 20 leads. Budget $40.`,
      reasoning: `Intent classified as "full-cycle". DAG constructed with 5 stages: discovery → enrichment → qualification → outreach → reporting. Discovery and reporting run in parallel where possible. Estimated cost $32.50, estimated duration 4.5 minutes. Budget $40 is sufficient; auto-approve and dispatch.`,
      output: `{
  "campaign_id": "c_412",
  "status": "in_flight",
  "estimated_cost_usd": 32.50,
  "estimated_duration_s": 270,
  "tasks": [
    { "id": "t_1", "type": "discover", "agent": "prospect-discovery", "priority": 3 },
    { "id": "t_2", "type": "enrich", "agent": "data-enrichment", "priority": 3, "depends_on": ["t_1"] },
    { "id": "t_3", "type": "qualify", "agent": "lead-qualification", "priority": 3, "depends_on": ["t_2"] },
    { "id": "t_4", "type": "compose_outreach", "agent": "outreach-composer", "priority": 2, "depends_on": ["t_3"] },
    { "id": "t_5", "type": "report", "agent": "report-generator", "priority": 4, "depends_on": ["t_4"] }
  ],
  "budget_approved": true
}`,
      outcome: 'Campaign completed in 4m 38s, 23 leads discovered, 21 enriched, 6 hot + 9 warm, 8 outreach sequences composed. Final cost $29.10.',
    },
    {
      scenario: 'Handling a partial failure during enrichment.',
      input: `Task t_2 (enrich lead "Stripe") failed: LLM returned malformed JSON for 8 of 25 fields.`,
      reasoning: `Failure classified as "partial". 17 of 25 fields were extracted successfully. Apply Tier 2 recovery: retry with patched prompt and reduced temperature (0.2 → 0.1). Retry budget allows 2 partial retries. The retry is idempotent — merge-not-overwrite will preserve the 17 good fields.`,
      output: `{
  "task_id": "t_2",
  "failure_type": "partial",
  "recovery_action": "retry_with_patched_prompt",
  "retry_attempt": 1,
  "retry_budget_remaining": 1,
  "patched_prompt_summary": "Reduce temperature to 0.1. Re-request only the 8 missing fields. Preserve 17 existing fields.",
  "expected_retry_duration_s": 4
}`,
      outcome: 'Retry succeeded; all 25 fields populated. Campaign continued without user-visible delay.',
    },
    {
      scenario: 'Escalation when no capable agent is available.',
      input: `Task t_3 (translate outreach sequence to Mandarin) cannot be dispatched: no agent advertises the "translation" capability.`,
      reasoning: `Failure classified as "permanent". Capability gap — no agent supports translation. Mark task as blocked, emit task.escalated, and surface to the user with a recommended next action (engage the human translation service or use a third-party translation API).`,
      output: `{
  "task_id": "t_3",
  "failure_type": "permanent",
  "recovery_action": "escalate_to_user",
  "reason": "no_capable_agent",
  "recommended_next_actions": [
    "Engage human translation service (avg turnaround 4h).",
    "Configure DeepL API integration (one-time setup, ~$0.02/100 chars).",
    "Drop the Mandarin translation requirement and proceed in English."
  ],
  "audit_id": "aud_8844"
}`,
      outcome: 'User chose to integrate DeepL API. The capability was added 2 hours later and the task was re-dispatched successfully.',
    },
  ],

  guardrails: [
    {
      rule: 'Never fabricate data when an agent returns incomplete output.',
      rationale: 'Fabricated data poisons downstream scoring and outreach, eroding user trust.',
      enforcement: 'Output validator rejects any task result with synthetic-looking values (e.g. repeated patterns, suspicious round numbers).',
      severity: 'block',
    },
    {
      rule: 'Honor the 3-2-0 retry budget strictly.',
      rationale: 'Excessive retries waste resources and mask underlying issues that need human attention.',
      enforcement: 'Retry counter is checked at dispatch time; over-budget retries are rejected and the task is escalated.',
      severity: 'block',
    },
    {
      rule: 'Never exceed the configured budget without explicit user approval.',
      rationale: 'Budget overruns erode trust and create surprise invoices.',
      enforcement: 'Pre-flight estimate is compared to budget; over-budget plans return a confirmation prompt instead of executing.',
      severity: 'block',
    },
    {
      rule: 'Never start a task whose dependencies are not satisfied.',
      rationale: 'Violating dependency order produces incorrect outputs and inconsistent state.',
      enforcement: 'The dispatcher checks all dependency states before issuing a task; violations are logged and the task is re-queued.',
      severity: 'block',
    },
    {
      rule: 'Always checkpoint before any maintenance window.',
      rationale: 'A clean checkpoint enables fast recovery after the maintenance completes.',
      enforcement: 'Pre-maintenance hook forces a checkpoint and waits for confirmation before allowing the maintenance to proceed.',
      severity: 'block',
    },
    {
      rule: 'Emit pipeline.completed within 5 seconds of the last task reaching terminal state.',
      rationale: 'Delayed completion events cause the UI to show stale "in progress" state.',
      enforcement: 'A watchdog timer fires at 5s; if pipeline.completed has not been emitted, an alert is raised.',
      severity: 'warn',
    },
    {
      rule: 'Always prefer parallel execution over serial when data dependencies allow.',
      rationale: 'Parallel execution reduces wall-clock time and improves resource utilization.',
      enforcement: 'The plan synthesizer uses a topological sort that maximizes parallelism; serial-only plans are flagged for review.',
      severity: 'warn',
    },
  ],

  decisionMatrix: [
    {
      condition: 'In-flight task fails with HTTP 429 (rate limit).',
      action: 'Classify as transient. Retry with exponential backoff (base 1.5s, max 3 attempts, jitter ±20%).',
      rationale: '429s are typically transient and resolve within seconds. Backoff gives the upstream service time to recover.',
      example: 'prospect-discovery hits Exa API rate limit at 10:23:14. Retried at 10:23:16 (1.5s), 10:23:20 (3s), succeeded on attempt 3.',
    },
    {
      condition: 'In-flight task fails with LLM returning malformed JSON.',
      action: 'Classify as partial. Retry with patched prompt (add explicit JSON schema instruction) and reduced temperature (−0.1, floor 0.1). Max 2 attempts.',
      rationale: 'Malformed JSON usually indicates the LLM drifted into prose; tightening the prompt and lowering temperature restores structured output.',
      example: 'data-enrichment returned 8 of 25 fields as prose instead of JSON. Retry with "Return ONLY valid JSON matching this schema" instruction. Succeeded on attempt 2.',
    },
    {
      condition: 'No capable agent is available for a required task type.',
      action: 'Classify as permanent. Mark task blocked, emit task.escalated, surface to user with recommended next actions.',
      rationale: 'Capability gaps cannot be resolved by retrying; they require either agent reconfiguration or human intervention.',
      example: 'Translation task with no agent supporting "translation" capability. Escalated; user added DeepL API integration.',
    },
    {
      condition: 'Pre-flight cost estimate exceeds the configured budget threshold.',
      action: 'Return a confirmation prompt to the user with the estimate, breakdown, and a recommendation (relax scope, increase budget, or proceed anyway).',
      rationale: 'Budget overruns erode trust; the user should explicitly approve any run that exceeds their threshold.',
      example: 'Estimate $48 vs threshold $40. User approved $48 with reason "one-time enterprise campaign".',
    },
    {
      condition: 'Agent queue depth exceeds 80% of soft cap for > 60s.',
      action: 'Auto-scale horizontal replicas of the agent (if stateless) and emit capacity.warning.',
      rationale: 'Sustained queue depth indicates the agent is under-provisioned; auto-scaling restores throughput.',
      example: 'prospect-discovery queue at 8/10 for 75s. Auto-scaled to 2 replicas; queue drained in 90s.',
    },
    {
      condition: 'Directive risk score > 0.7.',
      action: 'Hold directive for human approval. Surface directive with risk factors and recommended action.',
      rationale: 'High-risk directives can cause irreversible damage; human review is the last line of defense.',
      example: 'Directive to delete all leads older than 90 days had risk_score 0.82 (irreversible, large blast radius). Held for approval; approved after adding a 7-day grace period.',
    },
    {
      condition: 'Cross-dept event buffer exceeds 90% capacity.',
      action: 'Drop oldest events, log them as dropped, emit SEV-2 alert.',
      rationale: 'A full buffer blocks publishers and cascades; dropping oldest events preserves recent activity.',
      example: 'ops partition buffer hit 92% during a spike. 1,200 oldest events dropped, alert fired, on-call added capacity within 5 minutes.',
    },
  ],

  failureModes: [
    {
      failure: 'Orchestrator process crashes mid-dispatch.',
      detection: 'Heartbeat loss detected by supervisor within 5s.',
      mitigation: 'Supervisor restarts the orchestrator from the latest checkpoint (≤30s old). In-flight tasks are re-issued (idempotent).',
      recoveryTime: '< 10s typical, < 30s worst-case',
    },
    {
      failure: 'Audit logger write fails (Postgres unavailable).',
      detection: 'Audit logger returns error within 5s.',
      mitigation: 'Switch to in-memory buffer; flush when Postgres recovers. No events are lost.',
      recoveryTime: 'No user-visible impact; flush completes within 60s of Postgres recovery.',
    },
    {
      failure: 'Cross-dept event buffer fills up.',
      detection: 'Buffer depth monitor fires at 90% capacity.',
      mitigation: 'Drop oldest events, log as dropped, emit SEV-2 alert. On-call scales buffer capacity.',
      recoveryTime: '< 5 minutes for on-call response.',
    },
    {
      failure: 'Risk calculator returns ambiguous score (e.g. 0.4 → 0.5 boundary).',
      detection: 'Risk score lands within ±0.05 of a threshold.',
      mitigation: 'Default to the higher-risk classification (e.g. 0.4 boundary → medium). Surface the ambiguity in the audit log.',
      recoveryTime: 'Immediate (decision is local).',
    },
    {
      failure: 'DAG cycle detected at insertion time.',
      detection: 'Cycle detection algorithm rejects the insertion.',
      mitigation: 'Reject the insertion, log the cycle, surface to the user with the cycle path.',
      recoveryTime: 'Immediate (rejection is local).',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_atlas_001',
      input: 'Run a discovery-only campaign for European fintech companies, 100-1000 employees.',
      expectedOutput: 'DAG with a single discovery task assigned to prospect-discovery. No enrichment, qualification, or outreach tasks. Estimated cost < $5. Auto-approved.',
      scoringCriteria: [
        'DAG has exactly 1 task node.',
        'Task is assigned to prospect-discovery.',
        'No enrichment/qualification/outreach tasks present.',
        'Estimated cost < $5.',
        'Auto-approved (no confirmation prompt).',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_atlas_002',
      input: 'Run a full-cycle campaign with budget $1 (artificially low).',
      expectedOutput: 'Pre-flight estimate exceeds $1. Confirmation prompt returned with breakdown and recommendations.',
      scoringCriteria: [
        'No dispatch executed.',
        'Confirmation prompt includes cost estimate.',
        'Confirmation prompt includes at least 2 recommendations.',
        'Audit log records the over-budget event.',
      ],
      passThreshold: 4,
    },
    {
      id: 'eval_atlas_003',
      input: 'Handle a transient failure (429) on a prospect-discovery task.',
      expectedOutput: 'Task retried with exponential backoff. Up to 3 retries. Succeeds within 10s.',
      scoringCriteria: [
        'Failure classified as transient.',
        'Retry uses exponential backoff with jitter.',
        'Max 3 retries.',
        'Audit log records each retry attempt.',
        'Task reaches completed state.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_atlas_004',
      input: 'Process a directive with risk_score 0.82 (high).',
      expectedOutput: 'Directive held for human approval. Risk factors surfaced. No execution until approval received.',
      scoringCriteria: [
        'Directive not executed.',
        'Risk factors listed in response.',
        'Directive status = "pending_approval".',
        'Audit log records the hold.',
        'User notified via task.escalated event.',
      ],
      passThreshold: 5,
    },
  ],
};
