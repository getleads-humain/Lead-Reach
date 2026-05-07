import { db } from '@/lib/db';
import { runFullPipeline } from '@/lib/agent-executor';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/campaigns/[id]/run-pipeline
 *
 * Triggers the full 4-stage lead generation pipeline for a campaign:
 * 1. Prospect Discovery → find leads across 6+ channels
 * 2. Data Enrichment → enrich leads with contact data
 * 3. Lead Qualification → score and tier leads
 * 4. Outreach Composer → craft personalized messages
 *
 * This is the primary way to make a campaign "come alive" — after creating
 * a campaign, the user triggers this endpoint to start the autonomous agent pipeline.
 *
 * Body options:
 * - { query?: string } — Override search query (defaults to "{industry} companies in {location}")
 * - { stages?: string[] } — Run specific stages only (default: all 4)
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

    console.log(`[Pipeline] Starting full pipeline for campaign "${campaign.name}" (ID: ${campaignId})`);
    console.log(`[Pipeline] Query: "${query}", Industry: "${industry}", Location: "${location}"`);

    // Run the full pipeline — this executes all 4 stages sequentially
    const pipelineResult = await runFullPipeline(
      query,
      industry || undefined,
      location || undefined,
      campaignId,
    );

    console.log(`[Pipeline] Completed for campaign "${campaign.name}": ${pipelineResult.summary.leadsFound} found, ${pipelineResult.summary.leadsQualified} qualified, ${pipelineResult.summary.leadsContacted} contacted`);

    return NextResponse.json({
      success: pipelineResult.success,
      campaignId,
      campaignName: campaign.name,
      summary: pipelineResult.summary,
      stages: {
        discovery: pipelineResult.discovery
          ? {
              success: pipelineResult.discovery.success,
              leadsFound: (pipelineResult.discovery.output as Record<string, unknown>)?.found ?? 0,
              channelsUsed: pipelineResult.discovery.channelActivity
                .filter(c => c.success)
                .map(c => c.channel),
            }
          : null,
        enrichment: pipelineResult.enrichment
          ? {
              success: pipelineResult.enrichment.success,
              leadsEnriched: (pipelineResult.enrichment.output as Record<string, unknown>)?.enriched ?? 0,
              channelsUsed: pipelineResult.enrichment.channelActivity
                .filter(c => c.success)
                .map(c => c.channel),
            }
          : null,
        qualification: pipelineResult.qualification
          ? {
              success: pipelineResult.qualification.success,
              leadsQualified: (pipelineResult.qualification.output as Record<string, unknown>)?.qualified ?? 0,
              channelsUsed: pipelineResult.qualification.channelActivity
                .filter(c => c.success)
                .map(c => c.channel),
            }
          : null,
        outreach: pipelineResult.outreach
          ? {
              success: pipelineResult.outreach.success,
              messagesComposed: (pipelineResult.outreach.output as Record<string, unknown>)?.composed ?? 0,
              channelsUsed: pipelineResult.outreach.channelActivity
                .filter(c => c.success)
                .map(c => c.channel),
            }
          : null,
      },
      errors: pipelineResult.summary.errors,
    });
  } catch (error) {
    console.error('[Pipeline] Campaign pipeline failed:', error);
    return NextResponse.json(
      {
        error: 'Pipeline execution failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
