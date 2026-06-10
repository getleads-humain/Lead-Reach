/**
 * /api/vellum/heartbeat — Heartbeat Management
 *
 * GET:  Get heartbeat status and config
 * POST: Start/stop heartbeat
 * PUT:  Update heartbeat config
 */

import { NextRequest } from 'next/server';
import { heartbeatManager, startHeartbeat, stopHeartbeat } from '@/lib/vellum-core/proactivity';
import type { HeartbeatConfig } from '@/lib/vellum-core/proactivity';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/heartbeat
 *
 * Get current heartbeat status and configuration.
 */
export async function GET() {
  try {
    const isRunning = heartbeatManager.getIsRunning();
    const state = heartbeatManager.getState();

    return Response.json(
      {
        success: true,
        isRunning,
        state,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumHeartbeat] GET error:', error);
    return Response.json(
      { error: 'Failed to get heartbeat status', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/heartbeat
 *
 * Start or stop the heartbeat.
 * Body: { action: 'start' | 'stop', config?, scopeId? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config, scopeId } = body as {
      action: 'start' | 'stop';
      config?: HeartbeatConfig;
      scopeId?: string;
    };

    if (!action || !['start', 'stop'].includes(action)) {
      return Response.json(
        { error: 'action must be "start" or "stop"' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (action === 'stop') {
      stopHeartbeat();
      return Response.json(
        { success: true, message: 'Heartbeat stopped', isRunning: false },
        { headers: CORS_HEADERS },
      );
    }

    // action === 'start'
    if (!config) {
      return Response.json(
        { error: 'config is required when starting heartbeat' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate config
    if (!config.intervalMs || config.intervalMs < 60000) {
      return Response.json(
        { error: 'intervalMs must be at least 60000 (1 minute)' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!config.timezone) {
      return Response.json(
        { error: 'timezone is required in config' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (!config.disposition) {
      return Response.json(
        { error: 'disposition prompt is required in config' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const effectiveScopeId = scopeId || 'default';

    startHeartbeat(config, effectiveScopeId);

    return Response.json(
      {
        success: true,
        message: 'Heartbeat started',
        isRunning: true,
        scopeId: effectiveScopeId,
        config: {
          intervalMs: config.intervalMs,
          timezone: config.timezone,
          activeHoursStart: config.activeHoursStart,
          activeHoursEnd: config.activeHoursEnd,
          maxConsecutiveRuns: config.maxConsecutiveRuns,
          maxDailyRuns: config.maxDailyRuns,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumHeartbeat] POST error:', error);
    return Response.json(
      { error: 'Failed to manage heartbeat', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/vellum/heartbeat
 *
 * Update the heartbeat configuration.
 * Requires stopping and restarting the heartbeat with new config.
 * Body: { config: HeartbeatConfig, scopeId? }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config, scopeId } = body as {
      config: HeartbeatConfig;
      scopeId?: string;
    };

    if (!config) {
      return Response.json(
        { error: 'config is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Stop existing heartbeat and restart with new config
    stopHeartbeat();
    startHeartbeat(config, scopeId || 'default');

    return Response.json(
      {
        success: true,
        message: 'Heartbeat configuration updated',
        isRunning: true,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumHeartbeat] PUT error:', error);
    return Response.json(
      { error: 'Failed to update heartbeat config', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
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
