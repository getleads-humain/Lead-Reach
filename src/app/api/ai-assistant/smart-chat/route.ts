import { NextRequest } from 'next/server';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';
import {
  exaSearch,
  webRead,
  linkedInSearchCompanies,
  linkedInSearchPeople,
  twitterSearch,
  redditSearch,
} from '@/lib/agent-reach-bridge';

export const maxDuration = 300;

// ============================================================
// Types
// ============================================================

type ActionType =
  | 'discover_leads'
  | 'enrich_data'
  | 'compose_outreach'
  | 'build_icp'
  | 'analyze_pipeline'
  | 'research_market'
  | 'general_chat';

type ChatMode = 'standard' | 'deep-research' | 'quick';

interface SmartChatRequest {
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  currentPage?: string;
  chatMode?: ChatMode;
  userContext?: Record<string, unknown>;
}

interface SSEEvent {
  type: string;
  [key: string]: unknown;
}

// ============================================================
// SSE Stream Helper
// ============================================================

function createSSEStream(
  generator: (send: (event: string, data: SSEEvent) => void) => Promise<void>
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: SSEEvent) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream may be closed
        }
      };

      try {
        await generator(send);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        try {
          send('error', { type: 'error', message: msg });
        } catch {
          // Stream already closed
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ============================================================
// Content Streaming Helper
// ============================================================

function streamContent(send: (event: string, data: SSEEvent) => void, text: string, chunkSize = 20) {
  for (let i = 0; i < text.length; i += chunkSize) {
    send('content', { type: 'content', chunk: text.slice(i, i + chunkSize) });
  }
}

// ============================================================
// Intent Classification (with keyword fallback)
// ============================================================

async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ action: ActionType; confidence: number; reasoning: string }> {
  // Try LLM-based classification first (with timeout protection)
  try {
    const historyContext = conversationHistory
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}`)
      .join('\n');

    const result = await callLLMForJSON<{
      action: ActionType;
      confidence: number;
      reasoning: string;
    }>(
      `You are an intent classifier for a B2B lead generation platform called LeadReach. 
Classify the user's message into exactly ONE of these action types:

- discover_leads: User explicitly wants to FIND or SEARCH for leads, prospects, companies, or people (e.g. "Find SaaS companies", "Search for VPs", "Discover prospects in fintech")
- enrich_data: User wants to enrich lead/company data with more information
- compose_outreach: User wants outreach messages, cold emails, LinkedIn messages, or communication sequences
- build_icp: User wants to define, refine, or discuss their Ideal Customer Profile
- analyze_pipeline: User wants pipeline analytics, conversion insights, or performance metrics
- research_market: User wants market research, industry analysis, or competitive intelligence
- general_chat: General questions, greetings, explanations, definitions, or topics that don't fit the above. IMPORTANT: Questions like "What is X?" or "How does Y work?" are general_chat, NOT discover_leads.

Return JSON with:
- action: one of the action types above
- confidence: 0-1 how confident you are
- reasoning: brief explanation of why you chose this action`,
      `Conversation context:\n${historyContext}\n\nLatest user message: "${userMessage}"`,
      { temperature: 0.1, thinkingBudget: 'quick' }
    );

    if (result && result.action) {
      return result;
    }
  } catch (error) {
    console.warn('[classifyIntent] LLM classification failed, using keyword fallback:', error instanceof Error ? error.message.slice(0, 100) : 'Unknown');
  }

  // Fallback: keyword-based classification (always works)
  return classifyByKeywords(userMessage);
}

function classifyByKeywords(userMessage: string): { action: ActionType; confidence: number; reasoning: string } {
  const lower = userMessage.toLowerCase();

  // General questions should not trigger lead discovery
  if (/^(what|how|why|who|when|where|can you explain|tell me about)\b/.test(lower)) {
    return { action: 'general_chat', confidence: 0.8, reasoning: 'Question starting with question word suggests general inquiry' };
  }
  if (/\b(find|search for|discover|look for|locate|get|show me|list)\b.*\b(leads?|prospects?|companies|people|contacts?|distributors?|suppliers?|manufacturers?|agencies?|firms?)\b/.test(lower)) {
    return { action: 'discover_leads', confidence: 0.85, reasoning: 'Strong keyword match for lead discovery' };
  }
  if (/\b(find|search|discover|get|show|looking for)\b.*\b(in|near|at|from|around)\b/.test(lower)) {
    return { action: 'discover_leads', confidence: 0.75, reasoning: 'Location-based search query suggests lead discovery' };
  }
  if (/enrich|enhance|more (info|data)|fill.*(missing|gap)|verify|validate/.test(lower)) {
    return { action: 'enrich_data', confidence: 0.7, reasoning: 'Keyword match for data enrichment' };
  }
  if (/email|message|outreach|cold|linkedin.*message|sequence|draft|compose|write.*email/.test(lower)) {
    return { action: 'compose_outreach', confidence: 0.7, reasoning: 'Keyword match for outreach' };
  }
  if (/icp|ideal.*customer|profile|target.*customer|persona|buyer.*profile/.test(lower)) {
    return { action: 'build_icp', confidence: 0.7, reasoning: 'Keyword match for ICP building' };
  }
  if (/pipeline|analytics|conversion|performance|metric|funnel|roi|deal/.test(lower)) {
    return { action: 'analyze_pipeline', confidence: 0.7, reasoning: 'Keyword match for pipeline analysis' };
  }
  if (/market|industry|research|competitive|trend|landscape|analysis/.test(lower)) {
    return { action: 'research_market', confidence: 0.7, reasoning: 'Keyword match for market research' };
  }
  return { action: 'general_chat', confidence: 0.5, reasoning: 'No specific intent detected' };
}

// ============================================================
// Action Handlers — Powered by Agent-Reach Bridge
// ============================================================

const ACTION_LABELS: Record<ActionType, string> = {
  discover_leads: 'Discovering Leads',
  enrich_data: 'Enriching Data',
  compose_outreach: 'Composing Outreach',
  build_icp: 'Building ICP',
  analyze_pipeline: 'Analyzing Pipeline',
  research_market: 'Researching Market',
  general_chat: 'Thinking',
};

/**
 * DISCOVER LEADS — Uses full Agent-Reach multi-channel search pipeline
 * 
 * Quick mode: LLM-only (fast, no real search)
 * Standard mode: Web search + LLM extraction
 * Deep Research mode: Full multi-channel (Web, LinkedIn, Twitter, Reddit, YouTube) + multi-round deep search
 */
async function handleDiscoverLeads(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void,
  chatMode: ChatMode
): Promise<void> {
  // ---- QUICK MODE: LLM-only, no real search ----
  if (chatMode === 'quick') {
    send('progress', { type: 'progress', stage: 'quick_search', label: 'Quick search', detail: 'Generating leads from AI knowledge...' });
    const llmLeads = await generateLLMLeads(userMessage, send);
    if (llmLeads.length > 0) {
      send('lead_data', { type: 'lead_data', leads: llmLeads });
      send('action_result', { type: 'action_result', action: 'discover_leads', data: { leads: llmLeads }, saveTarget: 'leads' });
    } else {
      send('content', { type: 'content', chunk: 'I couldn\'t generate lead suggestions for that query. Try being more specific, like "Find SaaS companies in New York City".' });
    }
    return;
  }

  // ---- STANDARD / DEEP RESEARCH MODE: Real multi-channel search ----
  send('progress', { type: 'progress', stage: 'searching', label: 'Searching multiple channels', detail: 'Using Agent-Reach multi-channel pipeline...' });

  const leads: Array<Record<string, unknown>> = [];
  const allSources: string[] = [];

  try {
    // Step 1: Primary search - use exaSearch (fast, reliable, multi-source fallback)
    send('progress', { type: 'progress', stage: 'web_search', label: 'Searching the web', detail: 'Using web search API...' });

    const searchResult = await exaSearch(`${userMessage} company contact information`, chatMode === 'deep-research' ? 20 : 15);
    if (searchResult.success && searchResult.data.length > 0) {
      send('progress', { type: 'progress', stage: 'web_results', label: `Found ${searchResult.data.length} web results`, detail: 'Processing search results...' });
      allSources.push(...searchResult.data.map(r => r.url).filter(Boolean) as string[]);

      // Extract company data from search results
      const extractedLeads = await extractLeadsFromSearchResults(userMessage, searchResult.data, send);
      leads.push(...extractedLeads);
    }

    // Step 2: Enrich with web content (Deep Research mode only — standard is fast enough with search results)
    if (chatMode === 'deep-research' && leads.length > 0 && leads.length < 12) {
      send('progress', { type: 'progress', stage: 'enriching', label: 'Reading company websites', detail: 'Finding contact details from top results...' });
      try {
        const topUrls = allSources.slice(0, 3).filter(u => u && u.startsWith('http'));
        const readResults = await Promise.allSettled(topUrls.map(u => webRead(u)));
        const webContents: string[] = [];
        for (const result of readResults) {
          if (result.status === 'fulfilled' && result.value?.success) {
            webContents.push(result.value.data.content.slice(0, 4000));
          }
        }
        if (webContents.length > 0) {
          const enrichedLeads = await callLLMForJSON<{ leads: Array<Record<string, unknown>> }>(
            `You are a B2B data extraction specialist. Based on web content about businesses, extract additional contact and company details that may be missing from the initial search results.
Return JSON: { "leads": [...] }
Each lead should include: name, company, title, email, phone, website, location, industry, score (0-100), tier ("hot"/"warm"/"cold"), source ("Web Enrichment"), reason.
You MUST respond in English only.`,
            `Query: "${userMessage}"\n\nWeb Content:\n${webContents.join('\n---\n')}`,
            { temperature: 0.3, thinkingBudget: 'standard' }
          );
          if (enrichedLeads?.leads) {
            const existingCompanies = new Set(leads.map(l => String(l.company || '').toLowerCase()));
            for (const lead of enrichedLeads.leads) {
              if (!existingCompanies.has(String(lead.company || '').toLowerCase())) {
                leads.push(lead);
                existingCompanies.add(String(lead.company || '').toLowerCase());
              }
            }
          }
        }
      } catch (err) {
        console.warn('[handleDiscoverLeads] Web enrichment failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
      }
    }

    // Step 3 (Deep Research only): LinkedIn + Twitter + Reddit in parallel
    if (chatMode === 'deep-research' && leads.length < 10) {
      send('progress', { type: 'progress', stage: 'multi_channel', label: 'Searching LinkedIn, Twitter, Reddit', detail: 'Deep research across social channels...' });

      const [liResult, twResult, rdResult] = await Promise.allSettled([
        linkedInSearchCompanies(userMessage, 10),
        twitterSearch(userMessage, 10),
        redditSearch(userMessage, 10),
      ]);

      // Process LinkedIn results
      if (liResult.status === 'fulfilled' && liResult.value.success && liResult.value.data.length > 0) {
        const existingCompanies = new Set(leads.map(l => String(l.company || '').toLowerCase()));
        for (const company of liResult.value.data) {
          if (!existingCompanies.has((company.name || '').toLowerCase())) {
            leads.push({
              name: 'LinkedIn Contact',
              company: company.name || 'Unknown Company',
              title: 'Decision Maker',
              source: 'LinkedIn Search',
              reason: `Found via LinkedIn company search: ${company.headline || company.name}`,
              linkedin: company.url || undefined,
              score: 60,
              tier: 'warm' as const,
            });
            existingCompanies.add((company.name || '').toLowerCase());
          }
        }
        send('progress', { type: 'progress', stage: 'linkedin_done', label: `Found ${liResult.value.data.length} LinkedIn results` });
      }

      // Process Twitter results
      if (twResult.status === 'fulfilled' && twResult.value.success && twResult.value.data.length > 0) {
        allSources.push(...twResult.value.data.map(r => r.url).filter(Boolean));
        send('progress', { type: 'progress', stage: 'twitter_done', label: `Found ${twResult.value.data.length} Twitter results` });
      }

      // Process Reddit results
      if (rdResult.status === 'fulfilled' && rdResult.value.success && rdResult.value.data.length > 0) {
        allSources.push(...rdResult.value.data.map(r => r.url).filter(Boolean));
        send('progress', { type: 'progress', stage: 'reddit_done', label: `Found ${rdResult.value.data.length} Reddit results` });
      }

      // Step 4 (Deep Research): Multi-round deep search
      if (leads.length > 0 && leads.length < 15) {
        send('progress', { type: 'progress', stage: 'deep_round2', label: 'Multi-round deep search', detail: 'Searching sub-categories for more leads...' });
        try {
          const subQueries = await callLLMForJSON<string[]>(
            `Given the search query "${userMessage}" and ${leads.length} companies found, generate 3-5 specific sub-queries to find MORE companies in different niches/segments.
Return JSON array of search query strings. Be specific and creative.`,
            userMessage,
            { temperature: 0.5, thinkingBudget: 'quick' }
          );

          if (subQueries && subQueries.length > 0) {
            const existingCompanies = new Set(leads.map(l => String(l.company || '').toLowerCase()));
            for (const subQ of subQueries.slice(0, 3)) {
              try {
                const subResult = await exaSearch(subQ, 10);
                if (subResult.success && subResult.data.length > 0) {
                  const subLeads = await extractLeadsFromSearchResults(subQ, subResult.data, send);
                  for (const lead of subLeads) {
                    if (!existingCompanies.has(String(lead.company || '').toLowerCase())) {
                      leads.push(lead);
                      existingCompanies.add(String(lead.company || '').toLowerCase());
                    }
                  }
                }
              } catch {
                // Continue with other sub-queries
              }
            }
          }
        } catch (err) {
          console.warn('[handleDiscoverLeads] Multi-round search failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
        }
      }

      // Step 5 (Deep Research): Read top company websites for enrichment
      if (leads.length > 0) {
        send('progress', { type: 'progress', stage: 'enriching', label: 'Enriching discovered leads', detail: 'Reading company websites for contact details...' });

        const topLeads = leads.filter(l => l.website && !l.email).slice(0, 3);
        for (const lead of topLeads) {
          try {
            const webResult = await webRead(String(lead.website));
            if (webResult.success && webResult.data.content) {
              const contactData = await callLLMForJSON<{
                email?: string;
                phone?: string;
                keyContact?: string;
                keyContactTitle?: string;
              }>(
                `Extract contact information from this company website content. Return JSON with: email, phone, keyContact (name), keyContactTitle. Use null for anything not found. You MUST respond in English only.`,
                webResult.data.content.slice(0, 4000),
                { temperature: 0.1, thinkingBudget: 'quick' }
              );
              if (contactData) {
                if (contactData.email && !lead.email) lead.email = contactData.email;
                if (contactData.phone && !lead.phone) lead.phone = contactData.phone;
                if (contactData.keyContact && String(lead.name || '').includes('Unknown')) lead.name = contactData.keyContact;
                if (contactData.keyContactTitle && String(lead.title || '') === 'Decision Maker') lead.title = contactData.keyContactTitle;
              }
            }
          } catch {
            // Continue with other leads
          }
        }
      }
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.warn('[handleDiscoverLeads] Search pipeline error:', msg.slice(0, 200));
    send('progress', { type: 'progress', stage: 'fallback', label: 'Using AI knowledge for lead suggestions' });
  }

  // ---- FALLBACK: LLM-only leads if no real search results ----
  if (leads.length === 0) {
    send('progress', { type: 'progress', stage: 'ai_fallback', label: 'Generating leads with AI knowledge', detail: 'Search channels unavailable — using AI suggestions...' });
    const llmLeads = await generateLLMLeads(userMessage, send);
    leads.push(...llmLeads);
  }

  // ---- Generate text summary ----
  if (leads.length > 0) {
    const summary = await callLLM({
      systemPrompt: 'You are a B2B lead generation assistant. Provide concise, actionable summaries of discovered leads in markdown. Include company names, key contacts, and relevant details. Use bullet points.\n\nIMPORTANT: You MUST respond in English only. Never use Chinese or any other language.',
      userMessage: `Summarize these ${leads.length} discovered leads:\n${JSON.stringify(leads.slice(0, 10), null, 2)}`,
      temperature: 0.3,
      model: MODEL_PRIMARY,
      useFallback: true,
      thinkingBudget: chatMode === 'deep-research' ? 'deep' : 'standard',
    });

    if (summary) {
      streamContent(send, summary);
    }

    // Add sources if available
    if (allSources.length > 0) {
      const sourcesText = `\n\n**Sources:** ${allSources.slice(0, 5).map(s => `[${new URL(s).hostname}](${s})`).join(' · ')}`;
      streamContent(send, sourcesText);
    }

    send('lead_data', { type: 'lead_data', leads });
    send('action_result', { type: 'action_result', action: 'discover_leads', data: { leads }, saveTarget: 'leads' });
  } else {
    streamContent(send, 'I searched across multiple channels but couldn\'t find leads matching your query. Try being more specific, like:\n- "Find SaaS companies in New York City"\n- "Search for marketing agencies in London"\n- "Discover fintech startups in Toronto"');
  }
}

/**
 * Extract structured lead data from search results using LLM
 */
async function extractLeadsFromSearchResults(
  query: string,
  results: Array<{ title?: string; url?: string; snippet?: string; name?: string; headline?: string }>,
  send: (event: string, data: SSEEvent) => void
): Promise<Array<Record<string, unknown>>> {
  try {
    const extracted = await callLLMForJSON<{ leads: Array<Record<string, unknown>> }>(
      `You are a B2B lead data extraction specialist. Given web search results, extract REAL companies/businesses as structured leads.

For each REAL company/business found, provide:
- name: Full name of key contact (use "Unknown Contact" if not found)
- company: Company/business name (REQUIRED)
- title: Contact's job title (use "Decision Maker" if not found)
- email: Email if found, otherwise null
- phone: Phone if found, otherwise null
- score: Lead score 0-100 based on relevance to the query
- tier: "hot" (score 75+), "warm" (score 40-74), or "cold" (score below 40)
- source: "AI Discovery"
- reason: Why this lead matches the query
- website: Company website URL if found
- linkedin: LinkedIn URL if found

IMPORTANT RULES:
- Only include REAL companies/businesses, NOT articles, blog posts, or discussions
- If a search result is just an article or news, skip it
- Generate 3-8 leads maximum
- Make sure company names are plausible and match the search query
- You MUST respond in English only. Never use Chinese or any other language.

Return JSON: { "leads": [...] }`,
      `Search query: "${query}"\n\nSearch results:\n${JSON.stringify(results.slice(0, 20), null, 2)}`,
      { temperature: 0.3, thinkingBudget: 'standard' }
    );

    return extracted?.leads || [];
  } catch (err) {
    console.warn('[extractLeadsFromSearchResults] LLM extraction failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
    return [];
  }
}

async function generateLLMLeads(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<Array<Record<string, unknown>>> {
  send('progress', { type: 'progress', stage: 'ai_generation', label: 'Generating leads with AI', detail: 'Using AI knowledge to suggest potential leads...' });

  try {
    const result = await callLLMForJSON<{ leads: Array<Record<string, unknown>> }>(
      `You are a B2B lead generation expert. Based on the user's query, suggest realistic potential leads/companies that match their criteria. 
For each lead, provide:
- name: Full name of a key contact (realistic, but note these are AI-suggested)
- company: Company name (MUST be a real, well-known company in this space)
- title: Job title of the contact
- email: Suggested email format (e.g., first.last@company.com) 
- score: Lead score 0-100 based on fit
- tier: "hot", "warm", or "cold"
- source: "AI Suggested"
- reason: Why this lead matches the query
- website: Company website URL
- linkedin: LinkedIn company URL

Return JSON: { "leads": [...] }
Generate 3-5 realistic leads. Make sure company names and contacts are plausible for the industry/location requested. Mark them as AI-suggested since these are not verified contacts.

IMPORTANT: You MUST respond in English only. Never use Chinese or any other language.`,
      userMessage,
      { temperature: 0.5, thinkingBudget: 'standard' }
    );

    return result?.leads || [];
  } catch (err) {
    console.warn('[generateLLMLeads] LLM generation failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
    return [];
  }
}

/**
 * ENRICH DATA — Uses Agent-Reach channels for real data enrichment
 */
async function handleEnrichData(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void,
  chatMode: ChatMode
): Promise<void> {
  send('progress', { type: 'progress', stage: 'enriching', label: 'Enriching lead data', detail: 'Searching for additional contact and firmographic details...' });

  // Try real web search for enrichment data
  let enrichmentData: Array<Record<string, unknown>> = [];
  
  if (chatMode !== 'quick') {
    try {
      send('progress', { type: 'progress', stage: 'web_search', label: 'Searching for enrichment data', detail: 'Using web search to find company details...' });
      const searchResult = await exaSearch(`${userMessage} company overview employees revenue contact`, 10);
      if (searchResult.success && searchResult.data.length > 0) {
        // Read top results
        const topUrls = searchResult.data.slice(0, 3).map(r => r.url);
        const readResults = await Promise.allSettled(topUrls.map(u => webRead(u)));
        const webContents: string[] = [];
        for (const result of readResults) {
          if (result.status === 'fulfilled' && result.value?.success) {
            webContents.push(result.value.data.content.slice(0, 5000));
          }
        }

        if (webContents.length > 0) {
          const extracted = await callLLMForJSON<{
            enrichedLeads: Array<Record<string, unknown>>;
          }>(
            `You are a B2B data enrichment specialist. Extract detailed company and contact information from this web content.
Return JSON: { "enrichedLeads": [...] }
Each lead should include: name, title, company, email, phone, website, location, industry, companySize, revenue, techStack (array), score (0-100), tier ("hot"/"warm"/"cold"), source ("Web Enrichment").
Be thorough and precise. Only include real data found in the content.

IMPORTANT: You MUST respond in English only. Never use Chinese or any other language.`,
            `Query: "${userMessage}"\n\nWeb Content:\n${webContents.join('\n---\n')}`,
            { temperature: 0.3, thinkingBudget: 'standard' }
          );
          enrichmentData = extracted?.enrichedLeads || [];
        }
      }
    } catch (err) {
      console.warn('[handleEnrichData] Web search enrichment failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
    }
  }

  // Fallback to LLM-only if no results from web search
  if (enrichmentData.length === 0) {
    send('progress', { type: 'progress', stage: 'ai_enrichment', label: 'Using AI for data enrichment', detail: 'Generating enrichment suggestions...' });
    const enrichmentResult = await callLLMForJSON<{
      enrichedLeads: Array<Record<string, unknown>>;
    }>(
      `You are a B2B data enrichment specialist. Based on the user's request, generate enriched lead profiles with as much detail as possible.

Return JSON: { "enrichedLeads": [...] }
Each lead should include as many of these fields as possible:
- name, title, company, email, phone, website, location, industry
- companySize: Employee range (e.g., "51-200")
- revenue: Estimated annual revenue
- techStack: Array of technologies used
- score: Fit score 0-100
- tier: "hot", "warm", or "cold"
- source: "AI Enrichment"

Generate 3-5 enriched profiles. Be as specific and detailed as possible.`,
      userMessage,
      { temperature: 0.4, thinkingBudget: 'standard' }
    );
    enrichmentData = enrichmentResult?.enrichedLeads || [];
  }

  // Generate explanation
  const explanation = await callLLM({
    systemPrompt: `You are a B2B data enrichment specialist working for LeadReach. Explain the enrichment results and suggest next steps.

Always include a tool navigation hint at the end like:
- "Head over to **Data Enrichment** to enrich more leads in bulk"
- "Use **Prospect Discovery** to find additional contacts"

Format your response in markdown with clear sections.`,
    userMessage: `I've enriched ${enrichmentData.length} leads for the query: "${userMessage}". Enrichment data: ${JSON.stringify(enrichmentData.slice(0, 2) || [])}. Explain the results and suggest next steps.`,
    temperature: 0.4,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (explanation) {
    streamContent(send, explanation);
  }

  const leads = enrichmentData;
  if (leads.length > 0) {
    send('lead_data', { type: 'lead_data', leads });
  }

  send('action_result', {
    type: 'action_result',
    action: 'enrich_data',
    data: { enrichmentSuggestions: explanation, enrichedLeads: leads },
    saveTarget: leads.length > 0 ? 'leads' : 'data-enrichment',
  });
}

/**
 * COMPOSE OUTREACH — Generates outreach messages using LLM
 */
async function handleComposeOutreach(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void,
  chatMode: ChatMode
): Promise<void> {
  send('progress', { type: 'progress', stage: 'composing', label: 'Composing outreach messages', detail: 'Crafting personalized messages...' });

  // In deep-research mode, search for real company info to personalize outreach
  let contextInfo = '';
  if (chatMode === 'deep-research') {
    try {
      const searchResult = await exaSearch(`${userMessage} company contact challenges pain points`, 5);
      if (searchResult.success && searchResult.data.length > 0) {
        contextInfo = `\n\nAdditional research context:\n${searchResult.data.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`;
      }
    } catch {
      // Continue without context
    }
  }

  const result = await callLLMForJSON<{
    messages: Array<{
      channel: string;
      subject: string;
      body: string;
      tone: string;
    }>;
  }>(
    `You are a B2B outreach specialist. Based on the user's request, compose personalized outreach messages.

Return JSON: { "messages": [...] }
Each message should have:
- channel: "email" or "linkedin"
- subject: Email subject line (empty string for LinkedIn)
- body: Full message body (well-formatted, professional, personalized)
- tone: "professional", "friendly", "casual", or "executive"

Generate 2-4 outreach messages with different channels/tones. Make them feel personalized and relevant.
Use best practices: clear value proposition, social proof, soft CTA, short paragraphs.${contextInfo ? '\n\nUse the research context to make messages more specific and relevant.' : ''}`,
    userMessage + contextInfo,
    { temperature: 0.5, thinkingBudget: chatMode === 'deep-research' ? 'deep' : 'standard' }
  );

  // Generate explanation text with tool navigation
  const explanation = await callLLM({
    systemPrompt: `You are an outreach consultant. Explain the outreach strategy and why these messages work. Use markdown. Keep it concise.

Always include a tool navigation hint at the end like:
- "Head over to **Outreach** to send these messages and set up sequences"
- "Use **ICP Builder** to refine your targeting for better response rates"`,
    userMessage: `I've generated ${result?.messages?.length || 0} outreach messages for the request: "${userMessage}". Briefly explain the approach and suggest next steps.`,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (explanation) {
    streamContent(send, explanation);
  }

  if (result?.messages && result.messages.length > 0) {
    send('outreach_data', { type: 'outreach_data', messages: result.messages });
    send('action_result', { type: 'action_result', action: 'compose_outreach', data: { messages: result.messages }, saveTarget: 'outreach' });
  } else {
    // Fallback: generate outreach text if JSON extraction failed
    const fallbackText = await callLLM({
      systemPrompt: 'You are a B2B outreach specialist. Compose 2-3 personalized outreach messages based on the user request. Format as markdown with clear sections for each message. Include channel type, subject line, and body.',
      userMessage,
      temperature: 0.5,
      model: MODEL_PRIMARY,
      useFallback: true,
    });
    if (fallbackText) {
      streamContent(send, fallbackText);
    } else {
      streamContent(send, 'I was unable to generate outreach messages at this time. Please try again with more specific details about your target audience.');
    }
  }
}

/**
 * BUILD ICP — Builds Ideal Customer Profile using LLM + optional market research
 */
async function handleBuildICP(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void,
  chatMode: ChatMode
): Promise<void> {
  send('progress', { type: 'progress', stage: 'analyzing', label: 'Building Ideal Customer Profile', detail: 'Extracting ICP criteria from your request...' });

  // In deep-research mode, enrich ICP with real market data
  let marketContext = '';
  if (chatMode === 'deep-research') {
    try {
      send('progress', { type: 'progress', stage: 'market_research', label: 'Researching market for ICP', detail: 'Finding market data to inform profile...' });
      const searchResult = await exaSearch(`${userMessage} market size trends competitors 2025`, 8);
      if (searchResult.success && searchResult.data.length > 0) {
        marketContext = `\n\nMarket research data:\n${searchResult.data.slice(0, 5).map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`;
      }
    } catch {
      // Continue without market data
    }
  }

  const result = await callLLMForJSON<{
    icp: {
      industry: string[];
      companySize: string[];
      location: string[];
      role: string[];
      painPoints: string[];
      signals: string[];
      budgetRange: string;
      decisionTimeline: string;
      description: string;
    };
  }>(
    `You are an ICP (Ideal Customer Profile) specialist for a B2B company. Based on the user's description, build a comprehensive ICP.

Return JSON: { "icp": { ... } }
The ICP should include:
- industry: Array of target industries
- companySize: Array of company size ranges (e.g., "51-200", "201-500")
- location: Array of target locations
- role: Array of target decision-maker roles/titles
- painPoints: Array of key pain points this ICP faces
- signals: Array of buying signals to look for
- budgetRange: Estimated budget range string
- decisionTimeline: Typical decision timeline
- description: 1-2 sentence description of the ideal customer

Be specific and actionable. Think about what makes a company a great fit, not just demographic filters.${marketContext ? '\n\nUse the market research data to make the ICP more informed and specific.' : ''}`,
    userMessage + marketContext,
    { temperature: 0.3, thinkingBudget: chatMode === 'deep-research' ? 'deep' : 'standard' }
  );

  // Generate explanation with tool navigation
  const explanation = await callLLM({
    systemPrompt: `You are an ICP consultant. Explain the ICP profile you built and suggest how to use it. Use markdown.

Always include tool navigation hints like:
- "Head over to **ICP Builder** to refine and save this profile"
- "Use **Prospect Discovery** to find companies matching this ICP"
- "Check **Outreach** to craft messages tailored to this profile"`,
    userMessage: `I've built an ICP profile: ${JSON.stringify(result?.icp || {})}. Explain it briefly and suggest next steps.`,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (explanation) {
    streamContent(send, explanation);
  }

  if (result?.icp) {
    send('icp_data', { type: 'icp_data', icp: result.icp });
    send('action_result', { type: 'action_result', action: 'build_icp', data: { icp: result.icp }, saveTarget: 'icp' });
  }
}

/**
 * ANALYZE PIPELINE — Uses LLM for pipeline analytics
 */
async function handleAnalyzePipeline(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'analyzing', label: 'Analyzing pipeline', detail: 'Generating pipeline insights...' });

  const result = await callLLM({
    systemPrompt: `You are a B2B pipeline analytics expert working for LeadReach. Help the user analyze their pipeline performance, identify bottlenecks, and suggest improvements.

Use markdown formatting. Include:
- **Key Metrics**: Conversion rates, average deal size, cycle time
- **Pipeline Health**: Stage-by-stage analysis
- **Bottlenecks**: Where leads are getting stuck
- **Recommendations**: Specific, actionable improvements with expected impact
- **Benchmarks**: Industry averages for comparison

Always include tool navigation hints like:
- "Check your **Analytics** dashboard for real-time metrics"
- "Use **Prospect Discovery** to refill the top of your funnel"
- "Head to **Outreach** to optimize your follow-up sequences"

Be specific and actionable. Use data-driven insights.`,
    userMessage,
    temperature: 0.4,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    streamContent(send, result);
  }

  send('action_result', {
    type: 'action_result',
    action: 'analyze_pipeline',
    data: { analysis: result },
    saveTarget: 'analytics',
  });
}

/**
 * RESEARCH MARKET — Uses Agent-Reach channels for real market research
 */
async function handleResearchMarket(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void,
  chatMode: ChatMode
): Promise<void> {
  send('progress', { type: 'progress', stage: 'researching', label: 'Researching market', detail: 'Conducting market and industry research...' });

  // Use Agent-Reach for real research
  if (chatMode !== 'quick') {
    try {
      send('progress', { type: 'progress', stage: 'web_search', label: 'Searching for market data', detail: 'Using web search for real-time market information...' });
      
      const searchResult = await exaSearch(`${userMessage} market size growth trends competitive landscape 2025`, 15);
      if (searchResult.success && searchResult.data.length > 0) {
        const sources = searchResult.data.map(r => r.url).filter(Boolean);
        send('progress', { type: 'progress', stage: 'reading', label: `Reading ${Math.min(searchResult.data.length, 3)} top sources`, detail: 'Extracting market insights...' });

        // Read top results
        const topUrls = searchResult.data.slice(0, chatMode === 'deep-research' ? 5 : 3).map(r => r.url);
        const readResults = await Promise.allSettled(topUrls.map(u => webRead(u)));
        const webContents: string[] = [];
        for (const result of readResults) {
          if (result.status === 'fulfilled' && result.value?.success) {
            webContents.push(result.value.data.content.slice(0, 5000));
          }
        }

        if (webContents.length > 0) {
          const synthesis = await callLLM({
            systemPrompt: `You are a market research analyst specializing in B2B markets. Based on the web research data provided, write a comprehensive market research report.

Use markdown formatting with:
- **Market Overview**: Size, growth rate, key segments
- **Key Trends**: Current dynamics shaping the market
- **Competitive Landscape**: Major players and their positioning
- **Opportunities**: Where the best prospects are
- **Strategic Recommendations**: Actionable next steps

Always include tool navigation hints like:
- "Use **Prospect Discovery** to find companies in this market"
- "Head to **Reports** to save this analysis for your team"

Be thorough, data-driven, and cite specific figures from the research data.

IMPORTANT: You MUST respond in English only. Never use Chinese or any other language.`,
            userMessage: `Market research query: "${userMessage}"\n\nResearch data:\n${webContents.join('\n---\n')}`,
            temperature: 0.3,
            model: MODEL_PRIMARY,
            useFallback: true,
            thinkingBudget: chatMode === 'deep-research' ? 'deep' : 'standard',
          });

          if (synthesis) {
            streamContent(send, synthesis);
            // Add sources
            if (sources.length > 0) {
              const sourcesText = `\n\n**Sources:** ${sources.slice(0, 5).map(s => `[${new URL(s).hostname}](${s})`).join(' · ')}`;
              streamContent(send, sourcesText);
            }
            send('action_result', {
              type: 'action_result',
              action: 'research_market',
              data: { findings: synthesis, sources: sources.slice(0, 5) },
              saveTarget: 'reports',
            });
            return;
          }
        }
      }
    } catch (err) {
      console.warn('[handleResearchMarket] Web research failed:', err instanceof Error ? err.message.slice(0, 100) : 'Unknown');
    }
  }

  // Fallback: LLM-only market research
  send('progress', { type: 'progress', stage: 'ai_research', label: 'Using AI for market analysis', detail: 'Generating market insights...' });

  const result = await callLLM({
    systemPrompt: `You are a market research analyst specializing in B2B markets. Provide comprehensive market research and analysis.
Use markdown formatting with:
- **Market Overview**: Size, growth rate, key segments
- **Key Trends**: Current dynamics shaping the market
- **Competitive Landscape**: Major players and their positioning
- **Opportunities**: Where the best prospects are
- **Strategic Recommendations**: Actionable next steps

Always include tool navigation hints like:
- "Use **Prospect Discovery** to find companies in this market"
- "Head to **Reports** to save this analysis for your team"

Be thorough but concise.`,
    userMessage,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    streamContent(send, result);
  }

  send('action_result', {
    type: 'action_result',
    action: 'research_market',
    data: { analysis: result },
    saveTarget: 'reports',
  });
}

/**
 * GENERAL CHAT — Uses LLM for conversational responses
 */
async function handleGeneralChat(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  systemPrompt: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  // Build conversation context
  const recentMessages = conversationHistory.slice(-8);
  const contextStr = recentMessages
    .slice(0, -1)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 300)}`)
    .join('\n\n');

  const fullUserMessage = contextStr
    ? `Conversation so far:\n${contextStr}\n\nCurrent question: ${userMessage}`
    : userMessage;

  const result = await callLLM({
    systemPrompt: (systemPrompt || 'You are LeadReach AI, a helpful assistant for B2B lead generation.') +
      '\n\nIMPORTANT: Always respond in English. Be concise, helpful, and actionable.' +
      '\n\nWhen relevant, naturally suggest platform tools the user could benefit from:' +
      '\n- "You can explore more leads in **Prospect Discovery**"' +
      '\n- "Head over to **ICP Builder** to refine your targeting"' +
      '\n- "Check **Outreach** to craft personalized messages"' +
      '\n- "Your **Analytics** dashboard has pipeline insights"' +
      '\n- "Use **Data Enrichment** to fill in missing contact details"' +
      '\nOnly suggest tools when genuinely relevant to the conversation.',
    userMessage: fullUserMessage,
    temperature: 0.7,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    streamContent(send, result);
  } else {
    streamContent(send, 'I apologize, but I was unable to generate a response. The AI service might be temporarily busy. Please try again in a moment.');
  }
}

// ============================================================
// Main Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: SmartChatRequest = await request.json();
    const { messages, systemPrompt, currentPage, chatMode = 'standard', userContext } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get the last user message
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: 'No user message found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userMessage = lastUserMessage.content;

    // Create SSE stream
    return createSSEStream(async (send) => {
      console.log(`[Smart Chat] Processing: "${userMessage.slice(0, 80)}" (mode: ${chatMode})`);

      // Step 1: Thinking
      send('thinking', { type: 'thinking', content: 'Analyzing your request...' });

      // Step 2: Classify intent
      const classification = await classifyIntent(userMessage, messages);
      const action = classification.action;

      console.log(`[Smart Chat] Intent: ${action} (confidence: ${classification.confidence}, mode: ${chatMode})`);

      // Step 3: Action detected
      send('action_detected', {
        type: 'action_detected',
        action,
        label: ACTION_LABELS[action],
      });

      // Step 4: Execute action with chat mode
      try {
        switch (action) {
          case 'discover_leads':
            await handleDiscoverLeads(userMessage, send, chatMode);
            break;
          case 'enrich_data':
            await handleEnrichData(userMessage, send, chatMode);
            break;
          case 'compose_outreach':
            await handleComposeOutreach(userMessage, send, chatMode);
            break;
          case 'build_icp':
            await handleBuildICP(userMessage, send, chatMode);
            break;
          case 'analyze_pipeline':
            await handleAnalyzePipeline(userMessage, send);
            break;
          case 'research_market':
            await handleResearchMarket(userMessage, send, chatMode);
            break;
          case 'general_chat':
          default:
            await handleGeneralChat(userMessage, messages, systemPrompt || '', send);
            break;
        }
      } catch (actionError) {
        // If the action handler fails, try a graceful fallback
        const msg = actionError instanceof Error ? actionError.message : 'Unknown error';
        console.error(`[Smart Chat] Action handler failed for ${action}:`, msg.slice(0, 200));

        // Try a simple LLM response as fallback
        try {
          send('progress', { type: 'progress', stage: 'fallback', label: 'Switching to direct AI response', detail: 'The specialized pipeline encountered an issue...' });
          const fallbackResult = await callLLM({
            systemPrompt: 'You are LeadReach AI, a helpful B2B lead generation assistant. Respond concisely and helpfully.',
            userMessage,
            temperature: 0.5,
            model: MODEL_PRIMARY,
            useFallback: true,
          });
          if (fallbackResult) {
            streamContent(send, fallbackResult);
          } else {
            streamContent(send, 'I encountered an issue processing your request. Please try again — the AI service might be temporarily busy.');
          }
        } catch {
          streamContent(send, 'I\'m sorry, I\'m having trouble connecting to the AI service right now. Please try again in a moment.');
        }
      }

      // Step 5: Done
      send('done', { type: 'done' });
    });
  } catch (error) {
    console.error('[Smart Chat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Smart chat request failed. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
