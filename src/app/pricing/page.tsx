'use client';

/**
 * LeadReach — Pricing Page
 * ===========================
 * Full pricing page with B2B/B2C toggle, monthly/annual billing,
 * plan comparison, and Stripe checkout integration.
 */

import React, { useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Crown,
  Zap,
  Target,
  Users,
  Bot,
  Mail,
  BarChart3,
  Database,
  Shield,
  Sparkles,
  Heart,
  MessageCircle,
  Calendar,
  TrendingUp,
  Crosshair,
  Telescope,
  ChevronRight,
  Star,
  Clock,
  Gift,
} from 'lucide-react';
import Link from 'next/link';
import { PLANS, getPlanById, getFeatureAccess, type PlanDefinition } from '@/lib/plans';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type BillingCycle = 'monthly' | 'annual';
type Track = 'b2b' | 'b2c';

// Feature comparison matrix
const FEATURE_COMPARISON = [
  {
    category: 'Lead Generation',
    features: [
      { name: 'Leads per month', b2b: ['100', '1,000', '10,000+', '15,000', 'Unlimited'], b2c: ['500', '10,000+', 'Unlimited'] },
      { name: 'Research channels', b2b: ['3 channels', '5 channels', 'All 17+ channels', 'All 17+ channels', 'Custom channels'], b2c: ['2 channels', 'All 5+ channels', 'Custom channels'] },
      { name: 'ICP Builder', b2b: ['Basic', true, true, true, true], b2c: [true, true, true] },
      { name: 'Lead Scoring', b2b: ['Basic', 'Basic', 'Advanced multi-dimensional', 'Advanced multi-dimensional', 'Custom AI scoring'], b2c: ['Basic', 'Advanced', 'Custom AI scoring'] },
    ],
  },
  {
    category: 'AI Agents',
    features: [
      { name: 'AI Agents', b2b: ['2 agents', '3 agents', '8 agents', '8 agents — forever', 'Unlimited'], b2c: ['2 setters', 'Unlimited setters', 'Unlimited setters'] },
      { name: 'Data Enrichment', b2b: [false, 'Basic', 'Deep (firmographics & technographics)', 'Deep (firmographics & technographics)', 'Custom enrichment'], b2c: ['Basic', 'Advanced', 'Custom'] },
      { name: 'Pipeline Management', b2b: [false, false, true, true, true], b2c: [false, true, true] },
      { name: 'API Access', b2b: [false, false, false, true, true], b2c: [false, false, true] },
    ],
  },
  {
    category: 'Outreach & Engagement',
    features: [
      { name: 'Outreach channels', b2b: [false, 'Email only', 'Email + LinkedIn', 'Email + LinkedIn', 'All channels'], b2c: ['SMS + Email', 'All channels', 'All channels'] },
      { name: 'A/B Testing', b2b: [false, false, true, true, true], b2c: [false, true, true] },
      { name: 'Follow-up Sequences', b2b: [false, 'Basic', 'Multi-step automated', 'Multi-step automated', 'Custom workflows'], b2c: ['Standard', 'Custom & nurture', 'Custom workflows'] },
    ],
  },
  {
    category: 'Platform & Support',
    features: [
      { name: 'User seats', b2b: ['1', '1', '5', '5', 'Unlimited'], b2c: ['1', '5', 'Unlimited'] },
      { name: 'CRM Integrations', b2b: [false, false, 'GHL & CRM integrations', 'GHL & CRM integrations', 'Custom integrations & API'], b2c: [false, 'GHL CRM integration', 'Custom integrations & API'] },
      { name: 'Support', b2b: ['Email only', 'Standard', 'Priority', 'Priority — forever', 'Dedicated CSM + SLA'], b2c: ['Standard', 'Priority', 'Dedicated CSM + SLA'] },
      { name: 'White-label', b2b: [false, false, false, false, true], b2c: [false, false, true] },
    ],
  },
];

function PricingContent() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('annual');
  const [activeTrack, setActiveTrack] = useState<Track>('b2b');
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const currentPlanId = profile?.plan_tier || 'scout';
  const currentPlan = getPlanById(currentPlanId);
  const isOnFreePlan = !profile?.plan || profile.plan === 'free';
  const isTrial = profile?.plan === 'trial';

  const b2bPlans = PLANS.filter(p => p.track === 'b2b');
  const b2cPlans = PLANS.filter(p => p.track === 'b2c');
  const displayPlans = activeTrack === 'b2b' ? b2bPlans : b2cPlans;

  const handleCheckout = useCallback(async (planId: string, cycle: BillingCycle) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setCheckoutLoading(planId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, cycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error('Checkout failed', { description: data.error || 'Something went wrong.' });
        return;
      }

      if (data.contactSales) {
        toast.info('Contact Sales', {
          description: data.message || 'This plan requires a custom setup.',
          duration: 8000,
        });
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Network error', { description: 'Could not connect to the server.' });
    } finally {
      setCheckoutLoading(null);
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-background noise-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center border-b border-border/50 glass px-4">
        <div className="flex items-center gap-3">
          <Link href="/app">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to App
            </Button>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Crown className="h-4 w-4 text-emerald-400" />
            Pricing
          </h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Free Tier + 14-Day Trial on Paid Plans
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Choose the plan that <span className="text-gradient">fits your growth</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required. Upgrade, downgrade, or cancel anytime.
          </p>

          {/* Track Toggle */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <div className="flex items-center gap-1 bg-secondary/30 rounded-xl p-1 border border-border/30">
              <button
                onClick={() => setActiveTrack('b2b')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  activeTrack === 'b2b'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Target className="h-4 w-4" />
                B2B Lead Generation
              </button>
              <button
                onClick={() => setActiveTrack('b2c')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  activeTrack === 'b2c'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className="h-4 w-4" />
                B2C Appointment Setting
              </button>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1 border border-border/30">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Annual
                <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px] px-1 py-0 h-4">
                  Save 17%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 mb-12">
          {displayPlans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlanId;
            const isCustom = plan.monthlyPrice === 0 && plan.grade === 'enterprise';
            const isFreeTier = plan.grade === 'free';
            const isLifetimeTier = plan.grade === 'lifetime';
            const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = checkoutLoading === plan.id;

            return (
              <Link href={`/pricing/${plan.id}`} key={plan.id}>
              <Card
                className={`relative border-border/30 bg-card/80 transition-all cursor-pointer hover:scale-[1.02] ${
                  plan.highlight
                    ? isLifetimeTier
                      ? 'border-amber-500/30 ring-1 ring-amber-500/20'
                      : 'border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : isCurrentPlan
                      ? 'border-emerald-500/30'
                      : 'hover:border-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/5'
                }`}
              >
                {/* Popular/LTD badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className={`border-0 font-bold px-3 ${
                      isLifetimeTier ? 'bg-amber-500 text-black' : 'bg-emerald-500 text-black'
                    }`}>
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-5 lg:p-6">
                  {/* Plan name & description */}
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-foreground">{plan.displayName}</h3>
                      {isCurrentPlan && (
                        <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-4">
                    {isFreeTier ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">$0</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </>
                    ) : isLifetimeTier ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">${price.toLocaleString()}</span>
                        <span className="text-sm text-amber-400 font-medium">one-time</span>
                      </>
                    ) : isCustom ? (
                      <span className="text-3xl font-bold text-foreground">Custom</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${price.toLocaleString()}</span>
                        <span className="text-sm text-muted-foreground">
                          /{billingCycle === 'annual' ? 'yr' : 'mo'}
                        </span>
                        {billingCycle === 'annual' && (
                          <div className="ml-2">
                            <span className="text-sm text-emerald-400">
                              ${Math.round(price / 12)}/mo
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Trial badge */}
                  {!isCustom && !isFreeTier && !isLifetimeTier && !isCurrentPlan && (
                    <div className="flex items-center gap-1.5 mb-3 p-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <Gift className="h-3 w-3 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400 font-medium">14-day free trial included</span>
                    </div>
                  )}

                  {/* Features list */}
                  <div className="space-y-1.5 mb-4">
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button — stopPropagation to avoid card Link navigation */}
                  {isCurrentPlan ? (
                    <Button
                      variant="outline"
                      className="w-full border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5 hover:text-emerald-400"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : isCustom ? (
                    <Button
                      variant="outline"
                      className="w-full border-border/30 hover:bg-secondary/50 gap-1"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast.info('Contact Sales', {
                          description: 'Our team will help you set up a custom plan for your needs.',
                          duration: 6000,
                        });
                      }}
                    >
                      Contact Sales
                    </Button>
                  ) : isFreeTier ? (
                    <Button
                      className="w-full font-semibold gap-1 bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border/30"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push('/app');
                      }}
                    >
                      Get Started Free
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  ) : isLifetimeTier ? (
                    <Button
                      className={`w-full font-semibold gap-1 ${
                        'bg-amber-500 hover:bg-amber-400 text-black glow-emerald-sm'
                      }`}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCheckout(plan.id, billingCycle);
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Get Lifetime Access
                          <ChevronRight className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-semibold gap-1 ${
                        plan.highlight
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black glow-emerald-sm'
                          : 'bg-secondary/50 hover:bg-secondary/70 text-foreground border border-border/30'
                      }`}
                      disabled={isLoading}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCheckout(plan.id, billingCycle);
                      }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {isOnFreePlan || isTrial ? 'Start Free Trial' : 'Change Plan'}
                          <ChevronRight className="h-3 w-3" />
                        </>
                      )}
                    </Button>
                  )}

                  {/* Learn more indicator */}
                  <div className="mt-3 flex items-center justify-center gap-1 text-[11px] text-muted-foreground/60 hover:text-emerald-400 transition-colors">
                    <span>Learn more</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Compare <span className="text-gradient">all features</span>
            </h2>
            <p className="mt-2 text-muted-foreground">
              See exactly what&apos;s included in each plan
            </p>
          </div>

          <Card className="border-border/30 bg-card/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left p-4 text-sm font-semibold text-foreground w-[200px]">
                      Features
                    </th>
                    {displayPlans.map(plan => (
                      <th key={plan.id} className="text-center p-4 text-sm font-semibold text-foreground">
                        <div>{plan.displayName}</div>
                        <div className="text-xs font-normal text-muted-foreground mt-0.5">
                          {plan.grade === 'free'
                            ? 'Free'
                            : plan.grade === 'lifetime'
                              ? `$${plan.monthlyPrice.toLocaleString()} one-time`
                              : plan.monthlyPrice > 0
                                ? `$${billingCycle === 'annual' ? Math.round(plan.annualPrice / 12) : plan.monthlyPrice}/mo`
                                : 'Custom'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISON.map((category, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr>
                        <td
                          colSpan={displayPlans.length + 1}
                          className="px-4 py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/5 uppercase tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feat, featIdx) => {
                        const trackData = activeTrack === 'b2b' ? feat.b2b : feat.b2c;
                        return (
                          <tr key={featIdx} className="border-b border-border/10 hover:bg-secondary/5 transition-colors">
                            <td className="p-4 text-sm text-muted-foreground">{feat.name}</td>
                            {trackData.map((val, i) => (
                              <td key={i} className="text-center p-4 text-sm">
                                {typeof val === 'boolean' ? (
                                  val ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
                                  )
                                ) : (
                                  <span className="text-foreground">{val}</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Frequently asked <span className="text-gradient">questions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {[
              {
                q: 'Can I try before I buy?',
                a: 'Yes! Every paid plan includes a 14-day free trial. No credit card required to start. You\'ll have full access to all features during the trial period.',
              },
              {
                q: 'Can I switch plans later?',
                a: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle. Prorated credits apply for upgrades.',
              },
              {
                q: 'What happens when my trial ends?',
                a: 'When your trial ends, you\'ll be asked to choose a plan to continue using LeadReach. Your data and settings are preserved. If you choose not to subscribe, you\'ll be moved to the free plan.',
              },
              {
                q: 'Is there a long-term contract?',
                a: 'No. All plans are pay-as-you-go with no long-term commitments. You can cancel anytime from the billing portal. Annual plans are billed upfront but can be cancelled with prorated refunds.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and bank transfers through Stripe. Enterprise plans can also pay by invoice.',
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with LeadReach within the first 30 days, contact support for a full refund.',
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
        </div>

        {/* CTA */}
        <div className="text-center">
          <div className="relative rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-emerald-500/5 rounded-full blur-[100px]" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                Ready to supercharge your <span className="text-gradient">lead generation?</span>
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

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
