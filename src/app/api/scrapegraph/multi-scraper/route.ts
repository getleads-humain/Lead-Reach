import { NextRequest, NextResponse } from 'next/server';
import { scrapegraphMultiScraper } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sources, model, headless, modelTokens } = body;

    if (!prompt || !sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and sources (array of URLs)' },
        { status: 400 },
      );
    }

    const result = await scrapegraphMultiScraper({
      prompt,
      sources,
      model: model || 'glm-4.7-flash',
      headless: headless ?? true,
      modelTokens: modelTokens || 8192,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
