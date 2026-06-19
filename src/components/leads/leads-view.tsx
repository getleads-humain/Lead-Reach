'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  MoreVertical,
  ExternalLink,
  Mail,
  Phone,
  Globe,
  Building2,
  MapPin,
  Users,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Loader2,
  Lightbulb,
  Zap,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  CheckCircle2,
  Circle,
  PlayCircle,
  AlertCircle,
  UserSearch,
  Target,
  Route,
  FileText,
  MessageSquare,
  BarChart3,
  ArrowRight,
  RefreshCw,
  Eye,
  Copy,
  Check,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { LeadTier, LeadStage } from '@/lib/types';
import { TIER_COLORS, STAGE_LABELS, STAGE_COLORS } from '@/lib/types';
import { safeFetchJSON } from '@/lib/utils';
import { useAIOneShot } from '@/hooks/use-ai-chat';

// ============================================================
// Types
// ============================================================

interface Lead {
  id: string;
  companyName: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  phoneMain: string | null;
  generalEmail: string | null;
  website: string | null;
  employeeCount: string | null;
  revenueEstimate: string | null;
  leadScore: number;
  leadTier: string;
  stage: string;
  keyContactName: string | null;
  keyContactTitle: string | null;
  keyContactEmail: string | null;
  ceoName: string | null;
  ceoEmail: string | null;
  linkedinUrl: string | null;
  techStack: string | null;
  foundingYear: string | null;
  ownershipType: string | null;
  subIndustry: string | null;
  hqAddress: string | null;
  stateProvince: string | null;
  postalCode: string | null;
  notes: string | null;
  campaignId: string;
  campaign: { name: string };
  firmographicScore: number;
  intentScore: number;
  reachabilityScore: number;
  strategicScore: number;
  dataCompleteness: number;
  discoveredAt: string;
  enrichedAt: string | null;
  qualifiedAt: string | null;
  contactedAt: string | null;
}

type SortField = 'companyName' | 'leadScore' | 'leadTier' | 'stage' | 'employeeCount' | 'industry';
type SortDir = 'asc' | 'desc';

interface CampaignOption {
  id: string;
  name: string;
}

// Action pipeline types
type ActionStatus = 'pending' | 'executing' | 'completed' | 'failed';
type ActionType = 'identify_contact' | 'leverage_intent' | 'improve_reachability' | 'research_company' | 'compose_outreach' | 'competitive_analysis' | 'custom';

interface ActionStage {
  stageNumber: number;
  title: string;
  description: string;
  status: ActionStatus;
  result: string | null;
  timestamp: string | null;
  showResult?: boolean;
}

interface ActionItem {
  id: string;
  actionType: ActionType;
  title: string;
  description: string;
  status: ActionStatus;
  stages: ActionStage[];
  currentStage: number;
  maxStages: number;
  collapsed: boolean;
  resultCollapsed: boolean;
}

// ============================================================
// Action type configuration
// ============================================================

const ACTION_TYPE_CONFIG: Record<ActionType, { icon: typeof UserSearch; label: string; color: string; stages: string[] }> = {
  identify_contact: {
    icon: UserSearch,
    label: 'Identify Contact',
    color: 'text-blue-400',
    stages: ['Analyze Firmographic Data', 'Map Decision-Maker Roles', 'Locate Specific Contacts'],
  },
  leverage_intent: {
    icon: Target,
    label: 'Leverage Intent',
    color: 'text-amber-400',
    stages: ['Analyze Intent Signals', 'Create Personalized Value Prop', 'Design Outreach Strategy'],
  },
  improve_reachability: {
    icon: Route,
    label: 'Improve Reachability',
    color: 'text-purple-400',
    stages: ['Map Outreach Channels', 'Find Warm Introduction Paths', 'Build Social Selling Strategy'],
  },
  research_company: {
    icon: Building2,
    label: 'Research Company',
    color: 'text-emerald-400',
    stages: ['Company Deep-Dive Analysis', 'Identify Pain Points & Needs', 'Assess Strategic Fit'],
  },
  compose_outreach: {
    icon: MessageSquare,
    label: 'Compose Outreach',
    color: 'text-cyan-400',
    stages: ['Draft Personalized Message', 'Create Follow-Up Sequence', 'Prepare Multi-Channel Approach'],
  },
  competitive_analysis: {
    icon: BarChart3,
    label: 'Competitive Analysis',
    color: 'text-rose-400',
    stages: ['Map Competitive Landscape', 'Identify Differentiators', 'Prepare Objection Handling'],
  },
  custom: {
    icon: FileText,
    label: 'Custom Action',
    color: 'text-gray-400',
    stages: ['Analyze & Plan', 'Execute Strategy', 'Review & Refine'],
  },
};

// ============================================================
// Helper: Parse AI suggestion text into structured action items
// ============================================================

function parseSuggestionToActions(rawSuggestion: string): ActionItem[] {
  const lines = rawSuggestion.split('\n').filter(l => l.trim());
  const actions: ActionItem[] = [];

  for (const line of lines) {
    // Match bullet points like "- **Title**: Description" or "- Title: Description" or "- Title - Description"
    const boldMatch = line.match(/^[-•*]\s*\*\*(.+?)\*\*[:\s–—-]*\s*(.+)$/);
    const simpleMatch = line.match(/^[-•*]\s*(.+?)[:\s–—-]+\s*(.+)$/);

    const title = boldMatch?.[1] || simpleMatch?.[1]?.trim();
    const description = boldMatch?.[2] || simpleMatch?.[2]?.trim();

    if (title && description) {
      const actionType = classifyAction(title, description);
      const config = ACTION_TYPE_CONFIG[actionType];

      actions.push({
        id: `action-${actions.length}-${Date.now()}`,
        actionType,
        title: title.trim(),
        description: description.trim(),
        status: 'pending',
        stages: config.stages.map((stageTitle, idx) => ({
          stageNumber: idx + 1,
          title: stageTitle,
          description: `Step ${idx + 1} of ${config.stages.length}`,
          status: 'pending' as ActionStatus,
          result: null,
          timestamp: null,
        })),
        currentStage: 0,
        maxStages: config.stages.length,
        collapsed: false,
        resultCollapsed: false,
      });
    }
  }

  // If no structured bullet points found, create a single custom action
  if (actions.length === 0 && rawSuggestion.trim()) {
    actions.push({
      id: `action-0-${Date.now()}`,
      actionType: 'custom',
      title: 'Suggested Action',
      description: rawSuggestion.trim(),
      status: 'pending',
      stages: [
        { stageNumber: 1, title: 'Analyze & Plan', description: 'Step 1 of 3', status: 'pending', result: null, timestamp: null },
        { stageNumber: 2, title: 'Execute Strategy', description: 'Step 2 of 3', status: 'pending', result: null, timestamp: null },
        { stageNumber: 3, title: 'Review & Refine', description: 'Step 3 of 3', status: 'pending', result: null, timestamp: null },
      ],
      currentStage: 0,
      maxStages: 3,
      collapsed: false,
      resultCollapsed: false,
    });
  }

  return actions;
}

function classifyAction(title: string, description: string): ActionType {
  const combined = `${title} ${description}`.toLowerCase();

  if (combined.match(/contact|decision.?maker|person|key.?contact|identify.*who|find.*people|executive|vp|director|cto|cfo|coo|head of/i)) {
    return 'identify_contact';
  }
  if (combined.match(/intent|signal|buying.?signal|interest|proactively|personalized|tailored|case.?stud|market.?research/i)) {
    return 'leverage_intent';
  }
  if (combined.match(/reachab|channel|linkedin|forum|connection|introduc|warm|network|communit|indirect|access/i)) {
    return 'improve_reachability';
  }
  if (combined.match(/research|deep.?dive|investigat|analyz|company|business|funding|news|recent/i)) {
    return 'research_company';
  }
  if (combined.match(/outreach|email|message|compose|draft|write|follow.?up|sequence|template/i)) {
    return 'compose_outreach';
  }
  if (combined.match(/compet|differenti|advantage|position|objection|rival|alternativ/i)) {
    return 'competitive_analysis';
  }

  return 'custom';
}

// ============================================================
// Main Component
// ============================================================

export function LeadsView() {
  const { selectedCampaignId, setSelectedCampaignId } = useAppStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>(selectedCampaignId || 'all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<SortField>('leadScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const limit = 25;

  // AI Suggestion state
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [aiSuggestionLoading, setAiSuggestionLoading] = useState(false);
  const { generate: aiGenerate, isLoading: aiIsGenerating } = useAIOneShot();

  // AI Lead Scoring state
  const [aiScoring, setAiScoring] = useState<{
    overallScore: number;
    tier: string;
    confidence: number;
    dimensions: Record<string, { score: number; rationale: string }>;
    signals: { positive: string[]; negative: string[]; missing: string[] };
    recommendedActions: string[];
    riskFactors: string[];
    nextBestChannel: string;
    outreachAngle: string;
  } | null>(null);
  const [aiScoringLoading, setAiScoringLoading] = useState(false);
  const [aiScoringError, setAiScoringError] = useState<string | null>(null);

  // Run AI scoring for the currently selected lead
  const generateAIScore = useCallback(async (lead: Lead) => {
    if (!lead?.id) return;
    setAiScoringLoading(true);
    setAiScoringError(null);
    try {
      const data = await safeFetchJSON<{
        scoring: {
          overallScore: number;
          tier: string;
          confidence: number;
          dimensions: Record<string, { score: number; rationale: string }>;
          signals: { positive: string[]; negative: string[]; missing: string[] };
          recommendedActions: string[];
          riskFactors: string[];
          nextBestChannel: string;
          outreachAngle: string;
        };
        applied?: boolean;
      }>(`/api/leads/${lead.id}/ai-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applyUpdate: true }),
      });
      if (data?.scoring) {
        setAiScoring(data.scoring);
      } else {
        setAiScoringError('AI scoring returned no result.');
      }
    } catch (err) {
      setAiScoringError(err instanceof Error ? err.message : 'AI scoring failed');
    } finally {
      setAiScoringLoading(false);
    }
  }, []);

  // Action pipeline state
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);

  // Aggregated enrichment data
  const [enrichedData, setEnrichedData] = useState<{
    discoveredContacts: Array<{ name: string; title: string; approach: string }>;
    outreachDrafts: Array<{ subject: string; preview: string; fullContent: string }>;
    channelIntel: Array<{ channel: string; strategy: string; priority: string }>;
    researchNotes: Array<{ title: string; content: string }>;
  }>({
    discoveredContacts: [],
    outreachDrafts: [],
    channelIntel: [],
    researchNotes: [],
  });

  // Active enrichment tab
  const [activeEnrichTab, setActiveEnrichTab] = useState<'contacts' | 'outreach' | 'channels' | 'research'>('contacts');

  // Copy state for outreach
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCampaignId) {
      setCampaignFilter(selectedCampaignId);
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    safeFetchJSON<CampaignOption[]>('/api/campaigns')
      .then((data) => setCampaigns(data.map((c: CampaignOption) => ({ id: c.id, name: c.name }))))
      .catch(() => {});
  }, []);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (stageFilter !== 'all') params.set('stage', stageFilter);
      if (campaignFilter !== 'all') params.set('campaignId', campaignFilter);
      if (search) params.set('search', search);

      const data = await safeFetchJSON<{ leads: Lead[]; total: number }>(`/api/leads?${params}`);
      setLeads(data.leads || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter, stageFilter, campaignFilter, search]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: string | number = a[sortField] as string | number;
    let bVal: string | number = b[sortField] as string | number;
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleDeleteLead = async (id: string) => {
    try {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
      setLeads((prev) => prev.filter((l) => l.id !== id));
      setSelectedLead(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleStageChange = async (id: string, stage: string) => {
    try {
      const updated = await safeFetchJSON<Lead>(`/api/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
      if (selectedLead?.id === id) {
        setSelectedLead({ ...selectedLead, ...updated });
      }
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  // ============================================================
  // AI Suggestion Generation (with structured output)
  // ============================================================

  const generateAISuggestion = async (lead: Lead) => {
    setAiSuggestionLoading(true);
    setAiSuggestion(null);
    setActionItems([]);
    setEnrichedData({
      discoveredContacts: [],
      outreachDrafts: [],
      channelIntel: [],
      researchNotes: [],
    });
    try {
      const result = await aiGenerate(
        `Analyze this B2B lead and suggest the next best actions:

Company: ${lead.companyName}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.city || ''}${lead.country ? `, ${lead.country}` : ''}
Stage: ${STAGE_LABELS[lead.stage as LeadStage] || lead.stage}
Tier: ${lead.leadTier}
Score: ${lead.leadScore}/100
- Firmographic: ${lead.firmographicScore}/100
- Intent: ${lead.intentScore}/100
- Reachability: ${lead.reachabilityScore}/100
- Strategic: ${lead.strategicScore}/100
- Data Quality: ${lead.dataCompleteness}/100

Key Contact: ${lead.keyContactName || 'Not identified'}${lead.keyContactTitle ? ` (${lead.keyContactTitle})` : ''}
CEO: ${lead.ceoName || 'Not identified'}
Website: ${lead.website || 'Unknown'}
Employees: ${lead.employeeCount || 'Unknown'}
Revenue: ${lead.revenueEstimate || 'Unknown'}
LinkedIn: ${lead.linkedinUrl || 'Not available'}

Suggest 3 specific next actions for this lead. Each action should be a bullet point with a bold title followed by a colon and a detailed description. Be specific and actionable. Focus on the most impactful steps given the lead's current profile, scores, and gaps.

Format each action exactly like this:
- **Action Title**: Detailed description of what to do and why`,
        'You are a B2B sales strategy expert. Suggest specific, actionable next steps for a lead based on their profile. Consider their pipeline stage, score gaps, and available contact information. Each suggestion must have a clear bold title followed by a detailed description. Focus on practical steps that will move this lead forward in the pipeline.'
      );
      if (result) {
        setAiSuggestion(result);
        // Parse into structured action items
        const parsed = parseSuggestionToActions(result);
        setActionItems(parsed);
      }
    } catch {
      // Silently fail
    } finally {
      setAiSuggestionLoading(false);
    }
  };

  // ============================================================
  // Execute Action Step
  // ============================================================

  const executeActionStep = async (actionId: string) => {
    const action = actionItems.find(a => a.id === actionId);
    if (!action || !selectedLead) return;

    const nextStage = action.currentStage + 1;
    if (nextStage > action.maxStages) return;

    setExecutingActionId(actionId);

    // Update status to executing
    setActionItems(prev => prev.map(a => {
      if (a.id !== actionId) return a;
      const updatedStages = [...a.stages];
      updatedStages[nextStage - 1] = { ...updatedStages[nextStage - 1], status: 'executing' };
      return { ...a, status: 'executing', stages: updatedStages };
    }));

    try {
      const previousResults = action.stages
        .filter(s => s.result)
        .map(s => s.result!);

      const leadData = {
        companyName: selectedLead.companyName,
        industry: selectedLead.industry,
        city: selectedLead.city,
        country: selectedLead.country,
        website: selectedLead.website,
        employeeCount: selectedLead.employeeCount,
        revenueEstimate: selectedLead.revenueEstimate,
        leadScore: selectedLead.leadScore,
        firmographicScore: selectedLead.firmographicScore,
        intentScore: selectedLead.intentScore,
        reachabilityScore: selectedLead.reachabilityScore,
        strategicScore: selectedLead.strategicScore,
        dataCompleteness: selectedLead.dataCompleteness,
        keyContactName: selectedLead.keyContactName,
        keyContactTitle: selectedLead.keyContactTitle,
        keyContactEmail: selectedLead.keyContactEmail,
        ceoName: selectedLead.ceoName,
        ceoEmail: selectedLead.ceoEmail,
        linkedinUrl: selectedLead.linkedinUrl,
        techStack: selectedLead.techStack,
        stage: selectedLead.stage,
        leadTier: selectedLead.leadTier,
        notes: selectedLead.notes,
      };

      const response = await safeFetchJSON<{
        success: boolean;
        result: string;
        actionType: string;
        stage: number;
        timestamp: string;
      }>(`/api/leads/${selectedLead.id}/execute-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionType: action.actionType,
          actionTitle: action.title,
          actionDescription: action.description,
          leadData,
          stage: nextStage,
          previousResults,
        }),
      });

      if (response.success && response.result) {
        // Update action with result
        setActionItems(prev => prev.map(a => {
          if (a.id !== actionId) return a;
          const updatedStages = [...a.stages];
          updatedStages[nextStage - 1] = {
            ...updatedStages[nextStage - 1],
            status: 'completed',
            result: response.result,
            timestamp: response.timestamp,
          };
          const allStagesComplete = updatedStages.every(s => s.status === 'completed');
          return {
            ...a,
            status: allStagesComplete ? 'completed' : 'pending',
            currentStage: nextStage,
            stages: updatedStages,
          };
        }));

        // Parse results into enriched data categories
        parseEnrichedData(action.actionType, action.title, response.result);
      } else {
        // Mark stage as failed
        setActionItems(prev => prev.map(a => {
          if (a.id !== actionId) return a;
          const updatedStages = [...a.stages];
          updatedStages[nextStage - 1] = {
            ...updatedStages[nextStage - 1],
            status: 'failed',
          };
          return { ...a, status: 'failed', stages: updatedStages };
        }));
      }
    } catch (error) {
      console.error('Error executing action:', error);
      setActionItems(prev => prev.map(a => {
        if (a.id !== actionId) return a;
        const updatedStages = [...a.stages];
        updatedStages[nextStage - 1] = {
          ...updatedStages[nextStage - 1],
          status: 'failed',
        };
        return { ...a, status: 'failed', stages: updatedStages };
      }));
    } finally {
      setExecutingActionId(null);
    }
  };

  // ============================================================
  // Parse AI results into categorized enrichment data
  // ============================================================

  const parseEnrichedData = (actionType: ActionType, actionTitle: string, result: string) => {
    setEnrichedData(prev => {
      const updated = { ...prev };

      switch (actionType) {
        case 'identify_contact':
          // Extract contact-like information
          const contactPatterns = result.match(/(?:^|\n)[-•*]?\s*(?:\d+\.\s*)?\*?\*?([^*\n]{3,50})\*?\*?\s*[-:–—]\s*([^\n]+)/g);
          if (contactPatterns) {
            const newContacts = contactPatterns.map(p => {
              const parts = p.match(/(?:^|\n)[-•*]?\s*(?:\d+\.\s*)?\*?\*?([^*\n]{3,50})\*?\*?\s*[-:–—]\s*([^\n]+)/);
              if (parts) {
                return { name: parts[1].trim(), title: '', approach: parts[2].trim() };
              }
              return null;
            }).filter(Boolean) as Array<{ name: string; title: string; approach: string }>;
            if (newContacts.length > 0) {
              updated.discoveredContacts = [...updated.discoveredContacts, ...newContacts];
            }
          }
          // Also add as a research note
          updated.researchNotes = [...updated.researchNotes, { title: actionTitle, content: result }];
          break;

        case 'compose_outreach':
          // Extract subject lines and email content
          const subjectMatch = result.match(/\*?\*?Subject[^:]*:?\*?\*?\s*["']?([^"\n]+)/i);
          const previewText = result.slice(0, 200).replace(/[#*_]/g, '').trim();
          updated.outreachDrafts = [...updated.outreachDrafts, {
            subject: subjectMatch?.[1]?.trim() || actionTitle,
            preview: previewText,
            fullContent: result,
          }];
          updated.researchNotes = [...updated.researchNotes, { title: actionTitle, content: result }];
          break;

        case 'improve_reachability':
          // Extract channel information
          const channelPatterns = result.match(/(?:^|\n)[-•*]?\s*(?:\d+\.\s*)?\*?\*?([^*\n]{3,40})\*?\*?\s*[-:–—]\s*([^\n]+)/g);
          if (channelPatterns) {
            const newChannels = channelPatterns.map(p => {
              const parts = p.match(/(?:^|\n)[-•*]?\s*(?:\d+\.\s*)?\*?\*?([^*\n]{3,40})\*?\*?\s*[-:–—]\s*([^\n]+)/);
              if (parts) {
                return { channel: parts[1].trim(), strategy: parts[2].trim(), priority: 'Medium' };
              }
              return null;
            }).filter(Boolean) as Array<{ channel: string; strategy: string; priority: string }>;
            if (newChannels.length > 0) {
              updated.channelIntel = [...updated.channelIntel, ...newChannels];
            }
          }
          updated.researchNotes = [...updated.researchNotes, { title: actionTitle, content: result }];
          break;

        default:
          updated.researchNotes = [...updated.researchNotes, { title: actionTitle, content: result }];
          break;
      }

      return updated;
    });
  };

  // ============================================================
  // Computed: Pipeline progress
  // ============================================================

  const pipelineProgress = useMemo(() => {
    if (actionItems.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const total = actionItems.reduce((sum, a) => sum + a.maxStages, 0);
    const completed = actionItems.reduce((sum, a) => sum + a.stages.filter(s => s.status === 'completed').length, 0);
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [actionItems]);

  const totalEnrichments = useMemo(() => {
    return enrichedData.discoveredContacts.length + enrichedData.outreachDrafts.length + enrichedData.channelIntel.length + enrichedData.researchNotes.length;
  }, [enrichedData]);

  // ============================================================
  // Copy outreach content
  // ============================================================

  const copyToClipboard = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      // Fallback
    }
  };

  // ============================================================
  // Reset state when lead changes
  // ============================================================

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setAiSuggestion(null);
    setAiSuggestionLoading(false);
    setAiScoring(null);
    setAiScoringError(null);
    setActionItems([]);
    setEnrichedData({
      discoveredContacts: [],
      outreachDrafts: [],
      channelIntel: [],
      researchNotes: [],
    });
    setActiveEnrichTab('contacts');
  };

  const handleCloseSheet = () => {
    setSelectedLead(null);
    setAiSuggestion(null);
    setAiSuggestionLoading(false);
    setAiScoring(null);
    setAiScoringError(null);
    setActionItems([]);
    setEnrichedData({
      discoveredContacts: [],
      outreachDrafts: [],
      channelIntel: [],
      researchNotes: [],
    });
  };

  // ============================================================
  // Render: Status Icon
  // ============================================================

  const renderStatusIcon = (status: ActionStatus, size = 14) => {
    switch (status) {
      case 'pending':
        return <Circle className="text-muted-foreground/40" style={{ width: size, height: size }} />;
      case 'executing':
        return <Loader2 className="text-blue-400 animate-spin" style={{ width: size, height: size }} />;
      case 'completed':
        return <CheckCircle2 className="text-emerald-400" style={{ width: size, height: size }} />;
      case 'failed':
        return <AlertCircle className="text-red-400" style={{ width: size, height: size }} />;
    }
  };

  // ============================================================
  // Render: Action Item
  // ============================================================

  const renderActionItem = (action: ActionItem) => {
    const config = ACTION_TYPE_CONFIG[action.actionType];
    const IconComp = config.icon;
    const isExecuting = executingActionId === action.id;
    const allComplete = action.stages.every(s => s.status === 'completed');
    const nextStage = action.currentStage + 1;
    const canExecute = nextStage <= action.maxStages && !isExecuting;
    const nextStageTitle = nextStage <= action.maxStages ? action.stages[nextStage - 1].title : null;

    return (
      <div
        key={action.id}
        className={`rounded-lg border transition-all ${
          allComplete
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : action.status === 'executing'
            ? 'border-blue-500/20 bg-blue-500/5'
            : 'border-border/30 bg-secondary/10'
        }`}
      >
        {/* Action Header */}
        <div className="p-3">
          <div className="flex items-start gap-2.5">
            <div className={`mt-0.5 ${config.color}`}>
              <IconComp style={{ width: 16, height: 16 }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-foreground/90">{action.title}</span>
                {allComplete && (
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 h-4">
                    Complete
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>

              {/* Stage Progress Bar */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full bg-secondary/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      allComplete ? 'bg-emerald-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${(action.stages.filter(s => s.status === 'completed').length / action.maxStages) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {action.stages.filter(s => s.status === 'completed').length}/{action.maxStages}
                </span>
              </div>
            </div>
          </div>

          {/* Stage Steps */}
          <div className="mt-3 ml-6 space-y-1.5">
            {action.stages.map((stage, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2">
                  {renderStatusIcon(stage.status, 12)}
                  <span className={`text-xs ${
                    stage.status === 'completed' ? 'text-foreground/80 font-medium' :
                    stage.status === 'executing' ? 'text-blue-400 font-medium' :
                    'text-muted-foreground/60'
                  }`}>
                    {stage.title}
                  </span>
                  {stage.status === 'completed' && (
                    <button
                      className="ml-auto text-[9px] text-muted-foreground hover:text-foreground/70 flex items-center gap-0.5 transition-colors"
                      onClick={() => {
                        setActionItems(prev => prev.map(a => {
                          if (a.id !== action.id) return a;
                          const updatedStages = [...a.stages];
                          updatedStages[idx] = { ...updatedStages[idx], showResult: !updatedStages[idx].showResult };
                          return { ...a, stages: updatedStages };
                        }));
                      }}
                    >
                      <Eye style={{ width: 10, height: 10 }} />
                      {stage.showResult ? 'Hide' : 'View'}
                    </button>
                  )}
                </div>
                {/* Show completed stage result inline */}
                {stage.status === 'completed' && stage.showResult && stage.result && (
                  <div className="mt-1.5 ml-5 p-2.5 rounded-md bg-secondary/20 border border-border/20 text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {stage.result}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Execute Next Step Button */}
          {canExecute && nextStageTitle && (
            <div className="mt-3 ml-6">
              <Button
                size="sm"
                className={`gap-1.5 text-xs h-7 ${
                  action.actionType === 'identify_contact' ? 'bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 border border-blue-500/20' :
                  action.actionType === 'leverage_intent' ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 hover:text-amber-300 border border-amber-500/20' :
                  action.actionType === 'improve_reachability' ? 'bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 hover:text-purple-300 border border-purple-500/20' :
                  action.actionType === 'research_company' ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 hover:text-emerald-300 border border-emerald-500/20' :
                  action.actionType === 'compose_outreach' ? 'bg-cyan-500/15 text-cyan-400 hover:bg-cyan-500/25 hover:text-cyan-300 border border-cyan-500/20' :
                  action.actionType === 'competitive_analysis' ? 'bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300 border border-rose-500/20' :
                  'bg-secondary/20 text-foreground/70 hover:bg-secondary/30 border border-border/30'
                }`}
                onClick={() => executeActionStep(action.id)}
                disabled={!!executingActionId}
              >
                {isExecuting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <PlayCircle style={{ width: 14, height: 14 }} />
                )}
                {isExecuting ? 'Executing...' : `Run: ${nextStageTitle}`}
              </Button>
            </div>
          )}

          {/* Completed: View Full Results */}
          {allComplete && (
            <div className="mt-3 ml-6">
              <Collapsible
                open={!action.resultCollapsed}
                onOpenChange={(open) => {
                  setActionItems(prev => prev.map(a =>
                    a.id === action.id ? { ...a, resultCollapsed: !open } : a
                  ));
                }}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 h-6"
                  >
                    {action.resultCollapsed ? <ChevronRightIcon style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
                    {action.resultCollapsed ? 'Show Full Results' : 'Hide Full Results'}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1.5 p-3 rounded-md bg-secondary/15 border border-border/20 text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {action.stages.map((stage, idx) => (
                      stage.result && (
                        <div key={idx} className={idx > 0 ? 'mt-3 pt-3 border-t border-border/15' : ''}>
                          <div className="font-semibold text-foreground/80 mb-1">{stage.title}</div>
                          {stage.result}
                        </div>
                      )
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // Render: Enrichment Data Tabs
  // ============================================================

  const renderEnrichmentPanel = () => {
    if (totalEnrichments === 0) return null;

    const tabs = [
      { key: 'contacts' as const, label: 'Contacts', count: enrichedData.discoveredContacts.length, icon: Users },
      { key: 'outreach' as const, label: 'Outreach', count: enrichedData.outreachDrafts.length, icon: MessageSquare },
      { key: 'channels' as const, label: 'Channels', count: enrichedData.channelIntel.length, icon: Route },
      { key: 'research' as const, label: 'Research', count: enrichedData.researchNotes.length, icon: FileText },
    ];

    return (
      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
          <Zap className="h-4 w-4 text-amber-400" />
          Lead Enrichment
          <Badge variant="outline" className="text-[9px] border-amber-500/30 text-amber-400 bg-amber-500/10 h-4">
            {totalEnrichments} items
          </Badge>
        </h4>

        {/* Tab buttons */}
        <div className="flex gap-1 mb-3">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                activeEnrichTab === tab.key
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'text-muted-foreground hover:text-foreground/70 hover:bg-secondary/20'
              }`}
              onClick={() => setActiveEnrichTab(tab.key)}
            >
              <tab.icon style={{ width: 10, height: 10 }} />
              {tab.label}
              {tab.count > 0 && <span className="ml-0.5 bg-secondary/30 px-1 rounded text-[9px]">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {activeEnrichTab === 'contacts' && enrichedData.discoveredContacts.map((contact, idx) => (
            <div key={idx} className="rounded-md border border-blue-500/15 bg-blue-500/5 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold">
                  {contact.name.charAt(0)}
                </div>
                <span className="text-xs font-semibold text-foreground/90">{contact.name}</span>
                {contact.title && (
                  <span className="text-[10px] text-muted-foreground">{contact.title}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed ml-7">{contact.approach}</p>
            </div>
          ))}

          {activeEnrichTab === 'outreach' && enrichedData.outreachDrafts.map((draft, idx) => (
            <div key={idx} className="rounded-md border border-cyan-500/15 bg-cyan-500/5 p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground/90">{draft.subject}</span>
                <button
                  className="text-muted-foreground hover:text-foreground/70 transition-colors"
                  onClick={() => copyToClipboard(draft.fullContent, idx)}
                >
                  {copiedIdx === idx ? (
                    <Check style={{ width: 12, height: 12 }} className="text-emerald-400" />
                  ) : (
                    <Copy style={{ width: 12, height: 12 }} />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-3">{draft.preview}</p>
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="text-[9px] text-cyan-400 hover:text-cyan-300 mt-1 transition-colors">
                    View Full Message →
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1.5 p-2 rounded bg-secondary/15 text-[10px] text-foreground/70 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {draft.fullContent}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}

          {activeEnrichTab === 'channels' && enrichedData.channelIntel.map((ch, idx) => (
            <div key={idx} className="rounded-md border border-purple-500/15 bg-purple-500/5 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground/90">{ch.channel}</span>
                <Badge variant="outline" className="text-[8px] border-purple-500/20 text-purple-400 h-3.5">
                  {ch.priority}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{ch.strategy}</p>
            </div>
          ))}

          {activeEnrichTab === 'research' && enrichedData.researchNotes.map((note, idx) => (
            <div key={idx} className="rounded-md border border-border/20 bg-secondary/8 p-2.5">
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-1 text-xs font-semibold text-foreground/90 w-full text-left">
                    <ChevronRightIcon style={{ width: 10, height: 10 }} className="text-muted-foreground" />
                    {note.title}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-1.5 ml-3.5 text-[10px] text-muted-foreground leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {note.content}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================
  // Render: Pipeline Progress Overview
  // ============================================================

  const renderPipelineProgress = () => {
    if (actionItems.length === 0) return null;

    return (
      <div className="rounded-lg border border-border/30 bg-secondary/8 p-3">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-xs font-semibold text-foreground/80">Action Pipeline Progress</h5>
          <span className="text-[10px] text-muted-foreground">{pipelineProgress.completed}/{pipelineProgress.total} steps</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              pipelineProgress.percentage === 100 ? 'bg-emerald-400' : 'bg-blue-400'
            }`}
            style={{ width: `${pipelineProgress.percentage}%` }}
          />
        </div>
        {pipelineProgress.percentage === 100 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 style={{ width: 12, height: 12 }} />
            All actions completed! Review the enrichment data below.
          </div>
        )}
      </div>
    );
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leads</h2>
          <p className="text-sm text-muted-foreground">
            {total} leads discovered across all campaigns
          </p>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search companies, contacts, locations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 bg-secondary/30 border-border/40 focus:border-emerald-500/30"
          />
        </div>
        <div className="flex gap-2">
          <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
            <SelectTrigger className="w-32 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Tier" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
              <SelectItem value="unqualified">Unqualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Stage" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Stages</SelectItem>
              {Object.entries(STAGE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignFilter} onValueChange={(v) => { setCampaignFilter(v); setPage(1); setSelectedCampaignId(v === 'all' ? null : v); }}>
            <SelectTrigger className="w-48 bg-secondary/30 border-border/40">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border/60">
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 rounded-lg bg-secondary/30" />
          ))}
        </div>
      ) : sortedLeads.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="mt-4 text-lg font-medium text-foreground/80">No leads found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your filters or search terms
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent">
                  <TableHead className="cursor-pointer text-muted-foreground text-xs uppercase tracking-wider" onClick={() => handleSort('companyName')}>
                    <span className="flex items-center gap-1">Company <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Industry</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Location</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="cursor-pointer text-muted-foreground text-xs uppercase tracking-wider" onClick={() => handleSort('leadScore')}>
                    <span className="flex items-center gap-1">Score <ArrowUpDown className="h-3 w-3" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Tier</TableHead>
                  <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Stage</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-secondary/20 border-border/20 transition-colors"
                    onClick={() => handleLeadSelect(lead)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-bold shrink-0">
                          {lead.companyName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground/90 truncate max-w-40">{lead.companyName}</div>
                          {lead.website && (
                            <div className="text-xs text-muted-foreground truncate max-w-40">{lead.website.replace('https://', '')}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{lead.industry || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.city && lead.country ? `${lead.city}, ${lead.country}` : lead.country || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {lead.keyContactName || lead.ceoName || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-12 rounded-full bg-secondary/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              lead.leadScore >= 80 ? 'bg-emerald-400' :
                              lead.leadScore >= 60 ? 'bg-amber-400' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${lead.leadScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80">{lead.leadScore}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[lead.leadTier as LeadTier] || ''}`}>
                        {lead.leadTier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[lead.stage as LeadStage] || ''}`}>
                        {STAGE_LABELS[lead.stage as LeadStage] || lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border/60">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLeadSelect(lead); }}>
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteLead(lead.id); }}>
                            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/20 bg-secondary/10">
            <div className="text-xs text-muted-foreground">
              Showing {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/30 text-muted-foreground"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-foreground/80 font-medium">{page} / {totalPages || 1}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 border-border/30 text-muted-foreground"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => handleCloseSheet()}>
        <SheetContent className="sm:max-w-xl overflow-y-auto bg-card border-border/40">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 text-lg font-bold">
                    {selectedLead.companyName.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg text-foreground">{selectedLead.companyName}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[selectedLead.leadTier as LeadTier] || ''}`}>
                        {selectedLead.leadTier}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[selectedLead.stage as LeadStage] || ''}`}>
                        {STAGE_LABELS[selectedLead.stage as LeadStage] || selectedLead.stage}
                      </Badge>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Score Breakdown */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-foreground/90">Lead Score: {selectedLead.leadScore}/100</h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Firmographic', value: selectedLead.firmographicScore },
                      { label: 'Intent', value: selectedLead.intentScore },
                      { label: 'Reachability', value: selectedLead.reachabilityScore },
                      { label: 'Strategic', value: selectedLead.strategicScore },
                      { label: 'Data Quality', value: selectedLead.dataCompleteness },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-24">{item.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground/80 w-8">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Company Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                    <Building2 className="h-4 w-4 text-muted-foreground" /> Company
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    {selectedLead.industry && <div><span className="text-muted-foreground">Industry:</span> <span className="text-foreground/80">{selectedLead.industry}</span>{selectedLead.subIndustry ? ` / ${selectedLead.subIndustry}` : ''}</div>}
                    {selectedLead.employeeCount && <div><span className="text-muted-foreground">Employees:</span> <span className="text-foreground/80">{selectedLead.employeeCount}</span></div>}
                    {selectedLead.revenueEstimate && <div><span className="text-muted-foreground">Revenue:</span> <span className="text-foreground/80">{selectedLead.revenueEstimate}</span></div>}
                    {selectedLead.foundingYear && <div><span className="text-muted-foreground">Founded:</span> <span className="text-foreground/80">{selectedLead.foundingYear}</span></div>}
                    {selectedLead.ownershipType && <div><span className="text-muted-foreground">Ownership:</span> <span className="text-foreground/80">{selectedLead.ownershipType}</span></div>}
                  </div>
                </div>

                {/* AI Lead Scoring Panel */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                      <Sparkles className="h-4 w-4 text-violet-400" />
                      AI Lead Scoring
                      <Badge variant="outline" className="text-[9px] border-violet-500/20 text-violet-400 bg-violet-500/5">glm-4.6v-flash</Badge>
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-[10px] text-violet-400 hover:text-violet-400 hover:bg-violet-500/10"
                      onClick={() => generateAIScore(selectedLead)}
                      disabled={aiScoringLoading}
                    >
                      {aiScoringLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {aiScoring ? 'Re-score' : 'Score with AI'}
                    </Button>
                  </div>

                  {aiScoringError ? (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
                      {aiScoringError}
                    </div>
                  ) : aiScoringLoading && !aiScoring ? (
                    <div className="rounded-lg border border-violet-500/10 bg-violet-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 text-violet-400 animate-spin" />
                        <span className="text-xs text-muted-foreground">AI is scoring this lead across 5 dimensions...</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-secondary/30 rounded w-full" />
                        <div className="h-2.5 bg-secondary/30 rounded w-4/5" />
                        <div className="h-2.5 bg-secondary/30 rounded w-3/5" />
                      </div>
                    </div>
                  ) : aiScoring ? (
                    <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-3">
                      {/* Overall score */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground">Overall AI Score</div>
                          <div className="text-2xl font-bold text-violet-400">{aiScoring.overallScore}<span className="text-xs text-muted-foreground">/100</span></div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-[9px] capitalize ${
                            aiScoring.tier === 'hot' ? 'border-red-500/30 text-red-400 bg-red-500/10' :
                            aiScoring.tier === 'warm' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                            'border-cyan-500/30 text-cyan-400 bg-cyan-500/10'
                          }`}>
                            {aiScoring.tier}
                          </Badge>
                          <div className="text-[10px] text-muted-foreground mt-1">Confidence: {Math.round(aiScoring.confidence * 100)}%</div>
                        </div>
                      </div>

                      {/* Dimension scores */}
                      <div className="space-y-1.5">
                        {Object.entries(aiScoring.dimensions || {}).map(([dim, info]) => (
                          <div key={dim}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground capitalize">{dim}</span>
                              <span className="text-[10px] font-semibold text-foreground/80">{info.score}</span>
                            </div>
                            <div className="h-1 rounded-full bg-secondary/30 overflow-hidden">
                              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400" style={{ width: `${info.score}%` }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground/80 mt-0.5 italic">{info.rationale}</p>
                          </div>
                        ))}
                      </div>

                      {/* Signals */}
                      {aiScoring.signals && (aiScoring.signals.positive.length > 0 || aiScoring.signals.negative.length > 0) && (
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {aiScoring.signals.positive.length > 0 && (
                            <div>
                              <div className="text-emerald-400 font-medium mb-1">Positive signals</div>
                              <ul className="text-muted-foreground space-y-0.5">
                                {aiScoring.signals.positive.slice(0, 3).map((s, i) => <li key={i}>+ {s}</li>)}
                              </ul>
                            </div>
                          )}
                          {aiScoring.signals.negative.length > 0 && (
                            <div>
                              <div className="text-red-400 font-medium mb-1">Negative signals</div>
                              <ul className="text-muted-foreground space-y-0.5">
                                {aiScoring.signals.negative.slice(0, 3).map((s, i) => <li key={i}>- {s}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Outreach angle */}
                      {aiScoring.outreachAngle && (
                        <div className="pt-2 border-t border-border/20">
                          <div className="text-[10px] text-muted-foreground mb-1">Recommended outreach angle ({aiScoring.nextBestChannel})</div>
                          <p className="text-xs text-foreground/90 leading-relaxed">{aiScoring.outreachAngle}</p>
                        </div>
                      )}

                      {/* Recommended actions */}
                      {aiScoring.recommendedActions && aiScoring.recommendedActions.length > 0 && (
                        <div className="pt-2 border-t border-border/20">
                          <div className="text-[10px] text-muted-foreground mb-1">Recommended actions</div>
                          <ul className="space-y-1">
                            {aiScoring.recommendedActions.slice(0, 4).map((a, i) => (
                              <li key={i} className="text-xs text-foreground/80 flex gap-1.5">
                                <span className="text-violet-400">→</span>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Risk factors */}
                      {aiScoring.riskFactors && aiScoring.riskFactors.length > 0 && (
                        <div className="pt-2 border-t border-border/20">
                          <div className="text-[10px] text-amber-400 mb-1">Risk factors</div>
                          <ul className="space-y-0.5">
                            {aiScoring.riskFactors.slice(0, 3).map((r, i) => (
                              <li key={i} className="text-[10px] text-muted-foreground flex gap-1.5">
                                <span className="text-amber-400">!</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/30 bg-secondary/10 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Run AI scoring for a 5-dimension analysis with recommended actions
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-[10px] border-violet-500/20 text-violet-400 hover:bg-violet-500/10 hover:text-violet-400"
                        onClick={() => generateAIScore(selectedLead)}
                      >
                        <Sparkles className="h-3 w-3" />
                        Run AI Scoring
                      </Button>
                    </div>
                  )}
                </div>

                {/* Location */}
                {(selectedLead.city || selectedLead.hqAddress) && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                      <MapPin className="h-4 w-4 text-muted-foreground" /> Location
                    </h4>
                    <div className="space-y-1.5 text-sm text-foreground/80">
                      {selectedLead.hqAddress && <div>{selectedLead.hqAddress}</div>}
                      {selectedLead.city && <div>{selectedLead.city}{selectedLead.stateProvince ? `, ${selectedLead.stateProvince}` : ''}{selectedLead.country ? `, ${selectedLead.country}` : ''}</div>}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                    <Users className="h-4 w-4 text-muted-foreground" /> Key Contacts
                  </h4>
                  <div className="space-y-2">
                    {selectedLead.ceoName && (
                      <div className="rounded-lg border border-border/30 bg-secondary/15 p-2.5">
                        <div className="font-medium text-sm text-foreground/90">{selectedLead.ceoName}</div>
                        <div className="text-xs text-muted-foreground">CEO{selectedLead.ceoEmail ? ` • ${selectedLead.ceoEmail}` : ''}</div>
                      </div>
                    )}
                    {selectedLead.keyContactName && (
                      <div className="rounded-lg border border-border/30 bg-secondary/15 p-2.5">
                        <div className="font-medium text-sm text-foreground/90">{selectedLead.keyContactName}</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedLead.keyContactTitle || 'Key Contact'}
                          {selectedLead.keyContactEmail ? ` • ${selectedLead.keyContactEmail}` : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Channels */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground/90">Contact Channels</h4>
                  <div className="space-y-1.5 text-sm">
                    {selectedLead.phoneMain && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedLead.phoneMain}
                      </div>
                    )}
                    {selectedLead.generalEmail && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {selectedLead.generalEmail}
                      </div>
                    )}
                    {selectedLead.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                          {selectedLead.website.replace('https://', '')}
                        </a>
                      </div>
                    )}
                    {selectedLead.linkedinUrl && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-cyan-400">in</span>
                        <a href={selectedLead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors">
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* ═══════════════════════════════════════════════════ */}
                {/* AI SUGGESTED NEXT ACTION — REDESIGNED               */}
                {/* ═══════════════════════════════════════════════════ */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
                      <Sparkles className="h-4 w-4 text-emerald-400" />
                      Suggested Next Action
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 text-[10px] text-emerald-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                      onClick={() => generateAISuggestion(selectedLead)}
                      disabled={aiSuggestionLoading || aiIsGenerating}
                    >
                      {(aiSuggestionLoading || aiIsGenerating) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      {aiSuggestion ? 'Regenerate' : 'Generate'}
                    </Button>
                  </div>

                  {(aiSuggestionLoading || aiIsGenerating) ? (
                    <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                        <span className="text-xs text-muted-foreground">Analyzing lead & generating action plan...</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-3 bg-secondary/30 rounded w-full" />
                        <div className="h-3 bg-secondary/30 rounded w-4/5" />
                        <div className="h-3 bg-secondary/30 rounded w-3/5" />
                      </div>
                    </div>
                  ) : aiSuggestion && actionItems.length > 0 ? (
                    <div className="space-y-3">
                      {/* Pipeline Progress */}
                      {renderPipelineProgress()}

                      {/* Individual Action Items */}
                      <div className="space-y-2.5">
                        {actionItems.map(action => renderActionItem(action))}
                      </div>

                      {/* Enrichment Data Panel */}
                      {totalEnrichments > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/20">
                          {renderEnrichmentPanel()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/30 bg-secondary/10 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">
                        Get AI-powered suggestions for the best next action with this lead
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-[10px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-400"
                        onClick={() => generateAISuggestion(selectedLead)}
                      >
                        <Sparkles className="h-3 w-3" />
                        Get AI Suggestion
                      </Button>
                    </div>
                  )}
                </div>

                {/* ═══════════════════════════════════════════════════ */}
                {/* STAGE UPDATE                                         */}
                {/* ═══════════════════════════════════════════════════ */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground/90">Update Stage</h4>
                  <Select
                    value={selectedLead.stage}
                    onValueChange={(v) => handleStageChange(selectedLead.id, v)}
                  >
                    <SelectTrigger className="bg-secondary/30 border-border/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border/60">
                      {Object.entries(STAGE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Discovered: {new Date(selectedLead.discoveredAt).toLocaleDateString()}</div>
                  {selectedLead.enrichedAt && <div>Enriched: {new Date(selectedLead.enrichedAt).toLocaleDateString()}</div>}
                  {selectedLead.qualifiedAt && <div>Qualified: {new Date(selectedLead.qualifiedAt).toLocaleDateString()}</div>}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteLead(selectedLead.id)}
                    className="gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
