---
title: "Prospecting & Research Methodology — Systematic Lead Discovery for B2B"
category: methodology
grade: A
last_reviewed: "2026-07-03"
tags: [prospecting, research, lead-discovery, outbound, ICP, signal-detection, scout, atlas, multi-channel]
---

# Prospecting & Research Methodology — Systematic Lead Discovery for B2B

## Executive Summary

Prospecting is the lifeblood of every B2B revenue engine. Yet most organizations treat it as an art — relying on rep intuition, ad-hoc LinkedIn browsing, and purchased lists of dubious quality. The LeadReach Prospecting & Research Methodology replaces guesswork with a **systematic, signal-driven, multi-channel discovery process** that transforms prospecting from a creative exercise into a repeatable, measurable, and scalable operation.

This methodology establishes a four-phase research framework — **Define, Discover, Distill, Deploy** — that ensures every prospect entering the LeadReach pipeline is relevant, verified, and actionable. By anchoring discovery to the Ideal Customer Profile (ICP), triangulating across multiple data sources, and applying quantitative scoring at each stage, we eliminate the two most common prospecting failures: surfacing too many low-fit leads and missing high-fit leads that don't match obvious patterns.

The result is a prospecting engine that consistently delivers **3-5x higher conversion rates** from identified lead to qualified opportunity compared to list-purchasing or manual research approaches. When executed through the LeadReach 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo), this methodology becomes a fully automated, continuously improving discovery system that scales without sacrificing quality.

## Core Methodology

### The 4D Research Framework: Define → Discover → Distill → Deploy

The 4D framework ensures that prospecting begins with strategic clarity, proceeds through exhaustive discovery, narrows with rigorous filtering, and ends with actionable, pipeline-ready leads.

---

#### Phase 1: Define — Establish Research Parameters

Before any search begins, the research parameters must be codified. This is not a brainstorming exercise — it is a precise specification of who qualifies, what signals indicate fit, and where to look.

**Step 1.1: Decompose the ICP into Searchable Attributes**

The ICP (as defined in `icp-design-scoring-methodology.md`) must be translated from scoring dimensions into concrete, searchable terms. Each ICP dimension maps to specific search queries and source channels.

| ICP Dimension | Searchable Attribute | Primary Source | Fallback Source |
|---|---|---|---|
| Firmographics — Industry | NAICS/SIC codes, vertical keywords | LinkedIn, Crunchbase | SEC EDGAR, OpenCorporates |
| Firmographics — Size | Employee count range, revenue range | LinkedIn, Glassdoor | ZoomInfo, Apollo |
| Technographics | Product names in HTML/JS | BuiltWith, PublicWWW | Job postings, GitHub |
| Behavioral — Hiring | Job title keywords on career pages | Greenhouse, Lever | LinkedIn Jobs, Indeed |
| Behavioral — Funding | Funding round type and date | Crunchbase, PitchBook | Press releases |
| Contextual — Trigger Events | M&A, leadership change, expansion | Google News, PRNewswire | Industry newsletters |
| Accessibility | LinkedIn activity, email pattern | LinkedIn, Hunter.io | Company website, WHOIS |

**Step 1.2: Define the Signal Hierarchy**

Not all signals carry equal weight. Establish a three-tier signal hierarchy before discovery begins:

- **Tier 1 — Primary Signals (must-have)**: Non-negotiable indicators of fit. A prospect missing all Tier 1 signals is excluded. Example: "Uses Salesforce CRM" for a Salesforce integration partner.
- **Tier 2 — Secondary Signals (strong indicators)**: High-predictive-value signals that, combined, can compensate for a missing Tier 1 signal. Example: "Hiring SDRs" + "Series B funded" for a sales acceleration tool.
- **Tier 3 — Tertiary Signals (contextual boosters)**: Signals that increase confidence but are not independently disqualifying. Example: "CTO spoke at AWS re:Invent" for a cloud migration service.

**Step 1.3: Set Volume and Coverage Targets**

| Segment | Target Prospects | Minimum Coverage | Quality Threshold |
|---|---|---|---|
| Core ICP (Score 80-100) | 50-100/quarter | 90% of TAM | ICP score ≥ 80 |
| Extended ICP (Score 60-79) | 200-500/quarter | 70% of TAM | ICP score ≥ 60 |
| Adjacent (Score 40-59) | Monitor only | No target | N/A |

**Step 1.4: Document Constraints**

Record compliance constraints (GDPR, CAN-SPAM, industry-specific regulations), geographic exclusions, competitive overlay rules (don't prospect existing customers of partner X), and time-boxing rules (how long to spend researching a single account).

---

#### Phase 2: Discover — Multi-Channel Exhaustive Search

Discovery must be exhaustive. The #1 failure mode in prospecting is relying on a single channel. LeadReach mandates a minimum of **3 independent channels** per research campaign.

**Step 2.1: Channel-Specific Search Execution**

| Channel | Best For | Search Strategy | Yield Rate |
|---|---|---|---|
| LinkedIn Companies | Firmographic filtering | Boolean search with industry + size filters | High precision, low volume |
| LinkedIn People | Decision-maker identification | Title + company + seniority filters | Medium precision, medium volume |
| Crunchbase / PitchBook | Funding signals, investor-backed | Advanced query with round type + date | High precision, medium volume |
| BuiltWith / PublicWWW | Technographic detection | Technology stack queries | High precision, high volume |
| Job Boards (Greenhouse, Lever) | Hiring intent signals | Role title + company + date filters | Medium precision, high signal |
| Google News / PRWire | Trigger events | Company name + event type queries | Low precision, high signal |
| Industry Directories | Vertical-specific lists | Category browsing + filtering | Low precision, high volume |
| Conferences / Events | Active buyers | Attendee/speaker list extraction | High signal, low volume |
| SEC EDGAR / Companies House | Public company data | Filing queries by SIC code | High precision, low volume |
| Community Forums (Reddit, HN) | Pain signal detection | Keyword + intent monitoring | Low precision, high signal |

**Step 2.2: Search Query Construction**

Every search query must follow the **SCOPE** format:
- **S**pecific: Target a particular attribute, not a vague concept
- **C**ombinable: Use Boolean operators (AND, OR, NOT) to narrow
- **O**bservable: Only include terms that appear in external data
- **P**rioritized: Rank queries by expected yield
- **E**xhaustive: Cover all variants and synonyms

Example — Poor query: `"fast growing tech companies"`
Example — SCOPE query: `"B2B SaaS" AND ("Series A" OR "Series B") AND (headcount:50-500) AND (CRM:"Salesforce" OR CRM:"HubSpot") NOT ("consulting" OR "agency")`

**Step 2.3: Deduplication Protocol**

After multi-channel discovery, prospects will appear across channels. Apply deduplication in this priority order:
1. **Domain match** — Same website domain = same company (highest confidence)
2. **LinkedIn URL match** — Same LinkedIn company slug = same company
3. **Name + Location match** — Same name and headquarters city = likely same company (manual review)
4. **Name-only match** — Flag for manual review (high false-positive rate)

---

#### Phase 3: Distill — Scoring, Filtering, and Prioritization

Raw discovery produces noise. The distillation phase converts a large, messy prospect pool into a prioritized, score-ranked list.

**Step 3.1: Apply the ICP Scoring Rubric**

Score each prospect against the ICP using the five-dimension scoring framework from `icp-design-scoring-methodology.md`:

| Dimension | Weight | Score Range | Calculation |
|---|---|---|---|
| Firmographics | 25% | 0-25 | Weighted sum of attribute matches |
| Technographics | 20% | 0-20 | Stack overlap percentage × weight |
| Behavioral Signals | 25% | 0-25 | Signal count × signal tier weight |
| Contextual Fit | 20% | 0-20 | Trigger event relevance × recency decay |
| Accessibility | 10% | 0-10 | Contact discoverability score |
| **Total** | **100%** | **0-100** | Sum of all dimensions |

**Step 3.2: Tier Classification**

| Tier | ICP Score | Action | Expected Volume |
|---|---|---|---|
| **Tier A — Hot** | 80-100 | Immediate outreach (within 24h) | 5-10% of pool |
| **Tier B — Warm** | 60-79 | Nurture sequence (within 1 week) | 15-25% of pool |
| **Tier C — Cool** | 40-59 | Add to monitoring list | 30-40% of pool |
| **Tier D — Exclude** | 0-39 | Remove from pipeline | 25-45% of pool |

**Step 3.3: Prioritization Within Tiers**

Within each tier, apply secondary sort criteria:
1. **Signal recency** — How fresh are the behavioral signals? (< 30 days = high priority)
2. **Deal size potential** — Estimated ARR based on company size and vertical
3. **Accessibility score** — Can we actually reach the decision-maker?
4. **Competitive window** — Is there an incumbent contract expiring?

**Step 3.4: Quality Assurance Sampling**

Before deploying the full list, manually validate a **random 5% sample** (minimum 10 accounts):
- Is the company real and active? (Not dissolved, not a shell company)
- Does the ICP score accurately reflect fit? (Manual override if needed)
- Is the decision-maker correct? (Title, seniority, current employment)
- Are the contact details valid? (Email format, LinkedIn profile exists)

---

#### Phase 4: Deploy — Activate in the Pipeline

Scored and prioritized prospects are handed off to the outreach pipeline.

**Step 4.1: Handoff Protocol**

| Target Tier | Handoff To | Format | SLA |
|---|---|---|---|
| Tier A | Bard → Flow | Full enriched profile + ICP score + signal summary | < 24 hours |
| Tier B | Bard → Flow | Enriched profile + ICP score | < 1 week |
| Tier C | Sage (monitoring) | Light profile + monitoring rules | Ongoing |
| Tier D | Archive | Minimal record for deduplication | None |

**Step 4.2: Research Documentation**

Every research campaign must produce:
1. **Campaign brief** — ICP, signal hierarchy, channel strategy, constraints
2. **Raw results** — All prospects found, with source citations
3. **Scored results** — Tiered and prioritized list
4. **QA report** — Sample validation results and override log
5. **Coverage estimate** — What percentage of the estimated TAM was reached

## Implementation Guide

### For LeadReach Agents — Step-by-Step

**Step 1: Atlas — Campaign Initiation**
- Receive user intent (e.g., "Find 200 SaaS companies using Salesforce that are hiring SDRs")
- Classify intent as `research_company` or `discover_places`
- Decompose into: ICP parameters, signal definitions, channel strategy
- Select pipeline: Atlas → Scout → Forge → Sage → Judge → Echo
- Pass structured context to Scout

**Step 2: Scout — Multi-Channel Discovery**
- Execute searches across all mandated channels (minimum 3)
- Apply SCOPE query format for each channel
- Collect raw results with source citations
- Apply deduplication protocol (domain → LinkedIn URL → name+location → name-only)
- Return deduplicated prospect list to Atlas

**Step 3: Forge — Enrichment**
- For each prospect in the deduplicated list, run the 5-stage enrichment funnel:
  1. Identity Resolution — Confirm company exists and is unique
  2. Firmographic Enrichment — Industry, size, revenue, location
  3. Technographic Enrichment — Technology stack, infrastructure
  4. People Enrichment — Decision-makers, roles, contact info
  5. Behavioral Enrichment — Recent news, trigger events, hiring
- Apply source hierarchy and conflict resolution rules from `data-enrichment-methodology.md`
- Return enriched profiles to Atlas

**Step 4: Sage — Signal Analysis**
- Analyze behavioral enrichment data for trigger events and intent signals
- Score signal strength and recency
- Identify the most compelling reason to engage (the "hook")
- Provide strategic recommendations for outreach approach
- Return analysis with signal-weighted context to Atlas

**Step 5: Judge — Qualification Scoring**
- Score each enriched prospect against the ICP rubric (5 dimensions, 100-point scale)
- Apply tier classification (A/B/C/D)
- Flag anomalies and edge cases for manual review
- Return scored and tiered list to Atlas

**Step 6: Echo — Reporting**
- Generate research campaign report with all 5 required documents
- Include coverage analysis, yield metrics, and quality scores
- Archive results for future deduplication and learning

## Scoring Frameworks & Criteria

### Prospecting Effectiveness Score (PES)

The PES measures the overall quality of a prospecting campaign. It combines reach, relevance, and actionability.

**Formula**: `PES = (Relevance Score × 0.4) + (Coverage Score × 0.3) + (Actionability Score × 0.3)`

| Component | Calculation | Benchmark |
|---|---|---|
| **Relevance Score** | (% of prospects scoring ≥ 60 on ICP) × 100 | ≥ 70 |
| **Coverage Score** | (Prospects found / Estimated TAM) × 100 | ≥ 50 |
| **Actionability Score** | (% of prospects with valid contact info + decision-maker ID) × 100 | ≥ 60 |
| **PES (composite)** | Weighted sum | ≥ 65 |

### Channel Yield Analysis

Track and optimize channel performance quarterly:

| Channel | Prospects/Tier A | Cost/Prospect | Signal Quality | Recommended Weight |
|---|---|---|---|---|
| LinkedIn | 15-25% | $8-15 | High | 30% |
| Crunchbase | 10-20% | $3-8 | High | 20% |
| BuiltWith | 20-30% | $1-3 | Medium | 20% |
| Job Boards | 5-15% | $2-5 | High | 15% |
| News/PR | 5-10% | $5-12 | Very High | 10% |
| Events | 2-5% | $20-50 | Very High | 5% |

### Signal Decay Model

Signals lose predictive value over time. Apply a decay function to prioritize recency:

| Signal Type | Half-Life | Decay Formula | Example |
|---|---|---|---|
| Funding announcement | 90 days | `score × e^(-0.0077 × days)` | 30-day-old signal = 79% value |
| Job posting | 45 days | `score × e^(-0.0154 × days)` | 30-day-old signal = 63% value |
| Executive change | 120 days | `score × e^(-0.0058 × days)` | 30-day-old signal = 84% value |
| Technology adoption | 180 days | `score × e^(-0.0039 × days)` | 30-day-old signal = 89% value |
| Press release | 60 days | `score × e^(-0.0116 × days)` | 30-day-old signal = 71% value |

## LeadReach Agent Integration

### Atlas (Strategic Orchestrator)
- Decomposes prospecting requests into structured research campaigns
- Selects the appropriate pipeline configuration based on intent
- Sets ICP parameters, signal hierarchy, and coverage targets
- Monitors mid-pipeline quality and triggers re-search if coverage is insufficient

### Scout (Discovery Specialist)
- Executes multi-channel searches across all mandated channels
- Applies SCOPE query construction methodology
- Performs initial deduplication using the 4-level dedup protocol
- Captures source citations for every discovered prospect

### Forge (Enrichment Engine)
- Runs the 5-stage enrichment funnel on each prospect
- Resolves data conflicts using the source trust hierarchy
- Computes data completeness scores for each profile
- Flags low-completeness profiles for additional research passes

### Sage (Research Analyst)
- Analyzes behavioral signals and trigger events
- Applies the signal decay model to weight recency
- Identifies the optimal "hook" for outreach based on signal analysis
- Provides competitive landscape context and strategic timing advice

### Judge (Qualification Gatekeeper)
- Scores every prospect against the 5-dimension ICP rubric
- Applies tier classification (A/B/C/D) with explicit thresholds
- Validates QA samples and flags anomalies
- Ensures no Tier D prospects leak into the outreach pipeline

### Bard (Outreach Composer)
- Receives Tier A and Tier B prospects with full context
- Crafts personalized outreach using signal-based hooks from Sage
- Adapts messaging to the prospect's stage-awareness level
- References specific trigger events for personalization

### Flow (Pipeline Orchestrator)
- Receives composed sequences and schedules deployment
- Enforces SLAs: Tier A within 24h, Tier B within 1 week
- Tracks prospect stage transitions through the 7-stage funnel
- Routes replies and engagement signals back for re-scoring

### Echo (Reporting & Analytics)
- Generates campaign-level prospecting reports
- Computes PES, channel yield, and coverage metrics
- Archives results for deduplication in future campaigns
- Feeds performance data back to improve search strategies

## Best Practices & Anti-Patterns

### Best Practices

1. **Always start with the ICP** — Never begin searching without a codified, scored ICP. "Find me leads" without parameters produces garbage.
2. **Triangulate across 3+ channels** — Single-channel prospecting has blind spots. LinkedIn alone misses companies with low social presence; Crunchbase alone misses bootstrapped companies.
3. **Score before you sort** — Apply the ICP rubric quantitatively before making subjective prioritization decisions.
4. **Prioritize signal recency** — A funding announcement from last week is 10x more valuable than one from 6 months ago. Use the decay model.
5. **Validate with QA sampling** — Always spot-check 5% of results before deploying. Automated scoring catches 85% of errors; manual review catches the rest.
6. **Document everything** — Every campaign brief, search query, and override must be logged for auditability and continuous improvement.
7. **Refresh quarterly** — Prospecting databases decay at 2-3% per month. Re-research Tier C prospects every 90 days.
8. **Use negative signals** — Actively exclude companies with disqualifying attributes (recently acquired, bankruptcy filing, massive layoffs). Exclusion is as important as inclusion.
9. **Layer signals for precision** — A single signal is weak. "Hiring SDRs" alone means little. "Hiring SDRs + Series B + uses Salesforce + expanding to EMEA" is a high-confidence prospect.
10. **Separate discovery from evaluation** — Don't filter during search. Capture broadly, then score narrowly. Premature filtering eliminates serendipitous finds.

### Anti-Patterns

1. **❌ Buying lists** — Purchased lists have 25-40% decay rate, no signal context, and create compliance risk. They produce volume without quality.
2. **❌ Single-channel dependency** — Relying solely on LinkedIn, or solely on Crunchbase, creates systematic blind spots and biases.
3. **❌ Vague ICPs** — "Mid-market tech companies" is not an ICP. It's a category. Without measurable criteria, scoring is impossible.
4. **❌ Ignoring signal decay** — Treating a 6-month-old funding announcement the same as a 1-week-old one dramatically overestimates prospect quality.
5. **❌ Skipping QA** — Deploying without validation leads to embarrassing outreach to dissolved companies, wrong decision-makers, and competitors.
6. **❌ Researching without constraints** — Unlimited research per account leads to diminishing returns. Time-box at 15 minutes per Tier A account, 5 minutes per Tier B.
7. **❌ Confusing activity with productivity** — 500 prospects found is not 500 qualified leads. Measure conversion rate, not discovery count.
8. **❌ Failing to archive** — Not documenting research results forces re-discovery in future campaigns, wasting time and creating inconsistencies.
9. **❌ Over-rotating on technology signals** — Tech stack alone doesn't make a good prospect. A company running Salesforce could be a 10-person nonprofit or a 10,000-person enterprise. Always combine technographics with firmographics.
10. **❌ Ignoring the "adjacent possible"** — Some of the best prospects don't match the obvious ICP pattern. Leave room for anomaly detection and manual override.

## Metrics & KPIs

### Primary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Discovery Rate** | New qualified prospects per week | 50-100 | Count of prospects with ICP score ≥ 60 |
| **Tier A Yield** | % of discovered prospects scoring 80+ | 8-12% | (Tier A count / Total discovered) × 100 |
| **Relevance Rate** | % of prospects scoring ≥ 60 | ≥ 65% | (Score ≥ 60 count / Total) × 100 |
| **Contact Discovery Rate** | % of prospects with valid decision-maker contact | ≥ 70% | (Valid contact count / Total) × 100 |
| **Cost per Qualified Lead** | Total research cost / Qualified leads (ICP ≥ 60) | < $25 | Research spend / Qualified count |
| **Prospecting Efficiency** | Qualified leads per research hour | 8-15 | Qualified count / Research hours |

### Secondary Metrics

| Metric | Definition | Target | Calculation |
|---|---|---|---|
| **Channel Coverage** | Avg. channels used per campaign | ≥ 3 | Sum of channels / Campaign count |
| **Deduplication Rate** | % of raw results that are duplicates | 15-30% | Duplicate count / Raw result count |
| **Data Freshness** | Avg. age of newest signal per prospect | < 45 days | Avg. days since newest signal |
| **QA Pass Rate** | % of sampled accounts that pass manual validation | ≥ 90% | Passed samples / Total samples |
| **TAM Coverage** | % of total addressable market discovered | ≥ 50% | Discovered ICP-fit / Estimated TAM |
| **Discovery-to-Outreach SLA** | Time from discovery to first outreach | Tier A: < 24h | Median time across tier |

### Quarterly Review Benchmarks

| KPI | Below Standard | Standard | Excellent |
|---|---|---|---|
| Tier A Yield | < 5% | 8-12% | > 15% |
| Relevance Rate | < 50% | 65-75% | > 80% |
| Cost per Qualified Lead | > $40 | $15-25 | < $10 |
| Prospecting Efficiency | < 5 leads/hr | 8-15 leads/hr | > 20 leads/hr |
| TAM Coverage | < 30% | 50-70% | > 80% |
| QA Pass Rate | < 80% | 90-95% | > 97% |

## Cross-References

- [ICP Design & Scoring Methodology](../domain/icp-design-scoring-methodology.md) — Foundation for the Define phase; scoring rubric used in Distill phase
- [Data Enrichment Methodology](../domain/data-enrichment-methodology.md) — Forge's enrichment funnel, source hierarchy, and conflict resolution
- [Lead Qualification Frameworks](../domain/lead-qualification-frameworks.md) — BANT/MEDDIC frameworks used by Judge for Tier A validation
- [Trigger Events Detection & Timing](../domain/trigger-events-detection-timing.md) — Signal taxonomy and decay models for behavioral enrichment
- [Outreach Methodology — Cold Email Sequences](../domain/outreach-methodology-cold-email-sequences.md) — Bard's outreach framework for Tier A/B deployment
- [B2B Lead Generation Core Theory](../domain/b2b-lead-generation-core-theory.md) — The 7-stage funnel and conversion benchmarks
- [Scout Agent Training](../agents/scout.md) — Discovery specialist operating procedures
- [Atlas Agent Training](../agents/atlas.md) — Strategic orchestrator decision framework
- [Forge Agent Training](../agents/forge.md) — Enrichment engine procedures
- [Sage Agent Training](../agents/sage.md) — Research analyst signal analysis methods
- [Judge Agent Training](../agents/judge.md) — Qualification gatekeeper scoring rules
- [Data Sources Catalog](../tools/data-sources-catalog.md) — Complete inventory of available search channels and APIs
