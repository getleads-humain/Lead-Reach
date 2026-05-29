/**
 * LeadReach — Stripe Customer Portal API
 * =========================================
 * Creates a Stripe Customer Portal Session for managing billing.
 *
 * POST /api/stripe/portal
 * Returns: { url: string } — Stripe Portal URL for redirect
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe-config';
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
    // ── Authenticate the user ──────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── Look up the user's Stripe customer ID ─────────────────────
    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const customerId = profile?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json(
        { error: 'No Stripe customer found. Please subscribe to a plan first.' },
        { status: 400 }
      );
    }

    // ── Create the billing portal session ──────────────────────────
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
      configuration: await getPortalConfigurationId(),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('POST /api/stripe/portal error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Get or create a portal configuration that allows:
 * - Subscription cancellation
 * - Plan changes (upgrades/downgrades)
 * - Payment method updates
 */
async function getPortalConfigurationId(): Promise<string> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // List existing configurations to see if we already have one
  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });

  const existingConfig = configurations.data.find(
    (config) => config.metadata?.leadreach === 'true'
  );

  if (existingConfig) {
    return existingConfig.id;
  }

  // Create a new configuration with all the required features
  const configuration = await stripe.billingPortal.configurations.create({
    metadata: { leadreach: 'true' },
    features: {
      payment_method_update: {
        enabled: true,
      },
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address'],
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive',
            'missing_features',
            'switched_service',
            'unused',
            'other',
          ],
        },
      },
      subscription_pause: {
        enabled: false,
      },
      invoice_history: {
        enabled: true,
      },
    },
    business_profile: {
      headline: 'LeadReach — Manage your subscription',
    },
  });

  return configuration.id;
}
