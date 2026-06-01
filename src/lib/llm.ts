/**
 * Centralized LLM Utility — LeadReach AI
 *
 * Uses exactly two models via Zhipu AI API with JWT authentication:
 *   - glm-4.7-flash  (primary — fast, high-quality text generation)
 *   - glm-4.6v-flash (secondary — vision-capable, fallback for text)
 *
 * CONNECTION STRATEGY (smart routing with rate-limit awareness):
 *   1. Try direct Zhipu AI API FIRST (JWT auth via zhipu-jwt.ts)
 *   2. Fallback to z-ai-web-dev-sdk if direct API fails
 *   3. On rate limits (1302/1305/429): switch connection mode and add cooldown
 *
 * PROTECTION LAYERS (3-tier defense):
 *   1. Concurrency limiter — max 4 simultaneous LLM calls
 *   2. Token-bucket rate limiter — adaptive pacing based on API response
 *   3. Retry + fallback — retries per model, then switch to secondary model
 *
 * IMPORTANT: Zhipu AI requires JWT authentication. The API key format
 * is `{id}.{secret}`, and it must be converted to a JWT token before
 * use. This is handled by the zhipu-jwt.ts utility.
 */

import { getZhipuToken, getZhipuApiBase, isZhipuConfigured, refreshToken } from './zhipu-jwt';

// ============================================================
// Model Definitions
// ============================================================

/** Primary model — fast, high-quality text generation */
export const MODEL_PRIMARY = 'glm-4.7-flash' as const;

/** Secondary model — vision-capable, also works as text fallback */
export const MODEL_VISION = 'glm-4.6v-flash' as const;

/** All available models for iteration */
export const LLM_MODELS = [MODEL_PRIMARY, MODEL_VISION] as const;

export type LLMModel = typeof LLM_MODELS[number];

// ============================================================
// Unified Rate Limiter (shared across ALL API calls)
// ============================================================

// IMPORTANT: Both callLLM (chat.completions) and agent-reach-bridge
// (functions.invoke / web_search) go through the same Zhipu AI gateway.
// A single shared rate limiter prevents concurrent bursts that cause 502s.

/**
 * Response structure from the Zhipu AI API.
 * Includes reasoning_content for reasoning models like glm-4.7-flash.
 */
interface ZhipuChatResponse {
  choices: Array<{
    message: {
      content: string;
      reasoning_content?: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  created: number;
  id: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    completion_tokens_details?: {
      reasoning_tokens: number;
    };
  };
}

/** Zhipu API error response structure */
interface ZhipuApiError {
  error?: {
    code?: string;
    message?: string;
  };
}

/**
 * Error thrown when Zhipu API returns a rate limit or overload error.
 * These are retryable but need a cooldown period.
 */
class ZhipuRateLimitError extends Error {
  readonly code: string;
  readonly isAccountRateLimit: boolean;
  readonly isModelOverloaded: boolean;

  constructor(code: string, message: string) {
    super(`Zhipu API error: ${message}`);
    this.name = 'ZhipuRateLimitError';
    this.code = code;
    this.isAccountRateLimit = code === '1302';
    this.isModelOverloaded = code === '1305';
  }
}

/**
 * Make a direct chat completion call to the Zhipu AI API.
 * Returns the full response data (including reasoning_content) or throws on error.
 * Throws ZhipuRateLimitError for rate limit / overload errors.
 * Uses JWT authentication via zhipu-jwt.ts.
 */
async function directZhipuChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
}): Promise<ZhipuChatResponse> {
  const token = getZhipuToken();
  if (!token) {
    throw new Error('Zhipu AI API key not configured — cannot generate JWT token');
  }

  const baseUrl = getZhipuApiBase();

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(30_000), // 30s timeout — reduced from 60s to avoid pipeline stalls
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const errorData: ZhipuApiError | null = errorBody ? (() => {
      try { return JSON.parse(errorBody); } catch { return null; }
    })() : null;

    const errorCode = errorData?.error?.code || '';
    const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;

    // Detect Zhipu-specific rate limit errors
    if (errorCode === '1302' || errorCode === '1305') {
      throw new ZhipuRateLimitError(errorCode, errorMessage);
    }

    // HTTP 429 also indicates rate limit
    if (response.status === 429) {
      throw new ZhipuRateLimitError('429', errorMessage);
    }

    // If we get a 401, the JWT may have expired — refresh and retry once
    if (response.status === 401) {
      console.warn('[directZhipuChatCompletion] Got 401 — refreshing JWT token and retrying');
      refreshToken();
      const newToken = getZhipuToken();
      if (newToken && newToken !== token) {
        const retryResponse = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${newToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(params),
          signal: AbortSignal.timeout(30_000),
        });
        if (!retryResponse.ok) {
          const retryErrorBody = await retryResponse.text().catch(() => '');
          const retryErrorData: ZhipuApiError | null = retryErrorBody ? (() => {
            try { return JSON.parse(retryErrorBody); } catch { return null; }
          })() : null;
          const retryErrorCode = retryErrorData?.error?.code || '';
          const retryErrorMessage = retryErrorData?.error?.message || `HTTP ${retryResponse.status}`;
          if (retryErrorCode === '1302' || retryErrorCode === '1305') {
            throw new ZhipuRateLimitError(retryErrorCode, retryErrorMessage);
          }
          if (retryResponse.status === 429) {
            throw new ZhipuRateLimitError('429', retryErrorMessage);
          }
          throw new Error(`Zhipu API error ${retryResponse.status}: ${retryErrorMessage}`);
        }
        const data = await retryResponse.json() as ZhipuChatResponse;
        if (!data.choices || !Array.isArray(data.choices)) {
          throw new Error('Zhipu API returned invalid response structure');
        }
        return data;
      }
    }

    throw new Error(`Zhipu API error ${response.status}: ${errorMessage}`);
  }

  const data = await response.json() as ZhipuChatResponse;

  if (!data.choices || !Array.isArray(data.choices)) {
    throw new Error('Zhipu API returned invalid response structure');
  }

  return data;
}

// ============================================================
// Connection Mode Detection (smart routing)
// ============================================================

type ConnectionMode = 'sdk' | 'direct' | 'auto';

/**
 * Connection mode with cooldown tracking.
 *
 * When a connection mode hits a rate limit, we set a cooldown period
 * during which we prefer the OTHER mode. This prevents getting stuck
 * in a loop hitting the same rate-limited endpoint.
 */
let connectionMode: ConnectionMode = 'auto';
let directCooldownUntil = 0;
let sdkCooldownUntil = 0;
let sdkAvailable = false; // Will be set to true only if SDK works

/**
 * Get the preferred connection mode, accounting for cooldowns.
 *
 * Priority:
 * 1. If SDK is known-unavailable, prefer direct API
 * 2. If a mode is on cooldown, use the other one
 * 3. If both are available, prefer direct API (more reliable in current env)
 * 4. If both are on cooldown, use whichever has the shorter cooldown
 */
function getConnectionMode(): ConnectionMode {
  const now = Date.now();
  const directOnCooldown = now < directCooldownUntil;
  const sdkOnCooldown = now < sdkCooldownUntil;

  // If SDK is known-unavailable, skip it unless direct is also on cooldown
  if (!sdkAvailable) {
    if (!directOnCooldown) return 'direct';
    if (!sdkOnCooldown) return 'sdk'; // Try SDK as last resort
  }

  // If we have a cached mode and it's not on cooldown, use it
  if (connectionMode === 'sdk' && !sdkOnCooldown && sdkAvailable) return 'sdk';
  if (connectionMode === 'direct' && !directOnCooldown) return 'direct';

  // Otherwise, pick the best available mode
  if (directOnCooldown && sdkOnCooldown) {
    return directCooldownUntil < sdkCooldownUntil ? 'direct' : 'sdk';
  }

  if (directOnCooldown && sdkAvailable) return 'sdk';
  if (sdkOnCooldown) return 'direct';

  // Neither on cooldown — prefer direct API (more reliable in current env)
  return 'direct';
}

/** Set cooldown on direct API after rate limit */
function setDirectCooldown(ms: number) {
  directCooldownUntil = Date.now() + ms;
  console.warn(`[LLM] Direct API cooldown for ${ms}ms`);
}

/** Set cooldown on SDK after failure */
function setSDKCooldown(ms: number) {
  sdkCooldownUntil = Date.now() + ms;
  console.warn(`[LLM] SDK cooldown for ${ms}ms`);
}

// ============================================================
// Concurrency Limiter (max simultaneous LLM calls)
// ============================================================

const MAX_CONCURRENT = 4;
let activeCalls = 0;
const waitingQueue: Array<() => void> = [];

async function acquireSlot(): Promise<void> {
  if (activeCalls < MAX_CONCURRENT) {
    activeCalls++;
    return;
  }
  return new Promise<void>((resolve) => {
    waitingQueue.push(() => {
      activeCalls++;
      resolve();
    });
  });
}

function releaseSlot(): void {
  activeCalls = Math.max(0, activeCalls - 1);
  if (waitingQueue.length > 0) {
    const next = waitingQueue.shift();
    if (next) next();
  }
}

// ============================================================
// Adaptive Rate Limiter (tuned for Zhipu free tier)
// ============================================================

/**
 * Token-bucket rate limiter that adapts to API feedback.
 *
 * KEY CHANGES from previous version:
 * - Reduced base interval from 1.5s to 500ms (Zhipu rate limits are per-minute,
 *   not per-second, so 500ms between calls is plenty)
 * - When rate-limited: set a 10-30s cooldown on that connection mode
 *   instead of just doubling the interval
 * - Faster recovery: reduce interval by 50% per success instead of 15%
 */
let lastCallTime = 0;
let currentIntervalMs = 500; // 500ms — Zhipu rate limits are per-minute, not per-second
const MIN_INTERVAL_MS = 300;  // Minimum when things are going well
const MAX_INTERVAL_MS = 6000; // Maximum after repeated rate limits
const JITTER_MS = 200;

/**
 * Called when a rate limit is detected.
 * Sets cooldown and increases interval.
 */
export function notifyRateLimitHit(): void {
  currentIntervalMs = Math.min(currentIntervalMs * 2, MAX_INTERVAL_MS);
  console.warn(`[RateLimiter] Rate limit detected — increased interval to ${currentIntervalMs}ms`);
}

/**
 * Called when a call succeeds.
 * Quickly reduces the interval back toward MIN_INTERVAL_MS.
 */
function notifyCallSuccess(): void {
  currentIntervalMs = Math.max(currentIntervalMs * 0.5, MIN_INTERVAL_MS);
}

async function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  const waitTime = currentIntervalMs - elapsed + Math.random() * JITTER_MS;
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastCallTime = Date.now();
}

/**
 * Exported so agent-reach-bridge.ts can share the same rate limiter.
 * This prevents LLM calls and search calls from firing simultaneously
 * and overwhelming the shared Zhipu AI gateway.
 */
export { waitForRateLimit };

// ============================================================
// SDK Compatibility Layer (for agent-reach-bridge.ts web search)
// ============================================================

/**
 * Get a Zhipu AI SDK instance for functions.invoke (web search, etc).
 * Uses the ZAI constructor directly with a fresh JWT token.
 */
let zaiInstance: any = null;
let zaiTokenUsed = '';
let sdkInitFailed = false;

async function getSDK(): Promise<any> {
  const token = getZhipuToken();
  if (!token) {
    throw new Error('Zhipu AI API key not configured — cannot generate JWT token');
  }

  // Re-create the SDK instance if the token has changed (JWT refresh)
  if (!zaiInstance || zaiTokenUsed !== token) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const config = {
        baseUrl: getZhipuApiBase(),
        apiKey: token,
      };
      zaiInstance = new ZAI(config);
      zaiTokenUsed = token;
      sdkAvailable = true;
      sdkInitFailed = false;
      console.log('[getSDK] Created ZAI instance with fresh JWT token');
    } catch (initError) {
      sdkInitFailed = true;
      sdkAvailable = false;
      const msg = initError instanceof Error ? initError.message : 'Unknown error';
      console.error(`[getSDK] Failed to create ZAI instance: ${msg}`);
      throw initError;
    }
  }

  return zaiInstance;
}

/**
 * Reset the SDK singleton. Useful after API key rotation or config changes.
 */
export function resetSDK(): void {
  zaiInstance = null;
  zaiTokenUsed = '';
  console.log('[resetSDK] SDK instance reset — next call will reinitialize');
}

/**
 * Health check: verify the LLM can connect and respond.
 * Returns { ok, model, latencyMs, error? }
 */
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

    const completion = await directZhipuChatCompletion({
      model: MODEL_PRIMARY,
      messages: [
        { role: 'system', content: 'You are a health check endpoint.' },
        { role: 'user', content: 'Reply with exactly: OK' },
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const content = extractContentFromResponse(completion);

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
    || msg.includes('Connect Timeout')
    || msg.includes('UND_ERR_CONNECT_TIMEOUT')
  );
}

function isRateLimitError(msg: string): boolean {
  return msg.includes('429')
    || msg.includes('Too many requests')
    || msg.includes('rate limit')
    || msg.includes('访问量过大')
    || msg.includes('请求频率')
    || msg.includes('ZhipuRateLimitError');
}

// ============================================================
// Reasoning Content Extraction
// ============================================================

/**
 * Extract useful content from a reasoning model's response.
 *
 * glm-4.7-flash is a reasoning model that sometimes:
 * 1. Returns content in `reasoning_content` with empty `content`
 *    (happens when max_tokens is exhausted during reasoning)
 * 2. Returns a valid `content` field along with `reasoning_content`
 *    (normal case)
 *
 * This function handles both cases:
 * - If `content` is present and non-empty, return it directly
 * - If `content` is empty but `reasoning_content` has content,
 *   extract the final answer portion from the reasoning
 */
function extractContentFromResponse(result: ZhipuChatResponse): string {
  const choice = result.choices?.[0];
  if (!choice?.message) return '';

  const content = choice.message.content || '';
  const reasoningContent = choice.message.reasoning_content || '';

  // Normal case: model produced final content
  if (content.trim()) {
    return content;
  }

  // Reasoning model exhausted tokens during reasoning — extract from reasoning
  if (reasoningContent.trim()) {
    console.warn('[extractContent] Model returned reasoning but no content — extracting from reasoning_content');

    // Strategy 1: Look for a final conclusion section
    const conclusionPatterns = [
      /(?:therefore|thus|hence|in conclusion|in summary|to summarize|so,?\s*the answer|final answer|answer:|conclusion:|result:)\s*(.+)/is,
      /(?:the (?:best |most |correct )?(?:answer|response|result|choice|option) (?:is|would be))\s*(.+)/is,
    ];

    for (const pattern of conclusionPatterns) {
      const match = reasoningContent.match(pattern);
      if (match && match[1]?.trim()) {
        return match[1].trim();
      }
    }

    // Strategy 2: Take the last paragraph/section of the reasoning
    const paragraphs = reasoningContent.split(/\n\n+/).filter(p => p.trim().length > 20);
    if (paragraphs.length >= 2) {
      const lastParagraphs = paragraphs.slice(-1).join('\n\n');
      const cleaned = lastParagraphs.replace(/^\s*(?:\d+\.|\*|-)\s*/, '').trim();
      if (cleaned.length > 10) {
        return cleaned;
      }
    }

    // Strategy 3: Take the last meaningful sentence
    const sentences = reasoningContent.split(/[.!?]+\s+/).filter(s => s.trim().length > 15);
    if (sentences.length > 0) {
      const lastSentence = sentences[sentences.length - 1].trim();
      return lastSentence;
    }

    // Last resort: return a truncated portion of the reasoning
    return reasoningContent.slice(-500).trim();
  }

  return '';
}

// ============================================================
// Core LLM Call — with smart routing, cooldown, and model fallback
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
  /** Number of retries per model before falling back, default 1 */
  retriesPerModel?: number;
  /** Whether to fall back to the other model on failure, default true */
  useFallback?: boolean;
  /** Skip rate limiter wait (for retries that already waited) */
  skipRateLimit?: boolean;
}

/**
 * Make a single LLM call using the best available connection.
 * Smart routing: tries direct API first (JWT auth), falls back to SDK if needed.
 */
async function makeLLMCall(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
  skipRateLimit = false,
): Promise<string | null> {
  const mode = getConnectionMode();

  // Try the primary connection mode first
  if (mode === 'sdk' || mode === 'auto') {
    try {
      const zai = await getSDK();
      const result = await zai.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });
      const content = result.choices?.[0]?.message?.content || '';
      if (content.trim() && !isHtmlContent(content)) {
        connectionMode = 'sdk';
        notifyCallSuccess();
        return content;
      }
    } catch (sdkErr) {
      const msg = sdkErr instanceof Error ? sdkErr.message : 'Unknown';
      const isRate = isRateLimitError(msg);

      if (isRate) {
        setSDKCooldown(15_000); // 15s cooldown on SDK
        notifyRateLimitHit();
      } else {
        setSDKCooldown(5_000); // 5s cooldown on non-rate-limit failures
      }

      console.warn(`[makeLLMCall] SDK failed for ${model}: ${msg.slice(0, 150)}`);

      // Fall through to try direct API
    }

    // Try direct API as fallback
    if (isZhipuConfigured()) {
      try {
        const result = await directZhipuChatCompletion({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        });

        const content = extractContentFromResponse(result);

        if (content.trim() && !isHtmlContent(content)) {
          connectionMode = 'direct';
          notifyCallSuccess();
          return content;
        }
      } catch (directErr) {
        if (directErr instanceof ZhipuRateLimitError) {
          // Zhipu-specific rate limit — set appropriate cooldown
          const cooldown = directErr.isModelOverloaded ? 20_000 : 10_000; // 20s for overload, 10s for account limit
          setDirectCooldown(cooldown);
          notifyRateLimitHit();
          console.warn(`[makeLLMCall] Direct API rate-limited (${directErr.code}): ${directErr.message.slice(0, 100)}`);
        } else {
          const msg = directErr instanceof Error ? directErr.message : 'Unknown';
          console.warn(`[makeLLMCall] Direct API also failed for ${model}: ${msg.slice(0, 150)}`);
        }
      }
    }
  } else if (mode === 'direct') {
    // Direct API preferred — try it first
    try {
      const result = await directZhipuChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      const content = extractContentFromResponse(result);

      if (content.trim() && !isHtmlContent(content)) {
        connectionMode = 'direct';
        notifyCallSuccess();
        return content;
      }
    } catch (err) {
      if (err instanceof ZhipuRateLimitError) {
        const cooldown = err.isModelOverloaded ? 20_000 : 10_000;
        setDirectCooldown(cooldown);
        notifyRateLimitHit();
        console.warn(`[makeLLMCall] Direct API rate-limited (${err.code}): ${err.message.slice(0, 100)}`);

        // Try SDK as fallback when direct is rate-limited
        try {
          const zai = await getSDK();
          const result = await zai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          });
          const content = result.choices?.[0]?.message?.content || '';
          if (content.trim() && !isHtmlContent(content)) {
            connectionMode = 'sdk';
            notifyCallSuccess();
            console.log(`[makeLLMCall] SDK fallback succeeded for ${model}`);
            return content;
          }
        } catch (sdkErr) {
          const msg = sdkErr instanceof Error ? sdkErr.message : 'Unknown';
          if (isRateLimitError(msg)) {
            setSDKCooldown(15_000);
            notifyRateLimitHit();
          }
          console.warn(`[makeLLMCall] SDK fallback also failed: ${msg.slice(0, 100)}`);
        }
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown';
        console.warn(`[makeLLMCall] Direct API failed for ${model}: ${msg.slice(0, 150)}`);

        // Try SDK for non-rate-limit errors
        try {
          const zai = await getSDK();
          const result = await zai.chat.completions.create({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          });
          const content = result.choices?.[0]?.message?.content || '';
          if (content.trim() && !isHtmlContent(content)) {
            connectionMode = 'sdk';
            notifyCallSuccess();
            console.log(`[makeLLMCall] SDK fallback succeeded for ${model}`);
            return content;
          }
        } catch (sdkErr) {
          console.warn(`[makeLLMCall] SDK fallback also failed: ${sdkErr instanceof Error ? sdkErr.message.slice(0, 100) : 'Unknown'}`);
        }
      }
    }
  }

  return null;
}

/**
 * Call the LLM with automatic model fallback.
 *
 * Strategy:
 * 1. Acquire a concurrency slot (max 4 simultaneous calls)
 * 2. Wait for adaptive rate limiter (unless skipped)
 * 3. Check configuration before attempting any calls
 * 4. Try the primary model (glm-4.7-flash) with limited retries
 * 5. If all retries fail, try the secondary model (glm-4.6v-flash)
 * 6. Returns null if both models fail (graceful degradation)
 *
 * Uses JWT authentication via zhipu-jwt.ts for reliable API access.
 */
export async function callLLM(options: LLMCallOptions): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.3,
    maxTokens = 4096,
    model = MODEL_PRIMARY,
    retriesPerModel = 1,
    useFallback = true,
    skipRateLimit = false,
  } = options;

  // Check configuration before attempting any calls
  if (!isZhipuConfigured()) {
    console.error('[callLLM] Zhipu AI API key not configured — check ZHIPU_AI_API_KEY env var');
    return null;
  }

  // Acquire concurrency slot
  await acquireSlot();

  try {
    const modelsToTry: LLMModel[] = [model];
    if (useFallback) {
      const fallback = model === MODEL_PRIMARY ? MODEL_VISION : MODEL_PRIMARY;
      if (!modelsToTry.includes(fallback)) modelsToTry.push(fallback);
    }

    for (const currentModel of modelsToTry) {
      for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
        try {
          if (!skipRateLimit) {
            await waitForRateLimit();
          }

          const content = await makeLLMCall(
            currentModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            maxTokens,
            attempt > 0, // Skip rate limit on retries (we already waited)
          );

          if (content && content.trim()) {
            console.log(`[callLLM] Success with ${currentModel} on attempt ${attempt + 1}`);
            return content;
          }

          // Empty response — retry once
          if (attempt < retriesPerModel) {
            console.warn(`[callLLM] Empty response from ${currentModel}, attempt ${attempt + 1}, retrying...`);
            continue;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Unknown error';
          const errorName = error instanceof Error ? error.name : '';

          const isGatewayErr = isHtmlOrGatewayError(msg, errorName);
          const isRateErr = isRateLimitError(msg);

          if (isGatewayErr || isRateErr) {
            console.warn(`[callLLM] ${currentModel} attempt ${attempt + 1}: gateway/rate error — ${msg.slice(0, 150)}`);
          } else {
            console.warn(`[callLLM] ${currentModel} attempt ${attempt + 1} failed: ${msg.slice(0, 200)}`);
          }

          // For rate limit errors, use adaptive backoff based on current rate limiter state
          if (attempt < retriesPerModel) {
            let backoffMs = 1000;
            if (isRateErr) {
              // Zhipu rate limits need longer backoff — at least 10-20 seconds
              backoffMs = 10_000 + Math.random() * 10_000;
            } else if (isGatewayErr) {
              backoffMs = (attempt + 1) * 2000 + Math.random() * 1000;
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
  } finally {
    releaseSlot();
  }
}

// ============================================================
// JSON Extraction Helper
// ============================================================

/**
 * Call LLM and parse the response as JSON.
 * Uses multiple extraction strategies: code blocks, balanced brackets, direct parse.
 * Falls back between models automatically.
 */
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
        skipRateLimit: options?.skipRateLimit,
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
      await new Promise(r => setTimeout(r, 1000));
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
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]) as T; } catch { /* continue */ }
  }

  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]) as T; } catch { /* continue */ }
  }

  try { return JSON.parse(text) as T; } catch { /* continue */ }

  return null;
}

/**
 * Check if the LLM is currently available (not in cooldown for all modes).
 * Useful for pre-flight checks before starting expensive pipelines.
 */
export function isLLMAvailable(): { available: boolean; waitMs: number } {
  const now = Date.now();
  const directWait = Math.max(0, directCooldownUntil - now);
  const sdkWait = Math.max(0, sdkCooldownUntil - now);

  // If at least one mode is available, LLM is available
  if (directWait === 0 || sdkWait === 0) {
    return { available: true, waitMs: 0 };
  }

  // Both modes on cooldown — return the shorter wait
  return { available: false, waitMs: Math.min(directWait, sdkWait) };
}

// ============================================================
// Export getSDK for agent-reach-bridge.ts
// ============================================================

export { getSDK };
