import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const scraperParams = new URLSearchParams();
    scraperParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/jobs?page=${page}&limit=${limit}&${scraperParams.toString()}`);

    if (!response.ok) {
      return NextResponse.json({ jobs: [], total: 0 }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GMaps Jobs API] Error:', error.message);
    return NextResponse.json({ jobs: [], total: 0 }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const scraperParams = new URLSearchParams();
    scraperParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/scrape?${scraperParams.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, options: options || {} }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[GMaps Jobs API] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
