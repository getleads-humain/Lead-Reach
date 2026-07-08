---
title: "Email Deliverability"
category: domain
grade: A
last_reviewed: 2026-07-08
tags: [email-deliverability, dns, spf, dkim, dmarc, inbox-placement]
---

# Email Deliverability

## Overview

Email deliverability is the science and practice of ensuring that outbound emails reach recipients' inboxes rather than being filtered to spam, rejected, or silently dropped. For LeadReach's AI-powered outreach platform, deliverability is a foundational capability—without reliable inbox placement, even the most personalized and compelling outreach fails.

This document covers email authentication protocols, IP and domain reputation management, warm-up strategies, inbox placement optimization, spam filter avoidance, BIMI implementation, engagement metrics, monitoring tools, bounce management, list hygiene, and cold email-specific deliverability practices.

---

## 1. Email Authentication

### 1.1 SPF (Sender Policy Framework)

**Purpose**: SPF specifies which mail servers are authorized to send email on behalf of your domain, preventing sender address forgery.

**How It Works**:
1. Domain owner publishes an SPF record in DNS as a TXT record
2. Receiving mail server checks the SPF record during the SMTP transaction
3. If the sending server's IP is in the authorized list, the email passes SPF
4. If not, the email fails SPF, which influences spam filtering decisions

**SPF Record Syntax**:
```
v=spf1 ip4:192.168.1.0/24 include:_spf.google.com include:sendgrid.net ~all
```

| Mechanism | Meaning | Example |
|---|---|---|
| `v=spf1` | SPF version | Required first term |
| `ip4:` | Authorize IPv4 range | `ip4:192.168.1.0/24` |
| `ip6:` | Authorize IPv6 range | `ip6:2001:db8::/32` |
| `include:` | Include another domain's SPF | `include:_spf.google.com` |
| `a` | Authorize the domain's A record IPs | `a` |
| `mx` | Authorize the domain's MX record IPs | `mx` |
| `all` | Default policy for unmatched IPs | `~all` (softfail), `-all` (hardfail), `+all` (pass all) |

**Best Practices**:
- Use `~all` (softfail) rather than `-all` (hardfail) to avoid breaking forwarding
- Limit includes to 10 total (DNS lookup limit per RFC 7208)
- Monitor SPF lookup count with tools like MXToolBox
- Separate sending domains for different email streams (transactional, marketing, cold outreach)

**SPF Configuration for LeadReach**:
```yaml
spf_configuration:
  primary_domain:
    record: "v=spf1 include:_spf.leadreach.io ~all"
    purpose: "Corporate email (G Suite / Microsoft 365)"
  
  outreach_domain:
    record: "v=spf1 include:send.leadreach.io ip4:10.0.0.0/24 ~all"
    purpose: "Cold outreach and sales engagement"
  
  transactional_domain:
    record: "v=spf1 include:sendgrid.net ~all"
    purpose: "Transactional and system notifications"
```

### 1.2 DKIM (DomainKeys Identified Mail)

**Purpose**: DKIM adds a cryptographic signature to emails, proving they haven't been altered in transit and authenticating the sending domain.

**How It Works**:
1. Domain owner generates a public/private key pair
2. Public key is published in DNS as a TXT record
3. Sending mail server signs each email with the private key
4. Receiving server retrieves the public key from DNS and verifies the signature
5. Valid signature proves the email came from the claimed domain and wasn't modified

**DKIM DNS Record**:
```
leadreach._domainkey.leadreach.io IN TXT "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ..."
```

| Parameter | Meaning | Example |
|---|---|---|
| `v` | DKIM version | `DKIM1` |
| `k` | Key algorithm | `rsa` |
| `p` | Public key | Base64-encoded key |
| `s` | Selector (in DNS name) | `leadreach` |

**Best Practices**:
- Use 2048-bit or stronger RSA keys (1024-bit is deprecated by many receivers)
- Rotate keys annually and maintain key history for signature validation
- Use a unique selector for each sending service
- Monitor DKIM alignment with DMARC

**DKIM Configuration for LeadReach**:
```yaml
dkim_configuration:
  primary_domain:
    selector: "google"
    key_length: 2048
    provider: "Google Workspace native DKIM"
  
  outreach_domain:
    selector: "leadreach1"
    key_length: 2048
    provider: "LeadReach sending infrastructure"
    rotation_schedule: "Annual, with 30-day overlap"
  
  transactional_domain:
    selector: "s1"
    key_length: 2048
    provider: "SendGrid"
```

### 1.3 DMARC (Domain-based Message Authentication, Reporting & Conformance)

**Purpose**: DMARC builds on SPF and DKIM to provide domain-level email authentication policy and reporting, allowing domain owners to specify how unauthenticated emails should be handled.

**How It Works**:
1. Domain owner publishes a DMARC policy in DNS
2. Receiving server checks SPF and DKIM for each incoming email
3. If both fail (or don't align with the envelope domain), DMARC policy is applied
4. Domain owner receives aggregate and forensic reports about authentication results

**DMARC DNS Record**:
```
_dmarc.leadreach.io IN TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@leadreach.io; ruf=mailto:dmarc-forensic@leadreach.io; pct=25; adkim=r; aspf=r;"
```

| Parameter | Meaning | Options |
|---|---|---|
| `p` | Policy | `none` (monitor), `quarantine` (spam folder), `reject` (block) |
| `rua` | Aggregate report destination | `mailto:address` |
| `ruf` | Forensic report destination | `mailto:address` |
| `pct` | Percentage of mail to apply policy | `0-100` |
| `adkim` | DKIM alignment mode | `r` (relaxed), `s` (strict) |
| `aspf` | SPF alignment mode | `r` (relaxed), `s` (strict) |

**DMARC Implementation Roadmap**:
```
Phase 1 (Week 1-4): Monitor
  p=none; pct=100
  - Collect aggregate and forensic reports
  - Analyze authentication failures
  - Identify legitimate senders missing from SPF/DKIM

Phase 2 (Week 5-8): Quarantine
  p=quarantine; pct=25 → 50 → 75 → 100
  - Gradually increase quarantine percentage
  - Monitor for false positives (legitimate email quarantined)
  - Fix any remaining authentication gaps

Phase 3 (Week 9-12): Reject
  p=reject; pct=25 → 50 → 75 → 100
  - Gradually increase rejection percentage
  - Final validation that all legitimate email authenticates
  - Maintain monitoring for any issues
```

### 1.4 Authentication Alignment

DMARC requires alignment between the email's From domain and the authenticated domain:

```
SPF Alignment:
  Envelope From (MAIL FROM): bounce@send.leadreach.io
  Header From: sender@leadreach.io
  
  Relaxed alignment: leadreach.io matches → PASS
  Strict alignment: leadreach.io ≠ send.leadreach.io → FAIL

DKIM Alignment:
  DKIM signing domain: leadreach.io
  Header From: sender@leadreach.io
  
  Both relaxed and strict: leadreach.io matches → PASS
```

---

## 2. IP Reputation Management

### 2.1 IP Types

| Type | Description | Reputation Model | Use Case |
|---|---|---|---|
| **Dedicated IP** | Single sender owns the IP | Sender controls reputation entirely | High-volume senders (>50K/mo) |
| **Shared IP** | Multiple senders share the IP | Reputation shared across senders | Low-volume senders (<50K/mo) |
| **IP Pool** | Group of IPs with rotation | Reputation distributed across pool | Medium-to-high volume with segmentation |

### 2.2 IP Reputation Factors

```yaml
ip_reputation_factors:
  positive_signals:
    - low_complaint_rate: "< 0.1% spam complaint rate"
    - low_bounce_rate: "< 2% hard bounce rate"
    - consistent_volume: "Steady sending volume without spikes"
    - high_engagement: "Good open and click rates"
    - proper_authentication: "SPF, DKIM, DMARC all passing"
    - list_hygiene: "Regular removal of inactive addresses"
    -_unsubscribe_compliance: "Honor unsubscribes within 24 hours"
  
  negative_signals:
    - spam_complaints: "> 0.3% complaint rate triggers filtering"
    - high_bounce_rate: "> 5% hard bounce rate damages reputation"
    - spam_traps: "Hitting spam trap addresses (honeypots)"
    - volume_spikes: "> 2x daily volume spike triggers suspicion"
    - authentication_failures: "SPF/DKIM/DMARC failures"
    - blacklist_listings: "Appearance on IP blacklists"
    - low_engagement: "Consistently low open/click rates"
```

### 2.3 IP Reputation Monitoring

- **Sender Score**: Validity (Return Path) sender score (0-100, target >90)
- **SNDS**: Microsoft Smart Network Data Services for Outlook/Hotmail reputation
- **Postmaster Tools**: Google Postmaster Tools for Gmail reputation
- **Blacklist Checks**: Regular checks against major DNSBLs (Spamhaus, Barracuda, etc.)
- **Barracuda Reputation**: Barracuda Central reputation monitoring

### 2.4 IP Warm-Up Protocol

```
New IP Warm-Up Schedule:

Day 1:     50 emails      (highest-engagement recipients only)
Day 2:     100 emails
Day 3:     200 emails
Day 4-5:   300 emails
Day 6-7:   500 emails
Week 2:    1,000 emails/day
Week 3:    2,000 emails/day
Week 4:    5,000 emails/day
Week 5:    10,000 emails/day
Week 6-8:  Ramp to target volume

Warm-Up Rules:
  1. Send only to most engaged recipients first
  2. Maintain <0.1% complaint rate throughout warm-up
  3. Maintain <2% bounce rate throughout warm-up
  4. If complaints or bounces spike, reduce volume by 50% and investigate
  5. Monitor inbox placement rates at major ISPs daily
  6. Do not increase volume if any metric is below threshold
```

---

## 3. Domain Warm-Up Strategies

### 3.1 Why Domain Warm-Up Matters

Domain reputation is independent of IP reputation. Even with a warmed-up IP, a new domain has no reputation history and will be treated cautiously by ISPs.

### 3.2 Domain Warm-Up Protocol

```yaml
domain_warm_up:
  prerequisites:
    - "Complete SPF, DKIM, DMARC configuration before any sending"
    - "Set up Google Postmaster Tools and SNDS"
    - "Configure DMARC reporting (rua address)"
    - "Verify domain in all sending platforms"
  
  phase_1_foundation (Week 1):
    - "Send 10-20 emails/day to internal team and known friendly addresses"
    - "Focus on person-to-person conversations (replies build reputation)"
    - "Encourage replies, forwards, and calendar invites"
    - "No marketing or cold outreach content"
  
  phase_2_engagement (Week 2-3):
    - "Send 20-50 emails/day to warm contacts (existing customers, partners)"
    - "Continue encouraging replies and engagement"
    - "Begin including links and normal email content"
    - "Monitor engagement metrics closely"
  
  phase_3_gradual_outreach (Week 4-6):
    - "Send 50-200 emails/day including some cold outreach"
    - "Target highest-quality prospect lists first"
    - "Maintain personalized, relevant content"
    - "Monitor inbox placement and adjust if needed"
  
  phase_4_scale (Week 7+):
    - "Gradually increase to target volume"
    - "Continue monitoring all deliverability metrics"
    - "Segment by ISP and adjust for ISP-specific requirements"
```

### 3.3 Domain Strategy for Cold Outreach

```yaml
domain_strategy:
  primary_domain:
    domain: "leadreach.io"
    purpose: "Corporate email, customer communication"
    risk_tolerance: "ZERO - never use for cold outreach"
  
  outreach_domains:
    - domain: "get.leadreach.io"
      purpose: "Cold outreach sequences"
      risk_profile: "Acceptable risk - isolated from primary"
    
    - domain: "try.leadreach.io"
      purpose: "Secondary cold outreach"
      risk_profile: "Backup domain for volume distribution"
  
  domain_isolation_principles:
    - "Never cold outreach from primary corporate domain"
    - "Use subdomains for different email streams"
    - "Each outreach domain has its own IP and authentication"
    - "If an outreach domain gets blacklisted, it doesn't affect primary"
    - "Maintain 2-3 active outreach domains for risk distribution"
```

---

## 4. Inbox Placement Optimization

### 4.1 Inbox Placement Factors

| Factor | Weight | Description | Optimization |
|---|---|---|---|
| **Sender Reputation** | 30% | Combined domain + IP reputation | Maintain positive sending practices |
| **Engagement Metrics** | 25% | Open, click, reply rates | Send relevant, valuable content |
| **Content Analysis** | 20% | Spammy content signals | Avoid spam trigger words and patterns |
| **Authentication** | 15% | SPF/DKIM/DMARC pass rates | Ensure all authentication passes |
| **List Quality** | 10% | Bounce and complaint rates | Maintain clean, permission-based lists |

### 4.2 ISP-Specific Optimization

```yaml
isp_optimization:
  gmail:
    priorities:
      - "Engagement history with the sender"
      - "User-level interactions (opens, replies, moves to inbox)"
      - "Domain reputation via Google Postmaster"
      - "Content filtering via TensorFlow models"
    tips:
      - "Gmail heavily weights individual user engagement"
      - "If a user marks your email as important, future emails are more likely to reach inbox"
      - "Avoid all-caps subject lines"
      - "Include plain-text version of HTML emails"
  
  outlook_microsoft:
    priorities:
      - "IP reputation via SNDS"
      - "SmartScreen content filtering"
      - "Sender reputation via Return Path"
      - "User complaints via Junk Reporting"
    tips:
      - "Monitor SNDS for IP health daily"
      - "Register with JMRP (Junk Mail Reporting Program)"
      - "Microsoft is more IP-reputation-focused than Gmail"
      - "Ensure proper rDNS (reverse DNS) for sending IPs"
  
  yahoo_verizon:
    priorities:
      - "Domain reputation"
      - "Complaint rate (threshold: 0.3%)"
      - "Engagement metrics"
      - "Content analysis"
    tips:
      - "Yahoo is complaint-rate sensitive"
      - "Make unsubscribe easy and visible"
      - "Warm up slowly with Yahoo addresses"
```

### 4.3 Inbox Placement Testing

- **Seed Testing**: Use seed list services (250ok, Validity) to measure inbox vs. spam placement
- **Panel Testing**: Test with real accounts across major ISPs
- **Google Postmaster Tools**: Monitor domain reputation and spam rate for Gmail
- **Manual Checks**: Regularly test with your own accounts across ISPs
- **Target**: >90% inbox placement across all major ISPs

---

## 5. Spam Trigger Avoidance

### 5.1 Content Spam Signals

```yaml
spam_triggers:
  subject_line_red_flags:
    - "ALL CAPS WORDS IN SUBJECT LINE"
    - "Excessive punctuation!!!"
    - "Urgent/ASAP/Act Now language"
    - "Free" as the first word
    - "No obligation" or "risk-free"
    - "Click here" or "Click below"
    - "Make money" or "Earn $"
    - "100% free" or "Guaranteed"
    - "Reminder" when there was no prior communication
    - "Re:" or "Fwd:" when not actually a reply/forward
  
  body_content_red_flags:
    - "Large font sizes (>16pt)"
    - "Red text on white background"
    - "Single large image with no text"
    - "Hidden text (white on white)"
    - "Excessive links (>5 in cold email)"
    - "URL shorteners (bit.ly, tinyurl)"
    - "Missing physical mailing address"
    - "Missing unsubscribe link (for commercial email)"
    - "JavaScript or form tags in HTML"
    - "Embedded video or Flash content"
  
  structural_red_flags:
    - "Image-to-text ratio > 40:60"
    - "HTML-only without plain text alternative"
    - "Missing proper MIME structure"
    - "Email size > 102KB"
    - "Broken HTML that renders poorly"
    - "Tracking pixel as the only content"
```

### 5.2 Cold Email Content Best Practices

```yaml
cold_email_best_practices:
  subject_line:
    - "Keep under 50 characters for mobile optimization"
    - "Use natural, conversational language"
    - "Reference something specific to the recipient"
    - "Avoid clickbait patterns"
    - "A/B test subject lines with small segments"
  
  body_content:
    - "Keep emails under 150 words"
    - "Use 2-3 short paragraphs"
    - "Include 1-2 relevant links maximum"
    - "Personalize beyond first name (company, role, challenge)"
    - "Lead with value or insight, not a pitch"
    - "Use plain text or minimal HTML formatting"
    - "Include professional email signature"
  
  call_to_action:
    - "Single, clear CTA per email"
    - "Low-commitment ask (reply, brief call, resource download)"
    - "Avoid aggressive or time-pressure language"
    - "Make the next step simple and obvious"
```

---

## 6. BIMI Implementation

### 6.1 What is BIMI?

Brand Indicators for Message Identification (BIMI) allows brands to display their logo next to their emails in supported inboxes, increasing brand recognition and trust.

### 6.2 BIMI Requirements

1. **DMARC Enforcement**: Domain must have `p=quarantine` or `p=reject` DMARC policy
2. **SVG Logo**: Logo must be in SVG Tiny PS format (specific BIMI SVG specification)
3. **VMC Certificate**: For Gmail, a Verified Mark Certificate from a trademark authority
4. **DNS Record**: BIMI record published in DNS

### 6.3 BIMI DNS Record

```
default._bimi.leadreach.io IN TXT "v=BIMI1; l=https://leadreach.io/bimi/logo.svg; a=https://leadreach.io/bimi/cert.pem"
```

### 6.4 BIMI Implementation Steps

```
1. Ensure DMARC is at p=quarantine or p=reject
2. Create logo in SVG Tiny PS format
3. Register trademark and obtain VMC certificate
4. Host SVG and certificate on HTTPS server
5. Publish BIMI DNS record
6. Test with BIMI checker tools
7. Monitor BIMI adoption in DMARC reports
```

---

## 7. Email Engagement Metrics

### 7.1 Core Deliverability Metrics

| Metric | Definition | Healthy Range | Calculation |
|---|---|---|---|
| **Inbox Placement Rate** | % of emails delivered to inbox | >90% | Inbox deliveries / Total sent |
| **Spam Placement Rate** | % of emails delivered to spam | <5% | Spam deliveries / Total sent |
| **Hard Bounce Rate** | % of emails permanently rejected | <2% | Hard bounces / Total sent |
| **Soft Bounce Rate** | % of emails temporarily rejected | <3% | Soft bounces / Total sent |
| **Complaint Rate** | % of recipients marking as spam | <0.1% | Complaints / Delivered |
| **Open Rate** | % of delivered emails opened | >25% | Opens / Delivered |
| **Click Rate** | % of delivered emails clicked | >3% | Clicks / Delivered |
| **Reply Rate** | % of delivered emails receiving reply | >5% | Replies / Delivered |
| **Unsubscribe Rate** | % of recipients unsubscribing | <0.5% | Unsubscribes / Delivered |

### 7.2 Engagement Metric Impact on Deliverability

```
Positive Impact (Improves Deliverability):
  ✓ High open rates (>25%)
  ✓ High click rates (>3%)
  ✓ High reply rates (>5%)
  ✓ Emails moved from spam to inbox
  ✓ Emails marked as "important"
  ✓ Recipients adding sender to contacts
  ✓ Calendar invites accepted from emails

Negative Impact (Harms Deliverability):
  ✗ Low open rates (<10%)
  ✗ Emails deleted without opening
  ✗ High spam complaint rate (>0.3%)
  ✗ High unsubscribe rate (>1%)
  ✗ Emails marked as "not important"
  ✗ Consistent lack of engagement over 30+ days
```

---

## 8. Deliverability Monitoring Tools

### 8.1 Tool Categories

| Category | Purpose | Examples |
|---|---|---|
| **Inbox Placement Testing** | Measure inbox vs. spam rates | 250ok, Validity (Return Path), GlockApps |
| **Blacklist Monitoring** | Check IP/domain against DNSBLs | MXToolBox, MultiRBL, DNSBL.info |
| **Authentication Testing** | Verify SPF/DKIM/DMARC setup | MXToolBox, DMARC Analyzer, dmarcian |
| **Domain Reputation** | Monitor sender reputation scores | Google Postmaster Tools, SNDS, Sender Score |
| **DMARC Reporting** | Analyze aggregate/forensic reports | dmarcian, Valimail, DMARC Analyzer |
| **Email Testing** | Preview rendering across clients | Litmus, Email on Acid |

### 8.2 Monitoring Dashboard Configuration

```yaml
deliverability_monitoring:
  daily_checks:
    - inbox_placement: "Check placement rates at Gmail, Outlook, Yahoo"
    - bounce_rates: "Review hard and soft bounce rates"
    - complaint_rates: "Check spam complaint rates by ISP"
    - blacklist_status: "Verify IPs not listed on major DNSBLs"
    - volume_trends: "Monitor for sending volume anomalies"
  
  weekly_reviews:
    - domain_reputation: "Review Google Postmaster and SNDS scores"
    - authentication_rates: "Verify SPF/DKIM/DMARC pass rates"
    - engagement_trends: "Analyze open/click/reply rate trends"
    - list_health: "Review list growth, hygiene, and quality metrics"
  
  monthly_audits:
    - comprehensive_deliverability_report: "Full deliverability health assessment"
    - authentication_audit: "Review all DNS records for accuracy"
    - competitive_benchmarking: "Compare deliverability metrics to industry benchmarks"
    - policy_review: "Review and update sending policies and procedures"
```

---

## 9. Bounce Management

### 9.1 Bounce Types

| Bounce Type | Description | Action | Impact on Reputation |
|---|---|---|---|
| **Hard Bounce** | Permanent delivery failure (invalid address) | Remove from list immediately | High negative impact |
| **Soft Bounce** | Temporary failure (mailbox full, server issue) | Retry for 3-5 days, then suppress | Moderate impact if persistent |
| **General Block** | ISP-level blocking | Contact ISP, review practices | High negative impact |
| **Content Block** | Email content triggered filter | Revise content, resubmit | Moderate impact |
| **Rate Limit** | Too many emails to ISP too fast | Slow down sending rate | Low impact if addressed quickly |

### 9.2 Bounce Handling Protocol

```yaml
bounce_handling:
  hard_bounces:
    action: "Immediately suppress from all lists"
    data_retention: "Keep record for suppression list (prevent re-addition)"
    root_cause_analysis: "Monthly review of hard bounce sources"
  
  soft_bounces:
    retry_schedule: "3 retries over 72 hours"
    suppression_threshold: "Suppress after 3 consecutive soft bounces"
    monitoring: "Track soft bounce rates by ISP and domain"
  
  unknown_bounces:
    classification: "Log for analysis, treat as soft bounce initially"
    review_cycle: "Weekly review of unclassified bounces"
  
  complaint_bounces:
    action: "Immediately suppress and add to do-not-contact list"
    review: "Investigate root cause of complaints"
    response: "Adjust content or targeting to reduce complaints"
```

### 9.3 Bounce Rate Thresholds

```
< 2%:   Healthy - No action needed
2-5%:   Warning - Investigate list quality
5-10%:  Problem - Stop sending to affected segments, clean lists
> 10%:  Critical - Stop all sending, full list audit required
```

---

## 10. List Hygiene Practices

### 10.1 List Hygiene Framework

```yaml
list_hygiene:
  real_time_filters:
    - email_validation: "Syntax and domain validation at point of entry"
    - disposable_email_check: "Block temporary/disposable email domains"
    - role_email_filter: "Filter out role addresses (info@, sales@, support@)"
    - duplicate_detection: "Real-time duplicate checking"
    - suppress_list_check: "Check against do-not-contact lists"
  
  periodic_cleaning:
    - monthly:
        - "Remove hard bounced addresses"
        - "Suppress soft bounce addresses past threshold"
        - "Update engagement tier classifications"
      
    - quarterly:
        - "Remove unengaged addresses (no opens/clicks in 6+ months)"
        - "Sunset inactive subscribers with re-engagement campaign"
        - "Verify email addresses with validation service"
        - "Remove spam complaint addresses"
      
    - semi_annually:
        - "Full list audit and quality assessment"
        - "Re-validate all email addresses"
        - "Review and clean suppression lists"
        - "Update list segmentation rules"
  
  engagement_based_tiers:
    highly_engaged:
      definition: "Opened or clicked in last 30 days"
      treatment: "Full sending frequency"
    
    moderately_engaged:
      definition: "Opened or clicked in last 31-90 days"
      treatment: "Reduced frequency, re-engagement focus"
    
    low_engagement:
      definition: "Opened or clicked in last 91-180 days"
      treatment: "Re-engagement campaign only"
    
    unengaged:
      definition: "No opens or clicks in 180+ days"
      treatment: "Sunset - final re-engagement email, then suppress"
```

### 10.2 Email Validation Services

- **Abstract API**: Real-time email validation with deliverability scoring
- **ZeroBounce**: Email validation with abuse/spam trap detection
- **NeverBounce**: Bulk and real-time email verification
- **Bouncer**: Email verification with deliverability assessment
- **MillionVerifier**: Bulk email verification service

---

## 11. Cold Email Deliverability Specifics

### 11.1 Cold Email vs. Marketing Email

| Factor | Marketing Email | Cold Email |
|---|---|---|
| **Recipient Relationship** | Opted in / subscribed | No prior relationship |
| **Volume per Sender** | High (thousands/day) | Low (50-100/day per sender) |
| **Content Style** | Branded, HTML, template-based | Plain text, personalized, conversational |
| **Authentication** | Standard (SPF/DKIM/DMARC) | Enhanced (separate domains, warmed IPs) |
| **Compliance** | CAN-SPAM, GDPR, CASL | CAN-SPAM, GDPR, CASL + industry-specific |
| **Unsubscribe** | Required, one-click | Required for CAN-SPAM; reply-based acceptable |
| **Reputation Risk** | Moderate (established sender) | Higher (new relationship to recipient) |

### 11.2 Cold Email Sending Limits

```yaml
cold_email_limits:
  per_sender_daily:
    conservative: "25-50 emails/day"
    moderate: "50-75 emails/day"
    aggressive: "75-100 emails/day"
    recommendation: "Start conservative, increase based on engagement metrics"
  
  per_domain_daily:
    new_domain: "25-50 emails/day during warm-up"
    established_domain: "200-500 emails/day"
    maximum: "1000 emails/day (with excellent metrics)"
  
  throttling_rules:
    - "Distribute sends across the day (not all at once)"
    - "Space sends 1-3 minutes apart"
    - "Send during recipient's business hours"
    - "Avoid weekends for B2B cold email"
    - "Monitor real-time bounce and complaint rates"
    - "Auto-pause if complaint rate exceeds 0.2%"
```

### 11.3 Cold Email Compliance Requirements

```yaml
compliance_requirements:
  can_spam (US):
    - "Don't use false or misleading header information"
    - "Don't use deceptive subject lines"
    - "Identify the message as an advertisement (if applicable)"
    - "Tell recipients where you're located (physical address)"
    - "Tell recipients how to opt out (honor within 10 business days)"
    - "Monitor what others are doing on your behalf"
  
  gdpr (EU):
    - "Legitimate interest basis for cold email (B2B only)"
    - "Provide clear identification of sender"
    - "Provide easy opt-out mechanism"
    - "Don't process data beyond the stated purpose"
    - "Maintain records of legitimate interest assessment"
    - "Respect data subject access requests"
  
  casl (Canada):
    - "Implied or express consent required"
    - "Clear identification of sender"
    - "Unsubscribe mechanism in every email"
    - "Honor unsubscribe within 10 business days"
    - "Higher penalties than CAN-SPAM"
  
  best_practice_beyond_compliance:
    - "Always provide clear sender identification"
    - "Make opting out as easy as opting in"
    - "Personalize content to be genuinely relevant"
    - "Don't misrepresent who you are or what you offer"
    - "Respect 'stop' or 'no' replies immediately"
```

### 11.4 LeadReach Cold Email Deliverability Engine

```python
class ColdEmailDeliverabilityEngine:
    """
    Manages cold email deliverability including domain rotation,
    send throttling, and real-time monitoring.
    """
    
    def send_cold_email(self, email_content, recipient, sender_config):
        """Send a cold email with deliverability safeguards."""
        
        # Pre-send checks
        checks = self.run_pre_send_checks(email_content, recipient, sender_config)
        if not checks.all_passed:
            return {"status": "blocked", "reasons": checks.failures}
        
        # Throttle check
        throttle_status = self.check_throttle_limits(sender_config)
        if throttle_status.limit_reached:
            return {"status": "throttled", "next_available": throttle_status.next_slot}
        
        # Content scan for spam triggers
        spam_score = self.scan_content(email_content)
        if spam_score > self.spam_threshold:
            return {"status": "blocked", "reason": "spam_score_too_high", "score": spam_score}
        
        # Select optimal sending domain
        domain = self.select_sending_domain(sender_config, recipient.domain)
        
        # Apply optimal timing
        optimal_time = self.calculate_optimal_send_time(recipient)
        
        # Send with monitoring
        result = self.send_email(
            content=email_content,
            recipient=recipient,
            sender_config=sender_config,
            domain=domain,
            scheduled_time=optimal_time,
        )
        
        # Track for deliverability analytics
        self.track_send(result, recipient, domain)
        
        return result
```

---

## 12. Best Practices Summary

### 12.1 Deliverability Checklist

```
□ SPF record configured and verified for all sending domains
□ DKIM configured with 2048-bit keys for all sending services
□ DMARC policy published (p=quarantine minimum, p=reject target)
□ DMARC reporting configured and monitored
□ Dedicated IPs for high-volume sending
□ IP warm-up completed following protocol
□ Domain warm-up completed for new sending domains
□ Separate domains for corporate vs. outreach email
□ Google Postmaster Tools configured
□ SNDS registered for Microsoft IPs
□ Regular blacklist monitoring in place
□ Inbox placement testing conducted monthly
□ Bounce handling and suppression automated
□ List hygiene schedule maintained
□ Email validation at point of entry
□ Spam content scanning on all outbound
□ Sending throttles and limits configured
□ Complaint rate monitoring with auto-pause
□ Engagement-based sending segmentation
□ Compliance with CAN-SPAM, GDPR, CASL
```

---

*This document is maintained by the LeadReach Product Knowledge team. Last updated: 2026-07-08. For questions or contributions, contact the domain knowledge lead.*
