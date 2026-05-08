import { db } from '@/lib/db';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        _count: { select: { leads: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

/**
 * Helper: Spawn a detached pipeline worker process
 */
function spawnPipelineWorker(campaignId: string, query: string, industry: string, location: string) {
  console.log(`[Campaigns] Spawning pipeline worker for campaign ${campaignId}`);

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
  });

  worker.on('error', (err: Error) => {
    console.error(`[Pipeline] Worker spawn error for ${campaignId}:`, err.message);
  });

  // Allow the parent process to exit independently
  worker.unref();
}

/**
 * POST /api/campaigns
 *
 * Create a new campaign AND optionally auto-start the full agent pipeline.
 * Uses spawn() to run the pipeline in a detached child process.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      targetIndustry,
      targetLocation,
      targetCompanySize,
      targetCriteria,
      autoRun = true,
      query: customQuery,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
    }

    // Create the campaign
    const campaign = await db.campaign.create({
      data: {
        name,
        description: description || null,
        targetIndustry: targetIndustry || null,
        targetLocation: targetLocation || null,
        targetCompanySize: targetCompanySize || null,
        targetCriteria: targetCriteria || null,
        status: 'active',
      },
      include: {
        _count: { select: { leads: true } },
      },
    });

    // If autoRun, spawn the pipeline worker directly (no self-fetch)
    if (autoRun) {
      const industry = campaign.targetIndustry || '';
      const location = campaign.targetLocation || '';
      let query: string;

      if (customQuery) {
        query = customQuery;
      } else if (industry && location) {
        query = `${industry} companies in ${location}`;
      } else if (industry) {
        query = `${industry} companies`;
      } else {
        query = campaign.name;
      }

      // Spawn the worker process directly
      spawnPipelineWorker(campaign.id, query, industry, location);
    }

    return NextResponse.json(
      {
        ...campaign,
        pipeline: {
          started: autoRun,
          status: autoRun ? 'running' : 'not_started',
          message: autoRun
            ? 'Pipeline started in the background. Poll /api/campaigns/[id]/pipeline-status for progress.'
            : 'Pipeline not started. POST to /api/campaigns/[id]/run-pipeline to start.',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
