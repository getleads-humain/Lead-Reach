// ============================================================
// Google Maps Scraper API — Single Place Endpoint
// ============================================================
// Scrape a specific Google Maps place by URL or place ID
// Extracts all 34+ data fields for a single business
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

let scrapeGoogleMapsUrl: ((url: string) => Promise<unknown>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/google-maps-scraper');
  scrapeGoogleMapsUrl = mod.scrapeGoogleMapsUrl;
} catch { scrapeGoogleMapsUrl = null; }

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  if (!scrapeGoogleMapsUrl) {
    return NextResponse.json({ success: false, error: 'Google Maps scraper unavailable (puppeteer not installed)' }, { status: 503 });
  }
  try {
    const body = await request.json();
    const { url, extractEmails = false, extractReviews = false, maxReviews = 10 } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'url is required (Google Maps place URL)' },
        { status: 400 },
      );
    }

    // Validate it looks like a Google Maps URL
    if (!url.includes('google.com/maps') && !url.includes('maps.app.goo.gl')) {
      return NextResponse.json(
        { success: false, error: 'URL must be a Google Maps place URL' },
        { status: 400 },
      );
    }

    console.log(`[GoogleMaps API] Place scrape: ${url}`);

    const startTime = Date.now();
    const result = await scrapeGoogleMapsUrl(url);
    const elapsed = Date.now() - startTime;

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Could not extract data from this place URL', elapsedMs: elapsed },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      result,
      meta: {
        url,
        extractEmails,
        extractReviews,
        maxReviews,
        elapsedMs: elapsed,
        source: 'google_maps_scraper',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GoogleMaps API] Place scrape failed:', message);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
