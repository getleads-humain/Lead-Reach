'use client';

import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Heart,
  Sparkles,
  Shield,
  Zap,
  Users,
  Target,
  Lightbulb,
  Globe,
  ArrowRight,
  Quote,
  BookOpen,
  Flame,
  Compass,
  Scale,
  Eye,
  Handshake,
  Trophy,
  Coffee,
  Brain,
  Rocket,
  TreePine,
} from 'lucide-react';

export default function CulturePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative py-20 lg:py-28 border-b border-border/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-6">
              <Heart className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Our Culture</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
              We Build With{' '}
              <span className="text-gradient">Conviction</span>, Not Convention
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl">
              LeadReach AI is not a company that happened to use AI — we are a company forged by the belief that autonomous intelligence will redefine how businesses grow. Our culture reflects that conviction in every decision, every hire, and every line of code we ship. We do not follow playbooks; we write them.
            </p>
          </div>
        </div>
      </section>

      {/* Culture DNA — The Unshakable Foundation */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 mb-4">
              <Flame className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-400">Culture DNA</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              The Unshakable Foundation
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Every organization has values printed on a wall. Few have values that actually drive daily decisions. At LeadReach AI, our cultural DNA is not aspirational decoration — it is the operating system that runs every team, every product decision, and every customer interaction. These are not suggestions. They are invariants, as immovable as the laws of physics in our codebase.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Radical Ownership',
                color: 'emerald',
                description: 'There are no spectators at LeadReach AI. Every person owns their domain end-to-end — from concept to production to post-launch telemetry. When something breaks at 3 AM, the person who built it responds. Not because a playbook says so, but because ownership is identity. We do not hand off problems; we solve them. If you touched it, you own it. If you see it, you fix it. There is no "that is not my job" in our vocabulary.',
                principle: 'If you see it, you own it. If you own it, you ship it.',
              },
              {
                icon: Lightbulb,
                title: 'First-Principles Thinking',
                color: 'cyan',
                description: 'We refuse to accept "because that is how it has always been done" as a valid reason for anything. Every process, every architecture decision, every product feature must justify its existence from first principles. When we built our multi-agent orchestration system, we did not copy existing workflow engines — we asked "what would the optimal coordination protocol look like if we started from zero?" and built that instead. Convention is the enemy of breakthrough.',
                principle: 'Question every assumption. Build from truth, not tradition.',
              },
              {
                icon: Eye,
                title: 'Obsessive Transparency',
                color: 'blue',
                description: 'Our agents annotate every decision with confidence scores and source attribution. Our engineering dashboards are visible to the entire company. Our roadmap is not a secret document — it is a living, public artifact. We believe that transparency is not a vulnerability but a competitive weapon. When everyone can see the full picture, everyone can make better decisions. Secrets breed misalignment. Visibility breeds velocity.',
                principle: 'Default to open. Share context, not just conclusions.',
              },
              {
                icon: Target,
                title: 'Outcomes Over Activity',
                color: 'amber',
                description: 'We measure impact, not hours. We measure shipped value, not story points. We measure customer outcomes, not feature counts. A engineer who ships one feature that doubles conversion rates is more valuable than one who ships ten features nobody uses. Our performance systems, our sprint planning, and our promotion criteria all reflect this: we reward results, not performative busyness. Activity without impact is waste dressed as progress.',
                principle: 'Ship value, not velocity. Measure outcomes, not output.',
              },
              {
                icon: Compass,
                title: 'Long-Term Orientation',
                color: 'violet',
                description: 'We make decisions for the company we are building in five years, not the quarterly earnings we need next month. Our agent architecture took eighteen months to develop because we refused to ship a fragile shortcut. Our free tier exists because we believe the best marketing is a product that genuinely helps people. We invest in foundational infrastructure — our Agent-Reach channel system, our memory architecture, our quality assurance frameworks — because compounding returns favor the patient.',
                principle: 'Build what lasts. Compounding favors the patient builder.',
              },
              {
                icon: Scale,
                title: 'Earned Trust',
                color: 'rose',
                description: 'Trust at LeadReach AI is not granted by title, tenure, or charisma. It is earned through consistent delivery, honest communication, and demonstrated judgment. Our agents are designed with the same philosophy: they prove their reliability through auditable decisions and transparent confidence scores. A junior engineer who consistently ships high-quality work earns more trust than a senior engineer who does not. Trust is a ledger, and every interaction is a transaction.',
                principle: 'Trust is earned in drops and lost in buckets. Prove it daily.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card-premium border-border/30 bg-card/50 p-6 rounded-xl flex flex-col"
              >
                <div className={`rounded-lg p-2.5 w-fit mb-4 ${
                  item.color === 'emerald' ? 'bg-emerald-500/10' :
                  item.color === 'cyan' ? 'bg-cyan-500/10' :
                  item.color === 'blue' ? 'bg-blue-500/10' :
                  item.color === 'amber' ? 'bg-amber-500/10' :
                  item.color === 'violet' ? 'bg-violet-500/10' :
                  'bg-rose-500/10'
                }`}>
                  <item.icon className={`h-5 w-5 ${
                    item.color === 'emerald' ? 'text-emerald-400' :
                    item.color === 'cyan' ? 'text-cyan-400' :
                    item.color === 'blue' ? 'text-blue-400' :
                    item.color === 'amber' ? 'text-amber-400' :
                    item.color === 'violet' ? 'text-violet-400' :
                    'text-rose-400'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.description}</p>
                <div className="mt-4 pt-4 border-t border-border/20">
                  <p className="text-xs font-medium text-foreground italic">&ldquo;{item.principle}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How We Work — The Operating Model */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 mb-4">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Operating Model</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              How We Work
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Culture is not what you say — it is what you do when no one is watching. Our operating model defines the daily rhythms, decision-making protocols, and collaboration patterns that turn our values into action. Every practice below exists because we learned, sometimes painfully, that the alternative does not work at the speed and quality our customers demand.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              {[
                {
                  title: 'Async-First, Sync-When-It-Matters',
                  description: 'We default to written communication — RFCs, design docs, decision logs — because written thinking is clearer thinking. Synchronous meetings are reserved for genuine ambiguity that cannot be resolved asynchronously: architectural debates, creative ideation, and conflict resolution. Every meeting must have a written agenda distributed 24 hours in advance and a decision log published within 2 hours of conclusion. If it can be an RFC, it should be an RFC. If it needs a room, book the room — but do not default to it.',
                },
                {
                  title: 'Ship on Tuesday, Reflect on Friday',
                  description: 'Our cadence is designed around two rhythms: the shipping rhythm and the learning rhythm. Tuesday through Thursday are deep-work, heads-down shipping days. Meetings are banned. Slack is muted by default. Friday is Reflection Day — every team spends 2 hours in a structured retrospective analyzing what worked, what failed, and what they would do differently. This dual cadence ensures we never fall into the trap of shipping without learning or learning without shipping.',
                },
                {
                  title: 'Decision Records Over Decision Meetings',
                  description: 'Every significant decision — architectural, product, strategic — is recorded in a Decision Record (DR) that includes the context, the alternatives considered, the decision made, the rationale, and the expected revisit date. DRs are immutable once published; if we change a decision, we write a new DR that references the old one. This creates a decision audit trail that prevents us from re-litigating settled questions and helps new team members understand why things are the way they are.',
                },
                {
                  title: 'Blameless Post-Incidents',
                  description: 'When our systems fail — and they will — we conduct blameless post-incident reviews focused exclusively on systemic causes and preventive mechanisms. No finger-pointing, no name-calling, no "who pushed the button." The question is never "who broke it?" but "what system allowed this failure to occur, and how do we make this class of failure impossible?" Every post-incident produces at least one concrete action item that is tracked to completion.',
                },
              ].map((item) => (
                <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {[
                {
                  title: 'RFC Culture',
                  description: 'Every non-trivial change starts with a Request for Comments. RFCs are lightweight documents — typically 1-3 pages — that describe a problem, propose a solution, and invite feedback. Anyone can write an RFC, anyone can comment, and the author makes the final call. This decentralizes decision-making, improves solution quality through diverse perspectives, and creates a permanent record of the reasoning behind every major change. Our agent architecture was shaped by 23 RFCs over 14 months.',
                },
                {
                  title: 'Agent-Driven Dogfooding',
                  description: 'We use our own agents to find, qualify, and engage prospects for LeadReach AI itself. When our Outreach Composer sends a cold email on our behalf, we experience exactly what our customers experience. When our Qualification Agent scores a lead incorrectly, we feel the pain before our customers do. This dogfooding is not optional — it is built into our weekly sprint cycle. Every team member reviews at least 10 agent-generated outputs per week and provides structured feedback that feeds directly into our agent improvement pipeline.',
                },
                {
                  title: 'Open Compensation Bands',
                  description: 'Every role at LeadReach AI has transparent compensation bands visible to all employees. There are no secret negotiations, no opaque equity grants. If you are a Level 4 engineer, you know exactly what every other Level 4 engineer makes. This eliminates the information asymmetry that breeds resentment and ensures that compensation is based on role and impact, not negotiation skill. Annual compensation reviews are data-driven and benchmarked against market rates.',
                },
                {
                  title: 'Continuous Learning Mandate',
                  description: 'Every team member has a $3,000 annual learning budget and a mandate to use it. We do not view learning as a perk — we view it as a professional obligation. The AI landscape evolves monthly, and our team must evolve with it. We run internal "Agent Labs" every other week where team members present papers, prototype new approaches, and share insights from production systems. The best ideas from Agent Labs get funded as formal projects within 48 hours.',
                },
              ].map((item) => (
                <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The People We Seek */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 mb-4">
              <Users className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-xs font-medium text-rose-400">Who We Hire</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              The People We Seek
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We do not hire for skills alone — skills can be taught. We hire for traits that cannot: intellectual curiosity, systems thinking, and the drive to build something that outlasts you. Our interview process is designed to surface how candidates think, not just what they know. We would rather hire a brilliant learner than a brilliant expert, because in a field that reinvents itself every six months, the ability to learn faster than the competition is the only sustainable advantage.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Brain,
                title: 'Systems Thinkers',
                description: 'People who see the whole board, not just their square. Our agents are interconnected systems — a change in the Discovery Agent ripples through Enrichment, Qualification, and Outreach. We need people who think in systems, who understand that optimizing a component in isolation often sub-optimizes the whole. The best engineers at LeadReach AI can explain how a change to the search query constructor affects the final outreach message quality three pipeline stages later.',
              },
              {
                icon: Rocket,
                title: 'Constructive Disruptors',
                description: 'People who challenge the status quo with solutions, not complaints. We want the engineer who sees a broken process and submits an RFC to fix it. The product manager who questions why every competitor does the same thing and proposes a fundamentally different approach. The designer who refuses to copy the industry standard because they can imagine something better. Disruption without construction is destruction. We want builders who break things on purpose — and then make them unbreakable.',
              },
              {
                icon: TreePine,
                title: 'Patient Builders',
                description: 'People who are willing to invest in foundational work that compounds over years. Our Agent-Reach channel system took 18 months to build. Our quality assurance framework took 12 months. Our memory architecture is still evolving after 24 months. These are not projects for people who need instant gratification. They are projects for people who find deep satisfaction in building infrastructure that makes every future project faster, more reliable, and more powerful.',
              },
              {
                icon: Handshake,
                title: 'Radical Collaborators',
                description: 'People who amplify others. Solo brilliance is insufficient in a multi-agent system — both the AI kind and the human kind. We need engineers who write documentation so good that a new hire can contribute in their first week. Designers who pair with engineers instead of throwing designs over the wall. Researchers who translate complex findings into actionable product recommendations. The best work at LeadReach AI happens at the intersection of disciplines.',
              },
            ].map((item) => (
              <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-4">
                  <item.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do Not Tolerate */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 mb-4">
              <Shield className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">Non-Negotiables</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              What We Do Not Tolerate
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              A culture is defined as much by what it excludes as by what it embraces. The behaviors below are not merely discouraged — they are disqualifying. We have let go of talented individuals who exhibited these patterns because talent without alignment is a liability, not an asset. Our standards are high because our customers depend on systems that work, and systems that work are built by teams that hold each other accountable without exception.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Knowledge Hoarding',
                description: 'Information asymmetry is power in dysfunctional organizations. At LeadReach AI, it is a performance issue. If you are the only person who understands a system, you have failed to document it. If you withhold context to stay indispensable, you have betrayed the team. Our agents annotate every decision with full provenance — and we hold humans to the same standard. Knowledge that is not shared is knowledge that does not exist.',
              },
              {
                title: 'Blame Shifting',
                description: 'When things break, the question is "what do we fix?" not "who do we blame?" Blame shifting destroys the psychological safety required for honest post-incident reviews, for admitting mistakes early, and for asking for help when stuck. Our pipeline manager agent has a strict rule: every state transition is logged with its reason. We expect the same from humans — when you make a decision, own it, document your reasoning, and stand by it or change it transparently.',
              },
              {
                title: 'Shortcut Culture',
                description: 'We move fast, but we do not cut corners. Speed without quality is not velocity — it is debt. Every shortcut taken today becomes a bug, an outage, or a refactor tomorrow. Our engineering standards exist because we have paid the price for violating them. We would rather ship late and right than ship on time and broken. This is not perfectionism; it is professional responsibility to the customers who depend on our systems running flawlessly at 3 AM while they sleep.',
              },
            ].map((item) => (
              <div key={item.title} className="card-premium border-red-500/20 bg-card/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="text-red-400">&#x2715;</span>
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Culture in Practice — Real Stories */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 mb-4">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Culture in Practice</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Real Stories From Our Team
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Culture is not what you write on a website — it is what happens when the pressure is highest, the deadline is closest, and the easiest path is the wrong one. These are the moments that define who we are.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                quote: 'When our Discovery Agent started returning duplicate companies across channels, the easy fix was to add a simple name-matching filter. Instead, Elena spent two weeks building a fuzzy matching engine with Levenshtein distance scoring and legal suffix normalization. That engine now prevents thousands of duplicate records daily across all customer campaigns. She did not need permission — she saw a systemic problem and built the right solution.',
                author: 'Marcus Chen',
                role: 'CEO',
                context: 'On the fuzzy matching engine that now processes 50K+ deduplication checks daily',
              },
              {
                quote: 'We shipped a version of the Qualification Agent that scored leads 30% faster — but it achieved that speed by skipping the intent signal detection step. During dogfooding, we noticed our own outreach conversion rate dropped from 12% to 4%. The team made the call to revert the optimization within 4 hours, before any customer was affected. Speed means nothing if the output is wrong.',
                author: 'Dr. Sarah Patel',
                role: 'CTO',
                context: 'On the decision to revert a performance optimization that compromised accuracy',
              },
              {
                quote: 'A customer on our free tier was stuck — they had 200 leads but could not afford the enrichment credits to make them useful. Instead of upselling, James spent his weekend building a "self-enrichment" guide that showed the customer how to use our free Web Reader channel to fill in 60% of the missing data themselves. That customer upgraded three months later. Not because of a sales call, but because of trust.',
                author: 'David Kim',
                role: 'VP Customer Success',
                context: 'On choosing customer outcomes over short-term revenue',
              },
            ].map((item, i) => (
              <div key={i} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl flex flex-col">
                <Quote className="h-6 w-6 text-emerald-400/40 mb-4 flex-shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{item.quote}</p>
                <div className="mt-6 pt-4 border-t border-border/20">
                  <p className="text-sm font-semibold text-foreground">{item.author}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                  <p className="text-xs text-emerald-400/70 mt-1">{item.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diversity, Equity & Inclusion */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-4">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-400">DEI</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Diversity Is Not a Program — It Is a Prerequisite
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                We build AI agents that serve businesses across 40+ countries, in every industry, at every scale. A homogeneous team cannot build products that serve a heterogeneous world. Our commitment to diversity is not performative — it is architectural. Different perspectives surface different edge cases, different assumptions, and different opportunities. Our Discovery Agent searches 17+ channels precisely because a single-perspective search is inherently limited. The same principle applies to our team.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Our hiring pipeline is designed to reduce bias at every stage: blind resume screening, structured interviews with rubric-based evaluation, diverse interview panels, and calibrated scoring. But we also know that pipeline fixes are insufficient. We invest in mentorship programs for underrepresented groups in tech, partner with organizations like Code2040 and Women Who Code, and maintain transparent promotion criteria so that advancement is based on demonstrated impact, not social capital.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Team members across', value: '12+ countries', detail: 'San Francisco, New York, London, Singapore, Lagos, Berlin, and more' },
                { label: 'Languages spoken', value: '18+', detail: 'Including English, Mandarin, Hindi, Yoruba, Portuguese, German, Korean, and Arabic' },
                { label: 'Women in engineering', value: '38%', detail: 'Industry average is 22%. Target: 50% by 2027.' },
                { label: 'Underrepresented minorities in leadership', value: '42%', detail: 'Across VP+ roles. Measured quarterly, published annually.' },
                { label: 'Annual DEI budget', value: '$250K+', detail: 'Dedicated budget for mentorship, partnerships, conference sponsorships, and ERGs' },
              ].map((item) => (
                <div key={item.label} className="card-premium border-border/30 bg-card/50 p-4 rounded-xl flex items-start gap-4">
                  <div className="rounded-lg bg-emerald-500/10 p-2 flex-shrink-0">
                    <Trophy className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-xl font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Wellness & Sustainability */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 mb-4">
              <Coffee className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">Sustainable Pace</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Burnout Is a Bug, Not a Badge
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              The tech industry has a pathological relationship with overwork. We reject the myth that 80-hour weeks produce 80 hours of value. Research consistently shows that productivity peaks at approximately 40-50 hours per week and declines sharply thereafter. Our agents are designed to run 24/7 so that humans do not have to. The entire premise of LeadReach AI is that AI handles the repetitive, time-consuming work — and we extend that philosophy to our own operations.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Flexible PTO', description: 'No accrual, no tracking, no guilt. Take what you need, when you need it. The only rule: coordinate with your team so coverage is maintained. We trust you to manage your time like the professional you are.', metric: 'Average: 28 days/year' },
              { title: 'Mental Health Days', description: 'Four dedicated mental health days per year, no questions asked. Mental health is health, and we treat it with the same seriousness as physical health. Our benefits include full coverage for therapy and coaching.', metric: '100% utilization rate' },
              { title: 'Focus Fridays', description: 'No meetings, no Slack expectations, no deadlines. Fridays are for deep work, learning, or recharging. If you want to spend Friday reading a paper, building a side project, or going for a hike, that is a valid and encouraged use of the day.', metric: '87% team satisfaction' },
              { title: 'Sabbatical Program', description: 'After four years of continuous employment, every team member is eligible for a fully paid 4-week sabbatical. Not vacation — sabbatical. The purpose is extended rest, personal growth, or creative exploration. Several of our best product ideas originated during sabbaticals.', metric: '92% return rate' },
            ].map((item) => (
              <div key={item.title} className="card-premium border-border/30 bg-card/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2">
                  <p className="text-xs font-medium text-emerald-400">{item.metric}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card/50 to-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                See Our Culture in <span className="text-gradient">Action</span>
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The best way to understand our culture is to experience the product it produces. Launch the platform, run a campaign, and watch eight specialized AI agents collaborate to find, enrich, qualify, and engage your ideal prospects.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/app">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm px-8 py-6 text-base">
                    Launch Platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/careers">
                  <Button variant="outline" className="border-border/50 px-8 py-6 text-base">
                    View Open Roles
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
