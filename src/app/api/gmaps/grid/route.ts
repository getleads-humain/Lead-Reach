import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { boundingBox, query, cellSizeKm, options } = body;

    if (!boundingBox || !query) {
      return NextResponse.json({ error: 'boundingBox and query are required' }, { status: 400 });
    }

    const { minLat, minLon, maxLat, maxLon } = boundingBox;
    if (minLat == null || minLon == null || maxLat == null || maxLon == null) {
      return NextResponse.json({ error: 'All bounding box coordinates are required' }, { status: 400 });
    }

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/grid?${searchParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        min_lat: minLat,
        min_lon: minLon,
        max_lat: maxLat,
        max_lon: maxLon,
        query,
        cell_size_km: cellSizeKm || 1.0,
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
      cells_scraped: data.cells_scraped || 0,
    });
  } catch (error: any) {
    console.error('[GMaps Grid API] Error:', error.message);
    return NextResponse.json({ success: false, results: [], cells_scraped: 0, error: error.message }, { status: 500 });
  }
}
