-- ============================================================================
-- LeadReach AI — Specialty Feature Tables Migration
-- ============================================================================
-- Created: 2024-06-01
-- Purpose: Add all tables required by the LeadReach specialty features:
--          Email Engagement, Account-Based Marketing, Revenue Intelligence,
--          Sales Enablement, and Data Quality.
--
-- Prerequisites: 001_initial_schema.sql must have been applied first
--                (campaigns, leads, outreach tables + gen_cuid() function
--                 + update_updated_at_column() trigger function must exist).
-- ============================================================================

-- ─── 1. EMAIL ENGAGEMENT TABLES ─────────────────────────────────────────────

-- ── Email Templates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id          TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id     TEXT,
  name        TEXT NOT NULL,
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'cold_outreach',
  variables   TEXT,
  usage_count INTEGER NOT NULL DEFAULT 0,
  open_rate   DOUBLE PRECISION NOT NULL DEFAULT 0,
  click_rate  DOUBLE PRECISION NOT NULL DEFAULT 0,
  reply_rate  DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE email_templates IS 'Reusable email templates with performance metrics for outreach campaigns';

-- ── Email Tracking ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_tracking (
  id          TEXT PRIMARY KEY DEFAULT gen_cuid(),
  outreach_id TEXT REFERENCES outreach(id) ON DELETE SET NULL,
  lead_id     TEXT REFERENCES leads(id) ON DELETE SET NULL,
  event       TEXT NOT NULL,
  metadata    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE email_tracking IS 'Individual email events (sent, delivered, opened, clicked, replied, bounced, complained)';

-- ── Email Suppressions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_suppressions (
  id          TEXT PRIMARY KEY DEFAULT gen_cuid(),
  email       TEXT NOT NULL UNIQUE,
  reason      TEXT NOT NULL,
  bounce_type TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE email_suppressions IS 'Suppressed email addresses that should not receive outreach (bounces, complaints, manual)';

-- ─── 2. ACCOUNT-BASED MARKETING TABLES ─────────────────────────────────────

-- ── Account Lists (must come before target_accounts for FK) ─────────────────
CREATE TABLE IF NOT EXISTS account_lists (
  id              TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id         TEXT,
  name            TEXT NOT NULL,
  description     TEXT,
  criteria        TEXT,
  total_accounts  INTEGER NOT NULL DEFAULT 0,
  tier1_count     INTEGER NOT NULL DEFAULT 0,
  tier2_count     INTEGER NOT NULL DEFAULT 0,
  tier3_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE account_lists IS 'Named lists of target accounts with ICP criteria and tier breakdowns';

-- ── Target Accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS target_accounts (
  id                TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id           TEXT,
  lead_id           TEXT REFERENCES leads(id) ON DELETE SET NULL,
  list_id           TEXT REFERENCES account_lists(id) ON DELETE SET NULL,

  company_name      TEXT NOT NULL,
  domain            TEXT,
  industry          TEXT,
  employee_count    TEXT,
  revenue_estimate  TEXT,
  tier              TEXT NOT NULL DEFAULT 'tier3',

  -- Scoring
  icp_fit_score     INTEGER NOT NULL DEFAULT 0,
  engagement_score  INTEGER NOT NULL DEFAULT 0,
  intent_score      INTEGER NOT NULL DEFAULT 0,
  composite_score   INTEGER NOT NULL DEFAULT 0,

  -- Engagement tracking
  total_interactions INTEGER NOT NULL DEFAULT 0,
  last_activity     TIMESTAMPTZ,
  engagement_trend  TEXT NOT NULL DEFAULT 'stable',

  -- Intent signals (JSON)
  intent_signals    TEXT,

  -- Buying committee (JSON)
  buying_committee  TEXT,

  -- Content strategy (JSON)
  content_strategy  TEXT,

  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE target_accounts IS 'Target accounts for ABM with ICP scoring, engagement tracking, intent signals, and buying committee data';

-- ─── 3. REVENUE INTELLIGENCE TABLES ────────────────────────────────────────

-- ── Revenue Forecasts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS revenue_forecasts (
  id                    TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id               TEXT,
  period                TEXT NOT NULL,
  projected_revenue     DOUBLE PRECISION NOT NULL DEFAULT 0,
  confidence            DOUBLE PRECISION NOT NULL DEFAULT 0,

  -- Scenario breakdown
  committed_revenue     DOUBLE PRECISION NOT NULL DEFAULT 0,
  best_case_revenue     DOUBLE PRECISION NOT NULL DEFAULT 0,
  upside_revenue        DOUBLE PRECISION NOT NULL DEFAULT 0,

  pipeline_contribution DOUBLE PRECISION NOT NULL DEFAULT 0,
  metadata              TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE revenue_forecasts IS 'Revenue forecasts with scenario breakdowns (committed, best-case, upside) per period';

-- ─── 4. SALES ENABLEMENT TABLES ────────────────────────────────────────────

-- ── Sales Assets ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sales_assets (
  id              TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id         TEXT,
  type            TEXT NOT NULL,
  name            TEXT NOT NULL,
  description     TEXT,
  content         TEXT NOT NULL,
  tags            TEXT,
  industry        TEXT,

  -- Linking
  lead_id         TEXT REFERENCES leads(id) ON DELETE SET NULL,
  competitor_name TEXT,

  -- Stats
  usage_count     INTEGER NOT NULL DEFAULT 0,
  effectiveness   DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE sales_assets IS 'Sales enablement assets (playbooks, battle cards, proposals, collateral, training) with usage tracking';

-- ─── 5. DATA QUALITY TABLES ────────────────────────────────────────────────

-- ── Data Quality Audits ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS data_quality_audits (
  id                 TEXT PRIMARY KEY DEFAULT gen_cuid(),
  user_id            TEXT,
  campaign_id        TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  lead_id            TEXT REFERENCES leads(id) ON DELETE SET NULL,

  overall_score      INTEGER NOT NULL DEFAULT 0,
  completeness_score INTEGER NOT NULL DEFAULT 0,
  accuracy_score     INTEGER NOT NULL DEFAULT 0,
  freshness_score    INTEGER NOT NULL DEFAULT 0,
  consistency_score  INTEGER NOT NULL DEFAULT 0,
  validity_score     INTEGER NOT NULL DEFAULT 0,

  issues             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE data_quality_audits IS 'Data quality audit records with multi-dimensional scoring and issue tracking';

-- ============================================================================
-- ─── 6. INDEXES ─────────────────────────────────────────────────────────────
-- ============================================================================

-- Foreign key indexes (critical for JOIN performance)
CREATE INDEX IF NOT EXISTS idx_email_tracking_outreach_id ON email_tracking(outreach_id);
CREATE INDEX IF NOT EXISTS idx_email_tracking_lead_id ON email_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_target_accounts_lead_id ON target_accounts(lead_id);
CREATE INDEX IF NOT EXISTS idx_target_accounts_list_id ON target_accounts(list_id);
CREATE INDEX IF NOT EXISTS idx_sales_assets_lead_id ON sales_assets(lead_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_audits_campaign_id ON data_quality_audits(campaign_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_audits_lead_id ON data_quality_audits(lead_id);

-- User-scoped indexes (most queries filter by user_id)
CREATE INDEX IF NOT EXISTS idx_email_templates_user_id ON email_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lists_user_id ON account_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_target_accounts_user_id ON target_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_user_id ON revenue_forecasts(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_assets_user_id ON sales_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_audits_user_id ON data_quality_audits(user_id);

-- Query optimization indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_tracking_event ON email_tracking(event);
CREATE INDEX IF NOT EXISTS idx_email_tracking_created_at ON email_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_reason ON email_suppressions(reason);
CREATE INDEX IF NOT EXISTS idx_target_accounts_tier ON target_accounts(tier);
CREATE INDEX IF NOT EXISTS idx_target_accounts_status ON target_accounts(status);
CREATE INDEX IF NOT EXISTS idx_target_accounts_composite_score ON target_accounts(composite_score);
CREATE INDEX IF NOT EXISTS idx_target_accounts_industry ON target_accounts(industry);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_period ON revenue_forecasts(period);
CREATE INDEX IF NOT EXISTS idx_sales_assets_type ON sales_assets(type);
CREATE INDEX IF NOT EXISTS idx_sales_assets_industry ON sales_assets(industry);
CREATE INDEX IF NOT EXISTS idx_data_quality_audits_overall_score ON data_quality_audits(overall_score);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_email_tracking_lead_event ON email_tracking(lead_id, event);
CREATE INDEX IF NOT EXISTS idx_target_accounts_user_tier ON target_accounts(user_id, tier);
CREATE INDEX IF NOT EXISTS idx_target_accounts_user_status ON target_accounts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_revenue_forecasts_user_period ON revenue_forecasts(user_id, period);

-- ============================================================================
-- ─── 7. AUTO-UPDATE updated_at TRIGGERS ─────────────────────────────────────
-- ============================================================================

DROP TRIGGER IF EXISTS trg_email_templates_updated_at ON email_templates;
CREATE TRIGGER trg_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_account_lists_updated_at ON account_lists;
CREATE TRIGGER trg_account_lists_updated_at BEFORE UPDATE ON account_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_target_accounts_updated_at ON target_accounts;
CREATE TRIGGER trg_target_accounts_updated_at BEFORE UPDATE ON target_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_revenue_forecasts_updated_at ON revenue_forecasts;
CREATE TRIGGER trg_revenue_forecasts_updated_at BEFORE UPDATE ON revenue_forecasts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_sales_assets_updated_at ON sales_assets;
CREATE TRIGGER trg_sales_assets_updated_at BEFORE UPDATE ON sales_assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: email_tracking, email_suppressions, and data_quality_audits have NO
-- updated_at column, so no trigger is needed.

-- ============================================================================
-- ─── 8. ROW LEVEL SECURITY ─────────────────────────────────────────────────
-- ============================================================================

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_audits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ─── 9. AUTHENTICATED USER POLICIES ─────────────────────────────────────────
--     Users can only read/write their own data (auth.uid() = user_id).
--     Tables without user_id (email_tracking, email_suppressions) use a
--     broader authenticated policy since they are system-managed.
-- ============================================================================

-- ── Email Templates (user-scoped) ───────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_email_templates" ON email_templates;
CREATE POLICY "authenticated_own_email_templates" ON email_templates
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── Email Tracking (system-managed, read-only for authenticated users) ──────
DROP POLICY IF EXISTS "authenticated_read_email_tracking" ON email_tracking;
CREATE POLICY "authenticated_read_email_tracking" ON email_tracking
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_insert_email_tracking" ON email_tracking;
CREATE POLICY "authenticated_insert_email_tracking" ON email_tracking
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Email Suppressions (system-managed, read-only for authenticated users) ──
DROP POLICY IF EXISTS "authenticated_read_email_suppressions" ON email_suppressions;
CREATE POLICY "authenticated_read_email_suppressions" ON email_suppressions
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "authenticated_insert_email_suppressions" ON email_suppressions;
CREATE POLICY "authenticated_insert_email_suppressions" ON email_suppressions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- ── Account Lists (user-scoped) ─────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_account_lists" ON account_lists;
CREATE POLICY "authenticated_own_account_lists" ON account_lists
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── Target Accounts (user-scoped) ───────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_target_accounts" ON target_accounts;
CREATE POLICY "authenticated_own_target_accounts" ON target_accounts
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── Revenue Forecasts (user-scoped) ─────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_revenue_forecasts" ON revenue_forecasts;
CREATE POLICY "authenticated_own_revenue_forecasts" ON revenue_forecasts
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── Sales Assets (user-scoped) ──────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_sales_assets" ON sales_assets;
CREATE POLICY "authenticated_own_sales_assets" ON sales_assets
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ── Data Quality Audits (user-scoped) ───────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_own_data_quality_audits" ON data_quality_audits;
CREATE POLICY "authenticated_own_data_quality_audits" ON data_quality_audits
  FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- ─── 10. SERVICE ROLE POLICIES (full CRUD — used by backend/API routes) ────
-- ============================================================================

DROP POLICY IF EXISTS "service_role_all_email_templates" ON email_templates;
CREATE POLICY "service_role_all_email_templates" ON email_templates FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_email_tracking" ON email_tracking;
CREATE POLICY "service_role_all_email_tracking" ON email_tracking FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_email_suppressions" ON email_suppressions;
CREATE POLICY "service_role_all_email_suppressions" ON email_suppressions FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_account_lists" ON account_lists;
CREATE POLICY "service_role_all_account_lists" ON account_lists FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_target_accounts" ON target_accounts;
CREATE POLICY "service_role_all_target_accounts" ON target_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_revenue_forecasts" ON revenue_forecasts;
CREATE POLICY "service_role_all_revenue_forecasts" ON revenue_forecasts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_sales_assets" ON sales_assets;
CREATE POLICY "service_role_all_sales_assets" ON sales_assets FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_data_quality_audits" ON data_quality_audits;
CREATE POLICY "service_role_all_data_quality_audits" ON data_quality_audits FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- ─── 11. ANON KEY POLICIES (read-only — used by frontend if needed) ────────
-- ============================================================================

DROP POLICY IF EXISTS "anon_read_email_templates" ON email_templates;
CREATE POLICY "anon_read_email_templates" ON email_templates FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_email_tracking" ON email_tracking;
CREATE POLICY "anon_read_email_tracking" ON email_tracking FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_email_suppressions" ON email_suppressions;
CREATE POLICY "anon_read_email_suppressions" ON email_suppressions FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_account_lists" ON account_lists;
CREATE POLICY "anon_read_account_lists" ON account_lists FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_target_accounts" ON target_accounts;
CREATE POLICY "anon_read_target_accounts" ON target_accounts FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_revenue_forecasts" ON revenue_forecasts;
CREATE POLICY "anon_read_revenue_forecasts" ON revenue_forecasts FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_sales_assets" ON sales_assets;
CREATE POLICY "anon_read_sales_assets" ON sales_assets FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "anon_read_data_quality_audits" ON data_quality_audits;
CREATE POLICY "anon_read_data_quality_audits" ON data_quality_audits FOR SELECT TO anon USING (true);
