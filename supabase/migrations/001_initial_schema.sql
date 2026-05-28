-- ============================================================================
-- Supabase Migration: Initial Schema
-- Generated from Prisma schema for LeadReach AI
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUID GENERATION FUNCTION
CREATE OR REPLACE FUNCTION gen_cuid()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql VOLATILE;

-- 3. AUTO-UPDATE updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. TABLES
CREATE TABLE IF NOT EXISTS campaigns (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                TEXT NOT NULL,
  description         TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  target_industry     TEXT,
  target_location     TEXT,
  target_company_size TEXT,
  target_criteria     TEXT,
  leads_found         INTEGER NOT NULL DEFAULT 0,
  leads_qualified     INTEGER NOT NULL DEFAULT 0,
  leads_contacted     INTEGER NOT NULL DEFAULT 0,
  leads_responded     INTEGER NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE campaigns IS 'Marketing/sales campaigns that define target criteria and track lead generation progress';

CREATE TABLE IF NOT EXISTS leads (
  id                  TEXT PRIMARY KEY DEFAULT gen_cuid(),
  campaign_id         TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  company_name        TEXT NOT NULL,
  legal_name          TEXT, website TEXT, industry TEXT, sub_industry TEXT,
  sic_code TEXT, naics_code TEXT,
  hq_address TEXT, city TEXT, state_province TEXT, country TEXT, postal_code TEXT,
  phone_main TEXT, phone_direct TEXT, general_email TEXT, support_email TEXT,
  ceo_name TEXT, ceo_email TEXT, key_contact_name TEXT, key_contact_title TEXT, key_contact_email TEXT,
  employee_count TEXT, revenue_estimate TEXT, founding_year TEXT, ownership_type TEXT,
  linkedin_url TEXT, twitter_handle TEXT, facebook_page TEXT, tech_stack TEXT,
  lead_score          INTEGER NOT NULL DEFAULT 0,
  lead_tier           TEXT NOT NULL DEFAULT 'unqualified',
  firmographic_score  INTEGER NOT NULL DEFAULT 0,
  intent_score        INTEGER NOT NULL DEFAULT 0,
  reachability_score  INTEGER NOT NULL DEFAULT 0,
  strategic_score     INTEGER NOT NULL DEFAULT 0,
  data_completeness   INTEGER NOT NULL DEFAULT 0,
  stage               TEXT NOT NULL DEFAULT 'new',
  last_contact_date   TIMESTAMPTZ,
  next_follow_up      TIMESTAMPTZ,
  notes               TEXT,
  sources             TEXT,
  discovered_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  enriched_at         TIMESTAMPTZ,
  qualified_at        TIMESTAMPTZ,
  contacted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE leads IS 'Discovered companies/prospects with firmographic data, scoring, and outreach tracking';

CREATE TABLE IF NOT EXISTS outreach (
  id          TEXT PRIMARY KEY DEFAULT gen_cuid(),
  lead_id     TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL, type TEXT NOT NULL, subject TEXT, body TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft',
  sent_at     TIMESTAMPTZ, opened_at TIMESTAMPTZ, replied_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE outreach IS 'Outreach messages/communications sent to leads across various channels';

CREATE TABLE IF NOT EXISTS agent_tasks (
  id           TEXT PRIMARY KEY DEFAULT gen_cuid(),
  campaign_id  TEXT REFERENCES campaigns(id),
  agent_name   TEXT NOT NULL, task_type TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending',
  priority     INTEGER NOT NULL DEFAULT 5,
  input TEXT, output TEXT, error TEXT, progress INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE agent_tasks IS 'Async tasks executed by AI agents for lead discovery, enrichment, and outreach';

CREATE TABLE IF NOT EXISTS agent_reach_channels (
  id           TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name         TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL, description TEXT,
  status       TEXT NOT NULL DEFAULT 'unknown',
  tier         INTEGER NOT NULL DEFAULT 0,
  backend TEXT, message TEXT, last_checked TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE agent_reach_channels IS 'Available communication/reach channels for agent-based outreach';

CREATE TABLE IF NOT EXISTS sub_accounts (
  id                   TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                 TEXT NOT NULL, description TEXT,
  status               TEXT NOT NULL DEFAULT 'active',
  client_name TEXT, client_email TEXT, industry TEXT,
  max_setters          INTEGER NOT NULL DEFAULT 5,
  max_leads            INTEGER NOT NULL DEFAULT 1000,
  current_leads        INTEGER NOT NULL DEFAULT 0,
  total_conversations  INTEGER NOT NULL DEFAULT 0,
  total_bookings       INTEGER NOT NULL DEFAULT 0,
  total_qualified      INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE sub_accounts IS 'Client sub-accounts that group AI setters and custom tasks with usage limits';

CREATE TABLE IF NOT EXISTS ai_setters (
  id                   TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                 TEXT NOT NULL, description TEXT,
  status               TEXT NOT NULL DEFAULT 'active',
  avatar TEXT, qualification_rules TEXT,
  conversations_handled INTEGER NOT NULL DEFAULT 0,
  leads_qualified       INTEGER NOT NULL DEFAULT 0,
  leads_booked          INTEGER NOT NULL DEFAULT 0,
  conversion_rate       DOUBLE PRECISION NOT NULL DEFAULT 0,
  avg_response_time     INTEGER NOT NULL DEFAULT 0,
  language              TEXT NOT NULL DEFAULT 'en',
  channels TEXT, calendar_link TEXT,
  follow_up_enabled     BOOLEAN NOT NULL DEFAULT true,
  follow_up_delay       INTEGER NOT NULL DEFAULT 3600,
  max_follow_ups        INTEGER NOT NULL DEFAULT 5,
  ghl_integration_id TEXT,
  active_variant TEXT, variant_a_message TEXT, variant_b_message TEXT,
  sub_account_id        TEXT REFERENCES sub_accounts(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE ai_setters IS 'AI-powered setter agents that handle lead conversations, qualification, and appointment booking';

CREATE TABLE IF NOT EXISTS setter_conversations (
  id                     TEXT PRIMARY KEY DEFAULT gen_cuid(),
  setter_id              TEXT NOT NULL REFERENCES ai_setters(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL, lead_channel TEXT NOT NULL, lead_phone TEXT, lead_email TEXT,
  status                 TEXT NOT NULL DEFAULT 'active',
  language               TEXT NOT NULL DEFAULT 'en',
  messages TEXT, pain_points TEXT, objections TEXT,
  qualification_score    INTEGER NOT NULL DEFAULT 0,
  qualification_answers  TEXT,
  booked_appointment     BOOLEAN NOT NULL DEFAULT false,
  booked_at TIMESTAMPTZ, appointment_date TIMESTAMPTZ, appointment_notes TEXT,
  follow_up_count        INTEGER NOT NULL DEFAULT 0,
  last_follow_up_at TIMESTAMPTZ, next_follow_up_at TIMESTAMPTZ,
  variant TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE setter_conversations IS 'Individual conversation sessions between AI setters and leads';

CREATE TABLE IF NOT EXISTS custom_ai_tasks (
  id                TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name              TEXT NOT NULL, description TEXT,
  type              TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'active',
  trigger_config    TEXT, actions TEXT,
  executions_count  INTEGER NOT NULL DEFAULT 0,
  last_executed_at  TIMESTAMPTZ,
  sub_account_id    TEXT REFERENCES sub_accounts(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE custom_ai_tasks IS 'User-defined automation tasks triggered by events with configurable actions';

CREATE TABLE IF NOT EXISTS ab_tests (
  id                        TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                      TEXT NOT NULL, description TEXT,
  status                    TEXT NOT NULL DEFAULT 'running',
  variant_a_name TEXT NOT NULL DEFAULT 'Variant A',
  variant_b_name TEXT NOT NULL DEFAULT 'Variant B',
  variant_a_impressions     INTEGER NOT NULL DEFAULT 0,
  variant_b_impressions     INTEGER NOT NULL DEFAULT 0,
  variant_a_conversions     INTEGER NOT NULL DEFAULT 0,
  variant_b_conversions     INTEGER NOT NULL DEFAULT 0,
  variant_a_conversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  variant_b_conversion_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  winner TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE ab_tests IS 'A/B testing experiments for setter messages, outreach templates, and campaign strategies';

CREATE TABLE IF NOT EXISTS icp_profiles (
  id                         TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name                       TEXT NOT NULL, description TEXT,
  industries TEXT, company_sizes TEXT, locations TEXT, revenue_range TEXT,
  required_tech TEXT, preferred_tech TEXT,
  tech_sophistication_level  TEXT NOT NULL DEFAULT 'medium',
  digital_maturity_score     INTEGER NOT NULL DEFAULT 50,
  values TEXT, challenges TEXT, goals TEXT, culture_types TEXT,
  buying_signals TEXT, engagement_patterns TEXT,
  trigger_events TEXT, expansion_signals TEXT, compliance_needs TEXT,
  budget_range TEXT, decision_timeline TEXT,
  price_sensitivity          TEXT NOT NULL DEFAULT 'medium',
  lifetime_value_potential   TEXT NOT NULL DEFAULT 'medium',
  criteria TEXT,
  leads_scored               INTEGER NOT NULL DEFAULT 0,
  avg_fit_score              DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE icp_profiles IS 'Ideal Customer Profile definitions with firmographic, technographic, psychographic, and behavioral criteria';

CREATE TABLE IF NOT EXISTS follow_up_sequences (
  id               TEXT PRIMARY KEY DEFAULT gen_cuid(),
  name             TEXT NOT NULL, description TEXT,
  status           TEXT NOT NULL DEFAULT 'active',
  steps            TEXT NOT NULL,
  total_steps      INTEGER NOT NULL DEFAULT 0,
  enrolled_count   INTEGER NOT NULL DEFAULT 0,
  completed_count  INTEGER NOT NULL DEFAULT 0,
  response_rate    DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE follow_up_sequences IS 'Automated follow-up sequences with configurable steps and performance tracking';

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_lead_id ON outreach(lead_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_campaign_id ON agent_tasks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ai_setters_sub_account_id ON ai_setters(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_setter_conversations_setter_id ON setter_conversations(setter_id);
CREATE INDEX IF NOT EXISTS idx_custom_ai_tasks_sub_account_id ON custom_ai_tasks(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_lead_tier ON leads(lead_tier);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_country ON leads(country);
CREATE INDEX IF NOT EXISTS idx_leads_discovered_at ON leads(discovered_at);
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent_name ON agent_tasks(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_reach_channels_status ON agent_reach_channels(status);
CREATE INDEX IF NOT EXISTS idx_ai_setters_status ON ai_setters(status);
CREATE INDEX IF NOT EXISTS idx_setter_conversations_status ON setter_conversations(status);
CREATE INDEX IF NOT EXISTS idx_sub_accounts_status ON sub_accounts(status);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);
CREATE INDEX IF NOT EXISTS idx_icp_profiles_industries ON icp_profiles(industries);

-- 6. AUTO-UPDATE TRIGGERS
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('CREATE TRIGGER IF NOT EXISTS trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
  END LOOP;
END;
$$;

-- 7. ROW LEVEL SECURITY
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reach_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_setters ENABLE ROW LEVEL SECURITY;
ALTER TABLE setter_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_ai_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_sequences ENABLE ROW LEVEL SECURITY;

-- 8. SERVICE ROLE POLICIES (full CRUD)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('CREATE POLICY "service_role_all_%s" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
  END LOOP;
END;
$$;

-- 9. ANON KEY POLICIES (read-only)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('CREATE POLICY "anon_read_%s" ON %I FOR SELECT TO anon USING (true)', t, t);
  END LOOP;
END;
$$;
