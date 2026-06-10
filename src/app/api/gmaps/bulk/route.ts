import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries, location, options } = body;

    if (!queries || !Array.isArray(queries) || queries.length === 0) {
      return NextResponse.json({ error: 'queries array is required' }, { status: 400 });
    }

    if (queries.length > 20) {
      return NextResponse.json({ error: 'Maximum 20 queries per request' }, { status: 400 });
    }

    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    // Run searches with concurrency limit of 3
    const allResults: any[] = [];
    const seen = new Set<string>();
    const concurrencyLimit = 3;

    const chunks: string[][] = [];
    for (let i = 0; i < queries.length; i += concurrencyLimit) {
      chunks.push(queries.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const fullQueries = chunk.map(q => location ? `${q} in ${location}` : q);
      const promises = fullQueries.map(q =>
        fetch(`/api/v1/search?${searchParams.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, options: options || {} }),
        }).then(r => r.json()).catch(() => ({ results: [] }))
      );

      const results = await Promise.all(promises);

      for (const result of results) {
        const businesses = result.results || [];
        for (const biz of businesses) {
          const key = biz.place_id || biz.title || biz.link;
          if (key && !seen.has(key)) {
            seen.add(key);
            allResults.push(biz);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      results: allResults,
      total: allResults.length,
      duplicates_removed: 0,
    });
  } catch (error: any) {
    console.error('[GMaps Bulk API] Error:', error.message);
    return NextResponse.json({ success: false, results: [], total: 0, error: error.message }, { status: 500 });
  }
}
