---
title: "Onboarding Quickstart — Getting Started with LeadReach in 30/60/90 Days"
category: product
grade: A
last_reviewed: "2026-07-03"
tags: [onboarding, quickstart, setup, campaign, icp, integration, deployment, success-metrics, 30-60-90]
---

# Onboarding Quickstart — Getting Started with LeadReach in 30/60/90 Days

## Executive Summary

Getting started with LeadReach is designed to be fast—you can run your first prospect search within 5 minutes of account creation and launch your first outreach campaign within 30 minutes. However, achieving maximum value from the platform requires a structured onboarding approach that progressively builds from foundational setup through first results to scaled operations. This guide provides a step-by-step quickstart for new users, organized around a 30/60/90-day success framework.

The first 30 days focus on foundational setup: account configuration, ICP definition, first campaign launch, and initial results measurement. Days 31-60 shift to optimization: refining ICP scoring based on real data, expanding channel coverage, integrating CRM systems, and deploying the full 8-agent pipeline. Days 61-90 establish scaled operations: multi-campaign management, A/B testing discipline, pipeline analytics, and team-wide adoption. By the end of 90 days, a well-onboarded team should be generating 2-4x more pipeline than their previous manual process.

This document is intended for new customers on any paid tier (Scout, Command, Founders' Pass, or Enterprise). Launchpad users can follow the Day 1-7 steps for a free experience with reduced capabilities.

## Day 1: Account Setup

### Step 1: Create Your Account

1. Navigate to [leadreach.ai/signup](https://leadreach.ai/signup)
2. Sign up using Google OAuth or email/password
3. Verify your email address
4. Complete the onboarding wizard:
   - Company name and industry
   - Team size (just you for now; you can add seats later)
   - Primary outbound goal (e.g., "Book more qualified meetings")
   - Target market geography

### Step 2: Choose Your Plan

Select the plan that matches your current needs:

- **Launchpad** (Free): Test the platform with 100 leads/month
- **Scout** ($149/mo): Solo founder starting outbound
- **Command** ($399/mo): Growing team scaling outbound (recommended for most)
- **Founders' Pass** ($2,497 lifetime): Committed founder wanting lifetime access

If unsure, start with Launchpad to explore, then upgrade when you're ready for enrichment and outreach. You can upgrade at any time without losing data.

### Step 3: Configure Your Profile

Navigate to **Settings** and complete:

1. **Company Profile**:
   - Company name, website, industry
   - Physical address (required for CAN-SPAM compliance in email footers)
   - Company description (used by Bard for outreach personalization)

2. **Sender Identity**:
   - From name and email for outreach
   - Job title and role
   - LinkedIn profile URL (for LinkedIn touch sequences)

3. **Notification Preferences**:
   - Email notifications for: reply received, meeting booked, campaign completed
   - Slack/Teams integration (Command+ tiers)
   - Daily digest vs. real-time alerts

### Step 4: Connect Your Email

For outreach capabilities (Scout tier and above):

1. Navigate to **Settings → Email Integration**
2. Connect your sending mailbox via SMTP or OAuth (Gmail, Outlook)
3. Verify domain ownership (recommended for custom domains)
4. Run the mailbox health check:
   - SPF record configured ✅
   - DKIM record configured ✅
   - DMARC record configured ✅
   - Warm-up status (new domains need 2-4 weeks of warm-up)

**Important**: If you're using a new domain for outreach, start the warm-up process immediately. LeadReach's warm-up protocol sends 5 emails/day in week 1, increasing by 5/week until reaching 50/day by week 4.

### Step 5: Invite Team Members (Command+ tiers)

1. Navigate to **Settings → Team**
2. Invite team members by email
3. Assign roles:
   - **Admin**: Full access including billing and integrations
   - **Manager**: Campaign management, reporting, team oversight
   - **User**: Prospect research, outreach, basic reporting

## Day 2-3: Define Your ICP

### Step 6: Build Your Ideal Customer Profile

The ICP Builder (powered by Sage and Judge agents) is the foundation of your entire outbound program. A well-defined ICP ensures that Scout finds the right prospects, Judge scores them accurately, and Bard personalizes outreach effectively.

1. Navigate to **ICP Builder** in the sidebar
2. Start with the **ICP Wizard**:

   **Company Criteria**:
   - **Industry**: Select from 20+ verticals (SaaS, Manufacturing, Healthcare, Financial Services, etc.)
   - **Company Size**: Employee count range (e.g., 50-500)
   - **Revenue Range**: Annual revenue (e.g., $5M-$100M)
   - **Geography**: Countries, states, or regions
   - **Funding Stage**: Bootstrapped, Seed, Series A-C, Public (select applicable)
   - **Technology Stack**: Technologies they use (e.g., Salesforce, AWS, React)

   **Contact Criteria**:
   - **Target Titles**: VP Sales, Director of Revenue, Head of Growth, etc.
   - **Seniority Level**: Director, VP, C-suite
   - **Department**: Sales, Revenue Operations, Marketing, etc.

   **Exclusion Criteria**:
   - **Industries to exclude**: e.g., Government, Non-profit
   - **Company sizes to exclude**: e.g., <10 employees, >10,000
   - **Technologies to exclude**: e.g., competitor products
   - **Geographies to exclude**: Sanctioned countries

3. **Save and activate** your ICP

### Step 7: Validate Your ICP with a Test Search

Before launching a full campaign, validate your ICP by running a test prospect search:

1. Navigate to **Prospect Discovery**
2. Enter a natural-language query based on your ICP, e.g.:
   - "Series A SaaS companies in the US with 50-200 employees using Salesforce"
   - "VP Sales at manufacturing companies in Germany with >$10M revenue"
3. Review the results:
   - Are the returned companies relevant to your product?
   - Are the contacts in the right roles?
   - Is the coverage sufficient (10+ results for a test query)?

4. If results are too narrow: broaden geography, increase size range, or add industry synonyms
5. If results are too broad: add more specific criteria (tech stack, funding stage, trigger events)

### Step 8: Refine ICP Scoring Weights

1. Navigate to **ICP Builder → Scoring Configuration**
2. Adjust dimension weights based on your business priorities:
   - Firmographic Fit: 30% (default) — increase if industry/size is critical
   - Technographic Fit: 20% (default) — increase if tech compatibility matters
   - Intent Signals: 25% (default) — increase for timing-sensitive products
   - Trigger Events: 15% (default) — increase for competitive displacement plays
   - Engagement History: 10% (default) — increase for re-engagement campaigns

3. Set grade thresholds:
   - A-grade: 80+ (default) — immediate outreach
   - B-grade: 60-79 (default) — standard outreach
   - C-grade: 40-59 (default) — nurture track
   - D-grade: 0-39 (default) — disqualify

## Day 3-5: First Campaign

### Step 9: Create Your First Campaign

1. Navigate to **Campaigns** → **New Campaign**
2. Name your campaign descriptively (e.g., "Q3 Outbound - Series A SaaS - VP Sales")
3. Select your ICP (the one you configured in Steps 6-8)
4. Set campaign parameters:
   - **Target prospect count**: Start with 100-200 prospects for your first campaign
   - **Channel mix**: Email-only for first campaign (simplest to measure)
   - **Sequence template**: Use the default "6-Touch Cold Email" sequence
   - **Sending schedule**: Tue-Thu, 10am-4pm prospect local time

### Step 10: Review AI-Composed Outreach

The Bard agent will compose personalized outreach for each prospect based on their enriched profile:

1. Navigate to **Campaigns → [Your Campaign] → Outreach Review**
2. Review the generated sequences:
   - Check subject lines for relevance and deliverability
   - Verify personalization variables are populated correctly
   - Confirm CAN-SPAM elements are present (physical address, unsubscribe link)
3. Edit any sequences that need refinement (you can edit before sending)
4. Approve sequences for sending

### Step 11: Launch Your Campaign

1. Click **Launch Campaign**
2. Flow agent begins scheduling sends according to your configured schedule
3. Monitor real-time send progress in **Campaigns → [Your Campaign] → Activity**

**First Campaign Best Practices**:
- Start with 50-100 prospects (not 1,000) to test messaging
- Use a single channel (email) for clean measurement
- Monitor for 48 hours before scaling
- Check deliverability metrics (bounce rate <2%, spam complaint rate <0.1%)

## Day 5-7: Integrate Data Sources

### Step 12: Connect Additional Data Sources

Expand your research capabilities by connecting additional channels:

1. Navigate to **Settings → Data Sources**
2. Connect available sources based on your tier:

   | Source | Tier Required | Setup Effort | Value |
   |--------|--------------|-------------|-------|
   | Exa Search | All tiers | API key (1 min) | General web search |
   | LinkedIn | Scout+ | Browser auth (5 min) | Professional profiles |
   | GitHub | Scout+ | OAuth (2 min) | DevTools companies |
   | Google Maps | Command+ | API key (2 min) | Physical businesses |
   | SEC EDGAR | Command+ | No key needed | US public companies |
   | OpenCorporates | Command+ | API key (1 min) | Company registries |

3. Test each connected source with a sample search
4. Review rate limit status for each source

### Step 13: Import Existing Data

If you have existing prospect lists:

1. Navigate to **Leads → Import**
2. Upload CSV/Excel file with columns mapped to LeadReach fields
3. Select import options:
   - **Deduplicate against existing leads**: ✅ (recommended)
   - **Auto-enrich imported leads**: ✅ (enriches with Forge after import)
   - **Apply ICP scoring**: ✅ (scores imported leads against your active ICP)
4. Review import results and resolve any data quality issues

## Day 7-14: Configure Agent Deployment

### Step 14: Enable Agent Pipeline Stages

By this point, you've used Scout and Bard. Enable the remaining agents based on your tier:

1. **Forge (Enrichment)**: Navigate to **Settings → Agents → Forge** and enable:
   - Firmographic enrichment ✅
   - Technographic enrichment ✅
   - People discovery ✅
   - Behavioral signals ✅
   - Set enrichment depth: "Standard" (faster) or "Deep" (more complete)

2. **Sage (Intelligence)**: Auto-enabled when Forge is active. Sage contextualizes enriched data with industry knowledge.

3. **Judge (Qualification)**: Navigate to **Settings → Agents → Judge** and configure:
   - Qualification framework: BANT (default), MEDDIC, or Custom
   - Minimum grade for outreach: B (default)
   - Auto-disqualify D-grade: ✅ (recommended)

4. **Flow (Execution)**: Configure in **Settings → Agents → Flow**:
   - Default sequence: 6-Touch Cold Email
   - Sending schedule: Tue-Thu, 10am-4pm local
   - Daily send limit per mailbox: 40 (safe starting point)
   - Reply detection: IMAP polling (default) or ESP webhook

5. **Echo (Reporting)**: Auto-enabled. Configure in **Settings → Agents → Echo**:
   - Report frequency: Daily summary + Weekly deep dive
   - Delivery: Email + In-app dashboard
   - Key metrics to track: Reply rate, Meeting rate, Pipeline generated

### Step 15: Set Up Automation Rules

1. Navigate to **Settings → Automation**
2. Configure automated workflows:

   **Auto-Enrichment Rule**:
   - Trigger: New lead added to campaign
   - Action: Run Forge enrichment pipeline
   - Condition: Lead has <10 fields populated

   **Auto-Qualification Rule**:
   - Trigger: Enrichment completed
   - Action: Run Judge scoring
   - Condition: ICP score not yet calculated

   **Reply Routing Rule**:
   - Trigger: Reply received from prospect
   - Action: Notify assigned rep via email + Slack
   - Condition: Reply classified as positive or question
   - SLA: 30-minute response time

   **Stage Transition Rule**:
   - Trigger: Positive reply received
   - Action: Move prospect to "Engaged" stage
   - Condition: Prospect currently in "Contacted" stage

## Day 14-30: Measure & Optimize

### Step 16: Review First Campaign Results

After 2 weeks of your first campaign running, review performance:

1. Navigate to **Analytics → Campaign Performance**
2. Review key metrics:

   | Metric | Good | Needs Work | Action if Low |
   |--------|------|------------|---------------|
   | Open Rate | >40% | <25% | Check subject lines, sender reputation |
   | Reply Rate | >8% | <4% | Review personalization, hooks, ICP targeting |
   | Meeting Rate | >4% | <2% | Review CTA clarity, value proposition |
   | Unsubscribe Rate | <0.5% | >1% | Review targeting relevance, frequency |
   | Bounce Rate | <2% | >5% | Review email verification, data quality |

3. Identify the top-performing sequence (highest reply rate)
4. Identify the top-performing ICP segment (highest A-grade density)

### Step 17: Iterate on Messaging

Based on first campaign results:

1. **If open rate is low**: A/B test subject lines
   - Test: Question vs. Statement vs. Trigger-event subject lines
   - Sample size: 500+ per variant
   - Measure: Open rate after 48 hours

2. **If reply rate is low**: A/B test email hooks
   - Test: Pain-based vs. Trigger-based vs. Mutual-connection opening
   - Sample size: 200+ per variant
   - Measure: Reply rate of opens

3. **If meeting rate is low**: A/B test CTAs
   - Test: Specific time ("15 min Tuesday 2pm?") vs. Open ("Worth a chat?")
   - Sample size: 300+ per variant
   - Measure: Meeting booked rate of positive replies

4. **If unsubscribe rate is high**: Review targeting
   - Check if C-grade prospects are receiving outreach (should be nurture only)
   - Reduce frequency (stretch sequence to 4 weeks instead of 2)
   - Improve personalization depth (3+ variables per email)

## 30-Day Success Milestones

By the end of Day 30, you should have achieved:

| Milestone | Target |
|-----------|--------|
| ICP defined and validated | ✅ |
| First campaign launched | ✅ |
| 200+ prospects researched | ✅ |
| 100+ outreach sends | ✅ |
| First replies received | ✅ |
| First meeting booked | ✅ (stretch goal) |
| Agent pipeline configured | ✅ |
| Data sources connected | ✅ (3+ channels) |
| Messaging A/B test running | ✅ |

## Days 31-60: Scale & Integrate

### Step 18: Expand Campaign Portfolio

Launch 2-3 additional campaigns targeting different ICP segments:

1. **Campaign 2: Different ICP segment** — e.g., different industry, company size, or geography
2. **Campaign 3: Different channel mix** — e.g., add LinkedIn touches alongside email
3. **Campaign 4: Trigger-event campaign** — e.g., recently funded companies, new executive hires

Each campaign should have distinct targeting, messaging, and success metrics.

### Step 19: Integrate Your CRM

For Command+ tier users:

1. Navigate to **Settings → Integrations**
2. Select your CRM (Salesforce, HubSpot, or Pipedrive)
3. Authorize the connection via OAuth
4. Configure field mapping:
   - LeadReach `prospect.id` → CRM `Lead.Id`
   - LeadReach `prospect.company` → CRM `Account.Name`
   - LeadReach `prospect.stage` → CRM `Lead.Status`
   - LeadReach `prospect.icp_score` → CRM `Lead.ICP_Score__c`
5. Set sync direction: Bidirectional (recommended)
6. Test sync with 5 sample leads
7. Enable continuous sync

### Step 20: Deploy Multi-Channel Outreach

Expand beyond email-only:

1. **LinkedIn Touches**: Connect your LinkedIn account via browser service; configure connection request templates; set daily limit (20 connection requests/day)
2. **Phone Touches**: Add phone channel ($99/mo add-on); configure local caller ID; set calling hours (8am-9pm local); check DNC compliance
3. **Content Touches**: For high-value A-grade prospects; create LinkedIn post templates; record 90-second Loom videos

### Step 21: Implement Advanced Scoring

Refine Judge's scoring based on 30 days of real data:

1. Navigate to **ICP Builder → Scoring Configuration**
2. Review "ICP Performance Analysis" (auto-generated by Echo):
   - Which ICP criteria correlate with positive replies?
   - Which criteria don't matter?
   - Are there unexpected predictors of conversion?
3. Adjust scoring weights based on data (not assumptions)
4. Update grade thresholds if needed
5. Re-score existing leads with updated model

## 60-Day Success Milestones

| Milestone | Target |
|-----------|--------|
| 3+ campaigns running | ✅ |
| 1,000+ prospects in pipeline | ✅ |
| 500+ outreach sends | ✅ |
| Reply rate >6% | ✅ |
| 5+ meetings booked | ✅ |
| CRM integration live | ✅ |
| Multi-channel outreach active | ✅ |
| ICP scoring refined with data | ✅ |
| A/B test winner identified | ✅ |
| First deal in pipeline | ✅ (stretch goal) |

## Days 61-90: Optimize & Scale

### Step 22: Implement Pipeline Analytics

1. Navigate to **Analytics → Pipeline Funnel**
2. Review the 7-stage funnel conversion rates:
   - Identified → Contacted (target: >90%)
   - Contacted → Engaged (target: >8%)
   - Engaged → Qualified (target: >50%)
   - Qualified → Opportunity (target: >30%)
   - Opportunity → Customer (target: >20%)

3. Identify bottlenecks:
   - Low Identified → Contacted: Data quality issues, missing emails
   - Low Contacted → Engaged: Messaging problems, wrong ICP
   - Low Engaged → Qualified: Qualification criteria too strict or reps not following up
   - Low Qualified → Opportunity: Value proposition not resonating
   - Low Opportunity → Customer: Competitive losses, pricing issues

4. Implement targeted fixes for each bottleneck

### Step 23: Scale Team Usage

1. **Onboard additional SDRs/AEs**:
   - Create individual accounts with appropriate roles
   - Assign campaigns and leads to specific team members
   - Set up notification routing (replies go to assigned rep)

2. **Establish team workflows**:
   - Daily standup: Review previous day's replies and meetings
   - Weekly pipeline review: Funnel conversion and campaign performance
   - Monthly strategy: ICP adjustments, new campaign planning

3. **Configure team-level analytics**:
   - Rep performance comparison (activity, conversion, velocity)
   - Campaign ROI by team member
   - Best practices sharing (top performer's messaging vs. average)

### Step 24: Advanced Automation

1. **Trigger-Event Monitoring**: Set up automated monitoring for:
   - Funding announcements (Crunchbase, news)
   - Executive changes (LinkedIn, news)
   - Technology changes (PublicWWW, BuiltWith)
   - Job postings (LinkedIn Jobs)

2. **Re-Engagement Campaigns**: Create automated nurture sequences for:
   - C-grade prospects (quarterly check-in)
   - Stalled opportunities (monthly value-add touch)
   - Past customers (win-back campaign)

3. **Competitive Displacement**: Configure campaigns targeting:
   - Companies using competitor products (detected via technographic enrichment)
   - Companies with negative competitor reviews (G2, TrustRadius)
   - Companies with recent competitor contract expirations

## 90-Day Success Milestones

| Milestone | Target |
|-----------|--------|
| 5+ campaigns running simultaneously | ✅ |
| 5,000+ prospects in pipeline | ✅ |
| 2,000+ outreach sends | ✅ |
| Reply rate >8% | ✅ |
| 20+ meetings booked | ✅ |
| Pipeline generated >$100K | ✅ |
| First deal closed | ✅ (stretch goal) |
| Full 8-agent pipeline operational | ✅ |
| Team-wide adoption (3+ active users) | ✅ |
| CRM integration fully bidirectional | ✅ |
| A/B testing discipline established | ✅ |
| Monthly reporting cadence set | ✅ |

## Technical Details: Deployment Configuration

### Agent Deployment Checklist

| Agent | Configuration Steps | Estimated Time |
|-------|-------------------|----------------|
| Atlas | No configuration needed (always active) | 0 min |
| Scout | Connect data sources (Exa, LinkedIn, etc.) | 15-30 min |
| Forge | Enable enrichment modules, set depth | 10 min |
| Sage | No configuration needed (uses knowledge base) | 0 min |
| Judge | Select qualification framework, set grade thresholds | 15 min |
| Bard | Review default sequence templates, customize if needed | 20 min |
| Flow | Connect email, configure sending schedule, set limits | 20 min |
| Echo | Set report frequency and delivery channels | 10 min |

### Environment Configuration

| Setting | Recommended Value | Notes |
|---------|------------------|-------|
| Daily send limit per mailbox | 40 emails/day | Increase to 50 after 4 weeks of good deliverability |
| Sequence duration | 15 days (6 touches) | Extend to 21 days for enterprise prospects |
| Reply detection method | ESP webhook | More reliable than IMAP polling |
| Auto-pause on reply | Enabled | Prevents sending to someone who already replied |
| Suppression list sync | Hourly | Ensures unsubscribes are honored promptly |
| ICP scoring refresh | Daily | Keeps scores current with new enrichment data |
| Knowledge base updates | Monthly | Ensure industry/region knowledge is current |

## LeadReach Agent Integration During Onboarding

The onboarding journey progressively activates each agent in the 8-agent pipeline:

**Week 1 (Atlas + Scout + Bard)**: The first week focuses on the essential trio—Atlas for query orchestration, Scout for prospect discovery, and Bard for outreach composition. Even at the Scout tier, these three agents deliver immediate value by automating the research-to-outreach workflow.

**Week 2 (Forge + Judge)**: The second week activates enrichment and qualification. Forge fills in the 50+ field profiles that make Bard's personalization possible, and Judge ensures you're prioritizing the right prospects.

**Week 3 (Sage + Flow)**: The third week brings intelligence and execution online. Sage provides contextual industry/region knowledge that improves every downstream decision, and Flow takes Bard's compositions from drafts to scheduled sends.

**Week 4 (Echo)**: The final onboarding week activates reporting. Echo synthesizes the first month's data into actionable insights—what's working, what's not, and what to change.

This progressive activation ensures that each agent has sufficient data from upstream agents to operate effectively. Activating Forge without Scout data would produce empty enrichments; activating Flow without Bard compositions would have nothing to execute.

## Best Practices

1. **Don't skip the ICP step**: The most common onboarding mistake is launching campaigns without a well-defined ICP. A vague ICP produces irrelevant prospects, poor scoring, and generic outreach. Invest 30-60 minutes in the ICP builder before anything else.

2. **Start small, measure, then scale**: Your first campaign should target 100-200 prospects, not 1,000. This gives you clean data on messaging effectiveness without wasting outreach budget on unproven sequences.

3. **Check deliverability before scaling**: Verify SPF, DKIM, and DMARC records before sending. A 2% bounce rate is the maximum safe threshold. If you're above 2%, pause sending and investigate before continuing.

4. **Respond to replies within 30 minutes**: The 30-minute rule is critical. Replies go cold quickly—prospects who receive a response within 30 minutes are 8x more likely to book a meeting than those who wait 24 hours.

5. **Review Echo's weekly report every Monday**: The weekly report surfaces the most impactful insights—reply rate trends, best-performing sequences, ICP scoring accuracy. Don't let these insights sit unread.

6. **Don't over-personalize**: Bard's 5-variable system is designed to use 3-5 variables per email. Using all 5 in every email can feel invasive. 3 is the sweet spot for most B2B outreach.

7. **Keep your knowledge base updated**: Sage's intelligence quality depends on the knowledge base. If you're targeting a new industry or region, check if knowledge documents exist for it. If not, request them from the LeadReach team.

8. **Use A/B testing religiously**: Every campaign should have at least one A/B test running. Test subject lines first (highest impact), then hooks, then CTAs. Build a playbook of what works for your audience.

9. **Calibrate expectations with conservative ROI**: Use the conservative ROI model from the Pricing Guide to set stakeholder expectations. Under-promise and over-deliver rather than the reverse.

10. **Schedule a quarterly business review**: After 90 days, schedule a review with your Customer Success Manager to assess performance, adjust your plan tier if needed, and plan the next quarter's strategy.

## Cross-References

- [LeadReach Platform Overview](./leadreach-platform-overview.md) — Platform capabilities and architecture
- [Agent Pipeline Architecture](./agent-pipeline-architecture.md) — 8-agent pipeline design and data flow
- [Data Security & Privacy](./data-security-privacy.md) — Security configuration and compliance setup
- [Pricing & Packaging Guide](./pricing-packaging-guide.md) — Plan selection and ROI calculation
- [Release Notes](./release-notes.md) — Current version features and known issues
- [Domain: ICP Design & Scoring](../domain/icp-design-scoring-methodology.md) — Detailed ICP construction methodology
- [Domain: Outreach Methodology](../domain/outreach-methodology-cold-email-sequences.md) — Cold email and sequence design
- [Playbook: Outbound Cold Email](../playbooks/outbound-cold-email.md) — Step-by-step outbound playbook
- [Playbook: ICP Discovery](../playbooks/icp-discovery.md) — ICP discovery and validation playbook
