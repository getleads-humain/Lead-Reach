/**
 * Centralized LLM Utility — LeadReach AI
 *
 * Uses exactly two models via DIRECT Zhipu AI API (primary) with SDK fallback:
 *   - glm-4.7-flash  (primary — fast, high-quality text generation)
 *   - glm-4.6v-flash (secondary — vision-capable, fallback for text)
 *
 * CONNECTION STRATEGY (auto-detect at startup):
 *   1. Try direct Zhipu AI API (https://open.bigmodel.cn/api/paas/v4/)
 *      — Uses JWT auth with the ZHIPU_API_KEY from .env
 *      — Works when the z-ai-web-dev-sdk gateway is unreachable
 *   2. Fallback to z-ai-web-dev-sdk if direct API fails
 *      — Uses the platform's internal gateway
 *
 * PROTECTION LAYERS (3-tier defense against 502 Bad Gateway):
 *   1. Concurrency limiter — max 4 simultaneous LLM calls
 *   2. Rate limiter — minimum 1.2s between calls + jitter
 *   3. Retry + fallback — 3 retries per model, then switch to secondary model
 */

import crypto from 'crypto';
import type ZAISdk from 'z-ai-web-dev-sdk';

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
// Direct Zhipu AI API Client
// ============================================================

const ZHIPU_API_BASE = 'https://open.bigmodel.cn/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

/** Cached JWT token and expiry */
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Generate a JWT token for Zhipu AI API authentication.
 * The API key format is {id}.{secret}.
 * Caches the token until 5 minutes before expiry.
 */
function generateZhipuToken(): string {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  if (!ZHIPU_API_KEY || !ZHIPU_API_KEY.includes('.')) {
    throw new Error('ZHIPU_API_KEY is not configured or has invalid format (expected: id.secret)');
  }

  const [id, secret] = ZHIPU_API_KEY.split('.');

  // Zhipu AI JWT structure
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' })).toString('base64url');
  const now = Date.now();
  const exp = now + 3600 * 1000; // 1 hour expiry
  const payload = Buffer.from(JSON.stringify({
    api_key: id,
    exp,
    timestamp: now,
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const token = `${header}.${payload}.${signature}`;
  cachedToken = { token, expiresAt: exp };

  return token;
}

/**
 * Make a direct chat completion call to the Zhipu AI API.
 * Returns the response data or throws on error.
 */
async function directZhipuChatCompletion(params: {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  max_tokens: number;
}): Promise<{ choices: Array<{ message: { content: string }; finish_reason: string }> }> {
  const token = generateZhipuToken();

  const response = await fetch(`${ZHIPU_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(60_000), // 60s timeout — reasoning models need more time
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    const errorData = errorBody ? (() => { try { return JSON.parse(errorBody); } catch { return null; } })() : null;
    const errorMessage = errorData?.error?.message || `Zhipu API returned ${response.status}`;
    throw new Error(`Zhipu API error ${response.status}: ${errorMessage}`);
  }

  const data = await response.json() as {
    choices: Array<{ message: { content: string }; finish_reason: string }>;
  };

  if (!data.choices || !Array.isArray(data.choices)) {
    throw new Error('Zhipu API returned invalid response structure');
  }

  return data;
}

// ============================================================
// Connection Mode Detection
// ============================================================

type ConnectionMode = 'direct' | 'sdk' | 'auto';
let connectionMode: ConnectionMode = 'auto';

/**
 * Get the preferred connection mode.
 * In 'auto' mode, tries direct API first, then SDK for each call.
 * If a mode has been confirmed working, it's cached.
 */
async function getConnectionMode(): Promise<ConnectionMode> {
  if (connectionMode !== 'auto') return connectionMode;

  // Prefer direct API if ZHIPU_API_KEY is configured
  if (ZHIPU_API_KEY && ZHIPU_API_KEY.includes('.')) {
    return 'direct'; // Don't test — just try it on the actual call
  }

  return 'sdk';
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
// Unified Rate Limiter
// ============================================================

let lastCallTime = 0;
const MIN_INTERVAL_MS = 2000; // 2s between calls to avoid rate limits
const JITTER_MS = 800;

async function waitForRateLimit() {
  const now = Date.now();
  const elapsed = now - lastCallTime;
  const waitTime = MIN_INTERVAL_MS - elapsed + Math.random() * JITTER_MS;
  if (waitTime > 0) {
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastCallTime = Date.now();
}

/**
 * Exported so agent-reach-bridge.ts can share the same rate limiter.
 */
export { waitForRateLimit };

// ============================================================
// SDK Singleton (lazy init, reuse across calls)
// ============================================================

let zaiInstance: InstanceType<typeof ZAISdk> | null = null;

/**
 * Get the shared SDK singleton instance.
 * Exported so agent-reach-bridge.ts can reuse the same instance.
 */
export async function getSDK(): Promise<InstanceType<typeof ZAISdk>> {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
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
  return msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit') || msg.includes('访问量过大');
}

// ============================================================
// Core LLM Call — with concurrency, model fallback and retry
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
  /** Number of retries per model before falling back, default 3 */
  retriesPerModel?: number;
  /** Whether to fall back to the other model on failure, default true */
  useFallback?: boolean;
}

/**
 * Make a single LLM call using the best available connection.
 * Tries the detected connection mode, falls back to the other if it fails.
 */
async function makeLLMCall(
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature: number,
  maxTokens: number,
): Promise<string | null> {
  const mode = await getConnectionMode();

  // Try the primary connection mode first
  if (mode === 'direct' || mode === 'auto') {
    try {
      const result = await directZhipuChatCompletion({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      // The glm-4.7-flash model sometimes returns content in reasoning_content
      // with empty content field — extract reasoning_content as fallback
      let content = result.choices?.[0]?.message?.content || '';
      
      if (!content.trim()) {
        // Try to get reasoning content if available (some models return it)
        const reasoningContent = (result.choices?.[0]?.message as Record<string, unknown>)?.reasoning_content;
        if (typeof reasoningContent === 'string' && reasoningContent.trim()) {
          // reasoning_content is the model's chain-of-thought — we don't use it
          // The model just didn't produce final content, treat as empty
          console.warn(`[makeLLMCall] Model ${model} returned reasoning but no content (likely hit max_tokens during reasoning)`);
        }
      }

      if (content.trim() && !isHtmlContent(content)) {
        // Cache successful mode
        connectionMode = 'direct';
        return content;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      // If rate limited, don't fall back to SDK (SDK won't help)
      if (msg.includes('429')) {
        console.warn(`[makeLLMCall] Rate limited on ${model}, waiting before retry...`);
        throw err; // Let the retry logic handle rate limits
      }
      console.warn(`[makeLLMCall] Direct API failed for ${model}: ${msg.slice(0, 150)}`);

      // If direct fails with non-rate-limit error, try SDK
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
          console.log(`[makeLLMCall] SDK fallback succeeded for ${model}`);
          return content;
        }
      } catch (sdkErr) {
        console.warn(`[makeLLMCall] SDK fallback also failed: ${sdkErr instanceof Error ? sdkErr.message.slice(0, 100) : 'Unknown'}`);
      }
    }
  } else if (mode === 'sdk') {
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
        return content;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown';
      console.warn(`[makeLLMCall] SDK failed for ${model}: ${msg.slice(0, 150)}`);

      // If SDK fails, try direct API as fallback
      if (ZHIPU_API_KEY && ZHIPU_API_KEY.includes('.')) {
        try {
          const result = await directZhipuChatCompletion({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          });
          const content = result.choices?.[0]?.message?.content || '';
          if (content.trim() && !isHtmlContent(content)) {
            connectionMode = 'direct';
            console.log(`[makeLLMCall] Direct API fallback succeeded for ${model}`);
            return content;
          }
        } catch (directErr) {
          console.warn(`[makeLLMCall] Direct API fallback also failed: ${directErr instanceof Error ? directErr.message.slice(0, 100) : 'Unknown'}`);
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
 * 2. Wait for rate limiter (1.2s + jitter between calls)
 * 3. Try the primary model (glm-4.7-flash) with retries
 * 4. If all retries fail, try the secondary model (glm-4.6v-flash)
 * 5. Returns null if both models fail (graceful degradation)
 */
export async function callLLM(options: LLMCallOptions): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.3,
    maxTokens = 16384, // glm-4.7-flash uses reasoning tokens; 16K ensures enough output for content
    model = MODEL_PRIMARY,
    retriesPerModel = 2, // Reduced from 3 to avoid rate limits
    useFallback = true,
  } = options;

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
          await waitForRateLimit();

          const content = await makeLLMCall(
            currentModel,
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userMessage },
            ],
            temperature,
            maxTokens,
          );

          if (content && content.trim()) {
            console.log(`[callLLM] Success with ${currentModel} on attempt ${attempt + 1}`);
            return content;
          }

          // Empty response — retry
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

          if (attempt < retriesPerModel) {
            let backoffMs = 1500;
            if (isGatewayErr) backoffMs = (attempt + 1) * 2500 + Math.random() * 1500;
            else if (isRateErr) backoffMs = (attempt + 1) * 2000 + Math.random() * 800;

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
        maxTokens: options?.maxTokens ?? 16384,
        model: options?.model,
        retriesPerModel: options?.retriesPerModel ?? 1,
        useFallback: options?.useFallback ?? true,
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
