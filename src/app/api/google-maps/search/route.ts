// ============================================================
// Google Maps Scraper API — Search Endpoint
// ============================================================
// Powered by google-maps-scraper (inspired by gosom/google-maps-scraper)
// Extracts 34+ data fields per business including:
//   - Identity (name, category, description, status)
//   - Contact (phone, website, emails)
//   - Location (address, coords, plus code, timezone)
//   - Reviews (count, rating, per-rating breakdown, user reviews)
//   - Business details (hours, popular times, price range, about)
//   - Media (images, reservations, order online, menu)
//   - Internal IDs (cid, dataId, placeId)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// Puppeteer is an optional dependency — the route returns a graceful error if unavailable
let searchGoogleMaps: ((...args: unknown[]) => Promise<unknown[]>) | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@/lib/google-maps-scraper');
  searchGoogleMaps = mod.searchGoogleMaps;
} catch {
  searchGoogleMaps = null;
}

export const maxDuration = 120; // 2 minutes for scraping operations

export async function POST(request: NextRequest) {
  if (!searchGoogleMaps) {
    return NextResponse.json(
      { success: false, error: 'Google Maps scraper is not available (puppeteer not installed)', results: [], total: 0 },
      { status: 503 },
    );
  }
  try {
    const body = await request.json();

    const {
      query,
      language = 'en',
      maxDepth = 5,
      maxResults = 20,
      geoCoordinates,
      zoomLevel = 15,
      radius = 10000,
      extractEmails = false,
      extractReviews = false,
      maxReviews = 10,
      fastMode = false,
      gridSearch,
    } = body;

    // ── Validate required params ──
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'query is required and must be a string' },
        { status: 400 },
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { success: false, error: 'query must be less than 500 characters' },
        { status: 400 },
      );
    }

    // ── Validate grid search params ──
    if (gridSearch) {
      const { boundingBox, cellSizeKm } = gridSearch;
      if (!boundingBox || typeof cellSizeKm !== 'number') {
        return NextResponse.json(
          { success: false, error: 'gridSearch requires boundingBox and cellSizeKm' },
          { status: 400 },
        );
      }
      const { minLat, minLon, maxLat, maxLon } = boundingBox;
      if (
        typeof minLat !== 'number' || typeof minLon !== 'number' ||
        typeof maxLat !== 'number' || typeof maxLon !== 'number'
      ) {
        return NextResponse.json(
          { success: false, error: 'boundingBox requires numeric minLat, minLon, maxLat, maxLon' },
          { status: 400 },
        );
      }
      if (cellSizeKm < 0.1 || cellSizeKm > 50) {
        return NextResponse.json(
          { success: false, error: 'cellSizeKm must be between 0.1 and 50' },
          { status: 400 },
        );
      }
    }

    // ── Validate numeric params ──
    const safeMaxDepth = Math.min(Math.max(1, Number(maxDepth) || 5), 50);
    const safeMaxResults = Math.min(Math.max(1, Number(maxResults) || 20), 500);
    const safeMaxReviews = Math.min(Math.max(1, Number(maxReviews) || 10), 300);
    const safeZoomLevel = Math.min(Math.max(0, Number(zoomLevel) || 15), 21);
    const safeRadius = Math.min(Math.max(100, Number(radius) || 10000), 50000);

    console.log(`[GoogleMaps API] Search: "${query}" | depth=${safeMaxDepth} | results=${safeMaxResults} | fast=${fastMode} | emails=${extractEmails} | reviews=${extractReviews}`);

    const startTime = Date.now();

    const results = await searchGoogleMaps({
      query,
      language,
      maxDepth: safeMaxDepth,
      maxResults: safeMaxResults,
      geoCoordinates,
      zoomLevel: safeZoomLevel,
      radius: safeRadius,
      extractEmails,
      extractReviews,
      maxReviews: safeMaxReviews,
      fastMode,
      gridSearch: gridSearch || undefined,
    });

    const elapsed = Date.now() - startTime;

    console.log(`[GoogleMaps API] Found ${results.length} results in ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      meta: {
        query,
        language,
        maxDepth: safeMaxDepth,
        maxResults: safeMaxResults,
        fastMode,
        extractEmails,
        extractReviews,
        elapsedMs: elapsed,
        source: 'google_maps_scraper',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GoogleMaps API] Search failed:', message);

    return NextResponse.json(
      {
        success: false,
        error: 'Google Maps search failed',
        message,
        results: [],
        total: 0,
      },
      { status: 500 },
    );
  }
}

// GET endpoint for simple searches (query param based)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const language = searchParams.get('lang') || 'en';
  const maxResults = parseInt(searchParams.get('limit') || '20', 10);
  const fastMode = searchParams.get('fast') === 'true';

  if (!searchGoogleMaps) {
    return NextResponse.json(
      { success: false, error: 'Google Maps scraper is not available (puppeteer not installed)', results: [], total: 0 },
      { status: 503 },
    );
  }

  if (!query) {
    return NextResponse.json(
      { success: false, error: 'q parameter is required (e.g., ?q=restaurants+in+New+York)' },
      { status: 400 },
    );
  }

  try {
    const results = await searchGoogleMaps({
      query,
      language,
      maxResults: Math.min(maxResults, 100),
      fastMode,
    });

    return NextResponse.json({
      success: true,
      results,
      total: results.length,
      meta: { query, language, maxResults, fastMode, source: 'google_maps_scraper' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: message, results: [], total: 0 },
      { status: 500 },
    );
  }
}
