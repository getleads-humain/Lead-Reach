#!/bin/bash
# Generate domain-specific AI route files
# Each file is a thin wrapper around the unified /api/ai-activate engine

set -e
cd /home/z/my-project

# Format: dir|action|method
declare -a ROUTES=(
  "src/app/api/leads/ai-score|lead.score|POST"
  "src/app/api/leads/ai-enrich|lead.enrich|POST"
  "src/app/api/leads/ai-next-action|lead.next-action|POST"
  "src/app/api/emails/ai-compose|email.compose|POST"
  "src/app/api/emails/ai-reply|email.reply|POST"
  "src/app/api/emails/ai-optimize-subject|email.optimize-subject|POST"
  "src/app/api/messaging/ai-suggest-reply|messaging.suggest-reply|POST"
  "src/app/api/messaging/ai-summarize|messaging.summarize|POST"
  "src/app/api/setters/ai-coach|setter.coach|POST"
  "src/app/api/setters/ai-qualifying-rules|setter.qualifying-rules|POST"
  "src/app/api/campaigns/ai-generate|campaign.generate|POST"
  "src/app/api/campaigns/ai-optimize|campaign.optimize|POST"
  "src/app/api/reports/ai-summary|report.summary|POST"
  "src/app/api/analytics/ai-annotate|analytics.annotate|POST"
  "src/app/api/analytics/ai-forecast|analytics.forecast|POST"
  "src/app/api/outreach/ai-sequence|outreach.sequence|POST"
  "src/app/api/abm/ai-score|abm.score|POST"
  "src/app/api/bookings/ai-brief|booking.brief|POST"
  "src/app/api/settings/ai-recommend|settings.recommend|POST"
  "src/app/api/billing/ai-analyze|billing.analyze|POST"
  "src/app/api/pipeline/ai-analyze|pipeline.analyze|POST"
  "src/app/api/icp/ai-refine|icp.refine|POST"
)

for entry in "${ROUTES[@]}"; do
  IFS='|' read -r dir action method <<< "$entry"
  file="$dir/route.ts"
  action_const=$(echo "$action" | tr '[:lower:]' '[:upper:]' | tr '.' '_')

  # Get the function name from the action
  fn_name=$(echo "$action" | sed -E 's/\./\//g; s/^/aiActivate_/')

  cat > "$file" <<EOF
/**
 * $action — Domain-specific AI route
 *
 * Thin wrapper around /api/ai-activate that exposes a clean REST endpoint
 * for $action. This makes the AI feature discoverable via the standard
 * /api/<domain>/<feature> convention.
 *
 * $method /api/$(echo "$dir" | sed 's|src/app/api/||')
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  $(getFunctionName "$action"),
} from '@/lib/ai-activate/engine';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function $method(request: NextRequest) {
  try {
    const payload = await request.json();
    const result = await $(getFunctionName "$action")(payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI call failed', action: '$action' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      action: '$action',
      result: result.data,
      modelUsed: result.modelUsed,
    });
  } catch (error) {
    console.error('[$action] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
EOF
done

echo "Generated ${#ROUTES[@]} domain-specific AI route files"
ls -la src/app/api/leads/ai-score/route.ts src/app/api/emails/ai-compose/route.ts src/app/api/setters/ai-coach/route.ts | head -5