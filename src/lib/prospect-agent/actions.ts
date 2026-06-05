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
import { deepCrawlWebsite } from './deep-crawler';
import { extractCompanyIdentity, smartCompanySearch } from './company-verifier';
import { resolveFromEmail, resolveFromName, isEmail } from './person-resolver';

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

export type ProgressCallback = (event: string, data: any) => void;

export async function executeCompanyResearch(
  companyName: string,
  onProgress?: ProgressCallback,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];
  const prospect = createEmptyProspect('company', companyName);
  prospect.companyName = companyName;

  // Step 1: Web search
  steps.push({ type: 'research_company', label: 'Web Search', status: 'running', message: `Searching for "${companyName}"...` });
  onProgress?.('step_start', { stepIndex: 0, label: 'Web Search', message: `Searching for "${companyName}"...` });
  try {
    const searchResult = await withTimeout(
      () => exaSearch(`${companyName} company overview contact information`, 10),
      30_000, 'Company web search',
    );
    if (searchResult?.success && searchResult.data.length > 0) {
      sources.push(...searchResult.data.map(r => r.url));
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Found ${searchResult.data.length} web results`;
      onProgress?.('step_complete', { stepIndex: 0, status: 'completed', message: `Found ${searchResult.data.length} web results`, partialData: null });

      // Read top 5 results (increased from 3 for broader data coverage)
      const topUrls = searchResult.data.slice(0, 5).map(r => r.url);
      const readResults = await Promise.allSettled(
        topUrls.map(u => withTimeout(() => webRead(u), 25_000, `Read: ${u.slice(0, 50)}`)),
      );
      const webContents: string[] = [];
      for (const result of readResults) {
        if (result.status === 'fulfilled' && result.value?.success) {
          webContents.push(result.value.data.content.slice(0, 8000));
        }
      }

      // Step 2: Extract data with LLM
      steps.push({ type: 'research_company', label: 'AI Extraction', status: 'running', message: 'Extracting company data with AI...' });
      onProgress?.('step_start', { stepIndex: 1, label: 'AI Extraction', message: 'Extracting company data with AI...' });
      if (webContents.length > 0) {
        let extracted = await withTimeout(
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
        // Retry with a simpler prompt if first extraction failed
        if (!extracted) {
          console.warn('[executeCompanyResearch] First LLM extraction returned null — retrying with simpler prompt');
          extracted = await withTimeout(
            () => callLLMForJSON<Partial<ProspectResult>>(
              `Extract key business data about "${companyName}" from this text. Return a JSON object with: companyName, website, industry, description, city, country, phoneMain, generalEmail, ceoName, employeeCount, revenueEstimate, linkedinUrl. Use null for unknown fields.`,
              webContents[0].slice(0, 3000),
              { retriesPerModel: 1, useFallback: true },
            ),
            30_000, 'Company LLM extraction retry',
          );
        }
        if (extracted) {
          safeMerge(prospect, extracted);
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = `Extracted company data (${Object.values(extracted).filter(v => v !== null && v !== undefined && v !== '').length} fields)`;
          onProgress?.('step_complete', { stepIndex: 1, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
          onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
        } else {
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = 'AI extraction unavailable — using search snippets';
          // Fallback 1: Try LLM with shorter prompt on search snippets
          const topResults = searchResult!.data.slice(0, 5);
          const snippetContent = topResults.map(r => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.url}`).join('\n---\n');
          const snippetExtract = await withTimeout(
            () => callLLMForJSON<Partial<ProspectResult>>(
              `Extract basic business info about "${companyName}" from these search snippets. Return JSON: companyName, industry, description, city, stateProvince, country, employeeCount, revenueEstimate, foundingYear, ceoName, website, phoneMain, generalEmail, linkedinUrl, twitterHandle. Use null for unknown fields.`,
              snippetContent.slice(0, 3000),
              { retriesPerModel: 1, useFallback: true },
            ),
            20_000, 'Snippet LLM extraction',
          );
          if (snippetExtract) {
            safeMerge(prospect, snippetExtract);
            steps[steps.length - 1].message = 'Extracted basic data from search snippets';
          } else {
            // Fallback 2: regex-based extraction from snippets
            populateFromSearchSnippets(prospect, topResults.map(r => ({ title: r.title, snippet: r.snippet || '', url: r.url })));
          }
        }
      } else {
        // webContents is empty but we have search snippets — use them
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'AI extraction skipped (no page content) — using search snippets';
        const topSnippets = searchResult!.data.slice(0, 5);
        populateFromSearchSnippets(prospect, topSnippets.map(r => ({ title: r.title, snippet: r.snippet || '', url: r.url })));
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
  onProgress?.('step_start', { stepIndex: 2, label: 'LinkedIn Search', message: 'Searching LinkedIn...' });
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
      // Also populate city/country from LinkedIn location
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
      // Try to extract industry from LinkedIn headline if available
      if (company.headline && !prospect.industry) {
        const industryMatch = company.headline.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Company|Startup|Firm|Corporation)/i);
        if (industryMatch) prospect.industry = industryMatch[1].trim();
      }
      // Check additional LinkedIn results for more data
      if (liResult.data.length > 1) {
        for (let i = 1; i < Math.min(liResult.data.length, 3); i++) {
          const extra = liResult.data[i];
          if (extra.headline && !prospect.description) prospect.description = extra.headline;
          if (extra.location && !prospect.hqAddress) prospect.hqAddress = extra.location;
        }
      }
      sources.push(`linkedin:${company.url || companyName}`);
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Found LinkedIn profile';
      onProgress?.('step_complete', { stepIndex: 2, status: 'completed', message: 'Found LinkedIn profile', partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
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
  onProgress?.('step_start', { stepIndex: 3, label: 'Deep Research', message: 'Researching key contacts...' });
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
      onProgress?.('step_complete', { stepIndex: 3, status: 'completed', message: 'Found key contacts', partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
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
  onProgress?.('step_start', { stepIndex: 4, label: 'News Search', message: 'Finding recent news...' });
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
      onProgress?.('step_complete', { stepIndex: 4, status: 'completed', message: `Found ${newsSearch.data.length} news items`, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } else {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'No recent news found';
    }
  } catch {
    steps[steps.length - 1].status = 'completed';
    steps[steps.length - 1].message = 'News search skipped';
  }

  // Step 6: Gap-Filling — run targeted searches for missing data
  const gapIdx = 5;
  const gapSteps: string[] = [];
  const name = prospect.companyName || companyName;

  if (!prospect.generalEmail && !prospect.supportEmail) gapSteps.push('contact');
  if (!prospect.phoneMain) gapSteps.push('phone');
  if (!prospect.ceoName && !prospect.keyContactName) gapSteps.push('people');
  if (!prospect.employeeCount && !prospect.revenueEstimate) gapSteps.push('firmographics');
  if (!prospect.linkedinUrl) gapSteps.push('linkedin');

  if (gapSteps.length > 0) {
    steps.push({ type: 'research_company', label: 'Gap Fill', status: 'running', message: `Filling gaps: ${gapSteps.join(', ')}...` });
    onProgress?.('step_start', { stepIndex: gapIdx, label: 'Gap Fill', message: `Filling data gaps: ${gapSteps.join(', ')}...` });
    try {
      // Run targeted gap searches sequentially to respect rate limits
      for (const gap of gapSteps) {
        onProgress?.('step_progress', { stepIndex: gapIdx, message: `Searching for ${gap}...` });
        let searchQuery = '';
        if (gap === 'contact') searchQuery = `"${name}" contact email address`;
        else if (gap === 'phone') searchQuery = `"${name}" phone number contact`;
        else if (gap === 'people') searchQuery = `"${name}" CEO founder leadership team`;
        else if (gap === 'firmographics') searchQuery = `"${name}" revenue employees funding Crunchbase`;
        else if (gap === 'linkedin') searchQuery = `"${name}" LinkedIn company page`;

        const gapResult = await withTimeout(
          () => exaSearch(searchQuery, 3),
          20_000, `Gap search: ${gap}`,
        );
        if (gapResult?.success && gapResult.data.length > 0) {
          sources.push(...gapResult.data.map(r => r.url));
          const topUrl = gapResult.data[0]?.url;
          if (topUrl) {
            const readResult = await withTimeout(() => webRead(topUrl), 20_000, `Gap read: ${gap}`);
            if (readResult?.success) {
              const gapData = await withTimeout(
                () => callLLMForJSON<Partial<ProspectResult>>(
                  `Extract ${gap === 'contact' ? 'email addresses' : gap === 'phone' ? 'phone numbers' : gap === 'people' ? 'CEO and leadership names' : gap === 'firmographics' ? 'revenue, employee count, funding info' : 'LinkedIn URL'} for "${name}" from this content. Return JSON with relevant fields from: generalEmail, supportEmail, phoneMain, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, employeeCount, revenueEstimate, fundingInfo, linkedinUrl, boardMembers (array). Use null for not found.`,
                  readResult.data.content.slice(0, 4000),
                  { retriesPerModel: 1, useFallback: true },
                ),
                30_000, `Gap LLM: ${gap}`,
              );
              if (gapData) {
                safeMerge(prospect, gapData);
                onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
              }
            }
          }
        }
      }
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = `Filled ${gapSteps.length} data gap${gapSteps.length > 1 ? 's' : ''}`;
      onProgress?.('step_complete', { stepIndex: gapIdx, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
      onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
    } catch {
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Gap fill partially completed';
      onProgress?.('step_complete', { stepIndex: gapIdx, status: 'completed', message: 'Gap fill partially completed', partialData: prospect });
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
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [];
  const prospect = createEmptyProspect('person', personInput);
  prospect.personName = personInput;

  // ─── Detect input type: email vs name ───
  const inputIsEmail = isEmail(personInput);

  if (inputIsEmail) {
    // ═══ EMAIL-BASED RESOLUTION (most reliable) ═══
    steps.push({ type: 'research_person', label: 'Email Intelligence', status: 'running', message: `Analyzing email: ${personInput}...` });
    try {
      const resolved = await withTimeout(
        () => resolveFromEmail(personInput),
        90_000, 'Email-based person resolution',
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
    steps.push({ type: 'research_person', label: 'Identity Resolution', status: 'running', message: `Resolving identity of "${personInput}"...` });
    try {
      const resolved = await withTimeout(
        () => resolveFromName(personInput),
        90_000, 'Name-based person resolution',
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

  // ─── Additional data gathering (if resolution didn't fill everything) ───
  if (!prospect.personLinkedin) {
    steps.push({ type: 'research_person', label: 'LinkedIn Search', status: 'running', message: 'Searching LinkedIn...' });
    try {
      const liResult = await withTimeout(() => linkedInSearchPeople(personInput, 3), 20_000, 'LinkedIn person');
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

  if (!prospect.twitterHandle) {
    steps.push({ type: 'research_person', label: 'Twitter/X', status: 'running', message: 'Searching Twitter/X...' });
    try {
      const twResult = await withTimeout(() => twitterSearch(prospect.personName || personInput, 3), 20_000, 'Twitter search');
      if (twResult?.success && twResult.data.length > 0) {
        const tweet = twResult.data[0] as unknown as Record<string, unknown>;
        // BUG FIX: TwitterResult uses 'author', not 'username'
        if (tweet.author) {
          const handle = String(tweet.author);
          prospect.twitterHandle = handle.startsWith('@') ? handle : `@${handle}`;
        } else if (tweet.url) {
          // Fallback: extract handle from URL (twitter.com/username or x.com/username)
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
// URL Research Action
// ============================================================

export async function executeUrlResearch(
  url: string,
  onProgress?: ProgressCallback,
): Promise<{ prospect: ProspectResult | null; steps: AgentAction[] }> {
  const steps: AgentAction[] = [];
  const sources: string[] = [url];
  const prospect = createEmptyProspect('url', url);

  // ─── STEP 1: Deep Crawl — scrape every corner of the website ───
  steps.push({ type: 'research_url', label: 'Deep Site Crawl', status: 'running', message: `Deep-crawling ${url} and all sub-pages...` });
  onProgress?.('step_start', { stepIndex: 0, label: 'Deep Site Crawl', message: `Deep-crawling ${url}...` });
  try {
    const crawlResult = await withTimeout(
      () => deepCrawlWebsite(url, (msg) => {
        steps[0].message = msg;
        onProgress?.('step_progress', { stepIndex: 0, message: msg });
      }),
      120_000, 'Deep site crawl',
    );

    if (crawlResult.totalPagesCrawled > 0) {
      steps[0].status = 'completed';
      steps[0].message = `Crawled ${crawlResult.totalPagesCrawled} pages (${crawlResult.totalWords.toLocaleString()} words) across ${crawlResult.domain}`;
      onProgress?.('step_complete', { stepIndex: 0, status: 'completed', message: steps[0].message, partialData: null });

      sources.push(...crawlResult.pages.map(p => p.url));

      // ─── STEP 2: AI Extraction from ALL crawled content ───
      steps.push({ type: 'research_url', label: 'AI Analysis', status: 'running', message: 'Analyzing all pages with AI...' });
      onProgress?.('step_start', { stepIndex: 1, label: 'AI Analysis', message: 'Analyzing all pages with AI...' });
      const extracted = await withTimeout(
        () => callLLMForJSON<Partial<ProspectResult>>(
          `You are a B2B intelligence analyst. You have been given content from MULTIPLE pages of a website (including About, Contact, Team, Services pages). Extract comprehensive business/contact information.

IMPORTANT: This is content from the ENTIRE website, not just one page. Use ALL the information available across pages to build the most complete picture possible.

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

Be thorough — you have data from the entire website, so extract everything you can find.`,
          crawlResult.allContentCombined.slice(0, 50000),
        ),
        60_000, 'Deep crawl LLM extraction',
      );

      if (extracted) {
        safeMerge(prospect, extracted);
        if (extracted.companyName) prospect.queryType = 'company';
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Extracted data from ${crawlResult.totalPagesCrawled} pages (${Object.values(extracted).filter(v => v !== null && v !== undefined && v !== '').length} fields)`;
        onProgress?.('step_complete', { stepIndex: 1, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'AI extraction partially completed';
        onProgress?.('step_complete', { stepIndex: 1, status: 'completed', message: 'AI extraction partially completed', partialData: prospect });
      }

      // ─── STEP 3: Company Identity Verification ───
      if (prospect.companyName) {
        steps.push({ type: 'research_url', label: 'Company Verification', status: 'running', message: `Verifying "${prospect.companyName}" identity...` });
        onProgress?.('step_start', { stepIndex: 2, label: 'Company Verification', message: `Verifying "${prospect.companyName}"...` });
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
            steps[steps.length - 1].status = 'completed';
            steps[steps.length - 1].message = `Verified: ${identity.verifiedName} (confidence: ${identity.confidence})`;
            onProgress?.('step_complete', { stepIndex: 2, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
            onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });

            // ─── STEP 4: Smart Verified Web Search ───
            steps.push({ type: 'research_url', label: 'Verified Web Search', status: 'running', message: `Searching for verified info about ${identity.verifiedName}...` });
            onProgress?.('step_start', { stepIndex: 3, label: 'Verified Web Search', message: `Searching for verified info about ${identity.verifiedName}...` });
            try {
              const verifiedResults = await withTimeout(
                () => smartCompanySearch(identity, 10),
                60_000, 'Smart company search',
              );
              const matchedResults = verifiedResults.filter(r => r.isVerifiedMatch && r.matchConfidence >= 0.6);
              const matchedUrls = matchedResults.map(r => r.url);
              sources.push(...matchedUrls);

              if (matchedResults.length > 0) {
                const topVerified = matchedResults.slice(0, 3);
                const readResults = await Promise.allSettled(
                  topVerified.map(r => withTimeout(() => webRead(r.url), 25_000, `Verified read: ${r.url.slice(0, 50)}`)),
                );
                const webContents: string[] = [];
                for (const result of readResults) {
                  if (result.status === 'fulfilled' && result.value?.success) {
                    webContents.push(result.value.data.content.slice(0, 4000));
                  }
                }
                if (webContents.length > 0) {
                  const deepData = await withTimeout(
                    () => callLLMForJSON<Partial<ProspectResult>>(
                      `Extract additional business data about "${identity.verifiedName}" from these VERIFIED web results (confirmed to be about THIS specific company, not a similarly-named different company).
Return JSON: legalName, industry, subIndustry, hqAddress, city, stateProvince, country, employeeCount, revenueEstimate, foundingYear, ownershipType, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, linkedinUrl, twitterHandle, techStack (array), boardMembers (array), recentNews (array), fundingInfo. Use null for not found. Only fill in fields that have NEW information not already available.`,
                      webContents.join('\n---\n'),
                    ),
                    45_000, 'Verified deep LLM',
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
              steps[steps.length - 1].message = `Found ${matchedResults.length} verified results about ${identity.verifiedName}`;
              onProgress?.('step_complete', { stepIndex: 3, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
              onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
            } catch {
              steps[steps.length - 1].status = 'completed';
              steps[steps.length - 1].message = 'Verified search partially completed';
            }
          } else {
            steps[steps.length - 1].status = 'completed';
            steps[steps.length - 1].message = 'Company verification skipped (limited data)';
          }
        } catch {
          steps[steps.length - 1].status = 'completed';
          steps[steps.length - 1].message = 'Company verification partially completed';
        }
      }
    } else {
      // Deep crawl returned no pages — fall back to simple single-page read
      steps[0].status = 'completed';
      steps[0].message = 'Deep crawl unavailable, reading single page...';
      steps.push({ type: 'research_url', label: 'Page Read', status: 'running', message: `Reading ${url}...` });
      const readResult = await withTimeout(() => webRead(url), 25_000, `URL read: ${url.slice(0, 50)}`);
      if (readResult?.success) {
        const extracted = await withTimeout(
          () => callLLMForJSON<Partial<ProspectResult>>(
            `Analyze this webpage and extract business/contact information.
Return JSON: companyName, personName, personTitle, personEmail, personPhone, industry, description, website, city, country, phoneMain, generalEmail, linkedinUrl, productsServices (array), keyContactName, keyContactTitle, keyContactEmail. Use null for not found.`,
            readResult.data.content.slice(0, 8000),
          ),
          45_000, 'URL fallback LLM',
        );
        if (extracted) safeMerge(prospect, extracted);
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Read ${readResult.data.wordCount} words from single page`;
      } else {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].message = 'Could not read the webpage';
      }
    }
  } catch {
    steps[0].status = 'failed';
    steps[0].message = 'Error reading URL';
  }

  // ─── Gap-Filling Phase for URL Research ───
  const name = prospect.companyName || '';
  if (name) {
    const gapSteps: string[] = [];
    if (!prospect.generalEmail && !prospect.supportEmail && !prospect.phoneMain) gapSteps.push('contact');
    if (!prospect.ceoName && !prospect.keyContactName) gapSteps.push('people');
    if (!prospect.employeeCount && !prospect.revenueEstimate) gapSteps.push('firmographics');
    if (!prospect.linkedinUrl) gapSteps.push('linkedin');

    if (gapSteps.length > 0) {
      const gapIdx = steps.length;
      steps.push({ type: 'research_url', label: 'Gap Fill', status: 'running', message: `Filling gaps: ${gapSteps.join(', ')}...` });
      onProgress?.('step_start', { stepIndex: gapIdx, label: 'Gap Fill', message: `Filling data gaps: ${gapSteps.join(', ')}...` });
      try {
        for (const gap of gapSteps) {
          onProgress?.('step_progress', { stepIndex: gapIdx, message: `Searching for ${gap}...` });
          let searchQuery = '';
          if (gap === 'contact') searchQuery = `"${name}" contact email phone`;
          else if (gap === 'people') searchQuery = `"${name}" CEO founder leadership team`;
          else if (gap === 'firmographics') searchQuery = `"${name}" revenue employees funding Crunchbase`;
          else if (gap === 'linkedin') searchQuery = `"${name}" LinkedIn company page`;

          const gapResult = await withTimeout(
            () => exaSearch(searchQuery, 3),
            20_000, `Gap search: ${gap}`,
          );
          if (gapResult?.success && gapResult.data.length > 0) {
            sources.push(...gapResult.data.map(r => r.url));
            const topUrl = gapResult.data[0]?.url;
            if (topUrl) {
              const readResult = await withTimeout(() => webRead(topUrl), 20_000, `Gap read: ${gap}`);
              if (readResult?.success) {
                const gapData = await withTimeout(
                  () => callLLMForJSON<Partial<ProspectResult>>(
                    `Extract ${gap === 'contact' ? 'email addresses and phone numbers' : gap === 'people' ? 'CEO and leadership names' : gap === 'firmographics' ? 'revenue, employee count, funding info' : 'LinkedIn URL'} for "${name}" from this content. Return JSON with relevant fields from: generalEmail, supportEmail, phoneMain, ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail, employeeCount, revenueEstimate, fundingInfo, linkedinUrl, boardMembers (array). Use null for not found.`,
                    readResult.data.content.slice(0, 4000),
                    { retriesPerModel: 1, useFallback: true },
                  ),
                  30_000, `Gap LLM: ${gap}`,
                );
                if (gapData) {
                  safeMerge(prospect, gapData);
                  onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
                }
              }
            }
          }
        }
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Filled ${gapSteps.length} data gap${gapSteps.length > 1 ? 's' : ''}`;
        onProgress?.('step_complete', { stepIndex: gapIdx, status: 'completed', message: steps[steps.length - 1].message, partialData: prospect });
        onProgress?.('data_update', { prospect, completeness: calculateCompleteness(prospect) });
      } catch {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'Gap fill partially completed';
        onProgress?.('step_complete', { stepIndex: steps.length - 1, status: 'completed', message: 'Gap fill partially completed', partialData: prospect });
      }
    }
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

// ============================================================
// populateFromSearchSnippets — regex-based extraction from
// search result titles and snippets when LLM is unavailable
// ============================================================

interface SearchSnippet {
  title: string;
  snippet: string;
  url: string;
}

function populateFromSearchSnippets(prospect: ProspectResult, results: SearchSnippet[]): void {
  const combined = results.map(r => `${r.title}. ${r.snippet}`).join(' ');

  // Extract location: "based in X", "headquartered in X", "located in X"
  if (!prospect.city || !prospect.hqAddress) {
    const locMatch = combined.match(/(?:based|headquartered|located|hq'd)\s+in\s+([A-Z][a-zA-Z\s]+?)(?:[,.;]|\s+(?:and|with|\d))/);
    if (locMatch) {
      const loc = locMatch[1].trim();
      if (!prospect.city) prospect.city = loc;
      if (!prospect.hqAddress) prospect.hqAddress = loc;
    }
  }

  // Extract employee count: "X employees", "X+ employees", "team of X"
  if (!prospect.employeeCount) {
    const empMatch = combined.match(/(\d[\d,+]*)\s*(?:employees?|team\s+members?|staff|people)/i);
    if (empMatch) prospect.employeeCount = empMatch[1].replace(/,/g, '');
  }

  // Extract revenue: "$XM", "$X billion", etc.
  if (!prospect.revenueEstimate) {
    const revMatch = combined.match(/\$([\d.]+\s*(?:million|billion|M|B|trillion))/i);
    if (revMatch) prospect.revenueEstimate = `$${revMatch[1].trim()}`;
  }

  // Extract founding year: "founded in YYYY", "established in YYYY", "since YYYY"
  if (!prospect.foundingYear) {
    const yearMatch = combined.match(/(?:founded|established|started|incorporated|since)\s+(?:in\s+)?(\d{4})/i);
    if (yearMatch) prospect.foundingYear = yearMatch[1];
  }

  // Extract industry keywords from snippet
  if (!prospect.industry) {
    const industryPatterns = [
      /(?:a|an)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:company|startup|firm|platform|provider|business)/i,
      /(?:leading|global|top)\s+([a-z]+(?:\s+[a-z]+)?)\s+(?:company|startup|firm|platform|provider)/i,
    ];
    for (const pat of industryPatterns) {
      const m = combined.match(pat);
      if (m) { prospect.industry = m[1].trim(); break; }
    }
  }

  // Extract CEO name: "CEO Name", "led by Name"
  if (!prospect.ceoName) {
    const ceoMatch = combined.match(/(?:CEO|Chief Executive(?: Officer)?)[,:]\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/);
    if (ceoMatch) prospect.ceoName = ceoMatch[1].trim();
    else {
      const ledMatch = combined.match(/(?:led by|founded by|co-founded by)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      if (ledMatch) prospect.ceoName = ledMatch[1].trim();
    }
  }

  // Extract country if not set
  if (!prospect.country) {
    const countryPatterns = /(?:based|headquartered|located)\s+in\s+(?:[A-Z][a-zA-Z\s]+?,\s*)?([A-Z][a-zA-Z]+)/;
    const cMatch = combined.match(countryPatterns);
    if (cMatch) prospect.country = cMatch[1].trim();
  }

  // Extract website from URL
  if (!prospect.website && results[0]?.url) {
    try { prospect.website = new URL(results[0].url).origin; } catch { /* skip */ }
  }

  // Use first snippet as description fallback
  if (!prospect.description && results[0]?.snippet) {
    prospect.description = results[0].snippet;
  }

  // Extract LinkedIn URL from search results
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
}

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
