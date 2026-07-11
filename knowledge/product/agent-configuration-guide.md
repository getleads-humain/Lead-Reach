---
title: Agent Configuration Guide
category: product
grade: B
last_reviewed: 2026-07-10
tags: [product, api, configuration, documentation]
---

# Agent Configuration Guide

Detailed guide for configuring each of LeadReach's 8 AI agents to match organizational requirements and GTM strategy. Configuration operates at three levels: organization defaults (apply to all agents), agent-specific settings (override defaults per agent), and scenario-specific rules (override per use case). Each agent has configurable parameters including: operating hours (when the agent is active), action limits (max activities per hour/day), approval requirements (which actions need human approval), escalation rules (conditions that trigger human escalation), and knowledge domain weights (which knowledge categories the agent prioritizes). Agent-specific configurations: Atlas (ICP definition weights, territory scoring model, whitespace detection thresholds), Scout (prospect discovery sources, qualification criteria, enrichment depth), Forge (enrichment providers, data confidence thresholds, update frequency), Sage (research depth, competitive analysis scope, signal detection sensitivity), Judge (qualification framework, scoring weights, advancement criteria), Bard (outreach channels, personalization level, cadence templates), Flow (pipeline stage definitions, exit criteria, velocity targets), and Echo (gap report frequency, quality thresholds, notification rules). Configuration changes are versioned and can be rolled back, with audit logs tracking all changes and their impact on agent performance.

---

## Configuration Architecture

### Three-Level Configuration Hierarchy

LeadReach's configuration system follows a cascading hierarchy where more specific settings override more general ones. Understanding this hierarchy is essential for making configuration changes that produce predictable results without unintended side effects.

**Level 1 — Organization Defaults**: These settings apply globally across all agents and all scenarios. They establish baseline behavior, compliance standards, and operational constraints. Organization defaults include global operating hours, maximum daily action limits, compliance framework selections, and default knowledge domain weights. Every new agent and scenario inherits these defaults unless explicitly overridden.

**Level 2 — Agent-Specific Settings**: Each of the 8 agents has its own configuration layer that overrides organization defaults for that agent only. Agent-specific settings include parameters unique to each agent's function—Atlas's ICP weights, Scout's discovery sources, Bard's tone profiles, etc. When an agent-specific setting is defined, it takes precedence over the organization default for that parameter.

**Level 3 — Scenario-Specific Rules**: Scenarios are use-case configurations that override both organization defaults and agent-specific settings for specific situations. Examples include "EU-GDPR outbound campaign" (which applies stricter consent and privacy settings), "enterprise ABM program" (which adjusts ICP weights and outreach cadences), or "customer expansion campaign" (which modifies qualification criteria and messaging). Scenarios are the most granular configuration level and take maximum precedence.

**Configuration Resolution Example**: If the organization default for `operating_hours` is "8AM-8PM ET", the Atlas agent-specific setting is "6AM-10PM ET" (Atlas runs extended hours for global ICP analysis), and a "EU Campaign" scenario sets it to "9AM-6PM CET", the effective operating hours for Atlas during the EU Campaign scenario would be "9AM-6PM CET"—the scenario-specific rule wins.

### Configuration Versioning & Rollback

All configuration changes are versioned with full audit trails. Every change records:

- **Who** made the change (user ID and role)
- **When** the change was made (UTC timestamp)
- **What** was changed (parameter name, old value, new value)
- **Why** the change was made (required reason field)
- **Impact assessment** (automated prediction of how the change will affect agent performance)

Configuration versions can be compared side-by-side, and any previous version can be restored with a single click. Rollback is instantaneous but triggers a notification to all team members who made changes after the rollback point, since their changes will also be reverted.

**Rollback Safety**: When rolling back, the system creates a new version that replicates the target version rather than deleting intermediate versions. This preserves the full audit trail and allows re-application of any intermediate changes that were desirable.

---

## Global Configuration Parameters

These parameters apply at the organization level and affect all agents unless overridden:

### Operating & Scheduling

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `global_operating_hours_start` | Time | 08:00 | Default start time for agent operations (local timezone) | 00:00-23:59 |
| `global_operating_hours_end` | Time | 20:00 | Default end time for agent operations (local timezone) | 00:00-23:59 |
| `global_timezone` | String | "US/Eastern" | Default timezone for scheduling all agent activities | IANA timezone database |
| `global_operating_days` | Array | ["Mon","Tue","Wed","Thu","Fri"] | Days of the week agents are active | Any combination of day names |
| `holiday_calendar` | String | "US_FEDERAL" | Holiday calendar to observe (agents pause on holidays) | Pre-defined calendars or custom |
| `quiet_hours_start` | Time | 22:00 | No outreach or notifications during quiet hours | 00:00-23:59 |
| `quiet_hours_end` | Time | 07:00 | End of quiet hours | 00:00-23:59 |
| `max_concurrent_agents` | Integer | 8 | Maximum number of agents that can operate simultaneously | 1-8 |

### Action Limits & Throttling

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `max_actions_per_hour` | Integer | 100 | Maximum total actions across all agents per hour | 10-10,000 |
| `max_actions_per_day` | Integer | 1,000 | Maximum total actions across all agents per day | 100-100,000 |
| `max_emails_per_hour` | Integer | 50 | Maximum email sends per hour (all agents combined) | 5-500 |
| `max_emails_per_day` | Integer | 500 | Maximum email sends per day (all agents combined) | 50-5,000 |
| `max_linkedin_actions_per_hour` | Integer | 20 | Maximum LinkedIn actions per hour | 5-100 |
| `max_linkedin_actions_per_day` | Integer | 100 | Maximum LinkedIn actions per day | 20-500 |
| `max_phone_calls_per_hour` | Integer | 10 | Maximum phone call initiations per hour | 1-50 |
| `max_phone_calls_per_day` | Integer | 50 | Maximum phone call initiations per day | 5-200 |
| `action_burst_capacity` | Integer | 150% | Temporary burst above hourly limits (percentage) | 100%-200% |
| `burst_window_seconds` | Integer | 60 | Duration of burst capacity window | 30-300 |
| `cool_down_after_burst_seconds` | Integer | 300 | Mandatory cool-down period after burst | 60-600 |

### Approval & Escalation

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `approval_required_by_default` | Boolean | false | Whether agent actions require human approval by default |
| `auto_approve_low_risk_actions` | Boolean | true | Automatically approve actions classified as low risk |
| `escalation_on_error_rate_threshold` | Float | 0.05 | Escalate to human if agent error rate exceeds this threshold |
| `escalation_on_compliance_risk` | Boolean | true | Automatically escalate actions flagged as compliance risks |
| `escalation_on_high_value_prospect` | Boolean | true | Escalate actions involving prospects above value threshold |
| `high_value_prospect_threshold` | Currency | $50,000 | ACV threshold for high-value prospect escalation |
| `escalation_notification_channel` | String | "email_slack" | How escalation notifications are delivered |
| `escalation_response_timeout_minutes` | Integer | 60 | Time before unresponded escalation is auto-escalated further |
| `auto_escalation_chain` | Array | ["manager", "director", "vp"] | Chain of command for auto-escalation |

### Compliance & Security

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `default_compliance_frameworks` | Array | ["CAN_SPAM"] | Default compliance frameworks to enforce |
| `require_consent_before_outreach` | Boolean | false | Require verified consent before any outreach (override per region) |
| `auto_include_unsubscribe` | Boolean | true | Automatically include unsubscribe links in all emails |
| `auto_include_physical_address` | Boolean | true | Automatically include physical address in all emails |
| `auto_include_privacy_notice` | Boolean | true | Automatically include privacy notice link in initial outreach |
| `data_retention_days` | Integer | 730 | Default data retention period in days |
| `encrypt_data_at_rest` | Boolean | true | Encrypt all stored prospect data |
| `encrypt_data_in_transit` | Boolean | true | Enforce TLS for all data transmission |
| `audit_log_retention_days` | Integer | 2555 | Retain audit logs for 7 years |
| `pii_access_logging` | Boolean | true | Log all access to personally identifiable information |
| `two_person_rule_for_deletion` | Boolean | true | Require two authorized users to approve data deletion |

---

## Agent-Specific Configuration

### Atlas — ICP & Territory Intelligence

Atlas defines your Ideal Customer Profile and manages territory intelligence. It determines which companies and contacts are the best fit for your solution and identifies whitespace opportunities.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `icp_weight_industry` | Float | 0.20 | Weight of industry vertical in ICP scoring | 0.0-1.0 |
| `icp_weight_company_size` | Float | 0.20 | Weight of company size (employees/revenue) in ICP scoring | 0.0-1.0 |
| `icp_weight_geography` | Float | 0.15 | Weight of geographic location in ICP scoring | 0.0-1.0 |
| `icp_weight_technology_stack` | Float | 0.15 | Weight of technology stack compatibility in ICP scoring | 0.0-1.0 |
| `icp_weight_growth_signals` | Float | 0.15 | Weight of growth indicators (funding, hiring) in ICP scoring | 0.0-1.0 |
| `icp_weight_custom_1` | Float | 0.00 | Weight of first custom ICP dimension | 0.0-1.0 |
| `icp_weight_custom_2` | Float | 0.00 | Weight of second custom ICP dimension | 0.0-1.0 |
| `territory_model` | Enum | "global_flat" | How territories are defined and scored | global_flat, regional_cluster, country_specific, rep_assigned |
| `whitespace_detection_threshold` | Float | 0.40 | ICP fit score threshold for whitespace identification | 0.0-1.0 |
| `account_scoring_model` | Enum | "icp_fit_only" | How accounts are scored | icp_fit_only, icp_fit_plus_intent, predictive_ml |
| `icp_refresh_frequency_days` | Integer | 30 | How often ICP model is recalibrated | 7-90 |
| `max_target_accounts` | Integer | 500 | Maximum number of active target accounts | 10-10,000 |

#### ICP Weight Validation

All ICP weights must sum to 1.0. The system validates this on save and will reject configurations where weights don't sum to 1.0 (within a tolerance of ±0.01). When adjusting weights, the system provides a real-time sum indicator and can auto-normalize weights proportionally if desired.

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `lookalike_model_enabled` | Boolean | false | Use ML to find companies similar to best customers |
| `lookalike_training_data` | Enum | "top_customers" | Data source for lookalike model | top_customers, closed_won, custom_list |
| `intent_signal_weight` | Float | 0.20 | Weight of buying intent signals in account scoring (when using icp_fit_plus_intent) |
| `technographic_weight` | Float | 0.15 | Weight of technographic data in account scoring |
| `firmographic_weight` | Float | 0.15 | Weight of firmographic data in account scoring |
| `chronographic_weight` | Float | 0.10 | Weight of timing signals (contract renewals, hiring) in account scoring |
| `exclude_current_customers` | Boolean | true | Exclude existing customers from new logo targeting |
| `exclude_lost_deals_period_days` | Integer | 90 | Period to exclude accounts with recently lost deals |
| `min_account_score_for_scout` | Float | 0.60 | Minimum account score to pass leads to Scout |
| `tier_method` | Enum | "abm_three_tier" | Account tiering method | abm_three_tier, abm_two_tier, equal_priority |
| `tier_1_max_accounts` | Integer | 50 | Maximum accounts in Tier 1 (strategic ABM) |
| `tier_2_max_accounts` | Integer | 200 | Maximum accounts in Tier 2 (scale ABM) |
| `tier_3_max_accounts` | Integer | 1000 | Maximum accounts in Tier 3 (programmatic ABM) |

### Scout — Prospect Discovery

Scout discovers and identifies individual prospects within Atlas-defined target accounts and beyond, using multiple data sources and qualification criteria.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `discovery_sources` | Array | ["linkedin_sales_nav"] | Active data sources for prospect discovery | See source list below |
| `qualification_criteria` | Enum | "basic_b2b" | Default qualification criteria for discovered prospects | basic_b2b, strict_enterprise, plg_optimized, custom |
| `enrichment_depth` | Enum | "standard" | How deeply to enrich discovered prospects | minimal, standard, deep, comprehensive |
| `max_prospects_per_account` | Integer | 3 | Maximum prospects to discover per target account | 1-10 |
| `discovery_frequency_hours` | Integer | 24 | How often Scout runs discovery cycles | 1-168 |
| `new_prospect_alert` | Boolean | true | Alert when new high-fit prospects are discovered | true/false |
| `duplicate_detection` | Enum | "strict" | How aggressively to detect and merge duplicates | relaxed, standard, strict |
| `consent_verification` | Enum | "pre_outreach" | When to verify consent status | never, pre_outreach, pre_discovery, always |

#### Available Discovery Sources

| Source | Coverage | Data Quality | Cost Impact | Compliance Notes |
|--------|----------|-------------|-------------|-----------------|
| `linkedin_sales_nav` | Global, professional | High | Standard | LinkedIn ToS compliance required |
| `linkedin_recruiter` | Global, professional | High | Premium | Recruiter-specific ToS |
| `zoominfo` | US-heavy, growing global | High | Premium | CCPA/GDPR compliance features |
| `apollo` | Global, growing | Moderate-High | Standard | Good international coverage |
| `clearbit` | US/EU primary | High | Standard | Strong company data |
| `crunchbase` | Global, funded companies | Moderate (funding focus) | Standard | Best for funded company discovery |
| `g2_intent` | B2B SaaS buyers | Moderate | Premium | Category-specific intent data |
| `bombora` | B2B intent, broad | Moderate | Premium | Broad intent signal coverage |
| `demandbase` | Enterprise account-level | High | Premium | Strong ABM account identification |
| `6sense` | Enterprise intent + analytics | High | Premium | Full buyer journey analytics |
| `companies_house` | UK companies | High (UK only) | Free | UK official registry |
| `sec_edgar` | US public companies | High (public only) | Free | US SEC filings |
| `national_business_registers` | EU per country | Varies | Low/Free | Country-specific compliance |
| `builtwith` | Technology stack detection | Moderate | Standard | Best for technographic data |
| `slintel` | Technology + intent | Moderate | Standard | Technographic + buying stage |

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto_create_account_records` | Boolean | true | Automatically create account records for new companies |
| `contact_role_detection` | Boolean | true | Attempt to detect contact's buying role |
| `cell_number_flagging` | Boolean | false | Flag mobile vs. landline phone numbers (recommended for US TCPA) |
| `email_verification_level` | Enum | "syntax_plus_mx" | Email validation depth | syntax_only, syntax_plus_mx, full_verification |
| `persona_matching_enabled` | Boolean | true | Match prospects to defined buyer personas |
| `trigger_event_monitoring` | Boolean | true | Monitor for trigger events at target accounts |
| `trigger_event_sources` | Array | ["funding","leadership_changes"] | Which trigger events to monitor |
| `intent_threshold_for_alert` | Float | 0.70 | Minimum intent signal strength to trigger alert |
| `max_daily_new_prospects` | Integer | 200 | Maximum new prospects discovered per day |
| `auto_qualify_threshold` | Float | 0.75 | Auto-qualify prospects above this ICP fit score |

### Forge — Data Enrichment

Forge enriches prospect and account records with additional data from multiple providers, maintaining data accuracy and completeness.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `enrichment_providers` | Array | ["clearbit"] | Active enrichment providers | See provider list below |
| `confidence_threshold` | Float | 0.70 | Minimum confidence score to accept enriched data | 0.0-1.0 |
| `update_frequency_days` | Integer | 30 | How often to re-enrich existing records | 1-90 |
| `enrichment_scope` | Enum | "contact_plus_account" | What data to enrich | contact_only, account_only, contact_plus_account, full |
| `data_minimization_mode` | Enum | "standard" | Level of data minimization compliance | standard, strict (GDPR-aligned), minimal |
| `auto_correct_inaccurate_data` | Boolean | true | Automatically correct data below confidence threshold | true/false |
| `enrich_on_create` | Boolean | true | Enrich records immediately upon creation | true/false |
| `max_enrichment_calls_per_hour` | Integer | 200 | Rate limit for enrichment API calls | 10-1,000 |

#### Enrichment Provider Capabilities

| Provider | Company Data | Contact Data | Tech Stack | Funding | Intent | Key Strength |
|----------|-------------|-------------|-----------|---------|--------|-------------|
| Clearbit | Excellent | Good | Good | Good | No | Best overall enrichment |
| ZoomInfo | Good | Excellent | Moderate | Moderate | No | Best contact data |
| Apollo | Good | Good | Moderate | No | No | Good value, broad coverage |
| BuiltWith | Moderate | No | Excellent | No | No | Best technographic data |
| Slintel | Moderate | No | Good | No | Good | Tech stack + buying stage |
| Crunchbase | Good | No | No | Excellent | No | Best funding/investment data |
| LinkedIn | Good | Excellent | No | No | No | Most current professional data |
| HG Insights | Good | No | Excellent | No | Good | Best IT spend/installed base |
| Bombora | No | No | No | No | Excellent | Best B2B intent data |

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enrichment_priority_order` | Array | Provider-dependent | Order of providers when multiple can fill same field |
| `field_level_confidence` | Boolean | true | Store confidence scores at individual field level |
| `conflict_resolution` | Enum | "highest_confidence" | How to resolve conflicting data from multiple providers | highest_confidence, most_recent, manual_review |
| `gdpr_data_minimization_fields` | Array | All fields | Fields to collect when data_minimization_mode is "strict" |
| `pii_encryption_enabled` | Boolean | true | Encrypt PII fields at rest |
| `enrichment_webhook_enabled` | Boolean | false | Fire webhook when enrichment completes |
| `batch_enrichment_size` | Integer | 100 | Number of records per enrichment batch | 10-1,000 |
| `enrichment_timeout_seconds` | Integer | 30 | Timeout per enrichment API call | 5-120 |

### Sage — Research & Intelligence

Sage conducts deep research on accounts and contacts, monitors competitive landscapes, and detects trigger events and buying signals.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `research_depth` | Enum | "standard" | How deeply Sage researches each account | minimal, standard, deep, comprehensive |
| `competitive_analysis_scope` | Enum | "direct_competitors" | Scope of competitive landscape analysis | none, direct_competitors, full_ecosystem |
| `signal_detection_sensitivity` | Float | 0.70 | Threshold for trigger event signal detection | 0.0-1.0 |
| `research_frequency_days` | Integer | 7 | How often to re-research active accounts | 1-30 |
| `trigger_event_types` | Array | ["funding","leadership_changes"] | Types of trigger events to monitor | See list below |
| `competitive_monitoring_frequency` | Enum | "weekly" | How often to update competitive intelligence | daily, weekly, monthly |
| `max_concurrent_research_tasks` | Integer | 10 | Maximum simultaneous research operations | 1-50 |

#### Available Trigger Event Types

| Event Type | Description | Data Sources | Urgency |
|-----------|-------------|-------------|---------|
| `funding` | Company raises funding round | Crunchbase, PitchBook, press | Very High |
| `leadership_changes` | C-suite or VP-level executive change | LinkedIn, press, SEC filings | High |
| `product_launches` | New product or major feature launch | Press, Product Hunt, company blog | Moderate |
| `acquisitions` | Company acquires or is acquired | Press, SEC filings, Crunchbase | Very High |
| `expansion_signals` | Office opening, new market entry, job postings | LinkedIn, job boards, press | High |
| `regulatory_changes` | New regulations affecting prospect's industry | Government sources, legal databases | High |
| `earnings_calls` | Quarterly earnings for public companies | SEC EDGAR, transcripts | Moderate |
| `competitor_incidents` | Security breaches, outages, negative press | News, social media, G2 | Very High |
| `contract_expirations` | Estimated competitor contract renewal dates | Sales intel, public records | Very High |
| `hiring_signals` | Job postings for relevant roles | LinkedIn, Indeed, Glassdoor | High |
| `technology_changes` | Technology stack additions or removals | BuiltWith, Wappalyzer | Moderate |
| `negative_reviews` | Negative reviews of competitors | G2, Capterra, TrustRadius | High |

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `research_report_format` | Enum | "structured_summary" | Format for research reports | structured_summary, detailed_report, executive_brief |
| `auto_attach_to_account` | Boolean | true | Automatically attach research to account records |
| `trigger_alert_channel` | Enum | "slack" | Where to send trigger event alerts | slack, email, in_app, all |
| `trigger_alert_urgency_filter` | Enum | "high_and_above" | Minimum urgency level to trigger alerts | all, moderate_and_above, high_and_above, very_high_only |
| `competitive_battle_card_auto_update` | Boolean | true | Automatically update battle cards with new competitive intel |
| `news_monitoring_sources` | Array | ["reuters","bloomberg","techcrunch"] | News sources for monitoring |
| `social_monitoring_enabled` | Boolean | true | Monitor social media for account/competitor mentions |
| `patent_monitoring_enabled` | Boolean | false | Monitor patent filings for innovation signals |
| `earnings_call_transcript_analysis` | Boolean | true | Analyze public company earnings call transcripts |
| `custom_research_templates` | Array | [] | Custom research report templates |

### Judge — Qualification & Scoring

Judge applies qualification frameworks and scoring models to evaluate prospect fit and buying readiness, determining which prospects should receive outreach and when.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `qualification_framework` | Enum | "BANT" | Primary qualification framework | BANT, MEDDIC, MEDDPICC, CHAMP, ANUM, custom |
| `scoring_model` | Enum | "rule_based" | Type of scoring model | rule_based, predictive_ml, hybrid |
| `budget_weight` | Float | 0.25 | Weight of budget/capacity in qualification scoring | 0.0-1.0 |
| `authority_weight` | Float | 0.25 | Weight of decision authority in qualification scoring | 0.0-1.0 |
| `need_weight` | Float | 0.25 | Weight of identified need in qualification scoring | 0.0-1.0 |
| `timeline_weight` | Float | 0.25 | Weight of buying timeline in qualification scoring | 0.0-1.0 |
| `qualification_threshold` | Float | 0.60 | Minimum score to qualify as SQL | 0.0-1.0 |
| `disqualification_threshold` | Float | 0.30 | Score below which prospects are auto-disqualified | 0.0-1.0 |
| `human_review_threshold` | Float | 0.50 | Scores in this range are flagged for human review | 0.0-1.0 |
| `auto_advance_enabled` | Boolean | true | Automatically advance qualified prospects to next stage | true/false |

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `champion_detection_enabled` | Boolean | true | Detect and score champion presence |
| `champion_weight` | Float | 0.15 | Additional weight when champion is identified |
| `dmu_coverage_scoring` | Boolean | true | Score accounts based on DMU coverage |
| `dmu_minimum_contacts` | Integer | 2 | Minimum contacts needed for DMU coverage score |
| `engagement_signal_weight` | Float | 0.10 | Weight of engagement signals (email opens, clicks, etc.) |
| `intent_signal_weight` | Float | 0.10 | Weight of buying intent signals |
| `competitive_risk_weight` | Float | -0.10 | Negative weight for existing competitor presence |
| `plg_engagement_weight` | Float | 0.10 | Weight of product usage signals (for PLG companies) |
| `scoring_model_training_frequency` | Enum | "monthly" | How often to retrain ML scoring model | weekly, monthly, quarterly |
| `scoring_model_minimum_data_points` | Integer | 100 | Minimum historical data points for ML model training |
| `qualification_notes_required` | Boolean | false | Require notes when manually qualifying/disqualifying |
| `re_qualification_frequency_days` | Integer | 30 | How often to re-evaluate qualified prospects |

### Bard — Outreach & Engagement

Bard manages all outbound communication including email, LinkedIn, phone, and other channels. It personalizes messaging, manages cadences, and tracks engagement.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `primary_channel` | Enum | "email" | Primary outreach channel | email, linkedin, phone, multi_channel |
| `secondary_channels` | Array | ["linkedin"] | Additional channels to use | email, linkedin, phone, direct_mail, video, sms |
| `personalization_level` | Enum | "basic" | Level of message personalization | none, basic, high, extreme |
| `default_cadence_template` | String | "standard_b2b_5touch" | Default cadence template ID | Any valid template ID |
| `cadence_length_days` | Integer | 14 | Default cadence duration | 5-60 |
| `touchpoint_count` | Integer | 5 | Number of touchpoints in default cadence | 3-16 |
| `max_active_prospects` | Integer | 200 | Maximum prospects in active cadences per rep | 10-2,000 |
| `send_time_optimization` | Boolean | true | Optimize send times based on prospect engagement patterns | true/false |
| `auto_follow_up_on_engagement` | Boolean | true | Automatically adjust cadence when prospect engages | true/false |
| `tone_profile` | Enum | "professional" | Default tone for outreach messages | professional, consultative, casual, aggressive, custom |

#### Channel-Specific Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `email_from_name` | String | "{{rep_first_name}}" | Sender name format for emails |
| `email_from_address` | String | "{{rep_first_name}}@{{company_domain}}" | Sender email format |
| `email_reply_to` | String | "{{rep_email}}" | Reply-to address |
| `email_include_signature` | Boolean | true | Include email signature |
| `email_track_opens` | Boolean | true | Track email opens |
| `email_track_clicks` | Boolean | true | Track link clicks in emails |
| `linkedin_connection_note_length` | Integer | 300 | Max characters in LinkedIn connection note |
| `linkedin_message_length` | Integer | 500 | Max characters in LinkedIn messages |
| `linkedin_follow_up_delay_hours` | Integer | 48 | Hours to wait after connection before messaging |
| `phone_call_duration_target_seconds` | Integer | 120 | Target call duration for connect calls |
| `phone_voicemail_enabled` | Boolean | true | Leave voicemail on no answer |
| `phone_voicemail_max_length_seconds` | Integer | 30 | Maximum voicemail duration |
| `direct_mail_integration` | Enum | "none" | Direct mail platform integration | none, sendoso, outreach_io, postal |

#### Compliance Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto_include_unsubscribe_link` | Boolean | true | Always include unsubscribe in emails (CAN-SPAM/PECR) |
| `unsubscribe_link_text` | String | "Unsubscribe" | Text for unsubscribe link |
| `auto_include_physical_address` | Boolean | true | Include physical address in email footer (CAN-SPAM) |
| `auto_include_privacy_notice_link` | Boolean | true | Include privacy notice in initial outreach |
| `ai_disclosure_footer` | Boolean | false | Include AI-generated content disclosure |
| `ai_disclosure_text` | String | "AI-assisted composition" | Text for AI disclosure footer |
| `dnc_check_before_call` | Boolean | true | Check Do-Not-Call registry before phone outreach |
| `consent_required_for_sms` | Boolean | true | Require explicit consent before sending SMS |
| `opt_out_processing_delay` | Enum | "immediate" | How quickly to process opt-out requests | immediate, 1_hour, 24_hours, 10_business_days |
| `suppression_list_check` | Boolean | true | Check internal suppression list before every outreach |

#### Advanced Settings

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `a_b_testing_enabled` | Boolean | true | Enable A/B testing of subject lines and content |
| `a_b_test_sample_size` | Integer | 100 | Minimum sample size per variant |
| `a_b_test_confidence_level` | Float | 0.95 | Statistical confidence level for declaring winner |
| `auto_winner_selection` | Boolean | true | Automatically promote winning variant |
| `sequence_branching_enabled` | Boolean | true | Branch cadences based on prospect engagement |
| `positive_reply_detection` | Boolean | true | AI-powered positive reply detection |
| `meeting_request_detection` | Boolean | true | Detect meeting requests in replies |
| `auto_meeting_scheduling` | Boolean | false | Automatically schedule meetings when requested |
| `meeting_scheduler_integration` | Enum | "none" | Calendar integration for scheduling | none, calendly, chili_piper, outreach |
| `bcc_crm_enabled` | Boolean | true | BCC CRM on all outreach for logging |
| `crm_integration` | Enum | "salesforce" | CRM integration for activity logging | salesforce, hubspot, pipedrive, dynamics, none |
| `email_warmup_enabled` | Boolean | true | Gradual email volume increase for new sending domains |
| `email_warmup_ramp_days` | Integer | 14 | Days to reach full sending volume | 7-30 |
| `spam_score_monitoring` | Boolean | true | Monitor email spam scores before sending |
| `max_spam_score_threshold` | Float | 3.0 | Maximum acceptable spam score (lower is better) | 0.0-10.0 |

### Flow — Pipeline Management

Flow manages the sales pipeline, tracking prospects through defined stages, enforcing exit criteria, and providing forecasting and velocity analytics.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `pipeline_stages` | Array | ["discovery","qualification","demo","proposal","negotiation","closed_won","closed_lost"] | Ordered list of pipeline stages | Any valid stage names |
| `stage_exit_criteria` | Object | Per-stage defaults | Criteria that must be met to advance from each stage | Per-stage configuration |
| `velocity_target_days` | Object | Per-stage defaults | Target days in each pipeline stage | Per-stage configuration |
| `forecast_method` | Enum | "weighted_pipeline" | Pipeline forecasting method | weighted_pipeline, forecast_category, ai_predicted, custom |
| `forecast_commit_threshold` | Float | 0.70 | Minimum probability to include in forecast commit | 0.0-1.0 |
| `pipeline_value_display` | Enum | "weighted" | How to display pipeline value | weighted, unweighted, both |
| `auto_create_opportunity` | Boolean | true | Auto-create CRM opportunity at defined stage | true/false |
| `opportunity_creation_stage` | String | "qualification" | Stage at which CRM opportunity is created | Any valid stage name |
| `stalled_deal_threshold_days` | Integer | 14 | Days without activity before deal is flagged as stalled | 3-60 |
| `lost_deal_auto_close` | Boolean | false | Auto-close deals stalled beyond threshold | true/false |
| `max_stalled_days_before_auto_close` | Integer | 60 | Days stalled before auto-close (if enabled) | 30-180 |

#### Stage Configuration

Each pipeline stage has its own set of configuration parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `stage_name` | String | Display name for the stage |
| `stage_order` | Integer | Position in the pipeline (0 = first) |
| `exit_criteria` | Array of Objects | Conditions that must ALL be met to advance |
| `exit_criteria_type` | Enum | How criteria are evaluated | all_must_match, any_must_match, scoring_threshold |
| `required_fields` | Array | Fields that must be populated before advancing |
| `required_activities` | Array | Activities that must be logged before advancing |
| `target_velocity_days` | Integer | Target number of days in this stage |
| `max_velocity_days` | Integer | Maximum days before stage is flagged as slow |
| `auto_advance_conditions` | Array | Conditions that trigger automatic stage advancement |
| `auto_regress_conditions` | Array | Conditions that trigger regression to previous stage |
| `stage_probability` | Float | Default win probability at this stage |
| `notification_on_enter` | Boolean | Notify assigned rep when deal enters stage |
| `notification_on_stall` | Boolean | Notify when deal stalls in stage |
| `required_next_action` | String | Suggested next action template |

### Echo — Compliance & Quality Monitoring

Echo monitors compliance across all agent activities, maintains data quality, and provides gap analysis and reporting.

#### Core Parameters

| Parameter | Type | Default | Description | Valid Range |
|-----------|------|---------|-------------|-------------|
| `compliance_frameworks` | Array | ["CAN_SPAM"] | Active compliance frameworks | CAN_SPAM, TCPA, CCPA_CPR, GDPR, PECR, AI_ACT, custom |
| `audit_frequency_hours` | Integer | 168 | How often to run compliance audits (168 = weekly) | 1-720 |
| `data_quality_threshold` | Float | 0.80 | Minimum data quality score before alerting | 0.0-1.0 |
| `gap_report_frequency_days` | Integer | 7 | How often to generate pipeline gap reports | 1-30 |
| `notification_rules` | Object | Default set | When and how to send compliance notifications | Per-rule configuration |
| `auto_remediation_enabled` | Boolean | true | Automatically fix compliance issues when possible | true/false |
| `consent_monitoring_frequency_hours` | Integer | 24 | How often to verify consent status | 1-168 |
| `right_to_object_processing` | Enum | "immediate_halt" | How to handle right-to-object requests | immediate_halt, 24_hour_halt, manual_review |

#### Compliance Framework Configuration

Each compliance framework has specific parameters that Echo enforces:

| Framework | Key Parameters |
|-----------|---------------|
| **CAN_SPAM** | `auto_include_unsubscribe`, `auto_include_physical_address`, `unsubscribe_max_delay`, `header_accuracy_check` |
| **TCPA** | `dnc_check_before_call`, `cell_number_flagging`, `auto_dial_consent_required`, `consent_documentation_required` |
| **CCPA/CPRA** | `privacy_notice_at_collection`, `right_to_know_enabled`, `right_to_delete_enabled`, `right_to_opt_out_enabled`, `do_not_sell_link_enabled`, `data_minimization_enforcement` |
| **GDPR** | `lawful_basis_required`, `lia_documentation_required`, `consent_before_processing`, `right_to_erasure_enabled`, `data_portability_enabled`, `international_transfer_safeguards`, `dpia_required_threshold` |
| **PECR** | `tps_ctps_check_before_call`, `individual_subscriber_consent_required`, `corporate_subscriber_soft_opt_in`, `cookie_consent_check` |
| **AI_ACT** | `ai_transparency_disclosure`, `human_oversight_option`, `automated_decision_review`, `risk_classification_check` |

#### Notification Rules

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `notification_channels` | Array | ["email","in_app"] | How compliance notifications are delivered |
| `notification_urgency_levels` | Array | ["critical","high"] | Which urgency levels trigger notifications |
| `critical_notification_channel` | String | "email_slack_pagerduty" | Channel for critical compliance issues |
| `high_notification_channel` | String | "email_slack" | Channel for high-urgency compliance issues |
| `medium_notification_channel` | String | "in_app" | Channel for medium-urgency compliance issues |
| `daily_compliance_digest` | Boolean | true | Send daily summary of compliance status |
| `weekly_compliance_report` | Boolean | true | Send weekly detailed compliance report |
| `monthly_compliance_review` | Boolean | true | Generate monthly compliance review document |

#### Data Quality Monitoring

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `email_bounce_rate_threshold` | Float | 0.05 | Alert when email bounce rate exceeds this |
| `email_complaint_rate_threshold` | Float | 0.001 | Alert when spam complaint rate exceeds this |
| `data_completeness_min_score` | Float | 0.70 | Minimum data completeness score |
| `data_freshness_max_days` | Integer | 90 | Alert when data hasn't been updated in this many days |
| `duplicate_rate_threshold` | Float | 0.05 | Alert when duplicate rate exceeds this |
| `field_validation_rules` | Object | Default set | Custom validation rules for data fields |
| `auto_cleanup_stale_data` | Boolean | true | Automatically archive data past retention period |
| `data_quality_dashboard` | Boolean | true | Show real-time data quality metrics |

---

## Scenario Configuration

### Creating Scenarios

Scenarios allow you to create targeted configurations for specific use cases without changing your default agent settings. To create a scenario:

1. Navigate to **Settings → Scenarios → Create New**
2. Name the scenario and provide a description
3. Select which agents will have scenario-specific settings
4. Configure overrides for each agent
5. Set activation conditions (manual, scheduled, or trigger-based)
6. Save and activate

### Pre-Built Scenario Templates

LeadReach includes several pre-built scenario templates for common use cases:

| Scenario | Description | Agents Modified | Primary Changes |
|----------|-------------|----------------|-----------------|
| **EU-GDPR Outbound** | Stricter compliance for EU targeting | Scout, Forge, Bard, Echo | Consent-first, data minimization, privacy notices, immediate opt-out |
| **UK Outbound** | UK-specific compliance and culture | Scout, Forge, Bard, Echo | PECR compliance, TPS/CTPS, professional tone, entity classification |
| **Enterprise ABM** | High-touch ABM for large accounts | Atlas, Scout, Bard, Flow | 1:1 personalization, longer cadences, multi-threading, POC stages |
| **Mid-Market Scale** | Balanced outreach for mid-market | Atlas, Scout, Bard, Flow | 1:Few personalization, standard cadences, faster pipeline |
| **PLG Expansion** | Product-led growth expansion plays | Scout, Sage, Judge, Bard | Usage signals, upgrade prompts, feature-based messaging |
| **Competitor Displacement** | Target competitor customers | Atlas, Scout, Sage, Bard | Competitor detection, switching messaging, timing-based cadences |
| **Customer Expansion** | Expansion within existing accounts | Atlas, Scout, Bard, Flow | Expansion ICP, usage signals, upgrade messaging, expansion pipeline |
| **Event Follow-Up** | Post-event outreach | Scout, Bard, Flow | Event-specific messaging, faster cadence, meeting-focused |

---

## Configuration Best Practices

### 1. Start with Organization Defaults, Then Customize

Don't configure every agent from scratch. Set sensible organization defaults first, then customize agent-specific settings only where needed. This minimizes configuration drift and makes it easier to understand why agents behave differently.

### 2. Use Scenarios for Regional and Vertical Variations

Instead of constantly changing agent settings when switching between regions or verticals, create scenarios. This allows quick switching without risk of forgetting to revert settings, and it makes your configuration auditable.

### 3. Validate ICP Weights with Historical Data

Atlas ICP weights should be validated against your actual customer data. Run the "ICP Fit Analysis" report to compare your current ICP weights against the profile of your best customers. If your best customers don't score highly under current weights, adjust accordingly.

### 4. Tune Judge Scoring Based on Conversion Data

Judge's scoring model should be regularly recalibrated using actual conversion data. At minimum, review the scoring model monthly to ensure it's accurately predicting which prospects will convert. Use the "Scoring Accuracy Report" to compare predicted scores with actual outcomes.

### 5. Monitor Bard Performance by Cadence

Not all cadences perform equally. Use the "Cadence Performance Dashboard" to identify which cadences have the highest positive reply rates and which are underperforming. Clone high-performing cadences and archive underperforming ones.

### 6. Keep Pipeline Stages Simple

Resist the temptation to create overly granular pipeline stages. Each stage should have clear, measurable exit criteria and represent a meaningful change in the prospect's buying journey. Too many stages create confusion and reduce forecasting accuracy. Aim for 6-10 active stages.

### 7. Enable Compliance Proactively

Don't wait for a compliance issue to configure Echo. Enable all applicable compliance frameworks from day one, even if you're not currently targeting those regions. It's much easier to proactively build compliant processes than to retrofit compliance after a violation.

---

## Troubleshooting Configuration Issues

### Common Issues & Resolutions

| Issue | Likely Cause | Resolution |
|-------|-------------|------------|
| Agent not performing actions | Operating hours or action limits too restrictive | Check `global_operating_hours`, `max_actions_per_hour/day`, and agent-specific limits |
| Low outreach response rates | Bard personalization level too low or cadence too aggressive | Increase `personalization_level`, extend `cadence_length_days`, reduce `touchpoint_count` |
| Too many unqualified leads | Scout discovery criteria too broad or Judge threshold too low | Tighten Scout `qualification_criteria`, raise Judge `qualification_threshold` |
| Compliance violations | Echo compliance framework not enabled or configured incorrectly | Enable applicable frameworks in Echo, verify all required parameters |
| Data quality issues | Forge confidence threshold too low or update frequency too low | Raise `confidence_threshold`, decrease `update_frequency_days` |
| Pipeline stalled deals | Flow exit criteria too strict or stalled deal threshold too low | Review stage exit criteria, adjust `stalled_deal_threshold_days` |
| Trigger events missed | Sage signal detection sensitivity too high | Lower `signal_detection_sensitivity`, add more `trigger_event_types` |
| ICP targeting off-target | Atlas weights don't match actual customer profile | Run ICP Fit Analysis, adjust weights based on customer data |
| Duplicate prospects | Scout duplicate detection too relaxed | Set `duplicate_detection` to "strict", review merge rules |
| Email deliverability issues | Bard sending volume too high or spam score threshold too low | Enable `email_warmup_enabled`, lower `max_spam_score_threshold`, check `max_emails_per_day` |

### Configuration Audit Command

Use the "Configuration Audit" tool to validate your entire configuration:

1. Navigate to **Settings → Configuration Audit**
2. Click **Run Full Audit**
3. Review the audit report for warnings and errors
4. Address issues in priority order (compliance > performance > optimization)

The audit checks for: weight sums equaling 1.0, conflicting parameters across configuration levels, missing required parameters, compliance framework gaps, and performance-impacting misconfigurations.

---

*This guide is maintained by the LeadReach Product Team and updated with each platform release. Last updated: July 2026. For configuration support, contact your Customer Success Manager or submit a ticket through the Help Center.*
