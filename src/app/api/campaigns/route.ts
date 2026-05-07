import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/agent-executor';
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
      autoRun = true, // Auto-run pipeline by default
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
    });

    // If autoRun is true (default), trigger the full pipeline immediately
    let pipelineResult: Awaited<ReturnType<typeof runFullPipeline>> | null = null;
    if (autoRun) {
      try {
        const industry = targetIndustry || '';
        const location = targetLocation || '';
        const query = customQuery || `${industry || name} companies in ${location || 'global'}`.trim();

        console.log(`[Campaigns] Auto-starting pipeline for campaign "${name}" (ID: ${campaign.id})`);
        console.log(`[Campaigns] Query: "${query}", Industry: "${industry}", Location: "${location}"`);

        pipelineResult = await runFullPipeline(
          query,
          industry || undefined,
          location || undefined,
          campaign.id,
        );

        console.log(`[Campaigns] Pipeline completed for "${name}": ${pipelineResult.summary.leadsFound} found, ${pipelineResult.summary.leadsQualified} qualified`);

        // Reload campaign to get updated lead counts
        const updatedCampaign = await db.campaign.findUnique({
          where: { id: campaign.id },
          include: {
            _count: { select: { leads: true } },
          },
        });

        return NextResponse.json(
          {
            ...updatedCampaign,
            pipeline: {
              success: pipelineResult.success,
              summary: pipelineResult.summary,
              stages: {
                discovery: pipelineResult.discovery?.success ?? false,
                enrichment: pipelineResult.enrichment?.success ?? false,
                qualification: pipelineResult.qualification?.success ?? false,
                outreach: pipelineResult.outreach?.success ?? false,
              },
            },
          },
          { status: 201 },
        );
      } catch (pipelineError) {
        // Pipeline failed — still return the campaign, but with pipeline error info
        console.error(`[Campaigns] Pipeline failed for campaign "${name}":`, pipelineError);
        const updatedCampaign = await db.campaign.findUnique({
          where: { id: campaign.id },
          include: {
            _count: { select: { leads: true } },
          },
        });

        return NextResponse.json(
          {
            ...updatedCampaign,
            pipeline: {
              success: false,
              error: pipelineError instanceof Error ? pipelineError.message : 'Pipeline execution failed',
              summary: null,
            },
          },
          { status: 201 },
        );
      }
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
