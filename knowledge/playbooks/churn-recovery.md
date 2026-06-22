---
title: "Churn Recovery — Playbook"
category: playbook
playbook: churn-recovery
tags: [churn, retention, win-back, customer-success, at-risk]
last_reviewed: "2026-06-22"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Churn Recovery — Playbook

This playbook is the canonical reference for identifying at-risk customers and executing structured win-back motions. It is primarily used by Echo (Report Generator) for risk identification, Atlas (Orchestrator) for win-back orchestration, Sage (Web Research) for context gathering, and Bard (Outreach Composer) for re-engagement messaging.

## 1. Why Churn Recovery Matters

Acquiring a new customer costs **5-7x more than retaining an existing one** (Bain, SaaS benchmark 2024). Yet most GTM teams spend 90% of effort on top-of-funnel and treat churn as a Customer Success afterthought. The math is unforgiving: a SaaS company with 10% monthly logo churn loses **72% of its customer base annually** — meaning the new-logo team has to nearly 2x its output just to maintain flat revenue.

LeadReach's philosophy on churn recovery is **predictive, not reactive**. Echo agent monitors leading indicators (usage decline, support ticket spikes, sentiment shifts) and surfaces at-risk accounts **30-60 days before the renewal date**, giving the CS team a real window to intervene. Reactive win-backs (after cancellation) convert at 5-8%; proactive win-backs (pre-renewal) convert at 35-50%.

## 2. The Churn Risk Taxonomy

Churn risk falls into four categories, each requiring a different motion:

### Category A: Product-Fit Churn (40% of churn)
The product doesn't fit the customer's actual workflow. Usually a sales-process failure (sold to wrong ICP) or product-gap (missing critical feature). Recovery is unlikely — focus on win-back after they switch to a competitor.

### Category B: Adoption Churn (25% of churn)
The product fits, but the customer never fully adopted it. Usually an onboarding failure or champion departure. Recovery is **high-likelihood** with structured re-onboarding.

### Category C: Value-Realization Churn (20% of churn)
The customer adopted, but never quantified the ROI. Renewal gets cut in budget reviews because "we can't justify the spend." Recovery is **very high-likelihood** with ROI documentation + executive review.

### Category D: Relationship Churn (15% of churn)
The customer is unhappy with the relationship — poor support, account management changes, or trust-breaking incidents. Recovery requires **executive intervention and trust rebuilding**.

## 3. Leading Indicators (Echo Agent Monitoring)

Echo agent monitors the following signals to identify at-risk accounts **30-60 days pre-renewal**:

### Usage Signals (Strongest Predictors)
- **DAU/MAU decline** >30% month-over-month
- **Active users** dropped below 50% of licensed seats
- **Core feature usage** (e.g. reports generated, sequences sent) declined >40%
- **Login frequency** dropped from daily → weekly → monthly pattern
- **Last admin login** >14 days ago

### Support Signals
- **Ticket spike** (3+ tickets in 30 days vs. baseline of 1/month)
- **Escalation rate** increased (P1/P2 tickets up 50%+)
- **CSAT decline** in post-resolution surveys
- **Specific complaint themes** (performance, reliability, missing features)

### Engagement Signals
- **Webinar / event attendance** dropped to zero
- **Newsletter opens** dropped to zero
- **Community / forum participation** ceased
- **LinkedIn engagement** with brand content ceased
- **NPS score** dropped from 9-10 to 0-6

### Business Signals
- **Champion changed roles** (LinkedIn signal — left company or moved internally)
- **Customer acquired / merged** — procurement consolidation likely
- **Customer funding** reduced (layoffs, down round) — budget pressure
- **Peer company** (same industry) just churned — pattern risk
- **Executive sponsor** departed

### Contract Signals
- **Renewal date** within 60 days with no renewal motion
- **Auto-renewal disabled** in contract
- **Payment delay** (5+ days late on most recent invoice)
- **Downgrade request** in last 90 days

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

Risk tiers:
- **Critical (75+)**: Exec intervention now; weekly status meetings
- **High (50-74)**: CS intervention; structured win-back in 7 days
- **Medium (30-49)**: CSM outreach; nurture sequence
- **Low (0-29)**: Standard renewal motion

## 5. The 6-Stage Churn Recovery Pipeline

### Stage 1: Risk Identification (Echo, Continuous)

Echo agent runs nightly, scanning all active customers against the leading indicators. New at-risk accounts are added to the Churn Risk dashboard with:
- Account name + owner
- ChurnRiskScore + tier
- Top 3 contributing signals
- Renewal date
- Recommended motion (per Category A/B/C/D)

### Stage 2: Diagnosis (Sage, 1-2 days)

For each Critical/High account, Sage agent researches:
- Recent news (funding, layoffs, M&A, leadership changes)
- LinkedIn signals (champion still there? new exec sponsor?)
- Competitor mentions (vendor switch signals)
- Industry context (regulatory shifts, market pressure)
- Internal context (CSM notes, support ticket themes, NPS comments)

Output: **Churn Diagnosis Memo** for the account team.

### Stage 3: Intervention Strategy (Atlas, 1 day)

Atlas agent picks an intervention strategy based on Category:

| Category | Strategy | Owner |
|----------|----------|-------|
| A (Product-fit) | Win-back after switch; add to suppression list for 6mo | CSM + AE |
| B (Adoption) | Structured re-onboarding (30-day plan); CSM-led | CSM |
| C (Value) | Executive Business Review (EBR) with ROI quantification | CSM + Exec Sponsor |
| D (Relationship) | Executive apology + commitment plan; CRO-led | CRO + CSM |

### Stage 4: Outreach Composition (Bard, 1 day)

Bard agent composes outreach appropriate to the situation:

**Adoption churn (Category B) — Re-onboarding email:**
> "Hi [name] — pulling together your account stats for Q2. Quick observation: your team has 50 licenses but only 18 active users in the last 30 days. Usually that means the original onboarding didn't fully land. Worth a 30-min re-onboarding session with [CSM name] to get the lapsed users up to speed? We've done this with [peer company] and saw adoption double in 6 weeks."

**Value churn (Category C) — EBR invitation:**
> "Hi [name] — your renewal is coming up on [date]. Before that conversation, we'd like to walk you through a Q2 ROI analysis: [quantified outcomes] vs. [annual cost]. Most teams use this to brief their CFO ahead of renewal. 30 minutes next Tuesday or Wednesday work?"

**Relationship churn (Category D) — Executive outreach:**
> "Hi [name] — I'm [CRO name], and I want to personally apologize for [specific incident]. That's not the standard we hold ourselves to. I've reviewed your account with [CSM name] and we're implementing [specific commitments]. Worth 30 minutes to walk you through what we're changing? I'd host it personally."

### Stage 5: Intervention Execution (Flow, 1-30 days)

Flow agent coordinates execution across CSM, AE, exec sponsor, and Bard agent (for follow-ups):

- **Re-onboarding (Category B)**: 30-day plan with weekly check-ins, training sessions, and adoption KPIs. Success metric: active users >70% of seats by day 30.
- **Executive Business Review (Category C)**: 60-min EBR with exec sponsor + customer's economic buyer. Pre-meeting brief by Sage (industry context, peer benchmarks). Post-meeting: ROI one-pager by Bard.
- **Executive intervention (Category D)**: CRO-led apology + commitment. 30-60-90 day check-in cadence. Success metric: NPS improvement + renewal signed.

### Stage 6: Outcome Measurement (Echo, 30-90 days)

Echo agent tracks outcomes:
- **Renewal signed** (yes/no, value, term length)
- **Expansion/contraction** (vs. previous term)
- **NPS change** (pre- vs. post-intervention)
- **Adoption change** (active users pre- vs. post-)
- **CSAT change** (post-support surveys)

Outcomes feed back into the risk model — improving future predictions.

## 6. The Re-Engagement Sequence (Bard Agent)

For customers who have already churned (Category A win-back), Bard agent runs a 90-day re-engagement sequence:

| Day | Channel | Content |
|-----|---------|---------|
| 0 | Email | Soft check-in — "how are things going with [new vendor]?" |
| 14 | Email | New feature announcement (only if relevant to their pain) |
| 30 | Email | Case study from peer company in same industry |
| 45 | LinkedIn | CSM connection request with personal note |
| 60 | Email | Industry benchmark report (gated; re-capture email) |
| 75 | Email | Invitation to roundtable / dinner / webinar |
| 90 | Email | "Worth catching up?" — final soft touch |

Conversion benchmark: 5-8% of Category A churners re-engage via this sequence.

## 7. Account-Based Churn Prevention (Proactive)

Beyond reactive recovery, Echo agent flags **early warning signs** for accounts not yet at-risk:

- **Onboarding milestone slippage** — customer is 30+ days behind onboarding plan
- **Champion engagement decline** — weekly calls dropped to monthly
- **Power user departure** — most active user left the company
- **First support ticket** — first ticket in 90+ days (suggests adoption decline)
- **NPS drop from 9-10 to 7-8** — small drop, often precedes bigger drop

These signals trigger **proactive CSM outreach** (not full win-back motion) — a 15-min check-in call to diagnose.

## 8. Measurement & KPIs

| Metric | Target | Source |
|--------|--------|--------|
| Gross revenue retention (GRR) | 90%+ | CRM / billing |
| Net revenue retention (NRR) | 110%+ | CRM / billing |
| Logo churn (annual) | <10% | CRM |
| At-risk accounts identified pre-renewal | 70%+ | Echo agent |
| Win-back conversion (proactive, pre-renewal) | 35-50% | CRM |
| Win-back conversion (reactive, post-churn) | 5-8% | CRM |
| Average days to renewal decision (at-risk) | <30 days | CRM |
| NPS recovery (post-intervention) | +15 points | NPS surveys |

## 9. Common Failures & Mitigations

| Failure | Cause | Mitigation |
|---------|-------|-----------|
| At-risk account missed | Echo agent signal coverage gap | Monthly signal inventory review |
| Win-back motion too late | CS team waited for renewal date | 60-day pre-renewal SLA |
| Wrong intervention strategy | Misdiagnosed churn category | Sage agent diagnosis review |
| Outreach tone-deaf | Bard agent didn't account for relationship context | CSM reviews every win-back email before send |
| No outcome tracking | Renewal signed → file closed | 90-day post-renewal check-in by Echo |

## 10. Integration with the 8-Agent Pipeline

| Agent | Churn Recovery Role |
|-------|--------------------|
| Atlas | Orchestrates intervention strategy per account |
| Scout | Identifies customer's champion departure signals |
| Forge | Enriches account with current usage + support history |
| Sage | Researches customer's business context for diagnosis |
| Judge | Re-scores account fit (was it ever a fit?) |
| Bard | Composes win-back outreach across categories |
| Flow | Coordinates execution + SLA tracking |
| Echo | Monitors signals, generates risk dashboard, measures outcomes |

Churn recovery is the most cross-agent motion in LeadReach — every agent has a role. The playbook above ensures each agent knows its part.
