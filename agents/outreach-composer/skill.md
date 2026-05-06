# Outreach Composer Agent — Skills

## Core Skills

### Personalized Cold Email Composition
- **Trigger**: Lead is marked Hot or Warm, ready for first outreach
- **Input**: Lead record with company data, contact info, research intelligence
- **Output**: Personalized email with subject line, body, and CTA
- **Method**: LLM-powered composition using lead intelligence as context
- **Personalization**: References company name, industry challenges, recent news, contact role

### LinkedIn Connection Request
- **Trigger**: Lead has LinkedIn profile and is ready for social outreach
- **Input**: Lead's LinkedIn profile, shared connections, company info
- **Output**: Personalized connection request note (300 char limit)
- **Agent-Reach Command**: Uses enriched data already collected
- **Method**: Short, curiosity-driven note referencing shared context

### Multi-Touch Sequence Design
- **Trigger**: Campaign requires ongoing outreach strategy
- **Input**: Lead tier, channel preferences, campaign timeline
- **Output**: 4-5 message sequence with timing, channel, and content for each touch
- **Method**: Sequence builder with proven cadence patterns
- **Default Cadence**: Day 1 (email) → Day 3 (LinkedIn) → Day 7 (follow-up email) → Day 14 (value-add email) → Day 21 (break-up)

### Tone & Style Adaptation
- **Trigger**: Composing message for a specific lead
- **Input**: Contact seniority, industry, company culture indicators
- **Output**: Appropriate tone profile (formal/casual/strategic/tactical)
- **Method**: Rule-based tone selection + LLM refinement
- **C-level**: Strategic, concise, ROI-focused
- **Director**: Balanced, problem-solution, metrics-driven
- **Manager**: Detailed, practical, feature-benefit

### Value Proposition Mapping
- **Trigger**: Need to align product benefits with lead's specific context
- **Input**: Product/service value props, lead's industry challenges, company pain points
- **Output**: Mapped value propositions with supporting evidence
- **Agent-Reach Command**: `mcporter call 'exa.web_search_exa(query: "INDUSTRY pain points challenges 2025", numResults: 5)'`
- **Method**: Match product features to industry-specific challenges

### A/B Test Variant Generation
- **Trigger**: User wants to test different messaging approaches
- **Input**: Base message, test variables (subject line, CTA, opening)
- **Output**: 2-3 message variants with controlled differences
- **Method**: Systematic variation of one element while keeping others constant

### Compliance Verification
- **Trigger**: Before message is sent or added to queue
- **Input**: Composed message
- **Output**: Compliance status (pass/fail) with specific issues flagged
- **Method**: Rule-based check for CAN-SPAM, GDPR, and spam filter triggers
- **Checks**: Unsubscribe link, physical address, truthful subject line, no deceptive practices

## Tool Access (Agent-Reach Channels)
- **exa_search**: Industry pain point research, competitive messaging intelligence
- **web**: Company website analysis for personalization hooks
- **linkedin**: Contact role and seniority verification
