'use client';

/**
 * LeadReach — Auth Context Provider
 * ===================================
 * Provides authentication state to the entire app.
 * Uses Supabase Auth with real-time session tracking.
 *
 * Key features:
 * - Session management via @supabase/ssr browser client
 * - Profile operations via server-side API endpoint (bypasses RLS issues)
 * - Auto-creates profile if missing (fallback for trigger failures)
 * - Onboarding state tracking via cookies
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthUserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  job_title: string | null;
  phone: string | null;
  industry: string | null;
  company_size: string | null;
  website: string | null;
  location: string | null;
  bio: string | null;
  onboarding_complete: boolean;
  onboarding_step: number;
  plan: string;
  plan_tier: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: AuthUserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithGitHub: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUserProfile>) => Promise<{ error: string | null }>;
  ensureProfile: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Fetch or create user profile via server-side API.
 * Uses the /api/auth/profile endpoint which has service_role access.
 */
async function serverFetchProfile(userId: string): Promise<AuthUserProfile | null> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      console.error('Server profile fetch failed:', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    return data.profile as AuthUserProfile | null;
  } catch (err) {
    console.error('Server profile fetch error:', err);
    return null;
  }
}

/**
 * Update user profile via server-side API.
 * Uses the /api/auth/profile endpoint which has service_role access,
 * bypassing any RLS issues with client-side Supabase queries.
 */
async function serverUpdateProfile(
  userId: string,
  updates: Partial<AuthUserProfile>
): Promise<{ error: string | null; profile?: AuthUserProfile | null }> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || `Profile update failed (${res.status})` };
    }
    return { error: null, profile: data.profile as AuthUserProfile | null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error updating profile';
    console.error('Server profile update error:', err);
    return { error: message };
  }
}

/**
 * Ensure a profile exists for the current user.
 * Creates one via the server endpoint if missing.
 */
async function serverEnsureProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<{ error: string | null; profile?: AuthUserProfile | null }> {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, full_name: fullName || '' }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || `Profile creation failed (${res.status})` };
    }
    return { error: null, profile: data.profile as AuthUserProfile | null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error creating profile';
    console.error('Server ensure-profile error:', err);
    return { error: message };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const updateOnboardingCookie = useCallback((isComplete: boolean) => {
    document.cookie = `lr_onboarding_done=${isComplete ? 'true' : 'false'}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, []);

  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      // First try server-side fetch (bypasses RLS)
      const p = await serverFetchProfile(userId);
      if (p) {
        setProfile(p);
        updateOnboardingCookie(p.onboarding_complete);
        return p;
      }

      // Fallback: try direct Supabase query from browser client
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Direct profile fetch failed:', error);
        return null;
      }

      const profileData = data as AuthUserProfile;
      setProfile(profileData);
      updateOnboardingCookie(profileData.onboarding_complete);
      return profileData;
    } catch (err) {
      console.error('Profile fetch error:', err);
      return null;
    }
  }, [updateOnboardingCookie]);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchAndSetProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await fetchAndSetProfile(s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAndSetProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Sign in failed' };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) return { error: error.message, needsConfirmation: false };
      const needsConfirmation = !data.session;
      return { error: null, needsConfirmation };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Sign up failed', needsConfirmation: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      document.cookie = 'lr_onboarding_done=; path=/; max-age=0';
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = '/login';
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Google sign in failed' };
    }
  }, []);

  const signInWithGitHub = useCallback(async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'GitHub sign in failed' };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Password reset failed' };
    }
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      return { error: error?.message ?? null };
    } catch (err: unknown) {
      return { error: err instanceof Error ? err.message : 'Password update failed' };
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await fetchAndSetProfile(user.id);
  }, [user, fetchAndSetProfile]);

  /**
   * Update profile via server-side API endpoint.
   * This bypasses RLS issues that can occur with client-side Supabase queries.
   */
  const updateProfile = useCallback(async (updates: Partial<AuthUserProfile>) => {
    if (!user) return { error: 'Not authenticated' };

    const { error, profile: updatedProfile } = await serverUpdateProfile(user.id, updates);
    if (!error && updatedProfile) {
      setProfile(updatedProfile);
      if ('onboarding_complete' in updates) {
        updateOnboardingCookie(updates.onboarding_complete as boolean);
      }
    } else if (!error) {
      // Update local state optimistically even if server didn't return profile
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      if ('onboarding_complete' in updates) {
        updateOnboardingCookie(updates.onboarding_complete as boolean);
      }
    }
    return { error };
  }, [user, updateOnboardingCookie]);

  /**
   * Ensure the user has a profile row. Creates one if missing.
   * Called on mount and during onboarding.
   */
  const ensureProfile = useCallback(async () => {
    if (!user) return { error: 'Not authenticated' };

    // If profile already exists, nothing to do
    if (profile) return { error: null };

    const { error, profile: newProfile } = await serverEnsureProfile(
      user.id,
      user.email ?? '',
      user.user_metadata?.full_name
    );
    if (!error && newProfile) {
      setProfile(newProfile);
    }
    return { error };
  }, [user, profile]);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, signOut,
      signInWithGoogle, signInWithGitHub,
      resetPassword, updatePassword,
      refreshProfile, updateProfile,
      ensureProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
