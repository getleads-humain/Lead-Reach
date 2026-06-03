/**
 * LeadReach — Subscription Status API
 * ======================================
 * Returns the user's current subscription status, plan details,
 * and Stripe customer information.
 *
 * SECURITY: Uses createServiceClient() which returns null when env vars
 * are missing, preventing runtime crashes from undefined credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { stripe, getPlanByStripePriceId, mapStripeStatus } from '@/lib/stripe-config';
import { getPlanById, getFeatureAccess } from '@/lib/plans';

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Service not configured. Please set up Supabase environment variables.' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service not configured. Admin features require SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    const planId = profile?.plan_tier || 'scout';
    const plan = getPlanById(planId);
    const featureAccess = getFeatureAccess(planId);

    // Try to get Stripe subscription details if customer exists
    let stripeSubscription = null;
    let upcomingInvoice = null;

    if (profile?.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'all',
          limit: 5,
        });

        const activeSub = subscriptions.data.find(
          (s) => s.status === 'active' || s.status === 'trialing'
        );

        if (activeSub) {
          const subPlan = getPlanByStripePriceId(activeSub.items.data[0]?.price.id);
          const mapped = mapStripeStatus(activeSub.status);

          stripeSubscription = {
            id: activeSub.id,
            status: mapped.status,
            planName: subPlan?.displayName || planId,
            currentPeriodStart: activeSub.current_period_start,
            currentPeriodEnd: activeSub.current_period_end,
            cancelAtPeriodEnd: activeSub.cancel_at_period_end,
            trialEnd: activeSub.trial_end,
          };

          // Get upcoming invoice
          try {
            upcomingInvoice = await stripe.invoices.retrieveUpcoming({
              customer: profile.stripe_customer_id,
            });
          } catch {
            // No upcoming invoice (e.g., subscription cancelled)
          }
        }
      } catch (err) {
        console.error('Stripe subscription lookup error:', err);
        // Continue without Stripe data
      }
    }

    return NextResponse.json({
      subscription: {
        plan: profile?.plan || 'free',
        planTier: planId,
        billingCycle: profile?.billing_cycle || null,
        stripeCustomerId: profile?.stripe_customer_id || null,
      },
      planDetails: plan ? {
        id: plan.id,
        name: plan.displayName,
        track: plan.track,
        monthlyPrice: plan.monthlyPrice,
        annualPrice: plan.annualPrice,
        grade: plan.grade,
      } : null,
      featureAccess,
      stripeSubscription,
      upcomingInvoice: upcomingInvoice ? {
        amount: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        date: upcomingInvoice.next_payment_attempt,
      } : null,
    });
  } catch (err) {
    console.error('GET /api/stripe/subscription error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
