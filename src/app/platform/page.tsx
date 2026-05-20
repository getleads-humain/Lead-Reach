'use client';

import React from 'react';
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
import { useAppStore } from '@/lib/store';

export default function PlatformPage() {
  const { activeView } = useAppStore();

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'prospect-discovery':
        return <ProspectDiscoveryView />;
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
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
