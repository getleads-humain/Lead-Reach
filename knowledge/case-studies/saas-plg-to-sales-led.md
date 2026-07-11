---
title: "SaaS PLG to Sales-Led Conversion"
category: case-study
grade: A
last_reviewed: 2026-07-08
tags: [saas, plg, product-led, sales-assisted, conversion, icp]
---

# SaaS PLG to Sales-Led Conversion

## 1. Customer Profile

| Attribute | Value |
|-----------|-------|
| Company | CloudMetrics (pseudonym) |
| Industry | SaaS - Data Analytics |
| ARR | $5M |
| Employees | 80 |
| Customers | 2,000+ free users, 200 paid |
| Sales Model | Transitioning from PLG to sales-led |
| Primary Competitors | Datadog, New Relic, Grafana |
| Key Differentiator | Custom dashboard builder, no-code analytics |
| Funding Stage | Series A ($15M raised) |
| Sales Team | 3 AEs, 4 SDRs, 2 Solutions Engineers |
| NPS (Paid Users) | 72 |
| Free-to-Paid Conversion (Pre-LeadReach) | 3.2% |

### Background

CloudMetrics had built a successful product-led growth engine with 2,000+ free-tier users and 200 paying customers generating $5M ARR. The platform allowed engineering teams to build custom monitoring dashboards without code, and the free tier (5 dashboards, 3-day data retention) was generous enough to attract organic signups but limited enough to create upgrade pressure. The product had strong organic adoption—60% of new signups came through word-of-mouth and developer community referrals.

The challenge was that CloudMetrics' revenue was heavily concentrated: 80% of ARR came from 20 accounts, with the remaining 180 paid customers averaging just $4K ACV. The free-tier user base contained dozens of enterprise accounts (200+ employees, $50K+ potential ACV) who were using the free product extensively but had never been contacted by sales. The company's PLG motion had no mechanism for identifying, engaging, and converting these high-potential accounts.

The board's growth plan required reaching $15M ARR in 18 months, which was impossible through PLG alone. The free-to-paid conversion rate of 3.2% was well below the industry average of 5-7% for PLG companies, and the average paid ACV of $8K was far below the enterprise potential of $50-100K. CloudMetrics needed to build a sales-led motion that could identify and convert high-value accounts within their existing user base, while also prospecting into net-new enterprise accounts.

## 2. Challenge

CloudMetrics had built a successful product-led growth engine with 2,000+ free users, but struggled to convert these users into high-value enterprise accounts. Their challenges included:

- **No ICP definition**: Free users spanned too many segments; sales team couldn't prioritize. The 2,000+ free users included solo developers, small startups, mid-market companies, and enterprise engineering teams. The sales team was treating all "marketing qualified leads" equally, resulting in AEs spending 60% of their time on $4K deals that should have been self-serve while missing $50K+ enterprise opportunities.

- **Manual prospecting**: SDRs spent 70% of time researching, 30% actually selling. Without any enrichment or scoring, SDRs manually reviewed each free user's company, estimated potential, and crafted individual outreach. This process took 30-45 minutes per account and was fundamentally unscalable.

- **Low conversion**: Free-to-paid conversion rate was 3.2% (industry avg: 5-7%). The upgrade path was entirely self-serve—users had to discover their own need for paid features and navigate the upgrade process without any sales assistance. Enterprise accounts that could benefit from the paid tier were hitting free-tier limits and churning rather than upgrading.

- **No scoring model**: All leads treated equally regardless of account potential. There was no mechanism to distinguish a solo developer using 1 dashboard from a Fortune 500 engineering team hitting the 5-dashboard limit daily. The CRM contained 2,000+ "leads" with no prioritization.

- **Inconsistent outreach**: Each SDR crafted their own messaging, no A/B testing. With 4 SDRs writing 4 different outreach approaches, there was no systematic learning about what messaging worked. Some SDRs achieved 5% reply rates while others hit 15%, but the team couldn't identify why.

### PLG vs. Sales-Led Dynamics

| Dimension | PLG Motion | Sales-Led Motion | CloudMetrics Gap |
|-----------|-----------|-----------------|-----------------|
| Acquisition | Self-serve signup | Outbound + inbound qualification | No outbound capability |
| Qualification | Product usage thresholds | ICP matching, BANT scoring | No scoring model |
| Conversion | Upgrade prompt | Sales-assisted expansion | No sales assist for upgrades |
| Expansion | Self-serve add-ons | Account management, cross-sell | No account management |
| Retention | Product stickiness | Customer success, QBRs | No proactive retention |
| Pricing | Transparent, self-serve | Custom, negotiated | No enterprise pricing tier |
| Contract | Monthly self-serve | Annual negotiated | No annual contract option |

## 3. Approach

### Agent Configuration

| Agent | Role | Key Configuration |
|-------|------|-------------------|
| Atlas | ICP & Strategy | PLG-to-enterprise ICP, usage-based scoring, LTV analysis |
| Scout | Discovery | Product usage database integration, free-user ICP matching |
| Sage | Research | Account-specific research, buying committee identification |
| Judge | Qualification | Usage threshold scoring, PQL (Product Qualified Lead) identification |
| Bard | Outreach | Usage-aware personalization, upgrade-path messaging |
| Flow | Pipeline | Lead routing, stage progression, deal-at-risk alerts |
| Forge | Enrichment | Firmographic enrichment of free users, technographic data |
| Echo | Analytics | PLG-to-SQL conversion tracking, pipeline velocity measurement |

### Phase 1: ICP Definition (Weeks 1-2)

Atlas analyzed the existing customer base to identify the highest-LTV patterns:

**LTV Analysis of Existing Paid Customers:**

| Segment | Count | Avg. ACV | Avg. LTV | Retention | Expansion Rate |
|---------|-------|----------|----------|-----------|---------------|
| Enterprise (500+ employees) | 12 | $52K | $208K | 95% | 28% annual |
| Mid-Market (50-500 employees) | 45 | $14K | $42K | 88% | 12% annual |
| SMB (10-50 employees) | 80 | $5K | $12K | 75% | 5% annual |
| Solo/Indie (<10 employees) | 63 | $2K | $4K | 60% | 2% annual |

**ICP Tier Definition:**

| Tier | Criteria | Target ACV | Sales Motion | Priority |
|------|----------|------------|--------------|----------|
| Enterprise | 500+ employees, B2B SaaS/tech, data team of 5+ | $50K+ ACV | AE-led, full sales cycle | Tier 1 |
| Mid-Market | 50-500 employees, B2B, technical product | $15K+ ACV | AE-led, compressed cycle | Tier 2 |
| SMB | 10-50 employees, any industry | $5K ACV | SDR → self-serve upgrade | Tier 3 |
| Solo/Indie | <10 employees, individual use | $2K ACV | Self-serve only (no sales touch) | Exclude |

**Product Usage Scoring (PQL Model):**

| Usage Signal | Weight | PQL Threshold | Rationale |
|-------------|--------|---------------|-----------|
| Dashboards created | 20% | 4+ (approaching 5 limit) | Hitting free tier ceiling |
| Team members invited | 25% | 3+ | Multi-user = organizational use |
| Data sources connected | 15% | 3+ | Deep platform commitment |
| API calls/month | 20% | 10K+ | Heavy usage = high value |
| Alert rules configured | 10% | 2+ | Monitoring dependency |
| Weekly active days | 10% | 4+ out of 7 | Daily habit formed |

**PQL Score Calculation:**

```
PQL_Score = (dashboards_created/5 × 0.20) + (team_members/10 × 0.25) + 
            (data_sources/5 × 0.15) + (api_calls/50K × 0.20) + 
            (alert_rules/5 × 0.10) + (active_days/7 × 0.10) × 100
```

| PQL Range | Classification | Action | Expected Conversion |
|-----------|---------------|--------|-------------------|
| 80-100 | Hot PQL | Immediate AE outreach (within 24 hours) | 25-35% |
| 60-79 | Warm PQL | SDR outreach within 48 hours | 12-20% |
| 40-59 | Developing | Automated nurture sequence | 5-8% |
| 20-39 | Cold | Continued product engagement tracking | 2-3% |
| 0-19 | Inactive | Re-engagement campaign or exclude | <1% |

### Phase 2: Pipeline Discovery (Weeks 2-4)

Scout connected to CloudMetrics' product usage database and identified hidden enterprise accounts:

**Free User Base Analysis:**

| Category | Free Users | ICP Match | PQL Score > 60 |
|----------|-----------|-----------|-----------------|
| Enterprise (500+ employees) | 85 | 52 (61%) | 34 (40%) |
| Mid-Market (50-500 employees) | 310 | 180 (58%) | 72 (23%) |
| SMB (10-50 employees) | 780 | 420 (54%) | 85 (11%) |
| Solo/Indie (<10 employees) | 825 | 0 (0%) | 0 (0%) |
| **Total** | **2,000** | **652 (33%)** | **191 (10%)** |

This was the critical insight: 52 enterprise accounts were using the free product, 34 of them were high-intent (PQL > 60), and not a single one had been contacted by sales. These 34 accounts represented an estimated $1.7M in potential ARR—more than CloudMetrics' entire current ARR from paid enterprise customers.

**Enterprise Free User Examples (Anonymized):**

| Account | Employees | PQL Score | Dashboards | Team Members | Data Sources | API Calls/Month |
|---------|-----------|-----------|------------|--------------|--------------|-----------------|
| Account A | 2,500 | 92 | 5 (at limit) | 8 | 4 | 45K |
| Account B | 1,200 | 85 | 5 (at limit) | 6 | 3 | 28K |
| Account C | 800 | 78 | 4 | 5 | 3 | 22K |
| Account D | 3,500 | 88 | 5 (at limit) | 7 | 5 | 38K |
| Account E | 600 | 71 | 4 | 4 | 3 | 15K |

### Phase 3: Automated Enrichment (Weeks 3-5)

Forge enriched all 652 ICP-matched users with firmographic data:

**Enrichment Pipeline:**

```
[Product Usage DB] → [Company Domain Extraction] → [Clearbit Enrichment]
                                                       ↓
                                              [Apollo.io Contact Data]
                                                       ↓
                                              [LinkedIn Firmographic Verification]
                                                       ↓
                                              [Technographic Detection (BuiltWith)]
                                                       ↓
                                              [Funding Data (Crunchbase)]
                                                       ↓
                                              [ICP Score Assignment (Atlas)]
                                                       ↓
                                              [PQL Score Integration (Judge)]
                                                       ↓
                                              [Priority Classification]
```

**Enrichment Fields Added:**

| Field | Source | Use | Example |
|-------|--------|-----|---------|
| company_name | Clearbit | Account identification | "Acme Corp" |
| employee_count | Clearbit | ICP tiering | 1,200 |
| industry | Clearbit | Personalization | "B2B SaaS" |
| revenue_range | Clearbit | Deal sizing | "$50-100M" |
| tech_stack | BuiltWith | Competitive intel | "Datadog, PagerDuty" |
| funding_stage | Crunchbase | Trigger events | "Series C, $30M" |
| key_contacts | Apollo | Decision-maker identification | CTO, VP Eng, Data Lead |
| linkedin_urls | Apollo | Multi-channel outreach | Profile URLs |
| current_monitoring_tool | BuiltWith | Competitive displacement | "Datadog" |

**Trigger Event Detection:**

Scout continuously monitored for trigger events that indicated buying readiness:

| Trigger Event | Source | Priority Boost | Recommended Action |
|--------------|--------|---------------|-------------------|
| PQL score crosses 60 threshold | Product DB | +2 tiers | Immediate outreach |
| Team member added to free account | Product DB | +1 tier | Welcome + upgrade info |
| Dashboard limit hit (5/5) | Product DB | +2 tiers | "Need more dashboards?" outreach |
| Company announces funding round | Crunchbase | +1 tier | Congratulations + expansion messaging |
| New CTO/VP Eng hired | LinkedIn | +1 tier | New leader introduction |
| Current monitoring tool contract renewal | BuiltWith/est. | +2 tiers | Competitive displacement messaging |
| 3+ users from same company signup in 7 days | Product DB | +2 tiers | Viral adoption outreach |

### Phase 4: Targeted Outreach (Weeks 4-12)

Bard created usage-aware, persona-specific sequences with deep personalization:

**Enterprise CTO Sequence (7-touch, 21-day):**

| Touch | Day | Channel | Content | Personalization Source |
|-------|-----|---------|---------|----------------------|
| 1 | 1 | Email | "Your team is hitting dashboard limits" + usage summary | Product usage data |
| 2 | 3 | LinkedIn | Connection + "Your engineering team's monitoring setup" | LinkedIn profile |
| 3 | 5 | Email | Competitive comparison: CloudMetrics vs. [their current tool] | Technographic data |
| 4 | 8 | LinkedIn | Share engineering leadership article | Content alignment |
| 5 | 10 | Email | Case study: "[Similar company] migrated from [their tool] to CloudMetrics" | Technographic + peer match |
| 6 | 14 | Email | ROI calculator: "Your team's current monitoring cost vs. CloudMetrics" | Usage data + competitor pricing |
| 7 | 18 | Email | Offer: Custom demo with your actual dashboard data | Product usage context |

**Mid-Market Data Team Lead Sequence (6-touch, 18-day):**

| Touch | Day | Channel | Content | Personalization Source |
|-------|-----|---------|---------|----------------------|
| 1 | 1 | Email | "You've built [X] dashboards—here's what's behind the paywall" | Product usage |
| 2 | 3 | LinkedIn | Connection request referencing their data team | LinkedIn research |
| 3 | 6 | Email | Feature comparison: Free vs. Pro for their use case | Usage pattern analysis |
| 4 | 9 | Email | Peer case study: similar-size team, similar dashboard patterns | Peer matching |
| 5 | 12 | LinkedIn | Share data engineering best practices | Content |
| 6 | 15 | Email | Limited-time upgrade offer: 30-day Pro trial | Time-limited CTA |

**Personalization Depth Framework:**

| Level | Personalization Signals | Example | Reply Rate (Observed) |
|-------|------------------------|---------|----------------------|
| Level 0 | Name + company only | "Hi [Name], CloudMetrics can help [Company]..." | 3% |
| Level 1 | + Industry/role | "...data teams at [industry] companies like yours..." | 6% |
| Level 2 | + Product usage | "...I noticed your team has built [X] dashboards..." | 12% |
| Level 3 | + Competitive context | "...and you're currently using [Competitor], which means..." | 18% |
| Level 4 | + Trigger event | "...congratulations on your Series C—here's how CloudMetrics scales with you..." | 24% |
| Level 5 | + Peer comparison | "...3 similar companies in your segment have upgraded in the last quarter..." | 28% |

**Key Insight**: Personalization depth directly correlated with reply rate. Bard-generated emails using 3+ personalization signals (Level 3+) achieved 28% reply rate vs 8% for generic templates (Level 0-1). This was the single most impactful finding of the entire engagement.

### Phase 5: Pipeline Management (Weeks 5-52)

Flow automated lead routing and stage progression:

**Lead Routing Rules:**

| ICP Tier × PQL Score | Routing | SLA | Sales Motion |
|----------------------|---------|-----|--------------|
| Enterprise + Hot PQL (80+) | Direct to AE | 4-hour response | Executive sponsor + full cycle |
| Enterprise + Warm PQL (60-79) | SDR → AE | 24-hour response | SDR qualification → AE handoff |
| Enterprise + PQL < 60 | SDR nurture | 48-hour first touch | Long-term nurture + trigger monitoring |
| Mid-Market + Hot PQL | Direct to AE | 8-hour response | Compressed sales cycle |
| Mid-Market + Warm PQL | SDR → AE | 24-hour response | SDR qualification → AE or self-serve |
| Mid-Market + PQL < 60 | Automated nurture | Weekly email | Self-serve upgrade path |
| SMB (any PQL) | Automated nurture | Monthly email | Self-serve only |

**Pipeline Stages:**

| Stage | Duration Target | Key Actions | Exit Criteria |
|-------|----------------|-------------|---------------|
| 1. PQL Identified | 0-4 hours | Automated alert, routing, research | Rep assigned |
| 2. First Contact | 4-24 hours | Personalized outreach, usage-aware messaging | Meeting booked |
| 3. Discovery | 1-2 weeks | Usage review, pain identification, ICP validation | Qualified opportunity |
| 4. Technical Eval | 2-4 weeks | Demo, POC, competitive comparison | Technical win |
| 5. Commercial | 1-2 weeks | ROI presentation, pricing, negotiation | Verbal commitment |
| 6. Closed Won | 1 week | Contract execution, onboarding kickoff | Signature + payment |

**Deal-at-Risk Alerts:**

| Alert Condition | Trigger | Action |
|----------------|---------|--------|
| No response after 3 touches | 14 days inactive | Switch to alternate persona on buying committee |
| Meeting no-show | Meeting missed | Auto-reschedule + value-add content |
| PQL score declining | Usage dropping | Re-engagement campaign |
| Champion leaves company | LinkedIn job change | Re-map buying committee |
| Competitor tool detected | BuiltWith scan | Competitive displacement messaging |

## 4. 90-Day Implementation Timeline

| Week | Phase | Key Activities | Milestones |
|------|-------|---------------|------------|
| 1 | ICP Build | Atlas LTV analysis, ICP tier definition, PQL model creation | ICP + PQL model approved |
| 2 | Integration | Product DB webhook, Clearbit + Apollo connection | Data flowing into LeadReach |
| 2-3 | Discovery | Scout free-user analysis, ICP matching, PQL scoring | 652 ICP-matched users identified |
| 3-4 | Enrichment | Forge firmographic enrichment, trigger event setup | All records enriched |
| 4-5 | Outreach Design | Bard sequence creation, personalization framework | All sequences tested |
| 5 | Launch | Begin Hot PQL outreach (34 enterprise accounts) | First meetings booked |
| 6-8 | Optimize | A/B test personalization depth, refine PQL thresholds | Reply rate above 15% |
| 8-10 | Scale | Expand to Warm PQL, Mid-Market tier | Pipeline exceeds $3M |
| 10-13 | Full Pipeline | All ICP tiers active, routing rules operational | Target metrics on track |

## 5. Results (90 Days)

### Before/After Metrics

| Metric | Before LeadReach | After LeadReach | Change | Impact |
|--------|-----------------|-----------------|--------|--------|
| Free-to-paid conversion | 3.2% | 9.7% | +203% | 3x more free users converting |
| Enterprise meetings booked | 3/month | 12/month | +300% | Consistent enterprise access |
| Sales cycle (Enterprise) | 85 days | 52 days | -39% | Usage-aware selling accelerating |
| SDR efficiency (talk time) | 30% | 65% | +117% | Reps selling, not researching |
| Pipeline value | $1.2M | $4.8M | +300% | 4x pipeline coverage |
| Average deal size | $8K ACV | $24K ACV | +200% | Enterprise deals raising ACV |
| Cost per qualified lead | $180 | $45 | -75% | Automated qualification |
| Hot PQL response rate | N/A | 35% | New metric | Highest-intent leads responding |
| Warm PQL response rate | N/A | 18% | New metric | Usage-aware outreach working |
| Time to first contact (PQL) | N/A | 6 hours | New metric | Speed-to-lead optimized |

### PQL Conversion Funnel (90 Days)

| Stage | Hot PQL (34 accounts) | Warm PQL (48 accounts) | Total (82 accounts) |
|-------|----------------------|------------------------|---------------------|
| Contacted | 34 (100%) | 48 (100%) | 82 (100%) |
| Meeting Booked | 19 (56%) | 14 (29%) | 33 (40%) |
| Qualified Opportunity | 14 (41%) | 8 (17%) | 22 (27%) |
| Proposal Sent | 10 (29%) | 5 (10%) | 15 (18%) |
| Closed Won | 7 (21%) | 3 (6%) | 10 (12%) |

### ROI Calculation

| Investment Component | Annual Cost |
|---------------------|-------------|
| LeadReach Platform (Professional) | $36,000 |
| Data Enrichment (Clearbit + Apollo) | $12,000 |
| Integration Development | $5,000 |
| Sales Team Training | $3,000 |
| **Total Investment** | **$56,000** |

| Return Component | Annual Value |
|-----------------|--------------|
| Additional enterprise ARR closed | $720,000 |
| Additional mid-market ARR closed | $288,000 |
| SDR time savings (4 SDRs × 8 hrs/wk × $30/hr) | $49,920 |
| Reduced churn (proactive engagement) | $85,000 |
| **Total Annual Return** | **$1,142,920** |

| ROI Metric | Value |
|------------|-------|
| ROI | 1,941% |
| Payback Period | 18 days |
| Net Present Value (3-year, 10% discount) | $2.8M |

## 6. Key Decision Points

1. **Week 1: ICP Tiering vs. One-Size-Fits-All** — CMO initially wanted to treat all free users as potential enterprise accounts. Atlas LTV analysis showed enterprise accounts were 13x more valuable than solo users. Decision: adopt 4-tier ICP with solo/indie excluded from sales motion entirely.
2. **Week 2: PQL Threshold Debate** — Sales wanted PQL threshold at 40 (more leads); marketing wanted 80 (higher quality). Decision: compromise at 60 with two sub-tiers (Hot 80+, Warm 60-79) with different routing rules.
3. **Week 3: Outreach to Free Users — Creepy or Helpful?** — Concern that referencing product usage in outreach would feel invasive. A/B test showed usage-aware outreach had 3x higher reply rate and was perceived as "helpful" not "creepy" when framed as "I noticed your team is hitting limits." Decision: proceed with usage-aware personalization.
4. **Week 5: Direct AE Contact vs. SDR First** — For Hot PQL enterprise accounts, debate between SDR-first (process consistency) and direct AE contact (speed). Data showed accounts contacted within 4 hours had 3x higher meeting rate. Decision: Hot PQL enterprise accounts go direct to AE with 4-hour SLA.

## 7. Stakeholder Quotes

> "The PQL model was a revelation. We had 34 enterprise accounts using our free product extensively, and we didn't know it. That was $1.7M in potential ARR sitting in our own database that we were ignoring." — *CloudMetrics CEO*

> "For the first time, our SDRs are spending 65% of their time actually talking to prospects instead of researching them. The automated enrichment and PQL scoring changed everything about our team's efficiency." — *CloudMetrics Sales Manager*

> "When a sales rep emailed me saying 'I noticed your team has built 5 dashboards and connected 4 data sources—you're hitting our free tier limits,' I was impressed. They clearly understood how we were using the product. That earned the meeting." — *VP Engineering at target account (now customer)*

## 8. Lessons Learned

1. **Product usage signals are gold**: Users who hit specific feature thresholds were 4x more likely to convert. The PQL model transformed sales from cold outreach to warm, context-rich conversations. The most powerful signals were: hitting dashboard limits (immediate need), adding team members (organizational adoption), and high API usage (deep integration).

2. **ICP precision matters more than volume**: Focusing on 520 ICP-matched users instead of 2,000 total users drove significantly better results despite smaller initial pool. The 33% of users who matched ICP generated 85% of the pipeline. More targets does not equal more pipeline.

3. **Personalization depth correlates with response**: Bard-generated emails using 3+ personalization signals achieved 28% reply rate vs 8% for generic templates. The personalization ladder (Level 0 → Level 5) was the most actionable framework for the team—every additional signal layer improved reply rates by 4-6 percentage points.

4. **Speed to lead is critical**: Accounts contacted within 24 hours of trigger event detection had 3x higher meeting booking rate. The PQL → AE routing with 4-hour SLA was the most important operational decision. Every day of delay reduced conversion probability by 15%.

5. **Multi-channel beats single-channel**: Email+LinkedIn sequences had 45% higher conversion than email-only. LinkedIn provided a secondary touchpoint that reinforced email messaging and created a sense of persistent presence. The optimal sequence was: Email → LinkedIn → Email → LinkedIn → Email.

6. **Usage-aware messaging is helpful, not creepy**: The team's concern that referencing product usage would feel invasive was unfounded. When framed as "helping you get more value" rather than "we're watching you," usage-aware personalization was perceived positively. The key was leading with the value proposition ("you're hitting limits—here's how to solve that") rather than the observation ("we see you've created 5 dashboards").

7. **The free tier is a qualification funnel**: Rather than viewing the free tier as a cost, CloudMetrics reframed it as a self-qualifying funnel. Users who hit PQL thresholds had essentially pre-qualified themselves through product engagement. The sales team's job was to identify and convert these pre-qualified accounts, not to create demand from scratch.

## 9. Competitive Alternatives Considered

| Alternative | Why Rejected |
|-------------|-------------|
| MadKudu for PQL scoring | Lead scoring only, no outreach, no pipeline management, no enrichment |
| UserGems for champion tracking | Single function (champion tracking), no PQL model, no sequences |
| Outreach.io + manual enrichment | No product usage integration, manual research required, no PQL scoring |
| Hiring 4 more SDRs | $240K/year fully loaded, 6-month ramp, no technology leverage |
| Increasing free tier limits | Would reduce upgrade pressure, increase costs, not solve enterprise conversion |

## 10. Technical Architecture Deployed

```
[Product Usage Database] → [Webhook] → [Scout PQL Detection Engine]
                                           ↓
[Clearbit API] → [Forge Enrichment] → [ICP Score Assignment (Atlas)]
                                           ↓
[Apollo.io] → [Contact Data] → [PQL × ICP Priority Matrix (Judge)]
                                           ↓
[Crunchbase] → [Trigger Events] → [Bard Usage-Aware Sequences]
                                           ↓
[LinkedIn Sales Nav] → [Multi-Channel] → [Flow Lead Routing + Pipeline]
                                           ↓
[BuiltWith] → [Competitive Intel] → [Echo PLG-to-SQL Analytics]
```

**Integration Stack**: Segment (product usage events), Salesforce CRM, Clearbit (firmographic enrichment), Apollo.io (contact data), LinkedIn Sales Navigator, Crunchbase (funding data), BuiltWith (technographic), Slack (PQL alerts), Gong (call recording and coaching).

## 11. Replicable Playbook Summary

### PLG-to-Sales-Led Conversion Playbook (6 Steps)

**Step 1 — Analyze LTV Data and Define ICP Tiers (1 week)**
- Use Atlas to analyze existing customer LTV by segment
- Define 4 ICP tiers: Enterprise, Mid-Market, SMB, Exclude
- Identify the 20% of accounts generating 80% of revenue (Pareto analysis)
- **Deliverable**: ICP tier definitions with target ACV and sales motion per tier

**Step 2 — Build PQL Model and Thresholds (1 week)**
- Identify product usage signals that predict conversion
- Weight signals by correlation with paid conversion
- Set PQL thresholds (Hot: 80+, Warm: 60-79, Developing: 40-59, Cold: <40)
- **Deliverable**: PQL scoring model with tier-specific routing rules

**Step 3 — Map Free Users to ICP + Score PQL (1-2 weeks)**
- Connect Scout to product usage database
- Match free users against ICP tiers using firmographic data
- Score all ICP-matched users on PQL model
- **Deliverable**: Prioritized account list with ICP tier × PQL score matrix

**Step 4 — Enrich and Identify Trigger Events (1 week)**
- Enrich all ICP-matched accounts with firmographic, technographic, and contact data
- Set up trigger event monitoring (funding, hiring, usage milestones)
- Create competitive displacement intelligence per account
- **Deliverable**: Fully enriched account records with trigger monitoring active

**Step 5 — Launch Usage-Aware Outreach (1 week)**
- Deploy Bard with personalization depth framework (Level 0-5)
- Create usage-aware sequences by ICP tier and persona
- Configure multi-channel sequences (Email + LinkedIn)
- **Deliverable**: Active outreach on Hot and Warm PQL accounts

**Step 6 — Implement Lead Routing and Pipeline (1 week)**
- Configure Flow with tier-based routing rules (Hot PQL → AE in 4 hours)
- Set up deal-at-risk alerts and trigger-based re-engagement
- Build PLG-to-SQL conversion tracking in Echo
- **Deliverable**: Automated pipeline with routing, alerts, and tracking

### Critical Success Factors

- The PQL model is the foundation—without usage-based scoring, PLG-to-sales fails
- ICP precision > volume: focus on the 33% of users who match ICP, not the 100%
- Personalization depth directly correlates with reply rate (Level 3+ = 18-28%)
- Speed to lead: Hot PQL accounts must be contacted within 4 hours
- Usage-aware messaging is helpful, not creepy—frame as "solving your limits"
- Multi-channel (Email + LinkedIn) outperforms single-channel by 45%
- The free tier is a self-qualifying funnel—let product usage do the initial qualification
