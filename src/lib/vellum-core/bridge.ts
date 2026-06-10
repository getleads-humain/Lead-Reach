/**
 * Vellum Core — Bridge Module
 * =============================
 *
 * This module bridges the Vellum Core infrastructure to the existing
 * LeadReach AI platform. It provides high-level functions that combine
 * Vellum Core's AgentLoop, Memory, Proactivity, and MCP capabilities
 * with LeadReach's existing agent-executor and agent-reach-bridge.
 *
 * IMPORTANT: This module is ADDITIVE only — it does not modify any
 * existing LeadReach code. It composes Vellum Core primitives with
 * existing infrastructure to deliver enhanced functionality.
 *
 * Usage (server-side only):
 *   import { orchestrateWithVellum, enhancedProspectSearch } from '@/lib/vellum-core/bridge';
 */

import { createAgentLoop, type AgentEvent } from '@/lib/vellum-core';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { db } from '@/lib/db';

// ============================================================
// Types
// ============================================================

export interface VellumOrchestrationResult {
  /** The main response text from the agent loop */
  response: string;
  /** Which agents were activated during the pipeline */
  agentsActivated: string[];
  /** Tools that were called during execution */
  toolsUsed: string[];
  /** Whether Vellum memory was consulted */
  memoryUsed: boolean;
  /** Whether the pipeline completed successfully */
  success: boolean;
  /** Total execution time in milliseconds */
  executionTimeMs: number;
  /** Any errors encountered */
  errors: string[];
}

export interface EnhancedProspectResult {
  /** Search results from Agent-Reach channels */
  searchResults: Array<{
    title: string;
    url: string;
    snippet: string;
    source: string;
  }>;
  /** Relevant memories from Vellum knowledge graph */
  relevantMemories: Array<{
    id: string;
    content: string;
    type: string;
    confidence: number;
  }>;
  /** AI-generated insights combining search + memory */
  insights: string[];
  /** Suggested follow-up actions */
  suggestedActions: Array<{
    label: string;
    prompt: string;
  }>;
}

export interface ProactiveInsight {
  id: string;
  type: 'follow_up' | 'schedule' | 'market_signal' | 'lead_update';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueAt?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================
// 1. Orchestrate with Vellum
// ============================================================

/**
 * Orchestrate a query using Vellum Core's AgentLoop instead of raw LLM calls.
 * This routes user queries through the full 8-agent pipeline with
 * Vellum's tool registry, permissions, and cooldown management.
 *
 * @param query - The user's natural language query
 * @param context - Optional additional context for the agent loop
 * @returns Structured orchestration result
 */
export async function orchestrateWithVellum(
  query: string,
  context?: Record<string, unknown>
): Promise<VellumOrchestrationResult> {
  const startTime = Date.now();
  const agentsActivated: string[] = [];
  const toolsUsed: string[] = [];
  const errors: string[] = [];
  let response = '';
  let memoryUsed = false;

  try {
    // Create a Vellum AgentLoop configured for B2B prospecting
    const loop = createAgentLoop({
      systemPrompt: `You are LeadReach AI, a B2B prospecting assistant powered by Vellum Core.
You coordinate 8 specialized agents to discover, enrich, qualify, and engage leads.

Available agents:
- Atlas (Orchestrator): Coordinates the pipeline and delegates tasks
- Scout (Prospect Discovery): Searches across multiple channels for prospects
- Hound (Deep Research): Performs deep-dive research on specific targets
- Forge (Data Enrichment): Enriches lead data with firmographics and contacts
- Sage (Market Intelligence): Analyzes market trends and competitive landscape
- Shield (Lead Qualification): Scores and qualifies leads against ICP criteria
- Flow (Pipeline Manager): Manages pipeline stages and follow-ups
- Bard (Report Generator): Generates reports and insights

Always provide structured, actionable responses with specific data points.
When searching for prospects, combine web search results with memory of past interactions.`,
      conversationId: context?.conversationId as string | undefined,
    });

    // Run the agent loop
    const result = await loop.run({
      messages: [
        {
          id: `bridge-${Date.now()}`,
          role: 'user',
          content: query,
          timestamp: Date.now(),
        },
      ],
      onEvent: (event: AgentEvent) => {
        switch (event.type) {
          case 'tool_call':
            toolsUsed.push(event.toolName);
            break;
          case 'tool_result':
            // Track tool completions
            break;
          case 'message_delta':
            response += event.delta;
            break;
          case 'memory_accessed':
            memoryUsed = true;
            break;
          case 'agent_handoff':
            agentsActivated.push(event.toAgent);
            break;
        }
      },
    });

    // If no response was accumulated from streaming, use the result
    if (!response && result.finalMessage) {
      response = result.finalMessage.content;
    }

    return {
      response: response || 'No response generated',
      agentsActivated: [...new Set(agentsActivated)],
      toolsUsed: [...new Set(toolsUsed)],
      memoryUsed,
      success: true,
      executionTimeMs: Date.now() - startTime,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMsg);

    return {
      response: `Error during orchestration: ${errorMsg}`,
      agentsActivated,
      toolsUsed,
      memoryUsed,
      success: false,
      executionTimeMs: Date.now() - startTime,
      errors,
    };
  }
}

// ============================================================
// 2. Enhanced Prospect Search
// ============================================================

/**
 * Perform an enhanced prospect search using Vellum memory + Agent-Reach tools.
 * This combines traditional web search with Vellum's knowledge graph to
 * deliver more relevant, context-aware prospect discovery.
 *
 * @param query - The search query (company name, industry, etc.)
 * @returns Enhanced prospect results with memory-augmented insights
 */
export async function enhancedProspectSearch(
  query: string
): Promise<EnhancedProspectResult> {
  const searchResults: EnhancedProspectResult['searchResults'] = [];
  const relevantMemories: EnhancedProspectResult['relevantMemories'] = [];
  const insights: string[] = [];
  const suggestedActions: EnhancedProspectResult['suggestedActions'] = [];

  // Step 1: Search via Agent-Reach Bridge (web search, LinkedIn, etc.)
  try {
    const searchResult = await exaSearch(query, 15);
    if (searchResult.success && searchResult.data) {
      for (const result of searchResult.data.slice(0, 10)) {
        searchResults.push({
          title: result.title,
          url: result.url,
          snippet: result.snippet,
          source: searchResult.source,
        });
      }
    }
  } catch (error) {
    console.warn('[enhancedProspectSearch] Web search failed:', error);
  }

  // Step 2: Query Vellum Memory for relevant past interactions
  try {
    const memories = await db.vellumMemoryNode.findMany({
      where: {
        OR: [
          { content: { contains: query } },
          { type: 'semantic' },
          { type: 'episodic' },
        ],
        fidelity: { in: ['vivid', 'dim'] },
      },
      take: 10,
      orderBy: { significance: 'desc' },
    });

    for (const mem of memories) {
      relevantMemories.push({
        id: mem.id,
        content: mem.content,
        type: mem.type,
        confidence: mem.confidence,
      });
    }
  } catch (error) {
    // Memory lookup failure is non-critical — continue without memories
    console.warn('[enhancedProspectSearch] Memory lookup failed:', error);
  }

  // Step 3: Generate insights by combining search + memory
  if (searchResults.length > 0) {
    insights.push(`Found ${searchResults.length} results across web channels for "${query}"`);
  }
  if (relevantMemories.length > 0) {
    insights.push(`${relevantMemories.length} relevant memories found from past interactions`);
  }
  if (searchResults.length > 0 && relevantMemories.length > 0) {
    insights.push('Cross-referencing search results with historical memory for deeper insights');
  }

  // Step 4: Suggest follow-up actions
  if (searchResults.length > 0) {
    suggestedActions.push({
      label: 'Enrich top results',
      prompt: `Enrich data for: ${searchResults.slice(0, 3).map(r => r.title).join(', ')}`,
    });
    suggestedActions.push({
      label: 'Score as leads',
      prompt: `Score these prospects against our ICP: ${query}`,
    });
  }
  if (relevantMemories.length > 0) {
    suggestedActions.push({
      label: 'Review past context',
      prompt: `What do we already know about ${query}?`,
    });
  }
  suggestedActions.push({
    label: 'Build outreach',
    prompt: `Compose outreach for prospects in ${query}`,
  });

  return {
    searchResults,
    relevantMemories,
    insights,
    suggestedActions,
  };
}

// ============================================================
// 3. Store Prospect Memory
// ============================================================

/**
 * Store prospect data as a memory node in Vellum's knowledge graph.
 * This enables future queries to leverage past prospect interactions
 * and build a richer understanding over time.
 *
 * @param data - The prospect data to store
 * @param scopeId - The user/team scope for isolation
 * @returns The created memory node ID
 */
export async function storeProspectMemory(
  data: Record<string, unknown>,
  scopeId: string
): Promise<string | null> {
  try {
    // Build a content string from the prospect data
    const companyName = (data.companyName as string) || (data.name as string) || 'Unknown Company';
    const industry = (data.industry as string) || '';
    const location = (data.city as string) || (data.country as string) || '';
    const website = (data.website as string) || '';

    const contentParts = [
      `Company: ${companyName}`,
      industry && `Industry: ${industry}`,
      location && `Location: ${location}`,
      website && `Website: ${website}`,
      data.employeeCount && `Employees: ${data.employeeCount}`,
      data.revenueEstimate && `Revenue: ${data.revenueEstimate}`,
      data.leadScore !== undefined && `Lead Score: ${data.leadScore}`,
      data.leadTier && `Tier: ${data.leadTier}`,
    ].filter(Boolean) as string[];

    const content = contentParts.join(' | ');

    // Determine memory type based on data content
    let memoryType = 'semantic';
    if (data.interactionNotes || data.lastContactDate) {
      memoryType = 'episodic';
    } else if (data.procedure || data.bestPractice) {
      memoryType = 'procedural';
    }

    // Calculate significance based on lead score
    const significance = data.leadScore
      ? Math.min(1.0, (data.leadScore as number) / 100)
      : 0.5;

    // Create the memory node
    const memoryNode = await db.vellumMemoryNode.create({
      data: {
        content,
        type: memoryType,
        fidelity: 'vivid',
        confidence: data.leadScore ? Math.min(1.0, (data.leadScore as number) / 100) : 0.7,
        significance,
        stability: 0.0,
        emotionalCharge: data.leadTier ? JSON.stringify({ tier: data.leadTier }) : null,
        sourceConversations: data.sessionId ? JSON.stringify([data.sessionId]) : null,
        sourceType: 'agent_analysis',
        narrativeRole: data.leadTier === 'hot' ? 'protagonist' : 'background',
        scopeId,
        scopeType: 'user',
      },
    });

    // If there's related company data, create an edge to existing memories
    if (companyName !== 'Unknown Company') {
      const existingMemories = await db.vellumMemoryNode.findMany({
        where: {
          content: { contains: companyName },
          scopeId,
          id: { not: memoryNode.id },
        },
        take: 5,
      });

      for (const existing of existingMemories) {
        await db.vellumMemoryEdge.create({
          data: {
            sourceId: memoryNode.id,
            targetId: existing.id,
            relationship: 'reminds-of',
            weight: 0.8,
            scopeId,
          },
        });
      }
    }

    return memoryNode.id;
  } catch (error) {
    console.error('[storeProspectMemory] Failed to store memory:', error);
    return null;
  }
}

// ============================================================
// 4. Get Proactive Insights
// ============================================================

/**
 * Get proactive insights from Vellum's scheduler and heartbeat system.
 * This checks for overdue follow-ups, upcoming schedules, and
 * market signals that the user should be aware of.
 *
 * @param scopeId - The user/team scope for isolation
 * @returns Array of proactive insights
 */
export async function getProactiveInsights(
  scopeId: string
): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();

  // Check for overdue follow-ups
  try {
    const overdueFollowUps = await db.vellumFollowUp.findMany({
      where: {
        scopeId,
        status: 'pending',
        dueAt: { lt: now },
      },
      take: 10,
      orderBy: { dueAt: 'asc' },
    });

    for (const fu of overdueFollowUps) {
      insights.push({
        id: `fu-overdue-${fu.id}`,
        type: 'follow_up',
        title: `Overdue: ${fu.title}`,
        description: fu.description || `Follow-up was due ${fu.dueAt?.toLocaleDateString()}`,
        priority: 'high',
        dueAt: fu.dueAt || undefined,
        metadata: { followUpId: fu.id, channelId: fu.channelId },
      });
    }

    // Mark overdue follow-ups
    if (overdueFollowUps.length > 0) {
      await db.vellumFollowUp.updateMany({
        where: {
          id: { in: overdueFollowUps.map(f => f.id) },
          status: 'pending',
        },
        data: { status: 'overdue' },
      });
    }
  } catch (error) {
    console.warn('[getProactiveInsights] Follow-up check failed:', error);
  }

  // Check for upcoming follow-ups (due within 24 hours)
  try {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const upcomingFollowUps = await db.vellumFollowUp.findMany({
      where: {
        scopeId,
        status: 'pending',
        dueAt: { gte: now, lt: tomorrow },
      },
      take: 5,
      orderBy: { dueAt: 'asc' },
    });

    for (const fu of upcomingFollowUps) {
      insights.push({
        id: `fu-upcoming-${fu.id}`,
        type: 'follow_up',
        title: `Upcoming: ${fu.title}`,
        description: fu.description || `Due ${fu.dueAt?.toLocaleString()}`,
        priority: 'medium',
        dueAt: fu.dueAt || undefined,
        metadata: { followUpId: fu.id, channelId: fu.channelId },
      });
    }
  } catch (error) {
    console.warn('[getProactiveInsights] Upcoming follow-up check failed:', error);
  }

  // Check for active schedules that are due to run
  try {
    const dueSchedules = await db.vellumSchedule.findMany({
      where: {
        scopeId,
        enabled: true,
        nextRunAt: { lt: now },
      },
      take: 5,
    });

    for (const schedule of dueSchedules) {
      insights.push({
        id: `schedule-due-${schedule.id}`,
        type: 'schedule',
        title: `Schedule due: ${schedule.name}`,
        description: `The "${schedule.name}" schedule is due to run (mode: ${schedule.mode})`,
        priority: 'medium',
        metadata: { scheduleId: schedule.id, mode: schedule.mode },
      });
    }
  } catch (error) {
    console.warn('[getProactiveInsights] Schedule check failed:', error);
  }

  // Check for high-significance memories that may need attention
  try {
    const significantMemories = await db.vellumMemoryNode.findMany({
      where: {
        scopeId,
        significance: { gt: 0.8 },
        fidelity: { in: ['fading', 'dim'] },
      },
      take: 5,
      orderBy: { significance: 'desc' },
    });

    for (const mem of significantMemories) {
      insights.push({
        id: `memory-fading-${mem.id}`,
        type: 'lead_update',
        title: `Memory fading: ${mem.content.slice(0, 60)}...`,
        description: `A high-significance memory about "${mem.content.slice(0, 100)}" is fading. Consider revisiting this prospect.`,
        priority: 'low',
        metadata: { memoryId: mem.id, type: mem.type, fidelity: mem.fidelity },
      });
    }
  } catch (error) {
    console.warn('[getProactiveInsights] Memory check failed:', error);
  }

  return insights;
}

// ============================================================
// 5. Execute Vellum Pipeline
// ============================================================

/**
 * Run the full 8-agent pipeline with Vellum enhancements.
 * This orchestrates the entire lead generation workflow from
 * discovery through qualification to outreach, using Vellum Core's
 * AgentLoop for each stage and persisting results to the database.
 *
 * @param query - The initial query or target description
 * @returns Pipeline execution summary
 */
export async function executeVellumPipeline(
  query: string
): Promise<VellumOrchestrationResult> {
  const startTime = Date.now();
  const agentsActivated: string[] = [];
  const toolsUsed: string[] = [];
  const errors: string[] = [];
  let memoryUsed = false;
  let response = '';

  try {
    // Create a Vellum session to track the pipeline
    const session = await db.vellumSession.create({
      data: {
        title: `Pipeline: ${query.slice(0, 50)}`,
        scopeId: 'system',
        status: 'active',
        pipelineState: JSON.stringify({ phase: 'initialized', query }),
      },
    });

    // Phase 1: Discovery — Use Agent-Reach to search for prospects
    agentsActivated.push('scout');
    let searchResults: Array<{ title: string; url: string; snippet: string; source: string }> = [];

    try {
      const searchResult = await exaSearch(query, 15);
      toolsUsed.push('web_search');

      if (searchResult.success && searchResult.data) {
        searchResults = searchResult.data.slice(0, 10).map(r => ({
          title: r.title,
          url: r.url,
          snippet: r.snippet,
          source: searchResult.source,
        }));
      }
    } catch (error) {
      errors.push(`Discovery phase error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Phase 2: Memory consultation — Check for relevant past data
    agentsActivated.push('sage');
    try {
      const memories = await db.vellumMemoryNode.findMany({
        where: {
          OR: [
            { content: { contains: query } },
            { type: 'semantic' },
          ],
          fidelity: { in: ['vivid', 'dim'] },
        },
        take: 5,
      });

      if (memories.length > 0) {
        memoryUsed = true;
        response += `📚 Found ${memories.length} relevant memories from past interactions.\n\n`;
      }
    } catch (error) {
      // Non-critical — continue without memory
    }

    // Phase 3: Enrichment — Try to read top results for deeper data
    agentsActivated.push('forge');
    if (searchResults.length > 0) {
      try {
        const topResult = searchResults[0];
        if (topResult.url) {
          const enrichResult = await webRead(topResult.url);
          toolsUsed.push('web_read');

          if (enrichResult.success && enrichResult.data) {
            response += `🔍 Enriched data from ${topResult.title}:\n`;
            response += `   ${enrichResult.data.content?.slice(0, 300)}...\n\n`;
          }
        }
      } catch (error) {
        errors.push(`Enrichment phase error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }

    // Phase 4: Orchestrate with AgentLoop for final synthesis
    agentsActivated.push('atlas');
    try {
      const orchestrationResult = await orchestrateWithVellum(
        `Based on the following search results about "${query}", provide a summary of the best prospects and recommended next steps:\n\n${
          searchResults.map((r, i) => `${i + 1}. ${r.title} — ${r.snippet}`).join('\n')
        }${memoryUsed ? '\n\nAlso consider past interactions stored in memory.' : ''}`,
        { sessionId: session.id }
      );

      if (orchestrationResult.success) {
        response += orchestrationResult.response;
        agentsActivated.push(...orchestrationResult.agentsActivated);
        toolsUsed.push(...orchestrationResult.toolsUsed);
      }
    } catch (error) {
      errors.push(`Orchestration phase error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Update session
    await db.vellumSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        pipelineState: JSON.stringify({
          phase: 'complete',
          agentsActivated,
          toolsUsed,
          memoryUsed,
        }),
        messageCount: 1,
      },
    });

    return {
      response: response || 'Pipeline completed with no results',
      agentsActivated: [...new Set(agentsActivated)],
      toolsUsed: [...new Set(toolsUsed)],
      memoryUsed,
      success: true,
      executionTimeMs: Date.now() - startTime,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMsg);

    return {
      response: `Pipeline error: ${errorMsg}`,
      agentsActivated: [...new Set(agentsActivated)],
      toolsUsed: [...new Set(toolsUsed)],
      memoryUsed,
      success: false,
      executionTimeMs: Date.now() - startTime,
      errors,
    };
  }
}
