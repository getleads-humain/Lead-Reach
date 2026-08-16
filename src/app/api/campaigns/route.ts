import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// NOTE: spawn-based pipeline worker removed. The SSE stream endpoint
// (POST /api/campaigns/[id]/stream) is the reliable pipeline path.
// When autoRun is requested, we use the inline runPipelineInBackground
// which runs the 8-agent orchestrator in-process instead of spawning
// a detached child process that can fail silently.

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

// spawnPipelineWorker removed — replaced by inline runPipelineInBackground
// and the SSE stream endpoint which are more reliable.

/**
 * Run pipeline inline in the background (not detached).
 * Uses the 8-agent orchestrator from agent-executor.
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
 * Uses inline pipeline execution (not detached child process).
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

    // If autoRun, run the pipeline inline (not detached spawn)
    // This is more reliable than spawning a child process which can
    // fail silently. The 8-agent orchestrator runs in-process.
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

      // Run inline (not detached) — the SSE stream endpoint is the
      // PRIMARY path. This is a fallback for programmatic API usage.
      runPipelineInBackground(campaign.id, query, industry, location);
    }

    return NextResponse.json(
      {
        ...campaign,
        pipeline: {
          started: autoRun,
          status: autoRun ? 'running' : 'not_started',
          message: autoRun
            ? 'Pipeline started inline. Open the campaign detail view for live SSE progress via /api/campaigns/[id]/stream.'
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
