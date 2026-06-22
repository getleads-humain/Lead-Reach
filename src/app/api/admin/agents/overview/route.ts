/**
 * GET /api/admin/agents/overview
 * ==============================
 * Returns a high-level overview of the agentic system:
 *   - SOP manifest (agents, variants, phases, constraints)
 *   - MoE experts
 *   - Recent pipeline runs
 *   - Aggregate run stats
 *   - Registered tools
 *   - Available memory scopes
 *
 * Used by the /admin/agents dashboard page.
 */

import { NextResponse } from 'next/server';
import {
  getSopManifest,
  listExperts,
  listTools,
  ensureToolsRegistered,
  getRecentRuns,
  getRunStats,
} from '@/lib/agentic-system';

export async function GET() {
  try {
    await ensureToolsRegistered();
    const manifest = getSopManifest();
    const experts = listExperts();
    const tools = listTools();
    const recentRuns = getRecentRuns(20);
    const stats = getRunStats();

    return NextResponse.json({
      sop: manifest,
      experts,
      tools,
      recentRuns,
      stats,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[AdminAPI] overview failed:', err);
    return NextResponse.json(
      { error: 'Failed to load agentic system overview', details: String(err) },
      { status: 500 },
    );
  }
}
