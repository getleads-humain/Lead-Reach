/**
 * LeadReach — Server-Side Plan Gate
 * ====================================
 * Utility for checking plan access in API routes.
 * Returns the user's profile and feature access, or an error response.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getFeatureAccess, getPlanById } from '@/lib/plans';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export interface PlanCheckResult {
  authorized: true;
  userId: string;
  profile: Record<string, any>;
  planId: string;
  featureAccess: ReturnType<typeof getFeatureAccess>;
}

export interface PlanCheckError {
  authorized: false;
  response: NextResponse;
}

/**
 * Check if the authenticated user has access to a feature.
 * Use in API route handlers to gate features by plan.
 *
 * @param feature - The feature key to check (e.g., 'agents', 'setter', 'analytics')
 * @returns PlanCheckResult if authorized, PlanCheckError if not
 */
export async function requirePlanAccess(
  feature: string
): Promise<PlanCheckResult | PlanCheckError> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
      };
    }

    const serviceClient = getServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 }),
      };
    }

    const planId = profile?.plan_tier || 'scout';
    const featureAccess = getFeatureAccess(planId);

    // Check if the feature is accessible
    const accessibleViews = featureAccess.views;
    if (!accessibleViews.includes(feature)) {
      const plan = getPlanById(planId);
      const requiredGrade = getRequiredGrade(feature);
      const upgradePlan = getUpgradePlan(requiredGrade, plan?.track || 'b2b');

      return {
        authorized: false,
        response: NextResponse.json({
          error: 'Plan upgrade required',
          feature,
          currentPlan: planId,
          currentGrade: plan?.grade,
          requiredGrade,
          upgradeTo: upgradePlan,
          message: `${feature} requires the ${upgradePlan} plan or higher. Please upgrade to access this feature.`,
        }, { status: 403 }),
      };
    }

    return {
      authorized: true,
      userId: user.id,
      profile,
      planId,
      featureAccess,
    };
  } catch (err) {
    console.error('Plan gate error:', err);
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Internal server error' }, { status: 500 }),
    };
  }
}

/**
 * Check if the user can create more of a resource based on their plan limits.
 */
export async function requireResourceLimit(
  resource: 'campaigns' | 'leads' | 'agents' | 'setters' | 'teamMembers',
  currentCount: number
): Promise<PlanCheckResult | PlanCheckError> {
  const result = await requirePlanAccess(resource);

  if (!result.authorized) return result;

  const limitMap: Record<string, number> = {
    campaigns: result.featureAccess.maxCampaigns,
    leads: result.featureAccess.maxLeads,
    agents: result.featureAccess.maxAgents,
    setters: result.featureAccess.maxSetters,
    teamMembers: result.featureAccess.maxTeamMembers,
  };

  const limit = limitMap[resource];
  if (limit !== -1 && currentCount >= limit) {
    return {
      authorized: false,
      response: NextResponse.json({
        error: 'Resource limit reached',
        resource,
        current: currentCount,
        limit,
        message: `You've reached your ${resource} limit (${limit}). Please upgrade your plan to create more.`,
      }, { status: 403 }),
    };
  }

  return result;
}

// Helper: determine minimum grade for a feature
function getRequiredGrade(feature: string): 'standard' | 'professional' | 'enterprise' {
  const professionalFeatures = ['agents', 'setter', 'booking', 'messaging', 'analytics'];
  if (professionalFeatures.includes(feature)) return 'professional';
  return 'standard';
}

// Helper: get the upgrade plan name for a given grade and track
function getUpgradePlan(grade: 'standard' | 'professional' | 'enterprise', track: 'b2b' | 'b2c'): string {
  if (track === 'b2c') {
    if (grade === 'professional') return 'Closer';
    if (grade === 'enterprise') return 'Agency';
    return 'Setter';
  }
  if (grade === 'professional') return 'Command';
  if (grade === 'enterprise') return 'Enterprise';
  return 'Scout';
}
