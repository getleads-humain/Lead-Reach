import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, location, radius, minRating, openNow, maxResults } = body;

    if (!category || !location) {
      return NextResponse.json({ error: 'category and location are required' }, { status: 400 });
    }

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    // Build search query
    const query = `${category} in ${location}`;

    const response = await fetch(`/api/v1/search?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        options: {
          depth: 10,
          max_results: maxResults || 50,
          lang: 'en',
        },
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const data = await response.json();
    let results = data.results || [];

    // Apply filters
    const filtersApplied: Record<string, any> = {};

    if (minRating) {
      results = results.filter((biz: any) => (biz.review_rating || 0) >= minRating);
      filtersApplied.minRating = minRating;
    }

    if (openNow) {
      results = results.filter((biz: any) => biz.status === 'Open' || biz.status === '');
      filtersApplied.openNow = true;
    }

    if (radius) {
      filtersApplied.radius = radius;
    }

    // Enrich top results with email extraction
    const topN = Math.min(5, results.length);
    for (let i = 0; i < topN; i++) {
      const biz = results[i];
      if (biz.website && !biz.emails?.length) {
        try {
          const emailResp = await fetch(`/api/v1/extract-emails?${searchParams.toString()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ website_url: biz.website }),
          });
          if (emailResp.ok) {
            const emailData = await emailResp.json();
            biz.emails = emailData.emails || [];
          }
        } catch (e) {
          // Continue without emails
        }
      }
    }

    return NextResponse.json({
      success: true,
      businesses: results,
      filters_applied: filtersApplied,
    });
  } catch (error: any) {
    console.error('[GMaps Discover API] Error:', error.message);
    return NextResponse.json({ success: false, businesses: [], filters_applied: {}, error: error.message }, { status: 500 });
  }
}
