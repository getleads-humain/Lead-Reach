// ============================================================
// 8-Agent Orchestrator — Real Multi-Agent Pipeline
// ============================================================
// Implements the full 8-agent processing pipeline with:
//   - Atlas (Orchestrator): Coordinates all agents
//   - Scout (Discovery): Company & web research
//   - Forge (Enrichment): Data enrichment & deep crawl
//   - Sage (Research): Market & competitive analysis
//   - Judge (Qualification): Lead scoring & ICP matching
//   - Bard (Outreach): Message composition
//   - Flow (Pipeline): Pipeline & session management
//   - Echo (Reports): Insights & reporting
//
// Each agent step is visible in the UI workspace with
// inter-agent communication messages.
//
// FIXES APPLIED:
//   - createInitialPipelineState() now uses 8-agent display keys
//   - Fast path for converse/clarify intents (skip full pipeline)
//   - Reduced cooldowns for faster execution
//   - Comm messages use 8-agent display names for correct UI display
//   - Robust fallback responses for all intent types
//   - Echo phase skips autoCurateICP LLM call for research queries
//   - research_company intent uses Atlas→Scout→Forge→Echo fast path
// ============================================================

import { generateStructuredFallback } from '@/lib/llm';
import {
  exaSearch,
  linkedInSearchCompanies,
} from '@/lib/agent-reach-bridge';
import type {
  AgentPersona,
  UserIntent,
  AgentMessage,
  AgentThinking,
  AgentAction,
  ProspectResult,
  ICPResult,
  OutreachResult,
  MarketResult,
  ScoreResult,
  ConversationContext,
  SuggestedAction,
  InsightItem,
  NavigationSuggestion,
  ViewType,
  PipelineCheckpoint,
} from './types';
import { classifyIntent, intentToThinking, type IntentClassification } from './intents';
import {
  executeCompanyResearch,
  executePersonResearch,
  executeUrlResearch,
  executeMarketAnalysis,
  executeCompetitiveAnalysis,
  executeICPBuilding,
  executeLeadScoring,
  executeOutreachComposition,
  generateConversationResponse,
  type ProgressCallback,
} from './actions';
import {
  type AgentCommMessage,
  type AgentState,
  type PipelineState,
  type OrchestratorEvent,
  type OrchestratorCallback,
  AGENT_8_DISPLAY,
  AGENT_8_MAP,
} from './orchestrator-types';

// Re-export types for backward compatibility
export type { AgentCommMessage, AgentState, PipelineState, OrchestratorEvent, OrchestratorCallback };
export { AGENT_8_DISPLAY, AGENT_8_MAP };

// ============================================================
// Pipeline Phases per Intent
// ============================================================

interface PipelinePhase {
  agent: string;           // 8-agent name (atlas, scout, forge, etc.)
  action: string;          // What this phase does
  intentRequired?: UserIntent[];  // Only run for these intents
  optional?: boolean;     // Skip if previous phases had errors
}

const PIPELINE_PHASES: PipelinePhase[] = [
  // Phase 1: Atlas classifies intent and plans the pipeline
  { agent: 'atlas', action: 'Classify intent and orchestrate pipeline' },
  // Phase 2: Scout discovers company/person data
  { agent: 'scout', action: 'Discover and research target', intentRequired: ['research_company', 'research_person', 'research_url', 'refine_search'] },
  // Phase 3: Forge enriches the data with deep crawl
  { agent: 'forge', action: 'Enrich discovered data', intentRequired: ['research_company', 'research_person', 'research_url'], optional: true },
  // Phase 4: Sage analyzes market/competitors if relevant
  { agent: 'sage', action: 'Analyze market and competitors', intentRequired: ['analyze_market', 'analyze_competitors'] },
  // Phase 5: Judge scores the lead against ICP
  { agent: 'judge', action: 'Score and qualify lead', intentRequired: ['score_lead'], optional: true },
  // Phase 6: Bard composes outreach if requested
  { agent: 'bard', action: 'Compose outreach message', intentRequired: ['compose_outreach'], optional: true },
  // Phase 7: Flow manages pipeline operations
  { agent: 'flow', action: 'Manage pipeline and session data', optional: true },
  // Phase 8: Echo generates insights and reports (lightweight — no LLM calls)
  { agent: 'echo', action: 'Generate insights and report' },
];

// ============================================================
// Initial Pipeline State — 8-Agent Keys
// ============================================================

function createInitialPipelineState(): PipelineState {
  // Create one entry per 8-agent display name
  // Each agent's persona field is set via AGENT_8_MAP
  const idleState = (persona: AgentPersona): AgentState => ({
    persona,
    status: 'idle',
    currentStep: '',
    progress: 0,
    startedAt: null,
    completedAt: null,
    thinkTimeMs: null,
  });

  const agents: Record<string, AgentState> = {
    atlas:  idleState(AGENT_8_MAP['atlas']),
    scout:  idleState(AGENT_8_MAP['scout']),
    forge:  idleState(AGENT_8_MAP['forge']),
    sage:   idleState(AGENT_8_MAP['sage']),
    judge:  idleState(AGENT_8_MAP['judge']),
    bard:   idleState(AGENT_8_MAP['bard']),
    flow:   idleState(AGENT_8_MAP['flow']),
    echo:   idleState(AGENT_8_MAP['echo']),
  };
  return {
    phase: 'idle',
    thinkStartTime: null,
    totalThinkTimeMs: null,
    agents,
    commLog: [],
    currentStep: '',
    overallProgress: 0,
  };
}

// ============================================================
// Main Orchestrator Entry Point
// ============================================================

export async function processWithOrchestrator(
  userMessage: string,
  context?: ConversationContext,
  forceIntent?: UserIntent,
  onEvent?: OrchestratorCallback,
  resumeFrom?: PipelineCheckpoint,
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
  pipelineState: PipelineState;
}> {
  const pipelineState = createInitialPipelineState();
  const startTime = Date.now();

  try {
    return await processWithOrchestratorInner(userMessage, context, forceIntent, pipelineState, startTime, onEvent, resumeFrom);
  } catch (error) {
    console.error('[Orchestrator] FATAL:', error);

    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    pipelineState.phase = 'error';

    return {
      message: {
        id: `agent-fallback-${Date.now()}`,
        role: 'assistant',
        content: `I encountered an error while processing your request. Let me try a different approach.\n\n**Error:** ${errorMsg.slice(0, 150)}\n\nYou can try:\n• Rephrasing your query (e.g., "Research Stripe")\n• Asking a more specific question`,
        timestamp: new Date(),
        persona: 'navigator',
        thinking: {
          persona: 'navigator',
          intent: 'converse',
          reasoning: `Fallback: ${errorMsg.slice(0, 100)}`,
          plan: ['Error recovery'],
          confidence: 0.1,
        },
        actions: [{ type: 'converse', label: 'Error', status: 'failed', message: errorMsg.slice(0, 100) }],
      },
      updatedContext: context || { recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {} },
      suggestedActions: [
        { label: 'Try Again', prompt: userMessage, icon: 'RefreshCw' },
        { label: 'Help', prompt: 'What can you do?', icon: 'Lightbulb' },
      ],
      pipelineState,
    };
  }
}

// ============================================================
// Helper: emit event safely
// ============================================================

function emit(onEvent: OrchestratorCallback | undefined, event: OrchestratorEvent): void {
  try { onEvent?.(event); } catch { /* ignore */ }
}

// ============================================================
// Helper: send agent communication message
// Uses 8-agent display names (atlas, scout, forge, etc.) for
// correct UI rendering in the comm log.
// ============================================================

function sendCommMsg(
  pipelineState: PipelineState,
  from: string,
  to: string,
  type: AgentCommMessage['type'],
  content: string,
  data?: Record<string, unknown>,
  onEvent?: OrchestratorCallback,
): void {
  const msg: AgentCommMessage = {
    id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    from, to, type, content, data, timestamp: Date.now(),
  };
  pipelineState.commLog.push(msg);
  emit(onEvent, { type: 'agent_comm', data: msg });
}

// ============================================================
// Helper: update agent state
// Uses the 8-agent display name as the key in pipelineState.agents,
// and sets the persona field from AGENT_8_MAP for backward compat.
// ============================================================

function updateAgentState(
  pipelineState: PipelineState,
  agentKey: string,  // 8-agent display name (atlas, scout, forge, etc.)
  update: Partial<AgentState>,
  onEvent?: OrchestratorCallback,
): void {
  // Ensure persona is set from the mapping if not already provided
  if (!update.persona) {
    update.persona = AGENT_8_MAP[agentKey] || 'navigator';
  }
  const existing = pipelineState.agents[agentKey];
  if (existing) {
    pipelineState.agents[agentKey] = { ...existing, ...update };
  } else {
    // Create the entry if it doesn't exist (safety net)
    pipelineState.agents[agentKey] = {
      persona: update.persona,
      status: 'idle',
      currentStep: '',
      progress: 0,
      startedAt: null,
      completedAt: null,
      thinkTimeMs: null,
      ...update,
    };
  }
  emit(onEvent, { type: 'agent_status', data: { agent: agentKey, state: pipelineState.agents[agentKey] } });
}

// ============================================================
// Helper: build rich fallback response from structured data
// without needing an LLM call. Covers all intent types.
// ============================================================

function buildRichFallbackResponse(params: {
  intent: UserIntent;
  prospect?: ProspectResult;
  icp?: ICPResult;
  market?: MarketResult;
  score?: ScoreResult;
  outreach?: OutreachResult;
  userMessage: string;
}): string {
  const { intent, prospect, icp, market, score, outreach, userMessage } = params;

  // Prospect-based responses
  if (prospect) {
    return buildFallbackResponse(prospect, intent);
  }

  // Market analysis fallback
  if (market) {
    const parts: string[] = ['## Market Analysis'];
    if (market.summary) parts.push(market.summary);
    if (market.keyFindings?.length) {
      parts.push('\n**Key Findings:**');
      market.keyFindings.slice(0, 5).forEach(f => parts.push(`- ${f}`));
    }
    if (market.competitors?.length) {
      parts.push('\n**Competitors:**');
      market.competitors.slice(0, 5).forEach(c => parts.push(`- **${c.name}**: ${c.description?.slice(0, 80) || 'No description'}`));
    }
    if (market.trends?.length) {
      parts.push('\n**Trends:**');
      market.trends.slice(0, 3).forEach(t => parts.push(`- ${t}`));
    }
    return parts.join('\n\n');
  }

  // Score fallback
  if (score) {
    const parts: string[] = ['## Lead Score'];
    parts.push(`**Overall Score:** ${score.overallScore}/100 — **${score.tier.toUpperCase()}** tier`);
    parts.push(`**Recommendation:** ${score.recommendation}`);
    if (score.dimensions) {
      const dims = Object.entries(score.dimensions) as [string, { score: number; reasoning: string }][];
      parts.push('\n**Dimension Breakdown:**');
      dims.forEach(([key, val]) => {
        parts.push(`- **${key}**: ${val.score}/100 — ${val.reasoning?.slice(0, 60) || ''}`);
      });
    }
    return parts.join('\n\n');
  }

  // Outreach fallback
  if (outreach) {
    const parts: string[] = ['## Outreach Message'];
    if (outreach.subject) parts.push(`**Subject:** ${outreach.subject}`);
    parts.push(`**Channel:** ${outreach.channel}`);
    parts.push(`**Tone:** ${outreach.tone}`);
    parts.push(`\n${outreach.body}`);
    if (outreach.personalizationHooks?.length) {
      parts.push('\n**Personalization Hooks:**');
      outreach.personalizationHooks.forEach(h => parts.push(`- ${h}`));
    }
    return parts.join('\n\n');
  }

  // ICP fallback
  if (icp) {
    const parts: string[] = ['## Ideal Customer Profile'];
    parts.push(`**${icp.name}**`);
    if (icp.description) parts.push(icp.description);
    if (icp.firmographic) {
      parts.push(`\n**Firmographics:** Industries: ${icp.firmographic.industries?.join(', ') || 'N/A'} | Size: ${icp.firmographic.companySizes?.join(', ') || 'N/A'} | Revenue: ${icp.firmographic.revenueRange || 'N/A'}`);
    }
    return parts.join('\n\n');
  }

  // Generic fallback
  return `I've processed your request about "${userMessage.slice(0, 50)}". The research pipeline has completed. Check the results below for details, and let me know if you'd like me to take further action.`;
}

// ============================================================
// Inner Orchestrator Implementation
// ============================================================

async function processWithOrchestratorInner(
  userMessage: string,
  context: ConversationContext | undefined,
  forceIntent: UserIntent | undefined,
  pipelineState: PipelineState,
  startTime: number,
  onEvent?: OrchestratorCallback,
  resumeFrom?: PipelineCheckpoint,
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
  pipelineState: PipelineState;
}> {

  let updatedContext: ConversationContext = context || {
    recentProspects: [], activeICP: null, lastIntent: null, lastPersona: null, userPreferences: {},
  };

  // ═══════════════════════════════════════════════════
  // RESUME PATH: If a checkpoint is provided, skip
  // the thinking phase and resume from the failed agent.
  // ═══════════════════════════════════════════════════
  let classification: IntentClassification;
  let thinking: AgentThinking;

  if (resumeFrom && resumeFrom.classifiedIntent) {
    // Skip thinking — intent is already known from checkpoint
    const personas: Record<UserIntent, AgentPersona> = {
      research_company: 'scout', research_person: 'hound', research_url: 'scout',
      analyze_market: 'analyst', analyze_competitors: 'analyst', build_icp: 'architect',
      score_lead: 'judge', compose_outreach: 'scribe', refine_search: 'scout',
      add_to_pipeline: 'navigator', clarify: 'navigator', converse: 'navigator',
    };
    classification = {
      intent: resumeFrom.classifiedIntent,
      persona: personas[resumeFrom.classifiedIntent],
      confidence: 1.0,
      reasoning: 'Resumed from checkpoint — intent already classified',
      extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
    thinking = intentToThinking(classification);

    // Mark already-completed agents in pipeline state
    for (const completedAgent of resumeFrom.completedAgents) {
      updateAgentState(pipelineState, completedAgent, {
        status: 'completed',
        currentStep: `Completed before resume`,
        progress: 100,
        completedAt: Date.now(),
      }, onEvent);
    }

    // Emit pipeline_resumed event
    emit(onEvent, { type: 'pipeline_resumed', data: {
      resumedFrom: resumeFrom.failedAgent || 'unknown',
      completedAgents: resumeFrom.completedAgents,
      failedAgent: resumeFrom.failedAgent,
    }});

    sendCommMsg(pipelineState, 'atlas', 'all', 'broadcast',
      `Pipeline resumed from checkpoint. Skipping ${resumeFrom.completedAgents.length} completed agents. Resuming from ${resumeFrom.failedAgent || 'next agent'}...`,
      { completedAgents: resumeFrom.completedAgents, failedAgent: resumeFrom.failedAgent },
      onEvent);

    console.log(`[Orchestrator] Resuming from checkpoint: completed=[${resumeFrom.completedAgents.join(',')}], failed=${resumeFrom.failedAgent}`);
  } else {
    // ═══════════════════════════════════════════════════
    // PHASE 1: THINK — Atlas classifies intent
    // ═══════════════════════════════════════════════════
    pipelineState.phase = 'thinking';
    pipelineState.thinkStartTime = Date.now();
    emit(onEvent, { type: 'thinking_start', data: { timestamp: pipelineState.thinkStartTime } });
    emit(onEvent, { type: 'pipeline_progress', data: { phase: 'thinking', overallProgress: 5 } });

    // Update Atlas status (use 'atlas' as the 8-agent key)
    updateAgentState(pipelineState, 'atlas', {
      status: 'thinking',
      currentStep: 'Classifying intent',
      progress: 0,
      startedAt: Date.now(),
    }, onEvent);

    sendCommMsg(pipelineState, 'user', 'atlas', 'request',
      `Classify this query: "${userMessage.slice(0, 100)}"`, undefined, onEvent);

    // Run intent classification
    if (forceIntent) {
      const personas: Record<UserIntent, AgentPersona> = {
        research_company: 'scout', research_person: 'hound', research_url: 'scout',
        analyze_market: 'analyst', analyze_competitors: 'analyst', build_icp: 'architect',
        score_lead: 'judge', compose_outreach: 'scribe', refine_search: 'scout',
        add_to_pipeline: 'navigator', clarify: 'navigator', converse: 'navigator',
      };
      classification = {
        intent: forceIntent,
        persona: personas[forceIntent],
        confidence: 1.0,
        reasoning: 'Intent was explicitly specified',
        extractedEntities: { companyName: null, personName: null, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    } else {
      classification = await classifyIntent(userMessage, context);
    }

    thinking = intentToThinking(classification);

    // End thinking phase
    const thinkEndTime = Date.now();
    pipelineState.totalThinkTimeMs = thinkEndTime - (pipelineState.thinkStartTime || startTime);

    // Update Atlas status to completed
    updateAgentState(pipelineState, 'atlas', {
      status: 'completed',
      currentStep: `Intent: ${classification.intent} (${Math.round(classification.confidence * 100)}% confidence)`,
      progress: 100,
      completedAt: Date.now(),
      thinkTimeMs: pipelineState.totalThinkTimeMs,
    }, onEvent);

    sendCommMsg(pipelineState, 'atlas', 'all', 'broadcast',
      `Query classified as **${classification.intent}** with ${Math.round(classification.confidence * 100)}% confidence. Activating pipeline...`,
      { intent: classification.intent, confidence: classification.confidence, persona: classification.persona },
      onEvent);

    emit(onEvent, { type: 'thinking_end', data: { totalMs: pipelineState.totalThinkTimeMs, classification } });
  }

  // ═══════════════════════════════════════════════════
  // FAST PATH: For converse/clarify intents, skip the full
  // pipeline and respond directly with a single LLM call.
  // This avoids 2-3 minutes of unnecessary pipeline execution.
  // ═══════════════════════════════════════════════════
  if (classification.intent === 'converse' || classification.intent === 'clarify') {
    let responseContent = '';
    if (classification.intent === 'clarify' && classification.clarifyingQuestion) {
      responseContent = classification.clarifyingQuestion;
    } else {
      try {
        const contextHint = buildContextHint(updatedContext);
        responseContent = await generateConversationResponse(
          'navigator', classification.intent, userMessage,
          contextHint || 'General conversation', updatedContext,
        );
      } catch {
        // LLM failed — use a hardcoded fallback
        if (classification.intent === 'converse') {
          responseContent = "I'm here to help with B2B lead generation! You can ask me to:\n\n• **Research a company** — e.g., \"Tell me about Stripe\"\n• **Find a person** — e.g., \"Look up Patrick Collison\"\n• **Analyze a market** — e.g., \"What's the SaaS market in Berlin?\"\n• **Build an ICP** — e.g., \"Help me define my ideal customer\"\n• **Score a lead** — e.g., \"Is this a good lead?\"\n• **Compose outreach** — e.g., \"Write an email to Acme Corp\"";
        } else {
          responseContent = "I'd love to help! Could you tell me more about what you're looking for? For example:\n• Research a specific company\n• Find information about a person\n• Analyze a market or industry\n• Build an Ideal Customer Profile\n• Compose an outreach message";
        }
      }
    }

    if (!responseContent) {
      responseContent = classification.intent === 'converse'
        ? "I'm here to help with B2B lead generation! Ask me to research companies, find people, analyze markets, build ICPs, score leads, or compose outreach."
        : "I'd love to help! Could you be more specific about what you're looking for?";
    }

    pipelineState.phase = 'complete';
    emit(onEvent, { type: 'pipeline_progress', data: { phase: 'complete', overallProgress: 100 } });

    // Mark echo as completed since we skip it
    updateAgentState(pipelineState, 'echo', {
      status: 'completed',
      currentStep: 'Skipped — fast path',
      progress: 100,
      completedAt: Date.now(),
    }, onEvent);

    updatedContext.lastIntent = classification.intent;
    updatedContext.lastPersona = classification.persona;

    const agentMessage: AgentMessage = {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
      persona: classification.persona,
      thinking,
      actions: [{ type: classification.intent, label: 'Direct Response', status: 'completed', message: 'Fast-path response' }],
    };

    const suggestedActions = generateSuggestedActions(classification.intent, undefined, updatedContext);

    sendCommMsg(pipelineState, 'atlas', 'user', 'response',
      `Fast path: ${classification.intent} handled directly.`, undefined, onEvent);

    console.log(`[Orchestrator] Fast-path "${userMessage.slice(0, 50)}" → intent=${classification.intent}, took=${Date.now() - startTime}ms`);

    return { message: agentMessage, updatedContext, suggestedActions, pipelineState };
  }

  // ═══════════════════════════════════════════════════
  // PHASE 2: EXECUTE — Run the 8-agent pipeline
  // ═══════════════════════════════════════════════════
  pipelineState.phase = 'executing';
  emit(onEvent, { type: 'pipeline_progress', data: { phase: 'executing', overallProgress: 15 } });

  let actions: AgentAction[] = [];
  let prospectData: ProspectResult | undefined;
  let icpData: ICPResult | undefined;
  let outreachData: OutreachResult | undefined;
  let marketData: MarketResult | undefined;
  let scoreData: ScoreResult | undefined;
  let responseContent = '';

  // Initialize partial data from checkpoint if resuming
  if (resumeFrom) {
    if (resumeFrom.partialProspectData) prospectData = resumeFrom.partialProspectData as unknown as ProspectResult;
    if (resumeFrom.partialIcpData) icpData = resumeFrom.partialIcpData as unknown as ICPResult;
    if (resumeFrom.partialScoreData) scoreData = resumeFrom.partialScoreData as unknown as ScoreResult;
    if (resumeFrom.partialOutreachData) outreachData = resumeFrom.partialOutreachData as unknown as OutreachResult;
    if (resumeFrom.partialMarketData) marketData = resumeFrom.partialMarketData as unknown as MarketResult;
    // Also restore context from partial data
    if (prospectData) {
      updatedContext.recentProspects = [...updatedContext.recentProspects, prospectData];
    }
  }

  // Create a progress callback that bridges to the orchestrator events
  const bridgeProgress: ProgressCallback = (event: string, data: unknown) => {
    if (event === 'step_start') {
      emit(onEvent, { type: 'step_start', data: data as { stepIndex: number; label: string; agent: AgentPersona; message: string } });
    } else if (event === 'step_progress') {
      emit(onEvent, { type: 'step_progress', data: data as { stepIndex: number; message: string; partialData?: Record<string, unknown> } });
    } else if (event === 'step_complete') {
      emit(onEvent, { type: 'step_complete', data: data as { stepIndex: number; status: 'completed' | 'failed'; message: string; partialData?: Record<string, unknown> } });
    } else if (event === 'insight') {
      emit(onEvent, { type: 'insight', data: data as { insight: InsightItem } });
    }
  };

  // Determine which pipeline phases to execute based on intent
  const relevantPhases = PIPELINE_PHASES.filter(phase => {
    if (!phase.intentRequired) return true; // Always run (atlas, echo)
    return phase.intentRequired.includes(classification.intent);
  });

  let stepIdx = 0;
  const totalPhases = relevantPhases.length;

  // Execute each relevant phase
  for (const phase of relevantPhases) {
    const agentKey = phase.agent; // 8-agent display name (atlas, scout, forge, etc.)

    // ═══ SKIP COMPLETED AGENTS ON RESUME ═══
    // If resuming from a checkpoint, skip agents that already completed
    if (resumeFrom && resumeFrom.completedAgents.includes(phase.agent)) {
      updateAgentState(pipelineState, agentKey, {
        status: 'completed',
        currentStep: `${phase.action} (completed before)`,
        progress: 100,
        completedAt: Date.now(),
      }, onEvent);
      stepIdx++;
      continue;
    }

    // ═══ REDUCED COOLDOWN ═══
    // Cooldown between agent phases to respect rate limit (concurrency=1).
    // Reduced from 2-3.5s to 0.5-1.5s for faster pipeline execution.
    if (stepIdx > 0) {
      const isSearchPhase = phase.agent === 'scout';
      const cooldownMs = isSearchPhase
        ? 500 + Math.random() * 500    // 0.5-1s for search phases
        : 1000 + Math.random() * 500;  // 1-1.5s for LLM phases

      updateAgentState(pipelineState, agentKey, {
        status: 'waiting',
        currentStep: `Cooldown (${Math.round(cooldownMs / 1000)}s)`,
        progress: 0,
        startedAt: Date.now(),
      }, onEvent);

      sendCommMsg(pipelineState, 'atlas', agentKey, 'status',
        `Cooldown: ${Math.round(cooldownMs / 1000)}s before starting`,
        { cooldownMs, reason: 'rate_limit_buffer' },
        onEvent);

      emit(onEvent, { type: 'cooldown', data: { agent: agentKey, cooldownMs, reason: 'rate_limit_buffer' } });
      emit(onEvent, { type: 'pipeline_progress', data: { phase: 'executing', overallProgress: Math.round(15 + (stepIdx / totalPhases) * 70 - 2) } });

      await new Promise(r => setTimeout(r, cooldownMs));
    }

    // Update agent state to working
    updateAgentState(pipelineState, agentKey, {
      status: 'working',
      currentStep: phase.action,
      progress: 0,
      startedAt: Date.now(),
    }, onEvent);

    // Atlas tells the agent what to do
    if (phase.agent !== 'atlas') {
      sendCommMsg(pipelineState, 'atlas', agentKey, 'request',
        `[${agentKey.toUpperCase()}] ${phase.action} for query: "${userMessage.slice(0, 80)}"`,
        { intent: classification.intent, phase: agentKey },
        onEvent);
    }

    // Progress calculation
    const baseProgress = 15 + (stepIdx / totalPhases) * 70;
    emit(onEvent, { type: 'pipeline_progress', data: { phase: 'executing', overallProgress: Math.round(baseProgress) } });

    // Execute the actual work based on the agent
    try {
      switch (phase.agent) {
        case 'atlas':
          // Already done (intent classification)
          sendCommMsg(pipelineState, 'atlas', 'all', 'broadcast',
            `Pipeline plan: ${relevantPhases.map(p => p.agent).join(' → ')}`, undefined, onEvent);
          break;

        case 'scout':
          // Scout: Company/Person/URL research
          if (['research_company', 'research_url', 'refine_search'].includes(classification.intent)) {
            const companyName = classification.extractedEntities.companyName || userMessage.trim();
            sendCommMsg(pipelineState, 'atlas', 'scout', 'handoff',
              `Research target: "${companyName}"`, { target: companyName }, onEvent);

            const result = await executeCompanyResearch(companyName, bridgeProgress);
            actions = [...actions, ...result.steps];

            if (result.prospect) {
              prospectData = result.prospect;
              updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];

              sendCommMsg(pipelineState, 'scout', 'atlas', 'response',
                `Found data for "${result.prospect.companyName}" — ${result.prospect.dataCompleteness}% complete`,
                { completeness: result.prospect.dataCompleteness, companyName: result.prospect.companyName },
                onEvent);
            } else {
              sendCommMsg(pipelineState, 'scout', 'atlas', 'response',
                'Limited data found. Continuing with partial results.', undefined, onEvent);
            }
          } else if (classification.intent === 'research_person') {
            const personName = classification.extractedEntities.personName || userMessage.trim();
            sendCommMsg(pipelineState, 'atlas', 'scout', 'handoff',
              `Research person: "${personName}"`, { target: personName }, onEvent);

            const result = await executePersonResearch(personName, bridgeProgress);
            actions = [...actions, ...result.steps];
            if (result.prospect) {
              prospectData = result.prospect;
              updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];

              sendCommMsg(pipelineState, 'scout', 'atlas', 'response',
                `Found data for "${result.prospect.personName}" — ${result.prospect.dataCompleteness}% complete`,
                { completeness: result.prospect.dataCompleteness, personName: result.prospect.personName },
                onEvent);
            }
          }
          break;

        case 'forge':
          // Forge: Data enrichment — deep crawl and gap fill
          if (prospectData && prospectData.dataCompleteness < 80) {
            sendCommMsg(pipelineState, 'scout', 'forge', 'handoff',
              `Enriching data (currently ${prospectData.dataCompleteness}% complete)`,
              { completeness: prospectData.dataCompleteness }, onEvent);

            // Try additional enrichment searches
            const enrichActions: AgentAction = {
              type: 'research_company', label: 'Deep Enrichment', status: 'running',
              message: `Enriching ${prospectData.companyName || 'prospect'} data...`,
            };
            actions.push(enrichActions);
            const enrichIdx = actions.length - 1;

            try {
              // Try LinkedIn search for enrichment
              if (prospectData.companyName) {
                const liResult = await linkedInSearchCompanies(prospectData.companyName, 3);
                if (liResult.success && liResult.data.length > 0) {
                  const topResult = liResult.data[0];
                  if (!prospectData.linkedinUrl && topResult.url) prospectData.linkedinUrl = topResult.url;
                  if (!prospectData.description && topResult.headline) prospectData.description = topResult.headline;
                }
              }

              // Try web search for missing data points
              if (prospectData.companyName) {
                const gapQueries: string[] = [];
                if (!prospectData.ceoName) gapQueries.push(`"${prospectData.companyName}" CEO founder executive`);
                if (!prospectData.revenueEstimate) gapQueries.push(`"${prospectData.companyName}" revenue funding valuation`);
                if (!prospectData.employeeCount) gapQueries.push(`"${prospectData.companyName}" employees team size`);

                if (gapQueries.length > 0) {
                  const gapSearch = await exaSearch(gapQueries[0], 3);
                  if (gapSearch.success && gapSearch.data.length > 0) {
                    const allText = gapSearch.data.map(r => `${r.title} ${r.snippet}`).join(' ');

                    // Simple regex extraction for common missing fields
                    if (!prospectData.ceoName) {
                      const ceoMatch = allText.match(/(?:CEO|Chief Executive|Founder)[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/);
                      if (ceoMatch) prospectData.ceoName = ceoMatch[1];
                    }
                    if (!prospectData.revenueEstimate) {
                      const revMatch = allText.match(/\$[\d.]+[BbMmKk]/);
                      if (revMatch) prospectData.revenueEstimate = revMatch[0];
                    }
                    if (!prospectData.employeeCount) {
                      const empMatch = allText.match(/(\d[\d,+]*)\s*(?:employees|team members|staff|people)/i);
                      if (empMatch) prospectData.employeeCount = empMatch[1];
                    }
                  }
                }
              }

              // Recalculate completeness
              prospectData.dataCompleteness = calculateQuickCompleteness(prospectData);

              actions[enrichIdx] = { ...enrichActions, status: 'completed', message: `Enrichment complete — ${prospectData.dataCompleteness}% data` };
              sendCommMsg(pipelineState, 'forge', 'atlas', 'response',
                `Enrichment brought data to ${prospectData.dataCompleteness}%`, undefined, onEvent);
            } catch (e) {
              actions[enrichIdx] = { ...enrichActions, status: 'completed', message: 'Enrichment partially completed' };
            }
          }
          break;

        case 'sage':
          // Sage: Market/Competitive analysis
          if (classification.intent === 'analyze_market') {
            const result = await executeMarketAnalysis(userMessage);
            actions = [...actions, ...result.steps];
            if (result.market) {
              marketData = result.market;
              sendCommMsg(pipelineState, 'sage', 'atlas', 'response',
                `Market analysis complete: ${result.market.keyFindings.length} findings, ${result.market.competitors.length} competitors`,
                { findings: result.market.keyFindings.length, competitors: result.market.competitors.length },
                onEvent);
            }
          } else if (classification.intent === 'analyze_competitors') {
            const result = await executeCompetitiveAnalysis(userMessage);
            actions = [...actions, ...result.steps];
            if (result.market) {
              marketData = result.market;
              sendCommMsg(pipelineState, 'sage', 'atlas', 'response',
                `Competitive analysis complete`,
                undefined, onEvent);
            }
          }
          break;

        case 'judge':
          // Judge: Lead scoring
          {
            const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
            if (recentProspect) {
              sendCommMsg(pipelineState, 'atlas', 'judge', 'request',
                `Score ${recentProspect.companyName || recentProspect.personName} against ICP`,
                { companyName: recentProspect.companyName }, onEvent);

              const result = await executeLeadScoring(recentProspect, updatedContext.activeICP);
              actions = [...actions, ...result.steps];
              if (result.score) {
                scoreData = result.score;
                sendCommMsg(pipelineState, 'judge', 'atlas', 'response',
                  `Lead score: ${result.score.overallScore}/100 (${result.score.tier})`,
                  { score: result.score.overallScore, tier: result.score.tier },
                  onEvent);
              }
            } else if (classification.intent === 'score_lead') {
              responseContent = "I don't have a prospect to score yet. Please research a company or person first, then I can score them against your ICP.";
            }
          }
          break;

        case 'bard':
          // Bard: Outreach composition
          {
            const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
            if (recentProspect) {
              const channel = userMessage.toLowerCase().includes('linkedin') ? 'linkedin' : 'email';
              sendCommMsg(pipelineState, 'atlas', 'bard', 'request',
                `Compose ${channel} outreach for ${recentProspect.companyName || recentProspect.personName}`,
                { channel, target: recentProspect.companyName }, onEvent);

              const result = await executeOutreachComposition(recentProspect, channel);
              actions = [...actions, ...result.steps];
              if (result.outreach) {
                outreachData = result.outreach;
                sendCommMsg(pipelineState, 'bard', 'atlas', 'response',
                  `${channel} outreach composed with ${result.outreach.personalizationHooks?.length || 0} personalization hooks`,
                  { channel, hooks: result.outreach.personalizationHooks?.length },
                  onEvent);
              }
            } else if (classification.intent === 'compose_outreach') {
              const target = userMessage.replace(/^(?:write|compose|draft|send|email|reach out|craft)\s*(?:an?\s*)?(?:email|message|outreach|connection)?\s*(?:to\s*)?/i, '').trim();
              if (target.length > 2) {
                responseContent = `I need to research "${target}" first to write a personalized message. Would you like me to research them?`;
              } else {
                responseContent = "I need a prospect to compose outreach for. Please research a company or person first.";
              }
            }
          }
          break;

        case 'flow':
          // Flow: Pipeline management — saves session context and manages pipeline state
          if (classification.intent === 'build_icp') {
            const result = await executeICPBuilding(userMessage, updatedContext.activeICP);
            actions = [...actions, ...result.steps];
            if (result.icp) {
              icpData = result.icp;
              updatedContext.activeICP = result.icp;
              responseContent = result.response;
            }
          } else if (classification.intent === 'add_to_pipeline') {
            const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
            const name = recentProspect?.companyName || recentProspect?.personName || 'this prospect';
            responseContent = `Click the "Add to Leads" button below to add ${name} to your lead pipeline.`;
          } else {
            // Flow manages pipeline context for all other intents
            const prospectCount = updatedContext.recentProspects.length;
            const hasICP = !!updatedContext.activeICP;
            const hasScoredLeads = updatedContext.recentProspects.some(p => (p as unknown as Record<string, unknown>).leadScore !== undefined);
            let flowMsg = `Pipeline context: ${prospectCount} prospect(s) discovered`;
            if (hasICP) flowMsg += `, ICP active`;
            if (hasScoredLeads) flowMsg += `, leads scored`;
            flowMsg += '. ';
            if (prospectCount > 0 && !hasICP) {
              flowMsg += 'Suggest building an ICP to improve qualification.';
            } else if (hasScoredLeads) {
              flowMsg += 'Recommend composing outreach for scored leads.';
            } else if (prospectCount > 0) {
              flowMsg += 'Recommend scoring prospects against ICP.';
            }
            sendCommMsg(pipelineState, 'flow', 'atlas', 'response', flowMsg, undefined, onEvent);
          }
          break;

        case 'echo':
          // Echo: Insights and reporting — compiles final insights from all agents
          {
            const echoInsights: string[] = [];
            if (prospectData) {
              echoInsights.push(`Prospect research completed for ${prospectData.companyName || prospectData.personName || 'target'}`);
              if (prospectData.employeeCount || prospectData.revenueEstimate) {
                echoInsights.push(`Firmographics: ${[prospectData.employeeCount ? `${prospectData.employeeCount} employees` : '', prospectData.revenueEstimate ? `~${prospectData.revenueEstimate} revenue` : ''].filter(Boolean).join(', ')}`);
              }
            }
            if (marketData) {
              echoInsights.push(`Market analysis available with ${marketData.competitors?.length || 0} competitors identified`);
            }
            if (scoreData) {
              echoInsights.push(`Lead scored: ${scoreData.overallScore}/100 (${scoreData.tier || 'unrated'} tier)`);
            }
            if (outreachData) {
              echoInsights.push(`Outreach message composed`);
            }
            if (icpData) {
              echoInsights.push(`ICP profile: ${icpData.name || 'Active ICP'}`);
            } else if (updatedContext.activeICP) {
              icpData = updatedContext.activeICP;
              echoInsights.push(`Existing ICP included: ${updatedContext.activeICP.name || 'Active ICP'}`);
            }

            if (echoInsights.length > 0) {
              const echoReport = echoInsights.join('. ') + '.';
              sendCommMsg(pipelineState, 'echo', 'atlas', 'response', echoReport, undefined, onEvent);
            } else {
              sendCommMsg(pipelineState, 'echo', 'atlas', 'response', 'Pipeline completed. No structured data to report — try researching a specific company or person.', undefined, onEvent);
            }
          }
          break;
      }
    } catch (phaseError) {
      const msg = phaseError instanceof Error ? phaseError.message : 'Unknown error';
      console.warn(`[Orchestrator] Phase ${phase.agent} failed: ${msg}`);

      if (!phase.optional) {
        // Non-optional phase failed — still continue with other phases
      }
      updateAgentState(pipelineState, agentKey, {
        status: 'failed',
        currentStep: phase.action,
        completedAt: Date.now(),
      }, onEvent);

      sendCommMsg(pipelineState, agentKey, 'atlas', 'response',
        `Phase failed: ${msg.slice(0, 100)}`, { error: msg.slice(0, 200) }, onEvent);
    }

    // Update agent state to completed
    updateAgentState(pipelineState, agentKey, {
      status: 'completed',
      currentStep: phase.action,
      progress: 100,
      completedAt: Date.now(),
    }, onEvent);

    stepIdx++;
  }

  // ═══════════════════════════════════════════════════
  // PHASE 3: SYNTHESIZE — Generate conversational response
  // ═══════════════════════════════════════════════════
  pipelineState.phase = 'synthesizing';
  emit(onEvent, { type: 'pipeline_progress', data: { phase: 'synthesizing', overallProgress: 85 } });

  // Reduced cooldown before synthesis (0.5-1s instead of 1.5-2.5s)
  const synthCooldownMs = 500 + Math.random() * 500;
  updateAgentState(pipelineState, 'atlas', {
    status: 'waiting',
    currentStep: `Cooldown before synthesis (${Math.round(synthCooldownMs / 1000)}s)`,
    progress: 0,
    startedAt: Date.now(),
  }, onEvent);

  emit(onEvent, { type: 'cooldown', data: { agent: 'atlas', cooldownMs: synthCooldownMs, reason: 'rate_limit_buffer' } });

  await new Promise(r => setTimeout(r, synthCooldownMs));

  updateAgentState(pipelineState, 'atlas', {
    status: 'working',
    currentStep: 'Synthesizing response',
    progress: 50,
    startedAt: Date.now(),
  }, onEvent);

  sendCommMsg(pipelineState, 'atlas', 'echo', 'request',
    'Synthesize all agent outputs into a coherent response', undefined, onEvent);

  // Generate conversational response with robust fallback chain
  if (!responseContent) {
    if (prospectData) {
      const actionSummary = buildResearchSummary(prospectData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable — will use fallback */ }
      if (!responseContent) {
        responseContent = buildFallbackResponse(prospectData, classification.intent);
      }
    } else if (marketData) {
      const actionSummary = JSON.stringify({
        summary: marketData.summary,
        findings: marketData.keyFindings,
        competitors: marketData.competitors.map(c => c.name),
        trends: marketData.trends,
      });
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable — will use fallback */ }
      if (!responseContent) {
        responseContent = buildRichFallbackResponse({ intent: classification.intent, market: marketData, userMessage });
      }
    } else if (scoreData) {
      const actionSummary = JSON.stringify(scoreData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable — will use fallback */ }
      if (!responseContent) {
        responseContent = buildRichFallbackResponse({ intent: classification.intent, score: scoreData, userMessage });
      }
    } else if (outreachData) {
      const actionSummary = JSON.stringify(outreachData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable — will use fallback */ }
      if (!responseContent) {
        responseContent = buildRichFallbackResponse({ intent: classification.intent, outreach: outreachData, userMessage });
      }
    } else if (icpData) {
      responseContent = buildRichFallbackResponse({ intent: classification.intent, icp: icpData, userMessage });
    }
    // Note: 'clarify' intent is handled in the fast path above, before the full pipeline
  }

  // Fallback using structured data (no LLM needed)
  if (!responseContent && (prospectData || icpData || marketData || scoreData || outreachData)) {
    responseContent = generateStructuredFallback({
      persona: classification.persona,
      intent: classification.intent,
      userMessage,
      actionSummary: prospectData ? buildResearchSummary(prospectData) :
                     icpData ? JSON.stringify(icpData) :
                     marketData ? JSON.stringify(marketData) :
                     scoreData ? JSON.stringify(scoreData) :
                     outreachData ? JSON.stringify(outreachData) : '{}',
      context: buildContextHint(updatedContext),
    });
  }

  // Final fallback
  if (!responseContent) {
    responseContent = "I've processed your request. Check the research results below for details, and let me know if you'd like me to take any further action like scoring this lead or composing outreach.";
  }

  // ═══════════════════════════════════════════════════
  // PHASE 4: COMPLETE — Generate insights & finalize
  // ═══════════════════════════════════════════════════
  pipelineState.phase = 'complete';
  emit(onEvent, { type: 'pipeline_progress', data: { phase: 'complete', overallProgress: 100 } });

  // Generate insights
  const insights = generateInsights(classification.intent, prospectData, icpData, scoreData, marketData, outreachData, updatedContext);
  if (onEvent && insights.length > 0) {
    for (const insight of insights) {
      emit(onEvent, { type: 'insight', data: { insight } });
    }
  }

  // Generate navigation suggestions
  const navigation = generateNavigationSuggestions(classification.intent, prospectData, icpData, scoreData, outreachData, marketData);

  // Update context
  updatedContext.lastIntent = classification.intent;
  updatedContext.lastPersona = classification.persona;

  // Build the agent message
  const agentMessage: AgentMessage = {
    id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role: 'assistant',
    content: responseContent,
    timestamp: new Date(),
    persona: classification.persona,
    thinking,
    actions,
    prospectData,
    icpData,
    outreachData,
    marketData,
    scoreData,
    insights: insights.length > 0 ? insights : undefined,
    navigation: navigation.length > 0 ? navigation : undefined,
  };

  // Generate suggested actions
  const suggestedActions = generateSuggestedActions(classification.intent, prospectData, updatedContext);

  // Final comm message
  sendCommMsg(pipelineState, 'atlas', 'user', 'response',
    `Pipeline complete. ${actions.length} steps executed, ${actions.filter(a => a.status === 'completed').length} succeeded.`,
    { steps: actions.length, completed: actions.filter(a => a.status === 'completed').length },
    onEvent);

  console.log(`[Orchestrator] Processed "${userMessage.slice(0, 50)}" → intent=${classification.intent}, took=${Date.now() - startTime}ms`);

  return {
    message: agentMessage,
    updatedContext,
    suggestedActions,
    pipelineState,
  };
}

// ============================================================
// Helper Functions
// ============================================================

function calculateQuickCompleteness(prospect: ProspectResult): number {
  const fields: Array<{ key: keyof ProspectResult; weight: number }> = [
    { key: 'companyName', weight: 10 },
    { key: 'website', weight: 8 },
    { key: 'industry', weight: 8 },
    { key: 'description', weight: 6 },
    { key: 'ceoName', weight: 7 },
    { key: 'employeeCount', weight: 6 },
    { key: 'revenueEstimate', weight: 6 },
    { key: 'generalEmail', weight: 6 },
    { key: 'phoneMain', weight: 5 },
    { key: 'linkedinUrl', weight: 5 },
    { key: 'city', weight: 4 },
    { key: 'country', weight: 4 },
    { key: 'foundingYear', weight: 3 },
    { key: 'twitterHandle', weight: 3 },
    { key: 'fundingInfo', weight: 4 },
    { key: 'techStack', weight: 5 },
    { key: 'recentNews', weight: 5 },
    { key: 'productsServices', weight: 5 },
  ];

  let total = 0;
  let maxTotal = 0;
  for (const { key, weight } of fields) {
    maxTotal += weight;
    const val = prospect[key];
    if (val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0)) {
      total += weight;
    }
  }
  return Math.round((total / maxTotal) * 100);
}

function buildResearchSummary(prospect: ProspectResult): string {
  return JSON.stringify({
    company: prospect.companyName,
    person: prospect.personName,
    industry: prospect.industry,
    employees: prospect.employeeCount,
    revenue: prospect.revenueEstimate,
    ceo: prospect.ceoName,
    keyContact: prospect.keyContactName,
    email: prospect.keyContactEmail || prospect.generalEmail,
    linkedin: prospect.linkedinUrl,
    website: prospect.website,
    techStack: prospect.techStack?.slice(0, 5),
    recentNews: prospect.recentNews?.slice(0, 2),
    completeness: prospect.dataCompleteness,
  });
}

function buildFallbackResponse(prospect: ProspectResult, intent: UserIntent): string {
  const parts: string[] = [];
  if (prospect.companyName) parts.push(`**${prospect.companyName}**`);
  if (prospect.description) parts.push(prospect.description);
  if (prospect.industry) parts.push(`**Industry:** ${prospect.industry}`);
  if (prospect.employeeCount) parts.push(`**Employees:** ${prospect.employeeCount}`);
  if (prospect.revenueEstimate) parts.push(`**Revenue:** ${prospect.revenueEstimate}`);
  if (prospect.ceoName) parts.push(`**CEO:** ${prospect.ceoName}`);
  if (prospect.city || prospect.country) parts.push(`**Location:** ${[prospect.city, prospect.country].filter(Boolean).join(', ')}`);
  if (prospect.website) parts.push(`**Website:** ${prospect.website}`);
  if (prospect.generalEmail) parts.push(`**Email:** ${prospect.generalEmail}`);
  if (prospect.linkedinUrl) parts.push(`**LinkedIn:** available`);
  if (prospect.techStack?.length) parts.push(`**Tech Stack:** ${prospect.techStack.join(', ')}`);
  if (prospect.recentNews?.length) parts.push(`**Recent News:**\n${prospect.recentNews.slice(0, 3).map(n => `- ${n}`).join('\n')}`);
  if (prospect.detectedDomain && prospect.detectedDomain !== 'general') {
    parts.push(`\n**Domain:** ${prospect.domainLabel || prospect.detectedDomain} — 4-Phase Pipeline Active`);
  }
  parts.push(`\n*Data completeness: ${prospect.dataCompleteness}%*`);
  if (prospect.dataCompleteness >= 60) {
    parts.push('Would you like me to score this lead, compose outreach, or find similar companies?');
  }
  return parts.join('\n\n');
}

function buildContextHint(context: ConversationContext): string {
  const parts: string[] = [];
  if (context.recentProspects.length > 0) {
    parts.push(`Recently discussed: ${context.recentProspects.map(p => p.companyName || p.personName).filter(Boolean).join(', ')}`);
  }
  if (context.activeICP) parts.push(`Active ICP: ${context.activeICP.name}`);
  return parts.join('; ');
}

function generateInsights(
  intent: UserIntent,
  prospect?: ProspectResult,
  icp?: ICPResult,
  score?: ScoreResult,
  market?: MarketResult,
  outreach?: OutreachResult,
  context?: ConversationContext,
): InsightItem[] {
  const insights: InsightItem[] = [];
  let id = 0;

  if (prospect?.fundingInfo && /raised|funding|series/i.test(prospect.fundingInfo)) {
    insights.push({
      id: `insight-${id++}`, type: 'opportunity', icon: 'TrendingUp',
      title: 'Funding Activity', description: `${prospect.companyName} recently raised funding: ${prospect.fundingInfo}. This often signals readiness for new tools and partnerships.`,
      confidence: 0.8, relatedDimension: 'behavioral',
    });
  }

  if (prospect?.techStack && prospect.techStack.length > 0) {
    insights.push({
      id: `insight-${id++}`, type: 'alignment', icon: 'Zap',
      title: 'Tech Adoption Signal', description: `Active use of ${prospect.techStack.slice(0, 3).join(', ')} indicates technology adoption readiness and potential integration points.`,
      confidence: 0.7, relatedDimension: 'technographic',
    });
  }

  if (prospect?.recentNews?.some(n => /hiring|expanding|growth/i.test(n))) {
    insights.push({
      id: `insight-${id++}`, type: 'opportunity', icon: 'Users',
      title: 'Growth Activity', description: `Recent news indicates expansion at ${prospect.companyName}. Growing companies typically have higher budgets and urgency for solutions.`,
      confidence: 0.75, relatedDimension: 'behavioral',
    });
  }

  if (score && score.overallScore >= 70) {
    insights.push({
      id: `insight-${id++}`, type: 'action', icon: 'Target',
      title: 'Strong Lead Match', description: `Score of ${score.overallScore}/100 (${score.tier} tier) indicates strong ICP alignment. Prioritize outreach.`,
      confidence: 0.85, relatedDimension: 'economic',
    });
  }

  if (prospect?.dataCompleteness && prospect.dataCompleteness < 40) {
    insights.push({
      id: `insight-${id++}`, type: 'gap', icon: 'AlertCircle',
      title: 'Data Gap', description: `Only ${prospect.dataCompleteness}% data completeness. Consider providing a website URL for deeper research.`,
      confidence: 0.9, relatedDimension: 'firmographic',
    });
  }

  return insights;
}

function generateNavigationSuggestions(
  intent: UserIntent,
  prospect?: ProspectResult,
  icp?: ICPResult,
  score?: ScoreResult,
  outreach?: OutreachResult,
  market?: MarketResult,
): NavigationSuggestion[] {
  const suggestions: NavigationSuggestion[] = [];

  if (prospect && intent !== 'compose_outreach') {
    suggestions.push({
      targetView: 'leads', label: 'View in Leads', icon: 'Plus',
      reason: 'Add this prospect to your lead pipeline',
    });
  }

  if (icp) {
    suggestions.push({
      targetView: 'icp', label: 'View ICP Builder', icon: 'Target',
      reason: 'Review and refine the ICP profile',
    });
  }

  return suggestions;
}

function generateSuggestedActions(
  intent: UserIntent,
  prospect?: ProspectResult,
  context?: ConversationContext,
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];
  const hasICP = !!context?.activeICP;
  const prospectName = prospect?.companyName || prospect?.personName;

  switch (intent) {
    case 'research_company':
    case 'research_person':
    case 'research_url':
      if (prospect) {
        if (hasICP) {
          actions.push({ label: 'Score Against ICP', prompt: `Score ${prospectName} against my ICP`, icon: 'Star' });
        } else {
          actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
        }
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        if (prospect.industry) {
          actions.push({ label: 'Find Similar', prompt: `Find similar companies in ${prospect.industry}`, icon: 'Search' });
        }
      }
      break;

    case 'analyze_market':
    case 'analyze_competitors':
      actions.push({ label: 'Research Top Company', prompt: 'Research the top company from this analysis', icon: 'Building2' });
      if (!hasICP) actions.push({ label: 'Build an ICP', prompt: 'Build an ICP for this market', icon: 'Target' });
      break;

    case 'score_lead':
      if (prospect) {
        actions.push({ label: 'Compose Outreach', prompt: `Write an email to ${prospectName}`, icon: 'Mail' });
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
      }
      break;

    case 'compose_outreach':
      if (prospect) {
        actions.push({ label: 'Add to Leads', prompt: 'Add this prospect to my leads', icon: 'Plus' });
        actions.push({ label: 'Find Similar', prompt: 'Find similar companies', icon: 'Search' });
      }
      break;

    default:
      actions.push({ label: 'Research a Company', prompt: 'I want to research a company', icon: 'Building2' });
      if (!hasICP) actions.push({ label: 'Build an ICP', prompt: 'Help me build an Ideal Customer Profile', icon: 'Target' });
      break;
  }

  return actions.slice(0, 4);
}
