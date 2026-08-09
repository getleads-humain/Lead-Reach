import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent, createWorkforceTask } from '@/lib/workforce/engine';

/**
 * GET /api/workforce/[id]/tasks — List tasks for an agent with pagination and filtering
 * Query: ?status=running&page=1&limit=20
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

    const [tasks, total] = await Promise.all([
      db.workforceTask.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.workforceTask.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Workforce API] Error listing tasks:', error);
    return NextResponse.json(
      { error: 'Failed to list workforce tasks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workforce/[id]/tasks — Create a new task for an agent
 * Body: { title, description?, taskType, priority?, input?, relatedEntityType?, relatedEntityId?, dueDate? }
 */
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const { title, description, taskType, priority, input: taskInput, relatedEntityType, relatedEntityId, dueDate } = body;

    if (!title || !taskType) {
      return NextResponse.json(
        { error: 'title and taskType are required' },
        { status: 400 }
      );
    }

    const task = await createWorkforceTask({
      agentId: agent.id,
      title,
      description,
      taskType,
      priority,
      input: taskInput ? (typeof taskInput === 'string' ? taskInput : JSON.stringify(taskInput)) : undefined,
      relatedEntityType,
      relatedEntityId,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('[Workforce API] Error creating task:', error);
    const message = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
