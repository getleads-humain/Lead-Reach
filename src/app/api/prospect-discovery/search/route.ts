import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webRead, exaSearch, linkedInSearchPeople, linkedInSearchCompanies, twitterSearch } from '@/lib/agent-reach-bridge';

// ============================================================
// Types
// ============================================================

type QueryType = 'company' | 'url' | 'person' | 'unknown';

interface ProspectData {
  queryType: QueryType;
  query: string;

  // Company Info
  companyName: string | null;
  legalName: string | null;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  description: string | null;

  // Location
  hqAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  postalCode: string | null;

  // Contact Info
  phoneMain: string | null;
  generalEmail: string | null;
  supportEmail: string | null;

  // Key People
  ceoName: string | null;
  ceoEmail: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;

  // Firmographics
  employeeCount: string | null;
  revenueEstimate: string | null;
  foundingYear: string | null;
  ownershipType: string | null;

  // Digital
  linkedinUrl: string | null;
  twitterHandle: string | null;
  facebookPage: string | null;
  techStack: string[];

  // Additional Discovery
  boardMembers: string[];
  recentNews: string[];
  productsServices: string[];
  partners: string[];
  fundingInfo: string | null;

  // People-specific fields
  personName: string | null;
  personTitle: string | null;
  personCompany: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personLinkedin: string | null;
  personBio: string | null;

  // Research metadata
  sources: string[];
  dataCompleteness: number;
}

interface ResearchStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
}

// ============================================================
// Query Type Detection
// ============================================================

function detectQueryType(query: string): QueryType {
  const trimmed = query.trim();

  // URL detection
  const urlPattern = /^https?:\/\/[^\s]+/i;
  if (urlPattern.test(trimmed)) {
    return 'url';
  }

  // Person name detection (2-4 words, capitalized, no numbers)
  const personPattern = /^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/;
  if (personPattern.test(trimmed)) {
    return 'person';
  }

  // Company detection (anything else - could be company name, brand, etc.)
  if (trimmed.length > 2) {
    return 'company';
  }

  return 'unknown';
}

// ============================================================
// LLM Call Helper
// ============================================================

async function callLLM(systemPrompt: string, userMessage: string, retries = 1): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  const zai = await ZAI.create();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      });
      const content = completion.choices?.[0]?.message?.content;
      if (content && !content.trim().startsWith('<!DOCTYPE')) {
        return content;
      }
      throw new Error('Invalid LLM response');
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('LLM call failed after retries');
}

async function callLLMForJSON<T>(systemPrompt: string, userMessage: string): Promise<T> {
  const response = await callLLM(systemPrompt, userMessage);

  // Strategy 1: Find JSON in markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1]); } catch {}
  }

  // Strategy 2: Find first balanced { } or [ ]
  const jsonMatch = response.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1]); } catch {}
  }

  // Strategy 3: Direct parse
  try { return JSON.parse(response); } catch {}

  throw new Error('Could not extract JSON from LLM response');
}

// ============================================================
// Research Pipeline
// ============================================================

async function researchCompany(companyName: string, steps: ResearchStep[]): Promise<ProspectData> {
  const sources: string[] = [];
  const prospect: ProspectData = createEmptyProspect('company', companyName);
  prospect.companyName = companyName;

  // Step 1: Web Search for company info
  steps.push({ step: 'web-search', status: 'running', message: `Searching the web for "${companyName}"...` });
  try {
    const searchResult = await exaSearch(`${companyName} company overview contact information`, 10);
    if (searchResult.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} web results`;

      // Read top 3 results
      const topUrls = searchResult.data.slice(0, 3).map(r => r.url);
      const readResults = await Promise.allSettled(topUrls.map(u => webRead(u)));
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          webContents.push(result.value.data.content.slice(0, 5000));
        }
      }

      // Step 2: Extract company data with LLM
      steps.push({ step: 'llm-extract', status: 'running', message: 'Extracting company information with AI...' });
      if (webContents.length > 0) {
        const extracted = await callLLMForJSON<Partial<ProspectData>>(`
You are a B2B data extraction specialist. Extract the following information about a company from the provided web content.
Return ONLY a JSON object with these fields (use null for anything not found):
- companyName, legalName, website, industry, subIndustry, description
- hqAddress, city, stateProvince, country, postalCode
- phoneMain, generalEmail, supportEmail
- ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail
- employeeCount, revenueEstimate, foundingYear, ownershipType
- linkedinUrl, twitterHandle, facebookPage
- techStack (array of strings), boardMembers (array of strings)
- recentNews (array of recent news headlines), productsServices (array of strings)
- partners (array of strings), fundingInfo
Be precise. Only include information explicitly stated in the content.`, `Company: ${companyName}\n\nWeb Content:\n${webContents.join('\n---\n')}`);

        safeMerge(prospect, extracted);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Extracted company data from web sources';
      }
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited web results found';
    }
  } catch (error) {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = `Web search error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }

  // Step 3: LinkedIn company search
  steps.push({ step: 'linkedin-search', status: 'running', message: 'Searching LinkedIn for company profile...' });
  try {
    const liResult = await linkedInSearchCompanies(companyName, 3);
    if (liResult.success && liResult.data.length > 0) {
      const company = liResult.data[0];
      if (company.name && !prospect.companyName) prospect.companyName = company.name;
      if (company.headline && !prospect.description) prospect.description = company.headline;
      if (company.url && !prospect.linkedinUrl) prospect.linkedinUrl = company.url;
      if (company.location && !prospect.hqAddress) prospect.hqAddress = company.location;
      sources.push(`linkedin:${company.url || companyName}`);
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Found LinkedIn company profile';
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'No LinkedIn profile found';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'LinkedIn search unavailable';
  }

  // Step 4: Deep research - search for specific contact/decision maker info
  steps.push({ step: 'deep-research', status: 'running', message: 'Researching key contacts and decision makers...' });
  try {
    const contactSearch = await exaSearch(`${companyName} CEO founder leadership team contact email`, 5);
    if (contactSearch.success && contactSearch.data.length > 0) {
      sources.push(...contactSearch.data.map(r => r.url));
      const topUrl = contactSearch.data[0]?.url;
      if (topUrl) {
        const readResult = await webRead(topUrl);
        if (readResult.success) {
          const contactData = await callLLMForJSON<{
            ceoName?: string | null;
            keyContactName?: string | null;
            keyContactTitle?: string | null;
            keyContactEmail?: string | null;
            ceoEmail?: string | null;
            boardMembers?: string[];
          }>(`
Extract key people and contact information from this web content about "${companyName}".
Return JSON with: ceoName, keyContactName, keyContactTitle, keyContactEmail, ceoEmail, boardMembers (array of names).
Use null for anything not found.`, readResult.data.content.slice(0, 4000));

          if (contactData.ceoName && !prospect.ceoName) prospect.ceoName = contactData.ceoName;
          if (contactData.keyContactName && !prospect.keyContactName) prospect.keyContactName = contactData.keyContactName;
          if (contactData.keyContactTitle && !prospect.keyContactTitle) prospect.keyContactTitle = contactData.keyContactTitle;
          if (contactData.keyContactEmail && !prospect.keyContactEmail) prospect.keyContactEmail = contactData.keyContactEmail;
          if (contactData.ceoEmail && !prospect.ceoEmail) prospect.ceoEmail = contactData.ceoEmail;
          if (contactData.boardMembers?.length && (!prospect.boardMembers || prospect.boardMembers.length === 0)) {
            prospect.boardMembers = contactData.boardMembers;
          }
        }
      }
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Found key contact information';
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited contact info available';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'Deep research partially completed';
  }

  // Step 5: News & recent activity
  steps.push({ step: 'news-research', status: 'running', message: 'Finding recent news and activity...' });
  try {
    const newsSearch = await exaSearch(`${companyName} news 2024 2025 2026`, 5);
    if (newsSearch.success && newsSearch.data.length > 0) {
      sources.push(...newsSearch.data.map(r => r.url));
      if (prospect.recentNews.length === 0) {
        prospect.recentNews = newsSearch.data.map(r => `${r.title} - ${r.snippet?.slice(0, 100) || ''}`);
      }
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${newsSearch.data.length} recent news items`;
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'No recent news found';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'News research skipped';
  }

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return prospect;
}

async function researchUrl(url: string, steps: ResearchStep[]): Promise<ProspectData> {
  const sources: string[] = [url];
  const prospect: ProspectData = createEmptyProspect('url', url);

  // Step 1: Read the URL
  steps.push({ step: 'web-read', status: 'running', message: `Reading webpage: ${url}...` });
  try {
    const readResult = await webRead(url);
    if (readResult.success) {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Read ${readResult.data.wordCount} words from page`;

      // Step 2: Extract company/person info from the page
      steps.push({ step: 'llm-extract', status: 'running', message: 'Analyzing page content with AI...' });
      const extracted = await callLLMForJSON<{
        companyName?: string | null;
        personName?: string | null;
        personTitle?: string | null;
        personEmail?: string | null;
        personPhone?: string | null;
        industry?: string | null;
        description?: string | null;
        website?: string | null;
        city?: string | null;
        country?: string | null;
        phoneMain?: string | null;
        generalEmail?: string | null;
        linkedinUrl?: string | null;
        productsServices?: string[];
        keyContactName?: string | null;
        keyContactTitle?: string | null;
        keyContactEmail?: string | null;
      }>(`
Analyze this webpage and extract all business/contact information. Determine if it's a company page or a person's profile.
Return JSON with:
- companyName (if this is a company page)
- personName, personTitle, personEmail, personPhone (if this is a person's page/profile)
- industry, description, website
- city, country, phoneMain, generalEmail
- linkedinUrl
- productsServices (array of strings)
- keyContactName, keyContactTitle, keyContactEmail
Use null for anything not found.`, readResult.data.content.slice(0, 8000));

      if (extracted.companyName) {
        prospect.companyName = extracted.companyName;
        prospect.queryType = 'company';
      }
      if (extracted.personName) {
        prospect.personName = extracted.personName;
        prospect.personTitle = extracted.personTitle || null;
        prospect.personEmail = extracted.personEmail || null;
        prospect.personPhone = extracted.personPhone || null;
        if (!extracted.companyName) prospect.queryType = 'person';
      }
      Object.assign(prospect, {
        industry: extracted.industry || null,
        description: extracted.description || null,
        website: extracted.website || null,
        city: extracted.city || null,
        country: extracted.country || null,
        phoneMain: extracted.phoneMain || null,
        generalEmail: extracted.generalEmail || null,
        linkedinUrl: extracted.linkedinUrl || null,
        productsServices: extracted.productsServices || [],
        keyContactName: extracted.keyContactName || null,
        keyContactTitle: extracted.keyContactTitle || null,
        keyContactEmail: extracted.keyContactEmail || null,
      });
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Extracted data from webpage';

      // Step 3: If company found, do deep research
      if (prospect.companyName) {
        steps.push({ step: 'deep-research', status: 'running', message: `Deep researching ${prospect.companyName}...` });
        try {
          const companyResearch = await exaSearch(`"${prospect.companyName}" company overview employees revenue`, 5);
          if (companyResearch.success && companyResearch.data.length > 0) {
            sources.push(...companyResearch.data.map(r => r.url));
            const topResult = companyResearch.data[0];
            if (topResult) {
              const deepRead = await webRead(topResult.url);
              if (deepRead.success) {
                const deepData = await callLLMForJSON<Partial<ProspectData>>(`
Extract comprehensive business data about "${prospect.companyName}" from this content.
Return JSON with: legalName, industry, subIndustry, hqAddress, city, stateProvince, country, employeeCount, revenueEstimate, foundingYear, ownershipType, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, linkedinUrl, twitterHandle, techStack (array), boardMembers (array), recentNews (array), fundingInfo.
Use null for anything not found.`, deepRead.data.content.slice(0, 6000));
                // Merge deep data, don't overwrite existing non-null values
                for (const [key, value] of Object.entries(deepData)) {
                  if (value !== null && value !== undefined && (prospect as Record<string, unknown>)[key] === null) {
                    (prospect as Record<string, unknown>)[key] = value;
                  }
                }
              }
            }
            steps[steps.length - 1].status = 'completed';
            steps[steps.length - 1].message = 'Deep research completed';
          }
        } catch {
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = 'Deep research partially completed';
        }
      }
    } else {
      steps[steps.length - 1].status = 'failed';
      steps[steps.length - 1].message = 'Could not read the webpage';
    }
  } catch (error) {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = `Error reading URL: ${error instanceof Error ? error.message : 'Unknown'}`;
  }

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return prospect;
}

async function researchPerson(personName: string, steps: ResearchStep[]): Promise<ProspectData> {
  const sources: string[] = [];
  const prospect: ProspectData = createEmptyProspect('person', personName);
  prospect.personName = personName;

  // Step 1: Web search
  steps.push({ step: 'web-search', status: 'running', message: `Searching for "${personName}"...` });
  try {
    const searchResult = await exaSearch(`"${personName}" professional profile company title`, 10);
    if (searchResult.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} results`;

      // Read top results
      const topUrls = searchResult.data.slice(0, 3).map(r => r.url);
      const readResults = await Promise.allSettled(topUrls.map(u => webRead(u)));
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && result.value.success) {
          webContents.push(result.value.data.content.slice(0, 5000));
        }
      }

      // Step 2: Extract person data
      steps.push({ step: 'llm-extract', status: 'running', message: 'Extracting person information with AI...' });
      if (webContents.length > 0) {
        const extracted = await callLLMForJSON<{
          personName?: string | null;
          personTitle?: string | null;
          personCompany?: string | null;
          personEmail?: string | null;
          personPhone?: string | null;
          personLinkedin?: string | null;
          personBio?: string | null;
          companyName?: string | null;
          industry?: string | null;
          city?: string | null;
          country?: string | null;
          website?: string | null;
        }>(`
Extract information about the person "${personName}" from this web content.
Return JSON with: personName, personTitle, personCompany, personEmail, personPhone, personLinkedin, personBio, companyName, industry, city, country, website.
Use null for anything not found.`, webContents.join('\n---\n'));

        if (extracted.personName) prospect.personName = extracted.personName;
        if (extracted.personTitle) prospect.personTitle = extracted.personTitle;
        if (extracted.personCompany) prospect.personCompany = extracted.personCompany;
        if (extracted.personEmail) prospect.personEmail = extracted.personEmail;
        if (extracted.personPhone) prospect.personPhone = extracted.personPhone;
        if (extracted.personLinkedin) prospect.personLinkedin = extracted.personLinkedin;
        if (extracted.personBio) prospect.personBio = extracted.personBio;
        if (extracted.companyName) prospect.companyName = extracted.companyName;
        if (extracted.industry) prospect.industry = extracted.industry;
        if (extracted.city) prospect.city = extracted.city;
        if (extracted.country) prospect.country = extracted.country;
        if (extracted.website) prospect.website = extracted.website;

        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Extracted person data';
      }
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited results found';
    }
  } catch (error) {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = `Search error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }

  // Step 3: LinkedIn people search
  steps.push({ step: 'linkedin-search', status: 'running', message: 'Searching LinkedIn profiles...' });
  try {
    const liResult = await linkedInSearchPeople(personName, 3);
    if (liResult.success && liResult.data.length > 0) {
      const person = liResult.data[0];
      if (person.name && !prospect.personName) prospect.personName = person.name;
      if (person.headline && !prospect.personTitle) prospect.personTitle = person.headline;
      if (person.url && !prospect.personLinkedin) prospect.personLinkedin = person.url;
      if (person.location && !prospect.hqAddress) prospect.hqAddress = person.location;
      sources.push(`linkedin:${person.url || personName}`);
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

  // Step 4: If company is associated, research the company too
  if (prospect.personCompany || prospect.companyName) {
    const companyName = prospect.personCompany || prospect.companyName!;
    steps.push({ step: 'company-research', status: 'running', message: `Researching associated company: ${companyName}...` });
    try {
      const companySearch = await exaSearch(`"${companyName}" company contact email phone`, 5);
      if (companySearch.success && companySearch.data.length > 0) {
        sources.push(...companySearch.data.map(r => r.url));
        const topUrl = companySearch.data[0]?.url;
        if (topUrl) {
          const readResult = await webRead(topUrl);
          if (readResult.success) {
            const companyData = await callLLMForJSON<Partial<ProspectData>>(`
Extract company information about "${companyName}" from this content.
Return JSON with: companyName, website, industry, hqAddress, city, country, phoneMain, generalEmail, employeeCount, revenueEstimate, linkedinUrl, twitterHandle.
Use null for anything not found.`, readResult.data.content.slice(0, 4000));

            if (companyData.companyName && !prospect.companyName) prospect.companyName = companyData.companyName;
            if (companyData.website && !prospect.website) prospect.website = companyData.website;
            if (companyData.industry && !prospect.industry) prospect.industry = companyData.industry;
            if (companyData.hqAddress && !prospect.hqAddress) prospect.hqAddress = companyData.hqAddress;
            if (companyData.city && !prospect.city) prospect.city = companyData.city;
            if (companyData.country && !prospect.country) prospect.country = companyData.country;
            if (companyData.phoneMain && !prospect.phoneMain) prospect.phoneMain = companyData.phoneMain;
            if (companyData.generalEmail && !prospect.generalEmail) prospect.generalEmail = companyData.generalEmail;
            if (companyData.employeeCount && !prospect.employeeCount) prospect.employeeCount = companyData.employeeCount;
            if (companyData.revenueEstimate && !prospect.revenueEstimate) prospect.revenueEstimate = companyData.revenueEstimate;
            if (companyData.linkedinUrl && !prospect.linkedinUrl) prospect.linkedinUrl = companyData.linkedinUrl;
            if (companyData.twitterHandle && !prospect.twitterHandle) prospect.twitterHandle = companyData.twitterHandle;
          }
        }
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Company research completed';
      }
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Company research partially completed';
    }
  }

  // Step 5: Twitter search
  steps.push({ step: 'twitter-search', status: 'running', message: 'Searching Twitter/X...' });
  try {
    const twResult = await twitterSearch(personName, 3);
    if (twResult.success && twResult.data.length > 0) {
      const tweet = twResult.data[0];
      if (tweet.username && !prospect.twitterHandle) prospect.twitterHandle = `@${tweet.username}`;
      sources.push(`twitter:${tweet.url || personName}`);
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

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return prospect;
}

// ============================================================
// Helpers
// ============================================================

function createEmptyProspect(queryType: QueryType, query: string): ProspectData {
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

function calculateCompleteness(p: ProspectData): number {
  const fields: (string | string[] | null)[] = [
    p.companyName, p.website, p.industry, p.description,
    p.hqAddress, p.city, p.country,
    p.phoneMain, p.generalEmail,
    p.ceoName, p.keyContactName, p.keyContactEmail,
    p.employeeCount, p.revenueEstimate,
    p.linkedinUrl, p.twitterHandle,
  ];
  const arrayFields: string[][] = [p.techStack, p.boardMembers, p.recentNews, p.productsServices];
  let filled = 0;
  let total = fields.length + arrayFields.length;
  for (const f of fields) { if (f) filled++; }
  for (const a of arrayFields) { if (a.length > 0) filled++; }
  return Math.round((filled / total) * 100);
}

/**
 * Safely merge extracted data into prospect, preserving non-null existing values
 * and ensuring array fields are never overwritten with null.
 */
function safeMerge(target: ProspectData, source: Partial<ProspectData>): void {
  const arrayKeys = new Set(['techStack', 'boardMembers', 'recentNews', 'productsServices', 'partners', 'sources']);
  for (const [key, value] of Object.entries(source)) {
    if (value === undefined) continue;
    if (arrayKeys.has(key)) {
      // Only overwrite array fields if the new value is a non-empty array
      if (Array.isArray(value) && value.length > 0) {
        (target as Record<string, unknown>)[key] = value;
      }
    } else {
      // Only overwrite non-null existing values if the new value is non-null
      if (value !== null && value !== '') {
        (target as Record<string, unknown>)[key] = value;
      }
    }
  }
}

// ============================================================
// API Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body as { query: string };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const trimmedQuery = query.trim();
    const queryType = detectQueryType(trimmedQuery);
    const steps: ResearchStep[] = [];

    // Initial classification step
    steps.push({
      step: 'classify',
      status: 'completed',
      message: `Detected query type: ${queryType} ("${trimmedQuery}")`,
    });

    let prospect: ProspectData;

    switch (queryType) {
      case 'url':
        prospect = await researchUrl(trimmedQuery, steps);
        break;
      case 'person':
        prospect = await researchPerson(trimmedQuery, steps);
        break;
      case 'company':
      default:
        prospect = await researchCompany(trimmedQuery, steps);
        break;
    }

    return NextResponse.json({
      success: true,
      query: trimmedQuery,
      queryType,
      prospect,
      steps,
    });
  } catch (error) {
    console.error('Prospect discovery error:', error);
    return NextResponse.json({
      error: 'Failed to research prospect',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
