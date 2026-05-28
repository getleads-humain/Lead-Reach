'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/auth/auth-provider';
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
  Crosshair,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

interface NavItem {
  view: ViewType | 'settings';
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'prospect-discovery', label: 'Prospect Discovery', icon: Telescope },
  { view: 'icp', label: 'ICP Builder', icon: Crosshair },
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
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

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
              onClick={() => setActiveView(item.view as ViewType)}
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

      {/* User Info + Collapse */}
      <div className="border-t border-sidebar-border">
        {/* Settings Link */}
        {!sidebarCollapsed && (
          <div className="px-2 pt-2">
            <Link href="/settings">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-lg"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </Button>
            </Link>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="px-2 pt-2">
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/settings">
                  <Button
                    variant="ghost"
                    className="w-full justify-center px-2 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">Settings</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* User Avatar */}
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2.5 px-4 py-2 border-t border-sidebar-border">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</div>
              <div className="text-[10px] text-sidebar-foreground/40 truncate">{profile?.plan_tier || 'Free'}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-sidebar-foreground/40 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="p-2">
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
      </div>
    </aside>
  );
}
