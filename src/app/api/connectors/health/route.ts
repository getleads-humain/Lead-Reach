/**
 * /api/connectors/health — Overall connectors health dashboard
 */
import { NextResponse } from 'next/server';
import { getConnectorsHealthOverview } from '@/lib/connectors/engine';

export async function GET() {
  try {
    const overview = await getConnectorsHealthOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error('[Connectors Health] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch health overview' }, { status: 500 });
  }
}
