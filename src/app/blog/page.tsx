'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MarketingLayout } from '@/components/marketing/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Clock,
  User,
  ArrowRight,
  BookOpen,
  Sparkles,
  Mail,
  Tag,
  Calendar,
} from 'lucide-react';
import {
  BLOG_POSTS_META,
  CATEGORIES,
  POPULAR_TAGS,
  CATEGORY_COLORS,
  type BlogCategory,
} from '@/lib/blog-metadata';

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const filteredPosts = BLOG_POSTS_META.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <MarketingLayout>
      {/* Header */}
      <section className="py-16 lg:py-24 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-4 border-emerald-500/20 text-emerald-400">
              <BookOpen className="h-3 w-3 mr-1" />
              Blog
            </Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              LeadReach AI <span className="text-gradient">Blog</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
              Insights on AI-powered lead generation, sales intelligence, and agentic workflows. Stay ahead of the curve.
            </p>
          </div>
        </div>
      </section>

      {/* Search & Filters */}
      <section className="py-8 border-b border-border/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-secondary/50 border-border/50 focus:border-emerald-500/30"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                  className={
                    activeCategory === cat
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold'
                      : 'border-border/40 text-muted-foreground hover:text-foreground hover:border-emerald-500/20'
                  }
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {filteredPosts.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No articles found matching your criteria.</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-border/40 text-muted-foreground hover:text-foreground"
                    onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    <Link key={post.id} href={`/blog/${post.slug}`} className="group block">
                      <Card className="card-premium border-border/30 bg-card/50 h-full overflow-hidden transition-all duration-300 group-hover:border-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/5">
                        {/* Hero Image */}
                        <div className={`h-40 relative overflow-hidden bg-gradient-to-br ${post.gradient}`}>
                          <Image
                            src={post.heroImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                        </div>
                        <CardContent className="p-5">
                          <Badge variant="outline" className={`text-[10px] mb-3 ${CATEGORY_COLORS[post.category] || ''}`}>
                            {post.category}
                          </Badge>
                          <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {post.readTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {post.author}
                            </div>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{post.date}</span>
                            <span className="text-xs text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              Read more <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Popular Tags */}
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-emerald-400" />
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {POPULAR_TAGS.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[10px] border-border/30 text-muted-foreground hover:text-foreground hover:border-emerald-500/20 cursor-pointer transition-colors"
                        onClick={() => setSearchQuery(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter Signup */}
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-emerald-400" />
                    Newsletter
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Get the latest insights on AI lead generation delivered to your inbox weekly.
                  </p>
                  {subscribed ? (
                    <p className="text-xs text-emerald-400 font-medium">You are subscribed!</p>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-secondary/50 border-border/50 focus:border-emerald-500/30 text-sm"
                      />
                      <Button
                        onClick={() => { if (email.includes('@')) setSubscribed(true); }}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm"
                      >
                        Subscribe
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card className="border-border/30 bg-card/50">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Quick Links</h3>
                  <div className="space-y-2">
                    <Link href="/agent" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Explore AI Agents
                    </Link>
                    <Link href="/platform" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Platform Overview
                    </Link>
                    <Link href="/pricing" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; View Pricing
                    </Link>
                    <Link href="/faq" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Frequently Asked Questions
                    </Link>
                    <Link href="/docs" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Documentation
                    </Link>
                    <Link href="/app" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Launch Platform
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                Want AI-generated leads on <span className="text-gradient">autopilot</span>?
              </h2>
              <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
                Stop spending hours on manual research. Let 8 AI agents discover, enrich, and engage your ideal customers.
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
    </MarketingLayout>
  );
}
