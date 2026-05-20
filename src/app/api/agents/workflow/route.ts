import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (status) where.status = status;

    const tasks = await db.agentTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Group by workflow (tasks with same taskType prefix)
    const workflows: Record<string, unknown[]> = {};
    for (const task of tasks) {
      const key = task.taskType;
      if (!workflows[key]) workflows[key] = [];
      workflows[key].push({
        id: task.id,
        agentName: task.agentName,
        status: task.status,
        progress: task.progress,
        createdAt: task.createdAt,
        completedAt: task.completedAt,
        error: task.error,
      });
    }

    return NextResponse.json({ workflows, totalTasks: tasks.length });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskIds, action } = body;

    if (!taskIds || !Array.isArray(taskIds) || !action) {
      return NextResponse.json({ error: 'taskIds (array) and action are required' }, { status: 400 });
    }

    const validActions = ['cancel', 'retry', 'pause'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action. Use: ${validActions.join(', ')}` }, { status: 400 });
    }

    const results = [];

    for (const taskId of taskIds) {
      try {
        let updateData: Record<string, unknown> = {};

        switch (action) {
          case 'cancel':
            updateData = { status: 'cancelled', completedAt: new Date() };
            break;
          case 'retry':
            updateData = { status: 'pending', error: null, progress: 0, startedAt: null, completedAt: null };
            break;
          case 'pause':
            updateData = { status: 'pending' };
            break;
        }

        const updated = await db.agentTask.update({
          where: { id: taskId },
          data: updateData,
        });
        results.push({ id: taskId, status: updated.status });
      } catch {
        results.push({ id: taskId, error: 'Task not found' });
      }
    }

    return NextResponse.json({ action, results });
  } catch (error) {
    console.error('Error managing workflow:', error);
    return NextResponse.json({ error: 'Failed to manage workflow' }, { status: 500 });
  }
}
