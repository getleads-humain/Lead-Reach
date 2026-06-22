# Knowledge Base Contribution Guide

> How to author, review, and maintain knowledge documents for the LeadReach platform.

## Quick Start

1. **Read** `knowledge/README.md` to understand the architecture
2. **Pick a template** from below based on document type
3. **Author** the document following the standards
4. **Test** with `npx tsx scripts/knowledge/test-loader.ts`
5. **Submit** for review

## Document Templates

### Template: Industry Guide

```markdown
---
title: "[Industry Name] — Prospecting Guide, Signals, and Buyer Personas"
slug: industry-<kebab-case-name>
category: industries
tags: [<industry>, <sub-industry>, b2b, prospecting]
agents: [atlas, scout, forge, sage, judge, bard]
industries: [<industry>, <related-industries>]
intent_types: [research_company, build_icp, compose_outreach]
priority: 85
version: 1
updated: YYYY-MM-DD
author: Your Name
summary: "One-line summary of what this guide covers."
---

# [Industry Name] — Prospecting Guide

## 1. Industry Overview
[2-3 paragraphs: industry size, key dynamics, why this matters]

## 2. Sub-Segments
[Break down the industry into 3-5 sub-segments with different dynamics]

## 3. Buyer Personas
[3-5 personas: role, what they care about, pain points, outreach angle]

## 4. Technographic Signals
[What tech stack patterns suggest about the prospect]

## 5. Trigger Events
[Industry-specific trigger events to watch for]

## 6. Industry Vocabulary
[Key terms to use correctly in outreach]

## 7. Data Sources
[Industry-specific databases, associations, news sources]

## 8. Outreach Best Practices
[Industry-specific email templates, channels, cultural notes]

## 9. Compliance Considerations
[Industry-specific regulations: HIPAA, GLBA, FERPA, etc.]

## 10. Common Prospecting Mistakes
[What NOT to do when prospecting in this industry]
```

### Template: Region Guide

```markdown
---
title: "[Country/Region] — B2B Prospecting Guide"
slug: region-<kebab-case-name>
category: regions
tags: [<country>, <region>, b2b, prospecting]
agents: [atlas, scout, forge, sage, judge, bard]
regions: [<country>, <broader-region>]
industries: [<key-industries-in-region>]
intent_types: [research_company, research_person, compose_outreach]
priority: 88
version: 1
updated: YYYY-MM-DD
author: Your Name
summary: "B2B prospecting intelligence for [country/region]."
---

# [Country/Region] — B2B Prospecting Guide

## 1. Country Overview
[GDP, population, language, time zone, government, key cities]

## 2. Business Registration & Identification
[Government registries, tax IDs, corporate forms, how to verify companies]

## 3. Key Industries & Regional Hubs
[Major industries, where they're concentrated geographically]

## 4. Business Culture & Communication Norms
[Hierarchy, relationship-building, language preferences]

## 5. Trade Documentation & Compliance
[Export docs, regulators, certifications]

## 6. Channels for Finding Companies
[Local B2B marketplaces, trade associations, government directories]

## 7. Outreach Best Practices
[Channel priority, email templates, cultural tips, pricing & negotiation]

## 8. Compliance Considerations
[Local privacy laws, sanctions, anti-bribery, customs]

## 9. Common Pitfalls
[What NOT to do when prospecting in this region]

## 10. LeadReach Pipeline for [Country] Prospecting
[How the 8-agent pipeline should adapt for this region]
```

### Template: Agent Training Manual

```markdown
---
title: "[Agent Name] Agent — [Role] Training Manual"
slug: agent-<name>-training
category: agents
tags: [<agent-name>, <role>, training]
agents: [<agent-name>]
intent_types: [<relevant-intents>]
priority: 95
version: 1
updated: YYYY-MM-DD
author: LeadReach Knowledge Engineering
summary: "Operational training for the [Name] agent."
---

# [Agent Name] Agent — [Role] Training Manual

## 1. Your Identity
[Who you are, what you do, operating principles]

## 2. Your [Primary Function]
[Detailed breakdown of what this agent does]

## 3. Decision Framework
[How the agent makes decisions]

## 4. Communication Protocol
[How the agent communicates with other agents and the user]

## 5. Constraints & Guardrails
[What the agent MUST do and MUST NOT do]

## 6. Performance Metrics
[How the agent is evaluated]

## 7. Failure Modes & Recovery
[Common failures and how to recover]

## 8. Output Schema
[TypeScript interface for the agent's output]

## 9. Knowledge Retrieval
[How the agent uses the knowledge base]
```

### Template: Playbook

```markdown
---
title: "Playbook: [Scenario Name]"
slug: playbook-<kebab-case-name>
category: playbooks
tags: [playbook, <scenario-type>]
agents: [atlas, scout, forge, sage, judge, bard, flow, echo]
intent_types: [<relevant-intents>]
priority: 90
version: 1
updated: YYYY-MM-DD
author: Your Name
summary: "End-to-end playbook for [scenario]."
---

# Playbook: [Scenario Name]

## 1. When to Use This Playbook
[Trigger conditions: what user queries should activate this playbook]

## 2. Query Decomposition (Atlas)
[How Atlas should decompose queries that match this playbook]

## 3. Source Strategy (Scout)
[Which channels to search, in what order, with what queries]

## 4. Execution Plan
[Step-by-step pipeline execution with timing]

## 5. Expected Output
[What the user should see when the playbook completes]

## 6. Failure Modes & Mitigations
[What can go wrong and how to recover]

## 7. Adaptations
[How to adapt the playbook for different industries, regions, or query types]

## 8. Compliance Checklist
[What compliance requirements apply]

## 9. Success Metrics
[How to measure if the playbook run was successful]
```

## Authoring Standards

### Tone & Voice

- **Authoritative but accessible** — write like a senior expert explaining to a junior colleague
- **Specific over general** — "reduce ramp time from 6 months to 8 weeks" beats "improve sales efficiency"
- **Active voice** — "Scout searches 7+ channels" not "7+ channels are searched by Scout"
- **Second person for agents** — "You are Scout. Your job is..."
- **Third person for users** — "The user wants to find..."

### Structural Rules

- **Lead with the takeaway** — first paragraph answers "what will I learn?"
- **Use H2 (##) for major sections** — H1 is reserved for the title
- **Use H3 (###) for sub-sections** — don't go deeper than H4
- **Tables for structured data** — comparisons, scoring rubrics, etc.
- **Code blocks for schemas** — TypeScript interfaces, JSON examples
- **Bold for key terms** — first occurrence of important concepts

### Content Rules

- **Every concept has an example** — don't just explain, demonstrate
- **Cite sources** for factual claims — especially regulatory/compliance
- **Include failure modes** — what goes wrong, how to recover
- **Avoid jargon** unless the target audience uses it — define on first use
- **No marketing fluff** — "industry-leading", "cutting-edge", "best-in-class" are banned
- **No emojis** in formal content (allowed in casual examples)

### Length Guidelines

| Document Type | Target Word Count | Max |
|--------------|------------------|-----|
| Agent training | 1500-2500 | 3500 |
| Industry guide | 1500-2500 | 3500 |
| Region guide | 2000-3000 | 4500 |
| Domain methodology | 1500-2500 | 3500 |
| Playbook | 1500-2500 | 3500 |
| Compliance | 2500-3500 | 5000 |
| Templates/schemas | 2500-3500 | 5000 |

**Longer is acceptable if content is high-value.** Padding to hit word counts is forbidden.

### Compliance Rules

**Never** include in knowledge docs:
- Personal data of real individuals (use fictional names like "Sarah Chen at Acme Corp")
- Customer-specific information
- Internal company financials
- API keys, passwords, credentials
- Proprietary competitor intelligence

**Always** include:
- Regulatory citations (GDPR Article X, CAN-SPAM Section Y)
- Source URLs for factual claims
- Compliance warnings for high-risk activities
- "Consult legal counsel" disclaimers for legal advice

## Review Checklist

Before submitting a knowledge document for review:

### Frontmatter
- [ ] `title` is human-readable and descriptive
- [ ] `slug` is kebab-case and unique
- [ ] `category` is one of the 9 valid categories
- [ ] `tags` array has 3-8 relevant lowercase tags
- [ ] `agents` array lists all relevant agents
- [ ] `industries` / `regions` / `intent_types` arrays are populated if relevant
- [ ] `priority` is 0-100, calibrated to other docs in same category
- [ ] `version` is 1 (new) or incremented (update)
- [ ] `updated` is today's date (YYYY-MM-DD)
- [ ] `summary` is 1-2 sentences

### Content
- [ ] First paragraph answers "what will I learn?"
- [ ] Every concept has a concrete example
- [ ] No marketing fluff
- [ ] No banned words ("cutting-edge", "best-in-class", etc.)
- [ ] Sources cited for factual claims
- [ ] Failure modes documented
- [ ] Output schemas match actual platform types
- [ ] No personal data of real individuals
- [ ] No proprietary information

### Technical
- [ ] File saved to `/knowledge/<category>/<slug>.md`
- [ ] Smoke test passes: `npx tsx scripts/knowledge/test-loader.ts`
- [ ] Manual retrieval test: query the doc via API and verify it appears in results
- [ ] No TypeScript errors in code blocks (if any)
- [ ] No JSON syntax errors in examples (if any)

## Submission Process

1. **Author** the document in a branch: `knowledge/add-<slug>`
2. **Self-review** against the checklist above
3. **Run tests**: `npx tsx scripts/knowledge/test-loader.ts && npx tsx scripts/knowledge/test-integration.ts`
4. **Open PR** with:
   - Title: `knowledge: add <slug>`
   - Description: Summary of what the doc covers and why it's needed
   - Link to any relevant user query patterns that motivated the doc
5. **Address review feedback**
6. **Merge** after approval

## Update Process

When updating an existing document:

1. **Increment `version`** (e.g., 1 → 2)
2. **Update `updated`** date
3. **Add a changelog entry** at the bottom of the doc:
   ```markdown
   ## Changelog
   - v2 (2026-06-22): Added section on APAC expansion; updated regulatory citations
   - v1 (2026-04-15): Initial version
   ```
4. **Run tests** to verify no regressions
5. **Submit PR** with title: `knowledge: update <slug>`

## Deprecation Process

If a document is no longer relevant:

1. **Add a deprecation notice** at the top:
   ```markdown
   > ⚠️ **DEPRECATED**: This document is no longer maintained. See [new doc] instead.
   ```
2. **Keep the file** for 90 days (in case of rollback)
3. **After 90 days**, delete the file
4. **Run tests** to verify no retrieval breaks
5. **Submit PR** with title: `knowledge: deprecate <slug>`

## Quality Metrics

Knowledge documents are evaluated on:

### Retrieval Metrics
- **Retrieval frequency**: How often is this doc retrieved? (target: >10/month for active docs)
- **Retrieval relevance**: When retrieved, is it actually useful? (measured by downstream agent performance)
- **Click-through rate**: When surfaced in UI, do users click to read? (if applicable)

### Content Metrics
- **Freshness**: Updated within last 6 months?
- **Completeness**: All required sections present?
- **Accuracy**: Sample-check factual claims — still accurate?
- **Source validity**: All cited URLs still resolve?

### Usage Metrics
- **Agent satisfaction**: Does the agent use the knowledge in its response? (measured by LLM evaluation)
- **User outcomes**: Does the knowledge help the user complete their task? (measured by user feedback)

Documents that fail metrics for 90 days are flagged for review or deprecation.
