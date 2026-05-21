import { NextRequest, NextResponse } from 'next/server';
import { buildICP, scoreLeadAgainstICP } from '@/lib/agents/icp-builder';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, criteria, lead, icp } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required (build or score)' }, { status: 400 });
    }

    switch (action) {
      case 'build': {
        if (!criteria || !criteria.name) {
          return NextResponse.json({ error: 'criteria with name is required for build action' }, { status: 400 });
        }
        const profile = buildICP(criteria);
        return NextResponse.json({ icp: profile }, { status: 201 });
      }
      case 'score': {
        if (!lead || !icp) {
          return NextResponse.json({ error: 'lead and icp are required for score action' }, { status: 400 });
        }
        const result = scoreLeadAgainstICP(lead, icp);
        return NextResponse.json({ score: result });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Use "build" or "score"` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error with ICP:', error);
    return NextResponse.json({ error: 'Failed to process ICP request' }, { status: 500 });
  }
}
