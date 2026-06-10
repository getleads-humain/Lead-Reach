/**
 * Vellum Core — Agent Loop
 *
 * Adapted from Vellum Assistant's AgentLoop for LeadReach AI's
 * 8-agent pipeline. This is the core execution engine that drives
 * the agent's reasoning-action cycle.
 *
 * The AgentLoop implements a while loop:
 *   1. Budget check — verify we haven't exceeded token/turn limits
 *   2. Resolve tools — get the tool set for this turn
 *   3. Provider call — send messages to the Z.AI LLM
 *   4. Tool execution — run any tools the model requested
 *   5. Repeat — if the model used tools, loop back
 *
 * Features:
 *   - Sequential execution with cooldown buffers (concurrency = 1)
 *   - Streaming SSE support with typed events
 *   - Tool execution pipeline with permission checking
 *   - Compaction/circuit breaker for context overflow
 *   - "Thinking mode" — emit thinking events before agent work
 *   - Full AgentEvent discriminated union with 15+ event types
 *
 * This module uses the Z.AI provider, cooldown manager, tool registry,
 * permissions, and compaction modules from vellum-core.
 */

import { ZAIProvider, getZAIProvider } from './z-ai-provider';
import { CooldownManager, getCooldownManager } from './cooldown-manager';
import { CompactionCircuit, compactMessages, midLoopCompact, type CompactionMessage } from './compaction';
import { getToolRegistry, type ToolRegistry } from './tool-registry';
import { checkPermission, type DefaultApprovalPolicy } from './permissions';
import type {
  AgentLoopConfig,
  AgentLoopExitReason,
  AgentEvent,
  AgentLoopRunResult,
  AgentMessage,
  Tool,
  ToolContext,
  RiskLevel,
  VellumAgentPersona,
} from './types';

// ============================================================
// Default Configuration
// ============================================================

const DEFAULT_CONFIG: AgentLoopConfig = {
  maxTokens: 8192,
  maxInputTokens: 32768,
  thinking: { enabled: true, budgetTokens: 2048 },
  effort: 'high',
  minTurnIntervalMs: 150,
  maxToolTurns: 25,
  emitThinkingEvents: true,
  primaryModel: 'glm-4.7-flash',
  fallbackModel: 'glm-4.6v-flash',
};

/** Fraction of the context budget at which mid-loop compaction triggers */
const MID_LOOP_YIELD_THRESHOLD_RATIO = 0.85;

/** Token estimation: ~4 characters per token */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ============================================================
// AgentLoopRunOptions
// ============================================================

/** Options for a single AgentLoop run */
export interface AgentLoopRunOptions {
  /** Input messages the run starts from */
  messages: AgentMessage[];
  /** Event callback for streaming events */
  onEvent: (event: AgentEvent) => void | Promise<void>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Unique request ID for tracking */
  requestId?: string;
  /** System prompt override for this run */
  systemPrompt?: string;
  /** Working directory for file operations */
  workingDir?: string;
  /** Conversation ID for compaction circuit scoping */
  conversationId?: string;
  /** Whether to enable mid-loop compaction */
  compactInPlace?: boolean;
  /** Trust rules for permission checking */
  trustRules?: import('./types').TrustRule[];
  /** Optional permission policy override */
  permissionPolicy?: DefaultApprovalPolicy;
}

// ============================================================
// AgentLoop Class
// ============================================================

/**
 * Core agent execution loop adapted from Vellum Assistant.
 *
 * The loop drives the agent's reasoning-action cycle:
 *   budget check → resolve tools → provider call → tool execution → repeat
 *
 * Each iteration:
 * 1. Checks abort signal and budget constraints
 * 2. Resolves the tool set for this turn
 * 3. Calls the Z.AI LLM provider with streaming
 * 4. Processes the response — emits text/thinking deltas
 * 5. Executes any tool calls the model requested
 * 6. Appends tool results and loops back if tools were used
 *
 * The loop exits when:
 * - The model produces no tool calls (natural completion)
 * - The abort signal is triggered
 * - The maximum tool-use turn limit is reached
 * - Context overflow is unrecoverable
 * - An unrecoverable error occurs
 */
export class AgentLoop {
  private readonly provider: ZAIProvider;
  private readonly cooldownManager: CooldownManager;
  private readonly toolRegistry: ToolRegistry;
  private readonly config: AgentLoopConfig;
  private readonly systemPrompt: string;

  /** Per-conversation compaction circuit breaker */
  readonly compactionCircuit: CompactionCircuit;

  constructor(options: {
    provider?: ZAIProvider;
    cooldownManager?: CooldownManager;
    toolRegistry?: ToolRegistry;
    systemPrompt?: string;
    config?: Partial<AgentLoopConfig>;
    conversationId?: string;
  }) {
    this.provider = options.provider || getZAIProvider();
    this.cooldownManager = options.cooldownManager || getCooldownManager();
    this.toolRegistry = options.toolRegistry || getToolRegistry();
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.systemPrompt = options.systemPrompt || 'You are LeadReach AI, a B2B lead generation assistant. Help users research companies, find contacts, analyze markets, build ICPs, score leads, and compose outreach messages.';

    const conversationId = options.conversationId || `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.compactionCircuit = new CompactionCircuit(conversationId);
  }

  /**
   * Run the agent loop until completion or exit.
   *
   * This is the main entry point for executing the agent.
   * It streams AgentEvent objects through the onEvent callback
   * and returns an AgentLoopRunResult when finished.
   */
  async run(options: AgentLoopRunOptions): Promise<AgentLoopRunResult> {
    const {
      messages,
      onEvent,
      signal,
      requestId,
      systemPrompt,
      workingDir = '/tmp/leadreach',
      compactInPlace = false,
      trustRules,
      permissionPolicy,
    } = options;

    const startTime = Date.now();
    let history = [...messages];
    let newMessagesStart = history.length;
    let toolUseTurns = 0;
    let totalTokensUsed = 0;
    let exitReason: AgentLoopExitReason | null = null;
    let lastLlmCallTime = 0;

    // Idempotency guard for exit reason emission
    let exitReasonEmitted = false;
    const emitExit = async (reason: AgentLoopExitReason): Promise<void> => {
      if (exitReasonEmitted) return;
      exitReasonEmitted = true;
      exitReason = reason;
      await onEvent({ type: 'agent_loop_exit', reason });
    };

    // ── Main Loop ────────────────────────────────────────────
    while (true) {
      // Step 0: Check abort signal
      if (signal?.aborted) {
        await emitExit('aborted');
        break;
      }

      // Step 1: Budget check — verify we haven't exceeded limits
      if (toolUseTurns >= (this.config.maxToolTurns || 25)) {
        await emitExit('max_tool_turns');
        break;
      }

      // Step 2: Emit thinking event before agent work
      if (this.config.emitThinkingEvents && toolUseTurns === 0) {
        await onEvent({
          type: 'thinking_delta',
          thinking: `[LeadReach Agent] Starting pipeline iteration ${toolUseTurns + 1}...`,
        });
      }

      // Step 3: Resolve tools for this turn
      const tools = this.toolRegistry.getAllTools();
      const toolDefsForAPI = this.toolRegistry.getToolDefinitionsForAPI();

      // Step 4: Check for mid-loop compaction
      if (compactInPlace) {
        const compactionMessages = this.historyToCompactionMessages(history);
        const currentTokens = this.estimateHistoryTokens(compactionMessages);
        const maxInputTokens = this.config.maxInputTokens || 32768;
        const threshold = maxInputTokens * MID_LOOP_YIELD_THRESHOLD_RATIO;

        if (currentTokens > threshold) {
          const compacted = await midLoopCompact(
            compactionMessages,
            maxInputTokens,
            this.compactionCircuit,
            onEvent,
          );

          if (compacted) {
            history = this.compactionMessagesToHistory(history, compacted);
            newMessagesStart = Math.min(newMessagesStart, history.length);
          }
        }
      }

      // Step 5: Provider call with streaming
      await onEvent({ type: 'llm_call_started', callSite: 'agent_loop' });

      let assistantContent = '';
      let assistantReasoning = '';
      let toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
      let providerDurationMs = 0;
      let callError: Error | null = null;

      const providerStart = Date.now();

      try {
        // Build messages for the provider
        const providerMessages = this.buildProviderMessages(history, systemPrompt);

        const stream = this.provider.chat(providerMessages, {
          model: this.config.primaryModel,
          maxTokens: this.config.maxTokens,
          temperature: 0.3,
          thinking: this.config.thinking,
          tools: toolDefsForAPI.length > 0 ? toolDefsForAPI : undefined,
          toolChoice: toolDefsForAPI.length > 0 ? 'auto' : undefined,
          signal,
          requestId,
        });

        for await (const event of stream) {
          switch (event.type) {
            case 'text_delta':
              assistantContent += event.text;
              await onEvent({ type: 'text_delta', text: event.text });
              break;

            case 'thinking_delta':
              assistantReasoning += event.thinking;
              await onEvent({ type: 'thinking_delta', thinking: event.thinking });
              break;

            case 'tool_use':
              toolCalls.push({
                id: event.id,
                name: event.name,
                input: event.input,
              });
              await onEvent({
                type: 'tool_use',
                id: event.id,
                name: event.name,
                input: event.input,
              });
              break;

            case 'usage':
              totalTokensUsed += event.inputTokens + event.outputTokens;
              providerDurationMs = Date.now() - providerStart;
              await onEvent({
                type: 'usage',
                inputTokens: event.inputTokens,
                outputTokens: event.outputTokens,
                model: event.model,
                providerDurationMs,
              });
              break;

            case 'error':
              callError = new Error(event.error);
              await onEvent({ type: 'provider_error', error: callError, provider: 'z-ai' });
              break;

            case 'done':
              // Stream completed
              break;
          }
        }
      } catch (error) {
        callError = error instanceof Error ? error : new Error(String(error));
        await onEvent({ type: 'provider_error', error: callError, provider: 'z-ai' });
      }

      providerDurationMs = Date.now() - providerStart;

      // Step 6: Check for provider error
      if (callError) {
        if (signal?.aborted) {
          await emitExit('aborted');
          break;
        }

        // Check for context overflow
        if (callError.message.includes('context') || callError.message.includes('token limit')) {
          await emitExit('context_too_large');
          break;
        }

        // Generic error — end the loop
        await emitExit('error');
        break;
      }

      // Step 7: Build assistant message
      const assistantMessage: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: 'assistant',
        content: assistantContent,
        reasoningContent: assistantReasoning || undefined,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        timestamp: Date.now(),
      };

      history.push(assistantMessage);

      // Step 8: Check for tool calls
      if (toolCalls.length === 0) {
        // No tool calls — natural completion
        await onEvent({
          type: 'message_complete',
          content: assistantContent,
          role: 'assistant',
        });
        await emitExit('no_tool_calls');
        break;
      }

      // Step 9: Execute tools
      const toolResults: Array<{ toolUseId: string; content: string; isError: boolean }> = [];

      for (const toolCall of toolCalls) {
        if (signal?.aborted) {
          toolResults.push({
            toolUseId: toolCall.id,
            content: 'Cancelled by user',
            isError: true,
          });
          continue;
        }

        // Step 9a: Permission check
        const permResult = permissionPolicy
          ? permissionPolicy.checkPermission(toolCall.name, toolCall.input, workingDir, trustRules)
          : checkPermission(toolCall.name, toolCall.input, workingDir, trustRules);

        if (!permResult.allowed) {
          const denialContent = permResult.approvalRequired
            ? `Tool "${toolCall.name}" requires approval: ${permResult.reason}`
            : `Tool "${toolCall.name}" is not allowed: ${permResult.reason}`;

          toolResults.push({
            toolUseId: toolCall.id,
            content: denialContent,
            isError: true,
          });

          await onEvent({
            type: 'tool_result',
            toolUseId: toolCall.id,
            content: denialContent,
            isError: true,
            riskLevel: permResult.riskLevel,
            riskReason: permResult.reason,
          });
          continue;
        }

        // Step 9b: Execute the tool
        const toolContext: ToolContext = {
          conversationId: this.compactionCircuit.conversationId,
          workingDir,
          requestId: requestId || '',
          signal: signal || new AbortController().signal,
          onOutput: async (chunk: string) => {
            await onEvent({ type: 'tool_output_chunk', toolUseId: toolCall.id, chunk });
          },
        };

        try {
          const result = await this.toolRegistry.executeTool(
            toolCall.name,
            toolCall.input,
            toolContext,
          );

          toolResults.push({
            toolUseId: toolCall.id,
            content: result.content,
            isError: result.isError,
          });

          await onEvent({
            type: 'tool_result',
            toolUseId: toolCall.id,
            content: result.content,
            isError: result.isError,
            riskLevel: result.riskLevel,
            riskReason: result.riskReason,
          });

          // Check if the tool wants to yield to the user
          if (result.yieldToUser) {
            await emitExit('yield_to_user');
            break;
          }
        } catch (toolError) {
          const errorMsg = toolError instanceof Error ? toolError.message : 'Unknown tool error';
          toolResults.push({
            toolUseId: toolCall.id,
            content: `Tool execution error: ${errorMsg}`,
            isError: true,
          });

          await onEvent({
            type: 'tool_result',
            toolUseId: toolCall.id,
            content: `Tool execution error: ${errorMsg}`,
            isError: true,
          });
        }
      }

      // Step 10: Append tool results as user message
      const toolResultMessage: AgentMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role: 'user',
        content: '',
        toolResults,
        timestamp: Date.now(),
      };

      history.push(toolResultMessage);

      // Step 11: Enforce minimum turn interval
      const now = Date.now();
      const elapsed = now - lastLlmCallTime;
      const minInterval = this.config.minTurnIntervalMs || 150;
      if (elapsed < minInterval && lastLlmCallTime > 0) {
        await new Promise(r => setTimeout(r, minInterval - elapsed));
      }
      lastLlmCallTime = Date.now();

      toolUseTurns++;

      // Check if we should exit due to yield
      if (exitReason === 'yield_to_user') {
        break;
      }
    }

    // ── Build Result ─────────────────────────────────────────
    const newMessages = history.slice(newMessagesStart);

    return {
      history,
      exitReason,
      newMessages,
      totalTokensUsed,
      toolUseTurns,
      durationMs: Date.now() - startTime,
    };
  }

  // ── Private Helpers ────────────────────────────────────────

  /**
   * Build the messages array for the Z.AI provider.
   * Prepends the system prompt as the first message.
   */
  private buildProviderMessages(
    history: AgentMessage[],
    customSystemPrompt?: string,
  ): Array<{ role: string; content: string }> {
    const systemPrompt = customSystemPrompt || this.systemPrompt;
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    for (const msg of history) {
      // Skip system messages (we add our own)
      if (msg.role === 'system') continue;

      // Build the content string
      let content = msg.content;

      // Include tool results
      if (msg.toolResults && msg.toolResults.length > 0) {
        const resultParts = msg.toolResults.map(r => {
          const status = r.isError ? '❌ Error' : '✅ Success';
          return `[Tool Result ${status}]: ${r.content.slice(0, 2000)}`;
        });
        content = content || resultParts.join('\n\n');
      }

      if (content) {
        messages.push({ role: msg.role, content });
      }
    }

    return messages;
  }

  /**
   * Convert AgentMessage[] to CompactionMessage[] for compaction.
   */
  private historyToCompactionMessages(history: AgentMessage[]): CompactionMessage[] {
    return history.map(msg => ({
      role: msg.role,
      content: msg.content,
      reasoningContent: msg.reasoningContent,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));
  }

  /**
   * Convert compacted CompactionMessage[] back to AgentMessage[],
   * preserving the original message IDs and structure where possible.
   */
  private compactionMessagesToHistory(
    originalHistory: AgentMessage[],
    compacted: CompactionMessage[],
  ): AgentMessage[] {
    return compacted.map((msg, idx) => ({
      id: `msg-compacted-${idx}`,
      role: msg.role,
      content: msg.content,
      reasoningContent: msg.reasoningContent,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      timestamp: msg.timestamp,
      metadata: msg.metadata,
    }));
  }

  /**
   * Estimate the total tokens for a history of messages.
   */
  private estimateHistoryTokens(messages: CompactionMessage[]): number {
    let total = 0;
    for (const msg of messages) {
      total += estimateTokens(msg.content);
      if (msg.reasoningContent) total += estimateTokens(msg.reasoningContent);
      if (msg.toolCalls) {
        for (const tc of msg.toolCalls) {
          total += estimateTokens(JSON.stringify(tc.input));
        }
      }
      if (msg.toolResults) {
        for (const tr of msg.toolResults) {
          total += estimateTokens(tr.content);
        }
      }
    }
    return total;
  }
}
