---
title: "Inbound Lead Routing — Playbook"
category: playbook
playbook: inbound-lead-routing
tags: [inbound, lead-routing, sla, qualification, abm]
last_reviewed: "2026-07-08"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Inbound Lead Routing — Playbook

This playbook is the canonical reference for routing, qualifying, and dispatching inbound leads across the LeadReach 8-agent pipeline. It is primarily used by Atlas (Orchestrator), Scout (Prospect Discovery), Judge (Lead Qualification), and Flow (Pipeline Manager).

## 1. Why Inbound Routing Matters

Inbound leads — form fills, demo requests, content downloads, chat conversions — convert at **3-10x the rate of outbound** when contacted within 5 minutes, but **drop to parity with cold outbound by 24 hours** (Drift/MIT study, 2024 replication). The window is narrow, the stakes are high, and the routing decision determines whether the lead reaches an SDR while interest is still hot.

The LeadReach philosophy on inbound routing is **agent-augmented, not agent-replaced**. Atlas orchestrates the routing decision, Scout enriches the lead in real-time, Judge qualifies against ICP, and Flow dispatches to the right human rep via Slack/email/CRM assignment. The human SDR always makes the final outreach — agents handle the prep work.

### 1.1 The Speed-to-Lead Imperative

Research consistently shows that response time is the single most important factor in inbound conversion:

| First Response Time | Qualification Rate | Meeting Booked Rate | Source |
|--------------------|--------------------|--------------------|--------|
| <1 minute | 391% higher than 5+ min | 2.4x baseline | Drift/MIT, 2024 |
| 1–5 minutes | 80% of <1 min rate | 2.1x baseline | InsideSales, 2024 |
| 5–10 minutes | 50% of <1 min rate | 1.5x baseline | HBR, 2024 |
| 10–30 minutes | 30% of <1 min rate | 1.2x baseline | Lead Response Study |
| >30 minutes | Equivalent to cold outbound | 1.0x baseline | Multiple sources |
| >24 hours | Below cold outbound | 0.7x baseline | Drift/MIT, 2024 |

The implication is clear: every minute of delay destroys conversion probability. LeadReach's agent pipeline is designed to deliver a fully enriched, scored, and routed lead to a human rep within **2 minutes of ingestion**.

### 1.2 Inbound vs. Outbound Lead Quality

Inbound leads are not universally superior to outbound. Their quality depends heavily on the source and the prospect's intent:

| Lead Source | Avg. Quality | Conversion Rate | Volume | Cost per Lead |
|------------|-------------|----------------|--------|--------------|
| Demo request | Very high | 15-25% → SQL | Low | $200-500 |
| Contact sales form | High | 10-20% → SQL | Low-Medium | $150-400 |
| Free trial signup | Medium-High | 5-15% → SQL | Medium | $50-150 |
| Chat conversation | Medium-High | 8-18% → SQL | Low | $100-300 |
| Webinar registration | Medium | 3-8% → SQL | Medium | $50-100 |
| Content download | Low-Medium | 1-5% → SQL | High | $20-80 |
| Newsletter signup | Low | 0.5-2% → SQL | Very High | $5-20 |
| Paid ad click (no form) | Very low | 0.1-1% → SQL | Very High | $2-10 |

The routing and SLA must reflect these quality differences — a demo request deserves a 5-minute SLA; a newsletter signup does not.

## 2. The 5-Stage Inbound Routing Pipeline

### Stage 1: Ingestion (Real-Time, <1 second)

Inbound signals enter LeadReach via:
- Website forms (HubSpot, Marketo, custom)
- Chat (Drift, Intercom, Front)
- Email replies (parser detects intent)
- Calendar bookings (Calendly, Chili Piper)
- API integrations (Zoom webinars, G2 Crowd reviews)
- ICP-fit alerts (6sense, Demandbase)
- Social media DMs (LinkedIn, Twitter/X)
- Referral submissions (partner/affiliate)
- Product-led signals (in-app upgrade requests, usage thresholds)

The ingestion layer (Flow agent) normalizes the signal into a standard LeadEvent:

```typescript
{
  leadId: string;
  source: 'form' | 'chat' | 'email' | 'calendar' | 'webinar' | 'intent' | 'social' | 'referral' | 'product_led';
  subSource: string;  // e.g., "demo_request_form", "pricing_page_chat"
  timestamp: ISO8601;
  payload: Record<string, unknown>;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  intentSignal: 'high' | 'medium' | 'low';  // Inferred from source + behavior
}
```

#### Ingestion Priority Assignment

Flow agent assigns initial priority based on source:

| Source | Default Priority | Intent Signal | Rationale |
|--------|-----------------|---------------|-----------|
| Demo request form | P0 | High | Explicit buying intent |
| Contact sales form | P0 | High | Explicit buying intent |
| Pricing page chat | P0 | High | Bottom-of-funnel behavior |
| Calendar booking | P0 | High | Meeting already scheduled |
| Free trial signup | P1 | Medium | Product interest, not sales-ready |
| Webinar registration | P2 | Medium | Content interest, not sales-ready |
| Content download | P2 | Low-Medium | Top-of-funnel research |
| Chat (non-pricing) | P2 | Low-Medium | Varies by conversation |
| Email reply (positive) | P0 | High | Active engagement with outreach |
| Newsletter signup | P3 | Low | Minimal intent |
| Social DM | P2 | Medium | Varies by content |

### Stage 2: Enrichment (Real-Time, 2-5 seconds)

Scout agent enriches the lead in parallel:
- Company domain → website content, tech stack, recent news
- Email → LinkedIn profile, role, seniority
- IP → geolocation, ISP, company (if corporate IP)
- Phone → carrier lookup, line type (mobile/landline)
- Form data → ICP fit scoring (Judge agent)

The enrichment is **non-blocking** — the lead proceeds to routing even if enrichment is incomplete. Enrichment results catch up via WebSocket update.

#### Enrichment Data Points

| Data Point | Source | Priority | Used For |
|-----------|--------|----------|----------|
| Company name | Domain resolution | Required | ICP firmographic scoring |
| Industry/vertical | LinkedIn + NAICS lookup | Required | ICP scoring + messaging |
| Employee count | LinkedIn | High | ICP scoring + ACV estimation |
| Tech stack | PublicWWW + BuiltWith | High | ICP technographic scoring |
| Recent funding | Crunchbase | High | Trigger scoring |
| Recent hiring | LinkedIn jobs | Medium | Behavioral signal |
| Decision-maker title | LinkedIn profile | Required | Persona matching |
| Decision-maker seniority | LinkedIn profile | Required | Routing + messaging |
| Decision-maker tenure | LinkedIn profile | Medium | New-hire trigger detection |
| Company revenue | ZoomInfo / estimate | Medium | ACV estimation |
| Geographic location | IP + LinkedIn | Required | Territory routing |
| Previous engagement | CRM lookup | High | Lead dedup + routing |

#### Enrichment Fallback Strategy

When primary enrichment sources fail, Scout falls back:

| Primary Source Failed | Fallback | Confidence Impact |
|----------------------|----------|-------------------|
| LinkedIn profile not found | Email pattern + domain analysis | Medium confidence loss |
| Company LinkedIn not found | WHOIS + website scraping | High confidence loss |
| PublicWWW no results | Job posting tech mentions | Medium confidence loss |
| Crunchbase no funding data | News search for "funding" OR "raised" | Low confidence loss |
| IP geolocation inaccurate | Form-provided location | No confidence loss |

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

#### Source-Based Score Boosts

Inbound source provides a strong intent signal that adds to the base ICP score:

| Source/Behavior | Score Boost | Rationale |
|----------------|------------|-----------|
| Demo request | +20 | Highest explicit buying intent |
| Calendar booking | +25 | Committed time = highest intent |
| Pricing page visit | +15 | Bottom-of-funnel signal |
| Positive email reply | +30 | Active engagement |
| Contact sales form | +20 | Explicit buying intent |
| Chat (pricing page) | +15 | Bottom-of-funnel |
| Free trial signup | +10 | Product interest |
| Webinar registration | +10 | Content engagement |
| Content download | +5 | Top-of-funnel research |
| 3+ content downloads in 30d | +15 (replaces +5) | Accelerating research |
| Webinar attendance (not just registration) | +10 (additional) | Higher intent than registration |
| Referral from existing customer | +20 | Trust signal + social proof |
| Product usage threshold hit | +15 | PLG conversion signal |

#### Score Calculation Example

```
Base ICP Score (Judge agent): 72 (B-grade — firmographic fit, tech stack match)
+ Source boost (demo request): +20
+ Behavioral boost (pricing page visit 2 days ago): +15
+ Trigger boost (Series B funding 45 days ago): +10
- Decay (funding signal >30 days old): -3
───────────────────────────────────────
Total Score: 114 → Capped at 100 → P0

Result: Route to AE immediately, 5-minute SLA, Slack #hot-leads alert
```

### Stage 4: Routing Decision (Real-Time, <1 second)

Atlas agent routes based on:
- **Score tier** (P0/P1/P2/P3)
- **Geography** (rep territory)
- **Industry vertical** (rep specialization)
- **Account ownership** (existing owner wins)
- **Rep capacity** (current pipeline load)
- **Time-of-day** (after-hours → scheduled callback)
- **Language** (multi-language team routing)
- **Account tier** (ABM list check)

Routing rules are configurable per ICP and territory. Default: P0 → AE direct, P1 → SDR pool, P2 → automated nurture, P3 → disqualify.

#### Routing Priority Hierarchy

When multiple routing rules could apply, Atlas resolves in this order:

1. **Account ownership**: If the account already has an owner in CRM, route to that owner regardless of other rules.
2. **ABM tier**: Named accounts (Tier 1) always route to named AE.
3. **Score tier**: P0 → AE, P1 → SDR, P2 → nurture, P3 → disqualify.
4. **Geography**: Within score tier, match to territory.
5. **Vertical**: Within territory, match to industry-specialized rep.
6. **Capacity**: Within vertical, round-robin by rep capacity.
7. **Time-of-day**: If outside business hours, schedule for next business day (except P0).

### Stage 5: Dispatch & SLA Tracking (Real-Time → 5 minutes)

Flow agent dispatches via:
- **CRM assignment** (Salesforce, HubSpot) — owner field updated
- **Slack alert** to rep DM + channel #hot-leads for P0
- **Email alert** with enriched lead brief (Scout's research attached)
- **Calendar hold** — auto-book 15-min slot if rep's calendar has openings
- **SMS alert** for P0 leads outside business hours (on-call AE)

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
| P0 (90+) | New | US | After hours | On-call AE + Slack + SMS | 30 min |
| P0 (90+) | Existing | Any | Any | Account owner AE | 5 min |
| P0 (90+) | New | EU/UK | Business hours | EU AE direct | 15 min |
| P0 (90+) | New | APAC | Business hours | APAC AE direct | 30 min |
| P0 (90+) | New | Any | Weekend | On-call AE + Slack + SMS | 60 min |
| P1 (70-89) | New | US | Business hours | SDR pool (round-robin) | 15 min |
| P1 (70-89) | New | EU/UK | Business hours | EU SDR pool | 30 min |
| P1 (70-89) | Existing | Any | Any | Account SDR | 30 min |
| P1 (70-89) | New | Any | After hours | SDR pool (next morning) | Next AM |
| P2 (40-69) | New | Any | Any | Nurture sequence (Bard) | 24 hr |
| P2 (40-69) | Existing | Any | Any | Account SDR + nurture | 4 hr |
| P3 (0-39) | New | Any | Any | Disqualify + add to suppression | 7 days |
| P3 (0-39) | Existing | Any | Any | CSM notification + nurture | 24 hr |

### 3.1 Round-Robin Logic

When routing to a pool (SDR or AE), Atlas uses weighted round-robin:

| Weight Factor | Description | Impact on Assignment |
|--------------|-------------|---------------------|
| Active pipeline count | Current opps assigned | Lower pipeline = higher weight |
| Recent win rate | Last 90 days close rate | Higher win rate = higher weight |
| Response time compliance | SLA adherence rate | Better compliance = higher weight |
| Territory match | Geographic/vertical fit | Perfect match = 3x weight |
| Skill match | Rep's documented strengths | High match = 2x weight |
| Time since last assignment | Fairness factor | Longer gap = higher weight |

```typescript
// Round-robin weight calculation
weight = (1 / active_pipeline_count) × 
         (win_rate / avg_win_rate) × 
         (sla_compliance / avg_sla_compliance) × 
         (territory_match ? 3 : 1) ×
         (skill_match ? 2 : 1) ×
         (hours_since_last_assignment / 24)
```

### 3.2 Territory-Based Routing Configuration

```yaml
routing_config:
  territories:
    - name: "US West"
      reps: ["ae_west_1", "ae_west_2", "ae_west_3"]
      sdrs: ["sdr_west_1", "sdr_west_2"]
      timezone: "PST/PDT"
      business_hours: "8am-6pm"
      on_call: "ae_west_oncall"
    
    - name: "US East"
      reps: ["ae_east_1", "ae_east_2", "ae_east_3", "ae_east_4"]
      sdrs: ["sdr_east_1", "sdr_east_2", "sdr_east_3"]
      timezone: "EST/EDT"
      business_hours: "8am-6pm"
      on_call: "ae_east_oncall"
    
    - name: "EMEA"
      reps: ["ae_emea_1", "ae_emea_2"]
      sdrs: ["sdr_emea_1"]
      timezone: "GMT/CET"
      business_hours: "9am-5pm GMT"
      on_call: null  # No after-hours for EMEA
    
    - name: "APAC"
      reps: ["ae_apac_1"]
      sdrs: ["sdr_apac_1"]
      timezone: "SGT/AEST"
      business_hours: "9am-6pm SGT"
      on_call: null
```

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
- Enrichment brief (key signals and recommended talk track)

### 4.1 SLA Compliance Dashboard

| Metric | Target | Yellow Flag | Red Flag |
|--------|--------|-------------|----------|
| P0 SLA compliance | >95% | <90% | <80% |
| P1 SLA compliance | >90% | <85% | <75% |
| P2 SLA compliance | >80% | <70% | <60% |
| Avg response time (P0) | <3 min | >5 min | >10 min |
| Avg response time (P1) | <10 min | >15 min | >30 min |
| SLA breach rate (overall) | <5% | >10% | >15% |

### 4.2 Auto-Reassignment Rules

When SLA breaches reach the third tier, Flow auto-reassigns:

1. Identify backup rep with lowest active pipeline + territory match
2. Reassign in CRM (owner field update)
3. Notify original rep's manager + backup rep via Slack
4. Attach full enrichment brief to new assignment
5. Reset SLA clock with 50% of original SLA (e.g., P0 gets 2.5 min instead of 5 min)
6. Log reassignment reason for reporting

## 5. Account-Based Routing (ABM)

For named-account ABM motions, routing rules override score-based routing:

- **Tier 1 accounts** (top 100 named): Always route to named AE, regardless of score. Even P2 → AE nurture, not SDR.
- **Tier 2 accounts** (next 500): Route to ABM pod (AE + SDR pair). Both notified.
- **Tier 3 accounts** (next 2,000): Standard routing rules apply.

Atlas agent checks the ABM list before applying score-based routing. ABM list is configured in the ICP Builder.

### 5.1 ABM Routing Rules

| Account Tier | Lead Score | Route To | SLA | Notes |
|-------------|-----------|----------|-----|-------|
| Tier 1 | Any | Named AE (always) | 5 min | AE handles all inbound from named accounts |
| Tier 2 | P0-P1 | ABM pod (AE + SDR) | 5 min | Both notified; AE leads |
| Tier 2 | P2-P3 | SDR (ABM pod) | 15 min | SDR handles; AE CC'd |
| Tier 3 | Any | Standard routing | Standard | No ABM override |
| Not on ABM list | Any | Standard routing | Standard | Score-based routing |

### 5.2 ABM Inbound Alert Template

When a Tier 1 account submits an inbound form:

```
🚨 ABM TIER 1 INBOUND — [Company]
====================================
Lead: [Name], [Title]
Source: [Source]
Score: [X]/100 — [P-tier]

ACCOUNT CONTEXT:
- ABM Tier: 1 (Named Account)
- Named AE: [AE Name]
- Account status: [New/Active/Pipeline/Champion]
- Last touch: [Date + action]

SIGNALS:
- [Trigger 1]
- [Trigger 2]

ASSIGNMENT: [AE Name] — SLA: 5 MINUTES
ACTION: Call [phone] or email [email] NOW
```

## 6. Inbound Channel-Specific Rules

### Website Form (Demo Request)
- **Trigger**: Form submit with >3 fields including email
- **Score boost**: +20 to base ICP score
- **Routing**: Standard pipeline
- **Special**: If "phone" field provided, P0 auto-promotion
- **Enrichment priority**: Full (company + contact + tech + triggers)
- **Rep brief**: Full lead brief with talk track

### Chat (Drift/Intercom)
- **Trigger**: Chat conversation with >2 messages from prospect
- **Score boost**: +15 (high intent)
- **Routing**: Rep online → live transfer; rep offline → book meeting
- **Special**: Chatbot pre-qualifies 3 questions (company size, role, timeline)
- **Enrichment priority**: Standard (company + contact)
- **Rep brief**: Condensed brief with chat transcript

### Email Reply
- **Trigger**: Reply to outbound sequence with positive sentiment
- **Score boost**: +30 (highest intent signal)
- **Routing**: Original sequence owner → immediate reply
- **Special**: Bard agent drafts suggested reply for rep to send
- **Enrichment priority**: Light (contact only; company already enriched)
- **Rep brief**: Context from original sequence + suggested reply

### Content Download
- **Trigger**: Gated content unlock (ebook, whitepaper, template)
- **Score boost**: +5 (low intent alone, high in sequence)
- **Routing**: P2 default → nurture sequence (Bard agent)
- **Special**: After 3 downloads in 30 days, auto-promote to P1
- **Enrichment priority**: Light (company only)
- **Rep brief**: None for P2; standard for P1 promotion

### Webinar Registration
- **Trigger**: Registration confirmation
- **Score boost**: +10
- **Routing**: Pre-webinar → nurture; post-attendance → P1 (high intent)
- **Special**: No-show → P2, follow-up with recording
- **Enrichment priority**: Standard for post-attendance; light for registration
- **Rep brief**: Standard for post-attendance leads

### Calendar Booking
- **Trigger**: Meeting booked (Calendly/Chili Piper)
- **Score boost**: +25 (highest intent short of demo attended)
- **Routing**: Rep booked = rep notified; auto-prep brief by Sage agent
- **Special**: Cancel/reschedule → auto-follow-up sequence
- **Enrichment priority**: Full (complete profile for meeting prep)
- **Rep brief**: Full meeting prep brief (see Section 7.1)

### Social Media DM
- **Trigger**: LinkedIn or Twitter/X DM from prospect
- **Score boost**: +10
- **Routing**: Social media manager → SDR follow-up
- **Special**: Auto-acknowledge within 5 min ("Thanks for reaching out! Let me connect you with [SDR name]")
- **Enrichment priority**: Standard (LinkedIn profile data available)
- **Rep brief**: Social context + profile summary

### Referral
- **Trigger**: Existing customer submits referral
- **Score boost**: +20 (trust signal)
- **Routing**: Referring customer's AE → immediate follow-up
- **Special**: Auto-thank referrer; track referral source for reward program
- **Enrichment priority**: Light (referrer provides context)
- **Rep brief**: Referrer context + company data

### Product-Led Signal
- **Trigger**: Usage threshold hit (e.g., 100th action, feature limit reached)
- **Score boost**: +15
- **Routing**: Growth/PLG team → outreach for upgrade
- **Special**: Only trigger for freemium/trial users; never for paid customers
- **Enrichment priority**: Product usage data + company data
- **Rep brief**: Usage summary + upgrade recommendation

### 6.1 Channel Priority Matrix for Multi-Source Leads

When a prospect triggers multiple inbound channels simultaneously (e.g., downloads content + starts chat), Atlas resolves priority:

| Channel Combination | Routing Priority | Rationale |
|---------------------|-----------------|-----------|
| Demo request + chat | P0 (demo request wins) | Highest intent source takes precedence |
| Content download + email reply | P0 (email reply wins) | Active engagement > passive consumption |
| Webinar registration + content download | P1 (webinar wins) | Live event > gated content |
| Social DM + content download | P2 (social DM wins) | Conversation > download |
| Calendar booking + any other | P0 (calendar wins) | Committed time = strongest signal |

## 7. Post-Dispatch: The Rep Brief

When a lead is dispatched, Flow agent attaches a **Lead Brief** compiled by Scout and Sage:

### 7.1 Full Lead Brief Template (P0/P1)

```
LEAD BRIEF — [Name] at [Company]
==================================
Source: [Source]
Score: [P-tier] ([score]/100)
Submitted: [Time] ([minutes] ago)

COMPANY SNAPSHOT
- Industry: [Vertical]
- Size: [X] employees (LinkedIn, [date])
- Revenue: [Estimate] (Source: [source])
- Funding: [Stage, amount, date] (Source: Crunchbase)
- Tech stack: [Key technologies detected]
- HQ: [City, State/Country]
- ICP Fit: [Grade] — [matched criteria]

PROSPECT SNAPSHOT
- Role: [Title] (reports to [manager title])
- Tenure: [X years] at company
- Previous: [Previous role/company]
- LinkedIn: [URL]
- Email: [Email]
- Phone: [Phone, if available] ([mobile/landline])

TRIGGER SIGNALS
1. [Trigger 1 — source, date]
2. [Trigger 2 — source, date]
3. [Trigger 3 — source, date]

PEER REFERENCES
- [Peer company] in same vertical — customer since [date]
  Result: [quantified outcome]

SUGGESTED OUTREACH
- Best channel: [Phone / Email / LinkedIn]
- Best time: [Time window] local time
- Talk track: [Role-specific messaging angle]
- Objection to anticipate: [Likely objection + response]
- Peer reference to offer: [Which peer + which result]

SLA: [X] MINUTES — [ACTION] NOW
```

### 7.2 Condensed Brief Template (P2)

```
QUICK BRIEF — [Name] at [Company]
==================================
Source: [Source] | Score: P2 ([score]/100) | Added to nurture
Industry: [Vertical] | Size: [X] employees
Trigger: [Top trigger if any]
Action: Bard nurture sequence initiated
Escalation: If replies, promote to P1 and route to SDR
```

### 7.3 Meeting Prep Brief Template (Calendar Booking)

```
MEETING PREP — [Name] at [Company]
====================================
Meeting: [Date/Time] | Duration: [X] min | Booked: [X] days ago

ATTENDEE PROFILE
- [Name], [Title]: [Tenure], previous at [Company], reports to [Manager]
- [Other attendees from same company]

COMPANY DEEP DIVE
- Business model: [Description]
- Key challenges: [From research/news]
- Current tools: [Tech stack relevant to your product]
- Competitive landscape: [Known competitors they use]

TRIGGER ANALYSIS
- Primary trigger: [Trigger] — why they're likely looking now
- Secondary signals: [List]

AGENDA RECOMMENDATIONS
1. Confirm their situation: "What prompted you to reach out?"
2. Share relevant peer story: "[Peer company] in [vertical] faced [similar challenge]"
3. Demonstrate fit: Show [specific feature/workflow] that addresses their trigger
4. Soft close: "Worth exploring further with your team?"

PREP MATERIALS
- Case study: [Peer company case study link]
- Demo flow: [Suggested demo path for their use case]
- ROI calculator: [Pre-filled with their company data]
```

## 8. Lead Deduplication

Duplicate leads waste rep time and create confusing customer experiences. Flow agent deduplicates in real-time:

### 8.1 Dedup Rules

| Match Criteria | Action | Example |
|---------------|--------|---------|
| Exact email match | Merge into existing lead | Same person, different form submissions |
| Same company domain + same title | Merge into existing lead | Same person, email format changed |
| Same company domain + different person | Create new lead, link to existing account | Different contacts at same company |
| Same person, different email domains | Merge using LinkedIn profile match | Work email + personal email |
| Same company, slight name variations | Fuzzy match; merge if >80% confidence | "Acme Inc" vs "Acme Corporation" |

### 8.2 Dedup Flow

```
New lead ingested
├── Exact email match in CRM?
│   ├── Yes → Merge; update source + timestamp; don't re-route
│   └── No → Fuzzy match (company domain + name)?
│       ├── Yes (confidence >80%) → Merge; update enrichment
│       └── No → New lead record; link to existing account if company matches
```

### 8.3 Multi-Touch Attribution

When a lead has multiple inbound touches before being routed, Flow tracks the full attribution chain:

```
Lead: jane@acme.com
Touch 1: Content download (ebook) — Day 0 — +5 score boost
Touch 2: Webinar attendance — Day 5 — +10 score boost  
Touch 3: Demo request form — Day 8 — +20 score boost
────────────────────────────────────────────────
Total source boost: +35 (capped at +30)
Primary source for routing: Demo request (highest intent)
Secondary sources for context: Content download, webinar
Attribution: Multi-touch (content assisted → webinar educated → demo converted)
```

## 9. Measurement & KPIs

| Metric | Target | Source | Frequency |
|--------|--------|--------|-----------|
| Inbound → SQL conversion rate | 15-25% | CRM | Weekly |
| P0 → Meeting booked rate | 60%+ | CRM | Weekly |
| Median time-to-first-touch (P0) | <5 min | Flow logs | Daily |
| Median time-to-first-touch (P1) | <15 min | Flow logs | Daily |
| SLA breach rate (P0) | <5% | Flow logs | Daily |
| SLA breach rate (P1) | <10% | Flow logs | Daily |
| Rep utilization | 60-80% | CRM + Flow | Weekly |
| Lead scoring accuracy | 70%+ (judge vs. rep) | Judge calibration | Monthly |
| Enrichment completion rate | >85% within 5 min | Scout logs | Daily |
| Dedup accuracy | >95% (no false merges) | Flow logs | Monthly |
| Inbound lead volume trend | Growing 10%+ QoQ | CRM | Monthly |

### 9.1 Source Performance Comparison

Track inbound performance by source to optimize marketing spend:

| Source | Volume (monthly) | ICP Fit Rate | → SQL Rate | → Meeting Rate | → Close Rate | CAC |
|--------|-----------------|-------------|------------|----------------|-------------|-----|
| Demo request | [X] | 65% | 25% | 60% | 30% | $[X] |
| Contact sales | [X] | 55% | 20% | 50% | 25% | $[X] |
| Free trial | [X] | 40% | 12% | 40% | 20% | $[X] |
| Chat | [X] | 50% | 18% | 45% | 22% | $[X] |
| Webinar | [X] | 30% | 6% | 35% | 15% | $[X] |
| Content download | [X] | 20% | 3% | 25% | 10% | $[X] |
| Newsletter | [X] | 10% | 1% | 15% | 5% | $[X] |

### 9.2 Diagnostic Patterns

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| High volume, low SQL rate | Marketing attracting wrong ICP | Tighten form fields; add qualifying questions |
| Low volume, high SQL rate | Marketing too restrictive | Broaden content; increase ad spend |
| High SQL rate, low meeting rate | SDR not following up fast enough | Check SLA compliance; add speed-to-lead alerts |
| High meeting rate, low close rate | AE discovery or pricing issue | Review discovery calls; adjust pricing/positioning |
| P0 leads sitting idle | Rep capacity issue | Add reps; improve routing; auto-reassign on SLA breach |
| Many P3 false negatives | ICP too narrow | Review ICP criteria; add positive signals |
| Many P1 false positives | ICP too broad | Tighten ICP; add negative signals |
| Enrichment delays | Scout agent capacity issue | Scale Scout infrastructure; optimize enrichment queries |

## 10. Common Failures & Mitigations

| Failure | Cause | Mitigation | Detection |
|---------|-------|-----------|-----------|
| Lead sitting in CRM >24hr | Rep didn't see alert | Add Slack + email + CRM alert; Flow auto-reassign | Flow SLA monitoring |
| Wrong rep assigned | Territory rules outdated | Monthly territory review; ICP Builder audit | CRM routing audit |
| P0 misclassified as P2 | ICP too narrow | Quarterly ICP review; add positive signals | Judge vs. rep calibration |
| Duplicate leads routed twice | Email alias / multi-form submit | Lead dedup on email+company domain; 24hr window | Dedup monitoring |
| After-hours P0 missed | No on-call rotation | Atlas agent auto-texts on-call AE | SLA breach report |
| Enrichment fails silently | Scout source API down | Health check + fallback sources; manual enrichment queue | Scout error logs |
| Nurture leads never re-qualified | No promotion from P2→P1 | Auto-promote on engagement signals; monthly P2 review | Nurture pipeline audit |
| ABM account routed to wrong rep | ABM list not synced | Real-time ABM list sync; CRM account ownership check | ABM routing audit |

## 11. Integration with Outbound

Inbound leads that go cold (no meeting booked in 14 days) auto-transition to outbound nurture:
- Bard agent enrolls in 21-day sequence (see [Outbound Cold Email playbook](./outbound-cold-email.md))
- Score degrades by 5 points/week
- At P3 (after 4 weeks), lead returns to long-term nurture pool
- If lead re-engages during outbound sequence, auto-promote back to P1

### 11.1 Inbound-Outbound Loop Closure

```
Inbound lead → P1 → SDR outreach → No meeting in 14 days
    ↓
Transition to outbound (Bard sequence)
    ↓
Week 1-3: Standard outbound sequence
    ↓
Lead re-engages? → Yes → Promote to P1, route back to SDR
                  → No → Score degrades to P3
                  ↓
              Long-term nurture (monthly content)
                  ↓
              New inbound trigger? → Yes → Re-enter at appropriate P-tier
```

This closes the loop between inbound and outbound — every inbound lead either converts, disqualifies, or transitions to a structured outbound sequence.

## 12. Atlas Agent Inbound Routing Workflow

When Atlas receives an inbound lead event:

1. **Ingest**: Flow agent captures and normalizes the lead event.
2. **Dedup**: Check CRM for existing lead/account. Merge if duplicate found.
3. **Enrich**: Scout agent enriches in parallel (company, contact, tech, triggers).
4. **Score**: Judge agent scores against active ICP + source boost.
5. **Check ABM**: Atlas checks if account is on named account list.
6. **Route**: Atlas selects the right rep based on score, territory, capacity.
7. **Dispatch**: Flow assigns in CRM + sends alerts (Slack, email, SMS).
8. **Track SLA**: Flow monitors response time; escalates on breach.
9. **Generate brief**: Scout + Sage compile lead brief for rep.
10. **Loop**: If lead goes cold, transition to outbound sequence.

### Atlas Configuration Schema

```yaml
inbound_routing:
  default_sla:
    p0: 300  # seconds (5 minutes)
    p1: 900  # seconds (15 minutes)
    p2: 86400  # seconds (24 hours)
    p3: 604800  # seconds (7 days)
  
  escalation:
    tier1: "rep_manager"  # SLA breach
    tier2: "vp_sales"     # SLA + 1 hour
    tier3: "cro"          # SLA + 4 hours; auto-reassign
  
  enrichment:
    timeout: 5  # seconds before routing proceeds without full enrichment
    fallback_sources: true  # Use fallback if primary fails
  
  dedup:
    match_on: ["email", "company_domain + name_fuzzy"]
    merge_strategy: "newest_wins"  # Newer data overwrites older
    window: 86400  # 24-hour dedup window
  
  abm_override: true  # ABM list overrides score-based routing
  round_robin: "weighted"  # Weighted by pipeline, win rate, capacity
  after_hours_action: "schedule_next_business_day"  # Except P0: auto-page on-call
