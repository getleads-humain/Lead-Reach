import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const conversations = await db.setterConversation.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const channelStats = await db.setterConversation.groupBy({
      by: ['leadChannel'],
      _count: { id: true },
    });

    return NextResponse.json({
      conversations,
      channelStats: channelStats.map(cs => ({
        channel: cs.leadChannel,
        count: cs._count.id,
      })),
    });
  } catch (error) {
    console.error('Error fetching messaging data:', error);
    return NextResponse.json({ conversations: [], channelStats: [] }, { status: 200 });
  }
}
