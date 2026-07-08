---
title: "Outreach Cadence Templates — Master Reference"
slug: templates-outreach-cadence
category: template
grade: A
last_reviewed: 2026-07-08
tags: [cadence, multi-channel, timing, frequency, channel-sequencing, persona-based, industry-specific, kpis]
agents: [flow, forge, echo, atlas]
intent_types: [build_sequence, compose_outreach, score_lead]
priority: 95
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "Production-grade multi-channel outreach cadence templates covering email+LinkedIn+phone sequences, timing and frequency optimization, channel sequencing strategies, persona-based and industry-specific cadences, and cadence measurement KPIs."
---

# Outreach Cadence Templates — Master Reference

## 1. Overview

This file defines the canonical outreach cadence templates used by the LeadReach Flow agent for multi-channel sequence orchestration. A cadence specifies *what* channel to use, *when* to use it, *how often*, and in *what order* — across email, LinkedIn, and phone.

**Cadence Architecture:**

| Layer | Purpose | Configuration |
|-------|---------|---------------|
| Channel mix | Which channels to activate | Email + LinkedIn + Phone |
| Step sequence | Order of touches across channels | Step 1, 2, 3... |
| Timing | Day-of-week and time-of-day for each step | Tu/We/Th 08:00–10:00 |
| Frequency | Number of touches per channel per cadence | Email: 4, LinkedIn: 3, Phone: 2 |
| Duration | Total cadence length in business days | 14–21 days |
| Exit conditions | When to stop or modify the cadence | Reply, meeting, unsubscribe |

## 2. Multi-Channel Cadence Templates

### 2.1 Standard Cold Cadence (14-Day, 9 Touches)

The default cold cadence for new prospects with no prior engagement. Balanced across three channels.

| Step | Day | Channel | Action | Template | Duration |
|------|-----|---------|--------|----------|----------|
| 1 | 1 (Tue) | Email | First touch — insight lead | `cold_first_touch_insight_lead` | — |
| 2 | 2 (Wed) | LinkedIn | Connect request with personal note | `linkedin_connect_cold` | — |
| 3 | 4 (Fri) | Email | Follow-up #1 — value add | `cold_followup_value_add` | 3 days after step 1 |
| 4 | 7 (Tue) | LinkedIn | Engage with their content (like/comment) | `linkedin_engage_content` | — |
| 5 | 8 (Wed) | Phone | First call attempt + voicemail | `phone_first_call_vm` | — |
| 6 | 9 (Thu) | Email | Follow-up #2 — question breakup | `cold_followup_question_breakup` | 5 days after step 3 |
| 7 | 11 (Mon) | LinkedIn | Direct message with resource | `linkedin_dm_resource` | — |
| 8 | 12 (Tue) | Phone | Second call attempt + different voicemail | `phone_second_call_vm` | 4 days after step 5 |
| 9 | 14 (Thu) | Email | Breakup email | `cold_breakup_email` | 5 days after step 6 |

**Cadence JSON:**

```json
{
  "cadence_id": "cold_standard_14d",
  "cadence_type": "cold",
  "total_duration_days": 14,
  "total_touches": 9,
  "channel_distribution": {
    "email": 4,
    "linkedin": 3,
    "phone": 2
  },
  "steps": [
    {
      "step": 1,
      "day": 1,
      "day_of_week": "tuesday",
      "channel": "email",
      "action": "first_touch",
      "template_id": "cold_first_touch_insight_lead",
      "send_window": "08:00-10:00_local",
      "personalization_level": 3
    },
    {
      "step": 2,
      "day": 2,
      "day_of_week": "wednesday",
      "channel": "linkedin",
      "action": "connection_request",
      "template_id": "linkedin_connect_cold",
      "send_window": "09:00-11:00_local",
      "note_max_chars": 300
    },
    {
      "step": 3,
      "day": 4,
      "day_of_week": "friday",
      "channel": "email",
      "action": "follow_up_1",
      "template_id": "cold_followup_value_add",
      "send_window": "08:00-10:00_local",
      "delay_after_step": 1,
      "delay_days": 3
    },
    {
      "step": 4,
      "day": 7,
      "day_of_week": "tuesday",
      "channel": "linkedin",
      "action": "content_engagement",
      "template_id": "linkedin_engage_content",
      "send_window": "12:00-14:00_local"
    },
    {
      "step": 5,
      "day": 8,
      "day_of_week": "wednesday",
      "channel": "phone",
      "action": "call_attempt_1",
      "template_id": "phone_first_call_vm",
      "call_window": "10:00-16:00_local",
      "max_ring_time_seconds": 25,
      "voicemail_if_no_answer": true
    },
    {
      "step": 6,
      "day": 9,
      "day_of_week": "thursday",
      "channel": "email",
      "action": "follow_up_2",
      "template_id": "cold_followup_question_breakup",
      "send_window": "08:00-10:00_local",
      "delay_after_step": 3,
      "delay_days": 5
    },
    {
      "step": 7,
      "day": 11,
      "day_of_week": "monday",
      "channel": "linkedin",
      "action": "direct_message",
      "template_id": "linkedin_dm_resource",
      "send_window": "09:00-11:00_local"
    },
    {
      "step": 8,
      "day": 12,
      "day_of_week": "tuesday",
      "channel": "phone",
      "action": "call_attempt_2",
      "template_id": "phone_second_call_vm",
      "call_window": "14:00-17:00_local",
      "different_time_than_step_5": true,
      "voicemail_if_no_answer": true
    },
    {
      "step": 9,
      "day": 14,
      "day_of_week": "thursday",
      "channel": "email",
      "action": "breakup",
      "template_id": "cold_breakup_email",
      "send_window": "08:00-10:00_local",
      "delay_after_step": 6,
      "delay_days": 5
    }
  ],
  "exit_conditions": [
    { "trigger": "email_reply", "action": "pause_cadence", "notify": "assigned_rep" },
    { "trigger": "linkedin_reply", "action": "pause_cadence", "notify": "assigned_rep" },
    { "trigger": "meeting_booked", "action": "end_cadence", "move_to": "post_meeting_sequence" },
    { "trigger": "unsubscribe", "action": "end_cadence", "suppress": "email_channel" },
    { "trigger": "cadence_complete", "action": "mark_cold", "move_to": "nurture_pool" }
  ]
}
```

### 2.2 Aggressive Cold Cadence (10-Day, 12 Touches)

For high-priority targets (A+ scored leads) where speed matters.

| Step | Day | Channel | Action | Notes |
|------|-----|---------|--------|-------|
| 1 | 1 (Mon) | Email | First touch — trigger event | Same-day trigger response |
| 2 | 1 (Mon) | LinkedIn | Connect request | Same day as email |
| 3 | 2 (Tue) | Phone | First call attempt | No voicemail on first attempt |
| 4 | 3 (Wed) | Email | Follow-up #1 — value add | 2 days after first touch |
| 5 | 4 (Thu) | LinkedIn | Engage + DM | Warm the connection |
| 6 | 5 (Fri) | Phone | Second call + voicemail | Different time of day |
| 7 | 6 (Mon) | Email | Follow-up #2 — question | 3 days after follow-up #1 |
| 8 | 7 (Tue) | LinkedIn | Resource share | Link to case study |
| 9 | 8 (Wed) | Phone | Third call attempt | Try direct dial if available |
| 10 | 9 (Thu) | Email | Social proof follow-up | Peer company results |
| 11 | 10 (Fri) | LinkedIn | Final DM — breakup style | "No worries if not a fit" |
| 12 | 10 (Fri) | Email | Breakup email | Coordinated with LinkedIn |

### 2.3 Gentle Warm Cadence (21-Day, 6 Touches)

For warm leads who have shown engagement but haven't replied yet. Slower pace, lower pressure.

| Step | Day | Channel | Action | Notes |
|------|-----|---------|--------|-------|
| 1 | 1 | Email | Personalized follow-up | Reference their engagement |
| 2 | 5 | LinkedIn | Connect request | Mention the email |
| 3 | 8 | Email | Value add — share resource | No ask |
| 4 | 12 | LinkedIn | Engage with content | Warm the relationship |
| 5 | 16 | Email | Soft question | "Is this still relevant?" |
| 6 | 21 | Email | Breakup (gentle) | "Closing the loop" |

### 2.4 Event Follow-Up Cadence (7-Day, 5 Touches)

Fast-track cadence for event leads. Speed is critical — interest decays 50% within 48 hours.

| Step | Day | Channel | Action | Notes |
|------|-----|---------|--------|-------|
| 1 | 0 (Same day) | Email | Thank you + promised resource | Within 2 hours of event |
| 2 | 1 | LinkedIn | Connect request | Reference event |
| 3 | 2 | Email | Follow-up — deeper resource | Build on first touch |
| 4 | 4 | Phone | Quick call attempt | "Following up from {{event}}" |
| 5 | 7 | Email | Final follow-up + CTA | "Open to a 15-min call?" |

## 3. Timing and Frequency Frameworks

### 3.1 Optimal Send Times — Email

Based on LeadReach aggregate data across 2M+ cold emails (2024–2026):

| Day | Open Rate | Reply Rate | Recommendation |
|-----|-----------|------------|----------------|
| Monday | 22% | 4% | Avoid for cold first touch (inbox overload) |
| Tuesday | 28% | 8% | **Best day for first touch and follow-ups** |
| Wednesday | 27% | 9% | **Strong day, especially morning** |
| Thursday | 25% | 7% | Good for follow-ups and breakup emails |
| Friday | 20% | 5% | Avoid for first touch; OK for low-pressure follow-up |
| Saturday | 12% | 2% | Never send cold outreach |
| Sunday | 10% | 1% | Never send cold outreach |

**Optimal Time Windows by Timezone:**

| Timezone | Primary Window | Secondary Window | Rationale |
|----------|---------------|-----------------|-----------|
| US Eastern | 08:00–10:00 ET | 14:00–15:00 ET | Pre-meeting inbox check + post-lunch |
| US Pacific | 08:00–10:00 PT | 14:00–15:00 PT | Same pattern, adjusted for PT |
| UK / GMT | 09:00–11:00 GMT | 14:00–15:00 GMT | UK workday starts later |
| EU Central | 09:00–11:00 CET | 14:00–15:00 CET | Aligned with continental workday |
| Australia AEST | 09:00–11:00 AEST | 14:00–15:00 AEST | Morning check + post-lunch |

### 3.2 Optimal Send Times — LinkedIn

| Day | Connection Accept Rate | DM Reply Rate | Recommendation |
|-----|----------------------|---------------|----------------|
| Tuesday | 32% | 18% | **Best day** |
| Wednesday | 30% | 17% | Strong |
| Thursday | 28% | 15% | Good |
| Monday | 25% | 12% | Moderate |
| Friday | 22% | 10% | Lower |
| Weekend | 15% | 8% | Avoid |

**Optimal LinkedIn Time Windows:**

| Action | Best Time | Rationale |
|--------|-----------|-----------|
| Connection request | 09:00–11:00 local | Morning LinkedIn check |
| Content engagement | 12:00–14:00 local | Lunch scroll |
| Direct message | 09:00–10:00 or 16:00–17:00 | Start/end of day check |

### 3.3 Optimal Call Times — Phone

| Time (Prospect Local) | Connect Rate | Conversation Rate | Best For |
|----------------------|-------------|-------------------|----------|
| 08:00–09:00 | 12% | 8% | C-suite (before meetings start) |
| 10:00–11:30 | 18% | 14% | **Best overall window** |
| 13:00–14:00 | 10% | 6% | Post-lunch (avoid if possible) |
| 15:00–16:30 | 15% | 11% | Good secondary window |
| 17:00–18:00 | 8% | 5% | Catch executives wrapping up |

**Day-of-Week Phone Effectiveness:**

| Day | Connect Rate | Best Persona |
|-----|-------------|-------------|
| Tuesday | 22% | All personas |
| Wednesday | 20% | Director+ |
| Thursday | 18% | Manager level |
| Wednesday PM | 15% | C-suite (post-board meeting) |
| Friday AM | 10% | Last resort only |

### 3.4 Frequency Caps

| Channel | Maximum per Prospect | Maximum per Day (same domain) | Cooldown Between Same Channel |
|---------|---------------------|------------------------------|-------------------------------|
| Email | 4 per cadence | 1 per 48 hours | 3–5 business days |
| LinkedIn | 3 per cadence | 1 per 24 hours | 2–4 business days |
| Phone | 3 per cadence | 1 per 24 hours | 3–5 business days |
| Total (all channels) | 10 per cadence | 2 per day | Varies by channel |

## 4. Channel Sequencing Strategies

### 4.1 The "Email-First" Strategy (Default)

Start with email to establish a written record, then add channels as the cadence progresses.

```
Email → LinkedIn → Email → LinkedIn Engage → Phone → Email → LinkedIn DM → Phone → Email (breakup)
```

**When to Use:**
- Standard cold outreach (no prior engagement)
- Data-compliant outreach (email has the clearest opt-out mechanism)
- High-volume campaigns (email is most scalable)

### 4.2 The "Social-First" Strategy

Start with LinkedIn to warm the relationship before email arrives in their inbox.

```
LinkedIn Connect → LinkedIn Engage → Email → LinkedIn DM → Email → Phone → Email → LinkedIn DM → Email (breakup)
```

**When to Use:**
- High-value targets where you want to build familiarity first
- Prospects who are active on LinkedIn (posting frequency > 2x/week)
- Situations where email deliverability is uncertain (new sending domain)

### 4.3 The "Phone-First" Strategy

Lead with a phone call for time-sensitive opportunities.

```
Phone → Email (reference call) → LinkedIn Connect → Email → Phone → LinkedIn DM → Email → Email (breakup)
```

**When to Use:**
- Trigger-event outreach (same-day urgency)
- Warm referrals (call is expected)
- Enterprise targets with direct dial available
- Smaller territory where call volume is manageable

### 4.4 The "Convergent" Strategy

Hit multiple channels on the same day to create a coordinated impression.

```
Day 1:  Email + LinkedIn Connect
Day 3:  Email (value add)
Day 5:  Phone + LinkedIn Engage
Day 7:  Email (question)
Day 10: LinkedIn DM + Phone
Day 14: Email (breakup)
```

**When to Use:**
- A+ priority leads requiring aggressive pursuit
- Short buying windows (quarter-end, budget deadline)
- When competitive displacement is the goal

### 4.5 Strategy Selection Matrix

| Condition | Strategy | Rationale |
|-----------|----------|-----------|
| No prior engagement, standard ICP | Email-First | Default, proven, scalable |
| Prospect active on LinkedIn | Social-First | Warms inbox, higher email open rate |
| Trigger event, same-day urgency | Phone-First | Speed to conversation |
| A+ lead, short window | Convergent | Maximum presence, urgency signal |
| Warm introduction from mutual contact | Phone-First | Call is expected and welcome |
| Post-event lead | Email-First + fast cadence | Speed + written follow-up |
| Re-engagement (90+ days cold) | Email-Only (gentle) | Low pressure, single channel |

## 5. Warm vs Cold Cadences

### 5.1 Warm Cadence Principles

Warm prospects have had prior interaction (previous conversation, event meeting, referral, content download). Key differences from cold cadences:

| Parameter | Cold Cadence | Warm Cadence |
|-----------|-------------|-------------|
| Duration | 14–21 days | 7–14 days |
| Total touches | 8–12 | 4–7 |
| Channel spread | Multi-channel | 1–2 primary channels |
| CTA commitment level | Low (permission to share) | Medium (15-min call) |
| Personalization requirement | Level 3+ | Level 4+ |
| Send time flexibility | Strict windows | More flexible |
| Breakup email | Required | Optional |
| Follow-up frequency | 3–5 day gaps | 2–3 day gaps |

### 5.2 Warm Cadence by Source

| Lead Source | Primary Channel | Cadence Length | Touch Count | First CTA |
|------------|----------------|---------------|-------------|-----------|
| Referral | Phone + Email | 7 days | 4 | "Open to connecting?" |
| Event meeting | Email + LinkedIn | 7 days | 5 | "Great meeting you..." |
| Website demo request | Email + Phone | 3 days | 3 | "Schedule your demo" |
| Content download | Email only | 14 days | 4 | "Want the full guide?" |
| Webinar attendee | Email + LinkedIn | 10 days | 5 | "Thanks for attending..." |
| Inbound chat | Email + Phone | 3 days | 3 | "Following up on your question" |
| Re-engaged (nurture) | Email | 14 days | 3 | "Still interested in {{topic}}?" |

### 5.3 Cold Cadence by ICP Score

| ICP Tier | Cadence Variant | Duration | Touches | Aggressiveness |
|----------|----------------|----------|---------|---------------|
| A+ | Aggressive (10-day) | 10 days | 12 | High |
| A | Standard (14-day) | 14 days | 9 | Medium |
| B | Standard (14-day) | 14 days | 9 | Medium |
| C | Gentle (21-day) | 21 days | 6 | Low |
| D | Email-only nurture | 30 days | 3 | Minimal |

## 6. Persona-Based Cadences

### 6.1 C-Suite Cadence (CRO, CEO, CTO, CFO)

C-suite prospects require shorter emails, higher personalization, and a consultative tone. They respond to peer-proof and data-driven approaches.

**Cadence: `persona_c_suite`**

| Step | Day | Channel | Action | Template Variant |
|------|-----|---------|--------|-----------------|
| 1 | 1 (Tue) | Email | First touch — peer proof | `cold_first_touch_peer_proof` |
| 2 | 3 (Thu) | LinkedIn | Connect request — executive note | `linkedin_connect_executive` |
| 3 | 7 (Tue) | Email | Follow-up — benchmark data | `cold_followup_value_add` (data variant) |
| 4 | 10 (Fri) | Phone | Executive-to-executive call | `phone_exec_call` |
| 5 | 12 (Tue) | LinkedIn | DM — share insight/article | `linkedin_dm_executive` |
| 6 | 14 (Thu) | Email | Breakup — peer result reference | `cold_breakup_peer_result` |

**C-Suite Email Guidelines:**
- Maximum 75 words per email
- Lead with data or peer proof, never product features
- Subject line: short, specific, data-driven
- CTA: "Worth a 15-minute conversation?" or "Open to comparing notes?"
- Never use: "I'd love to", "I'm reaching out to", "I wanted to"

**C-Suite Call Script (≤ 60 seconds):**

```
"Hi {{first_name}}, this is {{sender_name}} with LeadReach. I'll be brief — 
I work with {{peer_company_1}} and {{peer_company_2}} on {{topic}}, and the 
results have been {{specific_result}}. Given {{company}}'s {{relevant_context}},
I thought it might be worth a conversation. Would you be open to 15 minutes 
this week? If not, no worries — I can send you a brief summary via email."
```

### 6.2 VP-Level Cadence (VP Sales, VP Marketing, VP Engineering)

VPs are implementers who care about team efficiency and metrics. They respond to operational proof points and framework-based approaches.

**Cadence: `persona_vp`**

| Step | Day | Channel | Action | Template Variant |
|------|-----|---------|--------|-----------------|
| 1 | 1 (Tue) | Email | First touch — operational insight | `cold_first_touch_insight_lead` |
| 2 | 2 (Wed) | LinkedIn | Connect request | `linkedin_connect_cold` |
| 3 | 4 (Fri) | Email | Follow-up — framework/checklist | `cold_followup_value_add` (resource variant) |
| 4 | 7 (Tue) | LinkedIn | Engage with content | `linkedin_engage_content` |
| 5 | 8 (Wed) | Phone | Call — reference framework | `phone_vp_call` |
| 6 | 10 (Fri) | Email | Follow-up — case study | `cold_followup_case_study` |
| 7 | 12 (Tue) | Phone | Second call attempt | `phone_second_call_vm` |
| 8 | 14 (Thu) | Email | Breakup | `cold_breakup_email` |

**VP-Level Email Guidelines:**
- Maximum 125 words per email
- Lead with operational pain + measurable outcome
- Offer frameworks, checklists, and templates
- CTA: "Want me to send the framework?" or "Open to a 20-minute call?"
- Include 1–2 specific metrics or data points

### 6.3 Director-Level Cadence (Director of Sales Ops, Director of RevOps)

Directors are hands-on evaluators who need to see how a solution works before championing it upward.

**Cadence: `persona_director`**

| Step | Day | Channel | Action | Template Variant |
|------|-----|---------|--------|-----------------|
| 1 | 1 (Tue) | Email | First touch — specific use case | `cold_first_touch_insight_lead` |
| 2 | 2 (Wed) | LinkedIn | Connect request | `linkedin_connect_cold` |
| 3 | 4 (Fri) | Email | Follow-up — detailed resource | `cold_followup_value_add` (detailed variant) |
| 4 | 6 (Mon) | LinkedIn | DM — invite to webinar/demo | `linkedin_dm_event` |
| 5 | 8 (Wed) | Phone | Call — discuss use case fit | `phone_director_call` |
| 6 | 9 (Thu) | Email | Follow-up — technical detail | `cold_followup_technical` |
| 7 | 11 (Mon) | LinkedIn | Share relevant case study | `linkedin_dm_case_study` |
| 8 | 13 (Wed) | Email | Question breakup | `cold_followup_question_breakup` |
| 9 | 14 (Thu) | Email | Breakup | `cold_breakup_email` |

**Director-Level Email Guidelines:**
- Maximum 150 words per email
- Include technical details and integration specifics
- Offer live demo or sandbox access
- CTA: "Want to see a 10-minute demo?" or "Can I set up a sandbox for you?"

### 6.4 Manager-Level Cadence (SDR Manager, Sales Ops Manager)

Managers are practitioners who care about day-to-day workflow improvement and team metrics.

**Cadence: `persona_manager`**

| Step | Day | Channel | Action | Template Variant |
|------|-----|---------|--------|-----------------|
| 1 | 1 (Tue) | LinkedIn | Connect request | `linkedin_connect_cold` |
| 2 | 2 (Wed) | Email | First touch — team productivity angle | `cold_first_touch_insight_lead` |
| 3 | 4 (Fri) | Email | Follow-up — team benchmark data | `cold_followup_value_add` |
| 4 | 7 (Tue) | Phone | Call — team challenges discussion | `phone_manager_call` |
| 5 | 8 (Wed) | LinkedIn | Share team-focused resource | `linkedin_dm_resource` |
| 6 | 10 (Fri) | Email | Case study — similar team | `cold_followup_case_study` |
| 7 | 12 (Tue) | Phone | Second call | `phone_second_call_vm` |
| 8 | 14 (Thu) | Email | Breakup | `cold_breakup_email` |

## 7. Industry-Specific Cadences

### 7.1 SaaS Industry Cadence

SaaS buyers are tech-savvy, data-driven, and accustomed to evaluation processes. They expect product-led experiences.

**Modifications to Standard Cadence:**

| Parameter | Standard | SaaS Override |
|-----------|----------|---------------|
| First touch angle | Generic insight | ARR/scale-stage benchmark |
| Primary CTA | "Share a resource?" | "See a 10-min demo?" |
| Key resource type | Whitepaper | Interactive benchmark tool |
| LinkedIn engagement | Generic comment | Reply to their product launch post |
| Phone timing | Standard windows | Early morning (before standup) or late afternoon |
| Total duration | 14 days | 12 days (SaaS buyers move faster) |
| Follow-up content | Generic case study | SaaS-specific ROI calculator |

**SaaS-Specific Sequence:**

| Step | Day | Channel | SaaS-Specific Action |
|------|-----|---------|---------------------|
| 1 | 1 | Email | ARR benchmark for their stage |
| 2 | 2 | LinkedIn | Connect — reference their product/feature |
| 3 | 3 | Email | Peer SaaS company case study (similar ARR) |
| 4 | 5 | LinkedIn | Engage with their product announcement |
| 5 | 7 | Email | ROI calculator link — "Your numbers" |
| 6 | 8 | Phone | "Quick benchmark comparison call" |
| 7 | 10 | LinkedIn | Share industry trend data |
| 8 | 11 | Email | Demo offer — "10 minutes, no commitment" |
| 9 | 12 | Email | Breakup — "Will close my notes" |

### 7.2 Fintech Industry Cadence

Fintech buyers are compliance-conscious, committee-driven, and skeptical of vendors who don't understand regulatory constraints.

**Modifications to Standard Cadence:**

| Parameter | Standard | Fintech Override |
|-----------|----------|-----------------|
| First touch angle | Generic insight | Compliance/growth balance |
| Primary CTA | "Share a resource?" | "Share compliance case study?" |
| Key resource type | General whitepaper | Compliance architecture document |
| LinkedIn engagement | Generic comment | Engage with regulatory commentary |
| Phone timing | Standard windows | Mid-morning (post-standup, pre-compliance review) |
| Total duration | 14 days | 18 days (longer evaluation cycles) |
| Follow-up content | Generic case study | Fintech-specific security/compliance proof |
| Required proof points | ROI data | SOC 2, compliance certifications, audit trail |

**Fintech-Specific Sequence:**

| Step | Day | Channel | Fintech-Specific Action |
|------|-----|---------|------------------------|
| 1 | 1 | Email | Compliance-aware growth insight |
| 2 | 3 | LinkedIn | Connect — reference regulatory context |
| 3 | 5 | Email | Fintech peer compliance case study |
| 4 | 7 | LinkedIn | Engage with their regulatory content |
| 5 | 9 | Email | Security architecture overview + certifications |
| 6 | 11 | Phone | "Compliance-first pipeline discussion" |
| 7 | 13 | LinkedIn | Share fintech trend / regulatory update |
| 8 | 15 | Email | Fintech-specific ROI + compliance savings |
| 9 | 18 | Email | Breakup — gentle, compliance-aware |

### 7.3 Healthtech Industry Cadence

Healthtech buyers require patience, clinical evidence, and multi-stakeholder navigation. Speed-to-value matters less than trust-building.

**Modifications to Standard Cadence:**

| Parameter | Standard | Healthtech Override |
|-----------|----------|-------------------|
| First touch angle | Generic insight | Provider adoption / clinical workflow |
| Primary CTA | "Share a resource?" | "Share clinical evidence summary?" |
| Key resource type | Whitepaper | Clinical validation summary, EHR integration guide |
| LinkedIn engagement | Generic comment | Engage with clinical/healthcare content |
| Phone timing | Standard windows | Early morning (before rounds) or late afternoon |
| Total duration | 14 days | 21 days (deliberate, trust-building) |
| Follow-up content | Generic case study | Healthtech peer + clinical outcome data |
| Tone | Consultative | Especially empathetic, jargon-aware |

**Healthtech-Specific Sequence:**

| Step | Day | Channel | Healthtech-Specific Action |
|------|-----|---------|---------------------------|
| 1 | 1 | Email | Provider adoption insight for their stage |
| 2 | 4 | LinkedIn | Connect — reference their clinical milestone |
| 3 | 7 | Email | Clinical outcome data from peer healthtech |
| 4 | 10 | LinkedIn | Engage with their healthcare content |
| 5 | 12 | Email | EHR integration architecture overview |
| 6 | 14 | Phone | "Provider adoption discussion" — clinical framing |
| 7 | 16 | LinkedIn | Share healthcare regulation / compliance update |
| 8 | 18 | Email | Healthtech ROI + clinical efficiency data |
| 9 | 21 | Email | Breakup — respectful, open-door |

## 8. Cadence Measurement KPIs

### 8.1 Channel-Level KPIs

| KPI | Definition | Benchmark (Cold) | Benchmark (Warm) | Measurement |
|-----|-----------|-----------------|-----------------|-------------|
| **Email Open Rate** | Opens / Emails Delivered | 25–35% | 45–55% | ESP tracking pixel |
| **Email Reply Rate** | Replies / Emails Delivered | 5–10% | 15–25% | CRM reply tracking |
| **Email Click Rate** | Link Clicks / Emails Delivered | 2–5% | 5–12% | UTM + ESP |
| **LinkedIn Accept Rate** | Accepts / Connection Requests Sent | 25–35% | 50–65% | LinkedIn analytics |
| **LinkedIn Reply Rate** | Replies / Direct Messages Sent | 10–18% | 25–40% | Manual + CRM |
| **Phone Connect Rate** | Live Answers / Call Attempts | 12–18% | 25–35% | Dialer analytics |
| **Phone Conversation Rate** | Meaningful Conversations / Connects | 60–70% | 75–85% | Rep logging |
| **Phone Meeting Book Rate** | Meetings / Conversations | 15–25% | 30–45% | CRM |

### 8.2 Cadence-Level KPIs

| KPI | Definition | Benchmark | Calculation |
|-----|-----------|-----------|-------------|
| **Cadence Completion Rate** | % of prospects who receive all steps | 60–75% | Completed cadences / Started cadences |
| **Cadence Reply Rate** | Replies from any channel / Cadences started | 8–15% | Total replies / Total cadences |
| **Cadence Meeting Rate** | Meetings booked / Cadences started | 3–8% | Meetings / Total cadences |
| **Positive Reply Rate** | Positive replies / Total replies | 40–60% | Positive replies / All replies |
| **Time to First Reply** | Avg days from first touch to first reply | 4–8 days | Sum(reply_day) / Total replies |
| **Best Performing Step** | Step with highest reply rate | Step 1 or 6 | Step-level reply analysis |
| **Opt-Out Rate** | Unsubscribes / Cadences started | 1–3% | Opt-outs / Total cadences |
| **Cadence Efficiency** | Meetings / Total touches across all channels | 1–3% | Meetings / Total touches |

### 8.3 Business-Level KPIs

| KPI | Definition | Benchmark | Source |
|-----|-----------|-----------|--------|
| **Pipeline Generated** | $ value of opportunities created from cadence | Varies by ICP | CRM |
| **Cost per Meeting** | Total cost / Meetings booked | $150–$400 | Finance + CRM |
| **Cost per Pipeline Dollar** | Total cost / Pipeline $ generated | $0.05–$0.15 | Finance + CRM |
| **Cadence-to-Close Rate** | Closed-won deals / Cadences started | 1–4% | CRM |
| **Average Sales Cycle (Cadence-sourced)** | Days from first touch to close | 45–90 days | CRM |
| **CAC (Cadence-sourced)** | Total cost / New customers from cadence | $500–$2,000 | Finance + CRM |

### 8.4 KPI Dashboard Specification

```json
{
  "dashboard_id": "cadence_performance",
  "refresh_frequency": "daily",
  "panels": [
    {
      "title": "Cadence Reply Rate by Variant",
      "type": "bar_chart",
      "metrics": ["reply_rate", "positive_reply_rate"],
      "dimensions": ["cadence_id", "variant"],
      "comparison": "vs_previous_period"
    },
    {
      "title": "Channel Effectiveness Heatmap",
      "type": "heatmap",
      "metrics": ["reply_rate", "meeting_rate"],
      "dimensions": ["channel", "day_of_week", "time_of_day"]
    },
    {
      "title": "Step-Level Performance",
      "type": "funnel",
      "metrics": ["sent", "opened", "replied", "meeting_booked"],
      "dimensions": ["step_number"]
    },
    {
      "title": "Persona Performance Comparison",
      "type": "table",
      "metrics": ["reply_rate", "meeting_rate", "pipeline_per_cadence"],
      "dimensions": ["persona_type", "cadence_id"]
    },
    {
      "title": "Cadence Efficiency Score",
      "type": "gauge",
      "metric": "meetings_per_total_touches",
      "target": 0.03,
      "thresholds": { "red": 0.01, "yellow": 0.02, "green": 0.03 }
    }
  ]
}
```

## 9. Cadence A/B Testing Framework

### 9.1 Testable Cadence Variables

| Variable | Options | What It Tests | Minimum Sample |
|----------|---------|---------------|---------------|
| Channel sequence | Email-first vs Social-first | Channel primacy effect | 200 per variant |
| Total duration | 10-day vs 14-day vs 21-day | Persistence vs fatigue | 200 per variant |
| Touch frequency | 9 touches vs 12 touches | Intensity threshold | 200 per variant |
| Step timing | Morning vs afternoon | Time-of-day effect | 300 per variant |
| Day of start | Tuesday vs Wednesday | Day-of-week effect | 300 per variant |
| Channel mix | Email+LinkedIn vs Email+Phone | Channel synergy | 200 per variant |

### 9.2 Testing Rules

```yaml
cadence_ab_testing:
  rules:
    - rule: "test_one_variable_at_a_time"
      rationale: "Isolate impact of single change"
    
    - rule: "minimum_200_completes_per_variant"
      rationale: "Statistical significance at 95% confidence"
    
    - rule: "run_test_for_full_cadence_duration_x2"
      rationale: "Account for full cycle plus replication"
    
    - rule: "hold_persona_and_industry_constant"
      rationale: "Control for audience variation"
    
    - rule: "monitor_opt_out_rate_daily"
      rationale: "Stop test if opt-out rate exceeds 5%"
    
    - rule: "no_more_than_2_active_tests_per_cadence_type"
      rationale: "Avoid interaction effects"
  
  decision_criteria:
    metric: "cadence_reply_rate"
    significance_level: 0.05
    minimum_improvement: "15% relative improvement"
    action_on_winner: "promote_to_default_cadence"
    action_on_loser: "archive_variant_and_document"
```

## 10. Cadence Automation Rules

### 10.1 Dynamic Cadence Adjustment

```yaml
dynamic_adjustment:
  rules:
    - trigger: "email_opened_but_no_reply_after_48_hours"
      action: "accelerate_next_step_by_1_day"
    
    - trigger: "email_clicked_but_no_reply_after_24_hours"
      action: "insert_phone_call_within_24_hours"
    
    - trigger: "linkedin_connection_accepted"
      action: "send_linkedin_dm_within_24_hours"
    
    - trigger: "linkedin_content_engagement_detected"
      action: "advance_next_linkedin_step_to_next_day"
    
    - trigger: "phone_voicemail_left"
      action: "send_reference_email_within_2_hours"
    
    - trigger: "unsubscribe_received"
      action: "halt_all_channels_immediately"
    
    - trigger: "meeting_booked_via_any_channel"
      action: "end_cadence, move_to_post_meeting_flow"
    
    - trigger: "positive_reply_received"
      action: "pause_cadence, notify_assigned_rep, start_5_min_countdown"
    
    - trigger: "negative_reply_received"
      action: "end_cadence, mark_disqualified, log_reason"
    
    - trigger: "three_consecutive_email_opens_no_reply"
      action: "switch_to_phone_or_linkedin_for_next_step"
```

### 10.2 Cadence Priority Queue

```yaml
priority_queue:
  rules:
    - priority: 1
      condition: "lead_score_tier == 'A+' AND trigger_event_within_7_days"
      action: "use_aggressive_cadence, start_immediately"
    
    - priority: 2
      condition: "lead_score_tier == 'A' AND trigger_event_within_30_days"
      action: "use_standard_cadence, start_within_2_hours"
    
    - priority: 3
      condition: "lead_score_tier == 'A' AND no_trigger_event"
      action: "use_standard_cadence, start_next_business_day"
    
    - priority: 4
      condition: "lead_score_tier == 'B'"
      action: "use_standard_cadence, start_within_48_hours"
    
    - priority: 5
      condition: "lead_score_tier == 'C'"
      action: "use_gentle_cadence, batch_process_weekly"
    
    - priority: 6
      condition: "lead_score_tier == 'D'"
      action: "do_not_cadence, add_to_nurture_pool"
```

## 11. Quick-Reference: Cadence Selection Flowchart

```
INCOMING LEAD SCORED
  │
  ├─ What is the lead temperature?
  │   ├─ COLD (no prior engagement)
  │   │   ├─ ICP Tier A+ → Aggressive Cadence (10-day, 12 touches) — §2.2
  │   │   ├─ ICP Tier A/B → Standard Cadence (14-day, 9 touches) — §2.1
  │   │   └─ ICP Tier C → Gentle Cadence (21-day, 6 touches) — §2.3
  │   │
  │   ├─ WARM (prior engagement, no reply)
  │   │   ├─ Event-sourced → Event Follow-Up Cadence (7-day, 5 touches) — §2.4
  │   │   ├─ Referral-sourced → Warm Cadence (7-day, 4 touches) — §5.2
  │   │   └─ Content-sourced → Gentle Warm Cadence (21-day, 6 touches) — §2.3
  │   │
  │   └─ HOT (inbound, demo request)
  │       └─ Fast-track (3-day, 3 touches) — immediate response required
  │
  ├─ What persona is the contact?
  │   ├─ C-Suite → Persona C-Suite Cadence — §6.1
  │   ├─ VP → Persona VP Cadence — §6.2
  │   ├─ Director → Persona Director Cadence — §6.3
  │   └─ Manager → Persona Manager Cadence — §6.4
  │
  ├─ What industry?
  │   ├─ SaaS → SaaS Override — §7.1
  │   ├─ Fintech → Fintech Override — §7.2
  │   └─ Healthtech → Healthtech Override — §7.3
  │
  └─ Apply channel strategy:
      ├─ Email-First (default) — §4.1
      ├─ Social-First (LinkedIn-active prospects) — §4.2
      ├─ Phone-First (triggers + referrals) — §4.3
      └─ Convergent (A+ leads) — §4.4
```

---

*This cadence template library is maintained by LeadReach Knowledge Engineering. Cadence performance should be reviewed monthly and thresholds recalibrated quarterly. For modifications, submit a PR with the `cadence-templates` label. Last validated against production outreach data on 2026-07-01.*
