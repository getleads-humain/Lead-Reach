'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { CampaignsView } from '@/components/campaigns/campaigns-view';
import { LeadsView } from '@/components/leads/leads-view';
import { AgentsView } from '@/components/agents/agents-view';
import { OutreachView } from '@/components/outreach/outreach-view';
import { ReportsView } from '@/components/reports/reports-view';
import { useAppStore } from '@/lib/store';

export default function AppPage() {
  const { activeView } = useAppStore();

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
      case 'outreach':
        return <OutreachView />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView />;
    }
  };

  return <AppShell>{renderView()}</AppShell>;
}
