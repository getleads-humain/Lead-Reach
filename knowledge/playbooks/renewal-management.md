---
title: "Renewal Management — Playbook"
category: playbook
playbook: renewal-management
tags: [renewal, retention, expansion, upsell, contract-renewal, NRR]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Renewal Management — Playbook

This playbook is the canonical reference for managing LeadReach customer renewals. It covers renewal forecasting, health assessment, expansion opportunity identification, negotiation strategies, and at-risk renewal intervention. Used by Echo (Health Monitoring), Atlas (Renewal Orchestration), Bard (Renewal Communication), and Flow (Renewal Tracking).

## 1. Why Renewal Management Matters

Renewals are the foundation of SaaS economics. A company with 90% gross revenue retention (GRR) and 120% net revenue retention (NRR) is valued at **2-3x the multiple** of a company with 80% GRR and 100% NRR. Every renewal is a referendum on LeadReach's value — and the outcome determines whether the business compounds or erodes.

Key principles:
- **Renewal is not a transaction** — it's the continuation of a value relationship
- **Renewal management starts on Day 1** — not 90 days before the contract expires
- **Every renewal should include an expansion conversation** — flat renewals are missed opportunities
- **Proactive renewal management** beats reactive — engaging early increases retention by 25-40%

## 2. Renewal Timeline and Stages

### 2.1 The 365-Day Renewal Cycle

| Days Before Renewal | Stage | Action | Owner |
|---------------------|-------|--------|-------|
| 365-180 | Ongoing value delivery | Regular CSM touchpoints; value documentation | CSM |
| 180-120 | Health assessment | Echo generates Renewal Health Score; identify at-risk accounts | Echo |
| 120-90 | Expansion planning | Identify upsell/expansion opportunities; prepare business case | Atlas + CSM |
| 90-60 | Renewal outreach | First renewal conversation; present value + expansion proposal | CSM + AE |
| 60-30 | Negotiation | Address objections; negotiate terms; secure commitment | AE + CSM |
| 30-0 | Close | Contract execution; transition to next term | Flow |

### 2.2 Renewal Health Score (Echo Agent)

Echo calculates a RenewalHealthScore (0-100) for every customer 180 days before renewal:

| Factor | Weight | Scoring |
|--------|--------|---------|
| Product adoption (DAU/MAU) | 20 | >70% adoption = 20; 50-70% = 15; <50% = 5 |
| Seat utilization | 15 | >80% = 15; 60-80% = 10; <60% = 5 |
| Support health | 15 | No P1/P2 open = 15; 1-2 P2 = 10; P1 or 3+ P2 = 3 |
| NPS score | 15 | 9-10 = 15; 7-8 = 10; 0-6 = 3 |
| Champion engagement | 10 | Active = 10; declining = 5; departed = 0 |
| Payment history | 10 | On-time = 10; 1-2 late = 5; 3+ late = 2 |
| Value realization | 10 | Documented ROI = 10; partial = 5; none = 0 |
| Executive relationship | 5 | Active = 5; minimal = 3; none = 0 |

**Renewal health tiers**:
- **Secure (75+)**: Expected to renew; focus on expansion
- **Stable (50-74)**: Likely to renew with standard engagement; monitor closely
- **At-Risk (25-49)**: Unlikely to renew without intervention; escalate to CSM + AE
- **Critical (0-24)**: High probability of churn; executive intervention required

## 3. The Renewal Workflow (Step-by-Step)

### Step 1: Ongoing Value Delivery (CSM, Days 365-180)

The renewal is won or lost in the first 6 months of the contract, not the last 90 days. CSM maintains:

- **Quarterly business reviews (QBRs)**: Review results, set goals, document value
- **Adoption monitoring**: Echo tracks product usage; CSM addresses declines
- **Feature adoption**: Ensure customer is using the features they're paying for
- **Relationship building**: Regular check-ins; understand changing needs
- **Issue resolution**: Proactive support; prevent P1/P2 tickets from festering

### Step 2: Health Assessment (Echo, Days 180-120)

Echo generates a **Renewal Health Report** for every customer approaching renewal:

```
Account: [Company Name]
Current ACV: $X
Renewal Date: [Date]
Renewal Health Score: [0-100] — [Tier]

Top Positive Signals:
1. [e.g., Seat utilization at 92%]
2. [e.g., NPS score of 9]
3. [e.g., Champion actively engaged]

Top Risk Signals:
1. [e.g., Support ticket spike in Q3]
2. [e.g., DAU declining 15% MoM]

Expansion Opportunity:
- [e.g., 3 additional departments could benefit]
- [e.g., Seat expansion: 10 seats → 25 seats]
- [e.g., Tier upgrade: Professional → Growth]

Recommended Action:
- [e.g., Schedule EBR with VP Sales; propose expansion to 25 seats]
```

### Step 3: Expansion Planning (Atlas + CSM, Days 120-90)

Every renewal should include an expansion conversation. Atlas and CSM identify:

| Expansion Type | Signal | Proposal |
|---------------|--------|----------|
| Seat expansion | Utilization >80%; hiring SDRs | Add seats at current per-seat rate |
| Tier upgrade | SSO request; analytics needs | Upgrade to next tier with feature comparison |
| Department expansion | Other teams inquiring | Multi-team deployment proposal |
| Multi-year commitment | Customer happy; budget predictability | 2-year deal with discount + escalator cap |
| Add-on features | Specific feature requests | Bundle add-ons at renewal |

**Bard prepares the renewal proposal** including both the base renewal and the expansion opportunity.

### Step 4: Renewal Outreach (CSM + AE, Days 90-60)

**First renewal conversation** — a structured meeting covering:

1. **Value recap**: Present the Value Realization Report for the current term
2. **Goal alignment**: What are the customer's goals for the next term?
3. **Expansion opportunity**: Introduce the expansion proposal (if applicable)
4. **Pricing**: Present renewal pricing + expansion pricing
5. **Timeline**: Align on renewal execution timeline

**Renewal email template**:
**Subject**: `your leadreach renewal — [date]`

> Hi [first name],
>
> Your LeadReach renewal is coming up on [date]. Before we discuss terms, I wanted to share your results from this term:
>
> | Metric | Result |
> |--------|--------|
> | Sequences sent | [X] |
> | Average reply rate | [X]% |
> | Meetings booked | [X] |
> | ROI | [X]x |
>
> I've prepared a renewal proposal that includes [expansion opportunity, e.g., "additional seats for your growing team" / "an upgrade to Growth tier with advanced analytics"].
>
> Worth a 30-minute conversation to review?
>
> [CSM name]

### Step 5: Negotiation (AE, Days 60-30)

Common renewal negotiation scenarios:

| Scenario | Strategy |
|----------|----------|
| Customer requests price reduction | Trade: reduced price for multi-year commitment or case study |
| Customer wants to reduce seats | Understand: is it budget or adoption? If adoption, offer re-onboarding. If budget, propose smaller tier. |
| Customer wants to switch to monthly | Counter: annual at current rate or monthly at 20% premium |
| Customer competing with budget priorities | Provide ROI data; offer phased payment; executive engagement |
| Customer comparing to competitor | Competitive differentiation; peer references; TCO comparison |

**Renewal discount rules**:

| Discount Level | Approval | Condition |
|---------------|----------|-----------|
| 0% (standard renewal) | CSM | No discount; list price |
| 5% (loyalty discount) | AE | Multi-year commitment |
| 10% (expansion discount) | Sales Manager | Expansion + multi-year |
| 15%+ | VP Sales | Strategic account; requires justification |

### Step 6: Contract Execution (Flow, Days 30-0)

- Auto-renewal: if contract includes auto-renewal, Flow confirms and executes
- Manual renewal: AE/CSM sends renewal contract via DocuSign
- Expansion amendment: if expansion is included, process as contract amendment
- Payment terms: same as original contract unless renegotiated

## 4. At-Risk Renewal Intervention

### 4.1 At-Risk Signals and Response

| Signal | Severity | Intervention |
|--------|----------|-------------|
| NPS score 0-6 | Critical | Executive outreach; service recovery plan |
| Champion departure | Critical | Identify new champion within 7 days; rebuild relationship |
| DAU decline >30% MoM | High | CSM re-onboarding; feature training; usage review |
| Support ticket spike | High | Root cause analysis; dedicated support resource |
| Payment delay >15 days | Medium | Finance outreach; understand situation; offer payment plan |
| Competitor evaluation | High | Competitive differentiation; peer references; executive engagement |
| No QBR in last 6 months | Medium | Schedule immediate QBR; document value |
| Auto-renewal disabled | Medium | Understand why; address concerns proactively |

### 4.2 Executive Intervention Protocol

For Critical-tier accounts:
1. **VP CS outreach**: Personal call to customer executive sponsor
2. **Service recovery plan**: Specific commitments with timeline and accountability
3. **Weekly status meetings**: Until health score improves to Stable
4. **Executive sponsor assignment**: LeadReach VP+ assigned to the account
5. **Value re-demonstration**: Custom demo of new features; ROI recalculation

## 5. Agent Responsibilities

| Agent | Renewal Role |
|-------|-------------|
| Atlas | Orchestrates renewal strategy; manages at-risk interventions; coordinates expansion |
| Scout | Monitors champion departure signals; tracks competitor evaluation signals |
| Forge | Enriches renewal data with usage analytics; tracks payment history |
| Sage | Researches customer's business context for renewal conversation; competitive intelligence |
| Judge | Scores renewal health; predicts churn probability; validates expansion opportunity |
| Bard | Composes renewal communications; drafts value reports; writes expansion proposals |
| Flow | Tracks renewal pipeline; manages SLAs; processes contract renewals |
| Echo | Monitors health scores; generates renewal reports; tracks retention metrics |

## 6. Target Persona and ICP Criteria

### Renewal Stakeholders

| Stakeholder | Role in Renewal | Engagement Strategy |
|-------------|----------------|-------------------|
| **Champion** | Internal advocate; confirms value | Regular CSM relationship; value documentation |
| **Economic Buyer** | Approves budget; signs contract | EBR with ROI data; expansion business case |
| **IT / Security** | Confirms technical compliance | Security documentation; compliance updates |
| **Procurement** | Manages contract process | Smooth procurement experience; pre-prepared documents |
| **End Users** | Validate day-to-day value | Adoption monitoring; training; feedback loops |

## 7. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| 180 days before renewal | Calendar (Flow agent) | Echo generates Renewal Health Report |
| NPS score drops to 0-6 | NPS survey tool | Flag as Critical; VP CS outreach |
| Champion departs company | LinkedIn (Scout) | Alert CSM; identify new champion |
| Seat utilization drops below 60% | Product analytics (Echo) | At-risk flag; CSM adoption intervention |
| Competitor evaluation detected | Scout / CSM notes | Competitive retention package; executive engagement |
| 90 days before renewal | Calendar | CSM + AE renewal outreach |
| Payment delay >15 days | Billing system | Finance outreach; understand situation |
| Support ticket spike (3+ in 30 days) | Support system | Root cause analysis; dedicated support |

## 8. Email / Sequence Templates

### Template 1: Renewal Introduction (CSM, Day 90)

**Subject**: `your leadreach renewal — [date]`

> Hi [first name],
>
> Your LeadReach contract comes up for renewal on [date]. I've been reviewing your team's results, and it's been a strong term:
>
> - [X] sequences sent across your team
> - [Y]% average reply rate ([above/below] industry benchmark)
> - [Z] meetings booked from LeadReach outbound
>
> I'd love to schedule 30 minutes to discuss:
> 1. Your results and ROI from this term
> 2. Your goals for the next term
> 3. Potential expansion opportunities (your team has been growing!)
>
> Available next Tuesday or Wednesday?
>
> [CSM name]

### Template 2: Value Realization Report (CSM, Day 75)

**Subject**: `your [year] results with leadreach`

> Hi [first name],
>
> Attached is your Value Realization Report for the current term. Highlights:
>
> | Metric | Before LeadReach | After LeadReach | Improvement |
> |--------|-----------------|----------------|-------------|
> | Reply rate | X% | Y% | +Z% |
> | Meetings/SDR/week | X | Y | +Z |
> | SDR ramp time | X weeks | Y weeks | -Z weeks |
> | Outbound-sourced pipeline | $X | $Y | +Z% |
>
> Your team's ROI this term: **[X]x**.
>
> Looking forward to our renewal conversation on [date].
>
> [CSM name]

### Template 3: At-Risk Intervention (VP CS, Critical Accounts)

**Subject**: `your leadreach experience — let's talk`

> Hi [first name],
>
> I'm [VP CS name], and I've been reviewing your account. I want to make sure we're delivering the value your team deserves.
>
> I understand [specific concern, e.g., "you've experienced some challenges with [feature/support]"]. That's not acceptable, and I'd like to personally commit to resolving it.
>
> Can we schedule 30 minutes this week? I'd like to:
> 1. Understand your current experience
> 2. Share a specific improvement plan
> 3. Ensure we're aligned on your goals for the next term
>
> [VP CS name]

## 9. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "We need a price reduction to renew" | Budget pressure or perceived overpayment | "Let me show you the ROI from this term. At [X]x return, the investment is well justified. However, if budget is the concern, I can offer a 5% reduction for a 2-year commitment." |
| "We're evaluating [competitor]" | Competitive pressure or dissatisfaction | "I'd like to understand what's driving the evaluation. If there's a gap we can address, I want to know. Can we schedule a competitive comparison?" |
| "We're reducing our team size" | Company contraction | "I'm sorry to hear that. We can adjust your seat count to match your current team. Would [X seats] at [tier] work?" |
| "We're not seeing enough value" | Value not documented or realized | "That concerns me. Can you share what's missing? We may need a re-onboarding or a feature deep-dive to ensure you're using LeadReach to its full potential." |
| "We want month-to-month instead of annual" | Risk aversion | "We offer annual contracts for a reason — it gives us the runway to invest in your success. However, I can offer a 90-day opt-out on the annual contract. If you're not satisfied, you can cancel with a full refund." |
| "Auto-renewal is a concern" | Process objection | "We can switch to manual renewal. I'll send a reminder 90 days before your renewal date so you have time to evaluate." |
| "We want to consolidate vendors" | Tool rationalization | "Understood. LeadReach often replaces 2-3 point solutions (sequencing, analytics, data enrichment). Can I show you how consolidation with LeadReach could reduce your total tool spend?" |

## 10. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Gross Revenue Retention (GRR) | 90%+ | Finance |
| Net Revenue Retention (NRR) | 120%+ | Finance |
| Logo retention | 92%+ | CRM |
| Renewal rate (by health tier) | Secure: 98%+ / Stable: 90%+ / At-Risk: 70%+ | CRM |
| Renewal with expansion rate | >50% | CRM |
| Average expansion at renewal | +20-30% ACV | CRM |
| Time from renewal outreach to signed contract | <45 days | Flow agent |
| Renewal health score accuracy | >85% predictiveness | Echo agent |
| At-risk intervention success rate | >60% saved | CRM |
| Renewal discount rate | <10% average | Finance |

## 11. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| Late renewal engagement (30 days before) | No tracking; CSM busy with new customers | Flow agent enforces 90-day outreach SLA; auto-alerts at 180/120/90 days |
| No value documentation | CSM didn't track results throughout the term | Echo auto-generates Value Realization Reports quarterly |
| Flat renewal (no expansion) | No expansion conversation at renewal | Atlas mandates expansion assessment for every renewal |
| Surprise churn | At-risk signals missed; no health monitoring | Echo monitors health scores continuously; alerts at score drops |
| Over-discounting to retain | AE panics and offers deep discount | Renewal discount matrix; max 10% without VP approval |
| Champion departure not detected | CSM didn't monitor LinkedIn; no stakeholder mapping | Scout monitors champion LinkedIn activity; alerts on role changes |
| Renewal process friction | Procurement delays; contract redlining | Pre-prepare renewal documents; offer auto-renewal with opt-out |

## 12. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| CRM (Salesforce/HubSpot) | Renewal pipeline tracking, health scoring | Critical |
| Billing (Stripe / Zuora) | Renewal processing, revenue tracking | Critical |
| Customer success platform (Gainsight / Totango) | Health scoring, renewal workflows | Critical |
| NPS tool (Delighted / AskNicely) | Satisfaction monitoring | High |
| Product analytics (Amplitude / Mixpanel) | Usage monitoring, adoption tracking | High |
| E-signature (DocuSign) | Contract execution | High |
| Support system (Zendesk / Intercom) | Ticket monitoring, escalation | Medium |
| LinkedIn Sales Navigator | Champion departure monitoring | Medium |

## 13. Example Scenario

**Account**: BrightPath Software, 350 employees, SaaS

**Current contract**: 25 seats, Growth tier, $38,700/year, renewal in 90 days

**Health assessment (Echo, Day 180)**:
- Renewal Health Score: 68 (Stable)
- Positive: Seat utilization 82%, NPS 8, on-time payments
- Risk: DAU declined 12% MoM in last 2 months; no QBR in 4 months
- Expansion opportunity: Marketing team (8 seats) + 5 additional SDR seats

**Motion executed**:
1. **Day 120**: Atlas reviews health report. Strategy: address DAU decline; propose expansion.
2. **Day 110**: CSM reaches out to champion about DAU decline. Root cause: 3 SDRs left the company; new hires not yet onboarded on LeadReach. CSM schedules training.
3. **Day 90**: CSM + AE renewal conversation. Present value results + address hiring situation. Propose: 30 seats (5 additional for new hires) + 8 Marketing seats = 38 seats total.
4. **Day 75**: Value Realization Report shared. ROI: 4.2x. Champion enthusiastic about expansion to Marketing.
5. **Day 65**: AE presents expansion proposal: 38 seats, Growth tier, $58,932/year (+52% ACV). Includes Marketing team onboarding.
6. **Day 55**: Customer requests 10% discount for the expansion. AE counters: 5% discount for 2-year commitment. Customer agrees.
7. **Day 40**: Contract sent. 38 seats, Growth tier, $55,985/year, 2-year term, 5% discount, 5% annual escalator.
8. **Day 30**: Contract signed. Renewal + expansion complete.

**Outcome**: GRR: 100%. NRR: 145%. Customer expanded from 25 to 38 seats, committed to 2 years, and added a new department.

## 14. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| Customer signals intent to churn | VP CS | Executive intervention; service recovery plan |
| Competitor offers aggressive deal | VP Sales | Competitive retention package; executive engagement |
| Champion departed; no replacement identified | VP CS | Identify new champion; executive outreach |
| Renewal negotiation stalled >30 days | VP Sales | Direct engagement; simplified proposal |
| Customer disputes ROI claims | VP CS + Finance | Detailed ROI audit; external benchmarking |
| Legal disputes contract terms | General Counsel | Legal review; negotiate resolution |
| Customer requests refund | VP CS + Finance | Evaluate; partial refund for goodwill if warranted |

## 15. Authoring Notes / Gaps

- Need **renewal proposal template** — standardized format with value metrics, expansion options, and pricing.
- Need **renewal forecasting model** — predict renewal outcomes based on health scores and historical data.
- Need **auto-renewal communication templates** — pre-renewal notice, renewal confirmation, post-renewal thank you.
- Need **expansion at renewal calculator** — model expansion scenarios with pricing impact.
- Need **customer health dashboard** — real-time view of all customer health scores with drill-down.
- Need **renewal playbook for multi-year contracts** — different motion for 2-3 year deals.

These will be addressed in future monthly gap reports.
