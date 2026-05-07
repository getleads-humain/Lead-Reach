import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/agent-executor';
import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/campaigns/[id]/run-pipeline
 *
 * Triggers the full 4-stage lead generation pipeline for a campaign.
 * The pipeline runs ASYNCHRONOUSLY using Next.js after() API —
 * this endpoint returns immediately and the frontend polls
 * GET /api/campaigns/[id]/pipeline-status for progress.
 *
 * Stages:
 * 1. Prospect Discovery → find leads across 6+ channels
 * 2. Data Enrichment → enrich leads with contact data
 * 3. Lead Qualification → score and tier leads
 * 4. Outreach Composer → craft personalized messages
 *
 * Body options:
 * - { query?: string } — Override search query (defaults to "{industry} companies in {location}")
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

    // Prevent running pipeline on non-active campaigns
    if (campaign.status === 'archived') {
      return NextResponse.json(
        { error: 'Cannot run pipeline on archived campaign. Resume it first.' },
        { status: 400 },
      );
    }

    // Check if a pipeline is already running for this campaign
    const runningTasks = await db.agentTask.findMany({
      where: {
        campaignId,
        status: 'running',
      },
    });
    if (runningTasks.length > 0) {
      return NextResponse.json(
        {
          started: false,
          status: 'already_running',
          message: 'A pipeline is already running for this campaign. Poll /api/campaigns/[id]/pipeline-status for progress.',
          runningTaskCount: runningTasks.length,
        },
        { status: 200 },
      );
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
    const query =
      body.query ||
      `${industry || campaign.name} companies in ${location || 'global'}`.trim();

    const campaignName = campaign.name;

    console.log(`[Pipeline] Scheduling pipeline for campaign "${campaignName}" (ID: ${campaignId})`);
    console.log(`[Pipeline] Query: "${query}", Industry: "${industry}", Location: "${location}"`);

    // Use after() to schedule the pipeline to run after the response is sent
    after(async () => {
      try {
        console.log(`[Pipeline] Starting pipeline for campaign "${campaignName}" (ID: ${campaignId})`);
        const result = await runFullPipeline(
          query,
          industry || undefined,
          location || undefined,
          campaignId,
        );
        console.log(`[Pipeline] Completed for campaign "${campaignName}": ${result.summary.leadsFound} found, ${result.summary.leadsQualified} qualified, ${result.summary.leadsContacted} contacted`);
      } catch (pipelineError) {
        console.error(`[Pipeline] Failed for campaign "${campaignName}":`, pipelineError);
      }
    });

    // Return immediately — the pipeline is scheduled to run after the response
    return NextResponse.json({
      started: true,
      status: 'running',
      campaignId,
      campaignName: campaign.name,
      message: 'Pipeline started in the background. Poll /api/campaigns/[id]/pipeline-status for progress.',
    });
  } catch (error) {
    console.error('[Pipeline] Campaign pipeline failed to start:', error);
    return NextResponse.json(
      {
        error: 'Pipeline execution failed to start',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
