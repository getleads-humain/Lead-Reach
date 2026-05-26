/**
 * Centralized LLM Utility — LeadReach AI
 *
 * Uses exactly two models via z-ai-web-dev-sdk:
 *   - glm-4.7-flash  (primary — fast, high-quality text generation)
 *   - glm-4.6v-flash (secondary — vision-capable, fallback for text)
 *
 * All LLM calls in the application should go through this module
 * to ensure consistent model usage, rate limiting, and error handling.
 */

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
// Unified Rate Limiter (shared across ALL z-ai-web-dev-sdk calls)
// ============================================================

// IMPORTANT: Both callLLM (chat.completions.create) and agent-reach-bridge
// (functions.invoke) go through the same z-ai-web-dev-sdk gateway.
// A single shared rate limiter prevents concurrent bursts that cause 502s.

let lastCallTime = 0;
const MIN_INTERVAL_MS = 2500; // 2.5s between calls — balances throughput vs 502 risk
const JITTER_MS = 800; // Random jitter to avoid thundering herd

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
 * This prevents LLM calls and search calls from firing simultaneously
 * and overwhelming the shared z-ai-web-dev-sdk gateway.
 */
export { waitForRateLimit };

// ============================================================
// SDK Singleton (lazy init, reuse across calls)
// ============================================================

let zaiInstance: InstanceType<typeof ZAISdk> | null = null;

async function getSDK(): Promise<InstanceType<typeof ZAISdk>> {
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
  );
}

function isRateLimitError(msg: string): boolean {
  return msg.includes('429') || msg.includes('Too many requests') || msg.includes('rate limit');
}

// ============================================================
// Core LLM Call — with model fallback and retry
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
}

/**
 * Call the LLM with automatic model fallback.
 *
 * Strategy:
 * 1. Try the primary model (glm-4.7-flash) with retries
 * 2. If all retries fail, try the secondary model (glm-4.6v-flash)
 * 3. Returns null if both models fail (graceful degradation)
 */
export async function callLLM(options: LLMCallOptions): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.3,
    maxTokens = 4096,
    model = MODEL_PRIMARY,
    retriesPerModel = 3, // Increased from 2 to 3 for better 502 resilience
    useFallback = true,
  } = options;

  const modelsToTry: LLMModel[] = [model];
  if (useFallback) {
    const fallback = model === MODEL_PRIMARY ? MODEL_VISION : MODEL_PRIMARY;
    if (!modelsToTry.includes(fallback)) modelsToTry.push(fallback);
  }

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        await waitForRateLimit();

        const zai = await getSDK();
        const completion = await zai.chat.completions.create({
          model: currentModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature,
          max_tokens: maxTokens,
        });

        // Validate response structure
        if (!completion || !completion.choices || !Array.isArray(completion.choices)) {
          throw new Error('LLM returned invalid response structure (possible gateway error)');
        }

        const content = completion.choices?.[0]?.message?.content || '';

        // Detect HTML in response
        if (isHtmlContent(content)) {
          throw new Error('LLM returned HTML instead of text (API gateway error page)');
        }

        if (content.trim()) {
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
          // Exponential backoff with jitter for 502/gateway errors
          let backoffMs = 2000;
          if (isGatewayErr) backoffMs = (attempt + 1) * 4000 + Math.random() * 2000; // 4-6s, 8-10s, 12-14s
          else if (isRateErr) backoffMs = (attempt + 1) * 3000 + Math.random() * 1000; // 3-4s, 6-7s, 9-10s

          console.warn(`[callLLM] Waiting ${Math.round(backoffMs)}ms before retry ${attempt + 2} on ${currentModel}...`);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }

        // This model exhausted its retries — log and try next model
        console.warn(`[callLLM] ${currentModel} exhausted all ${retriesPerModel + 1} attempts, ${useFallback ? 'trying fallback model...' : 'giving up.'}`);
      }
    }
  }

  // Both models failed
  console.error('[callLLM] All models failed, returning null for graceful degradation');
  return null;
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
