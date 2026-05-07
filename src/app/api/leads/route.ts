import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const tier = searchParams.get('tier');
    const stage = searchParams.get('stage');
    const industry = searchParams.get('industry');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: Record<string, unknown> = {};
    if (campaignId) where.campaignId = campaignId;
    if (tier) where.leadTier = tier;
    if (stage) where.stage = stage;
    if (industry) where.industry = industry;
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { industry: { contains: search } },
        { city: { contains: search } },
        { country: { contains: search } },
        { keyContactName: { contains: search } },
        { keyContactEmail: { contains: search } },
        { website: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.lead.findMany({
        where,
        include: { campaign: { select: { name: true } } },
        orderBy: { leadScore: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, limit });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.companyName || !body.campaignId) {
      return NextResponse.json({ error: 'Company name and campaign ID are required' }, { status: 400 });
    }

    const lead = await db.lead.create({
      data: {
        campaignId: body.campaignId,
        companyName: body.companyName,
        legalName: body.legalName || null,
        website: body.website || null,
        industry: body.industry || null,
        subIndustry: body.subIndustry || null,
        sicCode: body.sicCode || null,
        naicsCode: body.naicsCode || null,
        hqAddress: body.hqAddress || null,
        city: body.city || null,
        stateProvince: body.stateProvince || null,
        country: body.country || null,
        postalCode: body.postalCode || null,
        phoneMain: body.phoneMain || null,
        phoneDirect: body.phoneDirect || null,
        generalEmail: body.generalEmail || null,
        supportEmail: body.supportEmail || null,
        ceoName: body.ceoName || null,
        ceoEmail: body.ceoEmail || null,
        keyContactName: body.keyContactName || null,
        keyContactTitle: body.keyContactTitle || null,
        keyContactEmail: body.keyContactEmail || null,
        employeeCount: body.employeeCount || null,
        revenueEstimate: body.revenueEstimate || null,
        foundingYear: body.foundingYear || null,
        ownershipType: body.ownershipType || null,
        linkedinUrl: body.linkedinUrl || null,
        twitterHandle: body.twitterHandle || null,
        facebookPage: body.facebookPage || null,
        techStack: body.techStack || null,
        leadScore: body.leadScore || 0,
        leadTier: body.leadTier || 'unqualified',
        firmographicScore: body.firmographicScore || 0,
        intentScore: body.intentScore || 0,
        reachabilityScore: body.reachabilityScore || 0,
        strategicScore: body.strategicScore || 0,
        dataCompleteness: body.dataCompleteness || 0,
        stage: body.stage || 'new',
        notes: body.notes || null,
        sources: body.sources || null,
      },
    });

    await db.campaign.update({
      where: { id: body.campaignId },
      data: { leadsFound: { increment: 1 } },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
