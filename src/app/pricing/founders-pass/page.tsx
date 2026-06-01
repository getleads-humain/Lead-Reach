'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Zap,
  Target,
  Users,
  BarChart3,
  Shield,
  Crown,
  Sparkles,
  Globe,
  Mail,
  TrendingUp,
  Infinity,
  Clock,
  Gift,
  Key,
  Star,
  Lock,
} from 'lucide-react';

export default function FoundersPassPlanPage() {
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
          <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">
            <Crown className="h-3 w-3 mr-1" />
            Lifetime Deal
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
            Founders&apos; <span className="text-gradient">Pass</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            One payment. Unlimited AI lead generation. Forever. The Founders&apos; Pass is a limited-time lifetime deal that gives you everything in Command — plus 15,000 leads per month, API access, and priority support in perpetuity. No recurring fees. No renewal surprises. No expiration.
          </p>
          <div className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-5xl font-bold text-foreground">$2,497</span>
            <span className="text-lg text-amber-400 font-medium">one-time</span>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Equivalent to just $208/month over 1 year — and then it&apos;s free forever
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/app">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base px-8 h-12">
                Get Lifetime Access
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">30-day money-back guarantee</p>
        </div>

        {/* ROI Calculator */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            The <span className="text-gradient">math</span> speaks for itself
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-amber-500/20 bg-card/80">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">vs. Command Monthly</p>
                <p className="text-3xl font-bold text-foreground mb-1">$399/mo</p>
                <p className="text-xs text-muted-foreground">= $4,788/year</p>
                <div className="my-3 border-t border-border/30" />
                <p className="text-sm text-amber-400 font-semibold">Save $2,291 in Year 1</p>
                <p className="text-xs text-muted-foreground">Save $4,788 every year after</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-card/80">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">vs. Command Annual</p>
                <p className="text-3xl font-bold text-foreground mb-1">$3,990/yr</p>
                <p className="text-xs text-muted-foreground">= $3,990/year</p>
                <div className="my-3 border-t border-border/30" />
                <p className="text-sm text-amber-400 font-semibold">Save $1,493 in Year 1</p>
                <p className="text-xs text-muted-foreground">Save $3,990 every year after</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-card/80">
              <CardContent className="p-6 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">3-Year Total Cost</p>
                <p className="text-3xl font-bold text-foreground mb-1">$2,497</p>
                <p className="text-xs text-muted-foreground">one-time, total</p>
                <div className="my-3 border-t border-border/30" />
                <p className="text-sm text-amber-400 font-semibold">vs. $11,970 (monthly) or $11,970 (annual)</p>
                <p className="text-xs text-muted-foreground">That&apos;s 79% savings over 3 years</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Who It's For */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Who is the <span className="text-gradient">Founders&apos; Pass</span> for?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-amber-500/10 p-3 w-fit mb-4">
                  <Star className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Forward-Thinking Founders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Founders who recognize that a one-time investment in a lifetime tool delivers compounding returns. By locking in access forever, you eliminate the single largest variable cost in your outbound stack and gain certainty that your lead generation infrastructure will never be disrupted by price increases, plan changes, or budget cuts.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-amber-500/10 p-3 w-fit mb-4">
                  <Infinity className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Long-Term Planners</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Businesses with a 3-year or longer horizon that want to lock in today&apos;s pricing forever. SaaS prices increase 10 to 20 percent annually on average — the Founders&apos; Pass immunizes you against all future price hikes. The longer you use LeadReach, the more valuable this investment becomes relative to any subscription alternative.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/30 bg-card/80">
              <CardContent className="p-6">
                <div className="rounded-lg bg-amber-500/10 p-3 w-fit mb-4">
                  <Key className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">Budget-Conscious Teams</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Teams that prefer a one-time capital expenditure over ongoing operational expenses. The Founders&apos; Pass converts your lead generation cost from a variable monthly expense into a fixed one-time investment, making financial forecasting simpler and freeing up monthly budget for other growth initiatives like hiring, advertising, or product development.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Detailed Features */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Everything included in the <span className="text-gradient">Founders&apos; Pass</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: <Crown className="h-5 w-5 text-amber-400" />,
                title: 'All 8 AI Agents — Forever',
                desc: 'Every AI agent in the LeadReach arsenal is yours in perpetuity: Orchestrator, Prospect Discovery, Data Enrichment, Web Research, Lead Qualification, Outreach Composer, Pipeline Manager, and Report Generator. These agents will continue working for you indefinitely — no expiration, no downgrade risk, no feature removal. As we improve agent capabilities, your lifetime access includes all updates.',
              },
              {
                icon: <BarChart3 className="h-5 w-5 text-amber-400" />,
                title: '15,000 Leads Per Month — Lifetime',
                desc: '50% more leads than Command, delivered every month, forever. With 15,000 AI-discovered and scored leads per month, you have the volume to power multiple outbound campaigns across different products, markets, or team members simultaneously. And this volume never expires — it renews every month for as long as LeadReach exists.',
              },
              {
                icon: <Globe className="h-5 w-5 text-amber-400" />,
                title: 'All 17+ Channels + Advanced ICP & Scoring',
                desc: 'Full access to every research channel, plus the advanced multi-dimensional ICP builder and scoring engine. Define as many ICP profiles as you need, score leads across firmographic fit, technographic alignment, intent signals, reachability, and strategic value. The scoring model continuously improves as the platform evolves.',
              },
              {
                icon: <Zap className="h-5 w-5 text-amber-400" />,
                title: 'Deep Enrichment + Multi-Step Outreach',
                desc: 'Comprehensive firmographic and technographic enrichment for every lead. Multi-step outreach across email and LinkedIn with automated sequences, personalized messaging, and engagement tracking. Compose, send, follow up, and track — all automated by AI agents that learn what works best for your audience over time.',
              },
              {
                icon: <Target className="h-5 w-5 text-amber-400" />,
                title: 'Pipeline Management + Competitive Intel',
                desc: 'Full pipeline visualization from first touch to closed-won with automated stage transitions, follow-up triggers, and team notifications. Competitive intelligence monitoring tracks competitor moves, market shifts, and customer sentiment so you can position your outreach strategically against alternatives in the market.',
              },
              {
                icon: <Users className="h-5 w-5 text-amber-400" />,
                title: '5 User Seats + GHL & CRM Integrations',
                desc: 'Five team members get full platform access with independent dashboards and shared campaigns. Native integrations with GoHighLevel, HubSpot, Salesforce, and Pipedrive ensure seamless data flow between LeadReach and your existing CRM. New integration releases are included in your lifetime access.',
              },
              {
                icon: <Key className="h-5 w-5 text-amber-400" />,
                title: 'API Access',
                desc: 'Full API access with comprehensive documentation, authentication tokens, rate limits suitable for production workloads, and webhook support for real-time event streaming. Build custom integrations, automate workflows, and connect LeadReach to your internal tools. The API is versioned and backward-compatible, so your integrations never break.',
              },
              {
                icon: <Shield className="h-5 w-5 text-amber-400" />,
                title: 'Priority Support — Forever + All Future Updates',
                desc: 'Priority support with guaranteed 4-hour response time during business hours, for life. Every platform update, new feature, and improvement released during your lifetime is included at no additional cost. As LeadReach evolves — new AI agents, new channels, new integrations — your Founders&apos; Pass ensures you always have access to the latest and greatest.',
              },
            ].map((feature, i) => (
              <Card key={i} className="border-amber-500/10 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-amber-500/10 p-2.5 shrink-0">
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

        {/* Lifetime Deal Terms */}
        <section className="mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 text-center">
            Lifetime Deal <span className="text-gradient">guarantees</span>
          </h2>
          <Card className="border-amber-500/20 bg-card/80">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { icon: <Lock className="h-5 w-5 text-amber-400" />, title: 'Price Lock', desc: 'Your one-time payment covers everything — forever. No renewal fees, no price increases, no surprise charges. The price you pay today is the only payment you will ever make.' },
                  { icon: <Gift className="h-5 w-5 text-amber-400" />, title: 'Feature Parity', desc: 'Your Founders\' Pass includes all features available at the Command tier at the time of purchase, plus all future updates and improvements to those features at no additional cost.' },
                  { icon: <Clock className="h-5 w-5 text-amber-400" />, title: '30-Day Money-Back', desc: 'Not sure if it\'s right for you? Try the Founders\' Pass risk-free for 30 days. If you\'re not completely satisfied, contact us for a full refund — no questions asked, no hoops to jump through.' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className="rounded-lg bg-amber-500/10 p-3 w-fit mx-auto mb-3">
                      {item.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
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
                q: 'What does "lifetime" actually mean?',
                a: 'Lifetime means for the life of the LeadReach product. As long as LeadReach exists and operates, your Founders\' Pass remains active with full access to all included features. This is not a 5-year license or a long-term subscription — it is genuinely perpetual access with a single payment. We have structured our business to ensure long-term sustainability so your investment is protected.',
              },
              {
                q: 'Do I get future features and updates?',
                a: 'Yes. Your Founders\' Pass includes all updates and improvements to the features included in your tier. When we improve the AI agents, add new research channels, enhance the scoring engine, or release new integrations, you get those updates automatically. Any feature that would be available to a Command subscriber is available to you — forever.',
              },
              {
                q: 'Why is the Founders\' Pass a limited-time offer?',
                a: 'Lifetime deals are a strategic investment in our early community. They help us build a dedicated user base, gather feedback, and fund continued development. We cannot offer this pricing permanently — it is reserved for founders and early adopters who take a chance on LeadReach during our growth phase. Once the offer closes, it will not return.',
              },
              {
                q: 'Can I upgrade from Command to Founders\' Pass?',
                a: 'Yes. If you are currently on a Command subscription, you can apply your remaining subscription value toward the Founders\' Pass purchase. Contact our support team to arrange the transition. Your campaigns, data, and settings transfer seamlessly with no downtime.',
              },
              {
                q: 'What happens if LeadReach introduces a higher tier?',
                a: 'Your Founders\' Pass guarantees feature parity with the Command tier. If we introduce a new tier above Command (for example, a plan with unlimited leads or custom AI training), those features would not be automatically included. However, Founders\' Pass holders receive significant discounts on any upgrades to higher tiers.',
              },
              {
                q: 'Is the Founders\' Pass refundable?',
                a: 'We offer a 30-day money-back guarantee. If you purchase the Founders\' Pass and are not satisfied within the first 30 days, we will issue a full refund. After 30 days, the purchase is final. This policy ensures you have ample time to evaluate the platform and confirm it meets your needs.',
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
          <div className="relative rounded-2xl border border-amber-500/20 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-amber-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Lock in your <span className="text-gradient">lifetime access</span> today
              </h2>
              <p className="text-muted-foreground mb-6">
                This is a limited-time offer. Once it&apos;s gone, it&apos;s gone forever.
              </p>
              <Link href="/app">
                <Button size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base px-8 h-12">
                  Get Lifetime Access — $2,497
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
