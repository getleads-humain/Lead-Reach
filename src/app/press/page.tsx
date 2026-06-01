'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  ArrowRight,
  Newspaper,
  Download,
  ExternalLink,
  Calendar,
  Zap,
  FileText,
  Image,
  Palette,
  Globe,
  Mail,
} from 'lucide-react';

const PRESS_MENTIONS = [
  {
    outlet: 'TechCrunch',
    title: 'LeadReach AI Launches Multi-Agent Architecture for Autonomous B2B Lead Generation',
    date: 'February 2026',
    excerpt: 'The startup\'s approach of deploying eight specialized AI agents that collaborate to discover, enrich, qualify, and engage leads represents a paradigm shift in how businesses approach prospecting.',
    href: '#',
  },
  {
    outlet: 'VentureBeat',
    title: 'AI Setter Agents Achieve 30-40% Conversion Rates, Outperforming Human SDRs',
    date: 'January 2026',
    excerpt: 'LeadReach AI\'s autonomous appointment-setting agents are converting leads at twice the rate of traditional human setters, according to data from over 10,000 campaigns.',
    href: '#',
  },
  {
    outlet: 'Forbes',
    title: 'The Rise of Agentic AI in Enterprise Sales: A New Category Emerges',
    date: 'December 2025',
    excerpt: 'A new class of AI-powered platforms is replacing traditional sales tools with autonomous agents. LeadReach AI is at the forefront of this transformation, offering a glimpse into the future of B2B sales.',
    href: '#',
  },
  {
    outlet: 'Business Insider',
    title: 'How LeadReach AI Is Using Agent-Reach to Research Leads Across 17+ Channels',
    date: 'October 2025',
    excerpt: 'The platform\'s multi-channel research capability gives its AI agents unprecedented access to prospect data across the open web, professional networks, and social platforms.',
    href: '#',
  },
  {
    outlet: 'SaaStr',
    title: 'From $97/mo to Enterprise: How LeadReach AI Is Democratizing AI-Powered Prospecting',
    date: 'September 2025',
    excerpt: 'With pricing starting at a fraction of the cost of a human SDR, LeadReach AI is making sophisticated AI lead generation accessible to businesses of every size.',
    href: '#',
  },
];

const PRESS_RELEASES = [
  {
    title: 'LeadReach AI Announces AI Setter Agents for Autonomous Appointment Booking',
    date: 'January 15, 2026',
    excerpt: 'The new AI Setter capability enables businesses to deploy autonomous agents that qualify leads and book meetings around the clock, achieving 30-40% conversion rates compared to 10-20% for human setters.',
  },
  {
    title: 'LeadReach AI Surpasses 10,000 Daily Lead Discovery Operations',
    date: 'November 8, 2025',
    excerpt: 'The platform now processes over 10,000 lead discovery operations daily across its customer base, with an average enrichment accuracy rate of 94% and lead qualification precision of 87%.',
  },
  {
    title: 'Agent-Reach: LeadReach AI Launches Multi-Channel Research Capability',
    date: 'July 22, 2025',
    excerpt: 'Agent-Reach provides AI agents with access to 17+ internet channels including web reading, semantic search, professional networks, social platforms, and public databases for comprehensive lead research.',
  },
  {
    title: 'LeadReach AI Closes Series A Funding to Scale Autonomous Lead Generation Platform',
    date: 'March 15, 2025',
    excerpt: 'The funding will be used to expand the AI research team, accelerate product development, and scale go-to-market operations to meet growing enterprise demand for agentic sales tools.',
  },
];

const BRAND_ASSETS = [
  {
    icon: Image,
    title: 'Logo Kit',
    description: 'Official LeadReach AI logos in SVG, PNG, and EPS formats. Includes primary logo, icon mark, and wordmark in both light and dark variants with clear space guidelines and minimum size requirements.',
    formats: 'SVG, PNG, EPS',
  },
  {
    icon: Palette,
    title: 'Brand Colors & Typography',
    description: 'Our complete color palette including primary emerald, secondary colors, and neutral tones with hex, RGB, and OKLCH values. Typography specifications featuring Geist Sans and Geist Mono with usage guidelines.',
    formats: 'CSS, Figma, ASE',
  },
  {
    icon: FileText,
    title: 'Press Kit',
    description: 'A comprehensive press kit including company boilerplate, leadership bios, product screenshots, executive headshots, and brand guidelines document covering tone of voice, visual identity, and usage rules.',
    formats: 'PDF, ZIP',
  },
  {
    icon: Globe,
    title: 'Product Screenshots',
    description: 'High-resolution screenshots of the LeadReach AI platform including the dashboard, ICP Builder, agent views, lead profiles, campaign management, and analytics. Available in light and dark modes.',
    formats: 'PNG, WebP (2x resolution)',
  },
];

const FACTSHEET = [
  { label: 'Founded', value: '2023' },
  { label: 'Headquarters', value: 'San Francisco, CA' },
  { label: 'Employees', value: '50+' },
  { label: 'AI Agents', value: '8 Specialized' },
  { label: 'Research Channels', value: '17+' },
  { label: 'Daily Lead Operations', value: '10,000+' },
  { label: 'Platform Uptime', value: '99.9%' },
  { label: 'Customers', value: 'Enterprise & SMB' },
];

export default function PressPage() {
  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Newspaper className="h-3 w-3 mr-1" />
              Press
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach AI in the <span className="text-gradient">News</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              The latest coverage, press releases, and brand resources for journalists, analysts, and media professionals covering the agentic AI and sales technology space.
            </p>
          </div>
        </div>
      </section>

      {/* Company Factsheet */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-6">Company Factsheet</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FACTSHEET.map((fact) => (
              <Card key={fact.label} className="card-premium border-border/30 bg-card/50 p-4 text-center">
                <div className="text-lg font-bold text-gradient">{fact.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{fact.label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Press Releases */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Press Releases</h2>
          <p className="text-sm text-muted-foreground mb-8">Official announcements from LeadReach AI.</p>
          <div className="space-y-6 max-w-4xl">
            {PRESS_RELEASES.map((release) => (
              <Card key={release.title} className="card-premium border-border/30 bg-card/50 p-6">
                <div className="flex items-center gap-2 text-xs text-emerald-400 mb-2">
                  <Calendar className="h-3 w-3" />
                  {release.date}
                </div>
                <h3 className="text-base font-bold text-foreground">{release.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{release.excerpt}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Press Mentions */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Media Coverage</h2>
          <p className="text-sm text-muted-foreground mb-8">What the press is saying about LeadReach AI.</p>
          <div className="space-y-6 max-w-4xl">
            {PRESS_MENTIONS.map((mention) => (
              <Card key={mention.title} className="card-premium border-border/30 bg-card/50 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-emerald-400">{mention.outlet}</span>
                  <span className="text-xs text-muted-foreground">{mention.date}</span>
                </div>
                <h3 className="text-base font-bold text-foreground">{mention.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{mention.excerpt}</p>
                <a href={mention.href} className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                  Read Article
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Assets */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-foreground mb-2">Brand Assets</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Official logos, color palettes, typography, and product assets for media and partner use. All assets are provided under our brand guidelines and may only be used in accordance with our terms.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BRAND_ASSETS.map((asset) => {
              const Icon = asset.icon;
              return (
                <Card key={asset.title} className="card-premium border-border/30 bg-card/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/10 p-3 shrink-0">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{asset.title}</h3>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{asset.description}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Formats: {asset.formats}</span>
                        <Button size="sm" variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10">
                          <Download className="mr-1.5 h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Boilerplate & Media Contact */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Company Boilerplate</h2>
              <div className="p-5 rounded-xl border border-border/30 bg-card/50 text-sm text-muted-foreground leading-relaxed">
                <p>
                  LeadReach AI is an agentic lead generation platform that deploys autonomous AI agents to discover, enrich, qualify, and engage leads across 17+ channels. Founded in 2023 and headquartered in San Francisco, the company&apos;s multi-agent architecture uses eight specialized AI agents — Orchestrator, Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, and Report Generator — that collaborate autonomously to execute the entire lead generation lifecycle. LeadReach AI serves businesses of all sizes, from startups to enterprise organizations, with pricing starting at $97/month. The platform also offers AI Setter agents for B2C appointment setting, achieving 30-40% conversion rates. For more information, visit leadreach.ai.
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Media Contact</h2>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For press inquiries, interview requests, speaking engagements, or additional information about LeadReach AI, please contact our communications team. We aim to respond to all media inquiries within one business day.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/50">
                    <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Press Inquiries</div>
                      <div className="text-sm font-medium text-foreground">press@leadreach.ai</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/50">
                    <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Partnership Inquiries</div>
                      <div className="text-sm font-medium text-foreground">partnerships@leadreach.ai</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl border border-border/30 bg-card/50">
                    <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Speaking & Events</div>
                      <div className="text-sm font-medium text-foreground">events@leadreach.ai</div>
                    </div>
                  </div>
                </div>
              </div>
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
              <Newspaper className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Stay Updated with <span className="text-gradient">LeadReach AI</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Get the latest news, product updates, and industry insights delivered to your inbox.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/blog">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Read Our Blog
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:press@leadreach.ai">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    <Mail className="mr-2 h-4 w-4" />
                    Press Inquiry
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
