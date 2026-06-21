// ============================================================
// OpenCorporates Data Source — Official Company Registry
// ============================================================
//
// Uses the OpenCorporates REST API (https://api.opencorporates.com).
// Free tier: 1,000 requests/month — requires an API token.
//
// Provides verified company records from 130+ jurisdictions:
//   - Legal entity name & status (active, dissolved, etc.)
//   - Registered address & jurisdiction
//   - Incorporation date
//   - Directors/officers (PERSON LEADS!)
//   - Filing history (recent activity signals)
//
// Wired to: Augment (Data Enrichment).
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const OC_BASE = 'https://api.opencorporates.com/v0.4';
const OC_TIMEOUT = 30_000;

function getApiToken(): string {
  return process.env.OPENCORPORATES_API_TOKEN || '';
}

// ─── Types ───────────────────────────────────────────────────────────────

export interface OcCompany {
  opencorporatesUrl: string;
  name: string;
  jurisdictionCode: string;   // e.g., "us_de", "gb_eng"
  jurisdictionName: string;
  companyNumber: string;
  companyType: string;
  status: string;             // active, dissolved, etc.
  incorporationDate: string;  // YYYY-MM-DD
  dissolutionDate?: string;
  registeredAddress: {
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  registeredAddressInFull?: string;
  previousNames?: Array<{ companyName: string; startDate: string; endDate?: string }>;
  industryCode?: {
    code: string;
    description: string;
    type: string; // 'sic' or 'nace'
  };
  branch?: {
    companyNumber: string;
    jurisdictionCode: string;
  };
}

export interface OcOfficer {
  name: string;
  position: string;           // director, secretary, etc.
  startDate: string;
  endDate?: string;
  nationality?: string;
  occupation?: string;
  dateOfBirth?: { year: number; month: number };
  address?: string;
  opencorporatesUrl?: string;
}

export interface OcFiling {
  date: string;
  title: string;
  description?: string;
  filingType?: string;
  filingCode?: string;
}

export interface OcSearchResult {
  success: boolean;
  companies: OcCompany[];
  count: number;
  page: number;
  totalPages: number;
  apiTokenUsed: boolean;
}

export interface OcEnrichmentResult {
  success: boolean;
  company?: OcCompany;
  officers: OcOfficer[];
  filings: OcFiling[];
  customKpis: Record<string, number | string | boolean | null>;
  errors: string[];
}

// ─── Internal Helpers ────────────────────────────────────────────────────

async function ocFetch(path: string): Promise<any> {
  const token = getApiToken();
  const sep = path.includes('?') ? '&' : '?';
  const url = `${OC_BASE}${path}${sep}api_token=${encodeURIComponent(token)}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(OC_TIMEOUT),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenCorporates returned ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

function mapCompany(raw: any): OcCompany {
  const c = raw.company || raw;
  return {
    opencorporatesUrl: c.opencorporates_url || '',
    name: c.name || '',
    jurisdictionCode: c.jurisdiction_code || '',
    jurisdictionName: c.jurisdiction?.name || c.jurisdiction_code || '',
    companyNumber: c.company_number || '',
    companyType: c.company_type || '',
    status: c.current_status || '',
    incorporationDate: c.incorporation_date || '',
    dissolutionDate: c.dissolution_date,
    registeredAddress: {
      streetAddress: c.registered_address?.street_address,
      locality: c.registered_address?.locality,
      region: c.registered_address?.region,
      postalCode: c.registered_address?.postal_code,
      country: c.registered_address?.country,
    },
    registeredAddressInFull: c.registered_address_in_full,
    previousNames: (c.previous_names || []).map((n: any) => ({
      companyName: n.company_name,
      startDate: n.start_date,
      endDate: n.end_date,
    })),
    industryCode: c.industry_code ? {
      code: c.industry_code.code || '',
      description: c.industry_code.description || '',
      type: c.industry_code.type || 'sic',
    } : undefined,
    branch: c.branch ? {
      companyNumber: c.branch.company_number,
      jurisdictionCode: c.branch.jurisdiction_code,
    } : undefined,
  };
}

function mapOfficer(raw: any): OcOfficer {
  return {
    name: raw.name || '',
    position: raw.position || '',
    startDate: raw.start_date || '',
    endDate: raw.end_date,
    nationality: raw.nationality,
    occupation: raw.occupation,
    dateOfBirth: raw.date_of_birth ? {
      year: Number(raw.date_of_birth.year) || 0,
      month: Number(raw.date_of_birth.month) || 0,
    } : undefined,
    address: raw.address,
    opencorporatesUrl: raw.opencorporates_url,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Search for companies by name across all jurisdictions (or a specific one).
 *
 * @param query - Company name search term
 * @param jurisdiction - Optional jurisdiction code (e.g., 'us_de', 'gb_eng')
 * @param limit - Max results (default 30, capped at 100)
 */
export async function ocSearchCompanies(
  query: string,
  jurisdiction?: string,
  limit = 30,
): Promise<OcSearchResult> {
  const params = new URLSearchParams({
    q: query,
    per_page: String(Math.min(limit, 100)),
    order: 'score',
  });
  if (jurisdiction) params.set('jurisdiction_code', jurisdiction);

  const path = `/companies/search?${params.toString()}`;
  const data = await ocFetch(path);

  const results = data.results?.companies || [];
  const companies = results.map((r: any) => mapCompany(r.company || r));

  return {
    success: true,
    companies,
    count: companies.length,
    page: data.results?.page || 1,
    totalPages: data.results?.total_pages || 1,
    apiTokenUsed: !!getApiToken(),
  };
}

/**
 * Get full company details, officers, and filings by jurisdiction + company number.
 *
 * @param jurisdictionCode - e.g., 'us_de', 'gb_eng'
 * @param companyNumber - The official registry number
 */
export async function ocGetCompany(
  jurisdictionCode: string,
  companyNumber: string,
): Promise<OcEnrichmentResult> {
  const errors: string[] = [];

  const path = `/companies/${encodeURIComponent(jurisdictionCode)}/${encodeURIComponent(companyNumber)}`;
  const data = await ocFetch(path);

  const companyRaw = data.results?.company;
  if (!companyRaw) {
    return {
      success: false,
      officers: [],
      filings: [],
      customKpis: {},
      errors: ['Company not found in OpenCorporates'],
    };
  }

  const company = mapCompany(companyRaw);
  const officers = (companyRaw.officers || []).map(mapOfficer);
  const filings: OcFiling[] = (companyRaw.filings || []).map((f: any) => ({
    date: f.date || '',
    title: f.title || '',
    description: f.description,
    filingType: f.filing_type,
    filingCode: f.filing_code,
  }));

  // ── KPIs ─────────────────────────────────────────────────────────────
  const customKpis: Record<string, number | string | boolean | null> = {
    oc_jurisdiction: company.jurisdictionCode,
    oc_company_number: company.companyNumber,
    oc_status: company.status || 'unknown',
    oc_officer_count: officers.length,
    oc_active_directors: officers.filter(o =>
      !o.endDate && /director|ceo|cfo|cto|president|officer/i.test(o.position)
    ).length,
    oc_filing_count: filings.length,
    oc_recent_filings_180d: filings.filter(f => {
      if (!f.date) return false;
      const t = new Date(f.date).getTime();
      return Date.now() - t <= 180 * 24 * 60 * 60 * 1000;
    }).length,
    oc_incorporation_year: company.incorporationDate
      ? new Date(company.incorporationDate).getFullYear()
      : null,
    oc_company_age_years: company.incorporationDate
      ? Math.round((Date.now() - new Date(company.incorporationDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000) * 10) / 10
      : null,
  };

  return {
    success: true,
    company,
    officers,
    filings: filings.slice(0, 30),
    customKpis,
    errors,
  };
}

/**
 * Convenience: Search for a company by name, then fetch its full details.
 * Returns the first matching company's enrichment data.
 *
 * @example
 * const result = await ocEnrichByName('Apple Inc');
 */
export async function ocEnrichByName(
  name: string,
  jurisdiction?: string,
): Promise<OcEnrichmentResult & { matchedCompany?: OcCompany }> {
  const search = await ocSearchCompanies(name, jurisdiction, 5);
  if (!search.companies.length) {
    return {
      success: false,
      officers: [],
      filings: [],
      customKpis: {},
      errors: [`No OpenCorporates match for "${name}"`],
    };
  }

  const top = search.companies[0];
  const enriched = await ocGetCompany(top.jurisdictionCode, top.companyNumber);
  return { ...enriched, matchedCompany: top };
}

/**
 * Health check.
 */
export async function ocHealth(): Promise<{
  status: 'ok' | 'error' | 'no_token';
  apiTokenUsed: boolean;
  latencyMs?: number;
}> {
  const start = Date.now();
  if (!getApiToken()) {
    return { status: 'no_token', apiTokenUsed: false };
  }
  try {
    await ocFetch('/companies/search?q=test&per_page=1');
    return { status: 'ok', apiTokenUsed: true, latencyMs: Date.now() - start };
  } catch {
    return { status: 'error', apiTokenUsed: true };
  }
}

/**
 * Convert an OpenCorporates officer record into person-type Lead fields.
 * Used by Augment when extracting decision-makers from registry data.
 */
export function ocOfficerToPersonLeadFields(officer: OcOfficer, parentCompany?: OcCompany) {
  return {
    leadType: 'person' as const,
    personFullName: officer.name,
    displayName: officer.name,
    companyName: parentCompany?.name || '(unknown company)',
    jobTitle: officer.position,
    currentCompany: parentCompany?.name,
    linkedinPersonUrl: undefined,
    sources: JSON.stringify(['opencorporates']),
    customKpis: JSON.stringify({
      officer_start_date: officer.startDate,
      officer_end_date: officer.endDate || null,
      officer_nationality: officer.nationality || null,
      officer_occupation: officer.occupation || null,
      registry_jurisdiction: parentCompany?.jurisdictionCode || null,
    }),
  };
}
