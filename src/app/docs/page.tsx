'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  BookOpen,
  ArrowRight,
  Zap,
  Bot,
  Search,
  Database,
  MessageSquare,
  BarChart3,
  Plug,
  Code2,
  Settings,
  Rocket,
  ChevronRight,
  FileText,
  Workflow,
  Target,
  Users,
  Webhook,
  X,
  ArrowLeft,
  Clock,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  DOC_SECTIONS,
  DOC_CONTENT_MAP,
  type DocCategory,
} from '@/lib/docs-content';
import { DocContentRenderer } from '@/components/docs/doc-content-renderer';

const CATEGORY_ICONS: Record<DocCategory, React.ElementType> = {
  'Getting Started': Rocket,
  'AI Agents': Bot,
  'API Reference': Code2,
  'Integrations': Plug,
};

const CARD_ICON_MAP: Record<string, React.ElementType> = {
  Rocket,
  Target,
  Workflow,
  Bot,
  Search,
  Database,
  Users,
  MessageSquare,
  BarChart3,
  Code2,
  Webhook,
  Plug,
  Settings,
};

const CATEGORY_ACCENTS: Record<DocCategory, string> = {
  'Getting Started': '#10B981',
  'AI Agents': '#8B5CF6',
  'API Reference': '#3B82F6',
  'Integrations': '#EC4899',
};

export default function DocsPage() {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('Getting Started');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filteredSections = useMemo(
    () => DOC_SECTIONS.filter((s) => s.category === activeCategory),
    [activeCategory],
  );

  const selectedDoc = selectedSlug ? DOC_CONTENT_MAP[selectedSlug] : null;

  // Lock body scroll when slide-over is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (selectedSlug) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedSlug]);

  // ESC to close
  useEffect(() => {
    if (!selectedSlug) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedSlug(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedSlug]);

  const handleItemClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    const slug = href.replace(/^#/, '');
    setSelectedSlug(slug);
  };

  const accent = CATEGORY_ACCENTS[activeCategory];

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <BookOpen className="h-3 w-3 mr-1" />
              Documentation
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach AI <span className="text-gradient">Documentation</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Everything you need to deploy, configure, and master your AI-powered lead generation workforce. From your first campaign to advanced API integrations — 55 in-depth articles across 4 categories.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/app">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold glow-emerald-sm">
                  <Rocket className="mr-2 h-4 w-4" />
                  Launch Platform
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                  <FileText className="mr-2 h-4 w-4" />
                  View FAQ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="py-8 border-b border-border/20 sticky top-16 z-30 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {(['Getting Started', 'AI Agents', 'API Reference', 'Integrations'] as DocCategory[]).map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = DOC_SECTIONS.filter((s) => s.category === cat).length;
              const itemCount = DOC_SECTIONS
                .filter((s) => s.category === cat)
                .reduce((acc, s) => acc + s.items.length, 0);
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold gap-1.5'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 gap-1.5'
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat}
                  <span className="text-[9px] opacity-60 ml-1">({itemCount})</span>
                </Button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {filteredSections.map((section) => {
              const Icon = CARD_ICON_MAP[section.icon] || BookOpen;
              return (
                <Card key={section.title} className="card-premium border-border/30 bg-card/50 p-6 lg:p-8">
                  <div className="flex items-start gap-4">
                    <div
                      className="rounded-xl p-3 shrink-0"
                      style={{ backgroundColor: `${accent}1A`, color: accent }}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap mb-1">
                        <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                        <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground shrink-0">
                          {section.items.length} articles
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{section.description}</p>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {section.items.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={(e) => handleItemClick(item.href, e)}
                            className="flex items-center justify-between gap-2 text-sm text-muted-foreground hover:text-emerald-400 transition-colors py-2 px-3 rounded-lg hover:bg-emerald-500/5 group cursor-pointer border border-transparent hover:border-emerald-500/20"
                          >
                            <span className="flex items-center gap-2">
                              <ChevronRight className="h-3 w-3 text-emerald-500/50 group-hover:text-emerald-400 transition-colors" />
                              {item.label}
                            </span>
                            <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats / Quick Reference Section */}
      <section className="py-12 border-t border-border/20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-border/30 bg-card/50 p-4 text-center">
              <BookOpen className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">55</p>
              <p className="text-xs text-muted-foreground">Articles</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/50 p-4 text-center">
              <Layers className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">13</p>
              <p className="text-xs text-muted-foreground">Topic Cards</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/50 p-4 text-center">
              <Bot className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">AI Agents</p>
            </div>
            <div className="rounded-lg border border-border/30 bg-card/50 p-4 text-center">
              <Code2 className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">17+</p>
              <p className="text-xs text-muted-foreground">Channels</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Zap className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to <span className="text-gradient">get started</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Deploy your first AI agent in under 10 minutes. No credit card required for the 14-day free trial.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 dark:text-white font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/agent">
                  <Button size="lg" variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                    Explore AI Agents
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide-over panel for doc content */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex"
          role="dialog"
          aria-modal="true"
          aria-labelledby="docs-panel-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
            onClick={() => setSelectedSlug(null)}
          />

          {/* Panel */}
          <div
            className="relative ml-auto h-full w-full sm:w-[680px] lg:w-[820px] bg-background border-l border-border/30 shadow-2xl flex flex-col animate-in slide-in-from-right"
            style={{ maxHeight: '100vh' }}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between gap-2 p-4 border-b border-border/30 bg-card/40">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setSelectedSlug(null)}
                  className="rounded-lg p-1.5 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  aria-label="Back to docs"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Badge variant="outline" className="text-[9px] border-border/30 text-muted-foreground shrink-0">
                  {selectedDoc.category}
                </Badge>
                {selectedDoc.readTime && (
                  <span className="text-[10px] text-muted-foreground/70 hidden sm:flex items-center gap-1 shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {selectedDoc.readTime}
                  </span>
                )}
                {selectedDoc.lastUpdated && (
                  <span className="text-[10px] text-muted-foreground/70 hidden md:flex items-center gap-1 shrink-0">
                    <Calendar className="h-2.5 w-2.5" />
                    {selectedDoc.lastUpdated}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSlug(null)}
                className="rounded-lg p-1.5 hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Panel Content (scrollable) */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-8">
                <DocContentRenderer doc={selectedDoc} accentColor={accent} />
              </div>

              {/* Footer with prev/next */}
              <DocPanelFooter
                currentSlug={selectedDoc.slug}
                accent={accent}
                onNavigate={(slug) => setSelectedSlug(slug)}
              />
            </div>
          </div>
        </div>
      )}
    </MarketingLayout>
  );
}

// Footer that lets the user navigate to the previous/next doc within the
// same category. Improves the "print-ready reference" feel.
function DocPanelFooter({
  currentSlug,
  accent,
  onNavigate,
}: {
  currentSlug: string;
  accent: string;
  onNavigate: (slug: string) => void;
}) {
  // Find the position of the current doc in the global ordered list of docs
  // within the same category as the current doc.
  const currentDoc = DOC_CONTENT_MAP[currentSlug];
  if (!currentDoc) return null;

  // Build a flat ordered list of slugs in the same category, in the same
  // order they appear in DOC_SECTIONS.
  const siblingSlugs: string[] = [];
  for (const section of DOC_SECTIONS) {
    if (section.category !== currentDoc.category) continue;
    for (const item of section.items) {
      const slug = item.href.replace(/^#/, '');
      siblingSlugs.push(slug);
    }
  }
  const idx = siblingSlugs.indexOf(currentSlug);
  const prevSlug = idx > 0 ? siblingSlugs[idx - 1] : null;
  const nextSlug = idx >= 0 && idx < siblingSlugs.length - 1 ? siblingSlugs[idx + 1] : null;

  const prevDoc = prevSlug ? DOC_CONTENT_MAP[prevSlug] : null;
  const nextDoc = nextSlug ? DOC_CONTENT_MAP[nextSlug] : null;

  return (
    <div className="border-t border-border/30 p-6 bg-card/30">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!prevDoc}
          onClick={() => prevDoc && onNavigate(prevDoc.slug)}
          className={`text-left rounded-lg border border-border/30 p-3 transition-colors ${
            prevDoc ? 'hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <p className="text-[10px] text-muted-foreground uppercase mb-0.5 flex items-center gap-1">
            <ArrowLeft className="h-2.5 w-2.5" />
            Previous
          </p>
          <p className="text-xs font-semibold text-foreground truncate">
            {prevDoc ? prevDoc.title : '—'}
          </p>
        </button>
        <button
          type="button"
          disabled={!nextDoc}
          onClick={() => nextDoc && onNavigate(nextDoc.slug)}
          className={`text-right rounded-lg border border-border/30 p-3 transition-colors ${
            nextDoc ? 'hover:border-emerald-500/30 hover:bg-emerald-500/5 cursor-pointer' : 'opacity-40 cursor-not-allowed'
          }`}
        >
          <p className="text-[10px] text-muted-foreground uppercase mb-0.5 flex items-center justify-end gap-1">
            Next
            <ArrowRight className="h-2.5 w-2.5" />
          </p>
          <p className="text-xs font-semibold text-foreground truncate">
            {nextDoc ? nextDoc.title : '—'}
          </p>
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center">
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded"
          style={{ backgroundColor: `${accent}22`, color: accent }}
        >
          {idx + 1} / {siblingSlugs.length} in {currentDoc.category}
        </span>
      </div>
    </div>
  );
}
