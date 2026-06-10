'use client';

/**
 * LeadReach — Plan Access Hook
 * ==============================
 * Client-side hook for checking feature access based on the user's current plan.
 * Used to gate features, show upgrade prompts, and limit functionality.
 */

import { useMemo } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { getFeatureAccess, getPlanById, PLANS } from '@/lib/plans';

export type ViewType =
  | 'dashboard'
  | 'prospect-discovery'
  | 'icp'
  | 'campaigns'
  | 'leads'
  | 'data-enrichment'
  | 'agents'
  | 'setter'
  | 'booking'
  | 'messaging'
  | 'outreach'
  | 'analytics'
  | 'reports'
  | 'vellum';

export interface PlanAccessResult {
  /** Whether the user can access the given view */
  canAccess: (view: ViewType) => boolean;
  /** The user's current plan tier ID (e.g. 'scout', 'command') */
  currentPlanId: string;
  /** The user's current plan definition */
  currentPlan: ReturnType<typeof getPlanById>;
  /** Whether the user is on the free plan */
  isFreePlan: boolean;
  /** Whether the user is on a trial */
  isTrial: boolean;
  /** Whether the user is on a lifetime plan */
  isLifetime: boolean;
  /** Feature access limits for the current plan */
  limits: ReturnType<typeof getFeatureAccess>;
  /** Get the minimum plan grade required to access a view */
  requiredPlanForView: (view: ViewType) => ReturnType<typeof getPlanById>;
  /** Check if the user can create more of a resource */
  canCreateMore: (resource: 'campaigns' | 'leads' | 'agents' | 'setters' | 'teamMembers', currentCount: number) => boolean;
  /** Usage percentage for a resource (0-100, -1 for unlimited) */
  usagePercent: (resource: 'campaigns' | 'leads' | 'agents' | 'setters' | 'teamMembers', currentCount: number) => number;
}

// Map each view to the minimum plan grade required
const VIEW_MIN_GRADE: Record<ViewType, 'free' | 'standard' | 'professional' | 'enterprise'> = {
  'dashboard': 'free',
  'prospect-discovery': 'free',
  'icp': 'free',
  'leads': 'free',
  'reports': 'free',
  'campaigns': 'free',
  'vellum': 'free',
  'outreach': 'standard',
  'data-enrichment': 'standard',
  'agents': 'professional',
  'setter': 'professional',
  'booking': 'professional',
  'messaging': 'professional',
  'analytics': 'professional',
};

// Map grade to the first plan at that grade
const GRADE_TO_PLAN: Record<string, string> = {
  'free': 'launchpad',       // B2B free
  'standard': 'scout',       // B2B standard
  'professional': 'command', // B2B professional
  'lifetime': 'founders-pass', // B2B lifetime
  'enterprise': 'enterprise',  // B2B enterprise
};

export function usePlanAccess(): PlanAccessResult {
  const { profile } = useAuth();

  const currentPlanId = profile?.plan_tier || 'launchpad';
  const currentPlan = getPlanById(currentPlanId);
  const isFreePlan = !profile?.plan || profile.plan === 'free' || currentPlanId === 'launchpad';
  const isTrial = profile?.plan === 'trial';
  const isLifetime = currentPlanId === 'founders-pass' || currentPlan?.grade === 'lifetime';
  const limits = getFeatureAccess(currentPlanId);

  const canAccess = useMemo(() => {
    return (view: ViewType): boolean => {
      return limits.views.includes(view);
    };
  }, [limits.views]);

  const requiredPlanForView = useMemo(() => {
    return (view: ViewType) => {
      const minGrade = VIEW_MIN_GRADE[view];
      const planId = GRADE_TO_PLAN[minGrade];
      return getPlanById(planId);
    };
  }, []);

  const canCreateMore = useMemo(() => {
    return (resource: 'campaigns' | 'leads' | 'agents' | 'setters' | 'teamMembers', currentCount: number): boolean => {
      const limitMap: Record<string, number> = {
        campaigns: limits.maxCampaigns,
        leads: limits.maxLeads,
        agents: limits.maxAgents,
        setters: limits.maxSetters,
        teamMembers: limits.maxTeamMembers,
      };
      const limit = limitMap[resource];
      if (limit === -1) return true; // unlimited
      return currentCount < limit;
    };
  }, [limits]);

  const usagePercent = useMemo(() => {
    return (resource: 'campaigns' | 'leads' | 'agents' | 'setters' | 'teamMembers', currentCount: number): number => {
      const limitMap: Record<string, number> = {
        campaigns: limits.maxCampaigns,
        leads: limits.maxLeads,
        agents: limits.maxAgents,
        setters: limits.maxSetters,
        teamMembers: limits.maxTeamMembers,
      };
      const limit = limitMap[resource];
      if (limit === -1) return -1; // unlimited
      if (limit === 0) return 100;
      return Math.min(100, Math.round((currentCount / limit) * 100));
    };
  }, [limits]);

  return {
    canAccess,
    currentPlanId,
    currentPlan,
    isFreePlan,
    isTrial,
    isLifetime,
    limits,
    requiredPlanForView,
    canCreateMore,
    usagePercent,
  };
}
