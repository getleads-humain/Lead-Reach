'use client';

/**
 * Token Registry — Platform Tokenization Viewer
 * ==============================================
 * Displays every tokenized aspect of the LeadReach platform:
 * API routes, components, pages, models, agents, features, blog posts,
 * FAQs, lib modules, and business concepts.
 *
 * Features:
 *   - Category filter (api, component, page, model, agent, feature, blog, faq, lib, business)
 *   - Full-text search across tokenKey, name, description
 *   - Status filter (active, deprecated, removed, planned)
 *   - Owner filter
 *   - Pagination
 *   - Per-token: version, last scanned, last modified, audit count
 *   - Expandable details with file path, route, dependencies, tags
 *   - Stats summary (total tokens, by category, by status, by owner)
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Boxes,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Code2,
  Database,
  Bot,
  Zap,
  Globe,
  BookOpen,
  HelpCircle,
  Library,
  Building2,
  Settings,
  CheckCircle2,
  Loader2,
  Tag,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface Token {
  id: string;
  tokenKey: string;
  name: string;
  category: string;
  subcategory: string | null;
  description: string | null;
  filePath: string | null;
  route: string | null;
  prismaModel: string | null;
  tags: string | null;
  version: number;
  status: string;
  lastScannedAt: string | null;
  lastModifiedAt: string | null;
  modifiedBy: string | null;
  businessValue: string | null;
  owner: string | null;
  priority: string;
  updatedAt: string;
  _count?: { audits: number };
}

interface TokenStats {
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  api: Code2,
  component: Boxes,
  page: Globe,
  model: Database,
  agent: Bot,
  feature: Zap,
  blog: BookOpen,
  faq: HelpCircle,
  lib: Library,
  business: Building2,
  config: Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  api: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
  component: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
  page: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
  model: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  agent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  feature: 'text-pink-400 border-pink-500/20 bg-pink-500/5',
  blog: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
  faq: 'text-teal-400 border-teal-500/20 bg-teal-500/5',
  lib: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
  business: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
  config: 'text-zinc-400 border-zinc-500/20 bg-zinc-500/5',
};


const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400',
  deprecated: 'text-amber-400',
  removed: 'text-red-400',
  planned: 'text-blue-400',
};

function formatTime(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export function TokenRegistry() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Record<string, number>>({});

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '50');
    params.set('page', String(page));
    if (activeCategory !== 'all') params.set('category', activeCategory);
    if (activeStatus !== 'all') params.set('status', activeStatus);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/tokens?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch tokens');
      const data = await res.json();
      setTokens(data.tokens || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setCategoryBreakdown(data.categoryBreakdown || {});
    } catch (err) {
      console.error('[TokenRegistry] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, activeStatus, search]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, activeStatus, search]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan' }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTokens();
      }
    } catch (err) {
      console.error('[TokenRegistry] Scan error:', err);
    } finally {
      setScanning(false);
    }
  };

  const categories = Object.keys(categoryBreakdown).sort();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-400" />
            Token Registry
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {total} tokens across {categories.length} categories — every aspect of the platform tracked, versioned, and auditable
          </p>
        </div>
        <Button
          onClick={handleScan}
          disabled={scanning}
          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Scan Codebase
            </>
          )}
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-foreground">{total}</p>
                <p className="text-[10px] text-muted-foreground">Total Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-lg font-bold text-foreground">{categories.length}</p>
                <p className="text-[10px] text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {tokens.filter(t => t.status === 'active').length}
                </p>
                <p className="text-[10px] text-muted-foreground">Active (page)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/30">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-400" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  {tokens.reduce((s, t) => s + t.version, 0)}
                </p>
                <p className="text-[10px] text-muted-foreground">Total Versions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('all')}
          className={activeCategory === 'all' ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold' : 'border-border/40 text-muted-foreground hover:text-foreground'}
        >
          All ({total})
        </Button>
        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat] || Boxes;
          const count = categoryBreakdown[cat] || 0;
          const isActive = activeCategory === cat;
          return (
            <Button
              key={cat}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(isActive ? 'all' : cat)}
              className={isActive ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold gap-1.5' : 'border-border/40 text-muted-foreground hover:text-foreground gap-1.5'}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat}
              <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">{count}</Badge>
            </Button>
          );
        })}
      </div>

      {/* Search + Status Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens by key, name, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card/50 border-border/30"
          />
        </div>
        <select
          value={activeStatus}
          onChange={(e) => setActiveStatus(e.target.value)}
          className="bg-card border border-border/30 rounded-md px-3 py-2 text-sm text-foreground"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="deprecated">Deprecated</option>
          <option value="planned">Planned</option>
          <option value="removed">Removed</option>
        </select>
      </div>

      {/* Token List */}
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Boxes className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No tokens found</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Click "Scan Codebase" to tokenize the platform</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-border/20">
                {tokens.map((token) => {
                  const Icon = CATEGORY_ICONS[token.category] || Boxes;
                  const catColor = CATEGORY_COLORS[token.category] || 'text-muted-foreground border-border bg-secondary/5';
                  const isExpanded = expandedId === token.id;
                  const tags = token.tags ? (() => { try { return JSON.parse(token.tags); } catch { return []; } })() : [];

                  return (
                    <div key={token.id} className="hover:bg-secondary/10 transition-colors">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : token.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${catColor} shrink-0`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground truncate">{token.name}</span>
                            <Badge variant="outline" className={`text-[9px] ${catColor} shrink-0`}>
                              {token.category}
                            </Badge>
                            {token.priority === 'critical' && (
                              <Badge variant="outline" className="text-[9px] border-red-500/20 text-red-400 bg-red-500/5 shrink-0">
                                critical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5 font-mono">
                            {token.tokenKey}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className={`text-[10px] ${STATUS_COLORS[token.status] || 'text-muted-foreground'}`}>
                              {token.status}
                            </span>
                            <p className="text-[9px] text-muted-foreground">v{token.version}</p>
                          </div>
                          {token._count?.audits && token._count.audits > 0 ? (
                            <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                              {token._count.audits} audits
                            </Badge>
                          ) : null}
                          <div className="text-right">
                            <span className="text-[9px] text-muted-foreground block">
                              {formatTime(token.lastScannedAt)}
                            </span>
                            <span className="text-[9px] text-muted-foreground/50">scanned</span>
                          </div>
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 bg-secondary/5">
                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {token.description && (
                              <div className="sm:col-span-2">
                                <span className="text-muted-foreground">Description: </span>
                                <span className="text-foreground/80">{token.description}</span>
                              </div>
                            )}
                            {token.filePath && (
                              <div>
                                <span className="text-muted-foreground">File: </span>
                                <code className="text-foreground/70 font-mono text-[10px]">{token.filePath}</code>
                              </div>
                            )}
                            {token.route && (
                              <div>
                                <span className="text-muted-foreground">Route: </span>
                                <code className="text-foreground/70 font-mono text-[10px]">{token.route}</code>
                              </div>
                            )}
                            {token.prismaModel && (
                              <div>
                                <span className="text-muted-foreground">Prisma Model: </span>
                                <code className="text-foreground/70 font-mono text-[10px]">{token.prismaModel}</code>
                              </div>
                            )}
                            {token.owner && (
                              <div>
                                <span className="text-muted-foreground">Owner: </span>
                                <span className="text-foreground/70">{token.owner}</span>
                              </div>
                            )}
                            {token.businessValue && (
                              <div>
                                <span className="text-muted-foreground">Business Value: </span>
                                <span className="text-foreground/70">{token.businessValue}</span>
                              </div>
                            )}
                            {token.modifiedBy && (
                              <div>
                                <span className="text-muted-foreground">Modified By: </span>
                                <span className="text-foreground/70">{token.modifiedBy}</span>
                              </div>
                            )}
                            {token.lastModifiedAt && (
                              <div>
                                <span className="text-muted-foreground">Last Modified: </span>
                                <span className="text-foreground/70">{formatTime(token.lastModifiedAt)}</span>
                              </div>
                            )}
                            {tags.length > 0 && (
                              <div className="sm:col-span-2">
                                <span className="text-muted-foreground">Tags: </span>
                                <div className="inline-flex flex-wrap gap-1 mt-1">
                                  {tags.map((tag: string) => (
                                    <Badge key={tag} variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="border-border/30 text-muted-foreground"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-border/30 text-muted-foreground"
          >
            Prev
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-border/30 text-muted-foreground"
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className="border-border/30 text-muted-foreground"
          >
            Last
          </Button>
        </div>
      )}
    </div>
  );
}
