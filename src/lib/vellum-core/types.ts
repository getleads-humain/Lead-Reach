/**
 * Vellum Core — Shared Type Definitions
 *
 * All types used across the Vellum Core Integration Module for LeadReach AI.
 * Adapted from the open-source Vellum Assistant architecture to work with
 * LeadReach's existing infrastructure (Next.js 16 App Router, Z.AI API).
 *
 * IMPORTANT: These types are ADDITIVE — they do not replace or modify any
 * existing LeadReach types. They define the Vellum Core module's internal
 * contract and its integration surface.
 */

// ============================================================
// Re-export existing LeadReach types for convenience
// ============================================================

// Note: These types are re-exported from the prospect-agent module.
// Using a relative import to avoid path alias issues in some bundlers.
// The @/ alias should work in the Next.js context, but we provide
// the types inline here as well for maximum compatibility.

/**
 * The specialized agent persona that handles the conversation.
 * Each persona has distinct capabilities, system prompts, and action sets.
 */
export type AgentPersona =
  | 'scout'     // Company research & discovery
  | 'hound'     // Person research & contact finding
  | 'analyst'   // Market research & competitive analysis
  | 'architect' // ICP building & refinement
  | 'judge'     // Lead qualification & scoring
  | 'scribe'    // Outreach composition
  | 'navigator'; // General guidance, clarification, multi-step orchestration

/**
 * The classified intent of a user message.
 * Determines which action pipeline the agent executes.
 */
export type UserIntent =
  | 'research_company'
  | 'research_person'
  | 'research_url'
  | 'analyze_market'
  | 'analyze_competitors'
  | 'build_icp'
  | 'score_lead'
  | 'compose_outreach'
  | 'refine_search'
  | 'add_to_pipeline'
  | 'clarify'
  | 'converse';

// ============================================================
// Agent Persona (extended for Vellum Core)
// ============================================================

/**
 * Extended agent persona that includes the 8-agent display names
 * used in LeadReach's orchestrator alongside the original persona system.
 */
export type VellumAgentPersona =
  | 'atlas'     // Orchestrator — coordinates all agents
  | 'scout'     // Discovery — company & web research
  | 'forge'     // Enrichment — data enrichment & deep crawl
  | 'sage'      // Research — market & competitive analysis
  | 'judge'     // Qualification — lead scoring & ICP matching
  | 'bard'      // Outreach — message composition
  | 'flow'      // Pipeline — pipeline & session management
  | 'echo'      // Reports — insights & reporting
  | 'navigator'; // General guidance (maps to atlas/flow in 8-agent)

// ============================================================
// Pipeline State & Steps
// ============================================================

/** Current phase of the agent pipeline execution */
export type PipelinePhase =
  | 'idle'
  | 'thinking'
  | 'executing'
  | 'synthesizing'
  | 'complete'
  | 'error';

/** A single step in the pipeline execution */
export interface PipelineStep {
  id: string;
  agent: VellumAgentPersona;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: number | null;
  completedAt: number | null;
  durationMs: number | null;
  metadata?: Record<string, unknown>;
}

/** Pipeline state tracked across a full agent run */
export interface VellumPipelineState {
  phase: PipelinePhase;
  steps: PipelineStep[];
  currentStepIndex: number;
  overallProgress: number; // 0-100
  thinkStartTime: number | null;
  totalThinkTimeMs: number | null;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Memory Graph (adapted from Vellum's graph memory)
// ============================================================

/** A node in the memory graph — represents a piece of knowledge */
export interface MemoryNode {
  id: string;
  type: 'fact' | 'preference' | 'insight' | 'entity' | 'relationship' | 'event';
  content: string;
  source: 'user' | 'agent' | 'tool' | 'system';
  confidence: number; // 0-1
  createdAt: number;
  updatedAt: number;
  expiresAt: number | null; // null = never expires
  tags: string[];
  metadata?: Record<string, unknown>;
}

/** An edge in the memory graph — represents a relationship between nodes */
export interface MemoryEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: string; // e.g., 'related_to', 'caused', 'supports', 'contradicts'
  weight: number; // 0-1, strength of the relationship
  createdAt: number;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Skill & Plugin System
// ============================================================

/** Definition of a Vellum skill that can be loaded into the agent */
export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'research' | 'outreach' | 'analysis' | 'automation' | 'custom';
  tools: string[]; // Tool names this skill uses
  systemPromptAddition?: string;
  requiredCapabilities?: string[];
  parameters?: Record<string, {
    type: 'string' | 'number' | 'boolean';
    description: string;
    default?: unknown;
    required?: boolean;
  }>;
}

/** Summary of a skill for listing and discovery */
export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  version: string;
  category: SkillDefinition['category'];
  toolCount: number;
  isActive: boolean;
}

/** Manifest for a Vellum plugin */
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: PluginHooks;
  tools?: string[];
  skills?: string[];
}

/** Hooks that a plugin can register for */
export interface PluginHooks {
  preModelCall?: boolean;
  postModelCall?: boolean;
  preToolUse?: boolean;
  postToolUse?: boolean;
  postCompact?: boolean;
  onStart?: boolean;
  onStop?: boolean;
}

// ============================================================
// Tool System
// ============================================================

/** Risk level for tool operations — determines permission requirements */
export type RiskLevel = 'low' | 'medium' | 'high';

/** Ownership category for a tool — determines lifecycle management */
export type ToolOwnership = 'core' | 'skill' | 'plugin' | 'mcp' | 'workspace';

/** Definition of a tool that can be used by the agent loop */
export interface ToolDefinition {
  /** Unique name for this tool (e.g., "web_search", "file_read") */
  name: string;
  /** Human-readable description of what the tool does */
  description: string;
  /** JSON Schema for the tool's input parameters */
  input_schema: Record<string, unknown>;
  /** Default risk level for this tool */
  defaultRiskLevel?: RiskLevel;
  /** Category for grouping tools in the UI */
  category?: string;
  /** The tool's execution function */
  execute?: (input: Record<string, unknown>, context: ToolContext) => Promise<ToolExecutionResult>;
}

/**
 * Fully resolved tool with all required fields.
 * Created from ToolDefinition after registration.
 */
export type Tool = Required<Pick<ToolDefinition, 'name' | 'description' | 'input_schema' | 'execute'>> & {
  defaultRiskLevel: RiskLevel;
  category: string;
  ownership: ToolOwnership;
  ownerRef: string; // ID of the owning skill/plugin/etc.
  refCount: number; // Reference count for lifecycle management
};

/** Context provided to tool execution functions */
export interface ToolContext {
  /** Current conversation ID */
  conversationId: string;
  /** Working directory for file operations */
  workingDir: string;
  /** Unique request ID for this agent loop run */
  requestId: string;
  /** AbortSignal for cancellation */
  signal: AbortSignal;
  /** Callback for streaming tool output */
  onOutput?: (chunk: string) => void;
}

/** Result returned from a tool execution */
export interface ToolExecutionResult {
  /** The tool's output content */
  content: string;
  /** Whether the execution resulted in an error */
  isError: boolean;
  /** Risk assessment for this execution */
  riskLevel?: RiskLevel;
  /** Reason for the risk classification */
  riskReason?: string;
  /** Whether the agent loop should yield control back to the user */
  yieldToUser?: boolean;
  /** Optional metadata about the execution */
  metadata?: Record<string, unknown>;
}

// ============================================================
// Agent Loop
// ============================================================

/** Configuration for the agent loop */
export interface AgentLoopConfig {
  /** Maximum output tokens per LLM call */
  maxTokens: number;
  /** Maximum input tokens (context window size) */
  maxInputTokens?: number;
  /** Whether to enable thinking/reasoning mode */
  thinking?: { enabled: boolean; budgetTokens?: number };
  /** Reasoning effort level */
  effort: 'none' | 'low' | 'medium' | 'high';
  /** Tool choice strategy */
  toolChoice?: { type: 'auto' } | { type: 'any' } | { type: 'tool'; name: string };
  /** Minimum interval (ms) between consecutive LLM calls */
  minTurnIntervalMs?: number;
  /** Maximum number of tool-use turns before stopping */
  maxToolTurns?: number;
  /** Whether to emit thinking events before agent work */
  emitThinkingEvents?: boolean;
  /** Primary model to use */
  primaryModel?: string;
  /** Fallback model when primary is unavailable */
  fallbackModel?: string;
}

/** Reason the agent loop exited */
export type AgentLoopExitReason =
  | 'no_tool_calls'          // Assistant message has no tool-use blocks
  | 'max_tool_turns'         // Exceeded maximum tool-use iterations
  | 'aborted'                // Signal was aborted
  | 'context_too_large'      // Context window overflow after compaction
  | 'budget_yield_unrecovered' // Compaction exhausted without recovery
  | 'max_tokens_reached'     // Output token limit reached
  | 'yield_to_user'          // Tool result requested user handoff
  | 'error'                  // Unhandled error broke the loop
  | 'completed';             // Normal completion

/**
 * Discriminated union of all agent events emitted during a loop run.
 * Adapted from Vellum's AgentEvent with 15+ event types.
 */
export type AgentEvent =
  // ── LLM call lifecycle ──────────────────────────────────
  | { type: 'llm_call_started'; callSite?: string }
  | { type: 'text_delta'; text: string }
  | { type: 'thinking_delta'; thinking: string }
  | { type: 'message_complete'; content: string; role: 'assistant' | 'user' | 'system' }
  | { type: 'max_tokens_reached'; stopReason: string }
  // ── Tool execution ──────────────────────────────────────
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_output_chunk'; toolUseId: string; chunk: string }
  | { type: 'tool_result'; toolUseId: string; content: string; isError: boolean; riskLevel?: RiskLevel; riskReason?: string }
  // ── Pipeline progress ───────────────────────────────────
  | { type: 'agent_progress'; agent: VellumAgentPersona; step: string; progress: number }
  | { type: 'pipeline_step'; step: PipelineStep; phase: PipelinePhase }
  // ── Context management ──────────────────────────────────
  | { type: 'context_compacting' }
  | { type: 'compaction_completed'; originalTokens: number; compactedTokens: number }
  | { type: 'compaction_circuit_open'; reason: string; openUntil: number }
  | { type: 'compaction_circuit_closed' }
  // ── Memory updates ──────────────────────────────────────
  | { type: 'memory_update'; operation: 'add' | 'update' | 'delete'; node?: MemoryNode; edge?: MemoryEdge }
  // ── Usage tracking ──────────────────────────────────────
  | { type: 'usage'; inputTokens: number; outputTokens: number; model: string; providerDurationMs: number }
  // ── Error & exit ────────────────────────────────────────
  | { type: 'error'; error: Error }
  | { type: 'provider_error'; error: Error; provider?: string }
  | { type: 'agent_loop_exit'; reason: AgentLoopExitReason };

/** Result of an agent loop run */
export interface AgentLoopRunResult {
  /** Full conversation history after the run */
  history: AgentMessage[];
  /** Reason the loop exited */
  exitReason: AgentLoopExitReason | null;
  /** New messages added during this run */
  newMessages: AgentMessage[];
  /** Total tokens consumed during this run */
  totalTokensUsed: number;
  /** Number of tool-use turns executed */
  toolUseTurns: number;
  /** Duration of the run in milliseconds */
  durationMs: number;
}

/** A message in the agent loop's conversation history */
export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string; // Thinking/reasoning from the model
  toolCalls?: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  toolResults?: Array<{
    toolUseId: string;
    content: string;
    isError: boolean;
  }>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ============================================================
// Permissions & Trust
// ============================================================

/** Risk assessment for a tool invocation */
export interface RiskAssessment {
  level: RiskLevel;
  reason: string;
  matchedRuleId?: string;
  scopeOptions?: Array<{ pattern: string; label: string }>;
}

/** A trust rule that can allow, deny, or require approval for tool operations */
export interface TrustRule {
  id: string;
  name: string;
  /** The tool name pattern this rule applies to (supports glob) */
  toolPattern: string;
  /** The action this rule takes */
  action: 'allow' | 'deny' | 'ask';
  /** Optional input pattern to match (JSON path expressions) */
  inputPattern?: Record<string, unknown>;
  /** Optional path pattern for file-operation scoping */
  pathPattern?: string;
  /** Optional description of why this rule exists */
  description?: string;
  /** Priority — higher priority rules are evaluated first */
  priority: number;
}

/** Result of a permission check */
export interface PermissionCheckResult {
  allowed: boolean;
  riskLevel: RiskLevel;
  reason: string;
  matchedRuleId?: string;
  approvalRequired: boolean;
  scopeOptions?: Array<{ pattern: string; label: string }>;
}

// ============================================================
// Scheduling & Heartbeat
// ============================================================

/** Configuration for scheduled tasks */
export interface ScheduleConfig {
  /** Unique identifier for this schedule */
  id: string;
  /** Cron expression or interval for the schedule */
  schedule: string;
  /** The agent persona to invoke */
  agent: VellumAgentPersona;
  /** The task to execute */
  task: string;
  /** Whether the schedule is active */
  active: boolean;
  /** Optional conversation ID to continue */
  conversationId?: string;
  /** Maximum number of executions (null = unlimited) */
  maxExecutions?: number | null;
  /** Created timestamp */
  createdAt: number;
  /** Last execution timestamp */
  lastExecutedAt?: number | null;
}

/** Configuration for heartbeat/keep-alive monitoring */
export interface HeartbeatConfig {
  /** Interval in milliseconds between heartbeats */
  intervalMs: number;
  /** Maximum missed heartbeats before considering the agent unresponsive */
  maxMissed: number;
  /** Callback when a heartbeat is missed */
  onMissed?: (missedCount: number) => void;
  /** Callback when the agent is considered unresponsive */
  onUnresponsive?: () => void;
}

// ============================================================
// Channel System
// ============================================================

/** Channel identifier for communication routing */
export type ChannelId = 'web' | 'cli' | 'api' | 'voice' | 'slack' | 'email' | 'webhook';

/** Configuration for a communication channel */
export interface ChannelConfig {
  id: ChannelId;
  name: string;
  enabled: boolean;
  maxConcurrentRequests: number;
  timeoutMs: number;
  retryConfig?: {
    maxRetries: number;
    backoffMs: number;
    maxBackoffMs: number;
  };
}

// ============================================================
// Z.AI Provider Types
// ============================================================

/** Streaming event from the Z.AI provider */
export type ZAIStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'thinking_delta'; thinking: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; toolUseId: string; content: string; isError: boolean }
  | { type: 'usage'; inputTokens: number; outputTokens: number; model: string }
  | { type: 'done'; stopReason: string }
  | { type: 'error'; error: string };

/** Options for a Z.AI chat completion call */
export interface ZAIChatOptions {
  /** Model to use (defaults to primary) */
  model?: string;
  /** Temperature (0-1) */
  temperature?: number;
  /** Maximum output tokens */
  maxTokens?: number;
  /** Whether to enable thinking/reasoning mode */
  thinking?: { enabled: boolean; budgetTokens?: number };
  /** Tool definitions to include */
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  /** Tool choice strategy */
  toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Request ID for tracking */
  requestId?: string;
}

/** Token usage from a Z.AI API call */
export interface ZAIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
