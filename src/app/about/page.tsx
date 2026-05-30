'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Building2,
  Target,
  Users,
  Globe,
  Sparkles,
  Heart,
  Lightbulb,
  Shield,
  Zap,
  TrendingUp,
  Rocket,
} from 'lucide-react';

const VALUES = [
  {
    icon: Target,
    title: 'Customer Obsession',
    description: 'Every decision we make starts and ends with our customers. We measure our success by the pipeline velocity, conversion rates, and revenue our platform generates for our users. When our customers grow, we grow.',
  },
  {
    icon: Lightbulb,
    title: 'Bold Innovation',
    description: 'We push the boundaries of what AI agents can accomplish in B2B sales. Our multi-agent architecture was a radical idea that is now the industry standard. We invest heavily in R&D and are not afraid to challenge conventional approaches to lead generation.',
  },
  {
    icon: Shield,
    title: 'Trust & Transparency',
    description: 'We believe trust is earned through transparency. Our pricing is straightforward, our data practices are clear, and our AI agents operate within well-defined guardrails. We never use customer data to train models without explicit consent.',
  },
  {
    icon: Heart,
    title: 'Impact Over Output',
    description: 'We optimize for business outcomes, not vanity metrics. A thousand discovered leads mean nothing if none convert. Our platform is designed to deliver qualified, engaged prospects that translate into real revenue for our customers.',
  },
  {
    icon: Users,
    title: 'Collaborative Excellence',
    description: 'Just as our AI agents collaborate to deliver superior results, our team operates with a culture of deep collaboration. We believe the best solutions emerge when diverse perspectives come together with a shared commitment to excellence.',
  },
  {
    icon: TrendingUp,
    title: 'Relentless Improvement',
    description: 'We are never done learning and iterating. Our agents continuously improve through feedback loops, and so do we. Every sprint, every release, and every customer conversation is an opportunity to make LeadReach AI better.',
  },
];

const MILESTONES = [
  {
    year: '2023',
    title: 'Foundation',
    description: 'LeadReach AI was founded with a bold vision: replace manual prospecting with autonomous AI agents. Our founding team of AI researchers and B2B sales veterans began building the multi-agent orchestration engine that would become the core of our platform.',
  },
  {
    year: '2024',
    title: 'Agent-Reach Launch',
    description: 'We launched Agent-Reach, our multi-channel research capability giving AI agents access to 17+ internet channels. This breakthrough enabled agents to research leads across the open web, professional networks, social platforms, and public databases simultaneously.',
  },
  {
    year: '2025',
    title: 'Enterprise Scale',
    description: 'LeadReach AI scaled to serve hundreds of enterprise customers, processing millions of lead research operations daily. We introduced the ICP Builder, pipeline management, CRM integrations, and our REST API for programmatic access.',
  },
  {
    year: '2026',
    title: 'AI Setter Revolution',
    description: 'We expanded into B2C appointment setting with AI Setter agents that qualify and book meetings autonomously. Our dual-track platform now serves both B2B lead generation and B2C appointment setting workflows, delivering 30-40% conversion rates that outperform human setters.',
  },
];

const LEADERSHIP = [
  {
    name: 'Marcus Chen',
    role: 'CEO & Co-Founder',
    bio: 'Former VP of Sales at a Fortune 500 SaaS company. Marcus spent 15 years building and scaling B2B sales teams before founding LeadReach AI to solve the prospecting bottleneck he experienced firsthand.',
  },
  {
    name: 'Dr. Sarah Patel',
    role: 'CTO & Co-Founder',
    bio: 'PhD in Multi-Agent Systems from MIT. Sarah previously led the Applied AI team at a major tech company, where she developed production-grade autonomous agent architectures that processed billions of daily transactions.',
  },
  {
    name: 'James Okonkwo',
    role: 'VP of Product',
    bio: '10+ years in product leadership at high-growth SaaS companies. James has launched products used by over 100,000 businesses and brings deep expertise in building intuitive tools for sales professionals.',
  },
  {
    name: 'Elena Vasquez',
    role: 'VP of Engineering',
    bio: 'Former Staff Engineer at a leading cloud infrastructure company. Elena brings deep expertise in building scalable, reliable distributed systems and leads the engineering team responsible for our 99.9% uptime guarantee.',
  },
  {
    name: 'David Kim',
    role: 'VP of Customer Success',
    bio: 'Previously built and led customer success organizations at two B2B SaaS unicorns. David is passionate about ensuring every LeadReach AI customer achieves measurable ROI from their first campaign.',
  },
  {
    name: 'Aisha Rahman',
    role: 'Head of AI Research',
    bio: 'Published researcher in LLM orchestration and autonomous agent planning. Aisha leads our AI research team, developing next-generation agent capabilities that keep LeadReach AI at the frontier of agentic AI.',
  },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Building2 className="h-3 w-3 mr-1" />
              About Us
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              We Are Building the Future of <span className="text-gradient">Autonomous Sales</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              LeadReach AI is on a mission to transform how businesses discover and engage their ideal customers. We believe that autonomous AI agents, not manual processes, are the future of B2B sales and lead generation.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                Our <span className="text-gradient">Mission</span>
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The traditional B2B sales process is fundamentally broken. Sales professionals spend up to 65% of their time on non-revenue-generating activities like researching prospects, manually enriching data, and crafting repetitive outreach messages. This inefficiency costs businesses billions of dollars annually in lost productivity and missed opportunities.
                </p>
                <p>
                  LeadReach AI exists to change this. Our mission is to free sales teams from the drudgery of manual prospecting by deploying autonomous AI agents that handle the entire lead generation lifecycle. From discovering potential customers across dozens of channels to enriching their profiles with actionable intelligence, qualifying them against your ideal criteria, and crafting personalized outreach that converts, our AI workforce operates around the clock so your human team can focus on what they do best: closing deals and building relationships.
                </p>
                <p>
                  We envision a future where every sales professional has an AI workforce at their command, where pipeline generation is no longer a bottleneck but a competitive advantage, and where the gap between identifying an opportunity and acting on it is measured in minutes, not days. That future is already here, and we are building it.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">8</div>
                <p className="mt-1 text-xs text-muted-foreground">Specialized AI Agents</p>
              </Card>
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">17+</div>
                <p className="mt-1 text-xs text-muted-foreground">Research Channels</p>
              </Card>
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">$0</div>
                <p className="mt-1 text-xs text-muted-foreground">Free Tier (Launchpad)</p>
              </Card>
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">$2,497</div>
                <p className="mt-1 text-xs text-muted-foreground">Lifetime Deal</p>
              </Card>
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">30-40%</div>
                <p className="mt-1 text-xs text-muted-foreground">AI Setter Conversion</p>
              </Card>
              <Card className="card-premium border-border/30 bg-card/50 p-5 text-center">
                <div className="text-2xl font-bold text-gradient">5-10x</div>
                <p className="mt-1 text-xs text-muted-foreground">Pipeline Increase</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              These principles guide every decision we make, from product development to customer support to how we build our team.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="card-premium border-border/30 bg-card/50 p-6">
                  <div className="rounded-xl bg-emerald-500/10 p-3 w-fit mb-4">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">{value.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our <span className="text-gradient">Journey</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              From a bold idea to an industry-leading platform, here are the key milestones that have shaped LeadReach AI.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-px bg-border/30" />
              <div className="space-y-10">
                {MILESTONES.map((milestone, i) => (
                  <div key={milestone.year} className="relative pl-16">
                    <div className="absolute left-3.5 top-1 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 w-5 h-5 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div className="text-xs font-bold text-emerald-400 mb-1">{milestone.year}</div>
                    <h3 className="text-lg font-bold text-foreground">{milestone.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Leadership <span className="text-gradient">Team</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              A team of AI researchers, sales veterans, and product builders united by a shared vision of autonomous sales intelligence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LEADERSHIP.map((person) => (
              <Card key={person.name} className="card-premium border-border/30 bg-card/50 p-6">
                <div className="rounded-full bg-emerald-500/10 w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-sm font-bold text-emerald-400">{person.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">{person.name}</h3>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">{person.role}</p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{person.bio}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Global & Culture */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                <Globe className="h-7 w-7 text-emerald-400 inline mr-2" />
                Global <span className="text-gradient">Presence</span>
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  LeadReach AI is headquartered in San Francisco, California, with distributed team members across North America, Europe, and Asia. Our global footprint ensures that our AI agents can research leads effectively across every major market, understanding regional nuances, language preferences, and business culture.
                </p>
                <p>
                  Our infrastructure is deployed across multiple cloud regions, providing low-latency access and data residency options for customers with geographic compliance requirements. Whether your target market is in New York, London, Singapore, or Sao Paulo, our agents are optimized for local research effectiveness.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-foreground font-medium text-sm">San Francisco, CA</span>
                    <span className="text-xs text-muted-foreground">Headquarters</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-foreground font-medium text-sm">New York, NY</span>
                    <span className="text-xs text-muted-foreground">Sales & Customer Success</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-foreground font-medium text-sm">London, UK</span>
                    <span className="text-xs text-muted-foreground">EMEA Operations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400/60" />
                    <span className="text-foreground font-medium text-sm">Singapore</span>
                    <span className="text-xs text-muted-foreground">APAC Operations</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">
                <Sparkles className="h-7 w-7 text-emerald-400 inline mr-2" />
                Our <span className="text-gradient">Culture</span>
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  We are a team of builders, researchers, and problem-solvers who believe the best work happens at the intersection of ambition and empathy. Our culture is defined by intellectual curiosity, a bias toward action, and a genuine commitment to our customers&apos; success.
                </p>
                <p>
                  We operate as a remote-first company with flexible work arrangements, understanding that great talent exists everywhere. Our team communicates asynchronously by default, reserving synchronous meetings for strategic discussions and collaborative problem-solving. We invest in continuous learning, with dedicated time for research, experimentation, and professional development.
                </p>
                <p>
                  Diversity of thought and background is not just a value we espouse but a competitive advantage we cultivate. The best AI products are built by teams that reflect the diversity of the customers they serve, and we are committed to building a team where every voice is heard and every perspective is valued.
                </p>
              </div>
              <Link href="/careers">
                <Button className="mt-6 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                  <Rocket className="mr-2 h-4 w-4" />
                  Join Our Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Join the <span className="text-gradient">Revolution</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Whether you want to transform your sales pipeline or join our team of innovators, we would love to hear from you.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/careers">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    View Open Positions
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
