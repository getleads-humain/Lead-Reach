/**
 * /api/vellum/schedule — Schedule Management
 *
 * GET:    List all schedules
 * POST:   Create a new schedule
 * PUT:    Update a schedule
 * DELETE: Remove a schedule
 */

import { NextRequest } from 'next/server';
import { scheduleManager, computeNextRunAt } from '@/lib/vellum-core/proactivity';
import type { ScheduleConfig, ScheduleMode } from '@/lib/vellum-core/proactivity';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/vellum/schedule
 *
 * List all registered schedules.
 */
export async function GET() {
  try {
    const schedules = scheduleManager.getAllSchedules();

    return Response.json(
      {
        success: true,
        schedules: schedules.map(s => ({
          ...s,
          nextRunAt: s.nextRunAt,
          lastRunAt: s.lastRunAt,
        })),
        total: schedules.length,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumSchedule] GET error:', error);
    return Response.json(
      { error: 'Failed to list schedules', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * POST /api/vellum/schedule
 *
 * Create a new schedule.
 * Body: { name, mode, cron?, scopeId, ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      mode,
      cron,
      rrule,
      timezone,
      scopeId,
      prompt,
      script,
      activeHoursStart,
      activeHoursEnd,
      maxConsecutiveRuns,
      maxDailyRuns,
      maxRetries,
      retryBackoffMs,
      conversationId,
      enabled,
    } = body as {
      name: string;
      mode: ScheduleMode;
      cron?: string;
      rrule?: string;
      timezone?: string;
      scopeId: string;
      prompt?: string;
      script?: string;
      activeHoursStart?: number;
      activeHoursEnd?: number;
      maxConsecutiveRuns?: number;
      maxDailyRuns?: number;
      maxRetries?: number;
      retryBackoffMs?: number;
      conversationId?: string;
      enabled?: boolean;
    };

    if (!name || !mode || !scopeId) {
      return Response.json(
        { error: 'name, mode, and scopeId are required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const validModes: ScheduleMode[] = ['notify', 'script', 'wake', 'execute'];
    if (!validModes.includes(mode)) {
      return Response.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(', ')}` },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const scheduleId = `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const config: ScheduleConfig = {
      id: scheduleId,
      name,
      mode,
      enabled: enabled ?? true,
      cron,
      rrule,
      timezone: timezone || 'UTC',
      activeHoursStart: activeHoursStart ?? 8,
      activeHoursEnd: activeHoursEnd ?? 22,
      maxConsecutiveRuns: maxConsecutiveRuns ?? 3,
      maxDailyRuns: maxDailyRuns ?? 2,
      maxRetries: maxRetries ?? 3,
      retryBackoffMs: retryBackoffMs ?? 5000,
      prompt,
      script,
      scopeId,
      conversationId,
      runCount: 0,
    };

    scheduleManager.addSchedule(config);

    return Response.json(
      {
        success: true,
        schedule: {
          ...config,
          nextRunAt: computeNextRunAt(config),
        },
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumSchedule] POST error:', error);
    return Response.json(
      { error: 'Failed to create schedule', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * PUT /api/vellum/schedule
 *
 * Update an existing schedule.
 * Body: { id, ...updates }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body as { id: string } & Partial<ScheduleConfig>;

    if (!id) {
      return Response.json(
        { error: 'id is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const existing = scheduleManager.getSchedule(id);
    if (!existing) {
      return Response.json(
        { error: `Schedule ${id} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    scheduleManager.updateSchedule(id, updates);

    const updated = scheduleManager.getSchedule(id);

    return Response.json(
      { success: true, schedule: updated },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumSchedule] PUT error:', error);
    return Response.json(
      { error: 'Failed to update schedule', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

/**
 * DELETE /api/vellum/schedule?id=xxx
 *
 * Remove a schedule by ID.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'id query parameter is required' },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const existing = scheduleManager.getSchedule(id);
    if (!existing) {
      return Response.json(
        { error: `Schedule ${id} not found` },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    scheduleManager.removeSchedule(id);

    return Response.json(
      { success: true, deleted: id },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error('[VellumSchedule] DELETE error:', error);
    return Response.json(
      { error: 'Failed to remove schedule', details: error instanceof Error ? error.message : 'Unknown' },
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
