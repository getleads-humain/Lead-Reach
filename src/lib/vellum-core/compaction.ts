/**
 * Vellum Core — Context Compaction with Circuit Breaker
 *
 * Adapted from Vellum Assistant's compaction-circuit.ts and
 * context/compactor.ts for LeadReach AI's agent pipeline.
 *
 * Provides:
 *   - CompactionCircuit: 3-strike circuit breaker for compaction failures
 *   - compactMessages(): Message compaction that reduces context size
 *   - Mid-loop in-place compaction support
 *   - Overflow reduction ladder for context overflow recovery
 *
 * The circuit breaker prevents compaction from running when the
 * summary LLM is failing consecutively — three failures trip a
 * 1-hour cooldown during which auto-compaction is skipped.
 */

import type { AgentEvent } from './types';

// ============================================================
// CompactionCircuit — 3-Strike System
// ============================================================

/** Number of consecutive failures required to trip the breaker */
const CIRCUIT_FAILURE_THRESHOLD = 3;

/** Cooldown window after the breaker trips (1 hour) */
const CIRCUIT_COOLDOWN_MS = 60 * 60 * 1000;

/**
 * Per-conversation compaction circuit breaker.
 *
 * Three consecutive summary-LLM failures trip a one-hour cooldown
 * during which auto-compaction is skipped. Any successful compaction
 * resets the counter. State is in-memory only — resets on process
 * restart, providing "one free retry after restart" behavior.
 *
 * Adapted from Vellum's CompactionCircuit class.
 */
export class CompactionCircuit {
  readonly conversationId: string;
  consecutiveFailures = 0;
  circuitOpenUntil: number | null = null;

  constructor(conversationId: string) {
    this.conversationId = conversationId;
  }

  /**
   * Update the breaker with the outcome of a compaction call.
   *
   * A run of three failures trips the breaker; any success resets
   * both the counter and the cooldown timestamp. Emits transition
   * events when the circuit opens or closes.
   *
   * IMPORTANT: Only call this when the summary LLM actually ran
   * (summaryFailed !== undefined) — early-return paths should not
   * silently reset the 3-strike counter.
   */
  async recordOutcome(
    summaryFailed: boolean,
    onEvent: (event: AgentEvent) => void | Promise<void>,
  ): Promise<void> {
    if (summaryFailed) {
      this.consecutiveFailures += 1;

      // Treat expired open-until as null so new 3-strike windows can re-open
      const circuitDormant =
        this.circuitOpenUntil === null ||
        Date.now() >= this.circuitOpenUntil;

      if (
        this.consecutiveFailures >= CIRCUIT_FAILURE_THRESHOLD &&
        circuitDormant
      ) {
        const openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
        this.circuitOpenUntil = openUntil;
        await onEvent({
          type: 'compaction_circuit_open',
          reason: `${CIRCUIT_FAILURE_THRESHOLD}_consecutive_failures`,
          openUntil,
        });
      }
    } else {
      // Emit only on the open→closed transition
      const wasOpen = this.circuitOpenUntil !== null;
      this.consecutiveFailures = 0;
      this.circuitOpenUntil = null;
      if (wasOpen) {
        await onEvent({ type: 'compaction_circuit_closed' });
      }
    }
  }

  /**
   * Query-only: is the breaker currently open?
   * Auto-compaction paths gate on !isOpen(); forced paths proceed regardless.
   */
  isOpen(): boolean {
    const openUntil = this.circuitOpenUntil;
    return openUntil !== null && Date.now() < openUntil;
  }

  /**
   * Reset the circuit state (for testing or manual recovery).
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.circuitOpenUntil = null;
  }
}

// ============================================================
// Message Compaction
// ============================================================

/** A simplified message format for compaction */
export interface CompactionMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoningContent?: string;
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

/** Result of a compaction operation */
export interface CompactionResult {
  /** The compacted messages */
  messages: CompactionMessage[];
  /** Whether compaction actually reduced the message count */
  compacted: boolean;
  /** Original token count estimate */
  originalTokens: number;
  /** Compacted token count estimate */
  compactedTokens: number;
  /** Whether the summary LLM failed */
  summaryFailed?: boolean;
  /** Whether the overflow reduction ladder is exhausted */
  exhausted?: boolean;
}

/**
 * Rough token estimation: ~4 characters per token for English text.
 * This is a heuristic; the actual tokenizer may differ.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Estimate the total tokens for a list of messages.
 */
function estimateMessageTokens(messages: CompactionMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content);
    if (msg.reasoningContent) {
      total += estimateTokens(msg.reasoningContent);
    }
    if (msg.toolCalls) {
      total += estimateTokens(JSON.stringify(msg.toolCalls));
    }
    if (msg.toolResults) {
      for (const result of msg.toolResults) {
        total += estimateTokens(result.content);
      }
    }
  }
  return total;
}

/**
 * Compact a list of messages to fit within a maximum token budget.
 *
 * Strategy:
 * 1. Always keep the system message (first message) if present
 * 2. Always keep the last N messages (recent context)
 * 3. Summarize older messages into a single compact summary
 * 4. Truncate tool results that are very large
 *
 * This is a synchronous compaction that doesn't require an LLM call
 * (unlike Vellum's full compaction pipeline). It's used as a
 * fallback when the LLM-based compaction fails or when the circuit
 * breaker is open.
 *
 * @param messages - The messages to compact
 * @param maxTokens - Maximum token budget
 * @param options - Compaction options
 * @returns CompactionResult with the compacted messages
 */
export function compactMessages(
  messages: CompactionMessage[],
  maxTokens: number,
  options?: {
    /** Number of recent messages to always preserve (default: 4) */
    preserveRecentCount?: number;
    /** Maximum length for individual tool result content (default: 2000 chars) */
    maxToolResultLength?: number;
    /** Maximum length for the summary of older messages (default: 1000 chars) */
    maxSummaryLength?: number;
  },
): CompactionResult {
  const preserveRecentCount = options?.preserveRecentCount ?? 4;
  const maxToolResultLength = options?.maxToolResultLength ?? 2000;
  const maxSummaryLength = options?.maxSummaryLength ?? 1000;

  const originalTokens = estimateMessageTokens(messages);

  // Step 1: Check if compaction is needed at all
  if (originalTokens <= maxTokens) {
    return {
      messages,
      compacted: false,
      originalTokens,
      compactedTokens: originalTokens,
    };
  }

  // Step 2: Truncate large tool results first (cheapest reduction)
  let processed = messages.map(msg => {
    if (msg.toolResults) {
      const truncatedResults = msg.toolResults.map(result => ({
        ...result,
        content: result.content.length > maxToolResultLength
          ? result.content.slice(0, maxToolResultLength) + '\n...[truncated]'
          : result.content,
      }));
      return { ...msg, toolResults: truncatedResults };
    }
    return msg;
  });

  let currentTokens = estimateMessageTokens(processed);

  if (currentTokens <= maxTokens) {
    return {
      messages: processed,
      compacted: true,
      originalTokens,
      compactedTokens: currentTokens,
    };
  }

  // Step 3: Remove reasoning content from older messages
  const systemMessage = processed[0]?.role === 'system' ? processed[0] : null;
  const nonSystemMessages = systemMessage ? processed.slice(1) : processed;
  const recentMessages = nonSystemMessages.slice(-preserveRecentCount);
  const olderMessages = nonSystemMessages.slice(0, -preserveRecentCount);

  // Strip reasoning from older messages
  const strippedOlder = olderMessages.map(msg => ({
    ...msg,
    reasoningContent: undefined,
  }));

  currentTokens = estimateMessageTokens([
    ...(systemMessage ? [systemMessage] : []),
    ...strippedOlder,
    ...recentMessages,
  ]);

  if (currentTokens <= maxTokens) {
    return {
      messages: [
        ...(systemMessage ? [systemMessage] : []),
        ...strippedOlder,
        ...recentMessages,
      ],
      compacted: true,
      originalTokens,
      compactedTokens: currentTokens,
    };
  }

  // Step 4: Summarize older messages into a single compact summary
  // This is a heuristic summary — not LLM-based
  const summaryParts: string[] = [];
  for (const msg of olderMessages) {
    const roleLabel = msg.role === 'user' ? 'User' : msg.role === 'assistant' ? 'Assistant' : 'System';
    const contentPreview = msg.content.slice(0, 100);
    summaryParts.push(`[${roleLabel}] ${contentPreview}${msg.content.length > 100 ? '...' : ''}`);

    // Mention tool calls
    if (msg.toolCalls && msg.toolCalls.length > 0) {
      const toolNames = msg.toolCalls.map(tc => tc.name).join(', ');
      summaryParts.push(`  Used tools: ${toolNames}`);
    }
  }

  const summaryContent = summaryParts.join('\n').slice(0, maxSummaryLength);

  const summaryMessage: CompactionMessage = {
    role: 'system',
    content: `[Context Summary — ${olderMessages.length} earlier messages compacted]\n${summaryContent}`,
    timestamp: olderMessages[0]?.timestamp || Date.now(),
  };

  const result = [
    ...(systemMessage ? [systemMessage] : []),
    summaryMessage,
    ...recentMessages,
  ];

  currentTokens = estimateMessageTokens(result);

  // Step 5: If still over budget, apply the overflow reduction ladder
  if (currentTokens > maxTokens) {
    return applyOverflowReductionLadder(result, maxTokens, originalTokens);
  }

  return {
    messages: result,
    compacted: true,
    originalTokens,
    compactedTokens: currentTokens,
  };
}

// ============================================================
// Overflow Reduction Ladder
// ============================================================

/**
 * Apply the overflow reduction ladder when compaction alone
 * doesn't reduce the context enough.
 *
 * Rungs (applied in order, each more aggressive):
 * 1. Strip all reasoning content
 * 2. Truncate all tool results to 500 chars
 * 3. Remove tool call inputs (keep only names)
 * 4. Keep only system message + last 2 messages
 * 5. Emergency: keep only system message + last user message
 */
function applyOverflowReductionLadder(
  messages: CompactionMessage[],
  maxTokens: number,
  originalTokens: number,
): CompactionResult {
  let current = [...messages];
  let exhausted = false;

  // Rung 1: Strip all reasoning content
  current = current.map(msg => ({ ...msg, reasoningContent: undefined }));
  if (estimateMessageTokens(current) <= maxTokens) {
    return { messages: current, compacted: true, originalTokens, compactedTokens: estimateMessageTokens(current), exhausted: false };
  }

  // Rung 2: Truncate all tool results to 500 chars
  current = current.map(msg => {
    if (msg.toolResults) {
      return {
        ...msg,
        toolResults: msg.toolResults.map(r => ({
          ...r,
          content: r.content.slice(0, 500) + (r.content.length > 500 ? '...[truncated]' : ''),
        })),
      };
    }
    return msg;
  });
  if (estimateMessageTokens(current) <= maxTokens) {
    return { messages: current, compacted: true, originalTokens, compactedTokens: estimateMessageTokens(current), exhausted: false };
  }

  // Rung 3: Remove tool call inputs (keep only names)
  current = current.map(msg => {
    if (msg.toolCalls) {
      return {
        ...msg,
        toolCalls: msg.toolCalls.map(tc => ({
          ...tc,
          input: {}, // Strip input
        })),
      };
    }
    return msg;
  });
  if (estimateMessageTokens(current) <= maxTokens) {
    return { messages: current, compacted: true, originalTokens, compactedTokens: estimateMessageTokens(current), exhausted: false };
  }

  // Rung 4: Keep only system message + last 2 messages
  const systemMsg = current.find(m => m.role === 'system');
  const lastTwo = current.filter(m => m.role !== 'system').slice(-2);
  current = [...(systemMsg ? [systemMsg] : []), ...lastTwo];
  if (estimateMessageTokens(current) <= maxTokens) {
    return { messages: current, compacted: true, originalTokens, compactedTokens: estimateMessageTokens(current), exhausted: false };
  }

  // Rung 5: Emergency — keep only system message + last user message
  const lastUserMsg = [...current].reverse().find(m => m.role === 'user');
  current = [...(systemMsg ? [systemMsg] : []), ...(lastUserMsg ? [lastUserMsg] : [])];
  exhausted = true;

  return {
    messages: current,
    compacted: true,
    originalTokens,
    compactedTokens: estimateMessageTokens(current),
    exhausted,
  };
}

// ============================================================
// Mid-Loop Compaction Helper
// ============================================================

/**
 * Perform mid-loop in-place compaction on the agent loop's history.
 *
 * This is called by the AgentLoop when the budget gate trips during
 * a running turn. It compacts the messages in place and returns the
 * compacted history to continue from.
 *
 * @param messages - The current conversation history
 * @param maxTokens - The context window token budget
 * @param circuit - The compaction circuit breaker
 * @param onEvent - Event callback for circuit state changes
 * @returns The compacted messages, or null if compaction should be skipped
 */
export async function midLoopCompact(
  messages: CompactionMessage[],
  maxTokens: number,
  circuit: CompactionCircuit,
  onEvent: (event: AgentEvent) => void | Promise<void>,
): Promise<CompactionMessage[] | null> {
  // Check circuit breaker — if open, skip auto-compaction
  if (circuit.isOpen()) {
    console.warn('[Compaction] Circuit breaker is open — skipping auto-compaction');
    return null;
  }

  // Emit compaction start event
  await onEvent({ type: 'context_compacting' });

  // Perform the compaction
  const result = compactMessages(messages, maxTokens);

  // Record the outcome with the circuit breaker
  if (result.summaryFailed !== undefined) {
    await circuit.recordOutcome(result.summaryFailed, onEvent);
  }

  // Emit completion event
  await onEvent({
    type: 'compaction_completed',
    originalTokens: result.originalTokens,
    compactedTokens: result.compactedTokens,
  });

  if (!result.compacted) {
    return null; // No reduction — caller proceeds with original messages
  }

  return result.messages;
}
