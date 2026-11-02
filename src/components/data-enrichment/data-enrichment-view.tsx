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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  Upload, FileSpreadsheet, Sparkles, Database, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, RefreshCw, Trash2, BarChart3, Zap, Shield, Gauge,
  Rocket, Eye, Search, TrendingUp, Activity, Cpu, FileText, Columns3,
  PieChart as PieChartIcon, LineChart as LineChartIcon,
  ShieldCheck, Download, FileJson, FileDown, Grid3X3, AlertTriangle,
  Info, ChevronDown, ChevronUp, Thermometer, Target, Eraser, XCircle,
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
  results?: Array<{ leadId: string; companyName: string; fieldsEnriched: string[] }>;
}

interface EnrichmentStats {
  totalLeads: number;
  enrichedLeads: number;
  newLeads: number;
  enrichmentRate: number;
  averageDataCompleteness: number;
  recentEnriched: number;
  fieldCoverage?: Record<string, number>;
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
  topValues?: Array<{ value: string; count: number; pct: number }>;
  distribution?: Array<{ bin: string; count: number }>;
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
  quality?: {
    overallCompleteness: number;
    duplicateRows: number;
    outlierColumns: string[];
    highCardinalityColumns: string[];
    recommendedCharts?: RecommendedChart[];
  };
  correlations?: Array<{ colA: string; colB: string; coefficient: number }>;
}

interface AnalyzeResult {
  fileName: string;
  fileSize: number;
  profile?: DataProfile;
}

interface FieldValidation {
  field: string;
  type: string;
  total: number;
  valid: number;
  invalid: number;
  missing: number;
  validPct: number;
  issues: string[];
}

interface ProgressiveAnalysisState {
  enabled: boolean;
  analyzedRows: number;
  totalRows: number;
  progress: number;
  analyzing: boolean;
}

interface DataQualityMetrics {
  completeness: number;
  validity: number;
  uniqueness: number;
  consistency: number;
  timeliness: number;
  overall: number;
}

interface CleaningSuggestion {
  type: string;
  field: string;
  description: string;
  affectedRows: number;
  impact: 'high' | 'medium' | 'low';
}

interface EnrichmentRecommendation {
  field: string;
  reason: string;
  impactPct: number;
  priority: 'high' | 'medium' | 'low';
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

  // Progressive Analysis state
  const [progressiveAnalysis, setProgressiveAnalysis] = useState<ProgressiveAnalysisState>({
    enabled: false,
    analyzedRows: 0,
    totalRows: 0,
    progress: 0,
    analyzing: false,
  });

  // Schema Validation state
  const [fieldValidations, setFieldValidations] = useState<FieldValidation[]>([]);

  // Field Coverage expanded state
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

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
      if (result.profile?.columns && csvData.length === 0) {
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
  // Field Validation Computation
  // ============================================================

  const computeFieldValidations = useCallback((data: CSVRow[], headers: string[]): FieldValidation[] => {
    if (data.length === 0 || headers.length === 0) return [];
    return headers.map((field) => {
      const values = data.map((row) => row[field] ?? '').filter((v) => v.trim() !== '');
      const total = data.length;
      const missing = total - values.length;
      const issues: string[] = [];
      let valid = values.length;

      const mappedField = columnMap[field];
      const isEmail = mappedField === 'generalEmail' || mappedField === 'keyContactEmail' || field.toLowerCase().includes('email');
      const isUrl = mappedField === 'website' || mappedField === 'linkedinUrl' || field.toLowerCase().includes('url') || field.toLowerCase().includes('website');
      const isPhone = mappedField === 'phoneMain' || field.toLowerCase().includes('phone');

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = values.filter((v) => !emailRegex.test(v));
        valid = values.length - invalidEmails.length;
        if (invalidEmails.length > 0) issues.push(`${invalidEmails.length} missing @ or invalid format`);
      } else if (isUrl) {
        const invalidUrls = values.filter((v) => !v.startsWith('http') && !v.startsWith('www.'));
        valid = values.length - invalidUrls.length;
        if (invalidUrls.length > 0) issues.push(`${invalidUrls.length} don't start with http/www`);
      } else if (isPhone) {
        const phoneRegex = /[\d]{3,}/;
        const invalidPhones = values.filter((v) => !phoneRegex.test(v));
        valid = values.length - invalidPhones.length;
        if (invalidPhones.length > 0) issues.push(`${invalidPhones.length} invalid phone format`);
      }

      // Detect inconsistent casing
      const lowerVals = values.filter((v) => v === v.toLowerCase() && v !== v.toUpperCase());
      const upperVals = values.filter((v) => v === v.toUpperCase());
      if (lowerVals.length > 0 && upperVals.length > 0 && lowerVals.length > 2 && upperVals.length > 2) {
        issues.push('Inconsistent casing detected');
      }

      // Detect duplicates
      const uniqueVals = new Set(values);
      if (values.length - uniqueVals.size > values.length * 0.05) {
        issues.push(`${values.length - uniqueVals.size} duplicate values`);
      }

      const invalid = values.length - valid;
      const validPct = values.length > 0 ? Math.round((valid / values.length) * 100) : 0;

      return {
        field,
        type: isEmail ? 'email' : isUrl ? 'url' : isPhone ? 'phone' : 'string',
        total,
        valid,
        invalid,
        missing,
        validPct,
        issues,
      };
    });
  }, [columnMap]);

  // Compute validations when data changes
  useEffect(() => {
    if (csvData.length > 0 && csvHeaders.length > 0) {
      setFieldValidations(computeFieldValidations(csvData, csvHeaders));
    }
  }, [csvData, csvHeaders, computeFieldValidations]);

  // ============================================================
  // Data Quality Metrics Computation
  // ============================================================

  const computeDataQualityMetrics = useCallback((): DataQualityMetrics => {
    const cols = analyzeResult?.profile?.columns ?? [];
    if (cols.length === 0) {
      return { completeness: 0, validity: 0, uniqueness: 0, consistency: 0, timeliness: 0, overall: 0 };
    }

    const completeness = cols.reduce((sum, c) => sum + (c.completeness ?? 0), 0) / cols.length;
    const validity = fieldValidations.length > 0
      ? fieldValidations.reduce((sum, v) => sum + v.validPct, 0) / fieldValidations.length
      : completeness;
    const uniqueness = cols.reduce((sum, c) => {
      const total = c.totalCount ?? 1;
      return sum + Math.min(100, ((c.uniqueCount ?? 0) / total) * 100);
    }, 0) / cols.length;

    // Consistency: check for low duplicate rate, consistent casing
    const dupRate = (analyzeResult?.profile?.quality?.duplicateRows ?? 0) / Math.max(1, analyzeResult?.profile?.totalRows ?? 1);
    const consistency = Math.max(0, Math.min(100, (1 - dupRate * 5) * 100));

    // Timeliness: based on date fields having recent values
    const dateCols = cols.filter((c) => c.type === 'date');
    const timeliness = dateCols.length > 0 ? dateCols.reduce((sum, c) => sum + (c.completeness ?? 0), 0) / dateCols.length : 75;

    const overall = Math.round(completeness * 0.3 + validity * 0.25 + uniqueness * 0.15 + consistency * 0.2 + timeliness * 0.1);

    return {
      completeness: Math.round(completeness),
      validity: Math.round(validity),
      uniqueness: Math.round(uniqueness),
      consistency: Math.round(consistency),
      timeliness: Math.round(timeliness),
      overall,
    };
  }, [analyzeResult, fieldValidations]);

  // ============================================================
  // Cleaning Suggestions Computation
  // ============================================================

  const computeCleaningSuggestions = useCallback((): CleaningSuggestion[] => {
    const suggestions: CleaningSuggestion[] = [];
    const cols = analyzeResult?.profile?.columns ?? [];

    // Duplicate emails
    const emailField = fieldValidations.find((v) => v.type === 'email');
    if (emailField && emailField.issues.some((i) => i.includes('duplicate'))) {
      suggestions.push({
        type: 'dedup',
        field: emailField.field,
        description: 'Remove duplicate email addresses',
        affectedRows: Math.ceil(emailField.total * 0.05),
        impact: 'high',
      });
    }

    // Invalid URLs
    const urlField = fieldValidations.find((v) => v.type === 'url');
    if (urlField && urlField.invalid > 0) {
      suggestions.push({
        type: 'fix_url',
        field: urlField.field,
        description: `Fix ${urlField.invalid} URLs missing http:// prefix`,
        affectedRows: urlField.invalid,
        impact: 'medium',
      });
    }

    // Inconsistent casing
    for (const v of fieldValidations) {
      if (v.issues.some((i) => i.includes('casing'))) {
        suggestions.push({
          type: 'normalize_case',
          field: v.field,
          description: 'Normalize to consistent casing (title case)',
          affectedRows: Math.ceil(v.total * 0.1),
          impact: 'low',
        });
      }
    }

    // Missing required fields
    for (const col of cols) {
      if ((col.completeness ?? 0) < 50 && (col.completeness ?? 0) > 0) {
        suggestions.push({
          type: 'fill_missing',
          field: col.name,
          description: `${col.nullCount ?? 0} rows missing ${col.name}`,
          affectedRows: col.nullCount ?? 0,
          impact: (col.completeness ?? 0) < 30 ? 'high' : 'medium',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }, [analyzeResult, fieldValidations]);

  // ============================================================
  // Enrichment Recommendations Computation
  // ============================================================

  const computeEnrichmentRecommendations = useCallback((): EnrichmentRecommendation[] => {
    const recommendations: EnrichmentRecommendation[] = [];
    const cols = analyzeResult?.profile?.columns ?? [];
    const totalRows = analyzeResult?.profile?.totalRows ?? 0;

    if (cols.length === 0 || totalRows === 0) return recommendations;

    for (const col of cols) {
      const completeness = col.completeness ?? 0;
      const missingPct = 100 - completeness;
      const mappedField = Object.entries(columnMap).find(([, v]) => v === col.name)?.[0] ?? col.name;

      if (missingPct > 20) {
        const impactPct = Math.round(missingPct * (totalRows / 100));
        let reason = '';
        // Priority ladder below always assigns; the 'low' seed was dead.
        let priority: 'high' | 'medium' | 'low';

        if (col.type === 'url' || mappedField === 'website') {
          reason = `Enriching '${col.name}' would improve ${missingPct}% of leads' web presence data`;
          priority = missingPct > 60 ? 'high' : 'medium';
        } else if (col.type === 'email') {
          reason = `Enriching '${col.name}' would provide ${impactPct} additional contact points`;
          priority = missingPct > 50 ? 'high' : 'medium';
        } else if (col.name.toLowerCase().includes('industry') || col.name.toLowerCase().includes('sector')) {
          reason = `Enriching '${col.name}' would enable better segmentation for ${missingPct}% of records`;
          priority = missingPct > 40 ? 'high' : 'medium';
        } else if (col.name.toLowerCase().includes('employee') || col.name.toLowerCase().includes('revenue')) {
          reason = `Enriching '${col.name}' would improve scoring for ${missingPct}% of leads`;
          priority = 'medium';
        } else {
          reason = `Enriching '${col.name}' would improve ${missingPct}% data completeness`;
          priority = missingPct > 60 ? 'high' : missingPct > 30 ? 'medium' : 'low';
        }

        recommendations.push({ field: col.name, reason, impactPct: missingPct, priority });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || b.impactPct - a.impactPct;
    });
  }, [analyzeResult, columnMap]);

  // ============================================================
  // Missing Data Pattern Computation
  // ============================================================

  const computeMissingDataPatterns = useCallback((): Array<{ pattern: string; count: number; fields: string[] }> => {
    if (csvData.length === 0 || csvHeaders.length === 0) return [];
    const patternMap: Record<string, { count: number; fields: string[] }> = {};

    for (const row of csvData) {
      const missingFields = csvHeaders.filter((h) => !row[h] || row[h].trim() === '');
      if (missingFields.length >= 2) {
        const key = missingFields.sort().join(',');
        if (!patternMap[key]) {
          patternMap[key] = { count: 0, fields: missingFields };
        }
        patternMap[key].count++;
      }
    }

    return Object.values(patternMap)
      .filter((p) => p.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((p) => ({ pattern: p.fields.join(' + '), count: p.count, fields: p.fields }));
  }, [csvData, csvHeaders]);

  // ============================================================
  // Export Handlers
  // ============================================================

  const handleExportJSON = useCallback(() => {
    if (!analyzeResult) return;
    const blob = new Blob([JSON.stringify(analyzeResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvFile?.name?.replace(/\.[^.]+$/, '') ?? 'analysis'}-analysis.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyzeResult, csvFile]);

  const handleExportCleanedCSV = useCallback(() => {
    if (csvData.length === 0 || csvHeaders.length === 0) return;

    const cleaned = csvData.map((row) => {
      const newRow: CSVRow = {};
      for (const header of csvHeaders) {
        let val = (row[header] ?? '').trim();
        const mappedField = columnMap[header];
        const isUrl = mappedField === 'website' || mappedField === 'linkedinUrl' || header.toLowerCase().includes('url') || header.toLowerCase().includes('website');
        const isEmail = mappedField === 'generalEmail' || mappedField === 'keyContactEmail' || header.toLowerCase().includes('email');

        // Fix URLs missing http://
        if (isUrl && val && !val.startsWith('http') && val.startsWith('www.')) {
          val = `https://${val}`;
        } else if (isUrl && val && !val.startsWith('http') && val.includes('.')) {
          val = `https://${val}`;
        }

        // Trim and normalize emails
        if (isEmail && val) {
          val = val.toLowerCase().trim();
        }

        // Normalize casing for name-like fields
        if (!isUrl && !isEmail && val && val === val.toUpperCase() && val.length > 2 && !/^\d+$/.test(val)) {
          val = val.split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        }

        newRow[header] = val;
      }
      return newRow;
    });

    const csvContent = [
      csvHeaders.join(','),
      ...cleaned.map((row) => csvHeaders.map((h) => `"${(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${csvFile?.name?.replace(/\.[^.]+$/, '') ?? 'data'}-cleaned.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [csvData, csvHeaders, csvFile, columnMap]);

  // ============================================================
  // Progressive Analysis
  // ============================================================

  const progressiveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Enable progressive analysis for large files
    if (csvData.length > 1000 && analyzeResult) {
      const totalRows = csvData.length;
      const analyzedRows = analyzeResult.profile?.totalRows ?? totalRows;

      if (analyzedRows < totalRows && !progressiveAnalysis.analyzing) {
        setProgressiveAnalysis({
          enabled: true,
          analyzedRows,
          totalRows,
          progress: Math.round((analyzedRows / totalRows) * 100),
          analyzing: false,
        });
      } else if (analyzedRows >= totalRows) {
        setProgressiveAnalysis((prev) => ({ ...prev, enabled: false, analyzing: false, progress: 100 }));
      }
    }

    return () => {
      if (progressiveTimerRef.current) {
        clearTimeout(progressiveTimerRef.current);
      }
    };
  }, [csvData.length, analyzeResult, progressiveAnalysis.analyzing]);

  const runProgressiveAnalysis = useCallback(async () => {
    if (!csvFile || !progressiveAnalysis.enabled) return;

    setProgressiveAnalysis((prev) => ({ ...prev, analyzing: true }));

    const targetRows = Math.min(
      progressiveAnalysis.analyzedRows + 500,
      progressiveAnalysis.totalRows
    );

    // Create partial CSV with more rows
    const partialData = csvData.slice(0, targetRows);
    const csvContent = [
      csvHeaders.join(','),
      ...partialData.map((row) => csvHeaders.map((h) => `"${(row[h] ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const partialBlob = new Blob([csvContent], { type: 'text/csv' });
    const partialFile = new File([partialBlob], csvFile.name, { type: 'text/csv' });

    try {
      const formData = new FormData();
      formData.append('file', partialFile);
      const response = await fetch('/api/enrichment/analyze', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const result = (await response.json()) as AnalyzeResult;
        setAnalyzeResult(result);
        setProgressiveAnalysis({
          enabled: targetRows < progressiveAnalysis.totalRows,
          analyzedRows: targetRows,
          totalRows: progressiveAnalysis.totalRows,
          progress: Math.round((targetRows / progressiveAnalysis.totalRows) * 100),
          analyzing: false,
        });
      }
    } catch {
      // Continue with existing analysis
    } finally {
      setProgressiveAnalysis((prev) => ({ ...prev, analyzing: false }));
    }
  }, [csvFile, csvData, csvHeaders, progressiveAnalysis]);

  // ============================================================
  // Render Helpers (continued)
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="enrich" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Pipeline
          </TabsTrigger>
          <TabsTrigger value="coverage" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Field Coverage
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
                            <> • {(analyzeResult.profile?.totalRows ?? 0).toLocaleString()} rows • {analyzeResult.profile?.totalColumns ?? 0} columns</>
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

              {/* Progressive Analysis Banner */}
              {progressiveAnalysis.enabled && (
                <Card className="border-cyan-500/30 bg-cyan-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-cyan-400" />
                        <div>
                          <p className="font-medium text-cyan-400">Progressive Analysis</p>
                          <p className="text-sm text-muted-foreground">
                            Showing analysis of {progressiveAnalysis.analyzedRows.toLocaleString()}/{progressiveAnalysis.totalRows.toLocaleString()} rows
                            {progressiveAnalysis.analyzing && ' • Analyzing more...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Progress value={progressiveAnalysis.progress} className="h-2 [&>div]:bg-cyan-500" />
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={runProgressiveAnalysis}
                          disabled={progressiveAnalysis.analyzing}
                        >
                          {progressiveAnalysis.analyzing ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ArrowRight className="h-4 w-4 mr-1" />
                          )}
                          {progressiveAnalysis.analyzing ? 'Analyzing...' : 'Analyze More'}
                        </Button>
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
                        <div className={cn('text-3xl font-bold', qualityColor(analyzeResult.profile?.quality?.overallCompleteness ?? 0))}>
                          {analyzeResult.profile?.quality?.overallCompleteness ?? 0}%
                        </div>
                        <Progress
                          value={analyzeResult.profile?.quality?.overallCompleteness ?? 0}
                          className={cn('h-2 mt-2', qualityBarClass(analyzeResult.profile?.quality?.overallCompleteness ?? 0))}
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
                          {[...new Set((analyzeResult.profile?.columns ?? []).map(c => c.type))].map(type => (
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
                          {analyzeResult.profile?.quality?.duplicateRows ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(analyzeResult.profile?.quality?.duplicateRows ?? 0) === 0 ? 'No duplicates found' : 'Duplicate rows detected'}
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
                            {(analyzeResult.profile?.columns ?? []).map((col) => (
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
                                  ) : (col.topValues?.length ?? 0) > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {col.topValues!.slice(0, 3).map(tv => (
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
                      {csvHeaders.map((header) => {
                        const validation = fieldValidations.find((v) => v.field === header);
                        const isValid = validation && validation.validPct >= 90 && validation.issues.length === 0;
                        const isInvalid = validation && validation.validPct < 50;
                        return (
                          <div key={header} className="flex items-center gap-2 p-2.5 rounded-md bg-secondary/50">
                            {/* Validation Indicator */}
                            {validation && (
                              <div className="shrink-0">
                                {isValid ? (
                                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                                ) : isInvalid ? (
                                  <XCircle className="h-3.5 w-3.5 text-red-400" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                                )}
                              </div>
                            )}
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
                        );
                      })}
                    </div>
                    {/* Validation Summary */}
                    {fieldValidations.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">Validation Summary</p>
                        <div className="flex flex-wrap gap-2">
                          {fieldValidations
                            .filter((v) => v.type !== 'string' || v.issues.length > 0)
                            .map((v) => (
                              <div key={v.field} className="flex items-center gap-1.5 text-xs">
                                {v.validPct >= 90 && v.issues.length === 0 ? (
                                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                                ) : v.validPct < 50 ? (
                                  <XCircle className="h-3 w-3 text-red-400" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                                )}
                                <span className="text-muted-foreground">
                                  {v.valid}/{v.total - v.missing} {v.type} valid
                                  {v.issues.length > 0 && ` • ${v.issues[0]}`}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
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

              {/* Export Capabilities */}
              {analyzeResult && csvData.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Download className="h-5 w-5 text-emerald-400" />
                      Export
                    </CardTitle>
                    <CardDescription>Download analysis results or cleaned data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" size="sm" onClick={handleExportJSON}>
                        <FileJson className="h-4 w-4 mr-2" />
                        Export Analysis as JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleExportCleanedCSV}>
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Cleaned CSV
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cleaned CSV applies: URL normalization, email lowercase, title casing, trim whitespace
                    </p>
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

                  {(enrichResult.results ?? []).filter(r => (r.fieldsEnriched?.length ?? 0) > 0).length > 0 && (
                    <ScrollArea className="max-h-64">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Company</TableHead>
                            <TableHead>Enriched Fields</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(enrichResult.results ?? [])
                            .filter(r => (r.fieldsEnriched?.length ?? 0) > 0)
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
        {/* Tab 3: Field Coverage */}
        {/* ============================================================ */}
        <TabsContent value="coverage" className="space-y-4">
          {analyzeResult?.profile ? (
            <>
              {/* Data Quality Score Composite Gauge */}
              {(() => {
                const metrics = computeDataQualityMetrics();
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-emerald-400" />
                          Data Quality Score
                        </CardTitle>
                        <CardDescription>Composite gauge — weighted average of quality dimensions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                              <circle cx="60" cy="60" r="50" fill="none" stroke="oklch(0.18 0.01 270)" strokeWidth="10" />
                              <circle
                                cx="60" cy="60" r="50" fill="none"
                                stroke={metrics.overall >= 70 ? '#10B981' : metrics.overall >= 40 ? '#F59E0B' : '#EF4444'}
                                strokeWidth="10"
                                strokeDasharray={`${(metrics.overall / 100) * 314.16} 314.16`}
                                strokeLinecap="round"
                                transform="rotate(-90 60 60)"
                              />
                              <text x="60" y="55" textAnchor="middle" fill="oklch(0.85 0 0)" fontSize="24" fontWeight="bold">
                                {metrics.overall}
                              </text>
                              <text x="60" y="72" textAnchor="middle" fill="oklch(0.55 0 0)" fontSize="10">
                                / 100
                              </text>
                            </svg>
                          </div>
                          <div className="flex-1 space-y-2">
                            {[
                              { label: 'Completeness', value: metrics.completeness, weight: '30%' },
                              { label: 'Validity', value: metrics.validity, weight: '25%' },
                              { label: 'Consistency', value: metrics.consistency, weight: '20%' },
                              { label: 'Uniqueness', value: metrics.uniqueness, weight: '15%' },
                              { label: 'Timeliness', value: metrics.timeliness, weight: '10%' },
                            ].map((dim) => (
                              <div key={dim.label} className="space-y-0.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{dim.label} <span className="text-muted-foreground/50">({dim.weight})</span></span>
                                  <span className={cn('font-medium', qualityColor(dim.value))}>{dim.value}%</span>
                                </div>
                                <Progress value={dim.value} className={cn('h-1.5', qualityBarClass(dim.value))} />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Quality Radar Chart */}
                    <Card className="bg-card/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4 text-violet-400" />
                          Quality Radar
                        </CardTitle>
                        <CardDescription className="text-xs">Multi-axis quality profile</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart data={[
                            { metric: 'Completeness', value: metrics.completeness, fullMark: 100 },
                            { metric: 'Validity', value: metrics.validity, fullMark: 100 },
                            { metric: 'Uniqueness', value: metrics.uniqueness, fullMark: 100 },
                            { metric: 'Consistency', value: metrics.consistency, fullMark: 100 },
                            { metric: 'Timeliness', value: metrics.timeliness, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke="oklch(0.2 0.02 270)" />
                            <PolarAngleAxis
                              dataKey="metric"
                              tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }}
                            />
                            <PolarRadiusAxis
                              angle={90}
                              domain={[0, 100]}
                              tick={{ fill: 'oklch(0.4 0 0)', fontSize: 9 }}
                            />
                            <Radar
                              name="Quality"
                              dataKey="value"
                              stroke="#10B981"
                              fill="#10B981"
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'oklch(0.13 0.01 270)',
                                border: '1px solid oklch(0.2 0.02 270)',
                                borderRadius: '8px',
                                fontSize: '12px',
                                color: 'oklch(0.85 0 0)',
                              }}
                              formatter={(value: number) => [`${value}%`, 'Score']}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}

              {/* Field Coverage Heatmap */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Grid3X3 className="h-5 w-5 text-cyan-400" />
                    Field Coverage Heatmap
                  </CardTitle>
                  <CardDescription>Fields × data quality metrics — color-coded by health</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-1.5">
                      {/* Header */}
                      <div className="grid grid-cols-[minmax(140px,1fr)_repeat(4,80px)] gap-1.5 px-2 py-1">
                        <div className="text-xs font-medium text-muted-foreground">Field</div>
                        <div className="text-xs font-medium text-muted-foreground text-center">Complete</div>
                        <div className="text-xs font-medium text-muted-foreground text-center">Valid</div>
                        <div className="text-xs font-medium text-muted-foreground text-center">Unique</div>
                        <div className="text-xs font-medium text-muted-foreground text-center">Fill Rate</div>
                      </div>
                      {/* Rows */}
                      {(analyzeResult.profile.columns ?? []).map((col) => {
                        const validation = fieldValidations.find((v) => v.field === col.name);
                        const completeness = col.completeness ?? 0;
                        const validity = validation?.validPct ?? completeness;
                        const total = col.totalCount ?? 1;
                        const uniqueness = Math.min(100, Math.round(((col.uniqueCount ?? 0) / total) * 100));
                        const fillRate = completeness;

                        const cellColor = (pct: number) => {
                          if (pct >= 70) return 'bg-emerald-500/30 text-emerald-300';
                          if (pct >= 40) return 'bg-amber-500/30 text-amber-300';
                          return 'bg-red-500/30 text-red-300';
                        };

                        return (
                          <div key={col.name} className="grid grid-cols-[minmax(140px,1fr)_repeat(4,80px)] gap-1.5 px-2 py-1.5 rounded hover:bg-secondary/30 transition-colors">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn('text-xs shrink-0', TYPE_COLORS[col.type] || '')}>
                                {col.type}
                              </Badge>
                              <span className="text-sm font-medium truncate">{col.name}</span>
                            </div>
                            {[completeness, validity, uniqueness, fillRate].map((pct, i) => (
                              <div key={i} className={cn('rounded px-2 py-0.5 text-center text-xs font-medium', cellColor(pct))}>
                                {pct}%
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Per-field Deep Analysis Cards */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-violet-400" />
                    Per-field Deep Analysis
                  </CardTitle>
                  <CardDescription>Expand fields for completeness, uniqueness, type, sample values & distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {(analyzeResult.profile.columns ?? []).map((col) => {
                        const isExpanded = expandedFields.has(col.name);
                        const validation = fieldValidations.find((v) => v.field === col.name);
                        return (
                          <div key={col.name} className="rounded-lg border border-border overflow-hidden">
                            <button
                              className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors text-left"
                              onClick={() => {
                                setExpandedFields((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(col.name)) next.delete(col.name);
                                  else next.add(col.name);
                                  return next;
                                });
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className={cn('text-xs', TYPE_COLORS[col.type] || '')}>
                                  {col.type}
                                </Badge>
                                <span className="text-sm font-medium">{col.name}</span>
                                <span className={cn('text-xs', qualityColor(col.completeness ?? 0))}>
                                  {col.completeness ?? 0}% complete
                                </span>
                                {validation && validation.issues.length > 0 && (
                                  <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                                    {validation.issues.length} issue{validation.issues.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
                                {/* Metrics Row */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Completeness</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Progress value={col.completeness ?? 0} className={cn('h-2 flex-1', qualityBarClass(col.completeness ?? 0))} />
                                      <span className={cn('text-xs font-medium', qualityColor(col.completeness ?? 0))}>{col.completeness ?? 0}%</span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Unique Values</p>
                                    <p className="text-sm font-medium mt-1">{col.uniqueCount ?? 0} <span className="text-muted-foreground text-xs">/ {col.totalCount ?? 0}</span></p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Null / Empty</p>
                                    <p className="text-sm font-medium mt-1">{col.nullCount ?? 0}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Validity</p>
                                    <p className={cn('text-sm font-medium mt-1', qualityColor(validation?.validPct ?? (col.completeness ?? 0)))}>
                                      {validation?.validPct ?? (col.completeness ?? 0)}%
                                    </p>
                                  </div>
                                </div>

                                {/* Sample Values */}
                                {(col.sample?.length ?? 0) > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Sample Values</p>
                                    <div className="flex flex-wrap gap-1">
                                      {(col.sample ?? []).slice(0, 8).map((s, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Top Values Distribution */}
                                {(col.topValues?.length ?? 0) > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Top Values</p>
                                    <div className="space-y-1">
                                      {(col.topValues ?? []).slice(0, 5).map((tv) => (
                                        <div key={tv.value} className="flex items-center gap-2">
                                          <span className="text-xs font-medium w-24 truncate">{tv.value}</span>
                                          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                                            <div
                                              className="h-full rounded-full bg-emerald-500/60"
                                              style={{ width: `${tv.pct ?? 0}%` }}
                                            />
                                          </div>
                                          <span className="text-xs text-muted-foreground w-10 text-right">{tv.pct ?? 0}%</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Validation Issues */}
                                {validation && validation.issues.length > 0 && (
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Issues</p>
                                    <div className="flex flex-wrap gap-1">
                                      {validation.issues.map((issue, i) => (
                                        <Badge key={i} variant="outline" className="text-xs border-amber-500/30 text-amber-400">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          {issue}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Enrichment Recommendations */}
              {computeEnrichmentRecommendations().length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                      Enrichment Recommendations
                    </CardTitle>
                    <CardDescription>AI-powered suggestions for which fields to enrich next, ranked by impact</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {computeEnrichmentRecommendations().map((rec) => (
                        <div key={rec.field} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                          <div className={cn(
                            'shrink-0 rounded-full p-1.5',
                            rec.priority === 'high' && 'bg-red-500/20',
                            rec.priority === 'medium' && 'bg-amber-500/20',
                            rec.priority === 'low' && 'bg-emerald-500/20',
                          )}>
                            {rec.priority === 'high' ? (
                              <Zap className="h-4 w-4 text-red-400" />
                            ) : rec.priority === 'medium' ? (
                              <TrendingUp className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Info className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{rec.field}</span>
                              <Badge variant="outline" className={cn(
                                'text-xs shrink-0',
                                rec.priority === 'high' && 'border-red-500/30 text-red-400',
                                rec.priority === 'medium' && 'border-amber-500/30 text-amber-400',
                                rec.priority === 'low' && 'border-emerald-500/30 text-emerald-400',
                              )}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{rec.reason}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn('text-lg font-bold', qualityColor(rec.impactPct))}>{rec.impactPct}%</p>
                            <p className="text-xs text-muted-foreground">impact</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Data Cleaning Suggestions */}
              {computeCleaningSuggestions().length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eraser className="h-5 w-5 text-rose-400" />
                      Data Cleaning Suggestions
                    </CardTitle>
                    <CardDescription>Detected issues that could improve data quality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {computeCleaningSuggestions().map((suggestion, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                          <div className={cn(
                            'shrink-0 rounded-full p-1.5',
                            suggestion.impact === 'high' && 'bg-red-500/20',
                            suggestion.impact === 'medium' && 'bg-amber-500/20',
                            suggestion.impact === 'low' && 'bg-emerald-500/20',
                          )}>
                            {suggestion.impact === 'high' ? (
                              <AlertCircle className="h-4 w-4 text-red-400" />
                            ) : suggestion.impact === 'medium' ? (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Info className="h-4 w-4 text-emerald-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{suggestion.description}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Field: <span className="font-medium">{suggestion.field}</span> • Type: {suggestion.type} • {suggestion.affectedRows} rows affected
                            </p>
                          </div>
                          <Badge variant="outline" className={cn(
                            'text-xs shrink-0',
                            suggestion.impact === 'high' && 'border-red-500/30 text-red-400',
                            suggestion.impact === 'medium' && 'border-amber-500/30 text-amber-400',
                            suggestion.impact === 'low' && 'border-emerald-500/30 text-emerald-400',
                          )}>
                            {suggestion.impact}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="rounded-full bg-secondary/50 p-6">
                    <Grid3X3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">No Field Coverage Data</h3>
                    <p className="text-sm text-muted-foreground mt-2 max-w-md">
                      Upload a CSV or Excel file in the <strong>CSV Import</strong> tab to see field coverage analysis,
                      data quality scores, and enrichment recommendations.
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
        </TabsContent>

        {/* ============================================================ */}
        {/* Tab 4: Data Visualization */}
        {/* ============================================================ */}
        <TabsContent value="visualize" className="space-y-4">
          {/* Auto-generated charts from analysis */}
          {analyzeResult?.profile?.quality?.recommendedCharts &&
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
              {analyzeResult?.profile?.correlations && analyzeResult.profile.correlations.length > 0 && (
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

              {/* Enhanced: Data Quality Radar Chart */}
              {(() => {
                const metrics = computeDataQualityMetrics();
                if (metrics.overall === 0) return null;
                return (
                  <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-violet-400" />
                        Data Quality Radar
                      </CardTitle>
                      <CardDescription className="text-xs">Multi-axis quality profile — completeness, validity, uniqueness, consistency, timeliness</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadarChart data={[
                          { metric: 'Completeness', value: metrics.completeness, fullMark: 100 },
                          { metric: 'Validity', value: metrics.validity, fullMark: 100 },
                          { metric: 'Uniqueness', value: metrics.uniqueness, fullMark: 100 },
                          { metric: 'Consistency', value: metrics.consistency, fullMark: 100 },
                          { metric: 'Timeliness', value: metrics.timeliness, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="oklch(0.2 0.02 270)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'oklch(0.4 0 0)', fontSize: 9 }} />
                          <Radar name="Quality" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'oklch(0.13 0.01 270)',
                              border: '1px solid oklch(0.2 0.02 270)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'oklch(0.85 0 0)',
                            }}
                            formatter={(value: number) => [`${value}%`, 'Score']}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Enhanced: Missing Data Pattern Chart */}
              {(() => {
                const patterns = computeMissingDataPatterns();
                if (patterns.length === 0) return null;
                return (
                  <Card className="bg-card/80 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Missing Data Patterns
                      </CardTitle>
                      <CardDescription className="text-xs">Fields that tend to be missing together</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={patterns.map((p) => ({ name: p.pattern, count: p.count }))}
                          margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: 'oklch(0.55 0 0)', fontSize: 10 }}
                            angle={-35}
                            textAnchor="end"
                            height={80}
                            axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                            tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                          />
                          <YAxis
                            tick={{ fill: 'oklch(0.55 0 0)', fontSize: 11 }}
                            axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                            tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'oklch(0.13 0.01 270)',
                              border: '1px solid oklch(0.2 0.02 270)',
                              borderRadius: '8px',
                              fontSize: '12px',
                              color: 'oklch(0.85 0 0)',
                            }}
                          />
                          <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Rows Missing" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Enhanced: Value Distribution Histograms for numeric columns */}
              {(analyzeResult?.profile?.columns ?? [])
                .filter((col) => col.type === 'number' && (col.distribution?.length ?? 0) > 0)
                .length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-emerald-400" />
                      Value Distributions
                    </CardTitle>
                    <CardDescription>Histograms for numeric columns with proper binning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(analyzeResult?.profile?.columns ?? [])
                        .filter((col) => col.type === 'number' && (col.distribution?.length ?? 0) > 0)
                        .map((col) => (
                          <Card key={col.name} className="bg-card/80 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">{col.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {col.min !== undefined && col.max !== undefined
                                  ? `Range: ${col.min.toLocaleString()} – ${col.max.toLocaleString()}`
                                  : ''}
                                {col.mean !== undefined && ` • μ: ${col.mean.toLocaleString()}`}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart
                                  data={(col.distribution ?? []).map((d) => ({
                                    bin: d.bin,
                                    count: d.count,
                                  }))}
                                  margin={{ top: 5, right: 10, left: 10, bottom: 20 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.01 270)" />
                                  <XAxis
                                    dataKey="bin"
                                    tick={{ fill: 'oklch(0.55 0 0)', fontSize: 10 }}
                                    angle={-30}
                                    textAnchor="end"
                                    height={40}
                                    axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                                    tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                                  />
                                  <YAxis
                                    tick={{ fill: 'oklch(0.55 0 0)', fontSize: 10 }}
                                    axisLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                                    tickLine={{ stroke: 'oklch(0.2 0.02 270)' }}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'oklch(0.13 0.01 270)',
                                      border: '1px solid oklch(0.2 0.02 270)',
                                      borderRadius: '8px',
                                      fontSize: '12px',
                                      color: 'oklch(0.85 0 0)',
                                    }}
                                  />
                                  <Bar dataKey="count" fill="#10B981" radius={[2, 2, 0, 0]} name="Count" />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
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
