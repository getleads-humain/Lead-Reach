import { NextRequest, NextResponse } from 'next/server';
import { generatePipelineReport, generateScoreDistribution, generateCampaignPerformance, generateAIInsights, generateActionItems } from '@/lib/agents/report-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const reportType = searchParams.get('type') || 'full';

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    switch (reportType) {
      case 'pipeline': {
        const report = await generatePipelineReport(campaignId);
        return NextResponse.json(report);
      }
      case 'distribution': {
        const distribution = await generateScoreDistribution(campaignId);
        return NextResponse.json(distribution);
      }
      case 'performance': {
        const performance = await generateCampaignPerformance(campaignId);
        return NextResponse.json(performance);
      }
      case 'full':
      default: {
        const [report, distribution, performance] = await Promise.all([
          generatePipelineReport(campaignId),
          generateScoreDistribution(campaignId),
          generateCampaignPerformance(campaignId),
        ]);

        const insights = await generateAIInsights(report);
        const actions = await generateActionItems(report);

        return NextResponse.json({
          pipeline: report,
          distribution,
          performance,
          insights,
          actions,
          generatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
