'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Circle,
  Search,
  Database,
  Star,
  Mail,
  ExternalLink,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  Globe,
  Phone,
  MapPin,
  Users,
  Building2,
  Link2,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { safeFetchJSON } from '@/lib/utils';
import type { LeadTier } from '@/lib/types';
import { TIER_COLORS } from '@/lib/types';

// ============================================================
// Types
// ============================================================

interface PipelineStageStatus {
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  result?: Record<string, unknown>;
  input?: Record<string, unknown>;
  logs?: Array<{ timestamp: string; message: string; type: string; data?: Record<string, unknown> }>;
}

interface LeadData {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  subIndustry: string | null;
  city: string | null;
  country: string | null;
  stateProvince: string | null;
  hqAddress: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  linkedinUrl: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  foundingYear: string | null;
  ownershipType: string | null;
  stage: string;
  leadTier: string | null;
  leadScore: number | null;
  dataCompleteness: number | null;
  firmographicScore: number | null;
  intentScore: number | null;
  reachabilityScore: number | null;
  strategicScore: number | null;
  sources: string[];
  description: string | null;
  createdAt: string | null;
  enrichedAt: string | null;
  qualifiedAt: string | null;
}

interface PipelineStatusResponse {
  campaignId: string;
  campaignName: string;
  campaignDescription: string | null;
  targetIndustry: string | null;
  targetLocation: string | null;
  targetCompanySize: string | null;
  pipelineStatus: 'idle' | 'running' | 'completed' | 'failed';
  overallProgress: number;
  currentStage: string;
  stages: Record<string, PipelineStageStatus>;
  timeline: Array<{
    timestamp: string;
    stage: string;
    message: string;
    type: string;
    data?: Record<string, unknown>;
  }>;
  summary: {
    leadsFound: number;
    leadsEnriched: number;
    leadsQualified: number;
    leadsContacted: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
  };
  leads: LeadData[];
  outreach: Array<{
    id: string;
    leadId: string;
    channel: string;
    type: string;
    subject: string | null;
    status: string;
    createdAt: string | null;
  }>;
  errors: Array<{ agent: string; error: string }>;
}

// Pipeline stage definitions with visual configuration
const PIPELINE_STAGES = [
  {
    key: 'prospect-discovery',
    label: 'Prospect Discovery',
    description: 'Searching for companies matching your criteria using multiple channels',
    icon: Search,
    color: '#10B981',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    agentName: 'Prospect Discovery Agent',
    channels: ['Exa Search', 'Web Search', 'LinkedIn', 'OpenSrc', 'Knowledge Base'],
  },
  {
    key: 'data-enrichment',
    label: 'Data Enrichment',
    description: 'Enriching leads with real contact data from web sources',
    icon: Database,
    color: '#3B82F6',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    agentName: 'Data Enrichment Agent',
    channels: ['Web Search', 'Company Websites', 'OpenSrc', 'LLM Extraction'],
  },
  {
    key: 'lead-qualification',
    label: 'Lead Qualification',
    description: 'Scoring and qualifying leads based on ICP fit criteria',
    icon: Star,
    color: '#F59E0B',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    agentName: 'Lead Qualification Agent',
    channels: ['Scoring Algorithm', 'ICP Matching', 'OpenSrc'],
  },
  {
    key: 'outreach-composer',
    label: 'Outreach Composer',
    description: 'Generating personalized outreach for qualified leads',
    icon: Mail,
    color: '#EC4899',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    textColor: 'text-pink-400',
    agentName: 'Outreach Composer Agent',
    channels: ['Template Engine', 'Personalization', 'OpenSrc'],
  },
] as const;

// ============================================================
// Component
// ============================================================

export function PipelineExecutionView() {
  const { setActiveView, pipelineExecutionCampaignId, setPipelineExecutionCampaignId, bumpDataVersion } = useAppStore();
  const [status, setStatus] = useState<PipelineStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const pollingRef = useRef(false);
  const pollingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineEndRef = useRef<HTMLDivElement>(null);
  const prevStageRef = useRef<string>('');
  const campaignIdRef = useRef<string | null>(pipelineExecutionCampaignId);

  // Keep the ref in sync so the polling callback always has the latest value
  useEffect(() => {
    campaignIdRef.current = pipelineExecutionCampaignId;
  }, [pipelineExecutionCampaignId]);

  // Auto-scroll timeline to bottom on new entries
  useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [status?.timeline?.length]);

  // Stop polling helper (stable — no deps that change)
  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  // Fetch pipeline status — reads campaign ID from ref to avoid stale closures
  const fetchStatus = useCallback(async () => {
    const cid = campaignIdRef.current;
    if (!cid) return undefined;
    try {
      const data = await safeFetchJSON<PipelineStatusResponse>(
        `/api/campaigns/${cid}/pipeline-status`
      );
      setStatus(data);
      setError(null);
      return data.pipelineStatus;
    } catch (err) {
      console.error('Error fetching pipeline status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pipeline status');
      return undefined;
    }
  }, []);

  // Start polling — uses fetchStatus ref so it always calls the latest version
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = true;

    const poll = async () => {
      const pipelineStatus = await fetchStatus();
      if (pipelineStatus !== 'running') {
        stopPolling();
        bumpDataVersion(); // Notify all views that pipeline finished
      }
    };

    pollingTimerRef.current = setInterval(poll, 3000);
  }, [fetchStatus, stopPolling, bumpDataVersion]);

  // Initial load + polling
  useEffect(() => {
    if (!pipelineExecutionCampaignId) {
      return;
    }

    let cancelled = false;

    // Schedule state updates asynchronously to avoid synchronous setState in effect body
    Promise.resolve().then(() => {
      if (cancelled) return;
      setLoading(true);
      setError(null);
    });

    fetchStatus().then((pipelineStatus) => {
      if (cancelled) return;
      setLoading(false);
      // Start polling if pipeline is running
      if (pipelineStatus === 'running') {
        startPolling();
      }
    });

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [pipelineExecutionCampaignId, fetchStatus, startPolling, stopPolling]);

  // Auto-expand the current running stage
  useEffect(() => {
    if (status?.currentStage && status.currentStage !== prevStageRef.current) {
      prevStageRef.current = status.currentStage;
      // Schedule to avoid synchronous setState in effect
      const stage = status.currentStage;
      requestAnimationFrame(() => setExpandedStage(stage));
    }
  }, [status?.currentStage]);

  // Handle start pipeline
  const handleStartPipeline = async () => {
    if (!pipelineExecutionCampaignId) return;
    try {
      const result = await safeFetchJSON<{
        started: boolean;
        status: string;
        message?: string;
      }>(`/api/campaigns/${pipelineExecutionCampaignId}/run-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (result.started) {
        startPolling();
        // Fetch initial status immediately
        fetchStatus();
      }
    } catch (error) {
      console.error('Error starting pipeline:', error);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    stopPolling();
    setPipelineExecutionCampaignId(null);
    setActiveView('campaigns');
  };

  // Handle navigate to leads view
  const handleViewLeads = () => {
    stopPolling();
    setActiveView('leads');
  };

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">Loading pipeline execution...</p>
        </div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="mt-3 text-sm text-red-400">{error}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button variant="outline" onClick={() => { setError(null); setLoading(true); fetchStatus().then(() => setLoading(false)); }}>
              Retry
            </Button>
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="mt-3 text-sm text-muted-foreground">No campaign selected for pipeline execution.</p>
          <Button variant="outline" className="mt-4" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  const isRunning = status.pipelineStatus === 'running';
  const isCompleted = status.pipelineStatus === 'completed';
  const isFailed = status.pipelineStatus === 'failed';
  const isIdle = status.pipelineStatus === 'idle';

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              {status.campaignName}
              {isRunning && (
                <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running
                </Badge>
              )}
              {isCompleted && (
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
              {isFailed && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              )}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {status.targetIndustry && <span>{status.targetIndustry}</span>}
              {status.targetIndustry && status.targetLocation && <span className="text-border">|</span>}
              {status.targetLocation && <span>{status.targetLocation}</span>}
              {status.targetCompanySize && (
                <>
                  <span className="text-border">|</span>
                  <span>{status.targetCompanySize} employees</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isIdle && (
            <Button
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
              onClick={handleStartPipeline}
            >
              <Zap className="h-4 w-4" />
              Start Pipeline
            </Button>
          )}
          {status.leads.length > 0 && (
            <Button
              variant="outline"
              className="border-border/40 gap-2"
              onClick={handleViewLeads}
            >
              <Users className="h-4 w-4" />
              View All Leads
            </Button>
          )}
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {[
          { label: 'Found', value: status.summary.leadsFound, color: 'text-emerald-400' },
          { label: 'Enriched', value: status.summary.leadsEnriched, color: 'text-blue-400' },
          { label: 'Qualified', value: status.summary.leadsQualified, color: 'text-amber-400' },
          { label: 'Contacted', value: status.summary.leadsContacted, color: 'text-pink-400' },
          { label: 'Hot', value: status.summary.hotLeads, color: 'text-red-400' },
          { label: 'Warm', value: status.summary.warmLeads, color: 'text-amber-400' },
          { label: 'Cold', value: status.summary.coldLeads, color: 'text-blue-400' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-secondary/20 border border-border/20 p-2.5 text-center"
          >
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Overall Progress */}
      {(isRunning || isCompleted) && (
        <div className="rounded-lg bg-secondary/20 border border-border/20 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Overall Pipeline Progress</span>
            <span className={`text-xs font-bold ${isCompleted ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {status.overallProgress}%
            </span>
          </div>
          <Progress value={status.overallProgress} className={`h-2 bg-secondary/40`} />
          <div className="flex gap-1 mt-2">
            {PIPELINE_STAGES.map((stage) => {
              const stageStatus = status.stages[stage.key];
              const isStageRunning = stageStatus?.status === 'running';
              const isStageDone = stageStatus?.status === 'completed';
              const isStageFailed = stageStatus?.status === 'failed';
              return (
                <div
                  key={stage.key}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    isStageDone
                      ? 'bg-emerald-400'
                      : isStageRunning
                      ? 'bg-cyan-400 animate-pulse'
                      : isStageFailed
                      ? 'bg-red-400'
                      : 'bg-secondary/30'
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            {PIPELINE_STAGES.map((stage) => (
              <span key={stage.key} className="flex-1 text-center text-[9px] text-muted-foreground">
                {stage.label.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content: Pipeline Stages + Timeline + Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Pipeline Stages */}
        <div className="lg:col-span-2 space-y-3">
          {PIPELINE_STAGES.map((stage, index) => {
            const stageStatus = status.stages[stage.key];
            const isStageRunning = stageStatus?.status === 'running';
            const isStageDone = stageStatus?.status === 'completed';
            const isStagePending = !stageStatus || stageStatus?.status === 'pending';
            const isStageFailed = stageStatus?.status === 'failed';
            const isExpanded = expandedStage === stage.key;

            return (
              <Card
                key={stage.key}
                className={`border transition-all duration-300 ${
                  isStageRunning
                    ? `${stage.borderColor} bg-card shadow-lg`
                    : isStageDone
                    ? 'border-emerald-500/20 bg-card'
                    : isStageFailed
                    ? 'border-red-500/20 bg-card'
                    : 'border-border/20 bg-card/60'
                }`}
              >
                <CardContent
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                >
                  <div className="flex items-center gap-3">
                    {/* Stage Number + Icon */}
                    <div
                      className={`flex items-center justify-center h-10 w-10 rounded-lg shrink-0 ${
                        isStageRunning
                          ? `${stage.bgColor} ${stage.textColor}`
                          : isStageDone
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isStageFailed
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-secondary/20 text-muted-foreground/50'
                      }`}
                    >
                      {isStageRunning ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : isStageDone ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : isStageFailed ? (
                        <AlertCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{stage.label}</h3>
                        {isStageRunning && (
                          <Badge className={`text-[9px] ${stage.bgColor} ${stage.textColor} border-0`}>
                            Running
                          </Badge>
                        )}
                        {isStageDone && (
                          <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-0">
                            Complete
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isStageRunning
                          ? stage.description
                          : isStageDone
                          ? `Completed${stageStatus?.completedAt ? ` at ${new Date(stageStatus.completedAt).toLocaleTimeString()}` : ''}`
                          : isStagePending
                          ? 'Waiting for previous stage to complete'
                          : stage.description}
                      </p>

                      {/* Progress bar for running stages */}
                      {isStageRunning && (
                        <div className="mt-2">
                          <Progress value={stageStatus?.progress || 0} className="h-1 bg-secondary/40" />
                        </div>
                      )}
                    </div>

                    {/* Expand Icon */}
                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {/* Channels Used */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                          <Globe className="h-3 w-3" />
                          Data Sources & Channels
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {stage.channels.map((channel) => (
                            <Badge
                              key={channel}
                              variant="outline"
                              className={`text-[10px] ${
                                isStageRunning || isStageDone
                                  ? `${stage.borderColor} ${stage.textColor}`
                                  : 'border-border/20 text-muted-foreground/50'
                              }`}
                            >
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Search Query (for discovery) */}
                      {stage.key === 'prospect-discovery' && stageStatus?.input && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <Search className="h-3 w-3" />
                            Search Parameters
                          </h4>
                          <div className="rounded-md bg-secondary/20 p-2.5 text-xs space-y-1">
                            {String(stageStatus.input.query || '') && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground shrink-0">Query:</span>
                                <span className="text-foreground font-medium">{String(stageStatus.input.query)}</span>
                              </div>
                            )}
                            {String(stageStatus.input.industry || '') && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground shrink-0">Industry:</span>
                                <span className="text-foreground">{String(stageStatus.input.industry)}</span>
                              </div>
                            )}
                            {String(stageStatus.input.location || '') && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground shrink-0">Location:</span>
                                <span className="text-foreground">{String(stageStatus.input.location)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Execution Logs */}
                      {stageStatus?.logs && stageStatus.logs.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <Activity className="h-3 w-3" />
                            Execution Log
                          </h4>
                          <ScrollArea className="max-h-48 rounded-md bg-secondary/20 p-2.5">
                            <div className="space-y-1.5">
                              {stageStatus.logs.map((log, logIdx) => (
                                <div key={logIdx} className="flex items-start gap-2 text-xs">
                                  <span className="shrink-0 text-muted-foreground/50 mt-0.5">
                                    {log.type === 'start' || log.type === 'complete' ? (
                                      <Zap className="h-3 w-3" />
                                    ) : log.type === 'search' ? (
                                      <Search className="h-3 w-3" />
                                    ) : log.type === 'source' ? (
                                      <Globe className="h-3 w-3" />
                                    ) : log.type === 'enrichment' ? (
                                      <Database className="h-3 w-3" />
                                    ) : log.type === 'result' ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    ) : log.type === 'error' ? (
                                      <AlertCircle className="h-3 w-3 text-red-400" />
                                    ) : (
                                      <Circle className="h-3 w-3" />
                                    )}
                                  </span>
                                  <span className="text-foreground/80">{log.message}</span>
                                  {log.timestamp && (
                                    <span className="text-muted-foreground/40 ml-auto shrink-0">
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Result Summary */}
                      {stageStatus?.result && isStageDone && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                            Result
                          </h4>
                          <div className="rounded-md bg-emerald-500/5 border border-emerald-500/10 p-2.5 text-xs">
                            {stage.key === 'prospect-discovery' && (
                              <span className="text-emerald-400">
                                Found {(stageStatus.result.found as number) || 0} companies, created {(stageStatus.result.leadsCreated as number) || 0} leads
                              </span>
                            )}
                            {stage.key === 'data-enrichment' && (
                              <span className="text-blue-400">
                                Enriched {(stageStatus.result.enriched as number) || 0} leads with real contact data
                              </span>
                            )}
                            {stage.key === 'lead-qualification' && (
                              <span className="text-amber-400">
                                Qualified {(stageStatus.result.qualified as number) || 0} leads: {(stageStatus.result.hot as number) || 0} hot, {(stageStatus.result.warm as number) || 0} warm
                              </span>
                            )}
                            {stage.key === 'outreach-composer' && (
                              <span className="text-pink-400">
                                Generated outreach for {(stageStatus.result.contacted as number) || 0} leads
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error Display */}
                      {isStageFailed && stageStatus?.error && (
                        <div className="rounded-md bg-red-500/5 border border-red-500/10 p-2.5 text-xs text-red-400">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          {stageStatus.error}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Right Column: Live Leads + Timeline */}
        <div className="space-y-4">
          {/* Execution Timeline */}
          <Card className="border-border/20">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Execution Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-48">
                {status.timeline.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-muted-foreground/50">
                      {isIdle ? 'Pipeline not started yet' : 'Waiting for execution logs...'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {status.timeline.map((entry, idx) => {
                      const stage = PIPELINE_STAGES.find(s => s.key === entry.stage);
                      return (
                        <div key={idx} className="flex items-start gap-2 text-xs">
                          <div
                            className="shrink-0 mt-1 h-2 w-2 rounded-full"
                            style={{ backgroundColor: stage?.color || '#6b7280' }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-foreground/80">{entry.message}</span>
                            {entry.timestamp && (
                              <span className="text-muted-foreground/40 ml-1.5">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={timelineEndRef} />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Live Leads Table */}
          <Card className="border-border/20">
            <CardHeader className="p-3 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="h-3 w-3" />
                  Discovered Leads
                  {status.leads.length > 0 && (
                    <Badge variant="outline" className="text-[9px] border-border/20 ml-1">
                      {status.leads.length}
                    </Badge>
                  )}
                </CardTitle>
                {isRunning && (
                  <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <ScrollArea className="h-[calc(100vh-480px)] min-h-[300px]">
                {status.leads.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="h-6 w-6 mx-auto text-muted-foreground/20" />
                    <p className="mt-2 text-xs text-muted-foreground/50">
                      {isIdle
                        ? 'Start the pipeline to discover leads'
                        : isRunning
                        ? 'Agents are searching for leads...'
                        : 'No leads found'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {status.leads.map((lead) => {
                      const isLeadExpanded = expandedLead === lead.id;
                      const tierColor = lead.leadTier
                        ? TIER_COLORS[lead.leadTier as LeadTier] || ''
                        : '';

                      return (
                        <div
                          key={lead.id}
                          className={`rounded-md border transition-all cursor-pointer ${
                            isLeadExpanded
                              ? 'bg-secondary/30 border-border/40'
                              : 'bg-secondary/10 border-border/15 hover:bg-secondary/20'
                          }`}
                          onClick={() => setExpandedLead(isLeadExpanded ? null : lead.id)}
                        >
                          <div className="p-2 flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-foreground/90 truncate">
                                  {lead.companyName}
                                </span>
                                {lead.leadTier && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[8px] px-1 py-0 ${tierColor}`}
                                  >
                                    {lead.leadTier}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-muted-foreground/60">
                                  {lead.industry || 'Unknown Industry'}
                                </span>
                                {lead.city && (
                                  <>
                                    <span className="text-[10px] text-muted-foreground/30">/</span>
                                    <span className="text-[10px] text-muted-foreground/60">
                                      {lead.city}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center gap-1">
                              {lead.leadScore !== null && (
                                <span className="text-[10px] font-medium text-foreground/60">
                                  {lead.leadScore}%
                                </span>
                              )}
                              {isLeadExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Lead Details */}
                          {isLeadExpanded && (
                            <div className="px-2 pb-2 border-t border-border/10" onClick={(e) => e.stopPropagation()}>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
                                {lead.keyContactName && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Users className="h-3 w-3 text-emerald-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.keyContactName}</span>
                                    {lead.keyContactTitle && (
                                      <span className="text-muted-foreground/50 truncate">({lead.keyContactTitle})</span>
                                    )}
                                  </div>
                                )}
                                {lead.ceoName && !lead.keyContactName && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Users className="h-3 w-3 text-emerald-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.ceoName} (CEO)</span>
                                  </div>
                                )}
                                {lead.phoneMain && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Phone className="h-3 w-3 text-blue-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.phoneMain}</span>
                                  </div>
                                )}
                                {(lead.generalEmail || lead.keyContactEmail) && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Mail className="h-3 w-3 text-pink-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.keyContactEmail || lead.generalEmail}</span>
                                  </div>
                                )}
                                {lead.hqAddress && (
                                  <div className="flex items-center gap-1.5 text-[10px] col-span-2">
                                    <MapPin className="h-3 w-3 text-amber-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.hqAddress}</span>
                                  </div>
                                )}
                                {lead.website && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Link2 className="h-3 w-3 text-cyan-400/60 shrink-0" />
                                    <span className="text-foreground/70 truncate">{lead.website.replace('https://', '').replace('http://', '')}</span>
                                  </div>
                                )}
                                {lead.employeeCount && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <Building2 className="h-3 w-3 text-violet-400/60 shrink-0" />
                                    <span className="text-foreground/70">{lead.employeeCount} emp</span>
                                  </div>
                                )}
                                {lead.revenueEstimate && (
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-muted-foreground/50 shrink-0">$</span>
                                    <span className="text-foreground/70">{lead.revenueEstimate}</span>
                                  </div>
                                )}
                              </div>

                              {/* Data Provenance */}
                              <div className="mt-2 pt-1.5 border-t border-border/10">
                                <h5 className="text-[9px] font-medium text-muted-foreground/50 mb-1">How we found this data</h5>
                                <div className="flex flex-wrap gap-1">
                                  {lead.sources && lead.sources.length > 0 ? (
                                    lead.sources.map((source: string, srcIdx: number) => (
                                      <Badge
                                        key={srcIdx}
                                        variant="outline"
                                        className="text-[8px] border-border/15 text-muted-foreground/50 px-1 py-0"
                                      >
                                        {source === 'knowledge_base' ? 'Knowledge Base' : source}
                                      </Badge>
                                    ))
                                  ) : (
                                    <Badge variant="outline" className="text-[8px] border-border/15 text-muted-foreground/50 px-1 py-0">
                                      Knowledge Base
                                    </Badge>
                                  )}
                                  {lead.enrichedAt && (
                                    <Badge variant="outline" className="text-[8px] border-border/15 text-blue-400/50 px-1 py-0">
                                      Web Enrichment
                                    </Badge>
                                  )}
                                  {lead.qualifiedAt && (
                                    <Badge variant="outline" className="text-[8px] border-border/15 text-amber-400/50 px-1 py-0">
                                      AI Qualification
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Score Breakdown */}
                              {lead.leadScore !== null && (
                                <div className="mt-2 pt-1.5 border-t border-border/10">
                                  <h5 className="text-[9px] font-medium text-muted-foreground/50 mb-1.5">Score Breakdown</h5>
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                    {[
                                      { label: 'Firmographic', value: lead.firmographicScore, color: 'bg-emerald-400' },
                                      { label: 'Intent', value: lead.intentScore, color: 'bg-cyan-400' },
                                      { label: 'Reachability', value: lead.reachabilityScore, color: 'bg-blue-400' },
                                      { label: 'Strategic', value: lead.strategicScore, color: 'bg-amber-400' },
                                    ].map((score) => (
                                      <div key={score.label} className="flex items-center gap-1.5">
                                        <div className="w-12 h-1 bg-secondary/30 rounded-full overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${score.color}`}
                                            style={{ width: `${score.value || 0}%` }}
                                          />
                                        </div>
                                        <span className="text-[9px] text-muted-foreground/50">
                                          {score.label} {score.value || 0}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-2 pt-1.5 border-t border-border/10 flex items-center gap-2">
                                {lead.website && (
                                  <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-cyan-400/70 hover:text-cyan-400 flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    Website
                                  </a>
                                )}
                                {lead.linkedinUrl && (
                                  <a
                                    href={lead.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-blue-400/70 hover:text-blue-400 flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" />
                                    LinkedIn
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Outreach Preview */}
          {status.outreach.length > 0 && (
            <Card className="border-border/20">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3 w-3" />
                  Outreach Generated
                  <Badge variant="outline" className="text-[9px] border-border/20 ml-1">
                    {status.outreach.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <ScrollArea className="max-h-40">
                  <div className="space-y-1.5">
                    {status.outreach.map((msg) => {
                      const lead = status.leads.find(l => l.id === msg.leadId);
                      return (
                        <div key={msg.id} className="rounded-md bg-secondary/10 p-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-foreground/80 truncate">
                              {lead?.companyName || 'Unknown'}
                            </span>
                            <Badge variant="outline" className="text-[8px] border-border/15 px-1 py-0">
                              {msg.status}
                            </Badge>
                          </div>
                          {msg.subject && (
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                              {msg.subject}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
