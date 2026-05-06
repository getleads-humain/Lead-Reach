/**
 * Agent Execution Engine
 * 
 * This is the CORE RUNTIME that powers the Agent Reach platform.
 * When a task is created (via AI chat or manual creation), this engine:
 * 
 * 1. Picks up the pending task from the database
 * 2. Loads the agent's skills and configuration
 * 3. Dispatches to the correct agent handler
 * 4. The agent handler calls Agent-Reach tools (via agent-reach-bridge.ts)
 * 5. Feeds raw data to the LLM (z-ai-web-dev-sdk) for structured extraction
 * 6. Stores results back in the database (leads, outreach, task output)
 * 7. Updates task progress in real-time
 * 
 * Every agent is powered by Agent-Reach — the tool bridge gives them
 * real internet access to 17+ channels for research, discovery, and enrichment.
 */

import { db } from './db';
import type { AgentName } from './types';
import {
  AgentReachToolkit,
  webRead,
  exaSearch,
  linkedInGetProfile,
  linkedInSearchPeople,
  twitterSearch,
  redditSearch,
  githubSearchRepos,
  discoverBusinesses,
  enrichCompanyData,
  youtubeSearch,
  rssRead,
  type ToolResult,
  type SearchResult,
  type WebReadResult,
} from './agent-reach-bridge';

// ============================================================
// Types
// ============================================================

export interface AgentExecutionContext {
  taskId: string;
  agentName: AgentName;
  taskType: string;
  campaignId: string | null;
  input: Record<string, unknown>;
  priority: number;
}

export interface AgentExecutionResult {
  success: boolean;
  output: Record<string, unknown>;
  channelActivity: ChannelActivityRecord[];
  error?: string;
}

export interface ChannelActivityRecord {
  channel: string;
  operation: string;
  success: boolean;
  timestamp: string;
  resultCount?: number;
  error?: string;
}

export interface FullPipelineResult {
  success: boolean;
  campaignId: string | null;
  discovery: AgentExecutionResult | null;
  enrichment: AgentExecutionResult | null;
  qualification: AgentExecutionResult | null;
  outreach: AgentExecutionResult | null;
  summary: {
    leadsFound: number;
    leadsEnriched: number;
    leadsQualified: number;
    leadsContacted: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    errors: string[];
  };
}

// ============================================================
// LLM Integration via z-ai-web-dev-sdk
// ============================================================

/**
 * Call the LLM to process/extract/analyze data.
 * This is used by every agent to turn raw web data into structured intelligence.
 * Retries once on timeout.
 */
async function callLLM(systemPrompt: string, userMessage: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const content = result.choices?.[0]?.message?.content || '';
      if (content.trim()) {
        return content;
      }
      
      if (attempt < retries) {
        console.warn(`[callLLM] Empty response on attempt ${attempt + 1}, retrying...`);
        continue;
      }
      return content;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      if (attempt < retries) {
        console.warn(`[callLLM] Attempt ${attempt + 1} failed: ${msg}, retrying...`);
        continue;
      }
      console.error('LLM call failed after retries:', error);
      throw new Error(`LLM call failed: ${msg}`);
    }
  }
  return '';
}

/**
 * Robustly extract JSON from an LLM response.
 * 
 * Strategies (in order):
 * 1. Strip markdown code blocks (```json ... ```) then parse
 * 2. Find first JSON object/array in the response
 * 3. Parse the entire response as JSON
 * 4. Retry up to 2 times with a more explicit prompt
 * 5. Return a safe default structure instead of crashing
 */
async function callLLMForJSON<T>(systemPrompt: string, userMessage: string, defaultValue?: T): Promise<T> {
  const MAX_RETRIES = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await callLLM(systemPrompt, userMessage);
      const result = extractJSONFromString<T>(response);
      if (result !== null) {
        return result;
      }
      lastError = new Error(`Failed to extract JSON from LLM response`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < MAX_RETRIES) {
      // Add emphasis on JSON format for retries
      const retrySystemPrompt = systemPrompt + '\n\nIMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no explanations, just raw JSON.';
      try {
        const response = await callLLM(retrySystemPrompt, userMessage);
        const result = extractJSONFromString<T>(response);
        if (result !== null) {
          return result;
        }
      } catch (retryError) {
        lastError = retryError instanceof Error ? retryError : new Error(String(retryError));
      }
    }
  }

  // All retries exhausted — return default if provided
  if (defaultValue !== undefined) {
    console.warn(`[callLLMForJSON] All retries exhausted, returning default value. Last error: ${lastError?.message}`);
    return defaultValue;
  }

  // No default — throw
  throw lastError || new Error('Failed to parse LLM response as JSON after all retries');
}

/**
 * Extract JSON from a string using multiple strategies.
 */
function extractJSONFromString<T>(response: string): T | null {
  if (!response || !response.trim()) return null;

  // Strategy 1: Strip markdown code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    } catch {
      // Code block content wasn't valid JSON, try next strategy
    }
  }

  // Strategy 2: Find first JSON object or array
  // Look for the first { or [ and match to the closing bracket
  const jsonStr = findBalancedJSON(response);
  if (jsonStr) {
    try {
      return JSON.parse(jsonStr) as T;
    } catch {
      // Balanced match wasn't valid JSON
    }
  }

  // Strategy 3: Try parsing the whole response
  try {
    return JSON.parse(response.trim()) as T;
  } catch {
    // Nothing worked
  }

  return null;
}

/**
 * Find the first balanced JSON object or array in a string.
 */
function findBalancedJSON(text: string): string | null {
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  
  let start: number;
  let openChar: string;
  let closeChar: string;
  
  if (startObj === -1 && startArr === -1) return null;
  if (startObj === -1) { start = startArr; openChar = '['; closeChar = ']'; }
  else if (startArr === -1) { start = startObj; openChar = '{'; closeChar = '}'; }
  else { start = Math.min(startObj, startArr); openChar = start < startArr ? '{' : '['; closeChar = start < startArr ? '}' : ']'; }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === openChar) depth++;
    if (ch === closeChar) depth--;
    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  // Unbalanced — return from start to end as last resort
  if (depth > 0) {
    return text.slice(start);
  }

  return null;
}

// ============================================================
// Progress Tracking
// ============================================================

async function updateTaskProgress(taskId: string, progress: number, status?: string, output?: Record<string, unknown>) {
  const updateData: Record<string, unknown> = {
    progress,
    updatedAt: new Date(),
  };
  if (status) updateData.status = status;
  if (output) updateData.output = JSON.stringify(output);

  await db.agentTask.update({
    where: { id: taskId },
    data: updateData,
  });
}

// ============================================================
// Agent Handlers
// Each handler uses Agent-Reach tools + LLM to perform real work.
// ============================================================

/**
 * ORCHESTRATOR AGENT
 * Coordinates multi-agent workflows. Plans the execution graph,
 * creates sub-tasks for other agents, and monitors progress.
 * 
 * Agent-Reach: No direct channel access — delegates to specialized agents.
 */
async function executeOrchestrator(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input } = ctx;

  const planningPrompt = `You are the Orchestrator Agent ("Atlas") for a lead generation platform powered by Agent-Reach.
Your job is to create a detailed execution plan for the following request, breaking it into sub-tasks for specialized agents.

Available agents and their Agent-Reach-powered capabilities:
- prospect-discovery: Exa Search, Web (Jina Reader), LinkedIn, GitHub, Twitter, Reddit, RSS
- data-enrichment: Web (Jina Reader), LinkedIn, Exa Search, Twitter, GitHub
- web-research: Web (Jina Reader), Exa Search, LinkedIn, Twitter, YouTube, Reddit, RSS
- lead-qualification: Web (Jina Reader), LinkedIn, Exa Search
- outreach-composer: LinkedIn, Web (Jina Reader), Exa Search
- pipeline-manager: Database only (no direct channel access)
- report-generator: Database only (no direct channel access)

Create a JSON execution plan with this structure:
{
  "campaignName": "string",
  "targetIndustry": "string",
  "targetLocation": "string",
  "steps": [
    {
      "agent": "agent-name",
      "taskType": "search|enrich|qualify|outreach|report|coordinate",
      "description": "What this agent should do",
      "input": { key: value },
      "dependsOn": null | "step-index"
    }
  ]
}`;

  try {
    await updateTaskProgress(ctx.taskId, 20, 'running');

    const plan = await callLLMForJSON<{
      campaignName: string;
      targetIndustry: string;
      targetLocation: string;
      steps: Array<{
        agent: string;
        taskType: string;
        description: string;
        input: Record<string, unknown>;
        dependsOn: number | null;
      }>;
    }>(planningPrompt, JSON.stringify(input), {
      campaignName: 'New Campaign',
      targetIndustry: '',
      targetLocation: '',
      steps: [],
    });

    await updateTaskProgress(ctx.taskId, 60, 'running');

    // Create campaign if we have enough info
    let campaignId = ctx.campaignId;
    if (!campaignId && plan.campaignName) {
      const campaign = await db.campaign.create({
        data: {
          name: plan.campaignName,
          targetIndustry: plan.targetIndustry,
          targetLocation: plan.targetLocation,
          status: 'active',
        },
      });
      campaignId = campaign.id;
    }

    // Create sub-tasks for each step
    const createdTasks: Array<{id: string; agent: string; taskType: string}> = [];
    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      const task = await db.agentTask.create({
        data: {
          campaignId,
          agentName: step.agent,
          taskType: step.taskType,
          status: 'pending',
          priority: Math.max(1, 10 - i), // Earlier steps get higher priority
          input: JSON.stringify({
            ...step.input,
            description: step.description,
            parentTaskId: ctx.taskId,
            ...(campaignId ? { campaignId } : {}),
          }),
        },
      });
      createdTasks.push({ id: task.id, agent: step.agent, taskType: step.taskType });
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      plan,
      campaignId,
      createdTasks,
      totalSubTasks: createdTasks.length,
    });

    return {
      success: true,
      output: { plan, campaignId, createdTasks },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * PROSPECT DISCOVERY AGENT
 * Uses Agent-Reach channels: exa_search, web, linkedin, github, twitter, reddit, rss
 * 
 * This is the primary lead-finding agent. It searches across ALL available
 * channels simultaneously, then uses LLM to extract structured company data.
 * 
 * Resilience: If all channel searches fail, uses LLM to generate companies
 * based on industry/location knowledge (fallback mode).
 */
async function executeProspectDiscovery(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input, campaignId } = ctx;
  
  const query = (input.query as string) || (input.description as string) || '';
  const industry = (input.industry as string) || '';
  const location = (input.location as string) || '';

  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');

    // Step 1: Multi-channel search using Agent-Reach
    const searchQuery = [query, industry, location].filter(Boolean).join(' ');
    
    const [exaRes, redditRes, linkedInRes, twitterRes] = await Promise.allSettled([
      AgentReachToolkit.exaSearch(searchQuery, 15),
      AgentReachToolkit.redditSearch(searchQuery, 5),
      industry ? AgentReachToolkit.linkedInSearchPeople(`${industry} ${location}`, 10) : Promise.resolve({ success: false, data: [], channel: 'linkedin', source: 'skipped', timestamp: '' }),
      AgentReachToolkit.twitterSearch(searchQuery, 5),
    ]);

    // Record channel activity
    const recordActivity = (result: PromiseSettledResult<ToolResult<unknown>>, channel: string, operation: string) => {
      if (result.status === 'fulfilled') {
        channelActivity.push({
          channel,
          operation,
          success: result.value.success,
          timestamp: result.value.timestamp,
          resultCount: Array.isArray(result.value.data) ? result.value.data.length : (result.value.success ? 1 : 0),
          error: result.value.error,
        });
      } else {
        channelActivity.push({ channel, operation, success: false, timestamp: new Date().toISOString(), error: result.reason?.message });
      }
    };

    recordActivity(exaRes, 'exa_search', 'web_search');
    recordActivity(redditRes, 'reddit', 'search');
    recordActivity(linkedInRes, 'linkedin', 'search_people');
    recordActivity(twitterRes, 'twitter', 'search');

    await updateTaskProgress(ctx.taskId, 40, 'running');

    // Step 2: Collect all raw search results
    const rawResults: SearchResult[] = [];
    
    if (exaRes.status === 'fulfilled' && exaRes.value.success) {
      rawResults.push(...exaRes.value.data);
    }
    if (redditRes.status === 'fulfilled' && redditRes.value.success) {
      rawResults.push(...redditRes.value.data.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.selftext || `r/${r.subreddit}`,
      })));
    }
    if (linkedInRes.status === 'fulfilled' && linkedInRes.value.success) {
      rawResults.push(...linkedInRes.value.data.map(r => ({
        title: r.name,
        url: r.url,
        snippet: r.headline,
      })));
    }
    if (twitterRes.status === 'fulfilled' && twitterRes.value.success) {
      rawResults.push(...twitterRes.value.data.map(r => ({
        title: r.text?.slice(0, 100) || '',
        url: r.url,
        snippet: r.text?.slice(0, 300) || '',
      })));
    }

    await updateTaskProgress(ctx.taskId, 60, 'running');

    // Step 3: Use LLM to extract structured company data from search results
    // RESILIENCE: If no search results, use LLM to generate companies from knowledge
    let companies: Array<Record<string, unknown>>;
    
    if (rawResults.length === 0) {
      // FALLBACK MODE: All channels failed — generate companies from LLM knowledge
      console.warn('[ProspectDiscovery] All channels returned no results, using LLM fallback');
      const fallbackPrompt = `You are a lead generation specialist. The web search channels are currently unavailable, but the user wants to find companies.

Based on your knowledge, generate a list of 5-10 REAL, well-known companies in the following industry and location.
Only include companies you are confident actually exist.

Industry: ${industry || 'General'}
Location: ${location || 'Global'}
Query: ${query || industry}

Return a JSON array of company objects:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "industry": "Industry",
    "city": "City",
    "country": "Country",
    "phoneMain": null,
    "generalEmail": null,
    "hqAddress": null,
    "linkedinUrl": null,
    "description": "Brief description",
    "sources": ["llm_knowledge"]
  }
]`;

      companies = await callLLMForJSON<Array<Record<string, unknown>>>(fallbackPrompt, `Generate companies for: ${searchQuery}`, []);
      channelActivity.push({
        channel: 'llm_fallback',
        operation: 'generate_companies',
        success: true,
        timestamp: new Date().toISOString(),
        resultCount: companies.length,
        error: 'All search channels returned no results; used LLM knowledge fallback',
      });
    } else {
      const extractionPrompt = `You are a lead data extraction specialist. Given web search results about businesses/companies, extract structured company information.

Return a JSON array of company objects with these fields:
[
  {
    "companyName": "Company Name",
    "website": "https://example.com",
    "industry": "Industry",
    "city": "City",
    "country": "Country",
    "phoneMain": "Phone if found",
    "generalEmail": "Email if found",
    "hqAddress": "Address if found",
    "linkedinUrl": "LinkedIn URL if found",
    "description": "Brief description",
    "sources": ["url1", "url2"]
  }
]

IMPORTANT RULES:
- Only include REAL companies/businesses, not articles or blog posts
- If a result is just an article or discussion, skip it
- Extract as much detail as possible from the snippet
- If you can't find certain fields, use null
- Deduplicate companies that appear multiple times`;

      companies = await callLLMForJSON<Array<Record<string, unknown>>>(
        extractionPrompt,
        `Search query: "${searchQuery}"\n\nSearch results:\n${JSON.stringify(rawResults.slice(0, 30))}`,
        [],
      );
    }

    await updateTaskProgress(ctx.taskId, 80, 'running');

    // Step 4: Create lead records in the database
    const createdLeads: string[] = [];
    for (const company of companies) {
      if (!company.companyName) continue;
      
      try {
        const lead = await db.lead.create({
          data: {
            campaignId: campaignId || (await db.campaign.findFirst({ where: { status: 'active' } }))?.id || (await db.campaign.create({ data: { name: `${industry || 'Lead'} Campaign - ${location || 'Global'}` } })).id,
            companyName: company.companyName as string,
            website: (company.website as string) || null,
            industry: (company.industry as string) || industry || null,
            city: (company.city as string) || location?.split(',')[0] || null,
            country: (company.country as string) || location?.split(',').pop()?.trim() || null,
            phoneMain: (company.phoneMain as string) || null,
            generalEmail: (company.generalEmail as string) || null,
            hqAddress: (company.hqAddress as string) || null,
            linkedinUrl: (company.linkedinUrl as string) || null,
            notes: (company.description as string) || null,
            sources: JSON.stringify(company.sources || []),
            stage: 'new',
          },
        });
        createdLeads.push(lead.id);
      } catch (dbError) {
        console.error('Failed to create lead:', dbError);
      }
    }

    // Update campaign lead count
    if (campaignId) {
      await db.campaign.update({
        where: { id: campaignId },
        data: { leadsFound: { increment: createdLeads.length } },
      });
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      found: companies.length,
      leadsCreated: createdLeads.length,
      channels: channelActivity.filter(c => c.success).map(c => c.channel),
      rawResultCount: rawResults.length,
    });

    return {
      success: true,
      output: {
        found: companies.length,
        leadsCreated: createdLeads.length,
        channels: channelActivity.filter(c => c.success).map(c => c.channel),
      },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * DATA ENRICHMENT AGENT
 * Uses Agent-Reach channels: web, linkedin, exa_search, twitter, github
 * 
 * Reads company websites via Jina Reader, searches LinkedIn for profiles,
 * and enriches lead records with extracted data.
 * 
 * Resilience: If a lead can't be enriched (no website, no search results),
 * still advances it to 'enriched' stage with LLM-generated estimates.
 */
async function executeDataEnrichment(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input, campaignId } = ctx;

  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');

    // Get leads that need enrichment (stage = 'new', missing contact data)
    const leads = campaignId
      ? await db.lead.findMany({ where: { campaignId, stage: 'new' }, take: 20 })
      : await db.lead.findMany({ where: { stage: 'new' }, take: 20 });

    if (leads.length === 0) {
      await updateTaskProgress(ctx.taskId, 100, 'completed', { enriched: 0, message: 'No new leads to enrich' });
      return { success: true, output: { enriched: 0 }, channelActivity };
    }

    let enrichedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const progress = 10 + Math.floor((i / leads.length) * 80);
      await updateTaskProgress(ctx.taskId, progress, 'running');

      try {
        // Step 1: Read company website via Jina Reader (Agent-Reach)
        let websiteContent: string | null = null;
        if (lead.website) {
          const webResult = await enrichCompanyData(lead.website);
          channelActivity.push({
            channel: 'web',
            operation: 'read_company_site',
            success: webResult.success,
            timestamp: new Date().toISOString(),
            error: webResult.error,
          });
          
          if (webResult.success) {
            websiteContent = webResult.data.content?.slice(0, 15000) || null;
          }
        }

        // Step 2: Search for additional company data via Exa (Agent-Reach)
        const exaResult = await exaSearch(`${lead.companyName} ${lead.industry || ''} contact email phone address`, 5);
        channelActivity.push({
          channel: 'exa_search',
          operation: 'enrichment_search',
          success: exaResult.success,
          timestamp: new Date().toISOString(),
          resultCount: exaResult.success ? exaResult.data.length : 0,
        });

        // Step 3: Search LinkedIn for company profile (Agent-Reach)
        const linkedInResult = await linkedInSearchPeople(lead.companyName, 3);
        channelActivity.push({
          channel: 'linkedin',
          operation: 'company_search',
          success: linkedInResult.success,
          timestamp: new Date().toISOString(),
          resultCount: linkedInResult.success ? linkedInResult.data.length : 0,
        });

        // RESILIENCE: If no data was found from any source, still try LLM with just the company name
        const hasData = websiteContent || (exaResult.success && exaResult.data.length > 0) || (linkedInResult.success && linkedInResult.data.length > 0);
        
        // Step 4: Use LLM to extract enrichment data
        const enrichmentPrompt = hasData
          ? `You are a data enrichment specialist. Given a lead record and web research data, extract and fill in missing fields.

Current lead data:
${JSON.stringify({
  companyName: lead.companyName,
  website: lead.website,
  industry: lead.industry,
  city: lead.city,
  country: lead.country,
})}

Website content: ${websiteContent?.slice(0, 8000) || 'No website content available'}
Search results: ${JSON.stringify(exaResult.success ? exaResult.data.slice(0, 5) : [])}
LinkedIn results: ${JSON.stringify(linkedInResult.success ? linkedInResult.data.slice(0, 3) : [])}

Return a JSON object with ONLY the fields you can confidently fill in:
{
  "phoneMain": "phone or null",
  "phoneDirect": "phone or null",
  "generalEmail": "email or null",
  "supportEmail": "email or null",
  "hqAddress": "full address or null",
  "city": "city or null",
  "stateProvince": "state or null",
  "country": "country or null",
  "postalCode": "postal code or null",
  "ceoName": "CEO name or null",
  "ceoEmail": "CEO email or null",
  "keyContactName": "key contact name or null",
  "keyContactTitle": "key contact title or null",
  "keyContactEmail": "key contact email or null",
  "employeeCount": "range like '51-200' or null",
  "revenueEstimate": "estimate like '$10M-$50M' or null",
  "foundingYear": "year or null",
  "linkedinUrl": "LinkedIn URL or null",
  "twitterHandle": "@handle or null",
  "description": "brief company description"
}

Only include fields where you found actual data. Omit fields where no data was found.`
          : `You are a data enrichment specialist. No web data was available for this company. Based on your knowledge, provide your best estimates for this company.

Company: ${lead.companyName}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.city || ''}, ${lead.country || ''}

Return a JSON object with your best estimates:
{
  "employeeCount": "estimated range like '51-200' or null",
  "revenueEstimate": "estimated range like '$10M-$50M' or null",
  "description": "brief company description based on name and industry"
}

Only include fields you can reasonably estimate. Mark uncertain fields as null.`;

        const enrichedData = await callLLMForJSON<Record<string, unknown>>(enrichmentPrompt, 'Extract enrichment data', {});

        // Step 5: Update lead record
        const updateData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(enrichedData)) {
          if (value !== null && value !== undefined && value !== '') {
            updateData[key] = value;
          }
        }
        updateData.stage = 'enriched';
        updateData.enrichedAt = new Date();

        // Mark if this was a fallback enrichment (no web data)
        if (!hasData) {
          updateData.notes = [lead.notes, '[Enriched via LLM estimates — no web data available]'].filter(Boolean).join('\n\n');
        }

        await db.lead.update({
          where: { id: lead.id },
          data: updateData,
        });

        enrichedCount++;
      } catch (leadError) {
        // RESILIENCE: Even if enrichment fails, advance the lead to 'enriched' so pipeline doesn't stall
        console.error(`Failed to enrich lead ${lead.id}:`, leadError);
        try {
          await db.lead.update({
            where: { id: lead.id },
            data: {
              stage: 'enriched',
              enrichedAt: new Date(),
              notes: [lead.notes, '[Enrichment failed — advanced automatically]'].filter(Boolean).join('\n\n'),
            },
          });
          enrichedCount++; // Count it as enriched even though data is sparse
        } catch (fallbackError) {
          console.error(`Failed to fallback-enrich lead ${lead.id}:`, fallbackError);
        }
      }
    }

    // Update campaign counts
    if (campaignId) {
      const enrichedLeadCount = await db.lead.count({ where: { campaignId, stage: 'enriched' } });
      await db.campaign.update({
        where: { id: campaignId },
        data: { leadsQualified: enrichedLeadCount },
      });
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      enriched: enrichedCount,
      totalProcessed: leads.length,
      channels: [...new Set(channelActivity.filter(c => c.success).map(c => c.channel))],
    });

    return {
      success: true,
      output: { enriched: enrichedCount, totalProcessed: leads.length },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * WEB RESEARCH AGENT
 * Uses Agent-Reach channels: web, exa_search, linkedin, twitter, youtube, reddit, rss
 * 
 * Performs deep research on a specific topic, company, or market.
 */
async function executeWebResearch(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input } = ctx;

  const topic = (input.query as string) || (input.description as string) || (input.topic as string) || '';

  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');

    // Multi-channel research using Agent-Reach
    const [exaRes, redditRes, youtubeRes, twitterRes] = await Promise.allSettled([
      exaSearch(topic, 10),
      redditSearch(topic, 5),
      youtubeSearch(topic, 3),
      twitterSearch(topic, 5),
    ]);

    const recordActivity = (result: PromiseSettledResult<ToolResult<unknown>>, channel: string, op: string) => {
      if (result.status === 'fulfilled') {
        channelActivity.push({ channel, operation: op, success: result.value.success, timestamp: result.value.timestamp, resultCount: Array.isArray(result.value.data) ? result.value.data.length : 0 });
      } else {
        channelActivity.push({ channel, operation: op, success: false, timestamp: new Date().toISOString(), error: result.reason?.message });
      }
    };

    recordActivity(exaRes, 'exa_search', 'research_search');
    recordActivity(redditRes, 'reddit', 'research_search');
    recordActivity(youtubeRes, 'youtube', 'video_search');
    recordActivity(twitterRes, 'twitter', 'social_search');

    await updateTaskProgress(ctx.taskId, 50, 'running');

    // Read top results in depth
    const topUrls: string[] = [];
    if (exaRes.status === 'fulfilled' && exaRes.value.success) {
      topUrls.push(...exaRes.value.data.slice(0, 3).map(r => r.url));
    }

    const webReads = await Promise.allSettled(
      topUrls.map(url => webRead(url)),
    );
    
    webReads.forEach((res, i) => {
      recordActivity(res, 'web', `read_${topUrls[i]?.slice(0, 50) || i}`);
    });

    await updateTaskProgress(ctx.taskId, 70, 'running');

    // Compile all research data
    const researchData = {
      searchResults: {
        exa: exaRes.status === 'fulfilled' && exaRes.value.success ? exaRes.value.data : [],
        reddit: redditRes.status === 'fulfilled' && redditRes.value.success ? redditRes.value.data : [],
        youtube: youtubeRes.status === 'fulfilled' && youtubeRes.value.success ? youtubeRes.value.data : [],
        twitter: twitterRes.status === 'fulfilled' && twitterRes.value.success ? twitterRes.value.data : [],
      },
      deepReads: webReads
        .filter((r): r is PromiseFulfilledResult<ToolResult<WebReadResult>> => r.status === 'fulfilled' && r.value.success)
        .map(r => ({ title: r.value.data.title, url: r.value.data.url, content: r.value.data.content?.slice(0, 3000) })),
    };

    // Synthesize with LLM
    const synthesisPrompt = `You are a research analyst. Synthesize the following multi-source research data into a comprehensive intelligence brief.

Topic: "${topic}"

Return a JSON object:
{
  "summary": "Executive summary (2-3 paragraphs)",
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "marketInsights": ["Insight 1", ...],
  "companies": [{"name": "Company", "details": "Relevant details"}],
  "trends": ["Trend 1", ...],
  "recommendations": ["Recommendation 1", ...],
  "sources": [{"title": "Title", "url": "URL", "type": "search|reddit|youtube|twitter|web"}]
}`;

    const analysis = await callLLMForJSON<Record<string, unknown>>(
      synthesisPrompt,
      `Research data:\n${JSON.stringify(researchData).slice(0, 15000)}`,
      { summary: `Research on ${topic}`, keyFindings: [], marketInsights: [], companies: [], trends: [], recommendations: [], sources: [] },
    );

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      researchComplete: true,
      channelsUsed: channelActivity.filter(c => c.success).map(c => c.channel),
      sourceCount: channelActivity.reduce((sum, c) => sum + (c.resultCount || 0), 0),
      analysis,
    });

    return {
      success: true,
      output: { researchComplete: true, analysis },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * LEAD QUALIFICATION AGENT
 * Uses Agent-Reach channels: web, linkedin, exa_search
 * 
 * Scores and qualifies leads based on ICP criteria using enriched data
 * and additional research via Agent-Reach.
 * 
 * Resilience: If no enriched leads exist but there ARE new leads,
 * qualify them directly (skip enrichment requirement as fallback).
 */
async function executeLeadQualification(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input, campaignId } = ctx;

  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');

    // Get enriched leads that need qualification
    let leads = await db.lead.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        stage: 'enriched',
      },
      take: 30,
    });

    // RESILIENCE: If no enriched leads but there are new leads, qualify them directly
    if (leads.length === 0) {
      const newLeads = await db.lead.findMany({
        where: {
          ...(campaignId ? { campaignId } : {}),
          stage: 'new',
        },
        take: 30,
      });
      
      if (newLeads.length > 0) {
        console.warn(`[LeadQualification] No enriched leads found, qualifying ${newLeads.length} new leads directly (fallback)`);
        // First advance them to enriched stage so qualification works
        for (const lead of newLeads) {
          await db.lead.update({
            where: { id: lead.id },
            data: {
              stage: 'enriched',
              enrichedAt: new Date(),
              notes: [lead.notes, '[Auto-advanced to enriched for direct qualification]'].filter(Boolean).join('\n\n'),
            },
          });
        }
        leads = newLeads;
        channelActivity.push({
          channel: 'fallback',
          operation: 'skip_enrichment',
          success: true,
          timestamp: new Date().toISOString(),
          resultCount: newLeads.length,
          error: 'No enriched leads; qualified new leads directly',
        });
      }
    }

    if (leads.length === 0) {
      await updateTaskProgress(ctx.taskId, 100, 'completed', { qualified: 0, message: 'No enriched leads to qualify' });
      return { success: true, output: { qualified: 0 }, channelActivity };
    }

    let qualifiedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const progress = 10 + Math.floor((i / leads.length) * 80);
      await updateTaskProgress(ctx.taskId, progress, 'running');

      try {
        // Search for intent signals via Agent-Reach
        const intentResult = await exaSearch(`${lead.companyName} hiring expanding new office funding 2024 2025`, 3);
        channelActivity.push({
          channel: 'exa_search',
          operation: 'intent_search',
          success: intentResult.success,
          timestamp: new Date().toISOString(),
          resultCount: intentResult.success ? intentResult.data.length : 0,
        });

        // Score the lead using LLM
        const scoringPrompt = `You are a lead qualification specialist. Score this lead based on ICP fit and intent signals.

Lead data:
${JSON.stringify({
  companyName: lead.companyName,
  industry: lead.industry,
  website: lead.website,
  city: lead.city,
  country: lead.country,
  employeeCount: lead.employeeCount,
  revenueEstimate: lead.revenueEstimate,
})}

Intent signals from web search:
${JSON.stringify(intentResult.success ? intentResult.data : [])}

Return a JSON object:
{
  "firmographicScore": 0-100,
  "intentScore": 0-100,
  "reachabilityScore": 0-100,
  "strategicScore": 0-100,
  "dataCompleteness": 0-100,
  "leadScore": 0-100 (composite),
  "leadTier": "hot" | "warm" | "cold",
  "reasoning": "Brief explanation of scoring",
  "keySignals": ["Signal 1", ...],
  "disqualifyReason": null | "Reason if disqualified"
}

Scoring guide:
- Firmographic: Industry fit, company size fit, location match
- Intent: Recent hiring, expansion, funding, tech adoption signals
- Reachability: Email/phone availability, LinkedIn presence
- Strategic: Deal size potential, long-term value
- Data Completeness: How much data is filled in`;

        const scores = await callLLMForJSON<Record<string, unknown>>(scoringPrompt, 'Score this lead', {
          firmographicScore: 30,
          intentScore: 20,
          reachabilityScore: 20,
          strategicScore: 20,
          dataCompleteness: 10,
          leadScore: 25,
          leadTier: 'cold',
          reasoning: 'Scored with defaults due to LLM failure',
          keySignals: [],
        });

        // Update lead with scores
        await db.lead.update({
          where: { id: lead.id },
          data: {
            leadScore: (scores.leadScore as number) || 0,
            leadTier: (scores.leadTier as string) || 'cold',
            firmographicScore: (scores.firmographicScore as number) || 0,
            intentScore: (scores.intentScore as number) || 0,
            reachabilityScore: (scores.reachabilityScore as number) || 0,
            strategicScore: (scores.strategicScore as number) || 0,
            dataCompleteness: (scores.dataCompleteness as number) || 0,
            stage: 'qualified',
            qualifiedAt: new Date(),
            notes: [lead.notes, scores.reasoning as string].filter(Boolean).join('\n\n'),
          },
        });

        qualifiedCount++;
      } catch (leadError) {
        // RESILIENCE: Still qualify with default scores if LLM fails
        console.error(`Failed to qualify lead ${lead.id}:`, leadError);
        try {
          await db.lead.update({
            where: { id: lead.id },
            data: {
              leadScore: 25,
              leadTier: 'cold',
              firmographicScore: 30,
              intentScore: 20,
              reachabilityScore: 20,
              strategicScore: 20,
              dataCompleteness: 10,
              stage: 'qualified',
              qualifiedAt: new Date(),
              notes: [lead.notes, '[Qualified with default scores — LLM scoring failed]'].filter(Boolean).join('\n\n'),
            },
          });
          qualifiedCount++;
        } catch (fallbackError) {
          console.error(`Failed to fallback-qualify lead ${lead.id}:`, fallbackError);
        }
      }
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      qualified: qualifiedCount,
      totalProcessed: leads.length,
      channels: [...new Set(channelActivity.filter(c => c.success).map(c => c.channel))],
    });

    return {
      success: true,
      output: { qualified: qualifiedCount, totalProcessed: leads.length },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * OUTREACH COMPOSER AGENT
 * Uses Agent-Reach channels: linkedin, web, exa_search
 * 
 * Crafts personalized outreach messages using company intelligence
 * gathered from Agent-Reach channels.
 * 
 * Resilience: If no qualified hot/warm leads exist but there ARE
 * qualified cold leads, compose outreach for cold leads too.
 */
async function executeOutreachComposer(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { input, campaignId } = ctx;

  try {
    await updateTaskProgress(ctx.taskId, 10, 'running');

    // Get qualified leads (hot or warm)
    let leads = await db.lead.findMany({
      where: {
        ...(campaignId ? { campaignId } : {}),
        stage: 'qualified',
        leadTier: { in: ['hot', 'warm'] },
      },
      take: 15,
    });

    // RESILIENCE: If no hot/warm leads, include cold leads too
    if (leads.length === 0) {
      const coldLeads = await db.lead.findMany({
        where: {
          ...(campaignId ? { campaignId } : {}),
          stage: 'qualified',
          leadTier: 'cold',
        },
        take: 15,
      });
      
      if (coldLeads.length > 0) {
        console.warn(`[OutreachComposer] No hot/warm leads, composing outreach for ${coldLeads.length} cold leads (fallback)`);
        leads = coldLeads;
        channelActivity.push({
          channel: 'fallback',
          operation: 'include_cold_leads',
          success: true,
          timestamp: new Date().toISOString(),
          resultCount: coldLeads.length,
          error: 'No hot/warm leads; composing for cold leads',
        });
      }
    }

    if (leads.length === 0) {
      await updateTaskProgress(ctx.taskId, 100, 'completed', { composed: 0, message: 'No qualified leads for outreach' });
      return { success: true, output: { composed: 0 }, channelActivity };
    }

    let composedCount = 0;

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const progress = 10 + Math.floor((i / leads.length) * 80);
      await updateTaskProgress(ctx.taskId, progress, 'running');

      try {
        // Research the company for personalization via Agent-Reach
        const companyResearch = await exaSearch(`${lead.companyName} challenges pain points news 2025`, 3);
        channelActivity.push({
          channel: 'exa_search',
          operation: 'personalization_research',
          success: companyResearch.success,
          timestamp: new Date().toISOString(),
          resultCount: companyResearch.success ? companyResearch.data.length : 0,
        });

        // Read company website for hooks (Agent-Reach)
        let websiteIntel = '';
        if (lead.website) {
          const webResult = await webRead(lead.website);
          channelActivity.push({
            channel: 'web',
            operation: 'read_company_site',
            success: webResult.success,
            timestamp: new Date().toISOString(),
          });
          if (webResult.success) {
            websiteIntel = webResult.data.content?.slice(0, 5000) || '';
          }
        }

        // Compose outreach via LLM
        const composePrompt = `You are an outreach specialist. Compose a personalized cold email for this lead.

Lead data:
${JSON.stringify({
  companyName: lead.companyName,
  industry: lead.industry,
  keyContactName: lead.keyContactName,
  keyContactTitle: lead.keyContactTitle,
  city: lead.city,
  country: lead.country,
  website: lead.website,
  notes: lead.notes,
  leadTier: lead.leadTier,
})}

Company intelligence:
- Web research: ${JSON.stringify(companyResearch.success ? companyResearch.data.slice(0, 2) : [])}
- Website analysis: ${websiteIntel.slice(0, 3000) || 'No website data'}

Return JSON:
{
  "subject": "Compelling subject line (under 50 chars)",
  "body": "Email body (150-250 words, professional but conversational, reference specific company details)",
  "tone": "strategic | balanced | practical",
  "cta": "Clear next step",
  "personalizationHooks": ["Hook 1", "Hook 2"],
  "channel": "email",
  "type": "cold_email"
}

Rules:
- Reference specific details about the company (not generic)
- Focus on their challenges, not your features
- Keep it concise and value-driven
- Include a clear, low-friction CTA
- No spam trigger words or excessive caps`;

        const message = await callLLMForJSON<Record<string, unknown>>(composePrompt, 'Compose outreach message', {
          subject: `Re: ${lead.companyName} partnership`,
          body: `Hi,\n\nI came across ${lead.companyName} and was impressed by your work in ${lead.industry || 'your industry'}. I'd love to explore how we might be able to help your team.\n\nWould you be open to a brief call this week?\n\nBest regards`,
          tone: 'balanced',
          cta: 'Schedule a brief call',
          personalizationHooks: [],
          channel: 'email',
          type: 'cold_email',
        });

        // Create outreach record
        await db.outreach.create({
          data: {
            leadId: lead.id,
            channel: (message.channel as string) || 'email',
            type: (message.type as string) || 'cold_email',
            subject: (message.subject as string) || null,
            body: (message.body as string) || '',
            status: 'draft',
          },
        });

        // Update lead stage
        await db.lead.update({
          where: { id: lead.id },
          data: { stage: 'contacted', contactedAt: new Date() },
        });

        composedCount++;
      } catch (leadError) {
        console.error(`Failed to compose outreach for lead ${lead.id}:`, leadError);
      }
    }

    if (campaignId) {
      const contactedCount = await db.lead.count({ where: { campaignId, stage: 'contacted' } });
      await db.campaign.update({
        where: { id: campaignId },
        data: { leadsContacted: contactedCount },
      });
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      composed: composedCount,
      totalProcessed: leads.length,
      channels: [...new Set(channelActivity.filter(c => c.success).map(c => c.channel))],
    });

    return {
      success: true,
      output: { composed: composedCount, totalProcessed: leads.length },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * PIPELINE MANAGER AGENT
 * No direct Agent-Reach channel access — operates on database records.
 * Manages lead stages, follow-ups, and pipeline health.
 */
async function executePipelineManager(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { campaignId } = ctx;

  try {
    await updateTaskProgress(ctx.taskId, 20, 'running');

    // Get all leads for the campaign
    const leads = await db.lead.findMany({
      where: campaignId ? { campaignId } : {},
      include: { outreach: true },
    });

    // Calculate pipeline metrics
    const stageCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    
    for (const lead of leads) {
      stageCounts[lead.stage] = (stageCounts[lead.stage] || 0) + 1;
      tierCounts[lead.leadTier] = (tierCounts[lead.leadTier] || 0) + 1;
    }

    // Identify leads needing follow-up
    const now = new Date();
    const leadsNeedingFollowUp = leads.filter(lead => {
      if (lead.stage === 'contacted' && lead.lastContactDate) {
        const daysSinceContact = (now.getTime() - new Date(lead.lastContactDate).getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceContact > 3;
      }
      return lead.stage === 'contacted' && !lead.lastContactDate;
    });

    // Schedule follow-ups
    for (const lead of leadsNeedingFollowUp.slice(0, 10)) {
      await db.lead.update({
        where: { id: lead.id },
        data: {
          nextFollowUp: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        },
      });
    }

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      totalLeads: leads.length,
      stageCounts,
      tierCounts,
      followUpsScheduled: leadsNeedingFollowUp.length,
    });

    return {
      success: true,
      output: { stageCounts, tierCounts, followUpsScheduled: leadsNeedingFollowUp.length },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

/**
 * REPORT GENERATOR AGENT
 * No direct Agent-Reach channel access — operates on collected data.
 * Generates analytics reports and campaign insights.
 */
async function executeReportGenerator(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
  const channelActivity: ChannelActivityRecord[] = [];
  const { campaignId } = ctx;

  try {
    await updateTaskProgress(ctx.taskId, 20, 'running');

    // Gather campaign data
    const campaigns = campaignId
      ? await db.campaign.findMany({ where: { id: campaignId } })
      : await db.campaign.findMany();

    const reportData: Array<{
      campaign: { id: string; name: string; status: string };
      leads: { total: number; byStage: Record<string, number>; byTier: Record<string, number> };
      outreach: { total: number; byStatus: Record<string, number> };
      avgLeadScore: number;
    }> = [];

    for (const campaign of campaigns) {
      const leads = await db.lead.findMany({ where: { campaignId: campaign.id } });
      const outreach = await db.outreach.findMany({
        where: { lead: { campaignId: campaign.id } },
      });

      const stageCounts: Record<string, number> = {};
      const tierCounts: Record<string, number> = {};
      
      for (const lead of leads) {
        stageCounts[lead.stage] = (stageCounts[lead.stage] || 0) + 1;
        tierCounts[lead.leadTier] = (tierCounts[lead.leadTier] || 0) + 1;
      }

      reportData.push({
        campaign: { id: campaign.id, name: campaign.name, status: campaign.status },
        leads: { total: leads.length, byStage: stageCounts, byTier: tierCounts },
        outreach: { total: outreach.length, byStatus: outreach.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string, number>) },
        avgLeadScore: leads.length > 0 ? Math.round(leads.reduce((sum, l) => sum + l.leadScore, 0) / leads.length) : 0,
      });
    }

    await updateTaskProgress(ctx.taskId, 70, 'running');

    // Generate insights using LLM
    const insightsPrompt = `You are a sales analytics expert. Analyze the following campaign data and provide insights.

Campaign data:
${JSON.stringify(reportData)}

Return JSON:
{
  "summary": "Overall campaign performance summary",
  "keyMetrics": ["Metric 1: Value", ...],
  "insights": ["Insight 1", ...],
  "recommendations": ["Recommendation 1", ...],
  "conversionRates": {"stage1_to_stage2": "X%", ...}
}`;

    const insights = await callLLMForJSON<Record<string, unknown>>(insightsPrompt, 'Analyze campaign data', {
      summary: 'Report generated with limited data',
      keyMetrics: [],
      insights: [],
      recommendations: [],
      conversionRates: {},
    });

    await updateTaskProgress(ctx.taskId, 100, 'completed', {
      campaignsAnalyzed: reportData.length,
      insights,
    });

    return {
      success: true,
      output: { campaignsAnalyzed: reportData.length, insights },
      channelActivity,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    await updateTaskProgress(ctx.taskId, 0, 'failed');
    return { success: false, output: { error: msg }, channelActivity, error: msg };
  }
}

// ============================================================
// Full Pipeline Execution
// ============================================================

/**
 * Run the COMPLETE lead generation pipeline end-to-end:
 * 1. Prospect Discovery → find leads
 * 2. Data Enrichment → enrich found leads
 * 3. Lead Qualification → score and tier leads
 * 4. Outreach Composer → craft personalized messages
 * 
 * Each stage continues even if the previous one partially fails.
 * The campaignId from each stage carries forward.
 */
export async function runFullPipeline(
  query: string,
  industry?: string,
  location?: string,
  campaignId?: string,
): Promise<FullPipelineResult> {
  const errors: string[] = [];
  let pipelineCampaignId = campaignId || null;

  // Create a campaign if one doesn't exist
  if (!pipelineCampaignId) {
    try {
      const campaign = await db.campaign.create({
        data: {
          name: `${industry || 'Lead'} Campaign - ${location || 'Global'}`,
          targetIndustry: industry || null,
          targetLocation: location || null,
          status: 'active',
        },
      });
      pipelineCampaignId = campaign.id;
    } catch (dbError) {
      errors.push(`Failed to create campaign: ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
    }
  }

  // Stage 1: Prospect Discovery
  let discoveryResult: AgentExecutionResult | null = null;
  try {
    const discoveryTask = await db.agentTask.create({
      data: {
        campaignId: pipelineCampaignId,
        agentName: 'prospect-discovery',
        taskType: 'search',
        status: 'pending',
        priority: 10,
        input: JSON.stringify({ query, industry, location, description: query, campaignId: pipelineCampaignId }),
      },
    });
    const ctx: AgentExecutionContext = {
      taskId: discoveryTask.id,
      agentName: 'prospect-discovery',
      taskType: 'search',
      campaignId: pipelineCampaignId,
      input: { query, industry, location, description: query, campaignId: pipelineCampaignId },
      priority: 10,
    };
    await db.agentTask.update({ where: { id: discoveryTask.id }, data: { status: 'running', startedAt: new Date(), progress: 5 } });
    discoveryResult = await executeProspectDiscovery(ctx);
    await db.agentTask.update({
      where: { id: discoveryTask.id },
      data: {
        status: discoveryResult.success ? 'completed' : 'failed',
        output: JSON.stringify(discoveryResult.output),
        error: discoveryResult.error || null,
        completedAt: new Date(),
        progress: discoveryResult.success ? 100 : 0,
      },
    });
    if (!discoveryResult.success && discoveryResult.error) {
      errors.push(`Discovery: ${discoveryResult.error}`);
    }
  } catch (error) {
    errors.push(`Discovery failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Stage 2: Data Enrichment
  let enrichmentResult: AgentExecutionResult | null = null;
  try {
    const enrichmentTask = await db.agentTask.create({
      data: {
        campaignId: pipelineCampaignId,
        agentName: 'data-enrichment',
        taskType: 'enrich',
        status: 'pending',
        priority: 9,
        input: JSON.stringify({ campaignId: pipelineCampaignId, description: 'Enrich discovered leads' }),
      },
    });
    const ctx: AgentExecutionContext = {
      taskId: enrichmentTask.id,
      agentName: 'data-enrichment',
      taskType: 'enrich',
      campaignId: pipelineCampaignId,
      input: { campaignId: pipelineCampaignId, description: 'Enrich discovered leads' },
      priority: 9,
    };
    await db.agentTask.update({ where: { id: enrichmentTask.id }, data: { status: 'running', startedAt: new Date(), progress: 5 } });
    enrichmentResult = await executeDataEnrichment(ctx);
    await db.agentTask.update({
      where: { id: enrichmentTask.id },
      data: {
        status: enrichmentResult.success ? 'completed' : 'failed',
        output: JSON.stringify(enrichmentResult.output),
        error: enrichmentResult.error || null,
        completedAt: new Date(),
        progress: enrichmentResult.success ? 100 : 0,
      },
    });
    if (!enrichmentResult.success && enrichmentResult.error) {
      errors.push(`Enrichment: ${enrichmentResult.error}`);
    }
  } catch (error) {
    errors.push(`Enrichment failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Stage 3: Lead Qualification
  let qualificationResult: AgentExecutionResult | null = null;
  try {
    const qualificationTask = await db.agentTask.create({
      data: {
        campaignId: pipelineCampaignId,
        agentName: 'lead-qualification',
        taskType: 'qualify',
        status: 'pending',
        priority: 8,
        input: JSON.stringify({ campaignId: pipelineCampaignId, description: 'Qualify enriched leads' }),
      },
    });
    const ctx: AgentExecutionContext = {
      taskId: qualificationTask.id,
      agentName: 'lead-qualification',
      taskType: 'qualify',
      campaignId: pipelineCampaignId,
      input: { campaignId: pipelineCampaignId, description: 'Qualify enriched leads' },
      priority: 8,
    };
    await db.agentTask.update({ where: { id: qualificationTask.id }, data: { status: 'running', startedAt: new Date(), progress: 5 } });
    qualificationResult = await executeLeadQualification(ctx);
    await db.agentTask.update({
      where: { id: qualificationTask.id },
      data: {
        status: qualificationResult.success ? 'completed' : 'failed',
        output: JSON.stringify(qualificationResult.output),
        error: qualificationResult.error || null,
        completedAt: new Date(),
        progress: qualificationResult.success ? 100 : 0,
      },
    });
    if (!qualificationResult.success && qualificationResult.error) {
      errors.push(`Qualification: ${qualificationResult.error}`);
    }
  } catch (error) {
    errors.push(`Qualification failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Stage 4: Outreach Composer
  let outreachResult: AgentExecutionResult | null = null;
  try {
    const outreachTask = await db.agentTask.create({
      data: {
        campaignId: pipelineCampaignId,
        agentName: 'outreach-composer',
        taskType: 'outreach',
        status: 'pending',
        priority: 7,
        input: JSON.stringify({ campaignId: pipelineCampaignId, description: 'Compose outreach for qualified leads' }),
      },
    });
    const ctx: AgentExecutionContext = {
      taskId: outreachTask.id,
      agentName: 'outreach-composer',
      taskType: 'outreach',
      campaignId: pipelineCampaignId,
      input: { campaignId: pipelineCampaignId, description: 'Compose outreach for qualified leads' },
      priority: 7,
    };
    await db.agentTask.update({ where: { id: outreachTask.id }, data: { status: 'running', startedAt: new Date(), progress: 5 } });
    outreachResult = await executeOutreachComposer(ctx);
    await db.agentTask.update({
      where: { id: outreachTask.id },
      data: {
        status: outreachResult.success ? 'completed' : 'failed',
        output: JSON.stringify(outreachResult.output),
        error: outreachResult.error || null,
        completedAt: new Date(),
        progress: outreachResult.success ? 100 : 0,
      },
    });
    if (!outreachResult.success && outreachResult.error) {
      errors.push(`Outreach: ${outreachResult.error}`);
    }
  } catch (error) {
    errors.push(`Outreach failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  // Gather summary statistics
  let leadsFound = 0;
  let leadsEnriched = 0;
  let leadsQualified = 0;
  let leadsContacted = 0;
  let hotLeads = 0;
  let warmLeads = 0;
  let coldLeads = 0;

  if (pipelineCampaignId) {
    try {
      const allLeads = await db.lead.findMany({ where: { campaignId: pipelineCampaignId } });
      leadsFound = allLeads.filter(l => l.stage !== 'new' || l.createdAt).length;
      leadsEnriched = allLeads.filter(l => ['enriched', 'qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
      leadsQualified = allLeads.filter(l => ['qualified', 'contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
      leadsContacted = allLeads.filter(l => ['contacted', 'engaged', 'negotiating', 'closed_won'].includes(l.stage)).length;
      hotLeads = allLeads.filter(l => l.leadTier === 'hot').length;
      warmLeads = allLeads.filter(l => l.leadTier === 'warm').length;
      coldLeads = allLeads.filter(l => l.leadTier === 'cold').length;
    } catch (dbError) {
      errors.push(`Failed to gather summary: ${dbError instanceof Error ? dbError.message : 'Unknown'}`);
    }
  }

  return {
    success: errors.length === 0 || (discoveryResult?.success === true),
    campaignId: pipelineCampaignId,
    discovery: discoveryResult,
    enrichment: enrichmentResult,
    qualification: qualificationResult,
    outreach: outreachResult,
    summary: {
      leadsFound,
      leadsEnriched,
      leadsQualified,
      leadsContacted,
      hotLeads,
      warmLeads,
      coldLeads,
      errors,
    },
  };
}

// ============================================================
// Main Execution Dispatcher
// ============================================================

const AGENT_HANDLERS: Record<AgentName, (ctx: AgentExecutionContext) => Promise<AgentExecutionResult>> = {
  'orchestrator': executeOrchestrator,
  'prospect-discovery': executeProspectDiscovery,
  'data-enrichment': executeDataEnrichment,
  'web-research': executeWebResearch,
  'lead-qualification': executeLeadQualification,
  'outreach-composer': executeOutreachComposer,
  'pipeline-manager': executePipelineManager,
  'report-generator': executeReportGenerator,
};

/**
 * Execute a single agent task.
 * This is the main entry point for the Agent Execution Engine.
 * 
 * Flow:
 * 1. Load task from database
 * 2. Parse input
 * 3. Dispatch to the correct agent handler
 * 4. Agent handler calls Agent-Reach tools + LLM
 * 5. Results stored back in database
 * 
 * Returns the execution result with channel activity logs.
 */
export async function executeTask(taskId: string): Promise<AgentExecutionResult> {
  console.log(`[Agent Executor] Starting task ${taskId}`);

  // Load task from database
  const task = await db.agentTask.findUnique({ where: { id: taskId } });
  if (!task) {
    return { success: false, output: { error: 'Task not found' }, channelActivity: [], error: 'Task not found' };
  }

  if (task.status !== 'pending' && task.status !== 'running') {
    return { success: false, output: { error: `Task already ${task.status}` }, channelActivity: [], error: `Task already ${task.status}` };
  }

  // Mark as running
  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date(), progress: 5 },
  });

  // Parse input
  let parsedInput: Record<string, unknown> = {};
  try {
    parsedInput = task.input ? JSON.parse(task.input) : {};
  } catch {
    parsedInput = { rawInput: task.input };
  }

  // Build execution context
  const ctx: AgentExecutionContext = {
    taskId,
    agentName: task.agentName as AgentName,
    taskType: task.taskType,
    campaignId: task.campaignId,
    input: parsedInput,
    priority: task.priority,
  };

  // Dispatch to agent handler
  const handler = AGENT_HANDLERS[ctx.agentName];
  if (!handler) {
    await db.agentTask.update({
      where: { id: taskId },
      data: { status: 'failed', error: `Unknown agent: ${ctx.agentName}`, progress: 0 },
    });
    return { success: false, output: { error: `Unknown agent: ${ctx.agentName}` }, channelActivity: [], error: `Unknown agent: ${ctx.agentName}` };
  }

  // Execute!
  const result = await handler(ctx);

  // Update final status
  await db.agentTask.update({
    where: { id: taskId },
    data: {
      status: result.success ? 'completed' : 'failed',
      output: JSON.stringify(result.output),
      error: result.error || null,
      completedAt: new Date(),
      progress: result.success ? 100 : 0,
    },
  });

  console.log(`[Agent Executor] Task ${taskId} ${result.success ? 'completed' : 'failed'}. Channels used: ${result.channelActivity.filter(c => c.success).map(c => c.channel).join(', ') || 'none'}`);

  return result;
}

/**
 * Execute all pending tasks in priority order.
 * Processes tasks one at a time (sequential execution to avoid rate limits).
 */
export async function executeAllPendingTasks(): Promise<{
  total: number;
  completed: number;
  failed: number;
  results: Array<{ taskId: string; agentName: string; success: boolean }>;
}> {
  const pendingTasks = await db.agentTask.findMany({
    where: { status: 'pending' },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: 50,
  });

  let completed = 0;
  let failed = 0;
  const results: Array<{ taskId: string; agentName: string; success: boolean }> = [];

  for (const task of pendingTasks) {
    const result = await executeTask(task.id);
    if (result.success) {
      completed++;
    } else {
      failed++;
    }
    results.push({ taskId: task.id, agentName: task.agentName, success: result.success });
  }

  return { total: pendingTasks.length, completed, failed, results };
}

/**
 * Quick-dispatch: Create a task and immediately execute it.
 * Used by the AI chat endpoint for real-time agent execution.
 */
export async function dispatchAndExecute(
  agentName: AgentName,
  taskType: string,
  input: Record<string, unknown>,
  campaignId?: string,
  priority = 5,
): Promise<AgentExecutionResult> {
  // Create the task
  const task = await db.agentTask.create({
    data: {
      agentName,
      taskType,
      campaignId: campaignId || null,
      priority,
      input: JSON.stringify(input),
      status: 'pending',
    },
  });

  // Execute immediately
  return executeTask(task.id);
}
