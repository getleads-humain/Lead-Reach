'use client';

import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Heart, Users, Lightbulb, Shield, Compass, Zap, Star, Globe, Brain, Coffee, Dna, Trophy } from 'lucide-react';

const VALUES = [
  {
    icon: Lightbulb,
    title: 'Intellectual Honesty',
    description:
      'We speak the truth even when it is inconvenient. Every agent in our system is designed to surface uncertainty, flag low-confidence data, and never fabricate results. We extend this same honesty to our team — dissent is encouraged, mistakes are acknowledged, and assumptions are always challenged.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Shield,
    title: 'Radical Transparency',
    description:
      'Every decision our AI agents make is traceable, every score is decomposable into its factor contributions, and every data point is attributed to its source. We believe opacity is the enemy of trust, and we build our platform so that any human can audit any automated decision at any time.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Obsessive Customer Value',
    description:
      'We measure success by the value we create for our customers, not by the features we ship. Every agent, every channel, every workflow exists for one reason: to help our users find, qualify, and engage the right leads faster and more accurately than they ever could manually. If it does not serve the customer, it does not ship.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Compass,
    title: 'Systems Thinking',
    description:
      'We do not build isolated features; we build interconnected systems. Our 8-agent architecture reflects a deep belief that complex problems require coordinated, multi-agent solutions where each component does one thing exceptionally well and the whole is greater than the sum of its parts.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Zap,
    title: 'Adaptive Resilience',
    description:
      'Our agents do not crash when a channel fails — they adapt, reroute, and deliver results even in degraded conditions. We apply this same philosophy to our culture: we embrace change, learn from failure, and build systems that are antifragile rather than merely robust.',
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Heart,
    title: 'Empathy at Scale',
    description:
      'Our Outreach Composer does not send generic templates — it crafts messages that reference specific details about each prospect because we believe empathy is the foundation of meaningful connection. We apply this same principle internally: we listen deeply, communicate with care, and treat every interaction as an opportunity to understand.',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
  },
];

const OPERATING_PRACTICES = [
  {
    title: 'Async-First Communication',
    description:
      'We default to written, asynchronous communication so that people can think deeply before responding. Synchronous meetings are reserved for decisions that genuinely require real-time discussion, creative brainstorming, or sensitive conversations. Every meeting has an agenda, a facilitator, and documented outcomes.',
  },
  {
    title: 'Evidence Over Opinion',
    description:
      'When disagreements arise, we resolve them with data, not debate. Our agents score leads with five-factor composite models precisely because gut feelings are unreliable. We extend this rigor to our own operations: A/B test before committing, measure before declaring success, and validate before scaling.',
  },
  {
    title: 'Ship Small, Learn Fast',
    description:
      'We ship increments, not monoliths. Our agent architecture itself embodies this principle — each agent is independently deployable, testable, and improvable. We prefer a working minimum viable agent over a perfect specification that never reaches production.',
  },
  {
    title: 'Blameless Post-Mortems',
    description:
      'When things break — and they will — we focus on the system failure, not the person. Every incident triggers a structured post-mortem that identifies root causes, systemic weaknesses, and preventive measures. We never punish mistakes; we punish the failure to learn from them.',
  },
  {
    title: 'Deep Work Protection',
    description:
      'We protect focus time as sacred. Our agents run asynchronously for a reason: interrupted work is low-quality work. We maintain designated focus blocks, minimize unnecessary notifications, and respect that the best solutions emerge from sustained, undisturbed thinking.',
  },
  {
    title: 'Open Knowledge Architecture',
    description:
      'Every agent specification, every architectural decision, and every performance benchmark is documented and accessible. We do not hoard knowledge — we share it aggressively. New team members can understand our entire system by reading our agent specs, and we invest in keeping that documentation living and accurate.',
  },
  {
    title: 'Proactive Ownership',
    description:
      'We do not wait for permission to fix what is broken. If you see a problem, you own it until it is resolved. Our Orchestrator agent, Atlas, does not wait for human intervention when a channel fails — it adapts. We expect the same proactive ownership from every person on our team.',
  },
  {
    title: 'Customer-Proximity Engineering',
    description:
      'Engineers do not work in isolation from customers. We rotate team members through customer support, sales calls, and user research sessions so that the people building the system deeply understand the people using it. The best product ideas come from direct customer exposure.',
  },
];

const PEOPLE_ARCHETYPES = [
  {
    icon: Brain,
    title: 'The Systems Architect',
    description:
      'You see the world as interconnected graphs and DAGs. When most people see a linear process, you see parallel execution paths with dependency resolution. You think in terms of state machines, event-driven architectures, and graceful degradation. You would feel at home designing our 8-agent pipeline because you naturally think about coordination, failure recovery, and adaptive strategy.',
    traits: ['Systems thinking', 'Architecture design', 'Failure-mode analysis', 'Coordination protocols'],
  },
  {
    icon: Globe,
    title: 'The Data Craftsperson',
    description:
      'You believe that data without verification is fiction and that precision is a form of respect. You are the kind of person who cross-references three sources before committing a fact, who builds confidence scoring systems instead of trusting single-source data, and who would rather leave a field null than fill it with a guess. Our Data Enrichment agent, Forge, was designed by people exactly like you.',
    traits: ['Data verification', 'Multi-source fusion', 'Confidence scoring', 'Quality obsession'],
  },
  {
    icon: Star,
    title: 'The Empathy Engineer',
    description:
      'You write code that understands people. You believe that the best technology disappears into the background and makes humans feel understood. You cringe at generic templates, you obsess over personalization depth, and you measure success not by opens and clicks but by the quality of human connection created. Our Outreach Composer, Bard, is your spiritual counterpart.',
    traits: ['Personalization craft', 'Empathy-driven design', 'Communication quality', 'Human-centered AI'],
  },
  {
    icon: Trophy,
    title: 'The Relentless Optimizer',
    description:
      'You are never satisfied with "good enough." You see a 40% open rate and immediately ask why it is not 50%. You run A/B tests in your sleep, you build dashboards for everything, and you treat every metric as an opportunity for systematic improvement. Our Pipeline Manager, Flow, and Report Generator, Echo, exist because of people like you.',
    traits: ['Metrics-driven', 'Continuous improvement', 'A/B testing mindset', 'Pipeline optimization'],
  },
];

const NON_NEGOTIABLES = [
  {
    title: 'No Fabricated Data',
    description:
      'Our agents never fabricate data. When a field is empty, it stays empty — annotated with a confidence score, not filled with a guess. When all channels fail, our LLM knowledge fallback is clearly labeled as such. This is not just a technical constraint; it is a moral commitment. We will never mislead our users by presenting AI-generated estimates as verified facts.',
  },
  {
    title: 'Privacy by Design',
    description:
      'We only collect publicly available business data. We never scrape behind authentication, we never store personal data beyond what is necessary for B2B outreach, and every data point is attributed to its source. Our agents respect robots.txt, honor rate limits, and include unsubscribe links in every message. Privacy is not a feature — it is a foundation.',
  },
  {
    title: 'Explainability Over Accuracy',
    description:
      'A 95% accurate model that cannot explain its decisions is more dangerous than an 85% accurate model that can. Every lead score is decomposable into its five factor contributions. Every disqualification has a reason code. Every agent decision has a traceable audit trail. We would rather be transparently wrong than opaquely right.',
  },
];

export default function CulturePage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <Dna className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Our Culture DNA</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight">
              We Build Systems That <span className="text-gradient">Think</span>, Not Just Execute
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              LeadReach AI is not just a product — it is a reflection of how we think about work, technology, and human potential. Our culture is encoded in every agent we build, every decision we make, and every line of code we ship. This is who we are.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Six Values That Shape Everything
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              These are not aspirational slogans on a wall. They are engineering constraints embedded in our agents, decision frameworks that guide our product, and behavioral norms that define our team. Every feature we build is tested against these values.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-border transition-all duration-300"
              >
                <div className={`inline-flex rounded-xl ${value.bg} p-3 mb-6`}>
                  <value.icon className={`h-6 w-6 ${value.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Operating Model */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How We Work
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Our operating model is not borrowed from a management textbook. It is derived from the same principles that make our agent architecture work: asynchronous coordination, evidence-based decisions, graceful degradation, and continuous adaptation. Here is how we translate those principles into daily practice.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {OPERATING_PRACTICES.map((practice, i) => (
              <div
                key={practice.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-border transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <span className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">{practice.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{practice.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* People We Seek */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              The People We Seek
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We do not hire for skills alone — we hire for cognitive style. Our best people see the world in ways that naturally align with how our system thinks. If you recognize yourself in one of these archetypes, you will thrive here.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {PEOPLE_ARCHETYPES.map((archetype) => (
              <div
                key={archetype.title}
                className="group relative rounded-2xl border border-border/50 bg-card/50 p-8 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 mb-6">
                  <archetype.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">{archetype.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4">{archetype.description}</p>
                <div className="flex flex-wrap gap-2">
                  {archetype.traits.map((trait) => (
                    <span
                      key={trait}
                      className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Non-Negotiables */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Our Non-Negotiables
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              These are not guidelines. They are inviolable constraints — the same kind of hard boundaries that prevent our agents from fabricating data or bypassing audit trails. We will never compromise on these principles, regardless of competitive pressure, customer request, or business incentive.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {NON_NEGOTIABLES.map((item) => (
              <div
                key={item.title}
                className="relative rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8"
              >
                <div className="absolute top-0 left-8 w-px h-6 bg-emerald-500/40" />
                <h3 className="text-lg font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEI */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Diversity, Equity & Inclusion
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We believe that diverse teams build better systems. Our agent architecture itself proves this principle: eight specialized agents, each with a distinct perspective and capability, produce far better outcomes than any single generalist ever could. The same is true for human teams. Homogeneous teams, like single-agent systems, have blind spots that no amount of individual brilliance can overcome.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We actively recruit across geographies, backgrounds, and disciplines because the hardest problems in AI-powered lead generation require perspectives that no single demographic can provide. We build fairness checks into our qualification agent specifically because we understand that unchecked algorithms can encode bias — and we hold ourselves to the same standard we impose on our technology.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our commitment to DEI is not performative. It is structural. It is embedded in our hiring processes, our agent design principles, our data handling policies, and our product roadmap. We measure our progress not by statements but by outcomes — the diversity of our team, the equity of our systems, and the inclusivity of our product.
              </p>
            </div>
            <div className="space-y-6">
              <div className="rounded-2xl border border-border/50 bg-card/50 p-8">
                <h3 className="text-lg font-semibold text-foreground mb-6">Team Composition Goals</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Underrepresented groups in leadership', value: '40%', desc: 'Target representation in senior and director-level roles' },
                    { label: 'Global team distribution', value: '15+', desc: 'Countries represented across our fully remote team' },
                    { label: 'Women and non-binary in engineering', value: '35%', desc: 'Above industry average and actively improving' },
                    { label: 'Pay equity audit frequency', value: 'Biannual', desc: 'Regular compensation audits to ensure equitable pay' },
                  ].map((metric) => (
                    <div key={metric.label} className="flex items-start gap-4">
                      <span className="text-2xl font-bold text-emerald-400 shrink-0">{metric.value}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{metric.label}</p>
                        <p className="text-xs text-muted-foreground">{metric.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wellness & Growth */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How We Sustain Great Work
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Sustainable performance requires intentional investment in rest, growth, and community. We do not glorify burnout — we engineer against it, just as we engineer resilience into our agents.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Coffee,
                title: 'Flexible Rest',
                description:
                  'Unlimited PTO with a 15-day minimum. We track not how many days you take off but whether you are actually resting. Managers are accountable for team rest metrics.',
              },
              {
                icon: Brain,
                title: 'Learning Budget',
                description:
                  '$5,000 annual learning stipend for conferences, courses, books, or anything that grows your expertise. We invest in your growth because your growth is our competitive advantage.',
              },
              {
                icon: Globe,
                title: 'Global Remote',
                description:
                  'Work from anywhere in your timezone. Our async-first culture means you are never forced into inconvenient meeting times. Home office stipend included.',
              },
              {
                icon: Heart,
                title: 'Mental Health',
                description:
                  'Comprehensive mental health coverage, quarterly wellness days, and a culture that treats burnout as a systemic failure — not a personal weakness. We run blameless post-mortems on burnout the same way we do on system outages.',
              },
            ].map((program) => (
              <div
                key={program.title}
                className="group rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-border transition-all duration-300"
              >
                <div className="inline-flex rounded-xl bg-emerald-500/10 p-3 mb-4">
                  <program.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{program.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 border-t border-border/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            See Our Culture in Action
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our culture is not just words — it is embedded in every agent we build and every decision our system makes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/agentic-framework"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Explore Our Agentic Framework
            </a>
            <a
              href="/careers"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
            >
              View Open Positions
            </a>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
