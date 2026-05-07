'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Target,
  Loader2,
  Zap,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  MoreVertical,
  Play,
  Pause,
  Archive,
  Eye,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAppStore } from '@/lib/store';
import type { CampaignWithCounts, CampaignStatus } from '@/lib/types';
import { INDUSTRIES, LOCATIONS, COMPANY_SIZES } from '@/lib/types';
import { safeFetchJSON } from '@/lib/utils';

// ============================================================
// Pipeline Status Types
// ============================================================

interface PipelineStageStatus {
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  result?: Record<string, unknown>;
}

interface PipelineStatusResponse {
  campaignId: string;
  campaignName: string;
  pipelineStatus: 'idle' | 'running' | 'completed' | 'failed';
  overallProgress: number;
  currentStage: string;
  stages: Record<string, PipelineStageStatus>;
  summary: {
    leadsFound: number;
    leadsEnriched: number;
    leadsQualified: number;
    leadsContacted: number;
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
  };
  errors: Array<{ agent: string; error: string | null }>;
}

// Pipeline stage display names and order
const PIPELINE_STAGES = [
  { key: 'prospect-discovery', label: 'Discovery', icon: '🔍' },
  { key: 'data-enrichment', label: 'Enrichment', icon: '📊' },
  { key: 'lead-qualification', label: 'Qualification', icon: '⭐' },
  { key: 'outreach-composer', label: 'Outreach', icon: '✉️' },
] as const;

// ============================================================
// Component
// ============================================================

export function CampaignsView() {
  const { setActiveView, setSelectedCampaignId } = useAppStore();
  const [campaigns, setCampaigns] = useState<CampaignWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailCampaign, setDetailCampaign] = useState<CampaignWithCounts | null>(null);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSize, setFormSize] = useState('');
  const [formCreating, setFormCreating] = useState(false);

  // Pipeline status per campaign: campaignId -> PipelineStatusResponse
  const [pipelineStatuses, setPipelineStatuses] = useState<Record<string, PipelineStatusResponse>>({});
  // Track which campaigns we're actively polling
  const pollingRef = useRef<Set<string>>(new Set());
  const pollingTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  useEffect(() => {
    loadCampaigns();
    return () => {
      // Clean up all polling timers on unmount
      for (const timer of Object.values(pollingTimersRef.current)) {
        clearInterval(timer);
      }
    };
  }, []);

  const loadCampaigns = async () => {
    try {
      const data = await safeFetchJSON<CampaignWithCounts[]>('/api/campaigns');
      setCampaigns(data);

      // Check for any campaigns that might have running pipelines
      for (const campaign of data) {
        pollPipelineStatus(campaign.id);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Pipeline Status Polling
  // ============================================================

  const pollPipelineStatus = useCallback((campaignId: string) => {
    // Don't start duplicate polling
    if (pollingRef.current.has(campaignId)) return;
    pollingRef.current.add(campaignId);

    // Safety: Stop polling after 5 minutes max regardless of status
    const MAX_POLL_DURATION = 5 * 60 * 1000;
    const pollStartTime = Date.now();
    let pollCount = 0;

    const fetchStatus = async () => {
      // Safety: Stop polling after max duration
      if (Date.now() - pollStartTime > MAX_POLL_DURATION) {
        console.warn(`[Polling] Max poll duration reached for campaign ${campaignId}, stopping`);
        stopPolling(campaignId);
        loadCampaigns();
        return;
      }

      pollCount++;
      try {
        const status = await safeFetchJSON<PipelineStatusResponse>(
          `/api/campaigns/${campaignId}/pipeline-status`
        );
        setPipelineStatuses(prev => ({
          ...prev,
          [campaignId]: status,
        }));

        // If pipeline is no longer running, stop polling and reload campaign data
        if (status.pipelineStatus === 'completed' || status.pipelineStatus === 'failed' || status.pipelineStatus === 'idle') {
          stopPolling(campaignId);
          // Reload campaigns to get updated lead counts
          loadCampaigns();
        }
      } catch (error) {
        console.error(`Error polling pipeline status for ${campaignId}:`, error);
        // After 5 consecutive errors, stop polling to prevent infinite retry
        if (pollCount > 20) {
          console.warn(`[Polling] Too many errors for campaign ${campaignId}, stopping`);
          stopPolling(campaignId);
        }
      }
    };

    // Fetch immediately
    fetchStatus();

    // Then poll every 3 seconds
    pollingTimersRef.current[campaignId] = setInterval(fetchStatus, 3000);
  }, []);

  const stopPolling = useCallback((campaignId: string) => {
    pollingRef.current.delete(campaignId);
    if (pollingTimersRef.current[campaignId]) {
      clearInterval(pollingTimersRef.current[campaignId]);
      delete pollingTimersRef.current[campaignId];
    }
  }, []);

  // ============================================================
  // Campaign Creation
  // ============================================================

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setFormCreating(true);
    try {
      const newCampaign = await safeFetchJSON<CampaignWithCounts & {
        pipeline?: { started: boolean; status: string; message: string }
      }>('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDesc,
          targetIndustry: formIndustry,
          targetLocation: formLocation,
          targetCompanySize: formSize,
          autoRun: true,
        }),
      });

      // Add the new campaign to the list
      setCampaigns((prev) => [newCampaign, ...prev]);
      setCreateOpen(false);
      resetForm();

      // Start polling for pipeline status
      if (newCampaign.pipeline?.started) {
        pollPipelineStatus(newCampaign.id);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
    } finally {
      setFormCreating(false);
    }
  };

  // ============================================================
  // Run Pipeline (for existing campaigns)
  // ============================================================

  const handleRunPipeline = async (campaignId: string, _campaignName: string) => {
    try {
      const result = await safeFetchJSON<{
        started: boolean;
        status: string;
        message?: string;
      }>(`/api/campaigns/${campaignId}/run-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (result.started) {
        // Start polling for this campaign
        pollPipelineStatus(campaignId);
      }
    } catch (error) {
      console.error('Error running pipeline:', error);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDesc('');
    setFormIndustry('');
    setFormLocation('');
    setFormSize('');
  };

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status } : c))
      );
    } catch (error) {
      console.error('Error updating campaign:', error);
    }
  };

  // ============================================================
  // Filtering
  // ============================================================

  const filteredCampaigns = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.targetIndustry || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.targetLocation || '').toLowerCase().includes(search.toLowerCase())
  );

  // ============================================================
  // Helpers
  // ============================================================

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5',
      paused: 'border-amber-500/20 text-amber-400 bg-amber-500/5',
      completed: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/5',
      archived: 'border-gray-500/20 text-gray-500 bg-gray-500/5',
    };
    return styles[status] || styles.active;
  };

  const getStageLabel = (stageKey: string): string => {
    const stage = PIPELINE_STAGES.find(s => s.key === stageKey);
    return stage?.label || stageKey;
  };

  // ============================================================
  // Loading State
  // ============================================================

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48 bg-secondary/30" />
          <Skeleton className="h-10 w-32 bg-secondary/30" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Campaigns</h2>
          <p className="text-sm text-muted-foreground">
            Create campaigns and run the autonomous agent pipeline to discover, enrich, qualify, and outreach leads
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search campaigns..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary/30 border-border/40 focus:border-emerald-500/30"
        />
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-16">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium text-foreground/80">No campaigns yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first campaign — the agent pipeline will automatically discover and qualify leads
          </p>
          <Button
            className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => {
            const pipelineStatus = pipelineStatuses[campaign.id];
            const isPipelineRunning = pipelineStatus?.pipelineStatus === 'running';
            const isPipelineCompleted = pipelineStatus?.pipelineStatus === 'completed';
            const isPipelineFailed = pipelineStatus?.pipelineStatus === 'failed';
            const hasLeads = campaign.leadsFound > 0 || (pipelineStatus?.summary?.leadsFound || 0) > 0;

            // Use pipeline status summary if available, otherwise campaign data
            const displayFound = pipelineStatus?.summary?.leadsFound ?? campaign.leadsFound;
            const displayQualified = pipelineStatus?.summary?.leadsQualified ?? campaign.leadsQualified;
            const displayContacted = pipelineStatus?.summary?.leadsContacted ?? campaign.leadsContacted;

            return (
              <Card
                key={campaign.id}
                className="card-premium border-border/30 relative overflow-hidden group"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{
                    backgroundColor: isPipelineRunning
                      ? '#06b6d4'
                      : isPipelineCompleted
                      ? '#10b981'
                      : isPipelineFailed
                      ? '#ef4444'
                      : hasLeads
                      ? '#10b981'
                      : '#6b7280',
                  }}
                />
                {isPipelineRunning && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 animate-pulse" />
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate text-foreground/90">
                        {campaign.name}
                      </h3>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border/60">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaignId(campaign.id);
                            setActiveView('leads');
                          }}
                        >
                          <Eye className="h-3.5 w-3.5 mr-2" />
                          View Leads
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRunPipeline(campaign.id, campaign.name);
                          }}
                          disabled={isPipelineRunning}
                        >
                          <Zap className="h-3.5 w-3.5 mr-2" />
                          {hasLeads ? 'Re-Run Pipeline' : 'Start Pipeline'}
                        </DropdownMenuItem>
                        {campaign.status === 'active' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign.id, 'paused');
                            }}
                          >
                            <Pause className="h-3.5 w-3.5 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'paused' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(campaign.id, 'active');
                            }}
                          >
                            <Play className="h-3.5 w-3.5 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(campaign.id, 'archived');
                          }}
                        >
                          <Archive className="h-3.5 w-3.5 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <Badge variant="outline" className={`text-[10px] ${statusBadge(campaign.status)}`}>
                      {campaign.status}
                    </Badge>
                    {campaign.targetIndustry && (
                      <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                        {campaign.targetIndustry}
                      </Badge>
                    )}
                    {campaign.targetLocation && (
                      <Badge variant="outline" className="text-[10px] border-border/30 text-muted-foreground">
                        {campaign.targetLocation}
                      </Badge>
                    )}
                  </div>

                  {/* Pipeline Progress — Running */}
                  {isPipelineRunning && pipelineStatus ? (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                        <span className="text-xs text-cyan-400 font-medium">
                          {pipelineStatus.currentStage
                            ? `${getStageLabel(pipelineStatus.currentStage)}...`
                            : 'Pipeline Running...'}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {pipelineStatus.overallProgress}%
                        </span>
                      </div>
                      <Progress
                        value={pipelineStatus.overallProgress}
                        className="h-1.5 bg-secondary/40"
                      />
                      {/* Stage indicators */}
                      <div className="flex gap-1">
                        {PIPELINE_STAGES.map((stage) => {
                          const stageStatus = pipelineStatus.stages[stage.key];
                          const isRunning = stageStatus?.status === 'running';
                          const isDone = stageStatus?.status === 'completed';
                          const isFailed = stageStatus?.status === 'failed';
                          return (
                            <div
                              key={stage.key}
                              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                                isDone
                                  ? 'bg-emerald-400'
                                  : isRunning
                                  ? 'bg-cyan-400 animate-pulse'
                                  : isFailed
                                  ? 'bg-red-400'
                                  : 'bg-secondary/30'
                              }`}
                              title={`${stage.label}: ${stageStatus?.status || 'pending'} (${stageStatus?.progress || 0}%)`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground">
                        {PIPELINE_STAGES.map((stage) => (
                          <span key={stage.key} className="flex-1 text-center">{stage.label}</span>
                        ))}
                      </div>
                    </div>
                  ) : !hasLeads ? (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        className="w-full gap-2 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs h-8"
                        onClick={() => handleRunPipeline(campaign.id, campaign.name)}
                        disabled={isPipelineRunning}
                      >
                        <Zap className="h-3 w-3" />
                        Start Agent Pipeline
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Qualification Progress</span>
                        <span className="font-semibold text-foreground/80">
                          {displayFound > 0
                            ? Math.round((displayQualified / displayFound) * 100)
                            : 0}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          displayFound > 0
                            ? Math.round((displayQualified / displayFound) * 100)
                            : 0
                        }
                        className="h-1.5 bg-secondary/40"
                      />
                    </div>
                  )}

                  {/* Pipeline Result Banner */}
                  {isPipelineCompleted && pipelineStatus && (
                    <div className="mt-3 rounded-md p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <div className="flex items-center gap-1.5 font-medium text-[10px]">
                        <CheckCircle2 className="h-3 w-3" />
                        Pipeline Complete
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        {pipelineStatus.summary.leadsFound} found → {pipelineStatus.summary.leadsEnriched} enriched → {pipelineStatus.summary.leadsQualified} qualified ({pipelineStatus.summary.hotLeads} hot)
                      </div>
                    </div>
                  )}

                  {/* Pipeline Error Banner */}
                  {isPipelineFailed && pipelineStatus && (
                    <div className="mt-3 rounded-md p-2 bg-red-500/10 border border-red-500/20 text-red-400">
                      <div className="flex items-center gap-1.5 font-medium text-[10px]">
                        <AlertCircle className="h-3 w-3" />
                        Pipeline Issues
                      </div>
                      {pipelineStatus.errors.length > 0 && (
                        <div className="mt-1 text-[10px] text-muted-foreground">
                          {pipelineStatus.errors.map(e => e.error).filter(Boolean).join('; ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="rounded-md bg-secondary/20 p-2">
                      <div className="text-sm font-bold text-foreground/90">
                        {displayFound}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Found</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2">
                      <div className="text-sm font-bold text-foreground/90">
                        {displayQualified}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Qualified</div>
                    </div>
                    <div className="rounded-md bg-secondary/20 p-2">
                      <div className="text-sm font-bold text-foreground/90">
                        {displayContacted}
                      </div>
                      <div className="text-[10px] text-muted-foreground">Contacted</div>
                    </div>
                  </div>

                  {/* Re-run pipeline link for campaigns with existing leads */}
                  {hasLeads && !isPipelineRunning && (
                    <div className="mt-3 flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-muted-foreground hover:text-foreground gap-1 h-6"
                        onClick={() => handleRunPipeline(campaign.id, campaign.name)}
                      >
                        <RotateCw className="h-3 w-3" />
                        Re-run Pipeline
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Campaign</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              The agent pipeline will automatically run after creation: Discovery → Enrichment → Qualification → Outreach
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80">Campaign Name *</Label>
              <Input
                placeholder="e.g., Accounting Firms in Dubai"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Description</Label>
              <Textarea
                placeholder="Describe the target audience and goals..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
                className="bg-secondary/30 border-border/40 focus:border-emerald-500/30 resize-none"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground/80">Target Industry</Label>
                <Select value={formIndustry} onValueChange={setFormIndustry}>
                  <SelectTrigger className="bg-secondary/30 border-border/40">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/60">
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>
                        {ind}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground/80">Target Location</Label>
                <Select value={formLocation} onValueChange={setFormLocation}>
                  <SelectTrigger className="bg-secondary/30 border-border/40">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/60">
                    {LOCATIONS.map((loc) => (
                      <SelectItem key={loc} value={loc}>
                        {loc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80">Company Size</Label>
              <Select value={formSize} onValueChange={setFormSize}>
                <SelectTrigger className="bg-secondary/30 border-border/40">
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border/60">
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-border/40">
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formName.trim() || formCreating}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition-all gap-2"
            >
              {formCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Create & Run Pipeline
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!detailCampaign} onOpenChange={() => setDetailCampaign(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border/60">
          {detailCampaign && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">{detailCampaign.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {detailCampaign.description && (
                  <p className="text-sm text-muted-foreground">
                    {detailCampaign.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={statusBadge(detailCampaign.status)}>
                    {detailCampaign.status}
                  </Badge>
                  {detailCampaign.targetIndustry && (
                    <Badge variant="outline" className="border-border/30 text-muted-foreground">{detailCampaign.targetIndustry}</Badge>
                  )}
                  {detailCampaign.targetLocation && (
                    <Badge variant="outline" className="border-border/30 text-muted-foreground">{detailCampaign.targetLocation}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  {[
                    { value: detailCampaign.leadsFound, label: 'Found' },
                    { value: detailCampaign.leadsQualified, label: 'Qualified' },
                    { value: detailCampaign.leadsContacted, label: 'Contacted' },
                    { value: detailCampaign.leadsResponded, label: 'Responded' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-secondary/20 p-3">
                      <div className="text-xl font-bold text-foreground/90">{item.value}</div>
                      <div className="text-xs text-muted-foreground">{item.label}</div>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(detailCampaign.createdAt).toLocaleDateString()} • Last updated{' '}
                  {new Date(detailCampaign.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedCampaignId(detailCampaign.id);
                    setActiveView('leads');
                    setDetailCampaign(null);
                  }}
                  className="border-border/40"
                >
                  View Leads
                </Button>
                <Button
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2"
                  onClick={() => {
                    handleRunPipeline(detailCampaign.id, detailCampaign.name);
                    setDetailCampaign(null);
                  }}
                  disabled={pipelineStatuses[detailCampaign.id]?.pipelineStatus === 'running'}
                >
                  {pipelineStatuses[detailCampaign.id]?.pipelineStatus === 'running' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {detailCampaign.leadsFound > 0 ? 'Re-Run Pipeline' : 'Start Pipeline'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
