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
 * Spawn a pipeline worker as a completely detached child process.
 * Uses `bun run` which handles TypeScript natively.
 * 
 * Key: We use detached mode + unref so the child process is completely
 * independent from the Next.js server. If the server restarts, the
 * pipeline continues running.
 */
function spawnPipelineWorker(campaignId: string, query: string, industry: string, location: string) {
  console.log(`[Campaigns] Spawning pipeline worker for campaign ${campaignId}`);

  try {
    // Use shell command with nohup and background to completely decouple
    // the pipeline process from the Next.js server process.
    // This prevents any parent-child relationship that could cause crashes.
    const escapedQuery = query.replace(/'/g, "'\\''");
    const cmd = `cd /home/z/my-project && DATABASE_URL=file:./db/custom.db nohup bun run src/lib/workers/pipeline-worker.ts '${campaignId}' '${escapedQuery}' '${industry || ''}' '${location || ''}' > /tmp/pipeline-${campaignId}.log 2>&1 &`;
    
    const child = spawn('sh', ['-c', cmd], {
      stdio: 'ignore',
      detached: true,
    });

    child.unref();
    
    console.log(`[Campaigns] Pipeline worker launched via shell (PID: ${child.pid})`);
  } catch (spawnError) {
    console.error(`[Campaigns] Failed to spawn pipeline worker:`, spawnError);
  }
}

/**
 * Fallback: Run pipeline inline in the background.
 * Only used if spawn fails.
 */
async function runPipelineInBackground(campaignId: string, query: string, industry: string, location: string): Promise<void> {
  try {
    const { runFullPipeline } = await import('@/lib/agent-executor');
    
    console.log(`[Pipeline] Starting inline pipeline for campaign ${campaignId}: "${query}"`);
    
    const result = await runFullPipeline(query, industry || undefined, location || undefined, campaignId);
    
    console.log(`[Pipeline] Completed for ${campaignId}: ${result.summary.leadsFound} found, ${result.summary.leadsQualified} qualified, ${result.summary.leadsContacted} contacted`);
    
    if (result.summary.errors.length > 0) {
      console.warn(`[Pipeline] Errors for ${campaignId}: ${result.summary.errors.join('; ')}`);
    }

    try {
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          leadsFound: result.summary.leadsFound,
          leadsQualified: result.summary.leadsQualified,
          leadsContacted: result.summary.leadsContacted,
          status: 'completed',
        },
      });
    } catch (dbErr) {
      console.error(`[Pipeline] Failed to update campaign ${campaignId}:`, dbErr);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Pipeline] Pipeline failed for ${campaignId}: ${msg}`);

    try {
      await db.agentTask.updateMany({
        where: { campaignId, status: 'running' },
        data: { status: 'failed', error: `Pipeline failed: ${msg}`, completedAt: new Date() },
      });
    } catch (dbErr) {
      console.error(`[Pipeline] Failed to update stuck tasks for ${campaignId}:`, dbErr);
    }
  }
}

/**
 * POST /api/campaigns
 *
 * Create a new campaign AND optionally auto-start the full agent pipeline.
 * Uses detached child process (bun run) for pipeline execution.
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

    // If autoRun, spawn the pipeline worker
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

      // Spawn the worker process (completely detached)
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
