'use client';

/**
 * /admin/agents — Agentic System Dashboard
 * =========================================
 *
 * Live view of the LeadReach agentic system:
 *   - SOP manifest (agents, variants, phases, constraints)
 *   - MoE experts
 *   - Registered tools
 *   - Recent pipeline runs (from the telemetry ring buffer)
 *   - Aggregate stats
 *   - Run evals + safety checks on demand
 *
 * This page is intentionally lightweight — no auth gate (the admin/*
 * routes are protected by the app's middleware if needed).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Activity, Shield, Zap, RefreshCw, AlertCircle, CheckCircle2,
  Cpu, Layers, Clock, Brain, Wrench,
} from 'lucide-react';

interface AgentSpec {
  name: string;
  role: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  fallbackBehavior: string;
}

interface SOPVariantSpec {
  variant: string;
  name: string;
  description: string;
  intents: string[];
  phases: string[];
  estimatedDurationMs: number;
}

interface SOPPhaseSpec {
  index: number;
  agent: string;
  name: string;
  goal: string;
  description: string;
  successCriteria: string[];
  timeoutMs: number;
}

interface SOPManifest {
  version: string;
  publishedAt: string;
  agents: AgentSpec[];
  variants: SOPVariantSpec[];
  phases: SOPPhaseSpec[];
  constraints: {
    totalTimeoutMs: number;
    perPhaseTimeoutMs: number;
    maxTokensPerRun: number;
    maxLeadsPerRun: number;
    maxHttpRequestsPerLead: number;
    forbiddenUrlPatterns: string[];
    allowedUrlSchemes: string[];
  };
}

interface Expert {
  name: string;
  description: string;
  primaryIntents: string[];
  sopVariant: string;
  cost: number;
  estimatedLatencyMs: number;
  qualityScore: number;
}

interface ToolSchema {
  name: string;
  description: string;
  category: string;
  cost: number;
  external: boolean;
}

interface RunSummary {
  traceId: string;
  startedAt: number;
  durationMs: number;
  sopVariant: string | null;
  success: boolean;
  safetyPassed: boolean;
  safetyViolations: string[];
  campaignId?: string;
  selectedPhases: string[];
  errorMessage?: string;
}

interface RunStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  successRate: number;
  safetyPassRate: number;
  byVariant: Record<string, { total: number; successRate: number }>;
}

interface Overview {
  sop: SOPManifest;
  experts: Expert[];
  tools: ToolSchema[];
  recentRuns: RunSummary[];
  stats: RunStats;
  generatedAt: string;
}

interface SafetyReport {
  report: {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    results: Array<{ testCaseId: string; category: string; passed: boolean; reason: string; durationMs: number }>;
    runAt: string;
    durationMs: number;
  };
  constraints: { passed: boolean; issues: string[] };
}

interface EvalReport {
  totalFixtures: number;
  passed: number;
  failed: number;
  passRate: number;
  byCategory: Record<string, { total: number; passed: number; passRate: number }>;
  results: Array<{ fixtureId: string; passed: boolean; reasons: string[]; durationMs: number }>;
  runAt: string;
}

const AGENT_COLORS: Record<string, string> = {
  atlas: '#8B5CF6',
  scout: '#10B981',
  forge: '#F59E0B',
  sage: '#3B82F6',
  judge: '#EF4444',
  bard: '#EC4899',
  flow: '#06B6D4',
  echo: '#6366F1',
};

export default function AdminAgentsPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [safety, setSafety] = useState<SafetyReport | null>(null);
  const [evals, setEvals] = useState<EvalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningSafety, setRunningSafety] = useState(false);
  const [runningEvals, setRunningEvals] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/agents/overview', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
    const interval = setInterval(loadOverview, 10_000); // refresh every 10s
    return () => clearInterval(interval);
  }, [loadOverview]);

  const runSafety = async () => {
    setRunningSafety(true);
    try {
      const res = await fetch('/api/admin/agents/safety', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSafety(data);
    } catch (err) {
      console.error('Failed to run safety:', err);
    } finally {
      setRunningSafety(false);
    }
  };

  const runEvals = async () => {
    setRunningEvals(true);
    try {
      const res = await fetch('/api/admin/agents/evals?dryRun=1', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvals(data);
    } catch (err) {
      console.error('Failed to run evals:', err);
    } finally {
      setRunningEvals(false);
    }
  };

  if (loading || !overview) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading agentic system...</div>
      </div>
    );
  }

  const { sop, experts, tools, recentRuns, stats } = overview;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-violet-400" />
            LeadReach Agentic System
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            SOP v{sop.version} · published {sop.publishedAt} · {experts.length} experts · {tools.length} tools
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runSafety} disabled={runningSafety} variant="outline" size="sm">
            {runningSafety ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
            Run Safety Evals
          </Button>
          <Button onClick={runEvals} disabled={runningEvals} variant="outline" size="sm">
            {runningEvals ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Run Evals (dry-run)
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Total Runs"
          value={String(stats.totalRuns)}
          color="text-cyan-400"
        />
        <StatCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Success Rate"
          value={`${(stats.successRate * 100).toFixed(1)}%`}
          color="text-emerald-400"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Avg Duration"
          value={`${(stats.avgDurationMs / 1000).toFixed(1)}s`}
          color="text-blue-400"
        />
        <StatCard
          icon={<Shield className="h-4 w-4" />}
          label="Safety Pass Rate"
          value={`${(stats.safetyPassRate * 100).toFixed(1)}%`}
          color="text-violet-400"
        />
        <StatCard
          icon={<Layers className="h-4 w-4" />}
          label="SOP Variants"
          value={String(sop.variants.length)}
          color="text-pink-400"
        />
        <StatCard
          icon={<Cpu className="h-4 w-4" />}
          label="MoE Experts"
          value={String(experts.length)}
          color="text-amber-400"
        />
      </div>

      {/* Two-column layout: Agents | Variants */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-violet-400" />
              8-Agent Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sop.agents.map((agent, idx) => {
              const phase = sop.phases.find(p => p.agent === agent.name);
              return (
                <div
                  key={agent.name}
                  className="border border-border/40 rounded-lg p-3 space-y-2"
                  style={{ borderLeftColor: AGENT_COLORS[agent.name], borderLeftWidth: 3 }}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]" style={{ color: AGENT_COLORS[agent.name] }}>
                      #{idx + 1}
                    </Badge>
                    <span className="font-semibold capitalize">{agent.name}</span>
                    <span className="text-xs text-muted-foreground">{agent.role}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{agent.responsibilities[0]}</p>
                  {phase && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{phase.name} · timeout {phase.timeoutMs / 1000}s</span>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* SOP Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-pink-400" />
              SOP Variants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sop.variants.map((variant) => (
              <div key={variant.variant} className="border border-border/40 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{variant.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {(variant.estimatedDurationMs / 1000).toFixed(0)}s est
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{variant.description}</p>
                <div className="flex flex-wrap gap-1">
                  {variant.phases.map((p) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="text-[9px] capitalize"
                      style={{ color: AGENT_COLORS[p] }}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Intents: {variant.intents.join(', ')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Constraints */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Constraints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
            <ConstraintItem label="Total Timeout" value={`${sop.constraints.totalTimeoutMs / 1000}s`} />
            <ConstraintItem label="Per-Phase Timeout" value={`${sop.constraints.perPhaseTimeoutMs / 1000}s`} />
            <ConstraintItem label="Max Tokens/Run" value={sop.constraints.maxTokensPerRun.toLocaleString()} />
            <ConstraintItem label="Max Leads/Run" value={String(sop.constraints.maxLeadsPerRun)} />
            <ConstraintItem label="Max HTTP/Lead" value={String(sop.constraints.maxHttpRequestsPerLead)} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {sop.constraints.forbiddenUrlPatterns.map((p) => (
              <Badge key={p} variant="outline" className="text-[10px] border-red-500/20 text-red-400">
                blocked: {p}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* MoE Experts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-400" />
            MoE Experts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {experts.map((expert) => (
              <div key={expert.name} className="border border-border/40 rounded-lg p-3 space-y-1">
                <div className="font-semibold text-sm">{expert.name}</div>
                <p className="text-xs text-muted-foreground">{expert.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>cost: {expert.cost}/10</span>
                  <span>quality: {(expert.qualityScore * 100).toFixed(0)}%</span>
                  <span>~{(expert.estimatedLatencyMs / 1000).toFixed(0)}s</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-blue-400" />
            Registered Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tools.map((tool) => (
              <div key={tool.name} className="border border-border/40 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold">{tool.name}</span>
                  <Badge variant="outline" className="text-[10px] capitalize">{tool.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>cost: {tool.cost}/10</span>
                  {tool.external && <Badge variant="outline" className="text-[10px] border-amber-500/20 text-amber-400">external</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            Recent Pipeline Runs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No runs yet. Run a campaign to see telemetry here.</p>
          ) : (
            <div className="space-y-2">
              {recentRuns.map((run) => (
                <div key={run.traceId} className="border border-border/40 rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {run.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400" />
                      )}
                      <span className="font-mono text-xs">{run.traceId}</span>
                      {run.sopVariant && (
                        <Badge variant="outline" className="text-[10px]">{run.sopVariant}</Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{run.durationMs}ms</span>
                  </div>
                  {!run.safetyPassed && (
                    <div className="text-[10px] text-amber-400">
                      Safety: {run.safetyViolations.join(', ')}
                    </div>
                  )}
                  {run.errorMessage && (
                    <div className="text-[10px] text-red-400">{run.errorMessage}</div>
                  )}
                  {run.selectedPhases.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {run.selectedPhases.map((p) => (
                        <Badge
                          key={p}
                          variant="outline"
                          className="text-[9px] capitalize"
                          style={{ color: AGENT_COLORS[p] }}
                        >
                          {p}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Report */}
      {safety && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" />
              Safety Eval Report
              <Badge variant="outline" className="ml-auto">
                {safety.report.passed}/{safety.report.totalTests} passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={safety.report.passRate * 100} className="h-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {safety.report.results.map((r) => (
                <div
                  key={r.testCaseId}
                  className={`border rounded p-2 text-xs ${
                    r.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {r.passed ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-400" />
                    )}
                    <span className="font-mono">{r.testCaseId}</span>
                    <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground text-[10px]">{r.reason}</p>
                </div>
              ))}
            </div>
            {!safety.constraints.passed && (
              <div className="text-xs text-red-400">
                Constraint issues: {safety.constraints.issues.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Eval Report */}
      {evals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              Eval Suite Report (dry-run)
              <Badge variant="outline" className="ml-auto">
                {evals.passed}/{evals.totalFixtures} passed
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={evals.passRate * 100} className="h-2" />
            {Object.entries(evals.byCategory).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between text-xs">
                <span className="capitalize">{cat.replace(/_/g, ' ')}</span>
                <span>{data.passed}/{data.total} ({(data.passRate * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Sub-components ──

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="border border-border/40 rounded-lg p-3 space-y-1">
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

function ConstraintItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/40 rounded p-2">
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="font-mono text-sm">{value}</div>
    </div>
  );
}
