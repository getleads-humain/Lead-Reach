'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import type { ViewType } from '@/lib/types';
import {
  LayoutDashboard,
  Target,
  Users,
  Bot,
  Mail,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'campaigns', label: 'Campaigns', icon: Target },
  { view: 'leads', label: 'Leads', icon: Users },
  { view: 'agents', label: 'Agents', icon: Bot },
  { view: 'outreach', label: 'Outreach', icon: Mail },
  { view: 'reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-base font-bold tracking-tight">
              LeadReach <span className="text-emerald-500">AI</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const button = (
            <Button
              key={item.view}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 transition-all',
                isActive && 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15 hover:text-emerald-600',
                sidebarCollapsed && 'justify-center px-2'
              )}
              onClick={() => setActiveView(item.view)}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-emerald-500')} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Button>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.view} delayDuration={0}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
