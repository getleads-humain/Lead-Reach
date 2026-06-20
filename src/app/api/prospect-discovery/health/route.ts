import { NextResponse } from 'next/server';
import { checkLLMHealth } from '@/lib/llm';
import { isZhipuConfigured } from '@/lib/zhipu-jwt';
import { directSearchHealth } from '@/lib/direct-search';
import { testIPv4Connectivity } from '@/lib/network-helpers';

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
 */
export async function GET() {
  const checks: {
    llm: { ok: boolean; model: string; latencyMs: number; error?: string };
    search: { ok: boolean; method: string; latencyMs?: number; error?: string };
    ipv4: { ok: boolean; latencyMs: number; target?: string; error?: string };
    overall: 'healthy' | 'degraded' | 'down';
  } = {
    llm: { ok: false, model: 'unknown', latencyMs: 0 },
    search: { ok: false, method: 'none' },
    ipv4: { ok: false, latencyMs: 0 },
    overall: 'down',
  };

  // ── Check 1: LLM (Z.AI) ──────────────────────────────────────
  try {
    if (!isZhipuConfigured()) {
      checks.llm = {
        ok: false,
        model: 'glm-4.7-flash',
        latencyMs: 0,
        error: 'API key not configured (ZHIPU_AI_API_KEY env var missing)',
      };
    } else {
      const llmHealth = await checkLLMHealth();
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

  // ── Check 2: Direct DuckDuckGo search (no Jina) ─────────────
  // Jina Reader returns HTTP 401 from this server's IP ("bad IP reputation"),
  // so we use direct DuckDuckGo HTML fetch instead. This is the primary
  // search path used by exaSearch, linkedInSearchPeople, etc.
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
  // Verifies that fetchIPv4 is working (bypasses broken IPv6).
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
  // healthy: LLM + search both work
  // degraded: one works, one doesn't
  // down: neither works
  if (checks.llm.ok && checks.search.ok) {
    checks.overall = 'healthy';
  } else if (checks.llm.ok || checks.search.ok) {
    checks.overall = 'degraded';
  } else {
    checks.overall = 'down';
  }

  return NextResponse.json(checks);
}
