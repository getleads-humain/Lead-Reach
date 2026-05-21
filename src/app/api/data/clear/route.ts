import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    // Delete in correct order (respecting foreign key constraints)
    await db.outreach.deleteMany({});
    await db.lead.deleteMany({});
    await db.agentTask.deleteMany({});
    await db.campaign.deleteMany({});

    return NextResponse.json({
      success: true,
      message: 'All data cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 });
  }
}
