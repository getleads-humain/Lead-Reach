/**
 * AI Activation API — Unified endpoint for all AI features across the platform
 *
 * POST /api/ai-activate
 * Body: { action: string, payload: any }
 *
 * Available actions:
 *   lead.score, lead.enrich, lead.next-action
 *   email.compose, email.reply, email.optimize-subject
 *   messaging.suggest-reply, messaging.summarize
 *   setter.coach, setter.qualifying-rules
 *   campaign.generate, campaign.optimize
 *   report.summary
 *   analytics.annotate, analytics.forecast
 *   outreach.sequence
 *   abm.score
 *   booking.brief
 *   settings.recommend
 *   billing.analyze
 *   pipeline.analyze
 *   icp.refine
 *   generic.json, generic.text
 *
 * GET /api/ai-activate — returns health + capability list
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  aiScoreLead, aiEnrichLead, aiRecommendNextAction,
  aiComposeEmail, aiReplyEmail, aiOptimizeSubjectLine,
  aiSuggestReply, aiSummarizeConversation,
  aiCoachSetter, aiGenerateQualifyingRules,
  aiGenerateCampaign, aiOptimizeCampaign,
  aiGenerateReportSummary,
  aiAnnotateAnalytics, aiForecastRevenue,
  aiGenerateOutreachSequence,
  aiScoreAccount,
  aiGenerateMeetingBrief,
  aiRecommendSettingsOptimizations,
  aiAnalyzeBillingUsage,
  aiAnalyzeDeal,
  aiRefineICP,
  aiGeneric, aiGenericText,
  aiActivationHealth,
  type LeadContext, type EmailContext, type CampaignContext, type AnalyticsContext,
} from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET() {
  const health = await aiActivationHealth();
  return NextResponse.json({
    status: 'ok',
    ...health,
    endpoint: '/api/ai-activate',
    method: 'POST',
    schema: { action: 'string', payload: 'any' },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'action is required', validActions: listActions() },
        { status: 400 }
      );
    }

    const result = await dispatchAction(action, payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action,
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[ai-activate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function dispatchAction(action: string, payload: any): Promise<{ success: boolean; data?: any; error?: string; modelUsed?: string }> {
  switch (action) {
    // ─── LEAD ──────────────────────────────────────────
    case 'lead.score':
      return aiScoreLead(payload as LeadContext);
    case 'lead.enrich':
      return aiEnrichLead(payload as LeadContext);
    case 'lead.next-action':
      return aiRecommendNextAction(payload as LeadContext);

    // ─── EMAIL ─────────────────────────────────────────
    case 'email.compose':
      return aiComposeEmail(payload as EmailContext);
    case 'email.reply':
      return aiReplyEmail(payload.receivedEmail, payload.context as EmailContext);
    case 'email.optimize-subject':
      return aiOptimizeSubjectLine(payload.subject, payload.audience);

    // ─── MESSAGING ─────────────────────────────────────
    case 'messaging.suggest-reply':
      return aiSuggestReply(payload.conversation, payload.channel);
    case 'messaging.summarize':
      return aiSummarizeConversation(payload.conversation);

    // ─── SETTER ────────────────────────────────────────
    case 'setter.coach':
      return aiCoachSetter(payload.callTranscript, payload.setterName);
    case 'setter.qualifying-rules':
      return aiGenerateQualifyingRules(payload.productContext);

    // ─── CAMPAIGN ──────────────────────────────────────
    case 'campaign.generate':
      return aiGenerateCampaign(payload as CampaignContext);
    case 'campaign.optimize':
      return aiOptimizeCampaign(payload.performance);

    // ─── REPORTS ───────────────────────────────────────
    case 'report.summary':
      return aiGenerateReportSummary(payload.data, payload.reportType);

    // ─── ANALYTICS ─────────────────────────────────────
    case 'analytics.annotate':
      return aiAnnotateAnalytics(payload as AnalyticsContext);
    case 'analytics.forecast':
      return aiForecastRevenue(payload.historicalData, payload.quarters);

    // ─── OUTREACH ──────────────────────────────────────
    case 'outreach.sequence':
      return aiGenerateOutreachSequence(payload.lead, payload.goal, payload.channels);

    // ─── ABM ───────────────────────────────────────────
    case 'abm.score':
      return aiScoreAccount(payload.account);

    // ─── BOOKING ───────────────────────────────────────
    case 'booking.brief':
      return aiGenerateMeetingBrief(payload.lead, payload.meetingType, payload.previousConversations);

    // ─── SETTINGS ──────────────────────────────────────
    case 'settings.recommend':
      return aiRecommendSettingsOptimizations(payload.currentSettings);

    // ─── BILLING ───────────────────────────────────────
    case 'billing.analyze':
      return aiAnalyzeBillingUsage(payload.usage);

    // ─── PIPELINE ──────────────────────────────────────
    case 'pipeline.analyze':
      return aiAnalyzeDeal(payload.deal);

    // ─── ICP ───────────────────────────────────────────
    case 'icp.refine':
      return aiRefineICP(payload.currentICP, payload.customerData);

    // ─── GENERIC ───────────────────────────────────────
    case 'generic.json':
      return aiGeneric(payload.task, payload.input, payload.outputSchema, payload.systemPrompt);
    case 'generic.text':
      return aiGenericText(payload.task, payload.input, payload.systemPrompt);

    default:
      return {
        success: false,
        error: `Unknown action: ${action}`,
      };
  }
}

function listActions(): string[] {
  return [
    'lead.score', 'lead.enrich', 'lead.next-action',
    'email.compose', 'email.reply', 'email.optimize-subject',
    'messaging.suggest-reply', 'messaging.summarize',
    'setter.coach', 'setter.qualifying-rules',
    'campaign.generate', 'campaign.optimize',
    'report.summary',
    'analytics.annotate', 'analytics.forecast',
    'outreach.sequence',
    'abm.score',
    'booking.brief',
    'settings.recommend',
    'billing.analyze',
    'pipeline.analyze',
    'icp.refine',
    'generic.json', 'generic.text',
  ];
}
