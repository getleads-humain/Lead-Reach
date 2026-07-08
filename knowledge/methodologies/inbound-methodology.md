---
title: "Inbound Methodology — Attract, Engage, Delight Framework for B2B AI Lead Generation"
category: methodology
grade: A
last_reviewed: 2026-07-08
tags: [inbound-sales, inbound-methodology, attract-engage-delight, mql-sql, lead-routing, buyer-journey, content-strategy, inbound-qualification, automation, funnel-optimization]
---

# Inbound Methodology — Attract, Engage, Delight Framework for B2B AI Lead Generation

## Executive Summary

Inbound methodology transforms the traditional sales paradigm from interruption to attraction. Rather than chasing prospects with cold outreach, inbound creates a gravitational field of valuable content, experiences, and interactions that draw qualified buyers toward your solution. In B2B, where buyers complete 57-70% of their purchase research before ever contacting a sales rep (Gartner, 2025), the inbound approach is not optional — it is the primary way modern B2B buyers want to engage.

The inbound methodology operates in three phases: **Attract** (draw the right audience to your digital properties), **Engage** (convert visitors into qualified leads and opportunities), and **Delight** (transform customers into advocates who generate referrals and expansion). Each phase has specific strategies, content requirements, metrics, and automation rules that the LeadReach agent pipeline implements and optimizes.

Within the LeadReach platform, inbound is not a passive "build it and they will come" strategy. It is an engineered system that combines content strategy, lead routing automation, qualification scoring, and multi-channel nurturing into a unified pipeline. The Scout agent detects inbound signals, the Forge agent enriches inbound leads with firmographic and intent data, the Judge agent qualifies and routes inbound leads in real time, the Bard agent crafts personalized follow-up sequences, the Flow agent manages nurture journeys, and the Echo agent continuously optimizes conversion rates at every funnel stage.

When implemented correctly, inbound methodology reduces cost-per-lead by 60-80% compared to outbound-only strategies, improves lead-to-opportunity conversion rates by 25-40%, and creates a compounding pipeline effect as delighted customers generate referrals that reduce acquisition costs over time.

## Core Methodology

### The Attract → Engage → Delight Framework

```
                    ATTRACT                    ENGAGE                    DELIGHT
               ┌─────────────┐          ┌─────────────────┐       ┌────────────────┐
               │ Content     │          │ Lead Capture    │       │ Customer       │
               │ SEO         │──────▶   │ Qualification   │─────▶ │ Success        │
               │ Social      │          │ Routing         │       │ Advocacy        │
               │ Events      │          │ Nurture         │       │ Expansion       │
               └─────────────┘          └─────────────────┘       └────────────────┘
                    │                         │                         │
               Strangers                Leads & Opportunities       Promoters
               → Visitors               → MQLs → SQLs → Opps       → Referrals → Upsells
```

### Phase 1: Attract

**Goal**: Draw the right strangers to your digital properties through valuable content and optimized presence. The key word is "right" — traffic without targeting is noise.

**Attract Strategies:**

| Strategy | Description | LeadReach Implementation | Primary Metric |
|----------|-------------|-------------------------|----------------|
| Content Marketing | Create blog posts, guides, research reports, and thought leadership that addresses your ICP's problems | Sage researches topics; Bard drafts content; Echo tracks performance | Organic traffic from ICP-matched companies |
| SEO | Optimize for keywords your ICP searches for at each buyer journey stage | Sage identifies keyword opportunities; Bard optimizes content | Keyword rankings for ICP-relevant terms |
| Social Presence | Distribute content and engage on LinkedIn, X, and industry communities | Bard crafts social posts; Flow schedules distribution | Social referral traffic from target personas |
| Events & Webinars | Host virtual and in-person events that attract your ICP | Atlas plans event strategy; Sage develops content | Registrations from ICP-matched companies |
| Community Building | Create spaces (Slack, Discord, forums) where your ICP congregates | Flow manages community engagement | Active community members from target accounts |
| PR & Thought Leadership | Place insights in industry publications and at conferences | Sage researches publication opportunities | Media mentions driving ICP traffic |
| Partnerships | Co-create content and events with complementary vendors | Atlas identifies partnership opportunities | Partner-referral traffic quality |

**Content Strategy by Funnel Stage:**

| Buyer Journey Stage | Content Type | Purpose | Example Topics | CTA |
|--------------------|--------------|---------|---------------|-----|
| Awareness (Top of Funnel) | Blog posts, infographics, social posts, research reports | Attract visitors by addressing problems they're searching for | "Why SDR Teams Are Losing 60% of Their Selling Time" / "The Real Cost of Manual Lead Research" | Subscribe, follow, read more |
| Consideration (Middle of Funnel) | Comparison guides, webinars, case studies, templates | Engage visitors evaluating solutions | "AI-Powered vs. Manual Prospecting: A Data-Driven Comparison" / "How [Customer] Increased Pipeline 3× with Automated Research" | Download, register, request assessment |
| Decision (Bottom of Funnel) | ROI calculators, product demos, pricing guides, reference calls | Convert evaluators into buyers | "LeadReach ROI Calculator" / "See LeadReach in Action: 15-Minute Demo" / "Customer Reference: [Industry]" | Request demo, start trial, talk to sales |

**Content-to-Pipeline Mapping:**

Every piece of content should be mapped to a specific pipeline stage and lead qualification outcome:

```typescript
interface ContentPipelineMap {
  content_id: string;
  title: string;
  type: 'blog' | 'ebook' | 'webinar' | 'case_study' | 'calculator' | 'demo' | 'template' | 'comparison';
  buyer_journey_stage: 'awareness' | 'consideration' | 'decision';
  target_persona: string;
  target_icp_segment: string;
  
  performance: {
    monthly_views: number;
    icp_match_rate: number;        // % of views from ICP-matched companies
    conversion_rate: number;       // % of views that convert to leads
    lead_to_mql_rate: number;      // % of leads that become MQLs
    mql_to_sql_rate: number;       // % of MQLs that become SQLs
    influenced_pipeline: number;   // $ pipeline with this content in the journey
    influenced_revenue: number;    // $ closed-won with this content in the journey
  };
  
  optimization_opportunities: string[];
}
```

### Phase 2: Engage

**Goal**: Convert attracted visitors into qualified leads, and qualified leads into sales opportunities. The Engage phase is where inbound methodology most directly impacts the sales pipeline.

#### Lead Capture and Conversion

**Conversion Point Architecture:**

| Conversion Point | Placement | Lead Quality | Typical Conversion Rate |
|-----------------|-----------|-------------|----------------------|
| Newsletter signup | Site-wide, blog sidebar | Low (top-of-funnel) | 1-3% |
| Content download (ebook, report) | Blog posts, resource pages | Medium (mid-funnel) | 5-15% |
| Webinar registration | Dedicated landing pages | Medium-High (mid-funnel) | 15-25% |
| Free assessment / audit | Service pages, blog CTAs | High (bottom-funnel) | 3-8% |
| Demo request | Product pages, pricing pages | Very High (bottom-funnel) | 8-15% |
| Contact sales | Contact page, chat | High (bottom-funnel) | 15-30% |
| Free trial / freemium | Product pages | Variable (product-led) | 5-20% |

**Progressive Profiling**: Instead of asking for all information upfront, collect it progressively across multiple interactions:

| Interaction | Fields Collected | Rationale |
|-------------|-----------------|-----------|
| First download | Name, email | Minimize friction; any more reduces conversion |
| Second download | Company, role | Adding context; the visitor has already engaged |
| Third interaction | Industry, team size, biggest challenge | Qualification data; the visitor is showing buying intent |
| Demo request | Budget range, timeline, decision process | Pre-qualification for sales conversation |

#### MQL to SQL Conversion Framework

The transition from Marketing Qualified Lead to Sales Qualified Lead is the most critical — and most commonly broken — point in the inbound pipeline. Research shows that only 13% of MQLs convert to SQLs on average (HubSpot, 2025), and 79% of marketing leads never convert to sales (MarketingSherpa).

**MQL Definition**: A lead that has demonstrated sufficient fit and engagement to warrant sales attention. MQL criteria combine firmographic fit (ICP match) with behavioral intent (engagement signals).

**SQL Definition**: A lead that has been validated by sales as having a real problem, budget potential, and timeline. SQL criteria require active qualification, not just passive engagement.

**MQL → SQL Conversion Framework:**

```
MQL Criteria (Marketing-Side)          SQL Criteria (Sales-Side)
─────────────────────────────          ─────────────────────────
• ICP fit score ≥ 65                   • Problem confirmed (verbal)
• Intent score ≥ 50                    • Budget potential confirmed
• 3+ engagement signals                • Decision process mapped
• Recent activity (≤ 14 days)          • Timeline established
• High-value content consumed           • Stakeholder buy-in initiated
```

**MQL to SQL Routing Rules:**

| MQL Profile | Routing | SLA | Follow-Up Sequence |
|-------------|---------|-----|-------------------|
| ICP fit ≥ 80 + intent ≥ 70 + demo request | Direct to AE | <5 minutes | "High Priority Inbound" — 3-touch, 48-hour sequence |
| ICP fit ≥ 65 + intent ≥ 50 + content download | SDR qualification | <15 minutes | "Warm Inbound" — 5-touch, 7-day sequence |
| ICP fit ≥ 50 + intent ≥ 30 + multiple visits | SDR light touch | <1 hour | "Nurture Grad" — 3-touch, 14-day sequence |
| ICP fit < 50 OR intent < 30 | Marketing nurture | N/A | "Long Nurture" — automated drip, 90-day cycle |

**The SLA Rule**: Every MQL must receive a first touch within the SLA window. Research shows that contacting an inbound lead within 5 minutes is 9× more effective than waiting 30 minutes (Harvard Business Review). The Judge agent enforces SLA compliance and alerts when SLAs are breached.

#### Lead Routing Rules

**Intelligent Routing Matrix:**

| Signal Combination | Route To | Priority | Rationale |
|-------------------|----------|----------|-----------|
| Enterprise ICP + pricing page visit + demo request | Enterprise AE | P1 — Immediate | High-fit, high-intent, bottom-funnel |
| Mid-market ICP + 3 content downloads + webinar attendance | Mid-market SDR | P2 — <15 min | High-fit, moderate-intent, mid-funnel |
| SMB ICP + blog visit + newsletter signup | Marketing automation | P3 — Batch | Low-intent, early funnel; nurture first |
| Non-ICP fit + any engagement | Marketing automation | P4 — Low | Wrong target; nurture for market intel |
| ICP fit + competitor page visit + pricing page visit | Competitive specialist SDR | P1 — Immediate | Active evaluation; competitive urgency |
| ICP fit + career page visit (hiring SDRs) | Territory SDR | P2 — <1 hour | Trigger event; hiring signals budget |

**Routing Automation**:

```typescript
interface LeadRoutingRule {
  id: string;
  name: string;
  conditions: {
    icp_fit_score: { min: number; max: number };
    intent_score: { min: number; max: number };
    engagement_signals: string[];
    content_consumed: string[];
    pages_visited: string[];
    trigger_events: string[];
    company_size: { min: number; max: number };
    industry: string[];
    geography: string[];
  };
  action: {
    route_to: 'enterprise_ae' | 'mid_market_sdr' | 'smb_sdr' | 'marketing_automation' | 'competitive_specialist';
    priority: 'P1' | 'P2' | 'P3' | 'P4';
    sla_minutes: number;
    sequence: string;
  };
  enabled: boolean;
}
```

### Phase 3: Delight

**Goal**: Transform customers into promoters who generate referrals, case studies, and expansion revenue. Delight is the phase that creates the compound effect — every delighted customer becomes a channel.

**Delight Strategies:**

| Strategy | Description | Implementation | Impact Metric |
|----------|-------------|----------------|---------------|
| Customer success program | Proactive onboarding, health monitoring, and value realization tracking | Flow automates health score tracking; Echo monitors for at-risk signals | Net Revenue Retention ≥ 115% |
| Referral program | Structured program with incentives for customer referrals | Bard crafts referral request templates; Flow manages referral tracking | Referral-sourced pipeline ≥ 15% |
| Case study development | Turn customer successes into marketing assets | Sage researches outcomes; Bard drafts case studies | Case study influence on closed deals |
| Community building | Customer community for peer learning and advocacy | Flow manages community engagement | Community-sourced pipeline |
| Expansion selling | Identify and pursue upsell and cross-sell opportunities within existing accounts | Judge identifies expansion signals; Bard crafts expansion outreach | Net Dollar Retention ≥ 120% |
| Review generation | Encourage satisfied customers to leave reviews on G2, Capterra, etc. | Flow sequences review requests at optimal timing | Review volume and rating |

**Customer Health Scoring:**

| Health Signal | Weight | Score | Data Source |
|--------------|--------|-------|-------------|
| Product usage frequency | 25% | 0-100 | Product analytics |
| Feature adoption depth | 15% | 0-100 | Product analytics |
| Support ticket sentiment | 10% | 0-100 | Zendesk/Intercom |
| NPS / CSAT score | 15% | 0-100 | Survey platform |
| Stakeholder engagement | 15% | 0-100 | CRM activity |
| Expansion signals (hiring, new teams) | 10% | 0-100 | Scout monitoring |
| Contract renewal proximity | 10% | 0-100 | CRM data |

**Health Score Thresholds:**

| Health Score | Status | Action |
|-------------|--------|--------|
| 80-100 | Thriving | Request referral; explore expansion; develop case study |
| 60-79 | Healthy | Proactive engagement; monitor for expansion signals |
| 40-59 | At Risk | Immediate CSM intervention; executive outreach |
| 0-39 | Critical | Escalate to leadership; create recovery plan; prevent churn |

## Buyer Journey Alignment

### The Modern B2B Buyer Journey

The B2B buyer journey is no longer linear — it is a messy, multi-channel, multi-stakeholder process. But the underlying psychological stages remain consistent:

| Stage | Buyer Mindset | Questions They Ask | Content They Seek | Seller's Role |
|-------|--------------|-------------------|-------------------|--------------|
| Unaware | "We have a process that works" | None — they don't know there's a problem | Industry trends, benchmark data | **Attract**: Surface unrecognized problems through thought leadership |
| Problem Aware | "Something isn't working" | "Is this normal? Are others experiencing this?" | Diagnostic content, benchmark reports, industry research | **Engage**: Validate the problem; quantify the impact |
| Solution Aware | "We need to fix this" | "What options exist? Which approach is best?" | Comparison guides, vendor evaluations, best practice frameworks | **Engage**: Position your approach as the preferred methodology |
| Vendor Evaluating | "Which vendor should we choose?" | "Who does this best? What does it cost? What's the risk?" | Case studies, ROI calculators, demos, reference calls | **Engage**: Differentiate; prove value; reduce risk |
| Committing | "We're ready to move forward" | "How do we get started? What's the implementation process?" | Onboarding guides, implementation timelines, contract terms | **Convert**: Facilitate the decision; remove friction |
| Implementing | "Let's make this work" | "How do we get value quickly? Who needs to be involved?" | Training, documentation, success plans | **Delight**: Ensure rapid time-to-value |
| Advocating | "This is working great" | "Who else should know about this? How can we do more?" | Referral programs, expansion content, community | **Delight**: Turn success into advocacy |

### Inbound Qualification Automation

The Judge agent automates inbound qualification using a multi-signal scoring system:

```typescript
interface InboundLeadQualification {
  lead_id: string;
  source: string;
  
  // Auto-populated by Forge
  firmographic: {
    company: string;
    industry: string;
    size: number;
    revenue_range: string;
    tech_stack: string[];
    geography: string;
  };
  
  // Computed by Judge
  icp_fit_score: number;         // 0-100
  intent_score: number;          // 0-100
  engagement_depth: number;      // 0-100
  
  // Behavioral signals
  pages_visited: string[];
  content_downloaded: string[];
  webinars_attended: string[];
  email_engagement: string[];
  time_on_site: number;
  visit_frequency: string;
  
  // Qualification outcome
  lead_grade: 'A' | 'B' | 'C' | 'D' | 'F';
  mql_status: boolean;
  sql_readiness: 'ready' | 'nurture' | 'disqualify';
  recommended_route: string;
  recommended_sequence: string;
  
  // Timing
  first_touch: Date;
  last_activity: Date;
  sla_deadline: Date;
  sla_met: boolean;
}
```

**Automated Qualification Rules:**

| Rule | Condition | Outcome |
|------|-----------|---------|
| Fast Track | ICP fit ≥ 80 AND (demo request OR pricing page visit) | Immediate SQL; route to AE with <5 min SLA |
| Warm Nurture Grad | ICP fit ≥ 65 AND 3+ content interactions AND intent ≥ 50 | MQL → SDR qualification with <15 min SLA |
| Slow Burn | ICP fit ≥ 50 AND consistent blog visits AND newsletter subscriber | MQL; add to SDR light-touch sequence |
| False Positive | ICP fit < 40 OR (student email OR competitor email OR free email domain) | Auto-disqualify; route to suppression list |
| Re-engagement | Previous MQL that went cold AND new high-intent activity | Re-activate; route to SDR with priority boost |
| Multi-Thread | Multiple contacts from same account showing activity | Flag as account-level opportunity; coordinate outreach |

## Inbound Metrics and Optimization

### Funnel Metrics — Full Stack

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Monthly organic traffic (ICP-matched) | Growing 10%+ QoQ | Analytics + IP-to-company resolution | Monthly |
| Visitor → Lead conversion rate | 2-5% overall; 8-15% for high-intent pages | Leads / visitors | Weekly |
| Lead → MQL conversion rate | 25-40% | MQLs / leads | Weekly |
| MQL → SQL conversion rate | 13-25% | SQLs / MQLs | Weekly |
| SQL → Opportunity conversion rate | 40-60% | Opps / SQLs | Monthly |
| Opportunity → Close rate | 20-35% | Closed-Won / Opps | Monthly |
| Overall visitor → customer rate | 0.5-2% | Customers / visitors | Monthly |

### Inbound Efficiency Metrics

| Metric | Target | Measurement | Frequency |
|--------|--------|-------------|-----------|
| Cost per MQL | Varies by industry; track trend | Marketing spend / MQLs | Monthly |
| Cost per SQL | Varies; track trend | Marketing spend + SDR cost / SQLs | Monthly |
| Customer Acquisition Cost (inbound) | <12 months payback | Total inbound cost / new customers | Quarterly |
| MQL-to-SQL SLA compliance | ≥ 90% | SLA-met / total MQLs | Weekly |
| Inbound pipeline as % of total pipeline | 40-60% | Inbound pipeline $ / total pipeline $ | Monthly |
| Inbound influenced revenue | Track trend | Revenue with inbound touchpoints / total revenue | Monthly |
| Content ROI | ≥ 5× pipeline influence | Influenced pipeline $ / content production $ | Quarterly |

### Inbound Channel Performance

| Channel | Typical MQL Quality | Typical Volume | Optimization Lever |
|---------|-------------------|---------------|-------------------|
| Organic search | High (intent-driven) | Medium-High | SEO, content quality, keyword targeting |
| Paid search | Medium-High (intent varies) | Medium | Keyword quality, landing page conversion |
| Social (organic) | Medium | Medium | Content format, posting cadence, engagement |
| Social (paid) | Low-Medium | High | Audience targeting, creative quality |
| Email (nurture) | High (warm leads) | Medium | Segmentation, personalization, cadence |
| Webinars | High (engaged leads) | Low-Medium | Topic relevance, promotion, follow-up |
| Referrals | Very High | Low | Customer success, referral program design |
| Events | High | Low | Audience targeting, follow-up speed |
| Community | Medium-High | Low | Engagement quality, value delivery |

### Optimization Framework

The Echo agent runs a continuous optimization loop for the inbound pipeline:

**Weekly Optimization Cycle:**

1. **Analyze**: Review funnel metrics for the past 7 days. Identify the biggest conversion drop-off point.
2. **Hypothesize**: Form a specific hypothesis about what's causing the drop-off and what might fix it.
3. **Test**: Run an A/B test (landing page, CTA, form fields, email subject line, routing rule).
4. **Measure**: Evaluate the test results with statistical significance.
5. **Implement**: If the test wins, implement the change. If it doesn't, document the learning and try another hypothesis.

**Common Optimization Opportunities:**

| Funnel Drop-Off | Likely Cause | Optimization Test |
|----------------|-------------|-------------------|
| High traffic, low lead conversion | Content doesn't match search intent; CTAs are weak | Test different CTA placements, copy, and offers |
| High lead volume, low MQL rate | Lead capture is too easy (low-friction forms); ICP mismatch | Test progressive profiling; add qualification fields |
| High MQL volume, low SQL rate | MQL definition is too loose; SDR follow-up is slow | Tighten MQL criteria; improve SLA compliance |
| High SQL volume, low opportunity rate | SDR qualification is ineffective; leads aren't ready for sales | Improve SDR training; add lead warming sequences |
| High opportunity volume, low close rate | Sales process doesn't match buyer journey; competitive losses | Improve demo customization; add competitive enablement |

## Content Strategy for Each Funnel Stage

### Awareness Stage Content Blueprint

| Content Type | Production Frequency | Distribution Channel | Success Metric |
|-------------|---------------------|---------------------|----------------|
| Blog post (1,500-2,500 words) | 3-4 per week | Organic search, social, newsletter | Traffic from ICP-matched companies |
| Industry research report | 1 per quarter | Gated download, PR, social | Downloads from ICP companies |
| Infographic / data visualization | 2 per month | Social, blog embeds | Social shares, backlinks |
| Short-form video (< 2 min) | 2-3 per week | LinkedIn, YouTube Shorts | Views from target personas |
| Podcast episode | 1 per week | Apple, Spotify, website | Listeners from ICP industries |

### Consideration Stage Content Blueprint

| Content Type | Production Frequency | Distribution Channel | Success Metric |
|-------------|---------------------|---------------------|----------------|
| Comparison guide | 1 per quarter | Gated download, blog | MQLs generated |
| Webinar (live) | 2 per month | Email, social, partner channels | Registrations from ICP companies |
| Case study | 1 per month | Website, email, sales enablement | SQLs influenced |
| Template / toolkit | 1 per month | Gated download | MQLs generated |
| Buyer's guide | 1 per quarter | Gated download, SEO | MQLs generated |

### Decision Stage Content Blueprint

| Content Type | Production Frequency | Distribution Channel | Success Metric |
|-------------|---------------------|---------------------|----------------|
| ROI calculator | Always available | Product pages, blog, email | Demo requests |
| Product demo video | 1 per quarter (updated) | Product pages, YouTube | Demo requests |
| Pricing guide | Always available | Pricing page, email | Pricing page visits → demos |
| Reference call program | Ongoing | Sales team requests | Close rate on reference-influenced deals |
| Competitive battle card | Updated quarterly | Sales enablement | Competitive win rate |
| Security / compliance docs | Always available | IT review requests | Security review pass rate |

## Inbound + Outbound Integration (Smarketing)

The highest-performing B2B pipelines integrate inbound and outbound into a unified system where each motion reinforces the other.

### Inbound-Informed Outbound

| Inbound Signal | Outbound Action | Benefit |
|---------------|----------------|---------|
| Company visited pricing page but didn't convert | SDR calls within 5 minutes with personalized context | 9× higher contact rate than cold outreach |
| Multiple contacts from same account consumed content | Coordinate multi-threaded outbound to the account | Higher account-level engagement and conversion |
| High-fit company downloaded a specific case study | SDR references that case study industry in outreach | Personalized, relevant outreach that shows you're paying attention |
| High-fit company attended a webinar but didn't request a demo | SDR follows up with webinar-specific insight | Warm follow-up with shared context |

### Outbound-Informed Inbound

| Outbound Signal | Inbound Action | Benefit |
|----------------|---------------|---------|
| SDR hears the same objection repeatedly | Create content that addresses the objection preemptively | Reduced objection frequency in future deals |
| Competitor is mentioned in 30%+ of calls | Develop competitive comparison content for SEO | Capture competitor evaluation search traffic |
| Specific industry is converting well outbound | Create industry-specific landing pages and content | Accelerate inbound conversion in that vertical |
| Specific persona is most responsive outbound | Tailor inbound CTAs and messaging to that persona | Higher conversion rates from inbound content |

## AI Agent Integration

### Atlas (Strategic Orchestrator)

Atlas orchestrates the inbound pipeline end-to-end:
- Determines the inbound strategy based on ICP, market context, and pipeline targets
- Coordinates content strategy with sales strategy
- Balances inbound and outbound investment based on performance data
- Adjusts routing rules and SLAs based on pipeline health

### Scout (Discovery)

Scout detects inbound-relevant signals:
- Monitors for company-level visits to website (reverse IP lookup)
- Tracks social engagement and content interactions
- Detects community activity and forum mentions
- Surfaces trigger events that create inbound opportunities (funding, hiring, leadership changes)

### Forge (Enrichment)

Forge enriches inbound leads instantly:
- Resolves anonymous website visitors to company identities
- Enriches form submissions with firmographic and technographic data
- Identifies the full buying committee at the lead's company
- Adds intent data signals to inbound lead profiles
- Applies data quality scoring to ensure routing accuracy

### Sage (Research)

Sage supports inbound content strategy:
- Researches topic opportunities based on ICP search behavior
- Analyzes competitive content gaps (what topics competitors rank for that we don't)
- Provides industry benchmarks and data for content creation
- Researches customer outcomes for case study development

### Judge (Qualification & Routing)

Judge is the brain of inbound qualification:
- Computes real-time ICP fit scores for every inbound lead
- Evaluates intent and engagement signals
- Assigns lead grades and MQL/SQL status
- Routes leads to the appropriate SDR or AE based on routing rules
- Enforces SLA compliance and alerts on breaches
- Identifies when a lead should be promoted from nurture to active outreach

### Bard (Outreach Composition)

Bard crafts inbound-specific outreach:
- Personalizes follow-up based on the specific content the lead consumed
- References the lead's company context in the first touch
- Adjusts messaging tone based on the lead's funnel position (awareness vs. decision)
- Creates nurture sequence content for leads not yet ready for sales

### Flow (Pipeline & Sequencing)

Flow manages inbound nurture journeys:
- Enrolls leads in appropriate nurture sequences based on grade and funnel position
- Manages progressive profiling through form sequencing
- Triggers lead escalation when engagement signals cross the MQL or SQL threshold
- Coordinates multi-touch, multi-channel nurture across email, social, and retargeting
- Manages re-engagement sequences for cold leads

### Echo (Analytics & Reporting)

Echo optimizes the inbound pipeline:
- Tracks full-funnel conversion metrics
- Identifies the biggest conversion drop-off points
- Runs A/B test analysis for inbound experiments
- Measures content ROI across the pipeline
- Generates the weekly inbound performance report
- Recommends optimization actions based on funnel analysis

## Best Practices & Anti-Patterns

### Best Practices

1. **Respond to inbound leads within 5 minutes.** The 5-minute response window is the single most important inbound metric. After 5 minutes, contact rates drop 9×. After 30 minutes, the lead is effectively cold.

2. **Score and route before you respond.** A fast response to the wrong lead is as wasteful as a slow response to the right one. Judge scores and routes in <30 seconds so the right SDR gets the right lead immediately.

3. **Personalize follow-up to the inbound signal.** If a lead downloaded a case study about SDR productivity, your first email should reference SDR productivity — not your company's history. Context is king in inbound follow-up.

4. **Treat MQL-to-SQL as a process, not a handoff.** The transition from marketing to sales is not a baton pass — it's a joint qualification process. SDRs should validate, not assume, marketing's qualification.

5. **Nurture with value, not just frequency.** Every nurture touch should deliver something useful — an insight, a resource, a benchmark. If you're sending "just checking in" emails, you're training leads to ignore you.

6. **Close the loop on content performance.** Track which content influences pipeline and revenue, not just traffic and downloads. A blog post that generates 10,000 views but zero pipeline is entertainment, not marketing.

7. **Align SLAs between marketing and sales.** Marketing commits to delivering X MQLs per month with Y% ICP fit. Sales commits to contacting MQLs within Z minutes and converting W% to SQLs. Both sides own the number.

8. **Use progressive profiling, not form friction.** Long forms kill conversion. Ask for essential information first, then collect qualification data over subsequent interactions. A name and email today is worth more than a 10-field form that nobody completes.

### Anti-Patterns

1. **The Lead Firehose.** Routing every lead to sales regardless of quality. This drowns SDRs in unqualified leads, destroys SLA compliance, and ensures that the good leads get buried.

2. **The Set-and-Forget Nurture.** Building a nurture sequence once and never updating it. Buyer needs, market conditions, and competitive dynamics change. Nurture content must evolve.

3. **The Vanity Metric Trap.** Optimizing for traffic, downloads, and MQLs without tracking pipeline and revenue impact. Activity without outcome is cost without return.

4. **The Slow Response.** Treating inbound leads the same as outbound prospects. Inbound leads have a perishable window of interest — measured in minutes, not days. A 24-hour response to an inbound demo request is a 24-hour opportunity for a competitor.

5. **The Generic Follow-Up.** "Thanks for downloading our ebook! Would you like a demo?" This ignores the context of the lead's engagement and treats every lead the same. Personalize to the signal.

6. **The Marketing-Sales Silo.** Marketing optimizes for MQL volume; sales complains about MQL quality. Neither side is aligned on the definition of a qualified lead. Fix this with a shared MQL/SQL definition and mutual SLAs.

7. **The Black Hole Between MQL and SQL.** Leads enter the marketing funnel, get scored as MQLs, and... disappear. No SDR follow-up, no tracking, no feedback. The MQL-to-SQL stage is where most inbound pipelines leak the most value.

## Metrics & KPIs Summary

### Full Funnel Dashboard

| Stage | Primary Metric | Target | Alert If |
|-------|---------------|--------|----------|
| Attract | Monthly ICP-matched organic traffic | Growing 10% QoQ | Declining 2+ months |
| Capture | Visitor → Lead conversion rate | ≥ 3% | < 2% |
| Qualify | Lead → MQL conversion rate | ≥ 30% | < 20% |
| Route | MQL → SDR SLA compliance | ≥ 90% within SLA | < 80% |
| Convert | MQL → SQL conversion rate | ≥ 18% | < 10% |
| Progress | SQL → Opportunity rate | ≥ 50% | < 35% |
| Close | Opportunity → Win rate | ≥ 25% | < 15% |
| Delight | Net Revenue Retention | ≥ 115% | < 100% |
| Compound | Referral-sourced pipeline % | ≥ 15% | < 5% |

## Cross-References

- **[Lead Scoring Deep Dive](/knowledge/methodologies/lead-scoring-deep-dive.md)** — The scoring system that powers inbound lead qualification and routing
- **[MEDDIC/MEDDPICC Framework](/knowledge/methodologies/meddic-meddpicc-framework.md)** — MEDDPICC qualification for inbound leads that reach the sales team
- **[SPIN Selling Methodology](/knowledge/methodologies/spin-selling-methodology.md)** — SPIN discovery for inbound leads that convert to sales conversations
- **[Value Selling Framework](/knowledge/methodologies/value-selling-framework.md)** — Value articulation for converting inbound evaluators into buyers
- **[Sales Playbook Design](/knowledge/methodologies/sales-playbook-design.md)** — Integrating inbound methodology into the broader sales playbook
- **[Judge Agent Training Manual](/knowledge/agents/judge.md)** — The agent that scores and routes inbound leads
- **[Flow Agent Training Manual](/knowledge/agents/flow.md)** — The agent that manages inbound nurture sequences
- **[Echo Agent Training Manual](/knowledge/agents/echo.md)** — The agent that optimizes inbound funnel performance
