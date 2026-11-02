'use client';

/**
 * LeadReach — Shared Platform View Renderer
 * ===========================================
 * Single source of truth for mapping sidebar ViewType → view component.
 *
 * WHY THIS EXISTS:
 * Previously /app, /platform and /portal each kept their own switch
 * statement, and /platform + /portal were missing cases (Ask AI, ICP
 * Builder, Connectors, AI Workforce, Token Registry, Identity,
 * Campaign Detail) — clicking those sidebar tools silently rendered
 * the Dashboard instead of the tool. All three shells now render
 * through this one renderer, so every tool in the left-side panel
 * works on every authenticated page.
 */

import React from 'react';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { CampaignsView } from '@/components/campaigns/campaigns-view';
import { CampaignDetailView } from '@/components/campaigns/campaign-detail-view';
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
import { AIAssistantView } from '@/components/ai-assistant/ai-assistant-view';
import { ConnectorsView } from '@/components/connectors/connectors-view';
import { WorkforceView } from '@/components/workforce/workforce-view';
import { TokenRegistry } from '@/components/tokens/token-registry';
import type { ViewType } from '@/lib/types';

export function PlatformView({ view }: { view: ViewType }) {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'campaigns':
      return <CampaignsView />;
    case 'campaign-detail':
      return <CampaignDetailView />;
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
    case 'ai-assistant':
      return <AIAssistantView />;
    case 'connectors':
      return <ConnectorsView />;
    case 'workforce':
      return <WorkforceView />;
    case 'tokens':
      return <TokenRegistry />;
    case 'knowledge':
      // Knowledge is a standalone page (/knowledge) — sidebar never sets
      // this view, but fall through gracefully if it ever does.
      return <DashboardView />;
    default:
      return <DashboardView />;
  }
}
