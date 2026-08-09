import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent } from '@/lib/workforce/engine';

/**
 * GET /api/workforce/[id]/sessions — List sessions for an agent, most recent first
 * Query: ?page=1&limit=20&status=active
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);

    if (!agent) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { agentId: agent.id };
    if (status) where.status = status;

    const [sessions, total] = await Promise.all([
      db.workforceSession.findMany({
        where,
        orderBy: { lastActivityAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          purpose: true,
          status: true,
          messageCount: true,
          tokensUsed: true,
          tasksCompleted: true,
          tasksFailed: true,
          startedAt: true,
          endedAt: true,
          lastActivityAt: true,
          summary: true,
        },
      }),
      db.workforceSession.count({ where }),
    ]);

    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Workforce API] Error listing sessions:', error);
    return NextResponse.json(
      { error: 'Failed to list workforce sessions' },
      { status: 500 }
    );
  }
}
