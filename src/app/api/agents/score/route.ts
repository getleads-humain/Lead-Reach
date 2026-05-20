import { NextRequest, NextResponse } from 'next/server';
import { scoreBANT, scoreMEDDIC, scoreProspect, calculateOpportunityQualityScore } from '@/lib/agents/lead-scorer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { framework, input } = body;

    if (!framework || !input) {
      return NextResponse.json({ error: 'framework and input are required' }, { status: 400 });
    }

    switch (framework) {
      case 'bant': {
        const score = scoreBANT(input);
        return NextResponse.json({ framework: 'bant', score });
      }
      case 'meddic': {
        const score = scoreMEDDIC(input);
        return NextResponse.json({ framework: 'meddic', score });
      }
      case 'prospect': {
        const score = scoreProspect(input);
        return NextResponse.json({ framework: 'prospect', score });
      }
      case 'combined': {
        const bantScore = scoreBANT(input.bant || input);
        const meddicScore = scoreMEDDIC(input.meddic || input);
        const qualityScore = calculateOpportunityQualityScore(bantScore, meddicScore);
        return NextResponse.json({
          framework: 'combined',
          bant: bantScore,
          meddic: meddicScore,
          opportunityQualityScore: qualityScore,
        });
      }
      default:
        return NextResponse.json({ error: `Unknown framework: ${framework}. Use bant, meddic, prospect, or combined` }, { status: 400 });
    }
  } catch (error) {
    console.error('Error scoring lead:', error);
    return NextResponse.json({ error: 'Failed to score lead' }, { status: 500 });
  }
}
