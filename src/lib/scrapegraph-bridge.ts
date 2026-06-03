/**
 * ScrapeGraphAI Bridge — TypeScript Integration Layer
 * ====================================================
 *
 * This module gives ALL agents on the LeadReach platform (and the AI assistant)
 * full access to ScrapeGraphAI's 6 LLM-powered web scraping graph types.
 *
 * How it works:
 *   1. This module calls the ScrapeGraphAI Python FastAPI service
 *      running on localhost:5100
 *   2. The Python service runs the actual scraping graphs
 *   3. Results are returned as structured JSON
 *
 * Graph Types Available:
 *   - SmartScraperGraph      → Single-page, prompt-based extraction
 *   - SearchGraph            → Web search + scrape top N results
 *   - ScriptCreatorGraph     → Generate standalone Python scraping scripts
 *   - SmartScraperMultiGraph → Multi-page, parallel extraction
 *   - ScriptCreatorMultiGraph→ Multi-page script generation
 *   - Auto (generic)         → Auto-selects the best graph type
 *
 * LLM Models:
 *   - glm-4.7-flash  (primary)
 *   - glm-4.6v-flash (secondary fallback)
 *
 * Usage by agents:
 *   import { scrapegraphSmartScraper, scrapegraphSearch } from '@/lib/scrapegraph-bridge';
 *
 *   const result = await scrapegraphSmartScraper({
 *     prompt: 'Extract company name, description, and contact info',
 *     source: 'https://example.com',
 *   });
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ============================================================
// Configuration
// ============================================================

const SCRAPEGRAPH_SERVICE_URL = process.env.SCRAPEGRAPH_SERVICE_URL || 'http://localhost:5100';
const SERVICE_TIMEOUT = 120000; // 2 minutes — scraping can be slow
const PYTHON_BIN = '/home/z/.venv/bin/python3';
const SERVICE_SCRIPT = '/home/z/my-project/scrapegraph-service/server.py';

// ============================================================
// Types
// ============================================================

export type ScrapeGraphType = 'smart' | 'search' | 'multi' | 'script' | 'multi_script';

export interface ScrapeGraphResult<T = unknown> {
  success: boolean;
  data: T | null;
  graphType: string;
  model: string;
  source: string | null;
  elapsedSeconds: number;
  error?: string;
}

export interface SmartScraperOptions {
  prompt: string;
  source: string;
  model?: string;
  headless?: boolean;
  modelTokens?: number;
}

export interface SearchScraperOptions {
  prompt: string;
  source?: string;
  model?: string;
  headless?: boolean;
  modelTokens?: number;
  maxResults?: number;
}

export interface MultiScraperOptions {
  prompt: string;
  sources: string[];
  model?: string;
  headless?: boolean;
  modelTokens?: number;
}

export interface ScriptCreatorOptions {
  prompt: string;
  source: string;
  model?: string;
  headless?: boolean;
  modelTokens?: number;
}

export interface MultiScriptCreatorOptions {
  prompt: string;
  sources: string[];
  model?: string;
  headless?: boolean;
  modelTokens?: number;
}

export interface GenericScrapeOptions {
  prompt: string;
  sources?: string[];
  model?: string;
  headless?: boolean;
  modelTokens?: number;
  graphType?: ScrapeGraphType;
}

export interface ScrapeGraphHealth {
  status: string;
  scrapegraphaiVersion: string;
  modelsAvailable: string[];
  uptimeSeconds: number;
}

// ============================================================
// Service Management
// ============================================================

let serviceProcess: ReturnType<typeof exec> | null = null;
let serviceReady = false;

/**
 * Ensure the ScrapeGraphAI Python service is running.
 * Starts it in the background if not already running.
 */
export async function ensureScrapeGraphService(): Promise<boolean> {
  if (serviceReady) return true;

  // Check if service is already running
  try {
    const response = await fetch(`${SCRAPEGRAPH_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      serviceReady = true;
      console.log('[ScrapeGraphAI] Service already running');
      return true;
    }
  } catch {
    // Service not running — start it
  }

  // Start the Python service
  try {
    console.log('[ScrapeGraphAI] Starting Python service...');
    serviceProcess = exec(
      `${PYTHON_BIN} ${SERVICE_SCRIPT}`,
      {
        timeout: 0, // No timeout — runs indefinitely
        env: {
          ...process.env,
          SCRAPEGRAPH_PORT: '5100',
        },
      },
    );

    serviceProcess.stdout?.on('data', (data: string) => {
      console.log(`[ScrapeGraphAI Service] ${data.trim()}`);
    });

    serviceProcess.stderr?.on('data', (data: string) => {
      console.error(`[ScrapeGraphAI Service] ${data.trim()}`);
    });

    // Wait for service to be ready (up to 15 seconds)
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        const response = await fetch(`${SCRAPEGRAPH_SERVICE_URL}/health`, {
          signal: AbortSignal.timeout(2000),
        });
        if (response.ok) {
          serviceReady = true;
          console.log('[ScrapeGraphAI] Service started successfully');
          return true;
        }
      } catch {
        // Still starting...
      }
    }

    console.error('[ScrapeGraphAI] Service failed to start within 15 seconds');
    return false;
  } catch (error) {
    console.error('[ScrapeGraphAI] Failed to start service:', error);
    return false;
  }
}

/**
 * Check the health of the ScrapeGraphAI service.
 */
export async function scrapegraphHealth(): Promise<ScrapeGraphHealth | null> {
  try {
    const response = await fetch(`${SCRAPEGRAPH_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return await response.json() as ScrapeGraphHealth;
  } catch {
    return null;
  }
}

// ============================================================
// Core API Calls
// ============================================================

/**
 * Internal helper to call the ScrapeGraphAI service.
 */
async function callService<T>(
  endpoint: string,
  body: Record<string, unknown>,
): Promise<ScrapeGraphResult<T>> {
  try {
    // Ensure service is running
    const isReady = await ensureScrapeGraphService();
    if (!isReady) {
      return {
        success: false,
        data: null,
        graphType: endpoint.replace('/', ''),
        model: 'unavailable',
        source: null,
        elapsedSeconds: 0,
        error: 'ScrapeGraphAI service is not available',
      };
    }

    const response = await fetch(`${SCRAPEGRAPH_SERVICE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SERVICE_TIMEOUT),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        data: null,
        graphType: endpoint.replace('/', ''),
        model: body.model as string || 'unknown',
        source: (body.source as string) || null,
        elapsedSeconds: 0,
        error: `Service returned ${response.status}: ${errorText.slice(0, 500)}`,
      };
    }

    const result = await response.json() as ScrapeGraphResult<T>;
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      data: null,
      graphType: endpoint.replace('/', ''),
      model: body.model as string || 'unknown',
      source: (body.source as string) || null,
      elapsedSeconds: 0,
      error: `Service call failed: ${msg.slice(0, 500)}`,
    };
  }
}

// ============================================================
// Public API — All 6 Graph Types + Generic
// ============================================================

/**
 * SmartScraperGraph — Single-page, prompt-based extraction.
 *
 * The most common use case. Provide a URL and a natural-language prompt
 * describing what data you want, and ScrapeGraphAI builds the entire
 * scraping pipeline automatically.
 *
 * Example:
 *   const result = await scrapegraphSmartScraper({
 *     prompt: 'Extract company name, description, founders, and social media links',
 *     source: 'https://scrapegraphai.com/',
 *   });
 */
export async function scrapegraphSmartScraper<T = Record<string, unknown>>(
  options: SmartScraperOptions,
): Promise<ScrapeGraphResult<T>> {
  return callService<T>('/smart-scraper', {
    prompt: options.prompt,
    source: options.source,
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
  });
}

/**
 * SearchGraph — Web search + scrape top N results.
 *
 * Searches the web for the prompt, then scrapes the top results
 * and extracts the requested information.
 *
 * Example:
 *   const result = await scrapegraphSearch({
 *     prompt: 'List all AI startups in Toronto with their websites and descriptions',
 *   });
 */
export async function scrapegraphSearch<T = Record<string, unknown>>(
  options: SearchScraperOptions,
): Promise<ScrapeGraphResult<T>> {
  return callService<T>('/search', {
    prompt: options.prompt,
    source: options.source,
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
    max_results: options.maxResults || 5,
  });
}

/**
 * SmartScraperMultiGraph — Multi-page, parallel extraction.
 *
 * Scrapes multiple URLs in parallel using a single prompt.
 * Great for comparing companies, extracting data from competitor pages, etc.
 *
 * Example:
 *   const result = await scrapegraphMultiScraper({
 *     prompt: 'Extract pricing plans and features',
 *     sources: ['https://company1.com/pricing', 'https://company2.com/pricing'],
 *   });
 */
export async function scrapegraphMultiScraper<T = Record<string, unknown>>(
  options: MultiScraperOptions,
): Promise<ScrapeGraphResult<T>> {
  return callService<T>('/multi-scraper', {
    prompt: options.prompt,
    sources: options.sources,
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
  });
}

/**
 * ScriptCreatorGraph — Generate a standalone Python scraping script.
 *
 * Instead of returning data, this generates a Python script that can
 * be reused to scrape the same page repeatedly without LLM calls.
 *
 * Example:
 *   const result = await scrapegraphScriptCreator({
 *     prompt: 'Extract product names, prices, and ratings',
 *     source: 'https://shop.example.com/products',
 *   });
 */
export async function scrapegraphScriptCreator(
  options: ScriptCreatorOptions,
): Promise<ScrapeGraphResult<string>> {
  return callService<string>('/script-creator', {
    prompt: options.prompt,
    source: options.source,
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
  });
}

/**
 * ScriptCreatorMultiGraph — Generate Python scripts for multiple pages.
 */
export async function scrapegraphMultiScriptCreator(
  options: MultiScriptCreatorOptions,
): Promise<ScrapeGraphResult<string>> {
  return callService<string>('/multi-script-creator', {
    prompt: options.prompt,
    sources: options.sources,
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
  });
}

/**
 * Generic scrape — auto-selects the best graph type.
 *
 * Graph type selection:
 *   - 0 sources → SearchGraph (searches the web)
 *   - 1 source  → SmartScraperGraph
 *   - 2+ sources → SmartScraperMultiGraph
 *   - Override with graphType parameter
 *
 * Example:
 *   const result = await scrapegraphAuto({
 *     prompt: 'Find the top 5 marketing agencies in Toronto',
 *     // No sources → uses SearchGraph
 *   });
 *
 *   const result = await scrapegraphAuto({
 *     prompt: 'Extract company info',
 *     sources: ['https://company.com/about'],
 *     // 1 source → uses SmartScraperGraph
 *   });
 */
export async function scrapegraphAuto<T = Record<string, unknown>>(
  options: GenericScrapeOptions,
): Promise<ScrapeGraphResult<T>> {
  return callService<T>('/scrape', {
    prompt: options.prompt,
    sources: options.sources || [],
    model: options.model || 'glm-4.7-flash',
    headless: options.headless ?? true,
    model_tokens: options.modelTokens || 8192,
    graph_type: options.graphType || null,
  });
}

// ============================================================
// Convenience: Agent-Ready Helper Functions
// ============================================================

/**
 * Extract company information from a website using ScrapeGraphAI.
 * This is the primary use case for Prospect Discovery and Data Enrichment agents.
 *
 * Extracts: company name, description, industry, location, contact info, social links.
 */
export async function scrapegraphExtractCompanyInfo(
  url: string,
): Promise<ScrapeGraphResult<{
  companyName: string;
  description: string;
  industry: string;
  location: string;
  phone: string | null;
  email: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  founded: string | null;
  employees: string | null;
  products: string[];
}>> {
  return scrapegraphSmartScraper({
    prompt: `Extract the following information from this company website:
- Company name
- Company description (2-3 sentences)
- Industry/Sector
- Location (city, country)
- Phone number (if available)
- Email address (if available)
- LinkedIn URL (if available)
- Twitter/X URL (if available)
- Year founded (if available)
- Number of employees or company size (if available)
- Products or services offered (list)

Return the data in JSON format.`,
    source: url,
  });
}

/**
 * Extract key decision makers / team members from a company about page.
 * Useful for outreach-composer and lead-qualification agents.
 */
export async function scrapegraphExtractTeamMembers(
  url: string,
): Promise<ScrapeGraphResult<Array<{
  name: string;
  title: string;
  linkedinUrl: string | null;
  email: string | null;
}>>> {
  return scrapegraphSmartScraper({
    prompt: `Extract all team members/executives listed on this page.
For each person, extract:
- Full name
- Job title/Role
- LinkedIn profile URL (if available)
- Email address (if available)

Return as a JSON array of objects.`,
    source: url,
  });
}

/**
 * Extract pricing information from a pricing page.
 * Useful for competitive intelligence and report generation.
 */
export async function scrapegraphExtractPricing(
  url: string,
): Promise<ScrapeGraphResult<{
  plans: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
}>> {
  return scrapegraphSmartScraper({
    prompt: `Extract all pricing plans/tiers from this page.
For each plan, extract:
- Plan name
- Price (with currency and billing period)
- Key features included

Return as a JSON object with a "plans" array.`,
    source: url,
  });
}

/**
 * Search the web for companies matching criteria using ScrapeGraphAI.
 * Alternative to the existing exaSearch — uses LLM-powered extraction.
 *
 * Useful for prospect-discovery and web-research agents.
 */
export async function scrapegraphDiscoverCompanies(
  query: string,
  industry?: string,
  location?: string,
): Promise<ScrapeGraphResult<Array<{
  companyName: string;
  website: string | null;
  description: string;
  industry: string | null;
  location: string | null;
}>>> {
  const searchPrompt = `Find companies matching: ${query}${industry ? ` in the ${industry} industry` : ''}${location ? ` located in ${location}` : ''}.

For each company, extract:
- Company name
- Website URL
- Brief description
- Industry
- Location (city, country)

Return as a JSON array of company objects.`;

  return scrapegraphSearch({
    prompt: searchPrompt,
    maxResults: 10,
  });
}

/**
 * Scrape multiple competitor websites and compare them.
 * Useful for competitive-intel and report-generator agents.
 */
export async function scrapegraphCompareCompetitors(
  urls: string[],
  extractionPrompt: string,
): Promise<ScrapeGraphResult<Record<string, unknown>>> {
  return scrapegraphMultiScraper({
    prompt: extractionPrompt,
    sources: urls,
  });
}
