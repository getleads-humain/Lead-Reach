-- ============================================================================
-- LeadReach AI — Auth & Profiles Migration (Supabase Auth Integration)
-- ============================================================================
-- Project: [YOUR-PROJECT-REF]
-- Generated: 2026-05-29
-- Purpose: Creates user profiles table, onboarding tracking, user settings,
--          and a trigger to auto-create profiles on signup.
--          Also adds user_id column to existing tables for data isolation.
--
-- USAGE:
--   Copy this entire script into the Supabase Dashboard SQL Editor at
--   https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql
--   and click "Run".
-- ============================================================================

-- ─── 1. PROFILES TABLE ──────────────────────────────────────────────────────
-- Linked 1:1 with auth.users via id. Auto-created on signup via trigger.

CREATE TABLE IF NOT EXISTS profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email               TEXT NOT NULL,
  full_name           TEXT,
  avatar_url          TEXT,
  company_name        TEXT,
  job_title           TEXT,
  phone               TEXT,
  industry            TEXT,
  company_size        TEXT,
  website             TEXT,
  location            TEXT,
  bio                 TEXT,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  onboarding_step     INTEGER NOT NULL DEFAULT 0,
  plan                TEXT NOT NULL DEFAULT 'free',
  plan_tier           TEXT NOT NULL DEFAULT 'scout',
  stripe_customer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE profiles IS 'User profiles linked 1:1 with Supabase Auth users';

-- ─── 2. USER SETTINGS TABLE ────────────────────────────────────────────────
-- Per-user preferences and configuration stored as JSON

CREATE TABLE IF NOT EXISTS user_settings (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferences         JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_settings JSONB NOT NULL DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "campaign_alerts": true,
    "lead_alerts": true,
    "weekly_report": true
  }'::jsonb,
  dashboard_layout    JSONB NOT NULL DEFAULT '{}'::jsonb,
  sidebar_collapsed   BOOLEAN NOT NULL DEFAULT false,
  theme               TEXT NOT NULL DEFAULT 'dark',
  language            TEXT NOT NULL DEFAULT 'en',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE user_settings IS 'Per-user application settings and preferences';

-- ─── 3. AUTO-CREATE PROFILE ON SIGNUP ──────────────────────────────────────
-- Trigger function that creates a profile row when a new user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  INSERT INTO user_settings (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Drop existing trigger if re-running
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 4. ADD user_id TO EXISTING TABLES ──────────────────────────────────────
-- This allows data isolation per user. user_id is nullable at first
-- to support existing data migration, then can be set NOT NULL later.

DO $$
BEGIN
  -- campaigns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'campaigns' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
  END IF;

  -- leads
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE leads ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
  END IF;

  -- outreach
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'outreach' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE outreach ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_outreach_user_id ON outreach(user_id);
  END IF;

  -- agent_tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agent_tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE agent_tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_agent_tasks_user_id ON agent_tasks(user_id);
  END IF;

  -- sub_accounts
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sub_accounts' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sub_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_sub_accounts_user_id ON sub_accounts(user_id);
  END IF;

  -- icp_profiles
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'icp_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE icp_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_icp_profiles_user_id ON icp_profiles(user_id);
  END IF;

  -- ai_setters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_setters' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE ai_setters ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_ai_setters_user_id ON ai_setters(user_id);
  END IF;

  -- setter_conversations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'setter_conversations' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE setter_conversations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_setter_conversations_user_id ON setter_conversations(user_id);
  END IF;

  -- custom_ai_tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'custom_ai_tasks' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE custom_ai_tasks ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_custom_ai_tasks_user_id ON custom_ai_tasks(user_id);
  END IF;

  -- ab_tests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ab_tests' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE ab_tests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id ON ab_tests(user_id);
  END IF;

  -- follow_up_sequences
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'follow_up_sequences' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE follow_up_sequences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_follow_up_sequences_user_id ON follow_up_sequences(user_id);
  END IF;
END $$;

-- ─── 5. RLS POLICIES FOR PROFILES & SETTINGS ──────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own, service_role has full access
DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
CREATE POLICY "users_read_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
CREATE POLICY "users_update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_all_profiles" ON profiles;
CREATE POLICY "service_role_all_profiles" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User Settings: users can read/update their own, service_role has full access
DROP POLICY IF EXISTS "users_read_own_settings" ON user_settings;
CREATE POLICY "users_read_own_settings" ON user_settings FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_update_own_settings" ON user_settings;
CREATE POLICY "users_update_own_settings" ON user_settings FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "users_insert_own_settings" ON user_settings;
CREATE POLICY "users_insert_own_settings" ON user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "service_role_all_user_settings" ON user_settings;
CREATE POLICY "service_role_all_user_settings" ON user_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── 6. UPDATE RLS FOR EXISTING TABLES (user-scoped access) ────────────────
-- Authenticated users can only see their own data, service_role sees all

-- Helper: create user-scoped policies for a table
-- Each table gets: authenticated SELECT/INSERT/UPDATE/DELETE where user_id = auth.uid()

-- Campaigns
DROP POLICY IF EXISTS "authenticated_read_campaigns" ON campaigns;
CREATE POLICY "authenticated_read_campaigns" ON campaigns FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_campaigns" ON campaigns;
CREATE POLICY "authenticated_insert_campaigns" ON campaigns FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_campaigns" ON campaigns;
CREATE POLICY "authenticated_update_campaigns" ON campaigns FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_campaigns" ON campaigns;
CREATE POLICY "authenticated_delete_campaigns" ON campaigns FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Leads
DROP POLICY IF EXISTS "authenticated_read_leads" ON leads;
CREATE POLICY "authenticated_read_leads" ON leads FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_leads" ON leads;
CREATE POLICY "authenticated_insert_leads" ON leads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_leads" ON leads;
CREATE POLICY "authenticated_update_leads" ON leads FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_leads" ON leads;
CREATE POLICY "authenticated_delete_leads" ON leads FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Outreach
DROP POLICY IF EXISTS "authenticated_read_outreach" ON outreach;
CREATE POLICY "authenticated_read_outreach" ON outreach FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_outreach" ON outreach;
CREATE POLICY "authenticated_insert_outreach" ON outreach FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_outreach" ON outreach;
CREATE POLICY "authenticated_update_outreach" ON outreach FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_outreach" ON outreach;
CREATE POLICY "authenticated_delete_outreach" ON outreach FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Agent Tasks
DROP POLICY IF EXISTS "authenticated_read_agent_tasks" ON agent_tasks;
CREATE POLICY "authenticated_read_agent_tasks" ON agent_tasks FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_agent_tasks" ON agent_tasks;
CREATE POLICY "authenticated_insert_agent_tasks" ON agent_tasks FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_agent_tasks" ON agent_tasks;
CREATE POLICY "authenticated_update_agent_tasks" ON agent_tasks FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_agent_tasks" ON agent_tasks;
CREATE POLICY "authenticated_delete_agent_tasks" ON agent_tasks FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ICP Profiles
DROP POLICY IF EXISTS "authenticated_read_icp_profiles" ON icp_profiles;
CREATE POLICY "authenticated_read_icp_profiles" ON icp_profiles FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_icp_profiles" ON icp_profiles;
CREATE POLICY "authenticated_insert_icp_profiles" ON icp_profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_icp_profiles" ON icp_profiles;
CREATE POLICY "authenticated_update_icp_profiles" ON icp_profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_icp_profiles" ON icp_profiles;
CREATE POLICY "authenticated_delete_icp_profiles" ON icp_profiles FOR DELETE TO authenticated USING (user_id = auth.uid());

-- AI Setters
DROP POLICY IF EXISTS "authenticated_read_ai_setters" ON ai_setters;
CREATE POLICY "authenticated_read_ai_setters" ON ai_setters FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_ai_setters" ON ai_setters;
CREATE POLICY "authenticated_insert_ai_setters" ON ai_setters FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_ai_setters" ON ai_setters;
CREATE POLICY "authenticated_update_ai_setters" ON ai_setters FOR UPDATE TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_delete_ai_setters" ON ai_setters;
CREATE POLICY "authenticated_delete_ai_setters" ON ai_setters FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Sub Accounts
DROP POLICY IF EXISTS "authenticated_read_sub_accounts" ON sub_accounts;
CREATE POLICY "authenticated_read_sub_accounts" ON sub_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);
DROP POLICY IF EXISTS "authenticated_insert_sub_accounts" ON sub_accounts;
CREATE POLICY "authenticated_insert_sub_accounts" ON sub_accounts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "authenticated_update_sub_accounts" ON sub_accounts;
CREATE POLICY "authenticated_update_sub_accounts" ON sub_accounts FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- ─── 7. TRIGGERS FOR profiles & user_settings ──────────────────────────────

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 8. ADD profiles & user_settings TO REALTIME ───────────────────────────

ALTER PUBLICATION supabase_realtime SET TABLE campaigns, leads, agent_tasks, outreach, setter_conversations, profiles, user_settings;
