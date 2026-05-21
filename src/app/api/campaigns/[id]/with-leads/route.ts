import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        leads: {
          orderBy: { leadScore: 'desc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const { leads, ...campaignData } = campaign;

    return NextResponse.json({
      campaign: campaignData,
      leads,
    });
  } catch (error) {
    console.error('Error fetching campaign with leads:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign with leads' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Delete campaign and all its leads (cascade delete handles outreach + leads)
    await db.campaign.delete({ where: { id } });

    return NextResponse.json({
      deleted: true,
      campaignId: id,
      campaignName: campaign.name,
    });
  } catch (error) {
    console.error('Error deleting campaign with leads:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
