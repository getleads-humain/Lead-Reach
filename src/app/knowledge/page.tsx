'use client';

/**
 * /knowledge — Knowledge Base Admin UI (Premium Redesign)
 * ========================================================
 *
 * Browse, search, and inspect the LeadReach knowledge base.
 *
 * Data sources:
 *   - GET  /api/knowledge/stats
 *   - GET  /api/knowledge/list
 *   - GET  /api/knowledge/search?q=...
 *   - GET  /api/knowledge/doc?path=...
 *   - GET  /api/knowledge/gap-report
 *   - POST /api/knowledge/gap-report  (regenerate)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  Search,
  FileText,
  Globe,
  Briefcase,
  Wrench,
  GraduationCap,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Database,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowLeft,
  Zap,
  Layers,
  BarChart3,
  Compass,
  Shield,
  Bot,
  Plug,
  Package,
  FileCode,
  Microscope,
  Award,
  Target,
  Swords,
  Cpu,
  Users,
  Building,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { hexToRgba } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface KnowledgeFile {
  path: string;
  category: 'industry' | 'region' | 'playbook' | 'domain' | 'methodology' | 'agent' | 'tool' | 'integration' | 'compliance' | 'case-study' | 'product' | 'template' | 'dataset' | 'training-data' | 'gap-report' | 'kpi' | 'competitive-intel' | 'technology' | 'buyer-intel' | 'vertical-playbook' | 'sales-ops';
  title: string;
  grade?: string;
  lastReviewed?: string;
  tags?: string[];
}

interface KnowledgeStats {
  totalDocs: number;
  totalChunks: number;
  byCategory: Record<string, number>;
  byGrade: Record<string, number>;
  freshness: { fresh: number; stale: number; very_stale: number };
  embeddingsEnabled: boolean;
  embeddingsCoverage?: { cached: number; total: number };
}

interface SearchResult {
  chunkId: string;
  filePath: string;
  category: string;
  title: string;
  section?: string;
  contentPreview: string;
  score: number;
  matchedTokens: string[];
  retrievalMethod: 'bm25' | 'hybrid';
  grade?: string;
  lastReviewed?: string;
  tags?: string[];
}

interface GapReportResponse {
  ok: boolean;
  reportMonth?: string;
  reportPath?: string;
  content?: string;
  stats?: KnowledgeStats;
  generated?: boolean;
  result?: {
    generatedAt: string;
    reportMonth: string;
    reportPath: string;
    totalGaps: number;
    coverageGaps: {
      industriesMissing: string[];
      regionsMissing: string[];
      playbooksMissing: string[];
      domainsMissing: string[];
      agentsMissing: string[];
      methodologiesMissing: string[];
      integrationsMissing: string[];
      caseStudiesMissing: string[];
      productMissing: string[];
      complianceMissing: string[];
      templatesMissing: string[];
      datasetsMissing: string[];
      kpisMissing: string[];
      competitiveIntelMissing: string[];
      technologiesMissing: string[];
      buyerIntelMissing: string[];
      verticalPlaybooksMissing: string[];
      salesOpsMissing: string[];
    };
    qualityGaps: Array<{ path: string; title: string; grade: string; issue: string; recommendedAction: string }>;
    usageGaps: Array<{ path: string; title: string; lastReferenced: string; recommendation: string }>;
    freshnessGaps: Array<{ path: string; title: string; lastReviewed: string; recommendation: string }>;
    recommendations: { newDocsToAuthor: string[]; existingDocsToRefresh: string[] };
  };
  error?: string;
}

// ============================================================
// Constants
// ============================================================

const CATEGORY_META: Record<string, { icon: typeof FileText; label: string; color: string; darkColor: string; gradient: string; bgGlow: string; darkBgGlow: string; subCategories?: string[] }> = {
  industry: { icon: Briefcase, label: 'Industries', color: 'text-blue-600 dark:text-blue-400', darkColor: 'text-blue-600 dark:text-blue-400', gradient: 'from-blue-500 to-cyan-400', bgGlow: 'bg-blue-100 dark:bg-blue-500/20', darkBgGlow: 'bg-blue-500/20', subCategories: ['SaaS', 'Fintech', 'Healthtech', 'E-commerce', 'Manufacturing', 'Dev Tools', 'Cybersecurity', 'AI/ML', 'Legal', 'Education', 'Energy', 'Government', 'Nonprofit', 'Insurance', 'Telecom'] },
  region: { icon: Globe, label: 'Regions', color: 'text-emerald-600 dark:text-emerald-400', darkColor: 'text-emerald-600 dark:text-emerald-400', gradient: 'from-emerald-500 to-teal-400', bgGlow: 'bg-emerald-100 dark:bg-emerald-500/20', darkBgGlow: 'bg-emerald-500/20', subCategories: ['North America', 'Europe & GDPR', 'APAC', 'LATAM', 'MENA', 'Africa', 'Nordics', 'DACH'] },
  playbook: { icon: BookOpen, label: 'Playbooks', color: 'text-violet-600 dark:text-violet-400', darkColor: 'text-violet-600 dark:text-violet-400', gradient: 'from-violet-500 to-purple-400', bgGlow: 'bg-violet-100 dark:bg-violet-500/20', darkBgGlow: 'bg-violet-500/20', subCategories: ['Outbound', 'Inbound', 'Expansion', 'Competitive', 'Events', 'Partner', 'Renewal'] },
  domain: { icon: Compass, label: 'Domain Knowledge', color: 'text-sky-600 dark:text-sky-400', darkColor: 'text-sky-400', gradient: 'from-sky-500 to-blue-400', bgGlow: 'bg-sky-100 dark:bg-sky-500/20', darkBgGlow: 'bg-sky-500/20', subCategories: ['Lead Generation', 'Data Enrichment', 'ICP Design', 'Qualification', 'Outreach', 'Pipeline Mgmt', 'Revenue Ops', 'Competitive Intel', 'Social Selling'] },
  methodology: { icon: Microscope, label: 'Methodologies', color: 'text-amber-600 dark:text-amber-400', darkColor: 'text-amber-400', gradient: 'from-amber-500 to-yellow-400', bgGlow: 'bg-amber-100 dark:bg-amber-500/20', darkBgGlow: 'bg-amber-500/20', subCategories: ['MEDDIC/MEDDPICC', 'Challenger Sale', 'SPIN Selling', 'Sandler', 'Value Selling', 'Consultative', 'Inbound'] },
  agent: { icon: Bot, label: 'Agents', color: 'text-indigo-600 dark:text-indigo-400', darkColor: 'text-indigo-400', gradient: 'from-indigo-500 to-violet-400', bgGlow: 'bg-indigo-100 dark:bg-indigo-500/20', darkBgGlow: 'bg-indigo-500/20', subCategories: ['Atlas', 'Scout', 'Forge', 'Sage', 'Judge', 'Bard', 'Flow', 'Echo'] },
  tool: { icon: Wrench, label: 'Agent Tools', color: 'text-orange-600 dark:text-orange-400', darkColor: 'text-orange-400', gradient: 'from-orange-500 to-amber-400', bgGlow: 'bg-orange-100 dark:bg-orange-500/20', darkBgGlow: 'bg-orange-500/20' },
  integration: { icon: Plug, label: 'Integrations', color: 'text-cyan-600 dark:text-cyan-400', darkColor: 'text-cyan-400', gradient: 'from-cyan-500 to-teal-400', bgGlow: 'bg-cyan-100 dark:bg-cyan-500/20', darkBgGlow: 'bg-cyan-500/20', subCategories: ['CRM', 'Email', 'Calendar', 'Data Providers', 'Webhooks', 'Salesforce', 'HubSpot', 'Slack/Teams'] },
  compliance: { icon: Shield, label: 'Compliance', color: 'text-rose-600 dark:text-rose-400', darkColor: 'text-rose-400', gradient: 'from-rose-500 to-red-400', bgGlow: 'bg-rose-100 dark:bg-rose-500/20', darkBgGlow: 'bg-rose-500/20', subCategories: ['GDPR', 'CCPA/CPRA', 'CAN-SPAM/CASL', 'AI Ethics', 'SOC2/ISO27001', 'Export Controls'] },
  'case-study': { icon: Award, label: 'Case Studies', color: 'text-yellow-600 dark:text-yellow-400', darkColor: 'text-yellow-400', gradient: 'from-yellow-500 to-amber-400', bgGlow: 'bg-yellow-100 dark:bg-yellow-500/20', darkBgGlow: 'bg-yellow-500/20', subCategories: ['SaaS', 'Fintech', 'E-commerce', 'Healthtech', 'Manufacturing', 'Enterprise'] },
  product: { icon: Package, label: 'Product', color: 'text-slate-600 dark:text-slate-300', darkColor: 'text-slate-300', gradient: 'from-slate-500 to-zinc-400', bgGlow: 'bg-slate-100 dark:bg-slate-500/20', darkBgGlow: 'bg-slate-500/20', subCategories: ['Platform', 'Agent Pipeline', 'Security', 'Pricing', 'API', 'Analytics'] },
  template: { icon: FileCode, label: 'Templates', color: 'text-teal-600 dark:text-teal-400', darkColor: 'text-teal-400', gradient: 'from-teal-500 to-emerald-400', bgGlow: 'bg-teal-100 dark:bg-teal-500/20', darkBgGlow: 'bg-teal-500/20', subCategories: ['Prompts', 'Email Sequences', 'ICP Scoring', 'Cadences', 'Qualification', 'Objections', 'ROI Calculators', 'Discovery'] },
  dataset: { icon: Database, label: 'Datasets', color: 'text-fuchsia-600 dark:text-fuchsia-400', darkColor: 'text-fuchsia-400', gradient: 'from-fuchsia-500 to-pink-400', bgGlow: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', darkBgGlow: 'bg-fuchsia-500/20', subCategories: ['Few-Shot', 'Contact Attributes', 'Industry Codes', 'Technographics', 'Intent Signals', 'KPI Benchmarks', 'Firmographics'] },
  'training-data': { icon: GraduationCap, label: 'Training Data', color: 'text-pink-600 dark:text-pink-400', darkColor: 'text-pink-400', gradient: 'from-pink-500 to-rose-400', bgGlow: 'bg-pink-100 dark:bg-pink-500/20', darkBgGlow: 'bg-pink-500/20', subCategories: ['Atlas', 'Scout', 'Forge', 'Sage', 'Judge', 'Bard', 'Flow', 'Echo'] },
  'gap-report': { icon: AlertTriangle, label: 'Gap Reports', color: 'text-red-600 dark:text-red-400', darkColor: 'text-red-600 dark:text-red-400', gradient: 'from-red-500 to-orange-400', bgGlow: 'bg-red-100 dark:bg-red-500/20', darkBgGlow: 'bg-red-500/20' },
  kpi: { icon: Target, label: 'KPIs', color: 'text-lime-600 dark:text-lime-400', darkColor: 'text-lime-400', gradient: 'from-lime-500 to-green-400', bgGlow: 'bg-lime-100 dark:bg-lime-500/20', darkBgGlow: 'bg-lime-500/20', subCategories: ['Pipeline', 'Revenue', 'Activity', 'Efficiency', 'Customer', 'Marketing', 'Enablement', 'Data Quality', 'Outreach', 'SDR', 'Forecasting', 'Expansion'] },
  'competitive-intel': { icon: Swords, label: 'Competitive Intel', color: 'text-red-700 dark:text-red-300', darkColor: 'text-red-300', gradient: 'from-red-600 to-rose-500', bgGlow: 'bg-red-100 dark:bg-red-500/20', darkBgGlow: 'bg-red-500/20', subCategories: ['ZoomInfo', 'Apollo', 'Lusha', 'Outreach', 'Salesloft', 'Gong', '6sense', 'Clearbit', 'Demandbase', 'Hunter'] },
  technology: { icon: Cpu, label: 'Technologies', color: 'text-purple-600 dark:text-purple-400', darkColor: 'text-purple-400', gradient: 'from-purple-500 to-violet-400', bgGlow: 'bg-purple-100 dark:bg-purple-500/20', darkBgGlow: 'bg-purple-500/20', subCategories: ['CRM', 'Sales Engagement', 'Data Providers', 'Marketing Automation', 'Revenue Intel', 'AI/ML', 'Email Infra', 'Analytics/BI', 'Communication', 'Security'] },
  'buyer-intel': { icon: Users, label: 'Buyer Intel', color: 'text-orange-700 dark:text-orange-300', darkColor: 'text-orange-300', gradient: 'from-orange-600 to-amber-500', bgGlow: 'bg-orange-100 dark:bg-orange-500/20', darkBgGlow: 'bg-orange-500/20', subCategories: ['C-Suite Profiles', 'VP/Director Profiles', 'Champions', 'Buying Committees', 'Personas', 'Procurement', 'Buying Signals', 'Stakeholders'] },
  'vertical-playbook': { icon: Building, label: 'Vertical Playbooks', color: 'text-cyan-700 dark:text-cyan-300', darkColor: 'text-cyan-300', gradient: 'from-cyan-600 to-teal-500', bgGlow: 'bg-cyan-100 dark:bg-cyan-500/20', darkBgGlow: 'bg-cyan-500/20', subCategories: ['SaaS', 'Fintech', 'Healthtech', 'E-commerce', 'Manufacturing', 'Government', 'Education', 'Nonprofit'] },
  'sales-ops': { icon: Settings, label: 'Sales Operations', color: 'text-zinc-600 dark:text-zinc-300', darkColor: 'text-zinc-300', gradient: 'from-zinc-500 to-slate-400', bgGlow: 'bg-zinc-100 dark:bg-zinc-500/20', darkBgGlow: 'bg-zinc-500/20', subCategories: ['Territory Planning', 'Compensation', 'Process Optimization', 'Data Governance', 'Tech Stack', 'RevOps', 'Forecasting', 'Analytics'] },
};

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  A: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  B: { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-300 dark:border-blue-500/30', glow: 'shadow-blue-500/20' },
  C: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-500/30', glow: 'shadow-amber-500/20' },
  D: { bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-500/30', glow: 'shadow-red-500/20' },
};

// ============================================================
// Page
// ============================================================

export default function KnowledgeAdminPage() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('industry');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [gapReport, setGapReport] = useState<GapReportResponse | null>(null);
  const [generatingGap, setGeneratingGap] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [precomputing, setPrecomputing] = useState(false);
  const [precomputeMsg, setPrecomputeMsg] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    void loadStats();
    void loadList();
  }, []);

  const loadStats = async () => {
    try {
      const resp = await fetch('/api/knowledge/stats');
      const data = await resp.json();
      if (data.ok) setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadList = async () => {
    setLoadingList(true);
    try {
      const resp = await fetch('/api/knowledge/list');
      const data = await resp.json();
      if (data.ok) setFiles(data.files);
    } catch (err) {
      console.error('Failed to load list:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const loadFile = async (filePath: string) => {
    setLoadingFile(true);
    setSelectedFile(filePath);
    try {
      const resp = await fetch(`/api/knowledge/doc?path=${encodeURIComponent(filePath)}`);
      const data = await resp.json();
      if (data.ok) setFileContent(data.content);
      else setFileContent(`Error: ${data.error}`);
    } catch (err) {
      setFileContent(`Error: ${(err as Error).message}`);
    } finally {
      setLoadingFile(false);
    }
  };

  const precomputeEmbeddings = async () => {
    setPrecomputing(true);
    setPrecomputeMsg(null);
    try {
      const resp = await fetch('/api/knowledge/precompute-embeddings', { method: 'POST' });
      const data = await resp.json();
      if (data.ok) {
        const r = data.result;
        setPrecomputeMsg(`Done — generated ${r.generated}, cached ${r.cached}/${r.total}, failed ${r.failed}`);
        await loadStats();
      } else {
        setPrecomputeMsg(`Error: ${data.error}`);
      }
    } catch (err) {
      setPrecomputeMsg(`Error: ${(err as Error).message}`);
    } finally {
      setPrecomputing(false);
    }
  };

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const resp = await fetch(`/api/knowledge/search?q=${encodeURIComponent(q)}&topK=20`);
      const data = await resp.json();
      if (data.ok) setSearchResults(data.results);
      else setSearchResults([]);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, runSearch]);

  const loadGapReport = async () => {
    try {
      const resp = await fetch('/api/knowledge/gap-report');
      const data: GapReportResponse = await resp.json();
      setGapReport(data);
    } catch (err) {
      console.error('Failed to load gap report:', err);
    }
  };

  const regenerateGapReport = async () => {
    setGeneratingGap(true);
    try {
      const resp = await fetch('/api/knowledge/gap-report', { method: 'POST' });
      const data: GapReportResponse = await resp.json();
      setGapReport(data);
      void loadStats();
    } catch (err) {
      console.error('Failed to regenerate gap report:', err);
    } finally {
      setGeneratingGap(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'gap-report' && !gapReport) {
      void loadGapReport();
    }
  }, [activeTab, gapReport]);

  const filesByCategory = files.reduce<Record<string, KnowledgeFile[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  const selectedFileData = selectedFile ? files.find(f => f.path === selectedFile) : null;

  const filteredFiles = activeSubCategory
    ? (filesByCategory[activeCategory] || []).filter(f =>
        f.tags?.some(t => t.toLowerCase().includes(activeSubCategory.toLowerCase())) ||
        f.title.toLowerCase().includes(activeSubCategory.toLowerCase()) ||
        f.path.toLowerCase().includes(activeSubCategory.toLowerCase().replace(/\s+/g, '-'))
      )
    : filesByCategory[activeCategory] || [];

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabItems = [
    { id: 'browse', label: 'Browse', icon: Layers },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'gap-report', label: 'Gap Report', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* ── Subtle ambient glow ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-200/10 dark:bg-violet-600/[0.03] rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-200/[0.07] dark:bg-fuchsia-600/[0.02] rounded-full blur-[180px]" />
      </div>

      {/* ── Header ── */}
      <header className="relative border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Knowledge Base</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {stats ? (
                    <span>{stats.totalDocs} documents · {stats.totalChunks} chunks</span>
                  ) : (
                    <span>Loading...</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            {mounted && (
              <div className="flex items-center gap-1 p-1 rounded-lg border border-border bg-muted/30">
                {([
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'system', icon: Monitor, label: 'System' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex items-center justify-center w-8 h-8 rounded-md transition-all duration-200 ${
                      theme === opt.value
                        ? 'bg-foreground/10 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    title={opt.label}
                  >
                    <opt.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => { void loadStats(); void loadList(); }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-border bg-muted/30 text-sm font-medium text-foreground/80 hover:bg-muted/50 hover:text-foreground transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="relative border-b border-border bg-background/50 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-8">
          <nav className="flex gap-1 py-1">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-foreground/[0.07] text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'browse' && stats && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {stats.totalDocs}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="relative max-w-[1400px] mx-auto px-6 lg:px-8 py-6 lg:py-8">

        {/* ═══════════════════════════════════════════════════
            BROWSE TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Category Grid */}
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Categories</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {Object.keys(CATEGORY_META).length} categories · {files.length} documents
                  </p>
                </div>
                {stats && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />{stats.freshness.fresh} fresh</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />{stats.freshness.stale} stale</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2">
                  {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                    const Icon = meta.icon;
                    const count = filesByCategory[cat]?.length || 0;
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { setActiveCategory(cat); setActiveSubCategory(null); }}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-sm transition-all duration-200 border ${
                          isActive
                            ? `${meta.bgGlow} ${meta.color} border-current/20 shadow-sm`
                            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-xs leading-tight text-center">{meta.label}</span>
                        <span className={`text-[11px] tabular-nums ${isActive ? meta.color : 'text-muted-foreground/70'}`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sub-Category Filters + File List + Document Viewer */}
            <div className="grid grid-cols-12 gap-6">
              {/* File List Panel */}
              <div className="col-span-12 lg:col-span-5 space-y-4">
                {/* Sub-categories */}
                {CATEGORY_META[activeCategory]?.subCategories && CATEGORY_META[activeCategory].subCategories!.length > 0 && (
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground">Sub-categories</h3>
                      {activeSubCategory && (
                        <button
                          onClick={() => setActiveSubCategory(null)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Clear filter
                        </button>
                      )}
                    </div>
                    <div className="p-3 flex flex-wrap gap-1.5">
                      {CATEGORY_META[activeCategory].subCategories!.map((sub) => {
                        const isActive = activeSubCategory === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => setActiveSubCategory(isActive ? null : sub)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                              isActive
                                ? 'bg-foreground/10 text-foreground border-foreground/20'
                                : 'bg-muted/40 text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/60'
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const meta = CATEGORY_META[activeCategory];
                        const Icon = meta?.icon || FileText;
                        return <Icon className={`w-4 h-4 ${meta?.color || 'text-muted-foreground'}`} />;
                      })()}
                      <h3 className="text-sm font-semibold text-foreground">
                        {CATEGORY_META[activeCategory]?.label || 'Files'}
                      </h3>
                    </div>
                    <span className="text-sm text-muted-foreground">{filteredFiles.length} files</span>
                  </div>
                  <div className="divide-y divide-border/30">
                    {loadingList ? (
                      <div className="flex items-center justify-center py-16">
                        <ThreeBodyLoader size={28} color="#8b5cf6" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[520px]">
                        <div className="divide-y divide-border/30">
                          {filteredFiles.map((file) => {
                            const isSelected = selectedFile === file.path;
                            const gradeStyle = file.grade ? GRADE_STYLES[file.grade] : null;
                            return (
                              <button
                                key={file.path}
                                onClick={() => void loadFile(file.path)}
                                className={`w-full text-left px-5 py-3.5 transition-all duration-200 group ${
                                  isSelected
                                    ? 'bg-foreground/[0.04] border-l-2 border-l-violet-500'
                                    : 'border-l-2 border-l-transparent hover:bg-muted/30'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-foreground truncate group-hover:text-foreground transition-colors">
                                      {file.title}
                                    </div>
                                    <div className="text-xs text-muted-foreground/60 truncate mt-0.5 font-mono">
                                      {file.path}
                                    </div>
                                  </div>
                                  {file.grade && gradeStyle && (
                                    <span className={`text-xs px-2 py-0.5 rounded-md ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border} font-bold shrink-0`}>
                                      {file.grade}
                                    </span>
                                  )}
                                </div>
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {file.tags.slice(0, 4).map((tag) => (
                                      <span key={tag} className="text-[11px] px-2 py-0.5 bg-muted/50 text-muted-foreground rounded-md border border-border/30">
                                        {tag}
                                      </span>
                                    ))}
                                    {file.tags.length > 4 && (
                                      <span className="text-[11px] px-1.5 py-0.5 text-muted-foreground/60">
                                        +{file.tags.length - 4}
                                      </span>
                                    )}
                                  </div>
                                )}
                                {file.lastReviewed && (
                                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground/50">
                                    <Clock className="w-3 h-3" />
                                    {file.lastReviewed}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                          {filteredFiles.length === 0 && (
                            <div className="text-center py-16">
                              <FileText className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground">
                                {activeSubCategory ? 'No files match this sub-category.' : 'No files in this category.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </div>

              {/* Document Viewer */}
              <div className="col-span-12 lg:col-span-7">
                <div className="rounded-xl bg-card border border-border overflow-hidden h-full min-h-[640px] flex flex-col">
                  {/* File Header with Metadata */}
                  <div className="px-6 py-4 border-b border-border/50">
                    {selectedFile && selectedFileData ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-500 dark:text-violet-400 shrink-0" />
                          <h2 className="text-base font-semibold text-foreground truncate">
                            {selectedFileData.title}
                          </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {(() => {
                            const meta = CATEGORY_META[selectedFileData.category];
                            const Icon = meta?.icon || FileText;
                            return (
                              <span className="flex items-center gap-1.5 px-2 py-1 bg-muted/40 rounded-md">
                                <Icon className={`w-3 h-3 ${meta?.color || ''}`} />
                                {meta?.label || selectedFileData.category}
                              </span>
                            );
                          })()}
                          {selectedFileData.grade && (() => {
                            const gs = GRADE_STYLES[selectedFileData.grade];
                            return gs ? (
                              <span className={`px-2 py-1 rounded-md font-bold ${gs.bg} ${gs.text} border ${gs.border}`}>
                                Grade {selectedFileData.grade}
                              </span>
                            ) : null;
                          })()}
                          {selectedFileData.lastReviewed && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {selectedFileData.lastReviewed}
                            </span>
                          )}
                          <span className="font-mono text-muted-foreground/50 truncate">{selectedFile}</span>
                        </div>
                        {selectedFileData.tags && selectedFileData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedFileData.tags.map((tag) => (
                              <span key={tag} className="text-[11px] px-2 py-0.5 bg-muted/40 text-muted-foreground rounded-md border border-border/30">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Select a file to view</span>
                    )}
                  </div>
                  {/* File Content */}
                  <div className="flex-1 p-6">
                    {loadingFile ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <PathTraceLoader size={48} color="#8b5cf6" />
                        <span className="text-sm text-muted-foreground">Loading document...</span>
                      </div>
                    ) : selectedFile ? (
                      <ScrollArea className="h-[540px]">
                        <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap break-words leading-relaxed">
                          {fileContent}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground/60">
                        <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 mb-4">
                          <FileText className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">Select a document to preview</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">Choose a file from the list on the left</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SEARCH TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Input */}
            <div className="rounded-xl bg-card border border-border overflow-hidden p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Semantic Search</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    BM25 {stats?.embeddingsEnabled ? '+ Z.AI embeddings (hybrid)' : '(embeddings disabled)'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Search: SaaS B2B Series B, GDPR consent, multi-threading..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-xl bg-muted/30 border border-border text-base text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all"
                />
                {searching && (
                  <ThreeBodyLoader size={18} color="#8b5cf6" className="absolute right-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 text-sm text-muted-foreground">
                  {searchResults.length} results · method: <span className="font-medium text-violet-600 dark:text-violet-400">{searchResults[0]?.retrievalMethod}</span>
                </div>
              )}
            </div>

            {/* Search Results */}
            <div className="space-y-4">
              {searchResults.map((result) => {
                const Icon = CATEGORY_META[result.category]?.icon || FileText;
                const meta = CATEGORY_META[result.category];
                const gradeStyle = result.grade ? GRADE_STYLES[result.grade] : null;
                const scorePercent = Math.min(result.score * 100, 100);
                return (
                  <div
                    key={result.chunkId}
                    onClick={() => void loadFile(result.filePath)}
                    className="group rounded-xl bg-card border border-border hover:border-violet-500/30 p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/5"
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`p-1.5 rounded-lg ${meta?.bgGlow || 'bg-muted/30'}`}>
                            <Icon className={`w-4 h-4 ${meta?.color || 'text-muted-foreground'}`} />
                          </span>
                          <span className="font-semibold text-sm text-foreground">{result.title}</span>
                          {result.section && (
                            <>
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">{result.section}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{result.contentPreview}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground/60 flex-wrap">
                          <span className="font-mono">{result.filePath}</span>
                          {result.grade && gradeStyle && (
                            <span className={`px-2 py-0.5 rounded-md font-bold ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border}`}>
                              {result.grade}
                            </span>
                          )}
                          {result.matchedTokens.slice(0, 5).map((t) => (
                            <span key={t} className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-md text-xs">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Relevance Score Bar */}
                      <div className="shrink-0 w-20 text-center space-y-1.5">
                        <div className="text-xs text-muted-foreground/60 uppercase tracking-wider">Score</div>
                        <div className="text-lg font-bold tabular-nums text-violet-600 dark:text-violet-400">
                          {(scorePercent / 100).toFixed(3)}
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${scorePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <div className="rounded-xl bg-card border border-border p-16 text-center">
                  <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No results for &ldquo;{searchQuery}&rdquo;</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Try different keywords or check spelling</p>
                </div>
              )}
              {searchQuery.trim().length < 2 && (
                <div className="rounded-xl bg-card border border-border p-16 text-center">
                  <div className="flex justify-center mb-4">
                    <PathTraceLoader size={36} color="#8b5cf6" />
                  </div>
                  <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">Search across all knowledge base documents</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STATS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {!stats ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <ThreeBodyLoader size={40} color="#8b5cf6" />
                <span className="text-sm text-muted-foreground">Loading statistics...</span>
              </div>
            ) : (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard icon={FileText} label="Total Docs" value={stats.totalDocs} gradient="from-blue-500 to-cyan-400" />
                  <StatCard icon={Database} label="Total Chunks" value={stats.totalChunks} gradient="from-violet-500 to-purple-400" />
                  <StatCard
                    icon={Sparkles}
                    label="Embeddings"
                    value={
                      stats.embeddingsEnabled
                        ? stats.embeddingsCoverage
                          ? `${stats.embeddingsCoverage.cached}/${stats.embeddingsCoverage.total}`
                          : 'ON'
                        : 'OFF'
                    }
                    gradient={stats.embeddingsEnabled ? 'from-emerald-500 to-teal-400' : 'from-slate-600 to-slate-500'}
                  />
                  <StatCard icon={TrendingUp} label="Fresh (90d)" value={stats.freshness.fresh} gradient="from-emerald-500 to-green-400" />
                </div>

                {/* Embeddings Section */}
                {stats.embeddingsEnabled && (
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">Semantic Embeddings — Z.AI embedding-3</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Hybrid retrieval (BM25 + cosine similarity) for better recall on paraphrased queries.
                        </p>
                      </div>
                    </div>
                    <div className="p-6">
                      {stats.embeddingsCoverage && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Coverage</span>
                            <span className="font-semibold text-foreground">
                              {stats.embeddingsCoverage.cached} / {stats.embeddingsCoverage.total} chunks (
                              {stats.embeddingsCoverage.total > 0
                                ? Math.round((stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-full bg-muted/30 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-3 rounded-full transition-all duration-700"
                              style={{
                                width: `${
                                  stats.embeddingsCoverage.total > 0
                                    ? (stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-4 pt-1">
                            <button
                              onClick={() => void precomputeEmbeddings()}
                              disabled={precomputing}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/40 transition-all disabled:opacity-50"
                            >
                              {precomputing ? (
                                <ThreeBodyLoader size={14} color="#a78bfa" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                              {precomputing
                                ? 'Computing...'
                                : stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total
                                  ? 'Pre-compute Missing'
                                  : 'Re-compute All'}
                            </button>
                            {precomputeMsg && (
                              <span className="text-sm text-muted-foreground">{precomputeMsg}</span>
                            )}
                          </div>
                          {stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total && (
                            <p className="text-sm text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 px-4 py-3 rounded-lg">
                              {stats.embeddingsCoverage.total - stats.embeddingsCoverage.cached} chunks lack cached
                              embeddings — those will fall back to BM25-only scoring at query time. Click
                              &ldquo;Pre-compute Missing&rdquo; to populate the cache.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Category & Grade Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By Category */}
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50">
                      <h3 className="text-base font-semibold text-foreground">By Category</h3>
                    </div>
                    <div className="p-4 space-y-1">
                      {Object.entries(stats.byCategory).map(([cat, count]) => {
                        const meta = CATEGORY_META[cat];
                        const Icon = meta?.icon || FileText;
                        const maxCount = Math.max(...Object.values(stats.byCategory));
                        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={cat} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
                            <span className={`p-1.5 rounded-lg ${meta?.bgGlow || 'bg-muted/30'}`}>
                              <Icon className={`w-4 h-4 ${meta?.color || 'text-muted-foreground'}`} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">{meta?.label || cat}</span>
                                <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
                              </div>
                              <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${meta?.gradient || 'from-slate-400 to-slate-300'} h-1 rounded-full transition-all duration-500`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By Grade */}
                  <div className="rounded-xl bg-card border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border/50">
                      <h3 className="text-base font-semibold text-foreground">By Grade</h3>
                    </div>
                    <div className="p-4 space-y-1">
                      {Object.entries(stats.byGrade).map(([grade, count]) => {
                        const style = GRADE_STYLES[grade];
                        const maxCount = Math.max(...Object.values(stats.byGrade));
                        const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                        return (
                          <div key={grade} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                            <span className={`text-sm px-2.5 py-1 rounded-lg font-bold ${style?.bg || ''} ${style?.text || 'text-muted-foreground'} border ${style?.border || 'border-border'}`}>
                              {grade}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-foreground">Grade {grade}</span>
                                <span className="text-sm tabular-nums text-muted-foreground">{count} docs</span>
                              </div>
                              <div className="w-full bg-muted/30 rounded-full h-1 overflow-hidden">
                                <div
                                  className={`bg-gradient-to-r ${style ? `from-emerald-500` : 'from-slate-400'} h-1 rounded-full transition-all duration-500`}
                                  style={{ width: `${barWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {Object.keys(stats.byGrade).length === 0 && (
                        <p className="text-sm text-muted-foreground px-3 py-4">No grades recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Freshness */}
                <div className="rounded-xl bg-card border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border/50">
                    <h3 className="text-base font-semibold text-foreground">Freshness Distribution</h3>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-6">
                    <div className="text-center p-6 rounded-xl bg-emerald-100 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/10">
                      <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">{stats.freshness.fresh}</div>
                      <div className="text-sm text-emerald-500/80 mt-2 font-medium">Fresh (≤90 days)</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-amber-100 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10">
                      <div className="text-4xl font-bold text-amber-600 dark:text-amber-400">{stats.freshness.stale}</div>
                      <div className="text-sm text-amber-500/80 mt-2 font-medium">Stale (90–180 days)</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-red-100 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10">
                      <div className="text-4xl font-bold text-red-600 dark:text-red-400">{stats.freshness.very_stale}</div>
                      <div className="text-sm text-red-500/80 mt-2 font-medium">Very Stale (180+ days)</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            GAP REPORT TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'gap-report' && (
          <div className="space-y-6">
            <div className="rounded-xl bg-card border border-border overflow-hidden">
              <div className="px-6 py-5 border-b border-border/50 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Echo Monthly Gap Report</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Generated by the Echo agent. Identifies coverage, quality, usage, and freshness gaps.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void regenerateGapReport()}
                  disabled={generatingGap}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all disabled:opacity-50 shrink-0"
                >
                  {generatingGap ? (
                    <ThreeBodyLoader size={14} color="#fbbf24" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Regenerate
                </button>
              </div>
              <div className="p-6">
                {gapReport?.result && (
                  <>
                    {/* Coverage Gaps Summary */}
                    <div className="mb-8">
                      <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Target className="w-4 h-4 text-violet-500" />
                        Coverage Gaps
                        <span className="text-sm font-normal text-muted-foreground">— missing items by category</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        <GapStat label="Industries" value={gapReport.result.coverageGaps.industriesMissing?.length || 0} color="text-blue-600 dark:text-blue-400" bg="bg-blue-100 dark:bg-blue-500/5" border="border-blue-200 dark:border-blue-500/10" />
                        <GapStat label="Regions" value={gapReport.result.coverageGaps.regionsMissing?.length || 0} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-500/5" border="border-emerald-200 dark:border-emerald-500/10" />
                        <GapStat label="Playbooks" value={gapReport.result.coverageGaps.playbooksMissing?.length || 0} color="text-violet-600 dark:text-violet-400" bg="bg-violet-100 dark:bg-violet-500/5" border="border-violet-200 dark:border-violet-500/10" />
                        <GapStat label="Domains" value={gapReport.result.coverageGaps.domainsMissing?.length || 0} color="text-sky-600 dark:text-sky-400" bg="bg-sky-100 dark:bg-sky-500/5" border="border-sky-200 dark:border-sky-500/10" />
                        <GapStat label="Agents" value={gapReport.result.coverageGaps.agentsMissing?.length || 0} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-100 dark:bg-indigo-500/5" border="border-indigo-200 dark:border-indigo-500/10" />
                        <GapStat label="Methodologies" value={gapReport.result.coverageGaps.methodologiesMissing?.length || 0} color="text-amber-600 dark:text-amber-400" bg="bg-amber-100 dark:bg-amber-500/5" border="border-amber-200 dark:border-amber-500/10" />
                        <GapStat label="Integrations" value={gapReport.result.coverageGaps.integrationsMissing?.length || 0} color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-100 dark:bg-cyan-500/5" border="border-cyan-200 dark:border-cyan-500/10" />
                        <GapStat label="Case Studies" value={gapReport.result.coverageGaps.caseStudiesMissing?.length || 0} color="text-yellow-600 dark:text-yellow-400" bg="bg-yellow-100 dark:bg-yellow-500/5" border="border-yellow-200 dark:border-yellow-500/10" />
                        <GapStat label="Product" value={gapReport.result.coverageGaps.productMissing?.length || 0} color="text-slate-600 dark:text-slate-300" bg="bg-slate-100 dark:bg-slate-500/5" border="border-slate-200 dark:border-slate-500/10" />
                        <GapStat label="KPIs" value={gapReport.result.coverageGaps.kpisMissing?.length || 0} color="text-lime-600 dark:text-lime-400" bg="bg-lime-100 dark:bg-lime-500/5" border="border-lime-200 dark:border-lime-500/10" />
                        <GapStat label="Competitive" value={gapReport.result.coverageGaps.competitiveIntelMissing?.length || 0} color="text-red-700 dark:text-red-300" bg="bg-red-100 dark:bg-red-500/5" border="border-red-200 dark:border-red-500/10" />
                        <GapStat label="Technologies" value={gapReport.result.coverageGaps.technologiesMissing?.length || 0} color="text-purple-600 dark:text-purple-400" bg="bg-purple-100 dark:bg-purple-500/5" border="border-purple-200 dark:border-purple-500/10" />
                        <GapStat label="Buyer Intel" value={gapReport.result.coverageGaps.buyerIntelMissing?.length || 0} color="text-orange-700 dark:text-orange-300" bg="bg-orange-100 dark:bg-orange-500/5" border="border-orange-200 dark:border-orange-500/10" />
                        <GapStat label="Verticals" value={gapReport.result.coverageGaps.verticalPlaybooksMissing?.length || 0} color="text-cyan-700 dark:text-cyan-300" bg="bg-cyan-100 dark:bg-cyan-500/5" border="border-cyan-200 dark:border-cyan-500/10" />
                        <GapStat label="Sales Ops" value={gapReport.result.coverageGaps.salesOpsMissing?.length || 0} color="text-zinc-600 dark:text-zinc-300" bg="bg-zinc-100 dark:bg-zinc-500/5" border="border-zinc-200 dark:border-zinc-500/10" />
                      </div>
                    </div>

                    {/* Quality & Freshness Gaps */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <div className="rounded-xl bg-amber-100 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-base font-semibold text-amber-700 dark:text-amber-400">Quality Gaps</h4>
                          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{gapReport.result.qualityGaps.length}</span>
                        </div>
                        <p className="text-sm text-amber-600/70 dark:text-amber-400/50">Documents graded C or D needing improvement</p>
                      </div>
                      <div className="rounded-xl bg-red-100 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 p-5">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-base font-semibold text-red-700 dark:text-red-400">Freshness Gaps</h4>
                          <span className="text-2xl font-bold text-red-600 dark:text-red-400">{gapReport.result.freshnessGaps.length}</span>
                        </div>
                        <p className="text-sm text-red-600/70 dark:text-red-400/50">Documents not reviewed in 180+ days</p>
                      </div>
                    </div>

                    {/* Total Gaps */}
                    <div className="rounded-xl bg-muted/20 border border-border p-4 flex items-center justify-between mb-8">
                      <span className="text-sm font-medium text-foreground">Total Identified Gaps</span>
                      <span className="text-xl font-bold text-foreground">
                        {(gapReport.result.coverageGaps.industriesMissing?.length || 0) +
                         (gapReport.result.coverageGaps.regionsMissing?.length || 0) +
                         (gapReport.result.coverageGaps.playbooksMissing?.length || 0) +
                         (gapReport.result.qualityGaps.length) +
                         (gapReport.result.freshnessGaps.length)}
                      </span>
                    </div>

                    {/* Recommendations — Collapsible */}
                    {gapReport.result.recommendations && (
                      <div className="space-y-3">
                        {gapReport.result.recommendations.newDocsToAuthor.length > 0 && (
                          <div className="rounded-xl bg-card border border-border overflow-hidden">
                            <button
                              onClick={() => toggleSection('newDocs')}
                              className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-500/10">
                                  <Zap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-sm font-semibold text-foreground">New Docs to Author</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">{gapReport.result.recommendations.newDocsToAuthor.length} items</p>
                                </div>
                              </div>
                              {collapsedSections['newDocs'] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            {!collapsedSections['newDocs'] && (
                              <div className="px-5 pb-4 space-y-2">
                                {gapReport.result.recommendations.newDocsToAuthor.map((rec, i) => (
                                  <div key={i} className="text-sm text-foreground/80 bg-muted/20 border border-border/30 px-4 py-3 rounded-lg">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {gapReport.result.recommendations.existingDocsToRefresh.length > 0 && (
                          <div className="rounded-xl bg-card border border-border overflow-hidden">
                            <button
                              onClick={() => toggleSection('refreshDocs')}
                              className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                                  <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="text-left">
                                  <h4 className="text-sm font-semibold text-foreground">Existing Docs to Refresh</h4>
                                  <p className="text-xs text-muted-foreground mt-0.5">{gapReport.result.recommendations.existingDocsToRefresh.length} items</p>
                                </div>
                              </div>
                              {collapsedSections['refreshDocs'] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            {!collapsedSections['refreshDocs'] && (
                              <div className="px-5 pb-4 space-y-2">
                                {gapReport.result.recommendations.existingDocsToRefresh.slice(0, 10).map((rec, i) => (
                                  <div key={i} className="text-sm text-foreground/80 bg-muted/20 border border-border/30 px-4 py-3 rounded-lg">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!gapReport && (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <ThreeBodyLoader size={32} color="#f59e0b" />
                    <span className="text-sm text-muted-foreground">Loading gap report...</span>
                  </div>
                )}
              </div>
            </div>

            {gapReport?.content && (
              <div className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Full Report — {gapReport.reportMonth}</span>
                  <span className="text-xs text-muted-foreground/50 font-mono">{gapReport.reportPath}</span>
                </div>
                <div className="p-6">
                  <ScrollArea className="h-[500px]">
                    <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {gapReport.content}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

/** Stat card with gradient accent */
function StatCard({ icon: Icon, label, value, gradient }: { icon: typeof FileText; label: string; value: number | string; gradient: string }) {
  return (
    <div className="group rounded-xl bg-card border border-border overflow-hidden hover:shadow-md transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
            <div className="text-2xl font-bold text-foreground mt-0.5">{value}</div>
          </div>
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${gradient} opacity-30 group-hover:opacity-70 transition-opacity`} />
    </div>
  );
}

/** Gap stat with colored border accent */
function GapStat({ label, value, color, bg, border }: { label: string; value: number; color: string; bg: string; border: string }) {
  return (
    <div className={`text-center p-4 rounded-xl ${bg} border ${border} transition-all hover:shadow-md`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</div>
    </div>
  );
}

// ============================================================
// uiverse.io-Inspired Components
// ============================================================

/**
 * Three-Body Spin Loader
 * Inspired by: https://uiverse.io/dovatgabriel/tidy-walrus-92
 */
function ThreeBodyLoader({ size = 35, color = '#8b5cf6', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <style>{`
        @keyframes kb-threeBodySpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes kb-threeBodyWobble1 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(-66%) scale(0.65); opacity: 0.8; }
        }
        @keyframes kb-threeBodyWobble2 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(66%) scale(0.65); opacity: 0.8; }
        }
      `}</style>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        animation: 'kb-threeBodySpin 2s infinite linear',
      }}>
        <div style={{
          position: 'absolute',
          height: '100%',
          width: '30%',
          bottom: '5%',
          left: 0,
          transform: 'rotate(60deg)',
          transformOrigin: '50% 85%',
        }}>
          <div style={{
            position: 'absolute',
            height: '0%',
            width: '100%',
            paddingBottom: '100%',
            backgroundColor: color,
            borderRadius: '50%',
            bottom: 0,
            left: 0,
            animation: 'kb-threeBodyWobble1 0.8s infinite ease-in-out',
            animationDelay: '-0.24s',
          }} />
        </div>
        <div style={{
          position: 'absolute',
          height: '100%',
          width: '30%',
          bottom: '5%',
          right: 0,
          transform: 'rotate(-60deg)',
          transformOrigin: '50% 85%',
        }}>
          <div style={{
            position: 'absolute',
            height: '0%',
            width: '100%',
            paddingBottom: '100%',
            backgroundColor: color,
            borderRadius: '50%',
            bottom: 0,
            left: 0,
            animation: 'kb-threeBodyWobble1 0.8s infinite ease-in-out',
            animationDelay: '-0.12s',
          }} />
        </div>
        <div style={{
          position: 'absolute',
          height: '100%',
          width: '30%',
          bottom: '-5%',
          left: 0,
          transform: 'translateX(116.666%)',
        }}>
          <div style={{
            position: 'absolute',
            height: '0%',
            width: '100%',
            paddingBottom: '100%',
            backgroundColor: color,
            borderRadius: '50%',
            top: 0,
            left: 0,
            animation: 'kb-threeBodyWobble2 0.8s infinite ease-in-out',
          }} />
        </div>
      </div>
    </div>
  );
}

/**
 * SVG Path-Tracing Loader
 * Inspired by: https://uiverse.io/mobinkakei/proud-ladybug-46
 */
function PathTraceLoader({ size = 44, color = '#8b5cf6' }: { size?: number; color?: string }) {
  const pathColor = hexToRgba(color, 0.2);
  return (
    <div className="inline-block" style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes kb-pathCircleTrace {
          25% { stroke-dashoffset: 125; }
          50% { stroke-dashoffset: 175; }
          75% { stroke-dashoffset: 225; }
          100% { stroke-dashoffset: 275; }
        }
        @keyframes kb-dotCircleTrace {
          0% { transform: translate(-18px, -18px); }
          25% { transform: translate(0, -18px); }
          50% { transform: translate(0, 0); }
          75% { transform: translate(-18px, 0); }
          100% { transform: translate(-18px, -18px); }
        }
      `}</style>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        position: 'absolute',
        background: color,
        top: '50%',
        left: '50%',
        transform: 'translate(-18px, -18px)',
        animation: 'kb-dotCircleTrace 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite',
        boxShadow: `0 0 8px ${color}`,
      }} />
      <svg viewBox="0 0 80 80" style={{ display: 'block', width: '100%', height: '100%' }}>
        <circle
          r="32"
          cy="40"
          cx="40"
          fill="none"
          stroke={pathColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="150 50 150 50"
          strokeDashoffset={75}
          style={{ animation: 'kb-pathCircleTrace 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite' }}
        />
      </svg>
    </div>
  );
}

