-- ============================================================================
-- LeadReach AI — Missing Tables Migration (Billing, Autoresearch, etc.)
-- ============================================================================
-- Project: [YOUR-PROJECT-REF]
-- Purpose: Creates tables referenced by the application but not yet in Supabase.
--          These include billing, autoresearch, enrichment, reports, and ICP tables.
--
-- USAGE:
--   Copy this entire script into the Supabase Dashboard SQL Editor at
--   https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/sql
--   and click "Run".
-- ============================================================================

-- ─── BILLING TABLES ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS billing_plans (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                TEXT UNIQUE NOT NULL,
  display_name        TEXT NOT NULL,
  client_type         TEXT NOT NULL DEFAULT 'b2b',
  billing_cycle       TEXT NOT NULL DEFAULT 'monthly',
  base_price          NUMERIC NOT NULL DEFAULT 0,
  annual_price        NUMERIC NOT NULL DEFAULT 0,
  setup_fee           NUMERIC NOT NULL DEFAULT 0,
  price_per_api_call  NUMERIC NOT NULL DEFAULT 0,
  price_per_token     NUMERIC NOT NULL DEFAULT 0,
  price_per_lead      NUMERIC NOT NULL DEFAULT 0,
  price_per_enrichment NUMERIC NOT NULL DEFAULT 0,
  billing_threshold   NUMERIC NOT NULL DEFAULT 0,
  included_api_calls  INTEGER NOT NULL DEFAULT 0,
  included_leads      INTEGER NOT NULL DEFAULT 0,
  included_enrichments INTEGER NOT NULL DEFAULT 0,
  included_tokens     INTEGER NOT NULL DEFAULT 0,
  max_campaigns       INTEGER NOT NULL DEFAULT 1,
  max_setters         INTEGER NOT NULL DEFAULT 0,
  max_team_members    INTEGER NOT NULL DEFAULT 1,
  features            JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  grade               TEXT NOT NULL DEFAULT 'standard',
  description         TEXT,
  highlight           BOOLEAN NOT NULL DEFAULT false,
  badge               TEXT,
  sort_order          INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE billing_plans IS 'Billing plan definitions for B2B and B2C clients';

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id                 UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id                 TEXT NOT NULL REFERENCES billing_plans(id),
  client_type             TEXT NOT NULL DEFAULT 'b2b',
  client_name             TEXT,
  client_email            TEXT,
  status                  TEXT NOT NULL DEFAULT 'active',
  billing_cycle           TEXT NOT NULL DEFAULT 'monthly',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  next_billing_date       TIMESTAMPTZ,
  api_key                 TEXT UNIQUE,
  api_enabled             BOOLEAN NOT NULL DEFAULT true,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  cancelled_at            TIMESTAMPTZ,
  restarted_at            TIMESTAMPTZ,
  pro_rated_charge        NUMERIC NOT NULL DEFAULT 0,
  current_spend           NUMERIC NOT NULL DEFAULT 0,
  total_billed            NUMERIC NOT NULL DEFAULT 0,
  total_paid              NUMERIC NOT NULL DEFAULT 0,
  last_billing_event      TIMESTAMPTZ,
  last_payment_date       TIMESTAMPTZ,
  api_calls_used          INTEGER NOT NULL DEFAULT 0,
  tokens_used             INTEGER NOT NULL DEFAULT 0,
  leads_processed         INTEGER NOT NULL DEFAULT 0,
  enrichments_processed   INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE subscriptions IS 'Client subscriptions linked to billing plans';

CREATE TABLE IF NOT EXISTS billing_events (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  subscription_id     TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  event_type          TEXT NOT NULL,
  amount              NUMERIC NOT NULL DEFAULT 0,
  description         TEXT,
  metadata            JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE billing_events IS 'Billing events (payments, cancellations, threshold debits)';

CREATE TABLE IF NOT EXISTS consumption_records (
  id                      TEXT PRIMARY KEY DEFAULT gen_cuid(),
  subscription_id         TEXT NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  resource_type           TEXT NOT NULL,
  quantity                INTEGER NOT NULL DEFAULT 1,
  unit_price              NUMERIC NOT NULL DEFAULT 0,
  total_cost              NUMERIC NOT NULL DEFAULT 0,
  description             TEXT,
  metadata                JSONB,
  billing_period_start    TIMESTAMPTZ,
  billing_period_end      TIMESTAMPTZ,
  billed                  BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE consumption_records IS 'B2C consumption records (API calls, tokens, leads, enrichments)';

-- ─── AUTORESEARCH TABLES ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS autoresearch_jobs (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  topic               TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  result              JSONB,
  error               TEXT,
  progress            INTEGER NOT NULL DEFAULT 0,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE autoresearch_jobs IS 'Auto-research job tracking';

CREATE TABLE IF NOT EXISTS autoresearch_experiments (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  job_id              TEXT NOT NULL REFERENCES autoresearch_jobs(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  approach            TEXT,
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  result              JSONB,
  score               NUMERIC,
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE autoresearch_experiments IS 'Individual experiments within autoresearch jobs';

CREATE TABLE IF NOT EXISTS autoresearch_fragments (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  job_id              TEXT NOT NULL REFERENCES autoresearch_jobs(id) ON DELETE CASCADE,
  experiment_id       TEXT REFERENCES autoresearch_experiments(id) ON DELETE SET NULL,
  type                TEXT NOT NULL DEFAULT 'body',
  content             TEXT NOT NULL,
  sequence            INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE autoresearch_fragments IS 'Content fragments from autoresearch (headers, body, footer)';

-- ─── ENRICHMENT TABLES ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS enrichment_jobs (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  total_rows          INTEGER NOT NULL DEFAULT 0,
  processed_rows      INTEGER NOT NULL DEFAULT 0,
  enriched_rows       INTEGER NOT NULL DEFAULT 0,
  failed_rows         INTEGER NOT NULL DEFAULT 0,
  config              JSONB NOT NULL DEFAULT '{}'::jsonb,
  error               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE enrichment_jobs IS 'CSV/data enrichment job tracking';

-- ─── PROSPECT REPORTS TABLE ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS prospect_reports (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name        TEXT NOT NULL,
  website             TEXT,
  industry            TEXT,
  location            TEXT,
  summary             TEXT,
  full_report         JSONB,
  status              TEXT NOT NULL DEFAULT 'complete',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE prospect_reports IS 'Saved prospect research reports';

-- ─── ICP TABLE (SQL-level, separate from icp_profiles) ────────────────────

CREATE TABLE IF NOT EXISTS icps (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  description         TEXT,
  criteria            JSONB NOT NULL DEFAULT '{}'::jsonb,
  status              TEXT NOT NULL DEFAULT 'active',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE icps IS 'ICP definitions stored at SQL level';

-- ─── INDEXES ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_billing_events_subscription_id ON billing_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_subscription_id ON consumption_records(subscription_id);
CREATE INDEX IF NOT EXISTS idx_autoresearch_jobs_user_id ON autoresearch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_autoresearch_experiments_job_id ON autoresearch_experiments(job_id);
CREATE INDEX IF NOT EXISTS idx_autoresearch_fragments_job_id ON autoresearch_fragments(job_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_jobs_user_id ON enrichment_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reports_user_id ON prospect_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_icps_user_id ON icps(user_id);

-- ─── ENABLE RLS ──────────────────────────────────────────────────────────

ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoresearch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoresearch_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE autoresearch_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE icps ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────

-- Service role has full access to all new tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'billing_plans', 'subscriptions', 'billing_events', 'consumption_records',
    'autoresearch_jobs', 'autoresearch_experiments', 'autoresearch_fragments',
    'enrichment_jobs', 'prospect_reports', 'icps'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "service_role_all_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

-- Billing plans are readable by authenticated users
DROP POLICY IF EXISTS "authenticated_read_billing_plans" ON billing_plans;
CREATE POLICY "authenticated_read_billing_plans" ON billing_plans FOR SELECT TO authenticated USING (is_active = true);

-- User-scoped access for data tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'subscriptions', 'billing_events', 'consumption_records',
    'autoresearch_jobs', 'autoresearch_experiments', 'autoresearch_fragments',
    'enrichment_jobs', 'prospect_reports', 'icps'
  ]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_read_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "authenticated_read_%s" ON %I FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL)', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_insert_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "authenticated_insert_%s" ON %I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "authenticated_update_%s" ON %I', tbl, tbl);
    EXECUTE format('CREATE POLICY "authenticated_update_%s" ON %I FOR UPDATE TO authenticated USING (user_id = auth.uid())', tbl, tbl);
  END LOOP;
END $$;

-- ─── TRIGGERS FOR updated_at ─────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_billing_plans_updated_at ON billing_plans;
CREATE TRIGGER trg_billing_plans_updated_at BEFORE UPDATE ON billing_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_autoresearch_jobs_updated_at ON autoresearch_jobs;
CREATE TRIGGER trg_autoresearch_jobs_updated_at BEFORE UPDATE ON autoresearch_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_autoresearch_experiments_updated_at ON autoresearch_experiments;
CREATE TRIGGER trg_autoresearch_experiments_updated_at BEFORE UPDATE ON autoresearch_experiments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_enrichment_jobs_updated_at ON enrichment_jobs;
CREATE TRIGGER trg_enrichment_jobs_updated_at BEFORE UPDATE ON enrichment_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_prospect_reports_updated_at ON prospect_reports;
CREATE TRIGGER trg_prospect_reports_updated_at BEFORE UPDATE ON prospect_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_icps_updated_at ON icps;
CREATE TRIGGER trg_icps_updated_at BEFORE UPDATE ON icps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── ADD TO REALTIME PUBLICATION ─────────────────────────────────────────

ALTER PUBLICATION supabase_realtime SET TABLE campaigns, leads, agent_tasks, outreach, setter_conversations, profiles, user_settings, subscriptions, billing_events, autoresearch_jobs, enrichment_jobs;
