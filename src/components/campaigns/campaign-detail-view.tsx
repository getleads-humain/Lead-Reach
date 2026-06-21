'use client';

/**
 * CampaignDetailView
 * ==================
 * The dedicated detail page for a single campaign. Replaces the old
 * "Detail Dialog" that was just a modal inside CampaignsView.
 *
 * Behavior:
 *   - Reads `selectedCampaignId` from the Zustand store
 *   - Fetches campaign + leads via GET /api/campaigns/[id]/with-leads
 *   - Shows campaign header (name, description, industry, location, status)
 *   - Shows "Run Discovery Pipeline" button (triggers SSE)
 *   - During pipeline execution, shows live 8-agent pipeline visualization
 *     (Atlas→Scout→Forge→Sage→Judge→Bard→Flow→Echo) with real-time events
 *   - Shows discovered Leads as cards that update in real-time
 *   - Click a lead → navigate to the Leads view with that lead selected
 *   - "Back to Campaigns" button → returns to campaigns list
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  RotateCw,
  Loader2,
  ExternalLink,
  Globe,
  MapPin,
  Building2,
  Users,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  Eye,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/lib/store';
import { AGENT_8_DISPLAY } from '@/lib/prospect-agent/orchestrator-types';

// ── Types ──────────────────────────────────────────────────────────

interface Lead {
  id: string;
  companyName: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string | null;
  employeeCount: string | null;
  generalEmail: string | null;
  phoneMain: string | null;
  ceoName: string | null;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  linkedinUrl: string | null;
  stage: string;
  leadScore: number;
  leadTier: string;
  dataCompleteness: number;
  notes: string | null;
  discoveredAt: string | null;
  enrichedAt: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetIndustry: string | null;
  targetLocation: string | null;
  targetCompanySize: string | null;
  leadsFound: number;
  leadsQualified: number;
  leadsContacted: number;
  leadsResponded: number;
  createdAt: string;
  _count?: { leads: number };
}

interface AgentState {
  persona: string;
  status: 'idle' | 'thinking' | 'working' | 'completed' | 'failed' | 'skipped';
  currentStep: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
}

interface PipelineState {
  phase: string;
  overallProgress: number;
  agents: Record<string, AgentState>;
  commLog: Array<{ from: string; to: string; type: string; content: string; timestamp: string }>;
}

interface LiveLead {
  id: string;
  companyName: string;
  website: string | null;
  stage: 'new' | 'enriched' | 'failed';
  dataCompleteness: number;
  snippet?: string;
}

// ── Component ──────────────────────────────────────────────────────

export function CampaignDetailView() {
  const { selectedCampaignId, setActiveView, setSelectedCampaignId, setSelectedLeadId } = useAppStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pipeline state
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [pipelineState, setPipelineState] = useState<PipelineState | null>(null);
  const [pipelineLog, setPipelineLog] = useState<Array<{ type: string; data: Record<string, unknown>; timestamp: number }>>([]);
  const [liveLeads, setLiveLeads] = useState<LiveLead[]>([]);
  const [currentEnrichmentIdx, setCurrentEnrichmentIdx] = useState(0);
  const [enrichmentTotal, setEnrichmentTotal] = useState(0);
  const [thinkingMs, setThinkingMs] = useState(0);
  const [pipelineSummary, setPipelineSummary] = useState<{ discovered: number; enriched: number; failed: number; skipped: number } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // ── Load campaign + leads ──
  const loadCampaignData = useCallback(async () => {
    if (!selectedCampaignId) {
      setError('No campaign selected');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns/${selectedCampaignId}/with-leads`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Failed to load campaign (${res.status})`);
      }
      const data = await res.json();
      setCampaign(data.campaign || data);
      setLeads(data.leads || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    loadCampaignData();
  }, [loadCampaignData]);

  // ── Run pipeline via SSE ──
  const runPipeline = useCallback(async () => {
    if (!selectedCampaignId || pipelineRunning) return;

    setPipelineRunning(true);
    setPipelineState(null);
    setPipelineLog([]);
    setLiveLeads([]);
    setCurrentEnrichmentIdx(0);
    setEnrichmentTotal(0);
    setThinkingMs(0);
    setPipelineSummary(null);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 285_000);

    let response: Response;
    try {
      response = await fetch(`/api/campaigns/${selectedCampaignId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({ enrichCount: 3 }),
        signal: controller.signal,
      });
    } catch (err) {
      setPipelineRunning(false);
      setError(err instanceof Error ? err.message : 'Failed to connect to pipeline stream');
      clearTimeout(timeoutId);
      return;
    }

    if (!response.ok || !response.body) {
      setPipelineRunning(false);
      setError(`Pipeline stream failed to start (HTTP ${response.status})`);
      clearTimeout(timeoutId);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let currentEventType = '';
    let lastThinkTime = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            let data: Record<string, unknown>;
            try {
              data = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            // Append to log
            setPipelineLog(prev => [
              ...prev,
              { type: currentEventType, data, timestamp: Date.now() },
            ].slice(-200)); // keep last 200 events

            // Handle each event type
            switch (currentEventType) {
              case 'stream_open':
                // Stream confirmed alive
                break;

              case 'pipeline_progress': {
                const phase = data.phase as string;
                const overall = (data.overallProgress as number) || 0;
                setPipelineState(prev => ({
                  phase,
                  overallProgress: overall,
                  agents: prev?.agents || {},
                  commLog: prev?.commLog || [],
                }));
                if (data.enrichmentTotal) setEnrichmentTotal(data.enrichmentTotal as number);
                if (data.enrichmentIndex) setCurrentEnrichmentIdx(data.enrichmentIndex as number);
                break;
              }

              case 'step_start':
                // Update current step
                break;

              case 'step_complete':
                // Mark step done
                break;

              case 'lead_created': {
                const newLead: LiveLead = {
                  id: data.leadId as string,
                  companyName: data.companyName as string,
                  website: data.website as string | null,
                  stage: 'new',
                  dataCompleteness: 5,
                };
                setLiveLeads(prev => {
                  if (prev.some(l => l.id === newLead.id)) return prev;
                  return [...prev, newLead];
                });
                break;
              }

              case 'enrichment_start': {
                setCurrentEnrichmentIdx(data.index as number);
                setEnrichmentTotal(data.total as number);
                setThinkingMs(0);
                break;
              }

              case 'lead_enriched': {
                const leadId = data.leadId as string;
                setLiveLeads(prev =>
                  prev.map(l =>
                    l.id === leadId
                      ? {
                          ...l,
                          stage: 'enriched',
                          dataCompleteness: (data.dataCompleteness as number) || l.dataCompleteness,
                        }
                      : l,
                  ),
                );
                break;
              }

              case 'agent_status': {
                const agentKey = data.agent as string;
                setPipelineState(prev => ({
                  ...(prev || { phase: 'enrichment', overallProgress: 0, commLog: [] }),
                  agents: {
                    ...(prev?.agents || {}),
                    [agentKey]: {
                      persona: agentKey,
                      status: data.state as AgentState['status'],
                      currentStep: (data.currentStep as string) || '',
                      progress: (data.progress as number) || 0,
                      startedAt: (data.startedAt as string) || null,
                      completedAt: (data.completedAt as string) || null,
                    },
                  },
                }));
                break;
              }

              case 'agent_comm': {
                const comm = {
                  from: data.from as string,
                  to: data.to as string,
                  type: data.type as string,
                  content: data.content as string,
                  timestamp: new Date().toISOString(),
                };
                setPipelineState(prev => ({
                  ...(prev || { phase: 'enrichment', overallProgress: 0, agents: {} }),
                  commLog: [...(prev?.commLog || []), comm].slice(-50),
                }));
                break;
              }

              case 'thinking_tick': {
                const elapsed = data.elapsedMs as number;
                if (elapsed > lastThinkTime) {
                  setThinkingMs(elapsed);
                  lastThinkTime = elapsed;
                }
                break;
              }

              case 'cooldown':
                // Show cooldown message in log
                break;

              case 'error':
                // Show error
                if (data.message) {
                  console.warn('[Pipeline] Error:', data.message);
                }
                break;

              case 'done': {
                const summary = data.summary as { discovered: number; enriched: number; failed: number; skipped: number };
                setPipelineSummary(summary);
                setPipelineRunning(false);
                // Reload leads to get the final state from DB
                setTimeout(() => loadCampaignData(), 500);
                break;
              }
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        // User cancelled or timeout — that's fine
      } else {
        console.error('[Pipeline] Stream error:', err);
        setError(err instanceof Error ? err.message : 'Pipeline stream failed');
      }
    } finally {
      setPipelineRunning(false);
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
    }
  }, [selectedCampaignId, pipelineRunning, loadCampaignData]);

  // ── Cancel pipeline ──
  const cancelPipeline = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setPipelineRunning(false);
  }, []);

  // ── Navigate to lead in Leads view ──
  const viewLeadInLeads = useCallback((leadId: string) => {
    setSelectedLeadId(leadId);
    setSelectedCampaignId(selectedCampaignId);
    setActiveView('leads');
  }, [selectedCampaignId, setActiveView, setSelectedCampaignId, setSelectedLeadId]);

  // ── Auto-scroll log to bottom ──
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [pipelineLog]);

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => setActiveView('campaigns')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </Button>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const totalLeads = leads.length + liveLeads.filter(ll => !leads.some(l => l.id === ll.id)).length;
  const enrichedCount = leads.filter(l => l.stage === 'enriched').length + liveLeads.filter(ll => ll.stage === 'enriched').length;

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView('campaigns')}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Campaigns
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground truncate">{campaign.name}</h1>
              <Badge
                variant="outline"
                className={`text-xs ${
                  campaign.status === 'active'
                    ? 'border-emerald-500/30 text-emerald-400'
                    : campaign.status === 'completed'
                    ? 'border-cyan-500/30 text-cyan-400'
                    : campaign.status === 'paused'
                    ? 'border-amber-500/30 text-amber-400'
                    : 'border-zinc-500/30 text-zinc-400'
                }`}
              >
                {campaign.status}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{campaign.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              {campaign.targetIndustry && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {campaign.targetIndustry}
                </span>
              )}
              {campaign.targetLocation && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {campaign.targetLocation}
                </span>
              )}
              {campaign.targetCompanySize && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {campaign.targetCompanySize}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {pipelineRunning ? (
            <Button variant="outline" onClick={cancelPipeline} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
              <XCircle className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          ) : (
            <Button
              onClick={runPipeline}
              disabled={pipelineRunning}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
            >
              {totalLeads > 0 ? (
                <>
                  <RotateCw className="h-4 w-4" />
                  Run Discovery Pipeline Again
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Run Discovery Pipeline
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Discovered</p>
                <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
              </div>
              <Target className="h-5 w-5 text-cyan-400/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Enriched</p>
                <p className="text-2xl font-bold text-foreground">{enrichedCount}</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-emerald-400/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {leads.length > 0
                    ? Math.round(leads.reduce((sum, l) => sum + (l.leadScore || 0), 0) / leads.length)
                    : 0}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-violet-400/60" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hot Leads</p>
                <p className="text-2xl font-bold text-foreground">
                  {leads.filter(l => l.leadTier === 'hot').length}
                </p>
              </div>
              <Zap className="h-5 w-5 text-amber-400/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Visualization (when running) */}
      <AnimatePresence>
        {pipelineRunning && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="bg-card/30 border-cyan-500/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    Pipeline Running
                    {enrichmentTotal > 0 && (
                      <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">
                        Enrichment {currentEnrichmentIdx}/{enrichmentTotal}
                      </Badge>
                    )}
                  </CardTitle>
                  {thinkingMs > 0 && (
                    <span className="text-xs text-muted-foreground">
                      Thinking: {(thinkingMs / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {pipelineState?.phase === 'discovery' && 'Phase: Discovering candidates'}
                      {pipelineState?.phase === 'enrichment' && 'Phase: Enriching top candidates'}
                      {pipelineState?.phase === 'complete' && 'Phase: Complete'}
                      {!pipelineState?.phase && 'Initializing...'}
                    </span>
                    <span>{Math.round(pipelineState?.overallProgress || 0)}%</span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                      animate={{ width: `${pipelineState?.overallProgress || 0}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>

                {/* 8-Agent grid */}
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
                  {Object.entries(AGENT_8_DISPLAY).map(([key, agent]) => {
                    const state = pipelineState?.agents?.[key];
                    const status = state?.status || 'idle';
                    return (
                      <div
                        key={key}
                        className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                          status === 'working' || status === 'thinking'
                            ? 'border-cyan-500/50 bg-cyan-500/5'
                            : status === 'completed'
                            ? 'border-emerald-500/50 bg-emerald-500/5'
                            : status === 'failed'
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-border/30 bg-muted/20'
                        }`}
                      >
                        <div className="text-lg">{agent.emoji}</div>
                        <div className="text-[10px] font-medium text-center capitalize">{key}</div>
                        <div className="text-[9px] text-muted-foreground capitalize">{status}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Recent log */}
                <div
                  ref={logContainerRef}
                  className="h-32 overflow-y-auto bg-black/40 rounded-lg p-2 font-mono text-[10px] space-y-1"
                >
                  {pipelineLog.length === 0 && (
                    <div className="text-muted-foreground">Waiting for events...</div>
                  )}
                  {pipelineLog.slice(-30).map((entry, i) => (
                    <div key={i} className="text-muted-foreground">
                      <span className="text-cyan-400">[{new Date(entry.timestamp).toLocaleTimeString()}]</span>{' '}
                      <span className="text-violet-400">{entry.type}</span>{' '}
                      <span className="text-foreground/80">
                        {typeof entry.data.message === 'string'
                          ? entry.data.message.slice(0, 150)
                          : typeof entry.data.companyName === 'string'
                          ? entry.data.companyName
                          : entry.type === 'lead_created'
                          ? `Lead: ${entry.data.companyName}`
                          : entry.type === 'lead_enriched'
                          ? `Enriched: ${entry.data.companyName} (${entry.data.dataCompleteness}%)`
                          : JSON.stringify(entry.data).slice(0, 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pipeline Summary (when complete) */}
      <AnimatePresence>
        {pipelineSummary && !pipelineRunning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="bg-emerald-500/5 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Pipeline Complete</p>
                    <p className="text-xs text-muted-foreground">
                      Discovered {pipelineSummary.discovered} candidates • Enriched {pipelineSummary.enriched} •
                      Failed {pipelineSummary.failed} • Skipped {pipelineSummary.skipped}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {totalLeads === 0 && !pipelineRunning && (
        <Card className="bg-card/30 border-border/30 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">No leads yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  Click "Run Discovery Pipeline" to start the 8-agent pipeline. It will search the web,
                  discover candidate companies, and enrich the top 3 with full details (industry,
                  employees, contact info, CEO, etc.).
                </p>
              </div>
              <Button
                onClick={runPipeline}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 mt-2"
              >
                <Play className="h-4 w-4" />
                Run Discovery Pipeline
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads grid */}
      {totalLeads > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground">
              Leads ({totalLeads})
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedCampaignId(selectedCampaignId);
                setActiveView('leads');
              }}
              className="text-xs h-8 gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              View All in Leads
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Show live leads first (during pipeline run) */}
            {liveLeads
              .filter(ll => !leads.some(l => l.id === ll.id))
              .map(lead => (
                <LeadCard
                  key={`live-${lead.id}`}
                  lead={{
                    id: lead.id,
                    companyName: lead.companyName,
                    website: lead.website,
                    industry: null,
                    city: null,
                    country: null,
                    employeeCount: null,
                    generalEmail: null,
                    phoneMain: null,
                    ceoName: null,
                    keyContactName: null,
                    keyContactTitle: null,
                    keyContactEmail: null,
                    linkedinUrl: null,
                    stage: lead.stage === 'enriched' ? 'enriched' : 'new',
                    leadScore: lead.dataCompleteness,
                    leadTier: 'cold',
                    dataCompleteness: lead.dataCompleteness,
                    notes: lead.snippet || null,
                    discoveredAt: new Date().toISOString(),
                    enrichedAt: null,
                  }}
                  onView={() => viewLeadInLeads(lead.id)}
                  isLive
                />
              ))}

            {/* Show persisted leads from DB */}
            {leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onView={() => viewLeadInLeads(lead.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── LeadCard sub-component ─────────────────────────────────────────

interface LeadCardProps {
  lead: Lead;
  onView: () => void;
  isLive?: boolean;
}

function LeadCard({ lead, onView, isLive }: LeadCardProps) {
  const tierColor =
    lead.leadTier === 'hot'
      ? 'border-amber-500/30 text-amber-400'
      : lead.leadTier === 'warm'
      ? 'border-emerald-500/30 text-emerald-400'
      : 'border-zinc-500/30 text-zinc-400';

  return (
    <Card
      className={`bg-card/50 border-border/30 hover:border-cyan-500/40 transition-all cursor-pointer group ${
        isLive ? 'ring-1 ring-cyan-500/20' : ''
      }`}
      onClick={onView}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate text-foreground/90 group-hover:text-cyan-400 transition-colors">
              {lead.companyName}
            </h3>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-muted-foreground hover:text-cyan-400 flex items-center gap-1 mt-0.5 truncate"
              >
                <Globe className="h-3 w-3 shrink-0" />
                <span className="truncate">{lead.website.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="h-2.5 w-2.5 shrink-0" />
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className={`text-[9px] ${tierColor}`}>
              {lead.leadTier}
            </Badge>
            {isLive && lead.stage === 'new' && (
              <span className="text-[9px] text-cyan-400 animate-pulse">● live</span>
            )}
          </div>
        </div>

        {/* Industry + location */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {lead.industry && (
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              {lead.industry}
            </Badge>
          )}
          {(lead.city || lead.country) && (
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 mr-1" />
              {[lead.city, lead.country].filter(Boolean).join(', ')}
            </Badge>
          )}
          {lead.employeeCount && (
            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
              <Users className="h-2.5 w-2.5 mr-1" />
              {lead.employeeCount}
            </Badge>
          )}
        </div>

        {/* Contact info */}
        {(lead.generalEmail || lead.phoneMain || lead.keyContactName || lead.ceoName) && (
          <div className="space-y-1 mb-3 text-[11px] text-muted-foreground">
            {lead.ceoName && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 shrink-0" />
                <span className="text-foreground/80">CEO: {lead.ceoName}</span>
              </div>
            )}
            {lead.keyContactName && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3 w-3 shrink-0" />
                <span className="text-foreground/80">
                  {lead.keyContactTitle || 'Contact'}: {lead.keyContactName}
                </span>
              </div>
            )}
            {lead.generalEmail && (
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="text-foreground/80 truncate">{lead.generalEmail}</span>
              </div>
            )}
            {lead.phoneMain && (
              <div className="flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" />
                <span className="text-foreground/80">{lead.phoneMain}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer: completeness + stage */}
        <div className="flex items-center justify-between pt-2 border-t border-border/20">
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  lead.dataCompleteness >= 60
                    ? 'bg-emerald-500'
                    : lead.dataCompleteness >= 30
                    ? 'bg-amber-500'
                    : 'bg-zinc-500'
                }`}
                style={{ width: `${Math.min(100, lead.dataCompleteness)}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground">{lead.dataCompleteness}%</span>
          </div>
          <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground capitalize">
            {lead.stage}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
