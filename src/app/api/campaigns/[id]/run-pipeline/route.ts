import { db } from '@/lib/db';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

const runningPipelines = new Set<string>();

/**
 * POST /api/campaigns/[id]/run-pipeline
 *
 * Triggers the full 4-stage lead generation pipeline for a campaign.
 * Uses detached bun process for pipeline execution.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json().catch(() => ({}));

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot run pipeline on archived campaign.' },
        { status: 400 },
      );
    }

    if (runningPipelines.has(campaignId)) {
      return NextResponse.json({
        started: false,
        status: 'already_running',
        message: 'A pipeline is already running for this campaign.',
      });
    }

    const runningTasks = await db.agentTask.findMany({
      where: { campaignId, status: 'running' },
    });
    if (runningTasks.length > 0) {
      return NextResponse.json({
        started: false,
        status: 'already_running',
        message: 'A pipeline is already running for this campaign.',
      });
    }

    if (campaign.status !== 'active') {
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: 'active' },
      });
    }

    const industry = campaign.targetIndustry || '';
    const location = campaign.targetLocation || '';
    let query: string;

    if (body.query) {
      query = body.query;
    } else if (industry && location) {
      query = `${industry} companies in ${location}`;
    } else if (industry) {
      query = `${industry} companies`;
    } else {
      query = campaign.name;
    }

    runningPipelines.add(campaignId);

    // Spawn the pipeline as a completely detached process via shell
    try {
      const escapedQuery = query.replace(/'/g, "'\\''");
      const cmd = `cd /home/z/my-project && DATABASE_URL=file:./db/custom.db nohup bun run src/lib/workers/pipeline-worker.ts '${campaignId}' '${escapedQuery}' '${industry || ''}' '${location || ''}' > /tmp/pipeline-${campaignId}.log 2>&1 &`;
      
      const child = spawn('sh', ['-c', cmd], {
        stdio: 'ignore',
        detached: true,
      });

      child.unref();

      // Clean up the running set after a timeout
      setTimeout(() => {
        runningPipelines.delete(campaignId);
      }, 10 * 60 * 1000); // 10 minutes
    } catch (spawnError) {
      runningPipelines.delete(campaignId);
      console.error('[Pipeline] Failed to spawn worker:', spawnError);
    }

    return NextResponse.json({
      started: true,
      status: 'running',
      campaignId,
      campaignName: campaign.name,
      message: 'Pipeline started in the background. Poll /api/campaigns/[id]/pipeline-status for progress.',
    });
  } catch (error) {
    console.error('[Pipeline] Failed to start:', error);
    return NextResponse.json(
      { error: 'Pipeline execution failed to start', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
