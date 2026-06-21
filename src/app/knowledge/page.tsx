'use client';

/**
 * LeadReach — Knowledge Base Admin UI
 * ====================================
 *
 * A standalone admin page for browsing, searching, and managing the
 * LeadReach knowledge base. Provides:
 *
 *   1. Overview — KB stats, semantic status, recent activity
 *   2. Browse — All 42 docs, filterable by category/agent/industry/region
 *   3. Search — Hybrid (TF-IDF + embedding) retrieval with score breakdown
 *   4. Gap Report — Echo agent's monthly knowledge gap analysis
 *   5. Analytics — Top queries, low-relevance, zero-result, top docs
 *   6. Settings — Cache management (reload, prewarm embeddings, clear)
 *
 * Route: /knowledge
 * Access: Internal admin tool (no auth gate yet — add one before prod)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Brain, Search, FileText, AlertTriangle, BarChart3,
  Settings, RefreshCw, Database, Zap, Trash2, Loader2, CheckCircle2, XCircle,
  TrendingUp, TrendingDown, Clock, Hash, Tag, Globe, Factory, MapPin,
  Lightbulb, FileSearch, Sparkles, Activity, Cpu, HardDrive, Eye,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// ============================================================
// Types
// ============================================================

interface KBStats {
  totalDocuments: number;
  byCategory: Record<string, number>;
  totalTokens: number;
  totalWords: number;
  indexedAt: number | null;
}

interface KBDocument {
  title: string;
  slug: string;
  category: string;
  tags: string[];
  agents: string[];
  industries?: string[];
  regions?: string[];
  intent_types?: string[];
  priority: number;
  version: number;
  updated: string;
  summary?: string;
  wordCount: number;
  tokenEstimate: number;
  path: string;
  body?: string;
  author?: string;
}

interface SearchResult {
  title: string;
  slug: string;
  category: string;
  score: number;
  matchedOn: string[];
  tokens: number;
  priority: number;
  path: string;
  preview: string;
  semanticScore?: number;
  tfidfScore?: number;
}

interface SemanticStatus {
  ok: boolean;
  ready: boolean;
  apiConfigured: boolean;
  indexedDocCount: number;
  totalDocCount: number;
  cache: {
    cachedCount: number;
    cacheSizeBytes: number;
    updatedAt: string | null;
    cacheFile: string;
    model: string;
    dimension: number;
  };
}

interface AnalyticsSummary {
  totalRetrievals: number;
  distinctQueries: number;
  zeroResultCount: number;
  lowRelevanceCount: number;
  topQueries: Array<{ query: string; count: number; meanScore: number; zeroResultCount: number }>;
  topLowRelevanceQueries: Array<{ query: string; count: number; meanTopScore: number }>;
  topZeroResultQueries: Array<{ query: string; count: number }>;
  topRetrievedDocs: Array<{ slug: string; title: string; count: number }>;
  missingIndustries: Array<{ industry: string; queryCount: number; sampleQueries: string[] }>;
  missingRegions: Array<{ region: string; queryCount: number; sampleQueries: string[] }>;
  earliestTs: string | null;
  latestTs: string | null;
  monthsCovered: string[];
}

interface GapReportFindings {
  outdatedDocs: Array<{ slug: string; title: string; updated: string; daysSinceUpdate: number }>;
  missingIndustries: Array<{ industry: string; queryCount: number; sampleQueries: string[] }>;
  missingRegions: Array<{ region: string; queryCount: number; sampleQueries: string[] }>;
  topLowRelevanceQueries: Array<{ query: string; count: number; meanTopScore: number }>;
  topZeroResultQueries: Array<{ query: string; count: number }>;
  topRetrievedDocs: Array<{ slug: string; title: string; count: number }>;
  recommendations: string[];
}

// ============================================================
// Constants
// ============================================================

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: BookOpen },
  { value: 'domain', label: 'Domain', icon: BookOpen },
  { value: 'industries', label: 'Industries', icon: Factory },
  { value: 'regions', label: 'Regions', icon: MapPin },
  { value: 'agents', label: 'Agents', icon: Cpu },
  { value: 'tools', label: 'Tools', icon: HardDrive },
  { value: 'playbooks', label: 'Playbooks', icon: FileText },
  { value: 'templates', label: 'Templates', icon: FileText },
  { value: 'datasets', label: 'Datasets', icon: Database },
  { value: 'compliance', label: 'Compliance', icon: ShieldIcon },
];

const AGENTS = ['atlas', 'scout', 'forge', 'sage', 'judge', 'bard', 'flow', 'echo'];

const CATEGORY_COLORS: Record<string, string> = {
  domain: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  industries: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  regions: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  agents: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  tools: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  playbooks: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  templates: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  datasets: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  compliance: 'bg-red-500/10 text-red-400 border-red-500/30',
};

function ShieldIcon({ className }: { className?: string }) {
  return <AlertTriangle className={className} />;
}

// ============================================================
// Main Page Component
// ============================================================

export default function KnowledgeAdminPage() {
  const [stats, setStats] = useState<KBStats | null>(null);
  const [docs, setDocs] = useState<KBDocument[]>([]);
  const [semanticStatus, setSemanticStatus] = useState<SemanticStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, listRes, semRes] = await Promise.all([
        fetch('/api/knowledge?action=stats'),
        fetch('/api/knowledge?action=list'),
        fetch('/api/knowledge/semantic'),
      ]);
      const statsData = await statsRes.json();
      const listData = await listRes.json();
      const semData = await semRes.json();
      if (statsData.ok) setStats(statsData.stats);
      if (listData.ok) setDocs(listData.documents);
      if (semData.ok) setSemanticStatus(semData);
    } catch (err) {
      console.error('Failed to load overview:', err);
      toast.error('Failed to load knowledge base overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/30">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight">Knowledge Base Admin</h1>
                <p className="text-xs text-muted-foreground">Internal tool · RAG management & analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <Database className="h-3 w-3" />
              {stats?.totalDocuments ?? '—'} docs
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Brain className="h-3 w-3" />
              {semanticStatus?.ready ? (
                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Semantic ready</>
              ) : (
                <><XCircle className="h-3 w-3 text-amber-500" /> TF-IDF only</>
              )}
            </Badge>
            <Button size="sm" variant="outline" onClick={loadOverview} disabled={loading} className="gap-2">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 lg:w-fit">
            <TabsTrigger value="overview" className="gap-1.5"><Activity className="h-3.5 w-3.5" />Overview</TabsTrigger>
            <TabsTrigger value="browse" className="gap-1.5"><BookOpen className="h-3.5 w-3.5" />Browse</TabsTrigger>
            <TabsTrigger value="search" className="gap-1.5"><Search className="h-3.5 w-3.5" />Search</TabsTrigger>
            <TabsTrigger value="gap-report" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Gap Report</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5"><Settings className="h-3.5 w-3.5" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab stats={stats} docs={docs} semanticStatus={semanticStatus} loading={loading} />
          </TabsContent>

          <TabsContent value="browse">
            <BrowseTab docs={docs} loading={loading} />
          </TabsContent>

          <TabsContent value="search">
            <SearchTab />
          </TabsContent>

          <TabsContent value="gap-report">
            <GapReportTab />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsTab semanticStatus={semanticStatus} onRefresh={loadOverview} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ============================================================
// Tab 1: Overview
// ============================================================

function OverviewTab({
  stats,
  docs,
  semanticStatus,
  loading,
}: {
  stats: KBStats | null;
  docs: KBDocument[];
  semanticStatus: SemanticStatus | null;
  loading: boolean;
}) {
  if (loading && !stats) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load stats.
        </CardContent>
      </Card>
    );
  }

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const recentlyUpdated = [...docs]
    .sort((a, b) => (b.updated > a.updated ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={stats.totalDocuments.toString()}
          subtitle={`${stats.totalWords.toLocaleString()} words`}
          color="text-blue-400"
        />
        <StatCard
          icon={Database}
          label="Total Tokens"
          value={`${(stats.totalTokens / 1000).toFixed(1)}K`}
          subtitle="≈ LLM context budget"
          color="text-emerald-400"
        />
        <StatCard
          icon={BookOpen}
          label="Categories"
          value={Object.keys(stats.byCategory).length.toString()}
          subtitle={`${categoryEntries[0]?.[0] ?? ''}: ${categoryEntries[0]?.[1] ?? 0} docs`}
          color="text-amber-400"
        />
        <StatCard
          icon={Brain}
          label="Semantic Search"
          value={semanticStatus?.ready ? 'Active' : 'TF-IDF'}
          subtitle={semanticStatus?.ready
            ? `${semanticStatus.indexedDocCount}/${semanticStatus.totalDocCount} indexed`
            : 'Embeddings not prewarmed'}
          color={semanticStatus?.ready ? 'text-emerald-400' : 'text-amber-400'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Category breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Documents by Category</CardTitle>
            <CardDescription>Distribution of knowledge across the 9 categories</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryEntries.map(([cat, count]) => {
              const pct = (count / stats.totalDocuments) * 100;
              const Icon = CATEGORIES.find((c) => c.value === cat)?.icon || BookOpen;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium capitalize">{cat}</span>
                    </div>
                    <span className="text-muted-foreground tabular-nums">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Index info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Index Info</CardTitle>
            <CardDescription>Runtime cache metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Indexed at</span>
              <span className="font-mono text-xs">
                {stats.indexedAt ? new Date(stats.indexedAt).toLocaleString() : '—'}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg doc size</span>
              <span className="font-mono text-xs">
                {stats.totalDocuments > 0
                  ? `${Math.round(stats.totalWords / stats.totalDocuments).toLocaleString()} words`
                  : '—'}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Avg tokens/doc</span>
              <span className="font-mono text-xs">
                {stats.totalDocuments > 0
                  ? `${Math.round(stats.totalTokens / stats.totalDocuments).toLocaleString()} tok`
                  : '—'}
              </span>
            </div>
            {semanticStatus?.cache && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Embeddings cache</span>
                  <span className="font-mono text-xs">
                    {semanticStatus.cache.cachedCount} vec · {(semanticStatus.cache.cacheSizeBytes / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Embedding model</span>
                  <span className="font-mono text-xs">{semanticStatus.cache.model}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recently updated */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recently Updated</CardTitle>
          <CardDescription>5 most recently updated documents</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="w-32">Category</TableHead>
                <TableHead className="w-24">Priority</TableHead>
                <TableHead className="w-32">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentlyUpdated.map((doc) => (
                <TableRow key={doc.slug}>
                  <TableCell>
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{doc.slug}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[doc.category] || ''}`}>
                      {doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs tabular-nums">{doc.priority}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{doc.updated}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Tab 2: Browse
// ============================================================

function BrowseTab({ docs, loading }: { docs: KBDocument[]; loading: boolean }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<KBDocument | null>(null);
  const [docBody, setDocBody] = useState<string>('');
  const [loadingDoc, setLoadingDoc] = useState(false);

  const filteredDocs = useMemo(() => {
    return docs.filter((doc) => {
      if (categoryFilter !== 'all' && doc.category !== categoryFilter) return false;
      if (agentFilter !== 'all' && !doc.agents.includes(agentFilter)) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return (
          doc.title.toLowerCase().includes(q) ||
          doc.slug.toLowerCase().includes(q) ||
          doc.tags.some((t) => t.toLowerCase().includes(q)) ||
          (doc.summary || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [docs, categoryFilter, agentFilter, searchFilter]);

  const openDoc = useCallback(async (doc: KBDocument) => {
    setSelectedDoc(doc);
    setDocBody('');
    setLoadingDoc(true);
    try {
      const res = await fetch(`/api/knowledge?action=document&slug=${encodeURIComponent(doc.slug)}`);
      const data = await res.json();
      if (data.ok) {
        setDocBody(data.document.body);
      } else {
        toast.error('Failed to load document body');
      }
    } catch {
      toast.error('Failed to load document');
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  if (loading && docs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Agent</Label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {AGENTS.map((a) => (
                    <SelectItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Search</Label>
              <Input
                placeholder="Filter by title, slug, tag, or summary..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredDocs.length} of {docs.length} documents</span>
            {(categoryFilter !== 'all' || agentFilter !== 'all' || searchFilter) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setCategoryFilter('all'); setAgentFilter('all'); setSearchFilter(''); }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.map((doc) => (
          <Card
            key={doc.slug}
            className="cursor-pointer hover:border-primary/40 hover:bg-accent/30 transition-colors"
            onClick={() => openDoc(doc)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[doc.category] || ''}`}>
                  {doc.category}
                </Badge>
                <span className="text-xs text-muted-foreground tabular-nums">P{doc.priority}</span>
              </div>
              <CardTitle className="text-sm leading-tight line-clamp-2 mt-2">{doc.title}</CardTitle>
              <CardDescription className="text-xs font-mono">{doc.slug}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              {doc.summary && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{doc.summary}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {doc.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {tag}
                  </Badge>
                ))}
                {doc.tags.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{doc.tags.length - 3}</span>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{doc.wordCount.toLocaleString()} words</span>
                <span>updated {doc.updated}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDocs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileSearch className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No documents match your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Document detail dialog */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedDoc && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={CATEGORY_COLORS[selectedDoc.category] || ''}>
                    {selectedDoc.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">Priority {selectedDoc.priority}</Badge>
                  <Badge variant="outline" className="text-xs">v{selectedDoc.version}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{selectedDoc.path}</span>
                </div>
                <DialogTitle className="text-xl">{selectedDoc.title}</DialogTitle>
                <DialogDescription>{selectedDoc.summary}</DialogDescription>
              </DialogHeader>

              {/* Frontmatter chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                {selectedDoc.agents.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-muted-foreground" />
                    {selectedDoc.agents.map((a) => (
                      <Badge key={a} variant="secondary" className="text-[10px]">{a}</Badge>
                    ))}
                  </div>
                )}
                {selectedDoc.industries && selectedDoc.industries.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Factory className="h-3 w-3 text-muted-foreground" />
                    {selectedDoc.industries.slice(0, 4).map((i) => (
                      <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                    ))}
                  </div>
                )}
                {selectedDoc.regions && selectedDoc.regions.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    {selectedDoc.regions.slice(0, 4).map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Body */}
              <ScrollArea className="flex-1 -mx-6 px-6">
                {loadingDoc ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="prose prose-sm prose-invert max-w-none pb-6">
                    <ReactMarkdown>{docBody}</ReactMarkdown>
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Tab 3: Search
// ============================================================

function SearchTab() {
  const [query, setQuery] = useState('');
  const [semantic, setSemantic] = useState(true);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(
        `/api/knowledge?action=search&q=${encodeURIComponent(query)}&semantic=${semantic}&topK=10`,
      );
      const data = await res.json();
      if (data.ok) {
        setResults(data.results);
      } else {
        toast.error(data.error || 'Search failed');
      }
    } catch (err) {
      toast.error('Search request failed');
    } finally {
      setSearching(false);
    }
  }, [query, semantic]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            Knowledge Base Search
          </CardTitle>
          <CardDescription>
            Test retrieval the same way agents do. Hybrid (TF-IDF + embeddings) by default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="e.g. how to prospect SaaS companies in the UK..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()} className="gap-2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Switch checked={semantic} onCheckedChange={setSemantic} id="semantic-toggle" />
              <Label htmlFor="semantic-toggle" className="cursor-pointer flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" />
                Semantic (hybrid TF-IDF + embeddings)
              </Label>
            </div>
            <span className="text-xs text-muted-foreground">
              {hasSearched && `${results.length} result(s)`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.map((r, idx) => (
        <Card key={r.slug} className="overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[r.category] || ''}`}>
                    {r.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">{r.slug}</span>
                </div>
                <CardTitle className="text-sm leading-tight">{r.title}</CardTitle>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold tabular-nums">{(r.score * 100).toFixed(0)}%</div>
                <div className="text-[10px] text-muted-foreground">hybrid score</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3 space-y-2">
            <p className="text-xs text-muted-foreground line-clamp-2">{r.preview}</p>

            {/* Score breakdown */}
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              {r.tfidfScore !== undefined && (
                <Badge variant="secondary" className="font-mono">
                  TF-IDF: {(r.tfidfScore * 100).toFixed(0)}%
                </Badge>
              )}
              {r.semanticScore !== undefined && (
                <Badge variant="secondary" className="font-mono">
                  Semantic: {(r.semanticScore * 100).toFixed(0)}%
                </Badge>
              )}
              <Badge variant="secondary" className="font-mono">
                P{r.priority}
              </Badge>
              <Badge variant="secondary" className="font-mono">
                {r.tokens} tok
              </Badge>
              {r.matchedOn.slice(0, 4).map((m) => (
                <Badge key={m} variant="outline" className="font-mono text-[10px]">{m}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {hasSearched && results.length === 0 && !searching && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <XCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No documents matched. Try a different query or disable semantic search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Tab 4: Gap Report
// ============================================================

function GapReportTab() {
  const [report, setReport] = useState<{ markdown: string; month: string; generatedAt: string; cached: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState<GapReportFindings | null>(null);

  const loadReport = useCallback(async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/gap-report', {
        method: force ? 'POST' : 'GET',
        headers: force ? { 'Content-Type': 'application/json' } : undefined,
        body: force ? JSON.stringify({}) : undefined,
      });
      const data = await res.json();
      if (data.ok) {
        setReport({ markdown: data.markdown, month: data.month, generatedAt: data.generatedAt, cached: data.cached || false });
        setFindings(data.findings || null);
        if (force) toast.success('Gap report regenerated');
      } else {
        toast.error(data.error || 'Failed to load gap report');
      }
    } catch {
      toast.error('Failed to load gap report');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(false);
  }, [loadReport]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Echo Knowledge Gap Report
              </CardTitle>
              <CardDescription>
                Monthly analysis of retrieval quality, missing coverage, and outdated docs.
                Generated by the Echo agent per <code className="text-xs">knowledge/agents/echo.md §9</code>.
              </CardDescription>
            </div>
            <Button onClick={() => loadReport(true)} disabled={loading} variant="default" size="sm" className="gap-2 shrink-0">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
          </div>
        </CardHeader>
        {report && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-3">
              <Badge variant="outline">{report.month}</Badge>
              <span>Generated: {new Date(report.generatedAt).toLocaleString()}</span>
              {report.cached && <Badge variant="secondary">cached</Badge>}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Findings summary cards */}
      {findings && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Clock}
            label="Outdated Docs"
            value={findings.outdatedDocs.length.toString()}
            subtitle="> 6 months old"
            color="text-amber-400"
          />
          <StatCard
            icon={Factory}
            label="Missing Industries"
            value={findings.missingIndustries.length.toString()}
            subtitle="needs new playbooks"
            color="text-rose-400"
          />
          <StatCard
            icon={MapPin}
            label="Missing Regions"
            value={findings.missingRegions.length.toString()}
            subtitle="needs new guides"
            color="text-rose-400"
          />
          <StatCard
            icon={TrendingDown}
            label="Low-Relevance Queries"
            value={findings.topLowRelevanceQueries.length.toString()}
            subtitle="topScore < 30%"
            color="text-orange-400"
          />
        </div>
      )}

      {/* Recommendations */}
      {findings && findings.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {findings.recommendations.map((rec, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="font-bold text-primary tabular-nums shrink-0">{i + 1}.</span>
                <p className="text-muted-foreground" dangerouslySetInnerHTML={{ __html: rec.replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>').replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-xs">$1</code>') }} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full markdown report */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Full Report</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] rounded-md border p-4 bg-muted/30">
              <div className="prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{report.markdown}</ReactMarkdown>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!report && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-3">No gap report generated yet.</p>
            <Button onClick={() => loadReport(true)} variant="default">Generate Now</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================
// Tab 5: Analytics
// ============================================================

function AnalyticsTab() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/analytics?monthsBack=6');
      const data = await res.json();
      if (data.ok) {
        setActive(data.active);
        setAnalytics(data.summary);
      }
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!active || !analytics) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-8 w-8 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Analytics tracking is not active yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Retrieval calls will start being tracked once the knowledge base is queried.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <StatCard icon={Activity} label="Total Retrievals" value={analytics.totalRetrievals.toLocaleString()} subtitle={`over ${analytics.monthsCovered.length} month(s)`} color="text-blue-400" />
        <StatCard icon={Hash} label="Distinct Queries" value={analytics.distinctQueries.toLocaleString()} subtitle="normalized" color="text-emerald-400" />
        <StatCard icon={XCircle} label="Zero Results" value={analytics.zeroResultCount.toLocaleString()} subtitle={`${((analytics.zeroResultCount / Math.max(analytics.totalRetrievals, 1)) * 100).toFixed(1)}% of total`} color="text-rose-400" />
        <StatCard icon={TrendingDown} label="Low Relevance" value={analytics.lowRelevanceCount.toLocaleString()} subtitle="topScore < 30%" color="text-orange-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Top Queries (by frequency)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No query data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="w-16 text-right">Count</TableHead>
                    <TableHead className="w-20 text-right">Avg Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topQueries.slice(0, 10).map((q, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs max-w-md truncate">{q.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{q.count}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs">{(q.meanScore * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Top retrieved docs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Top Retrieved Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topRetrievedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No retrieval data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead className="w-16 text-right">Retrievals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topRetrievedDocs.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-muted-foreground tabular-nums">{i + 1}</TableCell>
                      <TableCell className="font-mono text-xs">{d.slug}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Low relevance queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Top Low-Relevance Queries
            </CardTitle>
            <CardDescription>Queries that returned docs but with low confidence</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topLowRelevanceQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No low-relevance queries.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="w-16 text-right">Count</TableHead>
                    <TableHead className="w-20 text-right">Avg Top</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topLowRelevanceQueries.slice(0, 10).map((q, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs max-w-md truncate">{q.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{q.count}</TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-orange-400">{(q.meanTopScore * 100).toFixed(0)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Zero result queries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Top Zero-Result Queries
            </CardTitle>
            <CardDescription>Queries that returned NO documents — hardest gaps</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topZeroResultQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No zero-result queries.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="w-16 text-right">Count</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topZeroResultQueries.slice(0, 10).map((q, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs max-w-md truncate">{q.query}</TableCell>
                      <TableCell className="text-right tabular-nums">{q.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Missing coverage */}
      {(analytics.missingIndustries.length > 0 || analytics.missingRegions.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {analytics.missingIndustries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Missing Industry Coverage
                </CardTitle>
                <CardDescription>Industries in queries but no doc, or low-quality retrievals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Industry</TableHead>
                      <TableHead className="w-20 text-right">Queries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.missingIndustries.slice(0, 10).map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{m.industry}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.queryCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
          {analytics.missingRegions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Missing Region Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Region</TableHead>
                      <TableHead className="w-20 text-right">Queries</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics.missingRegions.slice(0, 10).map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{m.region}</TableCell>
                        <TableCell className="text-right tabular-nums">{m.queryCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tab 6: Settings
// ============================================================

function SettingsTab({
  semanticStatus,
  onRefresh,
}: {
  semanticStatus: SemanticStatus | null;
  onRefresh: () => void;
}) {
  const [reloading, setReloading] = useState(false);
  const [prewarming, setPrewarming] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleReload = useCallback(async () => {
    setReloading(true);
    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reload' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Cache reloaded: ${data.stats.totalDocuments} docs indexed`);
        onRefresh();
      } else {
        toast.error(data.error || 'Reload failed');
      }
    } catch {
      toast.error('Reload request failed');
    } finally {
      setReloading(false);
    }
  }, [onRefresh]);

  const handlePrewarm = useCallback(async () => {
    setPrewarming(true);
    toast.info('Prewarming embeddings... this takes ~2-3 min for 42 docs');
    try {
      const res = await fetch('/api/knowledge/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prewarm' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        onRefresh();
      } else {
        toast.error(data.error || 'Prewarm failed');
      }
    } catch {
      toast.error('Prewarm request failed');
    } finally {
      setPrewarming(false);
    }
  }, [onRefresh]);

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      const res = await fetch('/api/knowledge/semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Embeddings cache cleared');
        onRefresh();
      } else {
        toast.error(data.error || 'Clear failed');
      }
    } catch {
      toast.error('Clear request failed');
    } finally {
      setClearing(false);
    }
  }, [onRefresh]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Knowledge Base Cache
          </CardTitle>
          <CardDescription>
            Manage the in-memory TF-IDF index. Reload after editing markdown files.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleReload} disabled={reloading} variant="default" className="gap-2">
            {reloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Reload Knowledge Cache
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Semantic Embeddings
          </CardTitle>
          <CardDescription>
            Pre-warm or clear the embeddings cache (Z.AI embedding-3 model, 2048-dim vectors).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {semanticStatus && (
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{semanticStatus.ready ? <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">Ready</Badge> : <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">Not Ready</Badge>}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API configured</span>
                <span>{semanticStatus.apiConfigured ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Indexed docs</span>
                <span className="font-mono">{semanticStatus.indexedDocCount} / {semanticStatus.totalDocCount}</span>
              </div>
              {semanticStatus.cache && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cached vectors</span>
                    <span className="font-mono">{semanticStatus.cache.cachedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache file size</span>
                    <span className="font-mono">{(semanticStatus.cache.cacheSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-mono text-xs">{semanticStatus.cache.updatedAt ? new Date(semanticStatus.cache.updatedAt).toLocaleString() : '—'}</span>
                  </div>
                </>
              )}
            </div>
          )}
          <Separator />
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handlePrewarm} disabled={prewarming} variant="default" className="gap-2">
              {prewarming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Prewarm Embeddings
            </Button>
            <Button onClick={handleClear} disabled={clearing} variant="destructive" className="gap-2">
              {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Clear Cache
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Prewarming embeds all {semanticStatus?.totalDocCount ?? 0} docs via Z.AI's embedding-3 API.
            Takes ~2-3 minutes due to rate limits (1 concurrent, 3.5s interval).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            CLI Tools
          </CardTitle>
          <CardDescription>Admin scripts runnable from the project root</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="font-mono text-xs bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground"># Test the loader</div>
            <div>npx tsx scripts/knowledge/test-loader.ts</div>
          </div>
          <div className="font-mono text-xs bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground"># Run the gap report</div>
            <div>npx tsx scripts/knowledge/run-gap-report.ts --print</div>
          </div>
          <div className="font-mono text-xs bg-muted/50 p-2 rounded">
            <div className="text-muted-foreground"># Test the integration</div>
            <div>npx tsx scripts/knowledge/test-integration.ts</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Shared: Stat Card
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  color = 'text-foreground',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className={`text-2xl font-bold tabular-nums ${color}`}>{value}</div>
        {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}
