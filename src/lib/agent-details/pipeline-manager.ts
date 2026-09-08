import type { AgentDetailFull } from './types';

export const pipelineManagerDetail: AgentDetailFull = {
  slug: 'pipeline-manager',
  name: 'pipeline-manager',
  displayName: 'Pipeline Manager (Flow)',
  tagline: 'Manages lead lifecycle from discovery to closed-won',
  description: 'Manages lead pipeline stages and follow-up schedules',
  longDescription:
    'The Pipeline Manager agent — codenamed Flow — is the LeadReach platform\'s lifecycle conductor. It oversees the entire lead journey from initial discovery to closed-won (or closed-lost), managing 9 pipeline stages (New → Enriched → Qualified → Contacted → Engaged → Negotiating → Closed Won → Closed Lost → Nurture) with deterministic, trigger-based transitions. Every transition is logged with timestamp, prior stage, new stage, trigger event id, and trace id. Flow schedules follow-ups at optimal times based on prospect timezone (business hours only), engagement history (when the prospect has opened or replied before), and channel effectiveness data (email is best Tue-Thu 10am, LinkedIn is best Wed 2pm). It orchestrates nurture campaigns for warm leads that aren\'t ready to buy on a 30/60/90 day cadence (Day 30 educational content, Day 60 case study, Day 90 check-in). Flow also monitors pipeline health — detecting bottlenecks (stages where leads are stuck longer than 1.5x the campaign average), calculating pipeline velocity (currently averaging 14 days from discovery to close, well under the 21-day target), and generating SLA alerts for A-list (super_hot) leads that must be contacted within 5 minutes, B-list (hot) within 1 hour, and C-list (warm) within 24 hours. Flow bidirectionally syncs with HubSpot and Salesforce so that the CRM is always an accurate mirror of the LeadReach pipeline state.',
  color: '#6366F1',
  iconName: 'GitBranch',
  department: 'Growth',
  pipelineRole: 'Lead lifecycle management and pipeline optimization',
  pipelinePosition: 7,

  capabilities: [
    {
      name: 'Stage Transition Management',
      description:
        'Manages 9 pipeline stages with deterministic, trigger-based transitions: enrichment_complete → Enriched, score ≥ 50 → Qualified, outreach.sent → Contacted, prospect.replied → Engaged, meeting.booked → Negotiating, deal.won → Closed Won, deal.lost → Closed Lost, 7-touchpoint silence → Nurture. Each transition is logged with timestamp, prior stage, new stage, trigger event id, and trace_id.',
      metric: '9 stages, 100% logged',
      details: [
        'Enforces a hard validation gate on every trigger — outreach.sent is only honored if the underlying event payload includes a verified message_id; soft bounces do not count.',
        'Supports the only two sanctioned backward transitions: Engaged→Contacted (after 7+ days of silence) and Nurture→Contacted (on reactivation). All other backward transitions are blocked.',
        'Persists every transition to the lead_stage_transitions Postgres table with a monotonic sequence number for replayable debugging.',
        'Exposes a /api/pipeline-manager/transitions?lead_id=<id> endpoint returning the full ordered transition chain for any lead.',
      ],
    },
    {
      name: 'Follow-Up Scheduling',
      description:
        'Schedules follow-ups at optimal times based on prospect timezone, historical engagement patterns, and channel effectiveness data. Avoids weekends and non-business hours. Hard-blocks sends outside the prospect\'s local 9am-6pm business hours.',
      metric: 'Timezone-aware, < 2s decision',
      details: [
        'Resolves prospect timezone from enrichment data (company HQ city → IANA tz); falls back to campaign default tz when missing and logs a data_quality.warning.',
        'Applies per-channel optimal windows: email Tue-Thu 9am-11am local, LinkedIn Wed 1pm-3pm local, phone Tue-Thu 2pm-4pm local. Other times are accepted only if SLA deadline forces.',
        'Honors engagement history — if a prospect historically opens email at 8:47am, the scheduler biases toward that time slot for the same channel.',
        'Guarantees no two simultaneous touchpoints across channels on the same lead (mutex lock per lead_id with 60s hold).',
      ],
    },
    {
      name: 'Nurture Campaign Orchestration',
      description:
        'Designs and executes nurture campaigns for warm leads not ready to buy. Sends educational content, case studies, and check-in messages on a 30/60/90 day cadence. About 12% of nurtured leads eventually reactivate.',
      metric: '30/60/90 day cadence',
      details: [
        'Day 30: sends an industry-tailored educational asset (e.g. "The State of DevSecOps 2026") chosen by matching lead industry to the content library taxonomy.',
        'Day 60: sends a peer case study matched by company size + industry (e.g. "How Acme cut CAC 38% with LeadReach").',
        'Day 90: sends an open-ended check-in ("Is {{first_name}} still the right contact for {{topic}}?").',
        'On any engagement signal (open, click, reply) during nurture, the lead is immediately snapped back to Contacted and Outreach Composer is invoked to craft a contextual reply.',
      ],
    },
    {
      name: 'Pipeline Health Monitoring',
      description:
        'Continuously monitors pipeline velocity, stage conversion rates, and SLA compliance. Generates a real-time pipeline health score (0-100) rolled up per campaign and per workspace.',
      metric: '60s refresh, real-time alerts',
      details: [
        'Computes pipeline velocity as the median days from lead.created to deal.won over the trailing 30 days; current platform median is 14 days (target < 21).',
        'Computes stage conversion rate as qualified → closed-won percentage; current platform rate is 35% (target > 25%).',
        'Blends 5 sub-metrics into a weighted health score: velocity (25%), conversion rate (25%), SLA compliance (20%), bottleneck severity (15%), nurture reactivation (15%).',
        'Publishes health.score.changed SSE event whenever the score moves by ≥ 2 points so the UI dashboard updates in real time.',
      ],
    },
    {
      name: 'Bottleneck Detection',
      description:
        'Identifies stages where leads are stuck longer than 1.5x the campaign average time-in-stage. Recommends remediation: re-score stale leads, re-enrich with fresh data, or move to nurture.',
      metric: 'Auto-detection < 1 hour',
      details: [
        'Maintains a rolling 30-day median time-in-stage per (campaign_id, stage) pair as the baseline.',
        'When a stage\'s current median exceeds 1.5x baseline, emits bottleneck.detected with the affected lead_id list and a recommended remediation action.',
        'Recommended actions are tiered: 1.5x-2x → re-score (Judge); 2x-3x → re-enrich (Forge); > 3x → move to Nurture.',
        'Surfaces bottlenecks in the Agentic Pipeline Workspace UI with a "Resolve" button that one-click triggers the recommended remediation.',
      ],
    },
    {
      name: 'SLA Enforcement',
      description:
        'Enforces 3-tier SLAs: A-list (super_hot) leads must be contacted within 5 minutes of qualification, B-list (hot) within 1 hour, C-list (warm) within 24 hours. Emits sla.warning at T-50% and sla.breached at T-0.',
      metric: '3-tier SLA, 94% compliance',
      details: [
        'Computes SLA deadline = qualification_timestamp + tier_sla (5 min / 1 hr / 24 hr) at the moment a lead enters Qualified.',
        'At T-50% of deadline, emits sla.warning — the Follow-Up Scheduler preempts and schedules the next available business-hours slot.',
        'At T-0 (deadline reached without contact), emits sla.breached and escalates to the user with lead_id, tier, missed-by duration, and recommended next action.',
        'Tracks SLA compliance as (leads_contacted_before_deadline / leads_qualified) over trailing 7 days; current platform compliance is 94% (target > 90%).',
      ],
    },
    {
      name: 'Pipeline Velocity Calculation',
      description:
        'Calculates average time from lead discovery to closed-won, broken down by stage and by campaign. Identifies velocity outliers (slow deals, fast deals) and correlates with ICP attributes.',
      metric: '14 days avg (target < 21)',
      details: [
        'Computes per-stage median time using the lead_stage_transitions table (last 30 days, per campaign_id).',
        'Identifies the slowest stage per campaign (e.g. Engaged → Negotiating averages 6.2 days for Campaign c_412) and flags it as a velocity bottleneck.',
        'Correlates velocity with ICP attributes: companies with 200-500 employees close 23% faster than 50-200; US-based leads close 18% faster than EMEA.',
        'Publishes a weekly velocity.report to the Report Generator (Echo) for inclusion in the weekly performance digest.',
      ],
    },
    {
      name: 'CRM Synchronization (HubSpot & Salesforce)',
      description:
        'Bidirectionally syncs stage transitions, activities, and contact properties with HubSpot and Salesforce. Flow is the source of truth; CRM conflicts are resolved by overwriting CRM with Flow\'s state and logging the conflict.',
      metric: 'Bi-directional, idempotent',
      details: [
        'Outbound sync: on every stage transition, writes a hubspot.deal_stage_update and salesforce.opportunity_stage_update event within 5 seconds.',
        'Inbound sync: subscribes to CRM webhooks; on deal_status_changed or contact_property_updated, Flow applies the change only if it doesn\'t conflict with a more recent Flow-side transition (last-writer-wins by ts).',
        'Sync is idempotent with dedup_key = lead_id + transition_ts + action_type; replays are safe.',
        'Conflict log captures every instance where CRM and Flow disagreed, with the resolution applied and the rationale.',
      ],
    },
    {
      name: 'Channel Effectiveness Optimization',
      description:
        'Tracks per-channel effectiveness (open rate, reply rate, meeting-booked rate) by time-of-day and day-of-week. Feeds the optimal-window table that Follow-Up Scheduling consults.',
      metric: 'Per-channel, per-slot',
      details: [
        'Aggregates outreach activity records (send, open, reply, meeting) per (channel, day_of_week, hour_of_day) tuple over trailing 90 days.',
        'Computes reply_rate = replies / sent and meeting_rate = meetings / sent for each slot; ranks slots by meeting_rate.',
        'Publishes updated optimal-window table every 24 hours; the top 3 slots per channel become the "preferred" windows for Follow-Up Scheduling.',
        'Falls back to industry-standard defaults (email Tue-Thu 10am, LinkedIn Wed 2pm) when fewer than 50 data points exist for a slot.',
      ],
    },
    {
      name: 'Nurture Reactivation Engine',
      description:
        'Monitors nurture cadence sends for any engagement signal (open, click, reply) and snaps the lead back to Contacted. Tracks reactivation rate (currently 12%, target > 8%).',
      metric: '12% reactivation rate',
      details: [
        'Subscribes to outreach.opened, outreach.clicked, outreach.replied events filtered to source_channel="nurture".',
        'On any such event, immediately transitions the lead Nurture→Contacted and invokes Outreach Composer to draft a contextual reply referencing the asset that triggered engagement.',
        'Records the nurture_day (30 / 60 / 90) and the engagement signal type so the Report Generator can compute per-cadence-step reactivation rates.',
        'Surfaces high-intent nurture leads (reply within 24h of nurture send) as a "warm-reactivation" priority queue to the Outreach Composer.',
      ],
    },
    {
      name: 'Audit Trail & Explainability',
      description:
        'Records every stage transition, follow-up schedule, nurture send, SLA alert, and bottleneck detection with 6 mandatory audit fields so any pipeline outcome can be reconstructed and explained.',
      metric: '100% auditable',
      details: [
        'Each audit entry: timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id.',
        'Audit log is queryable via /api/pipeline-manager/audit?lead_id=<id> returning the full ordered transition chain with rationale.',
        'Provides an "explain this stage" endpoint that reconstructs the decision chain for any lead\'s current stage, including which trigger fired and what evidence supported it.',
        'Audit entries are retained for 7 years (SOC2 / GDPR compliance) and exportable as JSON or CSV for compliance review.',
      ],
    },
    {
      name: 'Predictive Stage Forecasting',
      description:
        'Predicts the likelihood that a lead in a given stage will advance to the next stage within 7/14/30 days, using historical transition rates and lead attributes. Surfaces low-probability leads for remediation.',
      metric: 'Per-lead probability',
      details: [
        'Trains a gradient-boosted model weekly on the lead_stage_transitions table; features include industry, company size, lead score, days in current stage, and channel mix.',
        'Outputs P(advance in 7d), P(advance in 14d), P(advance in 30d) per lead; surfaces leads with P(7d) < 0.15 to the bottleneck detector.',
        'Calibration checked monthly — predicted probabilities vs. observed transition rates; recalibrates if calibration error > 5%.',
        'Forecasts are advisory only — they do not directly trigger transitions; the trigger system remains deterministic.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Stage Monitoring & Trigger Detection',
      inputs: ['Lead lifecycle events', 'Stage transition triggers', 'Lead state index'],
      outputs: ['Pending transitions', 'Trigger evaluation results', 'SLA timers'],
      duration: 'Continuous (sub-second per event)',
      substeps: [
        'Subscribe to lead.created, lead.enriched, lead.scored, outreach.sent, prospect.replied, meeting.booked, deal.won, deal.lost events.',
        'Update the in-memory lead-state index with lead_id → {stage, last_activity_at, next_action_at, SLA_deadline}.',
        'For each inbound event, evaluate against the trigger table (e.g. score ≥ 50 → Qualified).',
        'If a trigger fires, enqueue a transition request to the Stage Transition Engine.',
        'If no trigger fires, simply update last_activity_at and recompute SLA proximity.',
        'Reconcile the in-memory index against Postgres every 5 seconds to catch out-of-band mutations.',
      ],
      errorHandling: 'On event schema mismatch, log to data_quality.warning and drop the event; never crash the monitor.',
      retryStrategy: 'Event consumers use at-least-once delivery; idempotent consumers dedup by event_id.',
    },
    {
      stage: 'Stage Transition Execution',
      inputs: ['Transition request', 'Lead current stage', 'Trigger event payload'],
      outputs: ['Stage transition record', 'Audit log entry', 'CRM sync event', 'Downstream notifications'],
      duration: '< 500 ms per transition',
      substeps: [
        'Validate the transition is legal: forward-only by default; backward transitions require explicit trigger (Engaged→Contacted after 7d silence, Nurture→Contacted on reactivation).',
        'Validate the trigger event payload (e.g. outreach.sent requires a verified message_id; soft bounces don\'t count).',
        'Acquire a per-lead mutex lock (60s hold) to prevent concurrent transitions on the same lead.',
        'Write the transition to lead_stage_transitions with monotonic seq number, prior_stage, new_stage, trigger_event_id, trace_id.',
        'Emit lead.transitioned event; subscribers (Follow-Up Scheduler, CRM Sync, Report Generator) react in parallel.',
        'Release the per-lead mutex lock.',
      ],
      errorHandling: 'On lock acquisition failure, retry up to 3 times with 100ms backoff; on persistent failure, log transition.blocked.',
      retryStrategy: 'Idempotent — replays are safe due to dedup_key (lead_id + transition_ts + action_type).',
    },
    {
      stage: 'Follow-Up Scheduling',
      inputs: ['Lead timezone', 'Engagement history', 'Channel effectiveness table', 'SLA deadline'],
      outputs: ['Optimal contact time', 'Scheduled task', 'Channel selection'],
      duration: '< 2 seconds per lead',
      substeps: [
        'Resolve prospect timezone from enrichment data (company HQ → IANA tz); fall back to campaign default tz when missing.',
        'Compute candidate send slots: intersect prospect\'s local business hours (9am-6pm) with the channel\'s optimal window (e.g. email Tue-Thu 9am-11am).',
        'Filter slots to those before the SLA deadline; if none qualify, escalate SLA to sla.warning and pick the earliest slot regardless of channel-optimal-window.',
        'Bias toward the prospect\'s historical engagement pattern (e.g. if they historically open email at 8:47am, prefer that slot).',
        'Acquire a per-lead mutex to prevent two simultaneous touchpoints across channels; hold for 60s.',
        'Persist the scheduled task to the scheduled_outreach table with channel, message_type, send_at, parent_lead_id.',
      ],
      errorHandling: 'On timezone resolution failure, fall back to campaign_default_tz and log data_quality.warning; never block scheduling on missing tz.',
      retryStrategy: 'Idempotent — re-scheduling overwrites the prior scheduled task with the new send_at.',
    },
    {
      stage: 'Nurture Orchestration',
      inputs: ['Nurture-stage leads', 'Content library', 'Cadence templates', 'Engagement signals'],
      outputs: ['Nurture sequences', 'Content recommendations', 'Reactivation events'],
      duration: '< 5 seconds per lead',
      substeps: [
        'For each lead entering Nurture, compute the next nurture send date: nurture_entered_at + 30 days (Day 30), + 60 (Day 60), + 90 (Day 90).',
        'Match lead industry + company size to the content library taxonomy; pick the highest-relevance asset for the cadence step.',
        'Schedule the nurture send via the Follow-Up Scheduler (which enforces business-hours and channel-optimal-window rules).',
        'Subscribe to outreach.opened, outreach.clicked, outreach.replied events filtered to source_channel="nurture".',
        'On any engagement signal, immediately transition the lead Nurture→Contacted and invoke Outreach Composer to draft a contextual reply.',
        'Log the nurture_day (30/60/90) and engagement signal type for per-cadence-step reactivation reporting.',
      ],
      errorHandling: 'On content library miss (no asset matches industry+size), fall back to a generic asset and log content_library.gap for content team review.',
      retryStrategy: 'Idempotent — replays of the same nurture send are deduplicated by dedup_key = lead_id + nurture_day.',
    },
    {
      stage: 'Health Monitoring & Bottleneck Detection',
      inputs: ['Lead stage transitions', 'Time-in-stage baselines', 'SLA timers'],
      outputs: ['Pipeline health score', 'Bottleneck alerts', 'Velocity metrics'],
      duration: '60 second refresh cycle',
      substeps: [
        'Every 60 seconds, compute pipeline velocity (median days from lead.created to deal.won, trailing 30d).',
        'Compute stage conversion rate (qualified → closed-won %, trailing 30d).',
        'Compute SLA compliance (leads_contacted_before_deadline / leads_qualified, trailing 7d).',
        'For each (campaign_id, stage) pair, compute current median time-in-stage and compare to 1.5x baseline; emit bottleneck.detected when exceeded.',
        'Blend the 5 sub-metrics into a weighted health score (velocity 25%, conversion 25%, SLA 20%, bottleneck 15%, reactivation 15%).',
        'Publish health.score.changed SSE event when score moves ≥ 2 points; update the UI dashboard.',
      ],
      errorHandling: 'On metric compute failure (e.g. insufficient data), emit health.degraded with the affected sub-metric and last-known-good value.',
      retryStrategy: 'No retry — health compute is best-effort; failures fall back to last-known-good with stale=true flag.',
    },
    {
      stage: 'SLA Enforcement',
      inputs: ['Lead qualification timestamp', 'Lead tier (A/B/C)', 'SLA deadline', 'Contact activity'],
      outputs: ['SLA warnings', 'SLA breach alerts', 'Escalation events'],
      duration: 'Continuous (per-second check)',
      substeps: [
        'On lead entering Qualified, compute SLA deadline = qualification_ts + tier_sla (5 min / 1 hr / 24 hr).',
        'Every second, check each qualified lead against its deadline.',
        'At T-50% of deadline, emit sla.warning; the Follow-Up Scheduler preempts and schedules the next available business-hours slot.',
        'At T-0 (deadline reached without contact), emit sla.breached and escalate to user with lead_id, tier, missed-by duration, recommended next action.',
        'Track SLA compliance metric (trailing 7d) and publish to the pipeline health score.',
        'Auto-pause any new outreach composition for the breached lead\'s campaign if breach rate > 15% in trailing 24h (prevents compounding the problem).',
      ],
      errorHandling: 'On SLA timer service crash, restart from the in-memory index rebuilt from Postgres; deadlines are persisted so no SLA is lost.',
      retryStrategy: 'No retry — SLA timers are deterministic and persisted; crash recovery rebuilds from the last known state.',
    },
    {
      stage: 'CRM Sync (HubSpot & Salesforce)',
      inputs: ['Stage transitions', 'Activity records', 'CRM webhooks', 'Conflict log'],
      outputs: ['CRM deal stage updates', 'CRM activity records', 'Inbound change applications'],
      duration: '< 5 seconds per sync (outbound), real-time (inbound)',
      substeps: [
        'On every stage transition, write a hubspot.deal_stage_update and salesforce.opportunity_stage_update event within 5 seconds.',
        'Subscribe to CRM webhooks for inbound changes (deal_status_changed, contact_property_updated).',
        'For each inbound change, check if Flow\'s state is more recent (last-writer-wins by ts). If CRM is older, apply CRM change. If Flow is newer, log conflict and overwrite CRM.',
        'Sync is idempotent with dedup_key = lead_id + transition_ts + action_type; replays are safe.',
        'Capture every conflict in the crm_conflicts table with the resolution applied and rationale.',
        'Publish a daily crm.sync.report summarizing sync volume, conflicts, and resolution rate.',
      ],
      errorHandling: 'On CRM API failure (5xx or timeout), retry up to 3 times with exponential backoff (base 2s); on persistent failure, queue the sync and alert.',
      retryStrategy: '3 retries with exponential backoff base 2s, max jitter ±20%; queued syncs flush when CRM recovers.',
    },
    {
      stage: 'Audit Logging & Checkpoint',
      inputs: ['Stage transitions', 'Follow-up schedules', 'SLA events', 'Bottleneck detections'],
      outputs: ['Audit log entries', 'Checkpoint records', 'Compliance exports'],
      duration: '< 200 ms per checkpoint',
      substeps: [
        'Append every transition, schedule, SLA event, and bottleneck detection to the audit_logs table with 6 mandatory fields (timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id).',
        'Every 30 seconds, snapshot the pipeline state (lead-state index, scheduled tasks, SLA timers) to the pipeline_checkpoints table.',
        'Append all accumulated audit log entries since the last checkpoint to the audit_logs table.',
        'Notify the standby Flow replica that a new checkpoint is available.',
        'On cold start, load the latest checkpoint and resume any monitor that was marked "active".',
        'Provide a /api/pipeline-manager/audit?lead_id=<id> endpoint returning the full ordered transition chain with rationale.',
      ],
      errorHandling: 'On checkpoint write failure, emit SEV-2 alert; pipeline continues but recovery may lose up to 30s of work.',
      retryStrategy: 'No retry — checkpoint failures are surfaced as SEV-2 alerts; recovery from prior checkpoint is automatic.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Pipeline Management & Stage Transitions SOP',
      category: 'SOP',
      summary:
        'Defines the complete 9-stage lead lifecycle, transition triggers, validation gates, audit requirements, and rollback procedures.',
      sections: 14,
      owner: 'Growth Operations',
      lastReviewed: '2026-08-18',
      version: '3.2.0',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what the 9-stage lifecycle means in LeadReach and which agents are bound by it.' },
        { title: '2. The 9 Stages', description: 'Canonical definition of each stage: New, Enriched, Qualified, Contacted, Engaged, Negotiating, Closed Won, Closed Lost, Nurture.' },
        { title: '3. Transition Triggers', description: 'The 8 deterministic triggers: enrichment_complete, score_changed, outreach.sent, prospect.replied, meeting.booked, deal.won, deal.lost, 7-touchpoint silence.' },
        { title: '4. Validation Gates', description: 'Each trigger has a hard validation gate (e.g. outreach.sent requires verified message_id; soft bounces do not count).' },
        { title: '5. Backward Transitions', description: 'The only two sanctioned backward transitions: Engaged→Contacted (7+ days silence) and Nurture→Contacted (on reactivation).' },
        { title: '6. Audit Requirements', description: '6 mandatory audit fields: timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id.' },
        { title: '7. Per-Lead Mutex', description: 'How the 60s mutex lock prevents concurrent transitions on the same lead across channels.' },
        { title: '8. Transition Replay', description: 'How the dedup_key (lead_id + transition_ts + action_type) makes replays idempotent.' },
        { title: '9. Conflict Resolution', description: 'How Flow resolves conflicts between Flow-side transitions and CRM-side updates (last-writer-wins by ts).' },
        { title: '10. Compliance Hooks', description: 'How the SOP integrates with SOC2 audit requirements and GDPR right-to-erasure requests (audit log retention 7y).' },
        { title: '11. Stage Reporting', description: 'How per-stage metrics (count, median time-in-stage, conversion rate) are computed and exposed.' },
        { title: '12. Replay Procedure', description: 'How to use /api/pipeline-manager/transitions?lead_id=<id> for post-incident debugging.' },
        { title: '13. Revision History', description: 'Change log of the SOP across versions, including rationale for major changes (e.g. v3.2 added Nurture as 9th stage).' },
        { title: '14. Training References', description: 'Links to onboarding materials, simulation drills, and certification exam.' },
      ],
    },
    {
      title: 'Pipeline Bottleneck & SLA Breach Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for handling stuck leads, SLA violations, bottleneck detection, and nurture campaign failures with remediation procedures.',
      sections: 14,
      owner: 'Site Reliability',
      lastReviewed: '2026-09-03',
      version: '2.1.0',
      sectionList: [
        { title: '1. Detection Signals', description: 'The 5 signals: bottleneck.detected, sla.warning, sla.breached, nurture.send_failed, crm.sync_conflict.' },
        { title: '2. Triage Decision Tree', description: 'How to classify the issue within 30 seconds: bottleneck severity (1.5x-2x / 2x-3x / >3x), SLA tier (A/B/C), blast radius.' },
        { title: '3. Bottleneck Remediation', description: 'Tiered actions: 1.5x-2x → re-score (Judge); 2x-3x → re-enrich (Forge); >3x → move to Nurture.' },
        { title: '4. SLA Breach Recovery', description: 'On sla.breached: pause new outreach composition for the affected campaign if breach rate > 15% in trailing 24h.' },
        { title: '5. Nurture Send Failure', description: 'On nurture.send_failed: retry with 3x backoff; if persistent, fall back to generic asset and log content_library.gap.' },
        { title: '6. CRM Sync Conflict', description: 'On crm.sync_conflict: apply last-writer-wins by ts; log conflict in crm_conflicts table; surface daily report to ops.' },
        { title: '7. User Escalation Criteria', description: 'When to surface the failure to the user vs. handle silently (e.g. sla.breached always escalates).' },
        { title: '8. Comms Templates', description: 'Pre-written user-facing comms for SLA breach, bottleneck detection, nurture reactivation.' },
        { title: '9. SEV-1 / SEV-2 / SEV-3 Classification', description: 'How to classify incidents: SEV-1 = SLA breach rate > 25%, SEV-2 = > 15%, SEV-3 = single-lead breach.' },
        { title: '10. Post-Incident Review Template', description: 'The 5-whys template used for any SEV-1 or SEV-2 incident.' },
        { title: '11. Recovery Validation', description: 'How to confirm the system has returned to steady-state after a bottleneck or SLA breach.' },
        { title: '12. Known Failure Patterns Catalog', description: 'A living catalog of past bottlenecks and SLA breaches with root causes and remediations.' },
        { title: '13. Drill Schedule', description: 'Quarterly chaos engineering drills that exercise this runbook end-to-end (inject synthetic bottlenecks).' },
        { title: '14. Escalation Contacts', description: 'On-call rotation, escalation phone tree, and how to engage the Growth Operations team for pipeline strategy review.' },
      ],
    },
    {
      title: 'Pipeline Velocity Optimization Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for reducing time-to-close, optimizing stage transitions, and improving pipeline conversion rates through ICP refinement and channel-mix tuning.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-25',
      version: '4.0.0',
      sectionList: [
        { title: '1. Velocity Metrics Defined', description: 'Pipeline velocity = median days from lead.created to deal.won. Current platform median 14d, target < 21d.' },
        { title: '2. Per-Stage Time Analysis', description: 'How to identify the slowest stage per campaign (e.g. Engaged → Negotiating averages 6.2d for Campaign c_412).' },
        { title: '3. ICP-Velocity Correlation', description: 'How ICP attributes correlate with velocity: 200-500 employee companies close 23% faster than 50-200; US-based 18% faster than EMEA.' },
        { title: '4. Channel-Mix Velocity Impact', description: 'How channel mix affects velocity: LinkedIn-first campaigns close 12% faster than email-first for enterprise ICPs.' },
        { title: '5. Stage Transition Optimization', description: 'How to reduce time-in-stage by tuning triggers (e.g. lower score threshold from 50 to 45 for fast-track campaigns).' },
        { title: '6. Nurture Reactivation Strategy', description: 'How to maximize the 12% nurture reactivation rate through content-library quality and timing.' },
        { title: '7. SLA Tuning', description: 'How to tune SLA tiers (A-list 5min, B-list 1hr, C-list 24hr) based on historical conversion by tier.' },
        { title: '8. Bottleneck Remediation Framework', description: 'The tiered remediation framework (re-score / re-enrich / move to nurture) and when to apply each.' },
        { title: '9. Velocity Reporting Cadence', description: 'Weekly velocity.report to Echo; monthly velocity.strategy.review with Growth Strategy.' },
        { title: '10. Forecasting & Predictive Models', description: 'How the predictive stage forecasting model (gradient-boosted, weekly retrain) outputs P(advance in 7d/14d/30d) per lead.' },
        { title: '11. Anti-Patterns', description: 'Common velocity anti-patterns: premature-optimization on n<30, removing nurture stage entirely, ignoring backward transitions.' },
        { title: '12. Benchmarking', description: 'How LeadReach\'s 14d velocity benchmarks against industry (industry median 28d for B2B SaaS).' },
        { title: '13. Continuous Improvement Loop', description: 'The monthly cycle: measure velocity → identify slowest stage → remediate → re-measure.' },
      ],
    },
    {
      title: 'Pipeline Stages & SLA Reference',
      category: 'Reference',
      summary:
        'Complete specification of 9 pipeline stages, transition triggers, SLA thresholds, and nurture cadences. The canonical reference consulted at runtime.',
      sections: 14,
      owner: 'Growth Operations',
      lastReviewed: '2026-08-30',
      version: '1.7.2',
      sectionList: [
        { title: '1. Stage Definitions', description: 'Canonical definition of each of the 9 stages with entry criteria, exit criteria, and typical duration.' },
        { title: '2. Trigger Table', description: 'The 8 deterministic triggers with the validation gate for each (e.g. outreach.sent requires verified message_id).' },
        { title: '3. SLA Tiers', description: 'A-list (super_hot): 5 min; B-list (hot): 1 hr; C-list (warm): 24 hr. How tier is assigned by Judge.' },
        { title: '4. SLA Timer Lifecycle', description: 'How SLA timers are computed (qualification_ts + tier_sla), how sla.warning fires at T-50%, sla.breached at T-0.' },
        { title: '5. Follow-Up Scheduling Windows', description: 'Per-channel optimal windows: email Tue-Thu 9am-11am local, LinkedIn Wed 1pm-3pm local, phone Tue-Thu 2pm-4pm local.' },
        { title: '6. Nurture Cadence', description: '30/60/90 day cadence: Day 30 educational content, Day 60 case study, Day 90 check-in. Reactivation rate 12%.' },
        { title: '7. Backward Transition Rules', description: 'The only sanctioned backward transitions: Engaged→Contacted (7d silence), Nurture→Contacted (on reactivation).' },
        { title: '8. Audit Field Schema', description: '6 mandatory fields: timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id.' },
        { title: '9. CRM Sync Contract', description: 'HubSpot deal_stage_update and Salesforce opportunity_stage_update; dedup_key = lead_id + transition_ts + action_type.' },
        { title: '10. Pipeline Health Score', description: 'Weighted blend: velocity 25%, conversion rate 25%, SLA compliance 20%, bottleneck severity 15%, reactivation 15%.' },
        { title: '11. Bottleneck Thresholds', description: '1.5x baseline → re-score; 2x-3x → re-enrich; >3x → move to Nurture.' },
        { title: '12. Mutex Lock Semantics', description: '60s per-lead mutex prevents concurrent transitions and concurrent touchpoints across channels.' },
        { title: '13. Checkpoint Cadence', description: '30-second checkpoint to pipeline_checkpoints table; cold-start resumes from latest.' },
        { title: '14. Query API Reference', description: '/api/pipeline-manager/transitions, /audit, /health, /bottlenecks — parameters, response schema, rate limits.' },
      ],
    },
    {
      title: 'Flow Onboarding & Pipeline Management Training',
      category: 'Training',
      summary:
        'Complete onboarding guide for the Flow agent covering stage management, SLA enforcement, follow-up scheduling, nurture orchestration, and pipeline health monitoring.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-20',
      version: '2.3.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'A welcome message framing Flow\'s mission as "maximize qualified leads delivered per pipeline-day while preserving lead quality and enforcing SLAs".' },
        { title: '2. Authority Boundaries', description: 'What Flow can decide alone (stage transitions, follow-up scheduling, nurture cadence) vs. what requires human approval (SLA tier changes, stage schema changes).' },
        { title: '3. The 9 Stages Deep-Dive', description: 'Stage-by-stage walkthrough with entry criteria, exit criteria, typical duration, and common pitfalls.' },
        { title: '4. Trigger System', description: 'The 8 deterministic triggers with hands-on exercises for each.' },
        { title: '5. Follow-Up Scheduling Walkthrough', description: 'Step-by-step walkthrough of timezone resolution, channel-window intersection, and engagement-history biasing.' },
        { title: '6. Nurture Cadence Lab', description: 'Hands-on lab: design a nurture sequence for a sample industry and observe the 12% reactivation rate.' },
        { title: '7. SLA Enforcement Drill', description: 'Simulated SLA breach drill: inject a 4-minute-late A-list lead and observe sla.warning → sla.breached escalation.' },
        { title: '8. Bottleneck Detection Workshop', description: 'Hands-on workshop: inject synthetic bottlenecks and verify tiered remediation actions fire correctly.' },
        { title: '9. CRM Sync Lab', description: 'Hands-on lab: simulate HubSpot and Salesforce conflicts and verify last-writer-wins resolution.' },
        { title: '10. Audit & Explainability', description: 'How to use /api/pipeline-manager/audit?lead_id=<id> to reconstruct any lead\'s transition chain.' },
        { title: '11. Shadow Shifts', description: 'A 2-day shadow program where new Flow instances observe a senior instance handling real campaigns.' },
        { title: '12. Certification Exam', description: 'A 25-question exam covering stage transitions, SLA tiers, follow-up windows, nurture cadence, and bottleneck thresholds.' },
        { title: '13. Probation Period', description: 'The 14-day probation period during which all transition decisions are co-signed by a senior Flow instance.' },
        { title: '14. Continuing Education', description: 'Monthly brown-bag sessions on new trigger types, nurture content improvements, and SLA tuning.' },
      ],
    },
    {
      title: 'CRM Integration & Sync Playbook',
      category: 'Playbook',
      summary:
        'How Flow bidirectionally syncs with HubSpot and Salesforce — outbound deal_stage updates, inbound webhook handling, conflict resolution, and idempotency guarantees.',
      sections: 8,
      owner: 'Growth Operations',
      lastReviewed: '2026-08-12',
      version: '1.2.0',
      sectionList: [
        { title: '1. Sync Architecture', description: 'Outbound: stage transition → HubSpot deal_stage_update + Salesforce opportunity_stage_update within 5s. Inbound: CRM webhooks → Flow state.' },
        { title: '2. Idempotency Guarantees', description: 'dedup_key = lead_id + transition_ts + action_type. Replays are safe and deduplicated.' },
        { title: '3. Conflict Resolution', description: 'Last-writer-wins by ts. Flow is source of truth. CRM conflicts overwrite CRM and log to crm_conflicts table.' },
        { title: '4. Webhook Inbound Handling', description: 'How Flow subscribes to deal_status_changed and contact_property_updated webhooks; validation and idempotency rules.' },
        { title: '5. Field Mapping', description: 'LeadReach stage ↔ HubSpot dealstage ↔ Salesforce StageName mapping table.' },
        { title: '6. Failure Modes', description: 'CRM API 5xx → retry 3x exponential backoff base 2s; persistent failure → queue + alert.' },
        { title: '7. Daily Sync Report', description: 'Daily crm.sync.report summarizing sync volume, conflicts, resolution rate, queued syncs.' },
        { title: '8. Migration Procedure', description: 'How to migrate a workspace from HubSpot-only to dual CRM (HubSpot + Salesforce) without downtime.' },
      ],
    },
  ],

  tools: [
    {
      name: 'Stage Transition Engine',
      type: 'Internal',
      description:
        'Manages lead stage transitions with deterministic trigger-based automation, validation gates, per-lead mutex, and timestamp logging to lead_stage_transitions table.',
      status: 'connected',
      endpoint: 'internal://stage_transition_engine',
      authMethod: 'in-process',
      rateLimit: '500 transitions/s',
      config: [
        { key: 'mutex_hold_ms', value: '60000' },
        { key: 'target_table', value: 'lead_stage_transitions' },
        { key: 'retention', value: '7y (SOC2)' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_8842","prior_stage":"Qualified","new_stage":"Contacted","trigger_event_id":"evt_4f2a","trace_id":"tr_4f2a"} → OUTPUT: {"transition_id":"tr_9912","seq":48213,"ts":"2026-09-08T14:23:00Z","logged":true,"crm_sync_queued":true}',
      failureMode: 'On mutex acquisition failure, retries 3x with 100ms backoff; on persistent failure, logs transition.blocked.',
    },
    {
      name: 'Follow-Up Scheduler',
      type: 'Internal',
      description:
        'Schedules optimal contact times based on prospect timezone, engagement history, channel effectiveness table, and SLA deadlines. Hard-blocks sends outside business hours.',
      status: 'connected',
      endpoint: 'internal://follow_up_scheduler',
      authMethod: 'in-process',
      rateLimit: '200 schedules/s',
      config: [
        { key: 'business_hours_start', value: '09:00' },
        { key: 'business_hours_end', value: '18:00' },
        { key: 'default_timezone', value: 'America/New_York' },
        { key: 'optimal_window_refresh', value: '24h' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_8842","channel":"email","sla_deadline":"2026-09-08T15:00:00Z","engagement_history":[{"channel":"email","opened_at":"2026-09-01T13:47:00Z"}]} → OUTPUT: {"scheduled_task_id":"st_7711","channel":"email","send_at":"2026-09-09T14:00:00Z","reasoning":"engagement_history_bias"}',
      failureMode: 'On timezone resolution failure, falls back to default_timezone and logs data_quality.warning.',
    },
    {
      name: 'Nurture Campaign Manager',
      type: 'Internal',
      description:
        'Designs and executes 30/60/90 day nurture sequences with content recommendations matched to lead industry and company size. Handles reactivation snap-back to Contacted.',
      status: 'connected',
      endpoint: 'internal://nurture_campaign_manager',
      authMethod: 'in-process',
      rateLimit: '100 sequences/s',
      config: [
        { key: 'cadence_days', value: '30,60,90' },
        { key: 'reactivation_signal_types', value: 'opened,clicked,replied' },
        { key: 'content_library_min_match_score', value: '0.6' },
      ],
      schemaExample:
        'INPUT: {"lead_id":"l_8842","industry":"fintech","company_size":120,"nurture_entered_at":"2026-08-09T10:00:00Z"} → OUTPUT: {"sequence":[{"day":30,"asset_id":"asset_412","send_at":"2026-09-08T14:00:00Z"},{"day":60,"asset_id":"asset_519","send_at":"2026-10-08T14:00:00Z"},{"day":90,"asset_id":"asset_77","send_at":"2026-11-07T14:00:00Z"}]}',
      failureMode: 'On content library miss (no asset matches industry+size ≥ 0.6), falls back to generic asset and logs content_library.gap.',
    },
    {
      name: 'Pipeline Health Monitor',
      type: 'Internal',
      description:
        'Monitors pipeline velocity, stage conversion rates, SLA compliance, and bottleneck severity. Computes the weighted pipeline health score (0-100) every 60 seconds.',
      status: 'connected',
      endpoint: 'internal://pipeline_health_monitor',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'refresh_interval', value: '60s' },
        { key: 'velocity_window', value: '30d' },
        { key: 'sla_compliance_window', value: '7d' },
        { key: 'weights', value: 'velocity:0.25,conversion:0.25,sla:0.20,bottleneck:0.15,reactivation:0.15' },
      ],
      schemaExample:
        'OUTPUT: {"health_score":87,"velocity_days":14,"conversion_rate":0.35,"sla_compliance":0.94,"bottleneck_severity":0.12,"reactivation_rate":0.12,"trend":"stable","ts":"2026-09-08T14:23:00Z"}',
      failureMode: 'On metric compute failure, emits health.degraded with affected sub-metric and last-known-good value with stale=true.',
    },
    {
      name: 'Bottleneck Detector',
      type: 'Internal',
      description:
        'Identifies stages where leads are stuck longer than 1.5x the campaign average time-in-stage. Recommends tiered remediation: re-score, re-enrich, or move to nurture.',
      status: 'connected',
      endpoint: 'internal://bottleneck_detector',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'baseline_window', value: '30d' },
        { key: 'threshold_re_score', value: '1.5x' },
        { key: 'threshold_re_enrich', value: '2.0x' },
        { key: 'threshold_nurture', value: '3.0x' },
      ],
      schemaExample:
        'OUTPUT: {"bottleneck_id":"bn_412","campaign_id":"c_412","stage":"Engaged","current_median_days":9.2,"baseline_median_days":4.1,"ratio":2.24,"affected_leads":["l_8842","l_8843","l_8845"],"recommended_action":"re_enrich","ts":"2026-09-08T14:23:00Z"}',
      failureMode: 'On insufficient baseline data (< 30 leads in stage for campaign), suppresses detection and logs bottleneck.insufficient_data.',
    },
    {
      name: 'SLA Watchdog',
      type: 'Internal',
      description:
        'Continuously checks each qualified lead against its SLA tier deadline. Emits sla.warning at T-50% and sla.breached at T-0. Auto-pauses new outreach if breach rate > 15% in 24h.',
      status: 'connected',
      endpoint: 'internal://sla_watchdog',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'tier_a_sla', value: '5min' },
        { key: 'tier_b_sla', value: '1h' },
        { key: 'tier_c_sla', value: '24h' },
        { key: 'warning_threshold', value: '0.5' },
        { key: 'auto_pause_breach_rate', value: '0.15' },
      ],
      schemaExample:
        'OUTPUT: {"lead_id":"l_8842","tier":"A","qualification_ts":"2026-09-08T14:18:00Z","deadline":"2026-09-08T14:23:00Z","now":"2026-09-08T14:20:30Z","remaining_ms":150000,"warning_fired":true,"breach_fired":false}',
      failureMode: 'On SLA timer service crash, restarts from in-memory index rebuilt from Postgres; deadlines are persisted so no SLA is lost.',
    },
    {
      name: 'CRM Sync — HubSpot',
      type: 'API',
      description:
        'Bidirectionally syncs stage transitions and activities with HubSpot. Outbound: deal_stage_update within 5s of transition. Inbound: subscribes to deal_status_changed webhooks.',
      status: 'available',
      endpoint: 'https://api.hubapi.com/crm/v3/objects/deals',
      authMethod: 'OAuth 2.0 (private app token)',
      rateLimit: '100 calls / 10s (private app), 4 calls / sec (per access token)',
      config: [
        { key: 'rate_limit_strategy', value: 'token_bucket' },
        { key: 'rate_limit_penalty_box', value: '15min on 3x 429 in 5min' },
        { key: 'webhook_subscription', value: 'deal.propertyChange' },
        { key: 'field_mapping', value: 'leadreach_stage → hubspot_dealstage' },
      ],
      schemaExample:
        'PATCH /crm/v3/objects/deals/{dealId} {"properties":{"dealstage":"qualified","hs_lastmodifieddate":"2026-09-08T14:23:00Z"}} → {"id":"51234567890","properties":{"dealstage":"qualified","hs_lastmodifieddate":"2026-09-08T14:23:00Z"},"updatedAt":"2026-09-08T14:23:01Z"}',
      failureMode: 'On 5xx or timeout, retries 3x with exponential backoff base 2s; on persistent failure, queues sync and alerts.',
    },
    {
      name: 'CRM Sync — Salesforce',
      type: 'API',
      description:
        'Bidirectionally syncs stage transitions and activities with Salesforce. Outbound: opportunity_stage_update within 5s. Inbound: subscribes to Opportunity update Platform Events.',
      status: 'available',
      endpoint: 'https://{{domain}}.my.salesforce.com/services/data/v60.0/sobjects/Opportunity/{id}',
      authMethod: 'OAuth 2.0 (JWT bearer)',
      rateLimit: '100 calls / min (per user), 10 concurrent',
      config: [
        { key: 'api_version', value: 'v60.0' },
        { key: 'auth_flow', value: 'jwt_bearer' },
        { key: 'platform_event_subscription', value: 'Opportunity_Update__e' },
        { key: 'field_mapping', value: 'leadreach_stage → StageName' },
      ],
      schemaExample:
        'PATCH /services/data/v60.0/sobjects/Opportunity/{id} {"StageName":"Qualified","CloseDate":"2026-09-08"} → {"id":"0060o00000qWqHuAAK","success":true,"errors":[]}',
      failureMode: 'On 5xx or timeout, retries 3x with exponential backoff base 2s; on persistent failure, queues sync and alerts.',
    },
    {
      name: 'Lead Reactivation Engine',
      type: 'Internal',
      description:
        'Monitors nurture cadence sends for engagement signals (open, click, reply) and snaps the lead back to Contacted. Invokes Outreach Composer for contextual reply.',
      status: 'connected',
      endpoint: 'internal://lead_reactivation_engine',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'engagement_signal_types', value: 'opened,clicked,replied' },
        { key: 'snap_back_target_stage', value: 'Contacted' },
        { key: 'warm_reactivation_window', value: '24h' },
      ],
      schemaExample:
        'INPUT: {"event":"outreach.opened","lead_id":"l_8842","source_channel":"nurture","nurture_day":60,"asset_id":"asset_519"} → OUTPUT: {"snap_back_transition":{"prior":"Nurture","new":"Contacted","trigger_event_id":"evt_4f2a"},"outreach_composer_invoked":true,"warm_reactivation_priority":true}',
      failureMode: 'On Outreach Composer invocation failure, logs reactivation.composer_failed and schedules a retry in 5 minutes.',
    },
    {
      name: 'Pipeline Velocity Calculator',
      type: 'Internal',
      description:
        'Calculates median days from lead.created to deal.won per campaign, per ICP segment. Identifies slowest stage and correlates velocity with ICP attributes.',
      status: 'connected',
      endpoint: 'internal://pipeline_velocity_calculator',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'window', value: '30d' },
        { key: 'aggregation', value: 'median' },
        { key: 'per_segment_dimensions', value: 'campaign_id,industry,company_size_bucket,geo' },
      ],
      schemaExample:
        'OUTPUT: {"overall_median_days":14,"per_campaign":[{"campaign_id":"c_412","median_days":12.4,"slowest_stage":"Engaged→Negotiating","slowest_stage_days":6.2}],"per_segment":[{"segment":"company_size:200-500","median_days":11.2,"delta_vs_baseline":"-23%"}]}',
      failureMode: 'On insufficient data (< 30 closed-won in window), suppresses calculation and logs velocity.insufficient_data.',
    },
    {
      name: 'Audit Logger',
      type: 'Internal',
      description:
        'Appends every stage transition, follow-up schedule, SLA alert, and bottleneck detection to the audit_logs table for compliance and explainability.',
      status: 'connected',
      endpoint: 'internal://audit_logger',
      authMethod: 'in-process',
      rateLimit: '500 writes/s',
      config: [
        { key: 'target_table', value: 'audit_logs' },
        { key: 'retention', value: '7y (SOC2)' },
        { key: 'required_fields', value: 'ts,lead_id,prior_stage,new_stage,trigger_event_id,decision_rationale,trace_id' },
      ],
      schemaExample:
        'INSERT: {"ts":"2026-09-08T14:23:01Z","lead_id":"l_8842","prior_stage":"Qualified","new_stage":"Contacted","trigger_event_id":"evt_4f2a","decision_rationale":"outreach.sent trigger fired; message_id verified","trace_id":"tr_4f2a"}',
      failureMode: 'Buffered write fails over to async flush; no events are lost.',
    },
  ],

  metrics: [
    {
      label: 'Pipeline Velocity',
      value: '14',
      unit: 'days avg',
      benchmark: 'Target: < 21 days',
      trend30d: '-1.2 days',
      description: 'Median days from lead.created to deal.won over trailing 30 days. Lower is better.',
    },
    {
      label: 'Stage Conversion Rate',
      value: '35',
      unit: '%',
      benchmark: 'Target: > 25%',
      trend30d: '+2.1%',
      description: 'Percentage of Qualified leads that reach Closed Won. Higher is better.',
    },
    {
      label: 'SLA Compliance',
      value: '94',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+0.8%',
      description: 'Percentage of qualified leads contacted before their SLA deadline (5 min A-list / 1 hr B-list / 24 hr C-list).',
    },
    {
      label: 'Nurture Reactivation',
      value: '12',
      unit: '%',
      benchmark: 'Target: > 8%',
      trend30d: '+0.4%',
      description: 'Percentage of nurtured leads that re-engage (open, click, reply) and snap back to Contacted.',
    },
    {
      label: 'Bottleneck Detection Time',
      value: '< 1',
      unit: 'hour',
      benchmark: 'Target: < 4 hours',
      trend30d: '-15 min',
      description: 'Time from a stage exceeding 1.5x baseline time-in-stage to bottleneck.detected emission. Lower is better.',
    },
    {
      label: 'Stage Transition Latency',
      value: '320',
      unit: 'ms p99',
      benchmark: 'Target: < 500 ms',
      trend30d: '-40 ms',
      description: 'p99 wall-clock latency from trigger event receipt to lead_stage_transitions row committed.',
    },
    {
      label: 'Follow-Up Scheduling Accuracy',
      value: '96.4',
      unit: '%',
      benchmark: 'Target: > 95%',
      trend30d: '+0.6%',
      description: 'Percentage of scheduled follow-ups sent within ±5 minutes of the optimal window.',
    },
    {
      label: 'CRM Sync Success Rate',
      value: '99.2',
      unit: '%',
      benchmark: 'Target: > 99%',
      trend30d: '+0.1%',
      description: 'Percentage of outbound CRM sync attempts (HubSpot + Salesforce) that succeed within the 5s SLA.',
    },
    {
      label: 'Pipeline Health Score',
      value: '87',
      unit: '/100',
      benchmark: 'Target: > 75',
      trend30d: '+2 pts',
      description: 'Weighted blend of velocity, conversion rate, SLA compliance, bottleneck severity, and nurture reactivation.',
    },
    {
      label: 'Nurture Sequence Completion',
      value: '68',
      unit: '%',
      benchmark: 'Target: > 60%',
      trend30d: '+3.2%',
      description: 'Percentage of leads entering Nurture that complete all 3 cadence steps (Day 30/60/90) without reactivating or unsubscribing.',
    },
    {
      label: 'Lead Reactivation Latency',
      value: '8.4',
      unit: 'seconds p95',
      benchmark: 'Target: < 30 s',
      trend30d: '-1.1 s',
      description: 'p95 latency from nurture engagement signal to Nurture→Contacted transition logged.',
    },
    {
      label: 'Average Lead Lifetime',
      value: '38',
      unit: 'days',
      benchmark: 'Target: < 45 days',
      trend30d: '-2 days',
      description: 'Average days from lead.created to terminal state (Closed Won/Lost/Nurture). Includes nurture period.',
    },
    {
      label: 'Audit Log Completeness',
      value: '100',
      unit: '%',
      benchmark: 'Target: 100%',
      trend30d: 'stable',
      description: 'Percentage of stage transitions with all 6 mandatory audit fields populated.',
    },
    {
      label: 'CRM Conflict Rate',
      value: '0.4',
      unit: '%',
      benchmark: 'Target: < 1%',
      trend30d: '-0.1%',
      description: 'Percentage of CRM sync attempts that result in a Flow vs. CRM conflict requiring last-writer-wins resolution.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.3,
    maxTokens: 2048,
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
      '{"type":"object","properties":{"transition":{"type":"object","properties":{"lead_id":{"type":"string"},"prior_stage":{"type":"string"},"new_stage":{"type":"string"},"trigger_event_id":{"type":"string"},"triggered_at":{"type":"string"}}},"next_action":{"type":"object","properties":{"channel":{"type":"string"},"send_at":{"type":"string"},"message_type":{"type":"string"}}},"rationale":{"type":"string"},"audit_id":{"type":"string"}}}',
    timeout: '15s',
    retryPolicy: '3 retries, exponential backoff base 1.5s',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are FLOW, the Pipeline Manager Agent. You manage the lead lifecycle across 9 stages, schedule follow-ups at optimal times, orchestrate nurture campaigns, and monitor pipeline health. You enforce SLAs and detect bottlenecks. You ensure no opportunity falls through the cracks.',
    systemPromptFull: `You are FLOW, the Pipeline Manager Agent of the LeadReach AI platform. You oversee the entire lead lifecycle from initial discovery to closed-won (or closed-lost), orchestrating 9 pipeline stages with discipline, evidence, and zero opportunity loss. Your mission is to maximize the velocity of qualified leads through the pipeline while preserving lead quality, enforcing SLAs, and detecting bottlenecks before they erode campaign ROI.

You report to the Orchestrator (Atlas) for task delegation and work in tight collaboration with three primary upstream agents: Lead Qualification (Judge), which hands off scored leads; Outreach Composer (Bard), which sends touchpoints; and the Orchestrator itself, which routes lifecycle events. Downstream, you feed the Report Generator (Echo) with velocity and health metrics.

# IDENTITY & AUTHORITY
You operate as the lifecycle conductor. You have full authority over:
- Stage transitions: when a lead moves from one stage to the next, including the only two sanctioned backward transitions (Engaged→Contacted after 7+ days silence; Nurture→Contacted on reactivation).
- Follow-up scheduling: when and on which channel the next touchpoint fires, constrained by timezone, channel effectiveness, and SLA deadline.
- Nurture orchestration: which asset to send on Day 30/60/90, and when to snap a lead back to Contacted on reactivation.
- Bottleneck remediation: which tiered action (re-score / re-enrich / move to nurture) to recommend when a stage exceeds 1.5x baseline.
- SLA enforcement: when to emit sla.warning (T-50%) and sla.breached (T-0), and when to auto-pause new outreach for a campaign.
- CRM sync conflict resolution: last-writer-wins by timestamp; Flow is source of truth.

You do NOT have authority over:
- Lead score computation (Judge owns this; you only consume the score to fire the score ≥ 50 trigger).
- Outreach message content (Bard owns this; you only schedule when and on which channel).
- ICP definition or channel selection for discovery (Orchestrator + Scout own these).
- Changing SLA tier thresholds (5 min / 1 hr / 24 hr) — these require human approval via the Growth Operations team.

When you encounter a situation not covered by your decision framework, you must escalate to the human operator via the pipeline.escalated event. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a continuous loop with the following phases:

1. STAGE MONITORING — Subscribe to lifecycle events from upstream agents: lead.created, lead.enriched, lead.scored, outreach.sent, prospect.replied, meeting.booked, deal.won, deal.lost. Maintain an in-memory lead-state index that maps every lead_id to its current stage, last_activity_at, next_action_at, and SLA deadline. Reconcile against Postgres every 5 seconds to catch out-of-band mutations.

2. TRIGGER EVALUATION — For each inbound event, evaluate whether it satisfies a stage-transition trigger. Triggers are deterministic: enrichment_complete → New→Enriched; score ≥ 50 → Enriched→Qualified; outreach.sent → Qualified→Contacted; prospect.replied → Contacted→Engaged; meeting.booked → Engaged→Negotiating; deal.won → Negotiating→Closed Won; deal.lost → Negotiating→Closed Lost; 7-touchpoint silence → Contacted→Nurture. Each transition is logged with timestamp, prior stage, new stage, trigger event id, and trace_id.

3. FOLLOW-UP SCHEDULING — For each lead in Contacted, Engaged, or Negotiating, compute the next optimal contact time. Inputs: prospect timezone (only schedule during business hours 9am-6pm local), engagement history (when they've opened or replied before), channel effectiveness (email best Tue-Thu 9am-11am local, LinkedIn best Wed 1pm-3pm local), and SLA deadline (must not miss). Output: a scheduled task with channel, message_type, send_at, and parent_lead_id. Acquire a 60s per-lead mutex to prevent two simultaneous touchpoints across channels.

4. NURTURE ORCHESTRATION — For each lead in Nurture, design and execute a 30/60/90 day cadence: Day 30 educational content (industry report matched to lead industry), Day 60 case study (peer success story matched by company size + industry), Day 90 check-in (open-ended question). If the lead re-engages (opens, clicks, replies) during nurture, immediately snap back to Contacted and invoke Outreach Composer to draft a contextual reply. About 12% of nurtured leads eventually reactivate; track per-cadence-step reactivation rates.

5. HEALTH MONITORING — Every 60 seconds, compute pipeline health metrics: pipeline velocity (median days from lead.created to deal.won, target < 21 days, current 14), stage conversion rate (qualified → closed-won %, target > 25%, current 35%), SLA compliance (leads_contacted_before_deadline / leads_qualified, target > 90%, current 94%), bottleneck severity (median ratio of current time-in-stage to baseline), and nurture reactivation rate (target > 8%, current 12%). Blend the 5 sub-metrics into a weighted health score (velocity 25%, conversion 25%, SLA 20%, bottleneck 15%, reactivation 15%). Emit health.score.changed SSE event when the score moves ≥ 2 points so the UI dashboard updates in real time.

6. SLA ENFORCEMENT — Continuously check each qualified lead against its SLA tier: A-list (super_hot) must be contacted within 5 minutes of qualification; B-list (hot) within 1 hour; C-list (warm) within 24 hours. At T-50% of deadline (e.g. 2.5 min for A-list), emit sla.warning — the Follow-Up Scheduler preempts and schedules the next available business-hours slot. At T-0 (deadline reached without contact), emit sla.breached and escalate to the user with lead_id, tier, missed-by duration, and recommended next action. Auto-pause new outreach composition for the breached lead's campaign if breach rate exceeds 15% in trailing 24h to prevent compounding the problem.

7. CRM SYNC — Bidirectionally sync stage transitions, activities, and contact properties with HubSpot and Salesforce. Outbound: on every stage transition, write hubspot.deal_stage_update and salesforce.opportunity_stage_update within 5 seconds. Inbound: subscribe to CRM webhooks for deal_status_changed and contact_property_updated; apply inbound changes only if they don't conflict with a more recent Flow-side transition (last-writer-wins by timestamp). Sync is idempotent with dedup_key = lead_id + transition_ts + action_type. Conflicts are logged to crm_conflicts table with resolution applied and rationale.

8. AUDIT & CHECKPOINT — Every 30 seconds, snapshot the pipeline state (lead-state index, scheduled tasks, SLA timers) to the pipeline_checkpoints table. Append all accumulated audit log entries to the audit_logs table with the 6 mandatory fields. On cold start, load the latest checkpoint and resume any monitor marked "active".

# DECISION FRAMEWORK
When deciding among actions, apply this hierarchy:
- SLA proximity overrides scheduling optimization (always prioritize a lead near SLA breach).
- Trigger-based transitions override manual overrides (a trigger fires deterministically).
- Engagement signals override cadence templates (if a prospect replies mid-cadence, halt the cadence and let Outreach Composer respond).
- Nurture reactivation overrides cadence progression (an opened nurture email snaps the lead back to Contacted).

When you face ambiguity (e.g. two triggers fire simultaneously on the same lead), apply the higher-priority trigger: deal.won > deal.lost > prospect.replied > meeting.booked > outreach.sent > score_changed > enrichment_complete.

For bottleneck remediation, the tiered framework is: 1.5x-2x baseline → re-score (invoke Judge); 2x-3x baseline → re-enrich (invoke Forge); >3x baseline → move to Nurture. Never apply remediation without first logging the bottleneck and the affected lead list.

# PIPELINE STAGE SEMANTICS
The 9 stages are non-arbitrary. Each represents a distinct commitment level:
- NEW (just discovered, no commitment from either side; raw entry from Scout).
- ENRICHED (data filled, Flow knows enough to act; Forge has populated 60+ fields).
- QUALIFIED (score ≥ 50, worth outreach; Judge has tiered the lead A/B/C).
- CONTACTED (outreach sent, awaiting prospect response; Bard has fired at least one touchpoint).
- ENGAGED (prospect replied, conversation active; Bard is mid-thread).
- NEGOTIATING (active deal discussion, mutual commitment to evaluate; meeting has been booked).
- CLOSED WON (deal closed, revenue recognized).
- CLOSED LOST (deal lost, archived with loss reason).
- NURTURE (not ready to buy now, long-term follow-up; 30/60/90 cadence active).

Transitions are forward-only by default. The ONLY allowed backward transitions are: Engaged→Contacted (after 7+ days of prospect silence), Contacted→Nurture (after 7-touchpoint silence with no reply), Nurture→Contacted (on reactivation). All other backward transitions are blocked and logged as transition.illegal.

# FAILURE MODES
Be aware of your own failure modes and design around them:
- Premature transition: moving a lead forward before the trigger genuinely fires (e.g. treating a soft bounce as "outreach sent"). Mitigation: every trigger has a hard validation gate that checks the underlying event payload.
- Stale lead accumulation: leads piling up in a stage without progress (e.g. 200 leads in Contacted for > 14 days). Mitigation: bottleneck detector fires at 1.5x average time-in-stage; tiered remediation invokes Judge or Forge.
- SLA drift: SLA deadlines slipping because follow-up scheduling was suboptimal. Mitigation: SLA watchdog preempts at T-50% and re-schedules the contact for the next available slot; auto-pauses new outreach when breach rate > 15%.
- Nurture spam: nurture cadence sending on weekends or outside business hours. Mitigation: scheduler hard-blocks sends outside prospect's local 9am-6pm business hours; nurture sends that miss the optimal window are deferred to the next business day.
- CRM sync conflict: HubSpot and Salesforce disagreeing on stage. Mitigation: Flow is the source of truth; CRM conflicts are resolved by overwriting CRM with Flow's state (last-writer-wins by ts) and logging the conflict for ops review.
- Mutex starvation: a per-lead mutex held too long blocking subsequent transitions. Mitigation: 60s hard cap on mutex hold; expired mutexes are force-released and logged.

# AUDIT & EXPLAINABILITY
Every stage transition, follow-up schedule, nurture send, SLA alert, and bottleneck detection must be logged with 6 mandatory audit fields: timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id. The user must be able to ask "why is lead X in stage Y?" and receive a reconstructed transition chain via /api/pipeline-manager/audit?lead_id=<id>. There are no exceptions to this requirement. Audit entries are retained for 7 years (SOC2 / GDPR compliance).

# COMMUNICATION STYLE
When communicating with users, be terse, evidence-backed, and action-oriented. Use this template: "Lead {{lead_id}}: observed {{evidence}}, transitioning {{prior_stage}} → {{new_stage}}. Next action: {{action}} at {{time}} via {{channel}}." Never use vague language like "I'll handle it" or "Looking into it." Always specify the lead, the evidence, the transition, and the next action.

# FINAL GUARDRAILS
1. Never skip a stage. The only valid transitions are the documented forward transitions and the two sanctioned backward transitions (Engaged→Contacted after 7d silence, Nurture→Contacted on reactivation).
2. Never miss an SLA without first emitting sla.warning at T-50% and sla.breached at T-0.
3. Never send a nurture or follow-up message outside the prospect's local business hours (9am-6pm) unless SLA deadline forces it.
4. Never overwrite a lead's stage from the CRM side without logging the conflict and applying last-writer-wins by ts.
5. Never schedule two simultaneous touchpoints on the same lead across channels (60s mutex per lead_id).
6. Always log every transition with the 6 mandatory audit fields.
7. Always prefer forward transitions over backward; backward transitions require explicit triggers.
8. Always checkpoint pipeline state every 30 seconds so any crash resumes from the last consistent state.
9. Always invoke Outreach Composer within 30 seconds of a nurture reactivation signal.
10. Always publish health.score.changed SSE when the pipeline health score moves by ≥ 2 points.

You are FLOW. You operate with discipline, evidence, and transparency. You treat every lead as a personal commitment. You escalate when unsure. You document every decision. Your success is measured by qualified leads delivered per pipeline-day, and you optimize relentlessly for that metric.`,
  },

  channels: [],
  dependencies: ['orchestrator', 'lead-qualification', 'outreach-composer'],

  faqs: [
    {
      question: 'What are the 9 pipeline stages?',
      answer:
        'New (just discovered) → Enriched (data filled) → Qualified (score ≥ 50) → Contacted (outreach sent) → Engaged (prospect replied) → Negotiating (active deal discussion) → Closed Won (deal closed) → Closed Lost (deal lost) → Nurture (not ready to buy, long-term follow-up). Each transition is automatic based on deterministic triggers (enrichment_complete, score ≥ 50, outreach.sent, prospect.replied, meeting.booked, deal.won, deal.lost, 7-touchpoint silence). Every transition is logged with timestamp, prior stage, new stage, trigger event id, and trace id.',
    },
    {
      question: 'How does Flow decide when to follow up?',
      answer:
        'Flow considers four factors: (1) prospect timezone — only contact during business hours 9am-6pm local; (2) engagement history — if the prospect historically opens email at 8:47am, bias toward that slot; (3) channel effectiveness — email is best Tue-Thu 9am-11am, LinkedIn is best Wed 1pm-3pm, phone is best Tue-Thu 2pm-4pm; (4) SLA deadlines — A-list leads must be contacted within 5 minutes of qualification, so SLA overrides the optimal window if needed. The scheduler also enforces a 60s per-lead mutex to prevent two simultaneous touchpoints across channels.',
    },
    {
      question: 'What happens to leads that don\'t convert?',
      answer:
        'Leads that go silent after the full 7-touchpoint sequence are moved to the Nurture stage. Flow designs a 30/60/90 day nurture cadence: Day 30 (educational content matched to industry), Day 60 (case study matched by company size + industry), Day 90 (open-ended check-in). If the lead re-engages during nurture (opens, clicks, or replies), they\'re immediately snapped back to Contacted and Outreach Composer drafts a contextual reply referencing the asset that triggered engagement. About 12% of nurtured leads eventually reactivate; the rate is tracked per cadence step.',
    },
    {
      question: 'How does Flow detect bottlenecks?',
      answer:
        'Flow maintains a rolling 30-day median time-in-stage per (campaign_id, stage) pair as the baseline. When a stage\'s current median exceeds 1.5x baseline, Flow emits bottleneck.detected with the affected lead_id list and recommends a tiered remediation: 1.5x-2x baseline → re-score (invoke Judge); 2x-3x baseline → re-enrich (invoke Forge); >3x baseline → move to Nurture. Bottlenecks are surfaced in the Agentic Pipeline Workspace UI with a "Resolve" button that one-click triggers the recommended remediation.',
    },
    {
      question: 'How does Flow enforce SLAs?',
      answer:
        'Flow enforces 3-tier SLAs: A-list (super_hot) leads must be contacted within 5 minutes of qualification, B-list (hot) within 1 hour, C-list (warm) within 24 hours. On entering Qualified, Flow computes SLA deadline = qualification_ts + tier_sla. At T-50% of deadline, Flow emits sla.warning and the Follow-Up Scheduler preempts to schedule the next available business-hours slot. At T-0 (deadline reached without contact), Flow emits sla.breached and escalates to the user. If breach rate exceeds 15% in trailing 24h for a campaign, Flow auto-pauses new outreach composition for that campaign to prevent compounding. Current platform SLA compliance is 94% (target > 90%).',
    },
    {
      question: 'How does Flow sync with HubSpot and Salesforce?',
      answer:
        'Flow bidirectionally syncs stage transitions and activities with both CRMs. Outbound: on every stage transition, Flow writes hubspot.deal_stage_update and salesforce.opportunity_stage_update within 5 seconds. Inbound: Flow subscribes to CRM webhooks for deal_status_changed and contact_property_updated. Sync is idempotent with dedup_key = lead_id + transition_ts + action_type. When Flow and CRM disagree (conflict), Flow is the source of truth — last-writer-wins by timestamp, and the conflict is logged to the crm_conflicts table with the resolution applied and rationale. CRM conflict rate is currently 0.4% (target < 1%).',
    },
    {
      question: 'What is the pipeline health score?',
      answer:
        'The pipeline health score is a 0-100 weighted blend of 5 sub-metrics: pipeline velocity (25%, target < 21 days, current 14), stage conversion rate (25%, target > 25%, current 35%), SLA compliance (20%, target > 90%, current 94%), bottleneck severity (15%, lower is better), and nurture reactivation rate (15%, target > 8%, current 12%). The score is recomputed every 60 seconds and a health.score.changed SSE event fires whenever the score moves by ≥ 2 points so the UI dashboard updates in real time. Current platform health score is 87/100 (target > 75).',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Lead stage transition query',
      useCase: 'Operator asks why a lead is in its current stage.',
      template: `Explain the stage history of lead {{leadId}}.

Detail level: {{detail | "summary" | "full" | "audit"}}
Include: prior stages, transition triggers, timestamps, and decision rationale.

Return the ordered transition chain. If the lead is in a backward transition (Engaged→Contacted or Nurture→Contacted), explain the trigger that justified it.`,
      variables: ['leadId', 'detail'],
    },
    {
      name: 'Pipeline health query',
      useCase: 'Operator asks about the current health of the pipeline.',
      template: `Report pipeline health.

Scope: {{scope | "workspace" | "campaign"}}
Campaign ID: {{campaignId | "all"}}
Window: {{window | "now" | "last_7d" | "last_30d"}}

Return: pipeline velocity, stage conversion rate, SLA compliance, bottleneck severity, nurture reactivation rate, and the weighted health score. Flag any sub-metric below target.`,
      variables: ['scope', 'campaignId', 'window'],
    },
    {
      name: 'Bottleneck investigation',
      useCase: 'Operator asks which stages have bottlenecks and how to resolve them.',
      template: `Investigate bottlenecks.

Campaign ID: {{campaignId | "all"}}
Severity threshold: {{severity | "1.5x" | "2x" | "3x"}}
Action: {{action | "report_only" | "auto_remediate"}}

For each detected bottleneck, return: stage, current median time-in-stage, baseline median, ratio, affected lead count, recommended remediation (re-score / re-enrich / move to nurture). If action=auto_remediate, invoke the recommended remediation for each affected lead.`,
      variables: ['campaignId', 'severity', 'action'],
    },
    {
      name: 'SLA breach review',
      useCase: 'Operator asks which leads have breached SLA in the last 24 hours.',
      template: `Review SLA breaches.

Window: {{window | "last_24h" | "last_7d"}}
Tier filter: {{tier | "A" | "B" | "C" | "all"}}
Campaign ID: {{campaignId | "all"}}

Return: lead_id, tier, qualification_ts, deadline, missed_by, current stage, recommended next action. Sort by missed_by descending.`,
      variables: ['window', 'tier', 'campaignId'],
    },
    {
      name: 'Nurture reactivation report',
      useCase: 'Operator asks how nurture campaigns are performing.',
      template: `Report nurture performance.

Campaign ID: {{campaignId | "all"}}
Window: {{window | "last_30d" | "last_90d"}}

Return: total nurtured leads, reactivation rate, per-cadence-step reactivation (Day 30 / 60 / 90), average days-to-reactivation, top-reactivating industries, and content library gaps (industries with no matching asset).`,
      variables: ['campaignId', 'window'],
    },
    {
      name: 'CRM sync conflict review',
      useCase: 'Operator asks about CRM sync conflicts and how they were resolved.',
      template: `Review CRM sync conflicts.

CRM: {{crm | "hubspot" | "salesforce" | "all"}}
Window: {{window | "last_24h" | "last_7d"}}

Return: conflict_id, lead_id, flow_stage, crm_stage, flow_ts, crm_ts, resolution_applied, rationale. Highlight any conflicts where the resolution favored CRM over Flow.`,
      variables: ['crm', 'window'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'Stage Transition Engine',
      scenario: 'Outreach Composer fires outreach.sent event; Flow transitions the lead Qualified → Contacted.',
      request: `{
  "lead_id": "l_8842",
  "prior_stage": "Qualified",
  "new_stage": "Contacted",
  "trigger_event_id": "evt_4f2a",
  "trigger_payload": {
    "event_type": "outreach.sent",
    "message_id": "msg_7711",
    "channel": "email",
    "verified": true
  },
  "trace_id": "tr_4f2a"
}`,
      response: `{
  "transition_id": "tr_9912",
  "seq": 48213,
  "lead_id": "l_8842",
  "prior_stage": "Qualified",
  "new_stage": "Contacted",
  "trigger_event_id": "evt_4f2a",
  "ts": "2026-09-08T14:23:00Z",
  "logged": true,
  "audit_id": "aud_8842",
  "crm_sync_queued": true,
  "crm_sync_targets": ["hubspot", "salesforce"],
  "next_action": {
    "channel": "email",
    "message_type": "follow_up_2",
    "send_at": "2026-09-10T14:00:00Z"
  }
}`,
      notes: 'The trigger_payload.verified=true is mandatory; a soft bounce (verified=false) would have been rejected by the validation gate and the transition would not fire.',
    },
    {
      tool: 'Follow-Up Scheduler',
      scenario: 'Flow schedules the next follow-up for a B-list lead in Contacted stage, with SLA deadline approaching.',
      request: `{
  "lead_id": "l_8843",
  "channel": "email",
  "sla_tier": "B",
  "qualification_ts": "2026-09-08T13:00:00Z",
  "sla_deadline": "2026-09-08T14:00:00Z",
  "now": "2026-09-08T13:42:00Z",
  "prospect_timezone": "America/New_York",
  "engagement_history": [
    { "channel": "email", "opened_at": "2026-09-01T13:47:00Z" }
  ],
  "optimal_window": { "channel": "email", "dow": "tue-thu", "hour_start": 9, "hour_end": 11 }
}`,
      response: `{
  "scheduled_task_id": "st_7712",
  "lead_id": "l_8843",
  "channel": "email",
  "message_type": "follow_up_2",
  "send_at": "2026-09-08T13:55:00Z",
  "reasoning": "sla_warning_preempt",
  "sla_remaining_ms": 1080000,
  "engagement_history_bias": "opened_at_8:47am_local",
  "mutex_acquired": true,
  "mutex_hold_ms": 60000,
  "audit_id": "aud_8843"
}`,
      notes: 'Because SLA deadline is in 18 minutes (T-30%, beyond the T-50% warning threshold), the scheduler preempts the optimal window and schedules immediately within business hours. The engagement history bias (8:47am open) is overridden because the SLA forces a same-day send.',
    },
    {
      tool: 'Nurture Campaign Manager',
      scenario: 'Lead enters Nurture; Flow designs the 30/60/90 day cadence and schedules the Day 30 send.',
      request: `{
  "lead_id": "l_8844",
  "industry": "fintech",
  "company_size_bucket": "200-500",
  "nurture_entered_at": "2026-08-09T10:00:00Z",
  "prospect_timezone": "America/Los_Angeles"
}`,
      response: `{
  "sequence_id": "ns_4123",
  "lead_id": "l_8844",
  "cadence": [
    {
      "day": 30,
      "asset_id": "asset_412",
      "asset_title": "The State of FinTech 2026",
      "send_at": "2026-09-08T17:00:00Z",
      "matched_score": 0.91
    },
    {
      "day": 60,
      "asset_id": "asset_519",
      "asset_title": "How Acme Cut CAC 38% with LeadReach",
      "send_at": "2026-10-08T17:00:00Z",
      "matched_score": 0.88
    },
    {
      "day": 90,
      "asset_id": "asset_77",
      "asset_title": "Check-in: Still the Right Contact?",
      "send_at": "2026-11-07T17:00:00Z",
      "matched_score": 1.0
    }
  ],
  "reactivation_subscription": "outreach.opened|outreach.clicked|outreach.replied filtered by source_channel=nurture",
  "audit_id": "aud_8844"
}`,
      notes: 'The send_at timestamps are 5pm PT because the prospect is in America/Los_Angeles and the scheduler biases toward the engagement history of similar fintech leads in that timezone. The matched_score is the content library taxonomy match; > 0.6 is required.',
    },
    {
      tool: 'SLA Watchdog',
      scenario: 'A-list lead qualification is approaching T-50% of the 5-minute SLA; SLA Watchdog emits sla.warning.',
      request: `{
  "check_mode": "continuous",
  "lead_id": "l_8845",
  "tier": "A",
  "qualification_ts": "2026-09-08T14:18:00Z",
  "sla_seconds": 300,
  "now": "2026-09-08T14:20:30Z"
}`,
      response: `{
  "lead_id": "l_8845",
  "tier": "A",
  "qualification_ts": "2026-09-08T14:18:00Z",
  "deadline": "2026-09-08T14:23:00Z",
  "now": "2026-09-08T14:20:30Z",
  "remaining_ms": 150000,
  "elapsed_pct": 0.50,
  "warning_fired": true,
  "warning_event_id": "evt_w_4f2a",
  "preempt_action": {
    "scheduler_invoked": true,
    "next_slot": "2026-09-08T14:21:00Z",
    "channel": "email",
    "reasoning": "sla_warning_preempt_within_business_hours"
  },
  "breach_fired": false,
  "audit_id": "aud_8845"
}`,
      notes: 'T-50% preempt triggers the Follow-Up Scheduler to immediately schedule the next available business-hours slot rather than waiting for the optimal Tue-Thu 9am-11am window.',
    },
  ],

  examples: [
    {
      scenario: 'Standard forward transition — Outreach Composer fires outreach.sent, Flow transitions lead Qualified → Contacted and schedules the next follow-up.',
      input: `Event received: {"event":"outreach.sent","lead_id":"l_8842","message_id":"msg_7711","channel":"email","verified":true,"ts":"2026-09-08T14:23:00Z"}`,
      reasoning: `The event matches the outreach.sent trigger. Validation gate: message_id is present and verified=true (not a soft bounce). Prior stage is Qualified (correct precondition). Acquire per-lead mutex (60s hold). Log transition to lead_stage_transitions with seq 48213. Emit lead.transitioned event. CRM sync queued for HubSpot and Salesforce. Compute next follow-up: prospect is in America/New_York, optimal email window is Tue-Thu 9am-11am local, today is Mon Sep 8 so defer to Tue Sep 9 10am. SLA tier is B (1hr), deadline is 14:18+1h=15:18, plenty of margin. Schedule follow_up_2 for Tue Sep 9 10am. Release mutex.`,
      output: `{
  "transition": {
    "transition_id": "tr_9912",
    "lead_id": "l_8842",
    "prior_stage": "Qualified",
    "new_stage": "Contacted",
    "trigger_event_id": "evt_4f2a",
    "triggered_at": "2026-09-08T14:23:00Z",
    "seq": 48213
  },
  "next_action": {
    "channel": "email",
    "message_type": "follow_up_2",
    "send_at": "2026-09-09T14:00:00Z",
    "reasoning": "optimal_window_tue_thu_9am_11am_local"
  },
  "crm_sync": {
    "queued": true,
    "targets": ["hubspot", "salesforce"],
    "dedup_key": "l_8842_2026-09-08T14:23:00Z_stage_transition"
  },
  "audit_id": "aud_8842"
}`,
      outcome: 'Transition logged, CRM sync completed in 3.2s, follow-up scheduled for Tue Sep 9 10am ET. Lead moved forward in pipeline.',
    },
    {
      scenario: 'Nurture reactivation — prospect opens the Day 60 case study email; Flow snaps lead back to Contacted and invokes Outreach Composer.',
      input: `Event received: {"event":"outreach.opened","lead_id":"l_8844","source_channel":"nurture","nurture_day":60,"asset_id":"asset_519","opened_at":"2026-10-08T17:02:00Z"}`,
      reasoning: `The event is filtered by source_channel=nurture. The lead is currently in Nurture stage. This matches the reactivation trigger (open signal during nurture). Snap back transition Nurture→Contacted is sanctioned. Acquire per-lead mutex. Log the transition with trigger_event_id, prior_stage=Nurture, new_stage=Contacted, rationale="nurture_reactivation_open_signal". Invoke Outreach Composer with context: lead_id, asset_id (the case study that triggered the open), and a request for a contextual reply referencing the asset. Mark the lead as warm_reactivation_priority=true so the Outreach Composer bumps its queue priority. Track nurture_day=60 for per-cadence reactivation reporting.`,
      output: `{
  "snap_back_transition": {
    "transition_id": "tr_9920",
    "lead_id": "l_8844",
    "prior_stage": "Nurture",
    "new_stage": "Contacted",
    "trigger_event_id": "evt_open_4f2a",
    "triggered_at": "2026-10-08T17:02:01Z",
    "rationale": "nurture_reactivation_open_signal"
  },
  "outreach_composer_invocation": {
    "invoked": true,
    "priority": "warm_reactivation",
    "context": {
      "lead_id": "l_8844",
      "trigger_asset_id": "asset_519",
      "trigger_asset_title": "How Acme Cut CAC 38% with LeadReach",
      "nurture_day": 60,
      "request": "Draft a contextual reply referencing the case study the prospect just opened."
    }
  },
  "metrics_tracked": {
    "reactivation_signal_type": "opened",
    "nurture_day": 60,
    "time_to_reactivation_days": 60
  },
  "audit_id": "aud_8844"
}`,
      outcome: 'Lead snapped back to Contacted in 1.4s. Outreach Composer drafted a contextual reply within 12s. Lead is now in active outreach thread; 30-day snapshot shows this lead eventually booked a meeting.',
    },
    {
      scenario: 'SLA breach on A-list lead — qualification was 6 minutes ago, SLA is 5 minutes, no contact has been made; Flow emits sla.breached and auto-pauses new outreach for the campaign.',
      input: `SLA watchdog tick: {"lead_id":"l_8845","tier":"A","qualification_ts":"2026-09-08T14:18:00Z","sla_seconds":300,"now":"2026-09-08T14:24:00Z","contact_made":false}`,
      reasoning: `Elapsed = 6 min = 360s. SLA = 300s. T-0 reached with contact_made=false. Emit sla.breached. Compute missed_by = 60s. Check campaign breach rate over trailing 24h: campaign c_412 had 18 leads qualified, 4 breached = 22.2%, which exceeds the 15% auto-pause threshold. Auto-pause new outreach composition for c_412. Escalate to user with lead_id, tier, missed_by, breach rate, and recommended next actions.`,
      output: `{
  "sla_event": {
    "type": "sla.breached",
    "lead_id": "l_8845",
    "tier": "A",
    "qualification_ts": "2026-09-08T14:18:00Z",
    "deadline": "2026-09-08T14:23:00Z",
    "breached_at": "2026-09-08T14:23:00Z",
    "missed_by_ms": 60000,
    "campaign_id": "c_412"
  },
  "auto_pause": {
    "campaign_id": "c_412",
    "triggered": true,
    "reason": "breach_rate_22.2_pct_exceeds_15_pct_threshold",
    "window": "last_24h",
    "qualified_count": 18,
    "breached_count": 4,
    "paused_at": "2026-09-08T14:24:00Z"
  },
  "user_escalation": {
    "delivered": true,
    "message": "Lead l_8845 (A-list) breached SLA by 60 seconds. Campaign c_412 breach rate is 22.2% in trailing 24h (threshold 15%). New outreach composition auto-paused. Recommended actions: (1) Manually contact l_8845 immediately. (2) Review campaign c_412 capacity — consider scaling Outreach Composer concurrency. (3) Audit A-list lead qualification flow for upstream delays."
  },
  "audit_id": "aud_8845"
}`,
      outcome: 'User was paged within 8 seconds. Lead was manually contacted within 4 minutes of escalation. Campaign c_412 outreach composition paused for 45 minutes while the team scaled Outreach Composer concurrency from 3 to 6.',
    },
  ],

  guardrails: [
    {
      rule: 'Never skip a stage. The only valid transitions are the documented forward transitions and the two sanctioned backward transitions (Engaged→Contacted after 7d silence, Nurture→Contacted on reactivation).',
      rationale: 'Skipping stages breaks downstream agent expectations (e.g. Bard expects Qualified leads to have score ≥ 50) and corrupts pipeline analytics.',
      enforcement: 'The Stage Transition Engine validates the (prior_stage, new_stage) pair against a legal-transitions table; illegal pairs are rejected with transition.illegal event.',
      severity: 'block',
    },
    {
      rule: 'Never miss an SLA without first emitting sla.warning at T-50% and sla.breached at T-0.',
      rationale: 'Silent SLA breaches erode user trust and prevent timely intervention; warnings give operators a chance to preempt.',
      enforcement: 'SLA Watchdog runs a per-second check; the warning and breach events are emitted deterministically based on elapsed_pct thresholds (0.5 and 1.0).',
      severity: 'block',
    },
    {
      rule: 'Never send a nurture or follow-up message outside the prospect\'s local business hours (9am-6pm) unless SLA deadline forces it.',
      rationale: 'Off-hours sends have 3x lower open rates and 5x higher unsubscribe rates; they damage deliverability and brand perception.',
      enforcement: 'Follow-Up Scheduler hard-blocks sends outside business hours; the only override path is an SLA-warning preempt that logs the override reason in the audit trail.',
      severity: 'block',
    },
    {
      rule: 'Never overwrite a lead\'s stage from the CRM side without logging the conflict and applying last-writer-wins by ts.',
      rationale: 'Silent CRM overwrites create divergence between Flow and CRM that compounds over time and breaks analytics.',
      enforcement: 'CRM Sync inbound handler compares the CRM event ts to the Flow-side transition ts; conflicts are logged to crm_conflicts and resolved by last-writer-wins.',
      severity: 'block',
    },
    {
      rule: 'Never schedule two simultaneous touchpoints on the same lead across channels (60s mutex per lead_id).',
      rationale: 'Simultaneous multi-channel sends feel spammy to the prospect and increase unsubscribe risk.',
      enforcement: 'Follow-Up Scheduler acquires a per-lead_id mutex (60s hold) before scheduling; concurrent attempts block until the mutex is released or expires.',
      severity: 'block',
    },
    {
      rule: 'Always log every stage transition with the 6 mandatory audit fields (timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id).',
      rationale: 'Missing audit fields break compliance reporting and prevent "explain this stage" queries.',
      enforcement: 'Stage Transition Engine validates the 6 fields before committing; missing fields cause the transition to be rejected and logged as transition.audit_incomplete.',
      severity: 'block',
    },
    {
      rule: 'Always invoke Outreach Composer within 30 seconds of a nurture reactivation signal (open/click/reply).',
      rationale: 'Delayed contextual replies after a nurture reactivation lose the moment of prospect intent; the open rate of a follow-up email drops 60% if sent > 30s after the triggering open.',
      enforcement: 'Lead Reactivation Engine invokes Outreach Composer synchronously; if the composer is saturated, the lead is added to a warm_reactivation priority queue that bypasses normal queueing.',
      severity: 'warn',
    },
    {
      rule: 'Always publish health.score.changed SSE when the pipeline health score moves by ≥ 2 points.',
      rationale: 'UI dashboard stale state misleads operators about pipeline health.',
      enforcement: 'Pipeline Health Monitor compares the new score to the last published score; if delta ≥ 2, it emits the SSE event before returning from the compute cycle.',
      severity: 'warn',
    },
    {
      rule: 'Always auto-pause new outreach composition for a campaign if SLA breach rate exceeds 15% in trailing 24h.',
      rationale: 'Continuing to pour new outreach into a campaign with high breach rate compounds the problem; pause gives the team time to remediate.',
      enforcement: 'SLA Watchdog computes breach rate per campaign every 60s; when threshold exceeded, it sets campaign.outreach_paused=true which the Orchestrator checks before dispatching new outreach composition tasks.',
      severity: 'block',
    },
  ],

  decisionMatrix: [
    {
      condition: 'Inbound event matches a deterministic trigger (e.g. outreach.sent with verified message_id).',
      action: 'Execute the corresponding stage transition immediately. Log to lead_stage_transitions with the 6 audit fields. Emit lead.transitioned event.',
      rationale: 'Triggers are deterministic by design; immediate execution preserves pipeline velocity.',
      example: 'outreach.sent for lead l_8842 fires → Qualified → Contacted transition logged at 2026-09-08T14:23:00Z; CRM sync queued for HubSpot and Salesforce.',
    },
    {
      condition: 'Two triggers fire simultaneously on the same lead.',
      action: 'Apply the higher-priority trigger: deal.won > deal.lost > prospect.replied > meeting.booked > outreach.sent > score_changed > enrichment_complete.',
      rationale: 'Deterministic priority ordering prevents race conditions and ensures consistent outcomes.',
      example: 'deal.won and prospect.replied both fire on lead l_8842 — deal.won wins; transition is Negotiating → Closed Won; the prospect.replied event is logged but does not trigger a transition.',
    },
    {
      condition: 'Stage\'s current median time-in-stage exceeds 1.5x baseline.',
      action: 'Emit bottleneck.detected with affected lead list. Tiered remediation: 1.5x-2x → re-score (Judge); 2x-3x → re-enrich (Forge); >3x → move to Nurture.',
      rationale: 'Tiered remediation matches intervention intensity to bottleneck severity; mild bottlenecks need fresh signal, severe ones need full restart.',
      example: 'Campaign c_412 Engaged stage at 9.2 days median vs 4.1 days baseline (2.24x) → re-enrich invoked for affected leads [l_8842, l_8843, l_8845].',
    },
    {
      condition: 'A-list lead qualification elapsed time reaches T-50% (2.5 minutes).',
      action: 'Emit sla.warning. Follow-Up Scheduler preempts and schedules the next available business-hours slot regardless of optimal window.',
      rationale: 'T-50% preempt gives the scheduler enough runway to land the contact before T-0.',
      example: 'A-list lead l_8845 qualified at 14:18:00; at 14:20:30 (T-50%) sla.warning fires; next slot scheduled for 14:21:00 via email.',
    },
    {
      condition: 'SLA deadline reached (T-0) without contact.',
      action: 'Emit sla.breached, escalate to user with lead_id, tier, missed_by, recommended next actions. If campaign breach rate > 15% in 24h, auto-pause new outreach composition.',
      rationale: 'Breaches need immediate human attention; auto-pause prevents compounding the problem.',
      example: 'Lead l_8845 A-list breached by 60s; campaign c_412 breach rate 22.2% > 15% threshold; outreach composition paused at 14:24:00.',
    },
    {
      condition: 'Nurture lead opens, clicks, or replies to a nurture send.',
      action: 'Immediately snap back to Contacted. Invoke Outreach Composer with context (asset that triggered engagement) within 30 seconds. Mark as warm_reactivation_priority.',
      rationale: 'Engagement signals indicate reactivated intent; the contextual reply must land within the prospect\'s attention window.',
      example: 'Lead l_8844 opened Day 60 case study at 17:02:00 → snap-back transition logged at 17:02:01 → Outreach Composer drafted contextual reply by 17:02:13.',
    },
    {
      condition: 'CRM inbound webhook event ts is older than Flow-side transition ts.',
      action: 'Log conflict to crm_conflicts table. Apply last-writer-wins (Flow wins). Do not apply the CRM change to Flow state. Optionally re-sync Flow state to CRM.',
      rationale: 'Flow is source of truth; CRM inbound events that predate Flow-side mutations are stale and should not regress Flow state.',
      example: 'HubSpot webhook says dealstage=qualified at 14:00:00; Flow-side transition to Contacted at 14:23:00 — conflict logged, Flow wins, HubSpot re-synced to Contacted.',
    },
    {
      condition: 'Per-lead mutex cannot be acquired (concurrent transition in flight).',
      action: 'Retry up to 3 times with 100ms backoff. On persistent failure, log transition.blocked and queue the transition for retry after mutex release.',
      rationale: 'Concurrent transitions on the same lead produce inconsistent state; mutex prevents this without blocking throughput.',
      example: 'Lead l_8842 transition attempt at 14:23:00 blocked because prior mutex held since 14:22:55 → retried at 14:23:00.1, succeeded.',
    },
  ],

  failureModes: [
    {
      failure: 'Stage Transition Engine crash mid-transition.',
      detection: 'Heartbeat loss detected by supervisor within 5s; in-flight transition marked "pending" in Postgres.',
      mitigation: 'Supervisor restarts the engine from the latest checkpoint (≤30s old). The "pending" transition is re-issued (idempotent due to dedup_key). Per-lead mutexes are force-released on restart.',
      recoveryTime: '< 10s typical, < 30s worst-case',
    },
    {
      failure: 'SLA Watchdog timer service crash.',
      detection: 'Heartbeat loss; SLA timer queue stops draining.',
      mitigation: 'SLA deadlines are persisted to Postgres (lead_id → qualification_ts, tier, deadline). On restart, the watchdog rebuilds its in-memory index from Postgres and resumes per-second checks. No SLA is lost.',
      recoveryTime: '< 15s; no SLA deadlines missed due to crash (persisted).',
    },
    {
      failure: 'Follow-Up Scheduler timezone resolution failure (missing HQ city in enrichment data).',
      detection: 'Scheduler returns tz_resolution_failed for the lead.',
      mitigation: 'Fall back to campaign_default_timezone (default America/New_York). Log data_quality.warning with lead_id and missing field. Trigger Forge re-enrichment for the lead to fill the timezone field.',
      recoveryTime: 'Immediate (decision is local); re-enrichment completes within 60s.',
    },
    {
      failure: 'CRM API 5xx or timeout (HubSpot or Salesforce).',
      detection: 'API returns 5xx or connection times out after 5s.',
      mitigation: 'Retry up to 3 times with exponential backoff base 2s, max jitter ±20%. On persistent failure, queue the sync to crm_sync_queue and alert. Queued syncs flush when CRM recovers.',
      recoveryTime: '< 5 minutes typical (transient); if CRM is down > 30 min, queued syncs drain within 5 min of CRM recovery.',
    },
    {
      failure: 'Bottleneck detector computes insufficient baseline data (< 30 leads in stage for campaign).',
      detection: 'Baseline median computation returns n < 30.',
      mitigation: 'Suppress bottleneck detection for that (campaign, stage) pair. Log bottleneck.insufficient_data. Resume detection once n ≥ 30.',
      recoveryTime: 'No user impact; detection resumes when sufficient data accumulates.',
    },
    {
      failure: 'Nurture send fails (content library miss or asset fetch error).',
      detection: 'Nurture Campaign Manager returns content_library.gap or asset_fetch_failed.',
      mitigation: 'Fall back to a generic asset (industry-agnostic) for the cadence step. Log content_library.gap for content team review. Continue the cadence — do not block the sequence.',
      recoveryTime: 'Immediate (fallback is local); content team reviews gap within 24h.',
    },
    {
      failure: 'Audit logger write fails (Postgres unavailable).',
      detection: 'Audit logger returns error within 5s.',
      mitigation: 'Switch to in-memory buffer; flush when Postgres recovers. No events are lost. SEV-2 alert fired.',
      recoveryTime: 'No user-visible impact; flush completes within 60s of Postgres recovery.',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_flow_001',
      input: 'Event: {"event":"outreach.sent","lead_id":"l_9001","message_id":"msg_9001","channel":"email","verified":true}. Lead l_9001 is currently in Qualified stage.',
      expectedOutput: 'Transition Qualified → Contacted. Audit log entry with 6 mandatory fields. CRM sync queued. Next follow-up scheduled within business hours.',
      scoringCriteria: [
        'Transition logged with prior_stage=Qualified, new_stage=Contacted.',
        'Audit entry contains all 6 mandatory fields (timestamp, lead_id, prior_stage, new_stage, trigger_event_id, decision_rationale, trace_id).',
        'CRM sync queued for both HubSpot and Salesforce.',
        'Next follow-up scheduled within prospect\'s business hours (9am-6pm local).',
        'dedup_key generated (lead_id + transition_ts + action_type).',
      ],
      passThreshold: 5,
    },
    {
      id: 'eval_flow_002',
      input: 'A-list lead qualified at 14:18:00. SLA = 5 minutes. Current time = 14:24:00. No contact has been made.',
      expectedOutput: 'sla.breached event emitted. User escalated with lead_id, tier, missed_by (60s), recommended actions. If campaign breach rate > 15% in 24h, auto-pause new outreach.',
      scoringCriteria: [
        'sla.breached event emitted with correct lead_id and tier.',
        'missed_by_ms computed correctly (60000 ms).',
        'User escalation delivered with lead_id, tier, missed_by, recommended next actions.',
        'Campaign breach rate checked against 15% threshold.',
        'If breach rate > 15%, campaign.outreach_paused set to true.',
        'Audit log entry created.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_flow_003',
      input: 'Nurture lead l_9002 (in Nurture stage) opens the Day 60 case study email at 17:02:00. Event: {"event":"outreach.opened","lead_id":"l_9002","source_channel":"nurture","nurture_day":60,"asset_id":"asset_519"}.',
      expectedOutput: 'Snap-back transition Nurture → Contacted logged within 5s. Outreach Composer invoked with asset context within 30s. Lead marked warm_reactivation_priority=true.',
      scoringCriteria: [
        'Snap-back transition logged with prior_stage=Nurture, new_stage=Contacted.',
        'Transition rationale = "nurture_reactivation_open_signal".',
        'Outreach Composer invoked within 30s of the open event.',
        'Outreach Composer context includes trigger_asset_id and nurture_day.',
        'Lead marked warm_reactivation_priority=true.',
        'Metrics tracked: reactivation_signal_type=opened, nurture_day=60.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_flow_004',
      input: 'Campaign c_412 Engaged stage has 18 leads with median time-in-stage 9.2 days. Baseline (trailing 30d) median is 4.1 days. Ratio = 2.24x.',
      expectedOutput: 'bottleneck.detected event emitted with campaign_id, stage, current_median, baseline_median, ratio, affected_leads, recommended_action=re_enrich.',
      scoringCriteria: [
        'bottleneck.detected event emitted within 60s of crossing threshold.',
        'Event payload includes campaign_id, stage, current_median_days (9.2), baseline_median_days (4.1), ratio (2.24).',
        'affected_leads list populated with the 18 lead_ids in Engaged stage.',
        'recommended_action = "re_enrich" (since ratio is in 2x-3x tier).',
        'Audit log entry created with decision_rationale.',
        'If action=auto_remediate, Forge invoked for each affected lead.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_flow_005',
      input: 'CRM inbound webhook: HubSpot reports dealstage=closed_lost for lead l_9003 at 14:00:00. Flow-side transition Negotiating → Closed Lost occurred at 14:23:00 (later than CRM).',
      expectedOutput: 'Conflict detected (Flow ts > CRM ts). Last-writer-wins (Flow wins). Conflict logged to crm_conflicts table. HubSpot re-synced to match Flow state (Closed Lost at 14:23:00).',
      scoringCriteria: [
        'Conflict detected (Flow ts 14:23:00 > CRM ts 14:00:00).',
        'Last-writer-wins applied: Flow state preserved.',
        'Conflict logged to crm_conflicts table with lead_id, flow_stage, crm_stage, flow_ts, crm_ts, resolution_applied.',
        'HubSpot re-synced to match Flow state.',
        'Audit log entry created.',
      ],
      passThreshold: 5,
    },
  ],
};
