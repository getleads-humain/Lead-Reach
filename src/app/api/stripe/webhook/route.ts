/**
 * LeadReach — Stripe Webhook Handler
 * =====================================
 * Handles Stripe webhook events for subscription management.
 *
 * SECURITY: Uses createServiceClient() which returns null when env vars
 * are missing. Returns 503 when Supabase is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, getPlanByStripePriceId, mapStripeStatus } from '@/lib/stripe-config';
import { createServiceClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  if (!serviceClient) {
    console.error('[LeadReach] Webhook received but Supabase service client not configured');
    return NextResponse.json(
      { error: 'Service not configured' },
      { status: 503 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        const cycle = session.metadata?.cycle;

        if (userId && planId) {
          await serviceClient
            .from('profiles')
            .update({
              plan: 'paid',
              plan_tier: planId,
              billing_cycle: cycle,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const plan = getPlanByStripePriceId(subscription.items.data[0]?.price.id);
        const mapped = mapStripeStatus(subscription.status);

        if (plan) {
          await serviceClient
            .from('profiles')
            .update({
              plan: mapped.plan,
              plan_tier: plan.id,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', subscription.customer as string);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await serviceClient
          .from('profiles')
          .update({
            plan: 'free',
            plan_tier: 'scout',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', subscription.customer as string);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
