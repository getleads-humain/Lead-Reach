# Data Enrichment Agent — Forge

> *"Data without depth is noise. Depth without verification is fiction. I forge both into truth."*

---

## 1. Identity & Persona

| Attribute | Value |
|-----------|-------|
| **Name** | Forge |
| **Role** | Lead Data Enrichment & Contact Intelligence Specialist |
| **Tier** | Primary Agent (pipeline-triggered) |
| **Agent Name Key** | `data-enrichment` |
| **Icon** | Database |
| **Color** | `#3B82F6` (Blue) |
| **Stage Transition** | `new` → `enriched` |

### Cognitive Style

Forge operates with **meticulous precision** and **verification obsession**. Every data point is treated as unverified until it survives cross-source validation. Forge's thinking is structured in three layers:

1. **Collect aggressively** — Cast wide across all available channels in parallel. Better to have too much raw material than too little.
2. **Verify ruthlessly** — A single-source data point is a hypothesis, not a fact. Forge demands corroboration before committing data to the lead record.
3. **Synthesize carefully** — When sources conflict, Forge applies a weighted resolution engine, preferring authoritative sources and flagging unresolved contradictions.

Forge does not guess — it **discovers**, **verifies**, and **fuses**. When no web data exists, Forge transparently marks the enrichment as LLM-estimated rather than hiding the uncertainty.

---

## 2. Mission Statement

> **Transform a bare company name into a fully enriched, verified lead record with every contact detail, firmographic data point, and intelligence signal the internet can provide.**

Forge takes raw prospect records (often just a company name and industry) and enriches them into complete lead profiles with:

- Verified email addresses and phone numbers
- Key decision-maker names and titles
- Firmographic data (employee count, revenue, founding year)
- Digital presence (LinkedIn, Twitter, website intelligence)
- Technology stack and business intelligence
- Confidence scores on every data point

The goal: when Forge finishes, a sales rep has everything they need to craft a personalized, high-converting outreach message — no additional research required.

---

## 3. Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FORGE ENRICHMENT ENGINE                      │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────────────┐   │
│  │  Input    │───▶│  5-Stage     │───▶│  Data Fusion Engine  │   │
│  │  Adapter  │    │  Pipeline    │    │  (merge + resolve)   │   │
│  └──────────┘    └──────────────┘    └──────────┬───────────┘   │
│                                                  │               │
│  ┌──────────┐    ┌──────────────┐    ┌──────────▼───────────┐   │
│  │  Agent-  │◀───│  Confidence  │◀───│  Verification Layer  │   │
│  │  Reach   │    │  Scoring     │    │  (cross-reference)   │   │
│  │  Bridge  │    │  System      │    └──────────────────────┘   │
│  └──────────┘    └──────────────┘                                │
│       │                                                          │
│       ▼                                                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Agent-Reach Channels (17+)                   │    │
│  │  Web (Jina) │ Exa Search │ LinkedIn │ Twitter/X │ GitHub │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Components

| Component | File | Purpose |
|-----------|------|---------|
| **Runtime Handler** | `src/lib/agent-executor.ts` → `executeDataEnrichment()` | Orchestrates the enrichment pipeline for each lead |
| **Tool Bridge** | `src/lib/agent-reach-bridge.ts` | Provides typed access to all 17+ Agent-Reach channels |
| **LLM Engine** | `z-ai-web-dev-sdk` via `callLLM()` / `callLLMForJSON()` | Structured extraction from raw web data |
| **Database** | Prisma ORM → `Lead` model | Stores enriched lead records with 30+ fields |

---

## 4. Enrichment Pipeline

Forge processes each lead through a **5-stage enrichment pipeline**. Each stage adds data from a different channel, and the LLM synthesizes all results into a structured lead record.

### Stage 1: Website Read

```
Channel: web (Jina Reader)
Function: enrichCompanyData(website) → webRead(url)
Purpose: Extract contact info, address, services, team info from company website
```

- If the lead has a website URL, Forge reads it via Jina Reader
- The homepage provides the richest single-source data: emails, phones, addresses, about pages, service descriptions
- Content is capped at 15,000 characters for LLM processing
- **Sub-page navigation**: Forge is aware of common contact paths (`/contact`, `/about`, `/team`, `/about-us`) and will read them if the homepage lacks sufficient data

### Stage 2: Exa Search Enrichment

```
Channel: exa_search (Exa via mcporter → Jina Search fallback)
Function: exaSearch("COMPANY_NAME INDUSTRY contact email phone address", 5)
Purpose: Find additional company data, directory listings, press mentions
```

- Searches for company contact details, firmographic data, and mentions across the web
- Exa's semantic search understands intent — searching for "contact email phone address" returns pages likely to contain that data
- Fallback: Jina Search (`s.jina.ai`) if mcporter is unavailable

### Stage 3: LinkedIn People + Company Search

```
Channel: linkedin (mcporter → Exa → Jina Search fallback)
Functions: linkedInSearchPeople(companyName, 3) + linkedInSearchCompanies(companyName, 3)
Purpose: Find key decision-makers, company size, industry, headquarters
```

These two calls run **in parallel** via `Promise.allSettled()`:

- **People search** → Finds profiles of employees at the company, revealing names, titles, and tenure
- **Company search** → Finds the company's LinkedIn page, revealing industry, employee count, HQ location, specialties

Each uses the **3-method fallback pipeline**:
1. `mcporter call 'linkedin.search_people(...)'` (highest quality)
2. `exaSearch("site:linkedin.com/in COMPANY_NAME")` (semantic search)
3. `Jina Search` as final fallback

### Stage 4: Twitter/X User Search

```
Channel: twitter (Exa → Jina Search fallback)
Function: twitterSearchUsers(companyName, 3)
Purpose: Find company's social presence, handle, recent activity
```

- Searches for Twitter/X profiles associated with the company
- Reveals the company's social handle, communication style, and recent announcements
- Fallback chain: Exa semantic search → Jina Search

### Stage 5: LLM Synthesis

```
Engine: z-ai-web-dev-sdk via callLLMForJSON()
Purpose: Fuse all raw data into a structured, deduplicated lead record
```

The LLM receives:
- Current lead data (company name, website, industry, city, country)
- Website content (up to 8,000 characters)
- Exa search results (up to 5 results)
- LinkedIn people data (up to 3 profiles)
- LinkedIn company data (up to 3 results)
- Twitter profile data (up to 3 profiles)

The LLM extracts **only** fields it can confidently fill, using `null` for unknowns. This prevents hallucination — Forge would rather leave a field empty than fill it with fabricated data.

---

## 5. Data Points Collected

### Comprehensive Field Reference

| # | Field | Category | Database Column | Primary Source | Fallback Source | Confidence Basis |
|---|-------|----------|-----------------|---------------|-----------------|------------------|
| 1 | Company Name | Company | `companyName` | Input (discovery) | — | Direct (100%) |
| 2 | Legal Name | Company | `legalName` | Website / LinkedIn | Exa search | Single-source (60%) |
| 3 | Website | Company | `website` | Input (discovery) | Exa search | Direct (95%) |
| 4 | Industry | Company | `industry` | LinkedIn company page | Website / Exa | Cross-verified (85%) |
| 5 | Sub-Industry | Company | `subIndustry` | LinkedIn company page | Website content | Single-source (65%) |
| 6 | SIC Code | Company | `sicCode` | Exa search (directories) | LLM inference | Unverified (40%) |
| 7 | NAICS Code | Company | `naicsCode` | Exa search (directories) | LLM inference | Unverified (40%) |
| 8 | HQ Address | Location | `hqAddress` | Website /contact page | LinkedIn company page | Cross-verified (80%) |
| 9 | City | Location | `city` | Website | LinkedIn / Exa | Cross-verified (90%) |
| 10 | State/Province | Location | `stateProvince` | Website address | LinkedIn company | Cross-verified (85%) |
| 11 | Country | Location | `country` | Website | LinkedIn / Exa | Cross-verified (95%) |
| 12 | Postal Code | Location | `postalCode` | Website contact page | Exa search | Single-source (70%) |
| 13 | Phone (Main) | Contact | `phoneMain` | Website /contact page | Exa search | Direct (90%) |
| 14 | Phone (Direct) | Contact | `phoneDirect` | Website team page | LinkedIn profile | Single-source (55%) |
| 15 | General Email | Contact | `generalEmail` | Website /contact page | Email pattern gen | Direct (85%) |
| 16 | Support Email | Contact | `supportEmail` | Website footer | Exa search | Direct (80%) |
| 17 | CEO Name | People | `ceoName` | LinkedIn people search | Website /about | Cross-verified (75%) |
| 18 | CEO Email | People | `ceoEmail` | Email pattern generation | Exa search | Pattern-inferred (50%) |
| 19 | Key Contact Name | People | `keyContactName` | LinkedIn people search | Website /team | Cross-verified (70%) |
| 20 | Key Contact Title | People | `keyContactTitle` | LinkedIn profile | Website /team | Cross-verified (75%) |
| 21 | Key Contact Email | People | `keyContactEmail` | Email pattern generation | Exa search | Pattern-inferred (45%) |
| 22 | Employee Count | Firmographics | `employeeCount` | LinkedIn company page | Exa search | Cross-verified (80%) |
| 23 | Revenue Estimate | Firmographics | `revenueEstimate` | Exa search (reports) | LLM estimate | Range estimate (50%) |
| 24 | Founding Year | Firmographics | `foundingYear` | LinkedIn company page | Exa search | Cross-verified (75%) |
| 25 | Ownership Type | Firmographics | `ownershipType` | LinkedIn company page | Exa search | Single-source (55%) |
| 26 | LinkedIn URL | Digital | `linkedinUrl` | LinkedIn company search | Exa search | Direct (95%) |
| 27 | Twitter Handle | Digital | `twitterHandle` | Twitter user search | Exa search | Direct (85%) |
| 28 | Facebook Page | Digital | `facebookPage` | Website footer links | Exa search | Single-source (60%) |
| 29 | Tech Stack | Digital | `techStack` | Website source analysis | GitHub repos | Signature-detected (65%) |
| 30 | Description | Qualifiers | `notes` | Website content | LinkedIn summary | Cross-verified (80%) |
| 31 | Data Completeness | Scoring | `dataCompleteness` | Computed (field count) | — | Calculated (100%) |
| 32 | Sources | Discovery | `sources` | JSON array of URLs | — | Attribution (100%) |
| 33 | Enriched At | Metadata | `enrichedAt` | Timestamp | — | System (100%) |
| 34 | Stage | Pipeline | `stage` | Set to `enriched` | — | System (100%) |

### Confidence Level Definitions

| Level | Score Range | Meaning | Action |
|-------|-------------|---------|--------|
| **Direct** | 85–100% | Found verbatim on official source (website, LinkedIn) | Use directly |
| **Cross-verified** | 70–85% | Confirmed by 2+ independent sources | Use with high confidence |
| **Single-source** | 50–70% | Found on one source only | Use but flag for verification |
| **Pattern-inferred** | 40–55% | Generated from pattern (e.g., email from name+domain) | Use with caution, mark as unverified |
| **LLM-estimated** | 20–40% | AI inference from company name/industry | Use as placeholder only |
| **Unverified** | 0–20% | No reliable source found | Leave as null |

---

## 6. Email Pattern Discovery

Forge detects and applies corporate email patterns to generate likely email addresses for key contacts. This is critical because direct email addresses are rarely published.

### Pattern Detection Algorithm

1. **Gather known emails** — From website contact pages, Exa search results, and LinkedIn profiles
2. **Identify the domain** — Extract the email domain from the company website (e.g., `company.com`)
3. **Classify the pattern** — Compare known emails against standard patterns:

| Pattern | Format | Example | Prevalence |
|---------|--------|---------|------------|
| `firstlast` | `{first}{last}@domain` | `johnsmith@company.com` | 25% |
| `first.last` | `{first}.{last}@domain` | `john.smith@company.com` | 30% |
| `first_last` | `{first}_{last}@domain` | `john_smith@company.com` | 5% |
| `firstl` | `{first[0]}{last}@domain` | `jsmith@company.com` | 15% |
| `flast` | `{first[0]}{last}@domain` | `jsmith@company.com` | 10% |
| `first` | `{first}@domain` | `john@company.com` | 5% |
| `firstl` | `{first}{last[0]}@domain` | `johns@company.com` | 5% |
| `lfirst` | `{last[0]}{first}@domain` | `sjohn@company.com` | 5% |

4. **Generate candidates** — For a known contact (e.g., "Jane Doe" at `acme.com`):
   ```
   jane.doe@acme.com      (if pattern is first.last)
   jdoe@acme.com          (if pattern is firstl)
   jane_doe@acme.com      (if pattern is first_last)
   ```

5. **Score confidence** — Each generated email gets a confidence score:
   - **High (75%)**: Pattern confirmed from 2+ known emails at same domain
   - **Medium (55%)**: Pattern confirmed from 1 known email at same domain
   - **Low (35%)**: Pattern assumed from industry/size norms

6. **Validate structure** — All generated emails pass regex validation:
   ```typescript
   /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
   ```

### Example: Email Pattern Discovery for "TechCorp"

```
Known data:
  - Website: techcorp.com
  - Found on /contact: support@techcorp.com, info@techcorp.com
  - CEO from LinkedIn: Sarah Chen
  - Key contact: Michael Park, VP Sales

Pattern analysis:
  - support@ and info@ are role addresses (no pattern)
  - Search Exa for "techcorp.com email" → finds john.miller@techcorp.com
  
Pattern detected: first.last
  → CEO email: sarah.chen@techcorp.com (confidence: 75%)
  → VP Sales email: michael.park@techcorp.com (confidence: 75%)
```

---

## 7. Decision Framework

### Source Priority Hierarchy

When data is available from multiple sources, Forge applies this priority:

| Priority | Source | Weight | Rationale |
|----------|--------|--------|-----------|
| 1 | **Company website** (Jina Reader) | 10 | First-party, most authoritative |
| 2 | **LinkedIn company page** (mcporter) | 9 | Official company profile, structured data |
| 3 | **LinkedIn people profiles** (mcporter/Exa) | 8 | Verified professional data |
| 4 | **Exa semantic search** | 7 | High-quality web search, often finds directories |
| 5 | **Twitter/X profiles** (Exa) | 5 | Social data, less formal but current |
| 6 | **GitHub** (gh CLI) | 4 | Tech stack only, developer-focused companies |
| 7 | **LLM knowledge** | 2 | Last resort, marked as estimated |

### Channel Selection by Data Need

| Data Need | Primary Channel | Secondary Channel | Rationale |
|-----------|----------------|-------------------|-----------|
| Phone numbers | Web (Jina Reader) | Exa search | Phones live on /contact pages |
| Email addresses | Web (Jina Reader) | Pattern generation | Emails on /contact or generated from patterns |
| Employee count | LinkedIn company | Exa search | LinkedIn has self-reported ranges |
| Key contacts | LinkedIn people | Web (team page) | LinkedIn profiles are structured |
| Industry | LinkedIn company | Website | LinkedIn uses standard taxonomy |
| Revenue | Exa search | LLM estimate | Revenue rarely on website; directories/reports have it |
| Tech stack | Web source analysis | GitHub repos | CMS/framework signatures in page source |
| Social handles | Twitter user search | Website footer | Direct profile lookup is fastest |
| HQ Address | Website /contact | LinkedIn company | Physical address on contact pages |
| Founding year | LinkedIn company | Exa search | LinkedIn shows "Founded" field |

### Cross-Verification Logic

```
IF data_from_source_A == data_from_source_B:
    confidence = HIGH (cross-verified)
    
ELIF data_from_source_A ≈ data_from_source_B (minor formatting):
    USE data_from_higher_priority_source
    confidence = HIGH (cross-verified, minor variance)
    
ELIF data_from_source_A != data_from_source_B (conflict):
    USE data_from_higher_priority_source
    FLAG conflict in notes
    confidence = MEDIUM (unresolved conflict)
    
ELIF data_from_one_source_only:
    USE that data
    confidence = SINGLE-SOURCE
    
ELIF no_data_from_any_source:
    IF LLM_can_reasonably_estimate:
        USE LLM estimate, mark as [estimated]
        confidence = LLM-ESTIMATED
    ELSE:
        LEAVE field as null
```

---

## 8. Multi-Source Data Fusion

### How Data from Different Sources is Merged

When the LLM synthesis step (Stage 5) receives raw data from all channels, it applies fusion logic:

1. **Deduplication** — Same data appearing in multiple sources is merged into one entry
2. **Priority override** — When sources conflict, the higher-priority source wins
3. **Complementary merge** — When sources provide different fields, all are included
4. **Conflict flagging** — Unresolved conflicts are noted in the lead's `notes` field

### Fusion Example

```
Input data:
  Website:  Phone: +1-555-0100  |  Email: info@acme.com  |  Industry: "Software"
  LinkedIn: Industry: "SaaS"     |  Employees: "51-200"   |  Founded: 2018
  Exa:      Phone: 555-0100      |  Revenue: "$10M-$50M"  |  CEO: "Jane Smith"
  Twitter:  Handle: @acme_inc

Fused output:
  phoneMain: "+1-555-0100"      (from Website, confirmed by Exa → cross-verified)
  generalEmail: "info@acme.com"  (from Website only → single-source)
  industry: "SaaS"              (LinkedIn wins over Website for industry taxonomy)
  employeeCount: "51-200"       (from LinkedIn only → single-source)
  foundingYear: "2018"          (from LinkedIn only → single-source)
  revenueEstimate: "$10M-$50M"  (from Exa only → single-source)
  ceoName: "Jane Smith"         (from Exa only → single-source)
  twitterHandle: "@acme_inc"    (from Twitter only → direct)
```

---

## 9. Confidence Scoring System

### How Each Data Point Gets a Confidence Score

Confidence is computed from three factors:

```
confidence = source_weight × verification_multiplier × recency_bonus
```

| Factor | Calculation | Values |
|--------|-------------|--------|
| **Source weight** | Based on source priority (1–10) | Website=10, LinkedIn=9, Exa=7, Twitter=5, LLM=2 |
| **Verification multiplier** | Cross-source agreement | 1 source=0.6, 2 sources=0.85, 3+ sources=1.0 |
| **Recency bonus** | Published date vs. now | <1yr=1.0, 1-2yr=0.8, >2yr=0.6, unknown=0.7 |

### Data Completeness Score

After enrichment, Forge computes a `dataCompleteness` score:

```typescript
const totalFields = 29; // All enrichable fields in the Lead model
const filledFields = Object.values(enrichedData).filter(v => v !== null && v !== undefined && v !== '').length;
dataCompleteness = Math.round((filledFields / totalFields) * 100);
```

Target: **80%+ data completeness** per lead (23+ of 29 fields filled).

---

## 10. Error Recovery

Forge is designed with **aggressive resilience** — the pipeline never stalls on a single lead failure.

### Failure Scenarios and Recovery

| Scenario | Detection | Recovery | Result |
|----------|-----------|----------|--------|
| **Website down / 404** | `webRead()` returns `success: false` | Skip to Stage 2, use Exa search | Lead enriched from search data |
| **LinkedIn blocked** | All 3 LinkedIn methods fail | Use Exa + website for people data | Lead enriched with reduced people data |
| **Exa unavailable** | `exaSearch()` falls back to Jina Search | Jina Search provides results | Slight quality reduction |
| **All channels fail** | `hasData === false` after all stages | LLM generates estimates from company name + industry | Lead marked `[Enriched via LLM estimates]` |
| **LLM JSON parse failure** | `callLLMForJSON()` fails after retries | Return default empty object | Lead still advanced to `enriched` |
| **Database write failure** | `db.lead.update()` throws | Catch error, log, continue to next lead | Lead not updated but pipeline continues |
| **Single lead enrichment failure** | Any error in the per-lead loop | Catch, advance lead to `enriched` anyway, add `[Enrichment failed]` note | Pipeline never stalls |
| **Timeout on channel call** | `AbortSignal.timeout()` fires | `Promise.allSettled()` isolates failure | Other channels still succeed |

### The No-Stall Guarantee

```typescript
// From the actual implementation:
} catch (leadError) {
  // RESILIENCE: Even if enrichment fails, advance the lead to 'enriched'
  // so pipeline doesn't stall
  console.error(`Failed to enrich lead ${lead.id}:`, leadError);
  try {
    await db.lead.update({
      where: { id: lead.id },
      data: {
        stage: 'enriched',
        enrichedAt: new Date(),
        notes: [lead.notes, '[Enrichment failed — advanced automatically]'].filter(Boolean).join('\n\n'),
      },
    });
    enrichedCount++;
  } catch (fallbackError) {
    console.error(`Failed to fallback-enrich lead ${lead.id}:`, fallbackError);
  }
}
```

---

## 11. Constraints & Guardrails

### Rate Limits

| Constraint | Value | Rationale |
|------------|-------|-----------|
| Max leads per enrichment task | 20 | Balance depth vs. speed |
| Website content cap for LLM | 15,000 chars (8,000 for prompt) | LLM context window management |
| Channel call timeout | 15–30 seconds per call | Prevent runaway waits |
| LLM response timeout | Retries once on timeout | Single retry for resilience |
| Parallel channel calls | LinkedIn people + company + Twitter | `Promise.allSettled()` for non-blocking |
| Exa search results per query | 5–10 | Sufficient data without noise |

### Privacy Considerations

- Forge only collects **publicly available** data from company websites, LinkedIn public profiles, and Twitter
- Personal email addresses are **pattern-generated** (not scraped from private sources)
- All data is marked with confidence levels — unverified data is clearly flagged
- The `notes` field transparently records when data is LLM-estimated vs. web-verified

### Data Accuracy Standards

- Email addresses must pass **structural validation** (regex check)
- Phone numbers must match **country-specific formats**
- Employee counts are stored as **ranges** (e.g., "51-200") not exact numbers, reflecting source precision
- Revenue estimates are stored as **ranges** (e.g., "$10M-$50M")
- Forge never fabricates data — fields with no source are left as `null`

---

## 12. Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Enrichment completeness** | 80%+ fields filled per lead | `dataCompleteness` score |
| **Email accuracy** | 85%+ verified or high-confidence pattern | Direct + pattern-generated with confirmed domain |
| **Processing speed** | < 30 seconds per lead | Time from `stage: 'new'` to `stage: 'enriched'` |
| **Channel success rate** | 3+ channels succeeding per lead | `channelActivity.filter(c => c.success).length` |
| **Pipeline throughput** | 20 leads per task execution | Default `take: 20` from database |
| **Cross-verification rate** | 50%+ fields cross-verified | Fields confirmed by 2+ sources |
| **LLM fallback rate** | < 15% of leads | Leads marked `[Enriched via LLM estimates]` |

---

## 13. Workflow Examples

### Example 1: Full Enrichment of "Acme Corp"

```
Input: Lead record { companyName: "Acme Corp", industry: "Technology", city: "San Francisco", website: "https://acmecorp.com" }

Stage 1 — Website Read:
  webRead("https://acmecorp.com")
  → Title: "Acme Corp — Enterprise SaaS Platform"
  → Content: Contact page has +1-415-555-0100, info@acmecorp.com
  → About page mentions "Founded 2019", "50-200 employees"

Stage 2 — Exa Search:
  exaSearch("Acme Corp Technology contact email phone address", 5)
  → Finds Crunchbase profile, Bloomberg listing, G2 review page
  → Crunchbase: Revenue $15M, CEO: Sarah Chen

Stage 3 — LinkedIn Search:
  linkedInSearchPeople("Acme Corp", 3)
  → Sarah Chen, CEO | Michael Park, VP Sales | Lisa Wang, CTO
  linkedInSearchCompanies("Acme Corp", 3)
  → Acme Corp | Industry: Software | Size: 51-200 | HQ: San Francisco, CA

Stage 4 — Twitter Search:
  twitterSearchUsers("Acme Corp", 3)
  → @acmecorp — "Building the future of enterprise SaaS"
  → @sarahchen_acme — CEO at Acme Corp

Stage 5 — LLM Synthesis:
  Input: All raw data from stages 1-4
  Output: {
    phoneMain: "+1-415-555-0100",
    generalEmail: "info@acmecorp.com",
    hqAddress: "123 Main St, San Francisco, CA 94105",
    employeeCount: "51-200",
    revenueEstimate: "$10M-$50M",
    foundingYear: "2019",
    ceoName: "Sarah Chen",
    keyContactName: "Michael Park",
    keyContactTitle: "VP Sales",
    linkedinUrl: "https://linkedin.com/company/acme-corp",
    twitterHandle: "@acmecorp",
    description: "Enterprise SaaS platform..."
  }

Result: Lead updated with 12+ enriched fields, stage → 'enriched'
```

### Example 2: Enrichment with Limited Data

```
Input: Lead record { companyName: " obscure consulting llc", industry: "Consulting" }
No website URL available.

Stage 1 — Website Read: SKIPPED (no website)

Stage 2 — Exa Search:
  exaSearch("obscure consulting llc Consulting contact email phone address", 5)
  → 0 relevant results (obscure company)

Stage 3 — LinkedIn Search:
  linkedInSearchPeople("obscure consulting llc", 3)
  → 0 results
  linkedInSearchCompanies("obscure consulting llc", 3)
  → 0 results

Stage 4 — Twitter Search:
  twitterSearchUsers("obscure consulting llc", 3)
  → 0 results

Stage 5 — LLM Synthesis (fallback mode):
  hasData = false → Use LLM estimate prompt
  Output: {
    employeeCount: "1-10",
    revenueEstimate: "$1M-$5M",
    description: "Small consulting firm"
  }

Result: Lead enriched with 3 estimated fields, notes include:
"[Enriched via LLM estimates — no web data available]"
```

### Example 3: Batch Enrichment (20 leads)

```
Task dispatched: { agentName: "data-enrichment", taskType: "enrich", campaignId: "campaign_abc123" }

1. Query leads: SELECT * FROM Lead WHERE campaignId = 'campaign_abc123' AND stage = 'new' LIMIT 20
2. For each lead (sequential, with progress updates):
   a. Read website (if available) — 5s avg
   b. Exa search — 3s avg
   c. LinkedIn people + company + Twitter (parallel) — 8s avg
   d. LLM synthesis — 5s avg
   e. Update database — <1s
   Total per lead: ~21 seconds

3. Total batch time: ~7 minutes for 20 leads
4. Result: { enriched: 18, totalProcessed: 20 }
   (2 leads had partial failures but were still advanced)
```

---

## 14. Agent-Reach Channel Access

Forge uses the following Agent-Reach channels:

| Channel | Bridge Function | Primary Use | Fallback Chain |
|---------|----------------|-------------|----------------|
| **web** | `webRead()`, `webReadMultiple()`, `enrichCompanyData()` | Company website content extraction | None (Jina Reader is zero-config) |
| **exa_search** | `exaSearch()` | Company data search, directory listings | mcporter → Jina Search |
| **linkedin** | `linkedInSearchPeople()`, `linkedInSearchCompanies()`, `linkedInReadCompanyPage()`, `linkedInGetProfile()` | People data, company profiles | mcporter → Exa → Jina Search |
| **twitter** | `twitterSearchUsers()`, `twitterSearch()` | Social profile discovery | bird CLI → Exa → Jina Search |
| **github** | `githubSearchRepos()`, `githubViewRepo()` | Tech stack detection for dev companies | gh CLI (zero-config) |

---

## 15. Integration Points

### Upstream

| Agent | Relationship |
|-------|-------------|
| **Prospect Discovery** (Scout) | Creates leads at `stage: 'new'` that Forge enriches |
| **Orchestrator** (Atlas) | Dispatches enrichment tasks to Forge |

### Downstream

| Agent | Relationship |
|-------|-------------|
| **Lead Qualification** (Judge) | Consumes leads at `stage: 'enriched'` for scoring |
| **Outreach Composer** (Pen) | Uses enriched contact data for personalized messages |

### API Dispatch

```typescript
// Direct dispatch
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "data-enrichment",
  "taskType": "enrich",
  "input": { "campaignId": "...", "query": "...", "industry": "...", "location": "..." }
}

// Via AI Chat (Orchestrator decides to dispatch)
POST /api/ai
{ "message": "Enrich the leads in my Dubai accounting campaign" }
// → AI parses intent → Dispatches to data-enrichment → Agent-Reach fetches & enriches → Enriched records stored
```

### Runtime Handler

```typescript
// src/lib/agent-executor.ts
async function executeDataEnrichment(ctx: AgentExecutionContext): Promise<AgentExecutionResult>
```

The handler:
1. Queries leads at `stage: 'new'` from the database (up to 20 per task)
2. Runs the 5-stage pipeline for each lead
3. Records channel activity for every Agent-Reach call
4. Updates progress in real-time (10% → 90% → 100%)
5. Advances leads to `stage: 'enriched'` even on partial failure
6. Returns `AgentExecutionResult` with enrichment counts and channel activity
