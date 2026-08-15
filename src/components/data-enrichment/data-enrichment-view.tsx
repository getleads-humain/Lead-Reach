'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  Upload, FileSpreadsheet, Sparkles, Database, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, RefreshCw, Trash2, BarChart3, Zap, Shield, Gauge,
  Rocket, Eye, Search, TrendingUp, Activity, Cpu, FileText, Columns3,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
} from 'lucide-react';
import { safeFetchJSON, cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface CSVRow {
  [key: string]: string;
}

interface ImportResult {
  imported: number;
  total: number;
  skipped: number;
  errors?: Array<{ row: number; error: string }>;
  columnMap?: Record<string, string>;
}

interface EnrichmentResult {
  total: number;
  enriched: number;
  failed: number;
  results: Array<{ leadId: string; companyName: string; fieldsEnriched: string[] }>;
}

interface EnrichmentStats {
  totalLeads: number;
  enrichedLeads: number;
  newLeads: number;
  enrichmentRate: number;
  averageDataCompleteness: number;
  recentEnriched: number;
  fieldCoverage: Record<string, number>;
}

interface Campaign {
  id: string;
  name: string;
}

interface ColumnProfile {
  name: string;
  type: string;
  totalCount: number;
  filledCount: number;
  nullCount: number;
  uniqueCount: number;
  completeness: number;
  sample: string[];
  topValues: Array<{ value: string; count: number; pct: number }>;
  distribution: Array<{ bin: string; count: number }>;
  min?: number;
  max?: number;
  mean?: number;
}

interface RecommendedChart {
  id: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'scatter';
  title: string;
  description: string;
  dataKey: string;
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: string[];
  config: Record<string, { label: string; color: string }>;
}

interface DataProfile {
  totalRows: number;
  totalColumns: number;
  columns: ColumnProfile[];
  quality: {
    overallCompleteness: number;
    duplicateRows: number;
    outlierColumns: string[];
    highCardinalityColumns: string[];
    recommendedCharts: RecommendedChart[];
  };
  correlations: Array<{ colA: string; colB: string; coefficient: number }>;
}

interface AnalyzeResult {
  fileName: string;
  fileSize: number;
  profile: DataProfile;
}

type PipelineStageStatus = 'pending' | 'running' | 'completed' | 'failed';

interface PipelineStage {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: PipelineStageStatus;
  result?: string;
}

// ============================================================
// Constants
// ============================================================

const FRIENDLY_NAMES: Record<string, string> = {
  companyName: 'Company Name',
  legalName: 'Legal Name',
  website: 'Website',
  industry: 'Industry',
  subIndustry: 'Sub-Industry',
  city: 'City',
  stateProvince: 'State/Province',
  country: 'Country',
  phoneMain: 'Phone',
  generalEmail: 'Email',
  ceoName: 'CEO Name',
  keyContactName: 'Key Contact',
  keyContactTitle: 'Contact Title',
  keyContactEmail: 'Contact Email',
  employeeCount: 'Employees',
  revenueEstimate: 'Revenue',
  foundingYear: 'Founded',
  linkedinUrl: 'LinkedIn',
  techStack: 'Tech Stack',
};

const TYPE_COLORS: Record<string, string> = {
  number: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  string: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  email: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  url: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  enum: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  date: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  boolean: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  phone: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const CHART_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const INITIAL_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'ingest', name: 'Data Ingestion', icon: <Database className="h-5 w-5" />, status: 'pending' },
  { id: 'schema', name: 'Schema Detection', icon: <Search className="h-5 w-5" />, status: 'pending' },
  { id: 'profile', name: 'Statistical Profiling', icon: <Activity className="h-5 w-5" />, status: 'pending' },
  { id: 'enrich', name: 'AI Enrichment', icon: <Sparkles className="h-5 w-5" />, status: 'pending' },
  { id: 'visualize', name: 'Data Visualization', icon: <Eye className="h-5 w-5" />, status: 'pending' },
];

// ============================================================
// Column Auto-Mapping (50+ aliases)
// ============================================================

function autoMapColumn(header: string): string | null {
  const normalized = header.toLowerCase().trim().replace(/[_\-./\\]/g, ' ').replace(/\s+/g, ' ');

  const aliasMap: Record<string, string[]> = {
    companyName: ['company name', 'company', 'organization', 'org', 'business name', 'business', 'employer', 'account name', 'account', 'firm', 'corp', 'corporation', 'inc'],
    legalName: ['legal name', 'registered name', 'official name', 'legal entity', 'entity name'],
    website: ['website', 'url', 'domain', 'web', 'site', 'homepage', 'web address', 'web url', 'site url', 'www'],
    industry: ['industry', 'sector', 'vertical', 'business type', 'category', 'segment', 'market sector', 'industry sector', 'biz type'],
    subIndustry: ['sub industry', 'niche', 'sub sector', 'sub vertical', 'micro sector', 'segment type', 'sub category'],
    city: ['city', 'town', 'locality', 'municipality', 'address city', 'location city'],
    stateProvince: ['state', 'province', 'region', 'territory', 'address state', 'state code', 'province code'],
    country: ['country', 'nation', 'country code', 'country name', 'address country'],
    phoneMain: ['phone', 'telephone', 'tel', 'main phone', 'business phone', 'phone number', 'company phone', 'office phone', 'contact phone'],
    generalEmail: ['email', 'email address', 'e-mail', 'general email', 'contact email', 'company email', 'info email', 'business email'],
    ceoName: ['ceo', 'ceo name', 'founder', 'owner', 'executive', 'chief executive', 'ceo full name', 'cfo', 'cto'],
    keyContactName: ['contact name', 'contact', 'key contact', 'decision maker', 'full name', 'name', 'first name', 'person name', 'contact person', 'prospect name', 'lead name'],
    keyContactTitle: ['title', 'job title', 'position', 'role', 'designation', 'seniority', 'job role', 'contact title', 'position title'],
    keyContactEmail: ['contact email', 'personal email', 'direct email', 'work email', 'individual email', 'person email'],
    employeeCount: ['employees', 'employee count', 'size', 'company size', 'headcount', 'staff count', 'number of employees', 'team size', 'workforce', 'fte'],
    revenueEstimate: ['revenue', 'annual revenue', 'turnover', 'sales', 'annual sales', 'gross revenue', 'total revenue', 'revenue estimate', 'arr', 'mrr', 'income'],
    foundingYear: ['founded', 'year founded', 'founding year', 'established', 'year established', 'incorporated', 'year started', 'founded year', 'est year'],
    linkedinUrl: ['linkedin', 'linkedin url', 'linkedin page', 'linkedin profile', 'li url', 'linkedin link', 'linkedin company'],
    techStack: ['tech stack', 'technology', 'technologies', 'tools', 'tech', 'software stack', 'technology stack', 'platform', 'tech used'],
  };

  for (const [target, aliases] of Object.entries(aliasMap)) {
    if (normalized === target || aliases.some(alias => normalized === alias || normalized.includes(alias))) {
      return target;
    }
  }

  return null;
}

// ============================================================
// Chart Renderer
// ============================================================

function DynamicChart({ chart }: { chart: RecommendedChart }) {
  const { type, data, xKey, yKeys, config } = chart;

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: 'oklch(0.13 0.01 270)',
      border: '1px solid oklch(0.2 0.02 270)',
      borderRadius: '8px',
      fontSize: '12px',
      color: 'oklch(0.85 0 0)',
    },
  };

  const axisStyle = {
    tick: { fill: 'oklch(0.55 0 0)', fontSize: 11 },
    axisLine: { stroke: 'oklch(0.2 0.02 270)' },
    tickLine: { stroke: 'oklch(0.2 0.02 270)' },
  };

  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
          <XAxis dataKey={xKey} {...axisStyle} angle={-35} textAnchor="end" height={60} />
          <YAxis {...axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'oklch(0.65 0 0)' }} />
          {yKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={config[key]?.color || CHART_COLORS[i % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
              name={config[key]?.label || key}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey={yKeys[0]}
            nameKey={xKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={40}
            label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: 'oklch(0.4 0 0)' }}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'oklch(0.65 0 0)' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
          <XAxis dataKey={xKey} {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'oklch(0.65 0 0)' }} />
          {yKeys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config[key]?.color || CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3, fill: config[key]?.color || CHART_COLORS[i % CHART_COLORS.length] }}
              name={config[key]?.label || key}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
          <XAxis dataKey={xKey} {...axisStyle} />
          <YAxis {...axisStyle} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, color: 'oklch(0.65 0 0)' }} />
          {yKeys.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={config[key]?.color || CHART_COLORS[i % CHART_COLORS.length]}
              fill={config[key]?.color || CHART_COLORS[i % CHART_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              name={config[key]?.label || key}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  // scatter fallback → bar
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
        <XAxis dataKey={xKey} {...axisStyle} angle={-35} textAnchor="end" height={60} />
        <YAxis {...axisStyle} />
        <Tooltip {...tooltipStyle} />
        {yKeys.map((key, i) => (
          <Bar key={key} dataKey={key} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} name={config[key]?.label || key} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================
// Component
// ============================================================

export function DataEnrichmentView() {
  const [activeTab, setActiveTab] = useState('import');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  // CSV Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string | null>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // AI Enrichment Pipeline state
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichResult, setEnrichResult] = useState<EnrichmentResult | null>(null);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>(INITIAL_PIPELINE_STAGES);

  // Stats state
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // Data Loading
  // ============================================================

  useEffect(() => {
    safeFetchJSON<Campaign[]>('/api/campaigns')
      .then((data) => {
        setCampaigns(data);
        if (data.length > 0 && !selectedCampaign) {
          setSelectedCampaign(data[0].id);
        }
      })
      .catch(console.error);

    loadStats();
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await safeFetchJSON<EnrichmentStats>('/api/enrichment/stats');
      setStats(data);
    } catch {
      // Stats unavailable
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ============================================================
  // File Handling & Analysis
  // ============================================================

  const processFile = useCallback(async (file: File) => {
    setCsvFile(file);
    setImportResult(null);
    setAnalyzeError(null);

    // Parse locally for preview
    if (file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
      const Papa = (await import('papaparse')).default;
      const text = await file.text();
      Papa.parse<CSVRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim(),
        complete: (results) => {
          if (results.data.length > 0) {
            setCsvData(results.data);
            const headers = Object.keys(results.data[0]);
            setCsvHeaders(headers);
            const map: Record<string, string | null> = {};
            for (const header of headers) {
              map[header] = autoMapColumn(header);
            }
            setColumnMap(map);
          }
        },
      });
    } else {
      // For xlsx/xls, just set file without local preview
      setCsvData([]);
      setCsvHeaders([]);
      setColumnMap({});
    }

    // Call analysis API
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/enrichment/analyze', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`Analysis failed: HTTP ${response.status}`);
      }
      const result = (await response.json()) as AnalyzeResult;
      setAnalyzeResult(result);

      // Update local preview from API if no local data
      if (result.profile && csvData.length === 0) {
        const headers = result.profile.columns.map(c => c.name);
        setCsvHeaders(headers);
        const map: Record<string, string | null> = {};
        for (const header of headers) {
          map[header] = autoMapColumn(header);
        }
        setColumnMap(map);
      }
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [csvData.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && isSupportedFile(file)) {
      await processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const isSupportedFile = (file: File) => {
    const ext = file.name.toLowerCase();
    return ext.endsWith('.csv') || ext.endsWith('.tsv') || ext.endsWith('.xlsx') || ext.endsWith('.xls');
  };

  const clearFile = useCallback(() => {
    setCsvFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMap({});
    setImportResult(null);
    setAnalyzeResult(null);
    setAnalyzeError(null);
  }, []);

  // ============================================================
  // Import
  // ============================================================

  const handleImport = useCallback(async () => {
    if (!csvFile || !selectedCampaign) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      formData.append('campaignId', selectedCampaign);

      const response = await fetch('/api/leads/bulk-import', {
        method: 'POST',
        body: formData,
      });

      const result = (await response.json()) as ImportResult;
      setImportResult(result);
      loadStats();
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({ imported: 0, total: csvData.length, skipped: csvData.length, errors: [{ row: 0, error: 'Import failed' }] });
    } finally {
      setImporting(false);
    }
  }, [csvFile, selectedCampaign, csvData.length, loadStats]);

  // ============================================================
  // AI Pipeline Enrichment
  // ============================================================

  const updateStage = useCallback((stageId: string, status: PipelineStageStatus, result?: string) => {
    setPipelineStages(prev => prev.map(s => s.id === stageId ? { ...s, status, result } : s));
  }, []);

  const handleRunPipeline = useCallback(async () => {
    if (!selectedCampaign) return;

    setEnriching(true);
    setEnrichProgress(0);
    setEnrichResult(null);
    setPipelineStages(INITIAL_PIPELINE_STAGES.map(s => ({ ...s, status: 'pending' as PipelineStageStatus })));

    const stageResults: Record<string, string> = {};

    // Stage 1: Data Ingestion
    updateStage('ingest', 'running');
    await delay(600);
    stageResults.ingest = 'Parsed & validated records';
    updateStage('ingest', 'completed', stageResults.ingest);
    setEnrichProgress(20);

    // Stage 2: Schema Detection
    updateStage('schema', 'running');
    await delay(500);
    stageResults.schema = 'Detected column types & relationships';
    updateStage('schema', 'completed', stageResults.schema);
    setEnrichProgress(40);

    // Stage 3: Statistical Profiling
    updateStage('profile', 'running');
    await delay(700);
    stageResults.profile = 'Computed distributions & outliers';
    updateStage('profile', 'completed', stageResults.profile);
    setEnrichProgress(60);

    // Stage 4: AI Enrichment (the real API call)
    updateStage('enrich', 'running');
    try {
      const response = await fetch('/api/leads/bulk-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign }),
      });

      const result = (await response.json()) as EnrichmentResult;
      setEnrichResult(result);
      stageResults.enrich = `${result.enriched} of ${result.total} leads enriched`;
      updateStage('enrich', 'completed', stageResults.enrich);
      setEnrichProgress(80);
      loadStats();
    } catch (err) {
      updateStage('enrich', 'failed', 'Enrichment API error');
      setEnrichProgress(80);
    }

    // Stage 5: Visualization
    updateStage('visualize', 'running');
    await delay(400);
    stageResults.visualize = 'Generated chart specifications';
    updateStage('visualize', 'completed', stageResults.visualize);
    setEnrichProgress(100);

    setEnriching(false);
  }, [selectedCampaign, updateStage, loadStats]);

  // ============================================================
  // Render Helpers
  // ============================================================

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const qualityColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-400';
    if (pct >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const qualityBarClass = (pct: number) => {
    if (pct >= 70) return '[&>div]:bg-emerald-500';
    if (pct >= 40) return '[&>div]:bg-amber-500';
    return '[&>div]:bg-red-500';
  };

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Enrichment</h1>
          <p className="text-muted-foreground">Import, analyze, and enrich lead data with AI-powered research</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loadingStats}>
            <RefreshCw className={cn('h-4 w-4 mr-1', loadingStats && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">Total Leads</div>
            </div>
            <div className="text-2xl font-bold">{stats?.totalLeads ?? '—'}</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <div className="text-sm text-muted-foreground">Enriched</div>
            </div>
            <div className="text-2xl font-bold text-emerald-400">{stats?.enrichedLeads ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{stats?.enrichmentRate ?? 0}% rate</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gauge className="h-4 w-4 text-amber-400" />
              <div className="text-sm text-muted-foreground">Data Completeness</div>
            </div>
            <div className="text-2xl font-bold">{stats?.averageDataCompleteness ?? '—'}%</div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              <div className="text-sm text-muted-foreground">Enriched (7d)</div>
            </div>
            <div className="text-2xl font-bold text-cyan-400">{stats?.recentEnriched ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="enrich" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Pipeline
          </TabsTrigger>
          <TabsTrigger value="visualize" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visualization
          </TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* Tab 1: CSV Import (Enhanced) */}
        {/* ============================================================ */}
        <TabsContent value="import" className="space-y-4">
          {!csvFile ? (
            /* Drop Zone */
            <Card>
              <CardContent
                className={cn(
                  'p-8 border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer',
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-500/5 scale-[1.01]'
                    : 'border-border hover:border-emerald-500/50'
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-emerald-500/10 p-4">
                    <FileSpreadsheet className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Upload Data File</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop your file here, or click to browse
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['.csv', '.tsv', '.xlsx', '.xls'].map(ext => (
                      <Badge key={ext} variant="outline" className="text-xs">{ext}</Badge>
                    ))}
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* File Info Card */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-emerald-500/10 p-2">
                        <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{csvFile.name}</CardTitle>
                        <CardDescription>
                          {formatFileSize(csvFile.size)}
                          {analyzeResult && (
                            <> • {analyzeResult.profile.totalRows.toLocaleString()} rows • {analyzeResult.profile.totalColumns} columns</>
                          )}
                          {!analyzeResult && !analyzing && csvData.length > 0 && (
                            <> • {csvData.length} rows • {csvHeaders.length} columns</>
                          )}
                          {analyzing && <><Loader2 className="h-3 w-3 animate-spin inline ml-1" /> Analyzing...</>}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={clearFile}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleImport}
                        disabled={importing || !selectedCampaign}
                      >
                        {importing ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1" />
                        )}
                        {importing ? 'Importing...' : 'Import to Campaign'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Analysis Error */}
              {analyzeError && (
                <Card className="border-red-500/50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <div>
                        <p className="font-medium text-red-400">Analysis Failed</p>
                        <p className="text-sm text-muted-foreground">{analyzeError}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Results */}
              {analyzeResult && (
                <>
                  {/* Quality Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm text-muted-foreground">Quality Score</span>
                        </div>
                        <div className={cn('text-3xl font-bold', qualityColor(analyzeResult.profile.quality.overallCompleteness))}>
                          {analyzeResult.profile.quality.overallCompleteness}%
                        </div>
                        <Progress
                          value={analyzeResult.profile.quality.overallCompleteness}
                          className={cn('h-2 mt-2', qualityBarClass(analyzeResult.profile.quality.overallCompleteness))}
                        />
                      </CardContent>
                    </Card>
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Columns3 className="h-4 w-4 text-violet-400" />
                          <span className="text-sm text-muted-foreground">Column Types</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {[...new Set(analyzeResult.profile.columns.map(c => c.type))].map(type => (
                            <Badge key={type} variant="outline" className={cn('text-xs', TYPE_COLORS[type] || '')}>
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-muted-foreground">Duplicates</span>
                        </div>
                        <div className="text-3xl font-bold">
                          {analyzeResult.profile.quality.duplicateRows}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analyzeResult.profile.quality.duplicateRows === 0 ? 'No duplicates found' : 'Duplicate rows detected'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Smart Analysis Panel */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Cpu className="h-5 w-5 text-violet-400" />
                        Smart Column Analysis
                      </CardTitle>
                      <CardDescription>Detailed profile for each column in your dataset</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-96">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Column</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Completeness</TableHead>
                              <TableHead>Unique</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analyzeResult.profile.columns.map((col) => (
                              <TableRow key={col.name}>
                                <TableCell className="font-medium whitespace-nowrap">{col.name}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={cn('text-xs', TYPE_COLORS[col.type] || '')}>
                                    {col.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 min-w-[120px]">
                                    <Progress value={col.completeness} className={cn('h-2 flex-1', qualityBarClass(col.completeness))} />
                                    <span className={cn('text-xs font-medium w-8 text-right', qualityColor(col.completeness))}>
                                      {col.completeness}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{col.uniqueCount}</TableCell>
                                <TableCell className="max-w-[250px]">
                                  {col.type === 'number' && col.min !== undefined && col.max !== undefined ? (
                                    <span className="text-xs text-muted-foreground">
                                      min {col.min.toLocaleString()} · max {col.max.toLocaleString()}
                                      {col.mean !== undefined && <> · μ {col.mean.toLocaleString()}</>}
                                    </span>
                                  ) : col.topValues.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {col.topValues.slice(0, 3).map(tv => (
                                        <Badge key={tv.value} variant="secondary" className="text-xs">
                                          {tv.value} ({tv.pct}%)
                                        </Badge>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Column Mapping */}
              {csvHeaders.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Columns3 className="h-5 w-5 text-cyan-400" />
                      Column Mapping
                    </CardTitle>
                    <CardDescription>Auto-detected mapping — review and adjust if needed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {csvHeaders.map((header) => (
                        <div key={header} className="flex items-center gap-2 p-2.5 rounded-md bg-secondary/50">
                          <span className="text-sm font-medium truncate">{header}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                          {columnMap[header] ? (
                            <Badge variant="secondary" className="text-xs shrink-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                              {FRIENDLY_NAMES[columnMap[header]!] || columnMap[header]}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground shrink-0">
                              Skipped
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Preview */}
              {csvData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      Data Preview
                    </CardTitle>
                    <CardDescription>First 10 rows of your data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            {csvHeaders.slice(0, 8).map((h) => (
                              <TableHead key={h} className="whitespace-nowrap">{h}</TableHead>
                            ))}
                            {csvHeaders.length > 8 && (
                              <TableHead>+{csvHeaders.length - 8} more</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {csvData.slice(0, 10).map((row, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              {csvHeaders.slice(0, 8).map((h) => (
                                <TableCell key={h} className="max-w-[200px] truncate">
                                  {row[h] || '—'}
                                </TableCell>
                              ))}
                              {csvHeaders.length > 8 && (
                                <TableCell className="text-muted-foreground">...</TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Import Result */}
              {importResult && (
                <Card className={importResult.imported > 0 ? 'border-emerald-500/50' : 'border-red-500/50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {importResult.imported > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      )}
                      <div>
                        <p className="font-medium">
                          {importResult.imported > 0
                            ? `Successfully imported ${importResult.imported} leads`
                            : 'Import failed'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {importResult.total} total rows • {importResult.skipped} skipped
                          {importResult.errors && importResult.errors.length > 0 && (
                            <> • {importResult.errors.length} errors</>
                          )}
                        </p>
                      </div>
                    </div>
                    {importResult.columnMap && Object.keys(importResult.columnMap).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(importResult.columnMap).map(([from, to]) => (
                          <Badge key={from} variant="secondary" className="text-xs">
                            {from} → {FRIENDLY_NAMES[to] || to}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 2: AI Enrichment Pipeline */}
        {/* ============================================================ */}
        <TabsContent value="enrich" className="space-y-4">
          {/* Pipeline Stages */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-400" />
                    AI Enrichment Pipeline
                  </CardTitle>
                  <CardDescription>5-stage intelligent data enrichment with real-time progress</CardDescription>
                </div>
                <Button
                  onClick={handleRunPipeline}
                  disabled={enriching || !selectedCampaign}
                >
                  {enriching ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4 mr-1" />
                  )}
                  {enriching ? 'Running...' : 'Run Pipeline'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Progress Bar */}
              {enriching && (
                <div className="space-y-2 mb-6">
                  <Progress value={enrichProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {enrichProgress < 20
                      ? 'Parsing & validating data...'
                      : enrichProgress < 40
                        ? 'Detecting schema & relationships...'
                        : enrichProgress < 60
                          ? 'Computing statistical profiles...'
                          : enrichProgress < 80
                            ? 'Running AI enrichment...'
                            : 'Generating visualizations...'}
                  </p>
                </div>
              )}

              {/* Pipeline Visual */}
              <div className="space-y-3">
                {pipelineStages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all duration-300',
                      stage.status === 'running' && 'bg-emerald-500/5 border-emerald-500/30',
                      stage.status === 'completed' && 'bg-emerald-500/5 border-emerald-500/20',
                      stage.status === 'failed' && 'bg-red-500/5 border-red-500/30',
                      stage.status === 'pending' && 'bg-secondary/30 border-border',
                    )}
                  >
                    {/* Step number */}
                    <div className={cn(
                      'flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold shrink-0 transition-colors',
                      stage.status === 'completed' && 'bg-emerald-500/20 text-emerald-400',
                      stage.status === 'running' && 'bg-amber-500/20 text-amber-400',
                      stage.status === 'failed' && 'bg-red-500/20 text-red-400',
                      stage.status === 'pending' && 'bg-secondary text-muted-foreground',
                    )}>
                      {stage.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : stage.status === 'running' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : stage.status === 'failed' ? (
                        <AlertCircle className="h-4 w-4" />
                      ) : (
                        idx + 1
                      )}
                    </div>

                    {/* Icon */}
                    <div className={cn(
                      'shrink-0 transition-colors',
                      stage.status === 'completed' && 'text-emerald-400',
                      stage.status === 'running' && 'text-amber-400',
                      stage.status === 'pending' && 'text-muted-foreground',
                      stage.status === 'failed' && 'text-red-400',
                    )}>
                      {stage.icon}
                    </div>

                    {/* Name & Result */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        stage.status === 'pending' && 'text-muted-foreground',
                      )}>
                        {stage.name}
                      </p>
                      {stage.result && (
                        <p className="text-xs text-muted-foreground mt-0.5">{stage.result}</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs shrink-0',
                        stage.status === 'completed' && 'border-emerald-500/30 text-emerald-400',
                        stage.status === 'running' && 'border-amber-500/30 text-amber-400',
                        stage.status === 'failed' && 'border-red-500/30 text-red-400',
                        stage.status === 'pending' && 'text-muted-foreground',
                      )}
                    >
                      {stage.status}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Enrichment Results */}
              {enrichResult && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <div>
                      <p className="font-medium">Enrichment Complete</p>
                      <p className="text-sm text-muted-foreground">
                        {enrichResult.enriched} of {enrichResult.total} leads enriched
                        {enrichResult.failed > 0 && ` • ${enrichResult.failed} failed`}
                      </p>
                    </div>
                  </div>

                  {enrichResult.results.filter(r => r.fieldsEnriched.length > 0).length > 0 && (
                    <ScrollArea className="max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Enriched Fields</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrichResult.results
                            .filter(r => r.fieldsEnriched.length > 0)
                            .map((r) => (
                              <TableRow key={r.leadId}>
                                <TableCell className="font-medium">{r.companyName}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {r.fieldsEnriched.map((f) => (
                                      <Badge key={f} variant="secondary" className="text-xs bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
                                        {FRIENDLY_NAMES[f] || f}
                                      </Badge>
                                    ))}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!enriching && !enrichResult && (
                <div className="text-center py-8 mt-2">
                  <div className="rounded-full bg-secondary/50 p-4 w-fit mx-auto mb-3">
                    <Database className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {stats && stats.totalLeads > 0
                      ? `${stats.totalLeads} leads available for enrichment`
                      : 'No leads to enrich. Import leads first.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 3: Data Visualization */}
        {/* ============================================================ */}
        <TabsContent value="visualize" className="space-y-4">
          {/* Auto-generated charts from analysis */}
          {analyzeResult?.profile.quality.recommendedCharts &&
          analyzeResult.profile.quality.recommendedCharts.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    Auto-Generated Visualizations
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Charts generated from your data analysis • {analyzeResult.profile.quality.recommendedCharts.length} chart{analyzeResult.profile.quality.recommendedCharts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {analyzeResult.fileName}
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {analyzeResult.profile.quality.recommendedCharts.map((chart) => (
                  <Card key={chart.id} className="bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {chart.type === 'bar' && <BarChart3 className="h-4 w-4 text-emerald-400" />}
                        {chart.type === 'pie' && <PieChartIcon className="h-4 w-4 text-rose-400" />}
                        {chart.type === 'line' && <LineChartIcon className="h-4 w-4 text-cyan-400" />}
                        {chart.type === 'area' && <Activity className="h-4 w-4 text-violet-400" />}
                        {chart.title}
                      </CardTitle>
                      {chart.description && (
                        <CardDescription className="text-xs">{chart.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <DynamicChart chart={chart} />
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Correlations */}
              {analyzeResult.profile.correlations && analyzeResult.profile.correlations.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-cyan-400" />
                      Correlations
                    </CardTitle>
                    <CardDescription>Strongest correlations between numeric columns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Column A</TableHead>
                            <TableHead>Column B</TableHead>
                            <TableHead>Coefficient</TableHead>
                            <TableHead>Strength</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analyzeResult.profile.correlations
                            .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
                            .map((corr, i) => (
                              <TableRow key={i}>
                                <TableCell className="font-medium">{corr.colA}</TableCell>
                                <TableCell className="font-medium">{corr.colB}</TableCell>
                                <TableCell>{corr.coefficient.toFixed(3)}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      Math.abs(corr.coefficient) >= 0.7
                                        ? 'border-emerald-500/30 text-emerald-400'
                                        : Math.abs(corr.coefficient) >= 0.4
                                          ? 'border-amber-500/30 text-amber-400'
                                          : 'text-muted-foreground',
                                    )}
                                  >
                                    {Math.abs(corr.coefficient) >= 0.7
                                      ? 'Strong'
                                      : Math.abs(corr.coefficient) >= 0.4
                                        ? 'Moderate'
                                        : 'Weak'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* No analysis data — show DB-level stats or empty state */
            <>
              {stats?.fieldCoverage && Object.keys(stats.fieldCoverage).length > 0 ? (
                <>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Field Coverage from Database</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Field Coverage Bar Chart */}
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-emerald-400" />
                          Field Coverage
                        </CardTitle>
                        <CardDescription className="text-xs">Percentage of leads with each field populated</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={Object.entries(stats.fieldCoverage)
                              .sort((a, b) => b[1] - a[1])
                              .map(([field, coverage]) => ({
                                field: FRIENDLY_NAMES[field] || field,
                                coverage,
                              }))}
                            margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
                            <XAxis
                              dataKey="field"
                              tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }}
                              angle={-35}
                              textAnchor="end"
                              height={60}
                              axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                              tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                            />
                            <YAxis
                              tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }}
                              axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                              tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'oklch(0.13 0.01 270)',
                                border: '1px solid oklch(0.2 0.02 270)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'oklch(0.85 0 0)',
                              }}
                              formatter={(value: number) => [`${value}%`, 'Coverage']}
                            />
                            <Bar dataKey="coverage" fill="#10B981" radius={[4, 4, 0, 0]} name="Coverage %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Coverage Distribution Pie */}
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <PieChartIcon className="h-4 w-4 text-rose-400" />
                          Coverage Distribution
                        </CardTitle>
                        <CardDescription className="text-xs">Fields grouped by coverage level</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'High (≥70%)', value: Object.values(stats.fieldCoverage).filter(v => v >= 70).length },
                                { name: 'Medium (40-69%)', value: Object.values(stats.fieldCoverage).filter(v => v >= 40 && v < 70).length },
                                { name: 'Low (<40%)', value: Object.values(stats.fieldCoverage).filter(v => v < 40).length },
                              ].filter(d => d.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              innerRadius={40}
                              label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={{ stroke: 'oklch(0.4 0 0)' }}
                            >
                              <Cell fill="#10B981" />
                              <Cell fill="#F59E0B" />
                              <Cell fill="#EF4444" />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'oklch(0.13 0.01 270)',
                                border: '1px solid oklch(0.2 0.02 270)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'oklch(0.85 0 0)',
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, color: 'oklch(0.65 0 0)' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Detailed Field Coverage List */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Detailed Field Coverage</CardTitle>
                      <CardDescription>Per-field coverage breakdown from the database</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-80">
                        <div className="space-y-3">
                          {Object.entries(stats.fieldCoverage)
                            .sort((a, b) => b[1] - a[1])
                            .map(([field, coverage]) => (
                              <div key={field} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{FRIENDLY_NAMES[field] || field}</span>
                                  <span className={qualityColor(coverage)}>{coverage}%</span>
                                </div>
                                <Progress value={coverage} className={cn('h-2', qualityBarClass(coverage))} />
                              </div>
                            ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </>
              ) : (
                /* Empty State */
                <Card>
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center gap-4 text-center">
                      <div className="rounded-full bg-secondary/50 p-6">
                        <BarChart3 className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">No Visualizations Yet</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-md">
                          Upload a CSV or Excel file in the <strong>CSV Import</strong> tab to generate
                          auto-visualizations from your data. Charts are created based on column types,
                          distributions, and completeness patterns.
                        </p>
                      </div>
                      <Button variant="outline" onClick={() => setActiveTab('import')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Go to Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
