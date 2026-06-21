# LeadReach Knowledge Base

> A **RAG (Retrieval-Augmented Generation) layer** that gives every LeadReach LLM agent access to institutional-grade B2B lead generation expertise, without requiring it all to be in the LLM's training data.

## What This Is

The `/knowledge` directory contains **30+ structured knowledge documents** authored by LeadReach Knowledge Engineering. Each document is a Markdown file with YAML frontmatter, indexed by the LeadReach knowledge loader, and retrieved at runtime by the 8 agents (Atlas, Scout, Forge, Sage, Judge, Bard, Flow, Echo) based on the user's query, detected industry, region, and intent.

**Stats**:
- 30 documents
- 60K+ words / 107K+ tokens of curated expertise
- 9 categories: domain, industries, regions, agents, tools, playbooks, templates, datasets, compliance
- Average retrieval latency: **7ms** (cached in-memory after first load)
- Indexed via TF-IDF with cosine similarity + tag/category matching

## Directory Structure

```
knowledge/
├── domain/                    # B2B lead gen theory & methodology
│   ├── b2b-lead-generation-core-theory.md
│   ├── icp-design-scoring-methodology.md
│   ├── lead-qualification-frameworks.md
│   ├── outreach-methodology-cold-email-sequences.md
│   ├── data-enrichment-methodology.md
│   └── trigger-events-detection-timing.md
├── industries/                # Industry-specific prospecting guides
│   ├── saas.md
│   ├── agriculture-food-trade.md
│   ├── manufacturing.md
│   ├── financial-services.md
│   ├── healthcare-life-sciences.md
│   ├── ecommerce-retail.md
│   └── real-estate-construction.md
├── regions/                   # Regional B2B prospecting guides
│   ├── vietnam.md
│   ├── united-states.md
│   └── european-union.md
├── agents/                    # Per-agent training manuals
│   ├── atlas.md               # Strategic Orchestrator
│   ├── scout.md               # Discovery & Prospecting
│   ├── forge.md               # Data Enrichment
│   ├── sage.md                # Intelligence Analysis
│   ├── judge.md               # Lead Qualification
│   ├── bard.md                # Outreach Composition
│   ├── flow.md                # Pipeline Orchestration
│   └── echo.md                # Insights & Reporting
├── tools/                     # Data source & tool documentation
│   └── data-sources-catalog.md
├── playbooks/                 # End-to-end playbooks for common scenarios
│   ├── find-suppliers-in-country.md
│   └── research-specific-company.md
├── templates/                 # Prompt templates & output schemas
│   └── prompt-schemas.md
├── datasets/                  # Few-shot examples for training
│   └── few-shot-examples.md
└── compliance/                # Legal & regulatory compliance
    └── global-regulations.md
```

## How It Works

### 1. Authoring

Knowledge files are **Markdown with YAML frontmatter**:

```markdown
---
title: "SaaS Industry — Prospecting Guide"
slug: industry-saas
category: industries
tags: [saas, software, b2b, recurring-revenue, cloud]
agents: [atlas, scout, forge, sage, judge, bard]
industries: [saas, software, b2b-software, cloud]
intent_types: [research_company, build_icp, compose_outreach]
priority: 88
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "Complete prospecting intelligence for SaaS..."
---

# SaaS Industry — Prospecting Guide

[Content here...]
```

The frontmatter enables the loader to:
- Filter by category, industry, region, intent, agent
- Weight by priority (0-100)
- Track version and last-updated date
- Provide a summary for the index

### 2. Indexing

On first access, the loader (`src/lib/knowledge/loader.ts`):
1. Discovers all `.md` files in `/knowledge` recursively
2. Parses YAML frontmatter (custom parser, no dependencies)
3. Tokenizes body text (lowercase, split, remove stopwords)
4. Computes TF-IDF index (term frequency × inverse document frequency)
5. Caches the index in memory for the process lifetime

### 3. Retrieval

When an agent needs knowledge, it calls `retrieveContextForAgent()`:

```typescript
const result = retrieveContextForAgent({
  agent: 'atlas',
  userQuery: 'dragonfruit suppliers in Vietnam',
  industries: ['agriculture'],
  regions: ['vietnam'],
  intent_types: ['research_company', 'discover_places'],
  topK: 4,
  maxTokens: 3000,
});
```

The retrieval algorithm:
1. **Hard filters**: agent, category, industry, region, intent (docs that don't match are excluded)
2. **TF-IDF cosine similarity**: between query tokens and document tokens (weight: 50%)
3. **Tag overlap**: bonus for tag matches (weight: 25%)
4. **Priority boost**: docs with higher frontmatter priority get a small boost (weight: 25%)
5. **Token-budget truncation**: docs are added until maxTokens is reached, with smart truncation

### 4. Injection

The retrieved knowledge is formatted as a prompt section:

```
============================================================
RETRIEVED KNOWLEDGE BASE (use as authoritative context)
============================================================

The following 3 knowledge document(s) were retrieved from the LeadReach
knowledge base as most relevant to the current task for the ATLAS agent.
Treat these as authoritative guidance — they encode institutional best
practices, industry-specific patterns, regional norms, and proven
playbooks.

### Agriculture & Food Trade — Prospecting Guide
> category: industries | priority: 88 | relevance: 55% | matched on: ...
> source: industries/agriculture-food-trade.md

[Document content here...]

### Vietnam — Business Landscape & B2B Prospecting Guide
> ...

[Document content here...]

============================================================
END OF RETRIEVED KNOWLEDGE
============================================================
```

This section is injected into the agent's system prompt, giving the LLM authoritative context for its response.

## Integration Points

The knowledge base is integrated into:

### 1. Intent Classification (`src/lib/prospect-agent/intents.ts`)
When a user query comes in, the intent classifier pulls 2 relevant knowledge docs (small budget — fast path) and injects them into the classification prompt. This improves classification accuracy for industry-specific queries (e.g., "dragonfruit suppliers" gets classified as `discover_places` with `agriculture` industry context).

### 2. Master System Prompt (`src/lib/prospect-agent/prompts.ts`)
The new `getMasterSystemPromptWithKnowledge()` function wraps the original master prompt with retrieved knowledge. Used for high-stakes LLM calls where deeper context matters.

### 3. Per-Agent Prompts (`src/lib/knowledge/integration.ts`)
The `getKnowledgeContextForPipeline()` function pre-computes knowledge context for an entire pipeline run, then slices it per-agent. This avoids 8 separate retrievals.

### 4. API Endpoint (`/api/knowledge`)
REST API for inspecting the knowledge base:
- `GET /api/knowledge?action=stats` — knowledge base statistics
- `GET /api/knowledge?action=search&q=<query>` — search the knowledge base
- `GET /api/knowledge?action=list&category=<cat>` — list documents
- `GET /api/knowledge?action=document&slug=<slug>` — get a specific document
- `POST /api/knowledge { action: "reload" }` — re-index (admin)

## Authoring Guidelines

### When to Add a New Knowledge File

Add a new file when:
- A user query pattern repeatedly retrieves low-relevance knowledge (<30%)
- A new industry vertical is needed (e.g., cybersecurity, education)
- A new region is needed (e.g., Brazil, India, Japan)
- A new tool/data source is added to the platform
- A new compliance framework becomes relevant

### Frontmatter Rules

| Field | Required | Description |
|-------|----------|-------------|
| `title` | ✅ | Human-readable title |
| `slug` | ✅ | Kebab-case unique identifier |
| `category` | ✅ | One of: domain, industries, regions, agents, tools, playbooks, templates, datasets, compliance |
| `tags` | ✅ | Array of lowercase keywords for tag-match scoring |
| `agents` | ✅ | Array of agent names this doc is relevant to (atlas, scout, forge, sage, judge, bard, flow, echo) |
| `industries` | Optional | Array of industry identifiers |
| `regions` | Optional | Array of region identifiers |
| `intent_types` | Optional | Array of intent types |
| `priority` | ✅ | 0-100, higher = more important (boosts retrieval score) |
| `version` | ✅ | Integer version number, increment on updates |
| `updated` | ✅ | ISO date (YYYY-MM-DD) |
| `author` | Optional | Author name |
| `summary` | Optional | 1-2 sentence summary for the index |

### Content Standards

1. **Lead with the takeaway** — first paragraph should answer "what will I learn?"
2. **Use concrete examples** — every concept should have a real-world example
3. **Cite sources** — for factual claims (especially regulatory/compliance)
4. **Include output schemas** — when describing agent outputs, include TypeScript interfaces
5. **Avoid fluff** — every sentence should add value; cut filler
6. **Use industry vocabulary correctly** — see the vocabulary section in each industry file
7. **Respect compliance** — never recommend data collection that violates GDPR/HIPAA/etc.

### File Naming

- `industry-<name>.md` for industries (e.g., `industry-saas.md`)
- `region-<name>.md` for regions (e.g., `region-vietnam.md`)
- `agent-<name>-training.md` for agents (e.g., `agent-atlas-training.md`)
- `playbook-<scenario>.md` for playbooks (e.g., `playbook-find-suppliers-in-country.md`)
- `<topic>-methodology.md` for domain expertise (e.g., `icp-design-scoring-methodology.md`)

### Length Guidelines

| Document Type | Target Word Count |
|--------------|------------------|
| Agent training | 1500-2500 words |
| Industry guide | 1500-2500 words |
| Region guide | 2000-3000 words |
| Domain methodology | 1500-2500 words |
| Playbook | 1500-2500 words |
| Compliance | 2500-3500 words |
| Templates/schemas | 2500-3500 words |

Longer is acceptable if the content is high-value. Avoid padding to hit word counts.

## Testing

### Smoke Test
```bash
npx tsx scripts/knowledge/test-loader.ts
```
Verifies:
- All documents load and parse correctly
- TF-IDF index builds without errors
- Retrieval works for sample queries
- Cache management works

### Integration Test
```bash
npx tsx scripts/knowledge/test-integration.ts
```
Verifies:
- `retrieveContextForAgent()` works
- `getKnowledgeContextForPipeline()` works
- `getMasterSystemPromptWithKnowledge()` works
- Graceful degradation when knowledge base is empty
- Performance benchmarks

## API Reference

### `retrieveKnowledge(query: RetrievalQuery): RetrievedDocument[]`
Low-level retrieval. Filters by agent/category/industry/region/intent/tags, then ranks by TF-IDF + tag match + priority.

### `retrieveForAgent(agent, userQuery, context): RetrievedDocument[]`
Convenience wrapper for agent-specific retrieval.

### `buildKnowledgePromptSection(agent, userQuery, context): string`
Returns a formatted prompt section ready to inject into an LLM system prompt.

### `retrieveContextForAgent(context: AgentContext): KnowledgeContextResult`
Returns both the prompt section and metadata (retrieval stats, document count).

### `augmentSystemPrompt(originalPrompt, context): { prompt, knowledgeUsed, stats }`
Takes an existing system prompt and injects knowledge at an appropriate insertion point.

### `getKnowledgeContextForPipeline(userQuery, context): { perAgent, documents, retrieved, stats }`
Pre-computes knowledge context for an entire pipeline run, sliced per-agent.

### `isKnowledgeAvailable(): boolean`
Quick check if the knowledge base is loaded.

### `getKnowledgeSummary(): string`
Human-readable summary of the knowledge base.

### `getKnowledgeStats(): { totalDocuments, byCategory, totalTokens, totalWords, indexedAt }`
Detailed statistics for monitoring and debugging.

### `clearKnowledgeCache(): void`
Clears the in-memory index cache. Next retrieval will re-index from disk.

## Performance

- **Cold start** (first retrieval): ~50-100ms (index build)
- **Warm retrieval** (subsequent): 5-15ms average
- **Memory footprint**: ~5MB for 30 docs (tokens + TF-IDF vectors)
- **No external dependencies**: pure TypeScript, no embedding model, no vector DB

## Maintenance

### Monthly Tasks
1. Run the smoke test to verify all docs still parse
2. Review `updated` dates — any docs >6 months old should be reviewed
3. Check the Echo agent's monthly knowledge gap report
4. Update industry/region docs with new data sources or regulatory changes

### Quarterly Tasks
1. Review retrieval relevance — are top-3 results actually relevant for sample queries?
2. Add new industry/region docs based on user query patterns
3. Update priority scores based on actual usage (frequently-retrieved docs get higher priority)
4. Prune outdated docs (those never retrieved in 90 days)

### Annual Tasks
1. Full audit of compliance docs (regulations change)
2. Full audit of industry docs (industry landscapes shift)
3. Version-bump all docs (increment `version` field)
4. Review and update authoring guidelines

## Contribution

To add a new knowledge document:

1. **Choose the category** (domain, industries, regions, agents, tools, playbooks, templates, datasets, compliance)
2. **Check for existing docs** — don't duplicate; extend if possible
3. **Author the doc** following the frontmatter rules and content standards above
4. **Save to** `/knowledge/<category>/<slug>.md`
5. **Run the smoke test**: `npx tsx scripts/knowledge/test-loader.ts`
6. **Verify retrieval**: `curl 'http://localhost:3000/api/knowledge?action=search&q=<your-test-query>'`
7. **Commit** with message: `knowledge: add <slug>`

### Reviewer Checklist

Before merging a new knowledge document:
- [ ] Frontmatter is complete and valid
- [ ] Content meets length guidelines
- [ ] No compliance violations (no PHI, no special category data)
- [ ] Sources cited for factual claims
- [ ] Output schemas match actual platform types
- [ ] Smoke test passes
- [ ] Manual retrieval test passes (search returns the new doc for relevant queries)

## Troubleshooting

### "No knowledge documents found"
- Verify `/knowledge` directory exists at project root
- Check file permissions (must be readable by Next.js process)
- Verify file extensions are `.md` or `.markdown`

### "Retrieval returns nothing relevant"
- Check the frontmatter `agents` field — your agent must be listed
- Check the frontmatter `industries` / `regions` / `intent_types` filters
- Lower `minScore` (default 0.05 — try 0.03)
- Increase `topK` (default 5 — try 10)
- Verify the query terms appear in the doc body

### "Retrieval is slow"
- First retrieval builds the index (~50-100ms) — subsequent are 5-15ms
- If still slow, check memory pressure (index is ~5MB)
- Consider increasing cache TTL (currently process-lifetime)

### "YAML frontmatter not parsing"
- Must start with `---` on line 1
- Must end with `---` on its own line
- Inline arrays `[a, b, c]` are supported
- Multi-line arrays (with `- item`) are supported
- Strings with `:` must be quoted: `title: "My: Title"`

## Future Enhancements

- **Semantic embeddings**: Replace TF-IDF with embedding-based similarity (OpenAI, Cohere, or local model)
- **Vector DB**: Store embeddings in pgvector or Pinecone for larger knowledge bases
- **Auto-update**: Automatically refresh docs from external sources (e.g., regulatory changes)
- **A/B testing**: Test knowledge-augmented vs. non-augmented prompts
- **Knowledge graph**: Link related docs (e.g., SaaS industry → ICP methodology → Outreach templates)
- **Multi-language**: Author docs in multiple languages; retrieve based on user's language
- **Citations in LLM output**: Require LLM to cite which knowledge docs informed its response

## License

Copyright © 2026 LeadReach AI. All rights reserved.

This knowledge base is internal to LeadReach and not for external distribution.
