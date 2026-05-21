import { NextRequest, NextResponse } from 'next/server';
import { generateMeetingPrep } from '@/lib/agents/meeting-prep';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, contactName, contactTitle, industry, website, meetingObjective, previousInteractions, additionalContext } = body;

    if (!companyName) {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }

    const prep = await generateMeetingPrep({
      companyName,
      contactName,
      contactTitle,
      industry,
      website,
      meetingObjective,
      previousInteractions,
      additionalContext,
    });

    return NextResponse.json(prep);
  } catch (error) {
    console.error('Error generating meeting prep:', error);
    return NextResponse.json({ error: 'Failed to generate meeting prep' }, { status: 500 });
  }
}
