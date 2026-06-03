/**
 * LeadReach — Auth Profile API Route
 * =====================================
 * GET: Fetch user profile
 * POST: Create profile if missing
 * PATCH: Update user profile
 *
 * SECURITY: Never calls Supabase clients without first validating env vars.
 * Returns 503 when Supabase is not configured.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';

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

    const { data: profile, error } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('GET /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service not configured. Admin features require SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

    const { data: profile, error } = await serviceClient
      .from('profiles')
      .upsert({
        id: user.id,
        email: body.email || user.email,
        full_name: body.full_name || '',
        plan: 'free',
        plan_tier: 'launchpad',
        onboarding_complete: false,
        onboarding_step: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Profile create error:', error);
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('POST /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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

    const updates = await request.json();
    const serviceClient = createServiceClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: 'Service not configured. Admin features require SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

    const { data: profile, error } = await serviceClient
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('PATCH /api/auth/profile error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
