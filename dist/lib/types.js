"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMPANY_SIZES = exports.LOCATIONS = exports.INDUSTRIES = exports.STAGE_COLORS = exports.TIER_COLORS = exports.STAGE_LABELS = exports.AGENT_DEFINITIONS = void 0;
exports.AGENT_DEFINITIONS = [
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
exports.STAGE_LABELS = {
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
exports.TIER_COLORS = {
    hot: 'bg-red-500/10 text-red-600 border-red-500/20',
    warm: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    cold: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    unqualified: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};
exports.STAGE_COLORS = {
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
exports.INDUSTRIES = [
    'Accounting', 'Advertising', 'Aerospace', 'Agriculture', 'Automotive',
    'Banking', 'Biotechnology', 'Construction', 'Consulting', 'Education',
    'Energy', 'Engineering', 'Finance', 'Food & Beverage', 'Healthcare',
    'Hospitality', 'Insurance', 'Legal', 'Manufacturing', 'Marketing',
    'Media', 'Pharmaceuticals', 'Real Estate', 'Retail', 'Technology',
    'Telecommunications', 'Transportation', 'Travel', 'Utilities',
];
exports.LOCATIONS = [
    'Dubai, UAE', 'Singapore', 'London, UK', 'New York, USA', 'San Francisco, USA',
    'Tokyo, Japan', 'Sydney, Australia', 'Toronto, Canada', 'Berlin, Germany',
    'Paris, France', 'Mumbai, India', 'São Paulo, Brazil', 'Hong Kong',
    'Amsterdam, Netherlands', 'Stockholm, Sweden', 'Zurich, Switzerland',
];
exports.COMPANY_SIZES = [
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+',
];
