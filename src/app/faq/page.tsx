'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  HelpCircle,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Shield,
  Zap,
  CreditCard,
  Plug,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Rocket,
  Database,
  Target,
  Users,
  Bot,
  TrendingUp,
  Building2,
  Settings,
  Globe,
  Layers,
  Clock,
  Star,
  ArrowUpRight,
} from 'lucide-react';
import {
  FAQ_ITEMS,
  FAQ_CATEGORIES,
  type FAQCategory,
} from '@/lib/faq/faq-data-v2';

// ── Category Icons ────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Getting Started': Rocket,
  'AI Workforce': Bot,
  'Campaigns & Discovery': Target,
  'Leads & Enrichment': Users,
  'Pricing & Plans': CreditCard,
  'Security & Compliance': Shield,
  'Integrations': Plug,
  'AI Workforce Command Center': Building2,
  'Data Enrichment': Database,
  'Prospect Discovery': Globe,
  'Industry & Use Cases': TrendingUp,
  'Account & Support': Settings,
};

// ── Component ─────────────────────────────────────────────────────────

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  const [showNewOnly, setShowNewOnly] = useState(false);

  // ── Filter items based on category, search, and badges ──
  const filteredItems = useMemo(() => {
    let items = FAQ_ITEMS;

    // Category filter
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.question.toLowerCase().includes(lower) ||
        item.answer.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
      );
    }

    // Popular filter
    if (showPopularOnly) {
      items = items.filter(item => item.popular);
    }

    // New filter
    if (showNewOnly) {
      items = items.filter(item => item.isNew);
    }

    return items;
  }, [activeCategory, searchQuery, showPopularOnly, showNewOnly]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // ── Reset to page 1 when filters change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery, showPopularOnly, showNewOnly, pageSize]);

  // ── Stats ──
  const totalFAQs = FAQ_ITEMS.length;
  const popularCount = FAQ_ITEMS.filter(f => f.popular).length;
  const newCount = FAQ_ITEMS.filter(f => f.isNew).length;

  // ── Page number rendering (show up to 7 page numbers with ellipsis) ──
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPageSafe > 3) pages.push('...');
      const start = Math.max(2, currentPageSafe - 1);
      const end = Math.min(totalPages - 1, currentPageSafe + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPageSafe < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <MarketingLayout>
      {/* ── Header ── */}
      <section className="relative py-16 lg:py-24 border-b border-border/20 overflow-hidden">
        {/* Futuristic background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[200px] bg-cyan-500/5 rounded-full blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <HelpCircle className="h-3 w-3 mr-1" />
              FAQ · {totalFAQs} Articles
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Everything you need to know about LeadReach AI — from getting started to advanced
              AI workforce configuration. Search, filter by category, or browse all {totalFAQs} articles.
            </p>

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Layers className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{FAQ_CATEGORIES.length}</p>
                  <p className="text-[10px] text-muted-foreground">Categories</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                  <Star className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{popularCount}</p>
                  <p className="text-[10px] text-muted-foreground">Popular</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{newCount}</p>
                  <p className="text-[10px] text-muted-foreground">New</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search & Filters ── */}
      <section className="py-6 border-b border-border/20 sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search all FAQs… (e.g., 'pricing', 'GDPR', 'AI agents', 'enrichment')"
              className="pl-10 h-11 bg-card/50 border-border/30 text-foreground placeholder:text-muted-foreground/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className={
                activeCategory === 'all'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold gap-1.5'
                  : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 gap-1.5'
              }
            >
              <Layers className="h-3.5 w-3.5" />
              All
              <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                {totalFAQs}
              </Badge>
            </Button>
            {FAQ_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || HelpCircle;
              const count = FAQ_ITEMS.filter(f => f.category === cat).length;
              const isActive = activeCategory === cat;
              return (
                <Button
                  key={cat}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(isActive ? 'all' : cat)}
                  className={
                    isActive
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold gap-1.5'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 gap-1.5'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat}
                  <Badge variant="secondary" className="ml-1 text-[9px] h-4 px-1">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>

          {/* Badge filters */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPopularOnly(!showPopularOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-colors ${
                showPopularOnly
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Star className="h-3 w-3" />
              Popular
            </button>
            <button
              onClick={() => setShowNewOnly(!showNewOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] transition-colors ${
                showNewOnly
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-secondary/30 text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              New
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-card border border-border/30 rounded-md px-2 py-1 text-[11px] text-foreground cursor-pointer"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Content ── */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Result count */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{paginatedItems.length}</span> of{' '}
              <span className="text-foreground font-medium">{filteredItems.length}</span> FAQs
              {activeCategory !== 'all' && ` in ${activeCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            {filteredItems.length === 0 && (
              <p className="text-xs text-muted-foreground">No results found</p>
            )}
          </div>

          {/* FAQ accordion */}
          {paginatedItems.length > 0 ? (
            <Accordion type="single" collapsible className="space-y-3">
              {paginatedItems.map((item) => (
                <AccordionItem
                  key={item.id}
                  value={item.id}
                  className="border border-border/30 rounded-xl bg-card/50 px-5 data-[state=open]:border-emerald-500/20 transition-all hover:border-border/50"
                >
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline hover:text-emerald-400 transition-colors py-5 text-left">
                    <div className="flex items-start gap-2">
                      <div className="flex shrink-0 gap-1 mt-0.5">
                        {item.popular && (
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400/30" />
                        )}
                        {item.isNew && (
                          <Sparkles className="h-3 w-3 text-cyan-400" />
                        )}
                      </div>
                      <span>{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground">
                        {item.category}
                      </Badge>
                    </div>
                    <p className="whitespace-pre-wrap">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">No FAQs match your search</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Try a different keyword or clear filters</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                  setShowPopularOnly(false);
                  setShowNewOnly(false);
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}

          {/* ── Premium Futuristic Pagination ── */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center gap-4">
              {/* Page info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  Page <span className="text-foreground font-medium">{currentPageSafe}</span> of{' '}
                  <span className="text-foreground font-medium">{totalPages}</span>
                </span>
                <span className="text-muted-foreground/30">·</span>
                <span>{filteredItems.length} total results</span>
              </div>

              {/* Pagination controls */}
              <div className="flex items-center gap-1">
                {/* First page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPageSafe === 1}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 hover:bg-emerald-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="First page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous page */}
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPageSafe - 1))}
                  disabled={currentPageSafe === 1}
                  className="h-9 px-3 flex items-center justify-center gap-1 rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 hover:bg-emerald-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium"
                  title="Previous page"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                  {getPageNumbers().map((page, i) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-xs">
                          …
                        </span>
                      );
                    }
                    const pageNum = page as number;
                    const isActive = pageNum === currentPageSafe;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`h-9 w-9 flex items-center justify-center rounded-lg font-medium text-xs transition-all ${
                          isActive
                            ? 'bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/20 scale-105'
                            : 'border border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 hover:bg-emerald-500/5'
                        }`}
                        title={`Page ${pageNum}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {/* Next page */}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPageSafe + 1))}
                  disabled={currentPageSafe === totalPages}
                  className="h-9 px-3 flex items-center justify-center gap-1 rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 hover:bg-emerald-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-medium"
                  title="Next page"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>

                {/* Last page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPageSafe === totalPages}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 hover:bg-emerald-500/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Last page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>

              {/* Progress bar showing current position */}
              <div className="w-full max-w-xs">
                <div className="h-1 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                    style={{
                      width: `${(currentPageSafe / totalPages) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Contact CTA ── */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <MessageSquare className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Still have <span className="text-gradient">questions</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Our team is here to help. Start a free trial and experience the platform firsthand,
                or reach out to our support team for personalized answers.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/support">
                  <Button size="lg" variant="outline" className="border-border/50 text-foreground hover:bg-secondary/50">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Contact Support
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}
