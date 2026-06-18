#!/usr/bin/env python3
"""Generate domain-specific AI route files for LeadReach."""

import os
from pathlib import Path

# (directory, action, function_name, description)
ROUTES = [
    ("src/app/api/leads/ai-score", "lead.score", "aiScoreLead",
     "Score a lead 0-100 with tier, reasoning, signals, and next best action."),
    ("src/app/api/leads/ai-enrich", "lead.enrich", "aiEnrichLead",
     "Infer BANT attributes (Budget, Authority, Need, Timeline) from context."),
    ("src/app/api/leads/ai-next-action", "lead.next-action", "aiRecommendNextAction",
     "Recommend the single highest-leverage next action for a lead."),
    ("src/app/api/emails/ai-compose", "email.compose", "aiComposeEmail",
     "Generate personalized B2B emails (cold outreach, follow-up, proposal)."),
    ("src/app/api/emails/ai-reply", "email.reply", "aiReplyEmail",
     "Detect intent and draft thoughtful replies that advance the conversation."),
    ("src/app/api/emails/ai-optimize-subject", "email.optimize-subject", "aiOptimizeSubjectLine",
     "Optimize subject lines for higher open rates."),
    ("src/app/api/messaging/ai-suggest-reply", "messaging.suggest-reply", "aiSuggestReply",
     "Real-time reply suggestions for live conversations."),
    ("src/app/api/messaging/ai-summarize", "messaging.summarize", "aiSummarizeConversation",
     "Auto-summarize long conversations into key points + action items."),
    ("src/app/api/setters/ai-coach", "setter.coach", "aiCoachSetter",
     "AI analysis of call transcripts: strengths, improvements, objection handling."),
    ("src/app/api/setters/ai-qualifying-rules", "setter.qualifying-rules", "aiGenerateQualifyingRules",
     "Design BANT qualification frameworks for any product."),
    ("src/app/api/campaigns/ai-generate", "campaign.generate", "aiGenerateCampaign",
     "Design full multi-touch campaigns with sequence, messaging, and KPIs."),
    ("src/app/api/campaigns/ai-optimize", "campaign.optimize", "aiOptimizeCampaign",
     "Diagnose performance issues and recommend concrete fixes."),
    ("src/app/api/reports/ai-summary", "report.summary", "aiGenerateReportSummary",
     "Turn raw report data into executive-ready narrative + insights."),
    ("src/app/api/analytics/ai-annotate", "analytics.annotate", "aiAnnotateAnalytics",
     "Translate raw metrics into business-readable insights + anomalies."),
    ("src/app/api/analytics/ai-forecast", "analytics.forecast", "aiForecastRevenue",
     "Generate calibrated revenue forecasts with assumptions."),
    ("src/app/api/outreach/ai-sequence", "outreach.sequence", "aiGenerateOutreachSequence",
     "Multi-touch outreach cadences personalized per lead."),
    ("src/app/api/abm/ai-score", "abm.score", "aiScoreAccount",
     "Account-level fit + intent scoring for ABM targeting."),
    ("src/app/api/bookings/ai-brief", "booking.brief", "aiGenerateMeetingBrief",
     "Generate 2-minute prep briefs for any meeting type."),
    ("src/app/api/settings/ai-recommend", "settings.recommend", "aiRecommendSettingsOptimizations",
     "RevOps-style recommendations for configuration improvements."),
    ("src/app/api/billing/ai-analyze", "billing.analyze", "aiAnalyzeBillingUsage",
     "Plan optimization + cost-saving recommendations."),
    ("src/app/api/pipeline/ai-analyze", "pipeline.analyze", "aiAnalyzeDeal",
     "Deal health scoring + win probability + coaching tips."),
    ("src/app/api/icp/ai-refine", "icp.refine", "aiRefineICP",
     "Use customer data to refine your ideal customer profile."),
]

TEMPLATE = '''/**
 * {action} — Domain-specific AI route
 *
 * {description}
 * Thin wrapper around the unified AI Activation engine at /lib/ai-activate/engine.ts.
 *
 * POST {endpoint}
 * Body: depends on action (see engine.ts for TypeScript types)
 * Returns: {{ action: string, result: <action-specific type>, modelUsed: string }}
 */

import {{ NextRequest, NextResponse }} from 'next/server';
import {{ {fn_name} }} from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {{
  try {{
    const payload = await request.json();
    const result = await {fn_name}(payload);

    if (!result.success) {{
      return NextResponse.json(
        {{ error: result.error || 'AI call failed', action: '{action}' }},
        {{ status: 502 }}
      );
    }}

    return NextResponse.json({{
      action: '{action}',
      result: result.data,
      modelUsed: result.modelUsed,
    }});
  }} catch (error) {{
    console.error('[{action}] Error:', error);
    return NextResponse.json(
      {{ error: error instanceof Error ? error.message : 'Unknown error' }},
      {{ status: 500 }}
    );
  }}
}}
'''


def main():
    base = Path("/home/z/my-project")
    for directory, action, fn_name, description in ROUTES:
        dir_path = base / directory
        dir_path.mkdir(parents=True, exist_ok=True)
        file_path = dir_path / "route.ts"

        endpoint = "/" + directory.replace("src/app/api/", "/api/")
        content = TEMPLATE.format(
            action=action,
            description=description,
            endpoint=endpoint,
            fn_name=fn_name,
        )
        file_path.write_text(content)
        print(f"  wrote {file_path.relative_to(base)}")

    print(f"\nGenerated {len(ROUTES)} domain-specific AI route files")


if __name__ == "__main__":
    main()
