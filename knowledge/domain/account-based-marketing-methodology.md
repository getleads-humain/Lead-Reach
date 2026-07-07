---
title: "Account-Based Marketing (ABM) — Methodology, Tiering & Orchestration"
last_reviewed: 2026-07-04
grade: A
tags: [domain, abm, account-based, targeting, personalization, atlas, bard, scout]
---

# Account-Based Marketing (ABM) — Methodology, Tiering & Orchestration

## 1. Executive Summary

Account-Based Marketing (ABM) is a strategic approach that concentrates sales and marketing resources on a defined set of high-value target accounts. Rather than casting a wide net and hoping qualified leads emerge, ABM reverses the funnel: it identifies the best-fit accounts first, then orchestrates personalized engagement to convert them into customers.

In B2B lead generation, ABM is not optional — it is the dominant paradigm for enterprise and mid-market revenue. Research from ITSMA shows that 87% of B2B marketers report that ABM outperforms other marketing investments in ROI. The reason is simple: enterprise deals involve 6-10 decision-makers, take 6-18 months to close, and require coordinated engagement across the buying committee. Spray-and-pray marketing cannot address this complexity.

This methodology defines LeadReach's ABM framework: how target accounts are selected and tiered, how personalized engagement is orchestrated, how sales and marketing align around account plans, and how the LeadReach agent ecosystem enables ABM at scale.

## 2. Core Concepts and Definitions

### Target Account List (TAL)
The curated list of accounts that represent the highest revenue potential and best fit for the solution. The TAL is the foundation of ABM — everything flows from account selection.

### Account Tier
A classification system that determines the level of personalization and investment for each account:
- **Tier 1 (Strategic/1:1)**: 50-200 accounts receiving fully personalized, high-touch engagement
- **Tier 2 (Scale/1:Few)**: 200-2,000 accounts receiving segment-personalized engagement
- **Tier 3 (Programmatic/1:Many)**: 2,000+ accounts receiving automated, lightly personalized engagement

### Buying Committee
The group of stakeholders at a target account who influence or decide the purchase. Enterprise B2B deals typically involve 6-10 stakeholders across technical, financial, operational, and executive roles.

### Account Score
A composite metric (0-100) that quantifies an account's fit (how well it matches the ICP) and intent (how actively it is researching solutions like yours). Account score determines tier placement and resource allocation.

### Intent Data
Signals indicating that an account is actively researching a solution category. Sources include third-party intent data providers (6sense, Bombora, Demandbase), first-party engagement (website visits, content downloads), and trigger events (hiring, funding, compliance deadlines).

### Orchestration
The coordinated execution of sales and marketing activities across the buying committee at a target account. Orchestration ensures that every touchpoint is relevant, timely, and aligned with the account plan.

### Account-Based Experience (ABX)
The full lifecycle engagement of an account from first touch through customer advocacy. ABX extends ABM beyond marketing to encompass the entire buyer journey, including customer success and expansion.

### TAM / SAM / SOM
- **TAM** (Total Addressable Market): All accounts that could potentially buy
- **SAM** (Serviceable Addressable Market): Accounts in TAM that you can realistically serve
- **SOM** (Serviceable Obtainable Market): Accounts in SAM you can realistically win

## 3. Methodology Overview — The ABM Funnel

ABM reverses the traditional funnel. Instead of Marketing → MQL → SQL → Opportunity → Customer, ABM follows:

```
SELECT → EXPAND → ENGAGE → CONVERT → EXPAND (again)
```

### Phase 1: SELECT — Define the Target Account List
Using ICP criteria, intent data, and strategic priorities, identify the accounts most likely to convert. The TAL is a living document, reviewed quarterly.

### Phase 2: EXPAND — Map and Enrich Each Account
For each target account, map the buying committee, enrich with firmographic and technographic data, and identify trigger events and engagement signals. Understand the account's business challenges, strategic priorities, and organizational dynamics.

### Phase 3: ENGAGE — Orchestrate Personalized Outreach
Execute coordinated sales and marketing campaigns tailored to each account's specific context. Every touchpoint should demonstrate understanding of the account's challenges and offer relevant value.

### Phase 4: CONVERT — Navigate the Buying Process
Guide the buying committee through evaluation, proposal, negotiation, and close. Multi-thread all stakeholders and address each one's specific concerns and criteria.

### Phase 5: EXPAND — Grow the Account Post-Sale
Customer success and account management drive adoption, identify expansion opportunities, and convert customers into advocates. ABM doesn't end at closed-won.

## 4. Detailed Process Steps

### Step 1: Build the Target Account List

The TAL is the single most important asset in ABM. A poorly constructed TAL wastes resources on accounts that will never buy.

**1.1 Define ICP-based selection criteria**
Using the ICP Design & Scoring methodology, define the firmographic, technographic, and behavioral attributes of ideal customers. Typical criteria include:
- Industry / vertical
- Employee count range
- Revenue range
- Geography
- Technology stack (current tools that indicate a need for your solution)
- Funding stage
- Growth trajectory
- Regulatory environment

**1.2 Generate the initial universe**
Use Forge to query multiple data sources (LinkedIn, Crunchbase, OpenCorporates, BuiltWith) to identify all accounts matching ICP criteria. This produces the TAM list.

**1.3 Apply intent data to prioritize**
Overlay third-party intent data (6sense, Bombora) to identify accounts actively researching your solution category. Accounts with high fit AND high intent are Tier 1 candidates. Accounts with high fit but low intent are Tier 2. Accounts with moderate fit and moderate intent are Tier 3.

**1.4 Apply strategic filters**
Remove or deprioritize accounts that:
- Are existing customers (move to expansion pipeline)
- Have been closed-lost in the last 12 months (unless new context)
- Are in active litigation with your company
- Are in a geographic or vertical you don't serve
- Have a competitor deeply entrenched with multi-year contracts

**1.5 Validate and finalize**
Review the TAL with sales leadership. Every account on the Tier 1 list should have a named account owner. The final TAL should represent 3-5x your annual new-logo revenue target.

### Step 2: Map the Buying Committee

For every Tier 1 account and top Tier 2 accounts, map the buying committee:

**2.1 Identify the roles, not just the names**
Typical buying committee roles in B2B technology:
- **Economic Buyer**: Controls the budget; signs the check (CFO, VP Finance, COO)
- **Technical Buyer**: Evaluates technical fit; concerned with integration, security, performance (CTO, VP Engineering, IT Director)
- **User Buyer**: Will use the product daily; concerned with usability, workflow (Manager, Individual Contributor)
- **Champion**: Internal advocate who drives the deal; has influence and urgency (Director, VP)
- **Blocker**: Stakeholder who opposes the purchase; often has a competing priority or preferred vendor
- **Executive Sponsor**: Senior leader who provides air cover and removes organizational obstacles (C-suite)

**2.2 Identify the people for each role**
Forge enriches each account with LinkedIn data to identify specific individuals. Scout researches each person's background, priorities, and recent activity. The output is a stakeholder map:

```
ACCOUNT: Acme Corp
├── Executive Sponsor: Jane Smith (CEO) — recent keynote on digital transformation
├── Economic Buyer: Tom Chen (CFO) — joined 6 months ago from a company that used [our solution]
├── Technical Buyer: Priya Patel (CTO) — presented at DevOps Summit on infrastructure automation
├── User Buyer: Marcus Johnson (VP Sales Ops) — posted on LinkedIn about CRM pain points
├── Champion: Sarah Williams (Dir. Revenue Ops) — attended our webinar, downloaded whitepaper
└── Blocker (potential): David Kim (VP IT) — heavily invested in [competitor] integration
```

**2.3 Understand each stakeholder's perspective**
For each identified stakeholder, research:
- Business priorities (from LinkedIn posts, conference talks, interviews)
- Likely concerns about your solution category
- Relationship to other committee members
- Preferred communication style and channels

### Step 3: Design Account-Specific Engagement Plans

For Tier 1 accounts, create a bespoke engagement plan. For Tier 2, create segment-level plans. For Tier 3, use automated personalization.

**3.1 Tier 1 Engagement (1:1 ABM)**
- Custom landing page for the account
- Personalized content (case studies from their industry, ROI models based on their metrics)
- Direct mail or gifting for key stakeholders
- Executive-to-executive engagement (your CEO meets their CEO)
- Dedicated SDR assigned to the account
- Bard generates stakeholder-specific messaging
- Atlas orchestrates multi-channel, multi-stakeholder sequencing

**3.2 Tier 2 Engagement (1:Few ABM)**
- Industry-specific landing pages and content
- Segment-personalized email sequences
- Digital advertising targeting the account's IP range or company list
- Invitations to industry-specific events or webinars
- SDR outreach with segment-relevant messaging
- Bard generates segment-specific content variations

**3.3 Tier 3 Engagement (1:Many ABM)**
- Automated email nurture sequences with dynamic personalization
- Retargeting advertising
- Content syndication and SEO-driven inbound
- Self-service product trials or freemium
- Flow manages automated sequences at scale

### Step 4: Execute Multi-Channel Orchestration

ABM requires coordination across channels — no single channel can carry an enterprise deal alone.

**4.1 Channel mix by tier**
| Channel | Tier 1 | Tier 2 | Tier 3 |
|---------|--------|--------|--------|
| Personalized email | Yes (1:1) | Yes (1:few) | Yes (1:many) |
| LinkedIn connection + DM | Yes | Yes | Selected |
| Phone call | Yes | Yes | No |
| Digital advertising | Yes (account-specific) | Yes (segment) | Yes (broad) |
| Direct mail / gifting | Yes | Selected | No |
| Executive engagement | Yes | No | No |
| Events / dinners | Yes (invited) | Yes (open) | No |
| Content (custom) | Yes (1:1) | Yes (1:few) | Yes (1:many) |

**4.2 Sequencing and timing**
- **Week 1-2**: Awareness — advertising, content, LinkedIn engagement
- **Week 2-4**: Initial outreach — personalized email, connection request, first call attempt
- **Week 4-6**: Value delivery — share relevant insight, invite to event, send personalized content
- **Week 6-8**: Meeting request — direct ask for discovery call based on accumulated context
- **Week 8+**: Nurture — if no meeting, continue value delivery on slower cadence

**4.3 Atlas orchestration**
Atlas coordinates the sequence across channels, ensuring:
- No channel overwhelms the prospect (frequency caps)
- Each touch builds on the previous one (narrative progression)
- Different stakeholders receive different messages simultaneously (multi-threading)
- Activity is logged and visible to the entire team

### Step 5: Measure ABM Performance

ABM measurement is fundamentally different from traditional marketing measurement:

**5.1 Account-level metrics (not lead-level)**
| Metric | Definition | Target |
|--------|-----------|--------|
| Account Engagement Rate | % of TAL accounts showing active engagement | >40% Tier 1, >25% Tier 2 |
| Buying Committee Coverage | % of identified stakeholders engaged | >60% for Tier 1 |
| Pipeline Creation Rate | % of TAL accounts entering pipeline | >25% Tier 1, >10% Tier 2 |
| Average Deal Size (ABM vs. non-ABM) | ABM deals should be larger | >1.5x non-ABM |
| Win Rate (ABM vs. non-ABM) | ABM deals should close at higher rates | >1.3x non-ABM |
| Account Penetration Speed | Time from first touch to pipeline entry | <60 days Tier 1 |

**5.2 ROI calculation**
```
ABM ROI = (Revenue from ABM-sourced deals - ABM program cost) / ABM program cost

Where ABM program cost includes:
- Technology (intent data, ABM platform, advertising)
- Content creation (custom assets, personalized materials)
- People (SDR time, marketing time, executive time)
- Events and direct mail
```

## 5. LeadReach Agent Integration

### Atlas — ABM Orchestration
Atlas is the central orchestrator of ABM execution:
- Manages the TAL and account tier assignments
- Coordinates multi-channel, multi-stakeholder engagement sequences
- Routes account ownership and ensures no account goes unattended
- Triggers escalation when accounts go dark or show buying signals
- Balances resource allocation across tiers

### Scout — Account Intelligence
Scout provides the intelligence layer for ABM:
- Identifies new accounts matching ICP criteria for TAL expansion
- Researches buying committee members at target accounts
- Monitors trigger events at target accounts (funding, hires, expansions)
- Detects intent signals indicating active research
- Surfaces competitive intelligence (which accounts are evaluating competitors)

### Forge — Account Enrichment
Forge enriches every target account with:
- Complete firmographic profiles (industry, size, revenue, ownership)
- Technographic data (current technology stack, integration needs)
- People data (organizational chart, decision-maker profiles, contact info)
- Financial data (funding, revenue estimates, growth trajectory)
- Behavioral data (recent news, trigger events, content engagement)

### Sage — ABM Analytics
Sage provides analytical intelligence for ABM:
- Calculates account scores combining fit and intent signals
- Analyzes engagement patterns across the buying committee
- Predicts which accounts are most likely to convert based on early signals
- Measures ABM program ROI by tier and segment
- Identifies underperforming accounts for strategy adjustment

### Judge — ABM Quality Assurance
Judge ensures ABM execution quality:
- Validates account tier assignments (does this account really belong in Tier 1?)
- Audits personalization quality (is this outreach genuinely relevant to the account?)
- Monitors for compliance (GDPR, CAN-SPAM) across channels
- Evaluates content relevance scores for each account engagement

### Bard — ABM Content and Messaging
Bard generates ABM-specific content:
- Stakeholder-specific value propositions and messaging
- Personalized email sequences for each buying committee role
- Custom pitch decks and business cases for Tier 1 accounts
- Industry-specific content variations for Tier 2 segments
- Social selling content for LinkedIn engagement

### Flow — ABM Automation
Flow automates ABM operational tasks:
- Syncs TAL across CRM, advertising platforms, and sales engagement tools
- Triggers automated sequences based on intent signals
- Manages advertising audience lists and bid adjustments
- Routes inbound engagement to the right account owner
- Automates reporting and dashboard updates

### Echo — ABM Monitoring
Echo monitors ABM execution in real-time:
- Alerts when target accounts show surging intent signals
- Notifies when buying committee members change roles or companies
- Tracks engagement velocity across target accounts
- Flags accounts that have gone dark after initial engagement
- Monitors competitor activity at target accounts

## 6. Key Metrics and KPIs

### Selection Quality
| Metric | Target | Calculation |
|--------|--------|-------------|
| TAL-to-Pipeline Conversion | >20% (Tier 1) | Accounts entering pipeline / Total TAL |
| ICP Fit Score (avg TAL) | >70 | Average ICP score of TAL accounts |
| Intent Signal Coverage | >60% of TAL | Accounts with intent data available / Total TAL |

### Engagement Quality
| Metric | Target | Calculation |
|--------|--------|-------------|
| Account Engagement Rate | >40% (Tier 1) | Accounts with 3+ touches engaged / Total TAL |
| Buying Committee Reach | >4 stakeholders | Average stakeholders engaged per Tier 1 account |
| Content Consumption | >2 assets | Average content pieces consumed per engaged account |
| Response Rate | >15% (Tier 1) | Accounts responding to outreach / Accounts contacted |

### Business Impact
| Metric | Target | Calculation |
|--------|--------|-------------|
| ABM Deal Size vs. Non-ABM | >1.5x | Average ABM deal / Average non-ABM deal |
| ABM Win Rate vs. Non-ABM | >1.3x | ABM win rate / Non-ABM win rate |
| ABM Cycle Time vs. Non-ABM | <1.0x | ABM cycle time / Non-ABM cycle time |
| ABM Pipeline Velocity | Increasing QoQ | (Deals x Size x Win Rate) / Cycle |
| ABM Program ROI | >5x | Revenue / Program cost |

### Operational Efficiency
| Metric | Target | Calculation |
|--------|--------|-------------|
| Cost per ABM-sourced SQL | Decreasing QoQ | Total ABM spend / ABM-sourced SQLs |
| SDR Productivity (ABM) | >2x non-ABM | Meetings booked per SDR (ABM accounts vs. all) |
| Content Utilization Rate | >70% | Assets used in campaigns / Assets created |

## 7. Best Practices

### Practice 1: Start Small, Prove, Then Scale
Launch ABM with 25-50 Tier 1 accounts before expanding. Prove the model works (higher win rates, larger deals) before investing in Tier 2 and Tier 3 programs. ABM at scale without proof is expensive speculation.

### Practice 2: Sales and Marketing Must Co-Own the TAL
The TAL is not a marketing list — it is a strategic asset co-owned by sales and marketing. Both teams contribute to account selection, both review the list quarterly, and both are accountable for TAL performance.

### Practice 3: Personalization Must Be Genuine
Replacing "Hi [First Name]" with "Hi Sarah" is not ABM personalization. Genuine personalization demonstrates understanding of the account's specific challenges, references their strategic priorities, and offers relevant insight. If the personalization could apply to any company, it isn't personalization.

### Practice 4: Multi-Thread from Day One
Never rely on a single contact at a target account. From the first outreach, engage multiple stakeholders with role-specific messaging. If one contact doesn't respond, others may. And if one champion leaves mid-cycle, the deal survives.

### Practice 5: Measure at the Account Level
Traditional lead-level metrics (MQLs, CTR, form fills) are misleading in ABM. An account-level view — is this account progressing toward a deal? — is the right lens. One highly engaged stakeholder is less valuable than three moderately engaged stakeholders.

### Practice 6: Align Content to the Buying Committee
Create content for each stakeholder persona: technical deep-dives for the CTO, ROI calculators for the CFO, workflow demonstrations for the user buyer, strategic vision content for the CEO. A single whitepaper does not serve the entire buying committee.

### Practice 7: Use Intent Data as a Signal, Not a Decision
Intent data indicates research activity, not purchase intent. A company researching your category may be evaluating, may be writing a blog post, or may be a competitor doing market research. Always validate intent signals with direct engagement before committing resources.

### Practice 8: Review and Refresh the TAL Quarterly
Markets shift, companies pivot, and new accounts emerge. The TAL must be reviewed quarterly: add new high-fit accounts, remove accounts that have been discredited, and adjust tiers based on new intent data and strategic priorities.

## 8. Common Mistakes and Anti-Patterns

### Anti-Pattern 1: ABM as a Marketing-Only Initiative
ABM fails when it lives only in marketing. Sales must be involved in account selection, content strategy, and execution. Without sales buy-in, ABM-generated engagement doesn't convert to pipeline. Counter: Co-define the TAL, co-design the playbooks, co-own the metrics.

### Anti-Pattern 2: The Infinite TAL
Some companies put 10,000+ accounts on their TAL and call it ABM. This is just marketing with a list. A real Tier 1 list is 50-200 accounts that receive genuine 1:1 attention. Counter: Be ruthless about tiering. If you can't give an account personalized attention, it's not Tier 1.

### Anti-Pattern 3: Spray Personalization
Sending the same "personalized" email to 500 accounts with only the company name changed. This fools no one and damages brand perception. Counter: If you can't create genuinely relevant content for an account, put it in a lower tier with segment-level messaging.

### Anti-Pattern 4: Ignoring the Silent Majority
Focusing only on accounts that respond to outreach while ignoring the 60-70% that don't engage. Many of these accounts are interested but not ready. Counter: Maintain long-term nurture sequences and intent monitoring. A silent account that starts showing intent signals is a warm lead.

### Anti-Pattern 5: No Feedback Loop from Sales to Marketing
Marketing creates campaigns and content without ongoing input from sales on what's working and what's not. Counter: Weekly ABM stand-ups where sales reports which accounts are engaging, what messaging resonated, and what content is needed.

### Anti-Pattern 6: Measuring ABM Like Demand Gen
Using MQLs, form fills, and CTR to measure ABM success. These metrics don't capture account-level progression or the multi-stakeholder reality of ABM. Counter: Use account-level metrics: engagement rate, pipeline creation, deal size, win rate.

### Anti-Pattern 7: Abandoning Accounts Too Early
If an account doesn't respond in 30 days, moving on. Enterprise buying cycles are long; the absence of response doesn't mean the absence of interest. Counter: Maintain a long-term nurture track (monthly touchpoints) for all Tier 1 and Tier 2 accounts that don't enter the pipeline immediately.

## 9. Technology and Tool Requirements

### ABM Platform
- Demandbase, 6sense, or Terminus
- Must support account-level advertising, engagement tracking, and intent data integration
- Integration with CRM for pipeline data and LeadReach agent ecosystem

### Intent Data Provider
- 6sense, Bombora, or Demandbase
- Provides third-party intent signals (research activity across the web)
- Must integrate with ABM platform and CRM

### CRM
- Salesforce, HubSpot, or equivalent
- Must support account-based views, custom account scoring, and TAL management
- Integration with all other ABM tools

### Sales Engagement Platform
- Outreach, Salesloft, or equivalent
- Supports account-based sequences (not just contact-based)
- Must allow multi-stakeholder orchestration within the same account

### Content Personalization
- Mutiny, Optimizely, or dynamic content platforms
- Enables 1:1 landing pages and website personalization for target accounts
- Must integrate with ABM platform for account identification

### Advertising Platform
- LinkedIn Campaign Manager, Demandbase, Terminus
- Account-based advertising targeting specific companies and stakeholders
- Must support multiple ad formats (display, sponsored content, InMail)

### Analytics and Attribution
- BrightFunnel, Full Circle, or Bizible
- Account-level attribution across channels
- Must measure ABM program ROI, not just campaign-level metrics

## 10. Integration with Other Methodologies

### ICP Design & Scoring
The ICP defines who belongs on the TAL. Without a precise ICP, ABM targets the wrong accounts and wastes resources. The ABM methodology feeds back into ICP refinement by providing win-rate and velocity data by ICP segment.

### Data Enrichment
Enrichment powers ABM by providing the account intelligence needed for personalization. Forge's firmographic, technographic, and people data enables the stakeholder mapping and context gathering that ABM requires.

### Lead Qualification Frameworks
MEDDIC, BANT, and other frameworks provide the qualification rigor that ABM needs for pipeline progression. ABM gets the meeting; qualification frameworks confirm the opportunity is real.

### Pipeline Management
ABM-generated pipeline must be managed with the same rigor as any other pipeline. Pipeline management provides the stage framework and forecasting that ABM-sourced deals flow through.

### Outreach Methodology
Outreach sequences are the execution layer of ABM. The outreach methodology defines the cadence, channels, and messaging frameworks that ABM orchestration leverages.

### Deal Velocity Optimization
ABM deals should close faster because the account has been warmed through coordinated engagement. Velocity optimization identifies bottlenecks specific to ABM deals (e.g., longer evaluation periods due to larger buying committees).

### Competitive Intelligence
Competitive intelligence informs ABM account strategy: which accounts are using competitors, which are likely to switch, and what messaging will resonate based on competitor weaknesses.

## 11. Case Study Examples

### Case Study 1: Enterprise Cloud — 1:1 ABM for Fortune 500
A cloud infrastructure company targeted 50 Fortune 500 accounts with a 1:1 ABM program. Each account received a custom microsite, personalized content based on their industry challenges, executive-to-executive engagement, and a dedicated SDR. Results: 38% of target accounts entered the pipeline, average deal size was 2.3x non-ABM deals, and the program generated $14.2M in pipeline in 6 months against a $1.8M program cost (7.9x ROI).

### Case Study 2: MarTech Company — Tier 2 ABM at Scale
A marketing technology company had a TAL of 1,200 mid-market accounts. They implemented 1:Few ABM with industry-specific content tracks, segment-personalized advertising, and SDR outreach with industry-relevant messaging. Results: Pipeline creation from TAL accounts increased 180% YoY, average deal size increased 35% vs. non-ABM inbound, and sales cycle decreased by 22 days because accounts were pre-educated.

### Case Study 3: Cybersecurity — Intent-Driven ABM Pivot
A cybersecurity company noticed that 3 of their Tier 1 accounts showed sudden spikes in intent data around "zero trust architecture." Scout investigated and discovered these accounts had all experienced recent security incidents. The company rapidly created zero trust-specific content and outreach, engaging all three accounts within 48 hours. Results: All 3 accounts entered the pipeline within 30 days, 2 closed within the quarter for a combined $1.1M.

### Case Study 4: SaaS — Multi-Threading Saves a $250K Deal
A SaaS company's Tier 1 account had been unresponsive for 6 weeks after the initial champion stopped replying. Rather than abandoning the account, Atlas orchestrated multi-threaded outreach to 4 additional stakeholders identified by Forge. The VP of Operations responded and became the new champion. The deal closed 3 weeks later at $250K. Lesson: ABM accounts should never be single-threaded, and silence from one contact doesn't mean disinterest from the account.

## 12. Templates and Frameworks

### Account Plan Template (Tier 1)
```
ACCOUNT PLAN — [Company Name]

ACCOUNT OVERVIEW:
  Company: _________________________________
  Industry: _________________________________
  Size: _____________ employees / $_________ revenue
  ICP Score: __________ / 100
  Account Tier: 1 / 2 / 3
  Account Owner: ___________________________

BUSINESS CONTEXT:
  Strategic priorities: ______________________
  Key challenges: ___________________________
  Recent trigger events: _____________________
  Competitive landscape: _____________________

BUYING COMMITTEE MAP:
  Role              | Name | Title | Engagement | Priority
  Executive Sponsor |      |       |            |
  Economic Buyer    |      |       |            |
  Technical Buyer   |      |       |            |
  User Buyer        |      |       |            |
  Champion          |      |       |            |
  Blocker           |      |       |            |

ENGAGEMENT PLAN:
  Week 1-2: _________________________________
  Week 3-4: _________________________________
  Week 5-6: _________________________________
  Week 7-8: _________________________________

CONTENT ASSETS NEEDED:
  [ ] Executive-level value prop
  [ ] Technical architecture overview
  [ ] ROI model (pre-filled with account data)
  [ ] Industry-specific case study
  [ ] Competitive comparison
  [ ] Security/compliance documentation

SUCCESS METRICS:
  Pipeline entry target: _____________________
  Expected deal size: $______________________
  Expected close date: _______________________

RISK FACTORS:
  1. _______________________________________________
  2. _______________________________________________
  3. _______________________________________________
```

### TAL Quarterly Review Template
```
TARGET ACCOUNT LIST REVIEW — [Quarter] [Year]

TAL COMPOSITION:
  Tier 1 (Strategic):  _______ accounts
  Tier 2 (Scale):      _______ accounts
  Tier 3 (Programmatic):_______ accounts
  Total TAL:           _______ accounts

TAL CHANGES THIS QUARTER:
  Added to Tier 1:     _______ accounts
  Promoted to Tier 2:  _______ accounts
  Demoted from Tier 1: _______ accounts
  Removed from TAL:    _______ accounts

PERFORMANCE BY TIER:
                        Tier 1    Tier 2    Tier 3
  Accounts engaged:     _______   _______   _______
  Pipeline created:     $______   $______   $______
  Deals won:            _______   _______   _______
  Revenue:              $______   $______   $______
  Avg deal size:        $______   $______   $______
  Win rate:             ______%   ______%   ______%

TAL HEALTH SCORE: _______ / 100

RECOMMENDATIONS:
  1. _______________________________________________
  2. _______________________________________________
  3. _______________________________________________
```

### ABM Campaign Brief Template
```
ABM CAMPAIGN BRIEF

CAMPAIGN NAME: _________________________________
TIER: 1 / 2 / 3
TARGET SEGMENT: _________________________________
NUMBER OF ACCOUNTS: _____________________________

OBJECTIVE:
  Primary: _________________________________
  Secondary: _______________________________

MESSAGING PILLARS:
  1. _________________________________
  2. _________________________________
  3. _________________________________

CHANNELS:
  [ ] Email (personalized / segment)
  [ ] LinkedIn (connection / DM / advertising)
  [ ] Phone
  [ ] Digital advertising
  [ ] Direct mail
  [ ] Events
  [ ] Content syndication

CONTENT ASSETS:
  1. _________________________________ (for: ____________)
  2. _________________________________ (for: ____________)
  3. _________________________________ (for: ____________)

SEQUENCE TIMELINE:
  Week 1: _________________________________
  Week 2: _________________________________
  Week 3: _________________________________
  Week 4: _________________________________

BUDGET: $_________________
EXPECTED PIPELINE: $_________________
EXPECTED ROI: _________x

SUCCESS CRITERIA:
  1. _________________________________
  2. _________________________________
  3. _________________________________
```

### Account Score Calculation
```typescript
interface AccountScoreInputs {
  // Fit signals (0-50 points)
  industryMatch: number;        // 0-15
  sizeMatch: number;            // 0-10
  techStackMatch: number;       // 0-10
  geographicMatch: number;      // 0-5
  growthProfileMatch: number;   // 0-10

  // Intent signals (0-30 points)
  thirdPartyIntent: number;     // 0-10 (research activity on B2B sites)
  firstPartyEngagement: number; // 0-10 (website visits, content downloads)
  triggerEvents: number;        // 0-10 (funding, hires, compliance)

  // Accessibility signals (0-20 points)
  existingContactQuality: number; // 0-10
  referralOrWarmIntro: number;    // 0-10
}

function calculateAccountScore(inputs: AccountScoreInputs): number {
  const fitScore = inputs.industryMatch + inputs.sizeMatch +
    inputs.techStackMatch + inputs.geographicMatch + inputs.growthProfileMatch;
  const intentScore = inputs.thirdPartyIntent + inputs.firstPartyEngagement +
    inputs.triggerEvents;
  const accessScore = inputs.existingContactQuality + inputs.referralOrWarmIntro;

  return Math.min(100, fitScore + intentScore + accessScore);
}

function determineTier(score: number): 'tier1' | 'tier2' | 'tier3' {
  if (score >= 75) return 'tier1';
  if (score >= 50) return 'tier2';
  return 'tier3';
}
```

## 13. References and Further Reading

1. **"Account-Based Marketing For Dummies"** by Sangram Vajre — Comprehensive introduction to ABM strategy, technology, and execution
2. **"ABM is B2B"** by Sangram Vajre and Peter Isaacson — Why ABM is the default go-to-market for B2B and how to implement it
3. **"The Clear and Complete Guide to Account-Based Marketing"** by Engagio — Practical framework for ABM program design and measurement
4. **ITSMA ABM Benchmark Studies** — Annual research on ABM adoption, maturity, and performance benchmarks
5. **"The Challenger Customer"** by Matthew Dixon and Brent Adamson — Understanding buying committee dynamics and multi-stakeholder engagement
6. **"T2D3"** framework by Neeraj Agrawal — The growth framework that makes ABM essential for enterprise SaaS scaling
7. **6sense State of B2B Buyer Intent Report** — Research on how B2B buyers research solutions and the role of intent data
8. **"Revenue Operations"** by Stephen Diorio and Chris Hummel — How RevOps supports ABM alignment between sales and marketing
9. **Demandbase State of ABM Report** — Annual benchmark data on ABM program performance and technology adoption
10. **"The B2B Playbook"** by Latané Conant — Account-based go-to-market strategy and execution
