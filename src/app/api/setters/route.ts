import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const setters = await db.aISetter.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { conversations: true } } },
    });
    return NextResponse.json(setters);
  } catch (error) {
    console.error('Error fetching setters:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const setter = await db.aISetter.create({
      data: {
        name: body.name,
        description: body.description || null,
        language: body.language || 'en',
        channels: body.channels ? JSON.stringify(body.channels) : null,
        calendarLink: body.calendarLink || null,
        avatar: body.avatar || '🤖',
        qualificationRules: body.qualificationRules ? JSON.stringify(body.qualificationRules) : null,
      },
    });
    return NextResponse.json(setter);
  } catch (error) {
    console.error('Error creating setter:', error);
    return NextResponse.json({ error: 'Failed to create setter' }, { status: 500 });
  }
}
