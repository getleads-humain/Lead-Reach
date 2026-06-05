'use client';

/**
 * LeadReach — App Page (Authenticated Dashboard)
 * ==================================================
 * Main app page with auth guard and plan-based feature gating.
 * Redirects unauthenticated users to /login and ensures
 * profile is loaded before rendering the app shell.
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
import { usePlanAccess, type ViewType } from '@/hooks/use-plan-access';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
import { Zap, Loader2 } from 'lucide-react';

/** Map views to the plan required to access them */
const VIEW_UPGRADE_MAP: Record<string, { feature: string; requiredPlanId: string }> = {
  'agents': { feature: 'AI Agents', requiredPlanId: 'command' },
  'setter': { feature: 'AI Setter', requiredPlanId: 'command' },
  'booking': { feature: 'Bookings', requiredPlanId: 'command' },
  'messaging': { feature: 'Messaging', requiredPlanId: 'command' },
  'analytics': { feature: 'Analytics', requiredPlanId: 'command' },
};

export default function AppPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { activeView } = useAppStore();
  const { canAccess } = usePlanAccess();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      router.push('/login');
    }
  }, [hydrated, authLoading, user, router]);

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (hydrated && !authLoading && user && profile && !profile.onboarding_complete) {
      router.push('/onboarding');
    }
  }, [hydrated, authLoading, user, profile, router]);

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
            Loading your workspace...
          </div>
        </div>
      </div>
    );
  }

  // If user exists but profile is missing, try to create it
  if (!user || !profile) {
    if (user && !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background noise-bg">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Zap className="h-6 w-6 text-black" />
            </div>
            <p className="text-sm text-muted-foreground">Setting up your account...</p>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, full_name: user.user_metadata?.full_name || '' }),
                  });
                  if (res.ok) {
                    window.location.reload();
                  }
                } catch {
                  // Will retry on next load
                }
              }}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Retry Setup
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const renderView = () => {
    // Check if the user has access to this view
    const upgradeInfo = VIEW_UPGRADE_MAP[activeView];
    if (upgradeInfo && !canAccess(activeView as ViewType)) {
      return (
        <UpgradePrompt
          feature={upgradeInfo.feature}
          requiredPlanId={upgradeInfo.requiredPlanId}
          asOverlay
        />
      );
    }

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
