'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AGENT_DEFINITIONS } from '@/lib/types';
import {
  Brain,
  Search,
  Database,
  Globe,
  Target,
  Mail,
  GitBranch,
  BarChart3,
  ArrowRight,
  Zap,
  Check,
  Radio,
  Layers,
  Network,
  Workflow,
} from 'lucide-react';

const AGENT_ICONS: Record<string, React.ElementType> = {
  orchestrator: Brain,
  'prospect-discovery': Search,
  'data-enrichment': Database,
  'web-research': Globe,
  'lead-qualification': Target,
  'outreach-composer': Mail,
  'pipeline-manager': GitBranch,
  'report-generator': BarChart3,
};

interface AgentDetail {
  name: string;
  displayName: string;
  description: string;
  longDescription: string;
  color: string;
  icon: string;
  capabilities: string[];
  channels: string[];
}

const AGENT_DETAILS: AgentDetail[] = [
  {
    name: 'orchestrator',
    displayName: 'Orchestrator',
    description: 'Coordinates all agents and manages workflow execution',
    longDescription: 'The Orchestrator is the brain of LeadReach AI. It receives your ICP definition, creates execution plans, delegates tasks to specialized agents, monitors progress, and ensures seamless collaboration across the entire lead generation pipeline. It handles error recovery, task prioritization, and workflow optimization.',
    color: '#8B5CF6',
    icon: 'Brain',
    capabilities: [
      'Multi-agent task delegation and coordination',
      'Dynamic workflow optimization based on results',
      'Error recovery and retry logic',
      'Real-time progress monitoring and reporting',
    ],
    channels: [],
  },
  {
    name: 'prospect-discovery',
    displayName: 'Prospect Discovery',
    description: 'Searches and discovers potential leads using multiple channels',
    longDescription: 'The Prospect Discovery agent scours 17+ channels simultaneously to find potential leads matching your ICP. It uses semantic search, social media discovery, professional network mining, and web crawling to build a comprehensive pool of candidates. Zero-config channels work immediately, while authenticated channels unlock with your API keys.',
    color: '#10B981',
    icon: 'Search',
    capabilities: [
      'Multi-channel simultaneous prospect search',
      'Semantic and keyword-based discovery',
      'Professional network and community mining',
      'Deduplication and initial relevance filtering',
    ],
    channels: ['Exa Search', 'Web', 'LinkedIn', 'GitHub', 'Twitter/X', 'Reddit'],
  },
  {
    name: 'data-enrichment',
    displayName: 'Data Enrichment',
    description: 'Enriches lead data with firmographics, contacts, and digital presence',
    longDescription: 'The Data Enrichment agent takes raw prospect data and transforms it into rich, actionable profiles. It verifies contact information, adds firmographic details (revenue, headcount, funding), identifies technology stacks, maps organizational structures, and compiles digital footprints across social platforms.',
    color: '#3B82F6',
    icon: 'Database',
    capabilities: [
      'Firmographic data enrichment (revenue, size, industry)',
      'Contact verification and email finding',
      'Technology stack identification',
      'Social profile compilation and digital footprint mapping',
    ],
    channels: ['Web', 'LinkedIn', 'Exa Search', 'Twitter/X', 'GitHub'],
  },
  {
    name: 'web-research',
    displayName: 'Web Research',
    description: 'Deep web research on companies, industries, and market trends',
    longDescription: 'The Web Research agent performs deep-dive research on target companies and industries. It reads company websites, analyzes recent news, monitors industry trends, watches competitor moves, and extracts strategic insights. This contextual intelligence powers the personalized outreach that sets LeadReach apart.',
    color: '#06B6D4',
    icon: 'Globe',
    capabilities: [
      'Deep company website analysis and extraction',
      'Industry trend monitoring and reporting',
      'Competitive landscape intelligence',
      'Recent news and event signal detection',
    ],
    channels: ['Web', 'Exa Search', 'LinkedIn', 'Twitter/X', 'YouTube', 'Reddit', 'RSS'],
  },
  {
    name: 'lead-qualification',
    displayName: 'Lead Qualification',
    description: 'Scores and qualifies leads based on ICP criteria',
    longDescription: 'The Lead Qualification agent applies your ICP criteria to score and rank every discovered lead. It uses a weighted scoring model considering industry fit, company size, geographic match, technology alignment, growth signals, and buying intent indicators. Leads are categorized as Hot, Warm, Cold, or Unqualified.',
    color: '#F59E0B',
    icon: 'Target',
    capabilities: [
      'Weighted ICP matching with configurable criteria',
      'Buying intent signal detection',
      'Lead tier classification (Hot/Warm/Cold/Unqualified)',
      'Real-time score updates as enrichment data arrives',
    ],
    channels: ['Web', 'LinkedIn', 'Exa Search'],
  },
  {
    name: 'outreach-composer',
    displayName: 'Outreach Composer',
    description: 'Crafts personalized outreach messages and sequences',
    longDescription: 'The Outreach Composer creates hyper-personalized messages for each qualified lead. It analyzes the lead\'s enriched profile, recent activities, and company context to craft messages that feel genuinely human. It supports multi-step sequences, A/B testing, channel-specific formatting, and adaptive messaging based on engagement signals.',
    color: '#EC4899',
    icon: 'Mail',
    capabilities: [
      'AI-personalized message composition per lead',
      'Multi-step sequence design and optimization',
      'Channel-specific formatting (email, LinkedIn, phone)',
      'Engagement-adaptive follow-up messaging',
    ],
    channels: ['LinkedIn', 'Web', 'Exa Search'],
  },
  {
    name: 'pipeline-manager',
    displayName: 'Pipeline Manager',
    description: 'Manages lead pipeline stages and follow-up schedules',
    longDescription: 'The Pipeline Manager oversees the entire lead lifecycle from discovery to conversion. It manages stage transitions (New → Enriched → Qualified → Contacted → Engaged → Negotiating → Closed Won), schedules follow-ups at optimal times, orchestrates nurture campaigns for warm leads, and ensures no opportunity falls through the cracks.',
    color: '#6366F1',
    icon: 'GitBranch',
    capabilities: [
      'Automated stage transition management',
      'Optimal follow-up timing and scheduling',
      'Nurture campaign orchestration for warm leads',
      'Pipeline health monitoring and bottleneck detection',
    ],
    channels: [],
  },
  {
    name: 'report-generator',
    displayName: 'Report Generator',
    description: 'Generates analytics reports and campaign insights',
    longDescription: 'The Report Generator produces comprehensive analytics and actionable insights from your lead generation activities. It tracks agent performance, campaign ROI, channel effectiveness, conversion funnels, and pipeline velocity. Reports are generated on-demand and on schedule, with AI-powered recommendations for optimization.',
    color: '#EF4444',
    icon: 'BarChart3',
    capabilities: [
      'Real-time campaign performance dashboards',
      'Agent efficiency and productivity metrics',
      'Channel ROI analysis and recommendations',
      'AI-powered optimization suggestions',
    ],
    channels: [],
  },
];

const CHANNELS = [
  { name: 'Web', icon: '🌐', tier: 'Zero Config' },
  { name: 'Exa Search', icon: '🔍', tier: 'Zero Config' },
  { name: 'LinkedIn', icon: '💼', tier: 'Needs Setup' },
  { name: 'Twitter/X', icon: '🐦', tier: 'Needs Setup' },
  { name: 'YouTube', icon: '📺', tier: 'Zero Config' },
  { name: 'GitHub', icon: '📦', tier: 'Zero Config' },
  { name: 'Reddit', icon: '📖', tier: 'Needs Key' },
  { name: 'RSS Feeds', icon: '📡', tier: 'Zero Config' },
  { name: 'Bilibili', icon: '📺', tier: 'Needs Key' },
  { name: 'XiaoHongShu', icon: '📕', tier: 'Needs Setup' },
  { name: 'Douyin', icon: '🎵', tier: 'Needs Setup' },
  { name: 'WeChat Articles', icon: '💬', tier: 'Needs Key' },
  { name: 'Weibo', icon: '📰', tier: 'Zero Config' },
  { name: 'V2EX', icon: '💻', tier: 'Zero Config' },
  { name: 'Xueqiu', icon: '📈', tier: 'Zero Config' },
  { name: 'Xiaoyuzhou', icon: '🎙️', tier: 'Needs Setup' },
  { name: 'More', icon: '⚡', tier: 'Expanding' },
];

const TIER_COLORS: Record<string, string> = {
  'Zero Config': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Needs Key': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Needs Setup': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'Expanding': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export default function AgentPage() {
  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Network className="h-3 w-3 mr-1" />
              AI Workforce
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Meet Your <span className="text-gradient">AI Workforce</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              8 specialized AI agents that collaborate autonomously to deliver qualified leads. Each agent is an expert in its domain, and together they form an unstoppable lead generation machine.
            </p>
          </div>
        </div>
      </section>

      {/* Agent Cards */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {AGENT_DETAILS.map((agent) => {
              const Icon = AGENT_ICONS[agent.name] || Brain;
              return (
                <Card key={agent.name} className="card-premium border-border/30 bg-card/50 relative overflow-hidden group">
                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: agent.color }}
                  />
                  <CardContent className="p-6 lg:p-8">
                    <div className="flex items-start gap-4">
                      <div
                        className="rounded-xl p-3 shrink-0"
                        style={{ backgroundColor: `${agent.color}12`, color: agent.color }}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">{agent.displayName}</h3>
                          <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                            <Radio className="h-2.5 w-2.5 mr-0.5" />
                            Active
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          {agent.longDescription}
                        </p>

                        {/* Capabilities */}
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">Key Capabilities</h4>
                          <ul className="space-y-1.5">
                            {agent.capabilities.map((cap, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: agent.color }} />
                                {cap}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Channels */}
                        {agent.channels.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">Channels Used</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {agent.channels.map((ch) => (
                                <Badge key={ch} variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                  {ch}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Agent-Reach Channels Section */}
      <section className="py-16 lg:py-24 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Zap className="h-3 w-3 mr-1" />
              Agent-Reach
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              17+ <span className="text-gradient">channels</span> of internet access
            </h2>
            <p className="mt-4 text-muted-foreground">
              Agent-Reach gives your AI agents real-time access to the internet through multiple channels. Zero-config channels work immediately, while others unlock with your API keys.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {CHANNELS.map((channel) => (
              <Card key={channel.name} className="card-premium border-border/30 bg-card/50 text-center">
                <CardContent className="p-3 lg:p-4">
                  <div className="text-2xl mb-1.5">{channel.icon}</div>
                  <div className="text-xs font-semibold text-foreground mb-1">{channel.name}</div>
                  <Badge variant="outline" className={`text-[8px] ${TIER_COLORS[channel.tier] || ''}`}>
                    {channel.tier}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="py-16 lg:py-24 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <Workflow className="h-3 w-3 mr-1" />
              Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              How agents <span className="text-gradient">work together</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              The Orchestrator agent coordinates all specialized agents in a collaborative workflow that runs autonomously from lead discovery to pipeline management.
            </p>
          </div>

          {/* Architecture Diagram */}
          <Card className="border-border/30 bg-card/50 overflow-hidden">
            <CardContent className="p-6 lg:p-10">
              <div className="flex flex-col items-center gap-6">
                {/* Top: Orchestrator */}
                <div className="flex flex-col items-center">
                  <div className="rounded-xl border-2 border-violet-500/30 bg-violet-500/10 p-4 text-center glow-emerald-sm" style={{ boxShadow: '0 0 20px rgba(139, 92, 246, 0.15)' }}>
                    <Brain className="h-8 w-8 text-violet-400 mx-auto mb-2" />
                    <div className="text-sm font-bold text-foreground">Orchestrator</div>
                    <div className="text-[10px] text-muted-foreground">Coordinates & Delegates</div>
                  </div>
                  <div className="w-px h-6 bg-border/50" />
                  <div className="text-[10px] text-muted-foreground">distributes tasks</div>
                  <div className="w-px h-6 bg-border/50" />
                </div>

                {/* Middle: Agent Row 1 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl">
                  {[
                    { icon: Search, name: 'Prospect Discovery', color: '#10B981' },
                    { icon: Database, name: 'Data Enrichment', color: '#3B82F6' },
                    { icon: Globe, name: 'Web Research', color: '#06B6D4' },
                    { icon: Target, name: 'Lead Qualification', color: '#F59E0B' },
                  ].map((a) => (
                    <div key={a.name} className="flex flex-col items-center text-center">
                      <div
                        className="rounded-lg border border-border/30 p-3 w-full"
                        style={{ backgroundColor: `${a.color}08` }}
                      >
                        <a.icon className="h-5 w-5 mx-auto mb-1" style={{ color: a.color }} />
                        <div className="text-[10px] font-semibold text-foreground">{a.name}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className="flex items-center gap-2 text-muted-foreground/50">
                  <div className="w-16 h-px bg-border/50" />
                  <Layers className="h-4 w-4" />
                  <div className="w-16 h-px bg-border/50" />
                </div>

                {/* Bottom: Agent Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  {[
                    { icon: Mail, name: 'Outreach Composer', color: '#EC4899', desc: 'Personalized messages' },
                    { icon: GitBranch, name: 'Pipeline Manager', color: '#6366F1', desc: 'Stage management' },
                    { icon: BarChart3, name: 'Report Generator', color: '#EF4444', desc: 'Analytics & insights' },
                  ].map((a) => (
                    <div key={a.name} className="flex flex-col items-center text-center">
                      <div
                        className="rounded-lg border border-border/30 p-3 w-full"
                        style={{ backgroundColor: `${a.color}08` }}
                      >
                        <a.icon className="h-5 w-5 mx-auto mb-1" style={{ color: a.color }} />
                        <div className="text-[10px] font-semibold text-foreground">{a.name}</div>
                        <div className="text-[9px] text-muted-foreground">{a.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Output */}
                <div className="flex items-center gap-2 text-muted-foreground/50">
                  <div className="w-16 h-px bg-border/50" />
                  <ArrowRight className="h-4 w-4" />
                  <div className="w-16 h-px bg-border/50" />
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-8 py-4 text-center">
                  <div className="text-sm font-bold text-emerald-400">Qualified Leads Delivered</div>
                  <div className="text-[10px] text-muted-foreground">Enriched profiles • Scores • Personalized outreach • Pipeline ready</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                Deploy Your <span className="text-gradient">AI Workforce</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Start your 14-day free trial and put 8 AI agents to work on your lead generation. No credit card required.
              </p>
              <div className="mt-6">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Deploy AI Workforce
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
