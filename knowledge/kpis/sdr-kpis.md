---
title: SDR/BDR KPIs
category: kpi
kpi_type: sdr
grade: B
last_reviewed: 2026-07-10
tags: [kpi, sdr, benchmark, metrics]
---

# SDR/BDR KPIs

Comprehensive KPI reference for the LeadReach platform covering sdr-related performance metrics.
These benchmarks enable agents to assess prospect performance, identify improvement opportunities, and deliver data-driven recommendations.

SDR/BDR (Sales Development Representative / Business Development Representative) KPIs measure the performance of the frontline prospecting team responsible for generating qualified pipeline. SDRs are the engine of outbound pipeline creation, and their KPIs must balance volume metrics (activities, meetings set) with quality metrics (acceptance rates, pipeline conversion). The SDR role is undergoing a fundamental transformation with the introduction of AI agents — LeadReach agents can handle 40-60% of traditional SDR activities (research, email personalization, sequencing, data entry), enabling human SDRs to focus on high-value activities like complex discovery, relationship building, and strategic account development. This shift changes the KPI framework from activity-volume metrics to outcome-quality metrics.

## SDR Productivity Metrics

SDR productivity encompasses the volume and quality of activities that generate pipeline. Key metrics: daily activities (target 80-120 combined touches), weekly meetings set (target 8-15), monthly qualified pipeline created (target $100K-300K depending on ACV), and opportunity acceptance rate (target 70-85% of SDR-created opportunities accepted by AE). Productivity varies significantly by experience: ramping SDRs (months 1-3) produce 40-60% of tenured SDR output, while top performers exceed median productivity by 2-3x. The highest-leverage productivity improvements come from: automating manual research (saves 1-2 hours/day), providing pre-built prospect lists (eliminates list-building time), and implementing AI-assisted personalization (increases email volume while maintaining quality).

### Formula and Calculation Methodology

SDR Activity Score = (Weighted Activities Performed / Weighted Activity Target) × 100

Meetings per Activity Hour = Meetings Set / Hours Spent on Prospecting Activities

Pipeline per SDR = (Pipeline Value Created by SDR) / Period

SDR Efficiency Index = (Pipeline Created / Total SDR Cost) × 100

**Activity weighting methodology:**
Not all activities are equal. Weight activities by their correlation with meeting generation:

| Activity | Weight | Rationale |
|----------|--------|-----------|
| Personalized email (researched) | 1.5 | Higher conversion than generic email |
| Phone call (conversation) | 2.0 | Direct engagement, highest conversion |
| Phone call (voicemail) | 0.8 | Low callback rate but adds touchpoint |
| Social touch (personalized message) | 1.2 | Moderate conversion, builds presence |
| Research/prospecting | 0.5 | Necessary but doesn't directly generate meetings |
| Data entry/admin | 0.2 | Low value, should be automated |
| LinkedIn connection request | 0.5 | Enables future engagement |

### SDR Productivity Benchmarks by Experience Level

| Metric | Month 1-2 (Ramp) | Month 3-4 (Developing) | Month 5-6 (Maturing) | Month 7+ (Tenured) | Top Performer |
|--------|-------------------|----------------------|---------------------|-------------------|---------------|
| Daily activities | 40-70 | 60-90 | 80-110 | 80-120 | 120-160 |
| Weekly meetings set | 2-5 | 5-8 | 8-12 | 10-15 | 15-25 |
| Monthly pipeline created | $25K-75K | $75K-150K | $100K-250K | $150K-300K | $300K-500K |
| Opportunity acceptance rate | 55-70% | 65-78% | 70-82% | 75-85% | 85-92% |
| Email reply rate | 1-3% | 2-4% | 3-5% | 3-6% | 5-10% |
| Call connect rate | 3-7% | 5-9% | 6-10% | 7-12% | 10-18% |

### SDR Productivity by Motion Type

| Motion | Weekly Meetings | Monthly Pipeline | Key Activities | Typical Team Size |
|--------|----------------|-----------------|---------------|-------------------|
| Inbound SDR (MQL qualification) | 12-20 | $150K-350K | Lead follow-up, qualification, routing | 3-8 per 500 MQLs/month |
| Outbound SDR (cold prospecting) | 8-15 | $100K-300K | Research, outreach, multi-channel sequences | 5-15 per territory model |
| Hybrid SDR (inbound + outbound) | 10-18 | $125K-275K | Mixed approach, demand flex | Most common model |
| Enterprise SDR (named accounts) | 4-8 | $200K-500K | Deep account research, strategic outreach | 1 per 30-50 named accounts |
| Channel/partner SDR | 6-12 | $100K-250K | Partner engagement, co-selling | 2-5 per partner program |

### SDR Time Allocation Analysis

| Activity | Typical Allocation | Optimal Allocation | Efficiency Gap | LeadReach Agent Offload |
|----------|-------------------|-------------------|---------------|------------------------|
| Prospect research | 25-35% | 10-15% | 15-20% saved | AI prospect identification |
| List building | 10-15% | 3-5% | 7-10% saved | Auto-generated target lists |
| Email writing | 15-25% | 8-12% | 7-13% saved | AI-personalized email drafts |
| Phone calling | 15-20% | 25-30% | Shift time to calls | Agent handles email follow-ups |
| Social selling | 5-8% | 8-12% | Moderate increase | Agent handles connection requests |
| Data entry/CRM | 10-15% | 2-5% | 8-10% saved | Auto-logging and data entry |
| Coaching/training | 5-8% | 10-15% | Invest more | Agent frees time for coaching |
| Meeting preparation | 5-8% | 8-12% | Moderate increase | Agent provides pre-meeting intel |

### Data Sources

- Primary: Sales engagement platform for activity and sequence tracking
- Supporting: CRM for pipeline and opportunity data; conversation intelligence for call quality
- Enrichment: Rep performance analytics platforms for benchmarking
- LeadReach Agent: Activity tracking at the agent level, measuring agent-assisted vs. manual productivity

### Diagnostic Framework: When SDR Productivity Is Low

When an SDR's output falls below 70% of team median for 4+ weeks:

1. **Activity volume analysis** — Is the SDR doing enough activities? Where are they falling short?
2. **Activity quality analysis** — Are activities converting at benchmark rates? Which conversion point is weak?
3. **Time allocation audit** — How is the SDR spending their time? Are they stuck in research or admin?
4. **Territory/list quality** — Does the SDR have adequate territory and quality prospect lists?
5. **Skill gap identification** — Specific skills needing development (email writing, calling, discovery)

| Productivity Pattern | Diagnosis | Action |
|---------------------|-----------|--------|
| Low volume, low conversion | Engagement and effort issue | Clear activity targets, daily check-ins, coaching |
| High volume, low conversion | Quality problem, targeting issue | Reduce volume, increase personalization, ICP review |
| Low volume, high conversion | Conservative approach, may be underselling | Scale successful activities, increase list size |
| Strong email, weak phone | Calling confidence/skill gap | Call coaching, call shadowing, call training program |
| Strong outbound, weak inbound | Qualification skill gap | Qualification framework training (BANT/MEDDIC) |

### LeadReach Agent SDR Productivity Enhancement

| Agent Function | Productivity Impact | Measurement |
|---------------|-------------------|-------------|
| Automated prospect identification | 1-2 hours/day saved on research | Hours saved, prospects identified per day |
| AI-personalized email drafts | Higher quality emails in less time | Email reply rate, time per email |
| Sequence automation | Eliminates manual follow-up management | Sequence completion rate, response rate |
| CRM auto-logging | Eliminates data entry burden | Hours saved, CRM completeness improvement |
| Pre-call intelligence | Better call preparation in less time | Call connect rate, conversation quality |

## SDR-to-AE Handoff Quality

The SDR-to-AE handoff is a critical transition point where qualified opportunities move from prospecting to closing. Handoff quality metrics include: opportunity acceptance rate (target 75-85%), first meeting show rate after handoff (target 80%+), and time-to-first-AE-meeting (target under 48 hours from qualification). The most effective handoffs include: documented qualification criteria (BANT, MEDDIC, or custom framework), recorded discovery call excerpts, stakeholder map, identified pain points and urgency drivers, and suggested next-step recommendations. Organizations that implement structured handoff templates and require joint SDR-AE briefings before the first AE meeting see 20-30% higher opportunity acceptance rates and 15% higher win rates on SDR-sourced pipeline.

### Formula and Calculation Methodology

Opportunity Acceptance Rate = (Opportunities Accepted by AE / Opportunities Created by SDR) × 100

Handoff-to-Meeting Rate = (First AE Meetings Held / Opportunities Accepted) × 100

Time-to-First-AE-Meeting = Average days from SDR qualification to first AE meeting

Handoff Quality Score = Composite metric of qualification completeness, documentation quality, and context richness

### Handoff Quality Benchmarks

| Handoff Metric | Benchmark | Top Performer | Impact on Downstream Win Rate |
|---------------|-----------|---------------|------------------------------|
| Opportunity acceptance rate | 70-85% | 85-92% | +10-15% win rate at 85%+ acceptance |
| First meeting show rate | 78-85% | 85-93% | +5-10% win rate with higher show rates |
| Time to first AE meeting | <48 hours | <24 hours | +8-12% win rate with faster handoffs |
| Qualification completeness (BANT) | 2-3 of 4 criteria | 3-4 of 4 criteria | +15-25% win rate with full BANT |
| Stakeholder mapping provided | 40-55% of handoffs | 65-80% of handoffs | +10-20% win rate with stakeholder maps |
| Discovery recording shared | 25-40% of handoffs | 50-70% of handoffs | +5-10% win rate with recordings |
| Pain point documentation | 50-65% of handoffs | 75-90% of handoffs | +12-20% win rate with documented pain |

### SDR-to-AE Handoff Template

| Handoff Element | Required / Optional | Impact on Acceptance | Description |
|----------------|--------------------|--------------------|-------------|
| Company overview | Required | High | Industry, size, revenue, key business context |
| Contact profile | Required | High | Title, role, tenure, personality, influence level |
| Pain points identified | Required | Very High | Specific pain, quantified impact, urgency level |
| Budget signals | Required | Very High | Budget status, allocation timeline, approval process |
| Authority / decision process | Required | High | Decision maker identified, buying committee mapped |
| Need / use case | Required | Very High | Specific use case, desired outcomes, success criteria |
| Timeline | Required | High | Decision timeline, implementation timeline, urgency drivers |
| Competition | Optional | Medium | Current solution, competitive evaluation status |
| Stakeholder map | Optional | High | Other contacts identified, influencers, potential champions |
| Discovery recording | Optional | Medium | Link to recorded discovery call with timestamps |
| SDR recommended next steps | Optional | Medium | Suggested approach, talking points, potential objections |

### Handoff Process Flow

| Step | Owner | Timeline | Key Action | Quality Check |
|------|-------|----------|-----------|---------------|
| 1. Qualification confirmation | SDR | During discovery call | Confirm BANT/MEDDIC criteria met | Qualification scorecard complete |
| 2. Opportunity creation | SDR | Within 2 hours of qualification | Create opp in CRM with complete data | Required fields populated |
| 3. AE notification | SDR | Immediately after opp creation | Slack/email notification with brief context | Notification includes key qualification data |
| 4. Handoff briefing | SDR + AE | Within 24 hours | 10-15 min sync on opportunity context | AE confirms understanding and approach |
| 5. AE first meeting | AE | Within 48 hours of handoff | Scheduled with prospect | Meeting confirmed with agenda sent |
| 6. AE acceptance confirmation | AE | Within 48 hours of first meeting | Accept or return opportunity with reason | Clear accept/return with documentation |

### Data Sources

- Primary: CRM for opportunity creation, acceptance, and meeting data
- Supporting: Conversation intelligence for discovery call quality assessment
- Enrichment: Sales engagement platform for handoff timing and process compliance
- LeadReach Agent: Automated handoff documentation, quality scoring, and process compliance monitoring

### Diagnostic Framework: When Handoff Quality Is Low

When opportunity acceptance rate drops below 70% or first meeting show rate drops below 75%:

1. **AE feedback analysis** — Why are AEs rejecting opportunities? What's missing from handoffs?
2. **Qualification consistency** — Are SDRs applying qualification criteria consistently?
3. **Documentation completeness** — Are handoff templates being filled completely?
4. **Process compliance** — Are SDRs doing briefings or just creating opportunities and moving on?
5. **SDR-AE alignment** — Do SDRs and AEs agree on what constitutes a qualified opportunity?

| Handoff Issue | Diagnosis | Action |
|--------------|-----------|--------|
| Low acceptance rate | Qualification or documentation gap | Clarify criteria, enforce template, coaching |
| Low show rate | Weak qualification or poor confirmation | Tighten qualification, add confirmation cadence |
| Long time to first meeting | Scheduling friction or prioritization | Auto-scheduling, calendar integration, SLA enforcement |
| Incomplete handoff data | Template not enforced or too complex | Simplify template, make required fields mandatory in CRM |

### LeadReach Agent Handoff Quality Enhancement

| Agent Function | Handoff Impact | Measurement |
|---------------|---------------|-------------|
| Auto-populate handoff template | Complete documentation every time | Template completion rate, required field coverage |
| Qualification scoring | Objective quality assessment | Acceptance rate on agent-scored vs. self-reported |
| Discovery call analysis | Extract key qualification data from call | BANT criteria auto-extracted from conversation |
| Stakeholder auto-identification | Better account mapping | Stakeholders identified per handoff |
| Briefing summary generation | Faster SDR-AE alignment | Briefing preparation time, AE satisfaction |

## SDR Ramp and Retention

SDR ramp time averages 3-6 months to full productivity, with the highest attrition occurring in months 1-3 (30-40% of new SDRs leave or are terminated during ramp). Key ramp milestones: Week 1 — product and process training complete, Week 2-3 — live outreach begins, Month 2 — first qualified meetings set, Month 3 — consistent meeting flow established, Month 4-6 — quota attainment. SDR team annual turnover averages 30-50% across the industry, with top-performing organizations reducing this to 20-25% through: clear career progression paths (SDR to AE in 12-18 months), competitive compensation with achievable quotas, structured coaching programs, and recognition/reward systems for milestone achievements.

### Ramp Milestone Framework

| Milestone | Target Timing | Success Criteria | Coaching Focus | Failure Indicator |
|-----------|--------------|-----------------|---------------|-------------------|
| Product certification | Week 1-2 | 85%+ on certification test | Product knowledge | Score <70% |
| First live outreach | Week 2-3 | Email and call activity begins | Message quality, confidence | Not contacting prospects by Week 3 |
| First reply received | Week 3-4 | At least one positive reply | Reply handling, follow-up | No replies by Week 5 |
| First meeting set | Week 4-6 | Qualified meeting scheduled | Meeting confirmation, prep | No meetings by Week 7 |
| First opportunity created | Month 2-3 | Accepted opportunity in CRM | Qualification depth, handoff | No accepted opps by Month 3 |
| First deal influenced | Month 3-5 | SDR-sourced deal progresses | Pipeline management | No deal progression by Month 5 |
| Consistent quota attainment | Month 4-6 | 2+ consecutive months at quota | Activity and quality balance | Not attaining by Month 7 |

### SDR Compensation and Quota Structure

| Component | Typical Structure | Benchmark | Key Consideration |
|-----------|------------------|-----------|-------------------|
| Base salary | $45K-65K (US) | Varies by market | Ensure living wage for market |
| Variable/target incentive | $20K-40K (US) | 50/50 to 60/40 base/variable | Achievable for median performer |
| On-target earnings (OTE) | $65K-105K (US) | — | Must be competitive for talent |
| Quota measure | Meetings set or pipeline created | 8-15 meetings/week or $100K-300K pipeline/month | Measure what you can control |
| Quota relief (ramp) | 50% Q1, 75% Q2, 100% Q3 | — | Fair ramp expectations |
| Accelerators | 1.5-3x above 100% attainment | Critical for top performer retention | Must be uncapped for motivation |
| SPIFs | $50-500 per special achievement | Short-term motivation | Use for strategic priorities |

### SDR Retention Analysis

| Retention Metric | Benchmark | Top Performer | Key Driver |
|-----------------|-----------|---------------|-----------|
| 90-day retention | 70-80% | 85-92% | Onboarding quality, achievable early targets |
| 6-month retention | 60-72% | 75-85% | Coaching support, team culture |
| 12-month retention | 50-65% | 65-80% | Career path clarity, promotion timeline |
| Average SDR tenure | 12-18 months | 18-24 months | Promotion path, development investment |
| Promotion rate (SDR to AE) | 50-70% of tenured SDRs | 70-85% | Clear criteria, development program |
| Regrettable turnover | 15-25% annually | 10-18% | Competitive comp, career growth |

### SDR Career Path Framework

| Career Stage | Typical Duration | Key Achievements | Next Role |
|-------------|-----------------|-----------------|-----------|
| SDR Ramp (Months 1-3) | 3 months | Training complete, first meetings, first opp | Continue to tenured SDR |
| SDR (Months 4-8) | 5 months | Consistent quota attainment, skill development | SDR Team Lead or AE track |
| Senior SDR / SDR Team Lead | 6-12 months | Mentoring, top performance, process improvement | AE promotion |
| Account Executive (promotion) | 12-18 months from SDR start | Full sales cycle responsibility | Mid-Market AE or Enterprise AE |

### Data Sources

- Primary: HRIS for hire date, tenure, and turnover data; CRM for ramp milestone tracking
- Supporting: Compensation platform for OTE and attainment data
- Enrichment: Manager assessments for qualitative ramp and retention insights
- LeadReach Agent: Ramp milestone tracking with automated coaching and activity recommendations

### Diagnostic Framework: When SDR Retention Is Low

When annual SDR turnover exceeds 40%:

1. **Exit interview analysis** — Why are SDRs leaving? Compensation, culture, career path, management?
2. **Ramp success rate** — What % of new SDRs successfully ramp? Where do they fail?
3. **Compensation analysis** — Is OTE competitive for the market? Are quotas achievable?
4. **Career path clarity** — Do SDRs see a clear path to AE? What's the average promotion timeline?
5. **Management quality** — Are SDR managers effective coaches and advocates?

| Retention Pattern | Diagnosis | Action |
|-------------------|-----------|--------|
| High early attrition (month 1-3) | Onboarding or expectation mismatch | Improve onboarding, realistic job preview, early coaching |
| Mid-tenure attrition (month 4-8) | Frustration, burnout, lack of growth | Career development, rotation, recognition, coaching |
| Late attrition (month 9+) | No clear promotion path | Transparent promotion criteria, AE pipeline, development |
| Top performer attrition | Better opportunities elsewhere | Competitive comp, accelerators, growth opportunities |

### LeadReach Agent Retention Enhancement

| Agent Function | Retention Impact | Measurement |
|---------------|-----------------|-------------|
| Faster ramp through AI assistance | New SDRs productive sooner | Ramp time reduction, 90-day retention improvement |
| Reduced admin burden | Less frustration, more rewarding work | SDR satisfaction score, admin time reduction |
| Activity recommendations | Less decision fatigue, clearer daily plan | Daily activity completion rate, confidence score |
| Coaching insights | Better manager-SDR development | Coaching session quality, skill development rate |

## SDR Team Structure and Scaling Metrics

### SDR-to-AE Ratio Benchmarks

| Model | SDR:AE Ratio | Best For | Typical Team Size | Key Consideration |
|-------|-------------|----------|-------------------|-------------------|
| 1:1 (paired) | 1 SDR per 1 AE | Enterprise, high-touch | Small, specialized | Deep territory knowledge |
| 1:2 (coverage) | 1 SDR per 2 AEs | Mid-market, balanced | Medium | Good coverage, some specialization |
| 1:3+ (pool) | 1 SDR per 3+ AEs | SMB, high-volume | Large pool | Efficient, less personalized |
| Inbound-only pod | Based on MQL volume | Inbound-heavy GTM | Variable | SLA-driven, qualification focus |
| Hybrid model | Mix of above | Most organizations | Variable | Flexibility, demand-based |

### SDR Team Scaling Metrics

| Metric | Formula | Benchmark | Scaling Trigger |
|--------|---------|-----------|----------------|
| SDRs needed for pipeline | (Required Pipeline / Pipeline per SDR) | $100K-300K/month per SDR | Pipeline shortfall = add SDRs or agent capacity |
| Cost per SDR-sourced meeting | (Total SDR Cost / Meetings Set) | $200-500 | Exceeding $500 = efficiency problem |
| SDR-sourced revenue % | (SDR-sourced Closed-Won / Total Closed-Won) | 20-40% | Below 20% = SDR underperformance or GTM issue |
| Agent augmentation ratio | Agent activities replacing SDR activities | 40-60% replacement | Each agent = 0.5-1.5 SDRs of activity capacity |

## AI Agent vs. Human SDR Performance Comparison

### Head-to-Head Performance Metrics

| Metric | Human SDR (Tenured) | LeadReach Agent | Human + Agent Combination | Key Insight |
|--------|-------------------|----------------|--------------------------|-------------|
| Daily prospecting activities | 80-120 | 500-2000+ | 300-600 (human focuses on calls/meetings) | Agent handles volume, human handles quality |
| Research time per prospect | 10-20 min | 1-2 min | 3-5 min (human reviews agent output) | Agent eliminates research bottleneck |
| Emails personalized per day | 20-40 | 100-500+ | 50-100 (human for strategic, agent for volume) | Agent scales personalization |
| Meeting set per week | 8-15 | 5-12 | 12-25 (agent-sourced + human-sourced) | Combination outperforms either alone |
| Pipeline created per month | $100K-300K | $50K-200K | $200K-500K | Agent + human creates more pipeline than human alone |
| Cost per meeting | $200-500 | $50-150 | $100-300 | Agent significantly reduces cost per meeting |
| Hours of selling time per week | 15-25 | N/A | 25-35 (agent frees human time) | Agent increases human selling time |

### Optimal Human + Agent Operating Model

| Activity | Agent-Led | Human-Led | Shared | Rationale |
|----------|-----------|-----------|--------|-----------|
| Prospect identification | Primary | Review/validate | — | Agent excels at data processing at scale |
| Research and enrichment | Primary | Strategic accounts only | — | Agent faster and more thorough |
| Email personalization | Drafts | Reviews, approves | Personalized sends | Agent generates, human quality-checks |
| Sequence management | Primary | — | — | Agent optimizes timing and branching |
| Phone calls | — | Primary | — | Human relationship skills irreplaceable |
| Discovery meetings | — | Primary | Agent provides real-time intel | Human leads conversation, agent provides support |
| Qualification and handoff | Drafts | Final decision | — | Agent documents, human confirms quality |
| CRM data entry | Primary | — | — | Agent auto-populates, eliminating manual entry |
| Strategic account planning | — | Primary | Agent provides data | Human sets strategy, agent provides intelligence |

## Implementation Guide for LeadReach Agents

### Daily SDR KPI Agent Routines

1. **Activity tracking and recommendations:** Monitor SDR activity against targets and suggest priority activities
2. **Handoff quality monitoring:** Track handoff completeness and trigger alerts for incomplete handoffs
3. **Ramp milestone tracking:** Monitor new SDR progress against ramp milestones
4. **Agent activity reporting:** Track agent-driven activities and their conversion outcomes

### Weekly SDR KPI Agent Reports

1. **SDR productivity dashboard:** Activity volume, meeting set rate, pipeline creation by SDR
2. **Handoff quality report:** Acceptance rates, documentation completeness, time-to-first-AE-meeting
3. **Ramp cohort progress:** Milestone completion for each new SDR in ramp
4. **Agent vs. human productivity comparison:** Activity volume, conversion rates, and pipeline contribution
5. **Team health metrics:** Retention indicators, satisfaction signals, career development progress

### Monthly SDR KPI Deep Dives

1. **SDR efficiency analysis:** Cost per meeting, cost per pipeline dollar, activity-to-outcome optimization
2. **Handoff process audit:** Which handoff elements drive the highest AE acceptance and downstream win rates?
3. **Ramp program effectiveness:** Which training components and coaching approaches accelerate ramp most?
4. **Retention and engagement assessment:** Attrition risk factors, career development pipeline
5. **Team structure optimization:** SDR-to-AE ratio, specialization vs. generalization, agent augmentation ROI

## SDR Activity KPI Reference

The following is a comprehensive reference of all SDR-specific KPIs that should be tracked, with definitions, formulas, benchmarks, and diagnostic thresholds.

### Complete SDR KPI Inventory

| # | KPI | Formula | Daily Benchmark | Weekly Benchmark | Diagnostic Threshold |
|---|-----|---------|----------------|-----------------|---------------------|
| 1 | Calls Made | Total outbound calls | 30-60 | 150-300 | <25/day = activity problem |
| 2 | Emails Sent | Total personalized emails | 40-80 | 200-400 | <30/day = activity problem |
| 3 | Conversations | Calls resulting in 2+ min dialogue | 3-8 | 15-40 | <2/day = targeting/script issue |
| 4 | Email Replies | Positive + negative + neutral replies | 1-4 | 5-20 | <1/day = messaging/targeting issue |
| 5 | Meetings Booked | Qualified meetings scheduled | 0.5-2 | 4-12 | <0.3/day = qualification/conversion issue |
| 6 | Meetings Held | Meetings actually conducted | 0.5-1.5 | 3-10 | <50% show rate = confirmation issue |
| 7 | Opportunities Created | CRM opportunities opened | 0.3-1 | 2-6 | <0.2/day = qualification issue |
| 8 | Conversation Rate | Conversations / Calls × 100 | 7-15% | — | <5% = script/timing/targeting |
| 9 | Response Rate | Replies / Emails Delivered × 100 | 2-5% | — | <1% = targeting/message issue |
| 10 | Meeting Conversion | Meetings / Conversations × 100 | 20-40% | — | <15% = discovery/objection issue |
| 11 | Opportunity Acceptance | Accepted Opps / Created Opps × 100 | — | 70-85% | <60% = qualification/handoff issue |
| 12 | Quota Attainment | Actual / Target × 100 | — | 25%/week pace | <15%/week = behind pace |
| 13 | Pipeline Created | $ value of qualified pipeline | $5-15K/day | $25-75K | <$5K/day = pipeline gap |
| 14 | Activity Ratio (calls:emails) | Calls / Emails | 1:1 to 1:2 | — | All-email or all-calls = imbalance |
| 15 | Ramp Time | Days to first month at quota | — | — | >180 days = onboarding issue |
| 16 | Cost per Meeting | Total SDR cost / Meetings set | — | $200-500 | >$600 = efficiency issue |
| 17 | Cost per Pipeline $ | Total SDR cost / Pipeline $ | $0.05-0.15 per $1 | — | >$0.20 = ROI problem |

### SDR KPI Interdependencies

Understanding how SDR KPIs relate to each other is critical for diagnosis and optimization. The activity-to-outcome chain follows a predictable pattern: Activity Volume → Contact Rate → Conversation Rate → Response Rate → Meeting Rate → Opportunity Rate → Pipeline Rate. Each conversion point in the chain has a benchmark range, and underperformance at any single point impacts all downstream metrics.

| KPI Relationship | Correlation Strength | Typical Multiplier | Diagnostic Use |
|-----------------|---------------------|-------------------|---------------|
| Calls → Conversations | Strong (0.7-0.85) | 7-12% conversion | If low: targeting/timing/script issue |
| Emails → Replies | Moderate (0.5-0.7) | 2-5% conversion | If low: targeting/personalization/messaging |
| Conversations → Meetings | Strong (0.65-0.8) | 20-40% conversion | If low: discovery/objection handling |
| Meetings → Opportunities | Very Strong (0.8-0.9) | 60-80% conversion | If low: qualification or AE acceptance |
| Opportunities → Pipeline $ | Strong (0.7-0.85) | Dependent on ACV | If low: deal sizing/targeting |
| Activity Volume → Meetings | Moderate (0.5-0.7) | Diminishing returns above 120/day | More activity ≠ proportionally more meetings |

### SDR Coaching Framework

Effective SDR coaching requires structured methodology tied to specific KPIs. The following framework maps coaching interventions to underperforming KPIs, ensuring that coaching time is invested where it will have the highest impact on outcomes.

| Underperforming KPI | Root Cause Category | Coaching Intervention | Duration | Expected Improvement |
|---------------------|-------------------|---------------------|----------|---------------------|
| Low call volume | Motivation, process, or territory | Activity planning, call blocks, territory refresh | 1-2 weeks | 30-50% volume increase |
| Low conversation rate | Script, targeting, or timing | Script workshop, call recording review, ICP refinement | 2-4 weeks | 3-8 percentage point increase |
| Low email reply rate | Targeting, personalization, or messaging | Template refresh, personalization training, ICP audit | 2-4 weeks | 1-3 percentage point increase |
| Low meeting conversion | Discovery, objection handling, or CTA | Discovery framework training, objection handling practice | 3-6 weeks | 5-15 percentage point increase |
| Low opportunity acceptance | Qualification criteria, handoff quality | Qualification framework training, handoff template enforcement | 2-4 weeks | 10-20 percentage point increase |
| Low pipeline value | Deal sizing, ICP targeting, territory | ICP re-targeting, enterprise account strategy, value articulation | 4-8 weeks | 25-50% pipeline value increase |

### SDR Coaching Cadence

| Coaching Activity | Frequency | Duration | Focus KPI | LeadReach Scout Role |
|-----------------|-----------|----------|-----------|---------------------|
| Daily standup | Daily | 10-15 min | Activity targets, blockers | Scout provides daily activity snapshot and recommendations |
| 1:1 call review | Weekly | 30-45 min | Conversation rate, discovery quality | Scout identifies best/worst calls for review |
| Pipeline review | Weekly | 15-30 min | Pipeline creation, opportunity progression | Scout flags stalled opportunities and at-risk pipeline |
| Email coaching | Weekly | 15-30 min | Reply rate, personalization quality | Scout analyzes email performance and suggests improvements |
| Team training | Bi-weekly | 60 min | Skill development, new plays | Scout identifies team-wide skill gaps from KPI patterns |
| Monthly performance review | Monthly | 45-60 min | Quota attainment, KPI trends, career development | Scout provides comprehensive performance analytics |

### LeadReach Scout SDR Measurement Points

LeadReach Scout is the primary agent for SDR performance measurement and optimization. Scout tracks activity at the agent level, measures agent-assisted vs. manual productivity, and provides real-time coaching recommendations.

| Scout Measurement Point | What It Tracks | How It's Measured | Optimization Action |
|------------------------|---------------|-------------------|-------------------|
| Activity volume (agent-assisted) | Emails personalized, prospects identified, sequences managed | Agent activity log, CRM auto-entries | Increase agent delegation, optimize agent workflows |
| Activity volume (human-led) | Calls made, discovery meetings, strategic outreach | CRM manual entries, call tracking | Coach on high-value activity prioritization |
| Agent-to-human productivity ratio | Agent activities vs. human activities per day | Comparative activity dashboard | Optimize task allocation between agent and human |
| Agent-assisted conversion rates | Reply rate on agent-personalized emails, meeting set rate from agent sequences | Sequence analytics, CRM conversion data | Optimize agent personalization quality |
| Agent time savings | Hours saved on research, data entry, email drafting | Time tracking comparison (before/after agent) | Reinvest saved time in calling and discovery |
| Agent quality score | Accuracy of prospect identification, relevance of personalization | Rep feedback, reply rates, conversion rates | Improve agent data sources and personalization models |
| Ramp acceleration | Time-to-first-meeting and time-to-quota for Scout-assisted SDRs | Cohort comparison (Scout-assisted vs. standard) | Optimize Scout onboarding recommendations |

### LeadReach Forge SDR Measurement Points

LeadReach Forge manages the outbound sequence execution layer, automating multi-channel outreach workflows and optimizing timing, content, and channel selection.

| Forge Measurement Point | What It Tracks | How It's Measured | Optimization Action |
|------------------------|---------------|-------------------|-------------------|
| Sequence enrollment rate | Contacts enrolled in sequences per day/week | Sequence platform analytics | Optimize prospect-to-sequence matching |
| Sequence completion rate | % of contacts completing all sequence steps | Sequence platform analytics | Optimize sequence length, content, timing |
| Per-step conversion rate | Open → reply → meeting at each sequence step | Sequence analytics, CRM tracking | A/B test subject lines, CTAs, content |
| Channel mix effectiveness | Email vs. phone vs. social conversion by segment | Multi-channel attribution | Optimize channel allocation per segment |
| Personalization depth score | Level of personalization per email (basic → deep) | Forge personalization engine metrics | Balance personalization depth with volume |
| Send time optimization | Response rate at AI-selected vs. manual send times | A/B testing, response rate comparison | Refine send time model by segment |
| A/B test velocity | Number of tests running, statistical significance achieved | Forge testing dashboard | Increase test velocity for faster optimization |

### SDR Productivity Optimization Playbook

| Optimization Area | Current State (Typical) | Target State | Steps to Achieve | Expected Impact |
|-------------------|------------------------|-------------|-----------------|----------------|
| Prospect research | 25-35% of SDR time, manual | 5-10% of time, Scout-assisted | Deploy Scout for automated prospect ID and research | +1-2 hrs/day for calling |
| Email personalization | 15-25% of time, manual writing | 5-8% of time, Forge-assisted | Deploy Forge for AI-personalized email drafts | +1-2 hrs/day for calling |
| Sequence management | 5-10% of time, manual scheduling | 0-2% of time, Forge-automated | Deploy Forge for automated sequence execution | +30-60 min/day for calling |
| CRM data entry | 10-15% of time, manual logging | 0-2% of time, auto-logged | Deploy Scout for auto-logging and CRM updates | +1-2 hrs/day for calling |
| Call preparation | 5-8% of time, manual research | 2-3% of time, Scout-prepped | Deploy Scout for pre-call intelligence briefs | Better call quality in less time |
| **Total time freed** | **55-93% manual/admin** | **12-25% manual/admin** | **Full Scout + Forge deployment** | **+4-6 hrs/day for high-value activities** |

### SDR Activity-to-Outcome Correlation Matrix

The following matrix shows the strength of correlation between each SDR activity type and key outcomes, based on aggregate data across B2B SaaS organizations. Use this to prioritize activity allocation and coaching focus.

| Activity | Correlation to Meetings | Correlation to Pipeline $ | Correlation to Opps Created | Coaching Priority if Weak |
|----------|------------------------|--------------------------|----------------------------|--------------------------|
| Phone conversations | 0.75-0.85 (very strong) | 0.70-0.80 | 0.65-0.78 | Calling skills, script, targeting |
| Personalized emails | 0.50-0.65 (moderate-strong) | 0.45-0.60 | 0.40-0.55 | Personalization, targeting, CTA |
| Social touches | 0.30-0.45 (moderate) | 0.25-0.40 | 0.20-0.35 | Social selling training, profile optimization |
| Research/prospecting | 0.25-0.35 (weak-moderate) | 0.20-0.30 | 0.15-0.25 | Automate with Scout, focus on ICP fit |
| Voicemails | 0.15-0.25 (weak) | 0.10-0.20 | 0.08-0.15 | Script optimization, timing |
| LinkedIn connections | 0.10-0.20 (weak) | 0.08-0.15 | 0.05-0.12 | Automate, low-priority activity |

### SDR Quota Attainment Benchmarks

| Metric | Benchmark | Top Performer | Below Benchmark Implication |
|--------|-----------|---------------|---------------------------|
| % of SDRs achieving 100%+ quota | 55-70% | 70-85% | Below 50% = quota may be too high or motion broken |
| Average quota attainment | 85-105% | 105-125% | Below 80% = systemic issue |
| Median quota attainment | 90-110% | 110-130% | Reveals true center of distribution |
| Quota attainment distribution | Normal-ish distribution | Right-skewed (more over-performers) | Bimodal = some SDRs thriving, some failing |
| Time to first 100% month | Month 4-6 | Month 2-4 | Beyond month 7 = ramp or territory issue |
| Consecutive months at quota (tenured) | 3+ out of 6 | 5+ out of 6 | <2 out of 6 = consistency problem |

### Daily/Weekly/Monthly SDR Activity Targets

| Timeframe | Activity Target | Meeting Target | Pipeline Target | Milestone |
|-----------|----------------|---------------|----------------|-----------|
| **Daily** | 80-120 combined touches | 0.5-2 meetings set | $5-15K pipeline created | End-of-day activity check |
| **Weekly** | 400-600 combined touches | 8-15 meetings set | $25-75K pipeline created | Weekly pipeline review |
| **Monthly** | 1,600-2,400 combined touches | 32-60 meetings set | $100K-300K pipeline | Monthly quota evaluation |
| **Quarterly** | 4,800-7,200 combined touches | 96-180 meetings set | $300K-900K pipeline | Quarterly performance review |

### SDR Performance Grading Scale

| Grade | Quota Attainment | Activity Level | Conversion Rates | Coaching Need |
|-------|-----------------|---------------|-----------------|---------------|
| A+ (Elite) | 130%+ | 120%+ of targets | Top 10% conversion | Mentor role, share best practices |
| A (Strong) | 110-130% | 100-120% of targets | Above benchmark | Stretch goals, development for AE promotion |
| B (Solid) | 90-110% | 80-100% of targets | At benchmark | Consistent coaching, maintain momentum |
| C (Developing) | 70-90% | 60-80% of targets | Below benchmark | Active coaching, skill development plan |
| D (Struggling) | 50-70% | 40-60% of targets | Well below benchmark | Intensive coaching, PIP consideration |
| F (Failing) | <50% | <40% of targets | Critical gap | PIP, territory change, or separation |

## Visualization Recommendations

| KPI | Recommended Visualization | Key Insights |
|-----|--------------------------|-------------|
| SDR productivity | Scatter plot (activity volume × meeting rate) | Rep positioning on efficiency matrix |
| Handoff quality | Stacked bar by completeness criteria | Handoff documentation gaps |
| Ramp curve | Line chart (milestones × time) by cohort | Cohort comparison and improvement |
| Agent vs. human | Grouped bar chart across metrics | Relative strengths and combination benefits |
| Retention | Survival curve by cohort | When SDRs leave and what predicts departure |
| Time allocation | Stacked area chart by activity type | Where SDR time goes and optimization opportunities |
| Activity-to-outcome | Sankey diagram (activities → conversations → meetings → opps) | Conversion at each funnel stage |
| KPI interdependencies | Correlation heatmap | Which activities drive which outcomes |
| Coaching impact | Pre/post comparison chart | Performance change after coaching interventions |
| Quota attainment distribution | Histogram with target line | Rep performance distribution |
