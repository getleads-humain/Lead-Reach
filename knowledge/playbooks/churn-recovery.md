---
title: "Churn Recovery — Playbook"
category: playbook
playbook: churn-recovery
tags: [churn, retention, win-back, customer-success, at-risk]
last_reviewed: "2026-07-08"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Churn Recovery — Playbook

This playbook is the canonical reference for identifying at-risk customers and executing structured win-back motions. It is primarily used by Echo (Report Generator) for risk identification, Atlas (Orchestrator) for win-back orchestration, Sage (Web Research) for context gathering, and Bard (Outreach Composer) for re-engagement messaging.

## 1. Why Churn Recovery Matters

Acquiring a new customer costs **5-7x more than retaining an existing one** (Bain, SaaS benchmark 2024). Yet most GTM teams spend 90% of effort on top-of-funnel and treat churn as a Customer Success afterthought. The math is unforgiving: a SaaS company with 10% monthly logo churn loses **72% of its customer base annually** — meaning the new-logo team has to nearly 2x its output just to maintain flat revenue.

LeadReach's philosophy on churn recovery is **predictive, not reactive**. Echo agent monitors leading indicators (usage decline, support ticket spikes, sentiment shifts) and surfaces at-risk accounts **30-60 days before the renewal date**, giving the CS team a real window to intervene. Reactive win-backs (after cancellation) convert at 5-8%; proactive win-backs (pre-renewal) convert at 35-50%.

### 1.1 The Churn Math

Understanding the financial impact of churn is essential for prioritizing retention investment:

| Monthly Logo Churn | Annual Logo Retention | Customers Lost per 1,000 | Revenue Impact (at $50K avg ACV) |
|---------------------|----------------------|--------------------------|----------------------------------|
| 1% | 88.6% | 114 | $5.7M lost ARR |
| 2% | 78.5% | 215 | $10.8M lost ARR |
| 3% | 69.4% | 306 | $15.3M lost ARR |
| 5% | 54.0% | 460 | $23.0M lost ARR |
| 10% | 28.3% | 717 | $35.9M lost ARR |

Even reducing churn from 3% to 2% monthly saves $5.1M ARR per 1,000 customers. That's the equivalent of acquiring 102 new customers at $50K ACV — which at a 20% close rate means 510 more qualified opportunities needed.

### 1.2 The Churn Funnel

Churn follows its own funnel, mirroring the sales funnel in reverse:

| Churn Stage | Definition | Intervention Window | Conversion Potential |
|------------|-----------|---------------------|---------------------|
| **Healthy** | On track; strong adoption; positive NPS | Ongoing nurture | N/A (maintain) |
| **Declining** | Early signals of disengagement | 60-90 days pre-renewal | 80%+ save rate |
| **At-risk** | Multiple negative signals aligned | 30-60 days pre-renewal | 50-70% save rate |
| **Critical** | Explicit churn signals (champion departed, usage crash) | 0-30 days pre-renewal | 30-40% save rate |
| **Churned** | Contract cancelled or not renewed | Post-cancellation | 5-8% win-back rate |

The key insight: **earlier intervention dramatically increases save rates**. The Echo agent's mission is to surface signals at the "Declining" stage, not the "Critical" stage.

## 2. The Churn Risk Taxonomy

Churn risk falls into four categories, each requiring a different motion:

### Category A: Product-Fit Churn (40% of churn)
The product doesn't fit the customer's actual workflow. Usually a sales-process failure (sold to wrong ICP) or product-gap (missing critical feature). Recovery is unlikely — focus on win-back after they switch to a competitor.

**Diagnostic indicators:**
- Core feature usage <20% of available features
- Regular feature requests for capabilities outside product roadmap
- "Workarounds" mentioned in support tickets
- Low NPS with "missing features" as primary complaint
- Customer was sold outside ICP (Judge agent should flag retroactively)

**Recovery approach:** Unlikely to save — focus on learning. Conduct a thorough exit interview. Feed product gap data to product team. Add to win-back sequence for when relevant features ship.

### Category B: Adoption Churn (25% of churn)
The product fits, but the customer never fully adopted it. Usually an onboarding failure or champion departure. Recovery is **high-likelihood** with structured re-onboarding.

**Diagnostic indicators:**
- Active users <50% of licensed seats
- Core workflow not being used (e.g., sequences created but not sent)
- Last admin login >14 days ago
- Onboarding milestones incomplete
- Champion changed roles or left company
- Training completion <30% of licensed users

**Recovery approach:** Structured re-onboarding with dedicated CSM. 30-day plan with weekly check-ins. Success metric: active users >70% of seats by day 30.

### Category C: Value-Realization Churn (20% of churn)
The customer adopted, but never quantified the ROI. Renewal gets cut in budget reviews because "we can't justify the spend." Recovery is **very high-likelihood** with ROI documentation + executive review.

**Diagnostic indicators:**
- Customer cannot articulate ROI when asked
- No executive business review conducted in last 12 months
- NPS is 7-8 (satisfied but not enthusiastic)
- Usage is steady but not growing
- No expansion conversations initiated
- Budget scrutiny mentioned in renewal conversations

**Recovery approach:** Executive Business Review (EBR) with quantified ROI. Pre-meeting brief by Sage (industry benchmarks, peer comparisons). Post-meeting: ROI one-pager by Bard. Success metric: customer can articulate 3x+ ROI.

### Category D: Relationship Churn (15% of churn)
The customer is unhappy with the relationship — poor support, account management changes, or trust-breaking incidents. Recovery requires **executive intervention and trust rebuilding**.

**Diagnostic indicators:**
- NPS <5
- Support escalation history with unresolved issues
- CSM or AE turnover on the account (multiple rep changes)
- Trust-breaking incidents (data breach, missed commitments, miscommunication)
- Customer explicitly expressed dissatisfaction
- Social media complaints or negative reviews

**Recovery approach:** Executive apology + commitment plan. CRO-led intervention. 30-60-90 day check-in cadence. Success metric: NPS improvement + trust indicators positive.

### Category Decision Tree

```
At-risk account identified. Which category?
├── Does the product fit their actual workflow?
│   ├── No → Category A (Product-Fit Churn)
│   │   └── Was the account sold outside ICP?
│   │       ├── Yes → Flag for sales process review + add to ICP exclusion check
│   │       └── No → Product gap → feed to product team roadmap
│   └── Yes → Is adoption >50% of seats?
│       ├── No → Category B (Adoption Churn)
│       │   └── Did champion depart?
│       │       ├── Yes → Identify new champion; re-onboard
│       │       └── No → Original onboarding insufficient; re-onboard
│       └── Yes → Can customer articulate ROI?
│           ├── No → Category C (Value-Realization Churn)
│           │   └── Schedule EBR with ROI quantification
│           └── Yes → Is there a relationship/trust issue?
│               ├── Yes → Category D (Relationship Churn)
│               │   └── Executive intervention + commitment plan
│               └── No → Monitor closely; may be early-stage decline
```

## 3. Leading Indicators (Echo Agent Monitoring)

Echo agent monitors the following signals to identify at-risk accounts **30-60 days pre-renewal**:

### Usage Signals (Strongest Predictors)
- **DAU/MAU decline** >30% month-over-month
- **Active users** dropped below 50% of licensed seats
- **Core feature usage** (e.g. reports generated, sequences sent) declined >40%
- **Login frequency** dropped from daily → weekly → monthly pattern
- **Last admin login** >14 days ago
- **Session duration** declined >50% MoM
- **Feature adoption plateau** — no new features explored in 60+ days
- **Mobile usage** dropped to zero (if previously active)
- **API call volume** declined >30% MoM (for technical integrations)

### Support Signals
- **Ticket spike** (3+ tickets in 30 days vs. baseline of 1/month)
- **Escalation rate** increased (P1/P2 tickets up 50%+)
- **CSAT decline** in post-resolution surveys
- **Specific complaint themes** (performance, reliability, missing features)
- **Repeated tickets** on same issue (indicates unresolved problem)
- **Feature request velocity** increasing (looking for alternatives)
- **Support channel shift** — moving from chat (low urgency) to phone (high urgency)

### Engagement Signals
- **Webinar / event attendance** dropped to zero
- **Newsletter opens** dropped to zero
- **Community / forum participation** ceased
- **LinkedIn engagement** with brand content ceased
- **NPS score** dropped from 9-10 to 0-6
- **Customer advisory board** participation declined
- **Product feedback submissions** stopped
- **Release notes engagement** — no opens on last 3 release emails
- **Referral activity** — stopped referring peers

### Business Signals
- **Champion changed roles** (LinkedIn signal — left company or moved internally)
- **Customer acquired / merged** — procurement consolidation likely
- **Customer funding** reduced (layoffs, down round) — budget pressure
- **Peer company** (same industry) just churned — pattern risk
- **Executive sponsor** departed
- **Company downsizing** — headcount dropped >20% (LinkedIn signal)
- **Office closure** — physical footprint shrinking
- **Strategic pivot** — company announced new direction incompatible with your use case
- **Competitor evaluation** — detected via intent data or direct mention

### Contract Signals
- **Renewal date** within 60 days with no renewal motion
- **Auto-renewal disabled** in contract
- **Payment delay** (5+ days late on most recent invoice)
- **Downgrade request** in last 90 days
- **Multi-year → annual conversion** request
- **Invoice disputes** increasing
- **Procurement outreach** — customer's procurement team contacting your finance
- **Legal review** — customer's legal reviewing the MSA (often pre-churn)

### Signal Weighting by Predictive Power

Echo agent has trained a predictive model on historical churn data. The relative predictive power of each signal:

| Signal Category | Weight in Model | AUC Contribution |
|----------------|----------------|-----------------|
| Usage signals | 40% | 0.35 |
| Business signals | 25% | 0.22 |
| Support signals | 15% | 0.15 |
| Contract signals | 10% | 0.12 |
| Engagement signals | 10% | 0.08 |
| **Combined model** | **100%** | **0.82 AUC** |

## 4. Risk Scoring Model

Each signal contributes to a ChurnRiskScore (0-100):

| Signal | Weight |
|--------|--------|
| DAU decline >30% MoM | 25 |
| Active users <50% seats | 20 |
| Champion departure | 20 |
| Ticket spike 3+ in 30d | 15 |
| NPS score 0-6 | 15 |
| Last admin login >14d | 10 |
| Renewal in 60d, no motion | 10 |
| Payment delay >5d | 10 |
| Webinar attendance ceased | 5 |
| Peer company churned | 5 |
| Competitor evaluation detected | 10 |
| Auto-renewal disabled | 8 |
| Invoice dispute in last 90d | 5 |
| Session duration decline >50% | 8 |
| Feature adoption plateau | 5 |
| Support escalation rate >50% | 8 |
| CSM/AE turnover on account | 7 |
| Negative social/review mention | 5 |

Risk tiers:
- **Critical (75+)**: Exec intervention now; weekly status meetings
- **High (50-74)**: CS intervention; structured win-back in 7 days
- **Medium (30-49)**: CSM outreach; nurture sequence
- **Low (0-29)**: Standard renewal motion

### 4.1 Risk Score Calculation

```
ChurnRiskScore = Σ(signal_weight × signal_present)
                ─────────────────────────────────── × 100
                       max_possible_weight

Where:
- signal_present = 1 if signal detected, 0 if not
- signal_weight = from table above
- max_possible_weight = 163 (sum of all weights)
- Score normalized to 0-100
```

### 4.2 Dynamic Risk Thresholds

Risk thresholds should be calibrated to your company's specific churn rate and customer base:

| Company Churn Rate | Critical | High | Medium | Low |
|-------------------|----------|------|--------|-----|
| <5% annual | 80+ | 60-79 | 35-59 | 0-34 |
| 5-10% annual | 75+ | 50-74 | 30-49 | 0-29 |
| 10-20% annual | 65+ | 40-64 | 25-39 | 0-24 |
| >20% annual | 55+ | 30-54 | 20-29 | 0-19 |

Higher-churn companies should use more aggressive thresholds to catch at-risk accounts earlier.

## 5. The 6-Stage Churn Recovery Pipeline

### Stage 1: Risk Identification (Echo, Continuous)

Echo agent runs nightly, scanning all active customers against the leading indicators. New at-risk accounts are added to the Churn Risk dashboard with:
- Account name + owner
- ChurnRiskScore + tier
- Top 3 contributing signals
- Renewal date
- Recommended motion (per Category A/B/C/D)
- Historical context (previous risk events, past interventions)

#### Echo Nightly Scan Workflow

```
1. Pull active customer list from CRM
2. For each customer:
   a. Query usage data (DAU, MAU, feature usage)
   b. Check support tickets (count, severity, CSAT)
   c. Check engagement data (event attendance, content opens)
   d. Check business signals (LinkedIn for champion changes, news for M&A)
   e. Check contract signals (renewal date, payment status)
3. Compute ChurnRiskScore
4. Compare to previous day's score — flag delta >10 points
5. Classify into risk tier
6. Generate recommended motion per category
7. Output: Churn Risk Dashboard update
```

### Stage 2: Diagnosis (Sage, 1-2 days)

For each Critical/High account, Sage agent researches:
- Recent news (funding, layoffs, M&A, leadership changes)
- LinkedIn signals (champion still there? new exec sponsor?)
- Competitor mentions (vendor switch signals)
- Industry context (regulatory shifts, market pressure)
- Internal context (CSM notes, support ticket themes, NPS comments)
- Product fit assessment (was this customer ever an ICP match? Judge agent input)

Output: **Churn Diagnosis Memo** for the account team.

#### Churn Diagnosis Memo Template

```
CHURN DIAGNOSIS MEMO — [Company]
==================================
Account Owner: [CSM name]
Renewal Date: [Date]
Risk Score: [X] / 100 — [Tier]
Category: [A/B/C/D]

CONTRIBUTING SIGNALS:
1. [Signal 1 — weight, detail]
2. [Signal 2 — weight, detail]
3. [Signal 3 — weight, detail]

EXTERNAL CONTEXT (Sage):
- Recent news: [summary]
- Leadership changes: [details]
- Competitor signals: [details]
- Industry context: [details]

INTERNAL CONTEXT:
- CSM notes: [summary]
- Support themes: [details]
- NPS history: [trend]
- Product usage trend: [details]

ROOT CAUSE ANALYSIS:
- Primary: [Category A/B/C/D] — [explanation]
- Contributing: [secondary factors]

RECOMMENDED INTERVENTION:
- Strategy: [from Category table]
- Owner: [CSM / AE / Exec]
- Timeline: [days until intervention begins]
- Expected save probability: [X%]

RISK IF NO INTERVENTION:
- Churn probability: [X%]
- Revenue at risk: $[X] ARR
```

### Stage 3: Intervention Strategy (Atlas, 1 day)

Atlas agent picks an intervention strategy based on Category:

| Category | Strategy | Owner | Timeline | Success Metric |
|----------|----------|-------|----------|----------------|
| A (Product-fit) | Win-back after switch; add to suppression list for 6mo | CSM + AE | 6mo cooldown | Product ships relevant feature |
| B (Adoption) | Structured re-onboarding (30-day plan); CSM-led | CSM | Immediate | Active users >70% seats by day 30 |
| C (Value) | Executive Business Review (EBR) with ROI quantification | CSM + Exec Sponsor | 1-2 weeks | Customer articulates 3x+ ROI |
| D (Relationship) | Executive apology + commitment plan; CRO-led | CRO + CSM | Immediate | NPS improves +15 points |

#### Intervention Strategy Decision Matrix

| Factor | Category A | Category B | Category C | Category D |
|--------|-----------|-----------|-----------|-----------|
| Save probability | 10-20% | 60-80% | 70-85% | 40-60% |
| Intervention cost | Low (wait) | Medium (re-onboarding) | Medium (EBR prep) | High (exec time) |
| Revenue at risk threshold | >$100K only | Any | >$30K | >$50K |
| Escalation path | Product → Eng roadmap | CSM → CS Manager | CSM → VP CS → Exec | CSM → CRO → CEO |
| Intervention duration | 6-12 months (win-back) | 30 days | 2 weeks | 90 days |

### Stage 4: Outreach Composition (Bard, 1 day)

Bard agent composes outreach appropriate to the situation:

**Adoption churn (Category B) — Re-onboarding email:**
> "Hi [name] — pulling together your account stats for Q2. Quick observation: your team has 50 licenses but only 18 active users in the last 30 days. Usually that means the original onboarding didn't fully land. Worth a 30-min re-onboarding session with [CSM name] to get the lapsed users up to speed? We've done this with [peer company] and saw adoption double in 6 weeks."

**Value churn (Category C) — EBR invitation:**
> "Hi [name] — your renewal is coming up on [date]. Before that conversation, we'd like to walk you through a Q2 ROI analysis: [quantified outcomes] vs. [annual cost]. Most teams use this to brief their CFO ahead of renewal. 30 minutes next Tuesday or Wednesday work?"

**Relationship churn (Category D) — Executive outreach:**
> "Hi [name] — I'm [CRO name], and I want to personally apologize for [specific incident]. That's not the standard we hold ourselves to. I've reviewed your account with [CSM name] and we're implementing [specific commitments]. Worth 30 minutes to walk you through what we're changing? I'd host it personally."

**Category B — New champion recruitment email (when original champion left):**
> "Hi [name] — I understand you've recently taken over [function/team] at [company]. I wanted to reach out because your team uses LeadReach for [use case], and I'd love to schedule a quick orientation to make sure you have everything you need. 30 minutes this week?"

**Category C — Peer benchmark email:**
> "Hi [name] — we just completed our annual customer benchmark report, and I thought you'd find it valuable. Your team is [above/below] average on [metric]. Teams in [their vertical] typically see [X result]. Worth 30 minutes to walk through where you stand vs. peers?"

#### Bard Churn Outreach Configuration

```yaml
bard_churn_config:
  category_a_win_back:
    tone: "gentle_check_in"
    max_words: 100
    cta: "soft_reconnect"
    frequency: "quarterly"
  
  category_b_adoption:
    tone: "helpful_proactive"
    max_words: 120
    cta: "30_min_reonboarding"
    frequency: "weekly_during_30day_plan"
  
  category_c_value:
    tone: "business_peer"
    max_words: 150
    cta: "ebr_invitation"
    frequency: "once_then_follow_up_1_week"
  
  category_d_relationship:
    tone: "humble_accountable"
    max_words: 120
    cta: "executive_conversation"
    frequency: "immediate_then_30_60_90_day_cadence"
```

### Stage 5: Intervention Execution (Flow, 1-30 days)

Flow agent coordinates execution across CSM, AE, exec sponsor, and Bard agent (for follow-ups):

- **Re-onboarding (Category B)**: 30-day plan with weekly check-ins, training sessions, and adoption KPIs. Success metric: active users >70% of seats by day 30.
- **Executive Business Review (Category C)**: 60-min EBR with exec sponsor + customer's economic buyer. Pre-meeting brief by Sage (industry context, peer benchmarks). Post-meeting: ROI one-pager by Bard.
- **Executive intervention (Category D)**: CRO-led apology + commitment. 30-60-90 day check-in cadence. Success metric: NPS improvement + renewal signed.

#### Re-Onboarding Plan Template (Category B)

```
30-DAY RE-ONBOARDING PLAN — [Company]
======================================
CSM: [Name] | Start Date: [Date] | Target: Active users >70% seats

WEEK 1: REDISCOVERY
- Day 1: Kick-off call — understand why adoption dropped
- Day 2: Identify power users vs. lapsed users
- Day 3: Configure dashboards for each user type
- Day 4: Send personalized re-engagement emails (Bard)
- Day 5: Check-in — any early wins?

WEEK 2: ACTIVATION
- Day 8: Group training session for lapsed users
- Day 9: Set up automated usage reminders
- Day 10: 1-on-1 coaching with key users
- Day 11: Create team-specific workflows
- Day 12: Check-in — adoption trending up?

WEEK 3: HABIT BUILDING
- Day 15: Share team usage leaderboard
- Day 16: Highlight "quick wins" from power users
- Day 17: Advanced feature training for engaged users
- Day 18: Set up integration with daily workflow tools
- Day 19: Check-in — are lapsed users returning?

WEEK 4: REINFORCEMENT
- Day 22: ROI snapshot — "here's what your team accomplished"
- Day 23: Ask champion to share wins with broader team
- Day 24: Document new workflows for future reference
- Day 25: Plan for ongoing success cadence
- Day 26-30: Final check-ins + measurement

SUCCESS CRITERIA:
- Active users: [Current] → [Target: >70% seats]
- Core feature usage: [Current] → [Target: >3x/week per user]
- Login frequency: [Current] → [Target: daily for power users]
- Champion re-engaged: Yes/No
```

#### Executive Business Review Agenda (Category C)

```
EXECUTIVE BUSINESS REVIEW — [Company]
======================================
Duration: 60 minutes | Attendees: [EB + CSM + Exec Sponsor]

1. Partnership Review (10 min)
   - Relationship timeline
   - Key milestones achieved together
   - Current sentiment and satisfaction

2. Value Delivered (20 min)
   - ROI analysis: [quantified outcomes]
   - Benchmark vs. peers: [comparison data]
   - Feature adoption: [usage highlights]
   - Team productivity: [before/after metrics]

3. Strategic Alignment (15 min)
   - Customer's upcoming priorities
   - How LeadReach supports those priorities
   - Roadmap preview: features relevant to their needs

4. Expansion Discussion (10 min)
   - Additional use cases
   - Additional users/departments
   - Integration opportunities

5. Renewal Planning (5 min)
   - Timeline
   - Terms discussion
   - Next steps
```

### Stage 6: Outcome Measurement (Echo, 30-90 days)

Echo agent tracks outcomes:
- **Renewal signed** (yes/no, value, term length)
- **Expansion/contraction** (vs. previous term)
- **NPS change** (pre- vs. post-intervention)
- **Adoption change** (active users pre- vs. post-)
- **CSAT change** (post-support surveys)

Outcomes feed back into the risk model — improving future predictions.

#### Outcome Measurement Dashboard

| Metric | Pre-Intervention | Post-Intervention | Delta | Target |
|--------|-----------------|-------------------|-------|--------|
| ChurnRiskScore | [X] | [X] | [Δ] | <30 |
| Active users (% seats) | [X%] | [X%] | [Δ%] | >70% |
| Core feature usage | [X/week] | [X/week] | [Δ] | >3/week |
| NPS | [X] | [X] | [Δ] | >8 |
| Renewal status | At-risk | [Signed/Churned] | — | Signed |
| Contract value | $[X] | $[X] | [Δ%] | Flat or expansion |

## 6. The Re-Engagement Sequence (Bard Agent)

For customers who have already churned (Category A win-back), Bard agent runs a 90-day re-engagement sequence:

| Day | Channel | Content | Goal |
|-----|---------|---------|------|
| 0 | Email | Soft check-in — "how are things going with [new vendor]?" | Re-establish contact |
| 14 | Email | New feature announcement (only if relevant to their pain) | Show product evolution |
| 30 | Email | Case study from peer company in same industry | Peer proof |
| 45 | LinkedIn | CSM connection request with personal note | Multi-channel touch |
| 60 | Email | Industry benchmark report (gated; re-capture email) | Value exchange |
| 75 | Email | Invitation to roundtable / dinner / webinar | In-person/human connection |
| 90 | Email | "Worth catching up?" — final soft touch | Close the loop |

Conversion benchmark: 5-8% of Category A churners re-engage via this sequence.

### 6.1 Win-Back Email Templates

**Day 0 — Soft check-in:**
> "Hi [name] — it's been a while since we worked together. Hope things are going well with [new vendor / current approach]. Quick question: how's the [use case] working out? No agenda — just curious."

**Day 14 — Feature announcement:**
> "Hi [name] — we just shipped [feature that addresses their original pain point]. When you were a customer, this was on your wish list. Not trying to win you back (well, maybe a little) — just wanted you to know it exists."

**Day 30 — Peer case study:**
> "Hi [name] — [peer company in same vertical] just published their results with LeadReach: [quantified outcomes]. Thought you'd find it interesting since you're in a similar space. Want me to send the full case study?"

**Day 60 — Benchmark report:**
> "Hi [name] — we just published our annual [vertical] benchmark report. [Their company's vertical] teams saw [headline stat]. I can send you the full report if you're interested — no strings attached."

**Day 90 — Final touch:**
> "Hi [name] — this is my last note for a while. If [original pain point] is ever back on the priority list, I'm easy to find. Wishing you and the team all the best."

### 6.2 Win-Back Trigger Events

Certain events make win-back outreach more likely to succeed:

| Trigger | Window | Why It Works | Priority |
|---------|--------|-------------|----------|
| Competitor outage/scandal | 14 days | Dissatisfaction window | High |
| New feature launch (yours) | 30 days | Addresses their gap | High |
| Their champion returns | 30 days | Re-engages advocate | High |
| Industry regulation change | 60 days | New compliance need | Medium |
| Their budget cycle opens | 30 days | Fresh budget available | Medium |
| Peer company adopts you | 30 days | Social proof / FOMO | Medium |

## 7. Account-Based Churn Prevention (Proactive)

Beyond reactive recovery, Echo agent flags **early warning signs** for accounts not yet at-risk:

- **Onboarding milestone slippage** — customer is 30+ days behind onboarding plan
- **Champion engagement decline** — weekly calls dropped to monthly
- **Power user departure** — most active user left the company
- **First support ticket** — first ticket in 90+ days (suggests adoption decline)
- **NPS drop from 9-10 to 7-8** — small drop, often precedes bigger drop

These signals trigger **proactive CSM outreach** (not full win-back motion) — a 15-min check-in call to diagnose.

### 7.1 Onboarding Health Score

Echo tracks an onboarding health score for new customers in their first 90 days:

| Milestone | Target Day | Weight | Status If Missed |
|-----------|-----------|--------|-----------------|
| Welcome call completed | Day 3 | 10% | At-risk flag |
| Admin user trained | Day 7 | 15% | CSM outreach |
| First 5 users activated | Day 14 | 20% | Re-onboarding trigger |
| First workflow configured | Day 14 | 15% | CSM intervention |
- Integration connected | Day 21 | 15% | Technical support trigger |
| First report generated | Day 30 | 10% | Training session |
| Team-wide rollout | Day 45 | 10% | Expansion planning |
| First ROI checkpoint | Day 60 | 5% | Value discussion |

Onboarding Health Score <70% at Day 30 → automatic CSM escalation.

### 7.2 The "Health Check" Cadence

Proactive health checks prevent churn by catching issues early:

| Customer Segment | Health Check Frequency | Format | Owner |
|-----------------|----------------------|--------|-------|
| Enterprise (>$100K ACV) | Monthly | 30-min call + EBR quarterly | Named CSM |
| Mid-market ($30-100K ACV) | Quarterly | 15-min call + email check-in | Pooled CSM |
| SMB (<$30K ACV) | Semi-annually | Automated email survey | Automated |
| Strategic/Named | Bi-weekly | In-person or video call | Senior CSM |
| New customer (<90 days) | Weekly | 15-min call during onboarding, then monthly | Onboarding CSM |

## 8. Measurement & KPIs

| Metric | Target | Source | Frequency |
|--------|--------|--------|-----------|
| Gross revenue retention (GRR) | 90%+ | CRM / billing | Monthly |
| Net revenue retention (NRR) | 110%+ | CRM / billing | Monthly |
| Logo churn (annual) | <10% | CRM | Monthly |
| At-risk accounts identified pre-renewal | 70%+ | Echo agent | Weekly |
| Win-back conversion (proactive, pre-renewal) | 35-50% | CRM | Monthly |
| Win-back conversion (reactive, post-churn) | 5-8% | CRM | Monthly |
| Average days to renewal decision (at-risk) | <30 days | CRM | Monthly |
| NPS recovery (post-intervention) | +15 points | NPS surveys | Quarterly |
| Onboarding health score (Day 30) | >70% | Echo agent | Per cohort |
| CSM-to-account ratio | 1:30 (mid-market), 1:10 (enterprise) | HR + CRM | Quarterly |

### 8.1 Churn Recovery ROI Calculator

```
Churn Recovery Investment vs. Return:

INVESTMENT:
- CSM time: [hours] × $75/hr = $[X]
- Executive time: [hours] × $200/hr = $[X]
- Re-onboarding resources: $[X]
- Total intervention cost: $[X]

POTENTIAL RETURN:
- ARR at risk: $[X]
- Save probability: [X%]
- Expected saved ARR: $[X] × [X%] = $[X]
- Expansion potential (if saved): $[X]
- Total expected return: $[X]

ROI: ([Return] - [Investment]) / [Investment] × 100 = [X]%
```

## 9. Common Failures & Mitigations

| Failure | Cause | Mitigation | Detection |
|---------|-------|-----------|-----------|
| At-risk account missed | Echo agent signal coverage gap | Monthly signal inventory review | Churn without prior risk flag |
| Win-back motion too late | CS team waited for renewal date | 60-day pre-renewal SLA | Risk flag raised <30 days pre-renewal |
| Wrong intervention strategy | Misdiagnosed churn category | Sage agent diagnosis review | Save rate below target for category |
| Outreach tone-deaf | Bard didn't account for relationship context | CSM reviews every win-back email before send | Negative reply or NPS drop post-outreach |
| No outcome tracking | Renewal signed → file closed | 90-day post-renewal check-in by Echo | No post-renewal health data |
| Over-escalation | Every account flagged as Critical | Calibrate risk thresholds quarterly | >50% of accounts flagged as at-risk |
| CSM burnout | Too many at-risk accounts per CSM | Cap CSM intervention load at 5 concurrent | CSM satisfaction survey |
| Product gap not reported | Category A churn → no product feedback | Mandatory exit interview + product team sync | No exit interview conducted |

## 10. Integration with the 8-Agent Pipeline

| Agent | Churn Recovery Role | Key Artifacts |
|-------|--------------------|---------------|
| Atlas | Orchestrates intervention strategy per account | Intervention plan, escalation routing |
| Scout | Identifies customer's champion departure signals | LinkedIn monitoring alerts |
| Forge | Enriches account with current usage + support history | Usage dashboard, support history |
| Sage | Researches customer's business context for diagnosis | Churn Diagnosis Memo |
| Judge | Re-scores account fit (was it ever a fit?) | Retroactive ICP score |
| Bard | Composes win-back outreach across categories | Re-engagement emails, EBR invitations |
| Flow | Coordinates execution + SLA tracking | Intervention timeline, SLA monitors |
| Echo | Monitors signals, generates risk dashboard, measures outcomes | Risk dashboard, outcome reports |

Churn recovery is the most cross-agent motion in LeadReach — every agent has a role. The playbook above ensures each agent knows its part.

### 10.1 Agent Handoff Flow

```
Echo (nightly scan) → Risk flagged
    ↓
Atlas (assessment) → Category assigned
    ↓
Sage (diagnosis) → Churn Diagnosis Memo
    ↓
Atlas (intervention strategy) → Strategy selected
    ↓
Bard (outreach composition) → Email/sequence drafted
    ↓
CSM (review + approve) → Human checkpoint
    ↓
Flow (execution tracking) → SLA monitored
    ↓
Echo (outcome measurement) → Results tracked
    ↓
Risk model (feedback loop) → Model improved
```

## 11. Escalation Framework

When standard intervention fails or the account is too valuable to lose:

### Tier 1: CSM-Led (Standard)
- Trigger: Risk score 30-74
- Authority: CSM can offer re-onboarding, training, minor concessions
- Budget: Up to $5K in services credits
- Timeline: 30-day intervention window

### Tier 2: CS Manager-Led (Elevated)
- Trigger: Risk score 75+ OR Tier 1 failed after 14 days
- Authority: CS Manager can offer contract modifications, executive intros
- Budget: Up to $15K in concessions/credits
- Timeline: 14-day intervention window

### Tier 3: VP CS + CRO-Led (Executive)
- Trigger: ARR at risk >$100K OR Tier 2 failed after 7 days
- Authority: CRO can offer pricing adjustments, custom SLAs, product commitments
- Budget: Up to $50K in concessions + product roadmap commitments
- Timeline: 7-day intervention window

### Tier 4: CEO-Led (Strategic)
- Trigger: ARR at risk >$500K OR strategic account at risk
- Authority: CEO-to-CEO conversation
- Budget: Unlimited (within reason)
- Timeline: Immediate

## 12. Churn Recovery Metrics Dashboard

```
┌──────────────────────────────────────────────────────────┐
│ CHURN RECOVERY DASHBOARD                                 │
├────────────────────┬─────────────┬───────────────────────┤
│ GRR                │ 92%         │ Target: 90%+ ✅       │
│ NRR                │ 112%        │ Target: 110%+ ✅      │
│ Logo Churn (YTD)   │ 7.2%        │ Target: <10% ✅      │
├────────────────────┼─────────────┼───────────────────────┤
│ At-Risk Accounts   │             │                       │
│ Critical (75+)     │ 3 accounts  │ $450K ARR at risk     │
│ High (50-74)       │ 12 accounts │ $780K ARR at risk     │
│ Medium (30-49)     │ 28 accounts │ $1.1M ARR at risk     │
├────────────────────┼─────────────┼───────────────────────┤
│ Intervention Stats  │             │                       │
│ Save rate (proactive)│ 42%       │ Target: 35-50% ✅    │
│ Save rate (reactive) │ 6%        │ Target: 5-8% ✅      │
│ Avg days pre-renewal │ 38 days   │ Target: >30 days ✅  │
│ Onboarding health    │ 78%       │ Target: >70% ✅      │
├────────────────────┼─────────────┼───────────────────────┤
│ By Category        │ Saves/Total│ Save Rate             │
│ A (Product-fit)    │ 1/8        │ 12.5%                 │
│ B (Adoption)       │ 7/9        │ 77.8%                 │
│ C (Value)          │ 6/8        │ 75.0%                 │
│ D (Relationship)   │ 3/6        │ 50.0%                 │
└────────────────────┴─────────────┴───────────────────────┘
```
