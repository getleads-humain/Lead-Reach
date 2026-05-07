import { db } from '@/lib/db';
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
 * The pipeline runs asynchronously — this endpoint returns immediately
 * after creating the campaign. The frontend polls pipeline-status for progress.
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

    const response = NextResponse.json(
      {
        ...campaign,
        pipeline: {
          started: autoRun,
          status: autoRun ? 'running' : 'not_started',
          message: autoRun
            ? 'Pipeline will start in the background. Poll /api/campaigns/[id]/pipeline-status for progress.'
            : 'Pipeline not started. POST to /api/campaigns/[id]/run-pipeline to start.',
        },
      },
      { status: 201 },
    );

    // If autoRun, trigger the pipeline via internal fetch (fire-and-forget)
    if (autoRun) {
      const campaignId = campaign.id;
      const port = process.env.PORT || 3000;
      const baseUrl = `http://127.0.0.1:${port}`;

      // Fire-and-forget: start the pipeline in a separate request context
      // This avoids blocking the current response and prevents server crashes
      fetch(`${baseUrl}/api/campaigns/${campaignId}/run-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }).catch((err) => {
        console.error(`[Campaigns] Failed to trigger pipeline for ${campaignId}:`, err.message);
      });
    }

    return response;
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
