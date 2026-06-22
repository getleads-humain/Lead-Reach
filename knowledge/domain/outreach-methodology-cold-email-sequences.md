---
title: "Outreach Methodology — Cold Email, Multi-Touch Sequences, Personalization at Scale"
slug: outreach-methodology-cold-email-sequences
category: domain
tags: [outreach, cold-email, sequences, personalization, multi-touch, deliverability]
agents: [bard, flow, echo]
intent_types: [compose_outreach, build_sequence]
priority: 90
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "How to write cold outreach that gets replies. The complete methodology: subject lines, body structure, CTAs, multi-touch sequencing, deliverability, and personalization at scale."
---

# Outreach Methodology — Cold Email, Multi-Touch Sequences, Personalization at Scale

## 1. The Brutal Math of Cold Outreach

Cold outreach is a **numbers game played with quality pieces**. The math:

- **Email volume**: To book 10 meetings at 5% meeting-booked rate, you need 200 positive replies.
- **Reply rate**: To get 200 positive replies at 10% positive reply rate, you need 2,000 replies total.
- **Open rate**: To get 2,000 replies at 10% reply rate of openers, you need 20,000 opens.
- **Deliverability**: To get 20,000 opens at 50% open rate, you need 40,000 emails delivered.
- **Sending volume**: To deliver 40,000 emails at 90% deliverability, you need to send ~44,000.

This is why **every percentage point of reply rate matters enormously**. Going from 1% to 3% reply rate triples your meeting volume at zero additional cost. The Bard agent's job is to maximize reply rate through structure, personalization, and timing.

## 2. The Anatomy of a High-Performing Cold Email

A cold email has six components, each with explicit rules:

### Component 1: Subject Line (5-7 words, lower case, no hype)
The subject line's only job is to get opened. It is not a summary. It is not a teaser. It is a **curiosity trigger**.

**Patterns that work:**
- The specific question: "still using hubspot for outbound?"
- The observed observation: "noticed your team is hiring 5 SDRs"
- The mutual connection: "kavya suggested i reach out"
- The relevant trigger: "congrats on the series B"
- The specific value: "30% reduction in CAC for {company}-like SaaS"

**Patterns that fail:**
- Anything ALL CAPS
- Anything with "free", "guarantee", "limited time"
- Anything >7 words
- Anything that screams "marketing email"
- Subject lines that don't match the email content (causes spam complaints)

### Component 2: The Hook (1-2 sentences — why THIS person, NOW)
The first sentence must demonstrate **research, relevance, and specificity**. Generic openings ("I hope this finds you well") cause instant deletion.

**Strong hooks:**
- "Saw your post on LinkedIn about scaling SDR teams — the 40% ramp time problem is brutal."
- "Noticed {company} just raised $40M Series B led by Sequoia — congrats. With that kind of growth capital, the next 12 months will be about hiring and infrastructure."
- "Your engineering team is hiring 3 backend engineers focused on Kafka — sounds like you're scaling the data pipeline."

**Weak hooks:**
- "I hope this email finds you well"
- "My name is X and I work at Y"
- "We help companies like yours"
- "I wanted to reach out because"

### Component 3: The Value Proposition (2-3 sentences — what outcome, for whom, how)
Specificity beats generality. Don't say "we help companies grow" — say "we help Series A-B SaaS companies reduce SDR ramp time from 6 months to 8 weeks by automating discovery call prep."

The value proposition must answer three questions in 3 sentences:
1. **What outcome** do you produce?
2. **For whom** specifically?
3. **How** — at a high level?

### Component 4: The Specific Proof (1 sentence — evidence it works)
One concrete proof point. Not "trusted by leading companies" — "we reduced ramp time at Lattice by 64% in Q1 2026."

Numbers > names > categories > nothing. Specific > general.

### Component 5: The Ask (1 sentence — clear, low-friction CTA)
The CTA must be:
- **Single** (one ask, not two)
- **Specific** (a 15-minute call on Tuesday, not "let's chat")
- **Low-friction** (a yes/no question beats an open-ended one)
- **Time-bound** (this week, not "soon")

**Strong CTAs:**
- "Open to a 15-minute call Tuesday at 2pm ET?"
- "Worth a quick look — I can send a 90-second demo?"
- "Know who on your team owns this — happy to send them info?"

**Weak CTAs:**
- "Let me know if you'd like to learn more"
- "Are you free sometime next week?"
- "Please review the attached materials"

### Component 6: The Sign-off (1 line — credibility markers)
Name, title, company, one credibility marker (client name, funding, award). No email signature with 12 links and 4 images — these trigger spam filters.

```
— Sarah
CEO, LeadReach AI (used by Notion, Linear, Vercel)
```

## 3. The 6-Touch Sequence — Default LeadReach Pattern

The default sequence for cold outbound. Adjust cadence based on response.

| Touch | Day | Channel | Content | Goal |
|-------|-----|---------|---------|------|
| 1 | 0 | Email | Cold email (full structure above) | Get opened |
| 2 | 2 | Email | Reply to touch 1 — "bumping this up" + new value angle | Trigger response |
| 3 | 4 | LinkedIn | Connection request + 1-line personalized note | Build trust |
| 4 | 7 | Email | Trigger-event based — relevant news/insight | Show relevance |
| 5 | 11 | Email | Case study — proof point + soft CTA | Reduce risk |
| 6 | 15 | Email | Breakup email — "closing the loop" | Force reply |

### The Breakup Email
The most effective single email in the sequence. Pattern:
> "Sarah — I've reached out a few times and haven't heard back, which usually means this isn't a priority right now. I'll stop following up. If anything changes, reply here and I'll pick it back up within 24 hours."

Breakup emails get 15-25% reply rates because they trigger loss aversion. Many prospects reply with "actually, let's talk next month" or "yes, sorry, been swamped — let's book something."

## 4. Personalization at Scale — The 5-Variable Rule

True personalization requires **research per prospect**, which is expensive. The Bard agent solves this by extracting 5 variables per prospect from the Forge-enriched profile:

1. **Company-specific trigger** — recent funding, product launch, hire, expansion
2. **Role-specific challenge** — what does someone with this title at this company care about?
3. **Industry-specific pattern** — what's happening in their vertical right now?
4. **Technology-specific insight** — what does their tech stack suggest about their priorities?
5. **Personal detail** (carefully) — recent LinkedIn post, podcast, conference talk

The email should reference **at least 3 of these 5**. Fewer = generic; more = creepy.

### What NOT to Personalize
- Family, hobbies, religion, politics, health
- Speculation about compensation
- Criticism of their current employer
- Anything from a private/social media account
- Home address or personal phone

These cross ethical lines and trigger GDPR/CCPA compliance issues.

## 5. Deliverability — The Hidden Multiplier

A perfectly written email that lands in spam is worth zero. Deliverability is the **infrastructure of outreach** — invisible when it works, fatal when it doesn't.

### Authentication (the table stakes)
- **SPF** — Sender Policy Framework. DNS record listing authorized senders.
- **DKIM** — DomainKeys Identified Mail. Cryptographic signature on every email.
- **DMARC** — Domain-based Message Authentication, Reporting & Conformance. Tells receivers what to do with failures.

Without these three, your emails will land in spam ~80% of the time. Verify at `mail-tester.com` — should score 9-10/10.

### Reputation (the long game)
- **Domain age** — New sending domains have low trust. Warm them up over 2-4 weeks with low volume (10-20 emails/day).
- **Volume ramp** — Increase volume by ≤20% per week.
- **Engagement** — Gmail and Outlook track opens, replies, and markings-spam. High engagement = high reputation.
- **Spam complaints** — >0.1% complaints = reputation damage. Clean your lists.
- **Bounce rate** — >2% bounces = reputation damage. Verify emails before sending.

### Content filters (the multipliers)
Spam filters analyze content. Common triggers:
- **Spam words** — "free", "guarantee", "act now", "limited time", "click here", "buy now"
- **Excessive links** — More than 2-3 links triggers filters
- **Images** — Image-heavy emails trigger filters; text-only or 1 small image is safer
- **Attachments** — Almost always flagged for cold email
- **ALL CAPS** — Subject lines especially
- **Excessive punctuation** — !!! and ??? trigger filters
- **HTML complexity** — Simple plain text or minimal HTML works best

### Sending infrastructure
- **Dedicated IP** for cold outbound — don't mix with marketing or transactional
- **Multiple sending domains** — `getleadreach.com` for marketing, `lr-outbound.com` for cold
- **Mailbox variety** — Don't send all 1,000 emails/day from one mailbox; spread across 5-10 mailboxes
- **ESP choice** — Use an ESP that allows cold outreach (Apollo, Lemlist, Instantly); Mailchimp/HubSpot prohibit cold email

## 6. Response Handling — The 30-Minute Rule

When a prospect replies, the timer starts. **Replies within 30 minutes have 5× the meeting-booked rate of replies within 24 hours.** The Flow agent should monitor inboxes and notify the seller within minutes.

### Response Classification
Every incoming reply should be classified:
- **Positive** (10-20% of replies): "Yes, let's talk" → respond with calendar link within 30 min
- **Soft positive** (10-15%): "Send me more info" → send 1-page PDF + 90-second Loom, ask for 15-min call
- **Question** (20-30%): "How do you handle X?" → answer concisely, ask for call to discuss further
- **Negative** (10-15%): "Not interested" → thank them, ask what triggered the no, offer to reconnect in 6 months
- **Out of office** (5-10%): Schedule resend for their return date + 2 days
- **Wrong person** (5-10%): Ask who the right person is — they often refer you
- **Unsubscribe** (5%): Remove immediately, log for compliance

### The 24-Hour Follow-Up Rule
If a prospect opens but doesn't reply, send a 1-line follow-up within 24 hours:
> "Sarah — saw you opened my note. Quick question: [specific question related to the email]?"

This single tactic can lift reply rates by 30-50%.

## 7. Multi-Channel Orchestration

Cold email alone is saturated. Multi-channel sequences (email + LinkedIn + phone + content) achieve 2-3× the reply rates of email-only.

### LinkedIn Touch Points
- **Connection request** with personalized note (5-7 sentences max, not a pitch)
- **Profile engagement** — like and comment on their posts for 1-2 weeks before pitching
- **InMail** as a touch after they accept the connection — short, references the email
- **Direct message** with value (not pitch) — share a relevant resource, no ask

### Phone Touch Points
Cold phone is harder than email but higher-impact when it lands:
- **Best times**: Tuesday-Thursday, 10am-11am and 4pm-5pm local time
- **First 7 seconds**: "Hi Sarah, this is X from LeadReach. I'll be brief — is now an OK time?"
- **Pattern interrupt**: Don't launch into a pitch. Ask a question that demonstrates research.
- **Voicemail**: Leave one — short, specific, with a callback number. Voicemail callback rate is 1-3%.

### Content Touch Points
For high-value prospects, create content as a touch:
- Write a LinkedIn post about a problem they have, tag them
- Record a 90-second Loom specifically for them
- Send a relevant case study or industry report
- Comment substantively on their content

Content touches feel less salesy and build reciprocity.

## 8. Measurement & Optimization

Track these metrics religiously. The Bard and Echo agents should report on them weekly.

| Metric | Definition | Benchmark | World-Class |
|--------|-----------|-----------|-------------|
| Delivery rate | % emails reaching inbox | >95% | >99% |
| Open rate | % emails opened | 30-50% | 60-80% |
| Reply rate | % opened emails with reply | 5-10% | 15-25% |
| Positive reply rate | % replies that are positive | 30-50% | 50-70% |
| Meeting-booked rate | % positive replies → meetings | 40-60% | 70-85% |
| Meeting-held rate | % booked meetings that happen | 70-80% | 85-95% |
| Opportunity creation rate | % held meetings → opportunities | 30-50% | 50-70% |

### A/B Testing Discipline
Test **one variable at a time** with statistical significance:
- Subject lines (test in batches of 500+)
- Opening hooks (test in batches of 200+)
- CTAs (test in batches of 300+)
- Send times (test in batches of 1000+)
- Sequence length (test in batches of 2000+)

Don't test 5 variables at once — you won't know which one moved the metric.

## 9. The Bard Agent's Output Schema

When Bard composes outreach, the output should include:

```typescript
{
  prospect_id: string;
  sequence: {
    name: string;
    touches: Array<{
      day: number;
      channel: 'email' | 'linkedin' | 'phone' | 'content';
      type: 'initial' | 'followup' | 'social' | 'breakup' | 'value';
      subject?: string;
      body: string;
      variables: { [key: string]: string };  // personalization tokens
      cta: string;
      expected_duration_seconds: number;
    }>;
  };
  personalization: {
    company_trigger: string;
    role_challenge: string;
    industry_pattern: string;
    tech_insight: string;
    personal_detail?: string;
  };
  deliverability_warnings: string[];
  estimated_reply_rate: number;  // 0-1
  created_at: string;
}
```

The `variables` field is critical — it lets the Flow agent substitute prospect-specific values at send time without re-running Bard.

## 10. Common Failure Modes

### Failure 1: The "All About Us" Email
> "We are a leading provider of AI-powered lead generation solutions..."

No one cares about your company. They care about their problems. Rewrite every "we" as "you".

### Failure 2: The Wall of Text
> 4 paragraphs, 400 words, 3 images, 5 links.

Cold emails should be **under 100 words**. Most are read on mobile, in 5 seconds, between meetings.

### Failure 3: The Vague CTA
> "Let me know if you'd like to learn more."

This is not an ask. It's a wish. Always propose a specific next step with a specific time.

### Failure 4: The Generic Personalization
> "Hi {first_name}, I noticed {company} is doing great work in {industry}..."

This is template personalization, and prospects can smell it. Real personalization references specific, recent, true things.

### Failure 5: The Premature Pitch
> "We'd love to schedule a 30-minute demo to walk you through our platform."

No one wants a demo of a product they don't yet know they need. Earn the right to demo by demonstrating understanding of their problem first.
