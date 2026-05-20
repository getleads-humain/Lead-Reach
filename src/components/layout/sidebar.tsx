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
  Heart,
  Calendar,
  MessageCircle,
  TrendingUp,
  Database,
  Telescope,
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
  { view: 'prospect-discovery', label: 'Prospect Discovery', icon: Telescope },
  { view: 'campaigns', label: 'Campaigns', icon: Target },
  { view: 'leads', label: 'Leads', icon: Users },
  { view: 'data-enrichment', label: 'Enrichment', icon: Database },
  { view: 'agents', label: 'Agents', icon: Bot },
  { view: 'setter', label: 'AI Setter', icon: Heart },
  { view: 'booking', label: 'Bookings', icon: Calendar },
  { view: 'messaging', label: 'Messaging', icon: MessageCircle },
  { view: 'outreach', label: 'Outreach', icon: Mail },
  { view: 'analytics', label: 'Analytics', icon: TrendingUp },
  { view: 'reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 glow-emerald-sm">
            <Zap className="h-4 w-4 text-black" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight">
              LeadReach <span className="text-gradient">AI</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          const button = (
            <Button
              key={item.view}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3 transition-all duration-200 rounded-lg',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-400 glow-border'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent',
                sidebarCollapsed && 'justify-center px-2'
              )}
              onClick={() => setActiveView(item.view)}
            >
              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors duration-200',
                isActive ? 'text-emerald-400' : ''
              )} />
              {!sidebarCollapsed && (
                <span className={cn('truncate text-sm', isActive ? 'font-semibold' : 'font-medium')}>
                  {item.label}
                </span>
              )}
            </Button>
          );

          if (sidebarCollapsed) {
            return (
              <Tooltip key={item.view} delayDuration={0}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-border">{item.label}</TooltipContent>
              </Tooltip>
            );
          }

          return button;
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
