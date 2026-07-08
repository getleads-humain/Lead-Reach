---
title: "Downsell & Retention Playbook"
category: playbook
grade: A
last_reviewed: 2026-07-08
tags: [downsell, retention, save, churn-prevention, customer-success]
---

# Downsell & Retention Playbook

## Overview

This playbook provides a comprehensive framework for identifying at-risk accounts, executing effective retention conversations, and structuring downsell offers that preserve customer relationships while maintaining revenue integrity. In B2B SaaS, losing a customer costs 5-25x more than retaining one, making systematic retention one of the highest-ROI activities in your go-to-market motion.

LeadReach's AI-powered platform enables proactive churn prevention through early warning signals, automated health scoring, and intelligent save offer recommendations. This playbook translates those capabilities into actionable strategies your team can execute immediately.

---

## Table of Contents

1. [At-Risk Account Identification](#1-at-risk-account-identification)
2. [Customer Health Scoring Framework](#2-customer-health-scoring-framework)
3. [Early Warning Systems](#3-early-warning-systems)
4. [Retention Conversation Scripts](#4-retention-conversation-scripts)
5. [Value Reinforcement Techniques](#5-value-reinforcement-techniques)
6. [Alternative Offering Proposals](#6-alternative-offering-proposals)
7. [Save Offer Structures](#7-save-offer-structures)
8. [Downsell Strategy Framework](#8-downsell-strategy-framework)
9. [Escalation Paths](#9-escalation-paths)
10. [Post-Retention Follow-Up](#10-post-retention-follow-up)
11. [LeadReach Integration Guide](#11-leadreach-integration-guide)
12. [Metrics & KPIs](#12-metrics--kpis)

---

## 1. At-Risk Account Identification

### 1.1 Leading Indicators of Churn Risk

Identifying churn risk before it becomes a cancellation request is the single most important factor in retention success. By the time a customer initiates a cancellation conversation, the probability of saving the account drops below 30%. Early identification gives you a 70-85% save rate.

#### Product Usage Signals

| Signal | Risk Level | Time to Action | LeadReach Detection |
|--------|-----------|----------------|---------------------|
| Login frequency drops >40% | High | 48 hours | Scout Agent monitors CRM + product telemetry |
| Feature adoption plateau | Medium | 1 week | Sage Agent analyzes usage patterns |
| Key user account deactivation | Critical | 24 hours | Real-time alert via Flow Agent |
| Support ticket spike (>3x baseline) | High | 48 hours | Judge Agent correlates support + usage data |
| API call volume decline >30% | High | 48 hours | Automated health score recalculation |
| Integration disconnection | Critical | Immediate | Real-time monitoring alert |

#### Engagement Signals

- **Champion departure**: The primary advocate within the account leaves the organization or changes roles. LeadReach's Echo Agent monitors LinkedIn and news sources for personnel changes at key accounts.
- **Executive sponsor disengagement**: Previously engaged executives stop attending QBRs or skip scheduled meetings.
- **Stakeholder turnover**: More than 30% of known stakeholders have changed within a 6-month period.
- **Community/forum inactivity**: Previously active community participants go silent for 30+ days.
- **Training request decline**: Account stops requesting additional training or enablement sessions.

#### Commercial Signals

- **Payment delays**: Invoice payments shift from Net-30 to Net-60+ without renegotiation.
- **License reduction requests**: Individual license reduction requests, even small ones.
- **Contract term pushback**: Resistance to annual commitments during renewal conversations.
- **Competitor evaluation**: Detected through intent data signals (Scout Agent monitors Bombora/6sense intent signals for competitor names associated with your accounts).
- **Budget reshuffling**: Organizational restructuring that might shift budget away from your category.

#### Organizational Signals

- **Merger/acquisition**: M&A activity often triggers vendor consolidation reviews.
- **Leadership change**: New CTO/CIO frequently initiates technology stack reviews.
- **Layoffs**: Workforce reductions directly impact license counts and priority.
- **Office closures**: Physical consolidation may indicate shifting priorities.
- **Funding round changes**: Down rounds or failed funding rounds constrain budgets.

### 1.2 Account Risk Matrix

Use this matrix to classify at-risk accounts and determine response urgency:

```
                    ┌─────────────────────────────────────┐
                    │           IMPACT LEVEL               │
                    │   Low       Medium       High        │
              ┌─────┼──────────┬──────────┬──────────────┤
              │ Low │ Monitor  │ Watch    │ Proactive    │
  PROBABILITY │     │          │          │ Outreach     │
  OF CHURN    ├─────┼──────────┼──────────┼──────────────┤
              │ Med │ Watch    │ Proactive│ Immediate    │
              │     │          │ Outreach │ Intervention │
              ├─────┼──────────┼──────────┼──────────────┤
              │High │ Proactive│ Immediate│ Executive    │
              │     │ Outreach │Intervention│ Escalation │
              └─────┴──────────┴──────────┴──────────────┘
```

### 1.3 LeadReach Automated Risk Detection

Configure LeadReach to automatically detect and flag at-risk accounts:

1. **Scout Agent**: Continuously monitors external signals (intent data, news, LinkedIn changes) for account-level risk indicators
2. **Sage Agent**: Analyzes internal usage data patterns and identifies statistical deviations from healthy account baselines
3. **Judge Agent**: Correlates multiple signals and assigns composite risk scores
4. **Flow Agent**: Routes at-risk accounts to the appropriate CSM with context-rich alerts

**Configuration Steps**:
1. Navigate to Settings → Health Scoring → Risk Detection
2. Enable "Multi-Signal Risk Analysis"
3. Set threshold for automated alerting (recommended: 65/100 risk score)
4. Configure routing rules based on account tier and risk level
5. Enable Echo Agent champion tracking for all Tier 1 and Tier 2 accounts

---

## 2. Customer Health Scoring Framework

### 2.1 Health Score Dimensions

LeadReach calculates customer health across five dimensions, each weighted based on your business model:

#### Dimension 1: Product Engagement (Weight: 30%)

```
Product Engagement Score = (DAU/MAU ratio × 25) + (Feature Breadth × 25) +
                           (Depth of Usage × 25) + (Workflow Completion × 25)

Where:
- DAU/MAU ratio: Daily active users / Monthly active users (target: >0.4)
- Feature Breadth: % of licensed features used in last 30 days (target: >60%)
- Depth of Usage: Average sessions per user per week (target: >3)
- Workflow Completion: % of started workflows completed (target: >75%)
```

#### Dimension 2: Relationship Strength (Weight: 25%)

- Number of executive sponsors engaged (target: 2+)
- Multi-threading score: Number of active contacts across departments
- CSM engagement frequency: QBR cadence adherence
- Advocacy actions: Case study participation, reference calls, reviews
- Community participation: Forum posts, event attendance, user group involvement

#### Dimension 3: Value Realization (Weight: 25%)

- Time-to-value achieved vs. benchmark
- ROI milestones reached per implementation plan
- Business outcomes documented in QBRs
- Expansion of use cases beyond initial deployment
- Custom metrics defined during onboarding tracking positive trends

#### Dimension 4: Support Health (Weight: 10%)

- Ticket volume trend (decreasing = healthy, increasing = risk)
- Ticket severity distribution (P1 ratio should be <5%)
- Resolution satisfaction scores (target: >4.2/5)
- Time to first response (target: <2 hours for P1)
- Repeat issue ratio (target: <10%)

#### Dimension 5: Commercial Health (Weight: 10%)

- Payment timeliness score
- Contract growth trajectory
- Renewal probability based on historical patterns
- Competitive landscape shifts
- Budget alignment with expansion plans

### 2.2 Health Score Thresholds

| Score Range | Label | Action | Cadence |
|-------------|-------|--------|---------|
| 85-100 | Champion | Nurture for advocacy & expansion | Monthly check-in |
| 70-84 | Healthy | Maintain engagement, plan expansion | Bi-weekly check-in |
| 55-69 | Monitoring | Proactive outreach, value reinforcement | Weekly check-in |
| 40-54 | At Risk | Immediate intervention, retention plan | Twice weekly |
| 0-39 | Critical | Executive escalation, save offer preparation | Daily until stabilized |

### 2.3 Custom Health Score Configuration

LeadReach allows custom dimension weighting based on your business model:

**PLG Companies**: Increase Product Engagement weight to 40%, reduce Commercial Health to 5%
**Enterprise Companies**: Increase Relationship Strength to 35%, reduce Support Health to 5%
**Mid-Market**: Balanced weighting with slight emphasis on Value Realization at 30%

---

## 3. Early Warning Systems

### 3.1 Signal Detection Architecture

LeadReach's early warning system operates on a three-layer detection model:

#### Layer 1: Real-Time Alerts (Immediate Response Required)

- Champion departure detected (LinkedIn job change monitored by Echo Agent)
- API integration disconnection
- P1 support ticket escalation
- Competitor intent spike detected on account domain
- Mass user deactivation (>20% of licensed users in 48 hours)

**Response Protocol**:
1. Automated alert sent to assigned CSM + CS Manager
2. CSM acknowledges alert within 4 hours
3. Initial outreach to account within 24 hours
4. Situation assessment documented in CRM within 48 hours
5. Retention plan created if risk confirmed

#### Layer 2: Trend-Based Warnings (Proactive Response)

- 30-day usage decline trajectory (>5% week-over-week)
- Support ticket volume trending upward over 60 days
- Engagement score declining for 3+ consecutive weeks
- NPS survey response drops below 7
- QBR cancellation or postponement

**Response Protocol**:
1. Weekly risk review meeting evaluates all trend warnings
2. CSM develops proactive outreach plan within 1 week
3. Value reinforcement conversation scheduled
4. Usage optimization recommendations prepared
5. Follow-up health score assessment in 2 weeks

#### Layer 3: Predictive Risk Indicators (Strategic Planning)

- Account approaching renewal with low engagement
- Similar account profiles that have previously churned
- Industry downturn signals affecting account's vertical
- Contract structure misalignment with actual usage
- Expansion conversations stalled for 90+ days

**Response Protocol**:
1. Monthly portfolio review identifies predictive risks
2. Pre-renewal strategy session 120 days before expiry
3. Executive alignment outreach initiated
4. Value documentation package prepared
5. Alternative offering options pre-approved

### 3.2 LeadReach Risk Radar Configuration

The Risk Radar is your dashboard for monitoring all at-risk accounts in real-time:

1. **Global Risk View**: All accounts sorted by risk score with trend arrows
2. **Tier-Based Views**: Separate views for Enterprise, Mid-Market, and SMB portfolios
3. **CSM Portfolio View**: Individual CSM's at-risk accounts with action items
4. **Signal Timeline**: Chronological view of risk signals for each account
5. **Predictive Forecast**: ML-based prediction of which accounts will churn in next 90 days

---

## 4. Retention Conversation Scripts

### 4.1 The L.A.S.T. Framework

All retention conversations at LeadReach follow the L.A.S.T. framework:

**L — Listen**: Start by understanding the customer's situation without defending or solving. Let them fully express their concerns.

**A — Acknowledge**: Validate their feelings and concerns. Show empathy without being patronizing.

**S — Solve**: Present solutions that directly address their stated concerns. Offer alternatives, not just the status quo.

**T — Transform**: Reframe the conversation from problem-solving to future-planning. Help them see a path forward.

### 4.2 Conversation Scripts by Scenario

#### Scenario 1: Budget Cuts / Price Concern

**Opening**:
```
"I appreciate you being upfront about the budget situation. That's something
we're hearing from several organizations right now, and I want to make sure
we find a path that works for both sides. Can you help me understand what
the budget constraints look like — is this a temporary shift or a more
structural change?"
```

**Exploration Questions**:
- "What value are you currently getting from LeadReach that you'd find hardest to replace?"
- "If you had to prioritize 3 things the platform does for your team, what would they be?"
- "Are there teams or features that are less critical right now that we could adjust?"

**Solution Framing**:
```
"Based on what you've shared, here are a few options that might help:

Option A: We can adjust your tier to focus on the core capabilities your team
is actively using, which would reduce your cost by [X%] while preserving the
features that drive the most value for your specific workflows.

Option B: We can restructure your contract to align payment timing with your
budget cycle, spreading costs differently without changing your access.

Option C: If this is a temporary constraint, we can implement a 90-day
adjustment period with a plan to restore full access when budgets normalize.

Which of these feels most aligned with your situation?"
```

#### Scenario 2: Champion Departure

**Opening**:
```
"I heard about [Champion's Name]'s transition — I want to make sure the team
continues to get full value from LeadReach regardless of personnel changes.
How are things being restructured on your end?"
```

**Exploration Questions**:
- "Who's stepping into [Champion's Name]'s role for vendor management?"
- "What institutional knowledge about LeadReach exists on the team?"
- "Are there concerns about continuity or training needs?"

**Solution Framing**:
```
"That makes sense. Let me propose a structured transition plan:

1. I'll schedule a knowledge transfer session with the incoming lead within
   the next week to ensure continuity.
2. We'll create a customized quick-start guide for the new stakeholder
   covering their most-used workflows.
3. I'll set up a 30-day accelerated check-in cadence during the transition.
4. We can arrange an executive briefing for the new leadership to align on
   strategic value.

Would next Tuesday work for the initial knowledge transfer session?"
```

#### Scenario 3: Competitor Evaluation

**Opening**:
```
"I appreciate your transparency — it's natural to evaluate options,
especially when you're investing in a platform like this. I'm confident
that the best outcome for your team is making an informed decision, whether
that's LeadReach or another solution. Can you share what's prompting the
evaluation?"
```

**Exploration Questions**:
- "What gaps or friction are you experiencing with LeadReach right now?"
- "What capabilities are you looking for that might be different from what we provide?"
- "Is this about features, pricing, service, or something else entirely?"

**Solution Framing**:
```
"Thank you for sharing that. Let me address each point directly:

[Address specific capability gaps with roadmap or alternative solutions]

[Provide competitive differentiation on areas where LeadReach excels]

[Offer a 90-day action plan to close any genuine gaps]

I'd also like to propose a side-by-side value comparison so your team has
complete information for the evaluation. We can prepare a customized
comparison based on your specific requirements — would that be helpful?"
```

#### Scenario 4: Low Usage / Value Concern

**Opening**:
```
"I've been reviewing your account and noticed that usage has shifted from
when we first set up your workflows. I want to make sure the platform is
actually delivering on the value we planned for. Can you walk me through
how your team's needs have evolved?"
```

**Exploration Questions**:
- "What workflows are still actively driving value for your team?"
- "What's changed in your team's priorities since implementation?"
- "Are there features you're not using that you'd like to explore?"

**Solution Framing**:
```
"I see — your needs have evolved beyond the original setup. Here's what
I'd recommend:

1. A workflow audit to identify which features align with your current
   priorities and which we can streamline.
2. A re-onboarding session focused on the capabilities that match your
   team's current workflow.
3. Custom training for any team members who haven't had a recent session.

Alternatively, if your needs have shifted significantly, we might
restructure your plan to focus on the capabilities that matter now, which
could actually reduce your cost while improving relevance.

Would you like to start with the workflow audit this week?"
```

---

## 5. Value Reinforcement Techniques

### 5.1 The Value Anchor Method

The Value Anchor Method ensures customers are continuously reminded of the value they receive, not just the cost they pay.

#### Step 1: Establish Value Anchors During Onboarding

During the first 90 days, document specific, measurable outcomes the customer achieves:

```
Value Anchor Template:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account: [Company Name]
Date Established: [Date]
Value Anchor 1: "[Specific outcome] achieved, resulting in [measurable impact]"
Value Anchor 2: "[Specific outcome] achieved, resulting in [measurable impact]"
Value Anchor 3: "[Specific outcome] achieved, resulting in [measurable impact]"

Executive Sponsor Confirmed: [Yes/No]
Documented in QBR: [Yes/No]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 2: Reinforce Value Anchors at Every Touchpoint

- Include one value anchor reference in every CSM communication
- Start QBR presentations with value anchor recap
- Reference value anchors in renewal proposals
- Create visual dashboards tracking value anchor metrics

#### Step 5: Update Value Anchors as Outcomes Evolve

- Add new value anchors when expansion features are adopted
- Retire value anchors that are no longer relevant
- Quantify value anchors in the customer's own business language

### 5.2 ROI Documentation Package

Prepare a comprehensive ROI document before every renewal conversation:

1. **Executive Summary**: One-page summary of total value delivered
2. **Quantified Outcomes**: Specific metrics tied to business impact
3. **Usage Analysis**: Feature adoption and usage trends
4. **Competitive Comparison**: Value relative to alternatives
5. **Future Value Projection**: Expected outcomes for the next contract period
6. **Cost of Switching**: Hidden costs and risks of transitioning to a competitor

### 5.3 Quarterly Value Reviews

Structure quarterly value reviews (QVRs) to systematically reinforce value:

**Agenda Template**:
1. Value anchor recap (10 minutes)
2. New outcomes achieved this quarter (15 minutes)
3. Usage insights and optimization opportunities (10 minutes)
4. Upcoming product releases relevant to their use case (10 minutes)
5. Strategic alignment discussion — their priorities, our roadmap (10 minutes)
6. Action items and next steps (5 minutes)

---

## 6. Alternative Offering Proposals

### 6.1 Tier-Based Alternatives

When a customer expresses intent to leave due to cost or value misalignment, present structured alternatives:

#### Enterprise → Professional Downsell

| Feature | Enterprise | Professional | Impact |
|---------|-----------|-------------|--------|
| Agent Pipeline | 8 agents | 5 agents (Atlas, Scout, Forge, Sage, Flow) | Lose Judge quality gate, Bard content, Echo nurture |
| Monthly Credits | 50,000 | 25,000 | Reduced outreach volume |
| Custom Integrations | Unlimited | 3 included | May need to reduce connected systems |
| Dedicated CSM | Named CSM | Shared CSM pool | Less personalized attention |
| SLA | 99.9% uptime, 1hr P1 | 99.5% uptime, 4hr P1 | Longer incident response |
| Price | $4,500/mo | $2,200/mo | 51% savings |

#### Professional → Starter Downsell

| Feature | Professional | Starter | Impact |
|---------|-------------|---------|--------|
| Agent Pipeline | 5 agents | 3 agents (Scout, Forge, Flow) | Lose Atlas strategy, Sage analytics |
| Monthly Credits | 25,000 | 10,000 | Significantly reduced volume |
| CRM Integration | Native 2-way | 1-way sync only | Reduced automation |
| Team Seats | Unlimited | 5 included | Limited team access |
| Price | $2,200/mo | $800/mo | 64% savings |

### 6.2 Usage-Based Alternatives

For customers whose usage has decreased, propose usage-aligned pricing:

```
Usage-Adjusted Plan Structure:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Base Platform Fee: $X/mo (reduced from current $Y/mo)
Per-Credit Overage: $0.08/credit (for usage above base)
Minimum Commitment: 6 months at adjusted base rate
Re-evaluation: Automatic review at 6 months
Re-conversion Trigger: If usage exceeds [threshold] for 2 consecutive
  months, plan automatically converts back to standard tier
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 6.3 Feature-Scoped Alternatives

Remove specific feature modules to reduce cost while preserving core value:

- **Remove multi-channel outreach**: Keep email only, remove LinkedIn + phone sequences
- **Remove advanced analytics**: Keep basic reporting, remove custom report builder + predictive analytics
- **Remove team collaboration**: Keep individual user mode, remove shared sequences + team templates
- **Remove API access**: Keep UI-only access, remove programmatic integrations
- **Remove custom agent configuration**: Keep standard agent pipeline, remove custom agent tuning

---

## 7. Save Offer Structures

### 7.1 Standard Save Offers by Account Tier

#### Tier 1 (Enterprise — $100K+ ACV)

| Offer Type | Discount | Duration | Approval Required | Conditions |
|-----------|---------|----------|-------------------|------------|
| Payment restructuring | 0% | 12 months | VP CS | Must maintain full contract term |
| Tier downsell | Up to 40% | 12 months | VP CS + VP Sales | Must commit to annual renewal |
| Feature scoping | Up to 30% | 12 months | VP CS | Must maintain minimum seat count |
| Service credit | Up to 15% | One-time | CSM Director | Documented service failure |
| Executive sponsor | N/A | Ongoing | CRO | Must commit to 2-year renewal |

#### Tier 2 (Mid-Market — $25K-$100K ACV)

| Offer Type | Discount | Duration | Approval Required | Conditions |
|-----------|---------|----------|-------------------|------------|
| Payment restructuring | 0% | 6-12 months | CS Director | Must maintain 75% of contract value |
| Tier downsell | Up to 35% | 12 months | CS Director | Must sign new 12-month commitment |
| Feature scoping | Up to 25% | 12 months | CS Manager | Must maintain minimum seat count |
| Service credit | Up to 10% | One-time | CS Manager | Documented service failure |
| Training package | Up to $5K value | One-time | CS Manager | Must complete training within 90 days |

#### Tier 3 (SMB — <$25K ACV)

| Offer Type | Discount | Duration | Approval Required | Conditions |
|-----------|---------|----------|-------------------|------------|
| Plan adjustment | Up to 30% | 12 months | CS Manager | Must sign annual commitment |
| Feature reduction | Up to 20% | 12 months | CS Manager | Self-serve plan switch |
| Payment extension | 0% | 3 months | CS Manager | Must commit to full payment |
| Onboarding refresh | Free | One-time | CSM | Must complete within 60 days |

### 7.2 Save Offer Decision Tree

```
Customer expresses churn intent
│
├── Is the reason primarily budget-related?
│   ├── YES → Can we restructure payments?
│   │   ├── YES → Offer payment restructuring
│   │   └── NO → Can we reduce scope?
│   │       ├── YES → Offer tier downsell or feature scoping
│   │       └── NO → Offer temporary discount with renewal commitment
│   └── NO → Is the reason product/feature-related?
│       ├── YES → Can we address the gap?
│       │   ├── YES → Offer roadmap commitment + interim workaround
│       │   └── NO → Offer alternative workflow + training
│       └── NO → Is the reason service-related?
│           ├── YES → Offer service credit + improved SLA
│           └── NO → Is the reason strategic (M&A, vendor consolidation)?
│               ├── YES → Executive escalation + strategic partnership proposal
│               └── NO → Deep discovery conversation (may be unspoken concern)
```

### 7.3 Save Offer Execution Checklist

- [ ] Document the specific churn reason in CRM
- [ ] Calculate customer lifetime value vs. save offer cost
- [ ] Verify save offer fits within approval authority matrix
- [ ] Obtain required approvals before presenting to customer
- [ ] Present offer with positive framing (investment adjustment, not discount)
- [ ] Set clear expiration for save offer (recommended: 10 business days)
- [ ] Document acceptance or decline with reasons
- [ ] If accepted, implement changes within 5 business days
- [ ] Schedule 30-day follow-up to confirm stabilization

---

## 8. Downsell Strategy Framework

### 8.1 When Downsell Is the Right Move

A downsell is preferable to a full churn in these scenarios:

1. **Customer budget genuinely cannot support current tier** — verified through discovery
2. **Usage patterns have permanently shifted** — making the current tier unnecessary
3. **Organizational restructuring** — has reduced the team size or scope
4. **Strategic pivot** — customer's business direction no longer requires full capabilities
5. **Competitive pressure** — where maintaining the relationship at lower revenue is strategically valuable

### 8.2 Downsell Principles

**Principle 1: Downsell Is a Relationship Preservation Tool, Not a Revenue Optimization Tool**
Never position a downsell as extracting maximum revenue from a distressed customer. Frame it as helping them find the right fit for their current needs.

**Principle 2: Every Downsell Should Include a Growth Path**
A well-executed downsell creates a natural upgrade trigger. Build in re-expansion mechanisms:

```
Growth Trigger Examples:
- Usage-based pricing that naturally scales as activity increases
- Feature gates that expose value of higher tiers
- Quarterly business reviews that assess evolving needs
- Product updates that showcase capabilities they're missing
```

**Principle 3: Downsell Data Is Invaluable**
Every downsell conversation reveals product-market fit insights. Track:
- Which features customers are willing to lose
- Which features they insist on keeping
- Price sensitivity thresholds
- Competitive alternatives they considered

**Principle 4: Protect the Customer Experience**
A downsell should feel like a positive adjustment, not a punishment. Customers who downsell should still receive excellent service and support at their new tier.

### 8.3 Downsell Financial Modeling

Before proposing any downsell, calculate the financial impact:

```
Downsell ROI Calculation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Annual Revenue: $__________
Downsell Annual Revenue: $__________
Revenue Reduction: $__________

vs.

Full Churn Cost:
  Lost revenue: $__________
  Replacement acquisition cost: $__________ (typically 5-7x annual contract)
  Total churn cost: $__________

Downsell Net Benefit: $__________ (churn cost - revenue reduction)

Expansion Probability (24 months): ____% (industry avg: 35%)
Expected Expansion Revenue: $__________

Net Present Value of Downsell vs. Churn: $__________
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 9. Escalation Paths

### 9.1 Escalation Tiers

#### Tier 1: CSM-Led Retention (Health Score 55-69)

- **Owner**: Assigned Customer Success Manager
- **Timeline**: 2 weeks to show improvement
- **Authority**: Can offer up to 10% service credit, training packages, onboarding refresh
- **Actions**: Proactive outreach, value reinforcement, usage optimization
- **Escalation trigger**: Health score drops below 55 or no improvement in 2 weeks

#### Tier 2: CS Manager-Led Retention (Health Score 40-54)

- **Owner**: CS Manager with CSM support
- **Timeline**: 1 week to develop retention plan, 4 weeks to stabilize
- **Authority**: Can offer up to 25% discount, tier downsell, feature scoping, payment restructuring
- **Actions**: Executive outreach, custom retention plan, cross-functional alignment
- **Escalation trigger**: Health score drops below 40 or customer initiates cancellation

#### Tier 3: VP CS + Sales Overlay (Health Score 0-39 or Active Cancellation)

- **Owner**: VP Customer Success with Account Executive support
- **Timeline**: 48 hours to respond, 2 weeks to resolve
- **Authority**: Can offer up to 40% discount, custom packages, executive sponsor assignment
- **Actions**: Executive-to-executive engagement, strategic partnership proposal, save offer with renewal commitment
- **Escalation trigger**: CRO involvement needed for exceptions beyond VP authority

#### Tier 4: CRO / Executive Escalation (Strategic Accounts or High-Value At Risk)

- **Owner**: Chief Revenue Officer
- **Timeline**: 24 hours to respond
- **Authority**: Unlimited — custom deals, strategic partnerships, equity considerations
- **Actions**: Executive engagement, board-level advocacy, strategic account designation
- **Trigger**: Account represents >$250K ACV or strategic market positioning value

### 9.2 Escalation Communication Templates

#### CSM to CS Manager Escalation

```
Subject: [URGENT] Retention Escalation — [Account Name] — Health Score [X]

Summary:
- Account: [Name], Tier: [X], ACV: $[Y]
- Current Health Score: [X] (down from [Y] in [timeframe])
- Primary Risk: [Budget/Product/Service/Strategic]
- CSM Actions Taken: [List of outreach, offers, interventions]
- Customer's Stated Position: [Summary of customer communication]

Request:
- Approval for [specific save offer]
- Executive outreach support
- [Any other specific needs]

Recommended Next Step: [Proposed action with timeline]
```

#### CS Manager to VP CS Escalation

```
Subject: [CRITICAL] Executive Retention Escalation — [Account Name] — $[ACV]

Account Overview:
- ACV: $[X] | Contract End Date: [Date] | Health Score: [X]
- Risk Category: [Category] | Probability of Churn: [%]

Escalation Reason:
[Detailed explanation of why Tier 3 intervention is needed]

Actions Taken at Tier 2:
1. [Action and result]
2. [Action and result]
3. [Action and result]

Proposed Tier 3 Actions:
1. [Action] — Requires: [Authority/Resource]
2. [Action] — Requires: [Authority/Resource]

Financial Impact:
- Downsell option: $[X] (vs. current $[Y])
- Churn cost: $[X] + $[Y] acquisition replacement
- Recommended offer: [Details] at $[Z]

Decision Needed By: [Date/Time]
```

---

## 10. Post-Retention Follow-Up

### 10.1 The 90-Day Stabilization Plan

After successfully retaining an account, implement a structured stabilization plan:

#### Days 1-7: Immediate Reinforcement

- Send personalized thank-you communication from CSM + executive sponsor
- Implement any agreed-upon changes (tier adjustment, feature scoping, etc.)
- Schedule 1:1 check-in within 3 business days
- Document retention details in CRM including reason, offer, and commitments
- Configure LeadReach Flow Agent for enhanced monitoring during stabilization

#### Days 8-30: Value Re-Establishment

- Conduct focused training session on most-valued features
- Set up custom usage dashboards for the customer's key stakeholders
- Schedule and conduct a mini-QBR focused on immediate value realization
- Introduce any new features or improvements that align with their stated needs
- Monitor usage patterns daily via LeadReach Sage Agent

#### Days 31-60: Relationship Deepening

- Identify and engage new stakeholders who may not have been involved in retention
- Propose one new use case or workflow that adds incremental value
- Facilitate peer connection with a similar customer who has achieved strong results
- Begin planting seeds for future expansion if the account was downsold
- Reduce monitoring frequency to weekly as account stabilizes

#### Days 61-90: Full Recovery Confirmation

- Conduct full QBR with value documentation
- Confirm health score has returned to "Healthy" range (>70)
- If downsell occurred, introduce growth path and trigger mechanisms
- Transition from stabilization cadence to standard engagement model
- Document lessons learned for retention playbook refinement

### 10.2 Retrospective Analysis

After every retention effort (successful or not), complete a retrospective:

```
Retention Retrospective Template:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Account: [Name]
Outcome: [Retained / Downsell / Churned]

Root Cause Analysis:
- Primary churn driver: [Budget / Product / Service / Strategic / Other]
- When was risk first detected? [Date]
- How long between detection and intervention? [Time]
- Could earlier detection have changed the outcome? [Yes/No + Explanation]

Intervention Effectiveness:
- Which actions had the most positive impact? [List]
- Which actions had no impact or negative impact? [List]
- What would we do differently? [List]

Systemic Insights:
- Is this a pattern we're seeing across multiple accounts? [Yes/No]
- Product gaps identified: [List]
- Process improvements needed: [List]
- Training/guidance gaps: [List]

Action Items:
1. [Action item] — Owner: [Name] — Due: [Date]
2. [Action item] — Owner: [Name] — Due: [Date]
3. [Action item] — Owner: [Name] — Due: [Date]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 11. LeadReach Integration Guide

### 11.1 Setting Up Automated Retention Workflows

LeadReach provides purpose-built retention workflows that leverage the 8-agent pipeline:

**Workflow 1: Proactive Retention Signal Detection**
```
Scout Agent → Identifies external risk signals (intent data, news, LinkedIn)
    ↓
Sage Agent → Analyzes internal usage patterns for anomaly detection
    ↓
Judge Agent → Correlates signals and assigns composite risk score
    ↓
Flow Agent → Routes alert to appropriate CSM with full context
    ↓
Atlas Agent → Recommends retention strategy based on account profile
```

**Workflow 2: Retention Conversation Preparation**
```
Sage Agent → Generates account health summary with trend analysis
    ↓
Forge Agent → Enriches account data with latest firmographic + intent data
    ↓
Bard Agent → Drafts personalized retention conversation scripts
    ↓
Atlas Agent → Recommends save offer options based on account tier + risk type
```

**Workflow 3: Post-Retention Stabilization**
```
Flow Agent → Sets up enhanced monitoring cadence for 90 days
    ↓
Echo Agent → Schedules automated check-in sequences
    ↓
Sage Agent → Monitors recovery metrics and alerts on regression
    ↓
Bard Agent → Generates periodic value reports for customer stakeholders
```

### 11.2 Configuration Checklist

- [ ] Enable multi-signal risk detection in Health Scoring settings
- [ ] Configure risk score thresholds for automated alerting
- [ ] Set up routing rules by account tier and risk level
- [ ] Enable Echo Agent champion tracking for key accounts
- [ ] Configure Scout Agent intent monitoring for competitor keywords
- [ ] Set up Judge Agent correlation rules for signal combination
- [ ] Create custom health score dimensions for your business model
- [ ] Configure Flow Agent stabilization workflows
- [ ] Set up Bard Agent retention script templates
- [ ] Enable Atlas Agent save offer recommendation engine

---

## 12. Metrics & KPIs

### 12.1 Retention Metrics Dashboard

Track these key metrics monthly:

| Metric | Target | Measurement | LeadReach Agent |
|--------|--------|-------------|-----------------|
| Gross Retention Rate | >90% | (Starting MRR - Churn MRR) / Starting MRR | Flow Agent |
| Net Retention Rate | >110% | (Starting MRR + Expansion - Contraction - Churn) / Starting MRR | Flow Agent |
| Health Score Distribution | <15% in At Risk/Critical | % of accounts below 55 health score | Sage Agent |
| Save Rate | >60% | Retained accounts / Total at-risk accounts | Flow Agent |
| Time to Detect Risk | <14 days | Average days between risk signal and alert | Judge Agent |
| Time to Intervene | <5 days | Average days between alert and first outreach | Flow Agent |
| Downsell Revenue Preservation | >70% | Downsell revenue / Original revenue for downsell accounts | Flow Agent |
| Post-Retention Recovery Rate | >80% | Accounts returning to Healthy within 90 days | Sage Agent |
| Retrospective Completion Rate | 100% | Retrospectives completed / Total retention efforts | Manual |

### 12.2 Leading vs. Lagging Indicators

**Leading Indicators** (predict future retention outcomes):
- Health score trend (improving vs. declining)
- Product engagement velocity
- Support ticket sentiment score
- Stakeholder multi-threading ratio
- QBR attendance rate

**Lagging Indicators** (confirm retention outcomes):
- Gross and net retention rates
- Logo churn rate
- Downsell rate
- Net revenue retention
- Customer lifetime value

### 12.3 Reporting Cadence

- **Daily**: Critical risk alerts, champion departure notifications
- **Weekly**: At-risk account review, intervention progress tracking
- **Monthly**: Retention metrics dashboard, health score distribution, save rate analysis
- **Quarterly**: Retention program effectiveness review, retrospective insights synthesis, playbook updates
- **Annually**: Comprehensive retention program audit, strategy recalibration, target setting

---

## Appendix A: Retention Conversation Quick Reference Card

| Scenario | Opening Line | Key Question | Go-To Solution |
|----------|-------------|-------------|----------------|
| Budget cut | "I appreciate you being upfront..." | "What value would be hardest to replace?" | Payment restructuring or tier downsell |
| Champion left | "I heard about the transition..." | "Who's stepping into the role?" | Transition plan + executive briefing |
| Competitor eval | "It's natural to evaluate options..." | "What's prompting the evaluation?" | Value comparison + gap closure plan |
| Low usage | "I noticed usage has shifted..." | "How have your needs evolved?" | Workflow audit + re-onboarding |
| Service issue | "I understand your frustration..." | "What would full resolution look like?" | Service credit + SLA improvement |
| M&A activity | "Congratulations on the [merger/acquisition]..." | "How is vendor management being consolidated?" | Strategic partnership proposal |
| Strategic pivot | "I'd love to understand the new direction..." | "How does LeadReach fit into the new strategy?" | Scope realignment + future roadmap alignment |

## Appendix B: Save Offer Approval Authority Matrix

| Role | Max Discount | Max Service Credit | Downsell Authority | Custom Package Authority |
|------|-------------|-------------------|--------------------|-----------------------|
| CSM | 0% | $500 | None | None |
| CS Manager | 10% | $2,000 | Standard tier only | Feature scoping |
| CS Director | 20% | $5,000 | Tier downsell | Partial custom package |
| VP CS | 35% | $15,000 | Full downsell + restructuring | Custom package |
| CRO | Unlimited | Unlimited | Full authority | Full authority |

---

*This playbook is maintained by the Customer Success leadership team and reviewed quarterly. For questions or suggested improvements, contact the CS Operations team.*
