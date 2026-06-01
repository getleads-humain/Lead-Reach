/**
 * Agent Logging System
 * =====================
 * Structured logging for all agent operations.
 * Every agent action is logged with:
 *   - Level (debug, info, warn, error, critical)
 *   - Category (execution, model, channel, memory, skill, plugin, system)
 *   - Performance metrics (duration, tokens)
 *   - Context (taskId, sessionId, skillId, pluginId)
 *
 * Logs are stored in AgentLog (Prisma/SQLite) and can be:
 *   - Queried by agent, level, category, or time range
 *   - Aggregated for performance analytics
 *   - Streamed to external observability (future)
 */

import { db } from '@/lib/db';
import type { AgentName } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory = 'execution' | 'model' | 'channel' | 'memory' | 'skill' | 'plugin' | 'system' | 'cron' | 'session';

export interface LogEntry {
  agentName: AgentName;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
  taskId?: string;
  skillId?: string;
  pluginId?: string;
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}

export interface LogQuery {
  agentName?: AgentName;
  level?: LogLevel;
  category?: LogCategory;
  sessionId?: string;
  taskId?: string;
  since?: Date;
  until?: Date;
  limit?: number;
}

// ── Core Logging Functions ─────────────────────────────────────

/**
 * Write a structured log entry for an agent.
 */
export async function writeLog(entry: LogEntry): Promise<void> {
  try {
    await db.agentLog.create({
      data: {
        agentName: entry.agentName,
        level: entry.level,
        category: entry.category,
        message: entry.message,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
        sessionId: entry.sessionId || null,
        taskId: entry.taskId || null,
        skillId: entry.skillId || null,
        pluginId: entry.pluginId || null,
        durationMs: entry.durationMs || null,
        tokensIn: entry.tokensIn || null,
        tokensOut: entry.tokensOut || null,
      },
    });
  } catch {
    // Logging should never break execution — swallow errors
  }
}

/**
 * Convenience: Log an info message.
 */
export async function logInfo(
  agentName: AgentName,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  context?: { sessionId?: string; taskId?: string }
): Promise<void> {
  await writeLog({ agentName, level: 'info', category, message, metadata, ...context });
}

/**
 * Convenience: Log a warning.
 */
export async function logWarn(
  agentName: AgentName,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  context?: { sessionId?: string; taskId?: string }
): Promise<void> {
  await writeLog({ agentName, level: 'warn', category, message, metadata, ...context });
}

/**
 * Convenience: Log an error.
 */
export async function logError(
  agentName: AgentName,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  context?: { sessionId?: string; taskId?: string }
): Promise<void> {
  await writeLog({ agentName, level: 'error', category, message, metadata, ...context });
}

/**
 * Convenience: Log a critical error.
 */
export async function logCritical(
  agentName: AgentName,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  context?: { sessionId?: string; taskId?: string }
): Promise<void> {
  await writeLog({ agentName, level: 'critical', category, message, metadata, ...context });
}

/**
 * Convenience: Log a debug message (only in development).
 */
export async function logDebug(
  agentName: AgentName,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>,
  context?: { sessionId?: string; taskId?: string }
): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    await writeLog({ agentName, level: 'debug', category, message, metadata, ...context });
  }
}

// ── Log Retrieval ──────────────────────────────────────────────

/**
 * Query logs with filtering.
 */
export async function queryLogs(query: LogQuery = {}) {
  return db.agentLog.findMany({
    where: {
      ...(query.agentName ? { agentName: query.agentName } : {}),
      ...(query.level ? { level: query.level } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.sessionId ? { sessionId: query.sessionId } : {}),
      ...(query.taskId ? { taskId: query.taskId } : {}),
      ...(query.since || query.until ? {
        createdAt: {
          ...(query.since ? { gte: query.since } : {}),
          ...(query.until ? { lte: query.until } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: query.limit || 100,
  });
}

/**
 * Get recent errors for an agent.
 */
export async function getRecentErrors(agentName: AgentName, limit: number = 20) {
  return db.agentLog.findMany({
    where: { agentName, level: { in: ['error', 'critical'] } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get agent performance summary (aggregate log metrics).
 */
export async function getAgentPerformance(agentName: AgentName, since?: Date) {
  const logs = await db.agentLog.findMany({
    where: {
      agentName,
      category: 'model',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
  });

  const modelCalls = logs.length;
  const totalTokensIn = logs.reduce((sum, l) => sum + (l.tokensIn || 0), 0);
  const totalTokensOut = logs.reduce((sum, l) => sum + (l.tokensOut || 0), 0);
  const avgDurationMs = modelCalls > 0
    ? logs.reduce((sum, l) => sum + (l.durationMs || 0), 0) / modelCalls
    : 0;
  const successCount = logs.filter(l => l.level === 'info').length;
  const failCount = logs.filter(l => l.level === 'warn' || l.level === 'error').length;

  return {
    modelCalls,
    totalTokensIn,
    totalTokensOut,
    totalTokens: totalTokensIn + totalTokensOut,
    avgDurationMs: Math.round(avgDurationMs),
    successRate: modelCalls > 0 ? successCount / modelCalls : 0,
    failCount,
  };
}

/**
 * Clean up old logs (retention policy).
 */
export async function cleanupLogs(olderThanDays: number = 90): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - olderThanDays);

  const result = await db.agentLog.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  return result.count;
}
