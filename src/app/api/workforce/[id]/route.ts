import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent } from '@/lib/workforce/engine';

/**
 * GET /api/workforce/[id] — Get a single workforce agent with counts
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

    // Get related counts
    const [tasksCount, sessionsCount, documentsCount] = await Promise.all([
      db.workforceTask.count({ where: { agentId: agent.id } }),
      db.workforceSession.count({ where: { agentId: agent.id } }),
      db.workforceDocument.count({ where: { agentId: agent.id } }),
    ]);

    return NextResponse.json({
      agent,
      _count: { tasks: tasksCount, sessions: sessionsCount, documents: documentsCount },
    });
  } catch (error) {
    console.error('[Workforce API] Error fetching agent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workforce agent' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workforce/[id] — Update an agent's fields
 * Body: { status?, health?, healthScore?, config?, priority?, maxConcurrentTasks?, model?, temperature?, maxTokens?, systemPrompt?, scheduleType? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Verify agent exists
    const existing = await getWorkforceAgent(id);
    if (!existing) {
      return NextResponse.json(
        { error: `Agent not found: ${id}` },
        { status: 404 }
      );
    }

    // Build update data from allowed fields
    const allowedFields = [
      'status', 'health', 'healthScore', 'config', 'priority',
      'maxConcurrentTasks', 'model', 'temperature', 'maxTokens',
      'systemPrompt', 'scheduleType', 'scheduleCron', 'name',
      'description', 'avatar', 'color', 'isManaged',
    ];

    const data: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const agent = await db.workforceAgent.update({
      where: { id: existing.id },
      data,
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('[Workforce API] Error updating agent:', error);
    const message = error instanceof Error ? error.message : 'Failed to update agent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/workforce/[id] — Delete an agent (only if not isManaged)
 */
export async function DELETE(
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

    if (agent.isManaged) {
      return NextResponse.json(
        { error: 'Cannot delete a platform-managed agent. Set isManaged=false first.' },
        { status: 403 }
      );
    }

    await db.workforceAgent.delete({ where: { id: agent.id } });

    return NextResponse.json({ deleted: true, id: agent.id });
  } catch (error) {
    console.error('[Workforce API] Error deleting agent:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete agent';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
