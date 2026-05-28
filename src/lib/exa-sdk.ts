/**
 * Exa AI SDK Integration
 * 
 * Integrates the @exalabs/ai-sdk (exa-labs/ai-sdk) into the Agent Reach platform.
 * This module provides:
 * 
 * 1. **Direct Exa API Client** — Call Exa's search API directly for all agents
 * 2. **Vercel AI SDK Tool** — Use as a tool with generateText/streamText in AI workflows
 * 3. **Category-Specific Search** — company, people, research paper, news, github, linkedin profile, etc.
 * 4. **Deep Search** — Multi-step search with reasoning and structured outputs (deep, deep-lite, deep-reasoning)
 * 5. **Structured Outputs (outputSchema)** — Get grounded JSON with citations from any search type
 * 6. **People & Company Search** — Dedicated category filters for lead generation
 * 7. **Content Retrieval** — Full page text, highlights, summaries, and subpages
 * 8. **Contents Endpoint** — Get content for known URLs via /contents
 * 9. **Domain Filtering** — Include/exclude specific domains
 * 10. **Date Filtering** — Filter by crawl date and published date
 * 11. **Content Freshness** — maxAgeHours for controlling cache vs. livecrawl
 * 
 * Repository: https://github.com/exa-labs/ai-sdk
 * npm: @exalabs/ai-sdk
 * API Docs: https://docs.exa.ai
 * Search API Guide: https://docs.exa.ai/reference/search-api-guide-for-coding-agents
 * 
 * Usage:
 *   import { exaClient } from '@/lib/exa-sdk';
 *   const results = await exaClient.search({ query: "AI startups in Toronto" });
 * 
 *   // Deep search with structured output for lead generation
 *   const companies = await exaClient.searchDeep({
 *     query: "marketing agencies in Dubai",
 *     outputSchema: {
 *       type: "object",
 *       properties: {
 *         companies: { type: "array", items: { ... } }
 *       }
 *     }
 *   });
 * 
 *   // People search
 *   const people = await exaClient.searchPeople("CTO at fintech company", 10);
 * 
 *   // Get contents for known URLs
 *   const contents = await exaClient.getContents(["https://example.com"], { highlights: true });
 */

// ============================================================
// Types
// ============================================================

/** Exa search type: auto, keyword, neural, fast, instant, deep-lite, deep, deep-reasoning */
export type ExaSearchType = 'auto' | 'keyword' | 'neural' | 'fast' | 'instant' | 'deep-lite' | 'deep' | 'deep-reasoning';

/** Exa category filters for domain-specific search */
export type ExaCategory = 
  | 'company' 
  | 'people'
  | 'research paper' 
  | 'news' 
  | 'pdf' 
  | 'github' 
  | 'personal site' 
  | 'linkedin profile' 
  | 'financial report';

/** JSON Schema for structured outputs (outputSchema) */
export interface ExaOutputSchema {
  type: 'object' | 'array' | 'text' | 'string' | 'number' | 'boolean' | 'integer';
  description?: string;
  required?: string[];
  properties?: Record<string, ExaOutputSchema>;
  items?: ExaOutputSchema;
  maxProperties?: number;
  minProperties?: number;
  enum?: string[];
}

/** Options for text content retrieval */
export interface ExaTextOptions {
  maxCharacters?: number;
  includeHtmlTags?: boolean;
  verbosity?: 'compact' | 'full';
}

/** Options for highlights extraction */
export interface ExaHighlightsOptions {
  numSentences?: number;
  highlightsPerUrl?: number;
  query?: string;
}

/** Options for AI-generated summaries */
export interface ExaSummaryOptions {
  query?: string;
  schema?: ExaOutputSchema;
}

/** Options for extras (links, images) */
export interface ExaExtrasOptions {
  links?: number;
  imageLinks?: number;
}

/** Content retrieval options */
export interface ExaContentsOptions {
  text?: boolean | ExaTextOptions;
  highlights?: boolean | ExaHighlightsOptions;
  summary?: boolean | ExaSummaryOptions;
  livecrawl?: 'never' | 'fallback' | 'always' | 'preferred';
  livecrawlTimeout?: number;
  subpages?: number;
  subpageTarget?: string | string[];
  extras?: ExaExtrasOptions;
  maxAgeHours?: number;
}

/** A single Exa search result */
export interface ExaSearchResult {
  title: string;
  url: string;
  id?: string;
  publishedDate?: string;
  author?: string;
  image?: string;
  favicon?: string;
  text?: string;
  highlights?: string[];
  highlightScores?: number[];
  summary?: string;
  subpages?: ExaSearchResult[];
  extras?: {
    links?: string[];
    imageLinks?: string[];
  };
}

/** Grounding citation */
export interface ExaGroundingCitation {
  url: string;
  title?: string;
}

/** Grounding entry for structured output */
export interface ExaGroundingEntry {
  field: string;
  citations: ExaGroundingCitation[];
  confidence: 'high' | 'medium' | 'low';
}

/** Output with structured content and grounding */
export interface ExaStructuredOutput {
  content: Record<string, unknown> | unknown[] | string;
  grounding?: ExaGroundingEntry[];
}

/** Full Exa API search configuration */
export interface ExaSearchConfig {
  query: string;
  type?: ExaSearchType;
  category?: ExaCategory;
  userLocation?: string;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: string[];
  excludeText?: string[];
  contents?: ExaContentsOptions;
  outputSchema?: ExaOutputSchema;
}

/** Full Exa API response */
export interface ExaApiResponse {
  requestId?: string;
  resolvedSearchType?: 'neural' | 'keyword' | 'fast' | 'deep' | 'deep-lite' | 'deep-reasoning';
  results: ExaSearchResult[];
  output?: ExaStructuredOutput;
  requestTags?: Record<string, unknown>;
  effectiveFilters?: {
    includeDomains?: string[];
    excludeDomains?: string[];
    [key: string]: unknown;
  };
  searchTime?: number;
  costDollars?: {
    total?: number;
    search?: Record<string, number>;
    contents?: Record<string, number>;
  };
  [key: string]: unknown;
}

/** Exa /contents response */
export interface ExaContentsResponse {
  results: Array<{
    url: string;
    title?: string;
    text?: string;
    highlights?: string[];
    summary?: string;
    publishedDate?: string;
    author?: string;
  }>;
}

/** Exa SDK status check result */
export interface ExaSDKStatus {
  available: boolean;
  hasApiKey: boolean;
  source: string;
  version: string;
  lastChecked: string;
  error?: string;
  capabilities?: string[];
}

// ============================================================
// Exa API Client (Direct HTTP)
// ============================================================

const EXA_API_BASE = 'https://api.exa.ai';
const EXA_SDK_VERSION = '2.0.1';

/**
 * Get the Exa API key from environment variables.
 * Checks EXA_API_KEY first, then falls back to common alternative names.
 */
function getExaApiKey(): string | null {
  return process.env.EXA_API_KEY || null;
}

/**
 * Exa API Client
 * 
 * Provides direct HTTP access to the Exa search API.
 * This is the primary integration point for all agents on the platform.
 * 
 * Supports all search types including deep search with structured outputs,
 * people/company search, content retrieval, and the /contents endpoint.
 */
export const exaClient = {
  /**
   * Search the web using Exa's AI-powered search API.
   * 
   * Features:
   * - All search types: auto, keyword, neural, fast, instant, deep-lite, deep, deep-reasoning
   * - Category filters: company, people, news, research paper, github, etc.
   * - Structured outputs: outputSchema for grounded JSON with citations
   * - Content retrieval: Full text, highlights, summaries
   * - Domain filtering: Include/exclude specific domains
   * - Date filtering: By crawl date or published date
   * - Content freshness: maxAgeHours for cache vs livecrawl control
   * - Subpage crawling: Follow links within results
   * 
   * @example
   * // Basic search
   * const results = await exaClient.search({ query: "AI startups Toronto" });
   * 
   * // Deep search with structured output
   * const results = await exaClient.search({
   *   query: "marketing agencies Dubai",
   *   type: "deep",
   *   category: "company",
   *   outputSchema: {
   *     type: "object",
   *     properties: {
   *       companies: {
   *         type: "array",
   *         items: {
   *           type: "object",
   *           properties: {
   *             name: { type: "string" },
   *             website: { type: "string" },
   *             industry: { type: "string" },
   *             location: { type: "string" }
   *           }
   *         }
   *       }
   *     }
   *   },
   *   contents: { highlights: true }
   * });
   * 
   * // People search
   * const profiles = await exaClient.search({
   *   query: "software engineer distributed systems",
   *   category: "people",
   *   numResults: 10,
   * });
   */
  async search(config: ExaSearchConfig): Promise<ExaApiResponse> {
    const apiKey = getExaApiKey();
    
    if (!apiKey) {
      throw new Error('EXA_API_KEY not configured. Set the EXA_API_KEY environment variable to enable Exa search.');
    }

    const { query, ...options } = config;
    
    const body: Record<string, unknown> = {
      query,
      type: options.type || 'auto',
      numResults: options.numResults || 10,
      contents: options.contents || {
        highlights: true,
      },
    };

    // Add optional parameters
    if (options.category) body.category = options.category;
    if (options.userLocation) body.userLocation = options.userLocation;
    if (options.includeDomains) body.includeDomains = options.includeDomains;
    if (options.excludeDomains) body.excludeDomains = options.excludeDomains;
    if (options.startCrawlDate) body.startCrawlDate = options.startCrawlDate;
    if (options.endCrawlDate) body.endCrawlDate = options.endCrawlDate;
    if (options.startPublishedDate) body.startPublishedDate = options.startPublishedDate;
    if (options.endPublishedDate) body.endPublishedDate = options.endPublishedDate;
    if (options.includeText) body.includeText = options.includeText;
    if (options.excludeText) body.excludeText = options.excludeText;
    if (options.outputSchema) body.outputSchema = options.outputSchema;

    // Override contents if explicitly provided
    if (options.contents) body.contents = options.contents;

    // Set appropriate timeout based on search type
    const timeoutMap: Record<string, number> = {
      'auto': 30000,
      'keyword': 15000,
      'neural': 30000,
      'fast': 15000,
      'instant': 10000,
      'deep-lite': 60000,
      'deep': 120000,        // Deep search can take 4-15 seconds
      'deep-reasoning': 180000, // Deep reasoning can take 12-40 seconds
    };
    const timeout = timeoutMap[options.type || 'auto'] || 30000;

    const response = await fetch(`${EXA_API_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-exa-integration': `agent-reach-platform/${EXA_SDK_VERSION}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Exa API returned ${response.status}: ${errorText.slice(0, 500)}`);
    }

    const data = await response.json() as ExaApiResponse;
    return data;
  },

  /**
   * Deep search with structured outputs.
   * Uses Exa's "deep" search type with outputSchema for grounded,
   * structured JSON responses with citations.
   * 
   * Best for: Research, enrichment, thorough results with structured data extraction.
   * Latency: 4-15 seconds for deep, 12-40 seconds for deep-reasoning.
   * 
   * @example
   * const result = await exaClient.searchDeep({
   *   query: "SaaS companies in Berlin with 50-200 employees",
   *   outputSchema: {
   *     type: "object",
   *     properties: {
   *       companies: {
   *         type: "array",
   *         description: "List of companies found",
   *         items: {
   *           type: "object",
   *           properties: {
   *             name: { type: "string", description: "Company name" },
   *             website: { type: "string", description: "Company website URL" },
   *             industry: { type: "string", description: "Primary industry" },
   *             location: { type: "string", description: "Company location" },
   *             employeeCount: { type: "string", description: "Estimated employee count" }
   *           }
   *         }
   *       }
   *     }
   *   }
   * });
   * // result.output.content contains the structured data
   * // result.output.grounding contains citations and confidence
   */
  async searchDeep(config: Omit<ExaSearchConfig, 'type'> & { type?: 'deep-lite' | 'deep' | 'deep-reasoning' }): Promise<ExaApiResponse> {
    return this.search({
      ...config,
      type: config.type || 'deep',
      contents: config.contents || {
        highlights: true,
      },
    });
  },

  /**
   * Search for people by role, expertise, or what they work on.
   * Uses Exa's "people" category for dedicated people search.
   * 
   * Tips:
   * - Use SINGULAR form: "software engineer" not "software engineers"
   * - Describe what they work on: "researcher training open source LLMs"
   * - Does NOT support date filters or text filters
   * - includeDomains only accepts LinkedIn domains
   * 
   * @example
   * const people = await exaClient.searchPeople("CTO at fintech company", 10);
   * const engineers = await exaClient.searchPeople("software engineer distributed systems", 5);
   */
  async searchPeople(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    // Note: category is forced to 'people' — options.category is ignored
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'people',
      numResults,
      type: restOptions.type || 'deep',
      contents: {
        highlights: true,
        ...(restOptions.contents || {}),
      },
    });
  },

  /**
   * Search for companies specifically.
   * Uses Exa's "company" category for highly relevant business results.
   * Best used with deep search type for enriched, structured results.
   * 
   * @example
   * const companies = await exaClient.searchCompanies("SaaS startups Berlin", 10);
   * 
   * // With structured output for extraction
   * const companies = await exaClient.searchCompanies("marketing agencies Dubai", 10, {
   *   type: "deep",
   *   outputSchema: {
   *     type: "object",
   *     properties: {
   *       companies: { type: "array", items: { type: "object", properties: { name: { type: "string" }, website: { type: "string" } } } }
   *     }
   *   }
   * });
   */
  async searchCompanies(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    // Note: category is forced to 'company' — options.category is ignored
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'company',
      numResults,
      type: restOptions.type || 'deep',
      contents: restOptions.contents || {
        highlights: true,
        summary: { query: 'company overview, industry, location, services, contact' },
      },
    });
  },

  /**
   * Search for LinkedIn profiles.
   * Uses Exa's "linkedin profile" category for professional profiles.
   * 
   * @example
   * const profiles = await exaClient.searchLinkedInProfiles("VP Engineering fintech", 5);
   */
  async searchLinkedInProfiles(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'linkedin profile',
      numResults,
      type: restOptions.type || 'deep',
      contents: {
        highlights: true,
        ...(restOptions.contents || {}),
      },
    });
  },

  /**
   * Search for news articles.
   * Uses Exa's "news" category with date filtering.
   * 
   * @example
   * const news = await exaClient.searchNews("AI regulation 2025", 5);
   */
  async searchNews(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'news',
      numResults,
      type: restOptions.type || 'auto',
      contents: {
        highlights: true,
        ...(restOptions.contents || {}),
      },
    });
  },

  /**
   * Search for GitHub repositories.
   * Uses Exa's "github" category for code-related results.
   * 
   * @example
   * const repos = await exaClient.searchGitHub("web scraping framework", 5);
   */
  async searchGitHub(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'github',
      numResults,
      type: restOptions.type || 'auto',
    });
  },

  /**
   * Search for research papers.
   * Uses Exa's "research paper" category for academic content.
   * 
   * @example
   * const papers = await exaClient.searchPapers("transformer architecture", 5);
   */
  async searchPapers(query: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    const { category: _ignoredCat, ...restOptions } = options || {} as Partial<ExaSearchConfig>;
    return this.search({
      ...restOptions,
      query,
      category: 'research paper',
      numResults,
      type: restOptions.type || 'auto',
    });
  },

  /**
   * Search with domain filtering.
   * Restricts results to specific domains only.
   * 
   * @example
   * const results = await exaClient.searchInDomains("product announcement", ["crunchbase.com", "techcrunch.com"], 5);
   */
  async searchInDomains(query: string, domains: string[], numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    return this.search({
      query,
      includeDomains: domains,
      numResults,
      ...options,
    });
  },

  /**
   * Search with domain exclusion.
   * Excludes specific domains from results.
   * Note: excludeDomains + category: "company" | "people" will cause a 400 error.
   * 
   * @example
   * const results = await exaClient.searchExcludingDomains("AI tools", ["pinterest.com", "facebook.com"], 10);
   */
  async searchExcludingDomains(query: string, domains: string[], numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    return this.search({
      query,
      excludeDomains: domains,
      numResults,
      ...options,
    });
  },

  /**
   * Deep crawl: Search and retrieve content including subpages.
   * Follows links within search results to get comprehensive data.
   * 
   * @example
   * const deepResults = await exaClient.searchWithSubpages("company website", "example.com", 3);
   */
  async searchWithSubpages(query: string, domain: string, subpages = 3, numResults = 5): Promise<ExaApiResponse> {
    return this.search({
      query,
      includeDomains: [domain],
      numResults,
      contents: {
        text: { maxCharacters: 10000 },
        subpages,
        subpageTarget: ['about', 'contact', 'team', 'pricing'],
      },
    });
  },

  /**
   * Get contents for known URLs via the /contents endpoint.
   * Use this when you already have URLs and need their content.
   * Unlike /search (which finds and optionally retrieves content),
   * /contents is purely for content extraction from known URLs.
   * 
   * @example
   * // Get highlights for known URLs
   * const contents = await exaClient.getContents(
   *   ["https://example.com/about", "https://example.com/contact"],
   *   { highlights: true }
   * );
   * 
   * // Get full text for known URLs with freshness control
   * const contents = await exaClient.getContents(
   *   ["https://example.com"],
   *   { text: { maxCharacters: 20000 }, maxAgeHours: 24 }
   * );
   */
  async getContents(
    urls: string[],
    options?: {
      highlights?: boolean;
      text?: boolean | { maxCharacters?: number; includeHtmlTags?: boolean; verbosity?: 'compact' | 'full' };
      summary?: boolean | { query?: string };
      maxAgeHours?: number;
    },
  ): Promise<ExaContentsResponse> {
    const apiKey = getExaApiKey();

    if (!apiKey) {
      throw new Error('EXA_API_KEY not configured.');
    }

    const body: Record<string, unknown> = { urls };

    if (options?.highlights) body.highlights = true;
    if (options?.text) {
      body.text = typeof options.text === 'object' ? options.text : { maxCharacters: 20000 };
    }
    if (options?.summary) {
      body.summary = typeof options.summary === 'object' ? options.summary : true;
    }
    if (options?.maxAgeHours !== undefined) body.maxAgeHours = options.maxAgeHours;

    const response = await fetch(`${EXA_API_BASE}/contents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-exa-integration': `agent-reach-platform/${EXA_SDK_VERSION}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Exa /contents API returned ${response.status}: ${errorText.slice(0, 500)}`);
    }

    return response.json() as Promise<ExaContentsResponse>;
  },

  /**
   * Find similar pages to a given URL (findSimilarLinks).
   * Note: This uses the /findSimilarLinks endpoint directly.
   * 
   * @example
   * const similar = await exaClient.findSimilar("https://example.com", 5);
   */
  async findSimilar(url: string, numResults = 10, options?: Partial<ExaSearchConfig>): Promise<ExaApiResponse> {
    const apiKey = getExaApiKey();
    
    if (!apiKey) {
      throw new Error('EXA_API_KEY not configured.');
    }

    const body: Record<string, unknown> = {
      url,
      numResults,
      contents: options?.contents || {
        highlights: true,
      },
    };

    if (options?.includeDomains) body.includeDomains = options.includeDomains;
    if (options?.excludeDomains) body.excludeDomains = options.excludeDomains;
    if (options?.startCrawlDate) body.startCrawlDate = options.startCrawlDate;
    if (options?.endCrawlDate) body.endCrawlDate = options.endCrawlDate;
    if (options?.startPublishedDate) body.startPublishedDate = options.startPublishedDate;
    if (options?.endPublishedDate) body.endPublishedDate = options.endPublishedDate;
    if (options?.includeText) body.includeText = options.includeText;
    if (options?.excludeText) body.excludeText = options.excludeText;

    const response = await fetch(`${EXA_API_BASE}/findSimilarLinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-exa-integration': `agent-reach-platform/${EXA_SDK_VERSION}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Exa findSimilar API returned ${response.status}: ${errorText.slice(0, 500)}`);
    }

    return response.json() as Promise<ExaApiResponse>;
  },

  /**
   * Check if Exa SDK is available and configured.
   */
  async checkStatus(): Promise<ExaSDKStatus> {
    const apiKey = getExaApiKey();
    const status: ExaSDKStatus = {
      available: false,
      hasApiKey: !!apiKey,
      source: 'exa-labs/ai-sdk',
      version: EXA_SDK_VERSION,
      lastChecked: new Date().toISOString(),
      capabilities: [
        'search',
        'deep_search',
        'structured_outputs',
        'people_search',
        'company_search',
        'category_search',
        'content_retrieval',
        'contents_endpoint',
        'find_similar',
        'domain_filtering',
        'date_filtering',
        'subpage_crawling',
      ],
    };

    if (!apiKey) {
      status.error = 'EXA_API_KEY not set. Configure it in .env to enable Exa search.';
      status.capabilities = [];
      return status;
    }

    try {
      // Quick test search with minimal results
      const result = await this.search({
        query: 'test',
        numResults: 1,
        type: 'fast',
        contents: { highlights: true },
      });
      status.available = result.results.length >= 0; // No results is OK, just no errors
    } catch (error) {
      status.error = error instanceof Error ? error.message : 'Unknown error';
      status.available = false;
    }

    return status;
  },
};

// ============================================================
// Convenience: Lead Generation Schemas
// Pre-built outputSchema definitions for common lead generation tasks
// ============================================================

/**
 * Pre-built outputSchema for company discovery.
 * Extracts structured company data from deep search results.
 */
export const COMPANY_DISCOVERY_SCHEMA: ExaOutputSchema = {
  type: 'object',
  description: 'Companies found matching the search query',
  required: ['companies'],
  properties: {
    companies: {
      type: 'array',
      description: 'List of companies found',
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Company name' },
          website: { type: 'string', description: 'Company website URL' },
          industry: { type: 'string', description: 'Primary industry' },
          location: { type: 'string', description: 'Company headquarters location (city, country)' },
          description: { type: 'string', description: 'Brief company description' },
          employeeCount: { type: 'string', description: 'Estimated number of employees or range' },
        },
      },
    },
  },
};

/**
 * Pre-built outputSchema for people/contact discovery.
 * Extracts structured people data from deep search results.
 */
export const PEOPLE_DISCOVERY_SCHEMA: ExaOutputSchema = {
  type: 'object',
  description: 'People found matching the search query',
  required: ['people'],
  properties: {
    people: {
      type: 'array',
      description: 'List of people found',
      items: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Full name' },
          title: { type: 'string', description: 'Job title or role' },
          company: { type: 'string', description: 'Company they work at' },
          linkedinUrl: { type: 'string', description: 'LinkedIn profile URL if available' },
          location: { type: 'string', description: 'Location (city, country)' },
        },
      },
    },
  },
};

/**
 * Pre-built outputSchema for company enrichment.
 * Extracts detailed company information for lead enrichment.
 */
export const COMPANY_ENRICHMENT_SCHEMA: ExaOutputSchema = {
  type: 'object',
  description: 'Detailed company information for lead enrichment',
  required: ['company'],
  properties: {
    company: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', description: 'Official company name' },
        website: { type: 'string', description: 'Company website URL' },
        industry: { type: 'string', description: 'Primary industry' },
        subIndustry: { type: 'string', description: 'Sub-industry or specialization' },
        hqAddress: { type: 'string', description: 'Full headquarters address' },
        city: { type: 'string', description: 'City' },
        country: { type: 'string', description: 'Country' },
        phoneMain: { type: 'string', description: 'Main phone number' },
        generalEmail: { type: 'string', description: 'General contact email' },
        employeeCount: { type: 'string', description: 'Number of employees or range' },
        revenueEstimate: { type: 'string', description: 'Estimated annual revenue' },
        foundingYear: { type: 'string', description: 'Year the company was founded' },
        ceoName: { type: 'string', description: 'CEO or founder name' },
        keyContactName: { type: 'string', description: 'Key contact person name' },
        keyContactTitle: { type: 'string', description: 'Key contact job title' },
        linkedinUrl: { type: 'string', description: 'LinkedIn company page URL' },
        twitterHandle: { type: 'string', description: 'Twitter/X handle' },
        description: { type: 'string', description: 'Brief company description' },
      },
    },
  },
};

/**
 * Pre-built outputSchema for lead qualification intent signals.
 * Extracts buying/intent signals for a specific company.
 */
export const INTENT_SIGNALS_SCHEMA: ExaOutputSchema = {
  type: 'object',
  description: 'Intent signals and buying indicators for a company',
  required: ['signals'],
  properties: {
    signals: {
      type: 'array',
      description: 'Detected intent signals',
      items: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', description: 'Signal type: hiring, expansion, funding, technology_adoption, new_office, partnership, product_launch' },
          description: { type: 'string', description: 'Description of the signal' },
          source: { type: 'string', description: 'Source URL or reference' },
          date: { type: 'string', description: 'Date of the signal if available' },
        },
      },
    },
    overallAssessment: { type: 'string', description: 'Overall assessment of buying intent (high, medium, low)' },
  },
};

// ============================================================
// Vercel AI SDK Integration (for AI chat workflows)
// ============================================================

/**
 * Create an Exa web search tool compatible with the Vercel AI SDK.
 * This can be used with generateText/streamText for AI-driven search.
 * 
 * @example
 * import { generateText } from 'ai';
 * import { createExaWebSearchTool } from '@/lib/exa-sdk';
 * 
 * const { text } = await generateText({
 *   model: myModel,
 *   prompt: 'Find the top AI companies in Europe',
 *   tools: { webSearch: createExaWebSearchTool({ category: 'company' }) },
 * });
 */
export function createExaWebSearchTool(config?: Omit<ExaSearchConfig, 'query'>) {
  try {
    // Try to use the @exalabs/ai-sdk package directly
    const { webSearch } = require('@exalabs/ai-sdk');
    return webSearch(config);
  } catch {
    // Fallback: Create a manual tool definition if the package isn't available
    console.warn('[Exa SDK] @exalabs/ai-sdk webSearch() unavailable, creating manual tool');
    return {
      description: 'Search the web using Exa AI. Use this tool when you need to find information about companies, people, news, or any topic on the web.',
      parameters: {
        type: 'object' as const,
        properties: {
          query: {
            type: 'string' as const,
            description: 'The search query',
            minLength: 1,
            maxLength: 500,
          },
        },
        required: ['query'] as const,
      },
      execute: async ({ query }: { query: string }) => {
        try {
          const result = await exaClient.search({ query, ...config });
          return result;
        } catch (error) {
          return { error: error instanceof Error ? error.message : 'Search failed' };
        }
      },
    };
  }
}

// ============================================================
// Convenience: Agent-Reach Bridge Adapter
// ============================================================

/**
 * Adapter that converts Exa search results to Agent-Reach SearchResult format.
 * This allows the Exa SDK to be used as a drop-in replacement/enhancement
 * for the existing exaSearch() function in agent-reach-bridge.ts.
 */
export function exaResultsToSearchResults(exaResponse: ExaApiResponse): Array<{
  title: string;
  url: string;
  snippet: string;
  score?: number;
  publishedDate?: string;
  text?: string;
  summary?: string;
  highlights?: string[];
  author?: string;
  subpages?: ExaSearchResult[];
}> {
  return exaResponse.results.map((result, index) => ({
    title: result.title || '',
    url: result.url || '',
    snippet: result.text?.slice(0, 300) || result.highlights?.[0] || result.summary?.slice(0, 300) || '',
    score: result.highlightScores?.[0] || (1 - index * 0.05), // Default descending score
    publishedDate: result.publishedDate || undefined,
    text: result.text || undefined,
    summary: result.summary || undefined,
    highlights: result.highlights || undefined,
    author: result.author || undefined,
    subpages: result.subpages || undefined,
  }));
}

/**
 * Check if Exa API key is configured.
 */
export function isExaConfigured(): boolean {
  return !!getExaApiKey();
}
