# Judge — Lead Qualification Agent

> *"Not every lead deserves your sales team's time. Judge ensures only the right ones get it."*

---

## Table of Contents

1. [Identity & Persona](#1-identity--persona)
2. [Mission Statement](#2-mission-statement)
3. [Core Architecture](#3-core-architecture)
4. [Scoring Model](#4-scoring-model)
5. [ICP Matching Engine](#5-icp-matching-engine)
6. [Intent Signal Detection](#6-intent-signal-detection)
7. [Lead Tiering System](#7-lead-tiering-system)
8. [Disqualification Framework](#8-disqualification-framework)
9. [Decision Framework](#9-decision-framework)
10. [Confidence Scoring](#10-confidence-scoring)
11. [Error Recovery](#11-error-recovery)
12. [Constraints & Guardrails](#12-constraints--guardrails)
13. [Performance Metrics](#13-performance-metrics)
14. [Workflow Examples](#14-workflow-examples)

---

## 1. Identity & Persona

| Attribute | Value |
|-----------|-------|
| **Name** | Judge |
| **Role** | Lead Scoring & Qualification Specialist |
| **Tier** | Primary Agent (pipeline-triggered) |
| **Agent Name Key** | `lead-qualification` |
| **Runtime Handler** | `executeLeadQualification()` in `src/lib/agent-executor.ts` |
| **Icon** | Target |
| **Color** | `#F59E0B` (Amber) |

### Cognitive Style

Judge operates with an **evaluative, evidence-based, fair-but-decisive** cognitive posture:

- **Evaluative**: Every score is computed, not guessed. Judge decomposes qualitative assessments into quantifiable sub-scores with explicit reasoning chains.
- **Evidence-Based**: No factor score is assigned without supporting data. Missing evidence triggers confidence penalties, not assumptions.
- **Fair-but-Decisive**: Judge applies the same rubric uniformly across all leads while remaining decisive — a lead is either qualified or it isn't. Ambiguity is surfaced, not hidden.

### Personality Traits

| Trait | Expression |
|-------|------------|
| Precision | Scores to the point, never rounds lazily |
| Transparency | Every score is decomposable into factor contributions |
| Prudence | Low confidence → explicit flag, never silent failure |
| Consistency | Same inputs always yield same tier classification |
| Decisiveness | Does not defer qualification; makes the call |

### When Judge Speaks (LLM Prompt Voice)

```
You are a lead qualification specialist. You evaluate every lead with forensic
precision. You score based on evidence, not intuition. You are transparent about
what you know and what you don't. You make the call — Hot, Warm, or Cold — and
you stand behind it with a reasoning chain any human can audit.
```

---

## 2. Mission Statement

**Score and rank every lead with precision so the sales team focuses exclusively on highest-potential prospects.**

Judge transforms raw enriched lead data into actionable intelligence by:

1. **Separating signal from noise** — Not every company is a prospect; Judge identifies the ones that are.
2. **Quantifying fit** — Vague feelings of "good fit" become numeric scores with factor-level breakdowns.
3. **Detecting timing** — A perfect-fit company with zero buying signals is less valuable than a decent-fit company actively hiring and expanding.
4. **Preventing wasted effort** — Every hour a sales rep spends on a cold lead is an hour stolen from a hot one.
5. **Building audit trails** — Every scoring decision is explainable, defensible, and reproducible.

---

## 3. Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     JUDGE — Core Architecture               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   ICP Match  │    │   Intent     │    │ Reachability │  │
│  │   Engine     │    │   Signal     │    │ Assessor     │  │
│  │              │    │   Detector   │    │              │  │
│  │ • Industry   │    │ • Exa Search │    │ • Email      │  │
│  │ • Size       │    │ • Web Read   │    │ • Phone      │  │
│  │ • Location   │    │ • LinkedIn   │    │ • LinkedIn   │  │
│  │ • Revenue    │    │ • Twitter    │    │ • Social     │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘  │
│         │                   │                   │           │
│         ▼                   ▼                   ▼           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Multi-Factor Scoring Engine              │   │
│  │                                                      │   │
│  │  Firmographic(30%) + Intent(25%) + Reachability(20%) │   │
│  │            + Strategic(15%) + Data Quality(10%)       │   │
│  │                                                      │   │
│  │  → Composite Score (0-100)                           │   │
│  │  → Confidence Score (0-1.0)                          │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                   │
│         ┌───────────────┼───────────────┐                   │
│         ▼               ▼               ▼                   │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐          │
│  │   Tiering   │ │ Disqualif-  │ │  Confidence  │          │
│  │ Classifer   │ │ ication     │ │  Assessor    │          │
│  │             │ │ Framework   │ │              │          │
│  │ Hot/Warm/   │ │ • Rules     │ │ • Data gaps  │          │
│  │ Cold        │ │ • Audit     │ │ • LLM qual   │          │
│  │             │ │ • Reasons   │ │ • Source rel. │          │
│  └─────────────┘ └─────────────┘ └──────────────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Input | Output |
|-----------|---------------|-------|--------|
| **ICP Match Engine** | Compare lead against campaign ICP | Lead firmographics + ICP definition | Firmographic fit score (0-100) |
| **Intent Signal Detector** | Find buying signals via Agent-Reach | Company name, website, industry | Intent score (0-100) + signal list |
| **Reachability Assessor** | Evaluate contact channel availability | Lead contact data | Reachability score (0-100) + channel ratings |
| **Multi-Factor Scoring Engine** | Compute weighted composite score | 5 factor scores | Composite score (0-100) + breakdown |
| **Tiering Classifier** | Map composite score to tier | Composite score + boost/cap rules | Tier (Hot/Warm/Cold) + recommended action |
| **Disqualification Framework** | Filter out non-qualifying leads | Lead data + disqualification rules | Disqualification status + reason codes |
| **Confidence Assessor** | Quantify uncertainty in scoring | Data completeness + source quality | Confidence score (0-1.0) + uncertainty flags |

---

## 4. Scoring Model

### 4.1 Factor Overview

Judge uses a **5-factor weighted composite model** to score every lead on a 0–100 scale:

| Factor | Weight | Score Range | Description |
|--------|--------|-------------|-------------|
| **Firmographic Fit** | 30% | 0–100 | How well does the lead match the Ideal Customer Profile? |
| **Intent Signals** | 25% | 0–100 | Is the lead showing active buying/expansion signals? |
| **Reachability** | 20% | 0–100 | Can we actually reach the decision-maker? |
| **Strategic Value** | 15% | 0–100 | What is the long-term account potential? |
| **Data Completeness** | 10% | 0–100 | How much verified data do we have? |

### 4.2 Composite Score Calculation

```
Composite = (Firmographic × 0.30) + (Intent × 0.25) + (Reachability × 0.20)
          + (Strategic × 0.15) + (DataCompleteness × 0.10)
```

**Example Calculation:**

| Factor | Score | Weight | Weighted |
|--------|-------|--------|----------|
| Firmographic | 82 | 0.30 | 24.6 |
| Intent | 65 | 0.25 | 16.25 |
| Reachability | 70 | 0.20 | 14.0 |
| Strategic | 55 | 0.15 | 8.25 |
| Data Completeness | 90 | 0.10 | 9.0 |
| **Total** | | | **72.1 → Warm** |

### 4.3 Factor Deep-Dive: Firmographic Fit (30%)

The single heaviest factor. Evaluates whether the lead's company characteristics match what the campaign is targeting.

| Sub-Dimension | Weight within Factor | Scoring Method |
|---------------|---------------------|----------------|
| **Industry Match** | 40% | Exact match = 100, Adjacent industry = 60, No match = 0 |
| **Company Size** | 25% | Within target range = 100, Adjacent range = 60, Outside = 20 |
| **Geographic Fit** | 20% | Same city = 100, Same country = 70, Same region = 40, Other = 10 |
| **Revenue Range** | 15% | Within target = 100, Adjacent = 60, Outside = 20 |

**Industry Matching Logic:**

```
if lead.industry === icp.targetIndustry → 100
else if lead.industry in INDUSTRY_ADJACENCY[icp.targetIndustry] → 60
else → 0
```

Industry adjacency map (examples):
- `Technology` ↔ `Software`, `SaaS`, `IT Services`, `Cloud Computing`
- `Finance` ↔ `Banking`, `Insurance`, `Fintech`, `Investment Management`
- `Healthcare` ↔ `Pharmaceuticals`, `Biotechnology`, `Medical Devices`, `Health Tech`

**Company Size Scoring:**

```typescript
function scoreCompanySize(leadSize: string, targetSize: string): number {
  const sizeRanges: Record<string, [number, number]> = {
    '1-10': [1, 10],
    '11-50': [11, 50],
    '51-200': [51, 200],
    '201-500': [201, 500],
    '501-1000': [501, 1000],
    '1001-5000': [1001, 5000],
    '5000+': [5001, Infinity],
  };

  const [leadMin, leadMax] = sizeRanges[leadSize] || [0, 0];
  const [targetMin, targetMax] = sizeRanges[targetSize] || [0, Infinity];

  if (leadMin >= targetMin && leadMax <= targetMax) return 100;
  // Check adjacent ranges (one step away)
  if (isAdjacent(leadSize, targetSize)) return 60;
  return 20;
}
```

### 4.4 Factor Deep-Dive: Intent Signals (25%)

Detects whether the lead's company is exhibiting active buying or expansion signals that indicate readiness to purchase.

| Signal Type | Points | Detection Method | Agent-Reach Channel |
|-------------|--------|-----------------|---------------------|
| **Active Hiring** | 0–30 | Job postings for relevant roles | `exaSearch("COMPANY hiring ROLE")` |
| **Recent Funding** | 0–25 | Funding round announcements | `exaSearch("COMPANY funding raised Series")` |
| **Office Expansion** | 0–20 | New office/locations announced | `exaSearch("COMPANY new office expanding")` |
| **Tech Adoption** | 0–15 | Technology stack changes, new tool adoption | `exaSearch("COMPANY technology stack adoption")` |
| **Product Launch** | 0–10 | New product/service launches | `exaSearch("COMPANY launches announces product")` |

**Signal Recency Multipliers:**

| Recency | Multiplier | Description |
|---------|-----------|-------------|
| < 30 days | 1.0 | Fresh signal — full weight |
| 30–90 days | 0.7 | Recent signal — reduced weight |
| 90–180 days | 0.4 | Aging signal — significantly reduced |
| > 180 days | 0.2 | Stale signal — minimal weight |

**Intent Score Calculation:**

```
Intent = Σ(signal_points × recency_multiplier) for all detected signals
Capped at 100
```

**Example:**
- Active hiring for CTO (25 pts, 15 days old × 1.0) = 25
- Series B funding (25 pts, 45 days old × 0.7) = 17.5
- New office in London (20 pts, 60 days old × 0.7) = 14
- **Total Intent = 56.5 → rounds to 57**

### 4.5 Factor Deep-Dive: Reachability (20%)

Evaluates the probability of successfully contacting and engaging a decision-maker at the lead's company.

| Channel | Weight | Scoring Criteria |
|---------|--------|-----------------|
| **Email** | 40% | Direct email = 100, General email = 60, No email = 0 |
| **Phone** | 30% | Direct line = 100, Main line = 50, No phone = 0 |
| **LinkedIn** | 20% | Profile verified = 100, URL exists = 60, No profile = 0 |
| **Social/Other** | 10% | Twitter handle = 50, None = 0 |

**Email Format Validation:**

```typescript
function validateEmail(email: string | null): { valid: boolean; type: 'direct' | 'general' | 'invalid' } {
  if (!email) return { valid: false, type: 'invalid' };
  
  const personalPatterns = [
    /^[a-z]+\.[a-z]+@/,     // firstname.lastname@
    /^[a-z]+_[a-z]+@/,      // firstname_lastname@
    /^[a-z][a-z]+[0-9]*@/,  // firstnamelastN@
  ];
  
  const genericPatterns = [
    /^info@/, /^hello@/, /^contact@/, /^sales@/, /^support@/,
    /^admin@/, /^office@/, /^inquiries@/,
  ];
  
  const lower = email.toLowerCase();
  if (personalPatterns.some(p => p.test(lower))) return { valid: true, type: 'direct' };
  if (genericPatterns.some(p => p.test(lower))) return { valid: true, type: 'general' };
  return { valid: true, type: 'general' }; // Default to general for unknown patterns
}
```

**LinkedIn Verification (via Agent-Reach):**

```typescript
// Attempt to verify LinkedIn profile exists and is active
const profileResult = await linkedInGetProfile(lead.linkedinUrl);
if (profileResult.success && profileResult.data.headline) {
  // Profile is verified and has meaningful data
  linkedInScore = 100;
} else if (lead.linkedinUrl) {
  // URL exists but couldn't verify
  linkedInScore = 60;
} else {
  linkedInScore = 0;
}
```

### 4.6 Factor Deep-Dive: Strategic Value (15%)

Assesses the long-term revenue and partnership potential of the account, beyond the immediate deal.

| Sub-Dimension | Weight | Evaluation |
|---------------|--------|------------|
| **Deal Size Potential** | 40% | Based on company size + industry benchmarks |
| **Market Influence** | 30% | Brand recognition, industry leadership, PR presence |
| **Partnership Fit** | 30% | Ecosystem alignment, referral potential, co-marketing opportunity |

**Deal Size Estimation Matrix:**

| Company Size | Typical Deal Range (SaaS) | Score |
|-------------|--------------------------|-------|
| 1-10 | $5K–$20K/yr | 20 |
| 11-50 | $20K–$75K/yr | 40 |
| 51-200 | $50K–$150K/yr | 60 |
| 201-500 | $100K–$300K/yr | 75 |
| 501-1000 | $200K–$500K/yr | 85 |
| 1001-5000 | $300K–$1M/yr | 95 |
| 5000+ | $500K–$5M+/yr | 100 |

### 4.7 Factor Deep-Dive: Data Completeness (10%)

Measures how much verified, populated data exists for the lead. More complete data → more reliable scoring.

**Field Population Scoring:**

| Field Category | Fields | Points per Populated Field |
|---------------|--------|---------------------------|
| Company Identity | companyName, website, industry, legalName | 5 each (max 20) |
| Location | city, country, stateProvince, hqAddress, postalCode | 4 each (max 20) |
| Contact Info | phoneMain, phoneDirect, generalEmail, supportEmail | 5 each (max 20) |
| Key People | ceoName, ceoEmail, keyContactName, keyContactTitle, keyContactEmail | 4 each (max 20) |
| Firmographics | employeeCount, revenueEstimate, foundingYear, ownershipType | 5 each (max 20) |

**Verification Bonus:**
- LinkedIn URL verified via `linkedInGetProfile()`: +10
- Website content successfully read via `webRead()`: +10
- Email format validated: +5

**Total: Sum of field points + verification bonuses, capped at 100.**

---

## 5. ICP Matching Engine

### 5.1 ICP Definition Structure

The Ideal Customer Profile is stored in `Campaign.targetCriteria` as a JSON string:

```typescript
interface ICPDefinition {
  // Firmographic Requirements
  targetIndustries: string[];        // ["Technology", "SaaS", "Fintech"]
  targetCompanySizes: string[];      // ["51-200", "201-500", "501-1000"]
  targetLocations: string[];         // ["San Francisco, USA", "London, UK"]
  targetRevenueRange: {              // Optional revenue range
    min?: string;                    // "$10M"
    max?: string;                    // "$500M"
  };

  // Intent Requirements (thresholds)
  minimumIntentSignals: number;      // e.g., 1 (at least 1 buying signal)

  // Reachability Requirements
  requireDirectEmail: boolean;       // Must have a direct email
  requirePhone: boolean;             // Must have a phone number

  // Strategic Preferences
  preferredDealSize: string;         // "$100K+"
  strategicBoostIndustries: string[]; // Industries that get strategic score boost

  // Disqualification Rules
  disqualifyIndustries: string[];    // Industries to automatically disqualify
  disqualifyCompanySizes: string[];  // Sizes too small/large for the product
  competitorNames: string[];         // Known competitors to disqualify
}
```

### 5.2 ICP Matching Algorithm

```
Step 1: Hard Disqualification Check
  → If lead industry in disqualifyIndustries → DISQUALIFY (industry_mismatch)
  → If lead company size in disqualifyCompanySizes → DISQUALIFY (size_mismatch)
  → If lead.companyName in competitorNames → DISQUALIFY (competitor)

Step 2: Firmographic Sub-Scores
  → industryScore = calculateIndustryMatch(lead.industry, icp.targetIndustries)
  → sizeScore = calculateSizeMatch(lead.employeeCount, icp.targetCompanySizes)
  → locationScore = calculateLocationMatch(lead.city/country, icp.targetLocations)
  → revenueScore = calculateRevenueMatch(lead.revenueEstimate, icp.targetRevenueRange)

Step 3: Weighted Firmographic Score
  → firmographicScore = (industryScore × 0.40) + (sizeScore × 0.25)
                      + (locationScore × 0.20) + (revenueScore × 0.15)

Step 4: ICP Match Verdict
  → If firmographicScore < 20 → DISQUALIFY (low_icp_fit)
  → If firmographicScore >= 20 → PROCEED to full scoring
```

### 5.3 ICP Match Result

```typescript
interface ICPMatchResult {
  score: number;                      // 0-100
  industryMatch: 'exact' | 'adjacent' | 'none';
  sizeMatch: 'in_range' | 'adjacent' | 'out_of_range';
  locationMatch: 'exact' | 'country' | 'region' | 'none';
  revenueMatch: 'in_range' | 'adjacent' | 'out_of_range' | 'unknown';
  disqualificationReason: string | null;
}
```

---

## 6. Intent Signal Detection

### 6.1 Detection Strategy

Judge uses Agent-Reach's `exaSearch()` channel to detect buying signals. The detection follows a **progressive disclosure** pattern:

```
Round 1: Broad Intent Search
  exaSearch("COMPANY_NAME hiring expanding new office funding 2024 2025", 3)

Round 2 (if Round 1 yields signals): Targeted Deepening
  exaSearch("COMPANY_NAME specific_signal_type details", 3)
  webRead("specific_article_url")  // Deep read for signal details

Round 3 (if lead is Hot borderline): Competitive Context
  exaSearch("COMPANY_NAME competitor alternative solution", 3)
```

### 6.2 Signal Classification

| Signal Category | Search Pattern | Score Contribution | Confidence Impact |
|----------------|---------------|-------------------|-------------------|
| **Hiring Signals** | `"COMPANY hiring [role]"` | 0–30 | High (job postings are factual) |
| **Funding Events** | `"COMPANY funding raised Series"` | 0–25 | High (public records) |
| **Expansion Signals** | `"COMPANY new office expanding location"` | 0–20 | Medium (announcements may be vague) |
| **Tech Adoption** | `"COMPANY technology stack tool adoption"` | 0–15 | Medium (inferred from job postings/press) |
| **Product Launch** | `"COMPANY launches product feature"` | 0–10 | Medium (PR may overstate) |

### 6.3 LLM-Based Signal Extraction

Raw search results from `exaSearch()` are fed to the LLM for structured signal extraction:

```typescript
const signalExtractionPrompt = `You are an intent signal analyst. Given web search results 
about a company, identify specific buying signals.

Company: ${lead.companyName}
Industry: ${lead.industry}

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
      "relevance": 0-100  // How relevant to buying intent
    }
  ],
  "overallIntentAssessment": "high" | "moderate" | "low" | "none",
  "keyInsight": "One-sentence summary of the strongest signal"
}`;
```

### 6.4 Intent Score Computation

```typescript
function computeIntentScore(signals: DetectedSignal[]): number {
  let totalPoints = 0;

  for (const signal of signals) {
    const typePoints: Record<string, number> = {
      hiring: 30,
      funding: 25,
      expansion: 20,
      tech_adoption: 15,
      product_launch: 10,
    };

    const recencyMultiplier: Record<string, number> = {
      last_30_days: 1.0,
      last_90_days: 0.7,
      last_180_days: 0.4,
      older: 0.2,
    };

    const strengthMultiplier: Record<string, number> = {
      strong: 1.0,
      moderate: 0.7,
      weak: 0.4,
    };

    const points = typePoints[signal.type] || 10;
    const recency = recencyMultiplier[signal.recency] || 0.2;
    const strength = strengthMultiplier[signal.strength] || 0.4;

    totalPoints += points * recency * strength;
  }

  return Math.min(100, Math.round(totalPoints));
}
```

---

## 7. Lead Tiering System

### 7.1 Tier Definitions

| Tier | Score Range | Description | Color | Action |
|------|-------------|-------------|-------|--------|
| **Hot** | 80–100 | Strong ICP fit + active buying signals + reachable | 🔴 Red | Immediate outreach within 24 hours |
| **Warm** | 50–79 | Good ICP fit but missing signals or lower reachability | 🟡 Amber | Nurture sequence over 2-3 weeks |
| **Cold** | 0–49 | Weak ICP fit or unreachable | 🔵 Blue | Archive or deprioritize |

### 7.2 Tier Classification with Boost/Cap Rules

The base composite score determines the initial tier, but **boost and cap rules** can modify the final tier:

```typescript
function classifyTier(
  compositeScore: number,
  factors: FactorScores,
  icp: ICPDefinition
): TierClassification {

  let effectiveScore = compositeScore;

  // === BOOST RULES (increase tier) ===

  // Rule B1: Strong intent signal → boost by 20 points
  if (factors.intent >= 70) {
    effectiveScore = Math.min(100, effectiveScore + 20);
  }

  // Rule B2: Enterprise account (5000+ employees) → boost strategic by 15
  if (isEnterprise(factors.companySize)) {
    effectiveScore = Math.min(100, effectiveScore + 15);
  }

  // Rule B3: Multiple concurrent signals → boost by 10
  if (factors.signalCount >= 3) {
    effectiveScore = Math.min(100, effectiveScore + 10);
  }

  // === CAP RULES (limit tier) ===

  // Rule C1: No contact info → cap at Warm (max 79)
  if (factors.reachability < 20) {
    effectiveScore = Math.min(79, effectiveScore);
  }

  // Rule C2: Firmographic mismatch → automatic Cold (max 49)
  if (factors.firmographic < 20) {
    effectiveScore = Math.min(49, effectiveScore);
  }

  // Rule C3: Data completeness < 15% → cap at Warm
  if (factors.dataCompleteness < 15) {
    effectiveScore = Math.min(79, effectiveScore);
  }

  // === FINAL CLASSIFICATION ===
  if (effectiveScore >= 80) return { tier: 'hot', score: effectiveScore };
  if (effectiveScore >= 50) return { tier: 'warm', score: effectiveScore };
  return { tier: 'cold', score: effectiveScore };
}
```

### 7.3 Recommended Actions Per Tier

| Tier | Action | SLA | Sequence |
|------|--------|-----|----------|
| **Hot** | Immediate outreach | Within 24 hours | Cold email → LinkedIn connect → Follow-up Day 3 → Follow-up Day 7 |
| **Warm** | Nurture sequence | Within 48 hours | Value-add email → LinkedIn connect → Follow-up Day 7 → Follow-up Day 14 → Break-up Day 21 |
| **Cold** | Archive or low-priority nurture | No SLA | Optional monthly value-add email |

### 7.4 Tier Distribution Targets

Judge aims for a healthy distribution that maximizes sales efficiency:

| Tier | Target % | Rationale |
|------|----------|-----------|
| Hot | ~15% | Few enough that sales can give each full attention |
| Warm | ~35% | Large enough pool for nurture pipeline |
| Cold | ~50% | Expected that half of discovered leads won't qualify |

If the actual distribution deviates significantly (> 2× target for any tier), it signals either:
- **Too many Hot leads** → ICP is too broad; tighten criteria
- **Too many Cold leads** → Discovery agent is finding the wrong companies; refine search
- **Too few Hot leads** → Scoring thresholds may be too strict; review ICP

---

## 8. Disqualification Framework

### 8.1 Disqualification Reasons

| Reason Code | Description | Auto/Manual | Reversible |
|-------------|-------------|-------------|------------|
| `INDUSTRY_MISMATCH` | Lead's industry is in the disqualification list | Auto | Yes |
| `SIZE_MISMATCH` | Company size is outside acceptable range | Auto | Yes |
| `COMPETITOR` | Company is a known competitor | Auto | No |
| `OUT_OF_GEOGRAPHY` | Company is outside target geography | Auto | Yes |
| `LOW_ICP_FIT` | Firmographic score below 20 | Auto | Yes |
| `NO_CONTACT_INFO` | Zero contact channels available | Auto | Yes |
| `DUPLICATE` | Lead already exists in the pipeline | Auto | No |
| `MANUAL_REJECT` | Human reviewer disqualified | Manual | Yes |
| `COMPLIANCE_HOLD` | Lead on DNC or opted out | Auto | No |

### 8.2 Disqualification Rules Engine

```typescript
interface DisqualificationRule {
  reasonCode: string;
  condition: (lead: Lead, icp: ICPDefinition) => boolean;
  severity: 'hard' | 'soft';  // Hard = always disqualify, Soft = flag for review
  reversible: boolean;
}

const DISQUALIFICATION_RULES: DisqualificationRule[] = [
  {
    reasonCode: 'INDUSTRY_MISMATCH',
    condition: (lead, icp) => icp.disqualifyIndustries.includes(lead.industry || ''),
    severity: 'hard',
    reversible: true,
  },
  {
    reasonCode: 'COMPETITOR',
    condition: (lead, icp) => icp.competitorNames.some(
      c => lead.companyName.toLowerCase().includes(c.toLowerCase())
    ),
    severity: 'hard',
    reversible: false,
  },
  {
    reasonCode: 'SIZE_MISMATCH',
    condition: (lead, icp) => icp.disqualifyCompanySizes.includes(lead.employeeCount || ''),
    severity: 'hard',
    reversible: true,
  },
  {
    reasonCode: 'NO_CONTACT_INFO',
    condition: (lead) => !lead.generalEmail && !lead.phoneMain && !lead.linkedinUrl,
    severity: 'soft',  // Flag but don't auto-disqualify
    reversible: true,
  },
  {
    reasonCode: 'LOW_ICP_FIT',
    condition: (lead, icp, scores) => scores.firmographic < 20,
    severity: 'hard',
    reversible: true,
  },
];
```

### 8.3 Audit Trail

Every disqualification is logged with a full audit trail:

```typescript
interface DisqualificationAuditEntry {
  leadId: string;
  reasonCode: string;
  reasonDescription: string;
  ruleVersion: string;         // Version of the rules engine used
  disqualifiedAt: DateTime;
  disqualifiedBy: 'judge' | 'human_reviewer';
  reversible: boolean;
  evidence: {
    fieldName: string;         // Which field triggered the rule
    fieldValue: unknown;       // The actual value
    ruleCriteria: string;      // The rule that was matched
  };
  requalifiedAt: DateTime | null;
  requalifiedBy: string | null;
  requalifiedReason: string | null;
}
```

---

## 9. Decision Framework

### 9.1 Scoring Rules Summary

| Rule | Condition | Effect |
|------|-----------|--------|
| **Firmographic Gate** | Firmographic score < 20 | Cap at Cold tier regardless of other factors |
| **Intent Boost** | Intent score ≥ 70 | +20 to composite, even if firmographics are borderline |
| **No Contact Cap** | Reachability < 20 | Cap at Warm tier (max 79) |
| **Enterprise Boost** | 5000+ employees | +15 to composite |
| **Multi-Signal Boost** | 3+ concurrent intent signals | +10 to composite |
| **Low Data Cap** | Data completeness < 15 | Cap at Warm tier |
| **Competitor Block** | Company is a known competitor | Force Cold tier + disqualification |
| **Hard DQ Override** | Industry/size in disqualification list | Override all scores → disqualify |

### 9.2 Edge Case Handling

| Edge Case | Resolution |
|-----------|------------|
| **Missing industry** | Industry sub-score = 0; Firmographic score calculated from remaining dimensions with re-weighted proportions |
| **Conflicting signals** | Hiring (positive) + layoffs reported (negative) → Net intent = positive signal × 0.5 |
| **Very new company** (< 1 year) | Reduced firmographic score (lack of track record), but intent signal weight increased by 1.2× |
| **Extremely large company** (100K+ employees) | Strategic value capped at 85 (large orgs have longer sales cycles) |
| **LLM returns out-of-range score** | Clamp to 0–100 range; log warning |
| **LLM returns non-numeric score** | Use default factor score (30 for firmographic, 20 for others); log error |
| **Multiple LLM calls return inconsistent scores** | Take the average; flag for human review |

### 9.3 Decision Tree (Simplified)

```
START
  │
  ├─ Is lead in disqualification list?
  │   └─ YES → DISQUALIFY (with reason code)
  │
  ├─ Firmographic score < 20?
  │   └─ YES → COLD (firmographic mismatch overrides all)
  │
  ├─ Reachability < 20 (no contact channels)?
  │   └─ YES → CAP at Warm (max score = 79)
  │
  ├─ Composite score >= 80?
  │   └─ YES → HOT (immediate outreach)
  │
  ├─ Composite score >= 50?
  │   └─ YES → WARM (nurture sequence)
  │
  └─ Otherwise → COLD (archive/deprioritize)
```

---

## 10. Confidence Scoring

### 10.1 Why Confidence Matters

A score of 85/100 with 95% confidence is very different from 85/100 with 40% confidence. Judge expresses its own uncertainty so humans can prioritize manual review where it matters most.

### 10.2 Confidence Calculation

```typescript
function calculateConfidence(
  factorScores: FactorScores,
  dataCompleteness: number,
  sourceQuality: SourceQuality
): ConfidenceResult {

  // Base confidence from data completeness
  let confidence = dataCompleteness / 100;

  // Penalize for missing critical fields
  const criticalFields = ['industry', 'employeeCount', 'country'];
  const missingCritical = criticalFields.filter(f => !factorScores[f]);
  confidence -= missingCritical.length * 0.15;

  // Penalize for LLM-derived vs. factual data
  const llmDerivedRatio = sourceQuality.llmDerivedFields / sourceQuality.totalFields;
  confidence -= llmDerivedRatio * 0.2;

  // Penalize for old data
  if (factorScores.lastUpdated > 90) confidence -= 0.1;

  // Boost for verified data
  if (sourceQuality.linkedInVerified) confidence += 0.1;
  if (sourceQuality.websiteVerified) confidence += 0.05;

  // Clamp to [0, 1]
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    score: confidence,
    level: confidence >= 0.8 ? 'high' : confidence >= 0.5 ? 'medium' : 'low',
    flags: [
      ...(missingCritical.length > 0 ? [`Missing critical fields: ${missingCritical.join(', ')}`] : []),
      ...(llmDerivedRatio > 0.5 ? ['High LLM derivation ratio'] : []),
      ...(factorScores.lastUpdated > 90 ? ['Data is older than 90 days'] : []),
    ],
    recommendation: confidence < 0.4
      ? 'Manual review recommended — insufficient data for reliable scoring'
      : confidence < 0.7
        ? 'Score with moderate confidence — some gaps exist'
        : 'Score with high confidence — data is reliable',
  };
}
```

### 10.3 Confidence Levels

| Level | Range | Interpretation | Action |
|-------|-------|---------------|--------|
| **High** | 0.80–1.0 | Score is reliable; proceed automatically | Auto-advance to outreach |
| **Medium** | 0.50–0.79 | Score is directional but has gaps | Proceed but flag for spot-check |
| **Low** | 0.00–0.49 | Score is unreliable; data is insufficient | Hold for manual review |

---

## 11. Error Recovery

### 11.1 Error Scenarios & Recovery Strategies

| Error Scenario | Detection | Recovery Strategy |
|----------------|-----------|-------------------|
| **Agent-Reach channel failure** | `exaSearch()` returns `success: false` | Skip intent scoring; set intent to 0; reduce confidence; flag for re-qualification |
| **LLM timeout** | `callLLM()` throws after retries | Apply default factor scores (30/20/20/20/10); set confidence to Low; add audit note |
| **LLM returns invalid JSON** | `callLLMForJSON()` returns `null` after retries | Same as LLM timeout fallback |
| **LLM returns out-of-range scores** | Any factor score > 100 or < 0 | Clamp to valid range; log warning |
| **No enriched leads in DB** | `db.lead.findMany()` returns empty for `stage: 'enriched'` | Fallback: qualify `stage: 'new'` leads directly with auto-advance |
| **Database write failure** | `db.lead.update()` throws | Retry once; if still fails, log error and continue to next lead |
| **All channels return no results** | Intent search returns 0 signals | Set intent score to 0; rely on firmographic + reachability only; note in audit |

### 11.2 Graceful Degradation Priority

Judge follows a **never-crash, always-score** philosophy:

1. **Best case**: All channels return data → LLM produces accurate scores → full 5-factor scoring
2. **Good case**: Some channels fail → score with available data → reduce confidence → flag gaps
3. **Acceptable case**: All Agent-Reach channels fail → LLM scores based on existing enriched data only
4. **Fallback case**: LLM also fails → apply default conservative scores → stage as `qualified` with `cold` tier → add audit note for human review

```typescript
// From agent-executor.ts — the actual fallback pattern:
try {
  const scores = await callLLMForJSON(/* ... */);
  // Use LLM-generated scores
} catch (leadError) {
  // RESILIENCE: Still qualify with default scores if LLM fails
  await db.lead.update({
    where: { id: lead.id },
    data: {
      leadScore: 25,
      leadTier: 'cold',
      firmographicScore: 30,
      intentScore: 20,
      reachabilityScore: 20,
      strategicScore: 20,
      dataCompleteness: 10,
      stage: 'qualified',
      qualifiedAt: new Date(),
      notes: '[Qualified with default scores — LLM scoring failed]',
    },
  });
}
```

---

## 12. Constraints & Guardrails

### 12.1 Explainability Requirements

- **Every score must be decomposable** into its 5 factor contributions and their sub-scores.
- **Every tier classification must have a reasoning chain** that a human can audit.
- **Every disqualification must have a reason code** and supporting evidence.
- **Score adjustments (boosts/caps) must be individually documented** — not just the final number.

### 12.2 Minimum Data Points

| Scenario | Minimum Required | Action if Below Minimum |
|----------|-----------------|------------------------|
| Full 5-factor scoring | 3 verified data fields | Mark as "Insufficient Data"; assign Low confidence |
| Firmographic scoring | Company name + at least 1 of: industry, size, location | Score with available fields; null fields score 0 |
| Intent scoring | Company name (for search) | If company name is missing, intent score = 0 |
| Reachability scoring | At least 1 contact channel | If zero channels, reachability = 0; apply No Contact Cap |

### 12.3 Fairness Rules

1. **Never auto-disqualify based on a single factor.** Even a firmographic mismatch is reviewable.
2. **Geographic bias guard**: Location scoring must not penalize companies in emerging markets unless the ICP explicitly requires specific geography.
3. **Size bias guard**: Small companies should not be systematically Cold-tiered if the ICP includes their size range.
4. **Industry adjacency**: Companies in adjacent industries should receive partial credit, not zero.
5. **Scoring model parameters are configurable per campaign** — no universal thresholds.

### 12.4 Rate & Resource Limits

| Limit | Value | Rationale |
|-------|-------|-----------|
| Max leads per qualification batch | 30 | Prevent runaway processing; maintain LLM quality |
| Max Agent-Reach calls per lead | 5 | 1 intent search + 2 LinkedIn verification + 2 deep reads |
| Max LLM retries per lead | 2 | Avoid infinite retry loops |
| Qualification timeout per lead | 30 seconds | Don't block the pipeline on a single lead |
| Minimum time between re-qualifications | 7 days | Don't re-score unchanged leads |

---

## 13. Performance Metrics

### 13.1 Scoring Accuracy

| Metric | Target | Measurement |
|--------|--------|-------------|
| Score-to-conversion correlation | ≥ 0.70 | Compare lead scores at qualification time with eventual closed_won/closed_lost outcomes |
| Hot tier conversion rate | ≥ 30% | % of Hot leads that reach closed_won |
| Warm tier conversion rate | ≥ 10% | % of Warm leads that reach closed_won |
| Cold tier false negative rate | < 5% | % of Cold leads that would have converted |

### 13.2 Tier Distribution

| Tier | Target | Measurement |
|------|--------|-------------|
| Hot | ~15% | Count of Hot leads / Total qualified leads |
| Warm | ~35% | Count of Warm leads / Total qualified leads |
| Cold | ~50% | Count of Cold leads / Total qualified leads |

### 13.3 Processing Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time per lead | < 5 seconds | Wall-clock time from qualification start to score written |
| Time per batch (30 leads) | < 3 minutes | Total pipeline processing time |
| LLM call success rate | ≥ 95% | Successful JSON responses / Total LLM calls |
| Agent-Reach channel success rate | ≥ 80% | Successful channel calls / Total channel calls |

### 13.4 Data Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| Average data completeness per lead | ≥ 60% | Average percentage of populated fields across qualified leads |
| Disqualification accuracy | ≥ 90% | % of disqualified leads that would not have converted |
| Confidence score distribution | Median ≥ 0.6 | Central tendency of confidence scores across all qualified leads |

---

## 14. Workflow Examples

### 14.1 Example 1: Hot Lead Qualification

**Lead:** TechVista Solutions, a 200-person SaaS company in San Francisco

**Step 1 — ICP Check:**
- Campaign targets: Technology industry, 51-500 employees, US-based
- TechVista: Technology ✓, 51-200 employees ✓, San Francisco ✓
- **Firmographic Score: 88** (Industry exact match: 100 × 0.40 + Size in range: 100 × 0.25 + Location exact: 100 × 0.20 + Revenue adjacent: 60 × 0.15 = 40 + 25 + 20 + 9 = 94... adjusted to 88 after LLM nuance)

**Step 2 — Intent Signal Detection:**
- `exaSearch("TechVista Solutions hiring expanding new office funding 2024 2025")` → 3 results
  - "TechVista Solutions hiring VP of Engineering" (15 days old) → Hiring signal: 30 × 1.0 × 1.0 = 30
  - "TechVista raises $25M Series B" (45 days old) → Funding signal: 25 × 0.7 × 1.0 = 17.5
  - "TechVista opens New York office" (60 days old) → Expansion signal: 20 × 0.7 × 0.7 = 9.8
- **Intent Score: 57** (30 + 17.5 + 9.8 = 57.3)

**Step 3 — Reachability Assessment:**
- Direct email of CTO: john.chen@techvista.io → Email score: 100 × 0.40 = 40
- Phone main line: +1-415-555-0123 → Phone score: 50 × 0.30 = 15
- LinkedIn URL verified: linkedin.com/company/techvista → LinkedIn score: 100 × 0.20 = 20
- Twitter: @techvista → Social score: 50 × 0.10 = 5
- **Reachability Score: 80** (40 + 15 + 20 + 5)

**Step 4 — Strategic Value:**
- Deal size potential (200-person SaaS): ~$100K/yr → Score: 60 × 0.40 = 24
- Market influence (growing SaaS brand, PR presence): Score: 70 × 0.30 = 21
- Partnership fit (complementary tech): Score: 65 × 0.30 = 19.5
- **Strategic Score: 65** (24 + 21 + 19.5 = 64.5)

**Step 5 — Data Completeness:**
- Company identity: 4/4 fields = 20
- Location: 3/5 fields = 12
- Contact: 3/4 fields = 15
- Key people: 3/5 fields = 12
- Firmographics: 4/4 fields = 20
- Verification: LinkedIn verified (+10), website read (+10) = 20
- **Data Completeness: 89** (20 + 12 + 15 + 12 + 20 + 20 = 99, capped at 89 for missing fields)

**Step 6 — Composite Score:**
```
Composite = (88 × 0.30) + (57 × 0.25) + (80 × 0.20) + (65 × 0.15) + (89 × 0.10)
         = 26.4 + 14.25 + 16.0 + 9.75 + 8.9
         = 75.3
```

**Step 7 — Boost/Cap Application:**
- Intent score ≥ 70? No (57). No intent boost.
- Enterprise (5000+)? No. No enterprise boost.
- Reachability < 20? No. No contact cap.
- Firmographic < 20? No. No firmographic gate.

**Wait — Intent is 57, not ≥ 70.** But we have 3 concurrent signals. Apply multi-signal boost:
- 3 concurrent signals → +10
- **Effective Score: 75.3 + 10 = 85.3**

**Step 8 — Tier Classification:**
- Effective score = 85.3 → ≥ 80 → **HOT** 🔴

**Result:**
```
Lead: TechVista Solutions
Composite Score: 85
Tier: HOT
Confidence: 0.82 (High)
Recommended Action: Immediate outreach within 24 hours
Key Signals: Hiring VP of Eng, $25M Series B, NYC office expansion
Reasoning: Strong ICP fit with multiple active buying signals and verified contact channels
```

---

### 14.2 Example 2: Warm Lead with Low Reachability

**Lead:** Meridian Consulting, a 75-person consulting firm in London

**Step 1 — ICP Check:**
- Campaign targets: Technology industry, 51-500, US/UK
- Meridian: Consulting (adjacent to Technology) ✓, 51-200 ✓, London ✓
- **Firmographic Score: 68** (Adjacent industry: 60 × 0.40 + Size in range: 100 × 0.25 + Location country: 70 × 0.20 + Revenue unknown: 40 × 0.15 = 24 + 25 + 14 + 6 = 69, adjusted)

**Step 2 — Intent Signal Detection:**
- `exaSearch("Meridian Consulting hiring expanding new office funding 2024 2025")` → 1 result
  - "Meridian Consulting looking to expand digital practice" (75 days old, moderate strength)
  - Expansion signal: 20 × 0.4 × 0.7 = 5.6
- **Intent Score: 6** (5.6, very low)

**Step 3 — Reachability Assessment:**
- General email: info@meridianconsulting.co.uk → Email score: 60 × 0.40 = 24
- Phone main line: +44-20-7946-0958 → Phone score: 50 × 0.30 = 15
- LinkedIn URL exists but unverified → LinkedIn score: 60 × 0.20 = 12
- No Twitter → Social score: 0 × 0.10 = 0
- **Reachability Score: 51** (24 + 15 + 12 + 0)

**Step 4 — Strategic Value:**
- Deal size potential (75-person consulting): ~$50K/yr → Score: 40 × 0.40 = 16
- Market influence (regional player): Score: 40 × 0.30 = 12
- Partnership fit (consulting → referral partner potential): Score: 75 × 0.30 = 22.5
- **Strategic Score: 51** (16 + 12 + 22.5 = 50.5)

**Step 5 — Data Completeness:**
- Company identity: 3/4 = 15, Location: 2/5 = 8, Contact: 2/4 = 10, People: 0/5 = 0, Firmographics: 2/4 = 10
- Verification: LinkedIn unverified (+0), no website data (+0)
- **Data Completeness: 43**

**Step 6 — Composite Score:**
```
Composite = (68 × 0.30) + (6 × 0.25) + (51 × 0.20) + (51 × 0.15) + (43 × 0.10)
         = 20.4 + 1.5 + 10.2 + 7.65 + 4.3
         = 44.05
```

**Step 7 — No boosts/caps apply.**

**Step 8 — Tier Classification:**
- Score = 44 → < 50 → **COLD** 🔵

However, with partnership fit at 75 and firmographic at 68, this is a borderline Cold. Judge flags this for human review:

```
Lead: Meridian Consulting
Composite Score: 44
Tier: COLD
Confidence: 0.45 (Low)
Flag: Borderline Cold — high partnership potential may warrant Warm tier
Recommended Action: Human review recommended; potential nurture if partnership
  value is prioritized by the campaign
```

---

### 14.3 Example 3: Disqualification

**Lead:** CloudOps Direct, a cloud infrastructure company

**Step 1 — ICP Check:**
- Campaign targets: Technology industry, 51-500 employees
- **Disqualification check**: Campaign's `disqualifyIndustries` includes `"Cloud Infrastructure"` (because the product competes in this space)
- **Result: DISQUALIFIED** — `INDUSTRY_MISMATCH`

```
Lead: CloudOps Direct
Status: DISQUALIFIED
Reason: INDUSTRY_MISMATCH
Evidence: lead.industry = "Cloud Infrastructure" ∈ icp.disqualifyIndustries
Reversible: Yes (by campaign admin)
```

---

### 14.4 Runtime Execution Flow

This is how Judge executes in the actual runtime (`executeLeadQualification()` in `src/lib/agent-executor.ts`):

```
1. Engine calls executeLeadQualification(ctx)
2. Query DB for leads where stage = 'enriched' (up to 30)
   └─ FALLBACK: If none, query stage = 'new' and auto-advance
3. For each lead:
   a. exaSearch("COMPANY hiring expanding funding 2024 2025") → intent data
   b. Call LLM with scoring prompt → 5 factor scores + composite + tier
   c. Update lead in DB with scores, tier, stage = 'qualified'
   └─ ERROR: If LLM fails, apply default conservative scores
4. Update task progress
5. Return result with channel activity log
```

**Agent-Reach Bridge Functions Used:**

| Function | Channel | Purpose |
|----------|---------|---------|
| `exaSearch(query, numResults)` | `exa_search` | Intent signal detection via news and job posting search |

**API Dispatch:**

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

**Or via AI Chat:**

```json
POST /api/ai
{ "message": "Qualify the leads in my current campaign" }
```

AI parses intent → Dispatches to `lead-qualification` agent → Agent-Reach searches for intent signals → Qualified leads scored and stored in DB.
