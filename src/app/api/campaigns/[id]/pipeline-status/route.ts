import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/campaigns/[id]/pipeline-status
 *
 * Returns real-time pipeline progress for a campaign.
 * The frontend polls this endpoint while the pipeline is running.
 *
 * Response includes:
 * - Overall pipeline status (idle, running, completed, failed)
 * - Per-stage progress (discovery, enrichment, qualification, outreach)
 * - Lead counts found so far
 * - Any errors encountered
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: campaignId } = await params;

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Get all agent tasks for this campaign
    const tasks = await db.agentTask.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'asc' },
    });

    // Get lead counts by stage
    const leads = await db.lead.findMany({
      where: { campaignId },
      select: {
        stage: true,
        leadTier: true,
      },
    });

    const leadsFound = leads.length;
    const leadsEnriched = leads.filter(l => ['enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
    const leadsQualified = leads.filter(l => ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
    const leadsContacted = leads.filter(l => ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
    const hotLeads = leads.filter(l => l.leadTier === 'hot').length;
    const warmLeads = leads.filter(l => l.leadTier === 'warm').length;
    const coldLeads = leads.filter(l => l.leadTier === 'cold').length;

    // Map pipeline stages to their agent tasks
    const pipelineStages = ['prospect-discovery', 'data-enrichment', 'lead-qualification', 'outreach-composer'];

    const stages: Record<string, {
      status: string;
      progress: number;
      startedAt: string | null;
      completedAt: string | null;
      error: string | null;
      result?: Record<string, unknown>;
    }> = {};

    for (const stageName of pipelineStages) {
      const stageTasks = tasks.filter(t => t.agentName === stageName);
      const latestTask = stageTasks[stageTasks.length - 1]; // Get the most recent task for this stage

      if (latestTask) {
        let parsedOutput: Record<string, unknown> | null = null;
        try {
          parsedOutput = latestTask.output ? JSON.parse(latestTask.output) : null;
        } catch {
          // Ignore parse errors
        }

        // Supabase returns dates as ISO strings, not Date objects.
        // Ensure we always return a string (or null), never a Date.
        const ensureISOString = (v: unknown): string | null => {
          if (!v) return null;
          if (typeof v === 'string') return v;
          if (v instanceof Date) return v.toISOString();
          return String(v);
        };

        stages[stageName] = {
          status: latestTask.status,
          progress: latestTask.progress,
          startedAt: ensureISOString(latestTask.startedAt),
          completedAt: ensureISOString(latestTask.completedAt),
          error: latestTask.error || null,
          result: parsedOutput || undefined,
        };
      } else {
        stages[stageName] = {
          status: 'pending',
          progress: 0,
          startedAt: null,
          completedAt: null,
          error: null,
        };
      }
    }

    // Determine overall pipeline status
    const stageStatuses = pipelineStages.map(s => stages[s]?.status || 'pending');
    const hasRunning = stageStatuses.includes('running');
    const allCompleted = stageStatuses.every(s => s === 'completed');
    const hasFailed = stageStatuses.includes('failed');
    const anyStarted = stageStatuses.some(s => s !== 'pending');

    let pipelineStatus: string;
    if (!anyStarted) {
      pipelineStatus = 'idle';
    } else if (allCompleted) {
      pipelineStatus = 'completed';
    } else if (hasFailed && !hasRunning) {
      pipelineStatus = 'failed';
    } else if (hasRunning) {
      pipelineStatus = 'running';
    } else {
      // Some completed, some pending (between stages)
      pipelineStatus = 'running';
    }

    // Calculate overall progress (average of all stages)
    const overallProgress = Math.round(
      pipelineStages.reduce((sum, s) => sum + (stages[s]?.progress || 0), 0) / pipelineStages.length
    );

    // Determine current stage label
    let currentStage = '';
    if (pipelineStatus === 'running') {
      for (const stageName of pipelineStages) {
        if (stages[stageName]?.status === 'running') {
          currentStage = stageName;
          break;
        }
      }
      if (!currentStage) {
        // Between stages — find the next pending stage
        for (const stageName of pipelineStages) {
          if (stages[stageName]?.status === 'pending') {
            currentStage = stageName;
            break;
          }
        }
      }
    }

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      pipelineStatus,
      overallProgress,
      currentStage,
      stages,
      summary: {
        leadsFound,
        leadsEnriched,
        leadsQualified,
        leadsContacted,
        hotLeads,
        warmLeads,
        coldLeads,
      },
      errors: tasks
        .filter(t => t.error)
        .map(t => ({ agent: t.agentName, error: t.error })),
    });
  } catch (error) {
    console.error('Error fetching pipeline status:', error);
    return NextResponse.json({ error: 'Failed to fetch pipeline status' }, { status: 500 });
  }
}
