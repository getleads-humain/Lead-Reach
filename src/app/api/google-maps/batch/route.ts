// ============================================================
// Google Maps Scraper API — Batch Scrape Endpoint
// ============================================================
// Process multiple Google Maps URLs in parallel
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

let batchScrapeUrls: ((urls: string[]) => Promise<unknown[]>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/google-maps-scraper');
  batchScrapeUrls = mod.batchScrapeUrls;
} catch { batchScrapeUrls = null; }

export const maxDuration = 180;

export async function POST(request: NextRequest) {
  if (!batchScrapeUrls) {
    return NextResponse.json({ success: false, error: 'Google Maps scraper unavailable (puppeteer not installed)' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { urls, concurrency = 3 } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'urls array is required' },
        { status: 400 },
      );
    }

    if (urls.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 URLs per batch request' },
        { status: 400 },
      );
    }

    // Validate URLs
    for (const url of urls) {
      if (typeof url !== 'string' || !url.includes('google.com/maps')) {
        return NextResponse.json(
          { success: false, error: `Invalid URL: ${url}. Must be a Google Maps URL.` },
          { status: 400 },
        );
      }
    }

    const safeConcurrency = Math.min(Math.max(1, concurrency), 10);

    console.log(`[GoogleMaps API] Batch scrape: ${urls.length} URLs, concurrency=${safeConcurrency}`);

    const startTime = Date.now();
    const results = await batchScrapeUrls(urls);
    const elapsed = Date.now() - startTime;

    const successCount = results.filter(r => r !== null).length;

    return NextResponse.json({
      success: true,
      results: results.filter(r => r !== null),
      total: successCount,
      failed: urls.length - successCount,
      meta: {
        requestedCount: urls.length,
        concurrency: safeConcurrency,
        elapsedMs: elapsed,
        source: 'google_maps_scraper',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GoogleMaps API] Batch scrape failed:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
