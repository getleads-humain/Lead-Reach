import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'companyName', 'legalName', 'website', 'industry', 'subIndustry',
      'sicCode', 'naicsCode', 'hqAddress', 'city', 'stateProvince', 'country', 'postalCode',
      'phoneMain', 'phoneDirect', 'generalEmail', 'supportEmail',
      'ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle', 'keyContactEmail',
      'employeeCount', 'revenueEstimate', 'foundingYear', 'ownershipType',
      'linkedinUrl', 'twitterHandle', 'facebookPage', 'techStack',
      'leadScore', 'leadTier', 'firmographicScore', 'intentScore', 'reachabilityScore', 'strategicScore', 'dataCompleteness',
      'stage', 'notes', 'sources',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.stage === 'qualified' && existing.stage !== 'qualified') {
      updateData.qualifiedAt = new Date();
    }
    if (body.stage === 'contacted' && existing.stage !== 'contacted') {
      updateData.contactedAt = new Date();
    }
    if (body.stage === 'enriched' && existing.stage !== 'enriched') {
      updateData.enrichedAt = new Date();
    }

    const lead = await db.lead.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await db.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    await db.lead.delete({ where: { id } });

    await db.campaign.update({
      where: { id: existing.campaignId },
      data: { leadsFound: { decrement: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
