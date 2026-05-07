import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/agent-executor';
import { after } from 'next/server';
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
 * POST /api/campaigns
 *
 * Create a new campaign AND optionally auto-start the full agent pipeline.
 *
 * IMPORTANT: The pipeline runs ASYNCHRONOUSLY using Next.js after() API.
 * This endpoint returns immediately after creating the campaign.
 * The frontend polls GET /api/campaigns/[id]/pipeline-status for real-time progress.
 *
 * Body:
 * - name: string (required) — Campaign name
 * - description?: string — Campaign description
 * - targetIndustry?: string — Target industry for lead discovery
 * - targetLocation?: string — Target location for lead discovery
 * - targetCompanySize?: string — Target company size range
 * - targetCriteria?: string — Additional targeting criteria
 * - autoRun?: boolean — If true, automatically triggers the full pipeline after creation (default: true)
 * - query?: string — Override search query for the pipeline
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

    // If autoRun is true (default), trigger the full pipeline AFTER the response is sent
    // using Next.js after() API. This ensures the response is sent immediately
    // and the pipeline runs in the background without blocking.
    if (autoRun) {
      const industry = targetIndustry || '';
      const location = targetLocation || '';
      const query = customQuery || `${industry || name} companies in ${location || 'global'}`.trim();
      const campaignId = campaign.id;
      const campaignName = name;

      console.log(`[Campaigns] Scheduling pipeline for campaign "${campaignName}" (ID: ${campaignId})`);
      console.log(`[Campaigns] Query: "${query}", Industry: "${industry}", Location: "${location}"`);

      // Use after() to schedule the pipeline to run after the response is sent
      // This is the Next.js-recommended way to do background work
      after(async () => {
        try {
          console.log(`[Campaigns] Starting pipeline for campaign "${campaignName}" (ID: ${campaignId})`);
          const result = await runFullPipeline(
            query,
            industry || undefined,
            location || undefined,
            campaignId,
          );
          console.log(`[Campaigns] Pipeline completed for "${campaignName}": ${result.summary.leadsFound} found, ${result.summary.leadsQualified} qualified`);
        } catch (pipelineError) {
          console.error(`[Campaigns] Pipeline failed for campaign "${campaignName}":`, pipelineError);
        }
      });
    }

    // Return the campaign immediately — the pipeline is scheduled to run after the response
    return NextResponse.json(
      {
        ...campaign,
        pipeline: {
          started: autoRun,
          status: autoRun ? 'running' : 'not_started',
          message: autoRun ? 'Pipeline started in the background. Poll /api/campaigns/[id]/pipeline-status for progress.' : 'Pipeline not started. POST to /api/campaigns/[id]/run-pipeline to start.',
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
