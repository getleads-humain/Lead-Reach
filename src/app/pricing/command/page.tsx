'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Target,
  Users,
  BarChart3,
  ChevronRight,
  Globe,
  Mail,
  TrendingUp,
  Shield,
  Brain,
  Layers,
  Network,
  Activity,
  Cpu,
  Database,
  Link2,
  SplitSquareHorizontal,
} from 'lucide-react';

export default function CommandPlanPage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Plans
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Brain className="h-3 w-3 mr-1" />
            Most Popular
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Command <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            The complete AI-powered outbound machine for growing teams. Command deploys all 8 AI agents across 17+ research channels, delivering 10,000+ enriched leads per month with multi-step outreach, pipeline management, and competitive intelligence built in.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-foreground">$399</span>
            <span className="text-lg text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-emerald-400 mb-8">Or $3,990/year (save 17% — just $332/mo)</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                Start 14-Day Free Trial
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No credit card required for trial</p>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Command</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Layers className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Scaling Sales Teams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Teams of 3 to 10 reps who need a systematic outbound engine that generates, enriches, and engages leads at scale. Command&apos;s 8 AI agents work as a coordinated unit — discovering prospects, enriching data, scoring fit, composing outreach, managing pipeline, and delivering competitive insights — all running autonomously while your team focuses on closing.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Network className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Growth-Stage B2B Companies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Companies that have found product-market fit and need to accelerate pipeline generation. Command provides the volume (10,000+ leads/month), depth (firmographic and technographic enrichment), and automation (multi-step outreach sequences) required to fill and manage a high-velocity sales pipeline without proportionally growing headcount.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Revenue-Focused Organizations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Any organization that measures success by pipeline velocity and revenue generated. Command&apos;s competitive intelligence, A/B testing, pipeline management, and CRM integrations give you the data and automation to run outbound as a measurable, optimizable revenue channel rather than a cost center.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* The 8 AI Agents */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Meet your <span className="text-gradient">8 AI Agents</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Orchestrator', desc: 'Coordinates all agents, assigns tasks, manages workflow priorities, and ensures leads flow through every pipeline stage without bottlenecks.' },
              { name: 'Prospect Discovery', desc: 'Searches 17+ channels simultaneously to find companies and decision-makers matching your ICP using semantic and intent-based search.' },
              { name: 'Data Enrichment', desc: 'Deep-enriches every lead with firmographics, technographics, funding data, org charts, and verified contact information in real time.' },
              { name: 'Web Research', desc: 'Performs deep-dive web research on target companies — analyzing news, press releases, job postings, and growth signals for outreach personalization.' },
              { name: 'Lead Qualification', desc: 'Applies multi-dimensional scoring across firmographic fit, intent signals, reachability, and strategic value to rank leads by conversion probability.' },
              { name: 'Outreach Composer', desc: 'Generates hyper-personalized outreach messages using enriched data, company context, and proven copywriting frameworks tailored to each prospect.' },
              { name: 'Pipeline Manager', desc: 'Tracks every lead through your pipeline stages, automates follow-up sequences, and alerts your team when human intervention is needed.' },
              { name: 'Report Generator', desc: 'Creates real-time performance dashboards, campaign analytics, and ROI reports so you can continuously optimize your outbound strategy.' },
            ].map((agent, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-md bg-emerald-500/10 p-1.5">
                      <Cpu className="h-4 w-4 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Command</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
                title: '10,000+ Leads Per Month',
                desc: 'Command delivers an enterprise-grade volume of AI-discovered, enriched, and scored leads. With 10,000+ leads per month flowing through your pipeline, your team has a constant supply of qualified prospects to engage. The AI ensures every lead meets your ICP criteria before it enters your pipeline, so volume never comes at the expense of quality.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: 'All 17+ Research Channels',
                desc: 'Access every data source LeadReach supports: web search, LinkedIn, Exa semantic search, GitHub, Reddit, Twitter, YouTube, Crunchbase, job boards, patent databases, government registries, industry directories, and more. Multi-channel discovery ensures you find prospects your competitors miss and capture intent signals across the entire digital landscape.',
              },
              {
                icon: <Target className="h-5 w-5 text-emerald-400" />,
                title: 'Advanced ICP & Multi-Dimensional Scoring',
                desc: 'Go beyond basic firmographic matching. Command uses a multi-dimensional scoring model that evaluates firmographic fit, technographic alignment, intent signals, reachability, strategic value, and data completeness simultaneously. Each lead receives a composite score with breakdowns across every dimension, giving you unprecedented clarity on which prospects to prioritize.',
              },
              {
                icon: <Database className="h-5 w-5 text-emerald-400" />,
                title: 'Deep Enrichment (Firmographics & Technographics)',
                desc: 'Every lead is enriched with comprehensive firmographic data (revenue, employee count, industry, location, funding) and technographic data (technology stack, infrastructure, tools used, digital maturity score). This deep enrichment powers hyper-personalized outreach that demonstrates genuine understanding of each prospect\'s business and challenges.',
              },
              {
                icon: <Mail className="h-5 w-5 text-emerald-400" />,
                title: 'Multi-Step Outreach (Email + LinkedIn)',
                desc: 'Execute sophisticated multi-channel outreach sequences across email and LinkedIn. Create automated sequences with personalized touchpoints, follow-ups, and break-up emails. The AI composes messages using enriched data, company context, and proven frameworks. Track engagement at every step and automatically adjust timing based on prospect behavior.',
              },
              {
                icon: <Layers className="h-5 w-5 text-emerald-400" />,
                title: 'Pipeline Management',
                desc: 'Visualize and manage your entire sales pipeline from first touch to closed-won. LeadReach tracks every interaction, automates stage transitions, and provides a clear view of pipeline health. Set up automated triggers for follow-ups, nurture sequences, and team notifications so no opportunity falls through the cracks.',
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
                title: 'Competitive Intelligence',
                desc: 'Stay ahead of the competition with AI-powered competitive monitoring. Track competitor mentions, pricing changes, product launches, hiring patterns, and market positioning. Use these insights to craft outreach that positions your solution against competitors and identifies prospects experiencing pain points with their current providers.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: '5 User Seats + GHL & CRM Integrations',
                desc: 'Command supports a team of 5 with full platform access. Native integrations with GoHighLevel and popular CRMs (HubSpot, Salesforce, Pipedrive) ensure your lead data flows seamlessly into your existing sales stack. No manual data entry, no sync delays — just a fully connected outbound operation.',
              },
              {
                icon: <SplitSquareHorizontal className="h-5 w-5 text-emerald-400" />,
                title: 'A/B Testing',
                desc: 'Optimize your outreach with built-in A/B testing. Test subject lines, message copy, send times, and channel combinations across your campaigns. The system automatically distributes traffic, tracks conversion rates, and identifies winning variants so you can continuously improve your response rates over time.',
              },
              {
                icon: <Shield className="h-5 w-5 text-emerald-400" />,
                title: 'Priority Support',
                desc: 'Command customers receive priority support with a guaranteed 4-hour response time during business hours. Our customer success team provides onboarding assistance, campaign strategy reviews, and ongoing optimization recommendations to ensure you get maximum value from the platform.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upgrade Path */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Want it <span className="text-gradient">forever?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-amber-500/20 bg-card/80 overflow-hidden">
              <CardContent className="p-6">
                <Badge className="mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20 border text-xs">Lifetime Deal</Badge>
                <h3 className="text-lg font-bold text-foreground mb-2">Founders&apos; Pass</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Get everything in Command — forever — with a single one-time payment. The Founders&apos; Pass is a limited-time lifetime deal that includes all 8 AI agents, 15,000 leads per month, API access, and priority support in perpetuity. No recurring fees, no renewal anxiety.
                </p>
                <Link href="/pricing/founders-pass">
                  <Button variant="outline" className="gap-1 border-amber-500/20 text-amber-400 hover:bg-amber-500/5">
                    Learn about Founders&apos; Pass
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80 overflow-hidden">
              <CardContent className="p-6">
                <Badge className="mb-3 bg-secondary/50 text-muted-foreground border text-xs">Custom</Badge>
                <h3 className="text-lg font-bold text-foreground mb-2">Enterprise</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Need unlimited scale, custom AI training, white-label capabilities, or dedicated support? Enterprise provides unlimited agents, leads, seats, and channels with a dedicated Customer Success Manager, SLA guarantees, and custom integrations tailored to your stack.
                </p>
                <Link href="/pricing/enterprise">
                  <Button variant="outline" className="gap-1 border-border/30 hover:bg-secondary/50">
                    Learn about Enterprise
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'How do the 8 AI agents work together?',
                a: 'The 8 agents operate as a coordinated AI workforce under the Orchestrator. When you create a campaign, the Orchestrator assigns tasks: Prospect Discovery finds leads, Data Enrichment enriches them, Web Research gathers context, Lead Qualification scores them, Outreach Composer drafts messages, Pipeline Manager tracks engagement, and Report Generator delivers analytics. Each agent specializes in one task but shares data in real time, creating a seamless autonomous outbound system.',
              },
              {
                q: 'What makes Command different from Scout?',
                a: 'Command adds 5 more AI agents (Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, Report Generator), expands to all 17+ channels (vs. 5 in Scout), delivers 10,000+ leads (vs. 1,000), includes deep enrichment with technographics, adds LinkedIn outreach, pipeline management, competitive intelligence, A/B testing, 5 user seats, and CRM integrations. It is the difference between a solo tool and a complete outbound machine.',
              },
              {
                q: 'Can Command replace my SDR team?',
                a: 'Command automates the top-of-funnel work that typically occupies 60 to 80 percent of an SDR&apos;s time — prospecting, enriching, scoring, and initial outreach. Many teams use Command to multiply their existing SDRs&apos; effectiveness rather than replace them, while smaller teams use it as a full SDR replacement. The AI handles the repetitive work so humans can focus on relationship building and closing.',
              },
              {
                q: 'Which CRMs does Command integrate with?',
                a: 'Command includes native integrations with GoHighLevel (GHL), HubSpot, Salesforce, and Pipedrive. Data flows bidirectionally — leads discovered in LeadReach automatically sync to your CRM, and CRM updates reflect back in LeadReach. Custom integrations via API are available on the Enterprise plan for any other CRM or tool.',
              },
              {
                q: 'How does competitive intelligence work?',
                a: 'LeadReach continuously monitors your specified competitors across web search, social media, job boards, and review sites. The AI detects competitor mentions, product changes, pricing updates, customer complaints, and hiring patterns. These signals are surfaced as actionable insights that you can use to craft competitive positioning in your outreach or identify prospects who may be dissatisfied with a competitor.',
              },
              {
                q: 'Is there a limit on outreach sequences?',
                a: 'Command supports unlimited outreach sequences with unlimited steps per sequence. You can create as many sequences as needed for different ICPs, products, or market segments. Each sequence can include email and LinkedIn touchpoints with customizable delays, conditional logic, and automated follow-up triggers based on prospect engagement.',
              },
            ].map((faq, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Command your <span className="text-gradient">outbound engine</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Start your 14-day free trial today. Full access. No credit card required.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
