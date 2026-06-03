import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const setter = await db.aISetter.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!setter) {
      return NextResponse.json({ error: 'Setter not found' }, { status: 404 });
    }
    return NextResponse.json(setter);
  } catch (error) {
    console.error('Error fetching setter:', error);
    return NextResponse.json({ error: 'Failed to fetch setter' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const setter = await db.aISetter.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.language !== undefined && { language: body.language }),
        ...(body.channels !== undefined && { channels: JSON.stringify(body.channels) }),
        ...(body.calendarLink !== undefined && { calendarLink: body.calendarLink }),
        ...(body.avatar !== undefined && { avatar: body.avatar }),
        ...(body.followUpEnabled !== undefined && { followUpEnabled: body.followUpEnabled }),
        ...(body.qualificationRules !== undefined && { qualificationRules: JSON.stringify(body.qualificationRules) }),
      },
    });
    return NextResponse.json(setter);
  } catch (error) {
    console.error('Error updating setter:', error);
    return NextResponse.json({ error: 'Failed to update setter' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.aISetter.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setter:', error);
    return NextResponse.json({ error: 'Failed to delete setter' }, { status: 500 });
  }
}
