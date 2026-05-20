import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignIds = searchParams.get('campaignIds');

    if (!campaignIds) {
      return NextResponse.json({ error: 'campaignIds query parameter is required (comma-separated)' }, { status: 400 });
    }

    const ids = campaignIds.split(',').filter(Boolean);

    const results: Record<string, {
      totalLeads: number;
      byStage: Record<string, number>;
      byTier: Record<string, number>;
      averageScore: number;
    }> = {};

    for (const id of ids) {
      const leads = await db.lead.findMany({
        where: { campaignId: id },
        select: { stage: true, leadTier: true, leadScore: true },
      });

      const byStage: Record<string, number> = {};
      const byTier: Record<string, number> = {};
      let totalScore = 0;

      for (const lead of leads) {
        byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
        byTier[lead.leadTier] = (byTier[lead.leadTier] || 0) + 1;
        totalScore += lead.leadScore;
      }

      results[id] = {
        totalLeads: leads.length,
        byStage,
        byTier,
        averageScore: leads.length > 0 ? Math.round(totalScore / leads.length) : 0,
      };
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching batch pipeline status:', error);
    return NextResponse.json({ error: 'Failed to fetch batch pipeline status' }, { status: 500 });
  }
}
