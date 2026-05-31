'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  ArrowRight,
  Zap,
  Bot,
  Search,
  Database,
  MessageSquare,
  BarChart3,
  Plug,
  Code2,
  Settings,
  Rocket,
  ChevronRight,
  FileText,
  Workflow,
  Target,
  Users,
  Webhook,
} from 'lucide-react';

type DocCategory = 'Getting Started' | 'AI Agents' | 'API Reference' | 'Integrations';

interface DocSection {
  title: string;
  description: string;
  icon: React.ElementType;
  category: DocCategory;
  items: { label: string; href: string }[];
}

const DOC_SECTIONS: DocSection[] = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running with LeadReach AI in under 10 minutes. From account creation to your first qualified leads, this guide walks you through every step of the initial setup process.',
    icon: Rocket,
    category: 'Getting Started',
    items: [
      { label: 'Creating Your Account', href: '#creating-account' },
      { label: 'Defining Your ICP', href: '#defining-icp' },
      { label: 'Deploying Your First Agent', href: '#deploying-agent' },
      { label: 'Reviewing Discovered Leads', href: '#reviewing-leads' },
    ],
  },
  {
    title: 'Ideal Customer Profile Builder',
    description: 'The ICP Builder is the foundation of your lead generation strategy. Learn how to create precise, multi-dimensional customer profiles that guide your AI agents to discover the most relevant prospects for your business.',
    icon: Target,
    category: 'Getting Started',
    items: [
      { label: 'Industry & Vertical Targeting', href: '#icp-industry' },
      { label: 'Company Size & Revenue Filters', href: '#icp-company-size' },
      { label: 'Technology Stack Signals', href: '#icp-tech-stack' },
      { label: 'Geographic & Language Preferences', href: '#icp-geography' },
      { label: 'Growth & Intent Signals', href: '#icp-intent' },
    ],
  },
  {
    title: 'Campaign Management',
    description: 'Create, configure, and manage lead generation campaigns. Understand how campaigns orchestrate multiple AI agents and channels to deliver a continuous pipeline of qualified leads.',
    icon: Workflow,
    category: 'Getting Started',
    items: [
      { label: 'Creating a New Campaign', href: '#campaign-create' },
      { label: 'Channel Configuration', href: '#campaign-channels' },
      { label: 'Pipeline Stage Definitions', href: '#campaign-pipeline' },
      { label: 'Approval Workflows', href: '#campaign-approvals' },
    ],
  },
  {
    title: 'Orchestrator Agent',
    description: 'The Orchestrator is the central brain of your AI workforce. It coordinates all other agents, assigns tasks based on priority, manages dependencies between workflow stages, and ensures seamless collaboration across the entire lead generation pipeline.',
    icon: Bot,
    category: 'AI Agents',
    items: [
      { label: 'How Orchestration Works', href: '#orchestrator-overview' },
      { label: 'Task Assignment & Priority', href: '#orchestrator-tasks' },
      { label: 'Error Recovery & Retry Logic', href: '#orchestrator-recovery' },
      { label: 'Custom Workflow Configuration', href: '#orchestrator-workflows' },
    ],
  },
  {
    title: 'Prospect Discovery Agent',
    description: 'The Prospect Discovery Agent searches across 17+ channels to find potential leads matching your ICP. It leverages web reading, semantic search, professional networks, social platforms, and public databases to build a comprehensive prospect universe.',
    icon: Search,
    category: 'AI Agents',
    items: [
      { label: 'Supported Research Channels', href: '#discovery-channels' },
      { label: 'Search Strategy & Filtering', href: '#discovery-strategy' },
      { label: 'Channel Authentication Setup', href: '#discovery-auth' },
      { label: 'Rate Limits & Quotas', href: '#discovery-limits' },
    ],
  },
  {
    title: 'Data Enrichment Agent',
    description: 'The Data Enrichment Agent takes raw prospect data and transforms it into rich, actionable profiles. It appends company details, technology stacks, funding information, social profiles, and key decision-maker contacts to every discovered lead.',
    icon: Database,
    category: 'AI Agents',
    items: [
      { label: 'Enrichment Data Points', href: '#enrichment-data' },
      { label: 'Data Sources & Accuracy', href: '#enrichment-sources' },
      { label: 'Real-Time vs. Batch Enrichment', href: '#enrichment-modes' },
      { label: 'Handling Incomplete Data', href: '#enrichment-incomplete' },
    ],
  },
  {
    title: 'Lead Qualification Agent',
    description: 'The Lead Qualification Agent scores and ranks every discovered lead based on how well they match your ICP criteria. It uses a weighted scoring model that considers firmographic fit, technology signals, engagement indicators, and growth patterns.',
    icon: Users,
    category: 'AI Agents',
    items: [
      { label: 'Scoring Methodology', href: '#qualification-scoring' },
      { label: 'Weight Configuration', href: '#qualification-weights' },
      { label: 'Score Thresholds & Stages', href: '#qualification-thresholds' },
      { label: 'Automated Disqualification Rules', href: '#qualification-disqualify' },
    ],
  },
  {
    title: 'Outreach Composer Agent',
    description: 'The Outreach Composer Agent crafts highly personalized outreach messages using enriched lead data. Each message references specific details about the prospect, their company, and their recent activities to create genuinely relevant communication at scale.',
    icon: MessageSquare,
    category: 'AI Agents',
    items: [
      { label: 'Personalization Engine', href: '#outreach-personalization' },
      { label: 'Message Templates & Variables', href: '#outreach-templates' },
      { label: 'A/B Testing Outreach', href: '#outreach-ab-testing' },
      { label: 'Compliance & CAN-SPAM', href: '#outreach-compliance' },
    ],
  },
  {
    title: 'Analytics & Reporting Agent',
    description: 'The Analytics & Reporting Agent generates comprehensive dashboards and reports covering campaign performance, channel effectiveness, pipeline velocity, agent efficiency, and ROI metrics to help you continuously optimize your lead generation strategy.',
    icon: BarChart3,
    category: 'AI Agents',
    items: [
      { label: 'Dashboard Overview', href: '#analytics-dashboard' },
      { label: 'Campaign Performance Metrics', href: '#analytics-campaign' },
      { label: 'Channel Attribution', href: '#analytics-attribution' },
      { label: 'Custom Reports & Export', href: '#analytics-reports' },
    ],
  },
  {
    title: 'REST API',
    description: 'Full programmatic access to every feature of the LeadReach AI platform. Create ICPs, deploy agents, retrieve leads, trigger outreach, and manage campaigns via our RESTful API. Available on Professional and Enterprise plans with comprehensive documentation and SDKs.',
    icon: Code2,
    category: 'API Reference',
    items: [
      { label: 'Authentication & API Keys', href: '#api-auth' },
      { label: 'Rate Limits & Quotas', href: '#api-limits' },
      { label: 'Lead Endpoints', href: '#api-leads' },
      { label: 'Campaign Endpoints', href: '#api-campaigns' },
      { label: 'Webhook Configuration', href: '#api-webhooks' },
      { label: 'Error Codes & Handling', href: '#api-errors' },
    ],
  },
  {
    title: 'Webhook Events',
    description: 'Subscribe to real-time events from LeadReach AI and trigger actions in your own systems. Receive notifications when leads are discovered, qualified, enriched, or when outreach messages are sent, opened, or replied to.',
    icon: Webhook,
    category: 'API Reference',
    items: [
      { label: 'Available Event Types', href: '#webhook-events' },
      { label: 'Webhook Setup & Verification', href: '#webhook-setup' },
      { label: 'Payload Schemas', href: '#webhook-payloads' },
      { label: 'Retry Logic & Delivery Guarantees', href: '#webhook-retries' },
    ],
  },
  {
    title: 'CRM Integrations',
    description: 'Connect LeadReach AI with your existing CRM to sync leads, enrichment data, and outreach activities bidirectionally in real-time. Native integrations available for Salesforce, HubSpot, and Pipedrive with custom API support for any system.',
    icon: Plug,
    category: 'Integrations',
    items: [
      { label: 'Salesforce Integration', href: '#integration-salesforce' },
      { label: 'HubSpot Integration', href: '#integration-hubspot' },
      { label: 'Pipedrive Integration', href: '#integration-pipedrive' },
      { label: 'Custom CRM via API', href: '#integration-custom' },
    ],
  },
  {
    title: 'Email & Outreach Integrations',
    description: 'Send AI-crafted outreach messages through your preferred email platform. Connect Gmail, Outlook, or custom SMTP servers, and manage sequences through popular outreach tools like Outreach.io, Salesloft, and Lemlist.',
    icon: Settings,
    category: 'Integrations',
    items: [
      { label: 'Gmail / Google Workspace', href: '#integration-gmail' },
      { label: 'Outlook / Microsoft 365', href: '#integration-outlook' },
      { label: 'Custom SMTP Configuration', href: '#integration-smtp' },
      { label: 'Outreach.io & Salesloft', href: '#integration-outreach-tools' },
    ],
  },
];

const CATEGORIES: DocCategory[] = ['Getting Started', 'AI Agents', 'API Reference', 'Integrations'];
const CATEGORY_ICONS: Record<DocCategory, React.ElementType> = {
  'Getting Started': Rocket,
  'AI Agents': Bot,
  'API Reference': Code2,
  'Integrations': Plug,
};

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('Getting Started');
  const filteredSections = DOC_SECTIONS.filter((s) => s.category === activeCategory);

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
              LeadReach AI <span className="text-gradient">Documentation</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Everything you need to deploy, configure, and master your AI-powered lead generation workforce. From your first campaign to advanced API integrations.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                  <Rocket className="mr-2 h-4 w-4" />
                  Launch Platform
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                  <FileText className="mr-2 h-4 w-4" />
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1.5'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 gap-1.5'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat}
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredSections.map((section) => {
              const Icon = section.icon;
              return (
                <Card key={section.title} className="card-premium border-border/30 bg-card/50 p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/10 p-3 shrink-0">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{section.description}</p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {section.items.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-emerald-500/5 group"
                          >
                            <ChevronRight className="h-3 w-3 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
                            {item.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Getting Started Deep Dive */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8">
              Getting Started <span className="text-gradient">Walkthrough</span>
            </h2>

            <div className="space-y-12">
              {/* Step 1 */}
              <div id="creating-account" className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">1</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Creating Your Account</h3>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        Getting started with LeadReach AI takes less than two minutes. Visit the signup page and create your account using your business email address. We support Google Workspace and Microsoft 365 single sign-on (SSO) for faster onboarding, or you can create an account with any email and a secure password.
                      </p>
                      <p>
                        During signup, you will be asked to provide your company name, your role, and the primary use case for the platform (B2B lead generation, B2C appointment setting, or both). This information helps us personalize your initial dashboard and pre-configure relevant AI agent workflows.
                      </p>
                      <p>
                        After email verification, you will be guided through a brief onboarding flow that sets up your workspace. This includes naming your first project, selecting your industry, and connecting any existing CRM or email accounts. You can skip any step and return to it later from your Settings page.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div id="defining-icp" className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">2</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Defining Your Ideal Customer Profile (ICP)</h3>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        The ICP Builder is the most critical step in your setup. It defines the parameters your AI agents use to discover, score, and prioritize leads. A well-defined ICP results in dramatically higher quality leads and better conversion rates.
                      </p>
                      <p>
                        Navigate to the ICP Builder from your dashboard sidebar. You will configure several dimensions: <strong className="text-foreground/90">Industry &amp; Vertical</strong> (target specific industries like SaaS, FinTech, or Healthcare), <strong className="text-foreground/90">Company Size</strong> (filter by employee count and annual revenue range), <strong className="text-foreground/90">Geography</strong> (target specific countries, regions, or time zones), <strong className="text-foreground/90">Technology Stack</strong> (find companies using specific tools like Salesforce, AWS, or React), and <strong className="text-foreground/90">Growth Signals</strong> (identify companies hiring, raising funding, or expanding).
                      </p>
                      <p>
                        Each dimension supports multiple selections and custom criteria. The ICP Builder provides real-time estimates of how many potential leads match your criteria, helping you broaden or narrow your targeting for optimal pipeline volume. You can create multiple ICPs for different product lines, market segments, or campaign strategies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div id="deploying-agent" className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">3</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Deploying Your First Agent</h3>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        Once your ICP is defined, create a new campaign and the Orchestrator Agent will automatically deploy the appropriate AI agents based on your campaign goals. By default, all eight agents are activated: Orchestrator, Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, and Report Generator.
                      </p>
                      <p>
                        You can customize which agents are active for each campaign. For example, if you only need research and enrichment without outreach, disable the Outreach Composer and Pipeline Manager. Each agent has its own configuration panel where you can set parameters like research depth, scoring weights, outreach tone, and approval requirements.
                      </p>
                      <p>
                        After deployment, agents begin working immediately. The Prospect Discovery Agent starts searching across configured channels, the Data Enrichment Agent begins enriching discovered leads, and the Lead Qualification Agent scores them in real-time. You can monitor agent activity from the Campaign Dashboard, which shows live status, progress metrics, and recent actions for each agent.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div id="reviewing-leads" className="scroll-mt-24">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-emerald-400">4</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Reviewing Discovered Leads</h3>
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                      <p>
                        As agents discover and qualify leads, they appear in your Leads Dashboard sorted by qualification score. Each lead card displays a comprehensive profile including company details, technology stack, key contacts, enrichment data sources, and the AI-generated qualification score with a breakdown of how each ICP dimension was matched.
                      </p>
                      <p>
                        You can filter leads by score range, pipeline stage, campaign, channel source, or any enrichment data field. Bulk actions let you move leads between pipeline stages, trigger enrichment refreshes, or initiate outreach for selected leads. The Pipeline View provides a visual Kanban-style board showing lead progression from discovery through qualification to outreach and conversion.
                      </p>
                      <p>
                        For high-value leads, the detail view provides a complete timeline of all agent interactions, enrichment history, and outreach activity. You can also add manual notes, tag leads for team collaboration, and set follow-up reminders. All lead data can be exported as CSV or synced directly to your connected CRM.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference Preview */}
      <section className="py-16 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              API <span className="text-gradient">Reference</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Programmatic access to every feature. Available on Professional and Enterprise plans.
            </p>

            <div id="api-auth" className="mb-10 scroll-mt-24">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Code2 className="h-5 w-5 text-emerald-400" />
                Authentication &amp; API Keys
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  All API requests require authentication using an API key. Generate your API key from the Settings page in your dashboard. Keys are scoped to your account and follow the principle of least privilege. We support both read-only and read-write keys.
                </p>
                <p>
                  Include your API key in the <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header as a Bearer token: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">Authorization: Bearer lr_live_...</code>. All API requests must be made over HTTPS. Requests over plain HTTP will be rejected.
                </p>
                <div className="rounded-xl bg-background/80 border border-border/30 p-4 font-mono text-xs text-muted-foreground overflow-x-auto">
                  <div className="text-emerald-400">{'// Example: List leads'}</div>
                  <div className="mt-1">
                    <span className="text-blue-400">curl</span> -X GET https://api.leadreach.ai/v1/leads \
                  </div>
                  <div className="pl-4">-H <span className="text-yellow-400">{'\'Authorization: Bearer lr_live_your_api_key\''}</span> \</div>
                  <div className="pl-4">-H <span className="text-yellow-400">{'\'Content-Type: application/json\''}</span></div>
                </div>
              </div>
            </div>

            <div id="api-limits" className="mb-10 scroll-mt-24">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-emerald-400" />
                Rate Limits &amp; Quotas
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  API rate limits are applied per API key and vary by plan tier. Starter plans receive 100 requests per minute, Professional plans receive 500 requests per minute, and Enterprise plans receive 2,000 requests per minute with the option to request higher limits.
                </p>
                <p>
                  Rate limit headers are included in every response: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">X-RateLimit-Limit</code>, <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">X-RateLimit-Remaining</code>, and <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">X-RateLimit-Reset</code>. When you exceed the rate limit, the API returns a 429 status code with a <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">Retry-After</code> header indicating when you can resume requests.
                </p>
              </div>
            </div>

            <div id="api-errors" className="mb-10 scroll-mt-24">
              <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-400" />
                Error Codes &amp; Handling
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The API uses standard HTTP status codes. Successful responses return 200 (OK) or 201 (Created). Client errors return 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), or 429 (Rate Limited). Server errors return 500 (Internal Server Error) or 503 (Service Unavailable).
                </p>
                <p>
                  All error responses include a JSON body with <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">error.code</code> (a machine-readable string), <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">error.message</code> (a human-readable description), and <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-xs font-mono">error.details</code> (additional context when available). We recommend implementing exponential backoff with jitter for retry logic on 5xx errors.
                </p>
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
              <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to <span className="text-gradient">get started</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Deploy your first AI agent in under 10 minutes. No credit card required for the 14-day free trial.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/support">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    Contact Support
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
