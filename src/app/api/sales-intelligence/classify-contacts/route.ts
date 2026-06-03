import { NextRequest, NextResponse } from 'next/server';
import { classifyContacts, getOutreachStrategy, getAllRoleStrategies } from '@/lib/sales-intelligence';

/**
 * POST /api/sales-intelligence/classify-contacts
 *
 * Classify a list of contacts by seniority, department, and buying role.
 * Returns outreach strategies per role.
 *
 * Body: {
 *   contacts: Array<{ name: string; title: string }>;
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.contacts) || body.contacts.length === 0) {
      return NextResponse.json({ error: 'contacts array is required' }, { status: 400 });
    }

    const classified = classifyContacts(body.contacts);

    // Attach outreach strategy per contact
    const enriched = classified.map(contact => ({
      ...contact,
      outreachStrategy: getOutreachStrategy(contact.buyingRole),
    }));

    // Group by buying role for strategic overview
    const roleBreakdown: Record<string, number> = {};
    for (const contact of enriched) {
      roleBreakdown[contact.buyingRole] = (roleBreakdown[contact.buyingRole] || 0) + 1;
    }

    return NextResponse.json({
      contacts: enriched,
      roleBreakdown,
      strategies: getAllRoleStrategies(),
      multiThreadingRecommendation: generateMultiThreadingRec(enriched),
    });
  } catch (error) {
    console.error('[Classify Contacts] Error:', error);
    return NextResponse.json(
      { error: 'Classification failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateMultiThreadingRec(contacts: any[]): string {
  const economicBuyers = contacts.filter(c => c.buyingRole === 'Economic Buyer');
  const champions = contacts.filter(c => c.buyingRole === 'Champion');
  const evaluators = contacts.filter(c => c.buyingRole === 'Evaluator');

  if (economicBuyers.length > 0 && champions.length > 0) {
    return `Strong multi-threading opportunity: Engage ${champions[0].name} as your champion while keeping ${economicBuyers[0].name} informed. Start with the champion, then escalate to the economic buyer with their support.`;
  }
  if (champions.length > 0) {
    return `Start with ${champions[0].name} as your champion. They can help navigate the organization and identify the economic buyer.`;
  }
  if (evaluators.length > 0) {
    return `Begin with ${evaluators[0].name} as an evaluator. Use their technical buy-in to build a business case for the economic buyer.`;
  }
  return 'No clear buying committee structure detected. Research the organization further to identify key stakeholders before outreach.';
}

/**
 * GET /api/sales-intelligence/classify-contacts
 *
 * Return all available role strategies and classification maps.
 */
export async function GET() {
  return NextResponse.json({
    strategies: getAllRoleStrategies(),
    buyingRoles: ['Economic Buyer', 'Champion', 'Evaluator', 'End User', 'Blocker'],
    seniorityLevels: ['C-Suite', 'VP', 'Director', 'Manager', 'IC'],
    departments: ['Engineering', 'Sales', 'Marketing', 'Product', 'Operations', 'Finance', 'HR', 'Legal', 'Customer Success'],
  });
}
