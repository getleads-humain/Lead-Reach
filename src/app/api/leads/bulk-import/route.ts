import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Comprehensive column alias mapping (50+ aliases)
const COLUMN_ALIASES: Record<string, string[]> = {
  companyName: ['company name', 'company', 'organization', 'org', 'company_name', 'companyname', 'business name', 'business', 'employer', 'account name', 'account'],
  legalName: ['legal name', 'legal_name', 'legalname', 'registered name', 'registered_name', 'inc name', 'official name'],
  website: ['website', 'url', 'web', 'domain', 'site', 'web url', 'web_url', 'homepage', 'web address', 'web_address'],
  industry: ['industry', 'sector', 'industry sector', 'industry_sector', 'vertical', 'market sector', 'business type'],
  subIndustry: ['sub industry', 'sub_industry', 'subindustry', 'industry sub', 'niche', 'sub sector', 'sub_sector'],
  sicCode: ['sic code', 'sic', 'sic_code', 'siccode', 'sic industry code'],
  naicsCode: ['naics code', 'naics', 'naics_code', 'naicscode', 'naics industry code'],
  hqAddress: ['address', 'hq address', 'hq_address', 'headquarters', 'street address', 'street', 'street_address', 'addr', 'address1', 'address line 1'],
  city: ['city', 'town', 'locality', 'city/town'],
  stateProvince: ['state', 'province', 'region', 'state/province', 'state_province', 'territory', 'county'],
  country: ['country', 'nation', 'country code'],
  postalCode: ['postal code', 'zip', 'zipcode', 'zip code', 'postal', 'postcode', 'postal_code', 'zip_code'],
  phoneMain: ['phone', 'phone number', 'telephone', 'tel', 'main phone', 'phone_main', 'business phone', 'company phone', 'phone number main'],
  phoneDirect: ['direct phone', 'phone_direct', 'direct line', 'direct_phone', 'direct_number'],
  generalEmail: ['email', 'email address', 'e-mail', 'general email', 'info email', 'contact email', 'email_address', 'emailaddress', 'company email'],
  supportEmail: ['support email', 'support_email', 'help email', 'help_email', 'customer service email'],
  ceoName: ['ceo', 'ceo name', 'ceo_name', 'chief executive', 'executive', 'founder', 'owner'],
  ceoEmail: ['ceo email', 'ceo_email', 'executive email'],
  keyContactName: ['contact name', 'contact', 'key contact', 'key_contact', 'contact_name', 'decision maker', 'prospect name', 'first name last name', 'full name'],
  keyContactTitle: ['title', 'job title', 'position', 'role', 'contact title', 'job_title', 'designation', 'job position'],
  keyContactEmail: ['contact email', 'personal email', 'direct email', 'contact_email', 'person email'],
  employeeCount: ['employees', 'employee count', 'size', 'company size', 'employee_count', 'number of employees', 'headcount', 'staff count', 'team size'],
  revenueEstimate: ['revenue', 'annual revenue', 'turnover', 'revenue_estimate', 'sales', 'annual sales', 'gross revenue', 'estimated revenue'],
  foundingYear: ['founded', 'year founded', 'founding year', 'founding_year', 'founded_year', 'established', 'year established'],
  ownershipType: ['ownership', 'ownership type', 'ownership_type', 'entity type', 'entity_type', 'business type', 'company type'],
  linkedinUrl: ['linkedin', 'linkedin url', 'linkedin_url', 'linkedin page', 'linkedin company', 'li url'],
  twitterHandle: ['twitter', 'twitter handle', 'twitter_handle', 'x handle', 'x.com'],
  facebookPage: ['facebook', 'facebook page', 'facebook_page', 'fb page', 'fb'],
  techStack: ['tech stack', 'technology', 'technologies', 'tech', 'tech_stack', 'tools', 'software', 'platforms'],
};

function normalizeColumnName(raw: string): string | null {
  const normalized = raw.toLowerCase().trim().replace(/[_\-./\\]/g, ' ').replace(/\s+/g, ' ');
  
  for (const [target, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (normalized === target.toLowerCase() || aliases.some(alias => normalized === alias)) {
      return target;
    }
  }
  
  return null;
}

interface CSVRow {
  [key: string]: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const campaignId = formData.get('campaignId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
    }

    if (!campaignId) {
      return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    }

    // Verify campaign exists
    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Parse CSV using dynamic import of Papa Parse
    const Papa = (await import('papaparse')).default;
    const csvText = await file.text();

    const result = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (result.errors.length > 0 && result.data.length === 0) {
      return NextResponse.json({ error: 'Failed to parse CSV', details: result.errors }, { status: 400 });
    }

    const rows = result.data;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Auto-map columns
    const headers = Object.keys(rows[0]);
    const columnMap: Record<string, string | null> = {};
    
    for (const header of headers) {
      columnMap[header] = normalizeColumnName(header);
    }

    // Process rows into leads
    const leads: Array<Record<string, unknown>> = [];
    const errors: Array<{ row: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const leadData: Record<string, unknown> = { campaignId };

      for (const [header, value] of Object.entries(row)) {
        const mappedField = columnMap[header];
        if (mappedField && value && value.trim()) {
          leadData[mappedField] = value.trim();
        }
      }

      // Must have at least a company name
      if (!leadData.companyName) {
        errors.push({ row: i + 2, error: 'Missing company name' });
        continue;
      }

      leads.push(leadData);
    }

    // Insert leads into database
    let created = 0;
    for (const leadData of leads) {
      try {
        await db.lead.create({
          data: {
            campaignId: leadData.campaignId as string,
            companyName: leadData.companyName as string,
            legalName: (leadData.legalName as string) || null,
            website: (leadData.website as string) || null,
            industry: (leadData.industry as string) || null,
            subIndustry: (leadData.subIndustry as string) || null,
            sicCode: (leadData.sicCode as string) || null,
            naicsCode: (leadData.naicsCode as string) || null,
            hqAddress: (leadData.hqAddress as string) || null,
            city: (leadData.city as string) || null,
            stateProvince: (leadData.stateProvince as string) || null,
            country: (leadData.country as string) || null,
            postalCode: (leadData.postalCode as string) || null,
            phoneMain: (leadData.phoneMain as string) || null,
            phoneDirect: (leadData.phoneDirect as string) || null,
            generalEmail: (leadData.generalEmail as string) || null,
            supportEmail: (leadData.supportEmail as string) || null,
            ceoName: (leadData.ceoName as string) || null,
            ceoEmail: (leadData.ceoEmail as string) || null,
            keyContactName: (leadData.keyContactName as string) || null,
            keyContactTitle: (leadData.keyContactTitle as string) || null,
            keyContactEmail: (leadData.keyContactEmail as string) || null,
            employeeCount: (leadData.employeeCount as string) || null,
            revenueEstimate: (leadData.revenueEstimate as string) || null,
            foundingYear: (leadData.foundingYear as string) || null,
            ownershipType: (leadData.ownershipType as string) || null,
            linkedinUrl: (leadData.linkedinUrl as string) || null,
            twitterHandle: (leadData.twitterHandle as string) || null,
            facebookPage: (leadData.facebookPage as string) || null,
            techStack: (leadData.techStack as string) || null,
            sources: JSON.stringify(['csv_import']),
          },
        });
        created++;
      } catch (err) {
        errors.push({ row: leads.indexOf(leadData) + 2, error: err instanceof Error ? err.message : 'Insert failed' });
      }
    }

    // Update campaign lead count
    await db.campaign.update({
      where: { id: campaignId },
      data: { leadsFound: { increment: created } },
    });

    return NextResponse.json({
      imported: created,
      total: rows.length,
      skipped: rows.length - leads.length,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
      columnMap: Object.fromEntries(
        Object.entries(columnMap).filter(([_, v]) => v !== null)
      ),
    }, { status: 201 });
  } catch (error) {
    console.error('Error importing CSV:', error);
    return NextResponse.json({ error: 'Failed to import CSV' }, { status: 500 });
  }
}
