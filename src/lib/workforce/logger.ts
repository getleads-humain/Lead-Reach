/**
 * Workforce Activity Logger
 * =========================
 * Provides structured logging for all AI workforce agent activities.
 * Every action an agent takes — task completion, chat message, health
 * check, deploy, enrichment — is logged with full time-based indexing
 * for the Work Log viewer.
 *
 * Usage:
 *   import { logAgentActivity } from '@/lib/workforce/logger';
 *   await logAgentActivity(agentId, {
 *     category: 'task',
 *     action: 'completed_task',
 *     description: 'Completed code review for PR #247',
 *     level: 'info',
 *     details: JSON.stringify({ taskId, duration: 4200 }),
 *     duration: 4200,
 *   });
 */

import { db } from '@/lib/db';

export interface LogEntry {
  category: 'task' | 'chat' | 'health' | 'deploy' | 'enrich' | 'discover' | 'system' | 'decision';
  action: string;
  description: string;
  level?: 'debug' | 'info' | 'warn' | 'error' | 'critical';
  details?: string;
  duration?: number;
}

/**
 * Log an agent activity to the WorkforceLog table.
 * Automatically extracts year/month/day/hour from the current time.
 */
export async function logAgentActivity(agentId: string, entry: LogEntry): Promise<void> {
  try {
    const now = new Date();
    await db.workforceLog.create({
      data: {
        agentId,
        logDate: now,
        year: now.getFullYear(),
        month: now.getMonth() + 1,    // 1-12
        day: now.getDate(),             // 1-31
        hour: now.getHours(),           // 0-23
        dayOfWeek: now.getDay(),        // 0=Sunday
        level: entry.level || 'info',
        category: entry.category,
        action: entry.action,
        description: entry.description,
        details: entry.details || null,
        duration: entry.duration || null,
      },
    });
  } catch (err) {
    // Don't let logging failures break the main operation
    console.error('[WorkforceLogger] Failed to log activity:', err);
  }
}

/**
 * Log a batch of activities (useful for seeding or bulk operations).
 */
export async function logBatchActivities(
  agentId: string,
  entries: LogEntry[],
  timestamp?: Date
): Promise<void> {
  if (entries.length === 0) return;
  const ts = timestamp || new Date();

  try {
    await db.workforceLog.createMany({
      data: entries.map(entry => ({
        agentId,
        logDate: ts,
        year: ts.getFullYear(),
        month: ts.getMonth() + 1,
        day: ts.getDate(),
        hour: ts.getHours(),
        dayOfWeek: ts.getDay(),
        level: entry.level || 'info',
        category: entry.category,
        action: entry.action,
        description: entry.description,
        details: entry.details || null,
        duration: entry.duration || null,
      })),
    });
  } catch (err) {
    console.error('[WorkforceLogger] Failed to batch log:', err);
  }
}

/**
 * Get aggregated log stats for a time period.
 */
export async function getLogStats(
  agentId: string,
  opts: { year?: number; month?: number; day?: number }
): Promise<{
  totalLogs: number;
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  byHour: number[];
}> {
  const where: Record<string, unknown> = { agentId };
  if (opts.year) where.year = opts.year;
  if (opts.month) where.month = opts.month;
  if (opts.day) where.day = opts.day;

  const logs = await db.workforceLog.findMany({
    where,
    select: { category: true, level: true, hour: true },
  });

  const byCategory: Record<string, number> = {};
  const byLevel: Record<string, number> = {};
  const byHour = new Array(24).fill(0);

  for (const log of logs) {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    byLevel[log.level] = (byLevel[log.level] || 0) + 1;
    byHour[log.hour]++;
  }

  return {
    totalLogs: logs.length,
    byCategory,
    byLevel,
    byHour,
  };
}
