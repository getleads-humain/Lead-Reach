'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Calendar,
  Share2,
  ChevronUp,
  BookOpen,
  Sparkles,
  Mail,
  Tag,
  CheckCircle2,
  Quote,
  ImageIcon,
  List,
  ExternalLink,
} from 'lucide-react';
import {
  getBlogPostBySlug,
  getRelatedPosts,
  CATEGORY_COLORS,
  BLOG_POSTS,
  type BlogPostSection,
  type BlogPost,
} from '@/lib/blog-data';

// ─── Reading Progress Bar ────────────────────────────────────────
function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const readProgress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setProgress(Math.min(readProgress, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] h-1 bg-border/20">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ─── Scroll to Top Button ────────────────────────────────────────
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
      aria-label="Scroll to top"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}

// ─── Table of Contents ───────────────────────────────────────────
function TableOfContents({ sections }: { sections: BlogPostSection[] }) {
  const [activeId, setActiveId] = useState('');

  const headings = useMemo(
    () => sections.filter((s) => s.type === 'h2').map((s) => s.content),
    [sections]
  );

  const headingIds = useMemo(
    () => headings.map((h) => h.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')),
    [headings]
  );

  useEffect(() => {
    const handleScroll = () => {
      for (let i = headingIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(headingIds[i]);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120) {
            setActiveId(headingIds[i]);
            return;
          }
        }
      }
      setActiveId(headingIds[0] || '');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headingIds]);

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1">
      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <List className="h-3.5 w-3.5 text-emerald-400" />
        Table of Contents
      </h4>
      {headings.map((heading, i) => {
        const id = headingIds[i];
        const isActive = activeId === id;
        return (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`block w-full text-left text-xs py-1.5 px-3 rounded-md transition-all duration-200 ${
              isActive
                ? 'text-emerald-400 bg-emerald-500/10 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
            }`}
          >
            {heading}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Section Renderer ────────────────────────────────────────────
function SectionRenderer({ section, index }: { section: BlogPostSection; index: number }) {
  switch (section.type) {
    case 'h2': {
      const id = section.content.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      return (
        <h2
          id={id}
          className="text-2xl font-bold text-foreground mt-12 mb-4 scroll-mt-24 flex items-center gap-3"
        >
          <span className="text-emerald-400 text-lg font-mono">0{index + 1}</span>
          {section.content}
        </h2>
      );
    }

    case 'h3':
      return (
        <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">
          {section.content}
        </h3>
      );

    case 'paragraph':
      return (
        <p className="text-muted-foreground leading-relaxed mb-5 text-[15px]">
          {section.content}
        </p>
      );

    case 'list':
      return (
        <ul className="space-y-3 mb-6 ml-1">
          {(section.items || []).map((item, i) => (
            <li key={i} className="flex gap-3 text-muted-foreground text-[15px] leading-relaxed">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'image':
      return (
        <figure className="my-8">
          <div className="relative rounded-xl overflow-hidden border border-border/30">
            <Image
              src={section.src || ''}
              alt={section.alt || ''}
              width={1344}
              height={768}
              className="w-full h-auto"
            />
          </div>
          {section.caption && (
            <figcaption className="text-center text-xs text-muted-foreground mt-3 italic">
              {section.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'quote':
      return (
        <blockquote className="my-8 border-l-4 border-emerald-500/50 pl-6 py-4 bg-emerald-500/5 rounded-r-xl">
          <Quote className="h-6 w-6 text-emerald-400/40 mb-2" />
          <p className="text-foreground italic leading-relaxed text-[15px]">
            {section.content}
          </p>
        </blockquote>
      );

    case 'callout':
      return (
        <div className="my-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-foreground text-[15px] leading-relaxed">
              {section.content}
            </p>
          </div>
        </div>
      );

    case 'code':
      return (
        <pre className="my-6 rounded-xl bg-secondary/80 border border-border/30 p-5 overflow-x-auto">
          <code className="text-sm text-foreground font-mono">{section.content}</code>
        </pre>
      );

    default:
      return null;
  }
}

// ─── Share Buttons ───────────────────────────────────────────────
function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const url = typeof window !== 'undefined' ? `${window.location.origin}/blog/${slug}` : '';
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(url);
  }, [url]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Share on Twitter"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <button
        onClick={copyLink}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        aria-label="Copy link"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Blog Post Page ─────────────────────────────────────────
export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getBlogPostBySlug(slug);
  const relatedPosts = post ? getRelatedPosts(post, 3) : [];

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  // Not found state
  if (!post) {
    return (
      <MarketingLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
          <BookOpen className="h-16 w-16 text-muted-foreground/30 mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3">Article Not Found</h1>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            The blog post you are looking for does not exist or may have been moved.
          </p>
          <Link href="/blog">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </MarketingLayout>
    );
  }

  const wordCount = post.sections.reduce((acc, s) => {
    if (s.type === 'paragraph' || s.type === 'h2' || s.type === 'h3' || s.type === 'quote' || s.type === 'callout') {
      return acc + s.content.split(/\s+/).length;
    }
    if (s.type === 'list' && s.items) {
      return acc + s.items.reduce((a, item) => a + item.split(/\s+/).length, 0);
    }
    return acc;
  }, 0);

  return (
    <MarketingLayout>
      <ReadingProgressBar />
      <ScrollToTopButton />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12 border-b border-border/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
            <Link href="/blog" className="hover:text-emerald-400 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-foreground">{post.category}</span>
          </div>

          {/* Category Badge */}
          <Badge variant="outline" className={`mb-4 ${CATEGORY_COLORS[post.category] || ''}`}>
            {post.category}
          </Badge>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-6">
            {post.title}
          </h1>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <User className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <span className="text-foreground font-medium">{post.author}</span>
                <span className="text-muted-foreground"> · {post.authorRole}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.date}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readTime}
            </div>
            <span className="text-muted-foreground/60">
              {wordCount.toLocaleString()} words
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] border-border/30 text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Share */}
          <ShareButtons title={post.title} slug={post.slug} />
        </div>
      </section>

      {/* Hero Image */}
      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden border border-border/30">
            <Image
              src={post.heroImage}
              alt={post.title}
              width={1344}
              height={768}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* Content Area */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar (Desktop) */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <TableOfContents sections={post.sections} />

                {/* Share Sidebar */}
                <Card className="border-border/30 bg-card/50">
                  <CardContent className="p-4">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Share this article</h4>
                    <ShareButtons title={post.title} slug={post.slug} />
                  </CardContent>
                </Card>

                {/* CTA Sidebar */}
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <Sparkles className="h-5 w-5 text-emerald-400 mb-2" />
                    <h4 className="text-sm font-semibold text-foreground mb-1">Try LeadReach AI</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      AI agents that discover, qualify, and engage leads on autopilot.
                    </p>
                    <Link href="/app">
                      <Button size="sm" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs">
                        Start Free Trial
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 max-w-none">
              <article className="prose-custom">
                {post.sections.map((section, index) => (
                  <SectionRenderer key={index} section={section} index={index} />
                ))}
              </article>

              {/* Author Bio */}
              <div className="mt-12 pt-8 border-t border-border/20">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-foreground font-semibold">{post.author}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{post.authorRole} at LeadReach AI</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {post.author === 'Sarah Chen' && 'Sarah leads product strategy at LeadReach AI, focusing on how AI agents can transform B2B sales workflows. She has over 12 years of experience in SaaS product management.'}
                      {post.author === 'Marcus Rodriguez' && 'Marcus heads growth at LeadReach AI, where he applies multi-channel strategies to scale the company\'s own pipeline. He previously led growth teams at two successful B2B startups.'}
                      {post.author === 'Aisha Patel' && 'Aisha is the CEO and co-founder of LeadReach AI. She founded the company after experiencing the pain of manual prospecting firsthand as a sales leader at a high-growth SaaS company.'}
                      {post.author === 'James Kim' && 'James is the CTO and co-founder of LeadReach AI. He architected the multi-agent system and Agent-Reach technology that powers the platform. Previously, he was a principal engineer at a major cloud provider.'}
                      {post.author === 'Elena Torres' && 'Elena leads the data science team at LeadReach AI, responsible for the AI scoring models and predictive analytics that power lead qualification. She holds a PhD in Machine Learning.'}
                      {post.author === 'David Park' && 'David leads customer success at LeadReach AI, helping teams get the most out of AI-powered lead generation. He has onboarded over 200 B2B sales teams onto the platform.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Share */}
              <div className="mt-8 pt-6 border-t border-border/20 lg:hidden">
                <ShareButtons title={post.title} slug={post.slug} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-12 border-t border-border/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.id} href={`/blog/${related.slug}`}>
                  <Card className="card-premium border-border/30 bg-card/50 group cursor-pointer h-full">
                    <div className={`h-36 rounded-t-xl bg-gradient-to-br ${related.gradient} flex items-center justify-center overflow-hidden`}>
                      <Image
                        src={related.heroImage}
                        alt={related.title}
                        width={600}
                        height={340}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <CardContent className="p-5">
                      <Badge variant="outline" className={`text-[10px] mb-2 ${CATEGORY_COLORS[related.category] || ''}`}>
                        {related.category}
                      </Badge>
                      <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                        {related.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {related.readTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {related.date}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts Navigation */}
      <section className="py-12 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-foreground mb-6">More from LeadReach AI Blog</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BLOG_POSTS.filter(p => p.id !== post.id).slice(0, 6).map((p) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="group">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                    <Image
                      src={p.heroImage}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {p.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{p.date} · {p.readTime}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link href="/blog">
              <Button variant="outline" className="border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View All Articles
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 border-t border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 text-center overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[80px]" />
            <div className="relative">
              <Sparkles className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Ready to put AI agents to <span className="text-gradient">work</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Start discovering, qualifying, and engaging your ideal customers with 8 autonomous AI agents. Free trial, no credit card required.
              </p>
              <div className="mt-6">
                <Link href="/app">
                  <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 border-t border-border/20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
          <Mail className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Stay in the loop</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Get the latest insights on AI-powered lead generation delivered to your inbox every week.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You are subscribed!</span>
            </div>
          ) : (
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg bg-secondary/50 border border-border/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-500/30"
              />
              <Button
                onClick={() => { if (email.includes('@')) setSubscribed(true); }}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
              >
                Subscribe
              </Button>
            </div>
          )}
        </div>
      </section>
    </MarketingLayout>
  );
}
