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
