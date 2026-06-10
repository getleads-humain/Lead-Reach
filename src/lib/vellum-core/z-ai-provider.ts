/**
 * Vellum Core — Z.AI LLM Provider
 *
 * Streaming LLM provider for the Vellum AgentLoop that communicates
 * with Z.AI's OpenAI-compatible API (glm-4.7-flash / glm-4.6v-flash).
 *
 * Key features:
 *   - AsyncGenerator-based streaming (SSE parsing)
 *   - Per-model cooldown via CooldownManager (concurrency = 1)
 *   - Rate limit error detection (codes 1302, 1303, 1305, 1308, 1312)
 *   - Automatic retry with exponential backoff
 *   - Token usage tracking
 *   - Thinking/reasoning mode support
 *   - Model health tracking with cooldown after consecutive 429s
 *
 * This provider is used by the AgentLoop (agent-loop.ts) and is the
 * Vellum-adapted equivalent of LeadReach's llm.ts module.
 */

import { CooldownManager, getCooldownManager } from './cooldown-manager';
import type { ZAIChatOptions, ZAIStreamEvent, ZAIUsage } from './types';

// ============================================================
// Configuration
// ============================================================

/** Z.AI API base URL — OpenAI-compatible endpoint */
const ZAI_BASE_URL = 'https://api.z.ai/api/paas/v4/';

/** Z.AI API key for authentication */
const ZAI_API_KEY = 'c68cdeade96b45fa8bf45fbd487707b2.cgpoWSZ5Ae8BHEdO';

/** Primary model for LeadReach AI */
export const ZAI_MODEL_PRIMARY = 'glm-4.7-flash' as const;

/** Fallback model when primary is rate-limited */
export const ZAI_MODEL_FALLBACK = 'glm-4.6v-flash' as const;

/** All available Z.AI models */
export const ZAI_MODELS = [ZAI_MODEL_PRIMARY, ZAI_MODEL_FALLBACK] as const;

/** Z.AI model type */
export type ZAIModel = typeof ZAI_MODELS[number];

/** Default timeout for API requests (90 seconds) */
const DEFAULT_TIMEOUT_MS = 90_000;

/** Maximum number of retries per model */
const MAX_RETRIES = 3;

/** Base backoff time for exponential backoff (2 seconds) */
const BASE_BACKOFF_MS = 2000;

/** Maximum backoff time (30 seconds) */
const MAX_BACKOFF_MS = 30_000;

/** Z.AI rate limit error codes */
const RATE_LIMIT_ERROR_CODES = new Set([1302, 1303, 1305, 1308, 1312]);

/** Thinking budget presets */
const THINKING_BUDGETS = {
  quick: 1024,
  standard: 2048,
  deep: 4096,
} as const;

type ThinkingBudget = keyof typeof THINKING_BUDGETS;

// ============================================================
// Model Health Tracker
// ============================================================

interface ModelHealth {
  last429At: number;
  consecutive429s: number;
  cooldownUntil: number;
}

const modelHealthMap: Map<string, ModelHealth> = new Map();

/** Cooldown after consecutive 429 errors (30 seconds) */
const COOLDOWN_AFTER_429_MS = 30_000;

/** Maximum consecutive 429s before triggering model cooldown */
const MAX_CONSECUTIVE_429S = 3;

function isModelInCooldown(model: string): boolean {
  const health = modelHealthMap.get(model);
  if (!health) return false;
  return Date.now() < health.cooldownUntil;
}

function record429(model: string): void {
  const health = modelHealthMap.get(model) || { last429At: 0, consecutive429s: 0, cooldownUntil: 0 };
  health.last429At = Date.now();
  health.consecutive429s += 1;
  if (health.consecutive429s >= MAX_CONSECUTIVE_429S) {
    health.cooldownUntil = Date.now() + COOLDOWN_AFTER_429_MS;
    console.warn(`[ZAIProvider] Model ${model} hit ${health.consecutive429s} consecutive 429s — cooldown for ${COOLDOWN_AFTER_429_MS / 1000}s`);
  }
  modelHealthMap.set(model, health);
}

function recordModelSuccess(model: string): void {
  const health = modelHealthMap.get(model);
  if (health) {
    health.consecutive429s = 0;
    health.cooldownUntil = 0;
  }
}

// ============================================================
// SSE Stream Parser
// ============================================================

/**
 * Parse an SSE stream from the Z.AI API and yield typed events.
 * Handles the OpenAI-compatible streaming format:
 *   data: {"choices":[{"delta":{"content":"text"}}]}
 *   data: [DONE]
 */
async function* parseSSEStream(
  response: Response,
): AsyncGenerator<ZAIStreamEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    yield { type: 'error', error: 'No response body' };
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let currentModel = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue; // Skip empty/comments

        if (trimmed === 'data: [DONE]') {
          yield { type: 'done', stopReason: 'stop' };
          if (currentModel && (totalInputTokens > 0 || totalOutputTokens > 0)) {
            yield {
              type: 'usage',
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              model: currentModel,
            };
          }
          return;
        }

        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            yield* processStreamEvent(event, (model, input, output) => {
              currentModel = model || currentModel;
              totalInputTokens += input;
              totalOutputTokens += output;
            });
          } catch {
            // Malformed JSON — skip this event
            console.warn('[ZAIProvider] Failed to parse SSE event:', jsonStr.slice(0, 100));
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Process a single SSE event object and yield typed stream events.
 */
function* processStreamEvent(
  event: Record<string, unknown>,
  onUsage: (model: string, inputTokens: number, outputTokens: number) => void,
): Generator<ZAIStreamEvent> {
  // Handle usage events
  if (event.usage) {
    const usage = event.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    const model = (event.model as string) || '';
    onUsage(model, usage.prompt_tokens || 0, usage.completion_tokens || 0);
  }

  // Handle choices
  const choices = event.choices as Array<{
    index?: number;
    delta?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
      tool_calls?: Array<{
        index?: number;
        id?: string;
        type?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: string;
  }> | undefined;

  if (!choices) return;

  for (const choice of choices) {
    const delta = choice.delta;
    if (!delta) continue;

    // Text content delta
    if (delta.content) {
      yield { type: 'text_delta', text: delta.content };
    }

    // Thinking/reasoning content delta
    if (delta.reasoning_content) {
      yield { type: 'thinking_delta', thinking: delta.reasoning_content };
    }

    // Tool calls delta
    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        if (tc.id && tc.function?.name) {
          // New tool call start
          try {
            const input = tc.function.arguments
              ? JSON.parse(tc.function.arguments)
              : {};
            yield {
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input,
            };
          } catch {
            yield {
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: {},
            };
          }
        }
      }
    }

    // Finish reason
    if (choice.finish_reason === 'length' || choice.finish_reason === 'max_tokens') {
      yield { type: 'done', stopReason: choice.finish_reason };
    }
  }
}

// ============================================================
// ZAIProvider Class
// ============================================================

/**
 * Z.AI LLM provider that works with the Vellum AgentLoop.
 *
 * Provides a streaming chat interface that yields typed events
 * as they arrive from the Z.AI API. Handles:
 *   - Per-model cooldown management
 *   - Rate limit detection and retry
 *   - Model fallback (primary → fallback)
 *   - Thinking/reasoning mode
 *   - Token usage tracking
 */
export class ZAIProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly cooldownManager: CooldownManager;
  private readonly defaultModel: string;
  private readonly fallbackModel: string;

  /** Accumulated token usage across all calls */
  private totalUsage: ZAIUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  constructor(options?: {
    baseUrl?: string;
    apiKey?: string;
    cooldownManager?: CooldownManager;
    defaultModel?: string;
    fallbackModel?: string;
  }) {
    this.baseUrl = options?.baseUrl || ZAI_BASE_URL;
    this.apiKey = options?.apiKey || ZAI_API_KEY;
    this.cooldownManager = options?.cooldownManager || getCooldownManager();
    this.defaultModel = options?.defaultModel || ZAI_MODEL_PRIMARY;
    this.fallbackModel = options?.fallbackModel || ZAI_MODEL_FALLBACK;
  }

  /**
   * Streaming chat completion via Z.AI API.
   * Returns an AsyncGenerator that yields ZAIStreamEvent objects.
   *
   * Handles:
   *   - Per-model cooldown via CooldownManager
   *   - Rate limit detection and exponential backoff retry
   *   - Model fallback when primary is rate-limited
   *   - Thinking/reasoning mode with budget tokens
   */
  async *chat(
    messages: Array<{ role: string; content: string }>,
    options?: ZAIChatOptions,
  ): AsyncGenerator<ZAIStreamEvent> {
    const model = options?.model || this.defaultModel;
    const modelsToTry = this.buildModelList(model);

    for (const currentModel of modelsToTry) {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          // Wait for cooldown slot
          await this.cooldownManager.waitForKey(currentModel);

          try {
            // Build the request
            const url = `${this.baseUrl}chat/completions`;
            const body = this.buildRequestBody(currentModel, messages, options);

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
              },
              body: JSON.stringify(body),
              signal: options?.signal || AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
            });

            // Handle rate limit responses
            if (response.status === 429) {
              record429(currentModel);
              lastError = new Error(`Rate limit hit for ${currentModel} (429)`);
              const backoffMs = this.calculateBackoff(attempt);
              console.warn(`[ZAIProvider] 429 on ${currentModel}, attempt ${attempt + 1}, backing off ${backoffMs}ms`);
              await new Promise(r => setTimeout(r, backoffMs));
              continue;
            }

            // Handle rate limit error codes in the response body
            if (response.ok) {
              // Check for rate limit error codes in the response
              const contentType = response.headers.get('content-type') || '';
              if (contentType.includes('text/event-stream')) {
                // Streaming response — parse SSE events
                recordModelSuccess(currentModel);
                let modelUsed = currentModel;
                for await (const event of parseSSEStream(response)) {
                  if (event.type === 'usage') {
                    this.recordUsage(event.inputTokens, event.outputTokens);
                  }
                  yield event;
                }
                return; // Success — exit the function
              } else {
                // Non-streaming response (shouldn't happen with stream: true, but handle it)
                recordModelSuccess(currentModel);
                const data = await response.json();
                yield* this.processNonStreamingResponse(data);
                return;
              }
            }

            // Handle other error statuses
            const errorText = await response.text().catch(() => 'Unknown error');

            // Check for rate limit error codes in the error body
            if (this.isRateLimitErrorCode(errorText)) {
              record429(currentModel);
              lastError = new Error(`Rate limit error for ${currentModel}: ${errorText.slice(0, 200)}`);
              const backoffMs = this.calculateBackoff(attempt);
              console.warn(`[ZAIProvider] Rate limit error on ${currentModel}, attempt ${attempt + 1}, backing off ${backoffMs}ms`);
              await new Promise(r => setTimeout(r, backoffMs));
              continue;
            }

            // Non-rate-limit error — throw
            throw new Error(`API request failed with status ${response.status}: ${errorText.slice(0, 200)}`);
          } finally {
            this.cooldownManager.releaseKey(currentModel);
          }
        } catch (error) {
          this.cooldownManager.releaseKey(currentModel);

          if (error instanceof Error && error.name === 'AbortError') {
            yield { type: 'done', stopReason: 'aborted' };
            return;
          }

          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[ZAIProvider] ${currentModel} attempt ${attempt + 1} failed: ${lastError.message.slice(0, 200)}`);

          // Don't retry on non-transient errors
          if (this.isNonRetryableError(lastError)) {
            break;
          }

          if (attempt < MAX_RETRIES - 1) {
            const backoffMs = this.calculateBackoff(attempt);
            await new Promise(r => setTimeout(r, backoffMs));
          }
        }
      }

      // Model exhausted all retries — try fallback
      if (lastError) {
        console.warn(`[ZAIProvider] ${currentModel} exhausted all retries: ${lastError.message.slice(0, 150)}`);
      }
    }

    // All models failed
    yield {
      type: 'error',
      error: 'All models failed — primary and fallback both unavailable',
    };
  }

  /**
   * Get the accumulated token usage across all calls.
   */
  getUsage(): ZAIUsage {
    return { ...this.totalUsage };
  }

  /**
   * Reset the accumulated token usage.
   */
  resetUsage(): void {
    this.totalUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }

  /**
   * Check if a specific model is currently available
   * (not in cooldown from consecutive 429s).
   */
  isModelAvailable(model: string): boolean {
    return !isModelInCooldown(model);
  }

  // ── Private Helpers ────────────────────────────────────────

  /**
   * Build the list of models to try, skipping those in cooldown.
   */
  private buildModelList(preferredModel: string): string[] {
    const models: string[] = [];

    if (!isModelInCooldown(preferredModel)) {
      models.push(preferredModel);
    } else {
      console.warn(`[ZAIProvider] Skipping ${preferredModel} — in 429 cooldown`);
    }

    // Add fallback if different from preferred
    const fallback = preferredModel === this.defaultModel
      ? this.fallbackModel
      : this.defaultModel;

    if (!models.includes(fallback) && !isModelInCooldown(fallback)) {
      models.push(fallback);
    }

    // If all models in cooldown, force primary anyway
    if (models.length === 0) {
      console.warn('[ZAIProvider] All models in cooldown — attempting primary anyway');
      models.push(this.defaultModel);
    }

    return models;
  }

  /**
   * Build the request body for the Z.AI chat completions API.
   */
  private buildRequestBody(
    model: string,
    messages: Array<{ role: string; content: string }>,
    options?: ZAIChatOptions,
  ): Record<string, unknown> {
    const thinkingBudget = options?.thinking?.enabled
      ? (options.thinking.budgetTokens || THINKING_BUDGETS.standard)
      : THINKING_BUDGETS.standard;

    const maxTokens = options?.maxTokens || 4096;
    // Ensure max_tokens is always at least budget + 500
    const effectiveMaxTokens = Math.max(maxTokens, thinkingBudget + 500);

    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: effectiveMaxTokens,
      stream: true,
      thinking: {
        type: options?.thinking?.enabled ? 'enabled' : 'enabled', // Always enable for clean content
        budget_tokens: thinkingBudget,
      },
    };

    // Add tools if provided
    if (options?.tools && options.tools.length > 0) {
      body.tools = options.tools;
      body.tool_choice = options.toolChoice || 'auto';
    }

    return body;
  }

  /**
   * Process a non-streaming response and yield events.
   */
  private* processNonStreamingResponse(data: Record<string, unknown>): Generator<ZAIStreamEvent> {
    const choices = data.choices as Array<{
      message?: {
        content?: string;
        reasoning_content?: string;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
      finish_reason?: string;
    }> | undefined;

    if (!choices || choices.length === 0) {
      yield { type: 'error', error: 'No choices in response' };
      return;
    }

    const choice = choices[0];
    const message = choice.message;

    if (message) {
      // Emit thinking content
      if (message.reasoning_content) {
        yield { type: 'thinking_delta', thinking: message.reasoning_content };
      }

      // Emit text content
      if (message.content) {
        yield { type: 'text_delta', text: message.content };
      }

      // Emit tool calls
      if (message.tool_calls) {
        for (const tc of message.tool_calls) {
          try {
            const input = JSON.parse(tc.function.arguments);
            yield {
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input,
            };
          } catch {
            yield {
              type: 'tool_use',
              id: tc.id,
              name: tc.function.name,
              input: {},
            };
          }
        }
      }
    }

    // Emit usage
    if (data.usage) {
      const usage = data.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      this.recordUsage(usage.prompt_tokens || 0, usage.completion_tokens || 0);
      yield {
        type: 'usage',
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        model: (data.model as string) || '',
      };
    }

    yield { type: 'done', stopReason: choice.finish_reason || 'stop' };
  }

  /**
   * Calculate exponential backoff time for the given retry attempt.
   */
  private calculateBackoff(attempt: number): number {
    const backoff = Math.min(
      BASE_BACKOFF_MS * Math.pow(2, attempt),
      MAX_BACKOFF_MS,
    );
    // Add jitter (±25%)
    const jitter = backoff * 0.25 * (2 * Math.random() - 1);
    return Math.round(backoff + jitter);
  }

  /**
   * Check if an error body contains a Z.AI rate limit error code.
   */
  private isRateLimitErrorCode(errorText: string): boolean {
    try {
      const data = JSON.parse(errorText);
      const code = data.error?.code || data.code;
      if (typeof code === 'number' && RATE_LIMIT_ERROR_CODES.has(code)) {
        return true;
      }
    } catch { /* not JSON */ }
    // Also check for common rate limit strings
    return errorText.includes('429') ||
      errorText.includes('Too many requests') ||
      errorText.includes('rate limit') ||
      errorText.includes('速率限制');
  }

  /**
   * Check if an error is non-retryable (e.g., auth errors, quota exhaustion).
   */
  private isNonRetryableError(error: Error): boolean {
    const msg = error.message;
    return msg.includes('401') ||
      msg.includes('403') ||
      msg.includes('insufficient') ||
      msg.includes('余额不足') ||
      msg.includes('quota');
  }

  /**
   * Record token usage for tracking.
   */
  private recordUsage(inputTokens: number, outputTokens: number): void {
    this.totalUsage.promptTokens += inputTokens;
    this.totalUsage.completionTokens += outputTokens;
    this.totalUsage.totalTokens += inputTokens + outputTokens;
  }
}

// ============================================================
// Global Singleton
// ============================================================

let globalProvider: ZAIProvider | null = null;

/**
 * Get the global ZAIProvider singleton.
 * Creates one on first access with default configuration.
 */
export function getZAIProvider(): ZAIProvider {
  if (!globalProvider) {
    globalProvider = new ZAIProvider();
  }
  return globalProvider;
}

/**
 * Reset the global ZAIProvider (primarily for testing).
 */
export function resetZAIProvider(): void {
  globalProvider = null;
  modelHealthMap.clear();
}
