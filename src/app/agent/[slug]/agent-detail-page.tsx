'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Search,
  Database,
  Globe,
  Target,
  Mail,
  GitBranch,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Zap,
  Shield,
  Wrench,
  BookOpen,
  Activity,
  Settings,
  ChevronRight,
  Radio,
  Server,
  TrendingUp,
  FileText,
  AlertCircle,
  Sparkles,
  Code2,
  AlertTriangle,
  GitFork,
  Beaker,
  Terminal,
  ScrollText,
  Layers,
  ThumbsUp,
} from 'lucide-react';
import type { AgentDetailFull } from '@/lib/agent-details';

const ICON_MAP: Record<string, React.ElementType> = {
  Brain, Search, Database, Globe, Target, Mail, GitBranch, BarChart3,
};

const KB_CATEGORY_COLORS: Record<string, string> = {
  SOP: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Runbook: 'bg-red-500/10 text-red-400 border-red-500/20',
  Playbook: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Reference: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Training: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const SEVERITY_COLORS: Record<string, string> = {
  block: 'border-red-500/30 bg-red-500/5 text-red-400',
  warn: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
  log: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Renders a long string preserving line breaks. Optionally renders markdown-style headings (#) and lists (-).
function RichText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-sm text-foreground/80 leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        // Markdown-style heading
        if (trimmed.startsWith('# ')) {
          return (
            <h4 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
              {trimmed.slice(2)}
            </h4>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h5 key={i} className="text-xs font-semibold text-foreground/90 mt-2 mb-1 uppercase tracking-wide">
              {trimmed.slice(3)}
            </h5>
          );
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-xs text-muted-foreground/70 shrink-0 mt-0.5">{trimmed.match(/^\d+\./)?.[0]}</span>
              <span className="flex-1">{trimmed.replace(/^\d+\.\s/, '')}</span>
            </div>
          );
        }
        // Bulleted list
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <ChevronRight className="h-3 w-3 shrink-0 mt-1" style={{ color: 'currentColor' }} />
              <span className="flex-1">{trimmed.slice(2)}</span>
            </div>
          );
        }
        return <p key={i} className="text-foreground/80">{trimmed}</p>;
      })}
    </div>
  );
}

// Renders a JSON string with syntax-highlight-style coloring and preserves whitespace.
function JsonBlock({ json }: { json: string }) {
  return (
    <pre className="text-[11px] leading-relaxed font-mono text-foreground/80 overflow-x-auto bg-black/20 dark:bg-black/40 border border-border/30 rounded-lg p-3">
      <code>{json}</code>
    </pre>
  );
}

export function AgentDetailPage({ agent }: { agent: AgentDetailFull }) {
  const Icon = ICON_MAP[agent.iconName] || Brain;
  const [expandedKb, setExpandedKb] = useState<number | null>(null);
  const [expandedExample, setExpandedExample] = useState<number | null>(null);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);

  return (
    <MarketingLayout>
      {/* Hero Header */}
      <section className="relative py-12 lg:py-20 border-b border-border/20 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 30% 0%, ${hexToRgba(agent.color, 0.08)} 0%, transparent 50%)`,
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link href="/agent" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Agents
          </Link>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl shrink-0"
              style={{ backgroundColor: hexToRgba(agent.color, 0.1), color: agent.color }}
            >
              <Icon className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{agent.displayName}</h1>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                  <Radio className="h-2.5 w-2.5 mr-0.5" />
                  Active
                </Badge>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: hexToRgba(agent.color, 0.3), color: agent.color }}>
                  {agent.department}
                </Badge>
                <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                  <Layers className="h-2.5 w-2.5 mr-0.5" />
                  Position {agent.pipelinePosition}/8
                </Badge>
              </div>
              <p className="text-base text-muted-foreground mb-3">{agent.tagline}</p>
              <p className="text-sm text-muted-foreground/80 max-w-3xl leading-relaxed">{agent.longDescription}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-8 lg:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-card/50 border border-border/30 p-1 rounded-lg">
              {['overview', 'capabilities', 'pipeline', 'knowledge', 'tools', 'metrics', 'prompts', 'examples', 'guardrails', 'config'].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="text-xs capitalize data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  {tab === 'config' ? 'Config' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Overview Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-border/30 bg-card/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Brain className="h-4 w-4" style={{ color: agent.color }} />
                        Agent Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="rounded-lg border border-border/20 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Pipeline Position</p>
                          <p className="text-lg font-bold text-foreground">{agent.pipelinePosition}/8</p>
                        </div>
                        <div className="rounded-lg border border-border/20 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Department</p>
                          <p className="text-sm font-bold text-foreground">{agent.department}</p>
                        </div>
                        <div className="rounded-lg border border-border/20 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Priority</p>
                          <p className="text-sm font-bold" style={{ color: agent.config.priority === 'critical' ? '#EF4444' : agent.config.priority === 'high' ? '#F59E0B' : '#3B82F6' }}>
                            {agent.config.priority}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/20 p-3">
                          <p className="text-[10px] text-muted-foreground uppercase">Schedule</p>
                          <p className="text-sm font-bold text-foreground">{agent.config.scheduleType.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">Pipeline Role</h4>
                        <p className="text-sm text-muted-foreground">{agent.pipelineRole}</p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">Dependencies</h4>
                        <div className="flex flex-wrap gap-2">
                          {agent.dependencies.length > 0 ? agent.dependencies.map((dep) => (
                            <Link key={dep} href={`/agent/${dep}`}>
                              <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-400 cursor-pointer">
                                {dep}
                              </Badge>
                            </Link>
                          )) : (
                            <span className="text-xs text-muted-foreground/50">No dependencies — operates independently</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider mb-2">Channels</h4>
                        {agent.channels.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {agent.channels.map((ch) => (
                              <Badge key={ch} variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                                {ch}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">No external channels — internal coordinator</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* System Prompt Summary (preview) */}
                  <Card className="border-border/30 bg-card/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <ScrollText className="h-4 w-4" style={{ color: agent.color }} />
                        System Prompt Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground/70 leading-relaxed italic">{agent.config.systemPromptSummary}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-3">
                        Full {agent.config.systemPromptFull.split(/\s+/).length}-word system prompt available in the <strong className="text-foreground">Prompts</strong> tab.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* FAQ Sidebar */}
                <div className="space-y-4">
                  <Card className="border-border/30 bg-card/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Sparkles className="h-4 w-4" style={{ color: agent.color }} />
                        Frequently Asked
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agent.faqs.map((faq, i) => (
                        <div key={i} className="border-l-2 pl-3" style={{ borderColor: hexToRgba(agent.color, 0.3) }}>
                          <p className="text-xs font-semibold text-foreground/80 mb-1">{faq.question}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Stats */}
                  <Card className="border-border/30 bg-card/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4" style={{ color: agent.color }} />
                        At a Glance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Capabilities</span>
                        <span className="font-semibold text-foreground">{agent.capabilities.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Pipeline stages</span>
                        <span className="font-semibold text-foreground">{agent.pipelineStages.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Knowledge docs</span>
                        <span className="font-semibold text-foreground">{agent.knowledgeBase.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tools & integrations</span>
                        <span className="font-semibold text-foreground">{agent.tools.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Tracked metrics</span>
                        <span className="font-semibold text-foreground">{agent.metrics.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Prompt templates</span>
                        <span className="font-semibold text-foreground">{agent.userPromptTemplates.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Guardrails</span>
                        <span className="font-semibold text-foreground">{agent.guardrails.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Worked examples</span>
                        <span className="font-semibold text-foreground">{agent.examples.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Eval cases</span>
                        <span className="font-semibold text-foreground">{agent.evaluationCases.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Capabilities Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="capabilities" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4" style={{ color: agent.color }} />
                    Capabilities ({agent.capabilities.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {agent.capabilities.map((cap, i) => (
                      <div key={i} className="rounded-lg border border-border/30 p-4 bg-card/40">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                            <CheckCircle2 className="h-4 w-4" style={{ color: agent.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-foreground">{cap.name}</h4>
                              {cap.metric && (
                                <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 shrink-0">
                                  {cap.metric}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{cap.description}</p>
                            {cap.details && cap.details.length > 0 && (
                              <ul className="space-y-1 mt-2 pt-2 border-t border-border/20">
                                {cap.details.map((d, j) => (
                                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80">
                                    <ChevronRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: agent.color }} />
                                    <span className="flex-1">{d}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Channels */}
              {agent.channels.length > 0 && (
                <Card className="border-border/30 bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4" style={{ color: agent.color }} />
                      Channels Used ({agent.channels.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {agent.channels.map((ch) => (
                        <Badge key={ch} variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                          {ch}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Pipeline Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="pipeline" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4" style={{ color: agent.color }} />
                    Pipeline Stages ({agent.pipelineStages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.pipelineStages.map((stage, i) => {
                    const isExpanded = expandedStage === i;
                    return (
                      <div key={i} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: hexToRgba(agent.color, 0.15), color: agent.color }}>
                            {i + 1}
                          </div>
                          {i < agent.pipelineStages.length - 1 && (
                            <div className="w-0.5 h-12 bg-border/30 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <button
                            type="button"
                            onClick={() => setExpandedStage(isExpanded ? null : i)}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-foreground hover:text-emerald-400 transition-colors">{stage.stage}</h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5 mr-0.5" />
                                  {stage.duration}
                                </Badge>
                                {stage.substeps && (
                                  <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground cursor-pointer hover:border-emerald-500/30">
                                    {isExpanded ? '− Hide' : `+ ${stage.substeps.length} substeps`}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-[10px] text-muted-foreground/50 uppercase mb-1">Inputs</p>
                              <ul className="space-y-0.5">
                                {stage.inputs.map((inp, j) => (
                                  <li key={j} className="text-muted-foreground flex items-center gap-1">
                                    <ChevronRight className="h-2.5 w-2.5" style={{ color: agent.color }} />
                                    {inp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground/50 uppercase mb-1">Outputs</p>
                              <ul className="space-y-0.5">
                                {stage.outputs.map((out, j) => (
                                  <li key={j} className="text-muted-foreground flex items-center gap-1">
                                    <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                                    {out}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          {isExpanded && stage.substeps && (
                            <div className="mt-3 pt-3 border-t border-border/20 space-y-3">
                              <div>
                                <p className="text-[10px] text-muted-foreground/50 uppercase mb-1.5">Substeps ({stage.substeps.length})</p>
                                <ol className="space-y-1">
                                  {stage.substeps.map((s, j) => (
                                    <li key={j} className="flex items-start gap-2 text-[11px] text-muted-foreground/80">
                                      <span className="font-bold text-foreground/60 shrink-0 mt-0.5">{j + 1}.</span>
                                      <span className="flex-1">{s}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                              {stage.errorHandling && (
                                <div>
                                  <p className="text-[10px] text-amber-400/70 uppercase mb-1 flex items-center gap-1">
                                    <AlertTriangle className="h-2.5 w-2.5" />
                                    Error Handling
                                  </p>
                                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{stage.errorHandling}</p>
                                </div>
                              )}
                              {stage.retryStrategy && (
                                <div>
                                  <p className="text-[10px] text-blue-400/70 uppercase mb-1 flex items-center gap-1">
                                    <RotateIcon />
                                    Retry Strategy
                                  </p>
                                  <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{stage.retryStrategy}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Knowledge Base Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="knowledge" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" style={{ color: agent.color }} />
                    Knowledge Base ({agent.knowledgeBase.length} documents)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.knowledgeBase.map((kb, i) => {
                    const isExpanded = expandedKb === i;
                    return (
                      <div key={i} className="rounded-lg border border-border/30 bg-card/40 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedKb(isExpanded ? null : i)}
                          className="w-full text-left p-4 hover:bg-card/60 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                              <BookOpen className="h-4 w-4" style={{ color: agent.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Badge variant="outline" className={`text-[9px] ${KB_CATEGORY_COLORS[kb.category] || ''}`}>
                                  {kb.category}
                                </Badge>
                                <span className="text-[10px] text-muted-foreground">{kb.sections} sections</span>
                                {kb.version && (
                                  <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">v{kb.version}</Badge>
                                )}
                                {kb.owner && (
                                  <span className="text-[10px] text-muted-foreground/60">· {kb.owner}</span>
                                )}
                                {kb.lastReviewed && (
                                  <span className="text-[10px] text-muted-foreground/60">· reviewed {kb.lastReviewed}</span>
                                )}
                              </div>
                              <h4 className="text-sm font-semibold text-foreground mb-1">{kb.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{kb.summary}</p>
                              {kb.sectionList && (
                                <p className="text-[10px] text-emerald-400 mt-2">
                                  {isExpanded ? '− Hide section breakdown' : `+ Show ${kb.sectionList.length} sections`}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                        {isExpanded && kb.sectionList && (
                          <div className="border-t border-border/20 bg-card/20 p-4">
                            <p className="text-[10px] text-muted-foreground/50 uppercase mb-2">Section Breakdown</p>
                            <ol className="space-y-2">
                              {kb.sectionList.map((s, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="font-bold text-foreground/40 shrink-0 mt-0.5 text-[11px]">{j + 1}.</span>
                                  <div className="flex-1">
                                    <p className="text-[11px] font-semibold text-foreground/80">{s.title}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">{s.description}</p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Tools Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {agent.tools.map((tool, i) => (
                  <Card key={i} className="border-border/30 bg-card/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                          {tool.type === 'MCP Server' ? <Server className="h-4 w-4" style={{ color: agent.color }} /> :
                           tool.type === 'API' ? <Globe className="h-4 w-4" style={{ color: agent.color }} /> :
                           tool.type === 'SDK' ? <Code2 className="h-4 w-4" style={{ color: agent.color }} /> :
                           <Wrench className="h-4 w-4" style={{ color: agent.color }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <h4 className="text-sm font-semibold text-foreground break-all">{tool.name}</h4>
                            <Badge variant="outline" className={`text-[9px] shrink-0 ${
                              tool.status === 'connected' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                              tool.status === 'available' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                              'border-gray-500/20 text-gray-400 bg-gray-500/5'
                            }`}>
                              {tool.status === 'connected' ? '● Connected' : tool.status === 'available' ? '○ Available' : '○ Needs Setup'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{tool.description}</p>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{tool.type}</Badge>
                            {tool.authMethod && (
                              <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                <Shield className="h-2 w-2 mr-0.5" />
                                {tool.authMethod}
                              </Badge>
                            )}
                            {tool.rateLimit && (
                              <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                <Zap className="h-2 w-2 mr-0.5" />
                                {tool.rateLimit}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {tool.endpoint && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase mb-1">Endpoint</p>
                          <code className="text-[10px] text-foreground/70 break-all font-mono bg-black/20 px-2 py-1 rounded block">
                            {tool.endpoint}
                          </code>
                        </div>
                      )}

                      {tool.config && tool.config.length > 0 && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase mb-1.5">Configuration</p>
                          <div className="grid grid-cols-1 gap-1">
                            {tool.config.map((c, j) => (
                              <div key={j} className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="text-emerald-400/80">{c.key}</span>
                                <span className="text-muted-foreground/50">=</span>
                                <span className="text-foreground/70 break-all">{c.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tool.schemaExample && (
                        <div>
                          <p className="text-[10px] text-muted-foreground/50 uppercase mb-1">Schema Example</p>
                          <JsonBlock json={tool.schemaExample} />
                        </div>
                      )}

                      {tool.failureMode && (
                        <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-2">
                          <p className="text-[10px] text-amber-400 uppercase mb-0.5 flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Failure Mode
                          </p>
                          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">{tool.failureMode}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Metrics Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="metrics" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" style={{ color: agent.color }} />
                    Performance Metrics ({agent.metrics.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agent.metrics.map((metric, i) => {
                      const isUp = metric.trend30d?.startsWith('+');
                      const isDown = metric.trend30d?.startsWith('-');
                      const isStable = metric.trend30d === 'stable';
                      return (
                        <div key={i} className="rounded-lg border border-border/20 p-4 bg-card/40">
                          <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="h-4 w-4" style={{ color: agent.color }} />
                            {metric.benchmark && (
                              <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                {metric.benchmark}
                              </Badge>
                            )}
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {metric.value}
                            {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                          </p>
                          <p className="text-xs text-foreground/80 mt-1 font-medium">{metric.label}</p>
                          {metric.description && (
                            <p className="text-[10px] text-muted-foreground/70 mt-1.5 leading-relaxed">{metric.description}</p>
                          )}
                          {metric.trend30d && (
                            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/20">
                              <span className="text-[10px] text-muted-foreground/60">30d:</span>
                              <span className={`text-[10px] font-semibold ${
                                isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-muted-foreground'
                              }`}>
                                {isUp && '↑'}{isDown && '↓'}{isStable && '→'} {metric.trend30d}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Prompts Tab (NEW) */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="prompts" className="space-y-4">
              {/* Full System Prompt */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ScrollText className="h-4 w-4" style={{ color: agent.color }} />
                    Full System Prompt
                    <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ml-2">
                      {agent.config.systemPromptFull.split(/\s+/).length} words
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border/30 bg-black/10 dark:bg-black/30 p-4 max-h-[600px] overflow-y-auto">
                    <RichText text={agent.config.systemPromptFull} />
                  </div>
                </CardContent>
              </Card>

              {/* User Prompt Templates */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Terminal className="h-4 w-4" style={{ color: agent.color }} />
                    User Prompt Templates ({agent.userPromptTemplates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.userPromptTemplates.map((tpl, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-card/40 p-4">
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-foreground">{tpl.name}</h4>
                        {tpl.variables && tpl.variables.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tpl.variables.map((v, j) => (
                              <code key={j} className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {`{{${v}}}`}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/80 mb-2 italic">{tpl.useCase}</p>
                      <pre className="text-[11px] leading-relaxed font-mono text-foreground/80 bg-black/20 dark:bg-black/40 border border-border/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
{tpl.template}
                      </pre>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tool Call Examples */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Beaker className="h-4 w-4" style={{ color: agent.color }} />
                    Tool Call Examples ({agent.toolCallExamples.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.toolCallExamples.map((ex, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-card/40 p-4 space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{ex.tool}</h4>
                        <p className="text-[11px] text-muted-foreground/80 italic mt-0.5">{ex.scenario}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] text-blue-400/70 uppercase mb-1 flex items-center gap-1">
                            <ArrowRight className="h-2.5 w-2.5" />
                            Request
                          </p>
                          <JsonBlock json={ex.request} />
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400/70 uppercase mb-1 flex items-center gap-1">
                            <CheckCircle2 className="h-2.5 w-2.5" />
                            Response
                          </p>
                          <JsonBlock json={ex.response} />
                        </div>
                      </div>
                      {ex.notes && (
                        <div className="rounded-md border border-border/30 bg-card/30 p-2">
                          <p className="text-[10px] text-muted-foreground/60 uppercase mb-0.5">Notes</p>
                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{ex.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Response Format / JSON Schema */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Code2 className="h-4 w-4" style={{ color: agent.color }} />
                    Response Schema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {agent.config.responseFormat && (
                      <div className="rounded-md border border-border/20 p-2">
                        <p className="text-[10px] text-muted-foreground/60 uppercase">Format</p>
                        <p className="text-xs font-mono text-foreground/80">{agent.config.responseFormat}</p>
                      </div>
                    )}
                    {agent.config.reasoningEffort && (
                      <div className="rounded-md border border-border/20 p-2">
                        <p className="text-[10px] text-muted-foreground/60 uppercase">Reasoning Effort</p>
                        <p className="text-xs font-mono text-foreground/80">{agent.config.reasoningEffort}</p>
                      </div>
                    )}
                    {agent.config.timeout && (
                      <div className="rounded-md border border-border/20 p-2">
                        <p className="text-[10px] text-muted-foreground/60 uppercase">Timeout</p>
                        <p className="text-xs font-mono text-foreground/80">{agent.config.timeout}</p>
                      </div>
                    )}
                    {agent.config.retryPolicy && (
                      <div className="rounded-md border border-border/20 p-2 col-span-2 sm:col-span-3">
                        <p className="text-[10px] text-muted-foreground/60 uppercase">Retry Policy</p>
                        <p className="text-xs text-foreground/80">{agent.config.retryPolicy}</p>
                      </div>
                    )}
                    {agent.config.fallbackModel && (
                      <div className="rounded-md border border-border/20 p-2">
                        <p className="text-[10px] text-muted-foreground/60 uppercase">Fallback Model</p>
                        <p className="text-xs font-mono text-foreground/80">{agent.config.fallbackModel}</p>
                      </div>
                    )}
                  </div>
                  {agent.config.jsonSchema && (
                    <div>
                      <p className="text-[10px] text-muted-foreground/50 uppercase mb-1">JSON Schema</p>
                      <JsonBlock json={agent.config.jsonSchema} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Examples Tab (NEW) */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="examples" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Beaker className="h-4 w-4" style={{ color: agent.color }} />
                    Worked Examples ({agent.examples.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.examples.map((ex, i) => {
                    const isExpanded = expandedExample === i;
                    return (
                      <div key={i} className="rounded-lg border border-border/30 bg-card/40 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setExpandedExample(isExpanded ? null : i)}
                          className="w-full text-left p-4 hover:bg-card/60 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-sm font-semibold text-foreground">
                              <span className="text-muted-foreground/60 mr-2">#{i + 1}</span>
                              {ex.scenario}
                            </h4>
                            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground shrink-0">
                              {isExpanded ? '− Collapse' : '+ Expand'}
                            </Badge>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="border-t border-border/20 bg-card/20 p-4 space-y-3">
                            <div>
                              <p className="text-[10px] text-blue-400/70 uppercase mb-1 flex items-center gap-1">
                                <ArrowRight className="h-2.5 w-2.5" />
                                Input
                              </p>
                              <p className="text-xs text-muted-foreground/90 leading-relaxed bg-black/10 dark:bg-black/30 border border-border/20 rounded p-2 font-mono">
                                {ex.input}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-amber-400/70 uppercase mb-1 flex items-center gap-1">
                                <Brain className="h-2.5 w-2.5" />
                                Reasoning
                              </p>
                              <p className="text-xs text-muted-foreground/90 leading-relaxed bg-amber-500/5 border border-amber-500/20 rounded p-2">
                                {ex.reasoning}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-emerald-400/70 uppercase mb-1 flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Output
                              </p>
                              <JsonBlock json={ex.output} />
                            </div>
                            {ex.outcome && (
                              <div>
                                <p className="text-[10px] text-violet-400/70 uppercase mb-1 flex items-center gap-1">
                                  <ThumbsUp className="h-2.5 w-2.5" />
                                  Outcome
                                </p>
                                <p className="text-xs text-muted-foreground/90 leading-relaxed bg-violet-500/5 border border-violet-500/20 rounded p-2">
                                  {ex.outcome}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Evaluation Cases */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Beaker className="h-4 w-4" style={{ color: agent.color }} />
                    Evaluation Cases ({agent.evaluationCases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {agent.evaluationCases.map((ec, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-card/40 p-4">
                      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-mono border-border/30 text-muted-foreground">
                            {ec.id}
                          </Badge>
                          {ec.passThreshold && (
                            <Badge variant="outline" className="text-[9px] border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                              Pass: {ec.passThreshold} criteria
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-blue-400/70 uppercase mb-0.5">Input</p>
                          <p className="text-[11px] text-muted-foreground/90 leading-relaxed bg-black/10 dark:bg-black/30 border border-border/20 rounded p-2 font-mono">{ec.input}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400/70 uppercase mb-0.5">Expected Output</p>
                          <p className="text-[11px] text-muted-foreground/90 leading-relaxed bg-emerald-500/5 border border-emerald-500/20 rounded p-2">{ec.expectedOutput}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase mb-1">Scoring Criteria ({ec.scoringCriteria.length})</p>
                          <ul className="space-y-0.5">
                            {ec.scoringCriteria.map((c, j) => (
                              <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/80">
                                <CheckCircle2 className="h-2.5 w-2.5 shrink-0 mt-0.5 text-emerald-400" />
                                <span className="flex-1">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Guardrails Tab (NEW) */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="guardrails" className="space-y-4">
              {/* Guardrails */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4" style={{ color: agent.color }} />
                    Guardrails ({agent.guardrails.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.guardrails.map((g, i) => (
                    <div key={i} className={`rounded-lg border p-3 ${SEVERITY_COLORS[g.severity] || SEVERITY_COLORS.log}`}>
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {g.severity === 'block' ? <AlertCircle className="h-4 w-4" /> :
                           g.severity === 'warn' ? <AlertTriangle className="h-4 w-4" /> :
                           <FileText className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-xs font-semibold text-foreground">{g.rule}</h4>
                            <Badge variant="outline" className={`text-[9px] ${SEVERITY_COLORS[g.severity] || SEVERITY_COLORS.log}`}>
                              {g.severity.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground/90 leading-relaxed mb-1.5">
                            <span className="text-foreground/60 font-semibold">Why:</span> {g.rationale}
                          </p>
                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                            <span className="text-foreground/60 font-semibold">Enforcement:</span> {g.enforcement}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Decision Matrix */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GitFork className="h-4 w-4" style={{ color: agent.color }} />
                    Decision Matrix ({agent.decisionMatrix.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.decisionMatrix.map((d, i) => (
                    <div key={i} className="rounded-lg border border-border/30 bg-card/40 p-3">
                      <div className="mb-2">
                        <p className="text-[10px] text-muted-foreground/60 uppercase mb-0.5">If</p>
                        <p className="text-xs font-semibold text-foreground leading-relaxed">{d.condition}</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                        <div>
                          <p className="text-[10px] text-emerald-400/70 uppercase mb-0.5">Then</p>
                          <p className="text-[11px] text-muted-foreground/90 leading-relaxed">{d.action}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-400/70 uppercase mb-0.5">Because</p>
                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{d.rationale}</p>
                        </div>
                      </div>
                      {d.example && (
                        <div className="mt-2 pt-2 border-t border-border/20">
                          <p className="text-[10px] text-violet-400/70 uppercase mb-0.5">Example</p>
                          <p className="text-[11px] text-muted-foreground/80 leading-relaxed italic">{d.example}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Failure Modes */}
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" style={{ color: agent.color }} />
                    Failure Modes ({agent.failureModes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {agent.failureModes.map((f, i) => (
                    <div key={i} className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                        {f.failure}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-[10px] text-amber-400/70 uppercase mb-0.5">Detection</p>
                          <p className="text-muted-foreground/90 leading-relaxed">{f.detection}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400/70 uppercase mb-0.5">Mitigation</p>
                          <p className="text-muted-foreground/90 leading-relaxed">{f.mitigation}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-400/70 uppercase mb-0.5">Recovery</p>
                          <p className="text-muted-foreground/90 leading-relaxed">{f.recoveryTime || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ──────────────────────────────────────────────────────────────── */}
            {/* Config Tab */}
            {/* ──────────────────────────────────────────────────────────────── */}
            <TabsContent value="config" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" style={{ color: agent.color }} />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Model</span>
                      </div>
                      <p className="text-sm font-medium text-foreground font-mono">{agent.config.model}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Temperature</span>
                      </div>
                      <p className="text-sm font-medium text-foreground font-mono">{agent.config.temperature}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Max Tokens</span>
                      </div>
                      <p className="text-sm font-medium text-foreground font-mono">{agent.config.maxTokens.toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Schedule</span>
                      </div>
                      <p className="text-sm font-medium text-foreground capitalize">{agent.config.scheduleType.replace('_', ' ')}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Shield className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Max Concurrent</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{agent.config.maxConcurrentTasks} tasks</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Priority</span>
                      </div>
                      <p className="text-sm font-medium capitalize" style={{ color: agent.config.priority === 'critical' ? '#EF4444' : agent.config.priority === 'high' ? '#F59E0B' : '#3B82F6' }}>
                        {agent.config.priority}
                      </p>
                    </div>
                    {agent.config.topP !== undefined && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Top P</span>
                        </div>
                        <p className="text-sm font-medium text-foreground font-mono">{agent.config.topP}</p>
                      </div>
                    )}
                    {agent.config.reasoningEffort && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Brain className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Reasoning</span>
                        </div>
                        <p className="text-sm font-medium text-foreground capitalize">{agent.config.reasoningEffort}</p>
                      </div>
                    )}
                    {agent.config.presencePenalty !== undefined && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Presence Penalty</span>
                        </div>
                        <p className="text-sm font-medium text-foreground font-mono">{agent.config.presencePenalty}</p>
                      </div>
                    )}
                    {agent.config.frequencyPenalty !== undefined && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Frequency Penalty</span>
                        </div>
                        <p className="text-sm font-medium text-foreground font-mono">{agent.config.frequencyPenalty}</p>
                      </div>
                    )}
                    {agent.config.responseFormat && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Code2 className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Response Format</span>
                        </div>
                        <p className="text-sm font-medium text-foreground font-mono">{agent.config.responseFormat}</p>
                      </div>
                    )}
                    {agent.config.fallbackModel && (
                      <div className="rounded-lg border border-border/20 p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground uppercase">Fallback Model</span>
                        </div>
                        <p className="text-sm font-medium text-foreground font-mono">{agent.config.fallbackModel}</p>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border/20 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase">System Prompt Summary</span>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed italic">{agent.config.systemPromptSummary}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-2">
                      Full {agent.config.systemPromptFull.split(/\s+/).length}-word prompt available in the Prompts tab.
                    </p>
                  </div>

                  {agent.config.retryPolicy && (
                    <div className="rounded-lg border border-border/20 p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <RotateIcon />
                        <span className="text-[10px] text-muted-foreground uppercase">Retry Policy</span>
                      </div>
                      <p className="text-sm text-foreground/80">{agent.config.retryPolicy}</p>
                    </div>
                  )}

                  {agent.config.stopSequences && agent.config.stopSequences.length > 0 && (
                    <div className="rounded-lg border border-border/20 p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Code2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Stop Sequences</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.config.stopSequences.map((s, i) => (
                          <code key={i} className="text-[10px] font-mono text-foreground/70 bg-black/20 px-2 py-0.5 rounded border border-border/30">
                            {s}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Sparkles className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                See {agent.displayName} in <span className="text-gradient">Action</span>
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Deploy this agent and 7 others to autonomously discover, enrich, qualify, and engage leads 24/7.
              </p>
              <div className="mt-6">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold">
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

// Small inline icon helper for the retry-strategy indicator (avoids extra lucide imports)
function RotateIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
