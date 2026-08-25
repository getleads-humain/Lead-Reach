// ============================================================
// Smart Auto-Fill Endpoint — Comprehensive Lead Enrichment
// ============================================================
// Fills ALL empty fields on a lead using multiple research sources:
//
//   1. Web research (z-ai web_search + page_reader)
//   2. LLM extraction (structured field fill from research context)
//   3. LinkedIn company search
//   4. Industry classification (SIC/NAICS)
//   5. 5-dimension scoring (firmographic/intent/reachability/strategic/data)
//   6. Tier upgrade (cold→warm→hot→super_hot based on completeness)
//
// Supports two modes:
//   - mode: 'all'     → fill every empty field (default)
//   - mode: 'group'   → fill only one field group
//   - fields: [...]   → fill only the specified field names
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callLLM, callLLMForJSON } from '@/lib/llm';

// ── Field Groups ──────────────────────────────────────────────────────

const FIELD_GROUPS = {
  identity: ['companyName', 'legalName', 'displayName', 'website', 'leadType'],
  location: ['hqAddress', 'city', 'stateProvince', 'country', 'postalCode', 'latitude', 'longitude', 'placeType'],
  contact: ['phoneMain', 'phoneDirect', 'generalEmail', 'supportEmail'],
  people: ['ceoName', 'ceoEmail', 'keyContactName', 'keyContactTitle', 'keyContactEmail', 'personFullName', 'jobTitle', 'currentCompany', 'personEmail', 'personPhone', 'linkedinPersonUrl'],
  firmographic: ['industry', 'subIndustry', 'employeeCount', 'revenueEstimate', 'foundingYear', 'ownershipType', 'sicCode', 'naicsCode'],
  digital: ['linkedinUrl', 'twitterHandle', 'facebookPage', 'techStack'],
  financial: ['ticker', 'marketCap', 'peRatio', 'revenueTtm', 'sector', 'fiveYearGrowth'],
  scoring: ['leadScore', 'leadTier', 'firmographicScore', 'intentScore', 'reachabilityScore', 'strategicScore', 'dataCompleteness'],
} as const;

type FieldGroup = keyof typeof FIELD_GROUPS;

// ── Types ─────────────────────────────────────────────────────────────

interface AutofillRequest {
  mode?: 'all' | 'group';
  group?: FieldGroup;
  fields?: string[];
  upgradeTier?: boolean;
}

interface FieldResult {
  field: string;
  oldValue: string | null;
  newValue: string | null;
  source: string;
}

interface AutofillResponse {
  success: boolean;
  lead: Record<string, unknown>;
  fieldsFilled: FieldResult[];
  totalFieldsFilled: number;
  tierChanged: boolean;
  oldTier: string;
  newTier: string;
  oldScore: number;
  newScore: number;
  dataCompleteness: number;
  steps: Array<{ step: string; status: string; result: string }>;
  error?: string;
}

// ── Web Research (z-ai SDK) ───────────────────────────────────────────

async function webResearch(companyName: string, website: string | null): Promise<{
  searchResults: string;
  pageContent: string;
  sources: string[];
}> {
  const sources: string[] = [];
  let searchResults = '';
  let pageContent = '';

  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    // Web search for company info
    const searchQuery = `${companyName} company information revenue employees industry CEO headquarters`;
    try {
      const searchResp = await zai.functions.invoke('web_search', {
        query: searchQuery,
        num: 5,
      });
      // The SDK returns SearchFunctionResultItem[] directly
      const items = (Array.isArray(searchResp) ? searchResp : []) as Array<{
        name?: string; snippet?: string; url?: string; title?: string;
      }>;
      if (items.length > 0) {
        searchResults = items
          .map((r) =>
            `Title: ${r.name || r.title || ''}\nSnippet: ${r.snippet || ''}\nURL: ${r.url || ''}`
          )
          .join('\n---\n');
        sources.push(...items.map((r) => r.url).filter((u): u is string => Boolean(u)));
      }
    } catch (err) {
      console.warn('[smart-autofill] web_search failed:', err);
    }

    // Read company website
    if (website) {
      try {
        const pageResp = await zai.functions.invoke('page_reader', {
          url: website,
        });
        // The SDK returns PageReaderFunctionResult with .data.html
        const pageData = pageResp as { data?: { html?: string; title?: string }; content?: string };
        const html = pageData?.data?.html || pageData?.content || '';
        if (html) {
          // Strip HTML tags for cleaner context
          pageContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);
        }
      } catch (err) {
        console.warn('[smart-autofill] page_reader failed:', err);
      }
    }
  } catch (err) {
    console.warn('[smart-autofill] ZAI SDK init failed:', err);
  }

  return { searchResults, pageContent, sources };
}

// ── LLM Field Extraction ──────────────────────────────────────────────

async function extractFieldsWithLLM(
  companyName: string,
  website: string | null,
  researchContext: string,
  emptyFields: string[],
): Promise<Record<string, string | null>> {
  if (emptyFields.length === 0) return {};

  const fieldDescriptions: Record<string, string> = {
    legalName: 'Official legal entity name (e.g., "Acme Corporation Inc.")',
    displayName: 'Preferred display name (usually same as companyName)',
    hqAddress: 'Full headquarters street address',
    city: 'Headquarters city',
    stateProvince: 'Headquarters state or province',
    country: 'Headquarters country',
    postalCode: 'Postal/ZIP code',
    phoneMain: 'Main company phone number',
    phoneDirect: 'Direct phone line (if different from main)',
    generalEmail: 'General contact email (e.g., info@, contact@)',
    supportEmail: 'Customer support email',
    ceoName: 'CEO or top executive full name',
    ceoEmail: 'CEO email (if public)',
    keyContactName: 'Key contact person full name (VP, Director, Head of...)',
    keyContactTitle: 'Key contact job title',
    keyContactEmail: 'Key contact email',
    personFullName: 'Person name (for person-type leads)',
    jobTitle: 'Person job title',
    currentCompany: 'Person current company',
    personEmail: 'Person email',
    personPhone: 'Person phone',
    linkedinPersonUrl: 'LinkedIn profile URL (linkedin.com/in/...)',
    industry: 'Primary industry',
    subIndustry: 'Sub-industry or vertical',
    employeeCount: 'Employee count range (e.g., "50-200", "1000+")',
    revenueEstimate: 'Annual revenue estimate (e.g., "$10M-$50M")',
    foundingYear: 'Year founded (4-digit year)',
    ownershipType: 'Ownership type (Private/Public/Subsidiary/Non-profit)',
    sicCode: 'SIC industry code',
    naicsCode: 'NAICS industry code',
    linkedinUrl: 'LinkedIn company page URL',
    twitterHandle: 'Twitter/X handle (e.g., @company)',
    facebookPage: 'Facebook page URL',
    techStack: 'Technology stack (comma-separated: AWS, React, Salesforce, ...)',
    ticker: 'Stock ticker symbol (for public companies)',
    marketCap: 'Market capitalization (e.g., "$1.2B")',
    peRatio: 'P/E ratio (number)',
    revenueTtm: 'Trailing 12-month revenue',
    sector: 'Business sector',
    fiveYearGrowth: '5-year revenue growth percentage (number)',
  };

  const fieldsToExtract = emptyFields
    .filter(f => fieldDescriptions[f])
    .map(f => `- ${f}: ${fieldDescriptions[f]}`)
    .join('\n');

  if (!fieldsToExtract) return {};

  const systemPrompt = `You are a B2B research analyst. Based on the web research context below, extract the requested company information. Return ONLY a JSON object with the field names as keys and the extracted values as strings (or null for fields you cannot determine). Do NOT make up data.`;

  const userMessage = `COMPANY: ${companyName}
WEBSITE: ${website || 'N/A'}

RESEARCH CONTEXT:
${researchContext.slice(0, 8000)}

Extract these fields (use null for any field you cannot determine — do NOT make up data):
${fieldsToExtract}

Return ONLY a JSON object.`;

  try {
    const result = await callLLMForJSON<Record<string, string | null>>(systemPrompt, userMessage, {
      temperature: 0.2,
      maxTokens: 3000,
    });
    return result || {};
  } catch (err) {
    console.error('[smart-autofill] LLM extraction failed:', err);
    return {};
  }
}

// ── LinkedIn Company Search ───────────────────────────────────────────

async function searchLinkedInCompany(companyName: string): Promise<Record<string, string> | null> {
  try {
    const { linkedInSearchCompanies } = await import('@/lib/agent-reach-bridge');
    const result = await linkedInSearchCompanies(companyName, 1);
    if (result.success && result.data && result.data.length > 0) {
      const company = result.data[0] as unknown as Record<string, unknown>;
      const data: Record<string, string> = {};
      if (company.linkedinUrl) data.linkedinUrl = String(company.linkedinUrl);
      if (company.website) data.website = String(company.website);
      if (company.industry) data.industry = String(company.industry);
      if (company.companySize) data.employeeCount = String(company.companySize);
      if (company.headquarters) data.hqAddress = String(company.headquarters);
      return data;
    }
  } catch (err) {
    console.warn('[smart-autofill] LinkedIn search failed:', err);
  }
  return null;
}

// ── Industry Classification (SIC/NAICS) ───────────────────────────────

async function classifyIndustry(companyName: string, industry: string | null): Promise<{ sicCode?: string; naicsCode?: string }> {
  if (!industry) return {};

  const industryToSIC: Record<string, { sic: string; naics: string }> = {
    'Agriculture': { sic: '100', naics: '11' },
    'Software': { sic: '7372', naics: '541511' },
    'Technology': { sic: '7372', naics: '541511' },
    'Financial Services': { sic: '6099', naics: '522310' },
    'Healthcare': { sic: '8000', naics: '62' },
    'Manufacturing': { sic: '2000', naics: '31-33' },
    'Retail': { sic: '5900', naics: '44-45' },
    'Construction': { sic: '1500', naics: '23' },
    'Energy': { sic: '4900', naics: '22' },
    'Food & Beverage': { sic: '5900', naics: '311' },
    'Logistics': { sic: '4700', naics: '48-49' },
    'Transportation': { sic: '4700', naics: '48-49' },
    'Real Estate': { sic: '6500', naics: '53' },
    'Education': { sic: '8200', naics: '61' },
    'Media': { sic: '2700', naics: '515' },
    'Entertainment': { sic: '7800', naics: '71' },
    'Hospitality': { sic: '7000', naics: '72' },
    'Consulting': { sic: '7389', naics: '541611' },
    'Marketing': { sic: '7373', naics: '5418' },
    'Legal Services': { sic: '8100', naics: '5411' },
    'Insurance': { sic: '6300', naics: '524' },
    'Telecommunications': { sic: '4800', naics: '517' },
    'Automotive': { sic: '3700', naics: '3361' },
    'Aerospace': { sic: '3720', naics: '3364' },
    'Pharmaceuticals': { sic: '2800', naics: '325412' },
    'E-commerce': { sic: '5961', naics: '454110' },
    'Supply Chain': { sic: '4700', naics: '488' },
    'Import/Export': { sic: '5099', naics: '42' },
    'Defense': { sic: '3800', naics: '3329' },
  };

  for (const [key, codes] of Object.entries(industryToSIC)) {
    if (industry.toLowerCase().includes(key.toLowerCase())) {
      return { sicCode: codes.sic, naicsCode: codes.naics };
    }
  }

  return {};
}

// ── 5-Dimension Scoring ───────────────────────────────────────────────

async function scoreLeadDimensions(
  lead: Record<string, unknown>,
): Promise<{
  firmographicScore: number;
  intentScore: number;
  reachabilityScore: number;
  strategicScore: number;
  dataCompleteness: number;
  leadScore: number;
  leadTier: string;
}> {
  // Compute data completeness from filled fields
  const allFields = [
    'companyName', 'legalName', 'website', 'industry', 'subIndustry',
    'hqAddress', 'city', 'stateProvince', 'country', 'postalCode',
    'phoneMain', 'generalEmail', 'ceoName', 'ceoEmail',
    'keyContactName', 'keyContactEmail', 'employeeCount', 'revenueEstimate',
    'foundingYear', 'linkedinUrl', 'techStack', 'sicCode', 'naicsCode',
  ];
  const filledCount = allFields.filter(f => {
    const val = lead[f];
    return val !== null && val !== undefined && val !== '';
  }).length;
  const dataCompleteness = Math.round((filledCount / allFields.length) * 100);

  // LLM-based scoring for the other 4 dimensions
  const systemPrompt = `You are a B2B lead scoring expert. Score this lead across 4 dimensions (0-100 each). Be conservative — only give high scores when there's clear evidence. Return ONLY a JSON object.`;

  const userMessage = `LEAD DATA:
${JSON.stringify(lead, null, 2)}

Dimensions:
1. firmographicScore: How well does this company fit our ICP? (industry, size, revenue, location)
2. intentScore: Are there signals this company needs our solution? (triggers, pain points, growth)
3. reachabilityScore: Can we actually reach them? (email, phone, LinkedIn, key contact)
4. strategicScore: Is this a strategic account? (market position, growth, partnerships)

Return JSON: { "firmographicScore": 0-100, "intentScore": 0-100, "reachabilityScore": 0-100, "strategicScore": 0-100 }`;

  let firmographicScore = 30;
  let intentScore = 30;
  let reachabilityScore = 30;
  let strategicScore = 30;

  try {
    const scores = await callLLMForJSON<{
      firmographicScore?: number;
      intentScore?: number;
      reachabilityScore?: number;
      strategicScore?: number;
    }>(systemPrompt, userMessage, {
      temperature: 0.2,
      maxTokens: 500,
    });
    if (scores) {
      firmographicScore = Math.min(100, Math.max(0, Number(scores.firmographicScore) || 30));
      intentScore = Math.min(100, Math.max(0, Number(scores.intentScore) || 30));
      reachabilityScore = Math.min(100, Math.max(0, Number(scores.reachabilityScore) || 30));
      strategicScore = Math.min(100, Math.max(0, Number(scores.strategicScore) || 30));
    }
  } catch (err) {
    console.warn('[smart-autofill] LLM scoring failed, using heuristic:', err);
    // Heuristic fallback
    if (lead.industry) firmographicScore += 20;
    if (lead.employeeCount) firmographicScore += 10;
    if (lead.revenueEstimate) firmographicScore += 10;
    if (lead.generalEmail || lead.phoneMain) reachabilityScore += 30;
    if (lead.ceoName || lead.keyContactName) reachabilityScore += 20;
    if (lead.linkedinUrl) reachabilityScore += 10;
  }

  // Weighted overall score
  const leadScore = Math.round(
    firmographicScore * 0.25 +
    intentScore * 0.20 +
    reachabilityScore * 0.20 +
    strategicScore * 0.20 +
    dataCompleteness * 0.15
  );

  // Tier
  let leadTier = 'cold';
  if (leadScore >= 88) leadTier = 'super_hot';
  else if (leadScore >= 70) leadTier = 'hot';
  else if (leadScore >= 40) leadTier = 'warm';

  return {
    firmographicScore,
    intentScore,
    reachabilityScore,
    strategicScore,
    dataCompleteness,
    leadScore,
    leadTier,
  };
}

// ── Main Handler ──────────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: leadId } = await params;
  const body: AutofillRequest = await request.json().catch(() => ({}));
  const { mode = 'all', group, fields, upgradeTier = true } = body;

  const steps: AutofillResponse['steps'] = [];
  const fieldsFilled: FieldResult[] = [];

  try {
    // ── Load the lead ──
    const lead = await db.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const oldTier = lead.leadTier;
    const oldScore = lead.leadScore;

    // ── Determine which fields to fill ──
    let targetFields: string[] = [];
    if (mode === 'group' && group) {
      targetFields = [...FIELD_GROUPS[group]];
    } else if (fields && fields.length > 0) {
      targetFields = fields;
    } else {
      // mode === 'all' — fill every nullable field
      targetFields = [
        ...FIELD_GROUPS.identity,
        ...FIELD_GROUPS.location,
        ...FIELD_GROUPS.contact,
        ...FIELD_GROUPS.people,
        ...FIELD_GROUPS.firmographic,
        ...FIELD_GROUPS.digital,
        ...FIELD_GROUPS.financial,
      ].filter(f => f !== 'companyName' && f !== 'leadType');
    }

    // ── Filter to only EMPTY fields ──
    const emptyFields = targetFields.filter(f => {
      const val = lead[f as keyof typeof lead];
      return val === null || val === undefined || val === '';
    });

    if (emptyFields.length === 0) {
      steps.push({ step: 'check_empty', status: 'skipped', result: 'All target fields already have values' });
    } else {
      // ── Step 1: Web Research ──
      steps.push({ step: 'web_research', status: 'running', result: 'Searching web and reading company website...' });
      const research = await webResearch(lead.companyName, lead.website);
      const researchContext = [
        `Web Search Results:\n${research.searchResults}`,
        `\nCompany Website Content:\n${research.pageContent}`,
      ].join('\n');
      steps.push({ step: 'web_research', status: 'completed', result: `Found ${research.sources.length} sources, ${research.pageContent.length} chars of page content` });

      // ── Step 2: LLM Field Extraction ──
      steps.push({ step: 'llm_extract', status: 'running', result: `Extracting ${emptyFields.length} fields with LLM...` });
      const extracted = await extractFieldsWithLLM(lead.companyName, lead.website, researchContext, emptyFields);
      const extractedCount = Object.values(extracted).filter(v => v !== null && v !== undefined && v !== '').length;
      steps.push({ step: 'llm_extract', status: 'completed', result: `Extracted ${extractedCount} fields` });

      // ── Step 3: LinkedIn Company Search (if digital fields are empty) ──
      if (emptyFields.includes('linkedinUrl') || emptyFields.includes('employeeCount')) {
        steps.push({ step: 'linkedin_search', status: 'running', result: 'Searching LinkedIn for company...' });
        const linkedInData = await searchLinkedInCompany(lead.companyName);
        if (linkedInData) {
          for (const [key, value] of Object.entries(linkedInData)) {
            if (!extracted[key] && value) {
              extracted[key] = value;
            }
          }
          steps.push({ step: 'linkedin_search', status: 'completed', result: `Found LinkedIn data: ${Object.keys(linkedInData).join(', ')}` });
        } else {
          steps.push({ step: 'linkedin_search', status: 'completed', result: 'No LinkedIn data found' });
        }
      }

      // ── Step 4: Industry Classification (SIC/NAICS) ──
      if (emptyFields.includes('sicCode') || emptyFields.includes('naicsCode')) {
        steps.push({ step: 'industry_classify', status: 'running', result: 'Classifying industry codes...' });
        const industry = (extracted.industry as string) || lead.industry;
        const codes = await classifyIndustry(lead.companyName, industry);
        if (codes.sicCode) extracted.sicCode = codes.sicCode;
        if (codes.naicsCode) extracted.naicsCode = codes.naicsCode;
        steps.push({ step: 'industry_classify', status: 'completed', result: `SIC: ${codes.sicCode || 'N/A'}, NAICS: ${codes.naicsCode || 'N/A'}` });
      }

      // ── Build the update dict (only non-null values) ──
      const updates: Record<string, unknown> = {};
      for (const [field, value] of Object.entries(extracted)) {
        if (value !== null && value !== undefined && value !== '') {
          updates[field] = value;
          fieldsFilled.push({
            field,
            oldValue: String(lead[field as keyof typeof lead] ?? ''),
            newValue: String(value),
            source: 'smart_autofill',
          });
        }
      }

      // ── Add sources if we found any ──
      if (research.sources.length > 0) {
        const existingSources = lead.sources ? JSON.parse(lead.sources) : [];
        const newSources = [...new Set([...existingSources, ...research.sources])];
        updates.sources = JSON.stringify(newSources);
      }

      // ── Step 5: Scoring (always run — recompute based on new data) ──
      steps.push({ step: 'scoring', status: 'running', result: 'Computing 5-dimension scores and tier...' });
      const mergedLead = { ...lead, ...updates };
      const scores = await scoreLeadDimensions(mergedLead as Record<string, unknown>);

      updates.leadScore = scores.leadScore;
      updates.leadTier = scores.leadTier;
      updates.firmographicScore = scores.firmographicScore;
      updates.intentScore = scores.intentScore;
      updates.reachabilityScore = scores.reachabilityScore;
      updates.strategicScore = scores.strategicScore;
      updates.dataCompleteness = scores.dataCompleteness;

      // Stage progression
      if (lead.stage === 'new') {
        updates.stage = 'enriched';
      } else if (lead.stage === 'enriched' && scores.leadScore >= 50) {
        updates.stage = 'qualified';
        updates.qualifiedAt = new Date();
      }

      updates.enrichedAt = new Date();

      steps.push({
        step: 'scoring',
        status: 'completed',
        result: `Score: ${scores.leadScore}/100, Tier: ${scores.leadTier}, Completeness: ${scores.dataCompleteness}%`,
      });

      // ── Apply updates to DB ──
      if (Object.keys(updates).length > 0) {
        await db.lead.update({
          where: { id: leadId },
          data: updates,
        });
      }

      // ── Generate AI summary ──
      try {
        const summaryPrompt = `Write a 2-3 sentence summary of this company based on the enriched data. Focus on what they do, their size, and why they're a good lead.

COMPANY: ${lead.companyName}
INDUSTRY: ${extracted.industry || lead.industry || 'N/A'}
EMPLOYEES: ${extracted.employeeCount || lead.employeeCount || 'N/A'}
REVENUE: ${extracted.revenueEstimate || lead.revenueEstimate || 'N/A'}
LOCATION: ${extracted.city || lead.city || 'N/A'}, ${extracted.country || lead.country || 'N/A'}
CEO: ${extracted.ceoName || lead.ceoName || 'N/A'}

Return just the summary text, no preamble.`;

        const summary = await callLLM({
          systemPrompt: 'You are a B2B sales analyst. Write a concise company summary.',
          userMessage: summaryPrompt,
          temperature: 0.4,
          maxTokens: 200,
        });

        if (summary) {
          const summaryNote = `\n\n[AI Enrichment Summary — ${new Date().toISOString()}]\n${summary}`;
          await db.lead.update({
            where: { id: leadId },
            data: { notes: (lead.notes || '') + summaryNote },
          });
        }
      } catch (err) {
        console.warn('[smart-autofill] AI summary failed:', err);
      }
    }

    // ── Reload the updated lead ──
    const updatedLead = await db.lead.findUnique({ where: { id: leadId } });
    if (!updatedLead) {
      return NextResponse.json({ error: 'Lead disappeared after update' }, { status: 500 });
    }

    const tierChanged = updatedLead.leadTier !== oldTier;

    const response: AutofillResponse = {
      success: true,
      lead: updatedLead as unknown as Record<string, unknown>,
      fieldsFilled,
      totalFieldsFilled: fieldsFilled.length,
      tierChanged,
      oldTier,
      newTier: updatedLead.leadTier,
      oldScore,
      newScore: updatedLead.leadScore,
      dataCompleteness: updatedLead.dataCompleteness,
      steps,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[smart-autofill] Error:', error);
    const errorResponse: AutofillResponse = {
      success: false,
      lead: {},
      fieldsFilled,
      totalFieldsFilled: 0,
      tierChanged: false,
      oldTier: '',
      newTier: '',
      oldScore: 0,
      newScore: 0,
      dataCompleteness: 0,
      steps,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
