/**
 * LeadReach — Stripe Checkout Session API
 * =========================================
 * Creates a Stripe Checkout Session for subscribing to a plan.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe, getPlanById, getStripePriceId } from '@/lib/stripe-config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body: { planId?: string; cycle?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { planId, cycle } = body;

    if (!planId || !cycle) {
      return NextResponse.json(
        { error: 'Missing required fields: planId and cycle' },
        { status: 400 }
      );
    }

    if (cycle !== 'monthly' && cycle !== 'annual') {
      return NextResponse.json(
        { error: 'Invalid cycle. Must be "monthly" or "annual"' },
        { status: 400 }
      );
    }

    const plan = getPlanById(planId);
    if (!plan) {
      return NextResponse.json({ error: `Invalid plan ID: ${planId}` }, { status: 400 });
    }

    if (!plan.stripeMonthlyPriceId && !plan.stripeAnnualPriceId) {
      return NextResponse.json({
        message: `${plan.displayName} is a custom plan. Please contact our sales team to get started.`,
        contactSales: true,
      });
    }

    const priceId = getStripePriceId(planId, cycle as 'monthly' | 'annual');
    if (!priceId) {
      return NextResponse.json(
        { error: `No Stripe price found for plan "${planId}" with ${cycle} billing` },
        { status: 400 }
      );
    }

    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id, planId },
      });

      customerId = customer.id;

      const { error: updateError } = await serviceClient
        .from('profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to save stripe_customer_id:', updateError);
      }
    }

    const isFirstTime = profile?.plan === 'free' || !profile?.plan;
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/settings?checkout=cancelled`,
      metadata: { userId: user.id, planId, cycle },
      subscription_data: {
        metadata: { userId: user.id, planId, cycle },
        ...(isFirstTime ? { trial_period_days: 14 } : {}),
      },
      allow_promotion_codes: true,
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('POST /api/stripe/checkout error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
