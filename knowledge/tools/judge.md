---
title: "Judge — Lead Qualification Agent Tools"
category: tool
agent: judge
role: lead-qualification
tags: [judge, qualification, scoring, bant, meddic]
last_reviewed: "2026-06-22"
grade: "A"
---

# Judge — Lead Qualification Agent Tools

## 1. Role

Judge takes enriched leads from Forge and research from Sage, and applies a quantitative qualification framework. Judge's defining principle is **evidence-based scoring** — every score is computed from observable data, not guessed.

## 2. Cognitive Posture

- **Evaluative**: Every score is computed, not guessed.
- **Evidence-based**: Qualification is grounded in observable signals.
- **Fair-but-decisive**: Same rubric applied uniformly; ambiguity surfaced, not hidden.

## 3. Tools

### Tool: qualify_lead

**Purpose**: Apply the 5-factor scoring model to a lead.

**Input**: Enriched lead (from Forge) + research findings (from Sage).

**Output**:
- `composite_score` (0–100)
- `tier` (A, B, C, D)
- `factor_scores`: {
    `firmographic_fit`: 0–100,
    `technographic_fit`: 0–100,
    `behavioral_signals`: 0–100,
    `intent_signals`: 0–100,
    `partnership_fit`: 0–100
  }
- `confidence` (0–100)
- `reasoning` (string): Explanation of the score.
- `next_actions` (array): Recommended next steps.

### Tool: score_bant

**Purpose**: Score a lead on BANT (Budget, Authority, Need, Timeline).

**Input**: Lead + research findings.

**Output**: BANT scores (each 0–100) + composite + reasoning.

### Tool: score_meddic

**Purpose**: Score a lead on MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion).

**Input**: Lead + research findings.

**Output**: MEDDIC scores (each 0–100) + composite + reasoning.

### Tool: detect_intent

**Purpose**: Detect buying intent signals from web research.

**Input**: Account name.

**Output**: Array of intent signals with:
- `signal_type` (e.g., "hiring_sdr", "funding_announcement", "new_cro")
- `signal_strength` (0–100)
- `source_url`, `date`

### Tool: classify_tier

**Purpose**: Classify a lead into tier A/B/C/D based on composite score.

**Input**: Composite score + confidence.

**Output**:
- `tier` (A: 80+, B: 65–79, C: 50–64, D: <50)
- `recommended_action`:
  - A: Immediate outreach to Bard
  - B: Outreach within 7 days
  - C: Nurture; re-evaluate quarterly
  - D: Discard

### Tool: surface_ambiguity

**Purpose**: When qualification is uncertain, surface the ambiguity for human review.

**Input**: Lead + score + confidence.

**Output**:
- `ambiguous` (boolean)
- `questions_for_human` (array)

## 4. Scoring Formula

```
composite_score = (
  firmographic_fit * 0.20 +
  technographic_fit * 0.15 +
  behavioral_signals * 0.30 +
  intent_signals * 0.25 +
  partnership_fit * 0.10
)

# Confidence reduces with missing data
confidence = 100 - (missing_factors * 15)
```

## 5. Tier Definitions

| Tier | Score | Action | Expected Conversion |
|------|-------|--------|---------------------|
| A | 80+ | Immediate outreach | 25–35% |
| B | 65–79 | Outreach within 7 days | 12–20% |
| C | 50–64 | Nurture; re-evaluate quarterly | 3–8% |
| D | <50 | Discard | <2% |

## 6. Performance Metrics

| Metric | Target |
|--------|--------|
| Score calibration (predicted vs actual conversion) | Within ±5pp |
| Tier A conversion rate | >25% |
| Tier D conversion rate | <2% |
| Confidence calibration | Within ±10pp |
| Ambiguity surfacing rate | 5–15% (too low = overconfident; too high = underconfident) |

## 7. Handoffs

- **From Atlas**: Enriched leads ready for qualification.
- **From Forge**: Enriched lead records.
- **From Sage**: Research findings for intent detection.
- **To Bard**: Tier A + B leads ready for outreach.
- **To Flow**: All qualified leads for pipeline tracking.
