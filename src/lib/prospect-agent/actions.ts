// ============================================================
// Prospect Discovery Agent — Action Execution Engine
// ============================================================

import { callLLM, callLLMForJSON } from '@/lib/llm';
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

// ============================================================
// Company Research Action
// ============================================================

export async function executeCompanyResearch(
  companyName: string,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];
  const prospect = createEmptyProspect('company', companyName);
  prospect.companyName = companyName;

  // Step 1: Web search
  steps.push({ type: 'research_company', label: 'Web Search', status: 'running', message: `Searching for "${companyName}"...` });
  try {
    const searchResult = await withTimeout(
      () => exaSearch(`${companyName} company overview contact information`, 10),
      30_000, 'Company web search',
    );
    if (searchResult?.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} web results`;

      // Read top 3 results
      const topUrls = searchResult.data.slice(0, 3).map(r => r.url);
      const readResults = await Promise.allSettled(
        topUrls.map(u => withTimeout(() => webRead(u), 25_000, `Read: ${u.slice(0, 50)}`)),
      );
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && result.value?.success) {
          webContents.push(result.value.data.content.slice(0, 5000));
        }
      }

      // Step 2: Extract data with LLM
      steps.push({ type: 'research_company', label: 'AI Extraction', status: 'running', message: 'Extracting company data with AI...' });
      if (webContents.length > 0) {
        const extracted = await withTimeout(
          () => callLLMForJSON<Partial<ProspectResult>>(
            `You are a B2B data extraction specialist. Extract company information from the provided web content.
Return ONLY a JSON object with these fields (use null for anything not found):
companyName, legalName, website, industry, subIndustry, description,
hqAddress, city, stateProvince, country, postalCode,
phoneMain, generalEmail, supportEmail,
ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail,
employeeCount, revenueEstimate, foundingYear, ownershipType,
linkedinUrl, twitterHandle, facebookPage,
techStack (array of strings), boardMembers (array of strings),
recentNews (array of strings), productsServices (array of strings),
partners (array of strings), fundingInfo.
Be precise. Only include information explicitly stated.`,
            `Company: ${companyName}\n\nWeb Content:\n${webContents.join('\n---\n')}`,
          ),
          45_000, 'Company LLM extraction',
        );
        if (extracted) safeMerge(prospect, extracted);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Extracted company data';
      }
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited web results';
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Web search failed';
  }

  // Step 3: LinkedIn
  steps.push({ type: 'research_company', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
  try {
    const liResult = await withTimeout(
      () => linkedInSearchCompanies(companyName, 3),
      20_000, 'LinkedIn search',
    );
    if (liResult?.success && liResult.data.length > 0) {
      const company = liResult.data[0];
      if (company.name && !prospect.companyName) prospect.companyName = company.name;
      if (company.headline && !prospect.description) prospect.description = company.headline;
      if (company.url && !prospect.linkedinUrl) prospect.linkedinUrl = company.url;
      if (company.location && !prospect.hqAddress) prospect.hqAddress = company.location;
      sources.push(`linkedin:${company.url || companyName}`);
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

  // Step 4: Deep contact research
  steps.push({ type: 'research_company', label: 'Deep Research', status: 'running', message: 'Researching key contacts...' });
  try {
    const contactSearch = await withTimeout(
      () => exaSearch(`${companyName} CEO founder leadership team contact email`, 5),
      30_000, 'Deep contact search',
    );
    if (contactSearch?.success && contactSearch.data.length > 0) {
      sources.push(...contactSearch.data.map(r => r.url));
      const topUrl = contactSearch.data[0]?.url;
      if (topUrl) {
        const readResult = await withTimeout(() => webRead(topUrl), 25_000, 'Deep contact read');
        if (readResult?.success) {
          const contactData = await withTimeout(
            () => callLLMForJSON<{
              ceoName?: string | null;
              keyContactName?: string | null;
              keyContactTitle?: string | null;
              keyContactEmail?: string | null;
              ceoEmail?: string | null;
              boardMembers?: string[];
            }>(
              `Extract key people and contact info from this content about "${companyName}".
Return JSON: ceoName, keyContactName, keyContactTitle, keyContactEmail, ceoEmail, boardMembers (array of names). Use null for not found.`,
              readResult.data.content.slice(0, 4000),
            ),
            45_000, 'Deep contact LLM',
          );
          if (contactData) {
            if (contactData.ceoName && !prospect.ceoName) prospect.ceoName = contactData.ceoName;
            if (contactData.keyContactName && !prospect.keyContactName) prospect.keyContactName = contactData.keyContactName;
            if (contactData.keyContactTitle && !prospect.keyContactTitle) prospect.keyContactTitle = contactData.keyContactTitle;
            if (contactData.keyContactEmail && !prospect.keyContactEmail) prospect.keyContactEmail = contactData.keyContactEmail;
            if (contactData.ceoEmail && !prospect.ceoEmail) prospect.ceoEmail = contactData.ceoEmail;
            if (contactData.boardMembers?.length && !prospect.boardMembers.length) prospect.boardMembers = contactData.boardMembers;
          }
        }
      }
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Found key contacts';
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited contact info';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'Deep research partially completed';
  }

  // Step 5: News
  steps.push({ type: 'research_company', label: 'News Search', status: 'running', message: 'Finding recent news...' });
  try {
    const newsSearch = await withTimeout(
      () => exaSearch(`${companyName} news 2024 2025 2026`, 5),
      20_000, 'News search',
    );
    if (newsSearch?.success && newsSearch.data.length > 0) {
      sources.push(...newsSearch.data.map(r => r.url));
      if (!prospect.recentNews.length) {
        prospect.recentNews = newsSearch.data.map(r => `${r.title} - ${r.snippet?.slice(0, 100) || ''}`);
      }
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${newsSearch.data.length} news items`;
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'No recent news found';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'News search skipped';
  }

  prospect.sources = [...new Set(sources)];
  prospect.dataCompleteness = calculateCompleteness(prospect);
  return { prospect, steps };
}

// ============================================================
// Person Research Action
// ============================================================

export async function executePersonResearch(
  personName: string,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];
  const prospect = createEmptyProspect('person', personName);
  prospect.personName = personName;

  // Step 1: Web search
  steps.push({ type: 'research_person', label: 'Web Search', status: 'running', message: `Searching for "${personName}"...` });
  try {
    const searchResult = await withTimeout(
      () => exaSearch(`"${personName}" professional profile company title`, 10),
      30_000, 'Person web search',
    );
    if (searchResult?.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} results`;

      const topUrls = searchResult.data.slice(0, 3).map(r => r.url);
      const readResults = await Promise.allSettled(
        topUrls.map(u => withTimeout(() => webRead(u), 25_000, `Person read: ${u.slice(0, 50)}`)),
      );
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && result.value?.success) {
          webContents.push(result.value.data.content.slice(0, 5000));
        }
      }

      // Step 2: Extract person data
      steps.push({ type: 'research_person', label: 'AI Extraction', status: 'running', message: 'Extracting person data with AI...' });
      if (webContents.length > 0) {
        const extracted = await withTimeout(
          () => callLLMForJSON<Partial<ProspectResult>>(
            `Extract information about "${personName}" from this web content.
Return JSON: personName, personTitle, personCompany, personEmail, personPhone, personLinkedin, personBio, companyName, industry, city, country, website. Use null for not found.`,
            webContents.join('\n---\n'),
          ),
          45_000, 'Person LLM extraction',
        );
        if (extracted) {
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
        }
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Extracted person data';
      }
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Limited results found';
    }
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Web search failed';
  }

  // Step 3: LinkedIn
  steps.push({ type: 'research_person', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
  try {
    const liResult = await withTimeout(() => linkedInSearchPeople(personName, 3), 20_000, 'LinkedIn person');
    if (liResult?.success && liResult.data.length > 0) {
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

  // Step 4: Associated company research
  const companyName = prospect.personCompany || prospect.companyName;
  if (companyName) {
    steps.push({ type: 'research_person', label: 'Company Research', status: 'running', message: `Researching ${companyName}...` });
    try {
      const companySearch = await withTimeout(
        () => exaSearch(`"${companyName}" company contact email phone`, 5),
        30_000, 'Person company search',
      );
      if (companySearch?.success && companySearch.data.length > 0) {
        sources.push(...companySearch.data.map(r => r.url));
        const topUrl = companySearch.data[0]?.url;
        if (topUrl) {
          const readResult = await withTimeout(() => webRead(topUrl), 25_000, 'Person company read');
          if (readResult?.success) {
            const companyData = await withTimeout(
              () => callLLMForJSON<Partial<ProspectResult>>(
                `Extract company info about "${companyName}" from this content.
Return JSON: companyName, website, industry, city, country, phoneMain, generalEmail, employeeCount, revenueEstimate, linkedinUrl, twitterHandle. Use null for not found.`,
                readResult.data.content.slice(0, 4000),
              ),
              45_000, 'Person company LLM',
            );
            if (companyData) {
              if (companyData.companyName && !prospect.companyName) prospect.companyName = String(companyData.companyName);
              if (companyData.website && !prospect.website) prospect.website = String(companyData.website);
              if (companyData.industry && !prospect.industry) prospect.industry = String(companyData.industry);
              if (companyData.city && !prospect.city) prospect.city = String(companyData.city);
              if (companyData.country && !prospect.country) prospect.country = String(companyData.country);
              if (companyData.phoneMain && !prospect.phoneMain) prospect.phoneMain = String(companyData.phoneMain);
              if (companyData.generalEmail && !prospect.generalEmail) prospect.generalEmail = String(companyData.generalEmail);
              if (companyData.employeeCount && !prospect.employeeCount) prospect.employeeCount = String(companyData.employeeCount);
              if (companyData.revenueEstimate && !prospect.revenueEstimate) prospect.revenueEstimate = String(companyData.revenueEstimate);
              if (companyData.linkedinUrl && !prospect.linkedinUrl) prospect.linkedinUrl = String(companyData.linkedinUrl);
              if (companyData.twitterHandle && !prospect.twitterHandle) prospect.twitterHandle = String(companyData.twitterHandle);
            }
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

  // Step 5: Twitter
  steps.push({ type: 'research_person', label: 'Twitter/X', status: 'running', message: 'Searching Twitter/X...' });
  try {
    const twResult = await withTimeout(() => twitterSearch(personName, 3), 20_000, 'Twitter search');
    if (twResult?.success && twResult.data.length > 0) {
      const tweet = twResult.data[0] as unknown as Record<string, unknown>;
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
  return { prospect, steps };
}

// ============================================================
// URL Research Action
// ============================================================

export async function executeUrlResearch(
  url: string,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [url];
  const prospect = createEmptyProspect('url', url);

  steps.push({ type: 'research_url', label: 'Reading Page', status: 'running', message: `Reading ${url}...` });
  try {
    const readResult = await withTimeout(() => webRead(url), 25_000, `URL read: ${url.slice(0, 50)}`);
    if (readResult?.success) {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Read ${readResult.data.wordCount} words`;

      steps.push({ type: 'research_url', label: 'AI Extraction', status: 'running', message: 'Analyzing page content...' });
      const extracted = await withTimeout(
        () => callLLMForJSON<Partial<ProspectResult>>(
          `Analyze this webpage and extract business/contact information. Determine if it's a company or person page.
Return JSON: companyName, personName, personTitle, personEmail, personPhone, industry, description, website, city, country, phoneMain, generalEmail, linkedinUrl, productsServices (array), keyContactName, keyContactTitle, keyContactEmail. Use null for not found.`,
          readResult.data.content.slice(0, 8000),
        ),
        45_000, 'URL LLM extraction',
      );

      if (extracted) {
        if (extracted.companyName) { prospect.companyName = extracted.companyName; prospect.queryType = 'company'; }
        if (extracted.personName) { prospect.personName = extracted.personName; prospect.personTitle = extracted.personTitle || null; prospect.personEmail = extracted.personEmail || null; }
        if (extracted.industry) prospect.industry = extracted.industry;
        if (extracted.description) prospect.description = extracted.description;
        if (extracted.website) prospect.website = extracted.website;
        if (extracted.city) prospect.city = extracted.city;
        if (extracted.country) prospect.country = extracted.country;
        if (extracted.phoneMain) prospect.phoneMain = extracted.phoneMain;
        if (extracted.generalEmail) prospect.generalEmail = extracted.generalEmail;
        if (extracted.linkedinUrl) prospect.linkedinUrl = extracted.linkedinUrl;
        if (extracted.productsServices?.length) prospect.productsServices = extracted.productsServices;
        if (extracted.keyContactName) prospect.keyContactName = extracted.keyContactName;
        if (extracted.keyContactTitle) prospect.keyContactTitle = extracted.keyContactTitle;
        if (extracted.keyContactEmail) prospect.keyContactEmail = extracted.keyContactEmail;
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Extracted data from page';
      }

      // Deep research if company found
      if (prospect.companyName) {
        steps.push({ type: 'research_url', label: 'Deep Research', status: 'running', message: `Deep researching ${prospect.companyName}...` });
        try {
          const companySearch = await withTimeout(
            () => exaSearch(`"${prospect.companyName}" company overview employees revenue`, 5),
            30_000, 'URL deep search',
          );
          if (companySearch?.success && companySearch.data.length > 0) {
            sources.push(...companySearch.data.map(r => r.url));
            const topResult = companySearch.data[0];
            if (topResult) {
              const deepRead = await withTimeout(() => webRead(topResult.url), 25_000, 'URL deep read');
              if (deepRead?.success) {
                const deepData = await withTimeout(
                  () => callLLMForJSON<Partial<ProspectResult>>(
                    `Extract comprehensive business data about "${prospect.companyName}" from this content.
Return JSON: legalName, industry, subIndustry, hqAddress, city, stateProvince, country, employeeCount, revenueEstimate, foundingYear, ownershipType, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, linkedinUrl, twitterHandle, techStack (array), boardMembers (array), recentNews (array), fundingInfo. Use null for not found.`,
                    deepRead.data.content.slice(0, 6000),
                  ),
                  45_000, 'URL deep LLM',
                );
                if (deepData) {
                  for (const [key, value] of Object.entries(deepData)) {
                    if (value !== null && value !== undefined && (prospect as unknown as Record<string, unknown>)[key] === null) {
                      (prospect as unknown as Record<string, unknown>)[key] = value;
                    }
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
  } catch {
    steps[steps.length - 1].status = 'failed';
    steps[steps.length - 1].message = 'Error reading URL';
  }

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
        if (result.status === 'fulfilled' && result.value?.success) {
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
        if (result.status === 'fulfilled' && result.value?.success) {
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
  try {
    const response = await callLLM({
      systemPrompt: getConversationResponsePrompt(
        persona as 'scout' | 'hound' | 'analyst' | 'architect' | 'judge' | 'scribe' | 'navigator',
        intent,
        userMessage,
        actionResults,
        context,
      ),
      userMessage: 'Generate your conversational response based on the action results above.',
      retriesPerModel: 2, // Increased from 1 to 2 for better resilience
    });
    if (response) return response;

    // LLM returned null — generate a simple response from the action results
    return buildFallbackResponse(intent, actionResults);
  } catch {
    return buildFallbackResponse(intent, actionResults);
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

function calculateCompleteness(p: ProspectResult): number {
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
