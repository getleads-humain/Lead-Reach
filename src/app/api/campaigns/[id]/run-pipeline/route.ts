import { db } from '@/lib/db';
import { exec } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/campaigns/[id]/run-pipeline
 *
 * Triggers the full 4-stage lead generation pipeline for a campaign.
 * 
 * The pipeline runs in a SEPARATE Node.js worker process to prevent
 * blocking or crashing the Next.js server during long-running execution.
 * This endpoint returns immediately after spawning the worker.
 *
 * The frontend polls GET /api/campaigns/[id]/pipeline-status for progress.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json().catch(() => ({}));

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Prevent running pipeline on archived campaigns
    if (campaign.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot run pipeline on archived campaign. Resume it first.' },
        { status: 400 },
      );
    }

    // Check if a pipeline is already running for this campaign
    const runningTasks = await db.agentTask.findMany({
      where: { campaignId, status: 'running' },
    });
    if (runningTasks.length > 0) {
      return NextResponse.json({
        started: false,
        status: 'already_running',
        message: 'A pipeline is already running for this campaign.',
        runningTaskCount: runningTasks.length,
      });
    }

    // Ensure campaign is active
    if (campaign.status !== 'active') {
      await db.campaign.update({
        where: { id: campaignId },
        data: { status: 'active' },
      });
    }

    // Build query from campaign data
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
      // Use the campaign name as the query, which often contains the full search intent
      query = campaign.name;
    }

    const campaignName = campaign.name;
    console.log(`[Pipeline] Spawning worker for campaign "${campaignName}" (ID: ${campaignId})`);

    // Use the compiled worker JS (faster startup than npx tsx)
    // IMPORTANT: In standalone mode, process.cwd() is .next/standalone/, but the
    // dist/ directory might be at the project root. We check multiple locations.
    const fs = await import('fs/promises');
    const possibleRoots = [
      process.cwd(),
      '/home/z/my-project',
      // In standalone mode, the project root is one level up from .next/standalone/
      process.cwd().replace('/.next/standalone', ''),
    ];

    let workerPath = '';
    let projectRoot = '';
    for (const root of possibleRoots) {
      const candidate = `${root}/dist/lib/workers/pipeline-worker.js`;
      try {
        await fs.access(candidate);
        workerPath = candidate;
        projectRoot = root;
        break;
      } catch {
        // Not found, try next
      }
    }

    if (!workerPath) {
      console.error('[Pipeline] Could not find pipeline-worker.js in any expected location');
      return NextResponse.json(
        { error: 'Pipeline worker not found. Please rebuild the project.' },
        { status: 500 },
      );
    }

    console.log(`[Pipeline] Using worker at: ${workerPath} (projectRoot: ${projectRoot})`);
    const workerCommand = `node "${workerPath}" "${campaignId}" "${query.replace(/"/g, '\\"')}" "${industry}" "${location}"`;

    exec(workerCommand, {
      cwd: projectRoot,
      timeout: 10 * 60 * 1000, // 10 minute timeout (increased from 5min for full pipeline)
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Pipeline] Worker error for "${campaignName}":`, error.message);
      }
      if (stdout) {
        console.log(`[Pipeline] Worker output:`, stdout.trim());
      }
      if (stderr) {
        console.warn(`[Pipeline] Worker stderr:`, stderr.trim().slice(0, 500));
      }
    });

    // Return immediately — the worker runs in the background
    return NextResponse.json({
      started: true,
      status: 'running',
      campaignId,
      campaignName,
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
