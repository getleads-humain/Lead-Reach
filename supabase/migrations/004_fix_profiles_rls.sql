-- ============================================================================
-- LeadReach AI — Fix Profiles RLS & Add Missing Policies
-- ============================================================================
-- Project: [YOUR-PROJECT-REF]
-- Purpose: Add INSERT policy on profiles for authenticated users,
--          fix onboarding resume logic, and ensure data integrity.
--
-- Run this in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql
-- ============================================================================

-- ─── 1. ADD INSERT POLICY ON PROFILES ──────────────────────────────────────
-- Authenticated users can insert their own profile row.
-- This is needed as a fallback if the handle_new_user() trigger doesn't fire.

DROP POLICY IF EXISTS "users_insert_own_profile" ON profiles;
CREATE POLICY "users_insert_own_profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ─── 2. ENSURE TRIGGER EXISTS ──────────────────────────────────────────────
-- Re-create the handle_new_user trigger function with safety checks

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only insert if profile doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id) THEN
    INSERT INTO profiles (id, email, full_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    );
  END IF;

  -- Only insert settings if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM user_settings WHERE id = NEW.id) THEN
    INSERT INTO user_settings (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- Re-attach trigger (DROP IF EXISTS first for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 3. FIX EXISTING PROFILE DATA ─────────────────────────────────────────
-- Ensure the existing user's profile has correct defaults

UPDATE profiles
SET onboarding_step = 0
WHERE onboarding_step IS NULL;

UPDATE profiles
SET onboarding_complete = false
WHERE onboarding_complete IS NULL;
