import { NextRequest, NextResponse } from 'next/server';
import { scrapegraphSearch } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, source, model, headless, modelTokens, maxResults } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 },
      );
    }

    const result = await scrapegraphSearch({
      prompt,
      source,
      model: model || 'glm-4.7-flash',
      headless: headless ?? true,
      modelTokens: modelTokens || 8192,
      maxResults: maxResults || 5,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
