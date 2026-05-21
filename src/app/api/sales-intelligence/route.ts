import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Aggregate data from leads and campaigns
    const [leads, campaigns] = await Promise.all([
      db.lead.findMany({
        include: { campaign: true },
      }),
      db.campaign.findMany({
        include: { leads: true },
      }),
    ]);

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(
      (l) => l.leadTier === 'hot' || l.leadTier === 'warm' || l.stage === 'qualified' || l.stage === 'engaged' || l.stage === 'negotiating' || l.stage === 'closed_won'
    ).length;
    const averageScore = totalLeads > 0
      ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / totalLeads)
      : 0;
    const conversionRate = totalLeads > 0
      ? Math.round((leads.filter((l) => l.stage === 'closed_won').length / totalLeads) * 100)
      : 0;

    // By industry
    const industryMap = new Map<string, { count: number; totalScore: number }>();
    for (const lead of leads) {
      const industry = lead.industry || 'Unknown';
      const existing = industryMap.get(industry) || { count: 0, totalScore: 0 };
      existing.count += 1;
      existing.totalScore += lead.leadScore;
      industryMap.set(industry, existing);
    }
    const byIndustry = Array.from(industryMap.entries()).map(([industry, data]) => ({
      industry,
      count: data.count,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
    }));

    // By stage
    const stageMap = new Map<string, number>();
    for (const lead of leads) {
      const stage = lead.stage || 'new';
      stageMap.set(stage, (stageMap.get(stage) || 0) + 1);
    }
    const byStage = Array.from(stageMap.entries()).map(([stage, count]) => ({
      stage,
      count,
    }));

    // Top performing campaigns
    const topPerformingCampaigns = campaigns
      .map((c) => ({
        id: c.id,
        name: c.name,
        leads: c.leads.length,
        qualified: c.leads.filter(
          (l) => l.leadTier === 'hot' || l.leadTier === 'warm' || l.stage === 'qualified' || l.stage === 'engaged'
        ).length,
      }))
      .sort((a, b) => b.qualified - a.qualified)
      .slice(0, 10);

    // Recent activity (from lead and outreach records)
    const recentActivity = leads
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 20)
      .map((l) => {
        let type = 'lead_update';
        let description = `${l.companyName} updated`;

        if (l.stage === 'closed_won') {
          type = 'deal_won';
          description = `Deal closed with ${l.companyName}`;
        } else if (l.stage === 'contacted') {
          type = 'contacted';
          description = `Contacted ${l.companyName}`;
        } else if (l.stage === 'qualified') {
          type = 'qualified';
          description = `${l.companyName} qualified (score: ${l.leadScore})`;
        } else if (l.stage === 'new') {
          type = 'new_lead';
          description = `New lead: ${l.companyName}`;
        }

        return {
          type,
          description,
          timestamp: l.updatedAt.toISOString(),
        };
      });

    return NextResponse.json({
      overview: {
        totalLeads,
        qualifiedLeads,
        averageScore,
        conversionRate,
      },
      byIndustry,
      byStage,
      topPerformingCampaigns,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching sales intelligence:', error);
    return NextResponse.json(
      {
        overview: { totalLeads: 0, qualifiedLeads: 0, averageScore: 0, conversionRate: 0 },
        byIndustry: [],
        byStage: [],
        topPerformingCampaigns: [],
        recentActivity: [],
      },
      { status: 200 }
    );
  }
}
