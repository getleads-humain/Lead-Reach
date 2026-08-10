'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Send,
  Brain,
  TrendingUp,
  Shield,
  Activity,
  Bot,
  Cpu,
  Database,
  Gauge,
  Layers,
  Rocket,
  Scan,
  Wand2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { LeadTier, LeadStage } from '@/lib/types';
import { TIER_COLORS, STAGE_LABELS, STAGE_COLORS } from '@/lib/types';
import { safeFetchJSON, cn } from '@/lib/utils';
import { useAIOneShot, useAIChat } from '@/hooks/use-ai-chat';


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
// Panel Tab & Enrichment Types
// ============================================================

type PanelTab = 'overview' | 'enrich' | 'live' | 'agent';

interface EnrichmentTask {
  id: string;
  type: 'bant' | 'web_enrich' | 'ai_score' | 'next_action' | 'predict_conversion' | 'predict_deal' | 'behavioral_profile' | 'generate_alerts' | 'research_company';
  label: string;
  description: string;
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
  borderColor: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  result?: unknown;
  error?: string;
}

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isLoading?: boolean;
  actions?: Array<{
    label: string;
    type: string;
    status: 'pending' | 'done' | 'failed';
  }>;
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
    color: 'text-gray-400 dark:text-gray-300',
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

  // Panel tab state
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('overview');

  // Live Enrichment state
  const [liveEnrichRunning, setLiveEnrichRunning] = useState(false);
  const [liveEnrichSteps, setLiveEnrichSteps] = useState<Array<{
    step: string; phase: number; label: string; status: string;
    result?: string; fieldsUpdated?: string[]; scoreImpact?: { dimension: string; before: number; after: number };
    data?: Record<string, unknown>;
  }>>([]);
  const [liveEnrichResult, setLiveEnrichResult] = useState<{
    tierUpgrade?: {
      previousTier: string; newTier: string; previousScore: number; newScore: number;
      upgradeReason: string; upgradePath: string[]; confidence: number;
      remainingGaps: string[]; recommendedActions: string[];
    };
    pipelineHealth?: {
      dataCompletenessBefore: number; dataCompletenessAfter: number;
      fieldsEnriched: number; scoreImprovement: number;
      tierUpgradeAchieved: boolean; pipelineEfficiency: number;
    };
  } | null>(null);
  const [pipelineHealthData, setPipelineHealthData] = useState<Record<string, unknown> | null>(null);

  // Enrichment tasks state
  const [enrichmentTasks, setEnrichmentTasks] = useState<EnrichmentTask[]>([
    { id: 'bant', type: 'bant', label: 'BANT Enrichment', description: 'Infer Budget, Authority, Need, Timeline signals', icon: Shield, color: 'text-violet-400', bgColor: 'bg-violet-500/10', borderColor: 'border-violet-500/20', status: 'idle' },
    { id: 'web_enrich', type: 'web_enrich', label: 'Web Data Enrichment', description: 'Search web & fill missing lead fields', icon: Database, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', status: 'idle' },
    { id: 'ai_score', type: 'ai_score', label: 'AI Deep Scoring', description: '5-dimension scoring with risk analysis', icon: Gauge, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', status: 'idle' },
    { id: 'next_action', type: 'next_action', label: 'Next Action Advisor', description: 'AI recommends highest-leverage next step', icon: Rocket, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', status: 'idle' },
    { id: 'predict_conversion', type: 'predict_conversion', label: 'Conversion Predictor', description: 'Predict win probability & timeline', icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', status: 'idle' },
    { id: 'predict_deal', type: 'predict_deal', label: 'Deal Size Predictor', description: 'Estimate deal value based on firmographics', icon: BarChart3, color: 'text-rose-400', bgColor: 'bg-rose-500/10', borderColor: 'border-rose-500/20', status: 'idle' },
    { id: 'behavioral_profile', type: 'behavioral_profile', label: 'Behavioral Profile', description: 'Build engagement & intent behavioral map', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20', status: 'idle' },
    { id: 'generate_alerts', type: 'generate_alerts', label: 'Intelligence Alerts', description: 'Detect risk signals & opportunity triggers', icon: Activity, color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/20', status: 'idle' },
    { id: 'research_company', type: 'research_company', label: 'Deep Company Research', description: 'Comprehensive company deep-dive analysis', icon: Scan, color: 'text-indigo-400', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/20', status: 'idle' },
  ]);

  // Agent conversation state
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentInput, setAgentInput] = useState('');
  const [agentIsTyping, setAgentIsTyping] = useState(false);
  const agentChatEndRef = useRef<HTMLDivElement>(null);
  const agentInputRef = useRef<HTMLInputElement>(null);

  // Enrichment results storage
  const [enrichmentResults, setEnrichmentResults] = useState<Record<string, unknown>>({});

  // Use AI chat hook for agent conversation
  const { sendMessage: agentSendMessage, isLoading: agentChatLoading, messages: agentRawMessages } = useAIChat({
    systemPrompt: `You are LeadReach AI Agent — an expert B2B sales intelligence assistant embedded in the lead detail panel. You have direct access to the selected lead's data and can perform real-time enrichment, scoring, and analysis.

Your capabilities:
- BANT Enrichment (Budget, Authority, Need, Timeline)
- Web Data Enrichment (search & fill missing fields)
- AI Deep Scoring (5-dimension analysis)
- Next Action Recommendation
- Conversion Probability Prediction
- Deal Size Prediction
- Behavioral Profiling
- Intelligence Alert Generation
- Deep Company Research

When the user asks you to perform an action, explain what you'll do, then provide actionable insights. Be concise but thorough. Format responses with clear sections and bullet points.`,
  });

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
      await safeFetchJSON<void>(`/api/leads/${id}`, { method: 'DELETE' });
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
  // Run enrichment task
  // ============================================================

  const runEnrichmentTask = useCallback(async (taskId: string) => {
    if (!selectedLead) return;

    setEnrichmentTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'running' as const, error: undefined } : t
    ));

    const task = enrichmentTasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      let result: unknown;

      switch (task.type) {
        case 'bant': {
          const res = await safeFetchJSON<{ action: string; result: string; modelUsed: string }>(
            '/api/leads/ai-enrich',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: selectedLead.id,
                companyName: selectedLead.companyName,
                industry: selectedLead.industry,
                website: selectedLead.website,
                employeeCount: selectedLead.employeeCount,
                revenueEstimate: selectedLead.revenueEstimate,
                leadScore: selectedLead.leadScore,
                stage: selectedLead.stage,
              }),
            }
          );
          result = res;
          break;
        }
        case 'web_enrich': {
          const res = await safeFetchJSON<{ lead: unknown; fieldsEnriched: number; dataPointsFound: number }>(
            '/api/leads/enrich',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ leadId: selectedLead.id }),
            }
          );
          result = res;
          // Reload leads to reflect enriched data
          if (res.lead) {
            loadLeads();
          }
          break;
        }
        case 'ai_score': {
          const res = await safeFetchJSON<{
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
          }>(`/api/leads/${selectedLead.id}/ai-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applyUpdate: true }),
          });
          result = res.scoring;
          if (res.scoring) {
            setAiScoring(res.scoring);
          }
          break;
        }
        case 'next_action': {
          const res = await safeFetchJSON<{ action: string; result: string; modelUsed: string }>(
            '/api/leads/ai-next-action',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leadId: selectedLead.id,
                companyName: selectedLead.companyName,
                industry: selectedLead.industry,
                leadScore: selectedLead.leadScore,
                stage: selectedLead.stage,
                leadTier: selectedLead.leadTier,
              }),
            }
          );
          result = res;
          break;
        }
        case 'predict_conversion': {
          const res = await safeFetchJSON<unknown>(
            '/api/lead-intelligence',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'predict_conversion',
                leadId: selectedLead.id,
              }),
            }
          );
          result = res;
          break;
        }
        case 'predict_deal': {
          const res = await safeFetchJSON<unknown>(
            '/api/lead-intelligence',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'predict_deal_size',
                leadData: {
                  id: selectedLead.id,
                  companyName: selectedLead.companyName,
                  industry: selectedLead.industry,
                  employeeCount: selectedLead.employeeCount,
                  revenueEstimate: selectedLead.revenueEstimate,
                  leadScore: selectedLead.leadScore,
                },
              }),
            }
          );
          result = res;
          break;
        }
        case 'behavioral_profile': {
          const res = await safeFetchJSON<unknown>(
            '/api/lead-intelligence',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'build_profile',
                leadId: selectedLead.id,
              }),
            }
          );
          result = res;
          break;
        }
        case 'generate_alerts': {
          const res = await safeFetchJSON<unknown>(
            '/api/lead-intelligence',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'generate_alerts',
                leadId: selectedLead.id,
              }),
            }
          );
          result = res;
          break;
        }
        case 'research_company': {
          const res = await safeFetchJSON<{ success: boolean; result: string; actionType: string }>(
            `/api/leads/${selectedLead.id}/execute-action`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                actionType: 'research_company',
                actionTitle: 'Deep Company Research',
                actionDescription: `Comprehensive deep-dive analysis of ${selectedLead.companyName}`,
                leadData: {
                  companyName: selectedLead.companyName,
                  industry: selectedLead.industry,
                  website: selectedLead.website,
                  employeeCount: selectedLead.employeeCount,
                  revenueEstimate: selectedLead.revenueEstimate,
                  city: selectedLead.city,
                  country: selectedLead.country,
                  techStack: selectedLead.techStack,
                },
                stage: 1,
                previousResults: [],
              }),
            }
          );
          result = res;
          break;
        }
      }

      setEnrichmentTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const, result } : t
      ));
      setEnrichmentResults(prev => ({ ...prev, [taskId]: result }));
    } catch (err) {
      setEnrichmentTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'failed' as const, error: err instanceof Error ? err.message : 'Task failed' } : t
      ));
    }
  }, [selectedLead, enrichmentTasks, loadLeads]);

  // ============================================================
  // Run all enrichment tasks
  // ============================================================

  const runAllEnrichments = useCallback(async () => {
    if (!selectedLead) return;
    const idleTasks = enrichmentTasks.filter(t => t.status === 'idle' || t.status === 'failed');
    for (const task of idleTasks) {
      await runEnrichmentTask(task.id);
    }
  }, [enrichmentTasks, runEnrichmentTask, selectedLead]);

  // ============================================================
  // Live Enrich — 5-Phase Pipeline with Tier Upgrade Targeting
  // ============================================================

  const runLiveEnrich = useCallback(async () => {
    if (!selectedLead) return;

    setLiveEnrichRunning(true);
    setLiveEnrichSteps([]);
    setLiveEnrichResult(null);

    // Define the 5 phases for progressive UI updates
    const phases = [
      { step: 'data_gathering', phase: 1, label: 'Data Gathering', status: 'running' as const },
      { step: 'bant_analysis', phase: 2, label: 'BANT Analysis', status: 'pending' as const },
      { step: 'deep_scoring', phase: 3, label: 'Deep Scoring', status: 'pending' as const },
      { step: 'tier_upgrade', phase: 4, label: 'Tier Upgrade Engine', status: 'pending' as const },
      { step: 'action_synthesis', phase: 5, label: 'Action Synthesis', status: 'pending' as const },
    ];

    setLiveEnrichSteps(phases);

    try {
      // Call the Live Enrich API endpoint
      const res = await safeFetchJSON<{
        leadId: string;
        steps: Array<{
          step: string; phase: number; label: string; status: string;
          result?: string; fieldsUpdated?: string[]; scoreImpact?: { dimension: string; before: number; after: number };
          data?: Record<string, unknown>;
        }>;
        tierUpgrade: {
          previousTier: string; newTier: string; previousScore: number; newScore: number;
          upgradeReason: string; upgradePath: string[]; confidence: number;
          remainingGaps: string[]; recommendedActions: string[];
        };
        finalLead: Record<string, unknown>;
        pipelineHealth: {
          dataCompletenessBefore: number; dataCompletenessAfter: number;
          fieldsEnriched: number; scoreImprovement: number;
          tierUpgradeAchieved: boolean; pipelineEfficiency: number;
        };
      }>(`/api/leads/${selectedLead.id}/live-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTier: 'super_hot',
          phases: [1, 2, 3, 4, 5],
        }),
      });

      // Update steps from the API response
      if (res.steps && res.steps.length > 0) {
        setLiveEnrichSteps(res.steps);
      }

      // Store the result (tier upgrade + pipeline health)
      setLiveEnrichResult({
        tierUpgrade: res.tierUpgrade,
        pipelineHealth: res.pipelineHealth,
      });

      // Store pipeline health data for visualization
      setPipelineHealthData(res.pipelineHealth as Record<string, unknown>);

      // Reload leads to reflect enriched data
      loadLeads();

    } catch (err) {
      // Mark all pending/running steps as failed
      setLiveEnrichSteps(prev => prev.map(s =>
        s.status === 'running' || s.status === 'pending'
          ? { ...s, status: 'failed' as const, result: err instanceof Error ? err.message : 'Pipeline failed' }
          : s
      ));
    } finally {
      setLiveEnrichRunning(false);
    }
  }, [selectedLead, loadLeads]);

  // ============================================================
  // Agent: Send message
  // ============================================================

  const handleAgentSend = useCallback(async () => {
    if (!agentInput.trim() || !selectedLead) return;

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: agentInput.trim(),
      timestamp: Date.now(),
    };

    setAgentMessages(prev => [...prev, userMsg]);
    setAgentInput('');
    setAgentIsTyping(true);

    // Add lead context to the message
    const contextMessage = `[Lead Context: ${selectedLead.companyName} | Industry: ${selectedLead.industry || 'Unknown'} | Score: ${selectedLead.leadScore}/100 | Tier: ${selectedLead.leadTier} | Stage: ${STAGE_LABELS[selectedLead.stage as LeadStage] || selectedLead.stage} | Employees: ${selectedLead.employeeCount || 'Unknown'} | Revenue: ${selectedLead.revenueEstimate || 'Unknown'} | Website: ${selectedLead.website || 'Unknown'} | City: ${selectedLead.city || 'Unknown'}]

${agentInput.trim()}`;

    try {
      await agentSendMessage(contextMessage);
    } catch {
      // Fallback if chat API fails
    }

    setAgentIsTyping(false);
  }, [agentInput, selectedLead, agentSendMessage]);

  // Sync agent raw messages from hook to our display messages
  useEffect(() => {
    if (agentRawMessages.length > 0) {
      const lastMsg = agentRawMessages[agentRawMessages.length - 1];
      if (lastMsg.role === 'assistant' && lastMsg.content) {
        setAgentMessages(prev => {
          // Avoid duplicate
          const last = prev[prev.length - 1];
          if (last && last.role === 'assistant' && last.content === lastMsg.content) return prev;
          return [...prev, {
            id: `agent-${Date.now()}`,
            role: 'assistant',
            content: lastMsg.content,
            timestamp: Date.now(),
          }];
        });
      }
    }
  }, [agentRawMessages]);

  // Auto-scroll agent chat
  useEffect(() => {
    agentChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [agentMessages]);

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
    setActivePanelTab('overview');
    // Reset enrichment tasks
    setEnrichmentTasks(prev => prev.map(t => ({ ...t, status: 'idle' as const, result: undefined, error: undefined })));
    setEnrichmentResults({});
    // Reset agent messages
    setAgentMessages([]);
    setAgentInput('');
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
    setActivePanelTab('overview');
    setEnrichmentTasks(prev => prev.map(t => ({ ...t, status: 'idle' as const, result: undefined, error: undefined })));
    setEnrichmentResults({});
    setAgentMessages([]);
    setAgentInput('');
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
              <SelectItem value="super_hot">Super Hot</SelectItem>
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

      {/* Lead Detail Sheet — Enhanced 3-Tab Panel */}
      <Sheet open={!!selectedLead} onOpenChange={() => handleCloseSheet()}>
        <SheetContent className="sm:max-w-2xl overflow-hidden bg-card/95 backdrop-blur-xl border-border/40 p-0 flex flex-col">
          {selectedLead && (
            <div className="flex flex-col h-full">
              {/* ─── Header ─── */}
              <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/20 shrink-0">
                <SheetTitle className="flex items-center gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 text-lg font-bold ring-1 ring-emerald-500/20">
                    {selectedLead.companyName.charAt(0)}
                    {/* Live indicator dot */}
                    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold text-foreground truncate">{selectedLead.companyName}</div>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[selectedLead.leadTier as LeadTier] || ''}`}>
                        {selectedLead.leadTier}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${STAGE_COLORS[selectedLead.stage as LeadStage] || ''}`}>
                        {STAGE_LABELS[selectedLead.stage as LeadStage] || selectedLead.stage}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-foreground/10 text-foreground/50 bg-foreground/5">
                        {selectedLead.leadScore}/100
                      </Badge>
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              {/* ─── Tab Navigation ─── */}
              <div className="flex items-center gap-0.5 px-4 py-2 border-b border-border/15 bg-secondary/5 shrink-0">
                {([
                  { key: 'overview' as PanelTab, label: 'Overview', icon: Layers },
                  { key: 'enrich' as PanelTab, label: 'Enrich', icon: Wand2 },
                  { key: 'live' as PanelTab, label: 'Live Enrich', icon: Zap },
                  { key: 'agent' as PanelTab, label: 'Agent', icon: Bot },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                      activePanelTab === tab.key
                        ? tab.key === 'overview'
                          ? 'bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10'
                          : tab.key === 'enrich'
                          ? 'bg-violet-500/15 text-violet-400 shadow-sm shadow-violet-500/10'
                          : tab.key === 'live'
                          ? 'bg-gradient-to-r from-orange-500/15 to-red-500/15 text-orange-400 shadow-sm shadow-orange-500/10'
                          : 'bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-500/10'
                        : 'text-muted-foreground hover:text-foreground/70 hover:bg-secondary/30'
                    )}
                    onClick={() => setActivePanelTab(tab.key)}
                  >
                    <tab.icon style={{ width: 13, height: 13 }} />
                    {tab.label}
                    {tab.key === 'enrich' && enrichmentTasks.some(t => t.status === 'running') && (
                      <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                    )}
                    {tab.key === 'enrich' && enrichmentTasks.filter(t => t.status === 'completed').length > 0 && (
                      <span className="ml-0.5 bg-violet-500/20 text-violet-400 px-1 rounded text-[9px]">
                        {enrichmentTasks.filter(t => t.status === 'completed').length}
                      </span>
                    )}
                    {tab.key === 'live' && liveEnrichRunning && (
                      <Loader2 className="h-3 w-3 animate-spin text-orange-400" />
                    )}
                    {tab.key === 'live' && liveEnrichResult && !liveEnrichRunning && (
                      <span className="ml-0.5 bg-emerald-500/20 text-emerald-400 px-1 rounded text-[9px]">
                        {liveEnrichResult.tierUpgrade?.newTier === 'super_hot' ? 'HOT!' : 'Done'}
                      </span>
                    )}
                    {tab.key === 'agent' && agentMessages.length > 0 && (
                      <span className="ml-0.5 bg-emerald-500/20 text-emerald-400 px-1 rounded text-[9px]">
                        {agentMessages.length}
                      </span>
                    )}
                  </button>
                ))}
                <div className="flex-1" />
                {/* Quick score pill */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-1.5 w-16 rounded-full bg-secondary/40 overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        selectedLead.leadScore >= 70 ? 'bg-emerald-400' :
                        selectedLead.leadScore >= 40 ? 'bg-amber-400' : 'bg-red-400'
                      )}
                      style={{ width: `${selectedLead.leadScore}%` }}
                    />
                  </div>
                  <span className="font-medium">{selectedLead.leadScore}</span>
                </div>
              </div>

              {/* ─── Tab Content ─── */}
              <div className="flex-1 overflow-y-auto">
                {/* ═══════════════════════════════════════════ */}
                {/* TAB: OVERVIEW                              */}
                {/* ═══════════════════════════════════════════ */}
                {activePanelTab === 'overview' && (
                  <div className="p-5 space-y-5">
                    {/* Score Breakdown — Glassmorphic card */}
                    <div className="rounded-xl border border-border/20 bg-gradient-to-br from-secondary/20 to-secondary/5 p-4">
                      <h4 className="text-sm font-semibold mb-3 text-foreground/90 flex items-center gap-2">
                        <Gauge className="h-4 w-4 text-blue-400" />
                        Lead Score: {selectedLead.leadScore}/100
                      </h4>
                      <div className="space-y-2.5">
                        {[
                          { label: 'Firmographic', value: selectedLead.firmographicScore, color: 'from-blue-400 to-blue-500' },
                          { label: 'Intent', value: selectedLead.intentScore, color: 'from-amber-400 to-amber-500' },
                          { label: 'Reachability', value: selectedLead.reachabilityScore, color: 'from-purple-400 to-purple-500' },
                          { label: 'Strategic', value: selectedLead.strategicScore, color: 'from-emerald-400 to-emerald-500' },
                          { label: 'Data Quality', value: selectedLead.dataCompleteness, color: 'from-cyan-400 to-cyan-500' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-secondary/30 overflow-hidden">
                              <div
                                className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-700`}
                                style={{ width: `${item.value}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-foreground/80 w-8 text-right">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Company Info */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                        <Building2 className="h-4 w-4 text-muted-foreground" /> Company
                      </h4>
                      <div className="rounded-lg border border-border/15 bg-secondary/8 p-3 space-y-1.5 text-sm">
                        {selectedLead.industry && <div className="flex justify-between"><span className="text-muted-foreground">Industry</span><span className="text-foreground/80 text-right">{selectedLead.industry}{selectedLead.subIndustry ? ` / ${selectedLead.subIndustry}` : ''}</span></div>}
                        {selectedLead.employeeCount && <div className="flex justify-between"><span className="text-muted-foreground">Employees</span><span className="text-foreground/80">{selectedLead.employeeCount}</span></div>}
                        {selectedLead.revenueEstimate && <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="text-foreground/80">{selectedLead.revenueEstimate}</span></div>}
                        {selectedLead.foundingYear && <div className="flex justify-between"><span className="text-muted-foreground">Founded</span><span className="text-foreground/80">{selectedLead.foundingYear}</span></div>}
                        {selectedLead.ownershipType && <div className="flex justify-between"><span className="text-muted-foreground">Ownership</span><span className="text-foreground/80">{selectedLead.ownershipType}</span></div>}
                        {selectedLead.techStack && <div className="flex justify-between"><span className="text-muted-foreground">Tech Stack</span><span className="text-foreground/80 text-right max-w-[60%] truncate">{selectedLead.techStack}</span></div>}
                      </div>
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

                    {/* Key Contacts */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-foreground/90">
                        <Users className="h-4 w-4 text-muted-foreground" /> Key Contacts
                      </h4>
                      <div className="space-y-2">
                        {selectedLead.ceoName && (
                          <div className="rounded-lg border border-border/15 bg-secondary/8 p-2.5 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400 text-xs font-bold ring-1 ring-violet-500/20">
                              {selectedLead.ceoName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground/90">{selectedLead.ceoName}</div>
                              <div className="text-xs text-muted-foreground">CEO{selectedLead.ceoEmail ? ` · ${selectedLead.ceoEmail}` : ''}</div>
                            </div>
                          </div>
                        )}
                        {selectedLead.keyContactName && (
                          <div className="rounded-lg border border-border/15 bg-secondary/8 p-2.5 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-400 text-xs font-bold ring-1 ring-blue-500/20">
                              {selectedLead.keyContactName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground/90">{selectedLead.keyContactName}</div>
                              <div className="text-xs text-muted-foreground">
                                {selectedLead.keyContactTitle || 'Key Contact'}{selectedLead.keyContactEmail ? ` · ${selectedLead.keyContactEmail}` : ''}
                              </div>
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
                          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground/80 transition-colors">
                            <Phone className="h-3.5 w-3.5" />
                            {selectedLead.phoneMain}
                          </div>
                        )}
                        {selectedLead.generalEmail && (
                          <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground/80 transition-colors">
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

                    {/* AI Suggested Next Action — Compact */}
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
                          {renderPipelineProgress()}
                          <div className="space-y-2.5">
                            {actionItems.map(action => renderActionItem(action))}
                          </div>
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

                    {/* Update Stage */}
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

                    {/* Delete */}
                    <div className="flex gap-2 pt-2">
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
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* TAB: ENRICH                               */}
                {/* ═══════════════════════════════════════════ */}
                {activePanelTab === 'enrich' && (
                  <div className="p-5 space-y-4">
                    {/* Enrichment Dashboard Summary */}
                    <div className="rounded-xl border border-violet-500/15 bg-gradient-to-br from-violet-500/8 via-card to-purple-500/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                            <Cpu style={{ width: 16, height: 16 }} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground/90">Enrichment Engine</h4>
                            <p className="text-[10px] text-muted-foreground">9 AI capabilities ready</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">
                            {enrichmentTasks.filter(t => t.status === 'completed').length}/{enrichmentTasks.length} done
                          </span>
                          <Button
                            size="sm"
                            className="h-7 gap-1.5 text-[10px] bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/20"
                            onClick={runAllEnrichments}
                            disabled={enrichmentTasks.some(t => t.status === 'running')}
                          >
                            {enrichmentTasks.some(t => t.status === 'running') ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Zap style={{ width: 12, height: 12 }} />
                            )}
                            Run All
                          </Button>
                        </div>
                      </div>
                      {/* Overall progress */}
                      <div className="h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-400 transition-all duration-700"
                          style={{ width: `${(enrichmentTasks.filter(t => t.status === 'completed').length / enrichmentTasks.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Enrichment Task Cards */}
                    <div className="grid grid-cols-1 gap-2.5">
                      {enrichmentTasks.map(task => {
                        const IconComp = task.icon;
                        const isRunning = task.status === 'running';
                        const isDone = task.status === 'completed';
                        const isFailed = task.status === 'failed';

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              'group relative rounded-xl border p-3.5 transition-all duration-300',
                              isDone
                                ? `${task.borderColor} ${task.bgColor} shadow-sm`
                                : isRunning
                                ? 'border-blue-500/25 bg-blue-500/5 shadow-sm shadow-blue-500/5'
                                : isFailed
                                ? 'border-red-500/20 bg-red-500/5'
                                : 'border-border/15 bg-secondary/5 hover:bg-secondary/10 hover:border-border/30'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-all',
                                isDone ? `${task.bgColor} ring-1 ${task.borderColor}` :
                                isRunning ? 'bg-blue-500/15 ring-1 ring-blue-500/20' :
                                'bg-secondary/20'
                              )}>
                                {isRunning ? (
                                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                                ) : (
                                  <IconComp className={cn('h-4 w-4', isDone ? task.color : 'text-muted-foreground/60')} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={cn(
                                    'text-sm font-semibold',
                                    isDone ? 'text-foreground/90' : 'text-foreground/70'
                                  )}>{task.label}</span>
                                  {isDone && (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                  )}
                                  {isFailed && (
                                    <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{task.description}</p>

                                {/* Show result preview if completed */}
                                {isDone && task.result && (
                                  <div className="mt-2 p-2.5 rounded-lg bg-secondary/15 border border-border/10 text-[11px] text-foreground/70 leading-relaxed max-h-28 overflow-y-auto">
                                    {typeof task.result === 'string'
                                      ? task.result.slice(0, 300)
                                      : JSON.stringify(task.result, null, 0).slice(0, 300)}
                                    {(typeof task.result === 'string' ? task.result.length : JSON.stringify(task.result).length) > 300 && '...'}
                                  </div>
                                )}

                                {/* Show error if failed */}
                                {isFailed && task.error && (
                                  <div className="mt-2 text-[10px] text-red-400/80">{task.error}</div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                  'h-7 shrink-0 gap-1 text-[10px] transition-all',
                                  isDone
                                    ? `${task.color} hover:${task.bgColor}`
                                    : isRunning
                                    ? 'text-blue-400'
                                    : `${task.color} opacity-0 group-hover:opacity-100`
                                )}
                                onClick={() => runEnrichmentTask(task.id)}
                                disabled={isRunning}
                              >
                                {isRunning ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : isDone ? (
                                  <RefreshCw className="h-3 w-3" />
                                ) : (
                                  <PlayCircle className="h-3 w-3" />
                                )}
                                {isRunning ? 'Running' : isDone ? 'Re-run' : 'Run'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* AI Scoring Deep Panel (if result available from enrich tab) */}
                    {enrichmentResults['ai_score'] && (
                      <div className="rounded-xl border border-violet-500/15 bg-violet-500/5 p-4 space-y-3">
                        <h5 className="text-xs font-semibold text-violet-400 flex items-center gap-1.5">
                          <Gauge style={{ width: 14, height: 14 }} />
                          AI Deep Score Result
                        </h5>
                        {aiScoring && (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
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
                            {aiScoring.outreachAngle && (
                              <div className="pt-2 border-t border-border/15">
                                <div className="text-[10px] text-muted-foreground mb-1">Recommended outreach angle ({aiScoring.nextBestChannel})</div>
                                <p className="text-xs text-foreground/80 leading-relaxed">{aiScoring.outreachAngle}</p>
                              </div>
                            )}
                          </>
                        )}
                        {aiScoringError && (
                          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-400 flex items-center gap-2">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                            {aiScoringError}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Enrichment Data Panel (from action pipeline) */}
                    {totalEnrichments > 0 && (
                      <div className="pt-3 border-t border-border/15">
                        {renderEnrichmentPanel()}
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* TAB: LIVE ENRICH                           */}
                {/* ═══════════════════════════════════════════ */}
                {activePanelTab === 'live' && (
                  <div className="p-5 space-y-4">
                    {/* Live Enrich Hero Card */}
                    <div className="rounded-xl border border-gradient-from-orange-500/20 to-red-500/20 bg-gradient-to-br from-orange-500/8 via-card to-red-500/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 ring-1 ring-orange-500/20">
                            <Zap className="h-4 w-4 text-orange-400" />
                            {liveEnrichRunning && (
                              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
                              </span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-foreground/90">Live Enrich Pipeline</h4>
                            <p className="text-[10px] text-muted-foreground">
                              {liveEnrichRunning ? 'Agents working live...' : '5-phase enrichment → Super Hot'}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="h-8 gap-1.5 text-[11px] bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/25"
                          onClick={runLiveEnrich}
                          disabled={liveEnrichRunning}
                        >
                          {liveEnrichRunning ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Enriching...
                            </>
                          ) : (
                            <>
                              <Rocket className="h-3.5 w-3.5" />
                              Run Live Enrich
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Tier Upgrade Visualization */}
                      {selectedLead && (
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-[10px] text-muted-foreground">Current:</span>
                            <Badge variant="outline" className={`text-[9px] ${TIER_COLORS[selectedLead.leadTier as LeadTier] || ''}`}>
                              {selectedLead.leadTier}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                            <span className="text-[10px] text-muted-foreground">Target:</span>
                            <Badge variant="outline" className="text-[9px] bg-gradient-to-r from-red-500/15 to-orange-500/15 text-red-500 border-red-500/30">
                              super_hot
                            </Badge>
                          </div>
                          {/* Tier Progress Bar */}
                          <div className="flex items-center gap-1">
                            {['unqualified', 'cold', 'warm', 'hot', 'super_hot'].map((tier, idx) => {
                              const thresholds = [0, 25, 45, 70, 88];
                              const currentIdx = ['unqualified', 'cold', 'warm', 'hot', 'super_hot'].indexOf(selectedLead.leadTier);
                              const isReached = idx <= currentIdx;
                              const isCurrent = tier === selectedLead.leadTier;
                              const isTarget = tier === 'super_hot';
                              return (
                                <div key={tier} className="flex-1 flex flex-col items-center gap-0.5">
                                  <div className={cn(
                                    'h-1.5 w-full rounded-full transition-all duration-500',
                                    isReached
                                      ? isTarget
                                        ? 'bg-gradient-to-r from-orange-400 to-red-400'
                                        : isCurrent
                                        ? 'bg-blue-400'
                                        : 'bg-emerald-400/60'
                                      : 'bg-secondary/30'
                                  )} />
                                  <span className={cn(
                                    'text-[8px] font-medium',
                                    isCurrent ? 'text-foreground/80' : isReached ? 'text-muted-foreground/60' : 'text-muted-foreground/30'
                                  )}>
                                    {tier === 'super_hot' ? 'SUPER' : tier.slice(0, 4)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pipeline Health Quick Stats */}
                      {liveEnrichResult?.pipelineHealth && (
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          <div className="rounded-lg bg-secondary/15 p-2 text-center">
                            <div className="text-lg font-bold text-emerald-400">+{liveEnrichResult.pipelineHealth.scoreImprovement}</div>
                            <div className="text-[9px] text-muted-foreground">Score Boost</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2 text-center">
                            <div className="text-lg font-bold text-blue-400">{liveEnrichResult.pipelineHealth.fieldsEnriched}</div>
                            <div className="text-[9px] text-muted-foreground">Fields Enriched</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2 text-center">
                            <div className="text-lg font-bold text-violet-400">{liveEnrichResult.pipelineHealth.pipelineEfficiency}%</div>
                            <div className="text-[9px] text-muted-foreground">Pipeline Efficiency</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Live Pipeline Steps */}
                    {liveEnrichSteps.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-orange-400" />
                          Pipeline Progress
                        </h5>
                        {liveEnrichSteps.map((step, idx) => {
                          const isCompleted = step.status === 'completed';
                          const isRunning = step.status === 'running';
                          const isFailed = step.status === 'failed';
                          const phaseColors = [
                            'from-blue-500/15 to-cyan-500/15 border-blue-500/20',
                            'from-violet-500/15 to-purple-500/15 border-violet-500/20',
                            'from-emerald-500/15 to-green-500/15 border-emerald-500/20',
                            'from-orange-500/15 to-amber-500/15 border-orange-500/20',
                            'from-rose-500/15 to-pink-500/15 border-rose-500/20',
                          ];
                          const phaseIcons = [Database, Shield, Gauge, Rocket, MessageSquare];
                          const PhaseIcon = phaseIcons[idx] || Database;

                          return (
                            <div
                              key={step.step}
                              className={cn(
                                'rounded-xl border p-3.5 transition-all duration-300',
                                isCompleted
                                  ? `bg-gradient-to-r ${phaseColors[idx] || phaseColors[0]}`
                                  : isRunning
                                  ? 'border-orange-500/25 bg-orange-500/5 shadow-sm shadow-orange-500/5'
                                  : isFailed
                                  ? 'border-red-500/20 bg-red-500/5'
                                  : 'border-border/15 bg-secondary/5'
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div className={cn(
                                  'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                                  isCompleted
                                    ? `bg-gradient-to-r ${phaseColors[idx] || phaseColors[0]}`
                                    : isRunning
                                    ? 'bg-orange-500/15 ring-1 ring-orange-500/20'
                                    : 'bg-secondary/20'
                                )}>
                                  {isRunning ? (
                                    <Loader2 className="h-4 w-4 text-orange-400 animate-spin" />
                                  ) : isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                  ) : isFailed ? (
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                  ) : (
                                    <PhaseIcon className="h-4 w-4 text-muted-foreground/60" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[10px] text-muted-foreground/60 font-medium">Phase {step.phase}</span>
                                    <span className={cn(
                                      'text-sm font-semibold',
                                      isCompleted ? 'text-foreground/90' : 'text-foreground/70'
                                    )}>
                                      {step.label}
                                    </span>
                                    {isCompleted && (
                                      <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-400 bg-emerald-500/10 h-4">
                                        Done
                                      </Badge>
                                    )}
                                  </div>
                                  {step.result && (
                                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">{step.result}</p>
                                  )}
                                  {step.fieldsUpdated && step.fieldsUpdated.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {step.fieldsUpdated.map(field => (
                                        <span key={field} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                          {field}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {step.scoreImpact && step.scoreImpact.after !== step.scoreImpact.before && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                                      <span className="text-[10px] text-emerald-400 font-medium">
                                        {step.scoreImpact.before} → {step.scoreImpact.after} (+{step.scoreImpact.after - step.scoreImpact.before})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Tier Upgrade Result */}
                    {liveEnrichResult?.tierUpgrade && (
                      <div className={cn(
                        'rounded-xl border p-4',
                        liveEnrichResult.tierUpgrade.newTier === 'super_hot'
                          ? 'border-orange-500/25 bg-gradient-to-br from-orange-500/8 via-card to-red-500/5'
                          : liveEnrichResult.tierUpgrade.previousTier !== liveEnrichResult.tierUpgrade.newTier
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-border/20 bg-secondary/5'
                      )}>
                        <div className="flex items-center gap-2.5 mb-3">
                          {liveEnrichResult.tierUpgrade.newTier === 'super_hot' ? (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 ring-1 ring-orange-500/25">
                              <Zap className="h-5 w-5 text-orange-400" />
                            </div>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20">
                              <TrendingUp className="h-5 w-5 text-emerald-400" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground/90">
                              {liveEnrichResult.tierUpgrade.newTier === 'super_hot'
                                ? 'Super Hot Achieved!'
                                : liveEnrichResult.tierUpgrade.previousTier !== liveEnrichResult.tierUpgrade.newTier
                                ? 'Tier Upgraded!'
                                : 'Tier Analysis Complete'}
                            </h4>
                            <p className="text-[10px] text-muted-foreground">
                              {liveEnrichResult.tierUpgrade.upgradeReason}
                            </p>
                          </div>
                        </div>

                        {/* Before/After Comparison */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="rounded-lg bg-secondary/15 p-2.5 text-center">
                            <div className="text-[9px] text-muted-foreground mb-1">Before</div>
                            <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[liveEnrichResult.tierUpgrade.previousTier as LeadTier] || ''}`}>
                              {liveEnrichResult.tierUpgrade.previousTier}
                            </Badge>
                            <div className="text-sm font-bold text-foreground/70 mt-1">{liveEnrichResult.tierUpgrade.previousScore}/100</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2.5 text-center">
                            <div className="text-[9px] text-muted-foreground mb-1">After</div>
                            <Badge variant="outline" className={`text-[10px] ${TIER_COLORS[liveEnrichResult.tierUpgrade.newTier as LeadTier] || ''}`}>
                              {liveEnrichResult.tierUpgrade.newTier}
                            </Badge>
                            <div className="text-sm font-bold text-foreground/90 mt-1">{liveEnrichResult.tierUpgrade.newScore}/100</div>
                          </div>
                        </div>

                        {/* Upgrade Path */}
                        {liveEnrichResult.tierUpgrade.upgradePath.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] text-muted-foreground mb-1.5">Upgrade Path</div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {liveEnrichResult.tierUpgrade.upgradePath.map((tier, idx) => (
                                <React.Fragment key={tier}>
                                  <Badge variant="outline" className={`text-[9px] ${TIER_COLORS[tier as LeadTier] || ''}`}>
                                    {tier === 'super_hot' ? 'SUPER HOT' : tier}
                                  </Badge>
                                  {idx < liveEnrichResult.tierUpgrade.upgradePath.length - 1 && (
                                    <ArrowRight className="h-3 w-3 text-muted-foreground/40" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Remaining Gaps */}
                        {liveEnrichResult.tierUpgrade.remainingGaps.length > 0 && (
                          <div className="mb-3">
                            <div className="text-[10px] text-muted-foreground mb-1.5">Remaining Gaps to Super Hot</div>
                            <div className="space-y-1">
                              {liveEnrichResult.tierUpgrade.remainingGaps.map((gap, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-[11px] text-foreground/70">
                                  <Circle className="h-2 w-2 text-amber-400/60 shrink-0" />
                                  {gap}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommended Actions */}
                        {liveEnrichResult.tierUpgrade.recommendedActions.length > 0 && (
                          <div>
                            <div className="text-[10px] text-muted-foreground mb-1.5">Recommended Next Actions</div>
                            <div className="space-y-1.5">
                              {liveEnrichResult.tierUpgrade.recommendedActions.slice(0, 5).map((action, idx) => (
                                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/10 border border-border/10">
                                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-bold shrink-0 mt-0.5">
                                    {idx + 1}
                                  </div>
                                  <span className="text-[11px] text-foreground/80 leading-relaxed">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Confidence Score */}
                        {liveEnrichResult.tierUpgrade.confidence > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/15">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground">Upgrade Confidence</span>
                              <span className="text-[11px] font-semibold text-foreground/80">{Math.round(liveEnrichResult.tierUpgrade.confidence * 100)}%</span>
                            </div>
                            <div className="mt-1 h-1.5 rounded-full bg-secondary/30 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-700"
                                style={{ width: `${Math.round(liveEnrichResult.tierUpgrade.confidence * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Pipeline Health (from API) */}
                    {pipelineHealthData && (
                      <div className="rounded-xl border border-border/20 bg-secondary/5 p-4">
                        <h5 className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5 mb-3">
                          <Activity className="h-3.5 w-3.5 text-cyan-400" />
                          Pipeline Health Overview
                        </h5>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-lg bg-secondary/15 p-2.5">
                            <div className="text-[9px] text-muted-foreground mb-0.5">Total Leads</div>
                            <div className="text-sm font-bold text-foreground/90">{pipelineHealthData.totalLeads as number || 0}</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2.5">
                            <div className="text-[9px] text-muted-foreground mb-0.5">Super Hot Rate</div>
                            <div className="text-sm font-bold text-orange-400">{((pipelineHealthData.superHot as Record<string, number>)?.rate || 0)}%</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2.5">
                            <div className="text-[9px] text-muted-foreground mb-0.5">Enrichment Rate</div>
                            <div className="text-sm font-bold text-violet-400">{((pipelineHealthData.enrichment as Record<string, number>)?.enrichedRate || 0)}%</div>
                          </div>
                          <div className="rounded-lg bg-secondary/15 p-2.5">
                            <div className="text-[9px] text-muted-foreground mb-0.5">Pipeline Efficiency</div>
                            <div className="text-sm font-bold text-emerald-400">{pipelineHealthData.pipelineEfficiency as number || 0}%</div>
                          </div>
                        </div>

                        {/* Tier Distribution */}
                        {(pipelineHealthData.tierDistribution as Record<string, number>) && (
                          <div className="mt-3 pt-3 border-t border-border/15">
                            <div className="text-[9px] text-muted-foreground mb-1.5">Tier Distribution</div>
                            <div className="flex gap-1.5">
                              {Object.entries(pipelineHealthData.tierDistribution as Record<string, number>).map(([tier, count]) => {
                                const total = pipelineHealthData.totalLeads as number || 1;
                                const pct = Math.round((count / total) * 100);
                                return (
                                  <div key={tier} className="flex-1 text-center">
                                    <div className="h-1.5 rounded-full bg-secondary/30 overflow-hidden mb-1">
                                      <div
                                        className={cn(
                                          'h-full rounded-full',
                                          tier === 'super_hot' ? 'bg-gradient-to-r from-orange-400 to-red-400' :
                                          tier === 'hot' ? 'bg-red-400' :
                                          tier === 'warm' ? 'bg-amber-400' :
                                          tier === 'cold' ? 'bg-blue-400' : 'bg-gray-400'
                                        )}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <div className="text-[8px] text-muted-foreground">{tier === 'super_hot' ? 'SUPER' : tier.slice(0, 4)}</div>
                                    <div className="text-[9px] font-semibold text-foreground/70">{count}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Empty State */}
                    {!liveEnrichRunning && liveEnrichSteps.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 ring-1 ring-orange-500/15">
                          <Zap className="h-7 w-7 text-orange-400/60" />
                        </div>
                        <div className="text-center space-y-1.5">
                          <h4 className="text-sm font-semibold text-foreground/80">Live Enrichment Ready</h4>
                          <p className="text-[11px] text-muted-foreground max-w-[300px]">
                            Run the 5-phase live enrichment pipeline to enrich this lead, upgrade its tier, and push it toward Super Hot status.
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
                          {[
                            { label: 'Data Gathering', icon: Database, color: 'blue' },
                            { label: 'BANT Analysis', icon: Shield, color: 'violet' },
                            { label: 'Deep Scoring', icon: Gauge, color: 'emerald' },
                            { label: 'Tier Upgrade', icon: Rocket, color: 'orange' },
                            { label: 'Action Synthesis', icon: MessageSquare, color: 'rose' },
                          ].map((phase, idx) => (
                            <div
                              key={idx}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-medium border',
                                phase.color === 'blue' ? 'border-blue-500/15 text-blue-400 bg-blue-500/5' :
                                phase.color === 'violet' ? 'border-violet-500/15 text-violet-400 bg-violet-500/5' :
                                phase.color === 'emerald' ? 'border-emerald-500/15 text-emerald-400 bg-emerald-500/5' :
                                phase.color === 'orange' ? 'border-orange-500/15 text-orange-400 bg-orange-500/5' :
                                'border-rose-500/15 text-rose-400 bg-rose-500/5'
                              )}
                            >
                              <phase.icon style={{ width: 9, height: 9 }} />
                              P{idx + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* TAB: AGENT                                */}
                {/* ═══════════════════════════════════════════ */}
                {activePanelTab === 'agent' && (
                  <div className="flex flex-col h-full min-h-[500px]">
                    {/* Agent Status Bar */}
                    <div className="px-4 py-2.5 border-b border-border/15 bg-gradient-to-r from-emerald-500/5 via-card to-cyan-500/5">
                      <div className="flex items-center gap-2">
                        <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 ring-1 ring-emerald-500/20">
                          <Bot style={{ width: 14, height: 14 }} className="text-emerald-400" />
                          <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                          </span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground/90">LeadReach AI Agent</div>
                          <div className="text-[10px] text-muted-foreground">
                            {agentIsTyping || agentChatLoading ? 'Thinking...' : 'Ready · Ask anything about this lead'}
                          </div>
                        </div>
                        <div className="flex-1" />
                        {agentMessages.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[9px] text-muted-foreground hover:text-foreground/70"
                            onClick={() => setAgentMessages([])}
                          >
                            <Trash2 className="h-2.5 w-2.5 mr-1" />
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                      {agentMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 ring-1 ring-emerald-500/15">
                            <Bot style={{ width: 28, height: 28 }} className="text-emerald-400/60" />
                          </div>
                          <div className="text-center space-y-1.5">
                            <h4 className="text-sm font-semibold text-foreground/80">AI Agent Ready</h4>
                            <p className="text-[11px] text-muted-foreground max-w-[280px]">
                              Ask me to enrich, score, research, or analyze this lead. I have full access to all 9 enrichment capabilities.
                            </p>
                          </div>
                          {/* Quick action prompts */}
                          <div className="flex flex-wrap justify-center gap-1.5 max-w-[320px]">
                            {[
                              { label: 'Enrich this lead', icon: Wand2, color: 'violet' },
                              { label: 'Predict conversion', icon: TrendingUp, color: 'cyan' },
                              { label: 'Research company', icon: Scan, color: 'indigo' },
                              { label: 'Score with AI', icon: Gauge, color: 'emerald' },
                              { label: 'Find decision makers', icon: UserSearch, color: 'blue' },
                              { label: 'Draft outreach', icon: MessageSquare, color: 'amber' },
                            ].map((prompt, idx) => (
                              <button
                                key={idx}
                                className={cn(
                                  'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium border transition-all duration-200',
                                  prompt.color === 'violet' ? 'border-violet-500/15 text-violet-400 bg-violet-500/5 hover:bg-violet-500/15' :
                                  prompt.color === 'cyan' ? 'border-cyan-500/15 text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/15' :
                                  prompt.color === 'indigo' ? 'border-indigo-500/15 text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/15' :
                                  prompt.color === 'emerald' ? 'border-emerald-500/15 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/15' :
                                  prompt.color === 'blue' ? 'border-blue-500/15 text-blue-400 bg-blue-500/5 hover:bg-blue-500/15' :
                                  'border-amber-500/15 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15'
                                )}
                                onClick={() => {
                                  setAgentInput(prompt.label);
                                  setTimeout(() => agentInputRef.current?.focus(), 50);
                                }}
                              >
                                <prompt.icon style={{ width: 10, height: 10 }} />
                                {prompt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {agentMessages.map(msg => (
                        <div key={msg.id} className={cn(
                          'flex gap-2.5',
                          msg.role === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                          {msg.role === 'assistant' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 ring-1 ring-emerald-500/20 shrink-0 mt-0.5">
                              <Bot style={{ width: 14, height: 14 }} className="text-emerald-400" />
                            </div>
                          )}
                          <div className={cn(
                            'max-w-[85%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-blue-500/10 text-foreground/90 border border-blue-500/15'
                              : 'bg-secondary/20 text-foreground/80 border border-border/15'
                          )}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                            <div className="text-[9px] text-muted-foreground/50 mt-1.5">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          {msg.role === 'user' && (
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 shrink-0 mt-0.5">
                              <Users style={{ width: 14, height: 14 }} className="text-blue-400" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {(agentIsTyping || agentChatLoading) && (
                        <div className="flex gap-2.5 justify-start">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/15 to-cyan-500/15 ring-1 ring-emerald-500/20 shrink-0">
                            <Bot style={{ width: 14, height: 14 }} className="text-emerald-400" />
                          </div>
                          <div className="bg-secondary/20 border border-border/15 rounded-xl px-4 py-3">
                            <div className="flex gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={agentChatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="px-4 py-3 border-t border-border/15 bg-secondary/5">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            ref={agentInputRef}
                            value={agentInput}
                            onChange={(e) => setAgentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAgentSend();
                              }
                            }}
                            placeholder={`Ask about ${selectedLead.companyName}...`}
                            className="bg-secondary/20 border-border/20 text-sm h-9 pr-10 focus-visible:ring-emerald-500/30"
                            disabled={agentIsTyping || agentChatLoading}
                          />
                          <Button
                            size="icon"
                            className="absolute right-1 top-1 h-7 w-7 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20 rounded-md"
                            onClick={handleAgentSend}
                            disabled={!agentInput.trim() || agentIsTyping || agentChatLoading}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
