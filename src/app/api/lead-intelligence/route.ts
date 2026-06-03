import { NextRequest, NextResponse } from 'next/server';
import {
  trackEvent,
  buildBehavioralProfile,
  predictConversionProbability,
  predictDealSize,
  applyScoreDecay,
  generateAlerts,
  updateLeadScores,
  calculateCompositeScore,
  getDecayReport,
  getActiveAlerts,
  getPipelinePredictions,
} from '@/lib/agents/lead-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'track_event': {
        const { leadId, eventType, source, properties } = body;
        if (!leadId || !eventType || !source) {
          return NextResponse.json({ error: 'leadId, eventType, and source are required for track_event' }, { status: 400 });
        }
        const event = await trackEvent(leadId, eventType, source, properties);
        return NextResponse.json({ event });
      }
      case 'build_profile': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for build_profile' }, { status: 400 });
        }
        const profile = await buildBehavioralProfile(leadId);
        return NextResponse.json({ profile });
      }
      case 'predict_conversion': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for predict_conversion' }, { status: 400 });
        }
        const prediction = await predictConversionProbability(leadId);
        return NextResponse.json({ prediction });
      }
      case 'predict_deal_size': {
        const { leadData } = body;
        if (!leadData) {
          return NextResponse.json({ error: 'leadData is required for predict_deal_size' }, { status: 400 });
        }
        const dealSize = await predictDealSize(leadData);
        return NextResponse.json({ dealSize });
      }
      case 'apply_decay': {
        const { campaignId } = body;
        const result = await applyScoreDecay(campaignId);
        return NextResponse.json({ result });
      }
      case 'generate_alerts': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for generate_alerts' }, { status: 400 });
        }
        const alerts = await generateAlerts(leadId);
        return NextResponse.json({ alerts });
      }
      case 'update_scores': {
        const { campaignId } = body;
        const result = await updateLeadScores(campaignId);
        return NextResponse.json({ result });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use track_event, build_profile, predict_conversion, predict_deal_size, apply_decay, generate_alerts, or update_scores` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in lead-intelligence API:', error);
    return NextResponse.json({ error: 'Failed to process lead intelligence request' }, { status: 500 });
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
      case 'composite_score': {
        const leadId = searchParams.get('leadId');
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for composite_score' }, { status: 400 });
        }
        const score = await calculateCompositeScore(leadId);
        return NextResponse.json({ score });
      }
      case 'decay_report': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const report = await getDecayReport(campaignId);
        return NextResponse.json({ report });
      }
      case 'alerts': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const alerts = await getActiveAlerts(campaignId);
        return NextResponse.json({ alerts });
      }
      case 'pipeline_predictions': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const predictions = await getPipelinePredictions(campaignId);
        return NextResponse.json({ predictions });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use composite_score, decay_report, alerts, or pipeline_predictions` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in lead-intelligence API:', error);
    return NextResponse.json({ error: 'Failed to process lead intelligence query' }, { status: 500 });
  }
}
