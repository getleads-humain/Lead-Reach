import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignIds = searchParams.get('campaignIds');

    if (!campaignIds) {
      return NextResponse.json({ error: 'campaignIds query parameter is required (comma-separated)' }, { status: 400 });
    }

    const ids = campaignIds.split(',').filter(Boolean);

    // Batch fetch all agent tasks for the given campaign IDs
    const allTasks = await db.agentTask.findMany({
      where: {
        campaignId: { in: ids },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Batch fetch all leads for the given campaign IDs
    const allLeads = await db.lead.findMany({
      where: { campaignId: { in: ids } },
      select: { campaignId: true, stage: true, leadTier: true, leadScore: true },
    });

    const pipelineStages = ['prospect-discovery', 'data-enrichment', 'lead-qualification', 'outreach-composer'];

    const results: Record<string, {
      totalLeads: number;
      byStage: Record<string, number>;
      byTier: Record<string, number>;
      averageScore: number;
      pipelineStatus: 'idle' | 'running' | 'completed' | 'failed';
      overallProgress: number;
      currentStage: string;
    }> = {};

    for (const id of ids) {
      const campaignLeads = allLeads.filter(l => l.campaignId === id);
      const tasks = allTasks.filter(t => t.campaignId === id);

      const byStage: Record<string, number> = {};
      const byTier: Record<string, number> = {};
      let totalScore = 0;

      for (const lead of campaignLeads) {
        byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
        byTier[lead.leadTier] = (byTier[lead.leadTier] || 0) + 1;
        totalScore += lead.leadScore;
      }

      // Determine pipeline status from agent tasks
      const stages: Record<string, { status: string; progress: number }> = {};
      for (const stageName of pipelineStages) {
        const stageTasks = tasks.filter(t => t.agentName === stageName);
        const latestTask = stageTasks[stageTasks.length - 1];
        if (latestTask) {
          stages[stageName] = { status: latestTask.status, progress: latestTask.progress };
        } else {
          stages[stageName] = { status: 'pending', progress: 0 };
        }
      }

      const stageStatuses = pipelineStages.map(s => stages[s]?.status || 'pending');
      const hasRunning = stageStatuses.includes('running');
      const allCompleted = stageStatuses.every(s => s === 'completed');
      const hasFailed = stageStatuses.includes('failed');
      const anyStarted = stageStatuses.some(s => s !== 'pending');

      let pipelineStatus: 'idle' | 'running' | 'completed' | 'failed';
      if (!anyStarted) {
        pipelineStatus = 'idle';
      } else if (allCompleted) {
        pipelineStatus = 'completed';
      } else if (hasFailed && !hasRunning) {
        pipelineStatus = 'failed';
      } else {
        pipelineStatus = 'running';
      }

      const overallProgress = Math.round(
        pipelineStages.reduce((sum, s) => sum + (stages[s]?.progress || 0), 0) / pipelineStages.length
      );

      let currentStage = '';
      if (pipelineStatus === 'running') {
        for (const stageName of pipelineStages) {
          if (stages[stageName]?.status === 'running') {
            currentStage = stageName;
            break;
          }
        }
        if (!currentStage) {
          for (const stageName of pipelineStages) {
            if (stages[stageName]?.status === 'pending') {
              currentStage = stageName;
              break;
            }
          }
        }
      }

      results[id] = {
        totalLeads: campaignLeads.length,
        byStage,
        byTier,
        averageScore: campaignLeads.length > 0 ? Math.round(totalScore / campaignLeads.length) : 0,
        pipelineStatus,
        overallProgress,
        currentStage,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching batch pipeline status:', error);
    return NextResponse.json({ error: 'Failed to fetch batch pipeline status' }, { status: 500 });
  }
}
