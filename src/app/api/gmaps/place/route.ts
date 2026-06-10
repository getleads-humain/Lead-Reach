import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urlOrPlaceId, options } = body;

    if (!urlOrPlaceId) {
      return NextResponse.json({ error: 'urlOrPlaceId is required' }, { status: 400 });
    }

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/place?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url_or_place_id: urlOrPlaceId,
        email: options?.email || false,
        extra_reviews: options?.extraReviews || false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Scraper service error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      place: data.place || null,
    });
  } catch (error: any) {
    console.error('[GMaps Place API] Error:', error.message);
    return NextResponse.json({ success: false, place: null, error: error.message }, { status: 500 });
  }
}
