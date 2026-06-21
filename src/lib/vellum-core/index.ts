/**
 * Vellum Core — Main Entry Point
 *
 * Exports everything from the Vellum Core Integration Module for
 * LeadReach AI. This module adapts the open-source Vellum Assistant's
 * architecture to work with LeadReach's existing infrastructure
 * (Next.js 16 App Router, Z.AI API, 8-agent pipeline).
 *
 * IMPORTANT: This module is ADDITIVE only — it does not modify any
 * existing LeadReach code. All exports are new functionality that
 * extends the platform's capabilities.
 *
 * Module Structure:
 *   types.ts          — Shared type definitions
 *   cooldown-manager  — Per-model API cooldown management
 *   z-ai-provider     — Z.AI LLM streaming provider
 *   permissions       — Permission & trust system
 *   compaction        — Context compaction with circuit breaker
 *   event-bus         — Typed event bus
 *   streaming         — SSE streaming for Next.js
 *   tool-registry     — Tool registration & lifecycle
 *   agent-loop        — Core agent execution loop
 */

// ============================================================
// Types
// ============================================================

export type {
  // Agent Persona & Pipeline
  VellumAgentPersona,
  PipelinePhase,
  PipelineStep,
  VellumPipelineState,

  // Memory Graph
  MemoryNode,
  MemoryEdge,

  // Skill & Plugin System
  SkillDefinition,
  SkillSummary,
  PluginManifest,
  PluginHooks,

  // Tool System
  RiskLevel,
  ToolOwnership,
  ToolDefinition,
  Tool,
  ToolContext,
  ToolExecutionResult,

  // Agent Loop
  AgentLoopConfig,
  AgentLoopExitReason,
  AgentEvent,
  AgentLoopRunResult,
  AgentMessage,

  // Permissions & Trust
  RiskAssessment,
  TrustRule,
  PermissionCheckResult,

  // Scheduling & Heartbeat
  ScheduleConfig,
  HeartbeatConfig,

  // Channel System
  ChannelId,
  ChannelConfig,

  // Z.AI Provider
  ZAIStreamEvent,
  ZAIChatOptions,
  ZAIUsage,
} from './types';

// ============================================================
// Cooldown Manager
// ============================================================

export {
  CooldownManager,
  getCooldownManager,
  resetCooldownManager,
} from './cooldown-manager';

export type { CooldownManagerConfig } from './cooldown-manager';

// ============================================================
// Z.AI Provider
// ============================================================

export {
  ZAIProvider,
  getZAIProvider,
  resetZAIProvider,
  ZAI_MODEL_PRIMARY,
  ZAI_MODEL_FALLBACK,
  ZAI_MODELS,
} from './z-ai-provider';

export type { ZAIModel } from './z-ai-provider';

// ============================================================
// Permissions
// ============================================================

export {
  classifyRisk,
  DefaultApprovalPolicy,
  checkPermission,
} from './permissions';

// ============================================================
// Compaction
// ============================================================

export {
  CompactionCircuit,
  compactMessages,
  midLoopCompact,
} from './compaction';

export type {
  CompactionMessage,
  CompactionResult,
} from './compaction';

// ============================================================
// Event Bus
// ============================================================

export {
  EventBus,
  EventBusDisposedError,
  getLeadReachEventBus,
  resetLeadReachEventBus,
} from './event-bus';

export type {
  EventMap,
  EventListener,
  AnyEventEnvelope,
  AnyEventListener,
  Subscription,
  LeadReachEvents,
  LeadReachEventBus,
} from './event-bus';

// ============================================================
// Streaming
// ============================================================

export {
  createSSEStream,
  createSSEResponse,
  createAgentEventStreamResponse,
  agentEventToSSE,
  SSESender,
} from './streaming';

export type {
  SSEEventType,
  SSEEvent,
} from './streaming';

// ============================================================
// Tool Registry
// ============================================================

export {
  ToolRegistry,
  getToolRegistry,
  resetToolRegistry,
  registerCoreTools,
} from './tool-registry';

export type { RegistryEvent } from './tool-registry';

// ============================================================
// Agent Loop
// ============================================================

export {
  AgentLoop,
} from './agent-loop';

export type {
  AgentLoopRunOptions,
} from './agent-loop';

// ============================================================
// Convenience: Create a fully configured AgentLoop
// ============================================================

import { AgentLoop } from './agent-loop';
import { registerCoreTools } from './tool-registry';
import type { AgentLoopConfig } from './types';

/**
 * Create a fully configured AgentLoop with all core tools registered.
 *
 * This is the easiest way to get started with the Vellum Core module:
 *
 * ```typescript
 * import { createAgentLoop } from '@/lib/vellum-core';
 *
 * const loop = createAgentLoop({
 *   systemPrompt: 'You are a B2B research assistant...',
 *   conversationId: 'conv-123',
 * });
 *
 * const result = await loop.run({
 *   messages: [{ id: '1', role: 'user', content: 'Research Stripe', timestamp: Date.now() }],
 *   onEvent: (event) => console.log(event),
 * });
 * ```
 */
export function createAgentLoop(options?: {
  systemPrompt?: string;
  config?: Partial<AgentLoopConfig>;
  conversationId?: string;
}): AgentLoop {
  // Ensure core tools are registered
  registerCoreTools();

  return new AgentLoop({
    systemPrompt: options?.systemPrompt,
    config: options?.config,
    conversationId: options?.conversationId,
  });
}
