---
title: "Deal Velocity Optimization — Methodology, Bottleneck Analysis & Acceleration"
last_reviewed: 2026-07-04
grade: A
tags: [domain, velocity, cycle-time, acceleration, deal-momentum, sage, atlas]
---

# Deal Velocity Optimization — Methodology, Bottleneck Analysis & Acceleration

## 1. Executive Summary

Deal velocity is the measure of how quickly opportunities move from qualified lead to closed-won. It is the force multiplier in the revenue equation: a 20% improvement in velocity has the same revenue impact as a 20% increase in win rate or deal size, but it compounds over time because faster cycles mean more deals per rep per year.

This methodology defines how LeadReach identifies velocity bottlenecks, implements acceleration strategies, and measures the impact of velocity improvements across the pipeline. The core principle: **velocity is not about rushing the buyer — it is about removing friction from the buying process**. Buyers want to solve their problems quickly; the seller's job is to make every step toward a decision as efficient as possible.

The LeadReach agent ecosystem contributes to velocity optimization through continuous monitoring (Echo), analytical diagnosis (Sage), orchestrated interventions (Atlas), content delivery (Bard), and process automation (Flow).

## 2. Core Concepts and Definitions

### Deal Velocity
The composite metric measuring the speed of revenue generation: `(Number of Deals x Average Deal Value x Win Rate) / Average Sales Cycle in Days`. An increase in any numerator or decrease in the denominator improves velocity.

### Cycle Time
The elapsed calendar days from opportunity creation (Stage 1) to closed-won. Distinct from "touch time" (actual hours spent), cycle time includes waiting periods between buyer-seller interactions.

### Stage Duration
The time an opportunity spends in each pipeline stage. Stage duration analysis reveals where deals slow down.

### Drag Coefficient
A LeadReach-specific metric measuring the ratio of actual stage duration to the expected duration for that ICP segment. A drag coefficient >1.5x indicates a bottleneck.

### Momentum Score
A composite signal (0-100) based on recent buyer engagement, meeting frequency, email response rate, and content consumption. Deals with declining momentum are at risk of stalling regardless of stage.

### Buying Committee Velocity
The speed at which the buying committee aligns. In enterprise deals, the slowest internal stakeholder determines the overall velocity. Multi-threading accelerates buying committee alignment.

### Time-to-Value
The elapsed time from contract signature to the customer achieving their first measurable outcome. While technically a post-sale metric, it influences deal velocity because buyers who perceive fast time-to-value decide faster.

### Reverse Velocity
The phenomenon where deals move backward — from a higher stage to a lower stage — due to new information (budget cuts, competitor re-emerges, champion departure). Reverse velocity is a critical early warning signal.

## 3. Methodology Overview — The Velocity Flywheel

Deal velocity optimization follows a four-phase flywheel:

```
DIAGNOSE → INTERVENE → MEASURE → REFINE → (repeat)
```

### Phase 1: Diagnose
Identify where velocity breaks down using stage duration analysis, drag coefficient calculation, and momentum scoring. The output is a velocity map showing where deals slow, stall, or reverse.

### Phase 2: Intervene
Apply targeted acceleration strategies to the identified bottlenecks. Interventions are specific to the bottleneck type: procurement delays, champion disengagement, technical evaluation scope creep, competitive evaluaation paralysis.

### Phase 3: Measure
Track the impact of interventions on cycle time, stage progression rates, and overall pipeline velocity. Compare against the pre-intervention baseline.

### Phase 4: Refine
Adjust interventions based on measured results. Codify successful interventions into repeatable plays. Update stage SLAs based on observed improvement.

The flywheel spins continuously — every quarter produces new diagnostic data that feeds the next iteration.

## 4. Detailed Process Steps

### Step 1: Establish the Velocity Baseline

Before optimizing, measure the current state with precision:

1. **Calculate pipeline velocity by ICP segment**: Enterprise, mid-market, and SMB deals have fundamentally different velocity profiles. Do not average them together.
2. **Measure stage durations**: For each ICP segment, calculate the median and 75th percentile stage duration for every stage.
3. **Identify the drag stages**: Which stages consistently exceed their SLA? This is where optimization will yield the highest return.
4. **Map the engagement curve**: Plot buyer engagement (emails, meetings, content views) over the deal lifecycle. Where does engagement drop?
5. **Benchmark against industry**: Compare your velocity metrics against published benchmarks for your vertical and price point.

Sage automates this baseline calculation using CRM data, activity logs, and conversation intelligence.

### Step 2: Diagnose Bottlenecks by Type

Velocity bottlenecks fall into six categories, each requiring a different intervention:

#### Bottleneck Type 1: Access Delay (Stage 1 → 2)
**Symptom**: Long time between qualification and first discovery meeting.
**Root causes**: Wrong contact (no authority), contact unresponsive, scheduling friction.
**Diagnosis**: Measure days from qualification to first meeting. If median >10 business days, access is a bottleneck.
**Intervention**: Scout identifies alternative contacts; Forge enriches with direct contact info; Atlas adjusts outreach cadence.

#### Bottleneck Type 2: Discovery Inefficiency (Stage 2 → 3)
**Symptom**: Multiple discovery calls with no progression to solution presentation.
**Root causes**: Unclear pain points, wrong stakeholder in the room, seller not qualifying effectively.
**Diagnosis**: Measure discovery-to-demo ratio. If >2 discovery calls per deal on average, discovery is inefficient.
**Intervention**: Bard generates pre-meeting briefs with suggested discovery questions; Judge scores discovery quality from call recordings.

#### Bottleneck Type 3: Evaluation Scope Creep (Stage 4)
**Symptom**: POC or evaluation drags on beyond the agreed timeline.
**Root causes**: No success criteria defined, evaluation scope too broad, technical team overwhelmed.
**Diagnosis**: Measure evaluation duration vs. agreed timeline. If median evaluation exceeds 30 days for mid-market, scope creep is likely.
**Intervention**: Require POC success criteria and timeline at Stage 4 entry; Atlas sends automated check-ins; Sage flags overdue evaluations.

#### Bottleneck Type 4: Procurement Friction (Stage 5 → 6)
**Symptom**: Long delay between proposal delivery and contract execution.
**Root causes**: Legal review backlog, procurement process unknown, security review required, MSA redlining.
**Diagnosis**: Measure proposal-to-close duration. If median >45 days for enterprise, procurement is a bottleneck.
**Intervention**: Pre-negotiate MSAs with common terms; provide security documentation proactively; engage procurement early in the process.

#### Bottleneck Type 5: Champion Disengagement (Any Stage)
**Symptom**: Previously responsive contact stops replying; meeting frequency drops.
**Root causes**: Champion lost authority, budget reallocated, competing priorities, champion considering leaving.
**Diagnosis**: Echo monitors engagement signals; momentum score declining for 2+ consecutive weeks.
**Intervention**: Multi-thread immediately (engage 2+ additional stakeholders); Atlas triggers re-engagement sequence; Scout identifies the real reason for disengagement.

#### Bottleneck Type 6: Decision Paralysis (Stage 5 → 6)
**Symptom**: Buyer keeps asking for more information without making a decision.
**Root causes**: No clear decision criteria, competing internal priorities, fear of making the wrong choice, competitor in the mix.
**Diagnosis**: Measure number of "last questions" or additional information requests. If >3 rounds of additional requests, decision paralysis is likely.
**Intervention**: Facilitate a decision framework for the buyer; provide social proof from similar customers; create urgency with time-limited pricing or implementation slot.

### Step 3: Design Acceleration Plays

For each bottleneck type, design specific, repeatable plays:

#### Play: Fast-Track Discovery
- **When**: Access delay detected (>10 days to first meeting)
- **Actions**:
  1. Scout identifies 3 additional contacts at the account
  2. Forge enriches with direct contact info and role verification
  3. Atlas initiates parallel outreach sequences to all contacts
  4. Bard generates personalized value propositions per contact role
  5. Flow auto-schedules meeting when any contact replies
- **Expected impact**: 40% reduction in time-to-first-meeting

#### Play: POC Timebox
- **When**: Evaluation entering Stage 4
- **Actions**:
  1. Define POC success criteria collaboratively with the buyer
  2. Set a hard deadline (14 days for mid-market, 30 days for enterprise)
  3. Provide a dedicated technical resource for the POC period
  4. Schedule midpoint check-in at 50% of POC timeline
  5. Auto-advance to Stage 5 if success criteria are met at deadline
- **Expected impact**: 35% reduction in evaluation duration

#### Play: Procurement Fast-Path
- **When**: Proposal delivered (Stage 5)
- **Actions**:
  1. Include pre-completed security questionnaire with proposal
  2. Provide standard MSA with pre-negotiated terms for common redlines
  3. Request procurement contact at proposal delivery
  4. Schedule procurement introduction call within 5 business days
  5. Flow tracks procurement milestones and alerts on delays
- **Expected impact**: 25% reduction in proposal-to-close duration

#### Play: Champion Fortification
- **When**: Momentum score declining or single-threaded deal at Stage 3+
- **Actions**:
  1. Forge maps the buying committee (identify 5+ stakeholders)
  2. Scout researches each stakeholder's priorities and concerns
  3. Bard creates stakeholder-specific business cases
  4. Atlas orchestrates multi-threaded engagement
  5. Echo monitors all stakeholder engagement signals
- **Expected impact**: 50% reduction in champion-dependent deal stalls

### Step 4: Implement Velocity Monitoring

Real-time velocity monitoring prevents bottlenecks before they form:

1. **Daily momentum scoring**: Every active deal gets a momentum score (0-100) based on recent engagement signals. Score updates daily.
2. **Stage duration alerting**: When a deal exceeds its stage SLA by 50%, Echo alerts the rep and manager.
3. **Velocity trend tracking**: Sage calculates weekly pipeline velocity trends by segment. Declining velocity triggers diagnostic review.
4. **Reverse velocity detection**: When a deal moves backward or the buyer re-opens previously settled topics, Echo flags it immediately.
5. **Forecast velocity adjustment**: When pipeline velocity is declining, the forecast model automatically adjusts expected close dates outward.

### Step 5: Measure and Refine

After each quarter, measure velocity improvement with precision:

1. **Pre/post cycle time comparison**: Compare median cycle time by ICP segment Q-over-Q
2. **Stage duration analysis**: Which stages improved? Which got worse?
3. **Play effectiveness**: Which acceleration plays were used and what was their measured impact?
4. **Win rate interaction**: Did velocity improvements affect win rates? Faster cycles sometimes reduce win rates if quality is sacrificed.
5. **Rep adoption**: Which reps are using the plays? Are they the ones showing velocity improvement?

## 5. LeadReach Agent Integration

### Atlas — Velocity Orchestration
Atlas orchestrates the velocity flywheel by:
- Triggering acceleration plays when bottleneck conditions are detected
- Coordinating multi-threaded outreach across the buying committee
- Managing handoff velocity between SDR and AE (measuring time-to-handoff)
- Balancing rep workload to prevent velocity-killing overload

### Scout — Velocity Intelligence
Scout accelerates deals by:
- Identifying trigger events that create urgency (funding, compliance deadlines, competitive losses)
- Researching buying committee members to enable multi-threading
- Detecting competitor activity that may slow deals
- Surfacing internal champions at accounts where deals are stalled

### Forge — Velocity Enrichment
Forge reduces friction by:
- Pre-populating deal records with complete stakeholder maps
- Providing technographic data that accelerates technical evaluation
- Enriching procurement contacts so proposals reach the right person immediately
- Identifying integration requirements early to prevent late-stage technical delays

### Sage — Velocity Analytics
Sage is the analytical engine of velocity optimization:
- Calculating drag coefficients by stage and ICP segment
- Building predictive models for deal cycle time based on early signals
- Identifying which acceleration plays have the highest velocity impact
- Correlating velocity with win rate to find the optimal speed-quality balance
- Generating velocity dashboards and trend reports

### Judge — Velocity Quality Assurance
Judge ensures velocity improvements don't sacrifice quality:
- Auditing accelerated deals to confirm stage criteria are still met
- Flagging deals where velocity increased but buyer engagement didn't (suggesting stage skipping)
- Measuring win rate changes in accelerated vs. non-accelerated cohorts
- Validating that forecast accuracy isn't degrading due to velocity interventions

### Bard — Velocity Communication
Bard supports velocity by:
- Generating urgency-creating content (ROI analyses, competitive comparisons, case studies)
- Writing follow-up emails that maintain momentum without being pushy
- Creating stakeholder-specific business cases that accelerate internal alignment
- Drafting POC success criteria templates that keep evaluations on track

### Flow — Velocity Automation
Flow removes manual friction by:
- Automating meeting scheduling (eliminating the email back-and-forth)
- Auto-advancing deals when buyer actions are detected
- Triggering nurture sequences for stalled deals
- Routing procurement documents and tracking their status
- Syncing activity data across tools to eliminate information gaps

### Echo — Velocity Monitoring
Echo provides real-time velocity signals:
- Momentum score alerts (declining, flat, accelerating)
- Stage duration warnings (approaching SLA, exceeding SLA)
- Engagement drop-off detection (buyer went dark)
- Champion job change alerts (deal at risk of restart)
- Competitor mention alerts (deal may slow while buyer evaluates alternatives)

## 6. Key Metrics and KPIs

### Velocity Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| Pipeline Velocity | Increasing QoQ | (Deals x Deal Size x Win Rate) / Cycle Days |
| Average Cycle Time | Decreasing QoQ | Median days from Stage 1 to Closed Won |
| Stage Duration (per stage) | Within SLA | Median days per stage by ICP segment |
| Drag Coefficient | <1.5x | Actual duration / Expected duration |
| Momentum Score (avg) | >60 | Weighted average of active deals |

### Acceleration Metrics
| Metric | Target | Calculation |
|--------|--------|-------------|
| Time to First Meeting | <7 business days | Days from qualification to discovery |
| POC Duration | <14 days (MM), <30 days (ENT) | Days from POC start to success criteria met |
| Proposal to Close | <30 days (MM), <45 days (ENT) | Days from proposal to signed contract |
| Time to Multi-Thread | <Stage 3 | Stage at which 2+ contacts are engaged |

### Quality Guardrails
| Metric | Target | Calculation |
|--------|--------|-------------|
| Velocity vs. Win Rate Correlation | Positive or neutral | Correlation between cycle time and win rate |
| Accelerated Deal Win Rate | >80% of baseline | Win rate for accelerated deals / Overall win rate |
| Stage Accuracy (accelerated) | >85% | Correctly staged accelerated deals / Total accelerated |
| Forecast Accuracy | +/- 10% | (Forecast - Actual) / Actual |

## 7. Best Practices

### Practice 1: Measure Velocity by Segment, Not in Aggregate
Enterprise, mid-market, and SMB deals have fundamentally different velocity profiles. Averaging them together masks problems. Track velocity separately for each ICP segment, geography, and product line.

### Practice 2: Focus on the Biggest Bottleneck First
The Theory of Constraints applies: improving a non-bottleneck stage has zero impact on overall velocity. Identify the stage with the highest drag coefficient and optimize it first.

### Practice 3: Accelerate Buyer Actions, Not Seller Activities
Sending more emails doesn't accelerate deals. Getting the buyer to take the next step does. Every acceleration play should target a specific buyer action: schedule a meeting, agree to a POC, introduce the CFO, sign the contract.

### Practice 4: Create Legitimate Urgency
False urgency ("This discount expires Friday!") destroys trust. Legitimate urgency comes from the buyer's own timeline: regulatory deadlines, budget cycle end, competitive threat, executive mandate. Scout identifies these and Bard frames them appropriately.

### Practice 5: Multi-Thread Every Stage 3+ Deal
Single-threaded deals are fragile. One person's vacation, departure, or priority shift can stall a deal for weeks. By Stage 3, at least 2 stakeholders should be engaged; by Stage 5, 3+ stakeholders.

### Practice 6: Pre-Negotiate Common Contract Terms
Contract negotiation is the most predictable velocity killer in enterprise deals. Pre-negotiate MSA terms (data processing, liability caps, indemnification) and offer a standard contract that covers 80% of redlines.

### Practice 7: Timebox Every POC
Open-ended evaluations never end. Every POC should have a start date, end date, and success criteria agreed in writing before it begins. If the buyer won't agree to success criteria, they're not serious about evaluating.

### Practice 8: Track Momentum, Not Just Stage
A deal in Stage 5 with declining momentum is at more risk than a deal in Stage 3 with accelerating momentum. Monitor engagement signals weekly and intervene when momentum declines, regardless of stage.

## 8. Common Mistakes and Anti-Patterns

### Anti-Pattern 1: Speed Over Quality
Pushing deals through stages faster by skipping qualification steps. This increases cycle time on average because unqualified deals consume resources and eventually close-lost after extended evaluation. Counter: Judge audits every accelerated deal for stage criteria compliance.

### Anti-Pattern 2: One-Size-Fits-All Velocity Targets
Setting the same cycle time target for all deal sizes and segments. A $50K SMB deal should close in 30 days; a $500K enterprise deal may take 180 days. Counter: Segment velocity targets by ICP tier and deal size band.

### Anti-Pattern 3: Ignoring the Buyer's Process
Accelerating the seller's process without understanding the buyer's internal decision timeline. If the buyer's board only meets quarterly to approve purchases, no amount of seller urgency will close the deal faster. Counter: Map the buyer's decision process early and align your timeline to it.

### Anti-Pattern 4: Micromanaging Rep Activity
Believing that more calls and emails per day equal faster deals. Activity without direction creates noise, not velocity. Counter: Focus on the quality and relevance of touches, not the quantity. One well-researched meeting with the right stakeholder advances a deal more than ten generic follow-ups.

### Anti-Pattern 5: Neglecting Post-Sale Velocity Impact
Deals that close fast but have poor onboarding experience lead to churn, which negates the velocity improvement. Counter: Track time-to-value alongside cycle time. A deal that takes 10 days longer to close but achieves value in 30 days (vs. 90 days) is better for long-term revenue.

### Anti-Pattern 6: Treating All Stalls Equally
A deal stalled because the buyer is on vacation is very different from a deal stalled because the budget was reallocated. Counter: Categorize stalls by type and apply the appropriate intervention. Not every stall requires aggressive action.

### Anti-Pattern 7: Velocity Theater
Implementing velocity dashboards and plays without changing actual behavior. Dashboards that nobody acts on are theater. Counter: Tie velocity metrics to manager 1:1s and forecast calls. Every stalled deal should have a documented intervention plan.

## 9. Technology and Tool Requirements

### CRM with Velocity Analytics
- Salesforce with custom velocity dashboards, or HubSpot with pipeline velocity reports
- Must support stage duration tracking and custom momentum scoring
- API integration with LeadReach agent ecosystem

### Conversation Intelligence
- Gong, Chorus, or equivalent
- Analyzes call frequency, talk ratio, next steps commitment
- Provides momentum signals based on conversation content

### Sales Engagement Platform
- Outreach, Salesloft, or equivalent
- Measures reply rates, meeting booked rates, and sequence velocity
- A/B test different outreach cadences for velocity impact

### Buyer Intent and Engagement
- 6sense, Demandbase, or Bombora for buyer intent signals
- Tracks content consumption, website visits, and research activity
- Provides early velocity signals before direct buyer engagement

### Document Tracking
- DocuSign CLM, PandaDoc, or equivalent
- Tracks proposal open rates, time spent per section, and sharing behavior
- Provides velocity signals during negotiation phase

### Calendar and Scheduling
- Chili Piper, Calendly, or equivalent
- Eliminates scheduling friction (the #1 mechanical velocity killer)
- Must integrate with CRM for automatic activity logging

## 10. Integration with Other Methodologies

### Pipeline Management
Pipeline management provides the stage framework and historical data that velocity optimization uses for diagnosis. Velocity is a property of the pipeline — you can't optimize what you can't measure.

### Data Enrichment
Enrichment accelerates deals by providing the seller with context that enables faster, more relevant conversations. A rep who knows the prospect's tech stack, recent triggers, and decision-maker map can skip preliminary discovery and get to solution fit faster.

### Lead Qualification Frameworks
MEDDIC and BANT provide the structure for qualifying deals quickly. A well-qualified deal moves faster because the seller knows exactly what the buyer needs and who needs to be involved.

### ICP Design & Scoring
Deals with high ICP scores close faster because the solution fits better, the buyer sees value sooner, and there are fewer objections. ICP quality is a velocity input.

### Account-Based Marketing
ABM creates velocity by warming accounts before sales engagement. A prospect who has consumed 5 pieces of content is ready for a different conversation than one encountering the brand for the first time.

### Outreach Methodology
Outreach is the first velocity gate. Slow time-to-first-meeting cascades into slow overall cycle time. Optimizing outreach reply rates and meeting booked rates directly accelerates pipeline velocity.

## 11. Case Study Examples

### Case Study 1: SaaS Company — POC Timeboxing
A project management SaaS company had an average POC duration of 67 days with only 28% conversion to closed-won. Diagnosis: POCs had no success criteria or time limits. Intervention: Implemented mandatory 14-day POC with pre-defined success criteria. Results: POC duration dropped to 16 days, POC-to-close conversion increased to 52%, and overall cycle time decreased from 94 to 61 days.

### Case Study 2: Cybersecurity Vendor — Procurement Fast-Path
An endpoint security vendor's enterprise deals spent an average of 52 days in procurement (Stage 5→6). Diagnosis: Legal and security reviews were initiated sequentially rather than in parallel, and standard MSA terms were not pre-negotiated. Intervention: Pre-negotiated MSA covering 85% of common redlines; provided completed security questionnaire (SOC 2, ISO 27001) with every proposal; initiated legal and security review in parallel. Results: Procurement duration dropped to 31 days; enterprise close rate increased from 19% to 27%.

### Case Study 3: Data Platform — Multi-Threading Velocity
A data analytics platform discovered that single-threaded deals (1 contact engaged) took 143 days to close, while multi-threaded deals (3+ contacts engaged) took 78 days. Intervention: Required multi-threading by Stage 3; Forge auto-identified additional stakeholders; Atlas orchestrated parallel engagement sequences. Results: Average cycle time decreased from 112 to 84 days; deal survival rate (deals not going dark) increased from 62% to 84%.

### Case Study 4: Fintech — Champion Fortification
A fintech company lost 3 deals worth $1.2M total when champions left their companies mid-cycle. Intervention: Implemented champion fortification play — every Stage 3+ deal must have 2+ engaged stakeholders; Echo monitors LinkedIn for champion job changes; when detected, Atlas triggers re-engagement with remaining stakeholders. Results: No deals lost to champion departure in the following two quarters; average cycle time for affected deals decreased because multiple stakeholders were already up to speed.

## 12. Templates and Frameworks

### Velocity Diagnostic Template
```
VELOCITY DIAGNOSTIC — [ICP Segment] [Quarter]

BASELINE METRICS:
  Pipeline Velocity:        $________/day
  Average Cycle Time:       ________ days
  Win Rate:                 ________%

STAGE DURATION ANALYSIS:
  Stage 1 → 2:  ________ days  (SLA: _____)  Drag: _____x
  Stage 2 → 3:  ________ days  (SLA: _____)  Drag: _____x
  Stage 3 → 4:  ________ days  (SLA: _____)  Drag: _____x
  Stage 4 → 5:  ________ days  (SLA: _____)  Drag: _____x
  Stage 5 → 6:  ________ days  (SLA: _____)  Drag: _____x
  Stage 6 → 7:  ________ days  (SLA: _____)  Drag: _____x

BOTTLENECK RANKING (by drag coefficient):
  1. _________________________________ (Drag: _____x)
  2. _________________________________ (Drag: _____x)
  3. _________________________________ (Drag: _____x)

MOMENTUM ANALYSIS:
  Deals with declining momentum:  ________% of active pipeline
  Deals with flat momentum:        ________% of active pipeline
  Deals with accelerating momentum: ________% of active pipeline

RECOMMENDED INTERVENTIONS:
  1. _________________________________
  2. _________________________________
  3. _________________________________

EXPECTED VELOCITY IMPACT:
  Current: $________/day
  Target:  $________/day
  Lift:    ________%
```

### Acceleration Play Card Template
```
PLAY: [Play Name]

TRIGGER:
  Condition: _________________________________
  Detection: Auto / Manual
  Responsible Agent: __________________

ACTIONS (in sequence):
  1. _________________________________
  2. _________________________________
  3. _________________________________
  4. _________________________________
  5. _________________________________

ESCALATION:
  If no improvement in ___ days → escalate to ___________

EXPECTED IMPACT:
  Metric: _________________________________
  Current baseline: ________________________
  Expected improvement: ____________________
  Confidence: High / Medium / Low

MEASUREMENT:
  Primary KPI: ____________________________
  Secondary KPI: __________________________
  Quality guardrail: _______________________

PLAY HISTORY:
  Times executed: _______
  Average impact: _______
  Win rate impact: ______
```

### Momentum Score Calculation
```typescript
interface MomentumSignals {
  emailRepliesLast14Days: number;
  meetingsLast14Days: number;
  contentViewsLast14Days: number;
  proposalEngagementLast14Days: number;  // opens, time spent
  daysSinceLastActivity: number;
  stakeholderEngagementCount: number;    // unique contacts active
  championStatus: 'active' | 'fading' | 'departed' | 'unknown';
}

function calculateMomentumScore(signals: MomentumSignals): number {
  let score = 0;

  // Email engagement (0-20 points)
  score += Math.min(signals.emailRepliesLast14Days * 5, 20);

  // Meeting engagement (0-25 points)
  score += Math.min(signals.meetingsLast14Days * 12, 25);

  // Content engagement (0-15 points)
  score += Math.min(signals.contentViewLast14Days * 3, 15);

  // Proposal engagement (0-15 points)
  score += Math.min(signals.proposalEngagementLast14Days * 5, 15);

  // Recency penalty (0 to -20 points)
  if (signals.daysSinceLastActivity > 14) score -= 20;
  else if (signals.daysSinceLastActivity > 7) score -= 10;

  // Multi-threading bonus (0-15 points)
  score += Math.min(signals.stakeholderEngagementCount * 5, 15);

  // Champion status adjustment
  if (signals.championStatus === 'departed') score -= 30;
  else if (signals.championStatus === 'fading') score -= 15;

  return Math.max(0, Math.min(100, score));
}
```

### Velocity Improvement Tracking Template
```
VELOCITY IMPROVEMENT LOG — [Quarter]

INTERVENTION: _________________________________
DATE INITIATED: ________________________________
ICP SEGMENT: ___________________________________

BEFORE:
  Cycle Time: ___________ days
  Stage Duration (bottleneck): ___________ days
  Win Rate: ___________%
  Pipeline Velocity: $___________/day

AFTER (measured ___ weeks post-intervention):
  Cycle Time: ___________ days
  Stage Duration (bottleneck): ___________ days
  Win Rate: ___________%
  Pipeline Velocity: $___________/day

CHANGE:
  Cycle Time: ___________% (improvement)
  Stage Duration: ___________% (improvement)
  Win Rate: ___________% (change)
  Pipeline Velocity: ___________% (improvement)

QUALITY CHECK:
  Stage accuracy maintained? Yes / No
  Forecast accuracy maintained? Yes / No
  Deal quality maintained? Yes / No

STATUS: Codified as standard play / Needs refinement / Abandoned
```

## 13. References and Further Reading

1. **"The JOLT Effect"** by Matthew Dixon — Research on how high-performing sellers create momentum and overcome buyer indecision, the #1 velocity killer
2. **"Speed Reading"** by Jacco van der Kooij — SaaS-specific framework for understanding and optimizing sales velocity
3. **"The Sales Acceleration Formula"** by Mark Roberge — Data-driven approaches to reducing cycle time at scale
4. **"Predictable Revenue"** by Aaron Ross — Pipeline specialization and handoff velocity between SDR and AE roles
5. **"MEDDIC"** framework by John McMahon — Qualification rigor that eliminates velocity-killing re-qualification cycles
6. **"Cracking the Sales Management Code"** by Jason Jordan — Activity management and its relationship to pipeline velocity
7. **TOPO Research on Sales Velocity** — Benchmark data on cycle times by segment, price point, and vertical
8. **"The Challenger Customer"** by Dixon and Adamson — Multi-threading strategies that accelerate buying committee alignment
9. **Gartner B2B Buying Journey Research** — Understanding the 6-10 stakeholder reality and its velocity implications
10. **"Revenue Operations"** by Stephen Diorio — Systems-level approach to removing organizational friction that slows deals
