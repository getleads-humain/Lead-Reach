# Judge — Lead Qualification Skills

> *Every skill in Judge's arsenal is a precision instrument. Each one produces a score that is explainable, reproducible, and auditable.*

---

## Table of Contents

1. [ICP Scoring](#1-icp-scoring)
2. [Firmographic Fit Evaluation](#2-firmographic-fit-evaluation)
3. [Intent Signal Detection](#3-intent-signal-detection)
4. [Reachability Assessment](#4-reachability-assessment)
5. [Strategic Value Rating](#5-strategic-value-rating)
6. [Lead Tiering & Classification](#6-lead-tiering--classification)
7. [Lead Disqualification](#7-lead-disqualification)
8. [Score Explainability](#8-score-explainability)
9. [LLM-Based Lead Scoring](#9-llm-based-lead-scoring)
10. [Execution Engine Integration](#10-execution-engine-integration)

---

## 1. ICP Scoring

### Overview

The master skill that orchestrates all 5 factor scores into a single composite score with tier classification. This is the primary entry point when Judge receives a lead for qualification.

### Trigger

| Condition | Description |
|-----------|-------------|
| Lead stage = `enriched` | Lead has been enriched and is ready for qualification |
| Manual dispatch | User triggers qualification via API or AI chat |
| Pipeline auto-trigger | Orchestrator creates a `qualify` task for this agent |

### Input Schema

```typescript
interface ICPScoringInput {
  leadId: string;
  leadData: {
    companyName: string;
    industry: string | null;
    employeeCount: string | null;        // e.g., "51-200"
    revenueEstimate: string | null;      // e.g., "$10M-$50M"
    city: string | null;
    country: string | null;
    website: string | null;
    linkedinUrl: string | null;
    generalEmail: string | null;
    phoneMain: string | null;
    keyContactName: string | null;
    keyContactTitle: string | null;
    keyContactEmail: string | null;
    ceoName: string | null;
    ceoEmail: string | null;
    notes: string | null;
    // ... all Lead model fields
  };
  campaignICP: {
    targetIndustries: string[];
    targetCompanySizes: string[];
    targetLocations: string[];
    targetRevenueRange: { min?: string; max?: string };
    disqualifyIndustries: string[];
    disqualifyCompanySizes: string[];
    competitorNames: string[];
    requireDirectEmail: boolean;
    requirePhone: boolean;
    preferredDealSize: string;
    strategicBoostIndustries: string[];
  };
}
```

### Output Schema

```typescript
interface ICPScoringOutput {
  leadId: string;
  compositeScore: number;               // 0-100
  leadTier: 'hot' | 'warm' | 'cold';
  confidence: {
    score: number;                       // 0-1.0
    level: 'high' | 'medium' | 'low';
    flags: string[];
  };
  factors: {
    firmographic: { score: number; breakdown: FirmographicBreakdown };
    intent: { score: number; signals: DetectedSignal[] };
    reachability: { score: number; channels: ChannelRating[] };
    strategic: { score: number; breakdown: StrategicBreakdown };
    dataCompleteness: { score: number; populatedFields: number; totalFields: number };
  };
  boostCapApplied: BoostCapRecord[];
  disqualification: DisqualificationResult | null;
  reasoning: string;                     // Human-readable reasoning chain
  qualifiedAt: string;                   // ISO timestamp
}
```

### Method

```
Step 1: Run disqualification checks (hard rules first)
Step 2: If not disqualified, compute Firmographic Fit score
Step 3: Run Intent Signal Detection via Agent-Reach
Step 4: Compute Reachability Assessment
Step 5: Compute Strategic Value Rating
Step 6: Compute Data Completeness score
Step 7: Apply weighted composite formula
Step 8: Apply boost/cap rules
Step 9: Classify tier (Hot/Warm/Cold)
Step 10: Compute confidence score
Step 11: Generate reasoning chain
Step 12: Write results to database
```

### Agent-Reach Bridge Function Signatures

```typescript
// Primary: Intent signal search
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>

// Secondary: LinkedIn profile verification
linkedInGetProfile(url: string): Promise<ToolResult<LinkedInProfileResult>>

// Secondary: Company page analysis
linkedInReadCompanyPage(companyUrl: string): Promise<ToolResult<LinkedInProfileResult>>

// Tertiary: Company website analysis
webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
```

### LLM Prompt

```typescript
const scoringPrompt = `You are a lead qualification specialist. Score this lead based on ICP fit and intent signals.

Lead data:
${JSON.stringify(leadData)}

Intent signals from web search:
${JSON.stringify(intentSignals)}

Return a JSON object:
{
  "firmographicScore": 0-100,
  "intentScore": 0-100,
  "reachabilityScore": 0-100,
  "strategicScore": 0-100,
  "dataCompleteness": 0-100,
  "leadScore": 0-100,
  "leadTier": "hot" | "warm" | "cold",
  "reasoning": "Brief explanation of scoring",
  "keySignals": ["Signal 1", ...],
  "disqualifyReason": null | "Reason if disqualified"
}

Scoring guide:
- Firmographic: Industry fit, company size fit, location match
- Intent: Recent hiring, expansion, funding, tech adoption signals
- Reachability: Email/phone availability, LinkedIn presence
- Strategic: Deal size potential, long-term value
- Data Completeness: How much data is filled in`;
```

### Fallback Chain

| Step | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Intent detection | `exaSearch()` via mcporter | `exaSearch()` via Jina Search | Score intent = 0, flag data gap |
| LinkedIn verification | `linkedInGetProfile()` via mcporter | `linkedInGetProfile()` via Jina Reader | Assume URL exists but unverified |
| LLM scoring | `callLLMForJSON()` with retries | `callLLMForJSON()` with forced-JSON prompt | Apply default conservative scores |
| Database write | `db.lead.update()` | Retry once | Log error, continue to next lead |

### Error Handling

```typescript
try {
  const scores = await callLLMForJSON<ScoringResult>(scoringPrompt, 'Score this lead', {
    firmographicScore: 30,
    intentScore: 20,
    reachabilityScore: 20,
    strategicScore: 20,
    dataCompleteness: 10,
    leadScore: 25,
    leadTier: 'cold',
    reasoning: 'Scored with defaults due to LLM failure',
    keySignals: [],
  });

  // Validate score ranges
  for (const key of ['firmographicScore', 'intentScore', 'reachabilityScore',
                      'strategicScore', 'dataCompleteness', 'leadScore']) {
    if (typeof scores[key] !== 'number' || scores[key] < 0 || scores[key] > 100) {
      console.warn(`[Judge] Invalid ${key}: ${scores[key]}, clamping`);
      scores[key] = Math.max(0, Math.min(100, Number(scores[key]) || 0));
    }
  }
} catch (error) {
  // Apply default conservative scores
  // Stage as 'qualified' with 'cold' tier
  // Add audit note for human review
}
```

### Example Scoring Calculation

**Lead:** Acme Cloud Technologies, 150 employees, San Francisco, $20M revenue

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Firmographic | 85 | 0.30 | 25.5 |
| Intent | 62 | 0.25 | 15.5 |
| Reachability | 75 | 0.20 | 15.0 |
| Strategic | 70 | 0.15 | 10.5 |
| Data Completeness | 80 | 0.10 | 8.0 |
| **Total** | | | **74.5 → Warm** |

After multi-signal boost (+10): **84.5 → Hot**

### Performance Targets

| Metric | Target |
|--------|--------|
| Processing time per lead | < 5 seconds |
| Scoring accuracy (conversion correlation) | ≥ 0.70 |
| LLM call success rate | ≥ 95% |
| Composite score variance (same lead, 3 runs) | < 5 points |

---

## 2. Firmographic Fit Evaluation

### Overview

Evaluates how closely a lead's company characteristics match the campaign's Ideal Customer Profile. This is the heaviest-weighted factor at 30% of the composite score.

### Trigger

| Condition | Description |
|-----------|-------------|
| Part of ICP scoring pipeline | Called automatically during full qualification |
| Manual firmographic review | User requests fit evaluation for a specific lead |

### Input Schema

```typescript
interface FirmographicInput {
  lead: {
    industry: string | null;
    subIndustry: string | null;
    employeeCount: string | null;
    revenueEstimate: string | null;
    city: string | null;
    country: string | null;
    stateProvince: string | null;
  };
  icp: {
    targetIndustries: string[];
    targetCompanySizes: string[];
    targetLocations: string[];
    targetRevenueRange: { min?: string; max?: string };
  };
}
```

### Output Schema

```typescript
interface FirmographicOutput {
  score: number;                          // 0-100
  breakdown: {
    industryMatch: {
      score: number;                      // 0-100
      status: 'exact' | 'adjacent' | 'none';
      matchedTo: string | null;           // Which ICP industry was matched
    };
    companySize: {
      score: number;                      // 0-100
      status: 'in_range' | 'adjacent' | 'out_of_range';
      leadSize: string | null;
      targetSize: string[];
    };
    geographicFit: {
      score: number;                      // 0-100
      status: 'exact' | 'country' | 'region' | 'none';
      matchedLocation: string | null;
    };
    revenueFit: {
      score: number;                      // 0-100
      status: 'in_range' | 'adjacent' | 'out_of_range' | 'unknown';
      estimatedRevenue: string | null;
    };
  };
  mismatches: string[];                   // List of dimension mismatches
}
```

### Method

#### Industry Matching

```typescript
function calculateIndustryMatch(
  leadIndustry: string | null,
  targetIndustries: string[]
): { score: number; status: 'exact' | 'adjacent' | 'none'; matchedTo: string | null } {
  if (!leadIndustry) {
    return { score: 0, status: 'none', matchedTo: null };
  }

  // Exact match (case-insensitive)
  const exactMatch = targetIndustries.find(t =>
    t.toLowerCase() === leadIndustry.toLowerCase()
  );
  if (exactMatch) {
    return { score: 100, status: 'exact', matchedTo: exactMatch };
  }

  // Adjacent industry check
  const ADJACENCY_MAP: Record<string, string[]> = {
    'Technology': ['Software', 'SaaS', 'IT Services', 'Cloud Computing', 'Information Technology'],
    'Finance': ['Banking', 'Insurance', 'Fintech', 'Investment Management', 'Financial Services'],
    'Healthcare': ['Pharmaceuticals', 'Biotechnology', 'Medical Devices', 'Health Tech'],
    'Manufacturing': ['Industrial', 'Automotive', 'Aerospace', 'Chemicals'],
    'Retail': ['E-commerce', 'Consumer Goods', 'Fashion', 'Food & Beverage'],
    'Consulting': ['Management Consulting', 'IT Consulting', 'Strategy', 'Professional Services'],
  };

  for (const target of targetIndustries) {
    const adjacent = ADJACENCY_MAP[target] || [];
    if (adjacent.some(a => a.toLowerCase() === leadIndustry.toLowerCase())) {
      return { score: 60, status: 'adjacent', matchedTo: target };
    }
  }

  return { score: 0, status: 'none', matchedTo: null };
}
```

#### Company Size Range Evaluation

```typescript
const SIZE_ORDER = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'];

function calculateSizeMatch(
  leadSize: string | null,
  targetSizes: string[]
): { score: number; status: 'in_range' | 'adjacent' | 'out_of_range' } {
  if (!leadSize) return { score: 0, status: 'out_of_range' };

  // Direct match
  if (targetSizes.includes(leadSize)) {
    return { score: 100, status: 'in_range' };
  }

  // Check if adjacent (one step in SIZE_ORDER)
  const leadIdx = SIZE_ORDER.indexOf(leadSize);
  for (const target of targetSizes) {
    const targetIdx = SIZE_ORDER.indexOf(target);
    if (Math.abs(leadIdx - targetIdx) === 1) {
      return { score: 60, status: 'adjacent' };
    }
  }

  return { score: 20, status: 'out_of_range' };
}
```

#### Geographic Proximity Scoring

```typescript
function calculateLocationMatch(
  leadCity: string | null,
  leadCountry: string | null,
  targetLocations: string[]
): { score: number; status: 'exact' | 'country' | 'region' | 'none'; matchedLocation: string | null } {
  if (!leadCity && !leadCountry) {
    return { score: 0, status: 'none', matchedLocation: null };
  }

  for (const target of targetLocations) {
    // Parse "City, Country" format
    const [targetCity, targetCountry] = target.split(',').map(s => s.trim());

    // Exact city match
    if (leadCity && targetCity && leadCity.toLowerCase() === targetCity.toLowerCase()) {
      return { score: 100, status: 'exact', matchedLocation: target };
    }

    // Same country
    if (leadCountry && targetCountry && leadCountry.toLowerCase() === targetCountry.toLowerCase()) {
      return { score: 70, status: 'country', matchedLocation: target };
    }

    // Same region (e.g., both in EU, both in APAC)
    if (leadCountry && targetCountry && sameRegion(leadCountry, targetCountry)) {
      return { score: 40, status: 'region', matchedLocation: target };
    }
  }

  return { score: 10, status: 'none', matchedLocation: null };
}
```

### Agent-Reach Bridge Function Signatures

This skill primarily uses data already collected during the enrichment phase. No additional Agent-Reach calls are required under normal operation.

**Optional verification calls:**

```typescript
// Verify company size via LinkedIn company page
linkedInReadCompanyPage(companyUrl: string): Promise<ToolResult<LinkedInProfileResult>>
// Extracts: Industry, Company size, Headquarters, Type, Specialties

// Cross-reference company details via website
webRead(url: string): Promise<ToolResult<WebReadResult>>
// Searches page for: "about us", team size, office locations
```

### LLM Prompt

When firmographic data is ambiguous (e.g., industry is unclear, or the sub-industry doesn't clearly map to an ICP target):

```typescript
const firmographicClarificationPrompt = `You are a firmographic classification specialist. 
Given the following company information, classify the company's primary industry 
and assess whether it matches any of the target industries.

Company data:
${JSON.stringify(leadData)}

Target industries: ${icp.targetIndustries.join(', ')}

Return JSON:
{
  "classifiedIndustry": "Your best classification",
  "industryConfidence": 0-100,
  "isAdjacentToTarget": true/false,
  "adjacentToWhich": "Target industry it's adjacent to, or null",
  "reasoning": "Why you classified it this way"
}`;
```

### Fallback Chain

| Scenario | Primary | Fallback |
|----------|---------|----------|
| Industry missing from lead | Use enriched data | LLM classification from company name/description |
| Size missing from lead | Use LinkedIn company page | Estimate from revenue (if available) |
| Location missing | Use enriched data | LLM guess from company name/domain |

### Example Calculation

**Lead:** DataFlow Analytics — industry: "Big Data", 120 employees, London UK

| Dimension | Value | Match | Score |
|-----------|-------|-------|-------|
| Industry | "Big Data" | Adjacent to "Technology" | 60 |
| Size | "51-200" | In range ["51-200", "201-500"] | 100 |
| Location | London, UK | Same country as "London, UK" target | 100 |
| Revenue | Unknown | Unknown | 40 (default) |

**Firmographic Score = (60 × 0.40) + (100 × 0.25) + (100 × 0.20) + (40 × 0.15) = 24 + 25 + 20 + 6 = 75**

### Performance Targets

| Metric | Target |
|--------|--------|
| Industry classification accuracy | ≥ 85% |
| Processing time | < 500ms (no network calls) |
| Adjacent industry detection | ≥ 70% recall |

---

## 3. Intent Signal Detection

### Overview

Searches for active buying and expansion signals about the lead's company using Agent-Reach's `exaSearch()` channel. This is the most dynamic factor — it changes with time and market conditions.

### Trigger

| Condition | Description |
|-----------|-------------|
| Part of ICP scoring pipeline | Called during full qualification |
| Re-qualification | Lead being re-evaluated after 30+ days |
| Manual intent check | User requests intent analysis |

### Input Schema

```typescript
interface IntentDetectionInput {
  companyName: string;
  website: string | null;
  industry: string | null;
  previousSignals?: DetectedSignal[];    // For re-qualification dedup
}
```

### Output Schema

```typescript
interface IntentDetectionOutput {
  score: number;                          // 0-100
  signals: DetectedSignal[];
  overallAssessment: 'high' | 'moderate' | 'low' | 'none';
  keyInsight: string;                     // One-sentence strongest signal summary
  searchResultsUsed: number;              // How many search results contributed
  channelsUsed: string[];                 // Which Agent-Reach channels were used
}

interface DetectedSignal {
  type: 'hiring' | 'funding' | 'expansion' | 'tech_adoption' | 'product_launch';
  description: string;
  recency: 'last_30_days' | 'last_90_days' | 'last_180_days' | 'older';
  strength: 'strong' | 'moderate' | 'weak';
  sourceUrl: string;
  relevance: number;                      // 0-100
  detectedAt: string;                     // ISO timestamp
}
```

### Method

```
Step 1: Broad Intent Search
  exaSearch("COMPANY_NAME hiring expanding new office funding 2024 2025", 3)

Step 2: If signals found, run targeted deepening (optional)
  For each detected signal type:
    exaSearch("COMPANY_NAME [signal_type] details", 3)

Step 3: Deep read top results (optional, for borderline leads)
  webRead(topArticleUrl)

Step 4: Feed results to LLM for structured signal extraction

Step 5: Compute intent score from extracted signals

Step 6: Deduplicate against previous signals (for re-qualification)
```

### Agent-Reach Bridge Function Signatures

```typescript
// Primary: Semantic web search for intent signals
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Examples:
//   exaSearch("TechVista Solutions hiring expanding new office funding 2024 2025", 3)
//   exaSearch("TechVista Solutions Series A B funding raised", 3)
//   exaSearch("TechVista Solutions CTO VP Engineering hiring", 3)

// Secondary: Deep read specific articles
webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
// Example:
//   webRead("https://techcrunch.com/2025/01/15/techvista-raises-series-b")

// Tertiary: LinkedIn for hiring signals
linkedInSearchPeople(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
// Example:
//   linkedInSearchPeople("TechVista Solutions hiring", 5)
```

### LLM Prompt

```typescript
const signalExtractionPrompt = `You are an intent signal analyst. Given web search results about a company, identify specific buying signals.

Company: ${companyName}
Industry: ${industry}

Search results:
${JSON.stringify(searchResults)}

Return a JSON object:
{
  "signals": [
    {
      "type": "hiring" | "funding" | "expansion" | "tech_adoption" | "product_launch",
      "description": "What was detected",
      "recency": "last_30_days" | "last_90_days" | "last_180_days" | "older",
      "strength": "strong" | "moderate" | "weak",
      "sourceUrl": "URL of the evidence",
      "relevance": 0-100
    }
  ],
  "overallIntentAssessment": "high" | "moderate" | "low" | "none",
  "keyInsight": "One-sentence summary of the strongest signal"
}

Rules:
- Only report signals with actual evidence in the search results
- Estimate recency based on publication dates or content clues
- Strength is based on signal specificity (job posting > rumor, official press release > blog mention)
- Relevance measures how much this signal indicates readiness to buy our type of solution`;
```

### Fallback Chain

| Step | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Search | `exaSearch()` via mcporter | `exaSearch()` via Jina Search | Return empty signals, score = 0 |
| Deep read | `webRead()` | Skip deep read | — |
| LLM extraction | `callLLMForJSON()` | Retry with forced JSON | Return `{ signals: [], overallIntentAssessment: 'none' }` |

### Error Handling

```typescript
try {
  const intentResult = await exaSearch(
    `${lead.companyName} hiring expanding new office funding 2024 2025`, 3
  );

  channelActivity.push({
    channel: 'exa_search',
    operation: 'intent_search',
    success: intentResult.success,
    timestamp: new Date().toISOString(),
    resultCount: intentResult.success ? intentResult.data.length : 0,
  });

  if (!intentResult.success || intentResult.data.length === 0) {
    // No intent data available — score at 0 with low confidence
    return {
      score: 0,
      signals: [],
      overallAssessment: 'none',
      keyInsight: 'No intent signals detected — search returned no results',
      confidence: 'low',
    };
  }

  // Extract structured signals via LLM
  const signals = await callLLMForJSON<IntentDetectionOutput>(
    signalExtractionPrompt,
    JSON.stringify(intentResult.data),
    { score: 0, signals: [], overallAssessment: 'none', keyInsight: '', searchResultsUsed: 0, channelsUsed: [] }
  );

  return signals;
} catch (error) {
  // Network failure, LLM timeout, etc.
  console.error(`[Judge] Intent detection failed for ${lead.companyName}:`, error);
  return {
    score: 0,
    signals: [],
    overallAssessment: 'none',
    keyInsight: 'Intent detection failed due to error',
    confidence: 'low',
  };
}
```

### Example Scoring Calculation

**Company:** NovaTech AI, 80 employees

**Search:** `exaSearch("NovaTech AI hiring expanding new office funding 2024 2025", 3)`

**Results:**
1. "NovaTech AI Announces $15M Series A to Expand AI Platform" — 20 days old
2. "NovaTech AI Hiring Senior Data Engineers" — 35 days old
3. "NovaTech AI Opens Berlin Office" — 50 days old

**LLM Extraction:**
```json
{
  "signals": [
    { "type": "funding", "description": "$15M Series A", "recency": "last_30_days", "strength": "strong", "relevance": 85 },
    { "type": "hiring", "description": "Hiring Senior Data Engineers", "recency": "last_90_days", "strength": "moderate", "relevance": 70 },
    { "type": "expansion", "description": "Opens Berlin office", "recency": "last_90_days", "strength": "moderate", "relevance": 60 }
  ],
  "overallIntentAssessment": "high"
}
```

**Score Calculation:**
- Funding: 25 × 1.0 (strong) × 1.0 (last_30_days) = 25
- Hiring: 30 × 0.7 (moderate) × 0.7 (last_90_days) = 14.7
- Expansion: 20 × 0.7 (moderate) × 0.7 (last_90_days) = 9.8
- **Total: 49.5 → Intent Score: 50**

### Performance Targets

| Metric | Target |
|--------|--------|
| Signal detection recall | ≥ 70% (of actual buying signals) |
| False positive rate | < 20% |
| Processing time per lead | < 3 seconds |
| Search result utilization | ≥ 60% of returned results inform scoring |

---

## 4. Reachability Assessment

### Overview

Evaluates the likelihood of successfully contacting and engaging a decision-maker at the lead's company. This factor ensures we don't score a lead as Hot if we have no way to reach them.

### Trigger

| Condition | Description |
|-----------|-------------|
| Part of ICP scoring pipeline | Called during full qualification |
| Contact data update | Lead's contact info has been modified |
| Manual reachability check | User requests assessment |

### Input Schema

```typescript
interface ReachabilityInput {
  lead: {
    generalEmail: string | null;
    supportEmail: string | null;
    phoneMain: string | null;
    phoneDirect: string | null;
    linkedinUrl: string | null;
    twitterHandle: string | null;
    keyContactEmail: string | null;
    ceoEmail: string | null;
    website: string | null;
  };
}
```

### Output Schema

```typescript
interface ReachabilityOutput {
  score: number;                          // 0-100
  channels: ChannelRating[];
  bestChannel: 'email' | 'phone' | 'linkedin' | 'none';
  directContactAvailable: boolean;        // Has a named person's email/phone
  emailValidation: {
    direct: { count: number; valid: boolean };
    general: { count: number; valid: boolean };
  };
}

interface ChannelRating {
  channel: 'email' | 'phone' | 'linkedin' | 'social';
  score: number;                          // 0-100
  available: boolean;
  details: string;                        // e.g., "Direct email: john@company.com"
}
```

### Method

```
Step 1: Email Assessment
  - Identify direct vs. general emails
  - Validate email format (regex)
  - Count available email addresses

Step 2: Phone Assessment
  - Check for direct line vs. main line
  - Validate phone format (country code, digit count)

Step 3: LinkedIn Assessment
  - If linkedinUrl exists, attempt verification via Agent-Reach
  - linkedInGetProfile(url) → check if profile has meaningful data

Step 4: Social/Other Assessment
  - Check for Twitter handle
  - Check for other social profiles

Step 5: Compute weighted channel scores
Step 6: Determine best channel and overall score
```

### Email Format Validation

```typescript
function validateEmailFormat(email: string): { valid: boolean; type: 'direct' | 'general' | 'invalid' } {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) return { valid: false, type: 'invalid' };

  const local = email.split('@')[0].toLowerCase();

  const genericPrefixes = ['info', 'hello', 'contact', 'sales', 'support', 'admin', 'office', 'inquiries', 'help', 'billing'];
  if (genericPrefixes.includes(local)) return { valid: true, type: 'general' };

  // Contains dots or underscores likely means personal email
  if (local.includes('.') || local.includes('_')) return { valid: true, type: 'direct' };

  // Single word could be either — default to general
  return { valid: true, type: 'general' };
}
```

### Agent-Reach Bridge Function Signatures

```typescript
// LinkedIn profile verification
linkedInGetProfile(url: string): Promise<ToolResult<LinkedInProfileResult>>
// Returns: name, headline, location, summary, experience
// Success = profile verified and has data → LinkedIn score = 100
// Failure = profile unverified → LinkedIn score = 60 (URL exists)
// Error = no URL → LinkedIn score = 0

// Company page verification (alternative)
linkedInReadCompanyPage(companyUrl: string): Promise<ToolResult<LinkedInProfileResult>>
// Returns: industry, size, HQ location
// Used to cross-reference company info
```

### LLM Prompt

Reachability is primarily rule-based, but LLM is used when contact data is ambiguous:

```typescript
const reachabilityClarificationPrompt = `You are a contact data analyst. Given the following contact information for a company, assess the reachability of key decision-makers.

Company contact data:
${JSON.stringify(contactData)}

Return JSON:
{
  "directContactAvailable": true/false,
  "bestChannel": "email" | "phone" | "linkedin" | "none",
  "emailAssessment": {
    "hasDirectEmail": true/false,
    "likelyDecisionMaker": true/false,
    "confidence": 0-100
  },
  "phoneAssessment": {
    "hasDirectLine": true/false,
    "hasMainLine": true/false,
    "confidence": 0-100
  },
  "linkedinAssessment": {
    "profileVerified": true/false,
    "likelyActiveUser": true/false,
    "confidence": 0-100
  },
  "overallReachability": 0-100,
  "reasoning": "Brief explanation"
}`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| LinkedIn verification | `linkedInGetProfile()` via mcporter | `linkedInGetProfile()` via Jina Reader | Assume URL valid but unverified |
| Email validation | Regex-based format check | LLM-based classification | Default to 'general' type |

### Error Handling

```typescript
// LinkedIn verification failure — don't block scoring
try {
  const profileResult = await linkedInGetProfile(lead.linkedinUrl);
  linkedInScore = profileResult.success && profileResult.data.headline ? 100 : 60;
} catch {
  linkedInScore = lead.linkedinUrl ? 60 : 0;  // URL exists but unverified
}
```

### Example Calculation

**Lead:** Contact data: john.smith@acme.io, +1-415-555-0123, linkedin.com/in/johnsmith

| Channel | Assessment | Score | Weight | Weighted |
|---------|-----------|-------|--------|----------|
| Email | Direct email (john.smith@) | 100 | 0.40 | 40 |
| Phone | Main line only | 50 | 0.30 | 15 |
| LinkedIn | Verified profile | 100 | 0.20 | 20 |
| Social | No Twitter | 0 | 0.10 | 0 |
| **Total** | | | | **75** |

### Performance Targets

| Metric | Target |
|--------|--------|
| Email classification accuracy | ≥ 90% |
| LinkedIn verification success | ≥ 80% (when URL provided) |
| Processing time | < 2 seconds |
| Direct contact detection | ≥ 60% of qualified leads |

---

## 5. Strategic Value Rating

### Overview

Assesses the long-term revenue and partnership potential of the account. This factor looks beyond the immediate deal to evaluate whether this lead represents a strategically important account.

### Trigger

| Condition | Description |
|-----------|-------------|
| Part of ICP scoring pipeline | Called during full qualification |
| Account review | Sales team requests strategic assessment |
| Partnership evaluation | Campaign targets partnership-fit companies |

### Input Schema

```typescript
interface StrategicValueInput {
  lead: {
    companyName: string;
    industry: string | null;
    employeeCount: string | null;
    revenueEstimate: string | null;
    website: string | null;
    notes: string | null;
  };
  icp: {
    preferredDealSize: string;
    strategicBoostIndustries: string[];
  };
}
```

### Output Schema

```typescript
interface StrategicValueOutput {
  score: number;                          // 0-100
  breakdown: {
    dealSizePotential: {
      score: number;                      // 0-100
      estimatedRange: string;             // e.g., "$50K-$150K/yr"
      confidence: 'high' | 'medium' | 'low';
    };
    marketInfluence: {
      score: number;                      // 0-100
      factors: string[];                  // e.g., ["Industry leader", "Regular press coverage"]
    };
    partnershipFit: {
      score: number;                      // 0-100
      alignment: string;                  // e.g., "Complementary product — referral potential"
    };
  };
}
```

### Method

```
Step 1: Deal Size Estimation
  - Map company size to deal size benchmarks
  - Adjust for industry (enterprise SaaS = higher deal sizes)
  - If revenue estimate available, use it to refine

Step 2: Market Influence Assessment
  - Search for press coverage, industry awards, thought leadership
  - exaSearch("COMPANY_NAME industry leader award recognition")
  - Score based on visibility

Step 3: Partnership Fit Evaluation
  - Compare lead's industry/product with campaign's strategic goals
  - Identify ecosystem alignment, referral potential, co-marketing opportunities

Step 4: Compute weighted strategic score
  - Deal Size × 0.40 + Market Influence × 0.30 + Partnership Fit × 0.30
```

### Agent-Reach Bridge Function Signatures

```typescript
// Deal size benchmark research
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Example:
//   exaSearch("SaaS average deal size mid-market 2025", 5)
//   exaSearch("consulting industry average contract value", 5)

// Market influence research
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Example:
//   exaSearch("COMPANY_NAME industry leader award recognition press", 5)

// Company website analysis for partnership indicators
webRead(url: string): Promise<ToolResult<WebReadResult>>
// Example:
//   webRead("https://acme.io/partners") — look for partner ecosystem
```

### LLM Prompt

```typescript
const strategicValuePrompt = `You are a strategic account analyst. Assess the strategic value of this lead as a potential customer.

Company: ${lead.companyName}
Industry: ${lead.industry}
Size: ${lead.employeeCount} employees
Revenue: ${lead.revenueEstimate}

Web research about the company:
${JSON.stringify(searchResults)}

Campaign strategic goals:
- Preferred deal size: ${icp.preferredDealSize}
- Strategic boost industries: ${icp.strategicBoostIndustries.join(', ')}

Return JSON:
{
  "dealSizePotential": {
    "score": 0-100,
    "estimatedRange": "$X-$Y/yr",
    "confidence": "high" | "medium" | "low"
  },
  "marketInfluence": {
    "score": 0-100,
    "factors": ["factor1", "factor2"]
  },
  "partnershipFit": {
    "score": 0-100,
    "alignment": "Description of partnership potential"
  },
  "overallStrategicScore": 0-100,
  "reasoning": "Brief explanation"
}`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Deal size estimation | Size-to-benchmark mapping + Exa research | Pure size-based benchmark table |
| Market influence | Exa search results | LLM knowledge about the company |
| Partnership fit | Website partner page + LLM analysis | Industry-based heuristics |

### Example Calculation

**Lead:** Pinnacle Analytics, 300 employees, Financial Services

| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|----------|
| Deal Size (201-500 employees, finance) | 75 | 0.40 | 30 |
| Market Influence (regional player, some press) | 50 | 0.30 | 15 |
| Partnership Fit (data analytics → complementary) | 80 | 0.30 | 24 |
| **Total** | | | **69** |

### Performance Targets

| Metric | Target |
|--------|--------|
| Deal size estimation accuracy | ±30% of actual deal value |
| Market influence assessment accuracy | ≥ 75% |
| Processing time | < 2 seconds (with cached benchmarks) |

---

## 6. Lead Tiering & Classification

### Overview

Maps the composite score to a tier classification (Hot/Warm/Cold) with recommended actions, applying boost and cap rules.

### Trigger

| Condition | Description |
|-----------|-------------|
| Composite score calculated | Final step in ICP scoring pipeline |
| Re-tiering | Lead score has changed |
| Manual tier review | User requests tier re-evaluation |

### Input Schema

```typescript
interface TieringInput {
  compositeScore: number;
  factorScores: {
    firmographic: number;
    intent: number;
    reachability: number;
    strategic: number;
    dataCompleteness: number;
  };
  companySize: string | null;
  signalCount: number;
  hasDirectContact: boolean;
}
```

### Output Schema

```typescript
interface TieringOutput {
  tier: 'hot' | 'warm' | 'cold';
  effectiveScore: number;                 // After boost/cap
  baseScore: number;                      // Before boost/cap
  boostCapApplied: BoostCapRecord[];
  recommendedAction: string;
  recommendedSLA: string;
  recommendedSequence: string;
}

interface BoostCapRecord {
  rule: string;                           // e.g., "intent_boost", "no_contact_cap"
  effect: number;                         // +20, -21 (to cap at 79), etc.
  reason: string;
}
```

### Method

```
Step 1: Set effectiveScore = compositeScore

Step 2: Apply BOOST rules (in order)
  B1: Intent ≥ 70 → effectiveScore += 20 (cap at 100)
  B2: Enterprise (5000+) → effectiveScore += 15 (cap at 100)
  B3: 3+ concurrent signals → effectiveScore += 10 (cap at 100)

Step 3: Apply CAP rules (in order)
  C1: Reachability < 20 → effectiveScore = min(effectiveScore, 79)
  C2: Firmographic < 20 → effectiveScore = min(effectiveScore, 49)
  C3: Data completeness < 15 → effectiveScore = min(effectiveScore, 79)

Step 4: Classify
  effectiveScore >= 80 → Hot
  effectiveScore >= 50 → Warm
  else → Cold

Step 5: Determine recommended action, SLA, and sequence
```

### Agent-Reach Bridge Function Signatures

This skill is purely computational — no Agent-Reach calls required.

### LLM Prompt

Not applicable — tiering is rule-based, not LLM-based. The LLM is only used for the upstream scoring that produces the composite score.

### Fallback Chain

If factor scores are missing or invalid, apply conservative defaults:

```typescript
function safeTiering(input: Partial<TieringInput>): TieringOutput {
  const composite = input.compositeScore ?? 25;
  return {
    tier: composite >= 80 ? 'hot' : composite >= 50 ? 'warm' : 'cold',
    effectiveScore: composite,
    baseScore: composite,
    boostCapApplied: [{ rule: 'fallback_default', effect: 0, reason: 'Missing factor scores — using composite directly' }],
    recommendedAction: 'Manual review recommended — incomplete scoring data',
    recommendedSLA: 'No SLA (requires human review)',
    recommendedSequence: 'Hold until manual review',
  };
}
```

### Error Handling

```typescript
// Validate all scores are in range
for (const [key, value] of Object.entries(factorScores)) {
  if (typeof value !== 'number' || isNaN(value) || value < 0 || value > 100) {
    console.warn(`[Judge] Invalid factor score ${key}: ${value}`);
    factorScores[key] = 0;
  }
}
```

### Example Calculation

**Input:** Composite = 72, Intent = 75, Reachability = 15, 2 signals, 500 employees

```
Step 1: effectiveScore = 72

Step 2: Boosts
  B1: Intent (75) ≥ 70 → +20 → effectiveScore = 92
  B2: Enterprise? No (500 employees)
  B3: 3+ signals? No (2 signals)

Step 3: Caps
  C1: Reachability (15) < 20 → cap at 79 → effectiveScore = 79
  C2: Firmographic check: 85 > 20 → no cap
  C3: Data completeness check: 65 > 15 → no cap

Step 4: 79 >= 50 → Warm

Result:
  Tier: WARM
  Base Score: 72
  Effective Score: 79
  Boosts Applied: Intent boost (+20)
  Caps Applied: No contact cap (capped at 79)
  Recommended Action: Nurture sequence — add direct contact before outreach
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Tier accuracy (vs. eventual conversion) | ≥ 75% |
| Hot tier precision | ≥ 30% conversion rate |
| Processing time | < 50ms (pure computation) |
| Tier distribution | ~15% Hot, ~35% Warm, ~50% Cold |

---

## 7. Lead Disqualification

### Overview

Filters out leads that clearly don't meet minimum qualification criteria, with a full audit trail and reason codes. Disqualification is a strong action — it must be justified and reversible (where appropriate).

### Trigger

| Condition | Description |
|-----------|-------------|
| Pre-scoring disqualification check | Hard rules checked before scoring begins |
| Post-scoring disqualification | Soft rules checked after scoring |
| Manual disqualification | Human reviewer disqualifies a lead |
| Compliance hold | Lead on DNC list or opted out |

### Input Schema

```typescript
interface DisqualificationInput {
  lead: {
    id: string;
    companyName: string;
    industry: string | null;
    employeeCount: string | null;
    country: string | null;
    generalEmail: string | null;
    phoneMain: string | null;
    linkedinUrl: string | null;
  };
  icp: {
    disqualifyIndustries: string[];
    disqualifyCompanySizes: string[];
    competitorNames: string[];
  };
  factorScores?: {
    firmographic: number;
  };
}
```

### Output Schema

```typescript
interface DisqualificationResult {
  disqualified: boolean;
  reasonCode: string | null;
  reasonDescription: string | null;
  severity: 'hard' | 'soft' | null;
  reversible: boolean;
  evidence: {
    fieldName: string;
    fieldValue: unknown;
    ruleCriteria: string;
  } | null;
  auditEntry: DisqualificationAuditEntry | null;
}
```

### Method

```
Step 1: Hard Disqualification Rules (auto-disqualify)
  Rule D1: Industry in disqualifyIndustries → DISQUALIFY (INDUSTRY_MISMATCH)
  Rule D2: Company size in disqualifyCompanySizes → DISQUALIFY (SIZE_MISMATCH)
  Rule D3: Company name matches competitor → DISQUALIFY (COMPETITOR)

Step 2: Soft Disqualification Rules (flag for review)
  Rule D4: No contact channels at all → FLAG (NO_CONTACT_INFO)
  Rule D5: Out of target geography → FLAG (OUT_OF_GEOGRAPHY)
  Rule D6: Firmographic score < 20 → DISQUALIFY (LOW_ICP_FIT)

Step 3: Compliance Rules (always disqualify)
  Rule D7: Lead on DNC list → DISQUALIFY (COMPLIANCE_HOLD)

Step 4: Create audit entry for any disqualification
Step 5: Update lead record with disqualification status
```

### Disqualification Rules Table

| Code | Severity | Reversible | Auto/Manual | Condition |
|------|----------|-----------|-------------|-----------|
| `INDUSTRY_MISMATCH` | Hard | Yes | Auto | Industry in `disqualifyIndustries` |
| `SIZE_MISMATCH` | Hard | Yes | Auto | Size in `disqualifyCompanySizes` |
| `COMPETITOR` | Hard | No | Auto | Name matches `competitorNames` |
| `OUT_OF_GEOGRAPHY` | Hard | Yes | Auto | Location not in target regions |
| `LOW_ICP_FIT` | Hard | Yes | Auto | Firmographic score < 20 |
| `NO_CONTACT_INFO` | Soft | Yes | Auto | Zero contact channels |
| `DUPLICATE` | Hard | No | Auto | Lead already exists in pipeline |
| `MANUAL_REJECT` | Hard | Yes | Manual | Human reviewer rejected |
| `COMPLIANCE_HOLD` | Hard | No | Auto | DNC or opt-out |

### Agent-Reach Bridge Function Signatures

No Agent-Reach calls required — disqualification is purely rule-based using existing lead data.

### LLM Prompt

Not applicable — disqualification is rule-based, not LLM-based. This ensures deterministic, auditable decisions.

### Fallback Chain

If disqualification rules cannot be evaluated (missing data):

```typescript
// If industry is null, cannot determine INDUSTRY_MISMATCH
// → Skip that rule, do NOT assume disqualification
// → Log: "Rule INDUSTRY_MISMATCH skipped — industry field is null"
```

**Principle: When in doubt, do NOT disqualify.** Disqualification requires affirmative evidence.

### Error Handling

```typescript
function evaluateDisqualificationRules(
  lead: Lead,
  icp: ICPDefinition,
  factorScores?: { firmographic: number }
): DisqualificationResult {
  const rules: DisqualificationRule[] = [
    {
      reasonCode: 'INDUSTRY_MISMATCH',
      condition: () => lead.industry && icp.disqualifyIndustries
        .some(i => i.toLowerCase() === lead.industry!.toLowerCase()),
      severity: 'hard',
      reversible: true,
    },
    {
      reasonCode: 'COMPETITOR',
      condition: () => icp.competitorNames
        .some(c => lead.companyName.toLowerCase().includes(c.toLowerCase())),
      severity: 'hard',
      reversible: false,
    },
    // ... more rules
  ];

  for (const rule of rules) {
    try {
      if (rule.condition()) {
        return {
          disqualified: true,
          reasonCode: rule.reasonCode,
          severity: rule.severity,
          reversible: rule.reversible,
          // ... evidence
        };
      }
    } catch (error) {
      // Rule evaluation failed (e.g., null field access)
      // Skip this rule — don't disqualify on error
      console.warn(`[Judge] Rule ${rule.reasonCode} evaluation failed:`, error);
    }
  }

  return { disqualified: false, reasonCode: null, severity: null, reversible: true, evidence: null, auditEntry: null };
}
```

### Example

**Lead:** CloudOps Pro, industry: "Cloud Infrastructure", 5000+ employees

**Rule Check:**
- `INDUSTRY_MISMATCH`: "Cloud Infrastructure" is in `disqualifyIndustries` → **DISQUALIFIED**

```
Result:
  Disqualified: Yes
  Reason: INDUSTRY_MISMATCH
  Evidence: lead.industry = "Cloud Infrastructure" ∈ disqualifyIndustries
  Severity: Hard
  Reversible: Yes (campaign admin can override)
  Audit: Logged with timestamp, lead ID, rule version
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Disqualification accuracy | ≥ 90% (correctly disqualified leads) |
| False positive rate | < 5% (leads disqualified that shouldn't be) |
| Processing time | < 100ms (rule evaluation) |
| Audit trail completeness | 100% (every disqualification has a reason) |

---

## 8. Score Explainability

### Overview

Ensures every score is decomposable into its factor contributions, sub-scores, and the reasoning behind boost/cap adjustments. This skill is not a processing step — it's a design principle that permeates all other skills.

### Trigger

| Condition | Description |
|-----------|-------------|
| After every scoring operation | Explainability is built into the output schema |
| User requests score breakdown | API call for score explanation |
| Human review | Reviewer needs to understand why a lead was scored a certain way |

### Input Schema

```typescript
interface ExplainabilityInput {
  leadId: string;
  scores: ICPScoringOutput;
}
```

### Output Schema

```typescript
interface ScoreExplanation {
  leadId: string;
  compositeScore: number;
  tier: string;

  // Factor decomposition
  factors: Array<{
    name: string;
    score: number;
    weight: number;
    weightedContribution: number;
    percentageOfTotal: string;           // e.g., "34.2%"
    subScores: Array<{
      dimension: string;
      score: number;
      weight: number;
      reasoning: string;
    }>;
  }>;

  // Boost/cap explanation
  adjustments: Array<{
    rule: string;
    effect: string;                      // e.g., "+20 (Intent boost)"
    beforeScore: number;
    afterScore: number;
    reason: string;
  }>;

  // Confidence explanation
  confidence: {
    score: number;
    level: string;
    flags: string[];
    recommendation: string;
  };

  // Natural language summary
  summary: string;                       // "This lead scored 85 (Hot) primarily because of 
                                         // strong firmographic fit (88) and multiple active
                                         // buying signals. A 10-point boost was applied due
                                         // to 3 concurrent intent signals."
}
```

### Method

Score explainability is not a separate computation — it's an **output format** that all scoring skills must produce. Every skill contributes its breakdown to the final explanation.

```
Step 1: Collect all factor breakdowns from each skill
Step 2: Record all boost/cap adjustments applied
Step 3: Compute weighted contributions and percentages
Step 4: Generate natural language summary
Step 5: Format as structured explanation object
```

### Agent-Reach Bridge Function Signatures

No Agent-Reach calls — this is a data transformation skill.

### LLM Prompt

LLM is used only for generating the natural language summary:

```typescript
const explanationPrompt = `You are a lead scoring auditor. Given the following detailed scoring breakdown, write a clear, 2-3 sentence summary explaining why this lead received its score and tier.

Scoring data:
${JSON.stringify(scoringOutput)}

Write a summary that:
1. States the final score and tier
2. Identifies the primary factors that drove the score
3. Notes any boost/cap adjustments
4. Mentions confidence level if below High`;
```

### Example Output

```json
{
  "leadId": "clx123abc",
  "compositeScore": 85,
  "tier": "hot",
  "factors": [
    {
      "name": "Firmographic Fit",
      "score": 88,
      "weight": 0.30,
      "weightedContribution": 26.4,
      "percentageOfTotal": "31.1%",
      "subScores": [
        { "dimension": "Industry", "score": 100, "weight": 0.40, "reasoning": "Exact match: Technology" },
        { "dimension": "Company Size", "score": 100, "weight": 0.25, "reasoning": "In range: 51-200" },
        { "dimension": "Location", "score": 100, "weight": 0.20, "reasoning": "Same city: San Francisco" },
        { "dimension": "Revenue", "score": 60, "weight": 0.15, "reasoning": "Adjacent range" }
      ]
    },
    {
      "name": "Intent Signals",
      "score": 57,
      "weight": 0.25,
      "weightedContribution": 14.25,
      "percentageOfTotal": "16.8%"
    },
    {
      "name": "Reachability",
      "score": 80,
      "weight": 0.20,
      "weightedContribution": 16.0,
      "percentageOfTotal": "18.8%"
    },
    {
      "name": "Strategic Value",
      "score": 65,
      "weight": 0.15,
      "weightedContribution": 9.75,
      "percentageOfTotal": "11.5%"
    },
    {
      "name": "Data Completeness",
      "score": 89,
      "weight": 0.10,
      "weightedContribution": 8.9,
      "percentageOfTotal": "10.5%"
    }
  ],
  "adjustments": [
    {
      "rule": "Multi-signal boost",
      "effect": "+10",
      "beforeScore": 75.3,
      "afterScore": 85.3,
      "reason": "3 concurrent intent signals detected"
    }
  ],
  "confidence": {
    "score": 0.82,
    "level": "high",
    "flags": [],
    "recommendation": "Score with high confidence — data is reliable"
  },
  "summary": "This lead scored 85 (Hot) primarily driven by strong firmographic fit (88) — exact industry match, in-range company size, and same-city location. A 10-point boost was applied due to 3 concurrent intent signals (hiring, funding, and expansion). Confidence is high at 0.82."
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Explanation completeness | 100% (every score has a breakdown) |
| Summary accuracy | ≥ 95% (correctly describes the scoring rationale) |
| Processing time | < 500ms (data transformation only) |

---

## 9. LLM-Based Lead Scoring

### Overview

Describes how Judge uses the LLM (via `z-ai-web-dev-sdk`) to evaluate qualitative factors that cannot be scored by rules alone — such as interpreting search results as intent signals, classifying ambiguous industries, and synthesizing an overall qualification verdict.

### Trigger

| Condition | Description |
|-----------|-------------|
| Every lead qualification | LLM is the core scoring engine for all 5 factors |
| Re-qualification | Lead being re-scored with new data |
| Manual override review | Human asks for LLM re-evaluation |

### Input Schema

```typescript
interface LLMScoringInput {
  leadData: Record<string, unknown>;      // Full lead record
  intentSearchResults: SearchResult[];     // From exaSearch()
  icpCriteria: ICPDefinition;            // Campaign ICP
  previousScores?: Record<string, number>; // For re-qualification comparison
}
```

### Output Schema

```typescript
interface LLMScoringOutput {
  firmographicScore: number;              // 0-100
  intentScore: number;                    // 0-100
  reachabilityScore: number;              // 0-100
  strategicScore: number;                 // 0-100
  dataCompleteness: number;              // 0-100
  leadScore: number;                      // 0-100 (composite)
  leadTier: 'hot' | 'warm' | 'cold';
  reasoning: string;
  keySignals: string[];
  disqualifyReason: string | null;
}
```

### Method

```
Step 1: Assemble context
  - Lead data from database
  - Intent search results from Agent-Reach
  - ICP criteria from campaign

Step 2: Construct scoring prompt
  - Include all lead fields
  - Include search results
  - Specify output format (JSON)
  - Provide scoring rubric

Step 3: Call LLM via z-ai-web-dev-sdk
  - callLLMForJSON() with retry logic
  - Temperature: 0.3 (low creativity, high consistency)
  - Max tokens: 4000

Step 4: Validate and clamp scores
  - Ensure all scores are 0-100
  - Ensure tier is one of: hot, warm, cold
  - Ensure reasoning is non-empty

Step 5: If LLM fails, apply default conservative scores
```

### LLM Integration Details

```typescript
// From agent-executor.ts — the actual implementation
async function callLLM(systemPrompt: string, userMessage: string, retries = 1): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();

      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      });

      const content = result.choices?.[0]?.message?.content || '';
      if (content.trim()) return content;
    } catch (error) {
      if (attempt < retries) continue;
      throw new Error(`LLM call failed: ${error.message}`);
    }
  }
  return '';
}
```

### LLM Prompt (Full Scoring)

```typescript
const scoringPrompt = `You are a lead qualification specialist. Score this lead based on ICP fit and intent signals.

Lead data:
${JSON.stringify({
  companyName: lead.companyName,
  industry: lead.industry,
  website: lead.website,
  city: lead.city,
  country: lead.country,
  employeeCount: lead.employeeCount,
  revenueEstimate: lead.revenueEstimate,
  generalEmail: lead.generalEmail,
  phoneMain: lead.phoneMain,
  linkedinUrl: lead.linkedinUrl,
  keyContactName: lead.keyContactName,
  keyContactTitle: lead.keyContactTitle,
})}

Intent signals from web search:
${JSON.stringify(intentResult.success ? intentResult.data : [])}

Return a JSON object:
{
  "firmographicScore": 0-100,
  "intentScore": 0-100,
  "reachabilityScore": 0-100,
  "strategicScore": 0-100,
  "dataCompleteness": 0-100,
  "leadScore": 0-100 (composite),
  "leadTier": "hot" | "warm" | "cold",
  "reasoning": "Brief explanation of scoring",
  "keySignals": ["Signal 1", ...],
  "disqualifyReason": null | "Reason if disqualified"
}

Scoring guide:
- Firmographic: Industry fit, company size fit, location match
- Intent: Recent hiring, expansion, funding, tech adoption signals
- Reachability: Email/phone availability, LinkedIn presence
- Strategic: Deal size potential, long-term value
- Data Completeness: How much data is filled in`;
```

### JSON Extraction Pipeline

```typescript
// From agent-executor.ts — robust JSON extraction
async function callLLMForJSON<T>(systemPrompt: string, userMessage: string, defaultValue?: T): Promise<T> {
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await callLLM(systemPrompt, userMessage);
    const result = extractJSONFromString<T>(response);
    if (result !== null) return result;

    // Retry with forced JSON instruction
    if (attempt < MAX_RETRIES) {
      const retryPrompt = systemPrompt + '\n\nIMPORTANT: You MUST respond with ONLY valid JSON.';
      const retryResponse = await callLLM(retryPrompt, userMessage);
      const retryResult = extractJSONFromString<T>(retryResponse);
      if (retryResult !== null) return retryResult;
    }
  }

  // All retries exhausted — return default
  if (defaultValue !== undefined) return defaultValue;
  throw new Error('Failed to parse LLM response as JSON');
}
```

### Fallback Chain

| Step | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| LLM call | `z-ai-web-dev-sdk` | Retry with forced JSON prompt | Default conservative scores |
| JSON extraction | Code block strip → balanced JSON → raw parse | Retry with forced prompt | Return default value |
| Score validation | Clamp to 0-100 range | Replace invalid with 0 | Use all defaults |

### Error Handling

```typescript
// Default scores when LLM fails completely
const DEFAULT_SCORES: LLMScoringOutput = {
  firmographicScore: 30,
  intentScore: 20,
  reachabilityScore: 20,
  strategicScore: 20,
  dataCompleteness: 10,
  leadScore: 25,
  leadTier: 'cold',
  reasoning: 'Scored with defaults due to LLM failure',
  keySignals: [],
  disqualifyReason: null,
};
```

### Example LLM Response

```json
{
  "firmographicScore": 85,
  "intentScore": 57,
  "reachabilityScore": 75,
  "strategicScore": 65,
  "dataCompleteness": 80,
  "leadScore": 73,
  "leadTier": "warm",
  "reasoning": "Strong firmographic fit with Technology industry and SF location. Moderate intent with recent hiring signals. Good reachability with direct email and LinkedIn. Strategic value limited by mid-market deal size potential.",
  "keySignals": [
    "Hiring VP of Engineering (20 days ago)",
    "Series B funding (45 days ago)",
    "Direct email available for CTO"
  ],
  "disqualifyReason": null
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| LLM call success rate | ≥ 95% |
| JSON parse success rate | ≥ 98% (after retries) |
| Score consistency (same lead, 3 runs) | ±5 points |
| Processing time per LLM call | < 3 seconds |

---

## 10. Execution Engine Integration

### Overview

Describes how Judge integrates with the Agent Execution Engine (`src/lib/agent-executor.ts`) and the Agent-Reach Bridge (`src/lib/agent-reach-bridge.ts`) at runtime.

### Runtime Handler

```typescript
// In src/lib/agent-executor.ts
async function executeLeadQualification(ctx: AgentExecutionContext): Promise<AgentExecutionResult>
```

### Execution Context

```typescript
interface AgentExecutionContext {
  taskId: string;
  agentName: 'lead-qualification';
  taskType: 'qualify';
  campaignId: string | null;
  input: Record<string, unknown>;
  priority: number;                       // 1-10
}
```

### Execution Flow

```
1. Engine receives task from queue
2. Engine dispatches to executeLeadQualification(ctx)
3. Handler queries DB for leads needing qualification
   └─ Primary: stage = 'enriched', up to 30 leads
   └─ Fallback: stage = 'new' (auto-advance to enriched)
4. For each lead:
   a. exaSearch() → intent signal data
   b. callLLMForJSON() → 5 factor scores + composite + tier
   c. db.lead.update() → write scores, tier, stage = 'qualified'
   └─ Error: Apply default scores, stage as 'qualified' with 'cold' tier
5. Update campaign counts
6. Return AgentExecutionResult with channel activity log
```

### Agent-Reach Bridge Functions Used

| Function | Channel | Operation | Purpose |
|----------|---------|-----------|---------|
| `exaSearch(query, numResults)` | `exa_search` | `intent_search` | Detect buying signals via news/job search |

### Channel Activity Recording

```typescript
channelActivity.push({
  channel: 'exa_search',
  operation: 'intent_search',
  success: intentResult.success,
  timestamp: new Date().toISOString(),
  resultCount: intentResult.success ? intentResult.data.length : 0,
});
```

### Database Operations

```typescript
// Write qualification results
await db.lead.update({
  where: { id: lead.id },
  data: {
    leadScore: scores.leadScore,
    leadTier: scores.leadTier,
    firmographicScore: scores.firmographicScore,
    intentScore: scores.intentScore,
    reachabilityScore: scores.reachabilityScore,
    strategicScore: scores.strategicScore,
    dataCompleteness: scores.dataCompleteness,
    stage: 'qualified',
    qualifiedAt: new Date(),
    notes: [lead.notes, scores.reasoning].filter(Boolean).join('\n\n'),
  },
});
```

### API Dispatch

**Direct API:**

```json
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "lead-qualification",
  "taskType": "qualify",
  "input": {
    "campaignId": "clx...",
    "query": "Technology companies in San Francisco"
  }
}
```

**Via AI Chat:**

```json
POST /api/ai
{ "message": "Qualify the leads in my current campaign" }
```

**Response:**

```json
{
  "success": true,
  "output": {
    "qualified": 12,
    "totalProcessed": 15
  },
  "channelActivity": [
    {
      "channel": "exa_search",
      "operation": "intent_search",
      "success": true,
      "timestamp": "2025-03-04T10:30:00Z",
      "resultCount": 3
    }
  ]
}
```

### Agent Registration

```typescript
// In agent-executor.ts dispatch table
const AGENT_HANDLERS: Record<AgentName, AgentHandler> = {
  // ...
  'lead-qualification': executeLeadQualification,
  // ...
};
```

### Error Recovery at Engine Level

```typescript
// If the entire qualification batch fails
try {
  // ... process leads
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  await updateTaskProgress(ctx.taskId, 0, 'failed');
  return { success: false, output: { error: msg }, channelActivity, error: msg };
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Full batch processing (30 leads) | < 3 minutes |
| Task progress updates | Every 5-10 leads |
| Channel activity logging | 100% of Agent-Reach calls |
| Database write success rate | ≥ 99% |
