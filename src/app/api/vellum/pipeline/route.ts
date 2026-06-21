/**
 * POST /api/vellum/pipeline
 *
 * Pipeline execution endpoint that connects to the 8-agent orchestrator.
 * Uses the Vellum Core AgentLoop to run a multi-agent pipeline.
 *
 * Returns an SSE stream with pipeline progress events:
 *   - agent_start:     Agent begins processing
 *   - agent_thinking:  Agent is reasoning
 *   - agent_output:    Agent produces output
 *   - agent_complete:  Agent finishes processing
 *   - Inter-agent communication visible in stream
 *
 * Body: { query: string, agents?: string[], context?: Record<string, unknown> }
 */

import { NextRequest } from 'next/server';
import {
  createAgentLoop,
  createSSEStream,
  type AgentEvent,
} from '@/lib/vellum-core';
import type { AgentMessage, VellumAgentPersona } from '@/lib/vellum-core';
import { loadContextMemory, saveNode, generateNodeId } from '@/lib/vellum-core/memory';
import { randomUUID } from 'node:crypto';

// 5-minute timeout
export const maxDuration = 300;

const PIPELINE_TIMEOUT_MS = 270_000;

/** The 8 agents in the LeadReach pipeline */
const EIGHT_AGENTS: VellumAgentPersona[] = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'];

/** Agent descriptions for system prompts */
const AGENT_DESCRIPTIONS: Record<VellumAgentPersona, string> = {
  atlas: 'Orchestrator — coordinates all agents and ensures pipeline coherence',
  scout: 'Discovery — company & web research specialist',
  forge: 'Enrichment — data enrichment & deep crawl specialist',
  sage: 'Research — market & competitive analysis specialist',
  judge: 'Qualification — lead scoring & ICP matching specialist',
  bard: 'Outreach — message composition specialist',
  flow: 'Pipeline — pipeline & session management specialist',
  echo: 'Reports — insights & reporting specialist',
  navigator: 'General guidance and multi-step orchestration',
};

/**
 * POST handler — execute the 8-agent pipeline and stream results.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, agents, context } = body as {
      query: string;
      agents?: string[];
      context?: Record<string, unknown>;
    };

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return Response.json(
        { error: 'query is required and must be a non-empty string' },
        { status: 400 },
      );
    }

    // Determine which agents to run
    const selectedAgents: VellumAgentPersona[] = (agents?.length ?? 0) > 0
      ? agents!.filter((a): a is VellumAgentPersona =>
          EIGHT_AGENTS.includes(a as VellumAgentPersona),
        )
      : EIGHT_AGENTS;

    if (selectedAgents.length === 0) {
      return Response.json(
        { error: 'No valid agents selected' },
        { status: 400 },
      );
    }

    const sessionId = `pipeline-${Date.now()}-${randomUUID().slice(0, 8)}`;

    // Load context memories
    let memoryContext = '';
    try {
      const memories = await loadContextMemory(sessionId, query.trim());
      if (memories.length > 0) {
        memoryContext = memories
          .slice(0, 10)
          .map(m => `- [${m.node.type}] ${m.node.content}`)
          .join('\n');
      }
    } catch {
      // Non-critical
    }

    // Create abort controller with timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), PIPELINE_TIMEOUT_MS);

    // Create the SSE stream
    const stream = createSSEStream(async (sender) => {
      const pipelineStartTime = Date.now();

      try {
        // Emit pipeline start event
        sender.send('pipeline_start', {
          sessionId,
          query: query.trim(),
          agents: selectedAgents,
          totalAgents: selectedAgents.length,
          timestamp: Date.now(),
        });

        // Run each agent sequentially
        for (let i = 0; i < selectedAgents.length; i++) {
          if (!sender.isActive || abortController.signal.aborted) break;

          const agent = selectedAgents[i];
          const agentStartTime = Date.now();

          // Emit agent_start event
          sender.send('agent_start', {
            agent,
            step: i + 1,
            totalSteps: selectedAgents.length,
            description: AGENT_DESCRIPTIONS[agent],
            timestamp: agentStartTime,
          });

          try {
            // Build agent-specific system prompt
            const agentPrompt = buildAgentPrompt(agent, query.trim(), memoryContext, context);

            // Create agent loop for this agent
            const agentLoop = createAgentLoop({
              systemPrompt: agentPrompt,
              conversationId: `${sessionId}-${agent}`,
              config: {
                maxTokens: 4096,
                thinking: { enabled: true, budgetTokens: 1024 },
                effort: 'medium',
                maxToolTurns: 10,
                emitThinkingEvents: true,
              },
            });

            const userMessage: AgentMessage = {
              id: `msg-${agent}-${Date.now()}`,
              role: 'user',
              content: buildAgentInput(agent, query.trim(), i, selectedAgents.length),
              timestamp: Date.now(),
            };

            // Run the agent and capture events
            let agentOutput = '';
            const result = await agentLoop.run({
              messages: [userMessage],
              signal: abortController.signal,
              requestId: `pipeline-${sessionId}-${agent}`,
              onEvent: async (event: AgentEvent) => {
                if (!sender.isActive) return;

                switch (event.type) {
                  case 'thinking_delta':
                    sender.send('agent_thinking', {
                      agent,
                      thinking: event.thinking,
                      timestamp: Date.now(),
                    });
                    break;

                  case 'text_delta':
                    agentOutput += event.text;
                    sender.send('agent_output', {
                      agent,
                      text: event.text,
                      timestamp: Date.now(),
                    });
                    break;

                  case 'tool_use':
                    sender.send('agent_tool_use', {
                      agent,
                      toolName: event.name,
                      toolId: event.id,
                      timestamp: Date.now(),
                    });
                    break;

                  case 'tool_result':
                    sender.send('agent_tool_result', {
                      agent,
                      toolUseId: event.toolUseId,
                      isError: event.isError,
                      timestamp: Date.now(),
                    });
                    break;
                }
              },
            });

            const agentDuration = Date.now() - agentStartTime;

            // Emit agent_complete event
            sender.send('agent_complete', {
              agent,
              step: i + 1,
              durationMs: agentDuration,
              tokensUsed: result.totalTokensUsed,
              toolTurns: result.toolUseTurns,
              exitReason: result.exitReason,
              outputLength: agentOutput.length,
              timestamp: Date.now(),
            });

            // Store agent result as memory
            if (agentOutput.length > 0) {
              saveNode({
                id: generateNodeId(),
                content: `[${agent}] Pipeline step ${i + 1}: ${agentOutput.slice(0, 500)}`,
                type: 'episodic',
                fidelity: 'vivid',
                confidence: 0.7,
                significance: 0.6,
                stability: 0.2,
                sourceConversations: [sessionId],
                sourceType: 'inferred',
                scopeId: sessionId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                lastAccessedAt: Date.now(),
              }).catch(() => {});
            }
          } catch (agentError) {
            const agentDuration = Date.now() - agentStartTime;
            sender.send('agent_error', {
              agent,
              step: i + 1,
              error: agentError instanceof Error ? agentError.message : 'Unknown agent error',
              durationMs: agentDuration,
              timestamp: Date.now(),
            });
          }
        }

        // Emit pipeline complete event
        const totalDuration = Date.now() - pipelineStartTime;
        sender.send('pipeline_complete', {
          sessionId,
          totalDurationMs: totalDuration,
          agentsProcessed: selectedAgents.length,
          timestamp: Date.now(),
        });
      } catch (error) {
        if (sender.isActive) {
          sender.error(
            error instanceof Error ? error.message : 'Pipeline execution failed',
            true,
          );
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }, request.signal);

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('[VellumPipeline] Unhandled error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 },
    );
  }
}

/**
 * Build a system prompt for a specific agent in the pipeline.
 */
function buildAgentPrompt(
  agent: VellumAgentPersona,
  query: string,
  memoryContext: string,
  context?: Record<string, unknown>,
): string {
  const parts: string[] = [
    `You are ${agent.charAt(0).toUpperCase() + agent.slice(1)}, the ${AGENT_DESCRIPTIONS[agent]} in the LeadReach AI B2B lead generation platform.`,
    '',
    `You are processing query: "${query}"`,
    '',
    'Provide a focused, actionable response within your area of expertise. Be concise but thorough.',
  ];

  if (memoryContext) {
    parts.push('', '## Memory Context', memoryContext);
  }

  if (context && Object.keys(context).length > 0) {
    parts.push('', '## Additional Context', JSON.stringify(context, null, 2));
  }

  return parts.join('\n');
}

/**
 * Build the input message for a specific agent step.
 */
function buildAgentInput(
  agent: VellumAgentPersona,
  query: string,
  stepIndex: number,
  totalSteps: number,
): string {
  return `Pipeline Step ${stepIndex + 1}/${totalSteps} — ${agent.toUpperCase()} Phase

Original Query: ${query}

Process this query according to your specialty. Provide your analysis and recommendations.`;
}

/**
 * OPTIONS — CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
