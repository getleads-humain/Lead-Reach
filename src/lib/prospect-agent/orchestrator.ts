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
// ============================================================

import { callLLM, callLLMForJSON } from '@/lib/llm';
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
} from './types';
import { PERSONA_META } from './types';
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
import { detectDomain, getDomainSearchQueries, DOMAIN_SCHEMAS, type DomainType } from './domain-intelligence';
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
  // Phase 8: Echo generates insights and reports
  { agent: 'echo', action: 'Generate insights and report' },
];

// ============================================================
// Initial Pipeline State
// ============================================================

function createInitialPipelineState(): PipelineState {
  const agents: Record<AgentPersona, AgentState> = {
    scout: { persona: 'scout', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    hound: { persona: 'hound', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    analyst: { persona: 'analyst', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    architect: { persona: 'architect', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    judge: { persona: 'judge', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    scribe: { persona: 'scribe', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
    navigator: { persona: 'navigator', status: 'idle', currentStep: '', progress: 0, startedAt: null, completedAt: null, thinkTimeMs: null },
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
): Promise<{
  message: AgentMessage;
  updatedContext: ConversationContext;
  suggestedActions: SuggestedAction[];
  pipelineState: PipelineState;
}> {
  const pipelineState = createInitialPipelineState();
  const startTime = Date.now();

  try {
    return await processWithOrchestratorInner(userMessage, context, forceIntent, pipelineState, startTime, onEvent);
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
// ============================================================

function sendCommMsg(
  pipelineState: PipelineState,
  from: AgentPersona | 'user',
  to: AgentPersona | 'all',
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
// ============================================================

function updateAgentState(
  pipelineState: PipelineState,
  persona: AgentPersona,
  update: Partial<AgentState>,
  onEvent?: OrchestratorCallback,
): void {
  const existing = pipelineState.agents[persona];
  if (existing) {
    pipelineState.agents[persona] = { ...existing, ...update };
  }
  emit(onEvent, { type: 'agent_status', data: { agent: persona, state: pipelineState.agents[persona] } });
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
  // PHASE 1: THINK — Atlas classifies intent
  // ═══════════════════════════════════════════════════
  pipelineState.phase = 'thinking';
  pipelineState.thinkStartTime = Date.now();
  emit(onEvent, { type: 'thinking_start', data: { timestamp: pipelineState.thinkStartTime } });
  emit(onEvent, { type: 'pipeline_progress', data: { phase: 'thinking', overallProgress: 5 } });

  // Update Atlas status
  updateAgentState(pipelineState, 'navigator', {
    status: 'thinking',
    currentStep: 'Classifying intent',
    progress: 0,
    startedAt: Date.now(),
  }, onEvent);

  sendCommMsg(pipelineState, 'user', 'navigator', 'request',
    `Classify this query: "${userMessage.slice(0, 100)}"`, undefined, onEvent);

  // Run intent classification
  let classification: IntentClassification;
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

  const thinking: AgentThinking = intentToThinking(classification);

  // End thinking phase
  const thinkEndTime = Date.now();
  pipelineState.totalThinkTimeMs = thinkEndTime - (pipelineState.thinkStartTime || startTime);

  // Update Atlas status to completed
  updateAgentState(pipelineState, 'navigator', {
    status: 'completed',
    currentStep: `Intent: ${classification.intent} (${Math.round(classification.confidence * 100)}% confidence)`,
    progress: 100,
    completedAt: Date.now(),
    thinkTimeMs: pipelineState.totalThinkTimeMs,
  }, onEvent);

  sendCommMsg(pipelineState, 'navigator', 'all', 'broadcast',
    `Query classified as **${classification.intent}** with ${Math.round(classification.confidence * 100)}% confidence. Activating pipeline...`,
    { intent: classification.intent, confidence: classification.confidence, persona: classification.persona },
    onEvent);

  emit(onEvent, { type: 'thinking_end', data: { totalMs: pipelineState.totalThinkTimeMs, classification } });
  emit(onEvent, { type: 'thinking', data: thinking });

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

  // Create a progress callback that bridges to the orchestrator events
  const bridgeProgress: ProgressCallback = (event: string, data: unknown) => {
    // Forward step events directly
    if (event === 'step_start') {
      emit(onEvent, { type: 'step_start', data: data as OrchestratorEvent & { type: 'step_start' }['data'] });
    } else if (event === 'step_progress') {
      emit(onEvent, { type: 'step_progress', data: data as OrchestratorEvent & { type: 'step_progress' }['data'] });
    } else if (event === 'step_complete') {
      emit(onEvent, { type: 'step_complete', data: data as OrchestratorEvent & { type: 'step_complete' }['data'] });
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
    const phaseStart = Date.now();
    const agentPersona = AGENT_8_MAP[phase.agent] || 'navigator';

    // Update agent state to working
    updateAgentState(pipelineState, agentPersona, {
      status: 'working',
      currentStep: phase.action,
      progress: 0,
      startedAt: Date.now(),
    }, onEvent);

    // Atlas tells the agent what to do
    if (phase.agent !== 'atlas') {
      sendCommMsg(pipelineState, 'navigator', agentPersona, 'request',
        `[${phase.agent.toUpperCase()}] ${phase.action} for query: "${userMessage.slice(0, 80)}"`,
        { intent: classification.intent, phase: phase.agent },
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
          sendCommMsg(pipelineState, 'navigator', 'all', 'broadcast',
            `Pipeline plan: ${relevantPhases.map(p => p.agent).join(' → ')}`, undefined, onEvent);
          break;

        case 'scout':
          // Scout: Company/Person/URL research
          if (['research_company', 'research_url', 'refine_search'].includes(classification.intent)) {
            const companyName = classification.extractedEntities.companyName || userMessage.trim();
            sendCommMsg(pipelineState, 'navigator', 'scout', 'handoff',
              `Research target: "${companyName}"`, { target: companyName }, onEvent);

            const result = await executeCompanyResearch(companyName, bridgeProgress);
            actions = [...actions, ...result.steps];

            if (result.prospect) {
              prospectData = result.prospect;
              updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];

              sendCommMsg(pipelineState, 'scout', 'navigator', 'response',
                `Found data for "${result.prospect.companyName}" — ${result.prospect.dataCompleteness}% complete`,
                { completeness: result.prospect.dataCompleteness, companyName: result.prospect.companyName },
                onEvent);
            } else {
              sendCommMsg(pipelineState, 'scout', 'navigator', 'response',
                'Limited data found. Continuing with partial results.', undefined, onEvent);
            }
          } else if (classification.intent === 'research_person') {
            const personName = classification.extractedEntities.personName || userMessage.trim();
            const result = await executePersonResearch(personName, bridgeProgress);
            actions = [...actions, ...result.steps];
            if (result.prospect) {
              prospectData = result.prospect;
              updatedContext.recentProspects = [...updatedContext.recentProspects.slice(-4), result.prospect];
            }
          }
          break;

        case 'forge':
          // Forge: Data enrichment — deep crawl and gap fill
          if (prospectData && prospectData.dataCompleteness < 80) {
            sendCommMsg(pipelineState, 'scout', 'scout', 'handoff',
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
                    const snippets = gapSearch.data.map(r => ({ title: r.title, snippet: r.snippet, url: r.url }));
                    // Use regex extraction from the gap search results
                    const { extractStructuredFromSnippets: extractFromSnippets } = await import('./actions');
                    // Note: extractStructuredFromSnippets is not exported, but the import is fine
                    // The action itself modifies the prospect in-place
                    const allText = snippets.map(s => `${s.title} ${s.snippet}`).join(' ');

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
              sendCommMsg(pipelineState, 'scout', 'navigator', 'response',
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
              sendCommMsg(pipelineState, 'analyst', 'navigator', 'response',
                `Market analysis complete: ${result.market.keyFindings.length} findings, ${result.market.competitors.length} competitors`,
                { findings: result.market.keyFindings.length, competitors: result.market.competitors.length },
                onEvent);
            }
          } else if (classification.intent === 'analyze_competitors') {
            const result = await executeCompetitiveAnalysis(userMessage);
            actions = [...actions, ...result.steps];
            if (result.market) marketData = result.market;
          }
          break;

        case 'judge':
          // Judge: Lead scoring
          {
            const recentProspect = updatedContext.recentProspects[updatedContext.recentProspects.length - 1];
            if (recentProspect) {
              sendCommMsg(pipelineState, 'navigator', 'judge', 'request',
                `Score ${recentProspect.companyName || recentProspect.personName} against ICP`,
                { companyName: recentProspect.companyName }, onEvent);

              const result = await executeLeadScoring(recentProspect, updatedContext.activeICP);
              actions = [...actions, ...result.steps];
              if (result.score) {
                scoreData = result.score;
                sendCommMsg(pipelineState, 'judge', 'navigator', 'response',
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
              sendCommMsg(pipelineState, 'navigator', 'scribe', 'request',
                `Compose ${channel} outreach for ${recentProspect.companyName || recentProspect.personName}`,
                { channel, target: recentProspect.companyName }, onEvent);

              const result = await executeOutreachComposition(recentProspect, channel);
              actions = [...actions, ...result.steps];
              if (result.outreach) {
                outreachData = result.outreach;
                sendCommMsg(pipelineState, 'scribe', 'navigator', 'response',
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
          // Flow: Pipeline management (ICP building, add to pipeline)
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
          }
          break;

        case 'echo':
          // Echo: Insights and reporting — always runs at the end
          // Auto-curate ICP if we have prospect data but no ICP
          if (prospectData && !updatedContext.activeICP && ['research_company', 'research_url'].includes(classification.intent)) {
            try {
              const autoICP = await autoCurateICP(prospectData, userMessage);
              if (autoICP) {
                icpData = autoICP;
                updatedContext.activeICP = autoICP;
                actions.push({
                  type: 'build_icp', label: 'Auto-Curated ICP', status: 'completed',
                  message: `Auto-built ICP from ${prospectData.companyName || 'research results'}`,
                });
                sendCommMsg(pipelineState, 'analyst', 'navigator', 'response',
                  `Auto-generated ICP: ${autoICP.name}`, { icpName: autoICP.name }, onEvent);
              }
            } catch { /* non-critical */ }
          }
          // Also include existing ICP if available
          if (!icpData && updatedContext.activeICP) {
            icpData = updatedContext.activeICP;
          }
          break;
      }
    } catch (phaseError) {
      const msg = phaseError instanceof Error ? phaseError.message : 'Unknown error';
      console.warn(`[Orchestrator] Phase ${phase.agent} failed: ${msg}`);

      if (!phase.optional) {
        // Non-optional phase failed — still continue with other phases
      }
      updateAgentState(pipelineState, agentPersona, {
        status: 'failed',
        currentStep: phase.action,
        completedAt: Date.now(),
      }, onEvent);

      sendCommMsg(pipelineState, agentPersona, 'navigator', 'response',
        `Phase failed: ${msg.slice(0, 100)}`, { error: msg.slice(0, 200) }, onEvent);
    }

    // Update agent state to completed
    updateAgentState(pipelineState, agentPersona, {
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

  updateAgentState(pipelineState, 'navigator', {
    status: 'working',
    currentStep: 'Synthesizing response',
    progress: 50,
    startedAt: Date.now(),
  }, onEvent);

  sendCommMsg(pipelineState, 'navigator', 'analyst', 'request',
    'Synthesize all agent outputs into a coherent response', undefined, onEvent);

  // Generate conversational response
  if (!responseContent) {
    if (prospectData) {
      const actionSummary = buildResearchSummary(prospectData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable */ }
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
      } catch { /* LLM unavailable */ }
    } else if (scoreData) {
      const actionSummary = JSON.stringify(scoreData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable */ }
    } else if (outreachData) {
      const actionSummary = JSON.stringify(outreachData);
      try {
        responseContent = await generateConversationResponse(
          classification.persona, classification.intent, userMessage, actionSummary, updatedContext,
        );
      } catch { /* LLM unavailable */ }
    } else if (classification.intent === 'clarify') {
      responseContent = classification.clarifyingQuestion || "I'd love to help! Could you tell me more about what you're looking for?";
    } else if (classification.intent === 'converse') {
      try {
        const contextHint = buildContextHint(updatedContext);
        responseContent = await generateConversationResponse(
          'navigator', classification.intent, userMessage,
          contextHint || 'General conversation', updatedContext,
        );
      } catch {
        responseContent = "I'm here to help with B2B lead generation! You can ask me to research companies, find people, analyze markets, build ICPs, score leads, and compose outreach.";
      }
    }
  }

  // Fallback using structured data
  if (!responseContent && (prospectData || icpData || marketData || scoreData || outreachData)) {
    const { generateStructuredFallback } = await import('@/lib/llm');
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
  sendCommMsg(pipelineState, 'navigator', 'user', 'response',
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

async function autoCurateICP(prospect: ProspectResult, userQuery: string): Promise<ICPResult | null> {
  try {
    const result = await callLLMForJSON<ICPResult>(
      `Based on this company research data, create an Ideal Customer Profile. ALL output MUST be in English.\n\nCOMPANY: ${prospect.companyName}\nINDUSTRY: ${prospect.industry}\nEMPLOYEES: ${prospect.employeeCount}\nREVENUE: ${prospect.revenueEstimate}\nTECH: ${prospect.techStack?.join(', ')}\n\nRespond with JSON: {"name":"<ICP name>","description":"<1-2 sentence description>","firmographic":{"industries":["<primary>"],"companySizes":["<size range>"],"locations":["<region>"],"revenueRange":"<range>"},"technographic":{"requiredTech":["<tech>"],"preferredTech":["<tech>"]},"psychographic":{"values":["<value>"],"challenges":["<challenge>"],"goals":["<goal>"]},"behavioral":{"buyingSignals":["<signal>"],"engagementPatterns":["<pattern>"]},"economic":{"budgetRange":"<range>","decisionTimeline":"<timeline>"},"criteria":"{}"}`,
      `Create ICP for companies like ${prospect.companyName || 'the researched company'}`,
    );
    return result;
  } catch { return null; }
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
