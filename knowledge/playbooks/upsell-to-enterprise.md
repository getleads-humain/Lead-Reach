---
title: "Upsell to Enterprise — Playbook"
category: playbook
playbook: upsell-to-enterprise
tags: [upsell, enterprise, expansion, account-growth, seat-expansion]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Upsell to Enterprise — Playbook

This playbook is the canonical reference for upgrading mid-market and professional-tier customers to LeadReach Enterprise. It covers expansion signal detection, business-case construction, stakeholder expansion, enterprise feature positioning, and negotiation tactics. Used primarily by Atlas (Orchestrator), Sage (Web Research), Bard (Outreach Composer), and Flow (Pipeline Coordination).

## 1. Why Enterprise Upsell Matters

The economics of SaaS are clear: **net revenue retention drives valuation**. Companies with 120%+ NRR trade at 2-3x the revenue multiples of those with 100% NRR. Enterprise upsell is the highest-leverage motion in the LeadReach GTM engine because:

- **CAC is 5-7x lower** than new-logo acquisition — the relationship, trust, and product adoption already exist.
- **Deal cycles are 40% shorter** — the customer has already validated the product; the question is scope, not fit.
- **Expansion revenue compounds** — a $50K account that expands to $150K in year two is more valuable than three new $50K logos (lower churn, higher lifetime value).
- **Enterprise tier increases switching costs** — deeper integrations, more users, custom workflows create moats that competitors cannot easily displace.

The key insight: **most upsell opportunities are invisible to the account team**. Customers don't self-select into enterprise. The signals are there — usage ceiling hits, feature requests, team growth — but they require systematic detection and a structured motion.

## 2. Enterprise Upsell Signals

Echo agent monitors the following signals to identify upsell-ready accounts:

### Usage Ceiling Signals (Strongest Predictors)

| Signal | Threshold | Upsell Implication |
|--------|-----------|-------------------|
| Seat utilization | >85% of licensed seats | Team is growing; need more seats + enterprise governance |
| API call volume | >80% of plan limit | Power users hitting ceilings; enterprise API tier needed |
| Sequence volume | >90% of monthly sends | Outbound scaling; enterprise sending infrastructure required |
| Storage / data volume | >75% of plan | Data retention needs; enterprise compliance features |
| Custom integration requests | 2+ in 90 days | Technical sophistication demands enterprise API access |

### Organizational Growth Signals

| Signal | Source | Upsell Implication |
|--------|--------|-------------------|
| Headcount growth >25% YoY | LinkedIn + Sage research | More users, more teams, more complexity |
| New office / geography opened | News / press releases | Multi-region compliance, data residency needs |
| New VP+ hire in sales/ops | LinkedIn | New decision-maker who may want enterprise-grade tools |
| Acquisition of another company | Press / SEC filings | Consolidation requires enterprise admin + SSO |
| Series B+ funding | Crunchbase / news | Budget for tooling upgrade; scaling pressure |

### Feature Request Signals

| Signal | Pattern | Upsell Implication |
|--------|---------|-------------------|
| SSO/SAML request | Support ticket or CSM note | Enterprise security requirement |
| Custom reporting request | Multiple tickets | Enterprise analytics module |
| Multi-team admin request | CSM conversation | Enterprise governance features |
| Data residency question | Support ticket | Enterprise compliance tier |
| Custom SLA request | Procurement conversation | Enterprise SLA guarantees |

### Behavioral Signals

| Signal | Pattern | Upsell Implication |
|--------|---------|-------------------|
| Power users in 3+ departments | Usage analytics | Cross-org adoption; enterprise governance needed |
| Executive stakeholder engagement | CSM notes | Budget authority for enterprise upgrade |
| Customer presents LeadReach externally | Social / events | Strong advocacy; leverage for enterprise case study |
| Customer references LeadReach to peers | Referral activity | High NPS; ready for deeper commitment |

## 3. Upsell Readiness Score

Each signal contributes to an UpsellReadinessScore (0-100):

| Signal | Weight |
|--------|--------|
| Seat utilization >85% | 20 |
| SSO/SAML request | 15 |
| Headcount growth >25% | 15 |
| Multiple department adoption | 15 |
| API volume >80% plan | 10 |
| Executive stakeholder engaged | 10 |
| Acquisition / merger | 10 |
| Custom reporting request | 5 |

Readiness tiers:
- **Ready (75+)**: Initiate upsell motion within 7 days
- **Nurture (50-74)**: Begin seeding enterprise value; motion within 30 days
- **Early (25-49)**: Plant enterprise seeds in every touchpoint; no formal motion yet
- **Not Ready (0-24)**: Focus on adoption and value realization first

## 4. Enterprise Upsell Workflow (Step-by-Step)

### Step 1: Signal Detection and Account Selection (Echo, Day 0)

Echo agent runs nightly, scanning all active accounts against the upsell signals. New upsell-ready accounts surface on the Expansion Pipeline dashboard with:
- Account name + current tier + current ACV
- UpsellReadinessScore + tier
- Top 3 contributing signals
- Estimated enterprise ACV range
- Recommended next action

### Step 2: Account Research and Context (Sage, Days 1-2)

For each Ready-tier account, Sage agent researches:
- **Organizational context**: recent funding, hiring plans, M&A activity, strategic initiatives
- **Stakeholder landscape**: current champions, executive sponsors, new hires in relevant roles
- **Competitive footprint**: any competitor tools in adjacent teams (potential displacement upsell)
- **Industry benchmarks**: what peer companies pay for enterprise tier

Output: **Upsell Context Memo** for the account team.

### Step 3: Business Case Construction (Atlas + Judge, Days 2-3)

Atlas agent, using Judge's ICP scoring, constructs the enterprise business case:
- **Current state**: what the customer gets today (features, limits, support)
- **Enterprise delta**: what enterprise unlocks (SSO, custom integrations, priority support, advanced analytics, dedicated CSM, custom SLAs)
- **ROI model**: quantified value of enterprise features against the price delta
- **Peer comparison**: 2-3 peer companies on enterprise tier and their results

### Step 4: Stakeholder Expansion (Flow, Days 3-7)

Enterprise upsell requires multi-threaded engagement. Flow agent identifies and coordinates outreach to:
- **Economic Buyer**: CFO, VP Finance, or CRO (approves budget)
- **Technical Buyer**: CTO, VP Engineering, IT Director (evaluates SSO, security, integrations)
- **Executive Sponsor**: CRO, VP Sales (benefits from advanced analytics, dedicated support)
- **Champion**: existing CSM contact or power user (internal advocate)

### Step 5: Discovery Meeting (Account Team, Day 7-14)

A structured discovery meeting focused on growth, not selling:
1. **Acknowledge success**: "Your team has been one of our fastest-growing accounts this year..."
2. **Surface pain**: "What's getting harder as you scale? Where are you hitting ceilings?"
3. **Map vision**: "If you had no constraints, what would your outbound stack look like in 12 months?"
4. **Seed enterprise**: "Teams at your stage typically start exploring [enterprise feature] because [reason]..."
5. **Ask for stakeholders**: "Who else is thinking about [security/scaling/governance]?"

### Step 6: Enterprise Demo + Business Case Presentation (Days 14-21)

Tailored demo showing enterprise-specific capabilities:
- **SSO/SAML integration** (for IT/Security stakeholder)
- **Advanced analytics and custom reporting** (for executive sponsor)
- **Dedicated CSM + priority support** (for operations lead)
- **Custom SLAs and data residency** (for compliance officer)
- **API access and integration framework** (for technical team)

Present the ROI model alongside the demo. **Never present enterprise pricing without the ROI context.**

### Step 7: Proposal and Negotiation (Days 21-35)

Atlas and Bard coordinate on proposal:
- **Anchor high**: lead with full enterprise package, not a stripped-down version
- **Value-stack**: show each feature's individual value before showing the bundle price
- **Annual commitment**: enterprise tier requires annual; offer 2-year for discount
- **Payment terms**: net 30 standard; offer quarterly for budget-constrained accounts
- **Transition plan**: clear timeline from current tier to enterprise with no service disruption

### Step 8: Legal and Security Review (Days 35-50)

Enterprise deals require security review:
- Pre-populated security questionnaire (maintained by Forge agent)
- SOC 2 Type II report ready for immediate sharing
- DPA template pre-configured for customer's region
- Custom SLA draft prepared based on customer's requirements

### Step 9: Close and Onboarding (Days 50-60)

- Signed contract + enterprise onboarding kickoff within 5 business days
- Dedicated CSM assigned
- Enterprise feature enablement plan (30-60-90 day roadmap)
- Executive sponsor introduction

## 5. Agent Responsibilities

| Agent | Upsell Role |
|-------|-------------|
| Atlas | Orchestrates upsell motion; constructs business case; manages timeline |
| Scout | Identifies organizational growth signals; monitors LinkedIn for new hires |
| Forge | Enriches account with usage data, support history, integration inventory |
| Sage | Researches customer's business context; prepares peer benchmarks |
| Judge | Scores upsell readiness; validates enterprise ICP fit |
| Bard | Composes upsell outreach, business case narratives, proposal language |
| Flow | Coordinates multi-threaded stakeholder engagement; tracks SLAs |
| Echo | Monitors upsell signals; generates expansion pipeline dashboard; measures outcomes |

## 6. Target Persona and ICP Criteria

### Ideal Upsell Profile

| Criterion | Threshold |
|-----------|-----------|
| Current tier | Professional or Growth |
| Current ACV | $25K-$100K |
| Account age | >6 months on platform |
| Seat utilization | >80% |
| Number of active teams | 2+ |
| NPS score | 7+ |
| Support health | No unresolved P1/P2 tickets |
| Payment history | No payment delays in last 12 months |

### Target Persona: The Scaling Sales Leader

- **Title**: VP Sales, CRO, Head of Revenue Operations
- **Pain**: Managing a rapidly growing outbound team across multiple geographies
- **Goal**: Standardize processes, gain visibility, ensure compliance
- **Buying trigger**: Team growth >25% YoY, new market entry, compliance mandate

### Secondary Persona: The IT/Security Gatekeeper

- **Title**: CTO, VP Engineering, Director of IT Security
- **Pain**: Shadow IT, unmanaged SaaS sprawl, compliance risk
- **Goal**: SSO, audit logs, data residency, vendor consolidation
- **Buying trigger**: SOC 2 audit, security incident, new compliance mandate

## 7. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| Seat utilization hits 85% | Usage analytics (Echo) | Flag account; create upsell task |
| SSO/SAML request submitted | Support ticket (Forge) | Notify CSM + AE; schedule discovery |
| Customer hires 10+ new reps | LinkedIn (Scout) | Update UpsellReadinessScore; notify Flow |
| Customer raises funding round | News / Crunchbase (Sage) | Schedule executive outreach (Bard) |
| Customer acquires another company | Press release (Sage) | Activate consolidation upsell motion |
| Customer requests custom SLA | Procurement conversation | Escalate to enterprise motion |
| Customer references LeadReach in public | Social monitoring (Scout) | Leverage advocacy for upsell outreach |
| API volume exceeds 80% of plan | Usage analytics (Echo) | Alert CSM; prepare enterprise API tier proposal |

## 8. Email / Sequence Templates

### Template 1: Soft Upsell Introduction (CSM → Champion)

**Subject**: `your team's growth this quarter`

> Hi [first name],
>
> Quick observation from your Q2 dashboard: your team sent 12,000 sequences last month — that's 3x what you were running in Q1. Growth like that usually means a few things get harder: governance across teams, visibility for leadership, and compliance in new regions.
>
> Teams at your scale typically upgrade to Enterprise for SSO, advanced analytics, and a dedicated CSM. Worth a 30-minute conversation about what that would look like for [company]?
>
> Best,
> [CSM name]

### Template 2: Executive-to-Executive Outreach (CRO → Customer CRO)

**Subject**: `scaling outbound at [company]`

> Hi [first name],
>
> I'm [CRO name] at LeadReach. Your team has been one of our strongest success stories this year — [specific metric, e.g., "42% meeting rate on outbound sequences"].
>
> As you scale, I'd love to share what we've learned from customers like [peer company 1] and [peer company 2] who made the jump to Enterprise. The biggest difference isn't features — it's having a dedicated team ensuring your outbound infrastructure scales without friction.
>
> Worth a 15-minute call next week?
>
> [CRO name]

### Template 3: IT/Security Stakeholder Introduction (AE → IT Director)

**Subject**: `SSO and security at [company]`

> Hi [first name],
>
> [Champion name] mentioned you're evaluating SSO and security requirements for [company]'s outbound tools. I'd like to walk you through LeadReach's Enterprise security posture — SAML 2.0 SSO, SCIM provisioning, audit logs, SOC 2 Type II, and data residency options.
>
> Most IT teams we work with have 3-4 questions about [common concern, e.g., data encryption, access controls]. Worth 15 minutes to cover those?
>
> [AE name]

## 9. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "We can't justify the price increase" | Value not quantified | "Let me walk you through the ROI model. Teams at your scale typically see [X] in productivity gains from [enterprise feature] alone." |
| "We don't need SSO right now" | IT not involved yet | "Understood. Two things to consider: (1) SSO implementation takes 2-4 weeks, so starting now means you're ready when the mandate comes. (2) Most customers who delay end up paying rush implementation fees later." |
| "We're evaluating other tools" | Competitive threat | "That's fair. Before you expand your evaluation, worth a 15-minute look at what Enterprise unlocks — most teams find they already have 80% of what they need in LeadReach." |
| "Our budget cycle doesn't start until Q3" | Timing mismatch | "No problem. We can structure the contract to align with your budget cycle — sign now, bill later. This locks in current pricing and reserves your dedicated CSM." |
| "We need to see more ROI first" | Value not proven | "Agreed. Let's schedule an Executive Business Review to quantify your current ROI. That gives us both the data to make an informed decision." |
| "The current tier is working fine" | Complacency / no pain surfaced | "That's great to hear. Most teams at your stage say the same thing — until they hit a ceiling. What would happen if your team grew another 30% next quarter?" |
| "Procurement will block this" | Process fear | "We work with procurement teams weekly. I can share our pre-completed security questionnaire and standard DPA to accelerate the process." |

## 10. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Upsell pipeline generated (monthly) | $500K+ | CRM |
| Upsell close rate | 35-45% | CRM |
| Average upsell deal size | 2-3x current ACV | CRM |
| Upsell cycle time | 30-60 days | CRM |
| Time from signal detection to first outreach | <7 days | Flow agent |
| Enterprise tier adoption rate (of eligible accounts) | >25% within 12 months | CRM |
| Upsell revenue as % of total revenue | >20% | Finance |
| Post-upsell NPS | >8 | Surveys |

## 11. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| Upsell too early, before value is proven | Signal-based trigger fired but adoption is shallow | Verify adoption depth before initiating motion: active users >60% seats, core feature usage >50% |
| Pitching features instead of outcomes | AE lists enterprise features without connecting to pain | Always lead with the customer's growth challenge; features are the solution, not the story |
| Single-threaded upsell (only champion engaged) | AE doesn't expand stakeholder map | Flow agent mandates 3+ stakeholders engaged before proposal stage |
| No ROI model | AE skips quantification | Atlas agent auto-generates ROI model from usage data |
| Over-discounting to close | AE leads with price cut instead of value | Standard discount matrix: max 15% for annual, 20% for 2-year; anything above requires VP approval |
| Ignoring IT/Security | No technical stakeholder engaged | IT outreach is mandatory in the upsell sequence at Day 5 |
| Losing momentum during security review | Security questionnaire takes too long | Forge agent maintains pre-populated security docs; target 3-day turnaround |

## 12. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| CRM (Salesforce/HubSpot) | Opportunity tracking, pipeline reporting | Critical |
| Usage analytics platform | Seat utilization, feature adoption metrics | Critical |
| Billing system (Stripe/Zuora) | ACV tracking, expansion revenue reporting | Critical |
| Security questionnaire platform (Iterative/Secureframe) | Automated security review responses | High |
| E-signature (DocuSign) | Contract execution | High |
| Communication (Slack/Teams) | Internal coordination, deal room channels | Medium |
| BI tool (Looker/Tableau) | Expansion pipeline dashboard | Medium |

## 13. Example Scenario

**Account**: Meridian SaaS, a Series B marketing technology company

**Current state**: Professional tier, 45 seats, $48K ACV, on platform for 9 months

**Signals detected (Echo agent, Day 0)**:
- Seat utilization at 92% (41/45 seats active)
- 3 SSO/SAML requests in last 60 days (support tickets)
- Headcount growth: 18 new SDRs hired in Q2 (Scout detected via LinkedIn)
- API volume at 78% of plan limit

**UpsellReadinessScore**: 82 (Ready tier)

**Motion executed**:
1. **Day 1**: Sage researches Meridian — Series B raised $35M in March, hiring 30 more reps by EOY, CRO joined 4 months ago from a company that used LeadReach Enterprise.
2. **Day 2**: Atlas constructs business case — Enterprise tier ($144K ACV) unlocks SSO, custom reporting, dedicated CSM, priority support. ROI model shows 3.2x return based on 30 additional reps at 20% higher productivity.
3. **Day 3**: Flow identifies stakeholders — CRO (economic buyer), IT Director (technical buyer), VP Sales Ops (user buyer), existing CSM contact (champion).
4. **Day 5**: Bard sends CSM → Champion outreach. Champion responds positively, schedules discovery.
5. **Day 8**: Discovery meeting reveals pain — new SDRs take 3 weeks to ramp on outbound; no standardized sequences; IT is mandating SSO by end of quarter.
6. **Day 12**: Enterprise demo tailored to each stakeholder. CRO sees the analytics; IT Director sees SSO/SAML; Sales Ops sees the template governance.
7. **Day 18**: Business case presentation with ROI model. CRO asks for proposal.
8. **Day 20**: Proposal sent — Enterprise tier, 75 seats, $144K ACV, annual commitment.
9. **Day 25**: IT requests security questionnaire. Forge provides pre-populated response same day.
10. **Day 32**: Contract signed. Enterprise onboarding kicks off.

**Outcome**: 3x ACV expansion, 32-day cycle, customer achieves SSO compliance before their internal deadline.

## 14. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| Customer pushes back on price >20% discount | VP Sales | Review business case; consider alternative packaging |
| Security review stalled >14 days | CISO / Security Team | Direct outreach from LeadReach security team |
| Champion leaves during upsell motion | CSM + AE | Pause motion; identify new champion within 7 days |
| Competitor enters during upsell | VP Sales + Competitive Intelligence | Competitive displacement playbook activated |
| Procurement blocks contract terms | Legal | Custom contract review; standard MSA modification |
| Customer requests feature not on roadmap | Product | Feature request escalation; evaluate for custom development |
| Upsell motion stalls >60 days | VP CS | Executive intervention; schedule QBR with customer exec sponsor |

## 15. Authoring Notes / Gaps

- Need **enterprise ROI model template** with industry-specific assumptions (SaaS, FinTech, HealthTech).
- Need **competitive battlecard for enterprise tier** — comparison vs. Outreach Enterprise, Salesloft Enterprise, Reply.io.
- Need **SSO implementation guide** — step-by-step for IT teams evaluating SAML 2.0 setup.
- Need **enterprise onboarding playbook** — 30-60-90 day plan for new enterprise customers.
- Need **multi-year contract template** — 2-year and 3-year enterprise agreements with escalator clauses.
- Need **executive sponsor program** — structured cadence for CRO-to-CRO engagement on enterprise accounts.

These will be addressed in future monthly gap reports.
