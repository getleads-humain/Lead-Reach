---
title: "Scout — Prospect Discovery Agent Tools"
category: tool
agent: scout
role: prospect-discovery
tags: [scout, prospect-discovery, search, icp-matching]
last_reviewed: "2026-06-22"
grade: "A"
---

# Scout — Prospect Discovery Agent Tools

## 1. Role

Scout receives an ICP definition from Atlas and discovers matching accounts. Scout's instinct is **coverage** — cast the widest net across every channel, then deduplicate and rank. Scout does not enrich (that's Forge) or qualify (that's Judge); it discovers.

## 2. Cognitive Posture

- **Coverage-first**: Better to surface 2,000 candidates and filter than 200 and miss.
- **Channel-agnostic**: Uses every available channel (LinkedIn, Apollo, Exa, GMaps, web search).
- **Dedup-obsessed**: Same account across multiple channels must be merged.

## 3. Tools

### Tool: discover_prospects

**Purpose**: Discover accounts matching an ICP across all configured channels.

**Input**:
- `icp` (object): Validated ICP definition.
- `region` (string): Target region.
- `population_target` (number): Desired population size.

**Output**: Array of prospect accounts with:
- `company_name`, `domain`, `linkedin_url`
- `headcount`, `industry`, `funding_stage`
- `matched_signals` (array)
- `signal_score` (0–100)
- `source_channels` (array)

### Tool: search_linkedin

**Purpose**: Search LinkedIn for companies + people matching ICP.

**Input**: Search query, filters (headcount, industry, geography).

**Output**: List of LinkedIn company URLs + matched people.

### Tool: search_apollo

**Purpose**: Query Apollo's database for matching accounts.

**Input**: Apollo filters (industry, headcount, revenue, technographics).

**Output**: Array of accounts with contact info.

### Tool: search_exa

**Purpose**: Use Exa for semantic web search to find accounts matching behavioral signals.

**Input**: Semantic query (e.g., "Series B SaaS companies hiring SDRs in US").

**Output**: Array of accounts with signal evidence (URL, snippet).

### Tool: search_gmaps

**Purpose**: Search Google Maps for local businesses matching ICP (manufacturing, retail, services).

**Input**: Industry, geography, headcount estimate.

**Output**: Array of businesses with location, phone, website.

### Tool: search_web

**Purpose**: General web search for press releases, funding announcements, hiring posts.

**Input**: Boolean query.

**Output**: Array of URLs with snippets.

### Tool: deduplicate

**Purpose**: Merge accounts that appear across multiple channels.

**Input**: Array of accounts.

**Output**: Deduplicated array with `source_channels` merged.

### Tool: rank_by_signal

**Purpose**: Rank accounts by signal score (funding > hiring > leadership > product > generic).

**Input**: Array of accounts with signals.

**Output**: Sorted array with `signal_score` per account.

## 4. Performance Metrics

| Metric | Target |
|--------|--------|
| Discovery yield (per ICP) | ≥1,000 accounts |
| Duplicate rate (pre-merge) | <30% |
| Duplicate rate (post-merge) | <2% |
| Signal accuracy (validated by Forge) | >85% |
| Discovery latency (per 1,000 accounts) | <24 hours |

## 5. Handoffs

- **From Atlas**: ICP definition, region, population target.
- **To Atlas**: Ranked list of prospect accounts with signals.
