import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { targetCampaignId } = body;

    if (!targetCampaignId) {
      return NextResponse.json({ error: 'targetCampaignId is required' }, { status: 400 });
    }

    // Verify lead exists
    const lead = await db.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Verify target campaign exists
    const targetCampaign = await db.campaign.findUnique({ where: { id: targetCampaignId } });
    if (!targetCampaign) {
      return NextResponse.json({ error: 'Target campaign not found' }, { status: 404 });
    }

    const sourceCampaignId = lead.campaignId;

    // Move lead to new campaign
    const updatedLead = await db.lead.update({
      where: { id },
      data: { campaignId: targetCampaignId },
    });

    // Update source campaign lead count
    await db.campaign.update({
      where: { id: sourceCampaignId },
      data: { leadsFound: { decrement: 1 } },
    });

    // Update target campaign lead count
    await db.campaign.update({
      where: { id: targetCampaignId },
      data: { leadsFound: { increment: 1 } },
    });

    return NextResponse.json({
      lead: updatedLead,
      movedFrom: sourceCampaignId,
      movedTo: targetCampaignId,
    });
  } catch (error) {
    console.error('Error moving lead:', error);
    return NextResponse.json({ error: 'Failed to move lead' }, { status: 500 });
  }
}
