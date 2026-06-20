// ============================================================
// Prospect Discovery Agent — Action Execution Engine
// ============================================================
// REBUILT: 8-Step Pipeline for 60-80%+ data completeness
// Key changes:
//   - 6 parallel targeted category searches (not 1 generic search)
//   - Structured regex extraction that ALWAYS works (even when LLM is down)
//   - 1 comprehensive LLM call instead of many small ones
//   - Deep crawl integrated into company research (not just URL research)
//   - Parallel gap-fill instead of sequential
//   - Promise.allSettled everywhere for resilience
// ============================================================

import { callLLM, callLLMForJSON, generateStructuredFallback } from '@/lib/llm';
import {
  webRead,
  exaSearch,
  linkedInSearchPeople,
  linkedInSearchCompanies,
  twitterSearch,
} from '@/lib/agent-reach-bridge';
import type {
  UserIntent,
  AgentAction,
  ProspectResult,
  ICPResult,
  OutreachResult,
  MarketResult,
  ScoreResult,
  ConversationContext,
} from './types';
import { getConversationResponsePrompt } from './prompts';
import { deepCrawlWebsite } from './deep-crawler';
import { extractCompanyIdentity, smartCompanySearch } from './company-verifier';
import { resolveFromEmail, resolveFromName, isEmail } from './person-resolver';
import { isJunkEmail, filterJunkEmails } from '@/lib/email-filter';
import {
  detectDomain,
  getDomainSearchQueries,
  DOMAIN_SCHEMAS,
  getDomainThinkModePrompt,
  type DomainType,
} from './domain-intelligence';

// ============================================================
// Timeout helper
// ============================================================

function withTimeout<T>(fn: () => Promise<T>, ms: number, label: string): Promise<T | null> {
  return Promise.race([
    fn().catch(err => {
      console.warn(`[ActionEngine] "${label}" threw: ${err instanceof Error ? err.message : 'Unknown'}`);
      return null as T | null;
    }),
    new Promise<null>(resolve => setTimeout(() => {
      console.warn(`[ActionEngine] "${label}" timed out after ${ms}ms`);
      resolve(null);
    }, ms)),
  ]);
}

// Type-safe helper: check if a withTimeout result is a successful ToolResult
function isSuccessfulSearchResult(val: unknown): val is { success: true; data: Array<{ title: string; url: string; snippet: string; score?: number; publishedDate?: string }> } {
  return val !== null && typeof val === 'object' && 'success' in (val as object) && (val as {success: boolean}).success === true && 'data' in (val as object) && Array.isArray((val as {data: unknown}).data);
}

// Type-safe helper: check if a withTimeout result is a successful webRead result
function isSuccessfulWebRead(val: unknown): val is { success: true; data: { content: string; wordCount: number; url: string; title: string } } {
  return val !== null && typeof val === 'object' && 'success' in (val as object) && (val as {success: boolean}).success === true && 'data' in (val as object);
}

// ============================================================
// Search Snippet interface
// ============================================================

interface SearchSnippet {
  title: string;
  snippet: string;
  url: string;
}

// ============================================================
// Structured Snippet Extraction (NO LLM - always works)
// Replaces populateFromSearchSnippets with a much more robust version
// ============================================================

function extractStructuredFromSnippets(prospect: ProspectResult, results: SearchSnippet[]): void {
  // Clean snippets of DuckDuckGo artifacts before processing
  const cleanSnippet = (s: string) => s
    .replace(/&rut=[a-f0-9]+/g, '')                                                     // DuckDuckGo tracking tokens
    .replace(/uddg=[^\s&"')]+/g, '')                                                    // DuckDuckGo redirect params
    .replace(/\[[^\]]*\]\(https?:\/\/duckduckgo\.com[^\s)]*\)?/g, '')                   // DDG redirect links (even truncated)
    .replace(/\]\(https?:\/\/duckduckgo\.com[^\s)]*\)?/g, '')                            // DDG link closures only (even truncated)
    .replace(/\]\(https?:\/\/[^\s)]*uddg=[^\s)]*\)?/g, '')                               // DDG uddg links (even truncated)
    .replace(/\[[^\]]*\]\([^)]*\)/g, '')                                                  // Remaining markdown links
    .replace(/\]\([^)]*\)/g, '')                                                           // Orphan markdown link closures
    .replace(/duckduckgo\.com\/l\/\?[^\s]*/g, '')                                         // DDG redirect URL fragments
    .replace(/^\s*[\[\]()]+\s*/gm, '')                                                     // Leading brackets/parens
    .replace(/\s{2,}/g, ' ')
    .trim();

  const allText = results.map(r => `${r.title} ${cleanSnippet(r.snippet)}`).join(' ');

  // Extract emails
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = allText.match(emailRegex) || [];
  if (emails.length > 0 && !prospect.generalEmail) {
    // Proper domain-suffix filtering via `isJunkEmail()` — replaces naive
    // substring `.includes()` checks that CodeQL flags as incomplete URL
    // substring sanitization.
    prospect.generalEmail = emails.find(e => !isJunkEmail(e)) || null;
  }

  // Extract phone numbers — validate it's a plausible phone (not an ID/hash)
  const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = allText.match(phoneRegex) || [];
  if (phones.length > 0 && !prospect.phoneMain) {
    // Pick the phone that appears near phone-related keywords
    const phoneContextRegex = /(?:phone|tel|call|contact|fax|office)[\s:]*(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i;
    const contextMatch = allText.match(phoneContextRegex);
    if (contextMatch) {
      const phoneDigits = contextMatch[0].replace(/\D/g, '');
      if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
        prospect.phoneMain = contextMatch[0].replace(/^(?:phone|tel|call|contact|fax|office)[\s:]*/i, '').trim();
      }
    }
    // Fallback: pick first phone that has proper format (area code doesn't start with 0/1)
    if (!prospect.phoneMain) {
      for (const p of phones) {
        const digits = p.replace(/\D/g, '');
        if (digits.length >= 10 && digits.length <= 15) {
          const areaCode = digits.slice(-10, -7);
          if (!['000', '111', '800', '855', '866', '877', '888', '900'].includes(areaCode)) {
            prospect.phoneMain = p;
            break;
          }
        }
      }
    }
  }

  // Extract LinkedIn URLs
  const linkedinRegex = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9-]+/g;
  const linkedinUrls = allText.match(linkedinRegex) || [];
  if (linkedinUrls.length > 0 && !prospect.linkedinUrl) {
    prospect.linkedinUrl = linkedinUrls[0];
  }

  // Extract Twitter handles
  const twitterRegex = /@([a-zA-Z0-9_]{3,15})/g;
  const twitterHandles = Array.from(allText.matchAll(twitterRegex)).map(m => `@${m[1]}`);
  if (twitterHandles.length > 0 && !prospect.twitterHandle) {
    // Filter out common false positives
    const filtered = twitterHandles.filter(h => !['@the', '@and', '@for', '@inc', '@llc'].includes(h.toLowerCase()));
    if (filtered.length > 0) prospect.twitterHandle = filtered[0];
  }

  // Extract CEO/leader names from snippets
  const ceoPatterns = [
    /(?:CEO|Chief Executive Officer|Founder|Co-Founder|President)[,:]?\s+([A-Z][a-z]+ [A-Z][a-z]+)/g,
    /([A-Z][a-z]+ [A-Z][a-z]+)\s*(?:,\s*(?:CEO|Chief Executive Officer|Founder|Co-Founder|President))/g,
  ];
  for (const pattern of ceoPatterns) {
    const matches = Array.from(allText.matchAll(pattern));
    if (matches.length > 0 && !prospect.ceoName) {
      prospect.ceoName = matches[0][1];
      break;
    }
  }

  // Extract revenue/employee numbers
  const revenueMatch = allText.match(/(?:revenue|annual revenue|total revenue)[\s:]+\$?([\d.]+\s*(?:million|billion|M|B))/i);
  if (revenueMatch && !prospect.revenueEstimate) {
    prospect.revenueEstimate = `$${revenueMatch[1]}`;
  }
  const employeeMatch = allText.match(/(?:employees|team size|headcount|staff)[\s:]*(?:of\s+)?(?:about\s+|approximately\s+|~?\s*)(\d[\d,-]*)/i);
  if (employeeMatch && !prospect.employeeCount) {
    prospect.employeeCount = employeeMatch[1].replace(/,/g, '');
  }

  // Extract industry
  const industryMatch = allText.match(/(?:industry|sector)[\s:]+([A-Z][a-zA-Z\s&]+?)(?:\.|,|;|$)/);
  if (industryMatch && !prospect.industry) {
    prospect.industry = industryMatch[1].trim();
  }

  // Extract location/city/country
  const locationPatterns = [
    /(?:headquartered in|based in|HQ in|located in)\s+([A-Z][a-zA-Z\s,]+?)(?:\.|;|,?\s+(?:with|and|a|the|founded))/g,
    /([A-Z][a-zA-Z\s]+),\s*([A-Z][a-zA-Z\s]+)\s*[-|–]\s*(?:Headquarters|HQ|Office)/g,
  ];
  for (const pattern of locationPatterns) {
    const match = Array.from(allText.matchAll(pattern));
    if (match.length > 0) {
      if (!prospect.hqAddress) prospect.hqAddress = match[0][1].trim();
      const parts = match[0][1].split(',').map(p => p.trim());
      if (parts.length >= 1 && !prospect.city) prospect.city = parts[0];
      if (parts.length >= 2 && !prospect.country) prospect.country = parts[parts.length - 1];
      break;
    }
  }

  // Extract founding year
  const foundedMatch = allText.match(/(?:founded|established|started|incorporated)[\s:]+(?:in\s+)?(\d{4})/i);
  if (foundedMatch && !prospect.foundingYear) {
    prospect.foundingYear = foundedMatch[1];
  }

  // Extract website from search result URLs — prefer the company's own domain
  if (!prospect.website && results.length > 0) {
    const blockedDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'crunchbase.com', 'bloomberg.com', 'wikipedia.org', 'duckduckgo.com', 'zoominfo.com', 'pitchbook.com', 'dealroom.co', 'theorg.com'];
    for (const r of results) {
      try {
        const u = new URL(r.url);
        const hostname = u.hostname.replace('www.', '');
        if (!blockedDomains.includes(hostname)) {
          prospect.website = u.origin;
          break;
        }
      } catch { /* skip */ }
    }
  }

  // Use first CLEAN snippet as description fallback
  if (!prospect.description && results[0]?.snippet) {
    const desc = cleanSnippet(results[0].snippet);
    // Only use if it looks like a real description (not a URL fragment)
    if (desc.length > 20 && !desc.startsWith('http') && !desc.includes('uddg=') && !desc.includes('&rut=')) {
      prospect.description = desc;
    }
  }

  // Extract LinkedIn URL from search result URLs
  if (!prospect.linkedinUrl) {
    const liResult = results.find(r => r.url.includes('linkedin.com/company'));
    if (liResult) prospect.linkedinUrl = liResult.url;
  }

  // Extract Twitter/X handle from search result URLs
  if (!prospect.twitterHandle) {
    const twResult = results.find(r => r.url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/));
    if (twResult) {
      const m = twResult.url.match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
      if (m && m[1] !== 'status') prospect.twitterHandle = `@${m[1]}`;
    }
  }

  // Extract support email
  if (emails.length > 0 && !prospect.supportEmail) {
    const supportEmail = emails.find(e => e.startsWith('support@') || e.startsWith('info@') || e.startsWith('hello@'));
    if (supportEmail && supportEmail !== prospect.generalEmail) {
      prospect.supportEmail = supportEmail;
    }
  }

  // Extract products/services keywords from snippets
  if (!prospect.productsServices.length) {
    const productPatterns = [
      /(?:provides?|offers?|specializes?\s+in)\s+([A-Z][a-zA-Z\s,]+?)(?:\.|;|and)/g,
    ];
    const found: string[] = [];
    for (const pat of productPatterns) {
      const matches = Array.from(allText.matchAll(pat));
      for (const m of matches) {
        const item = m[1].trim();
        if (item.length > 3 && item.length < 80) found.push(item);
      }
    }
    if (found.length > 0) prospect.productsServices = [...new Set(found)].slice(0, 5);
  }

  // Extract funding info
  if (!prospect.fundingInfo) {
    const fundingMatch = allText.match(/(?:raised|funding|funded|Series [A-F])[\s:]+\$?([\d.]+\s*(?:million|billion|M|B))/i);
    if (fundingMatch) {
      prospect.fundingInfo = `$${fundingMatch[1]}`;
    }
  }
}

// ============================================================
// Helper: Collect all search snippets from parallel searches
// ============================================================

interface CategorySearchResult {
  category: string;
  searchResult: {
    success: boolean;
    data: Array<{ title: string; url: string; snippet: string; score?: number; publishedDate?: string }>;
  } | null;
}

// Type helper for search results from withTimeout
import type { ToolResult } from '@/lib/agent-reach-bridge';
type SearchResultType = ToolResult<Array<{ title: string; url: string; snippet: string; score?: number; publishedDate?: string }>>;

// ============================================================
// Company Research Action — 8-STEP PIPELINE
// ============================================================

export type ProgressCallback = (event: string, data: any) => void;

export async function executeCompanyResearch(
  companyName: string,
  onProgress?: ProgressCallback,
  prepopulatedProspect?: Record<string, unknown>,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];

  // ═══ CLEAN THE COMPANY NAME ═══
  // The intent classifier sometimes passes the entire user message instead of
  // just the company name. Extract the actual company name from messy input.
  let cleanName = companyName.trim();
  
  // If the input contains a URL, extract the company name from it or from text before the URL
  const urlMatch = cleanName.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+)\.[a-z]{2,}/);
  if (urlMatch) {
    // We have a URL — extract domain name as fallback
    const domainName = urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    // Check if there's a company name before the URL
    const beforeUrl = cleanName.split(/https?:\/\//)[0].trim();
    // ReDoS-safe prefix strip: use anchored alternation without nested
    // optional quantifiers. The pattern is linear (no nested *, +, or
    // alternation with overlap).
    const cleanBefore = beforeUrl
      .replace(/^(research|tell me about|look up|find info on|analyze|please research|company:)\s+/i, '')
      .replace(/\s+(from|on|at)\s+(their\s+)?(website|site|url|page)$/i, '')
      .trim();
    cleanName = cleanBefore.length > 2 ? cleanBefore : domainName;
  }
  
  // Strip common prefixes
  cleanName = cleanName
    .replace(/^(research|tell me about|look up|find info on|analyze|please research|company:)\s+/i, '')
    .replace(/["']/g, '')
    .trim();
  
  // If the name is too long (>60 chars), it's probably the full message — truncate
  if (cleanName.length > 60) {
    // ReDoS-safe split: use simple alternation without nested quantifiers.
    // The `\s+` before the alternation is a single quantifier, not nested.
    cleanName = cleanName.split(/\s+(from|on|at|with|about|their)\s/i)[0].trim();
  }
  
  // Final fallback
  if (cleanName.length < 2) cleanName = companyName.trim();

  const prospect = createEmptyProspect('company', cleanName);
  prospect.companyName = cleanName;
  let stepIdx = 0;

  // ═══ MERGE PRE-POPULATED DATA ═══
  // If the caller (orchestrator) extracted structured fields from the user's
  // query (website, email, LinkedIn, location, etc.), merge them in BEFORE
  // running any external research. This ensures user-supplied data shows up
  // immediately in the workspace, even if every external search fails.
  if (prepopulatedProspect && Object.keys(prepopulatedProspect).length > 0) {
    const arrayKeys = new Set(['techStack', 'productsServices', 'recentNews', 'partners', 'boardMembers', 'sources']);
    const target = prospect as unknown as Record<string, unknown>;
    let prepopCount = 0;
    for (const [key, value] of Object.entries(prepopulatedProspect)) {
      if (value === null || value === undefined || value === '') continue;
      if (arrayKeys.has(key)) {
        if (Array.isArray(value) && value.length > 0) {
          target[key] = value;
          prepopCount++;
        }
      } else {
        target[key] = value;
        prepopCount++;
      }
    }

    if (prepopCount > 0) {
      steps.push({
        type: 'research_company',
        label: 'User-Supplied Data',
        status: 'completed',
        message: `Pre-populated ${prepopCount} fields from your query`,
      });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
  }

  // ═══ DETECT DOMAIN ═══
  // Detect the domain from the company name + query context.
  // If it's a specialized domain (VC, PE, hedge funds, etc.),
  // use domain-specific search queries instead of generic ones.
  // Also check well-known company names that imply specific domains.
  let detectedDomain = detectDomain(cleanName);
  
  // If domain is "general", try enhanced detection using known company names
  if (detectedDomain.domain === 'general') {
    const knownCompanyDomains: Record<string, string> = {
      'andreessen horowitz': 'venture_capital',
      'a16z': 'venture_capital',
      'sequoia': 'venture_capital',
      'sequoia capital': 'venture_capital',
      'yc': 'venture_capital',
      'y combinator': 'venture_capital',
      'accel': 'venture_capital',
      'benchmark': 'venture_capital',
      'lightspeed': 'venture_capital',
      'founders fund': 'venture_capital',
      'softbank': 'venture_capital',
      'tiger global': 'venture_capital',
      'coatue': 'venture_capital',
      'insight partners': 'private_equity',
      'kkr': 'private_equity',
      'blackstone': 'private_equity',
      'carlyle': 'private_equity',
      'apollo': 'private_equity',
      'bridgewater': 'hedge_funds',
      'citadel': 'hedge_funds',
      'renaissance': 'hedge_funds',
      'two sigma': 'hedge_funds',
      'goldman sachs': 'investment_banking',
      'morgan stanley': 'investment_banking',
      'jpmorgan': 'investment_banking',
    };
    const lowerName = cleanName.toLowerCase();
    for (const [name, domainKey] of Object.entries(knownCompanyDomains)) {
      if (lowerName.includes(name) || name.includes(lowerName)) {
        detectedDomain = DOMAIN_SCHEMAS[domainKey as DomainType] || detectedDomain;
        break;
      }
    }
  }
  
  const isDomainSpecific = detectedDomain.domain !== 'general';

  if (isDomainSpecific) {
    prospect.detectedDomain = detectedDomain.domain;
    prospect.domainLabel = detectedDomain.label;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Targeted Category Searches (PARALLEL - all 6 at once)
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_company', label: 'Category Searches', status: 'running', message: `Running 6 targeted searches for "${cleanName}"...` });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'Category Searches', message: `Running 6 targeted searches for "${cleanName}"...` });

  let categoryQueries;
  if (isDomainSpecific) {
    // Use domain-specific search queries (limited to 6)
    const domainQueries = getDomainSearchQueries(cleanName, detectedDomain);
    categoryQueries = domainQueries.slice(0, 6).map((query, i) => ({
      category: `domain_${i}`,
      query,
    }));
    // Add contact/location searches for domain-specific queries
    categoryQueries.push({ category: 'contact', query: `"${cleanName}" email phone contact address` });
    categoryQueries.push({ category: 'location', query: `"${cleanName}" headquarters office address` });
    // Limit to 6 total
    categoryQueries = categoryQueries.slice(0, 6);
  } else {
    // Use existing generic category queries
    categoryQueries = [
      { category: 'contact',    query: `"${cleanName}" email phone contact` },
      { category: 'location',   query: `"${cleanName}" headquarters office address` },
      { category: 'firmographics', query: `"${cleanName}" revenue employees funding size` },
      { category: 'people',     query: `"${cleanName}" CEO founder leadership team executives` },
      { category: 'digital',    query: `"${cleanName}" LinkedIn Twitter website social media` },
      { category: 'products',   query: `"${cleanName}" services products offerings about` },
    ];
  }

  const allSearchResults: CategorySearchResult[] = [];
  try {
    const searchPromises = categoryQueries.map(async (cq): Promise<CategorySearchResult> => {
      const result = await withTimeout(
        () => exaSearch(cq.query, 5),
        12_000, `Category search: ${cq.category}`,
      );
      return { category: cq.category, searchResult: result as SearchResultType | null };
    });

    const settled = await Promise.allSettled(searchPromises);
    for (const s of settled) {
      if (s.status === 'fulfilled' && s.value) {
        allSearchResults.push(s.value);
      }
    }

    const totalResults = allSearchResults.reduce((sum, r) => sum + (r.searchResult?.data?.length || 0), 0);
    const categoriesFound = allSearchResults.filter(r => r.searchResult?.success && r.searchResult.data.length > 0).length;
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = `Found results in ${categoriesFound}/6 categories (${totalResults} total results)`;
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'Category searches partially completed';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Batch Content Reading (PARALLEL)
  // Read top 2 URLs from each category (up to 12 pages)
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_company', label: 'Batch Reading', status: 'running', message: 'Reading top pages from each category...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'Batch Reading', message: 'Reading top pages from each category...' });

  const webContents: Array<{ category: string; url: string; content: string }> = [];
  const allSnippets: SearchSnippet[] = [];

  try {
    // Collect all snippets first
    for (const catResult of allSearchResults) {
      if (catResult.searchResult?.success && catResult.searchResult.data.length > 0) {
        sources.push(...catResult.searchResult.data.map(r => r.url));
        for (const r of catResult.searchResult.data) {
          allSnippets.push({ title: r.title, snippet: r.snippet || '', url: r.url });
        }
      }
    }

    // Collect top 2 URLs per category for reading (dedup)
    const urlsToRead: Array<{ category: string; url: string }> = [];
    const seenUrls = new Set<string>();
    for (const catResult of allSearchResults) {
      if (catResult.searchResult?.success) {
        const topTwo = catResult.searchResult.data.slice(0, 2);
        for (const r of topTwo) {
          if (!seenUrls.has(r.url)) {
            seenUrls.add(r.url);
            urlsToRead.push({ category: catResult.category, url: r.url });
          }
        }
      }
    }

    // Read all pages in parallel
    const readSettled = await Promise.allSettled(
      urlsToRead.map(u => withTimeout(() => webRead(u.url), 15_000, `Read: ${u.url.slice(0, 50)}`)),
    );
    for (let i = 0; i < readSettled.length; i++) {
      const result = readSettled[i];
      if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
        webContents.push({
          category: urlsToRead[i].category,
          url: urlsToRead[i].url,
          content: result.value.data.content.slice(0, 8000),
        });
      }
    }

    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = `Read ${webContents.length} pages, collected ${allSnippets.length} snippets`;
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'Batch reading partially completed';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Structured Snippet Extraction (NO LLM - always works)
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_company', label: 'Regex Extraction', status: 'running', message: 'Extracting data from snippets (no AI needed)...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'Regex Extraction', message: 'Extracting structured data from search snippets...' });

  try {
    if (allSnippets.length > 0) {
      extractStructuredFromSnippets(prospect, allSnippets);
    }
    // Also extract from web page content using regex (for emails, phones that appear in page text)
    const allPageText = webContents.map(w => w.content).join(' ');
    if (allPageText.length > 0) {
      // Extract emails from web content
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const pageEmails = allPageText.match(emailRegex) || [];
      if (pageEmails.length > 0 && !prospect.generalEmail) {
        // Proper domain-suffix filtering via `isJunkEmail()` — replaces naive
        // substring `.includes()` checks that CodeQL flags as incomplete URL
        // substring sanitization.
        prospect.generalEmail = pageEmails.find(e => !isJunkEmail(e)) || null;
      }
      if (pageEmails.length > 0 && !prospect.supportEmail) {
        const supportEmail = pageEmails.find(e => !isJunkEmail(e) && (e.startsWith('support@') || e.startsWith('info@') || e.startsWith('hello@')));
        if (supportEmail && supportEmail !== prospect.generalEmail) prospect.supportEmail = supportEmail;
      }
      // Extract phone from web content
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const pagePhones = allPageText.match(phoneRegex) || [];
      if (pagePhones.length > 0 && !prospect.phoneMain) {
        prospect.phoneMain = pagePhones[0];
      }
      // Extract LinkedIn from web content
      const liRegex = /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9-]+/g;
      const pageLi = allPageText.match(liRegex) || [];
      if (pageLi.length > 0 && !prospect.linkedinUrl) {
        prospect.linkedinUrl = pageLi[0];
      }
    }

    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = `Regex extraction complete (${calculateCompleteness(prospect)}% completeness)`;
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'Regex extraction partially completed';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // FAST PATH: Return after regex extraction if we have reasonable data.
  // The LLM extraction, deep crawl, and gap fill steps are expensive
  // (30-90s each) and often cause the pipeline to timeout. Instead,
  // we return what we have and rely on the conversation response
  // LLM call to present the data nicely.
  //
  // We only proceed to the expensive LLM steps if regex extraction
  // yielded very little (< 20% completeness) AND we have content to extract from.
  // ═══════════════════════════════════════════════════════════
  const regexCompleteness = calculateCompleteness(prospect);
  const hasContentForLLM = allSnippets.length > 3 || webContents.length > 1;

  if (regexCompleteness >= 20 || !hasContentForLLM) {
    // We have enough from regex, or there's not enough content for LLM to improve.
    // Mark remaining steps as skipped/optional.
    steps.push({ type: 'research_company', label: 'AI Deep Extraction', status: 'completed', message: regexCompleteness >= 20 ? 'Skipped — regex data sufficient' : 'Skipped — limited content available' });
    stepIdx++;

    // Skip deep crawl
    steps.push({ type: 'research_company', label: 'Deep Site Crawl', status: 'completed', message: 'Skipped — data sufficient' });
    stepIdx++;

    // Quick LinkedIn search (non-blocking, fast)
    steps.push({ type: 'research_company', label: 'LinkedIn Search', status: 'running', message: 'Quick LinkedIn check...' });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'LinkedIn Search', message: 'Checking LinkedIn...' });
    try {
      const liResult = await withTimeout(
        () => linkedInSearchCompanies(companyName, 3),
        8_000, 'LinkedIn search',
      );
      if (liResult?.success && liResult.data.length > 0) {
        const company = liResult.data[0];
        if (company.name && !prospect.companyName) prospect.companyName = company.name;
        if (company.headline && !prospect.description) prospect.description = company.headline;
        if (company.url && !prospect.linkedinUrl) prospect.linkedinUrl = company.url;
        if (company.location && !prospect.hqAddress) prospect.hqAddress = company.location;
        sources.push(`linkedin:${company.url || companyName}`);
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'Found LinkedIn profile';
      } else {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'No LinkedIn profile found';
      }
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'LinkedIn search unavailable';
    }
    onProgress?.('step_complete', { stepIndex: stepIdx, status: steps[stepIdx].status, message: steps[stepIdx].message, partialData: prospect });
    stepIdx++;

    // Skip gap fill
    steps.push({ type: 'research_company', label: 'Gap Fill', status: 'completed', message: 'Skipped — data sufficient' });
    stepIdx++;

    // Add news if missing (quick search)
    if (!prospect.recentNews.length) {
      try {
        const newsSearch = await withTimeout(
          () => exaSearch(`${companyName} news 2025 2026`, 3),
          10_000, 'News search',
        );
        if (newsSearch?.success && newsSearch.data.length > 0) {
          prospect.recentNews = newsSearch.data.map(r => {
            const title = r.title.replace(/&rut=[a-f0-9]+/g, '').trim();
            const snippet = (r.snippet || '').replace(/&rut=[a-f0-9]+/g, '').replace(/uddg=[^\s&"')]+/g, '').trim();
            return `${title} - ${snippet.slice(0, 100)}`;
          }).filter(n => n.length > 5 && !n.includes('&rut=') && !n.includes('uddg='));
          sources.push(...newsSearch.data.map(r => r.url));
        }
      } catch { /* non-critical */ }
    }

    // Domain-specific metadata (NO extra LLM call — just mark the domain)
    // The conversation response LLM will be prompted with domain context
    // to produce domain-aware output from the search snippet data.
    if (isDomainSpecific) {
      // Store the domain schema's requiredKPIs as domainData hint
      // so the frontend can display the domain badge
      prospect.detectedDomain = detectedDomain.domain;
      prospect.domainLabel = detectedDomain.label;
      // Extract structured domain data from snippets using regex (no LLM)
      const domainHint = extractDomainHintsFromSnippets(allSnippets, detectedDomain);
      if (domainHint && Object.keys(domainHint).length > 0) {
        prospect.domainData = [domainHint];
      }
    }

    prospect.sources = [...new Set(sources)];
    prospect.dataCompleteness = calculateCompleteness(prospect);
    return { prospect, steps };
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 4: Deep LLM Extraction (1 comprehensive call)
  // Feed ALL gathered content into ONE big LLM extraction call
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_company', label: 'AI Deep Extraction', status: 'running', message: 'Extracting all data with AI from all sources...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'AI Deep Extraction', message: 'Running comprehensive AI extraction...' });

  try {
    const snippetContent = allSnippets.slice(0, 20).map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`).join('\n---\n');
    const pageContent = webContents.map(w => `[${w.category.toUpperCase()} PAGE: ${w.url}]\n${w.content}`).join('\n\n===\n\n');
    const combinedContent = `SEARCH SNIPPETS:\n${snippetContent}\n\n===\n\nWEB PAGE CONTENT:\n${pageContent}`;

    // Use a focused, concise extraction prompt (NOT the domain think-mode prompt which is too slow)
    // The domain context is passed to the conversation response LLM instead.
    const extractionPrompt = isDomainSpecific
      ? `You are a B2B intelligence analyst specializing in ${detectedDomain.label}. Extract ALL available information about this ${detectedDomain.entityTypes[0] || 'company'} from the provided content. Follow the schema fields below.

CRITICAL: You MUST write ALL output in English. Do NOT use Chinese or any other language. All field values, descriptions, names, and data must be in English.

Return a JSON object with these fields (use null for truly unknown):
COMPANY: companyName, legalName, website, industry, subIndustry, description
LOCATION: hqAddress, city, stateProvince, country, postalCode
CONTACT: phoneMain, generalEmail, supportEmail
PEOPLE: ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, boardMembers (array)
FIRMOGRAPHICS: employeeCount, revenueEstimate, foundingYear, ownershipType
DIGITAL: linkedinUrl, twitterHandle, facebookPage, techStack (array)
OFFERINGS: productsServices (array), partners (array)
NEWS: recentNews (array of headlines), fundingInfo
DOMAIN-SPECIFIC: For ${detectedDomain.domain}, also include any relevant fields like fund_name, fund_type, estimated_dry_powder_usd, vintage_year, geographic_focus, target_deployment_countries as a flat JSON object.`
      : `You are a B2B intelligence analyst. Extract ALL available information about this company from the provided content. You have content from MULTIPLE sources (web pages, search results, LinkedIn, news).

CRITICAL: You MUST write ALL output in English. Do NOT use Chinese or any other language. All field values, descriptions, names, and data must be in English.

IMPORTANT: Fill in as many fields as possible. Even partial or estimated information is valuable. Do NOT repeat information already provided in "KNOWN DATA" — only add NEW fields.

Return a JSON object with these fields (use null for truly unknown):
COMPANY: companyName, legalName, website, industry, subIndustry, description
LOCATION: hqAddress, city, stateProvince, country, postalCode
CONTACT: phoneMain, generalEmail, supportEmail
PEOPLE: ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, boardMembers (array)
FIRMOGRAPHICS: employeeCount, revenueEstimate, foundingYear, ownershipType
DIGITAL: linkedinUrl, twitterHandle, facebookPage, techStack (array)
OFFERINGS: productsServices (array), partners (array)
NEWS: recentNews (array of headlines), fundingInfo

KNOWN DATA (already extracted — focus on FILLING GAPS):
companyName: ${prospect.companyName || 'unknown'}
website: ${prospect.website || 'unknown'}
industry: ${prospect.industry || 'unknown'}
city: ${prospect.city || 'unknown'}
country: ${prospect.country || 'unknown'}
phoneMain: ${prospect.phoneMain || 'unknown'}
generalEmail: ${prospect.generalEmail || 'unknown'}
ceoName: ${prospect.ceoName || 'unknown'}
employeeCount: ${prospect.employeeCount || 'unknown'}
revenueEstimate: ${prospect.revenueEstimate || 'unknown'}
linkedinUrl: ${prospect.linkedinUrl || 'unknown'}
twitterHandle: ${prospect.twitterHandle || 'unknown'}
foundingYear: ${prospect.foundingYear || 'unknown'}`;

    let extracted = await withTimeout(
      () => callLLMForJSON<Partial<ProspectResult>>(
        extractionPrompt,
        combinedContent.slice(0, 20000), // Reduced from 50k to 20k for faster LLM processing
        { thinkingBudget: 'standard' }, // Use standard instead of deep for faster response
      ),
      30_000, 'Company comprehensive LLM extraction', // Reduced from 45s to 30s
    );

    // No retry — if LLM extraction fails, we continue with regex data
    // Retrying adds another 30s+ and often fails for the same reason

    if (extracted) {
      safeMerge(prospect, extracted);
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = `AI extracted ${Object.values(extracted).filter(v => v !== null && v !== undefined && v !== '').length} fields`;
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } else {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'AI extraction unavailable (regex data preserved)';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'AI extraction failed (regex data preserved)';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // EARLY RETURN CHECK AFTER LLM: If data completeness > 50%,
  // skip deep crawl and gap fill — we have enough data
  // ═══════════════════════════════════════════════════════════
  if (calculateCompleteness(prospect) > 50) {
    // Skip deep crawl and gap fill — mark them as skipped
    if (prospect.website) {
      steps.push({ type: 'research_company', label: 'Deep Site Crawl', status: 'completed', message: 'Skipped — data sufficient' });
      stepIdx++;
    }
    // Add LinkedIn step as skipped
    steps.push({ type: 'research_company', label: 'LinkedIn Search', status: 'completed', message: 'Skipped — data sufficient' });
    stepIdx++;
    // Add Gap Fill step as skipped
    steps.push({ type: 'research_company', label: 'Gap Fill', status: 'completed', message: 'Skipped — data sufficient' });
    stepIdx++;

    // Still add news if missing
    if (!prospect.recentNews.length) {
      try {
        const newsSearch = await withTimeout(
          () => exaSearch(`${companyName} news 2025 2026`, 3),
          15_000, 'News search',
        );
        if (newsSearch?.success && newsSearch.data.length > 0) {
          prospect.recentNews = newsSearch.data.map(r => {
            const title = r.title.replace(/&rut=[a-f0-9]+/g, '').trim();
            const snippet = (r.snippet || '').replace(/&rut=[a-f0-9]+/g, '').replace(/uddg=[^\s&"')]+/g, '').trim();
            return `${title} - ${snippet.slice(0, 100)}`;
          }).filter(n => n.length > 5 && !n.includes('&rut=') && !n.includes('uddg='));
          sources.push(...newsSearch.data.map(r => r.url));
        }
      } catch { /* non-critical */ }
    }

    // Domain-specific metadata (NO extra LLM call — use regex hints)
    if (isDomainSpecific) {
      prospect.detectedDomain = detectedDomain.domain;
      prospect.domainLabel = detectedDomain.label;
      const domainHint = extractDomainHintsFromSnippets(allSnippets, detectedDomain);
      if (domainHint && Object.keys(domainHint).length > 0) {
        prospect.domainData = [domainHint];
      }
    }

    prospect.sources = [...new Set(sources)];
    prospect.dataCompleteness = calculateCompleteness(prospect);
    return { prospect, steps };
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 5: Website Deep Crawl (if URL found AND completeness < 50%)
  // ═══════════════════════════════════════════════════════════
  if (prospect.website && calculateCompleteness(prospect) < 50) {
    steps.push({ type: 'research_company', label: 'Deep Site Crawl', status: 'running', message: `Deep-crawling ${prospect.website}...` });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'Deep Site Crawl', message: `Deep-crawling ${prospect.website}...` });

    try {
      const crawlResult = await withTimeout(
        () => deepCrawlWebsite(prospect.website!, (msg) => {
          steps[stepIdx].message = msg;
          onProgress?.('step_progress', { stepIndex: stepIdx, message: msg });
        }),
        90_000, 'Deep site crawl',
      );

      if (crawlResult && crawlResult.totalPagesCrawled > 0) {
        sources.push(...crawlResult.pages.map(p => p.url));

        // Extract from crawled content using regex first
        const crawlText = crawlResult.allContentCombined;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const crawlEmails = crawlText.match(emailRegex) || [];
        if (crawlEmails.length > 0 && !prospect.generalEmail) {
          // Proper domain-suffix filtering via `isJunkEmail()` — replaces naive
          // substring `.includes()` checks that CodeQL flags as incomplete URL
          // substring sanitization.
          prospect.generalEmail = crawlEmails.find(e => !isJunkEmail(e)) || null;
        }
        if (crawlEmails.length > 0 && !prospect.supportEmail) {
          const supportEmail = crawlEmails.find(e => !isJunkEmail(e) && (e.startsWith('support@') || e.startsWith('info@') || e.startsWith('hello@')));
          if (supportEmail && supportEmail !== prospect.generalEmail) prospect.supportEmail = supportEmail;
        }
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const crawlPhones = crawlText.match(phoneRegex) || [];
        if (crawlPhones.length > 0 && !prospect.phoneMain) {
          prospect.phoneMain = crawlPhones[0];
        }

        // Then try LLM extraction from crawled content (only fill gaps)
        const crawlExtract = await withTimeout(
          () => callLLMForJSON<Partial<ProspectResult>>(
            `You are analyzing content from ${crawlResult.totalPagesCrawled} pages of ${prospect.website}. Extract information that is STILL MISSING from the known data below.

KNOWN DATA (do NOT repeat):
companyName: ${prospect.companyName || 'unknown'}, website: ${prospect.website || 'unknown'}, industry: ${prospect.industry || 'unknown'}, city: ${prospect.city || 'unknown'}, country: ${prospect.country || 'unknown'}, phoneMain: ${prospect.phoneMain || 'unknown'}, generalEmail: ${prospect.generalEmail || 'unknown'}, ceoName: ${prospect.ceoName || 'unknown'}, employeeCount: ${prospect.employeeCount || 'unknown'}, linkedinUrl: ${prospect.linkedinUrl || 'unknown'}, twitterHandle: ${prospect.twitterHandle || 'unknown'}, foundingYear: ${prospect.foundingYear || 'unknown'}

Return JSON with ONLY fields that have NEW info: companyName, legalName, website, industry, subIndustry, description, hqAddress, city, stateProvince, country, postalCode, phoneMain, generalEmail, supportEmail, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, employeeCount, revenueEstimate, foundingYear, ownershipType, linkedinUrl, twitterHandle, facebookPage, techStack (array), boardMembers (array), productsServices (array), partners (array), fundingInfo. Use null for unknown.`,
            crawlResult.allContentCombined.slice(0, 50000),
          ),
          60_000, 'Crawl LLM extraction',
        );
        if (crawlExtract) {
          safeMerge(prospect, crawlExtract);
        }

        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = `Crawled ${crawlResult.totalPagesCrawled} pages from website`;
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } else {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'Deep crawl found no additional pages';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
      }
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Deep crawl partially completed';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
    stepIdx++;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 6: LinkedIn Company Search
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_company', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'LinkedIn Search', message: 'Searching LinkedIn...' });
  try {
    const liResult = await withTimeout(
      () => linkedInSearchCompanies(companyName, 5),
      20_000, 'LinkedIn search',
    );
    if (liResult?.success && liResult.data.length > 0) {
      const company = liResult.data[0];
      if (company.name && !prospect.companyName) prospect.companyName = company.name;
      if (company.headline && !prospect.description) prospect.description = company.headline;
      if (company.url && !prospect.linkedinUrl) prospect.linkedinUrl = company.url;
      if (company.location && !prospect.hqAddress) prospect.hqAddress = company.location;
      // Populate city/country from LinkedIn location
      if (company.location) {
        if (!prospect.city) {
          const cityMatch = company.location.match(/^([A-Z][a-zA-Z\s]+?)(?:,|\s*-|\s*$)/);
          if (cityMatch) prospect.city = cityMatch[1].trim();
        }
        if (!prospect.country) {
          const countryMatch = company.location.match(/,\s*([A-Z][a-zA-Z\s]+)$/);
          if (countryMatch) prospect.country = countryMatch[1].trim();
        }
      }
      // Try to extract industry from LinkedIn headline
      if (company.headline && !prospect.industry) {
        const industryMatch = company.headline.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Company|Startup|Firm|Corporation)/i);
        if (industryMatch) prospect.industry = industryMatch[1].trim();
      }
      // Check additional LinkedIn results
      for (let i = 1; i < Math.min(liResult.data.length, 5); i++) {
        const extra = liResult.data[i];
        if (extra.headline && !prospect.description) prospect.description = extra.headline;
        if (extra.location && !prospect.hqAddress) prospect.hqAddress = extra.location;
      }
      sources.push(`linkedin:${company.url || companyName}`);
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Found LinkedIn profile';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: 'Found LinkedIn profile', partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } else {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'No LinkedIn profile found';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: 'No LinkedIn profile found', partialData: null });
    }
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'LinkedIn search unavailable';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 7: Targeted Gap Fill (PARALLEL)
  // For each STILL-EMPTY tab category, run ONE more targeted search
  // ═══════════════════════════════════════════════════════════
  const name = prospect.companyName || companyName;
  const gapCategories: Array<{ category: string; query: string; missingFields: string[] }> = [];

  // Check each tab category for gaps
  if (!prospect.generalEmail && !prospect.supportEmail && !prospect.phoneMain) {
    gapCategories.push({ category: 'contact', query: `"${name}" email phone contact address`, missingFields: ['generalEmail', 'supportEmail', 'phoneMain'] });
  }
  if (!prospect.city && !prospect.country && !prospect.hqAddress) {
    gapCategories.push({ category: 'location', query: `"${name}" headquarters office location address city`, missingFields: ['hqAddress', 'city', 'country'] });
  }
  if (!prospect.employeeCount && !prospect.revenueEstimate && !prospect.foundingYear) {
    gapCategories.push({ category: 'firmographics', query: `"${name}" revenue employees funding Crunchbase ZoomInfo`, missingFields: ['employeeCount', 'revenueEstimate', 'foundingYear'] });
  }
  if (!prospect.ceoName && !prospect.keyContactName && !prospect.boardMembers.length) {
    gapCategories.push({ category: 'people', query: `"${name}" CEO founder leadership team executives board`, missingFields: ['ceoName', 'keyContactName'] });
  }
  if (!prospect.linkedinUrl && !prospect.twitterHandle && !prospect.facebookPage) {
    gapCategories.push({ category: 'digital', query: `"${name}" LinkedIn Twitter Facebook social media profiles`, missingFields: ['linkedinUrl', 'twitterHandle'] });
  }
  if (!prospect.productsServices.length && !prospect.description) {
    gapCategories.push({ category: 'products', query: `"${name}" products services about what does`, missingFields: ['productsServices', 'description'] });
  }

  if (gapCategories.length > 0) {
    steps.push({ type: 'research_company', label: 'Gap Fill', status: 'running', message: `Filling ${gapCategories.length} empty categories in parallel...` });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'Gap Fill', message: `Filling data gaps in ${gapCategories.length} categories...` });

    try {
      // Run gap searches in parallel (limit to 3 categories max)
      const limitedGapCategories = gapCategories.slice(0, 3);
      const gapPromises = limitedGapCategories.map(async (gap) => {
        const gapResult = await withTimeout(
          () => exaSearch(gap.query, 3),
          12_000, `Gap search: ${gap.category}`,
        );
        if (!gapResult?.success || gapResult.data.length === 0) return null;

        sources.push(...gapResult.data.map(r => r.url));
        const gapSnippets: SearchSnippet[] = gapResult.data.map(r => ({ title: r.title, snippet: r.snippet || '', url: r.url }));

        // Always do regex extraction from gap snippets
        extractStructuredFromSnippets(prospect, gapSnippets);

        // Try to read top URL and extract with LLM
        const topUrl = gapResult.data[0]?.url;
        if (topUrl) {
          const readResult = await withTimeout(() => webRead(topUrl), 12_000, `Gap read: ${gap.category}`);
          if (readResult?.success) {
            const gapData = await withTimeout(
              () => callLLMForJSON<Partial<ProspectResult>>(
                `Extract ${gap.missingFields.join(', ')} for "${name}" from this content. Return JSON with relevant fields from: ${gap.missingFields.join(', ')}, plus any other relevant fields. Use null for not found.`,
                readResult.data.content.slice(0, 4000),
                { retriesPerModel: 1, useFallback: true },
              ),
              30_000, `Gap LLM: ${gap.category}`,
            );
            if (gapData) {
              safeMerge(prospect, gapData);
            }
          }
        }
        return gap.category;
      });

      await Promise.allSettled(gapPromises);

      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = `Filled ${limitedGapCategories.length} data gap${limitedGapCategories.length > 1 ? 's' : ''}`;
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Gap fill partially completed';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
    stepIdx++;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 8: Calculate completeness and return
  // ═══════════════════════════════════════════════════════════
  // Also add news if we haven't yet
  if (!prospect.recentNews.length) {
    try {
      const newsSearch = await withTimeout(
        () => exaSearch(`${companyName} news 2025 2026`, 3),
        15_000, 'News search',
      );
      if (newsSearch?.success && newsSearch.data.length > 0) {
        prospect.recentNews = newsSearch.data.map(r => {
          const title = r.title.replace(/&rut=[a-f0-9]+/g, '').trim();
          const snippet = (r.snippet || '').replace(/&rut=[a-f0-9]+/g, '').replace(/uddg=[^\s&"')]+/g, '').trim();
          return `${title} - ${snippet.slice(0, 100)}`;
        }).filter(n => n.length > 5 && !n.includes('&rut=') && !n.includes('uddg='));
        sources.push(...newsSearch.data.map(r => r.url));
      }
    } catch { /* non-critical */ }
  }

  // Domain-specific data extraction at the end of the pipeline (regex-based, no LLM)
  if (isDomainSpecific) {
    prospect.detectedDomain = detectedDomain.domain;
    prospect.domainLabel = detectedDomain.label;
    const domainHint = extractDomainHintsFromSnippets(allSnippets, detectedDomain);
    if (domainHint && Object.keys(domainHint).length > 0) {
      // Merge with any existing domainData from earlier steps
      if (prospect.domainData && prospect.domainData.length > 0) {
        prospect.domainData = [domainHint, ...prospect.domainData];
      } else {
        prospect.domainData = [domainHint];
      }
    }
  }

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return { prospect, steps };
}

// ============================================================
// Person Research Action
// ============================================================
export async function executePersonResearch(
  personInput: string,
  onProgress?: ProgressCallback,
  prepopulatedProspect?: Record<string, unknown>,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];
  const prospect = createEmptyProspect('person', personInput);
  prospect.personName = personInput;

  // ═══ MERGE PRE-POPULATED DATA ═══
  // If the caller (orchestrator) extracted structured fields from the user's
  // query (email, LinkedIn, location, etc.), merge them in BEFORE running
  // any external research. This ensures user-supplied data shows up
  // immediately in the workspace, even if every external search fails.
  if (prepopulatedProspect && Object.keys(prepopulatedProspect).length > 0) {
    const arrayKeys = new Set(['techStack', 'productsServices', 'recentNews', 'partners', 'boardMembers', 'sources']);
    const target = prospect as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(prepopulatedProspect)) {
      if (value === null || value === undefined || value === '') continue;
      if (arrayKeys.has(key)) {
        if (Array.isArray(value) && value.length > 0) {
          target[key] = value;
        }
      } else {
        target[key] = value;
      }
    }

    // Emit a step showing the user what was pre-populated
    const filledFields: string[] = [];
    if (prospect.personName) filledFields.push(`Name: ${prospect.personName}`);
    if (prospect.personTitle) filledFields.push(`Title: ${prospect.personTitle}`);
    if (prospect.personCompany) filledFields.push(`Company: ${prospect.personCompany}`);
    if (prospect.personEmail) filledFields.push(`Email: ${prospect.personEmail}`);
    if (prospect.personLinkedin) filledFields.push(`LinkedIn: ${prospect.personLinkedin}`);
    if (prospect.city) filledFields.push(`City: ${prospect.city}`);
    if (prospect.country) filledFields.push(`Country: ${prospect.country}`);
    if (prospect.industry) filledFields.push(`Industry: ${prospect.industry}`);

    if (filledFields.length > 0) {
      steps.push({
        type: 'research_person',
        label: 'User-Supplied Data',
        status: 'completed',
        message: `Pre-populated ${filledFields.length} fields from your query: ${filledFields.slice(0, 4).join(' | ')}${filledFields.length > 4 ? ` (+${filledFields.length - 4} more)` : ''}`,
      });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
  }

  // ─── Detect input type: email vs name ───
  const inputIsEmail = isEmail(personInput);

  if (inputIsEmail) {
    // ═══ EMAIL-BASED RESOLUTION (most reliable) ═══
    steps.push({ type: 'research_person', label: 'Email Intelligence', status: 'running', message: `Analyzing email: ${personInput}...` });
    try {
      const resolved = await withTimeout(
        () => resolveFromEmail(personInput),
        30_000, 'Email-based person resolution',
      );
      if (resolved) {
        const id = resolved.identity;
        if (id.fullName) prospect.personName = id.fullName;
        if (id.title) prospect.personTitle = id.title;
        if (id.associatedCompany) { prospect.personCompany = id.associatedCompany; prospect.companyName = id.associatedCompany; }
        if (id.email) prospect.personEmail = id.email;
        if (id.location) { prospect.city = id.location; }
        if (id.linkedinUrl) prospect.personLinkedin = id.linkedinUrl;

        const data = resolved.mergedData;
        if (data.personPhone && !prospect.personPhone) prospect.personPhone = String(data.personPhone);
        if (data.personBio && !prospect.personBio) prospect.personBio = String(data.personBio);
        if (data.industry && !prospect.industry) prospect.industry = String(data.industry);
        if (data.country && !prospect.country) prospect.country = String(data.country);
        if (data.website && !prospect.website) prospect.website = String(data.website);

        sources.push(...resolved.verificationSources);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Resolved via email: ${id.fullName}${id.associatedCompany ? ` at ${id.associatedCompany}` : ''} (${resolved.verificationCount} sources verified)`;
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Email resolution returned limited results';
      }
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Email resolution partially completed';
    }
  } else {
    // ═══ NAME-BASED RESOLUTION (with smart disambiguation) ═══
    // Build context from pre-populated data so the resolver can disambiguate
    // (e.g., "Kavya Shah at Credora" instead of any random Kavya Shah).
    const resolverContext: { company?: string; title?: string; location?: string; industry?: string } = {};
    if (prospect.personCompany) resolverContext.company = prospect.personCompany;
    if (prospect.personTitle) resolverContext.title = prospect.personTitle;
    if (prospect.city) resolverContext.location = prospect.city;
    if (prospect.industry) resolverContext.industry = prospect.industry;

    steps.push({ type: 'research_person', label: 'Identity Resolution', status: 'running', message: `Resolving identity of "${personInput}"${resolverContext.company ? ` at ${resolverContext.company}` : ''}...` });
    try {
      const resolved = await withTimeout(
        () => resolveFromName(personInput, Object.keys(resolverContext).length > 0 ? resolverContext : undefined),
        30_000, 'Name-based person resolution',
      );
      if (resolved) {
        const id = resolved.identity;
        if (id.fullName) prospect.personName = id.fullName;
        if (id.title && !prospect.personTitle) prospect.personTitle = id.title;
        if (id.associatedCompany && !prospect.personCompany) {
          prospect.personCompany = id.associatedCompany;
          if (!prospect.companyName) prospect.companyName = id.associatedCompany;
        }
        if (id.email && !prospect.personEmail) prospect.personEmail = id.email;
        if (id.location && !prospect.city) { prospect.city = id.location; }
        if (id.linkedinUrl && !prospect.personLinkedin) prospect.personLinkedin = id.linkedinUrl;

        const data = resolved.mergedData;
        if (data.personPhone && !prospect.personPhone) prospect.personPhone = String(data.personPhone);
        if (data.personBio && !prospect.personBio) prospect.personBio = String(data.personBio);
        if (data.industry && !prospect.industry) prospect.industry = String(data.industry);
        if (data.country && !prospect.country) prospect.country = String(data.country);
        if (data.website && !prospect.website) prospect.website = String(data.website);

        sources.push(...resolved.verificationSources);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Resolved: ${id.fullName}${id.associatedCompany ? ` at ${id.associatedCompany}` : ''} (${resolved.verificationCount} sources, confidence: ${id.confidence})`;
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Identity resolution returned limited results';
      }
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Identity resolution partially completed';
    }
  }

  // ─── Additional data gathering ───
  if (!prospect.personLinkedin) {
    steps.push({ type: 'research_person', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
    try {
      const liResult = await withTimeout(() => linkedInSearchPeople(personInput, 3), 10_000, 'LinkedIn person');
      if (liResult?.success && liResult.data.length > 0) {
        const person = liResult.data[0];
        if (person.name && !prospect.personName) prospect.personName = person.name;
        if (person.headline && !prospect.personTitle) prospect.personTitle = person.headline;
        if (person.url) prospect.personLinkedin = person.url;
        if (person.location && !prospect.hqAddress) prospect.hqAddress = person.location;
        sources.push(`linkedin:${person.url || personInput}`);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Found LinkedIn profile';
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'No LinkedIn profile found';
      }
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'LinkedIn search unavailable';
    }
  }

  const companyName = prospect.personCompany || prospect.companyName;
  if (companyName) {
    steps.push({ type: 'research_person', label: 'Company Research', status: 'running', message: `Researching ${companyName}...` });
    try {
      // Run targeted searches in parallel for company data.
      // Use REDUCED timeouts (10s) so the pipeline doesn't hang when DDG is slow.
      // Person searches are time-sensitive — better to return partial data quickly
      // than to wait 30s per search and risk the user giving up.
      const [companySearchResult, contactSearchResult] = await Promise.allSettled([
        withTimeout(() => exaSearch(`"${companyName}" company overview`, 3), 12_000, 'Person company search'),
        withTimeout(() => exaSearch(`"${companyName}" email phone contact`, 3), 12_000, 'Person company contact'),
      ]);

      const allCompanySnippets: SearchSnippet[] = [];
      const urlsToRead: string[] = [];
      const seenUrls = new Set<string>();

      for (const result of [companySearchResult, contactSearchResult]) {
        if (result.status === 'fulfilled' && result.value && typeof result.value === 'object' && 'success' in result.value && (result.value as {success: boolean}).success && 'data' in result.value && Array.isArray((result.value as {data: unknown}).data)) {
          const data = (result.value as {data: Array<{title: string; url: string; snippet: string}>}).data;
          sources.push(...data.map(r => r.url));
          for (const r of data) {
            allCompanySnippets.push({ title: r.title, snippet: r.snippet || '', url: r.url });
            if (!seenUrls.has(r.url)) {
              seenUrls.add(r.url);
              urlsToRead.push(r.url);
            }
          }
        }
      }

      // Structured snippet extraction (always works)
      if (allCompanySnippets.length > 0) {
        extractStructuredFromSnippets(prospect, allCompanySnippets);
      }

      // Read top pages and try LLM extraction (REDUCED timeout)
      if (urlsToRead.length > 0) {
        const readResults = await Promise.allSettled(
          urlsToRead.slice(0, 2).map(u => withTimeout(() => webRead(u), 12_000, `Company read: ${u.slice(0, 50)}`)),
        );
        const webContents: string[] = [];
        for (const result of readResults) {
          if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
            webContents.push(result.value.data.content.slice(0, 4000));
          }
        }

        if (webContents.length > 0) {
          // LLM extraction is OPTIONAL — skip if Z.AI is in cooldown
          // (avoids the 60s backoff hang)
          const { isInRateLimitCooldown } = await import('@/lib/network-helpers');
          if (!isInRateLimitCooldown('api.z.ai')) {
            const companyData = await withTimeout(
              () => callLLMForJSON<Partial<ProspectResult>>(
                `Extract company info about "${companyName}" from this content.
Return JSON: companyName, website, industry, city, country, phoneMain, generalEmail, employeeCount, revenueEstimate, linkedinUrl, twitterHandle. Use null for not found.`,
                webContents.join('\n---\n'),
                { retriesPerModel: 0 }, // No retries — fail fast if Z.AI is down
              ),
              20_000, 'Person company LLM',
            );
            if (companyData) {
              safeMerge(prospect, companyData);
            }
          }
        }
      }

      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Company research completed';
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Company research partially completed';
    }
  }

  if (!prospect.twitterHandle) {
    steps.push({ type: 'research_person', label: 'Twitter/X', status: 'running', message: 'Searching Twitter/X...' });
    try {
      const twResult = await withTimeout(() => twitterSearch(prospect.personName || personInput, 3), 10_000, 'Twitter search');
      if (twResult?.success && twResult.data.length > 0) {
        const tweet = twResult.data[0] as unknown as Record<string, unknown>;
        if (tweet.author) {
          const handle = String(tweet.author);
          prospect.twitterHandle = handle.startsWith('@') ? handle : `@${handle}`;
        } else if (tweet.url) {
          const urlMatch = String(tweet.url).match(/(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/);
          if (urlMatch && urlMatch[1] !== 'status') prospect.twitterHandle = `@${urlMatch[1]}`;
        }
        sources.push(`twitter:${tweet.url || personInput}`);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Found Twitter profile';
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'No Twitter profile found';
      }
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Twitter search unavailable';
    }
  }

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return { prospect, steps };
}

// ============================================================
// URL Research Action — 8-STEP PIPELINE (starting with deep crawl)
// ============================================================

export async function executeUrlResearch(
  url: string,
  onProgress?: ProgressCallback,
  prepopulatedProspect?: Record<string, unknown>,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [url];
  const prospect = createEmptyProspect('url', url);
  let stepIdx = 0;

  // ═══ MERGE PRE-POPULATED DATA ═══
  // Same pattern as executeCompanyResearch — preserve user-supplied fields.
  if (prepopulatedProspect && Object.keys(prepopulatedProspect).length > 0) {
    const arrayKeys = new Set(['techStack', 'productsServices', 'recentNews', 'partners', 'boardMembers', 'sources']);
    const target = prospect as unknown as Record<string, unknown>;
    let prepopCount = 0;
    for (const [key, value] of Object.entries(prepopulatedProspect)) {
      if (value === null || value === undefined || value === '') continue;
      if (arrayKeys.has(key)) {
        if (Array.isArray(value) && value.length > 0) {
          target[key] = value;
          prepopCount++;
        }
      } else {
        target[key] = value;
        prepopCount++;
      }
    }

    if (prepopCount > 0) {
      steps.push({
        type: 'research_url',
        label: 'User-Supplied Data',
        status: 'completed',
        message: `Pre-populated ${prepopCount} fields from your query`,
      });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Deep Crawl — scrape every corner of the website
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_url', label: 'Deep Site Crawl', status: 'running', message: `Deep-crawling ${url} and all sub-pages...` });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'Deep Site Crawl', message: `Deep-crawling ${url}...` });

  let crawlResult: Awaited<ReturnType<typeof deepCrawlWebsite>> | null = null;

  try {
    crawlResult = await withTimeout(
      () => deepCrawlWebsite(url, (msg) => {
        steps[stepIdx].message = msg;
        onProgress?.('step_progress', { stepIndex: stepIdx, message: msg });
      }),
      120_000, 'Deep site crawl',
    );

    if (crawlResult && crawlResult.totalPagesCrawled > 0) {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = `Crawled ${crawlResult.totalPagesCrawled} pages (${crawlResult.totalWords.toLocaleString()} words) across ${crawlResult.domain}`;
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
      sources.push(...crawlResult.pages.map(p => p.url));
    } else {
      // Deep crawl returned no pages — fall back to simple single-page read
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Deep crawl unavailable, reading single page...';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
    }
  } catch {
    steps[stepIdx].status = 'failed';
    steps[stepIdx].message = 'Deep crawl failed, will try single page read';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Structured Extraction from crawled content (NO LLM)
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_url', label: 'Regex Extraction', status: 'running', message: 'Extracting data from crawled pages...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'Regex Extraction', message: 'Extracting structured data from website content...' });

  let pageContent = '';
  try {
    if (crawlResult && crawlResult.totalPagesCrawled > 0) {
      pageContent = crawlResult.allContentCombined;
    } else {
      // Fallback: read single page
      const readResult = await withTimeout(() => webRead(url), 25_000, `URL read: ${url.slice(0, 50)}`);
      if (readResult?.success) {
        pageContent = readResult.data.content;
      }
    }

    if (pageContent.length > 0) {
      // Extract emails
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const emails = pageContent.match(emailRegex) || [];
      if (emails.length > 0) {
        // Proper domain-suffix filtering via `filterJunkEmails()` — replaces
        // naive substring `.includes()` checks that CodeQL flags as
        // incomplete URL substring sanitization.
        const filtered = filterJunkEmails(emails);
        if (filtered.length > 0 && !prospect.generalEmail) prospect.generalEmail = filtered[0];
        const supportEmail = filtered.find(e => e.startsWith('support@') || e.startsWith('info@') || e.startsWith('hello@'));
        if (supportEmail && supportEmail !== prospect.generalEmail && !prospect.supportEmail) prospect.supportEmail = supportEmail;
      }

      // Extract phones
      const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      const phones = pageContent.match(phoneRegex) || [];
      if (phones.length > 0 && !prospect.phoneMain) prospect.phoneMain = phones[0];

      // Extract LinkedIn URLs
      const liRegex = /https?:\/\/(?:www\.)?linkedin\.com\/(?:company\/[a-zA-Z0-9-]+|in\/[a-zA-Z0-9-]+)/g;
      const liUrls = pageContent.match(liRegex) || [];
      if (liUrls.length > 0) {
        for (const liUrl of liUrls) {
          if (liUrl.includes('/company/') && !prospect.linkedinUrl) prospect.linkedinUrl = liUrl;
          if (liUrl.includes('/in/') && !prospect.personLinkedin) prospect.personLinkedin = liUrl;
        }
      }

      // Extract Twitter/X handles
      const twitterUrlRegex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/g;
      const twitterUrls = Array.from(pageContent.matchAll(twitterUrlRegex));
      for (const m of twitterUrls) {
        if (m[1] !== 'status' && m[1] !== 'share' && m[1] !== 'home' && !prospect.twitterHandle) {
          prospect.twitterHandle = `@${m[1]}`;
        }
      }

      // Extract addresses
      const addrMatch = pageContent.match(/(\d+\s+[A-Z][a-zA-Z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Way|Court|Ct)[,.]?\s*[A-Z][a-zA-Z\s]+,?\s*[A-Z]{2}\s+\d{5})/);
      if (addrMatch && !prospect.hqAddress) prospect.hqAddress = addrMatch[1];

      // Extract website
      if (!prospect.website) {
        try { prospect.website = new URL(url).origin; } catch { /* skip */ }
      }
    }

    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = `Regex extraction complete (${calculateCompleteness(prospect)}% completeness)`;
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'Regex extraction partially completed';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Deep LLM Extraction (1 comprehensive call)
  // ═══════════════════════════════════════════════════════════
  steps.push({ type: 'research_url', label: 'AI Analysis', status: 'running', message: 'Analyzing all pages with AI...' });
  onProgress?.('step_start', { stepIndex: stepIdx, label: 'AI Analysis', message: 'Analyzing all pages with AI...' });

  try {
    if (pageContent.length > 0) {
      const extracted = await withTimeout(
        () => callLLMForJSON<Partial<ProspectResult>>(
          `You are a B2B intelligence analyst. You have been given content from MULTIPLE pages of a website (including About, Contact, Team, Services pages). Extract comprehensive business/contact information.

IMPORTANT: This is content from the ENTIRE website, not just one page. Use ALL the information available across pages to build the most complete picture possible. Even partial or estimated information is valuable.

Return JSON with these fields (use null for anything not found):
companyName, legalName, website, industry, subIndustry, description,
hqAddress, city, stateProvince, country, postalCode,
phoneMain, generalEmail, supportEmail,
ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail,
employeeCount, revenueEstimate, foundingYear, ownershipType,
linkedinUrl, twitterHandle, facebookPage,
techStack (array of strings), boardMembers (array of strings),
recentNews (array of strings), productsServices (array of strings),
partners (array of strings), fundingInfo,
personName, personTitle, personCompany, personEmail, personPhone, personLinkedin, personBio.

KNOWN DATA (already extracted — focus on FILLING GAPS):
website: ${prospect.website || 'unknown'}, generalEmail: ${prospect.generalEmail || 'unknown'}, phoneMain: ${prospect.phoneMain || 'unknown'}, linkedinUrl: ${prospect.linkedinUrl || 'unknown'}, twitterHandle: ${prospect.twitterHandle || 'unknown'}

Be thorough — you have data from the entire website, so extract everything you can find.`,
          pageContent.slice(0, 50000),
        ),
        60_000, 'Deep crawl LLM extraction',
      );

      if (extracted) {
        safeMerge(prospect, extracted);
        if (extracted.companyName) prospect.queryType = 'company';
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = `AI extracted ${Object.values(extracted).filter(v => v !== null && v !== undefined && v !== '').length} fields`;
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } else {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'AI extraction unavailable (regex data preserved)';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      }
    } else {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'No page content to analyze';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    }
  } catch {
    steps[stepIdx].status = 'completed';
    steps[stepIdx].message = 'AI extraction failed (regex data preserved)';
    onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
  }
  stepIdx++;

  // ═══════════════════════════════════════════════════════════
  // STEP 4: Company Identity Verification + Smart Search
  // ═══════════════════════════════════════════════════════════
  if (prospect.companyName && crawlResult && crawlResult.totalPagesCrawled > 0) {
    steps.push({ type: 'research_url', label: 'Company Verification', status: 'running', message: `Verifying "${prospect.companyName}" identity...` });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'Company Verification', message: `Verifying "${prospect.companyName}"...` });
    try {
      const identity = await withTimeout(
        () => extractCompanyIdentity(crawlResult),
        45_000, 'Company identity extraction',
      );
      if (identity) {
        if (identity.verifiedName && identity.confidence !== 'low') {
          prospect.companyName = identity.verifiedName;
        }
        if (identity.alternateNames?.length) {
          if (!prospect.legalName && identity.alternateNames[0]) {
            prospect.legalName = identity.alternateNames[0];
          }
        }
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = `Verified: ${identity.verifiedName} (confidence: ${identity.confidence})`;
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });

        // Smart Verified Web Search
        steps.push({ type: 'research_url', label: 'Verified Web Search', status: 'running', message: `Searching for verified info about ${identity.verifiedName}...` });
        stepIdx++;
        onProgress?.('step_start', { stepIndex: stepIdx, label: 'Verified Web Search', message: `Searching for verified info about ${identity.verifiedName}...` });
        try {
          const verifiedResults = await withTimeout(
            () => smartCompanySearch(identity, 10),
            60_000, 'Smart company search',
          );
          const matchedResults = verifiedResults.filter(r => r.isVerifiedMatch && r.matchConfidence >= 0.6);
          sources.push(...matchedResults.map(r => r.url));

          if (matchedResults.length > 0) {
            const topVerified = matchedResults.slice(0, 3);
            const readResults = await Promise.allSettled(
              topVerified.map(r => withTimeout(() => webRead(r.url), 25_000, `Verified read: ${r.url.slice(0, 50)}`)),
            );
            const webContents: string[] = [];
            for (const result of readResults) {
              if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
                webContents.push(result.value.data.content.slice(0, 4000));
              }
            }
            if (webContents.length > 0) {
              // Structured extraction first
              const verifiedSnippets: SearchSnippet[] = matchedResults.slice(0, 5).map(r => ({ title: r.title || '', snippet: r.snippet || '', url: r.url }));
              extractStructuredFromSnippets(prospect, verifiedSnippets);

              // Then LLM extraction
              const deepData = await withTimeout(
                () => callLLMForJSON<Partial<ProspectResult>>(
                  `Extract additional business data about "${identity.verifiedName}" from these VERIFIED web results.
Return JSON: legalName, industry, subIndustry, hqAddress, city, stateProvince, country, employeeCount, revenueEstimate, foundingYear, ownershipType, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, linkedinUrl, twitterHandle, techStack (array), boardMembers (array), recentNews (array), fundingInfo. Use null for not found.`,
                  webContents.join('\n---\n'),
                ),
                45_000, 'Verified deep LLM',
              );
              if (deepData) {
                safeMerge(prospect, deepData);
              }
            }
          }
          steps[stepIdx].status = 'completed';
          steps[stepIdx].message = `Found ${matchedResults.length} verified results about ${identity.verifiedName}`;
          onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
          onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
        } catch {
          steps[stepIdx].status = 'completed';
          steps[stepIdx].message = 'Verified search partially completed';
          onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        }
      } else {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'Company verification skipped (limited data)';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
      }
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Company verification partially completed';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    }
    stepIdx++;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 5: Targeted Category Searches for identified company (PARALLEL)
  // ═══════════════════════════════════════════════════════════
  const companyName = prospect.companyName;
  if (companyName) {
    steps.push({ type: 'research_url', label: 'Targeted Searches', status: 'running', message: `Running targeted searches for "${companyName}"...` });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'Targeted Searches', message: `Running targeted searches for "${companyName}"...` });

    try {
      const targetedQueries = [
        `"${companyName}" email phone contact`,
        `"${companyName}" CEO founder leadership team`,
        `"${companyName}" revenue employees funding`,
        `"${companyName}" LinkedIn Twitter social media`,
      ];

      const searchResults = await Promise.allSettled(
        targetedQueries.map(q => withTimeout(() => exaSearch(q, 3), 25_000, `Targeted search: ${q.slice(0, 40)}`)),
      );

      const allTargetedSnippets: SearchSnippet[] = [];
      const urlsToRead: string[] = [];
      const seenUrls = new Set<string>();

      for (const result of searchResults) {
        if (result.status === 'fulfilled' && result.value && typeof result.value === 'object' && 'success' in result.value && (result.value as {success: boolean}).success && 'data' in result.value && Array.isArray((result.value as {data: unknown}).data)) {
          const data = (result.value as {data: Array<{title: string; url: string; snippet: string}>}).data;
          sources.push(...data.map(r => r.url));
          for (const r of data) {
            allTargetedSnippets.push({ title: r.title, snippet: r.snippet || '', url: r.url });
            if (!seenUrls.has(r.url)) {
              seenUrls.add(r.url);
              urlsToRead.push(r.url);
            }
          }
        }
      }

      // Regex extraction from targeted snippets
      if (allTargetedSnippets.length > 0) {
        extractStructuredFromSnippets(prospect, allTargetedSnippets);
      }

      // Read and LLM extract from top URLs
      if (urlsToRead.length > 0) {
        const readResults = await Promise.allSettled(
          urlsToRead.slice(0, 4).map(u => withTimeout(() => webRead(u), 25_000, `Targeted read: ${u.slice(0, 50)}`)),
        );
        const webContents: string[] = [];
        for (const result of readResults) {
          if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
            webContents.push(result.value.data.content.slice(0, 4000));
          }
        }

        if (webContents.length > 0) {
          const targetedData = await withTimeout(
            () => callLLMForJSON<Partial<ProspectResult>>(
              `Extract ALL available business data about "${companyName}" from this content. Focus on filling gaps.
Return JSON: companyName, industry, hqAddress, city, stateProvince, country, phoneMain, generalEmail, supportEmail, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, employeeCount, revenueEstimate, foundingYear, linkedinUrl, twitterHandle, techStack (array), boardMembers (array), productsServices (array), partners (array), fundingInfo, description. Use null for not found.`,
              webContents.join('\n---\n'),
              { retriesPerModel: 1, useFallback: true },
            ),
            30_000, 'Targeted LLM extraction',
          );
          if (targetedData) {
            safeMerge(prospect, targetedData);
          }
        }
      }

      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = `Targeted searches completed`;
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'Targeted searches partially completed';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
    }
    stepIdx++;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 6: LinkedIn Company Search
  // ═══════════════════════════════════════════════════════════
  if (companyName) {
    steps.push({ type: 'research_url', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
    onProgress?.('step_start', { stepIndex: stepIdx, label: 'LinkedIn Search', message: 'Searching LinkedIn...' });
    try {
      const liResult = await withTimeout(
        () => linkedInSearchCompanies(companyName, 3),
        20_000, 'LinkedIn search',
      );
      if (liResult?.success && liResult.data.length > 0) {
        const company = liResult.data[0];
        if (company.headline && !prospect.description) prospect.description = company.headline;
        if (company.url && !prospect.linkedinUrl) prospect.linkedinUrl = company.url;
        if (company.location && !prospect.hqAddress) prospect.hqAddress = company.location;
        if (company.location) {
          if (!prospect.city) {
            const cityMatch = company.location.match(/^([A-Z][a-zA-Z\s]+?)(?:,|\s*-|\s*$)/);
            if (cityMatch) prospect.city = cityMatch[1].trim();
          }
          if (!prospect.country) {
            const countryMatch = company.location.match(/,\s*([A-Z][a-zA-Z\s]+)$/);
            if (countryMatch) prospect.country = countryMatch[1].trim();
          }
        }
        sources.push(`linkedin:${company.url || companyName}`);
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'Found LinkedIn profile';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } else {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'No LinkedIn profile found';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
      }
    } catch {
      steps[stepIdx].status = 'completed';
      steps[stepIdx].message = 'LinkedIn search unavailable';
      onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: null });
    }
    stepIdx++;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 7: Targeted Gap Fill (PARALLEL)
  // ═══════════════════════════════════════════════════════════
  const gapName = prospect.companyName || '';
  if (gapName) {
    const gapCategories: Array<{ category: string; query: string }> = [];

    if (!prospect.generalEmail && !prospect.supportEmail && !prospect.phoneMain) {
      gapCategories.push({ category: 'contact', query: `"${gapName}" contact email phone` });
    }
    if (!prospect.ceoName && !prospect.keyContactName) {
      gapCategories.push({ category: 'people', query: `"${gapName}" CEO founder leadership team` });
    }
    if (!prospect.employeeCount && !prospect.revenueEstimate) {
      gapCategories.push({ category: 'firmographics', query: `"${gapName}" revenue employees funding Crunchbase` });
    }
    if (!prospect.linkedinUrl) {
      gapCategories.push({ category: 'linkedin', query: `"${gapName}" LinkedIn company page` });
    }

    if (gapCategories.length > 0) {
      steps.push({ type: 'research_url', label: 'Gap Fill', status: 'running', message: `Filling ${gapCategories.length} gaps in parallel...` });
      onProgress?.('step_start', { stepIndex: stepIdx, label: 'Gap Fill', message: `Filling data gaps: ${gapCategories.map(g => g.category).join(', ')}...` });

      try {
        const gapPromises = gapCategories.map(async (gap) => {
          const gapResult = await withTimeout(
            () => exaSearch(gap.query, 3),
            20_000, `Gap search: ${gap.category}`,
          );
          if (!gapResult?.success || gapResult.data.length === 0) return;

          sources.push(...gapResult.data.map(r => r.url));
          const gapSnippets: SearchSnippet[] = gapResult.data.map(r => ({ title: r.title, snippet: r.snippet || '', url: r.url }));
          extractStructuredFromSnippets(prospect, gapSnippets);

          const topUrl = gapResult.data[0]?.url;
          if (topUrl) {
            const readResult = await withTimeout(() => webRead(topUrl), 20_000, `Gap read: ${gap.category}`);
            if (readResult?.success) {
              const gapData = await withTimeout(
                () => callLLMForJSON<Partial<ProspectResult>>(
                  `Extract ${gap.category === 'contact' ? 'email addresses and phone numbers' : gap.category === 'people' ? 'CEO and leadership names' : gap.category === 'firmographics' ? 'revenue, employee count, funding info' : 'LinkedIn URL'} for "${gapName}" from this content. Return JSON with relevant fields from: generalEmail, supportEmail, phoneMain, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, employeeCount, revenueEstimate, fundingInfo, linkedinUrl, boardMembers (array). Use null for not found.`,
                  readResult.data.content.slice(0, 4000),
                  { retriesPerModel: 1, useFallback: true },
                ),
                30_000, `Gap LLM: ${gap.category}`,
              );
              if (gapData) {
                safeMerge(prospect, gapData);
              }
            }
          }
        });

        await Promise.allSettled(gapPromises);

        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = `Filled ${gapCategories.length} data gap${gapCategories.length > 1 ? 's' : ''}`;
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } catch {
        steps[stepIdx].status = 'completed';
        steps[stepIdx].message = 'Gap fill partially completed';
        onProgress?.('step_complete', { stepIndex: stepIdx, status: 'completed', message: steps[stepIdx].message, partialData: prospect });
      }
      stepIdx++;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 8: Calculate completeness and return
  // ═══════════════════════════════════════════════════════════
  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return { prospect, steps };
}

// ============================================================
// Market Analysis Action
// ============================================================

export async function executeMarketAnalysis(
  query: string,
): Promise<{ market: MarketResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];

  steps.push({ type: 'analyze_market', label: 'Market Search', status: 'running', message: `Researching "${query}"...` });
  try {
    const searchResult = await withTimeout(
      () => exaSearch(`${query} market size trends analysis 2024 2025`, 10),
      30_000, 'Market search',
    );
    if (searchResult?.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} sources`;

      // Read top results
      const topUrls = searchResult.data.slice(0, 4).map(r => r.url);
      const readResults = await Promise.allSettled(
        topUrls.map(u => withTimeout(() => webRead(u), 20_000, `Market read: ${u.slice(0, 50)}`)),
      );
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
          webContents.push(result.value.data.content.slice(0, 4000));
        }
      }

      steps.push({ type: 'analyze_market', label: 'AI Analysis', status: 'running', message: 'Analyzing market data with AI...' });
      if (webContents.length > 0) {
        const analysis = await withTimeout(
          () => callLLMForJSON<MarketResult>(
            `You are a market analyst. Analyze the following web content about "${query}" and provide a comprehensive market analysis.
Return JSON:
{
  "query": "${query}",
  "summary": "<2-3 sentence executive summary>",
  "keyFindings": ["<finding 1>", "<finding 2>", ...],
  "competitors": [{"name": "...", "description": "...", "strengths": ["..."], "weaknesses": ["..."]}],
  "trends": ["<trend 1>", ...],
  "opportunities": ["<opportunity 1>", ...],
  "sources": []
}`,
            webContents.join('\n---\n'),
          ),
          60_000, 'Market LLM analysis',
        );
        if (analysis) {
          analysis.sources = [...new Set(sources)];
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = 'Market analysis complete';
          return { market: analysis, steps };
        }
      }
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Market search failed';
  }

  return { market: null, steps };
}

// ============================================================
// Competitive Analysis Action
// ============================================================

export async function executeCompetitiveAnalysis(
  query: string,
): Promise<{ market: MarketResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];

  steps.push({ type: 'analyze_competitors', label: 'Competitor Search', status: 'running', message: `Finding competitors for "${query}"...` });
  try {
    const searchResult = await withTimeout(
      () => exaSearch(`${query} competitors alternatives comparison`, 10),
      30_000, 'Competitor search',
    );
    if (searchResult?.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      const topUrls = searchResult.data.slice(0, 4).map(r => r.url);
      const readResults = await Promise.allSettled(
        topUrls.map(u => withTimeout(() => webRead(u), 20_000, `Competitor read: ${u.slice(0, 50)}`)),
      );
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && isSuccessfulWebRead(result.value)) {
          webContents.push(result.value.data.content.slice(0, 4000));
        }
      }

      steps[steps.length - 1].status = 'completed';
      steps.push({ type: 'analyze_competitors', label: 'AI Analysis', status: 'running', message: 'Analyzing competitive landscape...' });
      if (webContents.length > 0) {
        const analysis = await withTimeout(
          () => callLLMForJSON<MarketResult>(
            `You are a competitive intelligence analyst. Analyze the following content about "${query}" and provide a competitive analysis.
Return JSON:
{
  "query": "${query}",
  "summary": "<executive summary of competitive landscape>",
  "keyFindings": ["<key competitive insights>"],
  "competitors": [{"name": "...", "description": "...", "strengths": ["..."], "weaknesses": ["..."]}],
  "trends": ["<competitive trends>"],
  "opportunities": ["<market opportunities>"],
  "sources": []
}`,
            webContents.join('\n---\n'),
          ),
          60_000, 'Competitor LLM analysis',
        );
        if (analysis) {
          analysis.sources = [...new Set(sources)];
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = 'Competitive analysis complete';
          return { market: analysis, steps };
        }
      }
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Competitive search failed';
  }

  return { market: null, steps };
}

// ============================================================
// ICP Building Action
// ============================================================

export async function executeICPBuilding(
  userMessage: string,
  existingICP: ICPResult | null,
): Promise<{ icp: ICPResult | null; response: string; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];

  steps.push({ type: 'build_icp', label: 'ICP Analysis', status: 'running', message: 'Analyzing ICP criteria...' });
  try {
    const result = await withTimeout(
      () => callLLMForJSON<{
        acknowledgment: string;
        extractedCriteria: Record<string, unknown>;
        nextQuestion: string;
        isComplete: boolean;
        icpSummary: string;
      }>(
        `You are building an Ideal Customer Profile. Parse the user's input and extract ICP criteria.

EXISTING ICP: ${existingICP ? JSON.stringify(existingICP) : 'None yet'}
USER INPUT: "${userMessage}"

Return JSON:
{
  "acknowledgment": "<what you understood>",
  "extractedCriteria": {
    "industries": [], "companySizes": [], "locations": [], "revenueRange": null,
    "requiredTech": [], "challenges": [], "goals": [], "buyingSignals": [], "budgetRange": null
  },
  "nextQuestion": "<next question to ask>",
  "isComplete": false,
  "icpSummary": "<summary so far>"
}`,
        userMessage,
      ),
      30_000, 'ICP building',
    );

    if (result) {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'ICP criteria analyzed';

      // Build ICP object from extracted criteria
      const criteria = result.extractedCriteria;
      const icp: ICPResult = existingICP || {
        name: 'Custom ICP',
        description: '',
        firmographic: { industries: [], companySizes: [], locations: [], revenueRange: '' },
        technographic: { requiredTech: [], preferredTech: [] },
        psychographic: { values: [], challenges: [], goals: [] },
        behavioral: { buyingSignals: [], engagementPatterns: [] },
        economic: { budgetRange: '', decisionTimeline: '' },
        criteria: '',
      };

      // Merge extracted criteria
      if (Array.isArray(criteria.industries)) icp.firmographic.industries = [...new Set([...icp.firmographic.industries, ...criteria.industries as string[]])];
      if (Array.isArray(criteria.companySizes)) icp.firmographic.companySizes = [...new Set([...icp.firmographic.companySizes, ...criteria.companySizes as string[]])];
      if (Array.isArray(criteria.locations)) icp.firmographic.locations = [...new Set([...icp.firmographic.locations, ...criteria.locations as string[]])];
      if (criteria.revenueRange) icp.firmographic.revenueRange = criteria.revenueRange as string;
      if (Array.isArray(criteria.requiredTech)) icp.technographic.requiredTech = [...new Set([...icp.technographic.requiredTech, ...criteria.requiredTech as string[]])];
      if (Array.isArray(criteria.challenges)) icp.psychographic.challenges = [...new Set([...icp.psychographic.challenges, ...criteria.challenges as string[]])];
      if (Array.isArray(criteria.goals)) icp.psychographic.goals = [...new Set([...icp.psychographic.goals, ...criteria.goals as string[]])];
      if (Array.isArray(criteria.buyingSignals)) icp.behavioral.buyingSignals = [...new Set([...icp.behavioral.buyingSignals, ...criteria.buyingSignals as string[]])];
      if (criteria.budgetRange) icp.economic.budgetRange = criteria.budgetRange as string;

      icp.description = result.icpSummary || icp.description;
      icp.criteria = JSON.stringify(criteria);

      return { icp, response: `${result.acknowledgment}\n\n${result.nextQuestion}`, steps };
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'ICP analysis failed';
  }

  return { icp: existingICP, response: 'I had trouble processing your ICP criteria. Could you try rephrasing?', steps };
}

// ============================================================
// Lead Scoring Action
// ============================================================

export async function executeLeadScoring(
  prospect: ProspectResult,
  icp: ICPResult | null,
): Promise<{ score: ScoreResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];

  steps.push({ type: 'score_lead', label: 'Scoring Lead', status: 'running', message: 'Evaluating lead quality...' });
  try {
    const icpContext = icp ? `ICP Criteria: ${JSON.stringify(icp)}` : 'No ICP defined — using general B2B best practices';
    const result = await withTimeout(
      () => callLLMForJSON<ScoreResult>(
        `You are a lead qualification expert. Score this prospect against the ICP.
${icpContext}

PROSPECT DATA:
${JSON.stringify(prospect, null, 2)}

Return JSON:
{
  "overallScore": <0-100>,
  "tier": "<ideal|strong|moderate|weak|poor>",
  "dimensions": {
    "firmographic": {"score": <0-100>, "reasoning": "<why>"},
    "technographic": {"score": <0-100>, "reasoning": "<why>"},
    "psychographic": {"score": <0-100>, "reasoning": "<why>"},
    "behavioral": {"score": <0-100>, "reasoning": "<why>"},
    "situational": {"score": <0-100>, "reasoning": "<why>"},
    "economic": {"score": <0-100>, "reasoning": "<why>"}
  },
  "recommendation": "<specific next step>"
}`,
        `Score this lead: ${prospect.companyName || prospect.personName}`,
      ),
      30_000, 'Lead scoring',
    );

    if (result) {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Lead scored: ${result.tier} (${result.overallScore}/100)`;
      return { score: result, steps };
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Lead scoring failed';
  }

  return { score: null, steps };
}

// ============================================================
// Outreach Composition Action
// ============================================================

export async function executeOutreachComposition(
  prospect: ProspectResult,
  channel: string = 'email',
): Promise<{ outreach: OutreachResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];

  steps.push({ type: 'compose_outreach', label: 'Researching Target', status: 'running', message: 'Researching company for personalization...' });

  // Quick company research for personalization
  let companyContext = '';
  try {
    const companyName = prospect.companyName || prospect.personCompany;
    if (companyName) {
      const searchResult = await withTimeout(
        () => exaSearch(`${companyName} challenges news recent`, 3),
        15_000, 'Outreach research',
      );
      if (searchResult?.success && searchResult.data[0]) {
        const readResult = await withTimeout(() => webRead(searchResult.data[0].url), 15_000, 'Outreach read');
        if (readResult?.success) {
          companyContext = readResult.data.content.slice(0, 3000);
        }
      }
    }
  } catch {
    // Continue without extra context
  }

  steps[steps.length - 1].status = 'completed';
  steps.push({ type: 'compose_outreach', label: 'Composing Message', status: 'running', message: `Writing personalized ${channel} message...` });

  try {
    const result = await withTimeout(
      () => callLLMForJSON<OutreachResult>(
        `You are an outreach expert. Compose a hyper-personalized ${channel} message for this prospect.

PROSPECT:
${JSON.stringify(prospect, null, 2)}

COMPANY CONTEXT:
${companyContext || 'No additional context available'}

Return JSON:
{
  "channel": "${channel}",
  "subject": "<compelling subject line for email, or connection request note for LinkedIn>",
  "body": "<the full message body, personalized and concise>",
  "tone": "<professional|friendly|consultative>",
  "personalizationHooks": ["<specific detail 1 referenced>", "<specific detail 2 referenced>"],
  "cta": "<the call to action>"
}

Rules:
- Reference SPECIFIC details about the company (not generic)
- Keep email under 150 words, LinkedIn under 300 characters
- Include a clear, low-friction CTA
- Match tone to the prospect's seniority level`,
        `Compose ${channel} outreach for ${prospect.companyName || prospect.personName}`,
      ),
      30_000, 'Outreach composition',
    );

    if (result) {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `${channel} message composed`;
      return { outreach: result, steps };
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Outreach composition failed';
  }

  return { outreach: null, steps };
}

// ============================================================
// Generate Conversational Response
// ============================================================

export async function generateConversationResponse(
  persona: string,
  intent: UserIntent,
  userMessage: string,
  actionResults: string,
  context?: ConversationContext,
): Promise<string> {
  // ─── STRICT TIMEOUT ───────────────────────────────────────────
  // The synthesis LLM call is the LAST step of the pipeline. If Z.AI is
  // rate-limited, this call can stall for 30s + 45s + 60s = 135s while
  // callLLM exhausts its retries. We race against a 20s hard timeout
  // so the user gets a response (from the structured fallback) within
  // ~20s instead of waiting 2+ minutes.
  //
  // The structured fallback already produces a useful, data-rich response
  // (see buildFallbackResponse below), so a timeout here is not a quality
  // regression — it just means we use the deterministic response instead
  // of waiting for the LLM to write prose.
  const SYNTHESIS_TIMEOUT_MS = 20_000;

  const structured = (): string => {
    const s = generateStructuredFallback({
      persona, intent, userMessage, actionSummary: actionResults,
    });
    return (s && s.trim().length > 0) ? s : buildFallbackResponse(intent, actionResults);
  };

  try {
    const llmPromise = callLLM({
      systemPrompt: getConversationResponsePrompt(
        persona as 'scout' | 'hound' | 'analyst' | 'architect' | 'judge' | 'scribe' | 'navigator',
        intent,
        userMessage,
        actionResults,
        context,
      ),
      userMessage: 'Generate your conversational response based on the action results above.',
      // Only 1 retry per model (was 2) — the timeout will catch the rest.
      retriesPerModel: 1,
      // Standard thinking budget — synthesis doesn't need deep reasoning
      thinkingBudget: 'standard',
    });

    const timeoutPromise = new Promise<string | null>((resolve) => {
      setTimeout(() => {
        console.warn(`[generateConversationResponse] LLM synthesis timed out after ${SYNTHESIS_TIMEOUT_MS}ms — using structured fallback`);
        resolve(null);
      }, SYNTHESIS_TIMEOUT_MS);
    });

    const response = await Promise.race([llmPromise, timeoutPromise]);

    if (response && response.trim().length > 0) return response;

    // LLM returned null/empty OR timed out — use structured fallback
    return structured();
  } catch {
    // LLM call threw — use structured fallback
    return structured();
  }
}

/**
 * Build a simple fallback response when the LLM is unavailable.
 * Extracts key data from the action results to provide a useful response
 * even without AI-generated prose.
 */
function buildFallbackResponse(intent: UserIntent, actionResults: string): string {
  try {
    const data = JSON.parse(actionResults);

    switch (intent) {
      case 'research_company':
      case 'research_url': {
        const company = data.company || data.companyName || 'the company';
        const industry = data.industry || '';
        const employees = data.employees || data.employeeCount || '';
        const website = data.website || '';
        const email = data.email || data.generalEmail || '';
        const ceo = data.ceo || data.ceoName || '';
        const parts = [`Here's what I found about **${company}**:`];
        if (industry) parts.push(`- **Industry:** ${industry}`);
        if (employees) parts.push(`- **Employees:** ${employees}`);
        if (website) parts.push(`- **Website:** ${website}`);
        if (email) parts.push(`- **Email:** ${email}`);
        if (ceo) parts.push(`- **CEO:** ${ceo}`);
        parts.push('\n*I had limited AI processing — try again for a more detailed analysis.*');
        return parts.join('\n');
      }
      case 'research_person': {
        const person = data.person || data.personName || 'the person';
        const title = data.title || data.personTitle || '';
        const company = data.company || data.personCompany || '';
        const parts = [`Here's what I found about **${person}**:`];
        if (title) parts.push(`- **Title:** ${title}`);
        if (company) parts.push(`- **Company:** ${company}`);
        parts.push('\n*I had limited AI processing — try again for a more detailed profile.*');
        return parts.join('\n');
      }
      case 'score_lead': {
        const score = data.overallScore || 'N/A';
        const tier = data.tier || 'unknown';
        return `**Lead Score: ${score}/100** (${tier} tier)\n\n*I had limited AI processing — try again for detailed scoring.*`;
      }
      default:
        return 'I completed my research but had trouble generating a detailed summary. Please check the results above or try again.';
    }
  } catch {
    return 'I completed my research but had trouble generating a summary. Please try again for a more detailed response.';
  }
}

// ============================================================
// Helpers
// ============================================================

function createEmptyProspect(queryType: string, query: string): ProspectResult {
  return {
    queryType, query,
    companyName: null, legalName: null, website: null, industry: null, subIndustry: null, description: null,
    hqAddress: null, city: null, stateProvince: null, country: null, postalCode: null,
    phoneMain: null, generalEmail: null, supportEmail: null,
    ceoName: null, ceoEmail: null, keyContactName: null, keyContactTitle: null, keyContactEmail: null,
    employeeCount: null, revenueEstimate: null, foundingYear: null, ownershipType: null,
    linkedinUrl: null, twitterHandle: null, facebookPage: null, techStack: [],
    boardMembers: [], recentNews: [], productsServices: [], partners: [], fundingInfo: null,
    personName: null, personTitle: null, personCompany: null, personEmail: null,
    personPhone: null, personLinkedin: null, personBio: null,
    sources: [], dataCompleteness: 0,
  };
}

// ============================================================
// Domain Hint Extraction (Regex-based, no LLM)
// Extracts structured domain data from search snippets using
// pattern matching — fast and always works.
// ============================================================

function extractDomainHintsFromSnippets(
  snippets: SearchSnippet[],
  domain: { domain: string; requiredKPIs: string[]; schemaTemplate: Record<string, unknown> },
): Record<string, unknown> | null {
  // Clean snippets of DuckDuckGo artifacts before processing
  const cleanText = (s: string) => s
    .replace(/&rut=[a-f0-9]+/g, '')
    .replace(/uddg=[^\s&"')]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const allText = snippets.map(r => `${r.title} ${cleanText(r.snippet)}`).join(' ');
  if (allText.length < 50) return null;

  const hints: Record<string, unknown> = {};

  // Common patterns across domains
  // Fund/firm name
  const firmMatch = allText.match(/(?:firm|fund|company|capital|ventures|partners|group)\s+name[:\s]+([A-Z][a-zA-Z\s&]+?)(?:\.|,|;|$)/i);
  if (firmMatch) hints.firm_name = firmMatch[1].trim();

  // Fund name
  const fundMatch = allText.match(/(?:fund\s+(?:name|title)|called)\s*[:\-]?\s*([A-Z][a-zA-Z\s\d]+?(?:Fund|LP|LLC|Ltd|I+V?|Growth|Capital|Ventures))/i);
  if (fundMatch) hints.fund_name = fundMatch[1].trim();

  // Fund type / strategy
  const typeMatch = allText.match(/(?:fund\s+type|strategy|focus|style)\s*[:\-]?\s*([A-Z][a-zA-Z\s&]+?)(?:\.|,|;|fund|$)/i);
  if (typeMatch) hints.fund_type = typeMatch[1].trim();

  // Dry powder / fund size
  const dryPowderMatch = allText.match(/(?:dry\s*powder|fund\s+size|AUM|assets\s+under\s+management|capital\s+committed|total\s+capital)\s*(?:of|is|[:\-]?\s*)\$?([\d.]+\s*(?:billion|million|B|M|bn|mm))/i);
  if (dryPowderMatch) {
    const val = dryPowderMatch[1].replace(/\s+/g, '').toLowerCase();
    let num = parseFloat(val);
    if (val.includes('b') || val.includes('bn')) num *= 1000000000;
    else if (val.includes('m') || val.includes('mm')) num *= 1000000;
    hints.estimated_dry_powder_usd = num;
  }

  // Vintage year
  const vintageMatch = allText.match(/(?:vintage|fund\s+year|launched|raised)\s*(?:year|in)?\s*[:\-]?\s*(20\d{2})/i);
  if (vintageMatch) hints.vintage_year = parseInt(vintageMatch[1]);

  // Geographic focus
  const geoMatch = allText.match(/(?:geograph|focus|region|target)\s*(?:focus|area|market)?\s*[:\-]?\s*([A-Z][a-zA-Z\s,]+?)(?:\.|;|,?\s+(?:and|with|focus|invest))/i);
  if (geoMatch) hints.geographic_focus = geoMatch[1].trim();

  // Target deployment countries
  const countryPatterns = ['United States', 'Canada', 'United Kingdom', 'Europe', 'Asia', 'Israel', 'Singapore', 'Germany', 'France', 'Japan', 'Australia'];
  const foundCountries = countryPatterns.filter(c => allText.includes(c));
  if (foundCountries.length > 0) hints.target_deployment_countries = foundCountries;

  // LLC / legal entity
  const llcMatch = allText.match(/([A-Z][a-zA-Z\s]+(?:LLC|L\.P\.|Ltd|Inc|GmbH|LLP|Pte))/g);
  if (llcMatch) hints.associated_llc = llcMatch[0].trim();

  // Sector focus
  const sectorMatch = allText.match(/(?:sector|industry)\s*(?:focus|preference)?\s*[:\-]?\s*([A-Z][a-zA-Z\s,]+?)(?:\.|;|,?\s+(?:and|with|invest))/i);
  if (sectorMatch) hints.sector_focus = sectorMatch[1].trim();

  // KPIs
  const kpis: Record<string, unknown> = {};

  // IRR
  const irrMatch = allText.match(/(?:target\s+)?IRR\s*(?:of|is|[:\-]?\s*)([\d.]+)\s*%/i);
  if (irrMatch) kpis.target_irr_percentage = parseFloat(irrMatch[1]);

  // TVPI
  const tvpiMatch = allText.match(/TVPI\s*(?:of|is|[:\-]?\s*)([\d.]+)x/i);
  if (tvpiMatch) kpis.historical_tvpi = parseFloat(tvpiMatch[1]);

  // DPI
  const dpiMatch = allText.match(/DPI\s*(?:of|is|[:\-]?\s*)([\d.]+)x/i);
  if (dpiMatch) kpis.historical_dpi = parseFloat(dpiMatch[1]);

  if (Object.keys(kpis).length > 0) hints.kpis = kpis;

  // Sources
  hints.sources = snippets.slice(0, 3).map(s => s.url);

  return Object.keys(hints).length > 0 ? hints : null;
}

function calculateCompleteness(p: ProspectResult): number {
  // Weighted, query-type-aware completeness calculation.
  // Company/URL queries weight company sections higher;
  // Person queries weight person sections higher.
  const sections: { name: string; weight: number; fields: (string | null)[]; arrayFields?: string[][] }[] = [];

  if (p.queryType === 'company' || p.queryType === 'url') {
    sections.push(
      { name: 'identity', weight: 25, fields: [p.companyName, p.website, p.description, p.industry] },
      { name: 'contact', weight: 20, fields: [p.phoneMain, p.generalEmail, p.supportEmail, p.hqAddress] },
      { name: 'location', weight: 10, fields: [p.city, p.stateProvince, p.country, p.postalCode] },
      { name: 'firmographics', weight: 15, fields: [p.employeeCount, p.revenueEstimate, p.foundingYear, p.ownershipType, p.legalName, p.subIndustry] },
      { name: 'people', weight: 15, fields: [p.ceoName, p.ceoEmail, p.keyContactName, p.keyContactTitle, p.keyContactEmail], arrayFields: [p.boardMembers] },
      { name: 'digital', weight: 10, fields: [p.linkedinUrl, p.twitterHandle, p.facebookPage] },
      { name: 'offerings', weight: 5, fields: [p.fundingInfo], arrayFields: [p.techStack, p.productsServices, p.recentNews, p.partners] },
    );
  } else {
    // Person-focused
    sections.push(
      { name: 'identity', weight: 30, fields: [p.personName, p.personTitle, p.personEmail] },
      { name: 'professional', weight: 25, fields: [p.personCompany, p.personLinkedin, p.personBio, p.personPhone] },
      { name: 'company', weight: 25, fields: [p.companyName, p.industry, p.website] },
      { name: 'digital', weight: 10, fields: [p.linkedinUrl, p.twitterHandle] },
      { name: 'extra', weight: 10, fields: [p.city, p.country], arrayFields: [p.techStack] },
    );
  }

  let totalWeight = 0;
  let earnedWeight = 0;
  for (const section of sections) {
    const allFields = [...section.fields, ...(section.arrayFields || [])];
    let filled = 0;
    for (const f of section.fields) { if (f) filled++; }
    for (const a of (section.arrayFields || [])) { if (a.length > 0) filled++; }
    const sectionScore = filled / allFields.length;
    earnedWeight += sectionScore * section.weight;
    totalWeight += section.weight;
  }
  return Math.round((earnedWeight / totalWeight) * 100);
}

function safeMerge(target: ProspectResult, source: Partial<ProspectResult>): void {
  const arrayKeys = new Set(['techStack', 'boardMembers', 'recentNews', 'productsServices', 'partners', 'sources']);
  // Fields where LLM may return a number but we need a string
  const stringKeys = new Set([
    'employeeCount', 'revenueEstimate', 'foundingYear', 'dataCompleteness',
  ]);
  const targetAny = target as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (arrayKeys.has(key)) {
      if (Array.isArray(value) && value.length > 0) {
        targetAny[key] = value;
      }
    } else if (stringKeys.has(key) && typeof value === 'number') {
      // LLM returned a number where we need a string
      targetAny[key] = String(value);
    } else {
      if (value !== null && value !== '') {
        // Also convert numbers to strings for any string-type fields
        if (typeof value === 'number' && !arrayKeys.has(key)) {
          targetAny[key] = String(value);
        } else {
          targetAny[key] = value;
        }
      }
    }
  }
}
