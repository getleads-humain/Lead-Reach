-- ============================================================================
-- LeadReach AI — Fix Function Search Path (Supabase Linter Warning)
-- ============================================================================
-- Project: ssaskkftdpidfwvpgdwl
-- Generated: 2026-05-29
-- Purpose: Fixes the Supabase Database Linter WARN:
--   "Function `public.gen_cuid` has a role mutable search_path"
--   "Function `public.update_updated_at_column` has a role mutable search_path"
--
-- USAGE:
--   Copy this entire script into the Supabase Dashboard SQL Editor at
--   https://supabase.com/dashboard/project/ssaskkftdpidfwvpgdwl/sql
--   and click "Run".
-- ============================================================================

-- Fix gen_cuid(): add SET search_path = public
-- Uses gen_random_bytes() from pgcrypto (installed in public schema)
CREATE OR REPLACE FUNCTION gen_cuid()
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  base36_chars TEXT := '0123456789abcdefghijklmnopqrstuvwxyz';
  timestamp_part TEXT := '';
  counter_part TEXT := '';
  random_part TEXT := '';
  counter_val INTEGER;
  ts BIGINT;
  i INTEGER;
  c INTEGER;
BEGIN
  ts := (EXTRACT(EPOCH FROM clock_timestamp()) * 1000)::BIGINT;
  i := 8;
  WHILE i > 0 LOOP
    c := (ts % 36)::INTEGER + 1;
    timestamp_part := SUBSTRING(base36_chars FROM c FOR 1) || timestamp_part;
    ts := ts / 36;
    i := i - 1;
  END LOOP;
  counter_val := (random() * 1679616)::INTEGER;
  i := 4;
  WHILE i > 0 LOOP
    c := (counter_val % 36)::INTEGER + 1;
    counter_part := SUBSTRING(base36_chars FROM c FOR 1) || counter_part;
    counter_val := counter_val / 36;
    i := i - 1;
  END LOOP;
  random_part := encode(gen_random_bytes(10), 'base64');
  random_part := replace(replace(replace(random_part, '+', ''), '/', ''), '=', '');
  random_part := lower(SUBSTRING(random_part FROM 1 FOR 13));
  RETURN 'c' || timestamp_part || counter_part || random_part;
END;
$$;

-- Fix update_updated_at_column(): add SET search_path = public
-- Uses only built-in now() function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
