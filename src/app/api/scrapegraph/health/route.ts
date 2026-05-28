import { NextResponse } from 'next/server';
import { scrapegraphHealth } from '@/lib/scrapegraph-bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await scrapegraphHealth();
    if (!health) {
      return NextResponse.json({
        status: 'unavailable',
        message: 'ScrapeGraphAI service is not running. Start it with: python /home/z/my-project/scrapegraph-service/server.py',
        modelsAvailable: ['glm-4.7-flash', 'glm-4.6v-flash'],
      }, { status: 503 });
    }
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
