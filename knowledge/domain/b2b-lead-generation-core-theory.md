---
title: "B2B Lead Generation — Core Theory & Methodology"
slug: b2b-lead-generation-core-theory
category: domain
tags: [b2b, lead-generation, theory, methodology, fundamentals]
agents: [atlas, scout, forge, sage, judge, bard, flow, echo]
intent_types: [research_company, research_person, build_icp, score_lead, compose_outreach]
priority: 95
version: 2
updated: 2026-07-08
author: LeadReach Knowledge Engineering
summary: "The foundational vocabulary, mental models, and decision frameworks that every LeadReach agent must internalize before producing any output. Read this first."
---

# B2B Lead Generation — Core Theory & Methodology

## 1. What B2B Lead Generation Actually Is

B2B lead generation is the **systematic identification, qualification, and nurturing of organizations and decision-makers** who have both the **means** and the **motive** to purchase a product or service. Unlike B2C, where impulse and emotion drive conversions, B2B purchases are **multi-stakeholder, multi-month, risk-averse decisions** that follow predictable stages.

A "lead" is not a name in a spreadsheet. A lead is a **hypothesis** — that a specific person, at a specific company, has a specific pain that a specific solution can resolve within a specific window of time, and that this person has the authority, budget, and trust to drive that purchase to completion. Every field collected during research is evidence supporting or refuting that hypothesis.

The LeadReach platform operationalizes this by decomposing lead generation into **eight specialized agent functions** — Atlas (orchestration), Scout (discovery), Forge (enrichment), Sage (analysis), Judge (qualification), Bard (outreach), Flow (pipeline), Echo (insight). Each agent produces structured artifacts that downstream agents consume. The pipeline is **deterministic in shape** but **probabilistic in content** — agents make judgment calls at every step.

### 1.1 The B2B vs. B2C Distinction

Understanding the fundamental differences between B2B and B2C demand generation is essential for every agent, because the wrong mental model produces the wrong behavior at every downstream step.

| Dimension | B2C | B2B |
|-----------|-----|-----|
| Decision makers | 1 (individual) | 3–7 (buying committee) |
| Sales cycle | Minutes to days | 30–180+ days |
| Purchase driver | Emotion, impulse, brand | ROI, risk mitigation, peer proof |
| Price range | $5–$500 | $5K–$500K+ ACV |
| Information source | Social media, reviews | Analyst reports, peer references, POCs |
| Contract complexity | Click-wrap | MSA, SOW, DPA, security review |
| Churn pattern | Silent drift | Negotiated renewal with procurement |
| Attribution | Last-click dominant | Multi-touch, multi-channel, multi-thread |

Agents must never apply B2C logic to B2B contexts. For example, a B2C "flash sale" urgency trigger is counterproductive in enterprise sales — it signals desperation, not value. B2B urgency comes from trigger events (budget deadlines, compliance mandates, competitive pressure), not artificial scarcity.

### 1.2 The Lead as Hypothesis Framework

Every lead in the LeadReach system should be treated as a scientific hypothesis with explicit predictions, testable criteria, and a falsification threshold. The hypothesis has five components:

1. **Company hypothesis**: "This company has the structural characteristics (size, industry, tech stack) that make our solution valuable." Testable via firmographic and technographic data.
2. **Pain hypothesis**: "This company is experiencing a specific, acute pain that our solution addresses." Testable via behavioral signals, hiring patterns, and trigger events.
3. **Person hypothesis**: "This specific individual has both the authority and the motivation to act on this pain." Testable via title, tenure, reporting line, and recent activity.
4. **Timing hypothesis**: "The window for action is open now, not in 6 months." Testable via trigger events and budget cycles.
5. **Access hypothesis**: "We can reach this person through discoverable channels." Testable via email pattern, LinkedIn presence, and network proximity.

A lead with all five hypotheses supported is an **A-grade lead**. A lead with only the company hypothesis supported is a **C-grade lead** — it's a target account but not yet an actionable opportunity. The Judge agent scores each hypothesis independently, and the composite score reflects the overall strength of the lead hypothesis.

### 1.3 The Knowledge Funnel

LeadReach transforms raw data into actionable knowledge through a four-stage knowledge funnel:

1. **Data** → Raw signals: a LinkedIn profile, a job posting, a SEC filing, a website URL. Data is abundant but meaningless without interpretation.
2. **Information** → Structured data: "Company X has 200 employees, uses Salesforce, and is hiring 3 SDRs." Information is data in context but still lacks judgment.
3. **Intelligence** → Interpreted information: "Company X is in growth mode with a new SDR ramp — they likely need research tooling to accelerate rep productivity." Intelligence adds the "so what" layer.
4. **Wisdom** → Actionable intelligence: "Contact VP Sales Jane Doe with a peer reference from [similar company] who achieved 40% SDR productivity improvement." Wisdom connects intelligence to a specific action.

The Scout agent operates at the Data → Information layer. Forge enriches Information. Sage produces Intelligence. Judge and Bard produce Wisdom. Every agent should know which layer it operates at and avoid crossing layers prematurely (e.g., Scout should not produce Intelligence — that's Sage's role).

## 2. The Five Pillars of Lead Generation

Every successful B2B lead generation program rests on five interlocking pillars. A weakness in any one pillar collapses the entire program.

### Pillar 1: Ideal Customer Profile (ICP) Precision

An ICP is a **falsifiable description** of the company that benefits most from your solution. It is not aspirational ("fast-growing SaaS companies") — it is **observable and testable** ("US-based B2B SaaS companies, 50-500 employees, using Salesforce, with a Series A or later funding round, in the HR or DevTools vertical"). Every ICP criterion must be **detectable from external signals** so agents can score against it without insider knowledge.

A weak ICP produces a wide funnel of low-quality leads that exhaust the sales team. A strong ICP produces a narrow funnel of high-quality leads that convert at 5-10× the average rate. The LeadReach ICP module supports multi-dimensional scoring across firmographic, technographic, behavioral, and contextual dimensions.

#### The ICP Precision Spectrum

ICPs exist on a precision spectrum. The goal is to move from vague to precise without becoming so narrow that the addressable market shrinks below viability.

| ICP Precision Level | Example | Population | Conversion Rate |
|---------------------|---------|------------|-----------------|
| Vague | "SaaS companies" | 50,000+ | 0.5–1% |
| Segment | "B2B SaaS, 50-500 FTE" | 5,000–10,000 | 2–4% |
| Precise | "B2B SaaS, 50-500 FTE, Salesforce, hiring SDRs" | 500–2,000 | 5–10% |
| Hyper-precise | "B2B SaaS, 50-500 FTE, Salesforce, Series B, hiring SDRs, in DevTools" | 100–500 | 10–20% |

The sweet spot for most B2B SaaS companies is **Precise** — enough population for pipeline volume, enough precision for conversion efficiency. Hyper-precise ICPs work for high-ACV, low-volume strategies (enterprise-only). Vague ICPs work for PLG (product-led growth) motions where the product self-qualifies.

#### ICP Drift Detection

ICPs that were accurate 12 months ago may be stale today. Market shifts, competitive changes, and product evolution all cause ICP drift. The Echo agent monitors for three drift signals:

1. **Win-rate drift**: If the conversion rate for A-grade leads drops below 40% for two consecutive quarters, the ICP may have drifted.
2. **Population drift**: If the ICP-matched population drops by >30% from the original count, market conditions may have shifted (e.g., consolidation in the vertical).
3. **Characteristic drift**: If new patterns emerge in won deals that aren't captured in the ICP (e.g., a new vertical starts converting well), the ICP needs expansion.

### Pillar 2: Total Addressable Market (TAM) Mapping

TAM mapping is the **exhaustive enumeration** of every company that matches the ICP. Most lead generation programs fail not because they cannot convert leads, but because they cannot find enough of them. TAM mapping requires systematic enumeration across **every discoverable channel**: LinkedIn, Google Maps, industry directories, regulatory filings, conference attendee lists, technology registries (BuiltWith, PublicWWW), patent databases, news mentions, and more.

The LeadReach Scout agent has access to 7+ channels and the Forge agent can enrich through 7+ data sources (SEC EDGAR, OpenCorporates, yfinance, PublicWWW, Overpass/OpenStreetMap, Geocoder, News Worker). Coverage matters more than depth at this stage — a perfect profile of 10 prospects cannot beat a good profile of 1,000 prospects.

#### TAM Estimation Methods

| Method | Accuracy | Effort | Best For |
|--------|----------|--------|----------|
| Top-down (industry report %) | Low (±50%) | Low | Quick sizing, board decks |
| Bottom-up (ICP count) | Medium (±20%) | Medium | Pipeline planning, quota setting |
| Account-level enumeration | High (±5%) | High | SDR territory assignment, ABM targeting |

LeadReach uses **account-level enumeration** as the default method. Scout doesn't estimate the TAM — it enumerates every account that matches the ICP criteria. This produces the most accurate TAM and the most actionable output (a list of named accounts to target).

#### TAM Saturation Tracking

Once the TAM is enumerated, Echo tracks **saturation** — what percentage of the TAM has been contacted, engaged, and converted. Saturation benchmarks:

| Stage | Healthy Saturation | Action if Below | Action if Above |
|-------|--------------------|-----------------|-----------------|
| Contacted | 30–50% of TAM | Expand outreach capacity | Shift to engagement optimization |
| Engaged (replied) | 8–15% of TAM | Improve messaging / ICP | Focus on conversion, not volume |
| Meeting booked | 3–8% of TAM | Tighten ICP, improve CTA | Scale AE capacity |
| Closed-won | 0.5–2% of TAM | Review pricing, competitive positioning | Expand TAM (broaden ICP) |

### Pillar 3: Decision-Maker Identification

For every target account, there are **3-7 relevant decision-makers and influencers**. The Economic Buyer holds the budget; the Technical Champion evaluates fit; the User Champion will operate the product daily; the Executive Sponsor removes political obstacles; the Detractor can veto the deal. Each role requires different messaging and different timing.

Mapping decision-makers requires the **org structure**, the **reporting lines**, the **tenure**, the **background**, and the **current initiatives** of each person. LinkedIn is the primary source but should be triangulated with company press releases, conference talks, podcast appearances, and SEC filings (for public companies — executive compensation tables list the top 5 officers).

#### The Buying Committee Model

Modern B2B buying follows a committee model, not a single-decision-maker model. Gartner's 2024 research identifies six typical buying roles:

| Role | Function in Purchase | Typical Title | Key Concern |
|------|---------------------|---------------|-------------|
| Initiator | Identifies the need, starts evaluation | VP Sales, Director of Ops | "We have a problem" |
| User | Will operate the product daily | SDR Manager, Sales Ops Analyst | "Will this make my job easier?" |
| Influencer | Provides input, shapes criteria | IT Director, Security Analyst | "Is this safe/compliant?" |
| Decider | Has final authority to approve | CEO, CFO, CRO | "Is the ROI justified?" |
| Buyer | Executes the transaction | Procurement Manager | "Are the terms acceptable?" |
| Gatekeeper | Controls information flow | EA, Chief of Staff | "Is this worth the decider's time?" |

A complete account map identifies at least the Initiator, User, Decider, and Gatekeeper. The Bard agent customizes messaging for each role — technical depth for the Influencer, ROI framing for the Decider, workflow improvement for the User, and concise executive framing for the Gatekeeper.

#### Decision-Maker Discovery Priority

Not all decision-makers are equally discoverable or equally impactful. Forge agent follows this discovery priority:

1. **C-suite / VP-level** — Highest impact, discoverable via LinkedIn and press releases. Always attempt.
2. **Director-level** — High impact, often the Initiator or User Champion. Discoverable via LinkedIn.
3. **Manager / Senior IC** — User Champion, high value for product validation. Discoverable via LinkedIn and team pages.
4. **Procurement / Legal** — Lower priority in early outreach; engage at negotiation stage. Discoverable via LinkedIn and company directory.
5. **Board members / Advisors** — Rarely contacted directly; valuable for strategic context. Discoverable via Crunchbase, press releases.

### Pillar 4: Trigger Event Detection

Trigger events are **observable changes** in a target account that create an opening for outreach. Examples: a new executive hire (the first 90 days are the highest-leverage window), a funding round (cash to spend, mandates to scale), a product launch (new infrastructure needs), a regulatory change (compliance requirements), a competitor displacement (dissatisfaction with the status quo), an earnings miss (cost-cutting pressure), a public scandal (leadership churn).

Trigger events convert cold outreach from spam into **timely relevance**. A prospect who ignored your email last month may respond this month because they just hired a new VP of Engineering who has used your product before. The LeadReach Sage agent specializes in surfacing trigger events from news, financials, and filings.

#### Trigger Event Taxonomy

| Category | Trigger | Signal Strength | Window | Detection Source |
|----------|---------|-----------------|--------|-----------------|
| **Funding** | New funding round | ★★★★★ | 90 days | Crunchbase, PitchBook, SEC |
| **Leadership** | New CRO/VP Sales | ★★★★★ | 90 days | LinkedIn, press releases |
| **Leadership** | New CTO/VP Eng | ★★★★☆ | 60 days | LinkedIn, press releases |
| **Expansion** | Geographic expansion | ★★★★☆ | 60 days | Press, job postings |
| **Hiring** | SDR/AE hiring surge | ★★★★☆ | 30 days | LinkedIn, Greenhouse, Lever |
| **Product** | New product launch | ★★★☆☆ | 30 days | Press, Product Hunt |
| **M&A** | Acquisition / merger | ★★★★☆ | 90 days | Press, SEC filings |
| **Regulatory** | Compliance mandate | ★★★★☆ | 90 days | News, industry bodies |
| **Competitive** | Competitor outage/scandal | ★★★☆☆ | 14 days | News, G2, social |
| **Financial** | Earnings miss / guidance cut | ★★★☆☆ | 30 days | SEC, earnings calls |
| **Budget** | New fiscal year | ★★★☆☆ | 30 days | Industry calendar |
| **Technology** | Tech stack change detected | ★★★☆☆ | 60 days | PublicWWW, BuiltWith |

The highest-signal triggers (funding, new sales leadership) should be detected and acted upon within **24 hours**. Sage agent runs daily trigger scans for all accounts in the active TAM.

#### Trigger Decay Function

Trigger events lose potency over time. A funding announcement from 2 weeks ago is far more actionable than one from 6 months ago. LeadReach applies a decay function to trigger scores:

- **0–30 days**: Full signal strength (1.0)
- **31–60 days**: 0.7× signal strength
- **61–90 days**: 0.4× signal strength
- **90+ days**: 0.1× signal strength (effectively expired)

This decay ensures that outreach is always timely and that stale triggers don't inflate lead scores.

### Pillar 5: Multi-Channel, Multi-Touch Orchestration

A single cold email has a 1-3% response rate. A coordinated sequence across email, LinkedIn, phone, and content touches — spaced over 2-4 weeks with 8-15 total contacts — achieves 15-30% reply rates and 5-10% meeting-booked rates. The Bard agent generates these sequences and the Flow agent tracks their execution.

Orchestration requires **personalization at scale** — every touch must feel hand-crafted. This is only possible with deep research (which Forge provides) and structured templates (which Bard generates). Generic templates destroy response rates; over-personalized templates feel creepy. The sweet spot is **three to five specific, true, relevant details per message** — never more.

#### The Multi-Channel Effect Matrix

Research from TOPO (2024) demonstrates that multi-channel sequences dramatically outperform single-channel outreach. The effect is multiplicative, not additive:

| Channels Used | Avg. Reply Rate | Avg. Meeting Rate |
|---------------|----------------|-------------------|
| Email only | 2–4% | 1–2% |
| Email + LinkedIn | 6–10% | 3–5% |
| Email + LinkedIn + Phone | 10–18% | 5–8% |
| Email + LinkedIn + Phone + Direct Mail | 15–30% | 8–12% |

The key insight: each additional channel doesn't just add responses — it **multiplies** the effectiveness of other channels. A prospect who sees your LinkedIn comment, then receives your email, then gets your phone call is far more likely to respond than one who receives three emails.

#### Personalization Depth Levels

| Level | Description | Example | Effort per Lead | Reply Rate Impact |
|-------|-------------|---------|------------------|-------------------|
| L0: Generic | Same message to all | "Hi, I'd love to show you our platform" | Near-zero | Baseline (1–3%) |
| L1: Field merge | Name + company + industry | "Hi Sarah, loved what Acme is doing in FinTech" | Low (automated) | +2–4× |
| L2: Trigger-based | References a recent event | "Saw Acme's Series B — congrats" | Medium (research needed) | +3–6× |
| L3: Insight-led | Demonstrates understanding of their problem | "Most SDR teams at Series B SaaS spend 60% of time on research..." | Medium (Sage + Forge) | +4–8× |
| L4: Peer-referenced | Includes a peer case study | "[Peer company] saw 40% more meetings using this approach" | Medium (requires peer data) | +5–10× |
| L5: Full context | Trigger + insight + peer + specific CTA | All elements combined | High (full pipeline) | +8–15× |

LeadReach targets **L3–L4 personalization** as the default. L5 is reserved for Tier 1 ABM accounts. L0–L1 is unacceptable for any outbound motion.

## 3. The Lead Generation Funnel — LeadReach Model

LeadReach uses a 7-stage funnel. Each stage has explicit entry criteria, exit criteria, and conversion benchmarks. Agents should classify prospects into stages explicitly and avoid skipping stages.

| Stage | Definition | Entry Criteria | Exit Criteria | Industry Benchmark Conversion |
|-------|-----------|----------------|---------------|-------------------------------|
| **1. Identified** | Matches ICP at the company level | ICP score ≥ 60 | Decision-maker email identified | 100% (baseline) |
| **2. Contacted** | First outbound message sent | Valid email, message sent | Reply received (any kind) | 15-30% |
| **3. Engaged** | Prospect has replied (even negatively) | Reply received | Meeting booked | 20-40% of repliers |
| **4. Qualified** | BANT/MEDDIC criteria met | Budget + Authority + Need + Timeline confirmed | Opportunity created in CRM | 40-60% of meetings |
| **5. Opportunity** | Active deal in pipeline | Mutual action plan agreed | Closed-won or closed-lost | 20-40% of opportunities |
| **6. Customer** | Signed contract | Contract executed | Onboarding complete | 90-95% (post-signature) |
| **7. Evangelist** | Public advocate | NPS ≥ 9, case study published | Referrals generated | 10-20% of customers |

### 3.1 Stage Transition Rules

Agents must enforce strict stage transition rules. Skipping stages (e.g., promoting a lead from "Identified" directly to "Qualified" because the rep is excited) creates phantom pipeline that distorts forecasting.

**Identified → Contacted**: Requires (a) verified email, (b) composed message, (c) message sent confirmation from sequencing tool. Scout and Forge produce the data; Bard composes the message; Flow confirms delivery.

**Contacted → Engaged**: Requires a **human reply** from the prospect. Automated OOO replies do NOT count. Auto-replies like "I've left the company" count as negative engagement and should trigger re-routing to the new contact.

**Engaged → Qualified**: Requires **three of four BANT criteria** confirmed: Budget (evidenced by funding, company size, or explicit statement), Authority (evidenced by title and role), Need (evidenced by stated pain or trigger event), Timeline (evidenced by trigger event or explicit statement). Judge agent scores BANT; a minimum of 3/4 is required.

**Qualified → Opportunity**: Requires a **mutual action plan** agreed upon by both parties, with at least 3 concrete next steps and dates. This is the threshold where the deal becomes "real" — it has executive sponsorship and a path to close.

**Opportunity → Customer**: Requires signed contract. No exceptions. Verbal commitments do not count.

**Customer → Evangelist**: Requires NPS ≥ 9 AND either (a) published case study, (b) referral introduction, or (c) public advocacy (conference talk, review, social post).

### 3.2 Funnel Velocity Metrics

Beyond conversion rates, **velocity** — how fast leads move through stages — is equally important. A pipeline with high conversion rates but slow velocity produces lumpy revenue.

| Stage Transition | Target Velocity | Yellow Flag | Red Flag |
|------------------|----------------|-------------|----------|
| Identified → Contacted | <48 hours | >5 days | >10 days |
| Contacted → Engaged | <14 days | >21 days | >35 days |
| Engaged → Qualified | <7 days | >14 days | >21 days |
| Qualified → Opportunity | <14 days | >21 days | >30 days |
| Opportunity → Closed | <60 days | >90 days | >120 days |

Flow agent tracks velocity per rep, per territory, and per ICP segment. Systematic velocity problems indicate structural issues (e.g., slow legal review, missing technical resources) rather than individual rep problems.

### 3.3 Funnel Shape Analysis

The shape of the funnel reveals systemic problems before they show up in revenue numbers:

| Funnel Shape | Description | Diagnosis | Prescription |
|-------------|-------------|-----------|--------------|
| **Healthy pyramid** | Each stage 30-50% of previous | All pillars working | Maintain and scale |
| **Top-heavy** | Many identified, few contacted | Scout/Forge bottleneck; insufficient data quality | Invest in enrichment; verify emails |
| **Middle skinny** | Many contacted, few engaged | Bard messaging problem; ICP too broad | Rewrite sequences; tighten ICP |
| **Bottom leaky** | Many qualified, few closed | AE discovery problem; pricing misalignment | Train on MEDDIC; review pricing |
| **Hourglass** | Many engaged, few qualified; then many qualified, few closed | ICP fit issue + pricing issue | Fix ICP precision; review value prop |
| **Flat line** | Equal numbers at every stage | Data quality issue (stale pipeline) | Clean CRM; enforce stage criteria |

## 4. Quality vs. Quantity — The Central Tension

Every lead generation program oscillates between **volume-driven** and **quality-driven** approaches. Volume-driven programs cast a wide net and accept low per-lead quality; they work for low-ACV, transactional products. Quality-driven programs invest heavily per lead and accept low volume; they work for high-ACV, complex sales.

LeadReach is **quality-first by default** — the 8-agent pipeline exists precisely to compress research time while preserving research depth. However, agents must respect the user's intent: if the user asks for "all dragonfruit suppliers in Vietnam", they want **coverage** (volume mode); if they ask "find me the CEO of the largest dragonfruit exporter in Vietnam", they want **depth** (quality mode). The Atlas agent classifies this intent and adjusts the pipeline accordingly.

The single most common failure mode is producing **shallow breadth** — many leads with one or two fields each. The Judge agent exists to flag this: if a lead has fewer than 5 verified data points, it should be marked "needs enrichment" rather than promoted to the next stage.

### 4.1 The Quality-Quantity Decision Matrix

The right balance depends on four factors: ACV, sales cycle length, sales team capacity, and ICP precision. Use this matrix to determine the appropriate mode:

| ACV | Sales Cycle | ICP Precision | Recommended Mode | Agent Configuration |
|-----|------------|---------------|------------------|---------------------|
| <$10K | <30 days | Low | Volume | Scout: broad search; Forge: light enrichment; Judge: low threshold |
| $10K–$50K | 30–90 days | Medium | Balanced | Scout: targeted; Forge: standard; Judge: medium threshold |
| $50K–$200K | 90–180 days | High | Quality | Scout: precise; Forge: deep enrichment; Judge: high threshold |
| >$200K | 180+ days | Very high | Hyper-quality | Scout: named accounts; Forge: full research; Judge: A-grade only |

### 4.2 The Minimum Viable Lead (MVL)

Regardless of quality mode, every lead must meet the **Minimum Viable Lead** standard before being promoted from "Identified" to "Contacted":

| Field | Required | Rationale |
|-------|----------|-----------|
| Company name | ✅ | Obvious |
| Company domain | ✅ | Needed for email and tech detection |
| ICP score | ✅ | Must be ≥60 (C-grade or above) |
| Decision-maker name | ✅ | Cannot contact anonymously |
| Decision-maker title | ✅ | Determines messaging angle |
| Decision-maker email | ✅ | Primary contact channel |
| At least 1 trigger signal | ✅ (for quality mode) | Enables L2+ personalization |
| Industry/vertical | ✅ | Determines use case framing |
| Source citation | ✅ | Every field must be traceable |

Leads that fail the MVL check are returned to Forge for enrichment. Leads that cannot be enriched after 2 attempts are archived.

## 5. The Six Sources of Truth

Every claim about a prospect must trace back to one of six sources of truth. LeadReach agents should cite sources in their reasoning when ambiguous.

1. **Primary Public Sources** — the company's own website, press releases, SEC filings, annual reports. Authoritative for self-description but biased toward positive framing.
2. **Government Registries** — SEC EDGAR (US), OpenCorporates (global), Companies House (UK), ACRA (Singapore), NDRC (China). Authoritative for legal existence, structure, financials.
3. **Professional Networks** — LinkedIn, GitHub, Twitter/X, personal websites. Authoritative for individual identity, role, and tenure.
4. **News & Media** — news articles, press wires, podcast transcripts, conference agendas. Authoritative for recent events and trigger signals.
5. **Technology Footprints** — PublicWWW (HTML/JS fingerprints), BuiltWith (tech stack), DNS records, SSL certificates. Authoritative for what software a company actually uses.
6. **Geospatial Data** — OpenStreetMap/Overpass, Google Maps, government mapping agencies. Authoritative for physical location and operational footprint.

When sources **conflict** (e.g., LinkedIn says 200 employees, company website says "50-200"), the more recent and more authoritative source wins. Government registries beat self-reported; recent beats old; specific beats vague. The Forge agent must record the source for every field, and the Judge agent must down-score fields with conflicting unresolvable sources.

### 5.1 Source Reliability Hierarchy

When multiple sources disagree, agents resolve conflicts using this hierarchy:

| Priority | Source Type | Reliability | Example |
|----------|-----------|-------------|---------|
| 1 | Government filing | Highest | SEC 10-K revenue figure |
| 2 | Primary source (company) | High | Company website "About" page |
| 3 | Third-party verified | Medium-High | LinkedIn company page (verified domain) |
| 4 | Third-party estimated | Medium | ZoomInfo revenue estimate |
| 5 | News/media report | Medium | TechCrunch article |
| 6 | Crowdsourced/UGC | Low | Glassdoor review, G2 review |
| 7 | AI-inferred | Lowest | "Likely uses X based on Y" |

### 5.2 Source Citation Format

Every data point in a LeadReach artifact must include a source citation in this format:

```
{field_name}: {value} [Source: {source_type} | {source_name} | {date_retrieved} | {confidence: high|medium|low}]
```

Example:
```
employee_count: 250 [Source: professional_network | LinkedIn | 2026-07-01 | confidence: medium]
revenue: $45M ARR [Source: government_filing | SEC 10-K | 2025-12-31 | confidence: high]
tech_stack_crm: Salesforce [Source: technology_footprint | PublicWWW | 2026-06-28 | confidence: high]
```

The Judge agent uses confidence levels to weight scores. High-confidence data contributes fully to the score; low-confidence data contributes at 50% weight; data without any source is excluded from scoring.

## 6. Ethical & Compliance Boundaries

Lead generation lives at the edge of several legal frameworks. LeadReach agents must respect:

- **GDPR (EU)** — lawful basis required for processing personal data; explicit consent for marketing emails; right to erasure; data minimization. Personal emails of EU residents cannot be scraped or stored without consent.
- **CAN-SPAM (US)** — commercial emails must include physical address, unsubscribe link, and accurate header. No deceptive subject lines.
- **CCPA/CPRA (California)** — residents can request deletion and opt out of sale. "Sale" is broadly defined and may include sharing data with partners.
- **ePrivacy Directive (EU)** — cookies and tracking require consent; B2B cold email is permitted under PECR (UK) and similar national implementations but requires legitimate interest assessment.
- **LinkedIn Terms of Service** — scraping LinkedIn is against ToS; LeadReach uses the official LinkedIn API where available and treats scraped data as potentially unreliable.
- **Industry-specific** — HIPAA (US healthcare), GLBA (US financial), FERPA (US education), MiFID II (EU finance). Agents must not collect protected health information, financial account numbers, or student records.

When in doubt, agents should default to **public, professional information about business roles** — this is universally defensible. Personal information (home address, personal phone, family details) should never be collected or surfaced.

### 6.1 The Ethical Decision Framework

For every data collection action, agents should pass the following test:

1. **Is the data publicly available?** If yes → proceed. If no → stop.
2. **Is the data about a professional role?** If yes → proceed. If no → stop.
3. **Is the data relevant to the business purpose?** If yes → proceed. If no → don't collect it (data minimization).
4. **Would the subject be comfortable knowing we collected this?** If yes → proceed. If no → stop.
5. **Can the subject request deletion?** If yes → ensure process exists. If no → don't collect it (GDPR/CCPA requirement).

### 6.2 Regional Compliance Matrix

| Region | Cold Email | Cold Call | Data Retention | Opt-out Requirement | Special Notes |
|--------|-----------|-----------|---------------|---------------------|---------------|
| US | Permitted (CAN-SPAM) | Permitted (check DNC) | No limit | Unsubscribe link | State laws vary (CA, CO, VA) |
| EU/EEA | Legitimate interest (most states) | Consent or LIA (varies) | Purpose-limited | Opt-out + consent for tracking | Germany requires consent for B2B email |
| UK | Legitimate interest (PECR) | TPS check required | UK GDPR limits | Opt-out + consent for tracking | UK Addendum for US transfers |
| Canada | Consent required (CASL) | DNCL check required | Purpose-limited | Unsubscribe + consent | Implied consent for existing relationships |
| Australia | Spam Act — consent or existing relationship | Do Not Call Register | APP-limited | Unsubscribe | Existing relationship = inferred consent |
| Singapore | PDPA — deemed consent | DNC Registry | Purpose-limited | Opt-out | Deemed consent for business contact info |
| Japan | Opt-out permitted for B2B | No restriction | APPI-limited | Opt-out | Respect "refusal of use" requests |

### 6.3 Data Handling Rules

All data collected by LeadReach agents must follow these rules:

- **Collection**: Only collect data from public sources or with consent. Never scrape behind login walls (except via authorized APIs).
- **Storage**: Encrypt at rest (AES-256). Store in region-appropriate data centers (EU data in EU, US data in US).
- **Retention**: Active prospect data retained for 24 months. Inactive prospect data archived after 12 months. Deleted upon request within 30 days.
- **Access**: Role-based access control. Reps see only their assigned leads. Admins see all.
- **Transfer**: SCCs (EU-US DPF) for cross-border transfers. No transfer to sanctioned countries.
- **Deletion**: Honor deletion requests within 30 days (GDPR) / 45 days (CCPA). Propagate deletion to all downstream systems.

## 7. The LeadReach Operating Principle

Every agent invocation should produce **one of three artifacts**: a structured record (company/person profile, ICP, scorecard), a narrative artifact (outreach message, briefing, report), or a pipeline action (status change, scheduling, escalation). If an agent produces none of these, it has failed.

Every artifact must be **traceable** (sources cited), **verifiable** (fields are checkable), **actionable** (the next step is clear), and **proportionate** (the effort matches the value). Agents that produce untraceable, unverifiable, unactionable, or disproportionate outputs degrade the entire pipeline.

### 7.1 The Traceability Standard

Every assertion in a LeadReach artifact must pass the traceability test: "Can a human auditor verify this claim by following the cited source?" If the answer is no, the assertion must be either (a) removed, (b) flagged as "unverified", or (c) replaced with a verified alternative.

Examples:
- ✅ "Acme Corp uses Salesforce (Source: PublicWWW — `sf_client_id` detected in login page HTML, 2026-06-28)" — Traceable.
- ❌ "Acme Corp is growing fast" — Not traceable. Replace with: "Acme Corp headcount increased 35% YoY (Source: LinkedIn company page, 2026-07-01)".
- ❌ "The VP of Sales is likely interested" — Not traceable. Replace with: "The VP of Sales recently posted about scaling the SDR team (Source: LinkedIn post, 2026-06-15)".

### 7.2 The Proportionality Principle

Agent effort should scale with the expected value of the output. A Tier 3 account ($10K ACV potential) should not receive the same research depth as a Tier 1 account ($200K ACV potential). Atlas agent configures effort levels:

| Account Tier | Research Depth | Enrichment Level | Personalization Level | Agent Time Budget |
|-------------|---------------|-------------------|----------------------|-------------------|
| Tier 1 (ABM) | Full profile + org chart + trigger analysis | Deep (all sources) | L5: Full context | 15 min / account |
| Tier 2 (ICP fit) | Standard profile + top triggers | Standard (3+ sources) | L3–L4: Insight + peer | 5 min / account |
| Tier 3 (Broad) | Basic profile | Light (1–2 sources) | L2: Trigger-based | 2 min / account |

### 7.3 Agent Handoff Protocol

When one agent completes its work and passes output to the next agent, the handoff must include:

1. **Artifact**: The structured output (record, narrative, or action)
2. **Confidence score**: How confident the producing agent is in the output (0–1.0)
3. **Gaps**: What the agent could not find or verify
4. **Recommendations**: Suggested next steps for the receiving agent
5. **Metadata**: Timestamp, source count, processing time

This protocol ensures that downstream agents can assess the quality of their inputs and adjust their behavior accordingly. A Sage agent receiving a Forge output with confidence 0.5 and 3 gaps should invest more research effort than one receiving confidence 0.9 with 0 gaps.

## 8. Advanced Concepts

### 8.1 The Buying Signal vs. Selling Signal Distinction

A **buying signal** is something the prospect does that indicates purchase intent (visits pricing page, downloads comparison guide, asks about integrations). A **selling signal** is something the seller observes that indicates the prospect might be receptive (funding round, new hire, competitor problem). Both matter, but they require different approaches:

- Buying signals → **Fast response**, low-effort personalization. The prospect is already interested; just remove friction.
- Selling signals → **Thoughtful outreach**, high-effort personalization. The prospect isn't looking; you need to create awareness and interest.

The Judge agent weights buying signals more heavily than selling signals in the scoring model, because buying signals have higher conversion correlation (35–50% vs. 5–15%).

### 8.2 The Conversational Gap

In B2B sales, there is a fundamental gap between what the prospect says in a sales conversation and what they actually need. Prospects articulate solutions, not problems. "We need a better CRM" is a solution statement; the underlying problem might be "our sales team can't track pipeline accurately" or "we're losing deals to poor follow-up." The Sage agent's research and the Judge agent's scoring should focus on **inferring the problem**, not just recording the stated solution.

### 8.3 The Compound Interest of Pipeline

Pipeline is not linear — it compounds. A meeting booked today generates not just one opportunity, but potential referrals, references, market intelligence, and brand awareness. The Echo agent tracks **downstream value** of pipeline activities beyond direct revenue:

- **Reference value**: How many deals has this customer influenced as a reference?
- **Referral value**: How many net-new leads originated from this customer's network?
- **Intelligence value**: How much market insight has this customer provided that improved ICP precision?
- **Brand value**: Has this customer spoken at events, written reviews, or advocated publicly?

These compound effects mean that a customer worth $50K in ACV may be worth $150K+ in total network value. This affects ICP scoring — some accounts are worth pursuing even at lower direct ACV if their network value is high.
