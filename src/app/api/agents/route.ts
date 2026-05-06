import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');
    const status = searchParams.get('status');
    const campaignId = searchParams.get('campaignId');

    const where: Record<string, unknown> = {};
    if (agentName) where.agentName = agentName;
    if (status) where.status = status;
    if (campaignId) where.campaignId = campaignId;

    const tasks = await db.agentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const agentStats: Record<string, { completed: number; running: number; failed: number; pending: number }> = {};
    for (const task of tasks) {
      if (!agentStats[task.agentName]) {
        agentStats[task.agentName] = { completed: 0, running: 0, failed: 0, pending: 0 };
      }
      if (task.status === 'completed') agentStats[task.agentName].completed++;
      else if (task.status === 'running') agentStats[task.agentName].running++;
      else if (task.status === 'failed') agentStats[task.agentName].failed++;
      else agentStats[task.agentName].pending++;
    }

    return NextResponse.json({ tasks, agentStats });
  } catch (error) {
    console.error('Error fetching agent tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch agent tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, taskType, campaignId, priority, input: taskInput } = body;

    if (!agentName || !taskType) {
      return NextResponse.json({ error: 'agentName and taskType are required' }, { status: 400 });
    }

    const task = await db.agentTask.create({
      data: {
        agentName,
        taskType,
        campaignId: campaignId || null,
        priority: priority || 5,
        input: taskInput ? JSON.stringify(taskInput) : null,
        status: 'pending',
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating agent task:', error);
    return NextResponse.json({ error: 'Failed to create agent task' }, { status: 500 });
  }
}
