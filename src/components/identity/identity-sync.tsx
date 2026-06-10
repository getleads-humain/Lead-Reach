'use client';

/**
 * LeadReach — Identity Sync Component
 * ======================================
 * Ensures the user's identity profile is loaded from the database
 * into the Zustand store on app mount. This component doesn't render
 * anything visible — it's purely a data synchronization side-effect.
 *
 * Place this inside the AppShell or root layout so that identity
 * data is available globally whenever the user is authenticated.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { useAppStore } from '@/lib/store';
import type { PortfolioItem } from '@/lib/types';

export function IdentitySync() {
  const { user } = useAuth();
  const { setUserProfile } = useAppStore();
  const loadedUserId = useRef<string | null>(null);
  const isLoading = useRef(false);

  useEffect(() => {
    const currentUserId = user?.id || 'demo-user';

    // Don't reload if we've already loaded for this user
    if (loadedUserId.current === currentUserId || isLoading.current) return;

    isLoading.current = true;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user?.id) {
      headers['x-user-id'] = user.id;
    }

    fetch('/api/identity', {
      method: 'GET',
      headers,
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.profile) {
          const p = data.profile;
          setUserProfile({
            fullName: p.fullName || '',
            jobTitle: p.jobTitle || '',
            email: p.email || '',
            phone: p.phone || '',
            bio: p.bio || '',
            location: p.location || '',
            avatarUrl: p.avatarUrl || '',
            socialLinks: {
              linkedin: p.socialLinks?.linkedin || '',
              twitter: p.socialLinks?.twitter || '',
              github: p.socialLinks?.github || '',
              website: p.socialLinks?.website || '',
            },
            companyName: p.companyName || '',
            companyRole: p.companyRole || '',
            companyIndustry: p.companyIndustry || '',
            companySize: p.companySize || '',
            companyWebsite: p.companyWebsite || '',
            companyDescription: p.companyDescription || '',
            companyLogoUrl: p.companyLogoUrl || '',
            portfolioUrl: p.portfolioUrl || '',
            portfolioItems: Array.isArray(p.portfolioItems)
              ? p.portfolioItems
              : [],
          });
          loadedUserId.current = currentUserId;
        }
      })
      .catch((err) => {
        // Silently fail — the IdentityView page can retry loading
        console.warn('[IdentitySync] Failed to load identity:', err.message);
      })
      .finally(() => {
        isLoading.current = false;
      });
  }, [user?.id, setUserProfile]);

  // Reset when user logs out
  useEffect(() => {
    if (!user && loadedUserId.current) {
      loadedUserId.current = null;
    }
  }, [user]);

  return null;
}
