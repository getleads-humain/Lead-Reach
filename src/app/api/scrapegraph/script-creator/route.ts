import { NextRequest, NextResponse } from 'next/server';
import { scrapegraphScriptCreator } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, source, model, headless, modelTokens } = body;

    if (!prompt || !source) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt and source' },
        { status: 400 },
      );
    }

    const result = await scrapegraphScriptCreator({
      prompt,
      source,
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
