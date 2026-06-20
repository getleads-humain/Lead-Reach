/**
 * Centralized LLM Utility — LeadReach AI
 *
 * Uses Z.AI's GLM flash models via JWT-authenticated HTTP API.
 *
 * Model Configuration (LOCKED for lifetime use on this platform):
 *   - glm-4.7-flash   (PRIMARY — fast text/reasoning model, used for all customer-facing text tasks)
 *   - glm-4.6v-flash   (FALLBACK + VISION — multimodal model, used when primary is rate-limited
 *                       AND for any task that requires image understanding / OCR / vision)
 *
 * These two models are the ONLY customer-facing models on the LeadReach platform.
 * Per platform policy, no other model may be invoked from any user-facing code path.
 *
 * IMPORTANT DESIGN NOTES:
 * 1. Z.AI requires JWT authentication. The API key format is
 *    `{id}.{secret}`, converted to a JWT token by zhipu-jwt.ts.
 * 2. GLM flash models use the `thinking` parameter. With
 *    `thinking: {type: "enabled", budget_tokens: N}`, the model separates
 *    reasoning (in `reasoning_content`) from the clean answer (in `content`).
 * 3. We use `thinking: enabled` with a budget to get clean, structured
 *    output in the `content` field while still benefiting from the model's
 *    reasoning capability.
 */

import { getZhipuToken, getZhipuApiBase, isZhipuConfigured, refreshToken } from './zhipu-jwt';
import { fetchIPv4, withRateLimit, markHostRateLimited, isInRateLimitCooldown, getRateLimitCooldownRemaining, exponentialBackoff } from './network-helpers';

// ============================================================
// Model Definitions — LOCKED to {glm-4.7-flash; glm-4.6v-flash}
// ============================================================

/**
 * Primary model — glm-4.7-flash.
 * Fast text + reasoning model. Used for every customer-facing text task
 * (lead scoring, email composition, conversation summaries, forecasts, etc.).
 */
export const MODEL_PRIMARY = 'glm-4.7-flash' as const;

/**
 * Fallback model — glm-4.6v-flash.
 * Multimodal (vision) model. Used in two cases:
 *   1. As a text fallback when glm-4.7-flash is rate-limited / in cooldown.
 *   2. As the primary model for any task that requires image understanding
 *      (logo analysis, screenshot OCR, creative review, etc.) via callLLMVision().
 */
export const MODEL_FALLBACK = 'glm-4.6v-flash' as const;

/**
 * Vision model — glm-4.6v-flash.
 * Same as MODEL_FALLBACK; exported under a separate name for clarity at
 * call sites that explicitly need vision capabilities.
 */
export const MODEL_VISION = 'glm-4.6v-flash' as const;

/** All customer-facing models on the platform (lifetime set). */
export const LLM_MODELS = [MODEL_PRIMARY, MODEL_FALLBACK] as const;

export type LLMModel = typeof LLM_MODELS[number];

// ============================================================
// Thinking Budget Configuration
// ============================================================

/**
 * Thinking budget per request type.
 * Higher budget = more reasoning before answering, but costs more tokens.
 */
const THINKING_BUDGETS = {
  /** Quick responses (intent classification, health checks) — must be >= 1024 to leave tokens for content */
  quick: 1024,
  /** Standard responses (chat, data extraction) */
  standard: 2048,
  /** Complex reasoning (deep research, multi-step analysis) */
  deep: 4096,
} as const;

export type ThinkingBudget = keyof typeof THINKING_BUDGETS;

// ============================================================
// Unified Rate Limiter (shared across ALL API calls)
// ============================================================
//
// IMPORTANT: GLM-4.7-Flash and GLM-4.6V-Flash both have a
// concurrency limit of 1. This means we can only have ONE
// in-flight request at a time per model.
//
// Strategy:
//   - Enforce a minimum interval between consecutive API calls
//   - Add a "deep breath" cooldown buffer after each call completes
//     to ensure we don't overwhelm the rate limiter
//   - Add jitter to avoid thundering herd when multiple requests queue
//   - Track in-flight requests to enforce true concurrency = 1
// ============================================================

let lastCallTime = 0;
let inFlightRequests = 0;
const MAX_CONCURRENCY = 1; // GLM-4.7-Flash and GLM-4.6V-Flash both limit to 1

// Minimum interval between calls. Z.AI's free/flash tier enforces
// ~1 request per minute per account, so we use a longer interval
// to avoid burning the budget on rapid retries.
// Tunable: lower = faster but more 429s; higher = slower but more reliable.
const MIN_INTERVAL_MS = 3500;
// "Deep breath" cooldown buffer after each call completes (3-4s)
// Adds a small pause after each call so the next one doesn't fire instantly.
const COOLDOWN_BUFFER_MS = 3000;
// Random jitter to avoid thundering herd (0-1500ms)
const JITTER_MS = 1500;

/**
 * Wait for rate limit clearance before making an API call.
 * Implements:
 *   1. Concurrency gate (max 1 in-flight request)
 *   2. Minimum interval between calls
 *   3. "Deep breath" cooldown buffer
 *   4. Random jitter
 *   5. Respect for host-level rate-limit cooldown (set when 429 received)
 */
async function waitForRateLimit() {
  // 0. Respect host-level rate-limit cooldown (set when 429 received)
  // This is a separate mechanism from the model-level cooldown — when
  // ANY call to api.z.ai returns 429, we mark the entire host as in
  // cooldown so ALL concurrent calls (including those to the fallback
  // model) wait for the rate limit to reset.
  if (isInRateLimitCooldown('api.z.ai')) {
    const waitMs = getRateLimitCooldownRemaining('api.z.ai');
    console.log(`[waitForRateLimit] Z.AI host in cooldown — waiting ${Math.round(waitMs / 1000)}s`);
    await new Promise(r => setTimeout(r, waitMs));
  }

  // 1. Wait for concurrency slot
  while (inFlightRequests >= MAX_CONCURRENCY) {
    await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
  }

  // 2. Wait for minimum interval + cooldown buffer since last call
  const now = Date.now();
  const elapsed = now - lastCallTime;
  const requiredWait = MIN_INTERVAL_MS + COOLDOWN_BUFFER_MS;
  const waitTime = requiredWait - elapsed + Math.random() * JITTER_MS;
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }

  inFlightRequests++;
  lastCallTime = Date.now();
}

/**
 * Release the concurrency slot after a call completes.
 * Should be called after every API call (success or failure).
 */
function releaseRateLimit() {
  inFlightRequests = Math.max(0, inFlightRequests - 1);
}

/**
 * Exported so agent-reach-bridge.ts can share the same rate limiter.
 */
export { waitForRateLimit };

/**
 * Exported so agent-reach-bridge.ts can release rate limit slots after calls.
 */
export { releaseRateLimit };

// ============================================================
// Model Health Tracker (skips models that return persistent 429s)
// ============================================================

interface ModelHealth {
  last429At: number;
  consecutive429s: number;
  cooldownUntil: number;
}

const modelHealth: Map<string, ModelHealth> = new Map();

const COOLDOWN_AFTER_429_MS = 30_000; // 30s cooldown after consecutive 429s (reduced from 2min for better UX)
const MAX_CONSECUTIVE_429S = 3; // After 3 consecutive 429s, skip model for cooldown period

function isModelInCooldown(model: string): boolean {
  const health = modelHealth.get(model);
  if (!health) return false;
  return Date.now() < health.cooldownUntil;
}

function record429(model: string): void {
  const health = modelHealth.get(model) || { last429At: 0, consecutive429s: 0, cooldownUntil: 0 };
  health.last429At = Date.now();
  health.consecutive429s += 1;
  if (health.consecutive429s >= MAX_CONSECUTIVE_429S) {
    health.cooldownUntil = Date.now() + COOLDOWN_AFTER_429_MS;
    console.warn(`[callLLM] Model ${model} hit ${health.consecutive429s} consecutive 429s — cooldown for ${COOLDOWN_AFTER_429_MS / 1000}s`);
  }
  modelHealth.set(model, health);
}

function recordSuccess(model: string): void {
  const health = modelHealth.get(model);
  if (health) {
    health.consecutive429s = 0;
    health.cooldownUntil = 0;
  }
}

// ============================================================
// Direct HTTP LLM Call
// ============================================================

async function directChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  thinking_budget?: ThinkingBudget;
}): Promise<{
  choices?: Array<{
    finish_reason?: string;
    index?: number;
    message?: { content?: string; role?: string; reasoning_content?: string };
  }>;
  created?: number;
  model?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
} | null> {
  const token = getZhipuToken();
  if (!token) {
    throw new Error('Zhipu AI API key not configured — cannot generate JWT token');
  }

  const baseUrl = getZhipuApiBase();
  const url = `${baseUrl}/chat/completions`;

  // Use thinking:enabled with a budget to get clean content output.
  // Without this, the model puts everything in reasoning_content and leaves content empty.
  const budget = THINKING_BUDGETS[params.thinking_budget || 'standard'];
  // Ensure max_tokens is always at least budget + 500 to leave room for the actual content
  // The thinking budget is consumed FIRST, then content is generated from remaining tokens
  const effectiveMaxTokens = Math.max(params.max_tokens || 4096, budget + 500);
  const body = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature,
    max_tokens: effectiveMaxTokens,
    thinking: { type: 'enabled', budget_tokens: budget },
  };

  const response = await fetchIPv4(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    timeoutMs: 90_000,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');

    // If we get a 401, the JWT may have expired — refresh and retry once
    if (response.status === 401) {
      console.warn('[directChatCompletion] Got 401 — refreshing JWT token and will retry');
      refreshToken();
      const newToken = getZhipuToken();
      if (newToken && newToken !== token) {
        const retryResponse = await fetchIPv4(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`,
          },
          body: JSON.stringify(body),
          timeoutMs: 60_000,
        });
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text().catch(() => 'Unknown error');
          throw new Error(`API request failed with status ${retryResponse.status}: ${retryErrorText.slice(0, 200)}`);
        }
        return retryResponse.json();
      }
    }

    throw new Error(`API request failed with status ${response.status}: ${errorText.slice(0, 200)}`);
  }

  return response.json();
}

// ============================================================
// SDK Compatibility Layer (for agent-reach-bridge.ts web search)
// ============================================================

let zaiInstance: any = null;
let zaiTokenUsed = '';

async function getSDK(): Promise<any> {
  const token = getZhipuToken();
  if (!token) {
    throw new Error('Zhipu AI API key not configured — cannot generate JWT token');
  }

  if (!zaiInstance || zaiTokenUsed !== token) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const config = {
        baseUrl: getZhipuApiBase(),
        apiKey: token,
      };
      zaiInstance = new ZAI(config);
      zaiTokenUsed = token;
      console.log('[getSDK] Created ZAI instance with fresh JWT token');
    } catch (initError) {
      const msg = initError instanceof Error ? initError.message : 'Unknown error';
      console.error(`[getSDK] Failed to create ZAI instance: ${msg}`);
      throw initError;
    }
  }

  return zaiInstance;
}

export function resetSDK(): void {
  zaiInstance = null;
  zaiTokenUsed = '';
  console.log('[resetSDK] SDK instance reset — next call will reinitialize');
}

// ============================================================
// Health Check
// ============================================================

export async function checkLLMHealth(): Promise<{
  ok: boolean;
  model: string;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    if (!isZhipuConfigured()) {
      return {
        ok: false,
        model: MODEL_PRIMARY,
        latencyMs: Date.now() - start,
        error: 'Zhipu AI API key not configured (ZHIPU_AI_API_KEY env var missing)',
      };
    }

    const completion = await directChatCompletion({
      model: MODEL_PRIMARY,
      messages: [
        { role: 'system', content: 'You are a health check endpoint. Reply with exactly the word OK and nothing else.' },
        { role: 'user', content: 'Health check' },
      ],
      max_tokens: 20,
      temperature: 0,
      thinking_budget: 'quick',
    });
    // With thinking:enabled, content should have the clean answer
    const rawContent = completion?.choices?.[0]?.message?.content || '';
    const reasoningContent = completion?.choices?.[0]?.message?.reasoning_content || '';
    const content = rawContent || reasoningContent;

    return {
      ok: content.trim().length > 0,
      model: MODEL_PRIMARY,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      ok: false,
      model: MODEL_PRIMARY,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================
// Content Extraction
// ============================================================

/**
 * Extract the clean content from a Zhipu AI response.
 * With thinking:enabled, the model puts the answer in `content` and
 * reasoning in `reasoning_content`. We prefer `content` when available.
 * Falls back to `reasoning_content` for backward compatibility.
 */
function extractContent(completion: {
  choices?: Array<{
    message?: { content?: string; reasoning_content?: string };
  }>;
} | null): string {
  if (!completion?.choices?.[0]?.message) return '';

  const msg = completion.choices[0].message;
  const content = msg.content?.trim() || '';
  const reasoning = msg.reasoning_content?.trim() || '';

  // Prefer content (the clean answer) over reasoning_content (the thinking steps)
  if (content) return content;
  if (reasoning) {
    // When thinking is disabled, all output goes to reasoning_content.
    // Try to extract the useful part (after reasoning, if there's a clear split).
    // Often the last part of reasoning_content contains the actual answer.
    return reasoning;
  }

  return '';
}

// ============================================================
// HTML / Error Detection Helpers
// ============================================================

function isHtmlContent(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || trimmed.startsWith('<HTML');
}

function isHtmlOrGatewayError(msg: string, errorName?: string): boolean {
  return (
    msg.includes('Unexpected token')
    || (errorName === 'SyntaxError')
    || msg.includes('is not valid JSON')
    || msg.includes('HTML instead of')
    || msg.includes('HTML error page')
    || msg.includes('invalid response structure')
    || msg.includes('fetch failed')
    || msg.includes('502')
    || msg.includes('Bad Gateway')
    || msg.includes('gateway error')
    || msg.includes('Service Unavailable')
  );
}

function isRateLimitError(msg: string): boolean {
  return msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit') || msg.includes('速率限制');
}

/**
 * Detect TLS/connection errors that indicate Z.AI is dropping connections
 * (typically due to per-IP rate limiting or server overload).
 *
 * These should be treated like 429s — back off and wait before retrying.
 */
function isConnectionError(msg: string): boolean {
  return (
    msg.includes('Client network socket disconnected before secure TLS connection was established')
    || msg.includes('socket disconnected')
    || msg.includes('ECONNRESET')
    || msg.includes('ECONNREFUSED')
    || msg.includes('ETIMEDOUT')
    || msg.includes('EPIPE')
    || msg.includes('UND_ERR_SOCKET')
    || msg.includes('fetch failed')
    || msg.includes('network is unreachable')
    || msg.includes('TLS connection')
    || msg.includes('unexpected eof')
  );
}

function isQuotaError(msg: string): boolean {
  return msg.includes('余额不足') || msg.includes('insufficient') || msg.includes('quota');
}

// ============================================================
// Core LLM Call — with model fallback, rate limit tracking, and retry
// ============================================================

export interface LLMCallOptions {
  /** System prompt */
  systemPrompt: string;
  /** User message */
  userMessage: string;
  /** Temperature (0-1), default 0.3 */
  temperature?: number;
  /** Max tokens, default 4096 */
  maxTokens?: number;
  /** Preferred model (defaults to MODEL_PRIMARY) */
  model?: LLMModel;
  /** Number of retries per model before falling back, default 2 */
  retriesPerModel?: number;
  /** Whether to fall back to the other model on failure, default true */
  useFallback?: boolean;
  /** Thinking budget: 'quick' (512), 'standard' (2048), or 'deep' (4096), default 'standard' */
  thinkingBudget?: ThinkingBudget;
  /**
   * If true, attempt the call even when Z.AI's host is in rate-limit cooldown.
   * Use this for health probes and other critical paths where waiting is
   * preferable to skipping. Default: false (return null immediately if in cooldown).
   */
  forceCallDespiteCooldown?: boolean;
}

/**
 * Call the LLM with automatic model fallback and rate-limit-aware routing.
 *
 * Strategy:
 * 1. Try the primary model (glm-4.6v-flash) with retries
 * 2. If all retries fail, try the secondary model (glm-4.7-flash)
 * 3. Skips models that are in cooldown from consecutive 429s
 * 4. Returns null if both models fail (graceful degradation)
 */
export async function callLLM(options: LLMCallOptions): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.3,
    maxTokens = 4096,
    model = MODEL_PRIMARY,
    retriesPerModel = 2,
    useFallback = true,
    thinkingBudget = 'standard',
  } = options;

  if (!isZhipuConfigured()) {
    console.error('[callLLM] Zhipu AI API key not configured — check ZHIPU_AI_API_KEY env var');
    return null;
  }

  // ─── HOST-LEVEL COOLDOWN FAST-FAIL ─────────────────────────────
  // If Z.AI's host (api.z.ai) is in rate-limit cooldown, return null
  // IMMEDIATELY instead of waiting for the cooldown to expire. This
  // prevents the pipeline from stalling for 30-60s per LLM call when
  // Z.AI is rate-limited.
  //
  // The pipeline's downstream code (orchestrator, actions) has
  // structured fallbacks that produce useful responses without an LLM,
  // so a null return here is graceful degradation, NOT a failure.
  //
  // EXCEPTION: If `forceCallDespiteCooldown` is set, we still attempt
  // the call. Use this for health probes and other critical paths
  // where waiting is preferable to skipping.
  if (isInRateLimitCooldown('api.z.ai') && !options.forceCallDespiteCooldown) {
    const remainingMs = getRateLimitCooldownRemaining('api.z.ai');
    console.warn(`[callLLM] Z.AI host in cooldown (${Math.round(remainingMs / 1000)}s remaining) — returning null for graceful degradation`);
    return null;
  }

  // Build model list, skipping any in cooldown
  const modelsToTry: LLMModel[] = [];
  if (!isModelInCooldown(model)) {
    modelsToTry.push(model);
  } else {
    console.warn(`[callLLM] Skipping ${model} — in 429 cooldown`);
  }

  if (useFallback) {
    const fallback = model === MODEL_PRIMARY ? MODEL_FALLBACK : MODEL_PRIMARY;
    if (!modelsToTry.includes(fallback) && !isModelInCooldown(fallback)) {
      modelsToTry.push(fallback);
    } else if (!modelsToTry.includes(fallback)) {
      console.warn(`[callLLM] Skipping fallback ${fallback} — in 429 cooldown`);
    }
  }

  // If all models are in cooldown, force primary anyway (it might have recovered)
  if (modelsToTry.length === 0) {
    console.warn('[callLLM] All models in cooldown — attempting primary anyway');
    modelsToTry.push(MODEL_PRIMARY);
  }

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        await waitForRateLimit();

        const completion = await directChatCompletion({
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature,
          max_tokens: maxTokens,
          thinking_budget: thinkingBudget,
        });

        // Validate response structure
        if (!completion || !completion.choices || !Array.isArray(completion.choices)) {
          throw new Error('LLM returned invalid response structure (possible gateway error)');
        }

        // Extract clean content
        const content = extractContent(completion);

        // Detect HTML in response
        if (isHtmlContent(content)) {
          throw new Error('LLM returned HTML instead of text (API gateway error page)');
        }

        if (content.trim()) {
          recordSuccess(currentModel);
          releaseRateLimit();
          console.log(`[callLLM] Success with ${currentModel} on attempt ${attempt + 1}`);
          return content;
        }

        // Empty response — retry
        releaseRateLimit();
        if (attempt < retriesPerModel) {
          console.warn(`[callLLM] Empty response from ${currentModel}, attempt ${attempt + 1}, retrying...`);
          continue;
        }
      } catch (error) {
        releaseRateLimit();
        const msg = error instanceof Error ? error.message : 'Unknown error';
        const errorName = error instanceof Error ? error.name : '';

        const isGatewayErr = isHtmlOrGatewayError(msg, errorName);
        const isRateErr = isRateLimitError(msg);
        const isConnErr = isConnectionError(msg);
        const isQuotaErr = isQuotaError(msg);

        // Track 429s AND connection errors for cooldown logic.
        // Z.AI often drops TLS connections when the per-IP rate limit is hit
        // (instead of returning a proper 429 response). We treat these the
        // same as 429s — back off and wait for the limit to reset.
        //
        // PROGRESSIVE COOLDOWN (was: fixed 60s):
        //   attempt 0 (first 429): 30s cooldown
        //   attempt 1 (second 429): 45s cooldown
        //   attempt 2 (third 429): 60s cooldown
        // This gives the user a faster retry on transient rate limits
        // while still backing off aggressively on persistent ones.
        // Total worst-case wait for 3 attempts: 135s (was 180s).
        const progressiveCooldown = (isRateErr || isConnErr)
          ? 30_000 + attempt * 15_000
          : 0;

        if (isRateErr || isConnErr) {
          record429(currentModel);
          markHostRateLimited('api.z.ai', progressiveCooldown);
        }

        // Quota exhaustion — don't retry this model
        if (isQuotaErr) {
          console.error(`[callLLM] ${currentModel} quota exhausted: ${msg.slice(0, 150)}`);
          break; // Skip to next model immediately
        }

        if (isRateErr || isConnErr) {
          console.warn(`[callLLM] ${currentModel} attempt ${attempt + 1}: rate/connection error — ${msg.slice(0, 150)}`);
        } else if (isGatewayErr) {
          console.warn(`[callLLM] ${currentModel} attempt ${attempt + 1}: gateway error — ${msg.slice(0, 150)}`);
        } else {
          console.warn(`[callLLM] ${currentModel} attempt ${attempt + 1} failed: ${msg.slice(0, 200)}`);
        }

        if (attempt < retriesPerModel) {
          // Backoff strategy — progressive for rate limits, exponential for others.
          // Z.AI's glm-4.7-flash tier limit is roughly 1 req/min, but most 429s
          // clear in ~30s — so we use a shorter cooldown for the first attempt.
          let backoffMs: number;
          if (isRateErr || isConnErr) {
            // Wait for the host cooldown to expire (progressive 30/45/60s) plus jitter
            const cooldownRemaining = getRateLimitCooldownRemaining('api.z.ai');
            backoffMs = Math.max(progressiveCooldown, cooldownRemaining) + Math.random() * 3000;
          } else if (isGatewayErr) {
            backoffMs = exponentialBackoff(attempt, 3000, 30_000);
          } else {
            backoffMs = exponentialBackoff(attempt, 2000, 20_000);
          }

          console.warn(`[callLLM] Waiting ${Math.round(backoffMs)}ms before retry ${attempt + 2} on ${currentModel}...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }

        console.warn(`[callLLM] ${currentModel} exhausted all ${retriesPerModel + 1} attempts, ${useFallback ? 'trying fallback model...' : 'giving up.'}`);
      }
    }
  }

  console.error('[callLLM] All models failed, returning null for graceful degradation');
  return null;
}

// ============================================================
// Streaming LLM Call — for real-time SSE output
// ============================================================

export interface LLMStreamEvent {
  type: 'text_delta' | 'thinking_delta' | 'usage' | 'done' | 'error';
  text?: string;
  thinking?: string;
  inputTokens?: number;
  outputTokens?: number;
  model?: string;
  stopReason?: string;
  error?: string;
}

/**
 * Stream a chat completion from Z.AI with real-time token output.
 * Uses the same rate limiter and auth as callLLM, but yields events
 * as they arrive instead of waiting for the full response.
 */
export async function* callLLMStreaming(
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: LLMModel;
    thinkingBudget?: ThinkingBudget;
    signal?: AbortSignal;
  },
): AsyncGenerator<LLMStreamEvent> {
  const model = options?.model || MODEL_PRIMARY;
  const budget = THINKING_BUDGETS[options?.thinkingBudget || 'standard'];
  const effectiveMaxTokens = Math.max(options?.maxTokens || 4096, budget + 500);

  if (!isZhipuConfigured()) {
    yield { type: 'error', error: 'Z.AI API key not configured' };
    return;
  }

  // Build model list, skipping cooldown
  const modelsToTry: LLMModel[] = [];
  if (!isModelInCooldown(model)) {
    modelsToTry.push(model);
  }
  const fallback = model === MODEL_PRIMARY ? MODEL_FALLBACK : MODEL_PRIMARY;
  if (!modelsToTry.includes(fallback) && !isModelInCooldown(fallback)) {
    modelsToTry.push(fallback);
  }
  if (modelsToTry.length === 0) {
    modelsToTry.push(MODEL_PRIMARY);
  }

  for (const currentModel of modelsToTry) {
    try {
      await waitForRateLimit();

      const token = getZhipuToken();
      if (!token) {
        releaseRateLimit();
        yield { type: 'error', error: 'Cannot generate JWT token' };
        return;
      }

      const baseUrl = getZhipuApiBase();
      const url = `${baseUrl}/chat/completions`;

      const body = {
        model: currentModel,
        messages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: effectiveMaxTokens,
        stream: true,
        thinking: { type: 'enabled', budget_tokens: budget },
      };

      const response = await fetchIPv4(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        timeoutMs: 90_000,
      });

      if (response.status === 429) {
        releaseRateLimit();
        record429(currentModel);
        // Mark Z.AI host as rate-limited for 60s so other concurrent calls back off too
        markHostRateLimited('api.z.ai', 60_000);
        const backoffMs = 3000 + Math.random() * 2000;
        console.warn(`[callLLMStreaming] 429 on ${currentModel}, backing off ${backoffMs}ms`);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }

      if (!response.ok) {
        releaseRateLimit();
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API request failed with status ${response.status}: ${errorText.slice(0, 200)}`);
      }

      // Parse SSE stream
      recordSuccess(currentModel);
      const reader = response.body?.getReader();
      if (!reader) {
        releaseRateLimit();
        yield { type: 'error', error: 'No response body' };
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let totalInputTokens = 0;
      let totalOutputTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;

            if (trimmed === 'data: [DONE]') {
              releaseRateLimit();
              yield {
                type: 'usage',
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                model: currentModel,
              };
              yield { type: 'done', stopReason: 'stop' };
              return;
            }

            if (trimmed.startsWith('data: ')) {
              try {
                const event = JSON.parse(trimmed.slice(6));
                const choices = event.choices as Array<{
                  delta?: {
                    content?: string;
                    reasoning_content?: string;
                  };
                  finish_reason?: string;
                }> | undefined;

                if (choices) {
                  for (const choice of choices) {
                    if (choice.delta?.reasoning_content) {
                      yield { type: 'thinking_delta', thinking: choice.delta.reasoning_content };
                    }
                    if (choice.delta?.content) {
                      yield { type: 'text_delta', text: choice.delta.content };
                    }
                    if (choice.finish_reason) {
                      // Track usage from the event
                      if (event.usage) {
                        totalInputTokens += event.usage.prompt_tokens || 0;
                        totalOutputTokens += event.usage.completion_tokens || 0;
                      }
                    }
                  }
                }

                if (event.usage) {
                  totalInputTokens += event.usage.prompt_tokens || 0;
                  totalOutputTokens += event.usage.completion_tokens || 0;
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        releaseRateLimit();
      }

      // If we exit the loop without [DONE], still emit done
      yield { type: 'done', stopReason: 'stop' };
      return;
    } catch (error) {
      releaseRateLimit();
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.warn(`[callLLMStreaming] ${currentModel} failed: ${msg.slice(0, 200)}`);

      if (isRateLimitError(msg)) {
        record429(currentModel);
        continue;
      }

      // Non-retryable error
      yield { type: 'error', error: msg };
      return;
    }
  }

  yield { type: 'error', error: 'All models failed' };
}

// ============================================================
// JSON Extraction Helper
// ============================================================

export async function callLLMForJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options?: Partial<LLMCallOptions>
): Promise<T | null> {
  const MAX_JSON_RETRIES = 1;

  for (let attempt = 0; attempt <= MAX_JSON_RETRIES; attempt++) {
    try {
      const response = await callLLM({
        systemPrompt,
        userMessage,
        temperature: options?.temperature ?? 0.2,
        maxTokens: options?.maxTokens ?? 4096,
        model: options?.model,
        retriesPerModel: options?.retriesPerModel ?? 1,
        useFallback: options?.useFallback ?? true,
        thinkingBudget: options?.thinkingBudget ?? 'standard',
      });

      if (response === null || response === undefined) {
        console.warn('[callLLMForJSON] callLLM returned null — LLM unavailable');
        return null;
      }

      // Strategy 1: JSON in markdown code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        try { return JSON.parse(codeBlockMatch[1]) as T; } catch { /* continue */ }
      }

      // Strategy 2: First balanced { } or [ ]
      const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch) {
        try { return JSON.parse(jsonMatch[1]) as T; } catch { /* continue */ }
      }

      // Strategy 3: Direct parse
      try { return JSON.parse(response) as T; } catch { /* continue */ }

      console.warn(`[callLLMForJSON] Could not extract JSON on attempt ${attempt + 1}`);
    } catch (error) {
      console.warn(`[callLLMForJSON] Error on attempt ${attempt + 1}: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    if (attempt < MAX_JSON_RETRIES) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.warn('[callLLMForJSON] Could not extract JSON after all retries, returning null');
  return null;
}

/**
 * Extract JSON from a raw LLM string response.
 * Pure utility — no LLM call, just string parsing.
 */
export function extractJSONFromString<T>(text: string): T | null {
  // Strategy 1: JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]) as T; } catch { /* continue */ }
  }

  // Strategy 2: First balanced { } or [ ]
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]) as T; } catch { /* continue */ }
  }

  // Strategy 3: Direct parse
  try { return JSON.parse(text) as T; } catch { /* continue */ }

  return null;
}

// ============================================================
// Structured Fallback (no LLM needed)
// ============================================================

/**
 * Generate a structured fallback response when LLM is unavailable.
 * This creates a useful response from the provided data without needing AI.
 */
export function generateStructuredFallback(params: {
  persona: string;
  intent: string;
  userMessage: string;
  actionSummary: string;
  context?: string;
}): string {
  const { persona, intent, userMessage, actionSummary, context } = params;

  try {
    // Try to parse the action summary for structured data
    const data = JSON.parse(actionSummary);

    if (intent === 'research_company' || intent === 'research_url') {
      const company = data.company || 'the company';
      const industry = data.industry || '';
      const employees = data.employees || '';
      const revenue = data.revenue || '';
      const ceo = data.ceo || '';
      const email = data.email || '';
      const linkedin = data.linkedin || '';
      const completeness = data.completeness || 0;

      let response = `I've completed my research on **${company}**.`;
      if (industry) response += ` They operate in the ${industry} industry.`;
      if (employees) response += ` The company has approximately ${employees} employees.`;
      if (revenue) response += ` Estimated revenue: ${revenue}.`;
      if (ceo) response += ` The CEO is ${ceo}.`;
      if (email) response += ` Contact email: ${email}.`;
      if (linkedin) response += ` LinkedIn: available.`;

      if (completeness < 30) {
        response += `\n\nData completeness is at ${completeness}%. For deeper results, try providing a company website URL.`;
      } else if (completeness >= 60) {
        response += `\n\nData completeness is at ${completeness}% — good research coverage! I recommend scoring this lead against your ICP or composing personalized outreach.`;
      }

      return response;
    }

    if (intent === 'research_person') {
      const person = data.person || 'the contact';
      const title = data.title || '';
      const company = data.company || '';
      const email = data.email || '';

      let response = `I've found information about **${person}**.`;
      if (title) response += ` Their title is ${title}.`;
      if (company) response += ` They work at ${company}.`;
      if (email) response += ` Email: ${email}.`;

      return response;
    }

    if (intent === 'analyze_market' || intent === 'analyze_competitors') {
      const summary = data.summary || '';
      const competitors = data.competitors || [];
      const trends = data.trends || [];

      let response = `Here's my market analysis:`;
      if (summary) response += `\n\n${summary}`;
      if (Array.isArray(competitors) && competitors.length > 0) response += `\n\nKey competitors: ${competitors.join(', ')}.`;
      if (Array.isArray(trends) && trends.length > 0) response += `\n\nTrends identified: ${trends.join('; ')}.`;

      return response;
    }
  } catch {
    // JSON parse failed — use raw text
  }

  // Generic fallback
  return `I've processed your request about "${userMessage.slice(0, 50)}". The research pipeline has completed and I've gathered available data. You can review the structured results below, and I'd recommend taking the next step — scoring this lead, composing outreach, or building an ICP based on what we found.`;
}

// ============================================================
// Export getSDK for agent-reach-bridge.ts
// ============================================================

export { getSDK };

// ============================================================
// Vision (glm-4.6v-flash) — multimodal image+text inference
// ============================================================
//
// Per platform policy, glm-4.6v-flash is the ONLY vision-capable model
// available on the platform. Use this helper for any task that needs to
// understand image content: logo analysis, screenshot OCR, creative
// review, document understanding, etc.
//
// ============================================================

export interface VisionMessage {
  role: 'system' | 'user' | 'assistant';
  /** Text content for this message */
  text?: string;
  /** Inline image (data URL: `data:image/png;base64,...`) OR a publicly-reachable image URL */
  image?: string;
}

export interface LLMVisionOptions {
  /** Temperature (0-1), default 0.3 */
  temperature?: number;
  /** Max tokens, default 4096 */
  maxTokens?: number;
  /** Thinking budget: 'quick' (1024), 'standard' (2048), or 'deep' (4096), default 'standard' */
  thinkingBudget?: ThinkingBudget;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

/**
 * Call glm-4.6v-flash with a multimodal (image + text) prompt.
 *
 * Each message can carry text, an image (data URL or HTTP URL), or both.
 * Returns the model's text response, or null on failure.
 *
 * Example:
 *   const result = await callLLMVision([
 *     { role: 'system', text: 'You are a brand analyst.' },
 *     { role: 'user', text: 'Describe this logo.', image: dataUrl },
 *   ]);
 */
export async function callLLMVision(
  messages: VisionMessage[],
  options?: LLMVisionOptions,
): Promise<string | null> {
  if (!isZhipuConfigured()) {
    console.error('[callLLMVision] Z.AI API key not configured');
    return null;
  }

  const budget = THINKING_BUDGETS[options?.thinkingBudget || 'standard'];
  const effectiveMaxTokens = Math.max(options?.maxTokens || 4096, budget + 500);

  // Convert our VisionMessage format to Z.AI's content-array format
  const apiMessages = messages.map((m) => {
    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
    if (m.text) content.push({ type: 'text', text: m.text });
    if (m.image) content.push({ type: 'image_url', image_url: { url: m.image } });
    return { role: m.role, content };
  });

  try {
    await waitForRateLimit();
    try {
      const token = getZhipuToken();
      if (!token) {
        return null;
      }

      const url = `${getZhipuApiBase()}/chat/completions`;
      const body = {
        model: MODEL_VISION,
        messages: apiMessages,
        temperature: options?.temperature ?? 0.3,
        max_tokens: effectiveMaxTokens,
        thinking: { type: 'enabled', budget_tokens: budget },
      };

      const response = await fetchIPv4(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        timeoutMs: 90_000,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.warn(`[callLLMVision] API failed (${response.status}): ${errorText.slice(0, 200)}`);
        return null;
      }

      const completion = await response.json();
      const content = extractContent(completion);
      return content || null;
    } finally {
      releaseRateLimit();
    }
  } catch (error) {
    releaseRateLimit();
    console.warn('[callLLMVision] Error:', error instanceof Error ? error.message.slice(0, 200) : error);
    return null;
  }
}

/**
 * Call glm-4.6v-flash and parse the response as JSON.
 * Same as callLLMVision but extracts and parses a JSON object from the response.
 */
export async function callLLMVisionForJSON<T>(
  messages: VisionMessage[],
  options?: LLMVisionOptions,
): Promise<T | null> {
  const text = await callLLMVision(messages, options);
  if (!text) return null;
  return extractJSONFromString<T>(text);
}
