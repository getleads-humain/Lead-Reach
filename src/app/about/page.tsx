'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Building2, Target, Users, Lightbulb, Globe, Cpu, ArrowRightLeft, Sparkles } from 'lucide-react';

const VALUES = [
  {
    icon: Target,
    title: 'Mission-Driven',
    description: 'Every feature we build, every agent we deploy, serves one purpose: helping businesses find and connect with their ideal customers more efficiently and ethically than ever before.',
  },
  {
    icon: Users,
    title: 'Human-Centered AI',
    description: 'We believe AI should amplify human capabilities, not replace human judgment. Our agents handle the tedious work so that sales professionals can focus on building genuine relationships.',
  },
  {
    icon: Lightbulb,
    title: 'Relentless Innovation',
    description: 'The landscape of B2B sales evolves rapidly. We push the boundaries of what autonomous AI agents can achieve, continuously improving our multi-agent architecture and expanding research channels.',
  },
  {
    icon: Globe,
    title: 'Global Perspective',
    description: 'Lead generation knows no borders. Our platform researches across 17+ channels spanning Western and Eastern internet ecosystems, giving our customers a truly global reach for their prospecting needs.',
  },
];

const MILESTONES = [
  { year: '2024', title: 'Foundation', description: 'LeadReach AI was founded with the vision of creating fully autonomous AI agents for B2B lead generation, moving beyond simple automation to true agentic workflows.' },
  { year: '2024', title: 'Multi-Agent Architecture', description: 'Developed and deployed our 8-agent system: Orchestrator, Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, and Report Generator.' },
  { year: '2025', title: '17+ Research Channels', description: 'Expanded our research capabilities to cover the full spectrum of online channels, from LinkedIn and GitHub to WeChat Articles and Weibo, enabling truly global prospect discovery.' },
  { year: '2025', title: 'Enterprise Launch', description: 'Launched enterprise-grade features including custom agent configurations, advanced compliance controls, dedicated infrastructure, and priority support for large-scale operations.' },
  { year: '2026', title: 'Agent-Reach Protocol', description: 'Introduced the Agent-Reach open protocol for standardized agent communication and coordination, paving the way for interoperable AI agent ecosystems across the sales technology stack.' },
];

const TEAM_HIGHLIGHTS = [
  { icon: Cpu, label: 'AI Researchers', value: '12+' },
  { icon: ArrowRightLeft, label: 'Sales Engineers', value: '8+' },
  { icon: Globe, label: 'Countries', value: '6' },
  { icon: Sparkles, label: 'AI Agents', value: '8' },
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Building2 className="h-3 w-3 mr-1" />
              About Us
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Building the Future of <span className="text-gradient">Autonomous Lead Generation</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              LeadReach AI is on a mission to transform B2B sales by deploying intelligent AI agents that discover, enrich, qualify, and engage leads autonomously — so your team can focus on closing deals.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative max-w-3xl mx-auto text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We believe that the future of B2B sales lies in the collaboration between human professionals and autonomous AI agents. Salespeople should spend their time building relationships and closing deals — not manually scouring databases, copy-pasting profiles, and sending generic outreach messages. Our multi-agent system handles the entire prospecting pipeline, from initial discovery through qualification and personalized engagement, operating around the clock so that your human talent can focus on what humans do best: connecting, persuading, and creating value.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our <span className="text-gradient">Values</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              The principles that guide every decision we make, from product development to customer support.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 hover:border-emerald-500/20 transition-colors"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 w-fit mb-4">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Highlights */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Team by the <span className="text-gradient">Numbers</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              A distributed team of AI researchers, sales engineers, and product builders spanning six countries and united by a shared passion for intelligent automation.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TEAM_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-xl border border-border/30 bg-card/50 p-6 text-center hover:border-emerald-500/20 transition-colors"
                >
                  <Icon className="h-6 w-6 text-emerald-400 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-foreground mb-1">{item.value}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Our <span className="text-gradient">Journey</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              From founding to the Agent-Reach protocol, every milestone reflects our commitment to pushing the boundaries of autonomous AI in B2B sales.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-8">
            {MILESTONES.map((milestone, i) => (
              <div key={i} className="relative flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1">
                    <span className="text-xs font-semibold text-emerald-400">{milestone.year}</span>
                  </div>
                  {i < MILESTONES.length - 1 && (
                    <div className="w-px flex-1 bg-border/30 mt-2" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{milestone.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Join Us on This <span className="text-gradient">Journey</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Whether you are looking to transform your sales pipeline or join our team, we would love to hear from you.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Get Started Free
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
