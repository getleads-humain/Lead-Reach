import { NextRequest, NextResponse } from 'next/server';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import type { SearchResult, WebReadResult } from '@/lib/agent-reach-bridge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, numResults = 10, deepRead = false } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Step 1: Search the web
    const searchResult = await exaSearch(query, numResults);

    if (!searchResult.success) {
      return NextResponse.json(
        { success: false, error: searchResult.error || 'Search failed' },
        { status: 500 }
      );
    }

    const results: SearchResult[] = searchResult.data;

    // Step 2: Optionally deep-read the top results
    let contents: WebReadResult[] | undefined;

    if (deepRead && results.length > 0) {
      const topResults = results.slice(0, 5);
      const readPromises = topResults.map(async (r) => {
        try {
          const readResult = await webRead(r.url);
          if (readResult.success) {
            return readResult.data;
          }
          return null;
        } catch {
          return null;
        }
      });

      const readResults = await Promise.all(readPromises);
      contents = readResults.filter((r): r is WebReadResult => r !== null);
    }

    return NextResponse.json({
      success: true,
      results,
      contents,
    });
  } catch (error) {
    console.error('Error in scraper endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Scraping operation failed' },
      { status: 500 }
    );
  }
}
