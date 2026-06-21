---
title: "Lead Qualification Frameworks — BANT, MEDDIC, MEDDPICC, Champion, ANUM"
slug: lead-qualification-frameworks
category: domain
tags: [qualification, bant, meddic, meddpicc, champion, scoring, sales]
agents: [judge, sage, atlas, bard]
intent_types: [score_lead, build_icp, compose_outreach]
priority: 90
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "The complete reference for lead qualification frameworks. When to use each, how to score, and what evidence each criterion requires."
---

# Lead Qualification Frameworks — BANT, MEDDIC, MEDDPICC, Champion, ANUM

## 1. Why Multiple Frameworks Exist

Lead qualification frameworks are **decision-making rubrics** that help sellers determine whether a prospect is worth pursuing and how to prioritize their time. Different frameworks emerged for different sale types:

- **BANT** (1950s, IBM) — Best for transactional sales, low-ACV, single-decider deals
- **MEDDIC** (1990s, PTC) — Best for enterprise sales, multi-stakeholder, $50K+ ACV
- **MEDDPICC** (2010s, MEDDIC + Partners/Competition) — Best for highly competitive enterprise deals
- **Champion** (modern) — Best for product-led growth, bottom-up SaaS
- **ANUM** (modern) — Best for early-stage startups where Authority matters more than Budget

LeadReach defaults to **MEDDIC for enterprise prospects** and **BANT for SMB**. The Atlas agent selects the framework based on deal size and complexity.

## 2. BANT — Budget, Authority, Need, Timeline

### B — Budget (25 points)
**Question**: Does this prospect have money allocated to solve this problem?

Evidence sources:
- Company funding round and runway (Crunchbase, press releases)
- Public financials (SEC EDGAR) — revenue, cash, burn rate
- Headcount growth — growing companies have budget
- Existing spend on adjacent categories (e.g., already paying for Salesforce → likely has CRM budget)
- Budget cycle — many enterprises budget in Q4 for the next fiscal year

Scoring:
- 25: Confirmed budget for this category, current fiscal year
- 18: Likely budget — funded, growing, adjacent spend confirmed
- 12: Uncertain — funded but no specific evidence of budget for this category
- 6: Limited budget — early-stage, constrained
- 0: No budget — unfunded, declining revenue, layoffs

### A — Authority (25 points)
**Question**: Are we talking to the person who can sign the check?

Evidence sources:
- LinkedIn title (C-suite, VP, Director, Manager)
- Reporting structure (org chart from company website, press releases)
- Decision authority patterns by company size and vertical
- Signatory authority (SEC filings list principal officers)
- Budget approval thresholds (industry norms: $10K Director, $50K VP, $250K C-suite, $1M+ board)

Scoring:
- 25: Economic buyer — confirmed signatory authority for this deal size
- 18: Senior influencer — VP+ who can strongly recommend purchase
- 12: Champion — Director-level internal advocate
- 6: User — individual contributor, no purchasing authority
- 0: Wrong contact — administrative, intern, departed

### N — Need (25 points)
**Question**: Does this prospect have a problem we can solve?

Evidence sources:
- Job postings mentioning specific pain points ("experience scaling Salesforce from 50 to 500 users")
- Glassdoor reviews mentioning process failures
- News mentions of compliance issues, outages, growth challenges
- Technology gaps (e.g., using Excel for CRM → needs real CRM)
- Trigger events (funding → scaling → needs infrastructure)
- Conference talks and podcast appearances by their leaders
- Their customers complaining on social media

Scoring:
- 25: Critical need — public pain signal, urgent problem, fixable by us
- 18: Strong need — clear problem, not yet urgent
- 12: Latent need — would benefit, not yet aware
- 6: Marginal need — minor improvement, not transformational
- 0: No need — wrong fit, wrong size, wrong stage

### T — Timeline (25 points)
**Question**: When will they make a decision?

Evidence sources:
- Explicit statements from prospect (best signal)
- Budget cycle (next fiscal year starts when?)
- Contract renewal dates for incumbent solutions
- Regulatory deadlines (GDPR compliance by X date)
- Trigger events (funding → 6-month spending window)
- Hiring patterns (new VP starts → 90-day onboarding → 90-day evaluation)

Scoring:
- 25: Immediate — decision in <30 days, contract expiring, regulatory deadline
- 18: Near-term — 1-3 months, funded and buying
- 12: Mid-term — 3-6 months, evaluating
- 6: Long-term — 6-12 months, educating
- 0: No timeline — research only, no intent to buy

### BANT Total Scoring
| Score | Grade | Action |
|-------|-------|--------|
| 75-100 | A | Priority — contact daily, executive sponsor engaged |
| 50-74 | B | Active — contact weekly, full sales process |
| 25-49 | C | Nurture — monthly touch, marketing automation |
| 0-24 | D | Disqualify — re-engage in 6 months |

## 3. MEDDIC — Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion

MEDDIC is more rigorous than BANT and produces **better forecasts** for enterprise deals. Each component is documented in the CRM and reviewed weekly.

### M — Metrics (Quantified Business Impact)
**Question**: What is the quantifiable value of solving this problem?

Not "save time" — "$2.3M annual savings from 40% reduction in manual data entry across 200 FTE at $50/hr fully loaded." Metrics must be:
- **Quantified in dollars** (or local currency)
- **Tied to a P&L line** the buyer cares about
- **Defensible** — based on the prospect's own numbers
- **Significant** — at least 3-5× the cost of your solution

Evidence sources: prospect's financial statements, operational metrics, industry benchmarks, analyst reports.

### E — Economic Buyer
**Question**: Who can say "yes" when everyone else says "no"?

The Economic Buyer is the **single individual** who can approve the purchase without further escalation. In enterprise:
- $50K deal: VP-level
- $250K deal: C-level or EVP
- $1M+ deal: CEO or board

Identifying the EB is the most important step in enterprise sales. **Without EB engagement, deals stall in committee.** Use LinkedIn reporting lines, org charts, and ask the Champion directly: "Who else needs to approve this?"

### D — Decision Criteria
**Question**: What factors will the prospect use to evaluate vendors?

Document the explicit criteria: feature requirements, integration needs, security/compliance, vendor stability, pricing model, references, contract terms. Score your solution against each criterion (1-10) and identify gaps. **If you don't know the criteria, you cannot win.**

### D — Decision Process
**Question**: What are the steps from "yes" to signed contract?

Map the procurement process: technical evaluation → security review → legal review → procurement → signature. Each step has an owner, a timeline, and potential blockers. Documenting this prevents the "we just need legal review" surprise that delays deals by 8 weeks.

### I — Identify Pain
**Question**: What is the cost of doing nothing?

The prospect must agree that the status quo is unacceptable. Quantify the pain: "$5M annual revenue loss from cart abandonment." If the prospect cannot articulate the cost of inaction, the deal will not close — they will continue to evaluate indefinitely.

### C — Champion
**Question**: Who inside the prospect's organization is selling on your behalf?

A Champion is **not** a friendly contact. A Champion is someone who:
1. Has influence over the decision
2. Has a personal win from your solution (promotion, bonus, easier job)
3. Will advocate for you when you're not in the room
4. Gives you inside information about the decision process

Champions can be tested by asking them to do something that costs them political capital — e.g., introduce you to the Economic Buyer. If they refuse, they are not a Champion.

## 4. MEDDPICC — Adds Partners and Competition

MEDDPICC extends MEDDIC with two more criteria critical for competitive enterprise deals:

### P — Paper Process (sometimes)
Some interpretations replace "Partners" with "Paper Process" — the legal and procurement steps. Documenting the paper process prevents late-stage surprises.

### I — Identify Pain (same as MEDDIC)

### C — Champion (same as MEDDIC)

### C — Competition
**Question**: Who else is bidding, and what is our win/loss record against them?

Document:
- Incumbent solution (status quo is the #1 competitor)
- Active vendors being evaluated
- Your win rate against each
- Their strengths and weaknesses vs. you
- The prospect's history with each (relationship, references)

### P — Partners
**Question**: Which third parties influence this deal?

System integrators (Accenture, Deloitte), technology partners (AWS, Microsoft), industry analysts (Gartner, Forrester), trade associations. Partners can make or break enterprise deals — get them on your side early.

## 5. When to Use Each Framework

| Deal Type | ACV Range | Cycle Length | Recommended Framework |
|-----------|-----------|--------------|----------------------|
| Self-serve SaaS | <$5K | <30 days | Champion |
| SMB transactional | $5K-$50K | 1-3 months | BANT |
| Mid-market | $50K-$250K | 3-6 months | BANT + Champion |
| Enterprise | $250K-$1M | 6-12 months | MEDDIC |
| Strategic enterprise | $1M+ | 12+ months | MEDDPICC |
| Public sector | Any | 12-24 months | MEDDPICC + Compliance |

## 6. LeadReach Implementation

The `scoreBANT()` and `scoreMEDDIC()` functions in `src/lib/agents/lead-scorer.ts` implement these frameworks. Each function:

1. Takes input scores per criterion (0-25 for BANT, 0-100 for MEDDIC dimensions)
2. Computes a total and a grade
3. Returns a structured breakdown with labels and descriptions

When the Judge agent qualifies a lead, it should:
1. Detect deal size from company signals (revenue, headcount, vertical)
2. Select the appropriate framework
3. Score each criterion using available evidence
4. Mark unknown criteria as "unknown" rather than zero
5. Output the structured scorecard

## 7. Common Scoring Errors

### Error 1: Optimism Bias
Sellers consistently score prospects higher than reality warrants. Counter: require evidence for every score >50%. No evidence = max score of 30%.

### Error 2: Equating Activity with Authority
A prospect who takes your calls and asks great questions is not necessarily a Champion — they may be an intern researching the category. Verify authority via LinkedIn title, tenure, and decision rights.

### Error 3: Single-Source Scoring
Relying only on what the prospect tells you. Counter: triangulate with external data (funding, hiring, news, technology adoption).

### Error 4: Ignoring "Competition = Status Quo"
In most deals, the #1 competitor is "do nothing." If the prospect has no compelling reason to change, the deal will not close regardless of how good your solution is.

### Error 5: Champion Inflation
A friendly contact is not a Champion. Test Champions by asking for something difficult — an EB introduction, internal data, political support.

## 8. Output Schema

The Judge agent's qualification output should follow this structure:

```typescript
{
  prospect_id: string;
  framework: 'BANT' | 'MEDDIC' | 'MEDDPICC' | 'CHAMPION' | 'ANUM';
  total_score: number;  // 0-100
  grade: 'A' | 'B' | 'C' | 'D';
  criteria: {
    [key: string]: {
      score: number;  // 0-100 (normalized from framework's native range)
      label: string;
      evidence: Array<{ source: string; detail: string }>;
      unknown: boolean;  // true if no evidence available
    };
  };
  recommendation: 'contact_immediately' | 'contact_this_week' | 'nurture' | 'disqualify';
  rationale: string;
  next_best_action: string;
  risks: string[];  // things that could derail this deal
  scored_at: string;
}
```

The `evidence` array is **mandatory for any score above 30**. Scores without evidence are scored as 30 maximum.
