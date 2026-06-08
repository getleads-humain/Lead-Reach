import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

interface SaveLeadsRequest {
  type: 'leads';
  data: {
    leads: Array<{
      name: string;
      company: string;
      title: string;
      email?: string;
      phone?: string;
      score?: number;
      tier?: string;
      source?: string;
      reason?: string;
      website?: string;
      linkedin?: string;
    }>;
    campaignId?: string;
  };
}

interface SaveICPRequest {
  type: 'icp';
  data: {
    icp: {
      industry?: string[];
      companySize?: string[];
      location?: string[];
      role?: string[];
      painPoints?: string[];
      signals?: string[];
      budgetRange?: string;
      decisionTimeline?: string;
      description?: string;
    };
    name?: string;
  };
}

interface SaveOutreachRequest {
  type: 'outreach';
  data: {
    messages: Array<{
      channel: string;
      subject: string;
      body: string;
      tone: string;
    }>;
    leadId?: string;
    campaignId?: string;
  };
}

type SaveRequest = SaveLeadsRequest | SaveICPRequest | SaveOutreachRequest;

// ============================================================
// Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: SaveRequest = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: 'Type and data are required' },
        { status: 400 }
      );
    }

    switch (type) {
      case 'leads':
        return await saveLeads(data);
      case 'icp':
        return await saveICP(data);
      case 'outreach':
        return await saveOutreach(data);
      default:
        return NextResponse.json(
          { error: `Unknown save type: ${type}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[AI Save] Error:', error);
    return NextResponse.json(
      { error: 'Save request failed' },
      { status: 500 }
    );
  }
}

// ============================================================
// Save Leads
// ============================================================

async function saveLeads(
  data: SaveLeadsRequest['data']
): Promise<NextResponse> {
  const { leads, campaignId } = data;

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return NextResponse.json(
      { error: 'Leads array is required and must not be empty' },
      { status: 400 }
    );
  }

  // Find or create a default campaign
  let targetCampaignId = campaignId;

  if (!targetCampaignId) {
    // Try to find an existing active campaign
    const existingCampaign = await db.campaign.findFirst({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCampaign) {
      targetCampaignId = existingCampaign.id;
    } else {
      // Create a default campaign
      const newCampaign = await db.campaign.create({
        data: {
          name: 'AI Discovered Leads',
          description: 'Leads discovered through the AI assistant',
          status: 'active',
          targetIndustry: 'Various',
        },
      });
      targetCampaignId = newCampaign.id;
    }
  }

  const ids: string[] = [];
  let created = 0;
  let errors = 0;

  for (const lead of leads) {
    try {
      const score = lead.score || 50;
      const tier = lead.tier || (score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold');

      const createdLead = await db.lead.create({
        data: {
          campaignId: targetCampaignId,
          companyName: lead.company || 'Unknown Company',
          keyContactName: lead.name || undefined,
          keyContactTitle: lead.title || undefined,
          keyContactEmail: lead.email || undefined,
          phoneMain: lead.phone || undefined,
          website: lead.website || undefined,
          linkedinUrl: lead.linkedin || undefined,
          leadScore: score,
          leadTier: tier,
          stage: 'new',
          sources: lead.source ? JSON.stringify([lead.source]) : JSON.stringify(['AI Assistant']),
          notes: lead.reason || undefined,
        },
      });

      ids.push(createdLead.id);
      created++;
    } catch (leadError) {
      console.warn('[AI Save] Failed to save lead:', lead?.company, leadError);
      errors++;
    }
  }

  // Update campaign lead count
  if (created > 0) {
    await db.campaign.update({
      where: { id: targetCampaignId },
      data: { leadsFound: { increment: created } },
    });
  }

  return NextResponse.json({
    success: true,
    count: created,
    errors,
    ids,
    campaignId: targetCampaignId,
  });
}

// ============================================================
// Save ICP
// ============================================================

async function saveICP(
  data: SaveICPRequest['data']
): Promise<NextResponse> {
  const { icp, name } = data;

  if (!icp) {
    return NextResponse.json(
      { error: 'ICP data is required' },
      { status: 400 }
    );
  }

  try {
    const profile = await db.iCPProfile.create({
      data: {
        name: name || 'AI Generated ICP',
        description: icp.description || 'Generated by AI Assistant',
        industries: icp.industry ? JSON.stringify(icp.industry) : undefined,
        companySizes: icp.companySize ? JSON.stringify(icp.companySize) : undefined,
        locations: icp.location ? JSON.stringify(icp.location) : undefined,
        challenges: icp.painPoints ? JSON.stringify(icp.painPoints) : undefined,
        buyingSignals: icp.signals ? JSON.stringify(icp.signals) : undefined,
        budgetRange: icp.budgetRange || undefined,
        decisionTimeline: icp.decisionTimeline || undefined,
        criteria: JSON.stringify(icp),
      },
    });

    return NextResponse.json({
      success: true,
      count: 1,
      ids: [profile.id],
    });
  } catch (error) {
    console.error('[AI Save] Failed to save ICP:', error);
    return NextResponse.json(
      { error: 'Failed to save ICP profile' },
      { status: 500 }
    );
  }
}

// ============================================================
// Save Outreach
// ============================================================

async function saveOutreach(
  data: SaveOutreachRequest['data']
): Promise<NextResponse> {
  const { messages, leadId, campaignId } = data;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages array is required and must not be empty' },
      { status: 400 }
    );
  }

  const ids: string[] = [];
  let created = 0;
  let errors = 0;

  // If no leadId provided, we need a lead to attach outreach to
  // Create a placeholder or find existing
  let targetLeadId = leadId;

  if (!targetLeadId) {
    // Try to find any existing lead to attach outreach to
    const existingLead = await db.lead.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (existingLead) {
      targetLeadId = existingLead.id;
    } else {
      // Create a campaign and lead
      const campaign = await db.campaign.create({
        data: {
          name: 'AI Outreach Campaign',
          description: 'Outreach generated by AI Assistant',
          status: 'active',
        },
      });

      const lead = await db.lead.create({
        data: {
          campaignId: campaign.id,
          companyName: 'AI Outreach Target',
          stage: 'new',
        },
      });

      targetLeadId = lead.id;
    }
  }

  for (const msg of messages) {
    try {
      const outreach = await db.outreach.create({
        data: {
          leadId: targetLeadId!,
          channel: msg.channel || 'email',
          type: msg.channel === 'linkedin' ? 'connection_request' : 'cold_email',
          subject: msg.subject || undefined,
          body: msg.body,
          status: 'draft',
        },
      });

      ids.push(outreach.id);
      created++;
    } catch (msgError) {
      console.warn('[AI Save] Failed to save outreach message:', msgError);
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    count: created,
    errors,
    ids,
  });
}
