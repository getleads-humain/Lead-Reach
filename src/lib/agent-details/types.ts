/**
 * Agent Detail Data — Comprehensive curated content for each agent.
 *
 * Each agent entry is hand-authored and contains:
 *   - Identity, department, pipeline role
 *   - Capabilities (10+ per agent) with concrete metrics
 *   - Pipeline stages (6-8 per agent) with inputs, outputs, substeps, durations
 *   - Knowledge base (6+ per agent) with full section breakdowns
 *   - Tools (8+ per agent) with config, rate limits, auth, schema
 *   - Metrics (8+ per agent) with targets, benchmarks, 30-day trend
 *   - Configuration (model, temperature, max tokens, schedule, concurrency)
 *   - System Prompt FULL (multi-paragraph, ~1500-2500 words each)
 *   - User prompt templates (5+ per agent) with use cases
 *   - Tool call examples (3+ per agent) with JSON schemas
 *   - Worked examples (3+ per agent) with input → reasoning → output
 *   - Guardrails (6+ per agent) with enforcement mechanism
 *   - Decision matrix (5+ per agent) with conditions and actions
 *   - Failure modes (4+ per agent) with detection + mitigation
 *   - Evaluation cases (4+ per agent) with scoring criteria
 */

export interface AgentCapability {
  name: string;
  description: string;
  metric?: string;
  details?: string[]; // bullet-level expansion of how the capability works
}

export interface AgentKBSection {
  title: string;
  description: string;
}

export interface AgentKBItem {
  title: string;
  category: 'SOP' | 'Runbook' | 'Playbook' | 'Reference' | 'Training';
  summary: string;
  sections: number;
  sectionList?: AgentKBSection[]; // explicit per-section breakdown
  owner?: string;
  lastReviewed?: string;
  version?: string;
}

export interface AgentTool {
  name: string;
  type: 'MCP Server' | 'API' | 'SDK' | 'Internal';
  description: string;
  status: 'connected' | 'available' | 'needs-setup';
  endpoint?: string;
  authMethod?: string;
  rateLimit?: string;
  config?: { key: string; value: string }[];
  schemaExample?: string; // sample request/response JSON
  failureMode?: string;
}

export interface AgentMetric {
  label: string;
  value: string;
  unit?: string;
  benchmark?: string;
  trend30d?: string; // e.g. "+2.3%", "-0.8%", "stable"
  description?: string; // why this metric matters
}

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  scheduleType: string;
  maxConcurrentTasks: number;
  priority: string;
  systemPromptSummary: string;
  systemPromptFull: string; // multi-paragraph exhaustive system prompt
  reasoningEffort?: 'low' | 'medium' | 'high';
  topP?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  responseFormat?: 'text' | 'json_object' | 'json_schema';
  jsonSchema?: string; // optional JSON schema for structured output
  timeout?: string;
  retryPolicy?: string;
  fallbackModel?: string;
}

export interface AgentPipelineStage {
  stage: string;
  inputs: string[];
  outputs: string[];
  duration: string;
  substeps?: string[]; // detailed sub-procedure
  errorHandling?: string;
  retryStrategy?: string;
}

export interface UserPromptTemplate {
  name: string;
  useCase: string;
  template: string; // full template text
  variables?: string[]; // template variables like {{campaignId}}
}

export interface ToolCallExample {
  tool: string;
  scenario: string;
  request: string; // JSON or text request
  response: string; // JSON or text response
  notes?: string;
}

export interface WorkedExample {
  scenario: string;
  input: string;
  reasoning: string;
  output: string;
  outcome?: string;
}

export interface Guardrail {
  rule: string;
  rationale: string;
  enforcement: string; // how the rule is enforced technically
  severity: 'block' | 'warn' | 'log';
}

export interface DecisionMatrixEntry {
  condition: string;
  action: string;
  rationale: string;
  example?: string;
}

export interface FailureMode {
  failure: string;
  detection: string;
  mitigation: string;
  recoveryTime?: string;
}

export interface EvaluationCase {
  id: string;
  input: string;
  expectedOutput: string;
  scoringCriteria: string[];
  passThreshold?: number;
}

export interface AgentDetailFull {
  slug: string;
  name: string;
  displayName: string;
  tagline: string;
  description: string;
  longDescription: string;
  color: string;
  iconName: string;
  department: string;
  pipelineRole: string;
  pipelinePosition: number;
  capabilities: AgentCapability[];
  pipelineStages: AgentPipelineStage[];
  knowledgeBase: AgentKBItem[];
  tools: AgentTool[];
  metrics: AgentMetric[];
  config: AgentConfig;
  channels: string[];
  dependencies: string[];
  faqs: Array<{ question: string; answer: string }>;
  // ── NEW: prompt-level artifacts ──
  userPromptTemplates: UserPromptTemplate[];
  toolCallExamples: ToolCallExample[];
  examples: WorkedExample[];
  guardrails: Guardrail[];
  decisionMatrix: DecisionMatrixEntry[];
  failureModes: FailureMode[];
  evaluationCases: EvaluationCase[];
}
