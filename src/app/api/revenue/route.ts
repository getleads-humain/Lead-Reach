import { NextRequest, NextResponse } from 'next/server';
import {
  generateRevenueForecast,
  scoreDealProbability,
  getPipelineRiskAssessment,
  projectMRR,
  getRevenueDashboard,
  calculatePipelineValue,
  calculateDealVelocity,
  calculateRevenueAttribution,
} from '@/lib/agents/revenue-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'forecast': {
        const { period, historicalData } = body;
        if (!period) {
          return NextResponse.json({ error: 'period is required for forecast' }, { status: 400 });
        }
        const forecast = await generateRevenueForecast(period, historicalData);
        return NextResponse.json({ forecast });
      }
      case 'deal_probability': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for deal_probability' }, { status: 400 });
        }
        const probability = await scoreDealProbability(leadId);
        return NextResponse.json({ probability });
      }
      case 'pipeline_risk': {
        const { campaignId } = body;
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId is required for pipeline_risk' }, { status: 400 });
        }
        const riskAssessment = await getPipelineRiskAssessment(campaignId);
        return NextResponse.json({ riskAssessment });
      }
      case 'project_mrr': {
        const { months } = body;
        const projection = await projectMRR(months || 3);
        return NextResponse.json({ projection });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use forecast, deal_probability, pipeline_risk, or project_mrr` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in revenue API:', error);
    return NextResponse.json({ error: 'Failed to process revenue request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'action query parameter is required' }, { status: 400 });
    }

    switch (action) {
      case 'dashboard': {
        const dashboard = await getRevenueDashboard();
        return NextResponse.json({ dashboard });
      }
      case 'pipeline_value': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const pipelineValue = await calculatePipelineValue(campaignId);
        return NextResponse.json({ pipelineValue });
      }
      case 'deal_velocity': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const dealVelocity = await calculateDealVelocity(campaignId);
        return NextResponse.json({ dealVelocity });
      }
      case 'attribution': {
        const attribution = await calculateRevenueAttribution();
        return NextResponse.json({ attribution });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use dashboard, pipeline_value, deal_velocity, or attribution` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in revenue API:', error);
    return NextResponse.json({ error: 'Failed to process revenue query' }, { status: 500 });
  }
}
