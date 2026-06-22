'use client';

/**
 * /knowledge — Knowledge Base Admin UI
 * =====================================
 *
 * Browse, search, and inspect the LeadReach knowledge base.
 * - Browse all docs by category (industries / regions / playbooks / tools / training-data)
 * - Full-text search via BM25 (with optional embeddings)
 * - Read raw markdown / JSONL content
 * - View KB statistics
 * - Generate and view monthly Echo gap reports
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Loader2,
  ChevronRight,
  Database,
  TrendingUp,
  Calendar,
  Sparkles,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface KnowledgeFile {
  path: string;
  category: 'industry' | 'region' | 'playbook' | 'tool' | 'training-data' | 'gap-report';
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
    coverageGaps: { industriesMissing: string[]; regionsMissing: string[]; playbooksMissing: string[] };
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

const CATEGORY_META: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  industry: { icon: Briefcase, label: 'Industries', color: 'text-blue-600' },
  region: { icon: Globe, label: 'Regions', color: 'text-green-600' },
  playbook: { icon: BookOpen, label: 'Playbooks', color: 'text-purple-600' },
  tool: { icon: Wrench, label: 'Agent Tools', color: 'text-orange-600' },
  'training-data': { icon: GraduationCap, label: 'Training Data', color: 'text-pink-600' },
  'gap-report': { icon: AlertTriangle, label: 'Gap Reports', color: 'text-red-600' },
};

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-500/10 text-green-700 border-green-500/30',
  B: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  C: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  D: 'bg-red-500/10 text-red-700 border-red-500/30',
};

// ============================================================
// Page
// ============================================================

export default function KnowledgeAdminPage() {
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

  // ============================================================
  // Initial Load
  // ============================================================

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
        // Refresh stats to show updated coverage
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

  // ============================================================
  // Search (debounced)
  // ============================================================

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

  // ============================================================
  // Gap Report
  // ============================================================

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
      void loadStats();  // refresh stats too
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

  // ============================================================
  // Render
  // ============================================================

  const filesByCategory = files.reduce<Record<string, KnowledgeFile[]>>((acc, f) => {
    (acc[f.category] = acc[f.category] || []).push(f);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Knowledge Base Admin</h1>
              <p className="text-xs text-slate-500">
                LeadReach 8-Agent Pipeline · {stats ? `${stats.totalDocs} docs · ${stats.totalChunks} chunks` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats?.embeddingsEnabled && (
              <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">
                <Sparkles className="w-3 h-3 mr-1" />
                Embeddings
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => { void loadStats(); void loadList(); }}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="gap-report">Gap Report</TabsTrigger>
          </TabsList>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Sidebar: categories + file list */}
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Categories</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                      const Icon = meta.icon;
                      const count = filesByCategory[cat]?.length || 0;
                      return (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                            activeCategory === cat
                              ? 'bg-slate-100 text-slate-900 font-medium'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                            {meta.label}
                          </span>
                          <Badge variant="secondary" className="text-xs">{count}</Badge>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm">
                      {CATEGORY_META[activeCategory]?.label || 'Files'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingList ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                      </div>
                    ) : (
                      <ScrollArea className="h-[400px] -mx-2">
                        <div className="px-2 space-y-1">
                          {(filesByCategory[activeCategory] || []).map((file) => (
                            <button
                              key={file.path}
                              onClick={() => void loadFile(file.path)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                selectedFile === file.path
                                  ? 'bg-violet-50 text-violet-900 border-l-2 border-violet-500'
                                  : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{file.title}</div>
                                  <div className="text-xs text-slate-500 truncate">{file.path}</div>
                                </div>
                                {file.grade && (
                                  <Badge variant="outline" className={`text-xs ${GRADE_COLORS[file.grade] || ''}`}>
                                    {file.grade}
                                  </Badge>
                                )}
                              </div>
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {file.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          ))}
                          {filesByCategory[activeCategory]?.length === 0 && (
                            <div className="text-center text-sm text-slate-400 py-8">
                              No files in this category.
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Main: file content */}
              <div className="col-span-8">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {selectedFile ? selectedFile : 'Select a file to view'}
                        </CardTitle>
                        <CardDescription>
                          {selectedFile && (
                            <span className="flex items-center gap-2 text-xs">
                              <FileText className="w-3 h-3" />
                              {selectedFile}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingFile ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                      </div>
                    ) : selectedFile ? (
                      <ScrollArea className="h-[600px]">
                        <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap break-words">
                          {fileContent}
                        </pre>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-16 text-slate-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Select a file from the sidebar to view its contents.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Semantic Search
                </CardTitle>
                <CardDescription>
                  Search the knowledge base using BM25 {stats?.embeddingsEnabled ? '+ Z.AI embeddings (hybrid)' : '(embeddings disabled)'}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Search for: SaaS B2B Series B, GDPR consent, multi-threading..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 text-xs text-slate-500">
                    {searchResults.length} results · method: {searchResults[0]?.retrievalMethod}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-3">
              {searchResults.map((result) => {
                const Icon = CATEGORY_META[result.category]?.icon || FileText;
                return (
                  <Card
                    key={result.chunkId}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => void loadFile(result.filePath)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className={`w-4 h-4 ${CATEGORY_META[result.category]?.color}`} />
                            <span className="font-medium text-sm text-slate-900">{result.title}</span>
                            {result.section && (
                              <>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                <span className="text-sm text-slate-600">{result.section}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{result.contentPreview}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                            <span className="font-mono">{result.filePath}</span>
                            {result.grade && (
                              <Badge variant="outline" className={`text-xs ${GRADE_COLORS[result.grade] || ''}`}>
                                {result.grade}
                              </Badge>
                            )}
                            {result.matchedTokens.slice(0, 5).map((t) => (
                              <span key={t} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Score</div>
                          <div className="font-mono text-sm font-medium text-slate-700">
                            {result.score.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center text-slate-400">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No results for "{searchQuery}"</p>
                  </CardContent>
                </Card>
              )}
              {searchQuery.trim().length < 2 && (
                <Card>
                  <CardContent className="p-8 text-center text-slate-400">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Type at least 2 characters to search.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* STATS TAB */}
          <TabsContent value="stats" className="space-y-4">
            {!stats ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <StatCard icon={FileText} label="Total Docs" value={stats.totalDocs} color="text-blue-600" />
                  <StatCard icon={Database} label="Total Chunks" value={stats.totalChunks} color="text-purple-600" />
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
                    color={stats.embeddingsEnabled ? 'text-green-600' : 'text-slate-400'}
                  />
                  <StatCard icon={TrendingUp} label="Fresh (90d)" value={stats.freshness.fresh} color="text-green-600" />
                </div>

                {stats.embeddingsEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Semantic Embeddings — Z.AI embedding-3
                      </CardTitle>
                      <CardDescription>
                        Hybrid retrieval (BM25 + cosine similarity) for better recall on paraphrased queries.
                        Coverage shows how many chunks have pre-computed embeddings cached on disk.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {stats.embeddingsCoverage && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Coverage</span>
                            <span className="font-medium text-slate-900">
                              {stats.embeddingsCoverage.cached} / {stats.embeddingsCoverage.total} chunks (
                              {stats.embeddingsCoverage.total > 0
                                ? Math.round((stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 transition-all"
                              style={{
                                width: `${
                                  stats.embeddingsCoverage.total > 0
                                    ? (stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void precomputeEmbeddings()}
                              disabled={precomputing}
                            >
                              {precomputing ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3 h-3 mr-1" />
                              )}
                              {precomputing
                                ? 'Computing...'
                                : stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total
                                  ? 'Pre-compute Missing'
                                  : 'Re-compute All'}
                            </Button>
                            {precomputeMsg && (
                              <span className="text-xs text-slate-500">{precomputeMsg}</span>
                            )}
                          </div>
                          {stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total && (
                            <p className="text-xs text-amber-600 pt-1">
                              ⚠ {stats.embeddingsCoverage.total - stats.embeddingsCoverage.cached} chunks lack cached
                              embeddings — those will fall back to BM25-only scoring at query time. Click "Pre-compute
                              Missing" to populate the cache (~2-3 seconds per batch of 16).
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">By Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.byCategory).map(([cat, count]) => {
                          const meta = CATEGORY_META[cat];
                          const Icon = meta?.icon || FileText;
                          return (
                            <div key={cat} className="flex items-center justify-between">
                              <span className="flex items-center gap-2 text-sm text-slate-700">
                                <Icon className={`w-4 h-4 ${meta?.color || 'text-slate-400'}`} />
                                {meta?.label || cat}
                              </span>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">By Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(stats.byGrade).map(([grade, count]) => (
                          <div key={grade} className="flex items-center justify-between">
                            <Badge variant="outline" className={GRADE_COLORS[grade] || ''}>Grade {grade}</Badge>
                            <span className="text-sm font-medium text-slate-700">{count} docs</span>
                          </div>
                        ))}
                        {Object.keys(stats.byGrade).length === 0 && (
                          <p className="text-sm text-slate-400">No grades recorded.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Freshness Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{stats.freshness.fresh}</div>
                        <div className="text-xs text-green-600 mt-1">Fresh (≤90 days)</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-700">{stats.freshness.stale}</div>
                        <div className="text-xs text-amber-600 mt-1">Stale (90–180 days)</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-700">{stats.freshness.very_stale}</div>
                        <div className="text-xs text-red-600 mt-1">Very Stale (180+ days)</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* GAP REPORT TAB */}
          <TabsContent value="gap-report" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Echo Monthly Gap Report
                    </CardTitle>
                    <CardDescription>
                      Generated by the Echo agent. Identifies coverage, quality, usage, and freshness gaps in the knowledge base.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void regenerateGapReport()}
                    disabled={generatingGap}
                  >
                    {generatingGap ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {gapReport?.result && (
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    <GapStat label="Industries Missing" value={gapReport.result.coverageGaps.industriesMissing.length} color="text-blue-600" />
                    <GapStat label="Regions Missing" value={gapReport.result.coverageGaps.regionsMissing.length} color="text-green-600" />
                    <GapStat label="Playbooks Missing" value={gapReport.result.coverageGaps.playbooksMissing.length} color="text-purple-600" />
                    <GapStat label="Quality Gaps" value={gapReport.result.qualityGaps.length} color="text-amber-600" />
                    <GapStat label="Freshness Gaps" value={gapReport.result.freshnessGaps.length} color="text-red-600" />
                  </div>
                )}

                {gapReport?.result?.recommendations && (
                  <div className="space-y-3">
                    {gapReport.result.recommendations.newDocsToAuthor.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">New Docs to Author</h4>
                        <div className="space-y-1">
                          {gapReport.result.recommendations.newDocsToAuthor.map((rec, i) => (
                            <div key={i} className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {gapReport.result.recommendations.existingDocsToRefresh.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Existing Docs to Refresh</h4>
                        <div className="space-y-1">
                          {gapReport.result.recommendations.existingDocsToRefresh.slice(0, 10).map((rec, i) => (
                            <div key={i} className="text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded">
                              {rec}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {gapReport?.content && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Full Report — {gapReport.reportMonth}
                  </CardTitle>
                  <CardDescription>
                    Saved to <code className="text-xs">{gapReport.reportPath}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap">
                      {gapReport.content}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {!gapReport && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  <p className="text-sm text-slate-500 mt-2">Loading gap report...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({ icon: Icon, label, value, color }: { icon: typeof FileText; label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Icon className={`w-8 h-8 ${color}`} />
          <div>
            <div className="text-xs text-slate-500">{label}</div>
            <div className="text-xl font-bold text-slate-900">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GapStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-600 mt-1">{label}</div>
    </div>
  );
}
