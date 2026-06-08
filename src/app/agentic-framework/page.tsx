'use client';

import { MarketingLayout } from '@/components/marketing/marketing-layout';
import {
  Brain, Search, Database, Globe, Target, Mail, Activity, FileText,
  ChevronRight, ArrowRight, Zap, Shield, BarChart3, Cpu, Network,
  Layers, Clock, CheckCircle2, AlertTriangle, Sparkles, Workflow
} from 'lucide-react';

const AGENTS = [
  {
    name: 'Atlas',
    role: 'Master Orchestrator',
    icon: Brain,
    color: '#8B5CF6',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/30',
    description:
      'Atlas is the strategic commander of the entire system. It never executes research or outreach itself — it coordinates the agents that do. When a user submits a campaign brief like "Find accounting firms in Dubai," Atlas decomposes the request into a structured execution plan, assigns each task to the right agent, monitors progress in real-time, and adapts the strategy when intermediate results deviate from targets.',
    capabilities: [
      'Campaign planning with LLM-powered brief decomposition',
      'Task decomposition into 5-8 atomic sub-tasks with dependency graphs',
      'Agent delegation based on capability matching and channel access',
      'Real-time progress monitoring through AgentTask progress fields',
      'Adaptive strategy with trigger thresholds for low results, high cold ratios, and channel failures',
      'Result synthesis with deduplication and confidence scoring',
      'Quality assurance validation before delivering results',
    ],
    channels: 'None — delegates all external data gathering to specialized agents',
    philosophy: '"Never do what another agent can do better. Never block on a single point of failure. Always deliver something."',
    keyMetric: '95% campaign completion rate, <5 min time-to-first-deliverable',
  },
  {
    name: 'Scout',
    role: 'Lead Discovery & Prospecting Specialist',
    icon: Search,
    color: '#10B981',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/30',
    description:
      'Scout casts the widest net across every channel simultaneously. Using Promise.allSettled, it fires 6 parallel searches across Exa, Reddit, LinkedIn People, LinkedIn Companies, Twitter, and Twitter Users. When results stream back, Scout normalizes them into a unified pool, feeds them to the LLM for structured company extraction, deduplicates across channels, and persists Lead records with full source attribution.',
    capabilities: [
      '6-channel parallel search with Promise.allSettled for resilience',
      'Channel-specific query adaptation (different queries per channel type)',
      'LLM-powered extraction from raw search data into structured company records',
      'Cross-channel deduplication with confidence scoring',
      'LLM knowledge fallback when all search channels fail',
      'Source diversity scoring for campaign coverage assessment',
    ],
    channels: 'Exa Search, LinkedIn People, LinkedIn Companies, Twitter/X, Reddit, Web (Jina Reader), GitHub',
    philosophy: '"A prospect found on only one channel is still a prospect. A prospect found on zero channels is a missed opportunity."',
    keyMetric: '15+ unique prospects per campaign, 80%+ channel success rate',
  },
  {
    name: 'Forge',
    role: 'Lead Data Enrichment Specialist',
    icon: Database,
    color: '#3B82F6',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    description:
      'Forge transforms bare company names into fully enriched lead records. Through a 5-stage pipeline — website read, Exa search enrichment, LinkedIn people + company search, Twitter user search, and LLM synthesis — Forge fills in 34 data fields including emails, phone numbers, key decision-makers, firmographics, and technology stack. Every data point is confidence-scored, and conflicting sources are resolved through a weighted priority hierarchy.',
    capabilities: [
      '5-stage enrichment pipeline with parallel channel execution',
      '34-field data collection with per-field confidence scoring',
      'Email pattern detection and generation from corporate email conventions',
      'Cross-source data fusion with conflict resolution',
      'Source priority hierarchy: Website > LinkedIn > Exa > Twitter > GitHub > LLM',
      'No-stall guarantee: leads advance even if enrichment partially fails',
    ],
    channels: 'Web (Jina Reader), Exa Search, LinkedIn, Twitter/X, GitHub',
    philosophy: '"Data without depth is noise. Depth without verification is fiction. I forge both into truth."',
    keyMetric: '80%+ data completeness per lead, <30s per lead enrichment',
  },
  {
    name: 'Sage',
    role: 'Deep Web Research & Intelligence Specialist',
    icon: Globe,
    color: '#06B6D4',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/30',
    description:
      'Sage is the opposite of a search engine — it returns understanding, not documents. Following a rigorous 6-stage research methodology, Sage defines scope, identifies sources, collects multi-source data, deep-reads the top 3 web pages, synthesizes findings with LLM analysis, and generates structured intelligence briefs with full citation and attribution. Every claim is traced to a source, every inference is distinguished from a fact.',
    capabilities: [
      '6-stage research methodology modeled on professional intelligence analysis',
      'Multi-source collection across 6 channels simultaneously',
      'Deep reading pipeline for top 3 URLs with full content extraction',
      'Source evaluation framework: Reliability × Recency × Relevance scoring',
      '3-tier citation system: Direct, Cross-Referenced, Inferred',
      'Fact vs. inference distinction with explicit marking',
    ],
    channels: 'Web, Exa Search, LinkedIn, Twitter/X, YouTube, Reddit, RSS, GitHub',
    philosophy: '"Information is abundant. Intelligence is scarce. I find the signal in the noise."',
    keyMetric: '3+ source types per brief, 80%+ findings from sources <1 year old',
  },
  {
    name: 'Judge',
    role: 'Lead Scoring & Qualification Specialist',
    icon: Target,
    color: '#F59E0B',
    colorClass: 'text-amber-400',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/30',
    description:
      'Judge scores every lead with forensic precision using a 5-factor weighted composite model: Firmographic Fit (30%), Intent Signals (25%), Reachability (20%), Strategic Value (15%), and Data Completeness (10%). Each factor is decomposable into sub-scores with explicit reasoning. Judge also runs ICP matching, intent signal detection via Agent-Reach searches, and a disqualification framework with audit trails. Boost and cap rules ensure leads are classified correctly: Hot (80-100), Warm (50-79), or Cold (0-49).',
    capabilities: [
      '5-factor composite scoring with weighted calculation (0-100 scale)',
      'ICP matching engine with hard disqualification checks',
      'Intent signal detection via Exa search (hiring, funding, expansion, tech adoption)',
      'Reachability assessment across email, phone, LinkedIn, and social channels',
      'Boost/cap rules for tier classification (intent boost, no-contact cap, firmographic gate)',
      'Full disqualification framework with reason codes and audit trails',
    ],
    channels: 'Web (Jina Reader), Exa Search, LinkedIn',
    philosophy: '"Not every lead deserves your sales team\'s time. I ensure only the right ones get it."',
    keyMetric: '15% Hot / 35% Warm / 50% Cold tier distribution target',
  },
  {
    name: 'Bard',
    role: 'Personalized Outreach Specialist',
    icon: Mail,
    color: '#EC4899',
    colorClass: 'text-pink-400',
    bgClass: 'bg-pink-500/10',
    borderClass: 'border-pink-500/30',
    description:
      'Bard crafts outreach so personalized it feels hand-written. Applying 5 layers of personalization — Company Context, Contact Role, Pain Points, Social Proof, and Timing — Bard composes cold emails, LinkedIn connection requests, and follow-up sequences. Every message is checked for CAN-SPAM and GDPR compliance, scored for quality before sending, and designed with A/B test variants for continuous optimization. Bard never uses generic templates; every message references specific details about the prospect.',
    capabilities: [
      '5-layer personalization: Company Context, Contact Role, Pain Points, Social Proof, Timing',
      '4 tone profiles: Strategic, Balanced, Practical, Conversational (auto-selected by seniority)',
      '7 message types: Cold Email, Warm Intro, LinkedIn Connection, 3 Follow-ups, Break-up',
      'Full CAN-SPAM and GDPR compliance checking',
      'A/B testing with systematic variant generation',
      'Message quality scoring (0-100) with 5 dimensions',
    ],
    channels: 'LinkedIn, Web (Jina Reader), Exa Search',
    philosophy: '"The best outreach doesn\'t feel like outreach. It feels like someone understood you before you ever met."',
    keyMetric: '40%+ open rate, 15%+ reply rate, 3+ personalization references per message',
  },
  {
    name: 'Flow',
    role: 'Pipeline & Lead Lifecycle Manager',
    icon: Activity,
    color: '#3B82F6',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/30',
    description:
      'Flow ensures no lead falls through the cracks. Operating as an always-on daemon, it manages the complete pipeline lifecycle through a 9-stage state machine (New, Enriched, Qualified, Contacted, Engaged, Negotiating, Closed-Won, Closed-Lost, Nurture) with 14 valid transitions. Every transition follows a 7-step protocol: Validate, Authorize, Pre-commit, Commit, Post-commit, Audit, Verify. Flow enforces max dwell times, schedules follow-ups with timezone awareness, detects engagement signals, and triggers alerts when leads go stale.',
    capabilities: [
      '9-stage pipeline state machine with 14 validated transitions',
      '7-step transition protocol with transactional integrity',
      'Follow-up scheduling with timezone-aware business-hour enforcement',
      'Engagement detection and scoring with progressive decay monitoring',
      'Staleness alerts with forced escalation for overdue leads',
      'Complete audit trail for every state change',
    ],
    channels: 'Database only — no direct Agent-Reach channel access',
    philosophy: '"No lead falls through the cracks. Every prospect gets timely engagement. The pipeline runs like a well-oiled machine."',
    keyMetric: '95% follow-up adherence, 0 leads past max dwell time without alert',
  },
  {
    name: 'Echo',
    role: 'Report & Deliverable Generation Specialist',
    icon: FileText,
    color: '#8B5CF6',
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/30',
    description:
      'Echo transforms raw pipeline data into professional, actionable deliverables. Whether generating XLSX prospect lists with 34-column schemas and conditional formatting, PDF campaign summaries with embedded charts and LLM-generated narratives, or JSON dashboard data for real-time visualization, Echo treats formatting as a first-class concern. Every number is traceable to its source, every missing field is explicitly marked (never silently zero-filled), and every chart includes titles, legends, and data labels.',
    capabilities: [
      '6 report types: Prospect List, Campaign Summary, Pipeline Dashboard, Lead Score, Outreach, Custom Export',
      'Multi-format output: XLSX (exceljs), CSV (stream), PDF (Puppeteer), JSON (serialized)',
      'Chart generation with ECharts: bar, pie/donut, funnel, line/trend, heatmap',
      '34-column spreadsheet schema with conditional formatting and frozen panes',
      'LLM narrative generation for executive summaries and recommendations',
      'Complete data accuracy validation with null value handling and PII protection',
    ],
    channels: 'Database only — no direct Agent-Reach channel access',
    philosophy: '"Data without presentation is noise. Reports without accuracy are fiction. Echo delivers neither."',
    keyMetric: '100% data-to-output fidelity, client-shareable without modification',
  },
];

const PIPELINE_STEPS = [
  { step: 1, time: 'T+0:00', agent: 'Atlas', action: 'Parses campaign brief, generates execution plan, creates Campaign record' },
  { step: 2, time: 'T+0:01', agent: 'Scout', action: 'Fires 6 parallel channel searches, extracts structured company data, creates Lead records' },
  { step: 3, time: 'T+0:18', agent: 'Forge', action: 'Enriches each lead through 5-stage pipeline: website, Exa, LinkedIn, Twitter, LLM synthesis' },
  { step: 4, time: 'T+0:42', agent: 'Judge', action: 'Scores each lead on 5 factors, detects intent signals, classifies into Hot/Warm/Cold tiers' },
  { step: 5, time: 'T+0:50', agent: 'Bard', action: 'Crafts personalized outreach for qualified leads with 5-layer personalization and compliance checks' },
  { step: 6, time: 'T+0:57', agent: 'Echo', action: 'Generates campaign report with metrics, charts, and LLM-generated recommendations' },
];

const DECISION_SCENARIOS = [
  {
    title: 'Broad Discovery Query',
    example: '"Find marketing agencies in London"',
    flow: 'Atlas → Scout (full 6-channel search) → Forge (enrich all leads) → Judge (score with relaxed ICP) → Bard (compose for Hot/Warm) → Echo (report)',
    reasoning:
      'When the query is broad, Scout casts the widest net. Judge uses a relaxed ICP to avoid over-filtering. Bard creates differentiated messages for Hot and Warm tiers, and the full pipeline runs to completion because broad queries typically produce sufficient volume.',
  },
  {
    title: 'Niche Industry Query',
    example: '"Find quantum computing startups in Zurich"',
    flow: 'Atlas → Scout (6 channels + GitHub) → Atlas (adaptive: broaden to "Quantum OR Physics OR Deep Tech" + "Zurich OR Basel") → Scout (supplementary search) → Forge → Judge → Bard → Echo',
    reasoning:
      'Niche queries risk low discovery volume. Atlas monitors Scout\'s results in real-time; if fewer than 10 leads are found, it triggers an adaptive strategy — broadening the search terms and geographic scope, and adding GitHub as a supplementary channel for tech companies.',
  },
  {
    title: 'Intent-Specific Query',
    example: '"Find companies hiring VP of Data Engineering"',
    flow: 'Atlas → Scout (search-focused on job boards, LinkedIn, Twitter) → Forge (enrich with hiring details) → Judge (weighted toward Intent Signals at 40%) → Bard (urgency-based messaging) → Echo',
    reasoning:
      'When the user\'s query signals buying intent detection (hiring signals), Atlas instructs Judge to weight Intent Signals higher than the default 25%. Bard uses urgency-based messaging that references the hiring signal directly, creating timely, relevant outreach.',
  },
  {
    title: 'Deep Research Query',
    example: '"Analyze the AI healthcare market in Southeast Asia"',
    flow: 'Atlas → Sage (6-stage research methodology) → Echo (intelligence brief)',
    reasoning:
      'Research queries bypass the full prospect pipeline. Atlas dispatches directly to Sage, which conducts a 6-stage research process: define scope, identify sources, multi-source collection, deep reading, LLM analysis, and briefing generation. The output is an intelligence brief, not a lead list.',
  },
  {
    title: 'Re-Engagement Query',
    example: '"Re-engage cold leads from Q4 campaign"',
    flow: 'Atlas → Flow (identify nurture-eligible leads) → Forge (re-enrich with fresh data) → Judge (re-qualify with updated ICP) → Bard (nurture sequence design) → Flow (schedule follow-ups)',
    reasoning:
      'Re-engagement is pipeline-first. Flow identifies leads in Nurture or Closed-Lost stages that are eligible for re-engagement. Forge re-enriches them with fresh data, Judge re-qualifies with current ICP criteria, and Bard designs a nurture sequence with warm re-entry messaging.',
  },
];

const CHANNELS = [
  { name: 'Exa Search', type: 'Semantic Web Search', agents: ['Scout', 'Forge', 'Sage', 'Judge', 'Bard'], rateLimit: '30 req/min' },
  { name: 'Web (Jina Reader)', type: 'Deep Content Extraction', agents: ['Scout', 'Forge', 'Sage', 'Judge', 'Bard'], rateLimit: '60 req/min' },
  { name: 'LinkedIn People', type: 'Professional Profile Search', agents: ['Scout', 'Forge', 'Sage', 'Bard'], rateLimit: '10 req/min' },
  { name: 'LinkedIn Companies', type: 'Company Page Search', agents: ['Scout', 'Forge', 'Sage', 'Bard'], rateLimit: '10 req/min' },
  { name: 'LinkedIn Read Page', type: 'Company Page Deep Read', agents: ['Forge', 'Sage', 'Bard'], rateLimit: '10 req/min' },
  { name: 'Twitter/X Search', type: 'Real-time Social Search', agents: ['Scout', 'Sage'], rateLimit: '15 req/min' },
  { name: 'Twitter/X Users', type: 'Account Discovery', agents: ['Scout', 'Forge', 'Sage'], rateLimit: '15 req/min' },
  { name: 'Reddit', type: 'Community Discussion Search', agents: ['Scout', 'Sage'], rateLimit: '30 req/min' },
  { name: 'GitHub', type: 'Repository & Tech Stack', agents: ['Scout', 'Forge', 'Sage'], rateLimit: '60 req/min' },
  { name: 'YouTube', type: 'Conference Talks & Reviews', agents: ['Sage'], rateLimit: '20 req/min' },
  { name: 'RSS', type: 'Industry Publication Feeds', agents: ['Sage'], rateLimit: '30 req/min' },
  { name: 'YouTube Subtitles', type: 'Video Transcript Extraction', agents: ['Sage'], rateLimit: '10 req/min' },
  { name: 'LinkedIn Get Profile', type: 'Profile Verification', agents: ['Judge', 'Bard'], rateLimit: '10 req/min' },
  { name: 'GitHub View Repo', type: 'Repository Deep Analysis', agents: ['Forge', 'Sage'], rateLimit: '60 req/min' },
  { name: 'Exa Search (LinkedIn)', type: 'LinkedIn via Exa Fallback', agents: ['Scout', 'Forge', 'Sage', 'Bard'], rateLimit: '30 req/min' },
  { name: 'Exa Search (Twitter)', type: 'Twitter via Exa Fallback', agents: ['Scout', 'Sage'], rateLimit: '30 req/min' },
  { name: 'Jina Search Fallback', type: 'Universal Fallback Channel', agents: ['Scout', 'Forge', 'Sage'], rateLimit: '60 req/min' },
];

const QA_MECHANISMS = [
  {
    icon: CheckCircle2,
    title: 'Data Validation Engine',
    description:
      'Before any lead reaches the user, our system validates that company names are real (not "Click here" or "404"), website URLs are well-formed, industry classifications are populated, and at least one contact channel exists. Leads that fail validation are flagged with low data completeness scores and noted in the campaign output.',
  },
  {
    icon: AlertTriangle,
    title: 'Adaptive Strategy System',
    description:
      'When intermediate results deviate from targets, Atlas triggers adaptive actions: broadening search terms when fewer than 10 leads are found, re-qualifying with relaxed ICP when Hot lead ratios are below 5%, adding channels when primary channels fail, and escalating to the user when all adaptive actions are exhausted.',
  },
  {
    icon: Shield,
    title: 'Graceful Degradation',
    description:
      'When full pipeline execution is not possible, the system degrades gracefully through four levels: (1) skip outreach but complete qualification, (2) skip enrichment and auto-advance, (3) score directly from raw discovery data, (4) fall back to LLM parametric knowledge. At each level, results are annotated with the degradation level so users understand confidence implications.',
  },
  {
    icon: Sparkles,
    title: 'Circuit Breaker & Retry',
    description:
      'If a specific Agent-Reach channel fails consistently (3+ failures in 10 minutes), the circuit breaker marks it as "warn" and reroutes to alternative channels for 15 minutes. Task-level retries (max 2), LLM-level retries (1), and JSON parsing retries (2 with increasingly strict prompts) ensure transient failures do not cascade into campaign failures.',
  },
];

export default function AgenticFrameworkPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Workflow className="h-5 w-5 text-violet-400" />
              <span className="text-sm font-medium text-violet-400 uppercase tracking-wider">Agentic System Framework</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              8 Hyper-Specialized Agents. <span className="text-gradient">One Coordinated System.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Every query type — from broad discovery to niche targeting, from intent detection to deep research — is handled by a different combination of agents, channels, and decision frameworks. This is the complete technical architecture of how LeadReach AI transforms intent into action.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              System Architecture
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The LeadReach AI platform is built on a multi-agent orchestration architecture where each agent is a hyper-specialized autonomous unit with its own cognitive style, channel access, decision framework, and performance metrics. The Orchestrator (Atlas) coordinates these agents through structured task delegation, dependency-aware execution graphs, and real-time progress monitoring.
            </p>
          </div>

          {/* Architecture Diagram */}
          <div className="rounded-2xl border border-border/50 bg-card/50 p-8 lg:p-12">
            <div className="flex flex-col items-center">
              {/* Atlas at top */}
              <div className="flex items-center gap-3 mb-8 px-6 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                <Brain className="h-6 w-6 text-violet-400" />
                <span className="font-semibold text-violet-400">Atlas — Orchestrator</span>
              </div>
              <div className="h-8 w-px bg-border/50" />
              {/* Execution pipeline */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">Campaign Brief</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Execution Plan</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Task Dispatch</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Synthesis</span>
              </div>
              <div className="h-4 w-px bg-border/50" />
              {/* Agent grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mt-4">
                {AGENTS.filter(a => a.name !== 'Atlas').map(agent => (
                  <div
                    key={agent.name}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${agent.borderClass} ${agent.bgClass}`}
                  >
                    <agent.icon className="h-5 w-5" style={{ color: agent.color }} />
                    <span className="text-xs font-medium text-foreground">{agent.name}</span>
                  </div>
                ))}
              </div>
              {/* Channels bar */}
              <div className="h-4 w-px bg-border/50 mt-4" />
              <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Network className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">17+ Agent-Reach Channels</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Pipeline Flow */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Campaign Pipeline Flow
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Here is a typical campaign execution timeline — from the moment a user submits a brief to the final report. Each step is handled by a different agent, and the entire pipeline completes in under 60 seconds for simple campaigns.
            </p>
          </div>
          <div className="space-y-4">
            {PIPELINE_STEPS.map((step) => {
              const agent = AGENTS.find(a => a.name === step.agent);
              return (
                <div
                  key={step.step}
                  className="flex items-start gap-6 rounded-xl border border-border/50 bg-card/50 p-6 hover:border-border transition-colors"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`inline-flex rounded-lg ${agent?.bgClass || 'bg-violet-500/10'} p-2`}>
                      {agent?.icon ? <agent.icon className="h-5 w-5" style={{ color: agent.color }} /> : <Brain className="h-5 w-5 text-violet-400" />}
                    </div>
                    <span className="mt-1 text-xs font-mono text-muted-foreground">{step.time}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground">STEP {step.step}</span>
                      <span className="text-sm font-semibold text-foreground">{step.agent}</span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.action}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent Deep Dives */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Agent Deep Dives
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Each agent is a self-contained autonomous unit with its own identity, cognitive style, decision framework, and performance metrics. Here is the complete specification of every agent in the system.
            </p>
          </div>
          <div className="space-y-8">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className={`rounded-2xl border ${agent.borderClass} ${agent.bgClass} p-8 lg:p-10`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className={`inline-flex rounded-xl ${agent.bgClass} p-3`}>
                    <agent.icon className="h-7 w-7" style={{ color: agent.color }} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{agent.name}</h3>
                    <p className={agent.colorClass}>{agent.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">{agent.description}</p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Core Capabilities</h4>
                    <ul className="space-y-2">
                      {agent.capabilities.map((cap) => (
                        <li key={cap} className="flex items-start gap-2">
                          <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: agent.color }} />
                          <span className="text-sm text-muted-foreground">{cap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Agent-Reach Channels</h4>
                      <p className="text-sm text-muted-foreground">{agent.channels}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Design Philosophy</h4>
                      <p className="text-sm text-muted-foreground italic">{agent.philosophy}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Key Performance Target</h4>
                      <p className="text-sm text-muted-foreground">{agent.keyMetric}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision-Making Framework */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Decision-Making Framework
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Different query types activate different agent combinations, channel selections, and scoring weights. Atlas acts as the strategic router — analyzing the user's intent, selecting the appropriate execution pattern, and adjusting agent parameters dynamically. Here are five representative decision scenarios.
            </p>
          </div>
          <div className="space-y-6">
            {DECISION_SCENARIOS.map((scenario) => (
              <div
                key={scenario.title}
                className="rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-border transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Cpu className="h-5 w-5 text-violet-400" />
                  <h3 className="text-lg font-semibold text-foreground">{scenario.title}</h3>
                </div>
                <div className="mb-4 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 inline-block">
                  <code className="text-sm text-emerald-400">{scenario.example}</code>
                </div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent Flow</span>
                  <p className="text-sm text-foreground font-medium mt-1">{scenario.flow}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Decision Reasoning</span>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{scenario.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Channel Directory */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              17+ Agent-Reach Channels
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The Agent-Reach Bridge provides typed access to 17+ channels across web search, social media, professional networks, developer platforms, and video platforms. Each channel has multi-method fallback pipelines (primary → secondary → tertiary) to ensure resilience against rate limits, outages, and authentication failures.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Channel</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available To</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rate Limit</th>
                </tr>
              </thead>
              <tbody>
                {CHANNELS.map((channel) => (
                  <tr key={channel.name} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{channel.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{channel.type}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      <div className="flex flex-wrap gap-1">
                        {channel.agents.map(a => (
                          <span key={a} className="inline-flex items-center rounded bg-violet-500/10 px-2 py-0.5 text-xs font-medium text-violet-400">{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-foreground font-mono">{channel.rateLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Quality Assurance */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Quality Assurance & Resilience
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Building an 8-agent system with 17+ channels means that failures are not exceptional — they are expected. Our quality assurance framework is designed to ensure that every campaign delivers actionable results, even when channels fail, agents encounter errors, or data is sparse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {QA_MECHANISMS.map((mechanism) => (
              <div
                key={mechanism.title}
                className="rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-border transition-colors"
              >
                <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 mb-4">
                  <mechanism.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{mechanism.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{mechanism.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Benchmarks */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Performance Benchmarks
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every agent operates against measurable performance targets. These benchmarks are not aspirational — they are enforced through monitoring, alerting, and adaptive strategy adjustments. When an agent consistently underperforms its target, the system triggers an investigation and optimization cycle.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Campaign Completion Rate', value: '95%+', desc: 'Of dispatched campaigns reaching full completion' },
              { label: 'Time-to-First-Deliverable', value: '<5 min', desc: 'From brief submission to first lead created' },
              { label: 'Lead Data Completeness', value: '80%+', desc: 'Average fields populated per enriched lead' },
              { label: 'Source Diversity', value: '3+ ch.', desc: 'Distinct channel types per campaign' },
              { label: 'Hot Lead Conversion', value: '30%+', desc: 'Hot leads reaching closed-won stage' },
              { label: 'Enrichment Accuracy', value: '90%+', desc: 'Verified contact information accuracy' },
              { label: 'Pipeline Velocity', value: '<30 min', desc: 'Average campaign duration, brief to report' },
              { label: 'Outreach Open Rate', value: '40%+', desc: 'Cold email open rate across campaigns' },
            ].map((benchmark) => (
              <div
                key={benchmark.label}
                className="rounded-xl border border-border/50 bg-card/50 p-6 text-center hover:border-border transition-colors"
              >
                <div className="text-3xl font-bold text-emerald-400 mb-2">{benchmark.value}</div>
                <div className="text-sm font-semibold text-foreground mb-1">{benchmark.label}</div>
                <div className="text-xs text-muted-foreground">{benchmark.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Experience the Framework in Action
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            See how our 8-agent system transforms a single sentence into a fully executed lead generation campaign.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/app"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Launch Platform
            </a>
            <a
              href="/culture"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              Our Culture
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
