'use client';

/**
 * LeadReach — useIdentityProfile Hook
 * ======================================
 * Manages the user's Identity Profile with full persistence.
 *
 * Features:
 *  - Auto-loads the profile from the API on mount
 *  - Saves changes to the database via PUT /api/identity
 *  - Syncs with the Zustand store so all components stay in sync
 *  - Supports per-user context (each user has their own profile)
 *  - Works in both authenticated and demo mode
 *
 * Usage:
 *   const { profile, loading, saving, save, reload } = useIdentityProfile();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/auth/auth-provider';
import type { UserProfile, PortfolioItem } from '@/lib/types';
import { EMPTY_USER_PROFILE } from '@/lib/types';

interface IdentityProfileResponse {
  profile: {
    id: string | null;
    userId: string;
    fullName: string;
    jobTitle: string;
    email: string;
    phone: string;
    bio: string;
    location: string;
    avatarUrl: string;
    socialLinks: {
      linkedin: string;
      twitter: string;
      github: string;
      website: string;
    };
    companyName: string;
    companyRole: string;
    companyIndustry: string;
    companySize: string;
    companyWebsite: string;
    companyDescription: string;
    companyLogoUrl: string;
    portfolioUrl: string;
    portfolioItems: PortfolioItem[];
    completeness: number;
    lastSavedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  exists: boolean;
}

/** Convert API response profile shape → Zustand UserProfile shape. */
function apiProfileToUserProfile(apiProfile: IdentityProfileResponse['profile']): UserProfile {
  return {
    fullName: apiProfile.fullName || '',
    jobTitle: apiProfile.jobTitle || '',
    email: apiProfile.email || '',
    phone: apiProfile.phone || '',
    bio: apiProfile.bio || '',
    location: apiProfile.location || '',
    avatarUrl: apiProfile.avatarUrl || '',
    socialLinks: {
      linkedin: apiProfile.socialLinks?.linkedin || '',
      twitter: apiProfile.socialLinks?.twitter || '',
      github: apiProfile.socialLinks?.github || '',
      website: apiProfile.socialLinks?.website || '',
    },
    companyName: apiProfile.companyName || '',
    companyRole: apiProfile.companyRole || '',
    companyIndustry: apiProfile.companyIndustry || '',
    companySize: apiProfile.companySize || '',
    companyWebsite: apiProfile.companyWebsite || '',
    companyDescription: apiProfile.companyDescription || '',
    companyLogoUrl: apiProfile.companyLogoUrl || '',
    portfolioUrl: apiProfile.portfolioUrl || '',
    portfolioItems: Array.isArray(apiProfile.portfolioItems) ? apiProfile.portfolioItems : [],
  };
}

export function useIdentityProfile() {
  const { user } = useAuth();
  const { userProfile, setUserProfile } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const loadedUserId = useRef<string | null>(null);

  /** Fetch the identity profile from the API. */
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Pass user ID in header for demo mode when Supabase isn't configured
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const res = await fetch('/api/identity', {
        method: 'GET',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to load identity profile (${res.status})`);
      }

      const data: IdentityProfileResponse = await res.json();
      const converted = apiProfileToUserProfile(data.profile);

      // Sync to Zustand store so all components see the persisted data
      setUserProfile(converted);
      setProfileExists(data.exists);
      setLastSavedAt(data.profile.lastSavedAt);
      loadedUserId.current = user?.id || 'demo-user';
    } catch (err) {
      console.error('[useIdentityProfile] Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      // On error, keep whatever is in the Zustand store (may be empty default)
    } finally {
      setLoading(false);
    }
  }, [user?.id, setUserProfile]);

  /** Save the current Zustand store profile to the database. */
  const save = useCallback(async (profileToSave?: Partial<UserProfile>) => {
    setSaving(true);
    setError(null);
    try {
      // Merge any partial updates into the current profile
      const merged = profileToSave
        ? { ...userProfile, ...profileToSave }
        : userProfile;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const res = await fetch('/api/identity', {
        method: 'PUT',
        headers,
        body: JSON.stringify(merged),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to save identity profile (${res.status})`);
      }

      const data = await res.json();

      // Sync the saved profile back to Zustand
      if (data.profile) {
        const converted = apiProfileToUserProfile(data.profile);
        setUserProfile(converted);
        setLastSavedAt(data.profile.lastSavedAt);
        setProfileExists(true);
      }

      return { success: true };
    } catch (err) {
      console.error('[useIdentityProfile] Save error:', err);
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      setError(message);
      return { success: false, error: message };
    } finally {
      setSaving(false);
    }
  }, [user?.id, userProfile, setUserProfile]);

  /** Reload the profile from the database. */
  const reload = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Auto-load profile on mount or when user changes
  useEffect(() => {
    const currentUserId = user?.id || 'demo-user';
    if (loadedUserId.current !== currentUserId) {
      loadProfile();
    }
  }, [user?.id, loadProfile]);

  return {
    profile: userProfile,
    loading,
    saving,
    error,
    lastSavedAt,
    profileExists,
    save,
    reload,
  };
}
