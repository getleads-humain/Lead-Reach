/**
 * Compaction — Conversation Summarization
 *
 * Provides LLM-powered summarization of conversation histories.
 * Used to compact long conversations into concise narrative summaries
 * that can be stored as memory nodes (type: 'narrative').
 *
 * Features:
 *   - LLM-based summarization using the project's callLLM utility
 *   - Circuit breaker pattern for resilience against LLM failures
 *   - Multiple compaction strategies (full summary, key points, action items)
 *   - Fallback to extractive summarization when LLM is unavailable
 */

import { callLLM } from '@/lib/llm';

// ============================================================
// Types
// ============================================================

/**
 * A single message in a conversation.
 */
export interface ConversationMessage {
  /** Message role: user, assistant, or system */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
}

/**
 * The compaction strategy to use.
 */
export type CompactionStrategy =
  | 'full'         // Comprehensive narrative summary
  | 'key-points'   // Bullet-point list of key takeaways
  | 'action-items' // Focus on action items and decisions
  | 'chronological'; // Timeline of events

/**
 * Result of a compaction operation.
 */
export interface CompactionResult {
  /** The summarized content */
  summary: string;
  /** The strategy used */
  strategy: CompactionStrategy;
  /** Number of input messages */
  inputMessageCount: number;
  /** Approximate character count reduction ratio */
  compressionRatio: number;
  /** Whether LLM was used (false = fallback to extractive) */
  usedLLM: boolean;
}

// ============================================================
// Circuit Breaker
// ============================================================

/**
 * Circuit breaker states.
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker for LLM calls.
 *
 * Prevents cascading failures when the LLM service is down:
 *   - CLOSED: Normal operation — LLM calls are allowed
 *   - OPEN: LLM is failing — all calls are short-circuited to fallback
 *   - HALF-OPEN: Testing if LLM has recovered — one call is allowed
 */
class CompactionCircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;

  constructor(
    failureThreshold: number = 3,
    recoveryTimeoutMs: number = 60_000,
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
  }

  /**
   * Check if a call is allowed through the circuit breaker.
   */
  canCall(): boolean {
    if (this.state === 'closed') return true;

    if (this.state === 'open') {
      // Check if recovery timeout has elapsed
      if (Date.now() - this.lastFailureTime > this.recoveryTimeoutMs) {
        this.state = 'half-open';
        return true; // Allow one test call
      }
      return false;
    }

    // half-open: allow one call
    return true;
  }

  /**
   * Record a successful call.
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  /**
   * Record a failed call.
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
    }
  }

  /**
   * Get the current circuit state (for monitoring).
   */
  getState(): CircuitState {
    return this.state;
  }
}

/** Singleton circuit breaker instance */
const circuitBreaker = new CompactionCircuitBreaker();

// ============================================================
// LLM Summarization Prompts
// ============================================================

/**
 * Get the system prompt for the specified compaction strategy.
 */
function getCompactionPrompt(strategy: CompactionStrategy): string {
  const basePrompt = `You are a conversation summarization specialist for a B2B lead generation platform called LeadReach AI.
You are given a conversation between a user and an AI assistant, and you must produce a concise, first-person summary.

Rules:
- Write in first person as the AI assistant ("I researched...", "The user asked about...")
- Preserve all factual details: company names, industries, locations, scores, metrics
- Preserve the chronological order of events
- Remove conversational filler ("Sure!", "I'd be happy to help", etc.)
- Focus on what was discovered, decided, or acted upon
- Keep the summary under 500 words`;

  switch (strategy) {
    case 'full':
      return `${basePrompt}

Produce a comprehensive narrative summary that captures:
1. What the user was looking for
2. What actions were taken (searches, enrichments, qualifications)
3. What results were found
4. What recommendations were made
5. What the user decided or planned next`;

    case 'key-points':
      return `${basePrompt}

Produce a bullet-point list of key takeaways:
- Each point should be a single, factual statement
- Include specific data (company names, scores, etc.)
- Prioritize actionable insights over general observations
- Maximum 10 key points`;

    case 'action-items':
      return `${basePrompt}

Focus exclusively on:
1. Decisions made during the conversation
2. Action items agreed upon
3. Follow-up tasks to be done
4. Next steps the user should take
Format as a numbered list with brief context for each item.`;

    case 'chronological':
      return `${basePrompt}

Produce a timeline of events in chronological order:
- Format: [Event N] Description
- Each event should be one sentence
- Include timestamps if mentioned
- Focus on the progression of the conversation and discoveries`;

    default:
      return basePrompt;
  }
}

// ============================================================
// Extractive Summarization (Fallback)
// ============================================================

/**
 * Simple extractive summarization as a fallback when LLM is unavailable.
 * Selects the most important sentences from the conversation.
 *
 * Strategy:
 *   1. Split each message into sentences
 *   2. Score sentences by length, position, and keyword presence
 *   3. Select top-scoring sentences
 *   4. Reconstruct in order
 */
function extractiveSummarize(
  messages: ConversationMessage[],
  maxSentences: number = 15,
): string {
  interface ScoredSentence {
    text: string;
    score: number;
    messageIndex: number;
    sentenceIndex: number;
  }

  const sentences: ScoredSentence[] = [];

  // Key terms that indicate important content
  const keyTerms = new Set([
    'found', 'discovered', 'qualified', 'scored', 'enriched', 'contacted',
    'company', 'lead', 'industry', 'revenue', 'employees', 'outreach',
    'campaign', 'icp', 'recommend', 'suggest', 'next step', 'action',
    'decision', 'result', 'summary', 'insight', 'opportunity',
  ]);

  for (let msgIdx = 0; msgIdx < messages.length; msgIdx++) {
    const msg = messages[msgIdx];

    // Skip very short system messages
    if (msg.role === 'system' && msg.content.length < 50) continue;

    const msgSentences = msg.content
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    for (let sentIdx = 0; sentIdx < msgSentences.length; sentIdx++) {
      const sentence = msgSentences[sentIdx];
      const lowerSentence = sentence.toLowerCase();

      // Score: keyword presence
      let score = 0;
      for (const term of keyTerms) {
        if (lowerSentence.includes(term)) score += 2;
      }

      // Score: user messages are more important
      if (msg.role === 'user') score += 1;

      // Score: assistant messages with data are important
      if (msg.role === 'assistant' && lowerSentence.includes('found')) score += 2;

      // Score: position bonus (first and last messages)
      if (msgIdx === 0 || msgIdx === messages.length - 1) score += 1;

      // Score: length bonus (moderate length is best)
      if (sentence.length > 50 && sentence.length < 300) score += 1;

      sentences.push({
        text: sentence,
        score,
        messageIndex: msgIdx,
        sentenceIndex: sentIdx,
      });
    }
  }

  // Sort by score, take top N, then re-sort by message order
  const selected = sentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.messageIndex - b.messageIndex || a.sentenceIndex - b.sentenceIndex);

  return selected.map((s) => s.text + '.').join(' ');
}

// ============================================================
// Public API
// ============================================================

/**
 * Compact a conversation into a concise summary.
 *
 * Uses LLM-based summarization with a circuit breaker for resilience.
 * Falls back to extractive summarization when the LLM is unavailable.
 *
 * @param messages  - The conversation messages to compact
 * @param strategy  - The compaction strategy (default: 'full')
 * @returns Compaction result with summary and metadata
 */
export async function compactConversation(
  messages: ConversationMessage[],
  strategy: CompactionStrategy = 'full',
): Promise<CompactionResult> {
  if (messages.length === 0) {
    return {
      summary: '',
      strategy,
      inputMessageCount: 0,
      compressionRatio: 0,
      usedLLM: false,
    };
  }

  // Calculate total input length
  const totalInputLength = messages.reduce((sum, m) => sum + m.content.length, 0);

  // Try LLM summarization if circuit breaker allows
  if (circuitBreaker.canCall()) {
    try {
      const systemPrompt = getCompactionPrompt(strategy);
      const conversationText = messages
        .map((m) => `[${m.role}]: ${m.content}`)
        .join('\n\n');

      // Truncate if too long (LLM context limit)
      const truncatedText =
        conversationText.length > 12000
          ? conversationText.slice(0, 12000) + '\n\n[... conversation truncated for length ...]'
          : conversationText;

      const summary = await callLLM({
        systemPrompt,
        userMessage: `Summarize this conversation:\n\n${truncatedText}`,
        temperature: 0.2,
        maxTokens: 800,
        thinkingBudget: 'standard',
      });

      if (summary && summary.trim().length > 10) {
        circuitBreaker.recordSuccess();

        return {
          summary: summary.trim(),
          strategy,
          inputMessageCount: messages.length,
          compressionRatio: summary.length / totalInputLength,
          usedLLM: true,
        };
      }

      // Empty or too short response — treat as failure
      circuitBreaker.recordFailure();
    } catch (error) {
      console.warn(
        `[Compaction] LLM summarization failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
      circuitBreaker.recordFailure();
    }
  }

  // Fallback: Extractive summarization
  const extractiveSummary = extractiveSummarize(messages);

  return {
    summary: extractiveSummary,
    strategy,
    inputMessageCount: messages.length,
    compressionRatio: extractiveSummary.length / totalInputLength,
    usedLLM: false,
  };
}

/**
 * Compact a conversation and return just the summary string.
 * Convenience wrapper around compactConversation().
 */
export async function compactToSummary(
  messages: ConversationMessage[],
  strategy: CompactionStrategy = 'full',
): Promise<string> {
  const result = await compactConversation(messages, strategy);
  return result.summary;
}

/**
 * Get the current circuit breaker state (for monitoring).
 */
export function getCircuitBreakerState(): CircuitState {
  return circuitBreaker.getState();
}

/**
 * Reset the circuit breaker (for testing or manual recovery).
 */
export function resetCircuitBreaker(): void {
  // The circuit breaker is a singleton — we need to reset its internal state.
  // Since the class is private, we force recovery by recording success.
  circuitBreaker.recordSuccess();
}
