---
title: "Lead Scoring Engine"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [lead-scoring, scoring, qualification, prioritization, model, ai]
---

# Lead Scoring Engine

## 1. Overview

LeadReach's Lead Scoring Engine, powered by the Judge agent, uses a multi-dimensional scoring model that combines firmographic fit, technographic alignment, intent signals, and engagement data to produce a composite ICP score (0-100). The scoring model is continuously refined through feedback loops and A/B testing to optimize conversion prediction accuracy.

## 2. Scoring Dimensions

### Dimension Weights

| Dimension | Weight | Description |
|-----------|--------|-------------|
| Firmographic Fit | 35% | Company size, industry, revenue, location |
| Technographic Alignment | 20% | Technology stack compatibility |
| Intent Signals | 20% | Buying intent and trigger events |
| Engagement Level | 15% | Interaction depth and recency |
| BANT Overlay | 10% | Budget, Authority, Need, Timeline signals |

### Firmographic Scoring (0-35)

| Criterion | Max Points | Scoring Rules |
|-----------|-----------|---------------|
| Industry Match | 10 | Exact ICP industry: 10, Adjacent: 5, Other: 0 |
| Employee Count | 8 | In ICP range: 8, Adjacent: 4, Outside: 0 |
| Revenue Range | 7 | In ICP range: 7, Adjacent: 3, Unknown: 2 |
| Geography | 5 | Target region: 5, Adjacent: 2, Other: 0 |
| Company Stage | 5 | Ideal stage: 5, Compatible: 2, Other: 0 |

### Technographic Scoring (0-20)

| Criterion | Max Points | Scoring Rules |
|-----------|-----------|---------------|
| Tech Stack Match | 8 | Uses complementary tech: 8, Neutral: 4, Competing: 0 |
| Cloud Provider | 4 | Same cloud: 4, Compatible: 2, Unknown: 1 |
| Integration Potential | 4 | High: 4, Medium: 2, Low: 0 |
| Tech Maturity | 4 | Early adopter: 4, Mainstream: 2, Laggard: 0 |

### Intent Scoring (0-20)

| Signal Type | Max Points | Decay |
|-------------|-----------|-------|
| Third-party intent topic match | 8 | 10% per week |
| Website visit (pricing page) | 5 | 20% per week |
| Content download | 4 | 15% per week |
| Job posting (relevant role) | 3 | No decay (event-based) |

### Engagement Scoring (0-15)

| Activity | Points | Decay |
|----------|--------|-------|
| Email opened | 1 | 5% per day |
| Email clicked | 2 | 5% per day |
| Meeting booked | 5 | 10% per week |
| Demo requested | 4 | No decay |
| Reply received | 3 | 5% per day |

### BANT Overlay (0-10)

| Factor | Points | Detection Method |
|--------|--------|-----------------|
| Budget | 3 | Funding signals, company size, spend indicators |
| Authority | 3 | Title seniority, decision-maker signals |
| Need | 2 | Pain points mentioned, competitor usage |
| Timeline | 2 | Trigger events, contract renewal dates |

## 3. Score Interpretation

| Score Range | Grade | Classification | Action |
|-------------|-------|---------------|--------|
| 90-100 | A+ | Hot Lead | Immediate outreach, priority routing |
| 80-89 | A | Qualified Lead | Fast-track outreach, assigned rep |
| 70-79 | B | Warm Lead | Standard outreach cadence |
| 60-69 | C | Nurture Lead | Long-term nurture campaign |
| 50-59 | D | Low Priority | Light nurture, periodic check |
| 0-49 | F | Disqualified | Archive, monitor for changes |

## 4. Model Training

### Training Data

- Historical win/loss data from CRM
- Conversion outcomes by score range
- Agent feedback on lead quality
- Rep activity and outcome data

### Model Types

| Model | Use Case | Update Frequency |
|-------|----------|-----------------|
| Rule-based | Default scoring | Manual updates |
| Logistic Regression | Simple conversion prediction | Monthly |
| Gradient Boosted Trees | Multi-dimensional scoring | Weekly |
| Neural Network | Complex pattern detection | Daily (online learning) |

### A/B Testing

LeadReach supports A/B testing of scoring models:
1. Route 50% of leads through Model A, 50% through Model B
2. Measure conversion rate by score range
3. Statistical significance test (p < 0.05)
4. Promote winner to production

## 5. Custom Scoring Rules

Users can define custom scoring overrides:

```yaml
custom_rules:
  - name: "enterprise_boost"
    condition: employee_count > 1000
    action: add_score(10)
    
  - name: "competitor_penalty"
    condition: uses_competitor == true
    action: add_score(-15)
    
  - name: "trigger_event_boost"
    condition: trigger_event == "funding_round"
    action: add_score(20)
    
  - name: "stale_engagement_decay"
    condition: last_engagement_days > 30
    action: multiply_score(0.8)
```

## 6. Integration Points

| Integration | Direction | Data |
|-------------|-----------|------|
| Scout → Judge | Input | Raw prospect data |
| Forge → Judge | Input | Enrichment data |
| Sage → Judge | Input | Research insights |
| Judge → Bard | Output | Qualified leads + scores |
| Judge → CRM | Output | Score updates |
| Judge → Flow | Output | Pipeline routing |
| CRM → Judge | Feedback | Win/loss outcomes |

## 7. Monitoring

| Metric | Target | Alert |
|--------|--------|-------|
| Scoring accuracy | >75% (A-grades convert) | <65% |
| Score distribution | Bell curve centered at 60 | Skewed >80% below 40 |
| Model drift | <5% per month | >10% per month |
| Processing time | <2 seconds per lead | >5 seconds |
| False positive rate | <20% | >30% |
