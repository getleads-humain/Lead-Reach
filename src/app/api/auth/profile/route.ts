/**
 * LeadReach — Auth Profile API Endpoint
 * ========================================
 * Server-side profile CRUD operations using service_role key.
 * This bypasses RLS issues that occur with client-side Supabase queries.
 *
 * GET    /api/auth/profile     — Fetch the authenticated user's profile
 * POST   /api/auth/profile     — Create a profile if one doesn't exist (ensure)
 * PATCH  /api/auth/profile     — Update the authenticated user's profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// Service-role client for bypassing RLS
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * GET /api/auth/profile
 * Fetch the authenticated user's profile from the profiles table.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Try fetching with authenticated client first
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Fallback: use service_role client
      const serviceClient = getServiceClient();
      const { data: svcProfile, error: svcError } = await serviceClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (svcError) {
        console.error('Profile fetch error (service_role):', svcError);
        // Profile doesn't exist yet — return null profile
        return NextResponse.json({ profile: null, message: 'Profile not found' });
      }

      return NextResponse.json({ profile: svcProfile });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('GET /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/auth/profile
 * Create a profile for the authenticated user if one doesn't exist.
 * This is the "ensure profile" endpoint — safe to call multiple times.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body: { email?: string; full_name?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is fine
    }

    const serviceClient = getServiceClient();

    // Check if profile already exists
    const { data: existing, error: checkError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (existing) {
      // Profile already exists — return it
      return NextResponse.json({ profile: existing, created: false });
    }

    // Create the profile
    const newProfile = {
      id: user.id,
      email: body.email || user.email || '',
      full_name: body.full_name || user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      onboarding_complete: false,
      onboarding_step: 0,
      plan: 'free',
      plan_tier: 'scout',
    };

    const { data: created, error: createError } = await serviceClient
      .from('profiles')
      .insert(newProfile)
      .select()
      .single();

    if (createError) {
      console.error('Profile creation error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Also create user_settings if missing
    const { error: settingsError } = await serviceClient
      .from('user_settings')
      .upsert({ id: user.id }, { onConflict: 'id' });

    if (settingsError) {
      console.error('User settings creation error:', settingsError);
      // Non-fatal — profile is the critical one
    }

    return NextResponse.json({ profile: created, created: true });
  } catch (err) {
    console.error('POST /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/auth/profile
 * Update the authenticated user's profile.
 * Uses service_role client to bypass RLS issues.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const updates = await request.json();

    // Sanitize: only allow updating specific fields
    const allowedFields = [
      'full_name', 'avatar_url', 'company_name', 'job_title', 'phone',
      'industry', 'company_size', 'website', 'location', 'bio',
      'onboarding_complete', 'onboarding_step', 'plan', 'plan_tier',
      'stripe_customer_id',
    ];

    const sanitizedUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) {
        sanitizedUpdates[key] = updates[key];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Always update the updated_at timestamp
    sanitizedUpdates.updated_at = new Date().toISOString();

    const serviceClient = getServiceClient();

    // First, ensure the profile exists
    const { data: existing } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existing) {
      // Profile doesn't exist — create it first with the updates
      const newProfile = {
        id: user.id,
        email: user.email || '',
        full_name: sanitizedUpdates.full_name || user.user_metadata?.full_name || '',
        avatar_url: sanitizedUpdates.avatar_url || user.user_metadata?.avatar_url || '',
        onboarding_complete: sanitizedUpdates.onboarding_complete ?? false,
        onboarding_step: sanitizedUpdates.onboarding_step ?? 0,
        plan: sanitizedUpdates.plan || 'free',
        plan_tier: sanitizedUpdates.plan_tier || 'scout',
        ...sanitizedUpdates,
      };

      const { data: created, error: createError } = await serviceClient
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('Profile create-on-update error:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ profile: created });
    }

    // Profile exists — update it
    const { data: updated, error: updateError } = await serviceClient
      .from('profiles')
      .update(sanitizedUpdates)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: updated });
  } catch (err) {
    console.error('PATCH /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
