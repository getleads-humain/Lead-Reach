// ============================================================
// Prospect Discovery — Rich Query Parser
// ============================================================
//
// PURPOSE
// =======
// Users often paste rich, structured queries such as:
//
//   Find a person: Kavya Shah [Business Systems & AI-Focused
//   Software Developer | Enterprise Applications | Founder @
//   Credora | Healthcare & FinTech Systems] - [Kavya's profile:
//   linkedin.com/in/kavya-works; Address: Toronto, Ontario;
//   Email: shahkavya.works@gmail.com; Birthday: November 29]
//
// The legacy intent classifier (intents.ts) only handled short
// queries like "Research Stripe" or "Find Patrick Collison" —
// any query longer than a couple of words fell through to the
// generic "company search" branch, throwing away ALL the
// structured data the user took the trouble to type.
//
// This module fixes that by:
//
// 1. Extracting structured entities from ANY user query:
//    - Person name (multi-word capitalized)
//    - Company name (after "Founder @", "CEO of", etc.)
//    - Email addresses
//    - LinkedIn profile URLs (/in/...) and company URLs (/company/...)
//    - Other social URLs (Twitter/X, GitHub, personal sites)
//    - Location (City, State / City, Country)
//    - Job titles and role hints
//    - Industry keywords
//    - Birthday / founded year
//
// 2. Deciding person-vs-company with strong, deterministic rules
//    that don't depend on the LLM classifier being in a good mood.
//
// 3. Producing a pre-populated ProspectResult that the downstream
//    agents can MERGE INTO instead of starting from scratch —
//    so even if every external search fails, the user STILL sees
//    all the data they provided rendered in the workspace.
//
// This module is PURE (no I/O, no LLM calls) so it can be unit
// tested and run synchronously inside the classifier.
// ============================================================

import type { ProspectResult } from './types';

// ============================================================
// Types
// ============================================================

export interface ParsedQuery {
  /** Original user message, untouched */
  raw: string;

  /** Best guess at the primary intent based on signals */
  guessedIntent: 'research_person' | 'research_company' | 'research_url' | 'unknown';

  /** Confidence 0..1 in the guessed intent */
  confidence: number;

  /** Reasoning string for UI display */
  reasoning: string;

  /** Extracted person name (e.g., "Kavya Shah") */
  personName: string | null;

  /** Extracted company name (e.g., "Credora") */
  companyName: string | null;

  /** First URL found in the query, if any */
  url: string | null;

  /** LinkedIn /in/ profile URL */
  linkedinPersonUrl: string | null;

  /** LinkedIn /company/ URL */
  linkedinCompanyUrl: string | null;

  /** Email address */
  email: string | null;

  /** Phone number (E.164 or common formats) */
  phone: string | null;

  /** City */
  city: string | null;

  /** State / Province */
  stateProvince: string | null;

  /** Country */
  country: string | null;

  /** Job title (e.g., "Software Developer", "Founder", "CEO") */
  title: string | null;

  /** Industry / focus area keywords (e.g., "Healthcare", "FinTech") */
  industry: string | null;

  /** Birthday in free-text form (e.g., "November 29") */
  birthday: string | null;

  /** Founded year (4-digit) */
  foundingYear: string | null;

  /** Other URLs found (GitHub, Twitter, personal sites) */
  otherUrls: string[];

  /** Bracketed text blocks (the [...] sections) — useful for bio */
  bracketBlocks: string[];

  /** Pre-populated prospect data — null fields mean "not provided" */
  prepopulatedProspect: Partial<ProspectResult>;

  /** Number of structured fields the user supplied */
  signalsProvided: number;
}

// ============================================================
// Helpers
// ============================================================

/** Strip surrounding whitespace and trailing punctuation. */
function clean(s: string | null | undefined): string | null {
  if (!s) return null;
  // SECURITY: Bounded quantifiers (`{1,50}`) prevent polynomial-time
  // backtracking on adversarial inputs (CodeQL: polynomial regex on
  // uncontrolled data). 50 chars of trailing punctuation is more than
  // enough for any real-world query.
  const v = s.trim().replace(/[.,;:)\]}>]{1,50}$/g, '').replace(/^[([<{]{1,50}/g, '').trim();
  return v.length === 0 ? null : v;
}

/** Normalize a URL: ensure it has a scheme. */
function normalizeUrl(u: string): string {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^\/\//.test(u)) return `https:${u}`;
  // linkedin.com/... etc.
  if (/^(linkedin\.com|github\.com|twitter\.com|x\.com|instagram\.com|facebook\.com)/i.test(u)) {
    return `https://www.${u}`;
  }
  return u;
}

// ============================================================
// Field Extractors
// ============================================================

// Email regex pattern — bounded quantifiers (CodeQL: polynomial regex on
// uncontrolled data). 64 chars local-part + 255 chars domain is the RFC 5321
// maximum; we cap at 100/100 to keep the regex linear on adversarial input.
const EMAIL_RE = /[a-zA-Z0-9._%+\-]{1,100}@[a-zA-Z0-9.\-]{1,100}\.[a-zA-Z]{2,24}/g;
const LINKEDIN_IN_RE = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-%]{1,128}\/?/gi;
const LINKEDIN_CO_RE = /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[a-zA-Z0-9_\-%]{1,128}\/?/gi;
const BARE_LINKEDIN_IN_RE = /\blinkedin\.com\/in\/[a-zA-Z0-9_\-%]{1,128}\/?/gi;
const BARE_LINKEDIN_CO_RE = /\blinkedin\.com\/company\/[a-zA-Z0-9_\-%]{1,128}\/?/gi;
// URL regex — bounded to 2048 chars per RFC 7230 § 3.1.1 (URI max length).
const GENERAL_URL_RE = /https?:\/\/[^\s<>"')\]]{1,2048}/gi;
const PHONE_RE = /(?:\+?\d{1,3}[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3,4}[\s.\-]?\d{3,4}/g;
const YEAR_RE = /\b(19[5-9]\d|20[0-3]\d)\b/g; // 1950-2039

/** Extract first email from text. */
function extractEmail(text: string): string | null {
  // SECURITY: Cap the input slice we scan to 10k chars — keeps regex
  // linear on adversarial inputs (CodeQL: polynomial regex on uncontrolled data).
  const slice = text.length > 10000 ? text.slice(0, 10000) : text;
  const m = slice.match(EMAIL_RE);
  return m && m.length > 0 ? m[0] : null;
}

/** Extract LinkedIn /in/ profile URL (full or bare). */
function extractLinkedinPerson(text: string): string | null {
  const slice = text.length > 10000 ? text.slice(0, 10000) : text;
  const m1 = slice.match(LINKEDIN_IN_RE);
  if (m1 && m1.length > 0) return normalizeUrl(m1[0]);
  const m2 = slice.match(BARE_LINKEDIN_IN_RE);
  if (m2 && m2.length > 0) return normalizeUrl(m2[0]);
  return null;
}

/** Extract LinkedIn /company/ URL. */
function extractLinkedinCompany(text: string): string | null {
  const slice = text.length > 10000 ? text.slice(0, 10000) : text;
  const m1 = slice.match(LINKEDIN_CO_RE);
  if (m1 && m1.length > 0) return normalizeUrl(m1[0]);
  const m2 = slice.match(BARE_LINKEDIN_CO_RE);
  if (m2 && m2.length > 0) return normalizeUrl(m2[0]);
  return null;
}

/** Extract all URLs, return first non-LinkedIn one (or first overall). */
function extractUrls(text: string): { first: string | null; others: string[] } {
  const slice = text.length > 10000 ? text.slice(0, 10000) : text;
  const all = slice.match(GENERAL_URL_RE) || [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of all) {
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }
  if (out.length === 0) return { first: null, others: [] };
  return { first: out[0], others: out.slice(1) };
}

/** Extract phone number — but exclude things that look like dates or years. */
function extractPhone(text: string): string | null {
  // First, mask out anything that looks like a birthday (e.g., "November 29")
  // and year-only numbers (e.g., 2024)
  const cleaned = text
    .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/gi, ' ')
    .replace(/\b(?:19|20)\d{2}\b/g, ' ');

  const m = cleaned.match(PHONE_RE);
  if (!m || m.length === 0) return null;
  // Filter to numbers with at least 7 digits
  for (const cand of m) {
    const digits = cand.replace(/\D/g, '');
    if (digits.length >= 7) return cand.trim();
  }
  return null;
}

/**
 * Extract location from common patterns like:
 *   "Address: Toronto, Ontario"
 *   "Location: San Francisco, CA"
 *   "based in London, UK"
 *   "from Berlin, Germany"
 */
function extractLocation(text: string): { city: string | null; stateProvince: string | null; country: string | null } {
  // SECURITY: Bounded quantifiers prevent polynomial backtracking
  // (CodeQL: polynomial regex on uncontrolled data).
  // Old pattern: `[A-Z][a-zA-Z.\s]+(?:,\s*[A-Z][a-zA-Z.\s]+){0,2}`
  //   — nested quantifier (inner `+` × outer `{0,2}`) → O(n^3).
  // New pattern: bounded single quantifier with explicit alternation.
  const patterns: RegExp[] = [
    /(?:address|location|based\s+in|from|lives?\s+in|headquartered\s+in|hq\s+in)\s*[:\-]?\s*([A-Z][A-Za-z.]{1,60}(?:,\s*[A-Z][A-Za-z.]{1,60}){0,2})/i,
  ];

  let raw: string | null = null;
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1]) {
      raw = m[1].trim().replace(/\s+/g, ' ');
      // Cut at end-of-statement punctuation or brackets
      raw = raw.split(/[.;\]\)\|\n]/)[0].trim();
      if (raw.length >= 2) break;
      raw = null;
    }
  }

  if (!raw) {
    // Fallback: look for "City, State" or "City, Country" patterns near the end
    const m = text.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?),\s*([A-Z][a-zA-Z]{2,}(?:\s+[A-Z][a-zA-Z]+)?)\b/g);
    if (m && m.length > 0) {
      raw = m[m.length - 1]; // take the last one (more likely to be address)
    }
  }

  if (!raw) return { city: null, stateProvince: null, country: null };

  const parts = raw.split(/,\s*/).map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return { city: null, stateProvince: null, country: null };

  // Common country / province mapping
  // Note: 2-letter codes like "CA" can be ambiguous (California state OR Canada country).
  // We use 2-letter codes as US state abbreviations ONLY when paired with a known US city.
  // Otherwise we treat 2-letter codes as state/province abbreviations (more common in
  // user queries like "San Francisco, CA" or "Toronto, ON").
  const US_STATE_ABBREVIATIONS = new Set([
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
    'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
    'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV',
    'WI','WY','DC','PR',
  ]);
  const PROVINCES = new Set([
    'ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE', 'NT', 'YT', 'NU',
    'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan',
    'Nova Scotia', 'New Brunswick', 'California', 'New York', 'Texas', 'Florida',
    'Illinois', 'Washington', 'Massachusetts', 'Pennsylvania', 'Ohio', 'Georgia',
    'North Carolina', 'Michigan', 'New Jersey', 'Virginia', 'Oregon', 'Colorado',
    'Arizona', 'Nevada', 'Utah', 'Minnesota', 'Wisconsin', 'Missouri', 'Maryland',
  ]);
  // Countries spelled out (avoid 2-letter codes here to prevent ambiguity)
  const COUNTRIES = new Set([
    'USA', 'United States', 'UK', 'United Kingdom', 'Canada',
    'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway',
    'Denmark', 'Finland', 'Poland', 'Portugal', 'Greece', 'Ireland',
    'Australia', 'New Zealand', 'India', 'Singapore', 'Japan', 'China',
    'South Korea', 'Korea', 'Brazil', 'Argentina', 'Mexico', 'Chile',
    'Colombia', 'South Africa', 'UAE', 'Israel', 'Saudi Arabia', 'Egypt',
    'Nigeria', 'Kenya', 'Morocco', 'Turkey', 'Russia', 'Ukraine',
  ]);

  let city: string | null = null;
  let stateProvince: string | null = null;
  let country: string | null = null;

  if (parts.length === 1) {
    const p = parts[0];
    if (COUNTRIES.has(p)) country = p;
    else if (PROVINCES.has(p)) stateProvince = p;
    else city = p;
  } else if (parts.length === 2) {
    city = parts[0];
    const second = parts[1];
    // For 2-letter codes, prefer state interpretation (e.g., "Toronto, ON" = Ontario,
    // "San Francisco, CA" = California). Users who mean country write "USA", "Canada",
    // "UK" etc. spelled out.
    if (second.length === 2 && US_STATE_ABBREVIATIONS.has(second.toUpperCase())) {
      stateProvince = second.toUpperCase();
    } else if (PROVINCES.has(second)) {
      stateProvince = second;
    } else if (COUNTRIES.has(second)) {
      country = second;
    } else {
      // Unknown — best guess: treat as state/province
      stateProvince = second;
    }
  } else {
    // 3+ parts — assume City, State, Country
    city = parts[0];
    stateProvince = parts[1];
    country = parts.slice(2).join(', ');
  }

  return { city, stateProvince, country };
}

/**
 * Extract job title from common patterns:
 *   "Kavya Shah [Business Systems & AI-Focused Software Developer | ...]"
 *   "Title: Senior Engineer"
 *   "CEO of Acme"
 *   "Founder @ Credora"
 */
function extractTitle(text: string, bracketBlocks: string[]): string | null {
  // Pattern 1: "Title: ..."
  const titleMatch = text.match(/\btitle\s*[:\-]\s*([A-Z][a-zA-Z\s&\/\-]+?)(?:[;\]\|,\n]|\sat\s|\s@\s|$)/i);
  if (titleMatch && titleMatch[1] && titleMatch[1].length >= 3) {
    return clean(titleMatch[1]);
  }

  // Pattern 2: "Founder @ Company", "CEO at Company", "Engineer at Company"
  const atMatch = text.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,4})\s+(?:@|at)\s+([A-Z][a-zA-Z0-9]+)/);
  if (atMatch && atMatch[1]) {
    const role = clean(atMatch[1]);
    if (role && /Founder|CEO|CTO|COO|CFO|President|Director|Manager|Engineer|Developer|Designer|Architect|Consultant|Analyst|Specialist|Lead|Head|VP|Chief/i.test(role)) {
      return role;
    }
  }

  // Pattern 3: First bracket block often contains the title pipeline-style
  // "Business Systems & AI-Focused Software Developer | Enterprise Applications | Founder @ Credora"
  if (bracketBlocks.length > 0) {
    const block = bracketBlocks[0];
    // Take the first |-separated segment that looks like a title
    const segments = block.split('|').map(s => s.trim()).filter(Boolean);
    for (const seg of segments) {
      // Strip leading "Founder @ X" → use "Founder"
      const founderMatch = seg.match(/^(Founder|Co-?founder|CEO|CTO|COO|CFO|President|Partner|Investor|Advisor|Board Member)\s*(@|at)\s*(.+)$/i);
      if (founderMatch) {
        return founderMatch[1];
      }
      // If segment looks like a title (contains "Developer", "Engineer", etc.)
      if (/\b(Developer|Engineer|Designer|Architect|Analyst|Consultant|Specialist|Manager|Director|Lead|Head|President|Founder|CEO|CTO|COO|CFO|VP|Chief|Owner|Operator|Strategist|Scientist|Researcher)\b/i.test(seg)) {
        // Truncate at "Founder @" / "CEO of" boundaries
        const cutAt = seg.search(/\s+(?:@|at|of|-\s)\s+/i);
        const title = cutAt > 0 ? seg.slice(0, cutAt).trim() : seg;
        if (title.length >= 3 && title.length <= 80) return clean(title);
      }
    }
  }

  return null;
}

/**
 * Extract a person name from rich queries. Looks for patterns like:
 *   - "Find a person: Kavya Shah ["
 *   - "Research Patrick Collison"
 *   - "Look up Elon Musk"
 *   - "Find info on John Smith"
 *   - "tell me about Sarah Chen"
 *
 * Returns the FIRST plausible person name found.
 */
function extractPersonName(text: string): string | null {
  // SECURITY: Bounded quantifiers prevent polynomial backtracking
  // (CodeQL: polynomial regex on uncontrolled data).
  // Old pattern: `[A-Z][a-zA-Z'\-]+(?:\s+[A-Z][a-zA-Z'\-]+){1,3}`
  //   — nested quantifier (inner `+` × outer `{1,3}`) → O(n^4).
  // New pattern: bounded inner `{1,40}` × outer `{1,3}` → O(n) on bounded input.
  const NAME_PART = "[A-Z][a-zA-Z'-]{1,40}";
  const NAME_FULL = `${NAME_PART}(?:\\s+${NAME_PART}){1,3}`;

  // Pattern 1: "Find a person: NAME [", "Find person NAME (", etc.
  const findPersonRe = new RegExp(
    `(?:find|search\\s+for|look\\s+up|tell\\s+me\\s+about|research|info\\s+on)\\s+(?:a\\s+)?person\\s*[:\\-]?\\s*(${NAME_FULL})`,
    'i',
  );
  const findPersonMatch = text.match(findPersonRe);
  if (findPersonMatch && findPersonMatch[1]) {
    const name = clean(findPersonMatch[1]);
    if (name) return name;
  }

  // Pattern 2: NAME's profile / NAME's bio / NAME is a
  const profileRe = new RegExp(`(${NAME_FULL})'s\\s+(?:profile|bio|background|website|email)`);
  const profileMatch = text.match(profileRe);
  if (profileMatch && profileMatch[1]) {
    const name = clean(profileMatch[1]);
    if (name) return name;
  }

  // Pattern 3: "Kavya Shah [Business Systems..."  — name immediately before [
  const bracketNameRe = new RegExp(`(${NAME_FULL})\\s*\\[`);
  const bracketNameMatch = text.match(bracketNameRe);
  if (bracketNameMatch && bracketNameMatch[1]) {
    const name = clean(bracketNameMatch[1]);
    if (name) return name;
  }

  // Pattern 4: "Research Patrick Collison" / "Find John Smith"
  const researchNameRe = new RegExp(
    `(?:research|find|look\\s+up|tell\\s+me\\s+about|info\\s+on|discover)\\s+(${NAME_FULL})(?:\\s*[\\.\\,\\;\\:\\(\\[\\n]|$)`,
  );
  const researchNameMatch = text.match(researchNameRe);
  if (researchNameMatch && researchNameMatch[1]) {
    const name = clean(researchNameMatch[1]);
    if (name) return name;
  }

  return null;
}

/**
 * Extract company name from patterns like:
 *   "Founder @ Credora"
 *   "CEO of Stripe"
 *   "works at Google"
 *   "Company: Acme"
 */
function extractCompanyName(text: string, bracketBlocks: string[]): string | null {
  // SECURITY: Bounded quantifiers prevent polynomial backtracking
  // (CodeQL: polynomial regex on uncontrolled data).
  const CO_PART = "[A-Z][a-zA-Z0-9-]{1,40}";
  const CO_FULL = `${CO_PART}(?:\\s+${CO_PART}){0,3}`;

  // Pattern 1: "Founder @ X" / "CEO of X" / "works at X"
  const atRe = new RegExp(
    `(?:Founder|Co-?founder|CEO|CTO|COO|CFO|President|Partner|Investor|Advisor|Employee|Engineer|Developer|Designer|Architect|Consultant|Analyst|Specialist|Lead|Head|VP|Chief|Owner|Operator|Strategist|Scientist|Researcher|Director|Manager)\\s+(?:@|at|of|@|with)\\s+(${CO_FULL})`,
  );
  const atMatch = text.match(atRe);
  if (atMatch && atMatch[1]) {
    const name = clean(atMatch[1]);
    if (name) return name;
  }

  // Pattern 2: "Company: NAME" — bounded lazy quantifier `{1,80}?` instead of `+?`
  const coMatch = text.match(/\bcompany\s*[:\-]\s*([A-Z][a-zA-Z0-9\-\s&.]{1,80}?)(?:[;\]\|\n,\n]|\s+is\s+|\s+was\s+|$)/i);
  if (coMatch && coMatch[1]) {
    const name = clean(coMatch[1]);
    if (name) return name;
  }

  // Pattern 3: Search bracket blocks for "Founder @ X" segments
  const segRe = new RegExp(
    `(?:Founder|Co-?founder|CEO|CTO|COO|CFO|President|Partner)\\s*(?:@|at|of)\\s*(${CO_FULL})`,
  );
  for (const block of bracketBlocks) {
    const segMatch = block.match(segRe);
    if (segMatch && segMatch[1]) {
      const name = clean(segMatch[1]);
      if (name) return name;
    }
  }

  return null;
}

/** Extract industry / focus area keywords. */
function extractIndustry(text: string, bracketBlocks: string[]): string | null {
  const INDUSTRY_KEYWORDS = [
    'Healthcare', 'Health Care', 'FinTech', 'Financial Services', 'Finance',
    'Banking', 'Insurance', 'Payments', 'SaaS', 'Software', 'Technology',
    'AI', 'Artificial Intelligence', 'Machine Learning', 'ML', 'Data',
    'Enterprise', 'B2B', 'B2C', 'E-commerce', 'Ecommerce', 'Retail',
    'Manufacturing', 'Logistics', 'Supply Chain', 'Real Estate', 'Construction',
    'Energy', 'Utilities', 'Telecom', 'Media', 'Entertainment', 'Gaming',
    'Education', 'EdTech', 'Government', 'Defense', 'Aerospace', 'Automotive',
    'Pharmaceutical', 'Pharma', 'Biotech', 'BioTech', 'Life Sciences',
    'Agriculture', 'Food', 'Beverage', 'Hospitality', 'Travel', 'Tourism',
    'Legal', 'Compliance', 'Cybersecurity', 'Security', 'Cloud', 'DevOps',
    'Web3', 'Blockchain', 'Crypto', 'Climate', 'Sustainability', 'Green Tech',
  ];
  const allText = `${text} ${bracketBlocks.join(' ')}`;
  const found: string[] = [];
  for (const kw of INDUSTRY_KEYWORDS) {
    const re = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(allText)) {
      found.push(kw);
    }
  }
  if (found.length === 0) return null;
  // Dedupe (case-insensitive)
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const f of found) {
    const key = f.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }
  return unique.slice(0, 3).join(', ');
}

/** Extract birthday (month + day) from text. */
function extractBirthday(text: string): string | null {
  // SECURITY: Bounded quantifiers prevent polynomial backtracking
  // (CodeQL: polynomial regex on uncontrolled data). The alternation with
  // nested optional groups `(?:st|nd|rd|th)?(?:,?\s*\d{4})?` was flagged
  // because the `?` quantifiers stack with the surrounding `\d{1,2}`.
  // We use bounded `{1,2}` and explicit alternation to keep the regex linear.
  const m = text.match(
    /\b(?:Birthday|DOB|Date of Birth|Born)\s*[:\-]?\s*(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?|\b(?:Birthday|DOB|Date of Birth|Born)\s*[:\-]?\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i,
  );
  if (m) {
    // Month-name form
    if (m[1]) {
      const parts = [m[1], m[2]];
      if (m[3]) parts.push(m[3]);
      return clean(parts.join(' '));
    }
    // Numeric form
    if (m[4] && m[5]) {
      const parts = [m[4], m[5]];
      if (m[6]) parts.push(m[6]);
      return clean(parts.join('/'));
    }
  }
  return null;
}

/** Extract founding year. */
function extractFoundingYear(text: string): string | null {
  const m = text.match(/\b(?:founded|established|incorporated|started|launched|since)\s+(?:in\s+)?(19[5-9]\d|20[0-3]\d)\b/i);
  if (m && m[1]) return m[1];
  // Bare year if it appears next to "founded"
  return null;
}

/** Extract bracketed text blocks: [...], (...), {...}. */
function extractBracketBlocks(text: string): string[] {
  const blocks: string[] = [];
  // Square brackets
  const squareMatches = text.match(/\[([^\[\]]{3,500})\]/g);
  if (squareMatches) {
    for (const m of squareMatches) {
      blocks.push(m.replace(/^\[|\]$/g, '').trim());
    }
  }
  // Parentheses (only if they contain enough text to be informational)
  const parenMatches = text.match(/\(([^()]{20,500})\)/g);
  if (parenMatches) {
    for (const m of parenMatches) {
      blocks.push(m.replace(/^\(|\)$/g, '').trim());
    }
  }
  return blocks;
}

// ============================================================
// Intent Decision Logic
// ============================================================

/**
 * Decide whether this is a person-search, company-search, or URL-based query.
 * Uses strong signals (keywords, LinkedIn URL type, email type, presence of
 * title/role keywords) rather than relying on the LLM classifier alone.
 */
function decideIntent(params: {
  text: string;
  personName: string | null;
  companyName: string | null;
  linkedinPersonUrl: string | null;
  linkedinCompanyUrl: string | null;
  email: string | null;
  url: string | null;
  title: string | null;
}): { intent: 'research_person' | 'research_company' | 'research_url'; confidence: number; reasoning: string } {
  const { text, personName, companyName, linkedinPersonUrl, linkedinCompanyUrl, email, url, title } = params;
  const lower = text.toLowerCase();

  // Strong URL signal: query starts with a URL
  if (url && text.trim().startsWith('http')) {
    return { intent: 'research_url', confidence: 0.95, reasoning: 'Query starts with a URL' };
  }

  // Strong LinkedIn signal
  if (linkedinPersonUrl && !linkedinCompanyUrl) {
    return { intent: 'research_person', confidence: 0.95, reasoning: 'Query contains a LinkedIn /in/ profile URL' };
  }
  if (linkedinCompanyUrl && !linkedinPersonUrl) {
    return { intent: 'research_company', confidence: 0.95, reasoning: 'Query contains a LinkedIn /company/ URL' };
  }

  // Strong keyword signals
  const personKeywords = [
    'find a person', 'find person', 'find this person', 'find the person',
    'research person', 'look up person', 'person search', 'who is this person',
    "person's profile", 'person profile', 'contact this person',
  ];
  const companyKeywords = [
    'find a company', 'find company', 'research company', 'look up company',
    'company search', 'tell me about this company',
  ];

  for (const kw of personKeywords) {
    if (lower.includes(kw)) {
      return { intent: 'research_person', confidence: 0.92, reasoning: `Query contains person-search keyword: "${kw}"` };
    }
  }
  for (const kw of companyKeywords) {
    if (lower.includes(kw)) {
      return { intent: 'research_company', confidence: 0.92, reasoning: `Query contains company-search keyword: "${kw}"` };
    }
  }

  // Title + company combo → person (someone's role at a company)
  if (personName && title) {
    return { intent: 'research_person', confidence: 0.9, reasoning: 'Person name + job title detected' };
  }

  // Person name + LinkedIn /in/ URL → person
  if (personName && linkedinPersonUrl) {
    return { intent: 'research_person', confidence: 0.92, reasoning: 'Person name + LinkedIn profile URL detected' };
  }

  // Person name + email
  if (personName && email) {
    return { intent: 'research_person', confidence: 0.85, reasoning: 'Person name + email detected' };
  }

  // Founder / CEO / CTO + company name → person (someone is a founder of a company)
  if (companyName && /\b(?:founder|co-?founder|ceo|cto|coo|cfo|president|partner|investor|advisor)\b/i.test(text)) {
    // If a person name is ALSO detected, it's about the person
    if (personName) {
      return { intent: 'research_person', confidence: 0.88, reasoning: 'Person name + role + company detected' };
    }
    // Otherwise, "Founder @ Credora" alone might still be a person query
    return { intent: 'research_person', confidence: 0.75, reasoning: 'Role + company detected, likely person search' };
  }

  // Just a person name
  if (personName && !companyName) {
    return { intent: 'research_person', confidence: 0.8, reasoning: 'Person name detected, no company signal' };
  }

  // Just a company name
  if (companyName && !personName) {
    return { intent: 'research_company', confidence: 0.8, reasoning: 'Company name detected, no person signal' };
  }

  // Both detected — lean person (the company is the employer)
  if (personName && companyName) {
    return { intent: 'research_person', confidence: 0.78, reasoning: 'Both person and company detected — defaulting to person search' };
  }

  // Nothing detected — fall back to company
  return { intent: 'research_company', confidence: 0.4, reasoning: 'No strong signals — defaulting to company search' };
}

// ============================================================
// Main Entry Point
// ============================================================

/**
 * Parse a user query into a structured ParsedQuery object.
 * This is the single entry point for the rich query parser.
 */
export function parseQuery(userMessage: string): ParsedQuery {
  const text = userMessage.trim();

  // SECURITY: Cap input length to 10k chars. Real user queries are rarely
  // longer than ~2k chars; capping at 10k keeps every regex in this module
  // linear-time on adversarial inputs (CodeQL: polynomial regex on
  // uncontrolled data). Without this cap, an attacker could submit a
  // 100MB query string to DoS the parser.
  const CAPPED_TEXT = text.length > 10000 ? text.slice(0, 10000) : text;

  // ─── Extract bracketed blocks first (we use them throughout) ───
  const bracketBlocks = extractBracketBlocks(CAPPED_TEXT);

  // ─── Extract atomic entities ───
  const email = extractEmail(CAPPED_TEXT);
  const linkedinPersonUrl = extractLinkedinPerson(CAPPED_TEXT);
  const linkedinCompanyUrl = extractLinkedinCompany(CAPPED_TEXT);
  const { first: firstUrl, others: otherUrls } = extractUrls(CAPPED_TEXT);
  const phone = extractPhone(CAPPED_TEXT);
  const { city, stateProvince, country } = extractLocation(CAPPED_TEXT);
  const personName = extractPersonName(CAPPED_TEXT);
  const companyName = extractCompanyName(CAPPED_TEXT, bracketBlocks);
  const title = extractTitle(CAPPED_TEXT, bracketBlocks);
  const industry = extractIndustry(CAPPED_TEXT, bracketBlocks);
  const birthday = extractBirthday(CAPPED_TEXT);
  const foundingYear = extractFoundingYear(CAPPED_TEXT);

  // The "url" field is the first non-LinkedIn URL, or LinkedIn URL, or null
  const url = firstUrl || linkedinPersonUrl || linkedinCompanyUrl;

  // ─── Decide intent ───
  const intentDecision = decideIntent({
    text,
    personName,
    companyName,
    linkedinPersonUrl,
    linkedinCompanyUrl,
    email,
    url: firstUrl,
    title,
  });

  // ─── Build pre-populated prospect ───
  // Only include fields the user actually provided. The downstream
  // agent functions will MERGE these into the empty prospect they
  // create, and only fill in the gaps via external research.
  const prepop: Partial<ProspectResult> = {};
  let signalsProvided = 0;

  if (personName) { prepop.personName = personName; signalsProvided++; }
  if (companyName) {
    prepop.companyName = companyName;
    prepop.personCompany = companyName;
    signalsProvided++;
  }
  if (title) { prepop.personTitle = title; signalsProvided++; }
  if (email) { prepop.personEmail = email; prepop.generalEmail = email; signalsProvided++; }
  if (phone) { prepop.personPhone = phone; prepop.phoneMain = phone; signalsProvided++; }
  if (linkedinPersonUrl) { prepop.personLinkedin = linkedinPersonUrl; signalsProvided++; }
  if (linkedinCompanyUrl) { prepop.linkedinUrl = linkedinCompanyUrl; signalsProvided++; }
  if (city) { prepop.city = city; signalsProvided++; }
  if (stateProvince) { prepop.stateProvince = stateProvince; signalsProvided++; }
  if (country) { prepop.country = country; signalsProvided++; }
  if (industry) { prepop.industry = industry; signalsProvided++; }
  if (foundingYear) { prepop.foundingYear = foundingYear; signalsProvided++; }

  // Combine bio hints from bracket blocks
  if (bracketBlocks.length > 0) {
    // Find the bracket block that contains the most bio-like content
    const bioBlock = bracketBlocks.find(b =>
      /\b(software|engineer|developer|designer|founder|ceo|cto|specialist|analyst|architect|consultant|manager|director|scientist|researcher|strategist)\b/i.test(b)
    ) || bracketBlocks[0];
    // Trim to first 300 chars
    const bio = bioBlock.length > 300 ? bioBlock.slice(0, 300) + '...' : bioBlock;
    prepop.personBio = bio;
    signalsProvided++;

    // Also use bracket blocks to derive description for company
    if (!prepop.description && intentDecision.intent === 'research_company') {
      prepop.description = bio;
      signalsProvided++;
    }
  }

  // Industry detection already provided industry field; also derive tech stack hints
  const techStack: string[] = [];
  const techText = `${text} ${bracketBlocks.join(' ')}`.toLowerCase();
  const techMap: Record<string, string> = {
    'react': 'React', 'next.js': 'Next.js', 'nextjs': 'Next.js',
    'vue': 'Vue.js', 'angular': 'Angular', 'svelte': 'Svelte',
    'node.js': 'Node.js', 'nodejs': 'Node.js', 'python': 'Python',
    'django': 'Django', 'flask': 'Flask', 'fastapi': 'FastAPI',
    'ruby': 'Ruby', 'rails': 'Rails', 'go': 'Go', 'golang': 'Go',
    'java': 'Java', 'spring': 'Spring', 'kotlin': 'Kotlin', 'swift': 'Swift',
    'typescript': 'TypeScript', 'javascript': 'JavaScript',
    'aws': 'AWS', 'gcp': 'GCP', 'azure': 'Azure',
    'docker': 'Docker', 'kubernetes': 'Kubernetes', 'k8s': 'Kubernetes',
    'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL', 'mysql': 'MySQL',
    'mongodb': 'MongoDB', 'redis': 'Redis', 'supabase': 'Supabase',
    'firebase': 'Firebase', 'vercel': 'Vercel', 'netlify': 'Netlify',
    'stripe': 'Stripe', 'twilio': 'Twilio', 'segment': 'Segment',
    'salesforce': 'Salesforce', 'hubspot': 'HubSpot',
    'sap': 'SAP', 'oracle': 'Oracle', 'workday': 'Workday',
    'servicenow': 'ServiceNow', 'snowflake': 'Snowflake',
  };
  for (const [pattern, label] of Object.entries(techMap)) {
    const re = new RegExp(`\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(techText) && !techStack.includes(label)) {
      techStack.push(label);
    }
  }
  if (techStack.length > 0) {
    prepop.techStack = techStack;
    signalsProvided++;
  }

  // Products / services hints — look for nouns in bracket blocks
  const productsServices: string[] = [];
  for (const block of bracketBlocks) {
    // Look for "X & Y" or "X and Y" patterns
    const matches = block.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s*(?:&|and|,)\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(Systems|Services|Solutions|Platform|Applications|Apps|Software|Infrastructure|Cloud)\b/g);
    if (matches) {
      for (const m of matches) {
        const cleaned = clean(m);
        if (cleaned && !productsServices.includes(cleaned)) {
          productsServices.push(cleaned);
        }
      }
    }
  }
  if (productsServices.length > 0) {
    prepop.productsServices = productsServices;
  }

  // Sources — track that user supplied this data
  if (signalsProvided > 0) {
    prepop.sources = ['user-supplied'];
  }

  return {
    raw: text,
    guessedIntent: intentDecision.intent,
    confidence: intentDecision.confidence,
    reasoning: intentDecision.reasoning,
    personName,
    companyName,
    url,
    linkedinPersonUrl,
    linkedinCompanyUrl,
    email,
    phone,
    city,
    stateProvince,
    country,
    title,
    industry,
    birthday,
    foundingYear,
    otherUrls,
    bracketBlocks,
    prepopulatedProspect: prepop,
    signalsProvided,
  };
}

// ============================================================
// Pre-population Helper
// ============================================================

/**
 * Merge pre-populated fields from a ParsedQuery into an existing
 * (typically empty) ProspectResult. Existing values are preserved
 * (pre-populated fields only fill EMPTY slots).
 */
export function mergeParsedIntoProspect(
  prospect: ProspectResult,
  parsed: ParsedQuery,
): void {
  const prepop = parsed.prepopulatedProspect;
  const arrayKeys = new Set(['techStack', 'productsServices', 'recentNews', 'partners', 'boardMembers', 'sources']);

  for (const [key, value] of Object.entries(prepop)) {
    if (value === null || value === undefined) continue;

    if (arrayKeys.has(key)) {
      const arr = value as unknown[];
      if (Array.isArray(arr) && arr.length > 0) {
        const existing = (prospect as unknown as Record<string, unknown[]>)[key];
        if (!existing || existing.length === 0) {
          (prospect as unknown as Record<string, unknown[]>)[key] = arr;
        } else {
          // Merge unique
          const merged = [...new Set([...existing, ...arr])];
          (prospect as unknown as Record<string, unknown[]>)[key] = merged;
        }
      }
    } else {
      const existing = (prospect as unknown as Record<string, unknown>)[key];
      if (existing === null || existing === undefined || existing === '') {
        (prospect as unknown as Record<string, unknown>)[key] = value;
      }
    }
  }
}
