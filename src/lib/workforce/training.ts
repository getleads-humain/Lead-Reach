/**
 * Workforce Real Training Pipeline
 * =================================
 * Trains every AI employee with REAL knowledge pulled live from the internet.
 *
 * Flow per training session:
 *   1. Pick the next un-learned curriculum topic for the agent.
 *   2. Create a real WorkforceTask (type: training) and run it.
 *   3. exaSearch the topic (live web) → pick top sources → webRead full pages.
 *   4. Distill the real page content into a structured knowledge document
 *      (summary, key takeaways, practical applications, cited sources).
 *   5. Save as a WorkforceDocument (sourceType: 'web_trained') — the agent's
 *      growing, cited knowledge base.
 *   6. Log WorkforceLog training records (training records for audit) and
 *      post a real chat message to KRONOS summarizing what was learned.
 *
 * Design constraints:
 *   - Zero LLM dependency for the core path (immune to 429 storms) — uses
 *     extractive distillation of REAL page content. Reliable and fast.
 *   - Every claim in a learned doc is traceable to a source URL.
 *   - Idempotent: a topic is never trained twice (dedup by curriculum id).
 */

import { db } from '@/lib/db';
import { exaSearch, webRead } from '@/lib/agent-reach-bridge';
import { logAgentActivity } from '@/lib/workforce/logger';

// ── Types ──────────────────────────────────────────────────────────────

export interface CurriculumTopic {
  id: string;
  title: string;
  queries: string[];
  focus: string; // what the agent should extract from sources
}

export interface Curriculum {
  [agentSlug: string]: CurriculumTopic[];
}

export interface TrainingStatus {
  slug: string;
  name: string;
  curriculumTotal: number;
  learned: number;
  lastTrainedAt: string | null;
  learnedTopics: string[];
}

// ── Curriculum: what each AI employee must master ──────────────────────

export const TRAINING_CURRICULUM: Curriculum = {
  'prometheus-ceo': [
    { id: 'autonomous-agents', title: 'Autonomous AI agent organizations', queries: ['autonomous AI agents enterprise organization 2026', 'multi-agent AI workforce governance patterns'], focus: 'How leading teams structure autonomous agent organizations, governance and oversight.' },
    { id: 'monte-carlo-forecast', title: 'Monte Carlo forecasting for revenue', queries: ['monte carlo simulation revenue forecasting SaaS', 'probabilistic revenue forecasting methods'], focus: 'Practical Monte Carlo methods for revenue forecasting with confidence intervals.' },
    { id: 'ai-roi-benchmarks', title: 'AI workforce ROI benchmarks', queries: ['AI agents ROI benchmarks enterprise 2026', 'measuring AI workforce productivity gains'], focus: 'Measured ROI ranges and KPI frameworks for AI-driven workforces.' },
    { id: 'ooda-strategy', title: 'OODA loops & strategic cadence', queries: ['OODA loop business strategy application', 'strategic decision cadence high velocity organizations'], focus: 'Applying OODA-style cycles to executive decision cadence.' },
    { id: 'capital-allocation', title: 'Capital allocation under uncertainty', queries: ['capital allocation framework startup uncertainty', 'scenario based budget planning'], focus: 'Frameworks for allocating budget across competing initiatives with uncertainty.' },
    { id: 'ai-governance', title: 'AI governance & risk oversight', queries: ['AI governance framework enterprise risk', 'AI decision audit trail requirements'], focus: 'Governance, auditability and human-override requirements for autonomous systems.' },
  ],
  'kronos-orchestrator': [
    { id: 'orchestration-patterns', title: 'Agent orchestration patterns', queries: ['LLM agent orchestration patterns production', 'multi-agent task routing architecture'], focus: 'Proven routing, dispatch and supervision patterns for agent fleets.' },
    { id: 'deadlock-detection', title: 'Deadlock detection & resolution', queries: ['deadlock detection distributed task systems', 'liveness guarantees distributed schedulers'], focus: 'Detecting and resolving deadlocks in distributed task execution.' },
    { id: 'circuit-breakers', title: 'Circuit breaker & bulkhead patterns', queries: ['circuit breaker pattern microservices best practices', 'bulkhead pattern rate limiting resilience'], focus: 'Resilience patterns that keep fleets alive during downstream failures.' },
    { id: 'backpressure', title: 'Backpressure & queue management', queries: ['backpressure handling message queues', 'queue depth monitoring autoscaling workers'], focus: 'Managing queue depth, backpressure and worker autoscaling.' },
    { id: 'health-checks', title: 'Health check & heartbeat design', queries: ['service health check endpoint design best practices', 'heartbeat monitoring distributed agents'], focus: 'Designing meaningful health checks and heartbeat staleness rules.' },
    { id: 'event-driven', title: 'Event-driven task buses', queries: ['event driven architecture task bus comparison', 'kafka vs redis streams task workloads'], focus: 'Choosing and operating event buses for inter-agent messaging.' },
  ],
  'market-strategist': [
    { id: 'icp-trends', title: 'ICP definition trends 2026', queries: ['ideal customer profile framework B2B 2026', 'ICP segmentation using intent data'], focus: 'Modern ICP construction using intent + firmographic signals.' },
    { id: 'abm-playbooks', title: 'ABM playbooks that work', queries: ['account based marketing playbook examples', 'ABM tiering strategy best practices'], focus: 'Tiered ABM motions with measured outcomes.' },
    { id: 'competitive-intel', title: 'Competitive intelligence methods', queries: ['competitive intelligence workflow SaaS tools', 'win loss analysis methodology'], focus: 'Systematic competitor tracking and win/loss analysis.' },
    { id: 'demand-gen-benchmarks', title: 'Demand generation benchmarks', queries: ['B2B demand generation benchmarks 2026', 'pipeline conversion benchmarks SaaS'], focus: 'Current conversion and pipeline benchmarks to calibrate targets.' },
    { id: 'positioning', title: 'Positioning & differentiation', queries: ['saas positioning framework differentiation', 'category design strategy B2B'], focus: 'Positioning frameworks that hold up against fast-follower competition.' },
    { id: 'pricing-strategy', title: 'SaaS pricing strategy', queries: ['saas pricing strategy value metrics 2026', 'usage based pricing design'], focus: 'Pricing metric and packaging decisions with evidence.' },
  ],
  'content-architect': [
    { id: 'seo-2026', title: 'SEO & AEO for 2026', queries: ['SEO strategy AI answer engines 2026', 'generative engine optimization GEO tactics'], focus: 'Winning visibility in AI answer engines alongside classic SEO.' },
    { id: 'content-frameworks', title: 'B2B content frameworks', queries: ['b2b content marketing framework pillars', 'content atomization workflow'], focus: 'Pillar/cluster and atomization workflows that compound.' },
    { id: 'ai-content-ops', title: 'AI-assisted content operations', queries: ['AI content operations workflow editorial standards', 'human in the loop content AI'], focus: 'Editorial standards and workflows for AI-assisted content.' },
    { id: 'case-studies', title: 'Case studies that convert', queries: ['b2b case study structure best practices', 'customer proof points sales enablement'], focus: 'Case study structures sales actually uses in deals.' },
    { id: 'thought-leadership', title: 'Executive thought leadership', queries: ['linkedin thought leadership strategy b2b executives', 'executive brand content cadence'], focus: 'Credible thought-leadership cadence for founders and agents.' },
    { id: 'repurposing', title: 'Content repurposing systems', queries: ['content repurposing system one to many', 'distribution checklist blog to social'], focus: 'Systematic repurposing to maximize reach per asset.' },
  ],
  'media-buyer': [
    { id: 'google-ads-b2b', title: 'Google Ads B2B benchmarks', queries: ['google ads b2b benchmarks CPL 2026', 'search intent bidding strategies b2b'], focus: 'CPL/CVR benchmarks and bidding tactics for B2B search.' },
    { id: 'linkedin-abm', title: 'LinkedIn Ads for ABM', queries: ['linkedin ads ABM performance benchmarks', 'linkedin audiences ABM tiering'], focus: 'LinkedIn ABM setup, audiences and measured performance.' },
    { id: 'budget-optimization', title: 'Paid budget optimization', queries: ['paid media budget allocation framework', 'marginal ROAS budget shifting'], focus: 'Allocating budget by marginal returns across channels.' },
    { id: 'retargeting', title: 'Retargeting that converts', queries: ['b2b retargeting strategy best practices', 'intent based retargeting sequences'], focus: 'Retargeting sequences aligned to buying stages.' },
    { id: 'creative-testing', title: 'Ad creative testing systems', queries: ['ad creative testing framework statistical significance', 'creative iteration velocity paid social'], focus: 'Disciplined creative testing with significance thresholds.' },
    { id: 'cac-control', title: 'CAC control levers', queries: ['reduce customer acquisition cost saas tactics', 'CAC payback period optimization'], focus: 'Concrete levers to bend CAC down without killing volume.' },
  ],
  'sales-engine': [
    { id: 'outbound-benchmarks', title: 'Cold outbound benchmarks 2026', queries: ['cold email benchmarks reply rate 2026', 'outbound sales benchmarks b2b sdr'], focus: 'Current open/reply/meeting rates to calibrate sequences.' },
    { id: 'multithreading', title: 'Multithreading enterprise deals', queries: ['multi threading enterprise sales deals', 'buying committee engagement strategy'], focus: 'Engaging multiple stakeholders to de-risk deals.' },
    { id: 'cadence-design', title: 'Sales cadence design', queries: ['sales cadence best practices touchpoints', 'outbound sequence structure channels'], focus: 'Channel mix and cadence length backed by data.' },
    { id: 'discovery', title: 'Discovery call frameworks', queries: ['discovery call framework b2b questions', 'meddic discovery questions'], focus: 'Discovery structures that surface real pain and budget.' },
    { id: 'objection-handling', title: 'Objection handling patterns', queries: ['sales objection handling framework examples', 'common b2b objections responses'], focus: 'Pattern responses to the most common objections.' },
    { id: 'pipeline-hygiene', title: 'Pipeline hygiene & stage exit criteria', queries: ['pipeline hygiene best practices stage exit criteria', 'sales pipeline review cadence'], focus: 'Stage definitions and hygiene rules that keep forecasts honest.' },
  ],
  'core-architect': [
    { id: 'multi-tenant', title: 'Multi-tenant SaaS architecture', queries: ['multi tenant saas architecture patterns 2026', 'tenant isolation strategies database'], focus: 'Isolation models and their operational tradeoffs.' },
    { id: 'event-microservices', title: 'Event-driven microservices', queries: ['event driven microservices design patterns', 'saga pattern distributed transactions'], focus: 'Saga/outbox patterns for reliable distributed workflows.' },
    { id: 'api-design', title: 'API design best practices', queries: ['rest api design best practices versioning', 'api pagination filtering conventions'], focus: 'Conventions that keep APIs consistent and evolvable.' },
    { id: 'data-modeling', title: 'Data modeling at scale', queries: ['database schema design patterns saas', 'indexing strategies query performance'], focus: 'Schema and indexing decisions that avoid late-stage rewrites.' },
    { id: 'caching', title: 'Caching strategies', queries: ['application caching strategy patterns', 'cache invalidation best practices'], focus: 'Layered caching with sane invalidation.' },
    { id: 'scalability', title: 'Scaling patterns & bottlenecks', queries: ['web application scalability bottlenecks checklist', 'horizontal scaling stateless services'], focus: 'Finding and removing the usual scaling bottlenecks.' },
  ],
  'feature-developer': [
    { id: 'nextjs-16', title: 'Next.js 16 App Router patterns', queries: ['next.js 16 app router best practices', 'next.js server actions patterns 2026'], focus: 'Current App Router conventions, proxy.ts, caching rules.' },
    { id: 'typescript-advanced', title: 'Advanced TypeScript patterns', queries: ['advanced typescript patterns type safety', 'typescript discriminated unions practical'], focus: 'Type-level tools that eliminate runtime bugs.' },
    { id: 'react19', title: 'React 19 server components', queries: ['react 19 server components patterns', 'react 19 use action state forms'], focus: 'RSC boundaries, actions and form state in practice.' },
    { id: 'tdd', title: 'Test-driven development for UI', queries: ['test driven development react applications', 'testing pyramid frontend practical'], focus: 'A pragmatic TDD loop for feature work.' },
    { id: 'api-security', title: 'API security essentials', queries: ['api security checklist owasp 2026', 'authentication authorization patterns saas'], focus: 'AuthN/AuthZ and input validation essentials.' },
    { id: 'web-performance', title: 'Web performance optimization', queries: ['core web vitals optimization 2026', 'react performance profiling techniques'], focus: 'Measuring and fixing the metrics users feel.' },
  ],
  'qa-tester': [
    { id: 'e2e-strategy', title: 'E2E testing strategy', queries: ['end to end testing strategy web apps 2026', 'playwright best practices e2e'], focus: 'What to cover in E2E vs integration vs unit.' },
    { id: 'flaky-tests', title: 'Flaky test management', queries: ['flaky test detection quarantine process', 'test stability best practices ci'], focus: 'Detecting, quarantining and fixing flaky tests.' },
    { id: 'regression-automation', title: 'Regression automation', queries: ['regression testing automation strategy', 'smoke test suite design release gate'], focus: 'Fast smoke + deep regression layering.' },
    { id: 'performance-testing', title: 'Performance testing', queries: ['load testing web application k6 guide', 'performance regression testing ci'], focus: 'Load profiles, thresholds and CI integration.' },
    { id: 'chaos-engineering', title: 'Chaos engineering basics', queries: ['chaos engineering principles beginners', 'fault injection testing production'], focus: 'Safe fault-injection experiments that harden systems.' },
    { id: 'visual-regression', title: 'Visual regression testing', queries: ['visual regression testing workflow', 'screenshot diffing ci pipeline'], focus: 'Visual diffs that catch real regressions, not noise.' },
  ],
  'devops-automator': [
    { id: 'zero-downtime', title: 'Zero-downtime deployments', queries: ['zero downtime deployment strategies', 'blue green vs canary deployment'], focus: 'Deploy strategies with real rollback story.' },
    { id: 'container-security', title: 'Container security scanning', queries: ['container image scanning best practices', 'base image vulnerability management'], focus: 'Scanning cadence and base-image hygiene.' },
    { id: 'ci-optimization', title: 'CI pipeline optimization', queries: ['ci pipeline speed optimization techniques', 'caching strategies github actions'], focus: 'Cutting CI minutes with caching and parallelization.' },
    { id: 'observability', title: 'Observability with OpenTelemetry', queries: ['opentelemetry setup best practices', 'golden signals monitoring services'], focus: 'Traces/metrics/logs that actually debug issues.' },
    { id: 'incident-management', title: 'Incident management', queries: ['incident management process best practices', 'postmortem culture blameless template'], focus: 'Severity levels, comms and blameless postmortems.' },
    { id: 'infra-as-code', title: 'Infrastructure as code', queries: ['infrastructure as code best practices 2026', 'drift detection iac'], focus: 'IaC workflows with drift detection.' },
  ],
  'cyber-guardian': [
    { id: 'owasp-2026', title: 'OWASP Top 10 current', queries: ['owasp top 10 2026 changes', 'web application vulnerabilities latest'], focus: 'Current top risks and concrete mitigations.' },
    { id: 'secrets-management', title: 'Secrets management', queries: ['secrets management best practices rotation', 'env secrets vs vault production'], focus: 'Storage, rotation and leakage response.' },
    { id: 'soc2-readiness', title: 'SOC 2 readiness', queries: ['soc 2 type ii readiness checklist', 'soc2 controls engineering evidence'], focus: 'The control set and evidence engineers must produce.' },
    { id: 'sast-dast', title: 'SAST/DAST tooling', queries: ['sast dast comparison tools 2026', 'static analysis security ci integration'], focus: 'Tool choices and CI integration with low noise.' },
    { id: 'zero-trust', title: 'Zero trust architecture', queries: ['zero trust architecture principles implementation', 'identity based perimeters saas'], focus: 'Practical zero-trust steps for SaaS teams.' },
    { id: 'privacy-engineering', title: 'Privacy engineering (GDPR)', queries: ['privacy by design engineering practices', 'gdpr data minimization implementation'], focus: 'Data minimization, retention and consent enforcement in code.' },
  ],
  'cfo-ledger': [
    { id: 'saas-metrics', title: 'SaaS metrics that matter', queries: ['saas metrics mrr arr ltv cac definitions', 'saas kpi benchmark report 2026'], focus: 'Precise definitions and current benchmark ranges.' },
    { id: 'unit-economics', title: 'Unit economics analysis', queries: ['unit economics saas contribution margin', 'ltv cac ratio benchmarks b2b'], focus: 'Building honest unit-economics models.' },
    { id: 'cash-forecast', title: 'Cash flow forecasting', queries: ['cash flow forecasting startups method', 'runway management burn multiple'], focus: 'Forecast methods and burn-multiple discipline.' },
    { id: 'pricing-experiments', title: 'Pricing experiments', queries: ['saas pricing experiments methodology', 'price testing without breaking customers'], focus: 'Running pricing tests with clean measurement.' },
    { id: 'budgeting', title: 'Zero-based budgeting for SaaS', queries: ['zero based budgeting saas', 'spend review cadence finance ops'], focus: 'Budget structures that survive scale-ups.' },
    { id: 'rev-rec', title: 'Revenue recognition basics', queries: ['saas revenue recognition asc 606 basics', 'deferred revenue accounting saas'], focus: 'Rev-rec essentials for subscription billing.' },
  ],
  'compliance-legal': [
    { id: 'gdpr-ccpa', title: 'GDPR & CCPA automation', queries: ['gdpr ccpa compliance automation tools', 'data subject request handling workflow'], focus: 'Automating DSRs, consent and retention.' },
    { id: 'email-law', title: 'CAN-SPAM / CASL / PECR', queries: ['can spam act compliance cold email', 'casl pecr b2b email rules'], focus: 'Jurisdiction-specific rules for outbound email.' },
    { id: 'dpa', title: 'Data processing agreements', queries: ['data processing agreement key clauses', 'subprocessor management requirements'], focus: 'DPA clauses and subprocessor governance.' },
    { id: 'ai-act', title: 'EU AI Act obligations', queries: ['eu ai act obligations timeline 2026', 'ai act high risk classification'], focus: 'What the AI Act requires and when.' },
    { id: 'soc2-gdpr-map', title: 'SOC 2 ↔ GDPR mapping', queries: ['soc 2 gdpr mapping controls overlap', 'compliance framework crosswalk'], focus: 'One control set satisfying multiple frameworks.' },
    { id: 'privacy-design', title: 'Privacy by design', queries: ['privacy by design implementation checklist', 'data retention policy engineering'], focus: 'Turning privacy principles into engineering defaults.' },
  ],
  'synthetic-hr': [
    { id: 'agent-evals', title: 'Evaluating AI agent performance', queries: ['evaluating ai agent performance framework', 'agent kpis task success metrics'], focus: 'KPIs and eval harnesses for agent workforces.' },
    { id: 'capacity-planning', title: 'Workforce capacity planning', queries: ['capacity planning model support sales teams', 'workload balancing automation'], focus: 'Capacity models that keep queues healthy.' },
    { id: 'onboarding-automation', title: 'Onboarding automation', queries: ['employee onboarding automation workflow', 'agent bootstrapping knowledge base'], focus: 'Ramp plans for new human and AI employees.' },
    { id: 'skills-taxonomy', title: 'Skills taxonomy design', queries: ['skills taxonomy design organization', 'competency matrix framework'], focus: 'Skill matrices used for assignment and growth.' },
    { id: 'training-curation', title: 'Training curriculum curation', queries: ['building training curricula knowledge workers', 'continuous learning programs engineering teams'], focus: 'Curriculum design that compounds over time.' },
    { id: 'human-ai-teams', title: 'Human + AI team dynamics', queries: ['human ai team collaboration research', 'hybrid workforce management practices'], focus: 'What makes mixed human/AI teams effective.' },
  ],
};

export const CURRICULUM_TOTAL = Object.values(TRAINING_CURRICULUM)
  .reduce((sum, topics) => sum + topics.length, 0);

// ── Helpers ────────────────────────────────────────────────────────────

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 40);
  }
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'on', 'for', 'with', 'as', 'by', 'at', 'that', 'this', 'these',
  'those', 'it', 'its', 'from', 'you', 'your', 'we', 'our', 'their', 'they',
  'can', 'will', 'not', 'have', 'has', 'had', 'what', 'which', 'who', 'how',
  'more', 'most', 'also', 'than', 'then', 'when', 'where', 'why', 'all', 'any',
  'into', 'about', 'over', 'after', 'before', 'between', 'through', 'such',
  'each', 'other', 'some', 'only', 'may', 'should', 'would', 'could', 'do',
  'does', 'did', 'done', 'using', 'use', 'used', 'one', 'two', 'new',
]);

/** Split content into clean sentences. */
function toSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[#*_>`\[\]()]/g, '')
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(s => s.trim())
    .filter(s => s.length >= 40 && s.length <= 320 && /[a-z]/.test(s));
}

/** Keyword overlap score between a sentence and the topic focus. */
function relevanceScore(sentence: string, topicWords: string[]): number {
  const words = new Set(sentence.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
  let score = 0;
  for (const tw of topicWords) {
    if (words.has(tw)) score += 2;
    else {
      for (const w of words) {
        if (w.startsWith(tw.slice(0, 5)) && tw.length > 4) { score += 1; break; }
      }
    }
  }
  return score;
}

interface DistilledDoc {
  title: string;
  summary: string;
  takeaways: string[];
  applications: string[];
  sources: Array<{ title: string; url: string; domain: string }>;
  wordCount: number;
}

/**
 * Extractive distillation of REAL web content into a structured knowledge doc.
 * No LLM required — reliable under rate limiting, fully traceable to sources.
 */
function distill(
  agentName: string,
  agentRole: string,
  topic: CurriculumTopic,
  readings: Array<{ title: string; url: string; content: string }>,
): DistilledDoc {
  const topicWords = [...new Set([...topic.title.toLowerCase().split(/\W+/), ...topic.focus.toLowerCase().split(/\W+/)])]
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));

  const scored: Array<{ sentence: string; score: number; sourceIdx: number }> = [];
  readings.forEach((r, sourceIdx) => {
    for (const s of toSentences(r.content)) {
      const score = relevanceScore(s, topicWords);
      if (score >= 3) scored.push({ sentence: s, score, sourceIdx });
    }
  });
  scored.sort((a, b) => b.score - a.score);

  // Deduplicate similar sentences, take top 10
  const chosen: string[] = [];
  const chosenWords: Set<string>[] = [];
  for (const { sentence } of scored) {
    const words = new Set(sentence.toLowerCase().split(/[^a-z0-9]+/));
    const dup = chosenWords.some(cw => {
      let overlap = 0;
      for (const w of words) if (cw.has(w)) overlap++;
      return overlap / Math.max(1, words.size) > 0.55;
    });
    if (!dup) {
      chosen.push(sentence);
      chosenWords.push(words);
    }
    if (chosen.length >= 10) break;
  }

  const sources = readings.map(r => ({ title: r.title, url: r.url, domain: domainOf(r.url) }));
  const takeaways = chosen.slice(0, 8);
  const applications = [
    `${agentName} (${agentRole}) applies this to: ${topic.focus}`,
    `Integrate these findings into the next ${topic.title.toLowerCase()} work item; cite sources when advising the team.`,
    takeaways.length > 0
      ? `Validate current playbooks against takeaway #1 — update the runbook if practice differs.`
      : `Collect additional sources on the next training pass.`,
  ];
  const summary =
    `Live-web training on "${topic.title}". ${agentName} read ${readings.length} real source${readings.length === 1 ? '' : 's'} ` +
    `(${sources.map(s => s.domain).join(', ')}) and extracted ${takeaways.length} evidence-backed takeaways for: ${topic.focus}`;

  return {
    title: `Training: ${topic.title}`,
    summary,
    takeaways,
    applications,
    sources,
    wordCount: takeaways.join(' ').split(/\s+/).length,
  };
}

// ── Core: train one agent on its next topic ────────────────────────────

export async function trainAgentOnce(slug: string): Promise<{
  ok: boolean;
  topic?: string;
  docTitle?: string;
  sources?: string[];
  error?: string;
}> {
  const agent = await db.workforceAgent.findFirst({ where: { slug } });
  if (!agent) return { ok: false, error: `Agent not found: ${slug}` };

  const curriculum = TRAINING_CURRICULUM[slug] ?? [];
  if (curriculum.length === 0) return { ok: false, error: `No curriculum for ${slug}` };

  // Which topics are already learned? (docs tagged with curriculum:<id>)
  const existingDocs = await db.workforceDocument.findMany({
    where: { agentId: agent.id, sourceType: 'web_trained' },
    select: { tags: true },
  });
  const learnedIds = new Set<string>();
  for (const d of existingDocs) {
    try {
      const tags = d.tags ? (JSON.parse(d.tags) as string[]) : [];
      for (const t of tags) if (t.startsWith('curriculum:')) learnedIds.add(t.slice(11));
    } catch { /* ignore malformed tags */ }
  }

  const topic = curriculum.find(t => !learnedIds.has(t.id));
  if (!topic) return { ok: false, error: `${agent.name} has completed the full curriculum (${curriculum.length}/${curriculum.length})` };

  // Create the real task
  const task = await db.workforceTask.create({
    data: {
      agentId: agent.id,
      title: `Training: ${topic.title}`,
      description: `Live-web training session — research "${topic.title}" from real internet sources and distill into the knowledge base.`,
      taskType: 'training',
      priority: 'normal',
      status: 'running',
      startedAt: new Date(),
      tags: JSON.stringify([`curriculum:${topic.id}`, 'training']),
    },
  });
  await db.workforceAgent.update({
    where: { id: agent.id },
    data: { tasksInProgress: { increment: 1 }, status: 'busy', lastActiveAt: new Date() },
  });

  const startedAt = Date.now();
  try {
    await logAgentActivity(agent.id, {
      category: 'task',
      action: 'training_started',
      description: `Starting live-web training: "${topic.title}" (curriculum ${learnedIds.size + 1}/${curriculum.length})`,
      details: JSON.stringify({ taskId: task.id, topicId: topic.id }),
    });

    // 1. Real web search — try every curriculum query across 3 rounds with
    //    growing backoff (DuckDuckGo rate-limits bursts; waits ride it out).
    let search: Awaited<ReturnType<typeof exaSearch>> | null = null;
    const backoffs = [0, 8000, 15000];
    for (let round = 0; round < backoffs.length && !search; round++) {
      if (backoffs[round] > 0) await new Promise(r => setTimeout(r, backoffs[round]));
      for (const q of topic.queries) {
        const attempt = await exaSearch(q, 8);
        if (attempt.success && attempt.data && attempt.data.length > 0) {
          search = attempt;
          break;
        }
      }
    }
    if (!search || !search.data || search.data.length === 0) {
      throw new Error(`No search results for any query on "${topic.title}"`);
    }

    // 2. Read the top 2 real pages
    const candidates = search.data.slice(0, 2);
    const readings: Array<{ title: string; url: string; content: string }> = [];
    for (const c of candidates) {
      const read = await webRead(c.url, 'text');
      if (read.success && read.data && read.data.content.length > 400) {
        readings.push({ title: c.title || read.data.title, url: c.url, content: read.data.content.slice(0, 12000) });
      }
    }
    if (readings.length === 0) {
      // Fall back to search snippets as the learning material (still real)
      for (const c of search.data.slice(0, 4)) {
        if (c.snippet && c.snippet.length > 80) {
          readings.push({ title: c.title || domainOf(c.url), url: c.url, content: c.snippet });
        }
      }
    }
    if (readings.length === 0) throw new Error('Could not read any real source content');

    // 3. Distill into a structured, cited knowledge document
    const doc = distill(agent.name, agent.role, topic, readings);

    // 4. Store as a permanent, versioned knowledge document
    const knowledge = [
      `# ${doc.title}`,
      ``,
      `**Agent:** ${agent.name} (${agent.role})  `,
      `**Curriculum unit:** \`${topic.id}\`  `,
      `**Learned:** ${new Date().toISOString()}  `,
      `**Method:** live web research → extractive distillation (fully source-cited)`,
      ``,
      `## Summary`,
      doc.summary,
      ``,
      `## Key takeaways (from real sources)`,
      ...doc.takeaways.map((t, i) => `${i + 1}. ${t} [source ${Math.min(i + 1, doc.sources.length) || 1}]`),
      ``,
      `## Practical applications`,
      ...doc.applications.map(a => `- ${a}`),
      ``,
      `## Sources (read live)`,
      ...doc.sources.map((s, i) => `${i + 1}. [${s.title || s.domain}](${s.url}) — ${s.domain}`),
      ``,
      `## Raw source excerpts`,
      ...readings.map(r => `### ${r.title || domainOf(r.url)}\n> ${r.content.slice(0, 600).replace(/\n+/g, ' ')}…`),
    ].join('\n');

    await db.workforceDocument.create({
      data: {
        agentId: agent.id,
        title: doc.title,
        category: 'training',
        content: knowledge,
        tags: JSON.stringify([`curriculum:${topic.id}`, 'web_trained', ...doc.sources.map(s => s.domain)]),
        sourceType: 'web_trained',
        embeddingStatus: 'pending',
      },
    });

    // 5. Complete the task + metrics + training record
    const durationMs = Date.now() - startedAt;
    await db.workforceTask.update({
      where: { id: task.id },
      data: {
        status: 'completed',
        output: JSON.stringify({ topic: topic.title, sources: doc.sources.map(s => s.url), takeaways: doc.takeaways.length }),
        progress: 100,
        completedAt: new Date(),
        durationMs,
      },
    });
    await db.workforceAgent.update({
      where: { id: agent.id },
      data: {
        tasksCompleted: { increment: 1 },
        tasksInProgress: { decrement: 1 },
        status: 'active',
        lastActiveAt: new Date(),
      },
    });

    await logAgentActivity(agent.id, {
      category: 'task',
      action: 'training_completed',
      description: `Trained on "${topic.title}" — extracted ${doc.takeaways.length} takeaways from ${doc.sources.length} live web sources (${doc.sources.map(s => s.domain).join(', ')})`,
      details: JSON.stringify({ taskId: task.id, topicId: topic.id, sources: doc.sources.map(s => s.url), takeaways: doc.takeaways.length, durationMs }),
      duration: durationMs,
    });

    // 6. Real chat message to KRONOS with what was learned
    await db.workforceChatMessage.create({
      data: {
        agentId: agent.id,
        role: 'agent_comm',
        content: `Training complete: "${topic.title}". Learned ${doc.takeaways.length} new evidence-backed takeaways from ${doc.sources.length} live sources. Top insight: ${doc.takeaways[0]?.slice(0, 160) ?? 'n/a'}… Doc saved to my knowledge base.`,
        fromAgent: slug,
        toAgent: 'kronos-orchestrator',
        messageType: 'task_update',
        metadata: JSON.stringify({ taskId: task.id, topicId: topic.id, kind: 'training_report' }),
      },
    });

    return { ok: true, topic: topic.title, docTitle: doc.title, sources: doc.sources.map(s => s.url) };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await db.workforceTask.update({
      where: { id: task.id },
      data: { status: 'failed', error: msg.slice(0, 500), completedAt: new Date() },
    });
    await db.workforceAgent.update({
      where: { id: agent.id },
      data: { tasksFailed: { increment: 1 }, tasksInProgress: { decrement: 1 }, status: 'active' },
    });
    await logAgentActivity(agent.id, {
      category: 'task',
      action: 'training_failed',
      level: 'warn',
      description: `Training failed on "${topic.title}": ${msg.slice(0, 200)}`,
      details: JSON.stringify({ taskId: task.id, topicId: topic.id }),
    });
    return { ok: false, topic: topic.title, error: msg };
  }
}

/** Train every agent on one topic each (round-robin). */
export async function trainAllOnce(): Promise<Array<{ slug: string; ok: boolean; topic?: string; error?: string }>> {
  const agents = await db.workforceAgent.findMany({ where: { isManaged: true }, select: { slug: true } });
  const results: Array<{ slug: string; ok: boolean; topic?: string; error?: string }> = [];
  for (const a of agents) {
    const r = await trainAgentOnce(a.slug);
    results.push({ slug: a.slug, ok: r.ok, topic: r.topic, error: r.error });
  }
  return results;
}

/** Training status across the fleet. */
export async function getTrainingStatus(): Promise<TrainingStatus[]> {
  const agents = await db.workforceAgent.findMany({
    where: { isManaged: true },
    select: { id: true, slug: true, name: true },
  });

  const statuses: TrainingStatus[] = [];
  for (const agent of agents) {
    const docs = await db.workforceDocument.findMany({
      where: { agentId: agent.id, sourceType: 'web_trained' },
      select: { title: true, updatedAt: true, tags: true },
      orderBy: { updatedAt: 'desc' },
    });
    const curriculum = TRAINING_CURRICULUM[agent.slug] ?? [];
    const learnedTopics: string[] = [];
    for (const d of docs) {
      try {
        const tags = d.tags ? (JSON.parse(d.tags) as string[]) : [];
        const cid = tags.find(t => t.startsWith('curriculum:'));
        if (cid) {
          const topic = curriculum.find(t => t.id === cid.slice(11));
          learnedTopics.push(topic ? topic.title : d.title.replace(/^Training: /, ''));
        } else {
          learnedTopics.push(d.title.replace(/^Training: /, ''));
        }
      } catch {
        learnedTopics.push(d.title.replace(/^Training: /, ''));
      }
    }
    statuses.push({
      slug: agent.slug,
      name: agent.name,
      curriculumTotal: curriculum.length,
      learned: learnedTopics.length,
      lastTrainedAt: docs[0]?.updatedAt?.toISOString() ?? null,
      learnedTopics,
    });
  }
  return statuses;
}
