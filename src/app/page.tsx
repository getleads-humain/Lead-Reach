'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Search,
  Database,
  Globe,
  Target,
  Mail,
  GitBranch,
  BarChart3,
  Brain,
  ArrowRight,
  Play,
  Check,
  Star,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  Layers,
  Network,
  ChevronRight,
} from 'lucide-react';

const TRUSTED_COMPANIES = [
  'TechCorp', 'FinEdge', 'DataVault', 'ScaleUp', 'NexusAI',
  'CloudPeak', 'GrowthLabs', 'SalesForge',
];

const FEATURES = [
  {
    icon: Search,
    title: 'Multi-Channel Research',
    description: 'AI agents research leads across 17+ channels including LinkedIn, Twitter, GitHub, Reddit, YouTube, and the open web simultaneously.',
    color: '#10B981',
  },
  {
    icon: Database,
    title: 'Data Enrichment',
    description: 'Automatically enrich lead profiles with firmographics, contact details, social presence, and technographic data from multiple sources.',
    color: '#3B82F6',
  },
  {
    icon: Target,
    title: 'Lead Scoring',
    description: 'Intelligent scoring engine evaluates leads against your ideal customer profile, prioritizing high-conversion opportunities.',
    color: '#F59E0B',
  },
  {
    icon: Mail,
    title: 'AI Outreach',
    description: 'Craft hyper-personalized outreach messages and multi-step sequences that adapt based on engagement signals and responses.',
    color: '#EC4899',
  },
  {
    icon: GitBranch,
    title: 'Pipeline Management',
    description: 'Automated pipeline tracking with intelligent stage transitions, follow-up scheduling, and nurture campaign orchestration.',
    color: '#6366F1',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    description: 'Real-time dashboards and AI-generated reports with actionable insights on campaign performance, agent efficiency, and ROI.',
    color: '#EF4444',
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    description: 'Perfect for solo founders and small teams getting started with AI lead generation.',
    features: [
      '2 AI Agents',
      '500 leads/month',
      '3 channels',
      'Basic enrichment',
      'Email outreach',
      'Standard reports',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$149',
    period: '/mo',
    description: 'For growing sales teams that need the full power of autonomous lead generation.',
    features: [
      '8 AI Agents (full workforce)',
      '5,000 leads/month',
      '17+ channels',
      'Advanced enrichment',
      'Multi-channel outreach',
      'Custom scoring models',
      'Priority support',
      'API access',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations with custom requirements and high-volume needs.',
    features: [
      'Unlimited AI Agents',
      'Unlimited leads',
      'All channels + custom',
      'Custom integrations',
      'Dedicated CSM',
      'SLA guarantee',
      'On-premise option',
      'Custom training',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    quote: "LeadReach AI transformed our outbound pipeline. We went from manually sourcing 50 leads a week to having 500 qualified leads delivered automatically. The AI agents are like having an entire SDR team that never sleeps.",
    name: 'Sarah Chen',
    title: 'VP of Sales, TechCorp',
    avatar: 'SC',
  },
  {
    quote: "The multi-channel research capability is incredible. Our agents found prospects on LinkedIn, GitHub, and industry forums that we never would have discovered. Our close rate increased by 3x in just two months.",
    name: 'Marcus Rodriguez',
    title: 'Head of Growth, ScaleUp',
    avatar: 'MR',
  },
  {
    quote: "What used to take our team 20 hours a week now happens autonomously. The Orchestrator agent coordinates everything perfectly, and the personalized outreach messages feel genuinely human. This is the future of B2B sales.",
    name: 'Aisha Patel',
    title: 'CEO, NexusAI',
    avatar: 'AP',
  },
];

const AGENT_PREVIEW = [
  { icon: Brain, name: 'Orchestrator', desc: 'Coordinates all agents', color: '#8B5CF6' },
  { icon: Search, name: 'Prospect Discovery', desc: 'Finds leads across 17+ channels', color: '#10B981' },
  { icon: Database, name: 'Data Enrichment', desc: 'Enriches with firmographics & contacts', color: '#3B82F6' },
  { icon: Globe, name: 'Web Research', desc: 'Deep research on companies & markets', color: '#06B6D4' },
  { icon: Target, name: 'Lead Qualification', desc: 'Scores & qualifies by ICP criteria', color: '#F59E0B' },
  { icon: Mail, name: 'Outreach Composer', desc: 'Crafts personalized messages', color: '#EC4899' },
  { icon: GitBranch, name: 'Pipeline Manager', desc: 'Manages stages & follow-ups', color: '#6366F1' },
  { icon: BarChart3, name: 'Report Generator', desc: 'Generates analytics & insights', color: '#EF4444' },
];

export default function LandingPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 lg:pt-32 lg:pb-36">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
              <Sparkles className="h-3 w-3 mr-1" />
              Agentic Lead Generation Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground leading-tight tracking-tight">
              Autonomous AI Agents That{' '}
              <span className="text-gradient">Generate Leads</span>{' '}
              While You Sleep
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Deploy 8 specialized AI agents that discover, enrich, qualify, and engage leads across 17+ channels — all on autopilot. Turn your sales pipeline into an autonomous machine.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50 text-base px-8 h-12">
                <Play className="mr-2 h-4 w-4" />
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">17+</div>
                <div className="text-xs text-muted-foreground mt-1">Channels</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">8</div>
                <div className="text-xs text-muted-foreground mt-1">AI Agents</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">10x</div>
                <div className="text-xs text-muted-foreground mt-1">Faster Outreach</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="border-y border-border/20 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest mb-8">
            Trusted by forward-thinking teams
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {TRUSTED_COMPANIES.map((company) => (
              <span key={company} className="text-sm font-semibold text-muted-foreground/50 tracking-wider uppercase">
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              How It Works
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Three steps to <span className="text-gradient">autonomous lead generation</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Set up once, let AI agents handle the rest. Your pipeline runs 24/7.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                step: '01',
                icon: Target,
                title: 'Define Your ICP',
                description: 'Tell us your ideal customer profile — industry, company size, location, tech stack, and buying signals. Our agents use this as their North Star.',
                color: '#10B981',
              },
              {
                step: '02',
                icon: Brain,
                title: 'AI Agents Research & Enrich',
                description: '8 specialized agents collaborate to discover prospects across 17+ channels, enrich their profiles with real-time data, and score them against your criteria.',
                color: '#8B5CF6',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Qualified Leads Delivered',
                description: 'Hot leads arrive in your pipeline with personalized outreach already composed. You review, approve, and watch meetings book themselves.',
                color: '#F59E0B',
              },
            ].map((item, i) => (
              <div key={i} className="relative group">
                <Card className="card-premium border-border/30 bg-card/50 h-full">
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl font-bold text-muted-foreground/20">{item.step}</div>
                      <div
                        className="rounded-lg p-2.5"
                        style={{ backgroundColor: `${item.color}12`, color: item.color }}
                      >
                        <item.icon className="h-6 w-6" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
                {i < 2 && (
                  <div className="hidden md:flex absolute -right-6 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 lg:py-28 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              Features
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need for <span className="text-gradient">intelligent lead generation</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              A complete platform powered by AI agents that work together autonomously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <Card key={i} className="card-premium border-border/30 bg-card/50 group">
                <CardContent className="p-6">
                  <div
                    className="rounded-lg p-2.5 inline-flex mb-4"
                    style={{ backgroundColor: `${feature.color}12`, color: feature.color }}
                  >
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Showcase Section */}
      <section className="py-20 lg:py-28 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              AI Workforce
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Meet your <span className="text-gradient">AI workforce</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              8 specialized agents that collaborate autonomously to deliver qualified leads.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-6">
            {AGENT_PREVIEW.map((agent) => (
              <Card key={agent.name} className="card-premium border-border/30 bg-card/50 text-center group">
                <CardContent className="p-4 lg:p-6">
                  <div
                    className="rounded-xl p-3 inline-flex mx-auto mb-3"
                    style={{ backgroundColor: `${agent.color}12`, color: agent.color }}
                  >
                    <agent.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/agent">
              <Button variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200">
                Explore All Agents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-28 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Simple, transparent <span className="text-gradient">pricing</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start free, scale as you grow. No hidden fees, no long-term contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, i) => (
              <Card
                key={i}
                className={`card-premium border-border/30 bg-card/50 relative ${
                  tier.highlighted ? 'border-emerald-500/30 ring-1 ring-emerald-500/20' : ''
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-black border-0 font-semibold">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6 lg:p-8">
                  <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{tier.description}</p>

                  <ul className="mt-6 space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href="/app" className="block mt-8">
                    <Button
                      className={`w-full font-semibold transition-all duration-200 ${
                        tier.highlighted
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black glow-emerald-sm'
                          : 'bg-secondary hover:bg-secondary/80 text-foreground'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-28 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              Testimonials
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Loved by <span className="text-gradient">sales teams</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Hear from teams that transformed their lead generation with LeadReach AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <Card key={i} className="card-premium border-border/30 bg-card/50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-400">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 lg:py-28 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-10 lg:p-16 text-center overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
                Ready to Transform Your{' '}
                <span className="text-gradient">Lead Generation?</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
                Join hundreds of sales teams using autonomous AI agents to fill their pipeline with qualified leads on autopilot.
              </p>
              <div className="mt-8">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-10 h-12">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
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
