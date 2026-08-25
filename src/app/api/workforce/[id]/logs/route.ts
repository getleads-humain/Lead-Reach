import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getWorkforceAgent } from '@/lib/workforce/engine';
import { getLogStats } from '@/lib/workforce/logger';

/**
 * GET /api/workforce/[id]/logs — Work logs for an agent
 *
 * Query params:
 *   ?year=2026              — Filter by year
 *   ?month=8                — Filter by month (1-12, requires year)
 *   ?day=24                 — Filter by day (1-31, requires year+month)
 *   ?hour=14                — Filter by hour (0-23, requires year+month+day)
 *   ?category=task          — Filter by category
 *   ?level=info             — Filter by level
 *   ?limit=100              — Max results (capped at 500)
 *   ?view=summary           — Return aggregated stats instead of raw logs
 *
 * Without filters, returns a summary of available years/months/days.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);
    if (!agent) {
      return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!, 10) : undefined;
    const day = searchParams.get('day') ? parseInt(searchParams.get('day')!, 10) : undefined;
    const hour = searchParams.get('hour') ? parseInt(searchParams.get('hour')!, 10) : undefined;
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100', 10)));
    const view = searchParams.get('view');

    // ── Summary view: return available years/months/days ──
    if (!year && view !== 'all') {
      const logs = await db.workforceLog.findMany({
        where: { agentId: agent.id },
        select: { year: true, month: true, day: true, hour: true, category: true, level: true },
        orderBy: { logDate: 'desc' },
      });

      // Build hierarchical summary
      const yearMap = new Map<number, Map<number, Map<number, number[]>>>();
      for (const log of logs) {
        if (!yearMap.has(log.year)) yearMap.set(log.year, new Map());
        const monthMap = yearMap.get(log.year)!;
        if (!monthMap.has(log.month)) monthMap.set(log.month, new Map());
        const dayMap = monthMap.get(log.month)!;
        if (!dayMap.has(log.day)) dayMap.set(log.day, []);
        dayMap.get(log.day)!.push(log.hour);
      }

      // Convert to array format
      const hierarchy = Array.from(yearMap.entries()).map(([y, monthMap]) => ({
        year: y,
        months: Array.from(monthMap.entries()).map(([m, dayMap]) => ({
          month: m,
          days: Array.from(dayMap.entries()).map(([d, hours]) => ({
            day: d,
            hours: [...new Set(hours)].sort((a, b) => a - b),
            logCount: hours.length,
          })),
          logCount: Array.from(dayMap.values()).reduce((s, hs) => s + hs.length, 0),
        })),
        logCount: Array.from(monthMap.values()).reduce(
          (s, dm) => s + Array.from(dm.values()).reduce((s2, hs) => s2 + hs.length, 0),
          0
        ),
      }));

      // Overall stats
      const byCategory: Record<string, number> = {};
      const byLevel: Record<string, number> = {};
      for (const log of logs) {
        byCategory[log.category] = (byCategory[log.category] || 0) + 1;
        byLevel[log.level] = (byLevel[log.level] || 0) + 1;
      }

      return NextResponse.json({
        summary: true,
        totalLogs: logs.length,
        hierarchy,
        byCategory,
        byLevel,
      });
    }

    // ── Detailed view: return filtered logs ──
    const where: Record<string, unknown> = { agentId: agent.id };
    if (year) where.year = year;
    if (month) where.month = month;
    if (day) where.day = day;
    if (hour) where.hour = hour;
    if (category) where.category = category;
    if (level) where.level = level;

    // If view=summary, return aggregated stats
    if (view === 'summary') {
      const stats = await getLogStats(agent.id, { year, month, day });
      return NextResponse.json({ stats, filters: { year, month, day, hour, category, level } });
    }

    // Otherwise return raw logs
    const logs = await db.workforceLog.findMany({
      where,
      orderBy: { logDate: 'desc' },
      take: limit,
    });

    // Also get stats for this period
    const stats = await getLogStats(agent.id, { year, month, day });

    return NextResponse.json({
      logs,
      count: logs.length,
      filters: { year, month, day, hour, category, level },
      stats,
    });
  } catch (error) {
    console.error('[Workforce API] Error listing logs:', error);
    return NextResponse.json({ error: 'Failed to list logs' }, { status: 500 });
  }
}

/**
 * POST /api/workforce/[id]/logs — Create a log entry manually
 * Body: { category, action, description, level?, details?, duration? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await getWorkforceAgent(id);
    if (!agent) {
      return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
    }

    const body = await request.json();
    const { logAgentActivity } = await import('@/lib/workforce/logger');

    await logAgentActivity(agent.id, {
      category: body.category,
      action: body.action,
      description: body.description,
      level: body.level,
      details: body.details,
      duration: body.duration,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('[Workforce API] Error creating log:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
