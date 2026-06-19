/**
 * AI Activation API — Unified endpoint for all AI features across the platform
 *
 * POST /api/ai-activate
 * Body: { action: string, payload: any }
 *
 * Every action dispatches to a single function in /lib/ai-activate/engine.ts.
 * All engine functions accept ONE payload object, so the dispatcher simply
 * forwards the payload — no bespoke argument-shape glue.
 *
 * All AI calls go through /lib/llm, which is hard-locked to:
 *   - glm-4.7-flash  (primary text model)
 *   - glm-4.6v-flash (fallback text + vision model)
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
 *   vision.analyze-image, vision.extract-company-screenshot
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
  aiAnalyzeImage, aiExtractCompanyFromScreenshot,
  aiGeneric, aiGenericText,
  aiActivationHealth,
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
      return aiScoreLead(payload);
    case 'lead.enrich':
      return aiEnrichLead(payload);
    case 'lead.next-action':
      return aiRecommendNextAction(payload);

    // ─── EMAIL ─────────────────────────────────────────
    case 'email.compose':
      return aiComposeEmail(payload);
    case 'email.reply':
      return aiReplyEmail(payload);
    case 'email.optimize-subject':
      return aiOptimizeSubjectLine(payload);

    // ─── MESSAGING ─────────────────────────────────────
    case 'messaging.suggest-reply':
      return aiSuggestReply(payload);
    case 'messaging.summarize':
      return aiSummarizeConversation(payload);

    // ─── SETTER ────────────────────────────────────────
    case 'setter.coach':
      return aiCoachSetter(payload);
    case 'setter.qualifying-rules':
      return aiGenerateQualifyingRules(payload);

    // ─── CAMPAIGN ──────────────────────────────────────
    case 'campaign.generate':
      return aiGenerateCampaign(payload);
    case 'campaign.optimize':
      return aiOptimizeCampaign(payload);

    // ─── REPORTS ───────────────────────────────────────
    case 'report.summary':
      return aiGenerateReportSummary(payload);

    // ─── ANALYTICS ─────────────────────────────────────
    case 'analytics.annotate':
      return aiAnnotateAnalytics(payload);
    case 'analytics.forecast':
      return aiForecastRevenue(payload);

    // ─── OUTREACH ──────────────────────────────────────
    case 'outreach.sequence':
      return aiGenerateOutreachSequence(payload);

    // ─── ABM ───────────────────────────────────────────
    case 'abm.score':
      return aiScoreAccount(payload);

    // ─── BOOKING ───────────────────────────────────────
    case 'booking.brief':
      return aiGenerateMeetingBrief(payload);

    // ─── SETTINGS ──────────────────────────────────────
    case 'settings.recommend':
      return aiRecommendSettingsOptimizations(payload);

    // ─── BILLING ───────────────────────────────────────
    case 'billing.analyze':
      return aiAnalyzeBillingUsage(payload);

    // ─── PIPELINE ──────────────────────────────────────
    case 'pipeline.analyze':
      return aiAnalyzeDeal(payload);

    // ─── ICP ───────────────────────────────────────────
    case 'icp.refine':
      return aiRefineICP(payload);

    // ─── VISION (glm-4.6v-flash) ───────────────────────
    case 'vision.analyze-image':
      return aiAnalyzeImage(payload);
    case 'vision.extract-company-screenshot':
      return aiExtractCompanyFromScreenshot(payload);

    // ─── GENERIC ───────────────────────────────────────
    case 'generic.json':
      return aiGeneric(payload);
    case 'generic.text':
      return aiGenericText(payload);

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
    'vision.analyze-image', 'vision.extract-company-screenshot',
    'generic.json', 'generic.text',
  ];
}
