import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/prospect-discovery/convert
 *
 * Converts a discovered prospect into a Lead in the database.
 * Creates a "Prospect Discovery" campaign if one doesn't exist.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prospect, campaignId: existingCampaignId } = body as {
      prospect: Record<string, unknown>;
      campaignId?: string;
    };

    if (!prospect) {
      return NextResponse.json({ error: 'Prospect data is required' }, { status: 400 });
    }

    // Find or create a "Prospect Discovery" campaign
    let campaignId = existingCampaignId;
    if (!campaignId) {
      let campaign = await db.campaign.findFirst({
        where: { name: 'Prospect Discovery' },
      });
      if (!campaign) {
        campaign = await db.campaign.create({
          data: {
            name: 'Prospect Discovery',
            description: 'Leads discovered through the Prospect Discovery portal',
            status: 'active',
            targetIndustry: (prospect.industry as string) || 'Various',
            targetLocation: [prospect.city, prospect.country].filter(Boolean).join(', ') || 'Global',
          },
        });
      }
      campaignId = campaign.id;
    }

    // Check for duplicate lead (same company name + same campaign)
    const companyName = (prospect.companyName as string) || (prospect.personCompany as string) || 'Unknown Company';
    const existingLead = await db.lead.findFirst({
      where: {
        campaignId,
        companyName,
      },
    });

    if (existingLead) {
      return NextResponse.json({
        success: false,
        error: 'Lead already exists',
        leadId: existingLead.id,
        campaignId,
      }, { status: 409 });
    }

    // Create the lead
    const lead = await db.lead.create({
      data: {
        campaignId,
        companyName,
        legalName: (prospect.legalName as string) || null,
        website: (prospect.website as string) || null,
        industry: (prospect.industry as string) || null,
        subIndustry: (prospect.subIndustry as string) || null,
        hqAddress: (prospect.hqAddress as string) || null,
        city: (prospect.city as string) || null,
        stateProvince: (prospect.stateProvince as string) || null,
        country: (prospect.country as string) || null,
        postalCode: (prospect.postalCode as string) || null,
        phoneMain: (prospect.phoneMain as string) || null,
        generalEmail: (prospect.generalEmail as string) || null,
        supportEmail: (prospect.supportEmail as string) || null,
        ceoName: (prospect.ceoName as string) || null,
        ceoEmail: (prospect.ceoEmail as string) || null,
        keyContactName: (prospect.keyContactName as string) || (prospect.personName as string) || null,
        keyContactTitle: (prospect.keyContactTitle as string) || (prospect.personTitle as string) || null,
        keyContactEmail: (prospect.keyContactEmail as string) || (prospect.personEmail as string) || null,
        employeeCount: (prospect.employeeCount as string) || null,
        revenueEstimate: (prospect.revenueEstimate as string) || null,
        foundingYear: (prospect.foundingYear as string) || null,
        ownershipType: (prospect.ownershipType as string) || null,
        linkedinUrl: (prospect.linkedinUrl as string) || null,
        twitterHandle: (prospect.twitterHandle as string) || null,
        facebookPage: (prospect.facebookPage as string) || null,
        techStack: Array.isArray(prospect.techStack) ? JSON.stringify(prospect.techStack) : null,
        sources: Array.isArray(prospect.sources) ? JSON.stringify(prospect.sources) : null,
        stage: 'enriched',
        leadScore: (prospect.dataCompleteness as number) || 0,
        leadTier: ((prospect.dataCompleteness as number) || 0) >= 60 ? 'warm' : 'cold',
        dataCompleteness: (prospect.dataCompleteness as number) || 0,
        notes: [
          prospect.personBio ? `Bio: ${prospect.personBio}` : null,
          prospect.description ? `Company Description: ${prospect.description}` : null,
          Array.isArray(prospect.boardMembers) && prospect.boardMembers.length > 0 ? `Board Members: ${(prospect.boardMembers as string[]).join(', ')}` : null,
          Array.isArray(prospect.productsServices) && prospect.productsServices.length > 0 ? `Products/Services: ${(prospect.productsServices as string[]).join(', ')}` : null,
          prospect.fundingInfo ? `Funding: ${prospect.fundingInfo}` : null,
        ].filter(Boolean).join('\n') || null,
      },
    });

    // Update campaign lead counts
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        leadsFound: { increment: 1 },
        leadsQualified: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      campaignId,
      message: 'Prospect converted to lead successfully',
    });
  } catch (error) {
    console.error('Error converting prospect to lead:', error);
    return NextResponse.json({
      error: 'Failed to convert prospect',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
