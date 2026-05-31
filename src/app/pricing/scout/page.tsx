'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  Zap,
  Target,
  Users,
  BarChart3,
  ChevronRight,
  Globe,
  Mail,
  TrendingUp,
  Search,
  Radar,
  Compass,
  Send,
  Database,
  Clock,
} from 'lucide-react';

export default function ScoutPlanPage() {
  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/pricing">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              All Plans
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Compass className="h-3 w-3 mr-1" />
            Standard Plan
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Scout <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            For solo founders and small teams starting their outbound journey. Scout transforms your lead generation from manual guesswork into an AI-powered, systematic process that discovers, scores, and reaches out to prospects while you focus on closing deals.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-foreground">$149</span>
            <span className="text-lg text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-emerald-400 mb-8">Or $1,490/year (save 17% — just $124/mo)</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                Start 14-Day Free Trial
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">No credit card required for trial</p>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Scout</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Search className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Solo Founders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Founders who are ready to move beyond free tools and start building a real outbound pipeline. Scout provides the AI agents and research channels to systematically discover prospects, enrich their data, and reach out via email — all without hiring an SDR team.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Radar className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Small Outbound Teams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Two-to-three person teams that need a coordinated outbound system. Scout&apos;s 3 AI agents work together to discover, score, and enrich leads, while your team focuses on the human side — relationship building, calls, and closing. It is like having an AI SDR that never sleeps.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Consultants & Agencies</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Independent consultants and boutique agencies who need consistent lead flow for themselves or their clients. Scout&apos;s 1,000 leads per month and 5 research channels provide enough volume to fill your calendar with qualified meetings across multiple engagements.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Scout</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Zap className="h-5 w-5 text-emerald-400" />,
                title: '3 AI Agents — Orchestrator, Prospect Discovery & Data Enrichment',
                desc: 'Scout adds the Data Enrichment agent to your AI workforce. While the Orchestrator coordinates campaigns and Prospect Discovery finds leads, the enrichment agent automatically fills in firmographic details like revenue estimates, employee counts, technology stacks, and key decision-maker information. Every lead arrives pre-researched, saving you hours of manual investigation.',
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
                title: '1,000 Leads Per Month',
                desc: 'Ten times the volume of Launchpad, Scout delivers up to 1,000 AI-discovered and scored leads per month. For most solo founders and small teams, this volume translates to a consistent pipeline of 50 to 150 qualified conversations per month — enough to fill your calendar and drive meaningful revenue growth without overwhelming your capacity to follow up.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: '5 Research Channels (Web, LinkedIn, Exa, GitHub, Reddit)',
                desc: 'Scout expands your search coverage with two additional channels. GitHub surfaces technology-focused companies and engineering leaders. Reddit captures community discussions, pain points, and intent signals from prospects actively seeking solutions. Combined with web, LinkedIn, and Exa, you get a 360-degree view of your target market.',
              },
              {
                icon: <Database className="h-5 w-5 text-emerald-400" />,
                title: 'Basic Data Enrichment',
                desc: 'Every discovered lead is automatically enriched with essential firmographic data: company size, industry classification, revenue estimates, headquarters location, and key contact information. This enrichment happens in real time, so by the time a lead appears in your dashboard, you already have the context you need to craft a personalized outreach message.',
              },
              {
                icon: <Target className="h-5 w-5 text-emerald-400" />,
                title: 'ICP Builder & Lead Scoring',
                desc: 'Define your Ideal Customer Profile with precision using our guided builder, then let the AI score every lead against your criteria. Scout uses a multi-factor scoring model that evaluates firmographic fit, data completeness, and reachability. Leads are ranked from hot to cold, ensuring you always spend time on the prospects most likely to convert.',
              },
              {
                icon: <Send className="h-5 w-5 text-emerald-400" />,
                title: 'Email Outreach',
                desc: 'Reach out to prospects directly from LeadReach with personalized email sequences. Create templates, customize messages per lead, and schedule sends at optimal times. Track open rates, click-through rates, and reply rates to continuously improve your outreach effectiveness. Scout removes LeadReach branding from your emails for a fully professional experience.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: '1 User Seat & 3 Campaigns',
                desc: 'Scout supports one user with up to 3 simultaneous campaigns. Each campaign can target a different ICP or market segment, letting you test multiple outbound strategies in parallel. Campaign analytics show you which segments, messages, and channels drive the best results.',
              },
              {
                icon: <Clock className="h-5 w-5 text-emerald-400" />,
                title: '14-Day Free Trial + Standard Support',
                desc: 'Try Scout risk-free for 14 days with full access to all features. No credit card required to start. During and after your trial, our standard support team is available to help you set up campaigns, refine your ICP, and optimize your outreach. Response time is within 12 hours on business days.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 shrink-0">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upgrade Path */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Need more <span className="text-gradient">firepower?</span>
          </h2>
          <Card className="border-emerald-500/20 bg-card/80 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Upgrade to Command for the full AI arsenal</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    Command unlocks all 8 AI agents, 10,000+ leads per month, 17+ research channels, multi-step outreach across email and LinkedIn, pipeline management, competitive intelligence, 5 team seats, and CRM integrations. It is the complete outbound machine for growing teams.
                  </p>
                  <div className="space-y-2">
                    {[
                      '8 AI Agents working in concert',
                      '10,000+ leads/month with all 17+ channels',
                      'Multi-step outreach (Email + LinkedIn)',
                      'Pipeline management & competitive intel',
                      '5 user seats + GHL & CRM integrations',
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center md:text-right shrink-0">
                  <p className="text-sm text-muted-foreground mb-1">Starting at</p>
                  <p className="text-3xl font-bold text-foreground">$399<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <Link href="/pricing/command">
                    <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1">
                      Explore Command
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Frequently asked <span className="text-gradient">questions</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'How does the 14-day trial work?',
                a: 'When you sign up for Scout, you get 14 days of full access to all features — no credit card required. You can discover, enrich, score, and outreach to leads immediately. If you decide not to continue, your account simply reverts to the free Launchpad plan. All your data and settings are preserved.',
              },
              {
                q: 'What is the difference between Basic and Deep enrichment?',
                a: 'Basic enrichment (included in Scout) covers essential firmographic data: company size, industry, revenue estimate, headquarters, and key contacts. Deep enrichment (available in Command and above) adds technographic data (technology stack, tools used), organizational hierarchy, funding history, growth signals, and intent data. Deep enrichment gives you the insights needed for highly personalized outreach.',
              },
              {
                q: 'Can I switch between monthly and annual billing?',
                a: 'Yes. You can switch at any time through the billing portal. When switching from monthly to annual, you receive a prorated credit for the remaining days on your current monthly cycle. Annual billing saves you 17% compared to paying monthly.',
              },
              {
                q: 'How many emails can I send per day?',
                a: 'Scout supports email outreach with smart sending limits designed to protect your domain reputation. The system automatically paces your sends across optimal time windows and includes warm-up sequences for new domains. Daily limits are calibrated to maximize deliverability while staying within provider thresholds.',
              },
              {
                q: 'Can I run multiple campaigns simultaneously?',
                a: 'Scout supports up to 3 simultaneous campaigns, each targeting a different ICP or market segment. You can test different messaging strategies, target different industries, or run campaigns for different products — all in parallel with independent tracking and analytics.',
              },
              {
                q: 'What happens if I need more than 1,000 leads?',
                a: 'If you consistently hit the 1,000-lead monthly limit, it is a sign your outbound operation is ready to scale. Upgrading to Command gives you 10,000+ leads per month along with 8 AI agents, all 17+ channels, and advanced features like pipeline management and competitive intelligence.',
              },
            ].map((faq, i) => (
              <Card key={i} className="border-border/30 bg-card/80">
                <CardContent className="p-5">
                  <h4 className="text-sm font-semibold text-foreground mb-2">{faq.q}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Ready to scout your <span className="text-gradient">next big deal?</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Start Free Trial
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
