import { NextRequest, NextResponse } from 'next/server';
import { getAgentContext, storeEpisode, storeInsight, queryMemory } from '@/lib/agents/agent-memory';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get('agentName');
    const category = searchParams.get('category') || undefined;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!agentName) {
      return NextResponse.json({ error: 'agentName is required' }, { status: 400 });
    }

    if (query) {
      const results = await queryMemory(agentName, query);
      return NextResponse.json({ memories: results });
    }

    const memories = await getAgentContext(agentName, category, limit);
    return NextResponse.json({ memories });
  } catch (error) {
    console.error('Error fetching agent memory:', error);
    return NextResponse.json({ error: 'Failed to fetch agent memory' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { agentName, type, ...data } = body;

    if (!agentName || !type) {
      return NextResponse.json({ error: 'agentName and type are required' }, { status: 400 });
    }

    if (type === 'episodic') {
      const episode = await storeEpisode(agentName, data);
      return NextResponse.json(episode, { status: 201 });
    }

    if (type === 'semantic') {
      const { category, insight, confidence, source } = data;
      if (!category || !insight) {
        return NextResponse.json({ error: 'category and insight are required for semantic memory' }, { status: 400 });
      }
      const result = await storeInsight(agentName, category, { insight, confidence: confidence || 0.7, source: source || 'api' });
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid memory type. Use "episodic" or "semantic"' }, { status: 400 });
  } catch (error) {
    console.error('Error storing agent memory:', error);
    return NextResponse.json({ error: 'Failed to store agent memory' }, { status: 500 });
  }
}
