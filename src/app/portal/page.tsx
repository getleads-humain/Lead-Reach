'use client';

/**
 * LeadReach — User Portal (Authenticated Dashboard)
 * ====================================================
 * This is the private user portal that mirrors /app but with
 * user-specific data from Supabase. All data is scoped to the
 * authenticated user via user_id foreign keys.
 *
 * The portal uses the same AppShell + Zustand view system as /app,
 * but adds an AuthGuard wrapper and user-specific context.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { CampaignsView } from '@/components/campaigns/campaigns-view';
import { LeadsView } from '@/components/leads/leads-view';
import { AgentsView } from '@/components/agents/agents-view';
import { OutreachView } from '@/components/outreach/outreach-view';
import { ReportsView } from '@/components/reports/reports-view';
import { SetterView } from '@/components/setter/setter-view';
import { BookingView } from '@/components/booking/booking-view';
import { MessagingView } from '@/components/messaging/messaging-view';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { DataEnrichmentView } from '@/components/data-enrichment/data-enrichment-view';
import { ProspectDiscoveryView } from '@/components/prospect-discovery/prospect-discovery-view';
import { IdentityView } from '@/components/identity/identity-view';
import { ICPView } from '@/components/icp/icp-view';
import { useAppStore } from '@/lib/store';
import { Zap, Loader2 } from 'lucide-react';

export default function PortalPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { activeView } = useAppStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      router.push('/login');
    }
  }, [hydrated, authLoading, user, router]);

  // Show loading while auth state resolves
  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background noise-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 glow-emerald animate-pulse">
            <Zap className="h-6 w-6 text-black" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your portal...
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'campaigns':
        return <CampaignsView />;
      case 'leads':
        return <LeadsView />;
      case 'agents':
        return <AgentsView />;
      case 'setter':
        return <SetterView />;
      case 'booking':
        return <BookingView />;
      case 'messaging':
        return <MessagingView />;
      case 'outreach':
        return <OutreachView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'reports':
        return <ReportsView />;
      case 'data-enrichment':
        return <DataEnrichmentView />;
      case 'prospect-discovery':
        return <ProspectDiscoveryView />;
      case 'identity':
        return <IdentityView />;
      case 'icp':
        return <ICPView />;
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
