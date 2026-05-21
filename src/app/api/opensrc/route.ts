/**
 * Open-Source Integrations API
 *
 * GET /api/opensrc — Returns available open-source integrations and their status
 * POST /api/opensrc — Trigger actions like refreshing the proxy pool
 *
 * Integrations tracked:
 * - TeaByte/proxy-scraper (proxy rotation)
 * - unclecode/crawl4ai (web crawling)
 * - Madi-S/Lead-Generation (lead gen)
 * - agent-reach-toolkit (local)
 */

import { NextResponse } from 'next/server';
import { proxyRotator } from '@/lib/proxy-rotator';

export async function GET() {
  try {
    const stats = proxyRotator.getStats();

    const integrations = [
      {
        name: 'proxy-scraper',
        source: 'TeaByte/proxy-scraper',
        status: stats.totalProxies > 0 ? 'active' : 'available',
        proxyCount: stats.totalProxies,
        aliveProxies: stats.aliveProxies,
        deadProxies: stats.deadProxies,
        byProtocol: stats.byProtocol,
        lastRefresh: stats.lastRefresh,
        refreshIntervalMs: stats.refreshIntervalMs,
        sources: stats.sources,
      },
      {
        name: 'crawl4ai',
        source: 'unclecode/crawl4ai',
        status: 'available',
        endpoint: '/api/channels/scraper',
      },
      {
        name: 'py-lead-generation',
        source: 'Madi-S/Lead-Generation',
        status: 'available',
      },
      {
        name: 'agent-reach-toolkit',
        source: 'local',
        status: 'active',
        endpoint: '/api/agent-reach',
        channels: 17,
      },
    ];

    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('Error fetching open-source integrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: string };
    const { action } = body;

    if (action === 'refresh-proxies') {
      const result = await proxyRotator.triggerRefresh();
      return NextResponse.json({
        success: true,
        proxyCount: result.proxyCount,
        sources: result.sources,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}. Supported actions: refresh-proxies` },
      { status: 400 },
    );
  } catch (error) {
    console.error('Error processing open-source action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 },
    );
  }
}
