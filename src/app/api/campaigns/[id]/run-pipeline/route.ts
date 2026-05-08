import { db } from '@/lib/db';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/campaigns/[id]/run-pipeline
 *
 * Triggers the full 4-stage lead generation pipeline for a campaign.
 * Uses spawn() to run the pipeline in a detached child process.
 * The frontend polls GET /api/campaigns/[id]/pipeline-status for progress.
 */

const runningPipelines = new Set<string>();

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

    // Spawn the pipeline worker as a detached child process
    const worker = spawn('npx', [
      'tsx',
      'src/lib/workers/pipeline-worker.ts',
      campaignId,
      query,
      industry || '',
      location || '',
    ], {
      cwd: '/home/z/my-project',
      env: { ...process.env, DATABASE_URL: 'file:./db/custom.db' },
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: true,
    });

    worker.stdout?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) console.log(`[PipelineWorker] ${output.slice(0, 500)}`);
    });

    worker.stderr?.on('data', (data: Buffer) => {
      const output = data.toString().trim();
      if (output) console.warn(`[PipelineWorker:stderr] ${output.slice(0, 500)}`);
    });

    worker.on('close', (code: number) => {
      console.log(`[Pipeline] Worker for ${campaignId} exited with code ${code}`);
      runningPipelines.delete(campaignId);
    });

    worker.on('error', (err: Error) => {
      console.error(`[Pipeline] Worker spawn error:`, err.message);
      runningPipelines.delete(campaignId);
    });

    worker.unref();

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
