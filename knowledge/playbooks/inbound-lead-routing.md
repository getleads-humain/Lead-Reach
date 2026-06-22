---
title: "Inbound Lead Routing — Playbook"
category: playbook
playbook: inbound-lead-routing
tags: [inbound, lead-routing, sla, qualification, abm]
last_reviewed: "2026-06-22"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Inbound Lead Routing — Playbook

This playbook is the canonical reference for routing, qualifying, and dispatching inbound leads across the LeadReach 8-agent pipeline. It is primarily used by Atlas (Orchestrator), Scout (Prospect Discovery), Judge (Lead Qualification), and Flow (Pipeline Manager).

## 1. Why Inbound Routing Matters

Inbound leads — form fills, demo requests, content downloads, chat conversions — convert at **3-10x the rate of outbound** when contacted within 5 minutes, but **drop to parity with cold outbound by 24 hours** (Drift/MIT study, 2024 replication). The window is narrow, the stakes are high, and the routing decision determines whether the lead reaches an SDR while interest is still hot.

The LeadReach philosophy on inbound routing is **agent-augmented, not agent-replaced**. Atlas orchestrates the routing decision, Scout enriches the lead in real-time, Judge qualifies against ICP, and Flow dispatches to the right human rep via Slack/email/CRM assignment. The human SDR always makes the final outreach — agents handle the prep work.

## 2. The 5-Stage Inbound Routing Pipeline

### Stage 1: Ingestion (Real-Time, <1 second)

Inbound signals enter LeadReach via:
- Website forms (HubSpot, Marketo, custom)
- Chat (Drift, Intercom, Front)
- Email replies (parser detects intent)
- Calendar bookings (Calendly, Chili Piper)
- API integrations (Zoom webinars, G2 Crowd reviews)
- ICP-fit alerts (6sense, Demandbase)

The ingestion layer (Flow agent) normalizes the signal into a standard LeadEvent:

```typescript
{
  leadId: string;
  source: 'form' | 'chat' | 'email' | 'calendar' | 'webinar' | 'intent';
  timestamp: ISO8601;
  payload: Record<string, unknown>;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
}
```

### Stage 2: Enrichment (Real-Time, 2-5 seconds)

Scout agent enriches the lead in parallel:
- Company domain → website content, tech stack, recent news
- Email → LinkedIn profile, role, seniority
- IP → geolocation, ISP, company (if corporate IP)
- Phone → carrier lookup, line type (mobile/landline)
- Form data → ICP fit scoring (Judge agent)

The enrichment is **non-blocking** — the lead proceeds to routing even if enrichment is incomplete. Enrichment results catch up via WebSocket update.

### Stage 3: Qualification (Real-Time, 1-3 seconds)

Judge agent scores the lead against the active ICP:
- **Firmographic fit** (industry, size, revenue, geography)
- **Technographic fit** (current tech stack, integration surface)
- **Behavioral intent** (pages visited, content downloaded, pricing views)
- **Trigger signals** (recent funding, hiring, leadership change, news)

Output: LeadScore 0-100 + qualification label:
- **P0 (90-100)** — SQL, route to AE immediately, alert Slack #hot-leads
- **P1 (70-89)** — MQL, route to SDR, 5-minute SLA
- **P2 (40-69)** — Nurture, add to sequence, 24-hour SLA
- **P3 (0-39)** — Disqualify or long-term nurture, no SLA

### Stage 4: Routing Decision (Real-Time, <1 second)

Atlas agent routes based on:
- **Score tier** (P0/P1/P2/P3)
- **Geography** (rep territory)
- **Industry vertical** (rep specialization)
- **Account ownership** (existing owner wins)
- **Rep capacity** (current pipeline load)
- **Time-of-day** (after-hours → scheduled callback)

Routing rules are configurable per ICP and territory. Default: P0 → AE direct, P1 → SDR pool, P2 → automated nurture, P3 → disqualify.

### Stage 5: Dispatch & SLA Tracking (Real-Time → 5 minutes)

Flow agent dispatches via:
- **CRM assignment** (Salesforce, HubSpot) — owner field updated
- **Slack alert** to rep DM + channel #hot-leads for P0
- **Email alert** with enriched lead brief (Scout's research attached)
- **Calendar hold** — auto-book 15-min slot if rep's calendar has openings

SLA clock starts at dispatch:
- P0: 5 minutes to first touch
- P1: 15 minutes to first touch
- P2: 24 hours to first nurture email
- P3: 7 days to disqualify or long-term nurture

If SLA breaches, Flow escalates: tier 1 → rep's manager, tier 2 → VP Sales, tier 3 → CRO.

## 3. Lead Routing Rules (Decision Matrix)

| Score | Account Type | Territory | Time-of-Day | Route To | SLA |
|-------|-------------|-----------|-------------|----------|-----|
| P0 (90+) | New | US | Business hours | AE direct + Slack alert | 5 min |
| P0 (90+) | New | US | After hours | On-call AE + Slack alert | 30 min |
| P0 (90+) | Existing | Any | Any | Account owner AE | 5 min |
| P0 (90+) | New | EU/UK | Business hours | EU AE direct | 15 min |
| P0 (90+) | New | APAC | Business hours | APAC AE direct | 30 min |
| P1 (70-89) | New | US | Business hours | SDR pool (round-robin) | 15 min |
| P1 (70-89) | New | EU/UK | Business hours | EU SDR pool | 30 min |
| P1 (70-89) | Existing | Any | Any | Account SDR | 30 min |
| P2 (40-69) | New | Any | Any | Nurture sequence (Bard) | 24 hr |
| P3 (0-39) | New | Any | Any | Disqualify + add to suppression | 7 days |

## 4. SLA Tracking & Escalation

Flow agent monitors every dispatched lead against its SLA:

- **T+0**: Lead dispatched, SLA clock starts
- **T+SLA/2**: Reminder ping to rep (Slack DM)
- **T+SLA**: First breach — escalate to rep's manager
- **T+SLA+1hr**: Second breach — escalate to VP Sales
- **T+SLA+4hr**: Third breach — escalate to CRO + auto-reassign to backup rep

Escalation messages include:
- Lead name, company, source
- Time since dispatch
- Rep name and current capacity
- Suggested action ("Call now" / "Email now" / "Reassign to [backup rep]")

## 5. Account-Based Routing (ABM)

For named-account ABM motions, routing rules override score-based routing:

- **Tier 1 accounts** (top 100 named): Always route to named AE, regardless of score. Even P2 → AE nurture, not SDR.
- **Tier 2 accounts** (next 500): Route to ABM pod (AE + SDR pair). Both notified.
- **Tier 3 accounts** (next 2,000): Standard routing rules apply.

Atlas agent checks the ABM list before applying score-based routing. ABM list is configured in the ICP Builder.

## 6. Inbound Channel-Specific Rules

### Website Form (Demo Request)
- **Trigger**: Form submit with >3 fields including email
- **Score boost**: +20 to base ICP score
- **Routing**: Standard pipeline
- **Special**: If "phone" field provided, P0 auto-promotion

### Chat (Drift/Intercom)
- **Trigger**: Chat conversation with >2 messages from prospect
- **Score boost**: +15 (high intent)
- **Routing**: Rep online → live transfer; rep offline → book meeting
- **Special**: Chatbot pre-qualifies 3 questions (company size, role, timeline)

### Email Reply
- **Trigger**: Reply to outbound sequence with positive sentiment
- **Score boost**: +30 (highest intent signal)
- **Routing**: Original sequence owner → immediate reply
- **Special**: Bard agent drafts suggested reply for rep to send

### Content Download
- **Trigger**: Gated content unlock (ebook, whitepaper, template)
- **Score boost**: +5 (low intent alone, high in sequence)
- **Routing**: P2 default → nurture sequence (Bard agent)
- **Special**: After 3 downloads in 30 days, auto-promote to P1

### Webinar Registration
- **Trigger**: Registration confirmation
- **Score boost**: +10
- **Routing**: Pre-webinar → nurture; post-attendance → P1 (high intent)
- **Special**: No-show → P2, follow-up with recording

### Calendar Booking
- **Trigger**: Meeting booked (Calendly/Chili Piper)
- **Score boost**: +25 (highest intent short of demo attended)
- **Routing**: Rep booked = rep notified; auto-prep brief by Sage agent
- **Special**: Cancel/reschedule → auto-follow-up sequence

## 7. Post-Dispatch: The Rep Brief

When a lead is dispatched, Flow agent attaches a **Lead Brief** compiled by Scout and Sage:

```
LEAD BRIEF — [Name] at [Company]
==================================
Source: Demo request form
Score: P0 (94/100)
Submitted: 2 minutes ago

COMPANY SNAPSHOT
- Industry: FinTech / Payments
- Size: 120 employees (LinkedIn)
- Funding: Series B, $25M, 6 months ago
- Tech stack: Stripe, AWS, Snowflake, dbt

PROSPECT SNAPSHOT
- Role: VP Engineering (reports to CTO)
- Tenure: 2 years
- Previous: Senior Eng at [Peer company]
- LinkedIn: linkedin.com/in/...

TRIGGER SIGNALS
- Hiring 3 SDRs (LinkedIn, last 30 days)
- Recent blog post on scaling infra
- Peer company [X] just signed with us

SUGGESTED OUTREACH
- Phone: +1-XXX-XXX-XXXX (mobile, OK to call)
- Email: prospect@company.com
- Best window: 2-4pm local time
- Talk track: scaling infra + peer reference

SLA: 5 MINUTES — CALL NOW
```

## 8. Measurement & KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Inbound → SQL conversion rate | 15-25% | CRM |
| P0 → Meeting booked rate | 60%+ | CRM |
| Median time-to-first-touch (P0) | <5 min | Flow logs |
| Median time-to-first-touch (P1) | <15 min | Flow logs |
| SLA breach rate (P0) | <5% | Flow logs |
| Rep utilization | 60-80% | CRM + Flow |
| Lead scoring accuracy | 70%+ (judge vs. rep) | Judge calibration |

## 9. Common Failures & Mitigations

| Failure | Cause | Mitigation |
|---------|-------|-----------|
| Lead sitting in CRM >24hr | Rep didn't see alert | Add Slack + email + CRM alert; Flow auto-reassign |
| Wrong rep assigned | Territory rules outdated | Monthly territory review; ICP Builder audit |
| P0 misclassified as P2 | ICP too narrow | Quarterly ICP review; add positive signals |
| Duplicate leads routed twice | Email alias / multi-form submit | Lead dedup on email+company domain; 24hr window |
| After-hours P0 missed | No on-call rotation | Atlas agent auto-texts on-call AE |

## 10. Integration with Outbound

Inbound leads that go cold (no meeting booked in 14 days) auto-transition to outbound nurture:
- Bard agent enrolls in 21-day sequence (see [Outbound Cold Email playbook](./outbound-cold-email.md))
- Score degrades by 5 points/week
- At P3 (after 4 weeks), lead returns to long-term nurture pool

This closes the loop between inbound and outbound — every inbound lead either converts, disqualifies, or transitions to a structured outbound sequence.
