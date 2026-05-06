import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getDefaultChannels } from '@/lib/agent-reach';

export async function GET() {
  try {
    let channels = await db.agentReachChannel.findMany({
      orderBy: { tier: 'asc' },
    });

    if (channels.length === 0) {
      const defaults = getDefaultChannels();
      await db.agentReachChannel.createMany({
        data: defaults.map((ch) => ({
          name: ch.name,
          displayName: ch.displayName,
          description: ch.description,
          status: ch.status,
          tier: ch.tier,
          backend: ch.backend,
          message: ch.message,
        })),
      });

      channels = await db.agentReachChannel.findMany({
        orderBy: { tier: 'asc' },
      });
    }

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching agent-reach channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const defaults = getDefaultChannels();

    for (const ch of defaults) {
      await db.agentReachChannel.upsert({
        where: { name: ch.name },
        update: {
          status: ch.status,
          backend: ch.backend,
          message: ch.message,
          lastChecked: new Date(),
        },
        create: {
          name: ch.name,
          displayName: ch.displayName,
          description: ch.description,
          status: ch.status,
          tier: ch.tier,
          backend: ch.backend,
          message: ch.message,
          lastChecked: new Date(),
        },
      });
    }

    const channels = await db.agentReachChannel.findMany({
      orderBy: { tier: 'asc' },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error running doctor:', error);
    return NextResponse.json({ error: 'Failed to run doctor' }, { status: 500 });
  }
}
