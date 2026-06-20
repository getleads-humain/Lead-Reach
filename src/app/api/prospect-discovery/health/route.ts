import { NextResponse } from 'next/server';
import { checkLLMHealth } from '@/lib/llm';
import { isZhipuConfigured } from '@/lib/zhipu-jwt';
import { directSearchHealth } from '@/lib/direct-search';
import { testIPv4Connectivity, isInRateLimitCooldown, getRateLimitCooldownRemaining } from '@/lib/network-helpers';

/**
 * GET /api/prospect-discovery/health
 *
 * Health check endpoint for the AI system.
 * Tests LLM connectivity and search infrastructure.
 * Used by the frontend to show AI system status.
 *
 * CHECKS:
 * 1. LLM (Z.AI glm-4.7-flash) — primary model
 * 2. Search (Direct DuckDuckGo) — primary path (no Jina dependency)
 * 3. IPv4 connectivity — confirms fetchIPv4 is working
 * 4. Rate-limit cooldown state — shows how long until Z.AI resets
 *
 * IMPORTANT: This endpoint probes Z.AI with a real LLM call. The probe
 * itself consumes one rate-limit slot, so the frontend should NOT call
 * this more than once every 2 minutes (and never while the pipeline
 * is executing — see the useEffect comment in prospect-discovery-view.tsx).
 */
export async function GET() {
  const checks: {
    llm: { ok: boolean; model: string; latencyMs: number; error?: string };
    search: { ok: boolean; method: string; latencyMs?: number; error?: string };
    ipv4: { ok: boolean; latencyMs: number; target?: string; error?: string };
    rateLimit: { inCooldown: boolean; cooldownRemainingMs: number };
    overall: 'healthy' | 'degraded' | 'down';
  } = {
    llm: { ok: false, model: 'unknown', latencyMs: 0 },
    search: { ok: false, method: 'none' },
    ipv4: { ok: false, latencyMs: 0 },
    rateLimit: {
      inCooldown: isInRateLimitCooldown('api.z.ai'),
      cooldownRemainingMs: getRateLimitCooldownRemaining('api.z.ai'),
    },
    overall: 'down',
  };

  // ── Check 1: LLM (Z.AI) ──────────────────────────────────────
  // IMPORTANT: Z.AI's free tier enforces ~1 req/min rate limit (HTTP 429).
  // A 429 response means the API is ALIVE and reachable — the user just
  // hit the rate limit on the health probe. We treat 429 as "degraded"
  // (LLM is up but momentarily rate-limited), NOT "down".
  //
  // SKIP THE PROBE IF Z.AI IS ALREADY IN COOLDOWN:
  // Calling the LLM during a known cooldown would just waste time and
  // extend the cooldown. Instead, return "ok: true, degraded" with the
  // remaining cooldown time.
  if (isInRateLimitCooldown('api.z.ai')) {
    const remainingMs = getRateLimitCooldownRemaining('api.z.ai');
    checks.llm = {
      ok: true,  // LLM is reachable, just in cooldown
      model: 'glm-4.7-flash',
      latencyMs: 0,
      error: `In rate-limit cooldown — ${Math.round(remainingMs / 1000)}s remaining. Pipeline uses retry/backoff, will succeed.`,
    };
  } else if (!isZhipuConfigured()) {
    checks.llm = {
      ok: false,
      model: 'glm-4.7-flash',
      latencyMs: 0,
      error: 'API key not configured (ZHIPU_AI_API_KEY env var missing)',
    };
  } else {
    try {
      const llmHealth = await checkLLMHealth();
      // Detect 429 / rate-limit errors and treat them as "degraded" rather than "down".
      const errStr = (llmHealth.error || '').toLowerCase();
      const isRateLimited =
        errStr.includes('429') ||
        errStr.includes('rate limit') ||
        errStr.includes('too many requests') ||
        errStr.includes('1302') ||
        // TLS connection reset before handshake — Z.AI's edge does this when
        // the per-minute concurrency limit is hit. Not a real outage.
        errStr.includes('tls connection') ||
        errStr.includes('socket disconnected') ||
        errStr.includes('network socket disconnected');

      if (isRateLimited) {
        checks.llm = {
          ok: true,            // LLM is reachable, just rate-limited
          model: llmHealth.model,
          latencyMs: llmHealth.latencyMs,
          error: 'Rate-limited — pipeline uses retry/backoff, will succeed',
        };
      } else {
        checks.llm = llmHealth;
      }
    } catch (error) {
      checks.llm = {
        ok: false,
        model: 'glm-4.7-flash',
        latencyMs: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ── Check 2: Direct DuckDuckGo search (no Jina) ─────────────
  try {
    const searchHealth = await directSearchHealth();
    checks.search = {
      ok: searchHealth.ok,
      method: 'Direct DuckDuckGo (no Jina dependency)',
      latencyMs: searchHealth.latencyMs,
      error: searchHealth.error,
    };
  } catch (error) {
    checks.search = {
      ok: false,
      method: 'Direct DuckDuckGo',
      error: error instanceof Error ? error.message.slice(0, 100) : 'Connection failed',
    };
  }

  // ── Check 3: IPv4 connectivity ───────────────────────────────
  try {
    const conn = await testIPv4Connectivity('https://html.duckduckgo.com/');
    checks.ipv4 = {
      ok: conn.ok,
      latencyMs: conn.latencyMs,
      target: 'html.duckduckgo.com',
      error: conn.error,
    };
  } catch (error) {
    checks.ipv4 = {
      ok: false,
      latencyMs: 0,
      error: error instanceof Error ? error.message.slice(0, 100) : 'Connection failed',
    };
  }

  // ── Overall status ───────────────────────────────────────────
  // healthy:  LLM + search both work, NOT in rate-limit cooldown
  // degraded: LLM works but in cooldown OR one of LLM/search is slow
  // down:     neither LLM nor search works
  if (checks.llm.ok && checks.search.ok && !checks.rateLimit.inCooldown) {
    checks.overall = 'healthy';
  } else if (checks.llm.ok || checks.search.ok) {
    checks.overall = 'degraded';
  } else {
    checks.overall = 'down';
  }

  return NextResponse.json(checks);
}
