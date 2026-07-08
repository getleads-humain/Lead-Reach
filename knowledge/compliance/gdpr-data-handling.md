---
title: "GDPR Data Handling for B2B Lead Generation"
category: compliance
grade: A
last_reviewed: 2026-07-08
tags: [gdpr, data-handling, consent, dpo, dpia, international-transfer, cookie-compliance, b2b-lead-gen, legitimate-interest, data-subject-rights]
---

# GDPR Data Handling for B2B Lead Generation

## 1. Overview and Scope

The General Data Protection Regulation (Regulation (EU) 2016/679) applies to **any organization that processes personal data of individuals located in the European Economic Area (EEA)**, regardless of where the organization is established. For LeadReach, this means every data point collected about an EU-based prospect — from a work email address to a LinkedIn job title — triggers GDPR obligations.

### Why GDPR Matters for B2B Lead Generation

A common misconception is that GDPR only applies to consumer (B2C) data. This is **incorrect**. GDPR protects "natural persons," and a business email address that identifies an individual (e.g., `jane.smith@company.de`) constitutes personal data. The B2B context affects the **lawful basis** you can rely on (legitimate interest is more viable), but it does **not** exempt you from compliance.

### Key Definitions

| Term | Definition | LeadReach Example |
|------|-----------|-------------------|
| Personal Data | Any information relating to an identified or identifiable natural person | Prospect's name, work email, job title |
| Data Controller | Entity that determines purposes and means of processing | LeadReach (when running campaigns for itself) |
| Data Processor | Entity that processes data on behalf of the controller | LeadReach (when processing data for a customer's campaign) |
| Processing | Any operation performed on personal data | Collecting, storing, enriching, scoring, emailing |
| Special Category Data | Sensitive data requiring additional protection (Article 9) | Health, religion, political opinions — **never collect** |
| Consent | Freely given, specific, informed, unambiguous indication | Opt-in checkbox, not pre-ticked |
| Legitimate Interest | Business interest not overridden by individual's rights | B2B cold outreach relevant to prospect's role |
| DPO | Data Protection Officer — mandatory in certain circumstances | Required if large-scale monitoring or special category processing |

## 2. Lawful Bases for Processing B2B Contact Data

GDPR Article 6 provides six lawful bases. For LeadReach's B2B lead generation activities, three are relevant:

### 2.1 Legitimate Interest (Article 6(1)(f)) — Primary Basis for B2B Outreach

This is the most commonly used basis for B2B cold outreach. It requires a **three-part Legitimate Interest Assessment (LIA)**:

**Part 1: Purpose Test** — Is there a legitimate purpose?
- Direct marketing to B2B contacts in relevant roles is recognized as legitimate
- The outreach must be relevant to the recipient's professional role
- Purpose must be clearly documented before processing begins

**Part 2: Necessity Test** — Is processing necessary for that purpose?
- Could the same result be achieved with less intrusive means?
- For B2B lead gen, contacting relevant professionals via their work email is typically necessary
- Mass outreach to completely irrelevant contacts fails this test

**Part 3: Balancing Test** — Do the individual's interests override yours?
- Consider: nature of data, reasonable expectations, impact on individual, safeguards
- B2B contacts at their work email have lower reasonable expectation of privacy for business-relevant communications
- Always provide easy opt-out mechanism
- If the individual objects, their interests **override** yours — you must stop

#### LIA Template for LeadReach Campaigns

```
Legitimate Interest Assessment
================================
Campaign: [Campaign Name]
Date: [Assessment Date]
Assessor: [Name/Role]

PURPOSE
- What is the legitimate interest? [e.g., "Market our SaaS product
  to relevant decision-makers at mid-market companies in the DACH region"]
- Why is this a legitimate interest? [e.g., "Direct marketing is recognized
  as legitimate under Recital 47; targeting is role-specific and relevant"]

NECESSITY
- Is processing necessary? [Yes/No with justification]
- Are there less intrusive alternatives? [Describe alternatives considered]
- Why were alternatives rejected? [Justification]

BALANCING
- Nature of data: [Work contact info only — low sensitivity]
- Reasonable expectations: [B2B professional at work email; industry norm]
- Impact on individual: [Minimal — can opt out; no profiling of sensitive data]
- Safeguards: [One-click opt-out; data minimization; 24-month retention;
  no special category data; suppression list maintained]

RESULT: [Proceed / Do not proceed / Modify]
Notes: [Any additional considerations]
```

### 2.2 Consent (Article 6(1)(a)) — Required in Specific Scenarios

Consent is required when:
- Processing special category data (which LeadReach should never do)
- The legitimate interest balancing test fails
- Individual has objected to legitimate interest processing
- Local DPA guidance mandates consent for certain B2B contexts (e.g., Germany has stricter interpretations for email marketing)

**Valid consent must be:**
- Freely given (no detriment for refusing; not bundled with T&Cs)
- Specific (for each distinct processing purpose)
- Informed (clear who the controller is, what data, why)
- Unambiguous (clear affirmative action — opt-in, not opt-out)
- Documented (records of when, how, and what was consented to)
- Revocable (as easy to withdraw as to give)

#### Consent Record Schema

```json
{
  "consent_id": "uuid-v4",
  "prospect_id": "leadreach-prospect-id",
  "consent_type": "email_marketing",
  "lawful_basis": "consent",
  "consent_text_shown": "Full text of consent request presented to prospect",
  "consent_method": "web_form_checkbox",
  "consent_given_at": "2026-07-08T14:30:00Z",
  "consent_version": "2.1",
  "withdrawn": false,
  "withdrawn_at": null,
  "withdrawal_method": null,
  "source_url": "https://example.com/subscription-page",
  "ip_address": "203.0.113.42",
  "user_agent": "Mozilla/5.0..."
}
```

### 2.3 Contractual Necessity (Article 6(1)(b))

Applicable when:
- Processing is necessary to perform a contract with the prospect
- Examples: Fulfilling a demo request, sending requested content, providing trial access
- Not applicable for cold outreach (no pre-existing contract)

### Decision Matrix: Choosing the Right Lawful Basis

| Scenario | Recommended Basis | Rationale |
|----------|------------------|-----------|
| Cold email to EU prospect (role-relevant) | Legitimate Interest | Recital 47 recognizes direct marketing as legitimate; B2B context supports balancing test |
| Cold email to EU prospect (tangentially relevant) | Consent required | Balancing test likely fails; necessity test questionable |
| Email to prospect who downloaded content | Legitimate Interest | Soft opt-in under PECR Article 13; existing customer/enquirer relationship |
| Email after prospect explicitly opted in | Consent | Clear affirmative action recorded |
| Enrichment with publicly available professional data | Legitimate Interest | Publicly available professional data; lower privacy expectations |
| Enrichment with data from paid data provider | Legitimate Interest (if provider is compliant) | Verify provider has lawful basis; check DPA terms |
| Automated lead scoring using AI | Legitimate Interest + DPIA | High-risk automated processing; DPIA required |

## 3. Consent Management

### 3.1 Consent Collection Mechanisms

For LeadReach, consent may be collected through:

1. **Website forms** — Checkbox (not pre-ticked) with clear consent text
2. **Content downloads** — Explicit consent for marketing emails at point of download
3. **Event registrations** — Separate consent for post-event marketing
4. **Referral programs** — Referred prospect must give their own consent
5. **Chat bots** — Consent captured in chat transcript with timestamp

### 3.2 Consent Management Platform Requirements

LeadReach must implement a consent management system that:

- **Centralizes** all consent records in a single auditable store
- **Timestamps** every consent action (given, withdrawn, version of notice)
- **Links** consent to specific processing purposes (granular consent)
- **Propagates** withdrawal across all systems within 48 hours
- **Reports** on consent rates by channel, geography, and purpose
- **Retains** consent records for evidence even after withdrawal (for 3 years or until statute of limitations expires)

### 3.3 Consent Withdrawal Process

```python
# Pseudocode: Consent withdrawal handler
def handle_consent_withdrawal(prospect_id: str, consent_type: str):
    """
    Process a consent withdrawal request from a prospect.
    Must complete within 48 hours across all systems.
    """
    # 1. Record the withdrawal with timestamp
    consent_record = ConsentStore.get(prospect_id, consent_type)
    consent_record.withdrawn = True
    consent_record.withdrawn_at = datetime.utcnow()
    consent_record.withdrawal_method = "email_link"  # or "web_form", "phone"

    # 2. Add to suppression list
    SuppressionList.add(prospect_id, reason="consent_withdrawn")

    # 3. Propagate to all processing systems
    systems = [
        "crm", "email_service", "enrichment_pipeline",
        "scoring_engine", "analytics", "reporting"
    ]
    for system in systems:
        SystemConnector.propagate_opt_out(system, prospect_id)

    # 4. Stop all active campaigns targeting this prospect
    CampaignManager.pause_for_prospect(prospect_id)

    # 5. Audit log
    AuditLog.record(
        action="consent_withdrawn",
        prospect_id=prospect_id,
        consent_type=consent_type,
        timestamp=datetime.utcnow(),
        propagated_systems=systems
    )

    # 6. Send confirmation to prospect
    NotificationService.send_withdrawal_confirmation(prospect_id)
```

### 3.4 Soft Opt-In Rule (PECR Regulation 22)

The Privacy and Electronic Communications Regulations (UK) and ePrivacy Directive provide a "soft opt-in" exception:
- You may email **existing customers** about similar products/services without prior consent
- The prospect must have been given the opportunity to opt out at the time of data collection
- Each subsequent email must include an opt-out mechanism

**LeadReach Application:** If a prospect has previously engaged with LeadReach (downloaded content, attended a webinar, requested a demo), the soft opt-in may apply for follow-up marketing about similar offerings. Document the original engagement and the opt-out opportunity provided.

## 4. Data Protection Officer (DPO) Requirements

### 4.1 When a DPO Is Mandatory

A DPO must be appointed when:
- The organization is a **public authority or body**
- Core activities require **large-scale, regular, and systematic monitoring** of individuals
- Core activities require **large-scale processing of special category data** or criminal conviction data

### 4.2 LeadReach DPO Assessment

| Criterion | LeadReach Status | Assessment |
|-----------|-----------------|------------|
| Public authority | No | Not applicable |
| Large-scale regular monitoring | Yes | LeadReach tracks prospect engagement at scale; AI agents process behavioral data systematically |
| Large-scale special category processing | No | LeadReach does not process special category data |
| **Conclusion** | **DPO recommended** | While arguably not strictly mandatory if monitoring is not the "core activity," best practice and DPA guidance strongly recommend appointment |

### 4.3 DPO Responsibilities

The DPO must:
1. Inform and advise the organization and employees about GDPR obligations
2. Monitor compliance with GDPR and internal data protection policies
3. Advise on Data Protection Impact Assessments (DPIAs)
4. Act as the contact point for the supervisory authority
5. Be independent — cannot be dismissed for performing DPO tasks
6. Have access to all processing activities and relevant information
7. Report directly to the highest management level

### 4.4 DPO Contact Information

LeadReach must publish DPO contact details:
- In the privacy policy
- In the records of processing activities
- Available to the supervisory authority on request
- Available to data subjects on request

## 5. Data Subject Rights in the Prospecting Context

### 5.1 Rights Overview and Response Requirements

| Right | GDPR Article | Response Deadline | LeadReach Implementation |
|-------|-------------|-------------------|--------------------------|
| Right to be informed | Articles 13-14 | At point of data collection | Privacy policy + collection notice |
| Right of access (DSAR) | Article 15 | 30 calendar days (extendable by 2 months for complex requests) | Automated data export API |
| Right to rectification | Article 16 | 30 calendar days | CRM update + propagation |
| Right to erasure | Article 17 | 30 calendar days (without undue delay) | Cascading delete across all systems |
| Right to restrict processing | Article 18 | 30 calendar days | Flag record; halt processing; retain data |
| Right to data portability | Article 20 | 30 calendar days | JSON/CSV export of prospect's data |
| Right to object | Article 21 | 30 calendar days | Stop processing + add to suppression list |
| Rights re: automated decision-making | Article 22 | 30 calendar days | Human review of AI scoring decisions |

### 5.2 Right of Access in B2B Prospecting

When a prospect exercises their right of access, LeadReach must provide:
- **All personal data** held about them (including inferred/derived data)
- **Purpose of processing** for each data category
- **Lawful basis** relied upon for each purpose
- **Recipients or categories of recipients** of the data
- **Retention period** or criteria used to determine retention
- **Information about their rights** (to object, to erasure, to complain to DPA)
- **Information about automated decision-making**, including meaningful information about the logic involved

#### DSAR Response Workflow

```
1. Receive DSAR (via email, web form, phone)
   └──> Log request with timestamp (Day 0)
2. Verify identity of requestor
   └──> Compare with stored data (email, name, company)
3. Search all systems for prospect's data
   ├──> CRM (contact records, notes, activity history)
   ├──> Email platform (sent/received emails)
   ├──> Scoring engine (lead scores, model inputs)
   ├──> Analytics (page views, engagement data)
   ├──> Enrichment data (company data, technographic data)
   └──> Consent records
4. Compile response package
   ├──> Structured data (JSON/CSV format)
   └──> Explanatory cover letter
5. Legal review (if complex or data includes third-party data)
6. Deliver response to prospect
   └──> Within 30 days of receipt
7. Audit log the entire process
```

### 5.3 Right to Erasure in Prospecting

Erasure must be performed across **all systems** where the prospect's data resides:

| System | Erasure Action | Notes |
|--------|---------------|-------|
| CRM | Delete contact record + all associated data | Not just "mark deleted" — actual deletion or anonymization |
| Email platform | Delete from sent queue + suppression | Prevent future sends; remove from templates |
| Scoring engine | Delete scoring record + model features | Must not retain features that identify the individual |
| Analytics | Anonymize or aggregate | Remove individual-level data from reports |
| Backup systems | Flag for deletion on next backup rotation | Document why immediate deletion may not be feasible |
| Third-party processors | Notify and request deletion | Contractual obligation under DPA |
| Consent store | Retain withdrawal record (evidence) | Anonymize the consent record itself |

**Exceptions to erasure:**
- Legal obligation to retain (e.g., tax records, contract evidence)
- Establishment, exercise, or defense of legal claims
- Archiving purposes in the public interest
- Freedom of expression and information

### 5.4 Right to Object to Direct Marketing

This right is **absolute** for direct marketing. If a prospect objects:
- Stop all marketing communications **immediately** — no exceptions
- No balancing test required (unlike other Article 21 objections)
- Add prospect to global suppression list
- Retain minimal data needed to ensure suppression is honored (name + email + objection date)
- Do not use data for profiling related to direct marketing

## 6. Data Protection Impact Assessment (DPIA) for AI Agents

### 6.1 When a DPIA Is Required

A DPIA is mandatory when processing is likely to result in **high risk** to individuals' rights and freedoms. For LeadReach, this includes:

- **Automated lead scoring and prioritization** (Article 22: automated decision-making with legal/significant effects)
- **Large-scale profiling** of prospects (systematic evaluation of personal aspects)
- **AI-driven personalization** of outreach content based on behavioral analysis
- **Cross-border data transfers** combined with large-scale processing
- **New AI agent deployment** (any new AI processing system that evaluates prospects)

### 6.2 DPIA Structure for LeadReach AI Systems

```
Data Protection Impact Assessment
==================================

1. DESCRIPTION OF PROCESSING
   1.1 Nature of processing: [Collection, enrichment, scoring, outreach]
   1.2 Scope of processing: [Volume of data, data categories, data sources]
   1.3 Context of processing: [B2B prospecting, cold outreach, AI-driven]
   1.4 Purpose of processing: [Identify and engage potential customers]
   1.5 Data flows: [Source → Processing → Storage → Output]

2. NECESSITY AND PROPORTIONALITY
   2.1 Is the processing necessary? [Justification]
   2.2 Are there less intrusive alternatives? [Alternatives considered]
   2.3 Data minimization measures: [What data is strictly necessary]
   2.4 Retention periods: [How long data is kept, why]

3. RISK ASSESSMENT
   3.1 Risks to data subjects:
       - Discrimination in lead scoring
       - Intrusive profiling (overly personal outreach)
       - Data breach exposing professional information
       - Loss of control over personal data
       - Reputational damage from unwanted outreach

   3.2 Risk matrix:
       | Risk | Likelihood | Severity | Overall |
       |------|-----------|----------|---------|
       | Biased scoring | Medium | High | High |
       | Data breach | Low | High | Medium |
       | Over-profiling | Medium | Medium | Medium |
       | Inadequate opt-out | Low | Medium | Low |

4. MITIGATION MEASURES
   4.1 Technical measures:
       - Encryption at rest and in transit
       - Access controls (RBAC)
       - Audit logging
       - Bias testing in scoring models
       - Automated opt-out processing

   4.2 Organizational measures:
       - DPO oversight
       - Regular compliance reviews
       - Staff training
       - Data processor agreements
       - Incident response plan

5. CONSULTATION
   5.1 DPO opinion: [Required before processing begins]
   5.2 Supervisory authority consultation: [If residual high risk remains]

6. APPROVAL
   Date: ______
   Approved by: ______ (DPO + senior management)
```

### 6.3 DPIA for Specific AI Agents

| Agent | DPIA Trigger | Key Risks | Mitigation |
|-------|-------------|-----------|------------|
| Scout (research) | Large-scale web scraping of professional profiles | Over-collection; scraping personal data | Restrict to business profiles only; source URL logging |
| Forge (enrichment) | Profiling through data aggregation | Inaccurate profiling; invasive enrichment | Accuracy checks; only business data; prospect notification |
| Judge (scoring) | Automated decision-making | Algorithmic bias; opaque scoring | Explainability reports; bias audits; human review option |
| Bard (content) | AI-generated personalized content | Over-personalization; referencing personal data | Template guardrails; no special category data; review workflows |
| Flow (campaign) | Large-scale automated outreach | Opt-out failures; over-messaging | Suppression list checks; frequency caps; instant opt-out |

## 7. International Data Transfer Mechanisms

### 7.1 Transfer Framework Overview

After Schrems II (CJEU C-311/18, July 2020) invalidated Privacy Shield, and the EU-US Data Privacy Framework (DPF) was established in July 2023, the following mechanisms are available:

| Mechanism | Status | Applicability | Key Requirements |
|-----------|--------|--------------|-----------------|
| EU-US DPF | Active (2023-) | US companies self-certified with US Dept of Commerce | Annual recertification; adherence to DPF principles; independent dispute resolution |
| Standard Contractual Clauses (SCCs) | Active (2021 module system) | All international transfers | Transfer impact assessment; supplementary measures if needed |
| Binding Corporate Rules (BCRs) | Active | Intra-group transfers | DPA approval required; long implementation timeline |
| UK International Data Transfer Agreement (IDTA) | Active (post-Brexit) | UK-originating transfers | UK-specific equivalent of SCCs |
| Adequacy decisions | Varies | Specific countries deemed adequate | EU Commission determines adequate protection; check current list |
| Derogations (Article 49) | Limited | Specific situations only | Explicit consent; contract necessity; public interest; NOT for routine transfers |

### 7.2 Transfer Impact Assessment (TIA)

When using SCCs, a Transfer Impact Assessment must evaluate:

1. **Law of the importing country** — Does it provide essentially equivalent protection?
2. **Relevant aspects of the legal system** — Government surveillance laws, law enforcement access
3. **Supplementary measures** — What additional safeguards are needed?
   - Technical: Encryption, pseudonymization, split processing
   - Contractual: Additional clauses in SCCs (e.g., government access challenge obligations)
   - Organizational: Access controls, approval policies, transparency reporting

### 7.3 LeadReach Transfer Configuration

```yaml
# LeadReach data transfer configuration
data_transfers:
  eu_to_us:
    mechanism: "EU-US DPF + SCCs (dual mechanism)"
    dpf_certification_id: "DPF-XXXXX"
    scc_module: "Module 2 (Controller to Processor)"
    supplementary_measures:
      - encryption_at_rest: "AES-256"
      - encryption_in_transit: "TLS 1.3"
      - access_controls: "RBAC with EU data access logging"
      - government_access_policy: "challenge_and_notify"
    transfer_impact_assessment:
      date: "2026-06-15"
      reviewer: "DPO"
      conclusion: "Adequate protection with supplementary measures"

  eu_to_uk:
    mechanism: "Adequacy decision (EU-UK) + UK IDTA as fallback"
    adequacy_decision_date: "2021-06-28"  # Extended periodically

  data_localization:
    russia: "No processing of Russian personal data (Federal Law 152-FZ)"
    china: "PIPL compliance assessment required before any processing"

  sub_processors:
    - name: "AWS Europe (Frankfurt)"
      role: "Primary data storage"
      location: "Frankfurt, Germany"
      mechanism: "Intra-EEA (no transfer)"
    - name: "SendGrid (US)"
      role: "Email delivery"
      location: "United States"
      mechanism: "DPF + SCCs"
    - name: "Snowflake (US)"
      role: "Analytics data warehouse"
      location: "United States"
      mechanism: "DPF + SCCs"
```

## 8. Cookie and Tracking Compliance

### 8.1 ePrivacy Directive Requirements

The ePrivacy Directive (2002/58/EC, as amended by 2009/136/EC) governs cookies and tracking technologies. Key rules:

| Cookie Category | Consent Required | Examples | LeadReach Usage |
|----------------|-----------------|----------|-----------------|
| Strictly necessary | No | Session cookies, security cookies, load balancing | Authentication cookies |
| Functional/preferences | Yes (but can be implied) | Language preferences, UI customization | Theme/settings cookies |
| Analytics/performance | Yes (explicit) | Google Analytics, Mixpanel | Campaign tracking, website analytics |
| Marketing/targeting | Yes (explicit) | Retargeting pixels, advertising cookies | LinkedIn Insight Tag, ad conversion tracking |

### 8.2 Cookie Consent Implementation

Requirements for valid cookie consent:
- **Prior to setting** any non-essential cookies (before the cookie loads)
- **Clear and specific** information about each category
- **Granular choice** — separate options for analytics vs. marketing
- **Accepting must be as easy as refusing** — no dark patterns
- **No pre-ticked boxes**
- **No cookie walls** — cannot block content access for refusing non-essential cookies
- **Must allow withdrawal** of consent as easily as it was given

### 8.3 Tracking Pixels and Email Analytics

**Critical:** Tracking pixels in emails (open tracking, click tracking) are regulated under ePrivacy:

- Open tracking pixels: **Consent required** under most DPA interpretations (CNIL, ICO guidance)
- Click tracking: May fall under "communications metadata" — consent generally required
- Link wrapping for analytics: Same consent requirements as click tracking

**LeadReach Policy:**
- Email open tracking is **disabled by default** for EU prospects
- Click tracking requires consent or legitimate interest basis with clear disclosure
- All tracking must be disclosed in the privacy policy and email footer
- Provide option to "view email in browser" without tracking for EU recipients

### 8.4 Cookie Consent Code Example

```html
<!-- LeadReach Cookie Consent Banner (GDPR Compliant) -->
<div id="cookie-consent-banner" class="cookie-banner" role="dialog" aria-label="Cookie preferences">
  <div class="cookie-content">
    <h2>We value your privacy</h2>
    <p>We use cookies to enhance your browsing experience, serve personalized content,
       and analyze our traffic. You can choose which categories to allow.</p>

    <div class="cookie-categories">
      <label class="cookie-category">
        <input type="checkbox" checked disabled>
        <span>Strictly Necessary</span>
        <p>Required for the website to function. Cannot be disabled.</p>
      </label>

      <label class="cookie-category">
        <input type="checkbox" name="analytics" data-cookie-category="analytics">
        <span>Analytics</span>
        <p>Help us understand how visitors interact with our website.</p>
      </label>

      <label class="cookie-category">
        <input type="checkbox" name="marketing" data-cookie-category="marketing">
        <span>Marketing</span>
        <p>Used to track visitors across websites for advertising purposes.</p>
      </label>
    </div>

    <div class="cookie-actions">
      <button id="reject-all" class="btn-secondary">Reject All Non-Essential</button>
      <button id="accept-all" class="btn-primary">Accept All</button>
      <button id="save-preferences" class="btn-secondary">Save My Preferences</button>
    </div>

    <p class="cookie-footer">
      Read our <a href="/privacy-policy">Privacy Policy</a> for more details.
    </p>
  </div>
</div>
```

## 9. Documentation Requirements

### 9.1 Records of Processing Activities (Article 30)

LeadReach must maintain records of all processing activities. As a **controller**, the record must include:

| Field | Description | LeadReach Example |
|-------|-------------|-------------------|
| Controller name & contact | Organization details | LeadReach Inc., 123 Market St, San Francisco, CA |
| DPO name & contact | If applicable | privacy@leadreach.io |
| Processing purposes | Why data is processed | B2B lead generation, enrichment, scoring, outreach |
| Data categories | Types of personal data | Name, work email, job title, company, industry, location |
| Data subjects | Who the data is about | Business professionals at target companies |
| Recipients | Who receives the data | CRM, email platforms, analytics providers, customers |
| International transfers | Cross-border movements | EU to US (DPF + SCCs) |
| Retention periods | How long data is kept | 24 months active; 3 years for consent records post-withdrawal |
| Technical & organizational measures | Security safeguards | Encryption, RBAC, audit logs, DPIAs |

### 9.2 Required Documentation Inventory

| Document | Purpose | Review Frequency | Owner |
|----------|---------|------------------|-------|
| Privacy Policy | Inform data subjects | Quarterly | Legal + DPO |
| Records of Processing (Art. 30) | Demonstrate accountability | Quarterly | DPO |
| Legitimate Interest Assessments | Justify LIA basis | Per campaign; annually | Campaign Manager + DPO |
| DPIAs | Assess high-risk processing | Per new AI system; annually | DPO + Engineering |
| Data Processing Agreements | Govern processor relationships | Per vendor; annually | Legal |
| SCCs / Transfer Agreements | International transfers | Per transfer mechanism; annually | Legal + DPO |
| Consent Records | Evidence of consent | Ongoing; retained 3 years post-withdrawal | Engineering |
| Breach Register | Record all breaches | Per incident; annually reviewed | DPO + Security |
| Cookie Audit | Cookie inventory & compliance | Quarterly | Engineering + Legal |
| Training Records | Staff compliance training | Per training cycle; annually | HR + DPO |
| Vendor Due Diligence | Sub-processor assessments | Per vendor; annually | Procurement + Legal |
| Impact Assessment Reviews | Review previous DPIAs | Annually | DPO |

### 9.3 Documentation Retention Periods

| Document Type | Retention Period | Legal Basis |
|---------------|-----------------|-------------|
| Consent records | 3 years after withdrawal | Evidence of compliance (statute of limitations) |
| Legitimate Interest Assessments | 3 years after processing ends | Accountability (Article 5(2)) |
| DPIAs | 3 years after processing ends | Accountability; supervisory authority request |
| Data Processing Agreements | Duration + 3 years | Contract law; accountability |
| Breach records | 5 years | Supervisory authority may investigate retrospectively |
| Privacy Policy versions | Indefinite (archive all versions) | Accountability; demonstrate what was in effect at any time |
| DSAR log | 3 years after response | Evidence of compliance |
| Training records | Duration of employment + 2 years | Employment law; accountability |

## 10. Penalties and Enforcement Trends

### 10.1 GDPR Penalty Structure

| Tier | Maximum Fine | Applicable Violations |
|------|-------------|----------------------|
| Lower tier | €10 million OR 2% of global annual turnover (whichever is higher) | Obligations of controller/processor; DPO obligations; records of processing; DPIA; prior consultation; security obligations |
| Upper tier | €20 million OR 4% of global annual turnover (whichever is higher) | Basic principles (lawfulness, purpose limitation, data minimization); data subject rights; international transfer rules; non-compliance with DPA order |

### 10.2 Notable GDPR Enforcement Actions (B2B/Marketing Context)

| Case | Year | Authority | Fine | Relevance to LeadReach |
|------|------|-----------|------|----------------------|
| Google (Android) | 2019 | CNIL (France) | €50M | Lack of valid consent for ad personalization; insufficient transparency |
| WhatsApp | 2021 | Irish DPC | €225M | Lack of transparency about data sharing with Facebook; insufficient legal basis |
| Criteo | 2022 | CNIL (France) | €40M | Lack of consent for tracking cookies; insufficient legal basis for profiling |
| Meta (Behavioral ads) | 2023 | Irish DPC | €1.2B | Invalid legal basis for behavioral advertising; inadequate transfer safeguards |
| Telesign | 2024 | Belgian DPA | €3.1M | Data broker processing without adequate legal basis; insufficient DPIA |
| Clearview AI | 2024 | Italian Garante | €20M | Unlawful web scraping; no legal basis; no DPIA; data subject rights violations |

### 10.3 Enforcement Trends (2024-2026)

1. **AI and automated decision-making** — DPAs are increasingly scrutinizing AI-driven profiling and scoring. Article 22 (automated decision-making) is being enforced more vigorously.

2. **Cookie enforcement** — CNIL and other DPAs continue to fine for non-compliant cookie banners. "Accept all" must be as prominent as "reject all."

3. **Data broker regulation** — The EU Data Act and proposed Data Regulation target data brokers specifically. B2B data providers face increased scrutiny.

4. **Legitimate interest narrowing** — Some DPAs (particularly Germany) are narrowing the scope of legitimate interest for marketing, requiring more stringent balancing tests.

5. **DPO independence** — DPAs are investigating whether DPOs have genuine independence and adequate resources.

6. **Cross-border enforcement cooperation** — DPAs are cooperating more effectively, meaning a violation in one member state can trigger action across the EU.

7. **Enforcement against AI training on personal data** — Scraping personal data for AI model training without a lawful basis is a growing enforcement priority.

### 10.4 LeadReach Risk Assessment

| Risk Area | Likelihood | Impact | Mitigation Priority |
|-----------|-----------|--------|-------------------|
| Lawful basis for processing | Medium | High | Critical — Ensure LIAs documented for every campaign |
| Cookie/tracking non-compliance | Medium | Medium | High — Regular cookie audits; compliant banner |
| Data subject rights delays | Medium | Medium | High — Automated DSAR handling; SLA monitoring |
| International transfer violations | Low | High | High — DPF + SCCs; TIA documented |
| AI scoring bias (Article 22) | Medium | High | Critical — DPIAs; bias testing; human review |
| Breach notification failure | Low | High | Critical — 72-hour playbook tested quarterly |
| Inadequate documentation | Medium | Medium | Medium — Quarterly documentation audits |

## 11. Agent-Specific Compliance Guidance

### 11.1 Atlas (Intent Classification)

- Classify intents considering data minimization — do not extract more personal data than the intent requires
- Flag any intent that would require special category data as **non-compliant**
- Log the lawful basis relied upon for each classification that involves personal data

### 11.2 Scout (Research)

- Only search public and professional sources — never scrape personal social media accounts
- Record the source URL for every data point collected
- Do not collect data from sources that explicitly prohibit scraping (check robots.txt and ToS)
- Flag any data point that appears to be special category data for immediate exclusion

### 11.3 Forge (Enrichment)

- Enrich only with business/professional data — never add home addresses, personal phone numbers, or personal email addresses
- Verify that enrichment data providers have compliant lawful bases
- Mark unverified fields as "unverified" — never fabricate data
- Conduct accuracy reviews quarterly; correct or delete inaccurate data

### 11.4 Judge (Scoring)

- Do not use protected characteristics (even as proxy variables) in scoring models
- Conduct bias audits on scoring models before deployment and quarterly thereafter
- Provide explainability — any prospect can understand why they received a particular score
- Article 22 compliance: If scoring produces "legal or similarly significant effects," provide human review option
- Document scoring logic and feature weights in the DPIA

### 11.5 Bard (Content Generation)

- Never reference personal data (family, health, religion, political views) in outreach content
- Do not infer or use protected characteristics for personalization
- Include all required compliance elements in every email:
  - Physical postal address
  - Working unsubscribe link
  - Non-deceptive subject line
  - Accurate sender identification
- Use professional tone — no harassment, intimidation, or undue pressure

### 11.6 Flow (Campaign Orchestration)

- Honor opt-outs **instantly** — check suppression list before every send
- Implement frequency caps to prevent excessive contact (max 3 emails per prospect per 30 days)
- Respect calling hours (8am-9pm prospect local time) for phone outreach
- Do not auto-dial mobile numbers without prior express written consent
- Check DNC registry before calls to US numbers
- Maintain audit trail for every campaign action

### 11.7 Echo (Analytics and Reporting)

- Aggregate data in reports — do not expose individual prospect data
- Anonymize or pseudonymize where possible
- Do not report on or analyze protected characteristics
- Support DSAR fulfillment by providing data export in machine-readable format
- Comply with data retention policies — delete individual-level data past retention period

## 12. Compliance Checklist: Before Every Campaign

### Pre-Launch Verification

- [ ] Lawful basis identified and documented for each data category
- [ ] LIA completed (if using legitimate interest) or consent records verified
- [ ] DPIA completed (if AI scoring, profiling, or new processing activity)
- [ ] Suppression list current and integrated into campaign platform
- [ ] All email templates include: physical address, unsubscribe link, accurate sender info
- [ ] Subject lines reviewed for accuracy (not deceptive or misleading)
- [ ] Tracking pixels reviewed — disabled for EU recipients unless consent obtained
- [ ] International transfers compliant (DPF + SCCs in place for EU→US)
- [ ] Data sources verified — no special category data, only business/professional data
- [ ] Data accuracy verified — outdated or incorrect data corrected or removed
- [ ] Frequency caps configured
- [ ] DNC registry checked (for phone campaigns)
- [ ] Calling hours configured for prospect local time zones
- [ ] DSAR response process tested and ready
- [ ] Breach notification playbook reviewed and current

### Post-Campaign Review

- [ ] Opt-out rate reviewed for anomalies (extremely high rate may indicate compliance issue)
- [ ] DSARs received during campaign processed within SLA
- [ ] Data accuracy complaints addressed
- [ ] Campaign documentation archived with lawful basis records
- [ ] Any new data categories flagged for DPIA review

## 13. Quick Reference: GDPR by Processing Activity

| Activity | Lawful Basis | Key Obligations | Risk Level |
|----------|-------------|-----------------|-----------|
| Collecting work email from LinkedIn | Legitimate Interest | LIA; source logged; opt-out mechanism | Medium |
| Enriching with company technographic data | Legitimate Interest | Data provider DPA; accuracy check | Low |
| AI lead scoring | Legitimate Interest + DPIA | Bias audit; explainability; human review option | High |
| Cold email to EU prospect | Legitimate Interest | LIA; opt-out; unsubscribe; physical address | Medium |
| Email tracking (opens/clicks) | Consent (or legitimate interest with clear disclosure) | Prior consent for EU; disclosure in privacy policy | High |
| Storing prospect data | Legitimate Interest | Encryption; access controls; 24-month retention | Medium |
| Sharing data with customer | Contractual necessity (with customer) | DPA in place; customer is controller; LeadReach is processor | Medium |
| Transfer to US sub-processor | Legitimate Interest + DPF/SCC | TIA; supplementary measures; DPA | Medium-High |

---

*This document is a living reference. Last reviewed: 2026-07-08. Next review: 2026-10-08. All LeadReach agents must follow these guidelines. When in doubt, escalate to the DPO.*
