import { NextRequest, NextResponse } from 'next/server';
import {
  generateEmailTemplate,
  sendEmail,
  recordTrackingEvent,
  getEmailAnalytics,
  getEmailTemplates,
  getSuppressionList,
} from '@/lib/agents/email-engine';
import { validateEmail } from '@/lib/agents/data-accuracy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate_template': {
        const { category, context } = body;
        if (!category) {
          return NextResponse.json({ error: 'category is required for generate_template' }, { status: 400 });
        }
        const template = await generateEmailTemplate(category, context);
        return NextResponse.json({ template });
      }
      case 'send': {
        const { params } = body;
        if (!params) {
          return NextResponse.json({ error: 'params is required for send' }, { status: 400 });
        }
        const result = await sendEmail(params);
        return NextResponse.json({ result });
      }
      case 'track': {
        const { emailId, event, metadata } = body;
        if (!emailId || !event) {
          return NextResponse.json({ error: 'emailId and event are required for track' }, { status: 400 });
        }
        const trackingEvent = await recordTrackingEvent(emailId, event, metadata);
        return NextResponse.json({ trackingEvent });
      }
      case 'analytics': {
        const { campaignId } = body;
        const analytics = await getEmailAnalytics(campaignId);
        return NextResponse.json({ analytics });
      }
      case 'validate': {
        const { email } = body;
        if (!email) {
          return NextResponse.json({ error: 'email is required for validate' }, { status: 400 });
        }
        const validation = validateEmail(email);
        return NextResponse.json({ validation });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use generate_template, send, track, analytics, or validate` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in emails API:', error);
    return NextResponse.json({ error: 'Failed to process email request' }, { status: 500 });
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
      case 'get_templates': {
        const category = searchParams.get('category') || undefined;
        const templates = await getEmailTemplates(category as any);
        return NextResponse.json({ templates });
      }
      case 'get_analytics': {
        const campaignId = searchParams.get('campaignId') || undefined;
        const analytics = await getEmailAnalytics(campaignId);
        return NextResponse.json({ analytics });
      }
      case 'get_suppressions': {
        const suppressions = getSuppressionList();
        return NextResponse.json({ suppressions });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use get_templates, get_analytics, or get_suppressions` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in emails API:', error);
    return NextResponse.json({ error: 'Failed to process email query' }, { status: 500 });
  }
}
