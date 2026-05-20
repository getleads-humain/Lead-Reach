import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const totalLeads = await db.lead.count();
    const enrichedLeads = await db.lead.count({
      where: { enrichedAt: { not: null } },
    });
    const newLeads = await db.lead.count({
      where: { stage: 'new' },
    });

    // Calculate average data completeness
    const leads = await db.lead.findMany({
      select: { dataCompleteness: true },
    });
    const avgCompleteness = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.dataCompleteness, 0) / leads.length)
      : 0;

    // Count leads by enrichment status
    const byStage = await db.lead.groupBy({
      by: ['stage'],
      _count: true,
    });

    // Recent enrichment activity
    const recentEnriched = await db.lead.count({
      where: {
        enrichedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    // Field coverage stats
    const fieldsToCheck = [
      'industry', 'website', 'city', 'country', 'phoneMain', 'generalEmail',
      'ceoName', 'keyContactName', 'keyContactTitle', 'employeeCount',
      'revenueEstimate', 'linkedinUrl', 'techStack',
    ];

    const fieldCoverage: Record<string, number> = {};
    for (const field of fieldsToCheck) {
      const filled = await db.lead.count({
        where: { [field]: { not: null } },
      });
      fieldCoverage[field] = totalLeads > 0 ? Math.round((filled / totalLeads) * 100) : 0;
    }

    return NextResponse.json({
      totalLeads,
      enrichedLeads,
      newLeads,
      enrichmentRate: totalLeads > 0 ? Math.round((enrichedLeads / totalLeads) * 100) : 0,
      averageDataCompleteness: avgCompleteness,
      recentEnriched,
      stageBreakdown: Object.fromEntries(byStage.map(s => [s.stage, s._count])),
      fieldCoverage,
    });
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    return NextResponse.json({ error: 'Failed to fetch enrichment stats' }, { status: 500 });
  }
}
