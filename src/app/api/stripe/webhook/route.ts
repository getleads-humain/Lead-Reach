/**
 * LeadReach — Stripe Webhook Handler
 * =====================================
 * Handles Stripe webhook events for subscription lifecycle management.
 *
 * POST /api/stripe/webhook
 *
 * Supported events:
 *   - checkout.session.completed   → Activate paid plan
 *   - customer.subscription.updated → Update plan tier on change
 *   - customer.subscription.deleted  → Downgrade to free plan
 *   - invoice.payment_failed         → Log payment failure
 *   - customer.subscription.trial_will_end → Log trial ending
 *
 * Security: Verifies the Stripe webhook signature unless
 * STRIPE_WEBHOOK_SECRET is empty (development mode).
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanByStripePriceId, mapStripeStatus } from '@/lib/stripe-config';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function POST(request: NextRequest) {
  // ── Read the raw body ─────────────────────────────────────────
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  // ── Verify webhook signature ──────────────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret) {
    // Production / staging — verify the signature
    if (!signature) {
      console.error('Stripe webhook: Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signature verification failed';
      console.error('Stripe webhook signature verification failed:', message);
      return NextResponse.json({ error: message }, { status: 400 });
    }
  } else {
    // Development mode — skip verification
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      console.error('Stripe webhook: Failed to parse event body');
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
  }

  // ── Process the event ─────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event);
        break;

      default:
        console.log(`Stripe webhook: Unhandled event type "${event.type}"`);
    }
  } catch (err) {
    console.error(`Stripe webhook: Error handling event "${event.type}":`, err);
    // Still return 200 to prevent Stripe retries — the error is logged
  }

  // Always return 200 OK to acknowledge receipt
  return NextResponse.json({ received: true });
}

// ── Event Handlers ────────────────────────────────────────────────

/**
 * checkout.session.completed
 * When a checkout is completed, activate the paid plan.
 */
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;

  if (!userId) {
    console.error('Stripe webhook: checkout.session.completed — missing userId in metadata');
    return;
  }

  console.log(`Stripe webhook: Checkout completed for user ${userId}, plan ${planId}`);

  const serviceClient = getServiceClient();

  // Extract the Stripe customer ID from the session
  const customerId = session.customer as string;

  // Update the user's profile
  const updates: Record<string, unknown> = {
    plan: 'paid',
    plan_tier: planId || 'scout',
    stripe_customer_id: customerId,
    updated_at: new Date().toISOString(),
  };

  const { error } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Stripe webhook: Failed to update profile after checkout:', error);
  }
}

/**
 * customer.subscription.updated
 * When a subscription changes (plan upgrade/downgrade), update the plan tier.
 */
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const customerId = subscription.customer as string;

  // Determine the plan from the price ID on the subscription
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error('Stripe webhook: subscription.updated — no price ID found on subscription');
    return;
  }

  const plan = getPlanByStripePriceId(priceId);

  if (!plan) {
    console.warn(`Stripe webhook: subscription.updated — no plan found for price ID ${priceId}`);
    return;
  }

  // Map the Stripe status to our internal status
  const mapped = mapStripeStatus(subscription.status);

  console.log(
    `Stripe webhook: Subscription updated — customer ${customerId}, ` +
    `plan ${plan.id}, status ${subscription.status} → ${mapped.status}`
  );

  const serviceClient = getServiceClient();

  // Find the user by stripe_customer_id
  const { data: profile, error: fetchError } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError || !profile) {
    console.error('Stripe webhook: subscription.updated — no profile found for customer', customerId);
    return;
  }

  const updates: Record<string, unknown> = {
    plan: mapped.plan,
    plan_tier: plan.id,
    updated_at: new Date().toISOString(),
  };

  const { error } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', profile.id);

  if (error) {
    console.error('Stripe webhook: Failed to update profile after subscription change:', error);
  }
}

/**
 * customer.subscription.deleted
 * When a subscription is cancelled, downgrade to the free plan.
 */
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const customerId = subscription.customer as string;

  console.log(`Stripe webhook: Subscription deleted — customer ${customerId}`);

  const serviceClient = getServiceClient();

  // Find the user by stripe_customer_id
  const { data: profile, error: fetchError } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (fetchError || !profile) {
    console.error('Stripe webhook: subscription.deleted — no profile found for customer', customerId);
    return;
  }

  const updates: Record<string, unknown> = {
    plan: 'free',
    plan_tier: 'scout',
    updated_at: new Date().toISOString(),
  };

  const { error } = await serviceClient
    .from('profiles')
    .update(updates)
    .eq('id', profile.id);

  if (error) {
    console.error('Stripe webhook: Failed to downgrade profile after subscription deletion:', error);
  }
}

/**
 * invoice.payment_failed
 * Log payment failure events for monitoring and follow-up.
 */
async function handlePaymentFailed(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;

  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  console.warn(
    `Stripe webhook: Payment failed — customer ${customerId}, ` +
    `subscription ${subscriptionId}, attempt ${invoice.attempt_count}`
  );
}

/**
 * customer.subscription.trial_will_end
 * Log trial ending events so we can notify users.
 */
async function handleTrialWillEnd(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;

  const customerId = subscription.customer as string;
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000).toISOString()
    : 'unknown';

  console.log(
    `Stripe webhook: Trial ending soon — customer ${customerId}, ` +
    `trial ends at ${trialEnd}`
  );
}
