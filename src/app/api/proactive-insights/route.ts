/**
 * Proactive Insights API — surfaces Vellum's proactive intelligence
 * to the dashboard, including overdue follow-ups, schedules, and
 * fading memories about important prospects.
 */

import { NextResponse } from 'next/server';
import { getProactiveInsights } from '@/lib/vellum-core/bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use 'system' scope for now — will be per-user when auth is wired
    const insights = await getProactiveInsights('system');
    return NextResponse.json({ insights });
  } catch (error) {
    // Non-critical — return empty insights on failure
    console.warn('[ProactiveInsights] Failed to get insights:', error);
    return NextResponse.json({ insights: [] });
  }
}
