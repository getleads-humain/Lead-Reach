import { NextRequest, NextResponse } from 'next/server';
import { scrapegraphExtractCompanyInfo } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 },
      );
    }

    const result = await scrapegraphExtractCompanyInfo(url);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
