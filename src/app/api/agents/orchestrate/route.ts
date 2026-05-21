import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflow, campaignId, agents, input } = body;

    if (!workflow) {
      return NextResponse.json({ error: 'workflow is required' }, { status: 400 });
    }

    // Create orchestration task
    const task = await db.agentTask.create({
      data: {
        agentName: 'orchestrator',
        taskType: `orchestrate_${workflow}`,
        campaignId: campaignId || null,
        status: 'pending',
        priority: 8,
        input: JSON.stringify({
          workflow,
          agents: agents || [],
          input: input || {},
        }),
      },
    });

    // Create sub-tasks for each agent in the workflow
    const defaultAgents: Record<string, string[]> = {
      discover: ['prospect-discovery', 'data-enrichment'],
      qualify: ['data-enrichment', 'lead-qualification'],
      outreach: ['lead-qualification', 'outreach-composer'],
      full_pipeline: ['prospect-discovery', 'data-enrichment', 'lead-qualification', 'outreach-composer'],
    };

    const workflowAgents = agents || defaultAgents[workflow] || [];

    const subTasks = [];
    for (let i = 0; i < workflowAgents.length; i++) {
      const agentName = workflowAgents[i];
      const subTask = await db.agentTask.create({
        data: {
          agentName,
          taskType: workflow,
          campaignId: campaignId || null,
          status: 'pending',
          priority: 7 - i,
          input: JSON.stringify({
            parentTaskId: task.id,
            step: i + 1,
            totalSteps: workflowAgents.length,
            ...input,
          }),
        },
      });
      subTasks.push(subTask);
    }

    return NextResponse.json({
      taskId: task.id,
      workflow,
      agents: workflowAgents,
      subTasks: subTasks.map(t => ({ id: t.id, agentName: t.agentName, status: t.status })),
      status: 'orchestrated',
    }, { status: 201 });
  } catch (error) {
    console.error('Error orchestrating workflow:', error);
    return NextResponse.json({ error: 'Failed to orchestrate workflow' }, { status: 500 });
  }
}
