import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE() {
  try {
    // Delete all outreach first (due to foreign key constraints)
    await db.outreach.deleteMany({});
    // Delete all leads
    const result = await db.lead.deleteMany({});

    // Reset campaign lead counters
    await db.campaign.updateMany({
      data: {
        leadsFound: 0,
        leadsQualified: 0,
        leadsContacted: 0,
        leadsResponded: 0,
      },
    });

    return NextResponse.json({
      deleted: result.count,
      message: 'All leads cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing leads:', error);
    return NextResponse.json({ error: 'Failed to clear leads' }, { status: 500 });
  }
}
