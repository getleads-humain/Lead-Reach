---
title: "LeadReach Platform Overview — B2B Lead Intelligence at Scale"
category: product
grade: A
last_reviewed: "2026-07-03"
tags: [platform, overview, architecture, value-proposition, personas, competitive-differentiation, pricing-tiers]
---

# LeadReach Platform Overview — B2B Lead Intelligence at Scale

## Executive Summary

LeadReach is an AI-native B2B lead intelligence platform that transforms how sales teams discover, qualify, and engage prospects. Unlike legacy tools that rely on static databases and manual workflows, LeadReach deploys an autonomous 8-agent pipeline—Atlas, Scout, Forge, Sage, Judge, Bard, Flow, and Echo—that orchestrates the entire outbound lifecycle from prospect discovery to pipeline reporting. The platform operates across 17+ research channels, processes thousands of prospects in parallel, and delivers personalized outreach sequences that consistently outperform industry benchmarks by 3-5x.

Founded on the principle that modern B2B sales requires intelligence at every stage, LeadReach bridges the gap between raw data and revenue outcomes. The platform serves over 2,000 customers across SaaS, manufacturing, financial services, healthcare, and trade verticals, processing more than 50 million enrichment queries per month. With SOC 2 Type II certification, GDPR and CCPA compliance, and a multi-tenant architecture built on Supabase and Vercel's edge network, LeadReach delivers enterprise-grade security at startup speed.

This document provides a comprehensive overview of the LeadReach platform—its core capabilities, architecture, target personas, competitive positioning, and pricing—serving as the canonical reference for all product knowledge.

## Core Platform Capabilities

### Prospect Discovery & Research

LeadReach's discovery engine, powered by the Scout agent, searches across 17+ channels including web search (Exa), LinkedIn, GitHub, Twitter/X, Reddit, Google Maps, OpenStreetMap, SEC EDGAR, OpenCorporates, PublicWWW, yfinance, and RSS feeds. The system supports four primary discovery modes:

- **Company Discovery**: Find and profile specific companies by name, domain, or characteristics
- **Person Discovery**: Identify and research key decision-makers within target accounts
- **Geographic Discovery**: Map-based prospecting for location-specific businesses (retail, manufacturing, agriculture)
- **Industry Discovery**: Vertical-specific searches leveraging industry directories, trade associations, and niche databases

Each discovery session returns structured results with quality scores, source citations, and confidence metrics, enabling downstream agents to prioritize high-value targets automatically.

### Data Enrichment & Verification

The Forge agent transforms bare prospect seeds into complete 50+ field profiles through multi-source data fusion. Enrichment covers five dimensions:

1. **Firmographics**: Industry, employee count, revenue, funding stage, headquarters, ownership type
2. **Technographics**: CMS, CRM, marketing automation, analytics, cloud infrastructure, and frontend/backend stack detection
3. **People**: C-suite and VP-level executives with verified LinkedIn URLs and email addresses
4. **Behavioral Signals**: Recent news, trigger events (funding rounds, M&A, leadership changes), hiring patterns, and content publishing activity
5. **Contact Intelligence**: Email pattern detection, SMTP verification, phone number validation

Every enriched field carries a source citation, verification status, and recency timestamp. The platform's source hierarchy system (6 tiers from government registries to unverified estimates) ensures data integrity through systematic conflict resolution.

### ICP Design & Lead Scoring

LeadReach's ICP (Ideal Customer Profile) builder, driven by the Sage and Judge agents, enables multi-dimensional scoring beyond simple firmographic matching:

- **Firmographic Fit**: Industry, size, revenue, geography alignment
- **Technographic Fit**: Technology stack compatibility with your solution
- **Intent Signals**: Behavioral indicators suggesting purchase readiness (job postings, technology changes, funding events)
- **Trigger Events**: Time-sensitive opportunities (new executive hires, expansion signals, competitive displacement events)
- **Engagement History**: Previous interactions, content consumption, and response patterns

Scoring models are configurable per campaign, with weights adjustable by revenue team leadership. The Judge agent applies BANT, MEDDIC, or custom qualification frameworks to produce letter grades (A through D) with detailed justification.

### Outreach Composition & Sequencing

The Bard agent composes personalized cold outreach that consistently achieves 8%+ reply rates—3x the industry average for B2B cold email. Key capabilities include:

- **5-Variable Personalization**: Each email references at least 3 of 5 personalization dimensions (company trigger, role challenge, industry pattern, tech insight, personal detail)
- **Multi-Touch Sequences**: 4-8 touch sequences across email, LinkedIn, phone, and content channels spanning 2-4 weeks
- **A/B Testing Framework**: Built-in testing for subject lines, hooks, CTAs, and sequence length with statistical significance tracking
- **Response Templates**: Pre-composed replies for positive, negative, question, out-of-office, and wrong-person responses
- **Deliverability Optimization**: CAN-SPAM/GDPR compliance elements, spam filter avoidance, and mailbox health monitoring

### Pipeline Orchestration & CRM Integration

The Flow agent manages the operational backbone—scheduling sends, tracking replies, updating prospect stages, and synchronizing with CRM systems. The 7-stage LeadReach funnel (Identified → Contacted → Engaged → Qualified → Opportunity → Customer → Evangelist) provides clear visibility into pipeline health. Integrations support Salesforce, HubSpot, and Pipedrive with bidirectional sync and custom field mapping.

### Reporting & Analytics

The Echo agent generates comprehensive reports covering prospect discovery summaries, enrichment quality metrics, ICP scoring distributions, outreach performance (open rates, reply rates, meeting-booked rates), and pipeline conversion analytics. Reports support custom date ranges, campaign-level filtering, and automated delivery schedules.

## Target Personas

### Sales Development Representatives (SDRs)

SDRs are the primary users of LeadReach's discovery and outreach capabilities. They use the platform to:

- Build targeted prospect lists using ICP-driven search
- Research accounts before outreach using enriched profiles
- Launch multi-touch outreach sequences with AI-composed messaging
- Track engagement and prioritize follow-ups based on reply signals

**Key value**: Reduce research time from 45 minutes to under 5 minutes per prospect; increase daily outreach volume from 50 to 200+ personalized touches.

### Account Executives (AEs)

AEs leverage LeadReach for account intelligence and meeting preparation:

- Deep-dive company research before discovery calls
- Competitive intelligence on prospect's current vendors
- Trigger-event monitoring for timing outreach to key accounts
- Multi-threaded selling across multiple contacts within an account

**Key value**: Walk into every call with 50+ data points about the account; never miss a trigger event on a target account.

### Revenue Operations (RevOps)

RevOps teams use LeadReach for pipeline analytics and process optimization:

- Pipeline conversion funnel analysis across all stages
- Source attribution tracking (which channels produce best leads)
- ICP performance analysis (which criteria correlate with wins)
- Sales cycle time and CAC calculations by channel and campaign
- Data quality monitoring and enrichment coverage reporting

**Key value**: Single source of truth for pipeline metrics; automated data quality enforcement across the revenue stack.

### Sales Leaders

Sales leaders depend on LeadReach for forecasting and team management:

- Real-time pipeline visibility with stage distribution
- Rep performance comparison (activity, conversion, velocity)
- Campaign ROI analysis (spend vs. pipeline generated)
- Forecast accuracy based on ICP scoring distributions
- Capacity planning based on pipeline coverage ratios

**Key value**: Predictable pipeline generation; data-driven coaching conversations; ROI visibility per campaign and channel.

## Competitive Differentiation

### vs. Apollo / ZoomInfo (Data Providers)

| Dimension | LeadReach | Apollo / ZoomInfo |
|-----------|-----------|-------------------|
| Data Freshness | Real-time via 17+ live channels | Static database updated quarterly |
| Enrichment Depth | 50+ fields with source citations | 20-30 fields, limited sourcing |
| Outreach | AI-composed, multi-touch sequences | Basic email templates |
| Intelligence | Behavioral signals + trigger events | Firmographic filters only |
| Pricing | Usage-based with agent credits | Per-seat license |
| Compliance | Built-in CAN-SPAM/GDPR enforcement | Manual compliance checks |

**Key differentiator**: LeadReach is not a database—it's an intelligence engine. Where Apollo provides a list of names, LeadReach provides why they matter, what to say, and when to reach out.

### vs. Outreach / Salesloft (Sequencing Platforms)

| Dimension | LeadReach | Outreach / Salesloft |
|-----------|-----------|---------------------|
| Prospecting | Built-in 17+ channel discovery | Separate tool required |
| Personalization | AI-composed with 5-variable depth | Template with merge fields |
| Lead Scoring | Multi-dimensional ICP scoring | Basic A/B/C/D ratings |
| Data Quality | Real-time enrichment + verification | Relies on imported data |
| Agent Pipeline | 8 autonomous agents | Manual workflow builder |
| Intelligence | Trigger events + intent signals | Activity-based triggers only |

**Key differentiator**: LeadReach unifies prospecting, intelligence, and outreach in one platform. Sequencing tools require 3-5 additional tools to match LeadReach's coverage.

### vs. Clay / Instantly (AI Outreach Tools)

| Dimension | LeadReach | Clay / Instantly |
|-----------|-----------|-----------------|
| Discovery | 17+ channels, autonomous | Web scraping + CSV import |
| Enrichment | 50+ fields, multi-source fusion | 10-15 fields, single source |
| Agent System | 8 specialized agents | Single AI assistant |
| Enterprise Security | SOC 2 Type II, GDPR, CCPA | Limited compliance |
| Scale | 100K+ active prospects | 10K active prospects |
| CRM Integration | Bidirectional Salesforce/HubSpot/Pipedrive | Basic CRM push |

**Key differentiator**: LeadReach's agent pipeline architecture provides specialization that monolithic AI tools cannot match. Each agent is optimized for its specific function, producing higher-quality outputs at every stage.

## Architecture Overview

### System Architecture

LeadReach operates on a modern, serverless-first architecture optimized for high-throughput data processing and low-latency user interactions:

- **Frontend**: Next.js 16 on Vercel's edge network with React Server Components, Tailwind CSS 4, and shadcn/ui components
- **Backend API**: Next.js API routes with TypeScript, deployed on Vercel serverless functions
- **Database**: Supabase (PostgreSQL) with Row-Level Security, real-time subscriptions, and Edge Functions
- **AI Layer**: Multi-model strategy using GLM-4.7-Flash (primary), GLM-4.6V (vision/fallback), with MoE (Mixture of Experts) routing via the agentic system
- **Browser Automation**: Playwright-based browser service for LinkedIn, Google Maps, and dynamic content extraction
- **Scraping Infrastructure**: Python microservices (Scrapy, Crawl4AI, ScrapeGraph) for high-volume data extraction
- **Email Infrastructure**: Multi-ESP support (SendGrid, Postmark, custom SMTP) with domain rotation and mailbox warming
- **Caching**: Redis-backed caching for search results (24-hour TTL) and knowledge base embeddings (precomputed)
- **Monitoring**: Custom telemetry with OpenTelemetry-compatible traces for agent execution, pipeline latency, and error tracking

### Agent Infrastructure

The 8-agent pipeline runs on a custom orchestration layer (`agent-infrastructure/`) that provides:

- **Session Management**: Per-user agent sessions with conversation history and memory compaction
- **Skill Registry**: Extensible skill system where each agent registers capabilities and dependencies
- **Cron Scheduler**: Automated pipeline execution for recurring campaigns and monitoring tasks
- **Key Management**: Secure API key rotation for LLM providers and data source APIs
- **Documentation Engine**: Auto-generated agent documentation from skill definitions and training data

### Multi-Tenancy & Security

All data is isolated per tenant using Supabase Row-Level Security policies. Authentication flows through Supabase Auth with JWT-based session management. API routes enforce plan-gate checks ensuring feature access matches the customer's subscription tier. Security headers, CSP policies, and SSRF guards are applied at the infrastructure level.

## Pricing Tiers Summary

LeadReach offers two product tracks—**B2B Intelligence** (for outbound sales teams) and **B2C Setter** (for appointment-setting businesses)—with the following tiers:

### B2B Track

| Tier | Monthly | Annual | Agents | Leads/Mo | Channels | Seats | Best For |
|------|---------|--------|--------|----------|----------|-------|----------|
| Launchpad | Free | Free | 2 | 100 | 3 | 1 | Exploring AI-powered lead generation |
| Scout | $149 | $1,490 | 3 | 1,000 | 5 | 1 | Solo founders starting outbound |
| Command | $399 | $3,990 | 8 | 10,000+ | 17+ | 5 | Growing teams scaling outbound |
| Founders' Pass | $2,497 (lifetime) | — | 8 | 15,000 | 17+ | 5 | Lifetime deal early adopters |
| Enterprise | Custom | Custom | Unlimited | Unlimited | Custom | Unlimited | Enterprise with custom requirements |

### B2C Setter Track

| Tier | Monthly | Annual | Setters | Leads/Mo | Channels | Seats | Best For |
|------|---------|--------|---------|----------|----------|-------|----------|
| Setter | $97 | $970 | 2 | 500 | 2 | 1 | Solopreneurs automating bookings |
| Closer | $297 | $2,970 | Unlimited | 10,000+ | 5 | 5 | Teams scaling conversational booking |
| Agency | Custom | Custom | Unlimited | Unlimited | Custom | Unlimited | Agencies managing multiple brands |

See the [Pricing & Packaging Guide](./pricing-packaging-guide.md) for complete feature comparison matrices, add-on pricing, and ROI calculation frameworks.

## Technical Details

### Data Processing Pipeline

1. **Ingestion**: User query enters via the web UI, API, or cron trigger
2. **Intent Classification**: Atlas decomposes the query into intent + entities + constraints
3. **Discovery**: Scout searches 17+ channels in parallel, deduplicates, and scores results
4. **Enrichment**: Forge fuses multi-source data into structured profiles with 50+ fields
5. **Intelligence**: Sage contextualizes findings with industry, regional, and domain knowledge
6. **Qualification**: Judge scores prospects against ICP criteria and applies qualification frameworks
7. **Composition**: Bard crafts personalized outreach sequences with compliance checks
8. **Execution**: Flow schedules, sends, and tracks outreach across email, LinkedIn, and phone
9. **Reporting**: Echo aggregates pipeline metrics and generates actionable reports

### Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Discovery latency (single company) | <60s | 45s avg |
| Enrichment completeness | >70% | 74% avg |
| Outreach reply rate | >8% | 9.2% avg |
| Pipeline execution reliability | >98% | 98.7% |
| Reply detection time | <30min | 18min avg |
| Suppression compliance | 100% | 100% |
| System uptime | 99.9% | 99.95% |

### Scalability

- **Concurrent pipelines**: Up to 500 simultaneous agent pipeline executions per tenant
- **Search throughput**: 50M+ enrichment queries/month across the platform
- **Active prospects**: 100K+ prospects managed per tenant with real-time stage tracking
- **Outreach volume**: 10,000+ emails/day per tenant with multi-mailbox rotation

## LeadReach Agent Integration

The 8-agent pipeline is the core differentiator of the LeadReach platform. Each agent operates as a specialized microservice with defined inputs, outputs, and communication protocols:

| Agent | Role | Pipeline Position | Key Output |
|-------|------|-------------------|------------|
| **Atlas** | Strategic Orchestrator | 1 (Entry) | Intent classification, pipeline selection, context packets |
| **Scout** | Discovery Specialist | 2 | Structured search results with quality scores |
| **Forge** | Data Enrichment | 3 | 50+ field enriched profiles with source citations |
| **Sage** | Intelligence Analyst | 4 | Contextual insights, industry/region knowledge synthesis |
| **Judge** | Qualification Engine | 5 | ICP scores, letter grades, qualification framework results |
| **Bard** | Outreach Composer | 6 | Personalized sequences, response templates, A/B variants |
| **Flow** | Pipeline Orchestrator | 7 | Sequence execution, reply tracking, CRM sync |
| **Echo** | Reporting Analyst | 8 (Exit) | Performance reports, pipeline analytics, recommendations |

Agents communicate via structured `AgentCommMessage` objects with `from`, `to`, `type`, `content`, and `metadata` fields. The pipeline supports both sequential and parallel execution—Scout searches channels in parallel, while Forge enriches sequentially to respect rate limits. For detailed architecture, see the [Agent Pipeline Architecture](./agent-pipeline-architecture.md) document.

## Best Practices

1. **Start with a well-defined ICP**: The quality of your entire pipeline depends on the precision of your ICP. Invest 30-60 minutes in the ICP builder before launching campaigns.

2. **Use the minimum sufficient pipeline**: Not every query needs all 8 agents. Atlas selects the right pipeline variant (Quick Scan, Standard Profile, Full Pipeline) based on intent classification. Trust the system's recommendations.

3. **Personalize with 3+ variables**: Bard performs best when at least 3 of 5 personalization dimensions are available. Ensure Forge has enriched firmographic, technographic, and behavioral data before composing outreach.

4. **Respect deliverability limits**: Flow enforces per-mailbox daily send limits (50/day) and domain rotation rules. Don't override these settings—short-term volume gains lead to long-term reputation damage.

5. **Monitor the 7-stage funnel weekly**: Track conversion rates between Identified → Contacted → Engaged → Qualified. A bottleneck at any stage signals a fixable problem (bad ICP at Identified, poor messaging at Contacted, wrong qualification criteria at Qualified).

6. **A/B test systematically**: Test one variable at a time (subject line, hook, CTA, sequence length). Wait for statistical significance (500+ sends per variant) before declaring a winner.

7. **Leverage knowledge retrieval**: Each agent automatically retrieves relevant industry, regional, and domain knowledge. Ensure your knowledge base is populated for your target verticals.

8. **Review compliance dashboards monthly**: Even with automated compliance enforcement, review your suppression list accuracy, unsubscribe processing times, and cross-border transfer documentation quarterly.

## Cross-References

- [Agent Pipeline Architecture](./agent-pipeline-architecture.md) — Detailed 8-agent pipeline design, data flow, and inter-agent communication
- [Data Security & Privacy](./data-security-privacy.md) — SOC 2, GDPR, CCPA compliance, encryption, and incident response
- [Pricing & Packaging Guide](./pricing-packaging-guide.md) — Complete pricing tiers, feature matrices, and ROI frameworks
- [Onboarding Quickstart](./onboarding-quickstart.md) — Getting started guide with 30/60/90 day milestones
- [Release Notes](./release-notes.md) — Version history, current features, and roadmap
- [Agent Training: Atlas](../agents/atlas.md) — Atlas orchestrator operational manual
- [Agent Training: Scout](../agents/scout.md) — Scout discovery agent operational manual
- [Agent Training: Forge](../agents/forge.md) — Forge enrichment agent operational manual
- [Agent Training: Bard](../agents/bard.md) — Bard outreach composition manual
- [Agent Training: Flow](../agents/flow.md) — Flow pipeline orchestration manual
- [Compliance: Global Regulations](../compliance/global-regulations.md) — GDPR, CAN-SPAM, CCPA, TCPA reference
- [Domain: B2B Lead Generation Theory](../domain/b2b-lead-generation-core-theory.md) — Foundational theory and funnel design
- [Domain: ICP Design & Scoring](../domain/icp-design-scoring-methodology.md) — ICP construction methodology
