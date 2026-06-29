---
title: "Sage — Web Research Agent Tools"
category: tool
agent: sage
role: web-research
tags: [sage, research, synthesis, source-citation]
last_reviewed: "2026-06-22"
grade: "A"
---

# Sage — Web Research Agent Tools

## 1. Role

Sage performs deep web research on specific accounts or topics. While Scout casts a wide net and Forge enriches with structured data, Sage answers **open-ended research questions** that require synthesis across multiple sources. Sage's defining principle is **citation** — every claim has a source.

## 2. Cognitive Posture

- **Curious**: Asks follow-up questions; doesn't stop at the first result.
- **Skeptical**: Cross-references claims; flags contradictions.
- **Synthesizing**: Combines information across sources into coherent answers.

## 3. Tools

### Tool: research_question

**Purpose**: Answer an open-ended research question with cited sources.

**Input**:
- `question` (string): The research question.
- `context` (object): Optional context (account, person, industry).
- `depth` (enum): "quick" | "standard" | "deep"

**Output**:
- `answer` (string): Synthesized answer.
- `citations` (array): Sources with URL + snippet + date.
- `confidence` (0–100)
- `follow_up_questions` (array): Suggested follow-ups.

### Tool: scrape_url

**Purpose**: Scrape a specific URL for structured content.

**Input**: URL + extraction schema.

**Output**: Structured data per schema.

### Tool: search_academic

**Purpose**: Search academic / research papers (Google Scholar, Semantic Scholar).

**Input**: Query.

**Output**: Array of papers with title, authors, abstract, URL.

### Tool: search_news

**Purpose**: Search recent news with date filtering.

**Input**: Query + date range.

**Output**: Array of news items with headline, URL, date, source.

### Tool: search_funding

**Purpose**: Search funding announcements (Crunchbase, PitchBook).

**Input**: Company name + date range.

**Output**: Funding events with amount, round, date, investors.

### Tool: search_hiring

**Purpose**: Search for hiring signals at an account.

**Input**: Company name + role patterns + date range.

**Output**: Array of job postings with title, location, date, URL.

### Tool: synthesize

**Purpose**: Synthesize multiple research findings into a coherent answer.

**Input**: Array of findings (each with citations).

**Output**: Synthesized answer + consolidated citation list.

## 4. Research Depth Levels

| Level | Depth | Latency | Use Case |
|-------|-------|---------|----------|
| Quick | 1–2 sources, 30s | <1 min | Quick fact-check |
| Standard | 5–10 sources, 3–5 min | <10 min | Account research for outreach |
| Deep | 20+ sources, 30+ min | <60 min | Strategic account research, executive briefings |

## 5. Citation Standards

Every claim in a Sage answer must have:

- **Source URL** (direct link, not landing page)
- **Snippet** (exact text supporting the claim)
- **Date** (publication date)
- **Source tier** (Tier 1: major publication, Tier 2: trade press, Tier 3: blog post, Tier 4: social media)

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Citation completeness | >95% of claims cited |
| Source freshness (≤90 days) | >70% |
| Source tier distribution | >40% Tier 1+2 |
| Answer confidence calibration | Within ±10% of accuracy |
| Research latency (standard) | <10 min |

## 7. Handoffs

- **From Atlas**: Research questions per account.
- **From Forge**: Specific data points requiring deep verification.
- **To Judge**: Research findings for qualification.
- **To Bard**: Research findings for outreach personalization.

## 8. Error Handling & Edge Cases

### 8.1 Source Retrieval Failures

| Failure Mode | Detection | Recovery |
|-------------|-----------|----------|
| URL returns 404 | HTTP status code | Check Internet Archive (Wayback Machine); note "archived" in citation |
| URL returns 403 / paywall | HTTP status or paywall detection | Note as "paywalled"; extract visible snippet only |
| URL returns 500 | HTTP status | Retry once after 10s; if still failing, exclude from citations |
| CAPTCHA blocking scrape | Captcha payload in response | Fall back to search engine snippet; note "partial content" |
| Domain rate limiting | HTTP 429 | Backoff per Retry-After header; queue for retry |
| Content is non-English | Language detection | Auto-translate if translator available; note original language in citation |
| Content is auto-generated / AI spam | Quality heuristics (repetition, coherence score) | Flag as Tier 4; reduce confidence contribution |

### 8.2 Contradictory Sources

When two credible sources contradict:

| Scenario | Example | Resolution |
|----------|---------|------------|
| Date conflict | Funding announced May 15 vs May 20 | Use earliest source; note discrepancy |
| Amount conflict | $40M vs $45M raised | Report range "$40M–$45M"; cite both |
| Attribution conflict | "Founded in 2018" vs "Founded in 2019" | Prefer SEC filing or official company page; note conflict |
| Interpretation conflict | "Growing rapidly" vs "Laying off staff" | Present both; flag for human review; don't synthesize into one narrative |

### 8.3 Research Question Edge Cases

| Edge Case | Example | Action |
|-----------|---------|--------|
| Question about private company with no web presence | "What is Company X's revenue?" | Return `confidence: 10–20`; state "No public data available" |
| Question about a future event | "Will Company X IPO in 2027?" | Do not predict; cite analyst opinions with appropriate hedging |
| Question requiring legal interpretation | "Is Company X compliant with GDPR?" | Decline to provide legal conclusions; cite factual data points only |
| Question about individual's personal info | "Where does Jane Smith live?" | Decline; PII restrictions. Only provide professional information. |
| Question with no answerable content | "What is Company X's secret strategy?" | Return `confidence: 5`; state "No verifiable information found" |

### 8.4 Scrape Failures

| Failure | Detection | Recovery |
|---------|-----------|----------|
| JavaScript-rendered content | DOM appears empty | Use headless browser (Playwright); timeout 30s |
| Infinite scroll page | Content keeps loading | Set max scroll depth (5 scrolls); extract what's available |
| Redirect chain | URL redirects 3+ times | Follow up to 5 redirects; note final URL in citation |
| Content behind authentication | Login wall detected | Report "authentication_required"; cannot access |
| Malformed HTML | Parser fails | Fall back to raw text extraction; note "unstructured" |

### 8.5 Rate Limit Handling

- Academic search APIs (Semantic Scholar): 100 requests/5 min. Queue excess.
- News APIs: 500 requests/hour. Batch queries where possible.
- Web scraping: 1 request/second per domain. Respect `robots.txt`.
- Funding databases: Rate limited per API tier. Track remaining quota.

### 8.6 Conflicting Signals in Synthesis

When synthesizing multiple findings that conflict:
1. Present both perspectives with equal weight.
2. Do not average conflicting qualitative claims (e.g., "growing" + "shrinking" ≠ "stable").
3. Assign confidence based on source tier: Tier 1 > Tier 2 > Tier 3 > Tier 4.
4. If confidence gap between conflicting sources is <10%, escalate to human.

## 9. Integration Patterns

### 9.1 Forge Verification Chain

```
Forge.cross_reference → (discrepancy on headcount)
  → Atlas → Sage.research_question("What is Acme Corp's current headcount?")
  → Sage returns answer with citations
  → Forge updates record with Sage source as tiebreaker
```

### 9.2 Judge Deep-Dive Pattern

```
Judge.qualify_lead → (confidence <40)
  → Atlas → Sage.research_question("What are Acme Corp's strategic priorities in 2026?")
  → Sage returns detailed research
  → Judge re-scores with new data
```

### 9.3 Bard Personalization Research

```
Bard.select_trigger → (trigger: "funding", but needs detail)
  → Sage.research_question("How is Acme Corp planning to use their Series B funding?")
  → Sage returns specific plans (hiring, product expansion, etc.)
  → Bard uses specific detail in email personalization
```

### 9.4 Multi-Question Research Session

For complex accounts, Atlas dispatches multiple research questions to Sage:

```yaml
research_questions:
  - question: "What is Acme Corp's competitive positioning?"
    depth: "standard"
  - question: "Who are the key decision-makers at Acme Corp?"
    depth: "quick"
  - question: "What pain points does Acme Corp's product solve?"
    depth: "standard"
```

Sage executes these in parallel and `synthesize` the results into a unified account brief.

### 9.5 Data Flow Between Tools

| From Tool | To Tool | Data Passed | Format |
|-----------|---------|-------------|--------|
| research_question | synthesize | Individual findings | Array<Object> |
| scrape_url | research_question | Extracted content per schema | Object |
| search_academic | research_question | Paper metadata | Array<Object> |
| search_news | research_question | News items | Array<Object> |
| search_funding | Forge (via Atlas) | Verified funding data | Object |
| search_hiring | Judge (via Atlas) | Hiring signals | Array<Object> |

## 10. Quality Assurance Rules

### 10.1 Citation Completeness Requirements

Every factual claim in a `research_question` answer must have:
- At least 1 citation for "quick" depth.
- At least 3 citations for "standard" depth.
- At least 5 citations for "deep" depth.

Uncited claims are flagged as `unverified` and excluded from confidence scoring.

### 10.2 Confidence Calibration Rules

| Confidence Range | Meaning | Action |
|-----------------|---------|--------|
| 90–100 | Multiple Tier 1 sources agree | Safe for outreach personalization |
| 70–89 | Good source agreement, minor gaps | Use with minor hedging ("reportedly", "appears to") |
| 50–69 | Conflicting or weak sources | Present as hypothesis; do not use in outreach |
| 30–49 | Very limited information | Return to requester with "insufficient data" |
| 0–29 | No reliable sources found | Return `confidence: <30`; recommend human research |

### 10.3 Source Quality Validation

| Source Tier | Definition | Max Contribution to Confidence |
|-------------|------------|-------------------------------|
| Tier 1 | Major publication (TechCrunch, WSJ, Reuters, SEC filings) | +30 per source |
| Tier 2 | Trade press (SaaStr, G2, industry-specific outlets) | +20 per source |
| Tier 3 | Blog posts, Medium, company blog | +10 per source |
| Tier 4 | Social media, forums, Reddit | +5 per source |

### 10.4 Synthesis Quality Checks

- No claim may rely on a single Tier 3 or Tier 4 source.
- If synthesis relies entirely on Tier 4 sources, max confidence is 40.
- All synthesized claims must be checked for internal consistency.
- Synthesis must present conflicting evidence, not suppress it.

### 10.5 Escalation Rules

- Auto-escalate: Answer with confidence <30 on a question from Judge → flag for human research.
- Auto-escalate: All sources are >180 days old → flag as stale research.
- Auto-escalate: Research question involves PII → decline and notify operator.

## 11. Performance Optimization

### 11.1 Caching Strategy

| Cache Key | TTL | Invalidation |
|-----------|-----|-------------|
| Scrape result (by URL hash) | 24 hours | On explicit re-scrape request |
| Academic search results | 7 days | On query change |
| News search results | 2 hours | On next request with new date range |
| Funding search results | 24 hours | On new funding event |
| Hiring search results | 12 hours | On next request |
| Synthesized answers (by question hash) | 48 hours | On context change |

### 11.2 Parallel Execution

- Multiple `research_question` calls for the same account run in parallel.
- Within a single research question: `search_news`, `search_funding`, `search_hiring` run in parallel.
- `scrape_url` calls for multiple URLs run in parallel (max 10 concurrent).
- `synthesize` runs sequentially after all source retrieval completes.

### 11.3 Timeout Handling

| Operation | Timeout | On Timeout |
|-----------|---------|-----------|
| research_question (quick) | 60s | Return partial answer with available sources |
| research_question (standard) | 10 min | Return partial answer; flag as `incomplete_research` |
| research_question (deep) | 60 min | Return partial answer; schedule continuation |
| scrape_url | 30s | Return empty extraction; note "scrape_timeout" |
| search_academic | 15s | Return empty; try alternative API |
| synthesize | 60s | Return raw findings without synthesis |

### 11.4 Incremental Research

For "deep" research, Sage delivers incremental results:
- **Checkpoint 1** (5 min): Preliminary answer with 5+ sources.
- **Checkpoint 2** (15 min): Expanded answer with 10+ sources.
- **Checkpoint 3** (30 min): Final synthesis with 20+ sources.

Each checkpoint is a valid deliverable; downstream agents can begin work with checkpoint 1.

## 12. Anti-Patterns

### 12.1 Do Not: Present Speculation as Fact

If sources say "Company X may IPO in 2027," do not write "Company X is going public in 2027." Use hedging language appropriate to the confidence level.

### 12.2 Do Not: Scrape Without robots.txt Check

Always check `robots.txt` before scraping. If a page is disallowed, use search engine snippets instead. Ethical scraping is non-negotiable.

### 12.3 Do Not: Use Sage for Simple Enrichment

"Find the CEO's email" is a Forge task. "Understand the CEO's strategic priorities" is a Sage task. Don't use deep research for structured data lookups.

### 12.4 Do Not: Ignore Date Context

A 2023 article about a company's growth plans may be completely irrelevant in 2026. Always check publication dates and flag stale sources.

### 12.5 Do Not: Cite Only One Source for Critical Claims

If you're making a claim that will be used in outreach (e.g., "Company X just raised $50M"), verify with at least 2 sources. A single blog post could be wrong.

### 12.6 Do Not: Auto-Translate Without Disclosure

If you auto-translate a non-English source, always disclose the original language. Translations can lose nuance, especially with technical or industry-specific terms.

## 13. Output Schema Deep Dive

### 13.1 research_question Output

```yaml
question: "How is Acme Corp planning to use their Series B funding?"
depth: "standard"
answer: |
  Acme Corp plans to allocate their $45M Series B funding across three strategic areas:
  1. International expansion into EMEA and APAC markets [1][2]
  2. Doubling the engineering team from 50 to 100 by Q4 2026 [1][3]
  3. Building a new enterprise sales team, with 8 SDR hires planned [2][4]

  CEO John Doe stated the company aims to reach $50M ARR by end of 2027 [1].

citations:
  - id: 1
    url: "https://techcrunch.com/2026/05/15/acme-series-b"
    snippet: "Acme Corp CEO John Doe said the funding will go toward international expansion and doubling the engineering headcount."
    date: "2026-05-15"
    source: "TechCrunch"
    tier: 1
  - id: 2
    url: "https://venturebeat.com/2026/05/16/acme-funding-analysis"
    snippet: "The company plans to hire 8 SDRs for its new enterprise sales motion and expand into EMEA and APAC."
    date: "2026-05-16"
    source: "VentureBeat"
    tier: 2
  - id: 3
    url: "https://acme.com/blog/series-b"
    snippet: "We're growing our engineering team from 50 to 100 by the end of the year."
    date: "2026-05-15"
    source: "Company Blog"
    tier: 3
  - id: 4
    url: "https://linkedin.com/jobs/acme-sdr"
    snippet: "3 SDR positions currently open at Acme Corp"
    date: "2026-06-01"
    source: "LinkedIn"
    tier: 2

confidence: 85
confidence_breakdown:
  source_agreement: 90
  source_tier_average: 75
  source_freshness: 95
  source_count_adequacy: 80

follow_up_questions:
  - "Which specific EMEA markets is Acme targeting first?"
  - "Who is leading the new enterprise sales team?"
  - "What is Acme's current ARR?"

research_metadata:
  sources_consulted: 12
  sources_used: 4
  sources_rejected: 8
  rejection_reasons:
    - "stale_data: 4 sources > 180 days old"
    - "paywalled: 2 sources behind paywall"
    - "low_quality: 2 sources were AI-generated content"
  research_duration_seconds: 245
  depth_requested: "standard"
  depth_achieved: "standard"
```

**Confidence Breakdown Field Specifications**:

| Field | Range | Calculation |
|-------|-------|-------------|
| source_agreement | 0–100 | % of sources that agree on core claims |
| source_tier_average | 0–100 | Weighted average of source tiers (Tier 1=100, Tier 2=75, Tier 3=50, Tier 4=25) |
| source_freshness | 0–100 | % of sources within 90 days |
| source_count_adequacy | 0–100 | Met minimum source count for depth level |

### 13.2 scrape_url Output

```yaml
url: "https://acme.com/about"
requested_schema:
  - field: "founded_year"
    type: "integer"
  - field: "leadership_team"
    type: "array"
  - field: "mission_statement"
    type: "string"

extracted:
  founded_year: 2019
  leadership_team:
    - name: "John Doe"
      title: "CEO"
    - name: "Jane Smith"
      title: "VP of Sales"
    - name: "Bob Johnson"
      title: "CTO"
  mission_statement: "Making sales intelligence accessible to every team."

extraction_confidence: 90
extraction_method: "structured_html"  # structured_html | llm_extraction | raw_text
scrape_metadata:
  response_code: 200
  content_type: "text/html"
  content_length_bytes: 45230
  render_method: "server_side"          # server_side | client_side_js
  scrape_duration_ms: 1200
  language: "en"
```

### 13.3 search_academic Output

```yaml
query: "AI-powered lead scoring accuracy B2B"
results:
  - title: "Improving B2B Lead Scoring with Machine Learning"
    authors: ["Zhang, W.", "Patel, R."]
    abstract: "This paper evaluates ML-based lead scoring models against traditional BANT frameworks..."
    url: "https://doi.org/10.1234/example"
    publication_date: "2025-11-15"
    venue: "Journal of Marketing Analytics"
    citation_count: 24
    relevance_score: 88
    tier: 1
total_results: 47
```

### 13.4 synthesize Output

```yaml
synthesis_id: "synth_abc123"
input_findings_count: 5
synthesized_answer: |
  Based on research across 5 lines of inquiry, Acme Corp is in a high-growth phase:
  [consolidated narrative with inline citations]
consolidated_citations:
  - id: 1
    url: "https://techcrunch.com/2026/05/15/acme-series-b"
    snippet: "..."
    date: "2026-05-15"
    tier: 1
  - id: 2
    url: "https://venturebeat.com/2026/05/16/acme-funding-analysis"
    snippet: "..."
    date: "2026-05-16"
    tier: 2
overall_confidence: 82
conflicts_found: 1
conflicts:
  - claim: "Acme's ARR"
    source_a: { value: "$30M", url: "source_a" }
    source_b: { value: "$25M", url: "source_b" }
    resolution: "Reported as range $25M–$30M due to source discrepancy"
gaps_identified:
  - "No data found on customer count or churn rate"
