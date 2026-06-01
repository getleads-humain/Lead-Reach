'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Zap, Bot, Database, Shield, Plug, BarChart3, Code2, FileText, ChevronRight } from 'lucide-react';

const DOC_SECTIONS = [
  {
    icon: Zap,
    title: 'Getting Started',
    description: 'Set up your LeadReach account, define your first Ideal Customer Profile, and deploy your AI agents in under 15 minutes. This section walks you through the onboarding flow step by step.',
    articles: [
      'Creating Your Account',
      'Defining Your ICP',
      'Deploying Your First Agent',
      'Understanding the Dashboard',
    ],
  },
  {
    icon: Bot,
    title: 'AI Agents',
    description: 'Deep dive into each of the 8 specialized agents — what they do, how they coordinate, and how to configure them for your specific use case. Learn about the Orchestrator, Prospect Discovery, Data Enrichment, and more.',
    articles: [
      'Agent Architecture Overview',
      'Orchestrator Agent',
      'Prospect Discovery Agent',
      'Data Enrichment Agent',
      'Web Research Agent',
      'Lead Qualification Agent',
      'Outreach Composer Agent',
      'Pipeline Manager Agent',
      'Report Generator Agent',
    ],
  },
  {
    icon: Database,
    title: 'Data & Enrichment',
    description: 'Understand how LeadReach collects, processes, and enriches lead data from 17+ research channels. Learn about data sources, enrichment fields, scoring models, and how to customize qualification criteria.',
    articles: [
      'Research Channels Overview',
      'Data Enrichment Fields',
      'Lead Scoring Model',
      'Custom Qualification Criteria',
      'Data Export & Sync',
    ],
  },
  {
    icon: Plug,
    title: 'Integrations',
    description: 'Connect LeadReach with your existing CRM, email platform, and outreach tools. Covers native integrations with Salesforce, HubSpot, and Pipedrive, plus webhook and API-based connections for custom workflows.',
    articles: [
      'Salesforce Integration',
      'HubSpot Integration',
      'Pipedrive Integration',
      'Email Provider Setup',
      'Webhooks & Custom Integrations',
    ],
  },
  {
    icon: Shield,
    title: 'Security & Compliance',
    description: 'Learn about our security infrastructure, data encryption, access controls, and compliance certifications. Includes information on GDPR, CCPA, SOC 2, and how we handle data residency requirements.',
    articles: [
      'Security Overview',
      'Data Encryption & Storage',
      'Access Controls & RBAC',
      'GDPR Compliance',
      'CCPA Compliance',
      'Data Residency Options',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reporting',
    description: 'Master the reporting dashboard, understand pipeline metrics, and learn how to interpret agent performance data. Covers real-time analytics, historical reporting, and custom report generation.',
    articles: [
      'Dashboard Overview',
      'Pipeline Metrics',
      'Agent Performance Reports',
      'Custom Report Builder',
      'Scheduled Reports & Alerts',
    ],
  },
];

const QUICK_START_STEPS = [
  { step: 1, title: 'Create Account', description: 'Sign up for a free 14-day trial with no credit card required.' },
  { step: 2, title: 'Define ICP', description: 'Describe your ideal customer — industry, size, location, tech stack.' },
  { step: 3, title: 'Deploy Agents', description: 'Activate the AI agents that match your prospecting needs.' },
  { step: 4, title: 'Review Leads', description: 'Monitor discovered and qualified leads in your pipeline dashboard.' },
];

export default function DocsPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <BookOpen className="h-3 w-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach <span className="text-gradient">Documentation</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Everything you need to get started, configure your AI agents, integrate with your tools, and make the most of autonomous lead generation.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Quick <span className="text-gradient">Start</span>
            </h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              Go from zero to qualified leads in four simple steps. Our onboarding flow is designed to get you up and running in under 15 minutes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {QUICK_START_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-xl border border-border/30 bg-card/50 p-6 text-center hover:border-emerald-500/20 transition-colors"
              >
                <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 h-10 w-10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-emerald-400">{item.step}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16 lg:py-20 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Browse by <span className="text-gradient">Topic</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {DOC_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isExpanded = expandedSection === section.title;
              return (
                <div
                  key={section.title}
                  className="rounded-xl border border-border/30 bg-card/50 hover:border-emerald-500/20 transition-colors overflow-hidden"
                >
                  <button
                    className="w-full flex items-start gap-4 p-6 text-left"
                    onClick={() => setExpandedSection(isExpanded ? null : section.title)}
                  >
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 shrink-0">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-1">{section.description}</p>
                    </div>
                    <ChevronRight className={`h-5 w-5 text-muted-foreground shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>
                  {isExpanded && (
                    <div className="px-6 pb-6 pt-0 border-t border-border/20 mt-0">
                      <ul className="space-y-2 mt-4">
                        {section.articles.map((article) => (
                          <li key={article}>
                            <a href="#" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors">
                              <FileText className="h-3.5 w-3.5" />
                              {article}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* API Reference CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Code2 className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Need the <span className="text-gradient">API Reference</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Full REST API documentation with authentication guides, endpoint references, SDKs for Python and Node.js, and code examples.
              </p>
              <div className="mt-6">
                <Link href="/api-docs">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    View API Docs
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
