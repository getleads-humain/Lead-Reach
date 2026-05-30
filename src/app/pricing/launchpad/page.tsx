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
  Shield,
  ChevronRight,
  Sparkles,
  Globe,
  Mail,
  TrendingUp,
  Clock,
  Rocket,
  Lightbulb,
  Award,
} from 'lucide-react';

export default function LaunchpadPlanPage() {
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
            <Rocket className="h-3 w-3 mr-1" />
            Free Forever
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Launchpad <span className="text-gradient">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Explore AI-powered lead generation at zero cost — forever. No credit card required, no time limits, no hidden fees. Launchpad is your permanent entry point into the LeadReach ecosystem.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-5xl font-bold text-foreground">$0</span>
            <span className="text-lg text-muted-foreground">/month</span>
          </div>
          <Link href="/app">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
              Get Started Free
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is <span className="text-gradient">Launchpad</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Lightbulb className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Solo Explorers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Individual entrepreneurs and solopreneurs who want to test the waters of AI-powered lead generation before committing to a paid plan. Launchpad gives you real, functional tools — not a watered-down demo — so you can experience genuine value from day one.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Target className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Early-Stage Startups</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pre-revenue or bootstrapped startups that need to validate their ideal customer profile and generate initial pipeline without burning cash. Launchpad provides enough AI capability to find and score leads while you prove product-market fit.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-emerald-500/10 p-3 w-fit mb-4">
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Budget-Conscious Teams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Small businesses and freelance consultants who need a reliable, zero-cost lead generation tool that scales when they are ready. Launchpad never expires, never asks for payment, and provides a clear upgrade path as your needs grow.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in <span className="text-gradient">Launchpad</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Zap className="h-5 w-5 text-emerald-400" />,
                title: '2 AI Agents — Orchestrator & Prospect Discovery',
                desc: 'Your AI workforce starts with two powerful agents. The Orchestrator coordinates campaigns, assigns tasks, and ensures every lead flows through the right pipeline stage. The Prospect Discovery agent scours the web, LinkedIn, and Exa-powered databases to find leads matching your ICP. Together, they form a self-organizing lead generation machine that works around the clock.',
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-emerald-400" />,
                title: '100 Leads Per Month',
                desc: 'Every month, LeadReach discovers and delivers up to 100 leads tailored to your ideal customer profile. These are not scraped directories — each lead is enriched with firmographic data, scored against your ICP, and ranked by conversion potential. For many solopreneurs, 100 high-quality AI-scored leads per month is more than enough to fill a pipeline.',
              },
              {
                icon: <Globe className="h-5 w-5 text-emerald-400" />,
                title: '3 Research Channels (Web, LinkedIn, Exa)',
                desc: 'Launchpad searches across three powerful channels simultaneously. Web search captures company websites, news mentions, and public data. LinkedIn integration pulls professional profiles and organizational hierarchies. Exa-powered semantic search finds leads based on meaning and context rather than just keywords, surfacing prospects your competitors miss.',
              },
              {
                icon: <Target className="h-5 w-5 text-emerald-400" />,
                title: 'Basic ICP Builder',
                desc: 'Define your Ideal Customer Profile using our guided ICP Builder. Specify industry, company size, location, technology stack, and other firmographic criteria. The AI uses your ICP to score every discovered lead, ensuring you only spend time on prospects that match your target. As your business evolves, update your ICP and watch the AI adapt in real time.',
              },
              {
                icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
                title: 'Basic Lead Scoring',
                desc: 'Every lead receives an AI-generated quality score based on firmographic fit, data completeness, and reachability. This scoring engine helps you prioritize outreach so you always contact the highest-potential prospects first. The scoring model improves over time as you interact with leads and provide feedback.',
              },
              {
                icon: <Mail className="h-5 w-5 text-emerald-400" />,
                title: 'Standard Support (Email Only)',
                desc: 'Get help when you need it via email support. Our team responds within 24 hours on business days. Whether you have questions about setting up your ICP, interpreting lead scores, or getting the most out of your AI agents, we are here to help. Comprehensive documentation and video tutorials are also available 24/7.',
              },
              {
                icon: <Users className="h-5 w-5 text-emerald-400" />,
                title: '1 User Seat',
                desc: 'Launchpad is designed for individual use, giving one person full access to the platform. Perfect for solopreneurs, independent consultants, or a single team member testing LeadReach before rolling it out company-wide. Need more seats? Upgrade to Scout or Command anytime.',
              },
              {
                icon: <Shield className="h-5 w-5 text-emerald-400" />,
                title: 'LeadReach Branding on Outreach',
                desc: 'Outreach emails sent from the Launchpad plan include a small "Powered by LeadReach" signature. This branding helps us keep the free tier sustainable while you benefit from professional-grade AI lead generation at zero cost. Upgrade to any paid plan to remove branding and unlock full white-label capabilities.',
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
            Ready to <span className="text-gradient">scale?</span>
          </h2>
          <Card className="border-emerald-500/20 bg-card/80 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-3">Upgrade to Scout for 10x more leads</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    When you are ready to scale, Scout unlocks 1,000 leads per month, 5 research channels, email outreach, basic data enrichment, and removes LeadReach branding. It is the natural next step for growing teams ready to turn AI-discovered leads into real conversations and booked meetings.
                  </p>
                  <div className="space-y-2">
                    {[
                      '1,000 leads/month (10x Launchpad)',
                      '5 research channels including GitHub & Reddit',
                      'Email outreach with templates',
                      'Basic data enrichment',
                      'No LeadReach branding',
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
                  <p className="text-3xl font-bold text-foreground">$149<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <Link href="/pricing/scout">
                    <Button className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-1">
                      Explore Scout
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
                q: 'Is Launchpad really free forever?',
                a: 'Yes. There are no hidden fees, no trial periods, and no credit card required. Launchpad is a permanently free tier designed to let you experience genuine AI-powered lead generation. You can use it for as long as you like with 100 leads per month and 2 AI agents working for you around the clock.',
              },
              {
                q: 'What happens when I hit 100 leads?',
                a: 'When you reach your monthly lead limit, LeadReach pauses discovery until the next billing cycle. Existing leads remain fully accessible — you can still view, enrich, and export them. Upgrade to Scout for 1,000 leads per month or Command for 10,000+ leads if you need higher volume.',
              },
              {
                q: 'Can I upgrade from Launchpad anytime?',
                a: 'Absolutely. You can upgrade to any paid plan at any time directly from your dashboard. Your data, ICP profiles, and discovered leads transfer seamlessly. Paid plans also include a 14-day free trial so you can test the additional features risk-free.',
              },
              {
                q: 'Is the lead quality on Launchpad the same as paid plans?',
                a: 'Yes. The AI discovery and scoring engine is identical across all plans. Every lead is enriched and scored against your ICP using the same multi-dimensional model. The difference is volume and advanced features — not quality. Launchpad leads are just as valuable as those on paid tiers.',
              },
              {
                q: 'Do I need to enter a credit card to sign up?',
                a: 'No. Launchpad requires zero payment information. Simply create an account, define your ICP, and start receiving AI-discovered leads within minutes. We only ask for payment details if and when you choose to upgrade to a paid plan.',
              },
              {
                q: 'Can I use Launchpad for commercial purposes?',
                a: 'Yes. Launchpad is fully functional for commercial lead generation. You can discover, score, and manage leads for your business or clients. The only limitations are volume (100 leads/month) and the LeadReach branding on outgoing outreach emails.',
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
                Start generating leads <span className="text-gradient">for free today</span>
              </h2>
              <p className="text-muted-foreground mb-6">
                No credit card. No time limit. No catch. Just AI-powered lead generation.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald text-base px-8 h-12">
                  Get Started Free
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
