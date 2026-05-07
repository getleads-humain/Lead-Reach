export type ViewType = 'dashboard' | 'campaigns' | 'leads' | 'agents' | 'outreach' | 'reports';

export type CampaignStatus = 'active' | 'paused' | 'completed' | 'archived';
export type LeadTier = 'hot' | 'warm' | 'cold' | 'unqualified';
export type LeadStage = 'new' | 'enriched' | 'qualified' | 'contacted' | 'engaged' | 'negotiating' | 'closed_won' | 'closed_lost' | 'nurture';
export type OutreachChannel = 'email' | 'linkedin' | 'phone';
export type OutreachType = 'cold_email' | 'warm_intro' | 'connection_request' | 'follow_up_1' | 'follow_up_2' | 'break_up';
export type OutreachStatus = 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed';
export type AgentName = 'orchestrator' | 'prospect-discovery' | 'data-enrichment' | 'web-research' | 'lead-qualification' | 'outreach-composer' | 'pipeline-manager' | 'report-generator';
export type AgentTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ChannelStatus = 'ok' | 'warn' | 'off' | 'error' | 'unknown';

export interface CampaignWithCounts {
  id: string;
  name: string;
  description: string | null;
  status: CampaignStatus;
  targetIndustry: string | null;
  targetLocation: string | null;
  targetCompanySize: string | null;
  targetCriteria: string | null;
  leadsFound: number;
  leadsQualified: number;
  leadsContacted: number;
  leadsResponded: number;
  createdAt: string;
  updatedAt: string;
  _count?: { leads: number };
}

export interface AgentInfo {
  name: AgentName;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'idle' | 'processing' | 'error';
  tasksCompleted: number;
  tasksInProgress: number;
  tasksFailed: number;
  currentTask: string | null;
  lastActivity: string | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export const AGENT_DEFINITIONS: Omit<AgentInfo, 'status' | 'tasksCompleted' | 'tasksInProgress' | 'tasksFailed' | 'currentTask' | 'lastActivity'>[] = [
  {
    name: 'orchestrator',
    displayName: 'Orchestrator',
    description: 'Coordinates all agents and manages workflow execution',
    icon: 'Brain',
    color: '#8B5CF6',
  },
  {
    name: 'prospect-discovery',
    displayName: 'Prospect Discovery',
    description: 'Searches and discovers potential leads using multiple channels',
    icon: 'Search',
    color: '#10B981',
  },
  {
    name: 'data-enrichment',
    displayName: 'Data Enrichment',
    description: 'Enriches lead data with firmographics, contacts, and digital presence',
    icon: 'Database',
    color: '#3B82F6',
  },
  {
    name: 'web-research',
    displayName: 'Web Research',
    description: 'Deep web research on companies, industries, and market trends',
    icon: 'Globe',
    color: '#06B6D4',
  },
  {
    name: 'lead-qualification',
    displayName: 'Lead Qualification',
    description: 'Scores and qualifies leads based on ICP criteria',
    icon: 'Target',
    color: '#F59E0B',
  },
  {
    name: 'outreach-composer',
    displayName: 'Outreach Composer',
    description: 'Crafts personalized outreach messages and sequences',
    icon: 'Mail',
    color: '#EC4899',
  },
  {
    name: 'pipeline-manager',
    displayName: 'Pipeline Manager',
    description: 'Manages lead pipeline stages and follow-up schedules',
    icon: 'GitBranch',
    color: '#6366F1',
  },
  {
    name: 'report-generator',
    displayName: 'Report Generator',
    description: 'Generates analytics reports and campaign insights',
    icon: 'BarChart3',
    color: '#EF4444',
  },
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  enriched: 'Enriched',
  qualified: 'Qualified',
  contacted: 'Contacted',
  engaged: 'Engaged',
  negotiating: 'Negotiating',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  nurture: 'Nurture',
};

export const TIER_COLORS: Record<LeadTier, string> = {
  hot: 'bg-red-500/10 text-red-600 border-red-500/20',
  warm: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  cold: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  unqualified: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export const STAGE_COLORS: Record<LeadStage, string> = {
  new: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  enriched: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  qualified: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  contacted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  engaged: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  negotiating: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  closed_won: 'bg-green-500/10 text-green-600 border-green-500/20',
  closed_lost: 'bg-red-500/10 text-red-600 border-red-500/20',
  nurture: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export const INDUSTRIES = [
  'Accounting', 'Advertising', 'Aerospace', 'Agriculture', 'Automotive',
  'Banking', 'Biotechnology', 'Construction', 'Consulting', 'Education',
  'Energy', 'Engineering', 'Finance', 'Food & Beverage', 'Healthcare',
  'Hospitality', 'Insurance', 'Legal', 'Manufacturing', 'Marketing',
  'Media', 'Pharmaceuticals', 'Real Estate', 'Retail', 'Technology',
  'Telecommunications', 'Transportation', 'Travel', 'Utilities',
];

export const LOCATIONS = [
  'Dubai, UAE', 'Singapore', 'London, UK', 'New York, USA', 'San Francisco, USA',
  'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada', 'Berlin, Germany',
  'Paris, France', 'Mumbai, India', 'São Paulo, Brazil', 'Hong Kong',
  'Amsterdam, Netherlands', 'Stockholm, Sweden', 'Zurich, Switzerland',
];

export const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+',
];
