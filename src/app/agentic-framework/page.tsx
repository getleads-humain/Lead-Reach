'use client';

import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Brain,
  Search,
  Database,
  Globe,
  Target,
  Mail,
  Activity,
  FileText,
  ArrowRight,
  Zap,
  Network,
  Cpu,
  Shield,
  Layers,
  GitBranch,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles,
  Eye,
  Code2,
  Workflow,
} from 'lucide-react';

const agents = [
  {
    name: 'Atlas',
    role: 'Orchestrator',
    icon: Brain,
    color: '#8B5CF6',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    key: 'orchestrator',
    description: 'The strategic commander that decomposes campaign briefs into structured execution plans, delegates tasks to specialized agents, monitors real-time progress, and synthesizes multi-agent outputs into unified deliverables. Atlas never performs research directly — it coordinates the agents that do, ensuring every step happens in the right order, with the right data, at the right time.',
    capabilities: [
      'Campaign brief parsing with LLM-driven entity extraction',
      'Dependency-aware execution graph generation',
      'Priority-based task delegation (10-point scale)',
      'Real-time progress monitoring through AgentTask records',
      'Adaptive strategy with threshold-triggered re-planning',
      'Multi-agent result synthesis with deduplication',
      'Quality assurance validation before delivery',
      'Graceful degradation through 4 fallback levels',
    ],
    channels: 'None — delegates all external data gathering',
    decisionPhilosophy: 'Never do what another agent can do better. Never block on a single point of failure. Always deliver something — even when channels fail or data is sparse.',
    pipelineRole: 'Entry point and coordinator for every campaign',
  },
  {
    name: 'Scout',
    role: 'Prospect Discovery',
    icon: Search,
    color: '#10B981',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    key: 'prospect-discovery',
    description: 'The relentless hunter that casts the widest net across every available channel simultaneously. Scout fires 6 parallel searches using Promise.allSettled, tolerates partial channel failures, and falls back to LLM knowledge generation when all live channels fail. Its fundamental principle: a prospect found on only one channel is still a prospect, but a prospect found on zero channels is a missed opportunity.',
    capabilities: [
      'Simultaneous 6-channel parallel search (Exa, LinkedIn, Reddit, Twitter, GitHub, Web)',
      'Channel-adaptive query construction per data source',
      'LLM-powered structured company extraction from raw search results',
      'Cross-channel deduplication with source attribution',
      'Source diversity scoring (channel contribution tracking)',
      'LLM knowledge fallback when all channels fail',
      'Channel activity recording for every search operation',
      'Search broadening and narrowing strategies',
    ],
    channels: 'Exa Search, LinkedIn (People + Companies), GitHub, Twitter/X, Reddit, Web (Jina Reader), RSS',
    decisionPhilosophy: 'Exhaustive coverage through channel diversity. No single source can match the completeness of searching all channels simultaneously and merging results.',
    pipelineRole: 'First pipeline stage — transforms campaign briefs into raw prospect lists',
  },
  {
    name: 'Forge',
    role: 'Data Enrichment',
    icon: Database,
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    key: 'data-enrichment',
    description: 'The meticulous craftsman that transforms a bare company name into a fully enriched lead record with every contact detail, firmographic data point, and intelligence signal available. Forge operates with verification obsession: single-source data is a hypothesis, not a fact. Cross-source data fusion resolves conflicts with a weighted priority hierarchy, and every data point carries source attribution and a confidence level.',
    capabilities: [
      '5-stage enrichment pipeline: Website Read → Exa Search → LinkedIn → Twitter → LLM Synthesis',
      '34 data points collected per lead with source attribution',
      'Email pattern discovery engine (8 corporate email patterns)',
      'Cross-source data fusion with confidence scoring (6 levels)',
      'Source priority hierarchy: Company website (10) > LinkedIn (9) > Exa (7) > Twitter (5) > GitHub (4) > LLM (2)',
      'Automatic lead advancement even on partial enrichment failure',
      'Data provenance tracking for every enriched field',
      'Verification-first approach — never fabricates, leaves null rather than guess',
    ],
    channels: 'Web (Jina Reader), Exa Search, LinkedIn (People + Companies), Twitter/X, GitHub',
    decisionPhilosophy: 'Discover aggressively, verify ruthlessly, synthesize carefully. Single-source data is a hypothesis; cross-verified data is a fact.',
    pipelineRole: 'Second pipeline stage — enriches raw leads with contact details and firmographics',
  },
  {
    name: 'Sage',
    role: 'Web Research',
    icon: Globe,
    color: '#06B6D4',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400',
    key: 'web-research',
    description: 'The intelligence analyst that conducts deep-dive research on any target to produce comprehensive intelligence briefs with multi-source verification, proper attribution, and actionable insights. Sage returns understanding, not just documents. Every finding is supported by 3+ sources when possible, and the distinction between facts, inferences, and speculation is always made explicit.',
    capabilities: [
      '6-stage research methodology: Define Scope → Identify Sources → Multi-Source Collection → Deep Reading → LLM Analysis → Briefing',
      'Broadest channel set of any agent: 8 channels including YouTube and RSS',
      '6 research types: Company Deep-Dive, Market Intelligence, Competitive Analysis, News Monitoring, Regulatory Research, Financial Intelligence',
      '3-tier citation system: Direct Citation, Cross-Referenced, Inferred',
      'Source evaluation framework (Reliability × 0.45 + Recency × 0.30 + Relevance × 0.25)',
      'Deep reading pipeline (top 3 URLs read in full, 3000 chars each)',
      'Contradiction detection and resolution between sources',
      'Structured intelligence briefings with executive summaries',
    ],
    channels: 'Web (Jina Reader), Exa Search, LinkedIn, Twitter/X, YouTube, Reddit, RSS, GitHub',
    decisionPhilosophy: 'Research without a question is just browsing. Multi-source triangulation ensures every finding is grounded. Synthesis over summary — identifying patterns invisible in any single source.',
    pipelineRole: 'On-demand — invoked for deep research tasks, competitive analysis, and intelligence briefings',
  },
  {
    name: 'Judge',
    role: 'Lead Qualification',
    icon: Target,
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    key: 'lead-qualification',
    description: 'The precision evaluator that scores and ranks every lead with a 5-factor weighted composite model so the sales team focuses exclusively on highest-potential prospects. Judge computes every score, never guesses. Missing evidence triggers confidence penalties, not assumptions. A lead is either qualified or it is not — ambiguity is surfaced, not hidden.',
    capabilities: [
      '5-factor weighted scoring model (0-100): Firmographic (30%) + Intent (25%) + Reachability (20%) + Strategic (15%) + Data Completeness (10%)',
      'ICP Matching Engine with industry adjacency maps',
      'Intent Signal Detection via Exa Search — 5 signal types: Hiring, Funding, Expansion, Tech Adoption, Product Launch',
      'Lead Tiering: Hot (80-100), Warm (50-79), Cold (0-49) with boost/cap rules',
      'Disqualification Framework with 9 reason codes and audit trails',
      'Confidence Scoring (0-1.0) with High/Medium/Low levels',
      'Enterprise and multi-signal boost logic',
      'Hard disqualification pre-screening before scoring',
    ],
    channels: 'Web (Jina Reader), LinkedIn, Exa Search',
    decisionPhilosophy: 'Every score is computed, never guessed. Missing evidence triggers confidence penalties, not assumptions. A lead is either qualified or it is not — ambiguity is surfaced, not hidden.',
    pipelineRole: 'Third pipeline stage — scores and tiers enriched leads for outreach prioritization',
  },
  {
    name: 'Bard',
    role: 'Outreach Composer',
    icon: Mail,
    color: '#EC4899',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    key: 'outreach-composer',
    description: 'The empathetic communicator that crafts outreach messages so personalized and relevant that recipients feel they were written specifically for them — because they were. Bard writes from the recipient\'s perspective, using persuasion through relevance, not pressure. Every word earns its place, and shorter is almost always better.',
    capabilities: [
      '5-layer personalization engine: Company Context + Contact Role + Pain Points + Social Proof + Timing Hooks',
      '7 message types: Cold Email, Warm Intro, LinkedIn Connection, Follow-Ups #1-3, Break-Up',
      '4 tone profiles: Strategic (C-Level), Balanced (VP/Director), Practical (Manager), Conversational (Startups)',
      'Full compliance framework: CAN-SPAM, GDPR, anti-spam filter optimization',
      'A/B testing strategy with 6 testable variables',
      'Message quality scoring (0-100): Personalization (30%) + Spam Risk (25%) + Clarity (20%) + Value Relevance (15%) + Compliance (10%)',
      'Multi-touch sequence design with tier-specific cadences',
      'Send time optimization (Tue-Thu, 9-11 AM recipient timezone)',
    ],
    channels: 'LinkedIn, Web (Jina Reader), Exa Search',
    decisionPhilosophy: 'Persuasion through relevance, not pressure. Every message starts from the recipient\'s perspective. The best outreach does not feel like outreach — it feels like someone understood you before you ever met.',
    pipelineRole: 'Fourth pipeline stage — crafts personalized outreach for qualified leads',
  },
  {
    name: 'Flow',
    role: 'Pipeline Manager',
    icon: Activity,
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    key: 'pipeline-manager',
    description: 'The systematic guardian that ensures no lead falls through the cracks, every prospect gets timely engagement, and the pipeline runs like a well-oiled machine. Flow operates as an always-on daemon with a strict state machine engine — 9 pipeline stages with 14 directed edges and O(1) transition validation. No shortcuts, no bypasses, no exceptions.',
    capabilities: [
      'State Machine Engine: 9 stages, 14 directed edges, O(1) transition validation',
      '9 Pipeline Stages: NEW → ENRICHED → QUALIFIED → CONTACTED → ENGAGED → NEGOTIATING → CLOSED-WON / CLOSED-LOST / NURTURE',
      'Event Processing System with 8 priority levels (P0: hard bounce → P3: CRM sync)',
      'Follow-Up Scheduling Engine with timezone-aware business-hour enforcement',
      'Engagement Detection System with score decay (5% daily after 72h inactivity)',
      'Pipeline Analytics Engine (conversion rates, velocity, forecasting, health score)',
      'Alert Management System (stale leads, missed SLAs, data quality)',
      'Data Hygiene Framework (deduplication, stale detection, quality scoring)',
    ],
    channels: 'Database only — no direct Agent-Reach channel access',
    decisionPhilosophy: 'Prevention over cure. Loss aversion over gain seeking. Systematic processing over heuristic shortcuts. No shortcuts, no bypasses — every transition follows the protocol.',
    pipelineRole: 'Always-on daemon — manages the entire lead lifecycle across all stages',
  },
  {
    name: 'Echo',
    role: 'Report Generator',
    icon: FileText,
    color: '#8B5CF6',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    key: 'report-generator',
    description: 'The precision documentarian that transforms raw pipeline data into professional, actionable deliverables. Every number is traceable to its source, every format is intentional, and missing data is explicitly marked rather than silently omitted. Data without presentation is noise; reports without accuracy are fiction.',
    capabilities: [
      '6 report types: Prospect List (XLSX), Campaign Summary (PDF), Pipeline Health Dashboard (JSON), Lead Score Report (XLSX), Outreach Report (PDF), Custom Export',
      '34-column spreadsheet schema with conditional formatting, frozen panes, auto-filters',
      'Chart & Visualization Engine: Bar, Pie/Donut, Funnel, Line/Trend, Heatmap, Table',
      'Data Aggregation Pipeline: Query → Type Coercion → Validation → Enrichment → Formatting',
      'Format Conversion Layer: XLSX, CSV, PDF, JSON',
      'LLM Narrative Generator for executive summaries and trend insights',
      'CRM Export Templates with custom field mapping',
      'Scheduled Reporting with email delivery',
    ],
    channels: 'Database + LLM — no direct Agent-Reach channel access',
    decisionPhilosophy: 'Data accuracy over format fidelity over visual quality over speed. Every number traceable, every format intentional, missing data explicitly marked.',
    pipelineRole: 'On-demand + scheduled — generates deliverables at campaign completion and on schedule',
  },
];

export default function AgenticFrameworkPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-border/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 mb-6">
              <Brain className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-400">Agentic Framework</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              The <span className="text-gradient">Full Agentic System</span> Framework
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Eight hyper-specialized AI agents. One orchestrating intelligence. Seventeen research channels. A single pipeline from vague intent to qualified, engaged prospects. This is the complete technical architecture behind LeadReach AI — how each agent thinks, decides, and executes, and how they coordinate to deliver outcomes no single agent could achieve alone.
            </p>
          </div>
        </div>
      </section>

      {/* System Architecture Overview */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-4">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">System Architecture</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Multi-Agent Orchestration Architecture
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              LeadReach AI is not a single monolithic AI. It is a coordinated society of hyper-specialized agents, each designed with a distinct cognitive style, personality, and domain expertise. The system follows a decompose-then-orchestrate pattern: Atlas parses the user&apos;s intent into an execution graph, delegates each node to the agent best suited for that capability, monitors progress in real-time, and synthesizes the outputs into a unified deliverable. No single agent could produce the same result — the power is in the coordination.
            </p>
          </div>

          {/* Architecture diagram as visual cards */}
          <div className="grid gap-4 lg:grid-cols-5 mb-8">
            <div className="lg:col-span-5 card-premium border-violet-500/30 bg-card/50 p-6 rounded-xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 mb-3">
                <Brain className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-violet-400">Atlas — Orchestrator</span>
              </div>
              <p className="text-sm text-muted-foreground">Receives campaign brief, generates execution plan, delegates to specialized agents, monitors progress, synthesizes results</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <ChevronRight className="h-4 w-4 text-violet-400 rotate-90" />
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { name: 'Scout', role: 'Discovery', color: 'emerald' },
                { name: 'Forge', role: 'Enrichment', color: 'blue' },
                { name: 'Sage', role: 'Research', color: 'cyan' },
                { name: 'Judge', role: 'Qualification', color: 'amber' },
                { name: 'Bard', role: 'Outreach', color: 'pink' },
                { name: 'Flow', role: 'Pipeline', color: 'blue' },
                { name: 'Echo', role: 'Reports', color: 'violet' },
              ].map((agent) => (
                <div key={agent.name} className={`card-premium border-${agent.color}-500/30 bg-card/50 p-3 rounded-xl text-center`}>
                  <p className="text-sm font-semibold text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">{agent.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key architectural principles */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: GitBranch,
                title: 'Dependency-Aware Execution',
                description: 'Tasks are not dispatched randomly — they follow a dependency graph. Discovery must complete before enrichment begins, enrichment before qualification, qualification before outreach. The priority system (10-point scale) ensures pipeline-critical tasks run first, while the dependsOn field enforces strict ordering. Parallel execution paths are possible when steps have no dependencies, maximizing throughput without sacrificing correctness.',
              },
              {
                icon: RefreshCw,
                title: 'Adaptive Re-Planning',
                description: 'The system monitors campaign results against expected targets and triggers strategy adjustments when thresholds are crossed. If discovery finds fewer than 10 leads, Atlas broadens the search. If 90% of leads score Cold, Atlas refines the ICP criteria. If channels fail, Atlas reroutes to alternatives. This adaptive loop continues until the campaign meets its success criteria or Atlas determines that further optimization is unlikely and escalates to the user.',
              },
              {
                icon: Shield,
                title: 'Graceful Degradation',
                description: 'When full pipeline execution is not possible, the system degrades gracefully through four levels. Full Pipeline is the standard. Degraded Level 1 skips outreach. Degraded Level 2 skips enrichment, auto-advancing leads. Degraded Level 3 goes directly from discovery to reporting. Degraded Level 4 falls back entirely to LLM parametric knowledge. At each level, results are annotated with the degradation level so users understand confidence implications.',
              },
            ].map((item) => (
              <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                <div className="rounded-lg bg-violet-500/10 p-2.5 w-fit mb-4">
                  <item.icon className="h-5 w-5 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Pipeline — How a Campaign Flows */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-4">
              <Workflow className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Campaign Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How a Campaign Flows Through the System
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A campaign is not a single API call — it is a multi-stage pipeline where each agent receives structured input, performs its hyper-specialized task, and produces structured output that feeds the next agent. The pipeline is linear for the standard case but can branch into parallel paths when independent tasks are identified. Below is the complete lifecycle of a campaign from brief to deliverable.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '01',
                agent: 'Atlas',
                stage: 'BRIEF PARSING & PLANNING',
                color: 'violet',
                time: 'T+0:00 → T+0:02',
                description: 'The user submits a natural language campaign brief — which could be as vague as "Find marketing agencies" or as specific as "Identify Series B SaaS companies in London with 50-200 employees using Salesforce." Atlas parses the brief using LLM-driven entity extraction to identify the industry, location, company size, technology stack, and intent. It then generates a structured execution plan — an ordered array of sub-tasks, each with a designated agent, task type, input payload, and dependency declaration. The plan is validated for circular dependencies, invalid agent references, and resource feasibility before any tasks are dispatched.',
                input: 'Natural language campaign brief',
                output: 'JSON execution plan with 5-8 sub-tasks, Campaign record created in database',
              },
              {
                step: '02',
                agent: 'Scout',
                stage: 'MULTI-CHANNEL DISCOVERY',
                color: 'emerald',
                time: 'T+0:03 → T+0:18',
                description: 'Scout constructs a composite search query from the campaign parameters and fires 6 simultaneous searches across Exa, LinkedIn (People + Companies), Twitter (Tweets + Users), and Reddit using Promise.allSettled. This parallel pattern ensures that no channel blocks another — if Exa times out and Reddit rate-limits, the remaining 4 channels still produce results. Raw search results are pooled and fed to the LLM for structured company extraction. The LLM filters out articles, blog posts, and discussions, extracting only real companies with names, websites, and available contact data. Extracted companies are deduplicated across channels, and each lead record is created in the database with full source attribution.',
                input: 'Query, industry, location parameters',
                output: '18-30 Lead records (stage: "new"), Channel activity records',
              },
              {
                step: '03',
                agent: 'Forge',
                stage: 'DATA ENRICHMENT',
                color: 'blue',
                time: 'T+0:18 → T+0:35',
                description: 'Forge takes each raw lead through a 5-stage enrichment pipeline. First, it reads the company website via Jina Reader to extract phone numbers, emails, addresses, and descriptions. Then it searches Exa for additional firmographic data. Next, it queries LinkedIn for professional profiles and company pages. Twitter provides social presence data and potential contact information. Finally, Forge uses LLM synthesis to resolve conflicts between sources and fill remaining gaps. Every data point is annotated with its source and a confidence level. Cross-source conflicts are resolved using a weighted priority hierarchy where the company website is the highest authority and LLM-generated data is the lowest. Leads that fail partial enrichment are not discarded — they are auto-advanced with reduced confidence scores.',
                input: 'Lead records with basic company data',
                output: 'Enriched Lead records (34 data points each, stage: "enriched")',
              },
              {
                step: '04',
                agent: 'Judge',
                stage: 'LEAD QUALIFICATION & SCORING',
                color: 'amber',
                time: 'T+0:35 → T+0:48',
                description: 'Judge evaluates every enriched lead using a 5-factor weighted composite scoring model that produces a score from 0 to 100. Firmographic fit accounts for 30% of the score — does this company match the target industry, size, and location? Intent signals account for 25% — is the company hiring, raising funding, expanding, or adopting new technology? Reachability accounts for 20% — can we actually contact them? Strategic value accounts for 15% — is this an account that would transform our pipeline? Data completeness accounts for 10% — how confident can we be in the assessment? Judge also performs intent signal detection by searching Exa for hiring posts, funding announcements, and product launches related to each lead. Hard disqualification checks run first (companies with firmographic scores below 20 are auto-Cold). Leads are tiered: Hot (80-100), Warm (50-79), and Cold (0-49).',
                input: 'Enriched Lead records with contact and firmographic data',
                output: 'Scored and tiered Lead records (Hot/Warm/Cold, stage: "qualified")',
              },
              {
                step: '05',
                agent: 'Bard',
                stage: 'PERSONALIZED OUTREACH COMPOSITION',
                color: 'pink',
                time: 'T+0:48 → T+0:55',
                description: 'Bard crafts outreach messages for qualified leads using a 5-layer personalization engine. Layer 1 is Company Context — what does this company do, what challenges does it face, what makes it unique? Layer 2 is Contact Role — who are we writing to and what are their responsibilities? Layer 3 is Pain Points — based on intent signals and industry analysis, what problems is this person likely experiencing? Layer 4 is Social Proof — what evidence can we reference to establish credibility? Layer 5 is Timing Hooks — is there a recent event, funding round, or hiring push that makes this outreach timely? Bard selects the appropriate message type (cold email, LinkedIn connection, follow-up sequences), tone profile (strategic for C-level, practical for managers), and channel based on available contact information. Every message is scored on personalization, spam risk, clarity, value relevance, and compliance before delivery.',
                input: 'Qualified lead records with intent signals and contact data',
                output: 'Personalized outreach messages (5-touch sequences for Hot/Warm, 2-touch for Cold)',
              },
              {
                step: '06',
                agent: 'Echo',
                stage: 'REPORT GENERATION',
                color: 'violet',
                time: 'T+0:55 → T+0:57',
                description: 'Echo aggregates all campaign data — leads found, enrichment rates, qualification distribution, outreach messages composed, channel performance — and generates a comprehensive campaign report. The report includes a 34-column spreadsheet with conditional formatting for immediate analysis, a campaign summary PDF with LLM-generated narrative insights and recommendations, and pipeline health metrics showing conversion rates by stage. Every number in the report is traceable to its source, and missing data is explicitly marked rather than silently replaced with zeros. The report is the final deliverable that the user receives — a complete, actionable artifact they can share with their team or import into their CRM.',
                input: 'All campaign data: leads, scores, messages, channel activity',
                output: 'Campaign report (XLSX + PDF + JSON), ready for download and CRM import',
              },
            ].map((step) => (
              <div key={step.step} className={`card-premium border-${step.color}-500/20 bg-card/50 p-6 rounded-xl`}>
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                  <div className="flex items-start gap-4 lg:w-64 flex-shrink-0">
                    <div className={`rounded-lg p-2.5 bg-${step.color}-500/10`}>
                      <span className={`text-2xl font-bold text-${step.color}-400`}>{step.step}</span>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{step.agent}</p>
                      <p className="text-xs text-muted-foreground">{step.stage}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {step.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <p className="text-xs font-medium text-foreground mb-1">Input</p>
                        <p className="text-xs text-muted-foreground">{step.input}</p>
                      </div>
                      <div className="rounded-lg bg-secondary/30 p-3">
                        <p className="text-xs font-medium text-foreground mb-1">Output</p>
                        <p className="text-xs text-muted-foreground">{step.output}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Individual Agent Deep Dives */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-4">
              <Cpu className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Agent Deep Dives</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Each Agent&apos;s Hyper-Specialized Task Execution
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every agent in the LeadReach AI system is engineered with a distinct cognitive style, decision philosophy, and execution protocol that makes it uniquely suited for its pipeline stage. Below is a detailed examination of each agent&apos;s capabilities, decision frameworks, and how they carry out their specialized tasks for varying types of user queries.
            </p>
          </div>

          <div className="space-y-8">
            {agents.map((agent) => (
              <div key={agent.key} className={`card-premium ${agent.borderColor} bg-card/50 rounded-xl overflow-hidden`}>
                {/* Agent header */}
                <div className={`p-6 border-b ${agent.borderColor} bg-gradient-to-r from-card/80 to-card/50`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className={`rounded-xl ${agent.bgColor} p-3`}>
                      <agent.icon className="h-8 w-8" style={{ color: agent.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-foreground">{agent.name}</h3>
                        <span className={`inline-flex items-center rounded-full ${agent.bgColor} px-3 py-0.5 text-xs font-medium ${agent.textColor}`}>
                          {agent.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                    </div>
                  </div>
                </div>

                {/* Agent details */}
                <div className="p-6">
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Capabilities */}
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-400" />
                        Core Capabilities & Execution Protocol
                      </h4>
                      <ul className="space-y-2">
                        {agent.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Network className="h-4 w-4 text-cyan-400" />
                          Channel Access
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{agent.channels}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-amber-400" />
                          Decision Philosophy
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{agent.decisionPhilosophy}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Code2 className="h-4 w-4 text-violet-400" />
                          Pipeline Role
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{agent.pipelineRole}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Decision-Making Framework */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 mb-4">
              <BarChart3 className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Decision Framework</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How the System Decides What to Do
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The agentic system does not execute a fixed script — it makes real-time decisions based on the content, context, and characteristics of each user query. The decision-making framework operates at three levels: strategic (Atlas determines the overall pipeline structure), tactical (each agent selects its execution strategy based on input parameters), and adaptive (the system re-plans when intermediate results deviate from expected targets). Below is how decisions are made for varying types of user queries.
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                queryType: 'Broad Industry + Location Query',
                example: '"Find accounting firms in Dubai"',
                atlasDecision: 'Standard 5-step pipeline: Scout → Forge → Judge → Bard → Echo. Discovery uses all 6 primary channels. Standard ICP generated from industry/location parameters.',
                scoutStrategy: 'Fire all 6 channels simultaneously with composite query "accounting firms Accounting Dubai". LinkedIn People search activated because industry is specified. Standard result count targets (15-30 leads expected).',
                judgeStrategy: 'Standard 5-factor scoring. Industry adjacency: accounting, audit, tax advisory, bookkeeping. Company size preferences derived from typical firmographics for the industry. Standard Hot/Warm/Cold thresholds.',
                bardStrategy: 'Hot leads receive 5-touch cold email sequence. Warm leads receive LinkedIn connection + follow-up. Tone: Balanced for partners/managing directors, Practical for senior associates.',
              },
              {
                queryType: 'Niche Technology Query',
                example: '"Find Series A fintech startups in Singapore"',
                atlasDecision: 'Extended pipeline with supplementary research. GitHub channel added for tech discovery. Adaptive re-planning anticipated due to niche criteria. Sage may be dispatched for market context.',
                scoutStrategy: '7 channels including GitHub. Query broadened: "fintech OR financial technology OR payments OR banking tech". Geographic expansion ready: "Singapore OR Southeast Asia". Lower result expectations (10-20 leads).',
                judgeStrategy: 'Strict firmographic gate for Series A stage. Intent signal detection prioritized (funding announcements, hiring posts). Tech stack matching included. Relaxed company size thresholds for startups (1-50 employees valid).',
                bardStrategy: 'Conversational tone for startup founders. Emphasis on partnership angles and integration opportunities. Shorter messages (startup founders have less patience for long emails). Speed-to-value in opening line.',
              },
              {
                queryType: 'Deep Research Query',
                example: '"Analyze our top 3 competitors in the CRM space"',
                atlasDecision: 'Research-heavy pipeline: Sage primary, Scout supplementary, Echo for deliverable. No standard pipeline — custom execution plan with parallel research tasks. Judge not applicable (no scoring needed).',
                scoutStrategy: 'Targeted search for each competitor: company websites, LinkedIn pages, press coverage. Twitter for real-time sentiment. Reddit for community opinions. Focused queries, not broad discovery.',
                sageStrategy: '6-stage deep research per competitor: Company deep-dive (products, pricing, customers), Market intelligence (positioning, differentiation), Competitive analysis (strengths, weaknesses, threats). Multi-source triangulation with 3+ sources per finding.',
                echoStrategy: 'Competitive analysis report format with side-by-side comparison tables. Executive summary with strategic recommendations. Visual charts for market positioning. PDF format for board presentation.',
              },
              {
                queryType: 'Outreach Optimization Query',
                example: '"Rewrite our cold emails to get better response rates"',
                atlasDecision: 'Bard-primary pipeline with Sage research support. Analyze existing emails for improvement opportunities. A/B testing strategy built into the output. No discovery or enrichment needed — working with existing leads.',
                scoutStrategy: 'Not activated — no new leads needed.',
                sageStrategy: 'Research best-performing cold email patterns in the target industry. Analyze competitor outreach strategies. Identify industry-specific pain points and value propositions for personalization hooks.',
                bardStrategy: 'Audit existing emails against quality scoring model. Generate 3 variant emails per lead tier (A/B/C testing). Optimize for spam filter avoidance. Include personalized opening lines based on lead enrichment data. Compliance check against CAN-SPAM and GDPR.',
              },
              {
                queryType: 'Pipeline Health Query',
                example: '"Which leads are going cold and need follow-up?"',
                atlasDecision: 'Flow-primary pipeline. No discovery, enrichment, or outreach generation needed. Analytical task using existing pipeline data. Echo for reporting.',
                scoutStrategy: 'Not activated — analytical task.',
                flowStrategy: 'Scan all leads for engagement decay (5% daily score reduction after 72h inactivity). Identify leads in CONTACTED stage with no response in 7+ days. Flag leads at risk of going stale. Generate prioritized follow-up schedule with timezone-aware business-hour enforcement.',
                echoStrategy: 'Pipeline health dashboard with conversion funnel, velocity metrics, and at-risk lead alerts. Visual charts showing stage distribution and time-in-stage. CSV export of stale leads for immediate action.',
              },
            ].map((item) => (
              <div key={item.queryType} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
                  <div className="lg:w-64 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-foreground">{item.queryType}</h3>
                    <p className="text-sm text-emerald-400 mt-1 font-mono">&ldquo;{item.example}&rdquo;</p>
                  </div>
                  <div className="flex-1 space-y-3">
                    {[
                      { label: 'Atlas Decision', value: item.atlasDecision, color: 'violet' },
                      { label: 'Scout Strategy', value: item.scoutStrategy, color: 'emerald' },
                      { label: 'Judge / Sage Strategy', value: item.judgeStrategy || item.sageStrategy, color: 'amber' },
                      { label: 'Bard / Flow Strategy', value: item.bardStrategy || item.flowStrategy, color: 'pink' },
                    ].filter(s => s.value).map((s) => (
                      <div key={s.label} className="flex items-start gap-3">
                        <span className={`text-xs font-semibold text-${s.color}-400 whitespace-nowrap mt-0.5`}>{s.label}:</span>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent-Reach Channel System */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-4">
              <Network className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Channel System</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              The 17+ Channel Agent-Reach System
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              No single data source provides complete coverage. LinkedIn misses companies without company pages. Exa misses niche players buried in Reddit threads. Twitter is noisy but reveals real-time signals. The Agent-Reach channel system was built from first principles to solve this: a unified bridge layer that normalizes data from 17+ channels into a consistent interface, with automatic fallback pipelines and per-channel rate limiting. Each agent accesses only the channels it needs, and every channel interaction is recorded for auditability.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'Exa Search', type: 'Semantic Web Search', access: 'Scout, Forge, Sage, Judge, Bard', fallback: 'Jina Search API', rate: '30 req/min' },
              { name: 'Web (Jina Reader)', type: 'Full Page Content', access: 'Scout, Forge, Sage', fallback: 'None (zero-config)', rate: '60 req/min' },
              { name: 'LinkedIn People', type: 'Professional Profiles', access: 'Scout, Forge, Sage', fallback: 'Exa → Jina Search', rate: '10 req/min' },
              { name: 'LinkedIn Companies', type: 'Company Pages', access: 'Scout, Forge, Sage, Judge', fallback: 'Exa → Jina Search', rate: '10 req/min' },
              { name: 'Twitter/X Search', type: 'Real-time Social', access: 'Scout, Forge, Sage', fallback: 'bird CLI → Exa → Jina', rate: '15 req/min' },
              { name: 'Reddit', type: 'Community Intelligence', access: 'Scout, Sage', fallback: 'Web Reader via Jina', rate: '30 req/min' },
              { name: 'GitHub', type: 'Code & Tech Signals', access: 'Scout, Forge', fallback: 'gh CLI (zero-config)', rate: '60 req/min' },
              { name: 'YouTube', type: 'Video Content', access: 'Sage', fallback: 'Exa → Web Reader', rate: '15 req/min' },
              { name: 'RSS Feeds', type: 'Industry News', access: 'Sage', fallback: 'Web Reader', rate: '30 req/min' },
              { name: 'WeChat', type: 'Chinese Social', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '10 req/min' },
              { name: 'XiaoHongShu', type: 'Chinese Lifestyle', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '10 req/min' },
              { name: 'Douyin', type: 'Chinese Video', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '10 req/min' },
              { name: 'Bilibili', type: 'Chinese Video', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '15 req/min' },
              { name: 'Weibo', type: 'Chinese Social', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '15 req/min' },
              { name: 'V2EX', type: 'Chinese Tech Community', access: 'Extended toolkit', fallback: 'Web Reader', rate: '30 req/min' },
              { name: 'Xueqiu', type: 'Chinese Finance', access: 'Extended toolkit', fallback: 'Exa regional search', rate: '10 req/min' },
              { name: 'Crawl4AI', type: 'Deep Web Crawler', access: 'Extended toolkit', fallback: 'Playwright browser', rate: '10 req/min' },
            ].map((channel) => (
              <div key={channel.name} className="card-premium border-border/30 bg-card/50 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-foreground">{channel.name}</h4>
                  <span className="text-xs text-muted-foreground bg-secondary/30 px-2 py-0.5 rounded">{channel.rate}</span>
                </div>
                <p className="text-xs text-cyan-400 mb-1">{channel.type}</p>
                <p className="text-xs text-muted-foreground">Agents: {channel.access}</p>
                <p className="text-xs text-muted-foreground">Fallback: {channel.fallback}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Assurance & Resilience */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 mb-4">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">Resilience</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Quality Assurance & System Resilience
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A multi-agent system that cannot recover from failure is a single point of failure with extra steps. The LeadReach AI framework is designed with defense in depth: every agent has its own error handling, Atlas provides system-level recovery, and the Agent-Reach channel system includes circuit breakers that prevent cascading failures. Below are the key quality and resilience mechanisms that keep campaigns running even when individual components fail.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                title: 'Data Validation Pipeline',
                description: 'Before delivering results, Atlas validates that every lead meets minimum quality standards: company name is present and non-trivial (not "Click here" or "Home"), website URL is well-formed, industry classification is populated, and at least one contact channel exists. Leads that fail validation are flagged with low dataCompleteness scores and noted in the campaign output. The aggregate campaign result is also validated against the user\'s implicit expectations — if the user asked for "accounting firms in Dubai" and only 2 results were found, Atlas escalates with a recommendation to broaden the search.',
                checks: ['Company name > 2 chars', 'Website URL well-formed', 'Industry populated', 'At least 1 contact channel', 'No duplicate companies', 'Lead score computed'],
              },
              {
                title: 'Confidence Scoring System',
                description: 'Every data point in the system carries a confidence annotation based on source reliability and cross-verification. The composite confidence score is calculated from: has website (+15%), has industry (+10%), has city + country (+15%), has email (+20%), has phone (+15%), has LinkedIn (+10%), has key contact (+15%), multiple sources (+10% bonus). Confidence tiers: HIGH (70%+), MEDIUM (40-69%), LOW (below 40%). Users always know how much trust to place in each data point.',
                checks: ['6 confidence levels from Direct to Unverified', 'Source priority hierarchy (1-10 scale)', 'Cross-verification bonus scoring', 'LLM-generated data explicitly flagged'],
              },
              {
                title: 'Circuit Breaker Pattern',
                description: 'When a specific Agent-Reach channel fails consistently (3+ failures in 10 minutes), the circuit breaker activates: the channel is marked as "warn" in the AgentReachChannel table, future tasks are rerouted to alternative channels, diagnostic information is logged, and the channel is not retried for 15 minutes. This prevents cascading failures where a single broken channel consumes resources and delays the entire pipeline. Channel health is continuously monitored and reported in campaign outputs.',
                checks: ['3 failures in 10 min triggers circuit breaker', '15-minute cooldown before retry', 'Automatic rerouting to alternatives', 'Channel health reporting in campaign output'],
              },
              {
                title: 'LLM Knowledge Fallback',
                description: 'When all live search channels fail (total channel outage), Scout and other agents fall back to LLM parametric knowledge generation. The LLM is prompted to generate real, well-known companies matching the campaign criteria, with a strict instruction to only include companies it is confident actually exist. Every lead generated from LLM knowledge is annotated with sources: ["llm_knowledge"] so users know the data has not been verified by live search. This ensures the system always delivers something — even in the worst-case scenario.',
                checks: ['Activated when all live channels fail', 'Strict confidence requirements', 'Source attribution: "llm_knowledge"', 'Recommended for verification before outreach'],
              },
            ].map((item) => (
              <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                <div className="space-y-2">
                  {item.checks.map((check) => (
                    <div key={check} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      <span className="text-xs text-muted-foreground">{check}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Metrics */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-4">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Performance</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              System Performance Benchmarks
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every component in the agentic system has defined performance targets and alert thresholds. These metrics are not aspirational — they are continuously monitored in production, and deviations trigger automatic investigation or adaptive re-planning. The result is a system that is not only powerful but predictable, reliable, and continuously improving.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Time to First Lead', value: '< 5 min', detail: 'From brief submission to first lead created in database' },
              { label: 'Full Campaign Duration', value: '< 30 min', detail: 'From brief to final report with outreach messages' },
              { label: 'Campaign Completion Rate', value: '95%+', detail: 'Percentage of campaigns that complete all pipeline stages' },
              { label: 'Lead Accuracy', value: '90%+', detail: 'Verified contact info accuracy across all enriched leads' },
              { label: 'Channel Success Rate', value: '80%+', detail: 'Percentage of Agent-Reach channels returning results per campaign' },
              { label: 'Sub-Task Success Rate', value: '90%+', detail: 'Successful agent tasks / total dispatched tasks' },
              { label: 'Adaptive Recovery Rate', value: '70%+', detail: 'Campaigns rescued by adaptation / campaigns needing it' },
              { label: 'LLM Call Latency', value: '< 10s', detail: 'Average LLM inference time for extraction and analysis' },
            ].map((metric) => (
              <div key={metric.label} className="card-premium border-border/30 bg-card/50 p-5 rounded-xl text-center">
                <p className="text-2xl font-bold text-emerald-400">{metric.value}</p>
                <p className="text-sm font-semibold text-foreground mt-1">{metric.label}</p>
                <p className="text-xs text-muted-foreground mt-2">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card/50 to-emerald-500/10 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-emerald-500/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Experience the <span className="text-gradient">Agentic System</span> in Action
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The best way to understand a multi-agent system is to watch it work. Launch the platform, submit a campaign brief, and observe as Atlas coordinates eight specialized agents across 17+ channels to deliver qualified, outreach-ready prospects.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/app">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm px-8 py-6 text-base">
                    Launch Platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/agent">
                  <Button variant="outline" className="border-border/50 px-8 py-6 text-base">
                    View Agent Showcase
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
