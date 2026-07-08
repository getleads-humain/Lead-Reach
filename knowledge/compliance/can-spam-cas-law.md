---
title: "CAN-SPAM, CASL, and International Email Law Compliance"
category: compliance
grade: A
last_reviewed: 2026-07-08
tags: [can-spam, casl, pecr, spam-act, email-compliance, unsubscribe, b2b-cold-email, international-law, cold-outreach, opt-out]
---

# CAN-SPAM, CASL, and International Email Law Compliance

## 1. Overview: The Global Email Compliance Landscape

B2B cold email is a core LeadReach capability, but every email sent is subject to the laws of the recipient's jurisdiction. Unlike many regulations that apply only above certain revenue or volume thresholds, **email anti-spam laws generally apply to every single commercial email** — regardless of the sender's size. This makes compliance especially critical for LeadReach, which orchestrates millions of outreach emails across multiple jurisdictions.

### Why This Matters

| Risk | Potential Impact |
|------|-----------------|
| CAN-SPAM penalties | Up to $50,120 per email violation (2026 inflation-adjusted) |
| CASL penalties | Up to CAD $10 million per violation for businesses |
| PECR/UK GDPR penalties | Up to £17.5 million or 4% of turnover |
| Australian Spam Act penalties | Up to AUD $2.22 million per violation |
| Deliverability damage | Spam complaints destroy sender reputation; domain blacklisting |
| Customer trust | Non-compliant outreach reflects poorly on LeadReach and its customers |

### Core Principle

**Every cold email LeadReach sends must comply with the strictest applicable law based on the recipient's location.** When laws conflict, default to the most protective standard.

## 2. CAN-SPAM Act (United States)

### 2.1 Scope and Applicability

The CAN-SPAM Act (Controlling the Assault of Non-Solicited Pornography and Marketing Act of 2003, 15 U.S.C. § 7701 et seq.) applies to **all commercial electronic mail messages** sent to US recipients, including:

- B2B cold emails ✅
- B2C marketing emails ✅
- Transactional/relationship emails (partial — subject line must not be misleading) ✅
- Emails sent by US businesses to US recipients ✅
- Emails sent by foreign businesses to US recipients ✅

**Exclusions:**
- Purely transactional or relationship messages (order confirmations, account notices)
- One-to-one personal communications (not commercial)

### 2.2 Seven Mandatory Requirements

| # | Requirement | Details | LeadReach Implementation |
|---|------------|---------|------------------------|
| 1 | **No false or misleading header information** | "From" name, "From" email, "Reply-To," and routing information must be accurate and identify the actual sender | From name = actual sender or company; From email = actual sender's address |
| 2 | **No deceptive subject lines** | Subject line must accurately reflect the email content; "Re:" or "Fwd:" only if there was a prior conversation or forward | Subject must match email body content; no fake "Re:" or "Urgent" |
| 3 | **Identify as advertisement** | Must clearly and conspicuously disclose that the message is an advertisement | CAN-SPAM does not require specific label if other requirements met; LeadReach includes clear business context |
| 4 | **Include physical postal address** | Valid physical postal address of the sender (can be PO Box if registered with USPS) | Every email footer includes company address |
| 5 | **Clear unsubscribe mechanism** | Must provide a clear and conspicuous opt-out mechanism; must be capable of processing for at least 30 days after sending | One-click unsubscribe link; alternative reply-to opt-out |
| 6 | **Honor opt-out within 10 business days** | Must remove the recipient from the mailing list within 10 business days; cannot charge a fee or require information beyond email | Instant automated opt-out processing |
| 7 | **Monitor third-party compliance** | If you hire another company to handle email marketing, you remain legally responsible for their compliance | Vendor compliance verification; contractual obligations |

### 2.3 B2B-Specific CAN-SPAM Provisions

**Key fact:** CAN-SPAM does **not** require prior consent for B2B cold email. This is the most permissive of all major email laws. However:

- All seven requirements above still apply in full
- The FTC has stated that B2B emails are subject to CAN-SPAM
- "Primary purpose" test: if the primary purpose is commercial, the email is subject to CAN-SPAM
- Mixing transactional and commercial content: the commercial purpose controls if it appears in the subject line or is prominently featured

### 2.4 CAN-SPAM "Primary Purpose" Test

| Email Type | Primary Purpose | CAN-SPAM Applies? |
|-----------|----------------|-------------------|
| Cold sales email | Commercial | Yes — full compliance |
| Follow-up to demo request | Transactional + Commercial | Yes — commercial elements trigger compliance |
| Product update to existing customer | Transactional (primarily) | Partially — subject line must not be misleading |
| Invoice with upsell offer | Transactional + Commercial | Yes if commercial content is prominent |
| Newsletter with product ads | Commercial | Yes — full compliance |
| Pure order confirmation | Transactional | No (but subject line must be accurate) |

### 2.5 Aggravated Violations

| Violation | Description | Additional Penalty |
|-----------|------------|-------------------|
| Address harvesting | Collecting email addresses using automated means from websites or forums | Aggravated; increased penalties |
| Dictionary attacks | Generating email addresses by combining names, letters, or numbers | Aggravated; increased penalties |
| Open relay use | Sending email through an open relay (unsecured server) | Aggravated; increased penalties |
| Hijacked computer use | Sending email through a computer accessed without authorization | Aggravated; increased penalties |

**LeadReach must never use any of these techniques.**

### 2.6 Penalties

- **Per violation:** Up to $50,120 (2026 inflation-adjusted amount; adjusted annually)
- **Each email** can constitute a separate violation
- **FTC enforcement:** Federal Trade Commission and DOJ can bring actions
- **State enforcement:** State attorneys general can bring actions on behalf of residents
- **ISP enforcement:** Internet access services can sue for damages
- **Criminal penalties:** For certain willful violations (e.g., hijacking computers, using false registration)

## 3. CASL — Canada's Anti-Spam Legislation

### 3.1 Scope and Applicability

CASL (An Act to promote the efficiency and adaptability of the Canadian economy by regulating certain activities that discourage reliance on electronic means of carrying out commercial activities, S.C. 2010, c. 23) applies to:

- **Commercial electronic messages (CEMs)** sent to or from Canadian electronic addresses
- Installation of **computer programs** on Canadian computers
- Alteration of **transmission data** in CEMs
- **Address harvesting** and use of harvested lists

**Critical difference from CAN-SPAM:** CASL requires **prior consent** before sending a CEM. There is no "opt-out only" model like CAN-SPAM.

### 3.2 Three Types of Consent Under CASL

| Consent Type | Requirements | Duration | When to Use |
|-------------|-------------|----------|-------------|
| **Express consent** | Recipient must provide explicit, informed opt-in; must identify the person seeking consent and state the purposes; must include an unsubscribe mechanism in the consent request | Until withdrawn (no expiry under current law) | Cold outreach to Canadian prospects; the safest approach |
| **Implied consent — existing business relationship (EBR)** | Recipient purchased or inquired about products/services in the past 2 years; or recipient has an existing contract | 2 years from last purchase/inquiry/contract; renewable with each new interaction | Follow-up to existing customers or recent inquirers |
| **Implied consent — existing non-business relationship (ENBR)** | Recipient is a member of your organization, volunteer, donor, etc.; or recipient's email was conspicuously published with no statement restricting CEMs | Duration of the relationship; or until publication is removed | Limited applicability for LeadReach |

### 3.3 The "Conspicuously Published" Exception

CASL allows CEMs to be sent to an email address that was **conspicuously published** (e.g., on a website) if:

1. The address is published without a statement that CEMs are not wanted
2. The message is **relevant to the recipient's business role, duties, or functions**
3. The message includes an unsubscribe mechanism

**LeadReach Application:**
- If a Canadian prospect's work email is on their company website without an anti-spam notice, implied consent may exist
- The outreach must be directly relevant to their business role
- This exception is **narrower** than many assume — always lean toward express consent

### 3.4 Mandatory CEM Content Requirements

Every CEM sent under CASL must include:

| Requirement | Details | LeadReach Implementation |
|------------|---------|------------------------|
| **Sender identification** | Name of the person/organization sending the CEM; mailing address; and either phone number, email, or web address | Company name, physical address, and contact in every email |
| **Unsubscribe mechanism** | Must be "readily performed" — one-click or simple reply; must work for at least 60 days after sending | One-click unsubscribe link + reply-to opt-out |
| **No misleading information** | Subject line, sender info, and web links must not be misleading | Accurate subject lines; true sender identification |
| **No false representation** | Must not impersonate another person or entity | Genuine sender identity at all times |

### 3.5 CASL Penalties and Enforcement

| Penalty Type | Amount | Notes |
|-------------|--------|-------|
| Administrative Monetary Penalty (AMP) — individual | Up to CAD $1 million per violation | CRTC enforcement |
| Administrative Monetary Penalty (AMP) — business | Up to CAD $10 million per violation | CRTC enforcement |
| Private right of action | Actual damages + up to CAD $200 per day | Available since 2025 (delayed implementation) |
| Undertaking | Negotiated settlement | Often includes compliance commitments + monetary payment |

### 3.6 CASL Compliance Program Requirement

Organizations found in violation of CASL must demonstrate they have a **compliance program** that includes:

1. Written policies and procedures
2. Training for all employees involved in electronic marketing
3. Consent management processes
4. Record-keeping for all consents (express and implied)
5. Regular compliance audits
6. Designated compliance officer

**LeadReach must proactively implement this program, not wait for enforcement.**

## 4. PECR — UK Privacy and Electronic Communications Regulations

### 4.1 Scope and Applicability

PECR (The Privacy and Electronic Communications (EC Directive) Regulations 2003, as amended) implements the EU ePrivacy Directive in UK law post-Brexit. It governs:

- **Direct marketing** by email, phone, SMS, and fax
- **Cookies and tracking technologies**
- **Communications security**
- **Traffic and location data**

PECR applies to **all organizations sending messages to UK subscribers**, regardless of where the organization is based.

### 4.2 Consent Requirements for Email Marketing

| Recipient Type | Consent Required | Basis |
|---------------|-----------------|-------|
| Individual subscriber | Prior consent (opt-in) | PECR Regulation 22 |
| Corporate subscriber | Soft opt-in or opt-out acceptable | PECR Regulation 22(3) exception |
| Existing customer (individual) | Soft opt-in for similar products/services | PECR Regulation 22(3) |

### 4.3 The "Corporate Subscriber" Exception — Critical for B2B

PECR distinguishes between individual and corporate subscribers:

- **Individual subscribers** (personal email): Prior consent required
- **Corporate subscribers** (work email): You may send marketing emails without prior consent IF:
  - The recipient's contact details were obtained **in the course of a sale or negotiations for a sale**
  - The marketing relates to **similar products and services**
  - The recipient is given the opportunity to **opt out** at the time of data collection and in every subsequent message

**However**, the ICO's guidance states that this exception is **narrow** and should be interpreted restrictively. For cold outreach to corporate subscribers with no prior relationship, the ICO recommends **obtaining consent or relying on legitimate interest under UK GDPR**.

### 4.4 PECR + UK GDPR Combined Approach

The ICO's approach combines PECR and UK GDPR:

1. **PECR** determines whether you can send the marketing message (the "route" rule)
2. **UK GDPR** determines whether you have a lawful basis for processing the personal data (the "processing" rule)
3. **Both must be satisfied**

For B2B cold email to UK corporate subscribers:
- PECR: Soft opt-in exception may apply (corporate subscriber; opt-out provided)
- UK GDPR: Legitimate interest (with documented LIA)
- **LeadReach implements both** — legitimate interest basis + prominent opt-out

### 4.5 PECR Penalties

| Violation Type | Maximum Penalty |
|---------------|----------------|
| PECR-only violations | £500,000 (lower tier) |
| PECR + UK GDPR violations | £8.7 million or 2% of turnover (lower tier); £17.5 million or 4% of turnover (upper tier) |
| ICO enforcement notices | Compulsory; failure to comply is a criminal offense |

### 4.6 ICO Enforcement Trends (2024-2026)

The ICO has been increasingly enforcing against:
- **Cookie non-compliance** — Fines for non-compliant cookie banners
- **Direct marketing without consent** — Particularly for individual subscribers
- **Scraping for AI training** — ICO investigating scraping of personal data
- **Automated decision-making in marketing** — Article 22 UK GDPR enforcement

## 5. Australian Spam Act 2003

### 5.1 Scope and Applicability

The Spam Act 2003 (Cth) applies to **all commercial electronic messages** sent to or from Australian addresses, including:

- Email messages
- SMS/MMS messages
- Instant messaging
- Social media messages (if commercial)

**Key difference from CAN-SPAM:** Australia requires **prior consent** (like CASL), not just opt-out.

### 5.2 Three Key Requirements

| Requirement | Details | LeadReach Implementation |
|------------|---------|------------------------|
| **Consent** | Must have either express or inferred consent before sending | Express consent preferred; inferred consent only if clear relationship |
| **Identify** | Must clearly identify the sender; include accurate contact details | Company name, physical address, contact details in every email |
| **Unsubscribe** | Must include a functional unsubscribe mechanism; must honor within 5 business days | One-click unsubscribe; automated processing within 5 business days |

### 5.3 Inferred Consent Under Australian Spam Act

Inferred consent may exist when:

- The recipient has provided their work email address directly to the sender
- The recipient's email is **conspicuously published** in connection with their business role
- The recipient has an existing relationship with the sender
- It is reasonable to infer consent from the recipient's conduct

**For cold B2B outreach to Australian prospects:**
- Inferred consent is narrower than under CAN-SPAM but broader than under CASL express consent
- If the prospect's email is on their company website and the outreach is relevant to their role, inferred consent may be reasonable
- **LeadReach approach:** Use inferred consent only with documented justification; provide clear opt-out

### 5.4 Penalties

| Penalty | Amount |
|---------|--------|
| Per violation (business) | Up to AUD $2.22 million |
| Per day of continuing violation | Up to AUD $1.11 million |
| Multiple violations in a single day | Each message can be a separate violation |
| ACMA enforcement | Warnings, infringement notices, court proceedings |
| Formal warnings | Issued for first-time minor breaches |

## 6. Comprehensive Jurisdiction Comparison

### 6.1 Side-by-Side Comparison Table

| Aspect | CAN-SPAM (US) | CASL (Canada) | PECR (UK) | Spam Act (Australia) |
|--------|--------------|---------------|-----------|---------------------|
| **Consent model** | Opt-out | Opt-in (express/implied) | Opt-in (individual) / Soft opt-in (corporate) | Opt-in (express/inferred) |
| **Prior consent required for cold email** | No | Yes (express or implied) | Individual: Yes; Corporate: Soft opt-in | Yes (express or inferred) |
| **B2B exception** | None needed — B2B cold email permitted | Limited — "conspicuously published" exception | Corporate subscriber soft opt-in | Inferred consent for business context |
| **Sender identification** | Required | Required (name, address, contact) | Required (sender details) | Required (name, address, contact) |
| **Physical address** | Required | Required | Not explicitly required (but recommended) | Not explicitly required (but contact details required) |
| **Unsubscribe mechanism** | Required (10 business days to honor) | Required (readily performable; 10 business days to honor) | Required (without undue delay) | Required (5 business days to honor) |
| **Subject line rules** | Must not be deceptive | Must not be misleading | Must not be misleading | Must not be misleading |
| **Honor opt-out timeline** | 10 business days | 10 business days (unlawful to continue after opt-out received) | Without undue delay (target: instant) | 5 business days |
| **Maximum penalty per violation** | $50,120 | CAD $10M (business) | £17.5M or 4% turnover | AUD $2.22M |
| **Private right of action** | ISPs only; no individual right | Yes (since 2025) | ICO enforcement (no individual right for PECR; UK GDPR rights) | No (ACMA enforcement) |
| **Criminal penalties** | Yes (for certain violations) | No (administrative + civil) | No (regulatory enforcement) | No (civil penalties) |
| **Enforcement body** | FTC, DOJ, State AGs | CRTC, Competition Bureau | ICO | ACMA |

### 6.2 Additional Jurisdictions

| Jurisdiction | Law | Consent Model | Key Requirements | Max Penalty |
|-------------|-----|--------------|-----------------|------------|
| **EU (ePrivacy)** | Directive 2002/58/EC | Opt-in | Prior consent for email marketing; cookie consent; DPO requirements | Varies by DPA (up to €20M) |
| **Germany** | UWG (Competition Law) | Strict opt-in | One of the strictest: cold email to B2B generally requires consent | €300K+ per violation; competitors can sue |
| **France** | LCEN + CNIL rules | Opt-in | Prior consent required; strict cookie enforcement | €3M or 2% turnover |
| **Brazil** | LGPD | Opt-in (for marketing) | Consent or legitimate interest; similar to GDPR | 2% of revenue (BRL 50M cap) |
| **Japan** | APPI | Opt-out (with conditions) | Must provide opt-out; specific identification requirements | ¥100M |
| **South Korea** | PIPA | Strict opt-in | Prior consent mandatory; very strict | KRW 500M or 3% revenue |
| **India** | DPDP Act 2023 | Opt-in | Consent required; data fiduciary obligations | ₹250 crore (~$30M) |
| **China** | PIPL + Advertising Law | Opt-in | Prior consent; strict data localization | ¥50M or 5% revenue |

### 6.3 LeadReach Default Rules by Region

```yaml
# LeadReach email compliance configuration
email_compliance:
  default_rule: "strictest_applicable_law"

  rules_by_region:
    united_states:
      law: "CAN-SPAM"
      consent_required: false  # opt-out model
      requirements:
        - accurate_from_header: true
        - non_deceptive_subject: true
        - physical_address: true
        - unsubscribe_link: true
        - honor_opt_out_days: 10
      
    canada:
      law: "CASL"
      consent_required: true  # opt-in model
      consent_types:
        - express_consent  # preferred
        - implied_consent_ebr  # existing business relationship
        - implied_consent_published  # conspicuously published
      requirements:
        - sender_identification: true
        - physical_address: true
        - unsubscribe_link: true
        - honor_opt_out_days: 10
      special_note: "Default to express consent for cold outreach; document implied consent basis"

    united_kingdom:
      law: "PECR + UK GDPR"
      consent_required: true  # for individuals
      b2b_exception: "soft_opt_in_corporate_subscriber"
      requirements:
        - legitimate_interest_documented: true  # UK GDPR
        - sender_identification: true
        - unsubscribe_link: true
        - honor_opt_out_promptly: true
      special_note: "Corporate subscribers: soft opt-in + legitimate interest + opt-out"

    european_union:
      law: "ePrivacy Directive + GDPR"
      consent_required: true  # for individuals
      b2b_approach: "legitimate_interest_with_lia"
      requirements:
        - legitimate_interest_documented: true
        - sender_identification: true
        - unsubscribe_link: true
        - honor_opt_out_promptly: true
        - no_tracking_without_consent: true  # email open/click tracking
      country_specific:
        germany: "Strict opt-in recommended; UWG allows B2B under legitimate interest but courts are strict"
        france: "Opt-in required; CNIL enforces strictly"

    australia:
      law: "Spam Act 2003"
      consent_required: true  # express or inferred
      requirements:
        - sender_identification: true
        - contact_details: true
        - unsubscribe_link: true
        - honor_opt_out_days: 5

    other_jurisdictions:
      default: "opt_in_required"
      note: "When in doubt, require opt-in consent before sending any commercial email"
```

## 7. Unsubscribe Compliance Automation

### 7.1 One-Click Unsubscribe Requirement

**RFC 8058** (March 2017) defines the standard for one-click unsubscribe:

- The email must include a `List-Unsubscribe` header with an `https` URL
- The URL must unsubscribe the recipient with a **single HTTP GET or POST request** — no confirmation page, no login, no CAPTCHA
- Gmail, Outlook, Yahoo, and other major ISPs support and increasingly require this
- Google and Yahoo (since February 2024) **require** one-click unsubscribe for bulk senders (>5,000 emails/day)

### 7.2 Unsubscribe Implementation

```python
# LeadReach Unsubscribe Handler
# Must comply with RFC 8058 (one-click) and all jurisdiction-specific timelines

from fastapi import FastAPI, Request, Response
from datetime import datetime

app = FastAPI()

@app.post("/unsubscribe/{token}")
async def one_click_unsubscribe(token: str, request: Request):
    """
    RFC 8058 one-click unsubscribe endpoint.
    
    Requirements:
    - Single POST request (no confirmation page)
    - No login required
    - No CAPTCHA
    - Process immediately
    - Return 200 OK
    """
    # 1. Decode and validate token
    try:
        payload = UnsubscribeToken.decode(token)
        prospect_id = payload["prospect_id"]
        campaign_id = payload["campaign_id"]
        email = payload["email"]
    except InvalidTokenError:
        return Response(status_code=400)
    
    # 2. Check if already unsubscribed (idempotent)
    if SuppressionList.is_suppressed(prospect_id):
        return Response(status_code=200)  # Already unsubscribed — success
    
    # 3. Add to suppression list with metadata
    SuppressionList.add(
        prospect_id=prospect_id,
        email=email,
        reason="unsubscribed",
        source="one_click",
        campaign_id=campaign_id,
        unsubscribed_at=datetime.utcnow(),
        jurisdiction=payload.get("jurisdiction", "unknown")
    )
    
    # 4. Propagate to all systems
    propagate_opt_out(
        prospect_id=prospect_id,
        email=email,
        systems=["crm", "email_service", "scoring_engine", "analytics"]
    )
    
    # 5. Cancel scheduled emails
    CampaignManager.cancel_scheduled_emails(
        prospect_id=prospect_id,
        campaign_id=campaign_id
    )
    
    # 6. Audit log
    AuditLog.record(
        action="unsubscribed_one_click",
        prospect_id=prospect_id,
        email=email,
        campaign_id=campaign_id,
        timestamp=datetime.utcnow(),
        ip_address=request.client.host,
        user_agent=request.headers.get("user-agent", "")
    )
    
    # 7. Return success (RFC 8058 requires 200)
    return Response(status_code=200)


@app.get("/unsubscribe/{token}")
async def unsubscribe_get(token: str, request: Request):
    """
    GET-based unsubscribe (for browsers clicking the link).
    Shows confirmation page and processes unsubscribe.
    """
    # Same logic as POST but returns HTML confirmation
    payload = UnsubscribeToken.decode(token)
    
    if not SuppressionList.is_suppressed(payload["prospect_id"]):
        SuppressionList.add(
            prospect_id=payload["prospect_id"],
            email=payload["email"],
            reason="unsubscribed",
            source="web_link",
            unsubscribed_at=datetime.utcnow()
        )
        propagate_opt_out(payload["prospect_id"], payload["email"])
    
    return HTMLResponse(content=UNSUBSCRIBED_CONFIRMATION_PAGE)
```

### 7.3 List-Unsubscribe Email Header Configuration

```python
# Email header configuration for compliance
def build_email_headers(prospect, campaign):
    """Build compliant email headers with List-Unsubscribe."""
    
    token = UnsubscribeToken.encode({
        "prospect_id": prospect.id,
        "campaign_id": campaign.id,
        "email": prospect.email,
        "jurisdiction": prospect.jurisdiction,
        "exp": datetime.utcnow() + timedelta(days=60)  # Token valid 60 days
    })
    
    unsubscribe_url = f"https://u.leadreach.io/unsubscribe/{token}"
    
    return {
        # RFC 2369: List-Unsubscribe header
        "List-Unsubscribe": f"<{unsubscribe_url}>",
        
        # RFC 8058: One-Click Unsubscribe
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        
        # Standard headers
        "From": f"{campaign.sender_name} <{campaign.sender_email}>",
        "Reply-To": campaign.reply_to_email,
        "X-Mailer": "LeadReach",
        
        # Campaign tracking (internal)
        "X-LeadReach-Campaign": campaign.id,
        "X-LeadReach-Prospect": prospect.id,
    }
```

### 7.4 Unsubscribe SLA by Jurisdiction

| Jurisdiction | Legal Requirement | LeadReach SLA | Implementation |
|-------------|-------------------|---------------|----------------|
| US (CAN-SPAM) | 10 business days | Instant | Automated one-click |
| Canada (CASL) | 10 business days | Instant | Automated one-click |
| UK (PECR) | Without undue delay | Instant | Automated one-click |
| Australia (Spam Act) | 5 business days | Instant | Automated one-click |
| EU (ePrivacy) | Without undue delay | Instant | Automated one-click |
| All others | As soon as practicable | Instant | Automated one-click |

**LeadReach exceeds all legal requirements** by processing unsubscribes instantly via automation.

## 8. Compliance Email Template Structure

### 8.1 Required Elements in Every Outreach Email

```html
<!-- LeadReach Compliant Email Template -->
<html>
<body>
  <!-- Email Content -->
  <div class="email-body">
    <p>Hi {prospect_first_name},</p>
    <!-- Personalized content here -->
    <p>[Email body content — relevant, non-deceptive, professional]</p>
    <p>Best regards,<br>{sender_name}<br>{sender_title}<br>{company_name}</p>
  </div>

  <!-- Compliance Footer (REQUIRED IN EVERY EMAIL) -->
  <div class="email-footer" style="font-size:12px; color:#666; padding:20px 0; border-top:1px solid #ddd;">
    
    <!-- 1. Unsubscribe Link -->
    <p>
      You received this email because we thought you might be interested in 
      solutions for {icp_category}. 
      <a href="{unsubscribe_url}">Unsubscribe</a> | 
      <a href="{preferences_url}">Email Preferences</a>
    </p>
    
    <!-- 2. Physical Postal Address (CAN-SPAM) -->
    <p>
      {company_name}<br>
      {street_address}<br>
      {city}, {state} {zip}
    </p>
    
    <!-- 3. Canadian CASL Notice (if recipient is in Canada) -->
    <!-- Conditional: shown only for Canadian recipients -->
    <p>
      We are sending you this message because you have consented to receive 
      commercial electronic messages from {company_name}. 
      If you wish to unsubscribe from all future communications, 
      <a href="{unsubscribe_url}">click here</a>.
    </p>
    
    <!-- 4. GDPR/PECR Notice (if recipient is in EU/UK) -->
    <!-- Conditional: shown only for EU/UK recipients -->
    <p>
      We process your professional contact data under our legitimate interest 
      to inform you about relevant business solutions. You have the right to 
      object to this processing at any time. 
      <a href="{privacy_policy_url}">Privacy Policy</a> | 
      <a href="{data_rights_url}">Your Data Rights</a>
    </p>
    
  </div>
</body>
</html>
```

### 8.2 Subject Line Compliance Rules

| Rule | Description | ❌ Non-Compliant Example | ✅ Compliant Example |
|------|------------|------------------------|---------------------|
| Must reflect content | Subject must match email body | "URGENT: Action Required" (sales pitch) | "Streamline your sales pipeline with LeadReach" |
| No fake "Re:" | Cannot imply prior conversation | "Re: Your inquiry about our platform" (no prior inquiry) | "Following up — sales automation for Acme Corp" |
| No false urgency | Cannot create fake time pressure | "Last chance: Offer expires tonight" (no such offer) | "Webinar: Sales AI trends — Thursday at 2pm" |
| No misleading sender | Subject must not mislead about who sent it | "From your account manager" (no such relationship) | "Mike at LeadReach — AI for your sales team" |
| Must be honest about commercial nature | Cannot disguise marketing as personal | "Quick question for you" (without clearly commercial context) | "Quick question about Acme Corp's sales stack" |

## 9. Penalties and Case Studies

### 9.1 Notable Enforcement Actions

| Case | Year | Jurisdiction | Penalty | Key Lesson for LeadReach |
|------|------|-------------|---------|------------------------|
| **FTC v. ValueClick** | 2008 | US (CAN-SPAM) | $2.9M settlement | Deceptive subject lines; misleading "free" offers; failure to honor opt-outs |
| **CRTC v. Blackstone** | 2017 | Canada (CASL) | CAD $75,000 | Sent CEMs without consent; no unsubscribe mechanism; commercial activity before CASL safe harbor |
| **CRTC v. Compu-Finder** | 2015 | Canada (CASL) | CAD $1.1M | First major CASL penalty; sent CEMs without consent; inadequate unsubscribe; training failures |
| **CRTC v. Porter Airlines** | 2018 | Canada (CASL) | CAD $150,000 | Sent CEMs without consent; some unsubscribe mechanisms non-functional; no compliance program |
| **ICO v. LEDR Group** | 2022 | UK (PECR) | £60,000 | Sent marketing emails without consent; 1.2M+ spam reports; individual subscribers targeted |
| **ICO v. CPP Investments** | 2023 | UK (PECR+GDPR) | Warning + enforcement notice | Direct marketing to individual subscribers without consent |
| **ACMA v. Optus** | 2023 | Australia (Spam Act) | AUD $504M (broader telecom violation) | Failed to honor opt-outs; sent marketing without consent |
| **ACMA v. Ticketek** | 2022 | Australia (Spam Act) | AUD $715,500 | Sent marketing emails without functional unsubscribe |
| **FTC v. CLX Networks** | 2024 | US (CAN-SPAM) | $2.5M | Address harvesting; deceptive subject lines; misleading headers |
| **CRTC v. HomeSense/WINNERS** | 2024 | Canada (CASL) | CAD $100,000 | CEMs without consent; inadequate compliance program |

### 9.2 Case Study: CAN-SPAM Enforcement Against B2B Sender

**Hypothetical scenario (based on composite of FTC enforcement patterns):**

A B2B SaaS company sends 100,000 cold emails per month. 15% of subject lines use "Re:" when there was no prior conversation. 5% of unsubscribe links are broken. 3% of emails lack a physical address.

**Potential exposure:**
- Deceptive "Re:" subject lines: 15,000 emails × $50,120 = $751,800,000
- Broken unsubscribe links: 5,000 emails × $50,120 = $250,600,000
- Missing physical address: 3,000 emails × $50,120 = $150,360,000

**Actual penalty (FTC typically seeks a fraction of maximum):** $1-5M settlement + compliance monitoring for 20 years

**Lesson:** Even a fraction of the maximum penalty is devastating. Compliance is non-negotiable.

### 9.3 Case Study: CASL Impact on B2B Outreach

A Canadian software company relied on the "conspicuously published" exception to send cold B2B emails to prospects whose emails were on company websites. They did not verify that the emails were published without anti-spam notices, and some outreach was only tangentially related to the recipient's role.

**CRTC findings:**
- The "conspicuously published" exception was applied too broadly
- Some outreach was not relevant to the recipient's business role
- The compliance program was inadequate
- No records of consent basis were maintained

**Penalty:** CAD $200,000 + mandatory compliance program + 3-year compliance monitoring

**LeadReach mitigation:** Always document the consent basis; verify relevance to role; maintain consent records; implement robust compliance program.

## 10. Suppression List Management

### 10.1 Suppression List Architecture

```
LeadReach Suppression List System
===================================

Sources of Suppression:
├── Unsubscribe (one-click, link, reply-to)
├── CCPA/CPRA opt-out (Do Not Sell/Share)
├── GDPR right to object
├── Hard bounce (invalid email)
├── Spam complaint (RFC 5965 report)
├── Manual suppression (competitor, do-not-contact request)
├── DNC registry match (phone)
└── Authorized agent opt-out

Suppression Granularity:
├── Global suppression (no contact via any channel)
├── Channel-specific (email only, phone only, etc.)
├── Sender-specific (from specific campaign or team)
├── Campaign-specific (from specific campaign only)
└── Temporary (cool-down period after opt-out)

Processing Rules:
├── Check BEFORE every send (real-time lookup)
├── Check BEFORE every call (real-time lookup)
├── No race conditions (atomic check-and-send)
├── Audit log every check and action
└── Regular deduplication and cleanup
```

### 10.2 Suppression List Data Model

```json
{
  "suppression_id": "sup-uuid-v4",
  "prospect_id": "leadreach-prospect-id",
  "email": "sha256-hashed-email",
  "phone": "sha256-hashed-phone",
  "suppression_type": "global",
  "channel": "all",
  "reason": "unsubscribed",
  "source": "one_click",
  "jurisdiction": "US",
  "created_at": "2026-07-08T14:30:00Z",
  "expires_at": null,
  "notes": "Unsubscribed via one-click from campaign ABC-123",
  "propagation_status": {
    "crm": "completed",
    "email_service": "completed",
    "scoring_engine": "completed",
    "analytics": "anonymized"
  }
}
```

### 10.3 Suppression List Maintenance

| Task | Frequency | Owner | Notes |
|------|----------|-------|-------|
| Deduplication | Daily | Engineering | Remove duplicate entries; retain most restrictive |
| Expiration check | Daily | Engineering | Remove temporary suppressions past expiry |
| Propagation verification | Weekly | Engineering | Confirm all systems have current suppression data |
| Re-subscription processing | On request | Operations | If prospect re-subscribes, remove suppression (document consent) |
| Audit | Monthly | Compliance | Review all additions/removals for the month |
| Full sync | Quarterly | Engineering | Full synchronization across all systems |

## 11. Agent-Specific Compliance Guidance

### Atlas (Intent Classification)
- Classify email intents with awareness of jurisdiction-specific consent requirements
- Flag any intent targeting Canadian, UK, or Australian prospects as requiring consent verification
- Tag outreach intents with the applicable legal regime

### Scout (Research)
- Do not collect email addresses through harvesting (address harvesting is illegal under CAN-SPAM aggravated violations and CASL)
- Only collect email addresses from legitimate public sources (company websites, professional directories)
- Record the source of every email address for consent basis documentation

### Forge (Enrichment)
- When enriching with email addresses, verify the source and consent basis
- Flag Canadian email addresses for CASL consent verification before use
- Do not generate email addresses through dictionary attacks (illegal under CAN-SPAM)

### Judge (Scoring)
- Do not penalize prospects for being in stricter jurisdictions
- Ensure scoring treats all prospects equitably regardless of their location's legal regime
- Flag high-value prospects in strict jurisdictions for consent verification before outreach

### Bard (Content Generation)
- Every email must include all compliance elements (unsubscribe, address, accurate headers)
- Subject lines must be truthful and non-deceptive
- Never use "Re:" or "Fwd:" unless there was a prior conversation or forward
- Include jurisdiction-specific footer content (CASL notice for CA, GDPR notice for EU)
- Do not reference personal or sensitive information in outreach content

### Flow (Campaign Orchestration)
- **Check suppression list before every single email send** — no exceptions
- Implement atomic check-and-send (no race conditions)
- Configure jurisdiction-specific compliance checks (consent for CA/UK/AU/EU)
- Set frequency caps (max 3 emails per prospect per 30 days)
- Configure List-Unsubscribe headers for every email
- Process unsubscribe tokens instantly
- Honor opt-out within jurisdiction-specific timelines (default: instant)
- Do not auto-dial mobile numbers without prior consent

### Echo (Analytics and Reporting)
- Track unsubscribe rates by jurisdiction (anomalies may indicate compliance issues)
- Track spam complaint rates (above 0.1% triggers review)
- Report on consent coverage by jurisdiction
- Do not expose individual recipient data in reports
- Support regulatory reporting requirements

## 12. Compliance Checklist: Before Every Campaign

### Pre-Launch Verification

- [ ] All prospect jurisdictions identified (US, CA, UK, EU, AU, other)
- [ ] Consent status verified for each jurisdiction:
  - US: No prior consent required (opt-out model)
  - CA: Express or implied consent documented; CASL basis recorded
  - UK: Legitimate interest documented (LIA) + soft opt-in verified for corporate subscribers
  - EU: Legitimate interest documented (LIA) + opt-out provided
  - AU: Inferred consent basis documented; opt-out provided
  - Other: Consent obtained or jurisdiction-specific rules verified
- [ ] All email templates reviewed for compliance elements:
  - Accurate From name and email
  - Non-deceptive subject lines
  - Physical postal address in footer
  - Working unsubscribe link (one-click)
  - List-Unsubscribe headers configured
  - Jurisdiction-specific footer content
- [ ] Suppression list integrated and checked
- [ ] Frequency caps configured
- [ ] Unsubscribe handler tested and functional
- [ ] Email authentication configured (SPF, DKIM, DMARC)
- [ ] Compliance audit trail enabled

### During Campaign

- [ ] Unsubscribe rate monitored (target: <0.5%)
- [ ] Spam complaint rate monitored (target: <0.1%)
- [ ] Bounce rate monitored (target: <2%)
- [ ] Any compliance issues flagged and paused immediately

### Post-Campaign

- [ ] Suppression list updated with all opt-outs
- [ ] Consent records archived
- [ ] Campaign compliance documentation stored
- [ ] Lessons learned captured for future campaigns

## 13. Email Authentication Requirements

While not strictly "anti-spam law" compliance, email authentication is essential for deliverability and is increasingly required by mailbox providers:

| Protocol | Purpose | LeadReach Requirement |
|----------|---------|----------------------|
| **SPF** (Sender Policy Framework) | Authorizes which servers can send email on behalf of your domain | Published for all sending domains; includes LeadReach IPs and third-party senders |
| **DKIM** (DomainKeys Identified Mail) | Cryptographically signs emails to verify they weren't altered in transit | All outbound emails signed; key rotation every 6 months |
| **DMARC** (Domain-based Message Authentication, Reporting & Conformance) | Builds on SPF and DKIM; specifies what to do with unauthenticated emails | Policy: `p=reject`; reporting: `rua=mailto:dmarc@leadreach.io` |
| **BIMI** (Brand Indicators for Message Identification) | Displays brand logo next to emails in supported mailboxes | Implemented for brand recognition + DMARC compliance signal |

**Google and Yahoo requirements (since February 2024):**
- Bulk senders (>5,000 emails/day) must authenticate with SPF/DKIM/DMARC
- DMARC policy must be at least `p=none` (LeadReach uses `p=reject`)
- One-click unsubscribe (RFC 8058) is mandatory
- Spam complaint rate must stay below 0.3% (Gmail threshold)

---

*This document is a living reference. Last reviewed: 2026-07-08. Next review: 2026-10-08. All LeadReach agents must follow these guidelines. When in doubt, default to the strictest applicable law (generally CASL or GDPR/ePrivacy).*
