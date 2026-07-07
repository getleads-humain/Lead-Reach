---
title: "Product-Led Growth (PLG) — Playbook"
category: playbook
playbook: product-led-growth
tags: [PLG, freemium, trial, self-serve, product-qualified-lead, activation]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Product-Led Growth (PLG) — Playbook

This playbook is the canonical reference for LeadReach's product-led growth motion. It covers free trial and freemium experience design, activation milestones, product-qualified lead (PQL) scoring, self-serve conversion, and the critical handoff from PLG to sales-assisted motions. Used by Echo (Activation Monitoring), Forge (Enrichment), Atlas (Orchestration), and Bard (Conversion Outreach).

## 1. Why Product-Led Growth Matters

PLG is not just a pricing strategy — it's a go-to-market philosophy where the product is the primary driver of acquisition, activation, and expansion. Companies like Slack, Figma, and Atlassian have proven that PLG can create category-defining growth with 2-3x lower CAC than sales-led motions.

For LeadReach specifically, PLG serves three strategic purposes:

1. **Lower CAC for SMB**: Small teams (5-15 SDRs) can self-serve without requiring AE involvement, making the economics work at lower ACVs.
2. **Pipeline generation for sales**: Free trial users who hit PQL thresholds become high-intent, pre-qualified pipeline for the sales team.
3. **Land-and-expand entry point**: A single SDR who starts a free trial can become the wedge for a full-team deployment.

The critical insight: **PLG and sales-led are not either/or — they're a spectrum.** The best PLG companies have a seamless bridge from self-serve to sales-assisted when the customer's needs exceed what self-serve can provide.

## 2. PLG Motion Architecture

### 2.1 Entry Points

| Entry Point | Experience | Conversion Path |
|-------------|-----------|-----------------|
| **Free Trial** (14 days, Professional features) | Full-feature access; no credit card required | Trial → paid conversion (self-serve or sales-assisted) |
| **Freemium** (Starter tier, 5 seats, limited sequences) | Forever free; core features only | Freemium → paid upgrade (self-serve or sales-assisted) |
| **Demo Request** (Sales-led entry) | AE-guided demo → trial → paid | Direct sales motion (see Sales-Assisted Conversion playbook) |
| **Partner Referral** (Partner-sourced trial) | Trial with partner context → paid | Partner + sales co-sell motion |

### 2.2 The Activation Funnel

```
Sign-up → Setup → First Action → Aha Moment → Habit → Upgrade
   100%    70%      50%          30%          15%       5-8%
```

**Key milestones**:

| Milestone | Definition | Typical Rate | Signal Strength |
|-----------|-----------|-------------|----------------|
| **Sign-up** | Account created | 100% | Low — intent signal only |
| **Setup** | Email connected + CRM integrated | 70% | Medium — commitment signal |
| **First Action** | First sequence created | 50% | Medium — engagement signal |
| **Aha Moment** | First reply received from sequence | 30% | High — value realization |
| **Habit** | 3+ sequences sent in 7 days | 15% | Very High — retention signal |
| **Upgrade** | Converts to paid plan | 5-8% | Conversion |

## 3. Activation Milestone Design

### 3.1 The "Setup" Milestone (Target: 70% of sign-ups)

**Required actions**:
1. Verify email address
2. Connect email account (Gmail / Outlook via OAuth)
3. Connect CRM (Salesforce / HubSpot — optional but recommended)
4. Import or add at least 10 contacts

**Friction points and mitigations**:

| Friction Point | Mitigation |
|---------------|-----------|
| Email connection fails | OAuth flow with clear error messages; fallback: IMAP manual setup |
| CRM connection seems complex | "Skip for now" option; re-prompt after first sequence sent |
| No contacts to import | Sample dataset provided; LinkedIn Chrome extension offer |
| User gets distracted | Email reminder at 2 hours; in-app tooltip at next login |

### 3.2 The "First Action" Milestone (Target: 50% of sign-ups)

**Required action**: Create and send first sequence (at least 3 steps, at least 10 prospects)

**Guided experience**:
- Template gallery with industry-specific starter sequences
- One-click personalization (auto-insert first name, company)
- Suggested send time based on prospect time zone
- "Send now" vs. "Schedule" option with recommendation

**In-app prompts**:
- Progress bar: "3 steps to your first sequence" (create, personalize, send)
- AI-suggested subject lines based on industry
- Quick-add prospects from imported contacts

### 3.3 The "Aha Moment" Milestone (Target: 30% of sign-ups)

**Definition**: User receives a reply from a prospect they contacted through LeadReach.

**This is the single most important moment in the PLG funnel.** A user who gets a reply within 48 hours of sending their first sequence converts at 4x the rate of users who don't.

**Acceleration tactics**:
- Auto-suggest high-intent prospects (warm leads in CRM)
- Optimize first sequence for replies (not opens): question-based subject line, short body, soft CTA
- Push notification when a reply is received: "🎉 [Prospect name] replied to your sequence!"
- Email notification with subject: "your sequence just got a reply"

### 3.4 The "Habit" Milestone (Target: 15% of sign-ups)

**Definition**: User sends 3+ sequences in 7 days OR logs in 5+ days in 7 days.

**Habit-building tactics**:
- Daily digest email: "Here's what happened in your LeadReach account yesterday"
- Weekly benchmark email: "Your reply rate: 12% | Industry average: 8%"
- Streak tracking: "3-day streak 🔥 Keep it going!"
- Notification when prospects open but don't reply: "3 prospects read your email — want to follow up?"

## 4. Product-Qualified Lead (PQL) Scoring

### 4.1 PQL Definition

A PQL is a free trial or freemium user who has demonstrated enough product engagement and value to warrant sales outreach. Not all active users are PQLs — some are happily self-serving and don't need (or want) sales involvement.

### 4.2 PQL Scoring Model (Judge Agent)

| Signal | Weight | PQL Contribution |
|--------|--------|-----------------|
| Aha Moment achieved (received reply) | 30 | Strongest signal — value realized |
| 3+ sequences sent in 7 days | 20 | Habit formed — likely to convert |
| 10+ contacts added | 15 | Investment in platform — switching cost |
| Multi-user invite | 15 | Team adoption — expansion signal |
| Visited pricing page 2+ times | 10 | Commercial intent |
| Attempted feature beyond plan limits | 10 | Upgrade motivation — hit ceiling |

**PQL Score interpretation**:
- **Hot PQL (75+)**: Sales outreach within 1 hour; these users are ready to buy
- **Warm PQL (50-74)**: Sales outreach within 24 hours; educational approach
- **Nurture (25-49)**: Automated email sequence; no human outreach yet
- **Inactive (0-24)**: Re-engagement sequence; focus on activation

### 4.3 PQL-to-Sales Handoff Protocol

| PQL Type | Handoff | AE Approach |
|----------|---------|-------------|
| **Self-serve converter** | No handoff; user upgrades via in-app | Monitor for expansion opportunity |
| **Hot PQL, SMB (<50 employees)** | SDR outreach; fast-track to demo | "Saw you're getting great results — want to unlock [feature]?" |
| **Hot PQL, Mid-Market (50-1000)** | AE outreach; consultative approach | "Your team's results are strong — let me show you what Growth tier unlocks" |
| **Hot PQL, Enterprise (1000+)** | AE + CSM outreach; enterprise motion | "Your org could benefit from [enterprise features] — worth a conversation?" |
| **Warm PQL, any size** | SDR outreach; value-add approach | "Here's how teams like yours are getting more from LeadReach..." |

## 5. The PLG Conversion Funnel Workflow

### Step 1: Sign-Up and Onboarding (Automated, Day 0)

- Account creation with email verification
- Guided setup wizard (email + CRM connection)
- Industry selection for template personalization
- Team size and role selection for appropriate experience path

### Step 2: Activation Monitoring (Echo, Days 0-14)

Echo agent monitors every new sign-up against activation milestones:
- **Day 0**: Setup milestone check
- **Day 1**: First action milestone check
- **Day 3**: Aha moment check
- **Day 7**: Habit milestone check
- **Day 14**: Trial expiration check (for free trial users)

At each checkpoint, Echo triggers appropriate actions:
- Milestone achieved → congratulatory email + next step prompt
- Milestone missed → re-engagement email with guidance

### Step 3: PQL Detection (Judge, Continuous)

Judge agent evaluates every active user against the PQL scoring model. When a user hits PQL threshold:
- Hot PQL: immediate alert to assigned AE/SDR
- Warm PQL: added to sales nurture queue
- Multi-user signal: flag for expansion motion

### Step 4: Conversion Outreach (Bard + AE/SDR, Within SLA)

For Hot PQLs, Bard composes personalized outreach referencing the user's activity:

**Template — Hot PQL Outreach**:
**Subject**: `your leadreach results — let's accelerate`

> Hi [first name],
>
> Quick observation from your account: you've sent [X] sequences and achieved [Y% reply rate] — that's [above/at] the industry average for [industry].
>
> Most teams at your stage unlock [2-3x results] with [Growth/Professional tier features — e.g., multi-channel sequences, advanced analytics]. Worth a 15-minute conversation about what that looks like?
>
> [AE/SDR name]

### Step 5: Trial-to-Paid Conversion (Days 7-14 for trial; ongoing for freemium)

**For free trial users approaching expiration**:
- **Day 10**: Email: "3 tips to maximize your last 4 days of trial"
- **Day 12**: Email: "Your trial results: [stats] + what you'd unlock with [tier]"
- **Day 13**: In-app: Upgrade prompt with trial stats
- **Day 14**: Trial expires; limited functionality; upgrade CTA
- **Day 15**: Email: "Your trial data is saved — upgrade to continue where you left off"
- **Day 21**: Email: "Still thinking about LeadReach? Here's what [peer] achieved in month 1"
- **Day 30**: Email: Breakup email

**For freemium users hitting limits**:
- In-app: "You've hit your sequence limit. Upgrade to Professional for unlimited sequences."
- Email: "You're leaving pipeline on the table — [X] more sequences you could send with Professional"

### Step 6: Post-Conversion Optimization (Echo, Days 30-90)

After conversion, Echo monitors:
- Feature adoption (are they using what they paid for?)
- Usage trends (increasing = healthy; flat/declining = churn risk)
- Expansion signals (adding users, hitting limits, requesting features)
- NPS survey at Day 30

## 6. Agent Responsibilities

| Agent | PLG Role |
|-------|---------|
| Atlas | Orchestrates PLG-to-sales handoff; manages conversion motion for PQLs |
| Scout | Monitors social signals for PLG users who advocate publicly |
| Forge | Enriches PQL data with company context; identifies ICP fit for sales routing |
| Sage | Researches PQL's company context; prepares AE briefing |
| Judge | Scores PQLs; determines sales readiness; validates ICP fit |
| Bard | Composes activation emails, PQL outreach, trial expiration sequences |
| Flow | Coordinates PQL handoff to sales; tracks conversion SLAs |
| Echo | Monitors activation milestones; tracks conversion funnel; measures PLG metrics |

## 7. Target Persona and ICP Criteria

### Ideal PLG User

| Criterion | Specification |
|-----------|--------------|
| Role | SDR, SDR Manager, RevOps IC |
| Company size | 5-500 employees |
| Industry | SaaS, technology, professional services |
| Tech comfort | High — can self-serve without hand-holding |
| Motivation | Wants to try before buying; prefers self-serve |
| Buying authority | May not have it — but can become champion |

### PLG vs. Sales-Led Segmentation

| Segment | Size | Entry | Sales Involvement | ACV Range |
|---------|------|-------|------------------|-----------|
| Self-serve SMB | <20 employees | PLG | None (unless PQL) | $3K-$12K |
| PLG-to-sales SMB | 20-50 employees | PLG → sales assist | SDR/AE after PQL | $12K-$30K |
| Sales-led mid-market | 50-1000 employees | Demo request | Full AE motion | $30K-$150K |
| Enterprise | 1000+ employees | Outbound / referral | Full enterprise motion | $150K+ |

## 8. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| New sign-up completes onboarding | Product analytics | Echo tracks against activation milestones |
| User achieves Aha Moment | Product analytics | Bard sends congratulatory email; PQL score update |
| User hits PQL threshold (Hot) | Judge agent | Alert to AE/SDR; compose personalized outreach |
| Free trial user at Day 10 | Calendar trigger | Bard sends trial conversion sequence |
| Freemium user hits feature limit | Product analytics | In-app upgrade prompt; email with feature comparison |
| User invites team members | Product analytics | Flag for expansion motion; multi-user PQL boost |
| User visits pricing page 2+ times | Product analytics | Commercial intent signal; PQL score update |
| User downloads ROI calculator | Product analytics | Warm PQL; add to sales nurture |
| Trial expires without conversion | Calendar trigger | Re-engagement sequence; 30-day extended trial offer |

## 9. Email / Sequence Templates

### Template 1: Activation — Aha Moment Celebration

**Subject**: `your sequence just got a reply 🎉`

> Hi [first name],
>
> [Prospect name] just replied to your sequence "[subject line]" — that's your first LeadReach reply!
>
> A few ways to build on this momentum:
> - **Follow up fast**: Reply within 2 hours for the best response rate
> - **Double down**: Send similar sequences to similar prospects
> - **Track your rate**: Your current reply rate is [X]% — industry average is [Y]%
>
> Want to see how to [2-3x your reply rate / add multi-channel touches / unlock analytics]? It's available on [tier].
>
> [Bard agent]

### Template 2: Trial Expiration — Results Summary

**Subject**: `your 14-day leadreach results`

> Hi [first name],
>
> Your LeadReach trial is wrapping up. Here's what you accomplished:
>
> | Metric | Your Results |
> |--------|-------------|
> | Sequences sent | [X] |
> | Reply rate | [X]% |
> | Meetings booked | [X] |
> | Best performing sequence | "[subject line]" |
>
> Teams that continue with LeadReach see [2-3x improvement] in month 2 as they refine their approach.
>
> Ready to keep going? [Upgrade now — starts at $49/seat/month]
>
> [Bard agent]

### Template 3: PQL Sales Outreach — Mid-Market

**Subject**: `scaling your team's outbound at [company]`

> Hi [first name],
>
> I noticed your team has been active on LeadReach — [X sequences sent, Y% reply rate]. Solid results.
>
> Quick question: are you the only one using LeadReach, or are other SDRs on the team interested too? Most teams at your stage see [2-3x the results] when the whole team is running coordinated sequences.
>
> Worth a 15-minute conversation about what a full-team deployment looks like?
>
> [AE name]

## 10. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "The free version is enough for me" | Low ambition or solo user | "Glad it's working! Quick question: what would happen if your whole team used it? Most solo users who invite teammates see [X] improvement." |
| "I can't justify the upgrade cost" | Value not quantified | "Let me show you the math. At [current reply rate], you're booking [X meetings/month]. With [Growth tier feature], teams see [Y] improvement. That's [Z] additional meetings at [$ per meeting]." |
| "I need to talk to my manager first" | Not the decision-maker | "Absolutely. Want me to prepare a one-page summary of your results and the upgrade ROI? It'll make the conversation easier." |
| "We're already using [competitor]" | Multi-tool environment | "Interesting — are you using LeadReach for [specific use case]? Many teams use both for different purposes. Or if you're evaluating, I can show a comparison." |
| "I didn't get enough results during the trial" | Insufficient trial effort | "That's fair. Most teams need 3-4 weeks to see real results — the first 2 weeks are setup and learning. Want an extended 30-day trial with a dedicated onboarding call?" |
| "I don't want to talk to sales" | PLG purist; wants self-serve | "No problem — you can upgrade directly in the app. I'm here if you ever want to chat about maximizing your results." |

## 11. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Sign-up to activation (Setup) | >70% | Product analytics |
| Sign-up to activation (First Action) | >50% | Product analytics |
| Sign-up to Aha Moment | >30% | Product analytics |
| Free trial to paid conversion | 5-8% | Billing |
| Freemium to paid conversion (annual) | 3-5% | Billing |
| PQL to sales-accepted lead | >50% | CRM |
| PQL to closed-won | >20% | CRM |
| Time from sign-up to Aha Moment | <72 hours | Product analytics |
| Self-serve conversion rate (no sales) | >60% of PLG conversions | Billing |
| PLG-sourced revenue as % of total | 15-25% | Finance |
| PLG CAC | <$500 | Finance / Product analytics |

## 12. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| Activation rate below 50% | Onboarding friction; no guided experience | A/B test onboarding flow; reduce steps; add tooltips |
| Aha Moment rate below 20% | First sequence quality poor; no guidance | Auto-optimize first sequence; provide high-converting templates |
| PQLs ignored by sales team | Sales doesn't trust PLG leads; low priority | PQL conversion data shared weekly; prove PQLs close at 2-3x cold leads |
| Self-serve users don't expand | No expansion motion for PLG customers | Echo monitors expansion signals; trigger upgrade prompts |
| Free trial too generous | Users get everything they need in 14 days | Limit trial features strategically; reserve key features for paid |
| Freemium too restrictive | Users can't experience value | Ensure core value is achievable in freemium; gate scale, not value |
| No re-engagement for churned trials | Users sign up, don't activate, disappear | Automated re-engagement sequence at Day 3, 7, 14, 30 |

## 13. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| Product analytics (Amplitude / Mixpanel) | Activation tracking, funnel analysis | Critical |
| CRM (Salesforce/HubSpot) | PQL routing, conversion tracking | Critical |
| Billing (Stripe) | Self-serve upgrade, trial management | Critical |
| Email (SendGrid / Customer.io) | Activation and conversion email sequences | Critical |
| In-app messaging (Pendo / Appcues) | In-app prompts, upgrade CTAs | High |
| Customer support (Intercom / Zendesk) | PLG user support | High |
| AB testing (LaunchDarkly / Optimizely) | Onboarding and conversion experiments | Medium |
| Data warehouse (Snowflake / BigQuery) | PLG analytics and reporting | Medium |

## 14. Example Scenario

**User**: Jordan Lee, SDR Manager at NovaTech (75 employees, SaaS)

**PLG journey**:
1. **Day 0**: Jordan signs up for a 14-day free trial after seeing a LinkedIn ad. Connects Gmail and Salesforce during onboarding. Imports 50 contacts.
2. **Day 1**: Jordan creates first sequence using the "SaaS Outbound — Funding Trigger" template. Sends to 25 prospects.
3. **Day 3**: Two prospects reply. Aha Moment achieved. Echo triggers congratulatory email. PQL score: 60 (Warm).
4. **Day 4**: Jordan creates a second sequence using a different template. Sends to 30 prospects.
5. **Day 5**: Jordan invites 2 other SDRs to the trial. Multi-user signal detected. PQL score: 78 (Hot).
6. **Day 5 (1 hour later)**: SDR receives PQL alert. Bard composes outreach: "Saw your team is getting results — 2 SDRs invited. Worth chatting about a full-team deployment?"
7. **Day 6**: Jordan replies. SDR schedules a 15-minute call.
8. **Day 7**: Discovery call. Jordan reveals: 8 SDRs on team, currently using manual outbound, frustrated with low reply rates, VP Sales is supportive of tooling.
9. **Day 10**: AE demo with Jordan + VP Sales. Professional tier demonstrated. VP Sales asks about analytics (Growth tier feature).
10. **Day 12**: Proposal sent: 10 seats, Growth tier, $15,480/year. Trial extended by 14 days to allow evaluation.
11. **Day 18**: VP Sales approves. Contract signed.
12. **Day 20**: Onboarding kicks off. 8 SDRs + 2 managers activated.

**Outcome**: $15.5K ACV deal sourced at near-zero CAC. PLG motion created a warm, pre-qualified opportunity. Sales cycle: 12 days from PQL detection to close.

## 15. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| Activation rate drops below 50% | VP Product | Onboarding audit; A/B test alternatives |
| PQL to sales-accepted rate <40% | VP Sales + VP Product | Sales enablement on PLG leads; improve PQL scoring |
| Trial conversion rate <3% | VP Product + VP Growth | Feature analysis; trial experience audit; pricing review |
| Self-serve upgrade broken (technical) | Engineering | P1 incident; fix within 4 hours |
| PLG user requests enterprise features | Atlas + AE | Route to sales-assisted enterprise motion |
| High-volume sign-ups from single domain | Security | Potential fraud; investigate and validate |
| PLG revenue below target | CRO + VP Product | Strategy review; motion adjustment |

## 16. Authoring Notes / Gaps

- Need **onboarding A/B test framework** — structured experimentation for activation optimization.
- Need **PQL scoring model v2** — incorporate machine learning from conversion data.
- Need **in-app upgrade path optimization** — reduce friction in self-serve purchase flow.
- Need **PLG expansion playbook** — structured motion for converting single-user PLG accounts to team deployments.
- Need **trial extension decision framework** — when to extend, when to let expire, when to offer paid pilot.
- Need **PLG competitive differentiation** — how LeadReach's PLG motion differs from competitors.

These will be addressed in future monthly gap reports.
