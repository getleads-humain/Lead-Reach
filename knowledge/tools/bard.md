---
title: "Bard — Outreach Composer Agent Tools"
category: tool
agent: bard
role: outreach-composer
tags: [bard, outreach, email, linkedin, sequencing]
last_reviewed: "2026-06-22"
grade: "A"
---

# Bard — Outreach Composer Agent Tools

## 1. Role

Bard takes qualified leads from Judge and composes personalized outreach sequences. Bard's defining principle is **relevance** — every email is grounded in a specific, verifiable signal about the recipient.

## 2. Cognitive Posture

- **Empathic**: Writes to the recipient's role and pain, not to the seller's product.
- **Specific**: Every email references a specific, verifiable trigger.
- **Concise**: 80–130 words per email; respect the reader's time.

## 3. Tools

### Tool: compose_email

**Purpose**: Compose a personalized cold email.

**Input**:
- `lead` (object): Enriched lead.
- `trigger` (object): The personalization hook (funding, hiring, product, leadership).
- `peer_reference` (object): Optional peer case study.
- `sequence_position` (1, 2, 3, breakup): Which email in the sequence.

**Output**:
- `subject` (string)
- `body` (string)
- `signature` (string)
- `compliance_checks` (object): Pass/fail per region.
- `personalization_review` (object): Accuracy check on each personalized claim.

### Tool: compose_linkedin_note

**Purpose**: Compose a LinkedIn connection note or DM.

**Input**: Lead + trigger.

**Output**: Note (≤300 chars for connection, ≤1000 chars for DM).

### Tool: compose_call_script

**Purpose**: Compose a cold call script with talk track.

**Input**: Lead + trigger + objections list.

**Output**: Script with:
- `opener` (15 sec)
- `value_prop` (30 sec)
- `discovery_question` (open-ended)
- `objection_responses` (array)
- `close` (ask for meeting)

### Tool: select_trigger

**Purpose**: Select the highest-signal trigger for a lead.

**Input**: Lead with all available triggers.

**Output**: Selected trigger + rationale.

### Tool: select_peer_reference

**Purpose**: Select the most relevant peer case study for a lead.

**Input**: Lead + library of case studies.

**Output**: Selected case study + rationale.

### Tool: build_sequence

**Purpose**: Build a multi-channel sequence for a lead.

**Input**: Lead + region + industry.

**Output**: Sequence object with:
- `touches` (array): Each touch (day, channel, content).
- `total_duration_days`
- `expected_metrics` (open rate, reply rate, meeting rate)

### Tool: compliance_check

**Purpose**: Check an email for regional compliance.

**Input**: Email + region.

**Output**:
- `compliant` (boolean)
- `issues` (array): Specific issues to fix.
- `required_elements` (object): Physical address, unsubscribe link, etc.

## 4. Trigger Hierarchy

When multiple triggers are available, Bard selects in this order:

1. **Funding announcement** (90 days) — Highest signal
2. **Recent leadership change** (60 days)
3. **Hiring velocity** (30 days)
4. **Product launch** (30 days)
5. **M&A activity** (90 days)
6. **Earnings call mention** (30 days)
7. **Recent press / news** (30 days)
8. **Peer reference** (always available)
9. **Generic ICP fit** (fallback)

## 5. Tone Profiles by Region

| Region | Tone | CTA Style |
|--------|------|-----------|
| US | Direct, confident, metric-heavy | Soft for first 3; hard for last 2 |
| EU | Formal, peer-referenced, understated | Soft throughout |
| UK | Direct but polite, understated | Soft throughout |
| APAC | Formal, indirect, relationship-first | Soft throughout |
| LATAM | Warm, relationship-first | Soft throughout |

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Email open rate | >50% (SaaS US), >40% (EU) |
| Reply rate | >4% (SaaS US), >2.5% (EU) |
| Meeting-booked rate | >2.5% (SaaS US), >1.5% (EU) |
| Personalization accuracy | >95% (no incorrect claims) |
| Compliance pass rate | 100% |
| Breakup email reply rate | >5% |

## 7. Handoffs

- **From Atlas**: Qualified leads ready for outreach.
- **From Judge**: Tier A + B leads with scores and signals.
- **From Sage**: Research findings for personalization.
- **To Flow**: Outreach sequences for pipeline management.

## 8. Error Handling & Edge Cases

### 8.1 Trigger Validation Failures

| Failure Mode | Detection | Recovery |
|-------------|-----------|----------|
| Trigger fact is incorrect | `personalization_review` flags claim vs. source mismatch | Remove the claim; use fallback trigger |
| Trigger is stale (>90 days for funding, >30 for hiring) | Date check on trigger source | Downgrade to next trigger in hierarchy |
| Trigger source is paywalled or 404 | URL validation fails | Cannot verify; use with hedging ("I read that...") or select different trigger |
| Multiple triggers of equal weight | Two triggers with same hierarchy rank | Use the more recent one; combine both in email body if natural |
| No triggers available | Lead has zero signals from Scout/Forge/Sage | Use "Generic ICP fit" trigger; flag as low-personalization |

### 8.2 Compliance Failures

| Region | Common Failure | Detection | Fix |
|--------|---------------|-----------|-----|
| EU (GDPR) | No legal basis for outreach | `compliance_check` flags missing consent | Do not send; add to nurture-only list |
| US (CAN-SPAM) | Missing physical address | `compliance_check` flags missing address | Append company address to signature |
| US (CAN-SPAM) | Missing unsubscribe link | `compliance_check` flags missing link | Append "Reply STOP to unsubscribe" |
| Canada (CASL) | No implied consent | `compliance_check` flags Canadian recipient | Require explicit opt-in; do not cold email |
| UK (PECR) | Sent to individual, not business | `compliance_check` flags personal email | Do not send to personal email addresses |
| APAC (various) | Missing local language disclaimer | `compliance_check` flags APAC recipient | Append required disclaimer per country |

### 8.3 Personalization Edge Cases

| Edge Case | Example | Action |
|-----------|---------|--------|
| Name is ambiguous | "Alex Smith" (unknown gender) | Use first name only; avoid gendered pronouns |
| Company was acquired | Trigger references pre-acquisition name | Use current name; note acquisition if relevant |
| Contact recently changed roles | "VP Sales" → "VP Marketing" | Use current role from most recent Forge data |
| Competitor mention in research | Lead uses a competitor's product | Reference only if case study shows migration benefit; never bash competitor |
| Sensitive trigger | Recent layoffs at target company | Do NOT reference layoffs in outreach; use positive signals instead |

### 8.4 Sequence Edge Cases

| Edge Case | Action |
|-----------|--------|
| Lead replies after email 1 | Stop sequence; switch to conversation mode |
| Lead bounces on email 1 | Halt sequence; flag for Forge re-verification |
| Lead unsubscribes after email 2 | Stop all emails; mark as "do not contact" |
| Lead marked as "out of office" | Pause sequence; resume after return date |
| Multiple contacts at same company | Stagger sends by 2 business days to avoid appearing as spam |
| Sequence reaches breakup email | Send breakup; archive lead in Flow |

### 8.5 Rate Limit Handling

- Email sending: Max 200 emails/hour per sending domain. Stagger sends with random 5–30s delays.
- LinkedIn connection notes: Max 20/day per account. Do not exceed.
- LinkedIn DMs: Max 50/day per account.
- Cold calls: Respect local business hours (9am–6pm recipient timezone). No weekend calls.

## 9. Integration Patterns

### 9.1 Standard Outreach Pipeline

```
Judge → (Tier A/B lead) → Bard.select_trigger → Bard.compose_email → Bard.compliance_check → Flow.execute_sequence
```

### 9.2 Research-Enhanced Personalization

```
Bard.select_trigger → (trigger: "funding", but needs specifics)
  → Sage.research_question("How is Acme using their Series B funding?")
  → Sage returns specific details (hiring 8 SDRs, expanding to EMEA)
  → Bard.compose_email with specific funding detail
```

### 9.3 Multi-Channel Sequence Pattern

```
Bard.build_sequence → {
  Day 1:  Email 1 (trigger-based personalization)
  Day 3:  LinkedIn connection note
  Day 7:  Email 2 (value prop + peer reference)
  Day 10: LinkedIn DM (if connected)
  Day 14: Email 3 (case study + soft CTA)
  Day 21: Cold call script (if phone available)
  Day 28: Breakup email
}
```

### 9.4 Post-Reply Conversation Handoff

```
Lead replies → Flow captures reply → Bard composes follow-up based on reply content
  → If positive: Bard sends meeting request
  → If objection: Bard sends objection response
  → If negative: Bard sends graceful close; Flow archives
```

### 9.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| select_trigger | compose_email | Selected trigger object | Object |
| select_peer_reference | compose_email | Selected case study | Object |
| compose_email | compliance_check | Full email (subject + body + signature) | Object |
| compliance_check | compose_email | Issues list (if any) | Array<Object> |
| build_sequence | Flow | Full sequence with touches | Object |
| compose_call_script | Flow | Call script per lead | Object |

## 10. Quality Assurance Rules

### 10.1 Email Quality Checks

Before any email is sent, Bard runs these automated checks:

| Check | Rule | Failure Action |
|-------|------|---------------|
| Word count | 80–130 words (body only) | Flag for edit |
| Personalization claims | Every claim must have a verified source | Remove unverified claim |
| Subject line length | ≤50 characters | Truncate |
| CTA clarity | Must contain exactly one ask | Simplify |
| Link count | ≤2 links in body | Remove excess |
| Tone match | Must match regional tone profile | Rewrite |
| Competitor mention | No negative competitor references | Remove |
| Price mention | No pricing in cold email | Remove |

### 10.2 Personalization Accuracy Requirements

Every personalized claim must pass a 3-point verification:

1. **Source exists**: The claim traces to a Forge/Sage data point with a URL.
2. **Date is current**: The source is within the trigger's freshness window.
3. **Context is accurate**: The claim is not misleadingly extracted from the source.

Example of **failed** accuracy check:
- Claim: "Congratulations on your $50M raise!"
- Source: Article says "$45M Series B"
- Result: Factually incorrect. Fix to "$45M Series B".

### 10.3 Compliance Confidence Thresholds

| Region | Min Compliance Confidence | Below Threshold Action |
|--------|--------------------------|----------------------|
| US | 95% | Auto-fix common issues (add address, unsubscribe); re-check |
| EU | 100% | Do not send; flag for legal review |
| Canada | 100% | Do not send; CASL requires explicit consent |
| UK | 98% | Auto-fix; if not fixable, flag for review |
| APAC | 95% | Auto-fix; add local disclaimers |

### 10.4 A/B Testing Rules

- Always A/B test subject lines for new campaign types.
- Test body variations only after subject line winner is established.
- Minimum sample size: 100 emails per variant.
- Statistical significance: p < 0.05 before declaring winner.

## 11. Performance Optimization

### 11.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Trigger selection per lead | 24 hours | On new Sage research |
| Peer reference selection per lead | 7 days | On new case study added |
| Compliance check result per region | 30 days | On regulation change |
| Tone profile per region | 90 days | On performance data update |
| Email template (by industry + trigger type) | 30 days | On A/B test winner update |
| Sequence template (by region + industry) | 30 days | On performance review |

### 11.2 Parallel Execution

- `select_trigger` + `select_peer_reference` can run in parallel for the same lead.
- `compose_email`, `compose_linkedin_note`, `compose_call_script` can run in parallel for the same lead.
- `compliance_check` runs sequentially after composition.
- Batch composition: compose outreach for 200 leads in parallel.

### 11.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| select_trigger | 5s | Use highest-weighted available trigger |
| select_peer_reference | 5s | Use generic peer reference |
| compose_email | 15s | Return template-based fallback |
| compose_linkedin_note | 10s | Return generic connection note |
| compose_call_script | 15s | Return basic talk track |
| compliance_check | 5s | Return `compliant: false` (fail-safe) |
| build_sequence | 10s | Return default sequence template |

### 11.4 Template Pre-Warming

Bard pre-warms email templates for common trigger + industry combinations:
- When a new campaign starts, Bard generates template drafts for the top 5 triggers × top 3 industries.
- Templates are stored in cache and customized per lead with specific data points.
- Reduces per-lead composition time from ~10s to ~2s.

## 12. Anti-Patterns

### 12.1 Do Not: Use Generic Templates Without Personalization

"Hi {first_name}, I noticed your company is growing..." is not personalization. Every email must reference a specific, verifiable trigger. Generic templates are the fallback, never the default.

### 12.2 Do Not: Send Multiple Emails to the Same Company on the Same Day

If you have 3 contacts at Acme Corp, stagger emails over 3 business days. Simultaneous emails look like spam and damage sender reputation.

### 12.3 Do Not: Reference Unverified Data

If Forge marked a data point as Tier C or D, do NOT use it as a personalization claim. "I see you use Salesforce" when that data is Tier C (inferred) could be wrong and makes the email look foolish.

### 12.4 Do Not: Write Long Emails

B2B decision-makers scan emails in 3–5 seconds. If your email is >130 words, it won't be read. Cut ruthlessly. One insight, one value prop, one CTA.

### 12.5 Do Not: Ignore Reply Handling

When a lead replies, the sequence must stop immediately. Continuing to send sequence emails after a reply is the #1 complaint from recipients and damages deliverability.

### 12.6 Do Not: Use the Same Trigger for Every Email in a Sequence

Email 1 references the Series B. Email 2 should add a new dimension (peer reference, specific pain point). Email 3 should provide value (case study, ROI data). Each touch must feel like a continuation, not a repetition.

## 13. Output Schema Deep Dive

### 13.1 compose_email Output

```yaml
email_id: "email_abc123"
lead_id: "lead_abc123"
sequence_id: "seq_xyz789"
sequence_position: 1
created_at: "2026-06-22T18:00:00Z"

subject: "Acme's Series B + 8 new SDRs"
body: |
  Hi Jane,

  Saw that Acme just raised $45M Series B and is scaling the sales team — congrats on the momentum.

  When teams grow fast, SDR productivity usually becomes the bottleneck. We helped [Peer Company] go from 200 to 500 reps while keeping per-rep output flat, not diluted.

  Would a 15-minute call this week make sense to see if this is relevant for Acme's growth plans?

signature: |
  Best,
  Alex Chen
  LeadReach | Sales Intelligence
  123 Market St, San Francisco, CA 94105
  Unsubscribe: reply STOP

compliance_checks:
  can_spam:
    compliant: true
    physical_address_present: true
    unsubscribe_present: true
    subject_not_deceptive: true
  gdpr:
    compliant: true
    legal_basis: "legitimate_interest"
    data_minimization: true
  casl:
    compliant: false
    reason: "Canadian recipient requires explicit consent"
    action: "Do not send; add to nurture list"

personalization_review:
  claims:
    - claim: "Acme just raised $45M Series B"
      source_url: "https://techcrunch.com/2026/05/15/acme-series-b"
      source_date: "2026-05-15"
      verified: true
      tier: "A"
    - claim: "Scaling the sales team"
      source_url: "https://acme.com/careers"
      source_date: "2026-06-01"
      verified: true
      tier: "A"
  total_claims: 2
  verified_claims: 2
  unverified_claims: 0
  personalization_score: 95

word_count: 87
cta_type: "soft"            # soft | hard
trigger_used: "funding"
peer_reference_used: "Peer Company (Series B SaaS, 200→500 reps)"
```

### 13.2 compose_linkedin_note Output

```yaml
note_id: "note_abc123"
lead_id: "lead_abc123"
type: "connection"            # connection | dm
content: "Hi Jane — congrats on Acme's Series B! I work with scaling sales teams and would love to connect. - Alex"
character_count: 107
character_limit: 300
compliance_checks:
  linkedin_tos_compliant: true
  no_promotional_content: true  # Connection notes cannot be promotional
personalization_review:
  claims:
    - claim: "Acme's Series B"
      verified: true
  personalization_score: 85
```

### 13.3 compose_call_script Output

```yaml
script_id: "script_abc123"
lead_id: "lead_abc123"
trigger_used: "funding"

opener: |
  "Hi Jane, this is Alex from LeadReach. I know you weren't expecting my call — do you have 30 seconds?"
  [Wait for response. If yes, continue. If no, ask for a better time.]

value_prop: |
  "We work with sales leaders who are scaling their teams after funding rounds. Companies like [Peer] used us to keep SDR productivity consistent even as they doubled headcount."

discovery_question: |
  "How are you planning to ramp your new SDR hires? Is productivity per rep a concern as you scale?"

objection_responses:
  - objection: "We already have a sales tool"
    response: "Totally understand — most of our customers did too. The question isn't whether you have a tool, it's whether your new hires are ramping as fast as your existing reps. Mind if I share a 2-minute example?"
  - objection: "Not interested right now"
    response: "Fair enough. Since you're in growth mode, would it make sense to reconnect in a month when the new hires are settled in?"
  - objection: "Send me an email"
    response: "Absolutely — I'll send something over today. What's the biggest challenge you're anticipating with the new SDR team?"

close: |
  "Would a 15-minute call next Tuesday or Thursday work? I can share some benchmarks from companies at a similar stage."

call_metadata:
  estimated_duration: "3-5 minutes"
  best_time: "Tuesday-Thursday, 10am-2pm recipient time"
  follow_up_if_voicemail: "Leave voicemail + send email same day"
```

### 13.4 build_sequence Output

```yaml
sequence_id: "seq_xyz789"
lead_id: "lead_abc123"
region: "US"
industry: "SaaS"
total_duration_days: 28
total_touches: 7

touches:
  - day: 1
    channel: "email"
    type: "personalized_cold"
    content_ref: "email_abc123"
    expected_open_rate: 52
    expected_reply_rate: 5.2
  - day: 3
    channel: "linkedin"
    type: "connection_note"
    content_ref: "note_abc123"
    expected_accept_rate: 30
  - day: 7
    channel: "email"
    type: "value_add"
    content_ref: "email_def456"
    expected_open_rate: 45
    expected_reply_rate: 3.8
  - day: 10
    channel: "linkedin"
    type: "dm"
    content_ref: "note_ghi789"
    expected_reply_rate: 8
  - day: 14
    channel: "email"
    type: "case_study"
    content_ref: "email_jkl012"
    expected_open_rate: 40
    expected_reply_rate: 3.5
  - day: 21
    channel: "phone"
    type: "cold_call"
    content_ref: "script_abc123"
    expected_connect_rate: 12
  - day: 28
    channel: "email"
    type: "breakup"
    content_ref: "email_mno345"
    expected_reply_rate: 5.5

expected_metrics:
  cumulative_open_rate: 55
  cumulative_reply_rate: 8
  cumulative_meeting_rate: 3.5
  sequence_completion_rate: 45

stop_conditions:
  - "lead replies (any channel)"
  - "lead unsubscribes"
  - "email bounces"
  - "lead marks as spam"
  - "3 failed delivery attempts"
