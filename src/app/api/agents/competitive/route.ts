import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompetitiveLandscape, generateBattleCard } from '@/lib/agents/competitive-intel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, company, industry, competitor } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required (landscape or battlecard)' }, { status: 400 });
    }

    switch (action) {
      case 'landscape': {
        if (!company || !industry) {
          return NextResponse.json({ error: 'company and industry are required for landscape analysis' }, { status: 400 });
        }
        const result = await analyzeCompetitiveLandscape(company, industry);
        return NextResponse.json(result);
      }
      case 'battlecard': {
        if (!company || !competitor) {
          return NextResponse.json({ error: 'company and competitor are required for battle card' }, { status: 400 });
        }
        const result = await generateBattleCard(company, competitor);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Use "landscape" or "battlecard"` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with competitive analysis:', error);
    return NextResponse.json({ error: 'Failed to process competitive analysis' }, { status: 500 });
  }
}
