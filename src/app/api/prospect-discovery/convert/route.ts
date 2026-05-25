import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// Type Coercion Helpers
// ============================================================

/**
 * Convert a value to a string suitable for a Prisma String? field.
 * Handles: numbers → string, arrays → comma-joined string,
 * null/undefined → null, empty string → null.
 */
function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : null;
  return String(value);
}

/**
 * Convert a value to an integer suitable for a Prisma Int field.
 * Handles: strings → parsed int, null/undefined → fallback, NaN → fallback.
 */
function toIntOrFallback(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Math.round(value) || fallback;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

/**
 * Convert a value to a JSON string suitable for a Prisma String? field
 * that stores JSON arrays. Handles: arrays → JSON.stringify,
 * comma-separated strings → parsed array → JSON.stringify,
 * null/undefined/empty → null.
 */
function toJsonArrayOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.length > 0 ? JSON.stringify(value) : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // Try parsing as JSON array first
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.length > 0 ? JSON.stringify(parsed) : null;
    } catch {
      // Not JSON — treat as comma-separated
    }
    // Treat as comma-separated string
    const items = trimmed.split(',').map(s => s.trim()).filter(Boolean);
    return items.length > 0 ? JSON.stringify(items) : null;
  }
  return null;
}

// ============================================================
// API Route Handler
// ============================================================

/**
 * POST /api/prospect-discovery/convert
 *
 * Converts a discovered prospect into a Lead in the database.
 * Creates a "Prospect Discovery" campaign if one doesn't exist.
 *
 * Handles type coercion robustly — the LLM may return numbers
 * where strings are expected, comma-separated strings where arrays
 * are expected, etc. All values are sanitized before reaching Prisma.
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
            targetIndustry: toStringOrNull(prospect.industry) || 'Various',
            targetLocation: [prospect.city, prospect.country].filter(v => v != null && String(v).trim()).map(v => String(v)).join(', ') || 'Global',
          },
        });
      }
      campaignId = campaign.id;
    }

    // Check for duplicate lead (same company name + same campaign)
    const companyName = toStringOrNull(prospect.companyName) || toStringOrNull(prospect.personCompany) || 'Unknown Company';
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

    // Compute data completeness score — coerce to int safely
    const completenessScore = toIntOrFallback(prospect.dataCompleteness, 0);

    // Build notes from extra fields that don't map directly to Lead columns
    const notesParts: string[] = [];
    if (prospect.personBio) notesParts.push(`Bio: ${prospect.personBio}`);
    if (prospect.description) notesParts.push(`Company Description: ${prospect.description}`);

    // Board members — handle both array and comma-separated string
    const boardMembers = Array.isArray(prospect.boardMembers)
      ? (prospect.boardMembers as string[]).filter(Boolean)
      : typeof prospect.boardMembers === 'string'
        ? (prospect.boardMembers as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];
    if (boardMembers.length > 0) notesParts.push(`Board Members: ${boardMembers.join(', ')}`);

    // Products/Services — handle both array and comma-separated string
    const productsServices = Array.isArray(prospect.productsServices)
      ? (prospect.productsServices as string[]).filter(Boolean)
      : typeof prospect.productsServices === 'string'
        ? (prospect.productsServices as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];
    if (productsServices.length > 0) notesParts.push(`Products/Services: ${productsServices.join(', ')}`);

    // Recent news — handle both array and string
    const recentNews = Array.isArray(prospect.recentNews)
      ? (prospect.recentNews as string[]).filter(Boolean)
      : typeof prospect.recentNews === 'string'
        ? (prospect.recentNews as string).split(';').map(s => s.trim()).filter(Boolean)
        : [];
    if (recentNews.length > 0) notesParts.push(`Recent News: ${recentNews.join('; ')}`);

    // Partners — handle both array and string
    const partners = Array.isArray(prospect.partners)
      ? (prospect.partners as string[]).filter(Boolean)
      : typeof prospect.partners === 'string'
        ? (prospect.partners as string).split(',').map(s => s.trim()).filter(Boolean)
        : [];
    if (partners.length > 0) notesParts.push(`Partners: ${partners.join(', ')}`);

    if (prospect.fundingInfo) notesParts.push(`Funding: ${prospect.fundingInfo}`);
    if (prospect.personPhone) notesParts.push(`Person Phone: ${prospect.personPhone}`);
    if (prospect.personLinkedin) notesParts.push(`Person LinkedIn: ${prospect.personLinkedin}`);

    // Create the lead with fully type-coerced data
    const lead = await db.lead.create({
      data: {
        campaignId,
        companyName,
        legalName: toStringOrNull(prospect.legalName),
        website: toStringOrNull(prospect.website),
        industry: toStringOrNull(prospect.industry),
        subIndustry: toStringOrNull(prospect.subIndustry),
        hqAddress: toStringOrNull(prospect.hqAddress),
        city: toStringOrNull(prospect.city),
        stateProvince: toStringOrNull(prospect.stateProvince),
        country: toStringOrNull(prospect.country),
        postalCode: toStringOrNull(prospect.postalCode),
        phoneMain: toStringOrNull(prospect.phoneMain),
        generalEmail: toStringOrNull(prospect.generalEmail),
        supportEmail: toStringOrNull(prospect.supportEmail),
        ceoName: toStringOrNull(prospect.ceoName),
        ceoEmail: toStringOrNull(prospect.ceoEmail),
        keyContactName: toStringOrNull(prospect.keyContactName) || toStringOrNull(prospect.personName),
        keyContactTitle: toStringOrNull(prospect.keyContactTitle) || toStringOrNull(prospect.personTitle),
        keyContactEmail: toStringOrNull(prospect.keyContactEmail) || toStringOrNull(prospect.personEmail),
        employeeCount: toStringOrNull(prospect.employeeCount),
        revenueEstimate: toStringOrNull(prospect.revenueEstimate),
        foundingYear: toStringOrNull(prospect.foundingYear),
        ownershipType: toStringOrNull(prospect.ownershipType),
        linkedinUrl: toStringOrNull(prospect.linkedinUrl),
        twitterHandle: toStringOrNull(prospect.twitterHandle),
        facebookPage: toStringOrNull(prospect.facebookPage),
        techStack: toJsonArrayOrNull(prospect.techStack),
        sources: toJsonArrayOrNull(prospect.sources),
        stage: 'enriched',
        leadScore: completenessScore,
        leadTier: completenessScore >= 60 ? 'warm' : 'cold',
        dataCompleteness: completenessScore,
        notes: notesParts.join('\n') || null,
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      error: 'Failed to convert prospect',
      details: message,
    }, { status: 500 });
  }
}
