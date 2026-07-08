---
title: "Outreach Automation Engine"
category: product
grade: A
last_reviewed: 2026-07-08
tags: [outreach, automation, sequences, cadence, email, linkedin, personalization]
---

# Outreach Automation Engine

## 1. Overview

LeadReach's Outreach Automation Engine, powered by the Bard agent, generates highly personalized, multi-channel outreach sequences that combine email, LinkedIn, and phone touchpoints. The engine leverages AI-driven personalization, send-time optimization, and compliance guardrails to maximize response rates while maintaining deliverability.

## 2. Sequence Builder

### Sequence Architecture

Each outreach sequence consists of:

| Component | Description |
|-----------|-------------|
| Template | Base message structure with personalization tokens |
| Triggers | When and how to send each step |
| Channels | Email, LinkedIn, Phone |
| Timing | Delays between steps |
| Conditions | Branching logic based on engagement |
| Fallback | Alternative path if primary fails |

### Personalization Engine

The Bard agent personalizes each message using:

| Data Source | Personalization Type | Example |
|-------------|---------------------|---------|
| Company research | Industry-specific pain points | "As a fintech scaling post-Series B..." |
| Contact role | Role-relevant value props | "...help VPs of Sales hit quota faster" |
| Trigger events | Timely context | "Congrats on the Series C..." |
| Technographic | Tech-specific integration | "Since you use Salesforce..." |
| Recent activity | Engagement-aware | "I noticed your team downloaded our..." |

### Personalization Tokens

```
{{company_name}}          - Target company name
{{contact_first_name}}   - Prospect first name
{{contact_title}}        - Job title
{{industry_pain_point}}  - AI-generated industry pain point
{{trigger_event}}        - Recent trigger event reference
{{tech_integration}}     - Relevant tech stack reference
{{competitor_mention}}   - Competitor displacement angle
{{value_proposition}}    - ICP-aligned value prop
```

## 3. Multi-Channel Orchestration

### Channel Sequencing

```
Day 1:  LinkedIn connection request
Day 2:  Email #1 (first touch)
Day 4:  LinkedIn message (if connected)
Day 5:  Email #2 (value-add follow-up)
Day 8:  Phone call attempt #1
Day 10: Email #3 (social proof)
Day 14: Email #4 (breakup)
```

### Send-Time Optimization

| Channel | Best Day | Best Time (recipient TZ) | Worst Time |
|---------|----------|--------------------------|------------|
| Email | Tue-Thu | 8:00-10:00 AM | Mon 8 AM, Fri 5 PM |
| LinkedIn | Tue-Wed | 7:00-9:00 AM | Weekend |
| Phone | Tue-Thu | 10:00-11:30 AM | Mon AM, Fri PM |

### A/B Testing Framework

| Element | Testable | Sample Size Needed |
|---------|----------|-------------------|
| Subject line | Yes | 100 per variant |
| CTA | Yes | 150 per variant |
| Channel mix | Yes | 200 per variant |
| Send time | Yes | 100 per time slot |
| Sequence length | Yes | 200 per variant |
| Personalization depth | Yes | 150 per variant |

## 4. Compliance Guardrails

### Email Compliance

| Rule | Implementation |
|------|---------------|
| CAN-SPAM | Unsubscribe link in every email, physical address included |
| GDPR | Consent verification before EU prospects, DPO contact |
| CASL | Express/implied consent check for Canadian prospects |
| CCPA | Opt-out mechanism, data usage disclosure |

### Frequency Limits

| Channel | Max per prospect | Max per day (per rep) |
|---------|-----------------|----------------------|
| Email | 1 per day, 6 per sequence | 100 |
| LinkedIn | 1 per day, 3 per week | 20 connection requests |
| Phone | 1 per day, 3 per sequence | 30 calls |

### Do-Not-Contact Lists

- Global DNC list maintained in LeadReach
- Automatic suppression of bounced emails
- Opt-out processing within 24 hours
- Salesforce DNC sync for consistency
- Compliance audit trail for all outreach

## 5. Deliverability Management

### Email Infrastructure

| Component | Configuration |
|-----------|---------------|
| Sending domains | Dedicated per customer |
| IP addresses | Dedicated IPs (warm-up required) |
| Authentication | SPF, DKIM, DMARC configured |
| Warm-up | 14-day gradual ramp-up for new IPs |
| Monitoring | Real-time bounce/complaint tracking |

### Deliverability Scoring

| Factor | Weight | Target |
|--------|--------|--------|
| Bounce rate | 30% | <2% |
| Spam complaint rate | 25% | <0.1% |
| Authentication pass rate | 20% | 100% |
| Engagement rate | 15% | >5% open rate |
| List hygiene score | 10% | >90% valid emails |

## 6. Performance Analytics

### Key Metrics

| Metric | Definition | Benchmark |
|--------|------------|-----------|
| Open rate | Unique opens / delivered | 25-35% |
| Click rate | Unique clicks / delivered | 2-5% |
| Reply rate | Replies / delivered | 5-15% |
| Meeting booked rate | Meetings / replies | 20-30% |
| Sequence completion rate | Completed / started | 40-60% |
| Opt-out rate | Unsubscribes / delivered | <0.5% |

### Attribution

LeadReach tracks multi-touch attribution:
1. First-touch: Sequence that initiated contact
2. Last-touch: Final action before conversion
3. Multi-touch: Weighted contribution across all touches
4. Channel attribution: Which channel drove the response
