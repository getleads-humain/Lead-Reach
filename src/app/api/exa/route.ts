import { NextRequest, NextResponse } from 'next/server';
import { exaSearch } from '@/lib/agent-reach-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, numResults = 10 } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const result = await exaSearch(query, numResults);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Search failed' },
        { status: 500 }
      );
    }

    const results = result.data.map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
    }));

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Error in Exa search endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}
