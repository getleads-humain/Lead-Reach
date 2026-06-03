/**
 * LeadReach — Usage Tracking API
 * ================================
 * Returns the user's current resource usage counts against their plan limits.
 * Counts leads, campaigns, agents, etc. from the local SQLite database.
 *
 * SECURITY: Uses createServiceClient() which returns null when env vars
 * are missing, preventing runtime crashes from undefined credentials.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { getPlanById, getFeatureAccess } from '@/lib/plans';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
