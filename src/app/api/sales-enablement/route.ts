import { NextRequest, NextResponse } from 'next/server';
import {
  generatePlaybook,
  generateBattleCard,
  generateProposal,
  recommendContent,
  getPlaybooks,
  getBattleCards,
  getProposals,
  getContentLibrary,
} from '@/lib/agents/sales-enablement';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate_playbook': {
        const { industry, productContext } = body;
        if (!industry) {
          return NextResponse.json({ error: 'industry is required for generate_playbook' }, { status: 400 });
        }
        const playbook = await generatePlaybook(industry, productContext);
        return NextResponse.json({ playbook });
      }
      case 'generate_battle_card': {
        const { competitorName, context } = body;
        if (!competitorName) {
          return NextResponse.json({ error: 'competitorName is required for generate_battle_card' }, { status: 400 });
        }
        const battleCard = await generateBattleCard(competitorName, context);
        return NextResponse.json({ battleCard });
      }
      case 'generate_proposal': {
        const { leadData, dealContext } = body;
        if (!leadData) {
          return NextResponse.json({ error: 'leadData is required for generate_proposal' }, { status: 400 });
        }
        const proposal = await generateProposal(leadData, dealContext);
        return NextResponse.json({ proposal });
      }
      case 'recommend_content': {
        const { leadData, stage } = body;
        if (!leadData || !stage) {
          return NextResponse.json({ error: 'leadData and stage are required for recommend_content' }, { status: 400 });
        }
        const recommendations = await recommendContent(leadData, stage);
        return NextResponse.json({ recommendations });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use generate_playbook, generate_battle_card, generate_proposal, or recommend_content` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in sales-enablement API:', error);
    return NextResponse.json({ error: 'Failed to process sales enablement request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!action) {
      return NextResponse.json({ error: 'action query parameter is required' }, { status: 400 });
    }

    switch (action) {
      case 'get_playbooks': {
        const industry = searchParams.get('industry') || undefined;
        const playbooks = await getPlaybooks(industry);
        return NextResponse.json({ playbooks });
      }
      case 'get_battle_cards': {
        const battleCards = await getBattleCards();
        return NextResponse.json({ battleCards });
      }
      case 'get_proposals': {
        const leadId = searchParams.get('leadId') || undefined;
        const proposals = await getProposals(leadId);
        return NextResponse.json({ proposals });
      }
      case 'get_content_library': {
        const type = searchParams.get('type') as any || undefined;
        const tags = searchParams.get('tags')?.split(',').filter(Boolean) || undefined;
        const contentLibrary = await getContentLibrary(type, tags);
        return NextResponse.json({ contentLibrary });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use get_playbooks, get_battle_cards, get_proposals, or get_content_library` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in sales-enablement API:', error);
    return NextResponse.json({ error: 'Failed to process sales enablement query' }, { status: 500 });
  }
}
