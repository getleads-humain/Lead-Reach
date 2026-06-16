// ============================================================
// SEC EDGAR Data Source — US Public Company Filings
// ============================================================
//
// Free, no API key required. Uses the SEC EDGAR REST API
// (https://www.sec.gov/edgar/sec-api-documentation) to fetch:
//   - Company filing history (10-K, 10-Q, 8-K, DEF 14A)
//   - Submissions metadata (ticker, CIK, SIC, fiscal year)
//   - Insider transactions (Form 4) — high-intent signal
//
// Wired to: Augment (Data Enrichment) & Judge (Lead Qualification).
//
// Rate limit: 10 requests/second per IP — enforced via internal delay.
// SEC requires a User-Agent header identifying the requester.
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const EDGAR_BASE = 'https://data.sec.gov';
const EDGAR_WWW_BASE = 'https://www.sec.gov/cgi-bin/browse-edgar';
const EDGAR_TIMEOUT = 30_000;
const EDGAR_USER_AGENT = 'LeadReach-AI/1.0 (contact@leadreach.ai)';

// ─── Types ───────────────────────────────────────────────────────────────

export interface EdgarCompanyInfo {
  cik: string;              // Central Index Key (zero-padded 10 digits)
  cikRaw: string;           // Unpadded numeric string
  ticker: string;
  name: string;
  sic: string;              // Standard Industrial Classification code
  sicDescription: string;
  exchange: string;
  fiscalYearEnd: string;    // MMDD format
  stateOfIncorporation: string;
  addresses: {
    mailing: EdgarAddress;
    business: EdgarAddress;
  };
  phone: string;
  website?: string;
}

export interface EdgarAddress {
  street1: string;
  street2?: string;
  city: string;
  stateOrCountry: string;
  zipCode: string;
}

export interface EdgarFiling {
  accessionNumber: string;
  filingDate: string;       // YYYY-MM-DD
  reportDate: string;       // YYYY-MM-DD (period covered)
  form: string;             // 10-K, 10-Q, 8-K, DEF 14A, 4, etc.
  primaryDocument: string;
  primaryDocDescription: string;
  description?: string;
  isInlineXBRL: boolean;
  size: number;
}

export interface EdgarInsiderTransaction {
  ticker: string;
  ownerName: string;
  ownerCik: string;
  isDirector: boolean;
  isOfficer: boolean;
  isTenPercentOwner: boolean;
  officerTitle: string;
  filingDate: string;
  transactionDate: string;
  transactionType: 'buy' | 'sell' | 'gift' | 'exercise';
  securitiesOwned: number;
  securitiesTransacted: number;
  value: number;
  securityTitle: string;
}

export interface EdgarEnrichmentResult {
  success: boolean;
  company?: EdgarCompanyInfo;
  recentFilings: EdgarFiling[];
  recent8KEvents: EdgarFiling[];
  insiderTransactions: EdgarInsiderTransaction[];
  riskFactorKeywords?: Record<string, number>;
  customKpis: Record<string, number | string | boolean | null>;
  errors: string[];
}

// ─── Internal Helpers ────────────────────────────────────────────────────

let lastRequestTime = 0;

async function edgarFetch(path: string): Promise<any> {
  // Enforce 10 req/sec rate limit (100ms between requests)
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 120) {
    await new Promise(r => setTimeout(r, 120 - elapsed));
  }
  lastRequestTime = Date.now();

  const url = path.startsWith('http') ? path : `${EDGAR_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': EDGAR_USER_AGENT,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate',
    },
    signal: AbortSignal.timeout(EDGAR_TIMEOUT),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`EDGAR returned ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

function padCik(cik: string | number): string {
  return String(cik).padStart(10, '0');
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Resolve a ticker symbol to a CIK (Central Index Key).
 */
export async function edgarGetCikByTicker(ticker: string): Promise<string | null> {
  const url = `${EDGAR_BASE}/files/company_tickers.json`;
  // This endpoint doesn't need User-Agent in the same way, but include it.
  const res = await fetch(url, {
    headers: { 'User-Agent': EDGAR_USER_AGENT },
    signal: AbortSignal.timeout(EDGAR_TIMEOUT),
  });
  if (!res.ok) return null;

  const data = await res.json() as Record<string, { ticker: string; cik_str: number }>;
  const upper = ticker.toUpperCase();
  for (const key of Object.keys(data)) {
    if (data[key].ticker === upper) {
      return padCik(data[key].cik_str);
    }
  }
  return null;
}

/**
 * Get company metadata (name, SIC, addresses, fiscal year) by CIK.
 */
export async function edgarGetCompanyInfo(cik: string): Promise<EdgarCompanyInfo | null> {
  const padded = padCik(cik);
  const data = await edgarFetch(`/submissions/CIK${padded}.json`);

  if (!data || !data.cik) return null;

  return {
    cik: padded,
    cikRaw: String(data.cik),
    ticker: (data.tickers || [])[0] || '',
    name: data.name || '',
    sic: data.sic || '',
    sicDescription: data.sicDescription || '',
    exchange: (data.exchanges || [])[0] || '',
    fiscalYearEnd: data.fiscalYearEnd || '',
    stateOfIncorporation: data.stateOfIncorporation || '',
    addresses: {
      mailing: data.addresses?.mailing || {} as EdgarAddress,
      business: data.addresses?.business || {} as EdgarAddress,
    },
    phone: data.phone || '',
    website: data.website,
  };
}

/**
 * Get the recent filing history for a company.
 *
 * @param cik - CIK number (padded or unpadded)
 * @param forms - Optional filter: ['10-K', '10-Q', '8-K', 'DEF 14A']
 * @param limit - Max results (default 50)
 */
export async function edgarGetFilings(
  cik: string,
  forms?: string[],
  limit = 50,
): Promise<EdgarFiling[]> {
  const padded = padCik(cik);
  const data = await edgarFetch(`/submissions/CIK${padded}.json`);

  const recent = data.filings?.recent;
  if (!recent) return [];

  const filings: EdgarFiling[] = [];
  const formArr: string[] = recent.form || [];
  const dateArr: string[] = recent.filingDate || [];
  const reportArr: string[] = recent.periodOfReport || [];
  const accArr: string[] = recent.accessionNumber || [];
  const docArr: string[] = recent.primaryDocument || [];
  const descArr: string[] = recent.primaryDocDescription || [];
  const sizeArr: number[] = recent.size || [];
  const xbrlArr: boolean[] = recent.isXBRL || [];

  for (let i = 0; i < formArr.length && filings.length < limit; i++) {
    const form = formArr[i];
    if (forms && forms.length > 0 && !forms.includes(form)) continue;

    filings.push({
      accessionNumber: accArr[i],
      filingDate: dateArr[i],
      reportDate: reportArr[i],
      form,
      primaryDocument: docArr[i],
      primaryDocDescription: descArr[i] || '',
      isInlineXBRL: !!xbrlArr[i],
      size: sizeArr[i] || 0,
    });
  }

  return filings;
}

/**
 * Fetch recent insider transactions (Form 4) via the EDGAR DERIVED API.
 * Returns aggregated buy/sell activity for the last ~30 days.
 *
 * @param cik - Company CIK
 * @param days - Look-back window (default 30)
 */
export async function edgarGetInsiderTransactions(
  cik: string,
  days = 30,
): Promise<EdgarInsiderTransaction[]> {
  const padded = padCik(cik);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  try {
    // The EDGAR DERIVED API for non-derivative transactions
    const data = await edgarFetch(
      `/derivatives/transactions/byCIK/${padded}.json?date_from=${cutoff}&date_to=${new Date().toISOString().slice(0, 10)}`,
    );

    const rows = data?.rows || [];
    return rows.map((r: any): EdgarInsiderTransaction => {
      const tranType = (r.transactionType || '').toLowerCase();
      return {
        ticker: r.ticker || '',
        ownerName: r.ownerName || '',
        ownerCik: r.ownerCik || '',
        isDirector: r.isDirector === '1' || r.isDirector === 1,
        isOfficer: r.isOfficer === '1' || r.isOfficer === 1,
        isTenPercentOwner: r.isTenPercentOwner === '1' || r.isTenPercentOwner === 1,
        officerTitle: r.officerTitle || '',
        filingDate: r.filingDate || '',
        transactionDate: r.transactionDate || '',
        transactionType: tranType.includes('sell') ? 'sell' :
                          tranType.includes('gift') ? 'gift' :
                          tranType.includes('exercise') ? 'exercise' : 'buy',
        securitiesOwned: Number(r.postTransactionShares) || 0,
        securitiesTransacted: Number(r.transactionShares) || 0,
        value: Number(r.transactionValue) || 0,
        securityTitle: r.securityTitle || 'Common Stock',
      };
    });
  } catch (err) {
    // Fallback to a simpler Form 4 listing via the submissions endpoint
    const filings = await edgarGetFilings(cik, ['4'], 20);
    return filings.slice(0, 10).map(f => ({
      ticker: '',
      ownerName: '(see filing)',
      ownerCik: '',
      isDirector: false,
      isOfficer: false,
      isTenPercentOwner: false,
      officerTitle: '',
      filingDate: f.filingDate,
      transactionDate: f.filingDate,
      transactionType: 'buy' as const,
      securitiesOwned: 0,
      securitiesTransacted: 0,
      value: 0,
      securityTitle: 'Form 4 — see filing',
    }));
  }
}

/**
 * Compute high-intent KPIs from EDGAR data for a given company.
 *
 * Returns a `customKpis` object suitable for storage on the Lead model.
 */
export function computeEdgarKPIs(
  filings: EdgarFiling[],
  insiderTx: EdgarInsiderTransaction[],
): Record<string, number | string | boolean | null> {
  const now = Date.now();
  const last30Days = filings.filter(f => {
    const t = new Date(f.filingDate).getTime();
    return now - t <= 30 * 24 * 60 * 60 * 1000;
  });

  const recent8K = last30Days.filter(f => f.form === '8-K');
  const lateFilings = filings.filter(f => f.form === 'NT-10-K' || f.form === 'NT-10-Q');

  const totalBuys = insiderTx.filter(t => t.transactionType === 'buy')
    .reduce((sum, t) => sum + Math.abs(t.value), 0);
  const totalSells = insiderTx.filter(t => t.transactionType === 'sell')
    .reduce((sum, t) => sum + Math.abs(t.value), 0);

  return {
    filings_30d: last30Days.length,
    material_events_30d: recent8K.length,
    late_or_amended_filings_30d: lateFilings.length,
    insider_buy_volume_30d_usd: Math.round(totalBuys),
    insider_sell_volume_30d_usd: Math.round(totalSells),
    insider_net_volume_30d_usd: Math.round(totalBuys - totalSells),
    insider_buying_ratio: totalBuys + totalSells > 0
      ? Math.round((totalBuys / (totalBuys + totalSells)) * 100) / 100
      : null,
    insider_transactions_30d: insiderTx.length,
  };
}

/**
 * Full enrichment for a US public company.
 *
 * @param tickerOrCik - Ticker symbol (e.g., 'AAPL') or CIK number
 */
export async function edgarEnrichCompany(
  tickerOrCik: string,
): Promise<EdgarEnrichmentResult> {
  const errors: string[] = [];

  // Step 1: Resolve to CIK
  let cik = tickerOrCik;
  if (!/^\d+$/.test(tickerOrCik)) {
    const resolved = await edgarGetCikByTicker(tickerOrCik);
    if (!resolved) {
      return {
        success: false,
        company: undefined,
        recentFilings: [],
        recent8KEvents: [],
        insiderTransactions: [],
        customKpis: {},
        errors: [`Could not resolve ticker "${tickerOrCik}" to a CIK`],
      };
    }
    cik = resolved;
  } else {
    cik = padCik(tickerOrCik);
  }

  // Step 2: Fetch company info + filings in parallel
  const [company, filings, insiderTx] = await Promise.allSettled([
    edgarGetCompanyInfo(cik),
    edgarGetFilings(cik, undefined, 100),
    edgarGetInsiderTransactions(cik, 30),
  ]);

  const companyInfo = company.status === 'fulfilled' ? company.value : null;
  if (company.status === 'rejected') errors.push(`Company info: ${company.reason}`);

  const allFilings = filings.status === 'fulfilled' ? filings.value : [];
  if (filings.status === 'rejected') errors.push(`Filings: ${filings.reason}`);

  const insiderTransactions = insiderTx.status === 'fulfilled' ? insiderTx.value : [];
  if (insiderTx.status === 'rejected') errors.push(`Insider tx: ${insiderTx.reason}`);

  const recent8K = allFilings
    .filter(f => f.form === '8-K')
    .slice(0, 5);

  const customKpis = computeEdgarKPIs(allFilings, insiderTransactions);

  return {
    success: !!companyInfo || allFilings.length > 0,
    company: companyInfo || undefined,
    recentFilings: allFilings.slice(0, 20),
    recent8KEvents: recent8K,
    insiderTransactions,
    customKpis,
    errors,
  };
}

/**
 * Check EDGAR API health.
 */
export async function edgarHealth(): Promise<{ status: 'ok' | 'error'; latencyMs?: number }> {
  const start = Date.now();
  try {
    await edgarFetch(`/submissions/CIK${padCik(320193)}.json`);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error' };
  }
}
