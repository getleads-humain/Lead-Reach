// ============================================================
// SSE Streaming Endpoint for Campaign Pipeline
// =============================================
// Wires the 8-Agent Orchestrator (Atlas→Scout→Forge→Sage→Judge→Bard→Flow→Echo)
// to a Campaign. When invoked, this endpoint:
//
//   1. Builds a discovery query from the campaign's fields
//      (name + description + targetIndustry + targetLocation + targetCompanySize)
//   2. Phase 1 - DISCOVERY: Calls directDuckDuckGoSearch to find ~10 candidates
//      and saves each as a basic Lead (stage='new', leadScore=0)
//   3. Phase 2 - ENRICHMENT: For the top 3 candidates, calls
//      processWithOrchestrator with the candidate URL to fully enrich
//      (industry, employees, contact info, etc.) and updates the Lead row
//   4. Emits all orchestrator events via SSE so the client can show
//      real-time pipeline progress
//
// This endpoint REPLACES the legacy detached pipeline-worker.ts that
// used a simpler 4-stage pipeline with hardcoded fallbacks. The 8-agent
// orchestrator is the same one used by /api/prospect-discovery/stream
// and is the reliable path that was fixed in earlier sessions.
// ============================================================

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { processWithOrchestrator } from '@/lib/prospect-agent/orchestrator';
import type { OrchestratorEvent } from '@/lib/prospect-agent/orchestrator-types';
import { directDuckDuckGoSearch, type SearchResult } from '@/lib/direct-search';
import {
  onLeadsDiscovered,
  onLeadEnriched,
  onLeadScored,
  onPipelineComplete,
} from '@/lib/workforce/bridge';
import { discoverBusinesses, webRead } from '@/lib/agent-reach-bridge';
import { callLLMForJSON } from '@/lib/llm';

export const maxDuration = 300;

// ── Types ──────────────────────────────────────────────────────────

interface CampaignRow {
  id: string;
  name: string;
  description: string | null;
  targetIndustry: string | null;
  targetLocation: string | null;
  targetCompanySize: string | null;
  status: string;
}

interface LeadRow {
  id: string;
  companyName: string;
  website: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Build a natural-language discovery query from campaign fields.
 * Examples:
 *   - "DragonFruit Suppliers in Vietnam" (from name only)
 *   - "Agriculture companies in Vietnam — DragonFruit Suppliers" (combined)
 *   - "Software companies in San Francisco with 50-200 employees"
 */
function buildDiscoveryQuery(campaign: CampaignRow): string {
  const parts: string[] = [];

  // Use the campaign name as the primary search intent
  parts.push(campaign.name);

  // Add industry/location/size as context if not already in name
  const name = campaign.name.toLowerCase();
  if (campaign.targetIndustry && !name.includes(campaign.targetIndustry.toLowerCase())) {
    parts.push(`(${campaign.targetIndustry})`);
  }
  if (campaign.targetLocation && !name.includes(campaign.targetLocation.toLowerCase())) {
    parts.push(`in ${campaign.targetLocation}`);
  }
  if (campaign.targetCompanySize && !name.toLowerCase().includes('employee') && !name.toLowerCase().includes('size')) {
    parts.push(`(${campaign.targetCompanySize})`);
  }

  // Description adds extra context if present
  if (campaign.description && campaign.description.length > 10) {
    parts.push(`— ${campaign.description.slice(0, 200)}`);
  }

  return parts.join(' ').trim();
}

/**
 * Generate query variations to find MORE leads that the primary query missed.
 * Uses synonyms, different phrasings, and directory-style queries.
 */
function generateQueryVariations(primaryQuery: string, campaign: CampaignRow): string[] {
  const variations: string[] = [];
  const name = campaign.name;

  // Variation 1: "list of" + name (find directory/listicle pages)
  variations.push(`list of ${name}`);

  // Variation 2: "top" + name (find ranking pages)
  variations.push(`top ${name}`);

  // Variation 3: "best" + name (find recommendation pages)
  variations.push(`best ${name} companies`);

  // Variation 4: name + "directory" or "database"
  variations.push(`${name} directory`);

  // Variation 5: If industry is known, try industry + "companies"
  if (campaign.targetIndustry) {
    variations.push(`${campaign.targetIndustry} companies${campaign.targetLocation ? ` in ${campaign.targetLocation}` : ''}`);
  }

  // Variation 6: If location is known, try name + location
  if (campaign.targetLocation) {
    variations.push(`${name} ${campaign.targetLocation}`);
  }

  // Variation 7: name + "near me" (local SEO)
  if (campaign.targetLocation) {
    variations.push(`${name} near ${campaign.targetLocation}`);
  }

  // Deduplicate and return
  return [...new Set(variations)].slice(0, 4);
}

/**
 * Save a search result as a basic Lead row.
 * Returns the Lead row + whether it was newly created (vs. an existing dedupe hit).
 *
 * DIRECTORY/LISTICLE FILTER: search queries like "top N fintech startups"
 * surface ranking pages (fintechnews.sg, startupblink.com, f6s.com, …) rather
 * than actual companies. Those are SOURCE pages, not leads — saving them as
 * leads pollutes the pipeline (enrichment would "research" a magazine article).
 * We skip results whose title/domain look like a directory page and only keep
 * results that look like an individual company.
 */
const DIRECTORY_DOMAIN_PATTERNS = [
  /(^|\.)(f6s|crunchbase|startupblink|clutch\.co|g2|capterra|producthunt|producthunt\.com|angel|angellist|wellfound|linkedin|facebook|twitter|x\.com|instagram|youtube|medium|substack|reddit|quora|glassdoor|indeed|zoominfo|apollo\.io|rocketreach|bloomberg|reuters|prnewswire|businesswire|globenewswire)\./i,
  /(^|\.)(techinasia|fintechnews|e27|vir|techcrunch|venturebeat|techround|techspot|innreg|growthonomics|consultancy\.[a-z]{2,})\./i,
  /(^|\.)(forbes|cnbc|businesstimes|straitstimes|finextra|americanbanker|paymentsdive|bankingdive|fintechmagazine|thebanker|eu-startups|siliconcanals|sifted)\./i,
  // Subdomain/slug signals: blog.x.com, news.y.com, x.com/blog/…, x.com/top-10-…
  /^(blog|news|magazine|insights|press|media|list|directory|compare|reviews?|resources?|guides?)\./i,
  /\/(blog|news|magazine|insights|lists?|directory|compare|comparison|resources?|guides?)\//i,
];
const LISTICLE_TITLE_PATTERNS = [
  /\b(top|best|leading)\s+\d+\b/i,                                  // "Top 10 …", "Best 20 …"
  /\b\d+\s+(top|best|leading|most)\b/i,                             // "100 Top …", "10 Best …"
  /\b\d+\s+(b2b|b2c|crm|fintech|saas|hr|marketing|sales|ai)\b/i,            // "10 B2B CRM …" (numbered list)
  /\b(top|best|leading)\b[^|]{0,80}\b(companies|startups|software|tools|platforms|vendors|agencies|apps|solutions|systems|services|consulting|firms)\b/i,
  /\b(list of|directory|ranking|compared|comparison|alternatives|feature comparison|reviews and|pricing and)\b/i,
  /\b\d{4}\b\s*(reviews|comparison|guide|list|edition)/i,           // "2026 Reviews …"
  /[-–—|]\s*(updated|october|november|december|january|february|march|april|may|june|july|august|september)?\s*202[4-9]\s*[-–—|)]?\s*(\||$)/i,
];

function isDirectoryResult(title: string, url: string): boolean {
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    host = url.toLowerCase();
  }
  if (DIRECTORY_DOMAIN_PATTERNS.some((re) => re.test(host))) return true;
  if (LISTICLE_TITLE_PATTERNS.some((re) => re.test(title))) return true;
  return false;
}

/**
 * Save an explicit company (name + website) as a Lead row.
 * Used by BOTH direct search results and listicle mining.
 */
async function upsertCompanyAsLead(
  campaignId: string,
  company: { companyName: string; website: string; snippet?: string; sourceUrl?: string },
): Promise<{ lead: LeadRow; isNew: boolean } | null> {
  let website: string | null = company.website;
  try {
    website = new URL(company.website).origin;
  } catch {
    // keep as-is
  }

  try {
    const existing = await db.lead.findFirst({
      where: { campaignId, website },
      select: { id: true, companyName: true, website: true },
    });
    if (existing) return { lead: existing, isNew: false };

    const lead = await db.lead.create({
      data: {
        campaignId,
        companyName: company.companyName.slice(0, 200),
        website,
        industry: (company as { industry?: string }).industry || null,
        stage: 'new',
        leadScore: 0,
        leadTier: 'cold',
        dataCompleteness: 5, // minimal — just a name + website
        sources: JSON.stringify([company.sourceUrl || website]),
        notes: `Discovered via ${company.sourceUrl ? `listicle mining (${company.sourceUrl.slice(0, 80)})` : 'search'}: ${(company.snippet || '').slice(0, 250)}`,
        discoveredAt: new Date(),
      },
      select: { id: true, companyName: true, website: true },
    });

    return { lead, isNew: true };
  } catch (err) {
    console.error('[CampaignStream] Failed to save company as lead:', err);
    return null;
  }
}

async function saveCandidateAsLead(
  campaignId: string,
  result: SearchResult,
): Promise<{ lead: LeadRow; isNew: boolean } | null> {
  // Derive a company name from the search result title
  // (strip common suffixes like " - Homepage" or " | LinkedIn")
  let companyName = result.title
    .replace(/\s*[\|\-–—]\s*(Homepage|Official Site|Home|LinkedIn|Facebook|Twitter|Crunchbase).*$/i, '')
    .replace(/\s+(homepage|official site|home)$/i, '')
    .trim();
  if (!companyName) {
    try {
      companyName = new URL(result.url).hostname.replace(/^www\./, '');
    } catch {
      companyName = result.title.slice(0, 80) || 'Unknown Company';
    }
  }

  // Normalize website to origin (https://example.com)
  let website: string | null = null;
  try {
    const u = new URL(result.url);
    website = u.origin;
  } catch {
    website = result.url;
  }

  // Skip directory/listicle pages — they are sources, not companies.
  // (They are mined for real companies later via mineCompaniesFromListicle.)
  if (isDirectoryResult(result.title, result.url)) {
    console.log(`[CampaignStream] Skipped directory/listicle result: ${result.title.slice(0, 60)}`);
    return null;
  }

  return upsertCompanyAsLead(campaignId, {
    companyName,
    website: website || result.url,
    snippet: result.snippet,
    sourceUrl: result.url,
  });
}

/**
 * MINE LISTICLES FOR REAL COMPANIES.
 * "Top N" articles dominate search results for B2B queries. Instead of saving
 * the article AS a lead (wrong) or discarding it (wasteful), we read the page
 * and use the LLM to extract the actual companies being listed — turning the
 * directory page into a rich source of qualified candidates.
 */
interface MinedCompany {
  companyName: string;
  website: string;
  description?: string;
}

async function mineCompaniesFromListicle(
  listicleUrl: string,
  industryHint: string,
): Promise<MinedCompany[]> {
  try {
    const read = await webRead(listicleUrl, 'text');
    if (!read.success || !read.data?.content) {
      console.log(`[CampaignStream] Listicle read failed for ${listicleUrl.slice(0, 60)}`);
      return [];
    }
    const content = String(read.data.content).slice(0, 12000);
    const companies = await callLLMForJSON<MinedCompany[]>(
      'You extract real B2B company leads from "top N" listicle articles. Return ONLY a valid JSON array — no commentary.',
      `From the following listicle article, extract up to 10 REAL companies being listed (NOT the publisher, NOT directories, NOT the article's own site). For each company provide its official website domain (e.g. "https://mailchimp.com") and a one-line description of what it does${industryHint ? `. The target industry is: ${industryHint}` : ''}.\n\nArticle content:\n${content}\n\nReturn a JSON array like: [{"companyName": "...", "website": "https://...", "description": "..."}]`,
      { temperature: 0.2 },
    );
    if (!Array.isArray(companies)) return [];
    return companies
      .filter((c) => c && typeof c.companyName === 'string' && typeof c.website === 'string' && /^https?:\/\//.test(c.website))
      .slice(0, 10);
  } catch (err) {
    console.warn('[CampaignStream] Listicle mining failed:', err instanceof Error ? err.message.slice(0, 100) : err);
    return [];
  }
}

// ── AgentTask stage tracking ──────────────────────────────────────────────
// The campaign UI (pipeline-execution-view) polls /api/campaigns/[id]/pipeline-status,
// which derives per-stage progress from AgentTask rows. The SSE stream below
// drives the real work, so we mirror each phase into AgentTask rows here.
async function startStageTask(
  campaignId: string,
  agentName: string,
  taskType: string,
  input: Record<string, unknown>,
): Promise<void> {
  try {
    await db.agentTask.create({
      data: {
        campaignId,
        agentName,
        taskType,
        status: 'running',
        progress: 5,
        input: JSON.stringify(input),
        startedAt: new Date(),
      },
    });
  } catch (err) {
    console.warn(`[CampaignStream] Failed to create ${agentName} task:`, err);
  }
}

async function updateStageProgress(
  campaignId: string,
  agentName: string,
  progress: number,
): Promise<void> {
  try {
    await db.agentTask.updateMany({
      where: { campaignId, agentName, status: 'running' },
      data: { progress: Math.max(0, Math.min(100, Math.round(progress))) },
    });
  } catch {
    // non-fatal
  }
}

async function completeStageTask(
  campaignId: string,
  agentName: string,
  output: Record<string, unknown>,
  failed = false,
): Promise<void> {
  try {
    await db.agentTask.updateMany({
      where: { campaignId, agentName, status: 'running' },
      data: {
        status: failed ? 'failed' : 'completed',
        progress: failed ? undefined : 100,
        output: JSON.stringify(output),
        completedAt: new Date(),
      },
    });
  } catch (err) {
    console.warn(`[CampaignStream] Failed to complete ${agentName} task:`, err);
  }
}

/**
 * Convert a ProspectResult from the orchestrator into Lead field updates.
 * Mirrors the type-coercion logic in /api/prospect-discovery/convert.
 */
function prospectToLeadUpdates(prospect: Record<string, unknown>): Record<string, unknown> {
  const str = (v: unknown): string | null => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'string') return v.trim() || null;
    if (typeof v === 'number') return String(v);
    if (typeof v === 'boolean') return String(v);
    if (Array.isArray(v)) return v.length > 0 ? v.join(', ') : null;
    return String(v);
  };
  const intOr0 = (v: unknown): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'number') return Math.round(v) || 0;
    if (typeof v === 'string') {
      const n = parseInt(v, 10);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };
  const jsonArr = (v: unknown): string | null => {
    if (Array.isArray(v)) return v.length > 0 ? JSON.stringify(v) : null;
    if (typeof v === 'string' && v.trim()) {
      try {
        const p = JSON.parse(v);
        if (Array.isArray(p)) return p.length > 0 ? JSON.stringify(p) : null;
      } catch {}
      const items = v.split(',').map(s => s.trim()).filter(Boolean);
      return items.length > 0 ? JSON.stringify(items) : null;
    }
    return null;
  };

  const completeness = intOr0(prospect.dataCompleteness);

  return {
    legalName: str(prospect.legalName),
    industry: str(prospect.industry),
    subIndustry: str(prospect.subIndustry),
    hqAddress: str(prospect.hqAddress),
    city: str(prospect.city),
    stateProvince: str(prospect.stateProvince),
    country: str(prospect.country),
    postalCode: str(prospect.postalCode),
    phoneMain: str(prospect.phoneMain),
    generalEmail: str(prospect.generalEmail),
    supportEmail: str(prospect.supportEmail),
    ceoName: str(prospect.ceoName),
    ceoEmail: str(prospect.ceoEmail),
    keyContactName: str(prospect.keyContactName) || str(prospect.personName),
    keyContactTitle: str(prospect.keyContactTitle) || str(prospect.personTitle),
    keyContactEmail: str(prospect.keyContactEmail) || str(prospect.personEmail),
    employeeCount: str(prospect.employeeCount),
    revenueEstimate: str(prospect.revenueEstimate),
    foundingYear: str(prospect.foundingYear),
    ownershipType: str(prospect.ownershipType),
    linkedinUrl: str(prospect.linkedinUrl),
    twitterHandle: str(prospect.twitterHandle),
    facebookPage: str(prospect.facebookPage),
    techStack: jsonArr(prospect.techStack),
    sources: jsonArr(prospect.sources),
    stage: 'enriched',
    leadScore: completeness,
    leadTier: completeness >= 60 ? 'warm' : 'cold',
    dataCompleteness: completeness,
    enrichedAt: new Date(),
  };
}

/**
 * Update an existing Lead row with enriched prospect data.
 */
async function updateLeadWithProspect(leadId: string, prospect: Record<string, unknown>): Promise<void> {
  try {
    const updates = prospectToLeadUpdates(prospect);
    await db.lead.update({
      where: { id: leadId },
      data: updates,
    });
  } catch (err) {
    console.error(`[CampaignStream] Failed to update lead ${leadId}:`, err);
  }
}

// ── Main Handler ───────────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: campaignId } = await params;

  // ── Validate campaign exists ──
  const campaign = await db.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      description: true,
      targetIndustry: true,
      targetLocation: true,
      targetCompanySize: true,
      status: true,
    },
  });

  if (!campaign) {
    return new Response(JSON.stringify({ error: 'Campaign not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Optional body: limit enrichment count (default 3), force re-run
  let body: { enrichCount?: number; force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional — empty body is fine
  }
  const enrichCount = Math.min(Math.max(body.enrichCount ?? 3, 1), 5);

  const encoder = new TextEncoder();
  const discoveryQuery = buildDiscoveryQuery(campaign);

  const stream = new ReadableStream({
    start(controller) {
      let keepaliveInterval: NodeJS.Timeout | null = null;
      let thinkingInterval: NodeJS.Timeout | null = null;
      let thinkStartTime: number | null = null;
      let aborted = false;

      const send = (event: string, data: unknown) => {
        if (aborted) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        } catch {
          aborted = true;
        }
      };

      // Send initial byte so the browser's fetch() resolves immediately
      send('stream_open', {
        timestamp: Date.now(),
        campaignId,
        campaignName: campaign.name,
        discoveryQuery,
      });

      // Keepalive every 5s
      keepaliveInterval = setInterval(() => {
        if (aborted) {
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          aborted = true;
        }
      }, 5_000);

      const startThinkingTimer = () => {
        thinkStartTime = Date.now();
        thinkingInterval = setInterval(() => {
          if (thinkStartTime) {
            const elapsed = Date.now() - thinkStartTime;
            send('thinking_tick', { elapsedMs: elapsed, phase: 'Thinking' });
          }
        }, 1000);
      };
      const stopThinkingTimer = () => {
        if (thinkingInterval) {
          clearInterval(thinkingInterval);
          thinkingInterval = null;
        }
      };

      // ── Mark campaign as active ──
      db.campaign
        .update({
          where: { id: campaignId },
          data: { status: 'active' },
        })
        .catch(() => {});

      // ── Phase 1: DISCOVERY ──
      // Cancel stale 'running' tasks from a previous aborted run, then mirror
      // the discovery stage into AgentTask so pipeline-status / UI shows live progress
      db.agentTask
        .updateMany({
          where: { campaignId, status: 'running' },
          data: { status: 'cancelled', completedAt: new Date() },
        })
        .catch(() => {});
      startStageTask(campaignId, 'prospect-discovery', 'search', {
        query: discoveryQuery,
        startedBy: 'stream',
      }).catch(() => {});

      send('pipeline_progress', {
        phase: 'discovery',
        overallProgress: 5,
        message: `Discovering candidates for: ${discoveryQuery.slice(0, 100)}`,
      });
      send('step_start', {
        stepIndex: 0,
        label: 'Discovering candidates',
        agent: 'scout',
        message: `Searching the web for: ${discoveryQuery.slice(0, 100)}`,
      });

      // Primary: DuckDuckGo HTML search → Fallback: z-ai-web-dev-sdk web_search via discoverBusinesses
      directDuckDuckGoSearch(discoveryQuery, 10)
        .then(async (searchResponse) => {
          if (aborted) return;
          let results: SearchResult[] = searchResponse.success ? searchResponse.data : [];
          if (!searchResponse.success) {
            console.warn('[CampaignStream] DuckDuckGo search failed:', searchResponse.error);

            // FALLBACK: Try z-ai-web-dev-sdk discoverBusinesses (web_search)
            send('step_progress', {
              stepIndex: 0,
              message: 'DuckDuckGo failed, trying fallback web search…',
              partialData: { candidateCount: 0 },
            });
            try {
              const fallbackResult = await discoverBusinesses(
                discoveryQuery,
                campaign.targetLocation || undefined,
                campaign.targetIndustry || undefined,
              );
              if (fallbackResult.success && Array.isArray(fallbackResult.data) && fallbackResult.data.length > 0) {
                results = fallbackResult.data.map((r: { title?: string; url?: string; snippet?: string; name?: string; headline?: string }) => ({
                  title: r.title || r.name || '',
                  url: r.url || '',
                  snippet: r.snippet || r.headline || '',
                }));
                console.log(`[CampaignStream] Fallback discoverBusinesses found ${results.length} results`);
              } else {
                console.warn('[CampaignStream] Fallback discoverBusinesses also returned no results');
              }
            } catch (fallbackErr) {
              console.warn('[CampaignStream] Fallback search failed:', fallbackErr instanceof Error ? fallbackErr.message.slice(0, 100) : 'Unknown');
            }
          }
          send('step_progress', {
            stepIndex: 0,
            message: `Found ${results.length} candidates from primary web search`,
            partialData: { candidateCount: results.length },
          });

          // ── Multi-pass discovery: run 2 more query variations to find MORE leads ──
          // This dramatically increases lead count by finding companies the first
          // query missed (different phrasings, synonyms, locations).
          if (results.length < 20 && !aborted) {
            const queryVariations = generateQueryVariations(discoveryQuery, campaign);
            for (let v = 0; v < Math.min(queryVariations.length, 2) && !aborted; v++) {
              const variation = queryVariations[v];
              send('step_progress', {
                stepIndex: 0,
                message: `Pass ${v + 2}/3: Searching "${variation.slice(0, 80)}…"`,
                partialData: { candidateCount: results.length },
              });

              try {
                const variationResp = await directDuckDuckGoSearch(variation, 10);
                if (variationResp.success && variationResp.data.length > 0) {
                  // Deduplicate against existing results by URL
                  const existingUrls = new Set(results.map(r => r.url));
                  const newResults = variationResp.data.filter(r => !existingUrls.has(r.url));
                  results.push(...newResults);
                  console.log(`[CampaignStream] Variation ${v + 1} found ${newResults.length} new results (total: ${results.length})`);

                  send('step_progress', {
                    stepIndex: 0,
                    message: `Pass ${v + 2} found ${newResults.length} new candidates (total: ${results.length})`,
                    partialData: { candidateCount: results.length },
                  });
                }
              } catch (err) {
                console.warn(`[CampaignStream] Variation ${v + 1} failed:`, err);
              }

              // Also try discoverBusinesses for this variation
              if (!aborted) {
                try {
                  const fbResult = await discoverBusinesses(
                    variation,
                    campaign.targetLocation || undefined,
                    campaign.targetIndustry || undefined,
                  );
                  if (fbResult.success && Array.isArray(fbResult.data) && fbResult.data.length > 0) {
                    const existingUrls = new Set(results.map(r => r.url));
                    const newFallback = fbResult.data
                      .filter((r: { url?: string }) => !existingUrls.has(r.url || ''))
                      .map((r: { title?: string; url?: string; snippet?: string; name?: string; headline?: string }) => ({
                        title: r.title || r.name || '',
                        url: r.url || '',
                        snippet: r.snippet || r.headline || '',
                      }));
                    results.push(...newFallback);
                    console.log(`[CampaignStream] Fallback variation ${v + 1} found ${newFallback.length} new results (total: ${results.length})`);
                  }
                } catch (err) {
                  console.warn(`[CampaignStream] Fallback variation ${v + 1} failed:`, err);
                }
              }
            }
            send('step_progress', {
              stepIndex: 0,
              message: `Found ${results.length} total candidates from all search passes`,
              partialData: { candidateCount: results.length },
            });
          }

          // Save each candidate as a basic Lead
          const savedLeads: Array<LeadRow & { snippet: string }> = [];
          let newLeadCount = 0;
          const rejectedListicles: SearchResult[] = [];
          for (const result of results) {
            if (aborted) return;
            // Keep the top 2 directory/listicle pages for mining instead of saving
            if (isDirectoryResult(result.title, result.url)) {
              if (rejectedListicles.length < 2) rejectedListicles.push(result);
              continue;
            }
            const saved = await saveCandidateAsLead(campaignId, result);
            if (saved) {
              savedLeads.push({ ...saved.lead, snippet: result.snippet });
              if (saved.isNew) newLeadCount++;
            }
          }

          // ── LISTICLE MINING ──
          // B2B queries surface "Top N" articles that the filter correctly
          // rejects. When direct results yield too few real companies, mine
          // those rejected pages for the actual companies they list.
          if (savedLeads.length < 3 && rejectedListicles.length > 0 && !aborted) {
            send('step_progress', {
              stepIndex: 0,
              message: `Direct results were mostly directories — mining ${rejectedListicles.length} listicle page(s) for real companies…`,
              partialData: { candidateCount: savedLeads.length },
            });
            console.log(`[CampaignStream] Mining ${rejectedListicles.length} listicles for real companies`);
            for (const listicle of rejectedListicles) {
              if (aborted) return;
              const mined = await mineCompaniesFromListicle(listicle.url, campaign.targetIndustry || '');
              console.log(`[CampaignStream] Mined ${mined.length} companies from ${listicle.url.slice(0, 60)}`);
              for (const c of mined) {
                if (aborted) return;
                const saved = await upsertCompanyAsLead(campaignId, {
                  companyName: c.companyName,
                  website: c.website,
                  snippet: c.description || listicle.snippet,
                  sourceUrl: listicle.url,
                });
                if (saved) {
                  savedLeads.push({ ...saved.lead, snippet: c.description || listicle.snippet });
                  if (saved.isNew) newLeadCount++;
                }
              }
            }
            send('step_progress', {
              stepIndex: 0,
              message: `Listicle mining complete — ${savedLeads.length} total candidates`,
              partialData: { candidateCount: savedLeads.length },
            });
          }

          // Increment campaign.leadsFound only by the number of NEW leads
          // (deduped leads don't increment the counter again)
          if (newLeadCount > 0) {
            await db.campaign.update({
              where: { id: campaignId },
              data: { leadsFound: { increment: newLeadCount } },
            });
          }

          // Complete the discovery AgentTask with its real output
          completeStageTask(campaignId, 'prospect-discovery', {
            query: discoveryQuery,
            candidatesFound: results.length,
            leadsSaved: savedLeads.length,
            newLeads: newLeadCount,
            leads: savedLeads.map(l => ({ id: l.id, companyName: l.companyName, website: l.website })),
          }).catch(() => {});

          // ── Workforce Bridge: notify AI workforce of discovery ──
          onLeadsDiscovered(campaignId, campaign.name, savedLeads.length, newLeadCount).catch(() => {});

          send('step_complete', {
            stepIndex: 0,
            status: 'completed',
            message: `Discovered ${savedLeads.length} candidates`,
            partialData: {
              candidates: savedLeads.map(l => ({
                id: l.id,
                companyName: l.companyName,
                website: l.website,
                snippet: l.snippet.slice(0, 200),
              })),
            },
          });

          // Emit a lead_created event for each
          for (const lead of savedLeads) {
            send('lead_created', {
              leadId: lead.id,
              companyName: lead.companyName,
              website: lead.website,
              stage: 'new',
              source: 'discovery',
            });
          }

          if (savedLeads.length === 0) {
            // No candidates found — end gracefully
            send('pipeline_progress', {
              phase: 'complete',
              overallProgress: 100,
              message: 'No candidates found. Try refining your campaign query.',
            });
            send('done', {
              campaignId,
              summary: { discovered: 0, enriched: 0, failed: 0, skipped: 0 },
              leads: [],
            });
            return;
          }

          // ── Phase 2: ENRICHMENT (top N candidates) ──
          const toEnrich = savedLeads.slice(0, enrichCount);

          // Mirror enrichment + qualification stages into AgentTask
          startStageTask(campaignId, 'data-enrichment', 'enrich', {
            targets: toEnrich.map(l => ({ id: l.id, companyName: l.companyName, website: l.website })),
            orchestrator: 'atlas-8-agent',
          }).catch(() => {});
          startStageTask(campaignId, 'lead-qualification', 'qualify', {
            basis: '5-dimension weighted score (firmographic 25% / intent 20% / reachability 20% / strategic 20% / completeness 15%)',
            leadIds: toEnrich.map(l => l.id),
          }).catch(() => {});

          send('pipeline_progress', {
            phase: 'enrichment',
            overallProgress: 25,
            message: `Enriching top ${toEnrich.length} candidates with the 8-agent pipeline`,
          });

          let enrichedCount = 0;
          let failedCount = 0;

          for (let i = 0; i < toEnrich.length; i++) {
            if (aborted) return;
            const lead = toEnrich[i];

            // Live per-lead progress for the pipeline-status UI
            updateStageProgress(campaignId, 'data-enrichment', (i / toEnrich.length) * 100).catch(() => {});

            send('enrichment_start', {
              leadId: lead.id,
              companyName: lead.companyName,
              website: lead.website,
              index: i + 1,
              total: toEnrich.length,
            });

            // Build an enrichment message for the orchestrator
            // Use the website URL as the primary signal so the orchestrator
            // runs the research_url intent path
            const enrichmentMessage = lead.website
              ? `Research the company at ${lead.website}. Focus on: industry, employees, contact info (email/phone), CEO, headquarters location, social media profiles, tech stack, and recent news. The company name is "${lead.companyName}".`
              : `Research the company "${lead.companyName}". Focus on: industry, employees, contact info (email/phone), CEO, headquarters location, social media profiles, tech stack, and recent news.`;

            // Forward orchestrator events with enrichment context
            const onOrchestratorEvent = (event: OrchestratorEvent) => {
              if (aborted) return;
              switch (event.type) {
                case 'thinking_start':
                  startThinkingTimer();
                  send('thinking_start', { ...event.data, leadId: lead.id, enrichmentIndex: i + 1 });
                  break;
                case 'thinking_tick':
                  send('thinking_tick', event.data);
                  break;
                case 'thinking_end':
                  stopThinkingTimer();
                  send('thinking_end', { ...event.data, leadId: lead.id });
                  break;
                case 'agent_status':
                  send('agent_status', { ...event.data, leadId: lead.id, enrichmentIndex: i + 1 });
                  break;
                case 'agent_comm':
                  send('agent_comm', { ...event.data, leadId: lead.id });
                  break;
                case 'cooldown':
                  send('cooldown', event.data);
                  break;
                case 'step_start':
                  send('step_start', { ...event.data, leadId: lead.id });
                  break;
                case 'step_progress':
                  send('step_progress', { ...event.data, leadId: lead.id });
                  break;
                case 'step_complete':
                  send('step_complete', { ...event.data, leadId: lead.id });
                  break;
                case 'data_update':
                  send('data_update', { ...event.data, leadId: lead.id });
                  break;
                case 'insight':
                  send('insight', event.data);
                  break;
                case 'pipeline_progress':
                  // Rescale: enrichment phase is 25-90% of overall progress
                  send('pipeline_progress', {
                    ...event.data,
                    overallProgress: 25 + Math.round((event.data.overallProgress ?? 0) * 0.65 * (1 / toEnrich.length) + (i / toEnrich.length) * 65),
                    enrichmentIndex: i + 1,
                    enrichmentTotal: toEnrich.length,
                  });
                  break;
                case 'error':
                  send('error', { ...event.data, leadId: lead.id });
                  break;
              }
            };

            try {
              const result = await processWithOrchestrator(
                enrichmentMessage,
                undefined,
                undefined,
                onOrchestratorEvent,
              );

              if (aborted) return;

              // Update the lead with the enriched prospect data
              if (result.message?.prospectData) {
                const prospect = result.message.prospectData as unknown as Record<string, unknown>;
                await updateLeadWithProspect(lead.id, prospect);
                enrichedCount++;

                send('lead_enriched', {
                  leadId: lead.id,
                  companyName: prospect.companyName || lead.companyName,
                  website: prospect.website || lead.website,
                  dataCompleteness: prospect.dataCompleteness ?? 0,
                  enrichmentIndex: i + 1,
                  enrichmentTotal: toEnrich.length,
                });

                // ── Workforce Bridge: log enrichment + scoring ──
                const completeness = Number(prospect.dataCompleteness) || 0;
                const score = Number(prospect.leadScore) || completeness;
                const tier = (prospect.leadTier as string) || (completeness >= 80 ? 'hot' : completeness >= 60 ? 'warm' : 'cold');
                onLeadEnriched(lead.id, (prospect.companyName as string) || lead.companyName, 20, completeness).catch(() => {});
                onLeadScored(lead.id, (prospect.companyName as string) || lead.companyName, score, tier).catch(() => {});
              }

              // Increment campaign.leadsQualified for each enriched lead
              await db.campaign.update({
                where: { id: campaignId },
                data: { leadsQualified: { increment: 1 } },
              });

              // Qualification completes alongside enrichment (score + tier assigned above)
              updateStageProgress(campaignId, 'lead-qualification', ((i + 1) / toEnrich.length) * 100).catch(() => {});
            } catch (err) {
              console.error(`[CampaignStream] Enrichment failed for lead ${lead.id}:`, err);
              failedCount++;
              send('error', {
                message: `Enrichment failed for ${lead.companyName}: ${err instanceof Error ? err.message.slice(0, 200) : 'Unknown error'}`,
                leadId: lead.id,
                recoverable: true,
              });
            }

            // Small cooldown between orchestrator runs to avoid rate limits
            if (i < toEnrich.length - 1) {
              send('cooldown', {
                agent: 'orchestrator',
                cooldownMs: 2000,
                reason: 'rate_limit_buffer',
                message: 'Pausing 2s before next enrichment to avoid rate limits',
              });
              await new Promise(r => setTimeout(r, 2000));
            }
          }

          // ── Done ──
          // Always mark campaign as completed even if enrichment partially failed
          // (leads that DID get discovered are still valid and useful)
          try {
            await db.campaign.update({
              where: { id: campaignId },
              data: { status: 'completed' },
            });
          } catch (dbErr) {
            console.error('[CampaignStream] Failed to update campaign status on completion:', dbErr);
          }

          // Close the enrichment / qualification AgentTasks with their real outputs
          completeStageTask(campaignId, 'data-enrichment', {
            enriched: enrichedCount,
            failed: failedCount,
            skipped: Math.max(0, savedLeads.length - toEnrich.length),
            orchestratorEvents: 'atlas → scout → forge → sage → judge → bard → flow → echo',
          }, enrichedCount === 0 && failedCount > 0).catch(() => {});
          completeStageTask(campaignId, 'lead-qualification', {
            qualified: enrichedCount,
            rejected: 0,
            note: 'Scores assigned via 5-dimension weighted model during enrichment',
          }).catch(() => {});

          send('pipeline_progress', {
            phase: 'complete',
            overallProgress: 100,
            message: `Pipeline complete: ${savedLeads.length} discovered, ${enrichedCount} enriched, ${failedCount} failed`,
          });

          // ── Workforce Bridge: notify AI workforce of pipeline completion ──
          onPipelineComplete(campaignId, campaign.name, {
            discovered: savedLeads.length,
            newDiscovered: newLeadCount,
            loadedFromPrior: savedLeads.length - newLeadCount,
            enriched: enrichedCount,
            fullyEnriched: enrichedCount,
            autoEnriched: 0,
            failed: failedCount,
          }).catch(() => {});

          send('done', {
            campaignId,
            summary: {
              discovered: savedLeads.length,
              enriched: enrichedCount,
              failed: failedCount,
              skipped: Math.max(0, savedLeads.length - toEnrich.length),
            },
            leads: savedLeads.map(l => ({
              id: l.id,
              companyName: l.companyName,
              website: l.website,
            })),
          });
        })
        .catch(async (error) => {
          console.error('[CampaignStream] Discovery phase failed:', error);
          stopThinkingTimer();
          send('error', {
            message: `Discovery failed: ${error instanceof Error ? error.message.slice(0, 200) : 'Unknown error'}`,
            recoverable: true,
          });
          // Ensure campaign status is set to a terminal state even on error
          try {
            await db.campaign.update({
              where: { id: campaignId },
              data: { status: 'completed' },
            });
          } catch (dbErr) {
            console.error('[CampaignStream] Failed to update campaign status on error:', dbErr);
          }
          send('done', {
            campaignId,
            summary: { discovered: 0, enriched: 0, failed: 1, skipped: 0 },
            leads: [],
            error: true,
          });
        })
        .finally(() => {
          stopThinkingTimer();
          if (keepaliveInterval) clearInterval(keepaliveInterval);
          try {
            controller.close();
          } catch {
            // already closed
          }
        });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
