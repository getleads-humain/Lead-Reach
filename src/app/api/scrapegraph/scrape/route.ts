import { NextRequest, NextResponse } from 'next/server';
import { scrapegraphAuto } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, sources, model, headless, modelTokens, graphType } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing required field: prompt' },
        { status: 400 },
      );
    }

    const result = await scrapegraphAuto({
      prompt,
      sources: sources || [],
      model: model || 'glm-4.7-flash',
      headless: headless ?? true,
      modelTokens: modelTokens || 8192,
      graphType,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
