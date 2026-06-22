/**
 * LeadReach Agentic Standard Operating Procedure (SOP) Spec
 * =========================================================
 *
 * The single source of truth for the LeadReach agentic pipeline.
 * Every component of the agentic system (workflow engine, harness, evals,
 * safety checks, MoE router, telemetry) reads its rules from this spec.
 *
 * The SOP defines HOW we convert user-provided information into actionable,
 * factual, real insights through a proper methodology that adapts to the
 * intricacies of each unique user query.
 *
 * The 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo)
 * implements the SOP. The SOP itself is methodology; the agents are the actors.
 *
 * Design rules:
 *   - Keep everything the existing platform already does.
 *   - Add/modify on top only.
 *   - The SOP must be loadable at runtime so the admin UI can show it.
 *   - All values are frozen — no mutation allowed after load.
 */

import type { UserIntent } from '@/lib/prospect-agent/types';

// ============================================================
// SOP Version & Manifest
// ============================================================

export const SOP_VERSION = '1.0.0' as const;
export const SOP_PUBLISHED_AT = '2026-06-23' as const;

export type SOPAgentName =
  | 'atlas'
  | 'scout'
  | 'forge'
  | 'sage'
  | 'judge'
  | 'bard'
  | 'flow'
  | 'echo';

export interface AgentSpec {
  name: SOPAgentName;
  role: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  fallbackBehavior: string;
}

export interface SOPPhaseSpec {
  /** 1-indexed phase number for ordering */
  index: number;
  agent: SOPAgentName;
  name: string;
  goal: string;
  description: string;
  inputs: string[];
  outputs: string[];
  successCriteria: string[];
  failureHandling: string;
  /** Intents that MUST trigger this phase. Empty = always runs. */
  intentRequired?: UserIntent[];
  /** Phase may be skipped if previous phases had non-fatal errors. */
  optional?: boolean;
  /** Hard timeout in milliseconds for this phase. */
  timeoutMs: number;
}

// ============================================================
// The 8-Agent Definitions
// ============================================================

export const AGENTS: Record<SOPAgentName, AgentSpec> = {
  atlas: {
    name: 'atlas',
    role: 'Orchestrator — decomposes the user query into a pipeline plan',
    responsibilities: [
      'Classify the user intent (research_company, research_person, research_url, analyze_market, analyze_competitors, build_icp, score_lead, compose_outreach, refine_search, add_to_pipeline, clarify, converse)',
      'Plan which of the 8 agents need to run for THIS specific query',
      'Forward the original user-provided context to every downstream agent',
      'Decide which SOP variant applies (Discovery / Enrichment / Qualification / Outreach / Reporting / Conversation)',
    ],
    inputs: ['raw user message', 'campaign context (optional)', 'conversation history'],
    outputs: ['classified intent', 'pipeline plan', 'adapted SOP variant'],
    fallbackBehavior: 'If intent classification fails, default to research_company and run the full Discovery+Enrichment variant.',
  },
  scout: {
    name: 'scout',
    role: 'Discovery — finds the target across 17 web channels',
    responsibilities: [
      'Run multi-channel search (DuckDuckGo, Exa, LinkedIn, GitHub, Reddit, Twitter, YouTube, web crawl)',
      'Dedupe results by URL',
      'Persist each unique candidate as a Lead row (stage=new)',
    ],
    inputs: ['discovery query', 'industry filter', 'location filter'],
    outputs: ['list of candidate companies/people with source URLs'],
    fallbackBehavior: 'If all channels fail, return an empty list and let Echo surface a "refine query" suggestion to the user.',
  },
  forge: {
    name: 'forge',
    role: 'Enrichment — deep-crawls each candidate website and extracts structured data',
    responsibilities: [
      'Crawl the candidate website via crawl4ai',
      'Extract industry, employees, contact info, CEO, HQ, socials, tech stack',
      'Cross-validate against multiple sources to detect fabricated data',
    ],
    inputs: ['candidate URL + name'],
    outputs: ['enriched ProspectResult with structured fields + sources'],
    fallbackBehavior: 'If the website is unreachable, fall back to Exa + Jina Reader + web search snippets to reconstruct the profile.',
  },
  sage: {
    name: 'sage',
    role: 'Research — market and competitive analysis',
    responsibilities: [
      'Analyze market position vs. competitors',
      'Identify trigger events (funding, hiring, product launches, expansions)',
      'Compute TAM/SAM/SOM estimates when ICP context is available',
    ],
    inputs: ['enriched prospect', 'ICP profile (optional)'],
    outputs: ['market analysis + trigger events'],
    fallbackBehavior: 'If the prospect is too small/new to have a market analysis, skip and let Judge proceed.',
  },
  judge: {
    name: 'judge',
    role: 'Qualification — scores the lead against the ICP',
    responsibilities: [
      'Compute leadScore 0-100 based on data completeness + ICP fit',
      'Assign leadTier: cold / warm / hot',
      'Flag disqualified leads with explicit reasons',
    ],
    inputs: ['enriched prospect', 'ICP criteria'],
    outputs: ['leadScore', 'leadTier', 'qualification reasons'],
    fallbackBehavior: 'If no ICP is configured, score purely on data completeness (more complete = warmer).',
  },
  bard: {
    name: 'bard',
    role: 'Outreach — composes the personalized first-touch message',
    responsibilities: [
      'Compose subject line + body using enriched data',
      'Personalize with company name, contact name, recent trigger events',
      'Stay under 120 words; no spam patterns',
    ],
    inputs: ['enriched prospect', 'trigger events'],
    outputs: ['subject + body of outreach message'],
    fallbackBehavior: 'If LLM composition fails, use a templated outreach with the company name + industry as personalization tokens.',
  },
  flow: {
    name: 'flow',
    role: 'Pipeline — manages session state and lead stage transitions',
    responsibilities: [
      'Move the lead through stages: new → enriched → qualified → contacted → responded',
      'Schedule follow-up sequences via the Vellum scheduler',
      'Forward KPI updates to the campaign counters',
    ],
    inputs: ['lead id', 'new stage'],
    outputs: ['updated lead row', 'scheduled follow-ups'],
    fallbackBehavior: 'If the scheduler is unavailable, persist the stage transition only and log a warning.',
  },
  echo: {
    name: 'echo',
    role: 'Reports — generates insights and the final summary',
    responsibilities: [
      'Generate a natural-language summary of the pipeline run',
      'Surface 3-5 actionable insights the user can act on',
      'Update the campaign KPI counters (leadsFound, leadsQualified, leadsContacted)',
    ],
    inputs: ['full pipeline state + all agent outputs'],
    outputs: ['summary string', 'actionable insights array', 'KPI deltas'],
    fallbackBehavior: 'If insight generation fails, return a structured summary built from the raw agent outputs.',
  },
};

// ============================================================
// The 6 SOP Variants — one per intent family
// ============================================================

export type SOPVariant =
  | 'discovery'           // research_company / research_url / refine_search
  | 'enrichment'          // research_person (deep contact enrichment)
  | 'qualification'       // score_lead / build_icp
  | 'outreach'            // compose_outreach / add_to_pipeline
  | 'analysis'            // analyze_market / analyze_competitors
  | 'conversation';       // clarify / converse (fast path, no full pipeline)

export interface SOPVariantSpec {
  variant: SOPVariant;
  name: string;
  description: string;
  intents: UserIntent[];
  /** Ordered list of agent names that run for this variant. */
  phases: SOPAgentName[];
  /** Skip Sage market analysis for performance when not needed. */
  skipMarketAnalysis?: boolean;
  /** Skip Bard outreach composition when not requested. */
  skipOutreach?: boolean;
  /** Estimated wall-clock time for this variant. */
  estimatedDurationMs: number;
}

export const SOP_VARIANTS: Record<SOPVariant, SOPVariantSpec> = {
  discovery: {
    variant: 'discovery',
    name: 'Discovery SOP',
    description: 'Multi-channel candidate discovery + enrichment + reporting.',
    intents: ['research_company', 'research_url', 'refine_search'],
    phases: ['atlas', 'scout', 'forge', 'judge', 'flow', 'echo'],
    skipMarketAnalysis: true,
    skipOutreach: true,
    estimatedDurationMs: 90_000,
  },
  enrichment: {
    variant: 'enrichment',
    name: 'Deep Enrichment SOP',
    description: 'Person-level contact research and verification.',
    intents: ['research_person'],
    phases: ['atlas', 'scout', 'forge', 'sage', 'judge', 'flow', 'echo'],
    skipOutreach: true,
    estimatedDurationMs: 120_000,
  },
  qualification: {
    variant: 'qualification',
    name: 'Qualification SOP',
    description: 'Lead scoring and ICP building.',
    intents: ['score_lead', 'build_icp'],
    phases: ['atlas', 'judge', 'flow', 'echo'],
    skipMarketAnalysis: true,
    skipOutreach: true,
    estimatedDurationMs: 30_000,
  },
  outreach: {
    variant: 'outreach',
    name: 'Outreach SOP',
    description: 'Outreach composition + pipeline entry.',
    intents: ['compose_outreach', 'add_to_pipeline'],
    phases: ['atlas', 'bard', 'flow', 'echo'],
    skipMarketAnalysis: true,
    estimatedDurationMs: 30_000,
  },
  analysis: {
    variant: 'analysis',
    name: 'Market Analysis SOP',
    description: 'Market and competitive analysis.',
    intents: ['analyze_market', 'analyze_competitors'],
    phases: ['atlas', 'sage', 'echo'],
    skipOutreach: true,
    estimatedDurationMs: 60_000,
  },
  conversation: {
    variant: 'conversation',
    name: 'Conversation SOP (fast path)',
    description: 'Clarification or general chat — no full pipeline.',
    intents: ['clarify', 'converse'],
    phases: ['atlas', 'echo'],
    skipMarketAnalysis: true,
    skipOutreach: true,
    estimatedDurationMs: 8_000,
  },
};

// ============================================================
// Phase Specs — the canonical phase ordering (max set)
// ============================================================

export const SOP_PHASES: SOPPhaseSpec[] = [
  {
    index: 1,
    agent: 'atlas',
    name: 'Intent Classification & Planning',
    goal: 'Decompose the user query into a concrete pipeline plan',
    description:
      'Atlas reads the raw user message + campaign context + conversation history and classifies the intent. It then selects the SOP variant that best matches the query and produces a list of agents to invoke.',
    inputs: ['raw user message', 'campaign context', 'conversation history'],
    outputs: ['classified intent', 'selected SOP variant', 'ordered agent list'],
    successCriteria: [
      'Intent is one of the 12 valid UserIntent values',
      'Selected SOP variant contains at least atlas + echo',
      'Pipeline plan is deterministic for the same input',
    ],
    failureHandling:
      'If classification fails, default to research_company + discovery variant. Log a warning to the harness.',
    timeoutMs: 15_000,
  },
  {
    index: 2,
    agent: 'scout',
    name: 'Multi-Channel Discovery',
    goal: 'Find candidate targets across 17 web channels',
    description:
      'Scout runs parallel searches across DuckDuckGo, Exa, LinkedIn, GitHub, Reddit, Twitter, YouTube, and the crawl4ai web reader. It dedupes by URL and persists each unique candidate as a Lead row.',
    inputs: ['discovery query', 'industry filter', 'location filter'],
    outputs: ['list of candidate leads'],
    successCriteria: [
      'At least 1 candidate discovered OR an explicit "no candidates" reason is returned',
      'Every candidate has at least a name + source URL',
      'Dedup is by URL — no duplicate leads in the same campaign',
    ],
    failureHandling:
      'If ALL channels fail, return an empty list. Do NOT fabricate candidates. Echo will surface a "refine your query" suggestion.',
    intentRequired: ['research_company', 'research_person', 'research_url', 'refine_search'],
    optional: false,
    timeoutMs: 30_000,
  },
  {
    index: 3,
    agent: 'forge',
    name: 'Deep Enrichment',
    goal: 'Extract structured data from each candidate website',
    description:
      'Forge crawls each candidate website via crawl4ai and extracts industry, employees, contact info, CEO, HQ, socials, and tech stack. It cross-validates against multiple sources to detect fabricated data.',
    inputs: ['candidate URL + name'],
    outputs: ['enriched ProspectResult with sources'],
    successCriteria: [
      'At least 5 structured fields populated per prospect',
      'Every claimed fact has at least one source URL',
      'No fabricated data — empty fields are null, not invented',
    ],
    failureHandling:
      'If the website is unreachable, fall back to Exa + Jina Reader + web search snippets. If all fallbacks fail, return the prospect with only the fields Scout provided.',
    intentRequired: ['research_company', 'research_person', 'research_url'],
    optional: true,
    timeoutMs: 60_000,
  },
  {
    index: 4,
    agent: 'sage',
    name: 'Market & Competitive Analysis',
    goal: 'Provide market context for the prospect',
    description:
      'Sage analyzes the prospect\'s market position, identifies trigger events (funding, hiring, product launches, expansions), and computes TAM/SAM/SOM when ICP context is available.',
    inputs: ['enriched prospect', 'ICP profile (optional)'],
    outputs: ['market analysis', 'trigger events'],
    successCriteria: [
      'At least 1 trigger event identified OR an explicit "no trigger events found" reason is returned',
      'Trigger events have a date and a source URL',
    ],
    failureHandling: 'If the prospect is too small/new, skip Sage entirely and let Judge proceed with what Forge produced.',
    intentRequired: ['analyze_market', 'analyze_competitors'],
    optional: true,
    timeoutMs: 45_000,
  },
  {
    index: 5,
    agent: 'judge',
    name: 'Lead Qualification & Scoring',
    goal: 'Score the lead against the ICP',
    description:
      'Judge computes a leadScore 0-100 based on data completeness + ICP fit. It assigns a leadTier (cold / warm / hot) and flags disqualified leads with explicit reasons.',
    inputs: ['enriched prospect', 'ICP criteria'],
    outputs: ['leadScore', 'leadTier', 'qualification reasons'],
    successCriteria: [
      'leadScore is an integer 0-100',
      'leadTier is one of cold / warm / hot',
      'Disqualified leads have an explicit reason string',
    ],
    failureHandling:
      'If no ICP is configured, score purely on data completeness (more complete = warmer). Never fail the pipeline because of a missing ICP.',
    intentRequired: ['score_lead'],
    optional: true,
    timeoutMs: 20_000,
  },
  {
    index: 6,
    agent: 'bard',
    name: 'Outreach Composition',
    goal: 'Compose the personalized first-touch message',
    description:
      'Bard composes a subject line + body using the enriched data. It personalizes with company name, contact name, and recent trigger events. It stays under 120 words and avoids spam patterns.',
    inputs: ['enriched prospect', 'trigger events'],
    outputs: ['subject + body of outreach message'],
    successCriteria: [
      'Subject line is under 60 chars',
      'Body is under 120 words',
      'Message references at least 1 prospect-specific fact',
      'No spam patterns (all-caps, excessive punctuation, spam trigger words)',
    ],
    failureHandling:
      'If LLM composition fails, use a templated outreach with the company name + industry as personalization tokens.',
    intentRequired: ['compose_outreach'],
    optional: true,
    timeoutMs: 25_000,
  },
  {
    index: 7,
    agent: 'flow',
    name: 'Pipeline & Session Management',
    goal: 'Move the lead through stages and schedule follow-ups',
    description:
      'Flow updates the lead stage (new → enriched → qualified → contacted → responded), schedules follow-up sequences via the Vellum scheduler, and forwards KPI updates to the campaign counters.',
    inputs: ['lead id', 'new stage'],
    outputs: ['updated lead row', 'scheduled follow-ups'],
    successCriteria: [
      'Lead stage transition is monotonic (never goes backwards)',
      'Follow-up sequences are scheduled with a non-null nextRunAt',
      'Campaign KPI counters are incremented exactly once per lead per stage',
    ],
    failureHandling:
      'If the scheduler is unavailable, persist the stage transition only and log a warning. Do NOT block the pipeline on scheduler availability.',
    optional: true,
    timeoutMs: 10_000,
  },
  {
    index: 8,
    agent: 'echo',
    name: 'Insights & Reporting',
    goal: 'Generate the final summary and actionable insights',
    description:
      'Echo generates a natural-language summary of the pipeline run, surfaces 3-5 actionable insights the user can act on, and updates the campaign KPI counters (leadsFound, leadsQualified, leadsContacted).',
    inputs: ['full pipeline state + all agent outputs'],
    outputs: ['summary string', 'actionable insights array', 'KPI deltas'],
    successCriteria: [
      'Summary is under 280 characters',
      '3-5 insights are returned, each with a clear action verb',
      'KPI deltas are non-negative integers',
    ],
    failureHandling:
      'If insight generation fails, return a structured summary built from the raw agent outputs. Never fail the entire pipeline in Echo — always return something.',
    timeoutMs: 15_000,
  },
];

// ============================================================
// Constraints — applied to every pipeline run
// ============================================================

export interface SOPConstraints {
  /** Hard wall-clock budget for an entire pipeline run. */
  totalTimeoutMs: number;
  /** Per-phase timeout budget. */
  perPhaseTimeoutMs: number;
  /** Maximum LLM tokens consumed per pipeline run. */
  maxTokensPerRun: number;
  /** Maximum number of leads that can be enriched per run. */
  maxLeadsPerRun: number;
  /** Maximum number of HTTP requests Forge may make per lead. */
  maxHttpRequestsPerLead: number;
  /** Forbidden URL patterns (SSRF, internal IPs, localhost). */
  forbiddenUrlPatterns: string[];
  /** Required URL schemes (Forge will only crawl these). */
  allowedUrlSchemes: string[];
  /** Output guardrails — patterns that block the final response. */
  outputGuardrails: {
    blockPIIInSummary: boolean;
    blockProfanity: boolean;
    blockCompetitorMentions: string[];
  };
}

export const SOP_CONSTRAINTS: SOPConstraints = {
  totalTimeoutMs: 300_000, // 5 min — matches the SSE endpoint's maxDuration
  perPhaseTimeoutMs: 60_000,
  maxTokensPerRun: 50_000,
  maxLeadsPerRun: 5,
  maxHttpRequestsPerLead: 8,
  forbiddenUrlPatterns: [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.',
    '192.168.',
    '172.16.',
    '169.254.',
    '.internal',
    '.local',
    'metadata.google.internal', // cloud metadata SSRF
  ],
  allowedUrlSchemes: ['http:', 'https:'],
  outputGuardrails: {
    blockPIIInSummary: true,
    blockProfanity: true,
    blockCompetitorMentions: [],
  },
};

// ============================================================
// Intent → SOP Variant Router
// ============================================================

export function pickSopVariant(intent: UserIntent): SOPVariant {
  for (const v of Object.values(SOP_VARIANTS)) {
    if (v.intents.includes(intent)) return v.variant;
  }
  // Default fallback — discovery is the most general-purpose SOP
  return 'discovery';
}

// ============================================================
// Intent → Phases Selector
// ============================================================

export function selectPhasesForIntent(intent: UserIntent): SOPPhaseSpec[] {
  const variant = SOP_VARIANTS[pickSopVariant(intent)];
  const phaseSet = new Set(variant.phases);
  return SOP_PHASES.filter(p => phaseSet.has(p.agent));
}

// ============================================================
// Public SOP Manifest (consumed by the admin UI & evals)
// ============================================================

export interface SOPManifest {
  version: string;
  publishedAt: string;
  agents: AgentSpec[];
  variants: SOPVariantSpec[];
  phases: SOPPhaseSpec[];
  constraints: SOPConstraints;
}

export function getSopManifest(): SOPManifest {
  return Object.freeze({
    version: SOP_VERSION,
    publishedAt: SOP_PUBLISHED_AT,
    agents: Object.values(AGENTS),
    variants: Object.values(SOP_VARIANTS),
    phases: SOP_PHASES,
    constraints: SOP_CONSTRAINTS,
  }) as SOPManifest;
}
