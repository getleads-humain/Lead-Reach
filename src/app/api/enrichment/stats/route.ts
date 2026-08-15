import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // Count leads by enrichment status (wrapped in try-catch for resilience)
    let stageBreakdown: Record<string, number> = {};
    try {
      const byStage = await db.lead.groupBy({
        by: ['stage'],
        _count: true,
      });
      stageBreakdown = Object.fromEntries(byStage.map(s => [s.stage, s._count]));
    } catch {
      // groupBy may fail on some SQLite configurations; proceed without it
    }

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
      try {
        const filled = await db.lead.count({
          where: { [field]: { not: null } },
        });
        fieldCoverage[field] = totalLeads > 0 ? Math.round((filled / totalLeads) * 100) : 0;
      } catch {
        // Individual field count may fail; skip gracefully
        fieldCoverage[field] = 0;
      }
    }

    return NextResponse.json({
      totalLeads,
      enrichedLeads,
      newLeads,
      enrichmentRate: totalLeads > 0 ? Math.round((enrichedLeads / totalLeads) * 100) : 0,
      averageDataCompleteness: avgCompleteness,
      recentEnriched,
      stageBreakdown,
      fieldCoverage,
    });
  } catch (error) {
    console.error('Error fetching enrichment stats:', error);
    return NextResponse.json(
      {
        totalLeads: 0,
        enrichedLeads: 0,
        newLeads: 0,
        enrichmentRate: 0,
        averageDataCompleteness: 0,
        recentEnriched: 0,
        fieldCoverage: {},
      },
      { status: 200 }
    );
  }
}
