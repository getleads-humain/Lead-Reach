import { NextRequest, NextResponse } from 'next/server';
import { handleObjection } from '@/lib/agents/objection-handler';
import type { ObjectionCategory, ResponseFramework } from '@/lib/agents/objection-handler';

const VALID_CATEGORIES: ObjectionCategory[] = [
  'price', 'timing', 'competitor', 'authority', 'need', 'trust',
  'complexity', 'priority', 'budget', 'team', 'process', 'fit',
  'risk', 'contract', 'no_response',
];

const VALID_FRAMEWORKS: ResponseFramework[] = [
  'feel-felt-realized', 'acknowledge-bridge-confirm', 'listen-acknowledge-explore-respond',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objection, category, framework, ...context } = body;

    if (!objection) {
      return NextResponse.json({ error: 'objection is required' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }

    if (!framework || !VALID_FRAMEWORKS.includes(framework)) {
      return NextResponse.json({ error: `framework must be one of: ${VALID_FRAMEWORKS.join(', ')}` }, { status: 400 });
    }

    const response = await handleObjection(objection, {
      objectionCategory: category,
      responseFramework: framework,
      ...context,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling objection:', error);
    return NextResponse.json({ error: 'Failed to handle objection' }, { status: 500 });
  }
}
