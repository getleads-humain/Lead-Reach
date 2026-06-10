import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, location, options } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const fullQuery = location ? `${query} in ${location}` : query;

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/search?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: fullQuery,
        options: options || {},
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Scraper service error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({
      success: true,
      results: data.results || [],
      count: data.count || 0,
      query: fullQuery,
    });
  } catch (error: any) {
    console.error('[GMaps Search API] Error:', error.message);
    return NextResponse.json({
      success: false,
      results: [],
      count: 0,
      query: '',
      error: error.message,
    }, { status: 500 });
  }
}
