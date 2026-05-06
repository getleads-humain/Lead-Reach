'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Sidebar } from './sidebar';
import { TopBar } from './top-bar';
import { cn } from '@/lib/utils';
import { TooltipProvider } from '@/components/ui/tooltip';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded) {
      fetch('/api/seed', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log('Demo data seeded:', data.counts);
          }
        })
        .catch((err) => console.error('Seed error:', err))
        .finally(() => setSeeded(true));
    }
  }, [seeded]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div
          className={cn(
            'transition-all duration-300',
            sidebarCollapsed ? 'ml-16' : 'ml-60'
          )}
        >
          <TopBar />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
