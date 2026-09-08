/**
 * Agent Details — comprehensive curated content for each of the 8 agents
 * on the /agent page.
 *
 * Each agent has:
 *   - Overview (detailed description, how it works, role in the pipeline)
 *   - Capabilities (10+ per agent, each with detail bullets)
 *   - Pipeline Stages (6+ per agent, each with substeps + error handling)
 *   - Knowledge Base (6+ SOPs/Runbooks/Playbooks/References/Training, with section breakdowns)
 *   - Tools & Integrations (8+ MCP servers, APIs, SDKs — each with config + JSON schema)
 *   - Performance Metrics (10+ per agent, with benchmarks + 30-day trend)
 *   - Configuration (model, temperature, max tokens, FULL system prompt, response schema)
 *   - User Prompt Templates (5+ per agent, with template text + variables)
 *   - Tool Call Examples (3+ per agent, with full request/response JSON)
 *   - Worked Examples (3+ per agent, with input → reasoning → output → outcome)
 *   - Guardrails (7+ per agent, with severity + enforcement mechanism)
 *   - Decision Matrix (7+ per agent, with condition → action → rationale → example)
 *   - Failure Modes (5+ per agent, with detection + mitigation + recovery time)
 *   - Evaluation Cases (4+ per agent, with scoring criteria + pass threshold)
 */

export * from './types';

import { orchestratorDetail } from './orchestrator';
import { prospectDiscoveryDetail } from './prospect-discovery';
import { dataEnrichmentDetail } from './data-enrichment';
import { webResearchDetail } from './web-research';
import { leadQualificationDetail } from './lead-qualification';
import { outreachComposerDetail } from './outreach-composer';
import { pipelineManagerDetail } from './pipeline-manager';
import { reportGeneratorDetail } from './report-generator';

export const AGENT_DETAILS_FULL = {
  orchestrator: orchestratorDetail,
  'prospect-discovery': prospectDiscoveryDetail,
  'data-enrichment': dataEnrichmentDetail,
  'web-research': webResearchDetail,
  'lead-qualification': leadQualificationDetail,
  'outreach-composer': outreachComposerDetail,
  'pipeline-manager': pipelineManagerDetail,
  'report-generator': reportGeneratorDetail,
} as const;

export type { AgentDetailFull, AgentCapability, AgentKBItem, AgentTool, AgentMetric, AgentConfig, AgentPipelineStage, UserPromptTemplate, ToolCallExample, WorkedExample, Guardrail, DecisionMatrixEntry, FailureMode, EvaluationCase } from './types';
