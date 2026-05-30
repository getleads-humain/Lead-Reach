/**
 * Cron Tick Endpoint
 * ===================
 * Called periodically (by Vercel Cron or external scheduler)
 * to check for due cron jobs and create AgentTask records.
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/agent-infrastructure/cron-tick",
 *     "schedule": "* * * * *"
 *   }]
 * }
 */

import { NextResponse } from 'next/server';
import { tickCronScheduler } from '@/lib/agent-infrastructure/cron';

export async function GET() {
  try {
    const triggered = await tickCronScheduler();
    return NextResponse.json({ success: true, triggered, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[CronTick] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
