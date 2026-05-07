import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const allowedFields = ['name', 'description', 'status', 'targetIndustry', 'targetLocation', 'targetCompanySize', 'targetCriteria'];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await db.campaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
