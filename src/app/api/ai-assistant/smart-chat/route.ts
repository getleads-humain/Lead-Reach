import { NextRequest } from 'next/server';
import { callLLM, callLLMForJSON, MODEL_PRIMARY } from '@/lib/llm';

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

interface SmartChatRequest {
  messages: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  currentPage?: string;
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
// Intent Classification
// ============================================================

async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<{ action: ActionType; confidence: number; reasoning: string }> {
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

  // Fallback: simple keyword-based classification
  const lower = userMessage.toLowerCase();
  // General questions (what/how/why/who) should not trigger lead discovery
  if (/^(what|how|why|who|when|where|can you explain|tell me about)\b/.test(lower)) {
    return { action: 'general_chat', confidence: 0.8, reasoning: 'Question starting with question word suggests general inquiry' };
  }
  if (/\b(find|search for|discover|look for|locate)\b.*\b(leads?|prospects?|companies|people|contacts?)\b/.test(lower)) {
    return { action: 'discover_leads', confidence: 0.7, reasoning: 'Keyword match for lead discovery' };
  }
  if (/enrich|enhance|more (info|data)|fill.*(missing|gap)/.test(lower)) {
    return { action: 'enrich_data', confidence: 0.7, reasoning: 'Keyword match for data enrichment' };
  }
  if (/email|message|outreach|cold|linkedin.*message|sequence|draft/.test(lower)) {
    return { action: 'compose_outreach', confidence: 0.7, reasoning: 'Keyword match for outreach' };
  }
  if (/icp|ideal.*customer|profile|target.*customer|persona/.test(lower)) {
    return { action: 'build_icp', confidence: 0.7, reasoning: 'Keyword match for ICP building' };
  }
  if (/pipeline|analytics|conversion|performance|metric|funnel/.test(lower)) {
    return { action: 'analyze_pipeline', confidence: 0.7, reasoning: 'Keyword match for pipeline analysis' };
  }
  if (/market|industry|research|competitive|trend/.test(lower)) {
    return { action: 'research_market', confidence: 0.7, reasoning: 'Keyword match for market research' };
  }
  return { action: 'general_chat', confidence: 0.5, reasoning: 'No specific intent detected' };
}

// ============================================================
// Action Handlers
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

async function handleDiscoverLeads(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'searching', label: 'Searching for leads', detail: 'Using prospect discovery pipeline...' });

  try {
    // Call the internal prospect-discovery search API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://127.0.0.1:3000';

    const searchResponse = await fetch(`${baseUrl}/api/prospect-discovery/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userMessage }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Search API returned ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();

    if (!searchData.success || !searchData.prospect) {
      send('content', { type: 'content', chunk: 'I searched but couldn\'t find detailed prospect data. Let me try to help with what I know.' });

      // Fallback: generate leads using LLM knowledge
      const llmLeads = await generateLLMLeads(userMessage, send);
      if (llmLeads.length > 0) {
        send('lead_data', { type: 'lead_data', leads: llmLeads });
        send('action_result', {
          type: 'action_result',
          action: 'discover_leads',
          data: { leads: llmLeads },
          saveTarget: 'leads',
        });
      }
      return;
    }

    const prospect = searchData.prospect;

    // Convert the prospect data into lead format
    const leads: Array<Record<string, unknown>> = [];

    // If it's a company result
    if (prospect.companyName) {
      const lead: Record<string, unknown> = {
        name: prospect.keyContactName || prospect.ceoName || 'Unknown Contact',
        company: prospect.companyName,
        title: prospect.keyContactTitle || 'Decision Maker',
        email: prospect.keyContactEmail || prospect.generalEmail || prospect.ceoEmail || undefined,
        phone: prospect.phoneMain || undefined,
        score: Math.round(prospect.dataCompleteness || 50),
        tier: (prospect.dataCompleteness || 50) > 70 ? 'hot' : (prospect.dataCompleteness || 50) > 40 ? 'warm' : 'cold',
        source: 'AI Discovery',
        reason: `Found via prospect discovery: ${prospect.industry || 'Unknown industry'} company`,
        website: prospect.website || undefined,
        linkedin: prospect.linkedinUrl || undefined,
      };
      leads.push(lead);
    }

    // If domain-specific records were found, add those too
    if (prospect.domainData && Array.isArray(prospect.domainData)) {
      for (const record of prospect.domainData.slice(0, 5)) {
        const r = record as Record<string, unknown>;
        leads.push({
          name: r.contactName || r.personName || r.ceoName || 'Contact',
          company: r.companyName || r.fundName || r.name || 'Company',
          title: r.title || r.role || 'Professional',
          email: r.email || r.contactEmail || undefined,
          phone: r.phone || undefined,
          score: 65,
          tier: 'warm',
          source: `AI Discovery (${prospect.domainLabel || 'Domain'})`,
          reason: `Domain-specific finding: ${prospect.domainLabel || 'Specialized'}`,
          website: r.website || undefined,
          linkedin: r.linkedin || undefined,
        });
      }
    }

    // If it's a person result
    if (prospect.personName && !prospect.companyName) {
      leads.push({
        name: prospect.personName,
        company: prospect.personCompany || 'Unknown Company',
        title: prospect.personTitle || 'Professional',
        email: prospect.personEmail || undefined,
        phone: prospect.personPhone || undefined,
        score: Math.round(prospect.dataCompleteness || 50),
        tier: (prospect.dataCompleteness || 50) > 70 ? 'hot' : 'warm',
        source: 'AI Discovery',
        reason: `Found via person search: ${prospect.personTitle || 'Professional'}`,
        linkedin: prospect.personLinkedin || undefined,
      });
    }

    // Stream the research steps as progress
    if (searchData.steps && Array.isArray(searchData.steps)) {
      for (const step of searchData.steps) {
        if (step.status === 'completed' && step.message) {
          send('progress', { type: 'progress', stage: step.step, label: step.message });
        }
      }
    }

    // Generate a text summary
    const summaryPrompt = `Summarize the following lead discovery results in a concise, actionable way. Use bullet points. Include company names, key contacts, and relevant details.
    
Discovery results: ${JSON.stringify(leads, null, 2)}`;

    const summary = await callLLM({
      systemPrompt: 'You are a B2B lead generation assistant. Provide concise, actionable summaries of discovered leads.',
      userMessage: summaryPrompt,
      temperature: 0.3,
      model: MODEL_PRIMARY,
      useFallback: true,
    });

    if (summary) {
      // Stream the content
      for (let i = 0; i < summary.length; i += 20) {
        send('content', { type: 'content', chunk: summary.slice(i, i + 20) });
      }
    }

    // Send lead data
    if (leads.length > 0) {
      send('lead_data', { type: 'lead_data', leads });
      send('action_result', {
        type: 'action_result',
        action: 'discover_leads',
        data: { leads },
        saveTarget: 'leads',
      });
    } else {
      // Try LLM-generated leads as fallback
      const llmLeads = await generateLLMLeads(userMessage, send);
      if (llmLeads.length > 0) {
        send('lead_data', { type: 'lead_data', leads: llmLeads });
        send('action_result', {
          type: 'action_result',
          action: 'discover_leads',
          data: { leads: llmLeads },
          saveTarget: 'leads',
        });
      }
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    send('progress', { type: 'progress', stage: 'fallback', label: 'Using AI knowledge for lead suggestions' });

    // Fallback to LLM-generated leads
    const llmLeads = await generateLLMLeads(userMessage, send);
    if (llmLeads.length > 0) {
      send('lead_data', { type: 'lead_data', leads: llmLeads });
      send('action_result', {
        type: 'action_result',
        action: 'discover_leads',
        data: { leads: llmLeads },
        saveTarget: 'leads',
      });
    } else {
      send('content', { type: 'content', chunk: `\n\nI had trouble searching for leads: ${msg}. Please try a more specific query, like "Find SaaS companies in New York" or "Search for marketing agencies in London."` });
    }
  }
}

async function generateLLMLeads(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<Array<Record<string, unknown>>> {
  send('progress', { type: 'progress', stage: 'ai_generation', label: 'Generating leads with AI', detail: 'Using AI knowledge to suggest potential leads...' });

  const result = await callLLMForJSON<{ leads: Array<Record<string, unknown>> }>(
    `You are a B2B lead generation expert. Based on the user's query, suggest realistic potential leads/companies that match their criteria. 
For each lead, provide:
- name: Full name of a key contact (realistic, but note these are AI-suggested)
- company: Company name
- title: Job title of the contact
- email: Suggested email format (e.g., first.last@company.com) 
- score: Lead score 0-100 based on fit
- tier: "hot", "warm", or "cold"
- source: "AI Suggested"
- reason: Why this lead matches the query
- website: Company website URL
- linkedin: LinkedIn company URL

Return JSON: { "leads": [...] }
Generate 3-5 realistic leads. Make sure company names and contacts are plausible for the industry/location requested. Mark them as AI-suggested since these are not verified contacts.`,
    userMessage,
    { temperature: 0.5, thinkingBudget: 'standard' }
  );

  return result?.leads || [];
}

async function handleEnrichData(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'enriching', label: 'Enriching lead data', detail: 'Adding firmographic and contact details...' });

  const result = await callLLM({
    systemPrompt: `You are a B2B data enrichment specialist working for LeadReach. Help the user enrich their lead/company data. 
Provide specific, actionable enrichment suggestions. If they mention a specific company, suggest what data points could be added (contact info, firmographics, tech stack, etc.).
Format your response in markdown with clear sections.`,
    userMessage,
    temperature: 0.4,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    for (let i = 0; i < result.length; i += 20) {
      send('content', { type: 'content', chunk: result.slice(i, i + 20) });
    }
  }

  send('action_result', {
    type: 'action_result',
    action: 'enrich_data',
    data: { enrichmentSuggestions: result },
    saveTarget: 'data-enrichment',
  });
}

async function handleComposeOutreach(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'composing', label: 'Composing outreach messages', detail: 'Crafting personalized messages...' });

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
Use best practices: clear value proposition, social proof, soft CTA, short paragraphs.`,
    userMessage,
    { temperature: 0.5, thinkingBudget: 'standard' }
  );

  // Generate explanation text
  const explanation = await callLLM({
    systemPrompt: 'You are an outreach consultant. Briefly explain the outreach strategy and why these messages work. Use markdown. Keep it concise.',
    userMessage: `I've generated ${result?.messages?.length || 0} outreach messages for the request: "${userMessage}". Briefly explain the approach.`,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (explanation) {
    for (let i = 0; i < explanation.length; i += 20) {
      send('content', { type: 'content', chunk: explanation.slice(i, i + 20) });
    }
  }

  if (result?.messages && result.messages.length > 0) {
    send('outreach_data', { type: 'outreach_data', messages: result.messages });
    send('action_result', {
      type: 'action_result',
      action: 'compose_outreach',
      data: { messages: result.messages },
      saveTarget: 'outreach',
    });
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
      for (let i = 0; i < fallbackText.length; i += 20) {
        send('content', { type: 'content', chunk: fallbackText.slice(i, i + 20) });
      }
    } else {
      send('content', { type: 'content', chunk: 'I was unable to generate outreach messages at this time. Please try again with more specific details about your target audience.' });
    }
  }
}

async function handleBuildICP(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'analyzing', label: 'Building Ideal Customer Profile', detail: 'Extracting ICP criteria from your request...' });

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

Be specific and actionable. Think about what makes a company a great fit, not just demographic filters.`,
    userMessage,
    { temperature: 0.3, thinkingBudget: 'standard' }
  );

  // Generate explanation
  const explanation = await callLLM({
    systemPrompt: 'You are an ICP consultant. Explain the ICP profile you built and suggest how to use it. Use markdown.',
    userMessage: `I've built an ICP profile: ${JSON.stringify(result?.icp || {})}. Explain it briefly and suggest next steps.`,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (explanation) {
    for (let i = 0; i < explanation.length; i += 20) {
      send('content', { type: 'content', chunk: explanation.slice(i, i + 20) });
    }
  }

  if (result?.icp) {
    send('icp_data', { type: 'icp_data', icp: result.icp });
    send('action_result', {
      type: 'action_result',
      action: 'build_icp',
      data: { icp: result.icp },
      saveTarget: 'icp',
    });
  }
}

async function handleAnalyzePipeline(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'analyzing', label: 'Analyzing pipeline', detail: 'Generating pipeline insights...' });

  const result = await callLLM({
    systemPrompt: `You are a B2B pipeline analytics expert working for LeadReach. Help the user analyze their pipeline performance, identify bottlenecks, and suggest improvements.
Use markdown formatting. Include:
- Key metrics to track
- Common pipeline bottlenecks
- Specific recommendations for improvement
- Benchmark comparisons where relevant
Be specific and actionable.`,
    userMessage,
    temperature: 0.4,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    for (let i = 0; i < result.length; i += 20) {
      send('content', { type: 'content', chunk: result.slice(i, i + 20) });
    }
  }

  send('action_result', {
    type: 'action_result',
    action: 'analyze_pipeline',
    data: { analysis: result },
    saveTarget: 'analytics',
  });
}

async function handleResearchMarket(
  userMessage: string,
  send: (event: string, data: SSEEvent) => void
): Promise<void> {
  send('progress', { type: 'progress', stage: 'researching', label: 'Researching market', detail: 'Conducting market and industry research...' });

  try {
    // Try to use the deep research API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://127.0.0.1:3000';

    const researchResponse = await fetch(`${baseUrl}/api/ai-assistant/deep-research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userMessage, depth: 'standard' }),
    });

    if (researchResponse.ok) {
      const researchData = await researchResponse.json();
      if (researchData.findings) {
        for (let i = 0; i < researchData.findings.length; i += 20) {
          send('content', { type: 'content', chunk: researchData.findings.slice(i, i + 20) });
        }
        send('action_result', {
          type: 'action_result',
          action: 'research_market',
          data: { findings: researchData.findings, sources: researchData.sources },
          saveTarget: 'reports',
        });
        return;
      }
    }
  } catch {
    // Fallback to LLM-only research
  }

  // Fallback: LLM-based market research
  send('progress', { type: 'progress', stage: 'ai_research', label: 'Using AI for market analysis', detail: 'Generating market insights...' });

  const result = await callLLM({
    systemPrompt: `You are a market research analyst specializing in B2B markets. Provide comprehensive market research and analysis.
Use markdown formatting with:
- Market overview and size
- Key trends and dynamics
- Competitive landscape
- Opportunities and threats
- Strategic recommendations
Be thorough but concise.`,
    userMessage,
    temperature: 0.3,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    for (let i = 0; i < result.length; i += 20) {
      send('content', { type: 'content', chunk: result.slice(i, i + 20) });
    }
  }

  send('action_result', {
    type: 'action_result',
    action: 'research_market',
    data: { analysis: result },
    saveTarget: 'reports',
  });
}

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
      '\n\nIMPORTANT: Always respond in English. Be concise, helpful, and actionable.',
    userMessage: fullUserMessage,
    temperature: 0.7,
    model: MODEL_PRIMARY,
    useFallback: true,
  });

  if (result) {
    for (let i = 0; i < result.length; i += 20) {
      send('content', { type: 'content', chunk: result.slice(i, i + 20) });
    }
  } else {
    send('content', { type: 'content', chunk: 'I apologize, but I was unable to generate a response. Please try again.' });
  }
}

// ============================================================
// Main Route Handler
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: SmartChatRequest = await request.json();
    const { messages, systemPrompt, currentPage, userContext } = body;

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
      // Step 1: Thinking
      send('thinking', { type: 'thinking', content: 'Analyzing your request...' });

      // Step 2: Classify intent
      const classification = await classifyIntent(userMessage, messages);
      const action = classification.action;

      // Step 3: Action detected
      send('action_detected', {
        type: 'action_detected',
        action,
        label: ACTION_LABELS[action],
      });

      // Step 4: Execute action
      switch (action) {
        case 'discover_leads':
          await handleDiscoverLeads(userMessage, send);
          break;
        case 'enrich_data':
          await handleEnrichData(userMessage, send);
          break;
        case 'compose_outreach':
          await handleComposeOutreach(userMessage, send);
          break;
        case 'build_icp':
          await handleBuildICP(userMessage, send);
          break;
        case 'analyze_pipeline':
          await handleAnalyzePipeline(userMessage, send);
          break;
        case 'research_market':
          await handleResearchMarket(userMessage, send);
          break;
        case 'general_chat':
        default:
          await handleGeneralChat(userMessage, messages, systemPrompt || '', send);
          break;
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
