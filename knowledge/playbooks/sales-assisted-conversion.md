---
title: "Sales-Assisted Conversion — Playbook"
category: playbook
playbook: sales-assisted-conversion
tags: [conversion, sales-assist, hybrid, PLG-to-sales, demo, closing]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Sales-Assisted Conversion — Playbook

This playbook is the canonical reference for converting self-serve and PLG users who need human sales assistance to complete their purchase. It covers the PLG-to-sales handoff, demo optimization, ROI justification, stakeholder expansion, and deal closing for hybrid PLG/sales accounts. Used by Atlas (Orchestrator), Judge (PQL Scoring), Bard (Outreach), Forge (Enrichment), and Flow (Deal Tracking).

## 1. Why Sales-Assisted Conversion Matters

Not every customer can self-serve. Research from OpenView Partners (2025) shows that **56% of PLG-sourced revenue ultimately requires sales involvement** to close. The reasons vary:

- **Multi-stakeholder buying**: Self-serve works for individual decisions. When a team purchase requires VP/CFO approval, a salesperson bridges the gap.
- **Complex requirements**: Enterprise features (SSO, custom integrations, data residency) need consultative selling.
- **Budget justification**: Someone needs to build the ROI case that convinces Finance.
- **Competitive displacement**: When the prospect is comparing LeadReach to a competitor, a skilled AE creates differentiation.
- **Trust building**: Some buyers simply want to talk to a human before committing $50K+.

The sales-assisted conversion is the **bridge between PLG efficiency and enterprise deal size**. Done well, it combines the low CAC of PLG with the high ACV of sales-led. Done poorly, it creates friction that drives users back to self-serve — or to competitors.

## 2. The PLG-to-Sales Handoff Spectrum

### 2.1 When to Engage Sales

| Signal | Strength | Action |
|--------|----------|--------|
| User requests demo or "talk to sales" | Very High | Immediate AE outreach |
| User hits PQL Hot threshold (score 75+) | High | AE outreach within 1 hour |
| User invites 3+ team members | High | AE outreach within 4 hours |
| User is at company with 50+ employees | Medium | SDR outreach within 24 hours |
| User visits pricing page 3+ times | Medium | SDR outreach within 24 hours |
| User's trial is expiring and they're active | Medium | Conversion-focused outreach at Day 10 |
| User downloads enterprise-related content | Medium | SDR outreach within 24 hours |
| User is at company with <50 employees | Low | Automated nurture; no sales outreach unless PQL |

### 2.2 Handoff Rules

| Rule | Description |
|------|-------------|
| **Never cold-call a PLG user** | They signed up for self-serve; respect that. Start with an email or in-app message. |
| **Reference their activity** | Always mention what they've done in the product — it shows you're paying attention. |
| **Offer, don't push** | "I'm here if you want help" not "You need to talk to me." |
| **Preserve self-serve option** | Users can always upgrade without sales. Don't block the self-serve path. |
| **Track attribution** | If a PLG user talks to sales and then self-serves, credit the sale to the PLG motion (not sales). |

## 3. The Sales-Assisted Conversion Workflow

### Step 1: PQL Identification (Judge, Continuous)

Judge agent monitors all PLG users and scores them against the PQL model (see PLG Playbook). When a user crosses the Hot PQL threshold:
- Judge assigns a PQL score and tags the user
- Forge enriches the account with company data (size, industry, tech stack)
- Flow routes the PQL to the appropriate sales rep based on territory and account size

### Step 2: Pre-Call Research (Sage + Forge, 30 Minutes)

Before any outreach, Sage and Forge compile:
- **Product usage data**: sequences sent, reply rate, features used, login frequency
- **Company context**: industry, size, recent news, tech stack
- **Stakeholder map**: who else is at the company? Any other LeadReach users?
- **ICP fit**: Judge score; is this a qualified opportunity?
- **Competitive signals**: any competitor tools in their tech stack?

Output: **PQL Brief** for the AE/SDR — a one-page summary with all relevant context.

### Step 3: Initial Outreach (Bard, Within SLA)

Bard composes personalized outreach referencing the user's actual product activity:

**Critical rule**: Never send a generic "I'd love to chat" email. Every outreach must reference specific activity.

**Template — Hot PQL Outreach**:
**Subject**: `your leadreach results — [specific metric]`

> Hi [first name],
>
> Quick observation from your account: [specific insight, e.g., "Your 14% reply rate on outbound sequences is above the industry average. And with 3 team members now on the platform, you're seeing what coordinated outreach looks like."]
>
> Most teams at your stage unlock [specific feature/outcome] when they move to [tier]. Worth a 15-minute conversation about what that looks like for [company]?
>
> [AE/SDR name]

### Step 4: Discovery Call (AE, Days 1-5)

The discovery call for PLG users is different from cold-outbound discovery. Key adjustments:

1. **Acknowledge their experience**: "You've been using LeadReach for [X days/weeks]. What's working well?"
2. **Surface the gap**: "What would you change? What's missing?" (Listen for upgrade triggers)
3. **Map stakeholders**: "Who else is involved in the decision? Is your VP aware you're using this?"
4. **Understand the buying process**: "If you wanted to upgrade to [tier], what would the process look like at [company]?"
5. **Plant the seed**: "Teams like [peer] saw [specific improvement] when they moved from [current tier] to [target tier]."

### Step 5: Demo (AE, Days 5-10)

For PLG users, the demo should be **focused on the gap**, not the full product:

- **Don't demo what they already use** — they know it works
- **Demo what they're missing** — the features on the next tier that solve their stated pain
- **Use their data** — show their sequences, their reply rates, their team's activity
- **Show the delta** — "Here's what you see today. Here's what Growth tier shows you."

**Demo structure for PLG-to-sales**:

| Minutes | Content | Purpose |
|---------|---------|---------|
| 0-5 | Acknowledge their success; recap their activity | Build rapport; show you know their account |
| 5-15 | Demo the gap features they need | Show value of upgrade |
| 15-20 | Peer comparison / ROI projection | Quantify the business case |
| 20-25 | Pricing and packaging | Clear, transparent; no surprises |
| 25-30 | Q&A and next steps | Address objections; set close plan |

### Step 6: Stakeholder Expansion (Flow, Days 5-14)

If the PLG user is not the decision-maker, expand to stakeholders:

- **Their manager** (VP Sales, Director of Sales Ops): "Your team has been testing LeadReach — here are the results."
- **IT/Security** (if enterprise features needed): "Your team is interested in SSO/security features."
- **Finance** (if budget approval needed): Provide ROI model for budget justification.

**Bard drafts champion enablement email**:

> Hi [first name],
>
> Based on our conversation, it sounds like [VP/manager name] needs to approve this. I've prepared a one-page summary of:
> - Your team's results so far
> - What [target tier] unlocks
> - ROI projection based on your current performance
>
> Want me to send it to them directly, or would you prefer to share it?

### Step 7: Proposal and Close (AE + Atlas, Days 10-21)

- Proposal tailored to their current usage and growth trajectory
- Pricing: reference their current tier; show the delta cost and delta value
- Include their actual usage data as proof of value
- Offer trial extension if needed (up to 14 additional days)
- Payment: self-serve upgrade link OR formal proposal (depending on deal size)

### Step 8: Post-Close Onboarding Optimization (CSM, Days 21-60)

PLG-to-sales customers need different onboarding than cold-outbound customers:
- They already know the basics — skip onboarding for features they use
- Focus onboarding on **new tier features** they haven't accessed
- Set up a 30-day check-in to ensure they're using the upgraded features
- Track expansion signals for further upsell opportunities

## 4. Agent Responsibilities

| Agent | Sales-Assisted Role |
|-------|-------------------|
| Atlas | Orchestrates sales-assisted motion; manages handoff from PLG to sales |
| Scout | Identifies additional stakeholders at the account; monitors social signals |
| Forge | Enriches PQL with company data; provides usage analytics for demo prep |
| Sage | Researches company context; prepares competitive intelligence |
| Judge | Scores PQLs; determines sales readiness; validates ICP fit |
| Bard | Composes personalized outreach; drafts champion enablement materials; writes proposals |
| Flow | Routes PQLs to sales; tracks handoff SLAs; manages conversion pipeline |
| Echo | Monitors conversion rates; tracks PLG-to-sales funnel; measures handoff effectiveness |

## 5. Target Persona and ICP Criteria

### Ideal Sales-Assisted Conversion Target

| Criterion | Specification |
|-----------|--------------|
| Current motion | PLG user (free trial or freemium) |
| PQL score | 50+ (Warm or Hot) |
| Company size | 20+ employees |
| Industry | SaaS, FinTech, HealthTech, Professional Services |
| Multi-user signal | 2+ team members on platform |
| Feature gap | Needs features beyond current tier |
| Budget authority | May not have it (hence sales assist) |
| Buying process | Requires stakeholder approval |

### Sales-Assisted Personas

**The Proxy Buyer (45% of conversions)**:
- SDR Manager or RevOps IC who adopted LeadReach personally
- Loves the product but needs help selling it internally
- Strategy: Provide champion enablement toolkit; arm them with ROI data

**The Evaluator (30% of conversions)**:
- VP Sales or CRO who signed up for a trial to evaluate
- Wants to see the product before committing team resources
- Strategy: Fast-track demo; focus on team deployment and ROI

**The Expansion Buyer (15% of conversions)**:
- Existing customer who wants to upgrade or expand
- Knows the product but needs help justifying the additional spend
- Strategy: Build on existing results; quantify the upgrade value

**The Reluctant Self-Server (10% of conversions)**:
- Signed up for self-serve but realized they need help
- Overwhelmed by the product or stuck on setup
- Strategy: Guided onboarding; simplify the decision; reduce friction

## 6. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| User hits Hot PQL threshold | Judge agent | Alert to AE; compose personalized outreach |
| User requests "talk to sales" | In-app / website form | Immediate routing to AE; 1-hour SLA |
| User invites 3+ team members | Product analytics | Multi-user PQL boost; AE outreach |
| User at 50+ employee company | Forge enrichment | Route to SDR; company-size-based outreach |
| Trial user at Day 10 (still active) | Calendar trigger | Conversion-focused outreach sequence |
| User hits feature ceiling | Product analytics | Upgrade prompt + sales outreach |
| User compares LeadReach to competitor | Product analytics / support | Competitive outreach; demo offer |
| User downloads enterprise content | Content analytics | SDR outreach with enterprise messaging |

## 7. Email / Sequence Templates

### Template 1: Soft Sales Introduction (Warm PQL)

**Subject**: `getting more from leadreach at [company]`

> Hi [first name],
>
> I noticed you've been using LeadReach for [X weeks] — [specific insight, e.g., "12 sequences with a 10% reply rate"]. Solid start.
>
> A quick question: are you the only one on your team using it, or have others joined? Most teams see [2-3x results] when the whole squad is running coordinated sequences.
>
> I'm here if you ever want to chat about what that looks like — no pressure.
>
> [SDR name]

### Template 2: Direct Value Outreach (Hot PQL)

**Subject**: `your team's results + [feature they need]`

> Hi [first name],
>
> Your team's been crushing it — [X sequences, Y% reply rate, Z team members]. Quick thought: you're currently on [current tier], but [specific feature they've hit the ceiling on] is available on [target tier].
>
> Teams that upgrade to [target tier] typically see [specific improvement] because [reason].
>
> Worth a 15-minute walkthrough of what [target tier] would look like for your team?
>
> [AE name]

### Template 3: Champion Enablement — Internal Selling

**Subject**: `one-pager for [manager name]`

> Hi [first name],
>
> Based on our conversation, here's a one-page summary you can share with [manager name]:
>
> - **What we've achieved**: [Their specific results]
> - **What [target tier] unlocks**: [Feature list with value statements]
> - **ROI projection**: [Investment] → [Expected return] = [Xx ROI]
> - **Peer proof**: [Peer company] saw [result] after upgrading
>
> If [manager name] wants to chat directly, I'm happy to do a 15-minute overview. No hard sell — just the facts.
>
> [AE name]

## 8. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "I didn't sign up for a sales call" | PLG user surprised by outreach | "Completely fair — I'm not here to sell you. I noticed [specific activity] and thought I could help. If you'd rather self-serve, you can upgrade anytime at [link]." |
| "My manager won't approve this" | Champion can't sell internally | "Let me help. I can prepare a one-page business case with your actual results and ROI projection. Want me to send that over?" |
| "We don't have budget until next quarter" | Timing constraint | "No problem. We can structure the contract to align with your budget cycle — start using it now, pay later. This locks in current pricing." |
| "We're still evaluating other options" | Competitive consideration | "That's smart. What are you evaluating? I can share a comparison based on what your team actually needs — might save you some evaluation time." |
| "The self-serve price works; the upgrade is too much" | Price sensitivity | "Let me show you the math. At [current results], the upgrade to [target tier] pays for itself if your team books [X] additional meetings per month. Based on your current rate, that's [Y weeks]." |
| "I need to think about it" | Not enough urgency or value | "Of course. What would help you decide? I can share [peer case study / ROI calculator / extended trial]. Just let me know what you need." |
| "I'm not the decision-maker" | Wrong stakeholder engaged | "Who would be the right person? I can prepare a brief overview tailored to their priorities — and you can introduce me if you think it's worth it." |

## 9. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| PQL to sales-accepted lead | >50% | CRM |
| Sales-assisted conversion rate (Warm PQL) | 15-25% | CRM |
| Sales-assisted conversion rate (Hot PQL) | 30-45% | CRM |
| Average deal size (sales-assisted vs. self-serve) | 2-3x self-serve | CRM |
| Time from PQL to first outreach | <4 hours (Hot), <24 hours (Warm) | Flow agent |
| Time from first outreach to close | <21 days | CRM |
| Champion enablement rate | >70% of sales-assisted deals | CRM |
| Self-serve option preserved | 100% | Product analytics |
| Post-conversion feature adoption (new tier) | >70% within 30 days | Product analytics |

## 10. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| Sales outreach feels like cold email | AE sends generic message; doesn't reference PLG activity | Bard requires usage data to compose outreach; no generic templates for PQLs |
| AE dismisses PLG leads as "low quality" | Sales team biased toward outbound leads | Share PQL conversion data weekly; PLG leads close at 2-3x cold leads |
| Self-serve path blocked by sales | AE intercepts users who want to self-serve | Clear handoff rules: sales assists but never blocks self-serve |
| Over-selling on the demo | AE demos the full product instead of the gap | Demo guide: focus on gap features; use their data; show delta |
| No follow-up after initial outreach | AE sends one email and moves on | Flow agent enforces 3-touch minimum; escalation after 7 days |
| Wrong AE assigned (territory mismatch) | PQL routing based on geography, not account fit | Forge enriches PQL with company data; Flow routes by account size + territory |
| Forgetting the user's PLG context | AE treats the deal like a cold outbound opportunity | PQL Brief mandatory before first call; Atlas enforces |

## 11. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Product analytics (Amplitude / Mixpanel) | PQL detection, usage data for outreach | Critical |
| CRM (Salesforce/HubSpot) | PQL routing, deal tracking, conversion attribution | Critical |
| Communication (Gmail / Outlook) | Personalized outreach | Critical |
| Calendar (Chili Piper / Calendly) | Meeting scheduling | High |
| In-app messaging (Pendo / Appcues) | Sales assist prompts in-product | High |
| Billing (Stripe) | Self-serve upgrade path (preserved) | High |
| Document management | Champion enablement materials | Medium |
| Video (Vidyard / Loom) | Personalized demo snippets | Medium |

## 12. Example Scenario

**User**: Maya Patel, SDR Manager at CloudSync (120 employees, SaaS)

**PLG activity**:
- Signed up 10 days ago (free trial, Professional tier)
- Connected Gmail + Salesforce
- Sent 4 sequences, 11% reply rate, 6 meetings booked
- Invited 3 other SDRs to the trial
- Visited pricing page 3 times
- Downloaded "Outbound Benchmark Report"

**PQL Score**: 85 (Hot)

**Sales-assisted motion executed**:
1. **Day 10**: Judge flags Maya as Hot PQL. Forge enriches: CloudSync, 120 employees, SaaS, recently raised Series A, using Outreach for 2 years.
2. **Day 10 (30 min later)**: Bard composes personalized outreach referencing Maya's 11% reply rate and 3 team invites. SDR sends.
3. **Day 11**: Maya replies: "Yes, I'd love to chat. Our team is getting results but I need to convince my VP to switch from Outreach."
4. **Day 12**: Discovery call. Maya reveals: 10 SDRs, Outreach contract renewal in 60 days, VP Sales open to evaluation, needs ROI case.
5. **Day 13**: Bard drafts champion enablement one-pager with Maya's actual results + ROI projection for 10 seats on Growth tier.
6. **Day 15**: Demo with Maya + VP Sales. Focused on multi-channel sequences and advanced analytics (features they don't have in Outreach). VP Sales asks about migration from Outreach.
7. **Day 18**: Proposal: 10 seats, Growth tier, $154,800/year. Includes migration support and dedicated CSM for 90 days.
8. **Day 21**: VP Sales approves. Contract signed.

**Outcome**: $154.8K ACV deal from a PLG entry point. CAC: near-zero (self-serve sign-up). Sales-assisted motion closed a deal that self-serve couldn't (required VP approval, competitive displacement, migration support).

## 13. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| PQL handoff SLA missed (>4 hours for Hot) | SDR Manager | Immediate outreach; root cause analysis |
| AE dismisses PQL as unqualified | VP Sales | Review PQL scoring; share conversion data |
| User explicitly asks not to be contacted | VP Growth + Legal | Opt out of sales outreach; preserve self-serve path |
| PLG-to-sales attribution dispute | RevOps | Audit attribution; dual-credit if warranted |
| Conversion rate drops below 15% | VP Sales + VP Product | Review PQL scoring; sales process audit |
| Competitive deal from PLG user | VP Sales + Competitive Intel | Competitive displacement playbook activated |
| PLG user requests enterprise features | AE + Atlas | Route to enterprise motion; see Upsell to Enterprise playbook |

## 14. Authoring Notes / Gaps

- Need **PQL routing optimization** — ML-based routing that matches PQLs to the best AE based on conversion history.
- Need **demo personalization engine** — auto-generate demo script based on user's product activity.
- Need **champion enablement toolkit v2** — presentation deck, email templates, ROI calculator, all customizable with user's data.
- Need **PLG-to-sales attribution model** — multi-touch attribution that credits both PLG and sales appropriately.
- Need **A/B testing framework for sales outreach** — test subject lines, messaging, timing for PQL conversion.
- Need **post-conversion adoption playbook** — ensure PLG-to-sales customers adopt new tier features quickly.

These will be addressed in future monthly gap reports.
