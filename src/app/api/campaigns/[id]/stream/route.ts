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
  // (user typically names the campaign with their target, e.g.
  //  "DragonFruit Suppliers in Vietnam" or "B2B SaaS Companies in fintech")
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
 * Save a search result as a basic Lead row.
 * Returns the Lead row + whether it was newly created (vs. an existing dedupe hit).
 */
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

  try {
    // Dedupe by website within this campaign
    const existing = await db.lead.findFirst({
      where: { campaignId, website },
      select: { id: true, companyName: true, website: true },
    });
    if (existing) return { lead: existing, isNew: false };

    const lead = await db.lead.create({
      data: {
        campaignId,
        companyName,
        website,
        stage: 'new',
        leadScore: 0,
        leadTier: 'cold',
        dataCompleteness: 5, // minimal — just a name + website
        sources: JSON.stringify([result.url]),
        notes: `Discovered via search: ${result.snippet.slice(0, 300)}`,
        discoveredAt: new Date(),
      },
      select: { id: true, companyName: true, website: true },
    });

    return { lead, isNew: true };
  } catch (err) {
    console.error('[CampaignStream] Failed to save candidate as lead:', err);
    return null;
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

      directDuckDuckGoSearch(discoveryQuery, 10)
        .then(async (searchResponse) => {
          if (aborted) return;
          const results: SearchResult[] = searchResponse.success ? searchResponse.data : [];
          if (!searchResponse.success) {
            console.warn('[CampaignStream] DuckDuckGo search failed:', searchResponse.error);
            // Continue with empty results — the pipeline will end gracefully
          }
          send('step_progress', {
            stepIndex: 0,
            message: `Found ${results.length} candidates from web search`,
            partialData: { candidateCount: results.length },
          });

          // Save each candidate as a basic Lead
          const savedLeads: Array<LeadRow & { snippet: string }> = [];
          let newLeadCount = 0;
          for (const result of results) {
            if (aborted) return;
            const saved = await saveCandidateAsLead(campaignId, result);
            if (saved) {
              savedLeads.push({ ...saved.lead, snippet: result.snippet });
              if (saved.isNew) newLeadCount++;
            }
          }

          // Increment campaign.leadsFound only by the number of NEW leads
          // (deduped leads don't increment the counter again)
          if (newLeadCount > 0) {
            await db.campaign.update({
              where: { id: campaignId },
              data: { leadsFound: { increment: newLeadCount } },
            });
          }

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
              }

              // Increment campaign.leadsQualified for each enriched lead
              await db.campaign.update({
                where: { id: campaignId },
                data: { leadsQualified: { increment: 1 } },
              });
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
          await db.campaign.update({
            where: { id: campaignId },
            data: { status: 'completed' },
          });

          send('pipeline_progress', {
            phase: 'complete',
            overallProgress: 100,
            message: `Pipeline complete: ${savedLeads.length} discovered, ${enrichedCount} enriched, ${failedCount} failed`,
          });

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
        .catch((error) => {
          console.error('[CampaignStream] Discovery phase failed:', error);
          stopThinkingTimer();
          send('error', {
            message: `Discovery failed: ${error instanceof Error ? error.message.slice(0, 200) : 'Unknown error'}`,
            recoverable: true,
          });
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
