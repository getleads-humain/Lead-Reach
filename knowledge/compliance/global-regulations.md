---
title: "Compliance — GDPR, CAN-SPAM, CCPA, TCPA, and Industry-Specific Regulations"
slug: compliance-global-regulations
category: compliance
tags: [compliance, gdpr, can-spam, ccpa, tcpa, hipaa, ferpa, glba]
agents: [atlas, scout, forge, sage, judge, bard, flow, echo]
intent_types: [research_company, research_person, compose_outreach, build_sequence]
priority: 95
version: 1
updated: 2026-06-22
author: LeadReach Knowledge Engineering
summary: "The complete compliance reference for LeadReach — what data can be collected, how it can be used, and what outreach is permitted in each jurisdiction."
---

# Compliance — Global Regulations Reference

## 1. Why This Matters

LeadReach processes personal data of millions of individuals globally. Non-compliance can result in:
- **GDPR fines**: Up to €20M or 4% of global annual turnover
- **CAN-SPAM fines**: Up to $50K per violation (per email)
- **CCPA fines**: Up to $7,500 per intentional violation
- **TCPA fines**: $500-$1,500 per call/SMS
- **HIPAA fines**: Up to $1.5M per violation category per year
- **Reputational damage**: Loss of customer trust, negative press
- **Criminal liability**: In some jurisdictions for willful violations

**Every LeadReach agent MUST follow these rules.** Compliance is not optional.

## 2. GDPR (European Union)

### Scope
Applies to **any organization processing personal data of EU residents**, regardless of where the organization is based.

### Key Principles
1. **Lawfulness, fairness, transparency** — Need a lawful basis; be transparent
2. **Purpose limitation** — Use data only for stated purpose
3. **Data minimization** — Collect only what's necessary
4. **Accuracy** — Keep data accurate and up-to-date
5. **Storage limitation** — Don't keep data longer than needed
6. **Integrity and confidentiality** — Secure the data
7. **Accountability** — Be able to demonstrate compliance

### Lawful Bases for Processing
1. **Consent** — Explicit opt-in
2. **Contractual necessity** — To fulfill a contract
3. **Legal obligation** — Required by law
4. **Vital interests** — Life-threatening situation
5. **Public task** — Official authority
6. **Legitimate interest** — Business interest not overridden by individual's rights

For B2B outreach, **legitimate interest** is most common. Requirements:
- Conduct **Legitimate Interest Assessment (LIA)**
- Document the LIA
- Provide clear opt-out
- Honor opt-outs immediately
- Individual's interests cannot override yours

### Special Category Data (Article 9) — DO NOT COLLECT
- Racial or ethnic origin
- Political opinions
- Religious or philosophical beliefs
- Trade union membership
- Genetic data
- Biometric data (for identification)
- Health data
- Sex life or sexual orientation

### Data Subject Rights
- **Right to be informed**: Privacy policy
- **Right of access**: Provide all data on request (within 30 days)
- **Right to rectification**: Correct inaccurate data
- **Right to erasure** ("right to be forgotten"): Delete data on request (within 30 days)
- **Right to restrict processing**: Limit how data is used
- **Right to data portability**: Provide data in machine-readable format
- **Right to object**: Stop processing for specific purposes
- **Rights re: automated decision-making**: No decisions based solely on automation

### Cross-Border Data Transfers
Transferring EU personal data outside EU/EEA requires safeguards:
- **Standard Contractual Clauses (SCCs)** — Between EU and non-EU entities
- **Data Privacy Framework (DPF)** — US company self-certifies with US Dept of Commerce
- **Binding Corporate Rules (BCRs)** — For intra-company transfers
- **Derogations** — Specific circumstances (consent, contract performance, etc.)

Without these, transferring EU personal data to US is **illegal**.

### Breach Notification
- Notify supervisory authority within **72 hours** of becoming aware of breach
- Notify affected individuals "without undue delay" if high risk
- Document all breaches (even those not reportable)

### DPO (Data Protection Officer)
Required if:
- Processing is by a public authority
- Core activities require **large-scale, regular and systematic monitoring** of individuals
- Core activities require **large-scale processing of special category data**

### LeadReach Implementation
- **B2B outreach**: Permitted under legitimate interest with opt-out
- **Personal data collected**: Name, work email, work phone, title, company, industry, location
- **DO NOT collect**: Home address, personal phone, personal email, health, religion, politics
- **Storage**: Encrypt at rest; access logs; retention 24 months (then re-confirm consent or delete)
- **Opt-out**: Honored within 10 business days (often instantly)
- **Erasure requests**: Processed within 30 days; cascading delete across all systems
- **Cross-border**: SCCs in place for US-EU transfers; DPF certification if applicable

## 3. CAN-SPAM Act (United States)

### Scope
Applies to **commercial email** sent to US recipients.

### Key Requirements
1. **Don't use false or misleading header information** — From name and email must be accurate
2. **Don't use deceptive subject lines** — Must reflect content
3. **Identify the message as an ad** — Clear disclosure
4. **Include your physical postal address** — In every email
5. **Provide a clear unsubscribe mechanism** — Working link or reply-to
6. **Honor opt-out requests within 10 business days**
7. **Monitor what others do on your behalf** — You're responsible for vendors

### B2B vs B2C
- B2B cold email is **permitted** under CAN-SPAM (no prior consent required)
- BUT all above requirements still apply
- B2C email requires prior consent (CAN-SPAM allows transactional but not unsolicited marketing)

### LeadReach Implementation
Every cold email sent by LeadReach includes:
- ✅ Physical address in footer (LeadReach HQ address)
- ✅ Working unsubscribe link (one-click)
- ✅ Accurate From name and email
- ✅ Non-deceptive subject line
- ✅ Unsubscribe honored within 10 business days (instant via Flow agent)

## 4. CCPA / CPRA (California)

### Scope
Applies to businesses that:
- Have gross revenue >$25M/year, OR
- Annually buy, sell, or share personal info of 100K+ consumers, OR
- Derive 50%+ of revenue from selling/sharing personal info

### Consumer Rights
- **Right to know**: What data is collected, sold, shared
- **Right to delete**: Request deletion
- **Right to correct**: Inaccurate data
- **Right to opt out of sale/share**: Stop data sale/sharing
- **Right to limit use of sensitive personal info**
- **Right to non-discrimination**: Same service/price regardless of rights exercised

### "Sale" Definition (Broad)
"Sale" includes sharing data with third parties for **anything of value**, including:
- Selling data
- Sharing data with partners
- Sharing data for cross-context behavioral advertising

### LeadReach Implementation
- **Right to know**: Privacy policy discloses all data collected
- **Right to delete**: Erasure request honored within 45 days
- **Right to opt out**: "Do Not Sell My Personal Information" link on website
- **Data minimization**: Collect only what's needed for B2B prospecting
- **No sensitive data**: Don't collect health, financial account, etc.

## 5. TCPA (United States — Telephone)

### Scope
Applies to **telemarketing calls and SMS** to US phone numbers.

### Key Requirements
1. **Prior express written consent** for auto-dialed calls/SMS (including marketing)
2. **Do Not Call Registry** check required
3. **Calling time restrictions**: 8am-9pm local time
4. **Identification**: Caller must identify themselves and company
5. **Opt-out mechanism**: Must honor within 30 days

### Penalties
- $500 per violation
- $1,500 per **willful** violation
- Class action lawsuits common

### B2B Exception
- B2B calls to landlines are generally permitted (with DNC check)
- B2B calls to mobile phones via auto-dialer require prior express written consent
- Manual dialing is exempt from auto-dialer rules

### LeadReach Implementation
- **No auto-dialing mobile numbers** without prior express written consent
- **Check DNC registry** before calls (B2C)
- **Calling hours**: 8am-9pm prospect local time
- **Identification**: Caller identifies themselves and LeadReach immediately
- **Opt-out**: Internal DNC list; honored within 30 days

## 6. HIPAA (United States — Healthcare)

### Scope
Applies to **protected health information (PHI)** held by covered entities (healthcare providers, health plans, clearinghouses) and their business associates.

### What is PHI?
Any individually identifiable health information:
- Name, address, birth date, SSN
- Medical record numbers
- Health plan beneficiary numbers
- Account numbers
- Any info that could identify an individual + relates to health

### LeadReach Considerations
- LeadReach is **NOT a covered entity** (we don't provide healthcare)
- BUT if LeadReach processes data for a healthcare client, we may be a **Business Associate**
- BAA (Business Associate Agreement) required
- LeadReach must safeguard any PHI incidentally collected

### What LeadReach Does NOT Collect
- Patient names
- Diagnoses
- Treatment info
- Medical record numbers
- Insurance info
- Any health-related info about individuals

### What LeadReach DOES Collect (Healthcare B2B)
- Healthcare professional's work contact (name, title, work email, work phone)
- Hospital/clinic business info (name, address, EHR system)
- Public provider data (NPI numbers — public, not PHI)

## 7. GLBA (United States — Financial)

### Scope
Applies to **financial institutions** regarding customer financial information.

### Key Requirements
1. **Privacy notice**: Annual disclosure of data sharing practices
2. **Opt-out**: Right to opt out of sharing with non-affiliates
3. **Safeguards rule**: Administrative, technical, physical safeguards
4. **Pretexting provisions**: Prohibit obtaining customer info under false pretenses

### LeadReach Considerations
- Don't collect financial account numbers
- Don't collect credit card numbers (use Stripe/PayPal for payments)
- If servicing financial institution clients, ensure compliance with their requirements

## 8. FERPA (United States — Education)

### Scope
Protects **student education records** at schools receiving federal funding.

### LeadReach Considerations
- Don't collect student records
- B2B outreach to education professionals is permitted (their work contact info is not student record)

## 9. ePrivacy Directive (European Union — Cookies & Electronic Communications)

### Cookie Requirements
- **Prior consent** for non-essential cookies (analytics, marketing)
- Cookie banner must:
  - Be clear and specific
  - Allow granular choice (analytics vs marketing vs essential)
  - Make accepting as easy as refusing
  - No pre-ticked boxes
  - No "cookie walls" (blocking content unless accept)

### Cold Email Under ePrivacy (PECR in UK)
- B2B cold email permitted under legitimate interest
- BUT must:
  - Be relevant to the recipient's role
  - Identify the sender
  - Provide opt-out
  - Not disguise identity

## 10. State Privacy Laws (US — Beyond California)

### Virginia VCDPA
- Effective Jan 1, 2023
- Similar to CCPA but narrower scope
- Applies to businesses controlling data of 100K+ consumers

### Colorado CPA
- Effective July 1, 2023
- Similar to CCPA
- Universal opt-out mechanism required (browser signals)

### Connecticut CTDPA
- Effective July 1, 2023
- Similar to CCPA

### Utah UCPA
- Effective Dec 31, 2023
- Less stringent than CCPA

### Other States (15+ have laws)
- Texas, Oregon, Montana, Florida, etc.
- Patchwork of regulations; default to strictest (CCPA)

## 11. Industry-Specific Compliance

### Healthcare (HIPAA + State Laws)
- No PHI collection
- BAA required for healthcare clients
- Mental health, substance abuse have additional protections (42 CFR Part 2)

### Financial Services (GLBA, SOX, BSA)
- No financial account numbers
- Compliance with bank-specific regulations (Reg B, Reg E, etc.)
- OFAC sanctions screening

### Education (FERPA, COPPA)
- No student records
- COPPA for under-13 (don't knowingly collect)

### Children (COPPA)
- Don't knowingly collect data from under-13
- If collected by accident, delete immediately

### Government (FOIA, FISMA)
- Public records may be collectible
- But federal govt data has specific rules

## 12. International Data Transfers

### EU to US Transfers
After Schrems II invalidated Privacy Shield:
- **Standard Contractual Clauses (SCCs)** — Most common
- **Data Privacy Framework (DPF)** — New (2023) replacement for Privacy Shield
- **Binding Corporate Rules (BCRs)** — For intra-company
- **Derogations** — Article 49 (consent, contract performance, etc.)

### China to/from Other Countries
- **PIPL** (Personal Information Protection Law) — Effective Nov 2021
- Cross-border transfer requires:
  - Security assessment by CAC (for large orgs)
  - Standard contract (for smaller orgs)
  - Certification (alternative path)

### Russia
- Federal Law 152-FZ on Personal Data
- Localization requirement: Russian personal data must be stored in Russia

### Other Countries
- **Brazil LGPD** — Similar to GDPR
- **Canada PIPEDA** — Similar to GDPR
- **Australia Privacy Act** — Similar to GDPR
- **India DPDP Act 2023** — New, similar to GDPR
- **South Korea PIPA** — Strict, similar to GDPR
- **Japan APPI** — Similar to GDPR

## 13. LeadReach Compliance Implementation

### Data Collection Rules
- **Collect**: Work contact info, public professional info, company info, public content
- **Don't collect**: Personal email/phone, home address, health, religion, politics, financial accounts, biometric, genetic, children's data

### Data Storage
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS 1.3)
- Access controls (RBAC)
- Audit logs
- Retention: 24 months (then re-confirm or delete)

### Outreach Compliance
- **CAN-SPAM**: Physical address + unsubscribe link + accurate headers
- **GDPR**: Legitimate interest basis + opt-out + honor erasure requests
- **TCPA**: No auto-dialing mobile without consent; check DNC; 8am-9pm only
- **ePrivacy**: Cookie consent; B2B email under legitimate interest

### User Rights Handling
- **Right to know**: Privacy policy + on-demand data export
- **Right to access**: API endpoint for data subject access requests
- **Right to erasure**: Cascading delete across all systems (within 30 days)
- **Right to opt out**: One-click unsubscribe + suppression list

### Cross-Border Transfers
- SCCs in place for EU-US transfers
- DPF certification for LeadReach US entity
- Data localization options for Russia/China (if needed)

### Breach Response
- Detection: Automated monitoring
- Notification: Within 72 hours to supervisory authority
- User notification: "Without undue delay" if high risk
- Documentation: All breaches logged

### Audit & Documentation
- Privacy policy (always accessible)
- Records of processing activities (Article 30)
- Legitimate interest assessments (LIAs)
- Data protection impact assessments (DPIAs) for high-risk processing
- Vendor due diligence (sub-processors)
- Training records for all employees

## 14. Compliance Checklist for Each Outreach Campaign

Before launching any outreach:

### Data Source Compliance
- ✅ Data collected only from public/business sources
- ✅ No special category data (health, religion, politics)
- ✅ No children's data
- ✅ Source URLs recorded for every data point

### Recipient Compliance
- ✅ Prospect is B2B contact (not consumer)
- ✅ Prospect not on suppression list (unsubscribes, competitors)
- ✅ Prospect not on DNC registry (if calling)
- ✅ Prospect's country identified (for jurisdiction-specific rules)

### Email Compliance (CAN-SPAM + GDPR)
- ✅ Physical address in footer
- ✅ Working unsubscribe link
- ✅ Accurate From name and email
- ✅ Non-deceptive subject line
- ✅ Legitimate interest basis documented (if EU prospect)
- ✅ Opt-out mechanism clear

### Phone Compliance (TCPA)
- ✅ Not auto-dialing mobile (unless consent)
- ✅ DNC registry checked
- ✅ Calling 8am-9pm local time
- ✅ Identified caller and company
- ✅ Internal DNC list maintained

### Cross-Border Compliance
- ✅ SCCs in place (if transferring EU data to US)
- ✅ DPF certification valid
- ✅ Local law respected (PIPL, LGPD, etc.)

### Data Subject Rights
- ✅ Privacy policy accessible
- ✅ Erasure request process documented
- ✅ Data portability supported
- ✅ Opt-out honored within 10 business days

## 15. Common Compliance Mistakes

### Mistake 1: Collecting Personal Data
- ❌ Scraping LinkedIn for personal phone numbers
- ❌ Collecting home addresses from public records
- ❌ Storing health information found in news articles
- ✅ Only collect work contact info + public professional info

### Mistake 2: Ignoring Opt-Outs
- ❌ Continuing to email prospects who unsubscribed
- ❌ Slow opt-out processing (>10 business days)
- ❌ Opt-out only on one channel (email but not phone)
- ✅ Instant opt-out across all channels

### Mistake 3: Wrong Cross-Border Transfer
- ❌ Storing EU personal data on US servers without SCCs
- ❌ Sending EU personal data to non-DPF-certified US vendor
- ✅ SCCs + DPF + encryption in transit

### Mistake 4: Auto-Dialing Mobile
- ❌ Auto-dialing mobile numbers for cold calls
- ❌ Sending marketing SMS without prior express written consent
- ✅ Manual dialing OR prior express written consent

### Mistake 5: Vague Subject Lines
- ❌ "Important: Action Required" (when it's a sales email)
- ❌ "Re: Your Question" (when there was no prior email)
- ✅ Subject reflects actual content

### Mistake 6: No Physical Address
- ❌ Email footer with no physical address
- ❌ Using PO Box when company has physical office
- ✅ Valid physical postal address in every email footer

### Mistake 7: Collecting Special Category Data
- ❌ Recording executive's religion (from social media)
- ❌ Noting health conditions (from public records)
- ❌ Storing political opinions (from tweets)
- ✅ Strictly professional data only

## 16. Compliance by LeadReach Agent

### Atlas
- Classify intent respecting data minimization
- Don't extract personal data beyond what's needed for the intent

### Scout
- Search only public/professional sources
- Don't scrape personal/private accounts
- Cite every source URL

### Forge
- Don't enrich with personal data (home address, personal phone)
- Don't collect special category data even if publicly available
- Mark unverified fields as unverified, not as zero

### Sage
- Don't analyze special category data
- Don't make inferences about health, religion, politics
- Focus on professional/business intelligence

### Judge
- Don't score based on protected characteristics
- Apply same qualification criteria regardless of demographics
- Document any data quality issues

### Bard
- Never reference personal data (family, hobbies, health) in outreach
- Don't infer protected characteristics
- Always include CAN-SPAM/GDPR compliance elements
- Use professional tone; no harassment

### Flow
- Honor opt-outs within 10 business days (target: instant)
- Maintain suppression lists accurately
- Don't send to suppressed prospects (race conditions checked)
- Don't auto-dial mobile numbers without consent
- Respect calling hours (8am-9pm local)

### Echo
- Don't report on protected characteristics
- Aggregate data; don't expose individuals
- Anonymize reports when possible
- Comply with data subject access requests within 30 days
