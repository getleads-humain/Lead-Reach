import { NextRequest, NextResponse } from 'next/server';
import { generateOutreachSequence, saveOutreachSequence } from '@/lib/agents/outreach-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, save, ...input } = body;

    if (!input.leadName || !input.companyName) {
      return NextResponse.json({ error: 'leadName and companyName are required' }, { status: 400 });
    }

    if (!input.framework) {
      return NextResponse.json({ error: 'framework is required (observation-ask, problem-proof-ask, trigger-event, mutual-connection)' }, { status: 400 });
    }

    if (!input.sequenceType) {
      return NextResponse.json({ error: 'sequenceType is required (cold, warm, referral, nurture)' }, { status: 400 });
    }

    const sequence = await generateOutreachSequence(input);

    if (save && leadId) {
      await saveOutreachSequence(leadId, sequence);
    }

    return NextResponse.json(sequence, { status: 201 });
  } catch (error) {
    console.error('Error generating outreach:', error);
    return NextResponse.json({ error: 'Failed to generate outreach sequence' }, { status: 500 });
  }
}
