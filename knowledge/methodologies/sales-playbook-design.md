---
title: "Sales Playbook Design — Building Agent-Driven B2B Sales Systems"
category: methodology
grade: A
last_reviewed: "2026-07-03"
tags: [sales-playbook, play-design, sales-process, pipeline-management, agent-driven-selling, sequences, deal-strategy, b2b-sales]
---

# Sales Playbook Design — Building Agent-Driven B2B Sales Systems

## Executive Summary

A sales playbook is not a collection of scripts and call tracks stored in a shared drive that nobody reads. A production-grade sales playbook is a **living, executable system** that codifies the repeatable decisions your sales team must make — from lead routing to deal strategy to close — and makes those decisions operational through the LeadReach agent pipeline.

Research from the Sales Management Association (2025) shows that organizations with structured playbooks achieve 33% higher win rates and 28% faster ramp times for new reps. Yet most B2B playbooks fail because they are either too generic ("be consultative"), too rigid ("say exactly these words"), or too disconnected from the tools reps actually use. The LeadReach approach solves all three problems: playbooks are specific enough to guide decisions, flexible enough to adapt to context, and directly integrated into the 8-agent pipeline so that playbook logic is executed automatically by Atlas, Judge, Bard, and Flow.

This methodology covers the complete lifecycle of a sales playbook: how to design it from historical win data, how to encode it as executable logic for the agent pipeline, how to measure its effectiveness, and how to iterate based on outcomes. Every play in the playbook maps to a specific pipeline stage, a specific agent, and a specific set of measurable outcomes.

## Core Methodology

### The Playbook Architecture: Plays, Sequences, and Rules

A LeadReach sales playbook consists of three layers:

**Layer 1: Plays** — A play is a strategic unit that defines what to do in a specific selling situation. Each play specifies the triggering condition, the objective, the key actions, the talking points, and the success criteria. Plays are the "what" and "why."

**Layer 2: Sequences** — A sequence is the tactical execution of a play. It defines the specific touches (email, call, LinkedIn, content) in a specific order with specific timing and specific messaging. Sequences are the "when" and "how."

**Layer 3: Rules** — Rules are the conditional logic that governs when plays and sequences are activated, modified, or terminated. Rules encode the decision-making that experienced reps do instinctively. Rules are the "if-then" that makes the playbook adaptive.

### Play Design Framework

Every play in the LeadReach playbook follows a standard structure:

#### Play Specification Template

```typescript
interface Play {
  id: string;
  name: string;                    // e.g., "Competitive Displacement — ZoomInfo"
  description: string;             // 2-3 sentence summary
  trigger_conditions: Condition[]; // What activates this play
  target_segment: {
    icp_grade: string;             // A, B, C, or D
    deal_size_range: [number, number];
    industry?: string[];
    geography?: string[];
    competitor?: string;
  };
  objective: string;               // What success looks like
  key_actions: Action[];           // Ordered list of actions
  talking_points: string[];        // Core messages
  objection_handling: {            // Objections this play commonly encounters
    category: string;
    reframe: string;
  }[];
  success_criteria: {              // How we know the play worked
    metric: string;
    target: number;
    timeframe: string;
  };
  exit_conditions: Condition[];    // When to stop this play
  owner: string;                   // Role responsible (SDR, AE, CSM)
  agents_involved: string[];       // Which LeadReach agents execute this play
  sequence_id: string;             // Linked sequence
  version: number;
  last_updated: string;
}
```

### The Seven Core Plays

Based on analysis of high-performing B2B sales organizations, LeadReach defines seven core plays that cover the full selling lifecycle. Each organization should customize these plays for their specific market, ICP, and competitive landscape.

#### Play 1: ICP-Perfect Inbound (The "Hot Lead" Play)

**Trigger**: A lead with ICP Grade A or B submits an inbound form, requests a demo, or responds to outreach.

**Objective**: Convert the inbound lead to a qualified opportunity within 5 business days.

**Key Actions**:
1. Atlas routes the lead to the SDR team within 5 minutes (SLA)
2. Judge scores the lead and predicts likely objections
3. SDR makes first call within 1 hour (Grade A) or 4 hours (Grade B)
4. Bard auto-generates a personalized follow-up email if call goes to voicemail
5. Sage researches the prospect's recent activity and competitive context
6. SDR uses the research to personalize the discovery call
7. If qualified, SDR books a meeting with the AE within 48 hours

**Talking Points**:
- Reference the specific action that triggered the inbound (form submission, content download)
- Connect to a relevant pain point identified by Sage
- Share a micro case study from the same industry vertical

**Success Criteria**:
- Speed-to-lead: <1 hour for Grade A, <4 hours for Grade B
- Discovery-to-demo rate: ≥ 60%
- Inbound-to-opportunity rate: ≥ 40%

#### Play 2: Targeted Outbound (The "Hunting" Play)

**Trigger**: Scout discovers a prospect that matches ICP Grade A or B but has not engaged inbound.

**Objective**: Generate a response from a cold prospect within 14 days.

**Key Actions**:
1. Scout surfaces the prospect with full firmographic and intent data
2. Forge enriches the profile with verified contacts and tech stack
3. Judge scores the prospect and selects the appropriate qualification framework
4. Bard composes a 5-touch multi-channel sequence (3 emails, 1 LinkedIn, 1 call)
5. Flow executes the sequence with the configured cadence
6. On response, Atlas routes to SDR for immediate follow-up
7. On no response after sequence completion, Flow moves to a 30-day nurture track

**Talking Points**:
- Lead with a specific observation about the prospect (trigger event, hiring signal, tech change)
- Connect the observation to a pain point your solution addresses
- CTA: 15-minute discovery call or specific content offer

**Success Criteria**:
- Sequence response rate: ≥ 8%
- Response-to-meeting rate: ≥ 30%
- Cold-to-opportunity rate: ≥ 3%

#### Play 3: Competitive Displacement (The "Wedge" Play)

**Trigger**: Judge identifies that a prospect is using a specific competitor and has a detectable gap (contract renewal, feature gap, poor review pattern).

**Objective**: Position LeadReach as the alternative during the prospect's evaluation window.

**Key Actions**:
1. Sage researches the competitor's weaknesses relative to your solution
2. Judge identifies the likely trigger for switching (contract renewal, feature gap, support issue)
3. Bard composes a competitive-specific sequence that acknowledges the incumbent and introduces the wedge
4. Flow times the sequence to coincide with the contract renewal window
5. SDR offers a side-by-side comparison or proof-of-concept
6. AE presents a migration plan that reduces switching risk

**Talking Points**:
- Acknowledge what the competitor does well (builds trust)
- Highlight the specific gap relevant to the prospect's situation
- Offer a low-risk transition path (parallel run, phased migration)

**Success Criteria**:
- Competitive win rate: ≥ 40% (against the specific competitor)
- Time in competitive deal: <90 days average
- Displacement-to-expansion rate: ≥ 25% (customers who switched expand within 12 months)

#### Play 4: Multi-Thread Expansion (The "Land and Expand" Play)

**Trigger**: An existing customer has adopted the initial use case and shows signals of expansion potential (new department hiring, geographic expansion, additional tech stack adoption).

**Objective**: Expand ARR from the existing account by 50%+ within 12 months.

**Key Actions**:
1. Echo identifies expansion signals from usage data and public activity
2. Sage researches new stakeholders and use cases within the account
3. Judge maps the buying committee for the expansion (may differ from initial purchase)
4. Bard crafts an expansion-specific message for each new stakeholder
5. Flow enrolls the account in an expansion sequence
6. AE runs a business review that frames the expansion in terms of additional ROI

**Talking Points**:
- Lead with the value already delivered (quantified)
- Frame the expansion as accelerating existing results, not starting over
- Offer executive-to-executive introduction for new stakeholders

**Success Criteria**:
- Expansion pipeline generated: ≥ 50% of eligible accounts
- Expansion close rate: ≥ 40%
- Net Revenue Retention (NRR): ≥ 120%

#### Play 5: Stalled Deal Reactivation (The "Wake the Dead" Play)

**Trigger**: A deal in the pipeline has had no activity for 14+ days and no next meeting scheduled.

**Objective**: Re-engage the prospect and either advance the deal or formally disqualify it within 10 business days.

**Key Actions**:
1. Echo identifies the stalled deal from CRM activity data
2. Sage researches what may have changed (leadership changes, competitor moves, budget shifts)
3. Bard composes a re-engagement message that provides new value (relevant news, new feature, case study)
4. Flow sends the re-engagement touch and monitors for response
5. If response received: SDR re-qualifies and hands to AE
6. If no response after 3 touches over 10 days: Judge formally disqualifies the deal

**Talking Points**:
- Lead with new information not available during the previous conversation
- Reference the original pain point and ask if it's still a priority
- Offer a specific, low-commitment next step (15-minute call, product update demo)

**Success Criteria**:
- Stalled deal reactivation rate: ≥ 20%
- Avg. days from stall to re-engagement: <7 days
- Reactivated deal close rate: ≥ 25%

#### Play 6: Executive Engagement (The "Up-Level" Play)

**Trigger**: A deal is progressing but the Economic Buyer has not been engaged. Deal value exceeds $100K ACV.

**Objective**: Secure a meeting with the Economic Buyer within 10 business days.

**Key Actions**:
1. Judge identifies that the EB is missing from the deal's stakeholder map
2. Sage researches the EB's priorities, recent public statements, and professional background
3. Bard crafts an executive-level message (different tone, different content than manager-level)
4. AE or sales leader sends the message directly (not SDR)
5. If the champion can facilitate an introduction, Bard provides champion enablement materials
6. Flow tracks the executive touch and schedules follow-up

**Talking Points**:
- Frame the conversation around business outcomes, not features
- Reference the EB's known priorities (from Sage research)
- Offer a specific, time-bounded meeting agenda

**Success Criteria**:
- EB meeting secured: ≥ 35% of attempts
- EB-engaged deal close rate: ≥ 45% (vs. 15% without EB engagement)
- Time from play activation to EB meeting: <10 days

#### Play 7: Churn Prevention (The "Save" Play)

**Trigger**: A customer shows churn signals (declining usage, support ticket spike, key contact departure, NPS drop).

**Objective**: Identify and resolve the root cause of dissatisfaction, retaining the account.

**Key Actions**:
1. Echo detects churn signals from product usage data and support interactions
2. Sage researches external factors (competitor outreach, leadership changes, budget cuts)
3. Judge scores the churn risk (low/medium/high) based on signal severity
4. CSM or AE initiates an outreach based on churn risk level:
   - Low: Automated check-in email from Flow
   - Medium: Personalized outreach from CSM
   - High: Executive-to-executive call
5. Bard prepares save messaging that acknowledges the issue and proposes a resolution

**Talking Criteria**:
- Acknowledge the issue directly without being defensive
- Propose a specific remediation plan with a timeline
- Offer an escalation path if the standard resolution doesn't satisfy

**Success Criteria**:
- Churn prevention rate: ≥ 60% of high-risk accounts retained
- Time from churn signal to outreach: <48 hours
- Gross Revenue Retention (GRR): ≥ 90%

## Implementation Guide

### Step 1: Audit Historical Wins and Losses

Before designing plays, analyze your last 12 months of closed deals:
1. Export all won and lost deals from CRM with full metadata (ICP score, deal stage durations, stakeholder count, competitor, objection types)
2. Identify the 5 most common win patterns and the 5 most common loss patterns
3. Map each pattern to a play type from the seven core plays above
4. Quantify the pattern: What % of deals follow this pattern? What's the average ACV? What's the win rate?

**Action**: Sage conducts the win/loss analysis. Echo provides the historical data. Judge validates the pattern significance (statistical significance requires minimum 30 deals per pattern).

### Step 2: Customize the Seven Plays

For each of the seven core plays, customize for your organization:
1. **Trigger conditions**: What specific signals in your CRM and data activate this play?
2. **Target segment**: Which ICP grades, deal sizes, and industries?
3. **Key actions**: What specific steps does your sales process require?
4. **Talking points**: What messages resonate in your market?
5. **Success criteria**: What are your actual benchmarks?

**Action**: Atlas facilitates the play customization session with sales leadership. Output: 7 customized play specifications stored in the playbook configuration.

### Step 3: Design Sequences for Each Play

For each play, Bard designs the corresponding sequence:
1. **Channel mix**: Email, phone, LinkedIn, content — which channels and in what proportion?
2. **Touch count**: How many touches over what period? (Typical: 5-12 touches over 2-4 weeks)
3. **Cadence**: What's the interval between touches? (Typical: 1-3 days for active, 7-14 days for nurture)
4. **Messaging arc**: How does the message evolve across touches? (Hook → Value → Social Proof → CTA → Break-up)
5. **Branching logic**: What happens on positive response? Negative response? No response?

**Action**: Bard generates sequence templates. Flow validates the sequence logic (no impossible timing, no orphan branches). Judge validates the sequence against compliance rules.

### Step 4: Encode Rules for Automation

Rules make the playbook adaptive. Encode the decision logic that experienced reps apply instinctively:

**Routing Rules:**
```
IF icp_grade == "A" AND intent_score > 70 THEN route_to = "enterprise_ae"
IF icp_grade == "B" AND deal_size < 50000 THEN route_to = "smb_ae"
IF icp_grade == "C" AND intent_score > 50 THEN route_to = "sdr_nurture"
IF icp_grade == "D" OR icp_grade == "F" THEN route_to = "suppress"
```

**Escalation Rules:**
```
IF deal_stage == "proposal" AND days_in_stage > 14 THEN trigger_play = "stalled_deal_reactivation"
IF deal_size > 100000 AND economic_buyer_engaged == false THEN trigger_play = "executive_engagement"
IF competitor_identified AND deal_stage == "evaluation" THEN trigger_play = "competitive_displacement"
```

**Sequence Modification Rules:**
```
IF prospect_opens_email AND clicks_pricing_page THEN accelerate_sequence(2x)
IF prospect_unsubscribes THEN pause_sequence AND notify_sdr
IF prospect_replies_positively THEN end_sequence AND route_to_sdr_immediately
IF sequence_complete AND no_response THEN move_to_nurture_track
```

**Action**: Atlas and Judge encode the rules into the playbook configuration. Flow validates rule logic and tests with historical data.

### Step 5: Deploy, Measure, and Iterate

Deploy the playbook in a controlled rollout:
1. **Week 1-2**: Deploy to a pilot team (2-3 reps). Monitor adherence and outcomes.
2. **Week 3-4**: Expand to half the team. Compare pilot team vs. control group.
3. **Week 5-8**: Full rollout. Measure against pre-playbook baseline.

**Action**: Echo tracks all metrics. Weekly review with sales leadership. Monthly playbook refinement cycle.

## Scoring Frameworks & Criteria

### Play Effectiveness Scoring

Each play is scored on four dimensions:

| Dimension | Weight | Measurement | Target |
|-----------|--------|-------------|--------|
| Activation rate | 25% | % of eligible deals where the play was triggered | ≥ 80% |
| Execution adherence | 25% | % of triggered plays that followed the defined actions | ≥ 70% |
| Outcome achievement | 30% | % of plays that met the success criteria | ≥ 40% |
| Time efficiency | 20% | Actual time vs. target time for the play's objective | ≤ 1.3× target |

**Play Effectiveness Score:**

```
play_score = (activation_rate × 0.25) +
             (execution_adherence × 0.25) +
             (outcome_achievement × 0.30) +
             (time_efficiency × 0.20)
```

**Play Grade:**
- 80-100: High-performing play — maintain and replicate
- 60-79: Performing play — optimize specific dimensions
- 40-59: Underperforming play — redesign or deprecate
- 0-39: Failing play — immediately deprecate and replace

### Sequence Performance Metrics

| Metric | Target | Calculation |
|--------|--------|-------------|
| Sequence open rate | ≥ 45% | Opens / Emails sent |
| Sequence reply rate | ≥ 8% | Replies / Emails sent |
| Sequence meeting rate | ≥ 3% | Meetings booked / Prospects enrolled |
| Sequence completion rate | 40-60% | Completed sequences / Enrolled prospects |
| Opt-out rate | ≤ 2% | Unsubscribes / Emails sent |
| Positive reply rate | ≥ 50% | Positive replies / Total replies |
| Time to first response | ≤ 5 days | Avg. days from first touch to first reply |

### Pipeline Health Metrics

| Metric | Target | Significance |
|--------|--------|-------------|
| Pipeline coverage ratio | 3-4× quota | Pipeline value / Quota target |
| Stage conversion rates | Progressive decay | Each stage converts at 30-60% |
| Average deal age | By stage benchmarks | Detects stalls early |
| Deal velocity | Increasing QoQ | ACV × Win Rate × (1 / Cycle Length) |
| Forecast accuracy | ±10% | Forecast vs. actual closed revenue |

## LeadReach Agent Integration

### Atlas (Strategic Orchestrator)

Atlas is the playbook's central nervous system. It:
1. Classifies the selling situation and selects the appropriate play
2. Orchestrates the sequence of agent invocations for the selected play
3. Adapts mid-play if conditions change (e.g., competitor detected mid-sequence)
4. Ensures handoffs between agents are clean and context-preserving
5. Enforces playbook rules and escalation logic

### Scout (Discovery)

Scout feeds the playbook by:
1. Discovering new prospects that match play trigger conditions
2. Identifying trigger events that activate specific plays (funding → outbound play, competitor contract renewal → displacement play)
3. Surfacing expansion signals from existing accounts for the land-and-expand play
4. Detecting churn signals for the save play

### Forge (Enrichment)

Forge enables the playbook by:
1. Enriching prospect profiles with the data needed for play selection and routing
2. Verifying contact information for sequence targeting
3. Detecting technographic signals that indicate competitive displacement opportunities
4. Confirming firmographic data that validates play trigger conditions

### Sage (Research)

Sage deepens the playbook by:
1. Researching competitor intelligence for the displacement play
2. Analyzing account expansion opportunities for the land-and-expand play
3. Preparing executive-level briefing materials for the up-level play
4. Investigating root causes of churn signals for the save play
5. Compiling case studies and social proof for objection handling within each play

### Judge (Qualification & Scoring)

Judge governs the playbook by:
1. Scoring leads to determine which play applies (Grade A → inbound play, cold Grade A → outbound play)
2. Detecting trigger conditions for play activation
3. Predicting likely objections and recommending play-specific reframes
4. Identifying stalled deals and recommending the reactivation play
5. Evaluating play effectiveness over time and recommending adjustments

### Bard (Outreach Composition)

Bard executes the playbook by:
1. Composing sequence templates for each play
2. Personalizing messaging based on play-specific talking points and prospect context
3. Preemptively addressing play-specific objections in outreach
4. Generating champion enablement materials for the executive engagement play
5. Creating re-engagement messages for the stalled deal play

### Flow (Pipeline & Sequencing)

Flow operationalizes the playbook by:
1. Enrolling prospects in the correct sequence based on the selected play
2. Executing touches at the configured cadence
3. Applying branching logic based on prospect responses
4. Escalating to human intervention when rules dictate
5. Tracking sequence metrics and feeding them back to Echo

### Echo (Analytics & Reporting)

Echo optimizes the playbook by:
1. Measuring play effectiveness scores for each play
2. Tracking sequence performance metrics
3. Identifying plays that are underperforming and need redesign
4. Detecting emerging patterns that may require new plays
5. Generating the weekly playbook performance report
6. Recommending A/B tests for underperforming sequences

## Best Practices & Anti-Patterns

### Best Practices

1. **Build plays from data, not opinions.** Every play should trace to a documented win/loss pattern. If you can't point to at least 30 deals that follow a pattern, you don't have a play — you have a hypothesis.

2. **Keep plays specific, not generic.** "Competitive Displacement — ZoomInfo" is a play. "Competitive Displacement" is a category. Specific plays produce specific actions; generic categories produce generic results.

3. **Measure adherence before measuring outcomes.** If reps aren't following the playbook, you can't evaluate whether the playbook works. Track execution adherence first (target: ≥ 70%).

4. **Iterate monthly, not quarterly.** Market conditions change faster than quarterly review cycles. Monthly playbook refinements keep plays aligned with reality.

5. **Design for the worst day, not the best.** Playbooks matter most when deals go sideways. Build robust branching logic and escalation rules that guide reps through difficult situations, not just the happy path.

6. **Separate strategy from execution.** Plays define the strategy (what to do and why). Sequences define the execution (when and how). Strategy changes slowly; execution changes often. Separating them allows you to A/B test sequences without rewriting the play.

7. **Make the playbook the path of least resistance.** If the playbook requires more effort than winging it, reps will wing it. The agent pipeline must make following the playbook easier than not following it.

8. **Include exit conditions.** Every play must define when to stop. Endless sequences annoy prospects and waste resources. If a play isn't working after the defined period, exit and try a different approach.

### Anti-Patterns

1. **The Encyclopedic Playbook.** 200 pages of plays that nobody can navigate. A playbook with 50 plays is a reference manual, not a decision-making tool. Keep it to 7-12 plays that cover 80% of selling situations.

2. **The Script Playbook.** Word-for-word scripts that leave no room for judgment. Reps sound robotic and can't adapt when the prospect goes off-script. Provide talking points and frameworks, not scripts.

3. **The Unmeasured Playbook.** A playbook that is deployed but never evaluated. Without measurement, you can't distinguish effective plays from ineffective ones. Every play must have defined success criteria and a measurement plan.

4. **The Rigid Playbook.** Plays that cannot be modified without a committee meeting. The market moves faster than committees. Empower frontline managers to adjust sequences within 24 hours based on real-time feedback.

5. **The Generic Playbook.** Plays that apply equally to every prospect regardless of ICP grade, deal size, or industry. A Grade A enterprise prospect requires a fundamentally different approach than a Grade C SMB lead. Generic plays produce generic results.

6. **The Playbook Without Rules.** Plays and sequences without conditional logic. Every prospect interaction is different; without rules for branching, escalation, and exit, the playbook produces inappropriate actions.

7. **The Shelf Playbook.** A beautifully designed playbook that lives in a Google Drive folder and is never integrated into the tools reps use. If the playbook isn't embedded in the CRM and the agent pipeline, it's decoration.

## Metrics & KPIs

### Playbook-Level KPIs

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Playbook adherence rate | ≥ 70% | Plays followed / Plays triggered | Weekly |
| Play effectiveness score (avg.) | ≥ 65 | Weighted average across all plays | Monthly |
| Win rate with playbook | ≥ 30% | Won / Qualified with playbook | Monthly |
| Win rate without playbook | Baseline comparison | Won / Qualified without playbook | Monthly |
| Playbook contribution to revenue | ≥ 60% | Revenue from playbook-triggered deals / Total revenue | Quarterly |
| Avg. ramp time for new reps | ≤ 90 days | Days from hire to first closed deal | Per-cohort |

### Play-Level KPIs

| Play | Primary KPI | Target | Secondary KPI |
|------|------------|--------|--------------|
| Hot Lead Inbound | Inbound-to-opportunity rate | ≥ 40% | Speed-to-lead: <1hr (A) |
| Targeted Outbound | Cold-to-opportunity rate | ≥ 3% | Sequence reply rate: ≥ 8% |
| Competitive Displacement | Competitive win rate | ≥ 40% | Avg. deal age: <90 days |
| Land and Expand | NRR | ≥ 120% | Expansion pipeline: ≥ 50% |
| Stalled Deal Reactivation | Reactivation rate | ≥ 20% | Avg. days to re-engage: <7 |
| Executive Engagement | EB meeting rate | ≥ 35% | EB-engaged close rate: ≥ 45% |
| Churn Prevention | Retention rate | ≥ 60% of high-risk | Time to outreach: <48hrs |

### Pipeline Health KPIs

| Metric | Healthy Range | Warning | Critical |
|--------|--------------|---------|----------|
| Pipeline coverage | 3-4× quota | 2-3× or 4-5× | <2× or >5× |
| Stage 1 → Stage 2 conversion | 30-50% | 20-30% or 50-70% | <20% or >70% |
| Stage 2 → Stage 3 conversion | 40-60% | 30-40% | <30% |
| Stage 3 → Closed Won | 25-40% | 15-25% | <15% |
| Avg. days in discovery | 7-14 | 14-21 | >21 |
| Avg. days in proposal | 7-14 | 14-28 | >28 |
| Deal velocity trend | Increasing QoQ | Flat | Declining |

### Monthly Playbook Review Agenda

1. **Play effectiveness scores** — Which plays are above/below target?
2. **Adherence rates** — Are reps following the playbook? Where are they deviating?
3. **Sequence performance** — Open rates, reply rates, meeting rates by sequence
4. **Pipeline health** — Coverage, conversion rates, deal velocity
5. **New patterns** — Are there emerging win/loss patterns that require new plays?
6. **Competitive landscape** — Any new competitors or competitive shifts requiring play updates?
7. **Rule adjustments** — Do routing, escalation, or branching rules need tuning?
8. **A/B test results** — What did we test this month? What did we learn?

## Cross-References

- **[Lead Scoring Deep Dive](/knowledge/methodologies/lead-scoring-deep-dive.md)** — Scoring models that drive play selection and routing rules
- **[Objection Handling Framework](/knowledge/methodologies/objection-handling-framework.md)** — Objection handling strategies embedded in each play
- **[Lead Qualification Frameworks](/knowledge/domain/lead-qualification-frameworks.md)** — BANT/MEDDIC frameworks that inform play trigger conditions
- **[ICP Design & Scoring Methodology](/knowledge/domain/icp-design-scoring-methodology.md)** — ICP grades that determine play eligibility
- **[Outreach Methodology — Cold Email Sequences](/knowledge/domain/outreach-methodology-cold-email-sequences.md)** — Sequence design principles for play execution
- **[Trigger Events Detection & Timing](/knowledge/domain/trigger-events-detection-timing.md)** — Trigger events that activate specific plays
- **[Atlas Agent Training Manual](/knowledge/agents/atlas.md)** — The orchestrator that selects and activates plays
- **[Bard Agent Training Manual](/knowledge/agents/bard.md)** — The composer that generates play-specific messaging
- **[Flow Agent Training Manual](/knowledge/agents/flow.md)** — The pipeline manager that executes play sequences
- **[Echo Agent Training Manual](/knowledge/agents/echo.md)** — The analyst that measures playbook performance
