'use client';

/**
 * LeadReach — Platform Page (Authenticated Console)
 * ==================================================
 * Full platform console with the complete tool set.
 * Auth is enforced by the proxy (src/proxy.ts → supabase-middleware):
 * unauthenticated visitors are redirected to /login before this page
 * ever renders. Every sidebar tool renders through the shared
 * PlatformView renderer so all 17 tools work here.
 */

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PlatformView } from '@/components/layout/platform-views';
import { useAppStore } from '@/lib/store';

export default function PlatformPage() {
  const { activeView } = useAppStore();

  return <AppShell><PlatformView view={activeView} /></AppShell>;
}
