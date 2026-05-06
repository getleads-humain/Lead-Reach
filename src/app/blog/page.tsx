'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

type BlogCategory = 'All' | 'AI Agents' | 'Lead Generation' | 'Sales Intelligence' | 'Tutorials';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: BlogCategory;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  gradient: string;
}

const CATEGORIES: BlogCategory[] = ['All', 'AI Agents', 'Lead Generation', 'Sales Intelligence', 'Tutorials'];

const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'How Autonomous AI Agents Are Revolutionizing B2B Lead Generation',
    excerpt: 'Discover how multi-agent systems are replacing traditional SDR teams with always-on, intelligent lead research and outreach that scales without limits.',
    category: 'AI Agents',
    date: 'Jan 15, 2026',
    readTime: '8 min read',
    author: 'Sarah Chen',
    authorRole: 'VP of Product',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
  },
  {
    id: '2',
    title: 'The Complete Guide to Multi-Channel Lead Research in 2026',
    excerpt: 'Learn why the most successful sales teams research prospects across LinkedIn, GitHub, Twitter, Reddit, and 13+ other channels simultaneously.',
    category: 'Lead Generation',
    date: 'Jan 12, 2026',
    readTime: '12 min read',
    author: 'Marcus Rodriguez',
    authorRole: 'Head of Growth',
    gradient: 'from-violet-500/20 to-pink-500/20',
  },
  {
    id: '3',
    title: 'Building an Ideal Customer Profile That AI Agents Actually Use',
    excerpt: 'Your ICP is only as good as how well your AI agents can interpret it. Here is how to define criteria that machines and humans both understand.',
    category: 'Lead Generation',
    date: 'Jan 8, 2026',
    readTime: '6 min read',
    author: 'Aisha Patel',
    authorRole: 'CEO',
    gradient: 'from-amber-500/20 to-orange-500/20',
  },
  {
    id: '4',
    title: 'Agent-Reach: How We Give AI Agents Internet Access Across 17+ Channels',
    excerpt: 'A deep technical dive into our Agent-Reach architecture that provides zero-config web reading, semantic search, and social media data access.',
    category: 'AI Agents',
    date: 'Jan 5, 2026',
    readTime: '15 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: '5',
    title: 'Lead Scoring in the Age of AI: Moving Beyond Manual Qualification',
    excerpt: 'Manual lead scoring is dead. Learn how AI-driven qualification uses real-time signals, behavioral patterns, and firmographic matching to prioritize leads.',
    category: 'Sales Intelligence',
    date: 'Dec 28, 2025',
    readTime: '7 min read',
    author: 'Elena Torres',
    authorRole: 'Data Science Lead',
    gradient: 'from-rose-500/20 to-red-500/20',
  },
  {
    id: '6',
    title: 'Getting Started with LeadReach AI: A Step-by-Step Tutorial',
    excerpt: 'From signup to your first batch of qualified leads. This comprehensive tutorial walks you through setting up your ICP, deploying agents, and reviewing results.',
    category: 'Tutorials',
    date: 'Dec 22, 2025',
    readTime: '10 min read',
    author: 'David Park',
    authorRole: 'Customer Success',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: '7',
    title: 'Why Personalized Outreach Outperforms Templates by 300%',
    excerpt: 'We analyzed 50,000 outreach messages and found that AI-personalized emails had 3x the reply rate. Here is what makes the difference.',
    category: 'Sales Intelligence',
    date: 'Dec 18, 2025',
    readTime: '9 min read',
    author: 'Sarah Chen',
    authorRole: 'VP of Product',
    gradient: 'from-indigo-500/20 to-violet-500/20',
  },
  {
    id: '8',
    title: 'The Orchestrator Agent: How 8 AI Agents Work Together',
    excerpt: 'Behind the scenes of our multi-agent architecture. Learn how the Orchestrator coordinates discovery, enrichment, qualification, and outreach in perfect harmony.',
    category: 'AI Agents',
    date: 'Dec 14, 2025',
    readTime: '11 min read',
    author: 'James Kim',
    authorRole: 'CTO',
    gradient: 'from-purple-500/20 to-fuchsia-500/20',
  },
  {
    id: '9',
    title: 'Setting Up Automated Follow-Up Sequences That Convert',
    excerpt: 'Most deals are won in the follow-up. Learn how to configure AI-driven sequences that adapt timing, channel, and messaging based on engagement signals.',
    category: 'Tutorials',
    date: 'Dec 10, 2025',
    readTime: '8 min read',
    author: 'David Park',
    authorRole: 'Customer Success',
    gradient: 'from-sky-500/20 to-cyan-500/20',
  },
];

const POPULAR_TAGS = [
  'AI Agents', 'Lead Scoring', 'Outreach', 'B2B Sales', 'Multi-Channel',
  'Automation', 'ICP', 'Data Enrichment', 'Pipeline', 'Agent-Reach',
  'Prospecting', 'Personalization',
];

const CATEGORY_COLORS: Record<string, string> = {
  'AI Agents': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Lead Generation': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Sales Intelligence': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Tutorials': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
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
                  <p className="text-muted-foreground">No articles found matching your criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="card-premium border-border/30 bg-card/50 group cursor-pointer">
                      {/* Gradient Image Placeholder */}
                      <div className={`h-40 rounded-t-xl bg-gradient-to-br ${post.gradient} flex items-center justify-center`}>
                        <BookOpen className="h-8 w-8 text-foreground/20" />
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
                        <div className="mt-3 text-xs text-muted-foreground">
                          {post.date}
                        </div>
                      </CardContent>
                    </Card>
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
                  <div className="space-y-2">
                    <Input
                      placeholder="your@email.com"
                      className="bg-secondary/50 border-border/50 focus:border-emerald-500/30 text-sm"
                    />
                    <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm">
                      Subscribe
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
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
                    <Link href="/faq" className="block text-xs text-muted-foreground hover:text-emerald-400 transition-colors">
                      &rarr; Frequently Asked Questions
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
