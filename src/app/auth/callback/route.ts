/**
 * LeadReach — Auth Callback Route
 * =================================
 * Handles OAuth code exchange and ensures profile exists.
 * After successful authentication, redirects to onboarding or portal.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Ensure profile exists (fallback if trigger didn't fire)
        const serviceClient = getServiceClient();
        const { data: existingProfile } = await serviceClient
          .from('profiles')
          .select('id, onboarding_complete')
          .eq('id', user.id)
          .single();

        if (!existingProfile) {
          // Create profile if missing
          await serviceClient
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              avatar_url: user.user_metadata?.avatar_url || '',
              onboarding_complete: false,
              onboarding_step: 0,
              plan: 'free',
              plan_tier: 'scout',
            });

          // Also create user_settings
          await serviceClient
            .from('user_settings')
            .upsert({ id: user.id }, { onConflict: 'id' });

          // Redirect to onboarding since profile was just created
          return NextResponse.redirect(`${origin}/onboarding`);
        }

        // If profile exists and onboarding is complete, go to portal
        if (existingProfile.onboarding_complete) {
          return NextResponse.redirect(`${origin}/portal`);
        }

        // Otherwise, go to onboarding or the next param
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
