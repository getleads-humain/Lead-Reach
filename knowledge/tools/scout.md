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

## 6. Error Handling & Edge Cases

### 6.1 Channel-Specific Failures

| Channel | Failure Mode | Detection | Recovery |
|---------|-------------|-----------|----------|
| LinkedIn | Rate limit (429) | HTTP status + Retry-After header | Backoff per header; rotate session cookie; cap at 3 retries |
| LinkedIn | CAPTCHA challenge | Response contains captcha payload | Switch to authenticated API endpoint; if unavailable, skip and log |
| Apollo | Quota exhausted | 403 with `quota_exceeded` body | Return partial results; flag remaining population as `discovery_incomplete` |
| Exa | Semantic query too broad | >10,000 results returned | Auto-narrow by adding region + industry constraints |
| GMaps | Zero results for sparse region | Empty array for known-active region | Expand search radius by 50%; retry once |
| Web search | All results stale (>180 days) | Date filtering returns 0 | Remove date filter; flag all results as `stale_signal` |

### 6.2 Deduplication Edge Cases

| Edge Case | Example | Resolution |
|-----------|---------|------------|
| Same company, different names | "Stripe, Inc." vs "Stripe" vs "Stripe Technology" | Fuzzy match on domain (stripe.com); if domain matches, merge |
| Same company, different domains | "acme.com" vs "acme.io" vs "tryacme.com" | Check if domains redirect to same canonical URL; if yes, merge |
| Subsidiary vs parent | "Google Cloud" vs "Alphabet Inc" | Keep both entries; tag subsidiary with `parent_company: "Alphabet Inc"` |
| Holding company shell | Multiple businesses at same address | Do NOT merge; flag for Forge verification |
| Acquired company | "Figma" post-Adobe acquisition | Keep as separate entity with `acquired_by: "Adobe"` tag |

### 6.3 ICP Mismatch Scenarios

| Scenario | Symptom | Action |
|----------|---------|--------|
| ICP too narrow | Population <100 after all channels | Return results + warning; suggest broadening headcount_range or adding adjacent industries |
| ICP too broad | Population >50,000 | Auto-add strongest signal filter (e.g., recent funding); warn operator |
| ICP references unknown industry | "DeepTech" not in NAICS | Map to closest known category; flag for operator review |
| Region has no coverage | "Antarctica" | Return empty + error: "No channel coverage for this region" |

### 6.4 Rate Limit Handling

- Per-channel rate limits are tracked in a token bucket.
- When a channel's bucket is exhausted, remaining queries are queued with a backoff timer.
- If queue length exceeds 500, oldest queries are dropped with a `discarded: true` flag.
- Scout reports channel health to Atlas via `monitor_progress` so Atlas can adjust the plan.

### 6.5 Data Not Found

When a specific account expected by the ICP is not found:
1. Log the missed account with ICP criteria.
2. Attempt a broader search (remove one ICP constraint).
3. If still not found, add to `missed_accounts` array in output for Forge to attempt.
4. Never fabricate an account to meet population targets.

## 7. Integration Patterns

### 7.1 Fan-Out Discovery

Scout fans out across all channels simultaneously:

```
Atlas → Scout.discover_prospects
              ├── search_linkedin (parallel)
              ├── search_apollo   (parallel)
              ├── search_exa      (parallel)
              ├── search_gmaps    (parallel)
              └── search_web      (parallel)
              → deduplicate
              → rank_by_signal
              → Return to Atlas
```

All channel searches run in parallel; results are merged after all channels complete or timeout.

### 7.2 Progressive Population Delivery

For large population targets (>2,000 accounts), Scout delivers results in waves:

- **Wave 1** (30 min): Top 500 accounts from fastest channels (Apollo, LinkedIn).
- **Wave 2** (2 hours): Next 1,000 accounts from all channels, deduplicated.
- **Wave 3** (24 hours): Full population, including slow channels (GMaps, deep web).

Each wave is delivered to Atlas so downstream agents can begin work immediately.

### 7.3 Feedback Loop with Forge

```
Scout → Forge.enrich_account
Forge → (discovery error: company defunct) → Scout → re-search for replacement
```

When Forge reports that a discovered company no longer exists, Scout removes it and discovers a replacement.

### 7.4 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| discover_prospects | deduplicate | Raw account arrays from all channels | Array<Object> |
| deduplicate | rank_by_signal | Merged account array | Array<Object> |
| rank_by_signal | Atlas | Final ranked prospect list | Array<Object> |
| search_linkedin | discover_prospects | Raw LinkedIn results | Array<Object> |
| search_apollo | discover_prospects | Raw Apollo results | Array<Object> |

## 8. Quality Assurance Rules

### 8.1 Minimum Data Completeness

Every discovered account must have at minimum:
- `company_name` (non-empty string)
- One of: `domain` OR `linkedin_url`
- `source_channels` (at least one)

Accounts missing all of the above are silently dropped and logged.

### 8.2 Signal Score Validation

| Signal Type | Weight | Validation |
|-------------|--------|------------|
| Funding (≤90 days) | 35 | Must have URL + date + round name |
| Hiring velocity | 25 | Must have ≥2 job postings within 30 days |
| Leadership change | 20 | Must have press release or LinkedIn update |
| Product launch | 15 | Must have official announcement URL |
| Generic ICP fit | 5 | Fallback when no stronger signal exists |

`signal_score` = sum of signal weights (capped at 100).

### 8.3 Confidence Thresholds

| Scenario | Threshold | Action |
|----------|-----------|--------|
| Domain match confidence | ≥80% | Accept |
| Domain match confidence | 50–79% | Accept but flag for Forge verification |
| Domain match confidence | <50% | Reject; do not include in output |
| Dedup match confidence | ≥90% | Auto-merge |
| Dedup match confidence | 70–89% | Auto-merge; flag for human spot-check |
| Dedup match confidence | <70% | Keep separate; both included |

### 8.4 Cross-Channel Validation

When an account appears in 2+ channels, Scout validates that core attributes agree:
- **Headcount**: Must be within 2x range across channels. If not, use the most recent source and flag.
- **Industry**: Must match at the 2-digit NAICS level. If not, keep both tags.
- **Location**: Must be in the same metro area. If not, flag for Forge.

## 9. Performance Optimization

### 9.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| LinkedIn search results (by query hash) | 6 hours | On ICP change |
| Apollo search results | 4 hours | On ICP change |
| Exa semantic results | 12 hours | On ICP change |
| GMaps results (by geo + industry) | 24 hours | On region change |
| Web search results | 2 hours | On query change |
| Deduplication map (domain → canonical) | 7 days | On merge conflict |

### 9.2 Parallel Execution

- All channel searches (`search_linkedin`, `search_apollo`, `search_exa`, `search_gmaps`, `search_web`) execute in parallel.
- Within each channel, pagination requests are parallelized up to 5 concurrent requests.
- Deduplication runs as a streaming operation; does not wait for all channels to complete.

### 9.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| search_linkedin | 60s per page | Return partial page; retry once |
| search_apollo | 30s per request | Return empty for that request; continue |
| search_exa | 45s per query | Return partial results |
| search_gmaps | 30s per grid cell | Skip cell; log as `uncovered_area` |
| search_web | 20s per query | Return partial results |
| deduplicate | 120s per 10K accounts | Return partially deduplicated set |
| Full discover_prospects | 24 hours | Deliver whatever is ready in waves |

### 9.4 Result Streaming

For population targets >1,000, Scout streams results to Atlas in batches of 200 accounts. This allows Forge to begin enrichment before Scout finishes all channels.

## 10. Anti-Patterns

### 10.1 Do Not: Single-Channel Discovery

Relying on only LinkedIn or only Apollo misses 30–60% of the addressable market. Always use all available channels.

### 10.2 Do Not: Skip Deduplication

Sending duplicate accounts to Forge wastes enrichment credits. Always run `deduplicate` before returning results to Atlas.

### 10.3 Do Not: Over-Specify Search Queries

Queries like `"Series B SaaS company with 247 employees in Austin TX using Salesforce"` return 0 results. Start broad, then filter. The ICP filters handle specificity.

### 10.4 Do Not: Ignore Geo-Pagination

For GMaps, searching only the city center misses suburban businesses. Use a grid search pattern with overlapping cells (see `search_gmaps` implementation).

### 10.5 Do Not: Fabricate Accounts When Population Target Is Not Met

If only 600 accounts are found for a target of 1,000, return 600. Never invent companies to meet a quota.

### 10.6 Do Not: Use Scout for Enrichment

Scout discovers; Forge enriches. If Scout finds a company but can't determine its CRM, that's Forge's job. Don't attempt to enrich during discovery — it slows the pipeline and risks lower-quality data.

## 11. Output Schema Deep Dive

### 11.1 discover_prospects Output

```yaml
discovery_id: "disc_20260622_abc123"
icp_hash: "sha256:f1e2d3c4"
region: "US"
population_target: 1000
population_actual: 1247
population_coverage: 124.7%
channels_used: ["linkedin", "apollo", "exa", "gmaps", "web"]
channels_failed: []
accounts:
  - company_name: "Acme Corp"
    domain: "acme.com"
    linkedin_url: "https://linkedin.com/company/acme-corp"
    headcount: 250
    industry: "SaaS"
    funding_stage: "series_b"
    location: "San Francisco, CA"
    matched_signals:
      - signal_type: "funding"
        description: "Raised $45M Series B"
        date: "2026-05-15"
        source_url: "https://techcrunch.com/2026/05/15/acme-series-b"
        signal_weight: 35
      - signal_type: "hiring"
        description: "3 SDR roles posted"
        date: "2026-06-01"
        source_url: "https://acme.com/careers"
        signal_weight: 25
    signal_score: 60
    source_channels: ["linkedin", "apollo", "web"]
    data_quality: "raw"       # raw | deduped | ranked
    discovery_timestamp: "2026-06-22T15:00:00Z"
missed_accounts: []
partial_channels: []
metadata:
  total_raw_results: 3841
  post_dedup: 1247
  dedup_rate: 67.5%
  discovery_duration_seconds: 4200
```

**Field Specifications**:

| Field | Type | Range/Values | Notes |
|-------|------|-------------|-------|
| population_actual | integer | 0–10,000,000 | May exceed population_target |
| signal_score | integer | 0–100 | Sum of signal weights, capped at 100 |
| source_channels | array | linkedin, apollo, exa, gmaps, web | ≥1 required per account |
| data_quality | enum | raw, deduped, ranked | Progresses through pipeline |
| dedup_rate | float | 0–100% | Target: pre-merge <30%, post-merge <2% |

### 11.2 search_linkedin Output

```yaml
query: "Series B SaaS companies hiring SDRs"
filters:
  headcount: [50, 500]
  industry: "Computer Software"
  geography: "United States"
results:
  - company_name: "Acme Corp"
    linkedin_url: "https://linkedin.com/company/acme-corp"
    headcount_range: "201-500"
    industry: "Computer Software"
    headquarters: "San Francisco, CA"
    matched_people:
      - name: "Jane Smith"
        title: "VP Sales"
        linkedin_url: "https://linkedin.com/in/jane-smith"
    page: 1
    rank: 1
total_results: 342
page_count: 7
```

### 11.3 search_apollo Output

```yaml
query_id: "apollo_q_abc123"
filters:
  industry: ["SaaS", "Computer Software"]
  employee_count: { min: 50, max: 500 }
  revenue: { min: 5000000 }
results:
  - company_name: "Acme Corp"
    domain: "acme.com"
    apollo_id: "5f1e2d3c4b5a"
    headcount: 250
    industry: "SaaS"
    revenue_estimate: 25000000
    funding_stage: "series_b"
    location: "San Francisco, CA"
    contacts:
      - name: "Jane Smith"
        title: "VP Sales"
        email: "jane@acme.com"
        email_confidence: 85
total_results: 1204
credits_used: 1204
credits_remaining: 8796
```

### 11.4 deduplicate Output

```yaml
input_count: 3841
output_count: 1247
merge_count: 2594
merge_details:
  - strategy: "domain_match"
    merges: 1842
    avg_confidence: 94
  - strategy: "name_fuzzy_match"
    merges: 601
    avg_confidence: 78
  - strategy: "address_match"
    merges: 151
    avg_confidence: 72
unmerged_conflicts: 12
  - account_a: { name: "Acme Inc", domain: "acme.com" }
    account_b: { name: "Acme Holdings", domain: "acmeholdings.com" }
    conflict_reason: "Same address, different domains"
    resolution: "kept_separate"
```
