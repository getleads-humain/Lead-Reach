/**
 * LeadReach — Supabase Client Utility
 * =====================================
 * Provides a typed Supabase client for direct REST API access.
 * Used as a fallback when the Prisma ORM connection is unavailable,
 * and for real-time subscriptions and storage operations.
 *
 * The Prisma ORM remains the primary data access layer.
 * This client is for Supabase-specific features (realtime, storage, auth).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Anonymous client (safe for client-side / frontend) ──────────────────────
// Has read-only access via RLS policies
function createAnonClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[LeadReach] Supabase anon client not created — env vars missing');
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// ── Service role client (server-side only — bypasses RLS) ───────────────────
// Has full CRUD access — NEVER expose to the frontend
function createServiceClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[LeadReach] Supabase service client not created — env vars missing');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })
}

// Singleton instances
const globalForSupabase = globalThis as unknown as {
  anonClient: SupabaseClient | undefined
  serviceClient: SupabaseClient | undefined
}

export const supabaseAnon = globalForSupabase.anonClient ?? createAnonClient()

export const supabaseService = globalForSupabase.serviceClient ?? createServiceClient()

if (process.env.NODE_ENV !== 'production') {
  if (supabaseAnon) globalForSupabase.anonClient = supabaseAnon
  if (supabaseService) globalForSupabase.serviceClient = supabaseService
}

// ── Table names for type-safe access ────────────────────────────────────────
export const TABLES = {
  campaigns: 'campaigns',
  leads: 'leads',
  outreach: 'outreach',
  agentTasks: 'agent_tasks',
  agentReachChannels: 'agent_reach_channels',
  subAccounts: 'sub_accounts',
  aiSetters: 'ai_setters',
  setterConversations: 'setter_conversations',
  customAiTasks: 'custom_ai_tasks',
  abTests: 'ab_tests',
  icpProfiles: 'icp_profiles',
  followUpSequences: 'follow_up_sequences',
} as const

export type TableName = (typeof TABLES)[keyof typeof TABLES]
