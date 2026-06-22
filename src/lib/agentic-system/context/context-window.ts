/**
 * Context Window Manager
 * ======================
 *
 * Tracks token usage across a pipeline run and decides what to keep,
 * compress, or evict when the conversation + agent state exceeds the
 * model's context budget.
 *
 * LeadReach uses Z.AI GLM models (glm-4.7-flash primary, glm-4.6v-flash
 * fallback). Their context windows are large but not infinite, so we
 * proactively manage what goes into each LLM call.
 *
 * Strategy:
 *   1. System prompt + SOP spec — always retained (highest priority)
 *   2. Current user message — always retained
 *   3. Most recent agent outputs — kept in full
 *   4. Older agent outputs — compressed to 1-line summaries
 *   5. Conversation history older than N turns — evicted
 *
 * This module is INERT by default — the orchestrator doesn't have to
 * use it. It's available to the harness and to future refactors.
 */

// ============================================================
// Token Budget Types
// ============================================================

export interface ContextWindowConfig {
  /** Maximum tokens the model accepts in a single call. */
  maxTokens: number;
  /** Tokens reserved for the model's response. */
  reservedForOutput: number;
  /** Tokens reserved for the system prompt + SOP. */
  reservedForSystem: number;
  /** Maximum turns of conversation history to retain in full. */
  maxRecentTurns: number;
  /** Maximum tokens per agent output before compression kicks in. */
  maxTokensPerAgentOutput: number;
}

export const DEFAULT_CONTEXT_CONFIG: ContextWindowConfig = {
  // GLM-4.7-flash supports 128K context but we keep a conservative budget
  // so we never get close to the limit and leave room for the response.
  maxTokens: 32_000,
  reservedForOutput: 4_096,
  reservedForSystem: 2_048,
  maxRecentTurns: 6,
  maxTokensPerAgentOutput: 1_500,
};

// ============================================================
// Token Estimation
// ============================================================

/**
 * Rough token estimator — 1 token ≈ 4 chars for English, ≈ 1.5 chars for CJK.
 * This is intentionally simple; the real count comes from the model's tokenizer
 * but we don't have one in-process for GLM. This is a conservative over-estimate
 * to avoid overshooting the budget.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Count CJK chars separately (they consume more tokens)
  const cjkCount = (text.match(/[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) || []).length;
  const otherChars = text.length - cjkCount;
  return Math.ceil(cjkCount / 1.5 + otherChars / 4);
}

// ============================================================
// Context Item Types
// ============================================================

export type ContextItemRole = 'system' | 'user' | 'assistant' | 'tool' | 'agent_output';

export interface ContextItem {
  id: string;
  role: ContextItemRole;
  content: string;
  /** Estimated token count (cached). */
  tokens: number;
  /** Priority — higher = more likely to be retained. */
  priority: number;
  /** When this item was added (for age-based eviction). */
  addedAt: number;
  /** Optional agent name that produced this item. */
  agent?: string;
  /** Whether this item can be compressed. */
  compressible: boolean;
}

// ============================================================
// Context Window Manager
// ============================================================

export class ContextWindowManager {
  private items: ContextItem[] = [];
  private readonly config: ContextWindowConfig;

  constructor(config: Partial<ContextWindowConfig> = {}) {
    this.config = { ...DEFAULT_CONTEXT_CONFIG, ...config };
  }

  /** Add an item to the context window. */
  add(item: Omit<ContextItem, 'tokens' | 'addedAt'>): void {
    this.items.push({
      ...item,
      tokens: estimateTokens(item.content),
      addedAt: Date.now(),
    });
  }

  /** Get the current total token count. */
  totalTokens(): number {
    return this.items.reduce((sum, i) => sum + i.tokens, 0);
  }

  /** Available budget for new items (after system + output reservations). */
  availableTokens(): number {
    const used = this.totalTokens();
    const budget = this.config.maxTokens - this.config.reservedForOutput - this.config.reservedForSystem;
    return Math.max(0, budget - used);
  }

  /**
   * Compress or evict items until the context fits within the budget.
   * Returns the items to send to the model, in priority order.
   */
  compact(): ContextItem[] {
    const budget = this.config.maxTokens - this.config.reservedForOutput - this.config.reservedForSystem;

    // Sort by priority (desc), then by recency (desc)
    const sorted = [...this.items].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.addedAt - a.addedAt;
    });

    let runningTokens = 0;
    const kept: ContextItem[] = [];

    for (const item of sorted) {
      if (runningTokens + item.tokens <= budget) {
        kept.push(item);
        runningTokens += item.tokens;
        continue;
      }
      // Try to compress if allowed
      if (item.compressible && item.tokens > this.config.maxTokensPerAgentOutput) {
        const compressed = compressItem(item, this.config.maxTokensPerAgentOutput);
        if (runningTokens + compressed.tokens <= budget) {
          kept.push(compressed);
          runningTokens += compressed.tokens;
        }
      }
      // Otherwise evict
    }

    // Restore original order before returning
    return kept.sort((a, b) => a.addedAt - b.addedAt);
  }

  /** Get a snapshot of the current window (for debugging / admin UI). */
  snapshot(): { items: ContextItem[]; totalTokens: number; availableTokens: number; budget: number } {
    return {
      items: [...this.items],
      totalTokens: this.totalTokens(),
      availableTokens: this.availableTokens(),
      budget: this.config.maxTokens - this.config.reservedForOutput - this.config.reservedForSystem,
    };
  }

  /** Reset the window (for a new pipeline run). */
  reset(): void {
    this.items = [];
  }
}

// ============================================================
// Compression Helpers
// ============================================================

function compressItem(item: ContextItem, targetTokens: number): ContextItem {
  // Simple truncation with ellipsis — a real implementation would call the
  // LLM to summarize, but that's an extra round-trip we don't want to pay
  // for inside the context manager itself.
  const ratio = targetTokens / item.tokens;
  const targetChars = Math.floor(item.content.length * ratio) - 3;
  const truncated = item.content.slice(0, Math.max(0, targetChars)) + '...';
  return {
    ...item,
    content: truncated,
    tokens: estimateTokens(truncated),
  };
}

// ============================================================
// Singleton (one manager per pipeline run)
// ============================================================

let activeManager: ContextWindowManager | null = null;

export function getActiveContextWindow(): ContextWindowManager {
  if (!activeManager) {
    activeManager = new ContextWindowManager();
  }
  return activeManager;
}

export function resetActiveContextWindow(): void {
  if (activeManager) {
    activeManager.reset();
    activeManager = null;
  }
}
