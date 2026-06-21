---
title: "Trigger Events — Detection, Classification, and Outreach Timing"
slug: trigger-events-detection-timing
category: domain
tags: [trigger-events, signals, timing, outreach, sage]
agents: [sage, scout, bard, atlas]
intent_types: [research_company, build_icp, compose_outreach]
priority: 87
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "The complete catalog of trigger events that signal outreach opportunities, with detection methods and timing windows for maximum reply rates."
---

# Trigger Events — Detection, Classification, and Outreach Timing

## 1. Why Trigger Events Matter

Trigger events are **observable changes** in a target account that create a window of opportunity for outreach. They matter because they convert cold outreach from interruption into **timely relevance**.

A prospect who ignored your email last month may respond this month because:
- They just hired a new VP who has used your product before
- They just raised a funding round and have budget to spend
- Their incumbent vendor just announced a price increase
- A new regulation just took effect that creates compliance pressure
- Their competitor just did X and they need to respond

The Sage agent's primary job is **trigger event detection** — scanning news, financials, and filings to surface these windows. Bard then crafts outreach that **references the trigger**, producing 3-10× higher reply rates.

## 2. The Trigger Event Catalog

LeadReach tracks 14 categories of trigger events. Each has a **detection method**, **outreach window**, and **best outreach angle**.

### Category 1: Funding Events
**Examples**: Seed, Series A-E, IPO, secondary offering, debt financing
**Detection sources**:
- Crunchbase API (paid) — most reliable for funding rounds
- Press releases (PRNewswire, Business Wire) — search for "raised", "funding", "Series"
- TechCrunch, Axios Pro Rata, Pitchbook news
- SEC EDGAR Form D (Reg D filings — required for private securities offerings)
- Company blog / press page

**Outreach window**: 2-12 weeks after announcement
- Too soon (<2 weeks): They're celebrating, not buying
- Sweet spot (2-12 weeks): Budget is fresh, they're in execution mode
- Too late (>3 months): Budget allocated, slower buying

**Best outreach angle**:
- Acknowledge the raise briefly (one sentence — don't be a sycophant)
- Reference the use of proceeds (e.g., "expand sales team" → pitch your SDR tool)
- Position as enabling the growth they just funded

### Category 2: Executive Hires
**Examples**: New CEO, CRO, CTO, VP Sales, VP Marketing
**Detection sources**:
- LinkedIn (new role updates)
- Press releases (company's press page)
- News articles (trade publications)
- Conference announcements (new speakers)
- The company's "team" page updates

**Outreach window**: 30-90 days after hire
- Too soon (<30 days): They're still onboarding, not making decisions
- Sweet spot (30-90 days): They're evaluating their stack and making changes
- Too late (>90 days): They've settled in, default to status quo

**Best outreach angle**:
- Reference their previous role ("Congrats on joining Acme from Stripe — at Stripe you scaled the SDR team 5x using [similar tool]")
- Position as helping them in their first 100 days
- Avoid: "Welcome to Acme!" (everyone says this — it's noise)

### Category 3: Product Launches
**Examples**: New product, major feature release, geographic expansion
**Detection sources**:
- Company blog
- Product Hunt launches
- Press releases
- App store / marketplace listings
- Conference talks (executive keynotes)

**Outreach window**: 1-8 weeks after launch
- Too soon (<1 week): They're focused on launch logistics
- Sweet spot (1-8 weeks): Post-launch momentum, evaluating results
- Too late (>8 weeks): Launch forgotten, back to BAU

**Best outreach angle**:
- Reference the launch specifically
- Position as supporting the new product line (infrastructure, integrations, analytics)
- If the launch failed publicly, do NOT reference it (poor taste)

### Category 4: Mergers & Acquisitions
**Examples**: Acquired, acquiring, merger, divestiture, spin-off
**Detection sources**:
- SEC EDGAR (8-K filings announce material events)
- Press releases
- News (Reuters, Bloomberg, FT)
- LinkedIn (executive updates — "excited to share I'm now at [acquirer]")

**Outreach window**: 90-180 days after close
- Too soon (<90 days): Integration chaos, no one knows who's buying what
- Sweet spot (90-180 days): Integration settling, decisions being made about tooling
- Too late (>180 days): Decisions made, budgets merged

**Best outreach angle**:
- Acknowledge the integration challenge
- Position as helping standardize / consolidate tools post-merger
- Reference similar integrations you've supported

### Category 5: Layoffs & Restructuring
**Examples**: Layoffs, RIF, restructuring, office closure
**Detection sources**:
- Layoffs.fyi (tracker)
- WARN Act filings (US — required for 50+ employee layoffs)
- News (TechCrunch, Bloomberg, local business journals)
- LinkedIn (multiple departures in short window)
- Glassdoor reviews (sudden spike in negative reviews)

**Outreach window**: 60-120 days after layoffs
- Too soon (<60 days): Survivor's guilt, freeze on spending
- Sweet spot (60-120 days): "Do more with less" mentality, evaluating tools
- Too late (>120 days): New normal established

**Best outreach angle**:
- DO NOT mention the layoffs directly — that'stone-deaf
- Position as helping the smaller team do more
- Cost-savings angle ("reduce tool spend by 30% while maintaining capacity")

### Category 6: Earnings Reports (Public Companies)
**Examples**: Quarterly earnings, annual results, guidance changes
**Detection sources**:
- SEC EDGAR (10-Q quarterly, 10-K annual, 8-K current events)
- Earnings call transcripts (Seeking Alpha, Motley Fool)
- Press releases (post-earnings)

**Outreach window**: 1-4 weeks after earnings
- Too soon (<1 week): Earnings debrief, internal priorities
- Sweet spot (1-4 weeks): Strategy adjustments based on results
- Too late (>4 weeks): Strategy set, execution mode

**Best outreach angle**:
- Reference specific metrics from the earnings call ("You mentioned 40% YoY growth in APAC")
- Position as enabling the strategic priorities mentioned
- For misses: cost optimization, efficiency plays
- For beats: scale, expansion plays

### Category 7: Regulatory Changes
**Examples**: New regulation, compliance deadline, enforcement action
**Detection sources**:
- Government publications (Federal Register, EU Official Journal)
- Industry publications (legal blogs, trade press)
- Company 10-K risk factors
- News (regulatory actions are public)

**Outreach window**: 3-12 months before deadline
- Too soon (>12 months): Not urgent, slow evaluation
- Sweet spot (3-12 months): Active compliance projects, budget allocated
- Too late (<3 months): Panic mode, too late to evaluate vendors

**Best outreach angle**:
- Reference the regulation specifically (e.g., "With GDPR enforcement starting May 25...")
- Position as solving the compliance requirement
- Highlight certifications / audit reports you have

### Category 8: Hiring Patterns
**Examples**: Aggressive hiring in a function, hiring for specific roles, hiring slowdown
**Detection sources**:
- Company careers page
- LinkedIn Jobs (search by company)
- Greenhouse / Lever / Ashby job boards (many companies use these)
- Aggregator sites (Indeed, Glassdoor)

**Outreach window**: Immediate (hiring is a real-time signal)
- Best within 30 days of job posting
- For aggressive hiring patterns (5+ open roles in a function): Immediate

**Best outreach angle**:
- Reference the specific role ("Saw you're hiring a Head of Sales Ops")
- Position as enabling the new function (sales ops tool for new Head of Sales Ops)
- If they're hiring for a function that didn't exist, that's a strong signal

### Category 9: Technology Adoption
**Examples**: New CRM installed, new analytics tool, cloud migration
**Detection sources**:
- PublicWWW (re-scan detects new tech)
- BuiltWith change alerts
- DNS records (new subdomains suggest new tools)
- Job postings (mention specific tools)

**Outreach window**: 30-90 days after adoption
- Too soon (<30 days): Implementation phase, not evaluating new tools
- Sweet spot (30-90 days): First evaluation cycle, looking for adjacent tools
- Too late (>90 days): Stack settled

**Best outreach angle**:
- Acknowledge the new tool (positive framing)
- Position as integrating with or extending the new tool
- Adjacent category play (e.g., they just installed Marketo → pitch your attribution tool that integrates with Marketo)

### Category 10: Competitor Displacement
**Examples**: Incumbent vendor failing, contract expiring, public complaints
**Detection sources**:
- News (vendor outages, security incidents)
- Twitter/X (prospect employees complaining about a vendor)
- G2 / TrustRadius reviews (negative trends)
- LinkedIn (vendor departures)
- Conference talks (sometimes prospects mention tools they're moving away from)

**Outreach window**: 30-90 days after the displacement signal
- Sweet spot: They're evaluating alternatives, budget allocated to switch

**Best outreach angle**:
- Acknowledge the pain indirectly ("Many teams we talk to are re-evaluating their [category] stack")
- Position as the alternative / replacement
- Provide migration guide / case study of similar switch

### Category 11: Geographic Expansion
**Examples**: New office, new country, new region
**Detection sources**:
- Press releases
- LinkedIn (new office location, new hires in new region)
- News (expansion announcements)
- Job postings in new geographies

**Outreach window**: 30-120 days after announcement
- Sweet spot: They're building out infrastructure for the new region

**Best outreach angle**:
- Acknowledge the expansion
- Position as supporting the new region (localization, regional compliance, regional data centers)
- Time zone / language angle

### Category 12: Conference & Event Participation
**Examples**: Speaking at a conference, attending an event, sponsoring
**Detection sources**:
- Conference agendas
- LinkedIn posts
- Company press releases
- Event websites

**Outreach window**: Before and during the event
- 1-2 weeks before: "Will you be at [event]?"
- During event: In-person if you're there
- 1-2 weeks after: Follow-up referencing their talk

**Best outreach angle**:
- Reference their speaking topic
- Meet at the event (if you're attending)
- After event: "Loved your talk on X — quick question"

### Category 13: Content & Thought Leadership
**Examples**: New blog post, podcast appearance, LinkedIn post going viral
**Detection sources**:
- Company blog RSS
- LinkedIn (their posts + comments)
- Podcast directories
- Twitter/X (mention search)

**Outreach window**: 1-7 days after publication
- Sweet spot: While the content is fresh, they're engaged with the topic

**Best outreach angle**:
- Reference specific point from their content
- Add value to the conversation (don't just say "great post")
- Position as extending the thinking

### Category 14: Public Customer Complaints
**Examples**: Twitter complaints, bad reviews, support forum posts
**Detection sources**:
- Twitter advanced search ("[company] sucks", "@[handle] issue")
- G2, TrustRadius, Capterra reviews
- Reddit (industry subreddits)
- Support forums

**Outreach window**: 1-14 days after complaint
- Sweet spot: They're aware of the issue, evaluating solutions

**Best outreach angle**:
- DO NOT mention the complaint directly (feels like surveillance)
- Position as preventing similar issues
- Educational angle (best practices, alternative approaches)

## 3. Detection Cadence

Sage should run trigger event detection on a regular cadence:

- **Tier 1 accounts** (active deals, top-100 ICP): Daily scan
- **Tier 2 accounts** (top-1000 ICP): Weekly scan
- **Tier 3 accounts** (top-10000 ICP): Monthly scan
- **Tier 4 accounts** (long tail): Quarterly scan

## 4. The Trigger Event Output Schema

```typescript
interface TriggerEvent {
  id: string;
  company_id: string;
  type: 'funding' | 'executive_hire' | 'product_launch' | 'ma' | 'layoff' |
        'earnings' | 'regulatory' | 'hiring' | 'tech_adoption' |
        'competitor_displacement' | 'geographic_expansion' | 'conference' |
        'content' | 'complaint';
  severity: 'high' | 'medium' | 'low';  // impact on outreach opportunity
  title: string;
  description: string;
  detected_at: string;
  event_date: string;
  source: {
    type: string;  // 'press_release', 'news', 'sec_filing', 'linkedin', etc.
    url: string;
    retrieved_at: string;
  };
  outreach_window: {
    start: string;  // ISO date
    end: string;
    peak: string;  // best date
  };
  suggested_angle: string;
  confidence: number;  // 0-1
}
```

## 5. Integration with Bard

When Bard composes outreach, it should:
1. Query Sage for trigger events on the prospect
2. If a recent high-severity trigger exists, lead with it
3. If no recent trigger, use a generic angle (industry pattern, technology, etc.)
4. Never reference a trigger more than 14 days old (it's stale)
5. Never reference multiple triggers in one email (feels surveilled)

## 6. Common Detection Failures

### Failure 1: Stale Triggers
Surface a 6-month-old funding round as "recent news." Counter: Always check `event_date`, not `detected_at`. Triggers >90 days old should not be used in outreach.

### Failure 2: Hallucinated Triggers
LLM invents a plausible-sounding trigger that didn't actually happen. Counter: Every trigger must cite a verifiable source URL.

### Failure 3: Wrong Company
Sage conflates two companies with similar names. Counter: Always verify the trigger is about the specific prospect (check LinkedIn URL match, website match).

### Failure 4: Trigger Spam
Listing 10 triggers in one email. Counter: One trigger per email, max. Use the most recent and most relevant.

### Failure 5: Insensitive Timing
Outreaching 2 days after a layoff announcement. Counter: Built-in delays — layoffs need 60+ days, M&A needs 90+ days, executive hires need 30+ days.
