---
title: "Release Notes — LeadReach Version History and Roadmap"
category: product
grade: A
last_reviewed: "2026-07-03"
tags: [release-notes, version-history, changelog, roadmap, known-issues, features, updates]
---

# Release Notes — LeadReach Version History and Roadmap

## Executive Summary

LeadReach follows a continuous delivery model with scheduled feature releases every 4-6 weeks and patch releases as needed. The current production version is **v2.4.0**, released on June 28, 2026. This document tracks all major and minor releases from v2.0.0 onward, including new features, improvements, bug fixes, known issues, and the upcoming product roadmap. Each release is categorized by impact level—Major (new agent or major capability), Minor (feature enhancement), and Patch (bug fix).

The v2.x release series represents a significant evolution from the v1.x monolithic architecture to the current 8-agent pipeline design. Key milestones include the introduction of the agent pipeline in v2.0, the addition of Sage and Judge agents in v2.1, the Flow execution engine in v2.2, Echo reporting in v2.3, and the current v2.4 release with advanced multi-channel outreach and B2C Setter capabilities.

## Current Version: v2.4.0

**Release Date**: June 28, 2026
**Release Type**: Minor Feature Release
**Deployment**: Rolling deployment, completed June 30, 2026

### New Features

#### Multi-Channel Outreach Expansion
- **WhatsApp Channel**: New outreach channel for international prospects, particularly effective in Asia-Pacific, Latin America, and the Middle East. Supports text and image messages with template management. Available as a $79/mo add-on or included in Closer+ tiers.
- **Instagram Direct Messages**: Outreach via Instagram DMs for B2C Setter track. Supports text and image messages with rate limiting (50 DMs/day per account). Available in Closer and Agency tiers.
- **Facebook Messenger**: Outreach via Facebook Messenger for B2C Setter track. Supports text, image, and quick-reply templates. Available in Closer and Agency tiers.

#### B2C Setter Track Launch
- **Setter Tier ($97/mo)**: New entry-level tier for solopreneurs automating appointment setting with 2 AI Setters, SMS + Email channels, and basic qualification.
- **Closer Tier ($297/mo)**: New professional tier for teams scaling conversational booking with unlimited AI Setters, all channels (SMS, WhatsApp, IG, FB, Email), 17+ languages, and 5 sub-accounts.
- **Agency Tier (Custom)**: New enterprise tier for agencies managing multiple brands with white-label, unlimited sub-accounts, and custom AI training.

#### Advanced ICP Scoring Enhancements
- **Custom Scoring Models**: Judge now supports custom scoring models trained on your historical win/loss data. Upload closed-won and closed-lost account lists, and Judge identifies which ICP criteria correlate most strongly with outcomes.
- **Intent Signal Boost**: New scoring dimension that detects and weights real-time intent signals (job postings, technology changes, content consumption) alongside traditional firmographic and technographic fit.
- **ICP Drift Detection**: Echo automatically detects when ICP scoring accuracy degrades over time and suggests weight adjustments based on recent conversion data.

#### Knowledge Base v2
- **Semantic Search**: Knowledge base retrieval now uses vector embeddings for semantic search, replacing the previous keyword-only approach. Agent knowledge retrieval relevance improved by 35%.
- **Knowledge Gap Reports**: Automated gap detection identifies industries, regions, and domains where knowledge coverage is thin. Gap reports generated monthly and available in the admin dashboard.
- **Community Contributions**: Partners and Enterprise customers can now contribute knowledge documents via pull request to the knowledge repository.

### Improvements

- **Scout Search Latency**: Reduced average search latency from 52s to 38s through parallel channel execution and improved caching
- **Forge Enrichment Completeness**: Average profile completeness score increased from 68% to 74% through additional data source integration (OpenCorporates, SEC EDGAR)
- **Bard Personalization Depth**: 5-variable personalization system now extracts and applies an average of 3.7 personalization variables per email (up from 2.8)
- **Flow Reply Detection**: Reply detection time reduced from 25 minutes to 18 minutes average through IMAP polling optimization
- **Dashboard Performance**: Dashboard load time reduced by 40% through React Server Components migration and query optimization
- **Mobile Responsiveness**: All major views now fully responsive on mobile and tablet devices
- **Accessibility**: WCAG 2.1 AA compliance for all new UI components

### Bug Fixes

- Fixed: Campaign pipeline status batch endpoint returning stale data after concurrent updates
- Fixed: Forge enrichment failing silently for companies with non-ASCII characters in names
- Fixed: Flow suppression list check race condition causing rare duplicate sends (<0.01% occurrence)
- Fixed: ICP Builder crash when adding >20 exclusion criteria
- Fixed: Scout LinkedIn search returning pagination errors after 50 results
- Fixed: Echo report generation timeout for accounts with >50,000 leads
- Fixed: Calendar timezone mismatch in Setter booking confirmation emails
- Fixed: A/B test statistical significance calculator showing incorrect confidence intervals for small samples

## Release History

### v2.3.0 — May 15, 2026

**Release Type**: Minor Feature Release

#### New Features

- **Echo Reporting Agent**: New agent dedicated to pipeline analytics and performance reporting
  - Daily summary reports with key metrics (sends, replies, meetings, pipeline generated)
  - Weekly deep dive with funnel analysis, source attribution, and ICP performance
  - Monthly strategic review with optimization recommendations
  - Custom report builder for ad-hoc analysis
  - Automated report delivery via email, Slack, and in-app notifications

- **Pipeline Analytics Dashboard**: New analytics view with real-time pipeline visualization
  - 7-stage funnel with conversion rates and velocity metrics
  - Campaign performance comparison (side-by-side A/B test results)
  - Source attribution (which channels produce best leads)
  - Rep performance leaderboard with activity and conversion metrics
  - Custom date ranges and cohort analysis

- **A/B Testing Framework**: Built-in A/B testing for outreach campaigns
  - Subject line testing with statistical significance calculator
  - Hook and CTA variant testing
  - Sequence length optimization
  - Automatic winner selection with configurable confidence threshold
  - Test results dashboard with visualizations

#### Improvements

- **Judge Qualification**: Added MEDDIC qualification framework alongside existing BANT support
- **Bard Sequences**: New 4-touch short sequence option for low-intent prospects
- **Flow CRM Sync**: Added Pipedrive integration alongside existing Salesforce and HubSpot
- **Scout Channels**: Added yfinance integration for public company financial data
- **Security**: Implemented CSP reporting endpoint and automated XSS detection

#### Bug Fixes

- Fixed: Agent pipeline session memory leak causing degraded performance after 50+ runs
- Fixed: Forge SMTP verification returning false positives for catch-all domains
- Fixed: Flow scheduling error causing sequence touches to send outside configured hours
- Fixed: Scout deduplication merging companies with similar names but different entities
- Fixed: ICP Builder not saving custom field weights correctly on first save
- Fixed: Knowledge retrieval returning irrelevant documents for multi-intent queries

---

### v2.2.0 — March 22, 2026

**Release Type**: Minor Feature Release

#### New Features

- **Flow Pipeline Orchestration Agent**: New agent for executing outreach sequences and managing pipeline state
  - Multi-mailbox management with per-mailbox send limits (30-50/day)
  - Domain rotation and mailbox warm-up automation
  - Reply detection via IMAP polling and ESP webhooks
  - Automatic reply classification (positive, negative, question, OOO, unsubscribe)
  - 7-stage prospect funnel management with forward-only transitions
  - CRM bidirectional sync (Salesforce, HubSpot)
  - Suppression list management with automatic compliance enforcement
  - Audit trail for all outreach actions

- **Sequence Execution Engine**: Full sequence lifecycle management
  - Scheduling optimization (prospect timezone, best days/times, holiday awareness)
  - Auto-pause on reply to prevent embarrassing follow-ups after engagement
  - 30-minute SLA for reply routing to assigned reps
  - Template variable substitution with validation
  - Daily, weekly, and monthly reporting cadences

- **Multi-Mailbox Infrastructure**:
  - Mailbox health monitoring (bounce rate, complaint rate, open rate trends)
  - Automated warm-up protocol (5 emails/day, +5/week, for 4 weeks)
  - Per-mailbox domain reputation tracking
  - Alert system for reputation degradation

#### Improvements

- **Bard Output**: Added breakup email template to default 6-touch sequence (highest reply rate individual touch)
- **Forge Verification**: New cross-reference verification layer checking enriched data against multiple sources
- **Scout Coverage**: Added OpenStreetMap Overpass API for geographic discovery without Google Maps quota
- **Security**: Implemented SSRF guard (url-guard.ts) for all external URL fetching
- **Performance**: Reduced average pipeline latency by 22% through async agent execution

#### Bug Fixes

- Fixed: Bard composing outreach for D-grade prospects when auto-disqualify was enabled
- Fixed: Forge enriching subsidiary companies with parent company data
- Fixed: Scout returning duplicate results when searching across overlapping channels
- Fixed: Atlas pipeline selection choosing full pipeline for simple conversational queries
- Fixed: Agent context window overflow for long conversation histories (memory compaction added)
- Fixed: Rate limiter allowing burst requests above configured thresholds

---

### v2.1.0 — January 18, 2026

**Release Type**: Minor Feature Release

#### New Features

- **Sage Intelligence Agent**: New agent providing contextual analysis and strategic recommendations
  - Industry pattern matching based on firmographic signals
  - Regional compliance requirement detection (GDPR, PIPL, LGPD)
  - Trigger event prioritization by impact on purchase likelihood
  - Competitive landscape analysis with vendor identification
  - Buying signal synthesis combining behavioral and technographic data

- **Judge Qualification Agent**: New agent for lead scoring and qualification
  - Multi-dimensional ICP scoring (firmographic, technographic, intent, trigger, engagement)
  - Configurable scoring weights per campaign
  - Letter grades (A through D) with detailed justification
  - BANT qualification framework support
  - Auto-disqualification for D-grade prospects

- **ICP Builder v2**: Complete redesign of the ICP building experience
  - Multi-dimensional scoring configuration with real-time preview
  - Industry-specific templates (SaaS, Manufacturing, Healthcare, Financial Services)
  - ICP validation via test search with relevance feedback
  - Import/export ICP configurations between campaigns

#### Improvements

- **Forge Enrichment**: Added technographic enrichment via PublicWWW integration
- **Bard Personalization**: Increased personalization variable extraction from enriched profiles
- **Scout Channels**: Added SEC EDGAR and OpenCorporates for financial and legal data
- **Compliance**: Added automated CAN-SPAM/GDPR compliance checks in Bard output
- **Security**: Implemented input validation module (input-validation.ts) across all API routes

#### Bug Fixes

- Fixed: Scout returning zero results for queries with special characters
- Fixed: Forge enrichment timeout for companies with large executive teams (>20)
- Fixed: ICP scoring producing incorrect grades for prospects with missing fields
- Fixed: Bard generating outreach for prospects on the suppression list
- Fixed: Knowledge retrieval returning outdated documents when newer versions exist

---

### v2.0.0 — November 4, 2025

**Release Type**: Major Release

#### New Features

- **8-Agent Pipeline Architecture**: Complete redesign from monolithic system to specialized agent pipeline
  - Atlas (Strategic Orchestrator): Intent classification, entity extraction, pipeline selection
  - Scout (Discovery Specialist): Multi-channel prospect search with 7+ channels
  - Forge (Data Enrichment): Multi-source data fusion with 50+ field profiles
  - Bard (Outreach Composer): AI-powered personalized outreach composition
  - Flow (Pipeline Orchestrator): Added in v2.2
  - Sage (Intelligence Analyst): Added in v2.1
  - Judge (Qualification Engine): Added in v2.1
  - Echo (Reporting Analyst): Added in v2.3

- **Agent Communication Protocol**: Structured `AgentCommMessage` system for inter-agent data exchange
- **Pipeline Variants**: Adaptive pipeline selection (Quick Scan, Standard Profile, Full Pipeline, etc.)
- **Knowledge Retrieval System**: Agents query the knowledge base for industry/region/domain context
- **Memory Compaction**: Automatic conversation summarization for long-running pipelines

- **Scout Agent (Redesign)**: Complete rewrite of the discovery engine
  - 7+ channels (Exa, LinkedIn, GitHub, Twitter, Reddit, RSS, Google Maps)
  - Multi-strategy search engine (Company, Person, Geographic, Industry)
  - Quality scoring system (relevance, completeness, freshness, source trust)
  - Deduplication engine with multiple matching strategies
  - Coverage maximization with iterative query expansion

- **Forge Agent (Redesign)**: Complete rewrite of the enrichment engine
  - 5-stage enrichment pipeline (Identity → Firmographic → Technographic → People → Behavioral)
  - 6-tier source hierarchy with conflict resolution
  - Verification layer (existence, format, plausibility, cross-reference, source, recency)
  - Completeness scoring system
  - Field-by-field enrichment strategies per data type

- **Bard Agent (Redesign)**: Complete rewrite of the outreach engine
  - 5-variable personalization system
  - Default 6-touch sequence with breakup email
  - Response templates for 6 reply types
  - Multi-channel touch support (email, LinkedIn, phone, content)
  - A/B test variant generation
  - Built-in compliance enforcement

#### Architecture Changes

- **Frontend**: Migrated from Create React App to Next.js 14 with App Router
- **Database**: Migrated from Firebase to Supabase (PostgreSQL) with Row-Level Security
- **Deployment**: Migrated from self-hosted to Vercel with edge functions
- **AI Provider**: Switched primary LLM from GPT-4 to GLM-4.7-Flash with fallback routing
- **State Management**: Replaced Redux with server-side state via React Server Components
- **Authentication**: Migrated from custom auth to Supabase Auth with JWT tokens

#### Pricing Changes

- Introduced tiered pricing (Launchpad, Scout, Command, Enterprise)
- Added Founders' Pass lifetime deal ($2,497)
- Added B2B and B2C product tracks
- Removed per-query pricing model in favor of monthly subscription with included leads

#### Known Breaking Changes from v1.x

- API v1 endpoints deprecated; v2 API required
- Webhook payload format changed; migration guide available
- CRM integration field mapping updated; re-authorization required
- Data export format changed from XML to JSON/CSV

#### Bug Fixes

- Fixed: All known v1.x bugs addressed in the v2.0 rewrite
- Fixed: Memory leak in long-running research sessions
- Fixed: Rate limiting not applied to parallel API calls
- Fixed: Search results not sorted by relevance in some query types
- Fixed: Enrichment data not refreshing for previously researched companies

## Known Issues (Current — v2.4.0)

### High Priority

| ID | Issue | Workaround | Fix ETA |
|----|-------|-----------|---------|
| LR-421 | Scout LinkedIn search may return incomplete results for companies with >500 employees when using free LinkedIn tier | Use Exa search with `site:linkedin.com/company` as alternative | v2.4.1 |
| LR-435 | Forge enrichment occasionally marks valid email addresses as unverified when SMTP check times out | Re-run enrichment after 24 hours; cached SMTP results are retried | v2.4.1 |
| LR-442 | Flow suppression list sync may take up to 1 hour to propagate across all sending mailboxes | Wait 1 hour after adding suppression entries before sending | v2.4.2 |

### Medium Priority

| ID | Issue | Workaround | Fix ETA |
|----|-------|-----------|---------|
| LR-418 | Bard personalization occasionally uses stale trigger events (>90 days old) when fresher data is available | Manually review trigger events in outreach before sending | v2.4.2 |
| LR-427 | ICP Builder scoring preview may show incorrect percentages when using custom weights that don't sum to 100 | Normalize weights manually before saving | v2.4.2 |
| LR-431 | Echo weekly report generation may fail for accounts with >100,000 leads | Contact support for manual report generation | v2.4.3 |
| LR-438 | WhatsApp channel rate limiting not enforced correctly for high-volume senders | Monitor send volume manually; stay under 200 messages/day | v2.4.2 |

### Low Priority

| ID | Issue | Workaround | Fix ETA |
|----|-------|-----------|---------|
| LR-415 | Dashboard chart tooltips may not display correctly on Safari 17 | Use Chrome or Firefox for dashboard | v2.4.3 |
| LR-422 | Campaign name sorting is case-sensitive in the campaign list view | Use consistent casing in campaign names | v2.4.3 |
| LR-429 | Knowledge search occasionally returns duplicate documents when querying across categories | No functional impact; duplicates ignored in agent processing | v2.5.0 |
| LR-433 | Lead export CSV may include extra whitespace in company names | Trim whitespace after export | v2.4.3 |
| LR-441 | Setter booking confirmation email shows UTC time instead of prospect local time | Manually convert times; mention local time in booking notes | v2.4.2 |

## Upcoming Roadmap

### v2.4.1 — July 2026 (Patch Release)

- Fix: Scout LinkedIn search completeness for large companies (LR-421)
- Fix: Forge SMTP verification timeout handling (LR-435)
- Improvement: Scout search result caching improvements (reduce latency by ~15%)
- Improvement: Forge enrichment parallelism for multi-prospect campaigns

### v2.4.2 — August 2026 (Patch Release)

- Fix: Flow suppression list propagation latency (LR-442)
- Fix: Bard stale trigger event filtering (LR-418)
- Fix: ICP Builder weight normalization (LR-427)
- Fix: WhatsApp rate limiting enforcement (LR-438)
- Improvement: Setter booking confirmation timezone fix (LR-441)

### v2.5.0 — September 2026 (Minor Feature Release)

- **New: Atlas v2 with Multi-Intent Support**: Handle queries with multiple simultaneous intents (e.g., "research Acme Corp and compose outreach to their VP Sales")
- **New: Forge Relationship Mapping**: Map relationships between companies (parent/subsidiary, investor/portfolio, customer/vendor) for multi-threaded selling
- **New: Bard Video Outreach**: AI-composed video message scripts with integrated Loom recording prompts
- **New: Flow Smart Scheduling**: ML-optimized send time selection based on historical engagement patterns per prospect domain
- **Improvement: Scout v2 Search Engine**: Neural search with query understanding for more accurate discovery
- **Improvement: Judge Collaborative Scoring**: Team-based scoring with consensus mechanism for enterprise accounts
- **Improvement: Echo Predictive Analytics**: Pipeline forecasting based on historical conversion patterns

### v2.6.0 — November 2026 (Minor Feature Release)

- **New: Agent Marketplace**: Third-party agent plugins for specialized use cases (healthcare compliance checking, financial regulatory scanning)
- **New: Multi-Tenant Team Analytics**: Team performance comparison, coaching insights, and best practice extraction
- **New: Forge Real-Time Monitoring**: Continuous enrichment with change detection for tracked accounts
- **New: Bard Multi-Language Outreach**: Automatic translation and cultural adaptation for non-English outreach
- **Improvement: Full SOC 2 Type II Renewal**: Annual audit with expanded scope

### v3.0.0 — Q1 2027 (Major Release)

- **New: Autonomous Campaign Management**: Atlas manages entire campaign lifecycles with minimal human input—creating campaigns, adjusting targeting, pausing underperformers, and scaling winners
- **New: Agent Training Studio**: Custom agent training on proprietary data with fine-tuned models for your specific vertical
- **New: Real-Time Collaboration**: Multi-user simultaneous campaign editing with conflict resolution
- **New: Advanced API v3**: GraphQL API with subscriptions for real-time data streaming
- **Architecture: Edge AI Deployment**: On-premise agent execution for latency-sensitive and data-residency-restricted deployments
- **Architecture: Agent Swarm Mode**: Multiple instances of the same agent for parallel processing at scale

## Technical Details: Version Numbering

LeadReach follows semantic versioning (semver) with the following conventions:

- **Major (X.0.0)**: Breaking changes, architecture overhauls, new agent introductions
- **Minor (2.X.0)**: New features, significant improvements, new integrations
- **Patch (2.4.X)**: Bug fixes, performance improvements, minor UI adjustments

### Release Cadence

| Release Type | Cadence | Deployment Method |
|-------------|---------|-------------------|
| Major | Quarterly (approx.) | Staged rollout over 1 week |
| Minor | Every 4-6 weeks | Rolling deployment over 2 days |
| Patch | As needed (typically weekly) | Instant deployment |

### Deprecation Policy

- API versions are supported for 12 months after the release of a successor version
- Deprecated features are announced 90 days before removal
- Breaking changes are only introduced in major releases
- Migration guides are provided for all breaking changes

## LeadReach Agent Integration

Each release may introduce changes to agent behavior, capabilities, or configuration:

| Release | Agent Changes |
|---------|--------------|
| v2.4.0 | Sage: Intent signal boost scoring; Judge: Custom scoring models; Echo: ICP drift detection |
| v2.3.0 | Echo: New agent introduced; Judge: MEDDIC framework; Bard: Short sequence |
| v2.2.0 | Flow: New agent introduced; Bard: Breakup email template |
| v2.1.0 | Sage: New agent introduced; Judge: New agent introduced; Forge: Technographic enrichment |
| v2.0.0 | Atlas, Scout, Forge, Bard: Complete redesign with new architecture |

**Agent API Stability**: Agent communication protocols (`AgentCommMessage` format, context packet schema, output schemas) are guaranteed stable within a major version. Breaking changes to agent interfaces only occur in major releases (v3.0.0+).

## Best Practices

1. **Review release notes before each update**: LeadReach deploys automatically, but reviewing release notes ensures you're aware of new features and any behavior changes that might affect your campaigns.

2. **Test new features on a small campaign first**: When a new feature lands (e.g., custom scoring models in v2.4), test it on a single campaign before applying broadly. This minimizes risk while you learn the new capability.

3. **Report issues via the in-app feedback tool**: When you encounter a bug, use the in-app feedback button (bottom-right corner) to report it. Include your browser, the page you were on, and steps to reproduce. This helps the engineering team triage and fix issues faster.

4. **Monitor the status page**: Before escalating an issue, check status.leadreach.ai. If there's an active incident, the team is already working on it.

5. **Plan for major releases**: Major releases (v3.0.0+) may include breaking changes. Review the migration guide 90 days before the release and plan any necessary code or workflow updates.

6. **Use the Founders' Pass for long-term stability**: Founders' Pass holders receive all future platform updates at no additional cost, making it the most cost-effective option for long-term users.

7. **Provide feedback on roadmap items**: The roadmap is influenced by customer feedback. If a planned feature doesn't address your needs or you have a higher-priority request, share it with your Customer Success Manager or via the feedback portal.

8. **Stay current on patches**: While patches are deployed automatically, some patches fix compliance or security issues. Ensure your team is aware of security-related patches and any required configuration changes.

## Cross-References

- [LeadReach Platform Overview](./leadreach-platform-overview.md) — Current platform capabilities
- [Agent Pipeline Architecture](./agent-pipeline-architecture.md) — Current agent design and communication protocols
- [Data Security & Privacy](./data-security-privacy.md) — Security updates and compliance changes by version
- [Pricing & Packaging Guide](./pricing-packaging-guide.md) — Current pricing and packaging changes by version
- [Onboarding Quickstart](./onboarding-quickstart.md) — Getting started with the current version
- [Agent Training: Atlas](../agents/atlas.md) — Atlas operational documentation (current version)
- [Agent Training: Scout](../agents/scout.md) — Scout operational documentation (current version)
- [Agent Training: Forge](../agents/forge.md) — Forge operational documentation (current version)
- [Agent Training: Bard](../agents/bard.md) — Bard operational documentation (current version)
- [Agent Training: Flow](../agents/flow.md) — Flow operational documentation (current version)
