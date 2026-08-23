import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/workforce/tasks — List recent tasks across ALL agents
 *
 * Query params:
 *   ?status=running        — filter by status (pending, running, completed, failed, cancelled)
 *   ?priority=high         — filter by priority
 *   ?limit=50              — max results (capped at 100)
 *   ?since=ISO8601         — only return tasks created after this timestamp
 *
 * Returns tasks with their parent agent (name/avatar/color/slug) attached.
 * Used by the Workforce Dashboard Live Orchestration Feed and Global Task Queue.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('limit') || '50', 10))
    );
    const sinceRaw = searchParams.get('since');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    } else {
      // By default, exclude cancelled tasks
      where.NOT = { status: 'cancelled' };
    }
    if (priority) where.priority = priority;
    if (sinceRaw) {
      const since = new Date(sinceRaw);
      if (!Number.isNaN(since.getTime())) {
        where.createdAt = { gt: since };
      }
    }

    const tasks = await db.workforceTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            avatar: true,
            color: true,
            slug: true,
            department: true,
          },
        },
      },
    });

    // Compute summary stats
    const total = tasks.length;
    const byStatus = {
      running: tasks.filter((t) => t.status === 'running' || t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      failed: tasks.filter((t) => t.status === 'failed').length,
    };

    return NextResponse.json({
      tasks,
      summary: { total, byStatus },
    });
  } catch (error) {
    console.error('[Workforce API] Error listing global tasks:', error);
    return NextResponse.json(
      { error: 'Failed to list workforce tasks' },
      { status: 500 }
    );
  }
}
