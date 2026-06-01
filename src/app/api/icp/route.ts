import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildICP, scoreLeadAgainstICP, type ICP as ICPType, type ICPCriteria } from '@/lib/agents/icp-builder';

// ============================================================
// GET — List all ICP profiles
// ============================================================
export async function GET() {
  try {
    const profiles = await db.iCPProfile.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    // Parse JSON fields back into arrays
    const parsed = profiles.map((p) => ({
      ...p,
      industries: ensureArray<string>(p.industries),
      companySizes: ensureArray<string>(p.companySizes),
      locations: ensureArray<string>(p.locations),
      requiredTech: ensureArray<string>(p.requiredTech),
      preferredTech: ensureArray<string>(p.preferredTech),
      values: ensureArray<string>(p.values),
      challenges: ensureArray<string>(p.challenges),
      goals: ensureArray<string>(p.goals),
      cultureTypes: ensureArray<string>(p.cultureTypes),
      buyingSignals: ensureArray<string>(p.buyingSignals),
      engagementPatterns: ensureArray<string>(p.engagementPatterns),
      triggerEvents: ensureArray<string>(p.triggerEvents),
      expansionSignals: ensureArray<string>(p.expansionSignals),
      complianceNeeds: ensureArray<string>(p.complianceNeeds),
      criteria: ensureObject(p.criteria),
    }));

    return NextResponse.json({ profiles: parsed });
  } catch (error) {
    console.error('Error listing ICP profiles:', error);
    return NextResponse.json({ error: 'Failed to list ICP profiles' }, { status: 500 });
  }
}

// ============================================================
// POST — Create or update an ICP profile
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, profile, lead, icp } = body;

    // ---- Build ICP from criteria ----
    if (action === 'build') {
      if (!profile?.name) {
        return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
      }
      const built = buildICP(profile as ICPCriteria);
      return NextResponse.json({ icp: built }, { status: 201 });
    }

    // ---- Score a lead against an ICP ----
    if (action === 'score') {
      if (!lead || !icp) {
        return NextResponse.json({ error: 'lead and icp are required for score action' }, { status: 400 });
      }
      const result = scoreLeadAgainstICP(lead, icp as ICPType);
      return NextResponse.json({ score: result });
    }

    // ---- Save (create or update) an ICP profile ----
    if (action === 'save') {
      if (!profile?.name) {
        return NextResponse.json({ error: 'Profile name is required' }, { status: 400 });
      }

      const data = {
        name: profile.name,
        description: profile.description || null,
        industries: JSON.stringify(profile.firmographic?.industries || []),
        companySizes: JSON.stringify(profile.firmographic?.companySizes || []),
        locations: JSON.stringify(profile.firmographic?.locations || []),
        revenueRange: profile.firmographic?.revenueRange || null,
        requiredTech: JSON.stringify(profile.technographic?.requiredTech || []),
        preferredTech: JSON.stringify(profile.technographic?.preferredTech || []),
        techSophisticationLevel: profile.technographic?.techSophisticationLevel || 'medium',
        digitalMaturityScore: profile.technographic?.digitalMaturityScore || 50,
        values: JSON.stringify(profile.psychographic?.values || []),
        challenges: JSON.stringify(profile.psychographic?.challenges || []),
        goals: JSON.stringify(profile.psychographic?.goals || []),
        cultureTypes: JSON.stringify(profile.psychographic?.cultureTypes || []),
        buyingSignals: JSON.stringify(profile.behavioral?.buyingSignals || []),
        engagementPatterns: JSON.stringify(profile.behavioral?.engagementPatterns || []),
        triggerEvents: JSON.stringify(profile.situational?.triggerEvents || []),
        expansionSignals: JSON.stringify(profile.situational?.expansionSignals || []),
        complianceNeeds: JSON.stringify(profile.situational?.complianceNeeds || []),
        budgetRange: profile.economic?.budgetRange || null,
        decisionTimeline: profile.economic?.decisionTimeline || null,
        priceSensitivity: profile.economic?.priceSensitivity || 'medium',
        lifetimeValuePotential: profile.economic?.lifetimeValuePotential || 'medium',
        criteria: JSON.stringify(profile.criteria || {}),
      };

      let saved;
      if (id) {
        saved = await db.iCPProfile.update({ where: { id }, data });
      } else {
        saved = await db.iCPProfile.create({ data });
      }

      return NextResponse.json({ profile: saved, id: saved.id }, { status: id ? 200 : 201 });
    }

    // ---- Delete an ICP profile ----
    if (action === 'delete') {
      if (!id) {
        return NextResponse.json({ error: 'id is required for delete action' }, { status: 400 });
      }
      await db.iCPProfile.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown action: ${action}. Use "build", "score", "save", or "delete"` }, { status: 400 });
  } catch (error) {
    console.error('Error processing ICP request:', error);
    return NextResponse.json({ error: 'Failed to process ICP request' }, { status: 500 });
  }
}

// ============================================================
// Helpers
// ============================================================

function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

function ensureObject<T extends Record<string, unknown>>(value: unknown): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return {} as T; }
  }
  return {} as T;
}
