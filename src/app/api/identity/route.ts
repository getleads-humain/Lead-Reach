/**
 * LeadReach — Identity Profile API
 * ==================================
 * GET:  Load the user's identity profile from the database
 * PUT:  Save (upsert) the user's identity profile to the database
 *
 * Uses the local SQLite database via Prisma — always available,
 * no Supabase auth dependency. The profile uses a fixed ID "default"
 * since this is a single-user application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Type for the profile data that the client sends/receives
interface IdentityProfileData {
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
  portfolioItems: Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    imageUrl: string;
    category: string;
  }>;
}

/**
 * GET /api/identity — Load the user's identity profile
 */
export async function GET() {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: 'default' },
    });

    if (!profile) {
      // No profile exists yet — return empty defaults
      return NextResponse.json({ profile: null });
    }

    // Parse JSON fields back to objects
    const profileData: IdentityProfileData = {
      fullName: profile.fullName,
      jobTitle: profile.jobTitle,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      socialLinks: safeJsonParse(profile.socialLinks, { linkedin: '', twitter: '', github: '', website: '' }),
      companyName: profile.companyName,
      companyRole: profile.companyRole,
      companyIndustry: profile.companyIndustry,
      companySize: profile.companySize,
      companyWebsite: profile.companyWebsite,
      companyDescription: profile.companyDescription,
      companyLogoUrl: profile.companyLogoUrl,
      portfolioUrl: profile.portfolioUrl,
      portfolioItems: safeJsonParse(profile.portfolioItems, []),
    };

    return NextResponse.json({ profile: profileData });
  } catch (error) {
    console.error('GET /api/identity error:', error);
    return NextResponse.json(
      { error: 'Failed to load identity profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/identity — Save (upsert) the user's identity profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data: IdentityProfileData = body.profile || body;

    // Serialize complex fields to JSON strings for SQLite storage
    const socialLinksJson = JSON.stringify(data.socialLinks || { linkedin: '', twitter: '', github: '', website: '' });
    const portfolioItemsJson = JSON.stringify(data.portfolioItems || []);

    const profile = await prisma.userProfile.upsert({
      where: { id: 'default' },
      update: {
        fullName: data.fullName || '',
        jobTitle: data.jobTitle || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        avatarUrl: data.avatarUrl || '',
        socialLinks: socialLinksJson,
        companyName: data.companyName || '',
        companyRole: data.companyRole || '',
        companyIndustry: data.companyIndustry || '',
        companySize: data.companySize || '',
        companyWebsite: data.companyWebsite || '',
        companyDescription: data.companyDescription || '',
        companyLogoUrl: data.companyLogoUrl || '',
        portfolioUrl: data.portfolioUrl || '',
        portfolioItems: portfolioItemsJson,
        onboardingComplete: true,
      },
      create: {
        id: 'default',
        fullName: data.fullName || '',
        jobTitle: data.jobTitle || '',
        email: data.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        location: data.location || '',
        avatarUrl: data.avatarUrl || '',
        socialLinks: socialLinksJson,
        companyName: data.companyName || '',
        companyRole: data.companyRole || '',
        companyIndustry: data.companyIndustry || '',
        companySize: data.companySize || '',
        companyWebsite: data.companyWebsite || '',
        companyDescription: data.companyDescription || '',
        companyLogoUrl: data.companyLogoUrl || '',
        portfolioUrl: data.portfolioUrl || '',
        portfolioItems: portfolioItemsJson,
        onboardingComplete: true,
      },
    });

    // Return the parsed profile data (same format as GET)
    const profileData: IdentityProfileData = {
      fullName: profile.fullName,
      jobTitle: profile.jobTitle,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio,
      location: profile.location,
      avatarUrl: profile.avatarUrl,
      socialLinks: safeJsonParse(profile.socialLinks, { linkedin: '', twitter: '', github: '', website: '' }),
      companyName: profile.companyName,
      companyRole: profile.companyRole,
      companyIndustry: profile.companyIndustry,
      companySize: profile.companySize,
      companyWebsite: profile.companyWebsite,
      companyDescription: profile.companyDescription,
      companyLogoUrl: profile.companyLogoUrl,
      portfolioUrl: profile.portfolioUrl,
      portfolioItems: safeJsonParse(profile.portfolioItems, []),
    };

    return NextResponse.json({ profile: profileData, saved: true });
  } catch (error) {
    console.error('PUT /api/identity error:', error);
    return NextResponse.json(
      { error: 'Failed to save identity profile' },
      { status: 500 }
    );
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}
