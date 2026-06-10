/**
 * GET /api/vellum/health
 *
 * Health check endpoint for all Vellum Core subsystems.
 * Checks: Z.AI API connectivity, memory store, skills catalog,
 * scheduler, MCP connections, plugin system.
 */

import { NextRequest } from 'next/server';
import { getZAIProvider } from '@/lib/vellum-core';
import { getNodesByScope } from '@/lib/vellum-core/memory';
import { listAllSkills, loadSkillCatalog } from '@/lib/vellum-core/skills';
import { scheduleManager } from '@/lib/vellum-core/proactivity';
import { mcpClient } from '@/lib/vellum-core/mcp';
import { pluginManager } from '@/lib/vellum-core/plugins';
import { getToolRegistry } from '@/lib/vellum-core';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface SubsystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  details?: string;
  error?: string;
}

/**
 * GET handler — check health of all Vellum Core subsystems.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const subsystems: Record<string, SubsystemHealth> = {};

  // ── 1. Z.AI API Connectivity ─────────────────────────────────
  try {
    const provider = getZAIProvider();
    const isAvailable = provider.isModelAvailable('glm-4.7-flash');
    const usage = provider.getUsage();

    subsystems.zaiApi = {
      status: isAvailable ? 'healthy' : 'degraded',
      details: `Primary model available: ${isAvailable}. Total tokens used: ${usage.totalTokens}`,
    };
  } catch (error) {
    subsystems.zaiApi = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // ── 2. Memory Store ─────────────────────────────────────────
  try {
    const memStart = Date.now();
    const nodes = await getNodesByScope('__health_check__');
    const memLatency = Date.now() - memStart;

    subsystems.memoryStore = {
      status: 'healthy',
      latencyMs: memLatency,
      details: `Memory store accessible. Test query returned ${nodes.length} nodes.`,
    };
  } catch (error) {
    subsystems.memoryStore = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // ── 3. Skills Catalog ───────────────────────────────────────
  try {
    const skillsStart = Date.now();
    const skills = await listAllSkills();
    const skillsLatency = Date.now() - skillsStart;

    subsystems.skillsCatalog = {
      status: 'healthy',
      latencyMs: skillsLatency,
      details: `${skills.length} skills available`,
    };
  } catch (error) {
    subsystems.skillsCatalog = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown',
      details: 'Skill catalog may be partially available',
    };
  }

  // ── 4. Scheduler ────────────────────────────────────────────
  try {
    const schedules = scheduleManager.getAllSchedules();

    subsystems.scheduler = {
      status: 'healthy',
      details: `${schedules.length} schedules registered`,
    };
  } catch (error) {
    subsystems.scheduler = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // ── 5. MCP Connections ──────────────────────────────────────
  try {
    const healths = await mcpClient.getAllServerHealth();
    const connected = healths.filter(h => h.state === 'connected').length;
    const errored = healths.filter(h => h.state === 'error').length;

    subsystems.mcpConnections = {
      status: errored > 0 ? 'degraded' : 'healthy',
      details: `${connected} connected, ${errored} errored, ${healths.length} total`,
    };
  } catch (error) {
    subsystems.mcpConnections = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown',
      details: 'MCP health check failed',
    };
  }

  // ── 6. Plugin System ────────────────────────────────────────
  try {
    const plugins = pluginManager.getPlugins();
    const tools = pluginManager.getAllTools();

    subsystems.pluginSystem = {
      status: 'healthy',
      details: `${plugins.length} plugins registered, ${tools.length} plugin tools available`,
    };
  } catch (error) {
    subsystems.pluginSystem = {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // ── 7. Tool Registry ────────────────────────────────────────
  try {
    const registry = getToolRegistry();
    subsystems.toolRegistry = {
      status: 'healthy',
      details: `${registry.size} tools registered`,
    };
  } catch (error) {
    subsystems.toolRegistry = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown',
    };
  }

  // ── Overall Status ──────────────────────────────────────────
  const statuses = Object.values(subsystems).map(s => s.status);
  const hasUnhealthy = statuses.includes('unhealthy');
  const hasDegraded = statuses.includes('degraded');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  const totalDuration = Date.now() - startTime;

  return Response.json(
    {
      success: true,
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: totalDuration,
      subsystems,
      version: '1.0.0',
    },
    {
      status: overallStatus === 'unhealthy' ? 503 : 200,
      headers: CORS_HEADERS,
    },
  );
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      'Access-Control-Max-Age': '86400',
    },
  });
}
