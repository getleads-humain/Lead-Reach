// ============================================================
// yfinance-equivalent Data Source — Yahoo Finance Market Data
// ============================================================
//
// Free, no API key required. Uses Yahoo Finance's public
// query1.query.finance.yahoo.com endpoints to fetch:
//   - Quote summary (price, market cap, PE ratio)
//   - Company profile (sector, industry, employees)
//   - Income statement (revenue, net income)
//   - Historical prices (for 5-year growth calc)
//
// Wired to: Augment (Data Enrichment) & Judge (Lead Qualification).
//
// NOTE: Yahoo Finance's API is unofficial and may rate-limit or
// change without notice. For production-grade financial data,
// consider upgrading to Alpha Vantage, Polygon.io, or Financial Modeling Prep.
// ============================================================

// ─── Configuration ───────────────────────────────────────────────────────

const YF_BASE = 'https://query1.query.finance.yahoo.com';
const YF_BASE_2 = 'https://query2.query.finance.yahoo.com';
const YF_TIMEOUT = 20_000;
const YF_USER_AGENT = 'Mozilla/5.0 (compatible; LeadReach-AI/1.0)';

// ─── Types ───────────────────────────────────────────────────────────────

export interface YFinanceQuote {
  ticker: string;
  exchange: string;
  shortName: string;
  longName: string;
  currency: string;
  marketCap: number;
  enterpriseValue: number;
  trailingPE: number | null;
  forwardPE: number | null;
  pegRatio: number | null;
  priceToBook: number | null;
  priceToSales: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  currentPrice: number;
  beta: number | null;
}

export interface YFinanceProfile {
  sector: string;
  industry: string;
  fullTimeEmployees: number;
  longBusinessSummary: string;
  city: string;
  state: string;
  country: string;
  website: string;
  address1: string;
  zip: string;
  foundedYear?: number;
}

export interface YFinanceFinancials {
  totalRevenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  ebitda: number;
  revenueGrowthYoY: number; // percentage
  profitMargins: number;    // percentage
}

export interface YFinanceEnrichmentResult {
  success: boolean;
  quote?: YFinanceQuote;
  profile?: YFinanceProfile;
  financials?: YFinanceFinancials;
  fiveYearRevenueGrowth?: number; // percentage
  customKpis: Record<string, number | string | boolean | null>;
  errors: string[];
}

// ─── Internal Helpers ────────────────────────────────────────────────────

async function yfFetch(path: string): Promise<any> {
  const url = path.startsWith('http') ? path : `${YF_BASE}${path}`;

  const fetchWithBase = async (base: string): Promise<Response> => {
    const finalUrl = path.startsWith('http') ? path : `${base}${path}`;
    return fetch(finalUrl, {
      headers: {
        'User-Agent': YF_USER_AGENT,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(YF_TIMEOUT),
    });
  };

  let res: Response;
  try {
    res = await fetchWithBase(YF_BASE);
    if (!res.ok) {
      // Try fallback base
      res = await fetchWithBase(YF_BASE_2);
    }
  } catch {
    res = await fetchWithBase(YF_BASE_2);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Yahoo Finance returned ${res.status}: ${text.slice(0, 200)}`);
  }

  return res.json();
}

/**
 * Fetch the quote summary (modules: price, summaryDetail, financialData).
 */
async function yfGetQuoteSummary(ticker: string): Promise<any> {
  const modules = ['price', 'summaryDetail', 'financialData', 'defaultKeyStatistics'];
  const path = `/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules.join(',')}`;
  const data = await yfFetch(path);
  return data?.quoteSummary?.result?.[0] || {};
}

/**
 * Fetch the asset profile (sector, industry, employees, address).
 */
async function yfGetAssetProfile(ticker: string): Promise<any> {
  const path = `/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=assetProfile`;
  const data = await yfFetch(path);
  return data?.quoteSummary?.result?.[0]?.assetProfile || {};
}

/**
 * Fetch income statement history (annual).
 */
async function yfGetIncomeStatement(ticker: string): Promise<any> {
  const path = `/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=incomeStatementHistory`;
  const data = await yfFetch(path);
  return data?.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory || [];
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Fetch the full quote + profile + financials for a ticker.
 *
 * @example
 * const result = await yfinanceEnrich('AAPL');
 * console.log(result.profile?.sector);        // 'Technology'
 * console.log(result.financials?.totalRevenue); // 394328000000
 */
export async function yfinanceEnrich(ticker: string): Promise<YFinanceEnrichmentResult> {
  const errors: string[] = [];
  const upper = ticker.toUpperCase().trim();

  const [quoteSummaryRes, profileRes, incomeRes] = await Promise.allSettled([
    yfGetQuoteSummary(upper),
    yfGetAssetProfile(upper),
    yfGetIncomeStatement(upper),
  ]);

  if (quoteSummaryRes.status === 'rejected') {
    errors.push(`Quote summary: ${quoteSummaryRes.reason}`);
  }
  if (profileRes.status === 'rejected') {
    errors.push(`Asset profile: ${profileRes.reason}`);
  }
  if (incomeRes.status === 'rejected') {
    errors.push(`Income statement: ${incomeRes.reason}`);
  }

  if (quoteSummaryRes.status !== 'fulfilled' && profileRes.status !== 'fulfilled') {
    return {
      success: false,
      customKpis: {},
      errors,
    };
  }

  const quoteSummary = quoteSummaryRes.status === 'fulfilled' ? quoteSummaryRes.value : {};
  const profileRaw = profileRes.status === 'fulfilled' ? profileRes.value : {};
  const income = incomeRes.status === 'fulfilled' ? incomeRes.value : [];

  // ── Parse quote ──────────────────────────────────────────────────────
  const price = quoteSummary.price || {};
  const summaryDetail = quoteSummary.summaryDetail || {};
  const financialData = quoteSummary.financialData || {};

  const quote: YFinanceQuote | undefined = price.regularMarketPrice ? {
    ticker: upper,
    exchange: price.exchange || '',
    shortName: price.shortName || '',
    longName: price.longName || price.shortName || '',
    currency: price.currency || 'USD',
    marketCap: Number(price.marketCap) || 0,
    enterpriseValue: Number(financialData.enterpriseValue) || 0,
    trailingPE: summaryDetail.trailingPE ?? null,
    forwardPE: summaryDetail.forwardPE ?? null,
    pegRatio: summaryDetail.pegRatio ?? null,
    priceToBook: summaryDetail.priceToBook ?? null,
    priceToSales: summaryDetail.priceToSales ?? null,
    dividendYield: summaryDetail.dividendYield ?? null,
    fiftyTwoWeekHigh: Number(summaryDetail.fiftyTwoWeekHigh) || 0,
    fiftyTwoWeekLow: Number(summaryDetail.fiftyTwoWeekLow) || 0,
    currentPrice: Number(price.regularMarketPrice) || 0,
    beta: summaryDetail.beta ?? null,
  } : undefined;

  // ── Parse profile ────────────────────────────────────────────────────
  const profile: YFinanceProfile | undefined = profileRaw.sector ? {
    sector: profileRaw.sector || '',
    industry: profileRaw.industry || '',
    fullTimeEmployees: Number(profileRaw.fullTimeEmployees) || 0,
    longBusinessSummary: profileRaw.longBusinessSummary || '',
    city: profileRaw.city || '',
    state: profileRaw.state || '',
    country: profileRaw.country || '',
    website: profileRaw.website || '',
    address1: profileRaw.address1 || '',
    zip: profileRaw.zip || '',
  } : undefined;

  // ── Parse financials ──────────────────────────────────────────────────
  let financials: YFinanceFinancials | undefined;
  if (income.length >= 1) {
    const latest = income[0];
    const prev = income[1];
    const totalRevenue = Number(latest.totalRevenue?.raw) || 0;
    const prevRevenue = Number(prev?.totalRevenue?.raw) || 0;
    const netIncome = Number(latest.netIncome?.raw) || 0;
    const grossProfit = Number(latest.grossProfit?.raw) || 0;
    const operatingIncome = Number(latest.operatingIncome?.raw) || 0;
    const ebitda = Number(latest.ebitda?.raw) || 0;

    financials = {
      totalRevenue,
      netIncome,
      grossProfit,
      operatingIncome,
      ebitda,
      revenueGrowthYoY: prevRevenue > 0
        ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10
        : 0,
      profitMargins: totalRevenue > 0
        ? Math.round((netIncome / totalRevenue) * 1000) / 10
        : 0,
    };
  }

  // ── 5-year revenue growth ────────────────────────────────────────────
  let fiveYearRevenueGrowth: number | undefined;
  if (income.length >= 5) {
    const latestRev = Number(income[0].totalRevenue?.raw) || 0;
    const fiveYrAgoRev = Number(income[4].totalRevenue?.raw) || 0;
    if (fiveYrAgoRev > 0) {
      const cagr = Math.pow(latestRev / fiveYrAgoRev, 1 / 5) - 1;
      fiveYearRevenueGrowth = Math.round(cagr * 1000) / 10;
    }
  }

  // ── KPIs ─────────────────────────────────────────────────────────────
  const customKpis: Record<string, number | string | boolean> = {};
  if (quote) {
    if (quote.marketCap) customKpis.market_cap_usd = quote.marketCap;
    if (quote.trailingPE !== null) customKpis.pe_ratio_trailing = quote.trailingPE;
    if (quote.forwardPE !== null) customKpis.pe_ratio_forward = quote.forwardPE;
    if (quote.pegRatio !== null) customKpis.peg_ratio = quote.pegRatio;
    if (quote.beta !== null) customKpis.beta = quote.beta;
    if (quote.priceToBook !== null) customKpis.price_to_book = quote.priceToBook;
  }
  if (profile) {
    if (profile.fullTimeEmployees) customKpis.employees_yf = profile.fullTimeEmployees;
    if (profile.sector) customKpis.sector_yf = profile.sector;
    if (profile.industry) customKpis.industry_yf = profile.industry;
  }
  if (financials) {
    customKpis.revenue_ttm_usd = financials.totalRevenue;
    customKpis.net_income_ttm_usd = financials.netIncome;
    customKpis.revenue_growth_yoy_pct = financials.revenueGrowthYoY;
    customKpis.profit_margin_pct = financials.profitMargins;
  }
  if (fiveYearRevenueGrowth !== undefined) {
    customKpis.five_year_revenue_cagr_pct = fiveYearRevenueGrowth;
  }

  return {
    success: !!quote || !!profile,
    quote,
    profile,
    financials,
    fiveYearRevenueGrowth,
    customKpis,
    errors,
  };
}

/**
 * Search for a ticker by company name (uses Yahoo Finance's search endpoint).
 */
export async function yfinanceSearchTicker(query: string): Promise<
  Array<{ ticker: string; exchange: string; name: string; type: string }>
> {
  const path = `/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
  try {
    const data = await yfFetch(path);
    return (data.quotes || [])
      .filter((q: any) => q.quoteType === 'EQUITY')
      .map((q: any) => ({
        ticker: q.symbol,
        exchange: q.exchange,
        name: q.shortname || q.longname || '',
        type: q.quoteType,
      }));
  } catch {
    return [];
  }
}

/**
 * Health check.
 */
export async function yfinanceHealth(): Promise<{ status: 'ok' | 'error'; latencyMs?: number }> {
  const start = Date.now();
  try {
    await yfFetch(`/v8/finance/chart/AAPL?range=1d&interval=1d`);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch {
    return { status: 'error' };
  }
}
