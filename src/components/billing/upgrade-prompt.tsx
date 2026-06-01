'use client';

/**
 * LeadReach — Upgrade Prompt Component
 * =======================================
 * Modal/overlay that shows when a user tries to access a feature
 * beyond their current plan. Shows what plan they need and a CTA to upgrade.
 */

import React, { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Lock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getPlanById, PLANS } from '@/lib/plans';
import { toast } from 'sonner';
import Link from 'next/link';

type BillingCycle = 'monthly' | 'annual';

interface UpgradePromptProps {
  /** The feature/view the user tried to access */
  feature: string;
  /** The minimum plan required (e.g. 'command', 'closer') */
  requiredPlanId: string;
  /** Optional custom message */
  message?: string;
  /** Whether to render as a full-page overlay instead of a modal */
  asOverlay?: boolean;
  /** Children to wrap (when using Dialog mode) */
  children?: React.ReactNode;
}

export function UpgradePrompt({
  feature,
  requiredPlanId,
  message,
  asOverlay = false,
  children,
}: UpgradePromptProps) {
  const { profile } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const requiredPlan = getPlanById(requiredPlanId);
  const currentPlanId = profile?.plan_tier || 'scout';
  const currentPlan = getPlanById(currentPlanId);

  const handleCheckout = async (planId: string, cycle: BillingCycle) => {
    setCheckoutLoading(true);
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
      setCheckoutLoading(false);
    }
  };

  // Find the recommended plans for user's track
  const userTrack = currentPlan?.track || 'b2b';
  const trackPlans = PLANS.filter(p => p.track === userTrack && p.monthlyPrice > 0);
  const recommendedPlan = requiredPlan || trackPlans.find(p => p.grade === 'professional') || trackPlans[0];

  const upgradeContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
          <Lock className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Upgrade to unlock {feature}
          </h3>
          <p className="text-sm text-muted-foreground">
            {message || `${feature} is available on the ${requiredPlan?.displayName || 'Professional'} plan and above.`}
          </p>
        </div>
      </div>

      {/* Current vs Required */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border border-border/30 bg-secondary/10">
          <div className="text-xs text-muted-foreground mb-1">Current Plan</div>
          <div className="text-sm font-semibold text-muted-foreground">
            {currentPlan?.displayName || 'Free'}
          </div>
        </div>
        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 mb-1">Required Plan</div>
          <div className="text-sm font-semibold text-emerald-400">
            {requiredPlan?.displayName || 'Professional'}
          </div>
        </div>
      </div>

      {/* Billing Cycle Toggle */}
      <div className="flex items-center gap-2 bg-secondary/30 rounded-lg p-1 border border-border/30">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            billingCycle === 'monthly'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
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

      {/* Recommended Plan */}
      {recommendedPlan && (
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground flex items-center gap-2">
                {recommendedPlan.displayName}
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              <div className="text-xs text-muted-foreground">{recommendedPlan.description}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-foreground">
                ${billingCycle === 'annual' ? recommendedPlan.annualPrice.toLocaleString() : recommendedPlan.monthlyPrice}
              </div>
              <div className="text-xs text-muted-foreground">
                /{billingCycle === 'annual' ? 'yr' : 'mo'}
                {billingCycle === 'annual' && (
                  <span className="text-emerald-400 ml-1">
                    (${Math.round(recommendedPlan.annualPrice / 12)}/mo)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            {recommendedPlan.features.slice(0, 5).map((feat, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                {feat}
              </div>
            ))}
            {recommendedPlan.features.length > 5 && (
              <div className="text-[10px] text-muted-foreground pl-4">
                +{recommendedPlan.features.length - 5} more features
              </div>
            )}
          </div>

          <Button
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold glow-emerald-sm gap-1"
            disabled={checkoutLoading}
            onClick={() => handleCheckout(recommendedPlan.id, billingCycle)}
          >
            {checkoutLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Upgrade to {recommendedPlan.displayName}
                <ChevronRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* All available plans */}
      <div className="grid grid-cols-2 gap-2">
        {trackPlans.filter(p => p.id !== recommendedPlan?.id).map(plan => (
          <button
            key={plan.id}
            onClick={() => handleCheckout(plan.id, billingCycle)}
            className="p-2.5 rounded-lg border border-border/30 bg-card/50 hover:border-border/50 hover:bg-card/80 transition-all text-left group"
          >
            <div className="text-xs font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
              {plan.displayName}
            </div>
            <div className="text-[10px] text-muted-foreground">
              ${billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice}/{billingCycle === 'annual' ? 'yr' : 'mo'}
            </div>
          </button>
        ))}
      </div>

      {/* Link to full pricing */}
      <div className="text-center">
        <Link
          href="/pricing"
          className="text-xs text-muted-foreground hover:text-emerald-400 transition-colors underline underline-offset-2"
        >
          View all plans & features
        </Link>
      </div>
    </div>
  );

  // Full-page overlay mode
  if (asOverlay) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <Card className="max-w-md w-full border-border/30 bg-card/80">
          <CardContent className="p-6">
            {upgradeContent}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dialog mode (wraps children as trigger)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <button className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
            <Lock className="h-3 w-3" />
            Upgrade to unlock
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md border-border/30 bg-card/95 backdrop-blur-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Upgrade Required</DialogTitle>
          <DialogDescription>
            {feature} requires a higher plan to access.
          </DialogDescription>
        </DialogHeader>
        {upgradeContent}
      </DialogContent>
    </Dialog>
  );
}
