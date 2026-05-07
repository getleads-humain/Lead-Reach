import { NextRequest, NextResponse } from 'next/server';
import { executeTask, executeAllPendingTasks, dispatchAndExecute } from '@/lib/agent-executor';
import type { AgentName } from '@/lib/types';

/**
 * POST /api/agents/execute
 * 
 * Execute agent tasks using the Agent Execution Engine.
 * This is the endpoint that actually runs Agent-Reach tools.
 * 
 * Body options:
 * - { mode: 'single', taskId: '...' } — Execute a specific task
 * - { mode: 'all' } — Execute all pending tasks
 * - { mode: 'dispatch', agentName: '...', taskType: '...', input: {...} } — Create & execute immediately
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const mode = body.mode || 'single';

    switch (mode) {
      case 'single': {
        const { taskId } = body;
        if (!taskId) {
          return NextResponse.json({ error: 'taskId is required for single mode' }, { status: 400 });
        }
        const result = await executeTask(taskId);
        return NextResponse.json(result);
      }

      case 'all': {
        const result = await executeAllPendingTasks();
        return NextResponse.json(result);
      }

      case 'dispatch': {
        const { agentName, taskType, input, campaignId, priority } = body;
        if (!agentName || !taskType) {
          return NextResponse.json({ error: 'agentName and taskType are required for dispatch mode' }, { status: 400 });
        }

        const validAgents: AgentName[] = [
          'orchestrator', 'prospect-discovery', 'data-enrichment', 'web-research',
          'lead-qualification', 'outreach-composer', 'pipeline-manager', 'report-generator',
        ];

        if (!validAgents.includes(agentName as AgentName)) {
          return NextResponse.json({ error: `Invalid agentName. Must be one of: ${validAgents.join(', ')}` }, { status: 400 });
        }

        const result = await dispatchAndExecute(
          agentName as AgentName,
          taskType,
          input || {},
          campaignId,
          priority || 5,
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown mode: ${mode}. Use 'single', 'all', or 'dispatch'` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in agent execute endpoint:', error);
    return NextResponse.json(
      { error: 'Agent execution failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/agents/execute?taskId=...
 * Check execution status of a task
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'taskId query parameter is required' }, { status: 400 });
    }

    const { db } = await import('@/lib/db');
    const task = await db.agentTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        agentName: true,
        taskType: true,
        status: true,
        progress: true,
        error: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error checking task status:', error);
    return NextResponse.json({ error: 'Failed to check task status' }, { status: 500 });
  }
}
