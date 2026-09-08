import type { AgentDetailFull } from './types';

export const leadQualificationDetail: AgentDetailFull = {
  slug: 'lead-qualification',
  name: 'lead-qualification',
  displayName: 'Lead Qualification (Judge)',
  tagline: 'Applies a 5-dimension weighted scoring model to qualify and tier every lead',
  description: 'Scores and qualifies leads based on ICP criteria',
  longDescription:
    'The Lead Qualification agent — codenamed Judge — is the platform\'s lead scoring authority. It applies a sophisticated 5-dimension weighted scoring model to every enriched lead: Firmographic fit (25% — industry, size, revenue, location match), Intent signals (20% — triggers, pain points, growth signals), Reachability (20% — email, phone, LinkedIn, key contact availability), Strategic value (20% — market position, growth, partnerships), and Data completeness (15% — how much data is filled). The weighted sum produces a 0-100 score and leads are automatically tiered: super_hot (88+), hot (70-87), warm (40-69), cold (<40). Judge also enforces SLA tiers (A-list: 5 min, B-list: 1 hr, C-list: 24 hr), detects disqualifiers (existing customers, competitor employees, below minimum size, excluded industries), applies score boosters (inquiry +15, referral +10, analyst mention +5), and manages stage progression across 9 stages (new → enriched → qualified → contacted → engaged → negotiating → closed_won → closed_lost → nurture). Judge is intentionally conservative — high scores require clear evidence, never inference — and falls back to a heuristic field-count-based scoring model when the LLM is unavailable.',
  color: '#F59E0B',
  iconName: 'Target',
  department: 'Growth',
  pipelineRole: 'Lead scoring, qualification, and tier assignment',
  pipelinePosition: 5,

  capabilities: [
    {
      name: '5-Dimension Weighted Scoring',
      description:
        'Scores every lead across 5 orthogonal dimensions, each 0-100, weighted to produce a final 0-100 score. The formula is: score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15.',
      metric: '5 dimensions, 0-100 score',
      details: [
        'Firmographic fit (25%): industry match, employee_count match, revenue band match, geography match against the ICP definition. Each sub-factor weighted per ICP.',
        'Intent signals (20%): trigger events (funding, hiring, product launch), pain-point keywords from web research, growth signals (headcount delta, traffic trend).',
        'Reachability (20%): email availability + deliverability, phone availability, LinkedIn profile + connection degree, key decision-maker contact identified.',
        'Strategic value (20%): market position, growth rate, partnership potential, logo value to reference list.',
        'Data completeness (15%): % of 60+ enrichment fields populated, weighted by field importance (revenue > headcount > social).',
      ],
    },
    {
      name: 'Tier Assignment & SLA Enforcement',
      description:
        'Maps the 0-100 score to one of 4 tiers and enforces the matching SLA. Tiers drive how quickly the sales team must respond.',
      metric: '4 tiers, 3 SLA levels',
      details: [
        'super_hot (score ≥ 88): A-list SLA — assign to senior AE within 5 minutes. Trigger instant Slack + mobile push.',
        'hot (score 70-87): B-list SLA — assign to AE within 1 hour. Trigger Slack + email.',
        'warm (score 40-69): C-list SLA — assign to SDR within 24 hours. Trigger daily digest.',
        'cold (score < 40): no SLA — auto-route to nurture sequence. No human notification.',
      ],
    },
    {
      name: '9-Stage Lifecycle Progression',
      description:
        'Manages the lead stage state machine: new → enriched → qualified → contacted → engaged → negotiating → closed_won (or closed_lost / nurture). Each transition is logged with timestamp, actor, and trigger.',
      metric: '9 stages',
      details: [
        'Stage transitions are validated against a legal-transition matrix (e.g. new → enriched is legal; new → closed_won is not).',
        'Each transition writes a stage_progression_log row: lead_id, prior_stage, new_stage, ts, actor, trigger, score_at_transition.',
        'Qualified stage requires score ≥ 50 AND no active disqualifiers; transitions to qualified trigger SLA enforcement.',
        'Stalled leads (no stage change for > 14 days in contacted/engaged) auto-route to nurture.',
      ],
    },
    {
      name: 'Real-Time Recalculation on New Data',
      description:
        'Whenever the Data Enrichment agent (Forge) writes new fields to a lead, Judge re-scores in real time. A lead can upgrade cold → warm → hot as evidence accumulates.',
      metric: 'Sub-2s re-score',
      details: [
        'Subscribes to lead.updated events emitted by the enrichment pipeline.',
        'Re-runs the 5-dimension scorer with the merged field set; previous scores are archived (not overwritten).',
        'Tier upgrades emit lead.tier_upgraded events that re-route SLA enforcement and notify the assigned AE.',
        'Tier downgrades emit lead.tier_downgraded events but do not retract an in-flight outreach sequence; the AE is notified.',
      ],
    },
    {
      name: 'Disqualifier Detection',
      description:
        'Identifies leads that must be excluded from outreach regardless of score. Disqualifiers override tier — a disqualified lead is never routed to sales.',
      metric: '4 disqualifier categories',
      details: [
        'Existing customer: domain match against current customer roster (synced nightly from CRM).',
        'Competitor employee: email domain match against competitor registry (maintained list of 120+ competitors).',
        'Below minimum size: employee_count < ICP.min_employees OR revenue < ICP.min_revenue.',
        'Excluded industry: industry code match against the campaign\'s excluded_industries list (e.g. gambling, weapons, tobacco).',
      ],
    },
    {
      name: 'Score Booster Application',
      description:
        'Applies additive boosters to the raw score when high-value external signals are detected. Boosters are bounded so they cannot push a lead above 100.',
      metric: '3 booster types',
      details: [
        'Inbound inquiry (+15): lead submitted a contact form, demo request, or trial signup within the last 30 days.',
        'Referral from existing customer (+10): lead was referred via the customer referral program with a verified referrer.',
        'Mentioned by industry analyst (+5): lead appeared in a Gartner, Forrester, or G2 report within the last 90 days.',
        'Boosters are capped: total booster contribution cannot exceed +25, and the final score is capped at 100.',
      ],
    },
    {
      name: 'Conservative Scoring Philosophy',
      description:
        'Judge is intentionally conservative: high scores require clear, citable evidence. Missing evidence produces missing score, not inferred score.',
      metric: '< 3% false-hot rate',
      details: [
        'Any dimension scored > 70 must cite at least 2 specific field values from the enrichment payload as evidence.',
        'When evidence is ambiguous, the lower of two plausible scores is chosen (e.g. 60 vs 80 → 60).',
        'The LLM is prompted to default to the median score (50) when evidence is genuinely balanced, not to invent a tiebreaker.',
        'All scores > 80 are flagged for a heuristic cross-check; if heuristic and LLM disagree by > 20 points, the lower wins.',
      ],
    },
    {
      name: 'Heuristic Fallback Scoring',
      description:
        'When the LLM is unavailable (timeout, rate limit, malformed response), Judge falls back to a deterministic heuristic scorer so leads are never left unscored.',
      metric: '100% scoring uptime',
      details: [
        'Heuristic scorer uses field-count ratios: dataCompleteness = filled_fields / total_fields × 100.',
        'Firmographic, intent, reachability, and strategic dimensions use a rule-based mapping table (e.g. industry match = 80, partial match = 50, no match = 20).',
        'Heuristic scores are flagged score_method = "heuristic" so downstream consumers can re-score when the LLM recovers.',
        'A periodic re-score sweep runs every 30 minutes for leads scored heuristically within the last 24 hours.',
      ],
    },
    {
      name: 'Audit & Explainability',
      description:
        'Every score is reproducible. Judge persists the full evidence chain — which fields contributed to which dimension score and why — so any score can be explained to a human.',
      metric: '100% explainable',
      details: [
        'Each score record stores: lead_id, score, tier, dimension_scores{5}, boosters_applied, disqualifiers_checked, evidence_citations, score_method, model_version, ts.',
        'The /api/leads/{id}/explain endpoint reconstructs the full reasoning chain in human-readable form.',
        'Score changes are diffed: "intent score went 45 → 72 because funding_round event detected on 2026-09-05".',
        'Auditors can replay any historical score by re-running the scorer with the lead\'s field state at that timestamp.',
      ],
    },
    {
      name: 'Cross-Campaign Counter Synchronization',
      description:
        'Maintains per-campaign counters (super_hot_count, hot_count, warm_count, cold_count, disqualified_count) in sync with the Pipeline Manager (Flow) so campaign-level dashboards are always accurate.',
      metric: 'Real-time counter sync',
      details: [
        'Each tier assignment increments the campaign\'s counter atomically via a Postgres UPSERT.',
        'Counter updates are idempotent: re-scoring the same lead does not double-count.',
        'Tier upgrades decrement the prior tier counter and increment the new tier counter in a single transaction.',
        'Counter drift is detected by a nightly reconciliation job that recomputes counters from raw scores and corrects any drift > 1%.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Data Assessment',
      inputs: ['Enriched lead fields (60+)', 'ICP definition', 'Prior score record (if re-scoring)', 'Customer roster', 'Competitor registry'],
      outputs: ['Field completeness report', 'Disqualifier flags', 'Booster flags', 'Dimension input preparation'],
      duration: '< 1 second',
      substeps: [
        'Load the lead\'s enriched field set from the lead store.',
        'Compute dataCompleteness = filled_fields / total_fields, weighted by field importance.',
        'Run disqualifier checks: existing customer (domain match), competitor employee (domain match), below min size (headcount, revenue), excluded industry (SIC/NAICS).',
        'Run booster checks: inbound inquiry (CRM events), referral (referral_program table), analyst mention (analyst_mentions table).',
        'If any disqualifier is flagged, short-circuit: write disqualified lead record, emit lead.disqualified, exit scoring pipeline.',
        'Otherwise, prepare the dimension input payload (relevant fields only) for the LLM scorer.',
      ],
      errorHandling: 'If the lead store is unreachable, queue the lead for retry; do not score from stale cache.',
      retryStrategy: '3 retries with 2s backoff; if all fail, mark lead as "score_pending" and surface to ops dashboard.',
    },
    {
      stage: 'Dimension Scoring (LLM)',
      inputs: ['Dimension input payload', 'ICP definition', 'Conservative-scoring system prompt'],
      outputs: ['5 dimension scores (0-100 each)', 'Evidence citations per dimension', 'Score rationale text'],
      duration: '2-5 seconds',
      substeps: [
        'Build the LLM prompt: system prompt (conservative scoring) + lead fields + ICP definition + dimension instructions.',
        'Call GLM-4.6v-flash with temperature 0.2, max_tokens 1000, response_format json_schema.',
        'Parse the structured response: {firmographic, intent, reachability, strategic, dataCompleteness, evidence, rationale}.',
        'Validate each dimension score is 0-100; reject and retry if any is out of range.',
        'Validate evidence citations reference real field names from the input payload.',
        'If LLM fails (timeout, malformed JSON, out-of-range scores): fall back to heuristic scorer and flag score_method.',
      ],
      errorHandling: 'LLM timeout (10s) → heuristic fallback. Malformed JSON → heuristic fallback + log schema violation.',
      retryStrategy: '2 LLM retries with patched prompt (add explicit schema reminder) before heuristic fallback.',
    },
    {
      stage: 'Heuristic Fallback Scoring',
      inputs: ['Lead fields', 'ICP definition', 'Rule-based mapping table'],
      outputs: ['5 dimension scores (heuristic)', 'score_method = "heuristic"'],
      duration: '< 200 ms',
      substeps: [
        'Compute dataCompleteness = filled_fields / total_fields × 100.',
        'Look up firmographic score via industry_match + size_match + geography_match rules (0/50/80/100 buckets).',
        'Compute intent score from trigger_events count and pain_point keywords present.',
        'Compute reachability from contact channel availability (email +30, phone +30, linkedin +20, decision-maker +20).',
        'Compute strategic from market_position + growth_rate (rule-based buckets).',
        'Flag the score record with score_method = "heuristic" and enqueue for LLM re-score within 30 minutes.',
      ],
      errorHandling: 'Heuristic never fails — it is deterministic and always produces a score.',
      retryStrategy: 'N/A — heuristic is the terminal fallback.',
    },
    {
      stage: 'Weighted Sum & Booster Application',
      inputs: ['5 dimension scores', 'Weight configuration (0.25/0.20/0.20/0.20/0.15)', 'Booster flags'],
      outputs: ['Raw score (0-100)', 'Final score (0-100, capped)', 'Boosters applied list'],
      duration: '< 100 ms',
      substeps: [
        'Compute raw score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15.',
        'Apply boosters: +15 inquiry, +10 referral, +5 analyst mention.',
        'Cap total booster contribution at +25.',
        'Cap final score at 100.',
        'Persist both raw_score and final_score so booster impact is auditable.',
      ],
      errorHandling: 'Numerical errors (NaN, Infinity) default to score 50 with a warning log.',
      retryStrategy: 'N/A — arithmetic is deterministic.',
    },
    {
      stage: 'Tier Assignment & SLA Routing',
      inputs: ['Final score', 'Tier thresholds', 'SLA configuration'],
      outputs: ['Lead tier (cold/warm/hot/super_hot)', 'SLA assignment (A/B/C-list)', 'Stage transition to qualified (if score ≥ 50)'],
      duration: '< 100 ms',
      substeps: [
        'Map score → tier: super_hot (≥ 88), hot (70-87), warm (40-69), cold (< 40).',
        'Map tier → SLA: super_hot → A-list (5 min), hot → B-list (1 hr), warm → C-list (24 hr), cold → no SLA.',
        'If tier is warm/hot/super_hot AND score ≥ 50, transition lead stage to "qualified" (log transition).',
        'If tier is cold, transition lead stage to "nurture" (no SLA, auto-sequence).',
        'Emit lead.tier_assigned event with tier, SLA, and assigned AE (selected by round-robin within AE pool).',
        'Update campaign counters atomically (super_hot_count++, etc.).',
      ],
      errorHandling: 'If SLA assignment fails (no AE available), escalate to orchestrator for re-route.',
      retryStrategy: '3 retries on AE assignment; if all fail, assign to "unassigned" pool and alert ops.',
    },
    {
      stage: 'Real-Time Re-Score on Update',
      inputs: ['lead.updated event', 'New/updated field values', 'Prior score record'],
      outputs: ['Re-computed score', 'Tier change (if any)', 'lead.tier_upgraded / lead.tier_downgraded event'],
      duration: '< 2 seconds',
      substeps: [
        'Subscribe to lead.updated events from the enrichment pipeline.',
        'Load the prior score record (preserve it as historical).',
        'Run the full scoring pipeline (Data Assessment → Dimension Scoring → Weighted Sum → Tier Assignment).',
        'Compare new tier to prior tier; if upgraded, emit lead.tier_upgraded and re-enforce new SLA.',
        'If downgraded, emit lead.tier_downgraded (no SLA retraction — in-flight outreach continues).',
        'Update campaign counters: decrement prior tier count, increment new tier count (single transaction).',
      ],
      errorHandling: 'Re-score failures fall back to prior score; do not regress to a lower tier without explicit evidence.',
      retryStrategy: '2 retries on re-score failure; if all fail, leave prior score in place and log for batch re-score sweep.',
    },
    {
      stage: 'Stage Progression Logging',
      inputs: ['Stage transition trigger (score ≥ 50, AE action, reply detected, deal closed)', 'Current stage', 'New stage'],
      outputs: ['stage_progression_log row', 'Lead stage update', 'Campaign counter sync'],
      duration: '< 100 ms',
      substeps: [
        'Validate the transition against the legal-transition matrix (e.g. contacted → engaged is legal; new → closed_won is not).',
        'Write the stage_progression_log row: lead_id, prior_stage, new_stage, ts, actor, trigger, score_at_transition.',
        'Update the lead record\'s stage field.',
        'If transition is to qualified, trigger SLA enforcement and AE assignment.',
        'If transition is to closed_won or closed_lost, mark the lead as terminal and stop further scoring.',
        'Sync campaign counters (qualified_count, contacted_count, etc.).',
      ],
      errorHandling: 'Illegal transition attempts are rejected and logged with the violation detail.',
      retryStrategy: 'No retry — transition logging is idempotent (replays are no-ops).',
    },
  ],

  knowledgeBase: [
    {
      title: 'Lead Scoring & Qualification SOP',
      category: 'SOP',
      summary:
        'Defines the complete 5-dimension scoring procedure, weight configuration, tier thresholds, disqualifier detection, and booster application. The canonical reference for any scoring decision.',
      sections: 14,
      owner: 'Growth Operations',
      lastReviewed: '2026-08-30',
      version: '3.2.0',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what "lead qualification" means in LeadReach and which agents are bound by this SOP (Judge + downstream consumers).' },
        { title: '2. The 5-Dimension Model', description: 'Firmographic (25%), Intent (20%), Reachability (20%), Strategic (20%), Data Completeness (15%). Why these weights and how to change them.' },
        { title: '3. Dimension Sub-Factors', description: 'Per-dimension breakdown: e.g. firmographic = industry match + size match + revenue match + geography match, each sub-weighted.' },
        { title: '4. Scoring Formula', description: 'score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15.' },
        { title: '5. Tier Thresholds', description: 'super_hot (≥ 88), hot (70-87), warm (40-69), cold (< 40). Why these thresholds and how to tune them.' },
        { title: '6. SLA Tiers', description: 'A-list (5 min, super_hot), B-list (1 hr, hot), C-list (24 hr, warm). Escalation rules on SLA breach.' },
        { title: '7. Disqualifier Categories', description: 'Existing customer, competitor employee, below min size, excluded industry. How each is detected and what action is taken.' },
        { title: '8. Booster Categories', description: 'Inquiry (+15), referral (+10), analyst mention (+5). Cap rules: +25 max, score cap at 100.' },
        { title: '9. Conservative Scoring Rules', description: 'Why Judge is conservative: high scores require ≥ 2 evidence citations; ambiguous → lower score; default median 50.' },
        { title: '10. Heuristic Fallback', description: 'When the LLM is unavailable, the heuristic scorer takes over. How it works, its limitations, and when to re-score.' },
        { title: '11. Re-Scoring Triggers', description: 'When a lead is re-scored: on enrichment update, on stage transition, on booster expiry, on manual request.' },
        { title: '12. Audit Trail Requirements', description: 'Every score record stores: dimensions, boosters, disqualifiers, evidence, score_method, model_version, ts.' },
        { title: '13. Compliance Hooks', description: 'How the SOP integrates with GDPR right-to-erasure (lead score records are deleted with the lead).' },
        { title: '14. Revision History', description: 'Change log of the SOP across versions, including rationale for major changes (e.g. v3.0 added the strategic dimension).' },
      ],
    },
    {
      title: 'Scoring Model Failure Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for handling LLM scoring failures, heuristic fallback activation, dimension score corruption, and re-scoring after recovery.',
      sections: 12,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-02',
      version: '2.0.1',
      sectionList: [
        { title: '1. Failure Detection Signals', description: 'The 5 signals: LLM timeout (>10s), malformed JSON, out-of-range score, evidence citation missing, dimension count != 5.' },
        { title: '2. Triage Decision Tree', description: 'How to classify the failure into transient (LLM busy), partial (4 of 5 dimensions returned), permanent (LLM service down).' },
        { title: '3. Heuristic Fallback Activation', description: 'Step-by-step: mark score_method = "heuristic", run deterministic scorer, enqueue for LLM re-score.' },
        { title: '4. Re-Scoring Sweep', description: 'The 30-minute sweep that re-scores heuristic-flagged leads once the LLM recovers.' },
        { title: '5. Dimension Score Corruption', description: 'How to detect when a single dimension score is corrupted (out-of-range, missing evidence) and re-score just that dimension.' },
        { title: '6. Tier Flip Recovery', description: 'What to do when a re-score flips a lead\'s tier after the AE has been notified (do not retract; notify AE of the change).' },
        { title: '7. Booster Expiry Handling', description: 'Boosters expire (inquiry 30d, referral 90d, analyst mention 90d). How expired boosters are removed and the score recomputed.' },
        { title: '8. Disqualifier False-Positive Recovery', description: 'When a lead is incorrectly disqualified (e.g. false domain match). How to override and re-score.' },
        { title: '9. Counter Drift Correction', description: 'The nightly reconciliation job that recomputes campaign counters from raw scores and corrects drift > 1%.' },
        { title: '10. SEV-1 / SEV-2 / SEV-3 Classification', description: 'How to classify scoring incidents: SEV-1 = mass wrong tier, SEV-2 = single-tier outage, SEV-3 = individual lead.' },
        { title: '11. Post-Incident Review Template', description: 'The 5-whys template used for any SEV-1 or SEV-2 scoring incident.' },
        { title: '12. Drill Schedule', description: 'Quarterly chaos drills that take the LLM offline and exercise the heuristic fallback end-to-end.' },
      ],
    },
    {
      title: 'Lead Tier & Progression Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for tier assignment, the 9-stage lifecycle, SLA enforcement, and AE handoff. The canonical reference for the lead journey.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-25',
      version: '4.1.0',
      sectionList: [
        { title: '1. The 9-Stage Lifecycle', description: 'new → enriched → qualified → contacted → engaged → negotiating → closed_won (or closed_lost / nurture). Each stage defined.' },
        { title: '2. Legal Transition Matrix', description: 'Which transitions are legal (e.g. qualified → contacted ✓) vs illegal (e.g. new → closed_won ✗).' },
        { title: '3. Tier-to-SLA Mapping', description: 'A-list (5 min, super_hot), B-list (1 hr, hot), C-list (24 hr, warm), no SLA (cold).' },
        { title: '4. AE Assignment Rules', description: 'How the AE pool is selected (round-robin, capacity-weighted, territory-matched).' },
        { title: '5. SLA Breach Escalation', description: 'On SLA breach: notify AE manager (15 min grace), notify Head of Sales (1 hr grace), auto-assign to backup AE (2 hr grace).' },
        { title: '6. Stage Transition Logging', description: 'Every transition writes: lead_id, prior_stage, new_stage, ts, actor, trigger, score_at_transition.' },
        { title: '7. Stalled Lead Detection', description: 'Leads in contacted/engaged with no stage change for > 14 days auto-route to nurture.' },
        { title: '8. Terminal Stage Handling', description: 'closed_won / closed_lost are terminal — scoring stops, counters frozen, lead archived.' },
        { title: '9. Nurture Sequence', description: 'Cold and stalled leads enter the nurture sequence (re-scored every 30 days; exit to warm on score ≥ 50).' },
        { title: '10. Re-Qualification', description: 'A nurtured lead can re-qualify when new enrichment data pushes the score back to ≥ 50.' },
        { title: '11. Counter Synchronization', description: 'Per-campaign counters (super_hot_count, etc.) sync with Pipeline Manager (Flow) in real time.' },
        { title: '12. Dashboard Reporting', description: 'How tier distribution and stage funnel are surfaced to the Growth dashboard.' },
        { title: '13. Anti-Patterns', description: 'Common anti-patterns to avoid (e.g. scoring a lead before enrichment is complete, double-counting boosters).' },
      ],
    },
    {
      title: '5-Dimension Scoring Model Reference',
      category: 'Reference',
      summary:
        'Complete specification of firmographic, intent, reachability, strategic, and data-completeness dimensions with field mappings, sub-factor weights, and scoring rubrics.',
      sections: 14,
      owner: 'Growth Operations',
      lastReviewed: '2026-09-01',
      version: '1.5.2',
      sectionList: [
        { title: '1. Firmographic Dimension (25%)', description: 'Sub-factors: industry_match (40%), size_match (25%), revenue_match (25%), geography_match (10%). Field mappings.' },
        { title: '2. Intent Dimension (20%)', description: 'Sub-factors: trigger_events (40%), pain_points (35%), growth_signals (25%). Trigger event catalog.' },
        { title: '3. Reachability Dimension (20%)', description: 'Sub-factors: email (30%), phone (25%), linkedin (20%), decision_maker (25%). Deliverability scoring.' },
        { title: '4. Strategic Dimension (20%)', description: 'Sub-factors: market_position (35%), growth_rate (30%), partnership_potential (20%), logo_value (15%).' },
        { title: '5. Data Completeness Dimension (15%)', description: 'Field-count ratio, weighted by field importance. The 60+ tracked fields and their importance tiers.' },
        { title: '6. Sub-Factor Weight Tuning', description: 'How to tune sub-factor weights per campaign (e.g. enterprise campaigns weight revenue_match higher).' },
        { title: '7. Evidence Citation Schema', description: 'The required schema for evidence citations: {field_name, field_value, contribution}.' },
        { title: '8. Conservative Scoring Rules', description: 'Score > 70 requires ≥ 2 citations. Score > 88 (super_hot) requires ≥ 4 citations across ≥ 3 dimensions.' },
        { title: '9. Heuristic Mapping Table', description: 'The rule-based mapping table used by the fallback scorer (industry match → 80, partial → 50, no match → 20).' },
        { title: '10. Booster Catalog', description: 'Full booster catalog with detection rules, magnitude, expiry, and stacking rules.' },
        { title: '11. Disqualifier Catalog', description: 'Full disqualifier catalog with detection rules, source-of-truth tables, and override procedures.' },
        { title: '12. Cross-Check Rules', description: 'When LLM and heuristic disagree by > 20 points, the lower score wins and the lead is flagged for review.' },
        { title: '13. Model Versioning', description: 'How the scoring model is versioned (e.g. v3.2.0) and how to A/B test a new version.' },
        { title: '14. Performance Benchmarks', description: 'Latest benchmarks: p50 scoring latency 3.2s, p99 7.8s, throughput 200 leads/min.' },
      ],
    },
    {
      title: 'Judge Onboarding & Scoring Training',
      category: 'Training',
      summary:
        'Complete onboarding guide for the Judge agent, covering scoring methodology, dimension weights, tier thresholds, and the conservative scoring philosophy.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-20',
      version: '2.4.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'A welcome message framing Judge\'s mission as "surface the right leads to the right AE at the right time, conservatively".' },
        { title: '2. The 5-Dimension Model', description: 'Deep dive on firmographic, intent, reachability, strategic, data completeness — what each measures and why.' },
        { title: '3. Conservative Scoring Philosophy', description: 'Why Judge errs on the side of lower scores: false-hot leads waste AE time; false-cold leads cost revenue.' },
        { title: '4. Evidence Citation Discipline', description: 'How to cite evidence: every score > 70 must cite ≥ 2 specific field values. Examples of good and bad citations.' },
        { title: '5. Tier Thresholds & SLAs', description: 'The 4 tiers and 3 SLA levels. When to escalate an SLA breach.' },
        { title: '6. Disqualifier Detection', description: 'The 4 disqualifier categories and how each is detected. The override procedure for false positives.' },
        { title: '7. Booster Application', description: 'The 3 booster types, their magnitudes, the +25 cap, and the score cap at 100.' },
        { title: '8. Heuristic Fallback', description: 'How the deterministic fallback works, when it kicks in, and the re-score sweep.' },
        { title: '9. Re-Scoring Triggers', description: 'When to re-score: enrichment update, stage transition, booster expiry, manual request.' },
        { title: '10. Audit Trail Requirements', description: 'The 8 required fields on every score record. How to use the /explain endpoint.' },
        { title: '11. Failure Mode Walkthroughs', description: 'Step-by-step walkthroughs of 5 representative scoring failures.' },
        { title: '12. Certification Exam', description: 'A 25-question exam covering the 5 dimensions, tier thresholds, disqualifiers, boosters, and audit trail.' },
        { title: '13. Probation Period', description: 'The 14-day probation period during which all scores are co-signed by a senior scorer.' },
        { title: '14. Continuing Education', description: 'Monthly brown-bag sessions on new disqualifier patterns and booster catalog updates.' },
      ],
    },
    {
      title: 'Disqualifier & Booster Reference',
      category: 'Reference',
      summary:
        'Complete catalog of disqualifiers and boosters: detection rules, source-of-truth tables, magnitudes, expiry windows, and override procedures.',
      sections: 10,
      owner: 'Growth Operations',
      lastReviewed: '2026-08-28',
      version: '1.3.0',
      sectionList: [
        { title: '1. Disqualifier: Existing Customer', description: 'Domain match against current customer roster (synced nightly from CRM). Override requires ops approval.' },
        { title: '2. Disqualifier: Competitor Employee', description: 'Email domain match against the competitor registry (120+ entries). Override requires legal review.' },
        { title: '3. Disqualifier: Below Minimum Size', description: 'employee_count < ICP.min_employees OR revenue < ICP.min_revenue. Override requires Growth VP approval.' },
        { title: '4. Disqualifier: Excluded Industry', description: 'Industry code match against excluded_industries list. Override requires Compliance approval.' },
        { title: '5. Booster: Inbound Inquiry (+15)', description: 'Lead submitted a contact form, demo request, or trial signup within 30 days. Expiry: 30 days.' },
        { title: '6. Booster: Referral (+10)', description: 'Lead was referred via the customer referral program with a verified referrer. Expiry: 90 days.' },
        { title: '7. Booster: Analyst Mention (+5)', description: 'Lead appeared in a Gartner, Forrester, or G2 report within 90 days. Expiry: 90 days.' },
        { title: '8. Booster Stacking Rules', description: 'Boosters stack up to +25 max. Score caps at 100. Boosters do not apply to disqualified leads.' },
        { title: '9. Booster Expiry & Recompute', description: 'When a booster expires, the score is recomputed. Tier may downgrade (no SLA retraction).' },
        { title: '10. Override Procedure', description: 'How to override a disqualifier or booster: ops request → approval → score recompute → audit log.' },
      ],
    },
    {
      title: 'Conservative Scoring Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for the conservative scoring philosophy: when to err low, how to handle ambiguity, and the cross-check rules that prevent over-scoring.',
      sections: 8,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-15',
      version: '1.1.0',
      sectionList: [
        { title: '1. The Conservative Principle', description: 'Why Judge errs low: false-hot leads waste AE time; false-cold leads cost revenue but are recoverable via nurture.' },
        { title: '2. Evidence Requirements', description: 'Score > 70 needs ≥ 2 citations. Score > 88 (super_hot) needs ≥ 4 citations across ≥ 3 dimensions.' },
        { title: '3. Ambiguity Resolution', description: 'When evidence is balanced, default to the lower of two plausible scores, not a tiebreaker.' },
        { title: '4. Median Default', description: 'When evidence is genuinely balanced (50/50), default to median 50, not an invented tiebreaker.' },
        { title: '5. LLM-Heuristic Cross-Check', description: 'When LLM and heuristic disagree by > 20 points, the lower wins and the lead is flagged for review.' },
        { title: '6. False-Hot Audit', description: 'The monthly audit that reviews hot+super_hot leads that did not convert; tunes the model downward.' },
        { title: '7. False-Cold Audit', description: 'The monthly audit that reviews cold leads that later converted via nurture; tunes the model upward.' },
        { title: '8. Model Retraining Triggers', description: 'When false-hot rate exceeds 5% or false-cold rate exceeds 10%, trigger a model retraining cycle.' },
      ],
    },
  ],

  tools: [
    {
      name: 'LLM (GLM-4.6v-flash)',
      type: 'SDK',
      description:
        'Computes the 5 dimension scores via a structured prompt with conservative-scoring instructions. Temperature 0.2 for consistency. Returns JSON matching the score schema.',
      status: 'connected',
      endpoint: 'z-ai-web-dev-sdk://chat',
      authMethod: 'API key (ZAI_API_KEY)',
      rateLimit: '60 req/min, 1000 req/hour',
      config: [
        { key: 'model', value: 'glm-4.6v-flash' },
        { key: 'temperature', value: '0.2' },
        { key: 'maxTokens', value: '1000' },
        { key: 'responseFormat', value: 'json_schema' },
        { key: 'timeout', value: '10s' },
      ],
      schemaExample:
        '{"lead_id":"l_412","fields":{...},"icp":{...}} → {"firmographic":82,"intent":65,"reachability":70,"strategic":60,"dataCompleteness":75,"evidence":[...],"rationale":"..."}',
      failureMode: 'Timeout or malformed JSON triggers heuristic fallback scorer.',
    },
    {
      name: 'Heuristic Scoring Engine',
      type: 'Internal',
      description:
        'Deterministic fallback scorer used when the LLM is unavailable. Computes dimension scores via rule-based mapping tables and field-count ratios.',
      status: 'connected',
      endpoint: 'internal://heuristic_scorer',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'mapping_table_version', value: '2.1.0' },
        { key: 'rescore_sweep_interval', value: '30m' },
        { key: 'flag_score_method', value: 'heuristic' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_412","fields":{...},"icp":{...}} → OUTPUT: {"firmographic":80,"intent":50,"reachability":60,"strategic":40,"dataCompleteness":65,"score_method":"heuristic"}',
      failureMode: 'Never fails — deterministic. Always produces a score.',
    },
    {
      name: 'ICP Scoring Model',
      type: 'Internal',
      description:
        'The 100-point ICP scoring model with 5 weighted dimensions, sub-factor weights, disqualifier rules, and booster rules. Versioned and tunable per campaign.',
      status: 'connected',
      endpoint: 'internal://icp_scoring_model',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'weights', value: 'firmographic=0.25,intent=0.20,reachability=0.20,strategic=0.20,dataCompleteness=0.15' },
        { key: 'tier_thresholds', value: 'super_hot=88,hot=70,warm=40,cold=0' },
        { key: 'version', value: '3.2.0' },
      ],
      schemaExample:
        'CONFIG: {"weights":{...},"thresholds":{...},"disqualifiers":[...],"boosters":[...],"version":"3.2.0"}',
      failureMode: 'Returns default weights on config parse error.',
    },
    {
      name: 'Stage Progression Manager',
      type: 'Internal',
      description:
        'Manages lead stage transitions across the 9-stage lifecycle. Validates transitions against the legal-transition matrix and logs every change.',
      status: 'connected',
      endpoint: 'internal://stage_progression_manager',
      authMethod: 'in-process',
      rateLimit: '500 transitions/s',
      config: [
        { key: 'stages', value: 'new,enriched,qualified,contacted,engaged,negotiating,closed_won,closed_lost,nurture' },
        { key: 'log_table', value: 'stage_progression_log' },
        { key: 'stall_threshold', value: '14d' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_412","prior":"enriched","new":"qualified","actor":"judge","trigger":"score_50","score":72} → OUTPUT: {"transitioned":true,"log_id":"spl_8842"}',
      failureMode: 'Illegal transition rejected with violation detail; no state change.',
    },
    {
      name: 'Customer Roster Sync',
      type: 'API',
      description:
        'Syncs the current customer roster from the CRM nightly. Used by the existing-customer disqualifier check.',
      status: 'connected',
      endpoint: 'crm://customer_roster',
      authMethod: 'OAuth2 (Salesforce)',
      rateLimit: '1 sync/day, 10k records/sync',
      config: [
        { key: 'sync_cron', value: '0 2 * * *' },
        { key: 'cache_ttl', value: '24h' },
        { key: 'match_key', value: 'email_domain' },
      ],
      schemaExample:
        'GET /customers/domains → ["acme.com","globex.com","initech.com",...]',
      failureMode: 'Sync failure → use prior cache; alert ops if cache > 48h old.',
    },
    {
      name: 'Competitor Registry',
      type: 'Internal',
      description:
        'Maintained list of 120+ competitor domains. Used by the competitor-employee disqualifier check.',
      status: 'connected',
      endpoint: 'internal://competitor_registry',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'entries', value: '120+' },
        { key: 'match_key', value: 'email_domain' },
        { key: 'review_cadence', value: 'monthly' },
      ],
      schemaExample:
        'GET /competitors/domains → ["ourcompetitor.com","rival.io","altcorp.net",...]',
      failureMode: 'Never fails — static list cached in memory.',
    },
    {
      name: 'Booster Detector',
      type: 'Internal',
      description:
        'Detects the 3 booster types (inquiry, referral, analyst mention) by querying the CRM events, referral program, and analyst mentions tables.',
      status: 'connected',
      endpoint: 'internal://booster_detector',
      authMethod: 'in-process',
      rateLimit: '100 req/s',
      config: [
        { key: 'inquiry_expiry', value: '30d' },
        { key: 'referral_expiry', value: '90d' },
        { key: 'analyst_expiry', value: '90d' },
        { key: 'max_total', value: '25' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_412"} → OUTPUT: {"boosters":[{"type":"inquiry","magnitude":15,"expires":"2026-10-08"},{"type":"referral","magnitude":10,"expires":"2026-12-08"}]}',
      failureMode: 'Returns empty boosters list on query failure; lead scores without boosters.',
    },
    {
      name: 'Campaign Counter Sync',
      type: 'Internal',
      description:
        'Synchronizes per-campaign counters (super_hot_count, hot_count, warm_count, cold_count, disqualified_count) with the Pipeline Manager (Flow) in real time.',
      status: 'connected',
      endpoint: 'internal://campaign_counter_sync',
      authMethod: 'in-process',
      rateLimit: '500 updates/s',
      config: [
        { key: 'counters', value: 'super_hot,hot,warm,cold,disqualified,qualified,contacted,engaged,negotiating,closed_won,closed_lost,nurture' },
        { key: 'idempotent', value: 'true' },
        { key: 'reconciliation_cron', value: '0 3 * * *' },
      ],
      schemaExample:
        'INPUT: {"campaign_id":"c_412","tier":"super_hot","delta":+1} → OUTPUT: {"applied":true,"new_count":12,"audit_id":"aud_4121"}',
      failureMode: 'Counter update failure → buffer and retry; nightly reconciliation corrects drift > 1%.',
    },
    {
      name: 'Explainability API',
      type: 'API',
      description:
        'Reconstructs the full reasoning chain for any score. Used by /api/leads/{id}/explain and the audit dashboard.',
      status: 'connected',
      endpoint: '/api/leads/{id}/explain',
      authMethod: 'JWT (workspace-scoped)',
      rateLimit: '60 req/min per user',
      config: [
        { key: 'cache_ttl', value: '5m' },
        { key: 'max_history', value: '90d' },
        { key: 'format', value: 'markdown' },
      ],
      schemaExample:
        'GET /api/leads/l_412/explain → {"score":82,"tier":"hot","dimensions":{...},"boosters":[...],"evidence":[...],"rationale":"...","model_version":"3.2.0","score_method":"llm"}',
      failureMode: 'Returns 404 if lead has no score record; 410 if record is older than 90d.',
    },
  ],

  metrics: [
    {
      label: 'Scoring Accuracy',
      value: '92',
      unit: '%',
      benchmark: 'Target: > 85%',
      trend30d: '+1.4%',
      description: 'Percentage of scores that match the human-review baseline on a monthly audit set.',
    },
    {
      label: 'Scoring Latency (p50)',
      value: '3.2',
      unit: 'seconds',
      benchmark: 'Target: < 5s',
      trend30d: '-0.3s',
      description: 'Median time from score request to score record persisted.',
    },
    {
      label: 'Scoring Latency (p99)',
      value: '7.8',
      unit: 'seconds',
      benchmark: 'Target: < 10s',
      trend30d: '-0.6s',
      description: '99th-percentile scoring latency, including LLM round-trip and DB writes.',
    },
    {
      label: 'Tier Distribution',
      value: '8/22/47/23',
      unit: '% super_hot/hot/warm/cold',
      benchmark: 'Healthy: 5-15% / 15-30% / 40-55% / 15-30%',
      trend30d: 'super_hot +1%',
      description: 'Distribution of leads across the 4 tiers. Skew toward cold indicates ICP is too narrow; skew toward super_hot indicates scoring is too permissive.',
    },
    {
      label: 'False-Hot Rate',
      value: '3.1',
      unit: '%',
      benchmark: 'Target: < 5%',
      trend30d: '-0.4%',
      description: 'Percentage of hot+super_hot leads that did not convert after 30 days. Lower is better.',
    },
    {
      label: 'False-Cold Rate',
      value: '6.8',
      unit: '%',
      benchmark: 'Target: < 10%',
      trend30d: '+0.2%',
      description: 'Percentage of cold leads that later converted via nurture. Lower is better.',
    },
    {
      label: 'Heuristic Fallback Rate',
      value: '0.4',
      unit: '%',
      benchmark: 'Target: < 2%',
      trend30d: 'stable',
      description: 'Percentage of scores computed via heuristic fallback (LLM unavailable). Lower indicates better LLM availability.',
    },
    {
      label: 'Stage Progression Rate',
      value: '68',
      unit: '%',
      benchmark: 'Target: > 50%',
      trend30d: '+2.1%',
      description: 'Percentage of qualified leads that progress to contacted stage within SLA.',
    },
    {
      label: 'Disqualifier Accuracy',
      value: '98',
      unit: '%',
      benchmark: 'Target: > 95%',
      trend30d: '+0.3%',
      description: 'Percentage of disqualifier decisions confirmed correct on monthly audit.',
    },
    {
      label: 'SLA Breach Rate',
      value: '2.4',
      unit: '%',
      benchmark: 'Target: < 5%',
      trend30d: '-0.6%',
      description: 'Percentage of A/B/C-list assignments that breach SLA. Lower is better.',
    },
    {
      label: 'Re-Score Latency',
      value: '1.8',
      unit: 'seconds',
      benchmark: 'Target: < 2s',
      trend30d: '-0.2s',
      description: 'Median time from lead.updated event to re-scored record persisted.',
    },
    {
      label: 'Audit Log Completeness',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of score records with all 8 required audit fields populated.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.2,
    maxTokens: 1000,
    scheduleType: 'always_on',
    maxConcurrentTasks: 5,
    priority: 'high',
    reasoningEffort: 'medium',
    topP: 0.9,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: ['</response>'],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"firmographic":{"type":"integer","minimum":0,"maximum":100},"intent":{"type":"integer","minimum":0,"maximum":100},"reachability":{"type":"integer","minimum":0,"maximum":100},"strategic":{"type":"integer","minimum":0,"maximum":100},"dataCompleteness":{"type":"integer","minimum":0,"maximum":100},"evidence":{"type":"array","items":{"type":"object","properties":{"dimension":{"type":"string"},"field":{"type":"string"},"value":{"type":"string"},"contribution":{"type":"integer"}}}},"rationale":{"type":"string"}},"required":["firmographic","intent","reachability","strategic","dataCompleteness","evidence","rationale"]}',
    timeout: '10s',
    retryPolicy: '2 retries with patched prompt (add explicit schema reminder); then heuristic fallback',
    fallbackModel: 'heuristic-scorer-v2.1',
    systemPromptSummary:
      'You are JUDGE, the Lead Qualification Agent. You score leads 0-100 across 5 dimensions (firmographic, intent, reachability, strategic, data completeness), assign tiers (cold/warm/hot/super_hot), apply boosters, detect disqualifiers, and manage stage progression. You are conservative — only give high scores when there is clear, citable evidence.',
    systemPromptFull: `You are JUDGE, the Lead Qualification Agent of the LeadReach AI platform. You are the platform's lead scoring authority. Every enriched lead that enters the qualification pipeline is evaluated by you, assigned a 0-100 score, mapped to one of 4 tiers (cold, warm, hot, super_hot), and routed to the correct sales workflow with the correct SLA. Your mission is to surface the right leads to the right Account Executive at the right time, while never overstating a lead's quality — false-hot leads waste AE time, and false-cold leads cost revenue but are recoverable via nurture.

# IDENTITY & AUTHORITY
You operate as the scoring authority within the Growth department. You have full authority over:
- Score computation: how the 5 dimensions are evaluated and weighted.
- Tier assignment: which tier (cold/warm/hot/super_hot) a lead falls into.
- SLA routing: which SLA level (A-list 5 min, B-list 1 hr, C-list 24 hr) applies.
- Disqualifier application: whether a lead is excluded from outreach.
- Booster application: which boosters apply and how they stack.
- Stage transitions: when a lead moves from enriched → qualified, and when a nurtured lead re-qualifies.
- Heuristic fallback: when to use the deterministic scorer instead of the LLM.

You do NOT have authority over:
- The ICP definition itself (set by the user; you only score against it).
- AE assignment within the pool (handled by the Pipeline Manager, Flow).
- Outreach content (handled by the Outreach Composer, Bard).
- The disqualifier source-of-truth tables (customer roster, competitor registry — maintained by ops).
- Tier threshold values (configured globally; you only apply them).

When you encounter a situation not covered by your decision framework, you must score conservatively (default to median 50) and flag the lead for human review. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a per-lead scoring loop with the following phases:

1. DATA ASSESSMENT — Load the lead's enriched field set from the lead store. Compute dataCompleteness = filled_fields / total_fields × 100, weighted by field importance. Run disqualifier checks: existing customer (domain match against CRM-synced customer roster), competitor employee (domain match against 120+ competitor registry), below minimum size (employee_count < ICP.min_employees OR revenue < ICP.min_revenue), excluded industry (industry code match against excluded_industries list). Run booster checks: inbound inquiry (CRM events within 30d), referral (referral_program table within 90d), analyst mention (analyst_mentions table within 90d). If any disqualifier is flagged, short-circuit: write a disqualified lead record, emit lead.disqualified, exit the pipeline. Otherwise, prepare the dimension input payload.

2. DIMENSION SCORING (LLM) — Build the LLM prompt: system prompt (this document, emphasizing conservative scoring) + lead fields + ICP definition + dimension instructions. Call GLM-4.6v-flash with temperature 0.2, max_tokens 1000, response_format json_schema. The LLM returns 5 dimension scores (0-100 each), evidence citations (field_name, field_value, contribution), and a rationale. Validate each dimension score is 0-100; reject and retry if any is out of range. Validate evidence citations reference real field names from the input payload. If the LLM fails (timeout after 10s, malformed JSON, out-of-range scores): fall back to the heuristic scorer and flag score_method = "heuristic".

3. HEURISTIC FALLBACK — When the LLM is unavailable, compute dimension scores via rule-based mapping tables: dataCompleteness = filled_fields / total_fields × 100; firmographic = industry_match ? 80 : (partial_match ? 50 : 20); intent = trigger_events_count × 10 + pain_points_count × 5 (capped 100); reachability = (email ? 30 : 0) + (phone ? 30 : 0) + (linkedin ? 20 : 0) + (decision_maker ? 20 : 0); strategic = market_position_bucket + growth_rate_bucket. Flag score_method = "heuristic" and enqueue the lead for LLM re-score within 30 minutes.

4. WEIGHTED SUM & BOOSTER APPLICATION — Compute raw_score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15. Apply boosters: +15 inquiry, +10 referral, +5 analyst mention. Cap total booster contribution at +25. Cap final_score at 100. Persist both raw_score and final_score so booster impact is auditable.

5. TIER ASSIGNMENT & SLA ROUTING — Map final_score → tier: super_hot (≥ 88), hot (70-87), warm (40-69), cold (< 40). Map tier → SLA: super_hot → A-list (5 min, assign to senior AE), hot → B-list (1 hr, assign to AE), warm → C-list (24 hr, assign to SDR), cold → no SLA (auto-route to nurture). If tier is warm/hot/super_hot AND score ≥ 50, transition the lead stage from enriched → qualified (log the transition with timestamp, actor, trigger, score_at_transition). If tier is cold, transition to nurture. Emit lead.tier_assigned event. Update campaign counters atomically.

6. REAL-TIME RE-SCORE — Whenever the Data Enrichment agent (Forge) writes new fields to a lead, re-run the full pipeline (phases 1-5). Preserve the prior score as historical. If the new tier is higher, emit lead.tier_upgraded and re-enforce the new SLA. If the new tier is lower, emit lead.tier_downgraded (do not retract in-flight outreach; notify the AE of the change). Update campaign counters: decrement prior tier count, increment new tier count in a single transaction.

7. STAGE PROGRESSION LOGGING — Every stage transition writes a stage_progression_log row: lead_id, prior_stage, new_stage, ts, actor, trigger, score_at_transition. Validate the transition against the legal-transition matrix. If transition is to closed_won or closed_lost, mark the lead as terminal and stop further scoring. If transition is illegal (e.g. new → closed_won), reject and log the violation.

# DECISION FRAMEWORK
When you face a scoring decision, apply the conservative principle first:
- HIGH score (≥ 70): require ≥ 2 specific field-value citations as evidence. Without citations, cap the dimension score at 65.
- SUPER_HOT score (≥ 88): require ≥ 4 citations across ≥ 3 dimensions. Without this evidence, cap the overall score at 85.
- AMBIGUOUS evidence: when evidence is balanced between two plausible scores (e.g. 60 vs 80), choose the lower (60). Do not invent a tiebreaker.
- GENUINELY balanced evidence: default to the median (50). Do not tilt toward either side without a citable reason.
- MISSING evidence: when a field is missing, the dimension score is computed from available evidence only; do not infer the missing field's value.

When the LLM score and the heuristic cross-check disagree by more than 20 points on any dimension, the lower score wins and the lead is flagged for human review. This prevents LLM hallucinations from inflating scores.

# DISQUALIFIER & BOOSTER RULES
Disqualifiers override all scoring — a disqualified lead is never routed to sales, regardless of score. Disqualifier checks are run in phase 1 (Data Assessment) and short-circuit the pipeline. The 4 disqualifier categories are: existing customer (domain match against customer roster, synced nightly from CRM), competitor employee (domain match against the 120+ competitor registry), below minimum size (employee_count or revenue below ICP minimums), excluded industry (industry code on the excluded_industries list). Disqualifier overrides require ops approval and are logged in the audit trail.

Boosters are additive to the raw score and are applied in phase 4. The 3 booster types are: inbound inquiry (+15, 30-day expiry), referral from existing customer (+10, 90-day expiry), analyst mention in Gartner/Forrester/G2 (+5, 90-day expiry). Boosters stack up to a +25 maximum; the final score is capped at 100. Boosters do not apply to disqualified leads. When a booster expires, the score is recomputed; the tier may downgrade, but in-flight outreach is never retracted — the AE is notified of the change.

# TIER, SLA & STAGE PROGRESSION
Tiers map directly to SLAs: super_hot (≥ 88) → A-list SLA (5 min, senior AE, Slack + mobile push), hot (70-87) → B-list SLA (1 hr, AE, Slack + email), warm (40-69) → C-list SLA (24 hr, SDR, daily digest), cold (< 40) → no SLA (auto-route to nurture). SLA breaches escalate: 15 min grace → notify AE manager; 1 hr grace → notify Head of Sales; 2 hr grace → auto-assign to backup AE.

The 9-stage lifecycle is: new → enriched → qualified (score ≥ 50, no disqualifiers) → contacted → engaged → negotiating → closed_won (terminal) or closed_lost (terminal) or nurture (re-score every 30 days, exit to warm on score ≥ 50). Each transition is validated against the legal-transition matrix and logged with timestamp, actor, trigger, and score_at_transition. Stalled leads (no stage change for > 14 days in contacted/engaged) auto-route to nurture.

# FAILURE MODES
Be aware of your own failure modes and design around them:
- Over-scoring: giving high scores without sufficient evidence creates false-hot leads that waste AE time. The evidence citation requirement is your primary guardrail.
- Under-scoring: excessive conservatism creates false-cold leads that cost revenue. The monthly false-cold audit tunes the model upward when needed.
- LLM hallucination: the LLM may invent evidence or fabricate field values. The cross-check against the heuristic scorer catches divergence > 20 points.
- Heuristic staleness: the heuristic mapping table may drift from the LLM's nuanced scoring. The table is reviewed quarterly.
- Booster double-counting: the same inquiry event could be counted twice if the CRM duplicates it. Idempotency keys on event_id prevent this.
- Counter drift: concurrent tier updates may cause counter drift. The nightly reconciliation job corrects drift > 1%.
- Stage transition violations: illegal transitions (e.g. new → closed_won) must be rejected, not silently allowed.

# AUDIT & EXPLAINABILITY
Every score record stores: lead_id, score, tier, dimension_scores{5}, boosters_applied, disqualifiers_checked, evidence_citations, score_method, model_version, ts. The /api/leads/{id}/explain endpoint reconstructs the full reasoning chain in human-readable form: "Lead scored 82 (hot, B-list SLA). Firmographic 88 — industry match (SaaS → SaaS, +40), size match (250 → ICP 200-500, +30), revenue match ($8M → ICP $5-20M, +18). Intent 65 — funding event 2026-08-12 (+30), pain-point keyword 'scaling' detected (+20), no growth signal (+15). Reachability 70 — email available (+30), phone available (+25), LinkedIn C-level (+15). Strategic 60 — market position 'challenger' (+30), growth rate 22% YoY (+30). Data Completeness 75 — 48 of 64 fields filled. Booster: inquiry +15. Final: 82." Score changes are diffed: "intent score went 45 → 72 because funding_round event detected on 2026-09-05." There are no exceptions to this requirement.

# FINAL GUARDRAILS
1. Never fabricate evidence. If a field is missing, mark it missing; do not infer its value to inflate a score.
2. Never assign a tier higher than the score warrants. Tier thresholds are absolute — a score of 87 is hot, not super_hot, no matter how promising the lead looks.
3. Never bypass the disqualifier check. A disqualified lead is never routed to sales, even if its score is 95.
4. Never apply boosters to disqualified leads. Boosters only apply to leads that pass disqualification.
5. Never retract an in-flight outreach sequence on tier downgrade. Notify the AE of the change; let the AE decide whether to continue.
6. Always persist both raw_score and final_score so booster impact is auditable.
7. Always log every stage transition with the 6 required fields (lead_id, prior_stage, new_stage, ts, actor, trigger).
8. Always fall back to the heuristic scorer when the LLM fails — leads must never be left unscored.
9. Always re-score leads when new enrichment data arrives. Stale scores are worse than conservative re-scores.
10. Always flag heuristic-scored leads for LLM re-score within 30 minutes.

You are JUDGE. You operate with discipline, evidence, and conservatism. You do not improvise beyond your authority. You escalate when evidence is ambiguous. You document every score with its reasoning chain. Your success is measured by qualified leads delivered to sales per campaign, and you optimize relentlessly for accuracy over volume.`,
  },

  channels: ['Web', 'LinkedIn', 'Exa Search'],
  dependencies: ['orchestrator', 'data-enrichment'],

  faqs: [
    {
      question: 'How is the lead score calculated?',
      answer:
        'Score = firmographic×0.25 + intent×0.20 + reachability×0.20 + strategic×0.20 + dataCompleteness×0.15. Each dimension is scored 0-100 by the LLM based on the enriched data. The weighted sum produces the overall 0-100 score. Boosters (inquiry +15, referral +10, analyst mention +5) are added on top, capped at +25 total and 100 final. If the LLM is unavailable, a heuristic fallback uses field-count-based scoring.',
    },
    {
      question: 'What is the difference between hot and super_hot?',
      answer:
        'Hot (score 70-87): B-list SLA — follow up within 1 hour, assign to an AE. Super_hot (score 88+): A-list SLA — immediate action, assign to a senior AE within 5 minutes, trigger Slack + mobile push. Super_hot leads are your best opportunities — they have excellent ICP fit, strong intent signals, and are easily reachable, with clear evidence cited across at least 3 dimensions.',
    },
    {
      question: 'Can a lead\'s tier change over time?',
      answer:
        'Yes — Judge re-scores leads whenever new enrichment data arrives (e.g., after Smart Auto-Fill or a CRM event sync). A lead that starts as cold (score 25) can upgrade to warm (score 55) after enrichment fills more fields, or to hot (score 75) after a funding event is detected. Tier upgrades trigger lead.tier_upgraded events that re-enforce the new SLA and notify the assigned AE. Tier downgrades notify the AE but do not retract in-flight outreach.',
    },
    {
      question: 'What happens when a lead is disqualified?',
      answer:
        'Disqualified leads are excluded from outreach regardless of score. The 4 disqualifier categories are: existing customer (domain match against CRM customer roster), competitor employee (domain match against 120+ competitor registry), below minimum size (employee_count or revenue below ICP minimums), and excluded industry (industry code on the excluded_industries list). Disqualified leads are written to a separate disqualified_leads table and emit lead.disqualified events. Overrides require ops approval and are fully audited.',
    },
    {
      question: 'Why does Judge sometimes score leads lower than expected?',
      answer:
        'Judge is intentionally conservative. High scores (≥ 70) require at least 2 specific field-value citations as evidence. Super_hot scores (≥ 88) require at least 4 citations across at least 3 dimensions. When evidence is ambiguous, the lower of two plausible scores is chosen. When the LLM and heuristic cross-check disagree by more than 20 points, the lower score wins. This conservative philosophy minimizes false-hot leads that waste AE time, at the cost of occasionally under-scoring promising leads — those are recoverable via the nurture sequence and re-scoring sweep.',
    },
    {
      question: 'What happens if the LLM is unavailable?',
      answer:
        'Judge falls back to a deterministic heuristic scorer that uses rule-based mapping tables: firmographic = industry_match ? 80 : 50 : 20; reachability = email(30) + phone(30) + linkedin(20) + decision_maker(20); and so on. Heuristic-scored leads are flagged score_method = "heuristic" and enqueued for LLM re-score within 30 minutes. Leads are never left unscored — the heuristic guarantees 100% scoring uptime.',
    },
    {
      question: 'How do boosters stack, and can they push a lead to super_hot?',
      answer:
        'Boosters stack additively: inquiry (+15) + referral (+10) + analyst mention (+5) = +30, but the total booster contribution is capped at +25 and the final score is capped at 100. A lead with a raw score of 80 + 25 boost = 105, capped to 100 (super_hot). A lead with a raw score of 60 + 25 boost = 85 (hot, not super_hot) — boosters cannot manufacture a super_hot tier from a moderate raw score.',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Single-lead qualification',
      useCase: 'User wants to qualify a single enriched lead and see its score breakdown.',
      template: `Qualify lead {{leadId}} against ICP {{icpId}}.

Please:
1. Run the 5-dimension scoring (firmographic, intent, reachability, strategic, data completeness).
2. Apply any disqualifier checks (existing customer, competitor employee, below min size, excluded industry).
3. Apply any boosters (inquiry, referral, analyst mention).
4. Assign the tier (cold / warm / hot / super_hot) and SLA (A / B / C-list).
5. Transition the stage if score ≥ 50.
6. Return the full score breakdown with evidence citations and rationale.`,
      variables: ['leadId', 'icpId'],
    },
    {
      name: 'Batch qualification',
      useCase: 'User wants to qualify a batch of leads for a campaign.',
      template: `Qualify all leads in campaign {{campaignId}} that are in stage "enriched" and have not yet been scored.

ICP: {{icpId}}
Batch size: up to {{batchSize}} leads
Priority: {{priority}} (low / normal / high)

For each lead:
1. Run disqualifier checks first; disqualified leads go to the disqualified_leads table.
2. Run the 5-dimension scoring + boosters.
3. Assign tier and SLA; transition stage to qualified if score ≥ 50.
4. Update campaign counters atomically.

Return a summary: total scored, count per tier, count disqualified, p50 / p99 latency.`,
      variables: ['campaignId', 'icpId', 'batchSize', 'priority'],
    },
    {
      name: 'Re-score on enrichment update',
      useCase: 'Triggered automatically when Data Enrichment writes new fields to a lead.',
      template: `Re-score lead {{leadId}} after enrichment update.

Updated fields: {{updatedFields}}
Prior score: {{priorScore}}
Prior tier: {{priorTier}}

Please:
1. Re-run the 5-dimension scoring with the merged field set.
2. Preserve the prior score record as historical.
3. If the new tier is higher, emit lead.tier_upgraded and re-enforce the new SLA.
4. If the new tier is lower, emit lead.tier_downgraded (do not retract in-flight outreach).
5. Update campaign counters: decrement prior tier count, increment new tier count.
6. Return the score delta and the rationale for the change.`,
      variables: ['leadId', 'updatedFields', 'priorScore', 'priorTier'],
    },
    {
      name: 'Disqualifier override request',
      useCase: 'User wants to override a disqualifier decision (e.g., false-positive domain match).',
      template: `Disqualifier override request for lead {{leadId}}.

Original disqualifier: {{disqualifierType}} (existing_customer / competitor_employee / below_min_size / excluded_industry)
Reason for override: {{reason}}
Approver: {{approverId}}

Please:
1. Verify the override is permitted (existing_customer and competitor_employee require ops approval; excluded_industry requires compliance approval).
2. Record the override in the audit log with approver, reason, and timestamp.
3. Re-run the scoring pipeline without the overridden disqualifier.
4. Assign tier, SLA, and stage as usual.
5. Return the new score and tier with the override audit record.`,
      variables: ['leadId', 'disqualifierType', 'reason', 'approverId'],
    },
    {
      name: 'Score explanation request',
      useCase: 'User wants to understand why a lead received a specific score.',
      template: `Explain the score for lead {{leadId}}.

Detail level: {{detail}} (summary | full | audit)

Return:
- The current score, tier, and SLA.
- The 5 dimension scores with sub-factor breakdown.
- The boosters applied (with magnitudes and expiry dates).
- The disqualifier checks performed (with results).
- The evidence citations (which fields contributed to which dimension score and by how much).
- The score_method (llm | heuristic) and model_version.
- The rationale text from the LLM.

If detail=audit, also return the full history of score changes for this lead (up to 90 days).`,
      variables: ['leadId', 'detail'],
    },
    {
      name: 'Tier threshold tuning',
      useCase: 'User wants to tune the tier thresholds for a specific campaign.',
      template: `Tune tier thresholds for campaign {{campaignId}}.

New thresholds:
- super_hot: ≥ {{superHotThreshold}}
- hot: {{hotMin}}–{{superHotThreshold - 1}}
- warm: {{warmMin}}–{{hotMin - 1}}
- cold: < {{warmMin}}

Rationale: {{rationale}}
Approver: {{approverId}}

Please:
1. Validate the thresholds are monotonic (super_hot > hot > warm > cold).
2. Record the change in the audit log with approver, rationale, and timestamp.
3. Re-tier all existing leads in the campaign under the new thresholds.
4. Update campaign counters to reflect the new distribution.
5. Return the before/after tier distribution and any SLA changes triggered.`,
      variables: ['campaignId', 'superHotThreshold', 'hotMin', 'warmMin', 'rationale', 'approverId'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'LLM (GLM-4.6v-flash)',
      scenario: 'Scoring a single enriched lead against the ICP. Lead has industry SaaS, 250 employees, $8M revenue, recent funding round.',
      request: `{
  "lead_id": "l_412",
  "fields": {
    "industry": "SaaS",
    "employee_count": 250,
    "revenue_estimate": 8000000,
    "geography": "US-CA",
    "email": "ceo@acme.io",
    "phone": "+1-415-555-0100",
    "linkedin": "https://linkedin.com/company/acme",
    "decision_maker": "CEO",
    "funding_events": [{ "type": "Series B", "amount": 25000000, "date": "2026-08-12" }],
    "pain_points": ["scaling", "hiring", "data infrastructure"],
    "growth_rate_yoy": 0.22
  },
  "icp": {
    "industry": ["SaaS", "DevTools"],
    "min_employees": 200,
    "max_employees": 500,
    "min_revenue": 5000000,
    "max_revenue": 20000000,
    "geography": ["US"]
  }
}`,
      response: `{
  "firmographic": 88,
  "intent": 72,
  "reachability": 95,
  "strategic": 70,
  "dataCompleteness": 80,
  "evidence": [
    { "dimension": "firmographic", "field": "industry", "value": "SaaS", "contribution": 35 },
    { "dimension": "firmographic", "field": "employee_count", "value": "250", "contribution": 25 },
    { "dimension": "firmographic", "field": "revenue_estimate", "value": "8000000", "contribution": 20 },
    { "dimension": "intent", "field": "funding_events", "value": "Series B 2026-08-12", "contribution": 40 },
    { "dimension": "intent", "field": "pain_points", "value": "scaling, hiring, data infrastructure", "contribution": 22 },
    { "dimension": "reachability", "field": "email", "value": "ceo@acme.io", "contribution": 30 },
    { "dimension": "reachability", "field": "phone", "value": "+1-415-555-0100", "contribution": 25 },
    { "dimension": "reachability", "field": "decision_maker", "value": "CEO", "contribution": 20 },
    { "dimension": "strategic", "field": "growth_rate_yoy", "value": "0.22", "contribution": 35 }
  ],
  "rationale": "Strong firmographic fit (SaaS, 250 employees, $8M revenue all within ICP). Intent boosted by recent Series B and explicit pain-point keywords. Reachability is excellent with CEO email, phone, and decision-maker identified. Strategic value is solid with 22% YoY growth. Data completeness is high at 80%."
}`,
      notes: 'Weighted sum: 88×0.25 + 72×0.20 + 95×0.20 + 70×0.20 + 80×0.15 = 22 + 14.4 + 19 + 14 + 12 = 81.4 → raw score 81. With inquiry booster +15 → 96, capped at 96 → super_hot tier (≥ 88).',
    },
    {
      tool: 'Heuristic Scoring Engine',
      scenario: 'LLM is unavailable (timeout); heuristic fallback computes a conservative score for the same lead.',
      request: `{
  "lead_id": "l_412",
  "fields": { "industry": "SaaS", "employee_count": 250, "email": "ceo@acme.io", "phone": "+1-415-555-0100", "linkedin": "https://linkedin.com/company/acme", "decision_maker": "CEO", "funding_events": [1], "pain_points": ["scaling", "hiring"], "growth_rate_yoy": 0.22 },
  "icp": { "industry": ["SaaS", "DevTools"], "min_employees": 200, "max_employees": 500, "min_revenue": 5000000, "geography": ["US"] },
  "field_count_filled": 48,
  "field_count_total": 64
}`,
      response: `{
  "firmographic": 80,
  "intent": 50,
  "reachability": 95,
  "strategic": 40,
  "dataCompleteness": 75,
  "score_method": "heuristic",
  "mapping_table_version": "2.1.0",
  "raw_score": 67,
  "final_score": 67,
  "tier": "warm",
  "rescore_enqueued_at": "2026-09-08T14:23:01Z"
}`,
      notes: 'Heuristic is more conservative than the LLM: intent (50 vs 72) and strategic (40 vs 70) are rule-based buckets, not LLM analysis. Lead is enqueued for LLM re-score within 30 minutes; the re-score will likely upgrade the tier to hot or super_hot.',
    },
    {
      tool: 'Stage Progression Manager',
      scenario: 'Lead has just been scored at 82 (hot tier); transition from enriched → qualified.',
      request: `{
  "lead_id": "l_412",
  "prior_stage": "enriched",
  "new_stage": "qualified",
  "actor": "judge",
  "trigger": "score_50",
  "score_at_transition": 82,
  "tier": "hot",
  "sla": "B-list"
}`,
      response: `{
  "transitioned": true,
  "log_id": "spl_8842",
  "log_row": {
    "lead_id": "l_412",
    "prior_stage": "enriched",
    "new_stage": "qualified",
    "ts": "2026-09-08T14:23:02Z",
    "actor": "judge",
    "trigger": "score_50",
    "score_at_transition": 82
  },
  "campaign_counter_update": {
    "campaign_id": "c_412",
    "counter": "qualified_count",
    "delta": 1,
    "new_value": 17
  },
  "ae_assignment": {
    "ae_id": "ae_22",
    "ae_name": "Jordan Chen",
    "assigned_at": "2026-09-08T14:23:03Z"
  }
}`,
      notes: 'The transition is logged with all 6 required fields. Campaign counter is updated atomically. AE assignment is delegated to the Pipeline Manager (Flow), which selected ae_22 by round-robin within the campaign\'s AE pool.',
    },
  ],

  examples: [
    {
      scenario: 'Qualifying an enriched SaaS lead with strong ICP fit and recent funding.',
      input: `Lead l_412 (Acme.io): SaaS, 250 employees, $8M revenue, US-CA. CEO email + phone + LinkedIn available. Series B funding 2026-08-12 ($25M). Pain points: scaling, hiring, data infrastructure. 22% YoY growth. Inbound inquiry submitted 2026-09-01.`,
      reasoning: `Data assessment: dataCompleteness = 48/64 = 75. No disqualifiers (not existing customer, not competitor, above min size, not excluded industry). Booster detected: inbound inquiry (+15, expires 2026-10-01). LLM scores: firmographic 88 (industry + size + revenue all match ICP), intent 72 (funding event + pain points), reachability 95 (email + phone + LinkedIn + decision-maker), strategic 70 (growth rate 22% + market position), data completeness 80. Weighted sum: 88×0.25 + 72×0.20 + 95×0.20 + 70×0.20 + 80×0.15 = 81.4 → raw 81. Apply booster +15 → 96, capped at 96. Tier: super_hot (≥ 88). SLA: A-list (5 min). Transition stage enriched → qualified.`,
      output: `{
  "lead_id": "l_412",
  "raw_score": 81,
  "final_score": 96,
  "tier": "super_hot",
  "sla": "A-list",
  "sla_deadline": "2026-09-08T14:28:00Z",
  "stage_transition": "enriched → qualified",
  "boosters_applied": [{ "type": "inquiry", "magnitude": 15, "expires": "2026-10-01" }],
  "disqualifiers_checked": { "existing_customer": false, "competitor_employee": false, "below_min_size": false, "excluded_industry": false },
  "score_method": "llm",
  "model_version": "3.2.0",
  "assigned_ae": "ae_05 (senior)"
}`,
      outcome: 'Lead assigned to senior AE within 4 minutes. AE opened the lead, reviewed the score breakdown via /explain, and initiated outreach within the 5-minute SLA. Lead progressed to contacted → engaged → negotiating → closed_won over 38 days. Final deal value $84k ARR.',
    },
    {
      scenario: 'Disqualified lead — competitor employee detected via domain match.',
      input: `Lead l_519 (Jordan Smith, jordan@rivalcorp.io): Applied via careers page form. Rivalcorp.io is a competitor in the dev-tools space (entry #47 in competitor registry).`,
      reasoning: `Data assessment: dataCompleteness = 32/64 = 50. Disqualifier check: competitor_employee = true (rivalcorp.io matches competitor registry entry #47). Short-circuit the pipeline: do not score. Write to disqualified_leads table. Emit lead.disqualified event. Do not assign to AE. Do not enter nurture sequence. Log the disqualifier with the matching registry entry.`,
      output: `{
  "lead_id": "l_519",
  "status": "disqualified",
  "disqualifier_type": "competitor_employee",
  "disqualifier_evidence": {
    "email_domain": "rivalcorp.io",
    "competitor_registry_entry": 47,
    "competitor_name": "RivalCorp"
  },
  "score": null,
  "tier": null,
  "stage": "disqualified",
  "audit_id": "aud_5191",
  "override_required": "ops_approval"
}`,
      outcome: 'Lead written to disqualified_leads table. No AE assignment. Ops team notified of the disqualification. Override is possible only with ops approval and legal review (competitor-employee disqualifiers are sensitive). Lead remains in the disqualified table indefinitely unless overridden.',
    },
    {
      scenario: 'Real-time re-score after enrichment fills more fields, upgrading tier.',
      input: `Lead l_622 (Globex Inc): Initially scored 58 (warm, C-list SLA) with 24/64 fields filled. Data Enrichment (Forge) just filled 18 more fields: revenue ($12M), funding history (Series C 2026-07-15), decision_maker (CTO), LinkedIn (company page + CTO profile), growth_rate (35% YoY).`,
      reasoning: `Re-score trigger: lead.updated event with 18 new fields. Load prior score (58, warm). Re-run the full pipeline. New dataCompleteness = 42/64 = 65. No new disqualifiers. No new boosters (referral event checked, none). LLM scores: firmographic 85 (revenue $12M within ICP, size 250 within ICP), intent 88 (Series C funding + strong growth), reachability 90 (CTO email + LinkedIn), strategic 85 (35% growth + market position), data completeness 65. Weighted sum: 85×0.25 + 88×0.20 + 90×0.20 + 85×0.20 + 65×0.15 = 21.25 + 17.6 + 18 + 17 + 9.75 = 83.6 → raw 84. No boosters. Tier: hot (70-87). SLA: B-list (1 hr). Tier upgrade: warm → hot. Emit lead.tier_upgraded. Re-enforce B-list SLA. Notify assigned SDR (no AE yet) and promote to AE pool.`,
      output: `{
  "lead_id": "l_622",
  "prior_score": 58,
  "prior_tier": "warm",
  "new_score": 84,
  "new_tier": "hot",
  "new_sla": "B-list",
  "sla_deadline": "2026-09-08T15:23:00Z",
  "tier_change": "warm → hot",
  "event_emitted": "lead.tier_upgraded",
  "campaign_counter_updates": [
    { "counter": "warm_count", "delta": -1, "new_value": 41 },
    { "counter": "hot_count", "delta": +1, "new_value": 22 }
  ],
  "promotion": "sdr_pool → ae_pool"
}`,
      outcome: 'Lead promoted from SDR pool to AE pool. AE Jordan Chen assigned within 12 minutes. The 18 newly-filled fields provided the evidence needed to cross the hot threshold. Lead progressed to contacted → engaged → closed_won over 52 days. Final deal value $128k ARR.',
    },
  ],

  guardrails: [
    {
      rule: 'Never fabricate evidence to inflate a score.',
      rationale: 'Fabricated evidence poisons the scoring model and erodes AE trust in tier assignments.',
      enforcement: 'Evidence validator checks that every cited field_name exists in the input payload and that field_value matches the actual stored value; violations are rejected and the score is recomputed.',
      severity: 'block',
    },
    {
      rule: 'Never assign a tier higher than the score warrants.',
      rationale: 'Tier thresholds are absolute; bending them destroys the SLA framework.',
      enforcement: 'Tier mapper uses strict inequalities (≥ 88 super_hot, 70-87 hot, 40-69 warm, < 40 cold); any attempt to override is rejected and logged.',
      severity: 'block',
    },
    {
      rule: 'Never bypass the disqualifier check.',
      rationale: 'Disqualified leads (existing customers, competitors) must never reach sales.',
      enforcement: 'Disqualifier check runs in phase 1 before any scoring; if any disqualifier is flagged, the pipeline short-circuits and writes to disqualified_leads.',
      severity: 'block',
    },
    {
      rule: 'Never apply boosters to disqualified leads.',
      rationale: 'Boosters are incentives for outreach; disqualified leads are excluded from outreach entirely.',
      enforcement: 'Booster detector checks the disqualifier flag before returning any boosters; if disqualified, an empty boosters list is returned.',
      severity: 'block',
    },
    {
      rule: 'Never retract an in-flight outreach sequence on tier downgrade.',
      rationale: 'Retracting outreach mid-sequence confuses the lead and undermines the AE\'s relationship.',
      enforcement: 'On tier downgrade, lead.tier_downgraded is emitted but the outreach sequence is not cancelled; the AE is notified and decides whether to continue.',
      severity: 'block',
    },
    {
      rule: 'Always fall back to the heuristic scorer when the LLM fails.',
      rationale: 'Leads must never be left unscored — an unscored lead cannot be routed and is effectively lost.',
      enforcement: 'LLM failure (timeout, malformed JSON, out-of-range) automatically invokes the heuristic scorer; the score is flagged score_method = "heuristic" and enqueued for LLM re-score within 30 minutes.',
      severity: 'block',
    },
    {
      rule: 'Always persist both raw_score and final_score.',
      rationale: 'Booster impact must be auditable; raw_score shows the model\'s judgment, final_score shows the actionable score.',
      enforcement: 'Score record schema requires both fields; missing either is a schema violation and the write is rejected.',
      severity: 'block',
    },
    {
      rule: 'Always log every stage transition with the 6 required fields.',
      rationale: 'Stage progression audit is required for compliance and for sales-ops analytics.',
      enforcement: 'Stage Progression Manager rejects transitions missing any of the 6 required fields (lead_id, prior_stage, new_stage, ts, actor, trigger).',
      severity: 'warn',
    },
    {
      rule: 'Always re-score leads when new enrichment data arrives.',
      rationale: 'Stale scores lead to wrong tier assignments and missed SLA opportunities.',
      enforcement: 'lead.updated subscriber automatically triggers re-score within 2 seconds; missed triggers are caught by the hourly sweep of leads with stale scores.',
      severity: 'warn',
    },
  ],

  decisionMatrix: [
    {
      condition: 'Lead\'s final score is ≥ 88.',
      action: 'Assign tier super_hot. Apply A-list SLA (5 min). Assign to senior AE. Trigger Slack + mobile push.',
      rationale: 'Super_hot leads are the highest-value opportunities and require immediate action to maximize conversion.',
      example: 'Lead l_412 scored 96 (raw 81 + inquiry booster 15). Tier super_hot. AE notified within 4 minutes. Closed_won in 38 days.',
    },
    {
      condition: 'Lead\'s final score is 70-87.',
      action: 'Assign tier hot. Apply B-list SLA (1 hr). Assign to AE. Trigger Slack + email.',
      rationale: 'Hot leads are strong opportunities but do not require immediate action; a 1-hour SLA balances responsiveness with AE workload.',
      example: 'Lead l_622 scored 84 after re-score. Tier hot. AE assigned within 12 minutes. Closed_won in 52 days.',
    },
    {
      condition: 'Lead\'s final score is 40-69.',
      action: 'Assign tier warm. Apply C-list SLA (24 hr). Assign to SDR. Trigger daily digest.',
      rationale: 'Warm leads need cultivation; an SDR touch within 24 hours keeps them engaged without burning AE cycles.',
      example: 'Lead l_731 scored 58. Tier warm. SDR assigned within 3 hours. Lead entered nurture sequence, upgraded to hot 14 days later after enrichment update.',
    },
    {
      condition: 'Lead\'s final score is < 40.',
      action: 'Assign tier cold. No SLA. Auto-route to nurture sequence. No human notification.',
      rationale: 'Cold leads are not sales-ready; nurture sequence warms them up over time and re-scores on new data.',
      example: 'Lead l_844 scored 28. Tier cold. Entered nurture sequence. Re-scored to 52 (warm) 45 days later after LinkedIn data enrichment.',
    },
    {
      condition: 'Lead matches an existing customer domain.',
      action: 'Disqualify. Short-circuit the pipeline. Write to disqualified_leads. Emit lead.disqualified. Do not assign to AE.',
      rationale: 'Existing customers are handled by the Customer Success team, not Sales; routing them to Sales creates duplicate accounts.',
      example: 'Lead l_905 has email @acme.com, which matches the customer roster. Disqualified. CS team notified via daily digest.',
    },
    {
      condition: 'Lead matches a competitor domain.',
      action: 'Disqualify. Short-circuit. Write to disqualified_leads. Emit lead.disqualified. Override requires legal review.',
      rationale: 'Competitor employees may be attempting to gather intelligence; routing them to Sales is a security risk.',
      example: 'Lead l_519 has email @rivalcorp.io (competitor #47). Disqualified. Override denied without legal sign-off.',
    },
    {
      condition: 'Lead has an inbound inquiry within the last 30 days.',
      action: 'Apply +15 booster (inquiry). Add to raw_score. Cap total boosters at +25. Cap final_score at 100.',
      rationale: 'Inbound inquiries indicate active buying intent and should be prioritized.',
      example: 'Lead l_412 has raw_score 81 + inquiry booster 15 = 96. Capped at 96 (no further cap needed). Tier super_hot.',
    },
    {
      condition: 'LLM returns malformed JSON or out-of-range scores.',
      action: 'Fall back to heuristic scorer. Flag score_method = "heuristic". Enqueue for LLM re-score within 30 minutes.',
      rationale: 'Leads must never be left unscored; the heuristic is conservative but deterministic.',
      example: 'LLM returned firmographic = 150 (out of range). Heuristic computed firmographic = 80. Lead scored 67 (warm). Re-scored by LLM 22 minutes later → 81 (hot).',
    },
  ],

  failureModes: [
    {
      failure: 'LLM service is unavailable (timeout or 5xx).',
      detection: 'LLM call exceeds 10s timeout OR returns 5xx HTTP status.',
      mitigation: 'Automatic heuristic fallback. Score flagged score_method = "heuristic". Lead enqueued for LLM re-score within 30 minutes.',
      recoveryTime: 'Sub-200ms fallback; LLM re-score within 30 minutes of recovery.',
    },
    {
      failure: 'LLM returns malformed JSON or schema-violating response.',
      detection: 'JSON parser error OR schema validator rejects (e.g. dimension score > 100).',
      mitigation: '2 retries with patched prompt (add explicit schema reminder + temperature reduction). If still failing, heuristic fallback.',
      recoveryTime: '2 retries × ~5s each; heuristic fallback if both fail.',
    },
    {
      failure: 'Lead store is unreachable (cannot load enriched fields).',
      detection: 'lead_store.get() throws or times out after 5s.',
      mitigation: 'Queue lead for retry with 2s backoff (max 3 attempts). If all fail, mark lead as "score_pending" and surface to ops dashboard.',
      recoveryTime: 'Lead remains unscored until store recovers; ops alerted within 5 minutes.',
    },
    {
      failure: 'Counter drift detected (campaign counters disagree with raw scores).',
      detection: 'Nightly reconciliation job computes counter deltas > 1%.',
      mitigation: 'Recompute all counters from raw scores. Log the drift. Alert ops if drift > 5%.',
      recoveryTime: 'Reconciliation runs in < 5 minutes per campaign; counters corrected overnight.',
    },
    {
      failure: 'Disqualifier false-positive (e.g. lead incorrectly flagged as competitor).',
      detection: 'Manual review or override request from ops.',
      mitigation: 'Override requires ops approval (and legal review for competitor-employee). Override recorded in audit log. Lead re-scored without the overridden disqualifier.',
      recoveryTime: 'Override typically processed within 4 hours of request.',
    },
    {
      failure: 'Booster double-counting (same inquiry event counted twice).',
      detection: 'Idempotency key (event_id) check on booster insert rejects duplicates.',
      mitigation: 'Idempotency keys prevent double-counting at insert time. Hourly sweep detects any drift and corrects.',
      recoveryTime: 'Prevented at write time; drift corrections run hourly.',
    },
    {
      failure: 'Stage transition violation (e.g. attempted new → closed_won).',
      detection: 'Stage Progression Manager rejects the transition against the legal-transition matrix.',
      mitigation: 'Reject the transition. Log the violation. Surface to ops dashboard. No state change.',
      recoveryTime: 'Immediate (rejection is local).',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_judge_001',
      input: 'Score a lead with industry=SaaS, 250 employees, $8M revenue, US-CA, CEO email+phone+LinkedIn, Series B funding 2026-08-12, pain points: scaling/hiring/data, 22% YoY growth. ICP: SaaS/DevTools, 200-500 employees, $5-20M revenue, US.',
      expectedOutput: 'Raw score ~80-85 (firmographic ~88, intent ~70, reachability ~95, strategic ~70, dataCompleteness ~75). With inquiry booster +15, final ~95-96. Tier: super_hot. SLA: A-list (5 min).',
      scoringCriteria: [
        'Firmographic score 80-95 (all ICP fields match).',
        'Intent score 60-80 (funding event + pain points cited).',
        'Reachability score 85-100 (email + phone + LinkedIn + decision-maker).',
        'Strategic score 60-80 (growth rate cited).',
        'Data completeness score 70-85 (48/64 fields filled).',
        'Booster +15 applied for inbound inquiry.',
        'Final tier = super_hot (≥ 88).',
        'SLA = A-list (5 min).',
        'Stage transition enriched → qualified logged.',
      ],
      passThreshold: 7,
    },
    {
      id: 'eval_judge_002',
      input: 'Score a lead whose email domain matches competitor registry entry #47 (rivalcorp.io).',
      expectedOutput: 'Disqualified. No score computed. Written to disqualified_leads table. lead.disqualified event emitted. No AE assignment. Override requires legal review.',
      scoringCriteria: [
        'Disqualifier check runs before scoring.',
        'Competitor_employee disqualifier detected (domain match).',
        'No score, tier, or SLA assigned.',
        'Lead written to disqualified_leads table.',
        'lead.disqualified event emitted with disqualifier_type = "competitor_employee".',
        'Override requires legal review (not just ops approval).',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_judge_003',
      input: 'LLM returns malformed JSON (firmographic = 150, intent = null). Apply heuristic fallback.',
      expectedOutput: 'Heuristic scores computed. score_method = "heuristic". Lead enqueued for LLM re-score within 30 minutes. Tier assigned based on heuristic score.',
      scoringCriteria: [
        'LLM failure detected (out-of-range score + null intent).',
        'Heuristic fallback invoked within 200ms.',
        'score_method = "heuristic" flag set on score record.',
        'Lead enqueued for LLM re-score (rescore_at within 30 minutes).',
        'Tier assigned based on heuristic score (not left unscored).',
        'Audit log records the LLM failure and heuristic fallback.',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_judge_004',
      input: 'Re-score lead l_622 after enrichment fills 18 new fields (revenue, funding, decision_maker, LinkedIn, growth_rate). Prior score 58 (warm).',
      expectedOutput: 'New score ~80-85 (tier hot). lead.tier_upgraded event emitted. SLA re-enforced to B-list (1 hr). Campaign counters updated (warm_count -1, hot_count +1). AE pool promoted.',
      scoringCriteria: [
        'Prior score (58, warm) preserved as historical.',
        'New score computed with merged field set.',
        'New tier = hot (70-87).',
        'lead.tier_upgraded event emitted.',
        'SLA re-enforced to B-list (1 hr deadline).',
        'Campaign counters updated atomically (warm -1, hot +1).',
        'Lead promoted from SDR pool to AE pool.',
        'In-flight outreach (if any) not retracted.',
      ],
      passThreshold: 7,
    },
    {
      id: 'eval_judge_005',
      input: 'Score a lead with industry=Gambling (excluded_industries list). Lead has otherwise perfect fit (SaaS-like, 300 employees, $10M revenue).',
      expectedOutput: 'Disqualified. Excluded_industry disqualifier overrides the otherwise-high score. No tier assigned. Override requires Compliance approval.',
      scoringCriteria: [
        'Excluded_industry disqualifier detected.',
        'No score or tier assigned despite strong ICP fit.',
        'Lead written to disqualified_leads table.',
        'Override requires Compliance approval (not ops or legal).',
        'Audit log records the disqualifier with industry code.',
      ],
      passThreshold: 4,
    },
  ],
};
