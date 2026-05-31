/**
 * LeadReach — Usage Tracking API
 * ================================
 * Returns the user's current resource usage counts against their plan limits.
 * Counts leads, campaigns, agents, etc. from the local SQLite database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getPlanById, getFeatureAccess } from '@/lib/plans';
import { PrismaClient } from '@prisma/client';

function getServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

const prisma = new PrismaClient();

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const serviceClient = getServiceClient();
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('plan_tier, plan')
      .eq('id', user.id)
      .single();

    const planId = profile?.plan_tier || 'scout';
    const featureAccess = getFeatureAccess(planId);

    // Count resources from local database
    const [
      leadCount,
      campaignCount,
      activeAgentTaskCount,
      setterCount,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.campaign.count({
        where: { status: { in: ['active', 'running'] } },
      }),
      prisma.agentTask.count({
        where: { status: { in: ['running', 'pending'] } },
      }),
      prisma.aISetter.count({
        where: { status: 'active' },
      }),
    ]);

    return NextResponse.json({
      usage: {
        leads: leadCount,
        campaigns: campaignCount,
        agents: activeAgentTaskCount,
        setters: setterCount,
      },
      limits: {
        maxLeads: featureAccess.maxLeads,
        maxCampaigns: featureAccess.maxCampaigns,
        maxAgents: featureAccess.maxAgents,
        maxSetters: featureAccess.maxSetters,
        maxTeamMembers: featureAccess.maxTeamMembers,
      },
      plan: {
        id: planId,
        tier: profile?.plan || 'free',
      },
    });
  } catch (err) {
    console.error('GET /api/stripe/usage error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
