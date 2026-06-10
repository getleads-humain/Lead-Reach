import { NextResponse } from 'next/server';
import { checkLLMHealth } from '@/lib/llm';
import { isZhipuConfigured } from '@/lib/zhipu-jwt';

/**
 * GET /api/prospect-discovery/health
 *
 * Health check endpoint for the AI system.
 * Tests LLM connectivity and returns status information.
 * Used by the frontend to show AI system status.
 */
export async function GET() {
  const checks: {
    llm: { ok: boolean; model: string; latencyMs: number; error?: string };
    search: { ok: boolean; method: string; error?: string };
    overall: 'healthy' | 'degraded' | 'down';
  } = {
    llm: { ok: false, model: 'unknown', latencyMs: 0 },
    search: { ok: false, method: 'none' },
    overall: 'down',
  };

  // Check LLM connectivity
  try {
    if (!isZhipuConfigured()) {
      checks.llm = {
        ok: false,
        model: 'glm-4.6v-flash',
        latencyMs: 0,
        error: 'API key not configured',
      };
    } else {
      const llmHealth = await checkLLMHealth();
      checks.llm = llmHealth;
    }
  } catch (error) {
    checks.llm = {
      ok: false,
      model: 'glm-4.6v-flash',
      latencyMs: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check search connectivity (lightweight test - just verify Jina Reader is reachable)
  try {
    const start = Date.now();
    const response = await fetch('https://r.jina.ai/https://example.com', {
      headers: { 'Accept': 'text/markdown' },
      signal: AbortSignal.timeout(10000),
    });
    if (response.ok) {
      checks.search = {
        ok: true,
        method: 'Jina Reader (DuckDuckGo + Web)',
      };
    } else {
      checks.search = {
        ok: false,
        method: 'Jina Reader',
        error: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    checks.search = {
      ok: false,
      method: 'Jina Reader',
      error: error instanceof Error ? error.message.slice(0, 100) : 'Connection failed',
    };
  }

  // Determine overall health
  if (checks.llm.ok && checks.search.ok) {
    checks.overall = 'healthy';
  } else if (checks.llm.ok || checks.search.ok) {
    checks.overall = 'degraded';
  } else {
    checks.overall = 'down';
  }

  return NextResponse.json(checks);
}
