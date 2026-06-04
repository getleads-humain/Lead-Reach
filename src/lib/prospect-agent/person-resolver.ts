// ============================================================
// Person Identity Resolution Engine
// ============================================================
//
// When a user provides an email, name, or other person identifier,
// this engine finds the EXACT person — not someone with a similar name.
//
// Strategies:
//
// 1. EMAIL-BASED: Parse domain → identify company → narrow search
// 2. NAME-BASED: Multi-signal disambiguation (company, title, location)
// 3. LINKEDIN MATCHING: Verify LinkedIn profiles belong to the target person
// 4. CROSS-REFERENCE: Confirm identity across multiple independent sources
//
// The key insight: a person's identity is VERIFIED when multiple
// independent sources converge on the same set of facts.

import { callLLMForJSON } from '@/lib/llm';
import { exaSearch, webRead, linkedInSearchPeople } from '@/lib/agent-reach-bridge';

// ─── Types ───

export interface PersonIdentity {
  /** Full name as verified */
  fullName: string;
  /** Possible name variations / nicknames */
  nameVariations: string[];
  /** Email if provided */
  email: string | null;
  /** Email domain — tells us their company */
  emailDomain: string | null;
  /** Company inferred from email domain or search */
  associatedCompany: string | null;
  /** Job title */
  title: string | null;
  /** Location */
  location: string | null;
  /** LinkedIn profile URL (verified) */
  linkedinUrl: string | null;
  /** Unique identifying signals */
  distinguishingSignals: string[];
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low';
}

export interface ResolvedPerson {
  identity: PersonIdentity;
  /** All sources that confirmed this person's identity */
  verificationSources: string[];
  /** How many independent sources confirmed this is the right person */
  verificationCount: number;
  /** Cross-referenced data from multiple sources */
  mergedData: Record<string, unknown>;
}

// ─── Email Intelligence ───

/**
 * Extract intelligence from an email address.
 * "john@acmecorp.com" → { localPart: "john", domain: "acmecorp.com", company: "Acme Corp" }
 */
function analyzeEmail(email: string): {
  localPart: string;
  domain: string;
  inferredCompany: string | null;
  isPersonalEmail: boolean;
} {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) {
    return { localPart: email, domain: '', inferredCompany: null, isPersonalEmail: true };
  }
  
  // Common personal email providers — these don't tell us the company
  const personalProviders = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com',
    'icloud.com', 'me.com', 'protonmail.com', 'zoho.com', 'yandex.com',
    'qq.com', '163.com', '126.com', 'mail.com', 'gmx.com',
  ];
  
  const isPersonalEmail = personalProviders.includes(domain.toLowerCase());
  
  // Infer company name from domain
  let inferredCompany: string | null = null;
  if (!isPersonalEmail) {
    // Remove common prefixes/suffixes
    const cleaned = domain
      .replace(/^(www\.|mail\.|email\.)/i, '')
      .replace(/\.(com|co|io|net|org|inc|corp|biz|tech|ai|dev)$/i, '');
    
    // Convert to title case
    inferredCompany = cleaned
      .split(/[.\-_]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  
  return { localPart, domain, inferredCompany, isPersonalEmail };
}

/**
 * Guess name from email local part.
 * "john.smith" → "John Smith", "jsmith" → "J Smith"
 */
function guessNameFromEmail(localPart: string): string | null {
  // Remove common prefixes/suffixes
  const cleaned = localPart
    .replace(/^\d+/, '')
    .replace(/\d+$/, '')
    .replace(/^(mailto:)/i, '');
  
  // Try dot-separated: john.smith → John Smith
  if (cleaned.includes('.')) {
    return cleaned.split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Try underscore-separated: john_smith → John Smith
  if (cleaned.includes('_')) {
    return cleaned.split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Try hyphen-separated: john-smith → John Smith
  if (cleaned.includes('-')) {
    return cleaned.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  // Can't reliably parse — return null
  return null;
}

// ─── Person Resolution ───

/**
 * Resolve a person's identity from an email address.
 * This is the MOST reliable way to find someone because the email domain
 * tells us their company, which massively narrows the search.
 */
export async function resolveFromEmail(
  email: string,
): Promise<ResolvedPerson | null> {
  const emailIntel = analyzeEmail(email);
  const guessedName = guessNameFromEmail(emailIntel.localPart);
  
  // Step 1: If we know the company from the email domain, research the company first
  let companyContext = '';
  let companyName = emailIntel.inferredCompany;
  
  if (companyName && !emailIntel.isPersonalEmail) {
    const companySearch = await exaSearch(
      `"${companyName}" company official website`,
      5,
    );
    if (companySearch.success && companySearch.data.length > 0) {
      // Read the company's website to confirm it's the right company
      const companyUrl = companySearch.data[0].url;
      const companyRead = await webRead(companyUrl);
      if (companyRead.success) {
        companyContext = companyRead.data.content.slice(0, 5000);
        
        // LLM may refine the company name from the website
        const refinedName = await callLLMForJSON<{ companyName: string | null }>(
          `What is the exact company name that operates the website at ${companyUrl}? Return JSON: { "companyName": "..." }`,
          companyContext.slice(0, 3000),
          { retriesPerModel: 1, useFallback: true },
        );
        if (refinedName?.companyName) {
          companyName = refinedName.companyName;
        }
      }
    }
  }
  
  // Step 2: Search for the person at this specific company
  const searchQueries: string[] = [];
  
  if (guessedName && companyName) {
    searchQueries.push(`"${guessedName}" "${companyName}"`);
    searchQueries.push(`"${guessedName}" site:${emailIntel.domain}`);
  } else if (guessedName) {
    searchQueries.push(`"${guessedName}" "${email}"`);
    searchQueries.push(`"${guessedName}" professional profile`);
  } else {
    searchQueries.push(`"${email}" professional profile`);
  }
  
  const allResults: Array<{ url: string; title: string; snippet: string }> = [];
  const seenUrls = new Set<string>();
  
  for (const query of searchQueries.slice(0, 3)) {
    const result = await exaSearch(query, 10);
    if (result.success && result.data) {
      for (const item of result.data) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push({ url: item.url, title: item.title, snippet: item.snippet });
        }
      }
    }
  }
  
  // Step 3: Read and verify the top results
  const personData: Record<string, unknown> = {};
  const verificationSources: string[] = [];
  
  for (const result of allResults.slice(0, 5)) {
    const pageRead = await webRead(result.url);
    if (pageRead.success && pageRead.data.content) {
      const extracted = await callLLMForJSON<Record<string, unknown>>(
        `Extract person information from this page. Does this page mention someone with the email "${email}" or the name "${guessedName || 'unknown'}" at "${companyName || 'unknown company'}"?
Return JSON with: fullName, title, company, email, phone, location, linkedinUrl, bio. Use null for not found. If the page is NOT about the target person, return all null values.`,
        pageRead.data.content.slice(0, 4000),
        { retriesPerModel: 1, useFallback: true },
      );
      
      if (extracted && extracted.fullName) {
        // Merge data — prefer non-null values
        for (const [key, value] of Object.entries(extracted)) {
          if (value !== null && value !== undefined && !personData[key]) {
            personData[key] = value;
          }
        }
        verificationSources.push(result.url);
      }
    }
  }
  
  // Step 4: Try LinkedIn
  const searchName = (personData.fullName as string) || guessedName || '';
  if (searchName) {
    const liResult = await linkedInSearchPeople(
      `${searchName} ${companyName || ''}`.trim(),
      3,
    );
    if (liResult.success && liResult.data.length > 0) {
      // Verify the LinkedIn result matches our person
      const liPerson = liResult.data[0];
      const liVerification = await callLLMForJSON<{
        isMatch: boolean;
        confidence: number;
        reasoning: string;
      }>(
        `Does this LinkedIn profile match the person we're looking for?
Target: Name="${searchName}", Company="${companyName || 'unknown'}", Email="${email}"
LinkedIn: Name="${liPerson.name}", Headline="${liPerson.headline}", Location="${liPerson.location}"

Return JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "..." }`,
        `Profile: ${liPerson.name}, ${liPerson.headline}, ${liPerson.location}`,
        { retriesPerModel: 1, useFallback: true },
      );
      
      if (liVerification?.isMatch && liVerification.confidence >= 0.6) {
        if (!personData.fullName && liPerson.name) personData.fullName = liPerson.name;
        if (!personData.title && liPerson.headline) personData.title = liPerson.headline;
        if (!personData.location && liPerson.location) personData.location = liPerson.location;
        if (!personData.linkedinUrl && liPerson.url) personData.linkedinUrl = liPerson.url;
        verificationSources.push(`linkedin:${liPerson.url || searchName}`);
      }
    }
  }
  
  // Step 5: Build identity
  const identity: PersonIdentity = {
    fullName: (personData.fullName as string) || guessedName || email,
    nameVariations: buildNameVariations((personData.fullName as string) || guessedName || ''),
    email,
    emailDomain: emailIntel.domain,
    associatedCompany: (personData.company as string) || companyName,
    title: (personData.title as string) || null,
    location: (personData.location as string) || null,
    linkedinUrl: (personData.linkedinUrl as string) || null,
    distinguishingSignals: [
      email,
      companyName || '',
      (personData.title as string) || '',
      (personData.location as string) || '',
    ].filter(Boolean),
    confidence: verificationSources.length >= 3 ? 'high' : verificationSources.length >= 2 ? 'medium' : 'low',
  };
  
  return {
    identity,
    verificationSources,
    verificationCount: verificationSources.length,
    mergedData: personData,
  };
}

/**
 * Resolve a person's identity from a name (with optional context).
 * Uses multi-signal disambiguation to find the EXACT person.
 */
export async function resolveFromName(
  fullName: string,
  context?: {
    company?: string;
    title?: string;
    location?: string;
    industry?: string;
  },
): Promise<ResolvedPerson | null> {
  // Build targeted search queries using available context
  const searchQueries: string[] = [];
  
  // Query 1: Name + Company (most specific)
  if (context?.company) {
    searchQueries.push(`"${fullName}" "${context.company}"`);
  }
  
  // Query 2: Name + Title
  if (context?.title) {
    searchQueries.push(`"${fullName}" "${context.title}"`);
  }
  
  // Query 3: Name + Location
  if (context?.location) {
    searchQueries.push(`"${fullName}" "${context.location}"`);
  }
  
  // Query 4: Name + Industry
  if (context?.industry) {
    searchQueries.push(`"${fullName}" ${context.industry}`);
  }
  
  // Query 5: Just the name with professional context
  searchQueries.push(`"${fullName}" professional profile company`);
  
  // Execute searches
  const allResults: Array<{ url: string; title: string; snippet: string }> = [];
  const seenUrls = new Set<string>();
  
  const searchPromises = searchQueries.slice(0, 4).map(q =>
    exaSearch(q, 10).then(result => {
      if (result.success && result.data) {
        for (const item of result.data) {
          if (!seenUrls.has(item.url)) {
            seenUrls.add(item.url);
            allResults.push({ url: item.url, title: item.title, snippet: item.snippet });
          }
        }
      }
    }).catch(() => {}),
  );
  
  await Promise.allSettled(searchPromises);
  
  // Step 2: LLM-based disambiguation — verify which results are about THE target person
  const verifiedResults = await callLLMForJSON<{
    results: Array<{
      index: number;
      isMatch: boolean;
      confidence: number;
      reasoning: string;
      extractedData: Record<string, unknown>;
    }>;
  }>(
    `You are a person identity resolution specialist. Given a TARGET person and search results, determine which results are about the SAME person.

TARGET PERSON:
- Name: "${fullName}"
${context?.company ? `- Company: "${context.company}"` : ''}
${context?.title ? `- Title: "${context.title}"` : ''}
${context?.location ? `- Location: "${context.location}"` : ''}
${context?.industry ? `- Industry: "${context.industry}"` : ''}

RULES:
1. A result is a MATCH only if it is clearly about the SAME person (not someone with the same name at a different company)
2. Company + name combination is the strongest signal
3. Title + name combination is a strong signal
4. Location + name combination is a moderate signal
5. If multiple results have the same person at different companies, prefer the one matching our context
6. Extract any additional data you find (title, company, email, phone, LinkedIn, location, bio)

Return JSON: { "results": [{ "index": 0, "isMatch": true/false, "confidence": 0-1, "reasoning": "...", "extractedData": { fullName, title, company, email, phone, location, linkedinUrl, bio } }] }`,
    `SEARCH RESULTS:
${allResults.slice(0, 15).map((r, idx) => `[${idx}] Title: ${r.title}\n    URL: ${r.url}\n    Snippet: ${r.snippet}`).join('\n')}`,
    { retriesPerModel: 1, useFallback: true },
  );
  
  // Step 3: Read the top verified results for deeper data
  const personData: Record<string, unknown> = {};
  const verificationSources: string[] = [];
  
  if (verifiedResults?.results) {
    // Sort by confidence
    const sorted = [...verifiedResults.results]
      .filter(r => r.isMatch && r.confidence >= 0.5)
      .sort((a, b) => b.confidence - a.confidence);
    
    // Merge extracted data from verified results
    for (const result of sorted) {
      const extracted = result.extractedData;
      if (extracted) {
        for (const [key, value] of Object.entries(extracted)) {
          if (value !== null && value !== undefined && !personData[key]) {
            personData[key] = value;
          }
        }
      }
      // Also add the search result as a verification source
      if (result.index < allResults.length) {
        verificationSources.push(allResults[result.index].url);
      }
    }
    
    // Read the top verified result for more data
    const topVerifiedUrl = sorted[0] && allResults[sorted[0].index]?.url;
    if (topVerifiedUrl) {
      const pageRead = await webRead(topVerifiedUrl);
      if (pageRead.success && pageRead.data.content) {
        const deepExtract = await callLLMForJSON<Record<string, unknown>>(
          `Extract comprehensive professional information about "${fullName}" from this page.
Return JSON: fullName, title, company, email, phone, location, linkedinUrl, bio, twitterHandle, education (array), experience (array of {title, company, duration}). Use null for not found.`,
          pageRead.data.content.slice(0, 5000),
          { retriesPerModel: 1, useFallback: true },
        );
        if (deepExtract) {
          for (const [key, value] of Object.entries(deepExtract)) {
            if (value !== null && value !== undefined && !personData[key]) {
              personData[key] = value;
            }
          }
        }
      }
    }
  }
  
  // Step 4: Try LinkedIn for additional verification
  const liResult = await linkedInSearchPeople(
    `${fullName} ${context?.company || ''}`.trim(),
    5,
  );
  if (liResult.success && liResult.data.length > 0) {
    // Use LLM to verify which LinkedIn result matches
    const liVerification = await callLLMForJSON<{
      bestMatchIndex: number;
      isMatch: boolean;
      confidence: number;
    }>(
      `Which LinkedIn profile matches the target person?
Target: Name="${fullName}", Company="${context?.company || 'unknown'}", Title="${context?.title || 'unknown'}"
Profiles:
${liResult.data.map((p, i) => `[${i}] ${p.name} — ${p.headline} — ${p.location}`).join('\n')}

Return JSON: { "bestMatchIndex": number, "isMatch": boolean, "confidence": 0-1 }`,
      `Target: ${fullName}`,
      { retriesPerModel: 1, useFallback: true },
    );
    
    if (liVerification?.isMatch && liVerification.bestMatchIndex < liResult.data.length) {
      const matchedProfile = liResult.data[liVerification.bestMatchIndex];
      if (!personData.fullName && matchedProfile.name) personData.fullName = matchedProfile.name;
      if (!personData.title && matchedProfile.headline) personData.title = matchedProfile.headline;
      if (!personData.location && matchedProfile.location) personData.location = matchedProfile.location;
      if (!personData.linkedinUrl && matchedProfile.url) personData.linkedinUrl = matchedProfile.url;
      verificationSources.push(`linkedin:${matchedProfile.url || fullName}`);
    }
  }
  
  // Step 5: Build identity
  const identity: PersonIdentity = {
    fullName: (personData.fullName as string) || fullName,
    nameVariations: buildNameVariations(fullName),
    email: (personData.email as string) || null,
    emailDomain: null,
    associatedCompany: (personData.company as string) || context?.company || null,
    title: (personData.title as string) || context?.title || null,
    location: (personData.location as string) || context?.location || null,
    linkedinUrl: (personData.linkedinUrl as string) || null,
    distinguishingSignals: [
      context?.company || '',
      (personData.title as string) || context?.title || '',
      (personData.location as string) || context?.location || '',
      (personData.email as string) || '',
    ].filter(Boolean),
    confidence: verificationSources.length >= 3 ? 'high' : verificationSources.length >= 2 ? 'medium' : 'low',
  };
  
  return {
    identity,
    verificationSources,
    verificationCount: verificationSources.length,
    mergedData: personData,
  };
}

// ─── Utilities ───

/**
 * Generate common name variations for broader search matching.
 * "John Smith" → ["John Smith", "J. Smith", "John S.", "Smith John"]
 */
function buildNameVariations(fullName: string): string[] {
  if (!fullName) return [];
  
  const variations = new Set<string>();
  const parts = fullName.trim().split(/\s+/);
  
  // Full name as-is
  variations.add(fullName);
  
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    const middle = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';
    
    // First + Last
    variations.add(`${first} ${last}`);
    
    // First initial + Last
    variations.add(`${first.charAt(0)}. ${last}`);
    
    // First + Last initial
    variations.add(`${first} ${last.charAt(0)}.`);
    
    // Last, First (common format)
    variations.add(`${last}, ${first}`);
    
    // With middle initial
    if (middle) {
      variations.add(`${first} ${middle.charAt(0)}. ${last}`);
    }
  }
  
  return [...variations];
}

/**
 * Detect if a query looks like an email address.
 */
export function isEmail(query: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query.trim());
}

/**
 * Detect if a query looks like a person's name
 * (2-4 capitalized words, no URLs or special chars).
 */
export function isPersonName(query: string): boolean {
  const trimmed = query.trim();
  // Not a URL
  if (/^https?:\/\//i.test(trimmed)) return false;
  // Not an email
  if (isEmail(trimmed)) return false;
  // 2-4 words, each starting with uppercase
  const words = trimmed.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  return words.every(w => /^[A-Z][a-z]+(?:[-'][A-Z][a-z]+)*$/.test(w));
}
