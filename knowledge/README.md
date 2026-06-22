# LeadReach Knowledge Base

> Industry-graded knowledge base for the LeadReach 8-agent pipeline (Atlas → Scout → Forge → Sage → Judge → Bard → Flow → Echo).

This directory contains domain knowledge, regional playbooks, tool definitions, training data, and machine-generated gap reports. Every file is plain Markdown so it can be:

1. **Read by humans** — sales engineers, ops, founders can review and edit.
2. **Indexed by the retrieval layer** — see `src/lib/knowledge/` for the BM25 + optional embeddings retriever.
3. **Surfaced in the UI** — the `/knowledge` admin page reads this directory tree verbatim.

## Directory Layout

```
knowledge/
├── README.md                  ← you are here
├── MANIFEST.json              ← machine-readable index of every doc
├── industries/                ← vertical-specific intelligence
│   ├── saas-b2b.md
│   ├── fintech.md
│   ├── healthtech.md
│   ├── ecommerce-dtc.md
│   ├── manufacturing.md
│   ├── dev-tools.md           ← added 2026-06
│   ├── cybersecurity.md       ← added 2026-06
│   ├── ai-infrastructure.md   ← added 2026-06
│   └── ...
├── regions/                   ← geographic + regulatory playbooks
│   ├── us.md
│   ├── eu-gdpr.md
│   ├── uk.md
│   ├── apac-singapore.md
│   ├── canada.md              ← added 2026-06
│   ├── dach.md                ← added 2026-06
│   └── ...
├── playbooks/                 ← how-to playbooks for each agent + scenario
│   ├── outbound-cold-email.md
│   ├── icp-discovery.md
│   ├── multi-threaded-selling.md
│   ├── inbound-lead-routing.md  ← added 2026-06
│   ├── churn-recovery.md        ← added 2026-06
│   └── ...
├── tools/                     ← tool/agent capability manifests
│   ├── atlas.md
│   ├── scout.md
│   ├── forge.md
│   ├── sage.md
│   ├── judge.md
│   ├── bard.md
│   ├── flow.md
│   └── echo.md
├── training-data/             ← curated few-shot examples for each agent
│   ├── atlas-decomposition.jsonl
│   ├── scout-prospect-discovery.jsonl
│   ├── forge-enrichment.jsonl
│   ├── sage-research.jsonl
│   ├── judge-qualification.jsonl
│   ├── bard-outreach.jsonl
│   ├── flow-pipeline.jsonl
│   └── echo-report.jsonl
└── gap-reports/               ← monthly Echo-generated gap analysis
    └── YYYY-MM-gap-report.md
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run knowledge:reindex` | Reload the in-memory index from disk (use after adding/editing docs) |
| `npm run knowledge:gap` | Generate (or refresh) the monthly Echo gap report |
| `npm run knowledge:embeddings` | Pre-compute Z.AI embedding-3 vectors for all chunks and persist to `.knowledge-embeddings.cache.json` |

## Editing Conventions

- **File naming**: `kebab-case.md`. Industry files: `<industry>.md`. Region files: `<iso-code-or-region>.md`.
- **Front matter**: every Markdown file MUST start with a YAML block containing at least `title`, `category`, `tags`, `last_reviewed` (ISO date).
- **Links**: use relative links to other knowledge files. The retriever will follow them.
- **Length**: aim for 800–2000 words per industry/region doc. Shorter docs should be merged; longer docs should be split.

## Adding a New Document

1. Create the file in the appropriate subdirectory.
2. Add the YAML front matter.
3. Append an entry to `MANIFEST.json` (or run `npm run knowledge:reindex`).
4. Run `npm run knowledge:gap` to regenerate the gap report — your new doc may close existing gaps or open new ones.
5. (Optional) If `USE_KNOWLEDGE_EMBEDDINGS=true` is set, run `npm run knowledge:embeddings` to pre-compute embeddings for the new doc.

## Semantic Embeddings (Optional)

When `USE_KNOWLEDGE_EMBEDDINGS=true` is set in `.env`, the knowledge index uses Z.AI's `embedding-3` model to pre-compute a 2048-dimensional vector for every chunk. At query time, the system:

1. Generates a query embedding via the same model (single API call).
2. Computes cosine similarity against pre-cached chunk embeddings.
3. Combines BM25 (40%) with cosine similarity (60%) for a hybrid retrieval score.

This significantly improves recall on paraphrased queries (e.g., "how do we handle churn?" matches `churn-recovery.md` even if the doc doesn't use the word "handle"). The cache is persisted to `.knowledge-embeddings.cache.json` (gitignored) and survives restarts.

To enable:
1. Set `USE_KNOWLEDGE_EMBEDDINGS=true` and `ZHIPU_API_KEY` in `.env`
2. Run `npm run knowledge:embeddings` to pre-compute (~2-3 seconds per batch of 16 chunks)
3. Restart the server — the cache loads automatically on first query

## Industry Grade

Each industry doc is graded against the following rubric. A grade of `B` or higher is required for production use; `C` or lower triggers an Echo gap-report entry.

| Grade | Criteria |
|-------|----------|
| **A** | Covers ICP signals, top 20 accounts, decision-maker titles, buying triggers, objections, channels, regulatory notes, regional variants. |
| **B** | Covers ICP signals, top 10 accounts, decision-maker titles, buying triggers, objections. |
| **C** | Missing two or more B-grade items. |
| **D** | Stub or placeholder. |

The current grade is recorded in each file's front matter as `grade`.

## License

Proprietary. See the project root `LICENSE` file.

