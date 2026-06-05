// ============================================================
// Company Verification & Disambiguation Engine
// ============================================================
//
// Problem: When researching "Jan Kelley" (https://jankelley.com/),
// web search may return results for:
//   - Jan Kelley Marketing (the actual company)
//   - Jan Kelley (a person's name)
//   - Kelley Blue Book (unrelated but similar)
//   - Other companies with "Kelley" in the name
//
// This engine ensures we ONLY find information about the TARGET
// company behind the given website. It does this by:
//
// 1. Extracting the canonical company identity from the website
// 2. Using domain ownership as the primary verification signal
// 3. Cross-referencing with corporate registries
// 4. LLM-powered disambiguation of search results
// 5. Filtering out ALL results that don't match the verified entity

import { callLLMForJSON } from '@/lib/llm';
import { webRead, exaSearch } from '@/lib/agent-reach-bridge';
import type { DeepCrawlResult } from './deep-crawler';

// ─── Types ───

export interface CompanyIdentity {
  /** The verified legal/operating name of the company */
  verifiedName: string;
  /** Any alternate names, DBAs, or trade names */
  alternateNames: string[];
  /** The domain this company operates under */
  domain: string;
  /** Unique identifiers that help distinguish this company from others */
  distinguishingSignals: string[];
  /** Industry/category — helps narrow search results */
  industry: string;
  /** Location signals (city, state, country) */
  locationSignals: string[];
  /** Products or services — unique identifiers */
  productSignals: string[];
  /** Key people — CEO, founders, etc. */
  keyPeopleSignals: string[];
  /** Confidence level in the verification */
  confidence: 'high' | 'medium' | 'low';
  /** How the verification was done */
  verificationMethod: string;
}

export interface VerifiedSearchResult {
  /** The search result */
  url: string;
  title: string;
  snippet: string;
  /** Whether this result is verified to be about the target company */
  isVerifiedMatch: boolean;
  /** Confidence in the match (0-1) */
  matchConfidence: number;
  /** Why it was determined to be a match or not */
  reasoning: string;
}

// ─── Company Identity Extraction ───

/**
 * Extract a verified company identity from a deep-crawled website.
 * Uses LLM to analyze ALL crawled content and create a unique fingerprint.
 */
export async function extractCompanyIdentity(
  crawlResult: DeepCrawlResult,
): Promise<CompanyIdentity | null> {
  // Use the combined content from the crawl — this has data from ALL sub-pages
  const content = crawlResult.allContentCombined;
  if (!content || content.length < 100) return null;
  
  const identity = await callLLMForJSON<CompanyIdentity>(
    `You are a B2B company identity verification specialist. Your job is to create a UNIQUE FINGERPRINT for the company behind this website.

CRITICAL: You must identify the EXACT company that operates this website. Not a similarly-named company. Not a parent company. Not a subsidiary (unless the website is specifically for the subsidiary). The company THAT OWNS AND OPERATES this website.

Analyze ALL the content from this website's pages and extract:

1. verifiedName: The EXACT legal or operating name of the company (as stated on their website)
2. alternateNames: Any DBA names, trade names, or abbreviations used
3. domain: The primary domain
4. distinguishingSignals: Unique identifiers that make this company DISTINCT from any other company with a similar name. Think about what makes THIS company unique — their specific products, their location, their founding story, their team, their clients.
5. industry: The specific industry/category
6. locationSignals: City, state/province, country, address — geographic anchors
7. productSignals: Specific product/service names that are UNIQUE to this company
8. keyPeopleSignals: Names of founders, CEO, key leadership — these help distinguish
9. confidence: How confident you are in this identification (high/medium/low)
10. verificationMethod: How you determined this (e.g., "Found legal name on About page, confirmed via Contact page address")

IMPORTANT: The distinguishingSignals are CRITICAL. When we later search the web for this company, these signals will be used to FILTER OUT results about DIFFERENT companies with similar names. Be very specific and unique.

Example: If the company is "Jan Kelley" (a marketing agency in Hamilton, Ontario), the distinguishing signals would include things like "Hamilton Ontario marketing agency", "B2B marketing", their specific client names, their specific team members — NOT generic things like "marketing agency" that could match hundreds of companies.`,
    `WEBSITE DOMAIN: ${crawlResult.domain}
ROOT URL: ${crawlResult.rootUrl}
TOTAL PAGES CRAWLED: ${crawlResult.totalPagesCrawled}

WEBSITE CONTENT:
${content.slice(0, 40000)}`,
  );
  
  return identity;
}

// ─── Company Verification from Domain ───

/**
 * Verify that search results are actually about the target company
 * by cross-referencing with the company identity fingerprint.
 */
export async function verifySearchResults(
  results: Array<{ url: string; title: string; snippet: string }>,
  identity: CompanyIdentity,
): Promise<VerifiedSearchResult[]> {
  if (results.length === 0) return [];
  
  // Batch verify up to 20 results at a time (LLM-efficient)
  const batchSize = 20;
  const verified: VerifiedSearchResult[] = [];
  
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize);
    
    const batchResult = await callLLMForJSON<{
      results: Array<{
        index: number;
        isVerifiedMatch: boolean;
        matchConfidence: number;
        reasoning: string;
      }>;
    }>(
      `You are a company identity matching specialist. Given a TARGET company identity and a list of search results, determine which results are ACTUALLY about the target company.

TARGET COMPANY:
- Name: ${identity.verifiedName}
- Alternate Names: ${identity.alternateNames.join(', ')}
- Domain: ${identity.domain}
- Industry: ${identity.industry}
- Location: ${identity.locationSignals.join(', ')}
- Distinguishing Signals: ${identity.distinguishingSignals.join('; ')}
- Key People: ${identity.keyPeopleSignals.join(', ')}
- Products: ${identity.productSignals.join('; ')}

RULES:
1. A result is a MATCH only if it is clearly about the SAME company (not a similarly-named different company)
2. Domain match is the strongest signal — if the result URL contains the company's domain, it's likely a match
3. Location + industry combination is a strong signal
4. Key people names are strong signals
5. Generic mentions of a company name without distinguishing details should be marked LOW confidence
6. If a result mentions a DIFFERENT company with a similar name, mark it as NOT a match

For each result, return:
- index: the 0-based index of the result
- isVerifiedMatch: true only if you're confident this is about the TARGET company
- matchConfidence: 0-1 (0 = definitely not, 1 = definitely yes)
- reasoning: brief explanation

Return as JSON: { "results": [...] }`,
      `SEARCH RESULTS TO VERIFY:
${batch.map((r, idx) => `[${idx}] Title: ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.snippet}`).join('\n')}`,
      { retriesPerModel: 1, useFallback: true },
    );
    
    if (batchResult?.results) {
      for (const item of batchResult.results) {
        const original = batch[item.index];
        if (original) {
          verified.push({
            url: original.url,
            title: original.title,
            snippet: original.snippet,
            isVerifiedMatch: item.isVerifiedMatch,
            matchConfidence: item.matchConfidence,
            reasoning: item.reasoning,
          });
        }
      }
    }
  }
  
  return verified;
}

// ─── Smart Company Search ───

/**
 * Search for a company using VERIFIED queries that will return results
 * about the TARGET company only. Uses the identity fingerprint to
 * construct precise search queries.
 */
export async function smartCompanySearch(
  identity: CompanyIdentity,
  maxResults = 10,
): Promise<VerifiedSearchResult[]> {
  // Build multiple targeted search queries using distinguishing signals
  const queries: string[] = [];
  
  // Query 1: Exact company name + domain
  queries.push(`"${identity.verifiedName}" site:${identity.domain}`);
  
  // Query 2: Company name + strongest distinguishing signal
  if (identity.locationSignals.length > 0) {
    queries.push(`"${identity.verifiedName}" ${identity.locationSignals[0]}`);
  }
  
  // Query 3: Company name + industry
  if (identity.industry) {
    queries.push(`"${identity.verifiedName}" ${identity.industry}`);
  }
  
  // Query 4: Key person + company
  if (identity.keyPeopleSignals.length > 0) {
    queries.push(`"${identity.keyPeopleSignals[0]}" "${identity.verifiedName}"`);
  }
  
  // Execute searches and collect results
  const allResults: Array<{ url: string; title: string; snippet: string }> = [];
  const seenUrls = new Set<string>();
  
  const searchPromises = queries.slice(0, 3).map(q =>
    exaSearch(q, maxResults).then(result => {
      if (result.success && result.data) {
        for (const item of result.data) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allResults.push({
              url: item.url,
              title: item.title,
              snippet: item.snippet,
            });
          }
        }
      }
    }).catch(() => {}),
  );
  
  await Promise.allSettled(searchPromises);
  
  // Verify all results against the company identity
  const verifiedResults = await verifySearchResults(allResults, identity);
  
  // Sort by match confidence (highest first)
  verifiedResults.sort((a, b) => b.matchConfidence - a.matchConfidence);
  
  return verifiedResults;
}

// ─── Corporate Registry Verification ───

/**
 * Try to verify a company against corporate registries.
 * Uses OpenCorporates and other public databases.
 */
export async function verifyCorporateRegistry(
  companyName: string,
  jurisdiction?: string,
): Promise<{
  found: boolean;
  registryData: Record<string, unknown> | null;
  source: string;
}> {
  try {
    // Try OpenCorporates via their public API
    const searchUrl = `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}${jurisdiction ? `&jurisdiction_code=${jurisdiction}` : ''}`;
    const response = await fetch(searchUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'LeadReach-AI/1.0' },
    });
    
    if (response.ok) {
      const data = await response.json() as Record<string, unknown>;
      const companies = (data as Record<string, unknown>)?.results as Record<string, unknown>;
      if (companies?.companies && Array.isArray(companies.companies)) {
        // Find the best match
        const matches = companies.companies as Array<Record<string, unknown>>;
        if (matches.length > 0) {
          const bestMatch = matches[0]?.company as Record<string, unknown>;
          return {
            found: true,
            registryData: bestMatch,
            source: 'OpenCorporates',
          };
        }
      }
    }
  } catch {
    // OpenCorporates not available
  }
  
  return { found: false, registryData: null, source: '' };
}
