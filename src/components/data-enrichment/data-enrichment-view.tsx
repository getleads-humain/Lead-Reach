'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  FileSpreadsheet,
  Sparkles,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  RefreshCw,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { safeFetchJSON } from '@/lib/utils';

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

// ============================================================
// Column Mapping Display
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

// ============================================================
// Component
// ============================================================

export function DataEnrichmentView() {
  const [activeTab, setActiveTab] = useState('import');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string | null>>({});
  const [isDragOver, setIsDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [enriching, setEnriching] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState(0);
  const [enrichResult, setEnrichResult] = useState<EnrichmentResult | null>(null);
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load campaigns on mount
  React.useEffect(() => {
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
  // CSV Handling
  // ============================================================

  const parseCSV = useCallback(async (file: File) => {
    setCsvFile(file);
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

          // Auto-detect column mapping
          const map: Record<string, string | null> = {};
          for (const header of headers) {
            map[header] = autoMapColumn(header);
          }
          setColumnMap(map);
        }
      },
    });
  }, []);

  const autoMapColumn = (header: string): string | null => {
    const normalized = header.toLowerCase().trim().replace(/[_\-./\\]/g, ' ').replace(/\s+/g, ' ');

    const aliasMap: Record<string, string[]> = {
      companyName: ['company name', 'company', 'organization', 'org', 'business name', 'business', 'employer', 'account name'],
      legalName: ['legal name', 'registered name', 'official name'],
      website: ['website', 'url', 'domain', 'web', 'site', 'homepage', 'web address'],
      industry: ['industry', 'sector', 'vertical', 'business type'],
      subIndustry: ['sub industry', 'niche', 'sub sector'],
      city: ['city', 'town', 'locality'],
      stateProvince: ['state', 'province', 'region', 'territory'],
      country: ['country', 'nation'],
      phoneMain: ['phone', 'telephone', 'tel', 'main phone', 'business phone'],
      generalEmail: ['email', 'email address', 'e-mail', 'general email', 'contact email'],
      ceoName: ['ceo', 'ceo name', 'founder', 'owner', 'executive'],
      keyContactName: ['contact name', 'contact', 'key contact', 'decision maker', 'full name', 'name'],
      keyContactTitle: ['title', 'job title', 'position', 'role', 'designation'],
      keyContactEmail: ['contact email', 'personal email', 'direct email'],
      employeeCount: ['employees', 'employee count', 'size', 'company size', 'headcount'],
      revenueEstimate: ['revenue', 'annual revenue', 'turnover', 'sales'],
      foundingYear: ['founded', 'year founded', 'founding year', 'established'],
      linkedinUrl: ['linkedin', 'linkedin url', 'linkedin page'],
      techStack: ['tech stack', 'technology', 'technologies', 'tools'],
    };

    for (const [target, aliases] of Object.entries(aliasMap)) {
      if (normalized === target || aliases.some(alias => normalized === alias)) {
        return target;
      }
    }

    return null;
  };

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
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.tsv'))) {
      await parseCSV(file);
    }
  }, [parseCSV]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await parseCSV(file);
    }
  }, [parseCSV]);

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

      const result = await response.json() as ImportResult;
      setImportResult(result);
      loadStats();
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({ imported: 0, total: csvData.length, skipped: csvData.length, errors: [{ row: 0, error: 'Import failed' }] });
    } finally {
      setImporting(false);
    }
  }, [csvFile, selectedCampaign, csvData, loadStats]);

  // ============================================================
  // Enrichment
  // ============================================================

  const handleEnrich = useCallback(async () => {
    if (!selectedCampaign) return;

    setEnriching(true);
    setEnrichProgress(0);
    setEnrichResult(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setEnrichProgress(prev => Math.min(prev + 5, 90));
      }, 1000);

      const response = await fetch('/api/leads/bulk-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign }),
      });

      clearInterval(progressInterval);
      setEnrichProgress(100);

      const result = await response.json() as EnrichmentResult;
      setEnrichResult(result);
      loadStats();
    } catch (error) {
      console.error('Enrichment failed:', error);
    } finally {
      setEnriching(false);
    }
  }, [selectedCampaign, loadStats]);

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Enrichment</h1>
          <p className="text-muted-foreground">Import CSV data and enrich leads with AI-powered research</p>
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
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total Leads</div>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Enriched</div>
              <div className="text-2xl font-bold text-emerald-600">{stats.enrichedLeads}</div>
              <div className="text-xs text-muted-foreground">{stats.enrichmentRate}% rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Data Completeness</div>
              <div className="text-2xl font-bold">{stats.averageDataCompleteness}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Enriched (7d)</div>
              <div className="text-2xl font-bold text-cyan-600">{stats.recentEnriched}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" />
            CSV Import
          </TabsTrigger>
          <TabsTrigger value="enrich" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI Enrichment
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Field Coverage
          </TabsTrigger>
        </TabsList>

        {/* Import Tab */}
        <TabsContent value="import" className="space-y-4">
          {/* Drop Zone */}
          {!csvFile ? (
            <Card>
              <CardContent
                className={`p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  isDragOver ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="rounded-full bg-emerald-500/10 p-4">
                    <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Upload CSV File</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                  </div>
                  <Badge variant="outline">Supports .csv and .tsv files</Badge>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                      <div>
                        <CardTitle className="text-base">{csvFile.name}</CardTitle>
                        <CardDescription>
                          {csvData.length} rows • {csvHeaders.length} columns
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCsvFile(null);
                          setCsvData([]);
                          setCsvHeaders([]);
                          setColumnMap({});
                          setImportResult(null);
                        }}
                      >
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

              {/* Column Mapping */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Column Mapping</CardTitle>
                  <CardDescription>Auto-detected mapping — review and adjust if needed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {csvHeaders.map((header) => (
                      <div key={header} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                        <span className="text-sm font-medium truncate">{header}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        {columnMap[header] ? (
                          <Badge variant="secondary" className="text-xs shrink-0">
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

              {/* Data Preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Data Preview</CardTitle>
                  <CardDescription>First 10 rows of your CSV</CardDescription>
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
                                {row[h] || '-'}
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

              {/* Import Result */}
              {importResult && (
                <Card className={importResult.imported > 0 ? 'border-emerald-500/50' : 'border-red-500/50'}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {importResult.imported > 0 ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
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

        {/* Enrichment Tab */}
        <TabsContent value="enrich" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">AI-Powered Enrichment</CardTitle>
                  <CardDescription>
                    Fill empty lead fields using web research and AI analysis
                  </CardDescription>
                </div>
                <Button
                  onClick={handleEnrich}
                  disabled={enriching || !selectedCampaign || !stats || stats.newLeads === 0 && stats.enrichedLeads === 0}
                >
                  {enriching ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  {enriching ? 'Enriching...' : 'Enrich Leads'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {enriching && (
                <div className="space-y-3 mb-4">
                  <Progress value={enrichProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground">
                    {enrichProgress < 50
                      ? 'Searching web for company information...'
                      : enrichProgress < 90
                        ? 'Analyzing data with AI...'
                        : 'Finalizing enrichment...'}
                  </p>
                </div>
              )}

              {enrichResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
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
                            <TableHead>New Data Points</TableHead>
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
                                      <Badge key={f} variant="secondary" className="text-xs">
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

              {!enriching && !enrichResult && stats && (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {stats.newLeads > 0
                      ? `${stats.newLeads} new leads ready for enrichment`
                      : stats.totalLeads > 0
                        ? `${stats.totalLeads} leads available — some fields may be enrichable`
                        : 'No leads to enrich. Import leads first.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Field Coverage Tab */}
        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field Coverage</CardTitle>
              <CardDescription>Percentage of leads with each field populated</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : stats?.fieldCoverage ? (
                <div className="space-y-3">
                  {Object.entries(stats.fieldCoverage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([field, coverage]) => (
                      <div key={field} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{FRIENDLY_NAMES[field] || field}</span>
                          <span className={`${coverage >= 70 ? 'text-emerald-600' : coverage >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                            {coverage}%
                          </span>
                        </div>
                        <Progress
                          value={coverage}
                          className={`h-2 ${coverage >= 70 ? '[&>div]:bg-emerald-500' : coverage >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'}`}
                        />
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No coverage data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
