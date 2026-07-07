---
title: "Technical Proof of Concept — Playbook"
category: playbook
playbook: technical-proof-of-concept
tags: [POC, proof-of-concept, pilot, technical-validation, evaluation, success-criteria]
last_reviewed: "2026-07-04"
grade: "A"
author: "LeadReach Knowledge Team"
---

# Technical Proof of Concept — Playbook

This playbook is the canonical reference for designing, executing, and closing technical proof of concept (POC) engagements with LeadReach prospects. It covers POC qualification, success criteria design, execution management, stakeholder engagement, and POC-to-deal conversion. Used by Atlas (Orchestration), Forge (Technical Preparation), Sage (Use-Case Research), Bard (Communication), and Flow (POC Tracking).

## 1. Why Technical POCs Matter

A technical POC is the most powerful — and most dangerous — tool in the enterprise sales arsenal. When executed well, a POC:

- **Proves value in the customer's environment** with their data, their team, and their workflows
- **Builds trust** with technical stakeholders who need to see it work before they approve it
- **Creates urgency** through time-boxed success criteria that create a natural decision point
- **Displaces competitors** by demonstrating capabilities they can't match

When executed poorly, a POC:
- **Becomes a never-ending evaluation** with no defined endpoint
- **Consumes engineering resources** without generating pipeline
- **Gives the customer free consulting** they use to improve their current tool
- **Delays the deal** by 30-90 days without increasing close probability

LeadReach's POC philosophy: **every POC has a defined scope, a defined timeline, pre-agreed success criteria, and a written commitment to purchase if criteria are met.** A POC without these elements is not a POC — it's free consulting.

## 2. POC Qualification Framework

### 2.1 When to Offer a POC

| Scenario | POC Appropriate? | Alternative |
|----------|-----------------|-------------|
| Enterprise deal (>100 seats) with technical evaluation required | Yes — structured POC with success criteria | — |
| Customer's IT team needs to validate integrations | Yes — limited-scope technical POC | Reference call with peer IT team |
| Customer wants to "try before they buy" with no clear criteria | No — offer extended trial instead | 30-day free trial with guided onboarding |
| Competitor offers a POC and customer expects one | Yes — competitive POC; must outperform | — |
| Customer's champion needs internal proof to get budget | Yes — champion enablement POC | Business case document + peer references |
| Customer has 3+ vendors in evaluation | Conditional — only if LeadReach is shortlisted | Ask to be evaluated after shortlist; not during RFP |
| Deal <50 seats | No — POC cost exceeds deal value | Free trial + demo |

### 2.2 POC Qualification Scorecard (Judge Agent)

| Criterion | Weight | Qualified | Unqualified |
|-----------|--------|-----------|-------------|
| Deal size >$50K ACV | 20 | Yes | No — use trial instead |
| Success criteria agreed before POC starts | 20 | Yes | No — scope will creep |
| Decision timeline defined | 15 | Yes | No — POC will run indefinitely |
| Budget confirmed or highly likely | 15 | Yes | No — POC is exploratory |
| Technical buyer engaged | 15 | Yes | No — IT will block at the end |
| Written commitment to purchase if criteria met | 10 | Yes | No — customer has no obligation |
| Champion has authority to approve | 5 | Yes | No — champion is IC |

**Minimum POC qualification score**: 60/100. Below 60, offer a free trial or extended demo instead.

## 3. POC Structure and Design

### 3.1 POC Types

| POC Type | Duration | Scope | Success Criteria | Typical Deal Size |
|----------|----------|-------|-----------------|------------------|
| **Integration POC** | 1-2 weeks | Validate specific integration (CRM, API, SSO) | Integration works per specifications | $50K-$150K |
| **Performance POC** | 2-4 weeks | Validate sequence performance (reply rates, deliverability) | Performance meets or exceeds benchmarks | $75K-$200K |
| **Full Evaluation POC** | 4-6 weeks | End-to-end evaluation of LeadReach vs. requirements | All critical requirements met | $150K+ |
| **Competitive POC** | 2-4 weeks | Head-to-head comparison with specific competitor | LeadReach outperforms on key metrics | $100K+ |

### 3.2 Success Criteria Template

Every POC must have **written, pre-agreed success criteria** before Day 1:

```
POC SUCCESS CRITERIA — [Customer Name]

POC Duration: [Start Date] to [End Date] ([X] weeks)
POC Scope: [Description of what will be tested]

MUST-HAVE Criteria (all must be met for purchase commitment):
1. [e.g., LeadReach sequences achieve ≥12% reply rate for SDR team]
2. [e.g., Salesforce integration syncs contacts and activities within 5 minutes]
3. [e.g., SSO/SAML authentication works with customer's Okta instance]
4. [e.g., Data Enrichment provides accurate contact data for ≥85% of prospects]

NICE-TO-HAVE Criteria (demonstrated but not required for purchase):
1. [e.g., AI Personalization generates usable first-draft personalization for 80%+ of prospects]
2. [e.g., Custom reporting dashboard is created within 48 hours]

PURCHASE COMMITMENT:
If all MUST-HAVE criteria are met by [End Date], [Customer] commits to purchasing [Product/Tier/Seats] at [Agreed Pricing] within [14 days] of POC completion.

If MUST-HAVE criteria are NOT met, [Customer] has no obligation, and LeadReach will provide a detailed explanation of gaps and remediation timeline.

Signed:
[Customer] ____________________ Date: ________
[LeadReach] __________________ Date: ________
```

### 3.3 POC Pricing

| POC Type | Pricing | Rationale |
|----------|---------|-----------|
| Integration POC | Free | Low effort; high conversion; proves technical fit |
| Performance POC | $5,000 (credited toward purchase) | Commitment from customer; prevents tire-kicking |
| Full Evaluation POC | $10,000-$25,000 (credited toward purchase) | Significant resource investment; customer must have skin in the game |
| Competitive POC | $15,000-$25,000 (credited toward purchase) | High effort; high stakes; customer must be serious |

**Rule**: Never do a free POC for >50 seats. The customer must have financial commitment. If they won't pay for a POC, they're not serious about buying.

## 4. The POC Execution Workflow

### Phase 1: Preparation (Days -14 to 0)

#### Step 1.1: POC Scoping (AE + SE, 1-3 Days)

- Define the POC type and scope based on customer requirements
- Identify the specific use cases and workflows to be tested
- Map the customer's technical environment (CRM, email, SSO, data sources)
- Identify the POC team: customer participants + LeadReach SE + CSM

#### Step 1.2: Success Criteria Agreement (AE + Customer, 2-5 Days)

- Present the Success Criteria Template
- Negotiate criteria that are **measurable, achievable, and meaningful**
- Avoid vague criteria: "improve outbound" → "achieve ≥12% reply rate"
- Avoid impossible criteria: "100% deliverability" → "≥95% deliverability"
- Get written sign-off from customer's decision-maker

#### Step 1.3: Technical Setup (SE + Forge, 3-7 Days)

- Provision LeadReach environment for the POC
- Configure integrations (CRM, email, calendar, SSO)
- Import customer's contact data (or use sample dataset)
- Set up representative sequences based on customer's actual use cases
- Configure reporting dashboards for success criteria tracking
- Test all integrations before POC kickoff

#### Step 1.4: POC Kickoff Meeting (All, Day 0)

A structured kickoff meeting with all POC participants:

1. **Review success criteria**: Confirm agreement on what constitutes success
2. **Introduce the POC team**: Customer participants + LeadReach team
3. **Walk through the plan**: Daily/weekly schedule, milestones, check-ins
4. **Set communication protocol**: Slack channel, daily standup time, escalation path
5. **Confirm the timeline**: Start date, end date, decision date
6. **Review the purchase commitment**: Reconfirm the "if criteria met → purchase" agreement

### Phase 2: Execution (Days 1 to End)

#### Step 2.1: Daily Standups (SE, 15 Minutes/Day)

Brief daily check-in with customer's POC team:
- What was accomplished yesterday?
- What's planned for today?
- Any blockers or issues?
- Are we on track for success criteria?

#### Step 2.2: Weekly Progress Reviews (SE + AE, 60 Minutes/Week)

Deeper review with broader stakeholder group:
- Progress against success criteria (quantified)
- Any scope changes or new requirements (manage carefully)
- Risk assessment: are we on track to meet all criteria?
- Stakeholder sentiment: is the customer team engaged and positive?
- Competitive intelligence: is the customer running a parallel POC with a competitor?

#### Step 2.3: Mid-POC Health Check (Atlas, Mid-Point)

At the midpoint of the POC, Atlas evaluates:
- **Criteria tracking**: Which criteria are on track? Which are at risk?
- **Engagement level**: Is the customer actively participating?
- **Blocker identification**: Any technical or organizational blockers?
- **Competitive signals**: Any indication the customer is evaluating alternatives?

If the POC is at risk, Atlas triggers intervention:
- Additional SE resources
- Executive engagement
- Scope adjustment (with customer agreement)

#### Step 2.4: Issue Resolution (SE, Continuous)

POCs invariably hit issues. The key is rapid resolution:

| Issue Type | Resolution SLA | Owner |
|-----------|---------------|-------|
| Integration bug | 24 hours | SE + Engineering |
| Configuration error | 4 hours | SE |
| Data quality issue | 24 hours | SE + Data team |
| Feature gap (minor) | Document; note as known limitation | SE |
| Feature gap (major) | Escalate to Product; assess workaround | Atlas + SE |
| Customer environment issue | 48 hours (customer-dependent) | SE |

### Phase 3: Evaluation and Close (Final Week + 14 Days)

#### Step 3.1: Success Criteria Assessment (SE, Final Week)

SE prepares a **POC Results Report**:

```
POC RESULTS — [Customer Name]

POC Duration: [Start Date] to [End Date]

MUST-HAVE Criteria Assessment:
1. [Reply rate ≥12%]: ✅ ACHIEVED — 14.3% reply rate across 45 sequences
2. [Salesforce integration ≤5 min sync]: ✅ ACHIEVED — Average sync time: 2.3 minutes
3. [SSO/SAML with Okta]: ✅ ACHIEVED — Configured and tested; all users authenticated
4. [Data accuracy ≥85%]: ✅ ACHIEVED — 89.2% accuracy across 500 enriched contacts

NICE-TO-HAVE Criteria Assessment:
1. [AI Personalization ≥80%]: ⚠️ PARTIALLY — 72% usable drafts; below target but functional
2. [Custom dashboard in 48 hours]: ✅ ACHIEVED — Dashboard created in 36 hours

OVERALL: All MUST-HAVE criteria met. POC is successful.
```

#### Step 3.2: POC Close Meeting (AE + SE + Customer Decision-Maker)

Present the results:
1. Walk through each success criterion with evidence
2. Highlight unexpected wins (outcomes that exceeded expectations)
3. Address any criteria that were partially met
4. Present the purchase proposal (based on pre-agreed commitment)
5. Ask for the commitment: "Based on these results, we'd like to proceed with the purchase as agreed."

#### Step 3.3: Contract Execution (AE, Within 14 Days of POC Close)

- If success criteria met: customer is obligated to purchase per the POC agreement
- If customer hesitates: remind them of the written commitment; escalate to champion
- If customer disputes results: provide detailed evidence; offer additional validation
- If criteria not met: provide remediation plan with timeline; re-evaluate in 30 days

## 5. Agent Responsibilities

| Agent | POC Role |
|-------|---------|
| Atlas | Orchestrates POC process; manages scope; intervenes on at-risk POCs |
| Scout | Monitors competitive POC signals; tracks customer's parallel evaluations |
| Forge | Provisions POC environment; configures integrations; imports data |
| Sage | Researches customer's technical environment; prepares use-case recommendations |
| Judge | Scores POC qualification; validates success criteria; predicts close probability |
| Bard | Composes POC communications; drafts success criteria document; writes results report |
| Flow | Tracks POC timeline; manages SLAs; coordinates daily/weekly cadence |
| Echo | Monitors POC health; tracks success criteria progress; generates POC analytics |

## 6. Target Persona and ICP Criteria

### Ideal POC Candidate

| Criterion | Specification |
|-----------|--------------|
| Deal size | >$50K ACV |
| Company size | 200+ employees |
| POC type | Integration, Performance, or Full Evaluation |
| Success criteria | Pre-agreed and measurable |
| Purchase commitment | Written and signed |
| Champion authority | Can influence or approve purchase |
| Technical team | Available for POC participation |
| Competitive situation | LeadReach is shortlisted (top 2-3) |

### POC Stakeholders

| Stakeholder | Role | Engagement Level |
|-------------|------|-----------------|
| **Technical Buyer** (CTO, VP Engineering, IT Director) | Evaluates technical fit | Daily during POC |
| **User Buyer** (SDR Manager, Sales Ops) | Tests daily workflow | Daily during POC |
| **Economic Buyer** (VP Sales, CRO, CFO) | Approves purchase | Weekly update; final decision |
| **Champion** | Internal advocate | Daily; reports results internally |
| **SE (LeadReach)** | Technical execution | Full-time during POC |
| **AE (LeadReach)** | Commercial management | Weekly check-ins; close |

## 7. Trigger Events That Activate This Playbook

| Trigger | Signal Source | Automated Action |
|---------|-------------|-----------------|
| Customer requests POC | AE conversation | Judge scores POC qualification; Atlas evaluates scope |
| Customer's IT team requires technical validation | AE / CSM note | Forge prepares integration POC proposal |
| Competitor offers POC | Scout intelligence | Atlas proposes competitive POC |
| Customer in evaluation with 3+ vendors | AE note | Offer POC only if shortlisted; define success criteria |
| Enterprise deal stalled on technical concerns | Flow agent (>14 days stalled) | Propose POC to break the stall |
| Customer needs to validate specific use case | AE conversation | Design targeted POC for that use case |
| Customer's board requires proof of concept | AE / champion communication | Design executive POC with ROI focus |

## 8. Email / Sequence Templates

### Template 1: POC Proposal

**Subject**: `leadreach POC proposal for [company]`

> Hi [first name],
>
> Based on our conversations, I'd like to propose a structured POC to validate LeadReach for [company]. Here's the framework:
>
> **POC Type**: [Integration / Performance / Full Evaluation]
> **Duration**: [X weeks] ([Start Date] to [End Date])
> **Scope**: [Specific use cases and workflows to be tested]
> **Success Criteria**: [Summary of must-have criteria]
> **Investment**: [$X] — fully credited toward your purchase if the POC is successful
> **Commitment**: If all must-have criteria are met, [company] commits to purchasing [tier/seats] within 14 days
>
> I've attached the detailed POC proposal with success criteria for your review. Want to schedule 30 minutes to discuss and refine?
>
> [AE name]

### Template 2: POC Kickoff Recap

**Subject**: `POC kickoff — next steps`

> Hi [first name],
>
> Great kickoff today. Here's a summary:
>
> **POC Team**:
> - [Customer]: [names and roles]
> - LeadReach: [SE name] (technical), [AE name] (commercial)
>
> **Success Criteria**: [Link to criteria document]
> **Communication**: Slack channel [#leadreach-poc] + daily standup at [time]
>
> **Week 1 Milestones**:
> 1. CRM integration configured and tested
> 2. First 3 sequences created and sent
> 3. SSO configuration initiated
>
> **Next Standup**: Tomorrow at [time]
>
> [SE name]

### Template 3: POC Results Presentation

**Subject**: `POC results — leadreach × [company]`

> Hi [first name],
>
> The [X]-week POC has concluded. Here are the results against our agreed success criteria:
>
> | Criteria | Target | Actual | Status |
> |----------|--------|--------|--------|
> | [Criteria 1] | [Target] | [Actual] | ✅ |
> | [Criteria 2] | [Target] | [Actual] | ✅ |
> | [Criteria 3] | [Target] | [Actual] | ✅ |
>
> **All must-have criteria were met.** Based on our POC agreement, I'd like to proceed with the purchase of [product/tier/seats].
>
> I've prepared the contract and will send it via DocuSign today. Looking forward to making this official.
>
> [AE name]

## 9. Objection Handling

| Objection | Root Cause | Response |
|-----------|-----------|----------|
| "We don't want to commit to purchase before seeing results" | Risk aversion | "I understand the hesitation. The commitment is conditional — you only purchase if the criteria are met. This protects both sides: you get proof, and we get a committed evaluation (not a tire-kick)." |
| "We need a longer POC period" | Scope too large or uncertainty | "What specific concern needs more time? We can extend for [specific reason], but I want to make sure we're not expanding scope. A 4-week POC with tight criteria is more effective than an 8-week POC with loose criteria." |
| "We don't want to pay for a POC" | Budget concern or lack of commitment | "The POC fee is fully credited toward your purchase — it's not an additional cost. The fee ensures both sides are committed to a serious evaluation. We've found that free POCs have 30% lower conversion rates because neither side is fully invested." |
| "We're running POCs with multiple vendors simultaneously" | Competitive evaluation | "That's fair. Two requests: (1) let's align on success criteria that are consistent across vendors, and (2) let's agree on a decision framework so the POC results lead to a clear choice. Can we discuss?" |
| "Our IT team doesn't have bandwidth for a POC right now" | Resource constraint | "We can minimize IT involvement. Our SE handles most of the setup — IT just needs to provide access credentials and approve the SSO configuration. We can start with a lighter-touch POC." |
| "The success criteria are too aggressive" | Fear of being held to high standards | "Let's discuss. I want criteria that are meaningful to you — not artificially easy or hard. What would you consider a fair target for [metric]?" |
| "What if the POC fails through no fault of LeadReach?" | Concern about environmental issues | "Good question. The success criteria are designed to be within LeadReach's control. If failure is caused by [environmental factor outside our control], we'll document it and discuss options. Fair?" |

## 10. Success Metrics and KPIs

| Metric | Target | Source |
|--------|--------|--------|
| POC qualification rate | >60% of requests qualify | Judge agent |
| POC-to-close conversion rate | >65% | CRM |
| Average POC duration | 2-4 weeks | Flow agent |
| Success criteria achievement rate | >80% of must-have criteria met | SE reports |
| Time from POC close to contract signed | <14 days | CRM |
| POC cost as % of deal value | <5% | Finance |
| Customer satisfaction (POC experience) | >8 NPS | Surveys |
| POC pipeline generated (quarterly) | $500K+ | CRM |
| SE utilization during POC | <50% of time (avoid over-investment) | Resource tracking |
| POC scope creep rate | <20% of POCs experience scope creep | Flow agent |

## 11. Common Pitfalls and How to Avoid Them

| Pitfall | Cause | Prevention |
|---------|-------|-----------|
| POC becomes endless evaluation | No defined timeline or success criteria | Written success criteria + hard end date; Flow agent enforces |
| Scope creep during POC | Customer adds requirements after kickoff | Success criteria document is the scope; changes require written amendment |
| POC with no purchase commitment | AE offers POC without conditional commitment | Judge agent blocks POC without commitment; minimum qualification score 60 |
| SE over-investment | SE spends 40+ hours/week on POC | Atlas caps SE time at 50% during POC; customer must do their part |
| Customer uses POC for free consulting | Customer extracts value without buying | POC fee + purchase commitment; Forge limits POC environment access |
| Success criteria too vague | "Improve outbound" instead of "≥12% reply rate" | Bard drafts measurable criteria; AE negotiates specifics |
| POC results disputed | No clear evidence of criteria being met | SE documents every result with data; Echo tracks metrics automatically |
| No executive engagement during POC | Only IC-level users involved; no decision-maker visibility | Atlas mandates weekly executive update during POC |
| Competitive POC run in parallel | Customer comparing LeadReach and competitor simultaneously | Request head-to-head criteria; ensure LeadReach differentiation is highlighted |
| POC starts before technical readiness | Environment not configured; Day 1 wasted on setup | Forge verifies all integrations before POC kickoff; hard start date |

## 12. Integration Requirements

| Integration | Purpose | Priority |
|-------------|---------|----------|
| CRM (Salesforce/HubSpot) | POC integration testing | Critical |
| POC environment (LeadReach sandbox) | Isolated POC instance | Critical |
| CRM (Salesforce/HubSpot) | Deal tracking, POC stage management | Critical |
| Communication (Slack / Teams) | Daily standups, POC channel | High |
| SSO / Identity provider (Okta / Azure AD) | SSO POC testing | High |
| Email platform (Gmail / Outlook) | Sequence testing | High |
| Project management (Jira / Asana) | POC task tracking | Medium |
| Document management | Success criteria, results report | Medium |

## 13. Example Scenario

**Account**: GlobalPay Systems, 2,000-employee FinTech company

**Deal**: Enterprise tier, 120 seats, $288K ACV

**POC trigger**: Customer's CTO requires technical validation before approving the purchase. Parallel evaluation with Outreach.

**POC design**:
- **Type**: Full Evaluation POC (4 weeks)
- **Scope**: Salesforce integration, sequence performance, SSO with Okta, Data Enrichment accuracy
- **Fee**: $25,000 (credited toward purchase)
- **Success criteria**:
  1. Salesforce integration syncs within 5 minutes (must-have)
  2. Sequence reply rate ≥11% for FinTech ICP (must-have)
  3. Okta SSO works for all POC users (must-have)
  4. Data Enrichment accuracy ≥87% for FinTech contacts (must-have)
  5. AI Personalization generates usable drafts for ≥70% of prospects (nice-to-have)
- **Commitment**: If all must-have criteria met, GlobalPay commits to purchasing 120 Enterprise seats within 14 days

**POC execution**:
1. **Week -1**: Forge provisions POC environment; configures Salesforce sandbox + Okta; imports 500 FinTech contacts.
2. **Day 0**: POC kickoff. 6 GlobalPay participants + LeadReach SE + AE. Daily standups at 9 AM.
3. **Week 1**: SDRs create and send first sequences. Salesforce integration tested. Okta SSO configured.
4. **Day 7**: Weekly review. SSO working. Salesforce sync at 3.2 minutes. First replies coming in.
5. **Week 2**: Full sequence volume. Data Enrichment tested on 200 contacts. AI Personalization tested.
6. **Day 14**: Mid-POC health check. All must-have criteria on track. Reply rate at 13.1%. Data accuracy at 90.5%.
7. **Week 3**: Scale testing — 20 SDRs running sequences simultaneously. Performance under load validated.
8. **Day 21**: Weekly review. All criteria on track. Nice-to-have (AI Personalization) at 68% — slightly below target but functional.
9. **Week 4**: Final testing. Results compilation. POC Results Report prepared.
10. **Day 28**: POC close meeting with CTO + VP Sales + CRO.

**Results**:
1. Salesforce sync: ✅ 2.8 minutes average
2. Reply rate: ✅ 13.1% (target: 11%)
3. Okta SSO: ✅ All users authenticated
4. Data Enrichment: ✅ 90.5% accuracy (target: 87%)
5. AI Personalization: ⚠️ 68% (below 70% target; functional but not "must-have")

**Outcome**: All must-have criteria met. CTO approves. Contract signed within 10 days. $288K ACV deal closed. POC cost ($25K) credited. Net POC investment: $0.

## 14. Escalation Paths

| Situation | Escalation Level | Action |
|-----------|-----------------|--------|
| Customer refuses purchase commitment | VP Sales | Negotiate conditional commitment; no POC without it |
| POC at risk of failing criteria | VP CS + SE Lead | Additional resources; scope adjustment; executive engagement |
| Scope creep >20% beyond original | Atlas + VP Sales | Reset scope; written amendment; no free additions |
| SE resource bottleneck | VP Engineering | Prioritize; add SE support; extend timeline if needed |
| Customer running parallel competitive POC | VP Sales + Competitive Intel | Head-to-head comparison; differentiation focus |
| POC succeeds but customer delays purchase | VP Sales | Enforce written commitment; executive engagement |
| Customer disputes POC results | VP CS + SE Lead | Detailed evidence review; offer additional validation |
| POC fee dispute | VP Sales + Finance | Negotiate; consider waiver for strategic accounts |

## 15. Authoring Notes / Gaps

- Need **POC success criteria library** — pre-built criteria templates by industry and use case.
- Need **POC environment provisioning automation** — reduce setup time from 3-7 days to 1 day.
- Need **POC results dashboard** — real-time tracking of success criteria during POC execution.
- Need **competitive POC playbook** — specific strategies for head-to-head evaluations.
- Need **POC-to-onboarding transition plan** — seamless handoff from POC to production deployment.
- Need **POC cost tracking** — monitor SE time, resources, and POC fee revenue.

These will be addressed in future monthly gap reports.
