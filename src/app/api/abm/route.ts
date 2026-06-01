import { NextRequest, NextResponse } from 'next/server';
import {
  createAccountList,
  populateAccountList,
  scoreAccount,
  detectIntentSignals,
  generateContentStrategy,
  trackEngagement,
  getAccountLists,
  getAccountsInList,
  getAccountsWithHighIntent,
  getABMCampaignPerformance,
} from '@/lib/agents/abm-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'create_list': {
        const { name, criteria } = body;
        if (!name || !criteria) {
          return NextResponse.json({ error: 'name and criteria are required for create_list' }, { status: 400 });
        }
        const list = await createAccountList(name, criteria);
        return NextResponse.json({ list });
      }
      case 'populate_list': {
        const { listId, criteria } = body;
        if (!listId || !criteria) {
          return NextResponse.json({ error: 'listId and criteria are required for populate_list' }, { status: 400 });
        }
        const list = await populateAccountList(listId, criteria);
        return NextResponse.json({ list });
      }
      case 'score_account': {
        const { accountData } = body;
        if (!accountData) {
          return NextResponse.json({ error: 'accountData is required for score_account' }, { status: 400 });
        }
        const scoreResult = await scoreAccount(accountData);
        return NextResponse.json({ scoreResult });
      }
      case 'detect_intent': {
        const { accountId } = body;
        if (!accountId) {
          return NextResponse.json({ error: 'accountId is required for detect_intent' }, { status: 400 });
        }
        const signals = await detectIntentSignals(accountId);
        return NextResponse.json({ signals });
      }
      case 'content_strategy': {
        const { accountId } = body;
        if (!accountId) {
          return NextResponse.json({ error: 'accountId is required for content_strategy' }, { status: 400 });
        }
        const strategy = await generateContentStrategy(accountId);
        return NextResponse.json({ strategy });
      }
      case 'track_engagement': {
        const { accountId, eventType, metadata } = body;
        if (!accountId || !eventType) {
          return NextResponse.json({ error: 'accountId and eventType are required for track_engagement' }, { status: 400 });
        }
        const event = trackEngagement(accountId, eventType, metadata);
        return NextResponse.json({ event });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use create_list, populate_list, score_account, detect_intent, content_strategy, or track_engagement` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in ABM API:', error);
    return NextResponse.json({ error: 'Failed to process ABM request' }, { status: 500 });
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
      case 'get_lists': {
        const lists = getAccountLists();
        return NextResponse.json({ lists });
      }
      case 'get_accounts': {
        const listId = searchParams.get('listId');
        const tier = searchParams.get('tier') as any || undefined;
        if (!listId) {
          return NextResponse.json({ error: 'listId is required for get_accounts' }, { status: 400 });
        }
        const accounts = getAccountsInList(listId, tier);
        return NextResponse.json({ accounts });
      }
      case 'high_intent': {
        const threshold = searchParams.get('threshold') ? parseInt(searchParams.get('threshold')!) : 60;
        const accounts = getAccountsWithHighIntent(threshold);
        return NextResponse.json({ accounts });
      }
      case 'campaign_performance': {
        const campaignId = searchParams.get('campaignId');
        if (!campaignId) {
          return NextResponse.json({ error: 'campaignId is required for campaign_performance' }, { status: 400 });
        }
        const performance = await getABMCampaignPerformance(campaignId);
        return NextResponse.json({ performance });
      }
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use get_lists, get_accounts, high_intent, or campaign_performance` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('Error in ABM API:', error);
    return NextResponse.json({ error: 'Failed to process ABM query' }, { status: 500 });
  }
}
