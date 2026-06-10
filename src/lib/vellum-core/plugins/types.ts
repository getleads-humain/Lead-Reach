/**
 * Plugin System — Type Definitions
 * ==================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The Plugin System provides a hook-based extension mechanism for
 * the agent pipeline. Plugins can:
 *   - React to lifecycle events (init, shutdown, etc.)
 *   - Inject context into user prompts (injectors)
 *   - Provide additional tools for the agent to use
 *   - Modify conversation flow before/after LLM calls
 *
 * This is a more sophisticated plugin system than the existing
 * @/lib/agent-infrastructure/plugins, which is DB-driven and
 * hook-name-based. This Vellum-style system is runtime-oriented,
 * with typed hook functions and injection blocks.
 *
 * Integration points:
 *   - Complements @/lib/agent-infrastructure/plugins (both coexist)
 *   - Works with @/lib/llm for LLM-related hooks
 *   - Integrates with the MCP system for tool provisioning
 */

// ── Hook Types ──────────────────────────────────────────────────

/**
 * Plugin hook lifecycle events.
 * Each hook fires at a specific point in the agent pipeline.
 *
 * - init:                Plugin initialization (server startup)
 * - shutdown:            Plugin cleanup (server shutdown)
 * - user-prompt-submit:  User has submitted a prompt (before processing)
 * - pre-model-call:      Before an LLM call is made
 * - post-model-call:     After an LLM call returns
 * - post-tool-use:       After a tool/function call completes
 * - stop:                Agent session is stopping
 * - post-compact:        After conversation compaction
 */
export type PluginHook =
  | 'init'
  | 'shutdown'
  | 'user-prompt-submit'
  | 'pre-model-call'
  | 'post-model-call'
  | 'post-tool-use'
  | 'stop'
  | 'post-compact';

/**
 * Trust level of the current turn context.
 * - guardian:  System-level, highest trust (e.g., admin operations)
 * - trusted:   Authenticated user operations
 * - unknown:   Unverified source (e.g., webhooks without signatures)
 */
export type TrustLevel = 'guardian' | 'trusted' | 'unknown';

/**
 * Mode of the current turn.
 * - interactive:  User is actively interacting (chat)
 * - background:   Agent is running autonomously (scheduled/heartbeat)
 */
export type TurnMode = 'interactive' | 'background';

// ── Turn Context ────────────────────────────────────────────────

/**
 * Context for the current agent turn.
 * Provides all the information a plugin needs to make decisions.
 */
export interface TurnContext {
  /** Unique request ID for this turn */
  requestId: string;
  /** Conversation this turn belongs to */
  conversationId: string;
  /** Zero-based turn index within the conversation */
  turnIndex: number;
  /** Trust level of the source */
  trust: TrustLevel;
  /** Whether this is interactive or background mode */
  mode: TurnMode;
  /** Timestamp of this turn */
  timestamp: number;
  /** IANA timezone for the user/scope */
  timezone: string;
  /** Milliseconds since the last message in this conversation */
  timeSinceLastMessage: number;
  /** Model profile being used (e.g., "glm-4.6v-flash") */
  modelProfile?: string;
  /** Channel name (e.g., "email", "linkedin", "web") */
  channelName?: string;
}

// ── Injection Types ─────────────────────────────────────────────

/**
 * Where to place injected content relative to the user message.
 * - prepend-user-tail:    Add before the user's message
 * - append-user-tail:     Add after the user's message
 * - after-memory-prefix:  Add after the system prompt's memory section
 * - replace-run-messages: Replace all messages (full override)
 */
export type InjectionPlacement =
  | 'prepend-user-tail'
  | 'append-user-tail'
  | 'after-memory-prefix'
  | 'replace-run-messages';

/**
 * A block of content to inject into the agent's context.
 * Produced by injectors and hook functions.
 */
export interface InjectionBlock {
  /** Unique identifier for this injection */
  id: string;
  /** The text content to inject */
  text: string;
  /** Where to place this content */
  placement: InjectionPlacement;
  /** If placement is 'replace-run-messages', these messages replace the entire context */
  messagesOverride?: Array<{ role: string; content: string }>;
  /** Optional metadata about this injection */
  meta?: Record<string, unknown>;
}

// ── Injector Interface ──────────────────────────────────────────

/**
 * An injector produces content to be injected into the agent's context.
 * Injectors are ordered and run sequentially, allowing later injectors
 * to build on earlier ones.
 */
export interface Injector {
  /** Name of this injector */
  name: string;
  /** Execution order (lower = earlier), default 100 */
  order: number;
  /** Produce injection blocks for the given turn context */
  produce(context: TurnContext): Promise<InjectionBlock[]>;
}

// ── Tool Definition ─────────────────────────────────────────────

/**
 * Definition of a tool that a plugin provides.
 * Tools are functions the agent can call during execution.
 */
export interface ToolDefinition {
  /** Unique tool name */
  name: string;
  /** Human-readable description of what this tool does */
  description: string;
  /** JSON Schema for the tool's input parameters */
  inputSchema: Record<string, unknown>;
  /** Handler function that executes the tool */
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

// ── Plugin Hook Function ────────────────────────────────────────

/**
 * A function that handles a plugin hook event.
 * Can optionally return injection blocks to modify the agent's context.
 */
export interface PluginHookFn<TContext = unknown> {
  (context: TContext): Promise<void | InjectionBlock[]>;
}

// ── Plugin Interface ────────────────────────────────────────────

/**
 * A plugin that extends the agent pipeline.
 *
 * Plugins register hooks (lifecycle event handlers), injectors
 * (context producers), and tools (agent-callable functions).
 */
export interface Plugin {
  /** Plugin metadata */
  manifest: PluginManifest;
  /** Hook handlers — keyed by hook name */
  hooks: Partial<Record<PluginHook, PluginHookFn>>;
  /** Tools this plugin provides */
  tools?: ToolDefinition[];
  /** Injectors this plugin provides */
  injectors?: Injector[];
}

// ── Plugin Manifest ─────────────────────────────────────────────

/**
 * Metadata about a plugin.
 */
export interface PluginManifest {
  /** Unique plugin name */
  name: string;
  /** Semantic version (e.g., "1.0.0") */
  version: string;
  /** Human-readable description */
  description?: string;
  /** Required credential key (e.g., "ZHIPU_API_KEY") */
  requiresCredential?: string;
  /** Required feature flag (e.g., "enable_memory_plugin") */
  requiresFlag?: string;
  /** Plugin-specific configuration */
  config?: Record<string, unknown>;
}
