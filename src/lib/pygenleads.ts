/**
 * PythonGenLeads Client — TypeScript client for the Sovereign Lead Engine
 * =========================================================================
 *
 * This module provides a typed TypeScript client for the PythonGenLeads
 * FastAPI service running at http://localhost:5310.
 *
 * PythonGenLeads (Sovereign Lead Engine v3.5) provides:
 *   - Website scraping with async HTTP + rate limiting + robots.txt compliance
 *   - Email extraction with regex (blocked domain/extension filtering)
 *   - B2B lead scoring using heuristic keyword analysis (23 business keywords)
 *   - Optional AI scoring via Ollama + Llama 3 (local LLM)
 *   - Content extraction from HTML (BeautifulSoup)
 *   - SSRF protection and URL validation
 *
 * This complements the Exa SDK — Exa finds companies/people, PythonGenLeads
 * scrapes and scores their websites and extracts real emails.
 *
 * Used by agents:
 *   - Prospect Discovery: Score and validate discovered leads
 *   - Data Enrichment: Extract emails from company websites, score content
 *   - Lead Qualification: B2B keyword scoring + heuristic analysis
 *   - Outreach Composer: Extract contact emails from company pages
 */

// ============================================================
// Configuration
// ============================================================

const PYGENLEADS_BASE_URL = process.env.PYGENLEADS_URL || 'http://localhost:5310';
const PYGENLEADS_TIMEOUT = 60000; // 60s for batch URL processing

// ============================================================
// Types
// ============================================================

export interface PyGenLeadsLead {
  company: string;
  service: string;
  score: number; // 0-10
  qualified: boolean;
  url: string;
  domain: string;
  emails: string[];
  method: string; // 'heuristic' | 'ollama' | 'skipped_too_short'
}

export interface PyGenLeadsScoreResult {
  qualified: boolean;
  company: string;
  service: string;
  score: number; // 0-10
  method: string;
  emails: string[];
}

export interface PyGenLeadsDBLead {
  company: string;
  service: string;
  score: number;
  url: string;
  domain: string;
  emails: string[];
  createdAt: string;
}

export interface PyGenLeadsHealth {
  status: string;
  service: string;
  version: string;
}

export interface PyGenLeadsProcessUrlsResult {
  success: boolean;
  processed: number;
  leads: PyGenLeadsLead[];
}

export interface PyGenLeadsProcessUrlResult {
  success: boolean;
  lead: PyGenLeadsLead | null;
  error?: string;
}

export interface PyGenLeadsScoreTextResult {
  success: boolean;
  analysis: PyGenLeadsScoreResult;
}

export interface PyGenLeadsExtractEmailsResult {
  success: boolean;
  emails: string[];
  count: number;
}

export interface PyGenLeadsGetLeadsResult {
  success: boolean;
  leads: PyGenLeadsDBLead[];
  count: number;
}

export interface PyGenLeadsKeywordsResult {
  success: boolean;
  keywords: Record<string, number>;
}

// ============================================================
// Service Status
// ============================================================

let _serviceAvailable: boolean | null = null;
let _lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 30000; // Re-check every 30s

/**
 * Check if the PythonGenLeads service is running and available.
 * Caches result for 30 seconds.
 */
export async function isPyGenLeadsAvailable(): Promise<boolean> {
  const now = Date.now();
  if (_serviceAvailable !== null && now - _lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return _serviceAvailable;
  }

  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    _serviceAvailable = response.ok;
    _lastHealthCheck = now;
    return _serviceAvailable;
  } catch {
    _serviceAvailable = false;
    _lastHealthCheck = now;
    return false;
  }
}

// ============================================================
// API Client Functions
// ============================================================

/**
 * Process a list of URLs: fetch, extract text, analyze, score, extract emails.
 * Returns structured lead data for each URL.
 *
 * @param urls - List of website URLs to process
 * @param maxWorkers - Maximum concurrent workers (default: 5)
 * @returns Processed leads with scores and extracted emails
 *
 * @example
 * const result = await pyGenLeadsProcessUrls(["https://example.com", "https://acme.co"]);
 * // result.leads = [{ company: "Example", score: 6, emails: ["info@example.com"], ... }]
 */
export async function pyGenLeadsProcessUrls(
  urls: string[],
  maxWorkers = 5,
): Promise<PyGenLeadsProcessUrlsResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/process-urls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls, max_workers: maxWorkers }),
      signal: AbortSignal.timeout(PYGENLEADS_TIMEOUT),
    });

    if (!response.ok) {
      console.warn(`[pygenleads] process-urls returned ${response.status}`);
      return { success: false, processed: 0, leads: [] };
    }

    const data = (await response.json()) as PyGenLeadsProcessUrlsResult;
    console.log(`[pygenleads] Processed ${data.processed} URLs, ${data.leads.filter(l => l.qualified).length} qualified`);
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[pygenleads] process-urls failed: ${msg}`);
    return { success: false, processed: 0, leads: [] };
  }
}

/**
 * Process a single URL: fetch, extract text, analyze, score, extract emails.
 * Use this for enrichment — when you need to score a specific company website.
 *
 * @param url - Website URL to process
 * @returns Lead data with score and extracted emails, or null if failed
 *
 * @example
 * const result = await pyGenLeadsProcessUrl("https://acme.co");
 * // result.lead = { company: "Acme", score: 7, emails: ["contact@acme.co"], ... }
 */
export async function pyGenLeadsProcessUrl(
  url: string,
): Promise<PyGenLeadsProcessUrlResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/process-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.warn(`[pygenleads] process-url returned ${response.status}`);
      return { success: false, lead: null, error: `HTTP ${response.status}` };
    }

    const data = (await response.json()) as PyGenLeadsProcessUrlResult;
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[pygenleads] process-url failed: ${msg}`);
    return { success: false, lead: null, error: msg };
  }
}

/**
 * Score text content without fetching. Use this when you already have
 * website content (from Jina Reader, Exa /contents, etc.) and want to
 * score it using PythonGenLeads' B2B heuristic analysis.
 *
 * @param text - Website text content to score
 * @param url - Optional URL for context
 * @returns Score analysis with B2B keywords, qualification, and extracted emails
 *
 * @example
 * const result = await pyGenLeadsScoreText("Acme Corp is a SaaS analytics platform...");
 * // result.analysis = { qualified: true, score: 7, method: "heuristic", emails: [...] }
 */
export async function pyGenLeadsScoreText(
  text: string,
  url = '',
): Promise<PyGenLeadsScoreTextResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/score-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, url }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.warn(`[pygenleads] score-text returned ${response.status}`);
      return {
        success: false,
        analysis: { qualified: false, company: '', service: 'Unknown', score: 0, method: 'error', emails: [] },
      };
    }

    const data = (await response.json()) as PyGenLeadsScoreTextResult;
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[pygenleads] score-text failed: ${msg}`);
    return {
      success: false,
      analysis: { qualified: false, company: '', service: 'Unknown', score: 0, method: 'error', emails: [] },
    };
  }
}

/**
 * Extract emails from text and/or HTML content.
 * Uses PythonGenLeads' regex extraction with blocked domain/extension filtering.
 *
 * @param text - Plain text content
 * @param html - Optional raw HTML content (extracts from both text and HTML)
 * @returns Extracted email addresses
 *
 * @example
 * const result = await pyGenLeadsExtractEmails("Contact us at info@acme.co", "<a href='mailto:sales@acme.co'>");
 * // result.emails = ["info@acme.co", "sales@acme.co"]
 */
export async function pyGenLeadsExtractEmails(
  text: string,
  html = '',
): Promise<PyGenLeadsExtractEmailsResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/extract-emails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, html }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[pygenleads] extract-emails returned ${response.status}`);
      return { success: false, emails: [], count: 0 };
    }

    const data = (await response.json()) as PyGenLeadsExtractEmailsResult;
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[pygenleads] extract-emails failed: ${msg}`);
    return { success: false, emails: [], count: 0 };
  }
}

/**
 * Get scored leads from the PythonGenLeads SQLite database.
 * This returns leads that have been previously processed and scored.
 *
 * @param minScore - Minimum score filter (0-10)
 * @param limit - Maximum number of leads to return
 * @returns Scored leads from the database
 */
export async function pyGenLeadsGetLeads(
  minScore = 0,
  limit = 100,
): Promise<PyGenLeadsGetLeadsResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ min_score: minScore, limit }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[pygenleads] get-leads returned ${response.status}`);
      return { success: false, leads: [], count: 0 };
    }

    const data = (await response.json()) as PyGenLeadsGetLeadsResult;
    return data;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[pygenleads] get-leads failed: ${msg}`);
    return { success: false, leads: [], count: 0 };
  }
}

/**
 * Get the B2B keyword scoring dictionary used by PythonGenLeads.
 * This is useful for understanding how leads are scored.
 *
 * @returns Dictionary of B2B keywords and their weights
 */
export async function pyGenLeadsGetKeywords(): Promise<PyGenLeadsKeywordsResult> {
  try {
    const response = await fetch(`${PYGENLEADS_BASE_URL}/keywords`, {
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return { success: false, keywords: {} };
    }

    return (await response.json()) as PyGenLeadsKeywordsResult;
  } catch {
    return { success: false, keywords: {} };
  }
}
