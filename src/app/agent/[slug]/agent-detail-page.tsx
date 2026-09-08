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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AgentDetailPage({ agent }: { agent: AgentDetailFull }) {
  const Icon = ICON_MAP[agent.iconName] || Brain;

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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{agent.displayName}</h1>
                <Badge variant="outline" className="border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                  <Radio className="h-2.5 w-2.5 mr-0.5" />
                  Active
                </Badge>
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: hexToRgba(agent.color, 0.3), color: agent.color }}>
                  {agent.department}
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
              {['overview', 'capabilities', 'pipeline', 'knowledge', 'tools', 'metrics', 'config'].map((tab) => (
                <TabsTrigger key={tab} value={tab} className="text-xs capitalize data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400">
                  {tab === 'config' ? 'Config' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview Tab */}
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
                            <Badge key={dep} variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                              {dep}
                            </Badge>
                          )) : (
                            <span className="text-xs text-muted-foreground/50">No dependencies — operates independently</span>
                          )}
                        </div>
                      </div>
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
                </div>
              </div>
            </TabsContent>

            {/* Capabilities Tab */}
            <TabsContent value="capabilities" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.capabilities.map((cap, i) => (
                  <Card key={i} className="border-border/30 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                          <CheckCircle2 className="h-4 w-4" style={{ color: agent.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{cap.name}</h4>
                            {cap.metric && (
                              <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{cap.metric}</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{cap.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

            {/* Pipeline Tab */}
            <TabsContent value="pipeline" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4" style={{ color: agent.color }} />
                    Pipeline Stages ({agent.pipelineStages.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {agent.pipelineStages.map((stage, i) => (
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
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-foreground">{stage.stage}</h4>
                          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                            <Clock className="h-2.5 w-2.5 mr-0.5" />
                            {stage.duration}
                          </Badge>
                        </div>
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
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge Base Tab */}
            <TabsContent value="knowledge" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.knowledgeBase.map((kb, i) => (
                  <Card key={i} className="border-border/30 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                          <BookOpen className="h-4 w-4" style={{ color: agent.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-[9px] ${KB_CATEGORY_COLORS[kb.category] || ''}`}>
                              {kb.category}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">{kb.sections} sections</span>
                          </div>
                          <h4 className="text-sm font-semibold text-foreground mb-1">{kb.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{kb.summary}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Tools Tab */}
            <TabsContent value="tools" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.tools.map((tool, i) => (
                  <Card key={i} className="border-border/30 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: hexToRgba(agent.color, 0.1) }}>
                          {tool.type === 'MCP Server' ? <Server className="h-4 w-4" style={{ color: agent.color }} /> :
                           tool.type === 'API' ? <Globe className="h-4 w-4" style={{ color: agent.color }} /> :
                           tool.type === 'SDK' ? <Code2 className="h-4 w-4" style={{ color: agent.color }} /> :
                           <Wrench className="h-4 w-4" style={{ color: agent.color }} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-semibold text-foreground">{tool.name}</h4>
                            <Badge variant="outline" className={`text-[9px] ${
                              tool.status === 'connected' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' :
                              tool.status === 'available' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                              'border-gray-500/20 text-gray-400 bg-gray-500/5'
                            }`}>
                              {tool.status === 'connected' ? '● Connected' : tool.status === 'available' ? '○ Available' : '○ Needs Setup'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-1">{tool.description}</p>
                          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{tool.type}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agent.metrics.map((metric, i) => (
                  <Card key={i} className="border-border/30 bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="h-4 w-4" style={{ color: agent.color }} />
                        {metric.benchmark && (
                          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">{metric.benchmark}</Badge>
                        )}
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {metric.value}
                        {metric.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{metric.unit}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Config Tab */}
            <TabsContent value="config" className="space-y-4">
              <Card className="border-border/30 bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Settings className="h-4 w-4" style={{ color: agent.color }} />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Model</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{agent.config.model}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Temperature</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{agent.config.temperature}</p>
                    </div>
                    <div className="rounded-lg border border-border/20 p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Zap className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground uppercase">Max Tokens</span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{agent.config.maxTokens.toLocaleString()}</p>
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
                  </div>

                  <div className="rounded-lg border border-border/20 p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground uppercase">System Prompt Summary</span>
                    </div>
                    <p className="text-sm text-foreground/70 leading-relaxed italic">{agent.config.systemPromptSummary}</p>
                  </div>
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
