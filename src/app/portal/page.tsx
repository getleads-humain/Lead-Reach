'use client';

/**
 * LeadReach — User Portal (Authenticated Dashboard)
 * ====================================================
 * This is the private user portal that mirrors /app but with
 * user-specific data from Supabase. All data is scoped to the
 * authenticated user via user_id foreign keys.
 *
 * The portal uses the same AppShell + Zustand view system as /app,
 * but adds an AuthGuard wrapper and user-specific context.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { AppShell } from '@/components/layout/app-shell';
import { PlatformView } from '@/components/layout/platform-views';
import { useAppStore } from '@/lib/store';
import { Zap, Loader2 } from 'lucide-react';

export default function PortalPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const { activeView } = useAppStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  // ── FIX: Guard against transient auth state during token refresh ──
  const [stableAuthChecked, setStableAuthChecked] = useState(false);
  const authCheckTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!authLoading && hydrated) {
      if (authCheckTimerRef.current) clearTimeout(authCheckTimerRef.current);
      authCheckTimerRef.current = setTimeout(() => {
        setStableAuthChecked(true);
      }, 100);
    }
    return () => {
      if (authCheckTimerRef.current) clearTimeout(authCheckTimerRef.current);
    };
  }, [authLoading, hydrated]);

  useEffect(() => {
    if (hydrated && stableAuthChecked && !user) {
      router.replace('/login');
    }
  }, [hydrated, stableAuthChecked, user, router]);

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (hydrated && stableAuthChecked && user && profile && !profile.onboarding_complete) {
      router.replace('/onboarding');
    }
  }, [hydrated, stableAuthChecked, user, profile, router]);

  // Show loading while auth state resolves
  if (authLoading || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background noise-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 glow-emerald animate-pulse">
            <Zap className="h-6 w-6 text-emerald-950 dark:text-white" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your portal...
          </div>
        </div>
      </div>
    );
  }

  // Show proper error state when profile is missing but user exists
  if (!user || !profile) {
    // If user exists but profile is missing, try to create it
    if (user && !profile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background noise-bg">
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Zap className="h-6 w-6 text-emerald-950 dark:text-white" />
            </div>
            <p className="text-sm text-muted-foreground">Setting up your account...</p>
            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/auth/profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, full_name: user.user_metadata?.full_name || '' }),
                  });
                  if (res.ok) {
                    window.location.reload();
                  }
                } catch {
                  // Will retry on next load
                }
              }}
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-emerald-950 dark:text-white"
            >
              Retry Setup
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const renderView = () => {
    // All 17 sidebar tools render through the shared renderer
    return <PlatformView view={activeView} />;
  };

  return <AppShell>{renderView()}</AppShell>;
}
