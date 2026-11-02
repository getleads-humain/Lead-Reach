'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import type { ViewType } from '@/lib/types';
import { useAuth } from '@/components/auth/auth-provider';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { UpgradePrompt } from '@/components/billing/upgrade-prompt';
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
  Lock,
  Crown,
  Sparkles,
  Brain,
  Sun,
  Moon,
  Monitor,
  Plug,
  Briefcase,
  Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { getPlanById } from '@/lib/plans';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface NavItem {
  view: ViewType;
  label: string;
  icon: React.ElementType;
  /** Minimum plan grade required: 'standard' = Scout/Setter, 'professional' = Command/Closer */
  minGrade: 'standard' | 'professional';
  /** Which plan to recommend for upgrade */
  upgradePlanId: string;
}

const navItems: NavItem[] = [
  { view: 'ai-assistant', label: 'Ask AI', icon: Sparkles, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'prospect-discovery', label: 'Prospect Discovery', icon: Telescope, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'icp', label: 'ICP Builder', icon: Crosshair, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'campaigns', label: 'Campaigns', icon: Target, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'leads', label: 'Leads', icon: Users, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'data-enrichment', label: 'Enrichment', icon: Database, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'connectors', label: 'Connectors', icon: Plug, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'agents', label: 'Agents', icon: Bot, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'workforce', label: 'AI Workforce', icon: Briefcase, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'tokens', label: 'Token Registry', icon: Boxes, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'setter', label: 'AI Setter', icon: Heart, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'booking', label: 'Bookings', icon: Calendar, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'messaging', label: 'Messaging', icon: MessageCircle, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'outreach', label: 'Outreach', icon: Mail, minGrade: 'standard', upgradePlanId: 'scout' },
  { view: 'analytics', label: 'Analytics', icon: TrendingUp, minGrade: 'professional', upgradePlanId: 'command' },
  { view: 'reports', label: 'Reports', icon: BarChart3, minGrade: 'standard', upgradePlanId: 'scout' },
];

export function Sidebar() {
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { canAccess, currentPlanId, isFreePlan } = usePlanAccess();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentPlan = getPlanById(currentPlanId);

  const cycleTheme = () => {
    if (resolvedTheme === 'dark') {
      setTheme('light');
    } else if (resolvedTheme === 'light') {
      setTheme('system');
    } else {
      setTheme('dark');
    }
  };

  const themeIcon = resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor;

  const handleNavClick = (item: NavItem) => {
    if (canAccess(item.view as any)) {
      setActiveView(item.view);
    }
    // If not accessible, the UpgradePrompt dialog will handle it
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 hidden md:flex dark:shadow-[1px_0_25px_rgba(0,0,0,0.5)]',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 glow-emerald-sm">
            <Zap className="h-4 w-4 text-emerald-950 dark:text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-sm font-bold tracking-tight">
              LeadReach <span className="text-gradient">AI</span>
            </span>
          )}
        </div>
      </div>

      {/* Plan Badge */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-3 pb-1">
          <Link href="/settings">
            <div className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer",
              isFreePlan
                ? "border-border/30 bg-secondary/20 hover:bg-secondary/30"
                : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
            )}>
              <Crown className={cn("h-3.5 w-3.5", isFreePlan ? "text-muted-foreground" : "text-emerald-400")} />
              <span className={cn("text-[11px] font-medium", isFreePlan ? "text-muted-foreground" : "text-emerald-400")}>
                {currentPlan?.displayName || 'Free'} Plan
              </span>
              {isFreePlan && (
                <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1 py-0 h-3.5">
                  Upgrade
                </Badge>
              )}
            </div>
          </Link>
        </div>
      )}

      {/* AI Activation Hub — special public link at the top */}
      <div className="px-2 pb-2 border-b border-sidebar-border">
        <Link
          href="/ai-hub"
          target="_blank"
          className="flex items-center gap-2.5 rounded-md bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 px-3 py-2 text-sm font-medium transition-colors border border-purple-200/50 dark:border-purple-500/20"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-pink-500">
            <Brain className="h-4 w-4 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span>AI Hub</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-3.5">NEW</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">24 AI features</p>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;
          const isLocked = !canAccess(item.view as any);

          // Locked item wraps in UpgradePrompt dialog
          if (isLocked) {
            const lockedButton = (
              <Button
                key={item.view}
                variant="ghost"
                className={cn(
                  'w-full justify-start gap-3 transition-all duration-200 rounded-lg group',
                  'text-sidebar-foreground/40 hover:text-sidebar-foreground/60 hover:bg-sidebar-accent/50',
                  sidebarCollapsed && 'justify-center px-2'
                )}
                onClick={() => handleNavClick(item)}
              >
                <span className="relative">
                  <Icon className="h-4 w-4 shrink-0 transition-colors duration-200 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/50" />
                  <Lock className="absolute -top-1 -right-1 h-2.5 w-2.5 text-muted-foreground/50" />
                </span>
                {!sidebarCollapsed && (
                  <span className="truncate text-sm font-medium text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60">
                    {item.label}
                  </span>
                )}
                {!sidebarCollapsed && (
                  <Badge className="ml-auto bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] px-1.5 py-0 h-4 opacity-60 group-hover:opacity-100 transition-opacity">
                    PRO
                  </Badge>
                )}
              </Button>
            );

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.view} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div>
                      <UpgradePrompt
                        feature={item.label}
                        requiredPlanId={item.upgradePlanId}
                      >
                        {lockedButton}
                      </UpgradePrompt>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-popover border-border">
                    {item.label} (Pro)
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <UpgradePrompt
                key={item.view}
                feature={item.label}
                requiredPlanId={item.upgradePlanId}
              >
                {lockedButton}
              </UpgradePrompt>
            );
          }

          // Accessible item
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

      {/* Upgrade CTA (only for free/standard plans) */}
      {!sidebarCollapsed && (isFreePlan || currentPlan?.grade === 'standard') && (
        <div className="px-3 pb-2">
          <Link href="/pricing">
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:from-emerald-500/10 transition-all cursor-pointer">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Upgrade Plan</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Unlock AI Agents, Setter, Bookings & more with Command plan.
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* Knowledge Base Admin — internal tool */}
      {!sidebarCollapsed && (
        <div className="px-2 pb-1">
          <Link
            href="/knowledge"
            target="_blank"
            className="flex items-center gap-2.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/40 border border-dashed border-sidebar-border/40"
          >
            <Database className="h-3.5 w-3.5" />
            <span className="truncate">Knowledge Base Admin</span>
          </Link>
        </div>
      )}

      {/* Collapse Toggle + Theme Toggle */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {/* Theme Toggle */}
        {mounted && (
          sidebarCollapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={cycleTheme}
                >
                  {React.createElement(themeIcon, { className: 'h-4 w-4' })}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-popover border-border">
                {resolvedTheme === 'dark' ? 'Dark' : resolvedTheme === 'light' ? 'Light' : 'System'} mode
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1 px-1">
              {(['light', 'dark', 'system'] as const).map((mode) => {
                const modeIcon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor;
                const isActive = theme === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200 flex-1 justify-center',
                      isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shadow-sm'
                        : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
                    )}
                  >
                    {React.createElement(modeIcon, { className: 'h-3 w-3' })}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                );
              })}
            </div>
          )
        )}

        {/* Collapse Toggle */}
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
