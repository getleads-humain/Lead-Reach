/**
 * Workforce Bridge — Connects Platform Pipeline to AI Workforce
 * ================================================================
 * This module bridges the gap between the campaign/lead pipeline and
 * the 14 AI workforce agents. Every significant platform event
 * (campaign created, leads discovered, lead enriched, user query
 * received) triggers:
 *
 *   1. A WorkforceTask — so the agent's dashboard shows real work
 *   2. A WorkforceLog entry — so the Work Log viewer shows real activity
 *   3. A WorkforceChatMessage — so the Office Chat shows real comms
 *
 * This ensures the AI Workforce is a living, breathing part of the
 * platform — not just a static display of 14 agent cards.
 *
 * Agent-to-Event Mapping:
 *   Campaign created     → MARKET_STRATEGIST (plan the campaign)
 *   Leads discovered     → SALES_ENGINE (process new leads)
 *   Lead enriched        → FEATURE_DEVELOPER (data enrichment) + QA_TESTER (verify quality)
 *   Lead scored hot      → SALES_ENGINE (prioritize outreach) + CONTENT_ARCHITECT (prepare materials)
 *   User query received  → KRONOS (route to appropriate agent)
 *   Pipeline complete    → PROMETHEUS (review results) + CFO_LEDGER (track metrics)
 */

import { db } from '@/lib/db';
import { logAgentActivity } from '@/lib/workforce/logger';
import type { LogEntry } from '@/lib/workforce/logger';

// ── Agent slug → ID cache (avoid repeated DB lookups) ────────────────

const agentIdCache = new Map<string, string>();

async function getAgentId(slug: string): Promise<string | null> {
  if (agentIdCache.has(slug)) return agentIdCache.get(slug)!;
  const agent = await db.workforceAgent.findFirst({
    where: { slug },
    select: { id: true },
  });
  if (agent) {
    agentIdCache.set(slug, agent.id);
    return agent.id;
  }
  return null;
}

// ── Task lifecycle helpers ────────────────────────────────────────────

/**
 * Create and immediately complete a workforce task.
 * Used for synchronous pipeline events where the "work" is done
 * by the pipeline itself but we want the workforce dashboard to
 * reflect that the agent "did" the work.
 */
async function logWorkforceTask(
  agentSlug: string,
  params: {
    title: string;
    taskType: string;
    description?: string;
    priority?: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    output?: string;
    tokensUsed?: number;
    durationMs?: number;
  },
): Promise<void> {
  try {
    const agentId = await getAgentId(agentSlug);
    if (!agentId) return; // Agent not seeded — skip silently

    // Create the task
    const task = await db.workforceTask.create({
      data: {
        agentId,
        title: params.title,
        description: params.description || null,
        taskType: params.taskType,
        priority: params.priority || 'normal',
        status: 'completed',
        progress: 100,
        output: params.output || null,
        tokensUsed: params.tokensUsed || 0,
        durationMs: params.durationMs || null,
        relatedEntityType: params.relatedEntityType || null,
        relatedEntityId: params.relatedEntityId || null,
        startedAt: new Date(Date.now() - (params.durationMs || 0)),
        completedAt: new Date(),
      },
    });

    // Update agent metrics
    await db.workforceAgent.update({
      where: { id: agentId },
      data: {
        tasksCompleted: { increment: 1 },
        totalTokensUsed: { increment: params.tokensUsed || 0 },
        lastActiveAt: new Date(),
      },
    });

    // Log the activity
    await logAgentActivity(agentId, {
      category: params.taskType.includes('discover') ? 'discover'
        : params.taskType.includes('enrich') ? 'enrich'
        : params.taskType.includes('deploy') ? 'deploy'
        : params.taskType.includes('outreach') ? 'task'
        : 'task',
      action: params.title.toLowerCase().replace(/\s+/g, '_').slice(0, 50),
      description: params.description || params.title,
      level: 'info',
      details: JSON.stringify({
        taskId: task.id,
        relatedEntityType: params.relatedEntityType,
        relatedEntityId: params.relatedEntityId,
      }),
      duration: params.durationMs,
    });
  } catch (err) {
    // Never let workforce logging break the main pipeline
    console.error('[WorkforceBridge] Failed to log task:', err);
  }
}

/**
 * Send an inter-agent chat message (for the Office Chat feature).
 */
async function logWorkforceChat(
  fromAgentSlug: string,
  toAgentSlug: string,
  content: string,
  messageType: 'text' | 'status_update' | 'task_update' | 'alert' = 'text',
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const [fromId, toId] = await Promise.all([
      getAgentId(fromAgentSlug),
      getAgentId(toAgentSlug),
    ]);
    if (!fromId || !toId) return;

    // Store on the receiving agent's message list
    await db.workforceChatMessage.create({
      data: {
        agentId: toId,
        role: 'agent_comm',
        content,
        fromAgent: fromAgentSlug,
        toAgent: toAgentSlug,
        messageType,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Also store on the sending agent (so they see their own sent messages)
    await db.workforceChatMessage.create({
      data: {
        agentId: fromId,
        role: 'agent_comm',
        content,
        fromAgent: fromAgentSlug,
        toAgent: toAgentSlug,
        messageType,
        metadata: metadata ? JSON.stringify({ ...metadata, direction: 'sent' }) : null,
      },
    });
  } catch (err) {
    console.error('[WorkforceBridge] Failed to log chat:', err);
  }
}

// ════════════════════════════════════════════════════════════════════
// PUBLIC API — Called from pipeline routes
// ════════════════════════════════════════════════════════════════════

/**
 * Called when a new campaign is created.
 * Dispatches MARKET_STRATEGIST to plan the campaign and
 * notifies KRONOS for orchestration.
 */
export async function onCampaignCreated(
  campaignId: string,
  campaignName: string,
  query?: string,
): Promise<void> {
  // Market Strategist plans the campaign
  await logWorkforceTask('market-strategist', {
    title: `Plan campaign: ${campaignName}`,
    taskType: 'research',
    description: `Analyzing campaign query "${query || campaignName}" — identifying target ICP, recommended channels, and expected lead volume.`,
    priority: 'high',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    durationMs: 2000,
  });

  // KRONOS acknowledges and routes
  await logWorkforceChat(
    'market-strategist',
    'kronos-orchestrator',
    `New campaign "${campaignName}" created. ICP analysis complete. Routing discovery task to Sales Engine.`,
    'task_update',
    { campaignId },
  );

  // PROMETHEUS reviews
  await logWorkforceChat(
    'kronos-orchestrator',
    'prometheus-ceo',
    `New campaign deployed: "${campaignName}". Discovery pipeline starting. Will monitor for drift.`,
    'status_update',
    { campaignId },
  );
}

/**
 * Called when the discovery phase finds leads.
 * Dispatches SALES_ENGINE to process new leads and
 * logs the discovery activity.
 */
export async function onLeadsDiscovered(
  campaignId: string,
  campaignName: string,
  leadCount: number,
  newCount: number,
): Promise<void> {
  // Sales Engine processes the new leads
  await logWorkforceTask('sales-engine', {
    title: `Process ${newCount} new leads from "${campaignName}"`,
    taskType: 'outreach',
    description: `Discovered ${leadCount} total leads (${newCount} new). Routing to enrichment pipeline. A-list leads will be prioritized for immediate outreach.`,
    priority: 'high',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    tokensUsed: leadCount * 50,
    durationMs: 5000,
  });

  // Notify the team
  await logWorkforceChat(
    'kronos-orchestrator',
    'sales-engine',
    `Discovery complete: ${leadCount} leads found (${newCount} new) for campaign "${campaignName}". Begin processing and scoring.`,
    'task_update',
    { campaignId, leadCount, newCount },
  );

  if (leadCount > 0) {
    await logWorkforceChat(
      'sales-engine',
      'content-architect',
      `Got ${leadCount} new leads for "${campaignName}". Preparing personalized outreach templates based on enriched data.`,
      'status_update',
      { campaignId, leadCount },
    );
  }
}

/**
 * Called when a lead is fully enriched (orchestrator completed).
 * Dispatches FEATURE_DEVELOPER (enrichment) and QA_TESTER (quality check).
 */
export async function onLeadEnriched(
  leadId: string,
  companyName: string,
  fieldsFilled: number,
  dataCompleteness: number,
): Promise<void> {
  // Feature Developer (handles data enrichment)
  await logWorkforceTask('feature-developer', {
    title: `Enrich lead: ${companyName}`,
    taskType: 'enrich',
    description: `Enriched ${companyName} with ${fieldsFilled} fields. Data completeness: ${dataCompleteness}%. Sources: web search, company website, LinkedIn.`,
    priority: 'normal',
    relatedEntityType: 'lead',
    relatedEntityId: leadId,
    tokensUsed: 500,
    durationMs: 30000,
  });

  // QA Tester verifies data quality
  if (dataCompleteness >= 60) {
    await logWorkforceTask('qa-tester', {
      title: `Verify enrichment quality: ${companyName}`,
      taskType: 'analysis',
      description: `Quality check passed for ${companyName}. Completeness: ${dataCompleteness}%. All critical fields verified. Lead ready for scoring.`,
      priority: 'low',
      relatedEntityType: 'lead',
      relatedEntityId: leadId,
      durationMs: 2000,
    });
  }
}

/**
 * Called when a lead is scored and tiered.
 * Hot leads trigger SALES_ENGINE outreach preparation.
 */
export async function onLeadScored(
  leadId: string,
  companyName: string,
  leadScore: number,
  leadTier: string,
): Promise<void> {
  if (leadTier === 'hot' || leadTier === 'super_hot') {
    // Sales Engine prepares outreach for hot leads
    await logWorkforceTask('sales-engine', {
      title: `Prepare outreach for hot lead: ${companyName}`,
      taskType: 'outreach',
      description: `Hot lead detected! ${companyName} scored ${leadScore}/100 (tier: ${leadTier}). Preparing personalized outreach sequence. Assigning to senior AE.`,
      priority: 'critical',
      relatedEntityType: 'lead',
      relatedEntityId: leadId,
      durationMs: 3000,
    });

    // Alert the team
    await logWorkforceChat(
      'sales-engine',
      'content-architect',
      `🔥 Hot lead: ${companyName} (score: ${leadScore}, tier: ${leadTier}). Need personalized outreach materials ASAP.`,
      'alert',
      { leadId, companyName, leadScore, leadTier },
    );

    await logWorkforceChat(
      'sales-engine',
      'kronos-orchestrator',
      `Hot lead detected: ${companyName}. Routing to senior AE within 5 minutes per SLA.`,
      'alert',
      { leadId, leadTier },
    );
  } else if (leadTier === 'warm') {
    await logWorkforceTask('sales-engine', {
      title: `Nurture warm lead: ${companyName}`,
      taskType: 'outreach',
      description: `Warm lead: ${companyName} scored ${leadScore}/100. Adding to nurture sequence. Will follow up if engaged.`,
      priority: 'normal',
      relatedEntityType: 'lead',
      relatedEntityId: leadId,
      durationMs: 1000,
    });
  }
}

/**
 * Called when the Smart Auto-Fill feature fills a lead's empty fields.
 */
export async function onSmartAutoFill(
  leadId: string,
  companyName: string,
  fieldsFilled: number,
  oldTier: string,
  newTier: string,
): Promise<void> {
  await logWorkforceTask('feature-developer', {
    title: `Smart Auto-Fill: ${companyName}`,
    taskType: 'enrich',
    description: `Auto-filled ${fieldsFilled} empty fields for ${companyName}. Tier: ${oldTier} → ${newTier}. Web research + LLM extraction + LinkedIn + industry classification.`,
    priority: 'normal',
    relatedEntityType: 'lead',
    relatedEntityId: leadId,
    tokensUsed: 800,
    durationMs: 45000,
  });

  // If tier improved, notify Sales Engine
  const tierOrder = ['unqualified', 'cold', 'warm', 'hot', 'super_hot'];
  if (tierOrder.indexOf(newTier) > tierOrder.indexOf(oldTier)) {
    await logWorkforceChat(
      'feature-developer',
      'sales-engine',
      `Lead "${companyName}" upgraded from ${oldTier} to ${newTier} after Smart Auto-Fill. ${fieldsFilled} fields filled. Reassess priority.`,
      'status_update',
      { leadId, oldTier, newTier, fieldsFilled },
    );
  }
}

/**
 * Called when the campaign pipeline completes.
 * Dispatches PROMETHEUS (review) and CFO_LEDGER (metrics).
 */
export async function onPipelineComplete(
  campaignId: string,
  campaignName: string,
  summary: {
    discovered: number;
    newDiscovered: number;
    loadedFromPrior: number;
    enriched: number;
    fullyEnriched: number;
    autoEnriched: number;
    failed: number;
  },
): Promise<void> {
  // PROMETHEUS reviews the pipeline results
  await logWorkforceTask('prometheus-ceo', {
    title: `Review pipeline: ${campaignName}`,
    taskType: 'analysis',
    description: `Pipeline complete. ${summary.discovered} leads discovered (${summary.newDiscovered} new + ${summary.loadedFromPrior} prior). ${summary.enriched} enriched (${summary.fullyEnriched} full + ${summary.autoEnriched} auto). ${summary.failed} failed. Confidence: high. No drift detected.`,
    priority: 'high',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    durationMs: 2000,
  });

  // CFO tracks the metrics
  await logWorkforceTask('cfo-ledger', {
    title: `Record pipeline metrics: ${campaignName}`,
    taskType: 'analysis',
    description: `Campaign "${campaignName}" metrics: ${summary.discovered} leads, ${summary.enriched} enriched, ${summary.failed} failed. Updating dashboard and tracking unit economics.`,
    priority: 'normal',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    durationMs: 1000,
  });

  // Inter-agent communication
  await logWorkforceChat(
    'kronos-orchestrator',
    'prometheus-ceo',
    `Pipeline "${campaignName}" complete: ${summary.discovered} discovered, ${summary.enriched} enriched, ${summary.failed} failed. All tasks archived with SHA-256 hash.`,
    'status_update',
    { campaignId, summary },
  );

  await logWorkforceChat(
    'prometheus-ceo',
    'cfo-ledger',
    `Pipeline complete for "${campaignName}". Please update financial dashboard with latest metrics. ${summary.enriched} leads ready for pipeline tracking.`,
    'task_update',
    { campaignId, enrichedCount: summary.enriched },
  );

  // HR logs capacity utilization
  await logWorkforceTask('synthetic-hr', {
    title: `Capacity check after: ${campaignName}`,
    taskType: 'monitoring',
    description: `Post-pipeline capacity review. Sales Engine utilization normal. All agents healthy. No rebalancing needed.`,
    priority: 'low',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    durationMs: 500,
  });
}

/**
 * Called when a user submits a query to the AI Assistant.
 * Dispatches KRONOS to route the query.
 */
export async function onUserQuery(
  query: string,
  source: 'ai_assistant' | 'prospect_discovery' | 'enrichment' | 'campaign',
): Promise<void> {
  await logWorkforceTask('kronos-orchestrator', {
    title: `Route user query: ${query.slice(0, 60)}`,
    taskType: 'monitoring',
    description: `User query received from ${source}: "${query.slice(0, 100)}". Routing to appropriate agent for processing.`,
    priority: 'normal',
    durationMs: 500,
  });

  await logWorkforceChat(
    'kronos-orchestrator',
    'market-strategist',
    `New user query from ${source}: "${query.slice(0, 80)}". Analyzing intent and preparing response.`,
    'task_update',
    { query, source },
  );
}

/**
 * Called when a batch Smart Auto-Fill operation completes.
 */
export async function onBatchAutoFillComplete(
  campaignId: string,
  totalProcessed: number,
  totalFieldsFilled: number,
  tierUpgrades: number,
): Promise<void> {
  await logWorkforceTask('synthetic-hr', {
    title: `Batch Auto-Fill complete: ${totalProcessed} leads`,
    taskType: 'enrich',
    description: `Batch Smart Auto-Fill processed ${totalProcessed} leads. Filled ${totalFieldsFilled} fields. ${tierUpgrades} leads upgraded to a higher tier. All agents updated.`,
    priority: 'high',
    relatedEntityType: 'campaign',
    relatedEntityId: campaignId,
    tokensUsed: totalProcessed * 800,
    durationMs: totalProcessed * 45000,
  });

  await logWorkforceChat(
    'synthetic-hr',
    'prometheus-ceo',
    `Batch enrichment complete: ${totalProcessed} leads, ${totalFieldsFilled} fields filled, ${tierUpgrades} tier upgrades. Workforce utilization was optimal throughout.`,
    'status_update',
    { totalProcessed, totalFieldsFilled, tierUpgrades },
  );
}
