// ============================================================
// 8-Agent Types — Client-Safe Type Definitions
// ============================================================
// These types are shared between the server-side orchestrator
// and the client-side UI. They do NOT import any server-only
// modules (no llm, no agent-reach-bridge, no prisma).
// ============================================================

import type { AgentPersona, UserIntent, InsightItem } from './types';

// ============================================================
// Agent Communication Types
// ============================================================

/** A single message in the inter-agent communication log */
export interface AgentCommMessage {
  id: string;
  from: string;  // 8-agent display name (atlas, scout, forge, etc.) or 'user'
  to: string;    // 8-agent display name or 'all'
  type: 'request' | 'response' | 'broadcast' | 'handoff' | 'status';
  content: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

/** Current state of an agent in the pipeline */
export interface AgentState {
  persona: AgentPersona;
  status: 'idle' | 'thinking' | 'working' | 'waiting' | 'completed' | 'failed';
  currentStep: string;
  progress: number; // 0-100
  startedAt: number | null;
  completedAt: number | null;
  thinkTimeMs: number | null;
}

/** The full pipeline state visible in the workspace */
export interface PipelineState {
  phase: 'idle' | 'thinking' | 'executing' | 'synthesizing' | 'complete' | 'error';
  thinkStartTime: number | null;
  totalThinkTimeMs: number | null;
  agents: Record<string, AgentState>;  // 8-agent display names as keys
  commLog: AgentCommMessage[];
  currentStep: string;
  overallProgress: number; // 0-100
}

/** Events emitted by the orchestrator via SSE */
export type OrchestratorEvent =
  | { type: 'thinking_start'; data: { timestamp: number } }
  | { type: 'thinking_tick'; data: { elapsedMs: number; phase: string } }
  | { type: 'thinking_end'; data: { totalMs: number; classification: { intent: UserIntent; persona: AgentPersona; confidence: number; reasoning: string } } }
  | { type: 'agent_status'; data: { agent: string; state: AgentState } }
  | { type: 'agent_comm'; data: AgentCommMessage }
  | { type: 'cooldown'; data: { agent: string; cooldownMs: number; reason: string } }
  | { type: 'step_start'; data: { stepIndex: number; label: string; agent: AgentPersona; message: string } }
  | { type: 'step_progress'; data: { stepIndex: number; message: string; partialData?: Record<string, unknown> } }
  | { type: 'step_complete'; data: { stepIndex: number; status: 'completed' | 'failed'; message: string; partialData?: Record<string, unknown> } }
  | { type: 'data_update'; data: { prospect?: Record<string, unknown>; icp?: Record<string, unknown>; score?: Record<string, unknown>; outreach?: Record<string, unknown>; market?: Record<string, unknown> } }
  | { type: 'insight'; data: { insight: InsightItem } }
  | { type: 'pipeline_progress'; data: { phase: PipelineState['phase']; overallProgress: number } }
  | { type: 'done'; data: { message: Record<string, unknown>; updatedContext: Record<string, unknown>; suggestedActions: Record<string, unknown>[]; pipelineState: PipelineState | null } }
  | { type: 'error'; data: { message: string; recoverable: boolean } };

export type OrchestratorCallback = (event: OrchestratorEvent) => void;

// ============================================================
// 8-Agent Display Configuration
// ============================================================

export const AGENT_8_DISPLAY: Record<string, { name: string; emoji: string; color: string; role: string }> = {
  atlas:  { name: 'Atlas',  emoji: '🧭', color: 'indigo',  role: 'Orchestrator' },
  scout:  { name: 'Scout',  emoji: '🔍', color: 'emerald', role: 'Discovery' },
  forge:  { name: 'Forge',  emoji: '⚒️', color: 'cyan',    role: 'Enrichment' },
  sage:   { name: 'Sage',   emoji: '📊', color: 'violet',  role: 'Research' },
  judge:  { name: 'Judge',  emoji: '⚖️', color: 'rose',    role: 'Qualification' },
  bard:   { name: 'Bard',   emoji: '✍️', color: 'sky',     role: 'Outreach' },
  flow:   { name: 'Flow',   emoji: '🔄', color: 'amber',   role: 'Pipeline' },
  echo:   { name: 'Echo',   emoji: '📈', color: 'teal',    role: 'Reports' },
};

// Agent persona mapping for the 8-agent system
export const AGENT_8_MAP: Record<string, AgentPersona> = {
  atlas: 'navigator',     // Orchestrator → Navigator
  scout: 'scout',         // Discovery → Scout
  forge: 'scout',         // Enrichment → Scout
  sage: 'analyst',        // Research → Analyst
  judge: 'judge',         // Qualification → Judge
  bard: 'scribe',         // Outreach → Scribe
  flow: 'navigator',      // Pipeline → Navigator
  echo: 'analyst',        // Reports → Analyst
};
