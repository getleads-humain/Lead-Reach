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
