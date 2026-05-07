# Bard — Outreach Composer Skills

> *Every skill in Bard's arsenal is a writing instrument. Each one produces messages that earn attention, create connection, and drive action.*

---

## Table of Contents

1. [Personalized Cold Email Composition](#1-personalized-cold-email-composition)
2. [LinkedIn Connection Request](#2-linkedin-connection-request)
3. [Multi-Touch Sequence Design](#3-multi-touch-sequence-design)
4. [Tone & Style Adaptation](#4-tone--style-adaptation)
5. [Value Proposition Mapping](#5-value-proposition-mapping)
6. [A/B Test Variant Generation](#6-ab-test-variant-generation)
7. [Compliance Verification](#7-compliance-verification)
8. [Personalization Intelligence Gathering](#8-personalization-intelligence-gathering)
9. [Message Quality Self-Evaluation](#9-message-quality-self-evaluation)
10. [Execution Engine Integration](#10-execution-engine-integration)

---

## 1. Personalized Cold Email Composition

### Overview

The flagship skill. Composes fully personalized cold emails using 5-layer personalization, LLM-powered writing, and tone adaptation. This is what Bard does best — messages so specific that recipients feel like they were written for them alone.

### Trigger

| Condition | Description |
|-----------|-------------|
| Lead stage = `qualified` and tier = Hot/Warm | Ready for first outreach |
| Manual dispatch | User requests email composition |
| Pipeline auto-trigger | Orchestrator creates a `compose` task |

### Input Schema

```typescript
interface ColdEmailInput {
  leadId: string;
  lead: {
    companyName: string;
    industry: string | null;
    website: string | null;
    city: string | null;
    country: string | null;
    keyContactName: string | null;
    keyContactTitle: string | null;
    keyContactEmail: string | null;
    ceoName: string | null;
    ceoEmail: string | null;
    generalEmail: string | null;
    linkedinUrl: string | null;
    notes: string | null;
    leadTier: string;
    leadScore: number;
    employeeCount: string | null;
    revenueEstimate: string | null;
  };
  personalization: PersonalizationContext;
  senderInfo: {
    name: string;
    title: string;
    company: string;
    address: string;
    unsubscribeUrl: string;
  };
}
```

### Output Schema

```typescript
interface ColdEmailOutput {
  leadId: string;
  channel: 'email';
  type: 'cold_email';
  subject: string;                        // Under 50 chars
  body: string;                           // 150-250 words
  tone: 'strategic' | 'balanced' | 'practical' | 'conversational';
  cta: string;                            // Clear next step
  personalizationHooks: string[];         // Specific references used
  qualityScore: number;                   // 0-100
  compliancePassed: boolean;
  createdAt: string;
}
```

### Method

```
Step 1: Gather Personalization Intelligence (Skill #8)
  a. exaSearch("COMPANY challenges pain points news 2025") → company research
  b. webRead(companyWebsite) → website hooks
  c. linkedInSearchPeople("COMPANY ROLE") → contact context

Step 2: Select Tone (Skill #4)
  a. Determine contact seniority from keyContactTitle
  b. Map to tone profile (strategic/balanced/practical/conversational)
  c. Inject tone rules into LLM prompt

Step 3: Map Value Proposition (Skill #5)
  a. Identify lead's pain points from industry + research
  b. Match to relevant product outcomes
  c. Express as outcome statement, not feature description

Step 4: Compose via LLM
  a. Build prompt with all personalization context + tone + value prop
  b. Call callLLMForJSON() with structured output format
  c. Extract subject, body, CTA, tone, personalization hooks

Step 5: Run Compliance Check (Skill #7)
  a. CAN-SPAM: unsubscribe, address, honest subject
  b. GDPR: legitimate interest documented
  c. Anti-spam: trigger words, caps, exclamation marks

Step 6: Run Quality Self-Evaluation (Skill #9)
  a. Score personalization depth (target: 3+ references)
  b. Score spam risk (target: 0 triggers)
  c. Score clarity (target: 1 clear CTA)
  d. Score value relevance (target: outcome-aligned)
  e. Composite quality score (target: ≥ 75)

Step 7: If quality < 60, regenerate with improvement suggestions
Step 8: Create Outreach record in database
```

### Agent-Reach Bridge Function Signatures

```typescript
// Company intelligence research
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Example:
//   exaSearch("TechVista Solutions challenges pain points news 2025", 3)
//   exaSearch("TechVista Solutions hiring expanding funding", 3)

// Company website analysis for hooks
webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
// Example:
//   webRead("https://techvista.io")
//   Extracts: mission, products, about page, team, press mentions

// Contact context from LinkedIn
linkedInSearchPeople(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
// Example:
//   linkedInSearchPeople("TechVista Solutions CTO VP Engineering", 3)
//   Returns: names, headlines, experience summaries
```

### LLM Prompt

```typescript
const composePrompt = `You are an outreach specialist who writes with empathy and precision. 
You never use generic templates. Every message references specific details about the 
recipient's company, industry, or role. You write like a human who did their homework — 
because you did. You are concise, warm without being familiar, and always focused on 
the recipient's needs, not your product's features.

${toneInstruction}  // Injected based on contact seniority

Lead data:
${JSON.stringify({
  companyName: lead.companyName,
  industry: lead.industry,
  keyContactName: lead.keyContactName,
  keyContactTitle: lead.keyContactTitle,
  city: lead.city,
  country: lead.country,
  website: lead.website,
  notes: lead.notes,
  leadTier: lead.leadTier,
  employeeCount: lead.employeeCount,
})}

Company intelligence:
- Web research: ${JSON.stringify(companyResearch.success ? companyResearch.data.slice(0, 2) : [])}
- Website analysis: ${websiteIntel.slice(0, 3000) || 'No website data'}

Return JSON:
{
  "subject": "Compelling subject line (under 50 chars)",
  "body": "Email body (150-250 words, professional but conversational, reference specific company details)",
  "tone": "strategic | balanced | practical",
  "cta": "Clear next step",
  "personalizationHooks": ["Hook 1", "Hook 2"],
  "channel": "email",
  "type": "cold_email"
}

Rules:
- Reference specific details about the company (not generic)
- Focus on their challenges, not your features
- Keep it concise and value-driven
- Include a clear, low-friction CTA
- No spam trigger words or excessive caps
- DO NOT include unsubscribe or signature — those are added separately
- Never use "I hope this email finds you well" or similar generic openings
- Start with something specific about their company or situation`;
```

### Fallback Chain

| Step | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Company research | `exaSearch()` via mcporter | `exaSearch()` via Jina Search | Compose without research context |
| Website analysis | `webRead()` | Skip website analysis | — |
| Contact context | `linkedInSearchPeople()` | Use lead data only | — |
| LLM composition | `callLLMForJSON()` with retries | Retry with forced JSON | Use template fallback message |
| Compliance check | Rule-based checker | — | — |

### Error Handling

```typescript
// From agent-executor.ts — actual fallback pattern
const message = await callLLMForJSON<Record<string, unknown>>(composePrompt, 'Compose outreach message', {
  subject: `Re: ${lead.companyName} partnership`,
  body: `Hi,\n\nI came across ${lead.companyName} and was impressed by your work in ${lead.industry || 'your industry'}. I'd love to explore how we might be able to help your team.\n\nWould you be open to a brief call this week?\n\nBest regards`,
  tone: 'balanced',
  cta: 'Schedule a brief call',
  personalizationHooks: [],
  channel: 'email',
  type: 'cold_email',
});
```

### Example Output

**Lead:** NovaTech AI, 80 employees, San Francisco, recently raised Series A

**Input to LLM:**
```
Company intelligence:
- Web research: [{"title": "NovaTech AI Announces $15M Series A", ...},
                 {"title": "NovaTech AI Hiring Senior Data Engineers", ...}]
- Website analysis: "NovaTech AI builds scalable AI infrastructure for 
  enterprise. Focus: healthcare and finance verticals. Series A led by 
  Sequoia Capital."
```

**LLM Output:**
```json
{
  "subject": "Scaling NovaTech's data engineering team?",
  "body": "Hi Sarah,\n\nCongratulations on the Series A — and the push to hire senior data engineers. That kind of growth trajectory is exciting.\n\nWhen teams scale that fast, data pipeline reliability often becomes the first casualty. At [Our Company], we helped Pinnacle Analytics cut pipeline failures by 73% during their 3× team expansion — no re-architecture required.\n\nWould a 15-minute call this week make sense?",
  "tone": "strategic",
  "cta": "15-minute call this week",
  "personalizationHooks": [
    "Series A announcement",
    "Hiring senior data engineers",
    "Pipeline reliability during rapid scale"
  ],
  "channel": "email",
  "type": "cold_email"
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Personalization depth | ≥ 3 specific references per message |
| Subject line length | < 50 characters |
| Body word count | 150–250 words |
| Quality score | ≥ 75 |
| Open rate (aggregate) | ≥ 40% |
| Reply rate (aggregate) | ≥ 15% |
| Processing time per lead | < 5 seconds |

---

## 2. LinkedIn Connection Request

### Overview

Composes personalized LinkedIn connection requests within the 300-character limit. Short-form personalization requires extreme precision — every character must earn its place.

### Trigger

| Condition | Description |
|-----------|-------------|
| Lead has LinkedIn URL | Ready for social outreach |
| Part of multi-touch sequence | LinkedIn touch in the cadence |
| Manual request | User wants to connect via LinkedIn |

### Input Schema

```typescript
interface LinkedInConnectionInput {
  leadId: string;
  lead: {
    companyName: string;
    keyContactName: string | null;
    keyContactTitle: string | null;
    linkedinUrl: string | null;
    industry: string | null;
    city: string | null;
    notes: string | null;
  };
  personalization: {
    recentEvent: string | null;           // e.g., "Raised Series B"
    sharedInterest: string | null;        // e.g., "AI infrastructure"
    mutualConnection: string | null;      // e.g., "John Smith"
  };
}
```

### Output Schema

```typescript
interface LinkedInConnectionOutput {
  leadId: string;
  channel: 'linkedin';
  type: 'connection_request';
  note: string;                           // Max 300 characters
  personalizationHook: string;            // What makes this specific
  charCount: number;
  qualityScore: number;                   // 0-100
}
```

### Method

```
Step 1: Identify personalization hook
  Priority 1: Mutual connection → "John Smith suggested I reach out"
  Priority 2: Recent event → "Congrats on the Series A"
  Priority 3: Shared interest → "Also working in AI infrastructure"
  Priority 4: Industry relevance → "Working with fintech teams like yours"

Step 2: Compose within 300-char limit
  Structure: Greeting + Hook + Value teaser + Soft close
  Target: 200-280 characters (leave room for mobile truncation)

Step 3: Character count validation
  If > 300 chars → trim least essential element (value teaser first)

Step 4: Quality check
  - Must reference something specific about the person or company
  - Must not be a generic "I'd like to add you to my network"
  - Must end with a soft close, not a hard ask
```

### Agent-Reach Bridge Function Signatures

```typescript
// Verify contact exists on LinkedIn and get context
linkedInGetProfile(url: string): Promise<ToolResult<LinkedInProfileResult>>
// Returns: name, headline, location, experience
// Used to: Verify profile, extract headline for personalization

// Search for the person on LinkedIn (if no URL)
linkedInSearchPeople(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
// Example:
//   linkedInSearchPeople("Sarah Chen CTO NovaTech", 3)
//   Returns: matching profiles with headlines
```

### LLM Prompt

```typescript
const linkedInPrompt = `You are writing a LinkedIn connection request note. 
You have a strict 300-character limit. Every character must earn its place.

Lead info:
- Name: ${lead.keyContactName || 'unknown'}
- Title: ${lead.keyContactTitle || 'unknown'}
- Company: ${lead.companyName}
- Industry: ${lead.industry || 'unknown'}
- Recent event: ${personalization.recentEvent || 'none'}
- Shared interest: ${personalization.sharedInterest || 'none'}

${personalization.mutualConnection ? `Mutual connection: ${personalization.mutualConnection}` : ''}

Return JSON:
{
  "note": "Connection request note (max 300 chars)",
  "personalizationHook": "What specific detail makes this non-generic",
  "charCount": number
}

Rules:
- Maximum 300 characters — this is a hard limit
- Start with their first name if known
- Reference ONE specific detail (recent event, shared interest, or mutual connection)
- End with a soft close like "Would love to connect" or "Thought we should connect"
- NEVER: "I'd like to add you to my professional network" (LinkedIn default — forbidden)
- NEVER: Ask for a meeting or call — this is just a connection request
- Use contractions freely to save characters
- No links (LinkedIn doesn't allow them anyway)`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Profile verification | `linkedInGetProfile()` | Assume URL is valid |
| Person search | `linkedInSearchPeople()` | Use lead data only |
| LLM composition | `callLLMForJSON()` with retries | Template: "Hi [Name], I work with [industry] teams and thought we might have overlapping interests. Would love to connect." |

### Error Handling

```typescript
// Character limit enforcement
if (message.note.length > 300) {
  console.warn(`[Bard] LinkedIn note exceeds 300 chars (${message.note.length}), trimming`);
  // Trim to 297 chars and add "..."
  message.note = message.note.slice(0, 297) + '...';
  message.charCount = 300;
}
```

### Example Outputs

**Example 1 — Recent Event Hook (278 chars):**
```
Hi Sarah — saw NovaTech's recent Series A. I work with AI teams 
scaling data infrastructure post-funding and thought we might have 
some overlapping interests. Would love to connect.
```

**Example 2 — Mutual Connection Hook (165 chars):**
```
Hi James — John Smith suggested I reach out. I work with consulting 
firms scaling digital practices. Would love to connect.
```

**Example 3 — Industry Hook (198 chars):**
```
Hi Michael — I work with fintech teams building real-time analytics 
platforms and noticed Meridian's push into that space. Thought we 
should connect.
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Acceptance rate | ≥ 35% |
| Personalization specificity | 100% (no generic messages) |
| Character count compliance | 100% (≤ 300 chars) |
| Processing time | < 2 seconds |

---

## 3. Multi-Touch Sequence Design

### Overview

Designs complete multi-touch outreach sequences with cadence patterns, channel mixing, and timing optimization. A sequence is a complete plan — not just one message, but the entire arc from first touch to break-up.

### Trigger

| Condition | Description |
|-----------|-------------|
| Campaign launch | Creating outreach sequences for all qualified leads |
| Lead enters qualified stage | Ready for full sequence design |
| Manual sequence request | User wants a custom outreach cadence |

### Input Schema

```typescript
interface SequenceDesignInput {
  leadId: string;
  lead: {
    leadTier: 'hot' | 'warm' | 'cold';
    keyContactName: string | null;
    keyContactTitle: string | null;
    generalEmail: string | null;
    linkedinUrl: string | null;
    phoneMain: string | null;
    industry: string | null;
  };
  campaign: {
    name: string;
    maxTouches: number;                   // Default: 5
    sequenceDuration: number;             // Days, default: 21
  };
}
```

### Output Schema

```typescript
interface SequenceDesignOutput {
  leadId: string;
  touches: SequenceTouch[];
  totalDuration: number;                  // Days
  estimatedCompletion: string;            // ISO date

  // A/B test plan
  abTestPlan: {
    variable: string;                     // e.g., "subject_line"
    variants: string[];                   // e.g., ["Variant A subject", "Variant B subject"]
    touchIndex: number;                   // Which touch to test on
  } | null;
}

interface SequenceTouch {
  index: number;                          // 1-based
  day: number;                            // Day relative to sequence start
  channel: 'email' | 'linkedin' | 'phone';
  type: 'cold_email' | 'connection_request' | 'follow_up_1' | 'follow_up_2' | 'follow_up_3' | 'break_up';
  purpose: string;                        // e.g., "Earn attention with specific hook"
  contentGuidance: string;                // What the message should cover
  tone: 'strategic' | 'balanced' | 'practical' | 'conversational';
  ctaGuidance: string;                    // e.g., "Soft CTA — just connect, no ask"
  timingConstraint: string;               // e.g., "Send Tuesday 9-11 AM recipient timezone"
}
```

### Method

```
Step 1: Determine sequence template based on tier
  Hot: 5-touch sequence (3 email + 1 LinkedIn + 1 break-up)
  Warm: 5-touch sequence (2 email + 2 LinkedIn + 1 break-up)
  Cold: 2-touch sequence (1 email + 1 LinkedIn)

Step 2: Select channels based on available contact info
  If email available → include email touch
  If LinkedIn available → include LinkedIn touch
  If only general email → adjust CTA to be lower-friction

Step 3: Set timing cadence
  Hot: Day 1, 3, 7, 14, 21
  Warm: Day 1, 3, 7, 14, 21
  Cold: Day 1, 7

Step 4: Define content guidance for each touch
  Touch 1: Company-specific hook + value proposition
  Touch 2: New information + gentle reminder
  Touch 3: Case study + direct ask
  Touch 4: Channel shift + casual check-in
  Touch 5: Respectful close + open door

Step 5: Add A/B test plan (if enabled)
  Test variable: Subject line on first touch
  50/50 split across similar leads in campaign

Step 6: Generate sequence object
```

### Sequence Templates

#### Hot Lead Sequence

| Touch | Day | Channel | Type | Content Guidance | CTA Guidance |
|-------|-----|---------|------|-----------------|-------------|
| 1 | 1 | Email | Cold Email | Company-specific hook + value bridge + social proof | "15-minute call this week" |
| 2 | 3 | Email | Follow-Up #1 | New information (case study, article, insight) | "Worth a quick look?" |
| 3 | 7 | Email | Follow-Up #2 | Direct ask + gentle urgency | "Open to a 15-min call by Friday?" |
| 4 | 14 | LinkedIn | Connection Request | Different angle, softer tone | "Would love to connect" |
| 5 | 21 | Email | Break-Up | Respectful close, preserve relationship | No CTA — "reach out anytime" |

#### Warm Lead Sequence

| Touch | Day | Channel | Type | Content Guidance | CTA Guidance |
|-------|-----|---------|------|-----------------|-------------|
| 1 | 1 | Email | Cold Email | Value-led, focus on their challenge | "Curious if this resonates" |
| 2 | 3 | LinkedIn | Connection Request | Social proof + shared interest | "Would love to connect" |
| 3 | 7 | Email | Follow-Up #1 | Case study + outcome data | "Would a demo be useful?" |
| 4 | 14 | Email | Follow-Up #2 | Value-add (resource, report) | "Thought this might be helpful" |
| 5 | 21 | Email | Break-Up | Respectful close | No CTA |

#### Cold Lead Sequence

| Touch | Day | Channel | Type | Content Guidance | CTA Guidance |
|-------|-----|---------|------|-----------------|-------------|
| 1 | 1 | Email | Cold Email | Value-add only (no hard CTA) | "Here if useful" |
| 2 | 7 | LinkedIn | Connection Request | Industry connection | "Would love to connect" |

### Agent-Reach Bridge Function Signatures

No direct Agent-Reach calls — sequence design is a planning skill that uses already-gathered intelligence.

### LLM Prompt

Not typically needed — sequence templates are rule-based. LLM is used only for custom sequences:

```typescript
const customSequencePrompt = `You are an outreach sequence designer. Create a custom 
multi-touch outreach sequence for this lead.

Lead info:
${JSON.stringify(leadInfo)}

Campaign constraints:
- Max touches: ${campaign.maxTouches}
- Duration: ${campaign.sequenceDuration} days

Available channels: ${availableChannels.join(', ')}

Return JSON:
{
  "touches": [
    {
      "day": number,
      "channel": "email" | "linkedin",
      "type": "cold_email" | "connection_request" | "follow_up_1" | "follow_up_2" | "break_up",
      "purpose": "What this touch should accomplish",
      "contentGuidance": "What the message should cover",
      "ctaGuidance": "What the call-to-action should be"
    }
  ]
}

Rules:
- Never more than 2 emails in a row without a channel shift
- Minimum 2 business days between touches
- First touch: email (highest conversion for cold outreach)
- Break-up email is always the last touch
- No more than 5 total touches per sequence`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Sequence template | Tier-based templates | LLM-generated custom sequence |
| Channel availability | Based on lead contact data | Default to email-only sequence |

### Error Handling

```typescript
// Validate sequence constraints
function validateSequence(touches: SequenceTouch[]): ValidationResult {
  const errors: string[] = [];

  // Check max touches
  if (touches.length > 5) errors.push('Sequence exceeds 5 touches');

  // Check no consecutive emails without channel shift
  for (let i = 1; i < touches.length; i++) {
    if (touches[i].channel === 'email' && touches[i-1].channel === 'email') {
      // Allow up to 2 consecutive emails
      if (i >= 2 && touches[i-2].channel === 'email') {
        errors.push(`Three consecutive email touches at positions ${i-2}, ${i-1}, ${i}`);
      }
    }
  }

  // Check minimum spacing
  for (let i = 1; i < touches.length; i++) {
    if (touches[i].day - touches[i-1].day < 2) {
      errors.push(`Touch ${i+1} is too soon after touch ${i} (min 2 days)`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Example Output

**Lead:** NovaTech AI, Hot tier, has email + LinkedIn

```json
{
  "leadId": "clx123",
  "touches": [
    {
      "index": 1,
      "day": 1,
      "channel": "email",
      "type": "cold_email",
      "purpose": "Earn attention with Series A hook and pipeline reliability value prop",
      "contentGuidance": "Reference Series A, connect to scaling challenge, share social proof",
      "tone": "strategic",
      "ctaGuidance": "15-minute call this week",
      "timingConstraint": "Send Tuesday 9-11 AM PST"
    },
    {
      "index": 2,
      "day": 3,
      "channel": "email",
      "type": "follow_up_1",
      "purpose": "Add value with new information, gentle reminder",
      "contentGuidance": "Share pipeline reliability case study, reference previous email",
      "tone": "strategic",
      "ctaGuidance": "Worth a quick look?",
      "timingConstraint": "Send Thursday 10 AM-12 PM PST"
    },
    {
      "index": 3,
      "day": 7,
      "channel": "email",
      "type": "follow_up_2",
      "purpose": "Direct ask with gentle urgency",
      "contentGuidance": "Quick question format, time-bound CTA",
      "tone": "strategic",
      "ctaGuidance": "Open to a 15-min call by Friday?",
      "timingConstraint": "Send Wednesday 9-11 AM PST"
    },
    {
      "index": 4,
      "day": 14,
      "channel": "linkedin",
      "type": "connection_request",
      "purpose": "Channel shift, softer approach",
      "contentGuidance": "Different angle from emails, focus on shared interests",
      "tone": "conversational",
      "ctaGuidance": "Would love to connect",
      "timingConstraint": "Send Tuesday 9-11 AM PST"
    },
    {
      "index": 5,
      "day": 21,
      "channel": "email",
      "type": "break_up",
      "purpose": "Respectful close, preserve relationship for future",
      "contentGuidance": "Acknowledge they're busy, leave door open",
      "tone": "balanced",
      "ctaGuidance": "No CTA — just 'reach out anytime'",
      "timingConstraint": "Send Tuesday 9-11 AM PST"
    }
  ],
  "totalDuration": 21,
  "abTestPlan": {
    "variable": "subject_line",
    "variants": [
      "Scaling NovaTech's data engineering team?",
      "Quick question about your data infrastructure"
    ],
    "touchIndex": 1
  }
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Sequence completion rate | ≥ 60% |
| Reply by touch 2 | ≥ 50% of total replies |
| Hot lead sequence conversion | ≥ 30% |
| Processing time | < 1 second (template-based) |

---

## 4. Tone & Style Adaptation

### Overview

Selects and applies the appropriate tone and style for each message based on contact seniority, industry, and company culture. This skill doesn't produce a message — it produces a **tone profile** that the composition engine uses.

### Trigger

| Condition | Description |
|-----------|-------------|
| Before composing any message | Tone must be selected before writing |
| Contact title changes | Different seniority → different tone |
| A/B testing tone variants | Testing strategic vs. conversational |

### Input Schema

```typescript
interface ToneAdaptationInput {
  contact: {
    name: string | null;
    title: string | null;               // e.g., "CTO", "VP of Engineering", "Marketing Manager"
    seniority: 'c_level' | 'vp_director' | 'manager' | 'individual_contributor' | 'unknown';
  };
  company: {
    name: string;
    industry: string | null;
    size: string | null;
    culture: 'startup' | 'corporate' | 'government' | 'agency' | 'unknown';
  };
  message: {
    type: 'cold_email' | 'connection_request' | 'follow_up_1' | 'follow_up_2' | 'break_up';
    channel: 'email' | 'linkedin';
  };
}
```

### Output Schema

```typescript
interface ToneAdaptationOutput {
  profile: 'strategic' | 'balanced' | 'practical' | 'conversational';
  rules: string[];                        // Specific writing rules for this tone
  sentenceLengthRange: [number, number];  // [min, max] words per sentence
  paragraphLengthRange: [number, number]; // [min, max] sentences per paragraph
  maxExclamationMarks: number;
  useContractions: boolean;
  formalityLevel: number;                 // 1-5, 1=casual, 5=formal
  ctaStyle: 'direct' | 'soft' | 'suggestive';
  subjectLineStyle: 'question' | 'statement' | 'curiosity';
  llmInstruction: string;                 // Injected into LLM prompt
}
```

### Method

```
Step 1: Classify contact seniority
  Parse keyContactTitle to determine seniority level
  C-Level: CEO, CTO, CFO, COO, CIO, etc.
  VP/Director: VP, Director, Head of, Chief (non-C-level)
  Manager: Manager, Lead, Senior
  IC: Engineer, Analyst, Developer, Associate

Step 2: Determine company culture
  Startup: < 50 employees, Technology/SaaS industry
  Corporate: 500+ employees, traditional industries
  Government: .gov domain, public sector
  Agency: "Marketing", "Advertising", "Consulting" in name

Step 3: Select tone profile using matrix
  C-Level + Startup → Conversational
  C-Level + Corporate → Strategic
  VP/Director + Any → Balanced
  Manager + Any → Practical
  IC + Any → Conversational

Step 4: Adjust for message type
  Cold Email → Slightly more formal than base tone
  LinkedIn → Slightly more conversational than base tone
  Follow-Up → Same as base tone
  Break-Up → Always balanced/conversational

Step 5: Generate LLM instruction string
```

### Seniority Classification

```typescript
function classifySeniority(title: string | null): SeniorityLevel {
  if (!title) return 'unknown';

  const lower = title.toLowerCase();

  const cLevelPatterns = ['ceo', 'cto', 'cfo', 'coo', 'cio', 'cpo', 'cdo', 'chief', 'founder', 'co-founder'];
  const vpDirectorPatterns = ['vp', 'vice president', 'director', 'head of', 'chief'];
  const managerPatterns = ['manager', 'lead', 'senior', 'supervisor', 'team lead'];

  if (cLevelPatterns.some(p => lower.includes(p))) return 'c_level';
  if (vpDirectorPatterns.some(p => lower.includes(p))) return 'vp_director';
  if (managerPatterns.some(p => lower.includes(p))) return 'manager';
  return 'individual_contributor';
}
```

### Tone Profile Definitions

```typescript
const TONE_PROFILES: Record<string, ToneAdaptationOutput> = {
  strategic: {
    profile: 'strategic',
    rules: [
      'Be concise and high-level',
      'Focus on business outcomes and ROI',
      'No filler words — every sentence must convey value',
      'Avoid jargon unless industry-specific and verified',
      'State outcomes confidently — no "I think" or "we believe"',
      'Maximum 1 question per paragraph',
    ],
    sentenceLengthRange: [8, 15],
    paragraphLengthRange: [2, 3],
    maxExclamationMarks: 0,
    useContractions: false,
    formalityLevel: 4,
    ctaStyle: 'direct',
    subjectLineStyle: 'question',
    llmInstruction: `Write in a strategic, executive tone. Be concise and high-level. 
      Focus on business outcomes and ROI. No filler words. Every sentence must convey 
      value or insight. Avoid jargon. Be confident and direct. No exclamation marks.`,
  },
  balanced: {
    profile: 'balanced',
    rules: [
      'Present problems and solutions clearly',
      'Include specific numbers where possible',
      'Professional but approachable',
      'Use "we\'ve seen" and "our clients" for credibility',
      'One clear CTA',
    ],
    sentenceLengthRange: [10, 18],
    paragraphLengthRange: [3, 4],
    maxExclamationMarks: 1,
    useContractions: true,
    formalityLevel: 3,
    ctaStyle: 'suggestive',
    subjectLineStyle: 'statement',
    llmInstruction: `Write in a balanced, professional tone. Be clear and metrics-driven. 
      Present problems and solutions. Include specific numbers where possible. Professional 
      but approachable. Use contractions naturally.`,
  },
  practical: {
    profile: 'practical',
    rules: [
      'Be specific about features and benefits',
      'Use step-by-step language',
      'Focus on how things work',
      'Include concrete examples',
      'Be helpful and thorough',
    ],
    sentenceLengthRange: [12, 20],
    paragraphLengthRange: [3, 5],
    maxExclamationMarks: 1,
    useContractions: true,
    formalityLevel: 2,
    ctaStyle: 'suggestive',
    subjectLineStyle: 'statement',
    llmInstruction: `Write in a practical, detailed tone. Be specific about features and 
      benefits. Use step-by-step language. Focus on how things work. Include concrete 
      examples. Helpful and thorough.`,
  },
  conversational: {
    profile: 'conversational',
    rules: [
      'Be warm and approachable',
      'Use contractions freely',
      'Short sentences',
      'Feel like a real person who did their homework',
      'Not salesy — just helpful',
    ],
    sentenceLengthRange: [5, 15],
    paragraphLengthRange: [2, 3],
    maxExclamationMarks: 1,
    useContractions: true,
    formalityLevel: 1,
    ctaStyle: 'soft',
    subjectLineStyle: 'curiosity',
    llmInstruction: `Write in a warm, conversational tone. Be approachable and genuine. 
      Use contractions freely. Short sentences. Feel like a real person who did their 
      homework. Not salesy — just helpful.`,
  },
};
```

### Agent-Reach Bridge Function Signatures

No Agent-Reach calls required — tone adaptation is rule-based using existing lead data.

### LLM Prompt

Not applicable — this skill produces a tone profile that is **injected into** other skills' LLM prompts.

### Fallback Chain

| Scenario | Primary | Fallback |
|----------|---------|----------|
| Title is null | Classify from title | Use 'balanced' as default tone |
| Seniority is ambiguous | Rule-based classification | LLM-based classification |
| Industry is unknown | Industry-specific adjustments | Skip industry adjustments |

### Error Handling

```typescript
// Default to balanced tone if classification fails
const tone = TONE_PROFILES[classifySeniority(lead.keyContactTitle)] 
  || TONE_PROFILES['balanced'];
```

### Example Output

**Input:** CTO at a 200-person SaaS company

```json
{
  "profile": "strategic",
  "rules": [
    "Be concise and high-level",
    "Focus on business outcomes and ROI",
    "No filler words",
    "State outcomes confidently",
    "Maximum 1 question per paragraph"
  ],
  "sentenceLengthRange": [8, 15],
  "paragraphLengthRange": [2, 3],
  "maxExclamationMarks": 0,
  "useContractions": false,
  "formalityLevel": 4,
  "ctaStyle": "direct",
  "subjectLineStyle": "question",
  "llmInstruction": "Write in a strategic, executive tone..."
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Seniority classification accuracy | ≥ 90% |
| Tone-to-conversion correlation | Track and optimize over time |
| Processing time | < 50ms (rule-based) |

---

## 5. Value Proposition Mapping

### Overview

Maps the product/service's value propositions to the lead's specific pain points and context. This ensures messages talk about outcomes the lead cares about, not features the sender wants to promote.

### Trigger

| Condition | Description |
|-----------|-------------|
| Before composing any message | Value prop must be mapped before writing |
| New industry/segment | Campaign targets a new industry |
| A/B testing value props | Testing different outcome statements |

### Input Schema

```typescript
interface ValuePropMappingInput {
  lead: {
    companyName: string;
    industry: string | null;
    employeeCount: string | null;
    painPoints: string[];                 // From personalization intelligence
  };
  product: {
    valuePropositions: ValueProposition[];
    defaultOutcome: string;               // Fallback value prop
  };
}
```

### Output Schema

```typescript
interface ValuePropMappingOutput {
  bestMatch: ValueProposition;
  outcomeStatement: string;               // e.g., "Cut pipeline failures by 73% during rapid scale"
  evidenceStatement: string;              // e.g., "Pinnacle Analytics case study"
  relevanceScore: number;                 // 0-100, how well this VP fits this lead
  alternativeMatches: ValueProposition[]; // 2nd and 3rd best matches
}

interface ValueProposition {
  id: string;
  painPoint: string;                      // What problem it solves
  feature: string;                        // How it works
  outcome: string;                        // What result it produces
  outcomeMetrics: string;                 // e.g., "73% reduction", "2× faster"
  industryRelevance: string[];            // Which industries this applies to
  sizeRelevance: string[];                // Which company sizes this applies to
  evidenceType: 'case_study' | 'statistic' | 'testimonial';
  evidenceDetail: string;                 // e.g., "Pinnacle Analytics case study"
}
```

### Method

```
Step 1: Identify lead's pain points
  From personalization intelligence (Skill #8)
  From industry benchmarks
  From company signals (hiring, expansion, etc.)

Step 2: Search for industry-specific challenges
  exaSearch("INDUSTRY pain points challenges 2025")

Step 3: Match pain points to value propositions
  For each pain point:
    Find value propositions that address it
    Score relevance based on industry + size match
    Rank by relevance score

Step 4: Select best match
  Highest relevance score value proposition
  Generate outcome statement in the lead's language

Step 5: Prepare evidence
  Match case study or statistic to the lead's context
  If same-industry case study → use it
  If same-size case study → use it
  If generic → use industry statistic
```

### Agent-Reach Bridge Function Signatures

```typescript
// Industry pain point research
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Examples:
//   exaSearch("fintech data infrastructure challenges pain points 2025", 5)
//   exaSearch("SaaS scaling challenges pipeline reliability 2025", 5)
//   exaSearch("healthcare data integration compliance challenges 2025", 5)

// Case study / social proof research
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Examples:
//   exaSearch("pipeline monitoring case study results ROI", 5)
//   exaSearch("data pipeline reliability improvement metrics", 5)
```

### LLM Prompt

```typescript
const valuePropMappingPrompt = `You are a value proposition alignment specialist. 
Given a lead's context and a list of value propositions, identify the best match 
and express it as an outcome statement.

Lead context:
- Company: ${lead.companyName}
- Industry: ${lead.industry}
- Size: ${lead.employeeCount} employees
- Pain points: ${lead.painPoints.join(', ')}

Available value propositions:
${JSON.stringify(product.valuePropositions)}

Industry-specific research:
${JSON.stringify(industryResearch)}

Return JSON:
{
  "bestMatchId": "id of the best matching value proposition",
  "outcomeStatement": "Outcome expressed in the lead's language, e.g., 'Cut pipeline failures by 73% during rapid scale'",
  "evidenceStatement": "Supporting evidence, e.g., 'Pinnacle Analytics case study'",
  "relevanceScore": 0-100,
  "reasoning": "Why this value prop is the best match for this lead"
}

Rules:
- Express outcomes, not features ("cut pipeline failures" not "automated monitoring")
- Match to the lead's most pressing pain point
- Use specific numbers when available
- Keep outcome statement under 15 words
- Evidence must be relevant to the lead's industry or size`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Pain point identification | Agent-Reach research | Industry default pain points |
| VP matching | Relevance scoring algorithm | LLM-based matching |
| Evidence sourcing | Case study search | Generic outcome statement |

### Error Handling

```typescript
// If no value proposition matches well, use the default
if (mapping.relevanceScore < 40) {
  return {
    bestMatch: product.defaultOutcome,
    outcomeStatement: product.defaultOutcome.outcome,
    evidenceStatement: 'Industry benchmarks',
    relevanceScore: 40,
    alternativeMatches: [],
  };
}
```

### Example Output

**Lead:** NovaTech AI, Technology, 80 employees, recently raised Series A

**Pain Points Identified:** Scaling engineering team, data pipeline reliability during growth

**Best Match:**
```json
{
  "bestMatchId": "vp_pipeline_reliability",
  "outcomeStatement": "Cut pipeline failures by 73% during rapid scale",
  "evidenceStatement": "Pinnacle Analytics case study — 3× team expansion",
  "relevanceScore": 92,
  "reasoning": "Directly addresses pipeline reliability concern during team scaling, 
    which matches NovaTech's Series A hiring trajectory. Same industry and size 
    as case study subject."
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| VP-to-pain-point match accuracy | ≥ 80% |
| Outcome statement specificity | ≥ 90% (includes specific metrics) |
| Processing time | < 3 seconds |

---

## 6. A/B Test Variant Generation

### Overview

Generates systematic message variants for A/B testing. Each variant differs in exactly one variable while keeping all other elements constant, enabling clear attribution of performance differences.

### Trigger

| Condition | Description |
|-----------|-------------|
| A/B testing enabled in campaign | Auto-generate variants for first touch |
| Manual variant request | User wants to test specific elements |
| Performance optimization | Existing messages underperforming |

### Input Schema

```typescript
interface ABTestInput {
  baseMessage: {
    subject: string;
    body: string;
    cta: string;
    tone: string;
  };
  testVariable: 'subject_line' | 'cta' | 'opening_line' | 'tone' | 'message_length';
  lead: {
    companyName: string;
    industry: string | null;
    keyContactTitle: string | null;
  };
}
```

### Output Schema

```typescript
interface ABTestOutput {
  testId: string;
  variable: string;
  variants: ABVariant[];
  controlledVariables: string[];          // What is held constant
  hypothesis: string;                     // "Variant B's curiosity-driven subject will increase open rate"
  minSampleSize: number;                  // Minimum sends per variant (30)
}

interface ABVariant {
  id: 'A' | 'B' | 'C';
  label: string;                          // e.g., "Specificity subject"
  subject: string;
  body: string;
  cta: string;
  tone: string;
  difference: string;                     // What differs from base: "Subject line changed from X to Y"
}
```

### Method

```
Step 1: Identify test variable
  If not specified, default to subject_line (highest impact, lowest risk)

Step 2: Generate variants
  Subject line: Create 1-2 alternative subjects
    - Specificity variant: "Scaling NovaTech's data team?" → "Data pipeline reliability at NovaTech"
    - Curiosity variant: "Quick question about your data infrastructure"
    - Benefit variant: "Cut pipeline failures by 73%"
  
  CTA: Create 1-2 alternative CTAs
    - Direct variant: "15-minute call this week"
    - Soft variant: "Worth exploring?"
    - Value variant: "Want to see how this works?"
  
  Opening line: Create 1-2 alternative openings
    - Pain point variant: Instead of company reference → pain point reference
    - Data variant: Instead of qualitative → quantitative opening

Step 3: Validate variants
  All variants must pass compliance check
  All variants must maintain same controlled variables
  Variants must differ in ONLY the test variable

Step 4: Set hypothesis
  Based on outreach best practices

Step 5: Set sample size
  Minimum 30 sends per variant for statistical significance
```

### Variant Generation Rules

| Variable | Variant Strategy | Example |
|----------|-----------------|---------|
| **Subject line** | A: Specificity, B: Curiosity, C: Benefit | A: "Scaling NovaTech's team?" B: "Quick question" C: "73% fewer failures" |
| **CTA** | A: Direct ask, B: Soft ask, C: Value offer | A: "15-min call?" B: "Worth exploring?" C: "Want to see how?" |
| **Opening line** | A: Company reference, B: Pain point, C: Data point | A: "Saw your Series A..." B: "Scaling fast?" C: "73% of teams..." |
| **Tone** | A: Strategic, B: Conversational | A: "ROI-focused" B: "Warm, peer-like" |
| **Length** | A: Short (150 words), B: Detailed (250 words) | Keep same content, adjust depth |

### Agent-Reach Bridge Function Signatures

No direct Agent-Reach calls — variant generation is a composition skill.

### LLM Prompt

```typescript
const abTestPrompt = `You are an outreach A/B testing specialist. Given a base message, 
generate a variant that differs in exactly ONE variable.

Base message:
Subject: ${baseMessage.subject}
CTA: ${baseMessage.cta}
Tone: ${baseMessage.tone}

Test variable: ${testVariable}

Lead context:
- Company: ${lead.companyName}
- Industry: ${lead.industry}
- Contact title: ${lead.keyContactTitle}

Return JSON:
{
  "variantB": {
    "subject": "Subject line (if testing subject)",
    "body": "Full email body (if testing body elements)",
    "cta": "Call to action (if testing CTA)",
    "tone": "Tone (if testing tone)",
    "difference": "What specifically changed and why"
  },
  "hypothesis": "Why this variant might outperform the base",
  "controlledVariables": ["What is held constant between A and B"]
}

Rules:
- Change ONLY the test variable
- Keep all other elements identical to the base
- Variant must still pass compliance checks
- Variant must still be personalized for this lead
- Explain the hypothesis for why this variant might perform differently`;
```

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Variant generation | LLM composition | Rule-based subject line variations |
| Compliance check | Rule-based checker | Manual review flag |

### Error Handling

```typescript
// Ensure variants differ in exactly the test variable
function validateABTest(base: Message, variant: Message, testVariable: string): ValidationResult {
  const errors: string[] = [];

  // Check that non-test variables are identical
  if (testVariable !== 'subject_line' && base.subject !== variant.subject) {
    errors.push('Subject line changed but is not the test variable');
  }
  if (testVariable !== 'cta' && base.cta !== variant.cta) {
    errors.push('CTA changed but is not the test variable');
  }

  // Check that test variable actually changed
  if (testVariable === 'subject_line' && base.subject === variant.subject) {
    errors.push('Test variable (subject line) was not changed');
  }

  return { valid: errors.length === 0, errors };
}
```

### Example Output

**Test Variable:** Subject Line

```json
{
  "testId": "ab_2025_03_04_001",
  "variable": "subject_line",
  "variants": [
    {
      "id": "A",
      "label": "Specificity subject (control)",
      "subject": "Scaling NovaTech's data engineering team?",
      "body": "Hi Sarah,\n\nCongratulations on the Series A...",
      "cta": "15-minute call this week",
      "tone": "strategic",
      "difference": "Control — original specificity-driven subject"
    },
    {
      "id": "B",
      "label": "Curiosity subject",
      "subject": "Quick question about your data infrastructure",
      "body": "Hi Sarah,\n\nCongratulations on the Series A...",
      "cta": "15-minute call this week",
      "tone": "strategic",
      "difference": "Subject changed from specificity to curiosity-driven"
    }
  ],
  "controlledVariables": ["body", "cta", "tone", "personalization"],
  "hypothesis": "Curiosity-driven subject will increase open rate by 10-15% based on outreach benchmarks",
  "minSampleSize": 30
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Variant generation time | < 3 seconds |
| Variant compliance rate | 100% |
| Statistical significance | Achieved within 2 weeks |
| Test result clarity | Clear winner in ≥ 70% of tests |

---

## 7. Compliance Verification

### Overview

Verifies that every outreach message complies with CAN-SPAM, GDPR, and anti-spam filter rules before it can be sent. This is a mandatory gate — no message is dispatched without passing compliance.

### Trigger

| Condition | Description |
|-----------|-------------|
| Before every message is sent | Mandatory compliance gate |
| Message composition complete | Auto-check before creating draft |
| Manual compliance review | User wants to verify a message |

### Input Schema

```typescript
interface ComplianceInput {
  message: {
    subject: string;
    body: string;
    cta: string;
    channel: 'email' | 'linkedin';
    type: 'cold_email' | 'connection_request' | 'follow_up_1' | 'follow_up_2' | 'break_up';
  };
  lead: {
    id: string;
    companyName: string;
    stage: string;
  };
  sender: {
    name: string;
    company: string;
    address: string;
    unsubscribeUrl: string;
  };
}
```

### Output Schema

```typescript
interface ComplianceOutput {
  passed: boolean;
  issues: ComplianceIssue[];
  score: number;                          // 0-100 (100 = fully compliant)
  canSend: boolean;                       // true if no 'error' severity issues
  fixedBody: string | null;               // Auto-fixed body if possible
}

interface ComplianceIssue {
  rule: 'CAN-SPAM' | 'GDPR' | 'anti-spam' | 'best-practice';
  severity: 'error' | 'warning' | 'info';
  detail: string;
  fix: string | null;                     // How to fix the issue
}
```

### Method

```
Step 1: CAN-SPAM Checks
  C1: Unsubscribe link present in body?
  C2: Physical address present in body?
  C3: Subject line accurately represents content?
  C4: Sender identity is clear (not deceptive)?

Step 2: GDPR Checks
  G1: Legitimate interest documented in lead notes?
  G2: Data minimization — no excessive personal data in message?
  G3: No reference to non-public data sources?

Step 3: Anti-Spam Filter Checks
  S1: Spam trigger word scan (free, guarantee, urgent, act now, etc.)
  S2: Excessive capitalization check
  S3: Excessive exclamation marks (> 1)
  S4: Deceptive subject patterns ("Re:", "Fwd:")
  S5: Suspicious link patterns

Step 4: Best Practice Checks
  B1: Message length appropriate for type?
  B2: CTA is clear and singular?
  B3: No template language detected?
  B4: Personalization present?

Step 5: Calculate compliance score
Step 6: Auto-fix if possible (add unsubscribe, fix caps)
Step 7: Return compliance verdict
```

### Compliance Check Implementation

```typescript
function checkCompliance(message: ComplianceInput): ComplianceOutput {
  const issues: ComplianceIssue[] = [];

  // === CAN-SPAM ===

  // C1: Unsubscribe
  if (message.channel === 'email') {
    if (!message.message.body.toLowerCase().includes('unsubscribe')) {
      issues.push({
        rule: 'CAN-SPAM',
        severity: 'error',
        detail: 'Missing unsubscribe link',
        fix: `Add before closing: "---\n${message.sender.company} | ${message.sender.address}\nUnsubscribe: ${message.sender.unsubscribeUrl}"`,
      });
    }
  }

  // C2: Physical address
  if (message.channel === 'email') {
    const hasAddress = message.message.body.match(/\d+\s+\w+\s+(Street|St|Avenue|Ave|Road|Rd|Blvd|Drive|Dr|Lane|Ln|Way)/i);
    if (!hasAddress && !message.message.body.includes(message.sender.address)) {
      issues.push({
        rule: 'CAN-SPAM',
        severity: 'error',
        detail: 'Missing physical mailing address',
        fix: 'Include sender company address in signature block',
      });
    }
  }

  // C3: Subject line truthfulness
  const deceptivePatterns = [/^re:/i, /^fwd:/i, /^reply:/i];
  if (message.message.type === 'cold_email') {
    for (const pattern of deceptivePatterns) {
      if (pattern.test(message.message.subject.trim())) {
        issues.push({
          rule: 'CAN-SPAM',
          severity: 'error',
          detail: `Deceptive subject line prefix: "${message.message.subject.slice(0, 10)}"`,
          fix: 'Remove Re:/Fwd: prefix from cold email subject',
        });
      }
    }
  }

  // === GDPR ===

  // G1: Data source reference
  const sourceReferences = ['i found your email on', 'i saw on linkedin', 'i scraped', 'i harvested'];
  const lowerBody = message.message.body.toLowerCase();
  for (const ref of sourceReferences) {
    if (lowerBody.includes(ref)) {
      issues.push({
        rule: 'GDPR',
        severity: 'warning',
        detail: `References data source explicitly: "${ref}"`,
        fix: 'Remove explicit references to how you found their information',
      });
    }
  }

  // === ANTI-SPAM ===

  // S1: Spam trigger words
  const spamWords = [
    'free', 'guarantee', 'no obligation', 'risk-free', 'winner', 'cash',
    'bonus', 'urgent', 'act now', 'limited time', 'exclusive deal',
    'once in a lifetime', 'no risk', '100% free', 'click below',
    'buy direct', 'clearance', 'discount', 'order now',
  ];
  for (const word of spamWords) {
    if (lowerBody.includes(word) || message.message.subject.toLowerCase().includes(word)) {
      issues.push({
        rule: 'anti-spam',
        severity: 'warning',
        detail: `Spam trigger word: "${word}"`,
        fix: `Replace "${word}" with a more neutral alternative`,
      });
    }
  }

  // S2: Excessive caps
  const capsRatio = (message.message.subject.match(/[A-Z]/g) || []).length / message.message.subject.length;
  if (capsRatio > 0.5 && message.message.subject.length > 5) {
    issues.push({
      rule: 'anti-spam',
      severity: 'warning',
      detail: `Subject line has ${Math.round(capsRatio * 100)}% capitalization`,
      fix: 'Use standard sentence case for subject line',
    });
  }

  // S3: Exclamation marks
  const exclCount = (message.message.body.match(/!/g) || []).length;
  if (exclCount > 1) {
    issues.push({
      rule: 'anti-spam',
      severity: 'warning',
      detail: `${exclCount} exclamation marks (max 1 recommended)`,
      fix: 'Reduce exclamation marks to 0 or 1',
    });
  }

  // === BEST PRACTICE ===

  // B1: Length
  const wordCount = message.message.body.split(/\s+/).length;
  const lengthLimits: Record<string, [number, number]> = {
    cold_email: [150, 250],
    follow_up_1: [80, 150],
    follow_up_2: [100, 180],
    break_up: [50, 80],
  };
  const [minLen, maxLen] = lengthLimits[message.message.type] || [100, 250];
  if (wordCount > maxLen) {
    issues.push({
      rule: 'best-practice',
      severity: 'info',
      detail: `Message is ${wordCount} words (recommended max: ${maxLen})`,
      fix: `Trim to ${maxLen} words or fewer`,
    });
  }

  // B2: Generic opening
  const genericOpenings = [
    'i hope this email finds you well',
    'i hope you\'re doing well',
    'i\'m reaching out because',
    'my name is',
  ];
  for (const opening of genericOpenings) {
    if (lowerBody.startsWith(opening)) {
      issues.push({
        rule: 'best-practice',
        severity: 'info',
        detail: `Generic opening detected: "${opening}"`,
        fix: 'Start with a specific reference to the company or situation',
      });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;

  return {
    passed: errorCount === 0,
    issues,
    score: Math.max(0, 100 - (errorCount * 25) - (warningCount * 10)),
    canSend: errorCount === 0,
    fixedBody: null,  // Could implement auto-fix here
  };
}
```

### Agent-Reach Bridge Function Signatures

No Agent-Reach calls — compliance checking is rule-based.

### LLM Prompt

Not applicable — compliance checking is deterministic and rule-based by design. LLM should never make compliance decisions.

### Fallback Chain

If compliance check fails or throws an error, the message is **not sent**. No fallback — safety first.

### Error Handling

```typescript
// Compliance check must never throw — always return a result
try {
  const compliance = checkCompliance(input);
  if (!compliance.canSend) {
    console.warn(`[Bard] Message failed compliance: ${compliance.issues.map(i => i.detail).join('; ')}`);
    // Auto-fix if possible
    if (compliance.fixedBody) {
      return { ...compliance, fixedBody: compliance.fixedBody };
    }
    // Otherwise, return for manual review
    return compliance;
  }
  return compliance;
} catch (error) {
  // If compliance check itself fails, block the message
  return {
    passed: false,
    issues: [{ rule: 'CAN-SPAM', severity: 'error', detail: 'Compliance check failed', fix: 'Manual review required' }],
    score: 0,
    canSend: false,
    fixedBody: null,
  };
}
```

### Example Output

**Input:** Cold email without unsubscribe

```json
{
  "passed": false,
  "issues": [
    {
      "rule": "CAN-SPAM",
      "severity": "error",
      "detail": "Missing unsubscribe link",
      "fix": "Add before closing: \"---\\nCompany | 123 Main St\\nUnsubscribe: https://...\""
    },
    {
      "rule": "CAN-SPAM",
      "severity": "error",
      "detail": "Missing physical mailing address",
      "fix": "Include sender company address in signature block"
    }
  ],
  "score": 50,
  "canSend": false,
  "fixedBody": null
}
```

After auto-fix (adding unsubscribe + address):
```json
{
  "passed": true,
  "issues": [],
  "score": 100,
  "canSend": true,
  "fixedBody": "Hi Sarah,\n\n...\n\nBest,\n[Sender]\n\n---\n[Company] | 123 Main St, Suite 100, San Francisco, CA 94105\nUnsubscribe: https://app.example.com/unsubscribe/abc123"
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Compliance pass rate (after auto-fix) | ≥ 99% |
| False positive rate | < 1% (flagging compliant messages) |
| Spam trigger detection recall | ≥ 95% |
| Processing time | < 100ms |

---

## 8. Personalization Intelligence Gathering

### Overview

The research skill that powers all personalization. Gathers company intelligence, contact context, and timing hooks from Agent-Reach channels. This is the skill that makes Bard's messages feel hand-crafted rather than template-generated.

### Trigger

| Condition | Description |
|-----------|-------------|
| Before composing any message | Personalization data must be gathered first |
| Re-personalization | Lead's data has changed, need fresh context |
| Manual research | User wants to see available personalization hooks |

### Input Schema

```typescript
interface PersonalizationInput {
  lead: {
    companyName: string;
    website: string | null;
    industry: string | null;
    linkedinUrl: string | null;
    keyContactName: string | null;
    keyContactTitle: string | null;
    city: string | null;
    country: string | null;
  };
}
```

### Output Schema

```typescript
interface PersonalizationContext {
  // Layer 1: Company Context
  companyContext: {
    recentEvents: Array<{
      event: string;                       // e.g., "Raised $15M Series A"
      date: string;                        // e.g., "20 days ago"
      source: string;                      // URL
    }>;
    mission: string | null;                // From website
    products: string[];                    // Key products/services
    pressMentions: string[];               // Recent press coverage
  };

  // Layer 2: Contact Role
  contactRole: {
    seniority: 'c_level' | 'vp_director' | 'manager' | 'individual_contributor' | 'unknown';
    title: string | null;
    responsibilities: string[];            // Inferred from title
    linkedInHeadline: string | null;
  };

  // Layer 3: Pain Points
  painPoints: Array<{
    painPoint: string;                     // e.g., "Scaling data infrastructure"
    source: 'research' | 'industry' | 'inferred';
    confidence: 'high' | 'medium' | 'low';
  }>;

  // Layer 4: Social Proof
  socialProof: Array<{
    type: 'case_study' | 'statistic' | 'testimonial';
    detail: string;
    relevance: 'high' | 'medium' | 'low';
  }>;

  // Layer 5: Timing Hooks
  timingHooks: Array<{
    hook: string;                          // e.g., "Following the Series A announcement"
    recency: string;                       // e.g., "20 days ago"
    type: 'event' | 'seasonal' | 'trend' | 'milestone' | 'signal';
  }>;

  // Metadata
  channelsUsed: string[];
  researchTimestamp: string;
  dataQuality: 'rich' | 'moderate' | 'sparse';
}
```

### Method

```
Step 1: Company Research (Agent-Reach)
  a. exaSearch("COMPANY challenges pain points news 2025") → recent events + press
  b. webRead(companyWebsite) → mission, products, about page
  c. linkedInReadCompanyPage(companyLinkedInUrl) → industry, size, specialties

Step 2: Contact Research (Agent-Reach)
  a. linkedInSearchPeople("COMPANY TITLE") → find contact profile
  b. linkedInGetProfile(contactLinkedInUrl) → headline, experience

Step 3: Pain Point Identification
  a. exaSearch("INDUSTRY pain points challenges 2025") → industry-level challenges
  b. Combine with company-specific signals
  c. Rank by relevance to lead's context

Step 4: Social Proof Research
  a. exaSearch("PRODUCT_TYPE case study ROI results") → relevant case studies
  b. Filter by industry/size relevance

Step 5: Timing Hook Identification
  a. From recent events in Step 1
  b. From calendar (budget season, industry conferences, etc.)
  c. From market trends (regulatory changes, technology shifts)

Step 6: Compile personalization context
Step 7: Assess data quality (rich/moderate/sparse)
```

### Agent-Reach Bridge Function Signatures

```typescript
// Company intelligence — web search
exaSearch(query: string, numResults?: number): Promise<ToolResult<SearchResult[]>>
// Examples:
//   exaSearch("TechVista Solutions challenges pain points news 2025", 3)
//   exaSearch("TechVista Solutions Series A funding hiring", 3)

// Company website deep read
webRead(url: string, format?: 'markdown' | 'text'): Promise<ToolResult<WebReadResult>>
// Examples:
//   webRead("https://techvista.io")
//   webRead("https://techvista.io/about")
//   webRead("https://techvista.io/partners")

// LinkedIn company page
linkedInReadCompanyPage(companyUrl: string): Promise<ToolResult<LinkedInProfileResult>>
// Returns: industry, company size, HQ, specialties, description

// LinkedIn people search
linkedInSearchPeople(query: string, limit?: number): Promise<ToolResult<LinkedInProfileResult[]>>
// Examples:
//   linkedInSearchPeople("TechVista Solutions CTO VP Engineering", 3)

// LinkedIn profile verification
linkedInGetProfile(url: string): Promise<ToolResult<LinkedInProfileResult>>
// Returns: name, headline, location, summary, experience

// Twitter for recent activity
twitterSearch(query: string, limit?: number): Promise<ToolResult<TwitterResult[]>>
// Example:
//   twitterSearch("from:TechVistaIO", 5)  // Recent company tweets
```

### LLM Prompt

```typescript
const personalizationPrompt = `You are a personalization intelligence analyst. 
Given research data about a company and contact, extract specific personalization hooks.

Company: ${lead.companyName}
Industry: ${lead.industry}
Website content: ${websiteContent?.slice(0, 5000) || 'Not available'}
Search results: ${JSON.stringify(searchResults)}
LinkedIn data: ${JSON.stringify(linkedInData)}

Return JSON:
{
  "companyContext": {
    "recentEvents": [{"event": "string", "date": "string", "source": "url"}],
    "mission": "string or null",
    "products": ["product1", "product2"],
    "pressMentions": ["mention1"]
  },
  "painPoints": [
    {
      "painPoint": "string",
      "source": "research" | "industry" | "inferred",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "timingHooks": [
    {
      "hook": "string",
      "recency": "string",
      "type": "event" | "seasonal" | "trend" | "milestone" | "signal"
    }
  ],
  "dataQuality": "rich" | "moderate" | "sparse"
}

Rules:
- Only include events and pain points with actual evidence
- Mark confidence as "high" only for direct evidence (press release, official statement)
- Mark as "medium" for secondary sources (news coverage, job postings)
- Mark as "low" for inferred pain points (industry generalizations)
- Data quality is "rich" if 3+ recent events found, "moderate" if 1-2, "sparse" if 0`;
```

### Fallback Chain

| Step | Primary | Fallback 1 | Fallback 2 |
|------|---------|------------|------------|
| Company research | `exaSearch()` via mcporter | `exaSearch()` via Jina Search | Use lead data only |
| Website analysis | `webRead()` | Skip website data | — |
| LinkedIn data | `linkedInGetProfile()` via mcporter | `linkedInGetProfile()` via Jina Reader | Use lead data only |
| Pain point research | `exaSearch()` for industry challenges | LLM knowledge of industry | Generic pain points |

### Error Handling

```typescript
// Parallel research with graceful degradation
const [companyRes, websiteRes, linkedInRes] = await Promise.allSettled([
  exaSearch(`${lead.companyName} challenges pain points news 2025`, 3),
  lead.website ? webRead(lead.website) : Promise.resolve(makeError('No website')),
  lead.linkedinUrl ? linkedInGetProfile(lead.linkedinUrl) : Promise.resolve(makeError('No LinkedIn')),
]);

// Collect what we have — never block on a single channel failure
const context: PersonalizationContext = {
  companyContext: companyRes.status === 'fulfilled' && companyRes.value.success
    ? extractCompanyContext(companyRes.value.data)
    : { recentEvents: [], mission: null, products: [], pressMentions: [] },
  // ... similar for other channels
  dataQuality: getDataQuality(companyRes, websiteRes, linkedInRes),
};
```

### Example Output

**Lead:** NovaTech AI, 80 employees, Technology, San Francisco

```json
{
  "companyContext": {
    "recentEvents": [
      { "event": "Raised $15M Series A led by Sequoia", "date": "20 days ago", "source": "https://techcrunch.com/..." },
      { "event": "Hiring Senior Data Engineers", "date": "35 days ago", "source": "https://novatech.io/careers" },
      { "event": "Opened Berlin office", "date": "50 days ago", "source": "https://novatech.io/blog/..." }
    ],
    "mission": "Build scalable AI infrastructure for enterprise",
    "products": ["AI Pipeline Manager", "Data Quality Monitor", "AutoScaler"],
    "pressMentions": ["TechCrunch Series A coverage", "Forbes AI 50 list"]
  },
  "contactRole": {
    "seniority": "c_level",
    "title": "CTO",
    "responsibilities": ["Technical strategy", "Engineering team", "Product architecture"],
    "linkedInHeadline": "CTO at NovaTech AI — Building the future of enterprise AI"
  },
  "painPoints": [
    { "painPoint": "Scaling data infrastructure post-funding", "source": "research", "confidence": "high" },
    { "painPoint": "Pipeline reliability during team expansion", "source": "inferred", "confidence": "medium" },
    { "painPoint": "Hiring and onboarding data engineers quickly", "source": "research", "confidence": "high" }
  ],
  "socialProof": [
    { "type": "case_study", "detail": "Pinnacle Analytics — 73% pipeline failure reduction during 3× scale", "relevance": "high" },
    { "type": "statistic", "detail": "Gartner: 78% of CIOs prioritize data pipeline reliability in 2025", "relevance": "medium" }
  ],
  "timingHooks": [
    { "hook": "Following the Series A announcement", "recency": "20 days ago", "type": "event" },
    { "hook": "Given the hiring push for data engineers", "recency": "35 days ago", "type": "signal" },
    { "hook": "As Q2 budget planning approaches", "recency": "Current season", "type": "seasonal" }
  ],
  "channelsUsed": ["exa_search", "web", "linkedin"],
  "researchTimestamp": "2025-03-04T10:30:00Z",
  "dataQuality": "rich"
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Research completeness | ≥ 2 recent events per lead |
| Pain point accuracy | ≥ 80% (relevant to lead's context) |
| Channel success rate | ≥ 80% (at least one channel returns data) |
| Processing time | < 5 seconds |

---

## 9. Message Quality Self-Evaluation

### Overview

Bard evaluates its own messages before sending them. This meta-skill ensures that every message meets quality standards for personalization depth, spam safety, clarity, value relevance, and compliance.

### Trigger

| Condition | Description |
|-----------|-------------|
| After composing any message | Quality gate before saving/sending |
| A/B variant comparison | Score variants to predict performance |
| Manual quality check | User wants to evaluate a draft |

### Input Schema

```typescript
interface QualityEvaluationInput {
  message: {
    subject: string;
    body: string;
    cta: string;
    tone: string;
    type: string;
    channel: string;
  };
  lead: {
    companyName: string;
    industry: string | null;
    keyContactName: string | null;
    keyContactTitle: string | null;
  };
  personalization: PersonalizationContext;
}
```

### Output Schema

```typescript
interface QualityEvaluationOutput {
  score: number;                          // 0-100
  passed: boolean;                        // ≥ 60
  dimensions: {
    personalizationDepth: number;         // 0-100
    spamRisk: number;                     // 0-100 (100 = safe)
    clarity: number;                      // 0-100
    valueRelevance: number;               // 0-100
    compliance: number;                   // 0-100
  };
  personalizationCount: number;           // Specific references found
  specificReferences: string[];           // What was personalized
  improvements: string[];                 // Suggested improvements
  verdict: 'excellent' | 'good' | 'acceptable' | 'poor';
}
```

### Method

```
Step 1: Personalization Depth Scoring
  - Count specific company/context references in the message
  - +20 per unique company-specific reference
  - +15 per pain point reference
  - +10 per social proof reference
  - Target: 3+ references → 60+
  - Check against personalization context to verify accuracy

Step 2: Spam Risk Scoring
  - Scan for trigger words (deductions per trigger)
  - Check caps ratio in subject line
  - Count exclamation marks
  - Check for deceptive patterns
  - Starts at 100, deductions per violation

Step 3: Clarity Scoring
  - Check for single clear CTA
  - Check word count is within range for message type
  - Check for jargon
  - Check logical flow (opening → value → CTA)

Step 4: Value Relevance Scoring
  - Check pain point alignment
  - Check outcome language (not feature language)
  - Check industry fit of value prop

Step 5: Compliance Scoring
  - Run full compliance check (Skill #7)
  - Score based on issues found

Step 6: Composite score
  Weighted: Personalization(30%) + SpamRisk(25%) + Clarity(20%) + Value(15%) + Compliance(10%)

Step 7: Generate improvements list

Step 8: Return evaluation
```

### LLM-Based Quality Evaluation

```typescript
const qualityEvalPrompt = `You are an outreach message quality auditor. Evaluate this draft message for a specific lead.

Lead context:
- Company: ${lead.companyName}
- Industry: ${lead.industry}
- Contact: ${lead.keyContactName}, ${lead.keyContactTitle}

Draft message:
Subject: ${message.subject}
Body: ${message.body}

Available personalization data:
${JSON.stringify(personalizationHooks)}

Score each dimension 0-100:
{
  "personalizationDepth": 0-100,
  "spamRiskScore": 0-100,
  "clarityScore": 0-100,
  "valueRelevance": 0-100,
  "complianceScore": 0-100,
  "overallScore": 0-100,
  "personalizationCount": number,
  "specificReferences": ["ref1", "ref2"],
  "improvements": ["Suggestion 1", "Suggestion 2"]
}

Evaluation criteria:
- Personalization: Look for specific company names, recent events, role references, industry pain points
  Score 0 = no personalization, 50 = one reference, 75 = two references, 100 = three+ specific references
- Spam risk: Check for trigger words, excessive punctuation, ALL CAPS, deceptive subject
  Score 100 = completely clean, deduct 15 per trigger word, 20 per caps violation, 10 per excessive punctuation
- Clarity: Single clear CTA? Appropriate length? Logical structure? No jargon?
  Score based on how easy it is to understand what you want the reader to do
- Value: Does the message focus on outcomes relevant to this lead? Or is it feature-focused?
  Score 100 = outcome-focused and relevant, 50 = relevant but feature-focused, 0 = generic
- Compliance: Unsubscribe present? Physical address? Honest subject line?
  Score 0 = missing critical compliance, 50 = partial, 100 = fully compliant`;
```

### Agent-Reach Bridge Function Signatures

No Agent-Reach calls — quality evaluation is rule-based + LLM-based.

### Fallback Chain

| Step | Primary | Fallback |
|------|---------|----------|
| Quality scoring | Rule-based + LLM evaluation | Rule-based only |
| Personalization counting | LLM-based reference detection | Regex-based keyword matching |

### Error Handling

```typescript
// If LLM quality evaluation fails, use rule-based fallback
try {
  const llmScore = await callLLMForJSON<QualityEvaluationOutput>(qualityEvalPrompt, 'Evaluate quality', null);
  if (llmScore && llmScore.overallScore > 0) return llmScore;
} catch {
  console.warn('[Bard] LLM quality evaluation failed, using rule-based fallback');
}

// Rule-based fallback
return {
  score: calculateRuleBasedScore(message, lead, personalization),
  passed: ruleBasedScore >= 60,
  dimensions: { /* rule-based calculations */ },
  improvements: generateRuleBasedImprovements(message),
  verdict: ruleBasedScore >= 90 ? 'excellent' : ruleBasedScore >= 75 ? 'good' : ruleBasedScore >= 60 ? 'acceptable' : 'poor',
};
```

### Example Output

**Message:** Cold email for NovaTech AI (see Skill #1 example)

```json
{
  "score": 88,
  "passed": true,
  "dimensions": {
    "personalizationDepth": 90,
    "spamRisk": 100,
    "clarity": 85,
    "valueRelevance": 80,
    "compliance": 85
  },
  "personalizationCount": 4,
  "specificReferences": [
    "Series A announcement",
    "Hiring senior data engineers",
    "Pipeline reliability during rapid scale",
    "Pinnacle Analytics case study"
  ],
  "improvements": [
    "Consider adding the specific ROI metric in the subject line for higher open rate"
  ],
  "verdict": "good"
}
```

### Performance Targets

| Metric | Target |
|--------|--------|
| Quality score accuracy (vs. actual reply rate correlation) | ≥ 0.60 |
| False negative rate (good messages flagged as poor) | < 10% |
| Processing time | < 2 seconds |
| Improvement suggestion usefulness | ≥ 70% adopted |

---

## 10. Execution Engine Integration

### Overview

Describes how Bard integrates with the Agent Execution Engine (`src/lib/agent-executor.ts`) and the Agent-Reach Bridge (`src/lib/agent-reach-bridge.ts`) at runtime.

### Runtime Handler

```typescript
// In src/lib/agent-executor.ts
async function executeOutreachComposer(ctx: AgentExecutionContext): Promise<AgentExecutionResult>
```

### Execution Context

```typescript
interface AgentExecutionContext {
  taskId: string;
  agentName: 'outreach-composer';
  taskType: 'compose';
  campaignId: string | null;
  input: Record<string, unknown>;
  priority: number;                       // 1-10
}
```

### Execution Flow

```
1. Engine receives task from queue
2. Engine dispatches to executeOutreachComposer(ctx)
3. Handler queries DB for leads needing outreach
   └─ Primary: stage = 'qualified', tier IN ('hot', 'warm'), up to 15 leads
   └─ Fallback: Include tier = 'cold' leads if no hot/warm available
4. For each lead:
   a. exaSearch("COMPANY challenges pain points news 2025") → personalization research
   b. webRead(lead.website) → website hooks
   c. Call LLM with compose prompt → subject, body, CTA, tone
   d. Create Outreach record in DB with draft message
5. Update campaign contact counts
6. Return result with channel activity log
```

### Agent-Reach Bridge Functions Used

| Function | Channel | Operation | Purpose |
|----------|---------|-----------|---------|
| `exaSearch(query, numResults)` | `exa_search` | `personalization_research` | Industry pain points, company news |
| `webRead(url)` | `web` | `read_company_site` | Company website for hooks |

### Channel Activity Recording

```typescript
// Exa search activity
channelActivity.push({
  channel: 'exa_search',
  operation: 'personalization_research',
  success: companyResearch.success,
  timestamp: new Date().toISOString(),
  resultCount: companyResearch.success ? companyResearch.data.length : 0,
});

// Website read activity
if (lead.website) {
  const webResult = await webRead(lead.website);
  channelActivity.push({
    channel: 'web',
    operation: 'read_company_site',
    success: webResult.success,
    timestamp: new Date().toISOString(),
  });
}
```

### Database Operations

```typescript
// Create outreach record
await db.outreach.create({
  data: {
    leadId: lead.id,
    channel: message.channel || 'email',
    type: message.type || 'cold_email',
    subject: message.subject,
    body: `${message.body}\n\n---\n${senderInfo.company} | ${senderInfo.address}\nUnsubscribe: ${senderInfo.unsubscribeUrl}`,
    status: 'draft',
  },
});

// Update lead stage
await db.lead.update({
  where: { id: lead.id },
  data: {
    stage: 'contacted',
    contactedAt: new Date(),
  },
});

// Update campaign counts
if (campaignId) {
  await db.campaign.update({
    where: { id: campaignId },
    data: { leadsContacted: { increment: composedCount } },
  });
}
```

### API Dispatch

**Direct API:**

```json
POST /api/agents/execute
{
  "mode": "dispatch",
  "agentName": "outreach-composer",
  "taskType": "compose",
  "input": {
    "campaignId": "clx...",
    "query": "Compose outreach for technology companies"
  }
}
```

**Via AI Chat:**

```json
POST /api/ai
{ "message": "Write outreach emails for my hot leads" }
```

**Response:**

```json
{
  "success": true,
  "output": {
    "composed": 8,
    "totalProcessed": 10
  },
  "channelActivity": [
    {
      "channel": "exa_search",
      "operation": "personalization_research",
      "success": true,
      "timestamp": "2025-03-04T10:35:00Z",
      "resultCount": 3
    },
    {
      "channel": "web",
      "operation": "read_company_site",
      "success": true,
      "timestamp": "2025-03-04T10:35:02Z"
    }
  ]
}
```

### Agent Registration

```typescript
// In agent-executor.ts dispatch table
const AGENT_HANDLERS: Record<AgentName, AgentHandler> = {
  // ...
  'outreach-composer': executeOutreachComposer,
  // ...
};
```

### Error Recovery at Engine Level

```typescript
// If the entire composition batch fails
try {
  // ... process leads
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  await updateTaskProgress(ctx.taskId, 0, 'failed');
  return { success: false, output: { error: msg }, channelActivity, error: msg };
}

// If a single lead's composition fails — continue to next lead
for (const lead of leads) {
  try {
    // ... compose and save
  } catch (leadError) {
    console.error(`Failed to compose outreach for lead ${lead.id}:`, leadError);
    // Continue to next lead — don't fail the entire batch
  }
}
```

### Resilience Patterns

| Scenario | Handling |
|----------|----------|
| No hot/warm leads | Include cold leads (fallback) |
| Agent-Reach channel failure | Compose with available data only |
| LLM composition failure | Use template fallback message |
| Database write failure | Log error, continue to next lead |
| Website read failure | Skip website hooks, use search data |
| Lead has no email | Skip email, try LinkedIn instead |

### Performance Targets

| Metric | Target |
|--------|--------|
| Full batch processing (15 leads) | < 2 minutes |
| Task progress updates | Every 3-5 leads |
| Channel activity logging | 100% of Agent-Reach calls |
| Database write success rate | ≥ 99% |
| Draft message quality score | ≥ 70 average across batch |
