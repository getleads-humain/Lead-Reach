---
title: "Dataset — Few-Shot Examples for B2B Lead Generation"
slug: dataset-few-shot-examples
category: datasets
tags: [dataset, few-shot, examples, training, prompts]
agents: [atlas, scout, forge, sage, judge, bard]
intent_types: [research_company, score_lead, compose_outreach]
priority: 80
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "Few-shot examples for training LLM agents on LeadReach-specific tasks. Use these as in-context examples when prompting."
---

# Dataset — Few-Shot Examples for B2B Lead Generation

## 1. Purpose

This file contains curated few-shot examples that agents can include in their prompts to demonstrate the desired output format. Examples are organized by task type.

## 2. Intent Classification Examples

### Example 1: Company Research
**User Query**: "Tell me about Stripe"
**Classification**:
```json
{
  "intent": "research_company",
  "confidence": 0.95,
  "entities": {
    "companies": ["Stripe"],
    "industries": ["fintech", "payments"],
    "technologies": []
  },
  "constraints": {},
  "selected_pipeline": ["atlas", "scout", "forge", "sage", "judge", "echo"]
}
```

### Example 2: Person Research
**User Query**: "Find information about Patrick Collison"
**Classification**:
```json
{
  "intent": "research_person",
  "confidence": 0.92,
  "entities": {
    "people": ["Patrick Collison"],
    "companies": [],
    "industries": []
  },
  "constraints": {},
  "selected_pipeline": ["atlas", "scout", "forge", "echo"]
}
```

### Example 3: Geographic Discovery
**User Query**: "Dragonfruit suppliers in Vietnam"
**Classification**:
```json
{
  "intent": "discover_places",
  "confidence": 0.95,
  "entities": {
    "products": ["dragonfruit"],
    "geographies": ["Vietnam"],
    "industries": ["agriculture", "food-trade"]
  },
  "constraints": {
    "geographic_scope": "Vietnam",
    "quality_requirements": "suppliers/exporters"
  },
  "selected_pipeline": ["atlas", "scout", "forge", "sage", "judge", "bard", "flow", "echo"]
}
```

### Example 4: ICP Building
**User Query**: "Build an ICP for our SaaS product targeting mid-market companies"
**Classification**:
```json
{
  "intent": "build_icp",
  "confidence": 0.90,
  "entities": {
    "industries": ["saas"],
    "technologies": []
  },
  "constraints": {
    "size_range": "mid-market (50-500 employees)"
  },
  "selected_pipeline": ["atlas", "sage", "judge"]
}
```

## 3. Cold Email Examples (Good)

### Example A: SaaS Company (Series B) — Trigger-Based
```
Subject: noticed your series B - ramp time

Hi Sarah,

Congrats on the $40M Series B led by Sequoia. Scaling the SDR team 
with that kind of growth capital usually surfaces ramp-time pain — 
I saw your post about the 40% ramp challenge.

We help Series B SaaS companies like Lattice and Linear reduce SDR 
ramp from 6 months to 8 weeks through automated discovery call prep. 
At Lattice, we cut ramp time 64% in Q1, saving $1.2M across 40 hires.

Worth a 15-minute call Tuesday at 2pm ET?

— Chris
CEO, LeadReach (used by Lattice, Linear, Vercel)
```

**Why this works**:
- Specific trigger (Series B) acknowledged briefly (1 sentence)
- Demonstrates research (saw her LinkedIn post)
- Specific peer references (Lattice, Linear — similar SaaS)
- Specific metric (64% reduction, $1.2M savings)
- Specific CTA (Tuesday 2pm ET)
- Under 100 words
- One credibility marker in sign-off

### Example B: Manufacturing Company — Pain-Based
```
Subject: oee benchmark for [equipment] plants

Hi Mike,

Noticed Acme Manufacturing just expanded the Springfield plant — 
the new CNC line is impressive. With that capacity expansion, 
unplanned downtime on the new equipment becomes a big dollar issue.

We work with peer manufacturers like Caterpillar and John Deere on 
predictive maintenance for CNC equipment — typical impact is 8-15% 
OEE improvement in 90 days, ROI in 4-6 months.

Worth a 20-minute call to share the benchmark data?

— Chris
LeadReach (used by 200+ manufacturers)
```

**Why this works**:
- Specific trigger (Springfield plant expansion)
- Industry-specific metric (OEE)
- Peer references (Caterpillar, John Deere)
- Specific ROI (8-15% OEE, 4-6 month payback)
- Soft CTA (sharing data first; not pushing meeting)

### Example C: Agriculture Exporter — Inquiry Email
```
Subject: dragonfruit import inquiry - united states

Dear Mr. Minh,

I am Chris from LeadReach Foods in the United States. We are looking 
for reliable dragonfruit suppliers and found Kim My Phat through 
VIETRADE.

Could you share:
- Current export markets
- Available certifications (GlobalG.A.P., organic)
- MOQ and pricing FOB Cat Lai
- Lead time
- Payment terms (LC at sight preferred)

We typically import 2-3 containers monthly and would be ready to 
place a trial order within 30 days.

Looking forward to your reply.

Best regards,
Chris Anderson
LeadReach Foods
+1-555-123-4567 (WhatsApp)
leadreach-foods.com
```

**Why this works**:
- Clear, formal, relationship-focused
- Specific source (VIETRADE)
- Specific questions (not vague)
- Specific volumes and timelines
- WhatsApp number (preferred in Vietnam)
- Addresses Mr. + given name (Vietnamese convention)

## 4. Cold Email Examples (Bad — Avoid)

### Bad Example A: Generic
```
Subject: Transform your sales team with AI!

Hi there,

Hope this email finds you well! I'm Chris from LeadReach. We're a 
leading provider of AI-powered sales enablement solutions that help 
companies like yours transform their sales process.

Our cutting-edge platform uses advanced machine learning algorithms 
to optimize every aspect of your sales funnel, from lead generation 
to closing. With features like automated outreach, intelligent scoring, 
and predictive analytics, we can help you achieve unprecedented growth.

I'd love to schedule a demo to show you how we can help. Are you free 
sometime next week?

Best regards,
Chris Smith
VP of Sales, LeadReach AI
```

**Why it fails**:
- Generic greeting ("Hi there")
- Vague subject line
- No personalization
- No trigger or research reference
- Wall of marketing speak ("cutting-edge", "advanced", "unprecedented")
- No specific outcome
- No specific proof
- Vague CTA ("sometime next week")
- No credibility marker

### Bad Example B: Trigger Spam
```
Subject: congrats on the series B + new CTO + product launch!

Hi Sarah,

I noticed you just raised $40M Series B, hired a new CTO from 
Stripe, launched the new analytics product, expanded to Europe, 
and hired 25 new engineers. Impressive!

We can help with all of that. Our platform does everything from 
sales enablement to engineering productivity to European compliance 
to product analytics to recruiting. Let me know when you'd like 
to chat.

Best,
Chris
```

**Why it fails**:
- Lists 5 triggers (feels surveilled)
- Claims to solve everything (no specificity)
- No metrics or proof
- Vague CTA
- Tone-deaf to the volume of information

## 5. Enrichment Output Examples

### Example: Stripe Inc. Enriched Profile
```json
{
  "prospect_id": "prospect_001",
  "type": "company",
  "name": {
    "value": "Stripe, Inc.",
    "source": "OpenCorporates",
    "source_url": "https://opencorporates.com/companies/us_de/stripe-inc",
    "verified": true,
    "as_of": "2026-06-22"
  },
  "aliases": ["Stripe", "Stripe Payments"],
  "website": {
    "value": "https://stripe.com",
    "source": "LinkedIn",
    "source_url": "https://linkedin.com/company/stripe",
    "verified": true
  },
  "linkedin_url": {
    "value": "https://linkedin.com/company/stripe",
    "source": "Google Search",
    "verified": true
  },
  "industry": {
    "value": "Financial Services",
    "sub_industry": "Payments",
    "source": "LinkedIn",
    "verified": true,
    "as_of": "2026-06-22"
  },
  "employee_count": {
    "value": 8000,
    "source": "LinkedIn",
    "verified": true,
    "as_of": "2026-06-22"
  },
  "revenue_usd": {
    "value": 14000000000,
    "source": "CNBC estimate",
    "verified": false,
    "estimated": true,
    "as_of": "2025-12-31"
  },
  "funding_stage": {
    "value": "Series H",
    "source": "Crunchbase",
    "verified": true,
    "as_of": "2023-03-01"
  },
  "total_funding_usd": {
    "value": 2200000000,
    "source": "Crunchbase",
    "verified": true
  },
  "founded_year": {
    "value": 2010,
    "source": "Crunchbase",
    "verified": true
  },
  "headquarters": {
    "country": "United States",
    "state": "California",
    "city": "South San Francisco",
    "address": "354 Oyster Point Blvd",
    "lat": 37.6638,
    "lng": -122.4035,
    "source": "Company website",
    "verified": true
  },
  "ownership_type": "private",
  "tech_stack": [
    {
      "category": "Analytics",
      "product": "Segment",
      "source": "PublicWWW",
      "detected_at": "2026-06-22",
      "confidence": 0.95
    },
    {
      "category": "Hosting",
      "product": "AWS",
      "source": "DNS Records",
      "detected_at": "2026-06-22",
      "confidence": 0.90
    }
  ],
  "executives": [
    {
      "name": "Patrick Collison",
      "title": "CEO and Co-founder",
      "linkedin_url": "https://linkedin.com/in/patrickcollison",
      "start_date": "2010-01-01",
      "source": "Company website",
      "verified": true
    },
    {
      "name": "John Collison",
      "title": "President and Co-founder",
      "linkedin_url": "https://linkedin.com/in/johncollison",
      "start_date": "2010-01-01",
      "source": "Company website",
      "verified": true
    }
  ],
  "recent_news": [
    {
      "title": "Stripe announces new AI-powered fraud detection",
      "url": "https://stripe.com/blog/ai-fraud-detection",
      "date": "2026-05-15",
      "source": "Stripe Blog",
      "summary": "Stripe launched AI-powered fraud detection...",
      "sentiment": "positive"
    }
  ],
  "trigger_events": [
    {
      "type": "product_launch",
      "date": "2026-05-15",
      "description": "Launched AI-powered fraud detection product",
      "source": "Stripe Blog"
    }
  ],
  "completeness_score": 85,
  "verification_score": 78,
  "last_enriched_at": "2026-06-22T12:00:00Z",
  "enrichment_sources": ["OpenCorporates", "LinkedIn", "Crunchbase", "PublicWWW", "Stripe Website"],
  "disputed_fields": [],
  "stale_fields": ["revenue_usd"],
  "unverified_fields": ["revenue_usd"]
}
```

## 6. Trigger Event Examples

### Example: Funding Trigger
```json
{
  "id": "trg_001",
  "type": "funding",
  "severity": "high",
  "title": "Acme Corp raises $40M Series B",
  "description": "Acme Corp announced $40M Series B led by Sequoia, with participation from existing investor Andreessen Horowitz. Funds will be used to expand sales team and accelerate product development.",
  "event_date": "2026-06-15",
  "detected_at": "2026-06-22T10:00:00Z",
  "source": {
    "type": "press_release",
    "url": "https://acme.com/blog/series-b-announcement",
    "retrieved_at": "2026-06-22T10:00:00Z"
  },
  "outreach_window": {
    "start": "2026-06-29",
    "end": "2026-09-15",
    "peak": "2026-07-15"
  },
  "suggested_angle": "Congrats on the Series B. With $40M to scale sales, SDR ramp time becomes critical — we help companies like Lattice reduce ramp from 6 months to 8 weeks.",
  "relevance_to_user_goal": 0.9,
  "combined_score": 0.85
}
```

### Example: Executive Hire Trigger
```json
{
  "id": "trg_002",
  "type": "executive_hire",
  "severity": "high",
  "title": "Acme Corp hires new VP Sales from Stripe",
  "description": "Sarah Chen joined Acme Corp as VP Sales, previously Director of Sales at Stripe. First day: June 1, 2026.",
  "event_date": "2026-06-01",
  "detected_at": "2026-06-22T10:00:00Z",
  "source": {
    "type": "linkedin",
    "url": "https://linkedin.com/in/sarahchen",
    "retrieved_at": "2026-06-22T10:00:00Z"
  },
  "outreach_window": {
    "start": "2026-07-01",
    "end": "2026-08-31",
    "peak": "2026-07-15"
  },
  "suggested_angle": "Congrats on the new VP Sales role at Acme. At Stripe you scaled the SDR team 5x — we helped with similar ramp-time challenges at Lattice.",
  "relevance_to_user_goal": 0.85,
  "combined_score": 0.78
}
```

## 7. Qualification Examples

### Example: BANT Qualification (Grade A)
```json
{
  "prospect_id": "prospect_001",
  "qualification_framework": "BANT",
  "framework_score": {
    "total": 82,
    "grade": "A",
    "criteria": {
      "budget": {
        "score": 22,
        "label": "Strong Budget",
        "evidence": [
          {
            "source": "Crunchbase",
            "detail": "Series B $40M raised June 2026",
            "retrieved_at": "2026-06-22T12:00:00Z"
          }
        ],
        "confidence": 0.95,
        "unknown": false,
        "rationale": "Series B funded company with $40M raise. Use of proceeds includes 'expand sales team' — directly relevant to our category."
      },
      "authority": {
        "score": 22,
        "label": "Decision Maker",
        "evidence": [
          {
            "source": "LinkedIn",
            "detail": "VP Sales at Acme, 3-year tenure, previously Director at Stripe",
            "retrieved_at": "2026-06-22T12:00:00Z"
          }
        ],
        "confidence": 0.90,
        "unknown": false,
        "rationale": "VP Sales at 250-person SaaS company. Industry norms suggest $50K-$250K approval authority. Our $80K ACV fits within VP authority."
      },
      "need": {
        "score": 20,
        "label": "Critical Need",
        "evidence": [
          {
            "source": "LinkedIn Post",
            "detail": "VP Sales posted about 40% SDR ramp time problem",
            "retrieved_at": "2026-06-22T12:00:00Z"
          }
        ],
        "confidence": 0.85,
        "unknown": false,
        "rationale": "Public pain signal — VP Sales specifically called out the SDR ramp problem we solve."
      },
      "timeline": {
        "score": 18,
        "label": "Near-term",
        "evidence": [
          {
            "source": "Crunchbase",
            "detail": "Funding use of proceeds includes 'expand sales team' — typically executed within 6 months",
            "retrieved_at": "2026-06-22T12:00:00Z"
          }
        ],
        "confidence": 0.75,
        "unknown": false,
        "rationale": "Funded 2 weeks ago. Sales expansion typically begins within 1-3 months of close."
      }
    }
  },
  "recommendation": "contact_immediately",
  "rationale": "Series B funded (budget), VP Sales is decision-maker (authority), public pain signal (need), funded recently with sales expansion mandate (timeline). All four BANT criteria met with strong evidence.",
  "next_best_action": "Sales rep contacts VP Sales within 24 hours. Reference the Series B and the LinkedIn post about SDR ramp time.",
  "risks": [
    "Other vendors likely also targeting this account (funding announcement is public)"
  ],
  "opportunities": [
    "VP Sales comes from Stripe — has used modern sales tools",
    "Use of proceeds explicitly mentions sales team expansion"
  ],
  "evidence_summary": [
    {
      "claim": "Acme raised $40M Series B",
      "source": "Crunchbase",
      "url": "https://crunchbase.com/organization/acme"
    },
    {
      "claim": "VP Sales at Acme is Sarah Chen",
      "source": "LinkedIn",
      "url": "https://linkedin.com/in/sarahchen"
    },
    {
      "claim": "Sarah Chen posted about SDR ramp time problem",
      "source": "LinkedIn",
      "url": "https://linkedin.com/posts/sarahchen_sdr-ramp-time"
    }
  ],
  "scored_at": "2026-06-22T12:30:00Z",
  "scored_by": "judge",
  "scoring_duration_ms": 4500
}
```

## 8. Sequence Examples

### Example: 6-Touch SaaS Outreach Sequence
```json
{
  "prospect_id": "prospect_001",
  "sequence": {
    "name": "Series B SaaS - DevTools - 6 touch",
    "description": "For Series B SaaS companies hiring SDRs, with VP Sales who has used modern sales tools",
    "duration_days": 15,
    "touches": [
      {
        "touch_number": 1,
        "day_offset": 0,
        "channel": "email",
        "type": "initial",
        "subject": "noticed your series B - ramp time",
        "body": "Hi Sarah,\n\nCongrats on the $40M Series B led by Sequoia. Scaling the SDR team with that kind of growth capital usually surfaces ramp-time pain — I saw your post about the 40% ramp challenge.\n\nWe help Series B SaaS companies like Lattice and Linear reduce SDR ramp from 6 months to 8 weeks through automated discovery call prep. At Lattice, we cut ramp time 64% in Q1, saving $1.2M across 40 hires.\n\nWorth a 15-minute call Tuesday at 2pm ET?\n\n— Chris\nCEO, LeadReach (used by Lattice, Linear, Vercel)\n\n---\nLeadReach AI | 100 Pine St, San Francisco, CA 94111\nUnsubscribe: https://leadreach.ai/unsubscribe?u=abc123",
        "variables": {
          "first_name": "Sarah",
          "company_name": "Acme",
          "trigger": "$40M Series B led by Sequoia",
          "peer_1": "Lattice",
          "peer_2": "Linear"
        },
        "cta": "Worth a 15-minute call Tuesday at 2pm ET?",
        "expected_duration_seconds": 30,
        "deliverability_warnings": []
      },
      {
        "touch_number": 2,
        "day_offset": 2,
        "channel": "email",
        "type": "followup",
        "subject": "Re: noticed your series B - ramp time",
        "body": "Sarah — bumping this up in case it got buried.\n\nDifferent angle: we found SDR ramp time correlates directly with quota attainment in months 4-6. Cutting ramp from 6 to 2 months means new SDRs hit quota 4 months earlier — at $5K/month quota, that's $20K per SDR in incremental revenue.\n\nWith 25 SDR hires planned (per your job board), that's $500K in incremental revenue just from faster ramp.\n\nWorth a 15-min look?\n\n— Chris",
        "variables": {
          "first_name": "Sarah",
          "incremental_revenue_per_sdr": "$20K",
          "total_sdrs_planned": "25",
          "total_incremental": "$500K"
        },
        "cta": "Worth a 15-min look?",
        "expected_duration_seconds": 20,
        "deliverability_warnings": []
      },
      {
        "touch_number": 3,
        "day_offset": 4,
        "channel": "linkedin",
        "type": "social",
        "subject": null,
        "body": "Hi Sarah — saw your post on SDR ramp time. We help Series B SaaS companies crack this. Would value connecting.",
        "variables": {
          "first_name": "Sarah"
        },
        "cta": "Connect",
        "expected_duration_seconds": 10,
        "deliverability_warnings": []
      },
      {
        "touch_number": 4,
        "day_offset": 7,
        "channel": "email",
        "type": "value",
        "subject": "sdr ramp benchmark - 200 companies",
        "body": "Sarah,\n\nWe just published our 2026 SDR Ramp Benchmark report — 200 Series B-C SaaS companies. Key finding: median ramp time is 5.2 months; top quartile achieves 2.1 months.\n\nThe differentiator? Top quartile uses structured discovery call prep + AI-powered research.\n\nFull report: https://leadreach.ai/sdr-ramp-report-2026\n\n— Chris",
        "variables": {
          "first_name": "Sarah",
          "report_url": "https://leadreach.ai/sdr-ramp-report-2026"
        },
        "cta": "Implicit (download report)",
        "expected_duration_seconds": 15,
        "deliverability_warnings": []
      },
      {
        "touch_number": 5,
        "day_offset": 11,
        "channel": "email",
        "type": "case_study",
        "subject": "how lattice cut sdr ramp 64%",
        "body": "Sarah,\n\nQuick case study on Lattice (Series B SaaS, similar stage to Acme):\n\n- Before: 6.2 month SDR ramp\n- After: 2.2 month SDR ramp\n- ROI: $1.2M saved across 40 hires in 12 months\n- Payback: 3.5 months\n\nFull case study (5-min read): https://leadreach.ai/case-studies/lattice\n\n— Chris",
        "variables": {
          "first_name": "Sarah",
          "case_study_url": "https://leadreach.ai/case-studies/lattice"
        },
        "cta": "Implicit (read case study)",
        "expected_duration_seconds": 15,
        "deliverability_warnings": []
      },
      {
        "touch_number": 6,
        "day_offset": 15,
        "channel": "email",
        "type": "breakup",
        "subject": "Re: noticed your series B - ramp time",
        "body": "Sarah — I've reached out a few times and haven't heard back, which usually means this isn't a priority right now.\n\nI'll stop following up. If anything changes, reply here and I'll pick it back up within 24 hours.\n\n— Chris",
        "variables": {
          "first_name": "Sarah"
        },
        "cta": "Reply if interested",
        "expected_duration_seconds": 10,
        "deliverability_warnings": []
      }
    ]
  },
  "personalization": {
    "company_trigger": "Series B funding announcement",
    "role_challenge": "SDR ramp time (from LinkedIn post)",
    "industry_pattern": "Series B SaaS scaling sales",
    "tech_insight": "Using Salesforce + Outreach (detected via PublicWWW)",
    "personal_detail": "Posted about 40% ramp challenge on LinkedIn",
    "used_variables": ["company_trigger", "role_challenge", "industry_pattern"]
  },
  "compliance": {
    "can_spam_compliant": true,
    "gdpr_compliant": true,
    "physical_address_included": true,
    "unsubscribe_link_included": true,
    "legitimate_interest_basis": "B2B outreach for SDR ramp-time solution relevant to prospect's role as VP Sales at scaling SaaS company"
  },
  "estimated_metrics": {
    "expected_open_rate": 0.55,
    "expected_reply_rate": 0.12,
    "expected_meeting_rate": 0.06,
    "confidence": 0.75
  },
  "created_at": "2026-06-22T13:00:00Z",
  "created_by": "bard"
}
```

## 9. Use These Examples

When prompting LLMs, include 1-2 of these examples as few-shot demonstrations. Example prompt pattern:

```
[SYSTEM PROMPT]

Here are examples of high-quality outputs:

EXAMPLE 1:
[example]

EXAMPLE 2:
[example]

Now perform the task for the following input:

INPUT:
[input]

OUTPUT (JSON only):
```

Including 1-2 examples significantly improves output quality and consistency.
