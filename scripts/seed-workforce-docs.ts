/**
 * Seed Knowledge Base SOPs for all 7 Workforce Agents
 * Run with: npx tsx scripts/seed-workforce-docs.ts
 *
 * Each agent gets comprehensive SOPs covering:
 * - Role Overview & Responsibilities
 * - Standard Operating Procedures
 * - Decision Frameworks
 * - Quality Gates & Checklists
 * - Escalation Procedures
 * - Tools & RAG Usage Guide
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DOCUMENTS: Array<{ agentSlug: string; title: string; category: string; content: string; tags: string[] }> = [

// ━━━ FULL-STACK ENGINEER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'fullstack-engineer',
  title: 'SOP: Feature Development Lifecycle',
  category: 'sop',
  tags: ['sop', 'feature-development', 'lifecycle', 'engineering'],
  content: `# SOP: Feature Development Lifecycle

## Overview
This Standard Operating Procedure defines the complete lifecycle for developing features on the LeadReach AI platform. Every feature must follow this process from ideation through deployment and monitoring.

## Roles & Responsibilities
- **Feature Owner**: Senior Full-Stack Engineer (this agent)
- **Code Reviewer**: Peer engineer or ML Engineer for AI features
- **QA**: Automated tests (this agent writes them)
- **Deploy**: CI/CD pipeline (automated via DevOps)

## Phase 1: Requirements Analysis (15-30 min)
1. Parse the feature request from the task description
2. Identify affected components: frontend, API routes, database schema
3. Check for breaking changes in existing interfaces
4. Estimate complexity: S (1-2h), M (2-4h), L (4-8h), XL (8-16h)
5. Document the approach in the task comments

## Phase 2: Database Schema (if needed)
1. Add models/migrations to prisma/schema.prisma
2. Run \`npx prisma db push\` for dev, \`npx prisma migrate dev\` for formal migration
3. Verify schema compiles and relations are correct
4. Add indexes for query performance

## Phase 3: API Layer Development
1. Create API route under src/app/api/ following REST conventions
2. Implement input validation with Zod schemas
3. Add proper error handling with try/catch and NextResponse.json
4. Include pagination for list endpoints (page/limit params)
5. Add request logging for monitoring

## Phase 4: Frontend Development
1. Create component under src/components/ with 'use client' directive
2. Use shadcn/ui primitives + Tailwind CSS v4 classes
3. Implement loading states, error states, and empty states
4. Ensure dark mode compatibility (test both themes)
5. Verify responsive design across breakpoints (sm, md, lg, xl)
6. Add proper TypeScript types (no \`any\`)

## Phase 5: Integration
1. Add ViewType to src/lib/types.ts if new view
2. Add to sidebar navigation in src/components/layout/sidebar.tsx
3. Add to plan access in src/hooks/use-plan-access.ts
4. Add to plan definitions in src/lib/plans.ts
5. Render in src/app/app/page.tsx view switch

## Phase 6: Testing
1. Write unit tests with Jest for utility functions
2. Write component tests for UI behavior
3. Write API route tests for endpoint validation
4. Test error states and edge cases
5. Verify no console errors in browser

## Phase 7: Deployment
1. Run \`npx next build\` to verify clean compilation
2. Push to main branch (triggers Vercel auto-deploy)
3. Monitor deployment for errors
4. Verify feature works in preview environment
5. Update task status to completed

## Quality Gates
- [ ] Build passes with zero errors
- [ ] No TypeScript \`any\` types
- [ ] Dark mode works correctly
- [ ] Mobile responsive at all breakpoints
- [ ] Loading, error, and empty states handled
- [ ] API inputs validated with Zod
- [ ] Tests pass (if applicable)

## Escalation
- Build failure: Check error log, fix, re-build
- Schema conflict: Coordinate with DevOps for migration
- Performance issue: Run Lighthouse audit, optimize
- Security concern: Flag to DevOps for review`
},

{
  agentSlug: 'fullstack-engineer',
  title: 'SOP: Bug Fix & Incident Response',
  category: 'sop',
  tags: ['sop', 'bug-fix', 'incident', 'engineering'],
  content: `# SOP: Bug Fix & Incident Response

## Severity Classification
- **P1 (Critical)**: Platform down, data loss, security breach — fix in < 1 hour
- **P2 (High)**: Feature broken for all users — fix in < 4 hours
- **P3 (Medium)**: Feature broken for subset of users — fix in < 24 hours
- **P4 (Low)**: Cosmetic issue, minor UX problem — fix in next sprint

## Bug Fix Process
1. **Reproduce**: Confirm the bug exists with exact steps
2. **Isolate**: Identify the root cause (frontend, API, database, auth)
3. **Fix**: Implement the minimal fix that resolves the issue
4. **Test**: Verify fix works and doesn't break other features
5. **Deploy**: Push fix through CI/CD
6. **Verify**: Confirm fix works in production
7. **Document**: Add regression test and post-mortem note

## Common Bug Patterns & Fixes
- **Hydration mismatch**: Check for client/server rendering differences, use \`suppressHydrationWarning\` or dynamic import
- **Auth loop**: Check proxy.ts and useAuth() — ensure stableAuthChecked guard is in place
- **Dark mode invisible text**: Verify OKLCH color tokens, add explicit dark: variants
- **API 500 error**: Check Prisma query, verify model exists, check for null references
- **Build failure**: Check for missing imports, type errors, circular dependencies

## Incident Response
1. Detect: Monitor error rates, user reports, health checks
2. Triage: Classify severity, identify affected users
3. Mitigate: Apply hotfix or rollback to last stable version
4. Resolve: Implement proper fix with tests
5. Post-mortem: Document root cause, timeline, and prevention measures`
},

{
  agentSlug: 'fullstack-engineer',
  title: 'Runbook: Codebase Architecture',
  category: 'runbook',
  tags: ['runbook', 'architecture', 'codebase', 'reference'],
  content: `# Runbook: LeadReach Codebase Architecture

## Directory Structure
\`\`\`
src/
├── app/           # Next.js App Router pages & API routes
│   ├── page.tsx   # Landing page (/)
│   ├── app/       # Main platform (/app)
│   ├── api/       # API routes (/api/*)
│   └── ...        # Other pages
├── components/    # React components
│   ├── ui/        # shadcn/ui primitives
│   ├── layout/    # AppShell, Sidebar, TopBar
│   └── ...        # Feature views
├── lib/           # Business logic & utilities
│   ├── agents/    # Agent capability modules
│   ├── workforce/ # AI workforce system
│   ├── connectors/# Custom connectors engine
│   ├── db.ts      # Prisma client singleton
│   ├── store.ts   # Zustand global store
│   └── ...
├── hooks/         # React hooks
└── prisma/        # Database schema
\`\`\`

## Key Technologies
- **Framework**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4 (OKLCH colors, @theme inline)
- **State**: Zustand with persist middleware
- **Auth**: Supabase Auth + proxy.ts (not middleware.ts)
- **DB**: Prisma + SQLite (dev) / PostgreSQL (prod)
- **AI**: z-ai-web-dev-sdk (GLM models)
- **Deploy**: Vercel with standalone output

## Critical Files
- \`src/proxy.ts\`: Auth middleware (replaces middleware.ts in Next.js 16)
- \`src/lib/supabase-middleware.ts\`: Route protection logic
- \`src/lib/store.ts\`: Global app state
- \`src/hooks/use-plan-access.ts\`: Plan-based feature gating
- \`prisma/schema.prisma\`: Database schema (30+ models)`
},

// ━━━ ML ENGINEER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'ml-engineer-orchestration',
  title: 'SOP: Agent Orchestration Pipeline',
  category: 'sop',
  tags: ['sop', 'orchestration', 'pipeline', 'ai'],
  content: `# SOP: Agent Orchestration Pipeline

## Overview
The 8-agent pipeline (Atlas→Scout→Forge→Sage→Judge→Bard→Flow→Echo) is the core of LeadReach AI. This SOP defines how to optimize, monitor, and extend the orchestration engine.

## Pipeline Phases
1. **Atlas (Orchestrator)**: Receives user intent, decomposes into sub-tasks, routes to appropriate agents
2. **Scout (Prospect Discovery)**: Searches web, databases, and APIs for potential leads matching ICP
3. **Forge (Data Enrichment)**: Enriches raw prospect data with company info, contact details, signals
4. **Sage (Lead Qualification)**: Scores leads using BANT/MEDDIC, assigns temperature (cold→warm→hot→super_hot)
5. **Judge (Objection Handler)**: Pre-computes objection responses, competitive positioning, battle cards
6. **Bard (Outreach Composer)**: Generates personalized outreach sequences (email, LinkedIn, phone scripts)
7. **Flow (Pipeline Manager)**: Manages workflow state, handles follow-ups, tracks pipeline metrics
8. **Echo (Report Generator)**: Produces pipeline reports, analytics, and AI-driven insights

## Optimization Targets
- **Pipeline Latency**: < 30s end-to-end for single lead
- **Token Efficiency**: < 5,000 tokens per agent step
- **Success Rate**: > 95% pipeline completion
- **Cost**: < $0.10 per pipeline run in LLM tokens

## RAG Integration
- Use hybrid BM25 + semantic search for knowledge retrieval
- Re-rank results by relevance and recency
- Cache frequently accessed context to reduce latency
- Context window budget: 80% for task context, 20% for RAG results

## MCP Tool Usage
- Register external tools via MCP protocol
- Validate tool inputs before execution
- Handle tool failures with fallback strategies
- Log all tool invocations for audit trail

## Quality Gates
- [ ] Each agent step completes within token budget
- [ ] Pipeline state is persisted after each step
- [ ] Safety guardrails pass on all outputs
- [ ] Total pipeline latency within SLO
- [ ] Cost per pipeline within budget`
},

{
  agentSlug: 'ml-engineer-orchestration',
  title: 'SOP: Prompt Engineering & A/B Testing',
  category: 'sop',
  tags: ['sop', 'prompt-engineering', 'ab-testing', 'ai'],
  content: `# SOP: Prompt Engineering & A/B Testing

## Prompt Design Principles
1. **Role Clarity**: Define exactly what the agent should do
2. **Context Sufficiency**: Provide all necessary context without overwhelming
3. **Output Format**: Specify exact expected output format (JSON, markdown, etc.)
4. **Guardrails**: Include safety constraints and refusal conditions
5. **Examples**: Include 2-3 few-shot examples when possible

## Prompt Structure Template
\`\`\`
[ROLE DEFINITION]
You are the [agent name] for LeadReach AI.

[CORE RESPONSIBILITIES]
- [responsibility 1]
- [responsibility 2]

[CONSTRAINTS]
- [constraint 1]
- [constraint 2]

[OUTPUT FORMAT]
Respond with [format specification].
\`\`\`

## A/B Testing Protocol
1. Define hypothesis: "Variant B will improve [metric] by [X%]"
2. Create prompt variants A (control) and B (treatment)
3. Run both variants on identical inputs (min 100 samples)
4. Measure: accuracy, latency, token usage, user satisfaction
5. Statistical significance: require p < 0.05
6. Deploy winner, document results

## Temperature Settings by Task
- Code generation: 0.2-0.3 (deterministic)
- Data extraction: 0.1-0.2 (very precise)
- Creative writing: 0.7-0.8 (exploratory)
- Analysis: 0.4-0.5 (balanced)
- Strategy: 0.5-0.6 (somewhat creative)`
},

// ━━━ PRODUCT DESIGNER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'product-designer',
  title: 'SOP: Design System & Component Specification',
  category: 'sop',
  tags: ['sop', 'design-system', 'components', 'ui'],
  content: `# SOP: Design System & Component Specification

## Design Token Architecture
- **Colors**: OKLCH-based with dark mode inversion (defined in globals.css @theme inline)
- **Typography**: Inter (body), system font (headings), monospace (code)
- **Spacing**: 4px grid (Tailwind spacing scale)
- **Borders**: border-border/50 for subtle, border-border for standard
- **Radius**: rounded-lg (cards), rounded-xl (modals), rounded-full (avatars)

## Component Specification Process
1. **Identify need**: What user task requires this component?
2. **Audit existing**: Check if shadcn/ui or existing component can be extended
3. **Design variants**: Define all states (default, hover, active, disabled, loading, error)
4. **Dark mode**: Design both light and dark variants simultaneously
5. **Responsive**: Define behavior at sm, md, lg, xl breakpoints
6. **Accessibility**: Add ARIA labels, keyboard navigation, focus management
7. **Document**: Create component spec with props, variants, and usage examples

## Accessibility Requirements (WCAG 2.1 AA)
- Color contrast ratio: 4.5:1 for normal text, 3:1 for large text
- All interactive elements reachable via keyboard (Tab, Enter, Escape)
- Form inputs have associated labels
- Images have alt text (decorative: alt="")
- Focus indicators visible (ring utility)
- Screen reader announcements for dynamic content (aria-live)

## Dark Mode Rules
- Use semantic color variables (text-foreground, bg-card, etc.)
- Never hardcode hex colors in components
- Test both themes for every new component
- OKLCH colors auto-invert via the @theme inline configuration`
},

// ━━━ ENTERPRISE AE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'enterprise-ae',
  title: 'SOP: Enterprise Sales Cycle (MEDDIC)',
  category: 'sop',
  tags: ['sop', 'sales', 'meddic', 'enterprise', 'pipeline'],
  content: `# SOP: Enterprise Sales Cycle (MEDDIC)

## Sales Process Stages
1. **Prospecting** → Identify target accounts via ICP matching
2. **Discovery** → Conduct needs assessment, qualify with MEDDIC
3. **Demo** → Deliver customized product demonstration
4. **Proposal** → Create ROI-justified commercial proposal
5. **Negotiation** → Address terms, pricing, security review
6. **Close** → Execute contract, hand off to Customer Success
7. **Expansion** → Identify upsell/cross-sell within 90 days

## MEDDIC Qualification Framework
### M — Metrics
- What measurable outcomes will the customer achieve?
- Target: 3x lead volume, 50% faster qualification, 2x pipeline
- Quantify in dollar terms: "We'll add $X in pipeline per month"

### E — Economic Buyer
- Who has budget authority? (VP Sales, CRO, CEO)
- What's their procurement process?
- Required: Direct access or confirmed champion connection

### D — Decision Criteria
- What criteria will they evaluate? (ROI, integration, security, support)
- How do we score against each criterion?
- Identify where we win vs. competitors

### D — Decision Process
- What's the procurement timeline? (30/60/90 days)
- Who are the stakeholders in the buying committee?
- What approvals are needed? (legal, security, finance)

### I — Identify Pain
- What's the burning problem? (manual prospecting, low lead quality, slow pipeline)
- What's the cost of doing nothing? (quantify in $/month)
- Pain must be acknowledged by the economic buyer

### C — Champion
- Who's our internal advocate? (must have power + influence)
- Have we armed them with internal selling tools?
- Is the champion actively selling on our behalf?

## Deal Qualification Score
- Fully qualified (6/6 MEDDIC): Forecast at 70%+ probability
- Partially qualified (4-5/6): Continue discovery, 40-60% probability
- Under-qualified (<4/6): Do not forecast, return to discovery

## Proposal Template
1. Executive Summary: Problem statement + proposed solution
2. ROI Analysis: Investment vs. projected returns (3-year model)
3. Platform Overview: Key capabilities mapped to their use case
4. Implementation Plan: Timeline, milestones, resources
5. Pricing: Subscription tiers, implementation fee, optional add-ons
6. Terms: Contract length, payment terms, SLA commitments
7. References: Customer success stories in their industry

## Competitive Battle Cards
- vs. Apollo.io: We offer multi-agent orchestration (they don't)
- vs. ZoomInfo: We provide AI-powered enrichment + outreach (data-only)
- vs. Outreach.io: We generate leads (they only manage existing pipeline)
- vs. Seamless.ai: We have 8-agent pipeline with ICP scoring (simpler tool)`
},

// ━━━ CUSTOMER SUCCESS MANAGER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'customer-success-manager',
  title: 'SOP: Customer Onboarding (30-60-90 Day Plan)',
  category: 'sop',
  tags: ['sop', 'onboarding', 'customer-success', '30-60-90'],
  content: `# SOP: Customer Onboarding (30-60-90 Day Plan)

## Week 1: Foundation
- [ ] Provision account and add team members
- [ ] Complete ICP (Ideal Customer Profile) setup
- [ ] Create first campaign with target criteria
- [ ] Configure integrations (CRM, email if applicable)
- [ ] Assign dedicated Customer Success Manager

## Week 2: First Results
- [ ] Run first prospect discovery pipeline
- [ ] Review 50+ discovered leads together
- [ ] Configure lead scoring criteria
- [ ] Set up data enrichment preferences
- [ ] Schedule weekly check-in cadence

## Week 3: Outreach Activation
- [ ] Create outreach sequences (email, LinkedIn)
- [ ] Approve messaging templates
- [ ] Launch outreach to top-scored leads
- [ ] Monitor first response rates
- [ ] Adjust messaging based on initial results

## Week 4: Pipeline Operational
- [ ] Full pipeline running: Discovery → Enrichment → Qualification → Outreach
- [ ] First meeting booked (target)
- [ ] Review pipeline metrics and optimize
- [ ] Document initial ROI metrics
- [ ] Celebrate first wins with the team

## Month 2: Optimization & Expansion
- [ ] Analyze pipeline performance data
- [ ] Optimize ICP based on results (tighten/expand)
- [ ] Train additional team members
- [ ] Explore advanced features (AI Setter, Bookings, Messaging)
- [ ] Discuss expansion opportunities (more seats, higher tier)
- [ ] ROI should be demonstrably positive

## Month 3: Advocacy & Growth
- [ ] Conduct first Quarterly Business Review (QBR)
- [ ] Present ROI metrics and success metrics
- [ ] Request customer reference or case study participation
- [ ] Identify cross-sell/upsell opportunities
- [ ] Transition to steady-state success plan
- [ ] Target: Customer is a net promoter (NPS 9-10)

## Health Score Monitoring
- **Green (80-100)**: On track, proactive outreach for expansion
- **Yellow (60-79)**: At risk, increase touchpoints, address issues
- **Orange (40-59)**: High risk, executive escalation, create save plan
- **Red (0-39)**: Critical, immediate intervention required

## Churn Signals & Save Plays
- Login frequency drops > 50% over 2 weeks
- Support ticket volume increases > 3x
- Key champion leaves the company
- Payment issues or delayed renewals
- Feature adoption < 20% of included features`
},

// ━━━ CONTENT MARKETING LEAD ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'content-marketing-lead',
  title: 'SOP: Content Creation & Editorial Process',
  category: 'sop',
  tags: ['sop', 'content', 'editorial', 'marketing'],
  content: `# SOP: Content Creation & Editorial Process

## Content Pillars
1. **AI & Automation**: How AI transforms lead generation and sales workflows
2. **Product Deep-Dives**: Feature walkthroughs with real examples and use cases
3. **Customer Success**: Case studies with quantified ROI and testimonials
4. **Industry Insights**: Market trends, benchmarks, and original research
5. **Technical Guides**: Integration guides, API documentation, best practices

## Content Creation Process
1. **Research** (30 min): Keyword research, competitor analysis, audience intent
2. **Outline** (20 min): Structure with H2/H3 hierarchy, key points per section
3. **Draft** (2-4 hours): Write full draft following brand voice guidelines
4. **Edit** (30 min): Grammar, clarity, SEO optimization, internal linking
5. **Review** (20 min): Technical accuracy check, fact verification
6. **Publish** (10 min): Format in CMS, add metadata, schedule/promote
7. **Measure** (ongoing): Track traffic, engagement, conversion, attribution

## Blog Post Template
\`\`\`
# [Title — Include Primary Keyword]

## Introduction (2-3 paragraphs)
- Hook with a surprising stat or common pain point
- State the problem and hint at the solution
- Preview what the reader will learn

## [Section 1: Problem/Context] (3-5 paragraphs)
- Deep dive into the challenge
- Data points and industry context
- Why this matters now

## [Section 2: Solution/How-To] (5-8 paragraphs)
- Step-by-step guidance or framework
- Real examples and screenshots
- Pro tips and common mistakes to avoid

## [Section 3: Results/Proof] (3-4 paragraphs)
- Case study data or customer quotes
- Before/after metrics
- ROI calculations

## Conclusion (2 paragraphs)
- Summarize key takeaways
- Call-to-action (demo, trial, or next resource)
\`\`\`

## SEO Checklist
- [ ] Primary keyword in title, H1, first paragraph, and meta description
- [ ] Secondary keywords in H2s and body
- [ ] Internal links to 3-5 related pages
- [ ] External links to 2-3 authoritative sources
- [ ] Meta description under 160 characters
- [ ] Title under 60 characters
- [ ] Image alt text for all images
- [ ] Schema markup where applicable

## Content Repurposing Matrix
| Source | Blog | Social | Email | Docs | Video |
|--------|------|--------|-------|------|-------|
| Research report | ✓ | ✓✓ | ✓ | | ✓ |
| Feature launch | ✓ | ✓✓ | ✓ | ✓ | ✓ |
| Case study | ✓ | ✓ | ✓✓ | | ✓ |
| How-to guide | ✓ | ✓ | | ✓✓ | ✓ |`
},

// ━━━ DEVOPS ENGINEER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{
  agentSlug: 'devops-platform-engineer',
  title: 'SOP: Incident Response & SRE Practices',
  category: 'sop',
  tags: ['sop', 'incident-response', 'sre', 'devops'],
  content: `# SOP: Incident Response & SRE Practices

## Service Level Objectives (SLOs)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Availability | 99.95% | Uptime checks every 30s |
| API Latency (p99) | < 3s | Request duration tracking |
| Page Latency (p99) | < 500ms | Lighthouse/Real User Monitoring |
| Error Rate | < 0.1% | HTTP 5xx responses / total |
| MTTR | < 15 min | Time from alert to resolution |

## Incident Severity Levels
- **P1 (Critical)**: Complete outage or data breach — ALL HANDS
- **P2 (High)**: Major feature down for >10% of users — Urgent response
- **P3 (Medium)**: Minor feature degraded — Fix within 4 hours
- **P4 (Low)**: Cosmetic or minor issue — Fix in next deploy

## Incident Response Process
### 1. Detect (Automated)
- Monitoring alerts fire when SLOs are breached
- Health check endpoints (/health, /api/health) fail
- User reports via support channels

### 2. Triage (< 5 min)
- Classify severity level (P1-P4)
- Identify blast radius (which features, which users)
- Assign incident commander (usually DevOps)
- Create incident channel/notification

### 3. Mitigate (< 15 min for P1)
- Apply runbook fix if known
- If unknown: rollback to last stable deployment
- If rollback not possible: scale up, feature flag off
- Communicate status to stakeholders

### 4. Resolve
- Implement proper fix with tests
- Deploy through normal CI/CD pipeline
- Verify fix in production
- Remove any temporary mitigations

### 5. Post-Mortem (< 24 hours for P1/P2)
- Timeline of events
- Root cause analysis (5 Whys)
- Contributing factors
- Action items with owners and deadlines
- Share findings with team

## Deployment Checklist
- [ ] \`npx next build\` passes with zero errors
- [ ] All tests pass
- [ ] Database migration tested on staging
- [ ] Feature flags configured for gradual rollout
- [ ] Monitoring alerts configured for new features
- [ ] Rollback plan documented
- [ ] On-call engineer confirmed for post-deploy window

## Monitoring Stack
- **Uptime**: /health endpoint (Vercel health checks)
- **Errors**: Structured logging via AgentLog model
- **Performance**: Vercel Analytics + custom metrics
- **Costs**: Token usage tracking per agent
- **Capacity**: Request volume, queue depth, concurrent users`
},

{
  agentSlug: 'devops-platform-engineer',
  title: 'Runbook: Infrastructure & Deployment',
  category: 'runbook',
  tags: ['runbook', 'infrastructure', 'deployment', 'devops'],
  content: `# Runbook: Infrastructure & Deployment

## Architecture Overview
\`\`\`
Users → Vercel CDN → Next.js App → API Routes
                                  → Supabase (Auth + DB)
                                  → z-ai-web-dev-sdk (AI/LLM)
                                  → Stripe (Payments)
\`\`\`

## Deployment Process
1. Code merged to main branch
2. Vercel auto-deploys (preview for PRs, production for main)
3. Build: \`next build\` with standalone output
4. Deploy: Vercel Edge Network (global CDN)
5. Verify: Health check + smoke test

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Supabase anonymous key
- SUPABASE_SERVICE_ROLE_KEY: Server-side operations
- STRIPE_SECRET_KEY: Stripe API key
- DATABASE_URL: Prisma database connection

## Database Operations
- Schema changes: \`npx prisma db push\` (dev), \`npx prisma migrate deploy\` (prod)
- Backups: Supabase automatic daily backups
- Connection pooling: Supabase built-in pooling (PgBouncer)

## Cost Optimization
- Use \`output: 'standalone'\` for smaller deployments
- Cache static assets aggressively (Vercel CDN)
- Optimize images with next/image
- Use streaming for large AI responses
- Batch database queries where possible

## Security Hardening
- CSP headers via applySecurityHeaders in proxy.ts
- CORS configured for specific origins only
- Auth tokens refreshed on every request via proxy.ts
- Rate limiting on API routes (TODO: add)
- Secrets in environment variables only (never in code)`
},

];

async function main() {
  console.log('📚 Seeding Workforce Knowledge Base Documents...\n');

  let total = 0;
  for (const doc of DOCUMENTS) {
    const agent = await prisma.workforceAgent.findFirst({ where: { slug: doc.agentSlug } });
    if (!agent) {
      console.log(`  ⚠️  Agent not found: ${doc.agentSlug}, skipping`);
      continue;
    }

    const result = await prisma.workforceDocument.create({
      data: {
        agentId: agent.id,
        title: doc.title,
        category: doc.category,
        content: doc.content,
        tags: JSON.stringify(doc.tags),
        sourceType: 'auto_generated',
      },
    });
    console.log(`  ✅ [${doc.category.toUpperCase()}] ${doc.title}`);
    total++;
  }

  console.log(`\n✨ ${total} knowledge base documents seeded across ${new Set(DOCUMENTS.map(d => d.agentSlug)).size} agents.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
