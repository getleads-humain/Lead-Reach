import type { AgentDetailFull } from './types';

export const outreachComposerDetail: AgentDetailFull = {
  slug: 'outreach-composer',
  name: 'outreach-composer',
  displayName: 'Outreach Composer (Bard)',
  tagline: 'Crafts hyper-personalized messages that get 3x higher reply rates',
  description: 'Crafts personalized outreach messages and multi-step sequences',
  longDescription:
    'The Outreach Composer agent — codenamed Bard — creates hyper-personalized messages for each qualified lead. Unlike template-based tools that merge {{first_name}} into generic copy, Bard analyzes the lead\'s enriched profile (60+ fields), Sage\'s strategic insights, recent trigger events, and the prospect\'s digital footprint to craft messages that reference specific, verifiable details about each prospect. Each message embeds 5-10 personalization points drawn from the lead\'s recent blog post, their company\'s Series B funding, their technology stack choice, a shared connection, or a quoted conference talk. Bard designs 7-touchpoint sequences across email, LinkedIn, and phone on a 14-day cadence (A-list leads with score 85+ get a faster 7-day cadence), with engagement-adaptive follow-ups that adjust messaging based on whether the prospect opened, clicked, replied, or went silent. A built-in A/B test manager generates 2-3 variants per lead and feeds winning patterns back into the template library. Bard integrates with Outreach.io, SalesLoft, HubSpot, and Apollo to push sequences into the sales execution layer and synchronizes engagement signals back into the LeadReach profile in real time.',
  color: '#EC4899',
  iconName: 'Mail',
  department: 'Growth',
  pipelineRole: 'Personalized message composition and sequence design',
  pipelinePosition: 6,

  capabilities: [
    {
      name: 'Hyper-Personalization Engine',
      description:
        'Analyzes 60+ enriched fields, strategic insights from Sage, trigger events, and the prospect\'s digital footprint to extract 5-10 verifiable personalization points per lead. Each message references at least 5 specific, checkable facts — never a generic {{first_name}} merge.',
      metric: '5-10 personalization points / lead',
      details: [
        'Personalization points are categorized into 7 types: role/tenure, company event, technology choice, content published, shared connection, mutual interest, stated challenge.',
        'Each point carries a source citation (enrichment field, Sage insight ID, news URL, LinkedIn post URL) so claims can be verified before send.',
        'A validator pass rejects any drafted message whose personalization points drop below 5 or whose claims cannot be traced to a source.',
        'Personalization point extraction latency: 2-5 seconds per lead; results are cached on the lead profile for re-use across the sequence.',
      ],
    },
    {
      name: '7-Touchpoint Sequence Design',
      description:
        'Designs a 14-day, 7-touchpoint sequence across email, LinkedIn, and phone. Each touchpoint adds new value rather than echoing "just following up". A-list leads (score 85+) get a compressed 7-day cadence with the same 7 touchpoints.',
      metric: '7 touchpoints / 14 days',
      details: [
        'Standard cadence: Day 1 Email #1 (intro + value prop), Day 3 LinkedIn connect, Day 5 Email #2 (case study), Day 7 LinkedIn message, Day 9 Phone #1 (with voicemail), Day 11 Email #3 (different angle), Day 14 Breakup email.',
        'A-list cadence: Day 1 Email #1 + LinkedIn connect, Day 2 Phone #1, Day 3 Email #2, Day 4 LinkedIn message, Day 5 Phone #2, Day 6 Email #3, Day 7 Breakup email.',
        'Each touchpoint has a defined goal, channel, format constraint, and personalization anchor; the sequence is assembled atomically and persisted as a single record.',
        'Cadence timing respects prospect timezone (send at 9:30am local), working days (skip weekends by default), and known OOO periods from the prospect\'s calendar.',
      ],
    },
    {
      name: 'Channel-Specific Formatting',
      description:
        'Formats each message for the target channel: email (≤150 words, single clear CTA, plain-text preferred), LinkedIn (≤200 chars for connection requests, ≤300 chars for InMail), phone (30-second script + 15-second voicemail).',
      metric: '3 channels',
      details: [
        'Email format: subject line ≤60 chars, body ≤150 words, one CTA (book 15 min, reply yes/no, or open to a quick call). HTML stripped to plain text for deliverability.',
        'LinkedIn format: connection request note ≤200 chars (no links allowed), InMail ≤1900 chars but optimized for first 200 chars (preview), no attachments on first touch.',
        'Phone format: 30-second opener script (intro → reason → value → ask), 15-second voicemail script (name → reason → callback number → soft CTA).',
        'Each channel\'s format constraints are enforced by a formatter pass that truncates, rewrites, or rejects drafts that violate the constraint.',
      ],
    },
    {
      name: 'Engagement-Adaptive Follow-ups',
      description:
        'Adjusts follow-up messaging based on the prospect\'s engagement signal: opened-but-no-reply → reference the content they viewed; replied-positive → book a meeting; replied-negative → polite acknowledge and ask to follow up in 3-6 months; silent → breakup email.',
      metric: '4 response paths',
      details: [
        'Opened-no-reply: next touch references the specific subject line they opened and offers a different angle (case study, benchmark, peer company result).',
        'Replied-positive: trigger a meeting-booking flow immediately — propose 2 specific time slots within 48 hours, send a calendar invite on confirmation.',
        'Replied-negative: send a one-line acknowledgement, ask for permission to follow up in 3-6 months, move lead to nurture.',
        'Silent (no open, no click across 4 touches): send the breakup email on Day 14. Historically produces the highest single-touch reply rate (4-6% on the breakup alone).',
      ],
    },
    {
      name: 'A/B Variant Generation',
      description:
        'Generates 2-3 message variants per lead for A/B testing. Variants differ in opener angle (insight-led, peer-led, question-led), CTA type (meeting, reply, resource), and tone (consultative, direct, story-driven). Tracks which variant wins and feeds the pattern back into the template library.',
      metric: '2-3 variants / lead',
      details: [
        'Variant A (control): lead-with-insight opener, meeting CTA, consultative tone. This is the default baseline.',
        'Variant B (challenger): peer-comparison opener ({{peer_company}} reduced {{metric}} by {{amount}}), reply CTA, direct tone.',
        'Variant C (optional): question-led opener, resource CTA (send a teardown / benchmark), story-driven tone.',
        'Winning variant is determined by reply rate; after 30 sends per persona, the winner is promoted to the template library and losers are retired.',
      ],
    },
    {
      name: 'Breakup Email Composer',
      description:
        'Crafts the final "I\'ll stop bugging you" message that consistently produces the highest single-touch reply rate across the sequence. Acknowledges they\'re busy, gives a clean out, leaves the door open, and references one piece of value delivered earlier.',
      metric: 'Highest reply rate',
      details: [
        'Breakup template structure: 4 sentences — (1) acknowledge their busyness, (2) close the loop, (3) leave one specific value on the table, (4) soft permission to reconnect in a quarter.',
        'Tone: warm, not guilt-tripping. No "per my last email", no "just checking in".',
        'References one specific value already delivered (e.g. "the {{teardown_title}} I sent on Day 5") to remind them of the relationship established.',
        'Subject line variants tested: "Closing the loop", "Should I close your file?", "Gentle close-out".',
      ],
    },
    {
      name: 'Trigger-Event Anchoring',
      description:
        'Anchors the first touch to a recent trigger event (funding round, executive hire, product launch, M&A activity, regulatory change, earnings beat) detected by Sage. Trigger-anchored messages produce 2.3x higher reply rates than generic outreach.',
      metric: '2.3x reply uplift',
      details: [
        'Pulls trigger events from Sage\'s insight store, filters to events in the last 90 days, prioritizes events in the last 14 days for freshness.',
        'Each trigger event is mapped to a message angle: funding → scale conversation, executive hire → onboarding conversation, product launch → integration conversation, M&A → integration risk conversation.',
        'If no trigger event exists, falls back to insight-led angle using Sage\'s top strategic insight.',
        'The trigger event citation (headline, source, date) is attached to the message metadata for downstream reply attribution.',
      ],
    },
    {
      name: 'Template Library (50+ templates)',
      description:
        'Maintains a library of 50+ vetted templates organized by persona (CEO, VP Eng, Head of Sales, RevOps, etc.), industry (SaaS, fintech, healthtech, e-commerce), and funnel stage (cold, warm, re-engagement, breakup). Used as scaffolding, never sent as-is.',
      metric: '50+ templates',
      details: [
        'Templates are starting points, not final copy — every send is personalized with 5+ verifiable lead-specific details before delivery.',
        'Library is organized into a 3-dimensional index: persona × industry × stage, yielding 50+ active templates with a target of 200+.',
        'Winning A/B variants are auto-promoted to the library; underperforming templates (reply rate < 2% after 50 sends) are auto-retired.',
        'Templates include channel-specific variants: each template ships with email, LinkedIn, and phone script versions.',
      ],
    },
    {
      name: 'CRM & Sequence Tool Sync',
      description:
        'Pushes composed sequences into Outreach.io, SalesLoft, HubSpot Sequences, and Apollo for execution by the sales team. Bidirectional sync keeps engagement signals flowing back into the lead profile.',
      metric: '4 integrations',
      details: [
        'Push flow: composed sequence → API call to native sequence tool → sequence created with all 7 touchpoints scheduled → confirmation back to LeadReach.',
        'Pull flow: engagement events (open, click, reply) from the sequence tool → webhook into LeadReach → lead profile updated → triggers engagement-adaptive follow-up.',
        'Field mapping: LeadReach lead_id ↔ CRM contact_id, LeadReach campaign_id ↔ CRM sequence_id, LeadReach personalization_points ↔ CRM custom fields.',
        'Dedup: if a prospect is already in an active sequence in the connected tool, Bard refuses to create a duplicate and surfaces the existing sequence.',
      ],
    },
    {
      name: 'Personalization Validator',
      description:
        'Validates that every drafted message contains only claims traceable to a verifiable source (enrichment field, Sage insight, indexed news article, public LinkedIn post). Rejects messages with hallucinated facts before they reach the send queue.',
      metric: '100% claim-traceable',
      details: [
        'Each sentence is parsed; any factual claim (a number, a name, an event) must have a source citation in the message metadata.',
        'Sentences with un-cited claims are flagged; the draft is returned to the composer with a list of unsupported sentences for rewrite.',
        'Common hallucination patterns are detected: invented revenue numbers, fabricated quotes, fake case study results, non-existent product features.',
        'Validator logs every rejection to the audit trail with the offending sentence, the draft ID, and the lead ID for trend analysis.',
      ],
    },
    {
      name: 'Reply Classification & Routing',
      description:
        'Classifies inbound replies (positive, negative, objection, OOO, auto-reply, out-of-scope) using a fine-tuned classifier and routes them to the correct downstream action: meeting booking, objection handling, polite acknowledgement, or nurture.',
      metric: '6 reply classes',
      details: [
        'Positive: "yes", "let\'s chat", "send times" → triggers meeting-booking flow within 30 seconds.',
        'Negative: "not interested", "wrong person" → triggers polite acknowledgement + 3-6 month nurture entry.',
        'Objection: "too expensive", "we use competitor X" → routes to objection-handling playbook (10 pre-written rebuttals).',
        'OOO / auto-reply: parsed for return date; sequence paused until prospect\'s return, then resumed automatically.',
        'Classification confidence < 0.7 routes the reply to human review instead of auto-acting, preventing misclassification damage.',
      ],
    },
    {
      name: 'Deliverability Safeguards',
      description:
        'Enforces deliverability best practices on every composed message: plain-text fallback, no spam-trigger words, balanced image-to-text ratio, threading-safe subject lines, plain ASCII only (no invisible Unicode), unsubscribe link included.',
      metric: '< 0.3% spam rate',
      details: [
        'Banned phrase list: 60+ spam-trigger phrases ("free", "guarantee", "no obligation", "click here", ALL CAPS) — drafts containing them are auto-rewritten.',
        'Subject line scorer: penalizes ALL CAPS, excessive punctuation, spam-trigger words, length > 60 chars. Drafts scoring < 0.6 are re-generated.',
        'Plain-text fallback is always generated even when HTML is used; the multipart/alternative MIME ensures email clients can choose.',
        'Threading: subject lines for follow-ups use the same subject (no "RE:" prefix) so they thread under the original in Gmail/Outlook.',
      ],
    },
  ],

  pipelineStages: [
    {
      stage: 'Lead Profile Ingestion',
      inputs: ['Lead ID from Lead Qualification', 'Enriched lead profile (60+ fields)', 'Sage strategic insights', 'Trigger event feed', 'Campaign settings (cadence, channel mix)'],
      outputs: ['Bard lead context object', 'Personalization source registry'],
      duration: '1-2 seconds',
      substeps: [
        'Receive the lead.dispatched event from the orchestrator with lead_id, campaign_id, and priority.',
        'Load the enriched lead profile from the lead store (60+ fields including role, tenure, tech stack, funding, headcount, ICP fit score).',
        'Load Sage\'s strategic insights for this lead (3-5 insights including trigger events, competitor intel, strategic priorities).',
        'Load the campaign settings: cadence (14-day standard or 7-day A-list), channel mix (email, LinkedIn, phone), language, tone.',
        'Build a personalization source registry: a flat list of every citable fact about the lead, with source type and confidence.',
        'Emit a lead.context_ready event to signal that composition can begin.',
      ],
      errorHandling: 'If the lead profile is missing required fields (name, email, company), emit lead.context_incomplete and surface to the orchestrator for re-enrichment.',
      retryStrategy: 'No retry on missing context; orchestrator decides whether to re-enrich or skip.',
    },
    {
      stage: 'Personalization Point Extraction',
      inputs: ['Bard lead context object', 'Personalization source registry', 'Template library index'],
      outputs: ['Personalization points (5-10 per lead)', 'Message angle recommendation'],
      duration: '2-5 seconds',
      substeps: [
        'Run the personalization extractor over the lead context: identify 5-10 verifiable facts categorized by type (role, event, tech, content, connection, interest, challenge).',
        'Score each personalization point for relevance to the campaign\'s value proposition (high-relevance points are surfaced first in the message).',
        'Select the message angle: trigger-event-led (if a recent trigger exists), insight-led (top Sage insight), peer-comparison-led (peer company result), or question-led.',
        'Match the lead to a template in the library (persona × industry × stage); use it as scaffolding for the composition.',
        'Emit a personalization_points.ready event with the points list and chosen angle.',
      ],
      errorHandling: 'If fewer than 5 personalization points can be extracted, flag the lead for partial-personalization mode and notify the orchestrator; do not block the pipeline.',
      retryStrategy: 'No retry; the extractor is deterministic given the same inputs.',
    },
    {
      stage: 'Message Composition',
      inputs: ['Personalization points', 'Message angle', 'Template scaffold', 'Channel format constraints'],
      outputs: ['Primary message draft (per channel: email, LinkedIn, phone)'],
      duration: '3-8 seconds',
      substeps: [
        'Generate the email body (≤150 words, plain text, single CTA) using the LLM with temperature 0.7 for creative variation.',
        'Generate the LinkedIn connection request note (≤200 chars) — different angle from email to maximize signal across channels.',
        'Generate the phone script (30-second opener + 15-second voicemail) — conversational, no industry jargon.',
        'Embed the personalization points: at least 5 cited facts woven into the message body, not stacked at the top.',
        'Generate the subject line: ≤60 chars, no ALL CAPS, no spam-trigger words, threading-safe for follow-ups.',
        'Pass each draft through the channel-specific formatter to enforce format constraints (truncate or rewrite on violation).',
      ],
      errorHandling: 'If the LLM returns malformed output (no body, missing subject, exceeds word limit), retry with temperature reduced by 0.1 (floor 0.4). Max 2 retries.',
      retryStrategy: '2 retries with patched prompt + temperature reduction; thereafter escalate to fallback model glm-4.5-air.',
    },
    {
      stage: 'Variant Generation (A/B/C)',
      inputs: ['Primary message draft', 'A/B test configuration', 'Variant assignment policy'],
      outputs: ['2-3 message variants per touchpoint', 'Variant metadata for tracking'],
      duration: '2-5 seconds',
      substeps: [
        'Generate Variant B (challenger): different opener angle (peer-comparison), different CTA (reply instead of meeting), different tone (direct).',
        'Optionally generate Variant C (third arm): question-led opener, resource CTA, story-driven tone — included when the lead\'s ICP fit score ≥ 80.',
        'Assign variants to the touchpoint schedule: Variant A for Touch 1, Variant B for Touch 3, Variant C (if any) for Touch 5 — A/B testing across the sequence rather than within a single touch.',
        'Tag each variant with a variant_id (lead_id + touchpoint + arm) so reply attribution can be traced back to the specific variant.',
        'Emit variants.ready with all 2-3 variants and their assignment schedule.',
      ],
      errorHandling: 'If variant generation fails (LLM timeout, malformed output), fall back to the primary draft only; sequence proceeds without A/B test.',
      retryStrategy: '1 retry with reduced temperature; if still failing, skip variant generation for this lead.',
    },
    {
      stage: 'Quality Validation & Compliance Check',
      inputs: ['Composed variants (per channel)', 'Personalization source registry', 'Spam-phrase blocklist', 'Brand voice guidelines'],
      outputs: ['Validated messages', 'Validation report', 'Rejected drafts (if any)'],
      duration: '1-3 seconds',
      substeps: [
        'Run the Personalization Validator: parse each sentence; every factual claim must have a source citation; flag unsupported claims.',
        'Run the spam-phrase scanner: reject messages containing any banned phrase from the 60+ item blocklist.',
        'Run the subject line scorer: penalize ALL CAPS, excessive punctuation, spam-trigger words, length > 60 chars.',
        'Run the brand-voice check: ensure tone matches the configured voice (consultative / direct / story-driven); flag deviations.',
        'If any check fails: return the draft to the composer with a list of issues for rewrite; the draft is held in the validation queue.',
        'On all-checks-pass: mark the variant as validated and route to the sequence assembler.',
      ],
      errorHandling: 'If a draft fails validation 3 times in a row, surface to human review; do not auto-send an unvalidated message.',
      retryStrategy: 'Up to 3 rewrite attempts with patched prompt; thereafter escalate to human review.',
    },
    {
      stage: 'Sequence Assembly & Cadence Scheduling',
      inputs: ['Validated variants per touchpoint', 'Cadence definition (14-day or 7-day)', 'Prospect timezone', 'CRM/sequence tool configuration'],
      outputs: ['Complete 7-touchpoint sequence', 'Scheduled send times', 'Synced CRM sequence ID'],
      duration: '< 2 seconds',
      substeps: [
        'Map each touchpoint to its channel and cadence slot: Day 1 Email #1, Day 3 LinkedIn connect, Day 5 Email #2, Day 7 LinkedIn message, Day 9 Phone #1, Day 11 Email #3, Day 14 Breakup email.',
        'Compute each send time in the prospect\'s local timezone (default 9:30am local); skip weekends; honor known OOO blocks.',
        'Generate the sequence manifest: {lead_id, touchpoint_id, channel, scheduled_send_at, variant_id, content_ref} per touchpoint.',
        'Push the sequence to the configured CRM/sequence tool (Outreach.io, SalesLoft, HubSpot, or Apollo) via API; capture the returned native sequence_id.',
        'Emit sequence.assembled with the manifest and CRM sequence_id; mark the lead as sequence_active in the pipeline.',
        'Subscribe the engagement tracker to the prospect\'s webhook from the sequence tool to capture opens, clicks, replies.',
      ],
      errorHandling: 'If CRM sync fails (API down, auth error), queue the sequence locally and retry sync every 5 minutes; the sequence does not start until sync succeeds.',
      retryStrategy: 'CRM sync retries: up to 5 attempts with 5-minute backoff; thereafter surface to human ops.',
    },
    {
      stage: 'Engagement Tracking & Adaptive Response',
      inputs: ['Webhook events from CRM/sequence tool', 'Reply classifier output', 'Current sequence state'],
      outputs: ['Engagement-adaptive next-touch message', 'Sequence state update', 'Reply attribution'],
      duration: 'Real-time (event-driven)',
      substeps: [
        'Receive engagement events (email.opened, email.clicked, linkedin.accepted, linkedin.replied, phone.completed, email.replied) via webhook.',
        'Classify inbound replies using the reply classifier (positive, negative, objection, OOO, auto-reply, out-of-scope).',
        'Branch on the engagement signal: opened-no-reply → next touch references the viewed content; replied-positive → trigger meeting booking; replied-negative → polite acknowledge + nurture; silent → continue cadence to breakup email.',
        'For meeting-booking triggers: generate 2 specific time slot proposals within 48 hours; send calendar invite on confirmation.',
        'For objection replies: route to the objection-handling playbook; select the matching rebuttal (10 pre-written templates by objection type).',
        'Emit sequence.engagement event with the engagement signal, classification, and chosen next action.',
      ],
      errorHandling: 'If the reply classifier returns confidence < 0.7, route the reply to human review instead of auto-acting; never auto-book a meeting on a low-confidence positive classification.',
      retryStrategy: 'No retry on engagement tracking (event-driven); classifier failures route to human review by default.',
    },
  ],

  knowledgeBase: [
    {
      title: 'Outreach Composition & Personalization SOP',
      category: 'SOP',
      summary:
        'Defines the end-to-end message composition workflow: profile ingestion, personalization point extraction, channel formatting, variant generation, validation, and sequence assembly.',
      sections: 14,
      owner: 'Growth Operations',
      lastReviewed: '2026-09-04',
      version: '3.1.0',
      sectionList: [
        { title: '1. Purpose & Scope', description: 'Defines what "outreach composition" means in LeadReach and which agents touch the workflow (Bard owns composition; Flow owns lifecycle).' },
        { title: '2. Lead Profile Intake', description: 'Required fields (name, email, company, role, ICP fit score) and the SLA for context loading (< 2s).' },
        { title: '3. Personalization Point Extraction', description: 'The 7 categories of personalization points and the minimum-5 rule.' },
        { title: '4. Source Citation Requirements', description: 'Every factual claim in a composed message must trace to a source; the citation format and storage.' },
        { title: '5. Message Angle Selection', description: 'Decision tree for angle selection (trigger-event-led, insight-led, peer-comparison, question-led).' },
        { title: '6. Channel Format Constraints', description: 'Hard constraints per channel: email (150 words, plain text), LinkedIn (200 chars), phone (30s + 15s voicemail).' },
        { title: '7. Subject Line Standards', description: 'Subject line rules: ≤60 chars, no ALL CAPS, no spam triggers, threading-safe.' },
        { title: '8. Variant Generation & A/B Assignment', description: 'How variants A/B/C are generated and assigned across touchpoints.' },
        { title: '9. Validation Pipeline', description: 'The 4 validation passes: personalization, spam-phrase, subject-line score, brand-voice.' },
        { title: '10. Sequence Assembly', description: 'How the 7 touchpoints are mapped to the cadence and scheduled in prospect local time.' },
        { title: '11. CRM Sync Procedure', description: 'How sequences are pushed to Outreach.io/SalesLoft/HubSpot/Apollo; the field mapping and dedup rules.' },
        { title: '12. Engagement Tracking Setup', description: 'How the webhook subscription is established and which events are captured.' },
        { title: '13. Audit Logging Requirements', description: 'Which events must be logged: composition, validation, sync, engagement, reply classification.' },
        { title: '14. Revision History', description: 'Change log across SOP versions, including rationale for major changes.' },
      ],
    },
    {
      title: 'Email Deliverability Crisis Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for handling email deliverability crises: SPF/DKIM/DMARC failures, domain blacklisting, spam complaint spikes, and bounce rate surges. SEV-0 through SEV-3 classification.',
      sections: 13,
      owner: 'Deliverability Engineering',
      lastReviewed: '2026-08-28',
      version: '2.4.0',
      sectionList: [
        { title: '1. Crisis Classification', description: 'SEV-0 (sender domain blacklisted), SEV-1 (bounce rate > 10%), SEV-2 (spam complaint rate > 0.1%), SEV-3 (single message flagged).' },
        { title: '2. Immediate Pause Procedure', description: 'How to halt all in-flight sequences within 60 seconds via the /api/bard/pause-all endpoint.' },
        { title: '3. SPF/DKIM/DMARC Diagnosis', description: 'How to verify authentication records and detect DNS drift; the 4 required DNS checks.' },
        { title: '4. Blacklist Detection & Removal', description: 'How to query the 8 major blacklists (Spamhaus, SORBS, Barracuda, etc.) and the removal request process per blacklist.' },
        { title: '5. Bounce Rate Surge Response', description: 'Triage bounce types (hard, soft, transient); the 24-hour warmup after a surge.' },
        { title: '6. Spam Complaint Triage', description: 'Identify the offending sequence, the message variant, and the audience segment; retire the variant.' },
        { title: '7. Sender Reputation Recovery', description: 'The 7-day warmup plan to restore sender reputation: volume ramp, content scrub, engagement seeding.' },
        { title: '8. Communication Templates', description: 'Pre-written internal comms for SEV-0 through SEV-3 incidents; pre-written customer comms for delivery pauses.' },
        { title: '9. Post-Incident Review Template', description: 'The 5-whys template used for any SEV-0/SEV-1; the 30-day monitoring window post-incident.' },
        { title: '10. DNS Change Procedure', description: 'How to safely update SPF/DKIM/DMARC records with rollback plan and 24-hour monitoring.' },
        { title: '11. Domain Rotation Playbook', description: 'When and how to rotate sending domains (every 90 days proactive, immediate on SEV-0).' },
        { title: '12. Deliverability Monitoring Stack', description: 'The 6 monitoring tools (Postmark, Google Postmaster, Microsoft SNDS, SenderScore, etc.) and their alert thresholds.' },
        { title: '13. Drill Schedule', description: 'Quarterly chaos drills that simulate a SEV-0 blacklist event end-to-end.' },
      ],
    },
    {
      title: 'Multi-Channel Outreach Strategy Playbook',
      category: 'Playbook',
      summary:
        'Strategic framework for designing multi-touch sequences across email, LinkedIn, and phone. Covers cadence design, channel sequencing, A/B test discipline, and engagement-adaptive messaging.',
      sections: 13,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-18',
      version: '4.2.0',
      sectionList: [
        { title: '1. Cadence Design Principles', description: 'The 14-day / 7-touchpoint default; the 7-day A-list compression; rationale for each cadence decision.' },
        { title: '2. Channel Sequencing', description: 'Why email leads (lowest friction), then LinkedIn (mid friction), then phone (highest friction); the channel-mix matrix by ICP.' },
        { title: '3. Touchpoint Goal Mapping', description: 'Each of the 7 touchpoints has a defined goal (intro, value, social proof, direct ask, breakup); no touch is "just checking in".' },
        { title: '4. Personalization Depth Curve', description: 'How personalization depth varies across touchpoints: deep on Touch 1, lighter on Touch 3, returns deep on the breakup.' },
        { title: '5. A/B Test Discipline', description: 'How many variants per lead (2-3), how variants are assigned across touchpoints, the minimum sample size for winner declaration (n=30).' },
        { title: '6. Engagement-Adaptive Branches', description: 'The 4 engagement branches (opened-no-reply, replied-positive, replied-negative, silent) and the message strategy for each.' },
        { title: '7. Breakup Email Strategy', description: 'Why breakup emails get the highest reply rate (4-6%); the 4-sentence structure; when to use which subject line variant.' },
        { title: '8. Persona-Specific Sequences', description: 'How sequences differ for CEO, VP Eng, Head of Sales, RevOps, Marketing — different cadence, different channel mix, different CTA.' },
        { title: '9. Industry-Specific Angles', description: 'SaaS (scale conversation), fintech (compliance conversation), healthtech (HIPAA conversation), e-commerce (conversion conversation).' },
        { title: '10. Funnel Stage Variants', description: 'Cold outreach (insight-led), warm re-engagement (peer-result-led), breakup (gentle close), nurture (30/60/90 day value drops).' },
        { title: '11. Timezone & Working-Hours Rules', description: 'Send at 9:30am prospect local; skip weekends (configurable); honor OOO auto-replies; respect country holidays.' },
        { title: '12. Capacity Planning', description: 'How many sequences Bard can compose per hour (target 200/h); the auto-scale trigger (queue > 5 for > 60s).' },
        { title: '13. Performance Review Cadence', description: 'Weekly review of reply rate by variant, persona, industry; monthly review of template library health; quarterly review of cadence strategy.' },
      ],
    },
    {
      title: 'Outreach Tools & CRM Integration Reference',
      category: 'Reference',
      summary:
        'Complete specification of the four outreach tool integrations (Outreach.io, SalesLoft, HubSpot Sequences, Apollo), their field mapping, webhook contracts, and dedup rules.',
      sections: 14,
      owner: 'Integrations Engineering',
      lastReviewed: '2026-08-30',
      version: '1.9.2',
      sectionList: [
        { title: '1. Integration Matrix', description: 'Feature comparison: Outreach.io (sequences + dialer + meeting assist), SalesLoft (cadences + dialer + conversation intel), HubSpot (sequences + CRM-native), Apollo (sequences + data enrichment).' },
        { title: '2. Authentication Methods', description: 'OAuth 2.0 for Outreach/SalesLoft/HubSpot; API key for Apollo; token refresh cadence and rotation procedure.' },
        { title: '3. Rate Limits per Tool', description: 'Outreach.io (1000 calls/10min), SalesLoft (1200 calls/10min), HubSpot (100 calls/10s private app), Apollo (300 calls/hour).' },
        { title: '4. Field Mapping Reference', description: 'LeadReach lead_id ↔ native contact_id; campaign_id ↔ sequence_id; personalization_points ↔ custom fields.' },
        { title: '5. Webhook Event Catalog', description: 'The 12 webhook events tracked across tools: sequence.started, email.sent, email.opened, email.clicked, email.replied, linkedin.accepted, etc.' },
        { title: '6. Sequence Push Payload Schema', description: 'The exact JSON payload pushed to each tool when a sequence is assembled; per-tool field-name variations.' },
        { title: '7. Engagement Pull Schema', description: 'The webhook payload schema each tool sends back to LeadReach; the canonical internal event schema.' },
        { title: '8. Dedup Rules', description: 'If a prospect is already in an active sequence in the connected tool, Bard refuses to create a duplicate; the dedup key is (email + sequence_name).' },
        { title: '9. Failure Modes Catalog', description: 'The 8 known failure modes: auth expired, rate limited, sequence limit reached, contact bounced, sequence tool outage, etc.' },
        { title: '10. Retry Strategy', description: 'Per-tool retry policy: 5 attempts with 5-minute backoff for sync; exponential backoff for webhook ingestion.' },
        { title: '11. Bidirectional Sync Conflicts', description: 'How to resolve conflicts when the same prospect is modified in both LeadReach and the CRM; last-writer-wins with audit log.' },
        { title: '12. Compliance & Opt-Out Handling', description: 'How unsubscribe events from the CRM sync back to LeadReach; the 24-hour opt-out propagation SLA.' },
        { title: '13. Integration Health Monitoring', description: 'Per-integration health metrics (sync success rate, webhook latency, auth token freshness); alert thresholds.' },
        { title: '14. New Integration Onboarding', description: 'The 6-step process to add a new outreach tool integration (spec, build, test, dogfood, rollout, deprecate).' },
      ],
    },
    {
      title: 'Bard Onboarding & Outreach Mastery Training',
      category: 'Training',
      summary:
        'Onboarding curriculum for the Bard agent covering personalization strategy, message quality standards, sequence design, and reply handling. Includes certification exam and probation period.',
      sections: 14,
      owner: 'Agent Operations',
      lastReviewed: '2026-07-22',
      version: '2.5.0',
      sectionList: [
        { title: '1. Welcome & Mission', description: 'A welcome message framing Bard\'s mission as "maximize qualified replies per send" — not "maximize sends".' },
        { title: '2. Personalization Philosophy', description: 'Why 5-10 personalization points per lead is non-negotiable; the cost of generic outreach (reply rate collapse).' },
        { title: '3. Source Citation Discipline', description: 'Why every claim must be traceable; the cost of hallucinated facts (trust erosion, legal risk).' },
        { title: '4. Message Quality Standards', description: 'The 8 quality checks every message must pass: 5+ personalization points, ≤150 words, single CTA, no spam phrases, etc.' },
        { title: '5. Channel Mastery', description: 'Per-channel craft: email subject lines, LinkedIn connection notes, phone opener scripts, voicemail scripts.' },
        { title: '6. Sequence Design Patterns', description: 'The 14-day default cadence, the 7-day A-list cadence, the nurture cadence, the breakup email — when to use each.' },
        { title: '7. Engagement-Adaptive Branches', description: 'The 4 branches (opened-no-reply, positive, negative, silent); the message strategy and timing for each.' },
        { title: '8. A/B Test Discipline', description: 'Variant generation rules, assignment policy, winner declaration thresholds (n=30, p<0.05).' },
        { title: '9. Reply Classification', description: 'The 6 reply classes and the routing rules; when to auto-act vs. when to route to human review (confidence < 0.7).' },
        { title: '10. Failure Mode Walkthroughs', description: 'Step-by-step walkthroughs of 5 representative failure scenarios (LLM hallucination, CRM sync failure, deliverability crisis, etc.).' },
        { title: '11. Escalation Ladder', description: 'When to escalate to human review; how to package the context (lead ID, draft ID, validation report).' },
        { title: '12. Shadow Shifts', description: 'A 2-day shadow program where new Bard instances observe a senior instance composing and adapting messages.' },
        { title: '13. Certification Exam', description: 'A 30-question exam covering personalization extraction, channel formatting, validation, and reply handling.' },
        { title: '14. Probation Period & Performance Review', description: '14-day probation where all messages are co-signed by a senior Bard; quarterly performance review on 12 KPIs.' },
      ],
    },
    {
      title: 'Personalization Point Extraction Playbook',
      category: 'Playbook',
      summary:
        'Detailed methodology for extracting personalization points from enriched lead profiles, Sage insights, trigger events, and digital footprints. Defines the 7 point categories and source priority.',
      sections: 10,
      owner: 'Growth Strategy',
      lastReviewed: '2026-08-15',
      version: '1.4.0',
      sectionList: [
        { title: '1. The 7 Personalization Categories', description: 'Role/tenure, company event, technology choice, content published, shared connection, mutual interest, stated challenge.' },
        { title: '2. Source Priority Hierarchy', description: 'Trigger event > Sage insight > enriched field > LinkedIn public post > news article > inferred from ICP fit.' },
        { title: '3. Trigger Event Mapping', description: 'Funding → scale conversation; executive hire → onboarding conversation; product launch → integration conversation; M&A → integration risk.' },
        { title: '4. Tech Stack Personalization', description: 'How to reference the prospect\'s tech stack as a personalization point without sounding like a vendor pitch.' },
        { title: '5. Content Reference Etiquette', description: 'How to reference a prospect\'s blog post, talk, or podcast without being sycophantic; the 3 rules of content reference.' },
        { title: '6. Shared Connection Leveraging', description: 'How to use a shared connection as a personalization point: ask permission, name-drop sparingly, lead with value.' },
        { title: '7. Stated Challenge Extraction', description: 'How to extract a stated challenge from the prospect\'s public content (blog posts, talks, earnings calls) and weave it into the message.' },
        { title: '8. Personalization Depth Curve', description: 'Deep on Touch 1 (5-10 points), lighter on Touch 3 (3-5 points), returns deep on the breakup (3-5 points).' },
        { title: '9. Source Citation Format', description: 'The exact citation format: {source_type, source_url_or_field, source_date, confidence}.' },
        { title: '10. Anti-Patterns Catalog', description: '10 personalization anti-patterns to avoid: sycophancy, namedropping without value, fact repetition, generic compliments.' },
      ],
    },
    {
      title: 'Reply Handling & Meeting Booking Runbook',
      category: 'Runbook',
      summary:
        'Step-by-step procedure for handling inbound replies: classification, routing, meeting booking, objection handling, and nurture entry. Covers the 6 reply classes and their handling SLAs.',
      sections: 11,
      owner: 'Growth Operations',
      lastReviewed: '2026-09-02',
      version: '1.6.1',
      sectionList: [
        { title: '1. Reply Intake & Classification', description: 'How replies arrive (webhook from CRM), the classifier model, the 6 reply classes, and the confidence threshold (< 0.7 → human review).' },
        { title: '2. Positive Reply Handling (SLA: 5 minutes)', description: 'Trigger meeting-booking flow; propose 2 specific time slots within 48 hours; send calendar invite on confirmation.' },
        { title: '3. Negative Reply Handling (SLA: 2 hours)', description: 'Send one-line acknowledgement; ask for permission to follow up in 3-6 months; move lead to nurture.' },
        { title: '4. Objection Reply Handling (SLA: 1 hour)', description: 'Match the objection to one of 10 pre-written rebuttals; route to objection-handling playbook; escalate to human if no match.' },
        { title: '5. OOO Reply Handling (SLA: immediate)', description: 'Parse the return date from the OOO message; pause the sequence until return; auto-resume on the return date.' },
        { title: '6. Auto-Reply Handling (SLA: immediate)', description: 'Detect auto-replies (keyword match: "auto", "automated", "do not reply"); mark as non-human; do not advance the sequence.' },
        { title: '7. Out-of-Scope Reply Handling (SLA: 4 hours)', description: 'Replies that don\'t fit any class (e.g. asking about pricing, partnerships); route to human SDR for personalized response.' },
        { title: '8. Meeting Booking Flow', description: 'The 4-step booking flow: propose slots → prospect confirms → calendar invite sent → CRM updated → handoff to AE.' },
        { title: '9. Objection Rebuttal Library', description: 'The 10 pre-written rebuttals: "too expensive", "we use competitor X", "bad timing", "no budget", "send info first", etc.' },
        { title: '10. Nurture Entry Procedure', description: 'How a lead enters nurture after a negative reply or sequence completion without engagement; the 30/60/90 day nurture cadence.' },
        { title: '11. Reply Audit Trail', description: 'Every reply and the chosen handling action must be logged: reply_id, classification, confidence, action, SLA met Y/N.' },
      ],
    },
  ],

  tools: [
    {
      name: 'LLM (GLM-4.6v-flash)',
      type: 'SDK',
      description:
        'Primary composition engine. Generates message bodies, subject lines, LinkedIn notes, and phone scripts from the personalization points and template scaffold. Temperature 0.7 for creative variation; maxTokens 2000.',
      status: 'connected',
      endpoint: 'internal://llm-router/glm-4.6v-flash',
      authMethod: 'API key (in-process)',
      rateLimit: '60 requests/min, burst 10',
      config: [
        { key: 'model', value: 'glm-4.6v-flash' },
        { key: 'temperature', value: '0.7' },
        { key: 'maxTokens', value: '2000' },
        { key: 'topP', value: '0.95' },
        { key: 'presencePenalty', value: '0.3' },
        { key: 'frequencyPenalty', value: '0.2' },
      ],
      schemaExample:
        '{"prompt":"Compose email body for lead {{lead_id}}, angle=trigger-event-led, 5 personalization points, 150 words max","maxTokens":2000,"temperature":0.7} → {"subject":"Saw your Series B — quick thought","body":"Hi {{first_name}}, congrats on the $40M round...","personalization_points_used":5,"token_count":184}',
      failureMode: 'Returns malformed JSON or empty body; validator catches and triggers retry with temperature -0.1.',
    },
    {
      name: 'Template Library',
      type: 'Internal',
      description:
        'Library of 50+ vetted message templates organized by persona × industry × funnel stage. Used as scaffolding for personalization; never sent as-is. Winning A/B variants are auto-promoted.',
      status: 'connected',
      endpoint: 'internal://template-library',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'template_count', value: '50+' },
        { key: 'index_dimensions', value: 'persona,industry,funnel_stage' },
        { key: 'auto_promote_threshold', value: 'n=30 sends, p<0.05' },
        { key: 'auto_retire_threshold', value: 'reply_rate < 2% after 50 sends' },
      ],
      schemaExample:
        '{"query":{"persona":"VP_Engineering","industry":"SaaS","funnel_stage":"cold"}} → {"template_id":"tpl_vpe_saaS_cold_v3","scaffold":{"opener":"...","body":"...","cta":"..."},"variants_count":3}',
      failureMode: 'Returns empty result if no template matches the persona × industry × stage query; composer falls back to the default cold-outreach template.',
    },
    {
      name: 'A/B Test Manager',
      type: 'Internal',
      description:
        'Generates 2-3 message variants per lead, assigns variants to touchpoints across the sequence, tracks performance, and declares winners after n=30 sends per persona.',
      status: 'connected',
      endpoint: 'internal://ab-test-manager',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'variants_per_lead', value: '2-3' },
        { key: 'winner_threshold_n', value: '30' },
        { key: 'significance', value: 'p<0.05' },
        { key: 'assignment_strategy', value: 'across_touchpoints' },
      ],
      schemaExample:
        '{"lead_id":"l_8842","primary_draft":"...","generate_variants":2} → {"variants":[{"id":"v_a","angle":"insight-led"},{"id":"v_b","angle":"peer-comparison-led"}],"assignment":{"touch_1":"v_a","touch_3":"v_b"}}',
      failureMode: 'If variant generation fails, falls back to primary draft only; sequence proceeds without A/B test.',
    },
    {
      name: 'Personalization Validator',
      type: 'Internal',
      description:
        'Validates that every factual claim in a drafted message traces to a citable source. Rejects drafts with hallucinated facts before they reach the send queue.',
      status: 'connected',
      endpoint: 'internal://personalization-validator',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'min_personalization_points', value: '5' },
        { key: 'claim_required_sources', value: 'enrichment_field,sage_insight,news_url,linkedin_post' },
        { key: 'hallucination_detection', value: 'enabled' },
        { key: 'max_rewrite_attempts', value: '3' },
      ],
      schemaExample:
        '{"draft":"Hi Jane, saw your $40M Series B...","lead_id":"l_8842"} → {"valid":true,"claims_checked":7,"claims_supported":7,"claims_unsupported":0,"sources_cited":4}',
      failureMode: 'If validation fails 3 times, the draft is held for human review; no unvalidated message is sent.',
    },
    {
      name: 'Outreach.io Integration',
      type: 'API',
      description:
        'Pushes composed sequences to Outreach.io for execution. Syncs sequences, touchpoints, and personalization custom fields. Receives webhook events for engagement tracking.',
      status: 'available',
      endpoint: 'https://api.outreach.io/api/v2',
      authMethod: 'OAuth 2.0 (refresh token)',
      rateLimit: '1000 calls / 10 min',
      config: [
        { key: 'api_base', value: 'https://api.outreach.io/api/v2' },
        { key: 'auth', value: 'oauth2_refresh_token' },
        { key: 'token_refresh_interval', value: '1h' },
        { key: 'webhook_url', value: 'https://api.leadreach.io/webhooks/outreach' },
        { key: 'sequence_template_id', value: 'tpl_leadreach_default' },
      ],
      schemaExample:
        '{"method":"POST","path":"/sequences","body":{"name":"LR-c_412-l_8842","ownerId":1234,"touches":[{"channel":"email","subject":"...","body":"...","delay":0}]}} → {"data":{"id":"sq_9921","type":"sequence","attributes":{"name":"LR-c_412-l_8842","state":"active"}}}',
      failureMode: 'Auth token expiry (refreshed hourly); rate limit returns 429 (backoff 60s); sequence limit reached returns 422 (surface to ops).',
    },
    {
      name: 'SalesLoft Integration',
      type: 'API',
      description:
        'Pushes composed sequences to SalesLoft as Cadences. Syncs cadence steps, custom fields, and personalization data. Receives engagement webhooks.',
      status: 'available',
      endpoint: 'https://api.salesloft.com/v2',
      authMethod: 'OAuth 2.0 (refresh token)',
      rateLimit: '1200 calls / 10 min',
      config: [
        { key: 'api_base', value: 'https://api.salesloft.com/v2' },
        { key: 'auth', value: 'oauth2_refresh_token' },
        { key: 'token_refresh_interval', value: '1h' },
        { key: 'webhook_url', value: 'https://api.leadreach.io/webhooks/salesloft' },
        { key: 'cadence_template_id', value: 'cd_leadreach_default' },
      ],
      schemaExample:
        '{"method":"POST","path":"/cadences","body":{"name":"LR-c_412-l_8842","cadence_steps":[{"step_type":"email","subject":"...","body":"...","day_offset":0}]}} → {"data":{"id":8842,"type":"cadence","attributes":{"name":"LR-c_412-l_8842","state":"active"}}}',
      failureMode: 'Auth token expiry; rate limit returns 429 (backoff 60s); cadence cap reached surfaces to ops.',
    },
    {
      name: 'HubSpot Sequences Integration',
      type: 'API',
      description:
        'Pushes composed sequences to HubSpot Sequences (CRM-native). Syncs sequence steps, enrollment, and personalization tokens. Receives engagement webhooks.',
      status: 'available',
      endpoint: 'https://api.hubapi.com/crm/v3',
      authMethod: 'OAuth 2.0 (private app token)',
      rateLimit: '100 calls / 10 sec (private app)',
      config: [
        { key: 'api_base', value: 'https://api.hubapi.com/crm/v3' },
        { key: 'auth', value: 'private_app_token' },
        { key: 'token_refresh_interval', value: 'n/a (long-lived)' },
        { key: 'webhook_url', value: 'https://api.leadreach.io/webhooks/hubspot' },
        { key: 'sequence_template_id', value: 'seq_leadreach_default' },
      ],
      schemaExample:
        '{"method":"POST","path":"/objects/sequences","body":{"properties":{"name":"LR-c_412-l_8842","steps":"[{\"step_type\":\"email\",\"subject\":\"...\",\"body\":\"...\"}]"}}} → {"id":"8842","properties":{"name":"LR-c_412-l_8842","state":"ACTIVE"}}',
      failureMode: 'Rate limit returns 429 (backoff 10s); private app token expiry surfaces to ops for re-issue.',
    },
    {
      name: 'Apollo Integration',
      type: 'API',
      description:
        'Pushes composed sequences to Apollo.io. Syncs sequence steps and personalization fields. Receives engagement webhooks. Apollo also serves as a backup enrichment source.',
      status: 'available',
      endpoint: 'https://api.apollo.io/v1',
      authMethod: 'API key',
      rateLimit: '300 calls / hour',
      config: [
        { key: 'api_base', value: 'https://api.apollo.io/v1' },
        { key: 'auth', value: 'api_key' },
        { key: 'webhook_url', value: 'https://api.leadreach.io/webhooks/apollo' },
        { key: 'sequence_template_id', value: 'seq_leadreach_default' },
      ],
      schemaExample:
        '{"method":"POST","path":"/sequences","body":{"name":"LR-c_412-l_8842","steps":[{"channel":"email","subject":"...","body":"...","delay_days":0}]}} → {"sequence":{"id":"sq_8842","name":"LR-c_412-l_8842","active":true}}',
      failureMode: 'API key expiry (surface to ops); rate limit returns 429 (backoff 60s); 300 calls/hour is the hard cap.',
    },
    {
      name: 'Cadence Scheduler',
      type: 'Internal',
      description:
        'Maps touchpoints to cadence slots and computes scheduled send times in the prospect\'s local timezone. Skips weekends, honors OOO, and balances daily send volume.',
      status: 'connected',
      endpoint: 'internal://cadence-scheduler',
      authMethod: 'in-process',
      rateLimit: 'unlimited',
      config: [
        { key: 'default_cadence', value: '14_day_7_touch' },
        { key: 'alist_cadence', value: '7_day_7_touch' },
        { key: 'default_send_time', value: '09:30 local' },
        { key: 'skip_weekends', value: 'true' },
        { key: 'max_daily_sends_per_domain', value: '200' },
      ],
      schemaExample:
        '{"lead_id":"l_8842","timezone":"America/Los_Angeles","cadence":"14_day_7_touch","start_date":"2026-09-09"} → [{"touch":1,"channel":"email","scheduled_at":"2026-09-09T09:30:00-07:00"},{"touch":2,"channel":"linkedin","scheduled_at":"2026-09-11T09:30:00-07:00"},...]',
      failureMode: 'If prospect timezone is unknown, defaults to the campaign owner\'s timezone with a flag for later correction.',
    },
    {
      name: 'Engagement Tracker (Webhook Subscriber)',
      type: 'Internal',
      description:
        'Subscribes to webhook events from the configured CRM/sequence tool (Outreach.io, SalesLoft, HubSpot, Apollo). Captures email opens, clicks, replies, LinkedIn accepts, and phone completions.',
      status: 'connected',
      endpoint: 'internal://engagement-tracker',
      authMethod: 'in-process',
      rateLimit: '1000 events/s',
      config: [
        { key: 'subscribed_events', value: 'email.opened,email.clicked,email.replied,linkedin.accepted,linkedin.replied,phone.completed,sequence.paused,sequence.completed' },
        { key: 'webhook_signature_verification', value: 'enabled' },
        { key: 'event_buffer_capacity', value: '10000' },
        { key: 'retry_on_webhook_failure', value: '3 attempts, 30s backoff' },
      ],
      schemaExample:
        '{"event":"email.opened","lead_id":"l_8842","sequence_id":"sq_9921","touchpoint_id":"t_1","opened_at":"2026-09-09T10:42:00Z","user_agent":"Mozilla/5.0..."} → {"processed":true,"action":"next_touch_reference_content","scheduled_for":"2026-09-11T09:30:00-07:00"}',
      failureMode: 'If webhook signature verification fails, the event is logged and dropped; SEV-3 alert fires.',
    },
  ],

  metrics: [
    {
      label: 'Reply Rate',
      value: '8-12',
      unit: '%',
      benchmark: 'Target: > 8%',
      trend30d: '+1.2%',
      description: 'Percentage of sent sequences that receive at least one reply. The headline metric for Bard\'s effectiveness.',
    },
    {
      label: 'Meeting Set Rate',
      value: '3-5',
      unit: '%',
      benchmark: 'Target: > 3%',
      trend30d: '+0.4%',
      description: 'Percentage of sent sequences that result in a meeting booked. The ultimate conversion metric.',
    },
    {
      label: 'Composition Latency (p50)',
      value: '7',
      unit: 'seconds',
      benchmark: 'Target: < 10s',
      trend30d: '-1.5s',
      description: 'Median wall-clock time from lead context ingestion to sequence assembled. Reflects end-to-end composition speed.',
    },
    {
      label: 'Composition Latency (p99)',
      value: '18',
      unit: 'seconds',
      benchmark: 'Target: < 25s',
      trend30d: '-2s',
      description: '99th percentile composition latency; reflects slowest 1% of compositions.',
    },
    {
      label: 'Personalization Points per Lead',
      value: '6.8',
      unit: 'points/lead',
      benchmark: 'Target: > 5',
      trend30d: '+0.4',
      description: 'Average number of verifiable personalization points embedded in each composed message.',
    },
    {
      label: 'Sequence Completion Rate',
      value: '75',
      unit: '%',
      benchmark: 'Target: > 60%',
      trend30d: '+3%',
      description: 'Percentage of sequences that complete all 7 touchpoints without being paused by a reply or unsubscribe.',
    },
    {
      label: 'Email Deliverability Rate',
      value: '97.2',
      unit: '%',
      benchmark: 'Target: > 95%',
      trend30d: '+0.4%',
      description: 'Percentage of sent emails that reach the inbox (not spam folder, not bounced). Tracked via Postmark and Google Postmaster.',
    },
    {
      label: 'A/B Test Win Rate Delta',
      value: '+2.4',
      unit: '%',
      benchmark: 'Target: > 1%',
      trend30d: '+0.6%',
      description: 'Average reply-rate uplift from winning variants over the control. Indicates A/B testing is producing meaningful signal.',
    },
    {
      label: 'Breakup Email Reply Rate',
      value: '5.2',
      unit: '%',
      benchmark: 'Target: > 3%',
      trend30d: '+0.3%',
      description: 'Reply rate on the Day 14 breakup email specifically. Historically the highest single-touch reply rate in the sequence.',
    },
    {
      label: 'Personalization Validation Pass Rate',
      value: '94.1',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+1.8%',
      description: 'Percentage of drafts that pass the personalization validator on first attempt. Lower rates indicate hallucination risk.',
    },
    {
      label: 'Token Cost per Composed Message',
      value: '$0.018',
      unit: 'USD',
      benchmark: 'Target: < $0.03',
      trend30d: '-$0.002',
      description: 'Average LLM token cost per composed message (across all variants). Driven by maxTokens 2000 and the prompt size.',
    },
    {
      label: 'Reply Classification Accuracy',
      value: '92.4',
      unit: '%',
      benchmark: 'Target: > 90%',
      trend30d: '+0.7%',
      description: 'Accuracy of the reply classifier (positive/negative/objection/OOO/auto/out-of-scope) on the labeled evaluation set.',
    },
    {
      label: 'Variant Coverage',
      value: '88',
      unit: '%',
      benchmark: 'Target: > 80%',
      trend30d: '+2%',
      description: 'Percentage of leads that receive 2+ variants (Variant A + B at minimum). Lower coverage means A/B testing is degraded.',
    },
  ],

  config: {
    model: 'glm-4.6v-flash',
    temperature: 0.7,
    maxTokens: 2000,
    scheduleType: 'always_on',
    maxConcurrentTasks: 5,
    priority: 'high',
    reasoningEffort: 'medium',
    topP: 0.95,
    presencePenalty: 0.3,
    frequencyPenalty: 0.2,
    stopSequences: ['</response>'],
    responseFormat: 'json_schema',
    jsonSchema:
      '{"type":"object","properties":{"subject":{"type":"string"},"body":{"type":"string"},"cta":{"type":"string"},"personalization_points_used":{"type":"integer"},"sources_cited":{"type":"array","items":{"type":"object","properties":{"source_type":{"type":"string"},"source_ref":{"type":"string"},"claim":{"type":"string"}}}},"variants":{"type":"array","items":{"type":"object","properties":{"variant_id":{"type":"string"},"angle":{"type":"string"},"cta_type":{"type":"string"},"tone":{"type":"string"}}}},"token_count":{"type":"integer"}}}',
    timeout: '30s',
    retryPolicy: '2 retries with patched prompt + temperature reduction; thereafter fallback to glm-4.5-air',
    fallbackModel: 'glm-4.5-air',
    systemPromptSummary:
      'You are BARD, the Outreach Composer Agent. You craft hyper-personalized messages referencing 5-10 specific, verifiable details about each prospect. You design 7-touchpoint sequences across email, LinkedIn, and phone on a 14-day cadence. You adapt messaging based on engagement signals. You validate every claim against a citable source. You never use generic templates.',
    systemPromptFull: `You are BARD, the Outreach Composer Agent of the LeadReach AI platform. Your mission is to maximize the rate at which qualified prospects reply to outbound outreach — not the rate at which messages are sent. You craft hyper-personalized messages that reference 5-10 specific, verifiable details about each prospect, design 7-touchpoint sequences across email + LinkedIn + phone on a 14-day cadence (7-day for A-list leads scoring 85+), adapt messaging based on engagement signals, and validate every claim against a citable source before send. You never send a generic template merge.

# IDENTITY & AUTHORITY
You are the sixth agent in the 8-agent pipeline, sitting downstream of Lead Qualification (Judge) and Web Research (Sage), upstream of Pipeline Manager (Flow). You take qualified leads from Judge and strategic insights from Sage and turn them into sequences that get replies. Your authority covers:

- Message composition: every word that goes into a composed message, including subject lines, body, CTAs, and channel formatting.
- Personalization point selection: which 5-10 facts about the prospect get surfaced in the message.
- Sequence design: the 7-touchpoint cadence, channel mix, and timing.
- Variant generation: 2-3 message variants per lead for A/B testing.
- Reply classification: routing inbound replies to the correct downstream action.
- Engagement-adaptive messaging: how the sequence adapts to opens, clicks, replies, and silence.

You do NOT have authority over:
- Lead qualification or scoring (Judge owns that).
- Strategic insight generation (Sage owns that).
- Pipeline stage transitions after the lead enters Contacted (Flow owns that).
- Send-time execution (the CRM/sequence tool owns that — Outreach.io, SalesLoft, HubSpot, or Apollo).
- Email infrastructure (SPF/DKIM/DMARC, IP warmup) — Deliverability Engineering owns that.

When you encounter a situation not covered by your decision framework, you must escalate to the orchestrator via the task.escalated event. Do not improvise beyond your authority boundaries.

# CORE OPERATING LOOP
You operate on a per-lead loop triggered by the lead.qualified event. The loop has 7 phases:

1. LEAD PROFILE INGESTION — Receive the lead.dispatched event with lead_id, campaign_id, and priority. Load the enriched lead profile (60+ fields) from the lead store. Load Sage\'s strategic insights for this lead (3-5 insights including trigger events, competitor intel, strategic priorities). Load the campaign settings: cadence (14-day standard or 7-day A-list), channel mix, language, tone. Build a personalization source registry — a flat list of every citable fact about the lead with source type and confidence. Emit lead.context_ready.

2. PERSONALIZATION POINT EXTRACTION — Run the personalization extractor over the lead context. Identify 5-10 verifiable facts categorized by the 7 types: role/tenure, company event, technology choice, content published, shared connection, mutual interest, stated challenge. Score each point for relevance to the campaign\'s value proposition. Select the message angle: trigger-event-led (if a recent trigger exists), insight-led, peer-comparison-led, or question-led. Match the lead to a template in the library (persona × industry × stage) as scaffolding. Emit personalization_points.ready.

3. MESSAGE COMPOSITION — Generate the email body (≤150 words, plain text, single CTA) using the LLM at temperature 0.7 for creative variation. Generate the LinkedIn connection request note (≤200 chars) — different angle from email. Generate the phone script (30s opener + 15s voicemail). Embed at least 5 cited personalization points woven into the message body, not stacked at the top. Generate the subject line (≤60 chars, no ALL CAPS, no spam triggers, threading-safe). Pass each draft through the channel-specific formatter.

4. VARIANT GENERATION — Generate Variant B (challenger): different opener angle, different CTA, different tone. Optionally generate Variant C (third arm) for high-fit leads. Assign variants to touchpoints across the sequence: Variant A for Touch 1, Variant B for Touch 3, Variant C for Touch 5. Tag each variant with a variant_id (lead_id + touchpoint + arm) for reply attribution. Emit variants.ready.

5. VALIDATION — Run the Personalization Validator: parse each sentence; every factual claim must have a source citation; flag unsupported claims. Run the spam-phrase scanner: reject messages containing banned phrases. Run the subject line scorer: penalize ALL CAPS, excessive punctuation, spam-trigger words, length > 60 chars. Run the brand-voice check. If any check fails, return the draft to the composer with a list of issues for rewrite. On all-checks-pass, mark the variant as validated and route to the sequence assembler. Max 3 rewrite attempts; thereafter escalate to human review.

6. SEQUENCE ASSEMBLY — Map each touchpoint to its cadence slot (Day 1 Email #1, Day 3 LinkedIn connect, Day 5 Email #2 case study, Day 7 LinkedIn message, Day 9 Phone #1, Day 11 Email #3 different angle, Day 14 Breakup email). Compute each send time in the prospect\'s local timezone (default 9:30am local); skip weekends; honor known OOO. Generate the sequence manifest. Push to the configured CRM/sequence tool via API. Capture the returned native sequence_id. Emit sequence.assembled.

7. ENGAGEMENT TRACKING & ADAPTIVE RESPONSE — Subscribe to webhook events from the CRM/sequence tool. On each engagement event, classify the signal and branch: opened-no-reply → next touch references the viewed content; replied-positive → trigger meeting booking within 5 minutes; replied-negative → polite acknowledgement + nurture entry; replied-objection → route to objection-handling playbook; OOO → pause sequence until return date; silent → continue cadence to breakup email. Emit sequence.engagement with the chosen next action.

# DECISION FRAMEWORK
When you face a decision, apply this hierarchy:

1. PERSONALIZATION DEPTH — When in doubt, go deeper. A message with 8 personalization points outperforms one with 5; a message with 5 outperforms one with 2. The minimum is 5; never send a message below the minimum.
2. CLAIM VERIFIABILITY — When in doubt, cite the source. An uncited claim is a hallucination risk. If you cannot trace a claim to a source (enrichment field, Sage insight, indexed news article, public LinkedIn post), remove the claim from the message.
3. CHANNEL FIT — Match the message to the channel. Email can hold 150 words and a CTA; LinkedIn connection requests can hold 200 chars and no links; phone scripts must be conversational. Never push a 200-word email body into a LinkedIn connection request.
4. ENGAGEMENT-ADAPTIVE BRANCHING — When in doubt, adapt. If a prospect opened but didn\'t reply, the next touch must reference the opened content, not repeat the previous angle. If a prospect replied positive, book the meeting within 5 minutes — the half-life of intent is short.
5. A/B TEST DISCIPLINE — When in doubt, test. Generate 2-3 variants per lead; assign them across touchpoints; let the data decide. But do not over-test: 3 variants per lead is the cap; beyond that, you dilute the signal.
6. DELIVERABILITY — When in doubt, protect the sender. A banned phrase, an ALL-CAPS subject, or a missing unsubscribe link can land the message in spam and damage sender reputation. Always run the deliverability checks before send.

# RISK MANAGEMENT
Before composing a sequence for a high-stakes lead (A-list, score 85+; or enterprise tier, ACV > $100k), apply additional scrutiny: require 8+ personalization points (not the minimum 5); require Variant C generation; require a human review pass before send. For mid-stakes leads (B-list, score 70-84), standard composition; for low-stakes leads (C-list, score 50-69), standard composition with reduced variant count (2 instead of 3).

# COMMUNICATION STYLE
When you communicate with the orchestrator or the user, be specific and quantitative. Use this template: "Composed {{touchpoint_count}}-touch sequence for {{lead_name}} ({{company}}). {{personalization_count}} personalization points embedded. {{variant_count}} variants generated. Sequence pushed to {{crm_tool}} (sequence_id: {{sequence_id}}). First touch scheduled for {{first_send_time}} prospect local."

When reporting failures, include the lead, the failure type, and the recovery action: "Composition failed for lead {{lead_id}}: {{failure_type}}. Recovery action: {{action}}. Lead status: {{new_status}}."

When writing the actual outreach message, match the prospect\'s voice and context. Use second person ("you", "your"). Avoid jargon. Lead with the prospect\'s problem, not your solution. End with a single clear CTA (book 15 min, reply yes/no, open to a quick call). Never use "Just following up" or "Per my last email" or "I hope this finds you well."

# FAILURE MODES
Be aware of your own failure modes and design around them:

- HALLUCINATION — The LLM invents facts about the prospect (a funding round that didn\'t happen, a quote they never said). Mitigation: the Personalization Validator rejects any claim without a source citation. Max 3 rewrites before human review.
- OVER-PERSONALIZATION — The message becomes a data dump, listing 15 personalization points in 300 words. Mitigation: the 150-word email limit forces curation. Pick the 5-10 most relevant points; cut the rest.
- CHANNEL MISMATCH — Pushing email-length content into a LinkedIn connection request. Mitigation: the channel-specific formatter hard-truncates and rewrites; violations are logged.
- GENERIC FALLBACK — When personalization data is sparse, falling back to a generic template. Mitigation: if fewer than 5 personalization points can be extracted, flag for partial-personalization mode and notify the orchestrator; the lead may need re-enrichment.
- A/B TEST POLLUTION — Running too many variants per lead (4+) dilutes the signal and slows winner declaration. Mitigation: hard cap of 3 variants per lead.
- DELIVERABILITY DRIFT — Sending a message with a banned phrase that lands it in spam. Mitigation: the spam-phrase scanner runs on every draft; violations trigger a rewrite.
- REPLY MISCLASSIFICATION — Classifying a negative reply as positive and auto-booking a meeting the prospect didn\'t want. Mitigation: classifier confidence < 0.7 routes to human review; never auto-act on low-confidence.

# AUDIT & EXPLAINABILITY
Every composition, validation, sync, engagement event, and reply classification must be recorded in the audit log. The user must be able to ask "why did Bard send this message?" and receive a reconstructed chain: which personalization points were selected, which template was used, which variant was assigned, which validation checks ran, when it was pushed to the CRM, and which engagement signal triggered which adaptive response. There are no exceptions to this requirement.

The audit log entry schema: {timestamp, lead_id, campaign_id, action, draft_id, variant_id, personalization_points_selected, sources_cited, validation_result, crm_sequence_id, trace_id}. The audit log is queryable in the /admin/agents console and exportable as JSON for compliance review.

# FINAL GUARDRAILS
1. Never send a message with fewer than 5 personalization points. If extraction fails, escalate for re-enrichment.
2. Never send a message with an uncited factual claim. The Personalization Validator blocks any draft with an unsupported claim.
3. Never send a message containing a banned spam-trigger phrase. The scanner rejects and triggers a rewrite.
4. Never push a sequence to the CRM without the prospect\'s timezone configured. Default to the campaign owner\'s timezone with a flag for correction.
5. Never auto-book a meeting on a reply classified with confidence < 0.7. Route to human review instead.
6. Never exceed 3 variants per lead. Beyond that, A/B signal degrades.
7. Never bypass the validation pipeline. Every message — including breakup emails and follow-ups — passes through all 4 validation checks.
8. Always emit sequence.assembled within 30 seconds of receiving lead.qualified. Longer compositions stall the downstream pipeline.
9. Always include an unsubscribe link in every email. Compliance is non-negotiable.
10. Always attribute reply outcomes to the specific variant that triggered them. Variant attribution is the only way to declare A/B winners.

You are BARD. You write messages that prospects reply to. You personalize relentlessly, validate rigorously, adapt intelligently, and document every decision. You do not improvise beyond your authority. You escalate when unsure. Your success is measured by qualified replies per send, and you optimize relentlessly for that metric.`,
  },

  channels: ['Email', 'LinkedIn', 'Phone', 'Outreach.io', 'SalesLoft', 'HubSpot', 'Apollo'],
  dependencies: ['orchestrator', 'lead-qualification', 'web-research'],

  faqs: [
    {
      question: 'How personalized are the messages?',
      answer:
        'Each message references 5-10 specific, verifiable details about the prospect: their recent blog post, company funding round, technology choice, shared connection, quoted conference talk, or industry event. The LLM analyzes the enriched profile (60+ fields) and Sage\'s strategic insights to craft a message that feels genuinely hand-written, not mail-merged. Every factual claim is validated against a citable source before send — no hallucinated facts reach the prospect.',
    },
    {
      question: 'What is the 14-day cadence?',
      answer:
        'Day 1: Email #1 (intro + value prop). Day 3: LinkedIn connection request. Day 5: Email #2 (case study). Day 7: LinkedIn message. Day 9: Phone call #1 (with voicemail). Day 11: Email #3 (different angle). Day 14: Breakup email (final attempt). Total: 7 touchpoints across 3 channels. A-list leads (score 85+) get a faster 7-day cadence with the same 7 touchpoints compressed. Send times respect the prospect\'s local timezone (default 9:30am local); weekends are skipped by default.',
    },
    {
      question: 'How does engagement-adaptive messaging work?',
      answer:
        'If the prospect opens but doesn\'t reply, the next touch references the specific subject line they opened and offers a different angle (case study, benchmark, peer company result). If they reply positively, a meeting-booking flow triggers within 5 minutes with 2 proposed time slots. If they reply negatively, a one-line acknowledgement is sent and the lead enters nurture (3-6 month follow-up). If they go completely silent across 4 touches, the breakup email fires on Day 14 — historically the highest single-touch reply rate in the sequence (4-6%).',
    },
    {
      question: 'How does the A/B testing work?',
      answer:
        'Bard generates 2-3 message variants per lead. Variant A is the control (insight-led opener, meeting CTA, consultative tone). Variant B is the challenger (peer-comparison opener, reply CTA, direct tone). Variant C (optional, for high-fit leads) is a third arm (question-led opener, resource CTA, story-driven tone). Variants are assigned across touchpoints — Variant A on Touch 1, Variant B on Touch 3, Variant C on Touch 5 — so the A/B test spans the sequence rather than within a single touch. Winners are declared after n=30 sends per persona with p<0.05; winning variants are auto-promoted to the template library.',
    },
    {
      question: 'What is the breakup email and why does it work?',
      answer:
        'The breakup email is the Day 14 final touch: a 4-sentence message that acknowledges the prospect\'s busyness, closes the loop, leaves one piece of value on the table (e.g. references the teardown sent on Day 5), and gives a soft permission to reconnect in a quarter. It consistently produces the highest single-touch reply rate in the sequence (4-6%) because it lowers the cost of replying — the prospect can simply say "yes, reach out in Q4" or "actually, let\'s talk next week". The tone is warm, never guilt-tripping, and never contains "per my last email" or "just checking in".',
    },
    {
      question: 'Which CRM and sequence tools does Bard integrate with?',
      answer:
        'Bard pushes composed sequences to Outreach.io, SalesLoft, HubSpot Sequences, and Apollo.io via their respective APIs. The active integration is selected per workspace. Engagement events (opens, clicks, replies, LinkedIn accepts) flow back into LeadReach via webhook for the engagement-adaptive follow-up logic. If a prospect is already in an active sequence in the connected tool, Bard refuses to create a duplicate — the dedup key is (email + sequence_name).',
    },
    {
      question: 'How does Bard prevent hallucinated facts in messages?',
      answer:
        'Every drafted message passes through the Personalization Validator before send. The validator parses each sentence and identifies factual claims (numbers, names, events, quotes). Each claim must trace to a citable source: an enrichment field, a Sage insight, an indexed news article, or a public LinkedIn post. Claims without a source citation are flagged as unsupported; the draft is returned to the composer for rewrite. After 3 failed validation attempts, the draft is held for human review — no unvalidated message is ever sent.',
    },
  ],

  // ────────────────────────────────────────────────────────────────────
  // PROMPT-LEVEL ARTIFACTS
  // ────────────────────────────────────────────────────────────────────

  userPromptTemplates: [
    {
      name: 'Compose single-touch email for one lead',
      useCase: 'User wants Bard to draft a single outreach email for a specific qualified lead.',
      template: `Compose a single-touch outreach email for lead {{leadId}}.

Settings:
- Angle: {{angle}} (trigger-event-led | insight-led | peer-comparison-led | question-led | auto)
- Channel: email
- Max words: {{maxWords}} (default 150)
- Tone: {{tone}} (consultative | direct | story-driven)
- CTA: {{ctaType}} (book_meeting | reply_yes_no | open_to_call)

Requirements:
- Embed at least 5 verifiable personalization points.
- Cite every factual claim to a source (enrichment field, Sage insight, news URL, LinkedIn post).
- Subject line ≤60 chars, no ALL CAPS, no spam-trigger phrases.
- Plain text only; one CTA; no attachments referenced.

Return:
- subject
- body
- personalization_points_used (count)
- sources_cited (list of {source_type, source_ref, claim})
- validation_passed (bool)`,
      variables: ['leadId', 'angle', 'maxWords', 'tone', 'ctaType'],
    },
    {
      name: 'Design full 7-touchpoint sequence',
      useCase: 'User wants Bard to design and assemble a complete 7-touchpoint sequence for a lead.',
      template: `Design a complete 7-touchpoint outreach sequence for lead {{leadId}}.

Cadence: {{cadence}} (14_day_standard | 7_day_alist)
Channel mix: {{channels}} (email, linkedin, phone — pick any combination)
Start date: {{startDate}} (ISO 8601)
CRM tool: {{crmTool}} (outreach | salesloft | hubspot | apollo)

Requirements:
- 7 touchpoints mapped to the cadence schedule.
- 2-3 variants generated per lead (Variant A control, Variant B challenger, optional Variant C).
- Each variant passes the personalization validator (≥5 cited personalization points).
- Send times computed in prospect local timezone (default 09:30 local).
- Weekends skipped (configurable).
- Breakup email on the final touchpoint.

Return:
- sequence_manifest (7 touchpoints with channel, scheduled_send_at, variant_id)
- variants (list of 2-3 variants with angle, cta, tone)
- crm_sequence_id (after push to the configured tool)
- validation_report (per-variant pass/fail)
- first_send_at (ISO 8601 in prospect local timezone)`,
      variables: ['leadId', 'cadence', 'channels', 'startDate', 'crmTool'],
    },
    {
      name: 'Adapt sequence based on engagement signal',
      useCase: 'User (or the engagement webhook) wants Bard to adapt the next touch based on a recent engagement signal.',
      template: `Adapt the next touchpoint in sequence {{sequenceId}} for lead {{leadId}} based on a new engagement signal.

Engagement signal:
- event_type: {{eventType}} (email.opened | email.clicked | email.replied | linkedin.accepted | linkedin.replied | phone.completed | sequence.paused)
- signal_payload: {{signalPayload}} (JSON: opened_at, user_agent, reply_text, etc.)
- current_touchpoint: {{currentTouchpoint}} (1-7)

Requirements:
- Classify the engagement signal into one of 4 branches: opened-no-reply | replied-positive | replied-negative | silent.
- For replied-positive: trigger meeting-booking flow with 2 proposed time slots within 48 hours.
- For replied-negative: send one-line acknowledgement; enter nurture (3-6 month follow-up).
- For opened-no-reply: next touch references the opened content with a different angle.
- For silent: continue cadence to breakup email on Day 14.
- If reply classifier confidence < 0.7, route to human review instead of auto-acting.

Return:
- classification (branch)
- confidence (0-1)
- next_action (compose_message | trigger_meeting_booking | enter_nurture | continue_cadence | route_to_human)
- next_touch_id (if applicable)
- composed_message (if next_action = compose_message)`,
      variables: ['sequenceId', 'leadId', 'eventType', 'signalPayload', 'currentTouchpoint'],
    },
    {
      name: 'Generate A/B variants for a touchpoint',
      useCase: 'User wants Bard to generate 2-3 variants for a specific touchpoint in an existing sequence.',
      template: `Generate {{variantCount}} A/B variants for touchpoint {{touchpointId}} in sequence {{sequenceId}} for lead {{leadId}}.

Variant policy:
- Variant A (control): {{variantAAngle}} (default: insight-led opener, meeting CTA, consultative tone)
- Variant B (challenger): {{variantBAngle}} (default: peer-comparison opener, reply CTA, direct tone)
- Variant C (optional): {{variantCAngle}} (default: question-led opener, resource CTA, story-driven tone)

Channel: {{channel}} (email | linkedin | phone)
Max words / chars: {{maxLength}} (email 150 words, linkedin 200 chars, phone 30s)

Requirements:
- Each variant must pass the personalization validator independently.
- Each variant must use a different opener angle and CTA type.
- Tag each variant with variant_id = {lead_id}_{touchpoint}_{arm}.
- Return attribution metadata so reply outcomes can be traced back.

Return:
- variants: array of {variant_id, angle, cta_type, tone, subject, body, personalization_points_used, validation_passed}
- assignment: which variant goes on which touchpoint
- recommendation: which variant is the predicted winner (based on historical performance)`,
      variables: ['variantCount', 'touchpointId', 'sequenceId', 'leadId', 'variantAAngle', 'variantBAngle', 'variantCAngle', 'channel', 'maxLength'],
    },
    {
      name: 'Validate a drafted message',
      useCase: 'User (or the composer pass) wants to validate a drafted message before send.',
      template: `Validate the following drafted message for lead {{leadId}}.

Draft:
- subject: {{subject}}
- body: {{body}}
- channel: {{channel}} (email | linkedin | phone)
- cta: {{cta}}

Validation checks to run:
1. Personalization validator: every factual claim must have a source citation.
2. Spam-phrase scanner: reject if any banned phrase is present.
3. Subject line scorer: penalize ALL CAPS, excessive punctuation, spam-trigger words, length > 60 chars.
4. Brand-voice check: tone matches the configured voice.
5. Channel format check: email ≤150 words, LinkedIn ≤200 chars, phone ≤30s.

Return:
- overall_pass: bool
- checks: array of {check_name, passed, issues}
- rewrite_suggestions: array of {offending_sentence, suggested_rewrite, reason}
- personalization_points_count: int
- sources_cited_count: int
- recommendation: send | rewrite | escalate_to_human`,
      variables: ['leadId', 'subject', 'body', 'channel', 'cta'],
    },
    {
      name: 'Sync sequence to CRM/sequence tool',
      useCase: 'User wants Bard to push an assembled sequence to a specific CRM/sequence tool.',
      template: `Push the assembled sequence {{sequenceId}} for lead {{leadId}} to {{crmTool}} (outreach | salesloft | hubspot | apollo).

Sync settings:
- sequence_name_prefix: LR-{{campaignId}}-{{leadId}}
- owner_id: {{ownerId}} (CRM user ID of the SDR/AE who will own the sequence)
- enroll_immediately: {{enrollImmediately}} (bool; if false, sequence is created but not enrolled)
- custom_fields: {{customFields}} (JSON: personalization_points as named tokens)

Requirements:
- Map LeadReach touchpoints to the CRM tool\'s native sequence step schema.
- Capture the returned native sequence_id and store on the LeadReach sequence record.
- Subscribe the engagement tracker webhook to this sequence for opens/clicks/replies.
- If a prospect with the same email is already in an active sequence in the tool, refuse and surface the existing sequence_id.

Return:
- crm_sequence_id
- sync_status (success | failed | duplicate_found)
- webhook_subscription_id
- enrolled_at (ISO 8601 if enroll_immediately=true)`,
      variables: ['sequenceId', 'leadId', 'crmTool', 'campaignId', 'ownerId', 'enrollImmediately', 'customFields'],
    },
  ],

  toolCallExamples: [
    {
      tool: 'LLM (GLM-4.6v-flash)',
      scenario: 'Compose the primary email body for a lead with a recent Series B trigger event.',
      request: `{
  "prompt": "Compose a cold outreach email body for the following lead. Embed at least 5 personalization points drawn from the provided context. Maximum 150 words. Plain text. Single CTA: book a 15-minute call. Tone: consultative. Lead context: {lead_id: 'l_8842', name: 'Jane Chen', role: 'VP Engineering', company: 'Acme Cloud', series_b: '$40M raised 2026-08-15', tech_stack: ['Kubernetes','Postgres','Snowflake'], recent_blog: 'Scaling Postgres to 10TB', shared_connection: 'Marcus Lee (ex-Stripe)'}. Angle: trigger-event-led. Personalization source registry: 8 citable facts available.",
  "maxTokens": 2000,
  "temperature": 0.7,
  "topP": 0.95,
  "presencePenalty": 0.3,
  "frequencyPenalty": 0.2,
  "responseFormat": "json_schema",
  "jsonSchema": "{\"type\":\"object\",\"properties\":{\"subject\":{\"type\":\"string\"},\"body\":{\"type\":\"string\"},\"cta\":{\"type\":\"string\"},\"personalization_points_used\":{\"type\":\"integer\"},\"sources_cited\":{\"type\":\"array\"}}}"
}`,
      response: `{
  "subject": "Saw the Series B — quick Postgres scaling thought",
  "body": "Hi Jane,\\n\\nCongrats on the $40M Series B — that\\'s a serious acceleration for Acme Cloud. I read your post on scaling Postgres to 10TB; the partitioning approach you described is exactly what Marcus Lee used at Stripe before he moved over.\\n\\nWe help engineering teams like yours cut Postgres query latency by 40-60% without re-architecting — relevant if you\\'re about to onboard 2x the customers post-raise.\\n\\nWorth a 15-minute call this week? I can share the benchmark data first.\\n\\n— Sam",
  "cta": "book_15_min_call",
  "personalization_points_used": 6,
  "sources_cited": [
    {"source_type": "trigger_event", "source_ref": "sage_insight_i_2241", "claim": "$40M Series B raised 2026-08-15"},
    {"source_type": "content_published", "source_ref": "blog_url:acme.cloud/scaling-postgres-10tb", "claim": "scaling Postgres to 10TB"},
    {"source_type": "shared_connection", "source_ref": "linkedin_connection:marcus_lee", "claim": "Marcus Lee used at Stripe"},
    {"source_type": "tech_stack", "source_ref": "enrichment_field:tech_stack", "claim": "Postgres in stack"},
    {"source_type": "role", "source_ref": "enrichment_field:role", "claim": "VP Engineering"},
    {"source_type": "inferred", "source_ref": "icp_fit:enterprise_saas", "claim": "onboarding 2x customers post-raise"}
  ],
  "token_count": 184
}`,
      notes: 'The validator confirmed 5 of 6 sources are first-class (trigger event, content, connection, tech stack, role). The 6th (inferred) is flagged but accepted because it is a logical inference from the funding event, not a fabricated fact.',
    },
    {
      tool: 'Personalization Validator',
      scenario: 'Validate a drafted email that contains a fabricated funding amount.',
      request: `{
  "draft": "Hi Jane, congrats on your $60M Series B! I read your post on scaling Postgres...",
  "lead_id": "l_8842",
  "channel": "email",
  "subject": "Saw the Series B — quick thought"
}`,
      response: `{
  "valid": false,
  "claims_checked": 4,
  "claims_supported": 3,
  "claims_unsupported": 1,
  "sources_cited": 3,
  "issues": [
    {
      "type": "unsupported_claim",
      "offending_sentence": "Congrats on your $60M Series B!",
      "claim": "$60M Series B",
      "reason": "Lead enrichment shows $40M Series B raised 2026-08-15 (source: sage_insight_i_2241). The draft states $60M, which is fabricated.",
      "suggested_rewrite": "Congrats on your $40M Series B!"
    }
  ],
  "validation_report": {
    "personalization_points_count": 5,
    "min_required": 5,
    "spam_phrase_scan": "pass",
    "subject_line_score": 0.82,
    "brand_voice_check": "pass",
    "channel_format_check": "pass"
  },
  "rewrite_attempts_remaining": 2,
  "recommendation": "rewrite"
}`,
      notes: 'The validator caught a $20M discrepancy between the draft ($60M) and the source ($40M). This is the most common hallucination pattern; the rewrite is automatic with the patched prompt.',
    },
    {
      tool: 'Outreach.io Integration',
      scenario: 'Push an assembled 7-touchpoint sequence to Outreach.io for execution.',
      request: `{
  "method": "POST",
  "path": "/sequences",
  "headers": {
    "Authorization": "Bearer {{oauth_token}}",
    "Content-Type": "application/vnd.api+json"
  },
  "body": {
    "data": {
      "type": "sequence",
      "attributes": {
        "name": "LR-c_412-l_8842",
        "ownerId": 1234,
        "state": "active",
        "touches": [
          {"channel": "email", "subject": "Saw the Series B — quick Postgres scaling thought", "body": "...", "delay": 0, "variantId": "l_8842_t1_a"},
          {"channel": "linkedin", "body": "Hi Jane, congrats on the raise...", "delay": 2, "variantId": "l_8842_t2_a"},
          {"channel": "email", "subject": "How Stripe scaled Postgres (teardown)", "body": "...", "delay": 4, "variantId": "l_8842_t3_b"},
          {"channel": "linkedin", "body": "Did the teardown land OK?", "delay": 6, "variantId": "l_8842_t4_a"},
          {"channel": "phone", "script": "Hi Jane, Sam from LeadReach...", "voicemail": "Hi Jane, Sam — 5 min call?", "delay": 8, "variantId": "l_8842_t5_a"},
          {"channel": "email", "subject": "Different angle: cost-per-query", "body": "...", "delay": 10, "variantId": "l_8842_t6_c"},
          {"channel": "email", "subject": "Closing the loop", "body": "...", "delay": 13, "variantId": "l_8842_t7_a"}
        ]
      }
    }
  }
}`,
      response: `{
  "data": {
    "id": "sq_9921",
    "type": "sequence",
    "attributes": {
      "name": "LR-c_412-l_8842",
      "state": "active",
      "ownerId": 1234,
      "createdAt": "2026-09-08T14:23:01Z",
      "touchCount": 7
    }
  },
  "webhook_subscription": {
    "id": "wh_8842",
    "url": "https://api.leadreach.io/webhooks/outreach",
    "events": ["sequence.started", "email.sent", "email.opened", "email.clicked", "email.replied", "sequence.completed"]
  },
  "sync_status": "success",
  "enrolled_at": "2026-09-08T14:23:02Z"
}`,
      notes: 'The first touch is scheduled to send at the prospect\'s local 09:30am the next business day. The webhook subscription ensures engagement events flow back into LeadReach for adaptive follow-up.',
    },
    {
      tool: 'Cadence Scheduler',
      scenario: 'Compute scheduled send times for a 14-day cadence in the prospect\'s local timezone.',
      request: `{
  "lead_id": "l_8842",
  "timezone": "America/Los_Angeles",
  "cadence": "14_day_7_touch",
  "start_date": "2026-09-09",
  "skip_weekends": true,
  "default_send_time": "09:30"
}`,
      response: `{
  "lead_id": "l_8842",
  "timezone": "America/Los_Angeles",
  "cadence": "14_day_7_touch",
  "touchpoints": [
    {"touch": 1, "channel": "email", "scheduled_at": "2026-09-09T09:30:00-07:00", "day_offset": 1},
    {"touch": 2, "channel": "linkedin", "scheduled_at": "2026-09-11T09:30:00-07:00", "day_offset": 3},
    {"touch": 3, "channel": "email", "scheduled_at": "2026-09-13T09:30:00-07:00", "day_offset": 5},
    {"touch": 4, "channel": "linkedin", "scheduled_at": "2026-09-15T09:30:00-07:00", "day_offset": 7},
    {"touch": 5, "channel": "phone", "scheduled_at": "2026-09-17T09:30:00-07:00", "day_offset": 9},
    {"touch": 6, "channel": "email", "scheduled_at": "2026-09-19T09:30:00-07:00", "day_offset": 11},
    {"touch": 7, "channel": "email", "scheduled_at": "2026-09-22T09:30:00-07:00", "day_offset": 14}
  ],
  "weekends_skipped": 2,
  "ooo_blocks": 0
}`,
      notes: 'Day offsets 5 (Sat) and 6 (Sun) are skipped; touchpoint 3 lands on Sunday in raw computation and is pushed to Monday. Day 7 (Sunday) pushes touch 4 to Monday. Net effect: 14-day cadence spans 14 calendar days but 10 business days.',
    },
  ],

  examples: [
    {
      scenario: 'Compose a trigger-event-led sequence for an A-list lead with a recent Series B.',
      input: `Lead: Jane Chen, VP Engineering at Acme Cloud. Lead score: 88 (A-list). Series B raised $40M on 2026-08-15. Tech stack: Kubernetes, Postgres, Snowflake. Recent blog: "Scaling Postgres to 10TB". Shared connection: Marcus Lee (ex-Stripe). Campaign: enterprise database optimization.`,
      reasoning: `Lead is A-list (score 88 ≥ 85), so use the 7-day compressed cadence instead of the standard 14-day. The recent Series B (within 14 days) is the strongest trigger event — use trigger-event-led angle for the opener. Personalization points available: 8 (role, company event, tech stack, content published, shared connection, inferred scale challenge, inferred budget, ICP fit). Select 7 to embed (drop inferred budget as it is too speculative). Generate 3 variants because the lead is A-list (Variant C is included for high-fit leads).`,
      output: `{
  "lead_id": "l_8842",
  "lead_score": 88,
  "cadence": "7_day_alist",
  "angle": "trigger-event-led",
  "personalization_points_extracted": 8,
  "personalization_points_used": 7,
  "variants_generated": 3,
  "sequence_manifest": [
    {"touch": 1, "channel": "email", "scheduled_at": "2026-09-09T09:30:00-07:00", "variant": "l_8842_t1_a", "angle": "trigger-event-led"},
    {"touch": 2, "channel": "phone", "scheduled_at": "2026-09-10T09:30:00-07:00", "variant": "l_8842_t2_a", "angle": "trigger-event-led"},
    {"touch": 3, "channel": "email", "scheduled_at": "2026-09-11T09:30:00-07:00", "variant": "l_8842_t3_b", "angle": "peer-comparison-led"},
    {"touch": 4, "channel": "linkedin", "scheduled_at": "2026-09-12T09:30:00-07:00", "variant": "l_8842_t4_a", "angle": "insight-led"},
    {"touch": 5, "channel": "phone", "scheduled_at": "2026-09-13T09:30:00-07:00", "variant": "l_8842_t5_a", "angle": "insight-led"},
    {"touch": 6, "channel": "email", "scheduled_at": "2026-09-14T09:30:00-07:00", "variant": "l_8842_t6_c", "angle": "question-led"},
    {"touch": 7, "channel": "email", "scheduled_at": "2026-09-15T09:30:00-07:00", "variant": "l_8842_t7_a", "angle": "breakup"}
  ],
  "validation": {"overall_pass": true, "checks_run": 4, "checks_passed": 4},
  "crm_sync": {"tool": "outreach", "sequence_id": "sq_9921", "status": "success"},
  "first_send_at": "2026-09-09T09:30:00-07:00"
}`,
      outcome: 'Sequence synced to Outreach.io on 2026-09-08. Touch 1 sent on 2026-09-09 09:30 PT. Opened 10:42 PT same day. Reply received 14:21 PT: "Interested — send times next week." Meeting booked for 2026-09-17. Sequence paused; lead moved to Engaged stage.',
    },
    {
      scenario: 'Handle a reply classified as positive with confidence 0.92.',
      input: `Reply received on 2026-09-09 14:21 PT from lead l_8842 (Jane Chen). Reply text: "Yes, this is interesting. Send me 2 time slots next week and I'll forward to my chief of staff to confirm." Sequence status: touch 1 sent, touch 2 not yet sent.`,
      reasoning: `Reply classifier returns positive with confidence 0.92 (≥0.7 threshold, so auto-act is permitted). Per the engagement-adaptive playbook: trigger meeting-booking flow within 5 minutes. Generate 2 specific time slots within 48 hours in the prospect\'s local timezone (Mon-Tue next week). Pause the remaining sequence (touches 2-7) since the prospect has engaged. Send the proposed slots and a calendar invite link.`,
      output: `{
  "reply_id": "r_8842",
  "lead_id": "l_8842",
  "classification": "positive",
  "confidence": 0.92,
  "action": "trigger_meeting_booking",
  "sla": "5 minutes",
  "meeting_proposal": {
    "slots": [
      {"start": "2026-09-16T10:00:00-07:00", "end": "2026-09-16T10:15:00-07:00"},
      {"start": "2026-09-17T14:00:00-07:00", "end": "2026-09-17T14:15:00-07:00"}
    ],
    "duration_minutes": 15,
    "calendar_invite_link": "https://cal.leadreach.io/bard/l_8842/r_8842"
  },
  "sequence_state_update": {
    "paused_touches": [2, 3, 4, 5, 6, 7],
    "status": "engaged_positive",
    "lead_pipeline_stage": "engaged"
  },
  "outbound_message": "Thanks Jane — appreciate the quick reply. Two slots next week:\\n\\n- Mon 9/16 10:00-10:15am PT\\n- Tue 9/17 2:00-2:15pm PT\\n\\nBooking link: https://cal.leadreach.io/bard/l_8842/r_8842\\n\\nI'll send the benchmark data ahead so we can skip the intro and get into the specifics.\\n\\n— Sam"
}`,
      outcome: 'Jane confirmed Tue 9/17 2:00pm PT within 18 minutes. Calendar invite sent. Lead moved to Engaged stage. Sequence marked completed (not abandoned) — touches 2-7 cancelled because the engagement goal was met on Touch 1.',
    },
    {
      scenario: 'Detect and reject a hallucinated funding amount during validation.',
      input: `Drafted email for lead l_8842 contains: "Congrats on your $60M Series B!" Lead enrichment shows $40M Series B raised 2026-08-15 (source: sage_insight_i_2241).`,
      reasoning: `The personalization validator parses each sentence and identifies the factual claim "$60M Series B". It checks the personalization source registry for a matching source. The registry contains "Series B raised $40M" with source sage_insight_i_2241. The claim ($60M) does not match the source ($40M); the claim is unsupported. The validator flags this as a hallucination and returns the draft for rewrite with a suggested correction. The composer retries with the patched prompt that explicitly states the correct figure.`,
      output: `{
  "draft_id": "d_8842_v1",
  "validation_result": "fail",
  "issues": [
    {
      "type": "unsupported_claim",
      "offending_sentence": "Congrats on your $60M Series B!",
      "claim": "$60M Series B",
      "source_checked": "sage_insight_i_2241",
      "actual_value": "$40M Series B raised 2026-08-15",
      "suggested_rewrite": "Congrats on your $40M Series B!",
      "severity": "block"
    }
  ],
  "rewrite_attempts_remaining": 2,
  "recommendation": "rewrite_with_patched_prompt",
  "patched_prompt_addition": "Use only the verified funding amount: $40M Series B raised 2026-08-15 (source: sage_insight_i_2241). Do not round up or estimate."
}`,
      outcome: 'Composer retried with the patched prompt. Second draft stated the correct $40M figure and passed validation. The corrected email was sent on schedule and received a positive reply within 4 hours.',
    },
    {
      scenario: 'Engagement-adaptive follow-up for opened-no-reply after Touch 1.',
      input: `Lead l_8842: Touch 1 (email) opened at 2026-09-09 10:42 PT but no reply received by 2026-09-11 (Touch 3 scheduled send time). Touch 2 (LinkedIn) sent 2026-09-11, connection accepted 2026-09-12, but no LinkedIn message reply.`,
      reasoning: `Engagement signal: email opened but no reply (opened-no-reply branch). The prospect showed interest by opening but did not respond. Per the engagement-adaptive playbook, Touch 3 must reference the content they opened (the Series B email subject line) and offer a different angle. The peer-comparison-led angle is the right choice for Touch 3 — it shifts the value proposition from "congrats on the raise" to "here\'s what Stripe did differently".`,
      output: `{
  "lead_id": "l_8842",
  "engagement_signal": {
    "touch_1_email": {"opened": true, "opened_at": "2026-09-09T10:42:00-07:00", "replied": false},
    "touch_2_linkedin": {"accepted": true, "accepted_at": "2026-09-12T11:15:00-07:00", "replied": false}
  },
  "branch": "opened-no-reply",
  "touch_3_strategy": {
    "channel": "email",
    "angle": "peer-comparison-led",
    "references_opened_content": "subject='Saw the Series B — quick Postgres scaling thought'",
    "new_value_proposition": "How Stripe scaled Postgres to 10TB without re-architecting (teardown)",
    "cta": "reply_yes_no",
    "scheduled_at": "2026-09-13T09:30:00-07:00"
  },
  "composed_subject": "How Stripe scaled Postgres to 10TB (teardown)",
  "composed_body": "Hi Jane,\\n\\nFollowing up on my note about Postgres scaling — I put together a teardown of how Marcus Lee\'s team at Stripe scaled to 10TB without re-architecting. Same partitioning approach you described in your blog post, with one difference that cut their query latency by 47%.\\n\\nWant me to send the teardown? Reply yes and I\\'ll forward.\\n\\n— Sam",
  "validation": {"overall_pass": true, "personalization_points_used": 6}
}`,
      outcome: 'Touch 3 sent on schedule. Jane replied "yes, send it" within 3 hours. Teardown delivered. Touch 4 (LinkedIn) became a follow-up on the teardown rather than a generic nudge. Reply rate on this adaptive touch was 47% vs. 12% baseline for cold touch 3.',
    },
  ],

  guardrails: [
    {
      rule: 'Never send a message with fewer than 5 verifiable personalization points.',
      rationale: 'Generic outreach erodes reply rates, damages sender reputation, and trains prospects to ignore future messages.',
      enforcement: 'The personalization validator counts cited personalization points; drafts below 5 are rejected and returned for rewrite. After 3 failed attempts, the lead is flagged for re-enrichment.',
      severity: 'block',
    },
    {
      rule: 'Never send a message containing an uncited factual claim.',
      rationale: 'Uncited claims are hallucination risk; fabricated facts about a prospect (wrong funding amount, fake quote, invented hire) destroy trust and create legal exposure.',
      enforcement: 'The personalization validator parses every sentence and identifies factual claims; each must trace to a source. Unsupported claims trigger a rewrite.',
      severity: 'block',
    },
    {
      rule: 'Never send a message containing a banned spam-trigger phrase.',
      rationale: 'Spam-trigger phrases land messages in the spam folder, damaging deliverability for all future sends from the domain.',
      enforcement: 'The spam-phrase scanner runs on every draft against the 60+ item blocklist. Matches trigger an automatic rewrite before send.',
      severity: 'block',
    },
    {
      rule: 'Never auto-book a meeting on a reply classified with confidence < 0.7.',
      rationale: 'Misclassifying a negative or out-of-scope reply as positive and auto-booking a meeting creates an embarrassing experience and damages the relationship.',
      enforcement: 'The reply classifier returns a confidence score; replies with confidence < 0.7 are routed to human review instead of triggering the meeting-booking flow.',
      severity: 'block',
    },
    {
      rule: 'Never exceed 3 message variants per lead.',
      rationale: 'Beyond 3 variants, A/B signal degrades, statistical significance takes too long to reach, and the sequence becomes incoherent.',
      enforcement: 'The A/B Test Manager enforces a hard cap of 3 variants per lead; requests for Variant D are rejected and logged.',
      severity: 'block',
    },
    {
      rule: 'Never push a sequence to the CRM without the prospect\'s timezone configured.',
      rationale: 'Sending at 3am prospect local time destroys open rates and signals laziness. Timezone misconfiguration is a top-3 cause of low engagement.',
      enforcement: 'The Cadence Scheduler checks for prospect timezone; if missing, it defaults to the campaign owner\'s timezone with a flag for correction. Sequences cannot be assembled without a timezone decision.',
      severity: 'warn',
    },
    {
      rule: 'Always include an unsubscribe link in every email.',
      rationale: 'CAN-SPAM, GDPR, and CASL require a functional unsubscribe mechanism in every commercial email. Non-compliance carries legal and financial risk.',
      enforcement: 'The email formatter injects an unsubscribe link into every email body; the validator rejects any email draft missing the link.',
      severity: 'block',
    },
    {
      rule: 'Always skip weekends (unless explicitly configured otherwise).',
      rationale: 'Weekend sends have lower open rates, higher spam complaint rates, and signal to the prospect that the sender is not respectful of working hours.',
      enforcement: 'The Cadence Scheduler skips Saturday and Sunday by default; the skip_weekends flag can be overridden per campaign but requires explicit configuration.',
      severity: 'warn',
    },
    {
      rule: 'Always emit sequence.assembled within 30 seconds of receiving lead.qualified.',
      rationale: 'Longer compositions stall the downstream pipeline and risk missing the engagement window for time-sensitive trigger events.',
      enforcement: 'A watchdog timer fires at 30s; if sequence.assembled has not been emitted, an alert is raised and the orchestrator is notified.',
      severity: 'warn',
    },
    {
      rule: 'Always attribute reply outcomes to the specific variant that triggered them.',
      rationale: 'Without variant attribution, A/B winners cannot be declared, the template library cannot auto-promote, and the system cannot learn.',
      enforcement: 'Every reply event is tagged with the variant_id of the touchpoint that triggered it; the A/B Test Manager uses these tags to declare winners at n=30.',
      severity: 'block',
    },
  ],

  decisionMatrix: [
    {
      condition: 'Lead score ≥ 85 (A-list) with a trigger event in the last 14 days.',
      action: 'Use 7-day compressed cadence (not 14-day). Trigger-event-led angle for Touch 1. Generate 3 variants (A, B, C). Require human review pass before send.',
      rationale: 'A-list leads with fresh triggers are the highest-converting segment; faster cadence and deeper personalization maximize the chance of catching the prospect during the trigger window.',
      example: 'Jane Chen (score 88) closed $40M Series B 8 days ago. 7-day cadence selected. Variant A trigger-event-led email sent Day 1 09:30 PT. Reply received Day 1 14:21 PT.',
    },
    {
      condition: 'Lead score 70-84 (B-list) with a Sage insight but no fresh trigger.',
      action: 'Use 14-day standard cadence. Insight-led angle for Touch 1. Generate 2 variants (A, B). No human review required.',
      rationale: 'B-list leads convert at lower rates than A-list; standard cadence and 2 variants are sufficient. Insight-led angle still anchors the message in research.',
      example: 'Marcus Patel (score 76) has Sage insight on competitive positioning vs. Datadog. 14-day cadence, 2 variants, insight-led angle on Touch 1.',
    },
    {
      condition: 'Lead score 50-69 (C-list) with sparse enrichment data.',
      action: 'Use 14-day standard cadence. Question-led angle for Touch 1 (lowest personalization requirement). Generate 2 variants. Flag for re-enrichment if Touch 1 personalization points < 5.',
      rationale: 'C-list leads have lower ICP fit and may need re-enrichment before outreach. Question-led angle requires fewer personalization points and is appropriate for sparse data.',
      example: 'Alex Rivera (score 58) has only 3 personalization points available. Touch 1 flagged for re-enrichment; orchestrator re-dispatches to Forge before composition.',
    },
    {
      condition: 'Prospect opened email but did not reply within 48 hours.',
      action: 'Branch to opened-no-reply. Next touch references the opened subject line and offers a different angle (peer-comparison or case study). Do not repeat the previous angle.',
      rationale: 'An open without a reply indicates interest but insufficient motivation to respond. A different angle with concrete value (teardown, benchmark, case study) lifts the response rate.',
      example: 'Touch 1 opened 10:42 PT, no reply by 14:21 PT. Touch 3 (originally scheduled for Day 5) shifted to peer-comparison angle referencing the opened subject line.',
    },
    {
      condition: 'Prospect replied positively (confidence ≥ 0.7).',
      action: 'Trigger meeting-booking flow within 5 minutes. Generate 2 time slots within 48 hours in prospect local timezone. Send booking link. Pause remaining sequence touches.',
      rationale: 'The half-life of prospect intent is short; slow response to a positive reply dramatically reduces meeting-show rate.',
      example: 'Jane replied "yes, send times" at 14:21 PT. Booking flow triggered at 14:22 PT. Two slots proposed for Mon 10am and Tue 2pm PT. Jane confirmed Tue 2pm within 18 minutes.',
    },
    {
      condition: 'Prospect replied negatively (confidence ≥ 0.7).',
      action: 'Send one-line acknowledgement. Ask for permission to follow up in 3-6 months. Move lead to nurture stage. Do not push remaining touches.',
      rationale: 'Pushing through a negative reply damages the relationship and risks spam complaints. Nurture preserves the relationship for a future window.',
      example: 'Marcus replied "not interested, we use Datadog". Acknowledgement sent: "Got it — I\'ll close the loop. Mind if I reach out in Q1 2027 in case priorities shift?" Lead moved to nurture.',
    },
    {
      condition: 'Prospect silent across 4 touches (no open, no click, no LinkedIn accept).',
      action: 'Continue cadence to Day 14 breakup email. Do not extend the sequence beyond 7 touches. After breakup email, move lead to cold nurture (90-day re-attempt).',
      rationale: 'Silence across 4 touches indicates either disinterest or wrong contact. The breakup email is the highest-reply-rate single touch and is the appropriate close. Extending beyond 7 touches is harassment risk.',
      example: 'Lead score 64, 4 touches silent. Day 14 breakup email sent: "Should I close your file?" Reply received Day 15: "Actually yes — wrong timing, reach out Q1."',
    },
    {
      condition: 'Reply classifier returns confidence < 0.7.',
      action: 'Do not auto-act. Route the reply to human review with the lead context, the reply text, and the classifier\'s top-3 predicted classes.',
      rationale: 'Low-confidence classification is a hallucination risk; auto-acting on a misclassified reply can damage the relationship (e.g. booking a meeting the prospect didn\'t want).',
      example: 'Reply text: "Maybe, send more info." Classifier returns: positive 0.42, objection 0.38, out-of-scope 0.20. Confidence 0.42 < 0.7 — routed to human SDR for personalized response.',
    },
    {
      condition: 'A/B variant wins consistently (n=30, p<0.05, reply rate > 1.5x control).',
      action: 'Auto-promote the winning variant to the template library as the new default for the persona × industry × stage segment. Retire the underperforming variant.',
      rationale: 'Statistically significant winners should become the new baseline; continuing to send the underperforming variant wastes reply opportunities.',
      example: 'Variant B (peer-comparison-led) for VP Engineering / SaaS / cold achieved 14% reply rate vs. Variant A (insight-led) at 6% over 60 sends. Variant B promoted to template library as default; Variant A retired.',
    },
  ],

  failureModes: [
    {
      failure: 'LLM hallucinates a factual claim about the prospect (wrong funding amount, fabricated quote, invented hire).',
      detection: 'Personalization validator flags unsupported claims during the validation pass; the offending sentence and the source mismatch are logged.',
      mitigation: 'Draft returned to composer with a patched prompt that includes the correct value from the source. Max 3 rewrite attempts before human review.',
      recoveryTime: '< 10 seconds per rewrite cycle; < 30 seconds total if 3 retries needed.',
    },
    {
      failure: 'CRM sync fails (Outreach.io/SalesLoft/HubSpot/Apollo API down or auth expired).',
      detection: 'API call returns 5xx or 401 within 5 seconds; sync_status = "failed".',
      mitigation: 'Sequence is queued locally and retry sync every 5 minutes for up to 5 attempts. If still failing, surface to ops with diagnostic info (auth status, last successful sync, error payload).',
      recoveryTime: '< 25 minutes (5 retries × 5 min backoff) before ops escalation.',
    },
    {
      failure: 'Reply classifier returns low confidence (< 0.7) on a positive reply.',
      detection: 'Classifier confidence score < 0.7 on a reply classified as positive.',
      mitigation: 'Reply routed to human review with the lead context, reply text, and top-3 predicted classes. No auto-action taken. SLA: 2 hours for human response.',
      recoveryTime: '< 2 hours (human SLA); no impact on prospect experience beyond delayed response.',
    },
    {
      failure: 'Email deliverability crisis (sender domain blacklisted or spam complaint spike).',
      detection: 'Postmark or Google Postmaster flags a deliverability drop; bounce rate > 10% or spam complaint rate > 0.1% in a 1-hour window.',
      mitigation: 'SEV-0/SEV-1 triggered. All in-flight sequences paused within 60 seconds via /api/bard/pause-all. Deliverability runbook executed. Composed (but unsent) sequences held until cleared.',
      recoveryTime: '< 24 hours for sender reputation recovery; < 7 days for full blacklist removal if applicable.',
    },
    {
      failure: 'Personalization point extraction returns fewer than 5 points (sparse enrichment).',
      detection: 'Extractor returns < 5 citable personalization points for a lead.',
      mitigation: 'Flag the lead for partial-personalization mode. Notify orchestrator; lead may need re-enrichment via Forge. If re-enrichment fails, compose with available points and tag the sequence as partial.',
      recoveryTime: '< 5 minutes if re-enrichment succeeds; otherwise partial-personalization mode for the duration of the sequence.',
    },
    {
      failure: 'LLM returns malformed output (no body, missing subject, exceeds word limit).',
      detection: 'Validator detects missing required fields (subject, body) or word count > 150 for email.',
      mitigation: 'Retry with patched prompt that explicitly enforces the schema. Temperature reduced by 0.1 per retry (floor 0.4). Max 2 retries before fallback to glm-4.5-air model.',
      recoveryTime: '< 15 seconds per retry; < 45 seconds total before fallback.',
    },
    {
      failure: 'Engagement webhook from CRM/sequence tool is missing or delayed.',
      detection: 'No webhook events received for an active sequence within 24 hours of expected send time.',
      mitigation: 'Bard polls the CRM tool\'s API directly as a fallback; if polling also fails, mark the sequence as "engagement_unknown" and continue sending touches based on schedule (no adaptive branching).',
      recoveryTime: '< 1 hour for polling fallback to kick in; adaptive branching degrades to schedule-based until webhooks resume.',
    },
  ],

  evaluationCases: [
    {
      id: 'eval_bard_001',
      input: 'Compose a single-touch email for lead l_8842 (Jane Chen, VP Engineering, Acme Cloud, Series B $40M, 2026-08-15). Angle: trigger-event-led. Tone: consultative. CTA: book 15-min call.',
      expectedOutput: 'Email with subject ≤60 chars, body ≤150 words, ≥5 personalization points each with a source citation, single CTA (book meeting), plain text, no spam-trigger phrases, validation_pass = true.',
      scoringCriteria: [
        'Subject line ≤60 chars and free of ALL CAPS and spam triggers.',
        'Body ≤150 words.',
        'At least 5 personalization points embedded in the body.',
        'Every factual claim has a source citation in the response metadata.',
        'Single clear CTA (book meeting, reply, or open to call).',
        'Validation passes on all 4 checks (personalization, spam, subject, brand-voice).',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_bard_002',
      input: 'Generate a 7-touchpoint sequence for lead l_8842 with 14-day cadence starting 2026-09-09 in America/Los_Angeles timezone.',
      expectedOutput: 'Sequence manifest with 7 touchpoints mapped to the 14-day cadence, weekend days skipped, send times in prospect local timezone, breakup email on Day 14.',
      scoringCriteria: [
        'Exactly 7 touchpoints in the manifest.',
        'Touch 1 is email on Day 1, Touch 7 is breakup email on Day 14.',
        'All send times are at 09:30 in America/Los_Angeles timezone.',
        'Weekend days (Sat/Sun) are skipped; touchpoints land on business days only.',
        'Each touchpoint has a variant_id for A/B attribution.',
        'Breakup email on Touch 7 has the correct 4-sentence structure.',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_bard_003',
      input: 'A draft contains "Congrats on your $60M Series B!" but the source shows $40M. Validate the draft and recommend action.',
      expectedOutput: 'Validation result = fail. Issue type = unsupported_claim. Suggested rewrite provided. Rewrite attempts remaining = 2. Recommendation = rewrite.',
      scoringCriteria: [
        'Validation result is "fail".',
        'Issue type is "unsupported_claim" or "hallucination".',
        'The offending sentence is correctly identified.',
        'The actual value ($40M) is referenced in the issue.',
        'A suggested rewrite is provided that uses the correct figure.',
        'Recommendation is "rewrite" (not "send" or "escalate_to_human").',
      ],
      passThreshold: 6,
    },
    {
      id: 'eval_bard_004',
      input: 'Reply received: "Yes, send me times next week." Classifier confidence: 0.92. Determine the next action.',
      expectedOutput: 'Classification = positive. Confidence = 0.92 (≥0.7). Action = trigger_meeting_booking. SLA = 5 minutes. Generate 2 time slots within 48 hours in prospect local timezone.',
      scoringCriteria: [
        'Classification is "positive".',
        'Confidence is correctly reported as 0.92.',
        'Confidence ≥0.7 threshold, so auto-act is permitted.',
        'Action is "trigger_meeting_booking".',
        'SLA is "5 minutes" or shorter.',
        'Two time slots are proposed within 48 hours.',
        'Slots are in the prospect\'s local timezone.',
      ],
      passThreshold: 7,
    },
    {
      id: 'eval_bard_005',
      input: 'Lead score = 88 (A-list). Trigger event: Series B raised 8 days ago. Determine the cadence and variant count.',
      expectedOutput: 'Cadence = 7_day_alist. Variant count = 3 (A, B, C). Angle = trigger-event-led for Touch 1. Human review required before send.',
      scoringCriteria: [
        'Cadence is "7_day_alist" (not 14-day standard).',
        'Variant count is 3 (Variant C included for high-fit leads).',
        'Touch 1 angle is "trigger-event-led".',
        'Human review is required before send (high-stakes lead).',
        'Personalization points required = 8 (above the standard minimum of 5).',
      ],
      passThreshold: 5,
    },
  ],
};
