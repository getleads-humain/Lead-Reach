/**
 * LeadReach Agentic System — Public API
 * =====================================
 *
 * Unified facade over the LeadReach agentic infrastructure. This module
 * consolidates:
 *
 *   - SOP spec (the methodology)
 *   - Workflow engine (wraps the existing 8-agent orchestrator)
 *   - Context window manager (token budgeting)
 *   - Memory store (unified recall/remember)
 *   - Tool registry (unified tool invocation)
 *   - MoE router (expert selection)
 *   - Harness (constraint enforcement)
 *   - Safety evals (input/output guardrails + test suite)
 *   - Evals (fixture-based testing)
 *   - Telemetry (run tracing)
 *
 * Existing modules (vellum-core, agent-infrastructure, prospect-agent)
 * are NOT replaced. They continue to work as before. This module adds a
 * unified layer on top.
 *
 * Quick start:
 *   import { runAgenticWorkflow, getSopManifest, runSafetyEvals } from '@/lib/agentic-system';
 */

// ── SOP ──
export {
  SOP_VERSION,
  SOP_PUBLISHED_AT,
  SOP_VARIANTS,
  SOP_PHASES,
  SOP_CONSTRAINTS,
  AGENTS,
  getSopManifest,
  pickSopVariant,
  selectPhasesForIntent,
  type SOPAgentName,
  type SOPVariant,
  type SOPManifest,
  type AgentSpec,
  type SOPVariantSpec,
  type SOPPhaseSpec,
  type SOPConstraints,
} from './sop/sop-spec';

// ── Workflow Engine ──
export {
  runAgenticWorkflow,
  type AgenticWorkflowInput,
  type AgenticWorkflowResult,
  type AgenticWorkflowOptions,
} from './workflow/workflow-engine';

// ── Context Window ──
export {
  ContextWindowManager,
  DEFAULT_CONTEXT_CONFIG,
  estimateTokens,
  getActiveContextWindow,
  resetActiveContextWindow,
  type ContextWindowConfig,
  type ContextItem,
  type ContextItemRole,
} from './context/context-window';

// ── Memory ──
export {
  remember,
  recall,
  forget,
  search,
  clearScope,
  type MemoryScope,
  type MemoryEntry,
} from './memory/memory-store';

// ── Tools ──
export {
  registerTool,
  getTool,
  listTools,
  listToolsByCategory,
  invokeTool,
  ensureToolsRegistered,
  type ToolSchema,
  type ToolInvocationResult,
  type RegisteredTool,
} from './tools/tool-registry';

// ── MoE Router ──
export {
  EXPERTS,
  routeQuery,
  routeQueryMulti,
  getExpert,
  listExperts,
  type Expert,
  type RoutingDecision,
} from './moe/moe-router';

// ── Harness ──
export {
  runInHarness,
  createCounters,
  preflightChecks,
  setActiveCounters,
  bumpTokens,
  bumpLeads,
  bumpHttpRequests,
  type RunCounters,
  type ConstraintViolation,
  type HarnessResult,
} from './harness/harness';

// ── Safety ──
export {
  applyInputGuardrails,
  applyOutputGuardrails,
  type GuardrailResult,
} from './safety/output-validator';

export {
  runSafetyEvals,
  validateConstraints,
  SAFETY_TEST_CASES,
  type SafetyTestCase,
  type SafetyTestResult,
  type SafetyEvalReport,
} from './safety/safety-evals';

// ── Evals ──
export {
  runEvalSuite,
  smokeCheck,
  type EvalRunnerOptions,
} from './evals/eval-runner';

export {
  ALL_FIXTURES,
  INTENT_FIXTURES,
  SOP_FIXTURES,
  OUTPUT_FIXTURES,
  getFixturesByCategory,
  type EvalFixture,
} from './evals/eval-datasets';

export {
  evaluateFixture,
  buildSuiteReport,
  type FixtureEvalResult,
  type EvalSuiteReport,
} from './evals/eval-metrics';

// ── Telemetry ──
export {
  recordRun,
  getRecentRuns,
  getRunStats,
  type RunSummary,
  type RunStats,
  type WorkflowTraceEvent,
} from './telemetry/trace';
