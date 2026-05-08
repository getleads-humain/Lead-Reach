'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { cn } from '@/lib/utils';
import { safeFetchJSON } from '@/lib/utils';
import type { CampaignWithCounts } from '@/lib/types';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded) {
      // Only seed if no campaigns exist yet (first-time setup)
      safeFetchJSON<CampaignWithCounts[]>('/api/campaigns')
        .then((campaigns) => {
          if (campaigns.length === 0) {
            // No data yet — seed demo data
            return safeFetchJSON<{ success?: boolean; counts?: Record<string, number> }>('/api/seed', { method: 'POST' });
          }
          return null;
        })
        .then((data) => {
          if (data && (data as { success?: boolean }).success) {
            console.log('Demo data seeded:', (data as { counts?: Record<string, number> }).counts);
          }
        })
        .catch((err) => console.error('Seed error:', err))
        .finally(() => setSeeded(true));
    }
  }, [seeded]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background noise-bg">
        <Sidebar />
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-16' : 'ml-60'
          )}
        >
          <TopBar />
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
