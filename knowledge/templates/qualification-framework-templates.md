---
title: "Qualification Framework Templates — Master Reference"
slug: templates-qualification-frameworks
category: template
grade: A
last_reviewed: 2026-07-08
tags: [qualification, bant, meddic, meddpicc, champ, gpct, discovery, scoring-matrix, auto-qualification]
agents: [sage, judge, atlas, echo]
intent_types: [score_lead, build_icp, research_company]
priority: 95
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "Production-grade qualification framework templates covering BANT, MEDDIC, MEDDPICC, CHAMP, and GPCTBA/C&I — including custom LeadReach qualification templates, scoring matrices, discovery question banks, industry-specific criteria, and auto-qualification signal mapping."
---

# Qualification Framework Templates — Master Reference

## 1. Overview

This file provides the canonical library of sales qualification frameworks used across the LeadReach platform. Qualification determines whether a lead is worth pursuing and at what level of investment. Sage (lead scorer) applies these frameworks programmatically using data enriched by Scout, while human reps use the discovery question banks during live conversations.

**Framework Selection Guide:**

| Framework | Best For | Complexity | Typical Deal Size |
|-----------|----------|-----------|------------------|
| BANT | Initial screening, high-volume leads | Low | <$25K |
| CHAMP | Inbound leads, early-stage conversations | Low–Medium | $10K–$50K |
| MEDDIC | Complex B2B, multiple stakeholders | High | $50K–$250K |
| MEDDPICC | Enterprise, competitive deals | Very High | $100K–$500K+ |
| GPCTBA/C&I | Consultative, transformational sales | Very High | $100K+ |
| LeadReach Custom | All LeadReach-sourced leads | Medium | $15K–$150K |

## 2. BANT Framework

### 2.1 Framework Definition

BANT is the foundational qualification framework. Use it for initial lead screening and high-volume qualification where speed matters more than depth.

| Element | Definition | Qualification Standard | Weight |
|---------|-----------|----------------------|--------|
| **B**udget | Does the prospect have allocated budget? | Confirmed budget OR strong budget indicators | 25% |
| **A**uthority | Is the contact a decision-maker or influencer? | Decision-maker OR strong champion identified | 25% |
| **N**eed | Does the prospect have a problem we can solve? | Articulated pain point OR strong inference from ICP | 30% |
| **T**imeline | Is there a defined timeframe for purchase? | Specific timeline OR trigger event within 6 months | 20% |

### 2.2 BANT Scoring Matrix

| Element | Score 3 (Strong) | Score 2 (Moderate) | Score 1 (Weak) | Score 0 (None) |
|---------|-----------------|-------------------|---------------|---------------|
| **Budget** | Budget allocated and confirmed | Budget available but not allocated | Budget exists but constrained | No budget / Unknown |
| **Authority** | Decision-maker (signs the contract) | Influencer with direct access to DM | Champion who can introduce DM | No authority / Unknown |
| **Need** | Explicitly stated pain matching our solution | Inferred need from role + ICP | General interest, no specific pain | No need identified |
| **Timeline** | Buying now (within 30 days) | Buying soon (1–3 months) | Buying later (3–6 months) | No timeline / 6+ months |

**BANT Total Score: 0–12**

| Total | Qualification Status | Next Action |
|-------|---------------------|-------------|
| 10–12 | Highly Qualified | Fast-track to AE, priority demo |
| 7–9 | Qualified | Standard pipeline, schedule discovery |
| 4–6 | Partially Qualified | Further discovery needed, multi-thread |
| 0–3 | Not Qualified | Nurture or disqualify |

### 2.3 BANT Discovery Questions

**Budget Questions:**

| # | Question | When to Ask | Red Flag Answer |
|---|----------|-------------|-----------------|
| 1 | "What budget has been allocated for solving {{pain_point}}?" | After need is confirmed | "We don't have a budget for this" |
| 2 | "How does your team typically evaluate ROI for investments like this?" | Early conversation | "We don't really measure ROI" |
| 3 | "Is this funded from an existing budget line, or would it require new approval?" | Mid-conversation | "Would need board approval from scratch" |
| 4 | "What's the typical investment range for solutions like this in your organization?" | Qualification call | "Not sure we'd pay for something like this" |
| 5 | "Have you purchased similar solutions before? What was the investment level?" | Rapport-building | Never purchased similar tools |

**Authority Questions:**

| # | Question | When to Ask | Red Flag Answer |
|---|----------|-------------|-----------------|
| 1 | "Who else would be involved in evaluating a solution like this?" | Every conversation | "Just me" (when title doesn't match DM) |
| 2 | "What does your decision-making process look like for this type of purchase?" | Early conversation | "It goes through 4 committees" |
| 3 | "Who has the final sign-off on investments in this area?" | Mid-conversation | "Not sure" / "The board" |
| 4 | "Have you championed a similar purchase before? How did that go?" | Building champion | "I tried but it got killed" |
| 5 | "Who else on the team would need to see value in this before moving forward?" | Multi-threading | Long list of required stakeholders |

**Need Questions:**

| # | Question | When to Ask | Red Flag Answer |
|---|----------|-------------|-----------------|
| 1 | "What's the biggest challenge you're facing with {{area}} right now?" | First conversation | "No real challenges" |
| 2 | "How is {{current_approach}} working for your team?" | Problem discovery | "It's fine" / "We're happy with it" |
| 3 | "If you could change one thing about {{process}}, what would it be?" | Pain exploration | "Nothing really" |
| 4 | "What happens if {{pain_point}} isn't resolved in the next {{timeframe}}?" | Urgency creation | "We'd manage" / "Not a big deal" |
| 5 | "How is {{pain_point}} impacting the team's ability to hit {{goal}}?" | Impact quantification | "It's not really impacting anything" |

**Timeline Questions:**

| # | Question | When to Ask | Red Flag Answer |
|---|----------|-------------|-----------------|
| 1 | "When are you looking to have a solution in place?" | Early conversation | "No rush" / "Sometime next year" |
| 2 | "Is there a specific event or deadline driving this initiative?" | Urgency assessment | "Not really, just exploring" |
| 3 | "What's your ideal implementation timeline?" | Planning conversation | "We're really busy, maybe Q4" |
| 4 | "Are there any external factors creating urgency — budget cycle, board meeting, compliance deadline?" | Timeline pressure | None identified |
| 5 | "If we could have this live by {{date}}, would that align with your plans?" | Close timeline | "That's too soon" / "Maybe, not sure" |

### 2.4 BANT Auto-Qualification Signals

```yaml
bant_auto_qualification:
  budget_signals:
    strong:
      - signal: "funding_round_within_12_months"
        source: "crunchbase"
        score: 3
      - signal: "budget_line_item_in_job_description"
        source: "job_boards"
        score: 3
      - signal: "publicly_stated_investment_in_category"
        source: "press_releases"
        score: 3
    moderate:
      - signal: "revenue_in_icp_sweet_spot"
        source: "zoominfo"
        score: 2
      - signal: "hiring_for_relevant_roles"
        source: "linkedin"
        score: 2
    weak:
      - signal: "company_in_growth_stage"
        source: "crunchbase"
        score: 1
  
  authority_signals:
    strong:
      - signal: "title_is_decision_maker"
        titles: ["CRO", "VP Sales", "CFO", "COO", "CEO"]
        score: 3
    moderate:
      - signal: "title_is_influencer"
        titles: ["Director of Sales Ops", "Director of RevOps", "Head of Growth"]
        score: 2
    weak:
      - signal: "title_is_user"
        titles: ["SDR", "AE", "Sales Ops Analyst"]
        score: 1
  
  need_signals:
    strong:
      - signal: "explicit_pain_in_job_description"
        keywords: ["outbound automation", "pipeline quality", "manual prospecting"]
        score: 3
      - signal: "competitor_dissatisfaction_on_review_sites"
        score: 3
      - signal: "high_intent_keyword_search"
        score: 3
    moderate:
      - signal: "icp_role_pain_inference"
        score: 2
      - signal: "trigger_event_suggesting_need"
        score: 2
    weak:
      - signal: "industry_match_only"
        score: 1
  
  timeline_signals:
    strong:
      - signal: "rfp_published"
        score: 3
      - signal: "demo_requested"
        score: 3
      - signal: "budget_cycle_deadline_within_6_months"
        score: 3
    moderate:
      - signal: "trigger_event_within_90_days"
        score: 2
      - signal: "strategic_initiative_announced"
        score: 2
    weak:
      - signal: "no_competing_priorities_inferred"
        score: 1
```

## 3. MEDDIC Framework

### 3.1 Framework Definition

MEDDIC is the gold standard for complex B2B qualification. Use it for deals > $50K with multiple stakeholders.

| Element | Definition | Key Question |
|---------|-----------|-------------|
| **M**etrics | What measurable outcomes will the prospect achieve? | "What does success look like in numbers?" |
| **E**conomic Buyer | Who has the authority to release budget? | "Who signs the check for this type of investment?" |
| **D**ecision Criteria | What criteria will they use to evaluate solutions? | "What are the top 3 things you'll evaluate against?" |
| **D**ecision Process | What steps will they follow to make a decision? | "Walk me through how a purchase like this gets approved." |
| **I**dentify Pain | What is the compelling event or deep pain driving action? | "What happens if this problem isn't solved by {{date}}?" |
| **C**hampion | Who inside the organization is actively selling on your behalf? | "Who on your team is as excited about this as you are?" |

### 3.2 MEDDIC Scoring Matrix

| Element | Score 3 (Strong) | Score 2 (Moderate) | Score 1 (Weak) | Score 0 (Missing) |
|---------|-----------------|-------------------|---------------|-------------------|
| **Metrics** | Specific, quantified, agreed upon | Rough estimates, not validated | Vague ("improve things") | No metrics discussed |
| **Economic Buyer** | Met and aligned | Identified, not yet met | Name known but no access | Unknown |
| **Decision Criteria** | Documented and we meet all | Discussed, we meet most | Assumed but unverified | Unknown |
| **Decision Process** | Mapped end-to-end with dates | Partially understood | Vague understanding | Unknown |
| **Identify Pain** | Severe, quantified, time-bound | Moderate, acknowledged | Mild, latent | No pain identified |
| **Champion** | Active, has access to EB, selling for us | Supportive but limited access | Friendly but passive | No champion identified |

**MEDDIC Total Score: 0–18**

| Total | Qualification Status | Win Probability |
|-------|---------------------|----------------|
| 15–18 | Strongly Qualified | 60–80% |
| 10–14 | Qualified | 30–60% |
| 5–9 | Weakly Qualified | 10–30% |
| 0–4 | Not Qualified | < 10% |

### 3.3 MEDDIC Discovery Questions

**Metrics:**

1. "If you implement a solution like this, what specific metrics would you use to measure success?"
2. "What's the current number for {{metric}}? Where does it need to be?"
3. "What would a {{percent}} improvement in {{metric}} mean for your team in dollars?"
4. "Has the board or leadership set specific targets for {{area}}?"
5. "How do you currently measure {{area}} — and is that measurement accurate?"

**Economic Buyer:**

1. "Who in the organization has the authority to approve this level of investment?"
2. "What's the approval threshold in your company? Does this need to go to the CFO/CEO?"
3. "Have you made a similar purchase before? Who was involved in signing off?"
4. "Would you be comfortable introducing me to {{EB_title}} if we get to that stage?"
5. "What does {{EB_name}} care about most when evaluating investments like this?"

**Decision Criteria:**

1. "What are the top 3 criteria you'll use to evaluate solutions in this space?"
2. "Is there a 'must-have' feature or capability that would be a dealbreaker if missing?"
3. "How important is {{specific_criterion}} compared to {{other_criterion}}?"
4. "Have you established a scoring rubric for vendor evaluation?"
5. "What would make a vendor stand out from the others you're considering?"

**Decision Process:**

1. "Can you walk me through the steps from 'this looks interesting' to 'we're signing a contract'?"
2. "Who needs to be involved at each stage of the evaluation?"
3. "Are there any gate-keeping steps — security review, legal, procurement?"
4. "How long does the typical procurement process take at {{company}}?"
5. "Is there a specific date by which this needs to be finalized?"

**Identify Pain:**

1. "What's the cost of NOT solving {{problem}} for another quarter?"
2. "How is {{problem}} impacting your ability to {{goal}}?"
3. "What triggered the initiative to look for a solution now?"
4. "On a scale of 1-10, how painful is {{problem}}? Why that number?"
5. "If {{problem}} disappeared tomorrow, what would change for your team?"

**Champion:**

1. "Who on your team would benefit most from solving {{problem}}?"
2. "Is there someone who's been advocating for a solution like this internally?"
3. "Would you be willing to present this to {{EB_name}} with our support?"
4. "Who else in the organization feels the pain of {{problem}} as acutely as you do?"
5. "If I gave you the business case, would you feel comfortable taking it to the decision-makers?"

## 4. MEDDPICC Framework

### 4.1 Framework Definition

MEDDPICC extends MEDDIC with **Paper Process** and **Competition** — critical for enterprise deals with formal procurement and active competitive evaluation.

| Element | Definition | Key Question |
|---------|-----------|-------------|
| **M**etrics | Measurable outcomes the buyer expects | "What does success look like in numbers?" |
| **E**conomic Buyer | Budget authority holder | "Who signs the check?" |
| **D**ecision Criteria | Evaluation standards | "What are you evaluating against?" |
| **D**ecision Process | Steps to decision | "What's the procurement journey?" |
| **P**aper Process | Legal, security, procurement steps | "What does the contracting process look like?" |
| **I**dentify Pain | Compelling reason to act | "What happens if this isn't fixed?" |
| **C**hampion | Internal advocate | "Who's selling this for you internally?" |
| **C**ompetition | Other options being evaluated | "Who else are you looking at?" |

### 4.2 MEDDPICC Scoring Matrix

| Element | Score 3 (Strong) | Score 2 (Moderate) | Score 1 (Weak) | Score 0 (Missing) |
|---------|-----------------|-------------------|---------------|-------------------|
| **Metrics** | Quantified, validated, aligned with EB | Estimated, agreed by champion | Vague | None |
| **Economic Buyer** | Engaged and supportive | Identified, access planned | Name known | Unknown |
| **Decision Criteria** | Documented, we lead on all criteria | Known, we're competitive | Assumed | Unknown |
| **Decision Process** | Fully mapped with dates | Partially mapped | Rough sketch | Unknown |
| **Paper Process** | Procurement, legal, security mapped and started | Key contacts identified | Aware of process | Unknown |
| **Identify Pain** | Severe, quantified, deadline-driven | Moderate, acknowledged | Mild | None |
| **Champion** | Active, powerful, coaching us | Supportive, moderate influence | Friendly, low influence | None |
| **Competition** | Known, differentiated, we're leading | Known, competitive | Aware, undifferentiated | Unknown |

**MEDDPICC Total Score: 0–24**

| Total | Qualification Status | Win Probability |
|-------|---------------------|----------------|
| 20–24 | Strongly Qualified | 65–85% |
| 14–19 | Qualified | 35–65% |
| 8–13 | Weakly Qualified | 10–35% |
| 0–7 | Not Qualified | < 10% |

### 4.3 Paper Process & Competition Discovery Questions

**Paper Process:**

1. "Once we agree on terms, what does the contracting process look like at {{company}}?"
2. "Do you have a standard procurement process, or is this a one-off approval?"
3. "Will this need to go through a security or privacy review? What's the typical timeline?"
4. "Who on your legal team handles vendor agreements? Can we meet them early?"
5. "Have there been deals that stalled in procurement? What caused the delay?"
6. "Is there a way to parallel-track legal review with technical evaluation?"

**Competition:**

1. "Are you evaluating other solutions alongside ours? Which ones?"
2. "What do you see as the key differences between the options you're considering?"
3. "Is the status quo also an option, or is there a mandate to make a change?"
4. "Have you worked with {{competitor}} before? What was your experience?"
5. "What would make you choose us over the alternatives?"
6. "Is there a scenario where you'd decide not to purchase any solution?"

## 5. CHAMP Framework

### 5.1 Framework Definition

CHAMP reverses the qualification priority — leading with the prospect's challenges rather than the seller's need to qualify budget. Best for inbound leads and consultative selling.

| Element | Definition | Key Question |
|---------|-----------|-------------|
| **C**hallenges | What problems is the prospect facing? | "What's the biggest challenge you're working on right now?" |
| **H**elp | How can we help address those challenges? | "Would it help if {{proposed_solution}}?" |
| **A**uthority | Who is involved in the decision? | "Who else cares about solving this?" |
| **M**oney | What's the investment capacity? | "What have you budgeted for solving {{challenge}}?" |
| **P**rioritization | How urgent is this relative to other initiatives? | "Where does this rank on your priority list?" |

### 5.2 CHAMP Scoring Matrix

| Element | Score 3 (Strong) | Score 2 (Moderate) | Score 1 (Weak) | Score 0 (Missing) |
|---------|-----------------|-------------------|---------------|-------------------|
| **Challenges** | Multiple, severe, well-articulated | One clear challenge stated | Vague problem mentioned | No challenge identified |
| **Help** | Our solution directly addresses their challenge | Partial fit, needs customization | Tangential fit | No clear fit |
| **Authority** | Direct decision-maker | Influencer with access | Champion with limited access | No authority identified |
| **Money** | Budget allocated and confirmed | Budget available but not earmarked | Budget exists but uncertain | No budget |
| **Prioritization** | Top-3 initiative with deadline | Important but competing priorities | Nice-to-have | No urgency |

**CHAMP Total Score: 0–15**

| Total | Qualification Status |
|-------|---------------------|
| 12–15 | Highly Qualified |
| 8–11 | Qualified |
| 4–7 | Partially Qualified |
| 0–3 | Not Qualified |

### 5.3 CHAMP Discovery Questions

**Challenges:**

1. "What's keeping you up at night when it comes to {{area}}?"
2. "If you could wave a magic wand and fix one thing about {{process}}, what would it be?"
3. "What's the downstream impact of {{challenge}} on the rest of the organization?"
4. "Have you tried to solve this before? What happened?"
5. "What does your team complain about most when it comes to {{area}}?"

**Help:**

1. "Would a solution that {{specific_benefit}} be valuable to you?"
2. "How would your day-to-day change if {{outcome}} was automated?"
3. "What would it mean for your team if {{pain}} was eliminated?"
4. "Would having {{capability}} change how you approach {{area}}?"
5. "If I showed you how {{peer_company}} solved this, would that be useful?"

**Authority:**

*(Same as BANT Authority questions, reframed as "Who else cares about solving this?")*

**Money:**

1. "What's the business case for solving {{challenge}}? Have you quantified the cost of the status quo?"
2. "Organizations similar to yours typically invest {{range}} to solve this. Does that align with your expectations?"
3. "Is this something that would require a specific budget allocation, or could it come from an existing budget line?"

**Prioritization:**

1. "Where does this initiative rank among your top priorities for {{quarter}}?"
2. "Are there other projects that might take precedence over this?"
3. "What would need to happen for this to move up your priority list?"
4. "Is there a deadline or event that's creating urgency?"

## 6. GPCTBA/C&I Framework

### 6.1 Framework Definition

GPCTBA/C&I is the most comprehensive qualification framework, designed for transformational enterprise sales. Each element builds on the previous one.

| Element | Definition |
|---------|-----------|
| **G**oal | What is the prospect trying to achieve? |
| **P**lan | How do they plan to achieve it? |
| **C**hallenge | What's preventing them from achieving it today? |
| **T**imeline | When do they need to achieve it by? |
| **B**udget | What have they allocated to achieve it? |
| **A**uthority | Who owns the goal and the budget? |
| **C**onsequence | What happens if they fail to achieve the goal? |
| **I**mplication | What positive outcomes result from achieving the goal? |

### 6.2 GPCTBA/C&I Scoring Matrix

| Element | Score 3 (Strong) | Score 2 (Moderate) | Score 1 (Weak) | Score 0 (Missing) |
|---------|-----------------|-------------------|---------------|-------------------|
| **Goal** | Specific, measurable, strategic goal | General direction stated | Vague aspiration | No goal stated |
| **Plan** | Detailed plan with milestones | High-level plan | Rough idea | No plan |
| **Challenge** | Critical blocker, quantified | Known obstacle | Aware of friction | No challenge identified |
| **Timeline** | Hard deadline with business impact | Target timeframe | General timeframe | No timeline |
| **Budget** | Allocated, confirmed, sufficient | Available, not yet allocated | Indicated but uncertain | No budget |
| **Authority** | Goal-owner with budget authority | Goal-owner without budget authority | Influencer, not goal-owner | Unknown |
| **Consequence** | Severe negative outcome if goal missed | Moderate negative impact | Minor inconvenience | No consequence |
| **Implication** | Transformative positive outcome | Significant improvement | Incremental benefit | No implication discussed |

**GPCTBA/C&I Total Score: 0–24**

### 6.3 GPCTBA/C&I Discovery Questions

**Goal:**

1. "What's the most important business objective you're working toward this year?"
2. "How does {{area}} contribute to the company's strategic goals?"
3. "What specific number are you trying to hit for {{metric}}?"

**Plan:**

1. "What's your current plan for achieving {{goal}}?"
2. "What resources have you already committed to this initiative?"
3. "What does the roadmap look like — what needs to happen first, second, third?"

**Challenge:**

1. "What's the biggest obstacle standing between you and {{goal}}?"
2. "Have you tried to address {{challenge}} before? What worked and what didn't?"
3. "Is the challenge more about {{people/process/technology}}?"

**Timeline:**

1. "When does {{goal}} need to be achieved by?"
2. "What's driving the timeline — is there an external deadline?"
3. "What happens if you achieve {{goal}} 3 months earlier? What's that worth?"

**Budget:**

1. "What's the financial investment required to achieve {{goal}}? How much is allocated?"
2. "Is the budget for this initiative separate from the operational budget?"
3. "What's the ROI threshold the organization requires for this investment?"

**Authority:**

1. "Who in the organization owns {{goal}} directly?"
2. "Who would need to approve the budget for achieving {{goal}}?"
3. "If we build a compelling business case, who would you take it to?"

**Consequence:**

1. "What happens if {{goal}} isn't achieved by {{date}}?"
2. "What's the cost — in revenue, market share, or team morale — of the status quo?"
3. "Has leadership expressed concern about the current trajectory?"

**Implication:**

1. "If {{goal}} is achieved, what does that unlock for the organization?"
2. "How would hitting {{metric}} change the conversation at the board level?"
3. "What's the multiplier effect — how does success here ripple into other areas?"

## 7. Custom LeadReach Qualification Framework

### 7.1 Framework Definition: LRAFT (LeadReach Automated Framework for Targeting)

LRAFT combines the speed of BANT with the depth of MEDDIC, optimized for the LeadReach 8-agent pipeline.

| Element | Definition | Auto-Detectable | Human Validation Required |
|---------|-----------|----------------|--------------------------|
| **L**ead Fit | ICP score (firmographic + technographic) | ✅ Fully automated | ❌ |
| **R**eadiness | Intent + engagement signals | ✅ Fully automated | ❌ |
| **A**uthority | Decision-maker or champion identified | ✅ Partially (title-based) | ✅ Confirm access |
| **F**riction | Obstacles to purchase (competitor, procurement, timeline) | ✅ Partially | ✅ Validate specifics |
| **T**rigger | Compelling event creating urgency | ✅ Fully automated | ❌ |

### 7.2 LRAFT Scoring Matrix

| Element | Auto Score | Human Score | Combined | Max |
|---------|-----------|-------------|----------|-----|
| **Lead Fit** | 0–25 (ICP score ÷ 4) | — | Auto only | 25 |
| **Readiness** | 0–25 (Intent + Engagement) | — | Auto only | 25 |
| **Authority** | 0–10 (title inference) | 0–10 (access confirmed) | Auto + Human | 20 |
| **Friction** | 0–5 (competitor/procurement signals) | 0–10 (validated obstacles) | Auto + Human | 15 |
| **Trigger** | 0–15 (trigger event detected) | — | Auto only | 15 |
| **Total** | — | — | — | **100** |

**LRAFT Auto-Qualification Flow:**

```yaml
lraft_auto_flow:
  step_1_lead_fit:
    input: "icp_score from sage"
    calculation: "icp_score / 4"
    output: "lead_fit_score (0-25)"
  
  step_2_readiness:
    input: "intent_score + engagement_score from sage"
    calculation: "(intent_score + engagement_score) / 35 * 25"
    output: "readiness_score (0-25)"
  
  step_3_authority_auto:
    input: "contact_title from scout"
    calculation: "title_to_authority_score_mapping"
    mapping:
      decision_maker: 10
      influencer: 6
      user: 3
      unknown: 0
    output: "authority_auto_score (0-10)"
  
  step_4_friction_auto:
    input: "technographic_competitor_data + procurement_signals"
    calculation: "negative_friction_score"
    mapping:
      no_competitor_no_procurement_flag: 5
      competitor_present_mid_contract: 0
      enterprise_procurement_detected: 2
      unknown: 3
    output: "friction_auto_score (0-5)"
  
  step_5_trigger:
    input: "trigger_events from scout"
    calculation: "trigger_event_scoring"
    mapping:
      funding_round: 15
      leadership_change: 12
      product_launch: 10
      expansion: 12
      acquisition: 10
      compliance_deadline: 15
      no_trigger: 0
    output: "trigger_score (0-15)"
  
  auto_total:
    formula: "lead_fit + readiness + authority_auto + friction_auto + trigger"
    output: "lraft_auto_score (0-100 minus human validation component)"
```

### 7.3 LRAFT Human Validation Fields

After auto-qualification, human reps must validate these fields during discovery:

| Field | Validation Question | Score Impact | When to Validate |
|-------|-------------------|-------------|-----------------|
| Authority access | "Can you introduce me to {{EB_name}}?" | 0–10 additional | First discovery call |
| Competitor status | "Are you evaluating {{competitor}}?" | −5 to 0 adjustment | First discovery call |
| Procurement complexity | "What does your procurement process look like?" | −5 to +5 adjustment | Mid-qualification |
| Budget confirmation | "Is the budget for this allocated?" | 0–10 additional | Pre-proposal |
| Champion strength | "Would you present this to the team?" | 0–5 additional | Throughout |

## 8. Qualification Criteria by Industry

### 8.1 SaaS Qualification Criteria

| Framework Element | SaaS-Specific Criteria | Key Signals |
|-------------------|----------------------|-------------|
| **Budget** | SaaS budget typically from sales ops or revenue team budget | "Sales technology" budget line, CFO-approved SaaS spend |
| **Authority** | CRO or VP Sales typically the EB; RevOps often the champion | CRO = 90% EB in SaaS < 500 employees |
| **Need** | Pipeline quality, rep productivity, forecast accuracy | SDR attrition > 30%, pipeline coverage < 3x |
| **Timeline** | Often tied to quarter-end, fiscal year, or funding milestone | Q-end push, new fiscal year budget, post-funding ramp |
| **Decision Criteria** | Integration with existing stack, time-to-value, ease of adoption | Salesforce integration, < 2-week implementation, SDR-friendly UX |
| **Decision Process** | Often includes RevOps evaluation + CRO sign-off | RevOps POC → CRO approval → IT security review |

**SaaS-Specific MEDDIC Customization:**

| MEDDIC Element | SaaS Override | Example |
|---------------|--------------|---------|
| Metrics | Pipeline conversion rate, SDR productivity, forecast accuracy | "Increase pipeline conversion from 12% to 20%" |
| Economic Buyer | CRO (companies < 500), CFO (companies > 500) | "CRO at Series B SaaS" |
| Champion | RevOps Director or SDR Manager | "Director of Sales Operations" |
| Identify Pain | Scaling outbound quality, rep ramp time | "SDRs take 4 months to ramp" |
| Competition | Usually competing against status quo or in-house solutions | "Currently using manual research + spreadsheets" |

### 8.2 Fintech Qualification Criteria

| Framework Element | Fintech-Specific Criteria | Key Signals |
|-------------------|--------------------------|-------------|
| **Budget** | Often requires compliance + business co-approval | Dual budget lines (compliance + revenue) |
| **Authority** | CRO for revenue tools, CCO for compliance, COO for ops | CRO + CCO joint approval common |
| **Need** | Regulatory compliance, multi-jurisdictional outreach | Compliance team blocks outbound, consent management gaps |
| **Timeline** | Regulatory deadline-driven, product launch timelines | Compliance audit date, market expansion deadline |
| **Decision Criteria** | Compliance-by-design, audit trail, data residency | SOC 2 Type II, data residency controls, consent audit trail |
| **Decision Process** | Compliance review is a mandatory gate | Business case → Compliance review → Security → Legal → Sign-off |

### 8.3 Healthtech Qualification Criteria

| Framework Element | Healthtech-Specific Criteria | Key Signals |
|-------------------|----------------------------|-------------|
| **Budget** | Often tied to clinical or commercial team budget | "Provider growth" budget line, commercial ops budget |
| **Authority** | CRO for commercial, CMIO for clinical, CTO for technical | CRO + CMIO joint evaluation common |
| **Need** | Provider adoption, clinical workflow integration | Provider NPS < 30, adoption rate < 40%, workflow complaints |
| **Timeline** | Often tied to clinical milestones, funding tranches | Post-FDA clearance, post-Series B, provider go-live deadline |
| **Decision Criteria** | HIPAA compliance, EHR integration, clinical evidence | HIPAA BAA available, Epic/Cerner integration, published outcomes |
| **Decision Process** | Clinical validation is a mandatory gate | Commercial case → Clinical review → IT security → Legal → Sign-off |

## 9. Auto-Qualification Signal Mapping

### 9.1 Signal-to-Framework Mapping

This matrix maps observable signals to qualification framework elements, enabling automated scoring by Sage.

| Signal | BANT | MEDDIC | CHAMP | LRAFT | Source |
|--------|------|--------|-------|-------|--------|
| Funding round detected | Budget (3) | Metrics (2) | Money (2) | Trigger (15) | Crunchbase |
| Decision-maker title | Authority (3) | EB (3) | Authority (3) | Authority-auto (10) | LinkedIn |
| Pain keywords in job posting | Need (3) | Identify Pain (3) | Challenges (3) | Lead Fit (+) | Job boards |
| RFP published | Timeline (3) | Decision Process (2) | Prioritization (3) | Trigger (15) | Public records |
| Demo requested | Need (3) + Timeline (3) | Identify Pain (2) | Help (3) | Readiness (25) | CRM |
| Competitor product detected | — | Competition (1) | — | Friction (0–5) | Technographic |
| Budget concern in call notes | Budget (0) | — | Money (0) | Friction (−5) | CRM |
| Multiple stakeholders in thread | Authority (1) | Decision Process (2) | Authority (2) | Authority-auto (6) | Email/CRM |
| Pricing page visited | Need (2) | Identify Pain (2) | Challenges (2) | Readiness (+) | Web tracker |
| Procurement process mentioned | — | Paper Process (2) | — | Friction (2) | Call notes |
| Champion intro'd to EB | Authority (3) | EB (3) + Champion (3) | Authority (3) | Authority-human (10) | CRM |
| Security review requested | — | Paper Process (3) | — | Friction (3) | CRM |

### 9.2 Auto-Qualification Pipeline

```yaml
auto_qualification_pipeline:
  trigger: "lead_enters_pipeline"
  
  data_collection:
    - source: "scout_enrichment"
      data: ["firmographic", "technographic", "trigger_events"]
    - source: "sage_scoring"
      data: ["icp_score", "intent_score", "engagement_score"]
    - source: "echo_interaction_data"
      data: ["email_opens", "clicks", "replies", "linkedin_actions"]
    - source: "crm"
      data: ["contact_title", "previous_conversations", "stage_history"]
  
  framework_selection:
    rule: "select_qualification_framework"
    logic:
      - condition: "deal_size_estimate < 25000"
        framework: "BANT"
      - condition: "deal_size_estimate >= 25000 AND deal_size_estimate < 100000"
        framework: "MEDDIC"
      - condition: "deal_size_estimate >= 100000"
        framework: "MEDDPICC"
      - condition: "lead_source == 'inbound'"
        framework: "CHAMP"
      - condition: "always"
        framework: "LRAFT"  # LRAFT runs in parallel to all frameworks
  
  scoring:
    - step: "auto_score_all_framework_elements"
      method: "signal_to_framework_mapping"
      output: "framework_scores_by_element"
    
    - step: "calculate_total_scores"
      method: "sum_element_scores_per_framework"
      output: "qualification_status_per_framework"
    
    - step: "generate_human_validation_checklist"
      method: "identify_missing_or_weak_elements"
      output: "validation_checklist_for_rep"
    
    - step: "route_based_on_qualification_status"
      method: "status_to_routing_map"
      output: "routing_decision"
```

### 9.3 Qualification Status Routing

| Qualification Status | Routing | SLA | Notification |
|---------------------|---------|-----|-------------|
| Highly Qualified (all frameworks) | Immediate AE handoff | < 30 min | Rep + Manager |
| Qualified (primary framework) | Schedule discovery call | < 24 hrs | Rep |
| Partially Qualified | SDR further qualification | < 48 hrs | Rep |
| Weakly Qualified | Extended nurture + monitoring | Weekly | — |
| Not Qualified | Archive, suppress active outreach | None | — |

## 10. Qualification Output JSON Schema

```json
{
  "lead_id": "string",
  "qualification_id": "string",
  "qualified_at": "datetime",
  "primary_framework": "BANT|MEDDIC|MEDDPICC|CHAMP|GPCTBACI|LRAFT",
  "frameworks_applied": [
    {
      "framework": "string",
      "elements": [
        {
          "element": "string",
          "auto_score": "number",
          "human_score": "number|null",
          "total_score": "number",
          "max_score": "number",
          "evidence": ["string"],
          "validation_needed": "boolean",
          "validation_question": "string|null"
        }
      ],
      "total_score": "number",
      "max_score": "number",
      "qualification_status": "highly_qualified|qualified|partially_qualified|weakly_qualified|not_qualified",
      "win_probability_estimate": "number (0-1)"
    }
  ],
  "lraft_score": {
    "lead_fit": "number (0-25)",
    "readiness": "number (0-25)",
    "authority_auto": "number (0-10)",
    "authority_human": "number|null (0-10)",
    "friction_auto": "number (0-5)",
    "friction_human": "number|null (0-10)",
    "trigger": "number (0-15)",
    "total": "number (0-100)",
    "tier": "A+|A|B|C|D"
  },
  "human_validation_checklist": [
    {
      "element": "string",
      "framework": "string",
      "question": "string",
      "priority": "critical|important|nice_to_have",
      "status": "pending|completed|skipped"
    }
  ],
  "routing": {
    "action": "string",
    "assigned_to": "string",
    "sla": "string",
    "reason": "string"
  }
}
```

## 11. Quick-Reference: Framework Selection Flowchart

```
INCOMING LEAD
  │
  ├─ What is the estimated deal size?
  │   ├─ < $25K → BANT (quick screen)
  │   ├─ $25K–$100K → MEDDIC (deeper qualification)
  │   ├─ $100K–$500K → MEDDPICC (enterprise + competition)
  │   └─ > $500K → GPCTBA/C&I (transformational)
  │
  ├─ What is the lead source?
  │   ├─ Inbound → CHAMP (lead with their challenges)
  │   ├─ Outbound (cold) → BANT then escalate
  │   ├─ Referral → MEDDIC (skip to champion)
  │   └─ Event → CHAMP then MEDDIC
  │
  ├─ Always run in parallel: LRAFT (auto-qualification)
  │
  └─ After framework selection:
      ├─ Auto-score all signal-detectable elements
      ├─ Generate human validation checklist
      ├─ Route based on combined qualification status
      └─ Monitor for new signals that change qualification
```

---

*This qualification framework library is maintained by LeadReach Knowledge Engineering. Framework scoring weights should be recalibrated semi-annually based on win/loss analysis. For modifications, submit a PR with the `qualification-templates` label. Last validated against production pipeline data on 2026-07-01.*
