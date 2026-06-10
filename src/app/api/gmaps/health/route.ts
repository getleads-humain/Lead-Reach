import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('XTransformPort', '5340');

    const response = await fetch(`/api/v1/health?${searchParams.toString()}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return NextResponse.json({ status: 'down', uptime: 0, active_jobs: 0 });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({
      status: 'down',
      uptime: 0,
      active_jobs: 0,
      error: error.message,
    });
  }
}
