'use client';

/**
 * /knowledge — Knowledge Base Admin UI (Premium Redesign)
 * ========================================================
 *
 * Browse, search, and inspect the LeadReach knowledge base.
 * Features industry-grade CSS with uiverse.io-inspired effects:
 *
 *   1. Isometric 3D cube tiles (csemszepp/tiny-firefox-14)
 *      → Hero header accent & animated stat decorations
 *
 *   2. SVG path-tracing loaders (mobinkakei/proud-ladybug-46)
 *      → Content loading states
 *
 *   3. Three-body spin loader (dovatgabriel/tidy-walrus-92)
 *      → Primary loading indicator
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
import { Badge } from '@/components/ui/badge';
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
  Activity,
  Layers,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

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

const CATEGORY_META: Record<string, { icon: typeof FileText; label: string; color: string; gradient: string; bgGlow: string }> = {
  industry: { icon: Briefcase, label: 'Industries', color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-400', bgGlow: 'bg-blue-500/20' },
  region: { icon: Globe, label: 'Regions', color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-400', bgGlow: 'bg-emerald-500/20' },
  playbook: { icon: BookOpen, label: 'Playbooks', color: 'text-violet-400', gradient: 'from-violet-500 to-purple-400', bgGlow: 'bg-violet-500/20' },
  tool: { icon: Wrench, label: 'Agent Tools', color: 'text-orange-400', gradient: 'from-orange-500 to-amber-400', bgGlow: 'bg-orange-500/20' },
  'training-data': { icon: GraduationCap, label: 'Training Data', color: 'text-pink-400', gradient: 'from-pink-500 to-rose-400', bgGlow: 'bg-pink-500/20' },
  'gap-report': { icon: AlertTriangle, label: 'Gap Reports', color: 'text-red-400', gradient: 'from-red-500 to-orange-400', bgGlow: 'bg-red-500/20' },
};

const GRADE_STYLES: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  A: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  B: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  C: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  D: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
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

  const tabItems = [
    { id: 'browse', label: 'Browse', icon: Layers },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'gap-report', label: 'Gap Report', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-200 relative overflow-hidden">
      {/* ── Background ambient effects ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/5 rounded-full blur-[180px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/3 rounded-full blur-[160px]" />
      </div>

      {/* ── Isometric Cube Decoration (uiverse.io/csemszepp/tiny-firefox-14) ── */}
      <div className="fixed top-4 right-8 opacity-20 pointer-events-none hidden lg:block">
        <IsometricCubes />
      </div>

      {/* ── Header ── */}
      <header className="relative border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/app" className="text-slate-500 hover:text-slate-300 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="relative">
              <div className="p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl shadow-lg shadow-violet-500/25">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Knowledge Base Admin</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                LeadReach 8-Agent Pipeline · {stats ? (
                  <span className="text-slate-400">{stats.totalDocs} docs · {stats.totalChunks} chunks</span>
                ) : (
                  <span className="text-slate-600">Loading...</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {stats?.embeddingsEnabled && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-3 h-3 text-violet-400" />
                <span className="text-[11px] font-medium text-violet-400">Embeddings</span>
              </div>
            )}
            <button
              onClick={() => { void loadStats(); void loadList(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-slate-300 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <div className="relative border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 py-2">
            {tabItems.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-white/5'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="relative max-w-7xl mx-auto px-6 py-6">

        {/* ═══════════════════════════════════════════════════
            BROWSE TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'browse' && (
          <div className="grid grid-cols-12 gap-5">
            {/* Sidebar: categories + file list */}
            <div className="col-span-12 lg:col-span-4 space-y-4">
              {/* Category Nav */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</h3>
                </div>
                <div className="p-2 space-y-0.5">
                  {Object.entries(CATEGORY_META).map(([cat, meta]) => {
                    const Icon = meta.icon;
                    const count = filesByCategory[cat]?.length || 0;
                    const isActive = activeCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-300 group ${
                          isActive
                            ? 'bg-gradient-to-r ' + meta.gradient + ' bg-opacity-10 text-white shadow-lg'
                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                        }`}
                        style={isActive ? { background: `linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.08))` } : {}}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`p-1 rounded-md ${isActive ? meta.bgGlow : 'bg-white/5'} transition-all duration-300`}>
                            <Icon className={`w-3.5 h-3.5 ${isActive ? meta.color : 'text-slate-500'}`} />
                          </span>
                          <span className={isActive ? 'font-semibold' : 'font-medium'}>{meta.label}</span>
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File List */}
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {CATEGORY_META[activeCategory]?.label || 'Files'}
                  </h3>
                </div>
                <div className="p-2">
                  {loadingList ? (
                    <div className="flex items-center justify-center py-12">
                      <ThreeBodyLoader size={28} color="#8b5cf6" />
                    </div>
                  ) : (
                    <ScrollArea className="h-[420px]">
                      <div className="space-y-0.5">
                        {(filesByCategory[activeCategory] || []).map((file) => {
                          const isSelected = selectedFile === file.path;
                          const gradeStyle = file.grade ? GRADE_STYLES[file.grade] : null;
                          return (
                            <button
                              key={file.path}
                              onClick={() => void loadFile(file.path)}
                              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                                isSelected
                                  ? 'bg-violet-500/15 border-l-2 border-violet-400 text-white shadow-lg shadow-violet-500/10'
                                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate group-hover:text-white transition-colors">{file.title}</div>
                                  <div className="text-[11px] text-slate-600 truncate mt-0.5 font-mono">{file.path}</div>
                                </div>
                                {file.grade && gradeStyle && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border} font-bold`}>
                                    {file.grade}
                                  </span>
                                )}
                              </div>
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {file.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-white/5 text-slate-500 rounded border border-white/5">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </button>
                          );
                        })}
                        {filesByCategory[activeCategory]?.length === 0 && (
                          <div className="text-center text-sm text-slate-600 py-12">
                            No files in this category.
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>

            {/* Main: file content */}
            <div className="col-span-12 lg:col-span-8">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden h-full min-h-[600px] flex flex-col">
                {/* File Header */}
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {selectedFile ? (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-violet-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-white truncate">{selectedFile.split('/').pop()}</span>
                        <span className="text-[10px] text-slate-600 font-mono truncate">{selectedFile}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">Select a file to view</span>
                    )}
                  </div>
                </div>
                {/* File Content */}
                <div className="flex-1 p-5">
                  {loadingFile ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <PathTraceLoader size={48} color="#8b5cf6" />
                      <span className="text-xs text-slate-500">Loading document...</span>
                    </div>
                  ) : selectedFile ? (
                    <ScrollArea className="h-[540px]">
                      <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                        {fileContent}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 mb-4">
                        <FileText className="w-10 h-10 text-slate-700" />
                      </div>
                      <p className="text-sm text-slate-500">Select a file from the sidebar to view its contents.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            SEARCH TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'search' && (
          <div className="space-y-5">
            {/* Search Input */}
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <Search className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Semantic Search</h3>
                  <p className="text-[11px] text-slate-500">
                    BM25 {stats?.embeddingsEnabled ? '+ Z.AI embeddings (hybrid)' : '(embeddings disabled)'}
                  </p>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                <input
                  type="text"
                  placeholder="Search: SaaS B2B Series B, GDPR consent, multi-threading..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/25 transition-all"
                />
                {searching && (
                  <ThreeBodyLoader size={18} color="#8b5cf6" className="absolute right-3.5 top-1/2 -translate-y-1/2" />
                )}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 text-xs text-slate-500">
                  {searchResults.length} results · method: <span className="text-violet-400">{searchResults[0]?.retrievalMethod}</span>
                </div>
              )}
            </div>

            {/* Search Results */}
            <div className="space-y-3">
              {searchResults.map((result) => {
                const Icon = CATEGORY_META[result.category]?.icon || FileText;
                const meta = CATEGORY_META[result.category];
                const gradeStyle = result.grade ? GRADE_STYLES[result.grade] : null;
                return (
                  <div
                    key={result.chunkId}
                    onClick={() => void loadFile(result.filePath)}
                    className="group rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-violet-500/30 hover:bg-white/[0.05] backdrop-blur-sm p-4 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`p-1 rounded ${meta?.bgGlow || 'bg-white/5'}`}>
                            <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-500'}`} />
                          </span>
                          <span className="font-medium text-sm text-white">{result.title}</span>
                          {result.section && (
                            <>
                              <ChevronRight className="w-3 h-3 text-slate-600" />
                              <span className="text-sm text-slate-400">{result.section}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{result.contentPreview}</p>
                        <div className="flex items-center gap-2 mt-2.5 text-xs text-slate-600 flex-wrap">
                          <span className="font-mono text-[10px]">{result.filePath}</span>
                          {result.grade && gradeStyle && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border}`}>
                              {result.grade}
                            </span>
                          )}
                          {result.matchedTokens.slice(0, 5).map((t) => (
                            <span key={t} className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[10px]">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider">Score</div>
                        <div className="font-mono text-sm font-bold text-violet-400">
                          {result.score.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {searchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
                  <Search className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                  <p className="text-sm text-slate-500">No results for &ldquo;{searchQuery}&rdquo;</p>
                </div>
              )}
              {searchQuery.trim().length < 2 && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-12 text-center">
                  <div className="flex justify-center mb-4">
                    <PathTraceLoader size={36} color="#8b5cf6" />
                  </div>
                  <p className="text-sm text-slate-500">Type at least 2 characters to search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════
            STATS TAB
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'stats' && (
          <div className="space-y-5">
            {!stats ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <ThreeBodyLoader size={40} color="#8b5cf6" />
                <span className="text-sm text-slate-500">Loading statistics...</span>
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
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">Semantic Embeddings — Z.AI embedding-3</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Hybrid retrieval (BM25 + cosine similarity) for better recall on paraphrased queries.
                        </p>
                      </div>
                    </div>
                    <div className="p-5">
                      {stats.embeddingsCoverage && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Coverage</span>
                            <span className="font-medium text-white">
                              {stats.embeddingsCoverage.cached} / {stats.embeddingsCoverage.total} chunks (
                              {stats.embeddingsCoverage.total > 0
                                ? Math.round((stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100)
                                : 0}
                              %)
                            </span>
                          </div>
                          {/* Progress bar with glow */}
                          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full transition-all duration-700 relative"
                              style={{
                                width: `${
                                  stats.embeddingsCoverage.total > 0
                                    ? (stats.embeddingsCoverage.cached / stats.embeddingsCoverage.total) * 100
                                    : 0
                                }%`,
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-violet-400 to-fuchsia-400 rounded-full animate-pulse opacity-50" />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pt-1">
                            <button
                              onClick={() => void precomputeEmbeddings()}
                              disabled={precomputing}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-500/15 border border-violet-500/30 text-xs font-medium text-violet-300 hover:bg-violet-500/25 hover:border-violet-500/50 transition-all disabled:opacity-50"
                            >
                              {precomputing ? (
                                <ThreeBodyLoader size={12} color="#a78bfa" />
                              ) : (
                                <RefreshCw className="w-3 h-3" />
                              )}
                              {precomputing
                                ? 'Computing...'
                                : stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total
                                  ? 'Pre-compute Missing'
                                  : 'Re-compute All'}
                            </button>
                            {precomputeMsg && (
                              <span className="text-xs text-slate-500">{precomputeMsg}</span>
                            )}
                          </div>
                          {stats.embeddingsCoverage.cached < stats.embeddingsCoverage.total && (
                            <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-lg">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* By Category */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">By Category</h3>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {Object.entries(stats.byCategory).map(([cat, count]) => {
                        const meta = CATEGORY_META[cat];
                        const Icon = meta?.icon || FileText;
                        return (
                          <div key={cat} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                            <span className="flex items-center gap-2.5 text-sm text-slate-300">
                              <span className={`p-1 rounded ${meta?.bgGlow || 'bg-white/5'}`}>
                                <Icon className={`w-3.5 h-3.5 ${meta?.color || 'text-slate-500'}`} />
                              </span>
                              {meta?.label || cat}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-white/5 text-slate-400 rounded-full">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* By Grade */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-white/5">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">By Grade</h3>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {Object.entries(stats.byGrade).map(([grade, count]) => {
                        const style = GRADE_STYLES[grade];
                        return (
                          <div key={grade} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${style?.bg || ''} ${style?.text || 'text-slate-400'} border ${style?.border || 'border-white/10'}`}>
                              Grade {grade}
                            </span>
                            <span className="text-sm font-medium text-slate-300">{count} docs</span>
                          </div>
                        );
                      })}
                      {Object.keys(stats.byGrade).length === 0 && (
                        <p className="text-sm text-slate-600 px-3 py-2">No grades recorded.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Freshness */}
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Freshness Distribution</h3>
                  </div>
                  <div className="p-5 grid grid-cols-3 gap-4">
                    <div className="text-center p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="text-3xl font-bold text-emerald-400">{stats.freshness.fresh}</div>
                      <div className="text-[11px] text-emerald-500/80 mt-1.5 font-medium">Fresh (≤90 days)</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                      <div className="text-3xl font-bold text-amber-400">{stats.freshness.stale}</div>
                      <div className="text-[11px] text-amber-500/80 mt-1.5 font-medium">Stale (90–180 days)</div>
                    </div>
                    <div className="text-center p-5 rounded-xl bg-red-500/5 border border-red-500/10">
                      <div className="text-3xl font-bold text-red-400">{stats.freshness.very_stale}</div>
                      <div className="text-[11px] text-red-500/80 mt-1.5 font-medium">Very Stale (180+ days)</div>
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
          <div className="space-y-5">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Echo Monthly Gap Report</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Generated by the Echo agent. Identifies coverage, quality, usage, and freshness gaps.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void regenerateGapReport()}
                  disabled={generatingGap}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-xs font-medium text-amber-300 hover:bg-amber-500/25 hover:border-amber-500/50 transition-all disabled:opacity-50"
                >
                  {generatingGap ? (
                    <ThreeBodyLoader size={12} color="#fbbf24" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Regenerate
                </button>
              </div>
              <div className="p-5">
                {gapReport?.result && (
                  <>
                    <div className="grid grid-cols-5 gap-3 mb-6">
                      <GapStat label="Industries Missing" value={gapReport.result.coverageGaps.industriesMissing.length} color="text-blue-400" bg="bg-blue-500/5" border="border-blue-500/10" />
                      <GapStat label="Regions Missing" value={gapReport.result.coverageGaps.regionsMissing.length} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/10" />
                      <GapStat label="Playbooks Missing" value={gapReport.result.coverageGaps.playbooksMissing.length} color="text-violet-400" bg="bg-violet-500/5" border="border-violet-500/10" />
                      <GapStat label="Quality Gaps" value={gapReport.result.qualityGaps.length} color="text-amber-400" bg="bg-amber-500/5" border="border-amber-500/10" />
                      <GapStat label="Freshness Gaps" value={gapReport.result.freshnessGaps.length} color="text-red-400" bg="bg-red-500/5" border="border-red-500/10" />
                    </div>

                    {gapReport.result.recommendations && (
                      <div className="space-y-5">
                        {gapReport.result.recommendations.newDocsToAuthor.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-violet-400" />
                              New Docs to Author
                            </h4>
                            <div className="space-y-1.5">
                              {gapReport.result.recommendations.newDocsToAuthor.map((rec, i) => (
                                <div key={i} className="text-xs text-slate-300 bg-white/[0.03] border border-white/5 px-3.5 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                                  {rec}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {gapReport.result.recommendations.existingDocsToRefresh.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 text-emerald-400" />
                              Existing Docs to Refresh
                            </h4>
                            <div className="space-y-1.5">
                              {gapReport.result.recommendations.existingDocsToRefresh.slice(0, 10).map((rec, i) => (
                                <div key={i} className="text-xs text-slate-300 bg-white/[0.03] border border-white/5 px-3.5 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors">
                                  {rec}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {!gapReport && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <ThreeBodyLoader size={32} color="#f59e0b" />
                    <span className="text-sm text-slate-500">Loading gap report...</span>
                  </div>
                )}
              </div>
            </div>

            {gapReport?.content && (
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/5 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-white">Full Report — {gapReport.reportMonth}</span>
                  <span className="text-[10px] text-slate-600 font-mono ml-2">{gapReport.reportPath}</span>
                </div>
                <div className="p-5">
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
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
// Premium Sub-components
// ============================================================

/** Stat card with gradient glow */
function StatCard({ icon: Icon, label, value, gradient }: { icon: typeof FileText; label: string; value: number | string; gradient: string }) {
  return (
    <div className="group rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm overflow-hidden hover:border-white/10 transition-all duration-300">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">{label}</div>
            <div className="text-2xl font-bold text-white mt-0.5">{value}</div>
          </div>
        </div>
      </div>
      <div className={`h-0.5 bg-gradient-to-r ${gradient} opacity-40 group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}

/** Gap stat with colored border accent */
function GapStat({ label, value, color, bg, border }: { label: string; value: number; color: string; bg: string; border: string }) {
  return (
    <div className={`text-center p-4 rounded-xl ${bg} border ${border} transition-all hover:scale-105`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-slate-500 mt-1 font-medium">{label}</div>
    </div>
  );
}

// ============================================================
// uiverse.io-Inspired Components
// ============================================================

/**
 * Three-Body Spin Loader
 * Inspired by: https://uiverse.io/dovatgabriel/tidy-walrus-92
 *
 * Three dots in triangular configuration that rotate while
 * each independently wobbles. Pure CSS, no JS.
 */
function ThreeBodyLoader({ size = 35, color = '#8b5cf6', className = '' }: { size?: number; color?: string; className?: string }) {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <style>{`
        @keyframes threeBodySpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes threeBodyWobble1 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(-66%) scale(0.65); opacity: 0.8; }
        }
        @keyframes threeBodyWobble2 {
          0%, 100% { transform: translateY(0%) scale(1); opacity: 1; }
          50% { transform: translateY(66%) scale(0.65); opacity: 0.8; }
        }
      `}</style>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        animation: 'threeBodySpin 2s infinite linear',
      }}>
        {/* Dot 1: top-left */}
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
            animation: 'threeBodyWobble1 0.8s infinite ease-in-out',
            animationDelay: '-0.24s',
          }} />
        </div>
        {/* Dot 2: top-right */}
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
            animation: 'threeBodyWobble1 0.8s infinite ease-in-out',
            animationDelay: '-0.12s',
          }} />
        </div>
        {/* Dot 3: bottom center */}
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
            animation: 'threeBodyWobble2 0.8s infinite ease-in-out',
          }} />
        </div>
      </div>
    </div>
  );
}

/**
 * SVG Path-Tracing Loader
 * Inspired by: https://uiverse.io/mobinkakei/proud-ladybug-46
 *
 * A circle outline drawn with dashed stroke, with a small
 * dot tracing the perimeter using stroke-dashoffset animation.
 */
function PathTraceLoader({ size = 44, color = '#8b5cf6' }: { size?: number; color?: string }) {
  const pathColor = `${color}33`; // 20% opacity
  return (
    <div className="inline-block" style={{ width: size, height: size, position: 'relative' }}>
      <style>{`
        @keyframes pathCircleTrace {
          25% { stroke-dashoffset: 125; }
          50% { stroke-dashoffset: 175; }
          75% { stroke-dashoffset: 225; }
          100% { stroke-dashoffset: 275; }
        }
        @keyframes dotCircleTrace {
          0% { transform: translate(-18px, -18px); }
          25% { transform: translate(0, -18px); }
          50% { transform: translate(0, 0); }
          75% { transform: translate(-18px, 0); }
          100% { transform: translate(-18px, -18px); }
        }
      `}</style>
      {/* Tracing dot */}
      <div style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        position: 'absolute',
        background: color,
        top: '50%',
        left: '50%',
        transform: 'translate(-18px, -18px)',
        animation: 'dotCircleTrace 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite',
        boxShadow: `0 0 8px ${color}`,
      }} />
      {/* SVG circle path */}
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
          style={{ animation: 'pathCircleTrace 3s cubic-bezier(0.785, 0.135, 0.15, 0.86) infinite' }}
        />
      </svg>
    </div>
  );
}

/**
 * Isometric 3D Cube Decoration
 * Inspired by: https://uiverse.io/csemszepp/tiny-firefox-14
 *
 * Three isometric cubes made of CSS pseudo-element tiles.
 * Each tile has top and left faces for 3D effect.
 * On hover, individual tiles glow. The whole assembly
 * has a subtle hue-rotate animation.
 */
function IsometricCubes() {
  return (
    <div className="isometric-cubes">
      <style>{`
        @keyframes isoHueRotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .isometric-cubes {
          position: relative;
          transform: skewY(-20deg);
          animation: isoHueRotate 8s linear infinite;
        }
        .iso-cube {
          position: relative;
        }
        .iso-cube:nth-child(2) {
          z-index: 1;
          translate: -60px -60px;
        }
        .iso-cube:nth-child(3) {
          z-index: 3;
          translate: 60px 60px;
        }
        .iso-col {
          position: absolute;
          display: flex;
          flex-direction: column;
          gap: 30px;
          translate: calc(-70px * var(--x)) calc(-60px * var(--y));
        }
        .iso-tile {
          position: relative;
          display: inline-block;
          width: 40px;
          height: 40px;
          background: rgba(139, 92, 246, 0.15);
          border: 1px solid rgba(139, 92, 246, 0.1);
          z-index: calc(1 * var(--i));
          transition: 1.5s;
        }
        .iso-tile:hover {
          transition: 0s;
          background: rgba(139, 92, 246, 0.6);
          filter: drop-shadow(0 0 20px rgba(139, 92, 246, 0.5));
        }
        .iso-tile:hover::before,
        .iso-tile:hover::after {
          transition: 0s;
          background: rgba(139, 92, 246, 0.5);
        }
        .iso-tile::before {
          content: '';
          position: absolute;
          left: -32px;
          width: 32px;
          height: 100%;
          background: rgba(139, 92, 246, 0.08);
          border: 1px solid rgba(139, 92, 246, 0.05);
          transform-origin: right;
          transform: skewY(45deg);
          transition: 1.5s;
        }
        .iso-tile::after {
          content: '';
          position: absolute;
          top: -32px;
          left: 0px;
          width: 100%;
          height: 32px;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.05);
          transform-origin: bottom;
          transform: skewX(45deg);
          transition: 1.5s;
        }
      `}</style>
      {[0, 1, 2].map((cubeIdx) => (
        <div key={cubeIdx} className="iso-cube">
          {[-1, 0, 1].map((x) => (
            <div key={x} className="iso-col" style={{ '--x': x, '--y': 0 } as React.CSSProperties}>
              {[3, 2, 1].map((i) => (
                <span key={i} className="iso-tile" style={{ '--i': i } as React.CSSProperties} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
