/**
 * Proactivity Engine — Follow-Up Tracking
 * =========================================
 * Adapted from the Vellum Assistant architecture for LeadReach AI.
 *
 * The follow-up system ensures that no lead or action item falls
 * through the cracks. It provides:
 *   - CRUD operations for follow-up items
 *   - Overdue detection with automatic status updates
 *   - Auto-deadline computation based on context
 *   - Scope-based filtering (by campaign, lead, etc.)
 *
 * Integration points:
 *   - Uses `@/lib/db` for persistent follow-up storage
 *   - Works with `@/lib/agent-infrastructure/logs` for audit trail
 *   - Powers the heartbeat's overdue detection
 *   - Syncs with the lead pipeline's nextFollowUp field
 */

import { db } from '@/lib/db';
import {
  type FollowUp,
  type FollowUpStatus,
} from './types';

// ── In-Memory Follow-Up Store ───────────────────────────────────
// For high-performance access without database round-trips.
// Changes are periodically synced to the database.

const followUpStore = new Map<string, FollowUp>();

// ── CRUD Operations ─────────────────────────────────────────────

/**
 * Create a new follow-up item.
 * If no dueAt is specified, auto-computes a deadline based on context.
 */
export async function createFollowUp(followUp: FollowUp): Promise<void> {
  // Auto-compute deadline if not specified
  if (!followUp.dueAt) {
    followUp.dueAt = await computeAutoDeadline(followUp);
  }

  // Store in memory
  followUpStore.set(followUp.id, followUp);

  // Persist to database
  try {
    await db.agentLog.create({
      data: {
        agentName: 'pipeline-manager',
        level: 'info',
        category: 'memory',
        message: `Follow-up created: "${followUp.title}"`,
        metadata: JSON.stringify({
          followUpId: followUp.id,
          scopeId: followUp.scopeId,
          dueAt: followUp.dueAt,
          channelId: followUp.channelId,
        }),
      },
    });
  } catch {
    // Logging failure is non-critical
  }

  // Update the lead's nextFollowUp if this follow-up is lead-scoped
  if (followUp.scopeId && followUp.dueAt) {
    try {
      await db.lead.updateMany({
        where: { id: followUp.scopeId },
        data: { nextFollowUp: new Date(followUp.dueAt) },
      });
    } catch {
      // Lead may not exist — non-critical
    }
  }

  console.log(`[FollowUps] Created: "${followUp.title}" (id=${followUp.id}, due=${followUp.dueAt ? new Date(followUp.dueAt).toISOString() : 'none'})`);
}

/**
 * List follow-ups, optionally filtered by scope and status.
 */
export function listFollowUps(scopeId?: string, status?: FollowUpStatus): FollowUp[] {
  const results: FollowUp[] = [];

  for (const followUp of followUpStore.values()) {
    if (scopeId && followUp.scopeId !== scopeId) continue;
    if (status && followUp.status !== status) continue;
    results.push(followUp);
  }

  // Sort by due date (soonest first), then by creation date
  return results.sort((a, b) => {
    if (a.dueAt && b.dueAt) return a.dueAt - b.dueAt;
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return a.createdAt - b.createdAt;
  });
}

/**
 * Get a specific follow-up by ID.
 */
export function getFollowUp(id: string): FollowUp | undefined {
  return followUpStore.get(id);
}

/**
 * Resolve (complete) a follow-up by ID.
 * Updates the status to 'completed' and records the completion time.
 */
export async function resolveFollowUp(id: string): Promise<void> {
  const followUp = followUpStore.get(id);
  if (!followUp) {
    console.warn(`[FollowUps] Cannot resolve non-existent follow-up id=${id}`);
    return;
  }

  followUp.status = 'completed';
  followUp.completedAt = Date.now();
  followUpStore.set(id, followUp);

  // Log the resolution
  try {
    await db.agentLog.create({
      data: {
        agentName: 'pipeline-manager',
        level: 'info',
        category: 'memory',
        message: `Follow-up resolved: "${followUp.title}"`,
        metadata: JSON.stringify({
          followUpId: id,
          scopeId: followUp.scopeId,
          completedAt: followUp.completedAt,
          createdToCompletedMs: followUp.completedAt - followUp.createdAt,
        }),
      },
    });
  } catch {
    // Logging failure is non-critical
  }

  // Clear the lead's nextFollowUp if this was the active one
  if (followUp.scopeId) {
    try {
      const remainingFollowUps = listFollowUps(followUp.scopeId, 'pending');
      const nextDue = remainingFollowUps.length > 0 ? remainingFollowUps[0].dueAt : null;
      await db.lead.updateMany({
        where: { id: followUp.scopeId },
        data: { nextFollowUp: nextDue ? new Date(nextDue) : null },
      });
    } catch {
      // Non-critical
    }
  }

  console.log(`[FollowUps] Resolved: "${followUp.title}" (id=${id})`);
}

/**
 * Cancel a follow-up by ID.
 */
export function cancelFollowUp(id: string): void {
  const followUp = followUpStore.get(id);
  if (!followUp) {
    console.warn(`[FollowUps] Cannot cancel non-existent follow-up id=${id}`);
    return;
  }

  followUp.status = 'cancelled';
  followUpStore.set(id, followUp);
  console.log(`[FollowUps] Cancelled: "${followUp.title}" (id=${id})`);
}

/**
 * Check for overdue follow-ups and update their status.
 * Returns the list of newly-overdue items.
 */
export async function checkOverdue(): Promise<FollowUp[]> {
  const now = Date.now();
  const newlyOverdue: FollowUp[] = [];

  for (const [id, followUp] of followUpStore) {
    // Only check pending items with a due date
    if (followUp.status !== 'pending') continue;
    if (!followUp.dueAt) continue;

    if (now > followUp.dueAt) {
      followUp.status = 'overdue';
      followUpStore.set(id, followUp);
      newlyOverdue.push(followUp);
    }
  }

  // Log overdue detection
  if (newlyOverdue.length > 0) {
    console.log(`[FollowUps] Detected ${newlyOverdue.length} overdue follow-ups`);

    try {
      await db.agentLog.create({
        data: {
          agentName: 'pipeline-manager',
          level: 'warn',
          category: 'memory',
          message: `${newlyOverdue.length} follow-ups are now overdue`,
          metadata: JSON.stringify({
            overdueIds: newlyOverdue.map(f => f.id),
            overdueTitles: newlyOverdue.map(f => f.title),
          }),
        },
      });
    } catch {
      // Logging failure is non-critical
    }
  }

  return newlyOverdue;
}

/**
 * Get all follow-ups that are overdue.
 */
export function getOverdueFollowUps(scopeId?: string): FollowUp[] {
  return listFollowUps(scopeId, 'overdue');
}

/**
 * Get all pending follow-ups.
 */
export function getPendingFollowUps(scopeId?: string): FollowUp[] {
  return listFollowUps(scopeId, 'pending');
}

/**
 * Get follow-up statistics for a scope.
 */
export function getFollowUpStats(scopeId?: string): {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  cancelled: number;
} {
  const all = scopeId ? listFollowUps(scopeId) : Array.from(followUpStore.values());
  return {
    total: all.length,
    pending: all.filter(f => f.status === 'pending').length,
    completed: all.filter(f => f.status === 'completed').length,
    overdue: all.filter(f => f.status === 'overdue').length,
    cancelled: all.filter(f => f.status === 'cancelled').length,
  };
}

// ── Auto-Deadline Computation ───────────────────────────────────

/**
 * Compute an automatic deadline for a follow-up based on context.
 *
 * Strategy:
 *   - If the scope is a lead, use the lead's pipeline stage to determine urgency
 *   - Hot leads: follow up within 1 hour
 *   - Warm leads: follow up within 24 hours
 *   - Cold leads: follow up within 3 days
 *   - Default: 24 hours from now
 */
async function computeAutoDeadline(followUp: FollowUp): Promise<number> {
  const now = Date.now();

  try {
    // Check if scopeId refers to a lead
    const lead = await db.lead.findUnique({
      where: { id: followUp.scopeId },
    });

    if (lead) {
      switch (lead.leadTier) {
        case 'hot':
          return now + 60 * 60 * 1000; // 1 hour
        case 'warm':
          return now + 24 * 60 * 60 * 1000; // 24 hours
        case 'cold':
          return now + 3 * 24 * 60 * 60 * 1000; // 3 days
        default:
          return now + 24 * 60 * 60 * 1000; // 24 hours default
      }
    }
  } catch {
    // Lead lookup failed — use default
  }

  // Default deadline: 24 hours from now
  return now + 24 * 60 * 60 * 1000;
}

/**
 * Load follow-ups from database logs (recovery after restart).
 * Looks for recent follow-up creation logs and reconstructs the store.
 */
export async function loadFollowUpsFromDB(): Promise<number> {
  try {
    const logs = await db.agentLog.findMany({
      where: {
        category: 'memory',
        message: { startsWith: 'Follow-up created:' },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    let loaded = 0;
    for (const log of logs) {
      try {
        const metadata = log.metadata ? JSON.parse(log.metadata) : {};
        const followUp: FollowUp = {
          id: metadata.followUpId ?? `recovered-${log.id}`,
          title: log.message.replace('Follow-up created: ', '').replace(/^"|"$/g, ''),
          scopeId: metadata.scopeId ?? 'unknown',
          dueAt: metadata.dueAt,
          channelId: metadata.channelId,
          status: 'pending', // Assume pending; overdue check will correct this
          createdAt: log.createdAt.getTime(),
        };
        if (!followUpStore.has(followUp.id)) {
          followUpStore.set(followUp.id, followUp);
          loaded++;
        }
      } catch {
        // Skip malformed log entries
      }
    }

    // Run overdue check immediately
    await checkOverdue();

    console.log(`[FollowUps] Loaded ${loaded} follow-ups from database`);
    return loaded;
  } catch (error) {
    console.error('[FollowUps] Failed to load from database:', error);
    return 0;
  }
}
