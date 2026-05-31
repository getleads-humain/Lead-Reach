/**
 * Agent Cron / Scheduler System
 * ===============================
 * Manages scheduled and recurring tasks for each agent.
 * Supports:
 *   - Cron expressions (e.g., "0 star/6 * * *" for every 6 hours)
 *   - Fixed-rate intervals (e.g., "every_30_min")
 *   - One-time scheduled tasks (e.g., "run tomorrow at 9am")
 *
 * The scheduler checks for due jobs and creates AgentTask records
 * for the agent executor to pick up.
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type ScheduleType = 'cron' | 'fixed_rate' | 'one_time';

export interface CronJobCreate {
  agentName: AgentName;
  name: string;
  description?: string;
  schedule: string;
  scheduleType: ScheduleType;
  timezone?: string;
  taskType: string;
  taskInput?: Record<string, unknown>;
  sessionId?: string;
  maxRuns?: number;
}

export interface CronJobUpdate {
  schedule?: string;
  scheduleType?: ScheduleType;
  timezone?: string;
  status?: string;
  taskInput?: Record<string, unknown>;
  maxRuns?: number;
}

// ── Interval Parsing ───────────────────────────────────────────

const INTERVAL_MS: Record<string, number> = {
  'every_5_min': 5 * 60 * 1000,
  'every_15_min': 15 * 60 * 1000,
  'every_30_min': 30 * 60 * 1000,
  'every_1_hour': 60 * 60 * 1000,
  'every_6_hours': 6 * 60 * 60 * 1000,
  'every_12_hours': 12 * 60 * 60 * 1000,
  'every_24_hours': 24 * 60 * 60 * 1000,
  'every_day': 24 * 60 * 60 * 1000,
  'every_week': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Parse a schedule string into a millisecond interval.
 * For cron expressions, returns the approximate interval.
 */
export function parseScheduleInterval(schedule: string, scheduleType: ScheduleType): number {
  if (scheduleType === 'fixed_rate') {
    return INTERVAL_MS[schedule] || parseInt(schedule, 10) || 3600000;
  }

  if (scheduleType === 'one_time') {
    return 0; // One-time jobs don't repeat
  }

  // Cron expression — parse basic patterns
  // This is a simplified parser; production would use a cron library
  const parts = schedule.trim().split(/\s+/);
  if (parts.length === 5) {
    // Standard cron: min hour day month weekday
    // Check for simple patterns
    if (parts[0].startsWith('*/')) {
      const minutes = parseInt(parts[0].replace('*/', ''), 10);
      if (!isNaN(minutes)) return minutes * 60 * 1000;
    }
    if (parts[1].startsWith('*/')) {
      const hours = parseInt(parts[1].replace('*/', ''), 10);
      if (!isNaN(hours)) return hours * 60 * 60 * 1000;
    }
  }

  // Default: 1 hour
  return 3600000;
}

/**
 * Calculate the next run time for a schedule.
 */
export function calculateNextRun(schedule: string, scheduleType: ScheduleType, timezone?: string): Date {
  const now = new Date();
  const interval = parseScheduleInterval(schedule, scheduleType);

  if (scheduleType === 'one_time') {
    // For one-time, parse the schedule as a date or return now
    try {
      const parsed = new Date(schedule);
      if (!isNaN(parsed.getTime()) && parsed > now) return parsed;
    } catch { /* fallback */ }
    return now;
  }

  return new Date(now.getTime() + interval);
}

// ── CRUD Operations ────────────────────────────────────────────

/**
 * Create a new cron job.
 */
export async function createCronJob(job: CronJobCreate) {
  const nextRunAt = calculateNextRun(job.schedule, job.scheduleType, job.timezone);

  return db.agentCronJob.create({
    data: {
      agentName: job.agentName,
      sessionId: job.sessionId || null,
      name: job.name,
      description: job.description || null,
      schedule: job.schedule,
      scheduleType: job.scheduleType,
      timezone: job.timezone || 'UTC',
      nextRunAt,
      taskType: job.taskType,
      taskInput: job.taskInput ? JSON.stringify(job.taskInput) : null,
      maxRuns: job.maxRuns || null,
      status: 'active',
    },
  });
}

/**
 * List cron jobs, optionally filtered by agent.
 */
export async function listCronJobs(agentName?: AgentName) {
  return db.agentCronJob.findMany({
    where: agentName ? { agentName } : {},
    orderBy: { nextRunAt: 'asc' },
  });
}

/**
 * Update a cron job.
 */
export async function updateCronJob(id: string, updates: CronJobUpdate) {
  const data: Record<string, unknown> = { ...updates };
  if (updates.taskInput) data.taskInput = JSON.stringify(updates.taskInput);
  if (updates.schedule || updates.scheduleType) {
    const job = await db.agentCronJob.findUnique({ where: { id } });
    if (job) {
      data.nextRunAt = calculateNextRun(
        updates.schedule || job.schedule,
        updates.scheduleType || (job.scheduleType as ScheduleType),
        job.timezone || undefined
      );
    }
  }
  return db.agentCronJob.update({ where: { id }, data });
}

/**
 * Delete a cron job.
 */
export async function deleteCronJob(id: string) {
  return db.agentCronJob.delete({ where: { id } });
}

/**
 * Pause a cron job.
 */
export async function pauseCronJob(id: string) {
  return db.agentCronJob.update({ where: { id }, data: { status: 'paused' } });
}

/**
 * Resume a paused cron job.
 */
export async function resumeCronJob(id: string) {
  const job = await db.agentCronJob.findUnique({ where: { id } });
  if (!job) throw new Error('Cron job not found');
  return db.agentCronJob.update({
    where: { id },
    data: {
      status: 'active',
      nextRunAt: calculateNextRun(job.schedule, job.scheduleType as ScheduleType, job.timezone || undefined),
    },
  });
}

// ── Scheduler Tick ─────────────────────────────────────────────

/**
 * Check for due cron jobs and create AgentTask records for them.
 * This function should be called periodically (e.g., every minute)
 * by the application scheduler.
 *
 * Returns the number of jobs that were triggered.
 */
export async function tickCronScheduler(): Promise<number> {
  const now = new Date();

  // Find all active jobs that are due
  const dueJobs = await db.agentCronJob.findMany({
    where: {
      status: 'active',
      nextRunAt: { lte: now },
    },
  });

  let triggered = 0;

  for (const job of dueJobs) {
    try {
      // Check max runs
      if (job.maxRuns !== null && job.runCount >= job.maxRuns) {
        await db.agentCronJob.update({
          where: { id: job.id },
          data: { status: 'completed' },
        });
        continue;
      }

      // Create an AgentTask for this cron job
      await db.agentTask.create({
        data: {
          agentName: job.agentName,
          taskType: job.taskType,
          status: 'pending',
          priority: 5,
          input: job.taskInput || JSON.stringify({ source: 'cron', cronJobId: job.id, cronJobName: job.name }),
          campaignId: job.sessionId || null,
        },
      });

      // Update the cron job's run tracking
      const nextRun = calculateNextRun(
        job.schedule,
        job.scheduleType as ScheduleType,
        job.timezone || undefined
      );

      await db.agentCronJob.update({
        where: { id: job.id },
        data: {
          runCount: { increment: 1 },
          lastRunAt: now,
          nextRunAt: job.scheduleType === 'one_time' ? null : nextRun,
          status: job.scheduleType === 'one_time' ? 'completed' : 'active',
        },
      });

      triggered++;
    } catch (error) {
      // Increment fail count but keep job active
      await db.agentCronJob.update({
        where: { id: job.id },
        data: {
          failCount: { increment: 1 },
          nextRunAt: calculateNextRun(job.schedule, job.scheduleType as ScheduleType, job.timezone || undefined),
        },
      });
    }
  }

  return triggered;
}
