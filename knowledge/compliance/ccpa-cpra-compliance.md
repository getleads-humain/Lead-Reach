---
title: "CCPA/CPRA Compliance for B2B Lead Generation"
category: compliance
grade: A
last_reviewed: 2026-07-08
tags: [ccpa, cpra, california-privacy, consumer-rights, opt-out, data-broker, service-provider, b2b-data, enforcement, state-privacy-laws]
---

# CCPA/CPRA Compliance for B2B Lead Generation

## 1. Overview and Scope

The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), is the most comprehensive US state privacy law. Originally enacted in 2018 and significantly expanded by CPRA (effective January 1, 2023, with enforcement from July 1, 2023), it grants California residents extensive rights over their personal information and imposes substantial obligations on businesses that process it.

### Critical B2B Distinction

**Prior to January 1, 2023**, CCPA provided a limited exemption for B2B data and employee data. **This exemption has expired.** All personal information of California residents — including B2B contacts and employees — is now fully covered by CCPA/CPRA. LeadReach must treat a California-based prospect's work email with the same compliance rigor as a consumer's personal email.

### Applicability Thresholds

CCPA/CPRA applies to any for-profit business that:

| Threshold | Requirement |
|-----------|------------|
| Revenue | Gross annual revenue > $25 million (worldwide) |
| Data volume | Buys, sells, or shares personal information of ≥ 100,000 consumers/households per year |
| Data revenue | Derives 50% or more of annual revenue from selling or sharing consumers' personal information |

**Note:** Meeting **any one** of these thresholds triggers full CCPA/CPRA obligations.

### LeadReach Applicability Assessment

| Threshold | LeadReach Status | Applies? |
|-----------|-----------------|----------|
| Revenue > $25M | Yes (SaaS platform) | ✅ |
| Data volume > 100K | Yes (processes millions of prospect records) | ✅ |
| 50%+ revenue from selling data | No (SaaS subscription model, not data brokering) | ❌ |
| **Overall** | **Subject to CCPA/CPRA** | **Yes** |

## 2. Key Definitions Under CCPA/CPRA

### 2.1 Personal Information

CCPA defines "personal information" extremely broadly — **any information that identifies, relates to, describes, or can be linked to a particular consumer or household**:

| Category | Examples | LeadReach Relevance |
|----------|----------|-------------------|
| Identifiers | Name, email address, IP address, account name | Prospect name, work email, IP from website visits |
| Customer records | Address, phone, SSN, passport number | Work phone, work address |
| Protected classifications | Age, gender, race, disability, veteran status | **Must not collect or use for scoring** |
| Commercial information | Purchase history, products considered | Engagement data, content downloads |
| Biometric information | Fingerprints, voiceprints, facial geometry | **Not collected** |
| Internet activity | Browsing history, search history, interactions | Website visits, email opens, link clicks |
| Geolocation data | Physical location | IP-based geolocation for compliance |
| Professional information | Employment, job title, work history | Job title, company, seniority |
| Education information | Student records | **Not collected (see FERPA)** |
| Inferences | Profiles, preferences, characteristics | AI scoring, ICP classification, engagement predictions |

### 2.2 Sensitive Personal Information (CPRA Addition)

CPRA introduced a new category with heightened protections:

- Precise geolocation (within 1,850 feet)
- Racial or ethnic origin, religious or philosophical beliefs
- Union membership
- Contents of mail/email/communications
- Genetic data, biometric data
- Health information
- Sex life or sexual orientation
- SSN, driver's license, passport number
- Financial account credentials

**LeadReach must not collect, use, or derive any sensitive personal information.**

### 2.3 "Sale" and "Sharing" of Personal Information

CCPA/CPRA defines these terms broadly:

| Term | Definition | LeadReach Relevance |
|------|-----------|-------------------|
| **Sale** | Making available personal information for monetary or other valuable consideration to a third party | Selling prospect lists to customers may qualify as "sale" |
| **Sharing** | Making available personal information for cross-context behavioral advertising | Sharing data with ad platforms for targeting |
| **Neither sale nor sharing** | Providing data to a service provider under a valid contract | CRM integrations, email delivery, analytics — covered by service provider agreements |

### 2.4 Service Provider vs. Third Party

| Role | Definition | Obligations | LeadReach Role |
|------|-----------|------------|----------------|
| **Business** | Entity that determines purposes and means of processing | All CCPA/CPRA obligations | When running own campaigns |
| **Service Provider** | Processes PI on behalf of business, for specified business purposes | Contractual restrictions; no secondary use; no selling; same compliance level | When processing data for customers |
| **Third Party** | Entity not affiliated with business, not a service provider | Must honor opt-out signals; subject to liability for misuse | Data enrichment providers (if not under service provider contract) |
| **Contractor** (CPRA) | Similar to service provider but with additional requirements | Must assist business with compliance; certify compliance annually | Same as service provider for CPRA purposes |

## 3. Consumer Rights in the Sales Context

### 3.1 Rights Overview

| Right | CCPA/CPRA Section | Response Deadline | LeadReach Implementation |
|-------|-------------------|-------------------|--------------------------|
| Right to know | §1798.100 | 45 days (extendable by 45 days with notice) | Privacy policy + on-demand data export |
| Right to delete | §1798.105 | 45 days (extendable by 45 days) | Cascading delete across all systems |
| Right to correct | §1798.106 | 45 days (extendable by 45 days) | CRM update + propagation |
| Right to opt out of sale/sharing | §1798.120 | 15 business days (for GPC signals) | "Do Not Sell or Share" link + GPC signal honor |
| Right to limit sensitive PI use | §1798.121 | 45 days | Not applicable (LeadReach doesn't collect sensitive PI) |
| Right to non-discrimination | §1798.125 | N/A (ongoing obligation) | Same service/price regardless of rights exercised |
| Right to appeal | §1798.105(d) (CPRA) | 45 days to acknowledge; 60 days to respond | Internal review process |

### 3.2 Right to Know — What Must Be Disclosed

LeadReach must disclose, upon verified request:

1. **Categories of personal information collected** (by the 10 CCPA categories)
2. **Specific pieces of personal information** collected about the consumer
3. **Categories of sources** from which PI was collected
4. **Business or commercial purposes** for collecting/selling/sharing
5. **Categories of third parties** with whom PI is shared
6. **Categories of PI sold** (if any)
7. **Categories of PI disclosed** for business purposes
8. **Whether PI is sold or shared** and to whom

#### Disclosure Response Format

```json
{
  "request_id": "CCPA-KNOW-2026-00142",
  "consumer_verified": true,
  "response_date": "2026-07-20",
  "categories_of_pi_collected": [
    "Identifiers: Name, work email address, work phone number",
    "Internet activity: Website browsing on leadreach.io, email open/click data",
    "Professional information: Job title, company name, industry, seniority level",
    "Commercial information: Content downloaded, webinars attended, demo requests",
    "Inferences: Lead score, ICP classification, engagement propensity"
  ],
  "specific_pieces_of_pi": {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "phone": "+1-555-0123",
    "job_title": "VP of Sales",
    "company": "Acme Corp",
    "lead_score": 87,
    "icp_fit": "Tier 1"
  },
  "sources": [
    "Public professional directories (LinkedIn, ZoomInfo)",
    "LeadReach website (form submissions, browsing activity)",
    "Customer-provided data (CRM import)",
    "Inferred from engagement patterns (lead scoring)"
  ],
  "business_purposes": [
    "B2B lead generation and prospecting",
    "Sales outreach personalization",
    "Lead scoring and prioritization",
    "Campaign analytics and reporting"
  ],
  "third_party_categories": [
    "Cloud infrastructure providers (AWS)",
    "Email delivery services (SendGrid)",
    "CRM platforms (Salesforce, HubSpot)",
    "Data enrichment providers (ZoomInfo, Clearbit)"
  ],
  "pi_sold": "None",
  "pi_shared_for_advertising": "None"
}
```

### 3.3 Right to Delete — Scope and Exceptions

When a consumer requests deletion, LeadReach must delete from **all systems**:

| System | Deletion Action | Timeline |
|--------|----------------|----------|
| CRM | Full record deletion | Within 45 days |
| Email platform | Remove from all lists + suppress | Within 45 days |
| Scoring engine | Delete scoring record | Within 45 days |
| Analytics | Anonymize or aggregate individual data | Within 45 days |
| Backup systems | Flag for deletion on next rotation | Documented process |
| Service providers | Notify all service providers of deletion request | Within 45 days |
| Third parties | Notify all third parties who received the data (in past 12 months) | Within 45 days |
| Consent/preference records | Retain minimum data for deletion compliance proof | Retained under exception |

**Exceptions allowing retention:**

| Exception | CCPA Section | LeadReach Application |
|-----------|-------------|----------------------|
| Legal compliance | §1798.105(e)(1) | Tax records, contract evidence |
| Audit/Security | §1798.105(e)(3) | Security logs (anonymized) |
| Bug/Repair | §1798.105(e)(4) | System integrity (minimal) |
| Employment-related | §1798.105(e)(5) | Not applicable to prospect data |
| Internal use aligned with expectations | §1798.105(e)(6) | Minimal — suppression list entry only |
| Research | §1798.105(e)(7) | Anonymized research data |
| Solely non-personal data | §1798.105(e)(8) | Aggregate/anonymized data |

## 4. Opt-Out Mechanisms

### 4.1 "Do Not Sell or Share My Personal Information" Link

Required on LeadReach's homepage and all data collection pages:

- Must be a **clear and conspicuous** link titled "Do Not Sell or Share My Personal Information"
- Cannot require the consumer to create an account to exercise the right
- Must be accessible without login or registration
- Must process opt-out within 15 business days

### 4.2 Global Privacy Control (GPC) Signal

CPRA and CCPA regulations require businesses to honor **Global Privacy Control (GPC)** browser signals:

| GPC Signal | Interpretation | Required Action |
|------------|---------------|-----------------|
| GPC present = opt out of sale | Consumer is exercising right to opt out of sale | Stop selling their PI immediately |
| GPC present = opt out of sharing | Consumer is exercising right to opt out of sharing | Stop sharing for cross-context behavioral advertising |
| GPC present = limit sensitive PI | Consumer is exercising right to limit sensitive PI use | Limit use of sensitive PI (if any collected) |

**Implementation:**

```javascript
// LeadReach GPC Signal Handler
function checkGlobalPrivacyControl() {
  // Check for Global Privacy Control signal
  const gpcSignal = navigator.globalPrivacyControl;

  if (gpcSignal === true) {
    // Consumer has enabled GPC — treat as opt-out of sale and sharing
    console.log('GPC signal detected: honoring opt-out of sale/sharing');

    // 1. Record the opt-out with timestamp
    recordOptOut({
      source: 'gpc_signal',
      opt_out_type: ['sale', 'sharing'],
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent
    });

    // 2. Disable all advertising/tracking cookies
    disableMarketingCookies();

    // 3. Disable data sharing with advertising partners
    stopDataSharing();

    // 4. Set internal flag for this user
    setUserFlag('gpc_opt_out', true);

    // 5. Log for audit trail
    auditLog('gpc_opt_out_honored', {
      timestamp: new Date().toISOString(),
      signal: gpcSignal
    });
  }
}

// Check on page load
window.addEventListener('DOMContentLoaded', checkGlobalPrivacyControl);
```

### 4.3 Authorized Agent Opt-Out

Consumers may designate an **authorized agent** to exercise rights on their behalf. LeadReach must:

1. Accept opt-out requests from authorized agents
2. Verify the agent's authorization (signed permission or power of attorney)
3. Verify the consumer's identity (if not already known)
4. Process the request within the same timeline as a direct consumer request
5. Not require the consumer to create an account for the agent to act

### 4.4 Opt-Out vs. Do Not Contact

| Mechanism | Scope | Effect on LeadReach |
|-----------|-------|-------------------|
| CCPA opt-out of sale/sharing | Stops sale/sharing of PI | Stop sharing data with third parties for consideration |
| CAN-SPAM unsubscribe | Stops email marketing | Remove from email campaigns |
| TCPA DNC | Stops telemarketing | Do not call |
| Internal suppression list | Stops all outreach | Do not contact via any channel |
| GDPR right to object | Stops processing for marketing | Stop all marketing processing for EU prospects |

**Best practice:** LeadReach treats any opt-out (CCPA, CAN-SPAM, or otherwise) as a global suppression across all outreach channels, exceeding minimum legal requirements.

## 5. Data Broker Registration

### 5.1 Is LeadReach a Data Broker?

California defines a "data broker" as a business that **knowingly collects and sells to third parties the personal information of a consumer with whom the business does not have a direct relationship**.

| Data Broker Criterion | LeadReach Analysis |
|----------------------|-------------------|
| Knowingly collects consumer PI | Yes — collects prospect data from various sources |
| Sells to third parties | Complex — LeadReach provides prospect data to customers as part of SaaS service; whether this constitutes "sale" depends on the relationship structure |
| No direct relationship with consumer | Yes — LeadReach's prospects have no direct relationship with LeadReach (they are prospects of LeadReach's customers) |
| **Conclusion** | **LeadReach may qualify as a data broker** and should register proactively |

### 5.2 Data Broker Registration Requirements

If LeadReach qualifies as a data broker, it must:

1. **Register annually** with the California Attorney General
2. **Pay registration fee** (varies by revenue tier)
3. **Disclose**: categories of PI collected, categories of PI sold, categories of third-party purchasers, consumer opt-out mechanisms
4. **Maintain registration** — update within 30 days of any material change
5. **Display registration** — link to AG's data broker registry on website

### 5.3 Delete Act (2023-2024)

California's Delete Act (AB 2789, effective January 1, 2024, with full implementation by 2026) imposes additional obligations on data brokers:

- Data brokers must implement a **one-click deletion mechanism** accessible through the AG's registry
- Consumers can request deletion from **all registered data brokers** through a single request
- Data brokers must delete all consumer PI upon verified request (with limited exceptions)
- Annual audits required for data brokers with annual revenue > $10 million

**LeadReach must:**
- Assess whether the Delete Act applies
- If applicable, implement the one-click deletion mechanism
- Participate in the AG's centralized deletion system
- Conduct annual compliance audits

## 6. Employee Data Considerations

### 6.1 CPRA Removed the B2B and Employee Exemption

Prior to CPRA, CCPA had temporary exemptions for:
- Employee data (collected in employment context)
- B2B data (collected in business-to-business context)

**Both exemptions expired January 1, 2023.** This means:

- Employee personal information is fully covered by CCPA/CPRA
- B2B contact data is fully covered — a prospect's work email is "personal information"
- All consumer rights apply to employees and B2B contacts

### 6.2 LeadReach Employee Data

| Data Category | Covered by CCPA/CPRA | Handling |
|---------------|---------------------|----------|
| Employee names, emails | Yes | Employment records exception for HR processing |
| Employee performance data | Yes | Employment context; internal use only |
| Employee monitoring data | Yes | **Heightened sensitivity** — disclose in privacy policy |
| Job applicant data | Yes | Retain only as needed; delete upon request (with exceptions) |
| Contractor data | Yes | Same obligations as employee data |

### 6.3 Prospecting Your Own Prospects' Employees

When LeadReach prospects target employees of California-based companies:
- The prospect's employees have CCPA/CPRA rights even though they are "B2B contacts"
- Their work email is "personal information" under CCPA
- They can request to know, delete, correct, and opt out
- LeadReach must have a process to handle rights requests from **any** California resident, including prospects' employees whose data may appear in enrichment

## 7. Service Provider Obligations

### 7.1 When LeadReach Is a Service Provider

When LeadReach processes personal information on behalf of a customer (e.g., running lead gen campaigns using the customer's prospect data), LeadReach is a **service provider** (or **contractor** under CPRA).

### 7.2 Service Provider Contract Requirements

Every service provider agreement must include:

| Required Clause | Description | LeadReach Implementation |
|----------------|-------------|------------------------|
| Purpose limitation | Service provider processes PI only for the disclosed business purposes | Contract specifies: lead generation, enrichment, scoring, outreach |
| No selling | Service provider shall not sell PI | Contractual prohibition |
| No retaining beyond relationship | Service provider shall not retain PI beyond the business relationship | Deletion upon contract termination |
| No use for unrelated purposes | Service provider shall not use PI for purposes unrelated to the business purposes | Audit controls to verify |
| Compliance certification | Service provider certifies it understands and will comply with obligations | Annual certification process |
| Same protection level | Service provider provides same level of privacy protection as business | SOC 2 Type II + ISO 27001 |
| Notification of inability | Service provider must notify business if it can no longer meet obligations | 30-day notification clause |
| Subcontractor restrictions | Service provider must ensure subcontractors meet same requirements | Sub-processor DPA; notification of changes |
| Audit rights | Business may audit service provider's compliance | Annual audit right; SOC 2 report sharing |
| Deletion upon termination | Service provider must delete all PI upon contract termination (with exceptions) | Certified deletion within 90 days |

### 7.3 Service Provider Contract Template

```
DATA PROCESSING ADDENDUM — CCPA/CPRA SERVICE PROVIDER TERMS
============================================================

1. ROLE DESIGNATION
   LeadReach acts as a Service Provider/Contractor under CCPA/CPRA
   with respect to Customer Personal Information.

2. PERMITTED BUSINESS PURPOSES
   LeadReach may process Customer PI solely for the following
   business purposes:
   (a) B2B lead generation and prospect identification
   (b) Data enrichment of Customer's existing prospect records
   (c) Lead scoring and prioritization
   (d) Email outreach campaign execution
   (e) Campaign analytics and reporting

3. PROHIBITED USES
   LeadReach shall NOT:
   (a) Sell Customer PI
   (b) Share Customer PI for cross-context behavioral advertising
   (c) Use Customer PI for LeadReach's own marketing purposes
   (d) Retain Customer PI beyond the business relationship
   (e) Combine Customer PI with data from other sources except
       as necessary to perform the business purposes

4. COMPLIANCE OBLIGATIONS
   LeadReach certifies that it:
   (a) Understands its obligations under CCPA/CPRA
   (b) Will comply with all applicable provisions
   (c) Will notify Customer within 30 days if it can no
       longer meet its obligations
   (d) Will provide same level of privacy protection as
       required of Customer
   (e) Will not retain, use, or disclose Customer PI for
       any commercial purpose other than the business purposes
   (f) Will not retain, use, or disclose Customer PI outside
       of the direct business relationship

5. DELETION UPON TERMINATION
   Upon termination of the agreement, LeadReach shall delete
   all Customer PI within 90 days, and certify deletion upon
   Customer's request.

6. AUDIT RIGHTS
   Customer may audit LeadReach's compliance no more than once
   per year upon 30 days' written notice. LeadReach shall
   provide its most recent SOC 2 Type II report as an
   alternative to on-site audit.

7. SUB-PROCESSORS
   LeadReach maintains a list of sub-processors at
   [URL]. Customer will be notified of changes with
   30 days' advance notice and may object.
```

### 7.4 When LeadReach Is a Business (Controller)

When LeadReach processes prospect data for its own marketing purposes:
- LeadReach is the **Business** (equivalent of GDPR "controller")
- Must comply with all CCPA/CPRA obligations directly
- Must provide privacy policy, rights response mechanisms, opt-out link
- Must maintain records of processing activities

## 8. Enforcement and Penalties

### 8.1 Penalty Structure

| Violation Type | Penalty per Violation | Additional Consequences |
|---------------|----------------------|----------------------|
| Intentional violation | Up to $7,500 | AG enforcement action |
| Unintentional violation | Up to $2,500 | AG enforcement action |
| Private right of action (data breach only) | $100-$750 per consumer per incident | Class action lawsuits |
| Failure to cure (30-day cure period) | N/A (AG provides 30-day cure for some violations) | Must cure within 30 days or face enforcement |

### 8.2 CPRA Enforcement Changes

CPRA made several enforcement changes:

1. **California Privacy Protection Agency (CPPA)** — New dedicated enforcement agency (in addition to AG)
2. **Updated cure period** — CPRA eliminated the mandatory 30-day cure period for some violations (the CPPA can decide whether to offer a cure period)
3. **Enhanced audit authority** — CPPA can conduct audits without a specific complaint
4. **Rulemaking authority** — CPPA has authority to issue regulations (not just the AG)

### 8.3 Notable CCPA Enforcement Actions

| Case | Year | Entity | Fine/Outcome | Relevance to LeadReach |
|------|------|--------|-------------|----------------------|
| Sephora / cosmetics | 2022 | Sephora | $1.2M settlement | Failed to honor GPC signals; sold consumer data without opt-out; no "Do Not Sell" link |
| Houzz | 2022 | Houzz | $175K | Sold consumer data without disclosing; no opt-out mechanism |
| Flo Health | 2023 | Flo Health | $600K+ (FTC + states) | Shared health data with ad platforms despite privacy promises |
| Meta (Facebook) | 2023 | Meta | $1.2B (EU, not CCPA but relevant) | Cross-border data transfers without adequate safeguards |
| CPPA enforcement actions | 2024-2025 | Various | Increasing | CPPA ramping up enforcement; focus on data brokers and AI |

### 8.4 Data Breach Private Right of Action

CCPA provides a **limited private right of action** for data breaches:

- Applies only when PI is subject to **unauthorized access and exfiltration, theft, or disclosure**
- Business must have **failed to implement and maintain reasonable security procedures**
- Consumer can recover **$100-$750 per consumer per incident** or actual damages (whichever is greater)
- Class actions are permitted
- 30-day cure period before filing lawsuit (must notify business of specific violations)

**Reasonable security measures LeadReach must maintain:**

| Security Measure | Implementation |
|-----------------|----------------|
| Encryption at rest | AES-256 for all stored PI |
| Encryption in transit | TLS 1.3 for all data transfers |
| Access controls | Role-based access control (RBAC) |
| Vulnerability scanning | Quarterly automated scans |
| Penetration testing | Annual third-party pen test |
| Incident response plan | Documented and tested quarterly |
| Security training | Annual training for all employees |
| MFA | Required for all system access |

## 9. Interaction with Other State Privacy Laws

### 9.1 State Privacy Law Landscape (2026)

As of 2026, approximately 19 US states have enacted comprehensive privacy laws. Key ones affecting LeadReach:

| State | Law | Effective Date | Key Differences from CCPA/CPRA |
|-------|-----|---------------|-------------------------------|
| California | CCPA/CPRA | 2020/2023 | Most comprehensive; private right of action for breaches; GPC required; data broker registration |
| Virginia | VCDPA | Jan 1, 2023 | No private right of action; AG enforcement only; narrower "sale" definition; 25,000 consumer threshold |
| Colorado | CPA | Jul 1, 2023 | Must honor universal opt-out mechanisms; stronger purpose limitation; AG enforcement |
| Connecticut | CTDPA | Jul 1, 2023 | Similar to VCDPA; 16+ age protection provisions; AG enforcement |
| Utah | UCPA | Dec 31, 2023 | Less stringent; no right to delete; no sensitive PI category; AG enforcement |
| Texas | TDPSA | Jul 4, 2024 | Broad applicability; AG enforcement; 30-day cure period; data broker registration |
| Oregon | OCPA | Jul 1, 2024 | Similar to CPA; stronger opt-out mechanism requirements |
| Montana | MCDPA | Jan 1, 2025 | Similar to VCDPA; lower consumer threshold |
| Florida | FDPA | Jul 1, 2024 | Narrower applicability; AG enforcement |
| New Jersey | NJPL | Jan 15, 2025 | Similar to VCDPA; data controller/processor model |
| Maryland | MCDPA | Oct 1, 2025 | Strong data minimization; algorithmic auditing requirements |
| Minnesota | MCFPA | Jul 1, 2025 | Similar to VCDPA; consumer protection focus |
| New Hampshire | NHPA | Jan 1, 2025 | Similar to VCDPA; AG enforcement |
| Nebraska | NDCPA | Jan 1, 2025 | Similar to VCDPA; AG enforcement |
| Iowa | ICDPA | Jan 1, 2025 | Less stringent; no private right of action |
| Tennessee | TIPA | Jul 1, 2025 | Similar to VCDPA with some Utah-like exceptions |
| Indiana | IDPA | Jan 1, 2026 | Similar to VCDPA; AG enforcement |
| Georgia | GCDPA | Pending | Under consideration |
| Pennsylvania | Pending | Pending | Under consideration |

### 9.2 Compliance Strategy: Default to Strictest

LeadReach's compliance strategy is to **default to the strictest requirements** across all applicable state laws. This means:

| Obligation | Strictest Law | LeadReach Default |
|-----------|--------------|-------------------|
| Right to delete | CCPA/CPRA | ✅ Implemented |
| Right to correct | CCPA/CPRA | ✅ Implemented |
| Right to opt out of sale/sharing | CCPA/CPRA | ✅ Implemented |
| Honor universal opt-out signals | Colorado CPA | ✅ Honor GPC + other universal signals |
| Data minimization | CCPA/CPRA + Maryland | ✅ Collect only what's necessary |
| Purpose limitation | All state laws | ✅ Process only for disclosed purposes |
| Sensitive PI protections | CCPA/CPRA | ✅ Do not collect sensitive PI |
| Data broker registration | CCPA/CPRA + Texas | ✅ Register in CA and any other required states |
| Algorithmic auditing | Maryland | ✅ Annual bias audit for scoring models |
| Service provider agreements | All state laws | ✅ DPA with all customers and vendors |

### 9.3 Universal Opt-Out Mechanism Recognition

Multiple states require businesses to honor **universal opt-out mechanisms** (UOOMs). Currently recognized mechanisms include:

| Mechanism | Status | States Requiring Recognition |
|-----------|--------|------------------------------|
| Global Privacy Control (GPC) | Active | California, Colorado, Connecticut |
| Opt-out browser signals | Active | Colorado, Connecticut, others |
| DoubleVerify DPF | Under evaluation | TBD |
| NAIC Opt-Out Model | Under development | TBD |

**LeadReach must:** Detect and honor GPC signals and any other UOOMs required by applicable state laws. Implement detection on website load and email link tracking pages.

## 10. Privacy Policy Requirements

### 10.1 Required Disclosures

CCPA/CPRA requires the privacy policy to include:

1. **Categories of personal information collected** (in the last 12 months)
2. **Categories of personal information sold or shared** (in the last 12 months)
3. **Categories of personal information disclosed for business purposes**
4. **Business or commercial purposes** for collecting, selling, or sharing
5. **Categories of third parties** with whom PI is shared
6. **Whether the business sells or shares PI** of consumers under 16
7. **Financial incentive** details (if any)
8. **Right to limit** use and disclosure of sensitive PI
9. **Right to correct** inaccurate PI
10. **How to exercise rights** (including authorized agent instructions)
11. **Verification process** for rights requests
12. **GPC signal handling** policy
13. **Retention periods** for each category of PI
14. **Information about automated decision-making** (if applicable)
15. **Link to data broker registry** (if registered)
16. **Date of last policy update**

### 10.2 Privacy Policy Update Requirements

- Update at least once every **12 months**
- Update within a reasonable time after any material change to data practices
- Notify consumers of material changes (prominent notice on website)
- Archive all previous versions for regulatory reference

## 11. LeadReach Implementation Checklist

### Technical Implementation

- [ ] "Do Not Sell or Share My Personal Information" link on homepage
- [ ] GPC signal detection and honor implementation
- [ ] Consumer rights request portal (know, delete, correct, opt-out)
- [ ] Automated rights response workflow (45-day SLA)
- [ ] Data inventory across all systems (for rights response)
- [ ] Cascading delete implementation (all systems)
- [ ] Service provider agreements with all vendors
- [ ] Data broker registration with CA AG (if applicable)
- [ ] Privacy policy updated with all required disclosures
- [ ] GPC and universal opt-out signal handling tested
- [ ] Consumer identity verification process for rights requests
- [ ] Sub-processor list maintained and published
- [ ] Audit logging for all rights requests and responses
- [ ] Annual compliance audit scheduled

### Operational Implementation

- [ ] Staff trained on CCPA/CPRA obligations
- [ ] DPO/privacy team designated
- [ ] Rights request intake process documented
- [ ] Verification procedures for consumer identity
- [ ] Exception documentation for deletion requests
- [ ] Service provider oversight program
- [ ] Data broker registration renewal process
- [ ] Annual privacy policy review
- [ ] Incident response plan updated for CCPA breach requirements
- [ ] CPPA regulatory monitoring

### Per-Campaign Checklist

- [ ] All prospect data categorized per CCPA categories
- [ ] No sensitive PI collected or used
- [ ] Opt-out mechanisms active for campaign
- [ ] Data sources documented (for "right to know" responses)
- [ ] Service provider agreements cover all campaign vendors
- [ ] Third-party recipients documented
- [ ] Retention periods configured for campaign data
- [ ] Campaign disclosed in privacy policy (if new data practices)

## 12. Agent-Specific Compliance Guidance

### Atlas (Intent Classification)
- Classify intents with awareness that B2B contact data is "personal information" under CCPA/CPRA
- Flag any intent that would involve collecting sensitive PI as non-compliant
- Log the business purpose for each data processing classification

### Scout (Research)
- Source every data point collected — CCPA requires disclosure of data sources
- Do not collect precise geolocation, health, financial, or other sensitive PI
- Check if data subject has opted out (GPC or "Do Not Sell") before scraping

### Forge (Enrichment)
- Enrich only with non-sensitive business data
- Ensure enrichment providers are under service provider agreements
- Do not combine data in ways that create sensitive PI (e.g., inferring health status)
- Document data provenance for each enrichment field

### Judge (Scoring)
- Do not use protected classification data (race, gender, age) as scoring features — even as proxies
- Conduct annual bias audits per Maryland and emerging state requirements
- Provide opt-out of automated decision-making where required
- Document scoring logic for "right to know" responses

### Bard (Content Generation)
- Never reference sensitive PI in outreach content
- Include "Do Not Sell" link reference where required
- Ensure all emails include CCPA-compliant unsubscribe mechanism
- Do not use inferred sensitive characteristics for personalization

### Flow (Campaign Orchestration)
- Check GPC status and "Do Not Sell" preferences before every campaign action
- Honor opt-outs across all channels within 15 business days (GPC) or 45 days (other rights)
- Maintain suppression list with granular opt-out preferences
- Implement frequency caps and respect consumer preferences

### Echo (Analytics and Reporting)
- Aggregate data in reports — do not expose individual consumer data
- Support "right to know" requests with data export capabilities
- Anonymize or delete individual data past retention period
- Do not report on or analyze protected characteristics

## 13. Key Differences: CCPA/CPRA vs. GDPR

| Aspect | CCPA/CPRA | GDPR | LeadReach Approach |
|--------|----------|------|-------------------|
| Lawful basis | Not required (opt-out model) | Required (consent or legitimate interest) | Follow GDPR for EU; CCPA for CA |
| Default processing | Permitted until opt-out | Not permitted without lawful basis | Apply stricter GDPR approach globally |
| Sensitive data | Heightened protection; right to limit | Special category; processing prohibited without explicit consent | Do not collect either type |
| Right to delete | Yes, with exceptions | Yes, with exceptions | Implement both; follow broader scope |
| Right to correct | Yes | Yes (right to rectification) | Implement once; covers both |
| Opt-out of sale | Yes | N/A (no "sale" concept) | Implement for CCPA |
| Opt-out of profiling | Limited | Yes (Article 21) | Follow GDPR for EU prospects |
| DPO requirement | No (but recommended) | Yes (in certain circumstances) | Appoint DPO |
| Breach private right of action | Yes (limited) | No (DPAs enforce) | Maintain reasonable security |
| Penalties | $2,500-$7,500 per violation | €10M-€20M or 2-4% turnover | Comply with both; CCPA penalties add up |

---

*This document is a living reference. Last reviewed: 2026-07-08. Next review: 2026-10-08. All LeadReach agents must follow these guidelines. When in doubt, escalate to the DPO or privacy team.*
