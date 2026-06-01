import { NextRequest, NextResponse } from 'next/server';
import {
  assessDataQuality,
  assessDataQualityBatch,
  detectDuplicates,
  executeMerge,
  autoMergeLowRisk,
  detectDataDecayBatch,
  verifyLeadData,
  validateEmail,
  validatePhone,
  getDataQualityDashboard,
  prioritizeRefresh,
} from '@/lib/agents/data-accuracy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'assess': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for assess' }, { status: 400 });
        }
        const score = await assessDataQuality(leadId);
        return NextResponse.json({ score });
      }
      case 'assess_batch': {
        const { leadIds } = body;
        if (!leadIds || !Array.isArray(leadIds)) {
          return NextResponse.json({ error: 'leadIds (array) is required for assess_batch' }, { status: 400 });
        }
        const scores = await assessDataQualityBatch(leadIds);
        return NextResponse.json({ scores });
      }
      case 'detect_duplicates': {
        const { campaignId } = body;
        const duplicates = await detectDuplicates(campaignId);
        return NextResponse.json({ duplicates });
      }
      case 'merge': {
        const { mergePlan } = body;
        if (!mergePlan) {
          return NextResponse.json({ error: 'mergePlan is required for merge' }, { status: 400 });
        }
        await executeMerge(mergePlan);
        return NextResponse.json({ success: true });
      }
      case 'auto_merge': {
        const { campaignId } = body;
        const result = await autoMergeLowRisk(campaignId);
        return NextResponse.json({ result });
      }
      case 'detect_decay': {
        const { campaignId } = body;
        const decayReports = await detectDataDecayBatch(campaignId);
        return NextResponse.json({ decayReports });
      }
      case 'verify_lead': {
        const { leadId } = body;
        if (!leadId) {
          return NextResponse.json({ error: 'leadId is required for verify_lead' }, { status: 400 });
        }
        const verification = await verifyLeadData(leadId);
        return NextResponse.json({ verification });
      }
      case 'validate_email': {
        const { email } = body;
        if (!email) {
          return NextResponse.json({ error: 'email is required for validate_email' }, { status: 400 });
        }
        const validation = validateEmail(email);
        return NextResponse.json({ validation });
      }
      case 'validate_phone': {
        const { phone, countryCode } = body;
        if (!phone) {
          return NextResponse.json({ error: 'phone is required for validate_phone' }, { status: 400 });
        }
        const validation = validatePhone(phone, countryCode);
        return NextResponse.json({ validation });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use assess, assess_batch, detect_duplicates, merge, auto_merge, detect_decay, verify_lead, validate_email, or validate_phone` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in data-quality API:', error);
    return NextResponse.json({ error: 'Failed to process data quality request' }, { status: 500 });
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
        const campaignId = searchParams.get('campaignId') || undefined;
        const dashboard = await getDataQualityDashboard(campaignId);
        return NextResponse.json({ dashboard });
      }
      case 'refresh_priority': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const priority = await prioritizeRefresh(campaignId);
        return NextResponse.json({ priority });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use dashboard or refresh_priority` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in data-quality API:', error);
    return NextResponse.json({ error: 'Failed to process data quality query' }, { status: 500 });
  }
}
