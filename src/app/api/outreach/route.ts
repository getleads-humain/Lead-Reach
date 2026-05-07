import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const leadId = searchParams.get('leadId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;

    const outreach = await db.outreach.findMany({
      where,
      include: { lead: { select: { companyName: true, keyContactName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(outreach);
  } catch (error) {
    console.error('Error fetching outreach:', error);
    return NextResponse.json({ error: 'Failed to fetch outreach' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, channel, type, subject, body: messageBody } = body;

    if (!leadId || !channel || !type || !messageBody) {
      return NextResponse.json({ error: 'leadId, channel, type, and body are required' }, { status: 400 });
    }

    const outreach = await db.outreach.create({
      data: {
        leadId,
        channel,
        type,
        subject: subject || null,
        body: messageBody,
        status: 'draft',
      },
    });

    return NextResponse.json(outreach, { status: 201 });
  } catch (error) {
    console.error('Error creating outreach:', error);
    return NextResponse.json({ error: 'Failed to create outreach' }, { status: 500 });
  }
}
