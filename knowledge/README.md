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
│   └── ...
├── regions/                   ← geographic + regulatory playbooks
│   ├── us.md
│   ├── eu-gdpr.md
│   ├── uk.md
│   ├── apac-singapore.md
│   └── ...
├── playbooks/                 ← how-to playbooks for each agent + scenario
│   ├── outbound-cold-email.md
│   ├── icp-discovery.md
│   ├── multi-threaded-selling.md
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
