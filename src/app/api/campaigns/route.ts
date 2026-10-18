import { db } from '@/lib/db';
import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates that an ID contains only safe characters (UUID format).
 * Prevents command injection in spawned processes.
 */
function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length <= 128;
}

/**
 * Validates that a string argument is safe to pass to a child process.
 * Rejects strings containing shell metacharacters, null bytes, or excessive length.
 * This prevents command injection even though spawn() uses argument arrays.
 */
function isSafeSpawnArg(value: string, maxLength = 1000): boolean {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.length > maxLength) return false;
  // Block null bytes and common shell metacharacters as defense-in-depth
  if (/[\x00`$\\!;|&<>(){}\[\]#~]/.test(value)) return false;
  return true;
}

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
 * 
 * Security: Uses spawn with direct argument array (no shell interpolation)
 * to prevent command injection. Input validation is performed on all
 * arguments before spawning.
 */
function spawnPipelineWorker(campaignId: string, query: string, industry: string, location: string) {
  console.log(`[Campaigns] Spawning pipeline worker for campaign ${campaignId}`);

  // Validate all inputs to prevent command injection (CodeQL: uncontrolled command line)
  if (!isValidId(campaignId)) {
    console.error(`[Campaigns] Invalid campaign ID rejected: ${campaignId.slice(0, 50)}`);
    return;
  }
  if (!isSafeSpawnArg(query, 1000)) {
    console.error(`[Campaigns] Invalid query rejected for pipeline worker`);
    return;
  }
  if (industry && !isSafeSpawnArg(industry, 200)) {
    console.error(`[Campaigns] Invalid industry rejected for pipeline worker`);
    return;
  }
  if (location && !isSafeSpawnArg(location, 200)) {
    console.error(`[Campaigns] Invalid location rejected for pipeline worker`);
    return;
  }

  try {
    // Use spawn with direct argument array (no shell -c) to prevent command injection.
    // Arguments are passed directly to bun without shell interpretation.
    const logFile = `/tmp/pipeline-${campaignId}.log`;
    const child = spawn('bun', [
      'run',
      'src/lib/workers/pipeline-worker.ts',
      campaignId,
      query,
      industry || '',
      location || '',
    ], {
      stdio: [
        'ignore',  // stdin
        'pipe',    // stdout -> log file
        'pipe',    // stderr -> log file
      ],
      detached: true,
      env: {
        ...process.env,
        DATABASE_URL: 'file:./db/custom.db',
      },
      cwd: '/home/z/my-project',
    });

    // Redirect stdout/stderr to log file
    const fs = require('fs');
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    child.stdout?.pipe(logStream);
    child.stderr?.pipe(logStream);

    child.unref();
    
    console.log(`[Campaigns] Pipeline worker launched via bun (PID: ${child.pid})`);
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
      autoRun = false,
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
            ? 'Legacy pipeline started in the background. Poll /api/campaigns/[id]/pipeline-status for progress.'
            : 'Campaign created. Open the campaign and click "Run Discovery Pipeline" to start the 8-agent pipeline via /api/campaigns/[id]/stream.',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
