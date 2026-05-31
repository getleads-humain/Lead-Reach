-- ============================================================================
-- LeadReach — Fix Supabase Security Advisor Warnings
-- ============================================================================
-- Date: 2024-05-31
--
-- This migration fixes 3 security warnings:
--   1. anon_security_definer_function_executable
--   2. authenticated_security_definer_function_executable
--   3. auth_leaked_password_protection
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================================

-- ─── Warning 1 & 2: Revoke EXECUTE on handle_new_user() ────────────────────
--
-- The handle_new_user() function is a trigger function meant to be called
-- ONLY by the database trigger when a new user signs up (AFTER INSERT on
-- auth.users). It should NOT be callable by anon or authenticated users
-- via the REST API (/rest/v1/rpc/handle_new_user).
--
-- By default, PostgreSQL grants EXECUTE on functions to PUBLIC (which
-- includes anon and authenticated). We revoke that here.

-- Revoke EXECUTE from anon (unauthenticated / public access)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;

-- Revoke EXECUTE from authenticated (signed-in users)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Also revoke from PUBLIC role (covers all current and future roles)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Verify the fix: should show no EXECUTE grants for anon/authenticated
-- SELECT grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE routine_name = 'handle_new_user'
--   AND routine_schema = 'public'
--   AND grantee IN ('anon', 'authenticated');
